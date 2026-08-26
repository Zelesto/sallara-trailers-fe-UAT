// src/components/TripEndDialog.jsx

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
  Typography,
  Box,
  CircularProgress,
} from '@mui/material';

const TripEndDialog = ({ open, tripId, onClose, onConfirm, tripService }) => {
  const [endOdometer, setEndOdometer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [trip, setTrip] = useState(null);
  const [loadingTrip, setLoadingTrip] = useState(true);

  useEffect(() => {
    if (open && tripId) {
      loadTripDetails();
    }
  }, [open, tripId]);

  const loadTripDetails = async () => {
    setLoadingTrip(true);
    try {
      const data = await tripService.getTripById(tripId);
      setTrip(data);
    } catch (err) {
      console.error('Error loading trip:', err);
      setError('Failed to load trip details');
    } finally {
      setLoadingTrip(false);
    }
  };

  const handleConfirm = async () => {
    const endOdometerNum = parseFloat(endOdometer);
    
    if (isNaN(endOdometerNum) || endOdometerNum <= 0) {
      setError('Please enter a valid odometer reading (positive number).');
      return;
    }
    
    if (trip && trip.actualStartOdometer && endOdometerNum < trip.actualStartOdometer) {
      setError(
        `End odometer (${endOdometerNum.toFixed(2)} km) cannot be less than start odometer (${trip.actualStartOdometer.toFixed(2)} km).\n\nPlease enter a valid ending odometer reading.`
      );
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      await onConfirm(tripId, endOdometerNum);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to end trip');
    } finally {
      setLoading(false);
    }
  };

  if (loadingTrip) {
    return (
      <Dialog open={open} onClose={onClose}>
        <DialogContent sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={30} />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>End Trip</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2, whiteSpace: 'pre-line' }}>
            {error}
          </Alert>
        )}
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            <strong>Trip:</strong> {trip?.tripNumber || 'N/A'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>Start Odometer:</strong> {trip?.actualStartOdometer?.toFixed(2) || 'N/A'} km
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>Status:</strong> {trip?.status || 'N/A'}
          </Typography>
        </Box>
        
        <TextField
          autoFocus
          margin="dense"
          label="End Odometer (km)"
          type="number"
          fullWidth
          value={endOdometer}
          onChange={(e) => {
            setEndOdometer(e.target.value);
            setError(null);
          }}
          helperText={trip?.actualStartOdometer 
            ? `Must be greater than ${trip.actualStartOdometer.toFixed(2)} km` 
            : 'Enter the ending odometer reading'}
          error={!!error && !error.includes('cannot be less')}
          inputProps={{ step: '0.01', min: trip?.actualStartOdometer || 0 }}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          disabled={loading || !endOdometer}
          color="primary"
        >
          {loading ? <CircularProgress size={20} /> : 'End Trip'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TripEndDialog;
