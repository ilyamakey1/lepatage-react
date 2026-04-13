/** Заголовки Authorization для fetch / XHR (тот же токен, что и у tRPC). */
export function getBearerToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('authToken');
}

export function authHeaders(): Record<string, string> {
  const t = getBearerToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}
