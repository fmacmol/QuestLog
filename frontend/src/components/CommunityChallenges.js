import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const CommunityChallenges = ({ 
  onAddToQuests, 
  onRemoveFromQuests,
  refreshTrigger,
  quests
 }) => {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newChallenge, setNewChallenge] = useState({
    title: '',
    description: '',
    xpReward: 100,
    difficulty: 'Media'
  });
  const { user, token } = useAuth();

  useEffect(() => {
    fetchChallenges();
  }, [refreshTrigger]);

  const fetchChallenges = async () => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/public-challenges`);
      const data = await res.json();
      
      // Asegurar que acceptedBy existe y tiene el formato correcto
      const challengesWithAcceptance = data.map(challenge => ({
        ...challenge,
        acceptedBy: challenge.acceptedBy || []
      }));
      
      setChallenges(challengesWithAcceptance);
      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      setLoading(false);
    }
  };

  const createChallenge = async (e) => {
    e.preventDefault();
    if (!newChallenge.title) return;

    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/public-challenges`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...newChallenge,
          xpReward: parseInt(newChallenge.xpReward)
        })
      });

      if (res.ok) {
        const saved = await res.json();
        setChallenges([saved, ...challenges]);
        setShowCreateForm(false);
        setNewChallenge({ title: '', description: '', xpReward: 100, difficulty: 'Media' });
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const acceptChallenge = async (challenge) => {
    if (!user) {
      alert('Debes iniciar sesión para aceptar retos');
      return;
    }
    
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/public-challenges/${challenge._id}/accept`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        const error = await res.json();
        alert(error.error || 'Error al aceptar reto');
        return;
      }

      // Obtener el reto actualizado del backend
      const updatedChallengeFromBackend = await res.json();

      // Crear copia en quests del usuario
      const newQuest = {
        title: challenge.title,
        description: challenge.description,
        xpReward: challenge.xpReward,
        difficulty: challenge.difficulty,
        completed: false,
        createdAt: new Date().toISOString(),
        fromChallenge: challenge._id
      };
      
      onAddToQuests(newQuest, challenge._id);
      
      // Actualizar el estado local CON EL RETO DEVUELTO POR EL BACKEND
      setChallenges(prev => prev.map(c => 
        c._id === challenge._id ? updatedChallengeFromBackend : c
      ));
      
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const cancelChallenge = async (challenge) => {
    if (!window.confirm(`¿Cancelar el reto "${challenge.title}"? Se eliminará de tus misiones.`)) {
      return;
    }

    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/public-challenges/${challenge._id}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        const error = await res.json();
        alert(error.error || 'Error al cancelar reto');
        return;
      }

      // Eliminar la copia de las quests del usuario
      onRemoveFromQuests(challenge._id);
      
      // Actualizar estado local
      setChallenges(prev => prev.map(c => 
        c._id === challenge._id 
          ? { ...c, acceptedBy: (c.acceptedBy || []).filter(u => u._id !== user.id) }
          : c
      ));
      
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const isAccepted = (challenge) => {
    if (!user) return false;
    // Verificar si existe una quest copia (sin importar si está completada)
    const hasQuestCopy = quests?.some(q => q.fromChallenge === challenge._id);
    return hasQuestCopy;
  };

  const isCompleted = (challenge) => {
    // Verificar directamente en las quests si hay una copia completada
    const hasCompletedQuest = quests?.some(q => 
      q.fromChallenge === challenge._id && q.completed === true
    );
    console.log(`🔍 Reto ${challenge.title}: hasCompletedQuest = ${hasCompletedQuest}`);
    return hasCompletedQuest;
  };

  if (loading) return <div className="text-center py-8">Cargando retos...</div>;

  return (
    <div className="bg-rpg-card rounded-xl border border-rpg-gold/30 p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-rpg text-rpg-gold">🌍 Retos de la Comunidad</h2>
        {user?.isAdmin && (
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="btn-secondary"
          >
            {showCreateForm ? '✕ Cancelar' : '+ Crear Reto'}
          </button>
        )}
      </div>

      {showCreateForm && user?.isAdmin && (
        <form onSubmit={createChallenge} className="mb-6 p-4 bg-rpg-dark/50 rounded-lg">
          <h3 className="text-lg font-bold text-rpg-gold mb-3">📜 Nuevo Reto</h3>
          <div className="grid gap-3">
            <input
              type="text"
              name="title"
              value={newChallenge.title}
              onChange={(e) => setNewChallenge({ ...newChallenge, title: e.target.value })}
              placeholder="Título del reto"
              className="p-2 bg-rpg-dark/50 border border-rpg-gold/30 rounded text-white"
              required
            />
            <textarea
              name="description"
              value={newChallenge.description}
              onChange={(e) => setNewChallenge({ ...newChallenge, description: e.target.value })}
              placeholder="Descripción"
              className="p-2 bg-rpg-dark/50 border border-rpg-gold/30 rounded text-white"
              rows="2"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                name="xpReward"
                value={newChallenge.xpReward}
                onChange={(e) => setNewChallenge({ ...newChallenge, xpReward: e.target.value })}
                placeholder="XP"
                className="p-2 bg-rpg-dark/50 border border-rpg-gold/30 rounded text-white"
              />
              <select
                name="difficulty"
                value={newChallenge.difficulty}
                onChange={(e) => setNewChallenge({ ...newChallenge, difficulty: e.target.value })}
                className="p-2 bg-rpg-dark/50 border border-rpg-gold/30 rounded text-white"
              >
                <option value="Fácil">Fácil</option>
                <option value="Media">Media</option>
                <option value="Difícil">Difícil</option>
              </select>
            </div>
            <button type="submit" className="btn-primary py-2">Publicar Reto</button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {challenges.length === 0 ? (
          <p className="text-center text-gray-400">No hay retos activos. ¡Vuelve pronto!</p>
        ) : (
          challenges.map(challenge => {
            const accepted = isAccepted(challenge);
            return (
              <div key={challenge._id} className="border border-rpg-gold/30 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-rpg-gold">{challenge.title}</h3>
                    {challenge.description && (
                      <p className="text-gray-300 text-sm mt-1">{challenge.description}</p>
                    )}
                    <div className="flex gap-3 mt-2 text-sm">
                      <span className="text-rpg-gold">✨ {challenge.xpReward} XP</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        challenge.difficulty === 'Fácil' ? 'bg-green-500/20 text-green-400' :
                        challenge.difficulty === 'Media' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {challenge.difficulty}
                      </span>
                      <span className="text-gray-500 text-xs">👤 {challenge.createdBy?.username || 'Admin'}</span>
                    </div>
                  </div>
                  
                  {user ? (
                    (() => {
                      const completed = isCompleted(challenge);
                      const accepted = isAccepted(challenge);
                      
                      if (completed) {
                        return (
                          <span className="text-blue-400 text-sm px-3 py-1 rounded-lg bg-blue-500/20">
                            ✅ Completado
                          </span>
                        );
                      } else if (accepted) {
                        return (
                          <span className="text-green-400 text-sm px-3 py-1 rounded-lg bg-green-500/20">
                            ✓ Aceptado
                          </span>
                        );
                      } else {
                        return (
                          <button
                            onClick={() => acceptChallenge(challenge)}
                            className="btn-secondary text-sm px-3 py-1"
                          >
                            + Aceptar
                          </button>
                        );
                      }
                    })()
                  ) : (
                    <button
                      onClick={() => alert('Inicia sesión para aceptar retos')}
                      className="btn-secondary text-sm px-3 py-1 opacity-50"
                    >
                      Inicia sesión
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default CommunityChallenges;