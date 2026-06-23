// src/services/inventoryNotificationService.js
import api from './api';

export const inventoryNotificationService = {
  // Get low stock items - with fallback using inventory items
  getLowStockItems: async () => {
    try {
      // Try to fetch from the dedicated endpoint
      const response = await api.get('/inventory/items/low-stock');
      return response;
    } catch (error) {
      console.warn('Low stock endpoint not available, using fallback');
      // Fallback: Get all items and filter locally
      try {
        const itemsResponse = await api.get('/inventory/items?size=100');
        const items = itemsResponse?.content || itemsResponse || [];
        // Filter items that are low stock (quantity <= minLevel)
        const lowStockItems = items.filter(item => {
          const quantity = item.quantity || 0;
          const minLevel = item.minLevel || 0;
          return quantity <= minLevel;
        });
        return lowStockItems;
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
        return [];
      }
    }
  },

  // Get out of stock items
  getOutOfStockItems: async () => {
    try {
      const response = await api.get('/inventory/items/out-of-stock');
      return response;
    } catch (error) {
      console.warn('Out of stock endpoint not available, using fallback');
      try {
        const itemsResponse = await api.get('/inventory/items?size=100');
        const items = itemsResponse?.content || itemsResponse || [];
        const outOfStockItems = items.filter(item => (item.quantity || 0) <= 0);
        return outOfStockItems;
      } catch (fallbackError) {
        return [];
      }
    }
  },

  // Get stock alerts
  getStockAlerts: async () => {
    try {
      const response = await api.get('/inventory/alerts');
      return response;
    } catch (error) {
      console.warn('Stock alerts endpoint not available');
      return [];
    }
  }
};
