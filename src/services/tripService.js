import api from './api';
import dayjs from 'dayjs';

/* =============================
   Helpers
============================= */
const formatDate = (date, includeTime = true) =>
  date
    ? dayjs(date).format(includeTime ? 'YYYY-MM-DDTHH:mm:ss' : 'YYYY-MM-DD')
    : null;

const extract = (res) =>
  res?.data !== undefined ? res.data : res;

/* =============================
   Service
============================= */
export const tripService = {
  async getAllTrips(params = {}) {
    const {
      page = 0,
      size = 10,
      sort = 'plannedStartDate,desc',
      ...filters
    } = params;

    const query = { page, size, sort };
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query[key] = value;
      }
    });

    const response = await api.get('/api/trips', { params: query });
    const data = extract(response);

    if (data?.content !== undefined) {
      return {
        content: data.content ?? [],
        totalElements: data.totalElements ?? 0,
        totalPages: data.totalPages ?? 1,
        number: data.number ?? 0,
        size: data.size ?? size,
      };
    }

    if (Array.isArray(data)) {
      return {
        content: data,
        totalElements: data.length,
        totalPages: 1,
        number: 0,
        size: data.length,
      };
    }

    return {
      content: [],
      totalElements: 0,
      totalPages: 0,
      number: 0,
      size,
    };
  },

  async getTripById(id) {
    return extract(await api.get(`/api/trips/${id}`));
  },

  async createTrip(data) {
    return extract(await api.post('/api/trips', {
      ...data,
      plannedStartDate: formatDate(data.plannedStartDate),
      plannedEndDate: formatDate(data.plannedEndDate),
      actualStartDate: formatDate(data.actualStartDate),
      actualEndDate: formatDate(data.actualEndDate),
    }));
  },

  async updateTrip(id, data) {
    return extract(await api.put(`/api/trips/${id}`, {
      ...data,
      plannedStartDate: formatDate(data.plannedStartDate),
      plannedEndDate: formatDate(data.plannedEndDate),
      actualStartDate: formatDate(data.actualStartDate),
      actualEndDate: formatDate(data.actualEndDate),
    }));
  },

  async deleteTrip(id) {
    return extract(await api.delete(`/api/trips/${id}`));
  },

  async finalizeTrip(id) {
    return extract(await api.post(`/api/trips/${id}/finalize`));
  },

  /* =============================
     Metrics Methods
  ============================= */
  
  /**
   * Calculates trip metrics based on origin, destination and vehicle type
   * Updated path to follow common REST patterns: /api/trips/{id}/calculate-metrics
   */
  async calculateTripMetrics(origin, destination, vehicleType, tripId) {
    const params = {
      origin,
      destination,
      vehicleType
    };
    
    // If tripId is provided, we use the specific trip's calculation endpoint
    if (tripId) {
      return extract(await api.get(`/api/trips/${tripId}/calculate-metrics`, { params }));
    }
    
    // Fallback to a general calculation endpoint if no tripId
    return extract(await api.get('/api/trips/calculate-metrics', { params }));
  },

  /**
   * Retrieves existing metrics for a specific trip
   */
  async getTripMetrics(tripId) {
    return extract(await api.get(`/api/trips/${tripId}/metrics`));
  },

  /**
   * Saves or updates metrics for a specific trip
   */
  async saveTripMetrics(tripId, metricsData) {
    return extract(await api.post(`/api/trips/${tripId}/metrics`, metricsData));
  }
};
