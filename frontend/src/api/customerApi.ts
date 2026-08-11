import { apiFetch } from './client';
import { Customer } from '../types';

export const customerApi = {
  getCustomers: async (params?: { search?: string; status?: string; customer_type?: string; page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.status) query.append('status', params.status);
    if (params?.customer_type) query.append('customer_type', params.customer_type);
    if (params?.page) query.append('page', String(params.page));
    if (params?.limit) query.append('limit', String(params.limit));

    const queryString = query.toString() ? `?${query.toString()}` : '';
    return apiFetch<Customer[]>(`/customers${queryString}`);
  },

  getCustomerById: async (id: number) => {
    return apiFetch<Customer>(`/customers/${id}`);
  },

  createCustomer: async (data: Partial<Customer>) => {
    return apiFetch<Customer>('/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateCustomer: async (id: number, data: Partial<Customer>) => {
    return apiFetch<Customer>(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteCustomer: async (id: number) => {
    return apiFetch<null>(`/customers/${id}`, {
      method: 'DELETE',
    });
  },
};
