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
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import { podService } from '../services/podService';

// Compact Stat Card Component
const StatCard = ({ title, value, color = 'primary', icon: Icon }) => (
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
          <Box sx={{ 
            bgcolor: 'rgba(255,255,255,0.15)', 
            borderRadius: 1,
            p: 0.5,
            display: 'flex'
          }}>
            <Icon sx={{ fontSize: '1.1rem' }} />
          </Box>
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
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    loadPods();
  }, []);

  const loadPods = async () => {
    setLoading(true);
    try {
      const response = await podService.getAllPods();
      const data = Array.isArray(response) ? response : (response?.content || []);
      
      // Transform data to handle both tripId and tripNumber
      const transformedData = data.map(pod => ({
        ...pod,
        // If tripNumber doesn't exist, try to get it from trip object or use tripId as fallback
        tripNumber: pod.tripNumber || pod.trip?.tripNumber || pod.tripId || 'N/A',
        // Keep tripId for reference
        tripId: pod.tripId || pod.trip?.id || null,
        // Ensure customerName exists
        customerName: pod.customerName || pod.customer?.name || 'N/A',
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
      PENDING: { color: 'warning', label: 'Pending' },
      DELIVERED: { color: 'success', label: 'Delivered' },
      VERIFIED: { color: 'info', label: 'Verified' },
      REJECTED: { color: 'error', label: 'Rejected' },
      CANCELLED: { color: 'default', label: 'Cancelled' },
    };
    const info = statusMap[status] || { color: 'default', label: status || 'Unknown' };
    return (
      <Chip
        size="small"
        label={info.label}
        color={info.color}
        sx={{ 
          fontWeight: 500,
          fontSize: '0.65rem',
          height: 20,
          '& .MuiChip-label': { px: 1, py: 0.25 }
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
      width: 100,
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
      width: 110,
      headerClassName: 'pod-header',
      renderCell: (params) => getStatusChip(params.value),
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
      width: 120,
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
    return searchMatch && statusMatch;
  });

  const stats = {
    total: pods.length,
    pending: pods.filter(p => p.status === 'PENDING').length,
    delivered: pods.filter(p => p.status === 'DELIVERED').length,
    verified: pods.filter(p => p.status === 'VERIFIED').length,
    rejected: pods.filter(p => p.status === 'REJECTED').length,
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 1.5, md: 2 } }}>
      {/* Header - Compact */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Typography variant="h6" fontWeight="600" sx={{ fontSize: '1rem' }}>
            Proof of Delivery (POD)
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
            Manage proof of delivery documents
          </Typography>
        </Box>
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
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2, fontSize: '0.8rem' }} onClose={() => setError(null)}>{error}</Alert>}
      {successMessage && <Alert severity="success" sx={{ mb: 2, fontSize: '0.8rem' }} onClose={() => setSuccessMessage('')}>{successMessage}</Alert>}

      {/* Stats Cards - Compact */}
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid item xs={6} sm={4} md={2.4}>
          <StatCard title="Total" value={stats.total} color="primary" icon={ReceiptIcon} />
        </Grid>
        <Grid item xs={6} sm={4} md={2.4}>
          <StatCard title="Pending" value={stats.pending} color="warning" icon={ReceiptIcon} />
        </Grid>
        <Grid item xs={6} sm={4} md={2.4}>
          <StatCard title="Delivered" value={stats.delivered} color="success" icon={ReceiptIcon} />
        </Grid>
        <Grid item xs={6} sm={4} md={2.4}>
          <StatCard title="Verified" value={stats.verified} color="info" icon={ReceiptIcon} />
        </Grid>
        <Grid item xs={6} sm={4} md={2.4}>
          <StatCard title="Rejected" value={stats.rejected} color="error" icon={ReceiptIcon} />
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
              <MenuItem value="PENDING" sx={{ fontSize: '0.75rem' }}>Pending</MenuItem>
              <MenuItem value="DELIVERED" sx={{ fontSize: '0.75rem' }}>Delivered</MenuItem>
              <MenuItem value="VERIFIED" sx={{ fontSize: '0.75rem' }}>Verified</MenuItem>
              <MenuItem value="REJECTED" sx={{ fontSize: '0.75rem' }}>Rejected</MenuItem>
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
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
          Last updated: {new Date().toLocaleString()}
        </Typography>
      </Box>
    </Box>
  );
};

export default PODList;
