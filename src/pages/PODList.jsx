// src/pages/PODList.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  IconButton,
  Tooltip,
  Chip,
  TextField,
  InputAdornment,
  Stack,
  Paper,
  Typography,
  Grid,
  Alert,
  CircularProgress,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
  FileDownload as ExportIcon,
  Receipt as ReceiptIcon,
  PictureAsPdf as PdfIcon,
  Image as ImageIcon,
  Description as DescriptionIcon,
  QrCodeScanner as ScanIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Pending as PendingIcon,
  Verified as VerifiedIcon,
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import { podService } from '../services/podService';
import { ResponsiveContainer } from '../components/ResponsiveContainer';

import {
  POD_STATUSES,
  POD_STATUS_OPTIONS,
  getDisplayName,
  getColor,
} from '../constants';

// ============================================================
// STAT CARD COMPONENT (Matches Dashboard)
// ============================================================
const StatCard = React.memo(({
  title,
  value,
  icon: Icon,
  color = 'primary',
  subtitle,
  badge = null,
}) => {
  const colors = {
    primary: '#4F46E5',
    success: '#22C55E',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
    purple: '#8B5CF6',
  };

  const getColor = (c) => colors[c] || colors.primary;
  const getColorBg = (c) => {
    const bgColors = {
      primary: '#EEF2FF',
      success: '#D1FAE5',
      warning: '#FEF3C7',
      error: '#FEE2E2',
      info: '#DBEAFE',
      purple: '#EDE9FE',
    };
    return bgColors[c] || bgColors.primary;
  };

  const iconColor = getColor(color);
  const bgColor = getColorBg(color);

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 1.5, sm: 2, md: 2.5 },
        borderRadius: { xs: '12px', sm: '16px' },
        border: '1px solid #ECECEC',
        bgcolor: '#FFFFFF',
        height: '100%',
        width: '100%',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
          borderColor: iconColor,
        },
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="caption"
            sx={{
              color: '#6B7280',
              fontWeight: 600,
              textTransform: 'uppercase',
              fontSize: { xs: '0.55rem', sm: '0.6rem', md: '0.65rem' },
              letterSpacing: '0.5px',
              display: 'block',
              mb: 0.25,
            }}
          >
            {title}
          </Typography>
          
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: '#111827',
              fontSize: { 
                xs: '1.2rem', 
                sm: '1.4rem', 
                md: '1.6rem', 
                lg: '1.8rem' 
              },
              lineHeight: 1.2,
            }}
          >
            {value || 0}
          </Typography>
          
          {subtitle && (
            <Typography
              variant="caption"
              sx={{
                color: '#6B7280',
                display: 'block',
                mt: 0.25,
                fontSize: { xs: '0.55rem', sm: '0.6rem', md: '0.65rem' },
              }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>

        <Badge
          badgeContent={badge}
          color="error"
          sx={{
            '& .MuiBadge-badge': {
              fontSize: { xs: '0.5rem', sm: '0.6rem' },
              height: { xs: 16, sm: 20 },
              minWidth: { xs: 16, sm: 20 },
            }
          }}
        >
          <Box
            sx={{
              bgcolor: bgColor,
              borderRadius: { xs: '10px', sm: '12px' },
              p: { xs: 1, sm: 1.25, md: 1.5 },
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Icon sx={{ 
              color: iconColor, 
              fontSize: { 
                xs: '1.2rem', 
                sm: '1.4rem', 
                md: '1.6rem' 
              },
            }} />
          </Box>
        </Badge>
      </Stack>
    </Paper>
  );
});

// ============================================================
// MAIN COMPONENT: PODList
// ============================================================
const PODList = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  // State
  const [pods, setPods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterType, setFilterType] = useState('ALL');
  const [scanningStats, setScanningStats] = useState({
    scannedToday: 0,
    pendingDebrief: 0,
  });
  
  // Pagination state
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 20,
  });
  const [rowCount, setRowCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Delete Dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Debounce search
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Load PODs
  const loadPods = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = {
        page: paginationModel.page,
        size: paginationModel.pageSize,
        sort: 'createdAt,desc',
      };
      
      if (filterStatus !== 'ALL') {
        params.status = filterStatus;
      }
      
      if (debouncedSearchTerm) {
        params.search = debouncedSearchTerm;
      }

      const response = await podService.getAllPods(params);
      
      const data = response?.content || [];
      const total = response?.totalElements || 0;
      const pages = response?.totalPages || 0;
      
      const transformedData = data.map(pod => ({
        ...pod,
        tripNumber: pod.tripNumber || pod.trip?.tripNumber || pod.tripId || 'N/A',
        tripId: pod.tripId || pod.trip?.id || null,
        customerName: pod.customerName || pod.customer?.name || 'N/A',
        needsDebrief: pod.status === 'PENDING' || pod.status === 'SCANNED',
        isScanned: pod.source === 'SCANNED' || pod.status === 'SCANNED',
      }));
      
      setPods(transformedData);
      setRowCount(total);
      setTotalPages(pages);
    } catch (err) {
      console.error('Error loading PODs:', err);
      setError('Failed to load PODs');
    } finally {
      setLoading(false);
    }
  }, [paginationModel.page, paginationModel.pageSize, filterStatus, debouncedSearchTerm]);

  // Load scanning stats
  const loadScanningStats = useCallback(async () => {
    try {
      const stats = await podService.getPodStatistics('today');
      setScanningStats({
        scannedToday: stats.scannedToday || 0,
        pendingDebrief: stats.pendingDebrief || 0,
      });
    } catch (err) {
      console.error('Error loading scanning stats:', err);
    }
  }, []);

  useEffect(() => {
    loadPods();
    loadScanningStats();
  }, [loadPods, loadScanningStats]);

  // ============================================================
  // HANDLERS
  // ============================================================
  const handleDeleteClick = (id) => {
    setDeleteId(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await podService.deletePod(deleteId);
      setDeleteDialogOpen(false);
      setDeleteId(null);
      setSuccessMessage('POD deleted successfully');
      loadPods();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError('Failed to delete POD');
      setTimeout(() => setError(null), 3000);
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setDeleteId(null);
  };

  const handleEditClick = (podId) => {
    navigate(`/pods/${podId}/edit`);
  };

  const handleViewClick = (podId) => {
    navigate(`/pods/${podId}`);
  };

  const handleDebriefClick = (podId) => {
    navigate(`/pods/${podId}/debrief`);
  };

  const handlePaginationModelChange = (newModel) => {
    setPaginationModel(newModel);
  };

  const handleRefresh = () => {
    setPaginationModel(prev => ({ ...prev, page: 0 }));
    loadPods();
    loadScanningStats();
  };

  const handleExport = async () => {
    try {
      const baseUrl = process.env.REACT_APP_API_URL || 'https://sallara-trailers-be-UAT.onrender.com/api';
      const timestamp = new Date().getTime();
      const exportUrl = `${baseUrl}/pods/export?format=csv&_t=${timestamp}`;
      window.open(exportUrl, '_blank');
    } catch (error) {
      console.error('Error exporting PODs:', error);
      setError('Failed to export PODs. Please try again.');
    }
  };

  // ============================================================
  // COLUMNS
  // ============================================================
  const getStatusChip = (status) => {
  const config = POD_STATUSES.find(s => s.code === status);
  
  if (config) {
    return (
      <Chip
        size="small"
        label={config.displayName}
        color={config.color}
        sx={{
          fontWeight: 500,
          fontSize: { xs: '0.5rem', sm: '0.65rem' },
          height: { xs: 16, sm: 20 },
          bgcolor: config.color ? `${config.color}20` : undefined,
          '& .MuiChip-label': { px: { xs: 0.5, sm: 1 }, py: 0.25 },
        }}
      />
    );
  }
  
  // Fallback
  return (
    <Chip
      size="small"
      label={status || 'Unknown'}
      color="default"
      sx={{
        fontWeight: 500,
        fontSize: { xs: '0.5rem', sm: '0.65rem' },
        height: { xs: 16, sm: 20 },
      }}
    />
  );
};

  const getDocumentIcon = (type) => {
    const icons = {
      PDF: <PdfIcon sx={{ fontSize: { xs: '0.6rem', sm: '0.8rem' } }} />,
      IMAGE: <ImageIcon sx={{ fontSize: { xs: '0.6rem', sm: '0.8rem' } }} />,
      JPG: <ImageIcon sx={{ fontSize: { xs: '0.6rem', sm: '0.8rem' } }} />,
      PNG: <ImageIcon sx={{ fontSize: { xs: '0.6rem', sm: '0.8rem' } }} />,
      DOC: <DescriptionIcon sx={{ fontSize: { xs: '0.6rem', sm: '0.8rem' } }} />,
      DOCX: <DescriptionIcon sx={{ fontSize: { xs: '0.6rem', sm: '0.8rem' } }} />,
    };
    return icons[type] || <ReceiptIcon sx={{ fontSize: { xs: '0.6rem', sm: '0.8rem' } }} />;
  };

  const columns = useMemo(() => [
    {
      field: 'podNumber',
      headerName: 'POD #',
      width: isMobile ? 90 : 140,
      headerClassName: 'pod-header',
      renderCell: (params) => (
        <Typography 
          variant="body2" 
          fontWeight={600} 
          color="primary" 
          sx={{ fontSize: { xs: '0.6rem', sm: '0.75rem' } }}
        >
          {params.value || 'N/A'}
        </Typography>
      ),
    },
    {
      field: 'tripNumber',
      headerName: 'Trip',
      width: isMobile ? 80 : 120,
      headerClassName: 'pod-header',
      renderCell: (params) => (
        <Chip
          label={`#${params.value}`}
          size="small"
          variant="outlined"
          sx={{ 
            fontSize: { xs: '0.5rem', sm: '0.6rem' }, 
            height: { xs: 16, sm: 18 } 
          }}
        />
      ),
    },
    {
      field: 'customerName',
      headerName: 'Customer',
      flex: 1,
      minWidth: isMobile ? 80 : 120,
      headerClassName: 'pod-header',
      renderCell: (params) => (
        <Typography 
          variant="body2" 
          sx={{ 
            fontSize: { xs: '0.6rem', sm: '0.75rem' },
            fontWeight: 500,
          }}
        >
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'deliveryDate',
      headerName: 'Date',
      width: isMobile ? 80 : 110,
      headerClassName: 'pod-header',
      renderCell: (params) => (
        <Typography 
          variant="body2" 
          sx={{ fontSize: { xs: '0.55rem', sm: '0.7rem' } }}
        >
          {params.value ? new Date(params.value).toLocaleDateString() : 'N/A'}
        </Typography>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: isMobile ? 90 : 120,
      headerClassName: 'pod-header',
      renderCell: (params) => getStatusChip(params.value),
    },
    {
      field: 'source',
      headerName: 'Source',
      width: isMobile ? 70 : 90,
      headerClassName: 'pod-header',
      renderCell: (params) => (
        <Chip
          size="small"
          label={params.value === 'SCANNED' ? '📸' : '📤'}
          variant="outlined"
          sx={{ 
            fontSize: { xs: '0.5rem', sm: '0.55rem' }, 
            height: { xs: 16, sm: 18 },
            borderColor: params.value === 'SCANNED' ? '#1976d2' : '#2e7d32',
            color: params.value === 'SCANNED' ? '#1976d2' : '#2e7d32',
          }}
        />
      ),
    },
    {
      field: 'documentType',
      headerName: 'Doc',
      width: isMobile ? 60 : 90,
      headerClassName: 'pod-header',
      renderCell: (params) => (
        <Chip
          size="small"
          icon={getDocumentIcon(params.value)}
          label={isMobile ? '' : (params.value || 'N/A')}
          variant="outlined"
          sx={{ 
            fontSize: { xs: '0.5rem', sm: '0.55rem' }, 
            height: { xs: 16, sm: 18 },
            '& .MuiChip-icon': { fontSize: { xs: '0.5rem', sm: '0.6rem' } }
          }}
        />
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: isMobile ? 100 : 160,
      sortable: false,
      filterable: false,
      headerClassName: 'pod-header',
      renderCell: (params) => (
        <Stack direction="row" spacing={0.25}>
          <Tooltip title="View">
            <IconButton
              size="small"
              color="primary"
              onClick={() => handleViewClick(params.row.id)}
              sx={{ p: { xs: 0.25, sm: 0.5 } }}
            >
              <ViewIcon sx={{ fontSize: { xs: '0.7rem', sm: '0.9rem' } }} />
            </IconButton>
          </Tooltip>
          {params.row.needsDebrief && (
            <Tooltip title="Debrief">
              <IconButton
                size="small"
                color="success"
                onClick={() => handleDebriefClick(params.row.id)}
                sx={{ p: { xs: 0.25, sm: 0.5 } }}
              >
                <AssignmentIcon sx={{ fontSize: { xs: '0.7rem', sm: '0.9rem' } }} />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="Edit">
            <IconButton
              size="small"
              color="secondary"
              onClick={() => handleEditClick(params.row.id)}
              sx={{ p: { xs: 0.25, sm: 0.5 } }}
            >
              <EditIcon sx={{ fontSize: { xs: '0.7rem', sm: '0.9rem' } }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton
              size="small"
              color="error"
              onClick={() => handleDeleteClick(params.row.id)}
              sx={{ p: { xs: 0.25, sm: 0.5 } }}
            >
              <DeleteIcon sx={{ fontSize: { xs: '0.7rem', sm: '0.9rem' } }} />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ], [isMobile]);

  // ============================================================
  // STATS
  // ============================================================
  const stats = useMemo(() => ({
    total: rowCount,
    scanned: pods.filter(p => p.source === 'SCANNED').length,
    pending: pods.filter(p => p.status === 'PENDING' || p.status === 'SCANNED').length,
    delivered: pods.filter(p => p.status === 'DELIVERED').length,
    verified: pods.filter(p => p.status === 'VERIFIED').length,
    rejected: pods.filter(p => p.status === 'REJECTED').length,
  }), [pods, rowCount]);

  // ============================================================
  // RENDER
  // ============================================================
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
            Proof of Delivery
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
            Manage proof of delivery documents
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            startIcon={<ScanIcon sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' } }} />}
            onClick={() => navigate('/pods/scan')}
            size="small"
            sx={{
              borderRadius: '10px',
              fontSize: { xs: '0.7rem', sm: '0.75rem' },
              textTransform: 'none',
              py: { xs: 0.5, sm: 0.75 },
              px: { xs: 1.5, sm: 2 },
              bgcolor: '#1976d2',
              '&:hover': { bgcolor: '#1565c0' }
            }}
          >
            {isMobile ? 'Scan' : 'Scan POD'}
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' } }} />}
            onClick={() => navigate('/pods/new')}
            size="small"
            sx={{
              borderRadius: '10px',
              fontSize: { xs: '0.7rem', sm: '0.75rem' },
              textTransform: 'none',
              py: { xs: 0.5, sm: 0.75 },
              px: { xs: 1.5, sm: 2 },
            }}
          >
            {isMobile ? 'Upload' : 'Upload POD'}
          </Button>
        </Stack>
      </Stack>

      {/* Alerts */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 2, borderRadius: '12px', fontSize: { xs: '0.7rem', sm: '0.8rem' } }} 
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}
      {successMessage && (
        <Alert 
          severity="success" 
          sx={{ mb: 2, borderRadius: '12px', fontSize: { xs: '0.7rem', sm: '0.8rem' } }} 
          onClose={() => setSuccessMessage('')}
        >
          {successMessage}
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid 
        container 
        spacing={{ xs: 1.5, sm: 2, md: 2.5 }}
        sx={{ mb: { xs: 2, sm: 2.5, md: 3 } }}
      >
        <Grid size={{ xs: 6, sm: 4, md: 2.4 }}>
          <StatCard
            title="Total"
            value={stats.total}
            icon={ReceiptIcon}
            color="primary"
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 2.4 }}>
          <StatCard
            title="Scanned"
            value={stats.scanned}
            icon={ScanIcon}
            color="info"
            badge={scanningStats.scannedToday > 0 ? scanningStats.scannedToday : null}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 2.4 }}>
          <StatCard
            title="Pending"
            value={stats.pending}
            icon={PendingIcon}
            color="warning"
            badge={scanningStats.pendingDebrief > 0 ? scanningStats.pendingDebrief : null}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 2.4 }}>
          <StatCard
            title="Delivered"
            value={stats.delivered}
            icon={CheckCircleIcon}
            color="success"
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 2.4 }}>
          <StatCard
            title="Rejected"
            value={stats.rejected}
            icon={CancelIcon}
            color="error"
          />
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 1.5, sm: 2 },
          mb: 2,
          borderRadius: { xs: '12px', sm: '16px' },
          border: '1px solid #ECECEC',
          bgcolor: '#FFFFFF',
          width: '100%',
        }}
      >
        <Stack 
          direction={{ xs: 'column', sm: 'row' }} 
          spacing={{ xs: 1, sm: 1.5 }}
        >
          <TextField
            placeholder="Search PODs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="small"
            sx={{ 
              flex: 1,
              '& .MuiInputLabel-root': { fontSize: { xs: '0.65rem', sm: '0.75rem' } },
              '& .MuiInputBase-root': { fontSize: { xs: '0.7rem', sm: '0.75rem' } },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' } }} />
                </InputAdornment>
              ),
            }}
          />
          <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 130 } }}>
            <InputLabel sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
              Status
            </InputLabel>
            <Select
              value={filterStatus}
              label="Status"
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setPaginationModel(prev => ({ ...prev, page: 0 }));
              }}
              sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
            >
              <MenuItem value="ALL" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                All Status
              </MenuItem>
              {POD_STATUS_OPTIONS.map(option => (
                <MenuItem key={option.value} value={option.value} sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 130 } }}>
            <InputLabel sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
              Type
            </InputLabel>
            <Select
              value={filterType}
              label="Type"
              onChange={(e) => {
                setFilterType(e.target.value);
                setPaginationModel(prev => ({ ...prev, page: 0 }));
              }}
              sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
            >
              <MenuItem value="ALL" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                All Types
              </MenuItem>
              <MenuItem value="SCANNED" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                📸 Scanned
              </MenuItem>
              <MenuItem value="UPLOADED" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                📤 Uploaded
              </MenuItem>
            </Select>
          </FormControl>
          <Stack direction="row" spacing={1}>
            <Button 
              variant="outlined" 
              startIcon={<RefreshIcon sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' } }} />} 
              onClick={handleRefresh}
              size="small"
              sx={{
                borderRadius: '10px',
                fontSize: { xs: '0.7rem', sm: '0.75rem' },
                textTransform: 'none',
                py: { xs: 0.5, sm: 0.75 },
                px: { xs: 1, sm: 2 },
              }}
            >
              {isMobile ? '' : 'Refresh'}
            </Button>
            <Button 
              variant="outlined" 
              startIcon={<ExportIcon sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' } }} />}
              onClick={handleExport}
              size="small"
              sx={{
                borderRadius: '10px',
                fontSize: { xs: '0.7rem', sm: '0.75rem' },
                textTransform: 'none',
                py: { xs: 0.5, sm: 0.75 },
                px: { xs: 1, sm: 2 },
              }}
            >
              {isMobile ? '' : 'Export'}
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {/* Data Grid */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: { xs: '12px', sm: '16px' },
          border: '1px solid #ECECEC',
          bgcolor: '#FFFFFF',
          width: '100%',
          overflow: 'hidden',
        }}
      >
        <DataGrid
          rows={pods}
          columns={columns}
          pagination
          paginationMode="server"
          rowCount={rowCount}
          paginationModel={paginationModel}
          onPaginationModelChange={handlePaginationModelChange}
          pageSizeOptions={[5, 10, 20, 50, 100]}
          checkboxSelection={false}
          disableRowSelectionOnClick
          getRowId={(row) => row.id}
          density="compact"
          loading={loading}
          sx={{
            height: { xs: 350, sm: 400, md: 450, lg: 500 },
            border: 'none',
            fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem' },
            '& .MuiDataGrid-cell': {
              borderRight: '1px solid #f0f0f0',
              display: 'flex',
              alignItems: 'center',
              padding: { xs: '0 4px', sm: '0 8px' },
              fontSize: { xs: '0.6rem', sm: '0.7rem', md: '0.75rem' },
            },
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: '#f8f9fa',
              borderBottom: '2px solid #e0e0e0',
              minHeight: { xs: '32px !important', sm: '36px !important' },
            },
            '& .pod-header': {
              fontSize: { xs: '0.55rem', sm: '0.6rem', md: '0.65rem' },
              fontWeight: 600,
              color: '#333',
            },
            '& .MuiDataGrid-row:hover': {
              backgroundColor: '#f5f5f5',
            },
            '& .MuiDataGrid-cell:focus': {
              outline: 'none',
            },
            '& .MuiDataGrid-columnHeader:focus': {
              outline: 'none',
            },
            '& .MuiDataGrid-columnHeaderTitle': {
              fontWeight: 600,
              color: '#333',
              fontSize: { xs: '0.55rem', sm: '0.6rem', md: '0.65rem' },
              textTransform: 'uppercase',
              letterSpacing: '0.3px',
            },
            '& .MuiDataGrid-virtualScroller': {
              '& .MuiDataGrid-row': {
                minHeight: { xs: '32px !important', sm: '36px !important' },
              },
            },
            '& .MuiDataGrid-footerContainer': {
              minHeight: { xs: '40px', sm: '52px' },
              borderTop: '1px solid #e0e0e0',
            },
            '& .MuiTablePagination-root': {
              fontSize: { xs: '0.65rem', sm: '0.75rem' },
            },
            '& .MuiTablePagination-select': {
              fontSize: { xs: '0.65rem', sm: '0.75rem' },
            },
            '& .MuiTablePagination-displayedRows': {
              fontSize: { xs: '0.65rem', sm: '0.75rem' },
            },
          }}
        />
      </Paper>

      {/* Footer */}
      <Box sx={{ 
        mt: { xs: 1, sm: 2 },
        pt: { xs: 1, sm: 1.5 }, 
        borderTop: '1px solid #ECECEC',
        width: '100%',
      }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          spacing={{ xs: 0.5, sm: 0 }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography 
              variant="caption" 
              sx={{ 
                fontSize: { xs: '0.5rem', sm: '0.6rem' }, 
                color: '#6B7280' 
              }}
            >
              Showing {pods.length} of {rowCount} PODs
            </Typography>
            {scanningStats.scannedToday > 0 && (
              <Chip 
                size="small" 
                label={`📸 ${scanningStats.scannedToday} scanned today`}
                sx={{ 
                  fontSize: { xs: '0.45rem', sm: '0.55rem' }, 
                  height: { xs: 14, sm: 18 } 
                }}
                color="info"
              />
            )}
            {scanningStats.pendingDebrief > 0 && (
              <Chip 
                size="small" 
                label={`⏳ ${scanningStats.pendingDebrief} pending`}
                sx={{ 
                  fontSize: { xs: '0.45rem', sm: '0.55rem' }, 
                  height: { xs: 14, sm: 18 } 
                }}
                color="warning"
              />
            )}
          </Stack>
          <Typography 
            variant="caption" 
            sx={{ 
              fontSize: { xs: '0.5rem', sm: '0.6rem' }, 
              color: '#6B7280' 
            }}
          >
            Page {paginationModel.page + 1} of {totalPages || 1}
          </Typography>
        </Stack>
      </Box>

      {/* Delete Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
          <DeleteIcon sx={{ verticalAlign: 'middle', mr: 1, color: 'error.main' }} />
          Delete POD
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' } }}>
            Are you sure you want to delete this POD? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={handleDeleteCancel} 
            size="small" 
            sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem' } }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            variant="contained"
            color="error"
            disabled={deleting}
            size="small"
            sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem' } }}
          >
            {deleting ? <CircularProgress size={18} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </ResponsiveContainer>
  );
};

export default PODList;
