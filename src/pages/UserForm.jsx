// src/pages/users/UserForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  FormControlLabel,
  Switch,
  Alert,
  CircularProgress,
  Divider,
  Chip,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Stack,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  PersonAdd as PersonAddIcon,
  Cancel as CancelIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import userService from '../services/user';

const UserForm = ({ mode = 'create' }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = mode === 'edit' || id;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    enabled: true,
    roleIds: [],
  });

  const [formErrors, setFormErrors] = useState({});

  // Available roles - you can fetch these from API
  const [availableRoles, setAvailableRoles] = useState([
    { id: 1, name: 'ADMIN' },
    { id: 2, name: 'SUPER_ADMIN' },
    { id: 3, name: 'DISPATCHER' },
    { id: 4, name: 'DRIVER' },
    { id: 5, name: 'WAREHOUSE' },
  ]);

  // Fetch user data if in edit mode
  useEffect(() => {
    if (isEditMode && id) {
      fetchUserData();
    }
  }, [id]);

  const fetchUserData = async () => {
    setFetching(true);
    try {
      console.log(`🔍 Fetching user ${id} for editing...`);
      const response = await userService.getUserById(id);
      console.log('📦 User data:', response);

      // Handle different response formats
      let userData = response;
      if (response && response.data) {
        userData = response.data;
      }

      if (userData) {
        setFormData({
          username: userData.username || '',
          email: userData.email || '',
          password: '',
          confirmPassword: '',
          enabled: userData.enabled !== undefined ? userData.enabled : true,
          roleIds: userData.roles?.map(role => 
            typeof role === 'string' ? role : role.id || role.roleId
          ).filter(Boolean) || [],
        });
      }
    } catch (err) {
      console.error('❌ Error fetching user:', err);
      setError('Failed to load user data');
    } finally {
      setFetching(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'enabled' ? checked : value,
    }));
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleRoleChange = (event) => {
    const { value } = event.target;
    setFormData(prev => ({
      ...prev,
      roleIds: typeof value === 'string' ? value.split(',').map(Number) : value,
    }));
    if (formErrors.roleIds) {
      setFormErrors(prev => ({ ...prev, roleIds: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.username.trim()) {
      errors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      errors.username = 'Username must be at least 3 characters';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }

    // Password is required only for create mode
    if (!isEditMode) {
      if (!formData.password) {
        errors.password = 'Password is required';
      } else if (formData.password.length < 6) {
        errors.password = 'Password must be at least 6 characters';
      }

      if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
    } else {
      // In edit mode, password is optional
      if (formData.password && formData.password.length < 6) {
        errors.password = 'Password must be at least 6 characters';
      }
      if (formData.password && formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
    }

    if (formData.roleIds.length === 0) {
      errors.roleIds = 'Please select at least one role';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Prepare user data
      const userData = {
        username: formData.username.trim(),
        email: formData.email.trim(),
        enabled: formData.enabled,
        roleIds: formData.roleIds,
      };

      // Only include password if provided (required for create, optional for edit)
      if (formData.password) {
        userData.password = formData.password;
      }

      console.log(`📤 ${isEditMode ? 'Updating' : 'Creating'} user:`, userData);

      let response;
      if (isEditMode) {
        response = await userService.updateUser(id, userData);
        console.log('✅ User updated:', response);
      } else {
        response = await userService.createUser(userData);
        console.log('✅ User created:', response);
      }

      setSuccess(true);

      // Redirect to users list after 2 seconds
      setTimeout(() => {
        navigate('/users');
      }, 2000);

    } catch (err) {
      console.error(`❌ Error ${isEditMode ? 'updating' : 'creating'} user:`, err);

      // Handle specific error messages
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.response?.data?.errors) {
        // Handle validation errors from backend
        const backendErrors = err.response.data.errors;
        const formattedErrors = {};
        if (Array.isArray(backendErrors)) {
          backendErrors.forEach(error => {
            if (error.field) {
              formattedErrors[error.field] = error.message;
            }
          });
        }
        setFormErrors(formattedErrors);
        setError('Please fix the validation errors');
      } else {
        setError(`Failed to ${isEditMode ? 'update' : 'create'} user. Please try again.`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/users');
  };

  if (fetching) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/users')}
          sx={{ mr: 2 }}
        >
          Back
        </Button>
        <Typography variant="h5" fontWeight="600">
          {isEditMode ? 'Edit User' : 'Add New User'}
        </Typography>
        {isEditMode && (
          <Chip
            label={`ID: ${id}`}
            size="small"
            sx={{ ml: 2 }}
          />
        )}
      </Box>

      {/* Success Message */}
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          User {isEditMode ? 'updated' : 'created'} successfully! Redirecting...
        </Alert>
      )}

      {/* Error Message */}
      {error && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      {/* Form */}
      <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Username */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                error={!!formErrors.username}
                helperText={formErrors.username}
                required
                disabled={loading}
              />
            </Grid>

            {/* Email */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                error={!!formErrors.email}
                helperText={formErrors.email}
                required
                disabled={loading}
              />
            </Grid>

            {/* Password (only for create mode or optional in edit) */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={isEditMode ? "New Password (optional)" : "Password"}
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                error={!!formErrors.password}
                helperText={formErrors.password || (isEditMode ? "Leave blank to keep current password" : "")}
                required={!isEditMode}
                disabled={loading}
              />
            </Grid>

            {/* Confirm Password */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Confirm Password"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                error={!!formErrors.confirmPassword}
                helperText={formErrors.confirmPassword}
                required={!!formData.password}
                disabled={loading}
              />
            </Grid>

            {/* Enabled Switch */}
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.enabled}
                    onChange={handleChange}
                    name="enabled"
                    color="primary"
                    disabled={loading}
                  />
                }
                label={formData.enabled ? "User is Active" : "User is Inactive"}
              />
            </Grid>

            {/* Roles Selection */}
            <Grid item xs={12}>
              <FormControl fullWidth error={!!formErrors.roleIds}>
                <InputLabel>Roles</InputLabel>
                <Select
                  multiple
                  value={formData.roleIds}
                  onChange={handleRoleChange}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => {
                        const role = availableRoles.find(r => r.id === value);
                        return (
                          <Chip
                            key={value}
                            label={role?.name || value}
                            size="small"
                            color="primary"
                          />
                        );
                      })}
                    </Box>
                  )}
                  disabled={loading}
                >
                  {availableRoles.map((role) => (
                    <MenuItem key={role.id} value={role.id}>
                      {role.name}
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.roleIds && (
                  <Typography color="error" variant="caption" sx={{ mt: 1 }}>
                    {formErrors.roleIds}
                  </Typography>
                )}
              </FormControl>
            </Grid>

            {/* Actions */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                  disabled={loading || success}
                  sx={{ minWidth: 150 }}
                >
                  {loading ? 'Saving...' : isEditMode ? 'Update User' : 'Create User'}
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<CancelIcon />}
                  onClick={handleCancel}
                  disabled={loading}
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

export default UserForm;
