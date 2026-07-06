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
  Receipt,
  Event,
  Numbers,
  AttachMoney,
} from '@mui/icons-material';
import { vehicleService } from '../services/vehicleService';

// Constants - must match database values
const VEHICLE_TYPES = ['TRUCK', 'TRAILER', 'VAN', 'CAR'];

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
  { value: 'AVAILABLE', label: 'Available', color: 'success' },
  { value: 'ASSIGNED', label: 'Assigned', color: 'info' },
  { value: 'IN_USE', label: 'In Use', color: 'primary' },
  { value: 'ACTIVE', label: 'Active', color: 'success' },
  { value: 'INACTIVE', label: 'Inactive', color: 'default' },
  { value: 'MAINTENANCE', label: 'Maintenance', color: 'warning' },
  { value: 'REPAIR', label: 'Repair', color: 'warning' },
  { value: 'OUT_OF_SERVICE', label: 'Out of Service', color: 'error' },
  { value: 'SOLD', label: 'Sold', color: 'default' },
  { value: 'DECOMMISSIONED', label: 'Decommissioned', color: 'default' },
  { value: 'RETIRED', label: 'Retired', color: 'default' },
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
  // Basic fields
  registrationNumber: '',
  vin: '',
  make: '',
  model: '',
  year: new Date().getFullYear(),
  vehicleType: 'TRUCK',
  fuelType: 'Diesel',
  currentMileage: 0,
  status: 'AVAILABLE',
  
  // Service fields
  avgConsumption: 0,
  currentOdometer: 0,
  lastServiceDate: null,
  lastServiceOdometer: null,
  serviceIntervalDays: null,
  serviceIntervalKm: null,
  nextServiceDue: null,
  nextServiceOdometer: null,
  maintenanceStatus: '',
  
  // Insurance fields
  insurancePolicyNumber: '',
  insuranceExpiry: null,
  roadworthyExpiry: null,
  insuranceProvider: '',
  insuranceExpiryDate: null,
  
  // Financial fields
  purchaseDate: null,
  purchasePrice: null,
  currentValue: null,
  maintenanceCost: null,
  
  // Other fields
  fleetNumber: '',
  gpsTrackerId: null,
  incidentsLogged: 0,
  notes: '',
  category: '',
  isActive: true,
  version: 0,
  lastMaintenanceDate: null,
  nextMaintenanceDue: null,
  fuelEfficiency: null,
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
        vin: vehicle.vin || '',
        make: vehicle.make || '',
        model: vehicle.model || '',
        year: vehicle.year || new Date().getFullYear(),
        vehicleType: vehicle.vehicleType || 'TRUCK',
        fuelType: vehicle.fuelType || 'Diesel',
        currentMileage: vehicle.currentMileage || 0,
        avgConsumption: vehicle.avgConsumption || 0,
        currentOdometer: vehicle.currentOdometer || 0,
        lastServiceDate: vehicle.lastServiceDate || null,
        lastServiceOdometer: vehicle.lastServiceOdometer || null,
        serviceIntervalDays: vehicle.serviceIntervalDays || null,
        serviceIntervalKm: vehicle.serviceIntervalKm || null,
        status: vehicle.status || 'AVAILABLE',
        insurancePolicyNumber: vehicle.insurancePolicyNumber || '',
        insuranceExpiry: vehicle.insuranceExpiry || null,
        roadworthyExpiry: vehicle.roadworthyExpiry || null,
        fleetNumber: vehicle.fleetNumber || '',
        notes: vehicle.notes || '',
        category: vehicle.category || '',
        purchaseDate: vehicle.purchaseDate || null,
        purchasePrice: vehicle.purchasePrice || null,
        currentValue: vehicle.currentValue || null,
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

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value || null }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.registrationNumber?.trim()) {
      errors.registrationNumber = 'Registration Number is required';
    }
    if (!formData.make?.trim()) {
      errors.make = 'Make is required';
    }
    if (!formData.model?.trim()) {
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
    // ✅ ALWAYS include all fields with defaults
    const vehicleData = {
      registrationNumber: formData.registrationNumber?.trim() || '',
      make: formData.make?.trim() || '',
      model: formData.model?.trim() || '',
      vehicleType: formData.vehicleType || 'TRUCK',  // ✅ Always send
      status: formData.status || 'ACTIVE',            // ✅ Always send
    };

    // Add optional fields if they have values (including 0)
    if (formData.vin?.trim()) vehicleData.vin = formData.vin.trim();
    if (formData.year) vehicleData.year = parseInt(formData.year, 10);
    if (formData.fuelType) vehicleData.fuelType = formData.fuelType;  // ✅ Always send if present
    if (formData.currentMileage !== undefined && formData.currentMileage !== '') {
      vehicleData.currentMileage = parseFloat(formData.currentMileage) || 0;
    }
    if (formData.avgConsumption !== undefined && formData.avgConsumption !== '') {
      vehicleData.avgConsumption = parseFloat(formData.avgConsumption) || 0;
    }
    if (formData.currentOdometer !== undefined && formData.currentOdometer !== '') {
      vehicleData.currentOdometer = parseFloat(formData.currentOdometer) || 0;
    }
    if (formData.lastServiceDate) vehicleData.lastServiceDate = formData.lastServiceDate;
    if (formData.lastServiceOdometer !== undefined && formData.lastServiceOdometer !== '') {
      vehicleData.lastServiceOdometer = parseFloat(formData.lastServiceOdometer) || null;
    }
    if (formData.serviceIntervalDays !== undefined && formData.serviceIntervalDays !== '') {
      vehicleData.serviceIntervalDays = parseInt(formData.serviceIntervalDays, 10) || null;
    }
    if (formData.serviceIntervalKm !== undefined && formData.serviceIntervalKm !== '') {
      vehicleData.serviceIntervalKm = parseFloat(formData.serviceIntervalKm) || null;
    }
    if (formData.insurancePolicyNumber?.trim()) vehicleData.insurancePolicyNumber = formData.insurancePolicyNumber.trim();
    if (formData.insuranceExpiry) vehicleData.insuranceExpiry = formData.insuranceExpiry;
    if (formData.roadworthyExpiry) vehicleData.roadworthyExpiry = formData.roadworthyExpiry;
    if (formData.fleetNumber?.trim()) vehicleData.fleetNumber = formData.fleetNumber.trim();
    if (formData.notes?.trim()) vehicleData.notes = formData.notes.trim();
    if (formData.category?.trim()) vehicleData.category = formData.category.trim();
    if (formData.purchaseDate) vehicleData.purchaseDate = formData.purchaseDate;
    if (formData.purchasePrice !== undefined && formData.purchasePrice !== '') {
      vehicleData.purchasePrice = parseFloat(formData.purchasePrice) || null;
    }
    if (formData.currentValue !== undefined && formData.currentValue !== '') {
      vehicleData.currentValue = parseFloat(formData.currentValue) || null;
    }

    console.log('📤 Sending vehicle data:', vehicleData);

    let result;
    if (isEditMode) {
      result = await vehicleService.updateVehicle(id, vehicleData);
      setSuccess('Vehicle updated successfully!');
    } else {
      result = await vehicleService.createVehicle(vehicleData);
      setSuccess('Vehicle created successfully!');
    }

    console.log('✅ Vehicle saved:', result);

    setTimeout(() => {
      navigate('/vehicles');
    }, 1500);
  } catch (err) {
    console.error('❌ Error saving vehicle:', err);
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
                label="VIN Number"
                name="vin"
                value={formData.vin}
                onChange={handleChange}
                size="small"
                placeholder="Vehicle Identification Number"
                sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Fleet Number"
                name="fleetNumber"
                value={formData.fleetNumber}
                onChange={handleChange}
                size="small"
                placeholder="e.g., F-001"
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
                  {FUEL_TYPES.map(type => (
                    <MenuItem key={type} value={type} sx={{ fontSize: '0.8rem' }}>{type}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

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
                label="Current Odometer (km)"
                name="currentOdometer"
                type="number"
                value={formData.currentOdometer}
                onChange={handleChange}
                size="small"
                placeholder="Current odometer reading"
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
                label="Current Mileage (km)"
                name="currentMileage"
                type="number"
                value={formData.currentMileage}
                onChange={handleChange}
                size="small"
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
                label="Avg Fuel Consumption (L/100km)"
                name="avgConsumption"
                type="number"
                value={formData.avgConsumption}
                onChange={handleChange}
                size="small"
                sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><LocalGasStation sx={{ fontSize: '0.9rem' }} /></InputAdornment>,
                  endAdornment: <InputAdornment position="end" sx={{ fontSize: '0.7rem' }}>L/100km</InputAdornment>,
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ fontSize: '0.8rem', fontWeight: 600, mb: 1.5, mt: 1 }}>
                <Build sx={{ mr: 0.5, fontSize: '1rem', verticalAlign: 'middle' }} />
                Service Information
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Last Service Date"
                name="lastServiceDate"
                type="date"
                value={formData.lastServiceDate || ''}
                onChange={handleDateChange}
                size="small"
                InputLabelProps={{ shrink: true }}
                sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><CalendarToday sx={{ fontSize: '0.9rem' }} /></InputAdornment>,
                }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Last Service Odometer"
                name="lastServiceOdometer"
                type="number"
                value={formData.lastServiceOdometer || ''}
                onChange={handleChange}
                size="small"
                placeholder="Odometer at last service"
                sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><Numbers sx={{ fontSize: '0.9rem' }} /></InputAdornment>,
                  endAdornment: <InputAdornment position="end" sx={{ fontSize: '0.7rem' }}>km</InputAdornment>,
                }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                size="small"
                placeholder="e.g., Heavy, Medium, Light"
                sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ fontSize: '0.8rem', fontWeight: 600, mb: 1.5, mt: 1 }}>
                <AttachMoney sx={{ mr: 0.5, fontSize: '1rem', verticalAlign: 'middle' }} />
                Financial Information
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Purchase Date"
                name="purchaseDate"
                type="date"
                value={formData.purchaseDate || ''}
                onChange={handleDateChange}
                size="small"
                InputLabelProps={{ shrink: true }}
                sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><Event sx={{ fontSize: '0.9rem' }} /></InputAdornment>,
                }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Purchase Price (ZAR)"
                name="purchasePrice"
                type="number"
                value={formData.purchasePrice || ''}
                onChange={handleChange}
                size="small"
                sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><AttachMoney sx={{ fontSize: '0.9rem' }} /></InputAdornment>,
                }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Current Value (ZAR)"
                name="currentValue"
                type="number"
                value={formData.currentValue || ''}
                onChange={handleChange}
                size="small"
                sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><AttachMoney sx={{ fontSize: '0.9rem' }} /></InputAdornment>,
                }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Insurance Policy Number"
                name="insurancePolicyNumber"
                value={formData.insurancePolicyNumber}
                onChange={handleChange}
                size="small"
                placeholder="Policy number"
                sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Insurance Expiry"
                name="insuranceExpiry"
                type="date"
                value={formData.insuranceExpiry || ''}
                onChange={handleDateChange}
                size="small"
                InputLabelProps={{ shrink: true }}
                sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Roadworthy Expiry"
                name="roadworthyExpiry"
                type="date"
                value={formData.roadworthyExpiry || ''}
                onChange={handleDateChange}
                size="small"
                InputLabelProps={{ shrink: true }}
                sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
              />
            </Grid>

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
