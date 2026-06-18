// src/pages/pods/PODForm.jsx
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
} from '@mui/material';
import { ArrowBack, Save, CloudUpload } from '@mui/icons-material';
import podService from '../services/podService';
import Breadcrumbs from '../components/Layout/Breadcrumbs';

const PODForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [file, setFile] = useState(null);

  const [formData, setFormData] = useState({
    tripNumber: '',
    customerName: '',
    deliveryDate: '',
    status: 'PENDING',
    notes: '',
  });

  useEffect(() => {
    if (isEditMode) {
      loadPOD();
    }
  }, [id]);

  const loadPOD = async () => {
    try {
      setLoading(true);
      const pod = await podService.getPODById(id);
      setFormData({
        tripNumber: pod.tripNumber || '',
        customerName: pod.customerName || '',
        deliveryDate: pod.deliveryDate || '',
        status: pod.status || 'PENDING',
        notes: pod.notes || '',
      });
    } catch (err) {
      setError('Failed to load POD data');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const validateForm = () => {
    if (!formData.tripNumber.trim()) {
      setError('Trip Number is required');
      return false;
    }
    if (!formData.customerName.trim()) {
      setError('Customer Name is required');
      return false;
    }
    if (!formData.deliveryDate) {
      setError('Delivery Date is required');
      return false;
    }
    if (!isEditMode && !file) {
      setError('Please upload a document');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const podData = new FormData();
      Object.keys(formData).forEach(key => {
        if (formData[key]) {
          podData.append(key, formData[key]);
        }
      });
      if (file) {
        podData.append('file', file);
      }

      if (isEditMode) {
        await podService.updatePOD(id, formData);
        setSuccess('POD updated successfully!');
      } else {
        await podService.createPOD(podData);
        setSuccess('POD uploaded successfully!');
      }

      setTimeout(() => {
        navigate('/pods');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'upload'} POD`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Breadcrumbs />
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          {isEditMode ? 'Edit POD' : 'Upload New POD'}
        </Typography>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/pods')}>
          Back
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
                label="Trip Number *"
                name="tripNumber"
                value={formData.tripNumber}
                onChange={handleChange}
                required
                size="small"
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
                InputLabelProps={{ shrink: true }}
                required
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  label="Status"
                >
                  <MenuItem value="PENDING">Pending</MenuItem>
                  <MenuItem value="DELIVERED">Delivered</MenuItem>
                  <MenuItem value="VERIFIED">Verified</MenuItem>
                  <MenuItem value="REJECTED">Rejected</MenuItem>
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
                  sx={{ py: 2 }}
                >
                  {file ? file.name : 'Upload Document *'}
                  <input
                    type="file"
                    hidden
                    onChange={handleFileChange}
                    accept=".pdf,.jpg,.jpeg,.png"
                  />
                </Button>
              </Grid>
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
              />
            </Grid>

            <Grid item xs={12}>
              <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={submitting ? <CircularProgress size={20} /> : <Save />}
                  disabled={submitting}
                >
                  {submitting ? 'Saving...' : (isEditMode ? 'Update POD' : 'Upload POD')}
                </Button>
                <Button variant="outlined" onClick={() => navigate('/pods')}>
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
