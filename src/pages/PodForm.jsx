// src/pages/PODForm.jsx - Responsive version with Dashboard styling
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
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { 
  ArrowBack, 
  Save, 
  CloudUpload, 
  Search as SearchIcon, 
  Delete as DeleteIcon,
  Description as DescriptionIcon,
  Business as BusinessIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  Note as NoteIcon,
  AttachFile as AttachFileIcon,
} from '@mui/icons-material';
import { podService } from '../services/podService';
import { tripService } from '../services/tripService';
import { ResponsiveContainer } from '../components/ResponsiveContainer';

const STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Pending', color: 'warning' },
  { value: 'DELIVERED', label: 'Delivered', color: 'success' },
  { value: 'VERIFIED', label: 'Verified', color: 'info' },
  { value: 'REJECTED', label: 'Rejected', color: 'error' },
  { value: 'CANCELLED', label: 'Cancelled', color: 'default' },
];

const QUALITY_RATINGS = [
  { value: 0, label: 'Not Rated', icon: '☆' },
  { value: 1, label: 'Poor', icon: '⭐' },
  { value: 2, label: 'Fair', icon: '⭐⭐' },
  { value: 3, label: 'Good', icon: '⭐⭐⭐' },
  { value: 4, label: 'Very Good', icon: '⭐⭐⭐⭐' },
  { value: 5, label: 'Excellent', icon: '⭐⭐⭐⭐⭐' },
];

const DELIVERY_CONDITIONS = [
  { value: '', label: 'Select Condition' },
  { value: 'GOOD', label: 'Good' },
  { value: 'DAMAGED', label: 'Damaged' },
  { value: 'PARTIAL', label: 'Partial' },
  { value: 'REJECTED', label: 'Rejected' },
];

const PODForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
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
      
      const filteredTrips = tripsData.filter(trip => {
        const status = trip.status?.toUpperCase() || '';
        return ['COMPLETED', 'FINALIZED', 'IN_PROGRESS', 'DELIVERED', 'ACTIVE'].includes(status);
      });
      
      setTrips(filteredTrips);
      
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
        customerName: value.customerName || value.customer?.name || prev.customerName,
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
        if (file) {
          const formDataPayload = new FormData();
          Object.keys(podData).forEach(key => {
            formDataPayload.append(key, podData[key]);
          });
          formDataPayload.append('file', file);
          
          result = await podService.updatePodWithFile(id, formDataPayload);
        } else {
          result = await podService.updatePod(id, podData);
        }
        setSuccess('POD updated successfully!');
      } else {
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
      <ResponsiveContainer>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress size={40} />
          <Typography sx={{ ml: 2, fontSize: '0.9rem' }}>Loading POD data...</Typography>
        </Box>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer>
      {/* Header */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        mb={{ xs: 2, sm: 2.5, md: 3 }}
        spacing={{ xs: 1, sm: 0 }}
      >
        <Box>
          <Typography 
            variant="h5" 
            fontWeight="700" 
            sx={{ 
              fontSize: { 
                xs: '1.1rem', 
                sm: '1.3rem', 
                md: '1.4rem', 
                lg: '1.5rem' 
              } 
            }}
          >
            {isEditMode ? 'Edit POD' : 'Upload New POD'}
          </Typography>
          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ 
              fontSize: { 
                xs: '0.7rem', 
                sm: '0.8rem', 
                md: '0.85rem' 
              } 
            }}
          >
            {isEditMode ? 'Update proof of delivery information' : 'Add a new proof of delivery document'}
          </Typography>
        </Box>
        <Button 
          startIcon={<ArrowBack sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' } }} />} 
          onClick={() => navigate('/pods')}
          size="small"
          sx={{
            borderRadius: '10px',
            fontSize: { xs: '0.7rem', sm: '0.75rem' },
            textTransform: 'none',
            py: { xs: 0.5, sm: 0.75 },
            px: { xs: 1.5, sm: 2 },
          }}
        >
          Back to PODs
        </Button>
      </Stack>

      {/* Form Card */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 1.5, sm: 2, md: 3 },
          borderRadius: { xs: '12px', sm: '16px' },
          border: '1px solid #ECECEC',
          bgcolor: '#FFFFFF',
          width: '100%',
        }}
      >
        <form onSubmit={handleSubmit}>
          {/* Alerts */}
          {error && (
            <Alert 
              severity="error" 
              sx={{ mb: 2, borderRadius: '12px', fontSize: { xs: '0.7rem', sm: '0.8rem' } }} 
              onClose={() => setError('')}
            >
              {error}
            </Alert>
          )}
          {success && (
            <Alert 
              severity="success" 
              sx={{ mb: 2, borderRadius: '12px', fontSize: { xs: '0.7rem', sm: '0.8rem' } }} 
              onClose={() => setSuccess('')}
            >
              {success}
            </Alert>
          )}

          <Grid container spacing={{ xs: 1.5, sm: 2 }}>
            {/* Trip Selection */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Stack direction="row" spacing={0.75} alignItems="center" mb={1}>
                <SearchIcon sx={{ fontSize: { xs: '0.9rem', sm: '1rem' }, color: '#4F46E5' }} />
                <Typography 
                  variant="subtitle2" 
                  sx={{ 
                    fontWeight: 600, 
                    fontSize: { xs: '0.7rem', sm: '0.8rem' },
                    color: '#111827',
                  }}
                >
                  Select Trip *
                </Typography>
              </Stack>
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
                    label="Search Trip"
                    size="small"
                    required
                    error={!!formErrors.tripId}
                    helperText={formErrors.tripId || 'Search by Trip Number or Customer Name'}
                    sx={{ 
                      '& .MuiInputLabel-root': { fontSize: { xs: '0.65rem', sm: '0.75rem' } },
                      '& .MuiInputBase-root': { fontSize: { xs: '0.7rem', sm: '0.8rem' }, borderRadius: '8px' },
                    }}
                  />
                )}
                renderOption={(props, option) => (
                  <li {...props}>
                    <Box>
                      <Typography variant="body2" fontWeight={500} sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem' } }}>
                        {option.tripNumber || `Trip #${option.id}`}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.55rem', sm: '0.65rem' } }}>
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

            {/* Customer Name */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Stack direction="row" spacing={0.75} alignItems="center" mb={1}>
                <BusinessIcon sx={{ fontSize: { xs: '0.9rem', sm: '1rem' }, color: '#4F46E5' }} />
                <Typography 
                  variant="subtitle2" 
                  sx={{ 
                    fontWeight: 600, 
                    fontSize: { xs: '0.7rem', sm: '0.8rem' },
                    color: '#111827',
                  }}
                >
                  Customer Name *
                </Typography>
              </Stack>
              <TextField
                fullWidth
                name="customerName"
                value={formData.customerName}
                onChange={handleChange}
                size="small"
                placeholder="Enter customer name"
                required
                error={!!formErrors.customerName}
                helperText={formErrors.customerName}
                sx={{ 
                  '& .MuiInputLabel-root': { fontSize: { xs: '0.65rem', sm: '0.75rem' } },
                  '& .MuiInputBase-root': { fontSize: { xs: '0.7rem', sm: '0.8rem' }, borderRadius: '8px' },
                }}
              />
            </Grid>

            {/* Delivery Date */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Stack direction="row" spacing={0.75} alignItems="center" mb={1}>
                <CalendarIcon sx={{ fontSize: { xs: '0.9rem', sm: '1rem' }, color: '#4F46E5' }} />
                <Typography 
                  variant="subtitle2" 
                  sx={{ 
                    fontWeight: 600, 
                    fontSize: { xs: '0.7rem', sm: '0.8rem' },
                    color: '#111827',
                  }}
                >
                  Delivery Date *
                </Typography>
              </Stack>
              <TextField
                fullWidth
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
                  '& .MuiInputLabel-root': { fontSize: { xs: '0.65rem', sm: '0.75rem' } },
                  '& .MuiInputBase-root': { fontSize: { xs: '0.7rem', sm: '0.8rem' }, borderRadius: '8px' },
                }}
              />
            </Grid>

            {/* Status */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Stack direction="row" spacing={0.75} alignItems="center" mb={1}>
                <DescriptionIcon sx={{ fontSize: { xs: '0.9rem', sm: '1rem' }, color: '#4F46E5' }} />
                <Typography 
                  variant="subtitle2" 
                  sx={{ 
                    fontWeight: 600, 
                    fontSize: { xs: '0.7rem', sm: '0.8rem' },
                    color: '#111827',
                  }}
                >
                  Status
                </Typography>
              </Stack>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                  Status
                </InputLabel>
                <Select
                  name="status"
                  value={formData.status}
                  label="Status"
                  onChange={handleChange}
                  sx={{ 
                    fontSize: { xs: '0.7rem', sm: '0.8rem' },
                    borderRadius: '8px',
                  }}
                >
                  {STATUS_OPTIONS.map(option => (
                    <MenuItem key={option.value} value={option.value} sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem' } }}>
                      <Chip
                        label={option.label}
                        color={option.color}
                        size="small"
                        sx={{ height: { xs: 16, sm: 18 }, fontSize: { xs: '0.45rem', sm: '0.55rem' } }}
                      />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* File Upload */}
            <Grid size={{ xs: 12 }}>
              <Stack direction="row" spacing={0.75} alignItems="center" mb={1}>
                <AttachFileIcon sx={{ fontSize: { xs: '0.9rem', sm: '1rem' }, color: '#4F46E5' }} />
                <Typography 
                  variant="subtitle2" 
                  sx={{ 
                    fontWeight: 600, 
                    fontSize: { xs: '0.7rem', sm: '0.8rem' },
                    color: '#111827',
                  }}
                >
                  {isEditMode ? 'Replace Document' : 'Upload Document *'}
                </Typography>
              </Stack>
              
              {isEditMode && existingFileUrl && (
                <Box sx={{ mb: 1 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.55rem', sm: '0.65rem' } }}>
                    Current file: 
                  </Typography>
                  <Chip
                    label={fileName || 'Uploaded file'}
                    size="small"
                    onDelete={handleRemoveFile}
                    sx={{ ml: 1, fontSize: { xs: '0.5rem', sm: '0.6rem' }, height: { xs: 18, sm: 22 } }}
                  />
                  <Button
                    size="small"
                    color="error"
                    onClick={handleRemoveFile}
                    sx={{ fontSize: { xs: '0.55rem', sm: '0.65rem' }, ml: 1 }}
                  >
                    Remove
                  </Button>
                </Box>
              )}
              
              <Button
                variant="outlined"
                component="label"
                startIcon={<CloudUpload sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' } }} />}
                fullWidth
                sx={{ 
                  py: { xs: 1, sm: 1.5 },
                  borderStyle: 'dashed',
                  fontSize: { xs: '0.7rem', sm: '0.8rem' },
                  borderRadius: '8px',
                  borderColor: formErrors.file ? 'error.main' : '#ECECEC',
                  '&:hover': {
                    borderColor: '#4F46E5',
                    bgcolor: '#F7F7FC',
                  }
                }}
              >
                {file ? file.name : (isEditMode ? 'Click to replace document' : 'Click to upload document')}
                <input
                  type="file"
                  hidden
                  onChange={handleFileChange}
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                />
              </Button>
              {formErrors.file && (
                <Typography color="error" variant="caption" sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' }, mt: 0.5, display: 'block' }}>
                  {formErrors.file}
                </Typography>
              )}
              {file && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block', fontSize: { xs: '0.55rem', sm: '0.65rem' } }}>
                  File size: {(file.size / 1024).toFixed(2)} KB
                </Typography>
              )}
            </Grid>

            {/* Edit Mode Additional Fields */}
            {isEditMode && (
              <>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Stack direction="row" spacing={0.75} alignItems="center" mb={1}>
                    <DescriptionIcon sx={{ fontSize: { xs: '0.9rem', sm: '1rem' }, color: '#4F46E5' }} />
                    <Typography 
                      variant="subtitle2" 
                      sx={{ 
                        fontWeight: 600, 
                        fontSize: { xs: '0.7rem', sm: '0.8rem' },
                        color: '#111827',
                      }}
                    >
                      Document Type
                    </Typography>
                  </Stack>
                  <TextField
                    fullWidth
                    name="documentType"
                    value={formData.documentType}
                    onChange={handleChange}
                    size="small"
                    placeholder="e.g., PDF, IMAGE, DOC"
                    sx={{ 
                      '& .MuiInputLabel-root': { fontSize: { xs: '0.65rem', sm: '0.75rem' } },
                      '& .MuiInputBase-root': { fontSize: { xs: '0.7rem', sm: '0.8rem' }, borderRadius: '8px' },
                    }}
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Stack direction="row" spacing={0.75} alignItems="center" mb={1}>
                    <PersonIcon sx={{ fontSize: { xs: '0.9rem', sm: '1rem' }, color: '#4F46E5' }} />
                    <Typography 
                      variant="subtitle2" 
                      sx={{ 
                        fontWeight: 600, 
                        fontSize: { xs: '0.7rem', sm: '0.8rem' },
                        color: '#111827',
                      }}
                    >
                      Received By
                    </Typography>
                  </Stack>
                  <TextField
                    fullWidth
                    name="receivedBy"
                    value={formData.receivedBy}
                    onChange={handleChange}
                    size="small"
                    placeholder="Person who received the delivery"
                    sx={{ 
                      '& .MuiInputLabel-root': { fontSize: { xs: '0.65rem', sm: '0.75rem' } },
                      '& .MuiInputBase-root': { fontSize: { xs: '0.7rem', sm: '0.8rem' }, borderRadius: '8px' },
                    }}
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Stack direction="row" spacing={0.75} alignItems="center" mb={1}>
                    <DescriptionIcon sx={{ fontSize: { xs: '0.9rem', sm: '1rem' }, color: '#4F46E5' }} />
                    <Typography 
                      variant="subtitle2" 
                      sx={{ 
                        fontWeight: 600, 
                        fontSize: { xs: '0.7rem', sm: '0.8rem' },
                        color: '#111827',
                      }}
                    >
                      Delivery Condition
                    </Typography>
                  </Stack>
                  <FormControl fullWidth size="small">
                    <InputLabel sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                      Delivery Condition
                    </InputLabel>
                    <Select
                      name="deliveryCondition"
                      value={formData.deliveryCondition}
                      label="Delivery Condition"
                      onChange={handleChange}
                      sx={{ 
                        fontSize: { xs: '0.7rem', sm: '0.8rem' },
                        borderRadius: '8px',
                      }}
                    >
                      {DELIVERY_CONDITIONS.map(option => (
                        <MenuItem key={option.value} value={option.value} sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem' } }}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Stack direction="row" spacing={0.75} alignItems="center" mb={1}>
                    <StarIcon sx={{ fontSize: { xs: '0.9rem', sm: '1rem' }, color: '#4F46E5' }} />
                    <Typography 
                      variant="subtitle2" 
                      sx={{ 
                        fontWeight: 600, 
                        fontSize: { xs: '0.7rem', sm: '0.8rem' },
                        color: '#111827',
                      }}
                    >
                      Quality Rating
                    </Typography>
                  </Stack>
                  <FormControl fullWidth size="small">
                    <InputLabel sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                      Quality Rating
                    </InputLabel>
                    <Select
                      name="qualityRating"
                      value={formData.qualityRating}
                      label="Quality Rating"
                      onChange={handleChange}
                      sx={{ 
                        fontSize: { xs: '0.7rem', sm: '0.8rem' },
                        borderRadius: '8px',
                      }}
                    >
                      {QUALITY_RATINGS.map(option => (
                        <MenuItem key={option.value} value={option.value} sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem' } }}>
                          {option.icon} {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Stack direction="row" spacing={0.75} alignItems="center" mb={1}>
                    <NoteIcon sx={{ fontSize: { xs: '0.9rem', sm: '1rem' }, color: '#4F46E5' }} />
                    <Typography 
                      variant="subtitle2" 
                      sx={{ 
                        fontWeight: 600, 
                        fontSize: { xs: '0.7rem', sm: '0.8rem' },
                        color: '#111827',
                      }}
                    >
                      Issues Found
                    </Typography>
                  </Stack>
                  <TextField
                    fullWidth
                    name="issuesFound"
                    value={formData.issuesFound}
                    onChange={handleChange}
                    size="small"
                    multiline
                    rows={2}
                    placeholder="Any issues found during delivery"
                    sx={{ 
                      '& .MuiInputLabel-root': { fontSize: { xs: '0.65rem', sm: '0.75rem' } },
                      '& .MuiInputBase-root': { fontSize: { xs: '0.7rem', sm: '0.8rem' }, borderRadius: '8px' },
                    }}
                  />
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Stack direction="row" spacing={0.75} alignItems="center" mb={1}>
                    <NoteIcon sx={{ fontSize: { xs: '0.9rem', sm: '1rem' }, color: '#4F46E5' }} />
                    <Typography 
                      variant="subtitle2" 
                      sx={{ 
                        fontWeight: 600, 
                        fontSize: { xs: '0.7rem', sm: '0.8rem' },
                        color: '#111827',
                      }}
                    >
                      Additional Information
                    </Typography>
                  </Stack>
                  <TextField
                    fullWidth
                    name="additionalInfo"
                    value={formData.additionalInfo}
                    onChange={handleChange}
                    size="small"
                    multiline
                    rows={2}
                    placeholder="Any additional information"
                    sx={{ 
                      '& .MuiInputLabel-root': { fontSize: { xs: '0.65rem', sm: '0.75rem' } },
                      '& .MuiInputBase-root': { fontSize: { xs: '0.7rem', sm: '0.8rem' }, borderRadius: '8px' },
                    }}
                  />
                </Grid>
              </>
            )}

            {/* Notes */}
            <Grid size={{ xs: 12 }}>
              <Stack direction="row" spacing={0.75} alignItems="center" mb={1}>
                <NoteIcon sx={{ fontSize: { xs: '0.9rem', sm: '1rem' }, color: '#4F46E5' }} />
                <Typography 
                  variant="subtitle2" 
                  sx={{ 
                    fontWeight: 600, 
                    fontSize: { xs: '0.7rem', sm: '0.8rem' },
                    color: '#111827',
                  }}
                >
                  Notes
                </Typography>
              </Stack>
              <TextField
                fullWidth
                name="notes"
                multiline
                rows={3}
                value={formData.notes}
                onChange={handleChange}
                size="small"
                placeholder="Additional notes about this POD..."
                sx={{ 
                  '& .MuiInputLabel-root': { fontSize: { xs: '0.65rem', sm: '0.75rem' } },
                  '& .MuiInputBase-root': { fontSize: { xs: '0.7rem', sm: '0.8rem' }, borderRadius: '8px' },
                }}
              />
            </Grid>

            {/* Actions */}
            <Grid size={{ xs: 12 }}>
              <Divider sx={{ my: 1.5 }} />
              <Stack 
                direction={{ xs: 'column', sm: 'row' }} 
                spacing={{ xs: 1, sm: 1.5 }} 
                sx={{ mt: 1 }}
              >
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={submitting ? <CircularProgress size={18} /> : <Save sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' } }} />}
                  disabled={submitting}
                  sx={{ 
                    minWidth: { xs: '100%', sm: 180 },
                    fontSize: { xs: '0.7rem', sm: '0.8rem' },
                    py: { xs: 0.5, sm: 0.75 },
                    borderRadius: '10px',
                    textTransform: 'none',
                    background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #4338CA 0%, #4F46E5 100%)',
                    },
                  }}
                >
                  {submitting ? 'Saving...' : (isEditMode ? 'Update POD' : 'Upload POD')}
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/pods')}
                  disabled={submitting}
                  sx={{ 
                    fontSize: { xs: '0.7rem', sm: '0.8rem' },
                    py: { xs: 0.5, sm: 0.75 },
                    borderRadius: '10px',
                    textTransform: 'none',
                  }}
                >
                  Cancel
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </ResponsiveContainer>
  );
};

export default PODForm;
