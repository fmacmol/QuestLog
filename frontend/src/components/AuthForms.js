import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { safeFetch } from '../utils/errorHandler';

const AuthForms = ({ onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const { showToast } = useToast();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const endpoint = isLogin ? 'login' : 'register';
    
    try {
      const data = await safeFetch(
        `${process.env.REACT_APP_API_URL}/api/auth/${endpoint}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        },
        showToast
      );
      
      // Éxito
      login(data.user, data.token);
      showToast(isLogin ? '✅ Sesión iniciada con éxito' : '✅ Registro exitoso', 'success');
      
      if (onClose) onClose();
      
    } catch (error) {
      // El error ya se mostró en safeFetch
      console.debug('Error en autenticación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-rpg-card border-4 border-rpg-gold rounded-xl p-8 max-w-md w-full">
        <h2 className="font-rpg text-3xl text-rpg-gold text-center mb-6">
          {isLogin ? '🔐 Iniciar Sesión' : '📝 Registrarse'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <input
              type="text"
              name="username"
              placeholder="Nombre de usuario"
              value={formData.username}
              onChange={handleChange}
              className="w-full p-3 bg-rpg-dark/50 border border-rpg-gold/30 rounded-lg text-white"
              required
            />
          )}
          
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            className="w-full p-3 bg-rpg-dark/50 border border-rpg-gold/30 rounded-lg text-white"
            required
          />
          
          <input
            type="password"
            name="password"
            placeholder="Contraseña"
            value={formData.password}
            onChange={handleChange}
            className="w-full p-3 bg-rpg-dark/50 border border-rpg-gold/30 rounded-lg text-white"
            required
          />
          
          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-3 text-lg"
          >
            {loading ? 'Procesando...' : isLogin ? 'Iniciar Sesión' : 'Registrarse'}
          </button>
        </form>
        
        <div className="mt-4 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-rpg-gold hover:underline"
          >
            {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
          </button>
        </div>
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default AuthForms;