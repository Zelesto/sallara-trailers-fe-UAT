// src/services/vehicleService.js - FIXED
import api from './api';

export const vehicleService = {
  // Get all vehicles - Your backend returns array directly
  getAllVehicles: async () => {
    try {
      const response = await api.get('/vehicles');
      console.log('Vehicle Service Response:', response);

      // Your backend returns array directly, not in response.data
      // So we return the response itself
      return response;  // Keep as is - returns the array
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      throw error;
    }
  },

  // Get vehicle by ID
  getVehicleById: async (id) => {
    try {
      const response = await api.get(`/vehicles/${id}`);
      return response;  // Your backend likely returns object directly
    } catch (error) {
      console.error(`Error fetching vehicle ${id}:`, error);
      throw error;
    }
  },

  // Create new vehicle
  createVehicle: async (vehicleData) => {
    try {
      console.log('Creating vehicle with data:', vehicleData);
      const response = await api.post('/vehicles', vehicleData);
      console.log('Vehicle created successfully:', response);
      return response;  // Returns created vehicle object
    } catch (error) {
      console.error('Error creating vehicle:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      throw error;
    }
  },

  // Update vehicle
  updateVehicle: async (id, vehicleData) => {
    try {
      const response = await api.put(`/vehicles/${id}`, vehicleData);
      return response;  // Returns updated vehicle object
    } catch (error) {
      console.error(`Error updating vehicle ${id}:`, error);
      throw error;
    }
  },

  // Delete vehicle
  deleteVehicle: async (id) => {
    try {
      const response = await api.delete(`/vehicles/${id}`);
      return response;  // Returns success response
    } catch (error) {
      console.error(`Error deleting vehicle ${id}:`, error);
      throw error;
    }
  },

  // Search vehicles (if your backend supports it)
  searchVehicles: async (searchTerm) => {
    try {
      const response = await api.get('/vehicles/search', {
        params: { search: searchTerm }
      });
      return response;  // Returns array of vehicles
    } catch (error) {
      console.error('Error searching vehicles:', error);
      throw error;
    }
  }
};

export default vehicleService;
