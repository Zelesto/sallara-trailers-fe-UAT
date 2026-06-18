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
import Breadcrumbs from '../../components/Layout/Breadcrumbs';

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
    return <Chip size="small" label={info.label} color={info.color} sx={{ fontWeight: 500 }} />;
  };

  const columns = [
    { 
      field: 'id', 
      headerName: 'ID', 
      width: 70,
      renderCell: (params) => (
        <Typography variant="body2" color="text.secondary">#{params.value}</Typography>
      )
    },
    {
      field: 'fullName',
      headerName: 'Driver',
      flex: 1,
      minWidth: 180,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              bgcolor: 'primary.main',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.75rem',
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            {params.row.firstName?.charAt(0)}{params.row.lastName?.charAt(0)}
          </Box>
          <Box>
            <Typography variant="body2" fontWeight={500}>
              {params.row.firstName} {params.row.lastName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
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
      width: 140,
      renderCell: (params) => (
        <Chip
          label={params.value || 'N/A'}
          size="small"
          variant="outlined"
          color="primary"
        />
      ),
    },
    {
      field: 'licenseExpiry',
      headerName: 'License Expiry',
      width: 130,
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
          />
        );
      },
    },
    {
      field: 'phoneNumber',
      headerName: 'Phone',
      width: 150,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <PhoneIcon fontSize="small" sx={{ color: 'text.secondary' }} />
          {params.value || 'N/A'}
        </Box>
      ),
    },
    {
      field: 'email',
      headerName: 'Email',
      flex: 1,
      minWidth: 180,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <EmailIcon fontSize="small" sx={{ color: 'text.secondary' }} />
          {params.value || 'N/A'}
        </Box>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => getStatusChip(params.value),
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
              onClick={() => navigate(`/drivers/${params.row.id}`)}
            >
              <ViewIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit">
            <IconButton
              size="small"
              color="secondary"
              onClick={() => navigate(`/drivers/${params.row.id}/edit`)}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton
              size="small"
              color="error"
              onClick={() => handleDelete(params.row.id)}
            >
              <DeleteIcon fontSize="small" />
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
    <Box>
      <Breadcrumbs />
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">Driver Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/drivers/new')}
          sx={{ borderRadius: 2 }}
        >
          Add Driver
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {successMessage && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccessMessage('')}>
          {successMessage}
        </Alert>
      )}

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>Total Drivers</Typography>
              <Typography variant="h4">{stats.total}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>Active</Typography>
              <Typography variant="h4" color="success.main">{stats.active}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>Available</Typography>
              <Typography variant="h4" color="info.main">{stats.available}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>On Leave</Typography>
              <Typography variant="h4" color="warning.main">{stats.onLeave}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField
            placeholder="Search drivers..."
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
              <MenuItem value="ACTIVE">Active</MenuItem>
              <MenuItem value="AVAILABLE">Available</MenuItem>
              <MenuItem value="ON_LEAVE">On Leave</MenuItem>
              <MenuItem value="INACTIVE">Inactive</MenuItem>
              <MenuItem value="SUSPENDED">Suspended</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadDrivers}
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

      <Paper sx={{ height: 500, width: '100%' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress />
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
            sx={{
              border: 'none',
              '& .MuiDataGrid-cell': { borderRight: '1px solid #f0f0f0' },
              '& .MuiDataGrid-columnHeaders': {
                backgroundColor: '#f8f9fa',
                borderBottom: '2px solid #e0e0e0',
              },
              '& .MuiDataGrid-row:hover': { backgroundColor: '#f5f5f5' },
            }}
          />
        )}
      </Paper>
    </Box>
  );
};

export default DriverList;
