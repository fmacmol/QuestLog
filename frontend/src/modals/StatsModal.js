import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';

const StatsModal = ({ onClose, quests }) => {
  const { user } = useAuth();
  const [filterType, setFilterType] = useState('all'); // 'all', 'quest', 'challenge'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc', 'desc'

  // Filtrar solo tareas completadas
  const completedQuests = quests.filter(q => q.completed === true);

  // Aplicar filtro por tipo
  const filteredByType = useMemo(() => {
    if (filterType === 'all') return completedQuests;
    if (filterType === 'quest') return completedQuests.filter(q => !q.fromChallenge);
    if (filterType === 'challenge') return completedQuests.filter(q => q.fromChallenge);
    return completedQuests;
  }, [completedQuests, filterType]);

  // Aplicar orden por fecha (createdAt)
  const sortedQuests = useMemo(() => {
    const sorted = [...filteredByType];
    sorted.sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      if (sortOrder === 'asc') return dateA - dateB;
      return dateB - dateA;
    });
    return sorted;
  }, [filteredByType, sortOrder]);

  // Calcular estadísticas resumidas
  const totalXP = completedQuests.reduce((sum, q) => sum + (q.xpReward || 0), 0);
  const totalQuests = completedQuests.filter(q => !q.fromChallenge).length;
  const totalChallenges = completedQuests.filter(q => q.fromChallenge).length;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-rpg-card border-2 border-rpg-gold rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-rpg-gold/30">
          <h2 className="text-2xl font-rpg text-rpg-gold">📊 Estadísticas</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ✕
          </button>
        </div>

        {/* Resumen */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-rpg-dark/30 border-b border-rpg-gold/30">
          <div className="text-center">
            <p className="text-2xl font-bold text-rpg-gold">{totalXP}</p>
            <p className="text-xs text-gray-400">XP total</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-500">{totalQuests}</p>
            <p className="text-xs text-gray-400">Misiones</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-500">{totalChallenges}</p>
            <p className="text-xs text-gray-400">Retos</p>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex justify-between items-center p-4 border-b border-rpg-gold/30">
          <div className="flex gap-2">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                filterType === 'all'
                  ? 'bg-rpg-gold text-rpg-dark'
                  : 'bg-rpg-card/50 text-gray-400 hover:bg-rpg-card'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFilterType('quest')}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                filterType === 'quest'
                  ? 'bg-rpg-gold text-rpg-dark'
                  : 'bg-rpg-card/50 text-gray-400 hover:bg-rpg-card'
              }`}
            >
              📜 Misiones
            </button>
            <button
              onClick={() => setFilterType('challenge')}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                filterType === 'challenge'
                  ? 'bg-rpg-gold text-rpg-dark'
                  : 'bg-rpg-card/50 text-gray-400 hover:bg-rpg-card'
              }`}
            >
              🌍 Retos
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setSortOrder('desc')}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                sortOrder === 'desc'
                  ? 'bg-rpg-gold text-rpg-dark'
                  : 'bg-rpg-card/50 text-gray-400 hover:bg-rpg-card'
              }`}
            >
              📅 Más reciente
            </button>
            <button
              onClick={() => setSortOrder('asc')}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                sortOrder === 'asc'
                  ? 'bg-rpg-gold text-rpg-dark'
                  : 'bg-rpg-card/50 text-gray-400 hover:bg-rpg-card'
              }`}
            >
              📅 Más antigua
            </button>
          </div>
        </div>

        {/* Lista de tareas completadas */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {sortedQuests.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              No hay tareas completadas aún.
            </div>
          ) : (
            sortedQuests.map(quest => (
              <div key={quest._id} className="bg-rpg-dark/30 rounded-lg p-3 border border-rpg-gold/20">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-rpg-gold">{quest.title}</h3>
                      {quest.fromChallenge ? (
                        <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">
                          Reto
                        </span>
                      ) : (
                        <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
                          Misión
                        </span>
                      )}
                    </div>
                    {quest.description && (
                      <p className="text-xs text-gray-400 mt-1">{quest.description}</p>
                    )}
                    <div className="flex gap-3 mt-2 text-xs">
                      <span className="text-rpg-gold">✨ {quest.xpReward} XP</span>
                      <span className="text-gray-500">
                        📅 {new Date(quest.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <span className="text-green-500 text-sm">✅</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default StatsModal;