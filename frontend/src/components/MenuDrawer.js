import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const MenuDrawer = ({ onOpenAuth, onMenuStateChange, onOpenSettings, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();

  const toggleMenu = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    onMenuStateChange?.(newState);
  };

  const closeMenu = () => {
    setIsOpen(false);
    onMenuStateChange?.(false);
  };

  return (
    <>
      {/* Botón hamburguesa */}
      <button
        onClick={toggleMenu}
        className="relative z-50 flex flex-col items-center justify-center w-10 h-10 rounded-lg focus:outline-none"
      >
        <span className={`block w-6 h-0.5 bg-rpg-gold transition-all duration-300 ${isOpen ? 'rotate-45 translate-y-2' : ''}`} />
        <span className={`block w-6 h-0.5 bg-rpg-gold my-1 transition-all duration-300 ${isOpen ? 'opacity-0' : ''}`} />
        <span className={`block w-6 h-0.5 bg-rpg-gold transition-all duration-300 ${isOpen ? '-rotate-45 -translate-y-2' : ''}`} />
      </button>

      {/* Overlay oscuro */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
          onClick={closeMenu}
        />
      )}

      {/* Panel lateral */}
      <div
        className={`fixed top-0 right-0 h-full w-64 bg-rpg-card border-l-4 border-rpg-gold z-40 transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col p-6 pt-20 space-y-4">
            <button className="w-full text-gray-300 hover:text-rpg-gold transition-colors">
                📊 Estadísticas
            </button>
            <button className="w-full text-gray-300 hover:text-rpg-gold transition-colors">
                🐶 Mascota
            </button>
            <button
              onClick={() => {
                // Abrir configuración
                onOpenSettings();
                closeMenu();
              }}
              className="w-full text-left px-4 py-2 text-gray-300 hover:bg-rpg-dark/50 rounded-lg transition-colors"
            >
                ⚙️ Configuración
            </button>
          {user ? (
            <>
              <div className="text-center pb-4 border-b border-rpg-gold/30">
                <span className="text-rpg-gold text-2xl">⚔️</span>
                <p className="text-white font-bold mt-1">{user.username}</p>
                <p className="text-gray-400 text-sm">{user.email}</p>
              </div>
              <button
                onClick={() => {
                  logout();
                  onLogout();
                  closeMenu();
                }}
                className="w-full bg-red-500/20 hover:bg-red-500/40 text-red-500 px-4 py-2 rounded-lg transition-colors"
              >
                Salir
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                onOpenAuth();
                closeMenu();
              }}
              className="w-full bg-rpg-gold/20 hover:bg-rpg-gold/40 text-rpg-gold px-4 py-2 rounded-lg transition-colors"
            >
              Iniciar Sesión / Registrarse
            </button>
          )}
        </div>
      </div>
    </>
  );
};

export default MenuDrawer;