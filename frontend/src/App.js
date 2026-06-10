//import { useSwipeable } from 'react-swipeable';
import React, { useState, useEffect } from 'react';
import MenuDrawer from './components/MenuDrawer';
import { useAuth } from './context/AuthContext';
import AuthForms from './components/AuthForms';
import QuestCard from './components/QuestCard';
import useLevelUp from './hooks/useLevelUp';
import SettingsModal from './modals/SettingsModal';
import { useToast } from './context/ToastContext';
import { safeFetch } from './utils/errorHandler';
import StatsModal from './modals/StatsModal';
import PetSection from './sections/PetSection';

function App() {
  const { user, token, loading: authLoading, logout, updateUser } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [quests, setQuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [newQuest, setNewQuest] = useState({
    title: '',
    description: '',
    difficulty: 'Media'
  });
  const [isMultiRequirement, setIsMultiRequirement] = useState(false);
  const [subtasks, setSubtasks] = useState([]);
  const [newSubtaskText, setNewSubtaskText] = useState('');
  const [editingQuest, setEditingQuest] = useState(null);
  const [filter, setFilter] = useState('all');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showPetSection, setShowPetSection] = useState(false);
  const { showToast } = useToast();

  const refreshUserProfile = async () => {
    if (!user || !token) return;
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const profile = await res.json();
      updateUser({
        stats: profile.stats,
        completedChallenges: profile.completedChallenges
      });
    } catch (error) {
      console.error('Error refrescando perfil:', error);
    }
  };

  const getXpByDifficulty = (difficulty) => {
    switch(difficulty) {
      case 'Muy fácil': return 50;
      case 'Fácil': return 150;
      case 'Media': return 250;
      case 'Difícil': return 500;
      case 'Muy difícil': return 1000;
      default: return 250;
    }
  };

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
    const localQuests = loadUserQuestsFromLocal(user.id);
    const offlineQuests = localQuests.filter(q => q._id && q._id.startsWith('local_'));

    if (offlineQuests.length === 0) return;

    showToast('Sincronizando datos guardados sin conexión...', 'info');

    for (const quest of offlineQuests) {
      const alreadyExists = quests.some(q => 
        q.title === quest.title && 
        Math.abs(new Date(q.createdAt) - new Date(quest.createdAt)) < 60000
      );
      if (alreadyExists) {
        const updatedLocal = localQuests.filter(q => q._id !== quest._id);
        saveUserQuestsToLocal(user.id, updatedLocal);
        continue;
      }
      
      const questData = {
        title: quest.title,
        description: quest.description,
        xpReward: quest.xpReward,
        difficulty: quest.difficulty,
        isMultiRequirement: quest.isMultiRequirement || false,
        subtasks: quest.subtasks || [],
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
        await syncOfflineQuests();
        
        const data = await safeFetch(
          `${process.env.REACT_APP_API_URL}/api/quests`,
          { headers: { 'Authorization': `Bearer ${token}` } },
          null 
        ).catch(async (error) => {
          showToast('Usando copia local de seguridad', 'warning');
          const backup = loadUserQuestsFromLocal(user.id);
          setQuests(backup);
          return null;
        });
        
        if (data) {
          setQuests(data);
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

  useEffect(() => {
    if (!authLoading && !isLoggingOut) {
      fetchQuests();
    }
  }, [user, token, authLoading, isLoggingOut]);

  useEffect(() => {
    if (isLoggingOut && !user && !token) {
      showToast('Sesión cerrada con éxito', 'success');
      const anonQuests = loadAnonQuestsFromLocal();
      setQuests(anonQuests);
      setIsLoggingOut(false);
    }
  }, [isLoggingOut, user, token]);

  const handleLogout = () => {
    if (user && token) {
      saveUserQuestsToLocal(user.id, quests);
    }
    setIsLoggingOut(true);
    logout();
  };

  const handleInputChange = (e) => {
    setNewQuest({
      ...newQuest,
      [e.target.name]: e.target.value
    });
  };

  const createQuest = async (e) => {
    e.preventDefault();
    if (!newQuest.title) return;

    const questData = {
      title: newQuest.title,
      description: newQuest.description,
      xpReward: getXpByDifficulty(newQuest.difficulty),
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

    setShowForm(false);
    setNewQuest({ title: '', description: '', xpReward: 100, difficulty: 'Media' });
    setIsMultiRequirement(false);
    setSubtasks([]);
    setNewSubtaskText('');
    setEditingQuest(null);
  };

  const addSubtask = () => {
    if (!newSubtaskText.trim()) return;
    setSubtasks([...subtasks, { text: newSubtaskText, completed: false }]);
    setNewSubtaskText('');
  };

  const removeSubtask = (index) => {
    setSubtasks(subtasks.filter((_, i) => i !== index));
  };

  const toggleSubtask = (index) => {
    const newSubtasks = [...subtasks];
    newSubtasks[index].completed = !newSubtasks[index].completed;
    setSubtasks(newSubtasks);
  };

  const updateQuest = async (e) => {
    e.preventDefault();
    if (!newQuest.title || !editingQuest) return;

    const updatedQuest = {
      ...editingQuest,
      title: newQuest.title,
      description: newQuest.description,
      xpReward: getXpByDifficulty(newQuest.difficulty),
      difficulty: newQuest.difficulty,
      isMultiRequirement: isMultiRequirement,
      subtasks: isMultiRequirement ? subtasks : []
    };

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

    const newQuests = quests.map(q => 
      q._id === editingQuest._id ? updatedQuest : q
    );
    setQuests(newQuests);

    if (user && token) {
      saveUserQuestsToLocal(user.id, newQuests);
    } else {
      saveAnonQuestsToLocal(newQuests);
    }

    setShowForm(false);
    setEditingQuest(null);
    setNewQuest({ title: '', description: '', xpReward: 100, difficulty: 'Media' });
    setIsMultiRequirement(false);
    setSubtasks([]);
    setNewSubtaskText('');
  };

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
    
    if (JSON.stringify(quest) === JSON.stringify(updatedQuest)) return;
    
    if (user && token && !quest._id.startsWith('local_')) {
      try {
        const response = await safeFetch(
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
        
        refreshUserProfile();

        if (response?.coins !== undefined) {
          updateUser({ coins: response.coins });
        }

        if (response?.petEvolution) {
          if (response.petEvolution === 'baby') {
            showToast('¡Tu huevo ha eclosionado! Tu mascota es ahora un bebé', 'success');
          } else if (response.petEvolution === 'adult') {
            showToast('¡Tu mascota ha alcanzado su etapa adulta!', 'success');
          }
        }

      } catch (error) {
        console.debug('Error al sincronizar:', error.message);
      }
    }
    
    const newQuests = quests.map(q => {
      if (q._id === quest._id) {
        return updatedQuest;
      }
      return q;
    });
    
    setQuests(newQuests);
    
    if (user && token) {
      saveUserQuestsToLocal(user.id, newQuests);
    } else {
      saveAnonQuestsToLocal(newQuests);
    }
  };

  const deleteQuest = async (id) => {
    const questToDelete = quests.find(q => q._id === id);
    const errors = [];
    
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
    
    if (errors.length > 0) {
      const errorMessage = errors.join('\n');
      showToast(errorMessage, 'error', 5000);
      return;
    }
    
    const newQuests = quests.filter(q => q._id !== id);
    setQuests(newQuests);
    
    if (user && token) {
      saveUserQuestsToLocal(user.id, newQuests);
    } else {
      saveAnonQuestsToLocal(newQuests);
    }

    await refreshUserProfile();
    showToast(`Misión "${questToDelete.title}" eliminada`, 'success');
  };
  
  const handleBackFromPet = () => {
    setShowPetSection(false);
  };

  const getDifficultyColor = (difficulty) => {
    switch(difficulty) {
      case 'Muy fácil': return 'border-blue-400 bg-blue-500/15';
      case 'Fácil': return 'border-green-500 bg-green-500/15';
      case 'Media': return 'border-yellow-500 bg-yellow-500/15';
      case 'Difícil': return 'border-orange-500 bg-orange-500/15';
      case 'Muy difícil': return 'border-red-500 bg-red-500/15';
      default: return 'border-gray-500 bg-gray-500/15';
    }
  };

  const totalXP = user?.stats?.totalXP || 0;
  const level = user?.stats?.level || 1;
  const [previousLevel, setPreviousLevel] = useState(level);
  const xpForNextLevel = (level * level * 100) - totalXP;
  const completedCount = (user?.stats?.completedQuests || 0) + (user?.stats?.completedChallenges || 0);

  useLevelUp(level, user?.id || 'anon');

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
    if (filter === 'challenges') return false;
    return true;
  });

  if (showPetSection) {
    return <PetSection onBack={handleBackFromPet} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-rpg-dark to-rpg-purple">
      <header className="bg-rpg-dark/90 border-b-4 border-rpg-gold p-6 shadow-2xl">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="font-rpg text-5xl text-rpg-gold drop-shadow-lg">⚔️ QuestLog</h1>
            <div className="flex items-center gap-4">
              <MenuDrawer 
                onOpenAuth={() => setShowAuth(true)} 
                onMenuStateChange={setIsMenuOpen}
                onOpenSettings={() => setShowSettings(true)}
                onOpenStats={() => setShowStats(true)}
                onOpenPet={() => setShowPetSection(true)}
                onLogout={handleLogout}
              />
            </div>
          </div>

          {showAuth && <AuthForms onClose={() => setShowAuth(false)} />}

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

        <div className="flex justify-center gap-4 mt-6">
          <button onClick={() => setFilter('all')} className={`px-6 py-2 rounded-lg font-bold transition-all duration-200 ${filter === 'all' ? 'bg-rpg-gold text-rpg-dark' : 'bg-rpg-card/50 text-gray-400 hover:bg-rpg-card'}`}>📋 Todas</button>
          <button onClick={() => setFilter('pending')} className={`px-6 py-2 rounded-lg font-bold transition-all duration-200 ${filter === 'pending' ? 'bg-yellow-500 text-rpg-dark' : 'bg-rpg-card/50 text-gray-400 hover:bg-rpg-card'}`}>⏳ Pendientes</button>
          <button onClick={() => setFilter('completed')} className={`px-6 py-2 rounded-lg font-bold transition-all duration-200 ${filter === 'completed' ? 'bg-green-500 text-rpg-dark' : 'bg-rpg-card/50 text-gray-400 hover:bg-rpg-card'}`}>✅ Completadas</button>
          <button onClick={() => setFilter('challenges')} className={`px-6 py-2 rounded-lg font-bold transition-all duration-200 ${filter === 'challenges' ? 'bg-rpg-gold text-rpg-dark' : 'bg-rpg-card/50 text-gray-400 hover:bg-rpg-card'}`}>🌍 Retos</button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6">
        {showForm && (
          <form onSubmit={editingQuest ? updateQuest : createQuest} className="quest-card mb-8">
            <h2 className="text-2xl font-rpg text-rpg-gold mb-4">{editingQuest ? '📝 Editar Misión' : '📜 Nueva Misión'}</h2>
            <div className="grid gap-4">
              <input type="text" name="title" value={newQuest.title} onChange={handleInputChange} placeholder="Título de la misión" className="w-full p-3 bg-rpg-dark/50 border border-rpg-gold/30 rounded-lg text-white" required />
              <textarea name="description" value={newQuest.description} onChange={handleInputChange} placeholder="Descripción (opcional)" className="w-full p-3 bg-rpg-dark/50 border border-rpg-gold/30 rounded-lg text-white" rows="2" />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">XP</label>
                  <input type="text" value={getXpByDifficulty(newQuest.difficulty)} disabled className="w-full p-3 bg-rpg-dark/50 border border-rpg-gold/30 rounded-lg text-gray-400 cursor-not-allowed"/>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Dificultad</label>
                  <select name="difficulty" value={newQuest.difficulty} onChange={handleInputChange} className="w-full p-3 bg-rpg-dark/50 border border-rpg-gold/30 rounded-lg text-white">
                    <option value="Muy fácil">Muy fácil</option>
                    <option value="Fácil">Fácil</option>
                    <option value="Media">Media</option>
                    <option value="Difícil">Difícil</option>
                    <option value="Muy difícil">Muy difícil</option>
                  </select>
                </div>
                <div className="mb-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={isMultiRequirement} onChange={(e) => { setIsMultiRequirement(e.target.checked); if (!e.target.checked) setSubtasks([]); }} className="w-5 h-5 rounded border-rpg-gold/30 text-rpg-gold focus:ring-rpg-gold" />
                    <span className="text-gray-300">Esta misión tiene requisitos (subtareas)</span>
                  </label>
                </div>

                {isMultiRequirement && (
                  <div className="bg-rpg-dark/30 p-4 rounded-lg">
                    <label className="block text-sm text-gray-400 mb-2">Lista de requisitos:</label>
                    <div className="space-y-2 mb-3">
                      {subtasks.map((subtask, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input type="checkbox" checked={subtask.completed} onChange={() => toggleSubtask(idx)} className="w-4 h-4 rounded border-rpg-gold/30" />
                          <span className={`flex-1 text-gray-300 ${subtask.completed ? 'line-through text-gray-500' : ''}`}>{subtask.text}</span>
                          <button type="button" onClick={() => removeSubtask(idx)} className="text-red-400 hover:text-red-500">✕</button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input type="text" value={newSubtaskText} onChange={(e) => setNewSubtaskText(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && addSubtask()} placeholder="Nuevo requisito..." className="flex-1 p-2 bg-rpg-dark/50 border border-rpg-gold/30 rounded text-white text-sm" />
                      <button type="button" onClick={addSubtask} className="btn-secondary text-sm px-3 py-1">+ Añadir</button>
                    </div>
                  </div>
                )}
              </div>
              <button type="submit" className="btn-primary mt-2">{editingQuest ? '💾 Guardar Cambios' : '✨ Crear Misión'}</button>
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
                {filter === 'challenges' && '🌍 Retos de la Comunidad'}
              </p>
              <p className="text-gray-400">
                {filter === 'all' && '¡Crea tu primera misión!'}
                {filter === 'pending' && '¡Todas completadas! 🎉'}
                {filter === 'completed' && '¡Completa alguna!'}
                {filter === 'challenges' && '¡Próximamente! Podrás crear y aceptar retos dentro de la comunidad.'}
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
          className={`fixed bottom-8 z-50 bg-rpg-gold hover:bg-yellow-500 text-rpg-dark w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 left-1/2 -translate-x-1/2 md:left-auto md:right-8 md:translate-x-0 ${isMenuOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
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
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      {showStats && <StatsModal onClose={() => setShowStats(false)} quests={quests} userStats={user?.stats} />}
    </div>
  );
}

export default App;