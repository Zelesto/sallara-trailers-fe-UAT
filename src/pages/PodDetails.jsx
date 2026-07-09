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
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
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
} from '@mui/icons-material';
import { podService } from '../services/podService';
import DownloadHandler from '../components/DownloadHandler';


const PODDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pod, setPod] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusHistory, setStatusHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    loadPod();
    loadStatusHistory();
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

  const handleDownload = useCallback(() => {
  // This will be called on success or error from DownloadHandler
    }, []);
  
  const loadStatusHistory = async () => {
  setLoadingHistory(true);
  try {
    const history = await podService.getPodStatusHistory(id);
    setStatusHistory(history || []);
  } catch (err) {
    console.error('Error loading status history:', err);
    // Don't show error to user, just set empty history
    setStatusHistory([]);
  } finally {
    setLoadingHistory(false);
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

  const getStatusChip = (status) => {
    const statusMap = {
      SCANNED: { color: 'info', icon: <ScanIcon sx={{ fontSize: '0.9rem' }} />, label: 'Scanned' },
      PENDING: { color: 'warning', icon: <PendingIcon sx={{ fontSize: '0.9rem' }} />, label: 'Pending' },
      DELIVERED: { color: 'success', icon: <CheckCircleIcon sx={{ fontSize: '0.9rem' }} />, label: 'Delivered' },
      VERIFIED: { color: 'info', icon: <VerifiedIcon sx={{ fontSize: '0.9rem' }} />, label: 'Verified' },
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
    // Optionally set a local error state
  }}
  onSuccess={() => {
    console.log('Download successful');
  }}
  showSuccessSnackbar={true}
/>
          </Stack>
        </CardContent>
      </Card>

      <Grid container spacing={2}>
        <Grid item xs={12} md={8}>
          {/* Details Section - Compact */}
          <Paper sx={{ p: { xs: 1.5, sm: 2 }, mb: 2 }}>
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
                  {pod.driverName && (
                    <InfoItem label="Driver Name" value={pod.driverName} />
                  )}
                </Stack>
              </Grid>

              <Grid item xs={12} md={6}>
                <Stack spacing={1.5}>
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

              {/* Debrief Information */}
              {pod.debriefedAt && (
                <Grid item xs={12}>
                  <Divider sx={{ my: 1.5 }} />
                  <Typography variant="subtitle1" sx={{ fontSize: '0.9rem', fontWeight: 600, mb: 2 }}>
                    <AssignmentIcon sx={{ fontSize: '0.9rem', verticalAlign: 'middle', mr: 1 }} />
                    Debrief Information
                  </Typography>
                  <Grid container spacing={1.5}>
                    <Grid item xs={12} sm={6}>
                      <InfoItem label="Debriefed By" value={pod.debriefedBy || 'N/A'} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <InfoItem label="Debriefed At" value={new Date(pod.debriefedAt).toLocaleString()} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <InfoItem label="Received By" value={pod.receivedBy || 'N/A'} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <InfoItem label="Delivery Condition" value={pod.deliveryCondition || 'N/A'} />
                    </Grid>
                    <Grid item xs={12}>
                      <InfoItem 
                        label="Quality Rating" 
                        value={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {pod.qualityRating ? (
                              <>
                                {[1, 2, 3, 4, 5].map((star) => (
                                  star <= pod.qualityRating ? 
                                    <StarIcon key={star} sx={{ fontSize: '1rem', color: '#faaf00' }} /> :
                                    <StarBorderIcon key={star} sx={{ fontSize: '1rem', color: '#faaf00' }} />
                                ))}
                                <Typography variant="caption" sx={{ fontSize: '0.7rem', ml: 1 }}>
                                  ({pod.qualityRating}/5)
                                </Typography>
                              </>
                            ) : 'N/A'}
                          </Box>
                        }
                        isCustom
                      />
                    </Grid>
                    {pod.issuesFound && pod.issuesFound.length > 0 && (
                      <Grid item xs={12}>
                        <InfoItem 
                          label="Issues Found" 
                          value={
                            <Stack direction="row" spacing={0.5} flexWrap="wrap">
                              {pod.issuesFound.map((issue, index) => (
                                <Chip
                                  key={index}
                                  label={issue}
                                  size="small"
                                  color="warning"
                                  icon={<WarningIcon sx={{ fontSize: '0.7rem' }} />}
                                  sx={{ fontSize: '0.6rem', height: 20 }}
                                />
                              ))}
                            </Stack>
                          }
                          isCustom
                        />
                      </Grid>
                    )}
                    <Grid item xs={12}>
                      <InfoItem label="Debrief Notes" value={pod.debriefNotes || 'N/A'} />
                    </Grid>
                    {pod.additionalInfo && (
                      <Grid item xs={12}>
                        <InfoItem label="Additional Information" value={pod.additionalInfo} />
                      </Grid>
                    )}
                  </Grid>
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
                    {pod.debriefedAt && (
                      <AuditItem label="Debriefed" value={new Date(pod.debriefedAt).toLocaleString()} by={pod.debriefedBy} />
                    )}
                  </Stack>
                </Paper>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

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
              <DownloadHandler
  url={podService.getPodDocumentUrl(id, true)}
  filename={`${pod.podNumber || 'pod'}.${pod.documentType?.toLowerCase() || 'pdf'}`}
  buttonText="Download Document"
  variant="outlined"
  size="small"
  color="primary"
  fullWidth
  sx={{ fontSize: '0.75rem', py: 0.75 }}
  onError={(err) => {
    console.error('Download failed:', err);
  }}
/>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
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

const handleDownload = async () => {
  try {
    // Get the download URL
    const downloadUrl = podService.getPodDocumentUrl(id, true);
    
    // Open in new tab/window with proper handling
    const newWindow = window.open(downloadUrl, '_blank');
    
    // If the window was blocked, fallback to direct download
    if (!newWindow) {
      // Use a hidden anchor tag
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${pod.podNumber || 'pod'}.${pod.documentType?.toLowerCase() || 'pdf'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  } catch (error) {
    console.error('Error downloading POD:', error);
    setError('Failed to download document. Please try again.');
  }
};

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
