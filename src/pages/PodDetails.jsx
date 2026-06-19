// src/pages/PODDetails.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Chip,
  Button,
  Divider,
  Stack,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Receipt as ReceiptIcon,
  Download as DownloadIcon,
  PictureAsPdf as PdfIcon,
  Image as ImageIcon,
  Description as DescriptionIcon,
  Print as PrintIcon,
  Share as ShareIcon,
  History as HistoryIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Pending as PendingIcon,
} from '@mui/icons-material';
import { podService } from '../services/podService';
import Breadcrumbs from '../components/Layout/Breadcrumbs';

const PODDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pod, setPod] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadPod();
  }, [id]);

  const loadPod = async () => {
    setLoading(true);
    try {
      const data = await podService.getPodById(id);
      setPod(data);
      setError(null);
    } catch (err) {
      setError('Failed to load POD details');
      console.error('Error loading POD:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this POD?')) return;
    try {
      await podService.deletePod(id);
      navigate('/pods');
    } catch (err) {
      setError('Failed to delete POD');
    }
  };

  const getStatusChip = (status) => {
    const statusMap = {
      PENDING: { color: 'warning', icon: <PendingIcon />, label: 'Pending' },
      DELIVERED: { color: 'success', icon: <CheckCircleIcon />, label: 'Delivered' },
      VERIFIED: { color: 'info', icon: <CheckCircleIcon />, label: 'Verified' },
      REJECTED: { color: 'error', icon: <CancelIcon />, label: 'Rejected' },
      CANCELLED: { color: 'default', icon: <CancelIcon />, label: 'Cancelled' },
    };
    const info = statusMap[status] || { color: 'default', icon: null, label: status || 'Unknown' };
    return (
      <Chip 
        label={info.label} 
        color={info.color} 
        icon={info.icon}
        sx={{ fontWeight: 600, fontSize: '0.875rem', px: 1 }}
      />
    );
  };

  const getDocumentIcon = (type) => {
    const icons = {
      PDF: <PdfIcon sx={{ fontSize: 48 }} />,
      IMAGE: <ImageIcon sx={{ fontSize: 48 }} />,
      JPG: <ImageIcon sx={{ fontSize: 48 }} />,
      PNG: <ImageIcon sx={{ fontSize: 48 }} />,
      DOC: <DescriptionIcon sx={{ fontSize: 48 }} />,
      DOCX: <DescriptionIcon sx={{ fontSize: 48 }} />,
    };
    return icons[type] || <ReceiptIcon sx={{ fontSize: 48 }} />;
  };

  const getDocumentColor = (type) => {
    const colors = {
      PDF: '#dc3545',
      IMAGE: '#28a745',
      JPG: '#28a745',
      PNG: '#28a745',
      DOC: '#007bff',
      DOCX: '#007bff',
    };
    return colors[type] || '#6c757d';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading POD details...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Breadcrumbs />
        <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
      </Box>
    );
  }

  if (!pod) {
    return (
      <Box>
        <Breadcrumbs />
        <Alert severity="warning" sx={{ mt: 2 }}>POD not found</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Breadcrumbs />
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/pods')}>
          Back to PODs
        </Button>
        <Stack direction="row" spacing={1}>
          <Tooltip title="Print">
            <IconButton color="primary" onClick={() => window.print()}>
              <PrintIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Share">
            <IconButton color="primary">
              <ShareIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={() => navigate(`/pods/${id}/edit`)}
          >
            Edit
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={handleDelete}
          >
            Delete
          </Button>
        </Stack>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="center">
            <Box
              sx={{
                width: 100,
                height: 100,
                borderRadius: 2,
                bgcolor: getDocumentColor(pod.documentType),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                flexShrink: 0,
              }}
            >
              {getDocumentIcon(pod.documentType)}
            </Box>
            
            <Box sx={{ flex: 1 }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', sm: 'center' }}>
                <Typography variant="h4" fontWeight="bold">
                  {pod.podNumber}
                </Typography>
                {getStatusChip(pod.status)}
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} sx={{ mt: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Trip ID:</strong> #{pod.tripId || 'N/A'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Customer:</strong> {pod.customerName || 'N/A'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Delivery Date:</strong> {pod.deliveryDate ? new Date(pod.deliveryDate).toLocaleDateString() : 'N/A'}
                </Typography>
              </Stack>
            </Box>

            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={() => window.open(pod.fileUrl, '_blank')}
            >
              Download
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
          POD Information
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Stack spacing={2}>
              <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                  POD Number
                </Typography>
                <Typography variant="body1" fontWeight={500}>
                  {pod.podNumber}
                </Typography>
              </Box>
              <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                  Trip ID
                </Typography>
                <Typography variant="body1">
                  #{pod.tripId || 'N/A'}
                </Typography>
              </Box>
              <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                  Customer Name
                </Typography>
                <Typography variant="body1">
                  {pod.customerName || 'N/A'}
                </Typography>
              </Box>
              <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                  Delivery Date
                </Typography>
                <Typography variant="body1">
                  {pod.deliveryDate ? new Date(pod.deliveryDate).toLocaleDateString() : 'N/A'}
                </Typography>
              </Box>
            </Stack>
          </Grid>

          <Grid item xs={12} md={6}>
            <Stack spacing={2}>
              <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                  Status
                </Typography>
                <Box>{getStatusChip(pod.status)}</Box>
              </Box>
              <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                  Document Type
                </Typography>
                <Stack direction="row" alignItems="center" spacing={1}>
                  {getDocumentIcon(pod.documentType)}
                  <Typography variant="body1">
                    {pod.documentType || 'N/A'}
                  </Typography>
                </Stack>
              </Box>
              <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                  File Size
                </Typography>
                <Typography variant="body1">
                  {pod.fileSize || 'N/A'}
                </Typography>
              </Box>
              <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                  Uploaded By
                </Typography>
                <Typography variant="body1">
                  {pod.uploadedBy || 'N/A'}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  {pod.uploadedAt ? new Date(pod.uploadedAt).toLocaleString() : 'N/A'}
                </Typography>
              </Box>
            </Stack>
          </Grid>

          {pod.notes && (
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Notes
              </Typography>
              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                <Typography variant="body1">
                  {pod.notes}
                </Typography>
              </Paper>
            </Grid>
          )}

          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
              <HistoryIcon color="action" />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Audit Trail
              </Typography>
            </Stack>
            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
              <Stack spacing={1}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">
                    <strong>Created:</strong> {pod.createdAt ? new Date(pod.createdAt).toLocaleString() : 'N/A'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>By:</strong> {pod.createdBy || 'N/A'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">
                    <strong>Last Updated:</strong> {pod.updatedAt ? new Date(pod.updatedAt).toLocaleString() : 'N/A'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>By:</strong> {pod.updatedBy || 'N/A'}
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default PodDetails;
