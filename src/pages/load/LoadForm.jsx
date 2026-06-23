// src/pages/load/LoadForm.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Stack,
  Divider,
  Chip,
  Autocomplete,
  FormControlLabel,
  Switch,
} from '@mui/material';
import {
  ArrowBack,
  Save,
  LocalShipping,
  Person,
  CalendarToday,
  Add,
  Remove,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { loadService } from '../../services/loadService';
import { customerService } from '../../services/customerService';
import { tripService } from '../../services/tripService';

const COMMODITY_TYPES = [
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
];

const STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Pending', color: 'warning' },
  { value: 'IN_PROGRESS', label: 'In Progress', color: 'info' },
  { value: 'COMPLETED', label: 'Completed', color: 'success' },
  { value: 'CANCELLED', label: 'Cancelled', color: 'error' },
];

const PRIORITY_OPTIONS = [
  { value: 'LOW', label: 'Low', color: 'success' },
  { value: 'NORMAL', label: 'Normal', color: 'info' },
  { value: 'HIGH', label: 'High', color: 'warning' },
  { value: 'URGENT', label: 'Urgent', color: 'error' },
];

const LoadForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [customers, setCustomers] = useState([]);
  const [availableTrips, setAvailableTrips] = useState([]);
  const [selectedTrips, setSelectedTrips] = useState([]);
  const [mergeSuggestion, setMergeSuggestion] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  const [formData, setFormData] = useState({
    customerId: '',
    description: '',
    commodityType: '',
    weightKg: '',
    volumeCubicM: '',
    palletCount: '',
    containerNumber: '',
    hazardousMaterial: false,
    specialHandling: '',
    loadingDate: new Date().toISOString().slice(0, 16),
    unloadingDate: '',
    status: 'PENDING',
    priority: 'NORMAL',
    estimatedValue: '',
    actualValue: '',
  });

  useEffect(() => {
    loadCustomers();
    loadAvailableTrips();
    if (isEditMode) {
      loadLoad();
    }
  }, [id]);

  const loadCustomers = async () => {
    try {
      const response = await customerService.getActiveCustomers();
      setCustomers(response || []);
    } catch (err) {
      console.error('Error loading customers:', err);
    }
  };

  const loadAvailableTrips = async () => {
    try {
      const response = await tripService.getTripsWithoutLoad();
      setAvailableTrips(response || []);
    } catch (err) {
      console.error('Error loading available trips:', err);
    }
  };

  const loadLoad = async () => {
    try {
      setLoading(true);
      const load = await loadService.getLoadById(id);
      setFormData({
        customerId: load.customerId || '',
        description: load.description || '',
        commodityType: load.commodityType || '',
        weightKg: load.weightKg || '',
        volumeCubicM: load.volumeCubicM || '',
        palletCount: load.palletCount || '',
        containerNumber: load.containerNumber || '',
        hazardousMaterial: load.hazardousMaterial || false,
        specialHandling: load.specialHandling || '',
        loadingDate: load.loadingDate ? new Date(load.loadingDate).toISOString().slice(0, 16) : '',
        unloadingDate: load.unloadingDate ? new Date(load.unloadingDate).toISOString().slice(0, 16) : '',
        status: load.status || 'PENDING',
        priority: load.priority || 'NORMAL',
        estimatedValue: load.estimatedValue || '',
        actualValue: load.actualValue || '',
      });
      setSelectedTrips(load.trips || []);
    } catch (err) {
      console.error('Error loading load:', err);
      setError('Failed to load load data');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleTripSelect = (event, value) => {
    setSelectedTrips(value || []);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.customerId) errors.customerId = 'Customer is required';
    if (!formData.loadingDate) errors.loadingDate = 'Loading date is required';
    if (!formData.description) errors.description = 'Description is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        ...formData,
        weightKg: formData.weightKg ? parseFloat(formData.weightKg) : null,
        volumeCubicM: formData.volumeCubicM ? parseFloat(formData.volumeCubicM) : null,
        palletCount: formData.palletCount ? parseInt(formData.palletCount) : null,
        estimatedValue: formData.estimatedValue ? parseFloat(formData.estimatedValue) : null,
        actualValue: formData.actualValue ? parseFloat(formData.actualValue) : null,
        tripIds: selectedTrips.map(t => t.id),
        loadingDate: formData.loadingDate ? new Date(formData.loadingDate).toISOString() : null,
        unloadingDate: formData.unloadingDate ? new Date(formData.unloadingDate).toISOString() : null,
      };

      let response;
      if (isEditMode) {
        response = await loadService.updateLoad(id, payload);
        setSuccess('Load updated successfully!');
      } else {
        response = await loadService.createLoad(payload);
        setSuccess('Load created successfully!');
        
        // Check if merge was suggested
        if (response.mergeSuggestion) {
          setMergeSuggestion(response);
          setSuccess(response.mergeMessage);
          setTimeout(() => {
            if (window.confirm(response.mergeMessage + ' Would you like to add to the existing load?')) {
              navigate(`/loads/${response.loadNumber}`);
            }
          }, 1000);
          return;
        }
      }

      setTimeout(() => {
        navigate('/loads');
      }, 2000);
    } catch (err) {
      console.error('Error saving load:', err);
      setError(err.message || 'Failed to save load');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress size={40} />
        <Typography sx={{ ml: 2 }}>Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 1, sm: 1.5, md: 2 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Typography variant="h6" fontWeight="600" sx={{ fontSize: '1rem' }}>
            <LocalShipping sx={{ mr: 0.5, verticalAlign: 'middle', fontSize: '1.2rem' }} />
            {isEditMode ? 'Edit Load' : 'Create New Load'}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
            {isEditMode ? 'Update load details' : 'Create a new load with trips'}
          </Typography>
        </Box>
        <Button
          startIcon={<ArrowBack sx={{ fontSize: '0.9rem' }} />}
          onClick={() => navigate('/loads')}
          size="small"
          sx={{ fontSize: '0.75rem' }}
        >
          Back to Loads
        </Button>
      </Box>

      <Paper sx={{ p: { xs: 1.5, sm: 2 } }}>
        <form onSubmit={handleSubmit}>
          {error && (
            <Alert severity="error" sx={{ mb: 2, fontSize: '0.8rem' }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 2, fontSize: '0.8rem' }} onClose={() => setSuccess('')}>
              {success}
            </Alert>
          )}

          <Grid container spacing={2}>
            {/* Customer */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small" error={!!formErrors.customerId}>
                <InputLabel sx={{ fontSize: '0.75rem' }}>Customer *</InputLabel>
                <Select
                  name="customerId"
                  value={formData.customerId}
                  onChange={handleChange}
                  label="Customer *"
                  sx={{ fontSize: '0.8rem' }}
                >
                  <MenuItem value="" sx={{ fontSize: '0.8rem' }}>Select Customer</MenuItem>
                  {customers.map(customer => (
                    <MenuItem key={customer.id} value={customer.id} sx={{ fontSize: '0.8rem' }}>
                      {customer.name} ({customer.customerCode})
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.customerId && (
                  <Typography variant="caption" color="error" sx={{ fontSize: '0.65rem' }}>
                    {formErrors.customerId}
                  </Typography>
                )}
              </FormControl>
            </Grid>

            {/* Priority */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ fontSize: '0.75rem' }}>Priority</InputLabel>
                <Select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  label="Priority"
                  sx={{ fontSize: '0.8rem' }}
                >
                  {PRIORITY_OPTIONS.map(option => (
                    <MenuItem key={option.value} value={option.value} sx={{ fontSize: '0.8rem' }}>
                      <Chip
                        label={option.label}
                        color={option.color}
                        size="small"
                        sx={{ height: 18, fontSize: '0.55rem' }}
                      />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Description */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description *"
                name="description"
                value={formData.description}
                onChange={handleChange}
                size="small"
                error={!!formErrors.description}
                helperText={formErrors.description}
                sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
              />
            </Grid>

            {/* Dates */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Loading Date *"
                name="loadingDate"
                type="datetime-local"
                value={formData.loadingDate}
                onChange={handleChange}
                size="small"
                error={!!formErrors.loadingDate}
                helperText={formErrors.loadingDate}
                InputLabelProps={{ shrink: true }}
                sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Unloading Date"
                name="unloadingDate"
                type="datetime-local"
                value={formData.unloadingDate}
                onChange={handleChange}
                size="small"
                InputLabelProps={{ shrink: true }}
                sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
              />
            </Grid>

            {/* Commodity Type */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ fontSize: '0.75rem' }}>Commodity Type</InputLabel>
                <Select
                  name="commodityType"
                  value={formData.commodityType}
                  onChange={handleChange}
                  label="Commodity Type"
                  sx={{ fontSize: '0.8rem' }}
                >
                  <MenuItem value="" sx={{ fontSize: '0.8rem' }}>Select Type</MenuItem>
                  {COMMODITY_TYPES.map(type => (
                    <MenuItem key={type} value={type} sx={{ fontSize: '0.8rem' }}>{type}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Container Number */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Container Number"
                name="containerNumber"
                value={formData.containerNumber}
                onChange={handleChange}
                size="small"
                sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
              />
            </Grid>

            {/* Measurements */}
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Weight (kg)"
                name="weightKg"
                type="number"
                value={formData.weightKg}
                onChange={handleChange}
                size="small"
                sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
                InputProps={{ endAdornment: <Typography variant="caption">kg</Typography> }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Volume (m³)"
                name="volumeCubicM"
                type="number"
                value={formData.volumeCubicM}
                onChange={handleChange}
                size="small"
                sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
                InputProps={{ endAdornment: <Typography variant="caption">m³</Typography> }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Pallet Count"
                name="palletCount"
                type="number"
                value={formData.palletCount}
                onChange={handleChange}
                size="small"
                sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
                InputProps={{ endAdornment: <Typography variant="caption">pallets</Typography> }}
              />
            </Grid>

            {/* Hazardous Material */}
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.hazardousMaterial}
                    onChange={handleChange}
                    name="hazardousMaterial"
                    color="error"
                  />
                }
                label="Hazardous Material"
                sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.8rem' } }}
              />
            </Grid>

            {/* Status */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ fontSize: '0.75rem' }}>Status</InputLabel>
                <Select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  label="Status"
                  sx={{ fontSize: '0.8rem' }}
                >
                  {STATUS_OPTIONS.map(option => (
                    <MenuItem key={option.value} value={option.value} sx={{ fontSize: '0.8rem' }}>
                      <Chip
                        label={option.label}
                        color={option.color}
                        size="small"
                        sx={{ height: 18, fontSize: '0.55rem' }}
                      />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Values */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Estimated Value (ZAR)"
                name="estimatedValue"
                type="number"
                value={formData.estimatedValue}
                onChange={handleChange}
                size="small"
                sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
                InputProps={{ startAdornment: <Typography variant="caption">R</Typography> }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Actual Value (ZAR)"
                name="actualValue"
                type="number"
                value={formData.actualValue}
                onChange={handleChange}
                size="small"
                sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
                InputProps={{ startAdornment: <Typography variant="caption">R</Typography> }}
              />
            </Grid>

            {/* Special Handling */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Special Handling Instructions"
                name="specialHandling"
                value={formData.specialHandling}
                onChange={handleChange}
                multiline
                rows={2}
                size="small"
                sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
              />
            </Grid>

            {/* Trip Selection */}
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2" sx={{ fontSize: '0.85rem', fontWeight: 600, mb: 1.5 }}>
                <Add sx={{ mr: 0.5, verticalAlign: 'middle', fontSize: '1rem' }} />
                Add Trips to Load
              </Typography>
              <Autocomplete
                multiple
                options={availableTrips}
                getOptionLabel={(option) => `${option.tripNumber} - ${option.originCity || option.originLocation} → ${option.destinationCity || option.destinationLocation}`}
                value={selectedTrips}
                onChange={handleTripSelect}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select Trips"
                    size="small"
                    placeholder="Search trips..."
                    sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
                  />
                )}
                renderChip={(props, option) => (
                  <Chip
                    {...props}
                    label={`${option.tripNumber}`}
                    size="small"
                    sx={{ height: 20, fontSize: '0.55rem' }}
                  />
                )}
                renderOption={(props, option) => (
                  <li {...props}>
                    <Box>
                      <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
                        {option.tripNumber}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
                        {option.originCity || option.originLocation} → {option.destinationCity || option.destinationLocation}
                        {option.status && ` • ${option.status}`}
                      </Typography>
                    </Box>
                  </li>
                )}
              />
            </Grid>

            {/* Submit Buttons */}
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <Button
                  type="submit"
                  variant="contained"
                  size="medium"
                  disabled={submitting}
                  startIcon={submitting ? <CircularProgress size={18} /> : <Save sx={{ fontSize: '0.9rem' }} />}
                  sx={{ minWidth: 180, fontSize: '0.8rem' }}
                >
                  {submitting ? 'Saving...' : (isEditMode ? 'Update Load' : 'Create Load')}
                </Button>
                <Button
                  variant="outlined"
                  size="medium"
                  onClick={() => navigate('/loads')}
                  sx={{ fontSize: '0.8rem' }}
                >
                  Cancel
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
};

export default LoadForm;
