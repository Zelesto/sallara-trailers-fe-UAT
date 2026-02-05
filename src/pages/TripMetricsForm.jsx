import React, { useEffect, useState, useCallback, useMemo } from 'react';
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
  CardHeader,
  Alert,
  Typography,
  Box,
  Tabs,
  Tab,
  Divider,
  Tooltip,
  Stack,
  IconButton,
  CircularProgress,
  Chip,
  InputAdornment
} from '@mui/material';
import {
  Calculate as CalculatorIcon,
  Place as LocationIcon,
  Info as InfoIcon,
  DirectionsCar as CarIcon,
  AccessTime as TimeIcon,
  AttachMoney as MoneyIcon,
  Timeline as RadarIcon,
  LocalGasStation as FuelIcon,
  Warning as WarningIcon,
  Save as SaveIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { tripService } from '../services/tripService';

/* -------------------- helpers -------------------- */

const inferVehicleType = (vehicle) => {
  if (!vehicle) return 'TRUCK';
  const mm = `${vehicle.make || ''} ${vehicle.model || ''}`.toUpperCase();

  if (mm.includes('TRAILER') || mm.includes('SEMI')) return 'TRAILER';
  if (mm.includes('VAN') || mm.includes('BAKKIE')) return 'VAN';
  if (mm.includes('CAR') || mm.includes('SEDAN') || mm.includes('HATCH')) return 'CAR';
  return 'TRUCK';
};

const formatDuration = (hours = 0) => {
  if (!hours || isNaN(hours)) return '0h';
  
  const minutes = Math.round(hours * 60);
  const d = Math.floor(minutes / 1440);
  const h = Math.floor((minutes % 1440) / 60);
  const m = minutes % 60;

  const parts = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0 && d === 0) parts.push(`${m}m`);
  
  return parts.join(' ') || '0h';
};

const VEHICLE_TYPES = [
  { value: 'TRUCK', label: 'Truck' },
  { value: 'TRAILER', label: 'Trailer' },
  { value: 'VAN', label: 'Van' },
  { value: 'CAR', label: 'Car' }
];

/* -------------------- component -------------------- */

