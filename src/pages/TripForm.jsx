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
  Schedule as ScheduleIcon,
  DirectionsCar,
  Description,
  LocationOn,
  MyLocation,
  SwapHoriz,
  CheckCircle,
  Scale,
  AttachMoney,
  Comment,
  Assignment,
  TrendingUp,
  LocalGasStation,
  Toll,
  Receipt,
  Security,
  Person,
  History
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

const APPROVAL_STATUS_OPTIONS = [
  'PENDING', 'APPROVED', 'REJECTED', 'UNDER_REVIEW'
];

const TRIP_TYPE_OPTIONS = [
  'FREIGHT',
  'RETURN', 
  'EMPTY',
  'MAINTENANCE'
];

// Commodity/Product Types
const COMMODITY_OPTIONS = [
  'General Freight',
  'Refrigerated Goods',
  'Dangerous Goods',
  'Chemicals',
  'Construction Materials',
  'Agricultural Products',
  'Livestock',
  'Automotive',
  'Electronics',
  'Furniture',
  'Textiles',
  'Pharmaceuticals',
  'Food Products',
  'Beverages',
  'Fuel',
  'Waste Materials',
  'Other'
];

// South African Provinces
const PROVINCES = [
  'Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal',
  'Limpopo', 'Mpumalanga', 'Northern Cape', 'North West', 'Western Cape'
];

// ===================== NEW: Address Validation Helpers =====================
const validateAndFormatAddress = (address) => {
  if (!address) return null;
  
  // Remove extra spaces
  let formatted = address.trim().replace(/\s+/g, ' ');
  
  // Fix common issues with South African addresses
  // Fix "ext" without space
  formatted = formatted.replace(/ext(\d+)/gi, 'Ext $1');
  formatted = formatted.replace(/extension(\d+)/gi, 'Ext $1');
  
  // Fix common misspellings
  formatted = formatted.replace(/\bdriv\b/gi, 'Drive');
  formatted = formatted.replace(/\bdrve\b/gi, 'Drive');
  formatted = formatted.replace(/\bdrv\b/gi, 'Drive');
  formatted = formatted.replace(/\brd\b/gi, 'Road');
  formatted = formatted.replace(/\bst\b/gi, 'Street');
  formatted = formatted.replace(/\bave\b/gi, 'Avenue');
  formatted = formatted.replace(/\bln\b/gi, 'Lane');
  
  // Fix "ponong" - this appears to be a misspelling
  formatted = formatted.replace(/\bponong\b/gi, 'Phoenix');
  
  return formatted;
};

const isAddressComplete = (address) => {
  if (!address) return false;
  
  const parts = address.split(',').map(p => p.trim());
  
  // Need at least street and city
  if (parts.length < 2) return false;
  
  // Check if first part has a number or street identifier
  const hasStreetNumber = /\d/.test(parts[0]);
  const hasStreetName = /[A-Za-z]/.test(parts[0]);
  
  if (!hasStreetNumber || !hasStreetName) return false;
  
  // Check if we have a city/area name
  let hasCity = false;
  for (let i = 1; i < parts.length; i++) {
    if (parts[i].length > 2 && /[A-Za-z]/.test(parts[i]) && !parts[i].match(/^\d+$/)) {
      hasCity = true;
      break;
    }
  }
  
  return hasCity;
};

// Helper function to extract city from address string
const extractCityFromAddress = (address) => {
  if (!address) return '';
  
  const parts = address.split(',').map(p => p.trim());
  
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (part.match(/^\d+/) && part.length < 10) continue;
    if (part.match(/^\d{4}$/)) continue;
    if (PROVINCES.some(p => p.toLowerCase() === part.toLowerCase())) continue;
    if (part.length > 2 && part.match(/[A-Za-z]/)) {
      return part;
    }
  }
  
  if (parts.length >= 2) {
    const candidate = parts[parts.length - 2];
    if (candidate && candidate.length > 2 && !candidate.match(/^\d+$/)) {
      return candidate;
    }
  }
  
  return '';
};

// Helper function to extract zip code from address
const extractZipCodeFromAddress = (address) => {
  if (!address) return '';
  const zipMatch = address.match(/\b\d{4}\b/);
  return zipMatch ? zipMatch[0] : '';
};

// Helper function to extract province from address
const extractProvinceFromAddress = (address) => {
  if (!address) return '';
  for (const province of PROVINCES) {
    if (address.toLowerCase().includes(province.toLowerCase())) {
      return province;
    }
  }
  return '';
};

