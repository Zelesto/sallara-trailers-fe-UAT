// src/services/podService.js
import api from './api';

export const podService = {
  /**
   * Create a new POD
   * @param {Object} podData - POD data
   * @returns {Promise<Object>} Created POD
   */
  createPod: async (podData) => {
    try {
      const response = await api.post('/pods', podData);
      return response;
    } catch (error) {
      console.error('Error creating POD:', error);
      throw error;
    }
  },

  /**
   * Get PODs by Trip ID
   * @param {number|string} tripId - Trip ID
   * @returns {Promise<Array>} List of PODs for the trip
   */
  getPodsByTrip: async (tripId) => {
    try {
      const response = await api.get(`/pods/trip/${tripId}`);
      return Array.isArray(response) ? response : (response?.content || []);
    } catch (error) {
      console.error(`Error fetching PODs for trip ${tripId}:`, error);
      throw error;
    }
  },

  /**
   * Get POD by ID
   * @param {number|string} id - POD ID
   * @returns {Promise<Object>} POD object
   */
  getPodById: async (id) => {
    try {
      const response = await api.get(`/pods/${id}`);
      return response;
    } catch (error) {
      console.error(`Error fetching POD ${id}:`, error);
      throw error;
    }
  },

  /**
   * Update a POD
   * @param {number|string} id - POD ID
   * @param {Object} podData - Updated POD data
   * @returns {Promise<Object>} Updated POD
   */
  updatePod: async (id, podData) => {
    try {
      const response = await api.put(`/pods/${id}`, podData);
      return response;
    } catch (error) {
      console.error(`Error updating POD ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete a POD
   * @param {number|string} id - POD ID
   * @returns {Promise<Object>} Deletion response
   */
  deletePod: async (id) => {
    try {
      const response = await api.delete(`/pods/${id}`);
      return response;
    } catch (error) {
      console.error(`Error deleting POD ${id}:`, error);
      throw error;
    }
  },

  /**
   * Get all PODs (with pagination)
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Paginated PODs
   */
  getAllPods: async (params = {}) => {
    try {
      const response = await api.get('/pods', { params });
      if (response?.content !== undefined) {
        return response;
      }
      if (Array.isArray(response)) {
        return {
          content: response,
          totalElements: response.length,
          totalPages: 1,
          number: 0,
          size: response.length,
        };
      }
      return {
        content: response || [],
        totalElements: 0,
        totalPages: 1,
        number: 0,
        size: 0,
      };
    } catch (error) {
      console.error('Error fetching PODs:', error);
      throw error;
    }
  },

  /**
   * Search PODs
   * @param {string} searchTerm - Search term
   * @returns {Promise<Array>} List of matching PODs
   */
  searchPods: async (searchTerm) => {
    try {
      const response = await api.get('/pods/search', {
        params: { q: searchTerm }
      });
      return Array.isArray(response) ? response : (response?.content || []);
    } catch (error) {
      console.error('Error searching PODs:', error);
      throw error;
    }
  },

  /**
   * Update POD status
   * @param {number|string} id - POD ID
   * @param {string} status - New status
   * @returns {Promise<Object>} Updated POD
   */
  updatePodStatus: async (id, status) => {
    try {
      const response = await api.patch(`/pods/${id}/status`, { status });
      return response;
    } catch (error) {
      console.error(`Error updating POD status ${id}:`, error);
      throw error;
    }
  }
};

export default podService;
