// src/api/axiosConfig.js
import axios from 'axios';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

console.log('API Base URL from env:', import.meta.env.VITE_API_BASE_URL);
console.log('Final API Base URL:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Flag to prevent multiple redirects
let isRedirecting = false;

// ---------------------------
// Request Interceptor
// ---------------------------
api.interceptors.request.use(
  (config) => {
    const fullUrl = `${config.baseURL}${config.url}`;

    console.log(
      `🌐 ${config.method?.toUpperCase()} ${fullUrl}`
    );

    const token = localStorage.getItem('token');

    if (token && token !== 'undefined' && token.trim() !== '') {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      delete config.headers.Authorization;
    }

    // Don't add timestamp to auth requests
    if (config.method?.toLowerCase() === 'get' && !config.url?.includes('/auth/')) {
      config.params = {
        ...config.params,
        _t: Date.now(),
      };
    }

    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// ---------------------------
// Response Interceptor
// ---------------------------
api.interceptors.response.use(
  (response) => {
    console.log(
      `✅ ${response.config.method?.toUpperCase()} ${response.config.url}`
    );
    return response.data;
  },
  (error) => {
    console.group('❌ API Error');
    console.error('Message:', error.message);
    console.error('URL:', error.config?.url);
    console.error('Method:', error.config?.method);
    console.error('Status:', error.response?.status);
    console.error('Response:', error.response?.data);
    console.groupEnd();

    const status = error.response?.status || 500;
    const url = error.config?.url || '';

    let message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'Unexpected error';

    // ---------------------------
    // Session Expiry Handling (401)
    // ---------------------------
    if (status === 401) {
      // Skip for auth endpoints
      const isAuthRequest = 
        url.includes('/auth/login') ||
        url.includes('/auth/refresh') ||
        url.includes('/auth/verify');

      // Skip if already on login page
      const isAuthPage = window.location.pathname.includes('/login');

      // Only handle 401 for non-auth requests and non-auth pages
      if (!isAuthRequest && !isAuthPage && !isRedirecting) {
        isRedirecting = true;

        // Clear auth data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Dispatch session expiry event
        window.dispatchEvent(new CustomEvent('sessionExpired', {
          detail: { message: 'Your session has expired. Please log in again.' }
        }));

        // Reset redirect flag after delay
        setTimeout(() => {
          isRedirecting = false;
        }, 1000);

        // Return a specific error for session expiry
        return Promise.reject({
          status: 401,
          message: 'Session expired',
          isSessionExpired: true,
          data: error.response?.data,
          originalError: error,
        });
      }

      // For auth requests, just reject normally
      if (isAuthRequest) {
        return Promise.reject({
          status: 401,
          message: message,
          data: error.response?.data,
          originalError: error,
        });
      }
    }

    // ---------------------------
    // Other Error Handling
    // ---------------------------
    // Handle 403 Forbidden
    if (status === 403) {
      return Promise.reject({
        status: 403,
        message: 'You do not have permission to perform this action',
        data: error.response?.data,
        originalError: error,
      });
    }

    // Handle 404 Not Found
    if (status === 404) {
      return Promise.reject({
        status: 404,
        message: 'Resource not found',
        data: error.response?.data,
        originalError: error,
      });
    }

    // Handle 422 Validation Errors
    if (status === 422) {
      const validationErrors = error.response?.data?.errors || {};
      return Promise.reject({
        status: 422,
        message: 'Validation failed',
        errors: validationErrors,
        data: error.response?.data,
        originalError: error,
      });
    }

    // Handle 500 Internal Server Error
    if (status === 500) {
      return Promise.reject({
        status: 500,
        message: 'An internal server error occurred. Please try again later.',
        data: error.response?.data,
        originalError: error,
      });
    }

    // Handle Network Errors
    if (error.message === 'Network Error' || status === 0) {
      return Promise.reject({
        status: 0,
        message: 'Network error. Please check your connection.',
        originalError: error,
      });
    }

    // Default error
    return Promise.reject({
      status,
      message,
      data: error.response?.data,
      originalError: error,
    });
  }
);

// ---------------------------
// Auth Helpers
// ---------------------------
api.setToken = (token) => {
  if (!token || token === 'undefined' || token.trim() === '') {
    console.warn('Attempted to set invalid token');
    return;
  }

  localStorage.setItem('token', token);
  api.defaults.headers.common.Authorization = `Bearer ${token}`;
};

api.clearToken = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('refreshToken');

  delete api.defaults.headers.common.Authorization;
  
  isRedirecting = false;
};

api.isAuthenticated = () => {
  const token = localStorage.getItem('token');
  return !!(
    token &&
    token !== 'undefined' &&
    token.trim() !== ''
  );
};

api.getToken = () => {
  return localStorage.getItem('token');
};

api.getUser = () => {
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
};

api.setUser = (user) => {
  if (user) {
    localStorage.setItem('user', JSON.stringify(user));
  } else {
    localStorage.removeItem('user');
  }
};

// ---------------------------
// Session Management
// ---------------------------
api.checkSession = async () => {
  if (!api.isAuthenticated()) {
    return { valid: false, message: 'No token found' };
  }

  try {
    await api.get('/auth/verify');
    return { valid: true };
  } catch (error) {
    if (error.isSessionExpired) {
      return { valid: false, message: 'Session expired' };
    }
    return { valid: false, message: error.message };
  }
};

// ---------------------------
// Health Check
// ---------------------------
api.testConnection = async () => {
  try {
    return await api.get('/health');
  } catch (error) {
    console.error('Backend connection failed:', error);
    throw error;
  }
};

export default api;
