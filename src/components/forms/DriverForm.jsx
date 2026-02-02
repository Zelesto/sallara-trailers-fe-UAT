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
import { Save, Cancel, Person } from '@mui/icons-material';

const licenseTypes = ['Type A', 'Type B', 'Type C', 'Type D', 'Type E'];

const DriverForm = ({ driver = null, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    license_number: '',
    license_type: '',
    license_expiry: '',
    hire_date: '',
    status: 'Active',
    address: '',
    emergency_contact: '',
    emergency_phone: '',
    notes: ''
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (driver) {
      setFormData({
        first_name: driver.first_name || '',
        last_name: driver.last_name || '',
        email: driver.email || '',
        phone: driver.phone || '',
        license_number: driver.license_number || '',
        license_type: driver.license_type || '',
        license_expiry: driver.license_expiry ? driver.license_expiry.split('T')[0] : '',
        hire_date: driver.hire_date ? driver.hire_date.split('T')[0] : '',
        status: driver.status || 'Active',
        address: driver.address || '',
        emergency_contact: driver.emergency_contact || '',
        emergency_phone: driver.emergency_phone || '',
        notes: driver.notes || ''
      });
    }
  }, [driver]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
    }

    if (!formData.license_number.trim()) {
      newErrors.license_number = 'License number is required';
    }

    if (!formData.license_type) {
      newErrors.license_type = 'License type is required';
    }

    if (!formData.license_expiry) {
      newErrors.license_expiry = 'License expiry date is required';
    } else if (new Date(formData.license_expiry) < new Date()) {
      newErrors.license_expiry = 'License has expired';
    }

    if (!formData.hire_date) {
      newErrors.hire_date = 'Hire date is required';
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
      if (!driver) {
        // Reset form for new driver
        setFormData({
          first_name: '',
          last_name: '',
          email: '',
          phone: '',
          license_number: '',
          license_type: '',
          license_expiry: '',
          hire_date: '',
          status: 'Active',
          address: '',
          emergency_contact: '',
          emergency_phone: '',
          notes: ''
        });
      }
    } catch (error) {
      console.error('Error saving driver:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        {driver ? 'Edit Driver' : 'Add New Driver'}
      </Typography>

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom color="primary">
              Personal Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="First Name *"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              error={!!errors.first_name}
              helperText={errors.first_name}
              disabled={loading}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Last Name *"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              error={!!errors.last_name}
              helperText={errors.last_name}
              disabled={loading}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              disabled={loading}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              disabled={loading}
            />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom color="primary">
              License Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="License Number *"
              name="license_number"
              value={formData.license_number}
              onChange={handleChange}
              error={!!errors.license_number}
              helperText={errors.license_number}
              disabled={loading}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth error={!!errors.license_type}>
              <InputLabel>License Type *</InputLabel>
              <Select
                name="license_type"
                value={formData.license_type}
                onChange={handleChange}
                label="License Type *"
                disabled={loading}
              >
                <MenuItem value="">Select License Type</MenuItem>
                {licenseTypes.map(type => (
                  <MenuItem key={type} value={type}>{type}</MenuItem>
                ))}
              </Select>
              {errors.license_type && <Typography color="error" variant="caption">{errors.license_type}</Typography>}
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="License Expiry Date *"
              name="license_expiry"
              type="date"
              value={formData.license_expiry}
              onChange={handleChange}
              error={!!errors.license_expiry}
              helperText={errors.license_expiry}
              disabled={loading}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Hire Date *"
              name="hire_date"
              type="date"
              value={formData.hire_date}
              onChange={handleChange}
              error={!!errors.hire_date}
              helperText={errors.hire_date}
              disabled={loading}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom color="primary">
              Contact & Emergency Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              disabled={loading}
              multiline
              rows={2}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Emergency Contact"
              name="emergency_contact"
              value={formData.emergency_contact}
              onChange={handleChange}
              disabled={loading}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Emergency Phone"
              name="emergency_phone"
              value={formData.emergency_phone}
              onChange={handleChange}
              disabled={loading}
            />
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
                startIcon={driver ? <Save /> : <Person />}
              >
                {driver ? 'Update Driver' : 'Add Driver'}
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </form>
    </Paper>
  );
};

export default DriverForm;