import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useSwipeable } from 'react-swipeable';
import ShopModal from '../modals/ShopModal';

const PetSection = ({ onBack }) => {
  const { user, token } = useAuth();
  const { showToast } = useToast();
  const [pets, setPets] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showGift, setShowGift] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    loadPets();
  }, []);

  // ANIMACIÓN: alternar imágenes cada 800ms solo si es adulto
  useEffect(() => {
    if (pets.length > 0 && pets[activeIndex]?.stage === 'adult') {
      const interval = setInterval(() => {
        setFrame(prev => (prev + 1) % 2); // Alterna entre 0 y 1
      }, 800); // Cambia cada 800ms
      return () => clearInterval(interval);
    } else {
      setFrame(0); // Resetear frame si no es adulto
    }
  }, [pets, activeIndex]);

  const loadPets = async () => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/pets`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (data.pets && data.pets.length > 0) {
        setPets(data.pets);
        setActiveIndex(data.activeIndex || 0);
      } else {
        setShowGift(true);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error cargando mascotas:', error);
      setLoading(false);
    }
  };

  const openGift = async () => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/pets/init`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (data.success) {
        setPets(data.pets);
        setActiveIndex(data.activeIndex);
        setShowGift(false);
        showToast('🎁 ¡Felicidades! Tienes una mascota de regalo', 'success');
      }
    } catch (error) {
      showToast('Error al obtener tu mascota', 'error');
    }
  };

  const getAnimalNameInSpanish = (animal) => {
    const names = {
      // Comunes
      dog: 'Perro',
      cat: 'Gato',
      rabbit: 'Conejo',
      // Raros
      axolotl: 'Ajolote',
      fennecfox: 'Zorro Fennec',
      slowloris: 'Perezoso Loris',
      // Mitológicos
      dragon: 'Dragón',
      griffin: 'Grifo',
      phoenix: 'Fénix'
    };
    return names[animal] || animal;
  };

  const getAnimalRarity = (animal) => {
    const common = ['dog', 'cat', 'rabbit'];
    const rare = ['axolotl', 'fennecfox', 'slowloris'];
    const mythical = ['dragon', 'griffin', 'phoenix'];
    
    if (common.includes(animal)) return 'Común';
    if (rare.includes(animal)) return 'Raro';
    if (mythical.includes(animal)) return 'Mitológico';
    return 'Desconocido';
  };

  const getStageInSpanish = (stage) => {
    switch(stage) {
      case 'egg': return 'Huevo';
      case 'egg_cracked': return 'Huevo agrietado';
      case 'baby': return 'Bebé';
      case 'adult': return 'Adulto';
      default: return stage;
    }
  };

  const changePet = async (newIndex) => {
    if (newIndex < 0 || newIndex >= pets.length) return;
    
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/pets/activate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ index: newIndex })
      });
      const data = await res.json();
      
      if (data.success) {
        setActiveIndex(newIndex);
      }
    } catch (error) {
      showToast('Error al cambiar de mascota', 'error');
    }
  };

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => changePet(activeIndex + 1),
    onSwipedRight: () => changePet(activeIndex - 1),
    preventDefaultTouchmoveEvent: true,
    trackMouse: true
  });

  const getPetImage = (pet) => {
    // Huevos (comparten imagen para todos los animales)
    if (pet.stage === 'egg') {
      return `/images/pets/egg.png`;
    }
    if (pet.stage === 'egg_cracked') {
      return `/images/pets/egg_cracked.png`;
    }
    if (pet.stage === 'baby') {
      return `/images/pets/${pet.animal}_baby.png`;
    }
    if (pet.stage === 'adult') {
      // Alterna entre dos imágenes
      const frameNumber = frame === 0 ? 1 : 2;
      return `/images/pets/${pet.animal}_adult_${frameNumber}.png`;
    }
    // placeholder por si hay un estado desconocido
    return `/images/pets/${pet.animal}_${pet.stage}.png`;
  };

  const getBackgroundImage = (pet) => {
    return `/images/backgrounds/${pet.background}.png`;
  };

  const refreshPets = async () => {
    const res = await fetch(`${process.env.REACT_APP_API_URL}/api/pets`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    setPets(data.pets);
    setActiveIndex(data.activeIndex || 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-rpg-dark flex items-center justify-center">
        <div className="text-rpg-gold text-2xl animate-pulse">Cargando tus mascotas...</div>
      </div>
    );
  }

  const activePet = pets[activeIndex];

  return (
    <div className="min-h-screen bg-cover bg-center bg-no-repeat relative">
      {activePet && (
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${getBackgroundImage(activePet)})` }}
        />
      )}
      <div className="absolute inset-0 bg-black/40" />

      {/* Botón volver */}
      <button
        onClick={onBack}
        className="fixed top-4 left-4 z-50 bg-rpg-gold/20 hover:bg-rpg-gold/40 text-rpg-gold px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Volver
      </button>

      {/* Contenido principal */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-6">
        
        {showGift && (
          <div className="text-center animate-bounce cursor-pointer" onClick={openGift}>
            <div className="text-9xl mb-4">🎁</div>
            <h2 className="text-3xl font-rpg text-rpg-gold mb-2">¡Tienes un regalo!</h2>
            <p className="text-gray-300">Haz clic para abrirlo</p>
          </div>
        )}

        {!showGift && pets.length > 0 && activePet && (
          <div {...swipeHandlers} className="text-center w-full">
            <div className="relative">
              {pets.length > 1 && (
                <div className="absolute top-1/2 -translate-y-1/2 left-2 text-rpg-gold/50">◀</div>
              )}
              {pets.length > 1 && (
                <div className="absolute top-1/2 -translate-y-1/2 right-2 text-rpg-gold/50">▶</div>
              )}
              <img 
                src={getPetImage(activePet)} 
                alt={`${activePet.animal} - ${activePet.stage}`}
                className={`w-64 h-64 object-contain mx-auto drop-shadow-2xl ${(activePet.stage === 'egg' || activePet.stage === 'egg_cracked') ? 'egg-wiggle' : ''}`}
                onError={(e) => {
                  e.target.src = 'https://placehold.co/300x300/2d1b3c/e4b363?text=🐣';
                }}
              />
            </div>
            
            <h2 className="text-3xl font-rpg text-rpg-gold mt-4 capitalize">
              {(activePet.stage === 'egg' || activePet.stage === 'egg_cracked') ? (
                `Huevo misterioso - ${getAnimalRarity(activePet.animal)}`
              ) : (
                `${getAnimalNameInSpanish(activePet.animal)} ${getStageInSpanish(activePet.stage)}`
              )}
            </h2>
            
            <div className="flex justify-center gap-2 mt-2">
              {pets.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => changePet(idx)}
                  className={`w-3 h-3 rounded-full transition-all ${
                    idx === activeIndex ? 'bg-rpg-gold w-6' : 'bg-gray-500'
                  }`}
                />
              ))}
            </div>
            
            <p className="text-gray-300 mt-4">
              {activePet.stage === 'egg' && 'Parede que aún le falta para eclosionar...'}
              {activePet.stage === 'egg_cracked' && 'Parede que está a punto de eclosionar...'}
              {activePet.stage === 'baby' && 'Tu mascota está creciendo'}
              {activePet.stage === 'adult' && 'Tu mascota ha alcanzado su etapa adulta'}
            </p>
            
            {pets.length > 1 && (
              <p className="text-gray-400 text-sm mt-2">Desliza para cambiar de mascota</p>
            )}
          </div>
        )}
      </div>
      {/* Botón flotante para abrir tienda */}
      <button
        onClick={() => setShowShop(true)}
        className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 bg-rpg-gold hover:bg-yellow-500 text-rpg-dark w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110"
      >
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-1.5 6M17 13l1.5 6M9 21h6M12 18v3" />
        </svg>
      </button>
      

      {/* Modal de tienda */}
      {showShop && (
        <ShopModal 
          onClose={() => setShowShop(false)}
          refreshPets={refreshPets}
          activePetIndex={activeIndex}
        />
      )}
    </div>
  );
};

export default PetSection;