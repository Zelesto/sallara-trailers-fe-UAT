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
  async getAllTrips(page = 0, size = 10) {
    const response = await api.get('/api/trips', {
      params: { page, size },
    });

    const data = extractData(response);
    return {
      content: data?.content ?? [],
      totalElements: data?.totalElements ?? 0,
      totalPages: data?.totalPages ?? 1,
    };
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
