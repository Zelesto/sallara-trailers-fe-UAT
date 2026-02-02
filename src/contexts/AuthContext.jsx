import React, { createContext, useState, useContext, useEffect } from 'react';
import authService from '../services/auth';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => authService.getStoredUser());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      if (authService.isAuthenticated()) {
        try {
          const userData = await authService.getCurrentUser();
          setUser(userData);
        } catch (err) {
          console.error('Failed to load user:', err);
        }
      }
      setLoading(false);
    };
    loadUser();
  }, []);

  // AuthContext.jsx - Fix the login function
  const login = async (credentials) => {
    setLoading(true);
    setError(null);
    try {
      const result = await authService.login(credentials.email, credentials.password);

      console.log('AuthContext login result:', result); // Debug

      // Check different response structures
      let token, user;

      if (result.token && result.user) {
        // Direct structure: {token, user, success}
        token = result.token;
        user = result.user;
      } else if (result.data?.token) {
        // Nested structure: {data: {token, user, success}}
        token = result.data.token;
        user = result.data.user;
      } else if (result.access_token) {
        // Alternative structure: {access_token, user}
        token = result.access_token;
        user = result.user;
      } else {
        console.error('Unexpected response structure:', result);
        throw new Error('Invalid response from server');
      }

      if (!token) {
        throw new Error('No authentication token received');
      }

      setUser(user);

      return {
        success: true,
        user,
        token
      };
    } catch (err) {
      const errorMessage = err.message || err.error || 'Login failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setError(null);
  };

  const register = async (userData) => {
    setLoading(true);
    setError(null);
    try {
      const result = await authService.register(userData);
      return { success: true, data: result };
    } catch (err) {
      const errorMessage = err.error || err.message || 'Registration failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (profileData) => {
    setLoading(true);
    setError(null);
    try {
      const result = await authService.updateProfile(profileData);
      setUser(prev => ({ ...prev, ...profileData }));
      return { success: true, data: result };
    } catch (err) {
      const errorMessage = err.error || err.message || 'Profile update failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    if (!authService.isAuthenticated()) return null;
    try {
      const userData = await authService.getCurrentUser();
      setUser(userData);
      return userData;
    } catch (err) {
      console.error('Failed to refresh user:', err);
      return null;
    }
  };

  // ---------------- RBAC Helpers ----------------
  const isAuthenticated = () => !!user;

  const hasRole = (roleName) => {
    if (!user?.roles) return false;
    return user.roles.some(role =>
      role.name === roleName ||
      role.name === `ROLE_${roleName}`
    );
  };

  const hasAnyRole = (roleNames) => roleNames.some(r => hasRole(r));
  const hasAllRoles = (roleNames) => roleNames.every(r => hasRole(r));

  const hasPermission = (resource, action) => {
    if (!user?.roles) return false;
    return user.roles.some(role =>
      role.permissions?.some(p =>
        p.resource === resource && p.action === action
      )
    );
  };

  const value = {
    user,
    login,
    logout,
    register,
    updateProfile,
    refreshUser,
    isAuthenticated,
    hasRole,
    hasAnyRole,
    hasAllRoles,
    hasPermission,
    loading,
    error,
    clearError: () => setError(null),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
