// src/contexts/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/auth';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }// src/contexts/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/auth';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => authService.getStoredUser());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessionExpired, setSessionExpired] = useState(false);
  
  // Get navigate function - must be used inside Router
  // We'll use a ref to store navigate since we can't use hook in event listeners
  const navigateRef = React.useRef();

  // Set navigate ref when available
  useEffect(() => {
    // This will be set by the component that uses useNavigate
    // For now, we'll use window.location as fallback
    const handleSessionExpired = () => {
      setSessionExpired(true);
      setUser(null);
      // Redirect to login with session expired parameter
      const currentPath = window.location.pathname;
      if (currentPath !== '/login') {
        // Use navigate if available, otherwise fallback to window.location
        if (navigateRef.current) {
          navigateRef.current('/login?session=expired', { replace: true });
        } else {
          window.location.href = '/login?session=expired';
        }
      }
    };

    window.addEventListener('sessionExpired', handleSessionExpired);

    return () => {
      window.removeEventListener('sessionExpired', handleSessionExpired);
    };
  }, []);

  // Load user on mount
  useEffect(() => {
    const loadUser = async () => {
      if (authService.isAuthenticated()) {
        try {
          const userData = await authService.getCurrentUser();
          setUser(userData);
          setSessionExpired(false);
        } catch (err) {
          console.error('Failed to load user:', err);
          // If token is invalid, clear it
          if (err.status === 401 || err.response?.status === 401) {
            authService.clearAuthData();
            setUser(null);
            setSessionExpired(true);
          }
        }
      }
      setLoading(false);
    };
    loadUser();
  }, []);

  // Login function
  const login = async (credentials) => {
    setLoading(true);
    setError(null);
    setSessionExpired(false);
    try {
      const result = await authService.login(credentials.email, credentials.password);

      console.log('AuthContext login result:', result);

      // Check different response structures
      let token, user;

      if (result.token && result.user) {
        token = result.token;
        user = result.user;
      } else if (result.data?.token) {
        token = result.data.token;
        user = result.data.user;
      } else if (result.access_token) {
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
      setSessionExpired(false);
      setLoading(false);

      return {
        success: true,
        user,
        token
      };
    } catch (err) {
      const errorMessage = err.message || err.error || 'Login failed';
      setError(errorMessage);
      setLoading(false);
      return { success: false, error: errorMessage };
    }
  };

  // Logout function
  const logout = useCallback(() => {
    authService.clearAuthData();
    setUser(null);
    setError(null);
    setSessionExpired(false);
    
    // Use navigate if available, otherwise fallback to window.location
    if (navigateRef.current) {
      navigateRef.current('/login', { replace: true });
    } else {
      window.location.href = '/login';
    }
  }, []);

  // Register function
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

  // Update profile function
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

  // Refresh user function
  const refreshUser = async () => {
    if (!authService.isAuthenticated()) return null;
    try {
      const userData = await authService.getCurrentUser();
      setUser(userData);
      return userData;
    } catch (err) {
      console.error('Failed to refresh user:', err);
      if (err.status === 401 || err.response?.status === 401) {
        authService.clearAuthData();
        setUser(null);
        setSessionExpired(true);
      }
      return null;
    }
  };

  // RBAC Helpers
  const isAuthenticated = useCallback(() => !!user && !sessionExpired, [user, sessionExpired]);

  const hasRole = useCallback((roleName) => {
    if (!user?.roles) return false;
    return user.roles.some(role =>
      role.name === roleName ||
      role.name === `ROLE_${roleName}` ||
      role === roleName ||
      role === `ROLE_${roleName}`
    );
  }, [user]);

  const hasAnyRole = useCallback((roleNames) => roleNames.some(r => hasRole(r)), [hasRole]);
  const hasAllRoles = useCallback((roleNames) => roleNames.every(r => hasRole(r)), [hasRole]);

  const hasPermission = useCallback((resource, action) => {
    if (!user?.roles) return false;
    return user.roles.some(role =>
      role.permissions?.some(p =>
        p.resource === resource && p.action === action
      )
    );
  }, [user]);

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
    sessionExpired,
    setSessionExpired,
    clearError: () => setError(null),
    setNavigate: (navigate) => {
      navigateRef.current = navigate;
    }
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook that includes navigation
export const useAuthWithNavigate = () => {
  const navigate = useNavigate();
  const auth = useAuth();
// Listen for session expiry events
useEffect(() => {
  const handleSessionExpired = () => {
    setSessionExpired(true);
    setUser(null);
    // Clear auth data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Redirect to login with session expired parameter
    const currentPath = window.location.pathname;
    if (currentPath !== '/login') {
      window.location.href = '/login?session=expired';
    }
  };

  window.addEventListener('sessionExpired', handleSessionExpired);

  return () => {
    window.removeEventListener('sessionExpired', handleSessionExpired);
  };
}, []);
  
  // Set the navigate ref when the hook is used
  useEffect(() => {
    if (auth.setNavigate) {
      auth.setNavigate(navigate);
    }
  }, [auth, navigate]);
  
  return auth;
};
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
  // LOAD USER ON MOUNT - WITH TIMEOUT HANDLING
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
        // Set a timeout for the request
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Request timeout')), 10000);
        });

        // Race the actual request against the timeout
        const userData = await Promise.race([
          authService.getCurrentUser(),
          timeoutPromise
        ]);

        if (userData) {
          setUser(userData);
          setIsAuthenticated(true);
          setSessionExpired(false);
        } else {
          authService.clearAuthData();
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (err) {
        console.error('Failed to load user:', err);
        
        // If timeout or 401, clear auth but don't show error to user
        if (err.message === 'Request timeout' || err.status === 401 || err.response?.status === 401) {
          authService.clearAuthData();
          setUser(null);
          setIsAuthenticated(false);
          setSessionExpired(true);
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

      setUser(result.user);
      setIsAuthenticated(true);
      setLoading(false);
      setSessionExpired(false);

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

  const logout = useCallback(async () => {
    console.log('🔴 AuthContext: Logging out...');
    
    try {
      await authService.logout();
    } catch (err) {
      console.error('Logout API error:', err);
    } finally {
      authService.clearAuthData();
      setUser(null);
      setIsAuthenticated(false);
      setError(null);
      setSessionExpired(false);
      
      if (navigateRef.current) {
        navigateRef.current('/login', { replace: true });
      } else {
        window.location.href = '/login';
      }
    }
  }, []);

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
    user,
    isAuthenticated,
    loading,
    error,
    sessionExpired,
    login,
    logout,
    register,
    updateProfile,
    refreshUser,
    clearError,
    hasRole,
    hasAnyRole,
    hasAllRoles,
    hasPermission,
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
  
  useEffect(() => {
    if (auth.setNavigate) {
      auth.setNavigate(navigate);
    }
  }, [auth, navigate]);
  
  return auth;
};

export default AuthProvider;
