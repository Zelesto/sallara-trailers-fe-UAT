// src/pages/drivers/DriverList.jsx
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
  Phone as PhoneIcon,
  Email as EmailIcon,
  Refresh as RefreshIcon,
  FileDownload as ExportIcon,
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import driverService from '../services/driverService';

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

const DriverList = () => {
  const navigate = useNavigate();
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    loadDrivers();
  }, []);

  const loadDrivers = async () => {
    setLoading(true);
    try {
      const response = await driverService.getAllDrivers();
      setDrivers(response || []);
      setError(null);
    } catch (err) {
      setError('Failed to load drivers');
      console.error('Error loading drivers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this driver?')) return;
    try {
      await driverService.deleteDriver(id);
      setSuccessMessage('Driver deleted successfully');
      loadDrivers();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError('Failed to delete driver');
      setTimeout(() => setError(null), 3000);
    }
  };

  const getStatusChip = (status) => {
    const statusMap = {
      ACTIVE: { color: 'success', label: 'Active' },
      AVAILABLE: { color: 'info', label: 'Available' },
      ON_LEAVE: { color: 'warning', label: 'On Leave' },
      INACTIVE: { color: 'error', label: 'Inactive' },
      SUSPENDED: { color: 'error', label: 'Suspended' },
    };
    const info = statusMap[status] || { color: 'default', label: status || 'Unknown' };
    return (
      <Chip 
        size="small" 
        label={info.label} 
        color={info.color} 
        sx={{ 
          fontWeight: 500,
          fontSize: '0.6rem',
          height: 20
        }} 
      />
    );
  };

  const columns = [
    { 
      field: 'id', 
      headerName: 'ID', 
      flex: 0.5,
      minWidth: 50,
      renderCell: (params) => (
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
          #{params.value}
        </Typography>
      )
    },
    {
      field: 'fullName',
      headerName: 'Driver',
      flex: 1.2,
      minWidth: 150,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              bgcolor: 'primary.main',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.65rem',
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            {params.row.firstName?.charAt(0)}{params.row.lastName?.charAt(0)}
          </Box>
          <Box>
            <Typography variant="body2" fontWeight={500} sx={{ fontSize: '0.75rem' }}>
              {params.row.firstName} {params.row.lastName}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.55rem' }}>
              ID: {params.row.id}
            </Typography>
          </Box>
        </Box>
      ),
      valueGetter: (params) => `${params.row.firstName || ''} ${params.row.lastName || ''}`.trim(),
    },
    {
      field: 'licenseNumber',
      headerName: 'License #',
      flex: 0.7,
      minWidth: 80,
      renderCell: (params) => (
        <Chip
          label={params.value || 'N/A'}
          size="small"
          variant="outlined"
          color="primary"
          sx={{ fontSize: '0.55rem', height: 18 }}
        />
      ),
    },
    {
      field: 'licenseExpiry',
      headerName: 'License Expiry',
      flex: 0.7,
      minWidth: 90,
      renderCell: (params) => {
        if (!params.value) return 'N/A';
        const expiryDate = new Date(params.value);
        const today = new Date();
        const isExpired = expiryDate < today;
        return (
          <Chip
            label={new Date(params.value).toLocaleDateString()}
            size="small"
            color={isExpired ? 'error' : 'success'}
            variant="outlined"
            sx={{ fontSize: '0.55rem', height: 18 }}
          />
        );
      },
    },
    {
      field: 'phoneNumber',
      headerName: 'Phone',
      flex: 0.8,
      minWidth: 100,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <PhoneIcon sx={{ fontSize: '0.8rem', color: 'text.secondary' }} />
          <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>
            {params.value || 'N/A'}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'email',
      headerName: 'Email',
      flex: 1,
      minWidth: 130,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <EmailIcon sx={{ fontSize: '0.8rem', color: 'text.secondary' }} />
          <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>
            {params.value || 'N/A'}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      flex: 0.7,
      minWidth: 80,
      renderCell: (params) => getStatusChip(params.value),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 0.8,
      minWidth: 100,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 0.25 }}>
          <Tooltip title="View Details">
            <IconButton
              size="small"
              color="primary"
              onClick={() => navigate(`/driversManagement/${params.row.id}`)}
              sx={{ p: 0.5 }}
            >
              <ViewIcon sx={{ fontSize: '0.9rem' }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit">
            <IconButton
              size="small"
              color="secondary"
              onClick={() => navigate(`/drivers/${params.row.id}/edit`)}
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

  const filteredDrivers = drivers.filter(driver => {
    const fullName = `${driver.firstName || ''} ${driver.lastName || ''}`.toLowerCase();
    const searchMatch = fullName.includes(searchTerm.toLowerCase()) ||
      (driver.licenseNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (driver.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    const statusMatch = filterStatus === 'ALL' || driver.status === filterStatus;
    return searchMatch && statusMatch;
  });

  const stats = {
    total: drivers.length,
    active: drivers.filter(d => d.status === 'ACTIVE').length,
    available: drivers.filter(d => d.status === 'AVAILABLE').length,
    onLeave: drivers.filter(d => d.status === 'ON_LEAVE').length,
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 1.5, md: 2 } }}>
      {/* Header - Compact */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Typography variant="h6" fontWeight="600" sx={{ fontSize: '1rem' }}>
            Driver Management
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
            Manage fleet drivers
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon sx={{ fontSize: '0.9rem' }} />}
          onClick={() => navigate('/drivers/new')}
          size="small"
          sx={{ 
            borderRadius: 1.5,
            fontSize: '0.75rem',
            py: 0.5,
            px: 1.5
          }}
        >
          Add Driver
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2, fontSize: '0.8rem' }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {successMessage && (
        <Alert severity="success" sx={{ mb: 2, fontSize: '0.8rem' }} onClose={() => setSuccessMessage('')}>
          {successMessage}
        </Alert>
      )}

      {/* Stats Cards - Compact */}
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid item xs={6} sm={3}>
          <StatCard title="Total Drivers" value={stats.total} color="primary" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard title="Active" value={stats.active} color="success" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard title="Available" value={stats.available} color="info" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard title="On Leave" value={stats.onLeave} color="warning" />
        </Grid>
      </Grid>

      {/* Filters - Compact */}
      <Paper sx={{ p: 1.5, mb: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <TextField
            placeholder="Search drivers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="small"
            sx={{ 
              flex: 1,
              '& .MuiInputLabel-root': { fontSize: '0.75rem' },
              '& .MuiInputBase-root': { fontSize: '0.8rem' }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: '0.9rem' }} />
                </InputAdornment>
              ),
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
              <MenuItem value="ACTIVE" sx={{ fontSize: '0.75rem' }}>Active</MenuItem>
              <MenuItem value="AVAILABLE" sx={{ fontSize: '0.75rem' }}>Available</MenuItem>
              <MenuItem value="ON_LEAVE" sx={{ fontSize: '0.75rem' }}>On Leave</MenuItem>
              <MenuItem value="INACTIVE" sx={{ fontSize: '0.75rem' }}>Inactive</MenuItem>
              <MenuItem value="SUSPENDED" sx={{ fontSize: '0.75rem' }}>Suspended</MenuItem>
            </Select>
          </FormControl>
          <Stack direction="row" spacing={0.75}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon sx={{ fontSize: '0.9rem' }} />}
              onClick={loadDrivers}
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
          </Box>
        ) : (
          <DataGrid
            rows={filteredDrivers}
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
          Showing {filteredDrivers.length} of {drivers.length} drivers
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
          Last updated: {new Date().toLocaleString()}
        </Typography>
      </Box>
    </Box>
  );
};

export default DriverList;
