// src/components/Layout/PrivateRoute.jsx
import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { CircularProgress, Box } from '@mui/material';

const PrivateRoute = ({ children, requiredRoles = [] }) => {
  const { isAuthenticated, user, loading, sessionExpired, setSessionExpired } = useAuth();
  const location = useLocation();

  // Check if session expired event was triggered
  useEffect(() => {
    const handleSessionExpired = () => {
      setSessionExpired(true);
    };

    window.addEventListener('sessionExpired', handleSessionExpired);

    return () => {
      window.removeEventListener('sessionExpired', handleSessionExpired);
    };
  }, [setSessionExpired]);

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="100vh"
      >
        <CircularProgress size={40} />
      </Box>
    );
  }

  // Check if session is expired - redirect to login
  if (sessionExpired) {
    return (
      <Navigate 
        to="/login?session=expired" 
        state={{ from: location }} 
        replace 
      />
    );
  }

  // Check if user is authenticated
  if (!isAuthenticated()) {
    return (
      <Navigate 
        to="/login" 
        state={{ from: location }} 
        replace 
      />
    );
  }

  // Check role-based access if required
  if (requiredRoles.length > 0 && user) {
    // Handle different role structures
    const userRoles = user.roles || user.role || [];
    const roleArray = Array.isArray(userRoles) ? userRoles : [userRoles];
    
    // Check if user has any of the required roles
    const hasRequiredRole = requiredRoles.some(role =>
      roleArray.some(userRole => 
        userRole === role || 
        userRole === `ROLE_${role}` || 
        userRole.name === role ||
        userRole.name === `ROLE_${role}`
      )
    );

    if (!hasRequiredRole) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  // If all checks pass, render children
  return children;
};

export default PrivateRoute;
