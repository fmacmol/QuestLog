import { useSwipeable } from 'react-swipeable';
import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import AuthForms from './components/AuthForms';
import QuestCard from './components/QuestCard';
import CommunityChallenges from './components/CommunityChallenges';

function App() {
  const { user, token, logout, loading: authLoading } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [quests, setQuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [swipedQuestId, setSwipedQuestId] = useState(null);
  const [newQuest, setNewQuest] = useState({
    title: '',
    description: '',
    xpReward: 100,
    difficulty: 'Media'
  });
  const [editingQuest, setEditingQuest] = useState(null);
  const [filter, setFilter] = useState('all');

  // ===== FUNCIONES DE LOCALSTORAGE =====
  const saveAnonQuestsToLocal = (quests) => {
    localStorage.setItem('questlog_quests_anon', JSON.stringify(quests));
  };

  const loadAnonQuestsFromLocal = () => {
    const saved = localStorage.getItem('questlog_quests_anon');
    return saved ? JSON.parse(saved) : [];
  };

  const saveUserQuestsToLocal = (userId, quests) => {
    if (userId) {
      localStorage.setItem(`questlog_quests_${userId}`, JSON.stringify(quests));
    }
  };

  const loadUserQuestsFromLocal = (userId) => {
    if (!userId) return [];
    const saved = localStorage.getItem(`questlog_quests_${userId}`);
    return saved ? JSON.parse(saved) : [];
  };

  // ===== FETCH QUESTS =====
  const fetchQuests = async () => {
    try {
      setLoading(true);
      
      if (user && token) {
        console.log('👤 Usuario logueado, cargando de servidor...');
        const res = await fetch(`${process.env.REACT_APP_API_URL}/api/quests`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) throw new Error('Error al cargar del servidor');
        
        const data = await res.json();
        console.log('Quests del servidor:', data);
        setQuests(data);
        saveUserQuestsToLocal(user.id, data);
      } 
      else {
        console.log('Usuario anónimo, cargando de localStorage...');
        const anonQuests = loadAnonQuestsFromLocal();
        console.log('Quests anónimas:', anonQuests);
        setQuests(anonQuests);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      
      if (user && token) {
        const backup = loadUserQuestsFromLocal(user.id);
        setQuests(backup);
      } else {
        const anonQuests = loadAnonQuestsFromLocal();
        setQuests(anonQuests);
      }
      
      setLoading(false);
    }
  };

  // Esperar a que el contexto cargue antes de fetchQuests
  useEffect(() => {
    if (!authLoading && !isLoggingOut) {
      fetchQuests();
    }
  }, [user, token, authLoading, isLoggingOut]);

  // Efecto para manejar el logout
  useEffect(() => {
    if (isLoggingOut && !user && !token) {
      console.log('Logout completado, cargando anónimo...');
      const anonQuests = loadAnonQuestsFromLocal();
      setQuests(anonQuests);
      setIsLoggingOut(false);
    }
  }, [isLoggingOut, user, token]);

  // ===== HANDLE LOGOUT =====
  const handleLogout = () => {
    // NO guardar las quests actuales en anónimo (son del usuario)
    // Solo marcar logout y llamar a logout()
    setIsLoggingOut(true);
    logout();
  };

  // ===== HANDLE INPUT CHANGE =====
  const handleInputChange = (e) => {
    setNewQuest({
      ...newQuest,
      [e.target.name]: e.target.value
    });
  };

  // ===== CREATE QUEST =====
  const createQuest = async (e) => {
    e.preventDefault();
    if (!newQuest.title) return;

    if (user && token) {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL}/api/quests`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            title: newQuest.title,
            description: newQuest.description,
            xpReward: parseInt(newQuest.xpReward),
            difficulty: newQuest.difficulty
          })
        });

        if (!res.ok) throw new Error('Error al guardar en servidor');

        const savedQuest = await res.json();
        const newQuests = [savedQuest, ...quests];
        setQuests(newQuests);
        // NO guardar en anónimo aquí (el usuario está logueado)
        saveUserQuestsToLocal(user.id, newQuests); // Actualizar backup (opcional)
        
      } catch (error) {
        console.error('Error:', error);
        // Fallback: guardar localmente (como anónimo)
        const tempQuest = {
          _id: 'local_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
          ...newQuest,
          xpReward: parseInt(newQuest.xpReward),
          completed: false,
          createdAt: new Date().toISOString()
        };
        const newQuests = [tempQuest, ...quests];
        setQuests(newQuests);
        // Si falla el servidor, guarda en anónimo como respaldo
        saveAnonQuestsToLocal(newQuests);
      }
    } else {
      // Usuario anónimo: guardar solo en local
      const tempQuest = {
        _id: 'local_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        ...newQuest,
        xpReward: parseInt(newQuest.xpReward),
        completed: false,
        createdAt: new Date().toISOString()
      };
      const newQuests = [tempQuest, ...quests];
      setQuests(newQuests);
      saveAnonQuestsToLocal(newQuests);
    }

    setShowForm(false);
    setNewQuest({ title: '', description: '', xpReward: 100, difficulty: 'Media' });
    setEditingQuest(null);
  };

  // ===== UPDATE QUEST =====
  const updateQuest = async (e) => {
    e.preventDefault();
    if (!newQuest.title || !editingQuest) return;

    const updatedQuest = {
      ...editingQuest,
      title: newQuest.title,
      description: newQuest.description,
      xpReward: parseInt(newQuest.xpReward),
      difficulty: newQuest.difficulty
    };

    if (user && token && !editingQuest._id.startsWith('local_')) {
      try {
        await fetch(`${process.env.REACT_APP_API_URL}/api/quests/${editingQuest._id}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(updatedQuest)
        });
      } catch (error) {
        console.error('Error:', error);
      }
    }

    const newQuests = quests.map(q => q._id === editingQuest._id ? updatedQuest : q);
    setQuests(newQuests);
    
    // Guardar según el estado del usuario
    if (user && token) {
      saveUserQuestsToLocal(user.id, newQuests); // Usuario logueado
    } else {
      saveAnonQuestsToLocal(newQuests); // Usuario anónimo
    }
    
    setShowForm(false);
    setEditingQuest(null);
    setNewQuest({ title: '', description: '', xpReward: 100, difficulty: 'Media' });
  };

  // ===== TOGGLE QUEST =====
  const toggleQuest = async (quest) => {
    const updatedQuest = { ...quest, completed: !quest.completed };
    
    if (user && token && !quest._id.startsWith('local_')) {
      try {
        await fetch(`${process.env.REACT_APP_API_URL}/api/quests/${quest._id}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ completed: !quest.completed })
        });
      } catch (error) {
        console.error('Error:', error);
      }
    }
    
    const newQuests = quests.map(q => q._id === quest._id ? updatedQuest : q);
    setQuests(newQuests);
    
    // Guardar según el estado del usuario
    if (user && token) {
      saveUserQuestsToLocal(user.id, newQuests); // Usuario logueado
    } else {
      saveAnonQuestsToLocal(newQuests); // Usuario anónimo
    }
  };

  // ===== DELETE QUEST =====
  const deleteQuest = (id) => {
    const newQuests = quests.filter(q => q._id !== id);
    setQuests(newQuests);
    
    // Guardar según el estado del usuario
    if (user && token) {
      saveUserQuestsToLocal(user.id, newQuests); // Usuario logueado
      
    } else {
      saveAnonQuestsToLocal(newQuests); // Usuario anónimo
    }
  };
  
const addChallengeToQuests = (newQuest) => {
  const questToAdd = {
    _id: 'local_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
    ...newQuest,
    xpReward: parseInt(newQuest.xpReward),
    completed: false,
    createdAt: new Date().toISOString()
  };
  
  const updatedQuests = [questToAdd, ...quests];
  setQuests(updatedQuests);
  
  // Guardar según estado del usuario
  if (user && token) {
    // Si está logueado, también guardar en servidor
    fetch(`${process.env.REACT_APP_API_URL}/api/quests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(newQuest)
    }).catch(console.error);
    saveUserQuestsToLocal(user.id, updatedQuests);
  } else {
    saveAnonQuestsToLocal(updatedQuests);
  }
};

  // ===== LONG PRESS HANDLER =====
  const handleLongPress = (quest) => {
    setEditingQuest(quest);
    setNewQuest({
      title: quest.title,
      description: quest.description || '',
      xpReward: quest.xpReward,
      difficulty: quest.difficulty
    });
    setShowForm(true);
  };

  const getDifficultyColor = (difficulty) => {
    switch(difficulty) {
      case 'Fácil': return 'border-green-500 bg-green-500/10';
      case 'Media': return 'border-yellow-500 bg-yellow-500/10';
      case 'Difícil': return 'border-red-500 bg-red-500/10';
      default: return 'border-gray-500 bg-gray-500/10';
    }
  };

  // Calcular estadísticas
  const totalXP = quests.filter(q => q.completed).reduce((sum, q) => sum + (q.xpReward || 0), 0);
  const level = Math.floor(Math.sqrt(totalXP / 100)) + 1;
  const xpForNextLevel = (level * level * 100) - totalXP;
  const completedCount = quests.filter(q => q.completed).length;

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-rpg-dark flex items-center justify-center">
        <div className="text-rpg-gold text-2xl animate-pulse">Cargando misiones...</div>
      </div>
    );
  }

  const filteredQuests = quests.filter(quest => {
    if (filter === 'all') return true;
    if (filter === 'pending') return !quest.completed;
    if (filter === 'completed') return quest.completed;
    return true;
  });
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-rpg-dark to-rpg-purple">
      <header className="bg-rpg-dark/90 border-b-4 border-rpg-gold p-6 shadow-2xl">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="font-rpg text-5xl text-rpg-gold drop-shadow-lg">
              ⚔️ QuestLog
            </h1>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => {
                  setShowForm(!showForm);
                  setEditingQuest(null);
                  setNewQuest({ title: '', description: '', xpReward: 100, difficulty: 'Media' });
                }}
                className="btn-primary text-xl"
              >
                {showForm ? '✕ Cerrar' : '+ Nueva Misión'}
              </button>
              
              {user ? (
                <div className="flex items-center gap-4">
                  <span className="text-rpg-gold">⚔️ {user.username}</span>
                  <button
                    onClick={handleLogout}
                    className="bg-red-500/20 hover:bg-red-500/40 text-red-500 px-4 py-2 rounded-lg"
                  >
                    Salir
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowAuth(true)}
                  className="bg-rpg-gold/20 hover:bg-rpg-gold/40 text-rpg-gold px-4 py-2 rounded-lg"
                >
                  Iniciar Sesión
                </button>
              )}
            </div>
          </div>

          {showAuth && <AuthForms onClose={() => setShowAuth(false)} />}

          {/* Barra de progreso */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="bg-rpg-card/50 p-4 rounded-lg border border-rpg-gold/30">
              <span className="text-rpg-gold block text-2xl font-bold">{level}</span>
              <span className="text-gray-400 text-sm">Nivel</span>
            </div>
            <div className="bg-rpg-card/50 p-4 rounded-lg border border-rpg-gold/30">
              <span className="text-rpg-gold block text-2xl font-bold">{totalXP} XP</span>
              <span className="text-gray-400 text-sm">Experiencia total</span>
            </div>
            <div className="bg-rpg-card/50 p-4 rounded-lg border border-rpg-gold/30">
              <span className="text-rpg-gold block text-2xl font-bold">{completedCount}</span>
              <span className="text-gray-400 text-sm">Misiones completadas</span>
            </div>
          </div>

          <div className="mt-4 bg-rpg-card rounded-full h-4 overflow-hidden border border-rpg-gold/30">
            <div 
              className="bg-gradient-to-r from-rpg-gold to-yellow-500 h-full transition-all duration-500"
              style={{ width: `${xpForNextLevel > 0 ? (totalXP % (level * level * 100)) / (level * level * 100) * 100 : 100}%` }}
            />
          </div>
          <p className="text-right text-sm text-gray-400 mt-1">
            {totalXP % (level * level * 100)} / {level * level * 100} XP para nivel {level + 1}
          </p>
        </div>

        {/* Filtros */}
        <div className="flex justify-center gap-4 mt-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-6 py-2 rounded-lg font-bold transition-all duration-200 ${
              filter === 'all' 
                ? 'bg-rpg-gold text-rpg-dark' 
                : 'bg-rpg-card/50 text-gray-400 hover:bg-rpg-card'
            }`}
          >
            📋 Todas
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-6 py-2 rounded-lg font-bold transition-all duration-200 ${
              filter === 'pending' 
                ? 'bg-yellow-500 text-rpg-dark' 
                : 'bg-rpg-card/50 text-gray-400 hover:bg-rpg-card'
            }`}
          >
            ⏳ Pendientes
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-6 py-2 rounded-lg font-bold transition-all duration-200 ${
              filter === 'completed' 
                ? 'bg-green-500 text-rpg-dark' 
                : 'bg-rpg-card/50 text-gray-400 hover:bg-rpg-card'
            }`}
          >
            ✅ Completadas
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6">
        {
        /* Sección de retos comunitarios */}
        <div className="mb-8">
          <CommunityChallenges onAddToQuests={addChallengeToQuests} />
        </div>
        
        {showForm && (
          <form onSubmit={editingQuest ? updateQuest : createQuest} className="quest-card mb-8">
            <h2 className="text-2xl font-rpg text-rpg-gold mb-4">
              {editingQuest ? '📝 Editar Misión' : '📜 Nueva Misión'}
            </h2>
            <div className="grid gap-4">
              <input
                type="text"
                name="title"
                value={newQuest.title}
                onChange={handleInputChange}
                placeholder="Título de la misión"
                className="w-full p-3 bg-rpg-dark/50 border border-rpg-gold/30 rounded-lg text-white"
                required
              />
              <textarea
                name="description"
                value={newQuest.description}
                onChange={handleInputChange}
                placeholder="Descripción (opcional)"
                className="w-full p-3 bg-rpg-dark/50 border border-rpg-gold/30 rounded-lg text-white"
                rows="2"
              />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">XP</label>
                  <input
                    type="number"
                    name="xpReward"
                    value={newQuest.xpReward}
                    onChange={handleInputChange}
                    min="10"
                    max="1000"
                    className="w-full p-3 bg-rpg-dark/50 border border-rpg-gold/30 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Dificultad</label>
                  <select
                    name="difficulty"
                    value={newQuest.difficulty}
                    onChange={handleInputChange}
                    className="w-full p-3 bg-rpg-dark/50 border border-rpg-gold/30 rounded-lg text-white"
                  >
                    <option value="Fácil">Fácil</option>
                    <option value="Media">Media</option>
                    <option value="Difícil">Difícil</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="btn-primary mt-2">
                {editingQuest ? '💾 Guardar Cambios' : '✨ Crear Misión'}
              </button>
            </div>
          </form>
        )}

        <div className="space-y-4">
          {filteredQuests.length === 0 ? (
            <div className="text-center py-12 quest-card">
              <p className="text-2xl text-rpg-gold mb-4">
                {filter === 'all' && '📭 No hay misiones'}
                {filter === 'pending' && '⏳ No hay misiones pendientes'}
                {filter === 'completed' && '✅ No hay misiones completadas'}
              </p>
              <p className="text-gray-400">
                {filter === 'all' && '¡Crea tu primera misión!'}
                {filter === 'pending' && '¡Todas completadas! 🎉'}
                {filter === 'completed' && '¡Completa alguna!'}
              </p>
            </div>
          ) : (
            filteredQuests.map(quest => (
              <QuestCard
                key={quest._id}
                quest={quest}
                onToggle={toggleQuest}
                onDelete={deleteQuest}
                onLongPress={handleLongPress}
                getDifficultyColor={getDifficultyColor}
              />
            ))
          )}
        </div>
      </main>
    </div>
  );
}

export default App;