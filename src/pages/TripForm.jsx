// src/pages/TripForm.jsx (Using centralized MUI imports)
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import dayjs from 'dayjs';

// Import all MUI components from centralized file
import Mui, { 
  MuiCore, 
  MuiIcons, 
  MuiLab, 
  MuiX, 
  MuiStyled, 
  MuiColors 
} from '../styles/muiImports';

// Destructure for convenience
const {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Stack,
  Grid,
  Switch,
  FormControlLabel,
  Tabs,
  Tab,
  Card,
  CardContent,
  Divider,
  Autocomplete,
  FormHelperText,
  InputAdornment,
  Checkbox
} = MuiCore;

const {
  SaveIcon,
  CloseIcon,
  DeleteIcon,
  EditIcon,
  AddIcon,
  RefreshIcon,
  SearchIcon,
  AssignmentIcon,
  ScheduleIcon,
  DirectionsCarIcon,
  DescriptionIcon,
  LocationOnIcon,
  SwapHorizIcon,
  ScaleIcon,
  AttachMoneyIcon,
  CommentIcon,
  TollIcon,
  ReceiptIcon,
  BusinessIcon,
  WarehouseIcon,
  RouteIcon
} = MuiIcons;

const { LoadingButton, LocalizationProvider, DateTimePicker, DatePicker, TimePicker } = MuiLab;
const { DataGrid, AdapterDayjs } = MuiX;
const { styled, alpha } = MuiStyled;
const { colors } = MuiColors;

// Import services
import { tripService } from '../services/tripService';
import { driverService } from '../services/driverService';
import { vehicleService } from '../services/vehicleService';
import { routingService } from '../services/routingService';
import { customerService } from '../services/customerService';
import { depotService } from '../services/depotService';
import { enumService } from '../services/enumService';

// Import styles
import { formStyles, pageStyles, dialogStyles } from '../styles/formStyles';

// ============================================================
// CONSTANTS & CONFIGURATIONS
// ============================================================

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

// ============================================================
// HELPER FUNCTIONS
// ============================================================

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

// ============================================================
// COMPONENT: EnumSelect
// ============================================================

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
      
      if (!value && activeOptions.length > 0) {
        const defaultOption = activeOptions.find(opt => opt.isDefault);
        if (defaultOption && onChange) {
          onChange(defaultOption.code);
        }
      }
    } catch (err) {
      console.error(`Failed to load ${moduleName}/${category} enums:`, err);
      setLocalError('Failed to load options');
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
    <FormControl 
      fullWidth 
      size="small" 
      required={required} 
      error={error || !!localError} 
      disabled={disabled || isLoading}
      sx={formStyles.formControl.sx}
    >
      <InputLabel sx={formStyles.label}>
        {label || `${category.charAt(0).toUpperCase() + category.slice(1)}`}
      </InputLabel>
      <Select
        value={value || ''}
        label={label || `${category.charAt(0).toUpperCase() + category.slice(1)}`}
        onChange={(e) => onChange(e.target.value)}
        sx={formStyles.select.sx}
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
        <MenuItem value="" sx={formStyles.menuItem.sx}>
          <em>Select {category}</em>
        </MenuItem>
        {options.map((option) => (
          <MenuItem key={option.code} value={option.code} sx={formStyles.menuItem.sx}>
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
                  sx={formStyles.chip.sx}
                />
              )}
            </Stack>
          </MenuItem>
        ))}
      </Select>
      {helperText && <FormHelperText sx={formStyles.helperText}>{helperText}</FormHelperText>}
      {localError && <FormHelperText error sx={formStyles.errorHelper}>{localError}</FormHelperText>}
    </FormControl>
  );
}

