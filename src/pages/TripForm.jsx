import { useState, useEffect, useMemo, useCallback } from 'react';
import dayjs from 'dayjs';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  Button,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Box,
} from '@mui/material';

import {
  Save,
  Close,
  Warning,
} from '@mui/icons-material';

import {
  LocalizationProvider,
  DateTimePicker,
} from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

import { tripService } from '../services/tripService';
import { driverService } from '../services/driverService';
import { vehicleService } from '../services/vehicleService';

/* ===================== Helpers ===================== */

const formatDateForAPI = (date) =>
  date ? dayjs(date).format('YYYY-MM-DDTHH:mm:ss') : null;

const filterActiveVehicles = (vehicles) =>
  vehicles.filter(v =>
    ['ACTIVE', 'OPERATIONAL', 'Available'].includes(v.status) || v.available
  );

const filterActiveDrivers = (drivers) =>
  drivers.filter(d =>
    ['ACTIVE', 'AVAILABLE', 'Available'].includes(d.status)
  );

/* ===================== Component ===================== */

function TripForm({
  open,
  onClose,
  onSuccess,
  mode = 'create',
  initialData = null,
  tripId = null,
}) {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    tripNumber: '',
    originLocation: '',
    destinationLocation: '',
    status: 'PLANNED',
    priority: 'MEDIUM',
    cargoDescription: '',
    plannedStartDate: null,
    plannedEndDate: null,
    startDate: null,
    endDate: null,
    vehicleId: '',
    driverId: '',
    notes: '',
  });

  /* ===================== Load data ===================== */

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [vRes, dRes] = await Promise.all([
        vehicleService.getAllVehicles(),
        driverService.getAllDrivers(),
      ]);

      setVehicles(filterActiveVehicles(vRes || []));
      setDrivers(filterActiveDrivers(dRes || []));
    } catch (err) {
      console.error(err);
      setError('Failed to load vehicles or drivers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;

    loadData();

    if (mode === 'edit' && initialData) {
      setForm({
        ...form,
        ...initialData,
        plannedStartDate: initialData.plannedStartDate ? dayjs(initialData.plannedStartDate) : null,
        plannedEndDate: initialData.plannedEndDate ? dayjs(initialData.plannedEndDate) : null,
        startDate: initialData.startDate ? dayjs(initialData.startDate) : null,
        endDate: initialData.endDate ? dayjs(initialData.endDate) : null,
      });
    } else {
      setForm(f => ({
        ...f,
        tripNumber: `TRIP-${Date.now().toString(36).toUpperCase()}`,
      }));
    }
  }, [open, mode, initialData, loadData]);

  /* ===================== Submit ===================== */

  const handleSubmit = async () => {
    setSubmitting(true);

    try {
      const payload = {
        ...form,
        vehicleId: form.vehicleId ? Number(form.vehicleId) : null,
        driverId: form.driverId ? Number(form.driverId) : null,
        plannedStartDate: formatDateForAPI(form.plannedStartDate),
        plannedEndDate: formatDateForAPI(form.plannedEndDate),
        startDate: formatDateForAPI(form.startDate || form.plannedStartDate),
        endDate: formatDateForAPI(form.endDate),
      };

      if (!payload.startDate) {
        throw new Error('Start date is required');
      }

      let res;
      if (mode === 'create') {
        res = await tripService.createTrip(payload);
      } else {
        res = await tripService.updateTrip(tripId || initialData.id, payload);
      }

      onSuccess?.(res);
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to save trip');
    } finally {
      setSubmitting(false);
    }
  };

  /* ===================== Render ===================== */

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {mode === 'create' ? 'Create Trip' : `Edit Trip – ${initialData?.tripNumber}`}
        </DialogTitle>

        <DialogContent dividers>
          {loading && (
            <Box textAlign="center" my={3}>
              <CircularProgress />
            </Box>
          )}

          {error && (
            <Alert severity="warning" icon={<Warning />} sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* ===== Basic Info ===== */}
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Basic Info</Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Trip Number"
                    value={form.tripNumber}
                    onChange={(e) => setForm({ ...form, tripNumber: e.target.value })}
                    disabled={mode === 'edit'}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <Select
                    fullWidth
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                  >
                    {['PLANNED','ACTIVE','IN_PROGRESS','COMPLETED','CANCELLED'].map(s => (
                      <MenuItem key={s} value={s}>{s}</MenuItem>
                    ))}
                  </Select>
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Origin"
                    value={form.originLocation}
                    onChange={(e) => setForm({ ...form, originLocation: e.target.value })}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Destination"
                    value={form.destinationLocation}
                    onChange={(e) => setForm({ ...form, destinationLocation: e.target.value })}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* ===== Schedule ===== */}
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Schedule</Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <DateTimePicker
                    label="Planned Start"
                    value={form.plannedStartDate}
                    onChange={(v) => setForm({ ...form, plannedStartDate: v })}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <DateTimePicker
                    label="Planned End"
                    value={form.plannedEndDate}
                    onChange={(v) => setForm({ ...form, plannedEndDate: v })}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* ===== Assignment ===== */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Assignment</Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Select
                    fullWidth
                    value={form.vehicleId}
                    onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}
                  >
                    <MenuItem value="">No Vehicle</MenuItem>
                    {vehicles.map(v => (
                      <MenuItem key={v.id} value={v.id}>
                        {v.registrationNumber}
                      </MenuItem>
                    ))}
                  </Select>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Select
                    fullWidth
                    value={form.driverId}
                    onChange={(e) => setForm({ ...form, driverId: e.target.value })}
                  >
                    <MenuItem value="">No Driver</MenuItem>
                    {drivers.map(d => (
                      <MenuItem key={d.id} value={d.id}>
                        {d.firstName} {d.lastName}
                      </MenuItem>
                    ))}
                  </Select>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </DialogContent>

        <DialogActions>
          <Button startIcon={<Close />} onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={handleSubmit}
            disabled={submitting}
          >
            {mode === 'create' ? 'Create Trip' : 'Update Trip'}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
}

export default TripForm;
