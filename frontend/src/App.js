//import { useSwipeable } from 'react-swipeable';
import React, { useState, useEffect } from 'react';
import MenuDrawer from './components/MenuDrawer';
import { useAuth } from './context/AuthContext';
import AuthForms from './components/AuthForms';
import QuestCard from './components/QuestCard';
import CommunityChallenges from './components/CommunityChallenges';
import useLevelUp from './hooks/useLevelUp';
import SettingsModal from './modals/SettingsModal';
import { useToast } from './context/ToastContext';
import { safeFetch } from './utils/errorHandler';
import StatsModal from './modals/StatsModal';

function App() {
  const { user, token, loading: authLoading, logout } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [quests, setQuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showForm, setShowForm] = useState(false);
  //const [swipedQuestId, setSwipedQuestId] = useState(null);
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
  const [refreshChallenges, setRefreshChallenges] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const { showToast } = useToast();

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

  // ===== SINCRONIZAR MISIONES OFFLINE =====
  const syncOfflineQuests = async () => {
    // 1. Cargamos lo que hay en local
    const localQuests = loadUserQuestsFromLocal(user.id);
    
    // 2. Filtramos solo las que creamos sin conexión (las que empiezan por 'local_')
    const offlineQuests = localQuests.filter(q => q._id && q._id.startsWith('local_'));

    if (offlineQuests.length === 0) return; // Si no hay nada que sincronizar, salimos

    showToast('🔄 Sincronizando datos guardados sin conexión...', 'info');

    // 3. Subimos cada misión offline a la base de datos
    for (const quest of offlineQuests) {
      const questData = {
        title: quest.title,
        description: quest.description,
        xpReward: quest.xpReward,
        difficulty: quest.difficulty,
        isMultiRequirement: quest.isMultiRequirement || false,
        subtasks: quest.subtasks || [],
        fromChallenge: quest.fromChallenge
      };

      try {
        await safeFetch(
          `${process.env.REACT_APP_API_URL}/api/quests`,
          {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify(questData)
          }
        );
      } catch (error) {
        console.error(`Error al sincronizar la misión: ${quest.title}`, error);
      }
    }
  };

  // ===== FETCH QUESTS =====
  const fetchQuests = async () => {
    try {
      setLoading(true);
      
      if (user && token) {
        
        // 👇 1. PRIMERO SINCRONIZAMOS LOS DATOS OFFLINE AL SERVIDOR 👇
        await syncOfflineQuests();
        
        // 2. LUEGO DESCARGAMOS LA VERSIÓN ACTUALIZADA
        const data = await safeFetch(
          `${process.env.REACT_APP_API_URL}/api/quests`,
          { headers: { 'Authorization': `Bearer ${token}` } },
          null 
        ).catch(async (error) => {
          showToast('Usando copia local de seguridad', 'warning');
          const backup = loadUserQuestsFromLocal(user.id);
          setQuests(backup);
          return null; // Quitamos el saveUserQuestsToLocal de aquí para no sobrescribir en vano
        });
        
        if (data) {
          setQuests(data);
          // 3. Ahora sí, actualizamos el local con los IDs reales de Mongo
          saveUserQuestsToLocal(user.id, data);
        }
      } 
      else {
        const anonQuests = loadAnonQuestsFromLocal();
        setQuests(anonQuests);
      }
      
      setLoading(false);
    } catch (error) {
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
      showToast('Sesión cerrada con éxito', 'success');
      const anonQuests = loadAnonQuestsFromLocal();
      setQuests(anonQuests);
      setIsLoggingOut(false);
    }
  }, [isLoggingOut, user, token]);

  // ===== HANDLE LOGOUT =====
  const handleLogout = () => {
    // Guardar las quests del usuario actual en su propio localStorage (antes de borrar sesión)
    if (user && token) {
      saveUserQuestsToLocal(user.id, quests);
    }
    // Marcar que estamos cerrando sesión
    setIsLoggingOut(true);
    // Llamar al logout del contexto (limpia user, token y localStorage de auth)
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
        const savedQuest = await safeFetch(
          `${process.env.REACT_APP_API_URL}/api/quests`,
          {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify(questData)
          },
          showToast
        );
        
        const newQuests = [savedQuest, ...quests];
        setQuests(newQuests);
        saveUserQuestsToLocal(user.id, newQuests);
        showToast('Misión creada con éxito', 'success');
        
      } catch (error) {
        // Fallback: guardar localmente
        const tempQuest = {
          _id: 'local_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
          ...questData,
          completed: false,
          createdAt: new Date().toISOString()
        };
        const newQuests = [tempQuest, ...quests];
        setQuests(newQuests);
        saveUserQuestsToLocal(user.id, newQuests);
        showToast('Misión guardada localmente (sin conexión)', 'warning');
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
      showToast('Misión creada', 'success');
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

    // Actualizar en servidor (si aplica)
    if (user && token && !editingQuest._id.startsWith('local_')) {
      try {
        await safeFetch(
          `${process.env.REACT_APP_API_URL}/api/quests/${editingQuest._id}`,
          {
            method: 'PUT',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify(updatedQuest)
          },
          showToast
        );
        showToast('Misión actualizada con éxito', 'success');
      } catch (error) {
        showToast('Cambios guardados solo localmente', 'warning');
      }
    }

    // Actualizar estado local
    const newQuests = quests.map(q => 
      q._id === editingQuest._id ? updatedQuest : q
    );
    setQuests(newQuests);

    // Guardar en localStorage
    if (user && token) {
      saveUserQuestsToLocal(user.id, newQuests);
    } else {
      saveAnonQuestsToLocal(newQuests);
    }

    // RESETEAR TODO Y CERRAR
    setShowForm(false);
    setEditingQuest(null);
    setNewQuest({ title: '', description: '', xpReward: 100, difficulty: 'Media' });
    setIsMultiRequirement(false);
    setSubtasks([]);
    setNewSubtaskText('');
  };

  // ===== TOGGLE QUEST =====
  const toggleQuest = async (quest) => {
    let updatedQuest;
    
    if (quest.isMultiRequirement && quest.subtasks) {
      const allSubtasksCompleted = quest.subtasks.every(st => st.completed === true);
      updatedQuest = {
        ...quest,
        completed: allSubtasksCompleted
      };
    } else {
      updatedQuest = { ...quest, completed: !quest.completed };
    }
    
    // Si no hay cambios, salir
    if (JSON.stringify(quest) === JSON.stringify(updatedQuest)) return;
    
    // Actualizar en servidor (si aplica)
    if (user && token && !quest._id.startsWith('local_')) {
      try {
        await safeFetch(
          `${process.env.REACT_APP_API_URL}/api/quests/${quest._id}`,
          {
            method: 'PUT',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify(updatedQuest)
          },
          null
        );
      } catch (error) {
        console.debug('Error al sincronizar:', error.message);
      }
    }
    
    // Actualizar estado local
    const newQuests = quests.map(q => {
      if (q._id === quest._id) {
        return updatedQuest;
      }
      return q;
    });
    
    setQuests(newQuests);
    setRefreshChallenges(prev => !prev);
    
    // Guardar en localStorage
    if (user && token) {
      saveUserQuestsToLocal(user.id, newQuests);
    } else {
      saveAnonQuestsToLocal(newQuests);
    }
  };

  // ===== DELETE QUEST =====
  const deleteQuest = async (id) => {
    const questToDelete = quests.find(q => q._id === id);
    const errors = [];
    let isChallenge = false;
    
    // 1. Si la quest viene de un reto público, notificar al backend
    if (questToDelete?.fromChallenge && user && token) {
      try {
        await safeFetch(
          `${process.env.REACT_APP_API_URL}/api/public-challenges/${questToDelete.fromChallenge}/cancel`,
          { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } },
          null
        );
        isChallenge = true;
      } catch (error) {
        errors.push('Error al cancelar el reto');
      }
    }
    
    // 2. Si el usuario está logueado y no es una quest local, eliminar del servidor
    if (user && token && !questToDelete?._id?.startsWith('local_')) {
      try {
        await safeFetch(
          `${process.env.REACT_APP_API_URL}/api/quests/${id}`,
          { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } },
          null
        );
      } catch (error) {
        errors.push('Error al eliminar la misión del servidor');
      }
    }
    
    // 3. Si hay errores, mostrarlos y NO continuar
    if (errors.length > 0) {
      const errorMessage = errors.join('\n');
      showToast(errorMessage, 'error', 5000);
      return;
    }
    
    // 4. Eliminar localmente (solo si todo OK)
    const newQuests = quests.filter(q => q._id !== id);
    setQuests(newQuests);
    
    // 5. Guardar en localStorage
    if (user && token) {
      saveUserQuestsToLocal(user.id, newQuests);
    } else {
      saveAnonQuestsToLocal(newQuests);
    }
    
    // 6. Un solo mensaje de éxito
    if (isChallenge) {
      showToast(`Reto "${questToDelete.title}" eliminado`, 'success');
    } else {
      showToast(`Misión "${questToDelete.title}" eliminada`, 'success');
    }
  };
  
  const addChallengeToQuests = async (newQuest, challengeId) => {
    const questToAdd = {
      _id: 'local_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      ...newQuest,
      fromChallenge: challengeId,
      completed: false,
      createdAt: new Date().toISOString()
    };
    
    if (user && token) {
      try {
        const questToSave = {
          title: newQuest.title,
          description: newQuest.description,
          xpReward: newQuest.xpReward,
          difficulty: newQuest.difficulty,
          isMultiRequirement: newQuest.isMultiRequirement || false,
          subtasks: newQuest.subtasks || [],
          fromChallenge: challengeId
        };
        
        const savedQuest = await safeFetch(
          `${process.env.REACT_APP_API_URL}/api/quests`,
          {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify(questToSave)
          },
          showToast
        );
        
        const updatedQuests = [savedQuest, ...quests];
        setQuests(updatedQuests);
        saveUserQuestsToLocal(user.id, updatedQuests);
        showToast('✅ Reto aceptado con éxito', 'success');
        
      } catch (error) {
        // Fallback local
        const updatedQuests = [questToAdd, ...quests];
        setQuests(updatedQuests);
        saveUserQuestsToLocal(user.id, updatedQuests);
        showToast('Reto guardado localmente (sin conexión)', 'warning');
      }
    } else {
      const updatedQuests = [questToAdd, ...quests];
      setQuests(updatedQuests);
      saveAnonQuestsToLocal(updatedQuests);
      showToast('✅ Reto aceptado (modo local)', 'success');
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
  /*const handleLongPress = (quest) => {
    setEditingQuest(quest);
    setNewQuest({
      title: quest.title,
      description: quest.description || '',
      xpReward: quest.xpReward,
      difficulty: quest.difficulty
    });
    setShowForm(true);
  };*/

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

  // Calcular IDs de retos aceptados y completados (para el componente CommunityChallenges)
  /*const acceptedChallengeIds = quests
    .filter(q => q.fromChallenge)
    .map(q => q.fromChallenge);*/

  /*const completedChallengeIds = quests
    .filter(q => q.fromChallenge && q.completed === true)
    .map(q => q.fromChallenge);*/
  
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
                onOpenSettings={() => setShowSettings(true)}
                onOpenStats={() => setShowStats(true)}
                onLogout={handleLogout}
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
            refreshTrigger={refreshChallenges}
            quests={quests}
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
                  setIsMultiRequirement(quest.isMultiRequirement || false);
                  setSubtasks(quest.subtasks || []);
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
      {showSettings && (
        <SettingsModal 
          onClose={() => setShowSettings(false)} 
        />
      )}
      {showStats && (
        <StatsModal 
          onClose={() => setShowStats(false)} 
          quests={quests}
        />
      )}
    </div>
  );
}

export default App;