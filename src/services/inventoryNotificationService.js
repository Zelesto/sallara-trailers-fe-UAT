// src/services/inventoryNotificationService.js
import api from './api';

export const inventoryNotificationService = {
  // Get low stock items
  getLowStockItems: async () => {
    try {
      const response = await api.get('/inventory/items/low-stock');
      return response;
    } catch (error) {
      console.error('Error fetching low stock items:', error);
      throw error;
    }
  },

  // Get out of stock items
  getOutOfStockItems: async () => {
    try {
      const response = await api.get('/inventory/items/out-of-stock');
      return response;
    } catch (error) {
      console.error('Error fetching out of stock items:', error);
      throw error;
    }
  },

  // Get stock alerts
  getStockAlerts: async () => {
    try {
      const response = await api.get('/inventory/alerts');
      return response;
    } catch (error) {
      console.error('Error fetching stock alerts:', error);
      throw error;
    }
  }
};
