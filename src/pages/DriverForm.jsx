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
  Card,
  CardContent,
  IconButton,
  Tooltip,
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
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import driverService from '../services/driverService';

// Replace the FormSectionHeader component with this fixed version:

const FormSectionHeader = ({ icon, title, subtitle }) => (
  <Box sx={{ mb: 2 }}>
    <Stack direction="row" spacing={1} alignItems="center">
      <Box
        sx={{
          bgcolor: 'primary.light',
          borderRadius: '8px',
          p: 0.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'primary.main',
        }}
      >
        {icon}
      </Box>
      <Typography variant="subtitle1" sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
        {title}
      </Typography>
    </Stack>
    {subtitle && (
      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', ml: 4.5 }}>
        {subtitle}
      </Typography>
    )}
    <Divider sx={{ mt: 1.5 }} />
  </Box>
);

// Status Chip Component
const StatusChip = ({ status }) => {
  const statusMap = {
    ACTIVE: { color: 'success', label: 'Active', icon: <CheckCircleIcon /> },
    AVAILABLE: { color: 'info', label: 'Available', icon: <InfoIcon /> },
    ON_LEAVE: { color: 'warning', label: 'On Leave', icon: <WarningIcon /> },
    INACTIVE: { color: 'error', label: 'Inactive', icon: <CloseIcon /> },
    SUSPENDED: { color: 'error', label: 'Suspended', icon: <WarningIcon /> },
  };
  const info = statusMap[status] || { color: 'default', label: status || 'Unknown', icon: null };
  return (
    <Chip
      label={info.label}
      color={info.color}
      size="small"
      icon={info.icon}
      sx={{
        fontWeight: 600,
        fontSize: '0.7rem',
        height: 24,
        '& .MuiChip-label': { px: 1 },
        '& .MuiChip-icon': { fontSize: '0.8rem' },
      }}
    />
  );
};

const DriverForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

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
    appUserId: '',
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
        appUserId: driver.appUserId || '',
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
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.firstName.trim()) {
      errors.firstName = 'First Name is required';
    }
    if (!formData.lastName.trim()) {
      errors.lastName = 'Last Name is required';
    }
    if (!formData.licenseNumber.trim()) {
      errors.licenseNumber = 'License Number is required';
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!isEditMode) {
      if (!formData.password.trim()) {
        errors.password = 'Password is required';
      } else if (formData.password.length < 6) {
        errors.password = 'Password must be at least 6 characters';
      }
      if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setPasswordError('');

    if (!validateForm()) return;

    setSubmitting(true);
    try {
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

      if (isEditMode) {
        if (formData.appUserId) {
          driverData.appUserId = parseInt(formData.appUserId);
        } else {
          try {
            const existingDriver = await driverService.getDriverById(id);
            if (existingDriver && existingDriver.appUserId) {
              driverData.appUserId = parseInt(existingDriver.appUserId);
            }
          } catch (err) {
            console.warn('Could not get appUserId from existing driver:', err);
          }
        }
      }

      if (!isEditMode) {
        driverData.password = formData.password;
      }

      let result;
      if (isEditMode) {
        result = await driverService.updateDriver(id, driverData);
        setSuccess('Driver updated successfully!');
      } else {
        result = await driverService.createDriver(driverData);
        setSuccess('Driver created successfully!');
      }

      setTimeout(() => {
        navigate('/drivers');
      }, 1500);
    } catch (err) {
      console.error('Error saving driver:', err);
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
    <Box sx={{ bgcolor: '#F7F7FC', minHeight: '100vh', p: { xs: 2, md: 3 } }}>
      <Box sx={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
          <Box>
            <Typography variant="h5" fontWeight="700" sx={{ fontSize: '1.25rem' }}>
              {isEditMode ? 'Edit Driver' : 'Create New Driver'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
              {isEditMode ? 'Update driver information and credentials' : 'Add a new driver to the fleet'}
            </Typography>
          </Box>
          <Button
            startIcon={<ArrowBack sx={{ fontSize: '0.9rem' }} />}
            onClick={() => navigate('/drivers')}
            size="small"
            sx={{
              fontSize: '0.8rem',
              color: '#6B7280',
              '&:hover': { bgcolor: 'transparent' },
            }}
          >
            Back to Drivers
          </Button>
        </Box>

        {/* Status Indicator for Edit Mode */}
        {isEditMode && (
          <Paper
            elevation={0}
            sx={{
              p: 2,
              mb: 3,
              borderRadius: '12px',
              border: '1px solid #ECECEC',
              bgcolor: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 1,
            }}
          >
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                Driver Status:
              </Typography>
              <StatusChip status={formData.status} />
            </Stack>
            <Stack direction="row" spacing={1}>
              <Chip
                label={`ID: #${id}`}
                size="small"
                variant="outlined"
                sx={{ fontSize: '0.7rem' }}
              />
              {formData.licenseNumber && (
                <Chip
                  label={`License: ${formData.licenseNumber}`}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: '0.7rem' }}
                />
              )}
            </Stack>
          </Paper>
        )}

        {/* Main Form */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, sm: 3, md: 4 },
            borderRadius: '16px',
            border: '1px solid #ECECEC',
            bgcolor: '#FFFFFF',
          }}
        >
          <form onSubmit={handleSubmit}>
            {error && (
              <Alert
                severity="error"
                sx={{ mb: 3, borderRadius: '8px', fontSize: '0.8rem' }}
                onClose={() => setError('')}
                icon={<WarningIcon />}
              >
                {error}
              </Alert>
            )}
            {success && (
              <Alert
                severity="success"
                sx={{ mb: 3, borderRadius: '8px', fontSize: '0.8rem' }}
                onClose={() => setSuccess('')}
                icon={<CheckCircleIcon />}
              >
                {success}
              </Alert>
            )}

            <Grid container spacing={3}>
              {/* Personal Information Section */}
              <Grid item xs={12}>
  <FormSectionHeader
    icon={<Person sx={{ fontSize: '1.1rem' }} />}
    title="Personal Information"
    subtitle="Basic personal details of the driver"
  />
</Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="First Name *"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  size="medium"
                  error={!!validationErrors.firstName}
                  helperText={validationErrors.firstName}
                  sx={{
                    '& .MuiInputLabel-root': { fontSize: '0.8rem' },
                    '& .MuiInputBase-root': { fontSize: '0.85rem' },
                  }}
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
                  size="medium"
                  error={!!validationErrors.lastName}
                  helperText={validationErrors.lastName}
                  sx={{
                    '& .MuiInputLabel-root': { fontSize: '0.8rem' },
                    '& .MuiInputBase-root': { fontSize: '0.85rem' },
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Email Address"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  size="medium"
                  error={!!validationErrors.email}
                  helperText={validationErrors.email}
                  sx={{
                    '& .MuiInputLabel-root': { fontSize: '0.8rem' },
                    '& .MuiInputBase-root': { fontSize: '0.85rem' },
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email sx={{ fontSize: '1rem', color: '#6B7280' }} />
                      </InputAdornment>
                    ),
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
                  size="medium"
                  sx={{
                    '& .MuiInputLabel-root': { fontSize: '0.8rem' },
                    '& .MuiInputBase-root': { fontSize: '0.85rem' },
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Phone sx={{ fontSize: '1rem', color: '#6B7280' }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              {/* License Information Section */}
              <Grid item xs={12}>
                <FormSectionHeader
                  icon={<Badge sx={{ fontSize: '1.1rem' }} />}
                  title="License Information"
                  subtitle="Driver's license and certification details"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="License Number *"
                  name="licenseNumber"
                  value={formData.licenseNumber}
                  onChange={handleChange}
                  required
                  size="medium"
                  error={!!validationErrors.licenseNumber}
                  helperText={validationErrors.licenseNumber}
                  sx={{
                    '& .MuiInputLabel-root': { fontSize: '0.8rem' },
                    '& .MuiInputBase-root': { fontSize: '0.85rem' },
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Badge sx={{ fontSize: '1rem', color: '#6B7280' }} />
                      </InputAdornment>
                    ),
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
                  size="medium"
                  placeholder="e.g., EC, C1, EB"
                  sx={{
                    '& .MuiInputLabel-root': { fontSize: '0.8rem' },
                    '& .MuiInputBase-root': { fontSize: '0.85rem' },
                  }}
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
                  size="medium"
                  sx={{
                    '& .MuiInputLabel-root': { fontSize: '0.8rem' },
                    '& .MuiInputBase-root': { fontSize: '0.85rem' },
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
                  size="medium"
                  sx={{
                    '& .MuiInputLabel-root': { fontSize: '0.8rem' },
                    '& .MuiInputBase-root': { fontSize: '0.85rem' },
                  }}
                />
              </Grid>

              {/* Employment Information Section */}
              <Grid item xs={12}>
                <FormSectionHeader
                  icon={<Person sx={{ fontSize: '1.1rem' }} />}
                  title="Employment Details"
                  subtitle="Work schedule and employment information"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Employment Type"
                  name="employmentType"
                  value={formData.employmentType}
                  onChange={handleChange}
                  size="medium"
                  placeholder="e.g., Full-time, Part-time, Contractor"
                  sx={{
                    '& .MuiInputLabel-root': { fontSize: '0.8rem' },
                    '& .MuiInputBase-root': { fontSize: '0.85rem' },
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Shift Pattern"
                  name="shiftPattern"
                  value={formData.shiftPattern}
                  onChange={handleChange}
                  size="medium"
                  placeholder="e.g., Day Shift, Night Shift, Rotating"
                  sx={{
                    '& .MuiInputLabel-root': { fontSize: '0.8rem' },
                    '& .MuiInputBase-root': { fontSize: '0.85rem' },
                  }}
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
                  size="medium"
                  sx={{
                    '& .MuiInputLabel-root': { fontSize: '0.8rem' },
                    '& .MuiInputBase-root': { fontSize: '0.85rem' },
                  }}
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
                  size="medium"
                  sx={{
                    '& .MuiInputLabel-root': { fontSize: '0.8rem' },
                    '& .MuiInputBase-root': { fontSize: '0.85rem' },
                  }}
                />
              </Grid>

              {/* Status Section */}
              <Grid item xs={12}>
                <FormSectionHeader
                  icon={<LocationOn sx={{ fontSize: '1.1rem' }} />}
                  title="Status & Notes"
                  subtitle="Current status and additional information"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth size="medium">
                  <InputLabel sx={{ fontSize: '0.8rem' }}>Status</InputLabel>
                  <Select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    label="Status"
                    sx={{ fontSize: '0.85rem' }}
                  >
                    <MenuItem value="ACTIVE" sx={{ fontSize: '0.85rem' }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <CheckCircleIcon sx={{ fontSize: '0.9rem', color: '#22C55E' }} />
                        <span>Active</span>
                      </Stack>
                    </MenuItem>
                    <MenuItem value="AVAILABLE" sx={{ fontSize: '0.85rem' }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <InfoIcon sx={{ fontSize: '0.9rem', color: '#3B82F6' }} />
                        <span>Available</span>
                      </Stack>
                    </MenuItem>
                    <MenuItem value="ON_LEAVE" sx={{ fontSize: '0.85rem' }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <WarningIcon sx={{ fontSize: '0.9rem', color: '#F59E0B' }} />
                        <span>On Leave</span>
                      </Stack>
                    </MenuItem>
                    <MenuItem value="INACTIVE" sx={{ fontSize: '0.85rem' }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <CloseIcon sx={{ fontSize: '0.9rem', color: '#EF4444' }} />
                        <span>Inactive</span>
                      </Stack>
                    </MenuItem>
                    <MenuItem value="SUSPENDED" sx={{ fontSize: '0.85rem' }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <WarningIcon sx={{ fontSize: '0.9rem', color: '#EF4444' }} />
                        <span>Suspended</span>
                      </Stack>
                    </MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth size="medium">
                  <InputLabel sx={{ fontSize: '0.8rem' }}>Training Completed</InputLabel>
                  <Select
                    name="trainingCompleted"
                    value={formData.trainingCompleted}
                    onChange={handleChange}
                    label="Training Completed"
                    sx={{ fontSize: '0.85rem' }}
                  >
                    <MenuItem value={true} sx={{ fontSize: '0.85rem' }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <CheckCircleIcon sx={{ fontSize: '0.9rem', color: '#22C55E' }} />
                        <span>Yes</span>
                      </Stack>
                    </MenuItem>
                    <MenuItem value={false} sx={{ fontSize: '0.85rem' }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <CloseIcon sx={{ fontSize: '0.9rem', color: '#EF4444' }} />
                        <span>No</span>
                      </Stack>
                    </MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes"
                  name="notes"
                  multiline
                  rows={3}
                  value={formData.notes}
                  onChange={handleChange}
                  size="medium"
                  placeholder="Additional notes about the driver..."
                  sx={{
                    '& .MuiInputLabel-root': { fontSize: '0.8rem' },
                    '& .MuiInputBase-root': { fontSize: '0.85rem' },
                  }}
                />
              </Grid>

              {/* Password Section (only for new drivers) */}
              {!isEditMode && (
                <>
                  <Grid item xs={12}>
                    <FormSectionHeader
                      icon={<VpnKey sx={{ fontSize: '1.1rem' }} />}
                      title="Account Credentials"
                      subtitle="Create login credentials for the driver"
                    />
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
                      size="medium"
                      error={!!validationErrors.password || !!passwordError}
                      helperText={validationErrors.password || passwordError || 'Minimum 6 characters'}
                      autoComplete="new-password"
                      sx={{
                        '& .MuiInputLabel-root': { fontSize: '0.8rem' },
                        '& .MuiInputBase-root': { fontSize: '0.85rem' },
                      }}
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
                      size="medium"
                      error={!!validationErrors.confirmPassword || !!passwordError}
                      helperText={validationErrors.confirmPassword || passwordError}
                      autoComplete="new-password"
                      sx={{
                        '& .MuiInputLabel-root': { fontSize: '0.8rem' },
                        '& .MuiInputBase-root': { fontSize: '0.85rem' },
                      }}
                    />
                  </Grid>
                </>
              )}

              {/* Form Actions */}
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={2}
                  sx={{
                    justifyContent: 'space-between',
                    alignItems: { xs: 'stretch', sm: 'center' },
                  }}
                >
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                    {isEditMode
                      ? 'Updating driver information will affect their account access.'
                      : 'New driver will receive login credentials via email.'}
                  </Typography>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                    <Button
                      type="submit"
                      variant="contained"
                      size="large"
                      startIcon={submitting ? <CircularProgress size={20} /> : <Save sx={{ fontSize: '1rem' }} />}
                      disabled={submitting}
                      sx={{
                        minWidth: { xs: '100%', sm: 200 },
                        fontSize: '0.85rem',
                        py: 1,
                        borderRadius: '10px',
                        textTransform: 'none',
                        fontWeight: 600,
                        background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #4338CA 0%, #4F46E5 100%)',
                          boxShadow: '0 4px 12px rgba(79,70,229,0.3)',
                        },
                      }}
                    >
                      {submitting ? 'Saving...' : (isEditMode ? 'Update Driver' : 'Create Driver')}
                    </Button>
                    <Button
                      variant="outlined"
                      size="large"
                      onClick={() => navigate('/drivers')}
                      disabled={submitting}
                      sx={{
                        fontSize: '0.85rem',
                        py: 1,
                        borderRadius: '10px',
                        textTransform: 'none',
                        borderColor: '#ECECEC',
                        color: '#6B7280',
                        '&:hover': {
                          borderColor: '#4F46E5',
                          bgcolor: '#EEF2FF',
                          color: '#4F46E5',
                        },
                      }}
                    >
                      Cancel
                    </Button>
                  </Stack>
                </Stack>
              </Grid>
            </Grid>
          </form>
        </Paper>
      </Box>
    </Box>
  );
};

export default DriverForm;
