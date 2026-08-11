import { ApiResponse } from '../types';

let BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Auto-append /api if user omitted it in VITE_API_URL
if (BASE_URL.startsWith('http')) {
  const cleanUrl = BASE_URL.replace(/\/+$/, '');
  if (!cleanUrl.endsWith('/api')) {
    BASE_URL = `${cleanUrl}/api`;
  } else {
    BASE_URL = cleanUrl;
  }
}

export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const token = localStorage.getItem('token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${BASE_URL}${normalizedEndpoint}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }

  return data as ApiResponse<T>;
}
