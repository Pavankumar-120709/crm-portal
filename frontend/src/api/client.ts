import { ApiResponse } from '../types';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const token = localStorage.getItem('token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    if (response.status === 401) {
      // Clear token on authentication failure
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }

  return data as ApiResponse<T>;
}
