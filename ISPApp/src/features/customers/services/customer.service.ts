import axiosInstance from '../../../../config/axios';
import { Customer, CustomerListParams, CustomerListResponse } from '../types';

export const CustomerService = {
  getCustomers: async (params: CustomerListParams): Promise<CustomerListResponse> => {
    try {
      const response = await axiosInstance.get('/customers', { params });
      // Adapt response to ensure it matches our interface
      // The backend likely returns { items: [], total: 0, ... } or just [] depending on pagination implementation
      // Assuming standard paginated response for now based on web analysis
      return {
        data: response.data.items || response.data, 
        total: response.data.total || response.data.length,
        page: response.data.page || 1,
        pages: response.data.pages || 1,
      };
    } catch (error) {
      throw error;
    }
  },

  getCustomerById: async (id: string): Promise<Customer> => {
    const response = await axiosInstance.get(`/customers/${id}`);
    return response.data;
  },

  createCustomer: async (data: Partial<Customer>): Promise<Customer> => {
    const response = await axiosInstance.post('/customers', data);
    return response.data;
  },

  updateCustomer: async (id: string, data: Partial<Customer>): Promise<Customer> => {
    const response = await axiosInstance.put(`/customers/${id}`, data);
    return response.data;
  },
};
