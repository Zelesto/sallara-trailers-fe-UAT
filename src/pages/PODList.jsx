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

  useEffect(() => {
    loadPods();
    loadScanningStats();
  }, []);

  const loadPods = async () => {
    setLoading(true);
    try {
      const response = await podService.getAllPods();
      const data = Array.isArray(response) ? response : (response?.content || []);
      
      // Transform data to handle both tripId and tripNumber
      const transformedData = data.map(pod => ({
        ...pod,
        tripNumber: pod.tripNumber || pod.trip?.tripNumber || pod.tripId || 'N/A',
        tripId: pod.tripId || pod.trip?.id || null,
        customerName: pod.customerName || pod.customer?.name || 'N/A',
        // Add debrief status flag
        needsDebrief: pod.status === 'PENDING' || pod.status === 'SCANNED',
        isScanned: pod.source === 'SCANNED' || pod.status === 'SCANNED',
      }));
      
      setPods(transformedData);
      setError(null);
    } catch (err) {
      setError('Failed to load PODs');
      console.error('Error loading PODs:', err);
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

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this POD?')) return;
    try {
      await podService.deletePod(id);
      setSuccessMessage('POD deleted successfully');
      loadPods();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError('Failed to delete POD');
      setTimeout(() => setError(null), 3000);
    }
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
              onClick={() => navigate(`/pods/${params.row.id}`)}
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
                onClick={() => navigate(`/pods/${params.row.id}/debrief`)}
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
              onClick={() => navigate(`/pods/${params.row.id}/edit`)}
              sx={{ p: 0.5 }}
            >
              <EditIcon sx={{ fontSize: '0.9rem' }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton
              size="small"
              color="error"
              onClick={() => handleDelete(params.row.id)}
              sx={{ p: 0.5 }}
            >
              <DeleteIcon sx={{ fontSize: '0.9rem' }} />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  // Filter PODs
  const filteredPods = pods.filter(pod => {
    const searchMatch = 
      (pod.podNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (pod.customerName || pod.customer?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (pod.tripNumber || pod.trip?.tripNumber || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const statusMatch = filterStatus === 'ALL' || pod.status === filterStatus;
    
    const typeMatch = filterType === 'ALL' || 
      (filterType === 'SCANNED' && pod.source === 'SCANNED') ||
      (filterType === 'UPLOADED' && pod.source !== 'SCANNED');
    
    return searchMatch && statusMatch && typeMatch;
  });

  const stats = {
    total: pods.length,
    scanned: pods.filter(p => p.source === 'SCANNED').length,
    pending: pods.filter(p => p.status === 'PENDING' || p.status === 'SCANNED').length,
    delivered: pods.filter(p => p.status === 'DELIVERED').length,
    verified: pods.filter(p => p.status === 'VERIFIED').length,
    rejected: pods.filter(p => p.status === 'REJECTED').length,
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 1.5, md: 2 } }}>
      {/* Header - Compact */}
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

      {/* Stats Cards - Compact */}
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

      {/* Filters - Compact */}
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
              onClick={loadPods}
              size="small"
              sx={{ fontSize: '0.75rem', py: 0.5 }}
            >
              Refresh
            </Button>
            <Button 
              variant="outlined" 
              startIcon={<ExportIcon sx={{ fontSize: '0.9rem' }} />}
              size="small"
              sx={{ fontSize: '0.75rem', py: 0.5 }}
            >
              Export
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {/* Data Grid - Compact */}
      <Paper sx={{ height: 450, width: '100%', borderRadius: 1 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress size={30} />
            <Typography sx={{ ml: 2, fontSize: '0.8rem' }}>Loading PODs...</Typography>
          </Box>
        ) : (
          <DataGrid
            rows={filteredPods}
            columns={columns}
            pageSize={10}
            rowsPerPageOptions={[5, 10, 25, 50]}
            checkboxSelection={false}
            disableRowSelectionOnClick
            getRowId={(row) => row.id}
            density="compact"
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
            }}
          />
        )}
      </Paper>

      {/* Footer - Compact */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1.5 }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
          Showing {filteredPods.length} of {pods.length} PODs
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
          Last updated: {new Date().toLocaleString()}
        </Typography>
      </Box>
    </Box>
  );
};

export default PODList;
