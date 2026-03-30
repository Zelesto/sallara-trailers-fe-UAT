// src/api/axiosConfig.js
import axios from 'axios';

// React (Create React App) uses REACT_APP_ prefix, not VITE_
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api';

console.log('API Base URL from env:', process.env.REACT_APP_API_BASE_URL);
console.log('Final API Base URL:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: false,
});

// ---------------------------
// Request Interceptor (Debug + Auth)
// ---------------------------
api.interceptors.request.use(
  (config) => {
    console.log(`🌐 ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    
    const token = localStorage.getItem('token');
    if (token && token !== 'undefined' && token.trim() !== '') {
      console.log('Adding Authorization token');
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add timestamp for GET requests to prevent caching
    if (config.method === 'get') {
      config.params = {
        ...config.params,
        _t: Date.now(),
      };
    }

    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// ---------------------------
// Response Interceptor (Debug + Error Normalization)
// ---------------------------
api.interceptors.response.use(
  (response) => {
    console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url}`);
    console.log('Response status:', response.status);
    
    // Return the data directly for convenience
    return response.data;
  },
  (error) => {
    console.group('❌ API Error Details');
    console.error('Error:', error);
    console.error('URL:', error.config?.url);
    console.error('Method:', error.config?.method);
    console.error('Response status:', error.response?.status);
    console.error('Response data:', error.response?.data);
    console.groupEnd();

    const { response } = error;
    const status = response?.status || 500;
    let message = 'An unexpected error occurred';

    if (response?.data) {
      message = response.data.message || response.data.error || error.message;
    }

    // Handle 401 Unauthorized
    if (status === 401) {
      const isLoginPage = window.location.pathname.includes('/login');
      const isLoginRequest = error.config?.url?.includes('/auth/login');
      const isAuthPage = isLoginPage || window.location.pathname.includes('/signup');
      
      if (!isAuthPage && !isLoginRequest) {
        console.warn('Session expired, redirecting to login');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setTimeout(() => {
          window.location.href = '/login?session=expired';
        }, 100);
      }
      
      message = response?.data?.message || 'Invalid credentials';
    }

    const normalizedError = {
      status,
      message,
      data: response?.data,
      originalError: error,
    };

    return Promise.reject(normalizedError);
  }
);

// ---------------------------
// Helper Methods
// ---------------------------
api.setToken = (token) => {
  console.log('Setting token');
  if (token) {
    localStorage.setItem('token', token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
};

api.clearToken = () => {
  console.log('Clearing token');
  localStorage.removeItem('token');
  delete api.defaults.headers.common['Authorization'];
};

api.isAuthenticated = () => {
  const token = localStorage.getItem('token');
  return !!(token && token !== 'undefined' && token.trim() !== '');
};

// Test connection to backend
api.testConnection = async () => {
  try {
    console.log('Testing connection to:', API_BASE_URL);
    const response = await api.get('/health');
    console.log('Connection test successful:', response);
    return { success: true, data: response };
  } catch (error) {
    console.error('Connection test failed:', error);
    return { success: false, error };
  }
};

export default api;
