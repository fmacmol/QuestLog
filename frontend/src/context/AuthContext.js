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
        isAdmin: parsedUser.isAdmin || false,
        stats: parsedUser.stats || { totalXP: 0, completedQuests: 0, completedChallenges: 0 },
        completedChallenges: parsedUser.completedChallenges || [],
        ownedBackgrounds: parsedUser.ownedBackgrounds || []
      });
    }
    
    setLoading(false);
  }, []);

  const login = (userData, authToken) => {
    const userForState = {
      id: userData._id || userData.id,
      username: userData.username,
      email: userData.email,
      isAdmin: userData.isAdmin || false,
      stats: userData.stats || { totalXP: 0, level: 1, completedQuests: 0, completedChallenges: 0 },
      completedChallenges: userData.completedChallenges || [],
      ownedBackgrounds: userData.ownedBackgrounds || []
    };
    
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

  const updateUser = (newUserData) => {
    setUser(prevUser => {
      const updated = { ...prevUser, ...newUserData };
      localStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
  };

  const refreshUserProfile = async () => {
    const response = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const updatedUser = await response.json();
    updateUser(updatedUser); 
  };

  const value = {
    user,
    token,
    login,
    logout,
    updateUser,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};