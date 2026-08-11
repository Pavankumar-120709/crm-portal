import { apiFetch } from './client';
import { DashboardStats } from '../types';

export const dashboardApi = {
  getStats: async () => {
    return apiFetch<DashboardStats>('/dashboard/stats');
  },
};
