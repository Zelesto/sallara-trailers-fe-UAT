// src/services/inventoryService.js
import api from './api';

export const inventoryService = {
  // Get all inventory items with optional filters
  getInventoryItems: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.category) params.append('category', filters.category);
      if (filters.search) params.append('search', filters.search);
      if (filters.status) params.append('status', filters.status);
      if (filters.locationId) params.append('locationId', filters.locationId);
      
      const queryString = params.toString();
      const url = queryString ? `/inventory/items?${queryString}` : '/inventory/items';
      
      const response = await api.get(url);
      return response;
    } catch (error) {
      console.error('Error fetching inventory items:', error);
      throw error;
    }
  },

  // Get single inventory item by ID
  getInventoryItemById: async (id) => {
    try {
      const response = await api.get(`/inventory/items/${id}`);
      return response;
    } catch (error) {
      console.error('Error fetching inventory item:', error);
      throw error;
    }
  },

  // Get inventory item by SKU
  getInventoryItemBySku: async (sku) => {
    try {
      const response = await api.get(`/inventory/items/sku/${sku}`);
      return response;
    } catch (error) {
      console.error('Error fetching inventory item by SKU:', error);
      throw error;
    }
  },

  // Create new inventory item
  createInventoryItem: async (data) => {
    try {
      const response = await api.post('/inventory/items', data);
      return response;
    } catch (error) {
      console.error('Error creating inventory item:', error);
      throw error;
    }
  },

  // Update inventory item
  updateInventoryItem: async (id, data) => {
    try {
      const response = await api.put(`/inventory/items/${id}`, data);
      return response;
    } catch (error) {
      console.error('Error updating inventory item:', error);
      throw error;
    }
  },

  // Delete inventory item
  deleteInventoryItem: async (id) => {
    try {
      const response = await api.delete(`/inventory/items/${id}`);
      return response;
    } catch (error) {
      console.error('Error deleting inventory item:', error);
      throw error;
    }
  },

  // Update inventory quantity
  updateInventoryQuantity: async (id, quantity, operation = 'SET') => {
    try {
      const response = await api.patch(`/inventory/items/${id}/quantity`, {
        quantity,
        operation // 'SET', 'ADD', 'SUBTRACT'
      });
      return response;
    } catch (error) {
      console.error('Error updating inventory quantity:', error);
      throw error;
    }
  },

  // Get all locations
  getLocations: async () => {
    try {
      const response = await api.get('/inventory/locations');
      return response;
    } catch (error) {
      console.error('Error fetching locations:', error);
      throw error;
    }
  },

  // Get location by ID
  getLocationById: async (id) => {
    try {
      const response = await api.get(`/inventory/locations/${id}`);
      return response;
    } catch (error) {
      console.error('Error fetching location:', error);
      throw error;
    }
  },

  // Create new location
  createLocation: async (data) => {
    try {
      const response = await api.post('/inventory/locations', data);
      return response;
    } catch (error) {
      console.error('Error creating location:', error);
      throw error;
    }
  },

  // Update location
  updateLocation: async (id, data) => {
    try {
      const response = await api.put(`/inventory/locations/${id}`, data);
      return response;
    } catch (error) {
      console.error('Error updating location:', error);
      throw error;
    }
  },

  // Delete location
  deleteLocation: async (id) => {
    try {
      const response = await api.delete(`/inventory/locations/${id}`);
      return response;
    } catch (error) {
      console.error('Error deleting location:', error);
      throw error;
    }
  },

  // Get inventory statistics
  getInventoryStats: async () => {
    try {
      const response = await api.get('/inventory/stats');
      return response;
    } catch (error) {
      console.error('Error fetching inventory stats:', error);
      throw error;
    }
  },

  // Get low stock items
  getLowStockItems: async (threshold = 10) => {
    try {
      const response = await api.get(`/inventory/items/low-stock?threshold=${threshold}`);
      return response;
    } catch (error) {
      console.error('Error fetching low stock items:', error);
      throw error;
    }
  }
};
