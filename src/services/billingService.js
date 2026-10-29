// src/services/billingService.js
import api from './api';

/* ============================================================
   HELPERS
   ============================================================ */

/**
 * Unwrap an axios response (has .status/.config) down to its body.
 * If already the body, returns it as-is.
 */
const unwrapApi = (res) => {
  if (!res) return null;
  if (
    res.data !== undefined &&
    (res.status !== undefined || res.config !== undefined)
  ) {
    return res.data;
  }
  return res;
};

/**
 * Extract an array from any of:
 *   raw array
 *   | axios wrapper { data: [...] }
 *   | page { content: [...] }
 *   | axios wrapper of page
 *   | any nested shape (recursive fallback up to depth 4)
 */
const toArray = (res) => {
  if (!res) return [];
  if (Array.isArray(res)) return res;

  let payload = res;
  if (
    payload.data !== undefined &&
    (payload.status !== undefined || payload.config !== undefined)
  ) {
    payload = payload.data;
  }

  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.content)) return payload.content;
  if (payload && Array.isArray(payload.data)) return payload.data;
  if (payload && payload.data && Array.isArray(payload.data.content)) {
    return payload.data.content;
  }

  const findArray = (node, depth = 0) => {
    if (!node || depth > 4) return null;
    if (Array.isArray(node)) return node;
    if (typeof node !== 'object') return null;

    const preferred = ['items', 'list', 'records', 'rows', 'results', 'content', 'data'];
    for (const k of preferred) {
      if (node[k] !== undefined) {
        const found = findArray(node[k], depth + 1);
        if (found) return found;
      }
    }
    return null;
  };

  return findArray(payload) || [];
};

/**
 * Only append `?userId=N` when a userId is actually provided.
 * Otherwise the backend reads the user from the JWT (Authorization header).
 *
 * Previously every billing POST hardcoded `userId=1`, which caused
 * 500s on servers where user #1 doesn't exist.
 */
const withUserParam = (base, userId) => {
  if (userId === undefined || userId === null || userId === '') return base;
  const sep = base.includes('?') ? '&' : '?';
  return `${base}${sep}userId=${encodeURIComponent(userId)}`;
};

/* ============================================================
   BILLING SERVICE
   ============================================================ */

const billingService = {
  /* ------------------------------------------------------------
     LOAD-LEVEL BILLING
     ------------------------------------------------------------ */

  // Get loads that are eligible to be invoiced
  getLoadsWithBillings: async () => {
    try {
      const response = await api.get('/billing/loads/billable');
      console.log('📦 Raw billable loads response:', response);
      const loads = toArray(response);
      console.log('📦 Processed loads data:', loads);
      return loads;
    } catch (error) {
      console.error('❌ Error fetching loads with billings:', error);
      return [];
    }
  },

  // Get load billing summary (customer totals, VAT, etc.)
  getLoadBillingSummary: async (loadId) => {
    try {
      const response = await api.get(`/billing/load/${loadId}/summary`);
      return unwrapApi(response) || null;
    } catch (error) {
      console.error(`Error fetching billing summary for load ${loadId}:`, error);
      return null;
    }
  },

  // Get the full billing record for a load
  getLoadBilling: async (loadId) => {
    try {
      const response = await api.get(`/billing/load/${loadId}`);
      return unwrapApi(response) || null;
    } catch (error) {
      console.error(`Error fetching billing for load ${loadId}:`, error);
      return null;
    }
  },

  // Calculate load billing (creates the Billing entity if missing).
  // Only sends userId when caller provides one — otherwise backend uses JWT.
  calculateLoadBilling: async (loadId, userId) => {
    try {
      const response = await api.post(
        withUserParam(`/billing/load/${loadId}/calculate`, userId)
      );
      return unwrapApi(response);
    } catch (error) {
      console.error(`Error calculating billing for load ${loadId}:`, error);
      throw error;
    }
  },

  // Recalculate load billing — variant that relies solely on the JWT.
  // Use this when no specific user needs to be attributed.
  recalculateLoadBilling: async (loadId) => {
    try {
      const response = await api.post(`/billing/load/${loadId}/recalculate`);
      return unwrapApi(response);
    } catch (error) {
      console.error(`Error recalculating billing for load ${loadId}:`, error);
      throw error;
    }
  },

  // Generate an invoice from a load's calculated billing.
  // ⚠️ NO userId default — the previous `|| 1` was the cause of the
  //    POST /billing/load/{id}/invoice?userId=1 → 500 error.
  generateInvoiceFromLoad: async (loadId, userId) => {
    try {
      const response = await api.post(
        withUserParam(`/billing/load/${loadId}/invoice`, userId)
      );
      return unwrapApi(response);
    } catch (error) {
      console.error(`Error generating invoice from load ${loadId}:`, error);
      throw error;
    }
  },

  // Bulk-generate invoices for multiple loads in one request.
  bulkGenerateInvoices: async (loadIds, userId) => {
    try {
      const response = await api.post(
        withUserParam('/billing/load/bulk-invoice', userId),
        loadIds
      );
      return unwrapApi(response);
    } catch (error) {
      console.error('Error bulk generating invoices:', error);
      throw error;
    }
  },

  /* ------------------------------------------------------------
     TRIP-LEVEL BILLING
     ------------------------------------------------------------ */

  getTripBilling: async (tripId) => {
    try {
      const response = await api.get(`/billing/trip/${tripId}`);
      return unwrapApi(response);
    } catch (error) {
      console.error(`Error fetching trip billing for ${tripId}:`, error);
      return null;
    }
  },

  calculateTripBilling: async (tripId, userId) => {
    try {
      const response = await api.post(
        withUserParam(`/billing/trip/${tripId}/calculate`, userId)
      );
      return unwrapApi(response);
    } catch (error) {
      console.error(`Error calculating trip billing for ${tripId}:`, error);
      throw error;
    }
  },

  recalculateTripBilling: async (tripId) => {
    try {
      const response = await api.post(`/billing/trip/${tripId}/recalculate`);
      return unwrapApi(response);
    } catch (error) {
      console.error(`Error recalculating trip billing for ${tripId}:`, error);
      throw error;
    }
  },
};

export default billingService;
