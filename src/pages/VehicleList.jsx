// src/pages/vehicles/VehicleList.jsx - Updated with ResponsiveContainer
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
import { ResponsiveContainer } from '../../components/ResponsiveContainer';

// Stat Card - Matches Dashboard
const StatCard = ({ title, value, color = '#4F46E5', icon: Icon, subtitle }) => (
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
        borderColor: color,
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
            fontSize: { xs: '1.2rem', sm: '1.4rem', md: '1.6rem', lg: '1.8rem' },
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
      <Box
        sx={{
          bgcolor: `${color}15`,
          borderRadius: { xs: '10px', sm: '12px' },
          p: { xs: 1, sm: 1.25, md: 1.5 },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon sx={{ color: color, fontSize: { xs: '1.2rem', sm: '1.4rem', md: '1.6rem' } }} />
      </Box>
    </Stack>
  </Paper>
);

// Vehicle Status Chip
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
        fontSize: { xs: '0.5rem', sm: '0.6rem' },
        height: { xs: 18, sm: 22 },
        bgcolor: info.bgcolor,
        color: info.color,
        '& .MuiChip-icon': { fontSize: { xs: '0.6rem', sm: '0.7rem' }, color: info.color, marginLeft: '4px' },
        '& .MuiChip-label': { px: { xs: 0.5, sm: 0.75 } },
      }}
      icon={IconComponent ? <IconComponent /> : undefined}
    />
  );
};

