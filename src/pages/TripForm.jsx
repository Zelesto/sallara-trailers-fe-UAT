// src/pages/TripForm.jsx (Updated with enum_master integration)
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
  InputAdornment,
  FormControlLabel,
  Checkbox,
  Tooltip,
  IconButton as MuiIconButton
} from '@mui/material';

import {
  Save,
  Close,
  Assignment as AssignmentIcon,
  Schedule as ScheduleIcon,
  DirectionsCar,
  Description,
  LocationOn,
  SwapHoriz,
  Scale,
  AttachMoney,
  Comment,
  Toll,
  Receipt,
  Business as BusinessIcon,
  Warehouse as WarehouseIcon,
  Route as RouteIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  Edit as EditIcon
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
import { customerService } from '../services/customerService';
import { depotService } from '../services/depotService';
import { enumService } from '../services/enumService';
import { formStyles } from '../styles/theme';

/* ============================================================
   CONSTANTS & CONFIGURATIONS
   ============================================================ */

const PRIORITY_OPTIONS = [
  { value: 'LOW', label: 'Low', color: 'success' },
  { value: 'MEDIUM', label: 'Medium', color: 'warning' },
  { value: 'HIGH', label: 'High', color: 'error' },
  { value: 'URGENT', label: 'Urgent', color: 'error' }
];

// Fallback options if enum_master fails to load
const FALLBACK_STATUS_OPTIONS = [
  { code: 'DRAFT', displayName: 'Draft' },
  { code: 'PLANNED', displayName: 'Planned' },
  { code: 'ASSIGNED', displayName: 'Assigned' },
  { code: 'IN_PROGRESS', displayName: 'In Progress' },
  { code: 'COMPLETED', displayName: 'Completed' },
  { code: 'ACTIVE', displayName: 'Active' },
  { code: 'PENDING', displayName: 'Pending' },
  { code: 'CANCELLED', displayName: 'Cancelled' },
  { code: 'CLOSED', displayName: 'Closed' },
  { code: 'FINALIZED', displayName: 'Finalized' }
];

const FALLBACK_APPROVAL_STATUS_OPTIONS = [
  { code: 'PENDING', displayName: 'Pending' },
  { code: 'APPROVED', displayName: 'Approved' },
  { code: 'REJECTED', displayName: 'Rejected' },
  { code: 'UNDER_REVIEW', displayName: 'Under Review' }
];

const FALLBACK_TRIP_TYPE_OPTIONS = [
  { code: 'FREIGHT', displayName: 'Freight' },
  { code: 'RETURN', displayName: 'Return' },
  { code: 'EMPTY', displayName: 'Empty' },
  { code: 'MAINTENANCE', displayName: 'Maintenance' },
  { code: 'DEDICATED', displayName: 'Dedicated' },
  { code: 'EXPRESS', displayName: 'Express' },
  { code: 'CONSOLIDATED', displayName: 'Consolidated' }
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

const DEPARTURE_OPTIONS = [
  { value: 'DEPOT', label: 'Depot' },
  { value: 'LAST_DROP', label: 'Last Drop Off Location' },
  { value: 'FREEHAND', label: 'Freehand / Custom Location' }
];

/* ============================================================
   HELPER FUNCTIONS
   ============================================================ */

const formatDateForAPI = (date) => {
  if (!date) return null;
  if (dayjs.isDayjs(date)) return date.format('YYYY-MM-DDTHH:mm:ss');
  return dayjs(date).format('YYYY-MM-DDTHH:mm:ss');
};

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

const buildAddress = (address) => {
  const parts = [address.street, address.city, address.zipCode, address.province]
    .filter(Boolean);
  return parts.join(', ');
};

const getDefaultFormState = () => ({
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
  customerId: '',
  loadId: '',
  notes: '',
  specialInstructions: '',
  driverNotes: '',
  referenceNumber: '',
  purchaseOrderNumber: '',
  estimatedTollCost: '',
  estimatedOtherExpenses: '',
  cancellationReason: '',
  departureLocation: '',
});

const getDefaultAddress = () => ({
  street: '', city: '', zipCode: '', province: '', latitude: null, longitude: null
});

/* ============================================================
   COMPONENT: EnumSelect
   ============================================================ */

function EnumSelect({ 
  moduleName, 
  category, 
  value, 
  onChange, 
  label, 
  required = false,
  error = false,
  helperText = '',
  disabled = false,
  showRefresh = false,
  onRefresh,
  loading = false,
  ...props 
}) {
  const [options, setOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(loading);
  const [localError, setLocalError] = useState(null);

  useEffect(() => {
    loadOptions();
  }, [moduleName, category]);

  const loadOptions = useCallback(async () => {
    if (!moduleName || !category) return;
    
    setIsLoading(true);
    setLocalError(null);
    
    try {
      const data = await enumService.getEnums(moduleName, category);
      // Filter only active enums and format for display
      const activeOptions = data
        .filter(item => item.isActive)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map(item => ({
          code: item.code,
          displayName: item.displayName,
          isDefault: item.isDefault,
          colorCode: item.colorCode,
          iconName: item.iconName,
          description: item.description
        }));
      
      setOptions(activeOptions);
      
      // Auto-select default if no value and there's a default
      if (!value && activeOptions.length > 0) {
        const defaultOption = activeOptions.find(opt => opt.isDefault);
        if (defaultOption && onChange) {
          onChange(defaultOption.code);
        }
      }
    } catch (err) {
      console.error(`Failed to load ${moduleName}/${category} enums:`, err);
      setLocalError('Failed to load options');
      // Use fallback options
      setOptions(getFallbackOptions(moduleName, category));
    } finally {
      setIsLoading(false);
    }
  }, [moduleName, category, value, onChange]);

  const getFallbackOptions = (module, cat) => {
    if (module === 'trip' && cat === 'status') {
      return FALLBACK_STATUS_OPTIONS;
    } else if (module === 'trip' && cat === 'approval') {
      return FALLBACK_APPROVAL_STATUS_OPTIONS;
    } else if (module === 'trip' && cat === 'type') {
      return FALLBACK_TRIP_TYPE_OPTIONS;
    }
    return [];
  };

  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    } else {
      loadOptions();
    }
  };

  return (
    <FormControl fullWidth size="small" required={required} error={error || !!localError} disabled={disabled || isLoading}>
      <InputLabel sx={{ fontSize: '0.75rem' }}>
        {label || `${category.charAt(0).toUpperCase() + category.slice(1)}`}
      </InputLabel>
      <Select
        value={value || ''}
        label={label || `${category.charAt(0).toUpperCase() + category.slice(1)}`}
        onChange={(e) => onChange(e.target.value)}
        sx={{ fontSize: '0.75rem' }}
        endAdornment={
          showRefresh ? (
            <InputAdornment position="end">
              <IconButton 
                size="small" 
                onClick={handleRefresh}
                disabled={isLoading}
                sx={{ mr: 2 }}
              >
                {isLoading ? <CircularProgress size={16} /> : <RefreshIcon fontSize="small" />}
              </IconButton>
            </InputAdornment>
          ) : undefined
        }
        {...props}
      >
        <MenuItem value="" sx={{ fontSize: '0.75rem' }}>
          <em>Select {category}</em>
        </MenuItem>
        {options.map((option) => (
          <MenuItem key={option.code} value={option.code} sx={{ fontSize: '0.75rem' }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              {option.colorCode && (
                <Box 
                  sx={{ 
                    width: 12, 
                    height: 12, 
                    borderRadius: '50%', 
                    backgroundColor: option.colorCode,
                    border: '1px solid rgba(0,0,0,0.1)'
                  }} 
                />
              )}
              <Typography sx={{ fontSize: '0.75rem' }}>
                {option.displayName || option.code}
              </Typography>
              {option.isDefault && (
                <Chip 
                  label="Default" 
                  size="small" 
                  color="primary" 
                  variant="outlined"
                  sx={{ height: 18, fontSize: '0.55rem' }}
                />
              )}
            </Stack>
          </MenuItem>
        ))}
      </Select>
      {helperText && <FormHelperText sx={{ fontSize: '0.65rem' }}>{helperText}</FormHelperText>}
      {localError && <FormHelperText error sx={{ fontSize: '0.65rem' }}>{localError}</FormHelperText>}
    </FormControl>
  );
}

/* ============================================================
   COMPONENT: AddressSection
   ============================================================ */

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
    <Card {...formStyles.card}>
      <CardContent {...formStyles.cardContent}>
        <Stack {...formStyles.sectionHeader}>
          <LocationOn fontSize="small" color="primary" sx={formStyles.icon} />
          <Typography variant="subtitle2" fontWeight="600" sx={{ fontSize: '0.8rem' }}>
            {label}
          </Typography>
          {address.latitude && address.longitude && (
            <Chip 
              size="small" 
              label="📍 Geocoded" 
              color="success" 
              variant="outlined"
              sx={{ height: 20, fontSize: '0.6rem' }}
            />
          )}
        </Stack>

        <Grid container spacing={1.5}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Street Address"
              value={address.street || ''}
              onChange={(e) => onChange({ ...address, street: e.target.value })}
              size="small"
              placeholder="e.g., 16275 Imbuzana Street"
              disabled={disabled}
              sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
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
                  sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
                />
              )}
              renderOption={(props, option) => (
                <li {...props}>
                  <Box>
                    <Typography sx={{ fontSize: '0.75rem' }}>{option.city}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
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
              sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
            />
          </Grid>

          <Grid item xs={6} md={3}>
            <FormControl fullWidth size="small" error={!!errors.province}>
              <InputLabel sx={{ fontSize: '0.75rem' }}>Province</InputLabel>
              <Select
                value={address.province || ''}
                label="Province"
                onChange={(e) => onChange({ ...address, province: e.target.value })}
                disabled={disabled}
                sx={{ fontSize: '0.75rem' }}
              >
                <MenuItem value="" sx={{ fontSize: '0.75rem' }}>Select province</MenuItem>
                {PROVINCES.map(p => (
                  <MenuItem key={p} value={p} sx={{ fontSize: '0.75rem' }}>{p}</MenuItem>
                ))}
              </Select>
              {errors.province && <FormHelperText sx={{ fontSize: '0.65rem' }}>{errors.province}</FormHelperText>}
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 0.75 }} />
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
              Coordinates (optional)
            </Typography>
            <Stack direction="row" spacing={1.5} sx={{ mt: 0.75 }}>
              <TextField
                fullWidth
                label="Latitude"
                type="number"
                value={address.latitude || ''}
                onChange={(e) => onChange({ ...address, latitude: parseFloat(e.target.value) || null })}
                size="small"
                placeholder="e.g., -26.3378"
                InputProps={{ inputProps: { step: 'any' } }}
                sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
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
                sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
              />
            </Stack>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}

