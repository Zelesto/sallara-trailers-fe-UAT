// src/services/billingService.js
import api from './api';

const unwrapApi = (res) => {
  if (!res) return null;
  if (res.data !== undefined && (res.status !== undefined || res.config !== undefined)) {
    return res.data;
  }
  return res;
};

const toArray = (res) => {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  let payload = res;
  if (payload.data !== undefined && (payload.status !== undefined || payload.config !== undefined)) {
    payload = payload.data;
  }
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.content)) return payload.content;
  if (payload && Array.isArray(payload.data)) return payload.data;
  if (payload && payload.data && Array.isArray(payload.data.content)) return payload.data.content;
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
 * Backend requires userId as a query parameter on every billing POST.
 * If caller doesn't supply one, we throw — better to fail loudly in
 * the console than to hit the backend and get a cryptic 400.
 */
const withUserParam = (base, userId, action) => {
  if (userId === undefined || userId === null || userId === '') {
    throw new Error(
      `billingService.${action}: missing userId. The backend requires it as a query parameter. ` +
      `Call this with the current user's ID from AuthContext.`
    );
  }
  const sep = base.includes('?') ? '&' : '?';
  return `${base}${sep}userId=${encodeURIComponent(userId)}`;
};

const billingService = {
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

  getLoadBillingSummary: async (loadId) => {
    try {
      const response = await api.get(`/billing/load/${loadId}/summary`);
      return unwrapApi(response) || null;
    } catch (error) {
      console.error(`Error fetching billing summary for load ${loadId}:`, error);
      return null;
    }
  },

  getLoadBilling: async (loadId) => {
    try {
      const response = await api.get(`/billing/load/${loadId}`);
      return unwrapApi(response) || null;
    } catch (error) {
      console.error(`Error fetching billing for load ${loadId}:`, error);
      return null;
    }
  },

  // ⚠️ userId is REQUIRED by the backend — pass it from AuthContext
  calculateLoadBilling: async (loadId, userId) => {
    try {
      const response = await api.post(
        withUserParam(`/billing/load/${loadId}/calculate`, userId, 'calculateLoadBilling')
      );
      return unwrapApi(response);
    } catch (error) {
      console.error(`Error calculating billing for load ${loadId}:`, error);
      throw error;
    }
  },

  // ⚠️ userId is REQUIRED by the backend — pass it from AuthContext
  recalculateLoadBilling: async (loadId, userId) => {
    try {
      const response = await api.post(
        withUserParam(`/billing/load/${loadId}/recalculate`, userId, 'recalculateLoadBilling')
      );
      return unwrapApi(response);
    } catch (error) {
      console.error(`Error recalculating billing for load ${loadId}:`, error);
      throw error;
    }
  },

  // ⚠️ userId is REQUIRED by the backend — pass it from AuthContext
  generateInvoiceFromLoad: async (loadId, userId) => {
    try {
      const response = await api.post(
        withUserParam(`/billing/load/${loadId}/invoice`, userId, 'generateInvoiceFromLoad')
      );
      return unwrapApi(response);
    } catch (error) {
      console.error(`Error generating invoice from load ${loadId}:`, error);
      throw error;
    }
  },

  bulkGenerateInvoices: async (loadIds, userId) => {
    try {
      const response = await api.post(
        withUserParam('/billing/load/bulk-invoice', userId, 'bulkGenerateInvoices'),
        loadIds
      );
      return unwrapApi(response);
    } catch (error) {
      console.error('Error bulk generating invoices:', error);
      throw error;
    }
  },

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
        withUserParam(`/billing/trip/${tripId}/calculate`, userId, 'calculateTripBilling')
      );
      return unwrapApi(response);
    } catch (error) {
      console.error(`Error calculating trip billing for ${tripId}:`, error);
      throw error;
    }
  },

  recalculateTripBilling: async (tripId, userId) => {
    try {
      const response = await api.post(
        withUserParam(`/billing/trip/${tripId}/recalculate`, userId, 'recalculateTripBilling')
      );
      return unwrapApi(response);
    } catch (error) {
      console.error(`Error recalculating trip billing for ${tripId}:`, error);
      throw error;
    }
  },
};

export default billingService;
