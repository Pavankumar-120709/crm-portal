import { apiFetch } from './client';
import { Challan } from '../types';

export const challanApi = {
  getChallans: async (params?: { status?: string; search?: string; page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.search) query.append('search', params.search);
    if (params?.page) query.append('page', String(params.page));
    if (params?.limit) query.append('limit', String(params.limit));

    const queryString = query.toString() ? `?${query.toString()}` : '';
    return apiFetch<Challan[]>(`/challans${queryString}`);
  },

  getChallanById: async (id: number) => {
    return apiFetch<Challan>(`/challans/${id}`);
  },

  createChallan: async (data: { customer_id: number; items: { product_id: number; quantity: number }[] }) => {
    return apiFetch<Challan>('/challans', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  confirmChallan: async (id: number) => {
    return apiFetch<Challan>(`/challans/${id}/confirm`, {
      method: 'POST',
    });
  },

  cancelChallan: async (id: number) => {
    return apiFetch<Challan>(`/challans/${id}/cancel`, {
      method: 'POST',
    });
  },
};
