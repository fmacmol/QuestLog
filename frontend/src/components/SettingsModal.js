import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePreferences } from '../context/PreferencesContext';
import { useToast } from '../context/ToastContext';

const SettingsModal = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('profile');
  const { user, token } = useAuth();
  const { soundEnabled, confettiEnabled, animationEnabled, theme, savePreferences } = usePreferences();
  const { showToast } = useToast();
  
  // Estados para perfil
  const [username, setUsername] = useState(user?.username || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Estados locales para preferencias
  const [localSound, setLocalSound] = useState(soundEnabled);
  const [localConfetti, setLocalConfetti] = useState(confettiEnabled);
  const [localAnimation, setLocalAnimation] = useState(animationEnabled);
  const [localTheme, setLocalTheme] = useState(theme);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast('Las contraseñas no coinciden', 'error');
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
        showToast('Perfil actualizado correctamente', 'success');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        const error = await res.json();
        showToast(error.error || 'Error al actualizar perfil', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleSavePreferences = () => {
    savePreferences({
      soundEnabled: localSound,
      confettiEnabled: localConfetti,
      animationEnabled: localAnimation,
      theme: localTheme
    });
    showToast('Preferencias guardadas', 'success');
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
              🔔 Preferencias
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
                      checked={localTheme === 'dark'}
                      onChange={() => setLocalTheme('dark')}
                      className="w-4 h-4"
                    />
                  </label>
                  <label className="flex items-center justify-between p-3 bg-rpg-dark/50 rounded-lg cursor-pointer">
                    <span className="text-gray-300">☀️ Modo claro</span>
                    <input
                      type="radio"
                      name="theme"
                      checked={localTheme === 'light'}
                      onChange={() => setLocalTheme('light')}
                      className="w-4 h-4"
                    />
                  </label>
                </div>
                
                <button
                  onClick={handleSavePreferences}
                  className="btn-primary w-full py-2 mt-4"
                >
                  💾 Guardar preferencias
                </button>
              </div>
            )}
            
            {/* Preferencias */}
            {activeTab === 'notifications' && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-rpg-gold mb-4">🔔 Preferencias</h3>
                
                <label className="flex items-center justify-between p-3 bg-rpg-dark/50 rounded-lg cursor-pointer">
                  <span className="text-gray-300">🔊 Sonido al subir de nivel</span>
                  <input
                    type="checkbox"
                    checked={localSound}
                    onChange={(e) => setLocalSound(e.target.checked)}
                    className="w-4 h-4"
                  />
                </label>
                
                <label className="flex items-center justify-between p-3 bg-rpg-dark/50 rounded-lg cursor-pointer">
                  <span className="text-gray-300">🎉 Confeti al subir de nivel</span>
                  <input
                    type="checkbox"
                    checked={localConfetti}
                    onChange={(e) => setLocalConfetti(e.target.checked)}
                    className="w-4 h-4"
                  />
                </label>
                
                <label className="flex items-center justify-between p-3 bg-rpg-dark/50 rounded-lg cursor-pointer">
                  <span className="text-gray-300">✨ Animaciones de celebración</span>
                  <input
                    type="checkbox"
                    checked={localAnimation}
                    onChange={(e) => setLocalAnimation(e.target.checked)}
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