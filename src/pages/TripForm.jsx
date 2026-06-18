import React, { useState, useEffect, useCallback, useRef } from 'react';
import dayjs from 'dayjs';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Box,
  FormHelperText,
  Stack,
  Chip,
  Divider,
  Autocomplete,
  IconButton,
  InputAdornment
} from '@mui/material';

import {
  Save,
  Close,
  Schedule as ScheduleIcon,
  DirectionsCar,
  Description,
  LocationOn,
  SwapHoriz,
  CheckCircle,
  Scale,
  AttachMoney,
  Comment,
  Assignment,
  Toll,
  Receipt
} from '@mui/icons-material';

import {
  LocalizationProvider,
  DateTimePicker,
} from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

import { tripService } from '../services/tripService';
import { driverService } from '../services/driverService';
import { vehicleService } from '../services/vehicleService';
import { routingService } from '../services/routingService';

/* ===================== Helpers ===================== */
const formatDateForAPI = (date) =>
  date ? dayjs(date).format('YYYY-MM-DDTHH:mm:ss') : null;

const filterActiveVehicles = (vehicles) =>
  (vehicles || []).filter(v =>
    ['ACTIVE', 'OPERATIONAL', 'AVAILABLE'].includes(v.status?.toUpperCase()) ||
    v.available === true
  );

const filterAvailableDrivers = (drivers) =>
  (drivers || []).filter(d =>
    ['ACTIVE', 'AVAILABLE'].includes(d.status?.toUpperCase()) &&
    d.licenseValid !== false
  );

const PRIORITY_OPTIONS = [
  { value: 'LOW', label: 'Low', color: 'success' },
  { value: 'MEDIUM', label: 'Medium', color: 'warning' },
  { value: 'HIGH', label: 'High', color: 'error' },
  { value: 'URGENT', label: 'Urgent', color: 'error' }
];

const STATUS_OPTIONS = [
  'DRAFT', 'PLANNED', 'ASSIGNED', 'IN_PROGRESS', 
  'COMPLETED', 'ACTIVE', 'PENDING', 'CANCELLED', 'CLOSED', 'FINALIZED'
];

const APPROVAL_STATUS_OPTIONS = [
  'PENDING', 'APPROVED', 'REJECTED', 'UNDER_REVIEW'
];

const TRIP_TYPE_OPTIONS = [
  'FREIGHT', 'RETURN', 'EMPTY', 'MAINTENANCE'
];

const COMMODITY_OPTIONS = [
  'General Freight', 'Refrigerated Goods', 'Dangerous Goods',
  'Chemicals', 'Construction Materials', 'Agricultural Products',
  'Livestock', 'Automotive', 'Electronics', 'Furniture',
  'Textiles', 'Pharmaceuticals', 'Food Products', 'Beverages',
  'Fuel', 'Waste Materials', 'Other'
];

const PROVINCES = [
  'Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal',
  'Limpopo', 'Mpumalanga', 'Northern Cape', 'North West', 'Western Cape'
];

