// src/contexts/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/auth';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  // ============================================================
  // STATE
  // ============================================================
  const [user, setUser] = useState(() => authService.getStoredUser());
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!authService.getStoredUser());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessionExpired, setSessionExpired] = useState(false);
  const navigateRef = useRef(null);

  // ============================================================
  // LOAD USER ON MOUNT
  // ============================================================
  useEffect(() => {
    const loadUser = async () => {
      const token = authService.getToken();
      
      if (!token) {
        setLoading(false);
        setIsAuthenticated(false);
        setUser(null);
        return;
      }

      try {
        const userData = await authService.getCurrentUser();
        if (userData) {
          setUser(userData);
          setIsAuthenticated(true);
          setSessionExpired(false);
        } else {
          // User data is invalid
          authService.clearAuthData();
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (err) {
        console.error('Failed to load user:', err);
        // If 401 or session expired, clear auth
        if (err.status === 401 || err.response?.status === 401) {
          authService.clearAuthData();
          setUser(null);
          setIsAuthenticated(false);
          setSessionExpired(true);
          
          // Dispatch session expired event
          window.dispatchEvent(new CustomEvent('sessionExpired', {
            detail: { message: 'Your session has expired. Please log in again.' }
          }));
        }
        setError(err.message || 'Failed to load user');
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  // ============================================================
  // SESSION EXPIRY HANDLER
  // ============================================================
  useEffect(() => {
    const handleSessionExpired = (event) => {
      console.log('🔴 Session expired event received:', event?.detail);
      authService.clearAuthData();
      setUser(null);
      setIsAuthenticated(false);
      setSessionExpired(true);
      
      // Redirect to login
      if (navigateRef.current) {
        navigateRef.current('/login?session=expired', { replace: true });
      } else {
        window.location.href = '/login?session=expired';
      }
    };

    window.addEventListener('sessionExpired', handleSessionExpired);

    return () => {
      window.removeEventListener('sessionExpired', handleSessionExpired);
    };
  }, []);

  // ============================================================
  // AUTH METHODS
  // ============================================================

  /**
   * Login user
   */
  const login = useCallback(async (credentials) => {
    setLoading(true);
    setError(null);
    setSessionExpired(false);

    try {
      const result = await authService.login(credentials.email, credentials.password);
      
      console.log('🔐 AuthContext: Login result:', {
        hasToken: !!result.token,
        hasUser: !!result.user,
      });

      if (!result.token) {
        throw new Error('No authentication token received');
      }

      // Update state
      setUser(result.user);
      setIsAuthenticated(true);
      setLoading(false);
      setSessionExpired(false);

      console.log('✅ AuthContext: User authenticated successfully', {
        email: result.user?.email,
        roles: result.user?.roles?.length || 0
      });

      return {
        success: true,
        user: result.user,
        token: result.token
      };
    } catch (err) {
      const errorMessage = err.message || err.error || 'Login failed';
      console.error('❌ AuthContext: Login failed:', errorMessage);
      setError(errorMessage);
      setLoading(false);
      setIsAuthenticated(false);
      setUser(null);
      
      return { success: false, error: errorMessage };
    }
  }, []);

  /**
   * Logout user
   */
  const logout = useCallback(async () => {
    console.log('🔴 AuthContext: Logging out...');
    
    try {
      await authService.logout();
    } catch (err) {
      console.error('Logout API error:', err);
    } finally {
      // Always clear local state
      authService.clearAuthData();
      setUser(null);
      setIsAuthenticated(false);
      setError(null);
      setSessionExpired(false);
      
      // Redirect to login
      if (navigateRef.current) {
        navigateRef.current('/login', { replace: true });
      } else {
        window.location.href = '/login';
      }
    }
  }, []);

  /**
   * Register new user
   */
  const register = useCallback(async (userData) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await authService.register(userData);
      setLoading(false);
      return { success: true, data: result };
    } catch (err) {
      const errorMessage = err.error || err.message || 'Registration failed';
      setError(errorMessage);
      setLoading(false);
      return { success: false, error: errorMessage };
    }
  }, []);

  /**
   * Update user profile
   */
  const updateProfile = useCallback(async (profileData) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await authService.updateProfile(profileData);
      setUser(prev => ({ ...prev, ...result }));
      setLoading(false);
      return { success: true, data: result };
    } catch (err) {
      const errorMessage = err.error || err.message || 'Profile update failed';
      setError(errorMessage);
      setLoading(false);
      return { success: false, error: errorMessage };
    }
  }, []);

  /**
   * Refresh user data
   */
  const refreshUser = useCallback(async () => {
    if (!isAuthenticated) return null;
    
    try {
      const userData = await authService.getCurrentUser();
      if (userData) {
        setUser(userData);
        setIsAuthenticated(true);
        setSessionExpired(false);
        return userData;
      }
      return null;
    } catch (err) {
      console.error('Failed to refresh user:', err);
      if (err.status === 401 || err.response?.status === 401) {
        authService.clearAuthData();
        setUser(null);
        setIsAuthenticated(false);
        setSessionExpired(true);
      }
      return null;
    }
  }, [isAuthenticated]);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // ============================================================
  // RBAC HELPERS
  // ============================================================

  const hasRole = useCallback((roleName) => {
    if (!user?.roles) return false;
    return user.roles.some(role =>
      role.name === roleName ||
      role.name === `ROLE_${roleName}` ||
      role === roleName ||
      role === `ROLE_${roleName}`
    );
  }, [user]);

  const hasAnyRole = useCallback((roleNames) => {
    return roleNames.some(r => hasRole(r));
  }, [hasRole]);

  const hasAllRoles = useCallback((roleNames) => {
    return roleNames.every(r => hasRole(r));
  }, [hasRole]);

  const hasPermission = useCallback((resource, action) => {
    if (!user?.roles) return false;
    return user.roles.some(role =>
      role.permissions?.some(p =>
        p.resource === resource && p.action === action
      )
    );
  }, [user]);

  // ============================================================
  // SET NAVIGATE REF
  // ============================================================
  const setNavigate = useCallback((nav) => {
    navigateRef.current = nav;
  }, []);

  // ============================================================
  // CONTEXT VALUE
  // ============================================================
  const value = {
    // State
    user,
    isAuthenticated,
    loading,
    error,
    sessionExpired,
    
    // Auth methods
    login,
    logout,
    register,
    updateProfile,
    refreshUser,
    clearError,
    
    // RBAC
    hasRole,
    hasAnyRole,
    hasAllRoles,
    hasPermission,
    
    // Utilities
    setNavigate,
    setSessionExpired,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// ============================================================
// CUSTOM HOOK WITH NAVIGATE
// ============================================================
export const useAuthWithNavigate = () => {
  const navigate = useNavigate();
  const auth = useAuth();
  
  // Set the navigate ref when the hook is used
  useEffect(() => {
    if (auth.setNavigate) {
      auth.setNavigate(navigate);
    }
  }, [auth, navigate]);
  
  return auth;
};

export default AuthProvider;
