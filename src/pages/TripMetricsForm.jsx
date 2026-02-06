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
  Tooltip,
  Stack,
  IconButton,
  CircularProgress,
  Chip,
  InputAdornment,
  Divider
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

  /* ---------- hydrate on open ---------- */

  useEffect(() => {
    if (!open) return;

    setVehicleType(inferVehicleType(vehicleInfo));

    const hydrated = {
      originLocation:
        originLocation || initialMetrics?.originLocation || '',
      destinationLocation:
        destinationLocation || initialMetrics?.destinationLocation || '',
      totalDistance:
        (initialMetrics?.totalDistance ??
          initialMetrics?.totalDistanceKm ??
          '')?.toString(),
      estimatedDuration:
        (initialMetrics?.estimatedDuration ??
          initialMetrics?.totalDurationHours ??
          '')?.toString(),
      fuelConsumption:
        (initialMetrics?.estimatedFuel ??
          initialMetrics?.fuelConsumption ??
          initialMetrics?.fuelUsedLiters ??
          '')?.toString(),
      estimatedCost:
        (initialMetrics?.estimatedCost ??
          initialMetrics?.costAmount ??
          '')?.toString(),
      delays: initialMetrics?.delays || '',
      incidents: initialMetrics?.incidents || ''
    };

    setFormData(hydrated);
    setCalculatedMetrics(null);
    setRouteError('');
  }, [open, initialMetrics, originLocation, destinationLocation, vehicleInfo]);

  /* ---------- calculate route ---------- */

  const calculateMetrics = async () => {
    if (!formData.originLocation || !formData.destinationLocation) {
      setRouteError('Please enter both origin and destination locations');
      return;
    }

    try {
      setCalculating(true);
      setRouteError('');

      const dto = await tripService.calculateTripMetrics(
        formData.originLocation,
        formData.destinationLocation,
        vehicleType,
        tripId
      );

      setCalculatedMetrics(dto);

      // Auto-fill form but keep editable
      setFormData(prev => ({
        ...prev,
        totalDistance: dto.totalDistanceKm?.toString() || '',
        estimatedDuration: dto.totalDurationHours?.toString() || '',
        fuelConsumption: dto.fuelUsedLiters?.toString() || '',
        estimatedCost: dto.costAmount?.toString() || ''
      }));

    } catch (err) {
      setRouteError(err?.response?.data?.error || err.message);
    } finally {
      setCalculating(false);
    }
  };

  /* ---------- save metrics ---------- */

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      await tripService.saveTripMetrics(tripId, {
        totalDistance: parseFloat(formData.totalDistance) || 0,
        estimatedDuration: parseFloat(formData.estimatedDuration) || 0,
        estimatedFuel: parseFloat(formData.fuelConsumption) || 0,
        estimatedCost: parseFloat(formData.estimatedCost) || 0,
        delays: formData.delays,
        incidents: formData.incidents
      });

      onSuccess?.();
      onClose?.();

    } catch (err) {
      setRouteError(err?.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ---------- calculated summary card ---------- */

  const renderSummary = useMemo(() => {
    if (!calculatedMetrics) return null;

    return (
      <Card variant="outlined" sx={{ mb: 3, borderColor: 'success.main', borderWidth: 2 }}>
        <CardHeader
          title={
            <Stack direction="row" spacing={1} alignItems="center">
              <RadarIcon color="primary" />
              <Typography variant="h6">
                Auto Calculated Route Summary
              </Typography>
              <Tooltip title="Calculated using OpenRouteService (OSM)">
                <IconButton size="small">
                  <InfoIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          }
          action={
            <Chip label="System Generated" color="success" variant="outlined" />
          }
        />
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard
                icon={<RadarIcon color="primary" />}
                value={calculatedMetrics.totalDistanceKm?.toFixed(1)}
                label="Distance (km)"
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <MetricCard
                icon={<TimeIcon color="primary" />}
                value={formatDuration(calculatedMetrics.totalDurationHours)}
                label="Duration"
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <MetricCard
                icon={<FuelIcon color="primary" />}
                value={calculatedMetrics.fuelUsedLiters?.toFixed(1)}
                label="Fuel (L)"
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <MetricCard
                icon={<MoneyIcon color="primary" />}
                value={`R ${calculatedMetrics.costAmount?.toFixed(2)}`}
                label="Estimated Cost"
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  }, [calculatedMetrics]);

  if (!open) return null;

  return (
    <Dialog open={open} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Stack direction="row" spacing={1} alignItems="center">
          <CalculatorIcon />
          <Typography variant="h6">
            Trip Metrics {tripId && `#${tripId}`}
          </Typography>
        </Stack>
      </DialogTitle>

      <DialogContent dividers>

        {routeError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {routeError}
          </Alert>
        )}

        {/* Locations + Calculate */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Origin Location"
              value={formData.originLocation}
              onChange={(e) =>
                setFormData({ ...formData, originLocation: e.target.value })
              }
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Destination Location"
              value={formData.destinationLocation}
              onChange={(e) =>
                setFormData({ ...formData, destinationLocation: e.target.value })
              }
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Vehicle Type</InputLabel>
              <Select
                value={vehicleType}
                label="Vehicle Type"
                onChange={(e) => setVehicleType(e.target.value)}
              >
                {VEHICLE_TYPES.map(type => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <Button
              fullWidth
              variant="contained"
              onClick={calculateMetrics}
              disabled={calculating}
              startIcon={calculating ? <CircularProgress size={20} /> : <CalculatorIcon />}
            >
              {calculating ? 'Calculating...' : 'Calculate Route'}
            </Button>
          </Grid>
        </Grid>

        {renderSummary}

        <Divider sx={{ mb: 3 }} />

        {/* Editable Actual Metrics */}
        <Typography variant="subtitle1" sx={{ mb: 2 }}>
          Actual / Editable Metrics
        </Typography>

        <Grid container spacing={2}>
          {[
            { key: 'totalDistance', label: 'Distance (km)' },
            { key: 'estimatedDuration', label: 'Duration (hrs)' },
            { key: 'fuelConsumption', label: 'Fuel (L)' },
            { key: 'estimatedCost', label: 'Cost (R)' }
          ].map(field => (
            <Grid item xs={12} md={3} key={field.key}>
              <TextField
                fullWidth
                label={field.label}
                value={formData[field.key]}
                onChange={(e) =>
                  setFormData({ ...formData, [field.key]: e.target.value })
                }
              />
            </Grid>
          ))}
        </Grid>

      </DialogContent>

      <DialogActions>
        <Button startIcon={<CloseIcon />} onClick={onClose}>
          Cancel
        </Button>

        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
        >
          {loading ? 'Saving...' : 'Save Metrics'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

/* ---------- small metric card component ---------- */

const MetricCard = ({ icon, value, label }) => (
  <Card variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
    <Stack spacing={1} alignItems="center">
      {icon}
      <Typography variant="h6" fontWeight="bold">
        {value || '0'}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
    </Stack>
  </Card>
);

export default TripMetricsForm;
