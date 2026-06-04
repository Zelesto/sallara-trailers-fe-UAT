import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  Tooltip
} from '@mui/material';
import {
  Save,
  Close,
  Warning,
  Schedule as ScheduleIcon,
  Person,
  DirectionsCar,
  Description,
  PriorityHigh,
  LocationOn,
  MyLocation,
  SwapHoriz,
  CheckCircle,
  Error as ErrorIcon
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
  vehicles.filter(v => 
    ['ACTIVE', 'OPERATIONAL', 'AVAILABLE'].includes(v.status?.toUpperCase()) || 
    v.available === true
  );

const filterAvailableDrivers = (drivers) =>
  drivers.filter(d => 
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

// South African Provinces
const PROVINCES = [
  'Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal',
  'Limpopo', 'Mpumalanga', 'Northern Cape', 'North West', 'Western Cape'
];

/* ===================== Address Component ===================== */
function AddressSection({ 
  label, 
  address, 
  onChange, 
  errors = {}, 
  onGeocode,
  disabled = false 
}) {
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [loadingCity, setLoadingCity] = useState(false);
  const [geocodingStatus, setGeocodingStatus] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const debounceTimer = useRef(null);

  // Fetch city suggestions
  const fetchCitySuggestions = async (query) => {
    if (!query || query.length < 2) {
      setCitySuggestions([]);
      return;
    }

    setLoadingCity(true);
    try {
      const suggestions = await routingService.suggestCities(query);
      setCitySuggestions(suggestions || []);
    } catch (error) {
      console.error('Error fetching city suggestions:', error);
      setCitySuggestions([]);
    } finally {
      setLoadingCity(false);
    }
  };

  // Debounced city search
  const handleCityInputChange = (event, value) => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    debounceTimer.current = setTimeout(() => {
      fetchCitySuggestions(value);
    }, 300);
  };

  // Handle city selection
  const handleCitySelect = async (event, value) => {
    if (value) {
      const newAddress = { 
        ...address, 
        city: value.city,
        province: value.province || address.province,
        zipCode: value.zipCode || address.zipCode
      };
      onChange(newAddress);
      
      // Auto-fetch zip code if not provided
      if (!value.zipCode && value.city) {
        await fetchZipCodeForCity(value.city, value.province, newAddress);
      }
      
      // Auto-fetch coordinates
      if (address.street) {
        await geocodeAddress({ ...newAddress, street: address.street });
      }
    }
  };

  // Fetch zip code for a city
  const fetchZipCodeForCity = async (city, province, currentAddress) => {
    try {
      const zipInfo = await routingService.getZipCodeForCity(city, province);
      if (zipInfo?.zipCode && zipInfo.zipCode !== currentAddress.zipCode) {
        onChange({ ...currentAddress, zipCode: zipInfo.zipCode });
        setGeocodingStatus({ 
          type: 'success', 
          message: `Zip code auto-filled: ${zipInfo.zipCode}` 
        });
        setTimeout(() => setGeocodingStatus(null), 3000);
      }
    } catch (error) {
      console.error('Error fetching zip code:', error);
    }
  };

  // Geocode full address
  const geocodeAddress = async (addressToGeocode) => {
    if (!addressToGeocode.city && !addressToGeocode.street) return;
    
    setGeocodingStatus({ type: 'loading', message: 'Validating address...' });
    
    try {
      const fullAddress = `${addressToGeocode.street || ''} ${addressToGeocode.city || ''} ${addressToGeocode.zipCode || ''} ${addressToGeocode.province || ''}`.trim();
      
      if (!fullAddress) {
        setGeocodingStatus(null);
        return;
      }
      
      const coords = await routingService.geocodeAddress(fullAddress);
      
      if (coords) {
        onChange({ ...addressToGeocode, latitude: coords.lat, longitude: coords.lng });
        setGeocodingStatus({ 
          type: 'success', 
          message: 'Location verified ✓' 
        });
        if (onGeocode) onGeocode(coords);
        setTimeout(() => setGeocodingStatus(null), 2000);
      } else {
        setGeocodingStatus({ 
          type: 'warning', 
          message: 'Could not verify exact location, using city center' 
        });
        setTimeout(() => setGeocodingStatus(null), 3000);
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      setGeocodingStatus({ 
        type: 'error', 
        message: 'Location validation failed' 
      });
      setTimeout(() => setGeocodingStatus(null), 3000);
    }
  };

  // Handle street address blur
  const handleStreetBlur = () => {
    if (address.street && (address.city || address.zipCode)) {
      geocodeAddress(address);
    }
  };

  // Handle manual zip code change
  const handleZipCodeChange = (value) => {
    onChange({ ...address, zipCode: value });
    if (value.length === 4 && address.city) {
      // Could validate zip code here
      setGeocodingStatus({ type: 'info', message: 'Verifying zip code...' });
      setTimeout(() => setGeocodingStatus(null), 1500);
    }
  };

  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent>
        <Stack direction="row" alignItems="center" spacing={1} mb={2}>
          <LocationOn fontSize="small" color="primary" />
          <Typography variant="subtitle1" fontWeight="medium">
            {label}
          </Typography>
          {address.latitude && address.longitude && (
            <Chip 
              size="small" 
              label="📍 Geocoded" 
              color="success" 
              variant="outlined"
              icon={<CheckCircle sx={{ fontSize: 14 }} />}
            />
          )}
        </Stack>
        
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Street Address"
              value={address.street || ''}
              onChange={(e) => onChange({ ...address, street: e.target.value })}
              onBlur={handleStreetBlur}
              error={!!errors.street}
              helperText={errors.street}
              size="small"
              placeholder="e.g., 16275 Imbuzana Street"
              disabled={disabled}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Autocomplete
              freeSolo
              options={citySuggestions}
              getOptionLabel={(option) => typeof option === 'string' ? option : option.city}
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
              onChange={(e) => handleZipCodeChange(e.target.value)}
              error={!!errors.zipCode}
              helperText={errors.zipCode}
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
                {PROVINCES.map(province => (
                  <MenuItem key={province} value={province}>{province}</MenuItem>
                ))}
              </Select>
              {errors.province && <FormHelperText>{errors.province}</FormHelperText>}
            </FormControl>
          </Grid>
        </Grid>
        
        {geocodingStatus && (
          <Alert 
            severity={geocodingStatus.type} 
            sx={{ mt: 2 }} 
            icon={geocodingStatus.type === 'loading' ? <CircularProgress size={16} /> : undefined}
          >
            {geocodingStatus.message}
          </Alert>
        )}
        
        {/* Mini Map Preview (Optional) */}
        {showMap && address.latitude && address.longitude && (
          <Box sx={{ mt: 2, height: 200, bgcolor: '#f5f5f5', borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              Map view would show location at {address.latitude}, {address.longitude}
            </Typography>
          </Box>
        )}
        
        {(address.latitude || address.longitude) && (
          <Box sx={{ mt: 1 }}>
            <Button
              size="small"
              onClick={() => setShowMap(!showMap)}
              startIcon={<MyLocation />}
            >
              {showMap ? 'Hide Map' : 'Show Map Preview'}
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

/* ===================== Main Component ===================== */
function TripForm({ open = false, onClose, mode = 'create', initialData, onSuccess }) {
  /* ===================== State ===================== */
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [error, setError] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [routePreview, setRoutePreview] = useState(null);
  const [calculatingRoute, setCalculatingRoute] = useState(false);

  const [origin, setOrigin] = useState({
    street: '',
    city: '',
    zipCode: '',
    province: '',
    latitude: null,
    longitude: null
  });
  
  const [destination, setDestination] = useState({
    street: '',
    city: '',
    zipCode: '',
    province: '',
    latitude: null,
    longitude: null
  });

  const [form, setForm] = useState({
    tripNumber: '',
    status: 'PLANNED',
    priority: 'MEDIUM',
    cargoDescription: '',
    cargoWeight: '',
    cargoValue: '',
    plannedStartDate: null,
    plannedEndDate: null,
    estimatedDuration: '',
    vehicleId: '',
    driverId: '',
    notes: '',
    specialInstructions: ''
  });

  /* ===================== Load Data ===================== */
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [vRes, dRes] = await Promise.all([
        vehicleService.getAllVehicles().catch(() => []),
        driverService.getAllDrivers().catch(() => [])
      ]);
      
      setVehicles(filterActiveVehicles(vRes || []));
      setDrivers(filterAvailableDrivers(dRes || []));
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
        setOrigin({
          street: '', city: '', zipCode: '', province: '', latitude: null, longitude: null
        });
        setDestination({
          street: '', city: '', zipCode: '', province: '', latitude: null, longitude: null
        });
        setForm({
          tripNumber: '',
          status: 'PLANNED',
          priority: 'MEDIUM',
          cargoDescription: '',
          cargoWeight: '',
          cargoValue: '',
          plannedStartDate: null,
          plannedEndDate: null,
          estimatedDuration: '',
          vehicleId: '',
          driverId: '',
          notes: '',
          specialInstructions: ''
        });
        setFormErrors({});
        setError(null);
        setRoutePreview(null);
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Load data and initialize form when dialog opens
  useEffect(() => {
    if (!open) return;
    
    loadData();
    
    if (mode === 'edit' && initialData) {
      // Populate origin address
      setOrigin({
        street: initialData.originStreetAddress || '',
        city: initialData.originCity || '',
        zipCode: initialData.originZipCode || '',
        province: initialData.originProvince || '',
        latitude: initialData.originLatitude || null,
        longitude: initialData.originLongitude || null
      });
      
      // Populate destination address
      setDestination({
        street: initialData.destinationStreetAddress || '',
        city: initialData.destinationCity || '',
        zipCode: initialData.destinationZipCode || '',
        province: initialData.destinationProvince || '',
        latitude: initialData.destinationLatitude || null,
        longitude: initialData.destinationLongitude || null
      });
      
      setForm({
        tripNumber: initialData.tripNumber || '',
        status: initialData.status || 'PLANNED',
        priority: initialData.priority || 'MEDIUM',
        cargoDescription: initialData.cargoDescription || '',
        cargoWeight: initialData.cargoWeight?.toString() || '',
        cargoValue: initialData.cargoValue?.toString() || '',
        plannedStartDate: initialData.plannedStartDate ? dayjs(initialData.plannedStartDate) : null,
        plannedEndDate: initialData.plannedEndDate ? dayjs(initialData.plannedEndDate) : null,
        estimatedDuration: initialData.estimatedDuration?.toString() || '',
        vehicleId: initialData.vehicleId?.toString() || '',
        driverId: initialData.driverId?.toString() || '',
        notes: initialData.notes || '',
        specialInstructions: initialData.specialInstructions || ''
      });
    } else {
      const tripNumber = `TRIP-${Date.now().toString(36).toUpperCase()}`;
      setForm(prev => ({
        ...prev,
        tripNumber,
        status: 'PLANNED',
        priority: 'MEDIUM'
      }));
    }
  }, [open, mode, initialData, loadData]);

  // Calculate route preview when both locations have city/coordinates
  useEffect(() => {
    const calculatePreview = async () => {
      if (!origin.city || !destination.city) return;
      
      setCalculatingRoute(true);
      try {
        // Build full addresses
        const originAddress = `${origin.street || ''} ${origin.city} ${origin.zipCode || ''} ${origin.province || ''}`.trim();
        const destAddress = `${destination.street || ''} ${destination.city} ${destination.zipCode || ''} ${destination.province || ''}`.trim();
        
        if (originAddress && destAddress) {
          const route = await routingService.calculateRoute(originAddress, destAddress, 'TRUCK');
          setRoutePreview(route);
          
          // Auto-set estimated duration
          if (route?.durationHours && !form.estimatedDuration) {
            setForm(prev => ({ ...prev, estimatedDuration: route.durationHours.toString() }));
          }
        }
      } catch (error) {
        console.error('Route preview failed:', error);
        setRoutePreview(null);
      } finally {
        setCalculatingRoute(false);
      }
    };
    
    const timer = setTimeout(calculatePreview, 1000);
    return () => clearTimeout(timer);
  }, [origin.city, destination.city, origin.street, destination.street]);

  /* ===================== Validation ===================== */
  const validateForm = useCallback(() => {
    const errors = {};
    
    if (!origin.city) {
      errors.originCity = 'Origin city is required';
    }
    
    if (!destination.city) {
      errors.destinationCity = 'Destination city is required';
    }
    
    if (!form.plannedStartDate) {
      errors.plannedStartDate = 'Planned start date is required';
    }
    
    if (form.plannedEndDate && form.plannedStartDate) {
      if (dayjs(form.plannedEndDate).isBefore(form.plannedStartDate)) {
        errors.plannedEndDate = 'End date must be after start date';
      }
    }
    
    if (form.cargoWeight && isNaN(parseFloat(form.cargoWeight))) {
      errors.cargoWeight = 'Cargo weight must be a number';
    }
    
    if (form.estimatedDuration && isNaN(parseFloat(form.estimatedDuration))) {
      errors.estimatedDuration = 'Duration must be a number';
    }
    
    return errors;
  }, [origin.city, destination.city, form]);

  /* ===================== Form Handlers ===================== */
  const handleFieldChange = useCallback((field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  }, [formErrors]);

  const handleDateTimeChange = useCallback((field, value) => {
    setForm(prev => ({ 
      ...prev, 
      [field]: value,
      ...(formErrors[field] && { [field]: '' })
    }));
    
    if (field === 'plannedStartDate' && form.plannedEndDate && value) {
      const duration = dayjs(form.plannedEndDate).diff(value, 'hours');
      if (duration > 0) {
        setForm(prev => ({ ...prev, estimatedDuration: duration.toString() }));
      }
    } else if (field === 'plannedEndDate' && form.plannedStartDate && value) {
      const duration = dayjs(value).diff(form.plannedStartDate, 'hours');
      if (duration > 0) {
        setForm(prev => ({ ...prev, estimatedDuration: duration.toString() }));
      }
    }
  }, [form.plannedEndDate, form.plannedStartDate, formErrors]);

  // Swap origin and destination
  const handleSwapLocations = () => {
    setOrigin(destination);
    setDestination(origin);
  };

  /* ===================== Submit ===================== */
  const handleSubmit = useCallback(async () => {
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    setSubmitting(true);
    setError(null);
    
    try {
      const payload = {
        ...form,
        vehicleId: form.vehicleId ? parseInt(form.vehicleId, 10) : null,
        driverId: form.driverId ? parseInt(form.driverId, 10) : null,
        cargoWeight: form.cargoWeight ? parseFloat(form.cargoWeight) : null,
        cargoValue: form.cargoValue ? parseFloat(form.cargoValue) : null,
        estimatedDuration: form.estimatedDuration ? parseFloat(form.estimatedDuration) : null,
        plannedStartDate: formatDateForAPI(form.plannedStartDate),
        plannedEndDate: formatDateForAPI(form.plannedEndDate),
        
        // Address components
        originStreetAddress: origin.street,
        originCity: origin.city,
        originZipCode: origin.zipCode,
        originProvince: origin.province,
        originLatitude: origin.latitude,
        originLongitude: origin.longitude,
        
        destinationStreetAddress: destination.street,
        destinationCity: destination.city,
        destinationZipCode: destination.zipCode,
        destinationProvince: destination.province,
        destinationLatitude: destination.latitude,
        destinationLongitude: destination.longitude,
        
        // Legacy fields for compatibility
        originLocation: `${origin.street ? origin.street + ', ' : ''}${origin.city} ${origin.zipCode || ''}, ${origin.province || ''}`.trim(),
        destinationLocation: `${destination.street ? destination.street + ', ' : ''}${destination.city} ${destination.zipCode || ''}, ${destination.province || ''}`.trim()
      };
      
      // Remove empty strings
      Object.keys(payload).forEach(key => {
        if (payload[key] === '') {
          payload[key] = null;
        }
      });
      
      let result;
      if (mode === 'create') {
        result = await tripService.createTrip(payload);
      } else {
        result = await tripService.updateTrip(initialData.id, payload);
      }
      
      onSuccess?.(result);
      if (onClose) onClose();
    } catch (err) {
      console.error('Submit error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to save trip');
    } finally {
      setSubmitting(false);
    }
  }, [form, origin, destination, mode, initialData, validateForm, onSuccess, onClose]);

  const priorityColor = useMemo(() => {
    return PRIORITY_OPTIONS.find(p => p.value === form.priority)?.color || 'default';
  }, [form.priority]);

  const handleDialogClose = useCallback((event, reason) => {
    if (reason === 'backdropClick' && submitting) {
      return;
    }
    if (onClose) onClose();
  }, [onClose, submitting]);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Dialog 
        open={open} 
        onClose={handleDialogClose}
        maxWidth="lg" 
        fullWidth
        PaperProps={{ sx: { maxHeight: '90vh' } }}
      >
        <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider', pb: 2 }}>
          <Typography variant="h6" component="div">
            {mode === 'create' ? 'Create New Trip' : `Edit Trip – ${initialData?.tripNumber || ''}`}
          </Typography>
        </DialogTitle>

        <DialogContent dividers sx={{ overflowY: 'auto' }}>
          {loading && (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
              <CircularProgress />
            </Box>
          )}

          {error && !loading && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {!loading && (
            <Box component="form" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
              <Stack spacing={3}>
                {/* Trip Number Display */}
                <TextField
                  fullWidth
                  label="Trip Number"
                  value={form.tripNumber}
                  disabled={mode === 'edit'}
                  size="small"
                  helperText="Auto-generated for new trips"
                />

                {/* Origin and Destination with Swap */}
                <Box sx={{ position: 'relative' }}>
                  <AddressSection 
                    label="Origin"
                    address={origin}
                    onChange={setOrigin}
                    errors={{
                      city: formErrors.originCity
                    }}
                  />
                  
                  <Box sx={{ display: 'flex', justifyContent: 'center', my: -1, position: 'relative', zIndex: 1 }}>
                    <IconButton 
                      onClick={handleSwapLocations}
                      sx={{ bgcolor: 'background.paper', boxShadow: 1 }}
                      size="small"
                    >
                      <SwapHoriz />
                    </IconButton>
                  </Box>
                  
                  <AddressSection 
                    label="Destination"
                    address={destination}
                    onChange={setDestination}
                    errors={{
                      city: formErrors.destinationCity
                    }}
                  />
                </Box>

                {/* Route Preview */}
                {(routePreview || calculatingRoute) && (
                  <Card variant="outlined" sx={{ bgcolor: '#f5f5f5' }}>
                    <CardContent>
                      <Typography variant="subtitle2" gutterBottom>Route Preview</Typography>
                      {calculatingRoute ? (
                        <Box display="flex" alignItems="center" gap={1}>
                          <CircularProgress size={16} />
                          <Typography variant="body2">Calculating route...</Typography>
                        </Box>
                      ) : routePreview && (
                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary">Distance</Typography>
                            <Typography variant="body1">{routePreview.distanceKm} km</Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary">Duration</Typography>
                            <Typography variant="body1">{routePreview.durationHours} hours</Typography>
                          </Grid>
                        </Grid>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Basic Information */}
                <Card variant="outlined">
                  <CardContent>
                    <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                      <Description fontSize="small" />
                      <Typography variant="subtitle1" fontWeight="medium">Basic Information</Typography>
                    </Stack>
                    
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Status</InputLabel>
                          <Select
                            value={form.status}
                            label="Status"
                            onChange={(e) => handleFieldChange('status', e.target.value)}
                          >
                            {STATUS_OPTIONS.map((status) => (
                              <MenuItem key={status} value={status}>{status}</MenuItem>
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
                            {PRIORITY_OPTIONS.map((priority) => (
                              <MenuItem key={priority.value} value={priority.value}>
                                <Chip label={priority.label} size="small" color={priority.color} />
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                {/* Schedule */}
                <Card variant="outlined">
                  <CardContent>
                    <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                      <ScheduleIcon fontSize="small" />
                      <Typography variant="subtitle1" fontWeight="medium">Schedule</Typography>
                    </Stack>
                    
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <DateTimePicker
                          label="Planned Start *"
                          value={form.plannedStartDate}
                          onChange={(value) => handleDateTimeChange('plannedStartDate', value)}
                          slotProps={{
                            textField: {
                              fullWidth: true,
                              size: 'small',
                              error: !!formErrors.plannedStartDate,
                              helperText: formErrors.plannedStartDate
                            }
                          }}
                        />
                      </Grid>
                      
                      <Grid item xs={12} md={6}>
                        <DateTimePicker
                          label="Planned End"
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
                      
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Estimated Duration (hours)"
                          type="number"
                          value={form.estimatedDuration}
                          onChange={(e) => handleFieldChange('estimatedDuration', e.target.value)}
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
                    <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                      <DirectionsCar fontSize="small" />
                      <Typography variant="subtitle1" fontWeight="medium">Assignment</Typography>
                    </Stack>
                    
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Vehicle</InputLabel>
                          <Select
                            value={form.vehicleId}
                            label="Vehicle"
                            onChange={(e) => handleFieldChange('vehicleId', e.target.value)}
                          >
                            <MenuItem value=""><em>No vehicle assigned</em></MenuItem>
                            {vehicles.map((vehicle) => (
                              <MenuItem key={vehicle.id} value={vehicle.id.toString()}>
                                {vehicle.registrationNumber} {vehicle.model && `(${vehicle.model})`}
                              </MenuItem>
                            ))}
                          </Select>
                          <FormHelperText>{vehicles.length} available vehicles</FormHelperText>
                        </FormControl>
                      </Grid>
                      
                      <Grid item xs={12} md={6}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Driver</InputLabel>
                          <Select
                            value={form.driverId}
                            label="Driver"
                            onChange={(e) => handleFieldChange('driverId', e.target.value)}
                          >
                            <MenuItem value=""><em>No driver assigned</em></MenuItem>
                            {drivers.map((driver) => (
                              <MenuItem key={driver.id} value={driver.id.toString()}>
                                {driver.firstName} {driver.lastName}
                              </MenuItem>
                            ))}
                          </Select>
                          <FormHelperText>{drivers.length} available drivers</FormHelperText>
                        </FormControl>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                {/* Cargo Details */}
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight="medium" gutterBottom>Cargo Details</Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          multiline
                          rows={2}
                          label="Cargo Description"
                          value={form.cargoDescription}
                          onChange={(e) => handleFieldChange('cargoDescription', e.target.value)}
                          size="small"
                        />
                      </Grid>
                      
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Cargo Weight (kg)"
                          type="number"
                          value={form.cargoWeight}
                          onChange={(e) => handleFieldChange('cargoWeight', e.target.value)}
                          size="small"
                          InputProps={{ endAdornment: 'kg' }}
                        />
                      </Grid>
                      
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Cargo Value"
                          type="number"
                          value={form.cargoValue}
                          onChange={(e) => handleFieldChange('cargoValue', e.target.value)}
                          size="small"
                          InputProps={{ startAdornment: '$' }}
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                {/* Additional Information */}
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight="medium" gutterBottom>Additional Information</Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          multiline
                          rows={2}
                          label="Special Instructions"
                          value={form.specialInstructions}
                          onChange={(e) => handleFieldChange('specialInstructions', e.target.value)}
                          size="small"
                          placeholder="Any special requirements or instructions..."
                        />
                      </Grid>
                      
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          multiline
                          rows={3}
                          label="Notes"
                          value={form.notes}
                          onChange={(e) => handleFieldChange('notes', e.target.value)}
                          size="small"
                          placeholder="Additional notes or comments..."
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Stack>
            </Box>
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
