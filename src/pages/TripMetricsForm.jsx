import React, { useEffect, useState, useCallback } from 'react';
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
  LinearProgress,
  Chip
} from '@mui/material';
import {
  Calculate as CalculatorIcon,
  Place as LocationIcon,
  Info as InfoIcon,
  DirectionsCar as CarIcon,
  AccessTime as TimeIcon,
  AttachMoney as MoneyIcon,
  Timeline as RadarIcon,
  Refresh as RefreshIcon,
  LocalGasStation as FuelIcon,
  Speed as SpeedIcon,
  Warning as WarningIcon,
  Save as SaveIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { NumericFormat } from 'react-number-format';
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
  const minutes = Math.round(hours * 60);
  const d = Math.floor(minutes / 1440);
  const h = Math.floor((minutes % 1440) / 60);
  const m = minutes % 60;

  return [
    d > 0 && `${d}d`,
    h > 0 && `${h}h`,
    m > 0 && d === 0 && `${m}m`
  ].filter(Boolean).join(' ') || '0h';
};

const VEHICLE_TYPES = [
  { value: 'TRUCK', label: 'Truck', icon: <CarIcon fontSize="small" /> },
  { value: 'TRAILER', label: 'Trailer', icon: <CarIcon fontSize="small" /> },
  { value: 'VAN', label: 'Van', icon: <CarIcon fontSize="small" /> },
  { value: 'CAR', label: 'Car', icon: <CarIcon fontSize="small" /> }
];

/* -------------------- component -------------------- */

const TripMetricsForm = ({
  open,
  onClose,
  onSuccess,
  tripId,
  initialMetrics,
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
  useEffect(() => {
    if (!open) return;

    setCalculatedMetrics(null);
    setRouteError('');
    setVehicleType(inferVehicleType(vehicleInfo));

    const initialValues = {
      originLocation: originLocation || initialMetrics?.originLocation || '',
      destinationLocation: destinationLocation || initialMetrics?.destinationLocation || '',
      totalDistance: initialMetrics?.totalDistance || '',
      estimatedDuration: initialMetrics?.estimatedDuration || '',
      fuelConsumption: initialMetrics?.estimatedFuel || '',
      estimatedCost: initialMetrics?.estimatedCost || '',
      delays: initialMetrics?.delays || '',
      incidents: initialMetrics?.incidents || ''
    };

    setFormData(initialValues);
  }, [open, initialMetrics, originLocation, destinationLocation, vehicleInfo]);

  /* ---------- calculate ---------- */
  const calculateMetrics = useCallback(async () => {
    setCalculating(true);
    setRouteError('');

    try {
      const dto = await tripService.calculateTripMetrics(
        formData.originLocation,
        formData.destinationLocation,
        vehicleType,
        tripId
      );

      setFormData(prev => ({
        ...prev,
        totalDistance: dto.totalDistanceKm || '',
        estimatedDuration: dto.totalDurationHours || '',
        fuelConsumption: dto.fuelUsedLiters || '',
        estimatedCost: dto.costAmount || ''
      }));

      setCalculatedMetrics(dto);
    } catch {
      setRouteError('Unable to calculate route. Please check the locations and try again.');
    } finally {
      setCalculating(false);
    }
  }, [formData.originLocation, formData.destinationLocation, vehicleType, tripId]);

  /* ---------- save ---------- */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await tripService.saveTripMetrics(tripId, {
        totalDistance: Number(formData.totalDistance),
        estimatedDuration: Number(formData.estimatedDuration),
        estimatedFuel: Number(formData.fuelConsumption),
        estimatedCost: Number(formData.estimatedCost),
        delays: formData.delays,
        incidents: formData.incidents
      });

      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Failed to save metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  /* ---------- form handlers ---------- */
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  /* ---------- render summary ---------- */
  const renderSummary = () => {
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
                    {calculatedMetrics.totalDistanceKm?.toFixed(1) || '0'}
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
                    {calculatedMetrics.fuelUsedLiters?.toFixed(1) || '0'}
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
                    R {calculatedMetrics.costAmount?.toFixed(2) || '0'}
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
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
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

      <DialogContent dividers>
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

        <Box component="form" onSubmit={handleSubmit}>
          <Alert 
            severity="info" 
            icon={<InfoIcon />}
            sx={{ mb: 3 }}
          >
            <Typography variant="body2">
              Using OpenStreetMap via OpenRouteService for free route calculation
            </Typography>
          </Alert>

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
                    InputProps={{
                      startAdornment: <LocationIcon fontSize="small" sx={{ mr: 1, color: 'action.active' }} />
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
                    InputProps={{
                      startAdornment: <LocationIcon fontSize="small" sx={{ mr: 1, color: 'action.active' }} />
                    }}
                    size="small"
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Vehicle Type</InputLabel>
                    <Select
                      value={vehicleType}
                      onChange={(e) => setVehicleType(e.target.value)}
                      label="Vehicle Type"
                      startAdornment={<CarIcon fontSize="small" sx={{ mr: 1 }} />}
                    >
                      {VEHICLE_TYPES.map(type => (
                        <MenuItem key={type.value} value={type.value}>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            {type.icon}
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

              {routeError && (
                <Alert 
                  severity="error" 
                  icon={<WarningIcon />}
                  sx={{ mt: 2 }}
                >
                  {routeError}
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Calculated Summary */}
          {renderSummary()}

          {/* Metrics Input */}
          <Card variant="outlined">
            <CardHeader 
              title="Metrics Details" 
              titleTypographyProps={{ variant: 'subtitle1' }}
            />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <NumericFormat
                    customInput={TextField}
                    label="Distance (km)"
                    value={formData.totalDistance}
                    onValueChange={(values) => handleInputChange('totalDistance', values.value)}
                    decimalScale={1}
                    allowNegative={false}
                    fullWidth
                    size="small"
                    required
                    InputProps={{
                      endAdornment: 'km'
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <NumericFormat
                    customInput={TextField}
                    label="Duration (hours)"
                    value={formData.estimatedDuration}
                    onValueChange={(values) => handleInputChange('estimatedDuration', values.value)}
                    decimalScale={1}
                    allowNegative={false}
                    fullWidth
                    size="small"
                    required
                    InputProps={{
                      endAdornment: 'h'
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <NumericFormat
                    customInput={TextField}
                    label="Fuel (liters)"
                    value={formData.fuelConsumption}
                    onValueChange={(values) => handleInputChange('fuelConsumption', values.value)}
                    decimalScale={1}
                    allowNegative={false}
                    fullWidth
                    size="small"
                    required
                    InputProps={{
                      endAdornment: 'L'
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <NumericFormat
                    customInput={TextField}
                    label="Estimated Cost"
                    value={formData.estimatedCost}
                    onValueChange={(values) => handleInputChange('estimatedCost', values.value)}
                    decimalScale={2}
                    prefix="R "
                    allowNegative={false}
                    fullWidth
                    size="small"
                    InputProps={{
                      startAdornment: <MoneyIcon fontSize="small" sx={{ mr: 1 }} />
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Delays"
                    value={formData.delays}
                    onChange={(e) => handleInputChange('delays', e.target.value)}
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
          disabled={loading}
        >
          Cancel
        </Button>
        
        <Button
          variant="contained"
          startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
          onClick={handleSubmit}
          disabled={loading || !formData.totalDistance || !formData.estimatedDuration}
        >
          {loading ? 'Saving...' : 'Save Metrics'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TripMetricsForm;
