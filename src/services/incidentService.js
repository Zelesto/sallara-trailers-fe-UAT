// src/services/incidentService.js

import api from './api';

export const incidentService = {
  /**
   * Get all incidents for a trip (non-paginated)
   * ✅ Gracefully handles 500 errors and returns empty array
   */
  getTripIncidents: async (tripId) => {
    try {
      if (!tripId) {
        console.log('⚠️ No tripId provided, returning empty array');
        return [];
      }
      
      console.log(`📤 Fetching incidents for trip ${tripId}`);
      
      // ✅ Try the /list endpoint first
      try {
        const response = await api.get(`/trips/${tripId}/incidents/list`);
        const data = response?.data;
        
        if (Array.isArray(data)) {
          console.log(`✅ Found ${data.length} incidents for trip ${tripId}`);
          return data;
        }
        if (data?.content && Array.isArray(data.content)) {
          return data.content;
        }
        return [];
      } catch (listError) {
        // ✅ If /list fails with 500, try the paginated endpoint
        console.warn(`⚠️ /list endpoint failed for trip ${tripId}, trying paginated...`);
        
        try {
          const response = await api.get(`/trips/${tripId}/incidents`, {
            params: { page: 0, size: 100, sort: 'reportedAt,desc' }
          });
          const data = response?.data;
          
          if (data?.content && Array.isArray(data.content)) {
            console.log(`✅ Found ${data.content.length} incidents via paginated endpoint`);
            return data.content;
          }
          if (Array.isArray(data)) {
            return data;
          }
          return [];
        } catch (paginatedError) {
          // ✅ Both endpoints failed - return empty array
          console.warn(`⚠️ Both incident endpoints failed for trip ${tripId}`);
          return [];
        }
      }
    } catch (error) {
      // ✅ ALWAYS return empty array - never throw
      console.warn(`❌ Error fetching incidents for trip ${tripId}:`, error.message);
      return [];
    }
  },

  /**
   * Get paginated incidents for a trip
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
      const data = response?.data;
      return {
        content: data?.content || [],
        totalElements: data?.totalElements || 0,
        totalPages: data?.totalPages || 0,
        number: data?.number || page,
        size: data?.size || size,
      };
    } catch (error) {
      console.warn(`Error fetching paginated incidents for trip ${tripId}:`, error.message);
      return {
        content: [],
        totalElements: 0,
        totalPages: 0,
        number: page,
        size: size,
      };
    }
  },

  /**
   * Get a specific incident by ID
   */
  getIncidentById: async (tripId, incidentId) => {
    try {
      const response = await api.get(`/trips/${tripId}/incidents/${incidentId}`);
      return response?.data;
    } catch (error) {
      console.warn(`Error fetching incident ${incidentId}:`, error.message);
      return null;
    }
  },

  /**
   * Create a new incident
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
      return response?.data;
    } catch (error) {
      console.error(`Error creating incident for trip ${tripId}:`, error);
      throw error;
    }
  },

  /**
   * Update an incident
   */
  updateIncident: async (tripId, incidentId, updateData) => {
    try {
      const response = await api.put(`/trips/${tripId}/incidents/${incidentId}`, updateData);
      return response?.data;
    } catch (error) {
      console.error(`Error updating incident ${incidentId}:`, error);
      throw error;
    }
  },

  /**
   * Delete an incident
   */
  deleteIncident: async (tripId, incidentId) => {
    try {
      const response = await api.delete(`/trips/${tripId}/incidents/${incidentId}`);
      return response?.data;
    } catch (error) {
      console.error(`Error deleting incident ${incidentId}:`, error);
      throw error;
    }
  },

  /**
   * Get active (unresolved) incidents for a trip
   */
  getActiveIncidents: async (tripId) => {
    try {
      if (!tripId) {
        return [];
      }
      
      const response = await api.get(`/trips/${tripId}/incidents/active`);
      const data = response?.data;
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.warn(`Error fetching active incidents for trip ${tripId}:`, error.message);
      return [];
    }
  },

  /**
   * Get incident statistics for a trip
   */
  getIncidentStats: async (tripId) => {
    try {
      const response = await api.get(`/trips/${tripId}/incidents/stats`);
      return response?.data || {
        totalIncidents: 0,
        activeIncidents: 0,
        urgentIncidents: 0,
      };
    } catch (error) {
      console.warn(`Error fetching incident stats for trip ${tripId}:`, error.message);
      return {
        totalIncidents: 0,
        activeIncidents: 0,
        urgentIncidents: 0,
      };
    }
  },

  /**
   * Search incidents with filters
   */
  searchIncidents: async (tripId, filters = {}) => {
    try {
      const response = await api.get(`/trips/${tripId}/incidents/search`, {
        params: filters,
      });
      const data = response?.data;
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.warn(`Error searching incidents for trip ${tripId}:`, error.message);
      return [];
    }
  },

  /**
   * Resolve an incident
   */
  resolveIncident: async (tripId, incidentId, resolutionNotes = '') => {
    try {
      const response = await api.patch(`/trips/${tripId}/incidents/${incidentId}/resolve`, {
        resolutionNotes,
        resolvedAt: new Date().toISOString(),
      });
      return response?.data;
    } catch (error) {
      console.error(`Error resolving incident ${incidentId}:`, error);
      throw error;
    }
  },

  /**
   * Update incident status
   */
  updateIncidentStatus: async (tripId, incidentId, status, resolutionNotes = '') => {
    try {
      const response = await api.patch(`/trips/${tripId}/incidents/${incidentId}/status`, {
        status,
        resolutionNotes,
      });
      return response?.data;
    } catch (error) {
      console.error(`Error updating incident ${incidentId} status:`, error);
      throw error;
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
  getIncidentStats,
  searchIncidents,
  resolveIncident,
  updateIncidentStatus,
} = incidentService;

export default incidentService;
