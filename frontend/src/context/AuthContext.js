import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setToken(storedToken);
      setUser({
        id: parsedUser.id,
        username: parsedUser.username,
        email: parsedUser.email,
        isAdmin: parsedUser.isAdmin || false
      });
    }
    
    setLoading(false);
  }, []);

  const login = (userData, authToken) => {
    console.log('🔐 Datos de usuario recibidos en login:', userData);
    const userForState = {
      id: userData._id || userData.id,
      username: userData.username,
      email: userData.email,
      isAdmin: userData.isAdmin || false
    };
    
    console.log('👤 Usuario guardado en estado:', userForState);

    setUser(userForState);
    setToken(authToken);
    localStorage.setItem('token', authToken);
    localStorage.setItem('user', JSON.stringify(userForState));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const value = {
    user,
    token,
    login,
    logout,
    loading,
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};