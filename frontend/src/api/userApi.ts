import { apiFetch } from './client';
import { User, UserRole } from '../types';

export const userApi = {
  getUsers: async () => {
    return apiFetch<User[]>('/users');
  },

  createUser: async (data: { name: string; email: string; password: string; role: UserRole }) => {
    return apiFetch<User>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};
