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
  Avatar,
  AvatarGroup,
  Fade,
  Grow,
  Zoom,
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
  FilterList as FilterListIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import driverService from '../services/driverService';

// Replace the StatCard component with this fixed version:

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
        fontSize: '0.6rem',
        height: 22,
        bgcolor: info.bgcolor,
        color: info.color,
        '& .MuiChip-icon': { fontSize: '0.6rem', color: info.color, marginLeft: '4px' },
        '& .MuiChip-label': { px: 0.5 },
      }}
      icon={info.icon || undefined}
    />
  );
};

const DriverList = () => {
  const navigate = useNavigate();
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedRows, setSelectedRows] = useState([]);

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

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterStatus('ALL');
  };

  const columns = [
    {
      field: 'id',
      headerName: 'ID',
      flex: 0.4,
      minWidth: 50,
      renderCell: (params) => (
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.7rem', fontWeight: 500 }}>
          #{params.value}
        </Typography>
      ),
    },
    {
      field: 'fullName',
      headerName: 'Driver',
      flex: 1.3,
      minWidth: 180,
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
            {params.row.firstName?.charAt(0)}{params.row.lastName?.charAt(0)}
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.8rem', color: '#111827' }}>
              {params.row.firstName} {params.row.lastName}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem', display: 'flex', alignItems: 'center', gap: 0.5 }}>
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
      flex: 0.6,
      minWidth: 80,
      renderCell: (params) => (
        <Chip
          label={params.value || 'N/A'}
          size="small"
          variant="outlined"
          sx={{
            fontSize: '0.55rem',
            height: 20,
            borderColor: '#E5E7EB',
            color: '#6B7280',
          }}
        />
      ),
    },
    {
      field: 'licenseExpiry',
      headerName: 'License Expiry',
      flex: 0.6,
      minWidth: 90,
      renderCell: (params) => {
        if (!params.value) return <Typography variant="body2" sx={{ fontSize: '0.7rem', color: '#6B7280' }}>N/A</Typography>;
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
              fontSize: '0.55rem',
              height: 20,
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
      flex: 0.7,
      minWidth: 100,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <PhoneIcon sx={{ fontSize: '0.8rem', color: '#6B7280' }} />
          <Typography variant="body2" sx={{ fontSize: '0.7rem', color: '#111827' }}>
            {params.value || 'N/A'}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'email',
      headerName: 'Email',
      flex: 0.8,
      minWidth: 130,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <EmailIcon sx={{ fontSize: '0.8rem', color: '#6B7280' }} />
          <Typography variant="body2" sx={{ fontSize: '0.7rem', color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {params.value || 'N/A'}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      flex: 0.6,
      minWidth: 80,
      renderCell: (params) => <StatusChip status={params.value} />,
    },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 0.7,
      minWidth: 100,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="View Dashboard" arrow>
            <IconButton
              size="small"
              onClick={() => navigate(`/driverManagement/${params.row.id}`)}
              sx={{
                p: 0.5,
                color: '#4F46E5',
                '&:hover': { bgcolor: '#EEF2FF' },
              }}
            >
              <ViewIcon sx={{ fontSize: '0.9rem' }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit Driver" arrow>
            <IconButton
              size="small"
              onClick={() => navigate(`/drivers/${params.row.id}/edit`)}
              sx={{
                p: 0.5,
                color: '#6B7280',
                '&:hover': { bgcolor: '#EEF2FF', color: '#4F46E5' },
              }}
            >
              <EditIcon sx={{ fontSize: '0.9rem' }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete Driver" arrow>
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
    <Box sx={{ bgcolor: '#F7F7FC', minHeight: '100vh', p: { xs: 2, md: 3 } }}>
      <Box sx={{ maxWidth: '1440px', margin: '0 auto' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h5" fontWeight="700" sx={{ fontSize: '1.25rem', color: '#111827' }}>
              Driver Management
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
              Manage and monitor your fleet drivers
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<PersonAddIcon sx={{ fontSize: '1rem' }} />}
            onClick={() => navigate('/drivers/new')}
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
            Add Driver
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

        {/* Stats Cards - Change from color="..." to color="#..." */}
<Grid container spacing={2} sx={{ mb: 3 }}>
  <Grid item xs={6} sm={3}>
    <StatCard
      title="Total Drivers"
      value={stats.total}
      color="#4F46E5"
      icon={PersonAddIcon}
    />
  </Grid>
  <Grid item xs={6} sm={3}>
    <StatCard
      title="Active"
      value={stats.active}
      color="#22C55E"
      icon={CheckCircleIcon}
      subtitle={`${stats.active > 0 ? Math.round((stats.active / stats.total) * 100) : 0}% of total`}
      trend="up"
    />
  </Grid>
  <Grid item xs={6} sm={3}>
    <StatCard
      title="Available"
      value={stats.available}
      color="#3B82F6"
      icon={InfoIcon}
      subtitle={`${stats.available > 0 ? Math.round((stats.available / stats.total) * 100) : 0}% of total`}
    />
  </Grid>
  <Grid item xs={6} sm={3}>
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
            sx={{ mb: 2, borderRadius: '8px', fontSize: '0.8rem' }}
            icon={<WarningIcon />}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap">
              <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                <strong>{stats.expiringLicenses}</strong> driver{stats.expiringLicenses > 1 ? 's' : ''} ha{stats.expiringLicenses > 1 ? 've' : 's'} license{stats.expiringLicenses > 1 ? 's' : ''} expiring within 30 days.
              </Typography>
              <Button
                size="small"
                sx={{ fontSize: '0.7rem', color: '#F59E0B', fontWeight: 600 }}
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
            p: 2,
            mb: 3,
            borderRadius: '12px',
            border: '1px solid #ECECEC',
            bgcolor: '#FFFFFF',
          }}
        >
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
            <TextField
              placeholder="Search by name, license, or email..."
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
                <MenuItem value="ALL" sx={{ fontSize: '0.75rem' }}>All Status</MenuItem>
                <MenuItem value="ACTIVE" sx={{ fontSize: '0.75rem' }}>Active</MenuItem>
                <MenuItem value="AVAILABLE" sx={{ fontSize: '0.75rem' }}>Available</MenuItem>
                <MenuItem value="ON_LEAVE" sx={{ fontSize: '0.75rem' }}>On Leave</MenuItem>
                <MenuItem value="INACTIVE" sx={{ fontSize: '0.75rem' }}>Inactive</MenuItem>
                <MenuItem value="SUSPENDED" sx={{ fontSize: '0.75rem' }}>Suspended</MenuItem>
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
                onClick={loadDrivers}
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
                Loading drivers...
              </Typography>
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
            Showing <strong>{filteredDrivers.length}</strong> of <strong>{drivers.length}</strong> drivers
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

export default DriverList;
