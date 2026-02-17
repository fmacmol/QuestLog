import React, { useState, useEffect } from 'react';

function App() {
  const [quests, setQuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newQuest, setNewQuest] = useState({
    title: '',
    description: '',
    xpReward: 100,
    difficulty: 'Media'
  });
  const [editingQuest, setEditingQuest] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'completed'

  useEffect(() => {
    fetchQuests();
  }, []);

  const fetchQuests = async () => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/quests`);
      const data = await res.json();
      setQuests(data);
      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      setLoading(false);
    }
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

    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/quests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newQuest,
          xpReward: parseInt(newQuest.xpReward)
        })
      });
      const quest = await res.json();
      setQuests([quest, ...quests]);
      setShowForm(false);
      setNewQuest({ title: '', description: '', xpReward: 100, difficulty: 'Media' });
      setEditingQuest(null);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const updateQuest = async (e) => {
    e.preventDefault();
    if (!newQuest.title || !editingQuest) return;

    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/quests/${editingQuest._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newQuest,
          xpReward: parseInt(newQuest.xpReward)
        })
      });
      const updatedQuest = await res.json();
      setQuests(quests.map(q => q._id === editingQuest._id ? updatedQuest : q));
      setShowForm(false);
      setEditingQuest(null);
      setNewQuest({ title: '', description: '', xpReward: 100, difficulty: 'Media' });
      setEditingQuest(null);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const completeQuest = async (id) => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/quests/${id}/complete`, {
        method: 'PUT'
      });
      const updatedQuest = await res.json();
      setQuests(quests.map(q => q._id === id ? updatedQuest : q));
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // Marcar/desmarcar quest con un toque
  const toggleQuest = async (quest) => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/quests/${quest._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !quest.completed })
      });
      const updatedQuest = await res.json();
      setQuests(quests.map(q => q._id === quest._id ? updatedQuest : q));
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // Dejar pulsado para editar
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

  if (loading) {
    return (
      <div className="min-h-screen bg-rpg-dark flex items-center justify-center">
        <div className="text-rpg-gold text-2xl animate-pulse">Cargando misiones...</div>
      </div>
    );
  }
  // Filtrar quests según el filtro seleccionado
  const filteredQuests = quests.filter(quest => {
    if (filter === 'all') return true;
    if (filter === 'pending') return !quest.completed;
    if (filter === 'completed') return quest.completed;
    return true;
  });
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-rpg-dark to-rpg-purple">
      {/* Header con estadísticas */}
      <header className="bg-rpg-dark/90 border-b-4 border-rpg-gold p-6 shadow-2xl">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="font-rpg text-5xl text-rpg-gold drop-shadow-lg">
              ⚔️ QuestLog
            </h1>
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
          </div>

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

          {/* Barra de XP para siguiente nivel */}
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
        {/* Formulario nueva quest */}
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

        {/* Lista de quests */}
        <div className="space-y-4">
          {filteredQuests.length === 0 ? (
            <div className="text-center py-12 quest-card">
              <p className="text-2xl text-rpg-gold mb-4">
                {filter === 'all' && '📭 No hay misiones'}
                {filter === 'pending' && '⏳ No hay misiones pendientes'}
                {filter === 'completed' && '✅ No hay misiones completadas'}
              </p>
              <p className="text-gray-400">
                {filter === 'all' && '¡Crea tu primera misión para comenzar tu aventura!'}
                {filter === 'pending' && '¡Todas las misiones están completadas! 🎉'}
                {filter === 'completed' && '¡Completa alguna misión para verla aquí!'}
              </p>
            </div>
          ) : (
            filteredQuests.map(quest => (
              <div key={quest._id} 
                  className={`quest-card ${getDifficultyColor(quest.difficulty)} cursor-pointer select-none`}
                  onClick={() => toggleQuest(quest)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    handleLongPress(quest);
                  }}>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-rpg-gold">{quest.title}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                        quest.difficulty === 'Fácil' ? 'border-green-500 text-green-500' :
                        quest.difficulty === 'Media' ? 'border-yellow-500 text-yellow-500' :
                        'border-red-500 text-red-500'
                      }`}>
                        {quest.difficulty}
                      </span>
                    </div>
                    {quest.description && (
                      <p className="text-gray-300 mb-2">{quest.description}</p>
                    )}
                    <div className="flex items-center gap-2 text-sm">
                      <span className="bg-rpg-gold/20 text-rpg-gold px-2 py-1 rounded">
                        ✨ {quest.xpReward} XP
                      </span>
                      <span className="text-gray-400">
                        📅 {new Date(quest.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  {!quest.completed ? (
                    <span className="flex items-center gap-2 text-yellow-400 font-bold">
                      <span>⏳</span> Pendiente
                    </span>
                  ) : (
                    <span className="flex items-center gap-2 text-green-500 font-bold">
                      <span>✅</span> Completada
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}

export default App;