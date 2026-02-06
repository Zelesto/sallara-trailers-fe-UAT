// src/services/tripService.js
import api from './api';
import dayjs from 'dayjs';

const formatDateForBackend = (date) =>
  date ? dayjs(date).format('YYYY-MM-DDTHH:mm:ss') : null;

const sanitizeField = (value) => (value === undefined ? null : value);

export const tripService = {
  // --------------------------
  // Trips CRUD
  // --------------------------

  getAllTrips: async (params = {}) => {
    try {
      // Supporting both the old simple call and the new paginated call
      const response = await api.get('/api/trips', { params });
      
      // Handle different response structures
      const rawData = response?.data !== undefined ? response.data : response;
      
      if (rawData?.content !== undefined) {
        return {
          content: rawData.content ?? [],
          totalElements: rawData.totalElements ?? 0,
          totalPages: rawData.totalPages ?? 1,
          number: rawData.number ?? 0,
          size: rawData.size ?? 10,
        };
      }
      
      const dataArray = Array.isArray(rawData) ? rawData : (rawData?.data ?? []);
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
      return response.data !== undefined ? response.data : response;
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
      return response.data !== undefined ? response.data : response;
    } catch (error) {
      console.error('Error creating trip:', error);
      throw error;
    }
  },

  createTripFromDto: async (tripDto) => {
    try {
      const response = await api.post('/api/trips/dto', tripDto);
      return response.data !== undefined ? response.data : response;
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

      console.log('Updating trip payload:', payload);
      const response = await api.put(`/api/trips/${tripId}`, payload);
      return response.data !== undefined ? response.data : response;
    } catch (error) {
      console.error(`Error updating trip ${tripId}:`, error);
      throw error;
    }
  },

  updateTripFromDto: async (id, tripDto) => {
    try {
      const response = await api.put(`/api/trips/dto/${id}`, tripDto);
      return response.data !== undefined ? response.data : response;
    } catch (error) {
      console.error(`Error updating trip ${id} from DTO:`, error);
      throw error;
    }
  },

  deleteTrip: async (id) => {
    try {
      const response = await api.delete(`/api/trips/${id}`);
      return response.data !== undefined ? response.data : response;
    } catch (error) {
      console.error(`Error deleting trip ${id}:`, error);
      throw error;
    }
  },

  finalizeTrip: async (id) => {
    try {
      const response = await api.post(`/api/trips/${id}/finalize`);
      return response.data !== undefined ? response.data : response;
    } catch (error) {
      console.error(`Error finalizing trip ${id}:`, error);
      throw error;
    }
  },

  batchFinalizeTrips: async (tripIds) => {
    try {
      const response = await api.post('/api/trips/batch-finalize', tripIds);
      return response.data !== undefined ? response.data : response;
    } catch (error) {
      console.error('Error batch finalizing trips:', error);
      throw error;
    }
  },

  // --------------------------
  // Metrics
  // --------------------------

 calculateTripMetrics: async (origin, destination, vehicleType = 'TRUCK', tripId) => {
    try {
      const response = await api.post('/api/trips-metrics/calculate', { origin, destination, vehicleType,tripId });
      return response.data;
    } catch (error) {
      console.error('Error calculating trip metrics:', error);
      throw error;
    }
  },
// OR if you want a preview-only version (no tripId needed):
calculateTripMetricsPreview: async (origin, destination, vehicleType = 'TRUCK') => {
  try {
    // You might need to create a new endpoint for preview-only calculations
    const response = await api.post('/api/trip-metrics/preview', {
      originLocation: origin,
      destinationLocation: destination,
      vehicleType: vehicleType
    });
    return response.data !== undefined ? response.data : response;
  } catch (error) {
    console.error('Error calculating trip metrics preview:', error);
    throw error;
  }
},

  saveTripMetrics: async (tripId, metrics) => {
    try {
      // RESTORED: The working version uses PUT
      const response = await api.put(`/api/trips/${tripId}/metrics`, metrics);
      return response.data !== undefined ? response.data : response;
    } catch (error) {
      console.error(`Error saving trip metrics for trip ${tripId}:`, error);
      throw error;
    }
  },

  getTripMetrics: async (tripId) => {
    try {
      const response = await api.get(`/api/trips/${tripId}/metrics`);
      return response.data !== undefined ? response.data : response;
    } catch (error) {
      console.error(`Error fetching trip metrics for trip ${tripId}:`, error);
      return null;
    }
  },

  // --------------------------
  // Filters & queries
  // --------------------------

  filterTrips: async (filters = {}) => {
    try {
      const response = await api.get('/api/trips/filter', { params: filters });
      const data = response?.data !== undefined ? response.data : response;
      return { data: Array.isArray(data) ? data : (data?.data ?? []) };
    } catch (error) {
      console.error('Error filtering trips:', error);
      throw error;
    }
  },

  getTripsByDriver: async (driverId) => {
    try {
      const response = await api.get(`/api/trips/driver/${driverId}`);
      const data = response?.data !== undefined ? response.data : response;
      return { data: Array.isArray(data) ? data : (data?.data ?? []) };
    } catch (error) {
      console.error(`Error fetching trips for driver ${driverId}:`, error);
      throw error;
    }
  },

  getTripsByVehicle: async (vehicleId) => {
    try {
      const response = await api.get(`/api/trips/vehicle/${vehicleId}`);
      const data = response?.data !== undefined ? response.data : response;
      return { data: Array.isArray(data) ? data : (data?.data ?? []) };
    } catch (error) {
      console.error(`Error fetching trips for vehicle ${vehicleId}:`, error);
      throw error;
    }
  },

  // --------------------------
  // KPIs & Statistics
  // --------------------------

  getTripStatistics: async () => {
    try {
      const response = await api.get('/api/trips/statistics');
      return response.data !== undefined ? response.data : response;
    } catch (error) {
      console.error('Error fetching trip statistics:', error);
      throw error;
    }
  },

  getTripKPIs: async (fromDate, toDate) => {
    try {
      const response = await api.get('/api/trips/kpi', { params: { from: fromDate, to: toDate } });
      return response.data !== undefined ? response.data : response;
    } catch (error) {
      console.error('Error fetching trip KPIs:', error);
      throw error;
    }
  },

  // --------------------------
  // Utilities
  // --------------------------

  checkTripNumberExists: async (tripNumber) => {
    try {
      const response = await api.get(`/api/trips/exists/${tripNumber}`);
      return response.data !== undefined ? response.data : response;
    } catch (error) {
      console.error(`Error checking trip number ${tripNumber}:`, error);
      throw error;
    }
  },

  getTripByTripNumber: async (tripNumber) => {
    try {
      const response = await api.get(`/api/trips/number/${tripNumber}`);
      return response.data !== undefined ? response.data : response;
    } catch (error) {
      console.error(`Error fetching trip by number ${tripNumber}:`, error);
      throw error;
    }
  }
};
