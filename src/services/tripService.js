// src/services/tripService.js
import api from './api';
import dayjs from 'dayjs';
import { fuelService } from './fuelService';

const formatDateForBackend = (date) =>
  date ? dayjs(date).format('YYYY-MM-DDTHH:mm:ss') : null;

const sanitizeField = (value) =>
  value === undefined ? null : value;

const unwrap = (response) =>
  response?.data !== undefined ? response.data : response;

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

export const tripService = {

  // ==========================
  // Trips CRUD
  // ==========================

  getAllTrips: async (params = {}) => {
    try {
      const response = await api.get('/trips', { params });
      const rawData = unwrap(response);

      if (rawData?.content !== undefined) {
        return normalizePage(rawData);
      }

      const dataArray = Array.isArray(rawData)
        ? rawData
        : (rawData?.data ?? []);

      return normalizePage({
        content: dataArray,
        totalElements: dataArray.length,
        totalPages: 1,
        number: 0,
        size: dataArray.length,
      });
    } catch (error) {
      console.error('Error fetching trips:', error);
      throw error;
    }
  },

  getTripById: async (id) => {
    try {
      const response = await api.get(`/trips/${id}`);
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

      const response = await api.post('/trips', payload);
      return unwrap(response);
    } catch (error) {
      console.error('Error creating trip:', error);
      throw error;
    }
  },

  createTripFromDto: async (tripDto) => {
    try {
      const response = await api.post('/trips/dto', tripDto);
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

      const response = await api.put(`/trips/${tripId}`, payload);
      return unwrap(response);
    } catch (error) {
      console.error(`Error updating trip ${tripId}:`, error);
      throw error;
    }
  },

  updateTripFromDto: async (id, tripDto) => {
    try {
      const response = await api.put(`/trips/dto/${id}`, tripDto);
      return unwrap(response);
    } catch (error) {
      console.error(`Error updating trip ${id} from DTO:`, error);
      throw error;
    }
  },

  deleteTrip: async (id) => {
    try {
      const response = await api.delete(`/trips/${id}`);
      return unwrap(response);
    } catch (error) {
      console.error(`Error deleting trip ${id}:`, error);
      throw error;
    }
  },

  finalizeTrip: async (id) => {
    try {
      const response = await api.post(`/trips/${id}/finalize`);
      return unwrap(response);
    } catch (error) {
      console.error(`Error finalizing trip ${id}:`, error);
      throw error;
    }
  },

  batchFinalizeTrips: async (tripIds) => {
    try {
      const response = await api.post('/trips/batch-finalize', tripIds);
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
        requiresAssistance: incidentData.requiresAssistance || false,
        reportedAt: new Date().toISOString(),
        tripId,
      };

      const response = await api.post(`/trips/${tripId}/incidents`, payload);
      return unwrap(response);

    } catch (error) {
      console.error(`Error reporting incident for trip ${tripId}:`, error);

      if (error.response?.data?.errors) {
        const errorMessages = Object.entries(error.response.data.errors)
          .map(([field, message]) => `${field}: ${message}`)
          .join(', ');
        throw new Error(`Validation errors: ${errorMessages}`);
      }

      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }

      throw error;
    }
  },

  getTripIncidents: async (tripId) => {
    try {
      const response = await api.get(`/trips/${tripId}/incidents`);
      const data = unwrap(response);
      return Array.isArray(data) ? data : (data?.data ?? []);
    } catch (error) {
      console.error(`Error fetching incidents for trip ${tripId}:`, error);
      return [];
    }
  },

  getActiveIncidents: async (tripId) => {
    try {
      const response = await api.get(`/trips/${tripId}/incidents/active`);
      const data = unwrap(response);
      return Array.isArray(data) ? data : (data?.data ?? []);
    } catch (error) {
      console.error(`Error fetching active incidents for trip ${tripId}:`, error);
      return [];
    }
  },

  updateIncident: async (tripId, incidentId, updateData) => {
    try {
      const response = await api.put(
        `/trips/${tripId}/incidents/${incidentId}`,
        updateData
      );
      return unwrap(response);
    } catch (error) {
      console.error(`Error updating incident ${incidentId}:`, error);
      throw error;
    }
  },

  deleteIncident: async (tripId, incidentId) => {
    try {
      const response = await api.delete(
        `/trips/${tripId}/incidents/${incidentId}`
      );
      return unwrap(response);
    } catch (error) {
      console.error(`Error deleting incident ${incidentId}:`, error);
      throw error;
    }
  },

  getTripIncidentsPaginated: async (
    tripId,
    page = 0,
    size = 10,
    sort = 'reportedAt,desc'
  ) => {
    try {
      const response = await api.get(`/trips/${tripId}/incidents`, {
        params: { page, size, sort },
      });

      const data = unwrap(response);
      return normalizePage(data, page, size);

    } catch (error) {
      console.error(`Error fetching incidents for trip ${tripId}:`, error);
      return normalizePage({}, page, size);
    }
  },

  getIncidentStats: async (tripId) => {
    try {
      const response = await api.get(`/trips/${tripId}/incidents/stats`);
      return unwrap(response);
    } catch (error) {
      console.error(`Error fetching incident stats for trip ${tripId}:`, error);
      return { totalIncidents: 0, activeIncidents: 0, urgentIncidents: 0 };
    }
  },

  searchIncidents: async (tripId, filters = {}) => {
    try {
      const response = await api.get(
        `/trips/${tripId}/incidents/search`,
        { params: filters }
      );

      const data = unwrap(response);
      return Array.isArray(data) ? data : (data?.data ?? []);

    } catch (error) {
      console.error(`Error searching incidents for trip ${tripId}:`, error);
      return [];
    }
  },

  // ==========================
  // Load Management
  // ==========================

  // Get all trips and filter on frontend
  getTripsWithoutLoad: async (params = {}) => {
    try {
      const response = await api.get('/trips', { params });
      // Filter trips that don't have a load_id
      const trips = response.data.content || response.data;
      const tripsWithoutLoad = trips.filter(trip => !trip.loadId);
      return {
        ...response.data,
        content: tripsWithoutLoad
      };
    } catch (error) {
      console.error('Error fetching trips without load:', error);
      throw error;
    }
  },

  // ==========================
  // Trip Lifecycle Management
  // ==========================

  startTrip: async (tripId, startData) => {
    try {
      const payload = {
        actualStartOdometer: startData.startOdometer,
        startTimestamp: new Date().toISOString(),
        ...startData,
      };

      delete payload.startOdometer;

      const response = await api.post(`/trips/${tripId}/start`, payload);
      return unwrap(response);

    } catch (error) {
      console.error(`Error starting trip ${tripId}:`, error);

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
        actualEndOdometer: endData.endOdometer,
        endTimestamp: new Date().toISOString(),
        endReason: endData.endReason || 'COMPLETED',
        ...endData,
      };

      delete payload.endOdometer;

      const response = await api.post(`/trips/${tripId}/end`, payload);
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

  pauseTrip: async (tripId, pauseData) => {
    try {
      const payload = {
        ...pauseData,
        pausedAt: new Date().toISOString(),
      };

      const response = await api.post(`/trips/${tripId}/pause`, payload);
      return unwrap(response);

    } catch (error) {
      console.error(`Error pausing trip ${tripId}:`, error);
      throw error;
    }
  },

  resumeTrip: async (tripId) => {
    try {
      const response = await api.post(`/trips/${tripId}/resume`);
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
    vehicleType = 'TRUCK',
  }) => {
    try {
      const numericTripId = Number(tripId);

      if (!numericTripId || isNaN(numericTripId)) {
        throw new Error(`Invalid tripId: ${tripId}`);
      }

      if (!origin || !destination) {
        throw new Error('Origin and destination are required.');
      }

      const response = await api.post(
        `/trip-metrics/${numericTripId}/calculate`,
        {
          originLocation: origin,
          destinationLocation: destination,
          vehicleType,
        }
      );

      return unwrap(response);

    } catch (error) {
      console.error('Error calculating trip metrics:', error);
      throw error;
    }
  },

  calculateTripMetricsPreview: async (origin, destination, vehicleType = 'TRUCK') => {
    try {
      const response = await api.post('/trip-metrics/preview', {
        originLocation: origin,
        destinationLocation: destination,
        vehicleType,
      });

      return unwrap(response);

    } catch (error) {
      console.error('Error calculating trip metrics preview:', error);
      throw error;
    }
  },

  saveTripMetrics: async (tripId, metrics) => {
    try {
      const response = await api.put(`/trip-metrics/${tripId}`, metrics);
      return unwrap(response);
    } catch (error) {
      console.error(`Error saving trip metrics for trip ${tripId}:`, error);
      throw error;
    }
  },

  getTripMetrics: async (tripId) => {
    try {
      const response = await api.get(`/trip-metrics/${tripId}`);
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
      console.error(`Error fetching fuel data for trip ${tripId}:`, error);

      return {
        tripId,
        fuelEntries: [],
        summary: {
          totalLiters: 0,
          totalCost: 0,
          entriesCount: 0,
        },
      };
    }
  },

  calculateTripCost: async (tripId) => {
    try {
      const response = await api.get(`/trips/${tripId}/cost-analysis`);
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
      const response = await api.get('/trips/filter', { params: filters });
      const data = unwrap(response);
      return { data: Array.isArray(data) ? data : (data?.data ?? []) };
    } catch (error) {
      console.error('Error filtering trips:', error);
      throw error;
    }
  },

  getTripsByDriver: async (driverId) => {
    try {
      const response = await api.get(`/trips/driver/${driverId}`);
      const data = unwrap(response);
      return { data: Array.isArray(data) ? data : (data?.data ?? []) };
    } catch (error) {
      console.error(`Error fetching trips for driver ${driverId}:`, error);
      throw error;
    }
  },

  getTripsByVehicle: async (vehicleId) => {
    try {
      const response = await api.get(`/trips/vehicle/${vehicleId}`);
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
      const response = await api.get('/trips/statistics');
      return unwrap(response);
    } catch (error) {
      console.error('Error fetching trip statistics:', error);
      throw error;
    }
  },

  getTripKPIs: async (fromDate, toDate) => {
    try {
      const response = await api.get('/trips/kpi', {
        params: { from: fromDate, to: toDate },
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
      const response = await api.get(`/trips/exists/${tripNumber}`);
      return unwrap(response);
    } catch (error) {
      console.error(`Error checking trip number ${tripNumber}:`, error);
      throw error;
    }
  },

  getTripByTripNumber: async (tripNumber) => {
    try {
      const response = await api.get(`/trips/number/${tripNumber}`);
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
      const response = await api.get(`/trips/${tripId}/status-history`);
      const data = unwrap(response);
      return Array.isArray(data) ? data : (data?.data ?? []);
    } catch (error) {
      console.error(`Error fetching status history for trip ${tripId}:`, error);
      return [];
    }
  },

  updateTripStatus: async (tripId, status, notes = '') => {
    try {
      const response = await api.post(`/trips/${tripId}/status`, {
        status,
        notes,
        changedAt: new Date().toISOString(),
      });
      return unwrap(response);
    } catch (error) {
      console.error(`Error updating status for trip ${tripId}:`, error);
      throw error;
    }
  },


  // ==========================
  // Incident Management
  // ==========================

  /**
   * Get all incidents for a specific trip
   * @param {number} tripId - The ID of the trip
   * @returns {Promise<Array>} - List of incidents
   */
  getTripIncidents: async (tripId) => {
    try {
      const response = await api.get(`/trips/${tripId}/incidents`);
      const data = unwrap(response);
      return Array.isArray(data) ? data : (data?.data ?? []);
    } catch (error) {
      console.error(`Error fetching incidents for trip ${tripId}:`, error);
      return [];
    }
  },

  /**
   * Get active incidents for a specific trip
   * @param {number} tripId - The ID of the trip
   * @returns {Promise<Array>} - List of active incidents
   */
  getActiveIncidents: async (tripId) => {
    try {
      const response = await api.get(`/trips/${tripId}/incidents/active`);
      const data = unwrap(response);
      return Array.isArray(data) ? data : (data?.data ?? []);
    } catch (error) {
      console.error(`Error fetching active incidents for trip ${tripId}:`, error);
      return [];
    }
  },

  /**
   * Report a new incident for a trip
   * @param {number} tripId - The ID of the trip
   * @param {Object} incidentData - The incident data
   * @param {string} incidentData.incidentType - Type of incident
   * @param {string} incidentData.severity - Severity level (LOW, MEDIUM, HIGH, CRITICAL)
   * @param {string} incidentData.description - Description of the incident
   * @param {string} incidentData.location - Location where incident occurred (optional)
   * @param {boolean} incidentData.requiresAssistance - Whether assistance is needed
   * @param {string} incidentData.reportedAt - ISO timestamp when reported
   * @returns {Promise<Object>} - The created incident
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
      };

      const response = await api.post(`/trips/${tripId}/incidents`, payload);
      return unwrap(response);

    } catch (error) {
      console.error(`Error reporting incident for trip ${tripId}:`, error);

      if (error.response?.data?.errors) {
        const errorMessages = Object.entries(error.response.data.errors)
          .map(([field, message]) => `${field}: ${message}`)
          .join(', ');
        throw new Error(`Validation errors: ${errorMessages}`);
      }

      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }

      throw error;
    }
  },

  /**
   * Update an existing incident
   * @param {number} tripId - The ID of the trip
   * @param {number} incidentId - The ID of the incident to update
   * @param {Object} updateData - The updated incident data
   * @returns {Promise<Object>} - The updated incident
   */
  updateIncident: async (tripId, incidentId, updateData) => {
    try {
      const response = await api.put(
        `/trips/${tripId}/incidents/${incidentId}`,
        updateData
      );
      return unwrap(response);
    } catch (error) {
      console.error(`Error updating incident ${incidentId}:`, error);
      throw error;
    }
  },

  /**
   * Delete an incident
   * @param {number} tripId - The ID of the trip
   * @param {number} incidentId - The ID of the incident to delete
   * @returns {Promise<void>}
   */
  deleteIncident: async (tripId, incidentId) => {
    try {
      const response = await api.delete(
        `/trips/${tripId}/incidents/${incidentId}`
      );
      return unwrap(response);
    } catch (error) {
      console.error(`Error deleting incident ${incidentId}:`, error);
      throw error;
    }
  },

  /**
   * Get incident statistics for a trip
   * @param {number} tripId - The ID of the trip
   * @returns {Promise<Object>} - Incident statistics
   */
  getIncidentStats: async (tripId) => {
    try {
      const response = await api.get(`/trips/${tripId}/incidents/stats`);
      return unwrap(response);
    } catch (error) {
      console.error(`Error fetching incident stats for trip ${tripId}:`, error);
      return { totalIncidents: 0, activeIncidents: 0, urgentIncidents: 0 };
    }
  },

  /**
   * Search incidents for a trip with filters
   * @param {number} tripId - The ID of the trip
   * @param {Object} filters - Search filters
   * @param {string} filters.status - Filter by status (OPEN, IN_PROGRESS, RESOLVED, CLOSED)
   * @param {string} filters.severity - Filter by severity (LOW, MEDIUM, HIGH, CRITICAL)
   * @param {string} filters.fromDate - Filter from date (ISO string)
   * @param {string} filters.toDate - Filter to date (ISO string)
   * @returns {Promise<Array>} - Filtered incidents
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
      console.error(`Error searching incidents for trip ${tripId}:`, error);
      return [];
    }
  },

  /**
   * Get incident by ID
   * @param {number} tripId - The ID of the trip
   * @param {number} incidentId - The ID of the incident
   * @returns {Promise<Object>} - The incident
   */
  getIncidentById: async (tripId, incidentId) => {
    try {
      const response = await api.get(`/trips/${tripId}/incidents/${incidentId}`);
      return unwrap(response);
    } catch (error) {
      console.error(`Error fetching incident ${incidentId}:`, error);
      throw error;
    }
  },

  /**
   * Update incident status
   * @param {number} tripId - The ID of the trip
   * @param {number} incidentId - The ID of the incident
   * @param {string} status - New status (OPEN, IN_PROGRESS, RESOLVED, CLOSED)
   * @param {string} resolutionNotes - Notes about resolution (optional)
   * @returns {Promise<Object>} - The updated incident
   */
  updateIncidentStatus: async (tripId, incidentId, status, resolutionNotes = '') => {
    try {
      const response = await api.patch(
        `/trips/${tripId}/incidents/${incidentId}/status`,
        { status, resolutionNotes }
      );
      return unwrap(response);
    } catch (error) {
      console.error(`Error updating incident ${incidentId} status:`, error);
      throw error;
    }
  },

  // ==========================
  // Incident Pagination (if needed)
  // ==========================

  /**
   * Get incidents for a trip with pagination
   * @param {number} tripId - The ID of the trip
   * @param {number} page - Page number (0-based)
   * @param {number} size - Page size
   * @param {string} sort - Sort field (e.g., 'reportedAt,desc')
   * @returns {Promise<Object>} - Paginated incidents
   */
  getTripIncidentsPaginated: async (
    tripId,
    page = 0,
    size = 10,
    sort = 'reportedAt,desc'
  ) => {
    try {
      const response = await api.get(`/trips/${tripId}/incidents`, {
        params: { page, size, sort },
      });

      const data = unwrap(response);
      return normalizePage(data, page, size);

    } catch (error) {
      console.error(`Error fetching incidents for trip ${tripId}:`, error);
      return normalizePage({}, page, size);
    }
  },
  
  // ==========================
  // Trip Documents
  // ==========================

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
      console.error(`Error uploading document for trip ${tripId}:`, error);
      throw error;
    }
  },

  getTripDocuments: async (tripId) => {
    try {
      const response = await api.get(`/trips/${tripId}/documents`);
      const data = unwrap(response);
      return Array.isArray(data) ? data : (data?.data ?? []);
    } catch (error) {
      console.error(`Error fetching documents for trip ${tripId}:`, error);
      return [];
    }
  },

  deleteTripDocument: async (tripId, documentId) => {
    try {
      const response = await api.delete(`/trips/${tripId}/documents/${documentId}`);
      return unwrap(response);
    } catch (error) {
      console.error(`Error deleting document ${documentId} for trip ${tripId}:`, error);
      throw error;
    }
  },

}; 
