// src/pages/TripList.jsx
import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import dayjs from 'dayjs';
import { tripService } from '../services/tripService';
import TripNoticeWizard from '../components/TripNoticeWizard';
import TripForm from './TripForm';
import TripMetricsForm from './TripMetricsForm';
import TripDetails from './TripDetails';

import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Typography, CircularProgress, Box, Select, MenuItem, FormControl, InputLabel,
  Chip, IconButton, Button, Card, CardContent, Tooltip,
  TablePagination, TextField, Alert, Stack, Popover, Divider,
  Avatar, LinearProgress, Badge, Collapse, Fade, Grow,
  Grid,  // ✅ ADD THIS
} from '@mui/material';

import {
  Add, Edit, Delete, Visibility, CheckCircle, Refresh,
  Search as SearchIcon, Dashboard, PlayArrow, Stop,
  Warning as WarningIcon, LocationCity,
  Person as PersonIcon, Business as BusinessIcon,
  Receipt, Assignment, DirectionsCar,
  ArrowBack, Close, FilterList, Clear,
  Route as RouteIcon, CalendarToday, Speed, LocalGasStation,
  Star, StarBorder, MoreVert, Download, Print,
} from '@mui/icons-material';
/* ============================================================
   CONSTANTS & CONFIGURATIONS
   ============================================================ */

export const STATUS_CONFIG = {
  DRAFT: { color: '#9e9e9e', bgColor: '#f5f5f5', label: 'Draft', icon: '✏️' },
  PLANNED: { color: '#0288d1', bgColor: '#e3f2fd', label: 'Planned', icon: '📅' },
  ASSIGNED: { color: '#7b1fa2', bgColor: '#f3e5f5', label: 'Assigned', icon: '👤' },
  IN_PROGRESS: { color: '#ed6c02', bgColor: '#fff3e0', label: 'In Progress', icon: '🚚' },
  ACTIVE: { color: '#2e7d32', bgColor: '#e8f5e8', label: 'Active', icon: '✅' },
  PENDING: { color: '#ff9800', bgColor: '#fff3e0', label: 'Pending', icon: '⏳' },
  COMPLETED: { color: '#0097a7', bgColor: '#e0f7fa', label: 'Completed', icon: '🏁' },
  CANCELLED: { color: '#d32f2f', bgColor: '#ffebee', label: 'Cancelled', icon: '❌' },
  CLOSED: { color: '#5d4037', bgColor: '#efebe9', label: 'Closed', icon: '🔒' },
  FINALIZED: { color: '#388e3c', bgColor: '#e8f5e8', label: 'Finalized', icon: '📊' }
};

export const STATUS_OPTIONS = Object.keys(STATUS_CONFIG);

const STATUS_KEYS = {
  CAN_START: ['PLANNED', 'ASSIGNED', 'DRAFT'],
  CAN_END: ['IN_PROGRESS', 'ACTIVE'],
  CAN_REPORT_INCIDENT: ['IN_PROGRESS', 'ACTIVE'],
  CAN_FINALIZE: ['COMPLETED'],
  CAN_EDIT: ['DRAFT', 'PLANNED', 'ASSIGNED', 'IN_PROGRESS', 'ACTIVE', 'PENDING'],
  CAN_DELETE: ['DRAFT', 'PLANNED', 'ASSIGNED', 'PENDING']
};

/* ============================================================
   UI COMPONENTS
   ============================================================ */

const StatusChip = ({ status }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.DRAFT;
  
  return (
    <Chip
      label={config.label}
      size="small"
      sx={{
        backgroundColor: config.bgColor,
        color: config.color,
        fontWeight: 600,
        fontSize: '0.65rem',
        height: 22,
        border: `1px solid ${config.color}20`,
        '& .MuiChip-label': { px: 1, py: 0.25 },
        '& .MuiChip-icon': { fontSize: '0.8rem', ml: 0.5 }
      }}
      icon={<span>{config.icon}</span>}
    />
  );
};

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
          <LocationCity sx={{ fontSize: 12, color: 'text.secondary' }} />
          <Typography sx={{ fontSize: '0.75rem' }}>{displayCity}</Typography>
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
    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
      {label}
    </Typography>
    <Typography variant="body2" sx={{ fontSize: '0.75rem', wordBreak: 'break-word' }}>
      {value}
    </Typography>
  </Box>
);

