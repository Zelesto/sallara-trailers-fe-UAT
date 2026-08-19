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
  Alert,
  CircularProgress,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Avatar,
  useTheme,
  useMediaQuery,
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
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Close as CloseIcon,
  PersonAdd as PersonAddIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import driverService from '../services/driverService';
import { ResponsiveContainer } from '../../components/ResponsiveContainer';

// Stat Card Component - Updated with Dashboard styling
const StatCard = ({ title, value, color = '#4F46E5', icon: Icon, subtitle, trend }) => (
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
      overflow: 'hidden',
      position: 'relative',
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
              color: trend === 'up' ? '#22C55E' : trend === 'down' ? '#EF4444' : '#6B7280',
              fontSize: { xs: '0.55rem', sm: '0.6rem', md: '0.65rem' },
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
      )}
    </Stack>
  </Paper>
);

// Status Chip Component
const StatusChip = ({ status }) => {
  const statusMap = {
    ACTIVE: { color: '#22C55E', bgcolor: '#D1FAE5', label: 'Active', icon: <CheckCircleIcon sx={{ fontSize: '0.6rem' }} /> },
    AVAILABLE: { color: '#3B82F6', bgcolor: '#DBEAFE', label: 'Available', icon: <InfoIcon sx={{ fontSize: '0.6rem' }} /> },
    ON_LEAVE: { color: '#F59E0B', bgcolor: '#FEF3C7', label: 'On Leave', icon: <WarningIcon sx={{ fontSize: '0.6rem' }} /> },
    INACTIVE: { color: '#EF4444', bgcolor: '#FEE2E2', label: 'Inactive', icon: <CloseIcon sx={{ fontSize: '0.6rem' }} /> },
    SUSPENDED: { color: '#EF4444', bgcolor: '#FEE2E2', label: 'Suspended', icon: <WarningIcon sx={{ fontSize: '0.6rem' }} /> },
  };
  const info = statusMap[status] || { color: '#6B7280', bgcolor: '#F3F4F6', label: status || 'Unknown', icon: null };
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
        '& .MuiChip-icon': { fontSize: { xs: '0.5rem', sm: '0.6rem' }, color: info.color, marginLeft: '4px' },
        '& .MuiChip-label': { px: { xs: 0.5, sm: 0.75 } },
      }}
      icon={info.icon || undefined}
    />
  );
};

