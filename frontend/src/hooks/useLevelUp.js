import { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';

const useLevelUp = (currentLevel, previousLevel) => {
  const hasTriggered = useRef(false);

  useEffect(() => {
    // Detectar si subió de nivel y no hemos disparado la animación aún
    if (currentLevel > previousLevel && !hasTriggered.current) {
      hasTriggered.current = true;
      
      // 🎉 ANIMACIÓN DE CONFETI
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        startVelocity: 20,
        colors: ['#e4b363', '#2d1b3c', '#f5c542', '#ffd700']
      });
      
      // Confeti adicional desde ambos lados
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
      
      // 🔊 SONIDO DE SUBIDA DE NIVEL
      const audio = new Audio('/sounds/level-up.mp3');
      audio.volume = 0.5;
      audio.play().catch(e => console.log('Error reproduciendo sonido:', e));
      
      // Mostrar notificación
      const notification = document.createElement('div');
      notification.className = 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-rpg-gold text-rpg-dark px-8 py-4 rounded-xl font-rpg text-2xl font-bold z-50 animate-bounce shadow-2xl border-4 border-rpg-dark';
      notification.innerHTML = `🎉 ¡NIVEL ${currentLevel}! 🎉`;
      document.body.appendChild(notification);
      
      setTimeout(() => {
        notification.remove();
      }, 3000);
      
      // Resetear el trigger después de un tiempo
      setTimeout(() => {
        hasTriggered.current = false;
      }, 1000);
    } else if (currentLevel <= previousLevel) {
      // Si el nivel no subió, resetear el trigger
      hasTriggered.current = false;
    }
  }, [currentLevel, previousLevel]);
};

export default useLevelUp;