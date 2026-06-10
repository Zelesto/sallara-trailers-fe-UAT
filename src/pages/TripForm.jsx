import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import dayjs from 'dayjs';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Select, MenuItem, FormControl, InputLabel,
  Button, Grid, Card, CardContent, Typography,
  CircularProgress, Alert, Box, FormHelperText,
  Stack, Chip, Divider, Autocomplete, IconButton
} from '@mui/material';

import {
  Save, Close, Schedule as ScheduleIcon,
  DirectionsCar, Description, LocationOn, SwapHoriz, MyLocation, CheckCircle
} from '@mui/icons-material';

import { DateTimePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

import { tripService } from '../services/tripService';
import { driverService } from '../services/driverService';
import { vehicleService } from '../services/vehicleService';
import { routingService } from '../services/routingService';

/* ===================== Helpers ===================== */

const formatDateForAPI = (date) =>
  date ? dayjs(date).toISOString() : null;

const PROVINCES = [
  'Eastern Cape','Free State','Gauteng','KwaZulu-Natal',
  'Limpopo','Mpumalanga','Northern Cape','North West','Western Cape'
];

const filterActiveVehicles = (v) =>
  v.filter(x => ['ACTIVE','OPERATIONAL','AVAILABLE'].includes((x.status || '').toUpperCase()));

const filterAvailableDrivers = (d) =>
  d.filter(x => ['ACTIVE','AVAILABLE'].includes((x.status || '').toUpperCase()));

/* ===================== Address Section ===================== */

function AddressSection({ label, value, onChange }) {
  const [cities, setCities] = useState([]);

  const searchCities = async (q) => {
    if (!q || q.length < 2) return;
    const res = await routingService.suggestCities(q);
    setCities(res || []);
  };

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="subtitle2" mb={1}>
          <LocationOn fontSize="small" /> {label}
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Street"
              value={value.street || ''}
              onChange={(e) => onChange({ ...value, street: e.target.value })}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Autocomplete
              options={cities}
              getOptionLabel={(o) => o.city || ''}
              onInputChange={(e, v) => searchCities(v)}
              onChange={(e, v) => {
                if (!v) return;
                onChange({
                  ...value,
                  city: v.city,
                  province: v.province,
                  zipCode: v.zipCode
                });
              }}
              renderInput={(params) => (
                <TextField {...params} label="City" />
              )}
            />
          </Grid>

          <Grid item xs={6} md={3}>
            <TextField
              label="Zip"
              value={value.zipCode || ''}
              onChange={(e) => onChange({ ...value, zipCode: e.target.value })}
            />
          </Grid>

          <Grid item xs={6} md={3}>
            <Select
              fullWidth
              value={value.province || ''}
              onChange={(e) => onChange({ ...value, province: e.target.value })}
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

/* ===================== MAIN ===================== */

function TripForm({ open, onClose, mode = 'create', initialData, onSuccess }) {

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);

  const [origin, setOrigin] = useState({});
  const [destination, setDestination] = useState({});

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

  /* ===================== LOAD ===================== */

  useEffect(() => {
    if (!open) return;

    (async () => {
      setLoading(true);
      try {
        const [v, d] = await Promise.all([
          vehicleService.getAllVehicles(),
          driverService.getAllDrivers()
        ]);

        setVehicles(filterActiveVehicles(v || []));
        setDrivers(filterAvailableDrivers(d || []));
      } finally {
        setLoading(false);
      }
    })();
  }, [open]);

  /* ===================== INIT EDIT ===================== */

  useEffect(() => {
    if (!open || mode !== 'edit' || !initialData) return;

    setForm({
      tripNumber: initialData.tripNumber || '',
      status: initialData.status || 'PLANNED',
      priority: initialData.priority || 'MEDIUM',
      cargoDescription: initialData.cargoDescription || '',
      cargoWeight: initialData.cargoWeight || '',
      cargoValue: initialData.cargoValue || '',
      plannedStartDate: initialData.plannedStartDate ? dayjs(initialData.plannedStartDate) : null,
      plannedEndDate: initialData.plannedEndDate ? dayjs(initialData.plannedEndDate) : null,
      estimatedDuration: initialData.estimatedDuration || '',
      vehicleId: initialData.vehicleId || '',
      driverId: initialData.driverId || '',
      notes: initialData.notes || '',
      specialInstructions: initialData.specialInstructions || ''
    });

    setOrigin({
      street: initialData.originStreetAddress,
      city: initialData.originCity,
      zipCode: initialData.originZipCode,
      province: initialData.originProvince
    });

    setDestination({
      street: initialData.destinationStreetAddress,
      city: initialData.destinationCity,
      zipCode: initialData.destinationZipCode,
      province: initialData.destinationProvince
    });

  }, [open, mode, initialData]);

  /* ===================== HANDLERS ===================== */

const formatAddress = (a = {}) => {
  const parts = [
    a.street?.trim(),
    a.city?.trim(),
    a.zipCode?.trim(),
    a.province?.trim(),
    'South Africa'
  ];

  return parts.filter(Boolean).join(', ');
};

const handleSwap = () => {
  setOrigin(prevOrigin => {
    const newOrigin = destination;
    setDestination(prevOrigin);
    return newOrigin;
  });
};

const handleSubmit = async () => {
  setSubmitting(true);

  try {
    // ================= VALIDATION =================
    if (!origin?.street || !origin?.city) {
      throw new Error('Origin address is incomplete');
    }

    if (!destination?.street || !destination?.city) {
      throw new Error('Destination address is incomplete');
    }

    // ================= CLEAN PAYLOAD =================
    const payload = {
      ...form,

      vehicleId: form.vehicleId ? Number(form.vehicleId) : null,
      driverId: form.driverId ? Number(form.driverId) : null,

      plannedStartDate: formatDateForAPI(form.plannedStartDate),
      plannedEndDate: formatDateForAPI(form.plannedEndDate),

      originStreetAddress: origin.street || null,
      originCity: origin.city || null,
      originZipCode: origin.zipCode || null,
      originProvince: origin.province || null,

      destinationStreetAddress: destination.street || null,
      destinationCity: destination.city || null,
      destinationZipCode: destination.zipCode || null,
      destinationProvince: destination.province || null,

      // ✅ FIX: single consistent address format (no duplicates)
      originLocation: formatAddress(origin),
      destinationLocation: formatAddress(destination)
    };

    let res;

    if (mode === 'create') {
      res = await tripService.createTrip(payload);
    } else {
      res = await tripService.updateTrip(initialData.id, payload);
    }

    onSuccess?.(res);
    onClose?.();

  } catch (error) {
    console.error('Trip submit failed:', error);
  } finally {
    setSubmitting(false);
  }
};
  /* ===================== UI ===================== */

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Dialog open={open} fullWidth maxWidth="lg">
        <DialogTitle>
          {mode === 'create' ? 'Create Trip' : 'Edit Trip'}
        </DialogTitle>

        <DialogContent>

          {loading && <CircularProgress />}

          <Stack spacing={2}>

            <TextField
              label="Trip Number"
              value={form.tripNumber}
              disabled
            />

            <AddressSection label="Origin" value={origin} onChange={setOrigin} />

            <Box display="flex" justifyContent="center">
              <IconButton onClick={handleSwap}>
                <SwapHoriz />
              </IconButton>
            </Box>

            <AddressSection label="Destination" value={destination} onChange={setDestination} />

          </Stack>

        </DialogContent>

        <DialogActions>
          <Button onClick={onClose} startIcon={<Close />}>
            Cancel
          </Button>

          <Button
            onClick={handleSubmit}
            variant="contained"
            startIcon={<Save />}
            disabled={submitting}
          >
            {mode === 'create' ? 'Create' : 'Update'}
          </Button>
        </DialogActions>

      </Dialog>
    </LocalizationProvider>
  );
}

export default TripForm;
