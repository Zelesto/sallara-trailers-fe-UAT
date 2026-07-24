// src/pages/PODForm.jsx
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
  Divider,
  Autocomplete,
} from '@mui/material';
import { ArrowBack, Save, CloudUpload, Search as SearchIcon } from '@mui/icons-material';
import { podService } from '../services/podService';
import { tripService } from '../services/tripService';
import { customerService } from '../services/customerService'; // <-- ADD THIS IMPORT

const STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'VERIFIED', label: 'Verified' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const PODForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [trips, setTrips] = useState([]);
  const [loadingTrips, setLoadingTrips] = useState(false);
  const [searchTripTerm, setSearchTripTerm] = useState('');
  
  // ADD: Customer cache state
  const [customerCache, setCustomerCache] = useState({});
  const [loadingCustomer, setLoadingCustomer] = useState(false);

  const [formData, setFormData] = useState({
    tripId: '',
    customerName: '',
    deliveryDate: '',
    status: 'PENDING',
    notes: '',
    documentType: '',
    fileSize: '',
  });

  useEffect(() => {
    if (isEditMode) {
      loadPod();
    }
    loadTrips();
  }, [id]);

  const loadTrips = async () => {
    setLoadingTrips(true);
    try {
      const response = await tripService.getAllTrips({ 
        status: 'COMPLETED,FINALIZED',
        size: 100 
      });
      const tripsData = response?.content || response || [];
      
      console.log('📦 Trip data sample:', tripsData[0]);
      setTrips(tripsData);
    } catch (err) {
      console.error('Error loading trips:', err);
      try {
        const fallbackResponse = await tripService.getAllTrips({ size: 100 });
        const fallbackData = fallbackResponse?.content || fallbackResponse || [];
        setTrips(fallbackData);
      } catch (fallbackErr) {
        console.error('Fallback error loading trips:', fallbackErr);
        setTrips([]);
      }
    } finally {
      setLoadingTrips(false);
    }
  };

  const loadPod = async () => {
    try {
      setLoading(true);
      const pod = await podService.getPodById(id);
      setFormData({
        tripId: pod.tripId || '',
        customerName: pod.customerName || '',
        deliveryDate: pod.deliveryDate || '',
        status: pod.status || 'PENDING',
        notes: pod.notes || '',
        documentType: pod.documentType || '',
        fileSize: pod.fileSize || '',
      });
      setFileName(pod.fileName || '');
      setError('');
    } catch (err) {
      setError('Failed to load POD data');
      console.error('Error loading POD:', err);
    } finally {
      setLoading(false);
    }
  };

  // ADD: Function to fetch customer details by ID
  const fetchCustomerDetails = async (customerId) => {
    if (!customerId) return '';
    
    // Check cache first
    if (customerCache[customerId]) {
      console.log('📦 Using cached customer:', customerCache[customerId]);
      return customerCache[customerId];
    }
    
    setLoadingCustomer(true);
    try {
      console.log('🔍 Fetching customer details for ID:', customerId);
      const customer = await customerService.getCustomerById(customerId);
      const customerName = customer.name || customer.customerName || '';
      
      // Cache the result
      setCustomerCache(prev => ({ ...prev, [customerId]: customerName }));
      console.log('✅ Customer fetched:', customerName);
      
      return customerName;
    } catch (err) {
      console.error('❌ Error fetching customer:', err);
      // Try to find in the trips list as fallback
      const tripWithCustomer = trips.find(t => t.customerId === customerId);
      if (tripWithCustomer) {
        const name = tripWithCustomer.customerName || 
                    tripWithCustomer.customer?.name || 
                    tripWithCustomer.customer?.customerName || '';
        if (name) {
          setCustomerCache(prev => ({ ...prev, [customerId]: name }));
          return name;
        }
      }
      return '';
    } finally {
      setLoadingCustomer(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // UPDATED: handleTripSelect with customer fetching
  const handleTripSelect = async (event, value) => {
    if (value) {
      const tripId = value.id;
      const customerId = value.customerId;
      
      console.log('🔄 Selected trip:', value);
      console.log('📝 Customer ID:', customerId);
      
      // Try to get customer name from the trip object first
      let customerName = value.customerName || 
                        value.customer?.name || 
                        value.customer?.customerName || '';
      
      // If no customer name and we have a customer ID, fetch it
      if (!customerName && customerId) {
        console.log('🔍 Fetching customer name for ID:', customerId);
        customerName = await fetchCustomerDetails(customerId);
      }
      
      console.log('📝 Final customer name:', customerName);
      
      setFormData(prev => ({ 
        ...prev, 
        tripId: tripId,
        customerName: customerName || '',
      }));
      
      if (formErrors.tripId) {
        setFormErrors(prev => ({ ...prev, tripId: '' }));
      }
    } else {
      // Clear selection
      setFormData(prev => ({ ...prev, tripId: '', customerName: '' }));
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFileName(selectedFile.name);
      const extension = selectedFile.name.split('.').pop().toUpperCase();
      const typeMap = {
        'PDF': 'PDF',
        'JPG': 'IMAGE',
        'JPEG': 'IMAGE',
        'PNG': 'IMAGE',
        'DOC': 'DOC',
        'DOCX': 'DOCX',
      };
      setFormData(prev => ({ ...prev, documentType: typeMap[extension] || 'DOCUMENT' }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    const tripIdValue = formData.tripId ? parseInt(formData.tripId, 10) : null;
    if (!tripIdValue || tripIdValue <= 0) {
      errors.tripId = 'Please select a valid Trip';
    }
    
    if (!formData.customerName.trim()) {
      errors.customerName = 'Customer Name is required';
    }
    if (!formData.deliveryDate) {
      errors.deliveryDate = 'Delivery Date is required';
    }
    if (!isEditMode && !file) {
      errors.file = 'Please upload a document';
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
      const tripIdValue = formData.tripId ? parseInt(formData.tripId, 10) : null;
      
      if (!tripIdValue) {
        setError('Please select a valid trip.');
        setSubmitting(false);
        return;
      }

      const podData = {
        tripId: tripIdValue,
        customerName: formData.customerName || 'Adhoc Customer',
        deliveryDate: formData.deliveryDate || new Date().toISOString().split('T')[0],
        status: formData.status || 'PENDING',
        notes: formData.notes || '',
      };

      console.log('📤 Submitting POD data with tripId:', podData.tripId);

      let result;
      if (isEditMode) {
        result = await podService.updatePod(id, podData);
        setSuccess('POD updated successfully!');
      } else {
        result = await podService.createPodWithFields(podData, file);
        setSuccess('POD created successfully!');
      }

      console.log('POD saved:', result);

      setTimeout(() => {
        navigate('/pods');
      }, 1500);
    } catch (err) {
      console.error('Error saving POD:', err);
      setError(err.message || `Failed to ${isEditMode ? 'update' : 'create'} POD`);
    } finally {
      setSubmitting(false);
    }
  };

  // Filter trips for autocomplete
  const filteredTrips = trips.filter(trip => {
    const search = searchTripTerm.toLowerCase();
    return (
      (trip.tripNumber || '').toLowerCase().includes(search) ||
      (trip.id || '').toString().includes(search) ||
      (trip.customerName || '').toLowerCase().includes(search) ||
      (trip.customer?.name || '').toLowerCase().includes(search) ||
      (trip.customer?.customerName || '').toLowerCase().includes(search)
    );
  });

  // UPDATED: Get option label with customer name
  const getOptionLabel = (option) => {
    if (typeof option === 'string') return option;
    const customerName = option.customerName || 
                        option.customer?.name || 
                        option.customer?.customerName || '';
    return `${option.tripNumber || option.id} - ${customerName || 'N/A'}`;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress size={40} />
        <Typography sx={{ ml: 2, fontSize: '0.9rem' }}>Loading POD data...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 1, sm: 1.5, md: 2 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Box>
          <Typography variant="h6" fontWeight="600" sx={{ fontSize: '1rem' }}>
            {isEditMode ? 'Edit POD' : 'Upload New POD'}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
            {isEditMode ? 'Update POD information' : 'Add a new proof of delivery document'}
          </Typography>
        </Box>
        <Button 
          startIcon={<ArrowBack sx={{ fontSize: '0.9rem' }} />} 
          onClick={() => navigate('/pods')}
          size="small"
          sx={{ fontSize: '0.75rem' }}
        >
          Back to PODs
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
            {/* Trip Selection */}
            <Grid item xs={12} md={6}>
              <Autocomplete
                options={filteredTrips}
                loading={loadingTrips || loadingCustomer}
                getOptionLabel={getOptionLabel}
                value={trips.find(t => t.id === parseInt(formData.tripId)) || null}
                onChange={handleTripSelect}
                onInputChange={(event, newInputValue) => {
                  setSearchTripTerm(newInputValue);
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select Trip *"
                    size="small"
                    required
                    error={!!formErrors.tripId}
                    helperText={formErrors.tripId || 'Search by Trip Number or Customer Name'}
                    sx={{
                      '& .MuiInputLabel-root': { fontSize: '0.75rem' },
                      '& .MuiInputBase-root': { fontSize: '0.8rem' }
                    }}
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <>
                          <SearchIcon sx={{ ml: 0.5, mr: -0.5, fontSize: '0.9rem', color: 'text.secondary' }} />
                          {params.InputProps.startAdornment}
                        </>
                      ),
                      endAdornment: (
                        <>
                          {loadingCustomer && <CircularProgress size={16} sx={{ mr: 1 }} />}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
                renderOption={(props, option) => {
                  const customerName = option.customerName || 
                                      option.customer?.name || 
                                      option.customer?.customerName || '';
                  return (
                    <li {...props}>
                      <Box>
                        <Typography variant="body2" fontWeight={500} sx={{ fontSize: '0.8rem' }}>
                          {option.tripNumber || `Trip #${option.id}`}
                          {option.customerId && !customerName && (
                            <Chip 
                              label="Loading customer..." 
                              size="small" 
                              sx={{ ml: 1, height: 16, fontSize: '0.5rem' }} 
                            />
                          )}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                          Customer: {customerName || 'Loading...'} | 
                          Status: {option.status || 'N/A'} | 
                          Date: {option.plannedStartDate ? new Date(option.plannedStartDate).toLocaleDateString() : 'N/A'}
                        </Typography>
                      </Box>
                    </li>
                  );
                }}
                noOptionsText="No trips found. Only COMPLETED and FINALIZED trips are available."
                loadingText="Loading trips..."
                isOptionEqualToValue={(option, value) => option.id === value.id}
                sx={{ width: '100%' }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Customer Name *"
                name="customerName"
                value={formData.customerName}
                onChange={handleChange}
                required
                size="small"
                error={!!formErrors.customerName}
                helperText={formErrors.customerName || 'Auto-populated from trip selection'}
                sx={{
                  '& .MuiInputLabel-root': { fontSize: '0.75rem' },
                  '& .MuiInputBase-root': { fontSize: '0.8rem' }
                }}
                InputProps={{
                  endAdornment: loadingCustomer && (
                    <InputAdornment position="end">
                      <CircularProgress size={16} />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Delivery Date *"
                name="deliveryDate"
                type="date"
                value={formData.deliveryDate}
                onChange={handleChange}
                required
                size="small"
                InputLabelProps={{ shrink: true }}
                error={!!formErrors.deliveryDate}
                helperText={formErrors.deliveryDate}
                sx={{
                  '& .MuiInputLabel-root': { fontSize: '0.75rem' },
                  '& .MuiInputBase-root': { fontSize: '0.8rem' }
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ fontSize: '0.75rem' }}>Status</InputLabel>
                <Select
                  name="status"
                  value={formData.status}
                  label="Status"
                  onChange={handleChange}
                  sx={{ fontSize: '0.8rem' }}
                >
                  {STATUS_OPTIONS.map(option => (
                    <MenuItem key={option.value} value={option.value} sx={{ fontSize: '0.8rem' }}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {!isEditMode && (
              <Grid item xs={12}>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<CloudUpload sx={{ fontSize: '0.9rem' }} />}
                  fullWidth
                  sx={{ 
                    py: 1.5, 
                    borderStyle: 'dashed',
                    fontSize: '0.8rem',
                    borderColor: formErrors.file ? 'error.main' : 'inherit'
                  }}
                >
                  {file ? file.name : 'Upload Document *'}
                  <input
                    type="file"
                    hidden
                    onChange={handleFileChange}
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  />
                </Button>
                {formErrors.file && (
                  <Typography color="error" variant="caption" sx={{ fontSize: '0.7rem' }}>
                    {formErrors.file}
                  </Typography>
                )}
                {file && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block', fontSize: '0.65rem' }}>
                    File size: {(file.size / 1024).toFixed(2)} KB
                  </Typography>
                )}
              </Grid>
            )}

            {isEditMode && (
              <>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Document Type"
                    name="documentType"
                    value={formData.documentType}
                    onChange={handleChange}
                    size="small"
                    disabled
                    sx={{
                      '& .MuiInputLabel-root': { fontSize: '0.75rem' },
                      '& .MuiInputBase-root': { fontSize: '0.8rem' }
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="File Size"
                    name="fileSize"
                    value={formData.fileSize}
                    onChange={handleChange}
                    size="small"
                    disabled
                    sx={{
                      '& .MuiInputLabel-root': { fontSize: '0.75rem' },
                      '& .MuiInputBase-root': { fontSize: '0.8rem' }
                    }}
                  />
                </Grid>
              </>
            )}

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                name="notes"
                multiline
                rows={3}
                value={formData.notes}
                onChange={handleChange}
                size="small"
                placeholder="Additional notes about this POD..."
                sx={{
                  '& .MuiInputLabel-root': { fontSize: '0.75rem' },
                  '& .MuiInputBase-root': { fontSize: '0.8rem' }
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 1.5 }} />
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 1 }}>
                <Button
                  type="submit"
                  variant="contained"
                  size="medium"
                  startIcon={submitting ? <CircularProgress size={18} /> : <Save sx={{ fontSize: '0.9rem' }} />}
                  disabled={submitting || loadingCustomer}
                  sx={{ 
                    minWidth: { xs: '100%', sm: 180 },
                    fontSize: '0.8rem',
                    py: 0.75
                  }}
                >
                  {submitting ? 'Saving...' : (isEditMode ? 'Update POD' : 'Upload POD')}
                </Button>
                <Button
                  variant="outlined"
                  size="medium"
                  onClick={() => navigate('/pods')}
                  disabled={submitting}
                  sx={{ 
                    fontSize: '0.8rem',
                    py: 0.75
                  }}
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

export default PODForm;
