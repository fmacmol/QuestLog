import React, { useEffect, useState } from 'react';

const Toast = ({ message, type = 'info', duration = 3000, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, duration);
    
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getColors = () => {
    switch (type) {
      case 'success':
        return 'bg-green-500/90 border-green-400 text-white';
      case 'error':
        return 'bg-red-500/90 border-red-400 text-white';
      case 'warning':
        return 'bg-yellow-500/90 border-yellow-400 text-rpg-dark';
      default:
        return 'bg-rpg-gold/90 border-rpg-gold text-rpg-dark';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      default:
        return '📜';
    }
  };

  if (!isVisible) return null;

  return (
    <div className={`animate-slide-down ${getColors()} border-2 rounded-lg px-6 py-3 shadow-2xl min-w-[200px] text-center`}>
      <div className="flex items-center gap-3">
        <span className="text-xl">{getIcon()}</span>
        <span className="font-rpg whitespace-pre-line">{message}</span>
      </div>
    </div>
  );
};

export default Toast;