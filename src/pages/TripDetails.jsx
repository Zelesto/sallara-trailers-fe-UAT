import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Box, Grid, Card, CardContent, CardHeader,
  Typography, Divider, Chip, Button,
  Select, MenuItem, FormControl, InputLabel,
  TextField, CircularProgress, Alert
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Save as SaveIcon,
  Close as CloseIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon,
  DirectionsCar as CarIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { tripService } from '../services/tripService';

const statusColors = {
  PLANNED: 'primary',
  ACTIVE: 'success',
  IN_PROGRESS: 'warning',
  COMPLETED: 'info',
  CLOSED: 'secondary',
  CANCELLED: 'error'
};

const TripDetails = ({ open = false, tripId, onClose, onUpdate }) => {
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [actualStartDate, setActualStartDate] = useState(null);
  const [actualStartTime, setActualStartTime] = useState(null);
  const [actualEndDate, setActualEndDate] = useState(null);
  const [actualEndTime, setActualEndTime] = useState(null);
  const [error, setError] = useState(null);

  // Fetch trip details - useCallback to prevent unnecessary re-renders
  const fetchTripDetails = useCallback(async () => {
    if (!tripId) return;
    
    setLoading(true);
    setError(null);
    try {
      const data = await tripService.getTripById(tripId);
      setTrip(data);
      setNewStatus(data.status || '');
      
      if (data.actualStartDate) {
        const startDate = dayjs(data.actualStartDate);
        setActualStartDate(startDate);
        setActualStartTime(startDate);
      } else {
        setActualStartDate(null);
        setActualStartTime(null);
      }
      
      if (data.actualEndDate) {
        const endDate = dayjs(data.actualEndDate);
        setActualEndDate(endDate);
        setActualEndTime(endDate);
      } else {
        setActualEndDate(null);
        setActualEndTime(null);
      }
    } catch (err) {
      console.error('Error fetching trip:', err);
      setError('Failed to load trip details');
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  // Fetch trip details when modal opens
  useEffect(() => {
    if (open && tripId) {
      fetchTripDetails();
    }
  }, [open, tripId, fetchTripDetails]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      // Use setTimeout to avoid state updates during render
      const timer = setTimeout(() => {
        setTrip(null);
        setError(null);
        setNewStatus('');
        setActualStartDate(null);
        setActualStartTime(null);
        setActualEndDate(null);
        setActualEndTime(null);
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [open]);

  const handleUpdateTrip = async () => {
    if (!trip || !tripId) return;
    
    setUpdating(true);
    setError(null);
    
    try {
      // Combine date and time for actual start
      let actualStartDateTime = null;
      if (actualStartDate && actualStartTime) {
        actualStartDateTime = dayjs(actualStartDate)
          .set('hour', actualStartTime.hour())
          .set('minute', actualStartTime.minute())
          .set('second', 0);
      } else if (actualStartDate) {
        actualStartDateTime = dayjs(actualStartDate).startOf('day');
      }

      // Combine date and time for actual end
      let actualEndDateTime = null;
      if (actualEndDate && actualEndTime) {
        actualEndDateTime = dayjs(actualEndDate)
          .set('hour', actualEndTime.hour())
          .set('minute', actualEndTime.minute())
          .set('second', 0);
      } else if (actualEndDate) {
        actualEndDateTime = dayjs(actualEndDate).endOf('day');
      }

      const payload = {
        ...trip,
        status: newStatus || trip.status,
        actualStartDate: actualStartDateTime ? actualStartDateTime.toISOString() : null,
        actualEndDate: actualEndDateTime ? actualEndDateTime.toISOString() : null,
      };
      
      await tripService.updateTrip(tripId, payload);
      if (onUpdate) onUpdate();
      await fetchTripDetails();
    } catch (err) {
      console.error('Update error:', err);
      setError(err.message || 'Failed to update trip');
    } finally {
      setUpdating(false);
    }
  };

  const hasChanges = useMemo(() => {
    if (!trip) return false;
    
    // Check status change
    if (trip.status !== newStatus) return true;
    
    // Helper function to compare date times
    const compareDateTimes = (original, date, time) => {
      if (!original && (!date && !time)) return false;
      if (original && !date && !time) return true;
      if (!original && (date || time)) return true;
      
      if (date && time) {
        const newDateTime = dayjs(date)
          .set('hour', time.hour())
          .set('minute', time.minute())
          .set('second', 0);
        return !dayjs(original).isSame(newDateTime);
      }
      
      return false;
    };
    
    // Check actual start changes
    if (compareDateTimes(trip.actualStartDate, actualStartDate, actualStartTime)) {
      return true;
    }
    
    // Check actual end changes
    if (compareDateTimes(trip.actualEndDate, actualEndDate, actualEndTime)) {
      return true;
    }
    
    return false;
  }, [trip, newStatus, actualStartDate, actualStartTime, actualEndDate, actualEndTime]);

  const handleClose = () => {
    if (onClose) onClose();
  };

  const handleRefresh = () => {
    fetchTripDetails();
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { maxHeight: '90vh' }
        }}
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" flexWrap="wrap">
            <Typography variant="h6" component="span">
              Trip Details: {trip ? trip.tripNumber : 'Loading...'}
            </Typography>
            {trip && (
              <Chip 
                label={trip.status} 
                color={statusColors[trip.status] || 'default'}
                size="small"
                sx={{ ml: 2 }}
              />
            )}
          </Box>
        </DialogTitle>
        
        <DialogContent dividers>
          {error && (
            <Alert 
              severity="error" 
              sx={{ mb: 2 }}
              onClose={() => setError(null)}
            >
              {error}
            </Alert>
          )}
          
          {loading && !trip ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
              <CircularProgress />
            </Box>
          ) : trip ? (
            <Box>
              <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                  <Card variant="outlined" sx={{ mb: 3 }}>
                    <CardContent>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <Box display="flex" alignItems="center" mb={0.5}>
                            <LocationIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                            <Typography variant="subtitle2" color="textSecondary">
                              Origin
                            </Typography>
                          </Box>
                          <Typography variant="body1">
                            {trip.originLocation || '-'}
                          </Typography>
                        </Grid>
                        
                        <Grid item xs={12} sm={6}>
                          <Box display="flex" alignItems="center" mb={0.5}>
                            <LocationIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                            <Typography variant="subtitle2" color="textSecondary">
                              Destination
                            </Typography>
                          </Box>
                          <Typography variant="body1">
                            {trip.destinationLocation || '-'}
                          </Typography>
                        </Grid>
                        
                        <Grid item xs={12} sm={6}>
                          <Box display="flex" alignItems="center" mb={0.5}>
                            <PersonIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                            <Typography variant="subtitle2" color="textSecondary">
                              Driver
                            </Typography>
                          </Box>
                          <Typography variant="body1">
                            {trip.driverName || 'Not Assigned'}
                          </Typography>
                        </Grid>
                        
                        <Grid item xs={12} sm={6}>
                          <Box display="flex" alignItems="center" mb={0.5}>
                            <CarIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                            <Typography variant="subtitle2" color="textSecondary">
                              Vehicle
                            </Typography>
                          </Box>
                          <Typography variant="body1">
                            {trip.vehicleRegistration || 'Not Assigned'}
                          </Typography>
                        </Grid>
                        
                        <Grid item xs={12} sm={6}>
                          <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                            Planned Start
                          </Typography>
                          <Typography variant="body1">
                            {trip.plannedStartDate 
                              ? dayjs(trip.plannedStartDate).format('YYYY-MM-DD HH:mm')
                              : '-'
                            }
                          </Typography>
                        </Grid>
                        
                        <Grid item xs={12} sm={6}>
                          <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                            Planned End
                          </Typography>
                          <Typography variant="body1">
                            {trip.plannedEndDate 
                              ? dayjs(trip.plannedEndDate).format('YYYY-MM-DD HH:mm')
                              : '-'
                            }
                          </Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>

                  <Card variant="outlined">
                    <CardHeader 
                      title="Update Status & Times" 
                      titleTypographyProps={{ variant: 'subtitle1' }}
                    />
                    <CardContent>
                      <Grid container spacing={3}>
                        <Grid item xs={12}>
                          <Box display="flex" alignItems="center" mb={2}>
                            <Typography variant="body2" sx={{ mr: 1 }}>
                              Current Status:
                            </Typography>
                            <Chip 
                              label={trip.status} 
                              color={statusColors[trip.status] || 'default'}
                              size="small"
                            />
                          </Box>
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                          <FormControl fullWidth size="small">
                            <InputLabel>Change Status</InputLabel>
                            <Select
                              value={newStatus}
                              label="Change Status"
                              onChange={(e) => setNewStatus(e.target.value)}
                            >
                              {Object.keys(statusColors).map(status => (
                                <MenuItem key={status} value={status}>
                                  {status}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                        
                        <Grid item xs={12}>
                          <Divider sx={{ my: 2 }} />
                          <Typography variant="subtitle2" gutterBottom>
                            Actual Times
                          </Typography>
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                          <DatePicker
                            label="Actual Start Date"
                            value={actualStartDate}
                            onChange={(newValue) => {
                              setActualStartDate(newValue);
                              if (newValue && !actualStartTime) {
                                setActualStartTime(dayjs(newValue));
                              }
                            }}
                            slotProps={{ 
                              textField: { 
                                fullWidth: true, 
                                size: 'small',
                                error: false
                              } 
                            }}
                          />
                          <Box mt={1}>
                            <TimePicker
                              label="Actual Start Time"
                              value={actualStartTime}
                              onChange={setActualStartTime}
                              slotProps={{ 
                                textField: { 
                                  fullWidth: true, 
                                  size: 'small',
                                  disabled: !actualStartDate
                                } 
                              }}
                            />
                          </Box>
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                          <DatePicker
                            label="Actual End Date"
                            value={actualEndDate}
                            onChange={(newValue) => {
                              setActualEndDate(newValue);
                              if (newValue && !actualEndTime) {
                                setActualEndTime(dayjs(newValue));
                              }
                            }}
                            slotProps={{ 
                              textField: { 
                                fullWidth: true, 
                                size: 'small',
                                error: false
                              } 
                            }}
                          />
                          <Box mt={1}>
                            <TimePicker
                              label="Actual End Time"
                              value={actualEndTime}
                              onChange={setActualEndTime}
                              slotProps={{ 
                                textField: { 
                                  fullWidth: true, 
                                  size: 'small',
                                  disabled: !actualEndDate
                                } 
                              }}
                            />
                          </Box>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardHeader 
                      title="Cargo & Notes" 
                      titleTypographyProps={{ variant: 'subtitle1' }}
                    />
                    <CardContent>
                      <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                        Description:
                      </Typography>
                      <Typography variant="body2" paragraph sx={{ whiteSpace: 'pre-wrap' }}>
                        {trip.cargoDescription || 'No description provided'}
                      </Typography>
                      
                      <Divider sx={{ my: 2 }} />
                      
                      <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                        Notes:
                      </Typography>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                        {trip.notes || 'No notes'}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          ) : !loading && !trip ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
              <Typography color="text.secondary">No trip data available</Typography>
            </Box>
          ) : null}
        </DialogContent>
        
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            startIcon={loading ? <CircularProgress size={16} /> : <RefreshIcon />}
            onClick={handleRefresh}
            disabled={loading || updating}
          >
            Refresh
          </Button>
          
          <Box flex={1} />
          
          <Button 
            onClick={handleClose}
            disabled={updating}
          >
            Cancel
          </Button>
          
          <Button
            variant="contained"
            startIcon={updating ? <CircularProgress size={16} /> : <SaveIcon />}
            onClick={handleUpdateTrip}
            disabled={!hasChanges || updating || loading}
          >
            {updating ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default TripDetails;
