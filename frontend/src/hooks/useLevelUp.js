import { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';

const useLevelUp = (currentLevel) => {
  const previousLevelRef = useRef(currentLevel);
  const hasTriggeredRef = useRef(false);

  useEffect(() => {
    const previousLevel = previousLevelRef.current;
    
    // Si el nivel aumentó y no hemos disparado ya esta subida
    if (currentLevel > previousLevel && !hasTriggeredRef.current) {
      hasTriggeredRef.current = true;
      
      // 🎉 ANIMACIÓN DE CONFETI
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        startVelocity: 20,
        colors: ['#e4b363', '#2d1b3c', '#f5c542', '#ffd700']
      });
      
      // Confeti desde izquierda
      confetti({
        particleCount: 100,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 }
      });
      
      // Confeti desde derecha
      confetti({
        particleCount: 100,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 }
      });
      
      // 🔊 SONIDO
      const audio = new Audio('/sounds/level-up.mp3');
      audio.volume = 0.5;
      audio.play().catch(e => console.log('Error:', e));
      
      // 📢 NOTIFICACIÓN
      const notification = document.createElement('div');
      notification.className = 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-rpg-gold text-rpg-dark px-8 py-4 rounded-xl font-sans text-2xl font-bold z-50 animate-bounce shadow-2xl border-4 border-rpg-dark';
      notification.innerHTML = `🎉 NIVEL ${currentLevel} ALCANZADO 🎉`;
      document.body.appendChild(notification);
      
      setTimeout(() => {
        notification.remove();
      }, 3000);
      
      // Resetear el trigger después de un tiempo
      setTimeout(() => {
        hasTriggeredRef.current = false;
      }, 500);
    }
    
    // Actualizar la referencia del nivel anterior
    previousLevelRef.current = currentLevel;
  }, [currentLevel]);
};

export default useLevelUp;