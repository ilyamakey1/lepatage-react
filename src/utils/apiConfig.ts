// Определяем API URL динамически
export function getApiUrl(): string {
  // В production используем относительные пути для Vercel
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    
    // Если это Vercel или production
    if (host.includes('vercel.app') || host.includes('netlify.app') || process.env.NODE_ENV === 'production') {
      return '/api';
    }
    
    // В development используем порт 3001
    return `http://${host}:3001/api`;
  }
  
  // Fallback для SSR или других случаев
  return '/api';
}

// Также экспортируем для использования в других местах
export const API_URL = getApiUrl();