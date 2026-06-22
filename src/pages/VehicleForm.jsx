// src/pages/vehicles/VehicleForm.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  Alert,
  CircularProgress,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Stack,
  Divider,
  Chip,
  InputAdornment,
  FormHelperText,
} from '@mui/material';
import { 
  ArrowBack, 
  Save, 
  DirectionsCar,
  Speed,
  LocalGasStation,
  Build,
  CalendarToday,
  Description,
  Scale,
  Settings,
} from '@mui/icons-material';
import { vehicleService } from '../services/vehicleService';

// Constants
const VEHICLE_TYPES = [
  'TRUCK',
  'TRAILER',
  'TANKER',
  'REFRIGERATED',
  'FLATBED',
  'CURTAINSIDER',
  'CONTAINER',
  'LOWBED',
  'TIPPER',
  'OTHER'
];

const FUEL_TYPES = [
  'Diesel',
  'Petrol',
  'Electric',
  'Hybrid',
  'CNG',
  'LPG',
  'Biofuel',
  'Other'
];

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Active', color: 'success' },
  { value: 'AVAILABLE', label: 'Available', color: 'info' },
  { value: 'IN_MAINTENANCE', label: 'In Maintenance', color: 'warning' },
  { value: 'OUT_OF_SERVICE', label: 'Out of Service', color: 'error' },
  { value: 'INACTIVE', label: 'Inactive', color: 'default' },
];

const VehicleForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formErrors, setFormErrors] = useState({});

  const [formData, setFormData] = useState({
    registrationNumber: '',
    make: '',
    model: '',
    year: '',
    vehicleType: '',
    capacityKg: '',
    status: 'ACTIVE',
    fuelType: '',
    currentMileage: '',
    engineSize: '',
    fuelConsumption: '',
    lastServiceDate: '',
    nextServiceDate: '',
    vinNumber: '',
    color: '',
    notes: '',
  });

  useEffect(() => {
    if (isEditMode) {
      loadVehicle();
    }
  }, [id]);

  const loadVehicle = async () => {
    try {
      setLoading(true);
      const vehicle = await vehicleService.getVehicleById(id);
      setFormData({
        registrationNumber: vehicle.registrationNumber || '',
        make: vehicle.make || '',
        model: vehicle.model || '',
        year: vehicle.year || '',
        vehicleType: vehicle.vehicleType || '',
        capacityKg: vehicle.capacityKg || '',
        status: vehicle.status || 'ACTIVE',
        fuelType: vehicle.fuelType || '',
        currentMileage: vehicle.currentMileage || '',
        engineSize: vehicle.engineSize || '',
        fuelConsumption: vehicle.fuelConsumption || '',
        lastServiceDate: vehicle.lastServiceDate || '',
        nextServiceDate: vehicle.nextServiceDate || '',
        vinNumber: vehicle.vinNumber || '',
        color: vehicle.color || '',
        notes: vehicle.notes || '',
      });
      setError('');
    } catch (err) {
      setError('Failed to load vehicle data');
      console.error('Error loading vehicle:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.registrationNumber.trim()) {
      errors.registrationNumber = 'Registration Number is required';
    }
    if (!formData.make.trim()) {
      errors.make = 'Make is required';
    }
    if (!formData.model.trim()) {
      errors.model = 'Model is required';
    }
    if (!formData.vehicleType) {
      errors.vehicleType = 'Vehicle Type is required';
    }
    if (!formData.status) {
      errors.status = 'Status is required';
    }
    if (formData.year && (isNaN(formData.year) || formData.year < 1900 || formData.year > new Date().getFullYear() + 1)) {
      errors.year = 'Please enter a valid year';
    }
    if (formData.capacityKg && isNaN(formData.capacityKg)) {
      errors.capacityKg = 'Capacity must be a number';
    }
    if (formData.currentMileage && isNaN(formData.currentMileage)) {
      errors.currentMileage = 'Mileage must be a number';
    }
    if (formData.fuelConsumption && isNaN(formData.fuelConsumption)) {
      errors.fuelConsumption = 'Fuel consumption must be a number';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) {
      const firstErrorField = Object.keys(formErrors)[0];
      const element = document.querySelector(`[name="${firstErrorField}"]`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.focus();
      }
      return;
    }

    setSubmitting(true);
    try {
      const vehicleData = {
        ...formData,
        capacityKg: formData.capacityKg ? parseFloat(formData.capacityKg) : null,
        currentMileage: formData.currentMileage ? parseFloat(formData.currentMileage) : null,
        year: formData.year ? parseInt(formData.year, 10) : null,
      };

      let result;
      if (isEditMode) {
        result = await vehicleService.updateVehicle(id, vehicleData);
        setSuccess('Vehicle updated successfully!');
      } else {
        result = await vehicleService.createVehicle(vehicleData);
        setSuccess('Vehicle created successfully!');
      }

      console.log('Vehicle saved:', result);

      setTimeout(() => {
        navigate('/vehicles');
      }, 1500);
    } catch (err) {
      console.error('Error saving vehicle:', err);
      setError(err.message || `Failed to ${isEditMode ? 'update' : 'create'} vehicle`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this vehicle?')) return;
    try {
      await vehicleService.deleteVehicle(id);
      navigate('/vehicles');
    } catch (err) {
      setError('Failed to delete vehicle');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress size={40} />
        <Typography sx={{ ml: 2, fontSize: '0.9rem' }}>Loading vehicle data...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 1, sm: 1.5, md: 2 } }}>
      {/* Header - Compact */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Box>
          <Typography variant="h6" fontWeight="600" sx={{ fontSize: '1rem' }}>
            {isEditMode ? 'Edit Vehicle' : 'Create New Vehicle'}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
            {isEditMode ? 'Update vehicle information' : 'Add a new vehicle to the fleet'}
          </Typography>
        </Box>
        <Button 
          startIcon={<ArrowBack sx={{ fontSize: '0.9rem' }} />} 
          onClick={() => navigate('/vehicles')}
          size="small"
          sx={{ fontSize: '0.75rem' }}
        >
          Back to Vehicles
        </Button>
      </Box>

      {/* Form */}
      <Paper sx={{ p: { xs: 1.5, sm: 2 } }}>
        <form onSubmit={handleSubmit}>
          {error && (
            <Alert severity="error" sx={{ mb: 2, fontSize: '0.8rem' }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 2, fontSize: '0.8rem' }} onClose={() => setSuccess('')}>
              {success}
            </Alert>
          )}

          <Grid container spacing={2}>
            {/* Basic Information Section */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ fontSize: '0.8rem', fontWeight: 600, mb: 1.5 }}>
                <DirectionsCar sx={{ mr: 0.5, fontSize: '1rem', verticalAlign: 'middle' }} />
                Basic Information
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Registration Number *"
                name="registrationNumber"
                value={formData.registrationNumber}
                onChange={handleChange}
                required
                size="small"
                error={!!formErrors.registrationNumber}
                helperText={formErrors.registrationNumber}
                placeholder="e.g., ABC123GP"
                sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Make *"
                name="make"
                value={formData.make}
                onChange={handleChange}
                required
                size="small"
                error={!!formErrors.make}
                helperText={formErrors.make}
                placeholder="e.g., SCANIA, MERCEDES, VOLVO"
                sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Model *"
                name="model"
                value={formData.model}
                onChange={handleChange}
                required
                size="small"
                error={!!formErrors.model}
                helperText={formErrors.model}
                placeholder="e.g., R500, ACTROS, FH16"
                sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Year"
                name="year"
                type="number"
                value={formData.year}
                onChange={handleChange}
                size="small"
                error={!!formErrors.year}
                helperText={formErrors.year || 'e.g., 2023'}
                sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
                InputProps={{ inputProps: { min: 1900, max: new Date().getFullYear() + 1 } }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small" error={!!formErrors.vehicleType}>
                <InputLabel sx={{ fontSize: '0.75rem' }}>Vehicle Type *</InputLabel>
                <Select
                  name="vehicleType"
                  value={formData.vehicleType}
                  label="Vehicle Type *"
                  onChange={handleChange}
                  required
                  sx={{ fontSize: '0.8rem' }}
                >
                  <MenuItem value="" sx={{ fontSize: '0.8rem' }}>Select Type</MenuItem>
                  {VEHICLE_TYPES.map(type => (
                    <MenuItem key={type} value={type} sx={{ fontSize: '0.8rem' }}>{type}</MenuItem>
                  ))}
                </Select>
                {formErrors.vehicleType && (
                  <FormHelperText sx={{ fontSize: '0.65rem' }}>{formErrors.vehicleType}</FormHelperText>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small" error={!!formErrors.status}>
                <InputLabel sx={{ fontSize: '0.75rem' }}>Status *</InputLabel>
                <Select
                  name="status"
                  value={formData.status}
                  label="Status *"
                  onChange={handleChange}
                  required
                  sx={{ fontSize: '0.8rem' }}
                >
                  {STATUS_OPTIONS.map(option => (
                    <MenuItem key={option.value} value={option.value} sx={{ fontSize: '0.8rem' }}>
                      <Chip 
                        label={option.label} 
                        size="small" 
                        color={option.color} 
                        sx={{ height: 18, fontSize: '0.55rem' }}
                      />
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.status && (
                  <FormHelperText sx={{ fontSize: '0.65rem' }}>{formErrors.status}</FormHelperText>
                )}
              </FormControl>
            </Grid>

            {/* Specifications Section */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ fontSize: '0.8rem', fontWeight: 600, mb: 1.5, mt: 1 }}>
                <Settings sx={{ mr: 0.5, fontSize: '1rem', verticalAlign: 'middle' }} />
                Specifications
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="VIN Number"
                name="vinNumber"
                value={formData.vinNumber}
                onChange={handleChange}
                size="small"
                placeholder="Vehicle Identification Number"
                sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Color"
                name="color"
                value={formData.color}
                onChange={handleChange}
                size="small"
                placeholder="e.g., White, Blue, Red"
                sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ fontSize: '0.75rem' }}>Fuel Type</InputLabel>
                <Select
                  name="fuelType"
                  value={formData.fuelType}
                  label="Fuel Type"
                  onChange={handleChange}
                  sx={{ fontSize: '0.8rem' }}
                >
                  <MenuItem value="" sx={{ fontSize: '0.8rem' }}>Select Fuel Type</MenuItem>
                  {FUEL_TYPES.map(type => (
                    <MenuItem key={type} value={type} sx={{ fontSize: '0.8rem' }}>{type}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Capacity (kg)"
                name="capacityKg"
                type="number"
                value={formData.capacityKg}
                onChange={handleChange}
                size="small"
                error={!!formErrors.capacityKg}
                helperText={formErrors.capacityKg || 'Maximum load capacity in kilograms'}
                sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><Scale sx={{ fontSize: '0.9rem' }} /></InputAdornment>,
                  endAdornment: <InputAdornment position="end" sx={{ fontSize: '0.7rem' }}>kg</InputAdornment>,
                }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Current Mileage"
                name="currentMileage"
                type="number"
                value={formData.currentMileage}
                onChange={handleChange}
                size="small"
                error={!!formErrors.currentMileage}
                helperText={formErrors.currentMileage}
                sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><Speed sx={{ fontSize: '0.9rem' }} /></InputAdornment>,
                  endAdornment: <InputAdornment position="end" sx={{ fontSize: '0.7rem' }}>km</InputAdornment>,
                }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Engine Size"
                name="engineSize"
                value={formData.engineSize}
                onChange={handleChange}
                size="small"
                placeholder="e.g., 12.8L, 16L"
                sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Fuel Consumption (L/100km)"
                name="fuelConsumption"
                type="number"
                value={formData.fuelConsumption}
                onChange={handleChange}
                size="small"
                error={!!formErrors.fuelConsumption}
                helperText={formErrors.fuelConsumption || 'Average fuel consumption'}
                sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><LocalGasStation sx={{ fontSize: '0.9rem' }} /></InputAdornment>,
                  endAdornment: <InputAdornment position="end" sx={{ fontSize: '0.7rem' }}>L/100km</InputAdornment>,
                }}
              />
            </Grid>

            {/* Service Information Section */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ fontSize: '0.8rem', fontWeight: 600, mb: 1.5, mt: 1 }}>
                <Build sx={{ mr: 0.5, fontSize: '1rem', verticalAlign: 'middle' }} />
                Service Information
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Last Service Date"
                name="lastServiceDate"
                type="date"
                value={formData.lastServiceDate}
                onChange={handleChange}
                size="small"
                InputLabelProps={{ shrink: true }}
                sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><CalendarToday sx={{ fontSize: '0.9rem' }} /></InputAdornment>,
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Next Service Date"
                name="nextServiceDate"
                type="date"
                value={formData.nextServiceDate}
                onChange={handleChange}
                size="small"
                InputLabelProps={{ shrink: true }}
                sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><CalendarToday sx={{ fontSize: '0.9rem' }} /></InputAdornment>,
                }}
              />
            </Grid>

            {/* Notes Section */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ fontSize: '0.8rem', fontWeight: 600, mb: 1.5, mt: 1 }}>
                <Description sx={{ mr: 0.5, fontSize: '1rem', verticalAlign: 'middle' }} />
                Additional Information
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                name="notes"
                multiline
                rows={3}
                value={formData.notes}
                onChange={handleChange}
                size="small"
                placeholder="Any additional information about the vehicle..."
                sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
              />
            </Grid>

            {/* Form Actions */}
            <Grid item xs={12}>
              <Divider sx={{ my: 1.5 }} />
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <Button
                  type="submit"
                  variant="contained"
                  size="medium"
                  startIcon={submitting ? <CircularProgress size={18} /> : <Save sx={{ fontSize: '0.9rem' }} />}
                  disabled={submitting}
                  sx={{ 
                    minWidth: { xs: '100%', sm: 180 },
                    fontSize: '0.8rem',
                    py: 0.75
                  }}
                >
                  {submitting ? 'Saving...' : (isEditMode ? 'Update Vehicle' : 'Create Vehicle')}
                </Button>
                <Button
                  variant="outlined"
                  size="medium"
                  onClick={() => navigate('/vehicles')}
                  disabled={submitting}
                  sx={{ fontSize: '0.8rem', py: 0.75 }}
                >
                  Cancel
                </Button>
                {isEditMode && (
                  <Button
                    variant="text"
                    color="error"
                    size="medium"
                    onClick={handleDelete}
                    disabled={submitting}
                    sx={{ 
                      ml: { xs: 0, sm: 'auto' },
                      fontSize: '0.8rem',
                      py: 0.75
                    }}
                  >
                    Delete Vehicle
                  </Button>
                )}
              </Stack>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
};

export default VehicleForm;
