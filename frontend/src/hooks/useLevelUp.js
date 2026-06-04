import { useEffect, useRef } from 'react';
import { usePreferences } from '../context/PreferencesContext';
import confetti from 'canvas-confetti';
import { useToast } from '../context/ToastContext';

const useLevelUp = (currentLevel) => {
  const { soundEnabled, confettiEnabled, animationEnabled } = usePreferences();
  const hasTriggered = useRef(false);
  const previousLevel = useRef(currentLevel);
  const sessionKey = 'questlog_celebrated_levels';
  const initialLoadDone = useRef(false);
  const { showToast } = useToast();

  const getCelebratedLevels = () => {
    const stored = sessionStorage.getItem(sessionKey);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  };



useEffect(() => {

  const saveCelebratedLevel = (level) => {
    const levels = getCelebratedLevels();
    levels.add(level);
    sessionStorage.setItem(sessionKey, JSON.stringify([...levels]));
  };

  const clearCelebratedLevels = () => {
    sessionStorage.removeItem(sessionKey);
  };

  const wasLevelCelebrated = (level) => {
    return getCelebratedLevels().has(level);
  };


    // Detectar si es la primera carga
    if (!initialLoadDone.current) {
      initialLoadDone.current = true;
      previousLevel.current = currentLevel;
      return;
    }

    // Si las animaciones están desactivadas, no hacer nada
    if (!animationEnabled) return;

    // Detectar si bajó de nivel
    const wentDown = currentLevel < previousLevel.current;
    
    // Si bajó, borrar todos los niveles celebrados (para que pueda volver a celebrar al subir)
    if (wentDown) {
      clearCelebratedLevels();
      previousLevel.current = currentLevel;
      return;
    }

    // Detectar si subió y no ha sido celebrado en esta sesión
    const wentUp = currentLevel > previousLevel.current;
    
    if (wentUp && !wasLevelCelebrated(currentLevel) && !hasTriggered.current) {
      hasTriggered.current = true;
      saveCelebratedLevel(currentLevel);

      // 🎉 CONFETI (solo si está activado)
      if (confettiEnabled) {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          startVelocity: 20,
          colors: ['#e4b363', '#2d1b3c', '#f5c542', '#ffd700']
        });
        
        confetti({
          particleCount: 100,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.7 }
        });
        confetti({
          particleCount: 100,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.7 }
        });
      }
      
      // 🔊 SONIDO (solo si está activado)
      if (soundEnabled) {
        const audio = new Audio('/sounds/level-up.mp3');
        audio.volume = 0.5;
        audio.play().catch(e => showToast('Error al reproducir sonido', 'error'));
      }
      
      // 📢 NOTIFICACIÓN (siempre visible)
      const notification = document.createElement('div');
      notification.className = 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-rpg-gold text-rpg-dark px-8 py-4 rounded-xl font-rpg text-2xl font-bold z-50 animate-bounce shadow-2xl border-4 border-rpg-dark';
      notification.innerHTML = `🎉 ¡NIVEL ${currentLevel}! 🎉`;
      document.body.appendChild(notification);
      
      setTimeout(() => {
        notification.remove();
      }, 3000);
      
      setTimeout(() => {
        hasTriggered.current = false;
      }, 1000);
    }

    previousLevel.current = currentLevel;
  }, [currentLevel, soundEnabled, confettiEnabled, animationEnabled]);
};

export default useLevelUp;