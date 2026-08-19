// src/services/podService.js
import api from './api';

export const podService = {
  /**
   * Create a new POD with file upload - FIXED
   * @param {Object|FormData} podData - POD data or FormData
   * @param {File} file - Document file (optional)
   * @param {Function} onProgress - Progress callback (optional)
   * @returns {Promise<Object>} Created POD
   */
  createPod: async (podData, file = null, onProgress = null) => {
    try {
      let response;
      
      // Check if podData is already FormData (for direct upload)
      if (podData instanceof FormData) {
        console.log('📤 Creating POD with FormData directly');
        
        // ✅ FIX: Ensure tripId is a number in the FormData
        if (podData.has('tripId')) {
          const tripIdValue = podData.get('tripId');
          const numericTripId = parseInt(tripIdValue, 10);
          if (!isNaN(numericTripId) && numericTripId > 0) {
            podData.set('tripId', numericTripId);
            console.log(`✅ Converted tripId from "${tripIdValue}" to ${numericTripId}`);
          } else {
            console.error('❌ Invalid tripId in FormData:', tripIdValue);
            throw new Error('Invalid trip ID. Please select a valid trip.');
          }
        } else {
          console.error('❌ No tripId found in FormData');
          throw new Error('Trip ID is required. Please select a trip.');
        }
        
        // Log FormData contents
        console.log('📤 FormData contents:');
        for (let pair of podData.entries()) {
          if (pair[0] === 'file') {
            console.log(`  ${pair[0]}: ${pair[1].name} (${pair[1].size} bytes)`);
          } else {
            console.log(`  ${pair[0]}: ${pair[1]}`);
          }
        }
        
        response = await api.post('/pods', podData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: onProgress,
        });
      } else if (file) {
        // Use FormData with individual fields
        const formData = new FormData();
        
        // ✅ FIX: Ensure tripId is a number
        const tripIdValue = podData.tripId ? parseInt(podData.tripId, 10) : null;
        
        if (!tripIdValue || tripIdValue <= 0) {
          console.error('❌ Invalid tripId:', podData.tripId);
          throw new Error('Invalid trip ID. Please select a valid trip.');
        }
        
        // Log the data being sent
        console.log('📤 Creating POD with file:', file.name);
        console.log('📤 Trip ID:', tripIdValue);
        console.log('📤 Customer:', podData.customerName || 'Adhoc Customer');
        console.log('📤 Delivery Date:', podData.deliveryDate || new Date().toISOString().split('T')[0]);
        
        // Append individual fields as form-data
        formData.append('tripId', tripIdValue);
        formData.append('customerName', podData.customerName || 'Adhoc Customer');
        formData.append('deliveryDate', podData.deliveryDate || new Date().toISOString().split('T')[0]);
        formData.append('status', podData.status || 'PENDING');
        formData.append('notes', podData.notes || '');
        
        // Optional fields
        if (podData.receivedBy) formData.append('receivedBy', podData.receivedBy);
        if (podData.deliveryCondition) formData.append('deliveryCondition', podData.deliveryCondition);
        if (podData.qualityRating) formData.append('qualityRating', podData.qualityRating);
        if (podData.issuesFound) formData.append('issuesFound', podData.issuesFound);
        if (podData.additionalInfo) formData.append('additionalInfo', podData.additionalInfo);
        
        formData.append('file', file);
        
        // Log FormData contents for debugging
        console.log('📤 FormData contents:');
        for (let pair of formData.entries()) {
          if (pair[0] === 'file') {
            console.log(`  ${pair[0]}: ${pair[1].name} (${pair[1].size} bytes)`);
          } else {
            console.log(`  ${pair[0]}: ${pair[1]}`);
          }
        }
        
        response = await api.post('/pods', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: onProgress,
        });
      } else {
        // Send as JSON (no file)
        console.log('📤 Creating POD without file (JSON)');
        
        // ✅ FIX: Ensure tripId is a number
        const payload = {
          ...podData,
          tripId: podData.tripId ? parseInt(podData.tripId, 10) : null,
        };
        
        if (!payload.tripId || payload.tripId <= 0) {
          throw new Error('Invalid trip ID. Please select a valid trip.');
        }
        
        response = await api.post('/pods', payload);
      }
      
      console.log('✅ POD created successfully:', response);
      return response;
    } catch (error) {
      console.error('❌ Error creating POD:', error);
      
      // Enhanced error handling
      if (error.response) {
        console.error('   Status:', error.response.status);
        console.error('   Data:', error.response.data);
        
        let errorMessage = error.response.data?.message || error.response.data?.detail || 'Failed to create POD';
        
        if (error.response.status === 400) {
          if (error.response.data?.detail?.includes('tripId')) {
            errorMessage = 'Invalid trip ID. Please select a valid trip.';
          } else {
            errorMessage = error.response.data?.detail || 'Invalid data. Please check all fields.';
          }
        } else if (error.response.status === 409) {
          errorMessage = 'A POD already exists for this trip.';
        } else if (error.response.status === 413) {
          errorMessage = 'File too large. Maximum size is 10MB.';
        } else if (error.response.status === 415) {
          errorMessage = 'Unsupported file type. Please upload PDF, JPG, PNG, DOC, or DOCX.';
        }
        
        throw {
          ...error,
          userMessage: errorMessage,
          status: error.response.status
        };
      }
      
      throw error;
    }
  },

  /**
   * Create a new POD with individual fields (convenience method)
   */
  createPodWithFields: async (podData, file, onProgress) => {
    return podService.createPod(podData, file, onProgress);
  },

  /**
   * Scan POD from driver
   */
  scanPOD: async (scanData, file) => {
    try {
      const formData = new FormData();
      
      // ✅ FIX: Ensure tripId is a number
      const tripIdValue = scanData.tripId ? parseInt(scanData.tripId, 10) : null;
      if (!tripIdValue || tripIdValue <= 0) {
        throw new Error('Invalid trip ID. Please select a valid trip.');
      }
      
      formData.append('tripId', tripIdValue);
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
   */
  debriefPOD: async (id, debriefData) => {
    try {
      // Create a deep copy to avoid mutating the original
      const sanitizedData = JSON.parse(JSON.stringify(debriefData));
      
      // CRITICAL: Ensure issuesFound is always a string
      const issues = sanitizedData.issuesFound;
      
      if (issues !== undefined && issues !== null) {
        if (Array.isArray(issues)) {
          const filtered = issues.filter(item => item && String(item).trim());
          sanitizedData.issuesFound = filtered.length > 0 ? filtered.map(String).join(', ') : 'None';
        } else if (typeof issues === 'string') {
          const trimmed = issues.trim();
          sanitizedData.issuesFound = trimmed || 'None';
        } else {
          sanitizedData.issuesFound = String(issues) || 'None';
        }
      } else {
        sanitizedData.issuesFound = 'None';
      }
      
      // Ensure all required fields have defaults
      const defaults = {
        status: 'DELIVERED',
        receivedBy: 'System',
        qualityRating: 3,
        deliveryCondition: 'Good',
        debriefNotes: 'No Endorsements',
        additionalInfo: 'N/A',
        debriefedBy: 'System',
        notes: '',
        signature: ''
      };
      
      for (const [key, defaultValue] of Object.entries(defaults)) {
        if (!sanitizedData[key] || (typeof sanitizedData[key] === 'string' && !sanitizedData[key].trim())) {
          sanitizedData[key] = defaultValue;
        }
      }
      
      // Ensure qualityRating is a number
      if (sanitizedData.qualityRating) {
        sanitizedData.qualityRating = parseInt(sanitizedData.qualityRating) || 3;
      }
      
      console.log('📤 Sanitized debrief data:', JSON.stringify(sanitizedData, null, 2));
      
      const response = await api.post(`/pods/${id}/debrief`, sanitizedData);
      console.log(`✅ POD ${id} debriefed:`, response);
      return response;
    } catch (error) {
      console.error(`❌ Error debriefing POD ${id}:`, error);
      
      if (error.response) {
        console.error('❌ Status:', error.response.status);
        console.error('❌ Data:', error.response.data);
      }
      
      throw error;
    }
  },

  /**
   * Get PODs by Trip ID
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
   */
  updatePod: async (id, podData, file = null, onProgress = null) => {
    try {
      let response;
      
      if (file) {
        const formData = new FormData();
        
        // ✅ FIX: Ensure tripId is a number
        const tripIdValue = podData.tripId ? parseInt(podData.tripId, 10) : null;
        if (tripIdValue && tripIdValue > 0) {
          formData.append('tripId', tripIdValue);
        }
        
        formData.append('podData', JSON.stringify(podData));
        formData.append('file', file);
        
        response = await api.put(`/pods/${id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: onProgress,
        });
      } else {
        // ✅ FIX: Ensure tripId is a number in JSON payload
        const payload = {
          ...podData,
          tripId: podData.tripId ? parseInt(podData.tripId, 10) : null,
        };
        response = await api.put(`/pods/${id}`, payload);
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

  /**
   * Download POD document
   */
  downloadPod: async (id, onProgress = null) => {
    try {
      const timestamp = new Date().getTime();
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${api.defaults.baseURL}/pods/${id}/download?_t=${timestamp}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Failed to download document';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorData.detail || errorMessage;
        } catch (e) {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }
      
      const blob = await response.blob();
      console.log(`✅ POD ${id} downloaded successfully`);
      return { data: blob };
    } catch (error) {
      console.error(`❌ Error downloading POD ${id}:`, error);
      
      let errorMessage = 'Failed to download document';
      if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.status === 404) {
        errorMessage = 'Document not found. The file may have been deleted.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Authentication failed. Please log in again.';
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      }
      
      throw new Error(errorMessage);
    }
  },

  /**
   * Get POD document URL for viewing/downloading
   */
  getPodDocumentUrl: (id, download = false) => {
    const baseUrl = process.env.REACT_APP_API_URL || 'https://trailers-backend.onrender.com/api';
    const action = download ? 'download' : 'view';
    const timestamp = new Date().getTime();
    return `${baseUrl}/pods/${id}/${action}?_t=${timestamp}`;
  },

  /**
   * Upload POD document
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
   */
  reuploadPodFile: async (id, formData, onUploadProgress) => {
    try {
      console.log(`📤 Re-uploading file for POD ${id}`);
      
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
      
      if (error.response) {
        console.error('   Status:', error.response.status);
        console.error('   Data:', error.response.data);
        
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
        throw {
          ...error,
          userMessage: 'Network error. Please check your connection and try again.'
        };
      } else {
        throw {
          ...error,
          userMessage: 'An unexpected error occurred. Please try again.'
        };
      }
    }
  },

  /**
   * Get POD by POD number
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
