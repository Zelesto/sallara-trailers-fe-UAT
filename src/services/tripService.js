// src/services/tripService.js
import api from './api';
import dayjs from 'dayjs';
import { fuelService } from './fuelService';

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
 * Normalize paginated responses
 */
const normalizePage = (data, fallbackPage = 0, fallbackSize = 10) => ({
  content: data?.content || [],
  totalElements: data?.totalElements || 0,
  totalPages: data?.totalPages || 1,
  number: data?.number ?? fallbackPage,
  size: data?.size ?? fallbackSize,
});

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
    message = 'Resource not found';
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
 * Build trip payload with common fields
 */
const buildTripPayload = (tripData) => ({
  ...tripData,
  startDate: formatDateForBackend(tripData.startDate),
  endDate: formatDateForBackend(tripData.endDate),
  plannedStartDate: formatDateForBackend(tripData.plannedStartDate),
  plannedEndDate: formatDateForBackend(tripData.plannedEndDate),
  cargoDescription: sanitizeField(tripData.cargoDescription),
  // Depot fields - keep as is, they're already in the right format
  fromDepotKm: sanitizeField(tripData.fromDepotKm),
  toDepotKm: sanitizeField(tripData.toDepotKm),
  departedFrom: sanitizeField(tripData.departedFrom),
  departureLocation: sanitizeField(tripData.departureLocation),
  isFromDepot: tripData.isFromDepot ?? false,
});

/**
 * Handle paginated response
 */
const handlePaginatedResponse = (data) => {
  if (data?.content !== undefined) {
    return normalizePage(data);
  }
  
  const dataArray = Array.isArray(data) ? data : (data?.data ?? []);
  return normalizePage({
    content: dataArray,
    totalElements: dataArray.length,
    totalPages: 1,
    number: 0,
    size: dataArray.length,
  });
};

/* ============================================================
   TRIP SERVICE - MAIN EXPORT
   ============================================================ */

