// src/pages/TripList.jsx
import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import dayjs from 'dayjs';
import { tripService } from '../services/tripService';
import TripNoticeWizard from '../components/TripNoticeWizard';
import TripForm from './TripForm';
import TripMetricsForm from './TripMetricsForm';
import TripDetails from './TripDetails';

import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Button,
  Tooltip,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stack,
  Alert,
  CircularProgress,
  Divider,
  Avatar,
  Badge,
  Popover,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
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
  Person as PersonIcon,
  LocationOn,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Pending as PendingIcon,
  PlayArrow as PlayArrowIcon,
  Stop as StopIcon,
  Warning as WarningIcon,
  Dashboard as DashboardIcon,
  Route as RouteIcon,
  Close as CloseIcon,
  FilterList as FilterListIcon,
  Clear as ClearIcon,
  LocationCity,
  Star,
  StarBorder,
  TrendingUp,
  TrendingDown,
  Speed as SpeedIcon,
  LocalGasStation,
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';


import {
  TRIP_STATUSES,
  TRIP_STATUS_OPTIONS,
  TRIP_STATUS_CONFIG,
  getColor,
  getColorBg,
} from '../constants/tripConstants';

const STATUS_CONFIG = Object.fromEntries(
  TRIP_STATUSES.map(item => [item.code, {
    color: item.color || '#9e9e9e',
    bgColor: item.color ? `${item.color}20` : '#f5f5f5',
    label: item.displayName,
    icon: item.icon || '📋'
  }])
);
// ============================================================
// UTILITY FUNCTIONS (matching Dashboard styling)
// ============================================================



const formatCurrency = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) return 'R 0.00';
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numAmount);
};

const formatNumber = (num, decimals = 0) => {
  if (num === null || num === undefined || isNaN(num)) return '0';
  const number = typeof num === 'string' ? parseFloat(num) : num;
  return new Intl.NumberFormat('en-ZA', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(number);
};

// ============================================================
// STATUS CONFIG (matching Dashboard patterns)
// ============================================================

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
// STAT CARD COMPONENT (matching Dashboard StatCard)
// ============================================================
const StatCard = React.memo(({
  title,
  value,
  icon: Icon,
  color = 'primary',
  subtitle,
  loading = false,
}) => {
  const iconColor = getColor(color);
  const bgColor = getColorBg(color);
  const SafeIcon = Icon || DashboardIcon;

  return (
    <Card
      sx={{
        bgcolor: '#FFFFFF',
        borderRadius: { xs: '12px', sm: '14px', md: '16px' },
        border: '1px solid #ECECEC',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        height: '100%',
        width: '100%',
        position: 'relative',
        overflow: 'visible',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          borderColor: iconColor,
        },
      }}
    >
      <CardContent sx={{ p: { xs: 1.5, sm: 2, md: 2.5 } }}>
        {loading && (
          <Box sx={{ position: 'absolute', top: 12, right: 12, zIndex: 1 }}>
            <CircularProgress size={16} thickness={4} />
          </Box>
        )}

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
                opacity: loading ? 0.7 : 1,
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
                opacity: loading ? 0.7 : 1,
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
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>

          <Box
            sx={{
              bgcolor: bgColor,
              borderRadius: { xs: '10px', sm: '12px', md: '14px' },
              p: { xs: 1, sm: 1.25, md: 1.5 },
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'scale(1.05)',
              },
            }}
          >
            <SafeIcon sx={{ 
              color: iconColor, 
              fontSize: { xs: '1.2rem', sm: '1.4rem', md: '1.6rem', lg: '1.8rem' },
            }} />
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
});

// ============================================================
// STATUS CHIP (matching Dashboard Chip styling)
// ============================================================
const StatusChip = ({ status }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.DRAFT;
  
  return (
    <Chip
      label={config.label}
      size="small"
      sx={{
        backgroundColor: config.bgColor || '#F3F4F6',
        color: config.color || '#6B7280',
        fontWeight: 600,
        fontSize: { xs: '0.5rem', sm: '0.6rem' },
        height: { xs: 18, sm: 22 },
        border: `1px solid ${(config.color || '#6B7280')}20`,
        '& .MuiChip-label': { px: { xs: 0.75, sm: 1 }, py: 0.25 },
        '& .MuiChip-icon': { fontSize: { xs: '0.6rem', sm: '0.7rem' }, ml: 0.5 }
      }}
      icon={<span>{config.icon}</span>}
    />
  );
};

