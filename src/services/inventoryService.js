// src/services/inventoryService.js
import api from './api';

export const inventoryService = {
  // =============================================
  // Inventory Items (If these endpoints exist)
  // =============================================
  
  // Get all inventory items
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

  // =============================================
  // Stock Movements (Matches your backend)
  // =============================================

  // Record a stock movement
  recordStockMovement: async (movementData) => {
    try {
      const response = await api.post('/inventory/recordMovement', movementData);
      return response;
    } catch (error) {
      console.error('Error recording stock movement:', error);
      throw error;
    }
  },

  // =============================================
  // Shrinkage Reports (Matches your backend)
  // =============================================

  // Get shrinkage report by ID
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
  // Locations (If these endpoints exist)
  // =============================================

  // Get all locations
  getLocations: async () => {
    try {
      const response = await api.get('/inventory/locations');
      return response;
    } catch (error) {
      console.error('Error fetching locations:', error);
      // Return mock data if endpoint doesn't exist yet
      return [
        { id: 1, name: 'Main Warehouse', type: 'WAREHOUSE', address: '123 Main St, Johannesburg' },
        { id: 2, name: 'Tyre Bay', type: 'STORAGE', address: '456 Side St, Johannesburg' },
        { id: 3, name: 'Workshop', type: 'WORKSHOP', address: '789 Service Rd, Johannesburg' },
      ];
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

  // =============================================
  // Inventory Statistics (If these endpoints exist)
  // =============================================

  // Get inventory statistics
  getInventoryStats: async () => {
    try {
      const response = await api.get('/inventory/stats');
      return response;
    } catch (error) {
      console.error('Error fetching inventory stats:', error);
      // Return mock stats if endpoint doesn't exist yet
      return {
        totalItems: 0,
        lowStockItems: 0,
        outOfStockItems: 0,
        totalValue: 0,
        categories: {}
      };
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
  },

  // =============================================
  // Helper Methods
  // =============================================

  // Format inventory item for display
  formatInventoryItem: (item) => {
    const status = item.quantity <= 0 ? 'Out of Stock' :
                   item.quantity <= item.minLevel ? 'Low Stock' : 'In Stock';
    
    return {
      ...item,
      status,
      formattedUnitCost: item.unitCost ? `R ${item.unitCost.toFixed(2)}` : 'R 0.00',
      formattedQuantity: `${item.quantity} ${item.unit}`,
      formattedMinLevel: `${item.minLevel} ${item.unit}`,
    };
  },

  // Calculate total inventory value
  calculateTotalValue: (items) => {
    return items.reduce((total, item) => {
      return total + (item.quantity || 0) * (item.unitCost || 0);
    }, 0);
  },

  // Get inventory by category
  getItemsByCategory: (items, category) => {
    return items.filter(item => item.category === category);
  },

  // Get inventory by location
  getItemsByLocation: (items, locationId) => {
    return items.filter(item => item.locationId === locationId);
  }
};

export default inventoryService;
