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
  FormControlLabel,
  Switch,
  Paper,
  Typography,
  Stack,
  Chip,
  OutlinedInput
} from '@mui/material';
import { Save, Cancel, PersonAdd } from '@mui/icons-material';

const UserForm = ({ user = null, onSave, onCancel, roles = [] }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '', // Backend uses 'password', not 'password_hash'
    enabled: true,
    selectedRoleIds: [] // Multiple roles (many-to-many)
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      // Map backend user data to form state
      setFormData({
        username: user.username || '',
        email: user.email || '',
        password: '', // Always empty for editing (only set when changing password)
        enabled: user.enabled !== undefined ? user.enabled : true,
        selectedRoleIds: user.roles ? user.roles.map(role => role.id) : []
      });
    }
  }, [user]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    // Password only required for new users
    if (!user && !formData.password) {
      newErrors.password = 'Password is required for new users';
    }

    // Optional: Password strength validation for new users
    if (!user && formData.password && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    // Validate at least one role is selected
    if (formData.selectedRoleIds.length === 0) {
      newErrors.selectedRoleIds = 'At least one role is required';
    }

    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleRoleChange = (event) => {
    const {
      target: { value },
    } = event;

    // On autofill we get a stringified value.
    const selectedIds = typeof value === 'string' ? value.split(',') : value;

    setFormData(prev => ({
      ...prev,
      selectedRoleIds: selectedIds
    }));

    // Clear role error
    if (errors.selectedRoleIds) {
      setErrors(prev => ({ ...prev, selectedRoleIds: '' }));
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
      // Prepare data for backend
      const userData = {
        username: formData.username.trim(),
        email: formData.email.trim(),
        enabled: formData.enabled,
        roleIds: formData.selectedRoleIds // Send array of role IDs
      };

      // Only include password if provided (for new users or password changes)
      if (formData.password) {
        userData.password = formData.password;
      }

      await onSave(userData);

      if (!user) {
        // Reset form for new user
        setFormData({
          username: '',
          email: '',
          password: '',
          enabled: true,
          selectedRoleIds: []
        });
      }
    } catch (error) {
      console.error('Error saving user:', error);
      // Handle API errors
      if (error.response?.data) {
        const apiErrors = error.response.data;
        setErrors({
          username: apiErrors.username || '',
          email: apiErrors.email || '',
          password: apiErrors.password || '',
          selectedRoleIds: apiErrors.roleIds || ''
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Get selected role names for display
  const getSelectedRoleNames = () => {
    return roles
      .filter(role => formData.selectedRoleIds.includes(role.id))
      .map(role => role.name);
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        {user ? 'Edit User' : 'Create New User'}
      </Typography>

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Username *"
              name="username"
              value={formData.username}
              onChange={handleChange}
              error={!!errors.username}
              helperText={errors.username}
              disabled={loading}
              margin="normal"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Email *"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              error={!!errors.email}
              helperText={errors.email}
              disabled={loading}
              margin="normal"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label={user ? 'New Password (leave blank to keep current)' : 'Password *'}
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              error={!!errors.password}
              helperText={errors.password}
              disabled={loading}
              autoComplete="new-password"
              margin="normal"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth error={!!errors.selectedRoleIds} margin="normal">
              <InputLabel id="roles-label">Roles *</InputLabel>
              <Select
                labelId="roles-label"
                id="roles-select"
                multiple
                name="selectedRoleIds"
                value={formData.selectedRoleIds}
                onChange={handleRoleChange}
                input={<OutlinedInput label="Roles *" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {getSelectedRoleNames().map((name) => (
                      <Chip key={name} label={name} size="small" />
                    ))}
                  </Box>
                )}
                disabled={loading}
              >
                {roles.map((role) => (
                  <MenuItem key={role.id} value={role.id}>
                    {role.name}
                    {role.description && (
                      <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                        ({role.description})
                      </Typography>
                    )}
                  </MenuItem>
                ))}
              </Select>
              {errors.selectedRoleIds && (
                <Typography color="error" variant="caption">
                  {errors.selectedRoleIds}
                </Typography>
              )}
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  name="enabled"
                  checked={formData.enabled}
                  onChange={handleChange}
                  disabled={loading}
                />
              }
              label="Account Enabled"
              sx={{ mt: 2 }}
            />
          </Grid>

          <Grid item xs={12}>
            <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 2 }}>
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
                startIcon={user ? <Save /> : <PersonAdd />}
              >
                {user ? 'Update User' : 'Create User'}
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </form>
    </Paper>
  );
};

export default UserForm;