// Generate unique trip number
const generateUniqueTripNumber = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `TRIP-${year}${month}${day}-${random}`;
};

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

  // Cleanup debounce timer
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
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
    } catch (error) {
      console.error('Error fetching city suggestions:', error);
      setCitySuggestions([]);
    } finally {
      setLoadingCity(false);
    }
  };

  const handleCityInputChange = (event, value) => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    debounceTimer.current = setTimeout(() => {
      fetchCitySuggestions(value);
    }, 300);
  };

  const handleCitySelect = async (event, value) => {
    if (value) {
      const newAddress = { 
        ...address, 
        city: typeof value === 'string' ? value : value.city,
        province: value.province || address.province,
        zipCode: value.zipCode || address.zipCode
      };
      onChange(newAddress);
      
      if (!value.zipCode && value.city) {
        await fetchZipCodeForCity(value.city, value.province, newAddress);
      }
      
      if (address.street) {
        await geocodeAddress({ ...newAddress, street: address.street });
      }
    }
  };

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

  // ===================== UPDATED: geocodeAddress with better validation =====================
  const geocodeAddress = async (addressToGeocode) => {
    // Check if we have minimum required fields
    if (!addressToGeocode.city && !addressToGeocode.street) {
      setGeocodingStatus({ 
        type: 'warning', 
        message: 'Please provide at least street and city' 
      });
      return;
    }
    
    setGeocodingStatus({ type: 'loading', message: 'Validating address...' });
    
    try {
      // Build full address with proper formatting
      let fullAddress = [
        addressToGeocode.street || '',
        addressToGeocode.city || '',
        addressToGeocode.zipCode || '',
        addressToGeocode.province || ''
      ]
      .filter(Boolean)
      .join(', ');
      
      // Validate and format the address
      fullAddress = validateAndFormatAddress(fullAddress);
      
      if (!fullAddress || !isAddressComplete(fullAddress)) {
        setGeocodingStatus({ 
          type: 'warning', 
          message: 'Address appears incomplete. Please check street and city.' 
        });
        return;
      }
      
      console.log(`🔍 Geocoding ${label}:`, fullAddress);
      
      const coords = await routingService.geocodeAddress(fullAddress);
      
      if (coords && coords.lat && coords.lng) {
        onChange({ 
          ...addressToGeocode, 
          latitude: coords.lat, 
          longitude: coords.lng 
        });
        setGeocodingStatus({ 
          type: 'success', 
          message: `Location verified ✓ (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})` 
        });
        if (onGeocode) onGeocode(coords);
        setTimeout(() => setGeocodingStatus(null), 3000);
      } else {
        setGeocodingStatus({ 
          type: 'warning', 
          message: 'Could not verify exact location. Please check the address format or enter coordinates manually.' 
        });
        setTimeout(() => setGeocodingStatus(null), 4000);
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      setGeocodingStatus({ 
        type: 'error', 
        message: `Location validation failed: ${error.message || 'Unknown error'}. Try entering coordinates manually.` 
      });
      setTimeout(() => setGeocodingStatus(null), 5000);
    }
  };

  const handleStreetBlur = () => {
    if (address.street && (address.city || address.zipCode)) {
      geocodeAddress(address);
    }
  };

  const handleZipCodeChange = (value) => {
    onChange({ ...address, zipCode: value });
    if (value.length === 4 && address.city) {
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

          {/* ===================== NEW: Manual coordinate entry ===================== */}
          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
            <Typography variant="caption" color="text.secondary" gutterBottom>
              Manual Coordinates (optional - use if address validation fails)
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
                disabled={disabled}
                InputProps={{
                  inputProps: { step: 'any' }
                }}
              />
              <TextField
                fullWidth
                label="Longitude"
                type="number"
                value={address.longitude || ''}
                onChange={(e) => onChange({ ...address, longitude: parseFloat(e.target.value) || null })}
                size="small"
                placeholder="e.g., 28.2023"
                disabled={disabled}
                InputProps={{
                  inputProps: { step: 'any' }
                }}
              />
            </Stack>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              Enter coordinates manually if address validation keeps failing
            </Typography>
          </Grid>
        </Grid>
        
        {geocodingStatus && (
          <Alert 
            severity={geocodingStatus.type} 
            sx={{ mt: 2 }} 
            icon={geocodingStatus.type === 'loading' ? <CircularProgress size={16} /> : undefined}
            onClose={() => setGeocodingStatus(null)}
          >
            {geocodingStatus.message}
          </Alert>
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
        
        {showMap && address.latitude && address.longitude && (
          <Box sx={{ mt: 2, height: 200, bgcolor: '#f5f5f5', borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              Map view would show location at {address.latitude}, {address.longitude}
            </Typography>
          </Box>
        )}
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
    // Core fields
    tripNumber: '',
    tripType: 'FREIGHT',
    status: 'PLANNED',
    approvalStatus: 'PENDING',
    priority: 'MEDIUM',
    
    // Commodity fields
    commodityType: '',
    cargoDescription: '',
    cargoWeight: '',
    cargoValue: '',
    palletCount: '',
    containerNumber: '',
    
    // Schedule
    plannedStartDate: null,
    plannedEndDate: null,
    estimatedDuration: '',
    plannedDistanceKm: '',
    plannedDurationHours: '',
    
    // Assignment
    vehicleId: '',
    driverId: '',
    supervisorId: '',
    loadId: '',
    
    // Notes
    notes: '',
    specialInstructions: '',
    driverNotes: '',
    referenceNumber: '',
    purchaseOrderNumber: '',
    
    // Financial (planned estimates)
    estimatedTollCost: '',
    estimatedOtherExpenses: '',
    
    // Cancellation
    cancellationReason: ''
  });

  // Load data function - FIXED supervisor loading
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
      
      // Load supervisors - FIXED version
      try {
        const usersResponse = await fetch('/api/users?roles=MANAGER,SUPER_ADMIN');
        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          // Ensure it's an array
          const supervisorsArray = Array.isArray(usersData) ? usersData : 
                                   (usersData.content || usersData.data || []);
          setSupervisors(supervisorsArray);
        } else {
          console.warn('Supervisors endpoint returned:', usersResponse.status);
          setSupervisors([]); // Set empty array on error
        }
      } catch (err) {
        console.warn('Could not load supervisors:', err);
        setSupervisors([]); // Set empty array on error
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
        setOrigin({
          street: '', city: '', zipCode: '', province: '', latitude: null, longitude: null
        });
        setDestination({
          street: '', city: '', zipCode: '', province: '', latitude: null, longitude: null
        });
        setForm({
          tripNumber: generateUniqueTripNumber(),
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
      let originCity = initialData.originCity || '';
      let originZipCode = initialData.originZipCode || '';
      let originProvince = initialData.originProvince || '';
      let originStreet = initialData.originStreetAddress || '';
      
      let destCity = initialData.destinationCity || '';
      let destZipCode = initialData.destinationZipCode || '';
      let destProvince = initialData.destinationProvince || '';
      let destStreet = initialData.destinationStreetAddress || '';
      
      if (!originCity && initialData.originLocation) {
        originCity = extractCityFromAddress(initialData.originLocation);
        originZipCode = originZipCode || extractZipCodeFromAddress(initialData.originLocation);
        originProvince = originProvince || extractProvinceFromAddress(initialData.originLocation);
      }
      
      if (!destCity && initialData.destinationLocation) {
        destCity = extractCityFromAddress(initialData.destinationLocation);
        destZipCode = destZipCode || extractZipCodeFromAddress(initialData.destinationLocation);
        destProvince = destProvince || extractProvinceFromAddress(initialData.destinationLocation);
      }
      
      setOrigin({
        street: originStreet,
        city: originCity,
        zipCode: originZipCode,
        province: originProvince,
        latitude: initialData.originLatitude || null,
        longitude: initialData.originLongitude || null
      });
      
      setDestination({
        street: destStreet,
        city: destCity,
        zipCode: destZipCode,
        province: destProvince,
        latitude: initialData.destinationLatitude || null,
        longitude: initialData.destinationLongitude || null
      });
      
      setForm({
        tripNumber: initialData.tripNumber || generateUniqueTripNumber(),
        tripType: initialData.tripType || 'FREIGHT',
        status: initialData.status || 'PLANNED',
        approvalStatus: initialData.approvalStatus || 'PENDING',
        priority: initialData.priority || 'MEDIUM',
        commodityType: initialData.commodityType || '',
        cargoDescription: initialData.cargoDescription || '',
        cargoWeight: initialData.cargoWeight?.toString() || '',
        cargoValue: initialData.cargoValue?.toString() || '',
        palletCount: initialData.palletCount?.toString() || '',
        containerNumber: initialData.containerNumber || '',
        plannedStartDate: initialData.plannedStartDate ? dayjs(initialData.plannedStartDate) : null,
        plannedEndDate: initialData.plannedEndDate ? dayjs(initialData.plannedEndDate) : null,
        estimatedDuration: initialData.estimatedDuration?.toString() || '',
        plannedDistanceKm: initialData.plannedDistanceKm?.toString() || '',
        plannedDurationHours: initialData.plannedDurationHours?.toString() || '',
        vehicleId: initialData.vehicleId?.toString() || '',
        driverId: initialData.driverId?.toString() || '',
        supervisorId: initialData.supervisorId?.toString() || '',
        loadId: initialData.loadId?.toString() || '',
        notes: initialData.notes || '',
        specialInstructions: initialData.specialInstructions || '',
        driverNotes: initialData.driverNotes || '',
        referenceNumber: initialData.referenceNumber || '',
        purchaseOrderNumber: initialData.purchaseOrderNumber || '',
        estimatedTollCost: initialData.tollCost?.toString() || '',
        estimatedOtherExpenses: initialData.otherExpenses?.toString() || '',
        cancellationReason: initialData.cancellationReason || ''
      });
    } else {
      setForm(prev => ({
        ...prev,
        tripNumber: generateUniqueTripNumber(),
        tripType: 'FREIGHT',
        status: 'PLANNED',
        approvalStatus: 'PENDING',
        priority: 'MEDIUM'
      }));
    }
  }, [open, mode, initialData, loadData]);

  // Calculate route preview
  useEffect(() => {
    const calculatePreview = async () => {
      if (!origin.city || !destination.city) return;
      
      setCalculatingRoute(true);
      try {
        const originAddress = `${origin.street || ''} ${origin.city} ${origin.zipCode || ''} ${origin.province || ''}`.trim();
        const destAddress = `${destination.street || ''} ${destination.city} ${destination.zipCode || ''} ${destination.province || ''}`.trim();
        
        if (originAddress && destAddress) {
          try {
            const route = await routingService.calculateRoute(originAddress, destAddress, 'TRUCK');
            setRoutePreview(route);
            
            if (route?.durationHours && !form.estimatedDuration) {
              setForm(prev => ({ ...prev, estimatedDuration: route.durationHours.toString() }));
            }
            if (route?.distanceKm && !form.plannedDistanceKm) {
              setForm(prev => ({ ...prev, plannedDistanceKm: route.distanceKm.toString() }));
            }
            if (route?.durationHours && !form.plannedDurationHours) {
              setForm(prev => ({ ...prev, plannedDurationHours: route.durationHours.toString() }));
            }
          } catch (routeError) {
            console.error('Route calculation failed:', routeError);
            setRoutePreview(null);
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
  }, [origin.city, destination.city, origin.street, destination.street, origin.zipCode, destination.zipCode, origin.province, destination.province, form.estimatedDuration, form.plannedDistanceKm, form.plannedDurationHours]);

  // ===================== UPDATED: validateForm with address validation =====================
  const validateForm = useCallback(() => {
    const errors = {};
    
    // Required fields based on database schema
    if (!origin.city) {
      errors.originCity = 'Origin city is required';
    }
    
    if (!origin.province) {
      errors.originProvince = 'Origin province is required';
    }
    
    // Validate origin address is complete
    const originAddress = [origin.street, origin.city, origin.zipCode, origin.province].filter(Boolean).join(', ');
    if (!originAddress || originAddress.length < 10) {
      errors.origin = 'Origin address is incomplete. Please provide street and city.';
    }
    
    if (!destination.city) {
      errors.destinationCity = 'Destination city is required';
    }
    
    if (!destination.province) {
      errors.destinationProvince = 'Destination province is required';
    }
    
    // Validate destination address is complete
    const destAddress = [destination.street, destination.city, destination.zipCode, destination.province].filter(Boolean).join(', ');
    if (!destAddress || destAddress.length < 10) {
      errors.destination = 'Destination address is incomplete. Please provide street and city.';
    }
    
    // Check if geocoding was successful (warning only, not blocking)
    if (!origin.latitude || !origin.longitude) {
      errors.originCoordinates = 'Origin location not verified. Please check address or enter coordinates manually.';
    }
    
    if (!destination.latitude || !destination.longitude) {
      errors.destinationCoordinates = 'Destination location not verified. Please check address or enter coordinates manually.';
    }
    
    if (!form.plannedStartDate) {
      errors.plannedStartDate = 'Planned start date is required';
    }
    
    if (form.plannedEndDate && form.plannedStartDate) {
      if (dayjs(form.plannedEndDate).isBefore(form.plannedStartDate)) {
        errors.plannedEndDate = 'End date must be after start date';
      }
    }
    
    if (!form.vehicleId) {
      errors.vehicleId = 'Please select a vehicle/truck';
    }
    
    if (!form.driverId) {
      errors.driverId = 'Please select a driver';
    }
    
    if (!form.commodityType) {
      errors.commodityType = 'Please select commodity type';
    }
    
    if (form.cargoWeight && isNaN(parseFloat(form.cargoWeight))) {
      errors.cargoWeight = 'Weight must be a number';
    }
    
    if (form.cargoValue && isNaN(parseFloat(form.cargoValue))) {
      errors.cargoValue = 'Value must be a number';
    }
    
    if (form.estimatedDuration && isNaN(parseFloat(form.estimatedDuration))) {
      errors.estimatedDuration = 'Duration must be a number';
    }
    
    if (form.plannedDistanceKm && isNaN(parseFloat(form.plannedDistanceKm))) {
      errors.plannedDistanceKm = 'Distance must be a number';
    }
    
    if (form.plannedDurationHours && isNaN(parseFloat(form.plannedDurationHours))) {
      errors.plannedDurationHours = 'Duration must be a number';
    }
    
    return errors;
  }, [origin, destination, form]);

  const handleFieldChange = useCallback((field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  }, [formErrors]);

  const handleDateTimeChange = useCallback((field, value) => {
    setForm(prev => ({ 
      ...prev, 
      [field]: value
    }));
    
    if (field === 'plannedStartDate' && form.plannedEndDate && value) {
      const duration = dayjs(form.plannedEndDate).diff(value, 'hours', true);
      if (duration > 0) {
        const roundedDuration = Math.round(duration * 10) / 10;
        setForm(prev => ({ ...prev, estimatedDuration: roundedDuration.toString() }));
      }
    } else if (field === 'plannedEndDate' && form.plannedStartDate && value) {
      const duration = dayjs(value).diff(form.plannedStartDate, 'hours', true);
      if (duration > 0) {
        const roundedDuration = Math.round(duration * 10) / 10;
        setForm(prev => ({ ...prev, estimatedDuration: roundedDuration.toString() }));
      }
    }
  }, [form.plannedEndDate, form.plannedStartDate]);

  const handleSwapLocations = () => {
    setOrigin(destination);
    setDestination(origin);
  };

  // ===================== UPDATED: handleSubmit with geocoding check =====================
  const handleSubmit = useCallback(async () => {
  // Prevent multiple submissions
  if (submitting) {
    console.log('⚠️ Submission already in progress, ignoring...');
    return;
  }
  
  const errors = validateForm();
  if (Object.keys(errors).length > 0) {
    setFormErrors(errors);
    // Scroll to first error
    const firstErrorField = Object.keys(errors)[0];
    const element = document.querySelector(`[name="${firstErrorField}"]`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    return;
  }
  
  // Check if addresses were geocoded (warning but allow submission if coordinates provided)
  if (!origin.latitude || !origin.longitude) {
    const shouldContinue = window.confirm(
      'Origin location could not be verified. The trip may not be created successfully. Continue anyway?'
    );
    if (!shouldContinue) return;
  }
  
  if (!destination.latitude || !destination.longitude) {
    const shouldContinue = window.confirm(
      'Destination location could not be verified. The trip may not be created successfully. Continue anyway?'
    );
    if (!shouldContinue) return;
  }
  
  setSubmitting(true);
  setError(null);
  setSuccessMessage(null);
  
  try {
    // Debug logging for addresses
    const originFull = [origin.street, origin.city, origin.zipCode, origin.province].filter(Boolean).join(', ');
    const destFull = [destination.street, destination.city, destination.zipCode, destination.province].filter(Boolean).join(', ');
    
    console.log('📍 Origin address:', originFull);
    console.log('📍 Destination address:', destFull);
    console.log('📍 Origin coords:', origin.latitude, origin.longitude);
    console.log('📍 Destination coords:', destination.latitude, destination.longitude);
    
    // ============ FIX: Only send location strings if no coordinates ============
    // Build origin location string ONLY if no coordinates exist
    let originLocation = null;
    if (origin.latitude && origin.longitude) {
      // If we have coordinates, don't send location string that would trigger geocoding
      originLocation = null;
    } else {
      // Only build location string if we need geocoding
      originLocation = [origin.street, origin.city, origin.zipCode, origin.province].filter(Boolean).join(', ');
    }
    
    // Build destination location string ONLY if no coordinates exist
    let destinationLocation = null;
    if (destination.latitude && destination.longitude) {
      destinationLocation = null;
    } else {
      destinationLocation = [destination.street, destination.city, destination.zipCode, destination.province].filter(Boolean).join(', ');
    }
    
    // Build payload WITHOUT tripNumber
    const payload = {
      // ❌ DO NOT INCLUDE tripNumber
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
      loadId: form.loadId ? parseInt(form.loadId, 10) : null,
      
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
      originLatitude: origin.latitude,
      originLongitude: origin.longitude,
      originLocation: originLocation, // Only if no coordinates
      
      destinationStreetAddress: destination.street || null,
      destinationCity: destination.city,
      destinationZipCode: destination.zipCode || null,
      destinationProvince: destination.province || null,
      destinationLatitude: destination.latitude,
      destinationLongitude: destination.longitude,
      destinationLocation: destinationLocation, // Only if no coordinates
      
      notes: form.notes || null,
      specialInstructions: form.specialInstructions || null,
      driverNotes: form.driverNotes || null,
      referenceNumber: form.referenceNumber || null,
      purchaseOrderNumber: form.purchaseOrderNumber || null,
      cancellationReason: form.cancellationReason || null,
      
      auditTrail: JSON.stringify([{
        action: 'CREATED',
        timestamp: new Date().toISOString(),
        details: 'Trip created'
      }]),
      
      incidentsLogged: 0
    };
    
    // Remove any undefined or null values
    Object.keys(payload).forEach(key => {
      if (payload[key] === undefined || payload[key] === null) {
        delete payload[key];
      }
    });
    
    console.log('📤 Creating trip with payload:', payload);
    
    const result = await tripService.createTrip(payload);
    
    console.log('✅ Trip created successfully:', result);
    
    // Show success message
    setSuccessMessage(`Trip ${result.tripNumber} created successfully!`);
    
    // Refresh the trip list if fetchTrips prop is provided
    if (fetchTrips && typeof fetchTrips === 'function') {
      await fetchTrips();
    }
    
    // Call success callback
    if (onSuccess && typeof onSuccess === 'function') {
      onSuccess(result);
    }
    
    // Close the dialog after short delay
    setTimeout(() => {
      if (onClose && typeof onClose === 'function') {
        onClose();
      }
    }, 1500);
    
  } catch (err) {
    console.error('❌ Create trip error:', err);
    
    let errorMessage = 'Failed to create trip';
    
    if (err.response?.status === 409) {
      errorMessage = 'Duplicate trip detected. Please check if this trip already exists.';
    } else if (err.response?.status === 400) {
      errorMessage = err.response.data?.message || 'Invalid data. Please check all fields.';
    } else if (err.response?.status === 403) {
      errorMessage = 'You do not have permission to create trips.';
    } else if (err.response?.status === 500) {
      errorMessage = 'Server error. The address may not be valid. Try entering coordinates manually.';
      if (err.response?.data?.debug?.message) {
        errorMessage += `\nDetails: ${err.response.data.debug.message}`;
      }
    } else {
      errorMessage = err.response?.data?.message || err.message || 'Failed to create trip';
    }
    
    setError(errorMessage);
  } finally {
    setSubmitting(false);
  }
}, [form, origin, destination, validateForm, onSuccess, onClose, fetchTrips, submitting]);

  const handleDialogClose = useCallback((event, reason) => {
    if (reason === 'backdropClick' && submitting) {
      return;
    }
    if (onClose && typeof onClose === 'function') {
      onClose();
    }
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

          {successMessage && !loading && (
            <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccessMessage(null)}>
              {successMessage}
            </Alert>
          )}

          {!loading && (
            <Box>
              <Stack spacing={3}>
                {/* Trip Number & Type */}
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Trip Number"
                      value={form.tripNumber}
                      disabled
                      size="small"
                      helperText="Auto-generated unique trip number (not sent for create)"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Trip Type</InputLabel>
                      <Select
                        value={form.tripType}
                        label="Trip Type"
                        onChange={(e) => handleFieldChange('tripType', e.target.value)}
                      >
                        {TRIP_TYPE_OPTIONS.map((type) => (
                          <MenuItem key={type} value={type}>{type}</MenuItem>
                        ))}
                      </Select>
                      <FormHelperText>FREIGHT = cargo delivery, RETURN = backhaul, EMPTY = repositioning, MAINTENANCE = service run</FormHelperText>
                    </FormControl>
                  </Grid>
                </Grid>

                {/* Origin & Destination */}
                <Box sx={{ position: 'relative' }}>
                  <AddressSection 
                    label="Origin"
                    address={origin}
                    onChange={setOrigin}
                    errors={{ 
                      city: formErrors.originCity,
                      province: formErrors.originProvince 
                    }}
                  />
                  
                  <Box sx={{ display: 'flex', justifyContent: 'center', my: -1, position: 'relative', zIndex: 1 }}>
                    <IconButton onClick={handleSwapLocations} sx={{ bgcolor: 'background.paper', boxShadow: 1 }} size="small">
                      <SwapHoriz />
                    </IconButton>
                  </Box>
                  
                  <AddressSection 
                    label="Destination"
                    address={destination}
                    onChange={setDestination}
                    errors={{ 
                      city: formErrors.destinationCity,
                      province: formErrors.destinationProvince 
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
                            <Typography variant="body1" fontWeight="bold">{routePreview.distanceKm} km</Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary">Est. Duration</Typography>
                            <Typography variant="body1" fontWeight="bold">{routePreview.durationHours} hours</Typography>
                          </Grid>
                        </Grid>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Schedule */}
                <Card variant="outlined">
                  <CardContent>
                    <Stack direction="row" alignItems="center" spacing={1} mb={2}>
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
                          label="Estimated Duration (hours)"
                          type="number"
                          value={form.estimatedDuration}
                          onChange={(e) => handleFieldChange('estimatedDuration', e.target.value)}
                          size="small"
                          InputProps={{ endAdornment: 'hrs' }}
                          helperText="Auto-calculated from start/end dates"
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
                          helperText="From route calculation"
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
                          helperText="Including stops"
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                {/* Assignment - Truck, Driver & Supervisor */}
                <Card variant="outlined">
                  <CardContent>
                    <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                      <DirectionsCar fontSize="small" color="primary" />
                      <Typography variant="subtitle1" fontWeight="medium">Assignment</Typography>
                    </Stack>
                    
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={4}>
                        <FormControl fullWidth size="small" required error={!!formErrors.vehicleId}>
                          <InputLabel>Truck / Vehicle *</InputLabel>
                          <Select
                            value={form.vehicleId}
                            label="Truck / Vehicle *"
                            onChange={(e) => handleFieldChange('vehicleId', e.target.value)}
                          >
                            <MenuItem value=""><em>Select a vehicle</em></MenuItem>
                            {vehicles.map((vehicle) => (
                              <MenuItem key={vehicle.id} value={vehicle.id.toString()}>
                                {vehicle.registrationNumber} - {vehicle.make} {vehicle.model} 
                                {vehicle.capacityKg ? ` (${vehicle.capacityKg}kg)` : ''}
                              </MenuItem>
                            ))}
                          </Select>
                          {formErrors.vehicleId && <FormHelperText error>{formErrors.vehicleId}</FormHelperText>}
                          <FormHelperText>{vehicles.length} available vehicles</FormHelperText>
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
                            <MenuItem value=""><em>Select a driver</em></MenuItem>
                            {drivers.map((driver) => (
                              <MenuItem key={driver.id} value={driver.id.toString()}>
                                {driver.firstName} {driver.lastName} 
                                {driver.licenseNumber ? ` - ${driver.licenseNumber}` : ''}
                              </MenuItem>
                            ))}
                          </Select>
                          {formErrors.driverId && <FormHelperText error>{formErrors.driverId}</FormHelperText>}
                          <FormHelperText>{drivers.length} available drivers</FormHelperText>
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
                            <MenuItem value=""><em>Select supervisor (optional)</em></MenuItem>
                            {supervisors.map((supervisor) => (
                              <MenuItem key={supervisor.id} value={supervisor.id.toString()}>
                                {supervisor.firstName} {supervisor.lastName} - {supervisor.role}
                              </MenuItem>
                            ))}
                          </Select>
                          <FormHelperText>Approving authority for this trip</FormHelperText>
                        </FormControl>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                {/* Commodity & Cargo */}
                <Card variant="outlined">
                  <CardContent>
                    <Stack direction="row" alignItems="center" spacing={1} mb={2}>
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
                            <MenuItem value=""><em>Select commodity type</em></MenuItem>
                            {COMMODITY_OPTIONS.map((commodity) => (
                              <MenuItem key={commodity} value={commodity}>{commodity}</MenuItem>
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
                          placeholder="Describe the cargo"
                        />
                      </Grid>
                      
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          label="Tonnage / Weight (kg)"
                          type="number"
                          value={form.cargoWeight}
                          onChange={(e) => handleFieldChange('cargoWeight', e.target.value)}
                          size="small"
                          InputProps={{ startAdornment: <Scale fontSize="small" />, endAdornment: 'kg' }}
                          placeholder="e.g., 15000"
                        />
                      </Grid>
                      
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          label="Cargo Value (ZAR)"
                          type="number"
                          value={form.cargoValue}
                          onChange={(e) => handleFieldChange('cargoValue', e.target.value)}
                          size="small"
                          InputProps={{ startAdornment: <AttachMoney fontSize="small" /> }}
                          placeholder="Insurance value"
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
                      
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Container Number"
                          value={form.containerNumber}
                          onChange={(e) => handleFieldChange('containerNumber', e.target.value)}
                          size="small"
                          placeholder="e.g., MSCU1234567"
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                {/* Financial Estimates */}
                <Card variant="outlined">
                  <CardContent>
                    <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                      <Receipt fontSize="small" color="primary" />
                      <Typography variant="subtitle1" fontWeight="medium">Financial Estimates</Typography>
                    </Stack>
                    
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Estimated Toll Cost (ZAR)"
                          type="number"
                          value={form.estimatedTollCost}
                          onChange={(e) => handleFieldChange('estimatedTollCost', e.target.value)}
                          size="small"
                          InputProps={{ startAdornment: <Toll fontSize="small" /> }}
                          placeholder="e.g., 1250"
                        />
                      </Grid>
                      
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Estimated Other Expenses (ZAR)"
                          type="number"
                          value={form.estimatedOtherExpenses}
                          onChange={(e) => handleFieldChange('estimatedOtherExpenses', e.target.value)}
                          size="small"
                          InputProps={{ startAdornment: <AttachMoney fontSize="small" /> }}
                          placeholder="Meals, accommodation, etc."
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                {/* Notes & Comments */}
                <Card variant="outlined">
                  <CardContent>
                    <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                      <Comment fontSize="small" color="primary" />
                      <Typography variant="subtitle1" fontWeight="medium">Notes & Comments</Typography>
                    </Stack>
                    
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Reference Number"
                          value={form.referenceNumber}
                          onChange={(e) => handleFieldChange('referenceNumber', e.target.value)}
                          size="small"
                          placeholder="Your reference #"
                        />
                      </Grid>
                      
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Purchase Order Number"
                          value={form.purchaseOrderNumber}
                          onChange={(e) => handleFieldChange('purchaseOrderNumber', e.target.value)}
                          size="small"
                          placeholder="PO #"
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
                          placeholder="Loading/unloading instructions, access codes, contact persons..."
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
                          placeholder="Instructions specific to the driver..."
                        />
                      </Grid>
                      
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          multiline
                          rows={2}
                          label="Additional Notes"
                          value={form.notes}
                          onChange={(e) => handleFieldChange('notes', e.target.value)}
                          size="small"
                          placeholder="Any other relevant information..."
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                {/* Status & Priority & Approval */}
                <Card variant="outlined">
                  <CardContent>
                    <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                      <Assignment fontSize="small" color="primary" />
                      <Typography variant="subtitle1" fontWeight="medium">Status & Priority</Typography>
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
                            {STATUS_OPTIONS.map((status) => (
                              <MenuItem key={status} value={status}>{status}</MenuItem>
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
                            {APPROVAL_STATUS_OPTIONS.map((status) => (
                              <MenuItem key={status} value={status}>{status}</MenuItem>
                            ))}
                          </Select>
                          <FormHelperText>PENDING = awaiting supervisor approval</FormHelperText>
                        </FormControl>
                      </Grid>
                      
                      <Grid item xs={12} md={4}>
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
                      
                      {form.status === 'CANCELLED' && (
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            label="Cancellation Reason"
                            value={form.cancellationReason}
                            onChange={(e) => handleFieldChange('cancellationReason', e.target.value)}
                            size="small"
                            multiline
                            rows={2}
                            placeholder="Why was this trip cancelled?"
                          />
                        </Grid>
                      )}
                    </Grid>
                  </CardContent>
                </Card>
              </Stack>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ borderTop: 1, borderColor: 'divider', p: 2 }}>
          <Button startIcon={<Close />} onClick={handleDialogClose} disabled={submitting}>
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
