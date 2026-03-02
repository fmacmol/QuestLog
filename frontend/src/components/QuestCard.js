import React, { useState } from 'react';
import { useSwipeable } from 'react-swipeable';

const QuestCard = ({ 
  quest, 
  onToggle, 
  onDelete, 
  onLongPress, 
  getDifficultyColor 
}) => {
  
  const [showDelete, setShowDelete] = useState(false);

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => setShowDelete(true),
    onSwipedRight: () => setShowDelete(false),
    preventDefaultTouchmoveEvent: true,
    trackMouse: false
  });

  const handleCardClick = () => {
    if (showDelete) {
      setShowDelete(false);
    } else {
      onToggle(quest);
    }
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    onDelete(quest._id);  // ← Elimina directamente, sin confirmación
    setShowDelete(false);
  };

  return (
    <div {...swipeHandlers}
         className={`quest-card ${getDifficultyColor(quest.difficulty)} cursor-pointer select-none relative overflow-hidden transition-all duration-200 ${
           showDelete ? 'scale-95 opacity-75' : ''
         }`}
         onClick={handleCardClick}
         onContextMenu={(e) => {
           e.preventDefault();
           onLongPress(quest);
         }}>
      
      {/* Botón de eliminar que aparece al hacer swipe */}
      {showDelete && (
        <div 
          className="absolute inset-y-0 right-0 w-20 bg-red-500/90 flex items-center justify-center text-white font-bold text-sm cursor-pointer hover:bg-red-600 transition-colors z-10"
          onClick={handleDeleteClick}
        >
          ← Eliminar
        </div>
      )}
      
      {/* Contenido de la quest */}
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
  );
};

export default QuestCard;