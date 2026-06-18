// src/services/driverService.js
import api from './api/axiosConfig';

export const driverService = {
  /**
   * Get all drivers
   * @param {Object} params - Query parameters (page, size, sort, search)
   * @returns {Promise<Array>} List of drivers
   */
  getAllDrivers: async (params = {}) => {
    try {
      const response = await api.get('/drivers', { params });
      console.log('Driver Service Response:', response);
      
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
      console.error('Error fetching drivers:', error);
      throw error;
    }
  },

  /**
   * Get driver by ID
   * @param {number|string} id - Driver ID
   * @returns {Promise<Object>} Driver object
   */
  getDriverById: async (id) => {
    try {
      const response = await api.get(`/drivers/${id}`);
      return response;
    } catch (error) {
      console.error(`Error fetching driver ${id}:`, error);
      throw error;
    }
  },

  /**
   * Create a new driver
   * @param {Object} driverData - Driver data
   * @returns {Promise<Object>} Created driver
   */
  createDriver: async (driverData) => {
    try {
      console.log('Creating driver with data:', driverData);
      const response = await api.post('/drivers', driverData);
      console.log('Driver created successfully:', response);
      return response;
    } catch (error) {
      console.error('Error creating driver:', error);
      throw error;
    }
  },

  /**
   * Update an existing driver
   * @param {number|string} id - Driver ID
   * @param {Object} driverData - Updated driver data
   * @returns {Promise<Object>} Updated driver
   */
  updateDriver: async (id, driverData) => {
    try {
      const response = await api.put(`/drivers/${id}`, driverData);
      return response;
    } catch (error) {
      console.error(`Error updating driver ${id}:`, error);
      throw error;
    }
  },

  /**
   * Patch/Partially update a driver
   * @param {number|string} id - Driver ID
   * @param {Object} driverData - Partial driver data
   * @returns {Promise<Object>} Updated driver
   */
  patchDriver: async (id, driverData) => {
    try {
      const response = await api.patch(`/drivers/${id}`, driverData);
      return response;
    } catch (error) {
      console.error(`Error patching driver ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete a driver
   * @param {number|string} id - Driver ID
   * @returns {Promise<Object>} Deletion response
   */
  deleteDriver: async (id) => {
    try {
      const response = await api.delete(`/drivers/${id}`);
      return response;
    } catch (error) {
      console.error(`Error deleting driver ${id}:`, error);
      throw error;
    }
  },

  /**
   * Search drivers
   * @param {string} searchTerm - Search term
   * @returns {Promise<Array>} List of matching drivers
   */
  searchDrivers: async (searchTerm) => {
    try {
      const response = await api.get('/drivers/search', {
        params: { q: searchTerm }
      });
      return response || [];
    } catch (error) {
      console.error('Error searching drivers:', error);
      throw error;
    }
  },

  /**
   * Get drivers by status
   * @param {string} status - Driver status
   * @returns {Promise<Array>} List of drivers with given status
   */
  getDriversByStatus: async (status) => {
    try {
      const response = await api.get('/drivers/status', {
        params: { status }
      });
      return response || [];
    } catch (error) {
      console.error(`Error fetching drivers with status ${status}:`, error);
      throw error;
    }
  },

  /**
   * Get available drivers (not assigned to active trips)
   * @returns {Promise<Array>} List of available drivers
   */
  getAvailableDrivers: async () => {
    try {
      const response = await api.get('/drivers/available');
      return response || [];
    } catch (error) {
      console.error('Error fetching available drivers:', error);
      throw error;
    }
  },

  /**
   * Get driver by license number
   * @param {string} licenseNumber - Driver's license number
   * @returns {Promise<Object>} Driver object
   */
  getDriverByLicense: async (licenseNumber) => {
    try {
      const response = await api.get(`/drivers/license/${licenseNumber}`);
      return response;
    } catch (error) {
      console.error(`Error fetching driver by license ${licenseNumber}:`, error);
      throw error;
    }
  },

  /**
   * Update driver status
   * @param {number|string} id - Driver ID
   * @param {string} status - New status
   * @returns {Promise<Object>} Updated driver
   */
  updateDriverStatus: async (id, status) => {
    try {
      const response = await api.patch(`/drivers/${id}/status`, { status });
      return response;
    } catch (error) {
      console.error(`Error updating driver status ${id}:`, error);
      throw error;
    }
  },

  /**
   * Get driver trip history
   * @param {number|string} id - Driver ID
   * @param {Object} params - Query parameters (page, size, sort)
   * @returns {Promise<Object>} Paginated trip history
   */
  getDriverTripHistory: async (id, params = {}) => {
    try {
      const response = await api.get(`/drivers/${id}/trips`, { params });
      return response;
    } catch (error) {
      console.error(`Error fetching trip history for driver ${id}:`, error);
      throw error;
    }
  },

  /**
   * Get driver statistics
   * @param {number|string} id - Driver ID
   * @returns {Promise<Object>} Driver statistics
   */
  getDriverStatistics: async (id) => {
    try {
      const response = await api.get(`/drivers/${id}/statistics`);
      return response;
    } catch (error) {
      console.error(`Error fetching statistics for driver ${id}:`, error);
      throw error;
    }
  },

  /**
   * Get driver performance metrics
   * @param {number|string} id - Driver ID
   * @param {Object} params - Query parameters (fromDate, toDate)
   * @returns {Promise<Object>} Performance metrics
   */
  getDriverPerformance: async (id, params = {}) => {
    try {
      const response = await api.get(`/drivers/${id}/performance`, { params });
      return response;
    } catch (error) {
      console.error(`Error fetching performance for driver ${id}:`, error);
      throw error;
    }
  },

  /**
   * Verify driver license
   * @param {number|string} id - Driver ID
   * @returns {Promise<Object>} License verification result
   */
  verifyDriverLicense: async (id) => {
    try {
      const response = await api.post(`/drivers/${id}/verify-license`);
      return response;
    } catch (error) {
      console.error(`Error verifying license for driver ${id}:`, error);
      throw error;
    }
  },

  /**
   * Get drivers with expiring licenses
   * @param {number} daysThreshold - Days until expiry
   * @returns {Promise<Array>} List of drivers with expiring licenses
   */
  getExpiringLicenses: async (daysThreshold = 30) => {
    try {
      const response = await api.get('/drivers/license-expiring', {
        params: { days: daysThreshold }
      });
      return response || [];
    } catch (error) {
      console.error('Error fetching expiring licenses:', error);
      throw error;
    }
  }
};

export default driverService;
