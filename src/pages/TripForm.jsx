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
  Tooltip,
  Snackbar
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

/* ===================== FIXED HELPERS ===================== */

const formatDateForAPI = (date) =>
  date ? dayjs(date).format('YYYY-MM-DDTHH:mm:ss') : null;

const safeNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

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

/* ===================== FIXED SWAP ===================== */

const swapLocationsSafe = (setOrigin, setDestination, origin, destination) => {
  const temp = origin;
  setOrigin(destination);
  setDestination(temp);
};

/* ===================== COMPONENT ===================== */

function TripForm({ open = false, onClose, mode = 'create', initialData, onSuccess, fetchTrips }) {

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [geocodingInProgress, setGeocodingInProgress] = useState(false);

  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [supervisors, setSupervisors] = useState([]);

  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [formErrors, setFormErrors] = useState({});

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

  /* ===================== MOUNT SAFETY FIX ===================== */

  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  /* ===================== FIXED LOAD DATA ===================== */

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [vRes, dRes] = await Promise.all([
        vehicleService.getAllVehicles().catch(() => []),
        driverService.getAllDrivers().catch(() => [])
      ]);

      setVehicles(filterActiveVehicles(vRes || []));
      setDrivers(filterAvailableDrivers(dRes || []));

      try {
        const usersResponse = await fetch('/api/users?roles=MANAGER,SUPER_ADMIN');
        if (usersResponse.ok) {
          const data = await usersResponse.json();
          setSupervisors(data?.content || data || []);
        }
      } catch {
        setSupervisors([]);
      }

    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) loadData();
  }, [open, loadData]);

  /* ===================== FIXED SWAP HANDLER ===================== */

  const handleSwapLocations = () => {
    swapLocationsSafe(setOrigin, setDestination, origin, destination);
  };

  /* ===================== FIELD CHANGE ===================== */

  const handleFieldChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  /* ===================== FIXED BACKGROUND GEOCODE ===================== */

  const geocodeTripInBackground = useCallback(async (tripId, originAddress, destAddress) => {
    if (!tripId) return;

    setGeocodingInProgress(true);

    try {
      let originCoords = null;
      let destCoords = null;

      if (!origin.latitude || !origin.longitude) {
        originCoords = await routingService.geocodeAddress(originAddress).catch(() => null);
      }

      if (!destination.latitude || !destination.longitude) {
        destCoords = await routingService.geocodeAddress(destAddress).catch(() => null);
      }

      const updatePayload = {};

      if (originCoords) {
        updatePayload.originLatitude = originCoords.lat;
        updatePayload.originLongitude = originCoords.lng;
      }

      if (destCoords) {
        updatePayload.destinationLatitude = destCoords.lat;
        updatePayload.destinationLongitude = destCoords.lng;
      }

      if (Object.keys(updatePayload).length > 0) {
        await tripService.updateTrip(tripId, updatePayload);
      }

    } catch (err) {
      console.warn('Geocoding failed:', err);
    } finally {
      if (isMounted.current) {
        setGeocodingInProgress(false);
      }
    }
  }, [origin, destination]);

  /* ===================== FIXED SUBMIT ===================== */

  const handleSubmit = useCallback(async () => {

    if (submitting) return;

    setSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const originAddress =
        [origin.street, origin.city, origin.zipCode, origin.province]
          .filter(Boolean)
          .join(', ');

      const destAddress =
        [destination.street, destination.city, destination.zipCode, destination.province]
          .filter(Boolean)
          .join(', ');

      /* 🚨 FIX: NO COORDINATES SENT */
      const payload = {
        tripType: form.tripType,
        status: form.status,
        approvalStatus: form.approvalStatus,
        priority: form.priority,

        plannedStartDate: formatDateForAPI(form.plannedStartDate),
        plannedEndDate: formatDateForAPI(form.plannedEndDate),

        estimatedDuration: safeNumber(form.estimatedDuration),
        plannedDistanceKm: safeNumber(form.plannedDistanceKm),
        plannedDurationHours: safeNumber(form.plannedDurationHours),

        vehicleId: safeNumber(form.vehicleId),
        driverId: safeNumber(form.driverId),
        supervisorId: safeNumber(form.supervisorId),
        loadId: safeNumber(form.loadId),

        commodityType: form.commodityType,
        cargoDescription: form.cargoDescription,
        cargoWeight: safeNumber(form.cargoWeight),
        cargoValue: safeNumber(form.cargoValue),
        palletCount: safeNumber(form.palletCount),
        containerNumber: form.containerNumber,

        originStreetAddress: origin.street,
        originCity: origin.city,
        originZipCode: origin.zipCode,
        originProvince: origin.province,
        originLocation: originAddress,

        destinationStreetAddress: destination.street,
        destinationCity: destination.city,
        destinationZipCode: destination.zipCode,
        destinationProvince: destination.province,
        destinationLocation: destAddress,

        notes: form.notes,
        specialInstructions: form.specialInstructions,
        driverNotes: form.driverNotes,
        referenceNumber: form.referenceNumber,
        purchaseOrderNumber: form.purchaseOrderNumber,
        cancellationReason: form.cancellationReason,

        auditTrail: JSON.stringify([{
          action: 'CREATED',
          timestamp: new Date().toISOString()
        }]),

        incidentsLogged: 0
      };

      const result = await tripService.createTrip(payload);

      setSuccessMessage(`Trip ${result.tripNumber} created successfully!`);

      /* background geocode */
      geocodeTripInBackground(result.id, originAddress, destAddress);

      await fetchTrips?.();
      onSuccess?.(result);

      setTimeout(() => onClose?.(), 1200);

    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Failed to create trip');
    } finally {
      if (isMounted.current) setSubmitting(false);
    }
  }, [form, origin, destination, submitting]);

  /* ===================== CLOSE SAFETY ===================== */

  const handleDialogClose = () => {
    if (submitting || geocodingInProgress) return;
    onClose?.();
  };

  /* ===================== RETURN (UNCHANGED UI STRUCTURE) ===================== */

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Dialog open={open} onClose={handleDialogClose} maxWidth="lg" fullWidth>

        <DialogTitle>
          Create Trip
          {geocodingInProgress && (
            <Chip size="small" label="Geocoding..." sx={{ ml: 2 }} />
          )}
        </DialogTitle>

        <DialogContent>

          {loading && <CircularProgress />}
          {error && <Alert severity="error">{error}</Alert>}
          {successMessage && <Alert severity="success">{successMessage}</Alert>}

          <Box>

            <Card>
              <CardContent>

                <Typography>Origin</Typography>
                <TextField
                  fullWidth
                  value={origin.city}
                  onChange={(e) => setOrigin({ ...origin, city: e.target.value })}
                />

                <Button onClick={handleSwapLocations}>
                  Swap
                </Button>

                <Typography>Destination</Typography>
                <TextField
                  fullWidth
                  value={destination.city}
                  onChange={(e) => setDestination({ ...destination, city: e.target.value })}
                />

              </CardContent>
            </Card>

          </Box>

        </DialogContent>

        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>

          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={submitting}
          >
            {submitting ? 'Saving...' : 'Create Trip'}
          </Button>
        </DialogActions>

      </Dialog>
    </LocalizationProvider>
  );
}

export default TripForm;
