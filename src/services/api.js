import axios from 'axios';

// Use environment variable or fallback to your deployed backend URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://trailers-backend.onrender.com';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: false, // set true if backend uses cookies
});

// ---------------------------
// Request Interceptor (Debug + Auth)
// ---------------------------
api.interceptors.request.use(
  (config) => {
    console.log(`🌐 ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    console.log('Request headers:', config.headers);
    console.log('Request data:', config.data);

    const token = localStorage.getItem('token');
    if (token && token !== 'undefined' && token.trim() !== '') {
      console.log('Adding Authorization token:', token.substring(0, 20) + '...');
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
    console.log('Response data:', response.data);
    console.log('Response headers:', response.headers);

    return response.data;
  },
  (error) => {
    console.group('❌ API Error Details');
    console.error('Error:', error);
    console.error('URL:', error.config?.url);
    console.error('Method:', error.config?.method);
    console.error('Request headers:', error.config?.headers);
    console.error('Request data:', error.config?.data);
    console.error('Response status:', error.response?.status);
    console.error('Response data:', error.response?.data);
    console.error('Response headers:', error.response?.headers);
    console.groupEnd();

    const { response } = error;
    const status = response?.status || 500;
    let message = 'An unexpected error occurred';

    if (response?.data) {
      message =
        response.data.message ||
        response.data.error ||
        (typeof response.data === 'string' ? response.data : JSON.stringify(response.data)) ||
        error.message;
    }

    if (status === 401) {
      const isLoginPage = window.location.pathname === '/login';
      const isLoginRequest = error.config?.url?.includes('/auth/login');

      if (!isLoginPage && !isLoginRequest) {
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
      config: error.config,
    };

    return Promise.reject(normalizedError);
  }
);

// ---------------------------
// Helper Methods
// ---------------------------
api.setToken = (token) => {
  console.log('Setting token in localStorage and axios');
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
  const isAuth = !!(token && token !== 'undefined' && token.trim() !== '');
  console.log('isAuthenticated check:', isAuth);
  return isAuth;
};

// ---------------------------
// Test Connection
// ---------------------------
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
