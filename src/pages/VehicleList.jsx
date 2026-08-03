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
  Avatar,
  LinearProgress,
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
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Close as CloseIcon,
  Speed as SpeedIcon,
  LocalGasStation as FuelIcon,
  Build as BuildIcon,
  PersonAdd as PersonAddIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import { vehicleService } from '../services/vehicleService';

// Enhanced Stat Card Component
const StatCard = ({ title, value, color = '#4F46E5', icon: Icon, subtitle, trend }) => (
  <Card
    elevation={0}
    sx={{
      bgcolor: '#FFFFFF',
      border: '1px solid #ECECEC',
      borderRadius: '12px',
      height: '100%',
      transition: 'all 0.2s ease',
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
      },
      overflow: 'hidden',
      position: 'relative',
    }}
  >
    <CardContent sx={{ p: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography
            sx={{
              color: '#6B7280',
              fontSize: '0.7rem',
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            {title}
          </Typography>
          <Typography
            variant="h4"
            fontWeight="700"
            sx={{
              fontSize: '1.5rem',
              color: '#111827',
              mt: 0.5,
              lineHeight: 1.2,
            }}
          >
            {value}
          </Typography>
          {subtitle && (
            <Typography
              variant="caption"
              sx={{
                color: trend === 'up' ? '#22C55E' : trend === 'down' ? '#EF4444' : '#6B7280',
                fontSize: '0.65rem',
                display: 'block',
                mt: 0.25,
              }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>
        {Icon && (
          <Box
            sx={{
              bgcolor: `${color}15`,
              borderRadius: '10px',
              p: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon sx={{ fontSize: '1.3rem', color: color }} />
          </Box>
        )}
      </Stack>
    </CardContent>
  </Card>
);

// Enhanced Status Chip Component
const VehicleStatusChip = ({ status }) => {
  const statusMap = {
    AVAILABLE: { color: '#22C55E', bgcolor: '#D1FAE5', label: 'Available', icon: CheckCircleIcon },
    ASSIGNED: { color: '#3B82F6', bgcolor: '#DBEAFE', label: 'Assigned', icon: InfoIcon },
    IN_USE: { color: '#8B5CF6', bgcolor: '#EDE9FE', label: 'In Use', icon: CarIcon },
    ACTIVE: { color: '#22C55E', bgcolor: '#D1FAE5', label: 'Active', icon: CheckCircleIcon },
    INACTIVE: { color: '#6B7280', bgcolor: '#F3F4F6', label: 'Inactive', icon: CloseIcon },
    MAINTENANCE: { color: '#F59E0B', bgcolor: '#FEF3C7', label: 'Maintenance', icon: BuildIcon },
    REPAIR: { color: '#F59E0B', bgcolor: '#FEF3C7', label: 'Repair', icon: BuildIcon },
    OUT_OF_SERVICE: { color: '#EF4444', bgcolor: '#FEE2E2', label: 'Out of Service', icon: CloseIcon },
    SOLD: { color: '#6B7280', bgcolor: '#F3F4F6', label: 'Sold', icon: CloseIcon },
    DECOMMISSIONED: { color: '#6B7280', bgcolor: '#F3F4F6', label: 'Decommissioned', icon: CloseIcon },
    RETIRED: { color: '#6B7280', bgcolor: '#F3F4F6', label: 'Retired', icon: CloseIcon },
  };
  
  const info = statusMap[status] || { color: '#6B7280', bgcolor: '#F3F4F6', label: status || 'Unknown', icon: null };
  const IconComponent = info.icon;
  
  return (
    <Chip
      size="small"
      label={info.label}
      sx={{
        fontWeight: 500,
        fontSize: '0.6rem',
        height: 22,
        bgcolor: info.bgcolor,
        color: info.color,
        '& .MuiChip-icon': { fontSize: '0.6rem', color: info.color, marginLeft: '4px' },
        '& .MuiChip-label': { px: 0.5 },
      }}
      icon={IconComponent ? <IconComponent /> : undefined}
    />
  );
};

// Status filter options
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

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterStatus('ALL');
  };

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
          sx={{
            fontWeight: 600,
            fontSize: '0.65rem',
            height: 22,
            bgcolor: '#EEF2FF',
            color: '#4F46E5',
            borderRadius: '6px',
          }}
        />
      ),
    },
    {
      field: 'make',
      headerName: 'Make & Model',
      flex: 1.2,
      minWidth: 160,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar
            sx={{
              width: 32,
              height: 32,
              bgcolor: '#4F46E5',
              fontSize: '0.75rem',
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            <CarIcon sx={{ fontSize: '1rem' }} />
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.8rem', color: '#111827' }}>
              {params.row.make || ''} {params.row.model || ''}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem', display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <span>{params.row.year || ''}</span>
              {params.row.fleetNumber && (
                <>
                  <span>•</span>
                  <span>Fleet: {params.row.fleetNumber}</span>
                </>
              )}
              {params.row.vin && (
                <>
                  <span>•</span>
                  <span>VIN: {params.row.vin}</span>
                </>
              )}
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      field: 'vehicleType',
      headerName: 'Type',
      flex: 0.5,
      minWidth: 70,
      renderCell: (params) => (
        <Chip
          label={params.value || 'N/A'}
          size="small"
          variant="outlined"
          sx={{ fontSize: '0.55rem', height: 18, borderColor: '#E5E7EB' }}
        />
      ),
    },
    {
      field: 'currentOdometer',
      headerName: 'Odometer',
      flex: 0.6,
      minWidth: 90,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <SpeedIcon sx={{ fontSize: '0.8rem', color: '#6B7280' }} />
          <Typography variant="body2" sx={{ fontSize: '0.7rem', color: '#111827' }}>
            {params.value ? `${params.value.toLocaleString()} km` : 'N/A'}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'fuelType',
      headerName: 'Fuel',
      flex: 0.5,
      minWidth: 70,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <FuelIcon sx={{ fontSize: '0.8rem', color: '#6B7280' }} />
          <Typography variant="body2" sx={{ fontSize: '0.65rem', color: '#111827' }}>
            {params.value || 'N/A'}
          </Typography>
        </Box>
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
      minWidth: 110,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="View Dashboard" arrow>
            <IconButton
              size="small"
              onClick={() => navigate(`/vehicles/${params.row.id}/dashboard`)}
              sx={{
                p: 0.5,
                color: '#4F46E5',
                '&:hover': { bgcolor: '#EEF2FF' },
              }}
            >
              <ViewIcon sx={{ fontSize: '0.9rem' }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit Vehicle" arrow>
            <IconButton
              size="small"
              onClick={() => navigate(`/vehicles/${params.row.id}/edit`)}
              sx={{
                p: 0.5,
                color: '#6B7280',
                '&:hover': { bgcolor: '#EEF2FF', color: '#4F46E5' },
              }}
            >
              <EditIcon sx={{ fontSize: '0.9rem' }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete Vehicle" arrow>
            <IconButton
              size="small"
              onClick={() => handleDelete(params.row.id)}
              sx={{
                p: 0.5,
                color: '#6B7280',
                '&:hover': { bgcolor: '#FEE2E2', color: '#EF4444' },
              }}
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

  const hasFilters = searchTerm !== '' || filterStatus !== 'ALL';

  return (
    <Box sx={{ bgcolor: '#F7F7FC', minHeight: '100vh', p: { xs: 2, md: 3 } }}>
      <Box sx={{ maxWidth: '1440px', margin: '0 auto' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h5" fontWeight="700" sx={{ fontSize: '1.25rem', color: '#111827' }}>
              Vehicle Management
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
              Manage and monitor your fleet vehicles
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<PersonAddIcon sx={{ fontSize: '1rem' }} />}
            onClick={() => navigate('/vehicles/new')}
            sx={{
              borderRadius: '10px',
              fontSize: '0.8rem',
              py: 1,
              px: 2.5,
              textTransform: 'none',
              fontWeight: 600,
              background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #4338CA 0%, #4F46E5 100%)',
                boxShadow: '0 4px 12px rgba(79,70,229,0.3)',
              },
            }}
          >
            Add Vehicle
          </Button>
        </Box>

        {/* Alerts */}
        {error && (
          <Alert
            severity="error"
            sx={{ mb: 2, borderRadius: '8px', fontSize: '0.8rem' }}
            onClose={() => setError(null)}
            icon={<WarningIcon />}
          >
            {error}
          </Alert>
        )}
        {successMessage && (
          <Alert
            severity="success"
            sx={{ mb: 2, borderRadius: '8px', fontSize: '0.8rem' }}
            onClose={() => setSuccessMessage('')}
            icon={<CheckCircleIcon />}
          >
            {successMessage}
          </Alert>
        )}

        {/* Stats Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={3}>
            <StatCard
              title="Total Vehicles"
              value={stats.total}
              color="#4F46E5"
              icon={CarIcon}
              subtitle={`${stats.total > 0 ? `${stats.total} in fleet` : 'No vehicles'}`}
            />
          </Grid>
          <Grid item xs={6} sm={3}>
            <StatCard
              title="Active"
              value={stats.active}
              color="#22C55E"
              icon={CheckCircleIcon}
              subtitle={`${stats.active > 0 ? Math.round((stats.active / stats.total) * 100) : 0}% of fleet`}
              trend="up"
            />
          </Grid>
          <Grid item xs={6} sm={3}>
            <StatCard
              title="In Maintenance"
              value={stats.maintenance}
              color="#F59E0B"
              icon={BuildIcon}
              subtitle={`${stats.maintenance > 0 ? Math.round((stats.maintenance / stats.total) * 100) : 0}% of fleet`}
            />
          </Grid>
          <Grid item xs={6} sm={3}>
            <StatCard
              title="Out of Service"
              value={stats.outOfService}
              color="#EF4444"
              icon={CloseIcon}
              subtitle={`${stats.outOfService > 0 ? Math.round((stats.outOfService / stats.total) * 100) : 0}% of fleet`}
            />
          </Grid>
        </Grid>

        {/* Filters */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 3,
            borderRadius: '12px',
            border: '1px solid #ECECEC',
            bgcolor: '#FFFFFF',
          }}
        >
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
            <TextField
              placeholder="Search by registration, make, model, or fleet..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="small"
              sx={{
                flex: 1,
                '& .MuiInputLabel-root': { fontSize: '0.75rem' },
                '& .MuiInputBase-root': { fontSize: '0.8rem', borderRadius: '8px' },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ fontSize: '0.9rem', color: '#6B7280' }} />
                  </InputAdornment>
                ),
                endAdornment: searchTerm && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearchTerm('')} sx={{ p: 0.5 }}>
                      <ClearIcon sx={{ fontSize: '0.8rem', color: '#6B7280' }} />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel sx={{ fontSize: '0.75rem' }}>Status</InputLabel>
              <Select
                value={filterStatus}
                label="Status"
                onChange={(e) => setFilterStatus(e.target.value)}
                sx={{ fontSize: '0.75rem', borderRadius: '8px' }}
              >
                {STATUS_FILTER_OPTIONS.map(option => (
                  <MenuItem key={option.value} value={option.value} sx={{ fontSize: '0.75rem' }}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Stack direction="row" spacing={1}>
              {hasFilters && (
                <Button
                  variant="outlined"
                  startIcon={<ClearIcon sx={{ fontSize: '0.9rem' }} />}
                  onClick={handleClearFilters}
                  size="small"
                  sx={{ fontSize: '0.75rem', py: 0.5, borderRadius: '8px' }}
                >
                  Clear Filters
                </Button>
              )}
              <Button
                variant="outlined"
                startIcon={<RefreshIcon sx={{ fontSize: '0.9rem' }} />}
                onClick={loadVehicles}
                size="small"
                sx={{ fontSize: '0.75rem', py: 0.5, borderRadius: '8px' }}
              >
                Refresh
              </Button>
              <Button
                variant="outlined"
                startIcon={<ExportIcon sx={{ fontSize: '0.9rem' }} />}
                size="small"
                sx={{ fontSize: '0.75rem', py: 0.5, borderRadius: '8px' }}
              >
                Export
              </Button>
            </Stack>
          </Stack>
        </Paper>

        {/* Data Grid */}
        <Paper
          elevation={0}
          sx={{
            height: 500,
            width: '100%',
            borderRadius: '12px',
            border: '1px solid #ECECEC',
            overflow: 'hidden',
            bgcolor: '#FFFFFF',
          }}
        >
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <CircularProgress size={36} />
              <Typography sx={{ ml: 2, fontSize: '0.9rem', color: '#6B7280' }}>
                Loading vehicles...
              </Typography>
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
                  borderRight: '1px solid #F3F4F6',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 12px',
                  fontSize: '0.75rem',
                },
                '& .MuiDataGrid-columnHeaders': {
                  backgroundColor: '#F9FAFB',
                  borderBottom: '1px solid #E5E7EB',
                  minHeight: '44px !important',
                },
                '& .MuiDataGrid-columnHeader': {
                  padding: '0 12px',
                },
                '& .MuiDataGrid-columnHeaderTitle': {
                  fontWeight: 600,
                  color: '#6B7280',
                  fontSize: '0.65rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.3px',
                },
                '& .MuiDataGrid-row': {
                  minHeight: '44px !important',
                  '&:hover': {
                    backgroundColor: '#F9FAFB',
                  },
                },
                '& .MuiDataGrid-row:nth-of-type(even)': {
                  backgroundColor: '#FAFAFA',
                },
                '& .MuiDataGrid-cell:focus': {
                  outline: 'none',
                },
                '& .MuiDataGrid-columnHeader:focus': {
                  outline: 'none',
                },
                '& .MuiDataGrid-footerContainer': {
                  borderTop: '1px solid #E5E7EB',
                  minHeight: '40px',
                },
                '& .MuiTablePagination-root': {
                  fontSize: '0.75rem',
                },
              }}
            />
          )}
        </Paper>

        {/* Footer */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2, flexWrap: 'wrap', gap: 1 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
            Showing <strong>{filteredVehicles.length}</strong> of <strong>{vehicles.length}</strong> vehicles
            {hasFilters && ' (filtered)'}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
            Last updated: {new Date().toLocaleString()}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default VehicleList;