const StatCard = ({ title, value, subtitle, icon, color = '#4F46E5', loading }) => (
  <Paper
    elevation={0}
    sx={{
      p: 2,
      borderRadius: '12px',
      border: '1px solid #ECECEC',
      backgroundColor: '#FFFFFF',
      height: '100%',
      transition: 'all 0.2s ease',
      '&:hover': {
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        transform: 'translateY(-2px)',
      },
    }}
  >
    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
      <Box>
        <Typography variant="caption" sx={{ color: '#6B7280', fontWeight: 500, textTransform: 'uppercase', fontSize: '0.6rem', letterSpacing: '0.5px' }}>
          {title}
        </Typography>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#111827', mt: 0.5 }}>
          {value || 'N/A'}
        </Typography>
        {subtitle && (
          <Typography variant="caption" sx={{ color: '#6B7280', display: 'block', mt: 0.5, fontSize: '0.65rem' }}>
            {subtitle}
          </Typography>
        )}
      </Box>
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
        {icon}
      </Box>
    </Stack>
  </Paper>
);

const useSimpleNotification = () => {
  const [notification, setNotification] = useState(null);
  const showNotification = useCallback((message, type = 'info') => {
    setNotification({ message, type });
    const timer = setTimeout(() => setNotification(null), 3000);
    return () => clearTimeout(timer);
  }, []);
  return { notification, showNotification };
};

