// src/components/SessionExpiryHandler.jsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const SessionExpiryHandler = ({ children }) => {
  const navigate = useNavigate();
  const { logout, setSessionExpired } = useAuth();

  useEffect(() => {
    const handleSessionExpired = (event) => {
      console.log('Session expired event received:', event);
      
      // Clear auth data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Update auth state
      logout();
      setSessionExpired(true);
      
      // Use window.location as fallback if navigate fails
      const currentPath = window.location.pathname;
      if (currentPath !== '/login') {
        // Try using navigate first
        try {
          navigate('/login?session=expired', { replace: true });
        } catch (error) {
          // Fallback to window.location
          window.location.href = '/login?session=expired';
        }
      }
    };

    window.addEventListener('sessionExpired', handleSessionExpired);

    return () => {
      window.removeEventListener('sessionExpired', handleSessionExpired);
    };
  }, [navigate, logout, setSessionExpired]);

  return <>{children}</>;
};

export default SessionExpiryHandler;
