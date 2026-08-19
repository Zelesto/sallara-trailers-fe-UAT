// src/pages/PODDetails.jsx - Responsive version with Dashboard styling
import React, { useState, useEffect, useCallback } from 'react';
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
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Snackbar,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
} from '@mui/lab';
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
  QrCodeScanner as ScanIcon,
  Assignment as AssignmentIcon,
  Verified as VerifiedIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  Comment as CommentIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Warning as WarningIcon,
  Schedule as ScheduleIcon,
  CloudUpload as CloudUploadIcon,
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Business as BusinessIcon,
  AttachFile as AttachFileIcon,
  EventNote as EventNoteIcon,
  Assessment as AssessmentIcon,
  LocalShipping as ShippingIcon,
} from '@mui/icons-material';
import { podService } from '../services/podService';
import DownloadHandler from '../components/DownloadHandler';
import { useDropzone } from 'react-dropzone';
import { ResponsiveContainer } from '../components/ResponsiveContainer';

// InfoItem Component - Enhanced
const InfoItem = ({ label, value, isChip = false, isCustom = false }) => (
  <Box sx={{ 
    p: { xs: 1, sm: 1.5 }, 
    bgcolor: '#F9FAFB', 
    borderRadius: 1.5, 
    border: '1px solid #ECECEC',
    height: '100%',
  }}>
    <Typography variant="caption" color="text.secondary" sx={{ 
      fontSize: { xs: '0.55rem', sm: '0.65rem' }, 
      display: 'block', 
      mb: 0.5,
      textTransform: 'uppercase',
      letterSpacing: '0.3px',
      fontWeight: 500,
    }}>
      {label}
    </Typography>
    {isChip ? (
      <Box>{value}</Box>
    ) : isCustom ? (
      value
    ) : (
      <Typography variant="body2" fontWeight={500} sx={{ 
        fontSize: { xs: '0.7rem', sm: '0.8rem' },
        color: '#111827',
      }}>
        {value || 'N/A'}
      </Typography>
    )}
  </Box>
);

// Status Chip Component
const StatusChip = ({ status }) => {
  const statusMap = {
    SCANNED: { color: 'info', icon: <ScanIcon sx={{ fontSize: '0.9rem' }} />, label: 'Scanned' },
    PENDING: { color: 'warning', icon: <PendingIcon sx={{ fontSize: '0.9rem' }} />, label: 'Pending' },
    DELIVERED: { color: 'success', icon: <CheckCircleIcon sx={{ fontSize: '0.9rem' }} />, label: 'Delivered' },
    VERIFIED: { color: 'info', icon: <VerifiedIcon sx={{ fontSize: '0.9rem' }} />, label: 'Verified' },
    REJECTED: { color: 'error', icon: <CancelIcon sx={{ fontSize: '0.9rem' }} />, label: 'Rejected' },
    CANCELLED: { color: 'default', icon: <CancelIcon sx={{ fontSize: '0.9rem' }} />, label: 'Cancelled' },
    UPLOAD_FAILED: { color: 'error', icon: <WarningIcon sx={{ fontSize: '0.9rem' }} />, label: 'Upload Failed' },
    MISSING_FILE: { color: 'warning', icon: <WarningIcon sx={{ fontSize: '0.9rem' }} />, label: 'Missing File' },
  };
  const info = statusMap[status] || { color: 'default', icon: null, label: status || 'Unknown' };
  return (
    <Chip 
      label={info.label} 
      color={info.color} 
      icon={info.icon}
      sx={{ 
        fontWeight: 600, 
        fontSize: { xs: '0.55rem', sm: '0.7rem' }, 
        height: { xs: 20, sm: 24 },
        '& .MuiChip-label': { px: { xs: 0.75, sm: 1 } },
        '& .MuiChip-icon': { fontSize: { xs: '0.7rem', sm: '0.9rem' } }
      }}
    />
  );
};

// Document Icon Component
const DocumentIcon = ({ type, size = 32 }) => {
  const icons = {
    PDF: <PdfIcon sx={{ fontSize: size }} />,
    IMAGE: <ImageIcon sx={{ fontSize: size }} />,
    JPG: <ImageIcon sx={{ fontSize: size }} />,
    PNG: <ImageIcon sx={{ fontSize: size }} />,
    DOC: <DescriptionIcon sx={{ fontSize: size }} />,
    DOCX: <DescriptionIcon sx={{ fontSize: size }} />,
  };
  return icons[type] || <ReceiptIcon sx={{ fontSize: size }} />;
};

