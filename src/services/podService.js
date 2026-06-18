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
      console.log('✅ POD created successfully:', response);
      return response;
    } catch (error) {
      console.error('❌ Error creating POD:', error);
      
      // Handle specific error cases
      if (error.status === 409) {
        const errorMessage = error.data?.detail || 'The selected Trip does not exist or has already been finalized. Please select a valid trip.';
        throw {
          ...error,
          message: errorMessage,
          userMessage: errorMessage
        };
      }
      
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
      console.log(`✅ PODs for trip ${tripId}:`, response);
      return Array.isArray(response) ? response : (response?.content || []);
    } catch (error) {
      console.error(`❌ Error fetching PODs for trip ${tripId}:`, error);
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
      console.log(`✅ POD ${id}:`, response);
      return response;
    } catch (error) {
      console.error(`❌ Error fetching POD ${id}:`, error);
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
      console.log(`✅ POD ${id} updated:`, response);
      return response;
    } catch (error) {
      console.error(`❌ Error updating POD ${id}:`, error);
      
      if (error.status === 409) {
        const errorMessage = error.data?.detail || 'The selected Trip does not exist or has already been finalized.';
        throw {
          ...error,
          message: errorMessage,
          userMessage: errorMessage
        };
      }
      
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
      console.log(`✅ POD ${id} deleted:`, response);
      return response;
    } catch (error) {
      console.error(`❌ Error deleting POD ${id}:`, error);
      throw error;
    }
  },

  /**
   * Get all PODs (with pagination)
   * @param {Object} params - Query parameters (page, size, sort, status, search)
   * @returns {Promise<Object>} Paginated PODs
   */
  getAllPods: async (params = {}) => {
    try {
      console.log('📡 Fetching PODs with params:', params);
      const response = await api.get('/pods', { params });
      console.log('✅ getAllPods response:', response);
      
      // Handle different response structures
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
      console.error('❌ Error fetching PODs:', error);
      
      // If endpoint doesn't exist yet, return empty data
      if (error.status === 404) {
        console.warn('⚠️ POD endpoint not found, returning empty data');
        return {
          content: [],
          totalElements: 0,
          totalPages: 1,
          number: 0,
          size: 0,
        };
      }
      
      throw error;
    }
  },

  /**
   * Search PODs
   * @param {string} searchTerm - Search term
   * @param {Object} params - Additional query parameters
   * @returns {Promise<Array>} List of matching PODs
   */
  searchPods: async (searchTerm, params = {}) => {
    try {
      const response = await api.get('/pods/search', {
        params: { 
          q: searchTerm,
          ...params 
        }
      });
      console.log(`✅ Search PODs for "${searchTerm}":`, response);
      return Array.isArray(response) ? response : (response?.content || []);
    } catch (error) {
      console.error(`❌ Error searching PODs for "${searchTerm}":`, error);
      
      if (error.status === 404) {
        return [];
      }
      
      throw error;
    }
  },

  /**
   * Update POD status
   * @param {number|string} id - POD ID
   * @param {string} status - New status
   * @param {Object} options - Additional options (notes, etc.)
   * @returns {Promise<Object>} Updated POD
   */
  updatePodStatus: async (id, status, options = {}) => {
    try {
      const payload = { 
        status,
        ...options,
        updatedAt: new Date().toISOString()
      };
      const response = await api.patch(`/pods/${id}/status`, payload);
      console.log(`✅ POD ${id} status updated to ${status}:`, response);
      return response;
    } catch (error) {
      console.error(`❌ Error updating POD status ${id}:`, error);
      throw error;
    }
  },

  /**
   * Verify a POD
   * @param {number|string} id - POD ID
   * @param {string} verifiedBy - Person who verified
   * @param {string} notes - Verification notes
   * @returns {Promise<Object>} Updated POD
   */
  verifyPod: async (id, verifiedBy, notes = '') => {
    try {
      const response = await api.post(`/pods/${id}/verify`, {
        verifiedBy,
        notes,
        verifiedAt: new Date().toISOString(),
      });
      console.log(`✅ POD ${id} verified by ${verifiedBy}:`, response);
      return response;
    } catch (error) {
      console.error(`❌ Error verifying POD ${id}:`, error);
      throw error;
    }
  },

  /**
   * Reject a POD
   * @param {number|string} id - POD ID
   * @param {string} rejectedBy - Person who rejected
   * @param {string} reason - Rejection reason
   * @returns {Promise<Object>} Updated POD
   */
  rejectPod: async (id, rejectedBy, reason) => {
    try {
      const response = await api.post(`/pods/${id}/reject`, {
        rejectedBy,
        reason,
        rejectedAt: new Date().toISOString(),
      });
      console.log(`✅ POD ${id} rejected by ${rejectedBy}:`, response);
      return response;
    } catch (error) {
      console.error(`❌ Error rejecting POD ${id}:`, error);
      throw error;
    }
  },

  /**
   * Get POD statistics
   * @returns {Promise<Object>} POD statistics
   */
  getPodStatistics: async () => {
    try {
      const response = await api.get('/pods/statistics');
      console.log('✅ POD statistics:', response);
      return response;
    } catch (error) {
      console.error('❌ Error fetching POD statistics:', error);
      
      if (error.status === 404) {
        return {
          total: 0,
          pending: 0,
          delivered: 0,
          verified: 0,
          rejected: 0
        };
      }
      
      throw error;
    }
  },

  /**
   * Download POD document
   * @param {number|string} id - POD ID
   * @returns {Promise<Blob>} Document blob
   */
  downloadPod: async (id) => {
    try {
      const response = await api.get(`/pods/${id}/download`, {
        responseType: 'blob',
      });
      console.log(`✅ POD ${id} downloaded`);
      return response;
    } catch (error) {
      console.error(`❌ Error downloading POD ${id}:`, error);
      throw error;
    }
  },

  /**
   * Upload POD document
   * @param {number|string} id - POD ID
   * @param {File} file - Document file
   * @returns {Promise<Object>} Upload response
   */
  uploadPodDocument: async (id, file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await api.post(`/pods/${id}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      console.log(`✅ Document uploaded for POD ${id}:`, response);
      return response;
    } catch (error) {
      console.error(`❌ Error uploading document for POD ${id}:`, error);
      throw error;
    }
  },

  /**
   * Get POD by POD number
   * @param {string} podNumber - POD number
   * @returns {Promise<Object>} POD object
   */
  getPodByNumber: async (podNumber) => {
    try {
      const response = await api.get(`/pods/number/${podNumber}`);
      console.log(`✅ POD by number ${podNumber}:`, response);
      return response;
    } catch (error) {
      console.error(`❌ Error fetching POD by number ${podNumber}:`, error);
      throw error;
    }
  },

  /**
   * Get POD status history
   * @param {number|string} id - POD ID
   * @returns {Promise<Array>} Status history
   */
  getPodStatusHistory: async (id) => {
    try {
      const response = await api.get(`/pods/${id}/status-history`);
      console.log(`✅ POD ${id} status history:`, response);
      return Array.isArray(response) ? response : (response?.data || []);
    } catch (error) {
      console.error(`❌ Error fetching status history for POD ${id}:`, error);
      return [];
    }
  }
};

export default podService;
