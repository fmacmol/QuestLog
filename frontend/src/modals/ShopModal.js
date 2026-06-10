import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const ShopModal = ({ onClose, onRefresh, activePetIndex }) => {
  const { user, token, updateUser } = useAuth();
  const { showToast } = useToast();
  const [items, setItems] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/shop/items`);
      const data = await res.json();
      setItems(data);
      setLoading(false);
    } catch (error) {
      console.error('Error cargando tienda:', error);
      setLoading(false);
    }
  };

  const buyItem = async (type, itemId) => {
    let url = '';
    let body = {};

    if (type === 'animal') {
      url = '/api/shop/buy-animal';
      body = { rarity: itemId };
    } else {
      showToast('Tipo de artículo no válido', 'error');
      return;
    }

    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}${url}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      
      if (res.ok) {
        showToast('Compra realizada con éxito', 'success');
        if (data.coins !== undefined) updateUser({ coins: data.coins });

        // Recargar perfil completo para actualizar mascotas
        const profileRes = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/profile`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const profileData = await profileRes.json();
        updateUser({
          stats: profileData.stats,
          completedChallenges: profileData.completedChallenges,
          coins: profileData.coins,
          pets: profileData.pets
        });

        if (onRefresh) onRefresh();
        onClose();
      } else {
        showToast(data.error || 'Error en la compra', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      showToast('Error al realizar la compra', 'error');
    }
  };

  if (loading) return <div className="text-center py-8">Cargando tienda...</div>;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-rpg-card border-2 border-rpg-gold rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-rpg-gold/30">
          <h2 className="text-2xl font-rpg text-rpg-gold">🐣 Tienda de Animales</h2>
          <div className="flex items-center gap-2">
            <span className="text-rpg-gold">💰 {user?.coins || 0} monedas</span>
            <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">✕</button>
          </div>
        </div>

        {/* Lista de huevos por rareza */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {items?.animals.map(animal => (
            <div key={animal.id} className="bg-rpg-dark/30 rounded-lg p-3 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-rpg-gold">{animal.name}</h3>
                <p className="text-sm text-gray-400">Rareza: {animal.rarity}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-rpg-gold">{animal.price}💰</span>
                <button onClick={() => buyItem('animal', animal.id)} className="btn-secondary text-sm px-3 py-1">
                  Comprar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ShopModal;