// src/services/vehicleService.js
import api from './api';

export const vehicleService = {
  /**
   * Get all vehicles
   * @param {Object} params - Query parameters (page, size, sort, search)
   * @returns {Promise<Array>} List of vehicles
   */
  getAllVehicles: async (params = {}) => {
    try {
      const response = await api.get('/vehicles', { params });
      console.log('Vehicle Service Response:', response);
      
      // Handle different response structures
      if (response?.content !== undefined) {
        // Paginated response
        return response.content;
      }
      if (Array.isArray(response)) {
        // Direct array response
        return response;
      }
      return response || [];
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      throw error;
    }
  },

  /**
   * Get vehicle by ID
   * @param {number|string} id - Vehicle ID
   * @returns {Promise<Object>} Vehicle object
   */
  getVehicleById: async (id) => {
    try {
      const response = await api.get(`/vehicles/${id}`);
      return response;
    } catch (error) {
      console.error(`Error fetching vehicle ${id}:`, error);
      throw error;
    }
  },

  /**
   * Create a new vehicle
   * @param {Object} vehicleData - Vehicle data
   * @returns {Promise<Object>} Created vehicle
   */
  createVehicle: async (vehicleData) => {
    try {
      console.log('Creating vehicle with data:', vehicleData);
      const response = await api.post('/vehicles', vehicleData);
      console.log('Vehicle created successfully:', response);
      return response;
    } catch (error) {
      console.error('Error creating vehicle:', error);
      throw error;
    }
  },

  /**
   * Update an existing vehicle
   * @param {number|string} id - Vehicle ID
   * @param {Object} vehicleData - Updated vehicle data
   * @returns {Promise<Object>} Updated vehicle
   */
  updateVehicle: async (id, vehicleData) => {
    try {
      const response = await api.put(`/vehicles/${id}`, vehicleData);
      return response;
    } catch (error) {
      console.error(`Error updating vehicle ${id}:`, error);
      throw error;
    }
  },

  /**
   * Patch/Partially update a vehicle
   * @param {number|string} id - Vehicle ID
   * @param {Object} vehicleData - Partial vehicle data
   * @returns {Promise<Object>} Updated vehicle
   */
  patchVehicle: async (id, vehicleData) => {
    try {
      const response = await api.patch(`/vehicles/${id}`, vehicleData);
      return response;
    } catch (error) {
      console.error(`Error patching vehicle ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete a vehicle
   * @param {number|string} id - Vehicle ID
   * @returns {Promise<Object>} Deletion response
   */
  deleteVehicle: async (id) => {
    try {
      const response = await api.delete(`/vehicles/${id}`);
      return response;
    } catch (error) {
      console.error(`Error deleting vehicle ${id}:`, error);
      throw error;
    }
  },

  /**
   * Get vehicle by registration number
   * @param {string} registrationNumber - Vehicle registration
   * @returns {Promise<Object>} Vehicle object
   */
  getVehicleByRegistration: async (registrationNumber) => {
    try {
      const response = await api.get(`/vehicles/registration/${registrationNumber}`);
      return response;
    } catch (error) {
      console.error(`Error fetching vehicle by registration ${registrationNumber}:`, error);
      throw error;
    }
  },

  /**
   * Search vehicles
   * @param {string} searchTerm - Search term
   * @returns {Promise<Array>} List of matching vehicles
   */
  searchVehicles: async (searchTerm) => {
    try {
      const response = await api.get('/vehicles/search', {
        params: { q: searchTerm }
      });
      return response || [];
    } catch (error) {
      console.error('Error searching vehicles:', error);
      throw error;
    }
  },

  /**
   * Get vehicles by status
   * @param {string} status - Vehicle status
   * @returns {Promise<Array>} List of vehicles with given status
   */
  getVehiclesByStatus: async (status) => {
    try {
      const response = await api.get('/vehicles/status', {
        params: { status }
      });
      return response || [];
    } catch (error) {
      console.error(`Error fetching vehicles with status ${status}:`, error);
      throw error;
    }
  },

  /**
   * Get available vehicles (not assigned to active trips)
   * @returns {Promise<Array>} List of available vehicles
   */
  getAvailableVehicles: async () => {
    try {
      const response = await api.get('/vehicles/available');
      return response || [];
    } catch (error) {
      console.error('Error fetching available vehicles:', error);
      throw error;
    }
  },

  /**
   * Update vehicle status
   * @param {number|string} id - Vehicle ID
   * @param {string} status - New status
   * @returns {Promise<Object>} Updated vehicle
   */
  updateVehicleStatus: async (id, status) => {
    try {
      const response = await api.patch(`/vehicles/${id}/status`, { status });
      return response;
    } catch (error) {
      console.error(`Error updating vehicle status ${id}:`, error);
      throw error;
    }
  },

  /**
   * Get vehicle maintenance history
   * @param {number|string} id - Vehicle ID
   * @returns {Promise<Array>} List of maintenance records
   */
  getVehicleMaintenanceHistory: async (id) => {
    try {
      const response = await api.get(`/vehicles/${id}/maintenance`);
      return response || [];
    } catch (error) {
      console.error(`Error fetching maintenance history for vehicle ${id}:`, error);
      throw error;
    }
  },

  /**
   * Get vehicle statistics
   * @param {number|string} id - Vehicle ID
   * @returns {Promise<Object>} Vehicle statistics
   */
  getVehicleStatistics: async (id) => {
    try {
      const response = await api.get(`/vehicles/${id}/statistics`);
      return response;
    } catch (error) {
      console.error(`Error fetching statistics for vehicle ${id}:`, error);
      throw error;
    }
  },

  /**
   * Get vehicle trip history
   * @param {number|string} id - Vehicle ID
   * @param {Object} params - Query parameters (page, size, sort)
   * @returns {Promise<Object>} Paginated trip history
   */
  getVehicleTripHistory: async (id, params = {}) => {
    try {
      const response = await api.get(`/vehicles/${id}/trips`, { params });
      return response;
    } catch (error) {
      console.error(`Error fetching trip history for vehicle ${id}:`, error);
      throw error;
    }
  }
};

export default vehicleService;
