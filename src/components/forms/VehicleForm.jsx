import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Paper,
  Typography,
  Stack,
  Divider
} from '@mui/material';
import { Save, Cancel, DirectionsCar } from '@mui/icons-material';

const fuelTypes = ['Diesel', 'Petrol', 'Electric', 'Hybrid', 'CNG'];
const vehicleStatuses = ['Active', 'In Service', 'Out of Service', 'Retired'];

const VehicleForm = ({ vehicle = null, onSave, onCancel, drivers = [] }) => {
  const [formData, setFormData] = useState({
    registration_number: '',
    vin: '',
    make: '',
    model: '',
    year: '',
    fuel_type: '',
    status: 'Active',
    current_mileage: '',
    current_odometer: '',
    service_interval_km: '10000',
    last_service_date: '',
    avg_consumption: '',
    driver_id: '',
    notes: ''
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (vehicle) {
      setFormData({
        registration_number: vehicle.registration_number || '',
        vin: vehicle.vin || '',
        make: vehicle.make || '',
        model: vehicle.model || '',
        year: vehicle.year || '',
        fuel_type: vehicle.fuel_type || '',
        status: vehicle.status || 'Active',
        current_mileage: vehicle.current_mileage || '',
        current_odometer: vehicle.current_odometer || '',
        service_interval_km: vehicle.service_interval_km || '10000',
        last_service_date: vehicle.last_service_date ? vehicle.last_service_date.split('T')[0] : '',
        avg_consumption: vehicle.avg_consumption || '',
        driver_id: vehicle.driver_id || '',
        notes: vehicle.notes || ''
      });
    }
  }, [vehicle]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.registration_number.trim()) {
      newErrors.registration_number = 'Registration number is required';
    }

    if (!formData.make.trim()) {
      newErrors.make = 'Make is required';
    }

    if (!formData.model.trim()) {
      newErrors.model = 'Model is required';
    }

    if (!formData.year) {
      newErrors.year = 'Year is required';
    } else if (formData.year < 1900 || formData.year > new Date().getFullYear() + 1) {
      newErrors.year = 'Invalid year';
    }

    if (!formData.fuel_type) {
      newErrors.fuel_type = 'Fuel type is required';
    }

    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      await onSave(formData);
      if (!vehicle) {
        // Reset form for new vehicle
        setFormData({
          registration_number: '',
          vin: '',
          make: '',
          model: '',
          year: '',
          fuel_type: '',
          status: 'Active',
          current_mileage: '',
          current_odometer: '',
          service_interval_km: '10000',
          last_service_date: '',
          avg_consumption: '',
          driver_id: '',
          notes: ''
        });
      }
    } catch (error) {
      console.error('Error saving vehicle:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        {vehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
      </Typography>

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom color="primary">
              Basic Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Registration Number *"
              name="registration_number"
              value={formData.registration_number}
              onChange={handleChange}
              error={!!errors.registration_number}
              helperText={errors.registration_number}
              disabled={loading}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="VIN"
              name="vin"
              value={formData.vin}
              onChange={handleChange}
              disabled={loading}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Make *"
              name="make"
              value={formData.make}
              onChange={handleChange}
              error={!!errors.make}
              helperText={errors.make}
              disabled={loading}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Model *"
              name="model"
              value={formData.model}
              onChange={handleChange}
              error={!!errors.model}
              helperText={errors.model}
              disabled={loading}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Year *"
              name="year"
              type="number"
              value={formData.year}
              onChange={handleChange}
              error={!!errors.year}
              helperText={errors.year}
              disabled={loading}
              inputProps={{ min: 1900, max: new Date().getFullYear() + 1 }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth error={!!errors.fuel_type}>
              <InputLabel>Fuel Type *</InputLabel>
              <Select
                name="fuel_type"
                value={formData.fuel_type}
                onChange={handleChange}
                label="Fuel Type *"
                disabled={loading}
              >
                <MenuItem value="">Select Fuel Type</MenuItem>
                {fuelTypes.map(type => (
                  <MenuItem key={type} value={type}>{type}</MenuItem>
                ))}
              </Select>
              {errors.fuel_type && <Typography color="error" variant="caption">{errors.fuel_type}</Typography>}
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                name="status"
                value={formData.status}
                onChange={handleChange}
                label="Status"
                disabled={loading}
              >
                {vehicleStatuses.map(status => (
                  <MenuItem key={status} value={status}>{status}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom color="primary">
              Current Status & Metrics
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Current Mileage (km)"
              name="current_mileage"
              type="number"
              value={formData.current_mileage}
              onChange={handleChange}
              disabled={loading}
              InputProps={{ inputProps: { min: 0 } }}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Current Odometer (km)"
              name="current_odometer"
              type="number"
              value={formData.current_odometer}
              onChange={handleChange}
              disabled={loading}
              InputProps={{ inputProps: { min: 0 } }}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Avg. Consumption (km/L)"
              name="avg_consumption"
              type="number"
              value={formData.avg_consumption}
              onChange={handleChange}
              disabled={loading}
              InputProps={{ inputProps: { min: 0, step: 0.1 } }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Service Interval (km)"
              name="service_interval_km"
              type="number"
              value={formData.service_interval_km}
              onChange={handleChange}
              disabled={loading}
              InputProps={{ inputProps: { min: 1000 } }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Last Service Date"
              name="last_service_date"
              type="date"
              value={formData.last_service_date}
              onChange={handleChange}
              disabled={loading}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Assigned Driver</InputLabel>
              <Select
                name="driver_id"
                value={formData.driver_id}
                onChange={handleChange}
                label="Assigned Driver"
                disabled={loading}
              >
                <MenuItem value="">No Driver Assigned</MenuItem>
                {drivers.map(driver => (
                  <MenuItem key={driver.id} value={driver.id}>
                    {driver.first_name} {driver.last_name} ({driver.license_number})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              disabled={loading}
              multiline
              rows={3}
            />
          </Grid>

          <Grid item xs={12}>
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button
                variant="outlined"
                onClick={onCancel}
                disabled={loading}
                startIcon={<Cancel />}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                startIcon={vehicle ? <Save /> : <DirectionsCar />}
              >
                {vehicle ? 'Update Vehicle' : 'Add Vehicle'}
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </form>
    </Paper>
  );
};

export default VehicleForm;