/* ===================== Address Component ===================== */
function AddressSection({ label, address, onChange, errors = {}, disabled = false }) {
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [loadingCity, setLoadingCity] = useState(false);
  const debounceTimer = useRef(null);

  useEffect(() => () => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
  }, []);

  const fetchCitySuggestions = async (query) => {
    if (!query || query.length < 2) {
      setCitySuggestions([]);
      return;
    }
    setLoadingCity(true);
    try {
      const suggestions = await routingService.suggestCities(query);
      setCitySuggestions(suggestions || []);
    } catch {
      setCitySuggestions([]);
    } finally {
      setLoadingCity(false);
    }
  };

  const handleCityInputChange = (_, value) => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => fetchCitySuggestions(value), 300);
  };

  const handleCitySelect = (_, value) => {
    if (!value) return;
    onChange({
      ...address,
      city: typeof value === 'string' ? value : value.city,
      province: value.province || address.province,
      zipCode: value.zipCode || address.zipCode
    });
  };

  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent>
        <Stack direction="row" alignItems="center" spacing={1} mb={2}>
          <LocationOn fontSize="small" color="primary" />
          <Typography variant="subtitle1" fontWeight="medium">{label}</Typography>
          {address.latitude && address.longitude && (
            <Chip size="small" label="📍 Geocoded" color="success" variant="outlined" />
          )}
        </Stack>

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Street Address"
              value={address.street || ''}
              onChange={(e) => onChange({ ...address, street: e.target.value })}
              size="small"
              placeholder="e.g., 16275 Imbuzana Street"
              disabled={disabled}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Autocomplete
              freeSolo
              options={citySuggestions}
              getOptionLabel={(o) => (typeof o === 'string' ? o : o.city)}
              loading={loadingCity}
              value={address.city || ''}
              onInputChange={handleCityInputChange}
              onChange={handleCitySelect}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="City / Town *"
                  size="small"
                  required
                  error={!!errors.city}
                  helperText={errors.city || 'Start typing for suggestions'}
                  disabled={disabled}
                />
              )}
              renderOption={(props, option) => (
                <li {...props}>
                  <Box>
                    <Typography variant="body2">{option.city}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {option.province}
                      {option.zipCode && ` • ${option.zipCode}`}
                    </Typography>
                  </Box>
                </li>
              )}
            />
          </Grid>

          <Grid item xs={6} md={3}>
            <TextField
              fullWidth
              label="Postal Code"
              value={address.zipCode || ''}
              onChange={(e) => onChange({ ...address, zipCode: e.target.value })}
              size="small"
              placeholder="e.g., 1475"
              inputProps={{ maxLength: 4 }}
              disabled={disabled}
            />
          </Grid>

          <Grid item xs={6} md={3}>
            <FormControl fullWidth size="small" error={!!errors.province}>
              <InputLabel>Province</InputLabel>
              <Select
                value={address.province || ''}
                label="Province"
                onChange={(e) => onChange({ ...address, province: e.target.value })}
                disabled={disabled}
              >
                <MenuItem value="">Select province</MenuItem>
                {PROVINCES.map(p => (
                  <MenuItem key={p} value={p}>{p}</MenuItem>
                ))}
              </Select>
              {errors.province && <FormHelperText>{errors.province}</FormHelperText>}
            </FormControl>
          </Grid>

          {/* Manual coordinate entry */}
          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
            <Typography variant="caption" color="text.secondary">
              Coordinates (optional)
            </Typography>
            <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
              <TextField
                fullWidth
                label="Latitude"
                type="number"
                value={address.latitude || ''}
                onChange={(e) => onChange({ ...address, latitude: parseFloat(e.target.value) || null })}
                size="small"
                placeholder="e.g., -26.3378"
                InputProps={{ inputProps: { step: 'any' } }}
              />
              <TextField
                fullWidth
                label="Longitude"
                type="number"
                value={address.longitude || ''}
                onChange={(e) => onChange({ ...address, longitude: parseFloat(e.target.value) || null })}
                size="small"
                placeholder="e.g., 28.2023"
                InputProps={{ inputProps: { step: 'any' } }}
              />
            </Stack>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}

