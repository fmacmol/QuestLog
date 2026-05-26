import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const Settings = ({ onClose }) => {
  const { user, token, updateUser } = useAuth(); // Necesitarás crear updateUser en AuthContext
  const [activeTab, setActiveTab] = useState('profile');
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [username, setUsername] = useState(user?.username || '');
  const [message, setMessage] = useState({ text: '', type: '' });

  // Estados para preferencias (puedes guardarlas en localStorage)
  const [preferences, setPreferences] = useState({
    soundEnabled: localStorage.getItem('soundEnabled') !== 'false',
    confettiEnabled: localStorage.getItem('confettiEnabled') !== 'false',
    levelUpAnimationEnabled: localStorage.getItem('levelUpAnimationEnabled') !== 'false',
    theme: localStorage.getItem('theme') || 'dark'
  });

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ text: 'Las contraseñas no coinciden', type: 'error' });
      return;
    }
    // Aquí llamarías a tu API para cambiar contraseña
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });
      if (res.ok) {
        setMessage({ text: 'Contraseña actualizada correctamente', type: 'success' });
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        const error = await res.json();
        setMessage({ text: error.error || 'Error al cambiar contraseña', type: 'error' });
      }
    } catch (error) {
      setMessage({ text: 'Error de conexión', type: 'error' });
    }
  };

  const handleUsernameChange = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/change-username`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ username })
      });
      if (res.ok) {
        setMessage({ text: 'Nombre de usuario actualizado', type: 'success' });
        updateUser({ ...user, username });
      } else {
        const error = await res.json();
        setMessage({ text: error.error || 'Error al cambiar nombre', type: 'error' });
      }
    } catch (error) {
      setMessage({ text: 'Error de conexión', type: 'error' });
    }
  };

  const handlePreferenceChange = (key, value) => {
    const newPrefs = { ...preferences, [key]: value };
    setPreferences(newPrefs);
    localStorage.setItem(key, value);
    // Disparar evento para que otros componentes se enteren (opcional)
    window.dispatchEvent(new CustomEvent('preferenceChange', { detail: newPrefs }));
  };

  const toggleTheme = () => {
    const newTheme = preferences.theme === 'dark' ? 'light' : 'dark';
    handlePreferenceChange('theme', newTheme);
    document.documentElement.classList.toggle('light-mode', newTheme === 'light');
  };

  // Aplicar tema al cargar
  React.useEffect(() => {
    if (preferences.theme === 'light') {
      document.documentElement.classList.add('light-mode');
    } else {
      document.documentElement.classList.remove('light-mode');
    }
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-rpg-dark/95 backdrop-blur-sm overflow-auto">
      <div className="min-h-screen flex">
        {/* Barra lateral fija */}
        <aside className="w-64 bg-rpg-card border-r border-rpg-gold/30 flex flex-col">
          <div className="p-4 border-b border-rpg-gold/30">
            <h2 className="text-xl font-rpg text-rpg-gold">⚙️ Configuración</h2>
          </div>
          <nav className="flex-1 p-4 space-y-2">
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'profile'
                  ? 'bg-rpg-gold/20 text-rpg-gold'
                  : 'text-gray-400 hover:bg-rpg-dark/50'
              }`}
            >
              👤 Perfil
            </button>
            <button
              onClick={() => setActiveTab('palette')}
              className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'palette'
                  ? 'bg-rpg-gold/20 text-rpg-gold'
                  : 'text-gray-400 hover:bg-rpg-dark/50'
              }`}
            >
              🎨 Paleta
            </button>
            <button
              onClick={() => setActiveTab('preferences')}
              className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'preferences'
                  ? 'bg-rpg-gold/20 text-rpg-gold'
                  : 'text-gray-400 hover:bg-rpg-dark/50'
              }`}
            >
              🔊 Preferencias
            </button>
          </nav>
          <div className="p-4 border-t border-rpg-gold/30">
            <button
              onClick={onClose}
              className="w-full bg-red-500/20 hover:bg-red-500/40 text-red-400 px-4 py-2 rounded-lg transition-colors"
            >
              Cerrar
            </button>
          </div>
        </aside>

        {/* Contenido dinámico */}
        <main className="flex-1 p-8">
          {message.text && (
            <div className={`mb-4 p-3 rounded-lg ${
              message.type === 'error' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
            }`}>
              {message.text}
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="max-w-md">
              <h3 className="text-2xl font-rpg text-rpg-gold mb-6">👤 Perfil</h3>
              
              {/* Cambiar nombre de usuario */}
              <form onSubmit={handleUsernameChange} className="mb-8">
                <label className="block text-gray-300 mb-2">Nombre de usuario</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="flex-1 p-2 bg-rpg-dark/50 border border-rpg-gold/30 rounded text-white"
                    required
                  />
                  <button type="submit" className="btn-secondary">
                    Guardar
                  </button>
                </div>
              </form>

              {/* Cambiar contraseña */}
              <form onSubmit={handlePasswordChange}>
                <h4 className="text-lg font-rpg text-rpg-gold mb-4">Cambiar contraseña</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-300 mb-2">Contraseña actual</label>
                    <input
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      className="w-full p-2 bg-rpg-dark/50 border border-rpg-gold/30 rounded text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-2">Nueva contraseña</label>
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      className="w-full p-2 bg-rpg-dark/50 border border-rpg-gold/30 rounded text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-2">Confirmar nueva contraseña</label>
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      className="w-full p-2 bg-rpg-dark/50 border border-rpg-gold/30 rounded text-white"
                      required
                    />
                  </div>
                  <button type="submit" className="btn-primary">
                    Cambiar contraseña
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'palette' && (
            <div>
              <h3 className="text-2xl font-rpg text-rpg-gold mb-6">🎨 Paleta</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-300 mb-2">Tema</label>
                  <div className="flex gap-4">
                    <button
                      onClick={() => toggleTheme()}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        preferences.theme === 'dark'
                          ? 'bg-rpg-gold text-rpg-dark'
                          : 'bg-rpg-card text-gray-300'
                      }`}
                    >
                      🌙 Oscuro
                    </button>
                    <button
                      onClick={() => toggleTheme()}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        preferences.theme === 'light'
                          ? 'bg-rpg-gold text-rpg-dark'
                          : 'bg-rpg-card text-gray-300'
                      }`}
                    >
                      ☀️ Claro
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'preferences' && (
            <div>
              <h3 className="text-2xl font-rpg text-rpg-gold mb-6">🔊 Preferencias</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">🔊 Sonido al subir de nivel</span>
                  <button
                    onClick={() => handlePreferenceChange('soundEnabled', !preferences.soundEnabled)}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      preferences.soundEnabled ? 'bg-rpg-gold' : 'bg-gray-600'
                    } relative`}
                  >
                    <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                      preferences.soundEnabled ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">🎉 Confeti al subir de nivel</span>
                  <button
                    onClick={() => handlePreferenceChange('confettiEnabled', !preferences.confettiEnabled)}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      preferences.confettiEnabled ? 'bg-rpg-gold' : 'bg-gray-600'
                    } relative`}
                  >
                    <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                      preferences.confettiEnabled ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">✨ Animación de subida de nivel</span>
                  <button
                    onClick={() => handlePreferenceChange('levelUpAnimationEnabled', !preferences.levelUpAnimationEnabled)}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      preferences.levelUpAnimationEnabled ? 'bg-rpg-gold' : 'bg-gray-600'
                    } relative`}
                  >
                    <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                      preferences.levelUpAnimationEnabled ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Settings;