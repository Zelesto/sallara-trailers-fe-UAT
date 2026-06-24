// src/pages/vehicles/VehicleList.jsx
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
  DirectionsCar as CarIcon,
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import { vehicleService } from '../services/vehicleService';

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

// Status Chip Component - Updated to match VehicleStatus enum
const VehicleStatusChip = ({ status }) => {
  const statusMap = {
    AVAILABLE: { color: 'success', label: 'Available' },
    ASSIGNED: { color: 'info', label: 'Assigned' },
    IN_USE: { color: 'primary', label: 'In Use' },
    ACTIVE: { color: 'success', label: 'Active' },
    INACTIVE: { color: 'default', label: 'Inactive' },
    MAINTENANCE: { color: 'warning', label: 'Maintenance' },
    REPAIR: { color: 'warning', label: 'Repair' },
    OUT_OF_SERVICE: { color: 'error', label: 'Out of Service' },
    SOLD: { color: 'default', label: 'Sold' },
    DECOMMISSIONED: { color: 'default', label: 'Decommissioned' },
    RETIRED: { color: 'default', label: 'Retired' },
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

const VehicleList = () => {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    setLoading(true);
    try {
      const response = await vehicleService.getAllVehicles();
      // The service already converts snake_case to camelCase
      setVehicles(response || []);
      setError(null);
    } catch (err) {
      console.error('Error loading vehicles:', err);
      setError('Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this vehicle?')) return;
    try {
      await vehicleService.deleteVehicle(id);
      setSuccessMessage('Vehicle deleted successfully');
      loadVehicles();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError('Failed to delete vehicle');
      setTimeout(() => setError(null), 3000);
    }
  };

  // Status options for filter - must match VehicleStatus enum
  const STATUS_FILTER_OPTIONS = [
    { value: 'ALL', label: 'All Status' },
    { value: 'AVAILABLE', label: 'Available' },
    { value: 'ASSIGNED', label: 'Assigned' },
    { value: 'IN_USE', label: 'In Use' },
    { value: 'ACTIVE', label: 'Active' },
    { value: 'INACTIVE', label: 'Inactive' },
    { value: 'MAINTENANCE', label: 'Maintenance' },
    { value: 'REPAIR', label: 'Repair' },
    { value: 'OUT_OF_SERVICE', label: 'Out of Service' },
    { value: 'SOLD', label: 'Sold' },
    { value: 'DECOMMISSIONED', label: 'Decommissioned' },
    { value: 'RETIRED', label: 'Retired' },
  ];

  const columns = [
    {
      field: 'registrationNumber',
      headerName: 'Registration',
      flex: 0.8,
      minWidth: 100,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          color="primary"
          variant="outlined"
          sx={{ 
            fontWeight: 600,
            fontSize: '0.65rem',
            height: 20
          }}
        />
      ),
    },
    {
      field: 'make',
      headerName: 'Make & Model',
      flex: 1.2,
      minWidth: 150,
      renderCell: (params) => (
        <Box>
          <Typography variant="body2" fontWeight={500} sx={{ fontSize: '0.75rem' }}>
            {params.row.make || ''} {params.row.model || ''}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
            {params.row.year || ''}
            {params.row.fleetNumber && ` • Fleet: ${params.row.fleetNumber}`}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'vehicleType',
      headerName: 'Type',
      flex: 0.6,
      minWidth: 70,
      renderCell: (params) => (
        <Chip
          label={params.value || 'N/A'}
          size="small"
          variant="outlined"
          sx={{ fontSize: '0.55rem', height: 18 }}
        />
      ),
    },
    {
      field: 'currentOdometer',
      headerName: 'Odometer',
      flex: 0.6,
      minWidth: 80,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>
          {params.value ? `${params.value.toLocaleString()} km` : 'N/A'}
        </Typography>
      ),
    },
    {
      field: 'fuelType',
      headerName: 'Fuel',
      flex: 0.5,
      minWidth: 60,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontSize: '0.65rem' }}>
          {params.value || 'N/A'}
        </Typography>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      flex: 0.7,
      minWidth: 100,
      renderCell: (params) => <VehicleStatusChip status={params.value} />,
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
              onClick={() => navigate(`/vehicles/${params.row.id}`)}
              sx={{ p: 0.5 }}
            >
              <ViewIcon sx={{ fontSize: '0.9rem' }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit">
            <IconButton
              size="small"
              color="secondary"
              onClick={() => navigate(`/vehicles/${params.row.id}/edit`)}
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

  const filteredVehicles = vehicles.filter(vehicle => {
    const searchMatch = 
      (vehicle.registrationNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (vehicle.make || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (vehicle.model || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (vehicle.fleetNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (vehicle.vin || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const statusMatch = filterStatus === 'ALL' || vehicle.status === filterStatus;
    return searchMatch && statusMatch;
  });

  // Calculate stats using correct enum values
  const stats = {
    total: vehicles.length,
    active: vehicles.filter(v => 
      v.status === 'ACTIVE' || 
      v.status === 'AVAILABLE' || 
      v.status === 'ASSIGNED' || 
      v.status === 'IN_USE'
    ).length,
    maintenance: vehicles.filter(v => 
      v.status === 'MAINTENANCE' || 
      v.status === 'REPAIR'
    ).length,
    outOfService: vehicles.filter(v => 
      v.status === 'OUT_OF_SERVICE' || 
      v.status === 'INACTIVE'
    ).length,
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 1.5, md: 2 } }}>
      {/* Header - Compact */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Typography variant="h6" fontWeight="600" sx={{ fontSize: '1rem' }}>
            Vehicle Management
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
            Manage fleet vehicles
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon sx={{ fontSize: '0.9rem' }} />}
          onClick={() => navigate('/vehicles/new')}
          size="small"
          sx={{ 
            borderRadius: 1.5,
            fontSize: '0.75rem',
            py: 0.5,
            px: 1.5
          }}
        >
          Add Vehicle
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2, fontSize: '0.8rem' }} onClose={() => setError(null)}>{error}</Alert>}
      {successMessage && <Alert severity="success" sx={{ mb: 2, fontSize: '0.8rem' }} onClose={() => setSuccessMessage('')}>{successMessage}</Alert>}

      {/* Stats Cards - Compact */}
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid item xs={6} sm={3}>
          <StatCard title="Total Vehicles" value={stats.total} color="primary" icon={CarIcon} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard title="Active" value={stats.active} color="success" icon={CarIcon} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard title="In Maintenance" value={stats.maintenance} color="warning" icon={CarIcon} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard title="Out of Service" value={stats.outOfService} color="error" icon={CarIcon} />
        </Grid>
      </Grid>

      {/* Filters - Compact */}
      <Paper sx={{ p: 1.5, mb: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <TextField
            placeholder="Search vehicles..."
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
              {STATUS_FILTER_OPTIONS.map(option => (
                <MenuItem key={option.value} value={option.value} sx={{ fontSize: '0.75rem' }}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Stack direction="row" spacing={0.75}>
            <Button 
              variant="outlined" 
              startIcon={<RefreshIcon sx={{ fontSize: '0.9rem' }} />} 
              onClick={loadVehicles}
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
            rows={filteredVehicles}
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
          Showing {filteredVehicles.length} of {vehicles.length} vehicles
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
          Last updated: {new Date().toLocaleString()}
        </Typography>
      </Box>
    </Box>
  );
};

export default VehicleList;
