// src/pages/vehicles/VehicleForm.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  Alert,
  CircularProgress,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Stack,
} from '@mui/material';
import { ArrowBack, Save } from '@mui/icons-material';
import vehicleService from '../../services/vehicleService';
import Breadcrumbs from '../../components/Layout/Breadcrumbs';

const VehicleForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    registrationNumber: '',
    make: '',
    model: '',
    year: '',
    vehicleType: '',
    capacityKg: '',
    status: 'ACTIVE',
    fuelType: '',
    currentMileage: '',
    engineSize: '',
    fuelConsumption: '',
    lastServiceDate: '',
    nextServiceDate: '',
  });

  useEffect(() => {
    if (isEditMode) {
      loadVehicle();
    }
  }, [id]);

  const loadVehicle = async () => {
    try {
      setLoading(true);
      const vehicle = await vehicleService.getVehicleById(id);
      setFormData({
        registrationNumber: vehicle.registrationNumber || '',
        make: vehicle.make || '',
        model: vehicle.model || '',
        year: vehicle.year || '',
        vehicleType: vehicle.vehicleType || '',
        capacityKg: vehicle.capacityKg || '',
        status: vehicle.status || 'ACTIVE',
        fuelType: vehicle.fuelType || '',
        currentMileage: vehicle.currentMileage || '',
        engineSize: vehicle.engineSize || '',
        fuelConsumption: vehicle.fuelConsumption || '',
        lastServiceDate: vehicle.lastServiceDate || '',
        nextServiceDate: vehicle.nextServiceDate || '',
      });
    } catch (err) {
      setError('Failed to load vehicle data');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!formData.registrationNumber.trim()) {
      setError('Registration Number is required');
      return false;
    }
    if (!formData.make.trim()) {
      setError('Make is required');
      return false;
    }
    if (!formData.model.trim()) {
      setError('Model is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const vehicleData = {
        ...formData,
        capacityKg: formData.capacityKg ? parseFloat(formData.capacityKg) : null,
        currentMileage: formData.currentMileage ? parseFloat(formData.currentMileage) : null,
      };

      if (isEditMode) {
        await vehicleService.updateVehicle(id, vehicleData);
        setSuccess('Vehicle updated successfully!');
      } else {
        await vehicleService.createVehicle(vehicleData);
        setSuccess('Vehicle created successfully!');
      }

      setTimeout(() => {
        navigate('/vehicles');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'create'} vehicle`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Breadcrumbs />
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          {isEditMode ? 'Edit Vehicle' : 'Create New Vehicle'}
        </Typography>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/vehicles')}>
          Back
        </Button>
      </Box>

      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
              {success}
            </Alert>
          )}

          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Registration Number *"
                name="registrationNumber"
                value={formData.registrationNumber}
                onChange={handleChange}
                required
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Make *"
                name="make"
                value={formData.make}
                onChange={handleChange}
                required
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Model *"
                name="model"
                value={formData.model}
                onChange={handleChange}
                required
                size="small"
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Year"
                name="year"
                type="number"
                value={formData.year}
                onChange={handleChange}
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Vehicle Type"
                name="vehicleType"
                value={formData.vehicleType}
                onChange={handleChange}
                size="small"
                placeholder="e.g., TRUCK, TRAILER, etc."
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Capacity (kg)"
                name="capacityKg"
                type="number"
                value={formData.capacityKg}
                onChange={handleChange}
                size="small"
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  label="Status"
                >
                  <MenuItem value="ACTIVE">Active</MenuItem>
                  <MenuItem value="AVAILABLE">Available</MenuItem>
                  <MenuItem value="IN_MAINTENANCE">In Maintenance</MenuItem>
                  <MenuItem value="OUT_OF_SERVICE">Out of Service</MenuItem>
                  <MenuItem value="INACTIVE">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Fuel Type"
                name="fuelType"
                value={formData.fuelType}
                onChange={handleChange}
                size="small"
                placeholder="e.g., Diesel, Petrol, Electric"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Current Mileage"
                name="currentMileage"
                type="number"
                value={formData.currentMileage}
                onChange={handleChange}
                size="small"
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Engine Size"
                name="engineSize"
                value={formData.engineSize}
                onChange={handleChange}
                size="small"
                placeholder="e.g., 12.8L"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Fuel Consumption"
                name="fuelConsumption"
                value={formData.fuelConsumption}
                onChange={handleChange}
                size="small"
                placeholder="e.g., 30L/100km"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Last Service Date"
                name="lastServiceDate"
                type="date"
                value={formData.lastServiceDate}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Next Service Date"
                name="nextServiceDate"
                type="date"
                value={formData.nextServiceDate}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
                size="small"
              />
            </Grid>

            <Grid item xs={12}>
              <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={submitting ? <CircularProgress size={20} /> : <Save />}
                  disabled={submitting}
                >
                  {submitting ? 'Saving...' : (isEditMode ? 'Update Vehicle' : 'Create Vehicle')}
                </Button>
                <Button variant="outlined" onClick={() => navigate('/vehicles')}>
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

export default VehicleForm;
