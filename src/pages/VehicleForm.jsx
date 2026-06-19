// src/pages/VehicleForm.jsx
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
  Card,
  CardContent,
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
  Numbers,
  Scale,
  Warehouse,
  Settings,
} from '@mui/icons-material';
import { vehicleService } from '../services/vehicleService';
import Breadcrumbs from '../components/Layout/Breadcrumbs';

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
      // Scroll to first error
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

  const getStatusColor = (status) => {
    const statusMap = {
      ACTIVE: 'success',
      AVAILABLE: 'info',
      IN_MAINTENANCE: 'warning',
      OUT_OF_SERVICE: 'error',
      INACTIVE: 'default',
    };
    return statusMap[status] || 'default';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading vehicle data...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Breadcrumbs />
      
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold">
            {isEditMode ? 'Edit Vehicle' : 'Create New Vehicle'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {isEditMode ? 'Update vehicle information' : 'Add a new vehicle to the fleet'}
          </Typography>
        </Box>
        <Button 
          startIcon={<ArrowBack />} 
          onClick={() => navigate('/vehicles')}
          sx={{ 
            '&:hover': {
              backgroundColor: 'action.hover',
            }
          }}
        >
          Back to Vehicles
        </Button>
      </Box>

      {/* Form */}
      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          {/* Alerts */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
              {success}
            </Alert>
          )}

          <Grid container spacing={3}>
            {/* Basic Information Section */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                <DirectionsCar sx={{ mr: 1, verticalAlign: 'middle' }} />
                Basic Information
              </Typography>
              <Divider sx={{ mb: 3 }} />
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
                InputProps={{ inputProps: { min: 1900, max: new Date().getFullYear() + 1 } }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small" error={!!formErrors.vehicleType}>
                <InputLabel>Vehicle Type *</InputLabel>
                <Select
                  name="vehicleType"
                  value={formData.vehicleType}
                  label="Vehicle Type *"
                  onChange={handleChange}
                  required
                >
                  <MenuItem value="">Select Type</MenuItem>
                  {VEHICLE_TYPES.map(type => (
                    <MenuItem key={type} value={type}>{type}</MenuItem>
                  ))}
                </Select>
                {formErrors.vehicleType && (
                  <FormHelperText error>{formErrors.vehicleType}</FormHelperText>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small" error={!!formErrors.status}>
                <InputLabel>Status *</InputLabel>
                <Select
                  name="status"
                  value={formData.status}
                  label="Status *"
                  onChange={handleChange}
                  required
                >
                  {STATUS_OPTIONS.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      <Chip 
                        label={option.label} 
                        size="small" 
                        color={option.color} 
                        sx={{ fontWeight: 500 }}
                      />
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.status && (
                  <FormHelperText error>{formErrors.status}</FormHelperText>
                )}
              </FormControl>
            </Grid>

            {/* Specifications Section */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, mt: 2 }}>
                <Settings sx={{ mr: 1, verticalAlign: 'middle' }} />
                Specifications
              </Typography>
              <Divider sx={{ mb: 3 }} />
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
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Fuel Type</InputLabel>
                <Select
                  name="fuelType"
                  value={formData.fuelType}
                  label="Fuel Type"
                  onChange={handleChange}
                >
                  <MenuItem value="">Select Fuel Type</MenuItem>
                  {FUEL_TYPES.map(type => (
                    <MenuItem key={type} value={type}>{type}</MenuItem>
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
                InputProps={{
                  startAdornment: <InputAdornment position="start"><Scale /></InputAdornment>,
                  endAdornment: <InputAdornment position="end">kg</InputAdornment>,
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
                InputProps={{
                  startAdornment: <InputAdornment position="start"><Speed /></InputAdornment>,
                  endAdornment: <InputAdornment position="end">km</InputAdornment>,
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
                InputProps={{
                  startAdornment: <InputAdornment position="start"><LocalGasStation /></InputAdornment>,
                  endAdornment: <InputAdornment position="end">L/100km</InputAdornment>,
                }}
              />
            </Grid>

            {/* Service Information Section */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, mt: 2 }}>
                <Build sx={{ mr: 1, verticalAlign: 'middle' }} />
                Service Information
              </Typography>
              <Divider sx={{ mb: 3 }} />
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
                InputProps={{
                  startAdornment: <InputAdornment position="start"><CalendarToday /></InputAdornment>,
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
                InputProps={{
                  startAdornment: <InputAdornment position="start"><CalendarToday /></InputAdornment>,
                }}
              />
            </Grid>

            {/* Notes Section */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, mt: 2 }}>
                <Description sx={{ mr: 1, verticalAlign: 'middle' }} />
                Additional Information
              </Typography>
              <Divider sx={{ mb: 3 }} />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                name="notes"
                multiline
                rows={4}
                value={formData.notes}
                onChange={handleChange}
                size="small"
                placeholder="Any additional information about the vehicle..."
              />
            </Grid>

            {/* Form Actions */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  startIcon={submitting ? <CircularProgress size={20} /> : <Save />}
                  disabled={submitting}
                  sx={{
                    minWidth: 200,
                    '&:hover': {
                      boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                    }
                  }}
                >
                  {submitting ? 'Saving...' : (isEditMode ? 'Update Vehicle' : 'Create Vehicle')}
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => navigate('/vehicles')}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                {isEditMode && (
                  <Button
                    variant="text"
                    color="error"
                    size="large"
                    onClick={() => {
                      if (window.confirm('Are you sure you want to delete this vehicle?')) {
                        vehicleService.deleteVehicle(id).then(() => {
                          navigate('/vehicles');
                        }).catch(err => {
                          setError('Failed to delete vehicle');
                        });
                      }
                    }}
                    disabled={submitting}
                    sx={{ ml: 'auto' }}
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
