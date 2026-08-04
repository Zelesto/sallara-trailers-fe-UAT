// src/services/maintenanceService.js
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
 * Build maintenance payload with common fields
 */
const buildMaintenancePayload = (data) => ({
  vehicleId: data.vehicleId ? parseInt(data.vehicleId, 10) : null,
  type: sanitizeField(data.type),
  date: formatDateForBackend(data.date),
  odometer: data.odometer ? parseFloat(data.odometer) : null,
  cost: data.cost ? parseFloat(data.cost) : null,
  status: sanitizeField(data.status) || 'SCHEDULED',
  notes: sanitizeField(data.notes),
  scheduledDate: formatDateForBackend(data.scheduledDate),
  scheduledOdometer: data.scheduledOdometer ? parseFloat(data.scheduledOdometer) : null,
  completedDate: formatDateForBackend(data.completedDate),
  completedOdometer: data.completedOdometer ? parseFloat(data.completedOdometer) : null,
  serviceProvider: sanitizeField(data.serviceProvider),
  priority: sanitizeField(data.priority) || 'MEDIUM',
  isRecurring: data.isRecurring ?? false,
  recurrenceIntervalDays: data.recurrenceIntervalDays ? parseInt(data.recurrenceIntervalDays, 10) : null,
  recurrenceIntervalKm: data.recurrenceIntervalKm ? parseFloat(data.recurrenceIntervalKm) : null,
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
    message = 'Maintenance record not found';
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
   MAINTENANCE SERVICE
   ============================================================ */

export const maintenanceService = {

  /**
   * Get maintenance schedule for a vehicle
   * @param {number|string} vehicleId - Vehicle ID
   */
  getMaintenanceSchedule: async (vehicleId) => {
    try {
      console.log(`📤 Fetching maintenance schedule for vehicle: ${vehicleId}`);
      const response = await api.get(`/vehicles/${vehicleId}/maintenance`);
      const data = unwrap(response);
      
      if (Array.isArray(data)) {
        return data;
      }
      if (data?.content && Array.isArray(data.content)) {
        return data.content;
      }
      return data || [];
    } catch (error) {
      throw handleApiError(error, 'Fetching maintenance schedule');
    }
  },

  /**
   * Get a single maintenance record by ID
   * @param {number|string} id - Maintenance ID
   */
  getMaintenanceById: async (id) => {
    try {
      console.log(`📤 Fetching maintenance record with ID: ${id}`);
      const response = await api.get(`/vehicles/maintenance/${id}`);
      const data = unwrap(response);
      return data;
    } catch (error) {
      throw handleApiError(error, `Fetching maintenance ${id}`);
    }
  },

  /**
   * Add a maintenance record
   * @param {Object} data - Maintenance data
   */
  addMaintenance: async (data) => {
    try {
      const payload = buildMaintenancePayload(data);
      console.log('📤 Adding maintenance record:', payload);
      const response = await api.post('/vehicles/maintenance', payload);
      const result = unwrap(response);
      console.log('✅ Maintenance record added:', result);
      return result;
    } catch (error) {
      throw handleApiError(error, 'Adding maintenance record');
    }
  },

  /**
   * Update a maintenance record
   * @param {number|string} id - Maintenance ID
   * @param {Object} data - Updated maintenance data
   */
  updateMaintenance: async (id, data) => {
    try {
      const payload = buildMaintenancePayload(data);
      console.log(`📤 Updating maintenance ${id}:`, payload);
      const response = await api.put(`/vehicles/maintenance/${id}`, payload);
      const result = unwrap(response);
      console.log('✅ Maintenance record updated:', result);
      return result;
    } catch (error) {
      throw handleApiError(error, `Updating maintenance ${id}`);
    }
  },

  /**
   * Delete a maintenance record
   * @param {number|string} id - Maintenance ID
   */
  deleteMaintenance: async (id) => {
    try {
      console.log(`🗑️ Deleting maintenance record ${id}`);
      const response = await api.delete(`/vehicles/maintenance/${id}`);
      console.log('✅ Maintenance record deleted');
      return unwrap(response);
    } catch (error) {
      throw handleApiError(error, `Deleting maintenance ${id}`);
    }
  },

  /**
   * Complete a maintenance record
   * @param {number|string} id - Maintenance ID
   * @param {Object} data - Completion data
   * @param {string} data.completedDate - Completion date
   * @param {number} data.completedOdometer - Odometer reading at completion
   */
  completeMaintenance: async (id, data) => {
    try {
      console.log(`📤 Completing maintenance ${id}`);
      const payload = {
        completedDate: formatDateForBackend(data.completedDate),
        completedOdometer: data.completedOdometer ? parseFloat(data.completedOdometer) : null,
        status: 'COMPLETED',
      };
      const response = await api.put(`/vehicles/maintenance/${id}/complete`, payload);
      const result = unwrap(response);
      console.log('✅ Maintenance completed:', result);
      return result;
    } catch (error) {
      throw handleApiError(error, `Completing maintenance ${id}`);
    }
  },

  /**
   * Get upcoming maintenance
   * @param {number|string} vehicleId - Vehicle ID
   * @param {number} days - Number of days threshold
   */
  getUpcomingMaintenance: async (vehicleId, days = 14) => {
    try {
      console.log(`📤 Fetching upcoming maintenance for vehicle ${vehicleId} within ${days} days`);
      const response = await api.get(`/vehicles/${vehicleId}/maintenance/upcoming`, {
        params: { days }
      });
      const data = unwrap(response);
      if (Array.isArray(data)) {
        return data;
      }
      return data || [];
    } catch (error) {
      throw handleApiError(error, 'Fetching upcoming maintenance');
    }
  },

  /**
   * Get overdue maintenance
   * @param {number|string} vehicleId - Vehicle ID
   */
  getOverdueMaintenance: async (vehicleId) => {
    try {
      console.log(`📤 Fetching overdue maintenance for vehicle ${vehicleId}`);
      const response = await api.get(`/vehicles/${vehicleId}/maintenance/overdue`);
      const data = unwrap(response);
      if (Array.isArray(data)) {
        return data;
      }
      return data || [];
    } catch (error) {
      throw handleApiError(error, 'Fetching overdue maintenance');
    }
  },

  /**
   * Get maintenance statistics
   * @param {number|string} vehicleId - Vehicle ID
   */
  getMaintenanceStatistics: async (vehicleId) => {
    try {
      console.log(`📤 Fetching maintenance statistics for vehicle ${vehicleId}`);
      const response = await api.get(`/vehicles/${vehicleId}/maintenance/statistics`);
      const data = unwrap(response);
      return data;
    } catch (error) {
      throw handleApiError(error, 'Fetching maintenance statistics');
    }
  },

  /**
   * Get maintenance types
   */
  getMaintenanceTypes: async () => {
    try {
      console.log('📤 Fetching maintenance types');
      const response = await api.get('/vehicles/maintenance/types');
      const data = unwrap(response);
      if (Array.isArray(data)) {
        return data;
      }
      return data || [];
    } catch (error) {
      throw handleApiError(error, 'Fetching maintenance types');
    }
  },
};

// ============================================================
// INDIVIDUAL EXPORTS
// ============================================================

export const {
  getMaintenanceSchedule,
  getMaintenanceById,
  addMaintenance,
  updateMaintenance,
  deleteMaintenance,
  completeMaintenance,
  getUpcomingMaintenance,
  getOverdueMaintenance,
  getMaintenanceStatistics,
  getMaintenanceTypes,
} = maintenanceService;

export default maintenanceService;
