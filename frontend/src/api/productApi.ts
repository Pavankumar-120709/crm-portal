import { apiFetch } from './client';
import { Product, StockMovement } from '../types';

export const productApi = {
  getProducts: async (params?: { search?: string; category?: string; lowStock?: boolean; page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.category) query.append('category', params.category);
    if (params?.lowStock) query.append('lowStock', 'true');
    if (params?.page) query.append('page', String(params.page));
    if (params?.limit) query.append('limit', String(params.limit));

    const queryString = query.toString() ? `?${query.toString()}` : '';
    return apiFetch<Product[]>(`/products${queryString}`);
  },

  getProductById: async (id: number) => {
    return apiFetch<Product>(`/products/${id}`);
  },

  createProduct: async (data: Partial<Product>) => {
    return apiFetch<Product>('/products', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateProduct: async (id: number, data: Partial<Product>) => {
    return apiFetch<Product>(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteProduct: async (id: number) => {
    return apiFetch<null>(`/products/${id}`, {
      method: 'DELETE',
    });
  },

  getProductMovements: async (id: number) => {
    return apiFetch<StockMovement[]>(`/products/${id}/movements`);
  },
};
