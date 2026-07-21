// src/services/fuelService.js
import api from './api';
import dayjs from 'dayjs';

/* ============================================================
   UTILITY FUNCTIONS
   ============================================================ */

/**
 * Format date for backend API
 */
const formatDateForBackend = (date) => {
  if (!date) return null;
  return dayjs(date).format('YYYY-MM-DDTHH:mm:ss');
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
 * Handle API errors consistently
 */
const handleApiError = (error, context = '') => {
  console.error(`❌ ${context}:`, error);
  
  // Extract user-friendly error message
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
    message = 'Fuel slip not found';
  } else if (error.response?.status === 401) {
    message = 'Unauthorized - Please log in again';
  } else if (error.response?.status === 403) {
    message = 'Forbidden - You do not have permission';
  } else if (error.response?.status === 500) {
    message = 'Server error - Please try again later';
  }
  
  // Enhance error object with user-friendly message
  error.userMessage = message;
  return error;
};

/**
 * Build fuel slip payload with common fields
 */
const buildFuelSlipPayload = (data) => ({
  slipNumber: sanitizeField(data.slipNumber),
  transactionDate: formatDateForBackend(data.transactionDate),
  vehicleId: data.vehicleId ? parseInt(data.vehicleId, 10) : null,
  vehicleRegistration: sanitizeField(data.vehicleRegistration),
  driverId: data.driverId ? parseInt(data.driverId, 10) : null,
  driverName: sanitizeField(data.driverName),
  quantity: data.quantity ? parseFloat(data.quantity) : null,
  unitPrice: data.unitPrice ? parseFloat(data.unitPrice) : null,
  stationName: sanitizeField(data.stationName),
  location: sanitizeField(data.location),
  pumpNumber: sanitizeField(data.pumpNumber),
  notes: sanitizeField(data.notes),
  fuelType: sanitizeField(data.fuelType),
  paymentMethod: sanitizeField(data.paymentMethod),
  receiptNumber: sanitizeField(data.receiptNumber),
  odometerReading: data.odometerReading ? parseFloat(data.odometerReading) : null,
  tripId: data.tripId ? parseInt(data.tripId, 10) : null,
  loadId: data.loadId ? parseInt(data.loadId, 10) : null,
  fuelSourceId: data.fuelSourceId ? parseInt(data.fuelSourceId, 10) : null,
  finalized: data.finalized ?? false,
});

/* ============================================================
   FUEL SERVICE - MAIN EXPORT
   ============================================================ */

