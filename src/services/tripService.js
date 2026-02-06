import api from './api';
import dayjs from 'dayjs';

/* -------------------------
 * Helpers (SAFE)
 * ------------------------- */

const formatDateForBackend = (date, includeTime = true) =>
  date
    ? dayjs(date).format(includeTime ? 'YYYY-MM-DDTHH:mm:ss' : 'YYYY-MM-DD')
    : null;

const sanitizeField = (value) =>
  value === undefined ? null : value;

const extractData = (response) =>
  response?.data !== undefined ? response.data : response;

/* -------------------------
 * Service
 * ------------------------- */

export const tripService = {
  async getAllTrips(params = {}) {
    // Set default values
    const defaultParams = {
      page: params.page || 0,
      size: params.size || 10,
      sort: params.sort || 'plannedStartDate,desc'
    };

    // Remove undefined/null values and empty strings
    const cleanParams = {};
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        cleanParams[key] = value;
      }
    });

    const finalParams = { ...defaultParams, ...cleanParams };
    
    console.log('Fetching trips with params:', finalParams);
    
    const response = await api.get('/api/trips', {
      params: finalParams,
    });

    const data = extractData(response);
    
    // Handle different response formats
    if (data && data.content !== undefined) {
      return {
        content: data.content || [],
        totalElements: data.totalElements || 0,
        totalPages: data.totalPages || 1,
        number: data.number || 0,
        size: data.size || 10,
      };
    } else if (Array.isArray(data)) {
      // If backend returns plain array (no pagination)
      return {
        content: data,
        totalElements: data.length,
        totalPages: 1,
        number: 0,
        size: data.length,
      };
    } else {
      // Handle other response formats
      return {
        content: [],
        totalElements: 0,
        totalPages: 0,
        number: 0,
        size: 10,
      };
    }
  },

  async searchTrips(searchParams = {}) {
    // Alternative method with explicit parameter handling
    const params = {
      page: searchParams.page || 0,
      size: searchParams.size || 10,
      ...(searchParams.search && { search: searchParams.search }),
      ...(searchParams.status && searchParams.status !== 'all' && { status: searchParams.status }),
      ...(searchParams.startDate && { startDate: searchParams.startDate }),
      ...(searchParams.endDate && { endDate: searchParams.endDate }),
      sort: 'plannedStartDate,desc'
    };

    return this.getAllTrips(params);
  },

  async getTripById(id) {
    const response = await api.get(`/api/trips/${id}`);
    return extractData(response);
  },

  /* -------- MANUAL ENTRY LIVES HERE -------- */

  async createTrip(tripData) {
    const payload = {
      ...tripData, // 👈 manual entry preserved
      actualStartDate: formatDateForBackend(tripData.actualStartDate),
      actualEndDate: formatDateForBackend(tripData.actualEndDate),
      plannedStartDate: formatDateForBackend(tripData.plannedStartDate),
      plannedEndDate: formatDateForBackend(tripData.plannedEndDate),
      cargoDescription: sanitizeField(tripData.cargoDescription),
    };

    const response = await api.post('/api/trips', payload);
    return extractData(response);
  },

  async updateTrip(tripId, tripData) {
    const payload = {
      ...tripData, // 👈 still explicit
      actualStartDate: formatDateForBackend(tripData.actualStartDate),
      actualEndDate: formatDateForBackend(tripData.actualEndDate),
      plannedStartDate: formatDateForBackend(tripData.plannedStartDate),
      plannedEndDate: formatDateForBackend(tripData.plannedEndDate),
      cargoDescription: sanitizeField(tripData.cargoDescription),
    };

    const response = await api.put(`/api/trips/${tripId}`, payload);
    return extractData(response);
  },

  async deleteTrip(id) {
    const response = await api.delete(`/api/trips/${id}`);
    return extractData(response);
  },

  async finalizeTrip(id) {
    const response = await api.post(`/api/trips/${id}/finalize`);
    return extractData(response);
  },

  /* -------- Metrics -------- */

  async calculateTripMetrics(origin, destination, vehicleType = 'TRUCK', tripId) {
    const url = tripId
      ? `/api/trip-metrics/${tripId}/calculate`
      : '/api/trip-metrics';

    const response = await api.post(url, {
      tripId,
      originLocation: origin,
      destinationLocation: destination,
      vehicleType,
    });

    return extractData(response);
  },

  async saveTripMetrics(tripId, metrics) {
    const response = await api.put(`/api/trip-metrics/${tripId}`, {
      totalDistanceKm: metrics.totalDistance,
      totalDurationHours: metrics.estimatedDuration,
      fuelUsedLiters: metrics.estimatedFuel,
      costAmount: metrics.estimatedCost,
      idleTimeHours: metrics.delays,
      incidentCount: metrics.incidents,
    });

    return extractData(response);
  },

  async getTripMetrics(tripId) {
    const response = await api.get(`/api/trips/${tripId}/metrics`);
    return extractData(response);
  },

  async getTripKPIs(fromDate, toDate) {
    const response = await api.get('/api/trip-analytics/kpis', {
      params: {
        from: formatDateForBackend(fromDate, false),
        to: formatDateForBackend(toDate, false),
      },
    });
    return extractData(response);
  },

  async downloadReport(filters = {}) {
    return api.get('/api/trips/report', {
      params: {
        status: filters.status || 'ALL',
        startDate:
          filters.startDate ||
          dayjs().subtract(1, 'month').format('YYYY-MM-DD'),
        endDate:
          filters.endDate ||
          dayjs().format('YYYY-MM-DD'),
      },
      responseType: 'blob',
    });
  },

  async checkTripNumberExists(tripNumber) {
    const response = await api.get(`/api/trips/exists/${tripNumber}`);
    return extractData(response);
  },
};