const VehicleList = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Pagination state
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 20,
  });
  const [rowCount, setRowCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    setLoading(true);
    try {
      const response = await vehicleService.getAllVehicles();
      const data = response?.content || response || [];
      setVehicles(Array.isArray(data) ? data : []);
      setRowCount(Array.isArray(data) ? data.length : 0);
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
      width: isMobile ? 90 : 140,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          sx={{
            fontWeight: 600,
            fontSize: { xs: '0.55rem', sm: '0.65rem' },
            height: { xs: 18, sm: 22 },
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
      flex: 1,
      minWidth: 160,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar
            sx={{
              width: { xs: 28, sm: 32 },
              height: { xs: 28, sm: 32 },
              bgcolor: '#4F46E5',
              fontSize: { xs: '0.6rem', sm: '0.75rem' },
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            <CarIcon sx={{ fontSize: { xs: '0.8rem', sm: '1rem' } }} />
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight={600} sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem' }, color: '#111827' }}>
              {params.row.make || ''} {params.row.model || ''}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.5rem', sm: '0.6rem' }, display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <span>{params.row.year || ''}</span>
              {params.row.fleetNumber && (
                <>
                  <span>•</span>
                  <span>Fleet: {params.row.fleetNumber}</span>
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
      width: isMobile ? 60 : 90,
      renderCell: (params) => (
        <Chip
          label={params.value || 'N/A'}
          size="small"
          variant="outlined"
          sx={{ fontSize: { xs: '0.45rem', sm: '0.55rem' }, height: { xs: 16, sm: 18 }, borderColor: '#E5E7EB' }}
        />
      ),
    },
    {
      field: 'currentOdometer',
      headerName: 'Odometer',
      width: isMobile ? 80 : 110,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <SpeedIcon sx={{ fontSize: { xs: '0.6rem', sm: '0.8rem' }, color: '#6B7280' }} />
          <Typography variant="body2" sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' }, color: '#111827' }}>
            {params.value ? `${params.value.toLocaleString()} km` : 'N/A'}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'fuelType',
      headerName: 'Fuel',
      width: isMobile ? 60 : 80,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <FuelIcon sx={{ fontSize: { xs: '0.6rem', sm: '0.8rem' }, color: '#6B7280' }} />
          <Typography variant="body2" sx={{ fontSize: { xs: '0.55rem', sm: '0.65rem' }, color: '#111827' }}>
            {params.value || 'N/A'}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: isMobile ? 90 : 120,
      renderCell: (params) => <VehicleStatusChip status={params.value} />,
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: isMobile ? 100 : 130,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={0.25}>
          <Tooltip title="View Dashboard">
            <IconButton
              size="small"
              onClick={() => navigate(`/vehicleManagement/${params.row.id}`)}
              sx={{ p: { xs: 0.25, sm: 0.5 }, color: '#4F46E5' }}
            >
              <ViewIcon sx={{ fontSize: { xs: '0.7rem', sm: '0.9rem' } }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit">
            <IconButton
              size="small"
              onClick={() => navigate(`/vehicles/${params.row.id}/edit`)}
              sx={{ p: { xs: 0.25, sm: 0.5 }, color: '#6B7280' }}
            >
              <EditIcon sx={{ fontSize: { xs: '0.7rem', sm: '0.9rem' } }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton
              size="small"
              onClick={() => handleDelete(params.row.id)}
              sx={{ p: { xs: 0.25, sm: 0.5 }, color: '#6B7280' }}
            >
              <DeleteIcon sx={{ fontSize: { xs: '0.7rem', sm: '0.9rem' } }} />
            </IconButton>
          </Tooltip>
        </Stack>
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
              fontSize: { xs: '1.1rem', sm: '1.3rem', md: '1.4rem', lg: '1.5rem' } 
            }}
          >
            Vehicle Management
          </Typography>
          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.85rem' } }}
          >
            Manage and monitor your fleet vehicles • {vehicles.length} vehicles
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<PersonAddIcon sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' } }} />}
          onClick={() => navigate('/vehicles/new')}
          size="small"
          sx={{
            borderRadius: '10px',
            fontSize: { xs: '0.7rem', sm: '0.75rem' },
            textTransform: 'none',
            py: { xs: 0.5, sm: 0.75 },
            px: { xs: 1.5, sm: 2 },
            background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #4338CA 0%, #4F46E5 100%)',
            },
          }}
        >
          {isMobile ? 'Add' : 'Add Vehicle'}
        </Button>
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
      <Grid container spacing={{ xs: 1.5, sm: 2, md: 2.5 }} sx={{ mb: { xs: 2, sm: 2.5, md: 3 } }}>
        <Grid size={{ xs: 6, sm: 3 }}>
          <StatCard title="Total Vehicles" value={stats.total} color="#4F46E5" icon={CarIcon} />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <StatCard title="Active" value={stats.active} color="#22C55E" icon={CheckCircleIcon} />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <StatCard title="In Maintenance" value={stats.maintenance} color="#F59E0B" icon={BuildIcon} />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <StatCard title="Out of Service" value={stats.outOfService} color="#EF4444" icon={CloseIcon} />
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
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 1, sm: 1.5 }}>
          <TextField
            placeholder="Search vehicles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="small"
            sx={{ 
              flex: 1,
              '& .MuiInputLabel-root': { fontSize: { xs: '0.65rem', sm: '0.75rem' } },
              '& .MuiInputBase-root': { fontSize: { xs: '0.7rem', sm: '0.75rem' }, borderRadius: '8px' },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' } }} />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchTerm('')} sx={{ p: 0.5 }}>
                    <ClearIcon sx={{ fontSize: '0.7rem', color: '#6B7280' }} />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 130 } }}>
            <InputLabel sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>Status</InputLabel>
            <Select
              value={filterStatus}
              label="Status"
              onChange={(e) => setFilterStatus(e.target.value)}
              sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' }, borderRadius: '8px' }}
            >
              <MenuItem value="ALL" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>All Status</MenuItem>
              <MenuItem value="ACTIVE" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>Active</MenuItem>
              <MenuItem value="AVAILABLE" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>Available</MenuItem>
              <MenuItem value="ASSIGNED" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>Assigned</MenuItem>
              <MenuItem value="IN_USE" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>In Use</MenuItem>
              <MenuItem value="MAINTENANCE" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>Maintenance</MenuItem>
              <MenuItem value="REPAIR" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>Repair</MenuItem>
              <MenuItem value="OUT_OF_SERVICE" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>Out of Service</MenuItem>
              <MenuItem value="INACTIVE" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>Inactive</MenuItem>
            </Select>
          </FormControl>
          <Stack direction="row" spacing={1}>
            {hasFilters && (
              <Button
                variant="outlined"
                startIcon={<ClearIcon sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem' } }} />}
                onClick={handleClearFilters}
                size="small"
                sx={{ 
                  fontSize: { xs: '0.65rem', sm: '0.7rem' }, 
                  borderRadius: '8px',
                  py: { xs: 0.5, sm: 0.75 },
                }}
              >
                {isMobile ? '' : 'Clear'}
              </Button>
            )}
            <Button
              variant="outlined"
              startIcon={<RefreshIcon sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem' } }} />}
              onClick={loadVehicles}
              size="small"
              sx={{ 
                fontSize: { xs: '0.65rem', sm: '0.7rem' }, 
                borderRadius: '8px',
                py: { xs: 0.5, sm: 0.75 },
              }}
            >
              {isMobile ? '' : 'Refresh'}
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {/* Data Grid */}
      <Paper
        elevation={0}
        sx={{
          height: { xs: 350, sm: 400, md: 450, lg: 500 },
          width: '100%',
          borderRadius: { xs: '12px', sm: '16px' },
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
            pagination
            paginationMode="client"
            rowCount={filteredVehicles.length}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            pageSizeOptions={[5, 10, 20, 50, 100]}
            checkboxSelection={false}
            disableRowSelectionOnClick
            getRowId={(row) => row.id}
            density="compact"
            sx={{
              border: 'none',
              fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem' },
              '& .MuiDataGrid-cell': {
                borderRight: '1px solid #F3F4F6',
                display: 'flex',
                alignItems: 'center',
                padding: { xs: '0 8px', sm: '0 12px' },
                fontSize: { xs: '0.6rem', sm: '0.7rem', md: '0.75rem' },
              },
              '& .MuiDataGrid-columnHeaders': {
                backgroundColor: '#F9FAFB',
                borderBottom: '1px solid #E5E7EB',
                minHeight: { xs: '36px !important', sm: '44px !important' },
              },
              '& .MuiDataGrid-columnHeaderTitle': {
                fontWeight: 600,
                color: '#6B7280',
                fontSize: { xs: '0.55rem', sm: '0.6rem', md: '0.65rem' },
                textTransform: 'uppercase',
                letterSpacing: '0.3px',
              },
              '& .MuiDataGrid-row': {
                minHeight: { xs: '36px !important', sm: '44px !important' },
                '&:hover': { backgroundColor: '#F9FAFB' },
              },
              '& .MuiDataGrid-row:nth-of-type(even)': { backgroundColor: '#FAFAFA' },
              '& .MuiDataGrid-cell:focus': { outline: 'none' },
              '& .MuiDataGrid-columnHeader:focus': { outline: 'none' },
              '& .MuiDataGrid-footerContainer': {
                borderTop: '1px solid #E5E7EB',
                minHeight: { xs: '40px', sm: '52px' },
              },
              '& .MuiTablePagination-root': { fontSize: { xs: '0.65rem', sm: '0.75rem' } },
              '& .MuiTablePagination-select': { fontSize: { xs: '0.65rem', sm: '0.75rem' } },
              '& .MuiTablePagination-displayedRows': { fontSize: { xs: '0.65rem', sm: '0.75rem' } },
            }}
          />
        )}
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
          <Typography variant="caption" sx={{ fontSize: { xs: '0.5rem', sm: '0.6rem' }, color: '#6B7280' }}>
            Showing <strong>{filteredVehicles.length}</strong> of <strong>{vehicles.length}</strong> vehicles
            {hasFilters && ' (filtered)'}
          </Typography>
          <Typography variant="caption" sx={{ fontSize: { xs: '0.5rem', sm: '0.6rem' }, color: '#6B7280' }}>
            Last updated: {new Date().toLocaleString()}
          </Typography>
        </Stack>
      </Box>
    </ResponsiveContainer>
  );
};

export default VehicleList;