/* ============================================================
   COMPONENT: DepotSection
   ============================================================ */

function DepotSection({ 
  depots, 
  selectedDepot, 
  onDepotSelect, 
  departureType, 
  onDepartureTypeChange, 
  departureLocation,
  onLocationChange 
}) {
  return (
    <Card {...formStyles.card}>
      <CardContent {...formStyles.cardContent}>
        <Stack {...formStyles.sectionHeader}>
          <WarehouseIcon fontSize="small" color="primary" sx={formStyles.icon} />
          <Typography variant="subtitle2" fontWeight="600" sx={{ fontSize: '0.8rem' }}>
            Depot & Departure
          </Typography>
        </Stack>

        <Grid container spacing={1.5}>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ fontSize: '0.75rem' }}>Departed From</InputLabel>
              <Select
                value={departureType}
                label="Departed From"
                onChange={(e) => onDepartureTypeChange(e.target.value)}
                sx={{ fontSize: '0.75rem' }}
              >
                {DEPARTURE_OPTIONS.map(option => (
                  <MenuItem key={option.value} value={option.value} sx={{ fontSize: '0.75rem' }}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {departureType === 'DEPOT' && (
            <>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel sx={{ fontSize: '0.75rem' }}>Select Depot</InputLabel>
                  <Select
                    value={selectedDepot?.id || ''}
                    label="Select Depot"
                    onChange={(e) => {
                      const depot = depots.find(d => d.id === e.target.value);
                      onDepotSelect(depot);
                    }}
                    sx={{ fontSize: '0.75rem' }}
                  >
                    <MenuItem value="" sx={{ fontSize: '0.75rem' }}>
                      <em>Select depot</em>
                    </MenuItem>
                    {depots.map(depot => (
                      <MenuItem key={depot.id} value={depot.id} sx={{ fontSize: '0.75rem' }}>
                        {depot.name} ({depot.depotCode})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {selectedDepot && (
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Depot Address"
                    value={selectedDepot.fullAddress || ''}
                    size="small"
                    disabled
                    sx={{ 
                      '& .MuiInputLabel-root': { fontSize: '0.75rem' },
                      '& .MuiInputBase-root': { fontSize: '0.75rem' }
                    }}
                  />
                </Grid>
              )}
            </>
          )}

          {departureType === 'FREEHAND' && (
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                label="Departure Location (Freehand)"
                value={departureLocation || ''}
                onChange={(e) => onLocationChange(e.target.value)}
                size="small"
                placeholder="Enter custom departure location..."
                sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
              />
            </Grid>
          )}

          {departureType === 'LAST_DROP' && (
            <Grid item xs={12} md={8}>
              <Alert severity="info" sx={{ fontSize: '0.75rem' }}>
                Vehicle departs from the last drop-off location of the previous trip.
                Distance will be calculated based on the previous trip's destination.
              </Alert>
            </Grid>
          )}
        </Grid>
      </CardContent>
    </Card>
  );
}

/* ============================================================
   MAIN COMPONENT: TripForm
   ============================================================ */

function TripForm({ open = false, onClose, mode = 'create', initialData, onSuccess, fetchTrips }) {
  // Loading States
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [calculatingDistance, setCalculatingDistance] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Data States
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [depots, setDepots] = useState([]);

  // Enum loading state
  const [enumsLoading, setEnumsLoading] = useState(false);

  // Address States
  const [origin, setOrigin] = useState(getDefaultAddress);
  const [destination, setDestination] = useState(getDefaultAddress);

  // Depot Tracking States
  const [departureType, setDepartureType] = useState('DEPOT');
  const [selectedDepot, setSelectedDepot] = useState(null);
  const [departureLocation, setDepartureLocation] = useState('');
  const [fromDepotKm, setFromDepotKm] = useState('');
  const [toDepotKm, setToDepotKm] = useState('');
  const [isFromDepot, setIsFromDepot] = useState(false);

  // Form State
  const [form, setForm] = useState(getDefaultFormState);

  // Ref for enum refresh
  const enumRefreshRef = useRef({});

  /* ============================================================
     DATA LOADING
   ============================================================ */

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [vRes, dRes, cRes, depotRes] = await Promise.all([
        vehicleService.getAllVehicles().catch(() => []),
        driverService.getAllDrivers().catch(() => []),
        customerService.getActiveCustomers().catch(() => []),
        depotService.getAllDepots().catch(() => [])
      ]);

      setVehicles(filterActiveVehicles(vRes));
      setDrivers(filterAvailableDrivers(dRes));
      setCustomers(Array.isArray(cRes) ? cRes : (cRes?.content || []));
      setDepots(Array.isArray(depotRes) ? depotRes : (depotRes?.content || []));

      try {
        const usersResponse = await fetch('/api/users?roles=MANAGER,SUPER_ADMIN');
        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          setSupervisors(Array.isArray(usersData) ? usersData : (usersData.content || usersData.data || []));
        }
      } catch {
        setSupervisors([]);
      }
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Failed to load vehicles, drivers, or customers');
    } finally {
      setLoading(false);
    }
  }, []);

  /* ============================================================
     DISTANCE CALCULATION
   ============================================================ */

  const calculateDistanceFromDepot = useCallback(async () => {
    if (!selectedDepot || !origin.city) {
      setFromDepotKm('');
      return;
    }

    if (selectedDepot.latitude && selectedDepot.longitude) {
      const originAddress = buildAddress(origin);
      try {
        setCalculatingDistance(true);
        const result = await routingService.calculateDistance(
          `${selectedDepot.latitude},${selectedDepot.longitude}`,
          originAddress
        );
        if (result?.distance) {
          setFromDepotKm(result.distance.toFixed(1));
        }
      } catch (error) {
        console.error('Failed to calculate depot distance:', error);
        setFromDepotKm('');
      } finally {
        setCalculatingDistance(false);
      }
    }
  }, [selectedDepot, origin]);

  const calculateDistanceToDepot = useCallback(async () => {
    if (!selectedDepot || !destination.city) {
      setToDepotKm('');
      return;
    }

    if (selectedDepot.latitude && selectedDepot.longitude) {
      const destAddress = buildAddress(destination);
      try {
        setCalculatingDistance(true);
        const result = await routingService.calculateDistance(
          destAddress,
          `${selectedDepot.latitude},${selectedDepot.longitude}`
        );
        if (result?.distance) {
          setToDepotKm(result.distance.toFixed(1));
        }
      } catch (error) {
        console.error('Failed to calculate depot distance:', error);
        setToDepotKm('');
      } finally {
        setCalculatingDistance(false);
      }
    }
  }, [selectedDepot, destination]);

  // Recalculate distances when origin/destination changes
  useEffect(() => {
    if (departureType === 'DEPOT' && selectedDepot) {
      calculateDistanceFromDepot();
      calculateDistanceToDepot();
    }
  }, [origin, destination, selectedDepot, departureType, calculateDistanceFromDepot, calculateDistanceToDepot]);

  /* ============================================================
     FORM RESET & POPULATION
   ============================================================ */

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      const timer = setTimeout(() => {
        setOrigin(getDefaultAddress);
        setDestination(getDefaultAddress);
        setDepartureType('DEPOT');
        setSelectedDepot(null);
        setDepartureLocation('');
        setFromDepotKm('');
        setToDepotKm('');
        setIsFromDepot(false);
        setForm(getDefaultFormState);
        setFormErrors({});
        setError(null);
        setSuccessMessage(null);
        setIsSuccess(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Load data on open
  useEffect(() => {
    if (!open) return;
    loadData();
  }, [open, loadData]);

  // Populate form with initial data when editing
  useEffect(() => {
    if (initialData && open) {
      console.log('🔍 Populating form with initial data:', initialData);
      
      setForm(prev => ({
        ...prev,
        ...initialData,
        vehicleId: initialData.vehicleId || '',
        driverId: initialData.driverId || '',
        supervisorId: initialData.supervisorId || '',
        customerId: initialData.customerId || '',
        referenceNumber: initialData.referenceNumber || '',
      }));

      if (initialData.departedFrom) setDepartureType(initialData.departedFrom);
      if (initialData.departureLocation) setDepartureLocation(initialData.departureLocation);
      if (initialData.fromDepotKm) setFromDepotKm(initialData.fromDepotKm);
      if (initialData.toDepotKm) setToDepotKm(initialData.toDepotKm);
      if (initialData.isFromDepot !== undefined) setIsFromDepot(initialData.isFromDepot);

      if (initialData.originLocation) {
        setOrigin({
          street: initialData.originStreetAddress || '',
          city: initialData.originCity || '',
          zipCode: initialData.originZipCode || '',
          province: initialData.originProvince || '',
          latitude: initialData.originLatitude || null,
          longitude: initialData.originLongitude || null,
        });
      }
      if (initialData.destinationLocation) {
        setDestination({
          street: initialData.destinationStreetAddress || '',
          city: initialData.destinationCity || '',
          zipCode: initialData.destinationZipCode || '',
          province: initialData.destinationProvince || '',
          latitude: initialData.destinationLatitude || null,
          longitude: initialData.destinationLongitude || null,
        });
      }
    }
  }, [initialData, open]);

  /* ============================================================
     FORM VALIDATION
   ============================================================ */

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

  /* ============================================================
     EVENT HANDLERS
   ============================================================ */

  const handleFieldChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleDateTimeChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSwapLocations = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };

  const handleDepartureTypeChange = (value) => {
    setDepartureType(value);
    if (value !== 'DEPOT') {
      setSelectedDepot(null);
      setFromDepotKm('');
      setToDepotKm('');
    }
  };

  const handleDepotSelect = (depot) => {
    setSelectedDepot(depot);
    if (depot) {
      setFromDepotKm('');
      setToDepotKm('');
    }
  };

  /* ============================================================
     FORM SUBMISSION
   ============================================================ */

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
    setIsSuccess(false);

    try {
      const originAddress = buildAddress(origin);
      const destAddress = buildAddress(destination);

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
        customerId: form.customerId ? parseInt(form.customerId, 10) : null,

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

        fromDepotKm: fromDepotKm ? parseFloat(fromDepotKm) : null,
        toDepotKm: toDepotKm ? parseFloat(toDepotKm) : null,
        departedFrom: departureType,
        departureLocation: departureType === 'FREEHAND' ? departureLocation : null,
        isFromDepot: isFromDepot,

        notes: form.notes || null,
        specialInstructions: form.specialInstructions || null,
        driverNotes: form.driverNotes || null,
        referenceNumber: form.referenceNumber || null,
        purchaseOrderNumber: form.purchaseOrderNumber || null,
        cancellationReason: form.cancellationReason || null
      };

      // Remove empty values
      Object.keys(payload).forEach(key => {
        if (payload[key] === undefined || payload[key] === null || payload[key] === '') {
          delete payload[key];
        }
      });

      console.log(`📤 ${mode === 'edit' ? 'Updating' : 'Creating'} trip:`, payload);

      let result;
      if (mode === 'edit' && initialData?.id) {
        result = await tripService.updateTrip(initialData.id, payload);
        console.log('✅ Trip updated successfully:', result);
        setSuccessMessage(`Trip ${result.tripNumber} updated successfully!`);
      } else {
        result = await tripService.createTrip(payload);
        console.log('✅ Trip created successfully:', result);
        setSuccessMessage(`Trip ${result.tripNumber} created successfully!`);
      }

      setIsSuccess(true);

      if (onSuccess) {
        onSuccess(result);
      }

      if (fetchTrips) {
        await new Promise(resolve => setTimeout(resolve, 500));
        await fetchTrips();
      }

      setTimeout(() => {
        if (onClose) onClose();
      }, 1500);

    } catch (err) {
      console.error('❌ Trip error:', err);
      let errorMessage = mode === 'edit' ? 'Failed to update trip' : 'Failed to create trip';

      if (err.response?.status === 404) {
        if (err.response?.data?.detail?.includes('Trip not found')) {
          console.warn('⚠️ Trip was created but not found on refresh - race condition');
          setSuccessMessage('Trip created successfully!');
          setIsSuccess(true);
          setTimeout(() => {
            if (onClose) onClose();
          }, 1500);
          setSubmitting(false);
          return;
        }
        errorMessage = 'Resource not found. The trip may have been created but is not yet available.';
      } else if (err.response?.status === 409) {
        errorMessage = 'Duplicate trip detected.';
      } else if (err.response?.status === 400) {
        errorMessage = err.response.data?.message || 'Invalid data. Please check all fields.';
      } else if (err.response?.status === 429) {
        errorMessage = 'Rate limit exceeded. Trip saved, coordinates will update later.';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  }, [form, origin, destination, fromDepotKm, toDepotKm, departureType, departureLocation, isFromDepot, validateForm, onSuccess, onClose, fetchTrips, submitting, mode, initialData]);

  /* ============================================================
     RENDER HELPERS
   ============================================================ */

  const renderLoading = () => (
    <Box display="flex" justifyContent="center" p={3}>
      <CircularProgress size={30} />
    </Box>
  );

  const renderError = () => error && (
    <Alert severity="error" sx={{ mb: 2, fontSize: '0.8rem' }} onClose={() => setError(null)}>
      {error}
    </Alert>
  );

  const renderSuccess = () => successMessage && (
    <Alert severity="success" sx={{ mb: 2, fontSize: '0.8rem' }} onClose={() => setSuccessMessage(null)}>
      {successMessage}
    </Alert>
  );

  /* ============================================================
     MAIN RENDER
   ============================================================ */

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Dialog 
        open={open} 
        onClose={onClose} 
        maxWidth="lg" 
        fullWidth
        PaperProps={{ sx: { maxHeight: '90vh' } }}
      >
        <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider', py: 1.5, px: 2 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
              {mode === 'create' ? 'Create New Trip' : 'Edit Trip'}
            </Typography>
            {enumsLoading && <CircularProgress size={20} />}
          </Stack>
        </DialogTitle>

        <DialogContent dividers sx={{ overflowY: 'auto', p: 2 }}>
          {loading ? renderLoading() : (
            <>
              {renderError()}
              {renderSuccess()}

              <Stack spacing={2}>
                {/* Trip Type & Priority */}
                <Grid container spacing={1.5}>
                  <Grid item xs={12} md={6}>
                    <EnumSelect
                      moduleName="trip"
                      category="type"
                      value={form.tripType}
                      onChange={(value) => handleFieldChange('tripType', value)}
                      label="Trip Type"
                      required
                      showRefresh
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth size="small">
                      <InputLabel sx={{ fontSize: '0.75rem' }}>Priority</InputLabel>
                      <Select
                        value={form.priority}
                        label="Priority"
                        onChange={(e) => handleFieldChange('priority', e.target.value)}
                        sx={{ fontSize: '0.75rem' }}
                      >
                        {PRIORITY_OPTIONS.map(p => (
                          <MenuItem key={p.value} value={p.value} sx={{ fontSize: '0.75rem' }}>
                            <Chip 
                              label={p.label} 
                              size="small" 
                              color={p.color} 
                              sx={{ height: 20, fontSize: '0.6rem' }}
                            />
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>

                {/* Customer Selection */}
                <Card {...formStyles.card}>
                  <CardContent {...formStyles.cardContent}>
                    <Stack {...formStyles.sectionHeader}>
                      <BusinessIcon fontSize="small" color="primary" sx={formStyles.icon} />
                      <Typography variant="subtitle2" fontWeight="600" sx={{ fontSize: '0.8rem' }}>
                        Customer
                      </Typography>
                    </Stack>
                    <FormControl fullWidth size="small">
                      <InputLabel sx={{ fontSize: '0.75rem' }}>Select Customer</InputLabel>
                      <Select
                        value={form.customerId}
                        label="Select Customer"
                        onChange={(e) => handleFieldChange('customerId', e.target.value)}
                        sx={{ fontSize: '0.75rem' }}
                      >
                        <MenuItem value="" sx={{ fontSize: '0.75rem' }}>No Customer</MenuItem>
                        {customers.map(customer => (
                          <MenuItem key={customer.id} value={customer.id} sx={{ fontSize: '0.75rem' }}>
                            {customer.name} ({customer.customerCode})
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </CardContent>
                </Card>

                {/* Origin & Destination */}
                <Box sx={{ position: 'relative' }}>
                  <AddressSection
                    label="Origin"
                    address={origin}
                    onChange={setOrigin}
                    errors={{ city: formErrors.originCity, province: formErrors.originProvince }}
                  />

                  <Box display="flex" justifyContent="center" my={-0.5} position="relative" zIndex={1}>
                    <IconButton 
                      onClick={handleSwapLocations} 
                      sx={{ 
                        bgcolor: 'background.paper', 
                        boxShadow: 1,
                        width: 28,
                        height: 28,
                        '& .MuiSvgIcon-root': { fontSize: '1rem' }
                      }}
                    >
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

                {/* Depot & Departure */}
                <DepotSection
                  depots={depots}
                  selectedDepot={selectedDepot}
                  onDepotSelect={handleDepotSelect}
                  departureType={departureType}
                  onDepartureTypeChange={handleDepartureTypeChange}
                  departureLocation={departureLocation}
                  onLocationChange={setDepartureLocation}
                />

                {/* Depot Distance Fields */}
                <Card {...formStyles.card}>
                  <CardContent {...formStyles.cardContent}>
                    <Stack {...formStyles.sectionHeader}>
                      <RouteIcon fontSize="small" color="primary" sx={formStyles.icon} />
                      <Typography variant="subtitle2" fontWeight="600" sx={{ fontSize: '0.8rem' }}>
                        Depot Distances
                      </Typography>
                      {calculatingDistance && <CircularProgress size={16} />}
                    </Stack>

                    <Grid container spacing={1.5}>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="From Depot (km)"
                          type="number"
                          value={fromDepotKm}
                          onChange={(e) => setFromDepotKm(e.target.value)}
                          size="small"
                          disabled={departureType === 'DEPOT'}
                          InputProps={{
                            endAdornment: (
                              <InputAdornment position="end" sx={{ fontSize: '0.7rem' }}>
                                km
                              </InputAdornment>
                            )
                          }}
                          helperText={departureType === 'DEPOT' && selectedDepot 
                            ? 'Auto-calculated from depot to pickup' 
                            : 'Manual entry'}
                          sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="To Depot (km)"
                          type="number"
                          value={toDepotKm}
                          onChange={(e) => setToDepotKm(e.target.value)}
                          size="small"
                          disabled={departureType === 'DEPOT'}
                          InputProps={{
                            endAdornment: (
                              <InputAdornment position="end" sx={{ fontSize: '0.7rem' }}>
                                km
                              </InputAdornment>
                            )
                          }}
                          helperText={departureType === 'DEPOT' && selectedDepot 
                            ? 'Auto-calculated from drop-off to depot' 
                            : 'Manual entry'}
                          sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={isFromDepot}
                              onChange={(e) => setIsFromDepot(e.target.checked)}
                              size="small"
                            />
                          }
                          label={
                            <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                              Vehicle left from depot to pickup point
                            </Typography>
                          }
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                {/* Schedule */}
                <Card {...formStyles.card}>
                  <CardContent {...formStyles.cardContent}>
                    <Stack {...formStyles.sectionHeader}>
                      <ScheduleIcon fontSize="small" color="primary" sx={formStyles.icon} />
                      <Typography variant="subtitle2" fontWeight="600" sx={{ fontSize: '0.8rem' }}>
                        Schedule
                      </Typography>
                    </Stack>

                    <Grid container spacing={1.5}>
                      <Grid item xs={12} md={6}>
                        <DateTimePicker
                          label="Planned Start Date & Time *"
                          value={form.plannedStartDate ? dayjs(form.plannedStartDate) : null}
                          onChange={(value) => handleDateTimeChange('plannedStartDate', value)}
                          slotProps={{
                            textField: {
                              fullWidth: true,
                              size: 'small',
                              required: true,
                              error: !!formErrors.plannedStartDate,
                              helperText: formErrors.plannedStartDate,
                              sx: { '& .MuiInputLabel-root': { fontSize: '0.75rem' } }
                            }
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <DateTimePicker
                          label="Planned End Date & Time"
                          value={form.plannedEndDate ? dayjs(form.plannedEndDate) : null}
                          onChange={(value) => handleDateTimeChange('plannedEndDate', value)}
                          slotProps={{
                            textField: {
                              fullWidth: true,
                              size: 'small',
                              error: !!formErrors.plannedEndDate,
                              helperText: formErrors.plannedEndDate,
                              sx: { '& .MuiInputLabel-root': { fontSize: '0.75rem' } }
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
                          InputProps={{ 
                            endAdornment: <InputAdornment position="end" sx={{ fontSize: '0.7rem' }}>hrs</InputAdornment>
                          }}
                          sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
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
                          InputProps={{ 
                            endAdornment: <InputAdornment position="end" sx={{ fontSize: '0.7rem' }}>km</InputAdornment>
                          }}
                          sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
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
                          InputProps={{ 
                            endAdornment: <InputAdornment position="end" sx={{ fontSize: '0.7rem' }}>hrs</InputAdornment>
                          }}
                          sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                {/* Assignment */}
                <Card {...formStyles.card}>
                  <CardContent {...formStyles.cardContent}>
                    <Stack {...formStyles.sectionHeader}>
                      <DirectionsCar fontSize="small" color="primary" sx={formStyles.icon} />
                      <Typography variant="subtitle2" fontWeight="600" sx={{ fontSize: '0.8rem' }}>
                        Assignment
                      </Typography>
                    </Stack>

                    <Grid container spacing={1.5}>
                      <Grid item xs={12} md={4}>
                        <FormControl fullWidth size="small" required error={!!formErrors.vehicleId}>
                          <InputLabel sx={{ fontSize: '0.75rem' }}>Vehicle *</InputLabel>
                          <Select
                            value={form.vehicleId}
                            label="Vehicle *"
                            onChange={(e) => handleFieldChange('vehicleId', e.target.value)}
                            sx={{ fontSize: '0.75rem' }}
                          >
                            <MenuItem value="" sx={{ fontSize: '0.75rem' }}><em>Select vehicle</em></MenuItem>
                            {vehicles.map(v => (
                              <MenuItem key={v.id} value={v.id.toString()} sx={{ fontSize: '0.75rem' }}>
                                {v.registrationNumber} - {v.make} {v.model}
                              </MenuItem>
                            ))}
                          </Select>
                          {formErrors.vehicleId && <FormHelperText sx={{ fontSize: '0.65rem' }}>{formErrors.vehicleId}</FormHelperText>}
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <FormControl fullWidth size="small" required error={!!formErrors.driverId}>
                          <InputLabel sx={{ fontSize: '0.75rem' }}>Driver *</InputLabel>
                          <Select
                            value={form.driverId}
                            label="Driver *"
                            onChange={(e) => handleFieldChange('driverId', e.target.value)}
                            sx={{ fontSize: '0.75rem' }}
                          >
                            <MenuItem value="" sx={{ fontSize: '0.75rem' }}><em>Select driver</em></MenuItem>
                            {drivers.map(d => (
                              <MenuItem key={d.id} value={d.id.toString()} sx={{ fontSize: '0.75rem' }}>
                                {d.firstName} {d.lastName}
                              </MenuItem>
                            ))}
                          </Select>
                          {formErrors.driverId && <FormHelperText sx={{ fontSize: '0.65rem' }}>{formErrors.driverId}</FormHelperText>}
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <FormControl fullWidth size="small">
                          <InputLabel sx={{ fontSize: '0.75rem' }}>Supervisor</InputLabel>
                          <Select
                            value={form.supervisorId}
                            label="Supervisor"
                            onChange={(e) => handleFieldChange('supervisorId', e.target.value)}
                            sx={{ fontSize: '0.75rem' }}
                          >
                            <MenuItem value="" sx={{ fontSize: '0.75rem' }}><em>Select supervisor</em></MenuItem>
                            {supervisors.map(s => (
                              <MenuItem key={s.id} value={s.id.toString()} sx={{ fontSize: '0.75rem' }}>
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
                <Card {...formStyles.card}>
                  <CardContent {...formStyles.cardContent}>
                    <Stack {...formStyles.sectionHeader}>
                      <Description fontSize="small" color="primary" sx={formStyles.icon} />
                      <Typography variant="subtitle2" fontWeight="600" sx={{ fontSize: '0.8rem' }}>
                        Commodity & Cargo
                      </Typography>
                    </Stack>

                    <Grid container spacing={1.5}>
                      <Grid item xs={12} md={6}>
                        <FormControl fullWidth size="small" required error={!!formErrors.commodityType}>
                          <InputLabel sx={{ fontSize: '0.75rem' }}>Commodity Type *</InputLabel>
                          <Select
                            value={form.commodityType}
                            label="Commodity Type *"
                            onChange={(e) => handleFieldChange('commodityType', e.target.value)}
                            sx={{ fontSize: '0.75rem' }}
                          >
                            <MenuItem value="" sx={{ fontSize: '0.75rem' }}><em>Select commodity</em></MenuItem>
                            {COMMODITY_OPTIONS.map(c => (
                              <MenuItem key={c} value={c} sx={{ fontSize: '0.75rem' }}>{c}</MenuItem>
                            ))}
                          </Select>
                          {formErrors.commodityType && <FormHelperText sx={{ fontSize: '0.65rem' }}>{formErrors.commodityType}</FormHelperText>}
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Cargo Description"
                          value={form.cargoDescription}
                          onChange={(e) => handleFieldChange('cargoDescription', e.target.value)}
                          size="small"
                          sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
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
                            startAdornment: <InputAdornment position="start"><Scale sx={{ fontSize: '0.9rem' }} /></InputAdornment>,
                            endAdornment: <InputAdornment position="end" sx={{ fontSize: '0.7rem' }}>kg</InputAdornment>
                          }}
                          sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
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
                            startAdornment: <InputAdornment position="start"><AttachMoney sx={{ fontSize: '0.9rem' }} /></InputAdornment>
                          }}
                          sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
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
                          InputProps={{ 
                            endAdornment: <InputAdornment position="end" sx={{ fontSize: '0.7rem' }}>pallets</InputAdornment>
                          }}
                          sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                {/* Financial Estimates */}
                <Card {...formStyles.card}>
                  <CardContent {...formStyles.cardContent}>
                    <Stack {...formStyles.sectionHeader}>
                      <Receipt fontSize="small" color="primary" sx={formStyles.icon} />
                      <Typography variant="subtitle2" fontWeight="600" sx={{ fontSize: '0.8rem' }}>
                        Financial Estimates
                      </Typography>
                    </Stack>

                    <Grid container spacing={1.5}>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Est. Toll Cost (ZAR)"
                          type="number"
                          value={form.estimatedTollCost}
                          onChange={(e) => handleFieldChange('estimatedTollCost', e.target.value)}
                          size="small"
                          InputProps={{
                            startAdornment: <InputAdornment position="start"><Toll sx={{ fontSize: '0.9rem' }} /></InputAdornment>
                          }}
                          sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
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
                            startAdornment: <InputAdornment position="start"><AttachMoney sx={{ fontSize: '0.9rem' }} /></InputAdornment>
                          }}
                          sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                {/* Notes */}
                <Card {...formStyles.card}>
                  <CardContent {...formStyles.cardContent}>
                    <Stack {...formStyles.sectionHeader}>
                      <Comment fontSize="small" color="primary" sx={formStyles.icon} />
                      <Typography variant="subtitle2" fontWeight="600" sx={{ fontSize: '0.8rem' }}>
                        Notes
                      </Typography>
                    </Stack>

                    <Grid container spacing={1.5}>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Reference Number"
                          value={form.referenceNumber}
                          onChange={(e) => handleFieldChange('referenceNumber', e.target.value)}
                          size="small"
                          sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Purchase Order Number"
                          value={form.purchaseOrderNumber}
                          onChange={(e) => handleFieldChange('purchaseOrderNumber', e.target.value)}
                          size="small"
                          sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          multiline
                          rows={2}
                          label="Special Instructions"
                          value={form.specialInstructions}
                          onChange={(e) => handleFieldChange('specialInstructions', e.target.value)}
                          size="small"
                          sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
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
                          sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                {/* Status */}
                <Card {...formStyles.card}>
                  <CardContent {...formStyles.cardContent}>
                    <Stack {...formStyles.sectionHeader}>
                      <AssignmentIcon fontSize="small" color="primary" sx={formStyles.icon} />
                      <Typography variant="subtitle2" fontWeight="600" sx={{ fontSize: '0.8rem' }}>
                        Status
                      </Typography>
                    </Stack>

                    <Grid container spacing={1.5}>
                      <Grid item xs={12} md={6}>
                        <EnumSelect
                          moduleName="trip"
                          category="status"
                          value={form.status}
                          onChange={(value) => handleFieldChange('status', value)}
                          label="Status"
                          showRefresh
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <EnumSelect
                          moduleName="trip"
                          category="approval"
                          value={form.approvalStatus}
                          onChange={(value) => handleFieldChange('approvalStatus', value)}
                          label="Approval Status"
                          showRefresh
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Stack>
            </>
          )}
        </DialogContent>

        <DialogActions sx={{ borderTop: 1, borderColor: 'divider', p: 1.5 }}>
          <Button 
            startIcon={<Close />} 
            onClick={onClose} 
            disabled={submitting}
            size="small"
            sx={{ fontSize: '0.8rem' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            startIcon={submitting ? <CircularProgress size={18} /> : <Save />}
            disabled={submitting || loading || isSuccess}
            size="small"
            sx={{ fontSize: '0.8rem' }}
          >
            {submitting ? 'Saving...' : isSuccess ? '✓ Saved' : (mode === 'create' ? 'Create Trip' : 'Update Trip')}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
}

export default TripForm;
