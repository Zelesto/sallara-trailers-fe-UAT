// src/pages/customer/CustomerForm.jsx
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
  FormControlLabel,
  Switch,
  InputAdornment,
} from '@mui/material';
import {
  ArrowBack,
  Save,
  Person,
  Email,
  Phone,
  LocationOn,
  Business,
  ContactPhone,
  AttachMoney,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { customerService } from '../../services/customerService';

// Constants
const PROVINCES = [
  'Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal',
  'Limpopo', 'Mpumalanga', 'Northern Cape', 'North West', 'Western Cape'
];

const COUNTRIES = ['South Africa', 'Botswana', 'Lesotho', 'Namibia', 'Eswatini', 'Zimbabwe', 'Mozambique'];
const PAYMENT_TERMS = ['30 Days', '45 Days', '60 Days', '90 Days', 'Cash', 'On Delivery', 'Prepaid'];

const CustomerForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formErrors, setFormErrors] = useState({});

  const [formData, setFormData] = useState({
    // Basic Information
    customerCode: '',
    name: '',
    registrationNumber: '',
    vatNumber: '',
    email: '',
    phone: '',
    isActive: true,
    paymentTerms: '30 Days',
    creditLimit: '',
    
    // Address
    addressLine1: '',
    addressLine2: '',
    city: '',
    province: '',
    postalCode: '',
    country: 'South Africa',
    
    // Contact Person
    contactPerson: '',
    contactPhone: '',
    contactEmail: '',
    
    // Additional
    notes: '',
  });

  useEffect(() => {
    if (isEditMode) {
      loadCustomer();
    }
  }, [id]);

  const loadCustomer = async () => {
    try {
      setLoading(true);
      const customer = await customerService.getCustomerById(id);
      setFormData({
        customerCode: customer.customerCode || '',
        name: customer.name || '',
        registrationNumber: customer.registrationNumber || '',
        vatNumber: customer.vatNumber || '',
        email: customer.email || '',
        phone: customer.phone || '',
        isActive: customer.isActive !== undefined ? customer.isActive : true,
        paymentTerms: customer.paymentTerms || '30 Days',
        creditLimit: customer.creditLimit || '',
        
        addressLine1: customer.addressLine1 || '',
        addressLine2: customer.addressLine2 || '',
        city: customer.city || '',
        province: customer.province || '',
        postalCode: customer.postalCode || '',
        country: customer.country || 'South Africa',
        
        contactPerson: customer.contactPerson || '',
        contactPhone: customer.contactPhone || '',
        contactEmail: customer.contactEmail || '',
        
        notes: customer.notes || '',
      });
    } catch (err) {
      console.error('Error loading customer:', err);
      setError('Failed to load customer data');
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

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) {
      errors.name = 'Customer name is required';
    }
    if (!formData.customerCode.trim()) {
      errors.customerCode = 'Customer code is required';
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email address';
    }
    if (formData.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) {
      errors.contactEmail = 'Invalid contact email address';
    }
    if (formData.creditLimit && isNaN(parseFloat(formData.creditLimit))) {
      errors.creditLimit = 'Credit limit must be a number';
    }
    if (formData.creditLimit && parseFloat(formData.creditLimit) < 0) {
      errors.creditLimit = 'Credit limit cannot be negative';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      const firstError = Object.keys(formErrors)[0];
      const element = document.querySelector(`[name="${firstError}"]`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.focus();
      }
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        ...formData,
        creditLimit: formData.creditLimit ? parseFloat(formData.creditLimit) : null,
      };

      let response;
      if (isEditMode) {
        response = await customerService.updateCustomer(id, payload);
        setSuccess('Customer updated successfully!');
      } else {
        response = await customerService.createCustomer(payload);
        setSuccess('Customer created successfully!');
      }

      setTimeout(() => {
        navigate('/customers');
      }, 2000);

    } catch (err) {
      console.error('Error saving customer:', err);
      setError(err.message || 'Failed to save customer');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress size={40} />
        <Typography sx={{ ml: 2 }}>Loading customer data...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 1, sm: 1.5, md: 2 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Typography variant="h6" fontWeight="600" sx={{ fontSize: '1rem' }}>
            <Person sx={{ mr: 0.5, verticalAlign: 'middle', fontSize: '1.2rem' }} />
            {isEditMode ? 'Edit Customer' : 'Create New Customer'}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
            {isEditMode ? 'Update customer information' : 'Add a new customer to the system'}
          </Typography>
        </Box>
        <Button
          startIcon={<ArrowBack sx={{ fontSize: '0.9rem' }} />}
          onClick={() => navigate('/customers')}
          size="small"
          sx={{ fontSize: '0.75rem' }}
        >
          Back to Customers
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
            {/* ==================== BASIC INFORMATION ==================== */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ fontSize: '0.8rem', fontWeight: 600, mb: 1.5 }}>
                <Business sx={{ mr: 0.5, verticalAlign: 'middle', fontSize: '1rem' }} />
                Basic Information
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Customer Code *"
                name="customerCode"
                value={formData.customerCode}
                onChange={handleChange}
                size="small"
                required
                error={!!formErrors.customerCode}
                helperText={formErrors.customerCode}
                sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Customer Name *"
                name="name"
                value={formData.name}
                onChange={handleChange}
                size="small"
                required
                error={!!formErrors.name}
                helperText={formErrors.name}
                sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Registration Number"
                name="registrationNumber"
                value={formData.registrationNumber}
                onChange={handleChange}
                size="small"
                sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="VAT Number"
                name="vatNumber"
                value={formData.vatNumber}
                onChange={handleChange}
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
                error={!!formErrors.email}
                helperText={formErrors.email || 'Primary email address'}
                sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><Email sx={{ fontSize: '0.9rem' }} /></InputAdornment>,
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                size="small"
                sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><Phone sx={{ fontSize: '0.9rem' }} /></InputAdornment>,
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ fontSize: '0.75rem' }}>Payment Terms</InputLabel>
                <Select
                  name="paymentTerms"
                  value={formData.paymentTerms}
                  onChange={handleChange}
                  label="Payment Terms"
                  sx={{ fontSize: '0.8rem' }}
                >
                  {PAYMENT_TERMS.map(term => (
                    <MenuItem key={term} value={term} sx={{ fontSize: '0.8rem' }}>{term}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Credit Limit (ZAR)"
                name="creditLimit"
                type="number"
                value={formData.creditLimit}
                onChange={handleChange}
                size="small"
                error={!!formErrors.creditLimit}
                helperText={formErrors.creditLimit}
                sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><AttachMoney sx={{ fontSize: '0.9rem' }} /></InputAdornment>,
                  inputProps: { min: 0, step: 0.01 },
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={handleChange}
                    name="isActive"
                    color="success"
                  />
                }
                label={formData.isActive ? 'Active' : 'Inactive'}
                sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.8rem' } }}
              />
            </Grid>

            {/* ==================== ADDRESS ==================== */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ fontSize: '0.8rem', fontWeight: 600, mb: 1.5, mt: 1 }}>
                <LocationOn sx={{ mr: 0.5, verticalAlign: 'middle', fontSize: '1rem' }} />
                Address Information
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address Line 1"
                name="addressLine1"
                value={formData.addressLine1}
                onChange={handleChange}
                size="small"
                sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address Line 2"
                name="addressLine2"
                value={formData.addressLine2}
                onChange={handleChange}
                size="small"
                sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="City"
                name="city"
                value={formData.city}
                onChange={handleChange}
                size="small"
                sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ fontSize: '0.75rem' }}>Province</InputLabel>
                <Select
                  name="province"
                  value={formData.province}
                  onChange={handleChange}
                  label="Province"
                  sx={{ fontSize: '0.8rem' }}
                >
                  <MenuItem value="" sx={{ fontSize: '0.8rem' }}>Select Province</MenuItem>
                  {PROVINCES.map(province => (
                    <MenuItem key={province} value={province} sx={{ fontSize: '0.8rem' }}>{province}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Postal Code"
                name="postalCode"
                value={formData.postalCode}
                onChange={handleChange}
                size="small"
                sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ fontSize: '0.75rem' }}>Country</InputLabel>
                <Select
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  label="Country"
                  sx={{ fontSize: '0.8rem' }}
                >
                  {COUNTRIES.map(country => (
                    <MenuItem key={country} value={country} sx={{ fontSize: '0.8rem' }}>{country}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* ==================== CONTACT PERSON ==================== */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ fontSize: '0.8rem', fontWeight: 600, mb: 1.5, mt: 1 }}>
                <ContactPhone sx={{ mr: 0.5, verticalAlign: 'middle', fontSize: '1rem' }} />
                Contact Person
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Contact Person Name"
                name="contactPerson"
                value={formData.contactPerson}
                onChange={handleChange}
                size="small"
                sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Contact Phone"
                name="contactPhone"
                value={formData.contactPhone}
                onChange={handleChange}
                size="small"
                sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><Phone sx={{ fontSize: '0.9rem' }} /></InputAdornment>,
                }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Contact Email"
                name="contactEmail"
                type="email"
                value={formData.contactEmail}
                onChange={handleChange}
                size="small"
                error={!!formErrors.contactEmail}
                helperText={formErrors.contactEmail}
                sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><Email sx={{ fontSize: '0.9rem' }} /></InputAdornment>,
                }}
              />
            </Grid>

            {/* ==================== NOTES ==================== */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ fontSize: '0.8rem', fontWeight: 600, mb: 1.5, mt: 1 }}>
                Additional Information
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                multiline
                rows={3}
                size="small"
                sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
                placeholder="Any additional notes about this customer..."
              />
            </Grid>

            {/* ==================== SUBMIT BUTTONS ==================== */}
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
                  {submitting ? 'Saving...' : (isEditMode ? 'Update Customer' : 'Create Customer')}
                </Button>
                <Button
                  variant="outlined"
                  size="medium"
                  onClick={() => navigate('/customers')}
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

export default CustomerForm;
