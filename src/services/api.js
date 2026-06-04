// src/api/axiosConfig.js

import axios from 'axios';

// Backend URL from environment variable
const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL?.trim() ||
  'http://localhost:8080/api';

console.log('API Base URL from env:', process.env.REACT_APP_API_BASE_URL);
console.log('Final API Base URL:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

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

    if (token && token !== 'undefined') {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (config.method?.toLowerCase() === 'get') {
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

    let message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'Unexpected error';

    if (status === 401) {
      const isAuthRequest =
        error.config?.url?.includes('/auth/login');

      const isAuthPage =
        window.location.pathname.includes('/login') ||
        window.location.pathname.includes('/signup');

      if (!isAuthRequest && !isAuthPage) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        setTimeout(() => {
          window.location.href = '/login?session=expired';
        }, 100);
      }
    }

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
  if (!token) return;

  localStorage.setItem('token', token);
  api.defaults.headers.common.Authorization = `Bearer ${token}`;
};

api.clearToken = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');

  delete api.defaults.headers.common.Authorization;
};

api.isAuthenticated = () => {
  const token = localStorage.getItem('token');

  return !!(
    token &&
    token !== 'undefined' &&
    token.trim() !== ''
  );
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
