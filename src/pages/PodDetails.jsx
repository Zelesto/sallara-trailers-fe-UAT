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
      PENDING: { color: 'warning', icon: <PendingIcon sx={{ fontSize: '0.9rem' }} />, label: 'Pending' },
      DELIVERED: { color: 'success', icon: <CheckCircleIcon sx={{ fontSize: '0.9rem' }} />, label: 'Delivered' },
      VERIFIED: { color: 'info', icon: <CheckCircleIcon sx={{ fontSize: '0.9rem' }} />, label: 'Verified' },
      REJECTED: { color: 'error', icon: <CancelIcon sx={{ fontSize: '0.9rem' }} />, label: 'Rejected' },
      CANCELLED: { color: 'default', icon: <CancelIcon sx={{ fontSize: '0.9rem' }} />, label: 'Cancelled' },
    };
    const info = statusMap[status] || { color: 'default', icon: null, label: status || 'Unknown' };
    return (
      <Chip 
        label={info.label} 
        color={info.color} 
        icon={info.icon}
        sx={{ 
          fontWeight: 600, 
          fontSize: '0.7rem', 
          height: 24,
          '& .MuiChip-label': { px: 1 },
          '& .MuiChip-icon': { fontSize: '0.9rem' }
        }}
      />
    );
  };

  const getDocumentIcon = (type) => {
    const icons = {
      PDF: <PdfIcon sx={{ fontSize: 32 }} />,
      IMAGE: <ImageIcon sx={{ fontSize: 32 }} />,
      JPG: <ImageIcon sx={{ fontSize: 32 }} />,
      PNG: <ImageIcon sx={{ fontSize: 32 }} />,
      DOC: <DescriptionIcon sx={{ fontSize: 32 }} />,
      DOCX: <DescriptionIcon sx={{ fontSize: 32 }} />,
    };
    return icons[type] || <ReceiptIcon sx={{ fontSize: 32 }} />;
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
        <CircularProgress size={40} />
        <Typography sx={{ ml: 2, fontSize: '0.9rem' }}>Loading POD details...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error" sx={{ fontSize: '0.8rem' }}>{error}</Alert>
      </Box>
    );
  }

  if (!pod) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="warning" sx={{ fontSize: '0.8rem' }}>POD not found</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 1, sm: 1.5, md: 2 } }}>
      {/* Header - Compact */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Button 
          startIcon={<ArrowBackIcon sx={{ fontSize: '0.9rem' }} />} 
          onClick={() => navigate('/pods')}
          size="small"
          sx={{ fontSize: '0.75rem' }}
        >
          Back to PODs
        </Button>
        <Stack direction="row" spacing={0.75}>
          <Tooltip title="Print">
            <IconButton size="small" color="primary" onClick={() => window.print()} sx={{ p: 0.5 }}>
              <PrintIcon sx={{ fontSize: '0.9rem' }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Share">
            <IconButton size="small" color="primary" sx={{ p: 0.5 }}>
              <ShareIcon sx={{ fontSize: '0.9rem' }} />
            </IconButton>
          </Tooltip>
          <Button
            variant="outlined"
            startIcon={<EditIcon sx={{ fontSize: '0.9rem' }} />}
            onClick={() => navigate(`/pods/${id}/edit`)}
            size="small"
            sx={{ fontSize: '0.75rem', py: 0.5 }}
          >
            Edit
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon sx={{ fontSize: '0.9rem' }} />}
            onClick={handleDelete}
            size="small"
            sx={{ fontSize: '0.75rem', py: 0.5 }}
          >
            Delete
          </Button>
        </Stack>
      </Box>

      {/* Summary Card - Compact */}
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: 1.5,
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
            
            <Box sx={{ flex: 1, width: '100%' }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'flex-start', sm: 'center' }}>
                <Typography variant="h6" fontWeight="bold" sx={{ fontSize: '1rem' }}>
                  {pod.podNumber}
                </Typography>
                {getStatusChip(pod.status)}
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 0.5 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                  <strong>Trip:</strong> #{pod.tripId || 'N/A'}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                  <strong>Customer:</strong> {pod.customerName || 'N/A'}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                  <strong>Delivery:</strong> {pod.deliveryDate ? new Date(pod.deliveryDate).toLocaleDateString() : 'N/A'}
                </Typography>
              </Stack>
            </Box>

            <Button
              variant="contained"
              startIcon={<DownloadIcon sx={{ fontSize: '0.9rem' }} />}
              onClick={() => window.open(pod.fileUrl, '_blank')}
              size="small"
              sx={{ fontSize: '0.75rem', py: 0.5, flexShrink: 0 }}
            >
              Download
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* Details Section - Compact */}
      <Paper sx={{ p: { xs: 1.5, sm: 2 } }}>
        <Typography variant="subtitle1" sx={{ fontSize: '0.9rem', fontWeight: 600, mb: 2 }}>
          POD Information
        </Typography>
        
        <Grid container spacing={1.5}>
          <Grid item xs={12} md={6}>
            <Stack spacing={1.5}>
              <InfoItem label="POD Number" value={pod.podNumber} />
              <InfoItem label="Trip ID" value={`#${pod.tripId || 'N/A'}`} />
              <InfoItem label="Customer Name" value={pod.customerName || 'N/A'} />
              <InfoItem label="Delivery Date" value={pod.deliveryDate ? new Date(pod.deliveryDate).toLocaleDateString() : 'N/A'} />
            </Stack>
          </Grid>

          <Grid item xs={12} md={6}>
            <Stack spacing={1.5}>
              <InfoItem label="Status" value={getStatusChip(pod.status)} isChip />
              <InfoItem 
                label="Document Type" 
                value={
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    {getDocumentIcon(pod.documentType)}
                    <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                      {pod.documentType || 'N/A'}
                    </Typography>
                  </Stack>
                }
                isCustom
              />
              <InfoItem label="File Size" value={pod.fileSize || 'N/A'} />
              <InfoItem 
                label="Uploaded By" 
                value={
                  <Box>
                    <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                      {pod.uploadedBy || 'N/A'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
                      {pod.uploadedAt ? new Date(pod.uploadedAt).toLocaleString() : 'N/A'}
                    </Typography>
                  </Box>
                }
                isCustom
              />
            </Stack>
          </Grid>

          {pod.notes && (
            <Grid item xs={12}>
              <Divider sx={{ my: 1.5 }} />
              <Typography variant="subtitle2" sx={{ fontSize: '0.8rem', fontWeight: 600, mb: 1 }}>
                Notes
              </Typography>
              <Paper variant="outlined" sx={{ p: 1.5, bgcolor: 'grey.50' }}>
                <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                  {pod.notes}
                </Typography>
              </Paper>
            </Grid>
          )}

          <Grid item xs={12}>
            <Divider sx={{ my: 1.5 }} />
            <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 1.5 }}>
              <HistoryIcon sx={{ fontSize: '0.9rem', color: 'action.active' }} />
              <Typography variant="subtitle2" sx={{ fontSize: '0.8rem', fontWeight: 600 }}>
                Audit Trail
              </Typography>
            </Stack>
            <Paper variant="outlined" sx={{ p: 1.5, bgcolor: 'grey.50' }}>
              <Stack spacing={0.5}>
                <AuditItem label="Created" value={pod.createdAt ? new Date(pod.createdAt).toLocaleString() : 'N/A'} by={pod.createdBy} />
                <AuditItem label="Last Updated" value={pod.updatedAt ? new Date(pod.updatedAt).toLocaleString() : 'N/A'} by={pod.updatedBy} />
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

// Compact Info Item Component
const InfoItem = ({ label, value, isChip = false, isCustom = false }) => (
  <Box sx={{ p: 1.5, bgcolor: 'grey.50', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', display: 'block', mb: 0.5 }}>
      {label}
    </Typography>
    {isChip ? (
      <Box>{value}</Box>
    ) : isCustom ? (
      value
    ) : (
      <Typography variant="body2" fontWeight={500} sx={{ fontSize: '0.8rem' }}>
        {value}
      </Typography>
    )}
  </Box>
);

// Compact Audit Item Component
const AuditItem = ({ label, value, by }) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 0.5 }}>
    <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>
      <strong>{label}:</strong> {value}
    </Typography>
    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
      By: {by || 'N/A'}
    </Typography>
  </Box>
);

export default PODDetails;
