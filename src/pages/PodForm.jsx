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
import Breadcrumbs from '../components/Layout/Breadcrumbs';

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
        status: 'COMPLETED,FINALIZED',  // Default to COMPLETED, allow FINALIZED
        size: 100 
      });
      // Extract trips from response
      const tripsData = response?.content || response || [];
      setTrips(tripsData);
    } catch (err) {
      console.error('Error loading trips:', err);
      // Try fallback - get all trips
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleTripSelect = (event, value) => {
    if (value) {
      setFormData(prev => ({ 
        ...prev, 
        tripId: value.id,
        customerName: value.customerName || prev.customerName,
      }));
      if (formErrors.tripId) {
        setFormErrors(prev => ({ ...prev, tripId: '' }));
      }
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
    if (!formData.tripId) {
      errors.tripId = 'Please select a Trip';
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
      const podData = {
        tripId: parseInt(formData.tripId, 10),
        customerName: formData.customerName,
        deliveryDate: formData.deliveryDate,
        status: formData.status,
        notes: formData.notes,
        documentType: formData.documentType,
        fileSize: formData.fileSize,
      };

      let result;
      if (isEditMode) {
        result = await podService.updatePod(id, podData);
        setSuccess('POD updated successfully!');
      } else {
        result = await podService.createPod(podData);
        setSuccess('POD created successfully!');
      }

      console.log('POD saved:', result);

      setTimeout(() => {
        navigate('/pods');
      }, 1500);
    } catch (err) {
      console.error('Error saving POD:', err);
      
      // Handle specific error messages
      let errorMessage = err.message || `Failed to ${isEditMode ? 'update' : 'create'} POD`;
      if (err.status === 409) {
        errorMessage = 'The selected Trip does not exist or has already been finalized. Please select a valid trip.';
      } else if (err.data?.detail) {
        errorMessage = err.data.detail;
      }
      
      setError(errorMessage);
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
      (trip.customerName || '').toLowerCase().includes(search)
    );
  });

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading POD data...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Breadcrumbs />
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold">
            {isEditMode ? 'Edit POD' : 'Upload New POD'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {isEditMode ? 'Update POD information' : 'Add a new proof of delivery document'}
          </Typography>
        </Box>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/pods')}>
          Back to PODs
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
            {/* Trip Selection - Autocomplete with search */}
            <Grid item xs={12} md={6}>
              <Autocomplete
                options={filteredTrips}
                loading={loadingTrips}
                getOptionLabel={(option) => {
                  if (typeof option === 'string') return option;
                  return `${option.tripNumber || option.id} - ${option.customerName || 'N/A'}`;
                }}
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
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <>
                          <SearchIcon sx={{ ml: 1, mr: -0.5, color: 'text.secondary' }} />
                          {params.InputProps.startAdornment}
                        </>
                      ),
                    }}
                  />
                )}
                renderOption={(props, option) => (
                  <li {...props}>
                    <Box>
                      <Typography variant="body2" fontWeight={500}>
                        {option.tripNumber || `Trip #${option.id}`}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Customer: {option.customerName || 'N/A'} | 
                        Status: {option.status || 'N/A'} | 
                        Date: {option.plannedStartDate ? new Date(option.plannedStartDate).toLocaleDateString() : 'N/A'}
                      </Typography>
                    </Box>
                  </li>
                )}
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
                helperText={formErrors.customerName}
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
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  value={formData.status}
                  label="Status"
                  onChange={handleChange}
                >
                  {STATUS_OPTIONS.map(option => (
                    <MenuItem key={option.value} value={option.value}>
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
                  startIcon={<CloudUpload />}
                  fullWidth
                  sx={{ py: 2, borderStyle: 'dashed' }}
                  error={!!formErrors.file}
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
                  <Typography color="error" variant="caption">
                    {formErrors.file}
                  </Typography>
                )}
                {file && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
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
                rows={4}
                value={formData.notes}
                onChange={handleChange}
                size="small"
                placeholder="Additional notes about this POD..."
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  startIcon={submitting ? <CircularProgress size={20} /> : <Save />}
                  disabled={submitting}
                  sx={{ minWidth: 200 }}
                >
                  {submitting ? 'Saving...' : (isEditMode ? 'Update POD' : 'Upload POD')}
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => navigate('/pods')}
                  disabled={submitting}
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

export default PodForm;
