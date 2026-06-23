// src/services/loadService.js
import api from './api';

export const loadService = {
  // Get all loads with pagination
  getAllLoads: async (page = 0, size = 20, filters = {}) => {
    try {
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('size', size);
      if (filters.status) params.append('status', filters.status);
      if (filters.search) params.append('search', filters.search);
      
      const response = await api.get(`/loads?${params.toString()}`);
      return response;
    } catch (error) {
      console.error('Error fetching loads:', error);
      throw error;
    }
  },

  // Get load by number
  getLoadByNumber: async (loadNumber) => {
    try {
      const response = await api.get(`/loads/number/${loadNumber}`);
      return response;
    } catch (error) {
      console.error('Error fetching load:', error);
      throw error;
    }
  },

  // Get load by ID
  getLoadById: async (id) => {
    try {
      const response = await api.get(`/loads/${id}`);
      return response;
    } catch (error) {
      console.error('Error fetching load:', error);
      throw error;
    }
  },

  // Create new load
  createLoad: async (loadData) => {
    try {
      const response = await api.post('/loads', loadData);
      return response;
    } catch (error) {
      console.error('Error creating load:', error);
      throw error;
    }
  },

  // Update load
  updateLoad: async (id, loadData) => {
    try {
      const response = await api.put(`/loads/${id}`, loadData);
      return response;
    } catch (error) {
      console.error('Error updating load:', error);
      throw error;
    }
  },

  // Delete load
  deleteLoad: async (id) => {
    try {
      const response = await api.delete(`/loads/${id}`);
      return response;
    } catch (error) {
      console.error('Error deleting load:', error);
      throw error;
    }
  },

  // Get loads by customer
  getLoadsByCustomer: async (customerId) => {
    try {
      const response = await api.get(`/loads/customer/${customerId}`);
      return response;
    } catch (error) {
      console.error('Error fetching loads by customer:', error);
      throw error;
    }
  },

  // Get loads by status
  getLoadsByStatus: async (status) => {
    try {
      const response = await api.get(`/loads/status/${status}`);
      return response;
    } catch (error) {
      console.error('Error fetching loads by status:', error);
      throw error;
    }
  },

  // Smart merge trips
  smartMergeTrips: async (customerId, plannedDate) => {
    try {
      const response = await api.post(`/loads/smart-merge?customerId=${customerId}&plannedDate=${plannedDate}`);
      return response;
    } catch (error) {
      console.error('Error merging trips:', error);
      throw error;
    }
  },

  // Find merge candidates
  findMergeCandidates: async (customerId, plannedDate) => {
    try {
      const response = await api.get(`/loads/merge-candidates?customerId=${customerId}&plannedDate=${plannedDate}`);
      return response;
    } catch (error) {
      console.error('Error finding merge candidates:', error);
      throw error;
    }
  },

  // Add trips to load
  addTripsToLoad: async (loadNumber, tripIds) => {
    try {
      const response = await api.post(`/loads/${loadNumber}/trips`, tripIds);
      return response;
    } catch (error) {
      console.error('Error adding trips to load:', error);
      throw error;
    }
  },
};

export default loadService;