// ============================================================
// LOCATION DISPLAY (matching Dashboard patterns)
// ============================================================
const LocationDisplay = ({ city, zipCode, province, fullAddress, type }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  
  const displayCity = city || 
    (fullAddress ? fullAddress.split(',')[0] : null) || 
    'No location provided';
  
  const handleClick = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);
  
  return (
    <>
      <Box 
        onClick={handleClick}
        sx={{ 
          cursor: 'pointer',
          '&:hover': { textDecoration: 'underline', color: 'primary.main' }
        }}
      >
        <Stack direction="row" alignItems="center" spacing={0.25}>
          <LocationCity sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' }, color: '#6B7280' }} />
          <Typography sx={{ fontSize: { xs: '0.55rem', sm: '0.65rem' } }}>{displayCity}</Typography>
        </Stack>
      </Box>
      
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      >
        <Box sx={{ p: 1.5, maxWidth: 280 }}>
          <Typography variant="subtitle2" sx={{ fontSize: '0.8rem' }} gutterBottom>
            {type === 'origin' ? '📍 Origin Details' : '🏁 Destination Details'}
          </Typography>
          <Divider sx={{ my: 0.75 }} />
          <Stack spacing={0.75}>
            <InfoRow label="City" value={displayCity} />
            {zipCode && <InfoRow label="Postal Code" value={zipCode} />}
            {province && <InfoRow label="Province" value={province} />}
            {fullAddress && <InfoRow label="Full Address" value={fullAddress} />}
          </Stack>
        </Box>
      </Popover>
    </>
  );
};

const InfoRow = ({ label, value }) => (
  <Box>
    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
      {label}
    </Typography>
    <Typography variant="body2" sx={{ fontSize: '0.7rem', wordBreak: 'break-word', fontWeight: 500 }}>
      {value}
    </Typography>
  </Box>
);

// ============================================================
// NOTIFICATION HOOK (matching Dashboard)
// ============================================================
const useSimpleNotification = () => {
  const [notification, setNotification] = useState(null);
  const showNotification = useCallback((message, type = 'info') => {
    setNotification({ message, type });
    const timer = setTimeout(() => setNotification(null), 3000);
    return () => clearTimeout(timer);
  }, []);
  return { notification, showNotification };
};

