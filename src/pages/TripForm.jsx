import React, { useState, useEffect, useCallback } from 'react';
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
  Divider
} from '@mui/material';
import {
  Save,
  Close,
  Warning,
  Schedule as ScheduleIcon,
  Person,
  DirectionsCar,
  Description,
  PriorityHigh
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
    ['ACTIVE', 'OPERATIONAL', 'AVAILABLE'].includes(v.status?.toUpperCase()) || 
    v.available === true
  );

const filterAvailableDrivers = (drivers) =>
  drivers.filter(d => 
    ['ACTIVE', 'AVAILABLE'].includes(d.status?.toUpperCase()) &&
    d.licenseValid !== false
  );

const PRIORITY_OPTIONS = [
  { value: 'LOW', label: 'Low', color: 'success' },
  { value: 'MEDIUM', label: 'Medium', color: 'warning' },
  { value: 'HIGH', label: 'High', color: 'error' },
  { value: 'URGENT', label: 'Urgent', color: 'error' }
];

const STATUS_OPTIONS = [
  'PLANNED',
  'SCHEDULED',
  'ASSIGNED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
  'DELAYED'
];

/* ===================== Component ===================== */
function TripForm({ open, onClose, mode = 'create', initialData, onSuccess }) {
  /* ===================== State ===================== */
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [error, setError] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  const [form, setForm] = useState({
    tripNumber: '',
    originLocation: '',
    destinationLocation: '',
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

  /* ===================== Validation ===================== */
  const validateForm = () => {
    const errors = {};
    
    if (!form.originLocation.trim()) {
      errors.originLocation = 'Origin location is required';
    }
    
    if (!form.destinationLocation.trim()) {
      errors.destinationLocation = 'Destination location is required';
    }
    
    if (!form.plannedStartDate) {
      errors.plannedStartDate = 'Planned start date is required';
    }
    
    if (form.plannedEndDate && form.plannedStartDate) {
      if (dayjs(form.plannedEndDate).isBefore(form.plannedStartDate)) {
        errors.plannedEndDate = 'End date must be after start date';
      }
    }
    
    if (form.cargoWeight && isNaN(form.cargoWeight)) {
      errors.cargoWeight = 'Cargo weight must be a number';
    }
    
    if (form.estimatedDuration && isNaN(form.estimatedDuration)) {
      errors.estimatedDuration = 'Duration must be a number';
    }
    
    return errors;
  };

  /* ===================== Load Data ===================== */
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [vRes, dRes] = await Promise.all([
        vehicleService.getAllVehicles().catch(() => []),
        driverService.getAllDrivers().catch(() => [])
      ]);
      
      setVehicles(filterActiveVehicles(vRes || []));
      setDrivers(filterAvailableDrivers(dRes || []));
    } catch (err) {
      console.error('Failed to load data:', err);
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
        tripNumber: initialData.tripNumber || '',
        originLocation: initialData.originLocation || '',
        destinationLocation: initialData.destinationLocation || '',
        status: initialData.status || 'PLANNED',
        priority: initialData.priority || 'MEDIUM',
        cargoDescription: initialData.cargoDescription || '',
        cargoWeight: initialData.cargoWeight || '',
        cargoValue: initialData.cargoValue || '',
        plannedStartDate: initialData.plannedStartDate 
          ? dayjs(initialData.plannedStartDate)
          : null,
        plannedEndDate: initialData.plannedEndDate
          ? dayjs(initialData.plannedEndDate)
          : null,
        estimatedDuration: initialData.estimatedDuration || '',
        vehicleId: initialData.vehicleId || '',
        driverId: initialData.driverId || '',
        notes: initialData.notes || '',
        specialInstructions: initialData.specialInstructions || ''
      });
    } else {
      // Generate trip number for new trips
      setForm(prev => ({
        ...prev,
        tripNumber: `TRIP-${Date.now().toString(36).toUpperCase()}`,
        status: 'PLANNED',
        priority: 'MEDIUM'
      }));
    }
    
    // Clear errors when opening
    setFormErrors({});
    setError(null);
  }, [open, mode, initialData, loadData]);

  /* ===================== Form Handlers ===================== */
  const handleFieldChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleDateTimeChange = (field, value) => {
    handleFieldChange(field, value);
    
    // Auto-calculate estimated duration if both dates are set
    if (field === 'plannedStartDate' && form.plannedEndDate && value) {
      const duration = dayjs(form.plannedEndDate).diff(value, 'hours');
      if (duration > 0) {
        handleFieldChange('estimatedDuration', duration.toString());
      }
    } else if (field === 'plannedEndDate' && form.plannedStartDate && value) {
      const duration = dayjs(value).diff(form.plannedStartDate, 'hours');
      if (duration > 0) {
        handleFieldChange('estimatedDuration', duration.toString());
      }
    }
  };

  /* ===================== Submit ===================== */
  const handleSubmit = async () => {
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    setSubmitting(true);
    setError(null);
    
    try {
      const payload = {
        ...form,
        vehicleId: form.vehicleId ? Number(form.vehicleId) : null,
        driverId: form.driverId ? Number(form.driverId) : null,
        cargoWeight: form.cargoWeight ? Number(form.cargoWeight) : null,
        cargoValue: form.cargoValue ? Number(form.cargoValue) : null,
        estimatedDuration: form.estimatedDuration ? Number(form.estimatedDuration) : null,
        plannedStartDate: formatDateForAPI(form.plannedStartDate),
        plannedEndDate: formatDateForAPI(form.plannedEndDate)
      };
      
      // Remove empty strings
      Object.keys(payload).forEach(key => {
        if (payload[key] === '') {
          payload[key] = null;
        }
      });
      
      let result;
      if (mode === 'create') {
        result = await tripService.createTrip(payload);
      } else {
        result = await tripService.updateTrip(initialData.id, payload);
      }
      
      onSuccess?.(result);
      onClose();
    } catch (err) {
      console.error('Submit error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to save trip');
    } finally {
      setSubmitting(false);
    }
  };

  /* ===================== Render ===================== */
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Dialog 
        open={open} 
        onClose={onClose} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: { maxHeight: '90vh' }
        }}
      >
        <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider', pb: 2 }}>
          <Typography variant="h6" component="div">
            {mode === 'create' ? 'Create New Trip' : `Edit Trip – ${initialData?.tripNumber}`}
          </Typography>
          {mode === 'edit' && (
            <Typography variant="caption" color="text.secondary">
              ID: {initialData?.id}
            </Typography>
          )}
        </DialogTitle>

        <DialogContent dividers sx={{ overflowY: 'auto' }}>
          {loading && (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
              <CircularProgress />
            </Box>
          )}

          {error && !loading && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {!loading && (
            <Stack spacing={3}>
              {/* ===== Basic Information ===== */}
              <Card variant="outlined">
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                    <Description fontSize="small" />
                    <Typography variant="subtitle1" fontWeight="medium">
                      Basic Information
                    </Typography>
                  </Stack>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Trip Number"
                        value={form.tripNumber}
                        disabled={mode === 'edit'}
                        size="small"
                        helperText="Auto-generated for new trips"
                      />
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        required
                        label="Origin Location"
                        value={form.originLocation}
                        onChange={(e) => handleFieldChange('originLocation', e.target.value)}
                        error={!!formErrors.originLocation}
                        helperText={formErrors.originLocation}
                        size="small"
                      />
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        required
                        label="Destination Location"
                        value={form.destinationLocation}
                        onChange={(e) => handleFieldChange('destinationLocation', e.target.value)}
                        error={!!formErrors.destinationLocation}
                        helperText={formErrors.destinationLocation}
                        size="small"
                      />
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Status</InputLabel>
                        <Select
                          value={form.status}
                          label="Status"
                          onChange={(e) => handleFieldChange('status', e.target.value)}
                        >
                          {STATUS_OPTIONS.map((status) => (
                            <MenuItem key={status} value={status}>
                              {status}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Priority</InputLabel>
                        <Select
                          value={form.priority}
                          label="Priority"
                          onChange={(e) => handleFieldChange('priority', e.target.value)}
                          startAdornment={
                            <PriorityHigh 
                              fontSize="small" 
                              sx={{ mr: 1, color: PRIORITY_OPTIONS.find(p => p.value === form.priority)?.color }}
                            />
                          }
                        >
                          {PRIORITY_OPTIONS.map((priority) => (
                            <MenuItem key={priority.value} value={priority.value}>
                              <Chip 
                                label={priority.label} 
                                size="small" 
                                color={priority.color}
                                sx={{ mr: 1 }}
                              />
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* ===== Schedule ===== */}
              <Card variant="outlined">
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                    <ScheduleIcon fontSize="small" />
                    <Typography variant="subtitle1" fontWeight="medium">
                      Schedule
                    </Typography>
                  </Stack>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <DateTimePicker
                        label="Planned Start *"
                        value={form.plannedStartDate}
                        onChange={(value) => handleDateTimeChange('plannedStartDate', value)}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            size: 'small',
                            error: !!formErrors.plannedStartDate,
                            helperText: formErrors.plannedStartDate
                          }
                        }}
                      />
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <DateTimePicker
                        label="Planned End"
                        value={form.plannedEndDate}
                        onChange={(value) => handleDateTimeChange('plannedEndDate', value)}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            size: 'small',
                            error: !!formErrors.plannedEndDate,
                            helperText: formErrors.plannedEndDate
                          }
                        }}
                      />
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Estimated Duration (hours)"
                        type="number"
                        value={form.estimatedDuration}
                        onChange={(e) => handleFieldChange('estimatedDuration', e.target.value)}
                        error={!!formErrors.estimatedDuration}
                        helperText={formErrors.estimatedDuration}
                        size="small"
                        InputProps={{
                          endAdornment: 'hrs'
                        }}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* ===== Assignment ===== */}
              <Card variant="outlined">
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                    <DirectionsCar fontSize="small" />
                    <Typography variant="subtitle1" fontWeight="medium">
                      Assignment
                    </Typography>
                  </Stack>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Vehicle</InputLabel>
                        <Select
                          value={form.vehicleId}
                          label="Vehicle"
                          onChange={(e) => handleFieldChange('vehicleId', e.target.value)}
                        >
                          <MenuItem value="">
                            <em>No vehicle assigned</em>
                          </MenuItem>
                          {vehicles.map((vehicle) => (
                            <MenuItem key={vehicle.id} value={vehicle.id}>
                              {vehicle.registrationNumber} 
                              {vehicle.model && ` (${vehicle.model})`}
                            </MenuItem>
                          ))}
                        </Select>
                        <FormHelperText>
                          {vehicles.length} available vehicles
                        </FormHelperText>
                      </FormControl>
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Driver</InputLabel>
                        <Select
                          value={form.driverId}
                          label="Driver"
                          onChange={(e) => handleFieldChange('driverId', e.target.value)}
                        >
                          <MenuItem value="">
                            <em>No driver assigned</em>
                          </MenuItem>
                          {drivers.map((driver) => (
                            <MenuItem key={driver.id} value={driver.id}>
                              {driver.firstName} {driver.lastName}
                              {driver.licenseNumber && ` (${driver.licenseNumber})`}
                            </MenuItem>
                          ))}
                        </Select>
                        <FormHelperText>
                          {drivers.length} available drivers
                        </FormHelperText>
                      </FormControl>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* ===== Cargo Details ===== */}
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                    Cargo Details
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        multiline
                        rows={2}
                        label="Cargo Description"
                        value={form.cargoDescription}
                        onChange={(e) => handleFieldChange('cargoDescription', e.target.value)}
                        size="small"
                      />
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Cargo Weight (kg)"
                        type="number"
                        value={form.cargoWeight}
                        onChange={(e) => handleFieldChange('cargoWeight', e.target.value)}
                        error={!!formErrors.cargoWeight}
                        helperText={formErrors.cargoWeight}
                        size="small"
                        InputProps={{
                          endAdornment: 'kg'
                        }}
                      />
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Cargo Value"
                        value={form.cargoValue}
                        onChange={(e) => handleFieldChange('cargoValue', e.target.value)}
                        size="small"
                        InputProps={{
                          startAdornment: '$'
                        }}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* ===== Additional Information ===== */}
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                    Additional Information
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        multiline
                        rows={2}
                        label="Special Instructions"
                        value={form.specialInstructions}
                        onChange={(e) => handleFieldChange('specialInstructions', e.target.value)}
                        size="small"
                        placeholder="Any special requirements or instructions..."
                      />
                    </Grid>
                    
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label="Notes"
                        value={form.notes}
                        onChange={(e) => handleFieldChange('notes', e.target.value)}
                        size="small"
                        placeholder="Additional notes or comments..."
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Stack>
          )}
        </DialogContent>

        <DialogActions sx={{ borderTop: 1, borderColor: 'divider', p: 2 }}>
          <Button 
            startIcon={<Close />} 
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </Button>
          
          <Button
            variant="contained"
            startIcon={submitting ? <CircularProgress size={20} /> : <Save />}
            onClick={handleSubmit}
            disabled={submitting || loading}
          >
            {submitting ? 'Saving...' : (mode === 'create' ? 'Create Trip' : 'Update Trip')}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
}

export default TripForm;
