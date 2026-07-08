// src/pages/TripList.jsx
import { useEffect, useState, useCallback, useMemo } from 'react';
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
  TablePagination, TextField, Alert, Stack, Popover, Divider
} from '@mui/material';

import {
  Add, Edit, Delete, Visibility, CheckCircle, Refresh,
  Search as SearchIcon, Dashboard, PlayArrow, Stop,
  Warning as WarningIcon, LocationCity, PinDrop, SwapHoriz,
  Person as PersonIcon, Business as BusinessIcon, LocalShipping,
  Receipt, Assignment, DirectionsCar
} from '@mui/icons-material';

/* ================================
   Status Configuration
================================ */
export const STATUS_CONFIG = {
  DRAFT: {
    color: '#9e9e9e',
    bgColor: '#f5f5f5',
    label: 'Draft',
    icon: '✏️',
    description: 'Trip is in draft stage'
  },
  PLANNED: {
    color: '#0288d1',
    bgColor: '#e3f2fd',
    label: 'Planned',
    icon: '📅',
    description: 'Trip is scheduled'
  },
  ASSIGNED: {
    color: '#7b1fa2',
    bgColor: '#f3e5f5',
    label: 'Assigned',
    icon: '👤',
    description: 'Driver assigned to trip'
  },
  IN_PROGRESS: {
    color: '#ed6c02',
    bgColor: '#fff3e0',
    label: 'In Progress',
    icon: '🚚',
    description: 'Trip is currently active'
  },
  ACTIVE: {
    color: '#2e7d32',
    bgColor: '#e8f5e8',
    label: 'Active',
    icon: '✅',
    description: 'Trip is active and ongoing'
  },
  PENDING: {
    color: '#ff9800',
    bgColor: '#fff3e0',
    label: 'Pending',
    icon: '⏳',
    description: 'Awaiting confirmation'
  },
  COMPLETED: {
    color: '#0097a7',
    bgColor: '#e0f7fa',
    label: 'Completed',
    icon: '🏁',
    description: 'Trip finished successfully'
  },
  CANCELLED: {
    color: '#d32f2f',
    bgColor: '#ffebee',
    label: 'Cancelled',
    icon: '❌',
    description: 'Trip was cancelled'
  },
  CLOSED: {
    color: '#5d4037',
    bgColor: '#efebe9',
    label: 'Closed',
    icon: '🔒',
    description: 'Trip is closed'
  },
  FINALIZED: {
    color: '#388e3c',
    bgColor: '#e8f5e8',
    label: 'Finalized',
    icon: '📊',
    description: 'Trip is finalized and invoiced'
  }
};

export const STATUS_OPTIONS = Object.keys(STATUS_CONFIG);

// Status Chip Component - Smaller version
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
        fontSize: '0.7rem',
        height: 22,
        border: `1px solid ${config.color}20`,
        '& .MuiChip-label': { px: 1, py: 0.25 },
        '& .MuiChip-icon': { fontSize: '0.8rem', ml: 0.5 }
      }}
      icon={<span>{config.icon}</span>}
    />
  );
};

// Location Display Component with Popover - Smaller version
const LocationDisplay = ({ city, zipCode, province, fullAddress, type }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  
  const displayCity = city || 
    (fullAddress ? fullAddress.split(',')[0] : null) || 
    'No location provided';
  
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleClose = () => {
    setAnchorEl(null);
  };
  
  const open = Boolean(anchorEl);
  
  return (
    <>
      <Box 
        onClick={handleClick}
        sx={{ 
          cursor: 'pointer',
          '&:hover': { 
            textDecoration: 'underline',
            color: 'primary.main'
          }
        }}
      >
        <Stack direction="row" alignItems="center" spacing={0.25}>
          <LocationCity fontSize="small" sx={{ fontSize: 12, color: 'text.secondary' }} />
          <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
            {displayCity}
          </Typography>
          {zipCode && (
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
              ({zipCode})
            </Typography>
          )}
        </Stack>
      </Box>
      
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
      >
        <Box sx={{ p: 1.5, maxWidth: 280 }}>
          <Typography variant="subtitle2" sx={{ fontSize: '0.8rem' }} gutterBottom>
            {type === 'origin' ? '📍 Origin Details' : '🏁 Destination Details'}
          </Typography>
          <Divider sx={{ my: 0.75 }} />
          <Stack spacing={0.75}>
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>City</Typography>
              <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>{displayCity}</Typography>
            </Box>
            {zipCode && (
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>Postal Code</Typography>
                <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>{zipCode}</Typography>
              </Box>
            )}
            {province && (
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>Province</Typography>
                <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>{province}</Typography>
              </Box>
            )}
            {fullAddress && (
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>Full Address</Typography>
                <Typography variant="body2" sx={{ fontSize: '0.75rem', wordBreak: 'break-word' }}>
                  {fullAddress}
                </Typography>
              </Box>
            )}
          </Stack>
        </Box>
      </Popover>
    </>
  );
};