export const tripService = {

  // ============================================================
  // CRUD OPERATIONS
  // ============================================================

  /**
   * Get all trips with pagination and filters
   */
  getAllTrips: async (params = {}) => {
    try {
      const response = await api.get('/trips', { params });
      const rawData = unwrap(response);
      return handlePaginatedResponse(rawData);
    } catch (error) {
      throw handleApiError(error, 'Fetching trips');
    }
  },

  /**
   * Get trip by ID
   */
  getTripById: async (id) => {
    try {
      const response = await api.get(`/trips/${id}`);
      return unwrap(response);
    } catch (error) {
      throw handleApiError(error, `Fetching trip ${id}`);
    }
  },

  /**
   * Create a new trip
   */
  createTrip: async (tripData) => {
    try {
      const payload = buildTripPayload(tripData);
      const response = await api.post('/trips', payload);
      return unwrap(response);
    } catch (error) {
      throw handleApiError(error, 'Creating trip');
    }
  },

  /**
   * Create trip from DTO
   */
  createTripFromDto: async (tripDto) => {
    try {
      const response = await api.post('/trips/dto', tripDto);
      return unwrap(response);
    } catch (error) {
      throw handleApiError(error, 'Creating trip from DTO');
    }
  },

  /**
   * Update an existing trip
   */
  updateTrip: async (tripId, tripData) => {
    try {
      const payload = buildTripPayload(tripData);
      const response = await api.put(`/trips/${tripId}`, payload);
      return unwrap(response);
    } catch (error) {
      throw handleApiError(error, `Updating trip ${tripId}`);
    }
  },

  /**
   * Update trip from DTO
   */
  updateTripFromDto: async (id, tripDto) => {
    try {
      const response = await api.put(`/trips/dto/${id}`, tripDto);
      return unwrap(response);
    } catch (error) {
      throw handleApiError(error, `Updating trip ${id} from DTO`);
    }
  },

  /**
   * Delete a trip
   */
  deleteTrip: async (id) => {
    try {
      const response = await api.delete(`/trips/${id}`);
      return unwrap(response);
    } catch (error) {
      throw handleApiError(error, `Deleting trip ${id}`);
    }
  },

  /**
   * Finalize a trip
   */
  finalizeTrip: async (id) => {
    try {
      const response = await api.post(`/trips/${id}/finalize`);
      return unwrap(response);
    } catch (error) {
      throw handleApiError(error, `Finalizing trip ${id}`);
    }
  },

  /**
   * Batch finalize multiple trips
   */
  batchFinalizeTrips: async (tripIds) => {
    try {
      const response = await api.post('/trips/batch-finalize', tripIds);
      return unwrap(response);
    } catch (error) {
      throw handleApiError(error, 'Batch finalizing trips');
    }
  },

  // ============================================================
  // TRIP LIFECYCLE
  // ============================================================

  /**
   * Start a trip
   */
  startTrip: async (tripId, startData) => {
    try {
      const payload = {
        actualStartOdometer: startData.startOdometer || startData.actualStartOdometer,
        startTimestamp: new Date().toISOString(),
        ...startData,
      };
      delete payload.startOdometer;

      const response = await api.post(`/trips/${tripId}/start`, payload);
      return unwrap(response);
    } catch (error) {
      throw handleApiError(error, `Starting trip ${tripId}`);
    }
  },

  /**
   * End a trip
   */
  endTrip: async (tripId, endData) => {
    try {
      const payload = {
        actualEndOdometer: endData.endOdometer || endData.actualEndOdometer,
        endTimestamp: new Date().toISOString(),
        endReason: endData.endReason || 'COMPLETED',
        ...endData,
      };
      delete payload.endOdometer;

      const response = await api.post(`/trips/${tripId}/end`, payload);
      return unwrap(response);
    } catch (error) {
      throw handleApiError(error, `Ending trip ${tripId}`);
    }
  },

  /**
   * Pause a trip
   */
  pauseTrip: async (tripId, pauseData) => {
    try {
      const payload = {
        ...pauseData,
        pausedAt: new Date().toISOString(),
      };
      const response = await api.post(`/trips/${tripId}/pause`, payload);
      return unwrap(response);
    } catch (error) {
      throw handleApiError(error, `Pausing trip ${tripId}`);
    }
  },

  /**
   * Resume a trip
   */
  resumeTrip: async (tripId) => {
    try {
      const response = await api.post(`/trips/${tripId}/resume`);
      return unwrap(response);
    } catch (error) {
      throw handleApiError(error, `Resuming trip ${tripId}`);
    }
  },

  // ============================================================
  // INCIDENT MANAGEMENT
  // ============================================================

  /**
   * Get all incidents for a trip
   */
  getTripIncidents: async (tripId) => {
    try {
      const response = await api.get(`/trips/${tripId}/incidents/list`);
      const data = unwrap(response);
      
      if (Array.isArray(data)) return data;
      if (data?.content && Array.isArray(data.content)) return data.content;
      if (data?.data && Array.isArray(data.data)) return data.data;
      
      return [];
    } catch (error) {
      // Fallback to regular endpoint
      try {
        const fallbackResponse = await api.get(`/trips/${tripId}/incidents`, {
          params: { page: 0, size: 100 }
        });
        const fallbackData = unwrap(fallbackResponse);
        return fallbackData?.content || [];
      } catch (fallbackError) {
        throw handleApiError(fallbackError, `Fetching incidents for trip ${tripId}`);
      }
    }
  },

  /**
   * Get active incidents for a trip
   */
  getActiveIncidents: async (tripId) => {
    try {
      const response = await api.get(`/trips/${tripId}/incidents/active`);
      const data = unwrap(response);
      return Array.isArray(data) ? data : (data?.data ?? []);
    } catch (error) {
      throw handleApiError(error, `Fetching active incidents for trip ${tripId}`);
    }
  },

  /**
   * Report a new incident
   */
  reportIncident: async (tripId, incidentData) => {
    try {
      const payload = {
        incidentType: incidentData.incidentType,
        severity: incidentData.severity || 'MEDIUM',
        description: incidentData.description,
        location: incidentData.location || null,
        requiresAssistance: incidentData.requiresAssistance || false,
        reportedAt: incidentData.reportedAt || new Date().toISOString(),
        tripId,
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
      throw handleApiError(error, `Reporting incident for trip ${tripId}`);
    }
  },

  /**
   * Update an incident
   */
  updateIncident: async (tripId, incidentId, updateData) => {
    try {
      const response = await api.put(
        `/trips/${tripId}/incidents/${incidentId}`,
        updateData
      );
      return unwrap(response);
    } catch (error) {
      throw handleApiError(error, `Updating incident ${incidentId}`);
    }
  },

  /**
   * Delete an incident
   */
  deleteIncident: async (tripId, incidentId) => {
    try {
      const response = await api.delete(
        `/trips/${tripId}/incidents/${incidentId}`
      );
      return unwrap(response);
    } catch (error) {
      throw handleApiError(error, `Deleting incident ${incidentId}`);
    }
  },

  /**
   * Get incident statistics
   */
  getIncidentStats: async (tripId) => {
    try {
      const response = await api.get(`/trips/${tripId}/incidents/stats`);
      return unwrap(response);
    } catch (error) {
      return { totalIncidents: 0, activeIncidents: 0, urgentIncidents: 0 };
    }
  },

  /**
   * Search incidents with filters
   */
  searchIncidents: async (tripId, filters = {}) => {
    try {
      const response = await api.get(
        `/trips/${tripId}/incidents/search`,
        { params: filters }
      );
      const data = unwrap(response);
      return Array.isArray(data) ? data : (data?.data ?? []);
    } catch (error) {
      throw handleApiError(error, `Searching incidents for trip ${tripId}`);
    }
  },

  /**
   * Get incident by ID
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
   * Update incident status
   */
  updateIncidentStatus: async (tripId, incidentId, status, resolutionNotes = '') => {
    try {
      const response = await api.patch(
        `/trips/${tripId}/incidents/${incidentId}/status`,
        { status, resolutionNotes }
      );
      return unwrap(response);
    } catch (error) {
      throw handleApiError(error, `Updating incident ${incidentId} status`);
    }
  },

  /**
   * Get paginated incidents
   */
  getTripIncidentsPaginated: async (tripId, page = 0, size = 10, sort = 'reportedAt,desc') => {
    try {
      const response = await api.get(`/trips/${tripId}/incidents`, {
        params: { page, size, sort },
      });
      const data = unwrap(response);
      return normalizePage(data, page, size);
    } catch (error) {
      return normalizePage({}, page, size);
    }
  },

  // ============================================================
  // STATUS MANAGEMENT
  // ============================================================

  /**
   * Get trip status history
   */
  getTripStatusHistory: async (tripId) => {
    try {
      const response = await api.get(`/trips/${tripId}/status-history`);
      const data = unwrap(response);
      return Array.isArray(data) ? data : (data?.data ?? []);
    } catch (error) {
      throw handleApiError(error, `Fetching status history for trip ${tripId}`);
    }
  },

  /**
   * Update trip status
   */
  updateTripStatus: async (tripId, status, notes = '') => {
    try {
      const response = await api.post(`/trips/${tripId}/status`, {
        status,
        notes,
        changedAt: new Date().toISOString(),
      });
      return unwrap(response);
    } catch (error) {
      throw handleApiError(error, `Updating status for trip ${tripId}`);
    }
  },

  // ============================================================
  // METRICS
  // ============================================================

  /**
   * Preview trip metrics
   */
  previewTripMetrics: async (origin, destination, vehicleType = 'TRUCK') => {
    try {
      const response = await api.post('/trip-metrics/preview', {
        originLocation: origin,
        destinationLocation: destination,
        vehicleType,
      });
      return unwrap(response);
    } catch (error) {
      throw handleApiError(error, 'Previewing trip metrics');
    }
  },

  /**
   * Calculate and save trip metrics
   */
  calculateTripMetrics: async ({ tripId, origin, destination, vehicleType = 'TRUCK' }) => {
    try {
      const numericTripId = Number(tripId);
      if (!numericTripId || isNaN(numericTripId)) {
        throw new Error(`Invalid tripId: ${tripId}`);
      }
      if (!origin || !destination) {
        throw new Error('Origin and destination are required.');
      }

      const response = await api.post(`/trip-metrics/${numericTripId}/calculate`, {
        originLocation: origin,
        destinationLocation: destination,
        vehicleType,
      });
      return unwrap(response);
    } catch (error) {
      throw handleApiError(error, `Calculating metrics for trip ${tripId}`);
    }
  },

  /**
   * Save trip metrics
   */
  saveTripMetrics: async (tripId, metrics) => {
    try {
      const response = await api.put(`/trip-metrics/${tripId}`, metrics);
      return unwrap(response);
    } catch (error) {
      throw handleApiError(error, `Saving metrics for trip ${tripId}`);
    }
  },

  /**
   * Get trip metrics
   */
  getTripMetrics: async (tripId) => {
    try {
      const response = await api.get(`/trip-metrics/${tripId}`);
      return unwrap(response);
    } catch (error) {
      return null;
    }
  },

  // ============================================================
  // FUEL & COSTS
  // ============================================================

  /**
   * Get trip fuel data
   */
  getTripFuelData: async (tripId) => {
    try {
      const fuelSlips = await fuelService.getFuelSlips({ tripId });

      return {
        tripId,
        fuelEntries: fuelSlips.map(slip => ({
          id: slip.id,
          date: slip.transactionDate || slip.date,
          station: slip.stationName,
          stationLocation: slip.location,
          liters: slip.quantity,
          pricePerLiter: slip.unitPrice,
          totalAmount: slip.totalAmount,
          odometer: slip.odometerReading,
          receiptNumber: slip.receiptNumber,
          driverId: slip.driverId,
          driverName: slip.driverName,
          vehicleId: slip.vehicleId,
          vehicleRegNumber: slip.vehicleRegistration,
          finalized: slip.finalized,
        })),
        summary: {
          totalLiters: fuelSlips.reduce((s, f) => s + (parseFloat(f.quantity) || 0), 0),
          totalCost: fuelSlips.reduce((s, f) => s + (parseFloat(f.totalAmount) || 0), 0),
          entriesCount: fuelSlips.length,
        },
      };
    } catch (error) {
      return {
        tripId,
        fuelEntries: [],
        summary: { totalLiters: 0, totalCost: 0, entriesCount: 0 },
      };
    }
  },

  /**
   * Calculate trip cost
   */
  calculateTripCost: async (tripId) => {
    try {
      const response = await api.get(`/trips/${tripId}/cost-analysis`);
      return unwrap(response);
    } catch (error) {
      return { totalCost: 0, costBreakdown: {} };
    }
  },

  // ============================================================
  // LOAD MANAGEMENT
  // ============================================================

  /**
   * Get trips without a load
   */
  getTripsWithoutLoad: async (params = {}) => {
    try {
      const response = await api.get('/trips', { params });
      const trips = response.data.content || response.data;
      const tripsWithoutLoad = trips.filter(trip => !trip.loadId);
      return {
        ...response.data,
        content: tripsWithoutLoad
      };
    } catch (error) {
      throw handleApiError(error, 'Fetching trips without load');
    }
  },

  // ============================================================
  // FILTERS & QUERIES
  // ============================================================

  /**
   * Filter trips with multiple criteria
   */
  filterTrips: async (filters = {}) => {
    try {
      const response = await api.get('/trips/filter', { params: filters });
      const data = unwrap(response);
      return { data: Array.isArray(data) ? data : (data?.data ?? []) };
    } catch (error) {
      throw handleApiError(error, 'Filtering trips');
    }
  },

  /**
   * Get trips by driver
   */
  getTripsByDriver: async (driverId) => {
    try {
      const response = await api.get(`/trips/driver/${driverId}`);
      const data = unwrap(response);
      return { data: Array.isArray(data) ? data : (data?.data ?? []) };
    } catch (error) {
      throw handleApiError(error, `Fetching trips for driver ${driverId}`);
    }
  },

  /**
   * Get trips by vehicle
   */
  getTripsByVehicle: async (vehicleId) => {
    try {
      const response = await api.get(`/trips/vehicle/${vehicleId}`);
      const data = unwrap(response);
      return { data: Array.isArray(data) ? data : (data?.data ?? []) };
    } catch (error) {
      throw handleApiError(error, `Fetching trips for vehicle ${vehicleId}`);
    }
  },

  // ============================================================
  // STATISTICS & KPIs
  // ============================================================

  /**
   * Get trip statistics
   */
  getTripStatistics: async () => {
    try {
      const response = await api.get('/trips/statistics');
      return unwrap(response);
    } catch (error) {
      throw handleApiError(error, 'Fetching trip statistics');
    }
  },

  /**
   * Get trip KPIs for date range
   */
  getTripKPIs: async (fromDate, toDate) => {
    try {
      const response = await api.get('/trips/kpi', {
        params: { from: fromDate, to: toDate },
      });
      return unwrap(response);
    } catch (error) {
      throw handleApiError(error, 'Fetching trip KPIs');
    }
  },

  // ============================================================
  // UTILITIES
  // ============================================================

  /**
   * Check if trip number exists
   */
  checkTripNumberExists: async (tripNumber) => {
    try {
      const response = await api.get(`/trips/exists/${tripNumber}`);
      return unwrap(response);
    } catch (error) {
      throw handleApiError(error, `Checking trip number ${tripNumber}`);
    }
  },

  /**
   * Get trip by trip number
   */
  getTripByTripNumber: async (tripNumber) => {
    try {
      const response = await api.get(`/trips/number/${tripNumber}`);
      return unwrap(response);
    } catch (error) {
      throw handleApiError(error, `Fetching trip by number ${tripNumber}`);
    }
  },

  // ============================================================
  // DOCUMENTS
  // ============================================================

  /**
   * Upload a document for a trip
   */
  uploadTripDocument: async (tripId, documentData) => {
    try {
      const formData = new FormData();
      formData.append('file', documentData.file);
      formData.append('documentType', documentData.documentType);
      formData.append('description', documentData.description || '');

      const response = await api.post(`/trips/${tripId}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return unwrap(response);
    } catch (error) {
      throw handleApiError(error, `Uploading document for trip ${tripId}`);
    }
  },

  /**
   * Get trip documents
   */
  getTripDocuments: async (tripId) => {
    try {
      const response = await api.get(`/trips/${tripId}/documents`);
      const data = unwrap(response);
      return Array.isArray(data) ? data : (data?.data ?? []);
    } catch (error) {
      throw handleApiError(error, `Fetching documents for trip ${tripId}`);
    }
  },

  /**
   * Delete a trip document
   */
  deleteTripDocument: async (tripId, documentId) => {
    try {
      const response = await api.delete(`/trips/${tripId}/documents/${documentId}`);
      return unwrap(response);
    } catch (error) {
      throw handleApiError(error, `Deleting document ${documentId} for trip ${tripId}`);
    }
  },
};

// ============================================================
// INDIVIDUAL EXPORTS (for direct import)
// ============================================================

export const {
  getAllTrips,
  getTripById,
  createTrip,
  createTripFromDto,
  updateTrip,
  updateTripFromDto,
  deleteTrip,
  finalizeTrip,
  batchFinalizeTrips,
  getTripIncidents,
  getActiveIncidents,
  reportIncident,
  updateIncident,
  deleteIncident,
  getIncidentStats,
  searchIncidents,
  getIncidentById,
  updateIncidentStatus,
  getTripIncidentsPaginated,
  getTripsWithoutLoad,
  startTrip,
  endTrip,
  pauseTrip,
  resumeTrip,
  previewTripMetrics,
  calculateTripMetrics,
  saveTripMetrics,
  getTripMetrics,
  getTripFuelData,
  calculateTripCost,
  filterTrips,
  getTripsByDriver,
  getTripsByVehicle,
  getTripStatistics,
  getTripKPIs,
  checkTripNumberExists,
  getTripByTripNumber,
  getTripStatusHistory,
  updateTripStatus,
  uploadTripDocument,
  getTripDocuments,
  deleteTripDocument,
} = tripService;

export default tripService;
