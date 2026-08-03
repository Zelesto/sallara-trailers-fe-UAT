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
  Card,
  CardContent,
  IconButton,
  Tooltip,
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
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  PersonAdd as PersonAddIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { vehicleService } from '../services/vehicleService';

// Form Section Header Component
const FormSectionHeader = ({ icon, title, subtitle }) => (
  <Box sx={{ mb: 2 }}>
    <Stack direction="row" spacing={1} alignItems="center">
      <Box
        sx={{
          bgcolor: 'primary.light',
          borderRadius: '8px',
          p: 0.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'primary.main',
        }}
      >
        {icon}
      </Box>
      <Typography variant="subtitle1" sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
        {title}
      </Typography>
    </Stack>
    {subtitle && (
      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', ml: 4.5 }}>
        {subtitle}
      </Typography>
    )}
    <Divider sx={{ mt: 1.5 }} />
  </Box>
);

// Status Chip Component
const VehicleStatusChip = ({ status }) => {
  const statusMap = {
    AVAILABLE: { color: 'success', label: 'Available', icon: <CheckCircleIcon /> },
    ASSIGNED: { color: 'info', label: 'Assigned', icon: <InfoIcon /> },
    IN_USE: { color: 'primary', label: 'In Use', icon: <DirectionsCar /> },
    ACTIVE: { color: 'success', label: 'Active', icon: <CheckCircleIcon /> },
    INACTIVE: { color: 'default', label: 'Inactive', icon: <CloseIcon /> },
    MAINTENANCE: { color: 'warning', label: 'Maintenance', icon: <BuildIcon /> },
    REPAIR: { color: 'warning', label: 'Repair', icon: <BuildIcon /> },
    OUT_OF_SERVICE: { color: 'error', label: 'Out of Service', icon: <CloseIcon /> },
    SOLD: { color: 'default', label: 'Sold', icon: <AttachMoney /> },
    DECOMMISSIONED: { color: 'default', label: 'Decommissioned', icon: <CloseIcon /> },
    RETIRED: { color: 'default', label: 'Retired', icon: <CloseIcon /> },
  };
  const info = statusMap[status] || { color: 'default', label: status || 'Unknown', icon: null };
  return (
    <Chip
      label={info.label}
      color={info.color}
      size="small"
      icon={info.icon}
      sx={{
        fontWeight: 600,
        fontSize: '0.7rem',
        height: 24,
        '& .MuiChip-label': { px: 1 },
        '& .MuiChip-icon': { fontSize: '0.8rem' },
      }}
    />
  );
};

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
    registrationNumber: '',
    vin: '',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    vehicleType: 'TRUCK',
    fuelType: 'Diesel',
    currentMileage: 0,
    status: 'ACTIVE',
    avgConsumption: 0,
    currentOdometer: 0,
    lastServiceDate: null,
    lastServiceOdometer: null,
    serviceIntervalDays: null,
    serviceIntervalKm: null,
    nextServiceDue: null,
    nextServiceOdometer: null,
    maintenanceStatus: '',
    insurancePolicyNumber: '',
    insuranceExpiry: null,
    roadworthyExpiry: null,
    insuranceProvider: '',
    insuranceExpiryDate: null,
    purchaseDate: null,
    purchasePrice: null,
    currentValue: null,
    maintenanceCost: null,
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
    // Fuel tank fields
    fuelCapacity: 400,
    currentFuelLevel: 320,
    virtualConsumption: 11.8,
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
        status: vehicle.status || 'ACTIVE',
        insurancePolicyNumber: vehicle.insurancePolicyNumber || '',
        insuranceExpiry: vehicle.insuranceExpiry || null,
        roadworthyExpiry: vehicle.roadworthyExpiry || null,
        fleetNumber: vehicle.fleetNumber || '',
        notes: vehicle.notes || '',
        category: vehicle.category || '',
        purchaseDate: vehicle.purchaseDate || null,
        purchasePrice: vehicle.purchasePrice || null,
        currentValue: vehicle.currentValue || null,
        maintenanceCost: vehicle.maintenanceCost || null,
        lastMaintenanceDate: vehicle.lastMaintenanceDate || null,
        nextMaintenanceDue: vehicle.nextMaintenanceDue || null,
        fuelEfficiency: vehicle.fuelEfficiency || null,
        insuranceProvider: vehicle.insuranceProvider || '',
        insuranceExpiryDate: vehicle.insuranceExpiryDate || null,
        isActive: vehicle.isActive !== undefined ? vehicle.isActive : true,
        version: vehicle.version || 0,
        fuelCapacity: vehicle.fuelCapacity || 400,
        currentFuelLevel: vehicle.currentFuelLevel || 320,
        virtualConsumption: vehicle.virtualConsumption || 11.8,
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
      const vehicleData = {
        registrationNumber: formData.registrationNumber?.trim() || '',
        make: formData.make?.trim() || '',
        model: formData.model?.trim() || '',
        vehicleType: formData.vehicleType || 'TRUCK',
        status: formData.status || 'ACTIVE',
        vin: formData.vin?.trim() || null,
        fuelType: formData.fuelType || 'DIESEL',
        year: formData.year ? parseInt(formData.year, 10) : null,
        currentMileage: formData.currentMileage !== undefined && formData.currentMileage !== '' 
          ? parseFloat(formData.currentMileage) 
          : null,
        avgConsumption: formData.avgConsumption !== undefined && formData.avgConsumption !== '' 
          ? parseFloat(formData.avgConsumption) 
          : null,
        currentOdometer: formData.currentOdometer !== undefined && formData.currentOdometer !== '' 
          ? parseFloat(formData.currentOdometer) 
          : null,
        lastServiceDate: formData.lastServiceDate || null,
        lastServiceOdometer: formData.lastServiceOdometer !== undefined && formData.lastServiceOdometer !== '' 
          ? parseFloat(formData.lastServiceOdometer) 
          : null,
        serviceIntervalDays: formData.serviceIntervalDays !== undefined && formData.serviceIntervalDays !== '' 
          ? parseInt(formData.serviceIntervalDays, 10) 
          : null,
        serviceIntervalKm: formData.serviceIntervalKm !== undefined && formData.serviceIntervalKm !== '' 
          ? parseFloat(formData.serviceIntervalKm) 
          : null,
        insurancePolicyNumber: formData.insurancePolicyNumber?.trim() || null,
        insuranceExpiry: formData.insuranceExpiry || null,
        roadworthyExpiry: formData.roadworthyExpiry || null,
        fleetNumber: formData.fleetNumber?.trim() || null,
        notes: formData.notes?.trim() || null,
        category: formData.category?.trim() || null,
        purchaseDate: formData.purchaseDate || null,
        purchasePrice: formData.purchasePrice !== undefined && formData.purchasePrice !== '' 
          ? parseFloat(formData.purchasePrice) 
          : null,
        currentValue: formData.currentValue !== undefined && formData.currentValue !== '' 
          ? parseFloat(formData.currentValue) 
          : null,
        maintenanceCost: formData.maintenanceCost !== undefined && formData.maintenanceCost !== '' 
          ? parseFloat(formData.maintenanceCost) 
          : null,
        lastMaintenanceDate: formData.lastMaintenanceDate || null,
        nextMaintenanceDue: formData.nextMaintenanceDue || null,
        fuelEfficiency: formData.fuelEfficiency !== undefined && formData.fuelEfficiency !== '' 
          ? parseFloat(formData.fuelEfficiency) 
          : null,
        insuranceProvider: formData.insuranceProvider?.trim() || null,
        insuranceExpiryDate: formData.insuranceExpiryDate || null,
        isActive: formData.isActive !== undefined ? formData.isActive : true,
        version: formData.version !== undefined ? formData.version : 0,
        fuelCapacity: formData.fuelCapacity !== undefined && formData.fuelCapacity !== '' 
          ? parseFloat(formData.fuelCapacity) 
          : null,
        currentFuelLevel: formData.currentFuelLevel !== undefined && formData.currentFuelLevel !== '' 
          ? parseFloat(formData.currentFuelLevel) 
          : null,
        virtualConsumption: formData.virtualConsumption !== undefined && formData.virtualConsumption !== '' 
          ? parseFloat(formData.virtualConsumption) 
          : null,
      };

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

  const fuelPercentage = formData.fuelCapacity > 0 
    ? (formData.currentFuelLevel / formData.fuelCapacity) * 100 
    : 0;

  return (
    <Box sx={{ bgcolor: '#F7F7FC', minHeight: '100vh', p: { xs: 2, md: 3 } }}>
      <Box sx={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
          <Box>
            <Typography variant="h5" fontWeight="700" sx={{ fontSize: '1.25rem' }}>
              {isEditMode ? 'Edit Vehicle' : 'Create New Vehicle'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
              {isEditMode ? 'Update vehicle information and specifications' : 'Add a new vehicle to the fleet'}
            </Typography>
          </Box>
          <Button
            startIcon={<ArrowBack sx={{ fontSize: '0.9rem' }} />}
            onClick={() => navigate('/vehicles')}
            size="small"
            sx={{
              fontSize: '0.8rem',
              color: '#6B7280',
              '&:hover': { bgcolor: 'transparent' },
            }}
          >
            Back to Vehicles
          </Button>
        </Box>

        {/* Status Indicator for Edit Mode */}
        {isEditMode && (
          <Paper
            elevation={0}
            sx={{
              p: 2,
              mb: 3,
              borderRadius: '12px',
              border: '1px solid #ECECEC',
              bgcolor: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 1,
            }}
          >
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                Vehicle Status:
              </Typography>
              <VehicleStatusChip status={formData.status} />
            </Stack>
            <Stack direction="row" spacing={1}>
              <Chip
                label={`Reg: ${formData.registrationNumber}`}
                size="small"
                variant="outlined"
                sx={{ fontSize: '0.7rem' }}
              />
              {formData.fleetNumber && (
                <Chip
                  label={`Fleet: ${formData.fleetNumber}`}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: '0.7rem' }}
                />
              )}
              <Chip
                label={`${formData.vehicleType}`}
                size="small"
                variant="outlined"
                sx={{ fontSize: '0.7rem' }}
              />
            </Stack>
          </Paper>
        )}

        {/* Main Form */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, sm: 3, md: 4 },
            borderRadius: '16px',
            border: '1px solid #ECECEC',
            bgcolor: '#FFFFFF',
          }}
        >
          <form onSubmit={handleSubmit}>
            {error && (
              <Alert
                severity="error"
                sx={{ mb: 3, borderRadius: '8px', fontSize: '0.8rem' }}
                onClose={() => setError('')}
                icon={<WarningIcon />}
              >
                {error}
              </Alert>
            )}
            {success && (
              <Alert
                severity="success"
                sx={{ mb: 3, borderRadius: '8px', fontSize: '0.8rem' }}
                onClose={() => setSuccess('')}
                icon={<CheckCircleIcon />}
              >
                {success}
              </Alert>
            )}

            <Grid container spacing={3}>
              {/* Basic Information Section */}
              <Grid item xs={12}>
                <FormSectionHeader
                  icon={<DirectionsCar sx={{ fontSize: '1.1rem' }} />}
                  title="Basic Information"
                  subtitle="Vehicle registration and identification details"
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Registration Number *"
                  name="registrationNumber"
                  value={formData.registrationNumber}
                  onChange={handleChange}
                  required
                  size="medium"
                  error={!!formErrors.registrationNumber}
                  helperText={formErrors.registrationNumber}
                  placeholder="e.g., ABC123GP"
                  sx={{
                    '& .MuiInputLabel-root': { fontSize: '0.8rem' },
                    '& .MuiInputBase-root': { fontSize: '0.85rem' },
                  }}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="VIN Number"
                  name="vin"
                  value={formData.vin}
                  onChange={handleChange}
                  size="medium"
                  placeholder="Vehicle Identification Number"
                  sx={{
                    '& .MuiInputLabel-root': { fontSize: '0.8rem' },
                    '& .MuiInputBase-root': { fontSize: '0.85rem' },
                  }}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Fleet Number"
                  name="fleetNumber"
                  value={formData.fleetNumber}
                  onChange={handleChange}
                  size="medium"
                  placeholder="e.g., F-001"
                  sx={{
                    '& .MuiInputLabel-root': { fontSize: '0.8rem' },
                    '& .MuiInputBase-root': { fontSize: '0.85rem' },
                  }}
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
                  size="medium"
                  error={!!formErrors.make}
                  helperText={formErrors.make}
                  placeholder="e.g., SCANIA, MERCEDES, VOLVO"
                  sx={{
                    '& .MuiInputLabel-root': { fontSize: '0.8rem' },
                    '& .MuiInputBase-root': { fontSize: '0.85rem' },
                  }}
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
                  size="medium"
                  error={!!formErrors.model}
                  helperText={formErrors.model}
                  placeholder="e.g., R500, ACTROS, FH16"
                  sx={{
                    '& .MuiInputLabel-root': { fontSize: '0.8rem' },
                    '& .MuiInputBase-root': { fontSize: '0.85rem' },
                  }}
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
                  size="medium"
                  error={!!formErrors.year}
                  helperText={formErrors.year || 'e.g., 2023'}
                  sx={{
                    '& .MuiInputLabel-root': { fontSize: '0.8rem' },
                    '& .MuiInputBase-root': { fontSize: '0.85rem' },
                  }}
                  InputProps={{ inputProps: { min: 1900, max: new Date().getFullYear() + 1 } }}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <FormControl fullWidth size="medium" error={!!formErrors.vehicleType}>
                  <InputLabel sx={{ fontSize: '0.8rem' }}>Vehicle Type *</InputLabel>
                  <Select
                    name="vehicleType"
                    value={formData.vehicleType}
                    label="Vehicle Type *"
                    onChange={handleChange}
                    required
                    sx={{ fontSize: '0.85rem' }}
                  >
                    {VEHICLE_TYPES.map(type => (
                      <MenuItem key={type} value={type} sx={{ fontSize: '0.85rem' }}>{type}</MenuItem>
                    ))}
                  </Select>
                  {formErrors.vehicleType && (
                    <FormHelperText sx={{ fontSize: '0.65rem' }}>{formErrors.vehicleType}</FormHelperText>
                  )}
                </FormControl>
              </Grid>

              <Grid item xs={12} md={4}>
                <FormControl fullWidth size="medium" error={!!formErrors.status}>
                  <InputLabel sx={{ fontSize: '0.8rem' }}>Status *</InputLabel>
                  <Select
                    name="status"
                    value={formData.status}
                    label="Status *"
                    onChange={handleChange}
                    required
                    sx={{ fontSize: '0.85rem' }}
                  >
                    {STATUS_OPTIONS.map(option => (
                      <MenuItem key={option.value} value={option.value} sx={{ fontSize: '0.85rem' }}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Chip 
                            label={option.label} 
                            size="small" 
                            color={option.color} 
                            sx={{ height: 18, fontSize: '0.55rem' }}
                          />
                        </Stack>
                      </MenuItem>
                    ))}
                  </Select>
                  {formErrors.status && (
                    <FormHelperText sx={{ fontSize: '0.65rem' }}>{formErrors.status}</FormHelperText>
                  )}
                </FormControl>
              </Grid>

              <Grid item xs={12} md={4}>
                <FormControl fullWidth size="medium">
                  <InputLabel sx={{ fontSize: '0.8rem' }}>Fuel Type</InputLabel>
                  <Select
                    name="fuelType"
                    value={formData.fuelType}
                    label="Fuel Type"
                    onChange={handleChange}
                    sx={{ fontSize: '0.85rem' }}
                  >
                    {FUEL_TYPES.map(type => (
                      <MenuItem key={type} value={type} sx={{ fontSize: '0.85rem' }}>{type}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Specifications Section */}
              <Grid item xs={12}>
                <FormSectionHeader
                  icon={<Settings sx={{ fontSize: '1.1rem' }} />}
                  title="Specifications"
                  subtitle="Vehicle performance and fuel consumption details"
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Current Odometer (km)"
                  name="currentOdometer"
                  type="number"
                  value={formData.currentOdometer}
                  onChange={handleChange}
                  size="medium"
                  placeholder="Current odometer reading"
                  sx={{
                    '& .MuiInputLabel-root': { fontSize: '0.8rem' },
                    '& .MuiInputBase-root': { fontSize: '0.85rem' },
                  }}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><Speed sx={{ fontSize: '1rem', color: '#6B7280' }} /></InputAdornment>,
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
                  size="medium"
                  sx={{
                    '& .MuiInputLabel-root': { fontSize: '0.8rem' },
                    '& .MuiInputBase-root': { fontSize: '0.85rem' },
                  }}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><Speed sx={{ fontSize: '1rem', color: '#6B7280' }} /></InputAdornment>,
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
                  size="medium"
                  sx={{
                    '& .MuiInputLabel-root': { fontSize: '0.8rem' },
                    '& .MuiInputBase-root': { fontSize: '0.85rem' },
                  }}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><LocalGasStation sx={{ fontSize: '1rem', color: '#6B7280' }} /></InputAdornment>,
                    endAdornment: <InputAdornment position="end" sx={{ fontSize: '0.7rem' }}>L/100km</InputAdornment>,
                  }}
                />
              </Grid>

              {/* Fuel Tank Information */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ fontSize: '0.8rem', fontWeight: 600, mb: 1.5, mt: 1 }}>
                  <LocalGasStation sx={{ mr: 0.5, fontSize: '1rem', verticalAlign: 'middle' }} />
                  Fuel Tank Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Fuel Tank Capacity (L)"
                  name="fuelCapacity"
                  type="number"
                  value={formData.fuelCapacity}
                  onChange={handleChange}
                  size="medium"
                  sx={{
                    '& .MuiInputLabel-root': { fontSize: '0.8rem' },
                    '& .MuiInputBase-root': { fontSize: '0.85rem' },
                  }}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><LocalGasStation sx={{ fontSize: '1rem', color: '#6B7280' }} /></InputAdornment>,
                    endAdornment: <InputAdornment position="end" sx={{ fontSize: '0.7rem' }}>L</InputAdornment>,
                  }}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Current Fuel Level (L)"
                  name="currentFuelLevel"
                  type="number"
                  value={formData.currentFuelLevel}
                  onChange={handleChange}
                  size="medium"
                  sx={{
                    '& .MuiInputLabel-root': { fontSize: '0.8rem' },
                    '& .MuiInputBase-root': { fontSize: '0.85rem' },
                  }}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><LocalGasStation sx={{ fontSize: '1rem', color: '#6B7280' }} /></InputAdornment>,
                    endAdornment: <InputAdornment position="end" sx={{ fontSize: '0.7rem' }}>L</InputAdornment>,
                  }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, fontSize: '0.65rem' }}>
                  Current fuel level: {fuelPercentage.toFixed(0)}% of capacity
                </Typography>
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Virtual Consumption (L/100km)"
                  name="virtualConsumption"
                  type="number"
                  value={formData.virtualConsumption}
                  onChange={handleChange}
                  size="medium"
                  helperText="Based on refills and month-end confirmations"
                  sx={{
                    '& .MuiInputLabel-root': { fontSize: '0.8rem' },
                    '& .MuiInputBase-root': { fontSize: '0.85rem' },
                  }}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><TrendingUpIcon sx={{ fontSize: '1rem', color: '#6B7280' }} /></InputAdornment>,
                    endAdornment: <InputAdornment position="end" sx={{ fontSize: '0.7rem' }}>L/100km</InputAdornment>,
                  }}
                />
              </Grid>

              {/* Service Information Section */}
              <Grid item xs={12}>
                <FormSectionHeader
                  icon={<Build sx={{ fontSize: '1.1rem' }} />}
                  title="Service Information"
                  subtitle="Maintenance and service history"
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Last Service Date"
                  name="lastServiceDate"
                  type="date"
                  value={formData.lastServiceDate || ''}
                  onChange={handleDateChange}
                  size="medium"
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    '& .MuiInputLabel-root': { fontSize: '0.8rem' },
                    '& .MuiInputBase-root': { fontSize: '0.85rem' },
                  }}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><CalendarToday sx={{ fontSize: '1rem', color: '#6B7280' }} /></InputAdornment>,
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
                  size="medium"
                  placeholder="Odometer at last service"
                  sx={{
                    '& .MuiInputLabel-root': { fontSize: '0.8rem' },
                    '& .MuiInputBase-root': { fontSize: '0.85rem' },
                  }}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><Numbers sx={{ fontSize: '1rem', color: '#6B7280' }} /></InputAdornment>,
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
                  size="medium"
                  placeholder="e.g., Heavy, Medium, Light"
                  sx={{
                    '& .MuiInputLabel-root': { fontSize: '0.8rem' },
                    '& .MuiInputBase-root': { fontSize: '0.85rem' },
                  }}
                />
              </Grid>

              {/* Financial Information Section */}
              <Grid item xs={12}>
                <FormSectionHeader
                  icon={<AttachMoney sx={{ fontSize: '1.1rem' }} />}
                  title="Financial Information"
                  subtitle="Purchase, value, and insurance details"
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Purchase Date"
                  name="purchaseDate"
                  type="date"
                  value={formData.purchaseDate || ''}
                  onChange={handleDateChange}
                  size="medium"
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    '& .MuiInputLabel-root': { fontSize: '0.8rem' },
                    '& .MuiInputBase-root': { fontSize: '0.85rem' },
                  }}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><Event sx={{ fontSize: '1rem', color: '#6B7280' }} /></InputAdornment>,
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
                  size="medium"
                  sx={{
                    '& .MuiInputLabel-root': { fontSize: '0.8rem' },
                    '& .MuiInputBase-root': { fontSize: '0.85rem' },
                  }}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><AttachMoney sx={{ fontSize: '1rem', color: '#6B7280' }} /></InputAdornment>,
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
                  size="medium"
                  sx={{
                    '& .MuiInputLabel-root': { fontSize: '0.8rem' },
                    '& .MuiInputBase-root': { fontSize: '0.85rem' },
                  }}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><AttachMoney sx={{ fontSize: '1rem', color: '#6B7280' }} /></InputAdornment>,
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
                  size="medium"
                  placeholder="Policy number"
                  sx={{
                    '& .MuiInputLabel-root': { fontSize: '0.8rem' },
                    '& .MuiInputBase-root': { fontSize: '0.85rem' },
                  }}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Insurance Provider"
                  name="insuranceProvider"
                  value={formData.insuranceProvider}
                  onChange={handleChange}
                  size="medium"
                  placeholder="e.g., OUTsurance, Santam"
                  sx={{
                    '& .MuiInputLabel-root': { fontSize: '0.8rem' },
                    '& .MuiInputBase-root': { fontSize: '0.85rem' },
                  }}
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
                  size="medium"
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    '& .MuiInputLabel-root': { fontSize: '0.8rem' },
                    '& .MuiInputBase-root': { fontSize: '0.85rem' },
                  }}
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
                  size="medium"
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    '& .MuiInputLabel-root': { fontSize: '0.8rem' },
                    '& .MuiInputBase-root': { fontSize: '0.85rem' },
                  }}
                />
              </Grid>

              {/* Additional Information Section */}
              <Grid item xs={12}>
                <FormSectionHeader
                  icon={<Description sx={{ fontSize: '1.1rem' }} />}
                  title="Additional Information"
                  subtitle="Notes and other details"
                />
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
                  size="medium"
                  placeholder="Any additional information about the vehicle..."
                  sx={{
                    '& .MuiInputLabel-root': { fontSize: '0.8rem' },
                    '& .MuiInputBase-root': { fontSize: '0.85rem' },
                  }}
                />
              </Grid>

              {/* Form Actions */}
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={2}
                  sx={{
                    justifyContent: 'space-between',
                    alignItems: { xs: 'stretch', sm: 'center' },
                  }}
                >
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                    {isEditMode
                      ? 'Updating vehicle information will affect all associated records.'
                      : 'New vehicle will be added to the fleet inventory.'}
                  </Typography>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                    <Button
                      type="submit"
                      variant="contained"
                      size="large"
                      startIcon={submitting ? <CircularProgress size={20} /> : <Save sx={{ fontSize: '1rem' }} />}
                      disabled={submitting}
                      sx={{
                        minWidth: { xs: '100%', sm: 200 },
                        fontSize: '0.85rem',
                        py: 1,
                        borderRadius: '10px',
                        textTransform: 'none',
                        fontWeight: 600,
                        background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #4338CA 0%, #4F46E5 100%)',
                          boxShadow: '0 4px 12px rgba(79,70,229,0.3)',
                        },
                      }}
                    >
                      {submitting ? 'Saving...' : (isEditMode ? 'Update Vehicle' : 'Create Vehicle')}
                    </Button>
                    <Button
                      variant="outlined"
                      size="large"
                      onClick={() => navigate('/vehicles')}
                      disabled={submitting}
                      sx={{
                        fontSize: '0.85rem',
                        py: 1,
                        borderRadius: '10px',
                        textTransform: 'none',
                        borderColor: '#ECECEC',
                        color: '#6B7280',
                        '&:hover': {
                          borderColor: '#4F46E5',
                          bgcolor: '#EEF2FF',
                          color: '#4F46E5',
                        },
                      }}
                    >
                      Cancel
                    </Button>
                    {isEditMode && (
                      <Button
                        variant="text"
                        color="error"
                        size="large"
                        onClick={handleDelete}
                        disabled={submitting}
                        sx={{
                          fontSize: '0.85rem',
                          py: 1,
                          borderRadius: '10px',
                          textTransform: 'none',
                          '&:hover': {
                            bgcolor: '#FEE2E2',
                          },
                        }}
                      >
                        Delete Vehicle
                      </Button>
                    )}
                  </Stack>
                </Stack>
              </Grid>
            </Grid>
          </form>
        </Paper>
      </Box>
    </Box>
  );
};

export default VehicleForm;