/* ===================== Main Component ===================== */
function TripForm({ open = false, onClose, mode = 'create', initialData, onSuccess, fetchTrips }) {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  const [origin, setOrigin] = useState({
    street: '', city: '', zipCode: '', province: '', latitude: null, longitude: null
  });

  const [destination, setDestination] = useState({
    street: '', city: '', zipCode: '', province: '', latitude: null, longitude: null
  });

  const [form, setForm] = useState({
    tripType: 'FREIGHT',
    status: 'PLANNED',
    approvalStatus: 'PENDING',
    priority: 'MEDIUM',
    commodityType: '',
    cargoDescription: '',
    cargoWeight: '',
    cargoValue: '',
    palletCount: '',
    containerNumber: '',
    plannedStartDate: null,
    plannedEndDate: null,
    estimatedDuration: '',
    plannedDistanceKm: '',
    plannedDurationHours: '',
    vehicleId: '',
    driverId: '',
    supervisorId: '',
    loadId: '',
    notes: '',
    specialInstructions: '',
    driverNotes: '',
    referenceNumber: '',
    purchaseOrderNumber: '',
    estimatedTollCost: '',
    estimatedOtherExpenses: '',
    cancellationReason: ''
  });

  // Load data
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [vRes, dRes] = await Promise.all([
        vehicleService.getAllVehicles().catch(() => []),
        driverService.getAllDrivers().catch(() => [])
      ]);

      setVehicles(filterActiveVehicles(vRes));
      setDrivers(filterAvailableDrivers(dRes));

      try {
        const usersResponse = await fetch('/api/users?roles=MANAGER,SUPER_ADMIN');
        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          setSupervisors(Array.isArray(usersData) ? usersData : (usersData.content || usersData.data || []));
        } else {
          setSupervisors([]);
        }
      } catch {
        setSupervisors([]);
      }
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Failed to load vehicles or drivers');
    } finally {
      setLoading(false);
    }
  }, []);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      const timer = setTimeout(() => {
        setOrigin({ street: '', city: '', zipCode: '', province: '', latitude: null, longitude: null });
        setDestination({ street: '', city: '', zipCode: '', province: '', latitude: null, longitude: null });
        setForm({
          tripType: 'FREIGHT',
          status: 'PLANNED',
          approvalStatus: 'PENDING',
          priority: 'MEDIUM',
          commodityType: '',
          cargoDescription: '',
          cargoWeight: '',
          cargoValue: '',
          palletCount: '',
          containerNumber: '',
          plannedStartDate: null,
          plannedEndDate: null,
          estimatedDuration: '',
          plannedDistanceKm: '',
          plannedDurationHours: '',
          vehicleId: '',
          driverId: '',
          supervisorId: '',
          loadId: '',
          notes: '',
          specialInstructions: '',
          driverNotes: '',
          referenceNumber: '',
          purchaseOrderNumber: '',
          estimatedTollCost: '',
          estimatedOtherExpenses: '',
          cancellationReason: ''
        });
        setFormErrors({});
        setError(null);
        setSuccessMessage(null);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Load data on open
  useEffect(() => {
    if (!open) return;
    loadData();
  }, [open, loadData]);

  // Validate form
  const validateForm = useCallback(() => {
    const errors = {};

    if (!origin.city) errors.originCity = 'Origin city is required';
    if (!origin.province) errors.originProvince = 'Origin province is required';
    if (!destination.city) errors.destinationCity = 'Destination city is required';
    if (!destination.province) errors.destinationProvince = 'Destination province is required';

    if (!form.plannedStartDate) errors.plannedStartDate = 'Planned start date is required';
    if (form.plannedEndDate && form.plannedStartDate) {
      if (dayjs(form.plannedEndDate).isBefore(form.plannedStartDate)) {
        errors.plannedEndDate = 'End date must be after start date';
      }
    }

    if (!form.vehicleId) errors.vehicleId = 'Please select a vehicle';
    if (!form.driverId) errors.driverId = 'Please select a driver';
    if (!form.commodityType) errors.commodityType = 'Please select commodity type';

    if (form.cargoWeight && isNaN(parseFloat(form.cargoWeight))) {
      errors.cargoWeight = 'Weight must be a number';
    }
    if (form.cargoValue && isNaN(parseFloat(form.cargoValue))) {
      errors.cargoValue = 'Value must be a number';
    }

    return errors;
  }, [origin, destination, form]);

  const handleFieldChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleDateTimeChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSwapLocations = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };

  // Submit
  const handleSubmit = useCallback(async () => {
    if (submitting) return;

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const originAddress = [origin.street, origin.city, origin.zipCode, origin.province].filter(Boolean).join(', ');
      const destAddress = [destination.street, destination.city, destination.zipCode, destination.province].filter(Boolean).join(', ');

      // ⚠️ DO NOT send tripNumber - backend generates it
      const payload = {
        tripType: form.tripType,
        status: form.status,
        approvalStatus: form.approvalStatus || 'PENDING',
        priority: form.priority,

        plannedStartDate: formatDateForAPI(form.plannedStartDate),
        plannedEndDate: formatDateForAPI(form.plannedEndDate),
        estimatedDuration: form.estimatedDuration ? parseFloat(form.estimatedDuration) : null,
        plannedDistanceKm: form.plannedDistanceKm ? parseFloat(form.plannedDistanceKm) : null,
        plannedDurationHours: form.plannedDurationHours ? parseFloat(form.plannedDurationHours) : null,

        tollCost: form.estimatedTollCost ? parseFloat(form.estimatedTollCost) : null,
        otherExpenses: form.estimatedOtherExpenses ? parseFloat(form.estimatedOtherExpenses) : null,

        vehicleId: form.vehicleId ? parseInt(form.vehicleId, 10) : null,
        driverId: form.driverId ? parseInt(form.driverId, 10) : null,
        supervisorId: form.supervisorId ? parseInt(form.supervisorId, 10) : null,

        commodityType: form.commodityType || null,
        cargoDescription: form.cargoDescription || null,
        cargoWeight: form.cargoWeight ? parseFloat(form.cargoWeight) : null,
        cargoValue: form.cargoValue ? parseFloat(form.cargoValue) : null,
        palletCount: form.palletCount ? parseInt(form.palletCount, 10) : null,
        containerNumber: form.containerNumber || null,

        originStreetAddress: origin.street || null,
        originCity: origin.city,
        originZipCode: origin.zipCode || null,
        originProvince: origin.province || null,
        originLatitude: origin.latitude || null,
        originLongitude: origin.longitude || null,
        originLocation: originAddress || null,

        destinationStreetAddress: destination.street || null,
        destinationCity: destination.city,
        destinationZipCode: destination.zipCode || null,
        destinationProvince: destination.province || null,
        destinationLatitude: destination.latitude || null,
        destinationLongitude: destination.longitude || null,
        destinationLocation: destAddress || null,

        notes: form.notes || null,
        specialInstructions: form.specialInstructions || null,
        driverNotes: form.driverNotes || null,
        referenceNumber: form.referenceNumber || null,
        purchaseOrderNumber: form.purchaseOrderNumber || null,
        cancellationReason: form.cancellationReason || null
      };

      // Remove undefined/null values
      Object.keys(payload).forEach(key => {
        if (payload[key] === undefined || payload[key] === null) {
          delete payload[key];
        }
      });

      console.log('📤 Creating trip:', payload);

      const result = await tripService.createTrip(payload);
      console.log('✅ Trip created:', result);

      setSuccessMessage(`Trip ${result.tripNumber} created successfully!`);

      if (fetchTrips) await fetchTrips();
      if (onSuccess) onSuccess(result);

      setTimeout(() => {
        if (onClose) onClose();
      }, 1500);

    } catch (err) {
      console.error('❌ Create trip error:', err);
      let errorMessage = 'Failed to create trip';

      if (err.response?.status === 409) {
        errorMessage = 'Duplicate trip detected.';
      } else if (err.response?.status === 400) {
        errorMessage = err.response.data?.message || 'Invalid data. Please check all fields.';
      } else if (err.response?.status === 429) {
        errorMessage = 'Rate limit exceeded. Trip saved, coordinates will update later.';
      } else {
        errorMessage = err.response?.data?.message || err.message || 'Failed to create trip';
      }

      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  }, [form, origin, destination, validateForm, onSuccess, onClose, fetchTrips, submitting]);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider', pb: 2 }}>
          <Typography variant="h6">
            {mode === 'create' ? 'Create New Trip' : `Edit Trip`}
          </Typography>
        </DialogTitle>

        <DialogContent dividers sx={{ overflowY: 'auto' }}>
          {loading && (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {successMessage && (
            <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccessMessage(null)}>
              {successMessage}
            </Alert>
          )}

          {!loading && (
            <Stack spacing={3}>
              {/* Trip Type */}
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Trip Type</InputLabel>
                    <Select
                      value={form.tripType}
                      label="Trip Type"
                      onChange={(e) => handleFieldChange('tripType', e.target.value)}
                    >
                      {TRIP_TYPE_OPTIONS.map(type => (
                        <MenuItem key={type} value={type}>{type}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Priority</InputLabel>
                    <Select
                      value={form.priority}
                      label="Priority"
                      onChange={(e) => handleFieldChange('priority', e.target.value)}
                    >
                      {PRIORITY_OPTIONS.map(p => (
                        <MenuItem key={p.value} value={p.value}>
                          <Chip label={p.label} size="small" color={p.color} />
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              {/* Origin & Destination */}
              <Box sx={{ position: 'relative' }}>
                <AddressSection
                  label="Origin"
                  address={origin}
                  onChange={setOrigin}
                  errors={{ city: formErrors.originCity, province: formErrors.originProvince }}
                />

                <Box display="flex" justifyContent="center" my={-1} position="relative" zIndex={1}>
                  <IconButton onClick={handleSwapLocations} sx={{ bgcolor: 'background.paper', boxShadow: 1 }}>
                    <SwapHoriz />
                  </IconButton>
                </Box>

                <AddressSection
                  label="Destination"
                  address={destination}
                  onChange={setDestination}
                  errors={{ city: formErrors.destinationCity, province: formErrors.destinationProvince }}
                />
              </Box>

              {/* Schedule */}
              <Card variant="outlined">
                <CardContent>
                  <Stack direction="row" spacing={1} mb={2}>
                    <ScheduleIcon fontSize="small" color="primary" />
                    <Typography variant="subtitle1" fontWeight="medium">Schedule</Typography>
                  </Stack>

                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <DateTimePicker
                        label="Planned Start Date & Time *"
                        value={form.plannedStartDate}
                        onChange={(value) => handleDateTimeChange('plannedStartDate', value)}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            size: 'small',
                            required: true,
                            error: !!formErrors.plannedStartDate,
                            helperText: formErrors.plannedStartDate
                          }
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <DateTimePicker
                        label="Planned End Date & Time"
                        value={form.plannedEndDate}
                        onChange={(value) => handleDateTimeChange('plannedEndDate', value)}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            size: 'small',
                            error: !!formErrors.plannedEndDate,
                            helperText: formErrors.plannedEndDate
                          }
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Est. Duration (hours)"
                        type="number"
                        value={form.estimatedDuration}
                        onChange={(e) => handleFieldChange('estimatedDuration', e.target.value)}
                        size="small"
                        InputProps={{ endAdornment: 'hrs' }}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Planned Distance (km)"
                        type="number"
                        value={form.plannedDistanceKm}
                        onChange={(e) => handleFieldChange('plannedDistanceKm', e.target.value)}
                        size="small"
                        InputProps={{ endAdornment: 'km' }}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Planned Duration (hours)"
                        type="number"
                        value={form.plannedDurationHours}
                        onChange={(e) => handleFieldChange('plannedDurationHours', e.target.value)}
                        size="small"
                        InputProps={{ endAdornment: 'hrs' }}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Assignment */}
              <Card variant="outlined">
                <CardContent>
                  <Stack direction="row" spacing={1} mb={2}>
                    <DirectionsCar fontSize="small" color="primary" />
                    <Typography variant="subtitle1" fontWeight="medium">Assignment</Typography>
                  </Stack>

                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <FormControl fullWidth size="small" required error={!!formErrors.vehicleId}>
                        <InputLabel>Vehicle *</InputLabel>
                        <Select
                          value={form.vehicleId}
                          label="Vehicle *"
                          onChange={(e) => handleFieldChange('vehicleId', e.target.value)}
                        >
                          <MenuItem value=""><em>Select vehicle</em></MenuItem>
                          {vehicles.map(v => (
                            <MenuItem key={v.id} value={v.id.toString()}>
                              {v.registrationNumber} - {v.make} {v.model}
                            </MenuItem>
                          ))}
                        </Select>
                        {formErrors.vehicleId && <FormHelperText error>{formErrors.vehicleId}</FormHelperText>}
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <FormControl fullWidth size="small" required error={!!formErrors.driverId}>
                        <InputLabel>Driver *</InputLabel>
                        <Select
                          value={form.driverId}
                          label="Driver *"
                          onChange={(e) => handleFieldChange('driverId', e.target.value)}
                        >
                          <MenuItem value=""><em>Select driver</em></MenuItem>
                          {drivers.map(d => (
                            <MenuItem key={d.id} value={d.id.toString()}>
                              {d.firstName} {d.lastName}
                            </MenuItem>
                          ))}
                        </Select>
                        {formErrors.driverId && <FormHelperText error>{formErrors.driverId}</FormHelperText>}
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Supervisor</InputLabel>
                        <Select
                          value={form.supervisorId}
                          label="Supervisor"
                          onChange={(e) => handleFieldChange('supervisorId', e.target.value)}
                        >
                          <MenuItem value=""><em>Select supervisor</em></MenuItem>
                          {supervisors.map(s => (
                            <MenuItem key={s.id} value={s.id.toString()}>
                              {s.firstName} {s.lastName}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Commodity & Cargo */}
              <Card variant="outlined">
                <CardContent>
                  <Stack direction="row" spacing={1} mb={2}>
                    <Description fontSize="small" color="primary" />
                    <Typography variant="subtitle1" fontWeight="medium">Commodity & Cargo</Typography>
                  </Stack>

                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth size="small" required error={!!formErrors.commodityType}>
                        <InputLabel>Commodity Type *</InputLabel>
                        <Select
                          value={form.commodityType}
                          label="Commodity Type *"
                          onChange={(e) => handleFieldChange('commodityType', e.target.value)}
                        >
                          <MenuItem value=""><em>Select commodity</em></MenuItem>
                          {COMMODITY_OPTIONS.map(c => (
                            <MenuItem key={c} value={c}>{c}</MenuItem>
                          ))}
                        </Select>
                        {formErrors.commodityType && <FormHelperText error>{formErrors.commodityType}</FormHelperText>}
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Cargo Description"
                        value={form.cargoDescription}
                        onChange={(e) => handleFieldChange('cargoDescription', e.target.value)}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Weight (kg)"
                        type="number"
                        value={form.cargoWeight}
                        onChange={(e) => handleFieldChange('cargoWeight', e.target.value)}
                        size="small"
                        InputProps={{
                          startAdornment: <InputAdornment position="start"><Scale /></InputAdornment>,
                          endAdornment: <InputAdornment position="end">kg</InputAdornment>
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Value (ZAR)"
                        type="number"
                        value={form.cargoValue}
                        onChange={(e) => handleFieldChange('cargoValue', e.target.value)}
                        size="small"
                        InputProps={{
                          startAdornment: <InputAdornment position="start"><AttachMoney /></InputAdornment>
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Pallet Count"
                        type="number"
                        value={form.palletCount}
                        onChange={(e) => handleFieldChange('palletCount', e.target.value)}
                        size="small"
                        InputProps={{ endAdornment: 'pallets' }}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Financial */}
              <Card variant="outlined">
                <CardContent>
                  <Stack direction="row" spacing={1} mb={2}>
                    <Receipt fontSize="small" color="primary" />
                    <Typography variant="subtitle1" fontWeight="medium">Financial Estimates</Typography>
                  </Stack>

                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Est. Toll Cost (ZAR)"
                        type="number"
                        value={form.estimatedTollCost}
                        onChange={(e) => handleFieldChange('estimatedTollCost', e.target.value)}
                        size="small"
                        InputProps={{
                          startAdornment: <InputAdornment position="start"><Toll /></InputAdornment>
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Est. Other Expenses (ZAR)"
                        type="number"
                        value={form.estimatedOtherExpenses}
                        onChange={(e) => handleFieldChange('estimatedOtherExpenses', e.target.value)}
                        size="small"
                        InputProps={{
                          startAdornment: <InputAdornment position="start"><AttachMoney /></InputAdornment>
                        }}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Notes */}
              <Card variant="outlined">
                <CardContent>
                  <Stack direction="row" spacing={1} mb={2}>
                    <Comment fontSize="small" color="primary" />
                    <Typography variant="subtitle1" fontWeight="medium">Notes</Typography>
                  </Stack>

                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Reference Number"
                        value={form.referenceNumber}
                        onChange={(e) => handleFieldChange('referenceNumber', e.target.value)}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Purchase Order Number"
                        value={form.purchaseOrderNumber}
                        onChange={(e) => handleFieldChange('purchaseOrderNumber', e.target.value)}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label="Special Instructions"
                        value={form.specialInstructions}
                        onChange={(e) => handleFieldChange('specialInstructions', e.target.value)}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        multiline
                        rows={2}
                        label="Driver Notes"
                        value={form.driverNotes}
                        onChange={(e) => handleFieldChange('driverNotes', e.target.value)}
                        size="small"
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Status */}
              <Card variant="outlined">
                <CardContent>
                  <Stack direction="row" spacing={1} mb={2}>
                    <Assignment fontSize="small" color="primary" />
                    <Typography variant="subtitle1" fontWeight="medium">Status</Typography>
                  </Stack>

                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Status</InputLabel>
                        <Select
                          value={form.status}
                          label="Status"
                          onChange={(e) => handleFieldChange('status', e.target.value)}
                        >
                          {STATUS_OPTIONS.map(s => (
                            <MenuItem key={s} value={s}>{s}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Approval Status</InputLabel>
                        <Select
                          value={form.approvalStatus}
                          label="Approval Status"
                          onChange={(e) => handleFieldChange('approvalStatus', e.target.value)}
                        >
                          {APPROVAL_STATUS_OPTIONS.map(s => (
                            <MenuItem key={s} value={s}>{s}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Stack>
          )}
        </DialogContent>

        <DialogActions sx={{ borderTop: 1, borderColor: 'divider', p: 2 }}>
          <Button startIcon={<Close />} onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            startIcon={submitting ? <CircularProgress size={20} /> : <Save />}
            disabled={submitting || loading}
          >
            {submitting ? 'Saving...' : (mode === 'create' ? 'Create Trip' : 'Update Trip')}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
}

export default TripForm;