// Document Color Helper
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

// Timeline Icon Helper
const getTimelineIcon = (status) => {
  const icons = {
    SCANNED: <ScanIcon sx={{ fontSize: '0.8rem' }} />,
    PENDING: <PendingIcon sx={{ fontSize: '0.8rem' }} />,
    DELIVERED: <CheckCircleIcon sx={{ fontSize: '0.8rem' }} />,
    VERIFIED: <VerifiedIcon sx={{ fontSize: '0.8rem' }} />,
    REJECTED: <CancelIcon sx={{ fontSize: '0.8rem' }} />,
    CANCELLED: <CancelIcon sx={{ fontSize: '0.8rem' }} />,
  };
  return icons[status] || <HistoryIcon sx={{ fontSize: '0.8rem' }} />;
};

const getTimelineColor = (status) => {
  const colors = {
    SCANNED: 'info',
    PENDING: 'warning',
    DELIVERED: 'success',
    VERIFIED: 'info',
    REJECTED: 'error',
    CANCELLED: 'grey',
  };
  return colors[status] || 'grey';
};

// Stars Renderer
const renderStars = (rating) => {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    stars.push(
      i <= rating ? 
        <StarIcon key={i} sx={{ fontSize: { xs: '0.9rem', sm: '1rem' }, color: '#FFD700' }} /> : 
        <StarBorderIcon key={i} sx={{ fontSize: { xs: '0.9rem', sm: '1rem' }, color: '#FFD700' }} />
    );
  }
  return <Box sx={{ display: 'flex', alignItems: 'center' }}>{stars}</Box>;
};

const PODDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  const [pod, setPod] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusHistory, setStatusHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [tripDetails, setTripDetails] = useState(null);
  const [loadingTrip, setLoadingTrip] = useState(false);

  // Re-upload states
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    loadPod();
    loadStatusHistory();
  }, [id]);

  const loadPod = async () => {
    setLoading(true);
    try {
      const data = await podService.getPodById(id);
      setPod(data);
      
      if (data.tripId) {
        loadTripDetails(data.tripId);
      }
      
      setError(null);
    } catch (err) {
      setError('Failed to load POD details');
      console.error('Error loading POD:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadTripDetails = async (tripId) => {
    setLoadingTrip(true);
    try {
      setTripDetails({ id: tripId, status: 'COMPLETED' });
    } catch (err) {
      console.error('Error loading trip details:', err);
    } finally {
      setLoadingTrip(false);
    }
  };

  const loadStatusHistory = async () => {
    setLoadingHistory(true);
    try {
      const history = await podService.getPodStatusHistory(id);
      setStatusHistory(history || []);
    } catch (err) {
      console.error('Error loading status history:', err);
      setStatusHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxSize: 10485760,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        handleReupload(acceptedFiles[0]);
      }
    },
    onDropRejected: (fileRejections) => {
      const error = fileRejections[0]?.errors[0];
      if (error) {
        if (error.code === 'file-too-large') {
          showSnackbar('File too large. Maximum size is 10MB.', 'error');
        } else if (error.code === 'file-invalid-type') {
          showSnackbar('Invalid file type. Please upload PDF, JPG, PNG, DOC, or DOCX.', 'error');
        } else {
          showSnackbar(error.message, 'error');
        }
      }
    },
    disabled: uploading
  });

  const handleReupload = async (file) => {
    if (!file || uploading) return;
    
    setUploading(true);
    setUploadProgress(0);
    setUploadError(null);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await podService.reuploadPodFile(id, formData, (progressEvent) => {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(progress);
      });
      
      showSnackbar('File uploaded successfully!', 'success');
      setUploadDialogOpen(false);
      await loadPod();
      
    } catch (error) {
      console.error('Upload failed:', error);
      const errorMsg = error.response?.data || 'Failed to upload file. Please try again.';
      setUploadError(errorMsg);
      showSnackbar(errorMsg, 'error');
    } finally {
      setUploading(false);
      setUploadProgress(0);
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

  const handleDebrief = () => {
    navigate(`/pods/${id}/debrief`);
  };

  const handleScanNew = () => {
    navigate('/pods/scan');
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (loading) {
    return (
      <ResponsiveContainer>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress size={40} />
          <Typography sx={{ ml: 2, fontSize: '0.9rem' }}>Loading POD details...</Typography>
        </Box>
      </ResponsiveContainer>
    );
  }

  if (error) {
    return (
      <ResponsiveContainer>
        <Alert severity="error" sx={{ borderRadius: '12px', fontSize: { xs: '0.7rem', sm: '0.8rem' } }}>
          {error}
        </Alert>
      </ResponsiveContainer>
    );
  }

  if (!pod) {
    return (
      <ResponsiveContainer>
        <Alert severity="warning" sx={{ borderRadius: '12px', fontSize: { xs: '0.7rem', sm: '0.8rem' } }}>
          POD not found
        </Alert>
      </ResponsiveContainer>
    );
  }

  const needsDebrief = pod.status === 'PENDING' || pod.status === 'SCANNED';
  const hasFile = pod.fileUrl && pod.fileUrl.length > 0;
  const isMissingFile = pod.status === 'MISSING_FILE' || pod.status === 'UPLOAD_FAILED' || !hasFile;

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
            POD Details
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
            #{pod.podNumber} • {pod.customerName || 'No Customer'}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button 
            startIcon={<ArrowBackIcon sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' } }} />} 
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
            Back
          </Button>
          {needsDebrief && (
            <Button
              variant="contained"
              color="success"
              startIcon={<AssignmentIcon sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' } }} />}
              onClick={handleDebrief}
              size="small"
              sx={{
                borderRadius: '10px',
                fontSize: { xs: '0.7rem', sm: '0.75rem' },
                textTransform: 'none',
                py: { xs: 0.5, sm: 0.75 },
                px: { xs: 1.5, sm: 2 },
              }}
            >
              {isMobile ? 'Debrief' : 'Debrief POD'}
            </Button>
          )}
          <Button
            variant="outlined"
            startIcon={<EditIcon sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' } }} />}
            onClick={() => navigate(`/pods/${id}/edit`)}
            size="small"
            sx={{
              borderRadius: '10px',
              fontSize: { xs: '0.7rem', sm: '0.75rem' },
              textTransform: 'none',
              py: { xs: 0.5, sm: 0.75 },
              px: { xs: 1.5, sm: 2 },
            }}
          >
            {isMobile ? '' : 'Edit'}
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' } }} />}
            onClick={handleDelete}
            size="small"
            sx={{
              borderRadius: '10px',
              fontSize: { xs: '0.7rem', sm: '0.75rem' },
              textTransform: 'none',
              py: { xs: 0.5, sm: 0.75 },
              px: { xs: 1.5, sm: 2 },
            }}
          >
            {isMobile ? '' : 'Delete'}
          </Button>
        </Stack>
      </Stack>

      {/* Missing File Alert */}
      {isMissingFile && (
        <Alert 
          severity="warning" 
          sx={{ 
            mb: 2, 
            borderRadius: '12px', 
            fontSize: { xs: '0.7rem', sm: '0.8rem' } 
          }}
          action={
            <Button 
              color="warning" 
              size="small" 
              onClick={() => setUploadDialogOpen(true)}
              startIcon={<CloudUploadIcon />}
              sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' } }}
            >
              Upload File
            </Button>
          }
        >
          This POD is missing a file. Please upload a document to complete the record.
        </Alert>
      )}

      {/* Summary Card */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 1.5, sm: 2, md: 2.5 },
          mb: 2,
          borderRadius: { xs: '12px', sm: '16px' },
          border: '1px solid #ECECEC',
          bgcolor: '#FFFFFF',
          width: '100%',
        }}
      >
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
          <Box
            sx={{
              width: { xs: 48, sm: 56, md: 64 },
              height: { xs: 48, sm: 56, md: 64 },
              borderRadius: 1.5,
              bgcolor: hasFile ? getDocumentColor(pod.documentType) : '#ff9800',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              flexShrink: 0,
            }}
          >
            {hasFile ? 
              <DocumentIcon type={pod.documentType} size={isMobile ? 24 : 32} /> : 
              <WarningIcon sx={{ fontSize: isMobile ? 24 : 32 }} />
            }
          </Box>
          
          <Box sx={{ flex: 1, width: '100%' }}>
            <Stack 
              direction={{ xs: 'column', sm: 'row' }} 
              spacing={1} 
              alignItems={{ xs: 'flex-start', sm: 'center' }}
            >
              <Typography 
                variant="h6" 
                fontWeight="bold" 
                sx={{ 
                  fontSize: { xs: '0.9rem', sm: '1rem' },
                  color: '#111827',
                }}
              >
                {pod.podNumber}
              </Typography>
              <StatusChip status={pod.status} />
              {pod.source === 'SCANNED' && (
                <Chip
                  size="small"
                  icon={<ScanIcon sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' } }} />}
                  label="📸 Scanned"
                  variant="outlined"
                  sx={{ 
                    fontSize: { xs: '0.45rem', sm: '0.55rem' }, 
                    height: { xs: 16, sm: 18 }, 
                    borderColor: '#1976d2', 
                    color: '#1976d2' 
                  }}
                />
              )}
            </Stack>
            <Stack 
              direction={{ xs: 'column', sm: 'row' }} 
              spacing={{ xs: 1, sm: 2 }} 
              sx={{ mt: 0.5 }}
              flexWrap="wrap"
            >
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.55rem', sm: '0.65rem' } }}>
                <strong>Trip:</strong> #{pod.tripId || 'N/A'}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.55rem', sm: '0.65rem' } }}>
                <strong>Customer:</strong> {pod.customerName || 'N/A'}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.55rem', sm: '0.65rem' } }}>
                <strong>Delivery:</strong> {pod.deliveryDate ? new Date(pod.deliveryDate).toLocaleDateString() : 'N/A'}
              </Typography>
              {pod.debriefedAt && (
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.55rem', sm: '0.65rem' } }}>
                  <strong>Debriefed:</strong> {new Date(pod.debriefedAt).toLocaleDateString()}
                </Typography>
              )}
            </Stack>
          </Box>

          <Stack 
            direction={{ xs: 'column', sm: 'row' }} 
            spacing={1} 
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          >
            {hasFile && (
              <DownloadHandler
                url={podService.getPodDocumentUrl(id, true)}
                filename={`${pod.podNumber || 'pod'}.${pod.documentType?.toLowerCase() || 'pdf'}`}
                buttonText="Download"
                variant="contained"
                size="small"
                color="primary"
                startIcon={<DownloadIcon sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' } }} />}
                sx={{ 
                  fontSize: { xs: '0.7rem', sm: '0.75rem' }, 
                  py: { xs: 0.5, sm: 0.75 },
                  px: { xs: 1.5, sm: 2 },
                  borderRadius: '10px',
                  textTransform: 'none',
                  flexShrink: 0,
                  width: { xs: '100%', sm: 'auto' },
                }}
                onError={(err) => {
                  console.error('Download failed:', err);
                  if (err.response?.status === 404) {
                    showSnackbar('File not found. Please re-upload the document.', 'warning');
                    setUploadDialogOpen(true);
                  }
                }}
                onSuccess={() => {
                  console.log('Download successful');
                }}
                showSuccessSnackbar={true}
              />
            )}
            <Button
              variant={hasFile ? "outlined" : "contained"}
              color={hasFile ? "primary" : "warning"}
              startIcon={<CloudUploadIcon sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' } }} />}
              onClick={() => setUploadDialogOpen(true)}
              size="small"
              sx={{ 
                fontSize: { xs: '0.7rem', sm: '0.75rem' }, 
                py: { xs: 0.5, sm: 0.75 },
                px: { xs: 1.5, sm: 2 },
                borderRadius: '10px',
                textTransform: 'none',
                flexShrink: 0,
                width: { xs: '100%', sm: 'auto' },
              }}
            >
              {hasFile ? (isMobile ? 'Replace' : 'Re-upload') : (isMobile ? 'Upload' : 'Upload File')}
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {/* Main Content Grid */}
      <Grid container spacing={{ xs: 1.5, sm: 2 }}>
        {/* Left Column - Main Details */}
        <Grid size={{ xs: 12, md: 8 }}>
          {/* POD Information */}
          <Paper
            elevation={0}
            sx={{
              p: { xs: 1.5, sm: 2, md: 2.5 },
              mb: 2,
              borderRadius: { xs: '12px', sm: '16px' },
              border: '1px solid #ECECEC',
              bgcolor: '#FFFFFF',
              width: '100%',
            }}
          >
            <Typography 
              variant="subtitle1" 
              sx={{ 
                fontSize: { xs: '0.85rem', sm: '0.9rem' }, 
                fontWeight: 600, 
                mb: 2,
                color: '#111827',
              }}
            >
              <ReceiptIcon sx={{ fontSize: '0.9rem', verticalAlign: 'middle', mr: 1 }} />
              POD Information
            </Typography>
            
            <Grid container spacing={{ xs: 1, sm: 1.5 }}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <InfoItem label="POD Number" value={pod.podNumber} />
                <InfoItem label="Trip ID" value={`#${pod.tripId || 'N/A'}`} />
                <InfoItem label="Customer Name" value={pod.customerName || 'N/A'} />
                <InfoItem label="Delivery Date" value={pod.deliveryDate ? new Date(pod.deliveryDate).toLocaleDateString() : 'N/A'} />
                {pod.driverName && (
                  <InfoItem label="Driver Name" value={pod.driverName} />
                )}
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <InfoItem label="Status" value={<StatusChip status={pod.status} />} isChip />
                {pod.source && (
                  <InfoItem 
                    label="Source" 
                    value={
                      <Chip
                        size="small"
                        icon={pod.source === 'SCANNED' ? <ScanIcon sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' } }} /> : <ReceiptIcon sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' } }} />}
                        label={pod.source === 'SCANNED' ? 'Scanned from Driver' : 'Manual Upload'}
                        color={pod.source === 'SCANNED' ? 'info' : 'default'}
                        sx={{ 
                          fontSize: { xs: '0.55rem', sm: '0.65rem' }, 
                          height: { xs: 18, sm: 22 } 
                        }}
                      />
                    }
                    isCustom
                  />
                )}
                <InfoItem 
                  label="Document" 
                  value={
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      {hasFile ? 
                        <DocumentIcon type={pod.documentType} size={isMobile ? 16 : 20} /> : 
                        <WarningIcon sx={{ fontSize: { xs: 16, sm: 20 }, color: '#ff9800' }} />
                      }
                      <Typography variant="body2" sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem' } }}>
                        {hasFile ? (pod.documentType || 'N/A') : 'No file uploaded'}
                      </Typography>
                    </Stack>
                  }
                  isCustom
                />
                <InfoItem label="File Size" value={hasFile ? (pod.fileSize || 'N/A') : 'N/A'} />
                <InfoItem 
                  label="Uploaded By" 
                  value={
                    <Box>
                      <Typography variant="body2" sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem' } }}>
                        {pod.uploadedBy || 'N/A'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.5rem', sm: '0.6rem' } }}>
                        {pod.uploadedAt ? new Date(pod.uploadedAt).toLocaleString() : 'N/A'}
                      </Typography>
                    </Box>
                  }
                  isCustom
                />
              </Grid>
            </Grid>
          </Paper>

          {/* Debrief Information */}
          {pod.debriefedAt && (
            <Paper
              elevation={0}
              sx={{
                p: { xs: 1.5, sm: 2, md: 2.5 },
                mb: 2,
                borderRadius: { xs: '12px', sm: '16px' },
                border: '1px solid #ECECEC',
                bgcolor: '#FFFFFF',
                width: '100%',
              }}
            >
              <Typography 
                variant="subtitle1" 
                sx={{ 
                  fontSize: { xs: '0.85rem', sm: '0.9rem' }, 
                  fontWeight: 600, 
                  mb: 2,
                  color: '#111827',
                }}
              >
                <AssignmentIcon sx={{ fontSize: '0.9rem', verticalAlign: 'middle', mr: 1 }} />
                Debrief Information
              </Typography>
              
              <Grid container spacing={{ xs: 1, sm: 1.5 }}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <InfoItem label="Debriefed By" value={pod.debriefedBy || 'N/A'} />
                  <InfoItem label="Debriefed At" value={pod.debriefedAt ? new Date(pod.debriefedAt).toLocaleString() : 'N/A'} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <InfoItem label="Received By" value={pod.receivedBy || 'N/A'} />
                  <InfoItem 
                    label="Delivery Condition" 
                    value={
                      <Chip
                        size="small"
                        label={pod.deliveryCondition || 'N/A'}
                        color={
                          pod.deliveryCondition === 'GOOD' ? 'success' :
                          pod.deliveryCondition === 'DAMAGED' ? 'error' :
                          pod.deliveryCondition === 'PARTIAL' ? 'warning' :
                          'default'
                        }
                        sx={{ 
                          fontSize: { xs: '0.55rem', sm: '0.65rem' }, 
                          height: { xs: 18, sm: 22 } 
                        }}
                      />
                    }
                    isCustom
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <InfoItem label="Quality Rating" value={renderStars(pod.qualityRating || 0)} isCustom />
                </Grid>
                {pod.issuesFound && (
                  <Grid size={{ xs: 12 }}>
                    <InfoItem label="Issues Found" value={pod.issuesFound} />
                  </Grid>
                )}
                {pod.debriefNotes && (
                  <Grid size={{ xs: 12 }}>
                    <InfoItem label="Debrief Notes" value={pod.debriefNotes} />
                  </Grid>
                )}
                {pod.additionalInfo && (
                  <Grid size={{ xs: 12 }}>
                    <InfoItem label="Additional Information" value={pod.additionalInfo} />
                  </Grid>
                )}
              </Grid>
            </Paper>
          )}

          {/* Trip Details Accordion */}
          {pod.tripId && (
            <Paper
              elevation={0}
              sx={{
                mb: 2,
                borderRadius: { xs: '12px', sm: '16px' },
                border: '1px solid #ECECEC',
                bgcolor: '#FFFFFF',
                width: '100%',
                overflow: 'hidden',
              }}
            >
              <Accordion sx={{ boxShadow: 'none', '&:before': { display: 'none' } }}>
                <AccordionSummary 
                  expandIcon={<ExpandMoreIcon />}
                  sx={{ 
                    '& .MuiAccordionSummary-content': { 
                      alignItems: 'center' 
                    } 
                  }}
                >
                  <ShippingIcon sx={{ fontSize: { xs: '0.9rem', sm: '1rem' }, mr: 1, color: '#4F46E5' }} />
                  <Typography 
                    variant="subtitle2" 
                    sx={{ 
                      fontSize: { xs: '0.75rem', sm: '0.85rem' }, 
                      fontWeight: 600,
                      color: '#111827',
                    }}
                  >
                    Trip Details
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={{ xs: 1, sm: 1.5 }}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <InfoItem label="Trip Number" value={`#${pod.tripId}`} />
                      <InfoItem label="Trip Status" value={tripDetails?.status || 'N/A'} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <InfoItem label="Vehicle" value={pod.vehicleRegistration || 'N/A'} />
                      <InfoItem label="Driver" value={pod.driverName || 'N/A'} />
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            </Paper>
          )}

          {/* Notes */}
          {pod.notes && (
            <Paper
              elevation={0}
              sx={{
                p: { xs: 1.5, sm: 2, md: 2.5 },
                mb: 2,
                borderRadius: { xs: '12px', sm: '16px' },
                border: '1px solid #ECECEC',
                bgcolor: '#FFFFFF',
                width: '100%',
              }}
            >
              <Typography 
                variant="subtitle2" 
                sx={{ 
                  fontSize: { xs: '0.75rem', sm: '0.8rem' }, 
                  fontWeight: 600, 
                  mb: 1,
                  color: '#111827',
                }}
              >
                <CommentIcon sx={{ fontSize: '0.9rem', verticalAlign: 'middle', mr: 1 }} />
                Notes
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  fontSize: { xs: '0.7rem', sm: '0.8rem' }, 
                  color: 'text.secondary',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {pod.notes || 'No notes provided'}
              </Typography>
            </Paper>
          )}

          {/* Audit Trail */}
          {pod.auditTrail && Object.keys(pod.auditTrail).length > 0 && (
            <Paper
              elevation={0}
              sx={{
                p: { xs: 1.5, sm: 2, md: 2.5 },
                borderRadius: { xs: '12px', sm: '16px' },
                border: '1px solid #ECECEC',
                bgcolor: '#FFFFFF',
                width: '100%',
              }}
            >
              <Typography 
                variant="subtitle2" 
                sx={{ 
                  fontSize: { xs: '0.75rem', sm: '0.8rem' }, 
                  fontWeight: 600, 
                  mb: 2,
                  color: '#111827',
                }}
              >
                <HistoryIcon sx={{ fontSize: '0.9rem', verticalAlign: 'middle', mr: 1 }} />
                Audit Trail
              </Typography>
              <Stack spacing={1}>
                {Object.entries(pod.auditTrail).map(([key, value]) => (
                  <Box 
                    key={key} 
                    sx={{ 
                      p: { xs: 1, sm: 1.5 }, 
                      bgcolor: '#F9FAFB', 
                      borderRadius: 1,
                      border: '1px solid #ECECEC',
                    }}
                  >
                    <Typography variant="caption" sx={{ fontSize: { xs: '0.5rem', sm: '0.6rem' }, color: 'text.secondary' }}>
                      {key}
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' }, color: '#111827' }}>
                      {typeof value === 'string' ? value : JSON.stringify(value)}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Paper>
          )}
        </Grid>

        {/* Right Column - Timeline and Actions */}
        <Grid size={{ xs: 12, md: 4 }}>
          {/* Status Timeline */}
          <Paper
            elevation={0}
            sx={{
              p: { xs: 1.5, sm: 2, md: 2.5 },
              mb: 2,
              borderRadius: { xs: '12px', sm: '16px' },
              border: '1px solid #ECECEC',
              bgcolor: '#FFFFFF',
              width: '100%',
            }}
          >
            <Typography 
              variant="subtitle2" 
              sx={{ 
                fontSize: { xs: '0.75rem', sm: '0.8rem' }, 
                fontWeight: 600, 
                mb: 2,
                color: '#111827',
              }}
            >
              <ScheduleIcon sx={{ fontSize: '0.9rem', verticalAlign: 'middle', mr: 1 }} />
              Status Timeline
            </Typography>
            {loadingHistory ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                <CircularProgress size={24} />
              </Box>
            ) : statusHistory.length > 0 ? (
              <Timeline position="right" sx={{ p: 0 }}>
                {statusHistory.map((event, index) => (
                  <TimelineItem key={index} sx={{ minHeight: { xs: 40, sm: 50 } }}>
                    <TimelineOppositeContent sx={{ flex: 0.2, py: 0 }}>
                      <Typography variant="caption" sx={{ fontSize: { xs: '0.45rem', sm: '0.55rem' }, color: 'text.secondary' }}>
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </Typography>
                    </TimelineOppositeContent>
                    <TimelineSeparator>
                      <TimelineDot color={getTimelineColor(event.status)} sx={{ p: 0.5 }}>
                        {getTimelineIcon(event.status)}
                      </TimelineDot>
                      {index < statusHistory.length - 1 && <TimelineConnector />}
                    </TimelineSeparator>
                    <TimelineContent sx={{ py: 0 }}>
                      <Typography variant="body2" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' }, fontWeight: 500 }}>
                        {event.status}
                      </Typography>
                      <Typography variant="caption" sx={{ fontSize: { xs: '0.5rem', sm: '0.6rem' }, color: 'text.secondary' }}>
                        {event.notes || `Status updated to ${event.status}`}
                      </Typography>
                      {event.updatedBy && (
                        <Typography variant="caption" sx={{ fontSize: { xs: '0.45rem', sm: '0.55rem' }, color: 'text.secondary', display: 'block' }}>
                          by {event.updatedBy}
                        </Typography>
                      )}
                    </TimelineContent>
                  </TimelineItem>
                ))}
              </Timeline>
            ) : (
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' } }}>
                No status history available
              </Typography>
            )}
          </Paper>

          {/* Quick Actions */}
          <Paper
            elevation={0}
            sx={{
              p: { xs: 1.5, sm: 2, md: 2.5 },
              borderRadius: { xs: '12px', sm: '16px' },
              border: '1px solid #ECECEC',
              bgcolor: '#FFFFFF',
              width: '100%',
            }}
          >
            <Typography 
              variant="subtitle2" 
              sx={{ 
                fontSize: { xs: '0.75rem', sm: '0.8rem' }, 
                fontWeight: 600, 
                mb: 2,
                color: '#111827',
              }}
            >
              Quick Actions
            </Typography>
            <Stack spacing={1}>
              {needsDebrief && (
                <Button
                  fullWidth
                  variant="contained"
                  color="success"
                  startIcon={<AssignmentIcon sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' } }} />}
                  onClick={handleDebrief}
                  size="small"
                  sx={{ 
                    fontSize: { xs: '0.7rem', sm: '0.75rem' }, 
                    py: { xs: 0.5, sm: 0.75 },
                    borderRadius: '10px',
                    textTransform: 'none',
                  }}
                >
                  {isMobile ? 'Debrief' : 'Debrief POD'}
                </Button>
              )}
              <Button
                fullWidth
                variant={hasFile ? "outlined" : "contained"}
                color={hasFile ? "primary" : "warning"}
                startIcon={<CloudUploadIcon sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' } }} />}
                onClick={() => setUploadDialogOpen(true)}
                size="small"
                sx={{ 
                  fontSize: { xs: '0.7rem', sm: '0.75rem' }, 
                  py: { xs: 0.5, sm: 0.75 },
                  borderRadius: '10px',
                  textTransform: 'none',
                }}
              >
                {hasFile ? (isMobile ? 'Replace' : 'Re-upload Document') : (isMobile ? 'Upload' : 'Upload Document')}
              </Button>
              {pod.source !== 'SCANNED' && (
                <Button
                  fullWidth
                  variant="outlined"
                  color="info"
                  startIcon={<ScanIcon sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' } }} />}
                  onClick={handleScanNew}
                  size="small"
                  sx={{ 
                    fontSize: { xs: '0.7rem', sm: '0.75rem' }, 
                    py: { xs: 0.5, sm: 0.75 },
                    borderRadius: '10px',
                    textTransform: 'none',
                  }}
                >
                  {isMobile ? 'Scan' : 'Scan New POD'}
                </Button>
              )}
              <Button
                fullWidth
                variant="outlined"
                startIcon={<PrintIcon sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' } }} />}
                onClick={() => window.print()}
                size="small"
                sx={{ 
                  fontSize: { xs: '0.7rem', sm: '0.75rem' }, 
                  py: { xs: 0.5, sm: 0.75 },
                  borderRadius: '10px',
                  textTransform: 'none',
                }}
              >
                Print
              </Button>
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      {/* Upload Dialog */}
      <Dialog 
        open={uploadDialogOpen} 
        onClose={() => !uploading && setUploadDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: { xs: '12px', sm: '16px' },
          }
        }}
      >
        <DialogTitle sx={{ 
          borderBottom: 1, 
          borderColor: 'divider',
          py: { xs: 1.5, sm: 2 },
        }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" sx={{ fontSize: { xs: '0.9rem', sm: '1rem' }, fontWeight: 600 }}>
              {hasFile ? 'Re-upload Document' : 'Upload Document'}
            </Typography>
            <IconButton onClick={() => setUploadDialogOpen(false)} disabled={uploading} size="small">
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <DialogContentText sx={{ 
            mb: 2, 
            fontSize: { xs: '0.8rem', sm: '0.9rem' },
            color: '#6B7280',
          }}>
            {hasFile 
              ? `Upload a new file for POD ${pod.podNumber}. The existing file will be replaced.`
              : `Upload a file for POD ${pod.podNumber}.`}
          </DialogContentText>
          
          {uploadError && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: '12px', fontSize: { xs: '0.7rem', sm: '0.8rem' } }}>
              {uploadError}
            </Alert>
          )}

          <Box
            {...getRootProps()}
            sx={{
              border: '2px dashed',
              borderColor: isDragActive ? '#4F46E5' : isDragReject ? '#EF4444' : '#D1D5DB',
              borderRadius: 2,
              p: { xs: 3, sm: 4 },
              textAlign: 'center',
              cursor: uploading ? 'default' : 'pointer',
              bgcolor: isDragActive ? '#EEF2FF' : '#FFFFFF',
              transition: 'all 0.2s',
              '&:hover': {
                bgcolor: uploading ? '#FFFFFF' : '#F9FAFB',
              },
              opacity: uploading ? 0.7 : 1,
            }}
          >
            <input {...getInputProps()} />
            
            {uploading ? (
              <Box>
                <CircularProgress size={40} sx={{ mb: 2 }} />
                <Typography variant="body1" sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' } }}>
                  Uploading... {uploadProgress}%
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={uploadProgress} 
                  sx={{ 
                    mt: 2, 
                    height: 8, 
                    borderRadius: 4,
                    bgcolor: '#EEF2FF',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: '#4F46E5',
                    }
                  }}
                />
              </Box>
            ) : (
              <>
                <CloudUploadIcon sx={{ 
                  fontSize: { xs: 40, sm: 48 }, 
                  color: isDragActive ? '#4F46E5' : '#9CA3AF', 
                  mb: 2 
                }} />
                <Typography variant="body1" sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' }, color: '#111827' }}>
                  {isDragActive ? 'Drop the file here' : 'Drag & drop a file here, or click to select'}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ 
                  display: 'block', 
                  mt: 1, 
                  fontSize: { xs: '0.65rem', sm: '0.75rem' } 
                }}>
                  Supported formats: PDF, JPG, PNG, DOC, DOCX (Max 10MB)
                </Typography>
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ 
          borderTop: 1, 
          borderColor: 'divider',
          p: { xs: 1.5, sm: 2 },
        }}>
          <Button 
            onClick={() => setUploadDialogOpen(false)} 
            disabled={uploading}
            sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem' } }}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={() => document.querySelector('input[type="file"]')?.click()}
            disabled={uploading}
            startIcon={<CloudUploadIcon />}
            sx={{ 
              fontSize: { xs: '0.7rem', sm: '0.8rem' },
              borderRadius: '10px',
              textTransform: 'none',
              background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #4338CA 0%, #4F46E5 100%)',
              },
            }}
          >
            Select File
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity} 
          sx={{ 
            width: '100%',
            borderRadius: '12px',
            fontSize: { xs: '0.7rem', sm: '0.8rem' },
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </ResponsiveContainer>
  );
};

export default PODDetails;
