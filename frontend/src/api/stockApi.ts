import { apiFetch } from './client';
import { StockMovement } from '../types';

export const stockApi = {
  addMovement: async (data: { product_id: number; quantity: number; movement_type: 'IN' | 'OUT'; reason?: string }) => {
    return apiFetch<{ movement: StockMovement; newStock: number }>('/stock/movement', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getAllMovements: async (limit: number = 50) => {
    return apiFetch<StockMovement[]>(`/stock/movements?limit=${limit}`);
  },
};
