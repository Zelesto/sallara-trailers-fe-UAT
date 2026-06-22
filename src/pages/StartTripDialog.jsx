import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Box, Typography,
  Alert, Stack, Chip, Divider
} from '@mui/material';
import {
  PlayArrow as PlayArrowIcon,
  Speed as SpeedIcon,
  DirectionsCar as CarIcon,
  Person as PersonIcon,
  Close as CloseIcon
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
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: { borderRadius: 1.5 }
      }}
    >
      <DialogTitle sx={{ 
        py: 1.5, 
        px: 2.5, 
        borderBottom: 1, 
        borderColor: 'divider',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Box display="flex" alignItems="center" gap={1}>
          <PlayArrowIcon color="success" sx={{ fontSize: '1.2rem' }} />
          <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
            Start Trip
          </Typography>
        </Box>
        <Button
          size="small"
          onClick={handleClose}
          sx={{ minWidth: 'auto', p: 0.5 }}
        >
          <CloseIcon sx={{ fontSize: '1rem' }} />
        </Button>
      </DialogTitle>
      
      <DialogContent sx={{ p: 2.5 }}>
        <Stack spacing={2}>
          <Alert 
            severity="info" 
            sx={{ 
              fontSize: '0.8rem',
              '& .MuiAlert-icon': { fontSize: '1.2rem' }
            }}
          >
            Starting trip: <strong>#{trip.tripNumber}</strong>
          </Alert>

          <Divider />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <Box sx={{ flex: 1 }}>
              <Stack direction="row" alignItems="center" spacing={0.75}>
                <CarIcon sx={{ fontSize: '0.9rem', color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                  Vehicle
                </Typography>
              </Stack>
              <Typography variant="body2" fontWeight="500" sx={{ fontSize: '0.8rem' }}>
                {trip.vehicle?.registrationNumber || 'N/A'}
              </Typography>
              {trip.vehicle?.make && trip.vehicle?.model && (
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
                  {trip.vehicle.make} {trip.vehicle.model}
                </Typography>
              )}
            </Box>

            <Box sx={{ flex: 1 }}>
              <Stack direction="row" alignItems="center" spacing={0.75}>
                <PersonIcon sx={{ fontSize: '0.9rem', color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                  Driver
                </Typography>
              </Stack>
              <Typography variant="body2" fontWeight="500" sx={{ fontSize: '0.8rem' }}>
                {trip.driver?.name || 'N/A'}
              </Typography>
              {trip.driver?.licenseNumber && (
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
                  License: {trip.driver.licenseNumber}
                </Typography>
              )}
            </Box>
          </Stack>

          <Divider />

          {error && (
            <Alert 
              severity="error" 
              sx={{ fontSize: '0.8rem' }}
              onClose={() => setError('')}
            >
              {error}
            </Alert>
          )}

          <TextField
            fullWidth
            label="Odometer Reading (km)"
            type="number"
            value={odometer}
            onChange={(e) => setOdometer(e.target.value)}
            required
            size="small"
            autoFocus
            sx={{
              '& .MuiInputLabel-root': { fontSize: '0.75rem' },
              '& .MuiInputBase-root': { fontSize: '0.85rem' }
            }}
            InputProps={{
              endAdornment: (
                <SpeedIcon sx={{ fontSize: '1rem', color: 'text.secondary' }} />
              )
            }}
            helperText={
              <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'text.secondary' }}>
                Enter the current vehicle odometer reading in kilometers
              </Typography>
            }
          />

          <Box sx={{ 
            bgcolor: 'grey.50', 
            p: 1, 
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'divider'
          }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
              <strong>Note:</strong> Starting the trip will change the status to IN_PROGRESS and 
              record the starting odometer reading.
            </Typography>
          </Box>
        </Stack>
      </DialogContent>
      
      <DialogActions sx={{ 
        px: 2.5, 
        py: 1.5, 
        borderTop: 1, 
        borderColor: 'divider',
        gap: 1
      }}>
        <Button 
          onClick={handleClose}
          size="small"
          sx={{ fontSize: '0.8rem' }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="success"
          startIcon={<PlayArrowIcon sx={{ fontSize: '0.9rem' }} />}
          size="small"
          sx={{ 
            fontSize: '0.8rem',
            px: 2.5
          }}
          disabled={!odometer || parseFloat(odometer) <= 0}
        >
          Start Trip
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default StartTripDialog;
