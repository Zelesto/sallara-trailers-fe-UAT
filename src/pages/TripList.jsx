// src/pages/TripList.jsx - Complete with View functionality
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
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
  DirectionsCar,
  Person,
  LocationOn,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Pending as PendingIcon,
  PlayArrow as PlayArrowIcon,
  Stop as StopIcon,
  Warning as WarningIcon,
  Dashboard as DashboardIcon,
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import { tripService } from '../services/tripService';
import { ResponsiveContainer } from '../components/ResponsiveContainer';
import TripDetails from './TripDetails'; // ✅ Import TripDetails
import { 
  STATUS_CONFIG, 
  STATUS_OPTIONS,
} from '../constants/tripConstants';

export { STATUS_CONFIG, STATUS_OPTIONS };

// ============================================================
// HELPER FUNCTIONS
// ============================================================
const getVehicleRegistration = (trip) => {
  if (trip.vehicle?.registrationNumber) return trip.vehicle.registrationNumber;
  if (trip.vehicle?.registration) return trip.vehicle.registration;
  if (trip.vehicle?.vehicleNumber) return trip.vehicle.vehicleNumber;
  if (trip.vehicle?.name) return trip.vehicle.name;
  if (trip.vehicleReg) return trip.vehicleReg;
  if (trip.vehicleRegistration) return trip.vehicleRegistration;
  if (trip.vehicle?.id) return `Vehicle ${trip.vehicle.id}`;
  if (trip.vehicleId) return `Vehicle ${trip.vehicleId}`;
  return 'N/A';
};

const getDriverName = (trip) => {
  if (trip.driver) {
    if (trip.driver.firstName || trip.driver.lastName) {
      return `${trip.driver.firstName || ''} ${trip.driver.lastName || ''}`.trim();
    }
    if (trip.driver.name) return trip.driver.name;
    if (trip.driver.fullName) return trip.driver.fullName;
    if (typeof trip.driver === 'string') return trip.driver;
  }
  if (trip.driverName) return trip.driverName;
  if (trip.driver_name) return trip.driver_name;
  if (trip.assignedDriver) return trip.assignedDriver;
  return 'Unassigned';
};

const STATUS_KEYS = {
  CAN_START: ['PLANNED', 'ASSIGNED', 'DRAFT'],
  CAN_END: ['IN_PROGRESS', 'ACTIVE'],
  CAN_REPORT_INCIDENT: ['IN_PROGRESS', 'ACTIVE'],
  CAN_FINALIZE: ['COMPLETED'],
  CAN_EDIT: ['DRAFT', 'PLANNED', 'ASSIGNED', 'IN_PROGRESS', 'ACTIVE', 'PENDING'],
  CAN_DELETE: ['DRAFT', 'PLANNED', 'ASSIGNED', 'PENDING'],
  CAN_METRICS: ['IN_PROGRESS', 'ACTIVE', 'COMPLETED', 'FINALIZED'],
};

// ============================================================
// STAT CARD COMPONENT
// ============================================================
const StatCard = React.memo(({
  title,
  value,
  icon: Icon,
  color = 'primary',
  subtitle,
}) => {
  const colors = {
    primary: '#4F46E5',
    success: '#22C55E',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
    purple: '#8B5CF6',
  };

  const getColor = (c) => colors[c] || colors.primary;
  const getColorBg = (c) => {
    const bgColors = {
      primary: '#EEF2FF',
      success: '#D1FAE5',
      warning: '#FEF3C7',
      error: '#FEE2E2',
      info: '#DBEAFE',
      purple: '#EDE9FE',
    };
    return bgColors[c] || bgColors.primary;
  };

  const iconColor = getColor(color);
  const bgColor = getColorBg(color);

  return (
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
          borderColor: iconColor,
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
              fontSize: { 
                xs: '1.2rem', 
                sm: '1.4rem', 
                md: '1.6rem', 
                lg: '1.8rem' 
              },
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
            bgcolor: bgColor,
            borderRadius: { xs: '10px', sm: '12px' },
            p: { xs: 1, sm: 1.25, md: 1.5 },
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Icon sx={{ 
            color: iconColor, 
            fontSize: { 
              xs: '1.2rem', 
              sm: '1.4rem', 
              md: '1.6rem' 
            },
          }} />
        </Box>
      </Stack>
    </Paper>
  );
});

