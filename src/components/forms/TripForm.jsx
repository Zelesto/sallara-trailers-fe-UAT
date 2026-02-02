import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Paper,
  Typography,
  Stack,
  Divider,
  FormControlLabel,
  Switch,
  Autocomplete
} from '@mui/material';
import { Save, Cancel, Directions, LocalShipping } from '@mui/icons-material';

const TripForm = ({ trip = null, onSave, onCancel, vehicles = [], drivers = [], loads = [] }) => {
  const [formData, setFormData] = useState({
    trip_number: '',
    driver_id: '',
    vehicle_id: '',
    load_id: '',
    origin_location: '',
    destination_location: '',
    planned_start_date: '',
    planned_end_date: '',
    actual_start_date: '',
    actual_end_date: '',
    status: 'Planned',
    notes: '',
    is_active: true
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (trip) {
      setFormData({
        trip_number: trip.trip_number || '',
        driver_id: trip.driver_id || '',
        vehicle_id: trip.vehicle_id || '',
        load_id: trip.load_id || '',
        origin_location: trip.origin_location || '',
        destination_location: trip.destination_location || '',
        planned_start_date: trip.planned_start_date ? trip.planned_start_date.split('T')[0] : '',
        planned_end_date: trip.planned_end_date ? trip.planned_end_date.split('T')[0] : '',
        actual_start_date: trip.actual_start_date ? trip.actual_start_date.split('T')[0] : '',
        actual_end_date: trip.actual_end_date ? trip.actual_end_date.split('T')[0] : '',
        status: trip.status || 'Planned',
        notes: trip.notes || '',
        is_active: trip.is_active !== undefined ? trip.is_active : true
      });
    }
  }, [trip]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.trip_number.trim()) {
      newErrors.trip_number = 'Trip number is required';
    }
    
    if (!formData.driver_id) {
      newErrors.driver_id = 'Driver is required';
    }
    
    if (!formData.vehicle_id) {
      newErrors.vehicle_id = 'Vehicle is required';
    }
    
    if (!formData.origin_location.trim()) {
      newErrors.origin_location = 'Origin location is required';
    }
    
    if (!formData.destination_location.trim()) {
      newErrors.destination_location = 'Destination location is required';
    }
    
    if (!formData.planned_start_date) {
      newErrors.planned_start_date = 'Planned start date is required';
    }
    
    if (!formData.planned_end_date) {
      newErrors.planned_end_date = 'Planned end date is required';
    } else if (new Date(formData.planned_end_date) < new Date(formData.planned_start_date)) {
      newErrors.planned_end_date = 'End date cannot be before start date';
    }
    
    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    setLoading(true);
    try {
      await onSave(formData);
      if (!trip) {
        // Reset form for new trip
        setFormData({
          trip_number: '',
          driver_id: '',
          vehicle_id: '',
          load_id: '',
          origin_location: '',
          destination_location: '',
          planned_start_date: '',
          planned_end_date: '',
          actual_start_date: '',
          actual_end_date: '',
          status: 'Planned',
          notes: '',
          is_active: true
        });
      }
    } catch (error) {
      console.error('Error saving trip:', error);
    } finally {
      setLoading(false);
    }
  };

  const getVehicleLabel = (vehicle) => {
    if (!vehicle) return '';
    return `${vehicle.registration_number} - ${vehicle.make} ${vehicle.model}`;
  };

  const getDriverLabel = (driver) => {
    if (!driver) return '';
    return `${driver.first_name} ${driver.last_name} (${driver.license_number})`;
  };

  const getLoadLabel = (load) => {
    if (!load) return '';
    return `${load.load_number} - ${load.description}`;
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        {trip ? 'Edit Trip' : 'Create New Trip'}
      </Typography>
      
      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom color="primary">
              Basic Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Trip Number *"
              name="trip_number"
              value={formData.trip_number}
              onChange={handleChange}
              error={!!errors.trip_number}
              helperText={errors.trip_number}
              disabled={loading || !!trip}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth error={!!errors.status}>
              <InputLabel>Status</InputLabel>
              <Select
                name="status"
                value={formData.status}
                onChange={handleChange}
                label="Status"
                disabled={loading}
              >
                <MenuItem value="Planned">Planned</MenuItem>
                <MenuItem value="In Progress">In Progress</MenuItem>
                <MenuItem value="Completed">Completed</MenuItem>
                <MenuItem value="Cancelled">Cancelled</MenuItem>
                <MenuItem value="Delayed">Delayed</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom color="primary">
              Driver & Vehicle Assignment
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth error={!!errors.driver_id}>
              <InputLabel>Driver *</InputLabel>
              <Select
                name="driver_id"
                value={formData.driver_id}
                onChange={handleChange}
                label="Driver *"
                disabled={loading}
              >
                <MenuItem value="">Select Driver</MenuItem>
                {drivers.map(driver => (
                  <MenuItem key={driver.id} value={driver.id}>
                    {getDriverLabel(driver)}
                  </MenuItem>
                ))}
              </Select>
              {errors.driver_id && <Typography color="error" variant="caption">{errors.driver_id}</Typography>}
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth error={!!errors.vehicle_id}>
              <InputLabel>Vehicle *</InputLabel>
              <Select
                name="vehicle_id"
                value={formData.vehicle_id}
                onChange={handleChange}
                label="Vehicle *"
                disabled={loading}
              >
                <MenuItem value="">Select Vehicle</MenuItem>
                {vehicles.map(vehicle => (
                  <MenuItem key={vehicle.id} value={vehicle.id}>
                    {getVehicleLabel(vehicle)}
                  </MenuItem>
                ))}
              </Select>
              {errors.vehicle_id && <Typography color="error" variant="caption">{errors.vehicle_id}</Typography>}
            </FormControl>
          </Grid>
          
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Load Assignment</InputLabel>
              <Select
                name="load_id"
                value={formData.load_id}
                onChange={handleChange}
                label="Load Assignment"
               