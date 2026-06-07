import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';


const ShopModal = ({ onClose, onRefresh}) => {
  const { user, token, updateUser } = useAuth();
  const { showToast } = useToast();
  const [items, setItems] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('animals');

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

  const buyItem = async (type, itemId, petIndex = null) => {
    let url = '';
    let body = {};

    if (type === 'animal') {
      url = '/api/shop/buy-animal';
    } else if (type === 'background') {
      url = '/api/shop/buy-background';
      body = { petIndex, backgroundId: itemId };
    } else if (type === 'hat') {
      url = '/api/shop/buy-cosmetic';
      body = { type: 'hat', itemId };
    } else if (type === 'accessory') {
      url = '/api/shop/buy-cosmetic';
      body = { type: 'accessory', itemId };
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
        if (data.cosmetics !== undefined) updateUser({ cosmetics: data.cosmetics });
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
          <h2 className="text-2xl font-rpg text-rpg-gold">🛒 Tienda</h2>
          <div className="flex items-center gap-2">
            <span className="text-rpg-gold">💰 {user?.coins || 0} monedas</span>
            <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">✕</button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-rpg-gold/30">
          <button
            onClick={() => setActiveTab('animals')}
            className={`flex-1 py-2 font-bold transition-colors ${activeTab === 'animals' ? 'bg-rpg-gold/20 text-rpg-gold border-b-2 border-rpg-gold' : 'text-gray-400'}`}
          >
            🐣 Animales
          </button>
          <button
            onClick={() => setActiveTab('backgrounds')}
            className={`flex-1 py-2 font-bold transition-colors ${activeTab === 'backgrounds' ? 'bg-rpg-gold/20 text-rpg-gold border-b-2 border-rpg-gold' : 'text-gray-400'}`}
          >
            🖼️ Fondos
          </button>
          <button
            onClick={() => setActiveTab('cosmetics')}
            className={`flex-1 py-2 font-bold transition-colors ${activeTab === 'cosmetics' ? 'bg-rpg-gold/20 text-rpg-gold border-b-2 border-rpg-gold' : 'text-gray-400'}`}
          >
            🎩 Cosmética
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {activeTab === 'animals' && items?.animals.map(animal => (
            <div key={animal.id} className="bg-rpg-dark/30 rounded-lg p-3 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-rpg-gold">{animal.name}</h3>
                <p className="text-sm text-gray-400">Huevo misterioso</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-rpg-gold">{animal.price}💰</span>
                <button onClick={() => buyItem('animal', animal.id)} className="btn-secondary text-sm px-3 py-1">Comprar</button>
              </div>
            </div>
          ))}
          
          {activeTab === 'backgrounds' && items?.backgrounds.map(bg => (
            <div key={bg.id} className="bg-rpg-dark/30 rounded-lg p-3 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-rpg-gold">{bg.name}</h3>
                <p className="text-sm text-gray-400">Cambia el fondo de tu mascota</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-rpg-gold">{bg.price}💰</span>
                <button onClick={() => {
                  // Aquí deberías seleccionar qué mascota editar
                  const petIndex = prompt('¿A qué mascota quieres poner este fondo? (0, 1, 2...)');
                  if (petIndex !== null) buyItem('background', bg.id, parseInt(petIndex));
                }} className="btn-secondary text-sm px-3 py-1">Comprar</button>
              </div>
            </div>
          ))}
          
          {activeTab === 'cosmetics' && (
            <>
              <h3 className="text-md font-bold text-rpg-gold mt-2">Sombreros</h3>
              {items?.cosmetics.hats.map(hat => (
                <div key={hat.id} className="bg-rpg-dark/30 rounded-lg p-3 flex justify-between items-center">
                  <h3 className="font-bold text-gray-300">{hat.name}</h3>
                  <div className="flex items-center gap-4">
                    <span className="text-rpg-gold">{hat.price}💰</span>
                    <button onClick={() => buyItem('hat', hat.id)} className="btn-secondary text-sm px-3 py-1">Comprar</button>
                  </div>
                </div>
              ))}
              <h3 className="text-md font-bold text-rpg-gold mt-4">Accesorios</h3>
              {items?.cosmetics.accessories.map(acc => (
                <div key={acc.id} className="bg-rpg-dark/30 rounded-lg p-3 flex justify-between items-center">
                  <h3 className="font-bold text-gray-300">{acc.name}</h3>
                  <div className="flex items-center gap-4">
                    <span className="text-rpg-gold">{acc.price}💰</span>
                    <button onClick={() => buyItem('accessory', acc.id)} className="btn-secondary text-sm px-3 py-1">Comprar</button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShopModal;