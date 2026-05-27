import React, { createContext, useState, useContext, useEffect } from 'react';

const PreferencesContext = createContext();

export const usePreferences = () => useContext(PreferencesContext);

export const PreferencesProvider = ({ children }) => {
  // Cargar preferencias desde localStorage
  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem('questlog_sound_enabled') !== 'false';
  });
  
  const [confettiEnabled, setConfettiEnabled] = useState(() => {
    return localStorage.getItem('questlog_confetti_enabled') !== 'false';
  });
  
  const [animationEnabled, setAnimationEnabled] = useState(() => {
    return localStorage.getItem('questlog_animation_enabled') !== 'false';
  });
  
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('questlog_theme') || 'dark';
  });

  // Aplicar tema al cargar
  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light-mode');
    } else {
      document.documentElement.classList.remove('light-mode');
    }
  }, [theme]);

  const savePreferences = (newPreferences) => {
    if (newPreferences.soundEnabled !== undefined) {
      setSoundEnabled(newPreferences.soundEnabled);
      localStorage.setItem('questlog_sound_enabled', newPreferences.soundEnabled);
    }
    if (newPreferences.confettiEnabled !== undefined) {
      setConfettiEnabled(newPreferences.confettiEnabled);
      localStorage.setItem('questlog_confetti_enabled', newPreferences.confettiEnabled);
    }
    if (newPreferences.animationEnabled !== undefined) {
      setAnimationEnabled(newPreferences.animationEnabled);
      localStorage.setItem('questlog_animation_enabled', newPreferences.animationEnabled);
    }
    if (newPreferences.theme !== undefined) {
      setTheme(newPreferences.theme);
      localStorage.setItem('questlog_theme', newPreferences.theme);
    }
  };

  const value = {
    soundEnabled,
    confettiEnabled,
    animationEnabled,
    theme,
    savePreferences
  };

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
};