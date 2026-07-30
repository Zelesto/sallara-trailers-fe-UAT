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
  Chip,
} from '@mui/material';
import { ArrowBack, Save, CloudUpload, Search as SearchIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { podService } from '../services/podService';
import { tripService } from '../services/tripService';

const STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Pending', color: 'warning' },
  { value: 'DELIVERED', label: 'Delivered', color: 'success' },
  { value: 'VERIFIED', label: 'Verified', color: 'info' },
  { value: 'REJECTED', label: 'Rejected', color: 'error' },
  { value: 'CANCELLED', label: 'Cancelled', color: 'default' },
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
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [existingFileUrl, setExistingFileUrl] = useState('');

  const [formData, setFormData] = useState({
    tripId: '',
    customerName: '',
    deliveryDate: '',
    status: 'PENDING',
    notes: '',
    documentType: '',
    fileSize: '',
    receivedBy: '',
    deliveryCondition: '',
    qualityRating: 0,
    issuesFound: '',
    additionalInfo: '',
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
        page: 0,
        size: 100,
        sortBy: 'id',
        sortOrder: 'DESC'
      });
      
      let tripsData = response?.content || response || [];
      
      // For PODs, show trips that are completed or in progress
      const filteredTrips = tripsData.filter(trip => {
        const status = trip.status?.toUpperCase() || '';
        return ['COMPLETED', 'FINALIZED', 'IN_PROGRESS', 'DELIVERED', 'ACTIVE'].includes(status);
      });
      
      setTrips(filteredTrips);
      
      // If in edit mode, set the selected trip
      if (isEditMode && formData.tripId) {
        const foundTrip = filteredTrips.find(t => t.id === parseInt(formData.tripId));
        if (foundTrip) {
          setSelectedTrip(foundTrip);
        }
      }
    } catch (err) {
      console.error('Error loading trips:', err);
      try {
        const fallbackResponse = await tripService.getAllTrips();
        const fallbackData = fallbackResponse?.content || fallbackResponse || [];
        const filtered = fallbackData.filter(trip => {
          const status = trip.status?.toUpperCase() || '';
          return ['COMPLETED', 'FINALIZED', 'IN_PROGRESS', 'DELIVERED', 'ACTIVE'].includes(status);
        });
        setTrips(filtered);
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
      console.log('📦 Loaded POD:', pod);
      
      setFormData({
        tripId: pod.tripId || '',
        customerName: pod.customerName || '',
        deliveryDate: pod.deliveryDate || '',
        status: pod.status || 'PENDING',
        notes: pod.notes || '',
        documentType: pod.documentType || '',
        fileSize: pod.fileSize || '',
        receivedBy: pod.receivedBy || '',
        deliveryCondition: pod.deliveryCondition || '',
        qualityRating: pod.qualityRating || 0,
        issuesFound: pod.issuesFound || '',
        additionalInfo: pod.additionalInfo || '',
      });
      
      setFileName(pod.fileName || '');
      setExistingFileUrl(pod.fileUrl || '');
      
      // Set selected trip
      if (pod.tripId) {
        const foundTrip = trips.find(t => t.id === parseInt(pod.tripId));
        if (foundTrip) {
          setSelectedTrip(foundTrip);
        }
      }
      
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
      setSelectedTrip(value);
      setFormData(prev => ({ 
        ...prev, 
        tripId: value.id,
        customerName: value.customerName || prev.customerName,
      }));
      
      if (formErrors.tripId) {
        setFormErrors(prev => ({ ...prev, tripId: '' }));
      }
    } else {
      setSelectedTrip(null);
      setFormData(prev => ({ ...prev, tripId: '' }));
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

  const handleRemoveFile = () => {
    setFile(null);
    setFileName('');
    setExistingFileUrl('');
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
    if (!isEditMode && !file && !existingFileUrl) {
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

      // Prepare base data
      const podData = {
        tripId: tripIdValue,
        customerName: formData.customerName || 'Adhoc Customer',
        deliveryDate: formData.deliveryDate || new Date().toISOString().split('T')[0],
        status: formData.status || 'PENDING',
        notes: formData.notes || '',
        receivedBy: formData.receivedBy || '',
        deliveryCondition: formData.deliveryCondition || '',
        qualityRating: formData.qualityRating || 0,
        issuesFound: formData.issuesFound || '',
        additionalInfo: formData.additionalInfo || '',
      };

      console.log('📤 Submitting POD data:', podData);

      let result;
      if (isEditMode) {
        // UPDATE: Use the correct method name
        if (file) {
          // If there's a new file, use FormData
          const formDataPayload = new FormData();
          Object.keys(podData).forEach(key => {
            formDataPayload.append(key, podData[key]);
          });
          formDataPayload.append('file', file);
          
          result = await podService.updatePodWithFile(id, formDataPayload);
        } else {
          // No new file, just update the data
          result = await podService.updatePod(id, podData);
        }
        setSuccess('POD updated successfully!');
      } else {
        // CREATE: Use FormData for file upload
        const formDataPayload = new FormData();
        Object.keys(podData).forEach(key => {
          formDataPayload.append(key, podData[key]);
        });
        if (file) {
          formDataPayload.append('file', file);
        }
        
        result = await podService.createPod(formDataPayload);
        setSuccess('POD created successfully!');
      }

      console.log('✅ POD saved:', result);

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
      (trip.customer?.name || '').toLowerCase().includes(search)
    );
  });

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
      {/* Header */}
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
                loading={loadingTrips}
                value={selectedTrip}
                getOptionLabel={(option) => {
                  if (typeof option === 'string') return option;
                  return `${option.tripNumber || option.id} - ${option.customerName || option.customer?.name || 'N/A'}`;
                }}
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
                    }}
                  />
                )}
                renderOption={(props, option) => (
                  <li {...props}>
                    <Box>
                      <Typography variant="body2" fontWeight={500} sx={{ fontSize: '0.8rem' }}>
                        {option.tripNumber || `Trip #${option.id}`}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                        Customer: {option.customerName || option.customer?.name || 'N/A'} | 
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
                sx={{
                  '& .MuiInputLabel-root': { fontSize: '0.75rem' },
                  '& .MuiInputBase-root': { fontSize: '0.8rem' }
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
                      <Chip
                        label={option.label}
                        color={option.color}
                        size="small"
                        sx={{ height: 18, fontSize: '0.55rem' }}
                      />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* File Upload */}
            <Grid item xs={12}>
              {isEditMode && existingFileUrl && (
                <Box sx={{ mb: 1 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                    Current file: 
                  </Typography>
                  <Chip
                    label={fileName || 'Uploaded file'}
                    size="small"
                    onDelete={handleRemoveFile}
                    sx={{ ml: 1, fontSize: '0.6rem' }}
                  />
                  <Button
                    size="small"
                    color="error"
                    onClick={handleRemoveFile}
                    sx={{ fontSize: '0.65rem', ml: 1 }}
                  >
                    Remove
                  </Button>
                </Box>
              )}
              
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
                {file ? file.name : (isEditMode ? 'Replace Document' : 'Upload Document *')}
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

            {/* Edit Mode Additional Fields */}
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
                    sx={{
                      '& .MuiInputLabel-root': { fontSize: '0.75rem' },
                      '& .MuiInputBase-root': { fontSize: '0.8rem' }
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Received By"
                    name="receivedBy"
                    value={formData.receivedBy}
                    onChange={handleChange}
                    size="small"
                    placeholder="Person who received the delivery"
                    sx={{
                      '& .MuiInputLabel-root': { fontSize: '0.75rem' },
                      '& .MuiInputBase-root': { fontSize: '0.8rem' }
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel sx={{ fontSize: '0.75rem' }}>Delivery Condition</InputLabel>
                    <Select
                      name="deliveryCondition"
                      value={formData.deliveryCondition}
                      label="Delivery Condition"
                      onChange={handleChange}
                      sx={{ fontSize: '0.8rem' }}
                    >
                      <MenuItem value="" sx={{ fontSize: '0.8rem' }}>Select Condition</MenuItem>
                      <MenuItem value="GOOD" sx={{ fontSize: '0.8rem' }}>Good</MenuItem>
                      <MenuItem value="DAMAGED" sx={{ fontSize: '0.8rem' }}>Damaged</MenuItem>
                      <MenuItem value="PARTIAL" sx={{ fontSize: '0.8rem' }}>Partial</MenuItem>
                      <MenuItem value="REJECTED" sx={{ fontSize: '0.8rem' }}>Rejected</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel sx={{ fontSize: '0.75rem' }}>Quality Rating</InputLabel>
                    <Select
                      name="qualityRating"
                      value={formData.qualityRating}
                      label="Quality Rating"
                      onChange={handleChange}
                      sx={{ fontSize: '0.8rem' }}
                    >
                      <MenuItem value={0} sx={{ fontSize: '0.8rem' }}>Not Rated</MenuItem>
                      <MenuItem value={1} sx={{ fontSize: '0.8rem' }}>⭐ Poor</MenuItem>
                      <MenuItem value={2} sx={{ fontSize: '0.8rem' }}>⭐⭐ Fair</MenuItem>
                      <MenuItem value={3} sx={{ fontSize: '0.8rem' }}>⭐⭐⭐ Good</MenuItem>
                      <MenuItem value={4} sx={{ fontSize: '0.8rem' }}>⭐⭐⭐⭐ Very Good</MenuItem>
                      <MenuItem value={5} sx={{ fontSize: '0.8rem' }}>⭐⭐⭐⭐⭐ Excellent</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Issues Found"
                    name="issuesFound"
                    value={formData.issuesFound}
                    onChange={handleChange}
                    size="small"
                    multiline
                    rows={2}
                    placeholder="Any issues found during delivery"
                    sx={{
                      '& .MuiInputLabel-root': { fontSize: '0.75rem' },
                      '& .MuiInputBase-root': { fontSize: '0.8rem' }
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Additional Information"
                    name="additionalInfo"
                    value={formData.additionalInfo}
                    onChange={handleChange}
                    size="small"
                    multiline
                    rows={2}
                    placeholder="Any additional information"
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
                  disabled={submitting}
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
