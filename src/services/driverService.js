// src/services/driverService.js - CORRECTED
import api from './api';

export const driverService = {
  // Get all drivers - FIXED
  getAllDrivers: async () => {
    try {
      const response = await api.get('/drivers');
      console.log('Driver Service Response:', response);
      console.log('Response data:', response.data);
      return response;  // Return the full response, not response.data
    } catch (error) {
      console.error('Error fetching drivers:', error);
      throw error;
    }
  },

  // Get driver by ID
  getDriverById: async (id) => {
    try {
      const response = await api.get(`/drivers/${id}`);
      return response;  // Return full response
    } catch (error) {
      console.error(`Error fetching driver ${id}:`, error);
      throw error;
    }
  },

  // Create new driver
  createDriver: async (driverData) => {
    try {
      const response = await api.post('/drivers', driverData);
      return response;  // Return full response
    } catch (error) {
      console.error('Error creating driver:', error);
      throw error;
    }
  },

  // Update driver
  updateDriver: async (id, driverData) => {
    try {
      const response = await api.put(`/drivers/${id}`, driverData);
      return response;  // Return full response
    } catch (error) {
      console.error(`Error updating driver ${id}:`, error);
      throw error;
    }
  },

  // Delete driver
  deleteDriver: async (id) => {
    try {
      const response = await api.delete(`/drivers/${id}`);
      return response;  // Return full response
    } catch (error) {
      console.error(`Error deleting driver ${id}:`, error);
      throw error;
    }
  }
};

export default driverService;
