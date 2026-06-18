// src/pages/pods/PODList.jsx
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
import podService from '../services/podService';
import Breadcrumbs from '../../components/Layout/Breadcrumbs';

const PODList = () => {
  const navigate = useNavigate();
  const [pods, setPods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [successMessage, setSuccessMessage] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    loadPODs();
  }, []);

  const loadPODs = async () => {
    setLoading(true);
    try {
      const response = await podService.getAllPODs();
      setPods(response || []);
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
      await podService.deletePOD(id);
      setSuccessMessage('POD deleted successfully');
      loadPODs();
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
        sx={{ fontWeight: 500 }}
      />
    );
  };

  const getDocumentIcon = (type) => {
    const icons = {
      PDF: <PdfIcon fontSize="small" />,
      IMAGE: <ImageIcon fontSize="small" />,
      JPG: <ImageIcon fontSize="small" />,
      PNG: <ImageIcon fontSize="small" />,
      DOC: <DescriptionIcon fontSize="small" />,
      DOCX: <DescriptionIcon fontSize="small" />,
    };
    return icons[type] || <ReceiptIcon fontSize="small" />;
  };

  const getDocumentColor = (type) => {
    const colors = {
      PDF: 'error',
      IMAGE: 'success',
      JPG: 'success',
      PNG: 'success',
      DOC: 'primary',
      DOCX: 'primary',
    };
    return colors[type] || 'default';
  };

  const columns = [
    {
      field: 'podNumber',
      headerName: 'POD Number',
      width: 160,
      renderCell: (params) => (
        <Typography variant="body2" fontWeight={600} color="primary">
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'tripNumber',
      headerName: 'Trip Number',
      width: 150,
      renderCell: (params) => (
        <Chip
          label={params.value || 'N/A'}
          size="small"
          variant="outlined"
        />
      ),
    },
    {
      field: 'customerName',
      headerName: 'Customer',
      flex: 1,
      minWidth: 150,
      renderCell: (params) => (
        <Typography variant="body2">
          {params.value || 'N/A'}
        </Typography>
      ),
    },
    {
      field: 'deliveryDate',
      headerName: 'Delivery Date',
      width: 130,
      renderCell: (params) => (
        params.value ? new Date(params.value).toLocaleDateString() : 'N/A'
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => getStatusChip(params.value),
    },
    {
      field: 'documentType',
      headerName: 'Document',
      width: 110,
      renderCell: (params) => (
        <Chip
          size="small"
          icon={getDocumentIcon(params.value)}
          label={params.value || 'N/A'}
          variant="outlined"
          color={getDocumentColor(params.value)}
        />
      ),
    },
    {
      field: 'uploadedBy',
      headerName: 'Uploaded By',
      width: 130,
      renderCell: (params) => (
        <Box>
          <Typography variant="body2">{params.value || 'N/A'}</Typography>
          <Typography variant="caption" color="text.secondary">
            {params.row.uploadedAt ? new Date(params.row.uploadedAt).toLocaleDateString() : ''}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 140,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="View Details">
            <IconButton
              size="small"
              color="primary"
              onClick={() => navigate(`/pods/${params.row.id}`)}
              sx={{
                '&:hover': {
                  backgroundColor: 'primary.light',
                  color: 'white',
                }
              }}
            >
              <ViewIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit">
            <IconButton
              size="small"
              color="secondary"
              onClick={() => navigate(`/pods/${params.row.id}/edit`)}
              sx={{
                '&:hover': {
                  backgroundColor: 'secondary.light',
                  color: 'white',
                }
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton
              size="small"
              color="error"
              onClick={() => handleDelete(params.row.id)}
              sx={{
                '&:hover': {
                  backgroundColor: 'error.light',
                  color: 'white',
                }
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  // Filter PODs
  const filteredPODs = pods.filter(pod => {
    const searchMatch = 
      (pod.podNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (pod.tripNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (pod.customerName || '').toLowerCase().includes(searchTerm.toLowerCase());
    const statusMatch = filterStatus === 'ALL' || pod.status === filterStatus;
    return searchMatch && statusMatch;
  });

  // Stats
  const stats = {
    total: pods.length,
    pending: pods.filter(p => p.status === 'PENDING').length,
    delivered: pods.filter(p => p.status === 'DELIVERED').length,
    verified: pods.filter(p => p.status === 'VERIFIED').length,
    rejected: pods.filter(p => p.status === 'REJECTED').length,
  };

  return (
    <Box>
      <Breadcrumbs />
      
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold">
            Proof of Delivery (POD) Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage all proof of delivery documents
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/pods/new')}
          sx={{ 
            borderRadius: 2,
            px: 3,
            py: 1,
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            '&:hover': {
              boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
            }
          }}
        >
          Upload POD
        </Button>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }} 
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}
      {successMessage && (
        <Alert 
          severity="success" 
          sx={{ mb: 3 }} 
          onClose={() => setSuccessMessage('')}
        >
          {successMessage}
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ bgcolor: 'primary.light', color: 'white' }}>
            <CardContent>
              <Typography color="rgba(255,255,255,0.7)" gutterBottom>
                Total PODs
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                {stats.total}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ bgcolor: 'warning.main', color: 'white' }}>
            <CardContent>
              <Typography color="rgba(255,255,255,0.7)" gutterBottom>
                Pending
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                {stats.pending}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ bgcolor: 'success.main', color: 'white' }}>
            <CardContent>
              <Typography color="rgba(255,255,255,0.7)" gutterBottom>
                Delivered
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                {stats.delivered}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ bgcolor: 'info.main', color: 'white' }}>
            <CardContent>
              <Typography color="rgba(255,255,255,0.7)" gutterBottom>
                Verified
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                {stats.verified}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ bgcolor: 'error.main', color: 'white' }}>
            <CardContent>
              <Typography color="rgba(255,255,255,0.7)" gutterBottom>
                Rejected
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                {stats.rejected}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Toolbar */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField
            placeholder="Search PODs by number, trip, or customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="small"
            sx={{ flex: 1 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={filterStatus}
              label="Status"
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <MenuItem value="ALL">All Status</MenuItem>
              <MenuItem value="PENDING">Pending</MenuItem>
              <MenuItem value="DELIVERED">Delivered</MenuItem>
              <MenuItem value="VERIFIED">Verified</MenuItem>
              <MenuItem value="REJECTED">Rejected</MenuItem>
              <MenuItem value="CANCELLED">Cancelled</MenuItem>
            </Select>
          </FormControl>
          <Button 
            variant="outlined" 
            startIcon={<RefreshIcon />} 
            onClick={loadPODs}
            sx={{ whiteSpace: 'nowrap' }}
          >
            Refresh
          </Button>
          <Button 
            variant="outlined" 
            startIcon={<ExportIcon />}
            sx={{ whiteSpace: 'nowrap' }}
          >
            Export
          </Button>
        </Stack>
      </Paper>

      {/* Table */}
      <Paper sx={{ height: 500, width: '100%' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress />
            <Typography sx={{ ml: 2 }}>Loading PODs...</Typography>
          </Box>
        ) : (
          <DataGrid
            rows={filteredPODs}
            columns={columns}
            pageSize={rowsPerPage}
            rowsPerPageOptions={[5, 10, 25, 50]}
            checkboxSelection={false}
            disableRowSelectionOnClick
            getRowId={(row) => row.id}
            onPageChange={(newPage) => setPage(newPage)}
            onPageSizeChange={(newSize) => setRowsPerPage(newSize)}
            sx={{
              border: 'none',
              '& .MuiDataGrid-cell': {
                borderRight: '1px solid #f0f0f0',
                display: 'flex',
                alignItems: 'center',
              },
              '& .MuiDataGrid-columnHeaders': {
                backgroundColor: '#f8f9fa',
                borderBottom: '2px solid #e0e0e0',
              },
              '& .MuiDataGrid-row': {
                '&:hover': {
                  backgroundColor: '#f5f5f5',
                },
                '&.Mui-selected': {
                  backgroundColor: '#e3f2fd',
                  '&:hover': {
                    backgroundColor: '#bbdefb',
                  }
                }
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
                fontSize: '0.875rem',
              },
              '& .MuiDataGrid-cellContent': {
                fontSize: '0.875rem',
              },
            }}
          />
        )}
      </Paper>
    </Box>
  );
};

export default PODList;
