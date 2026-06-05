import React, { useState } from 'react';

const PetSection = ({ onBack }) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-rpg-dark to-rpg-purple">
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

      {/* Contenido principal (vacío por ahora) */}
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <div className="text-center">
          <span className="text-8xl mb-4 block">🐾</span>
          <h1 className="text-4xl font-rpg text-rpg-gold mb-4">Tu Mascota</h1>
          <p className="text-gray-400">Aquí aparecerá tu compañero de aventuras...</p>
          <p className="text-gray-500 text-sm mt-2">(Próximamente)</p>
        </div>
      </div>

      {/* Barra inferior flotante y desplegable */}
      <div className="fixed bottom-0 left-0 right-0 z-40 flex justify-center pb-4">
        <div className="relative">
          {/* Botón para desplegar */}
          <button
            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
            className="bg-rpg-gold text-rpg-dark w-12 h-12 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform duration-200"
          >
            <svg 
              className={`w-6 h-6 transition-transform duration-300 ${isDrawerOpen ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Panel desplegable */}
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