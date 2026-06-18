// src/pages/pods/PODDetails.jsx
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
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Receipt as ReceiptIcon,
  Download as DownloadIcon,
  PictureAsPdf as PdfIcon,
  Image as ImageIcon,
} from '@mui/icons-material';
import podService from '../services/podService';
import Breadcrumbs from '../../components/Layout/Breadcrumbs';

const PODDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pod, setPod] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadPOD();
  }, [id]);

  const loadPOD = async () => {
    setLoading(true);
    try {
      const data = await podService.getPODById(id);
      setPod(data);
      setError(null);
    } catch (err) {
      setError('Failed to load POD details');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this POD?')) return;
    try {
      await podService.deletePOD(id);
      navigate('/pods');
    } catch (err) {
      setError('Failed to delete POD');
    }
  };

  const getStatusChip = (status) => {
    const statusMap = {
      PENDING: { color: 'warning', label: 'Pending' },
      DELIVERED: { color: 'success', label: 'Delivered' },
      VERIFIED: { color: 'info', label: 'Verified' },
      REJECTED: { color: 'error', label: 'Rejected' },
    };
    const info = statusMap[status] || { color: 'default', label: status || 'Unknown' };
    return <Chip label={info.label} color={info.color} sx={{ fontWeight: 600 }} />;
  };

  const getDocumentIcon = (type) => {
    const icons = {
      PDF: <PdfIcon sx={{ fontSize: 48 }} />,
      Image: <ImageIcon sx={{ fontSize: 48 }} />,
    };
    return icons[type] || <ReceiptIcon sx={{ fontSize: 48 }} />;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
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
          <Stack direction="row" spacing={3} alignItems="center">
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: 2,
                bgcolor: 'primary.light',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {getDocumentIcon(pod.documentType)}
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h4" fontWeight="bold">
                {pod.podNumber}
              </Typography>
              <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Trip: {pod.tripNumber}
                </Typography>
                {getStatusChip(pod.status)}
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
        <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
          POD Information
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Stack spacing={2}>
              <Box>
                <Typography variant="caption" color="text.secondary">POD Number</Typography>
                <Typography variant="body1" fontWeight={500}>{pod.podNumber}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Trip Number</Typography>
                <Typography variant="body1">{pod.tripNumber}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Customer</Typography>
                <Typography variant="body1">{pod.customerName}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Delivery Date</Typography>
                <Typography variant="body1">
                  {new Date(pod.deliveryDate).toLocaleDateString()}
                </Typography>
              </Box>
            </Stack>
          </Grid>

          <Grid item xs={12} md={6}>
            <Stack spacing={2}>
              <Box>
                <Typography variant="caption" color="text.secondary">Status</Typography>
                <Box>{getStatusChip(pod.status)}</Box>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Document Type</Typography>
                <Typography variant="body1">{pod.documentType || 'N/A'}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">File Size</Typography>
                <Typography variant="body1">{pod.fileSize || 'N/A'}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Uploaded By</Typography>
                <Typography variant="body1">{pod.uploadedBy}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {new Date(pod.uploadedAt).toLocaleString()}
                </Typography>
              </Box>
            </Stack>
          </Grid>

          {pod.notes && (
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="caption" color="text.secondary">Notes</Typography>
              <Typography variant="body1">{pod.notes}</Typography>
            </Grid>
          )}
        </Grid>
      </Paper>
    </Box>
  );
};

export default PODDetails;
