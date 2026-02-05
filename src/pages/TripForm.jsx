import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
function TripForm({ open = false, onClose, mode = 'create', initialData, onSuccess }) {
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

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      // Use timeout to avoid state updates during render
      const timer = setTimeout(() => {
        setForm({
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
        setFormErrors({});
        setError(null);
        setVehicles([]);
        setDrivers([]);
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Load data and initialize form when dialog opens
  useEffect(() => {
    if (!open) return;
    
    // Load vehicles and drivers
    loadData();
    
    if (mode === 'edit' && initialData) {
      setForm({
        tripNumber: initialData.tripNumber || '',
        originLocation: initialData.originLocation || '',
        destinationLocation: initialData.destinationLocation || '',
        status: initialData.status || 'PLANNED',
        priority: initialData.priority || 'MEDIUM',
        cargoDescription: initialData.cargoDescription || '',
        cargoWeight: initialData.cargoWeight?.toString() || '',
        cargoValue: initialData.cargoValue?.toString() || '',
        plannedStartDate: initialData.plannedStartDate 
          ? dayjs(initialData.plannedStartDate)
          : null,
        plannedEndDate: initialData.plannedEndDate
          ? dayjs(initialData.plannedEndDate)
          : null,
        estimatedDuration: initialData.estimatedDuration?.toString() || '',
        vehicleId: initialData.vehicleId?.toString() || '',
        driverId: initialData.driverId?.toString() || '',
        notes: initialData.notes || '',
        specialInstructions: initialData.specialInstructions || ''
      });
    } else {
      // Generate trip number for new trips
      const tripNumber = `TRIP-${Date.now().toString(36).toUpperCase()}`;
      setForm(prev => ({
        ...prev,
        tripNumber,
        status: 'PLANNED',
        priority: 'MEDIUM'
      }));
    }
  }, [open, mode, initialData, loadData]);

  /* ===================== Validation ===================== */
  const validateForm = useCallback(() => {
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
    
    if (form.cargoWeight && isNaN(parseFloat(form.cargoWeight))) {
      errors.cargoWeight = 'Cargo weight must be a number';
    }
    
    if (form.estimatedDuration && isNaN(parseFloat(form.estimatedDuration))) {
      errors.estimatedDuration = 'Duration must be a number';
    }
    
    return errors;
  }, [form]);

  /* ===================== Form Handlers ===================== */
  const handleFieldChange = useCallback((field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  }, [formErrors]);

  const handleDateTimeChange = useCallback((field, value) => {
    setForm(prev => ({ 
      ...prev, 
      [field]: value,
      // Clear error for this field
      ...(formErrors[field] && { [field]: '' })
    }));
    
    // Auto-calculate estimated duration if both dates are set
    if (field === 'plannedStartDate' && form.plannedEndDate && value) {
      const duration = dayjs(form.plannedEndDate).diff(value, 'hours');
      if (duration > 0) {
        setForm(prev => ({ ...prev, estimatedDuration: duration.toString() }));
        if (formErrors.estimatedDuration) {
          setFormErrors(prev => ({ ...prev, estimatedDuration: '' }));
        }
      }
    } else if (field === 'plannedEndDate' && form.plannedStartDate && value) {
      const duration = dayjs(value).diff(form.plannedStartDate, 'hours');
      if (duration > 0) {
        setForm(prev => ({ ...prev, estimatedDuration: duration.toString() }));
        if (formErrors.estimatedDuration) {
          setFormErrors(prev => ({ ...prev, estimatedDuration: '' }));
        }
      }
    }
  }, [form.plannedEndDate, form.plannedStartDate, formErrors]);

  /* ===================== Submit ===================== */
  const handleSubmit = useCallback(async () => {
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
        vehicleId: form.vehicleId ? parseInt(form.vehicleId, 10) : null,
        driverId: form.driverId ? parseInt(form.driverId, 10) : null,
        cargoWeight: form.cargoWeight ? parseFloat(form.cargoWeight) : null,
        cargoValue: form.cargoValue ? parseFloat(form.cargoValue) : null,
        estimatedDuration: form.estimatedDuration ? parseFloat(form.estimatedDuration) : null,
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
      if (onClose) onClose();
    } catch (err) {
      console.error('Submit error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to save trip');
    } finally {
      setSubmitting(false);
    }
  }, [form, mode, initialData, validateForm, onSuccess, onClose]);

  // Memoized priority color
  const priorityColor = useMemo(() => {
    return PRIORITY_OPTIONS.find(p => p.value === form.priority)?.color || 'default';
  }, [form.priority]);

  // Handle dialog close with validation
  const handleDialogClose = useCallback((event, reason) => {
    if (reason === 'backdropClick' && submitting) {
      return; // Prevent closing when submitting
    }
    if (onClose) onClose();
  }, [onClose, submitting]);

  // Generate a unique ID for the form
  const formId = useMemo(() => `trip-form-${Date.now()}`, []);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Dialog 
        open={open} 
        onClose={handleDialogClose}
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: { maxHeight: '90vh' }
        }}
      >
        <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider', pb: 2 }}>
          <Typography variant="h6" component="div">
            {mode === 'create' ? 'Create New Trip' : `Edit Trip – ${initialData?.tripNumber || ''}`}
          </Typography>
          {mode === 'edit' && initialData?.id && (
            <Typography variant="caption" color="text.secondary">
              ID: {initialData.id}
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
            <Alert 
              severity="error" 
              sx={{ mb: 3 }}
              onClose={() => setError(null)}
            >
              {error}
            </Alert>
          )}

          {!loading && (
            <Box component="form" id={formId} onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}>
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
                        <FormControl fullWidth size="small" error={!!formErrors.status}>
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
                          {formErrors.status && (
                            <FormHelperText>{formErrors.status}</FormHelperText>
                          )}
                        </FormControl>
                      </Grid>
                      
                      <Grid item xs={12} md={6}>
                        <FormControl fullWidth size="small" error={!!formErrors.priority}>
                          <InputLabel>Priority</InputLabel>
                          <Select
                            value={form.priority}
                            label="Priority"
                            onChange={(e) => handleFieldChange('priority', e.target.value)}
                          >
                            {PRIORITY_OPTIONS.map((priority) => (
                              <MenuItem key={priority.value} value={priority.value}>
                                <Stack direction="row" alignItems="center" spacing={1}>
                                  <Chip 
                                    label={priority.label} 
                                    size="small" 
                                    color={priority.color}
                                  />
                                </Stack>
                              </MenuItem>
                            ))}
                          </Select>
                          <FormHelperText>
                            <PriorityHigh 
                              fontSize="small" 
                              sx={{ mr: 1, color: priorityColor, verticalAlign: 'middle' }}
                            />
                            Priority level
                          </FormHelperText>
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
                              helperText: formErrors.plannedStartDate,
                              required: true
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
                              <MenuItem key={vehicle.id} value={vehicle.id.toString()}>
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
                              <MenuItem key={driver.id} value={driver.id.toString()}>
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
                          type="number"
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
            </Box>
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
            type="submit"
            form={formId}
            startIcon={submitting ? <CircularProgress size={20} /> : <Save />}
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
