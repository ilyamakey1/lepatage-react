// Определяем API URL динамически
export function getApiUrl(): string {
  // В development используем текущий host, но порт 3001
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    return `http://${host}:3001/api`;
  }
  // Fallback для SSR или других случаев
  return 'http://localhost:3001/api';
}

// Также экспортируем для использования в других местах
export const API_URL = getApiUrl();