/* ============================================================
   MAIN COMPONENT
   ============================================================ */

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
  
  const fetchTimerRef = useRef(null);

  const uniqueCities = useMemo(
    () => [...new Set(trips.map(t => t.originCity).filter(Boolean))],
    [trips]
  );

  const uniqueCustomers = useMemo(
    () => [...new Set(trips.map(t => t.customer?.name || t.customerName).filter(Boolean))],
    [trips]
  );

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
      
      if (search) params.search = search;
      if (status !== 'all') params.status = status;
      if (city) params.city = city;

      console.log('📤 Fetching trips with params:', params);

      const response = await tripService.getAllTrips(params);
      
      console.log('📥 Response:', {
        page: response.number,
        totalElements: response.totalElements,
        totalPages: response.totalPages,
        contentLength: response.content?.length
      });

      setTrips(response.content || []);
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

  useEffect(() => {
    fetchTrips({ page: 0 });
  }, []);

  useEffect(() => {
    if (fetchTimerRef.current) clearTimeout(fetchTimerRef.current);
    fetchTimerRef.current = setTimeout(() => fetchTrips({ page: 0 }), 400);
    return () => clearTimeout(fetchTimerRef.current);
  }, [searchText, statusFilter, cityFilter, customerFilter]);

  const handleStartTrip = (trip) => {
    if (!window.confirm(`Start trip #${trip.tripNumber}?`)) return;
    
    const startOdometer = prompt('Enter starting odometer reading (km):');
    if (!startOdometer) return;

    tripService.startTrip(trip.id, { actualStartOdometer: parseFloat(startOdometer) })
      .then(() => {
        showNotification('Trip started successfully!', 'success');
        fetchTrips({ page: pagination.page });
      })
      .catch(err => {
        console.error('Error starting trip:', err);
        showNotification(err.message || 'Failed to start trip', 'error');
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
        showNotification('Trip ended successfully!', 'success');
        fetchTrips({ page: pagination.page });
      })
      .catch(err => {
        console.error('Error ending trip:', err);
        showNotification(err.message || 'Failed to end trip', 'error');
      });
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

  const handleViewTrip = (trip) => {
    setSelectedTrip(trip);
    setShowDetailsModal(true);
  };

  const handleEditTrip = (trip) => {
    setSelectedTrip(trip);
    setShowEditModal(true);
  };

  const handleOpenMetrics = (trip) => {
    setSelectedTrip(trip);
    setShowMetricsModal(true);
  };

  const handleFinalizeTrip = async (trip) => {
    if (!window.confirm('Are you sure you want to finalize this trip?')) return;
    
    try {
      await tripService.finalizeTrip(trip.id);
      showNotification('Trip finalized successfully!', 'success');
      fetchTrips({ page: pagination.page });
    } catch (err) {
      console.error('Error finalizing trip:', err);
      showNotification('Failed to finalize trip', 'error');
    }
  };

  const handleDeleteTrip = async (trip) => {
    if (!window.confirm('Are you sure you want to delete this trip? This action cannot be undone.')) return;
    
    try {
      await tripService.deleteTrip(trip.id);
      showNotification('Trip deleted successfully', 'success');
      fetchTrips({ page: 0 });
    } catch (err) {
      console.error('Error deleting trip:', err);
      showNotification('Failed to delete trip', 'error');
    }
  };

  const handleClearFilters = () => {
    setSearchText('');
    setStatusFilter('all');
    setCityFilter('');
    setCustomerFilter('');
  };

  const handleModalClose = (callback) => () => {
    callback();
    fetchTrips({ page: pagination.page });
  };

  const getTripDisplay = (trip) => ({
    customerName: trip.customer?.name || trip.customerName || 'N/A',
    vehicleReg: trip.vehicle?.registrationNumber || trip.vehicleRegistration || 'N/A',
    driverName: trip.driver 
      ? `${trip.driver.firstName || ''} ${trip.driver.lastName || ''}`.trim() 
      : trip.driverName || 'N/A',
    canStart: STATUS_KEYS.CAN_START.includes(trip.status),
    canEnd: STATUS_KEYS.CAN_END.includes(trip.status),
    canReport: STATUS_KEYS.CAN_REPORT_INCIDENT.includes(trip.status),
    canFinalize: STATUS_KEYS.CAN_FINALIZE.includes(trip.status),
    canEdit: STATUS_KEYS.CAN_EDIT.includes(trip.status),
    canDelete: STATUS_KEYS.CAN_DELETE.includes(trip.status)
  });

  const getTripCounts = useMemo(() => {
    const counts = { total: trips.length };
    trips.forEach(t => {
      counts[t.status] = (counts[t.status] || 0) + 1;
    });
    return counts;
  }, [trips]);

  if (loading && trips.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress size={40} />
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: '#F7F7FC', minHeight: '100vh', p: { xs: 2, md: 3 } }}>
      <Box sx={{ maxWidth: '1440px', margin: '0 auto' }}>
        {notification && (
          <Alert 
            severity={notification.type} 
            sx={{ mb: 2, borderRadius: '12px', fontSize: '0.8rem' }}
            onClose={() => setNotification(null)}
          >
            {notification.message}
          </Alert>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
          <Box>
            <Typography variant="h5" fontWeight="700" sx={{ fontSize: '1.25rem' }}>
              Trip Management
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
              Manage and track all trips • {pagination.total} total trips
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button
              startIcon={<Refresh sx={{ fontSize: '0.9rem' }} />}
              onClick={() => fetchTrips({ page: pagination.page })}
              variant="outlined"
              size="small"
              sx={{ fontSize: '0.75rem', py: 1, borderRadius: '10px', textTransform: 'none' }}
            >
              Refresh
            </Button>
            <Button
              startIcon={<Add sx={{ fontSize: '0.9rem' }} />}
              onClick={() => setShowCreateModal(true)}
              variant="contained"
              size="small"
              sx={{ 
                fontSize: '0.75rem', 
                py: 1, 
                borderRadius: '10px',
                textTransform: 'none',
                background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #4338CA 0%, #4F46E5 100%)',
                },
              }}
            >
              New Trip
            </Button>
          </Stack>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={3}>
            <StatCard
              title="Total Trips"
              value={pagination.total}
              subtitle="All trips"
              icon={<RouteIcon sx={{ color: '#4F46E5', fontSize: '1.3rem' }} />}
              color="#4F46E5"
            />
          </Grid>
          <Grid item xs={6} sm={3}>
            <StatCard
              title="Active"
              value={getTripCounts.ACTIVE || 0}
              subtitle="Currently active"
              icon={<DirectionsCar sx={{ color: '#22C55E', fontSize: '1.3rem' }} />}
              color="#22C55E"
            />
          </Grid>
          <Grid item xs={6} sm={3}>
            <StatCard
              title="In Progress"
              value={getTripCounts.IN_PROGRESS || 0}
              subtitle="Ongoing trips"
              icon={<Speed sx={{ color: '#F59E0B', fontSize: '1.3rem' }} />}
              color="#F59E0B"
            />
          </Grid>
          <Grid item xs={6} sm={3}>
            <StatCard
              title="Completed"
              value={getTripCounts.COMPLETED || 0}
              subtitle="Finished trips"
              icon={<CheckCircle sx={{ color: '#8B5CF6', fontSize: '1.3rem' }} />}
              color="#8B5CF6"
            />
          </Grid>
        </Grid>

        {/* Filters */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 3,
            borderRadius: '16px',
            border: '1px solid #ECECEC',
            bgcolor: '#FFFFFF',
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap>
            <TextField
              size="small"
              label="Search"
              placeholder="Trip #, City, Customer..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 0.5, fontSize: '0.9rem', color: 'text.secondary' }} />
              }}
              sx={{ 
                minWidth: 200, 
                '& .MuiInputLabel-root': { fontSize: '0.75rem' },
                '& .MuiInputBase-root': { fontSize: '0.8rem', borderRadius: '10px' },
              }}
            />

            <FormControl size="small" sx={{ minWidth: 130 }}>
              <InputLabel sx={{ fontSize: '0.75rem' }}>Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Status"
                sx={{ fontSize: '0.75rem', borderRadius: '10px' }}
              >
                <MenuItem value="all" sx={{ fontSize: '0.75rem' }}>All Statuses</MenuItem>
                {STATUS_OPTIONS.map(status => (
                  <MenuItem key={status} value={status} sx={{ fontSize: '0.75rem' }}>
                    {STATUS_CONFIG[status]?.label || status}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {uniqueCities.length > 0 && (
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <InputLabel sx={{ fontSize: '0.75rem' }}>City</InputLabel>
                <Select
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                  label="City"
                  sx={{ fontSize: '0.75rem', borderRadius: '10px' }}
                >
                  <MenuItem value="" sx={{ fontSize: '0.75rem' }}>All Cities</MenuItem>
                  {uniqueCities.map(city => (
                    <MenuItem key={city} value={city} sx={{ fontSize: '0.75rem' }}>{city}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {uniqueCustomers.length > 0 && (
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel sx={{ fontSize: '0.75rem' }}>Customer</InputLabel>
                <Select
                  value={customerFilter}
                  onChange={(e) => setCustomerFilter(e.target.value)}
                  label="Customer"
                  sx={{ fontSize: '0.75rem', borderRadius: '10px' }}
                >
                  <MenuItem value="" sx={{ fontSize: '0.75rem' }}>All Customers</MenuItem>
                  {uniqueCustomers.map(customer => (
                    <MenuItem key={customer} value={customer} sx={{ fontSize: '0.75rem' }}>{customer}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            <Button 
              onClick={handleClearFilters}
              disabled={!searchText && statusFilter === 'all' && !cityFilter && !customerFilter}
              variant="outlined"
              size="small"
              startIcon={<Clear sx={{ fontSize: '0.8rem' }} />}
              sx={{ fontSize: '0.7rem', py: 1, borderRadius: '10px', textTransform: 'none' }}
            >
              Clear Filters
            </Button>
          </Stack>
        </Paper>

        {/* Table */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: '16px',
            border: '1px solid #ECECEC',
            overflow: 'hidden',
            bgcolor: '#FFFFFF',
          }}
        >
          <TableContainer>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#F9FAFB' }}>
                <TableRow>
                  <TableCell sx={{ fontSize: '0.7rem', fontWeight: 600, color: '#6B7280', py: 1.5 }}>Trip #</TableCell>
                  <TableCell sx={{ fontSize: '0.7rem', fontWeight: 600, color: '#6B7280', py: 1.5 }}>Customer</TableCell>
                  <TableCell sx={{ fontSize: '0.7rem', fontWeight: 600, color: '#6B7280', py: 1.5 }}>Vehicle</TableCell>
                  <TableCell sx={{ fontSize: '0.7rem', fontWeight: 600, color: '#6B7280', py: 1.5 }}>Driver</TableCell>
                  <TableCell sx={{ fontSize: '0.7rem', fontWeight: 600, color: '#6B7280', py: 1.5 }}>Status</TableCell>
                  <TableCell sx={{ fontSize: '0.7rem', fontWeight: 600, color: '#6B7280', py: 1.5 }}>Origin</TableCell>
                  <TableCell sx={{ fontSize: '0.7rem', fontWeight: 600, color: '#6B7280', py: 1.5 }}>Destination</TableCell>
                  <TableCell sx={{ fontSize: '0.7rem', fontWeight: 600, color: '#6B7280', py: 1.5 }}>Distance</TableCell>
                  <TableCell sx={{ fontSize: '0.7rem', fontWeight: 600, color: '#6B7280', py: 1.5 }}>Date</TableCell>
                  <TableCell sx={{ fontSize: '0.7rem', fontWeight: 600, color: '#6B7280', py: 1.5 }}>Actions</TableCell>
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
                        <TableCell sx={{ fontSize: '0.75rem', py: 1 }}>
                          <Typography fontWeight="600" sx={{ fontSize: '0.75rem', color: '#4F46E5' }}>
                            {trip.tripNumber}
                          </Typography>
                          {trip.referenceNumber && (
                            <Typography variant="caption" sx={{ fontSize: '0.6rem', color: '#6B7280', display: 'block' }}>
                              REF: {trip.referenceNumber}
                            </Typography>
                          )}
                        </TableCell>

                        <TableCell sx={{ fontSize: '0.75rem', py: 1 }}>
                          {display.customerName !== 'N/A' ? (
                            <Typography sx={{ fontSize: '0.75rem' }}>{display.customerName}</Typography>
                          ) : (
                            <Typography color="text.secondary" sx={{ fontSize: '0.7rem' }}>N/A</Typography>
                          )}
                        </TableCell>

                        <TableCell sx={{ fontSize: '0.75rem', py: 1 }}>
                          {display.vehicleReg !== 'N/A' ? (
                            <Typography sx={{ fontSize: '0.75rem' }}>{display.vehicleReg}</Typography>
                          ) : (
                            <Typography color="text.secondary" sx={{ fontSize: '0.7rem' }}>N/A</Typography>
                          )}
                        </TableCell>

                        <TableCell sx={{ fontSize: '0.75rem', py: 1 }}>
                          {display.driverName !== 'N/A' ? (
                            <Typography sx={{ fontSize: '0.75rem' }}>{display.driverName}</Typography>
                          ) : (
                            <Typography color="text.secondary" sx={{ fontSize: '0.7rem' }}>N/A</Typography>
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

                        <TableCell sx={{ py: 0.5 }}>
                          {trip.plannedDistanceKm ? (
                            <Chip
                              size="small"
                              label={`${trip.plannedDistanceKm} km`}
                              variant="outlined"
                              sx={{ fontSize: '0.65rem', height: 20 }}
                            />
                          ) : (
                            <Typography sx={{ fontSize: '0.7rem', color: '#6B7280' }}>-</Typography>
                          )}
                        </TableCell>

                        <TableCell sx={{ fontSize: '0.7rem', py: 0.5 }}>
                          {trip.plannedStartDate 
                            ? dayjs(trip.plannedStartDate).format('DD MMM YYYY')
                            : '-'}
                        </TableCell>

                        <TableCell sx={{ py: 0.5 }}>
                          <Box display="flex" gap={0.25} flexWrap="wrap">
                            {display.canStart && (
                              <Tooltip title="Start Trip" arrow>
                                <IconButton size="small" color="success" onClick={() => handleStartTrip(trip)} sx={{ p: 0.5 }}>
                                  <PlayArrow sx={{ fontSize: '0.9rem' }} />
                                </IconButton>
                              </Tooltip>
                            )}

                            {display.canEnd && (
                              <Tooltip title="End Trip" arrow>
                                <IconButton size="small" color="error" onClick={() => handleEndTrip(trip)} sx={{ p: 0.5 }}>
                                  <Stop sx={{ fontSize: '0.9rem' }} />
                                </IconButton>
                              </Tooltip>
                            )}

                            {display.canReport && (
                              <Tooltip title="Add Notice" arrow>
                                <IconButton size="small" color="warning" onClick={() => handleOpenNoticeWizard(trip)} sx={{ p: 0.5 }}>
                                  <WarningIcon sx={{ fontSize: '0.9rem' }} />
                                </IconButton>
                              </Tooltip>
                            )}

                            <Tooltip title="View Details" arrow>
                              <IconButton size="small" onClick={() => handleViewTrip(trip)} sx={{ p: 0.5 }}>
                                <Visibility sx={{ fontSize: '0.9rem' }} />
                              </IconButton>
                            </Tooltip>

                            {display.canEdit && (
                              <Tooltip title="Edit Trip" arrow>
                                <IconButton size="small" onClick={() => handleEditTrip(trip)} sx={{ p: 0.5 }}>
                                  <Edit sx={{ fontSize: '0.9rem' }} />
                                </IconButton>
                              </Tooltip>
                            )}

                            <Tooltip title="Trip Metrics" arrow>
                              <IconButton size="small" onClick={() => handleOpenMetrics(trip)} sx={{ p: 0.5 }}>
                                <Dashboard sx={{ fontSize: '0.9rem' }} />
                              </IconButton>
                            </Tooltip>

                            {display.canFinalize && (
                              <Tooltip title="Finalize Trip" arrow>
                                <IconButton size="small" color="success" onClick={() => handleFinalizeTrip(trip)} sx={{ p: 0.5 }}>
                                  <CheckCircle sx={{ fontSize: '0.9rem' }} />
                                </IconButton>
                              </Tooltip>
                            )}

                            {display.canDelete && (
                              <Tooltip title="Delete Trip" arrow>
                                <IconButton size="small" color="error" onClick={() => handleDeleteTrip(trip)} sx={{ p: 0.5 }}>
                                  <Delete sx={{ fontSize: '0.9rem' }} />
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
            onSuccess={handleModalClose(() => setShowMetricsModal(false))}
          />
        )}

        {showDetailsModal && selectedTrip && (
          <TripDetails
            open={showDetailsModal}
            tripId={selectedTrip.id}
            onClose={() => setShowDetailsModal(false)}
            onUpdate={() => fetchTrips({ page: pagination.page })}
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
      </Box>
    </Box>
  );
}

export default TripList;
