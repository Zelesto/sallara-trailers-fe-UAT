import { useEffect, useState, useCallback } from 'react';
import dayjs from 'dayjs';
import { tripService } from '../services/tripService';
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
  Warning as WarningIcon, LocationCity, PinDrop, SwapHoriz
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

// Status Chip Component
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
        border: `1px solid ${config.color}20`,
        '& .MuiChip-icon': { fontSize: '1rem' }
      }}
      icon={<span>{config.icon}</span>}
    />
  );
};

// Location Display Component with Popover
const LocationDisplay = ({ city, zipCode, province, fullAddress, type }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  
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
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <LocationCity fontSize="small" sx={{ fontSize: 14, color: 'text.secondary' }} />
          <Typography variant="body2">
            {city || 'Unknown'}
          </Typography>
          {zipCode && (
            <Typography variant="caption" color="text.secondary">
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
        <Box sx={{ p: 2, maxWidth: 300 }}>
          <Typography variant="subtitle2" gutterBottom>
            {type === 'origin' ? '📍 Origin Details' : '🏁 Destination Details'}
          </Typography>
          <Divider sx={{ my: 1 }} />
          <Stack spacing={1}>
            <Box>
              <Typography variant="caption" color="text.secondary">City</Typography>
              <Typography variant="body2">{city || '-'}</Typography>
            </Box>
            {zipCode && (
              <Box>
                <Typography variant="caption" color="text.secondary">Postal Code</Typography>
                <Typography variant="body2">{zipCode}</Typography>
              </Box>
            )}
            {province && (
              <Box>
                <Typography variant="caption" color="text.secondary">Province</Typography>
                <Typography variant="body2">{province}</Typography>
              </Box>
            )}
            {fullAddress && (
              <Box>
                <Typography variant="caption" color="text.secondary">Full Address</Typography>
                <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
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

  const [selectedTrip, setSelectedTrip] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMetricsModal, setShowMetricsModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const [pagination, setPagination] = useState({
    page: 0,
    pageSize: 10,
    total: 0,
  });

  // Get unique cities for filter dropdown
  const uniqueCities = [...new Set(trips.map(trip => trip.originCity).filter(Boolean))];

  /* ================================
     Fetch Trips
  ================================= */
  const fetchTrips = useCallback(async ({
    page = 0,
    size = pagination.pageSize,
    search = searchText,
    status = statusFilter,
    city = cityFilter
  } = {}) => {
    setLoading(true);

    try {
      const response = await tripService.getAllTrips({
        page,
        size,
        ...(search && { search }),
        ...(status !== 'all' && { status }),
        ...(city && { city })
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
  }, [pagination.pageSize, searchText, statusFilter, cityFilter]);

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
  }, [searchText, statusFilter, cityFilter]);

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

  const handleReportIncident = (trip) => {
    const incidentType = prompt('Enter incident type (ACCIDENT, BREAKDOWN, TRAFFIC, WEATHER, HEALTH, REST, FUEL_STOP, LOADING, DOCUMENT, OTHER):');
    if (!incidentType) return;

    const description = prompt('Enter incident description:');
    if (!description) return;

    const severity = prompt('Enter severity (LOW, MEDIUM, HIGH, CRITICAL):', 'MEDIUM');
    const location = prompt('Enter location (optional):');
    const requiresAssistance = confirm('Does this require immediate assistance?');

    tripService.reportIncident(trip.id, {
      incidentType,
      description,
      severity,
      location: location || undefined,
      requiresAssistance
    })
      .then(() => {
        showNotification('Incident reported successfully!', 'success');
        fetchTrips({ page: pagination.page });
      })
      .catch(err => {
        console.error('Error reporting incident:', err);
        const errorMsg = err.message || 'Failed to report incident';
        showNotification(errorMsg, 'error');
      });
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
  };

  /* ================================
     Loading Screen
  ================================= */
  if (loading && trips.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress size={60} />
      </Box>
    );
  }

  /* ================================
     UI
  ================================= */
  return (
    <Box sx={{ p: 3 }}>
      {/* Notification Alert */}
      {notification && (
        <Alert 
          severity={notification.type} 
          sx={{ mb: 2 }}
          onClose={() => setNotification(null)}
        >
          {notification.message}
        </Alert>
      )}

      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Trip Management
          </Typography>
          <Typography variant="subtitle2" color="text.secondary">
            Total trips: {pagination.total}
          </Typography>
        </Box>

        <Box display="flex" gap={1}>
          <Button
            startIcon={<Refresh />}
            onClick={() => fetchTrips({ page: pagination.page })}
            variant="outlined"
          >
            Refresh
          </Button>

          <Button
            startIcon={<Add />}
            onClick={() => setShowCreateModal(true)}
            variant="contained"
          >
            New Trip
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
            <TextField
              size="small"
              label="Search"
              placeholder="Trip #, City, Address..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              InputProps={{
                startAdornment: (
                  <SearchIcon fontSize="small" sx={{ mr: 1 }} />
                )
              }}
              sx={{ minWidth: 250 }}
            />

            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Status"
              >
                <MenuItem value="all">All Statuses</MenuItem>
                {STATUS_OPTIONS.map(status => (
                  <MenuItem key={status} value={status}>
                    {STATUS_CONFIG[status]?.label || status}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {uniqueCities.length > 0 && (
              <FormControl size="small" sx={{ minWidth: 180 }}>
                <InputLabel>Filter by City</InputLabel>
                <Select
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                  label="Filter by City"
                >
                  <MenuItem value="">All Cities</MenuItem>
                  {uniqueCities.map(city => (
                    <MenuItem key={city} value={city}>{city}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            <Button 
              onClick={handleClearFilters}
              disabled={!searchText && statusFilter === 'all' && !cityFilter}
              variant="outlined"
              size="small"
            >
              Clear Filters
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Trip Number</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell><strong>Origin</strong></TableCell>
              <TableCell><strong>Destination</strong></TableCell>
              <TableCell><strong>Distance</strong></TableCell>
              <TableCell><strong>Planned Start</strong></TableCell>
              <TableCell><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {trips.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                  <Typography color="text.secondary">
                    {searchText || statusFilter !== 'all' || cityFilter
                      ? 'No trips match your filters'
                      : 'No trips found'}
                  </Typography>
                  {(searchText || statusFilter !== 'all' || cityFilter) && (
                    <Button 
                      onClick={handleClearFilters}
                      sx={{ mt: 1 }}
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
                    <TableCell>
                      <Typography fontWeight="medium">
                        {trip.tripNumber}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <StatusChip status={trip.status} />
                    </TableCell>

                    <TableCell>
                      <LocationDisplay
                        city={trip.originCity}
                        zipCode={trip.originZipCode}
                        province={trip.originProvince}
                        fullAddress={trip.originLocation}
                        type="origin"
                      />
                    </TableCell>

                    <TableCell>
                      <LocationDisplay
                        city={trip.destinationCity}
                        zipCode={trip.destinationZipCode}
                        province={trip.destinationProvince}
                        fullAddress={trip.destinationLocation}
                        type="destination"
                      />
                    </TableCell>

                    <TableCell>
                      {trip.metrics?.totalDistanceKm ? (
                        <Tooltip title="Distance traveled">
                          <Chip
                            size="small"
                            label={`${trip.metrics.totalDistanceKm} km`}
                            variant="outlined"
                          />
                        </Tooltip>
                      ) : trip.plannedDistanceKm ? (
                        <Tooltip title="Planned distance">
                          <Chip
                            size="small"
                            label={`${trip.plannedDistanceKm} km (planned)`}
                            variant="outlined"
                            sx={{ opacity: 0.7 }}
                          />
                        </Tooltip>
                      ) : (
                        '-'
                      )}
                    </TableCell>

                    <TableCell>
                      {trip.plannedStartDate
                        ? dayjs(trip.plannedStartDate).format('YYYY-MM-DD HH:mm')
                        : '-'}
                    </TableCell>

                    <TableCell>
                      <Box display="flex" gap={0.5}>
                        {/* Start Trip Button */}
                        {canStart && (
                          <Tooltip title="Start Trip">
                            <IconButton 
                              size="small"
                              color="success"
                              onClick={() => handleStartTrip(trip)}
                            >
                              <PlayArrow fontSize="small" />
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
                            >
                              <Stop fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}

                        {/* Report Incident Button */}
                        {canReportIncident && (
                          <Tooltip title="Report Incident">
                            <IconButton 
                              size="small"
                              color="warning"
                              onClick={() => handleReportIncident(trip)}
                            >
                              <WarningIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}

                        {/* View Details */}
                        <Tooltip title="View Details">
                          <IconButton 
                            size="small" 
                            onClick={() => handleViewTrip(trip)}
                          >
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        {/* Edit Trip */}
                        {canEdit && (
                          <Tooltip title="Edit Trip">
                            <IconButton 
                              size="small" 
                              onClick={() => handleEditTrip(trip)}
                            >
                              <Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}

                        {/* Trip Metrics */}
                        <Tooltip title="Trip Metrics">
                          <IconButton 
                            size="small" 
                            onClick={() => handleOpenMetrics(trip)}
                          >
                            <Dashboard fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        {/* Finalize Trip */}
                        {canFinalize && (
                          <Tooltip title="Finalize Trip">
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => handleFinalizeTrip(trip)}
                            >
                              <CheckCircle fontSize="small" />
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
                            >
                              <Delete fontSize="small" />
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

      {/* Pagination */}
      {trips.length > 0 && (
        <Paper sx={{ p: 1 }}>
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
