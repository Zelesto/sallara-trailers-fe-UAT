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
      const response = await tripService.getAllTrips({ 
        status: 'COMPLETED,FINALIZED,IN_PROGRESS',
        size: 100 
      });
      const tripsData = response?.content || response || [];
      setTrips(tripsData);
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
    if (value) {
      setFormData(prev => ({ 
        ...prev, 
        tripId: value.id,
        customerName: value.customerName || prev.customerName,
        driverName: value.driverName || prev.driverName || '',
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
      // Auto-fill some fields if file name contains info
      const nameWithoutExt = selectedFile.name.replace(/\.[^/.]+$/, '');
      const parts = nameWithoutExt.split('_');
      if (parts.length >= 2) {
        // Try to extract trip number or customer from filename
        const possibleTrip = parts.find(p => /^\d+$/.test(p));
        const possibleCustomer = parts.find(p => p.length > 2 && !/^\d+$/.test(p));
        if (possibleTrip) {
          const matchingTrip = trips.find(t => 
            t.tripNumber?.includes(possibleTrip) || 
            t.id?.toString().includes(possibleTrip)
          );
          if (matchingTrip) {
            setFormData(prev => ({
              ...prev,
              tripId: matchingTrip.id,
              customerName: matchingTrip.customerName || prev.customerName,
              driverName: matchingTrip.driverName || prev.driverName,
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
    if (!formData.tripId) {
      errors.tripId = 'Please select a Trip';
    }
    if (!formData.driverName.trim()) {
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
      // Simulate scanning process
      setScanProgress(20);
      
      const scanData = {
        tripId: parseInt(formData.tripId, 10),
        driverName: formData.driverName,
        customerName: formData.customerName,
        deliveryDate: formData.deliveryDate,
        notes: formData.notes || 'Scanned from driver',
      };

      const result = await podService.scanPOD(scanData, file);
      
      setScanProgress(100);
      setSuccess('POD scanned and uploaded successfully!');
      
      console.log('POD scanned:', result);

      setTimeout(() => {
        navigate('/pods');
      }, 2000);
    } catch (err) {
      console.error('Error scanning POD:', err);
      setError(err.message || 'Failed to scan POD');
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
      (trip.customerName || '').toLowerCase().includes(search) ||
      (trip.driverName || '').toLowerCase().includes(search)
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
                            Customer: {option.customerName || 'N/A'} | 
                            Driver: {option.driverName || 'N/A'} | 
                            Status: {option.status || 'N/A'}
                          </Typography>
                        </Box>
                      </li>
                    )}
                    noOptionsText="No trips found."
                    loadingText="Loading trips..."
                    isOptionEqualToValue={(option, value) => option.id === value.id}
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