// ============================================================
// MAIN COMPONENT: TripList
// ============================================================
const TripList = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // State
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  
  // Pagination state
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 20,
  });
  const [rowCount, setRowCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // ✅ Add these states for TripDetails modal
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Delete Dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Debounce search
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const fetchTimerRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Load trips
  const loadTrips = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = {
        page: paginationModel.page,
        size: paginationModel.pageSize,
        sort: 'createdAt,desc',
      };
      
      if (filterStatus !== 'ALL') {
        params.status = filterStatus;
      }
      
      if (debouncedSearchTerm) {
        params.search = debouncedSearchTerm;
      }

      const response = await tripService.getAllTrips(params);
      
      const data = response?.content || [];
      const total = response?.totalElements || 0;
      const pages = response?.totalPages || 0;
      
      const transformedData = data.map(trip => ({
        ...trip,
        status: trip.status || 'DRAFT',
        tripType: trip.tripType || 'FREIGHT',
        driverName: getDriverName(trip),
        vehicleReg: getVehicleRegistration(trip),
        customerName: trip.customer?.name || trip.customerName || 'N/A',
        originCity: trip.originCity || trip.origin?.city || 'N/A',
        destinationCity: trip.destinationCity || trip.destination?.city || 'N/A',
      }));
      
      setTrips(transformedData);
      setRowCount(total);
      setTotalPages(pages);
    } catch (err) {
      console.error('Error loading trips:', err);
      setError('Failed to load trips');
    } finally {
      setLoading(false);
    }
  }, [paginationModel.page, paginationModel.pageSize, filterStatus, debouncedSearchTerm]);

  useEffect(() => {
    if (fetchTimerRef.current) clearTimeout(fetchTimerRef.current);
    fetchTimerRef.current = setTimeout(() => loadTrips(), 400);
    return () => clearTimeout(fetchTimerRef.current);
  }, [loadTrips]);

  // ============================================================
  // ACTION HANDLERS
  // ============================================================
  
  // ✅ FIXED: View handler - opens TripDetails modal
  const handleViewClick = (trip) => {
    console.log('👁️ Viewing trip:', trip);
    setSelectedTrip(trip);
    setShowDetailsModal(true);
  };

  // ✅ FIXED: Close details modal
  const handleCloseDetails = () => {
    setShowDetailsModal(false);
    setSelectedTrip(null);
    loadTrips(); // Refresh when closing
  };

  const handleStartTrip = (trip) => {
    if (!window.confirm(`Start trip #${trip.tripNumber}?`)) return;
    
    const startOdometer = prompt('Enter starting odometer reading (km):');
    if (!startOdometer) return;

    tripService.startTrip(trip.id, { actualStartOdometer: parseFloat(startOdometer) })
      .then(() => {
        setSuccessMessage('Trip started successfully!');
        loadTrips();
        setTimeout(() => setSuccessMessage(''), 3000);
      })
      .catch(err => {
        console.error('Error starting trip:', err);
        setError('Failed to start trip');
        setTimeout(() => setError(null), 3000);
      });
  };

  const handleEndTrip = (trip) => {
    if (!window.confirm(`End trip #${trip.tripNumber}?`)) return;
    
    const endOdometer = prompt('Enter ending odometer reading (km):');
    if (!endOdometer) return;

    const endReason = prompt('Enter end reason (optional):', 'COMPLETED');
    
    tripService.endTrip(trip.id, {
      actualEndOdometer: parseFloat(endOdometer),
      endReason: endReason || 'COMPLETED'
    })
      .then(() => {
        setSuccessMessage('Trip ended successfully!');
        loadTrips();
        setTimeout(() => setSuccessMessage(''), 3000);
      })
      .catch(err => {
        console.error('Error ending trip:', err);
        setError('Failed to end trip');
        setTimeout(() => setError(null), 3000);
      });
  };

  const handleReportIncident = (trip) => {
    navigate(`/trips/${trip.id}/incident`);
  };

  const handleOpenMetrics = (trip) => {
    navigate(`/trips/${trip.id}/metrics`);
  };

  const handleFinalizeTrip = async (trip) => {
    if (!window.confirm(`Finalize trip #${trip.tripNumber}?`)) return;
    
    try {
      await tripService.finalizeTrip(trip.id);
      setSuccessMessage('Trip finalized successfully!');
      loadTrips();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error finalizing trip:', err);
      setError('Failed to finalize trip');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleDeleteClick = (id) => {
    setDeleteId(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await tripService.deleteTrip(deleteId);
      setDeleteDialogOpen(false);
      setDeleteId(null);
      setSuccessMessage('Trip deleted successfully');
      loadTrips();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError('Failed to delete trip');
      setTimeout(() => setError(null), 3000);
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setDeleteId(null);
  };

  const handleEditClick = (tripId) => {
    navigate(`/trips/${tripId}/edit`);
  };

  const handlePaginationModelChange = (newModel) => {
    setPaginationModel(newModel);
  };

  const handleRefresh = () => {
    setPaginationModel(prev => ({ ...prev, page: 0 }));
    loadTrips();
  };

  const handleExport = async () => {
    try {
      const baseUrl = process.env.REACT_APP_API_URL || 'https://sallara-trailers-be-UAT.onrender.com/api';
      const timestamp = new Date().getTime();
      const exportUrl = `${baseUrl}/trips/export?format=csv&_t=${timestamp}`;
      window.open(exportUrl, '_blank');
    } catch (error) {
      console.error('Error exporting trips:', error);
      setError('Failed to export trips. Please try again.');
    }
  };

  // ============================================================
  // COLUMNS
  // ============================================================
  const getStatusChip = (status) => {
    const statusMap = {
      PLANNED: { color: 'info', label: 'Planned', icon: <ScheduleIcon sx={{ fontSize: '0.7rem' }} /> },
      ASSIGNED: { color: 'primary', label: 'Assigned', icon: <DirectionsCar sx={{ fontSize: '0.7rem' }} /> },
      IN_PROGRESS: { color: 'warning', label: 'In Progress', icon: <PendingIcon sx={{ fontSize: '0.7rem' }} /> },
      ACTIVE: { color: 'warning', label: 'Active', icon: <PendingIcon sx={{ fontSize: '0.7rem' }} /> },
      COMPLETED: { color: 'success', label: 'Completed', icon: <CheckCircleIcon sx={{ fontSize: '0.7rem' }} /> },
      CANCELLED: { color: 'error', label: 'Cancelled', icon: <CancelIcon sx={{ fontSize: '0.7rem' }} /> },
      DRAFT: { color: 'default', label: 'Draft', icon: null },
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
          fontSize: { xs: '0.5rem', sm: '0.65rem' },
          height: { xs: 16, sm: 20 },
          '& .MuiChip-label': { px: { xs: 0.5, sm: 1 }, py: 0.25 },
          '& .MuiChip-icon': { fontSize: { xs: '0.6rem', sm: '0.7rem' }, ml: 0.5 }
        }}
      />
    );
  };

  const getTripTypeChip = (type) => {
    const typeMap = {
      FREIGHT: { color: 'primary', label: 'Freight' },
      RETURN: { color: 'success', label: 'Return' },
      EMPTY: { color: 'warning', label: 'Empty' },
      PROJECT: { color: 'purple', label: 'Project' },
    };
    const info = typeMap[type] || { color: 'default', label: type || 'N/A' };
    return (
      <Chip
        size="small"
        label={info.label}
        color={info.color}
        variant="outlined"
        sx={{ 
          fontSize: { xs: '0.45rem', sm: '0.6rem' },
          height: { xs: 14, sm: 18 },
        }}
      />
    );
  };

  const columns = useMemo(() => [
    {
      field: 'tripNumber',
      headerName: 'Trip #',
      width: isMobile ? 90 : 140,
      headerClassName: 'trip-header',
      renderCell: (params) => (
        <Typography 
          variant="body2" 
          fontWeight={600} 
          color="primary" 
          sx={{ fontSize: { xs: '0.6rem', sm: '0.75rem' } }}
        >
          #{params.value || 'N/A'}
        </Typography>
      ),
    },
    {
      field: 'tripType',
      headerName: 'Type',
      width: isMobile ? 65 : 90,
      headerClassName: 'trip-header',
      renderCell: (params) => getTripTypeChip(params.value),
    },
    {
      field: 'customerName',
      headerName: 'Customer',
      flex: 1,
      minWidth: isMobile ? 80 : 120,
      headerClassName: 'trip-header',
      renderCell: (params) => (
        <Typography 
          variant="body2" 
          sx={{ 
            fontSize: { xs: '0.6rem', sm: '0.75rem' },
            fontWeight: 500,
          }}
        >
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'driverName',
      headerName: 'Driver',
      width: isMobile ? 90 : 140,
      headerClassName: 'trip-header',
      renderCell: (params) => (
        <Stack direction="row" spacing={0.5} alignItems="center">
          <Person sx={{ fontSize: { xs: '0.6rem', sm: '0.8rem' }, color: '#6B7280' }} />
          <Typography 
            variant="body2" 
            sx={{ fontSize: { xs: '0.55rem', sm: '0.75rem' } }}
          >
            {params.value}
          </Typography>
        </Stack>
      ),
    },
    {
      field: 'vehicleReg',
      headerName: 'Vehicle',
      width: isMobile ? 70 : 100,
      headerClassName: 'trip-header',
      renderCell: (params) => (
        <Chip
          size="small"
          label={params.value}
          variant="outlined"
          sx={{ 
            fontSize: { xs: '0.45rem', sm: '0.6rem' },
            height: { xs: 14, sm: 18 },
          }}
        />
      ),
    },
    {
      field: 'originCity',
      headerName: 'Origin',
      width: isMobile ? 70 : 110,
      headerClassName: 'trip-header',
      renderCell: (params) => (
        <Stack direction="row" spacing={0.5} alignItems="center">
          <LocationOn sx={{ fontSize: { xs: '0.6rem', sm: '0.8rem' }, color: '#6B7280' }} />
          <Typography 
            variant="body2" 
            sx={{ fontSize: { xs: '0.55rem', sm: '0.75rem' } }}
          >
            {params.value}
          </Typography>
        </Stack>
      ),
    },
    {
      field: 'destinationCity',
      headerName: 'Dest',
      width: isMobile ? 70 : 110,
      headerClassName: 'trip-header',
      renderCell: (params) => (
        <Stack direction="row" spacing={0.5} alignItems="center">
          <LocationOn sx={{ fontSize: { xs: '0.6rem', sm: '0.8rem' }, color: '#6B7280' }} />
          <Typography 
            variant="body2" 
            sx={{ fontSize: { xs: '0.55rem', sm: '0.75rem' } }}
          >
            {params.value}
          </Typography>
        </Stack>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: isMobile ? 90 : 120,
      headerClassName: 'trip-header',
      renderCell: (params) => getStatusChip(params.value),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: isMobile ? 140 : 200,
      sortable: false,
      filterable: false,
      headerClassName: 'trip-header',
      renderCell: (params) => {
        const trip = params.row;
        const status = trip.status || 'DRAFT';
        
        const canStart = STATUS_KEYS.CAN_START.includes(status);
        const canEnd = STATUS_KEYS.CAN_END.includes(status);
        const canReport = STATUS_KEYS.CAN_REPORT_INCIDENT.includes(status);
        const canFinalize = STATUS_KEYS.CAN_FINALIZE.includes(status);
        const canEdit = STATUS_KEYS.CAN_EDIT.includes(status);
        const canDelete = STATUS_KEYS.CAN_DELETE.includes(status);
        const canMetrics = STATUS_KEYS.CAN_METRICS.includes(status);

        return (
          <Stack direction="row" spacing={0.25} alignItems="center" flexWrap="wrap">
            {canStart && (
              <Tooltip title="Start Trip" arrow>
                <IconButton
                  size="small"
                  color="success"
                  onClick={() => handleStartTrip(trip)}
                  sx={{ p: { xs: 0.25, sm: 0.5 } }}
                >
                  <PlayArrowIcon sx={{ fontSize: { xs: '0.7rem', sm: '0.9rem' } }} />
                </IconButton>
              </Tooltip>
            )}

            {canEnd && (
              <Tooltip title="End Trip" arrow>
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => handleEndTrip(trip)}
                  sx={{ p: { xs: 0.25, sm: 0.5 } }}
                >
                  <StopIcon sx={{ fontSize: { xs: '0.7rem', sm: '0.9rem' } }} />
                </IconButton>
              </Tooltip>
            )}

            {canReport && (
              <Tooltip title="Report Incident" arrow>
                <IconButton
                  size="small"
                  color="warning"
                  onClick={() => handleReportIncident(trip)}
                  sx={{ p: { xs: 0.25, sm: 0.5 } }}
                >
                  <WarningIcon sx={{ fontSize: { xs: '0.7rem', sm: '0.9rem' } }} />
                </IconButton>
              </Tooltip>
            )}

            {/* ✅ FIXED: View button now passes the entire trip object */}
            <Tooltip title="View Details" arrow>
              <IconButton
                size="small"
                color="primary"
                onClick={() => handleViewClick(trip)}
                sx={{ p: { xs: 0.25, sm: 0.5 } }}
              >
                <ViewIcon sx={{ fontSize: { xs: '0.7rem', sm: '0.9rem' } }} />
              </IconButton>
            </Tooltip>

            {canEdit && (
              <Tooltip title="Edit Trip" arrow>
                <IconButton
                  size="small"
                  color="secondary"
                  onClick={() => handleEditClick(trip.id)}
                  sx={{ p: { xs: 0.25, sm: 0.5 } }}
                >
                  <EditIcon sx={{ fontSize: { xs: '0.7rem', sm: '0.9rem' } }} />
                </IconButton>
              </Tooltip>
            )}

            {canMetrics && (
              <Tooltip title="Trip Metrics" arrow>
                <IconButton
                  size="small"
                  color="info"
                  onClick={() => handleOpenMetrics(trip)}
                  sx={{ p: { xs: 0.25, sm: 0.5 } }}
                >
                  <DashboardIcon sx={{ fontSize: { xs: '0.7rem', sm: '0.9rem' } }} />
                </IconButton>
              </Tooltip>
            )}

            {canFinalize && (
              <Tooltip title="Finalize Trip" arrow>
                <IconButton
                  size="small"
                  color="success"
                  onClick={() => handleFinalizeTrip(trip)}
                  sx={{ p: { xs: 0.25, sm: 0.5 } }}
                >
                  <CheckCircleIcon sx={{ fontSize: { xs: '0.7rem', sm: '0.9rem' } }} />
                </IconButton>
              </Tooltip>
            )}

            {canDelete && (
              <Tooltip title="Delete Trip" arrow>
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => handleDeleteClick(trip.id)}
                  sx={{ p: { xs: 0.25, sm: 0.5 } }}
                >
                  <DeleteIcon sx={{ fontSize: { xs: '0.7rem', sm: '0.9rem' } }} />
                </IconButton>
              </Tooltip>
            )}
          </Stack>
        );
      },
    },
  ], [isMobile]);

  // ============================================================
  // STATS
  // ============================================================
  const stats = useMemo(() => {
    const total = rowCount;
    const active = trips.filter(t => ['ACTIVE', 'IN_PROGRESS', 'ASSIGNED', 'PLANNED'].includes(t.status)).length;
    const completed = trips.filter(t => t.status === 'COMPLETED').length;
    const cancelled = trips.filter(t => t.status === 'CANCELLED').length;
    return { total, active, completed, cancelled };
  }, [trips, rowCount]);

  // ============================================================
  // RENDER
  // ============================================================
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
            Trips
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
            Manage and track all trips • {rowCount} total trips
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            startIcon={<AddIcon sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' } }} />}
            onClick={() => navigate('/trips/new')}
            size="small"
            sx={{
              borderRadius: '10px',
              fontSize: { xs: '0.7rem', sm: '0.75rem' },
              textTransform: 'none',
              py: { xs: 0.5, sm: 0.75 },
              px: { xs: 1.5, sm: 2 },
            }}
          >
            {isMobile ? 'New' : 'Create Trip'}
          </Button>
        </Stack>
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
      <Grid 
        container 
        spacing={{ xs: 1.5, sm: 2, md: 2.5 }}
        sx={{ mb: { xs: 2, sm: 2.5, md: 3 } }}
      >
        <Grid size={{ xs: 6, sm: 3 }}>
          <StatCard
            title="Total Trips"
            value={stats.total}
            icon={ScheduleIcon}
            color="primary"
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <StatCard
            title="Active"
            value={stats.active}
            icon={DirectionsCar}
            color="warning"
            subtitle="In progress"
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <StatCard
            title="Completed"
            value={stats.completed}
            icon={CheckCircleIcon}
            color="success"
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <StatCard
            title="Cancelled"
            value={stats.cancelled}
            icon={CancelIcon}
            color="error"
          />
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
        <Stack 
          direction={{ xs: 'column', sm: 'row' }} 
          spacing={{ xs: 1, sm: 1.5 }}
        >
          <TextField
            placeholder="Search trips..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="small"
            sx={{ 
              flex: 1,
              '& .MuiInputLabel-root': { fontSize: { xs: '0.65rem', sm: '0.75rem' } },
              '& .MuiInputBase-root': { fontSize: { xs: '0.7rem', sm: '0.75rem' } },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' } }} />
                </InputAdornment>
              ),
            }}
          />
          <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 130 } }}>
            <InputLabel sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
              Status
            </InputLabel>
            <Select
              value={filterStatus}
              label="Status"
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setPaginationModel(prev => ({ ...prev, page: 0 }));
              }}
              sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
            >
              <MenuItem value="ALL" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                All Status
              </MenuItem>
              <MenuItem value="PLANNED" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                Planned
              </MenuItem>
              <MenuItem value="ASSIGNED" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                Assigned
              </MenuItem>
              <MenuItem value="IN_PROGRESS" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                In Progress
              </MenuItem>
              <MenuItem value="COMPLETED" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                Completed
              </MenuItem>
              <MenuItem value="CANCELLED" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                Cancelled
              </MenuItem>
            </Select>
          </FormControl>
          <Stack direction="row" spacing={1}>
            <Button 
              variant="outlined" 
              startIcon={<RefreshIcon sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' } }} />} 
              onClick={handleRefresh}
              size="small"
              sx={{
                borderRadius: '10px',
                fontSize: { xs: '0.7rem', sm: '0.75rem' },
                textTransform: 'none',
                py: { xs: 0.5, sm: 0.75 },
                px: { xs: 1, sm: 2 },
              }}
            >
              {isMobile ? '' : 'Refresh'}
            </Button>
            <Button 
              variant="outlined" 
              startIcon={<ExportIcon sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' } }} />}
              onClick={handleExport}
              size="small"
              sx={{
                borderRadius: '10px',
                fontSize: { xs: '0.7rem', sm: '0.75rem' },
                textTransform: 'none',
                py: { xs: 0.5, sm: 0.75 },
                px: { xs: 1, sm: 2 },
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
          borderRadius: { xs: '12px', sm: '16px' },
          border: '1px solid #ECECEC',
          bgcolor: '#FFFFFF',
          width: '100%',
          overflow: 'hidden',
        }}
      >
        <DataGrid
          rows={trips}
          columns={columns}
          pagination
          paginationMode="server"
          rowCount={rowCount}
          paginationModel={paginationModel}
          onPaginationModelChange={handlePaginationModelChange}
          pageSizeOptions={[5, 10, 20, 50, 100]}
          checkboxSelection={false}
          disableRowSelectionOnClick
          getRowId={(row) => row.id}
          density="compact"
          loading={loading}
          sx={{
            height: { xs: 350, sm: 400, md: 450, lg: 500 },
            border: 'none',
            fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem' },
            '& .MuiDataGrid-cell': {
              borderRight: '1px solid #f0f0f0',
              display: 'flex',
              alignItems: 'center',
              padding: { xs: '0 4px', sm: '0 8px' },
              fontSize: { xs: '0.6rem', sm: '0.7rem', md: '0.75rem' },
            },
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: '#f8f9fa',
              borderBottom: '2px solid #e0e0e0',
              minHeight: { xs: '32px !important', sm: '36px !important' },
            },
            '& .trip-header': {
              fontSize: { xs: '0.55rem', sm: '0.6rem', md: '0.65rem' },
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
              fontSize: { xs: '0.55rem', sm: '0.6rem', md: '0.65rem' },
              textTransform: 'uppercase',
              letterSpacing: '0.3px',
            },
            '& .MuiDataGrid-virtualScroller': {
              '& .MuiDataGrid-row': {
                minHeight: { xs: '32px !important', sm: '36px !important' },
              },
            },
            '& .MuiDataGrid-footerContainer': {
              minHeight: { xs: '40px', sm: '52px' },
              borderTop: '1px solid #e0e0e0',
            },
            '& .MuiTablePagination-root': {
              fontSize: { xs: '0.65rem', sm: '0.75rem' },
            },
            '& .MuiTablePagination-select': {
              fontSize: { xs: '0.65rem', sm: '0.75rem' },
            },
            '& .MuiTablePagination-displayedRows': {
              fontSize: { xs: '0.65rem', sm: '0.75rem' },
            },
          }}
        />
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
          <Typography 
            variant="caption" 
            sx={{ 
              fontSize: { xs: '0.5rem', sm: '0.6rem' }, 
              color: '#6B7280' 
            }}
          >
            Showing {trips.length} of {rowCount} trips
          </Typography>
          <Typography 
            variant="caption" 
            sx={{ 
              fontSize: { xs: '0.5rem', sm: '0.6rem' }, 
              color: '#6B7280' 
            }}
          >
            Page {paginationModel.page + 1} of {totalPages || 1}
          </Typography>
        </Stack>
      </Box>

      {/* ✅ TripDetails Modal */}
      {showDetailsModal && selectedTrip && (
        <TripDetails
          open={showDetailsModal}
          tripId={selectedTrip.id}
          onClose={handleCloseDetails}
          onUpdate={() => {
            loadTrips();
            setSuccessMessage('Trip updated successfully!');
            setTimeout(() => setSuccessMessage(''), 3000);
          }}
        />
      )}

      {/* Delete Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
          <DeleteIcon sx={{ verticalAlign: 'middle', mr: 1, color: 'error.main' }} />
          Delete Trip
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' } }}>
            Are you sure you want to delete this trip? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={handleDeleteCancel} 
            size="small" 
            sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem' } }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            variant="contained"
            color="error"
            disabled={deleting}
            size="small"
            sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem' } }}
          >
            {deleting ? <CircularProgress size={18} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </ResponsiveContainer>
  );
};

export default TripList;
