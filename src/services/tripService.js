// src/services/tripService.js
import api from './api';
import dayjs from 'dayjs';

const formatDateForBackend = (date) =>
  date ? dayjs(date).format('YYYY-MM-DDTHH:mm:ss') : null;

const sanitizeField = (value) =>
  value === undefined ? null : value;

const unwrap = (response) =>
  response?.data !== undefined ? response.data : response;

export const tripService = {

  // ==========================
  // Trips CRUD
  // ==========================

  getAllTrips: async (params = {}) => {
    try {
      const response = await api.get('/api/trips', { params });
      const rawData = unwrap(response);

      if (rawData?.content !== undefined) {
        return {
          content: rawData.content ?? [],
          totalElements: rawData.totalElements ?? 0,
          totalPages: rawData.totalPages ?? 1,
          number: rawData.number ?? 0,
          size: rawData.size ?? 10,
        };
      }

      const dataArray = Array.isArray(rawData)
        ? rawData
        : (rawData?.data ?? []);

      return {
        content: dataArray,
        totalElements: dataArray.length,
        totalPages: 1,
        number: 0,
        size: dataArray.length
      };
    } catch (error) {
      console.error('Error fetching trips:', error);
      throw error;
    }
  },

  getTripById: async (id) => {
    try {
      const response = await api.get(`/api/trips/${id}`);
      return unwrap(response);
    } catch (error) {
      console.error(`Error fetching trip ${id}:`, error);
      throw error;
    }
  },

  createTrip: async (tripData) => {
    try {
      const payload = {
        ...tripData,
        startDate: formatDateForBackend(tripData.startDate),
        endDate: formatDateForBackend(tripData.endDate),
        plannedStartDate: formatDateForBackend(tripData.plannedStartDate),
        plannedEndDate: formatDateForBackend(tripData.plannedEndDate),
        cargoDescription: sanitizeField(tripData.cargoDescription),
      };

      const response = await api.post('/api/trips', payload);
      return unwrap(response);
    } catch (error) {
      console.error('Error creating trip:', error);
      throw error;
    }
  },

  createTripFromDto: async (tripDto) => {
    try {
      const response = await api.post('/api/trips/dto', tripDto);
      return unwrap(response);
    } catch (error) {
      console.error('Error creating trip from DTO:', error);
      throw error;
    }
  },

  updateTrip: async (tripId, tripData) => {
    try {
      const payload = {
        ...tripData,
        startDate: formatDateForBackend(tripData.startDate),
        endDate: formatDateForBackend(tripData.endDate),
        plannedStartDate: formatDateForBackend(tripData.plannedStartDate),
        plannedEndDate: formatDateForBackend(tripData.plannedEndDate),
        cargoDescription: sanitizeField(tripData.cargoDescription),
      };

      const response = await api.put(`/api/trips/${tripId}`, payload);
      return unwrap(response);
    } catch (error) {
      console.error(`Error updating trip ${tripId}:`, error);
      throw error;
    }
  },

  updateTripFromDto: async (id, tripDto) => {
    try {
      const response = await api.put(`/api/trips/dto/${id}`, tripDto);
      return unwrap(response);
    } catch (error) {
      console.error(`Error updating trip ${id} from DTO:`, error);
      throw error;
    }
  },

  deleteTrip: async (id) => {
    try {
      const response = await api.delete(`/api/trips/${id}`);
      return unwrap(response);
    } catch (error) {
      console.error(`Error deleting trip ${id}:`, error);
      throw error;
    }
  },

  finalizeTrip: async (id) => {
    try {
      const response = await api.post(`/api/trips/${id}/finalize`);
      return unwrap(response);
    } catch (error) {
      console.error(`Error finalizing trip ${id}:`, error);
      throw error;
    }
  },

  batchFinalizeTrips: async (tripIds) => {
    try {
      const response = await api.post('/api/trips/batch-finalize', tripIds);
      return unwrap(response);
    } catch (error) {
      console.error('Error batch finalizing trips:', error);
      throw error;
    }
  },



  // ==========================
  // Incident Management
  // ==========================

reportIncident: async (tripId, incidentData) => {
  try {
    const payload = {
      incidentType: incidentData.incidentType,
      severity: incidentData.severity || 'MEDIUM',
      description: incidentData.description,
      location: incidentData.location || null,
      requiresAssistance: incidentData.requiresAssistance || false
    };
    
    const response = await api.post(`/api/trips/${tripId}/incidents`, payload);
    return unwrap(response);
  } catch (error) {
    console.error(`Error reporting incident for trip ${tripId}:`, error);
    
    if (error.response?.data?.errors) {
      const errorMessages = Object.entries(error.response.data.errors)
        .map(([field, message]) => `${field}: ${message}`)
        .join(', ');
      throw new Error(`Validation errors: ${errorMessages}`);
    } else if (error.response?.data?.detail) {
      throw new Error(error.response.data.detail);
    }
    
    throw error;
  }
},

getTripIncidents: async (tripId) => {
  try {
    const response = await api.get(`/api/trips/${tripId}/incidents`);
    const data = unwrap(response);
    return Array.isArray(data) ? data : (data?.data ?? []);
  } catch (error) {
    console.error(`Error fetching incidents for trip ${tripId}:`, error);
    return [];
  }
},

getActiveIncidents: async (tripId) => {
  try {
    const response = await api.get(`/api/trips/${tripId}/incidents/active`);
    const data = unwrap(response);
    return Array.isArray(data) ? data : (data?.data ?? []);
  } catch (error) {
    console.error(`Error fetching active incidents for trip ${tripId}:`, error);
    return [];
  }
},

updateIncident: async (tripId, incidentId, updateData) => {
  try {
    const response = await api.put(`/api/trips/${tripId}/incidents/${incidentId}`, updateData);
    return unwrap(response);
  } catch (error) {
    console.error(`Error updating incident ${incidentId}:`, error);
    throw error;
  }
},

deleteIncident: async (tripId, incidentId) => {
  try {
    const response = await api.delete(`/api/trips/${tripId}/incidents/${incidentId}`);
    return unwrap(response);
  } catch (error) {
    console.error(`Error deleting incident ${incidentId}:`, error);
    throw error;
  }
},


getTripIncidentsPaginated: async (tripId, page = 0, size = 10, sort = 'reportedAt,desc') => {
  try {
    const response = await api.get(`/api/trips/${tripId}/incidents`, {
      params: { page, size, sort }
    });
    const data = unwrap(response);
    return {
      content: data.content || [],
      totalElements: data.totalElements || 0,
      totalPages: data.totalPages || 1,
      number: data.number || page,
      size: data.size || size,
    };
  } catch (error) {
    console.error(`Error fetching incidents for trip ${tripId}:`, error);
    return { content: [], totalElements: 0, totalPages: 1, number: page, size };
  }
},

getIncidentStats: async (tripId) => {
  try {
    const response = await api.get(`/api/trips/${tripId}/incidents/stats`);
    return unwrap(response);
  } catch (error) {
    console.error(`Error fetching incident stats for trip ${tripId}:`, error);
    return { totalIncidents: 0, activeIncidents: 0, urgentIncidents: 0 };
  }
},

searchIncidents: async (tripId, filters = {}) => {
  try {
    const response = await api.get(`/api/trips/${tripId}/incidents/search`, { params: filters });
    const data = unwrap(response);
    return Array.isArray(data) ? data : (data?.data ?? []);
  } catch (error) {
    console.error(`Error searching incidents for trip ${tripId}:`, error);
    return [];
  }
},

  // ==========================
  // Trip Lifecycle Management
  // ==========================

  // In your tripService.js, update the startTrip and endTrip methods:

startTrip: async (tripId, startData) => {
  try {
    const payload = {
      actualStartOdometer: startData.startOdometer, // Changed from startOdometer to actualStartOdometer
      startTimestamp: new Date().toISOString(),
      ...startData
    };
    
    // Remove startOdometer if it exists since we're using actualStartOdometer
    if (payload.startOdometer) {
      delete payload.startOdometer;
    }
    
    const response = await api.post(`/api/trips/${tripId}/start`, payload);
    return unwrap(response);
  } catch (error) {
    console.error(`Error starting trip ${tripId}:`, error);
    
    // Better error handling to show validation errors
    if (error.response?.data?.errors) {
      const errorMessages = Object.entries(error.response.data.errors)
        .map(([field, message]) => `${field}: ${message}`)
        .join(', ');
      throw new Error(`Validation errors: ${errorMessages}`);
    }
    
    throw error;
  }
},

endTrip: async (tripId, endData) => {
  try {
    const payload = {
      actualEndOdometer: endData.endOdometer, // Changed from endOdometer to actualEndOdometer
      endTimestamp: new Date().toISOString(),
      endReason: endData.endReason || 'COMPLETED',
      ...endData
    };
    
    // Remove endOdometer if it exists since we're using actualEndOdometer
    if (payload.endOdometer) {
      delete payload.endOdometer;
    }
    
    const response = await api.post(`/api/trips/${tripId}/end`, payload);
    return unwrap(response);
  } catch (error) {
    console.error(`Error ending trip ${tripId}:`, error);
    
    if (error.response?.data?.errors) {
      const errorMessages = Object.entries(error.response.data.errors)
        .map(([field, message]) => `${field}: ${message}`)
        .join(', ');
      throw new Error(`Validation errors: ${errorMessages}`);
    }
    
    throw error;
  }
},

  reportIncident: async (tripId, incidentData) => {
    try {
      const payload = {
        ...incidentData,
        reportedAt: new Date().toISOString(),
        tripId: tripId
      };
      
      const response = await api.post(`/api/trips/${tripId}/incidents`, payload);
      return unwrap(response);
    } catch (error) {
      console.error(`Error reporting incident for trip ${tripId}:`, error);
      throw error;
    }
  },

  getTripIncidents: async (tripId) => {
    try {
      const response = await api.get(`/api/trips/${tripId}/incidents`);
      const data = unwrap(response);
      return Array.isArray(data) ? data : (data?.data ?? []);
    } catch (error) {
      console.error(`Error fetching incidents for trip ${tripId}:`, error);
      return [];
    }
  },

  pauseTrip: async (tripId, pauseData) => {
    try {
      const payload = {
        ...pauseData,
        pausedAt: new Date().toISOString()
      };
      
      const response = await api.post(`/api/trips/${tripId}/pause`, payload);
      return unwrap(response);
    } catch (error) {
      console.error(`Error pausing trip ${tripId}:`, error);
      throw error;
    }
  },

  resumeTrip: async (tripId) => {
    try {
      const response = await api.post(`/api/trips/${tripId}/resume`);
      return unwrap(response);
    } catch (error) {
      console.error(`Error resuming trip ${tripId}:`, error);
      throw error;
    }
  },

  // ==========================
  // Metrics
  // ==========================

  calculateTripMetrics: async ({
    tripId,
    origin,
    destination,
    vehicleType = 'TRUCK'
  }) => {
    try {
      const numericTripId = Number(tripId);

      if (!numericTripId || isNaN(numericTripId)) {
        throw new Error(`Invalid tripId: ${tripId}. Must be a number.`);
      }

      if (!origin || !destination) {
        throw new Error('Origin and destination are required.');
      }

      const response = await api.post(
        `/api/trip-metrics/${numericTripId}/calculate`,
        {
          originLocation: origin,
          destinationLocation: destination,
          vehicleType
        }
      );

      return unwrap(response);
    } catch (error) {
      console.error('Error calculating trip metrics:', error);
      throw error;
    }
  },

  calculateTripMetricsPreview: async (
    origin,
    destination,
    vehicleType = 'TRUCK'
  ) => {
    try {
      const response = await api.post('/api/trip-metrics/preview', {
        originLocation: origin,
        destinationLocation: destination,
        vehicleType
      });

      return unwrap(response);
    } catch (error) {
      console.error('Error calculating trip metrics preview:', error);
      throw error;
    }
  },

  saveTripMetrics: async (tripId, metrics) => {
    try {
      const response = await api.put(
        `/api/trip-metrics/${tripId}`,
        metrics
      );
      return unwrap(response);
    } catch (error) {
      console.error(`Error saving trip metrics for trip ${tripId}:`, error);
      throw error;
    }
  },

  getTripMetrics: async (tripId) => {
    try {
      const response = await api.get(`/api/trip-metrics/${tripId}`);
      return unwrap(response);
    } catch (error) {
      console.error(`Error fetching trip metrics for trip ${tripId}:`, error);
      return null;
    }
  },

  // ==========================
  // Trip Fuel Data
  // ==========================

  getTripFuelData: async (tripId) => {
    try {
      const response = await api.get(`/api/trips/${tripId}/fuel`);
      return unwrap(response);
    } catch (error) {
      console.error(`Error fetching fuel data for trip ${tripId}:`, error);
      return { fuelEntries: [], totalLiters: 0, totalCost: 0 };
    }
  },

  calculateTripCost: async (tripId) => {
    try {
      const response = await api.get(`/api/trips/${tripId}/cost-analysis`);
      return unwrap(response);
    } catch (error) {
      console.error(`Error calculating cost for trip ${tripId}:`, error);
      return { totalCost: 0, costBreakdown: {} };
    }
  },

  // ==========================
  // Filters & Queries
  // ==========================

  filterTrips: async (filters = {}) => {
    try {
      const response = await api.get('/api/trips/filter', { params: filters });
      const data = unwrap(response);
      return { data: Array.isArray(data) ? data : (data?.data ?? []) };
    } catch (error) {
      console.error('Error filtering trips:', error);
      throw error;
    }
  },

  getTripsByDriver: async (driverId) => {
    try {
      const response = await api.get(`/api/trips/driver/${driverId}`);
      const data = unwrap(response);
      return { data: Array.isArray(data) ? data : (data?.data ?? []) };
    } catch (error) {
      console.error(`Error fetching trips for driver ${driverId}:`, error);
      throw error;
    }
  },

  getTripsByVehicle: async (vehicleId) => {
    try {
      const response = await api.get(`/api/trips/vehicle/${vehicleId}`);
      const data = unwrap(response);
      return { data: Array.isArray(data) ? data : (data?.data ?? []) };
    } catch (error) {
      console.error(`Error fetching trips for vehicle ${vehicleId}:`, error);
      throw error;
    }
  },

  // ==========================
  // KPIs & Statistics
  // ==========================

  getTripStatistics: async () => {
    try {
      const response = await api.get('/api/trips/statistics');
      return unwrap(response);
    } catch (error) {
      console.error('Error fetching trip statistics:', error);
      throw error;
    }
  },

  getTripKPIs: async (fromDate, toDate) => {
    try {
      const response = await api.get('/api/trips/kpi', {
        params: { from: fromDate, to: toDate }
      });
      return unwrap(response);
    } catch (error) {
      console.error('Error fetching trip KPIs:', error);
      throw error;
    }
  },

  // ==========================
  // Utilities
  // ==========================

  checkTripNumberExists: async (tripNumber) => {
    try {
      const response = await api.get(`/api/trips/exists/${tripNumber}`);
      return unwrap(response);
    } catch (error) {
      console.error(`Error checking trip number ${tripNumber}:`, error);
      throw error;
    }
  },

  getTripByTripNumber: async (tripNumber) => {
    try {
      const response = await api.get(`/api/trips/number/${tripNumber}`);
      return unwrap(response);
    } catch (error) {
      console.error(`Error fetching trip by number ${tripNumber}:`, error);
      throw error;
    }
  },

  // ==========================
  // Trip Status Management
  // ==========================

  getTripStatusHistory: async (tripId) => {
    try {
      const response = await api.get(`/api/trips/${tripId}/status-history`);
      const data = unwrap(response);
      return Array.isArray(data) ? data : (data?.data ?? []);
    } catch (error) {
      console.error(`Error fetching status history for trip ${tripId}:`, error);
      return [];
    }
  },

  updateTripStatus: async (tripId, status, notes = '') => {
    try {
      const response = await api.post(`/api/trips/${tripId}/status`, {
        status,
        notes,
        changedAt: new Date().toISOString()
      });
      return unwrap(response);
    } catch (error) {
      console.error(`Error updating status for trip ${tripId}:`, error);
      throw error;
    }
  },

  // ==========================
  // Trip Documents & Attachments
  // ==========================

  uploadTripDocument: async (tripId, documentData) => {
    try {
      const formData = new FormData();
      formData.append('file', documentData.file);
      formData.append('documentType', documentData.documentType);
      formData.append('description', documentData.description || '');
      
      const response = await api.post(`/api/trips/${tripId}/documents`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return unwrap(response);
    } catch (error) {
      console.error(`Error uploading document for trip ${tripId}:`, error);
      throw error;
    }
  },

  getTripDocuments: async (tripId) => {
    try {
      const response = await api.get(`/api/trips/${tripId}/documents`);
      const data = unwrap(response);
      return Array.isArray(data) ? data : (data?.data ?? []);
    } catch (error) {
      console.error(`Error fetching documents for trip ${tripId}:`, error);
      return [];
    }
  },

  deleteTripDocument: async (tripId, documentId) => {
    try {
      const response = await api.delete(`/api/trips/${tripId}/documents/${documentId}`);
      return unwrap(response);
    } catch (error) {
      console.error(`Error deleting document ${documentId} for trip ${tripId}:`, error);
      throw error;
    }
  }
};
