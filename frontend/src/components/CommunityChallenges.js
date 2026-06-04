import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { safeFetch } from '../utils/errorHandler';

const CommunityChallenges = ({ 
  onAddToQuests, 
  onRemoveFromQuests,
  refreshTrigger,
  quests
 }) => {
  const { showToast } = useToast();
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
      const data = await safeFetch(
        `${process.env.REACT_APP_API_URL}/api/public-challenges`,
        {},
        showToast,
        false // No mostrar error automático
      );
      
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
      const saved = await safeFetch(
        `${process.env.REACT_APP_API_URL}/api/public-challenges`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            ...newChallenge,
            xpReward: parseInt(newChallenge.xpReward)
          })
        },
        showToast
      );
      
      setChallenges([saved, ...challenges]);
      setShowCreateForm(false);
      setNewChallenge({ title: '', description: '', xpReward: 100, difficulty: 'Media' });
      showToast('✅ Reto publicado con éxito', 'success');
      
    } catch (error) {
      console.debug('Error al crear reto');
    }
  };

  const acceptChallenge = async (challenge) => {
    if (!user) {
      showToast('Debes iniciar sesión para aceptar retos', 'warning');
      return;
    }
    
    try {
      const updatedChallenge = await safeFetch(
        `${process.env.REACT_APP_API_URL}/api/public-challenges/${challenge._id}/accept`,
        {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        },
        showToast
      );

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
      
      // Actualizar el estado local
      setChallenges(prev => prev.map(c => 
        c._id === challenge._id ? updatedChallenge : c
      ));
      showToast('✅ Reto aceptado con éxito', 'success');
      
    } catch (error) {
      console.debug('Error al aceptar reto');
    }
  };

  const isAccepted = (challenge) => {
    if (!user) return false;
    return quests?.some(q => q.fromChallenge === challenge._id);
  };

  const isCompleted = (challenge) => {
    return quests?.some(q => q.fromChallenge === challenge._id && q.completed === true);
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
            const completed = isCompleted(challenge);
            
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
                    completed ? (
                      <span className="text-blue-400 text-sm px-3 py-1 rounded-lg bg-blue-500/20">
                        ✅ Completado
                      </span>
                    ) : accepted ? (
                      <span className="text-green-400 text-sm px-3 py-1 rounded-lg bg-green-500/20">
                        ✓ Aceptado
                      </span>
                    ) : (
                      <button
                        onClick={() => acceptChallenge(challenge)}
                        className="btn-secondary text-sm px-3 py-1"
                      >
                        + Aceptar
                      </button>
                    )
                  ) : (
                    <button
                      onClick={() => showToast('Inicia sesión para aceptar retos', 'warning')}
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