const TripMetricsForm = ({ 
  open = false, 
  onClose, 
  onSuccess, 
  tripId, 
  initialMetrics = {}, 
  originLocation = '', 
  destinationLocation = '', 
  vehicleInfo 
}) => {
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [vehicleType, setVehicleType] = useState('TRUCK');
  const [calculatedMetrics, setCalculatedMetrics] = useState(null);
  const [routeError, setRouteError] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  
  const [formData, setFormData] = useState({
    originLocation: '',
    destinationLocation: '',
    totalDistance: '',
    estimatedDuration: '',
    fuelConsumption: '',
    estimatedCost: '',
    delays: '',
    incidents: ''
  });

  /* ---------- modal lifecycle ---------- */
  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!open) {
      // Reset state when dialog closes
      const timer = setTimeout(() => {
        setFormData({
          originLocation: '',
          destinationLocation: '',
          totalDistance: '',
          estimatedDuration: '',
          fuelConsumption: '',
          estimatedCost: '',
          delays: '',
          incidents: ''
        });
        setCalculatedMetrics(null);
        setRouteError('');
        setVehicleType('TRUCK');
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Initialize form when dialog opens
  useEffect(() => {
    if (!open) return;

    const vehicleTypeValue = inferVehicleType(vehicleInfo);
    setVehicleType(vehicleTypeValue);

    const initialValues = {
      originLocation: originLocation || initialMetrics?.originLocation || '',
      destinationLocation: destinationLocation || initialMetrics?.destinationLocation || '',
      totalDistance: initialMetrics?.totalDistance?.toString() || '',
      estimatedDuration: initialMetrics?.estimatedDuration?.toString() || '',
      fuelConsumption: initialMetrics?.estimatedFuel?.toString() || '',
      estimatedCost: initialMetrics?.estimatedCost?.toString() || '',
      delays: initialMetrics?.delays || '',
      incidents: initialMetrics?.incidents || ''
    };

    setFormData(initialValues);
    setCalculatedMetrics(null);
    setRouteError('');
  }, [open, initialMetrics, originLocation, destinationLocation, vehicleInfo]);

  /* ---------- calculate ---------- */
  const calculateMetrics = useCallback(async () => {
    if (!formData.originLocation || !formData.destinationLocation) {
      setRouteError('Please enter both origin and destination locations');
      return;
    }

    setCalculating(true);
    setRouteError('');

    try {
      const dto = await tripService.calculateTripMetrics(
        formData.originLocation,
        formData.destinationLocation,
        vehicleType,
        tripId
      );

      if (!dto) {
        throw new Error('No response from calculation service');
      }

      const updatedFormData = {
        ...formData,
        totalDistance: dto.totalDistanceKm?.toString() || '',
        estimatedDuration: dto.totalDurationHours?.toString() || '',
        fuelConsumption: dto.fuelUsedLiters?.toString() || '',
        estimatedCost: dto.costAmount?.toString() || ''
      };

      setFormData(updatedFormData);
      setCalculatedMetrics(dto);
    } catch (err) {
      console.error('Calculation error:', err);
      setRouteError(err.message || 'Unable to calculate route. Please check the locations and try again.');
    } finally {
      setCalculating(false);
    }
  }, [formData, vehicleType, tripId]);

  /* ---------- save ---------- */
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.totalDistance || !formData.estimatedDuration || !formData.fuelConsumption) {
      setRouteError('Please fill in all required metrics (distance, duration, and fuel)');
      return;
    }

    setLoading(true);
    
    try {
      const payload = {
        totalDistance: parseFloat(formData.totalDistance) || 0,
        estimatedDuration: parseFloat(formData.estimatedDuration) || 0,
        estimatedFuel: parseFloat(formData.fuelConsumption) || 0,
        estimatedCost: parseFloat(formData.estimatedCost) || 0,
        delays: formData.delays || '',
        incidents: formData.incidents || ''
      };

      await tripService.saveTripMetrics(tripId, payload);
      onSuccess?.();
      if (onClose) onClose();
    } catch (err) {
      console.error('Save error:', err);
      setRouteError(err.response?.data?.error || err.message || 'Failed to save metrics');
    } finally {
      setLoading(false);
    }
  }, [formData, tripId, onSuccess, onClose]);

  /* ---------- form handlers ---------- */
  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (routeError) setRouteError('');
  }, [routeError]);

  const handleNumberChange = useCallback((field, value) => {
    // Allow only numbers and one decimal point
    const numericValue = value.replace(/[^\d.]/g, '');
    const parts = numericValue.split('.');
    
    if (parts.length > 2) {
      // If more than one decimal point, keep only the first
      const filteredValue = parts[0] + '.' + parts.slice(1).join('');
      setFormData(prev => ({ ...prev, [field]: filteredValue }));
    } else {
      setFormData(prev => ({ ...prev, [field]: numericValue }));
    }
    
    if (routeError) setRouteError('');
  }, [routeError]);

  /* ---------- render summary ---------- */
  const renderSummary = useMemo(() => {
    if (!calculatedMetrics) return null;

    return (
      <Card 
        variant="outlined" 
        sx={{ 
          mb: 3, 
          borderColor: 'success.main',
          borderWidth: 2
        }}
      >
        <CardHeader
          title={
            <Stack direction="row" alignItems="center" spacing={1}>
              <RadarIcon color="primary" />
              <Typography variant="h6">Calculated Route Summary</Typography>
              <Tooltip title="Calculated using OpenRouteService (OSM)">
                <IconButton size="small">
                  <InfoIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          }
          action={
            <Chip 
              label="OpenRouteService" 
              size="small" 
              color="info" 
              variant="outlined"
            />
          }
        />
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Card variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                <Stack spacing={1} alignItems="center">
                  <RadarIcon color="primary" />
                  <Typography variant="h5" fontWeight="bold">
                    {calculatedMetrics.totalDistanceKm?.toFixed(1) || '0.0'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Distance (km)
                  </Typography>
                </Stack>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                <Stack spacing={1} alignItems="center">
                  <TimeIcon color="primary" />
                  <Typography variant="h5" fontWeight="bold">
                    {formatDuration(calculatedMetrics.totalDurationHours)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Duration
                  </Typography>
                </Stack>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                <Stack spacing={1} alignItems="center">
                  <FuelIcon color="primary" />
                  <Typography variant="h5" fontWeight="bold">
                    {calculatedMetrics.fuelUsedLiters?.toFixed(1) || '0.0'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Fuel (L)
                  </Typography>
                </Stack>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                <Stack spacing={1} alignItems="center">
                  <MoneyIcon color="primary" />
                  <Typography variant="h5" fontWeight="bold">
                    R {calculatedMetrics.costAmount?.toFixed(2) || '0.00'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Estimated Cost
                  </Typography>
                </Stack>
              </Card>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  }, [calculatedMetrics]);

  // Handle dialog close with validation
  const handleDialogClose = useCallback((event, reason) => {
    if (reason === 'backdropClick' && (loading || calculating)) {
      return; // Prevent closing when loading or calculating
    }
    if (onClose) onClose();
  }, [onClose, loading, calculating]);

  // Generate form ID for accessibility
  const formId = useMemo(() => `trip-metrics-form-${Date.now()}`, []);

  if (!open) return null;

  return (
    <Dialog
      open={open}
      onClose={handleDialogClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { maxHeight: '90vh' }
      }}
    >
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={1}>
          <CalculatorIcon color="primary" />
          <Typography variant="h6">
            Trip Metrics
            {tripId && (
              <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                #{tripId}
              </Typography>
            )}
          </Typography>
        </Stack>
      </DialogTitle>

      <DialogContent dividers sx={{ overflowY: 'auto' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs 
            value={activeTab} 
            onChange={(e, newValue) => setActiveTab(newValue)}
            aria-label="trip metrics tabs"
          >
            <Tab 
              label="Auto Calculator" 
              icon={<CalculatorIcon />} 
              iconPosition="start"
            />
          </Tabs>
        </Box>

        <Box component="form" id={formId} onSubmit={handleSubmit}>
          <Alert 
            severity="info" 
            icon={<InfoIcon />}
            sx={{ mb: 3 }}
          >
            <Typography variant="body2">
              Using OpenStreetMap via OpenRouteService for free route calculation
            </Typography>
          </Alert>

          {/* Error Alert */}
          {routeError && (
            <Alert 
              severity="error" 
              sx={{ mb: 3 }}
              onClose={() => setRouteError('')}
            >
              {routeError}
            </Alert>
          )}

          {/* Trip Locations */}
          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardHeader 
              title="Trip Locations" 
              titleTypographyProps={{ variant: 'subtitle1' }}
            />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Origin Location"
                    value={formData.originLocation}
                    onChange={(e) => handleInputChange('originLocation', e.target.value)}
                    required
                    disabled={calculating}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LocationIcon fontSize="small" />
                        </InputAdornment>
                      )
                    }}
                    size="small"
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Destination Location"
                    value={formData.destinationLocation}
                    onChange={(e) => handleInputChange('destinationLocation', e.target.value)}
                    required
                    disabled={calculating}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LocationIcon fontSize="small" />
                        </InputAdornment>
                      )
                    }}
                    size="small"
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControl fullWidth size="small" disabled={calculating}>
                    <InputLabel>Vehicle Type</InputLabel>
                    <Select
                      value={vehicleType}
                      onChange={(e) => setVehicleType(e.target.value)}
                      label="Vehicle Type"
                      startAdornment={
                        <InputAdornment position="start">
                          <CarIcon fontSize="small" />
                        </InputAdornment>
                      }
                    >
                      {VEHICLE_TYPES.map(type => (
                        <MenuItem key={type.value} value={type.value}>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <CarIcon fontSize="small" />
                            <Typography>{type.label}</Typography>
                          </Stack>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={calculating ? <CircularProgress size={20} /> : <CalculatorIcon />}
                    onClick={calculateMetrics}
                    disabled={calculating || !formData.originLocation || !formData.destinationLocation}
                    sx={{ height: '40px' }}
                  >
                    {calculating ? 'Calculating...' : 'Calculate Route'}
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Calculated Summary */}
          {renderSummary}

          {/* Metrics Input */}
          <Card variant="outlined">
            <CardHeader 
              title="Metrics Details" 
              titleTypographyProps={{ variant: 'subtitle1' }}
            />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="Distance"
                    value={formData.totalDistance}
                    onChange={(e) => handleNumberChange('totalDistance', e.target.value)}
                    required
                    disabled={loading}
                    size="small"
                    InputProps={{
                      endAdornment: <InputAdornment position="end">km</InputAdornment>
                    }}
                    placeholder="0.0"
                  />
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="Duration"
                    value={formData.estimatedDuration}
                    onChange={(e) => handleNumberChange('estimatedDuration', e.target.value)}
                    required
                    disabled={loading}
                    size="small"
                    InputProps={{
                      endAdornment: <InputAdornment position="end">hours</InputAdornment>
                    }}
                    placeholder="0.0"
                  />
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="Fuel Consumption"
                    value={formData.fuelConsumption}
                    onChange={(e) => handleNumberChange('fuelConsumption', e.target.value)}
                    required
                    disabled={loading}
                    size="small"
                    InputProps={{
                      endAdornment: <InputAdornment position="end">L</InputAdornment>
                    }}
                    placeholder="0.0"
                  />
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="Estimated Cost"
                    value={formData.estimatedCost}
                    onChange={(e) => handleNumberChange('estimatedCost', e.target.value)}
                    disabled={loading}
                    size="small"
                    InputProps={{
                      startAdornment: <InputAdornment position="start">R</InputAdornment>
                    }}
                    placeholder="0.00"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Delays"
                    value={formData.delays}
                    onChange={(e) => handleInputChange('delays', e.target.value)}
                    disabled={loading}
                    size="small"
                    multiline
                    rows={2}
                    placeholder="Any delays encountered..."
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Incidents"
                    value={formData.incidents}
                    onChange={(e) => handleInputChange('incidents', e.target.value)}
                    disabled={loading}
                    size="small"
                    multiline
                    rows={2}
                    placeholder="Any incidents reported..."
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Button 
          startIcon={<CloseIcon />} 
          onClick={onClose}
          disabled={loading || calculating}
        >
          Cancel
        </Button>
        
        <Button
          variant="contained"
          type="submit"
          form={formId}
          startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
          disabled={loading || calculating || !formData.totalDistance || !formData.estimatedDuration || !formData.fuelConsumption}
        >
          {loading ? 'Saving...' : 'Save Metrics'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TripMetricsForm;
