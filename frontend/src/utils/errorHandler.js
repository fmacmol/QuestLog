// src/utils/errorHandler.js

/**
 * Traduce errores técnicos a mensajes amigables en español
 * (sin emojis, porque el toast ya los añade según el tipo)
 */
export const translateError = (error) => {
  // Errores de red/conexión
  if (error.message === 'Failed to fetch') {
    return 'No se pudo conectar con el servidor. ¿El backend está funcionando?';
  }
  if (error.message.includes('NetworkError')) {
    return 'Error de red. Comprueba tu conexión a internet';
  }
  if (error.message.includes('timeout')) {
    return 'Tiempo de espera agotado. El servidor no responde';
  }
  
  // Errores de autenticación
  if (error.message === 'No autorizado' || error.message.includes('401')) {
    return 'Sesión expirada. Inicia sesión nuevamente';
  }
  if (error.message === 'Token inválido') {
    return 'Tu sesión ha expirado. Vuelve a iniciar sesión';
  }
  
  // Errores comunes de la app
  if (error.message.includes('Usuario o email ya existe')) {
    return 'El email o nombre de usuario ya está registrado';
  }
  if (error.message.includes('Email o contraseña incorrectos')) {
    return 'Email o contraseña incorrectos';
  }
  if (error.message.includes('password')) {
    return 'La contraseña debe tener al menos 6 caracteres';
  }
  
  // Errores HTTP
  if (error.message.includes('404')) {
    return 'Recurso no encontrado';
  }
  if (error.message.includes('500')) {
    return 'Error interno del servidor. Inténtalo más tarde';
  }
  
  return 'Error desconocido';
};

/**
 * Fetch con manejo de errores integrado
 */
export const safeFetch = async (url, options = {}) => {
  try {
    const response = await fetch(url, options);

    // Si el servidor responde, pero con un código de error (400, 401, 500, etc.)
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Error HTTP: ${response.status}`);
    }

    return await response.json();

  } catch (error) {
    // AQUÍ ESTÁ LA CLAVE: Capturamos el error de red nativo del navegador
    if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
      throw new Error("No se pudo conectar con el servidor. ¿El backend está funcionando?");
    }
    
    // Si es otro tipo de error, lo dejamos pasar
    throw error; 
  }
};

/**
 * Versión silenciosa (no muestra toasts automáticos)
 */
export const silentFetch = async (url, options, showToast = null) => {
  return safeFetch(url, options, showToast, false);
};