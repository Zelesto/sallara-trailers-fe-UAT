// src/pages/FuelSlipForm.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fuelService } from '../services/fuelService';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Stack,
  CircularProgress,
  Alert,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  Divider,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  LocalGasStation,
  Clear as ClearIcon,
} from '@mui/icons-material';

const FuelSlipForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    slipNumber: '',
    transactionDate: new Date().toISOString().slice(0, 16),
    vehicleId: '',
    vehicleRegistration: '',
    driverId: '',
    driverName: '',
    quantity: '',
    unitPrice: '',
    stationName: '',
    location: '',
    notes: '',
    fuelType: 'Diesel (50ppm)',
    paymentMethod: 'Fleet Card',
    receiptNumber: '',
    odometerReading: '',
    pumpNumber: '',
    tripId: '',
    loadId: '',
    fuelSourceId: '',
  });

  useEffect(() => {
    if (isEdit && id) {
      fetchSlipDetails();
    }
  }, [id]);

  const fetchSlipDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fuelService.getFuelSlipById(id);
      setFormData({
        slipNumber: data.slipNumber || '',
        transactionDate: data.transactionDate ? new Date(data.transactionDate).toISOString().slice(0, 16) : '',
        vehicleId: data.vehicleId || '',
        vehicleRegistration: data.vehicleRegNumber || '',
        driverId: data.driverId || '',
        driverName: data.driverName || '',
        quantity: data.quantity || '',
        unitPrice: data.unitPrice || '',
        stationName: data.stationName || '',
        location: data.location || '',
        notes: data.notes || '',
        fuelType: data.fuelType || 'Diesel (50ppm)',
        paymentMethod: data.paymentMethod || 'Fleet Card',
        receiptNumber: data.receiptNumber || '',
        odometerReading: data.odometerReading || '',
        pumpNumber: data.pumpNumber || '',
        tripId: data.tripId || '',
        loadId: data.loadId || '',
        fuelSourceId: data.fuelSourceId || '',
      });
    } catch (err) {
      console.error('Failed to fetch fuel slip:', err);
      setError(err.message || 'Failed to load fuel slip');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field) => (event) => {
    setFormData({ ...formData, [field]: event.target.value });
  };

  const handleClearField = (field) => {
    setFormData({ ...formData, [field]: '' });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      // Validate required fields
      if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
        throw new Error('Quantity must be greater than 0');
      }
      if (!formData.unitPrice || parseFloat(formData.unitPrice) <= 0) {
        throw new Error('Unit price must be greater than 0');
      }
      if (!formData.stationName) {
        throw new Error('Station name is required');
      }

      // Prepare data for API
      const payload = {
        ...formData,
        quantity: parseFloat(formData.quantity),
        unitPrice: parseFloat(formData.unitPrice),
        odometerReading: formData.odometerReading ? parseFloat(formData.odometerReading) : null,
        tripId: formData.tripId ? parseInt(formData.tripId, 10) : null,
        loadId: formData.loadId ? parseInt(formData.loadId, 10) : null,
        vehicleId: formData.vehicleId ? parseInt(formData.vehicleId, 10) : null,
        driverId: formData.driverId ? parseInt(formData.driverId, 10) : null,
        fuelSourceId: formData.fuelSourceId ? parseInt(formData.fuelSourceId, 10) : null,
      };

      let result;
      if (isEdit) {
        result = await fuelService.updateFuelSlip(id, payload);
        console.log('✅ Fuel slip updated:', result);
      } else {
        result = await fuelService.createFuelSlip(payload);
        console.log('✅ Fuel slip created:', result);
      }

      navigate('/fuel/slips');
    } catch (err) {
      console.error('❌ Failed to save fuel slip:', err);
      setError(err.message || 'Failed to save fuel slip');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/fuel/slips');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress size={40} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 1, sm: 1.5, md: 2 }, maxWidth: 900, mx: 'auto' }}>
      <Paper sx={{ p: 2 }}>
        <Box display="flex" alignItems="center" mb={2}>
          <IconButton onClick={handleCancel} size="small">
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ ml: 1, fontSize: '1rem', fontWeight: 600 }}>
            <LocalGasStation sx={{ verticalAlign: 'middle', mr: 0.5, fontSize: '1.2rem' }} />
            {isEdit ? 'Edit Fuel Slip' : 'New Fuel Slip'}
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            {/* Basic Fields */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Slip Number"
                value={formData.slipNumber}
                onChange={handleChange('slipNumber')}
                size="small"
                disabled={isEdit}
                helperText={isEdit ? 'Slip number cannot be changed' : 'Optional - auto-generated if left blank'}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Transaction Date"
                type="datetime-local"
                value={formData.transactionDate}
                onChange={handleChange('transactionDate')}
                size="small"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* Vehicle */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Vehicle Registration"
                value={formData.vehicleRegistration}
                onChange={handleChange('vehicleRegistration')}
                size="small"
                placeholder="e.g., ABC-123-GP"
                InputProps={{
                  endAdornment: formData.vehicleRegistration && (
                    <IconButton size="small" onClick={() => handleClearField('vehicleRegistration')}>
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Vehicle ID"
                type="number"
                value={formData.vehicleId}
                onChange={handleChange('vehicleId')}
                size="small"
                placeholder="Optional - link to existing vehicle"
              />
            </Grid>

            {/* Driver */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Driver Name"
                value={formData.driverName}
                onChange={handleChange('driverName')}
                size="small"
                placeholder="e.g., John Doe"
                InputProps={{
                  endAdornment: formData.driverName && (
                    <IconButton size="small" onClick={() => handleClearField('driverName')}>
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Driver ID"
                type="number"
                value={formData.driverId}
                onChange={handleChange('driverId')}
                size="small"
                placeholder="Optional - link to existing driver"
              />
            </Grid>

            {/* Trip & Load References */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Trip ID"
                type="number"
                value={formData.tripId}
                onChange={handleChange('tripId')}
                size="small"
                placeholder="Optional - link to trip"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Load ID"
                type="number"
                value={formData.loadId}
                onChange={handleChange('loadId')}
                size="small"
                placeholder="Optional - link to load"
              />
            </Grid>

            {/* Fuel Details */}
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2" sx={{ fontSize: '0.8rem', fontWeight: 600, mb: 1 }}>
                Fuel Details
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Quantity (L) *"
                type="number"
                required
                value={formData.quantity}
                onChange={handleChange('quantity')}
                size="small"
                InputProps={{ inputProps: { step: '0.01', min: '0.01' } }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Unit Price (ZAR) *"
                type="number"
                required
                value={formData.unitPrice}
                onChange={handleChange('unitPrice')}
                size="small"
                InputProps={{ inputProps: { step: '0.01', min: '0.01' } }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Odometer Reading"
                type="number"
                value={formData.odometerReading}
                onChange={handleChange('odometerReading')}
                size="small"
                InputProps={{ inputProps: { step: '1', min: '0' } }}
              />
            </Grid>

            {/* Station Details */}
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2" sx={{ fontSize: '0.8rem', fontWeight: 600, mb: 1 }}>
                Station Details
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Station Name *"
                required
                value={formData.stationName}
                onChange={handleChange('stationName')}
                size="small"
                placeholder="e.g., Shell N1"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Location"
                value={formData.location}
                onChange={handleChange('location')}
                size="small"
                placeholder="e.g., Sandton, Johannesburg"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Pump Number"
                value={formData.pumpNumber}
                onChange={handleChange('pumpNumber')}
                size="small"
                placeholder="e.g., Pump 3"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Receipt Number"
                value={formData.receiptNumber}
                onChange={handleChange('receiptNumber')}
                size="small"
                placeholder="Optional receipt number"
              />
            </Grid>

            {/* Additional Fields */}
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2" sx={{ fontSize: '0.8rem', fontWeight: 600, mb: 1 }}>
                Additional Information
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Fuel Type</InputLabel>
                <Select
                  value={formData.fuelType}
                  label="Fuel Type"
                  onChange={handleChange('fuelType')}
                >
                  <MenuItem value="Diesel (50ppm)">Diesel (50ppm)</MenuItem>
                  <MenuItem value="Diesel (500ppm)">Diesel (500ppm)</MenuItem>
                  <MenuItem value="Petrol 93">Petrol 93</MenuItem>
                  <MenuItem value="Petrol 95">Petrol 95</MenuItem>
                  <MenuItem value="LPG">LPG</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Payment Method</InputLabel>
                <Select
                  value={formData.paymentMethod}
                  label="Payment Method"
                  onChange={handleChange('paymentMethod')}
                >
                  <MenuItem value="Fleet Card">Fleet Card</MenuItem>
                  <MenuItem value="Cash">Cash</MenuItem>
                  <MenuItem value="Credit Card">Credit Card</MenuItem>
                  <MenuItem value="Debit Card">Debit Card</MenuItem>
                  <MenuItem value="Fuel Card">Fuel Card</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Notes */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={3}
                value={formData.notes}
                onChange={handleChange('notes')}
                size="small"
                placeholder="Additional notes..."
              />
            </Grid>

            {/* Actions */}
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Stack direction="row" spacing={1} justifyContent="flex-end">
                <Button
                  variant="outlined"
                  onClick={handleCancel}
                  disabled={submitting}
                  size="small"
                  sx={{ fontSize: '0.8rem' }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={submitting}
                  startIcon={submitting ? <CircularProgress size={18} /> : <SaveIcon />}
                  size="small"
                  sx={{ fontSize: '0.8rem' }}
                >
                  {submitting ? 'Saving...' : (isEdit ? 'Update Slip' : 'Create Slip')}
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
};

export default FuelSlipForm;
