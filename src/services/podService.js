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
      // Use FormData with individual fields
      const formData = new FormData();
      
      // CRITICAL: Send each field individually, not as JSON
      const tripIdValue = podData.tripId ? parseInt(podData.tripId, 10) : null;
      
      // Log the data being sent for debugging
      console.log('📤 Sending podData fields:', {
        tripId: tripIdValue,
        customerName: podData.customerName || 'Adhoc Customer',
        deliveryDate: podData.deliveryDate || new Date().toISOString().split('T')[0],
        status: podData.status || 'PENDING',
        notes: podData.notes || '',
      });
      
      // Append individual fields
      formData.append('tripId', tripIdValue);
      formData.append('customerName', podData.customerName || 'Adhoc Customer');
      formData.append('deliveryDate', podData.deliveryDate || new Date().toISOString().split('T')[0]);
      formData.append('status', podData.status || 'PENDING');
      formData.append('notes', podData.notes || '');
      formData.append('file', file);
      
      response = await api.post('/pods', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    } else {
      // Send as JSON to /pods
      response = await api.post('/pods', podData);
    }
    
    console.log('✅ POD created successfully:', response);
    return response;
  } catch (error) {
    console.error('❌ Error creating POD:', error);
    throw error;
  }
},

  createPodWithFields: async (podData, file) => {
  try {
    const formData = new FormData();
    
    // CRITICAL: Send each field individually
    const tripIdValue = podData.tripId ? parseInt(podData.tripId, 10) : null;
    
    console.log('📤 Creating POD with fields:', {
      tripId: tripIdValue,
      customerName: podData.customerName,
      deliveryDate: podData.deliveryDate,
      file: file ? file.name : null
    });
    
    formData.append('tripId', tripIdValue);
    formData.append('customerName', podData.customerName || 'Adhoc Customer');
    formData.append('deliveryDate', podData.deliveryDate || new Date().toISOString().split('T')[0]);
    formData.append('status', podData.status || 'PENDING');
    formData.append('notes', podData.notes || '');
    formData.append('file', file);
    
    const response = await api.post('/pods', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    
    console.log('✅ POD created successfully:', response);
    return response;
  } catch (error) {
    console.error('❌ Error creating POD:', error);
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

 **
 * Debrief POD - process and update status
 * @param {number|string} id - POD ID
 * @param {Object} debriefData - Debrief data
 * @returns {Promise<Object>} Updated POD
 */
debriefPOD: async (id, debriefData) => {
  try {
    // CRITICAL: Sanitize the data before sending
    const sanitizedData = { ...debriefData };
    
    // Ensure issuesFound is always a string
    if (sanitizedData.issuesFound !== undefined && sanitizedData.issuesFound !== null) {
      if (Array.isArray(sanitizedData.issuesFound)) {
        // If it's an array, join with comma
        const filtered = sanitizedData.issuesFound.filter(item => item && item.trim());
        sanitizedData.issuesFound = filtered.length > 0 ? filtered.join(', ') : 'None';
      } else if (typeof sanitizedData.issuesFound === 'string') {
        // If it's a string, trim and set default if empty
        const trimmed = sanitizedData.issuesFound.trim();
        sanitizedData.issuesFound = trimmed || 'None';
      } else {
        // If it's anything else, convert to string
        sanitizedData.issuesFound = String(sanitizedData.issuesFound) || 'None';
      }
    } else {
      // If undefined or null, set default
      sanitizedData.issuesFound = 'None';
    }
    
    // Ensure other fields have defaults
    if (!sanitizedData.status) sanitizedData.status = 'DELIVERED';
    if (!sanitizedData.receivedBy) sanitizedData.receivedBy = 'System';
    if (!sanitizedData.qualityRating) sanitizedData.qualityRating = 3;
    if (!sanitizedData.deliveryCondition) sanitizedData.deliveryCondition = 'Good';
    if (!sanitizedData.debriefNotes) sanitizedData.debriefNotes = 'No Endorsements';
    if (!sanitizedData.additionalInfo) sanitizedData.additionalInfo = 'N/A';
    if (!sanitizedData.debriefedBy) sanitizedData.debriefedBy = 'System';
    
    // Log the sanitized data for debugging
    console.log('📤 Sanitized debrief data:', JSON.stringify(sanitizedData, null, 2));
    
    const response = await api.post(`/pods/${id}/debrief`, sanitizedData);
    console.log(`✅ POD ${id} debriefed:`, response);
    return response;
  } catch (error) {
    console.error(`❌ Error debriefing POD ${id}:`, error);
    console.error('❌ Error response:', error.response?.data);
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
        
        response = await api.put(`/pods/${id}`, formData, {
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

  // In podService.js - update the download method

/**
 * Download POD document
 * @param {number|string} id - POD ID
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<Blob>} Document blob
 */
downloadPod: async (id, onProgress = null) => {
  try {
    const timestamp = new Date().getTime();
    const token = localStorage.getItem('token');
    
    const response = await axios({
      method: 'GET',
      url: `${api.defaults.baseURL}/pods/${id}/download`,
      params: { _t: timestamp },
      responseType: 'blob',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      onDownloadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      },
    });
    
    console.log(`✅ POD ${id} downloaded successfully`);
    return response;
  } catch (error) {
    console.error(`❌ Error downloading POD ${id}:`, error);
    
    // Enhanced error handling
    if (error.response) {
      // Try to get error message from response
      try {
        const text = await error.response.data.text();
        if (text) {
          try {
            const errorData = JSON.parse(text);
            throw new Error(errorData.message || 'Failed to download document');
          } catch (e) {
            throw new Error(text || 'Failed to download document');
          }
        }
      } catch (e) {
        // If we can't parse the response
        if (error.response.status === 404) {
          throw new Error('Document not found. The file may have been deleted.');
        } else if (error.response.status === 401) {
          throw new Error('Authentication failed. Please log in again.');
        } else {
          throw new Error(`Download failed: ${error.response.status} ${error.response.statusText}`);
        }
      }
    } else if (error.request) {
      throw new Error('Network error. Please check your connection.');
    } else {
      throw error;
    }
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
   * Re-upload file for an existing POD
   * @param {number|string} id - POD ID
   * @param {FormData} formData - FormData with the file
   * @param {Function} onUploadProgress - Progress callback
   * @returns {Promise<Object>} Updated POD
   */
  reuploadPodFile: async (id, formData, onUploadProgress) => {
    try {
      console.log(`📤 Re-uploading file for POD ${id}`);
      
      // Log form data contents for debugging
      const fileEntry = formData.get('file');
      if (fileEntry instanceof File) {
        console.log(`   File: ${fileEntry.name}, Size: ${fileEntry.size} bytes, Type: ${fileEntry.type}`);
      } else {
        console.warn('⚠️ No file found in form data');
      }
      
      const response = await api.post(`/pods/${id}/reupload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onUploadProgress && typeof onUploadProgress === 'function') {
            onUploadProgress(progressEvent);
          }
          // Log progress if not handled by caller
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            console.log(`📊 Upload progress: ${percentCompleted}%`);
          }
        },
      });
      
      console.log(`✅ File re-uploaded successfully for POD ${id}:`, response);
      return response;
    } catch (error) {
      console.error(`❌ Error re-uploading file for POD ${id}:`, error);
      
      // Enhanced error handling
      if (error.response) {
        // The request was made and the server responded with a status code
        console.error('   Status:', error.response.status);
        console.error('   Data:', error.response.data);
        
        // Try to extract user-friendly message
        let errorMessage = error.response.data?.message || error.response.data || 'Failed to upload file';
        
        if (error.response.status === 413) {
          errorMessage = 'File too large. Maximum size is 10MB.';
        } else if (error.response.status === 400) {
          errorMessage = error.response.data || 'Invalid file format. Please upload a supported document type.';
        } else if (error.response.status === 404) {
          errorMessage = 'POD not found. Please refresh and try again.';
        } else if (error.response.status === 500) {
          errorMessage = 'Server error. Please try again later.';
        }
        
        throw {
          ...error,
          userMessage: errorMessage,
          status: error.response.status
        };
      } else if (error.request) {
        // The request was made but no response was received
        throw {
          ...error,
          userMessage: 'Network error. Please check your connection and try again.'
        };
      } else {
        // Something happened in setting up the request
        throw {
          ...error,
          userMessage: 'An unexpected error occurred. Please try again.'
        };
      }
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
