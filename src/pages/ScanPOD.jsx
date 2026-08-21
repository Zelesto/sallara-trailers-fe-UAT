// src/pages/ScanPOD.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Stack,
  Divider,
  Autocomplete,
  Card,
  Chip,
  CardContent,
  IconButton,
  Tooltip,
  LinearProgress,
} from '@mui/material';
import {
  ArrowBack,
  CloudUpload,
  CameraAlt,
  Receipt as ReceiptIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon,
  QrCodeScanner as ScanIcon,
} from '@mui/icons-material';
import { podService } from '../services/podService';
import { tripService } from '../services/tripService';

// Import enums
import {
  POD_STATUS_OPTIONS,
  POD_STATUSES,
  TRIP_STATUS_OPTIONS,
} from '../constants';

// ✅ FIX: Define STATUS_OPTIONS from enums
const STATUS_OPTIONS = POD_STATUS_OPTIONS;

const ScanPOD = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [trips, setTrips] = useState([]);
  const [loadingTrips, setLoadingTrips] = useState(false);
  const [searchTripTerm, setSearchTripTerm] = useState('');
  const [scanProgress, setScanProgress] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  // ✅ FIX: Add selectedTrip state
  const [selectedTrip, setSelectedTrip] = useState(null);

  const [formData, setFormData] = useState({
    tripId: '',
    driverName: '',
    customerName: '',
    deliveryDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  useEffect(() => {
    loadTrips();
  }, []);

  const loadTrips = async () => {
    setLoadingTrips(true);
    try {
      // ✅ FIX: Use proper status filter
      const response = await tripService.getAllTrips({
        size: 100
      });
      const tripsData = response?.content || response || [];
      
      // ✅ Filter trips that can have PODs (not cancelled, not draft)
      const filteredTrips = tripsData.filter(trip => {
        const status = trip.status?.toUpperCase() || '';
        return !['CANCELLED', 'DRAFT'].includes(status);
      });
      
      setTrips(filteredTrips);
    } catch (err) {
      console.error('Error loading trips:', err);
      setTrips([]);
    } finally {
      setLoadingTrips(false);
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
    setSelectedTrip(value);
    if (value) {
      setFormData(prev => ({
        ...prev,
        tripId: value.id,
        customerName: value.customerName || value.customer?.name || prev.customerName,
        driverName: value.driverName || value.driver?.name || prev.driverName || '',
      }));
      if (formErrors.tripId) {
        setFormErrors(prev => ({ ...prev, tripId: '' }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        tripId: '',
      }));
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFileName(selectedFile.name);
      
      // Auto-fill from filename
      const nameWithoutExt = selectedFile.name.replace(/\.[^/.]+$/, '');
      const parts = nameWithoutExt.split('_');
      if (parts.length >= 2) {
        const possibleTrip = parts.find(p => /^\d+$/.test(p));
        if (possibleTrip) {
          const matchingTrip = trips.find(t =>
            t.tripNumber?.includes(possibleTrip) ||
            t.id?.toString().includes(possibleTrip)
          );
          if (matchingTrip) {
            setSelectedTrip(matchingTrip);
            setFormData(prev => ({
              ...prev,
              tripId: matchingTrip.id,
              customerName: matchingTrip.customerName || matchingTrip.customer?.name || prev.customerName,
              driverName: matchingTrip.driverName || matchingTrip.driver?.name || prev.driverName,
            }));
          }
        }
      }
    }
  };

  const simulateScan = () => {
    setIsScanning(true);
    setScanProgress(0);
    const interval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsScanning(false);
          return 100;
        }
        return prev + 10;
      });
    }, 500);
  };

  const validateForm = () => {
    const errors = {};
    const tripIdValue = formData.tripId ? parseInt(formData.tripId, 10) : null;
    
    if (!tripIdValue || tripIdValue <= 0) {
      errors.tripId = 'Please select a valid Trip';
    }
    if (!formData.driverName?.trim()) {
      errors.driverName = 'Driver Name is required';
    }
    if (!formData.deliveryDate) {
      errors.deliveryDate = 'Delivery Date is required';
    }
    if (!file) {
      errors.file = 'Please upload a scanned document';
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
      setScanProgress(20);

      const formDataPayload = new FormData();
      const tripIdValue = parseInt(formData.tripId, 10);
      
      const podData = {
        tripId: tripIdValue,
        driverName: formData.driverName?.trim() || '',
        customerName: formData.customerName?.trim() || '',
        deliveryDate: formData.deliveryDate || new Date().toISOString().split('T')[0],
        notes: formData.notes?.trim() || 'Scanned from driver',
        status: 'SCANNED',
      };

      Object.keys(podData).forEach(key => {
        formDataPayload.append(key, podData[key]);
      });
      
      if (file) {
        formDataPayload.append('file', file);
      }

      // ✅ FIX: Use the createPod endpoint with file
      const result = await podService.createPod(podData, file);

      setScanProgress(100);
      setSuccess('POD scanned and uploaded successfully!');

      console.log('✅ POD scanned:', result);

      setTimeout(() => {
        navigate('/pods');
      }, 2000);
    } catch (err) {
      console.error('Error scanning POD:', err);
      
      let errorMessage = err.message || 'Failed to scan POD';
      if (err.response?.status === 413) {
        errorMessage = 'File too large. Maximum size is 10MB.';
      } else if (err.response?.status === 415) {
        errorMessage = 'Unsupported file type. Please upload PDF, JPG, PNG, DOC, or DOCX.';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      
      setError(errorMessage);
    } finally {
      setSubmitting(false);
      setIsScanning(false);
    }
  };

  const filteredTrips = trips.filter(trip => {
    const search = searchTripTerm.toLowerCase();
    return (
      (trip.tripNumber || '').toLowerCase().includes(search) ||
      (trip.id || '').toString().includes(search) ||
      (trip.customerName || trip.customer?.name || '').toLowerCase().includes(search) ||
      (trip.driverName || trip.driver?.name || '').toLowerCase().includes(search)
    );
  });

  return (
    <Box sx={{ p: { xs: 1, sm: 1.5, md: 2 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Box>
          <Typography variant="h6" fontWeight="600" sx={{ fontSize: '1rem' }}>
            Scan POD from Driver
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
            Scan and upload Proof of Delivery documents from drivers
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button
            startIcon={<RefreshIcon sx={{ fontSize: '0.9rem' }} />}
            onClick={loadTrips}
            size="small"
            sx={{ fontSize: '0.75rem' }}
          >
            Refresh
          </Button>
          <Button
            startIcon={<ArrowBack sx={{ fontSize: '0.9rem' }} />}
            onClick={() => navigate('/pods')}
            size="small"
            sx={{ fontSize: '0.75rem' }}
          >
            Back
          </Button>
        </Stack>
      </Box>

      <Grid container spacing={2}>
        <Grid item xs={12} md={8}>
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

              {(isScanning || submitting) && (
                <Box sx={{ mb: 2 }}>
                  <LinearProgress
                    variant="determinate"
                    value={scanProgress}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block', fontSize: '0.7rem' }}>
                    Scanning document... {scanProgress}%
                  </Typography>
                </Box>
              )}

              <Grid container spacing={2}>
                {/* Trip Selection */}
                <Grid item xs={12}>
                  <Autocomplete
                    options={filteredTrips}
                    loading={loadingTrips}
                    getOptionLabel={(option) => {
                      if (typeof option === 'string') return option;
                      return `${option.tripNumber || option.id} - ${option.customerName || option.customer?.name || 'N/A'}`;
                    }}
                    value={selectedTrip}
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
                            Driver: {option.driverName || option.driver?.name || 'N/A'} |
                            Status: {option.status || 'N/A'}
                          </Typography>
                        </Box>
                      </li>
                    )}
                    noOptionsText="No trips found."
                    loadingText="Loading trips..."
                    isOptionEqualToValue={(option, value) => option?.id === value?.id}
                    sx={{ width: '100%' }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Driver Name *"
                    name="driverName"
                    value={formData.driverName}
                    onChange={handleChange}
                    required
                    size="small"
                    error={!!formErrors.driverName}
                    helperText={formErrors.driverName}
                    sx={{
                      '& .MuiInputLabel-root': { fontSize: '0.75rem' },
                      '& .MuiInputBase-root': { fontSize: '0.8rem' }
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Customer Name"
                    name="customerName"
                    value={formData.customerName}
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
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<CloudUpload sx={{ fontSize: '0.9rem' }} />}
                    fullWidth
                    sx={{
                      py: 1.5,
                      borderStyle: 'dashed',
                      fontSize: '0.8rem',
                      borderColor: formErrors.file ? 'error.main' : 'inherit',
                      height: '100%',
                      minHeight: 56
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
                      startIcon={submitting ? <CircularProgress size={18} /> : <ScanIcon sx={{ fontSize: '0.9rem' }} />}
                      disabled={submitting || isScanning}
                      sx={{
                        minWidth: { xs: '100%', sm: 180 },
                        fontSize: '0.8rem',
                        py: 0.75
                      }}
                    >
                      {submitting ? 'Scanning...' : 'Scan POD'}
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
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontSize: '0.9rem', fontWeight: 600, mb: 2 }}>
                Scan Instructions
              </Typography>
              <Stack spacing={1.5}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CameraAlt sx={{ fontSize: '1.1rem', color: 'primary.main' }} />
                  <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                    Use camera or upload scanned document
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ReceiptIcon sx={{ fontSize: '1.1rem', color: 'success.main' }} />
                  <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                    Ensure document is clear and readable
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckCircleIcon sx={{ fontSize: '1.1rem', color: 'info.main' }} />
                  <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                    Verify trip and customer information
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CancelIcon sx={{ fontSize: '1.1rem', color: 'warning.main' }} />
                  <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                    Review before final submission
                  </Typography>
                </Box>
              </Stack>

              <Divider sx={{ my: 1.5 }} />

              <Typography variant="subtitle2" sx={{ fontSize: '0.75rem', fontWeight: 600, mb: 1 }}>
                Supported Formats
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Chip label="PDF" size="small" sx={{ fontSize: '0.6rem' }} />
                <Chip label="JPG" size="small" sx={{ fontSize: '0.6rem' }} />
                <Chip label="PNG" size="small" sx={{ fontSize: '0.6rem' }} />
                <Chip label="DOC" size="small" sx={{ fontSize: '0.6rem' }} />
                <Chip label="DOCX" size="small" sx={{ fontSize: '0.6rem' }} />
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ScanPOD;
