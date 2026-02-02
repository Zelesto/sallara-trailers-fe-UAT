// src/pages/DriverForm.jsx - Complete version with password
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Grid,
  Alert,
  CircularProgress,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Paper
} from '@mui/material';
import { ArrowBack, Save } from '@mui/icons-material';
import driverService from '../services/driverService';

const DriverForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(isEditMode);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    licenseNumber: '',
    licenseExpiry: '',
    licenseType: '',
    status: 'ACTIVE',
    hireDate: '',
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (isEditMode) {
      fetchDriver();
    }
  }, [id]);

  const fetchDriver = async () => {
    try {
      setLoading(true);
      const driver = await driverService.getDriverById(id);
      setFormData({
        firstName: driver.firstName || '',
        lastName: driver.lastName || '',
        email: driver.email || '',
        phoneNumber: driver.phoneNumber || '',
        licenseNumber: driver.licenseNumber || '',
        licenseExpiry: driver.licenseExpiry || '',
        licenseType: driver.licenseType || '',
        status: driver.status || 'ACTIVE',
        hireDate: driver.hireDate || '',
        password: '', // Don't pre-fill password for security
        confirmPassword: '',
      });
    } catch (err) {
      setError('Failed to load driver data');
      console.error('Error fetching driver:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear password error when user types
    if (name.includes('password')) {
      setPasswordError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setPasswordError('');

    try {
      // Validate required fields
      if (!formData.firstName.trim() || !formData.lastName.trim()) {
        setError('First Name and Last Name are required');
        return;
      }

      // Validate passwords for new drivers
      if (!isEditMode) {
        if (!formData.password.trim()) {
          setPasswordError('Password is required');
          return;
        }

        if (formData.password.length < 6) {
          setPasswordError('Password must be at least 6 characters');
          return;
        }

        if (formData.password !== formData.confirmPassword) {
          setPasswordError('Passwords do not match');
          return;
        }
      }

      // Prepare data for API
      const driverData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        licenseNumber: formData.licenseNumber,
        licenseExpiry: formData.licenseExpiry,
        licenseType: formData.licenseType,
        status: formData.status,
        hireDate: formData.hireDate,
      };

      // Only include password for new drivers
      if (!isEditMode) {
        driverData.password = formData.password;
      }

      console.log('Sending driver data:', { ...driverData, password: '***HIDDEN***' });

      if (isEditMode) {
        await driverService.updateDriver(id, driverData);
        setSuccess('Driver updated successfully!');
      } else {
        await driverService.createDriver(driverData);
        setSuccess('Driver created successfully!');
      }

      // Redirect back to driver list after 2 seconds
      setTimeout(() => {
        navigate('/users/drivers');
      }, 2000);
    } catch (err) {
      console.error('Full error object:', err);

      // Try to extract meaningful error message
      let errorMessage = `Failed to ${isEditMode ? 'update' : 'create'} driver`;

      if (err.response?.data) {
        if (err.response.data.message) {
          errorMessage = err.response.data.message;
        } else if (err.response.data.error) {
          errorMessage = err.response.data.error;
        } else if (typeof err.response.data === 'string') {
          errorMessage = err.response.data;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
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
    <Box sx={{ p: 3 }}>
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate(-1)}
        sx={{ mb: 3 }}
      >
        Back
      </Button>

      <Typography variant="h4" gutterBottom>
        {isEditMode ? 'Edit Driver' : 'Create New Driver'}
      </Typography>

      <Paper sx={{ p: 3, mt: 2 }}>
        <form onSubmit={handleSubmit}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="First Name"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                variant="outlined"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Last Name"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                variant="outlined"
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
                variant="outlined"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone Number"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                variant="outlined"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="License Number"
                name="licenseNumber"
                value={formData.licenseNumber}
                onChange={handleChange}
                required
                variant="outlined"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="License Expiry"
                name="licenseExpiry"
                type="date"
                value={formData.licenseExpiry}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
                variant="outlined"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="License Type"
                name="licenseType"
                value={formData.licenseType}
                onChange={handleChange}
                variant="outlined"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  label="Status"
                >
                  <MenuItem value="ACTIVE">Active</MenuItem>
                  <MenuItem value="INACTIVE">Inactive</MenuItem>
                  <MenuItem value="SUSPENDED">Suspended</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Hire Date"
                name="hireDate"
                type="date"
                value={formData.hireDate}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
                variant="outlined"
              />
            </Grid>

            {/* Password fields - Only show for new drivers */}
            {!isEditMode && (
              <>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    variant="outlined"
                    error={!!passwordError}
                    helperText={passwordError}
                    autoComplete="new-password"
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Confirm Password"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    variant="outlined"
                    error={!!passwordError}
                    helperText={passwordError}
                    autoComplete="new-password"
                  />
                </Grid>
              </>
            )}

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  size="large"
                  startIcon={<Save />}
                >
                  {isEditMode ? 'Update Driver' : 'Create Driver'}
                </Button>

                <Button
                  variant="outlined"
                  onClick={() => navigate('/users/drivers')}
                >
                  Cancel
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
};

export default DriverForm;