import api from './api';

// Helper to build query strings safely
const buildQuery = (paramsObj = {}) => {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(paramsObj)) {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, value);
    }
  }
  return params.toString();
};

// Centralized GET request with normalized error handling
const getRequest = async (endpoint, paramsObj = {}) => {
  try {
    const queryString = buildQuery(paramsObj);
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;

    // Axios interceptor already returns response.data
    return await api.get(url);
  } catch (error) {
    const status = error.status ?? 500;
    const message = error.message ?? 'Unknown error';
    console.error(`Error fetching ${endpoint}:`, message);
    throw { status, message };
  }
};

export const analyticsService = {
  getDashboardKPIs: (startDate, endDate) =>
    getRequest('/api/analytics/dashboard', { startDate, endDate }),

  getVehicleAnalytics: (from, to, sortBy, order) =>
    getRequest('/api/analytics/vehicles', { from, to, sortBy, order }),

  getDriverAnalytics: (from, to, sortBy, order) =>
    getRequest('/api/analytics/drivers', { from, to, sortBy, order }),
};
