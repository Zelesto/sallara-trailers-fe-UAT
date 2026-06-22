// src/services/inventoryService.js
import api from './api';

export const inventoryService = {
  // =============================================
  // Inventory Items
  // =============================================

  // src/services/inventoryService.js - Update getInventoryItems

getInventoryItems: async (page = 0, size = 20, search = '') => {
  try {
    let response;
    if (search) {
      response = await api.get(`/inventory/items/search?search=${encodeURIComponent(search)}&page=${page}&size=${size}`);
    } else {
      response = await api.get(`/inventory/items?page=${page}&size=${size}`);
    }
    
    // The response should be the paginated object directly from the interceptor
    console.log('Inventory items response:', response);
    
    // If response has content, return the whole object
    if (response && response.content !== undefined) {
      return response;
    }
    
    // If response is already an array, wrap it
    if (Array.isArray(response)) {
      return {
        content: response,
        totalElements: response.length,
        totalPages: 1,
        size: response.length,
        number: 0,
        first: true,
        last: true,
        empty: response.length === 0
      };
    }
    
    // Fallback
    return { content: [], totalElements: 0, totalPages: 0, size: 0, number: 0 };
  } catch (error) {
    console.error('Error fetching inventory items:', error);
    throw error;
  }
},
  getInventoryItemById: async (id) => {
    try {
      const response = await api.get(`/inventory/items/${id}`);
      return response;
    } catch (error) {
      console.error('Error fetching inventory item:', error);
      throw error;
    }
  },

  getItemsByCategory: async (category) => {
    try {
      const response = await api.get(`/inventory/items/category/${category}`);
      return response;
    } catch (error) {
      console.error('Error fetching items by category:', error);
      throw error;
    }
  },

  getItemsByLocation: async (locationId) => {
    try {
      const response = await api.get(`/inventory/items/location/${locationId}`);
      return response;
    } catch (error) {
      console.error('Error fetching items by location:', error);
      throw error;
    }
  },

  getConsumableItems: async () => {
    try {
      const response = await api.get('/inventory/items/consumable');
      return response;
    } catch (error) {
      console.error('Error fetching consumable items:', error);
      throw error;
    }
  },

  createInventoryItem: async (data) => {
    try {
      const response = await api.post('/inventory/items', data);
      return response;
    } catch (error) {
      console.error('Error creating inventory item:', error);
      throw error;
    }
  },

  updateInventoryItem: async (id, data) => {
    try {
      const response = await api.put(`/inventory/items/${id}`, data);
      return response;
    } catch (error) {
      console.error('Error updating inventory item:', error);
      throw error;
    }
  },

  deleteInventoryItem: async (id) => {
    try {
      const response = await api.delete(`/inventory/items/${id}`);
      return response;
    } catch (error) {
      console.error('Error deleting inventory item:', error);
      throw error;
    }
  },

  // =============================================
  // Inventory Locations
  // =============================================

  getLocations: async () => {
    try {
      const response = await api.get('/inventory/locations');
      return response;
    } catch (error) {
      console.error('Error fetching locations:', error);
      throw error;
    }
  },

  getLocationById: async (id) => {
    try {
      const response = await api.get(`/inventory/locations/${id}`);
      return response;
    } catch (error) {
      console.error('Error fetching location:', error);
      throw error;
    }
  },

  createLocation: async (data) => {
    try {
      const response = await api.post('/inventory/locations', data);
      return response;
    } catch (error) {
      console.error('Error creating location:', error);
      throw error;
    }
  },

  updateLocation: async (id, data) => {
    try {
      const response = await api.put(`/inventory/locations/${id}`, data);
      return response;
    } catch (error) {
      console.error('Error updating location:', error);
      throw error;
    }
  },

  deleteLocation: async (id) => {
    try {
      const response = await api.delete(`/inventory/locations/${id}`);
      return response;
    } catch (error) {
      console.error('Error deleting location:', error);
      throw error;
    }
  },

  // =============================================
  // Stock Movements
  // =============================================

  recordStockMovement: async (movementData) => {
    try {
      const response = await api.post('/inventory/recordMovement', movementData);
      return response;
    } catch (error) {
      console.error('Error recording stock movement:', error);
      throw error;
    }
  },

  getMovementsByItem: async (itemId, page = 0, size = 20) => {
    try {
      const response = await api.get(`/inventory/movements/item/${itemId}?page=${page}&size=${size}`);
      return response;
    } catch (error) {
      console.error('Error fetching movements:', error);
      throw error;
    }
  },

  getMovementsByTrip: async (tripId) => {
    try {
      const response = await api.get(`/inventory/movements/trip/${tripId}`);
      return response;
    } catch (error) {
      console.error('Error fetching movements by trip:', error);
      throw error;
    }
  },

  getMovementsByFuelSlip: async (fuelSlipId) => {
    try {
      const response = await api.get(`/inventory/movements/fuel-slip/${fuelSlipId}`);
      return response;
    } catch (error) {
      console.error('Error fetching movements by fuel slip:', error);
      throw error;
    }
  },

  // =============================================
  // Shrinkage Reports
  // =============================================

  getShrinkageReport: async (id) => {
    try {
      const response = await api.get(`/inventory/shrinkage/${id}`);
      return response;
    } catch (error) {
      console.error('Error fetching shrinkage report:', error);
      throw error;
    }
  },

  // =============================================
  // Statistics
  // =============================================

  getInventoryStats: async () => {
    try {
      const response = await api.get('/inventory/stats');
      return response;
    } catch (error) {
      console.error('Error fetching inventory stats:', error);
      throw error;
    }
  }
};

export default inventoryService;
