import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Box, Typography,
  Alert, Stack, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import {
  Stop as StopIcon,
  Speed as SpeedIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';

const EndTripDialog = ({ open, onClose, onConfirm, trip }) => {
  const [odometer, setOdometer] = useState('');
  const [endReason, setEndReason] = useState('COMPLETED');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && trip?.startOdometer) {
      // Suggest end odometer based on trip distance
      const suggestedOdometer = trip.startOdometer + (trip.estimatedDistance || 0);
      setOdometer(suggestedOdometer.toString());
    }
  }, [open, trip]);

  const handleSubmit = () => {
    const odoValue = parseFloat(odometer);
    if (!odoValue || odoValue <= 0) {
      setError('Please enter a valid odometer reading');
      return;
    }

    const endData = {
      endOdometer: odoValue,
      endReason,
      notes: notes.trim() || undefined
    };

    onConfirm(endData);
  };

  const handleClose = () => {
    setOdometer('');
    setEndReason('COMPLETED');
    setNotes('');
    setError('');
    onClose();
  };

  const calculateDistance = () => {
    if (!odometer || !trip?.startOdometer) return 0;
    const endOdo = parseFloat(odometer);
    const startOdo = parseFloat(trip.startOdometer);
    return endOdo - startOdo;
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <StopIcon color="error" />
          <Typography variant="h6">End Trip</Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Alert severity="warning">
            Ending trip: <strong>#{trip.tripNumber}</strong>
          </Alert>

          <Box>
            <Typography variant="body2" color="text.secondary">
              Start Odometer: {trip.startOdometer ? `${trip.startOdometer} km` : 'N/A'}
            </Typography>
          </Box>

          {error && (
            <Alert severity="error">{error}</Alert>
          )}

          <TextField
            fullWidth
            label="End Odometer Reading (km)"
            type="number"
            value={odometer}
            onChange={(e) => setOdometer(e.target.value)}
            required
            InputProps={{
              endAdornment: <SpeedIcon sx={{ color: 'text.secondary' }} />
            }}
            helperText={`Distance traveled: ${calculateDistance()} km`}
          />

          <FormControl fullWidth>
            <InputLabel>End Reason</InputLabel>
            <Select
              value={endReason}
              label="End Reason"
              onChange={(e) => setEndReason(e.target.value)}
            >
              <MenuItem value="COMPLETED">Completed Successfully</MenuItem>
              <MenuItem value="CANCELLED">Cancelled</MenuItem>
              <MenuItem value="BREAKDOWN">Vehicle Breakdown</MenuItem>
              <MenuItem value="WEATHER">Weather Conditions</MenuItem>
              <MenuItem value="SAFETY">Safety Issues</MenuItem>
              <MenuItem value="OTHER">Other</MenuItem>
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="End Notes (Optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            multiline
            rows={2}
            helperText="Add any notes about trip completion"
          />
        </Stack>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="error"
          startIcon={<StopIcon />}
        >
          End Trip
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EndTripDialog;
