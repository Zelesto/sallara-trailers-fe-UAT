// src/services/fuelService.js
import api from './api';
import dayjs from 'dayjs';
import { strictNumber } from '../utils/fuelSlipRules';

// "12,5" / "12abc" used to be saved as 12 by parseFloat; now they are rejected (null)
const toNumberOrNull = (v) => {
  const n = strictNumber(v);
  return n === null || Number.isNaN(n) ? null : n;
};
const toIdOrNull = (v) => {
  const n = toNumberOrNull(v);
  return n !== null && Number.isInteger(n) && n > 0 ? n : null;
};

/* ============================================================
   UTILITY FUNCTIONS
   ============================================================ */

const pad2 = (n) => String(n).padStart(2, '0');

// "YYYY-MM-DD", "YYYY-MM-DDTHH:mm" (<input type="datetime-local">), "...:ss", "...:ss.SSS"
const LOCAL_DATE_TIME_RE =
  /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,9})?)?)?$/;

/**
 * Convert any form date value to a backend LocalDateTime string "YYYY-MM-DDTHH:mm:ss"
 * (local wall-clock time, no timezone suffix).
 *
 * FIX: the date picker emits "2026-08-14T08:46" (no seconds). The previous converter
 * returned null for that, the backend skips null fields on update, so the PUT returned
 * 200 and the old date was silently kept.
 *
 * Returns null for empty input or an unparseable/impossible date (e.g. 2026-02-30).
 */