// ============================================================
// MAIN COMPONENT
// ============================================================
function TripList() {
  const { notification, showNotification } = useSimpleNotification();
  
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('');
  const [customerFilter, setCustomerFilter] = useState('');
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMetricsModal, setShowMetricsModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showNoticeWizard, setShowNoticeWizard] = useState(false);
  const [selectedTripForNotice, setSelectedTripForNotice] = useState(null);
  const [pagination, setPagination] = useState({ page: 0, pageSize: 10, total: 0 });
  
  // Delete Dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // ✅ Metrics cache for performance
  const metricsCache = useRef({});
  const fetchTimerRef = useRef(null);

  const uniqueCities = useMemo(
    () => [...new Set(trips.map(t => t.originCity).filter(Boolean))],
    [trips]
  );

  const uniqueCustomers = useMemo(
    () => [...new Set(trips.map(t => t.customer?.name || t.customerName).filter(Boolean))],
    [trips]
  );

  // ============================================================
  // FETCH TRIPS
  // ============================================================
  const fetchTrips = useCallback(async ({ 
    page = 0, 
    size = pagination.pageSize, 
    search = searchText, 
    status = statusFilter, 
    city = cityFilter, 
    customer = customerFilter 
  } = {}) => {
    setLoading(true);
    try {
      const params = {
        page: Number(page),
        size: Number(size),
        sort: 'id,desc',
      };
      
      if (status && status !== 'all' && status !== 'undefined') {
        params.status = status;
      }
      
      if (search) params.search = search;
      if (city) params.city = city;
      if (customer) params.customer = customer;

      console.log('📤 Fetching trips with params:', params);

      const response = await tripService.getAllTrips(params);
      
      console.log('📥 Response:', {
        page: response.number,
        totalElements: response.totalElements,
        totalPages: response.totalPages,
        contentLength: response.content?.length
      });

      // ✅ Fetch metrics for each trip with caching
      const tripsWithMetrics = await Promise.all(
        (response.content || []).map(async (trip) => {
          if (metricsCache.current[trip.id]) {
            return { ...trip, metrics: metricsCache.current[trip.id] };
          }
          try {
            const metrics = await tripService.getTripMetrics(trip.id);
            metricsCache.current[trip.id] = metrics;
            return { ...trip, metrics };
          } catch {
            metricsCache.current[trip.id] = null;
            return { ...trip, metrics: null };
          }
        })
      );

      // DEBUG: Log first trip with metrics
      if (tripsWithMetrics.length > 0) {
        console.log('🔍 First trip with metrics:', {
          id: tripsWithMetrics[0].id,
          plannedDistance: tripsWithMetrics[0].plannedDistanceKm,
          actualDistance: tripsWithMetrics[0].metrics?.totalDistanceKm,
          hasMetrics: !!tripsWithMetrics[0].metrics
        });
      }

      setTrips(tripsWithMetrics);
      setPagination({
        page: response.number ?? page,
        pageSize: response.size ?? size,
        total: response.totalElements ?? 0
      });
    } catch (err) {
      console.error('Error fetching trips:', err);
      showNotification('Failed to load trips', 'error');
      setTrips([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.pageSize, searchText, statusFilter, cityFilter, customerFilter, showNotification]);

  // ✅ Initial fetch
  useEffect(() => {
    fetchTrips({ page: 0, status: 'all' });
  }, []);

  // ✅ Debounced filter changes
  useEffect(() => {
    if (fetchTimerRef.current) clearTimeout(fetchTimerRef.current);
    fetchTimerRef.current = setTimeout(() => fetchTrips({ page: 0 }), 400);
    return () => clearTimeout(fetchTimerRef.current);
  }, [searchText, statusFilter, cityFilter, customerFilter]);

  // ============================================================
  // ACTION HANDLERS
  // ============================================================

  const handleStartTrip = (trip) => {
    if (!window.confirm(`Start trip #${trip.tripNumber}?`)) return;
    
    const startOdometer = prompt('Enter starting odometer reading (km):');
    if (!startOdometer) return;

    tripService.startTrip(trip.id, { actualStartOdometer: parseFloat(startOdometer) })
      .then(() => {
        showNotification('Trip started successfully!', 'success');
        metricsCache.current = {};
        fetchTrips({ page: pagination.page });
      })
      .catch(err => {
        console.error('Error starting trip:', err);
        showNotification(err.message || 'Failed to start trip', 'error');
      });
  };

const handleEndTrip = async (tripId) => {
  try {
    // Show dialog to enter end odometer
    const endOdometer = window.prompt('Enter ending odometer reading (km):');
    
    if (endOdometer === null) return; // User cancelled
    
    const endOdometerNum = parseFloat(endOdometer);
    
    if (isNaN(endOdometerNum) || endOdometerNum <= 0) {
      alert('Please enter a valid odometer reading (positive number).');
      return;
    }
    
    // Get trip details to validate against start odometer
    const tripDetails = await tripService.getTripById(tripId);
    const startOdometer = tripDetails?.actualStartOdometer;
    
    if (startOdometer && endOdometerNum < startOdometer) {
      alert(`End odometer (${endOdometerNum.toFixed(2)} km) cannot be less than start odometer (${startOdometer.toFixed(2)} km).\n\nPlease enter a valid ending odometer reading.`);
      return;
    }
    
    // Proceed with ending the trip
    await tripService.endTrip(tripId, endOdometerNum);
    loadTrips();
  } catch (error) {
    console.error('Error ending trip:', error);
    setError(error.message || 'Failed to end trip');
  }
};

  const handleOpenNoticeWizard = (trip) => {
    setSelectedTripForNotice(trip);
    setShowNoticeWizard(true);
  };

  const handleCloseNoticeWizard = () => {
    setShowNoticeWizard(false);
    setSelectedTripForNotice(null);
    fetchTrips({ page: pagination.page });
  };

  const handleMetricsSuccess = () => {
    console.log('🔄 Metrics updated, refreshing trip list...');
    setShowMetricsModal(false);
    metricsCache.current = {};
    setTimeout(() => {
      fetchTrips({ page: pagination.page });
      showNotification('Trip metrics updated successfully!', 'success');
    }, 500);
  };
  
  const handleViewTrip = (trip) => {
    setSelectedTrip(trip);
    setShowDetailsModal(true);
  };

  const handleEditTrip = (trip) => {
    setSelectedTrip(trip);
    setShowEditModal(true);
  };

  const handleOpenMetrics = (trip) => {
    console.log('📊 Opening metrics for trip:', trip.id);
    setSelectedTrip(trip);
    setShowMetricsModal(true);
  };

  const handleFinalizeTrip = async (trip) => {
    if (!window.confirm('Are you sure you want to finalize this trip?')) return;
    
    try {
      await tripService.finalizeTrip(trip.id);
      showNotification('Trip finalized successfully!', 'success');
      metricsCache.current = {};
      fetchTrips({ page: pagination.page });
    } catch (err) {
      console.error('Error finalizing trip:', err);
      showNotification('Failed to finalize trip', 'error');
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
      showNotification('Trip deleted successfully', 'success');
      metricsCache.current = {};
      fetchTrips({ page: 0 });
    } catch (err) {
      console.error('Error deleting trip:', err);
      showNotification('Failed to delete trip', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setDeleteId(null);
  };

  const handleClearFilters = () => {
    setSearchText('');
    setStatusFilter('all');
    setCityFilter('');
    setCustomerFilter('');
  };

  const handleModalClose = (callback) => () => {
    callback();
    setTimeout(() => {
      metricsCache.current = {};
      fetchTrips({ page: pagination.page });
    }, 300);
  };

  const getTripDisplay = (trip) => {
    let driverName = 'N/A';
    
    if (trip.driver) {
      if (trip.driver.firstName || trip.driver.lastName) {
        driverName = `${trip.driver.firstName || ''} ${trip.driver.lastName || ''}`.trim();
      } else if (trip.driver.name) {
        driverName = trip.driver.name;
      } else if (trip.driver.fullName) {
        driverName = trip.driver.fullName;
      } else if (typeof trip.driver === 'string') {
        driverName = trip.driver;
      }
    }
    
    if (driverName === 'N/A' || !driverName) {
      driverName = trip.driverName || trip.driver_name || trip.assignedDriver || 'N/A';
    }

    return {
      customerName: trip.customer?.name || trip.customerName || 'N/A',
      vehicleReg: trip.vehicle?.registrationNumber || trip.vehicleRegistration || 'N/A',
      driverName: driverName,
      canStart: STATUS_KEYS.CAN_START.includes(trip.status),
      canEnd: STATUS_KEYS.CAN_END.includes(trip.status),
      canReport: STATUS_KEYS.CAN_REPORT_INCIDENT.includes(trip.status),
      canFinalize: STATUS_KEYS.CAN_FINALIZE.includes(trip.status),
      canEdit: STATUS_KEYS.CAN_EDIT.includes(trip.status),
      canDelete: STATUS_KEYS.CAN_DELETE.includes(trip.status),
      canMetrics: STATUS_KEYS.CAN_METRICS.includes(trip.status),
    };
  };

  const getTripCounts = useMemo(() => {
    const counts = { total: trips.length };
    trips.forEach(t => {
      counts[t.status] = (counts[t.status] || 0) + 1;
    });
    return counts;
  }, [trips]);

  // ============================================================
  // RENDER
  // ============================================================
  
  if (loading && trips.length === 0) {
    return (
      <Box sx={{ 
        bgcolor: '#F7F7FC', 
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <CircularProgress size={40} />
        <Typography sx={{ ml: 2, fontSize: '0.9rem' }}>Loading trips...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      bgcolor: '#F7F7FC', 
      minHeight: '100vh',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      p: { xs: 1.5, sm: 2, md: 2.5, lg: 3 },
      width: '100%',
      overflowX: 'hidden' 
    }}>
      <Box sx={{ 
        maxWidth: '1600px', 
        margin: '0 auto',
        flex: 1,
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}>
        
        {/* Notification */}
        {notification && (
          <Alert 
            severity={notification.type} 
            sx={{ mb: 2, borderRadius: '12px', fontSize: '0.8rem' }}
            onClose={() => setNotification(null)}
          >
            {notification.message}
          </Alert>
        )}

        {/* Header - matching Dashboard */}
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
              Trip Management
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
              Manage and track all trips • {pagination.total} total trips
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' } }} />}
              onClick={() => {
                metricsCache.current = {};
                fetchTrips({ page: pagination.page });
              }}
              size="small"
              sx={{
                borderRadius: '10px',
                fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.8rem' },
                textTransform: 'none',
                py: { xs: 0.5, sm: 0.75 },
                px: { xs: 1.5, sm: 2 },
              }}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' } }} />}
              onClick={() => setShowCreateModal(true)}
              size="small"
              sx={{
                borderRadius: '10px',
                fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.8rem' },
                textTransform: 'none',
                py: { xs: 0.5, sm: 0.75 },
                px: { xs: 1.5, sm: 2 },
                background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #4338CA 0%, #4F46E5 100%)',
                },
              }}
            >
              New Trip
            </Button>
          </Stack>
        </Stack>

        {/* Stats Cards - matching Dashboard */}
        <Grid 
          container 
          spacing={{ xs: 1.5, sm: 2, md: 2.5, lg: 3 }}
          sx={{ 
            mb: { xs: 2, sm: 2.5, md: 3 },
            width: '100%',
            margin: 0,
          }}
        >
          <Grid size={{ xs: 6, sm: 3 }} sx={{ display: 'flex' }}>
            <StatCard
              title="Total Trips"
              value={pagination.total}
              icon={RouteIcon}
              color="primary"
              subtitle="All trips"
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }} sx={{ display: 'flex' }}>
            <StatCard
              title="Active"
              value={getTripCounts.ACTIVE || 0}
              icon={DirectionsCar}
              color="success"
              subtitle="Currently active"
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }} sx={{ display: 'flex' }}>
            <StatCard
              title="In Progress"
              value={getTripCounts.IN_PROGRESS || 0}
              icon={PendingIcon}
              color="warning"
              subtitle="Ongoing trips"
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }} sx={{ display: 'flex' }}>
            <StatCard
              title="Completed"
              value={getTripCounts.COMPLETED || 0}
              icon={CheckCircleIcon}
              color="purple"
              subtitle="Finished trips"
            />
          </Grid>
        </Grid>

        {/* Filters - matching Dashboard filter style */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 1.5, sm: 2 },
            mb: { xs: 2, sm: 2.5, md: 3 },
            borderRadius: { xs: '12px', sm: '16px' },
            border: '1px solid #ECECEC',
            bgcolor: '#FFFFFF',
            width: '100%',
          }}
        >
          <Stack 
            direction={{ xs: 'column', sm: 'row' }} 
            spacing={{ xs: 1, sm: 1.5 }}
            alignItems={{ xs: 'stretch', sm: 'center' }}
            flexWrap="wrap"
            useFlexGap
          >
            <TextField
              size="small"
              placeholder="Search trips..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              sx={{ 
                flex: 1,
                minWidth: { xs: '100%', sm: 200 },
                '& .MuiInputLabel-root': { fontSize: { xs: '0.65rem', sm: '0.75rem' } },
                '& .MuiInputBase-root': { fontSize: { xs: '0.7rem', sm: '0.75rem' }, borderRadius: '10px' },
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
              <InputLabel sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Status"
                sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' }, borderRadius: '10px' }}
              >
                <MenuItem value="all" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>All Statuses</MenuItem>
                {TRIP_STATUS_OPTIONS.map(status => (
                  <MenuItem key={status.value} value={status.value} sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                    {status.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {uniqueCities.length > 0 && (
              <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 140 } }}>
                <InputLabel sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>City</InputLabel>
                <Select
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                  label="City"
                  sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' }, borderRadius: '10px' }}
                >
                  <MenuItem value="" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>All Cities</MenuItem>
                  {uniqueCities.map(city => (
                    <MenuItem key={city} value={city} sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>{city}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {uniqueCustomers.length > 0 && (
              <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 150 } }}>
                <InputLabel sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>Customer</InputLabel>
                <Select
                  value={customerFilter}
                  onChange={(e) => setCustomerFilter(e.target.value)}
                  label="Customer"
                  sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' }, borderRadius: '10px' }}
                >
                  <MenuItem value="" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>All Customers</MenuItem>
                  {uniqueCustomers.map(customer => (
                    <MenuItem key={customer} value={customer} sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>{customer}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            <Button 
              onClick={handleClearFilters}
              disabled={!searchText && statusFilter === 'all' && !cityFilter && !customerFilter}
              variant="outlined"
              size="small"
              startIcon={<ClearIcon sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' } }} />}
              sx={{
                borderRadius: '10px',
                fontSize: { xs: '0.7rem', sm: '0.75rem' },
                textTransform: 'none',
                py: { xs: 0.5, sm: 0.75 },
                px: { xs: 1, sm: 1.5 },
              }}
            >
              Clear
            </Button>
          </Stack>
        </Paper>

        {/* Table - matching Dashboard table styling */}
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
          <TableContainer>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#F9FAFB' }}>
                <TableRow>
                  <TableCell sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' }, fontWeight: 600, color: '#6B7280', py: 1.5 }}>
                    Trip #
                  </TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' }, fontWeight: 600, color: '#6B7280', py: 1.5 }}>
                    Customer
                  </TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' }, fontWeight: 600, color: '#6B7280', py: 1.5 }}>
                    Vehicle
                  </TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' }, fontWeight: 600, color: '#6B7280', py: 1.5 }}>
                    Driver
                  </TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' }, fontWeight: 600, color: '#6B7280', py: 1.5 }}>
                    Status
                  </TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' }, fontWeight: 600, color: '#6B7280', py: 1.5 }}>
                    Origin
                  </TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' }, fontWeight: 600, color: '#6B7280', py: 1.5 }}>
                    Destination
                  </TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' }, fontWeight: 600, color: '#6B7280', py: 1.5 }}>
                    Distance
                  </TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' }, fontWeight: 600, color: '#6B7280', py: 1.5 }}>
                    Date
                  </TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' }, fontWeight: 600, color: '#6B7280', py: 1.5 }}>
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {trips.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                      <Box sx={{ textAlign: 'center' }}>
                        <RouteIcon sx={{ fontSize: 48, color: '#D1D5DB', mb: 2 }} />
                        <Typography variant="body1" color="text.secondary">
                          {searchText || statusFilter !== 'all' || cityFilter || customerFilter
                            ? 'No trips match your filters'
                            : 'No trips found'}
                        </Typography>
                        {(searchText || statusFilter !== 'all' || cityFilter || customerFilter) && (
                          <Button onClick={handleClearFilters} sx={{ mt: 1, fontSize: '0.7rem' }} size="small">
                            Clear Filters
                          </Button>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  trips.map(trip => {
                    const display = getTripDisplay(trip);
                    
                    return (
                      <TableRow key={trip.id} hover sx={{ '&:hover': { bgcolor: '#F9FAFB' } }}>
                        <TableCell sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' }, py: 1 }}>
                          <Typography fontWeight="600" sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' }, color: '#4F46E5' }}>
                            {trip.tripNumber}
                          </Typography>
                          {trip.referenceNumber && (
                            <Typography variant="caption" sx={{ fontSize: { xs: '0.5rem', sm: '0.55rem' }, color: '#6B7280', display: 'block' }}>
                              REF: {trip.referenceNumber}
                            </Typography>
                          )}
                        </TableCell>

                        <TableCell sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' }, py: 1 }}>
                          {display.customerName !== 'N/A' ? (
                            <Typography sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' } }}>{display.customerName}</Typography>
                          ) : (
                            <Typography color="text.secondary" sx={{ fontSize: { xs: '0.55rem', sm: '0.65rem' } }}>N/A</Typography>
                          )}
                        </TableCell>

                        <TableCell sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' }, py: 1 }}>
                          {display.vehicleReg !== 'N/A' ? (
                            <Typography sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' } }}>{display.vehicleReg}</Typography>
                          ) : (
                            <Typography color="text.secondary" sx={{ fontSize: { xs: '0.55rem', sm: '0.65rem' } }}>N/A</Typography>
                          )}
                        </TableCell>

                        <TableCell sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' }, py: 1 }}>
                          {display.driverName !== 'N/A' ? (
                            <Stack direction="row" alignItems="center" spacing={0.5}>
                              <PersonIcon sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' }, color: '#6B7280' }} />
                              <Typography sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' } }}>{display.driverName}</Typography>
                            </Stack>
                          ) : (
                            <Typography color="text.secondary" sx={{ fontSize: { xs: '0.55rem', sm: '0.65rem' } }}>N/A</Typography>
                          )}
                        </TableCell>

                        <TableCell sx={{ py: 0.5 }}>
                          <StatusChip status={trip.status} />
                        </TableCell>

                        <TableCell sx={{ py: 0.5 }}>
                          <LocationDisplay
                            city={trip.originCity}
                            zipCode={trip.originZipCode}
                            province={trip.originProvince}
                            fullAddress={trip.originLocation}
                            type="origin"
                          />
                        </TableCell>

                        <TableCell sx={{ py: 0.5 }}>
                          <LocationDisplay
                            city={trip.destinationCity}
                            zipCode={trip.destinationZipCode}
                            province={trip.destinationProvince}
                            fullAddress={trip.destinationLocation}
                            type="destination"
                          />
                        </TableCell>

                        {/* ✅ Distance column with actual metrics */}
                        <TableCell sx={{ py: 0.5 }}>
                          {(() => {
                            const plannedDistance = trip.plannedDistanceKm;
                            const actualDistance = trip.metrics?.totalDistanceKm || trip.totalDistanceKm;
                            
                            if (actualDistance) {
                              return (
                                <Tooltip 
                                  title={`Actual: ${actualDistance} km${plannedDistance ? ` | Planned: ${plannedDistance} km` : ''}`} 
                                  arrow
                                >
                                  <Chip
                                    size="small"
                                    label={`${typeof actualDistance === 'number' ? actualDistance.toFixed(1) : actualDistance} km`}
                                    sx={{ 
                                      fontSize: { xs: '0.5rem', sm: '0.6rem' },
                                      height: { xs: 18, sm: 22 },
                                      bgcolor: '#D1FAE5',
                                      color: '#065F46',
                                      fontWeight: 600,
                                      '&:hover': { bgcolor: '#A7F3D0' }
                                    }}
                                  />
                                </Tooltip>
                              );
                            }
                            
                            if (plannedDistance) {
                              return (
                                <Chip
                                  size="small"
                                  label={`${plannedDistance} km`}
                                  variant="outlined"
                                  sx={{ 
                                    fontSize: { xs: '0.5rem', sm: '0.6rem' },
                                    height: { xs: 18, sm: 22 },
                                    color: '#6B7280'
                                  }}
                                />
                              );
                            }
                            
                            return (
                              <Typography sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' }, color: '#6B7280' }}>-</Typography>
                            );
                          })()}
                        </TableCell>

                        <TableCell sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' }, py: 0.5 }}>
                          {trip.plannedStartDate 
                            ? dayjs(trip.plannedStartDate).format('DD MMM YYYY')
                            : '-'}
                        </TableCell>

                        <TableCell sx={{ py: 0.5 }}>
                          <Box display="flex" gap={0.25} flexWrap="wrap">
                            {display.canStart && (
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

                            {display.canEnd && (
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

                            {display.canReport && (
                              <Tooltip title="Add Notice" arrow>
                                <IconButton 
                                  size="small" 
                                  color="warning" 
                                  onClick={() => handleOpenNoticeWizard(trip)} 
                                  sx={{ p: { xs: 0.25, sm: 0.5 } }}
                                >
                                  <WarningIcon sx={{ fontSize: { xs: '0.7rem', sm: '0.9rem' } }} />
                                </IconButton>
                              </Tooltip>
                            )}

                            <Tooltip title="View Details" arrow>
                              <IconButton 
                                size="small" 
                                color="primary" 
                                onClick={() => handleViewTrip(trip)} 
                                sx={{ p: { xs: 0.25, sm: 0.5 } }}
                              >
                                <ViewIcon sx={{ fontSize: { xs: '0.7rem', sm: '0.9rem' } }} />
                              </IconButton>
                            </Tooltip>

                            {display.canEdit && (
                              <Tooltip title="Edit Trip" arrow>
                                <IconButton 
                                  size="small" 
                                  color="secondary" 
                                  onClick={() => handleEditTrip(trip)} 
                                  sx={{ p: { xs: 0.25, sm: 0.5 } }}
                                >
                                  <EditIcon sx={{ fontSize: { xs: '0.7rem', sm: '0.9rem' } }} />
                                </IconButton>
                              </Tooltip>
                            )}

                            {display.canMetrics && (
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

                            {display.canFinalize && (
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

                            {display.canDelete && (
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
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {trips.length > 0 && (
            <TablePagination
              component="div"
              count={pagination.total}
              page={pagination.page}
              onPageChange={(_, newPage) => fetchTrips({ page: newPage })}
              rowsPerPage={pagination.pageSize}
              onRowsPerPageChange={(event) => {
                const newSize = parseInt(event.target.value, 10);
                metricsCache.current = {};
                fetchTrips({ page: 0, size: newSize });
              }}
              rowsPerPageOptions={[5, 10, 25, 50]}
              labelRowsPerPage="Trips per page:"
              sx={{
                borderTop: '1px solid #ECECEC',
                '& .MuiTablePagination-selectLabel': { fontSize: '0.75rem' },
                '& .MuiTablePagination-displayedRows': { fontSize: '0.75rem' },
                '& .MuiTablePagination-select': { fontSize: '0.75rem' },
                '& .MuiTablePagination-actions button': { fontSize: '0.75rem' },
              }}
            />
          )}
        </Paper>

        {/* Modals */}
        {showCreateModal && (
          <TripForm
            open={showCreateModal}
            mode="create"
            onClose={() => setShowCreateModal(false)}
            onSuccess={handleModalClose(() => setShowCreateModal(false))}
          />
        )}

        {showEditModal && selectedTrip && (
          <TripForm
            open={showEditModal}
            mode="edit"
            initialData={selectedTrip}
            onClose={() => setShowEditModal(false)}
            onSuccess={handleModalClose(() => setShowEditModal(false))}
          />
        )}

        {showMetricsModal && selectedTrip && (
          <TripMetricsForm
            open={showMetricsModal}
            tripId={selectedTrip.id}
            tripData={selectedTrip}
            onClose={() => setShowMetricsModal(false)}
            onSuccess={handleMetricsSuccess}
          />
        )}

        {showDetailsModal && selectedTrip && (
          <TripDetails
            open={showDetailsModal}
            tripId={selectedTrip.id}
            onClose={() => setShowDetailsModal(false)}
            onUpdate={() => {
              metricsCache.current = {};
              fetchTrips({ page: pagination.page });
            }}
          />
        )}

        {showNoticeWizard && selectedTripForNotice && (
          <TripNoticeWizard
            open={showNoticeWizard}
            onClose={handleCloseNoticeWizard}
            trip={selectedTripForNotice}
            onSuccess={() => {
              showNotification('Notice submitted successfully!', 'success');
              handleCloseNoticeWizard();
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
      </Box>
    </Box>
  );
}

export default TripList;
