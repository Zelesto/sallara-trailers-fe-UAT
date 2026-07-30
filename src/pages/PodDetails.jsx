// src/pages/PODDetails.jsx
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

const PODDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
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
      
      // Load trip details if tripId exists
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
      // This would be your trip service call
      // const trip = await tripService.getTripById(tripId);
      // setTripDetails(trip);
      setTripDetails({ id: tripId, status: 'COMPLETED' }); // Placeholder
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

  // Dropzone configuration
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

  const getStatusChip = (status) => {
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

  // Format quality rating as stars
  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        i <= rating ? 
          <StarIcon key={i} sx={{ fontSize: '1rem', color: '#FFD700' }} /> : 
          <StarBorderIcon key={i} sx={{ fontSize: '1rem', color: '#FFD700' }} />
      );
    }
    return <Box sx={{ display: 'flex', alignItems: 'center' }}>{stars}</Box>;
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

  const needsDebrief = pod.status === 'PENDING' || pod.status === 'SCANNED';
  const hasFile = pod.fileUrl && pod.fileUrl.length > 0;
  const isMissingFile = pod.status === 'MISSING_FILE' || pod.status === 'UPLOAD_FAILED' || !hasFile;

  return (
    <Box sx={{ p: { xs: 1, sm: 1.5, md: 2 } }}>
      {/* Header */}
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
          {pod.source === 'SCANNED' && (
            <Tooltip title="This POD was scanned from driver">
              <Chip
                size="small"
                icon={<ScanIcon sx={{ fontSize: '0.8rem' }} />}
                label="Scanned"
                color="info"
                sx={{ fontSize: '0.65rem', height: 24 }}
              />
            </Tooltip>
          )}
          {isMissingFile && (
            <Tooltip title="This POD is missing a file">
              <Chip
                size="small"
                icon={<WarningIcon sx={{ fontSize: '0.8rem' }} />}
                label="No File"
                color="warning"
                sx={{ fontSize: '0.65rem', height: 24 }}
              />
            </Tooltip>
          )}
          {needsDebrief && (
            <Button
              variant="contained"
              color="success"
              startIcon={<AssignmentIcon sx={{ fontSize: '0.9rem' }} />}
              onClick={handleDebrief}
              size="small"
              sx={{ fontSize: '0.75rem', py: 0.5 }}
            >
              Debrief
            </Button>
          )}
          <Tooltip title="Print">
            <IconButton size="small" color="primary" onClick={() => window.print()} sx={{ p: 0.5 }}>
              <PrintIcon sx={{ fontSize: '0.9rem' }} />
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

      {/* Missing File Alert */}
      {isMissingFile && (
        <Alert 
          severity="warning" 
          sx={{ mb: 2, fontSize: '0.8rem' }}
          action={
            <Button 
              color="warning" 
              size="small" 
              onClick={() => setUploadDialogOpen(true)}
              startIcon={<CloudUploadIcon />}
            >
              Upload File
            </Button>
          }
        >
          This POD is missing a file. Please upload a document to complete the record.
        </Alert>
      )}

      {/* Summary Card */}
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: 1.5,
                bgcolor: hasFile ? getDocumentColor(pod.documentType) : '#ff9800',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                flexShrink: 0,
              }}
            >
              {hasFile ? getDocumentIcon(pod.documentType) : <WarningIcon sx={{ fontSize: 32 }} />}
            </Box>
            
            <Box sx={{ flex: 1, width: '100%' }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'flex-start', sm: 'center' }}>
                <Typography variant="h6" fontWeight="bold" sx={{ fontSize: '1rem' }}>
                  {pod.podNumber}
                </Typography>
                {getStatusChip(pod.status)}
                {pod.source === 'SCANNED' && (
                  <Chip
                    size="small"
                    icon={<ScanIcon sx={{ fontSize: '0.7rem' }} />}
                    label="📸 Scanned"
                    variant="outlined"
                    sx={{ fontSize: '0.55rem', height: 18, borderColor: '#1976d2', color: '#1976d2' }}
                  />
                )}
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
                {pod.debriefedAt && (
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                    <strong>Debriefed:</strong> {new Date(pod.debriefedAt).toLocaleDateString()}
                  </Typography>
                )}
              </Stack>
            </Box>

            <Stack direction="row" spacing={1}>
              {hasFile && (
                <DownloadHandler
                  url={podService.getPodDocumentUrl(id, true)}
                  filename={`${pod.podNumber || 'pod'}.${pod.documentType?.toLowerCase() || 'pdf'}`}
                  buttonText="Download"
                  variant="contained"
                  size="small"
                  color="primary"
                  startIcon={<DownloadIcon sx={{ fontSize: '0.9rem' }} />}
                  sx={{ fontSize: '0.75rem', py: 0.5, flexShrink: 0 }}
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
                startIcon={<CloudUploadIcon sx={{ fontSize: '0.9rem' }} />}
                onClick={() => setUploadDialogOpen(true)}
                size="small"
                sx={{ fontSize: '0.75rem', py: 0.5, flexShrink: 0 }}
              >
                {hasFile ? 'Re-upload' : 'Upload File'}
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <Grid container spacing={2}>
        {/* Left Column - Main Details */}
        <Grid item xs={12} md={8}>
          {/* POD Information */}
          <Paper sx={{ p: { xs: 1.5, sm: 2 }, mb: 2 }}>
            <Typography variant="subtitle1" sx={{ fontSize: '0.9rem', fontWeight: 600, mb: 2 }}>
              <ReceiptIcon sx={{ fontSize: '0.9rem', verticalAlign: 'middle', mr: 1 }} />
              POD Information
            </Typography>
            
            <Grid container spacing={1.5}>
              <Grid item xs={12} sm={6}>
                <InfoItem label="POD Number" value={pod.podNumber} />
                <InfoItem label="Trip ID" value={`#${pod.tripId || 'N/A'}`} />
                <InfoItem label="Customer Name" value={pod.customerName || 'N/A'} />
                <InfoItem label="Delivery Date" value={pod.deliveryDate ? new Date(pod.deliveryDate).toLocaleDateString() : 'N/A'} />
                {pod.driverName && (
                  <InfoItem label="Driver Name" value={pod.driverName} />
                )}
              </Grid>

              <Grid item xs={12} sm={6}>
                <InfoItem label="Status" value={getStatusChip(pod.status)} isChip />
                {pod.source && (
                  <InfoItem 
                    label="Source" 
                    value={
                      <Chip
                        size="small"
                        icon={pod.source === 'SCANNED' ? <ScanIcon sx={{ fontSize: '0.7rem' }} /> : <ReceiptIcon sx={{ fontSize: '0.7rem' }} />}
                        label={pod.source === 'SCANNED' ? 'Scanned from Driver' : 'Manual Upload'}
                        color={pod.source === 'SCANNED' ? 'info' : 'default'}
                        sx={{ fontSize: '0.65rem', height: 22 }}
                      />
                    }
                    isCustom
                  />
                )}
                <InfoItem 
                  label="Document" 
                  value={
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      {hasFile ? getDocumentIcon(pod.documentType) : <WarningIcon sx={{ fontSize: 20, color: '#ff9800' }} />}
                      <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
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
              </Grid>
            </Grid>
          </Paper>

          {/* Debrief Information */}
          {pod.debriefedAt && (
            <Paper sx={{ p: { xs: 1.5, sm: 2 }, mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontSize: '0.9rem', fontWeight: 600, mb: 2 }}>
                <AssignmentIcon sx={{ fontSize: '0.9rem', verticalAlign: 'middle', mr: 1 }} />
                Debrief Information
              </Typography>
              
              <Grid container spacing={1.5}>
                <Grid item xs={12} sm={6}>
                  <InfoItem 
                    label="Debriefed By" 
                    value={pod.debriefedBy || 'N/A'} 
                  />
                  <InfoItem 
                    label="Debriefed At" 
                    value={pod.debriefedAt ? new Date(pod.debriefedAt).toLocaleString() : 'N/A'} 
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <InfoItem 
                    label="Received By" 
                    value={pod.receivedBy || 'N/A'} 
                  />
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
                        sx={{ fontSize: '0.65rem', height: 22 }}
                      />
                    }
                    isCustom
                  />
                </Grid>
                <Grid item xs={12}>
                  <InfoItem 
                    label="Quality Rating" 
                    value={renderStars(pod.qualityRating || 0)}
                    isCustom
                  />
                </Grid>
                {pod.issuesFound && (
                  <Grid item xs={12}>
                    <InfoItem 
                      label="Issues Found" 
                      value={pod.issuesFound}
                    />
                  </Grid>
                )}
                {pod.debriefNotes && (
                  <Grid item xs={12}>
                    <InfoItem 
                      label="Debrief Notes" 
                      value={pod.debriefNotes}
                    />
                  </Grid>
                )}
                {pod.additionalInfo && (
                  <Grid item xs={12}>
                    <InfoItem 
                      label="Additional Information" 
                      value={pod.additionalInfo}
                    />
                  </Grid>
                )}
              </Grid>
            </Paper>
          )}

          {/* Trip Details Accordion */}
          {pod.tripId && (
            <Paper sx={{ mb: 2 }}>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle2" sx={{ fontSize: '0.85rem', fontWeight: 600 }}>
                    <ShippingIcon sx={{ fontSize: '0.9rem', verticalAlign: 'middle', mr: 1 }} />
                    Trip Details
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={1.5}>
                    <Grid item xs={12} sm={6}>
                      <InfoItem label="Trip Number" value={`#${pod.tripId}`} />
                      <InfoItem label="Trip Status" value={tripDetails?.status || 'N/A'} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
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
            <Paper sx={{ p: { xs: 1.5, sm: 2 }, mb: 2 }}>
              <Typography variant="subtitle2" sx={{ fontSize: '0.8rem', fontWeight: 600, mb: 1 }}>
                <CommentIcon sx={{ fontSize: '0.9rem', verticalAlign: 'middle', mr: 1 }} />
                Notes
              </Typography>
              <Typography variant="body2" sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
                {pod.notes}
              </Typography>
            </Paper>
          )}

          {/* Audit Trail */}
          {pod.auditTrail && Object.keys(pod.auditTrail).length > 0 && (
            <Paper sx={{ p: { xs: 1.5, sm: 2 } }}>
              <Typography variant="subtitle2" sx={{ fontSize: '0.8rem', fontWeight: 600, mb: 2 }}>
                <HistoryIcon sx={{ fontSize: '0.9rem', verticalAlign: 'middle', mr: 1 }} />
                Audit Trail
              </Typography>
              <Stack spacing={1}>
                {Object.entries(pod.auditTrail).map(([key, value]) => (
                  <Box key={key} sx={{ p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'text.secondary' }}>
                      {key}
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                      {typeof value === 'string' ? value : JSON.stringify(value)}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Paper>
          )}
        </Grid>

        {/* Right Column - Timeline and Actions */}
        <Grid item xs={12} md={4}>
          {/* Status Timeline */}
          <Paper sx={{ p: { xs: 1.5, sm: 2 }, mb: 2 }}>
            <Typography variant="subtitle2" sx={{ fontSize: '0.8rem', fontWeight: 600, mb: 2 }}>
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
                  <TimelineItem key={index} sx={{ minHeight: 50 }}>
                    <TimelineOppositeContent sx={{ flex: 0.2, py: 0 }}>
                      <Typography variant="caption" sx={{ fontSize: '0.55rem', color: 'text.secondary' }}>
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
                      <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
                        {event.status}
                      </Typography>
                      <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'text.secondary' }}>
                        {event.notes || `Status updated to ${event.status}`}
                      </Typography>
                      {event.updatedBy && (
                        <Typography variant="caption" sx={{ fontSize: '0.55rem', color: 'text.secondary', display: 'block' }}>
                          by {event.updatedBy}
                        </Typography>
                      )}
                    </TimelineContent>
                  </TimelineItem>
                ))}
              </Timeline>
            ) : (
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                No status history available
              </Typography>
            )}
          </Paper>

          {/* Quick Actions */}
          <Paper sx={{ p: { xs: 1.5, sm: 2 } }}>
            <Typography variant="subtitle2" sx={{ fontSize: '0.8rem', fontWeight: 600, mb: 2 }}>
              Quick Actions
            </Typography>
            <Stack spacing={1}>
              {needsDebrief && (
                <Button
                  fullWidth
                  variant="contained"
                  color="success"
                  startIcon={<AssignmentIcon sx={{ fontSize: '0.9rem' }} />}
                  onClick={handleDebrief}
                  size="small"
                  sx={{ fontSize: '0.75rem', py: 0.75 }}
                >
                  Debrief POD
                </Button>
              )}
              <Button
                fullWidth
                variant={hasFile ? "outlined" : "contained"}
                color={hasFile ? "primary" : "warning"}
                startIcon={<CloudUploadIcon sx={{ fontSize: '0.9rem' }} />}
                onClick={() => setUploadDialogOpen(true)}
                size="small"
                sx={{ fontSize: '0.75rem', py: 0.75 }}
              >
                {hasFile ? 'Re-upload Document' : 'Upload Document'}
              </Button>
              {pod.source !== 'SCANNED' && (
                <Button
                  fullWidth
                  variant="outlined"
                  color="info"
                  startIcon={<ScanIcon sx={{ fontSize: '0.9rem' }} />}
                  onClick={handleScanNew}
                  size="small"
                  sx={{ fontSize: '0.75rem', py: 0.75 }}
                >
                  Scan New POD
                </Button>
              )}
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
      >
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              {hasFile ? 'Re-upload Document' : 'Upload Document'}
            </Typography>
            <IconButton onClick={() => setUploadDialogOpen(false)} disabled={uploading}>
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2, fontSize: '0.9rem' }}>
            {hasFile 
              ? `Upload a new file for POD ${pod.podNumber}. The existing file will be replaced.`
              : `Upload a file for POD ${pod.podNumber}.`}
          </DialogContentText>
          
          {uploadError && (
            <Alert severity="error" sx={{ mb: 2, fontSize: '0.8rem' }}>
              {uploadError}
            </Alert>
          )}

          <Box
            {...getRootProps()}
            sx={{
              border: '2px dashed',
              borderColor: isDragActive ? 'primary.main' : isDragReject ? 'error.main' : 'grey.400',
              borderRadius: 2,
              p: 4,
              textAlign: 'center',
              cursor: uploading ? 'default' : 'pointer',
              bgcolor: isDragActive ? 'action.hover' : 'background.paper',
              transition: 'all 0.2s',
              '&:hover': {
                bgcolor: uploading ? 'background.paper' : 'action.hover',
              },
              opacity: uploading ? 0.7 : 1,
            }}
          >
            <input {...getInputProps()} />
            
            {uploading ? (
              <Box>
                <CircularProgress size={40} sx={{ mb: 2 }} />
                <Typography variant="body1" sx={{ fontSize: '0.9rem' }}>
                  Uploading... {uploadProgress}%
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={uploadProgress} 
                  sx={{ mt: 2, height: 8, borderRadius: 4 }}
                />
              </Box>
            ) : (
              <>
                <CloudUploadIcon sx={{ fontSize: 48, color: 'action.active', mb: 2 }} />
                <Typography variant="body1" sx={{ fontSize: '0.9rem' }}>
                  {isDragActive ? 'Drop the file here' : 'Drag & drop a file here, or click to select'}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, fontSize: '0.75rem' }}>
                  Supported formats: PDF, JPG, PNG, DOC, DOCX (Max 10MB)
                </Typography>
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)} disabled={uploading}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={() => document.querySelector('input[type="file"]')?.click()}
            disabled={uploading}
            startIcon={<CloudUploadIcon />}
          >
            Select File
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

// InfoItem Component
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
        {value || 'N/A'}
      </Typography>
    )}
  </Box>
);

export default PODDetails;
