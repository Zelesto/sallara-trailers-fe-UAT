// src/components/SessionExpiryHandler.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  Button,
  Typography,
  Alert
} from '@mui/material';
import api from '../api/axiosConfig';

const SessionExpiryHandler = ({ children }) => {
  const navigate = useNavigate();
  const [showExpiryDialog, setShowExpiryDialog] = useState(false);
  const [expiryMessage, setExpiryMessage] = useState('Your session has expired. Please log in again.');

  useEffect(() => {
    // Listen for session expiry events
    const handleSessionExpired = (event) => {
      const message = event?.detail?.message || 'Your session has expired. Please log in again.';
      setExpiryMessage(message);
      setShowExpiryDialog(true);
      
      // Clear any auth data
      api.clearToken();
      
      // Redirect after a short delay
      setTimeout(() => {
        setShowExpiryDialog(false);
        navigate('/login?session=expired');
      }, 3000);
    };

    window.addEventListener('sessionExpired', handleSessionExpired);

    // Check session periodically (every 5 minutes)
    const sessionCheckInterval = setInterval(async () => {
      if (api.isAuthenticated()) {
        const result = await api.checkSession();
        if (!result.valid) {
          window.dispatchEvent(new CustomEvent('sessionExpired', {
            detail: { message: result.message || 'Session check failed' }
          }));
        }
      }
    }, 5 * 60 * 1000);

    return () => {
      window.removeEventListener('sessionExpired', handleSessionExpired);
      clearInterval(sessionCheckInterval);
    };
  }, [navigate]);

  const handleClose = () => {
    setShowExpiryDialog(false);
    navigate('/login?session=expired');
  };

  return (
    <>
      {children}
      
      <Dialog 
        open={showExpiryDialog} 
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" color="warning.main">
            Session Expired
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mt: 1 }}>
            {expiryMessage}
          </Alert>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            You will be redirected to the login page automatically.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} variant="contained">
            Go to Login
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SessionExpiryHandler;