export const toLocalDateTime = (value) => {
  if (value === null || value === undefined || value === '') return null;

  if (typeof value === 'string') {
    const m = value.trim().match(LOCAL_DATE_TIME_RE);
    if (m) {
      const [, y, mo, d, h = '00', mi = '00', s = '00'] = m;
      const dt = new Date(+y, +mo - 1, +d, +h, +mi, +s);
      const valid =
        dt.getFullYear() === +y && dt.getMonth() === +mo - 1 && dt.getDate() === +d &&
        dt.getHours() === +h && dt.getMinutes() === +mi && dt.getSeconds() === +s;
      // Keep the wall-clock time exactly as typed (no UTC shift)
      return valid ? `${y}-${mo}-${d}T${h}:${mi}:${s}` : null;
    }
  }

  // Date, dayjs/moment (.toDate()), epoch ms, or ISO string with Z/offset -> browser-local time
  const dt = value instanceof Date
    ? value
    : typeof value?.toDate === 'function'
      ? value.toDate()
      : new Date(value);
  if (!dt || Number.isNaN(dt.getTime())) return null;

  return `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}` +
    `T${pad2(dt.getHours())}:${pad2(dt.getMinutes())}:${pad2(dt.getSeconds())}`;
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
    message = 'Fuel slip not found';
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
 * Build fuel slip payload with common fields
 */
// NOTE: `finalized` is deliberately NOT sent. Finalizing happens only through
// POST /fuel/slips/{id}/finalize (month close). Sending `finalized: data.finalized ?? false`
// on every create/update meant an ordinary edit could UN-finalize a closed slip.
const buildFuelSlipPayload = (data) => {
  const transactionDate = toLocalDateTime(data.transactionDate);

  // FIX: a date the user entered must never be silently turned into null
  // (the backend ignores null on update and would keep the old date without any error).
  if (sanitizeField(data.transactionDate) !== null && transactionDate === null) {
    throw new Error(`Invalid transaction date: ${JSON.stringify(data.transactionDate)}`);
  }

  return {
    slipNumber: sanitizeField(data.slipNumber),
    // local date-time without timezone (was toISOString(): UTC, shifted SA slips by -2h)
    transactionDate,
    vehicleId: toIdOrNull(data.vehicleId),
    vehicleRegistration: sanitizeField(data.vehicleRegistration),
    driverId: toIdOrNull(data.driverId),
    driverName: sanitizeField(data.driverName),
    quantity: toNumberOrNull(data.quantity),
    unitPrice: toNumberOrNull(data.unitPrice),
    stationName: sanitizeField(data.stationName),
    location: sanitizeField(data.location),
    pumpNumber: sanitizeField(data.pumpNumber),
    notes: sanitizeField(data.notes),
    fuelType: sanitizeField(data.fuelType),
    paymentMethod: sanitizeField(data.paymentMethod),
    receiptNumber: sanitizeField(data.receiptNumber),
    odometerReading: toNumberOrNull(data.odometerReading),
    tripId: toIdOrNull(data.tripId),
    loadId: toIdOrNull(data.loadId),
    fuelSourceId: toIdOrNull(data.fuelSourceId),
  };
};

/* ============================================================
   FUEL SERVICE - MAIN EXPORT
   ============================================================ */

export const fuelService = {

  // ============================================================
  // CRUD OPERATIONS
  // ============================================================

  /**
   * Get all fuel slips with optional filters
   * @param {Object} filters - Filter parameters
   * @param {number} filters.driverId - Filter by driver ID
   * @param {number} filters.vehicleId - Filter by vehicle ID
   * @param {number} filters.tripId - Filter by trip ID
   * @param {number} filters.loadId - Filter by load ID
   * @param {string} filters.fuelType - Filter by fuel type
   * @param {string} filters.paymentMethod - Filter by payment method
   * @param {boolean} filters.finalized - Filter by finalized status
   */
  getFuelSlips: async (filters = {}) => {
    try {
      console.log('🔧 fuelService.getFuelSlips called with filters:', filters);

      // Build query params
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value);
        }
      });

      const url = `/fuel/slips${params.toString() ? `?${params.toString()}` : ''}`;
      console.log('🌐 Making API call to:', url);

      const response = await api.get(url);
      const data = unwrap(response);

      // Handle different response formats
      if (Array.isArray(data)) {
        return data;
      }
      if (data?.content && Array.isArray(data.content)) {
        // Paged response: fetch the remaining pages too (previously only page 1 was shown,
        // so totals and the month view silently missed slips). Capped at 10,000 rows.
        const all = [...data.content];
        const seen = new Set(all.map((s) => s?.id).filter((x) => x != null));
        const totalPages = Number(data.totalPages) || 1;
        const pageSize = Number(data.size) || data.content.length || 20;
        for (let page = 1; page < totalPages && all.length < 10000; page += 1) {
          const next = new URLSearchParams(params);
          next.set('page', String(page));
          next.set('size', String(pageSize));
          const pageData = unwrap(await api.get(`/fuel/slips?${next.toString()}`));
          const rows = Array.isArray(pageData) ? pageData : (pageData?.content || []);
          let added = 0;
          for (const s of rows) {
            if (s?.id == null || !seen.has(s.id)) {
              if (s?.id != null) seen.add(s.id);
              all.push(s);
              added += 1;
            }
          }
          if (rows.length === 0 || added === 0) break; // server ignored paging -> stop
        }
        return all;
      }
      if (data?.data && Array.isArray(data.data)) {
        return data.data;
      }

      return data || [];
    } catch (error) {
      throw handleApiError(error, 'Fetching fuel slips');
    }
  },

  /**
   * Get a single fuel slip by ID
   * @param {number|string} id - Fuel slip ID
   */
  getFuelSlipById: async (id) => {
    try {
      console.log(`📤 Fetching fuel slip with ID: ${id}`);
      const response = await api.get(`/fuel/slips/${id}`);
      const data = unwrap(response);
      console.log('✅ Fuel slip fetched:', data);
      return data;
    } catch (error) {
      throw handleApiError(error, `Fetching fuel slip ${id}`);
    }
  },

  /**
   * Create a new fuel slip
   * @param {Object} data - Fuel slip data
   */
  createFuelSlip: async (data) => {
    try {
      const payload = buildFuelSlipPayload(data);
      console.log('📤 Creating fuel slip with payload:', payload);
      const response = await api.post('/fuel/slips', payload);
      const result = unwrap(response);
      console.log('✅ Fuel slip created:', result);
      return result;
    } catch (error) {
      throw handleApiError(error, 'Creating fuel slip');
    }
  },

  /**
   * Update an existing fuel slip
   * @param {number|string} id - Fuel slip ID
   * @param {Object} data - Updated fuel slip data
   */
  updateFuelSlip: async (id, data) => {
    try {
      console.log(`📤 Updating fuel slip with ID: ${id}`);
      console.log('📤 Update data:', data);

      const payload = buildFuelSlipPayload(data);
      console.log('📤 Update payload:', payload);
      // Plain-text line so the value survives copy/paste of the console (objects show as "Object")
      console.log(
        `📅 Date sent: input=${JSON.stringify(data.transactionDate ?? null)} -> payload=${JSON.stringify(payload.transactionDate)}`
      );

      const response = await api.put(`/fuel/slips/${id}`, payload);
      const result = unwrap(response);
      console.log('✅ Fuel slip updated:', result);

      // Surface a silent server-side drop instead of pretending the date was saved
      if (payload.transactionDate && result?.transactionDate) {
        const saved = toLocalDateTime(result.transactionDate);
        if (saved && saved.slice(0, 16) !== payload.transactionDate.slice(0, 16)) {
          console.warn(
            `⚠️ Server kept transactionDate=${result.transactionDate} although ${payload.transactionDate} was sent`
          );
        }
      }
      return result;
    } catch (error) {
      throw handleApiError(error, `Updating fuel slip ${id}`);
    }
  },

  /**
   * Delete a fuel slip
   * @param {number|string} id - Fuel slip ID
   */
  deleteFuelSlip: async (id) => {
    try {
      console.log(`🗑️ Deleting fuel slip with ID: ${id}`);
      const response = await api.delete(`/fuel/slips/${id}`);
      console.log('✅ Fuel slip deleted');
      return unwrap(response);
    } catch (error) {
      throw handleApiError(error, `Deleting fuel slip ${id}`);
    }
  },

  // ============================================================
  // FUEL SLIP OPERATIONS
  // ============================================================

  /**
   * Finalize a fuel slip
   * @param {number|string} id - Fuel slip ID
   */
  finalizeFuelSlip: async (id) => {
    try {
      console.log(`📤 Finalizing fuel slip: ${id}`);
      const response = await api.post(`/fuel/slips/${id}/finalize`);
      const result = unwrap(response);
      console.log('✅ Fuel slip finalized:', result);
      return result;
    } catch (error) {
      throw handleApiError(error, `Finalizing fuel slip ${id}`);
    }
  },

  /**
   * Verify a fuel slip
   * @param {number|string} id - Fuel slip ID
   * @param {string} verifiedBy - Person verifying the slip
   */
  verifyFuelSlip: async (id, verifiedBy) => {
    try {
      console.log(`📤 Verifying fuel slip: ${id} with verifiedBy: ${verifiedBy}`);
      const response = await api.post(`/fuel/slips/${id}/verify`, null, {
        params: { verifiedBy },
      });
      const result = unwrap(response);
      console.log('✅ Fuel slip verified:', result);
      return result;
    } catch (error) {
      throw handleApiError(error, `Verifying fuel slip ${id}`);
    }
  },

  // ============================================================
  // QUERY OPERATIONS
  // ============================================================

  /**
   * Get fuel slips for a specific trip
   * FIX: the backend has no /fuel/slips/trip/{id} route (it would hit /{id} with "trip"
   * and fail); trip filtering is GET /fuel/slips?tripId=…
   * @param {number|string} tripId - Trip ID
   */
  getFuelSlipsByTrip: async (tripId) => {
    try {
      console.log(`📤 Fetching fuel slips for trip: ${tripId}`);
      const response = await api.get('/fuel/slips', { params: { tripId } });
      const data = unwrap(response);

      if (Array.isArray(data)) {
        return data;
      }
      if (data?.content && Array.isArray(data.content)) {
        return data.content;
      }
      if (data?.data && Array.isArray(data.data)) {
        return data.data;
      }

      return [];
    } catch (error) {
      throw handleApiError(error, `Fetching fuel slips for trip ${tripId}`);
    }
  },

  /**
   * Get fuel slips for a specific driver
   * @param {number|string} driverId - Driver ID
   */
  getFuelSlipsByDriver: async (driverId) => {
    try {
      console.log(`📤 Fetching fuel slips for driver: ${driverId}`);
      const response = await api.get(`/fuel/slips/driver/${driverId}`);
      const data = unwrap(response);
      return Array.isArray(data) ? data : (data?.data || []);
    } catch (error) {
      throw handleApiError(error, `Fetching fuel slips for driver ${driverId}`);
    }
  },

  /**
   * Get fuel slips for a specific vehicle
   * @param {number|string} vehicleId - Vehicle ID
   */
  getFuelSlipsByVehicle: async (vehicleId) => {
    try {
      console.log(`📤 Fetching fuel slips for vehicle: ${vehicleId}`);
      const response = await api.get(`/fuel/slips/vehicle/${vehicleId}`);
      const data = unwrap(response);
      return Array.isArray(data) ? data : (data?.data || []);
    } catch (error) {
      throw handleApiError(error, `Fetching fuel slips for vehicle ${vehicleId}`);
    }
  },

  /**
   * Get fuel slips for a date range
   * FIX: the controller expects ?start=…&end=… (ISO dates); sending startDate/endDate
   * made every call fail with 400 "Required parameter 'start' is not present".
   * @param {string} startDate - Start date (YYYY-MM-DD)
   * @param {string} endDate - End date (YYYY-MM-DD)
   */
  getFuelSlipsByDateRange: async (startDate, endDate) => {
    try {
      const start = startDate ? dayjs(startDate).format('YYYY-MM-DD') : null;
      const end = endDate ? dayjs(endDate).format('YYYY-MM-DD') : null;
      if (!start || !end || start === 'Invalid Date' || end === 'Invalid Date') {
        throw new Error(`Invalid date range: ${startDate} – ${endDate}`);
      }
      console.log(`📤 Fetching fuel slips from ${start} to ${end}`);
      const response = await api.get('/fuel/slips/period', {
        params: { start, end },
      });
      const data = unwrap(response);
      return Array.isArray(data) ? data : (data?.data || []);
    } catch (error) {
      throw handleApiError(error, 'Fetching fuel slips by date range');
    }
  },

  // ============================================================
  // STATISTICS & REPORTS
  // NOTE: no matching endpoints exist in the FuelSlipController you shared.
  // ============================================================

  /**
   * Get fuel slip statistics
   * @param {Object} params - Parameters
   */
  getFuelStatistics: async (params = {}) => {
    try {
      console.log('📤 Fetching fuel statistics with params:', params);
      const response = await api.get('/fuel/slips/statistics', { params });
      return unwrap(response);
    } catch (error) {
      throw handleApiError(error, 'Fetching fuel statistics');
    }
  },

  /**
   * Get fuel consumption report
   * @param {Object} params - Parameters
   */
  getFuelConsumptionReport: async (params = {}) => {
    try {
      console.log('📤 Fetching fuel consumption report with params:', params);
      const response = await api.get('/fuel/slips/consumption-report', { params });
      return unwrap(response);
    } catch (error) {
      throw handleApiError(error, 'Fetching fuel consumption report');
    }
  },

  // ============================================================
  // BULK OPERATIONS
  // NOTE: no /fuel/slips/bulk endpoints exist in the FuelSlipController you shared.
  // ============================================================

  /**
   * Bulk create fuel slips
   * @param {Array} slips - Array of fuel slip data
   */
  bulkCreateFuelSlips: async (slips) => {
    try {
      console.log(`📤 Bulk creating ${slips.length} fuel slips`);
      const payload = slips.map((slip) => buildFuelSlipPayload(slip));
      const response = await api.post('/fuel/slips/bulk', payload);
      const result = unwrap(response);
      console.log('✅ Bulk fuel slips created:', result);
      return result;
    } catch (error) {
      throw handleApiError(error, 'Bulk creating fuel slips');
    }
  },

  /**
   * Bulk update fuel slips
   * @param {Array} updates - Array of { id, data } objects
   */
  bulkUpdateFuelSlips: async (updates) => {
    try {
      console.log(`📤 Bulk updating ${updates.length} fuel slips`);
      const payload = updates.map(({ id, data }) => ({
        id,
        ...buildFuelSlipPayload(data),
      }));
      const response = await api.put('/fuel/slips/bulk', payload);
      const result = unwrap(response);
      console.log('✅ Bulk fuel slips updated:', result);
      return result;
    } catch (error) {
      throw handleApiError(error, 'Bulk updating fuel slips');
    }
  },

  /**
   * Bulk delete fuel slips
   * @param {Array} ids - Array of fuel slip IDs
   */
  bulkDeleteFuelSlips: async (ids) => {
    try {
      console.log(`📤 Bulk deleting ${ids.length} fuel slips`);
      const response = await api.delete('/fuel/slips/bulk', { data: { ids } });
      console.log('✅ Bulk fuel slips deleted');
      return unwrap(response);
    } catch (error) {
      throw handleApiError(error, 'Bulk deleting fuel slips');
    }
  },

  // ============================================================
  // EXPORT FUNCTIONS
  // NOTE: no /fuel/slips/export endpoints exist in the FuelSlipController you shared.
  // ============================================================

  /**
   * Export fuel slips to CSV
   * @param {Object} filters - Filter parameters
   */
  exportFuelSlipsToCsv: async (filters = {}) => {
    try {
      console.log('📤 Exporting fuel slips to CSV with filters:', filters);
      const response = await api.get('/fuel/slips/export/csv', {
        params: filters,
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `fuel-slips-${dayjs().format('YYYY-MM-DD')}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => window.URL.revokeObjectURL(url), 1000); // free the blob memory

      return true;
    } catch (error) {
      throw handleApiError(error, 'Exporting fuel slips to CSV');
    }
  },

  /**
   * Export fuel slips to PDF
   * @param {Object} filters - Filter parameters
   */
  exportFuelSlipsToPdf: async (filters = {}) => {
    try {
      console.log('📤 Exporting fuel slips to PDF with filters:', filters);
      const response = await api.get('/fuel/slips/export/pdf', {
        params: filters,
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `fuel-slips-${dayjs().format('YYYY-MM-DD')}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => window.URL.revokeObjectURL(url), 1000); // free the blob memory

      return true;
    } catch (error) {
      throw handleApiError(error, 'Exporting fuel slips to PDF');
    }
  },
};

// ============================================================
// INDIVIDUAL EXPORTS (for direct import)
// ============================================================

export const {
  getFuelSlips,
  getFuelSlipById,
  createFuelSlip,
  updateFuelSlip,
  deleteFuelSlip,
  finalizeFuelSlip,
  verifyFuelSlip,
  getFuelSlipsByTrip,
  getFuelSlipsByDriver,
  getFuelSlipsByVehicle,
  getFuelSlipsByDateRange,
  getFuelStatistics,
  getFuelConsumptionReport,
  bulkCreateFuelSlips,
  bulkUpdateFuelSlips,
  bulkDeleteFuelSlips,
  exportFuelSlipsToCsv,
  exportFuelSlipsToPdf,
} = fuelService;

export default fuelService;
