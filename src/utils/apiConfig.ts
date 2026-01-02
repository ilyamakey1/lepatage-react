// Определяем API URL динамически
export function getApiUrl(): string {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    
    // Если это Vercel или production - используем относительные пути
    if (host.includes('vercel.app') || host.includes('netlify.app') || process.env.NODE_ENV === 'production') {
      return '/api';
    }
    
    // В development используем тот же хост что и фронтенд, но порт 3001
    // Это позволяет работать и с localhost, и с IP адресом (для мобилки)
    return `http://${host}:3001/api`;
  }
  
  // Fallback
  return '/api';
}

// Также экспортируем для использования в других местах
export const API_URL = getApiUrl();
