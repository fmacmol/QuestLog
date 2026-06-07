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

  useEffect(() => {
    loadPets();
  }, []);

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
        showToast('🎁 ¡Felicidades! Tu huevo está listo', 'success');
      }
    } catch (error) {
      showToast('Error al obtener tu mascota', 'error');
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
        showToast(`🐾 Cambiaste a ${pets[newIndex].animal}`, 'info');
      }
    } catch (error) {
      showToast('Error al cambiar de mascota', 'error');
    }
  };

  // Handlers para swipe
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => changePet(activeIndex + 1),
    onSwipedRight: () => changePet(activeIndex - 1),
    preventDefaultTouchmoveEvent: true,
    trackMouse: true
  });

  const getPetImage = (pet) => {
    if (pet.stage === 'egg') {
      return `/images/pets/egg_${pet.animal}.png`;
    }
    return `/images/pets/${pet.animal}_${pet.stage}.png`;
  };

  const getBackgroundImage = (pet) => {
    return `/images/backgrounds/${pet.background}.png`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-rpg-dark flex items-center justify-center">
        <div className="text-rpg-gold text-2xl animate-pulse">Cargando tus mascotas...</div>
      </div>
    );
  }

  const activePet = pets[activeIndex];

  const refreshPets = async () => {
    const res = await fetch(`${process.env.REACT_APP_API_URL}/api/pets`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    setPets(data.pets);
    setActiveIndex(data.activeIndex || 0);
  };

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
        
        {/* Regalo */}
        {showGift && (
          <div className="text-center animate-bounce cursor-pointer" onClick={openGift}>
            <div className="text-9xl mb-4">🎁</div>
            <h2 className="text-3xl font-rpg text-rpg-gold mb-2">¡Tienes un regalo!</h2>
            <p className="text-gray-300">Haz clic para abrirlo</p>
          </div>
        )}

        {/* Carrusel */}
        {!showGift && pets.length > 0 && activePet && (
          <div {...swipeHandlers} className="text-center w-full">
            <div className="relative">
              {/* Indicador de que se puede deslizar */}
              {pets.length > 1 && (
                <div className="absolute top-1/2 -translate-y-1/2 left-2 text-rpg-gold/50">
                  ◀
                </div>
              )}
              {pets.length > 1 && (
                <div className="absolute top-1/2 -translate-y-1/2 right-2 text-rpg-gold/50">
                  ▶
                </div>
              )}
              <img 
                src={getPetImage(activePet)} 
                alt={`${activePet.animal} - ${activePet.stage}`}
                className={`w-64 h-64 object-contain mx-auto drop-shadow-2xl ${activePet.stage === 'egg' ? 'egg-wiggle' : ''}`}
                onError={(e) => {
                  e.target.src = 'https://placehold.co/300x300/2d1b3c/e4b363?text=🐣';
                }}
              />
            </div>
            
            <h2 className="text-3xl font-rpg text-rpg-gold mt-4 capitalize">
              {activePet.animal} - {activePet.stage === 'egg' ? 'Huevo' : activePet.stage}
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
              {activePet.stage === 'egg' && 'Pronto eclosionará...'}
              {activePet.stage === 'baby' && 'Tu mascota está creciendo'}
              {activePet.stage === 'adult' && 'Tu mascota ha alcanzado su forma final'}
            </p>
            
            {pets.length > 1 && (
              <p className="text-gray-400 text-sm mt-2">
                Desliza para cambiar de mascota
              </p>
            )}
          </div>
        )}

      </div>

      {/* Barra inferior flotante (igual que antes) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 flex justify-center pb-4">
        <div className="relative">
          <button
            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
            className="bg-rpg-gold text-rpg-dark w-12 h-12 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform duration-200"
          >
            <svg 
              className={`w-6 h-6 transition-transform duration-300 ${isDrawerOpen ? 'rotate-180' : ''}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <div
            className={`absolute bottom-16 left-1/2 transform -translate-x-1/2 bg-rpg-card border-2 border-rpg-gold rounded-xl shadow-2xl transition-all duration-300 overflow-hidden ${
              isDrawerOpen 
                ? 'w-64 opacity-100 visible pb-2' 
                : 'w-0 opacity-0 invisible'
            }`}
          >
            <div className="p-4 space-y-2">
              <p className="text-center text-rpg-gold font-bold mb-2">Opciones</p>
              <button className="w-full btn-secondary text-sm py-2" onClick={() => setShowShop(true)}>
                🛒 Tienda
              </button>
              <button className="w-full btn-secondary text-sm py-2">
                🎒 Mochila
              </button>
              <button className="w-full btn-secondary text-sm py-2">
                🍖 Alimentar
              </button>
              <button className="w-full btn-secondary text-sm py-2">
                🎽 Vestir
              </button>
              <button className="w-full btn-secondary text-sm py-2">
                💤 Descansar
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* Modal de tienda */}
      {showShop && (
        <ShopModal 
          onClose={() => setShowShop(false)}
          refreshPets={refreshPets} // Pasamos la función para refrescar las mascotas después de comprar
        />
      )}
    </div>
  );
};

export default PetSection;