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
} from '@mui/material';
import { ArrowBack, Save, CloudUpload } from '@mui/icons-material';
import { podService } from '../services/podService';
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
  }, [id]);

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

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFileName(selectedFile.name);
      // Auto-detect document type from file extension
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
      errors.tripId = 'Trip ID is required';
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
        // For create, you might want to handle file upload separately
        // If your backend supports file upload with POD creation:
        // const formDataWithFile = new FormData();
        // Object.keys(podData).forEach(key => formDataWithFile.append(key, podData[key]));
        // if (file) formDataWithFile.append('file', file);
        // result = await podService.createPod(formDataWithFile);
        
        // For now, just send the data
        result = await podService.createPod(podData);
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
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Trip ID *"
                name="tripId"
                type="number"
                value={formData.tripId}
                onChange={handleChange}
                required
                size="small"
                error={!!formErrors.tripId}
                helperText={formErrors.tripId}
                placeholder="Enter Trip ID"
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
            )}

            {isEditMode && (
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
