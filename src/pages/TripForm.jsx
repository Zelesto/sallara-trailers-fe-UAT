// src/pages/TripForm.jsx - Fully Dynamic with Database Enums
import React, { useState, useEffect, useCallback, useRef } from 'react';
import dayjs from 'dayjs';
import {
  Dialog,
  DialogTitle,
  DialogContent,
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
  useTheme,
  useMediaQuery,
  Paper,
  Switch,
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
  LocalShipping,
  Add as AddIcon,
  Inventory,
  Category,
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
import { loadService } from '../services/loadService';
import { useEnums } from '../contexts/EnumContext';

// Province Options (hardcoded as these are geographic, not enums)
const PROVINCE_OPTIONS = [
  'Gauteng',
  'Western Cape',
  'KwaZulu-Natal',
  'Eastern Cape',
  'Free State',
  'Mpumalanga',
  'Limpopo',
  'North West',
  'Northern Cape',
];

// Commodity Types (hardcoded as they're not in enum_master yet)
const COMMODITY_OPTIONS = [
  'GENERAL',
  'HAZARDOUS',
  'PERISHABLE',
  'LIQUID',
  'BULK',
  'PALLETIZED',
  'OVERSIZED',
  'REFRIGERATED',
  'AUTO',
  'MACHINERY',
  'CONSTRUCTION',
  'MINING',
  'AGRICULTURE',
  'CHEMICALS',
  'PHARMACEUTICALS',
  'ELECTRONICS',
  'FOOD',
  'BEVERAGE',
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
  tripType: '',
  status: '',
  approvalStatus: '',
  priority: '',
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

// Get default planned dates (today and 8 hours later)
const getDefaultPlannedDates = () => {
  const now = new Date();
  const startDate = new Date(now);
  startDate.setMinutes(0, 0, 0);
  
  const endDate = new Date(startDate);
  endDate.setHours(endDate.getHours() + 8);
  
  return {
    plannedStartDate: startDate.toISOString(),
    plannedEndDate: endDate.toISOString()
  };
};

// Helper to get default enum code from options
const getDefaultEnumCode = (options, defaultCode = null) => {
  if (defaultCode && options.some(opt => opt.value === defaultCode)) {
    return defaultCode;
  }
  const defaultOpt = options.find(opt => opt.isDefault);
  return defaultOpt?.value || (options.length > 0 ? options[0].value : '');
};

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
    <Paper
      elevation={0}
      sx={{
        p: { xs: 1.5, sm: 2, md: 2.5 },
        borderRadius: { xs: '12px', sm: '16px' },
        border: '1px solid #ECECEC',
        bgcolor: '#FFFFFF',
        width: '100%',
        mb: 1.5,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={0.75} mb={1.5}>
        <LocationOn sx={{ fontSize: { xs: '0.9rem', sm: '1rem' }, color: '#4F46E5' }} />
        <Typography 
          variant="subtitle2" 
          sx={{ 
            fontWeight: 600, 
            fontSize: { xs: '0.7rem', sm: '0.8rem' },
            color: '#111827',
          }}
        >
          {label}
        </Typography>
        {address.latitude && address.longitude && (
          <Chip 
            size="small" 
            label="📍 Geocoded" 
            color="success" 
            variant="outlined"
            sx={{ height: { xs: 16, sm: 20 }, fontSize: { xs: '0.45rem', sm: '0.6rem' } }}
          />
        )}
      </Stack>

      <Grid container spacing={{ xs: 1, sm: 1.5 }}>
        <Grid size={{ xs: 12 }}>
          <TextField
            fullWidth
            label="Street Address"
            value={address.street || ''}
            onChange={(e) => onChange({ ...address, street: e.target.value })}
            size="small"
            placeholder="e.g., 16275 Imbuzana Street"
            disabled={disabled}
            sx={{ 
              '& .MuiInputLabel-root': { fontSize: { xs: '0.65rem', sm: '0.75rem' } },
              '& .MuiInputBase-root': { fontSize: { xs: '0.7rem', sm: '0.75rem' } },
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
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
                sx={{ 
                  '& .MuiInputLabel-root': { fontSize: { xs: '0.65rem', sm: '0.75rem' } },
                  '& .MuiInputBase-root': { fontSize: { xs: '0.7rem', sm: '0.75rem' } },
                }}
              />
            )}
            renderOption={(props, option) => (
              <li {...props}>
                <Box>
                  <Typography sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                    {option.city}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.55rem', sm: '0.65rem' } }}>
                    {option.province}
                    {option.zipCode && ` • ${option.zipCode}`}
                  </Typography>
                </Box>
              </li>
            )}
          />
        </Grid>

        <Grid size={{ xs: 6, md: 3 }}>
          <TextField
            fullWidth
            label="Postal Code"
            value={address.zipCode || ''}
            onChange={(e) => onChange({ ...address, zipCode: e.target.value })}
            size="small"
            placeholder="e.g., 1475"
            inputProps={{ maxLength: 4 }}
            disabled={disabled}
            sx={{ 
              '& .MuiInputLabel-root': { fontSize: { xs: '0.65rem', sm: '0.75rem' } },
              '& .MuiInputBase-root': { fontSize: { xs: '0.7rem', sm: '0.75rem' } },
            }}
          />
        </Grid>

        <Grid size={{ xs: 6, md: 3 }}>
          <FormControl fullWidth size="small" error={!!errors.province}>
            <InputLabel sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
              Province
            </InputLabel>
            <Select
              value={address.province || ''}
              label="Province"
              onChange={(e) => onChange({ ...address, province: e.target.value })}
              disabled={disabled}
              sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
            >
              <MenuItem value="" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                Select province
              </MenuItem>
              {PROVINCE_OPTIONS.map(p => (
                <MenuItem key={p} value={p} sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                  {p}
                </MenuItem>
              ))}
            </Select>
            {errors.province && (
              <FormHelperText sx={{ fontSize: { xs: '0.55rem', sm: '0.65rem' } }}>
                {errors.province}
              </FormHelperText>
            )}
          </FormControl>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Divider sx={{ my: 0.75 }} />
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.55rem', sm: '0.65rem' } }}>
            Coordinates (optional)
          </Typography>
          <Stack 
            direction={{ xs: 'column', sm: 'row' }} 
            spacing={1.5} 
            sx={{ mt: 0.75 }}
          >
            <TextField
              fullWidth
              label="Latitude"
              type="number"
              value={address.latitude || ''}
              onChange={(e) => onChange({ ...address, latitude: parseFloat(e.target.value) || null })}
              size="small"
              placeholder="e.g., -26.3378"
              InputProps={{ inputProps: { step: 'any' } }}
              sx={{ 
                '& .MuiInputLabel-root': { fontSize: { xs: '0.65rem', sm: '0.75rem' } },
                '& .MuiInputBase-root': { fontSize: { xs: '0.7rem', sm: '0.75rem' } },
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
              InputProps={{ inputProps: { step: 'any' } }}
              sx={{ 
                '& .MuiInputLabel-root': { fontSize: { xs: '0.65rem', sm: '0.75rem' } },
                '& .MuiInputBase-root': { fontSize: { xs: '0.7rem', sm: '0.75rem' } },
              }}
            />
          </Stack>
        </Grid>
      </Grid>
    </Paper>
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
  onLocationChange,
  departureOptions 
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 1.5, sm: 2, md: 2.5 },
        borderRadius: { xs: '12px', sm: '16px' },
        border: '1px solid #ECECEC',
        bgcolor: '#FFFFFF',
        width: '100%',
        mb: 1.5,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={0.75} mb={1.5}>
        <WarehouseIcon sx={{ fontSize: { xs: '0.9rem', sm: '1rem' }, color: '#4F46E5' }} />
        <Typography 
          variant="subtitle2" 
          sx={{ 
            fontWeight: 600, 
            fontSize: { xs: '0.7rem', sm: '0.8rem' },
            color: '#111827',
          }}
        >
          Depot & Departure
        </Typography>
      </Stack>

      <Grid container spacing={1.5}>
        <Grid size={{ xs: 12, md: 4 }}>
          <FormControl fullWidth size="small">
            <InputLabel sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
              Departed From
            </InputLabel>
            <Select
              value={departureType}
              label="Departed From"
              onChange={(e) => onDepartureTypeChange(e.target.value)}
              sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
            >
              {departureOptions.map(option => (
                <MenuItem key={option.value} value={option.value} sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {departureType === 'DEPOT' && (
          <>
            <Grid size={{ xs: 12, md: 4 }}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                  Select Depot
                </InputLabel>
                <Select
                  value={selectedDepot?.id || ''}
                  label="Select Depot"
                  onChange={(e) => {
                    const depot = depots.find(d => d.id === e.target.value);
                    onDepotSelect(depot);
                  }}
                  sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                >
                  <MenuItem value="" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                    <em>Select depot</em>
                  </MenuItem>
                  {depots.map(depot => (
                    <MenuItem key={depot.id} value={depot.id} sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                      {depot.name} ({depot.depotCode})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {selectedDepot && (
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label="Depot Address"
                  value={selectedDepot.fullAddress || ''}
                  size="small"
                  disabled
                  sx={{ 
                    '& .MuiInputLabel-root': { fontSize: { xs: '0.65rem', sm: '0.75rem' } },
                    '& .MuiInputBase-root': { fontSize: { xs: '0.7rem', sm: '0.75rem' } }
                  }}
                />
              </Grid>
            )}
          </>
        )}

        {departureType === 'FREEHAND' && (
          <Grid size={{ xs: 12, md: 8 }}>
            <TextField
              fullWidth
              label="Departure Location (Freehand)"
              value={departureLocation || ''}
              onChange={(e) => onLocationChange(e.target.value)}
              size="small"
              placeholder="Enter custom departure location..."
              sx={{ 
                '& .MuiInputLabel-root': { fontSize: { xs: '0.65rem', sm: '0.75rem' } },
                '& .MuiInputBase-root': { fontSize: { xs: '0.7rem', sm: '0.75rem' } },
              }}
            />
          </Grid>
        )}

        {departureType === 'LAST_DROP' && (
          <Grid size={{ xs: 12, md: 8 }}>
            <Alert severity="info" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
              Vehicle departs from the last drop-off location of the previous trip.
              Distance will be calculated based on the previous trip's destination.
            </Alert>
          </Grid>
        )}
      </Grid>
    </Paper>
  );
}

/* ============================================================
   MAIN COMPONENT: TripForm
   ============================================================ */

function TripForm({ open = false, onClose, mode = 'create', initialData, onSuccess, fetchTrips }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  
  // Get enums from context
  const {
    enums,
    loading: enumsLoading,
    getTripStatusOptions,
    getTripTypeOptions,
    getApprovalStatusOptions,
    getPriorityOptions,
    getDepartureTypeOptions,
    getDepartedFromOptions,
    getDriverOptions,
    getVehicleOptions,
    getSupervisorOptions,
    refreshEnums,
    isReady,
  } = useEnums();

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

  // Get options from database with defaults
  const tripTypeOptions = getTripTypeOptions();
  const statusOptions = getTripStatusOptions();
  const approvalOptions = getApprovalStatusOptions();
  const priorityOptions = getPriorityOptions();
  const departureOptions = getDepartureTypeOptions();
  const departedFromOptions = getDepartedFromOptions();
  const driverOptions = getDriverOptions();
  const vehicleOptions = getVehicleOptions();
  const supervisorOptions = getSupervisorOptions();

  // Form State - initialize with defaults from DB
  const [form, setForm] = useState(() => {
    const defaults = getDefaultPlannedDates();
    return {
      ...getDefaultFormState(),
      tripType: getDefaultEnumCode(tripTypeOptions, 'FREIGHT'),
      status: getDefaultEnumCode(statusOptions, 'PLANNED'),
      approvalStatus: getDefaultEnumCode(approvalOptions, 'PENDING'),
      priority: getDefaultEnumCode(priorityOptions, 'NORMAL'),
      plannedStartDate: defaults.plannedStartDate,
      plannedEndDate: defaults.plannedEndDate,
    };
  });

  // Update form defaults when enums load
  useEffect(() => {
    if (isReady && !initialData && mode === 'create') {
      setForm(prev => ({
        ...prev,
        tripType: getDefaultEnumCode(tripTypeOptions, 'FREIGHT') || prev.tripType,
        status: getDefaultEnumCode(statusOptions, 'PLANNED') || prev.status,
        approvalStatus: getDefaultEnumCode(approvalOptions, 'PENDING') || prev.approvalStatus,
        priority: getDefaultEnumCode(priorityOptions, 'NORMAL') || prev.priority,
      }));
    }
  }, [isReady, tripTypeOptions, statusOptions, approvalOptions, priorityOptions, initialData, mode]);

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
    // Refresh enums to get latest from DB
    refreshEnums();
  }, [open, loadData, refreshEnums]);

  // Populate form with initial data when editing
  useEffect(() => {
    if (initialData && open) {
      console.log('🔍 Populating form with initial data:', initialData);
      
      setForm(prev => ({
        ...prev,
        ...initialData,
        tripType: initialData.tripType || getDefaultEnumCode(tripTypeOptions, 'FREIGHT'),
        status: initialData.status || getDefaultEnumCode(statusOptions, 'PLANNED'),
        approvalStatus: initialData.approvalStatus || getDefaultEnumCode(approvalOptions, 'PENDING'),
        priority: initialData.priority || getDefaultEnumCode(priorityOptions, 'NORMAL'),
        vehicleId: initialData.vehicleId || '',
        driverId: initialData.driverId || '',
        supervisorId: initialData.supervisorId || '',
        customerId: initialData.customerId || '',
        referenceNumber: initialData.referenceNumber || '',
        plannedStartDate: initialData.plannedStartDate || getDefaultPlannedDates().plannedStartDate,
        plannedEndDate: initialData.plannedEndDate || getDefaultPlannedDates().plannedEndDate,
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
  }, [initialData, open, tripTypeOptions, statusOptions, approvalOptions, priorityOptions]);

  // Set default planned dates for new trip
  useEffect(() => {
    if (open && mode === 'create' && !initialData) {
      const defaults = getDefaultPlannedDates();
      setForm(prev => ({
        ...prev,
        plannedStartDate: defaults.plannedStartDate,
        plannedEndDate: defaults.plannedEndDate,
      }));
    }
  }, [open, mode, initialData]);

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
     LOAD CREATION/LINKING FUNCTION
   ============================================================ */

  const findOrCreateLoad = async (tripResult) => {
    try {
      const referenceNumber = tripResult.referenceNumber || form.referenceNumber;
      
      if (!referenceNumber) {
        console.log('📦 No reference number provided. Creating new load...');
        return await createNewLoad(tripResult);
      }

      console.log(`🔍 Checking for existing load with reference: ${referenceNumber}`);
      
      let existingLoad = null;
      try {
        const searchResult = await loadService.searchLoads({ 
          referenceNumber: referenceNumber,
          size: 100 
        });
        
        if (searchResult && searchResult.content && searchResult.content.length > 0) {
          existingLoad = searchResult.content[0];
          console.log(`✅ Found existing load: ${existingLoad.loadNumber} (ID: ${existingLoad.id})`);
        }
      } catch (searchError) {
        console.warn('⚠️ Error searching for load:', searchError);
      }

      if (existingLoad) {
        console.log(`📦 Adding trip to existing load: ${existingLoad.loadNumber}`);
        try {
          const updatedLoad = await loadService.addTripToLoad(existingLoad.id, tripResult.id);
          console.log(`✅ Trip added to load ${updatedLoad.loadNumber}`);
          return updatedLoad;
        } catch (addError) {
          console.warn('⚠️ Could not add trip to existing load, creating new load:', addError);
          return await createNewLoad(tripResult);
        }
      }

      console.log('📦 No existing load found. Creating new load...');
      return await createNewLoad(tripResult);

    } catch (error) {
      console.error('❌ Error in load creation/linking:', error);
      return null;
    }
  };

  const createNewLoad = async (tripResult) => {
    try {
      const loadData = {
        referenceNumber: form.referenceNumber || tripResult.referenceNumber || null,
        description: form.cargoDescription || form.description || `Load for trip ${tripResult.tripNumber}`,
        customerId: tripResult.customerId || form.customerId || null,
        weightKg: form.cargoWeight ? parseFloat(form.cargoWeight) : null,
        volumeCubicM: null,
        palletCount: form.palletCount ? parseInt(form.palletCount) : null,
        containerNumber: form.containerNumber || null,
        loadingDate: form.plannedStartDate || null,
        unloadingDate: form.plannedEndDate || null,
        status: 'PENDING',
        priority: form.priority || 'NORMAL',
        commodityType: form.commodityType || null,
        originLocation: buildAddress(origin) || null,
        destinationLocation: buildAddress(destination) || null,
        tripIds: [tripResult.id],
      };

      Object.keys(loadData).forEach(key => {
        if (loadData[key] === null || loadData[key] === undefined || loadData[key] === '') {
          delete loadData[key];
        }
      });

      console.log('📦 Creating new load with data:', loadData);
      const newLoad = await loadService.createLoad(loadData);
      console.log(`✅ New load created: ${newLoad.loadNumber} (ID: ${newLoad.id})`);
      return newLoad;
    } catch (error) {
      console.error('❌ Failed to create load:', error);
      return null;
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
      setError('Please fix the validation errors before submitting.');
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
        approvalStatus: form.approvalStatus,
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
        console.log('📤 Creating new trip...');
        result = await tripService.createTrip(payload);
        console.log('✅ Trip created successfully:', result);
        
        console.log('📦 Finding or creating load for trip...');
        const loadResult = await findOrCreateLoad(result);
        if (loadResult) {
          setSuccessMessage(`Trip ${result.tripNumber} created successfully and added to Load ${loadResult.loadNumber}!`);
        } else {
          setSuccessMessage(`Trip ${result.tripNumber} created successfully!`);
        }
      }

      setIsSuccess(true);

      if (onSuccess) {
        onSuccess(result);
      }

      if (fetchTrips) {
        console.log('🔄 Refreshing trip list...');
        try {
          await new Promise(resolve => setTimeout(resolve, 500));
          await fetchTrips();
          console.log('✅ Trip list refreshed successfully');
        } catch (refreshError) {
          console.error('⚠️ Error refreshing trip list:', refreshError);
        }
      }

      setTimeout(() => {
        if (onClose) onClose();
      }, 1500);

    } catch (err) {
      console.error('❌ Trip error:', err);
      
      if (err.response?.status === 404 && err.response?.data?.detail?.includes('Trip not found')) {
        console.warn('⚠️ Trip was created but not found on refresh - race condition');
        setSuccessMessage('Trip created successfully!');
        setIsSuccess(true);
        
        if (fetchTrips) {
          try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            await fetchTrips();
          } catch (refreshError) {
            console.error('⚠️ Error refreshing trip list after race condition:', refreshError);
          }
        }
        
        setTimeout(() => {
          if (onClose) onClose();
        }, 1500);
        setSubmitting(false);
        return;
      }

      let errorMessage = mode === 'edit' ? 'Failed to update trip' : 'Failed to create trip';

      if (err.response?.status === 409) {
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
    <Alert 
      severity="error" 
      sx={{ mb: 2, borderRadius: '12px', fontSize: { xs: '0.7rem', sm: '0.8rem' } }} 
      onClose={() => setError(null)}
    >
      {error}
    </Alert>
  );

  const renderSuccess = () => successMessage && (
    <Alert 
      severity="success" 
      sx={{ mb: 2, borderRadius: '12px', fontSize: { xs: '0.7rem', sm: '0.8rem' } }} 
      onClose={() => setSuccessMessage(null)}
    >
      {successMessage}
    </Alert>
  );

  // Helper to render select with dynamic options
  const renderSelectField = (field, label, options, required = false, helperText = null) => (
    <FormControl fullWidth size="small" required={required} error={!!formErrors[field]}>
      <InputLabel sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
        {label}
      </InputLabel>
      <Select
        value={form[field] || ''}
        label={label}
        onChange={(e) => handleFieldChange(field, e.target.value)}
        sx={{ 
          fontSize: { xs: '0.7rem', sm: '0.75rem' },
          borderRadius: '8px',
        }}
      >
        {options.map(option => (
          <MenuItem key={option.value} value={option.value} sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
      {formErrors[field] && <FormHelperText sx={{ fontSize: { xs: '0.55rem', sm: '0.65rem' } }}>{formErrors[field]}</FormHelperText>}
      {helperText && !formErrors[field] && <FormHelperText sx={{ fontSize: { xs: '0.55rem', sm: '0.65rem' } }}>{helperText}</FormHelperText>}
    </FormControl>
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
        PaperProps={{ 
          sx: { 
            maxHeight: '90vh',
            width: '100%',
            m: isMobile ? 1 : 2,
            borderRadius: isMobile ? '12px' : '16px',
            bgcolor: '#F7F7FC',
          } 
        }}
      >
        <DialogTitle sx={{ 
          borderBottom: 1, 
          borderColor: 'divider',
          bgcolor: '#FFFFFF',
          py: isMobile ? 1 : 1.5, 
          px: isMobile ? 1.5 : 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 1,
          borderRadius: isMobile ? '12px 12px 0 0' : '16px 16px 0 0',
        }}>
          <Typography 
            variant="h6" 
            sx={{ 
              fontSize: { xs: '0.9rem', sm: '1rem' }, 
              fontWeight: 700,
              color: '#111827',
            }}
          >
            {mode === 'create' ? 'Create New Trip' : 'Edit Trip'}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button 
              startIcon={<Close />} 
              onClick={onClose} 
              disabled={submitting}
              size="small"
              sx={{ 
                fontSize: { xs: '0.7rem', sm: '0.75rem' },
                borderRadius: '10px',
                textTransform: 'none',
              }}
            >
              {isMobile ? '' : 'Cancel'}
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmit}
              startIcon={submitting ? <CircularProgress size={18} /> : <Save />}
              disabled={submitting || loading || enumsLoading || isSuccess}
              size="small"
              sx={{ 
                fontSize: { xs: '0.7rem', sm: '0.75rem' },
                borderRadius: '10px',
                textTransform: 'none',
                px: { xs: 1.5, sm: 2 },
              }}
            >
              {submitting ? 'Saving...' : isSuccess ? '✓ Saved' : (isMobile ? 'Save' : (mode === 'create' ? 'Create Trip' : 'Update Trip'))}
            </Button>
          </Box>
        </DialogTitle>

        <DialogContent 
          dividers 
          sx={{ 
            overflowY: 'auto', 
            p: { xs: 1.5, sm: 2, md: 2.5 },
            bgcolor: '#F7F7FC',
            '&::-webkit-scrollbar': {
              width: '6px',
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: '#b0b0b0',
              borderRadius: '3px',
            },
          }}
        >
          {loading || enumsLoading ? renderLoading() : (
            <>
              {renderError()}
              {renderSuccess()}

              <Stack spacing={{ xs: 1.5, sm: 2 }}>
                {/* Trip Type & Priority */}
                <Paper
                  elevation={0}
                  sx={{
                    p: { xs: 1.5, sm: 2, md: 2.5 },
                    borderRadius: { xs: '12px', sm: '16px' },
                    border: '1px solid #ECECEC',
                    bgcolor: '#FFFFFF',
                    width: '100%',
                  }}
                >
                  <Grid container spacing={{ xs: 1.5, sm: 2 }}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      {renderSelectField('tripType', 'Trip Type', tripTypeOptions)}
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      {renderSelectField('priority', 'Priority', priorityOptions)}
                    </Grid>
                  </Grid>
                </Paper>

                {/* Customer Selection */}
                <Paper
                  elevation={0}
                  sx={{
                    p: { xs: 1.5, sm: 2, md: 2.5 },
                    borderRadius: { xs: '12px', sm: '16px' },
                    border: '1px solid #ECECEC',
                    bgcolor: '#FFFFFF',
                    width: '100%',
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={0.75} mb={1.5}>
                    <BusinessIcon sx={{ fontSize: { xs: '0.9rem', sm: '1rem' }, color: '#4F46E5' }} />
                    <Typography 
                      variant="subtitle2" 
                      sx={{ 
                        fontWeight: 600, 
                        fontSize: { xs: '0.7rem', sm: '0.8rem' },
                        color: '#111827',
                      }}
                    >
                      Customer
                    </Typography>
                  </Stack>
                  <FormControl fullWidth size="small">
                    <InputLabel sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                      Select Customer
                    </InputLabel>
                    <Select
                      value={form.customerId}
                      label="Select Customer"
                      onChange={(e) => handleFieldChange('customerId', e.target.value)}
                      sx={{ 
                        fontSize: { xs: '0.7rem', sm: '0.75rem' },
                        borderRadius: '8px',
                      }}
                    >
                      <MenuItem value="" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                        No Customer
                      </MenuItem>
                      {customers.map(customer => (
                        <MenuItem key={customer.id} value={customer.id} sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                          {customer.name} ({customer.customerCode})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Paper>

                {/* Origin & Destination */}
                <AddressSection
                  label="Origin"
                  address={origin}
                  onChange={setOrigin}
                  errors={{ city: formErrors.originCity, province: formErrors.originProvince }}
                />

                <Box display="flex" justifyContent="center" my={-1} position="relative" zIndex={1}>
                  <IconButton 
                    onClick={handleSwapLocations} 
                    sx={{ 
                      bgcolor: '#FFFFFF', 
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      width: { xs: 32, sm: 36 },
                      height: { xs: 32, sm: 36 },
                      border: '1px solid #ECECEC',
                      '&:hover': {
                        bgcolor: '#F7F7FC',
                        transform: 'scale(1.05)',
                      },
                      '& .MuiSvgIcon-root': { 
                        fontSize: { xs: '0.9rem', sm: '1rem' } 
                      }
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

                {/* Depot & Departure */}
                <DepotSection
                  depots={depots}
                  selectedDepot={selectedDepot}
                  onDepotSelect={handleDepotSelect}
                  departureType={departureType}
                  onDepartureTypeChange={handleDepartureTypeChange}
                  departureLocation={departureLocation}
                  onLocationChange={setDepartureLocation}
                  departureOptions={departureOptions}
                />

                {/* Depot Distance Fields */}
                <Paper
                  elevation={0}
                  sx={{
                    p: { xs: 1.5, sm: 2, md: 2.5 },
                    borderRadius: { xs: '12px', sm: '16px' },
                    border: '1px solid #ECECEC',
                    bgcolor: '#FFFFFF',
                    width: '100%',
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={0.75} mb={1.5}>
                    <RouteIcon sx={{ fontSize: { xs: '0.9rem', sm: '1rem' }, color: '#4F46E5' }} />
                    <Typography 
                      variant="subtitle2" 
                      sx={{ 
                        fontWeight: 600, 
                        fontSize: { xs: '0.7rem', sm: '0.8rem' },
                        color: '#111827',
                      }}
                    >
                      Depot Distances
                    </Typography>
                    {calculatingDistance && <CircularProgress size={16} />}
                  </Stack>

                  <Grid container spacing={1.5}>
                    <Grid size={{ xs: 12, sm: 6 }}>
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
                            <InputAdornment position="end" sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' } }}>
                              km
                            </InputAdornment>
                          )
                        }}
                        helperText={departureType === 'DEPOT' && selectedDepot 
                          ? 'Auto-calculated from depot to pickup' 
                          : 'Manual entry'}
                        sx={{ 
                          '& .MuiInputLabel-root': { fontSize: { xs: '0.65rem', sm: '0.75rem' } },
                          '& .MuiInputBase-root': { fontSize: { xs: '0.7rem', sm: '0.75rem' } },
                        }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
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
                            <InputAdornment position="end" sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' } }}>
                              km
                            </InputAdornment>
                          )
                        }}
                        helperText={departureType === 'DEPOT' && selectedDepot 
                          ? 'Auto-calculated from drop-off to depot' 
                          : 'Manual entry'}
                        sx={{ 
                          '& .MuiInputLabel-root': { fontSize: { xs: '0.65rem', sm: '0.75rem' } },
                          '& .MuiInputBase-root': { fontSize: { xs: '0.7rem', sm: '0.75rem' } },
                        }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={isFromDepot}
                            onChange={(e) => setIsFromDepot(e.target.checked)}
                            size="small"
                          />
                        }
                        label={
                          <Typography variant="caption" sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' } }}>
                            Vehicle left from depot to pickup point
                          </Typography>
                        }
                      />
                    </Grid>
                  </Grid>
                </Paper>

                {/* Schedule */}
                <Paper
                  elevation={0}
                  sx={{
                    p: { xs: 1.5, sm: 2, md: 2.5 },
                    borderRadius: { xs: '12px', sm: '16px' },
                    border: '1px solid #ECECEC',
                    bgcolor: '#FFFFFF',
                    width: '100%',
                  }}
                >
                  <Stack direction="row" spacing={0.75} mb={1.5}>
                    <ScheduleIcon sx={{ fontSize: { xs: '0.9rem', sm: '1rem' }, color: '#4F46E5' }} />
                    <Typography 
                      variant="subtitle2" 
                      sx={{ 
                        fontWeight: 600, 
                        fontSize: { xs: '0.7rem', sm: '0.8rem' },
                        color: '#111827',
                      }}
                    >
                      Schedule
                    </Typography>
                  </Stack>

                  <Grid container spacing={1.5}>
                    <Grid size={{ xs: 12, sm: 6 }}>
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
                            sx: { 
                              '& .MuiInputLabel-root': { fontSize: { xs: '0.65rem', sm: '0.75rem' } },
                              '& .MuiInputBase-root': { fontSize: { xs: '0.7rem', sm: '0.75rem' } },
                            }
                          }
                        }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
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
                            sx: { 
                              '& .MuiInputLabel-root': { fontSize: { xs: '0.65rem', sm: '0.75rem' } },
                              '& .MuiInputBase-root': { fontSize: { xs: '0.7rem', sm: '0.75rem' } },
                            }
                          }
                        }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <TextField
                        fullWidth
                        label="Est. Duration (hours)"
                        type="number"
                        value={form.estimatedDuration}
                        onChange={(e) => handleFieldChange('estimatedDuration', e.target.value)}
                        size="small"
                        InputProps={{ 
                          endAdornment: <InputAdornment position="end" sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' } }}>hrs</InputAdornment>
                        }}
                        sx={{ 
                          '& .MuiInputLabel-root': { fontSize: { xs: '0.65rem', sm: '0.75rem' } },
                          '& .MuiInputBase-root': { fontSize: { xs: '0.7rem', sm: '0.75rem' } },
                        }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <TextField
                        fullWidth
                        label="Planned Distance (km)"
                        type="number"
                        value={form.plannedDistanceKm}
                        onChange={(e) => handleFieldChange('plannedDistanceKm', e.target.value)}
                        size="small"
                        InputProps={{ 
                          endAdornment: <InputAdornment position="end" sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' } }}>km</InputAdornment>
                        }}
                        sx={{ 
                          '& .MuiInputLabel-root': { fontSize: { xs: '0.65rem', sm: '0.75rem' } },
                          '& .MuiInputBase-root': { fontSize: { xs: '0.7rem', sm: '0.75rem' } },
                        }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <TextField
                        fullWidth
                        label="Planned Duration (hours)"
                        type="number"
                        value={form.plannedDurationHours}
                        onChange={(e) => handleFieldChange('plannedDurationHours', e.target.value)}
                        size="small"
                        InputProps={{ 
                          endAdornment: <InputAdornment position="end" sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' } }}>hrs</InputAdornment>
                        }}
                        sx={{ 
                          '& .MuiInputLabel-root': { fontSize: { xs: '0.65rem', sm: '0.75rem' } },
                          '& .MuiInputBase-root': { fontSize: { xs: '0.7rem', sm: '0.75rem' } },
                        }}
                      />
                    </Grid>
                  </Grid>
                </Paper>

                {/* Assignment */}
                <Paper
                  elevation={0}
                  sx={{
                    p: { xs: 1.5, sm: 2, md: 2.5 },
                    borderRadius: { xs: '12px', sm: '16px' },
                    border: '1px solid #ECECEC',
                    bgcolor: '#FFFFFF',
                    width: '100%',
                  }}
                >
                  <Stack direction="row" spacing={0.75} mb={1.5}>
                    <DirectionsCar sx={{ fontSize: { xs: '0.9rem', sm: '1rem' }, color: '#4F46E5' }} />
                    <Typography 
                      variant="subtitle2" 
                      sx={{ 
                        fontWeight: 600, 
                        fontSize: { xs: '0.7rem', sm: '0.8rem' },
                        color: '#111827',
                      }}
                    >
                      Assignment
                    </Typography>
                  </Stack>

                  <Grid container spacing={1.5}>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <FormControl fullWidth size="small" required error={!!formErrors.vehicleId}>
                        <InputLabel sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                          Vehicle *
                        </InputLabel>
                        <Select
                          value={form.vehicleId}
                          label="Vehicle *"
                          onChange={(e) => handleFieldChange('vehicleId', e.target.value)}
                          sx={{ 
                            fontSize: { xs: '0.7rem', sm: '0.75rem' },
                            borderRadius: '8px',
                          }}
                        >
                          <MenuItem value="" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                            <em>Select vehicle</em>
                          </MenuItem>
                          {vehicles.map(v => (
                            <MenuItem key={v.id} value={v.id} sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                              {v.registrationNumber} - {v.make} {v.model}
                            </MenuItem>
                          ))}
                        </Select>
                        {formErrors.vehicleId && <FormHelperText sx={{ fontSize: { xs: '0.55rem', sm: '0.65rem' } }}>{formErrors.vehicleId}</FormHelperText>}
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <FormControl fullWidth size="small" required error={!!formErrors.driverId}>
                        <InputLabel sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                          Driver *
                        </InputLabel>
                        <Select
                          value={form.driverId}
                          label="Driver *"
                          onChange={(e) => handleFieldChange('driverId', e.target.value)}
                          sx={{ 
                            fontSize: { xs: '0.7rem', sm: '0.75rem' },
                            borderRadius: '8px',
                          }}
                        >
                          <MenuItem value="" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                            <em>Select driver</em>
                          </MenuItem>
                          {drivers.map(d => (
                            <MenuItem key={d.id} value={d.id} sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                              {d.firstName} {d.lastName} - {d.licenseNumber}
                            </MenuItem>
                          ))}
                        </Select>
                        {formErrors.driverId && <FormHelperText sx={{ fontSize: { xs: '0.55rem', sm: '0.65rem' } }}>{formErrors.driverId}</FormHelperText>}
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <FormControl fullWidth size="small">
                        <InputLabel sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                          Supervisor
                        </InputLabel>
                        <Select
                          value={form.supervisorId}
                          label="Supervisor"
                          onChange={(e) => handleFieldChange('supervisorId', e.target.value)}
                          sx={{ 
                            fontSize: { xs: '0.7rem', sm: '0.75rem' },
                            borderRadius: '8px',
                          }}
                        >
                          <MenuItem value="" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                            <em>Select supervisor</em>
                          </MenuItem>
                          {supervisors.map(s => (
                            <MenuItem key={s.id} value={s.id} sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                              {s.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </Paper>

                {/* Commodity & Cargo */}
                <Paper
                  elevation={0}
                  sx={{
                    p: { xs: 1.5, sm: 2, md: 2.5 },
                    borderRadius: { xs: '12px', sm: '16px' },
                    border: '1px solid #ECECEC',
                    bgcolor: '#FFFFFF',
                    width: '100%',
                  }}
                >
                  <Stack direction="row" spacing={0.75} mb={1.5}>
                    <Description sx={{ fontSize: { xs: '0.9rem', sm: '1rem' }, color: '#4F46E5' }} />
                    <Typography 
                      variant="subtitle2" 
                      sx={{ 
                        fontWeight: 600, 
                        fontSize: { xs: '0.7rem', sm: '0.8rem' },
                        color: '#111827',
                      }}
                    >
                      Commodity & Cargo
                    </Typography>
                  </Stack>

                  <Grid container spacing={1.5}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <FormControl fullWidth size="small" required error={!!formErrors.commodityType}>
                        <InputLabel sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                          Commodity Type *
                        </InputLabel>
                        <Select
                          value={form.commodityType}
                          label="Commodity Type *"
                          onChange={(e) => handleFieldChange('commodityType', e.target.value)}
                          sx={{ 
                            fontSize: { xs: '0.7rem', sm: '0.75rem' },
                            borderRadius: '8px',
                          }}
                        >
                          <MenuItem value="" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                            <em>Select commodity</em>
                          </MenuItem>
                          {COMMODITY_OPTIONS.map(c => (
                            <MenuItem key={c} value={c} sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                              {c}
                            </MenuItem>
                          ))}
                        </Select>
                        {formErrors.commodityType && <FormHelperText sx={{ fontSize: { xs: '0.55rem', sm: '0.65rem' } }}>{formErrors.commodityType}</FormHelperText>}
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        label="Cargo Description"
                        value={form.cargoDescription}
                        onChange={(e) => handleFieldChange('cargoDescription', e.target.value)}
                        size="small"
                        sx={{ 
                          '& .MuiInputLabel-root': { fontSize: { xs: '0.65rem', sm: '0.75rem' } },
                          '& .MuiInputBase-root': { fontSize: { xs: '0.7rem', sm: '0.75rem' } },
                        }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <TextField
                        fullWidth
                        label="Weight (kg)"
                        type="number"
                        value={form.cargoWeight}
                        onChange={(e) => handleFieldChange('cargoWeight', e.target.value)}
                        size="small"
                        InputProps={{
                          startAdornment: <InputAdornment position="start"><Scale sx={{ fontSize: { xs: '0.7rem', sm: '0.9rem' } }} /></InputAdornment>,
                          endAdornment: <InputAdornment position="end" sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' } }}>kg</InputAdornment>
                        }}
                        sx={{ 
                          '& .MuiInputLabel-root': { fontSize: { xs: '0.65rem', sm: '0.75rem' } },
                          '& .MuiInputBase-root': { fontSize: { xs: '0.7rem', sm: '0.75rem' } },
                        }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <TextField
                        fullWidth
                        label="Value (ZAR)"
                        type="number"
                        value={form.cargoValue}
                        onChange={(e) => handleFieldChange('cargoValue', e.target.value)}
                        size="small"
                        InputProps={{
                          startAdornment: <InputAdornment position="start"><AttachMoney sx={{ fontSize: { xs: '0.7rem', sm: '0.9rem' } }} /></InputAdornment>
                        }}
                        sx={{ 
                          '& .MuiInputLabel-root': { fontSize: { xs: '0.65rem', sm: '0.75rem' } },
                          '& .MuiInputBase-root': { fontSize: { xs: '0.7rem', sm: '0.75rem' } },
                        }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <TextField
                        fullWidth
                        label="Pallet Count"
                        type="number"
                        value={form.palletCount}
                        onChange={(e) => handleFieldChange('palletCount', e.target.value)}
                        size="small"
                        InputProps={{ 
                          endAdornment: <InputAdornment position="end" sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' } }}>pallets</InputAdornment>
                        }}
                        sx={{ 
                          '& .MuiInputLabel-root': { fontSize: { xs: '0.65rem', sm: '0.75rem' } },
                          '& .MuiInputBase-root': { fontSize: { xs: '0.7rem', sm: '0.75rem' } },
                        }}
                      />
                    </Grid>
                  </Grid>
                </Paper>

                {/* Financial Estimates */}
                <Paper
                  elevation={0}
                  sx={{
                    p: { xs: 1.5, sm: 2, md: 2.5 },
                    borderRadius: { xs: '12px', sm: '16px' },
                    border: '1px solid #ECECEC',
                    bgcolor: '#FFFFFF',
                    width: '100%',
                  }}
                >
                  <Stack direction="row" spacing={0.75} mb={1.5}>
                    <Receipt sx={{ fontSize: { xs: '0.9rem', sm: '1rem' }, color: '#4F46E5' }} />
                    <Typography 
                      variant="subtitle2" 
                      sx={{ 
                        fontWeight: 600, 
                        fontSize: { xs: '0.7rem', sm: '0.8rem' },
                        color: '#111827',
                      }}
                    >
                      Financial Estimates
                    </Typography>
                  </Stack>

                  <Grid container spacing={1.5}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        label="Est. Toll Cost (ZAR)"
                        type="number"
                        value={form.estimatedTollCost}
                        onChange={(e) => handleFieldChange('estimatedTollCost', e.target.value)}
                        size="small"
                        InputProps={{
                          startAdornment: <InputAdornment position="start"><Toll sx={{ fontSize: { xs: '0.7rem', sm: '0.9rem' } }} /></InputAdornment>
                        }}
                        sx={{ 
                          '& .MuiInputLabel-root': { fontSize: { xs: '0.65rem', sm: '0.75rem' } },
                          '& .MuiInputBase-root': { fontSize: { xs: '0.7rem', sm: '0.75rem' } },
                        }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        label="Est. Other Expenses (ZAR)"
                        type="number"
                        value={form.estimatedOtherExpenses}
                        onChange={(e) => handleFieldChange('estimatedOtherExpenses', e.target.value)}
                        size="small"
                        InputProps={{
                          startAdornment: <InputAdornment position="start"><AttachMoney sx={{ fontSize: { xs: '0.7rem', sm: '0.9rem' } }} /></InputAdornment>
                        }}
                        sx={{ 
                          '& .MuiInputLabel-root': { fontSize: { xs: '0.65rem', sm: '0.75rem' } },
                          '& .MuiInputBase-root': { fontSize: { xs: '0.7rem', sm: '0.75rem' } },
                        }}
                      />
                    </Grid>
                  </Grid>
                </Paper>

                {/* Notes */}
                <Paper
                  elevation={0}
                  sx={{
                    p: { xs: 1.5, sm: 2, md: 2.5 },
                    borderRadius: { xs: '12px', sm: '16px' },
                    border: '1px solid #ECECEC',
                    bgcolor: '#FFFFFF',
                    width: '100%',
                  }}
                >
                  <Stack direction="row" spacing={0.75} mb={1.5}>
                    <Comment sx={{ fontSize: { xs: '0.9rem', sm: '1rem' }, color: '#4F46E5' }} />
                    <Typography 
                      variant="subtitle2" 
                      sx={{ 
                        fontWeight: 600, 
                        fontSize: { xs: '0.7rem', sm: '0.8rem' },
                        color: '#111827',
                      }}
                    >
                      Notes
                    </Typography>
                  </Stack>

                  <Grid container spacing={1.5}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        label="Reference Number"
                        value={form.referenceNumber}
                        onChange={(e) => handleFieldChange('referenceNumber', e.target.value)}
                        size="small"
                        helperText="Used to link trips to the same load"
                        sx={{ 
                          '& .MuiInputLabel-root': { fontSize: { xs: '0.65rem', sm: '0.75rem' } },
                          '& .MuiInputBase-root': { fontSize: { xs: '0.7rem', sm: '0.75rem' } },
                        }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        label="Purchase Order Number"
                        value={form.purchaseOrderNumber}
                        onChange={(e) => handleFieldChange('purchaseOrderNumber', e.target.value)}
                        size="small"
                        sx={{ 
                          '& .MuiInputLabel-root': { fontSize: { xs: '0.65rem', sm: '0.75rem' } },
                          '& .MuiInputBase-root': { fontSize: { xs: '0.7rem', sm: '0.75rem' } },
                        }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        fullWidth
                        multiline
                        rows={2}
                        label="Special Instructions"
                        value={form.specialInstructions}
                        onChange={(e) => handleFieldChange('specialInstructions', e.target.value)}
                        size="small"
                        sx={{ 
                          '& .MuiInputLabel-root': { fontSize: { xs: '0.65rem', sm: '0.75rem' } },
                          '& .MuiInputBase-root': { fontSize: { xs: '0.7rem', sm: '0.75rem' } },
                        }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        fullWidth
                        multiline
                        rows={2}
                        label="Driver Notes"
                        value={form.driverNotes}
                        onChange={(e) => handleFieldChange('driverNotes', e.target.value)}
                        size="small"
                        sx={{ 
                          '& .MuiInputLabel-root': { fontSize: { xs: '0.65rem', sm: '0.75rem' } },
                          '& .MuiInputBase-root': { fontSize: { xs: '0.7rem', sm: '0.75rem' } },
                        }}
                      />
                    </Grid>
                  </Grid>
                </Paper>

                {/* Status & Approval */}
                <Paper
                  elevation={0}
                  sx={{
                    p: { xs: 1.5, sm: 2, md: 2.5 },
                    borderRadius: { xs: '12px', sm: '16px' },
                    border: '1px solid #ECECEC',
                    bgcolor: '#FFFFFF',
                    width: '100%',
                  }}
                >
                  <Stack direction="row" spacing={0.75} mb={1.5}>
                    <AssignmentIcon sx={{ fontSize: { xs: '0.9rem', sm: '1rem' }, color: '#4F46E5' }} />
                    <Typography 
                      variant="subtitle2" 
                      sx={{ 
                        fontWeight: 600, 
                        fontSize: { xs: '0.7rem', sm: '0.8rem' },
                        color: '#111827',
                      }}
                    >
                      Status & Approval
                    </Typography>
                  </Stack>

                  <Grid container spacing={1.5}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      {renderSelectField('status', 'Trip Status', statusOptions)}
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      {renderSelectField('approvalStatus', 'Approval Status', approvalOptions)}
                    </Grid>
                  </Grid>
                </Paper>
              </Stack>
            </>
          )}
        </DialogContent>
      </Dialog>
    </LocalizationProvider>
  );
}

export default TripForm;
