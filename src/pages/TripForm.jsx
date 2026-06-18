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
  IconButton
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
  Receipt,
  Toll
} from '@mui/icons-material';

import { LocalizationProvider, DateTimePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

import { tripService } from '../services/tripService';
import { driverService } from '../services/driverService';
import { vehicleService } from '../services/vehicleService';
import { routingService } from '../services/routingService';

/* ===================== Helpers ===================== */

const safeNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

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

const TRIP_TYPE_OPTIONS = ['FREIGHT', 'RETURN', 'EMPTY', 'MAINTENANCE'];

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

const PROVINCES = [
  'Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal',
  'Limpopo', 'Mpumalanga', 'Northern Cape', 'North West', 'Western Cape'
];

/* ===================== Address Section ===================== */

function AddressSection({ label, address, onChange }) {
  const [citySuggestions, setCitySuggestions] = useState([]);
  const debounceRef = useRef(null);

  const fetchCities = async (query) => {
    if (!query || query.length < 2) return;
    try {
      const res = await routingService.suggestCities(query);
      setCitySuggestions(res || []);
    } catch {
      setCitySuggestions([]);
    }
  };

  const handleCityInput = (_, value) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchCities(value), 300);
  };

  const handleCitySelect = (_, value) => {
    if (!value) return;
    onChange({
      ...address,
      city: value.city || value,
      province: value.province || address.province,
      zipCode: value.zipCode || address.zipCode
    });
  };

  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent>
        <Stack direction="row" spacing={1} mb={2}>
          <LocationOn fontSize="small" />
          <Typography>{label}</Typography>
        </Stack>

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Street"
              value={address.street || ''}
              onChange={(e) => onChange({ ...address, street: e.target.value })}
              size="small"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Autocomplete
              freeSolo
              options={citySuggestions}
              getOptionLabel={(o) => typeof o === 'string' ? o : o.city}
              onInputChange={handleCityInput}
              onChange={handleCitySelect}
              renderInput={(params) => (
                <TextField {...params} label="City *" size="small" />
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
            />
          </Grid>

          <Grid item xs={6} md={3}>
            <Select
              fullWidth
              value={address.province || ''}
              onChange={(e) => onChange({ ...address, province: e.target.value })}
              size="small"
            >
              {PROVINCES.map(p => (
                <MenuItem key={p} value={p}>{p}</MenuItem>
              ))}
            </Select>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}

/* ===================== MAIN COMPONENT ===================== */

export default function TripForm({ open, onClose, onSuccess, fetchTrips }) {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [origin, setOrigin] = useState({});
  const [destination, setDestination] = useState({});

  const [form, setForm] = useState({
    tripNumber: '',
    tripType: 'FREIGHT',
    status: 'PLANNED',
    approvalStatus: 'PENDING',
    priority: 'MEDIUM',
    commodityType: '',
    plannedStartDate: null,
    plannedEndDate: null,
    estimatedDuration: '',
    plannedDistanceKm: '',
    vehicleId: '',
    driverId: '',
    notes: '',
    referenceNumber: ''
  });

  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [v, d] = await Promise.all([
        vehicleService.getAllVehicles().catch(() => []),
        driverService.getAllDrivers().catch(() => [])
      ]);

      setVehicles(filterActiveVehicles(v));
      setDrivers(filterAvailableDrivers(d));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) loadData();
  }, [open, loadData]);

  const handleSwap = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, field: value }));
  };

  const geocodeInBackground = async (id, o, d) => {
    try {
      const originAddr = `${o.street || ''}, ${o.city || ''}`;
      const destAddr = `${d.street || ''}, ${d.city || ''}`;

      const oGeo = await routingService.geocodeAddress(originAddr);
      const dGeo = await routingService.geocodeAddress(destAddr);

      const payload = {};
      if (oGeo) {
        payload.originLatitude = oGeo.lat;
        payload.originLongitude = oGeo.lng;
      }
      if (dGeo) {
        payload.destinationLatitude = dGeo.lat;
        payload.destinationLongitude = dGeo.lng;
      }

      await tripService.updateTrip(id, payload);
    } catch (e) {
      console.warn('Geocode failed', e);
    }
  };

  const handleSubmit = async () => {
    if (submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      const originAddr = `${origin.street || ''}, ${origin.city || ''}`;
      const destAddr = `${destination.street || ''}, ${destination.city || ''}`;

      const payload = {
        tripType: form.tripType,
        status: form.status,
        approvalStatus: form.approvalStatus,
        priority: form.priority,
        plannedStartDate: formatDateForAPI(form.plannedStartDate),
        plannedEndDate: formatDateForAPI(form.plannedEndDate),

        estimatedDuration: safeNumber(form.estimatedDuration),
        plannedDistanceKm: safeNumber(form.plannedDistanceKm),

        vehicleId: safeNumber(form.vehicleId),
        driverId: safeNumber(form.driverId),

        commodityType: form.commodityType,
        notes: form.notes,
        referenceNumber: form.referenceNumber,

        originCity: origin.city,
        originStreetAddress: origin.street,
        originLocation: originAddr,

        destinationCity: destination.city,
        destinationStreetAddress: destination.street,
        destinationLocation: destAddr
      };

      const result = await tripService.createTrip(payload);

      setSuccess(`Trip ${result.tripNumber} created`);
      await fetchTrips?.();
      onSuccess?.(result);

      geocodeInBackground(result.id, origin, destination);

      setTimeout(() => onClose?.(), 1000);

    } catch (e) {
      setError(e.message || 'Failed');
    } finally {
      if (isMounted.current) setSubmitting(false);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">

        <DialogTitle>Create Trip</DialogTitle>

        <DialogContent>
          {loading && <CircularProgress />}

          {error && <Alert severity="error">{error}</Alert>}
          {success && <Alert severity="success">{success}</Alert>}

          <Stack spacing={2}>

            <AddressSection label="Origin" address={origin} onChange={setOrigin} />

            <IconButton onClick={handleSwap}>
              <SwapHoriz />
            </IconButton>

            <AddressSection label="Destination" address={destination} onChange={setDestination} />

            <TextField
              fullWidth
              label="Reference"
              value={form.referenceNumber}
              onChange={(e) => setForm({ ...form, referenceNumber: e.target.value })}
              size="small"
            />

          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={submitting}>
            Create
          </Button>
        </DialogActions>

      </Dialog>
    </LocalizationProvider>
  );
}
