export const translateError = (error) => {
  // Errores de red/conexión
  if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
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
  
  // Si no coincide con nada, devolvemos el mensaje original del servidor o uno por defecto
  return error.message || 'Error desconocido';
};

/**
 * Fetch con manejo de errores integrado
 * AHORA ACEPTA showToast Y autoShowToast
 */
export const safeFetch = async (url, options = {}, showToast = null, autoShowToast = true) => {
  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      // Lanzamos el error original que manda tu backend
      throw new Error(errorData.error || errorData.message || `Error HTTP: ${response.status}`);
    }

    return await response.json();

  } catch (error) {
    // 1. Traducimos el error usando tu función centralizada
    const friendlyMessage = translateError(error);

    // 2. Si pasaste la función showToast y autoShowToast es true, disparamos la notificación
    if (showToast && autoShowToast) {
      showToast(friendlyMessage, 'error');
    }
    
    // 3. Volvemos a lanzar el error YA TRADUCIDO para que los catch de React lo lean bien
    throw new Error(friendlyMessage);
  }
};

/**
 * Versión silenciosa (no muestra toasts automáticos)
 */
export const silentFetch = async (url, options, showToast = null) => {
  return safeFetch(url, options, showToast, false);
};