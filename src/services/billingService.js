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

/* ============================================================
   ✅ NEW: Resolve userId automatically so callers don't need to
   import AuthContext. Tries localStorage → JWT payload.
   ============================================================ */

const decodeJwtPayload = (token) => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
};

const tryParse = (raw) => {
  try { return JSON.parse(raw); } catch { return null; }
};

let _cachedUserId = null;

const resolveUserId = () => {
  // 1) Cache hit
  if (_cachedUserId !== null) return _cachedUserId;

  // 2) localStorage user object
  const userKeys = ['user', 'authUser', 'currentUser', 'auth_user', 'loggedInUser'];
  for (const k of userKeys) {
    const raw = localStorage.getItem(k);
    if (!raw) continue;
    const parsed = tryParse(raw);
    if (!parsed) continue;
    const id =
      parsed?.id ??
      parsed?.userId ??
      parsed?.user_id ??
      parsed?.user?.id ??
      parsed?.user?.userId;
    if (id != null) {
      _cachedUserId = id;
      return id;
    }
  }

  // 3) JWT payload
  const tokenKeys = ['token', 'authToken', 'access_token', 'jwt', 'auth_token'];
  for (const k of tokenKeys) {
    const token = localStorage.getItem(k);
    if (!token) continue;
    const payload = decodeJwtPayload(token);
    if (!payload) continue;
    const id =
      payload.userId ??
      payload.user_id ??
      payload.id ??
      (payload.sub && /^\d+$/.test(String(payload.sub)) ? Number(payload.sub) : null);
    if (id != null) {
      _cachedUserId = id;
      return id;
    }
  }

  // 4) Session storage fallback (some apps use it)
  for (const k of [...userKeys, ...tokenKeys]) {
    const raw = sessionStorage.getItem(k);
    if (!raw) continue;
    const parsed = tryParse(raw);
    if (parsed?.id != null) {
      _cachedUserId = parsed.id;
      return parsed.id;
    }
    if (parsed?.userId != null) {
      _cachedUserId = parsed.userId;
      return parsed.userId;
    }
  }

  return null;
};

/**
 * Clear the cached userId — call this from your logout handler so the next
 * login picks up the fresh user.
 */
export const clearBillingUserCache = () => { _cachedUserId = null; };

/* ============================================================
   withUserParam — now self-sufficient
   ============================================================ */

const withUserParam = (base, userId, action) => {
  const resolved = userId ?? resolveUserId();

  if (resolved === undefined || resolved === null || resolved === '') {
    // eslint-disable-next-line no-console
    console.error(
      `billingService.${action}: could not resolve userId. ` +
      `Pass it explicitly, or ensure your login flow stores { id } under ` +
      `localStorage key "user", "authUser", or "currentUser", or stores a JWT ` +
      `under key "token" whose payload contains userId/user_id/id/sub. ` +
      `Current localStorage keys: [${Object.keys(localStorage).join(', ')}]`
    );
    throw new Error(
      `billingService.${action}: missing userId (could not resolve from localStorage or JWT).`
    );
  }

  const sep = base.includes('?') ? '&' : '?';
  return `${base}${sep}userId=${encodeURIComponent(resolved)}`;
};

/* ============================================================
   Public API
   ============================================================ */

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

  // userId optional — resolves from localStorage/JWT if not passed
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

  // userId optional — resolves from localStorage/JWT if not passed
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

  // userId optional — resolves from localStorage/JWT if not passed
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

  // ✅ New: expose the resolver so other places can use it too
  resolveUserId,
};

export default billingService;
