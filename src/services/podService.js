// src/services/podService.js
import api from './api';

export const podService = {
  /**
   * Create a new POD with file upload
   * @param {Object} podData - POD data
   * @param {File} file - Document file (optional)
   * @returns {Promise<Object>} Created POD
   */
  createPod: async (podData, file = null) => {
    try {
      let response;
      
      if (file) {
        // Use FormData for file upload
        const formData = new FormData();
        formData.append('podData', JSON.stringify(podData));
        formData.append('file', file);
        
        response = await api.post('/pods/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        response = await api.post('/pods', podData);
      }
      
      console.log('✅ POD created successfully:', response);
      return response;
    } catch (error) {
      console.error('❌ Error creating POD:', error);
      
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
   * Scan POD from driver
   * @param {Object} scanData - Scan data including trip info and file
   * @param {File} file - Scanned document file
   * @returns {Promise<Object>} Created POD
   */
  scanPOD: async (scanData, file) => {
    try {
      const formData = new FormData();
      formData.append('tripId', scanData.tripId);
      formData.append('driverName', scanData.driverName || '');
      formData.append('deliveryDate', scanData.deliveryDate || new Date().toISOString().split('T')[0]);
      formData.append('customerName', scanData.customerName || '');
      formData.append('notes', scanData.notes || 'Scanned from driver');
      formData.append('file', file);
      
      const response = await api.post('/pods/scan', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      console.log('✅ POD scanned successfully:', response);
      return response;
    } catch (error) {
      console.error('❌ Error scanning POD:', error);
      throw error;
    }
  },

  /**
   * Debrief POD - process and update status
   * @param {number|string} id - POD ID
   * @param {Object} debriefData - Debrief data
   * @returns {Promise<Object>} Updated POD
   */
  debriefPOD: async (id, debriefData) => {
    try {
      const response = await api.post(`/pods/${id}/debrief`, debriefData);
      console.log(`✅ POD ${id} debriefed:`, response);
      return response;
    } catch (error) {
      console.error(`❌ Error debriefing POD ${id}:`, error);
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
   * @param {File} file - New document file (optional)
   * @returns {Promise<Object>} Updated POD
   */
  updatePod: async (id, podData, file = null) => {
    try {
      let response;
      
      if (file) {
        const formData = new FormData();
        formData.append('podData', JSON.stringify(podData));
        formData.append('file', file);
        
        response = await api.put(`/pods/${id}/upload`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        response = await api.put(`/pods/${id}`, podData);
      }
      
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
   * @param {string} dateRange - Date range filter
   * @returns {Promise<Object>} POD statistics
   */
  getPodStatistics: async (dateRange = 'today') => {
    try {
      const response = await api.get('/pods/statistics', {
        params: { dateRange }
      });
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
          rejected: 0,
          scannedToday: 0
        };
      }
      
      throw error;
    }
  },

  // src/services/podService.js

/**
 * Download POD document
 * @param {number|string} id - POD ID
 * @returns {Promise<Blob>} Document blob
 */
downloadPod: async (id) => {
  try {
    // Add a cache-busting parameter to prevent caching issues
    const timestamp = new Date().getTime();
    const response = await api.get(`/pods/${id}/download`, {
      responseType: 'blob',
      params: { _t: timestamp },
      // Don't use the default error handling that might cause session expiry
      validateStatus: (status) => status === 200,
    });
    
    console.log(`✅ POD ${id} downloaded successfully`);
    return response;
  } catch (error) {
    console.error(`❌ Error downloading POD ${id}:`, error);
    // Check if the error is a blob response with error message
    if (error.response && error.response.data instanceof Blob) {
      // Try to read the error message from the blob
      try {
        const text = await error.response.data.text();
        const errorData = JSON.parse(text);
        throw new Error(errorData.message || 'Failed to download document');
      } catch (e) {
        // If we can't parse the blob, throw a generic error
        throw new Error('Failed to download document. Please try again.');
      }
    }
    throw error;
  }
},

/**
 * Get POD document URL for viewing/downloading
 * @param {number|string} id - POD ID
 * @param {boolean} download - Whether to download or view
 * @returns {string} URL for the document
 */
getPodDocumentUrl: (id, download = false) => {
  const baseUrl = process.env.REACT_APP_API_URL || 'https://trailers-backend.onrender.com/api';
  const action = download ? 'download' : 'view';
  const timestamp = new Date().getTime();
  return `${baseUrl}/pods/${id}/${action}?_t=${timestamp}`;
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
    // Return empty array instead of throwing to prevent UI errors
    return [];
  }
},

  /**
   * Bulk scan PODs
   * @param {Array} scanDataList - List of scan data
   * @returns {Promise<Array>} Created PODs
   */
  bulkScanPODs: async (scanDataList) => {
    try {
      const response = await api.post('/pods/bulk-scan', scanDataList);
      console.log('✅ Bulk PODs scanned:', response);
      return response;
    } catch (error) {
      console.error('❌ Error bulk scanning PODs:', error);
      throw error;
    }
  },

  /**
   * Get scanned PODs for debriefing
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Scanned PODs
   */
  getScannedPODsForDebrief: async (params = {}) => {
    try {
      const response = await api.get('/pods/scanned-for-debrief', { params });
      console.log('✅ Scanned PODs for debrief:', response);
      return response;
    } catch (error) {
      console.error('❌ Error fetching scanned PODs for debrief:', error);
      
      if (error.status === 404) {
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
  }
};

export default podService;
