// src/pages/PODList.jsx
import React, { useState, useEffect } from 'react';
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
  Card,
  CardContent,
  Alert,
  CircularProgress,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Badge,
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
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
import { DataGrid, gridPageSelector, gridPageCountSelector } from '@mui/x-data-grid';
import { podService } from '../services/podService';

// Compact Stat Card Component
const StatCard = ({ title, value, color = 'primary', icon: Icon, badge = null }) => (
  <Card sx={{ 
    bgcolor: `${color}.main`, 
    color: 'white',
    height: '100%',
    transition: 'transform 0.2s ease',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: 4
    }
  }}>
    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography sx={{ 
            color: 'rgba(255,255,255,0.8)', 
            fontSize: '0.65rem',
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            {title}
          </Typography>
          <Typography variant="h5" fontWeight="bold" sx={{ fontSize: '1.1rem', mt: 0.25 }}>
            {value}
          </Typography>
        </Box>
        {Icon && (
          <Badge badgeContent={badge} color="error" sx={{ '& .MuiBadge-badge': { fontSize: '0.6rem', height: 16, minWidth: 16 } }}>
            <Box sx={{ 
              bgcolor: 'rgba(255,255,255,0.15)', 
              borderRadius: 1,
              p: 0.5,
              display: 'flex'
            }}>
              <Icon sx={{ fontSize: '1.1rem' }} />
            </Box>
          </Badge>
        )}
      </Stack>
    </CardContent>
  </Card>
);

const PODList = () => {
  const navigate = useNavigate();
  const [pods, setPods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterType, setFilterType] = useState('ALL');
  const [successMessage, setSuccessMessage] = useState('');
  const [scanningStats, setScanningStats] = useState({
    scannedToday: 0,
    pendingDebrief: 0,
  });
  
  // Pagination state
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Delete Dialog State
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

  // Load data when dependencies change
  useEffect(() => {
    console.log('🔄 useEffect triggered with:', { page, pageSize, filterStatus, filterType, debouncedSearchTerm });
    loadPods();
    loadScanningStats();
  }, [page, pageSize, filterStatus, filterType, debouncedSearchTerm]);

  const loadPods = async () => {
    setLoading(true);
    try {
      const params = {
        page: page,
        size: pageSize,
        sort: 'createdAt,desc',
      };
      
      if (filterStatus !== 'ALL') {
        params.status = filterStatus;
      }
      
      if (debouncedSearchTerm) {
        params.search = debouncedSearchTerm;
      }

      console.log('📊 Fetching PODs with params:', params);
      
      const response = await podService.getAllPods(params);
      
      console.log('📊 Response received:', response);
      
      // The response is already in the correct format from your logs
      // { content: Array(20), totalElements: 78, totalPages: 4, ... }
      const data = response?.content || [];
      const total = response?.totalElements || 0;
      const pages = response?.totalPages || 0;
      
      const transformedData = (Array.isArray(data) ? data : []).map(pod => ({
        ...pod,
        tripNumber: pod.tripNumber || pod.trip?.tripNumber || pod.tripId || 'N/A',
        tripId: pod.tripId || pod.trip?.id || null,
        customerName: pod.customerName || pod.customer?.name || 'N/A',
        needsDebrief: pod.status === 'PENDING' || pod.status === 'SCANNED',
        isScanned: pod.source === 'SCANNED' || pod.status === 'SCANNED',
      }));
      
      console.log(`📊 Set ${transformedData.length} PODs, total: ${total}, pages: ${pages}, current page: ${page}`);
      
      setPods(transformedData);
      setTotalElements(total);
      setTotalPages(pages);
      setError(null);
    } catch (err) {
      setError('Failed to load PODs: ' + (err.message || 'Unknown error'));
      console.error('Error loading PODs:', err);
      setPods([]);
      setTotalElements(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  };

  const loadScanningStats = async () => {
    try {
      const stats = await podService.getPodStatistics('today');
      setScanningStats({
        scannedToday: stats.scannedToday || 0,
        pendingDebrief: stats.pendingDebrief || 0,
      });
    } catch (err) {
      console.error('Error loading scanning stats:', err);
    }
  };

  // Delete functions
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

  // Navigation functions
  const handleEditClick = (podId) => {
    console.log('📝 Editing POD ID:', podId);
    navigate(`/pods/${podId}/edit`);
  };

  const handleViewClick = (podId) => {
    console.log('👁️ Viewing POD ID:', podId);
    navigate(`/pods/${podId}`);
  };

  const handleDebriefClick = (podId) => {
    console.log('📋 Debriefing POD ID:', podId);
    navigate(`/pods/${podId}/debrief`);
  };

  // ============================================================
  // FIX: Proper pagination handlers for DataGrid
  // ============================================================
  const handlePageChange = (newPage) => {
    console.log('📄 DataGrid page change requested:', newPage);
    setPage(newPage);
  };

  const handlePageSizeChange = (newPageSize) => {
    console.log('📄 DataGrid page size change requested:', newPageSize);
    setPageSize(newPageSize);
    setPage(0); // Reset to first page when changing page size
  };

  const getStatusChip = (status) => {
    const statusMap = {
      SCANNED: { color: 'info', label: 'Scanned', icon: <ScanIcon sx={{ fontSize: '0.7rem' }} /> },
      PENDING: { color: 'warning', label: 'Pending', icon: <PendingIcon sx={{ fontSize: '0.7rem' }} /> },
      DELIVERED: { color: 'success', label: 'Delivered', icon: <CheckCircleIcon sx={{ fontSize: '0.7rem' }} /> },
      VERIFIED: { color: 'info', label: 'Verified', icon: <VerifiedIcon sx={{ fontSize: '0.7rem' }} /> },
      REJECTED: { color: 'error', label: 'Rejected', icon: <CancelIcon sx={{ fontSize: '0.7rem' }} /> },
      CANCELLED: { color: 'default', label: 'Cancelled', icon: <CancelIcon sx={{ fontSize: '0.7rem' }} /> },
    };
    const info = statusMap[status] || { color: 'default', label: status || 'Unknown', icon: null };
    return (
      <Chip
        size="small"
        label={info.label}
        color={info.color}
        icon={info.icon}
        sx={{ 
          fontWeight: 500,
          fontSize: '0.65rem',
          height: 20,
          '& .MuiChip-label': { px: 1, py: 0.25 },
          '& .MuiChip-icon': { fontSize: '0.7rem', ml: 0.5 }
        }}
      />
    );
  };

  const getDocumentIcon = (type) => {
    const icons = {
      PDF: <PdfIcon sx={{ fontSize: '0.8rem' }} />,
      IMAGE: <ImageIcon sx={{ fontSize: '0.8rem' }} />,
      JPG: <ImageIcon sx={{ fontSize: '0.8rem' }} />,
      PNG: <ImageIcon sx={{ fontSize: '0.8rem' }} />,
      DOC: <DescriptionIcon sx={{ fontSize: '0.8rem' }} />,
      DOCX: <DescriptionIcon sx={{ fontSize: '0.8rem' }} />,
    };
    return icons[type] || <ReceiptIcon sx={{ fontSize: '0.8rem' }} />;
  };

  const columns = [
    {
      field: 'podNumber',
      headerName: 'POD Number',
      width: 140,
      headerClassName: 'pod-header',
      renderCell: (params) => (
        <Typography variant="body2" fontWeight={600} color="primary" sx={{ fontSize: '0.75rem' }}>
          {params.value || 'N/A'}
        </Typography>
      ),
    },
    {
      field: 'tripNumber',
      headerName: 'Trip',
      width: 140,
      headerClassName: 'pod-header',
      renderCell: (params) => {
        const tripValue = params.value || params.row.tripNumber || params.row.trip?.tripNumber || 'N/A';
        return (
          <Chip
            label={`#${tripValue}`}
            size="small"
            variant="outlined"
            sx={{ fontSize: '0.6rem', height: 18 }}
          />
        );
      },
    },
    {
      field: 'customerName',
      headerName: 'Customer',
      flex: 1,
      minWidth: 120,
      headerClassName: 'pod-header',
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
          {params.value || params.row.customer?.name || 'N/A'}
        </Typography>
      ),
    },
    {
      field: 'deliveryDate',
      headerName: 'Delivery Date',
      width: 110,
      headerClassName: 'pod-header',
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>
          {params.value ? new Date(params.value).toLocaleDateString() : 'N/A'}
        </Typography>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      headerClassName: 'pod-header',
      renderCell: (params) => getStatusChip(params.value),
    },
    {
      field: 'source',
      headerName: 'Source',
      width: 90,
      headerClassName: 'pod-header',
      renderCell: (params) => (
        <Chip
          size="small"
          label={params.value === 'SCANNED' ? '📸 Scan' : '📤 Upload'}
          variant="outlined"
          sx={{ 
            fontSize: '0.55rem', 
            height: 18,
            borderColor: params.value === 'SCANNED' ? '#1976d2' : '#2e7d32',
            color: params.value === 'SCANNED' ? '#1976d2' : '#2e7d32',
          }}
        />
      ),
    },
    {
      field: 'documentType',
      headerName: 'Document',
      width: 100,
      headerClassName: 'pod-header',
      renderCell: (params) => (
        <Chip
          size="small"
          icon={getDocumentIcon(params.value)}
          label={params.value || 'N/A'}
          variant="outlined"
          sx={{ fontSize: '0.55rem', height: 18 }}
        />
      ),
    },
    {
      field: 'uploadedBy',
      headerName: 'Uploaded By',
      width: 120,
      headerClassName: 'pod-header',
      renderCell: (params) => (
        <Box>
          <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>
            {params.value || params.row.uploader?.name || 'N/A'}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.55rem' }}>
            {params.row.uploadedAt ? new Date(params.row.uploadedAt).toLocaleDateString() : ''}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 160,
      sortable: false,
      filterable: false,
      headerClassName: 'pod-header',
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 0.25 }}>
          <Tooltip title="View Details">
            <IconButton
              size="small"
              color="primary"
              onClick={() => handleViewClick(params.row.id)}
              sx={{ p: 0.5 }}
            >
              <ViewIcon sx={{ fontSize: '0.9rem' }} />
            </IconButton>
          </Tooltip>
          {params.row.needsDebrief && (
            <Tooltip title="Debrief">
              <IconButton
                size="small"
                color="success"
                onClick={() => handleDebriefClick(params.row.id)}
                sx={{ p: 0.5 }}
              >
                <AssignmentIcon sx={{ fontSize: '0.9rem' }} />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="Edit">
            <IconButton
              size="small"
              color="secondary"
              onClick={() => handleEditClick(params.row.id)}
              sx={{ p: 0.5 }}
            >
              <EditIcon sx={{ fontSize: '0.9rem' }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton
              size="small"
              color="error"
              onClick={() => handleDeleteClick(params.row.id)}
              sx={{ p: 0.5 }}
            >
              <DeleteIcon sx={{ fontSize: '0.9rem' }} />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  // Stats
  const stats = {
    total: totalElements,
    scanned: pods.filter(p => p.source === 'SCANNED').length,
    pending: pods.filter(p => p.status === 'PENDING' || p.status === 'SCANNED').length,
    delivered: pods.filter(p => p.status === 'DELIVERED').length,
    verified: pods.filter(p => p.status === 'VERIFIED').length,
    rejected: pods.filter(p => p.status === 'REJECTED').length,
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

  return (
    <Box sx={{ p: { xs: 1, sm: 1.5, md: 2 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Box>
          <Typography variant="h6" fontWeight="600" sx={{ fontSize: '1rem' }}>
            Proof of Delivery (POD)
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
            Manage proof of delivery documents from drivers and debrief
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            startIcon={<ScanIcon sx={{ fontSize: '0.9rem' }} />}
            onClick={() => navigate('/pods/scan')}
            size="small"
            sx={{ 
              borderRadius: 1.5,
              fontSize: '0.75rem',
              py: 0.5,
              px: 1.5,
              bgcolor: '#1976d2',
              '&:hover': { bgcolor: '#1565c0' }
            }}
          >
            Scan POD
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon sx={{ fontSize: '0.9rem' }} />}
            onClick={() => navigate('/pods/new')}
            size="small"
            sx={{ 
              borderRadius: 1.5,
              fontSize: '0.75rem',
              py: 0.5,
              px: 1.5
            }}
          >
            Upload POD
          </Button>
        </Stack>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2, fontSize: '0.8rem' }} onClose={() => setError(null)}>{error}</Alert>}
      {successMessage && <Alert severity="success" sx={{ mb: 2, fontSize: '0.8rem' }} onClose={() => setSuccessMessage('')}>{successMessage}</Alert>}

      {/* Stats Cards */}
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid item xs={6} sm={4} md={2.4}>
          <StatCard title="Total" value={stats.total} color="primary" icon={ReceiptIcon} />
        </Grid>
        <Grid item xs={6} sm={4} md={2.4}>
          <StatCard 
            title="Scanned" 
            value={stats.scanned} 
            color="info" 
            icon={ScanIcon}
            badge={scanningStats.scannedToday > 0 ? scanningStats.scannedToday : null}
          />
        </Grid>
        <Grid item xs={6} sm={4} md={2.4}>
          <StatCard 
            title="Pending" 
            value={stats.pending} 
            color="warning" 
            icon={PendingIcon}
            badge={scanningStats.pendingDebrief > 0 ? scanningStats.pendingDebrief : null}
          />
        </Grid>
        <Grid item xs={6} sm={4} md={2.4}>
          <StatCard title="Delivered" value={stats.delivered} color="success" icon={CheckCircleIcon} />
        </Grid>
        <Grid item xs={6} sm={4} md={2.4}>
          <StatCard title="Verified" value={stats.verified} color="info" icon={VerifiedIcon} />
        </Grid>
        <Grid item xs={6} sm={4} md={2.4}>
          <StatCard title="Rejected" value={stats.rejected} color="error" icon={CancelIcon} />
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: 1.5, mb: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <TextField
            placeholder="Search PODs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="small"
            sx={{ 
              flex: 1,
              '& .MuiInputLabel-root': { fontSize: '0.75rem' },
              '& .MuiInputBase-root': { fontSize: '0.8rem' }
            }}
            InputProps={{
              startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: '0.9rem' }} /></InputAdornment>,
            }}
          />
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel sx={{ fontSize: '0.75rem' }}>Status</InputLabel>
            <Select
              value={filterStatus}
              label="Status"
              onChange={(e) => setFilterStatus(e.target.value)}
              sx={{ fontSize: '0.75rem' }}
            >
              <MenuItem value="ALL" sx={{ fontSize: '0.75rem' }}>All Status</MenuItem>
              <MenuItem value="SCANNED" sx={{ fontSize: '0.75rem' }}>Scanned</MenuItem>
              <MenuItem value="PENDING" sx={{ fontSize: '0.75rem' }}>Pending</MenuItem>
              <MenuItem value="DELIVERED" sx={{ fontSize: '0.75rem' }}>Delivered</MenuItem>
              <MenuItem value="VERIFIED" sx={{ fontSize: '0.75rem' }}>Verified</MenuItem>
              <MenuItem value="REJECTED" sx={{ fontSize: '0.75rem' }}>Rejected</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel sx={{ fontSize: '0.75rem' }}>Type</InputLabel>
            <Select
              value={filterType}
              label="Type"
              onChange={(e) => setFilterType(e.target.value)}
              sx={{ fontSize: '0.75rem' }}
            >
              <MenuItem value="ALL" sx={{ fontSize: '0.75rem' }}>All Types</MenuItem>
              <MenuItem value="SCANNED" sx={{ fontSize: '0.75rem' }}>📸 Scanned</MenuItem>
              <MenuItem value="UPLOADED" sx={{ fontSize: '0.75rem' }}>📤 Uploaded</MenuItem>
            </Select>
          </FormControl>
          <Stack direction="row" spacing={0.75}>
            <Button 
              variant="outlined" 
              startIcon={<RefreshIcon sx={{ fontSize: '0.9rem' }} />} 
              onClick={() => {
                setPage(0);
                loadPods();
              }}
              size="small"
              sx={{ fontSize: '0.75rem', py: 0.5 }}
            >
              Refresh
            </Button>
            <Button 
              variant="outlined" 
              startIcon={<ExportIcon sx={{ fontSize: '0.9rem' }} />}
              onClick={handleExport}
              size="small"
              sx={{ fontSize: '0.75rem', py: 0.5 }}
            >
              Export
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {/* Data Grid */}
      <Paper sx={{ height: 450, width: '100%', borderRadius: 1 }}>
        <DataGrid
          rows={pods}
          columns={columns}
          pagination
          paginationMode="server"
          rowCount={totalElements}
          page={page}
          pageSize={pageSize}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          rowsPerPageOptions={[5, 10, 20, 50, 100]}
          checkboxSelection={false}
          disableRowSelectionOnClick
          getRowId={(row) => row.id}
          density="compact"
          loading={loading}
          sx={{
            border: 'none',
            fontSize: '0.75rem',
            '& .MuiDataGrid-cell': {
              borderRight: '1px solid #f0f0f0',
              display: 'flex',
              alignItems: 'center',
              padding: '0 8px',
              fontSize: '0.75rem',
            },
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: '#f8f9fa',
              borderBottom: '2px solid #e0e0e0',
              minHeight: '36px !important',
            },
            '& .pod-header': {
              fontSize: '0.65rem',
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
              fontSize: '0.65rem',
              textTransform: 'uppercase',
              letterSpacing: '0.3px',
            },
            '& .MuiDataGrid-virtualScroller': {
              '& .MuiDataGrid-row': {
                minHeight: '36px !important',
              },
            },
            '& .MuiDataGrid-footerContainer': {
              minHeight: '52px',
              borderTop: '1px solid #e0e0e0',
            },
            '& .MuiTablePagination-root': {
              fontSize: '0.75rem',
            },
            '& .MuiTablePagination-select': {
              fontSize: '0.75rem',
            },
            '& .MuiTablePagination-displayedRows': {
              fontSize: '0.75rem',
            },
          }}
        />
      </Paper>

      {/* Footer with stats */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mt: 1,
        p: 1,
        bgcolor: '#fafafa',
        borderRadius: 1,
        border: '1px solid #e0e0e0'
      }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
          Showing {pods.length} of {totalElements} PODs
          {scanningStats.scannedToday > 0 && (
            <Chip 
              size="small" 
              label={`📸 ${scanningStats.scannedToday} scanned today`}
              sx={{ ml: 1, fontSize: '0.55rem', height: 18 }}
              color="info"
            />
          )}
          {scanningStats.pendingDebrief > 0 && (
            <Chip 
              size="small" 
              label={`⏳ ${scanningStats.pendingDebrief} pending debrief`}
              sx={{ ml: 1, fontSize: '0.55rem', height: 18 }}
              color="warning"
            />
          )}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
          Page {page + 1} of {totalPages || 1}
        </Typography>
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontSize: '1rem' }}>
          <DeleteIcon sx={{ verticalAlign: 'middle', mr: 1, color: 'error.main' }} />
          Delete POD
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: '0.9rem' }}>
            Are you sure you want to delete this POD? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleDeleteCancel} size="small" sx={{ fontSize: '0.8rem' }}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            variant="contained"
            color="error"
            disabled={deleting}
            size="small"
            sx={{ fontSize: '0.8rem' }}
          >
            {deleting ? <CircularProgress size={18} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PODList;