// ============================================================
// COMPONENT: AddressSection (Using centralized imports)
// ============================================================

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
          <LocationOnIcon fontSize="small" color="primary" sx={formStyles.icon} />
          <Typography variant="subtitle2" fontWeight="600" sx={{ fontSize: '0.8rem' }}>
            {label}
          </Typography>
          {address.latitude && address.longitude && (
            <Chip 
              size="small" 
              label="📍 Geocoded" 
              color="success" 
              variant="outlined"
              sx={formStyles.chip.sx}
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
              sx={formStyles.textField.sx}
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
                  sx={formStyles.textField.sx}
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
              sx={formStyles.textField.sx}
            />
          </Grid>

          <Grid item xs={6} md={3}>
            <FormControl fullWidth size="small" error={!!errors.province}>
              <InputLabel sx={formStyles.label}>Province</InputLabel>
              <Select
                value={address.province || ''}
                label="Province"
                onChange={(e) => onChange({ ...address, province: e.target.value })}
                disabled={disabled}
                sx={formStyles.select.sx}
              >
                <MenuItem value="" sx={formStyles.menuItem.sx}>Select province</MenuItem>
                {PROVINCES.map(p => (
                  <MenuItem key={p} value={p} sx={formStyles.menuItem.sx}>{p}</MenuItem>
                ))}
              </Select>
              {errors.province && <FormHelperText sx={formStyles.helperText}>{errors.province}</FormHelperText>}
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
                sx={formStyles.textField.sx}
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
                sx={formStyles.textField.sx}
              />
            </Stack>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}

// ============================================================
// COMPONENT: DepotSection (Using centralized imports)
// ============================================================

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
              <InputLabel sx={formStyles.label}>Departed From</InputLabel>
              <Select
                value={departureType}
                label="Departed From"
                onChange={(e) => onDepartureTypeChange(e.target.value)}
                sx={formStyles.select.sx}
              >
                {DEPARTURE_OPTIONS.map(option => (
                  <MenuItem key={option.value} value={option.value} sx={formStyles.menuItem.sx}>
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
                  <InputLabel sx={formStyles.label}>Select Depot</InputLabel>
                  <Select
                    value={selectedDepot?.id || ''}
                    label="Select Depot"
                    onChange={(e) => {
                      const depot = depots.find(d => d.id === e.target.value);
                      onDepotSelect(depot);
                    }}
                    sx={formStyles.select.sx}
                  >
                    <MenuItem value="" sx={formStyles.menuItem.sx}>
                      <em>Select depot</em>
                    </MenuItem>
                    {depots.map(depot => (
                      <MenuItem key={depot.id} value={depot.id} sx={formStyles.menuItem.sx}>
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
                    sx={formStyles.textField.sx}
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
                sx={formStyles.textField.sx}
              />
            </Grid>
          )}

          {departureType === 'LAST_DROP' && (
            <Grid item xs={12} md={8}>
              <Alert severity="info" sx={formStyles.alert.sx}>
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

// ============================================================
// MAIN COMPONENT: TripForm
// ============================================================

function TripForm({ open = false, onClose, mode = 'create', initialData, onSuccess, fetchTrips }) {
  // [Rest of the TripForm implementation remains the same as before]
  // ... (all the state, hooks, and handlers)
  
  // For brevity, I'm showing the main render section with centralized imports
  
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Dialog 
        open={open} 
        onClose={onClose} 
        maxWidth="lg" 
        fullWidth
        PaperProps={dialogStyles.paper}
      >
        <DialogTitle sx={dialogStyles.title.sx}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography sx={dialogStyles.titleText.sx}>
              {mode === 'create' ? 'Create New Trip' : 'Edit Trip'}
            </Typography>
            {enumsLoading && <CircularProgress size={20} />}
          </Stack>
        </DialogTitle>

        <DialogContent dividers sx={dialogStyles.content.sx}>
          {/* Content */}
        </DialogContent>

        <DialogActions sx={dialogStyles.actions.sx}>
          <Button 
            startIcon={<CloseIcon />} 
            onClick={onClose} 
            disabled={submitting}
            sx={formStyles.button.sx}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            startIcon={submitting ? <CircularProgress size={18} /> : <SaveIcon />}
            disabled={submitting || loading || isSuccess}
            sx={formStyles.primaryButton.sx}
          >
            {submitting ? 'Saving...' : isSuccess ? '✓ Saved' : (mode === 'create' ? 'Create Trip' : 'Update Trip')}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
}

export default TripForm;
