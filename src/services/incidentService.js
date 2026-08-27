// src/services/incidentService.js

import api from './api';

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
    message = 'Resource not found';
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

/**
 * Unwrap response data
 */
const unwrap = (response) => {
  if (!response) return null;
  return response?.data !== undefined ? response.data : response;
};

/**
 * Normalize paginated responses
 */
const normalizePage = (data, fallbackPage = 0, fallbackSize = 10) => ({
  content: data?.content || [],
  totalElements: data?.totalElements || 0,
  totalPages: data?.totalPages || 1,
  number: data?.number ?? fallbackPage,
  size: data?.size ?? fallbackSize,
});

export const incidentService = {
  /**
   * Get all incidents for a trip (non-paginated)
   * @param {number} tripId - The trip ID
   */
  getTripIncidents: async (tripId) => {
    try {
      if (!tripId) {
        return [];
      }
      
      const response = await api.get(`/trips/${tripId}/incidents/list`);
      const data = unwrap(response);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.warn(`Error fetching incidents for trip ${tripId}:`, error.message);
      // Return empty array instead of throwing
      return [];
    }
  },

  /**
   * Get paginated incidents for a trip
   * @param {number} tripId - The trip ID
   * @param {number} page - Page number (0-indexed)
   * @param {number} size - Page size
   * @param {string} sort - Sort field and direction
   */
  getTripIncidentsPaginated: async (tripId, page = 0, size = 10, sort = 'reportedAt,desc') => {
    try {
      if (!tripId) {
        return {
          content: [],
          totalElements: 0,
          totalPages: 0,
          number: 0,
          size: size,
        };
      }
      
      const response = await api.get(`/trips/${tripId}/incidents`, {
        params: { page, size, sort },
      });
      const data = unwrap(response);
      return normalizePage(data, page, size);
    } catch (error) {
      console.warn(`Error fetching paginated incidents for trip ${tripId}:`, error.message);
      return {
        content: [],
        totalElements: 0,
        totalPages: 0,
        number: page,
        size: size,
        first: true,
        last: true,
        empty: true,
      };
    }
  },

  /**
   * Get a specific incident by ID
   * @param {number} tripId - The trip ID
   * @param {number} incidentId - The incident ID
   */
  getIncidentById: async (tripId, incidentId) => {
    try {
      const response = await api.get(`/trips/${tripId}/incidents/${incidentId}`);
      return unwrap(response);
    } catch (error) {
      throw handleApiError(error, `Fetching incident ${incidentId}`);
    }
  },

  /**
   * Create a new incident
   * @param {number} tripId - The trip ID
   * @param {object} incidentData - The incident data
   */
  createIncident: async (tripId, incidentData) => {
    try {
      const payload = {
        incidentType: incidentData.incidentType,
        severity: incidentData.severity || 'MEDIUM',
        description: incidentData.description,
        location: incidentData.location || null,
        requiresAssistance: incidentData.requiresAssistance || false,
        reportedAt: incidentData.reportedAt || new Date().toISOString(),
        amount: incidentData.amount || null,
        paymentMethod: incidentData.paymentMethod || null,
        referenceNumber: incidentData.referenceNumber || null,
        additionalNotes: incidentData.additionalNotes || null,
        voucherType: incidentData.voucherType || null,
        eventType: incidentData.eventType || null,
        direction: incidentData.direction || null,
      };

      const response = await api.post(`/trips/${tripId}/incidents`, payload);
      return unwrap(response);
    } catch (error) {
      throw handleApiError(error, `Creating incident for trip ${tripId}`);
    }
  },

  /**
   * Update an incident
   * @param {number} tripId - The trip ID
   * @param {number} incidentId - The incident ID
   * @param {object} updateData - The update data
   */
  updateIncident: async (tripId, incidentId, updateData) => {
    try {
      const response = await api.put(`/trips/${tripId}/incidents/${incidentId}`, updateData);
      return unwrap(response);
    } catch (error) {
      throw handleApiError(error, `Updating incident ${incidentId}`);
    }
  },

  /**
   * Delete an incident
   * @param {number} tripId - The trip ID
   * @param {number} incidentId - The incident ID
   */
  deleteIncident: async (tripId, incidentId) => {
    try {
      const response = await api.delete(`/trips/${tripId}/incidents/${incidentId}`);
      return unwrap(response);
    } catch (error) {
      throw handleApiError(error, `Deleting incident ${incidentId}`);
    }
  },

  /**
   * Get active (unresolved) incidents for a trip
   * @param {number} tripId - The trip ID
   */
  getActiveIncidents: async (tripId) => {
    try {
      if (!tripId) {
        return [];
      }
      
      const response = await api.get(`/trips/${tripId}/incidents/active`);
      const data = unwrap(response);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.warn(`Error fetching active incidents for trip ${tripId}:`, error.message);
      return [];
    }
  },

  /**
   * Get incidents by resolved status
   * @param {number} tripId - The trip ID
   * @param {boolean} resolved - Resolved status
   */
  getIncidentsByResolvedStatus: async (tripId, resolved) => {
    try {
      const response = await api.get(`/trips/${tripId}/incidents/resolved/${resolved}`);
      const data = unwrap(response);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.warn(`Error fetching incidents by resolved status for trip ${tripId}:`, error.message);
      return [];
    }
  },

  /**
   * Get incidents by severity
   * @param {number} tripId - The trip ID
   * @param {string} severity - Severity level (LOW, MEDIUM, HIGH, CRITICAL)
   */
  getIncidentsBySeverity: async (tripId, severity) => {
    try {
      const response = await api.get(`/trips/${tripId}/incidents/severity/${severity}`);
      const data = unwrap(response);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.warn(`Error fetching incidents by severity for trip ${tripId}:`, error.message);
      return [];
    }
  },

  /**
   * Get urgent incidents (requiring assistance)
   * @param {number} tripId - The trip ID
   */
  getUrgentIncidents: async (tripId) => {
    try {
      const response = await api.get(`/trips/${tripId}/incidents/urgent`);
      const data = unwrap(response);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.warn(`Error fetching urgent incidents for trip ${tripId}:`, error.message);
      return [];
    }
  },

  /**
   * Get incident statistics for a trip
   * @param {number} tripId - The trip ID
   */
  getIncidentStats: async (tripId) => {
    try {
      const response = await api.get(`/trips/${tripId}/incidents/stats`);
      return unwrap(response);
    } catch (error) {
      console.warn(`Error fetching incident stats for trip ${tripId}:`, error.message);
      return {
        totalIncidents: 0,
        activeIncidents: 0,
        urgentIncidents: 0,
        resolvedIncidents: 0,
        highSeverityCount: 0,
        criticalSeverityCount: 0,
        mediumSeverityCount: 0,
        lowSeverityCount: 0,
      };
    }
  },

  /**
   * Search incidents with filters
   * @param {number} tripId - The trip ID
   * @param {object} filters - Search filters
   */
  searchIncidents: async (tripId, filters = {}) => {
    try {
      const response = await api.get(`/trips/${tripId}/incidents/search`, {
        params: filters,
      });
      const data = unwrap(response);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.warn(`Error searching incidents for trip ${tripId}:`, error.message);
      return [];
    }
  },

  /**
   * Resolve an incident
   * @param {number} tripId - The trip ID
   * @param {number} incidentId - The incident ID
   * @param {string} resolutionNotes - Resolution notes
   */
  resolveIncident: async (tripId, incidentId, resolutionNotes = '') => {
    try {
      const response = await api.patch(`/trips/${tripId}/incidents/${incidentId}/resolve`, {
        resolutionNotes,
        resolvedAt: new Date().toISOString(),
      });
      return unwrap(response);
    } catch (error) {
      throw handleApiError(error, `Resolving incident ${incidentId}`);
    }
  },

  /**
   * Update incident status (for admin use)
   * @param {number} tripId - The trip ID
   * @param {number} incidentId - The incident ID
   * @param {string} status - New status
   * @param {string} resolutionNotes - Resolution notes
   */
  updateIncidentStatus: async (tripId, incidentId, status, resolutionNotes = '') => {
    try {
      const response = await api.patch(`/trips/${tripId}/incidents/${incidentId}/status`, {
        status,
        resolutionNotes,
      });
      return unwrap(response);
    } catch (error) {
      throw handleApiError(error, `Updating incident ${incidentId} status`);
    }
  },
};

// ============================================================
// INDIVIDUAL EXPORTS
// ============================================================

export const {
  getTripIncidents,
  getTripIncidentsPaginated,
  getIncidentById,
  createIncident,
  updateIncident,
  deleteIncident,
  getActiveIncidents,
  getIncidentsByResolvedStatus,
  getIncidentsBySeverity,
  getUrgentIncidents,
  getIncidentStats,
  searchIncidents,
  resolveIncident,
  updateIncidentStatus,
} = incidentService;

export default incidentService;
