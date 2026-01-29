export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
export const BASE_URL = API_URL.replace('/api', '');

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token') || sessionStorage.getItem('token');
}

export function getAuthHeaders(): HeadersInit {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const authHeaders = getAuthHeaders();
  
  const config: RequestInit = {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...options.headers,
    },
  };

  return fetch(`${API_URL}${endpoint}`, config);
}
