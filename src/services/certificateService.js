// src/services/certificateService.js
import api from './api';
import dayjs from 'dayjs';

/**
 * Format date for backend API
 */
const formatDateForBackend = (date) => {
  if (!date) return null;
  return dayjs(date).format('YYYY-MM-DD');
};

/**
 * Sanitize field values
 */
const sanitizeField = (value) => {
  if (value === undefined || value === null) return null;
  if (typeof value === 'string' && value.trim() === '') return null;
  return value;
};

/**
 * Unwrap response data
 */
const unwrap = (response) => {
  if (!response) return null;
  return response?.data !== undefined ? response.data : response;
};

/**
 * Build certificate payload with common fields
 */
const buildCertificatePayload = (data) => ({
  name: sanitizeField(data.name),
  number: sanitizeField(data.number),
  issueDate: formatDateForBackend(data.issueDate),
  expiryDate: formatDateForBackend(data.expiryDate),
  type: sanitizeField(data.type),
  vehicleId: data.vehicleId ? parseInt(data.vehicleId, 10) : null,
  notes: sanitizeField(data.notes),
  status: sanitizeField(data.status) || 'ACTIVE',
});

/**
 * Handle API errors consistently
 */
const handleApiError = (error, context = '') => {
  console.error(`❌ ${context}:`, error);
  
  let message = error.message || 'An unexpected error occurred';
  
  if (error.response?.data?.errors) {
    const errorMessages = Object.entries(error.response.data.errors)
      .map(([field, msg]) => `${field}: ${msg}`)
      .join(', ');
    message = `Validation errors: ${errorMessages}`;
  } else if (error.response?.data?.detail) {
    message = error.response.data.detail;
  } else if (error.response?.data?.message) {
    message = error.response.data.message;
  } else if (error.response?.status === 404) {
    message = 'Certificate not found';
  } else if (error.response?.status === 401) {
    message = 'Unauthorized - Please log in again';
  } else if (error.response?.status === 403) {
    message = 'Forbidden - You do not have permission';
  } else if (error.response?.status === 500) {
    message = 'Server error - Please try again later';
  }
  
  error.userMessage = message;
  return error;
};

/* ============================================================
   CERTIFICATE SERVICE
   ============================================================ */

export const certificateService = {

  /**
   * Get all certificates for a vehicle
   * @param {number|string} vehicleId - Vehicle ID
   */
  getCertificates: async (vehicleId) => {
    try {
      console.log(`📤 Fetching certificates for vehicle: ${vehicleId}`);
      const response = await api.get(`/vehicles/${vehicleId}/certificates`);
      const data = unwrap(response);
      
      if (Array.isArray(data)) {
        return data;
      }
      if (data?.content && Array.isArray(data.content)) {
        return data.content;
      }
      return data || [];
    } catch (error) {
      throw handleApiError(error, 'Fetching certificates');
    }
  },

  /**
   * Get a single certificate by ID
   * @param {number|string} id - Certificate ID
   */
  getCertificateById: async (id) => {
    try {
      console.log(`📤 Fetching certificate with ID: ${id}`);
      const response = await api.get(`/vehicles/certificates/${id}`);
      const data = unwrap(response);
      return data;
    } catch (error) {
      throw handleApiError(error, `Fetching certificate ${id}`);
    }
  },

  /**
   * Add a certificate to a vehicle
   * @param {number|string} vehicleId - Vehicle ID
   * @param {Object} data - Certificate data
   */
  addCertificate: async (vehicleId, data) => {
    try {
      const payload = buildCertificatePayload({ ...data, vehicleId });
      console.log(`📤 Adding certificate to vehicle ${vehicleId}:`, payload);
      const response = await api.post(`/vehicles/${vehicleId}/certificates`, payload);
      const result = unwrap(response);
      console.log('✅ Certificate added:', result);
      return result;
    } catch (error) {
      throw handleApiError(error, 'Adding certificate');
    }
  },

  /**
   * Update a certificate
   * @param {number|string} vehicleId - Vehicle ID
   * @param {number|string} certificateId - Certificate ID
   * @param {Object} data - Updated certificate data
   */
  updateCertificate: async (vehicleId, certificateId, data) => {
    try {
      const payload = buildCertificatePayload({ ...data, vehicleId });
      console.log(`📤 Updating certificate ${certificateId}:`, payload);
      const response = await api.put(`/vehicles/${vehicleId}/certificates/${certificateId}`, payload);
      const result = unwrap(response);
      console.log('✅ Certificate updated:', result);
      return result;
    } catch (error) {
      throw handleApiError(error, `Updating certificate ${certificateId}`);
    }
  },

  /**
   * Delete a certificate
   * @param {number|string} vehicleId - Vehicle ID
   * @param {number|string} certificateId - Certificate ID
   */
  deleteCertificate: async (vehicleId, certificateId) => {
    try {
      console.log(`🗑️ Deleting certificate ${certificateId} from vehicle ${vehicleId}`);
      const response = await api.delete(`/vehicles/${vehicleId}/certificates/${certificateId}`);
      console.log('✅ Certificate deleted');
      return unwrap(response);
    } catch (error) {
      throw handleApiError(error, `Deleting certificate ${certificateId}`);
    }
  },

  /**
   * Verify a certificate
   * @param {number|string} certificateId - Certificate ID
   * @param {string} verifiedBy - Person verifying
   */
  verifyCertificate: async (certificateId, verifiedBy) => {
    try {
      console.log(`📤 Verifying certificate ${certificateId}`);
      const response = await api.post(`/vehicles/certificates/${certificateId}/verify`, null, {
        params: { verifiedBy }
      });
      const result = unwrap(response);
      console.log('✅ Certificate verified:', result);
      return result;
    } catch (error) {
      throw handleApiError(error, `Verifying certificate ${certificateId}`);
    }
  },

  /**
   * Get expiring certificates
   * @param {number|string} vehicleId - Vehicle ID
   * @param {number} days - Number of days threshold
   */
  getExpiringCertificates: async (vehicleId, days = 30) => {
    try {
      console.log(`📤 Fetching expiring certificates for vehicle ${vehicleId} within ${days} days`);
      const response = await api.get(`/vehicles/${vehicleId}/certificates/expiring`, {
        params: { days }
      });
      const data = unwrap(response);
      if (Array.isArray(data)) {
        return data;
      }
      return data || [];
    } catch (error) {
      throw handleApiError(error, 'Fetching expiring certificates');
    }
  },

  /**
   * Get certificate types
   */
  getCertificateTypes: async () => {
    try {
      console.log('📤 Fetching certificate types');
      const response = await api.get('/vehicles/certificates/types');
      const data = unwrap(response);
      if (Array.isArray(data)) {
        return data;
      }
      return data || [];
    } catch (error) {
      throw handleApiError(error, 'Fetching certificate types');
    }
  },
};

// ============================================================
// INDIVIDUAL EXPORTS
// ============================================================

export const {
  getCertificates,
  getCertificateById,
  addCertificate,
  updateCertificate,
  deleteCertificate,
  verifyCertificate,
  getExpiringCertificates,
  getCertificateTypes,
} = certificateService;

export default certificateService;
