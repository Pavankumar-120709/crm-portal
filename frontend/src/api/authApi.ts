import { apiFetch } from './client';
import { User } from '../types';

export const authApi = {
  login: async (email: string, password: string) => {
    return apiFetch<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  getMe: async () => {
    return apiFetch<User>('/auth/me');
  },
};
