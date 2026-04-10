import React, { useState, useRef, useEffect } from 'react';
import { useSwipeable } from 'react-swipeable';

const QuestCard = ({ 
  quest, 
  onToggle, 
  onDelete, 
  onEdit, 
  getDifficultyColor 
}) => {
  
  const [showDelete, setShowDelete] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);
  const longPressTimer = useRef(null);

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => setShowDelete(true),
    onSwipedRight: () => setShowDelete(false),
    preventDefaultTouchmoveEvent: true,
    trackMouse: false
  });

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
    
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showMenu]);

  // Limpiar timer al desmontar
  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
    };
  }, []);

  // Handlers para long press (dejar pulsado)
  const handleTouchStart = () => {
    longPressTimer.current = setTimeout(() => {
      onEdit(quest);
    }, 500); // 500ms = tiempo para considerar "long press"
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleMouseDown = (e) => {
    // Solo para botón izquierdo del ratón (en PC también funciona)
    if (e.button === 0) {
      longPressTimer.current = setTimeout(() => {
        onEdit(quest);
      }, 500);
    }
  };

  const handleMouseUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleCardClick = (e) => {
    // Si el clic viene del menú o del botón del menú, no hacer toggle
    if (e.target.closest('.menu-container')) {
      return;
    }
    if (showDelete) {
      setShowDelete(false);
    } else {
      onToggle(quest);
    }
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    onDelete(quest._id);
    setShowDelete(false);
    setShowMenu(false);
  };

  const handleEditClick = (e) => {
    e.stopPropagation();
    onEdit(quest);
    setShowMenu(false);
  };

  const handleMenuClick = (e) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  return (
    <div {...swipeHandlers}
         className={`quest-card ${getDifficultyColor(quest.difficulty)} cursor-pointer select-none relative overflow-visible transition-all duration-200 ${
           showDelete ? 'scale-95 opacity-75' : ''
         }`}
         onClick={handleCardClick}
         onTouchStart={handleTouchStart}
         onTouchEnd={handleTouchEnd}
         onTouchCancel={handleTouchEnd}
         onMouseDown={handleMouseDown}
         onMouseUp={handleMouseUp}
         onMouseLeave={handleMouseUp}>
      
      {/* Botón de eliminar que aparece al hacer swipe */}
      {showDelete && (
        <div 
          className="absolute inset-y-0 right-0 w-20 bg-red-500/90 flex items-center justify-center text-white font-bold text-sm cursor-pointer hover:bg-red-600 transition-colors z-10"
          onClick={handleDeleteClick}
        >
          ← Eliminar
        </div>
      )}

      {/* Menú de tres puntos (kebab menu) - solo visible en web/tablet */}
      <div className="hidden sm:block absolute top-3 right-3 z-20 menu-container" ref={menuRef}>
        <button
          onClick={handleMenuClick}
          className="text-gray-400 hover:text-rpg-gold transition-colors p-1 rounded-full hover:bg-rpg-dark/50"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
        </button>

        {showMenu && (
          <div className="absolute top-full right-0 mt-1 bg-rpg-card border border-rpg-gold/30 rounded-lg shadow-xl z-50 min-w-[130px] overflow-hidden">
            <button
              onClick={handleEditClick}
              className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-rpg-gold/20 hover:text-rpg-gold transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              Editar
            </button>
            <button
              onClick={handleDeleteClick}
              className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-500/20 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Eliminar
            </button>
          </div>
        )}
      </div>
      
      {/* Contenido de la quest */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pr-8">
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