import api from './api';

const authService = {
  login: async (email, password) => {
    const payload = await api.post('/api/auth/login', { email, password });
    const { token, user } = payload;

    if (!token) throw new Error('No token returned from backend');

    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));

    return { token, user };
  },


  logout: async () => {
    try {
      await api.post('/api/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      }
  },

  getCurrentUser: async () => {
    try {
      const user = await api.get('/api/auth/me');
      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
      }
      return user;
    } catch (error) {
      console.error('Failed to get current user:', error);
      throw error.response?.data || error;
    }
  },

  register: async (userData) => {
    try {
      return await api.post('/api/auth/register', userData);
    } catch (error) {
      console.error('Registration error:', error);
      throw error.response?.data || error;
    }
  },

  updatePassword: async (oldPassword, newPassword) => {
    try {
      return await api.put('/api/user/password', { oldPassword, newPassword });
    } catch (error) {
      console.error('Password update error:', error);
      throw error.response?.data || error;
    }
  },

  updateProfile: async (profileData) => {
    try {
      const updatedUser = await api.put('/api/user/profile', profileData);
      if (updatedUser) {
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
      return updatedUser;
    } catch (error) {
      console.error('Profile update error:', error);
      throw error.response?.data || error;
    }
  },

  getUserProfile: async () => {
    try {
      return await api.get('/api/user/profile');
    } catch (error) {
      console.error('Get profile error:', error);
      throw error.response?.data || error;
    }
  },

  isAuthenticated: () => !!localStorage.getItem('token'),

  getStoredUser: () => {
    const userStr = localStorage.getItem('user');
    if (!userStr || userStr === 'undefined') return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  hasRole: (roleName) => {
    const user = authService.getStoredUser();
    if (!user?.roles) return false;
    return user.roles.some(
      (r) => r.name === roleName || r.name === `ROLE_${roleName}`
    );
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
};

export default authService;
