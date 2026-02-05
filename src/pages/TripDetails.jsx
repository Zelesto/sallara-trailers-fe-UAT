import React, { useState, useEffect, useMemo } from 'react';
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

const TripDetails = ({ open, tripId, onClose, onUpdate }) => {
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState(null);
  const [actualStartDate, setActualStartDate] = useState(null);
  const [actualStartTime, setActualStartTime] = useState(null);
  const [actualEndDate, setActualEndDate] = useState(null);
  const [actualEndTime, setActualEndTime] = useState(null);
  const [error, setError] = useState(null);

  // Fetch trip details when modal opens
  useEffect(() => {
    if (open && tripId) {
      fetchTripDetails();
    } else {
      // Reset state when dialog closes
      setTrip(null);
      setError(null);
    }
  }, [open, tripId]);

  const fetchTripDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await tripService.getTripById(tripId);
      setTrip(data);
      setNewStatus(data.status);
      
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
  };

  const handleUpdateTrip = async () => {
    if (!trip) return;
    setUpdating(true);
    try {
      // Combine date and time for actual start
      let actualStartDateTime = null;
      if (actualStartDate && actualStartTime) {
        actualStartDateTime = actualStartDate
          .hour(actualStartTime.hour())
          .minute(actualStartTime.minute())
          .second(0);
      }

      // Combine date and time for actual end
      let actualEndDateTime = null;
      if (actualEndDate && actualEndTime) {
        actualEndDateTime = actualEndDate
          .hour(actualEndTime.hour())
          .minute(actualEndTime.minute())
          .second(0);
      }

      const payload = {
        ...trip,
        status: newStatus,
        actualStartDate: actualStartDateTime ? actualStartDateTime.toISOString() : null,
        actualEndDate: actualEndDateTime ? actualEndDateTime.toISOString() : null,
      };
      
      await tripService.updateTrip(tripId, payload);
      if (onUpdate) onUpdate();
      await fetchTripDetails();
    } catch (err) {
      console.error('Update error:', err);
      setError('Failed to update trip');
    } finally {
      setUpdating(false);
    }
  };

  const hasChanges = useMemo(() => {
    if (!trip) return false;
    
    // Check status change
    if (trip.status !== newStatus) return true;
    
    // Check actual start date/time changes
    const originalStart = trip.actualStartDate ? dayjs(trip.actualStartDate) : null;
    let newStart = null;
    if (actualStartDate && actualStartTime) {
      newStart = actualStartDate
        .hour(actualStartTime.hour())
        .minute(actualStartTime.minute())
        .second(0);
    }
    
    if ((originalStart && !newStart) || (!originalStart && newStart)) return true;
    if (originalStart && newStart && !originalStart.isSame(newStart)) return true;
    
    // Check actual end date/time changes
    const originalEnd = trip.actualEndDate ? dayjs(trip.actualEndDate) : null;
    let newEnd = null;
    if (actualEndDate && actualEndTime) {
      newEnd = actualEndDate
        .hour(actualEndTime.hour())
        .minute(actualEndTime.minute())
        .second(0);
    }
    
    if ((originalEnd && !newEnd) || (!originalEnd && newEnd)) return true;
    if (originalEnd && newEnd && !originalEnd.isSame(newEnd)) return true;
    
    return false;
  }, [trip, newStatus, actualStartDate, actualStartTime, actualEndDate, actualEndTime]);

  const handleClose = () => {
    onClose();
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          Trip Details: {trip ? trip.tripNumber : 'Loading...'}
          {trip && (
            <Chip 
              label={trip.status} 
              color={statusColors[trip.status] || 'default'}
              size="small"
              sx={{ ml: 2 }}
            />
          )}
        </DialogTitle>
        
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          {loading && !trip ? (
            <Box display="flex" justifyContent="center" p={3}>
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
                          <Typography variant="subtitle2" color="textSecondary">
                            <LocationIcon fontSize="small" sx={{ mr: 0.5, verticalAlign: 'middle' }} />
                            Origin
                          </Typography>
                          <Typography variant="body1">
                            {trip.originLocation}
                          </Typography>
                        </Grid>
                        
                        <Grid item xs={12} sm={6}>
                          <Typography variant="subtitle2" color="textSecondary">
                            <LocationIcon fontSize="small" sx={{ mr: 0.5, verticalAlign: 'middle' }} />
                            Destination
                          </Typography>
                          <Typography variant="body1">
                            {trip.destinationLocation}
                          </Typography>
                        </Grid>
                        
                        <Grid item xs={12} sm={6}>
                          <Typography variant="subtitle2" color="textSecondary">
                            <PersonIcon fontSize="small" sx={{ mr: 0.5, verticalAlign: 'middle' }} />
                            Driver
                          </Typography>
                          <Typography variant="body1">
                            {trip.driverName || 'Not Assigned'}
                          </Typography>
                        </Grid>
                        
                        <Grid item xs={12} sm={6}>
                          <Typography variant="subtitle2" color="textSecondary">
                            <CarIcon fontSize="small" sx={{ mr: 0.5, verticalAlign: 'middle' }} />
                            Vehicle
                          </Typography>
                          <Typography variant="body1">
                            {trip.vehicleRegistration || 'Not Assigned'}
                          </Typography>
                        </Grid>
                        
                        <Grid item xs={12} sm={6}>
                          <Typography variant="subtitle2" color="textSecondary">
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
                          <Typography variant="subtitle2" color="textSecondary">
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
                              value={newStatus || ''}
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
                            onChange={setActualStartDate}
                            slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                          />
                          <Box mt={1}>
                            <TimePicker
                              label="Actual Start Time"
                              value={actualStartTime}
                              onChange={setActualStartTime}
                              slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                            />
                          </Box>
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                          <DatePicker
                            label="Actual End Date"
                            value={actualEndDate}
                            onChange={setActualEndDate}
                            slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                          />
                          <Box mt={1}>
                            <TimePicker
                              label="Actual End Time"
                              value={actualEndTime}
                              onChange={setActualEndTime}
                              slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                            />
                          </Box>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Card variant="outlined">
                    <CardHeader 
                      title="Cargo & Notes" 
                      titleTypographyProps={{ variant: 'subtitle1' }}
                    />
                    <CardContent>
                      <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                        Description:
                      </Typography>
                      <Typography variant="body2" paragraph>
                        {trip.cargoDescription || 'No description provided'}
                      </Typography>
                      
                      <Divider sx={{ my: 2 }} />
                      
                      <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                        Notes:
                      </Typography>
                      <Typography variant="body2">
                        {trip.notes || 'No notes'}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          ) : null}
        </DialogContent>
        
        <DialogActions>
          <Button
            startIcon={<RefreshIcon />}
            onClick={fetchTripDetails}
            disabled={loading}
          >
            Refresh
          </Button>
          
          <Button onClick={handleClose}>
            Cancel
          </Button>
          
          <Button
            variant="contained"
            startIcon={updating ? <CircularProgress size={20} /> : <SaveIcon />}
            onClick={handleUpdateTrip}
            disabled={!hasChanges || updating}
          >
            {updating ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default TripDetails;