// Simple notification state
const useSimpleNotification = () => {
  const [notification, setNotification] = useState(null);

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  return { notification, showNotification };
};

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

  // ⭐ Trip Notice Wizard State - MOVED TO MAIN COMPONENT
  const [showNoticeWizard, setShowNoticeWizard] = useState(false);
  const [noticeType, setNoticeType] = useState(null);
  const [noticeSubtype, setNoticeSubtype] = useState(null);
  const [selectedTripForNotice, setSelectedTripForNotice] = useState(null);

  const [pagination, setPagination] = useState({
    page: 0,
    pageSize: 10,
    total: 0,
  });

  // Get unique cities and customers for filter dropdowns
  const uniqueCities = useMemo(() => {
    return [...new Set(trips.map(trip => trip.originCity).filter(Boolean))];
  }, [trips]);

  const uniqueCustomers = useMemo(() => {
    return [...new Set(trips.map(trip => trip.customerName).filter(Boolean))];
  }, [trips]);

  /* ================================
     Fetch Trips - NEWEST FIRST
  ================================= */
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
      const response = await tripService.getAllTrips({
        page,
        size,
        ...(search && { search }),
        ...(status !== 'all' && { status }),
        ...(city && { city }),
        ...(customer && { customer }),
        sortBy: 'id',
        sortOrder: 'DESC'
      });

      // The backend should already sort by ID desc, but keep this as fallback
      const sortedContent = (response.content || []).sort((a, b) => b.id - a.id);

      setTrips(sortedContent);
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
  }, [pagination.pageSize, searchText, statusFilter, cityFilter, customerFilter]);

  /* ================================
     Initial Load
  ================================= */
  useEffect(() => {
    fetchTrips({ page: 0 });
  }, []);

  /* ================================
     Debounced Filters
  ================================= */
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTrips({ page: 0 });
    }, 400);

    return () => clearTimeout(timer);
  }, [searchText, statusFilter, cityFilter, customerFilter]);

  /* ================================
     Trip Actions
  ================================= */
  const handleStartTrip = (trip) => {
    if (window.confirm(`Start trip #${trip.tripNumber}?`)) {
      const startOdometer = prompt('Enter starting odometer reading (km):');
      if (startOdometer) {
        tripService.startTrip(trip.id, { actualStartOdometer: parseFloat(startOdometer) })
          .then(() => {
            showNotification('Trip started successfully!', 'success');
            fetchTrips({ page: pagination.page });
          })
          .catch(err => {
            console.error('Error starting trip:', err);
            const errorMsg = err.message || 'Failed to start trip';
            showNotification(errorMsg, 'error');
          });
      }
    }
  };

  const handleEndTrip = (trip) => {
    if (window.confirm(`End trip #${trip.tripNumber}?`)) {
      const endOdometer = prompt('Enter ending odometer reading (km):');
      if (endOdometer) {
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
            const errorMsg = err.message || 'Failed to end trip';
            showNotification(errorMsg, 'error');
          });
      }
    }
  };

  // ⭐ Trip Notice Wizard Handlers - MOVED TO MAIN COMPONENT
  const handleOpenNoticeWizard = (trip, type = null, subtype = null) => {
    setSelectedTripForNotice(trip);
    setNoticeType(type);
    setNoticeSubtype(subtype);
    setShowNoticeWizard(true);
  };

  const handleCloseNoticeWizard = () => {
    setShowNoticeWizard(false);
    setSelectedTripForNotice(null);
    setNoticeType(null);
    setNoticeSubtype(null);
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

  /* ================================
     Loading Screen
  ================================= */
  if (loading && trips.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress size={40} />
      </Box>
    );
  }

  /* ================================
     UI - Smaller and Compact
  ================================= */
  return (
    <Box sx={{ p: 1.5 }}>
      {/* Notification Alert */}
      {notification && (
        <Alert 
          severity={notification.type} 
          sx={{ mb: 1.5, fontSize: '0.8rem' }}
          onClose={() => setNotification(null)}
        >
          {notification.message}
        </Alert>
      )}

      {/* Header - Smaller */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Box>
          <Typography variant="h6" fontWeight="bold" sx={{ fontSize: '1.1rem' }}>
            Trip Management
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
            Total trips: {pagination.total}
          </Typography>
        </Box>

        <Box display="flex" gap={0.75}>
          <Button
            startIcon={<Refresh sx={{ fontSize: '0.9rem' }} />}
            onClick={() => fetchTrips({ page: pagination.page })}
            variant="outlined"
            size="small"
            sx={{ fontSize: '0.75rem', py: 0.5 }}
          >
            Refresh
          </Button>

          <Button
            startIcon={<Add sx={{ fontSize: '0.9rem' }} />}
            onClick={() => setShowCreateModal(true)}
            variant="contained"
            size="small"
            sx={{ fontSize: '0.75rem', py: 0.5 }}
          >
            New Trip
          </Button>
        </Box>
      </Box>

      {/* Filters - Compact with Customer Filter */}
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
          <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap>
            <TextField
              size="small"
              label="Search"
              placeholder="Trip #, City, Customer..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              InputProps={{
                startAdornment: (
                  <SearchIcon fontSize="small" sx={{ mr: 0.5, fontSize: '0.9rem' }} />
                ),
                sx: { fontSize: '0.75rem' }
              }}
              sx={{ minWidth: 200, '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
            />

            <FormControl size="small" sx={{ minWidth: 130 }}>
              <InputLabel sx={{ fontSize: '0.75rem' }}>Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Status"
                sx={{ fontSize: '0.75rem' }}
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
                <InputLabel sx={{ fontSize: '0.75rem' }}>Filter by City</InputLabel>
                <Select
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                  label="Filter by City"
                  sx={{ fontSize: '0.75rem' }}
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
                  sx={{ fontSize: '0.75rem' }}
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
              sx={{ fontSize: '0.7rem', py: 0.5 }}
            >
              Clear Filters
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* Table - Compact with Customer, REF#, PO#, Vehicle, Driver Columns */}
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontSize: '0.7rem', fontWeight: 600, py: 1 }}>Trip Number</TableCell>
              <TableCell sx={{ fontSize: '0.7rem', fontWeight: 600, py: 1 }}>Customer</TableCell>
              <TableCell sx={{ fontSize: '0.7rem', fontWeight: 600, py: 1 }}>REF#</TableCell>
              <TableCell sx={{ fontSize: '0.7rem', fontWeight: 600, py: 1 }}>PO#</TableCell>
              <TableCell sx={{ fontSize: '0.7rem', fontWeight: 600, py: 1 }}>Vehicle</TableCell>
              <TableCell sx={{ fontSize: '0.7rem', fontWeight: 600, py: 1 }}>Driver</TableCell>
              <TableCell sx={{ fontSize: '0.7rem', fontWeight: 600, py: 1 }}>Status</TableCell>
              <TableCell sx={{ fontSize: '0.7rem', fontWeight: 600, py: 1 }}>Origin</TableCell>
              <TableCell sx={{ fontSize: '0.7rem', fontWeight: 600, py: 1 }}>Destination</TableCell>
              <TableCell sx={{ fontSize: '0.7rem', fontWeight: 600, py: 1 }}>Distance</TableCell>
              <TableCell sx={{ fontSize: '0.7rem', fontWeight: 600, py: 1 }}>Planned Start</TableCell>
              <TableCell sx={{ fontSize: '0.7rem', fontWeight: 600, py: 1 }}>Actions</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {trips.length === 0 ? (
              <TableRow>
                <TableCell colSpan={12} align="center" sx={{ py: 2 }}>
                  <Typography color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                    {searchText || statusFilter !== 'all' || cityFilter || customerFilter
                      ? 'No trips match your filters'
                      : 'No trips found'}
                  </Typography>
                  {(searchText || statusFilter !== 'all' || cityFilter || customerFilter) && (
                    <Button 
                      onClick={handleClearFilters}
                      sx={{ mt: 1, fontSize: '0.7rem' }}
                      size="small"
                    >
                      Clear Filters
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              trips.map(trip => {
                const canStart = ['PLANNED', 'ASSIGNED', 'DRAFT'].includes(trip.status);
                const canEnd = ['IN_PROGRESS', 'ACTIVE'].includes(trip.status);
                const canReportIncident = ['IN_PROGRESS', 'ACTIVE'].includes(trip.status);
                const canFinalize = trip.status === 'COMPLETED';
                const canEdit = !['CANCELLED', 'FINALIZED', 'CLOSED', 'COMPLETED'].includes(trip.status);
                const canDelete = !['IN_PROGRESS', 'ACTIVE'].includes(trip.status);
                
                return (
                  <TableRow key={trip.id} hover>
                    <TableCell sx={{ fontSize: '0.75rem', py: 0.75 }}>
                      <Typography fontWeight="medium" sx={{ fontSize: '0.75rem' }}>
                        {trip.tripNumber}
                      </Typography>
                    </TableCell>

                    {/* Customer Column */}
                    <TableCell sx={{ fontSize: '0.75rem', py: 0.75 }}>
                      {trip.customerName ? (
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          <BusinessIcon sx={{ fontSize: '0.8rem', color: 'text.secondary' }} />
                          <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                            {trip.customerName}
                          </Typography>
                        </Stack>
                      ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                          N/A
                        </Typography>
                      )}
                    </TableCell>

                    {/* REF# Column */}
                    <TableCell sx={{ fontSize: '0.75rem', py: 0.75 }}>
                      {trip.referenceNumber ? (
                        <Tooltip title="Reference Number">
                          <Stack direction="row" alignItems="center" spacing={0.5}>
                            <Receipt sx={{ fontSize: '0.8rem', color: 'text.secondary' }} />
                            <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                              {trip.referenceNumber}
                            </Typography>
                          </Stack>
                        </Tooltip>
                      ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                          —
                        </Typography>
                      )}
                    </TableCell>

                    {/* PO# Column */}
                    <TableCell sx={{ fontSize: '0.75rem', py: 0.75 }}>
                      {trip.poNumber ? (
                        <Tooltip title="Purchase Order Number">
                          <Stack direction="row" alignItems="center" spacing={0.5}>
                            <Assignment sx={{ fontSize: '0.8rem', color: 'text.secondary' }} />
                            <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                              {trip.poNumber}
                            </Typography>
                          </Stack>
                        </Tooltip>
                      ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                          —
                        </Typography>
                      )}
                    </TableCell>

                    {/* Vehicle Column */}
                    <TableCell sx={{ fontSize: '0.75rem', py: 0.75 }}>
                      {trip.vehicle ? (
                        <Tooltip title={`Vehicle: ${trip.vehicle.registrationNumber || 'N/A'}`}>
                          <Stack direction="row" alignItems="center" spacing={0.5}>
                            <DirectionsCar sx={{ fontSize: '0.8rem', color: 'text.secondary' }} />
                            <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                              {trip.vehicle.registrationNumber || 'N/A'}
                            </Typography>
                          </Stack>
                        </Tooltip>
                      ) : trip.vehicleRegistrationNumber ? (
                        // Fallback if vehicle object is not available but registration number is
                        <Tooltip title="Vehicle Registration">
                          <Stack direction="row" alignItems="center" spacing={0.5}>
                            <DirectionsCar sx={{ fontSize: '0.8rem', color: 'text.secondary' }} />
                            <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                              {trip.vehicleRegistrationNumber}
                            </Typography>
                          </Stack>
                        </Tooltip>
                      ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                          N/A
                        </Typography>
                      )}
                    </TableCell>

                    {/* Driver Column */}
                    <TableCell sx={{ fontSize: '0.75rem', py: 0.75 }}>
                      {trip.driver ? (
                        <Tooltip title={`Driver: ${trip.driver.firstName || ''} ${trip.driver.lastName || ''}`}>
                          <Stack direction="row" alignItems="center" spacing={0.5}>
                            <PersonIcon sx={{ fontSize: '0.8rem', color: 'text.secondary' }} />
                            <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                              {trip.driver.firstName || ''} {trip.driver.lastName || ''}
                            </Typography>
                          </Stack>
                        </Tooltip>
                      ) : trip.driverName ? (
                        // Fallback if driver object is not available but name is
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          <PersonIcon sx={{ fontSize: '0.8rem', color: 'text.secondary' }} />
                          <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                            {trip.driverName}
                          </Typography>
                        </Stack>
                      ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                          N/A
                        </Typography>
                      )}
                    </TableCell>

                    <TableCell sx={{ py: 0.75 }}>
                      <StatusChip status={trip.status} />
                    </TableCell>

                    <TableCell sx={{ py: 0.75 }}>
                      <LocationDisplay
                        city={trip.originCity}
                        zipCode={trip.originZipCode}
                        province={trip.originProvince}
                        fullAddress={trip.originLocation}
                        type="origin"
                      />
                    </TableCell>

                    <TableCell sx={{ py: 0.75 }}>
                      <LocationDisplay
                        city={trip.destinationCity}
                        zipCode={trip.destinationZipCode}
                        province={trip.destinationProvince}
                        fullAddress={trip.destinationLocation}
                        type="destination"
                      />
                    </TableCell>

                    <TableCell sx={{ py: 0.75 }}>
                      {trip.metrics?.totalDistanceKm ? (
                        <Tooltip title="Distance traveled">
                          <Chip
                            size="small"
                            label={`${trip.metrics.totalDistanceKm} km`}
                            variant="outlined"
                            sx={{ fontSize: '0.65rem', height: 20 }}
                          />
                        </Tooltip>
                      ) : trip.plannedDistanceKm ? (
                        <Tooltip title="Planned distance">
                          <Chip
                            size="small"
                            label={`${trip.plannedDistanceKm} km`}
                            variant="outlined"
                            sx={{ fontSize: '0.65rem', height: 20, opacity: 0.7 }}
                          />
                        </Tooltip>
                      ) : (
                        <Typography sx={{ fontSize: '0.7rem' }}>-</Typography>
                      )}
                    </TableCell>

                    <TableCell sx={{ fontSize: '0.7rem', py: 0.75 }}>
                      {trip.plannedStartDate
                        ? dayjs(trip.plannedStartDate).format('MMM DD, HH:mm')
                        : '-'}
                    </TableCell>

                    <TableCell sx={{ py: 0.75 }}>
                      <Box display="flex" gap={0.25} flexWrap="wrap">
                        {/* Start Trip Button */}
                        {canStart && (
                          <Tooltip title="Start Trip">
                            <IconButton 
                              size="small"
                              color="success"
                              onClick={() => handleStartTrip(trip)}
                              sx={{ p: 0.5 }}
                            >
                              <PlayArrow sx={{ fontSize: '0.9rem' }} />
                            </IconButton>
                          </Tooltip>
                        )}

                        {/* End Trip Button */}
                        {canEnd && (
                          <Tooltip title="End Trip">
                            <IconButton 
                              size="small"
                              color="error"
                              onClick={() => handleEndTrip(trip)}
                              sx={{ p: 0.5 }}
                            >
                              <Stop sx={{ fontSize: '0.9rem' }} />
                            </IconButton>
                          </Tooltip>
                        )}

                        {/* Report Incident Button - Now opens TripNoticeWizard */}
                        {canReportIncident && (
                          <Tooltip title="Add Notice (Incident/Voucher/AE)">
                            <IconButton 
                              size="small"
                              color="warning"
                              onClick={() => handleOpenNoticeWizard(trip)}
                              sx={{ p: 0.5 }}
                            >
                              <WarningIcon sx={{ fontSize: '0.9rem' }} />
                            </IconButton>
                          </Tooltip>
                        )}

                        {/* View Details */}
                        <Tooltip title="View Details">
                          <IconButton 
                            size="small" 
                            onClick={() => handleViewTrip(trip)}
                            sx={{ p: 0.5 }}
                          >
                            <Visibility sx={{ fontSize: '0.9rem' }} />
                          </IconButton>
                        </Tooltip>

                        {/* Edit Trip */}
                        {canEdit && (
                          <Tooltip title="Edit Trip">
                            <IconButton 
                              size="small" 
                              onClick={() => handleEditTrip(trip)}
                              sx={{ p: 0.5 }}
                            >
                              <Edit sx={{ fontSize: '0.9rem' }} />
                            </IconButton>
                          </Tooltip>
                        )}

                        {/* Trip Metrics */}
                        <Tooltip title="Trip Metrics">
                          <IconButton 
                            size="small" 
                            onClick={() => handleOpenMetrics(trip)}
                            sx={{ p: 0.5 }}
                          >
                            <Dashboard sx={{ fontSize: '0.9rem' }} />
                          </IconButton>
                        </Tooltip>

                        {/* Finalize Trip */}
                        {canFinalize && (
                          <Tooltip title="Finalize Trip">
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => handleFinalizeTrip(trip)}
                              sx={{ p: 0.5 }}
                            >
                              <CheckCircle sx={{ fontSize: '0.9rem' }} />
                            </IconButton>
                          </Tooltip>
                        )}

                        {/* Delete Trip */}
                        {canDelete && (
                          <Tooltip title="Delete Trip">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteTrip(trip)}
                              sx={{ p: 0.5 }}
                            >
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

      {/* ⭐ Trip Notice Wizard - MOVED HERE */}
      {showNoticeWizard && selectedTripForNotice && (
        <TripNoticeWizard
          open={showNoticeWizard}
          onClose={handleCloseNoticeWizard}
          trip={selectedTripForNotice}
          initialType={noticeType}
          initialSubtype={noticeSubtype}
          onSuccess={() => {
            showNotification('Notice submitted successfully!', 'success');
            handleCloseNoticeWizard();
          }}
        />
      )}

      {/* Pagination - Compact */}
      {trips.length > 0 && (
        <Paper sx={{ p: 0.5 }}>
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
              '& .MuiTablePagination-selectLabel': { fontSize: '0.75rem' },
              '& .MuiTablePagination-displayedRows': { fontSize: '0.75rem' },
              '& .MuiTablePagination-select': { fontSize: '0.75rem' },
              '& .MuiTablePagination-actions button': { fontSize: '0.75rem' },
            }}
          />
        </Paper>
      )}

      {/* Modals */}
      {showCreateModal && (
        <TripForm
          open={showCreateModal}
          mode="create"
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchTrips({ page: 0 });
          }}
        />
      )}

      {showEditModal && selectedTrip && (
        <TripForm
          open={showEditModal}
          mode="edit"
          initialData={selectedTrip}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            setShowEditModal(false);
            fetchTrips({ page: pagination.page });
          }}
        />
      )}

      {showMetricsModal && selectedTrip && (
        <TripMetricsForm
          open={showMetricsModal}
          tripId={selectedTrip.id}
          tripData={selectedTrip}
          onClose={() => setShowMetricsModal(false)}
          onSuccess={() => {
            setShowMetricsModal(false);
            fetchTrips({ page: pagination.page });
          }}
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
    </Box>
  );
}

export default TripList;
