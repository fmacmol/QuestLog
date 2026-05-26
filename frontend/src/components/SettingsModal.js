import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const SettingsModal = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('profile');
  const { user, token } = useAuth();
  
  // Estados para cada pestaña
  const [username, setUsername] = useState(user?.username || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Estados para preferencias (desde localStorage)
  const [soundEnabled, setSoundEnabled] = useState(
    localStorage.getItem('questlog_sound_enabled') !== 'false'
  );
  const [confettiEnabled, setConfettiEnabled] = useState(
    localStorage.getItem('questlog_confetti_enabled') !== 'false'
  );
  const [animationEnabled, setAnimationEnabled] = useState(
    localStorage.getItem('questlog_animation_enabled') !== 'false'
  );
  const [theme, setTheme] = useState(
    localStorage.getItem('questlog_theme') || 'dark'
  );

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert('Las contraseñas no coinciden');
      return;
    }
    
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/update-profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          username,
          currentPassword,
          newPassword: newPassword || undefined
        })
      });
      
      if (res.ok) {
        alert('Perfil actualizado correctamente');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        const error = await res.json();
        alert(error.error || 'Error al actualizar perfil');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleSavePreferences = () => {
    localStorage.setItem('questlog_sound_enabled', soundEnabled);
    localStorage.setItem('questlog_confetti_enabled', confettiEnabled);
    localStorage.setItem('questlog_animation_enabled', animationEnabled);
    localStorage.setItem('questlog_theme', theme);
    
    // Aplicar tema
    if (theme === 'light') {
      document.documentElement.classList.add('light-mode');
    } else {
      document.documentElement.classList.remove('light-mode');
    }
    
    alert('Preferencias guardadas');
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-rpg-card border-2 border-rpg-gold rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-rpg-gold/30">
          <h2 className="text-2xl font-rpg text-rpg-gold">⚙️ Configuración</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ✕
          </button>
        </div>
        
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-48 bg-rpg-dark/50 border-r border-rpg-gold/30 p-4 space-y-2">
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                activeTab === 'profile' 
                  ? 'bg-rpg-gold/20 text-rpg-gold' 
                  : 'text-gray-300 hover:bg-rpg-gold/10'
              }`}
            >
              👤 Perfil
            </button>
            <button
              onClick={() => setActiveTab('palette')}
              className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                activeTab === 'palette' 
                  ? 'bg-rpg-gold/20 text-rpg-gold' 
                  : 'text-gray-300 hover:bg-rpg-gold/10'
              }`}
            >
              🎨 Paleta
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                activeTab === 'notifications' 
                  ? 'bg-rpg-gold/20 text-rpg-gold' 
                  : 'text-gray-300 hover:bg-rpg-gold/10'
              }`}
            >
              🔔 Notificaciones
            </button>
          </div>
          
          {/* Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {/* Perfil */}
            {activeTab === 'profile' && user && (
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <h3 className="text-xl font-bold text-rpg-gold mb-4">👤 Mi Perfil</h3>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Nombre de usuario</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full p-2 bg-rpg-dark/50 border border-rpg-gold/30 rounded text-white"
                  />
                </div>
                
                <div className="border-t border-rpg-gold/20 pt-4">
                  <h4 className="text-md font-bold text-rpg-gold mb-3">Cambiar contraseña</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Contraseña actual</label>
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full p-2 bg-rpg-dark/50 border border-rpg-gold/30 rounded text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Nueva contraseña</label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full p-2 bg-rpg-dark/50 border border-rpg-gold/30 rounded text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Confirmar nueva contraseña</label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full p-2 bg-rpg-dark/50 border border-rpg-gold/30 rounded text-white"
                      />
                    </div>
                  </div>
                </div>
                
                <button type="submit" className="btn-primary w-full py-2">
                  💾 Guardar cambios
                </button>
              </form>
            )}
            
            {/* Paleta (Temas) */}
            {activeTab === 'palette' && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-rpg-gold mb-4">🎨 Tema</h3>
                
                <div className="space-y-3">
                  <label className="flex items-center justify-between p-3 bg-rpg-dark/50 rounded-lg cursor-pointer">
                    <span className="text-gray-300">🌙 Modo oscuro</span>
                    <input
                      type="radio"
                      name="theme"
                      checked={theme === 'dark'}
                      onChange={() => setTheme('dark')}
                      className="w-4 h-4"
                    />
                  </label>
                  <label className="flex items-center justify-between p-3 bg-rpg-dark/50 rounded-lg cursor-pointer">
                    <span className="text-gray-300">☀️ Modo claro</span>
                    <input
                      type="radio"
                      name="theme"
                      checked={theme === 'light'}
                      onChange={() => setTheme('light')}
                      className="w-4 h-4"
                    />
                  </label>
                </div>
                
                <button
                  onClick={handleSavePreferences}
                  className="btn-primary w-full py-2 mt-4"
                >
                  💾 Aplicar tema
                </button>
              </div>
            )}
            
            {/* Notificaciones (Preferencias) */}
            {activeTab === 'notifications' && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-rpg-gold mb-4">🔔 Preferencias</h3>
                
                <label className="flex items-center justify-between p-3 bg-rpg-dark/50 rounded-lg cursor-pointer">
                  <span className="text-gray-300">🔊 Sonido al subir de nivel</span>
                  <input
                    type="checkbox"
                    checked={soundEnabled}
                    onChange={(e) => setSoundEnabled(e.target.checked)}
                    className="w-4 h-4"
                  />
                </label>
                
                <label className="flex items-center justify-between p-3 bg-rpg-dark/50 rounded-lg cursor-pointer">
                  <span className="text-gray-300">🎉 Confeti al subir de nivel</span>
                  <input
                    type="checkbox"
                    checked={confettiEnabled}
                    onChange={(e) => setConfettiEnabled(e.target.checked)}
                    className="w-4 h-4"
                  />
                </label>
                
                <label className="flex items-center justify-between p-3 bg-rpg-dark/50 rounded-lg cursor-pointer">
                  <span className="text-gray-300">✨ Animaciones de celebración</span>
                  <input
                    type="checkbox"
                    checked={animationEnabled}
                    onChange={(e) => setAnimationEnabled(e.target.checked)}
                    className="w-4 h-4"
                  />
                </label>
                
                <button
                  onClick={handleSavePreferences}
                  className="btn-primary w-full py-2 mt-4"
                >
                  💾 Guardar preferencias
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;