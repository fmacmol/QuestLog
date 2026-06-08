import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const BackgroundsModal = ({ onClose, onSelectBackground }) => {
  const { user, token } = useAuth();
  const { showToast } = useToast();
  
  const ownedBackgrounds = user?.ownedBackgrounds || [];
  
  const backgrounds = {
    sea: { name: 'Fondo Marino', emoji: '🌊' },
    volcano: { name: 'Fondo Volcánico', emoji: '🌋' },
    ice: { name: 'Fondo Helado', emoji: '❄️' }
  };
  
  const changeBackground = async (backgroundId) => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/pets/change-background`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ backgroundId })
      });
      if (res.ok) {
        showToast('Fondo cambiado con éxito', 'success');
        onSelectBackground(backgroundId);
        onClose();
      } else {
        const error = await res.json();
        showToast(error.error || 'Error al cambiar fondo', 'error');
      }
    } catch (error) {
      showToast('Error al cambiar fondo', 'error');
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-rpg-card border-2 border-rpg-gold rounded-xl w-full max-w-md p-6">
        <h2 className="text-2xl font-rpg text-rpg-gold mb-4">🖼️ Mis Fondos</h2>
        <div className="space-y-2">
          {ownedBackgrounds.map(bgId => (
            <button
              key={bgId}
              onClick={() => changeBackground(bgId)}
              className="w-full bg-rpg-dark/50 rounded-lg p-3 hover:bg-rpg-dark transition-colors"
            >
              <div className="text-4xl mb-1">{backgrounds[bgId]?.emoji}</div>
              <p className="text-sm">{backgrounds[bgId]?.name}</p>
            </button>
          ))}
          {ownedBackgrounds.length === 0 && (
            <p className="text-gray-400">No tienes fondos. ¡Compra en la tienda!</p>
          )}
        </div>
        <button onClick={onClose} className="mt-4 btn-secondary w-full">Cerrar</button>
      </div>
    </div>
  );
};

export default BackgroundsModal;