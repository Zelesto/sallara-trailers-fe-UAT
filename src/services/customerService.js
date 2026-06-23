// src/services/customerService.js
import api from './api';

export const customerService = {
  // Get all customers with pagination
  getAllCustomers: async (page = 0, size = 20, filters = {}) => {
    try {
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('size', size);
      if (filters.search) params.append('search', filters.search);
      if (filters.status) params.append('status', filters.status);
      
      const response = await api.get(`/customers?${params.toString()}`);
      return response;
    } catch (error) {
      console.error('Error fetching customers:', error);
      throw error;
    }
  },

  // Get customer by ID
  getCustomerById: async (id) => {
    try {
      const response = await api.get(`/customers/${id}`);
      return response;
    } catch (error) {
      console.error('Error fetching customer:', error);
      throw error;
    }
  },

  // Get customer by code
  getCustomerByCode: async (customerCode) => {
    try {
      const response = await api.get(`/customers/code/${customerCode}`);
      return response;
    } catch (error) {
      console.error('Error fetching customer by code:', error);
      throw error;
    }
  },

  // Get active customers
  getActiveCustomers: async () => {
    try {
      const response = await api.get('/customers/active');
      return response;
    } catch (error) {
      console.error('Error fetching active customers:', error);
      throw error;
    }
  },

  // Search customers
  searchCustomers: async (searchTerm, page = 0, size = 20) => {
    try {
      const response = await api.get(`/customers/search?search=${encodeURIComponent(searchTerm)}&page=${page}&size=${size}`);
      return response;
    } catch (error) {
      console.error('Error searching customers:', error);
      throw error;
    }
  },

  // Create new customer
  createCustomer: async (customerData) => {
    try {
      const response = await api.post('/customers', customerData);
      return response;
    } catch (error) {
      console.error('Error creating customer:', error);
      throw error;
    }
  },

  // Update customer
  updateCustomer: async (id, customerData) => {
    try {
      const response = await api.put(`/customers/${id}`, customerData);
      return response;
    } catch (error) {
      console.error('Error updating customer:', error);
      throw error;
    }
  },

  // Delete customer
  deleteCustomer: async (id) => {
    try {
      const response = await api.delete(`/customers/${id}`);
      return response;
    } catch (error) {
      console.error('Error deleting customer:', error);
      throw error;
    }
  },

  // Get customer statistics
  getCustomerStats: async (customerId) => {
    try {
      const response = await api.get(`/customers/${customerId}/stats`);
      return response;
    } catch (error) {
      console.error('Error fetching customer stats:', error);
      throw error;
    }
  },

  // Get customer trips
  getCustomerTrips: async (customerId, page = 0, size = 20) => {
    try {
      const response = await api.get(`/customers/${customerId}/trips?page=${page}&size=${size}`);
      return response;
    } catch (error) {
      console.error('Error fetching customer trips:', error);
      throw error;
    }
  },

  // Get customer loads
  getCustomerLoads: async (customerId, page = 0, size = 20) => {
    try {
      const response = await api.get(`/customers/${customerId}/loads?page=${page}&size=${size}`);
      return response;
    } catch (error) {
      console.error('Error fetching customer loads:', error);
      throw error;
    }
  },

  // Get customer invoices
  getCustomerInvoices: async (customerId, page = 0, size = 20) => {
    try {
      const response = await api.get(`/customers/${customerId}/invoices?page=${page}&size=${size}`);
      return response;
    } catch (error) {
      console.error('Error fetching customer invoices:', error);
      throw error;
    }
  }
};

export default customerService;
