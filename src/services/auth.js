// src/services/auth.js
import api from './api';

const authService = {
  login: async (email, password) => {
    try {
      const payload = await api.post('/auth/login', { email, password });
      const { token, user } = payload;

      if (!token) throw new Error('No token returned from backend');

      // Store token and user data
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      // Also store in session storage for cross-tab sync
      sessionStorage.setItem('token', token);
      sessionStorage.setItem('user', JSON.stringify(user));

      return { token, user };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear all auth data
      authService.clearAuthData();
      
      // Dispatch session expiry event
      window.dispatchEvent(new CustomEvent('sessionExpired', {
        detail: { message: 'You have been logged out successfully' }
      }));
    }
  },

  clearAuthData: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    
    // Clear API headers
    delete api.defaults.headers.common.Authorization;
  },

  getCurrentUser: async () => {
    try {
      const user = await api.get('/auth/me');
      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
        sessionStorage.setItem('user', JSON.stringify(user));
      }
      return user;
    } catch (error) {
      console.error('Failed to get current user:', error);
      
      // If 401, clear auth data and dispatch session expiry
      if (error.status === 401 || error.response?.status === 401) {
        authService.clearAuthData();
        window.dispatchEvent(new CustomEvent('sessionExpired', {
          detail: { message: 'Your session has expired. Please log in again.' }
        }));
      }
      
      throw error.response?.data || error;
    }
  },

  register: async (userData) => {
    try {
      return await api.post('/auth/register', userData);
    } catch (error) {
      console.error('Registration error:', error);
      throw error.response?.data || error;
    }
  },

  updatePassword: async (oldPassword, newPassword) => {
    try {
      return await api.put('/user/password', { oldPassword, newPassword });
    } catch (error) {
      console.error('Password update error:', error);
      throw error.response?.data || error;
    }
  },

  updateProfile: async (profileData) => {
    try {
      const updatedUser = await api.put('/user/profile', profileData);
      if (updatedUser) {
        localStorage.setItem('user', JSON.stringify(updatedUser));
        sessionStorage.setItem('user', JSON.stringify(updatedUser));
      }
      return updatedUser;
    } catch (error) {
      console.error('Profile update error:', error);
      throw error.response?.data || error;
    }
  },

  getUserProfile: async () => {
    try {
      return await api.get('/user/profile');
    } catch (error) {
      console.error('Get profile error:', error);
      throw error.response?.data || error;
    }
  },

  isAuthenticated: () => {
    const token = localStorage.getItem('token');
    return !!(token && token !== 'undefined' && token.trim() !== '');
  },

  getStoredUser: () => {
    // Try localStorage first, then sessionStorage
    let userStr = localStorage.getItem('user');
    if (!userStr || userStr === 'undefined') {
      userStr = sessionStorage.getItem('user');
    }
    if (!userStr || userStr === 'undefined') return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  getToken: () => {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  },

  hasRole: (roleName) => {
    const user = authService.getStoredUser();
    if (!user?.roles) return false;
    return user.roles.some(
      (r) => r.name === roleName || r.name === `ROLE_${roleName}`
    );
  },

  hasAnyRole: (roleNames) => {
    return roleNames.some(role => authService.hasRole(role));
  },

  hasAllRoles: (roleNames) => {
    return roleNames.every(role => authService.hasRole(role));
  },

  hasPermission: (resource, action) => {
    const user = authService.getStoredUser();
    if (!user?.roles) return false;
    return user.roles.some((role) =>
      role.permissions?.some(
        (p) => p.resource === resource && p.action === action
      )
    );
  },

  // Session management - REMOVED automatic call
  checkSession: async () => {
    if (!authService.isAuthenticated()) {
      return { valid: false, message: 'No token found' };
    }

    try {
      await api.get('/auth/verify');
      return { valid: true };
    } catch (error) {
      if (error.status === 401 || error.response?.status === 401) {
        authService.clearAuthData();
        window.dispatchEvent(new CustomEvent('sessionExpired', {
          detail: { message: 'Your session has expired. Please log in again.' }
        }));
        return { valid: false, message: 'Session expired' };
      }
      return { valid: false, message: error.message };
    }
  },

  refreshToken: async () => {
    try {
      const response = await api.post('/auth/refresh');
      if (response.token) {
        localStorage.setItem('token', response.token);
        sessionStorage.setItem('token', response.token);
        if (response.user) {
          localStorage.setItem('user', JSON.stringify(response.user));
          sessionStorage.setItem('user', JSON.stringify(response.user));
        }
        return { success: true, token: response.token };
      }
      return { success: false, message: 'No token in refresh response' };
    } catch (error) {
      console.error('Refresh token error:', error);
      authService.clearAuthData();
      window.dispatchEvent(new CustomEvent('sessionExpired', {
        detail: { message: 'Session refresh failed. Please log in again.' }
      }));
      return { success: false, message: error.message };
    }
  },

  // Cross-tab synchronization
  syncSession: () => {
    window.addEventListener('storage', (event) => {
      if (event.key === 'token') {
        if (!event.newValue) {
          // Token was removed in another tab
          window.dispatchEvent(new CustomEvent('sessionExpired', {
            detail: { message: 'Session ended in another tab' }
          }));
        } else if (event.newValue !== event.oldValue) {
          // Token was updated in another tab
          const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
          if (userStr && userStr !== 'undefined') {
            try {
              const user = JSON.parse(userStr);
              window.dispatchEvent(new CustomEvent('sessionUpdated', {
                detail: { user }
              }));
            } catch {
              // Ignore parsing errors
            }
          }
        }
      }
    });
  },

  // Initialize cross-tab sync - REMOVED automatic session check
  init: () => {
    authService.syncSession();
    // REMOVED: authService.checkSession(); - This was causing the timeout
  }
};

// Initialize auth service on import
authService.init();

export default authService;