export const fuelService = {

  // ============================================================
  // CRUD OPERATIONS
  // ============================================================

  /**
   * Get all fuel slips with optional filters
   * @param {Object} filters - Filter parameters
   * @param {number} filters.driverId - Filter by driver ID
   * @param {number} filters.vehicleId - Filter by vehicle ID
   * @param {number} filters.tripId - Filter by trip ID
   * @param {number} filters.loadId - Filter by load ID
   * @param {string} filters.fuelType - Filter by fuel type
   * @param {string} filters.paymentMethod - Filter by payment method
   * @param {boolean} filters.finalized - Filter by finalized status
   */
  getFuelSlips: async (filters = {}) => {
    try {
      console.log('🔧 fuelService.getFuelSlips called with filters:', filters);
      
      // Build query params
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value);
        }
      });

      const url = `/fuel/slips${params.toString() ? `?${params.toString()}` : ''}`;
      console.log('🌐 Making API call to:', url);
      
      const response = await api.get(url);
      const data = unwrap(response);
      
      // Handle different response formats
      if (Array.isArray(data)) {
        return data;
      }
      if (data?.content && Array.isArray(data.content)) {
        return data.content;
      }
      if (data?.data && Array.isArray(data.data)) {
        return data.data;
      }
      
      return data || [];
    } catch (error) {
      throw handleApiError(error, 'Fetching fuel slips');
    }
  },

  /**
   * Get a single fuel slip by ID
   * @param {number|string} id - Fuel slip ID
   */
  getFuelSlipById: async (id) => {
    try {
      console.log(`📤 Fetching fuel slip with ID: ${id}`);
      const response = await api.get(`/fuel/slips/${id}`);
      const data = unwrap(response);
      console.log('✅ Fuel slip fetched:', data);
      return data;
    } catch (error) {
      throw handleApiError(error, `Fetching fuel slip ${id}`);
    }
  },

  /**
   * Create a new fuel slip
   * @param {Object} data - Fuel slip data
   */
  createFuelSlip: async (data) => {
    try {
      const payload = buildFuelSlipPayload(data);
      console.log('📤 Creating fuel slip with payload:', payload);
      const response = await api.post('/fuel/slips', payload);
      const result = unwrap(response);
      console.log('✅ Fuel slip created:', result);
      return result;
    } catch (error) {
      throw handleApiError(error, 'Creating fuel slip');
    }
  },

  /**
   * Update an existing fuel slip
   * @param {number|string} id - Fuel slip ID
   * @param {Object} data - Updated fuel slip data
   */
  updateFuelSlip: async (id, data) => {
    try {
      const payload = buildFuelSlipPayload(data);
      console.log(`📤 Updating fuel slip ${id} with payload:`, payload);
      const response = await api.put(`/fuel/slips/${id}`, payload);
      const result = unwrap(response);
      console.log('✅ Fuel slip updated:', result);
      return result;
    } catch (error) {
      throw handleApiError(error, `Updating fuel slip ${id}`);
    }
  },

  /**
   * Delete a fuel slip
   * @param {number|string} id - Fuel slip ID
   */
  deleteFuelSlip: async (id) => {
    try {
      console.log(`🗑️ Deleting fuel slip with ID: ${id}`);
      const response = await api.delete(`/fuel/slips/${id}`);
      console.log('✅ Fuel slip deleted');
      return unwrap(response);
    } catch (error) {
      throw handleApiError(error, `Deleting fuel slip ${id}`);
    }
  },

  // ============================================================
  // FUEL SLIP OPERATIONS
  // ============================================================

  /**
   * Finalize a fuel slip
   * @param {number|string} id - Fuel slip ID
   */
  finalizeFuelSlip: async (id) => {
    try {
      console.log(`📤 Finalizing fuel slip: ${id}`);
      const response = await api.post(`/fuel/slips/${id}/finalize`);
      const result = unwrap(response);
      console.log('✅ Fuel slip finalized:', result);
      return result;
    } catch (error) {
      throw handleApiError(error, `Finalizing fuel slip ${id}`);
    }
  },

  /**
   * Verify a fuel slip
   * @param {number|string} id - Fuel slip ID
   * @param {string} verifiedBy - Person verifying the slip
   */
  verifyFuelSlip: async (id, verifiedBy) => {
    try {
      console.log(`📤 Verifying fuel slip: ${id}`);
      const response = await api.post(`/fuel/slips/${id}/verify`, { verifiedBy });
      const result = unwrap(response);
      console.log('✅ Fuel slip verified:', result);
      return result;
    } catch (error) {
      throw handleApiError(error, `Verifying fuel slip ${id}`);
    }
  },

  // ============================================================
  // QUERY OPERATIONS
  // ============================================================

  /**
   * Get fuel slips for a specific trip
   * @param {number|string} tripId - Trip ID
   */
  getFuelSlipsByTrip: async (tripId) => {
    try {
      console.log(`📤 Fetching fuel slips for trip: ${tripId}`);
      const response = await api.get(`/fuel/slips/trip/${tripId}`);
      const data = unwrap(response);
      
      if (Array.isArray(data)) {
        return data;
      }
      if (data?.content && Array.isArray(data.content)) {
        return data.content;
      }
      if (data?.data && Array.isArray(data.data)) {
        return data.data;
      }
      
      return data || [];
    } catch (error) {
      throw handleApiError(error, `Fetching fuel slips for trip ${tripId}`);
    }
  },

  /**
   * Get fuel slips for a specific driver
   * @param {number|string} driverId - Driver ID
   */
  getFuelSlipsByDriver: async (driverId) => {
    try {
      console.log(`📤 Fetching fuel slips for driver: ${driverId}`);
      const response = await api.get(`/fuel/slips/driver/${driverId}`);
      const data = unwrap(response);
      return Array.isArray(data) ? data : (data?.data || []);
    } catch (error) {
      throw handleApiError(error, `Fetching fuel slips for driver ${driverId}`);
    }
  },

  /**
   * Get fuel slips for a specific vehicle
   * @param {number|string} vehicleId - Vehicle ID
   */
  getFuelSlipsByVehicle: async (vehicleId) => {
    try {
      console.log(`📤 Fetching fuel slips for vehicle: ${vehicleId}`);
      const response = await api.get(`/fuel/slips/vehicle/${vehicleId}`);
      const data = unwrap(response);
      return Array.isArray(data) ? data : (data?.data || []);
    } catch (error) {
      throw handleApiError(error, `Fetching fuel slips for vehicle ${vehicleId}`);
    }
  },

  /**
   * Get fuel slips for a date range
   * @param {string} startDate - Start date (YYYY-MM-DD)
   * @param {string} endDate - End date (YYYY-MM-DD)
   */
  getFuelSlipsByDateRange: async (startDate, endDate) => {
    try {
      console.log(`📤 Fetching fuel slips from ${startDate} to ${endDate}`);
      const response = await api.get('/fuel/slips/period', {
        params: { startDate, endDate }
      });
      const data = unwrap(response);
      return Array.isArray(data) ? data : (data?.data || []);
    } catch (error) {
      throw handleApiError(error, 'Fetching fuel slips by date range');
    }
  },

  // ============================================================
  // STATISTICS & REPORTS
  // ============================================================

  /**
   * Get fuel slip statistics
   * @param {Object} params - Parameters
   * @param {string} params.startDate - Start date (YYYY-MM-DD)
   * @param {string} params.endDate - End date (YYYY-MM-DD)
   * @param {number} params.vehicleId - Filter by vehicle
   * @param {number} params.driverId - Filter by driver
   */
  getFuelStatistics: async (params = {}) => {
    try {
      console.log('📤 Fetching fuel statistics with params:', params);
      const response = await api.get('/fuel/slips/statistics', { params });
      return unwrap(response);
    } catch (error) {
      throw handleApiError(error, 'Fetching fuel statistics');
    }
  },

  /**
   * Get fuel consumption report
   * @param {Object} params - Parameters
   * @param {string} params.startDate - Start date (YYYY-MM-DD)
   * @param {string} params.endDate - End date (YYYY-MM-DD)
   * @param {number} params.vehicleId - Filter by vehicle
   */
  getFuelConsumptionReport: async (params = {}) => {
    try {
      console.log('📤 Fetching fuel consumption report with params:', params);
      const response = await api.get('/fuel/slips/consumption-report', { params });
      return unwrap(response);
    } catch (error) {
      throw handleApiError(error, 'Fetching fuel consumption report');
    }
  },

  // ============================================================
  // BULK OPERATIONS
  // ============================================================

  /**
   * Bulk create fuel slips
   * @param {Array} slips - Array of fuel slip data
   */
  bulkCreateFuelSlips: async (slips) => {
    try {
      console.log(`📤 Bulk creating ${slips.length} fuel slips`);
      const payload = slips.map(slip => buildFuelSlipPayload(slip));
      const response = await api.post('/fuel/slips/bulk', payload);
      const result = unwrap(response);
      console.log('✅ Bulk fuel slips created:', result);
      return result;
    } catch (error) {
      throw handleApiError(error, 'Bulk creating fuel slips');
    }
  },

  /**
   * Bulk update fuel slips
   * @param {Array} updates - Array of { id, data } objects
   */
  bulkUpdateFuelSlips: async (updates) => {
    try {
      console.log(`📤 Bulk updating ${updates.length} fuel slips`);
      const payload = updates.map(({ id, data }) => ({
        id,
        ...buildFuelSlipPayload(data)
      }));
      const response = await api.put('/fuel/slips/bulk', payload);
      const result = unwrap(response);
      console.log('✅ Bulk fuel slips updated:', result);
      return result;
    } catch (error) {
      throw handleApiError(error, 'Bulk updating fuel slips');
    }
  },

  /**
   * Bulk delete fuel slips
   * @param {Array} ids - Array of fuel slip IDs
   */
  bulkDeleteFuelSlips: async (ids) => {
    try {
      console.log(`📤 Bulk deleting ${ids.length} fuel slips`);
      const response = await api.delete('/fuel/slips/bulk', { data: { ids } });
      console.log('✅ Bulk fuel slips deleted');
      return unwrap(response);
    } catch (error) {
      throw handleApiError(error, 'Bulk deleting fuel slips');
    }
  },

  // ============================================================
  // EXPORT FUNCTIONS
  // ============================================================

  /**
   * Export fuel slips to CSV
   * @param {Object} filters - Filter parameters
   */
  exportFuelSlipsToCsv: async (filters = {}) => {
    try {
      console.log('📤 Exporting fuel slips to CSV with filters:', filters);
      const response = await api.get('/fuel/slips/export/csv', {
        params: filters,
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `fuel-slips-${dayjs().format('YYYY-MM-DD')}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      return true;
    } catch (error) {
      throw handleApiError(error, 'Exporting fuel slips to CSV');
    }
  },

  /**
   * Export fuel slips to PDF
   * @param {Object} filters - Filter parameters
   */
  exportFuelSlipsToPdf: async (filters = {}) => {
    try {
      console.log('📤 Exporting fuel slips to PDF with filters:', filters);
      const response = await api.get('/fuel/slips/export/pdf', {
        params: filters,
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `fuel-slips-${dayjs().format('YYYY-MM-DD')}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      return true;
    } catch (error) {
      throw handleApiError(error, 'Exporting fuel slips to PDF');
    }
  },
};

// ============================================================
// INDIVIDUAL EXPORTS (for direct import)
// ============================================================

export const {
  getFuelSlips,
  getFuelSlipById,
  createFuelSlip,
  updateFuelSlip,
  deleteFuelSlip,
  finalizeFuelSlip,
  verifyFuelSlip,
  getFuelSlipsByTrip,
  getFuelSlipsByDriver,
  getFuelSlipsByVehicle,
  getFuelSlipsByDateRange,
  getFuelStatistics,
  getFuelConsumptionReport,
  bulkCreateFuelSlips,
  bulkUpdateFuelSlips,
  bulkDeleteFuelSlips,
  exportFuelSlipsToCsv,
  exportFuelSlipsToPdf,
} = fuelService;

export default fuelService;
