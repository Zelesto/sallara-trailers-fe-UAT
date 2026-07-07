// src/pages/drivers/DriverForm.jsx
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
  Chip,
  InputAdornment,
  FormHelperText, 
  Stack,
  Divider,
} from '@mui/material';
import { 
  ArrowBack, 
  Save, 
  Person,
  Email,
  Phone,
  Badge,
  CalendarToday,
  LocationOn,
  VpnKey,
} from '@mui/icons-material';
import driverService from '../services/driverService';

const DriverForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
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
    employmentType: '',
    shiftPattern: '',
    trainingCompleted: false,
    medicalClearanceDate: '',
    nextMedicalDue: '',
    notes: '',
    appUserId: '', // ⭐ ADD THIS
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (isEditMode) {
      loadDriver();
    }
  }, [id]);

  const loadDriver = async () => {
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
      employmentType: driver.employmentType || '',
      shiftPattern: driver.shiftPattern || '',
      trainingCompleted: driver.trainingCompleted || false,
      medicalClearanceDate: driver.medicalClearanceDate || '',
      nextMedicalDue: driver.nextMedicalDue || '',
      notes: driver.notes || '',
      appUserId: driver.appUserId || '', // ⭐ CAPTURE THIS
      password: '',
      confirmPassword: '',
    });
  } catch (err) {
    setError('Failed to load driver data');
  } finally {
    setLoading(false);
  }
};

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
    if (name.includes('password')) {
      setPasswordError('');
    }
  };

  const validateForm = () => {
    // For updates, we don't need to validate appUserId if it exists
    if (!formData.firstName.trim()) {
      setError('First Name is required');
      return false;
    }
    if (!formData.lastName.trim()) {
      setError('Last Name is required');
      return false;
    }
    if (!formData.licenseNumber.trim()) {
      setError('License Number is required');
      return false;
    }

    if (!isEditMode) {
      if (!formData.password.trim()) {
        setPasswordError('Password is required');
        return false;
      }
      if (formData.password.length < 6) {
        setPasswordError('Password must be at least 6 characters');
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        setPasswordError('Passwords do not match');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  setError('');
  setSuccess('');
  setPasswordError('');

  if (!validateForm()) return;

  setSubmitting(true);
  try {
    // Build payload - only include non-null values for updates
    const driverData = {
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      email: formData.email?.trim() || null,
      phoneNumber: formData.phoneNumber?.trim() || null,
      licenseNumber: formData.licenseNumber.trim(),
      licenseExpiry: formData.licenseExpiry || null,
      licenseType: formData.licenseType?.trim() || null,
      status: formData.status || 'ACTIVE',
      hireDate: formData.hireDate || null,
      employmentType: formData.employmentType?.trim() || null,
      shiftPattern: formData.shiftPattern?.trim() || null,
      trainingCompleted: formData.trainingCompleted || false,
      medicalClearanceDate: formData.medicalClearanceDate || null,
      nextMedicalDue: formData.nextMedicalDue || null,
      notes: formData.notes?.trim() || null,
    };

    // ⭐ CRITICAL: For updates, ALWAYS include appUserId
    if (isEditMode) {
      // Use the appUserId from the loaded data
      if (formData.appUserId) {
        driverData.appUserId = parseInt(formData.appUserId);
        console.log('✅ Using appUserId from form data:', driverData.appUserId);
      } else {
        // If no appUserId in form data, try to get it from the driver
        try {
          const existingDriver = await driverService.getDriverById(id);
          if (existingDriver && existingDriver.appUserId) {
            driverData.appUserId = parseInt(existingDriver.appUserId);
            console.log('✅ Using appUserId from existing driver:', driverData.appUserId);
          }
        } catch (err) {
          console.warn('Could not get appUserId from existing driver:', err);
        }
      }
    }

    // Add password for new drivers
    if (!isEditMode) {
      driverData.password = formData.password;
    }

    console.log('📤 Sending driver data:', driverData);

    let result;
    if (isEditMode) {
      result = await driverService.updateDriver(id, driverData);
      setSuccess('Driver updated successfully!');
    } else {
      result = await driverService.createDriver(driverData);
      setSuccess('Driver created successfully!');
    }

    console.log('✅ Driver saved:', result);

    setTimeout(() => {
      navigate('/drivers');
    }, 1500);
  } catch (err) {
    console.error('❌ Error saving driver:', err);
    setError(err.response?.data?.message || err.message || `Failed to ${isEditMode ? 'update' : 'create'} driver`);
  } finally {
    setSubmitting(false);
  }
};

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress size={40} />
        <Typography sx={{ ml: 2, fontSize: '0.9rem' }}>Loading driver data...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 1, sm: 1.5, md: 2 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Box>
          <Typography variant="h6" fontWeight="600" sx={{ fontSize: '1rem' }}>
            {isEditMode ? 'Edit Driver' : 'Create New Driver'}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
            {isEditMode ? 'Update driver information' : 'Add a new driver to the fleet'}
          </Typography>
        </Box>
        <Button 
          startIcon={<ArrowBack sx={{ fontSize: '0.9rem' }} />} 
          onClick={() => navigate('/drivers')}
          size="small"
          sx={{ fontSize: '0.75rem' }}
        >
          Back to Drivers
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
            {/* Personal Information Section */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ fontSize: '0.8rem', fontWeight: 600, mb: 1.5 }}>
                <Person sx={{ mr: 0.5, fontSize: '1rem', verticalAlign: 'middle' }} />
                Personal Information
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="First Name *"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                size="small"
                sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Last Name *"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                size="small"
                sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
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
                size="small"
                sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><Email sx={{ fontSize: '0.9rem' }} /></InputAdornment>,
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone Number"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                size="small"
                sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><Phone sx={{ fontSize: '0.9rem' }} /></InputAdornment>,
                }}
              />
            </Grid>

            {/* License Information Section */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ fontSize: '0.8rem', fontWeight: 600, mb: 1.5, mt: 1 }}>
                <Badge sx={{ mr: 0.5, fontSize: '1rem', verticalAlign: 'middle' }} />
                License Information
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="License Number *"
                name="licenseNumber"
                value={formData.licenseNumber}
                onChange={handleChange}
                required
                size="small"
                sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><Badge sx={{ fontSize: '0.9rem' }} /></InputAdornment>,
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="License Type"
                name="licenseType"
                value={formData.licenseType}
                onChange={handleChange}
                size="small"
                placeholder="e.g., EC, C1, EB"
                sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
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
                size="small"
                sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><CalendarToday sx={{ fontSize: '0.9rem' }} /></InputAdornment>,
                }}
              />
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
                size="small"
                sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><CalendarToday sx={{ fontSize: '0.9rem' }} /></InputAdornment>,
                }}
              />
            </Grid>

            {/* Employment Information */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ fontSize: '0.8rem', fontWeight: 600, mb: 1.5, mt: 1 }}>
                <Person sx={{ mr: 0.5, fontSize: '1rem', verticalAlign: 'middle' }} />
                Employment Details
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Employment Type"
                name="employmentType"
                value={formData.employmentType}
                onChange={handleChange}
                size="small"
                placeholder="e.g., Full-time, Part-time, Contractor"
                sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Shift Pattern"
                name="shiftPattern"
                value={formData.shiftPattern}
                onChange={handleChange}
                size="small"
                placeholder="e.g., Day Shift, Night Shift, Rotating"
                sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Medical Clearance Date"
                name="medicalClearanceDate"
                type="date"
                value={formData.medicalClearanceDate}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
                size="small"
                sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Next Medical Due"
                name="nextMedicalDue"
                type="date"
                value={formData.nextMedicalDue}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
                size="small"
                sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
              />
            </Grid>

            {/* Status Section */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ fontSize: '0.8rem', fontWeight: 600, mb: 1.5, mt: 1 }}>
                <LocationOn sx={{ mr: 0.5, fontSize: '1rem', verticalAlign: 'middle' }} />
                Status & Notes
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

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
                  <MenuItem value="ACTIVE" sx={{ fontSize: '0.8rem' }}>Active</MenuItem>
                  <MenuItem value="AVAILABLE" sx={{ fontSize: '0.8rem' }}>Available</MenuItem>
                  <MenuItem value="ON_LEAVE" sx={{ fontSize: '0.8rem' }}>On Leave</MenuItem>
                  <MenuItem value="INACTIVE" sx={{ fontSize: '0.8rem' }}>Inactive</MenuItem>
                  <MenuItem value="SUSPENDED" sx={{ fontSize: '0.8rem' }}>Suspended</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Training Completed"
                name="trainingCompleted"
                select
                value={formData.trainingCompleted}
                onChange={handleChange}
                size="small"
                sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
              >
                <MenuItem value={true}>Yes</MenuItem>
                <MenuItem value={false}>No</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                name="notes"
                multiline
                rows={2}
                value={formData.notes}
                onChange={handleChange}
                size="small"
                placeholder="Additional notes about the driver..."
                sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
              />
            </Grid>

            {/* Password Section (only for new drivers) */}
            {!isEditMode && (
              <>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" sx={{ fontSize: '0.8rem', fontWeight: 600, mb: 1.5, mt: 1 }}>
                    <VpnKey sx={{ mr: 0.5, fontSize: '1rem', verticalAlign: 'middle' }} />
                    Password
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Password *"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    size="small"
                    error={!!passwordError}
                    helperText={passwordError || 'Minimum 6 characters'}
                    autoComplete="new-password"
                    sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Confirm Password *"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    size="small"
                    error={!!passwordError}
                    helperText={passwordError}
                    autoComplete="new-password"
                    sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
                  />
                </Grid>
              </>
            )}

            {/* Form Actions */}
            <Grid item xs={12}>
              <Divider sx={{ my: 1.5 }} />
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <Button
                  type="submit"
                  variant="contained"
                  size="medium"
                  startIcon={submitting ? <CircularProgress size={18} /> : <Save sx={{ fontSize: '0.9rem' }} />}
                  disabled={submitting}
                  sx={{ 
                    minWidth: { xs: '100%', sm: 180 },
                    fontSize: '0.8rem',
                    py: 0.75
                  }}
                >
                  {submitting ? 'Saving...' : (isEditMode ? 'Update Driver' : 'Create Driver')}
                </Button>
                <Button
                  variant="outlined"
                  size="medium"
                  onClick={() => navigate('/drivers')}
                  disabled={submitting}
                  sx={{ fontSize: '0.8rem', py: 0.75 }}
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

export default DriverForm;
