// src/pages/customer/CustomerForm.jsx
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
  Business,
  LocationOn,
  AttachMoney,
  Receipt,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  PersonAdd as PersonAddIcon,
  Badge,
} from '@mui/icons-material';
import { customerService } from '../../services/customerService';

// Form Section Header Component
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
      <Typography variant="subtitle1" sx={{ fontWeight: 600, fontSize: '0.9rem', color: '#111827' }}>
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
  const isActive = status !== false;
  return (
    <Chip
      label={isActive ? 'Active' : 'Inactive'}
      color={isActive ? 'success' : 'error'}
      size="small"
      icon={isActive ? <CheckCircleIcon sx={{ fontSize: '0.8rem' }} /> : <CloseIcon sx={{ fontSize: '0.8rem' }} />}
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
    email: '',
    phone: '',
    website: '',
    registrationNumber: '',
    vatNumber: '',
    
    // Address
    addressLine1: '',
    addressLine2: '',
    city: '',
    province: '',
    postalCode: '',
    country: 'South Africa',
    
    // Contact
    contactPerson: '',
    contactPhone: '',
    contactEmail: '',
    
    // Financial
    paymentTerms: '30 Days',
    creditLimit: '',
    currency: 'ZAR',
    
    // Status
    isActive: true,
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
        email: customer.email || '',
        phone: customer.phone || '',
        website: customer.website || '',
        registrationNumber: customer.registrationNumber || '',
        vatNumber: customer.vatNumber || '',
        addressLine1: customer.addressLine1 || '',
        addressLine2: customer.addressLine2 || '',
        city: customer.city || '',
        province: customer.province || '',
        postalCode: customer.postalCode || '',
        country: customer.country || 'South Africa',
        contactPerson: customer.contactPerson || '',
        contactPhone: customer.contactPhone || '',
        contactEmail: customer.contactEmail || '',
        paymentTerms: customer.paymentTerms || '30 Days',
        creditLimit: customer.creditLimit || '',
        currency: customer.currency || 'ZAR',
        isActive: customer.isActive !== undefined ? customer.isActive : true,
        notes: customer.notes || '',
      });
      setError('');
    } catch (err) {
      setError('Failed to load customer data');
      console.error('Error loading customer:', err);
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
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.name?.trim()) {
      errors.name = 'Customer Name is required';
    }
    if (!formData.customerCode?.trim()) {
      errors.customerCode = 'Customer Code is required';
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    if (formData.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) {
      errors.contactEmail = 'Please enter a valid contact email address';
    }
    if (formData.creditLimit && isNaN(formData.creditLimit)) {
      errors.creditLimit = 'Please enter a valid credit limit';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) {
      const firstErrorField = Object.keys(formErrors)[0];
      const element = document.querySelector(`[name="${firstErrorField}"]`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.focus();
      }
      return;
    }

    setSubmitting(true);
    try {
      const customerData = {
        customerCode: formData.customerCode?.trim() || '',
        name: formData.name?.trim() || '',
        email: formData.email?.trim() || null,
        phone: formData.phone?.trim() || null,
        website: formData.website?.trim() || null,
        registrationNumber: formData.registrationNumber?.trim() || null,
        vatNumber: formData.vatNumber?.trim() || null,
        addressLine1: formData.addressLine1?.trim() || null,
        addressLine2: formData.addressLine2?.trim() || null,
        city: formData.city?.trim() || null,
        province: formData.province?.trim() || null,
        postalCode: formData.postalCode?.trim() || null,
        country: formData.country?.trim() || 'South Africa',
        contactPerson: formData.contactPerson?.trim() || null,
        contactPhone: formData.contactPhone?.trim() || null,
        contactEmail: formData.contactEmail?.trim() || null,
        paymentTerms: formData.paymentTerms || '30 Days',
        creditLimit: formData.creditLimit ? parseFloat(formData.creditLimit) : null,
        currency: formData.currency || 'ZAR',
        isActive: formData.isActive !== undefined ? formData.isActive : true,
        notes: formData.notes?.trim() || null,
      };

      let result;
      if (isEditMode) {
        result = await customerService.updateCustomer(id, customerData);
        setSuccess('Customer updated successfully!');
      } else {
        result = await customerService.createCustomer(customerData);
        setSuccess('Customer created successfully!');
      }

      setTimeout(() => {
        navigate('/customers');
      }, 1500);
    } catch (err) {
      console.error('Error saving customer:', err);
      setError(err.response?.data?.message || err.message || `Failed to ${isEditMode ? 'update' : 'create'} customer`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this customer?')) return;
    try {
      await customerService.deleteCustomer(id);
      navigate('/customers');
    } catch (err) {
      setError('Failed to delete customer');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress size={40} />
        <Typography sx={{ ml: 2, fontSize: '0.9rem' }}>Loading customer data...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: '#F7F7FC', minHeight: '100vh', p: { xs: 2, md: 3 } }}>
      <Box sx={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
          <Box>
            <Typography variant="h5" fontWeight="700" sx={{ fontSize: '1.25rem', color: '#111827' }}>
              {isEditMode ? 'Edit Customer' : 'Create New Customer'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
              {isEditMode ? 'Update customer information' : 'Add a new customer to the system'}
            </Typography>
          </Box>
          <Button
            startIcon={<ArrowBack sx={{ fontSize: '0.9rem' }} />}
            onClick={() => navigate('/customers')}
            size="small"
            sx={{
              fontSize: '0.8rem',
              color: '#6B7280',
              '&:hover': { bgcolor: 'transparent' },
            }}
          >
            Back to Customers
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
                Customer Status:
              </Typography>
              <StatusChip status={formData.isActive} />
            </Stack>
            <Stack direction="row" spacing={1}>
              <Chip
                label={`Code: ${formData.customerCode}`}
                size="small"
                variant="outlined"
                sx={{ fontSize: '0.7rem' }}
              />
              {formData.paymentTerms && (
                <Chip
                  label={`Terms: ${formData.paymentTerms}`}
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
              {/* Basic Information Section */}
              <Grid item xs={12}>
                <FormSectionHeader
                  icon={<Business sx={{ fontSize: '1.1rem' }} />}
                  title="Basic Information"
                  subtitle="Customer identification and contact details"
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Customer Code *"
                  name="customerCode"
                  value={formData.customerCode}
                  onChange={handleChange}
                  required
                  size="medium"
                  error={!!formErrors.customerCode}
                  helperText={formErrors.customerCode}
                  placeholder="e.g., CUST-001"
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

              <Grid item xs={12} md={8}>
                <TextField
                  fullWidth
                  label="Customer Name *"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  size="medium"
                  error={!!formErrors.name}
                  helperText={formErrors.name}
                  placeholder="Enter customer name"
                  sx={{
                    '& .MuiInputLabel-root': { fontSize: '0.8rem' },
                    '& .MuiInputBase-root': { fontSize: '0.85rem' },
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Business sx={{ fontSize: '1rem', color: '#6B7280' }} />
                      </InputAdornment>
                    ),
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
                  error={!!formErrors.email}
                  helperText={formErrors.email}
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
                  name="phone"
                  value={formData.phone}
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

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Website"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  size="medium"
                  placeholder="https://example.com"
                  sx={{
                    '& .MuiInputLabel-root': { fontSize: '0.8rem' },
                    '& .MuiInputBase-root': { fontSize: '0.85rem' },
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Business sx={{ fontSize: '1rem', color: '#6B7280' }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Registration Number"
                  name="registrationNumber"
                  value={formData.registrationNumber}
                  onChange={handleChange}
                  size="medium"
                  placeholder="Company registration number"
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
                  label="VAT Number"
                  name="vatNumber"
                  value={formData.vatNumber}
                  onChange={handleChange}
                  size="medium"
                  placeholder="VAT registration number"
                  sx={{
                    '& .MuiInputLabel-root': { fontSize: '0.8rem' },
                    '& .MuiInputBase-root': { fontSize: '0.85rem' },
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Receipt sx={{ fontSize: '1rem', color: '#6B7280' }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              {/* Address Section */}
              <Grid item xs={12}>
                <FormSectionHeader
                  icon={<LocationOn sx={{ fontSize: '1.1rem' }} />}
                  title="Address Information"
                  subtitle="Customer's physical and postal address"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Address Line 1"
                  name="addressLine1"
                  value={formData.addressLine1}
                  onChange={handleChange}
                  size="medium"
                  placeholder="Street address"
                  sx={{
                    '& .MuiInputLabel-root': { fontSize: '0.8rem' },
                    '& .MuiInputBase-root': { fontSize: '0.85rem' },
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LocationOn sx={{ fontSize: '1rem', color: '#6B7280' }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Address Line 2"
                  name="addressLine2"
                  value={formData.addressLine2}
                  onChange={handleChange}
                  size="medium"
                  placeholder="Apartment, suite, unit, etc."
                  sx={{
                    '& .MuiInputLabel-root': { fontSize: '0.8rem' },
                    '& .MuiInputBase-root': { fontSize: '0.85rem' },
                  }}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="City"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  size="medium"
                  placeholder="City / Town"
                  sx={{
                    '& .MuiInputLabel-root': { fontSize: '0.8rem' },
                    '& .MuiInputBase-root': { fontSize: '0.85rem' },
                  }}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Province"
                  name="province"
                  value={formData.province}
                  onChange={handleChange}
                  size="medium"
                  placeholder="Province / State"
                  sx={{
                    '& .MuiInputLabel-root': { fontSize: '0.8rem' },
                    '& .MuiInputBase-root': { fontSize: '0.85rem' },
                  }}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Postal Code"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleChange}
                  size="medium"
                  placeholder="Postal / Zip code"
                  sx={{
                    '& .MuiInputLabel-root': { fontSize: '0.8rem' },
                    '& .MuiInputBase-root': { fontSize: '0.85rem' },
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Country"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  size="medium"
                  placeholder="Country"
                  sx={{
                    '& .MuiInputLabel-root': { fontSize: '0.8rem' },
                    '& .MuiInputBase-root': { fontSize: '0.85rem' },
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LocationOn sx={{ fontSize: '1rem', color: '#6B7280' }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              {/* Contact Person Section */}
              <Grid item xs={12}>
                <FormSectionHeader
                  icon={<Person sx={{ fontSize: '1.1rem' }} />}
                  title="Contact Person"
                  subtitle="Primary contact person details"
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Contact Name"
                  name="contactPerson"
                  value={formData.contactPerson}
                  onChange={handleChange}
                  size="medium"
                  placeholder="Full name"
                  sx={{
                    '& .MuiInputLabel-root': { fontSize: '0.8rem' },
                    '& .MuiInputBase-root': { fontSize: '0.85rem' },
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Person sx={{ fontSize: '1rem', color: '#6B7280' }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Contact Phone"
                  name="contactPhone"
                  value={formData.contactPhone}
                  onChange={handleChange}
                  size="medium"
                  placeholder="Phone number"
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

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Contact Email"
                  name="contactEmail"
                  type="email"
                  value={formData.contactEmail}
                  onChange={handleChange}
                  size="medium"
                  error={!!formErrors.contactEmail}
                  helperText={formErrors.contactEmail}
                  placeholder="Email address"
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

              {/* Financial Information Section */}
              <Grid item xs={12}>
                <FormSectionHeader
                  icon={<AttachMoney sx={{ fontSize: '1.1rem' }} />}
                  title="Financial Information"
                  subtitle="Payment terms and credit details"
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <FormControl fullWidth size="medium">
                  <InputLabel sx={{ fontSize: '0.8rem' }}>Payment Terms</InputLabel>
                  <Select
                    name="paymentTerms"
                    value={formData.paymentTerms}
                    onChange={handleChange}
                    label="Payment Terms"
                    sx={{ fontSize: '0.85rem' }}
                  >
                    <MenuItem value="On Delivery">On Delivery</MenuItem>
                    <MenuItem value="7 Days">7 Days</MenuItem>
                    <MenuItem value="14 Days">14 Days</MenuItem>
                    <MenuItem value="21 Days">21 Days</MenuItem>
                    <MenuItem value="30 Days">30 Days</MenuItem>
                    <MenuItem value="45 Days">45 Days</MenuItem>
                    <MenuItem value="60 Days">60 Days</MenuItem>
                    <MenuItem value="End of Month">End of Month</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Credit Limit"
                  name="creditLimit"
                  type="number"
                  value={formData.creditLimit}
                  onChange={handleChange}
                  size="medium"
                  error={!!formErrors.creditLimit}
                  helperText={formErrors.creditLimit}
                  placeholder="0.00"
                  sx={{
                    '& .MuiInputLabel-root': { fontSize: '0.8rem' },
                    '& .MuiInputBase-root': { fontSize: '0.85rem' },
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <AttachMoney sx={{ fontSize: '1rem', color: '#6B7280' }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <FormControl fullWidth size="medium">
                  <InputLabel sx={{ fontSize: '0.8rem' }}>Currency</InputLabel>
                  <Select
                    name="currency"
                    value={formData.currency}
                    onChange={handleChange}
                    label="Currency"
                    sx={{ fontSize: '0.85rem' }}
                  >
                    <MenuItem value="ZAR">ZAR - South African Rand</MenuItem>
                    <MenuItem value="USD">USD - US Dollar</MenuItem>
                    <MenuItem value="EUR">EUR - Euro</MenuItem>
                    <MenuItem value="GBP">GBP - British Pound</MenuItem>
                    <MenuItem value="BWP">BWP - Botswana Pula</MenuItem>
                    <MenuItem value="NAD">NAD - Namibian Dollar</MenuItem>
                    <MenuItem value="SZL">SZL - Swazi Lilangeni</MenuItem>
                    <MenuItem value="MZN">MZN - Mozambican Metical</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Status Section */}
              <Grid item xs={12}>
                <FormSectionHeader
                  icon={<InfoIcon sx={{ fontSize: '1.1rem' }} />}
                  title="Status & Notes"
                  subtitle="Account status and additional information"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth size="medium">
                  <InputLabel sx={{ fontSize: '0.8rem' }}>Status</InputLabel>
                  <Select
                    name="isActive"
                    value={formData.isActive}
                    onChange={handleChange}
                    label="Status"
                    sx={{ fontSize: '0.85rem' }}
                  >
                    <MenuItem value={true} sx={{ fontSize: '0.85rem' }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <CheckCircleIcon sx={{ fontSize: '0.9rem', color: '#22C55E' }} />
                        <span>Active</span>
                      </Stack>
                    </MenuItem>
                    <MenuItem value={false} sx={{ fontSize: '0.85rem' }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <CloseIcon sx={{ fontSize: '0.9rem', color: '#EF4444' }} />
                        <span>Inactive</span>
                      </Stack>
                    </MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Notes"
                  name="notes"
                  multiline
                  rows={3}
                  value={formData.notes}
                  onChange={handleChange}
                  size="medium"
                  placeholder="Additional notes about the customer..."
                  sx={{
                    '& .MuiInputLabel-root': { fontSize: '0.8rem' },
                    '& .MuiInputBase-root': { fontSize: '0.85rem' },
                  }}
                />
              </Grid>

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
                      ? 'Updating customer information will affect all associated records.'
                      : 'New customer will be added to the system and available for transactions.'}
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
                      {submitting ? 'Saving...' : (isEditMode ? 'Update Customer' : 'Create Customer')}
                    </Button>
                    <Button
                      variant="outlined"
                      size="large"
                      onClick={() => navigate('/customers')}
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
                    {isEditMode && (
                      <Button
                        variant="text"
                        color="error"
                        size="large"
                        onClick={handleDelete}
                        disabled={submitting}
                        sx={{
                          fontSize: '0.85rem',
                          py: 1,
                          borderRadius: '10px',
                          textTransform: 'none',
                          '&:hover': {
                            bgcolor: '#FEE2E2',
                          },
                        }}
                      >
                        Delete Customer
                      </Button>
                    )}
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

export default CustomerForm;
