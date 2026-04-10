import { useSwipeable } from 'react-swipeable';
import React, { useState, useEffect } from 'react';
import MenuDrawer from './components/MenuDrawer';
import { useAuth } from './context/AuthContext';
import AuthForms from './components/AuthForms';
import QuestCard from './components/QuestCard';
import CommunityChallenges from './components/CommunityChallenges';
import useLevelUp from './hooks/useLevelUp';

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
  const [isMultiRequirement, setIsMultiRequirement] = useState(false);
  const [subtasks, setSubtasks] = useState([]);
  const [newSubtaskText, setNewSubtaskText] = useState('');
  const [editingQuest, setEditingQuest] = useState(null);
  const [filter, setFilter] = useState('all');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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

    const questData = {
      title: newQuest.title,
      description: newQuest.description,
      xpReward: parseInt(newQuest.xpReward),
      difficulty: newQuest.difficulty,
      isMultiRequirement: isMultiRequirement,
      subtasks: isMultiRequirement ? subtasks : []
    };

    if (user && token) {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL}/api/quests`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(questData)
        });

        if (!res.ok) throw new Error('Error al guardar en servidor');

        const savedQuest = await res.json();
        const newQuests = [savedQuest, ...quests];
        setQuests(newQuests);
        saveUserQuestsToLocal(user.id, newQuests);
        
      } catch (error) {
        console.error('Error al guardar en servidor:', error);
        // Fallback: guardar localmente
        const tempQuest = {
          _id: 'local_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
          ...questData,
          completed: false,
          createdAt: new Date().toISOString()
        };
        const newQuests = [tempQuest, ...quests];
        setQuests(newQuests);
        saveAnonQuestsToLocal(newQuests);
      }
    } else {
      // Modo anónimo
      const tempQuest = {
        _id: 'local_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        ...questData,
        completed: false,
        createdAt: new Date().toISOString()
      };
      const newQuests = [tempQuest, ...quests];
      setQuests(newQuests);
      saveAnonQuestsToLocal(newQuests);
    }

    // Resetear formulario
    setShowForm(false);
    setNewQuest({ title: '', description: '', xpReward: 100, difficulty: 'Media' });
    setIsMultiRequirement(false);
    setSubtasks([]);
    setNewSubtaskText('');
    setEditingQuest(null);
  };

  // Añadir subtarea
  const addSubtask = () => {
    if (!newSubtaskText.trim()) return;
    setSubtasks([...subtasks, { text: newSubtaskText, completed: false }]);
    setNewSubtaskText('');
  };

  // Eliminar subtarea
  const removeSubtask = (index) => {
    setSubtasks(subtasks.filter((_, i) => i !== index));
  };

  // Toggle subtarea
  const toggleSubtask = (index) => {
    const newSubtasks = [...subtasks];
    newSubtasks[index].completed = !newSubtasks[index].completed;
    setSubtasks(newSubtasks);
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
      difficulty: newQuest.difficulty,
      isMultiRequirement: isMultiRequirement,
      subtasks: isMultiRequirement ? subtasks : []
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
        console.error('Error al actualizar en servidor:', error);
      }
    }

    const newQuests = quests.map(q => q._id === editingQuest._id ? updatedQuest : q);
    setQuests(newQuests);
    
    if (user && token) {
      saveUserQuestsToLocal(user.id, newQuests);
    } else {
      saveAnonQuestsToLocal(newQuests);
    }
    
    // ===== RESETEAR COMPLETAMENTE EL FORMULARIO =====
    setShowForm(false);           // Cerrar formulario
    setEditingQuest(null);        // Limpiar edición
    setNewQuest({ title: '', description: '', xpReward: 100, difficulty: 'Media' });
    setIsMultiRequirement(false); // Resetear checkbox
    setSubtasks([]);              // Vaciar subtareas
    setNewSubtaskText('');        // Vaciar input de subtarea
  };

  // ===== TOGGLE QUEST =====
  const toggleQuest = async (quest) => {
    console.log('📝 toggleQuest recibió:', quest);
    
    let updatedQuest;
    
    if (quest.isMultiRequirement && quest.subtasks) {
      const allSubtasksCompleted = quest.subtasks.every(st => st.completed === true);
      console.log('📊 Subtareas completadas:', allSubtasksCompleted);
      
      updatedQuest = {
        ...quest,
        completed: allSubtasksCompleted
      };
    } else {
      updatedQuest = { ...quest, completed: !quest.completed };
    }
    
    console.log('✅ updatedQuest:', updatedQuest);
    
    // Si no hay cambios, salir
    if (JSON.stringify(quest) === JSON.stringify(updatedQuest)) return;
    
    // Actualizar en servidor (si aplica)
    if (user && token && !quest._id.startsWith('local_')) {
      try {
        await fetch(`${process.env.REACT_APP_API_URL}/api/quests/${quest._id}`, {
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
    
    // Actualizar estado local - CREAR NUEVO ARRAY
    const newQuests = quests.map(q => {
      if (q._id === quest._id) {
        return updatedQuest;
      }
      return q;
    });
    
    setQuests(newQuests);
    
    // Guardar en localStorage
    if (user && token) {
      saveUserQuestsToLocal(user.id, newQuests);
    } else {
      saveAnonQuestsToLocal(newQuests);
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
  
const addChallengeToQuests = (newQuest, challengeId) => {
  const questToAdd = {
    _id: 'local_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
    ...newQuest,
    fromChallenge: challengeId,  // Guardamos qué reto original lo creó
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

// Eliminar copia de reto cancelado
const removeChallengeFromQuests = (challengeId) => {
  const updatedQuests = quests.filter(q => q.fromChallenge !== challengeId);
  setQuests(updatedQuests);
  
  if (user && token) {
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
  const [previousLevel, setPreviousLevel] = useState(level);
  const xpForNextLevel = (level * level * 100) - totalXP;
  const completedCount = quests.filter(q => q.completed).length;

  // Detectar subida de nivel
  useLevelUp(level, previousLevel, user?.id || 'anon');

  // Actualizar nivel anterior cuando cambie
  useEffect(() => {
    setPreviousLevel(level);
  }, [level]);

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
              <MenuDrawer 
                onOpenAuth={() => setShowAuth(true)} 
                onMenuStateChange={setIsMenuOpen}
              />
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
          <CommunityChallenges 
            onAddToQuests={addChallengeToQuests} 
            onRemoveFromQuests={removeChallengeFromQuests}  
          />
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
                <div className="mb-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isMultiRequirement}
                      onChange={(e) => {
                        setIsMultiRequirement(e.target.checked);
                        if (!e.target.checked) setSubtasks([]);
                      }}
                      className="w-5 h-5 rounded border-rpg-gold/30 text-rpg-gold focus:ring-rpg-gold"
                    />
                    <span className="text-gray-300">Esta misión tiene requisitos (subtareas)</span>
                  </label>
                </div>

                {isMultiRequirement && (
                  <div className="bg-rpg-dark/30 p-4 rounded-lg">
                    <label className="block text-sm text-gray-400 mb-2">Lista de requisitos:</label>
                    <div className="space-y-2 mb-3">
                      {subtasks.map((subtask, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={subtask.completed}
                            onChange={() => toggleSubtask(idx)}
                            className="w-4 h-4 rounded border-rpg-gold/30"
                          />
                          <span className={`flex-1 text-gray-300 ${subtask.completed ? 'line-through text-gray-500' : ''}`}>
                            {subtask.text}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeSubtask(idx)}
                            className="text-red-400 hover:text-red-500"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newSubtaskText}
                        onChange={(e) => setNewSubtaskText(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addSubtask()}
                        placeholder="Nuevo requisito..."
                        className="flex-1 p-2 bg-rpg-dark/50 border border-rpg-gold/30 rounded text-white text-sm"
                      />
                      <button
                        type="button"
                        onClick={addSubtask}
                        className="btn-secondary text-sm px-3 py-1"
                      >
                        + Añadir
                      </button>
                    </div>
                  </div>
                )}
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
                onEdit={(quest) => {
                  setEditingQuest(quest);
                  setNewQuest({
                    title: quest.title,
                    description: quest.description || '',
                    xpReward: quest.xpReward,
                    difficulty: quest.difficulty
                  });
                  setShowForm(true);
                }}
                getDifficultyColor={getDifficultyColor}
              />
            ))
          )}
        </div>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingQuest(null);
            setNewQuest({ title: '', description: '', xpReward: 100, difficulty: 'Media' });
          }}
          className={`fixed bottom-8 z-50 bg-rpg-gold hover:bg-yellow-500 text-rpg-dark w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110
            left-1/2 -translate-x-1/2 md:left-auto md:right-8 md:translate-x-0
            ${isMenuOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        >
          {showForm ? (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          )}
        </button>
      </main>
    </div>
  );
}

export default App;