const DriverList = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedRows, setSelectedRows] = useState([]);

  // Pagination state
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 20,
  });
  const [rowCount, setRowCount] = useState(0);

  useEffect(() => {
    loadDrivers();
  }, []);

  const loadDrivers = async () => {
    setLoading(true);
    try {
      const response = await driverService.getAllDrivers();
      const data = response?.content || response || [];
      setDrivers(Array.isArray(data) ? data : []);
      setRowCount(Array.isArray(data) ? data.length : 0);
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

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterStatus('ALL');
  };

  const columns = [
    {
      field: 'id',
      headerName: 'ID',
      width: isMobile ? 50 : 70,
      renderCell: (params) => (
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' }, fontWeight: 500 }}>
          #{params.value}
        </Typography>
      ),
    },
    {
      field: 'fullName',
      headerName: 'Driver',
      flex: 1.3,
      minWidth: isMobile ? 140 : 180,
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
            {params.row.firstName?.charAt(0)}{params.row.lastName?.charAt(0)}
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight={600} sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem' }, color: '#111827' }}>
              {params.row.firstName} {params.row.lastName}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.5rem', sm: '0.6rem' }, display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <span>ID: {params.row.id}</span>
              {params.row.licenseNumber && (
                <>
                  <span>•</span>
                  <span>{params.row.licenseNumber}</span>
                </>
              )}
            </Typography>
          </Box>
        </Box>
      ),
      valueGetter: (params) => `${params.row.firstName || ''} ${params.row.lastName || ''}`.trim(),
    },
    {
      field: 'licenseNumber',
      headerName: 'License',
      width: isMobile ? 70 : 100,
      renderCell: (params) => (
        <Chip
          label={params.value || 'N/A'}
          size="small"
          variant="outlined"
          sx={{
            fontSize: { xs: '0.45rem', sm: '0.55rem' },
            height: { xs: 16, sm: 20 },
            borderColor: '#E5E7EB',
            color: '#6B7280',
          }}
        />
      ),
    },
    {
      field: 'licenseExpiry',
      headerName: 'License Expiry',
      width: isMobile ? 90 : 120,
      renderCell: (params) => {
        if (!params.value) return <Typography variant="body2" sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' }, color: '#6B7280' }}>N/A</Typography>;
        const expiryDate = new Date(params.value);
        const today = new Date();
        const isExpired = expiryDate < today;
        const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
        const isExpiringSoon = daysUntilExpiry <= 30 && daysUntilExpiry > 0;
        return (
          <Chip
            label={expiryDate.toLocaleDateString()}
            size="small"
            sx={{
              fontSize: { xs: '0.45rem', sm: '0.55rem' },
              height: { xs: 16, sm: 20 },
              bgcolor: isExpired ? '#FEE2E2' : isExpiringSoon ? '#FEF3C7' : '#D1FAE5',
              color: isExpired ? '#991B1B' : isExpiringSoon ? '#92400E' : '#065F46',
              fontWeight: 500,
            }}
          />
        );
      },
    },
    {
      field: 'phoneNumber',
      headerName: 'Phone',
      width: isMobile ? 90 : 120,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <PhoneIcon sx={{ fontSize: { xs: '0.6rem', sm: '0.8rem' }, color: '#6B7280' }} />
          <Typography variant="body2" sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' }, color: '#111827' }}>
            {params.value || 'N/A'}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'email',
      headerName: 'Email',
      width: isMobile ? 100 : 140,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <EmailIcon sx={{ fontSize: { xs: '0.6rem', sm: '0.8rem' }, color: '#6B7280' }} />
          <Typography variant="body2" sx={{ fontSize: { xs: '0.55rem', sm: '0.7rem' }, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {params.value || 'N/A'}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: isMobile ? 90 : 110,
      renderCell: (params) => <StatusChip status={params.value} />,
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: isMobile ? 100 : 130,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="View Dashboard" arrow>
            <IconButton
              size="small"
              onClick={() => navigate(`/driverManagement/${params.row.id}`)}
              sx={{
                p: { xs: 0.25, sm: 0.5 },
                color: '#4F46E5',
                '&:hover': { bgcolor: '#EEF2FF' },
              }}
            >
              <ViewIcon sx={{ fontSize: { xs: '0.7rem', sm: '0.9rem' } }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit Driver" arrow>
            <IconButton
              size="small"
              onClick={() => navigate(`/drivers/${params.row.id}/edit`)}
              sx={{
                p: { xs: 0.25, sm: 0.5 },
                color: '#6B7280',
                '&:hover': { bgcolor: '#EEF2FF', color: '#4F46E5' },
              }}
            >
              <EditIcon sx={{ fontSize: { xs: '0.7rem', sm: '0.9rem' } }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete Driver" arrow>
            <IconButton
              size="small"
              onClick={() => handleDelete(params.row.id)}
              sx={{
                p: { xs: 0.25, sm: 0.5 },
                color: '#6B7280',
                '&:hover': { bgcolor: '#FEE2E2', color: '#EF4444' },
              }}
            >
              <DeleteIcon sx={{ fontSize: { xs: '0.7rem', sm: '0.9rem' } }} />
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
      (driver.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (driver.phoneNumber || '').includes(searchTerm);
    const statusMatch = filterStatus === 'ALL' || driver.status === filterStatus;
    return searchMatch && statusMatch;
  });

  const stats = {
    total: drivers.length,
    active: drivers.filter(d => d.status === 'ACTIVE').length,
    available: drivers.filter(d => d.status === 'AVAILABLE').length,
    onLeave: drivers.filter(d => d.status === 'ON_LEAVE').length,
    expiringLicenses: drivers.filter(d => {
      if (!d.licenseExpiry) return false;
      const daysUntilExpiry = Math.ceil((new Date(d.licenseExpiry) - new Date()) / (1000 * 60 * 60 * 24));
      return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
    }).length,
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
              fontSize: { 
                xs: '1.1rem', 
                sm: '1.3rem', 
                md: '1.4rem', 
                lg: '1.5rem' 
              } 
            }}
          >
            Driver Management
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
            Manage and monitor your fleet drivers • {drivers.length} drivers
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<PersonAddIcon sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' } }} />}
          onClick={() => navigate('/drivers/new')}
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
          {isMobile ? 'Add' : 'Add Driver'}
        </Button>
      </Stack>

      {/* Alerts */}
      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2, borderRadius: '12px', fontSize: { xs: '0.7rem', sm: '0.8rem' } }}
          onClose={() => setError(null)}
          icon={<WarningIcon />}
        >
          {error}
        </Alert>
      )}
      {successMessage && (
        <Alert
          severity="success"
          sx={{ mb: 2, borderRadius: '12px', fontSize: { xs: '0.7rem', sm: '0.8rem' } }}
          onClose={() => setSuccessMessage('')}
          icon={<CheckCircleIcon />}
        >
          {successMessage}
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={{ xs: 1.5, sm: 2, md: 2.5 }} sx={{ mb: { xs: 2, sm: 2.5, md: 3 } }}>
        <Grid size={{ xs: 6, sm: 3 }}>
          <StatCard
            title="Total Drivers"
            value={stats.total}
            color="#4F46E5"
            icon={PersonAddIcon}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <StatCard
            title="Active"
            value={stats.active}
            color="#22C55E"
            icon={CheckCircleIcon}
            subtitle={`${stats.active > 0 ? Math.round((stats.active / stats.total) * 100) : 0}% of total`}
            trend="up"
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <StatCard
            title="Available"
            value={stats.available}
            color="#3B82F6"
            icon={InfoIcon}
            subtitle={`${stats.available > 0 ? Math.round((stats.available / stats.total) * 100) : 0}% of total`}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <StatCard
            title="On Leave"
            value={stats.onLeave}
            color="#F59E0B"
            icon={WarningIcon}
            subtitle={`${stats.onLeave > 0 ? Math.round((stats.onLeave / stats.total) * 100) : 0}% of total`}
          />
        </Grid>
      </Grid>

      {/* Expiring Licenses Alert */}
      {stats.expiringLicenses > 0 && (
        <Alert
          severity="warning"
          sx={{ mb: 2, borderRadius: '12px', fontSize: { xs: '0.7rem', sm: '0.8rem' } }}
          icon={<WarningIcon />}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap">
            <Typography variant="body2" sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem' } }}>
              <strong>{stats.expiringLicenses}</strong> driver{stats.expiringLicenses > 1 ? 's' : ''} ha{stats.expiringLicenses > 1 ? 've' : 's'} license{stats.expiringLicenses > 1 ? 's' : ''} expiring within 30 days.
            </Typography>
            <Button
              size="small"
              sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' }, color: '#F59E0B', fontWeight: 600 }}
              onClick={() => setFilterStatus('ACTIVE')}
            >
              View Drivers
            </Button>
          </Stack>
        </Alert>
      )}

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
            placeholder="Search by name, license, or email..."
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
                    <ClearIcon sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem' }, color: '#6B7280' }} />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 150 } }}>
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
              <MenuItem value="ON_LEAVE" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>On Leave</MenuItem>
              <MenuItem value="INACTIVE" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>Inactive</MenuItem>
              <MenuItem value="SUSPENDED" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>Suspended</MenuItem>
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
                {isMobile ? '' : 'Clear Filters'}
              </Button>
            )}
            <Button
              variant="outlined"
              startIcon={<RefreshIcon sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem' } }} />}
              onClick={loadDrivers}
              size="small"
              sx={{ 
                fontSize: { xs: '0.65rem', sm: '0.7rem' }, 
                borderRadius: '8px',
                py: { xs: 0.5, sm: 0.75 },
              }}
            >
              {isMobile ? '' : 'Refresh'}
            </Button>
            <Button
              variant="outlined"
              startIcon={<ExportIcon sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem' } }} />}
              size="small"
              sx={{ 
                fontSize: { xs: '0.65rem', sm: '0.7rem' }, 
                borderRadius: '8px',
                py: { xs: 0.5, sm: 0.75 },
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
              Loading drivers...
            </Typography>
          </Box>
        ) : (
          <DataGrid
            rows={filteredDrivers}
            columns={columns}
            pagination
            paginationMode="client"
            rowCount={filteredDrivers.length}
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
            Showing <strong>{filteredDrivers.length}</strong> of <strong>{drivers.length}</strong> drivers
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

export default DriverList;
