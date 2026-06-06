import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { safeFetch } from '../utils/errorHandler';

const PetSection = ({ onBack }) => {
  const { user, token } = useAuth();
  const { showToast } = useToast();
  const [pet, setPet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showGift, setShowGift] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Cargar estado de la mascota
  useEffect(() => {
    loadPet();
  }, []);

  const loadPet = async () => {
    try {
      const data = await safeFetch(
        `${process.env.REACT_APP_API_URL}/api/pet`,
        { headers: { 'Authorization': `Bearer ${token}` } },
        null,
        false
      );
      
      if (data.hasPet) {
        setPet(data.pet);
      } else {
        setShowGift(true);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error cargando mascota:', error);
      setLoading(false);
    }
  };

  const openGift = async () => {
    try {
      const data = await safeFetch(
        `${process.env.REACT_APP_API_URL}/api/pet/init`,
        { 
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        },
        showToast
      );
      
      if (data.success) {
        setPet(data.pet);
        setShowGift(false);
        showToast('🎁 ¡Felicidades! Tu huevo está listo para eclosionar', 'success');
      }
    } catch (error) {
      showToast('Error al obtener tu mascota', 'error');
    }
  };

  // Obtener la imagen según animal y etapa
  const getPetImage = () => {
    if (!pet) return null;
    if (pet.stage === 'egg') {
      return `/images/pets/egg_${pet.animal}.png`;
    }
    return `/images/pets/${pet.animal}_${pet.stage}.png`;
  };

  // Obtener fondo según background
  const getBackgroundImage = () => {
    if (!pet) return null;
    return `/images/backgrounds/${pet.background}.png`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-rpg-dark flex items-center justify-center">
        <div className="text-rpg-gold text-2xl animate-pulse">Cargando tu mascota...</div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-no-repeat relative"
      style={pet ? { backgroundImage: `url(${getBackgroundImage()})` } : { backgroundColor: '#1a1124' }}
    >
      {/* Overlay para que el texto sea legible */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Botón para volver atrás */}
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

        {/* Mascota */}
        {pet && (
          <div className="text-center">
            <img 
              src={getPetImage()} 
              alt={`${pet.animal} - ${pet.stage}`}
              className={`w-64 h-64 object-contain mx-auto drop-shadow-2xl ${pet.stage === 'egg' ? 'egg-wiggle' : ''}`}
              onError={(e) => {
                e.target.src = 'https://placehold.co/300x300/2d1b3c/e4b363?text=🐣';
              }}
            />
            <h2 className="text-3xl font-rpg text-rpg-gold mt-4 capitalize">
              {pet.animal} - {pet.stage === 'egg' ? 'Huevo' : pet.stage}
            </h2>
            <p className="text-gray-300 mt-2">
              {pet.stage === 'egg' && 'Pronto eclosionará...'}
              {pet.stage === 'baby' && 'Tu mascota está creciendo'}
              {pet.stage === 'adult' && 'Tu mascota ha alcanzado su forma final'}
            </p>
          </div>
        )}

      </div>

      {/* Barra inferior flotante y desplegable */}
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
    </div>
  );
};

export default PetSection;