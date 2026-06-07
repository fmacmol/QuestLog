import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const BackpackModal = ({ onClose }) => {
  const { user, token, updateUser } = useAuth();
  const { showToast } = useToast();
  const [pets, setPets] = useState([]);
  const [activePetIndex, setActivePetIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // Cargar datos una sola vez al montar el modal
  useEffect(() => {
    const loadData = async () => {
      try {
        // 1. Cargar perfil actualizado (para cosméticos)
        const profileRes = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/profile`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const profileData = await profileRes.json();
        
        // Solo actualizar si hay cambios (evita bucles)
        if (JSON.stringify(user?.cosmetics) !== JSON.stringify(profileData.cosmetics)) {
          updateUser({
            stats: profileData.stats,
            completedChallenges: profileData.completedChallenges,
            coins: profileData.coins,
            cosmetics: profileData.cosmetics
          });
        }

        // 2. Cargar mascotas
        const petsRes = await fetch(`${process.env.REACT_APP_API_URL}/api/pets`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const petsData = await petsRes.json();
        setPets(petsData.pets || []);
        setActivePetIndex(petsData.activeIndex || 0);
      } catch (error) {
        console.error('Error cargando datos:', error);
        showToast('Error al cargar la mochila', 'error');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [token, updateUser]); // Dependencias mínimas

  const changeBackground = async (backgroundId) => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/pets/change-background`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ petIndex: activePetIndex, backgroundId })
      });
      if (res.ok) {
        showToast('Fondo cambiado con éxito', 'success');
        // Actualizar el fondo en el estado local
        setPets(prevPets => {
          const newPets = [...prevPets];
          if (newPets[activePetIndex]) {
            newPets[activePetIndex].background = backgroundId;
          }
          return newPets;
        });
      } else {
        const error = await res.json();
        showToast(error.error || 'Error al cambiar fondo', 'error');
      }
    } catch (error) {
      showToast('Error al cambiar fondo', 'error');
    }
  };

  const equipCosmetic = async (type, itemId) => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/cosmetics/equip`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ type, itemId })
      });
      if (res.ok) {
        const data = await res.json();
        updateUser({ cosmetics: data.cosmetics });
        showToast('Cosmético equipado', 'success');
        // No cerrar el modal
      } else {
        const error = await res.json();
        showToast(error.error || 'Error al equipar', 'error');
      }
    } catch (error) {
      showToast('Error al equipar', 'error');
    }
  };

  const backgrounds = [
    { id: 'sea', name: 'Fondo Marino', emoji: '🌊' },
    { id: 'volcano', name: 'Fondo Volcánico', emoji: '🌋' },
    { id: 'ice', name: 'Fondo Helado', emoji: '❄️' }
  ];

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
        <div className="bg-rpg-card border-2 border-rpg-gold rounded-xl p-8">
          <p className="text-rpg-gold">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-rpg-card border-2 border-rpg-gold rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-rpg-gold/30">
          <h2 className="text-2xl font-rpg text-rpg-gold">🎒 Mochila</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Fondos */}
          <div>
            <h3 className="text-lg font-bold text-rpg-gold mb-3">🖼️ Fondos disponibles</h3>
            <div className="grid grid-cols-3 gap-3">
              {backgrounds.map(bg => (
                <button
                  key={bg.id}
                  onClick={() => changeBackground(bg.id)}
                  className="bg-rpg-dark/50 rounded-lg p-3 hover:bg-rpg-dark transition-colors"
                >
                  <div className="text-4xl mb-2">{bg.emoji}</div>
                  <p className="text-sm text-center">{bg.name}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Cosméticos - Sombreros */}
          <div>
            <h3 className="text-lg font-bold text-rpg-gold mb-3">🎩 Sombreros</h3>
            <div className="flex gap-3 flex-wrap">
              {user?.cosmetics?.owned?.hats?.map(hat => (
                <div key={hat} className="bg-rpg-dark/50 rounded-lg p-3">
                  <div className="text-3xl mb-1">{hat === 'sombrero' ? '🤠' : '👑'}</div>
                  <p className="text-xs text-center">{hat}</p>
                  <button
                    onClick={() => equipCosmetic('hat', hat)}
                    className="mt-2 text-xs text-rpg-gold hover:text-yellow-500 w-full"
                  >
                    Equipar
                  </button>
                </div>
              ))}
              {(!user?.cosmetics?.owned?.hats || user.cosmetics.owned.hats.length === 0) && (
                <p className="text-gray-400 text-sm">No tienes sombreros. ¡Compra en la tienda!</p>
              )}
            </div>
          </div>

          {/* Cosméticos - Accesorios */}
          <div>
            <h3 className="text-lg font-bold text-rpg-gold mb-3">⚔️ Accesorios</h3>
            <div className="flex gap-3 flex-wrap">
              {user?.cosmetics?.owned?.accessories?.map(acc => (
                <div key={acc} className="bg-rpg-dark/50 rounded-lg p-3">
                  <div className="text-3xl mb-1">{acc === 'espada' ? '🗡️' : '🛡️'}</div>
                  <p className="text-xs text-center">{acc}</p>
                  <button
                    onClick={() => equipCosmetic('accessory', acc)}
                    className="mt-2 text-xs text-rpg-gold hover:text-yellow-500 w-full"
                  >
                    Equipar
                  </button>
                </div>
              ))}
              {(!user?.cosmetics?.owned?.accessories || user.cosmetics.owned.accessories.length === 0) && (
                <p className="text-gray-400 text-sm">No tienes accesorios. ¡Compra en la tienda!</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BackpackModal;