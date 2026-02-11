import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Box, Typography,
  Alert, Stack
} from '@mui/material';
import {
  PlayArrow as PlayArrowIcon,
  Speed as SpeedIcon
} from '@mui/icons-material';

const StartTripDialog = ({ open, onClose, onConfirm, trip }) => {
  const [odometer, setOdometer] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    const odoValue = parseFloat(odometer);
    if (!odoValue || odoValue <= 0) {
      setError('Please enter a valid odometer reading');
      return;
    }

    onConfirm(odoValue);
  };

  const handleClose = () => {
    setOdometer('');
    setError('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <PlayArrowIcon color="success" />
          <Typography variant="h6">Start Trip</Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Alert severity="info">
            Starting trip: <strong>#{trip.tripNumber}</strong>
          </Alert>

          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Vehicle: {trip.vehicle?.registrationNumber || 'N/A'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Driver: {trip.driver?.name || 'N/A'}
            </Typography>
          </Box>

          {error && (
            <Alert severity="error">{error}</Alert>
          )}

          <TextField
            fullWidth
            label="Odometer Reading (km)"
            type="number"
            value={odometer}
            onChange={(e) => setOdometer(e.target.value)}
            required
            InputProps={{
              endAdornment: <SpeedIcon sx={{ color: 'text.secondary' }} />
            }}
            helperText="Enter the current vehicle odometer reading"
          />
        </Stack>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="success"
          startIcon={<PlayArrowIcon />}
        >
          Start Trip
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default StartTripDialog;
