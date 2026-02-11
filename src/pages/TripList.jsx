import { useEffect, useState, useCallback } from 'react';
import dayjs from 'dayjs';
import { tripService } from '../services/tripService';
import TripForm from './TripForm';
import TripMetricsForm from './TripMetricsForm';
import TripDetails from './TripDetails';
import PauseTripDialog from './PauseTripDialog';

import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Typography, CircularProgress, Box, Select, MenuItem, FormControl, InputLabel,
  Chip, IconButton, Button, Card, CardContent, Tooltip, Alert,
  TablePagination, TextField, Stack, Badge, Avatar
} from '@mui/material';

import {
  Add, Edit, Delete, Visibility, CheckCircle, Refresh,
  Search as SearchIcon, Dashboard, PlayArrow, Stop, Pause,
  PlayArrow as PlayArrowIcon, Stop as StopIcon,
  Pause as PauseIcon, Resume as ResumeIcon,
  Warning as WarningIcon, Check as CheckIcon,
  Schedule as ScheduleIcon, Person as PersonIcon,
  LocalShipping as LocalShippingIcon
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';

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
  },
  PAUSED: {
    color: '#ff9800',
    bgColor: '#fff3e0',
    label: 'Paused',
    icon: '⏸️',
    description: 'Trip is temporarily paused'
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

// Action Buttons Component for each row
const TripActionButtons = ({ trip, onAction }) => {
  const canStart = ['PLANNED', 'ASSIGNED', 'DRAFT'].includes(trip.status);
  const canEnd = ['IN_PROGRESS', 'ACTIVE'].includes(trip.status);
  const canPause = ['IN_PROGRESS', 'ACTIVE'].includes(trip.status);
  const canResume = trip.status === 'PAUSED';
  const canFinalize = ['COMPLETED'].includes(trip.status);
  const canEdit = !['CANCELLED', 'FINALIZED', 'CLOSED'].includes(trip.status);
  const canDelete = !['IN_PROGRESS', 'ACTIVE', 'PAUSED'].includes(trip.status);

  return (
    <Stack direction="row" spacing={0.5} alignItems="center">
      {/* Start/End/Resume Button */}
      {(canStart || canEnd || canResume) && (
        <Tooltip title={canStart ? "Start Trip" : canEnd ? "End Trip" : "Resume Trip"}>
          <IconButton
            size="small"
            color={canStart ? "success" : canEnd ? "error" : "warning"}
            onClick={() => onAction(canStart ? 'start' : canEnd ? 'end' : 'resume', trip)}
            sx={{
              backgroundColor: canStart ? '#e8f5e8' : canEnd ? '#ffebee' : '#fff3e0',
              '&:hover': {
                backgroundColor: canStart ? '#d4edda' : canEnd ? '#f8d7da' : '#ffeaa7'
              }
            }}
          >
            {canStart ? <PlayArrow fontSize="small" /> : 
             canEnd ? <Stop fontSize="small" /> : 
             <PlayArrow fontSize="small" />}
          </IconButton>
        </Tooltip>
      )}

      {/* Pause Button */}
      {canPause && (
        <Tooltip title="Pause Trip">
          <IconButton
            size="small"
            color="warning"
            onClick={() => onAction('pause', trip)}
            sx={{
              backgroundColor: '#fff3e0',
              '&:hover': { backgroundColor: '#ffeaa7' }
            }}
          >
            <Pause fontSize="small" />
          </IconButton>
        </Tooltip>
      )}

      {/* View Details */}
      <Tooltip title="View Details">
        <IconButton
          size="small"
          color="info"
          onClick={() => onAction('view', trip)}
          sx={{
            backgroundColor: '#e3f2fd',
            '&:hover': { backgroundColor: '#bbdefb' }
          }}
        >
          <Visibility fontSize="small" />
        </IconButton>
      </Tooltip>

      {/* Edit Button */}
      {canEdit && (
        <Tooltip title="Edit Trip">
          <IconButton
            size="small"
            color="primary"
            onClick={() => onAction('edit', trip)}
            sx={{
              backgroundColor: '#e3f2fd',
              '&:hover': { backgroundColor: '#bbdefb' }
            }}
          >
            <Edit fontSize="small" />
          </IconButton>
        </Tooltip>
      )}

      {/* Metrics Button */}
      <Tooltip title="Trip Metrics">
        <IconButton
          size="small"
          color="secondary"
          onClick={() => onAction('metrics', trip)}
          sx={{
            backgroundColor: '#f3e5f5',
            '&:hover': { backgroundColor: '#e1bee7' }
          }}
        >
          <Dashboard fontSize="small" />
        </IconButton>
      </Tooltip>

      {/* Finalize Button */}
      {canFinalize && (
        <Tooltip title="Finalize Trip">
          <IconButton
            size="small"
            color="success"
            onClick={() => onAction('finalize', trip)}
            sx={{
              backgroundColor: '#e8f5e8',
              '&:hover': { backgroundColor: '#d4edda' }
            }}
          >
            <CheckCircle fontSize="small" />
          </IconButton>
        </Tooltip>
      )}

      {/* Delete Button */}
      {canDelete && (
        <Tooltip title="Delete Trip">
          <IconButton
            size="small"
            color="error"
            onClick={() => onAction('delete', trip)}
            sx={{
              backgroundColor: '#ffebee',
              '&:hover': { backgroundColor: '#f8d7da' }
            }}
          >
            <Delete fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </Stack>
  );
};

function TripList() {
  const { enqueueSnackbar } = useSnackbar();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [selectedTrip, setSelectedTrip] = useState(null);
  const [selectedTripId, setSelectedTripId] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMetricsModal, setShowMetricsModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showPauseDialog, setShowPauseDialog] = useState(false);

  const [pagination, setPagination] = useState({
    page: 0,
    pageSize: 10,
    total: 0,
  });

  /* ================================
     Fetch Trips
  ================================= */
  const fetchTrips = useCallback(async ({
    page = 0,
    size = pagination.pageSize,
    search = searchText,
    status = statusFilter
  } = {}) => {
    setLoading(true);

    try {
      const response = await tripService.getAllTrips({
        page,
        size,
        ...(search && { search }),
        ...(status !== 'all' && { status })
      });

      setTrips(response.content || []);
      setPagination({
        page: response.number ?? page,
        pageSize: response.size ?? size,
        total: response.totalElements ?? 0
      });

    } catch (err) {
      console.error('Error fetching trips:', err);
      enqueueSnackbar('Failed to load trips', { variant: 'error' });
      setTrips([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.pageSize, searchText, statusFilter, enqueueSnackbar]);

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
  }, [searchText, statusFilter, fetchTrips]);

  /* ================================
     Pagination
  ================================= */
  const handlePageChange = (_, newPage) => {
    fetchTrips({ page: newPage });
  };

  const handleRowsPerPageChange = (event) => {
    const newSize = parseInt(event.target.value, 10);
    fetchTrips({ page: 0, size: newSize });
  };

  /* ================================
     Trip Actions
  ================================= */
  const handleAction = async (action, trip) => {
    try {
      switch (action) {
        case 'start':
          await tripService.startTrip(trip.id);
          enqueueSnackbar('Trip started successfully!', { variant: 'success' });
          break;
        case 'end':
          await tripService.endTrip(trip.id);
          enqueueSnackbar('Trip ended successfully!', { variant: 'success' });
          break;
        case 'pause':
          setSelectedTripId(trip.id);
          setShowPauseDialog(true);
          return; // Don't refresh yet
        case 'resume':
          await tripService.resumeTrip(trip.id);
          enqueueSnackbar('Trip resumed successfully!', { variant: 'success' });
          break;
        case 'view':
          setSelectedTrip(trip);
          setShowDetailsModal(true);
          return;
        case 'edit':
          setSelectedTrip(trip);
          setShowEditModal(true);
          return;
        case 'metrics':
          setSelectedTrip(trip);
          setShowMetricsModal(true);
          return;
        case 'finalize':
          await tripService.finalizeTrip(trip.id);
          enqueueSnackbar('Trip finalized successfully!', { variant: 'success' });
          break;
        case 'delete':
          if (!window.confirm('Are you sure you want to delete this trip? This action cannot be undone.')) return;
          await tripService.deleteTrip(trip.id);
          enqueueSnackbar('Trip deleted successfully', { variant: 'success' });
          break;
        default:
          console.warn('Unknown action:', action);
          return;
      }

      // Refresh list after action (except for view/edit/metrics)
      setTimeout(() => {
        fetchTrips({ page: pagination.page });
      }, 500);

    } catch (err) {
      console.error(`Error in ${action} action:`, err);
      enqueueSnackbar(`Failed to ${action} trip`, { variant: 'error' });
    }
  };

  const handlePauseSubmit = async (pauseData) => {
    try {
      await tripService.pauseTrip(selectedTripId, pauseData);
      setShowPauseDialog(false);
      enqueueSnackbar('Trip paused successfully', { variant: 'success' });
      
      setTimeout(() => {
        fetchTrips({ page: pagination.page });
      }, 500);
    } catch (err) {
      console.error('Error pausing trip:', err);
      enqueueSnackbar('Failed to pause trip', { variant: 'error' });
    }
  };

  const handleClearFilters = () => {
    setSearchText('');
    setStatusFilter('all');
  };

  /* ================================
     Stats Summary
  ================================= */
  const getTripStats = () => {
    const activeTrips = trips.filter(t => ['IN_PROGRESS', 'ACTIVE', 'PAUSED'].includes(t.status)).length;
    const completedTrips = trips.filter(t => t.status === 'COMPLETED').length;
    const plannedTrips = trips.filter(t => t.status === 'PLANNED').length;
    
    return { activeTrips, completedTrips, plannedTrips };
  };

  const stats = getTripStats();

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
      {/* Header with Stats */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Trip Management
          </Typography>
          <Stack direction="row" spacing={3}>
            <Box display="flex" alignItems="center" gap={1}>
              <Badge badgeContent={stats.activeTrips} color="error">
                <LocalShippingIcon color="action" />
              </Badge>
              <Typography variant="body2" color="text.secondary">
                Active Trips
              </Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={1}>
              <Badge badgeContent={stats.completedTrips} color="success">
                <CheckIcon color="action" />
              </Badge>
              <Typography variant="body2" color="text.secondary">
                Completed
              </Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={1}>
              <Badge badgeContent={stats.plannedTrips} color="info">
                <ScheduleIcon color="action" />
              </Badge>
              <Typography variant="body2" color="text.secondary">
                Planned
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              Total: {pagination.total} trips
            </Typography>
          </Stack>
        </Box>

        <Stack direction="row" spacing={1}>
          <Button
            startIcon={<Refresh />}
            onClick={() => fetchTrips({ page: pagination.page })}
            variant="outlined"
            disabled={loading}
          >
            Refresh
          </Button>

          <Button
            startIcon={<Add />}
            onClick={() => setShowCreateModal(true)}
            variant="contained"
            color="primary"
            sx={{
              background: 'linear-gradient(45deg, #1976d2 30%, #21CBF3 90%)',
              boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
            }}
          >
            New Trip
          </Button>
        </Stack>
      </Box>

      {/* Quick Stats Card */}
      <Card sx={{ mb: 3, bgcolor: '#f8fafc' }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <Box sx={{ textAlign: 'center', p: 2 }}>
                <Chip
                  label="Active"
                  color="error"
                  variant="outlined"
                  sx={{ mb: 1 }}
                />
                <Typography variant="h4" fontWeight="bold">
                  {stats.activeTrips}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Trips in progress
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box sx={{ textAlign: 'center', p: 2 }}>
                <Chip
                  label="Completed"
                  color="success"
                  variant="outlined"
                  sx={{ mb: 1 }}
                />
                <Typography variant="h4" fontWeight="bold">
                  {stats.completedTrips}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Finished trips
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box sx={{ textAlign: 'center', p: 2 }}>
                <Chip
                  label="Planned"
                  color="info"
                  variant="outlined"
                  sx={{ mb: 1 }}
                />
                <Typography variant="h4" fontWeight="bold">
                  {stats.plannedTrips}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Scheduled trips
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Filters Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center">
            <TextField
              size="small"
              label="Search Trips"
              placeholder="Trip #, Origin, Destination, Driver..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
              }}
              sx={{ width: 300 }}
            />

            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Filter by Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Filter by Status"
              >
                <MenuItem value="all">All Statuses</MenuItem>
                {STATUS_OPTIONS.map(status => (
                  <MenuItem key={status} value={status}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: STATUS_CONFIG[status]?.color }} />
                      {STATUS_CONFIG[status]?.label || status}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Button 
              onClick={handleClearFilters}
              variant="text"
              disabled={!searchText && statusFilter === 'all'}
            >
              Clear Filters
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* Table */}
      <TableContainer component={Paper} elevation={2}>
        <Table>
          <TableHead sx={{ bgcolor: '#f5f5f5' }}>
            <TableRow>
              <TableCell><strong>Trip #</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell><strong>Origin</strong></TableCell>
              <TableCell><strong>Destination</strong></TableCell>
              <TableCell><strong>Driver/Vehicle</strong></TableCell>
              <TableCell><strong>Start Date</strong></TableCell>
              <TableCell><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {trips.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <LocalShippingIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      No trips found
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {searchText || statusFilter !== 'all'
                        ? 'No trips match your search criteria'
                        : 'Start by creating your first trip'}
                    </Typography>
                    {(searchText || statusFilter !== 'all') && (
                      <Button onClick={handleClearFilters} variant="outlined" sx={{ mt: 1 }}>
                        Clear Filters
                      </Button>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              trips.map(trip => (
                <TableRow 
                  key={trip.id} 
                  hover
                  sx={{
                    '&:hover': { bgcolor: 'action.hover' },
                    borderLeft: trip.status === 'ACTIVE' || trip.status === 'IN_PROGRESS' 
                      ? '4px solid #2e7d32' 
                      : trip.status === 'PAUSED'
                      ? '4px solid #ff9800'
                      : '4px solid transparent'
                  }}
                >
                  <TableCell>
                    <Typography fontWeight="bold" color="primary">
                      {trip.tripNumber}
                    </Typography>
                    {trip.priority === 'HIGH' && (
                      <Chip label="HIGH PRIORITY" size="small" color="error" sx={{ mt: 0.5 }} />
                    )}
                  </TableCell>

                  <TableCell>
                    <StatusChip status={trip.status} />
                  </TableCell>

                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {trip.originLocation}
                    </Typography>
                    {trip.originCity && (
                      <Typography variant="caption" color="text.secondary">
                        {trip.originCity}
                      </Typography>
                    )}
                  </TableCell>

                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {trip.destinationLocation}
                    </Typography>
                    {trip.destinationCity && (
                      <Typography variant="caption" color="text.secondary">
                        {trip.destinationCity}
                      </Typography>
                    )}
                  </TableCell>

                  <TableCell>
                    <Stack spacing={0.5}>
                      {trip.driver && (
                        <Box display="flex" alignItems="center" gap={1}>
                          <Avatar sx={{ width: 24, height: 24, bgcolor: '#0288d1' }}>
                            <PersonIcon sx={{ fontSize: 14 }} />
                          </Avatar>
                          <Typography variant="body2">
                            {trip.driver.name || trip.driver}
                          </Typography>
                        </Box>
                      )}
                      {trip.vehicle && (
                        <Box display="flex" alignItems="center" gap={1}>
                          <LocalShippingIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                          <Typography variant="body2">
                            {trip.vehicle.registrationNumber || trip.vehicle}
                          </Typography>
                        </Box>
                      )}
                    </Stack>
                  </TableCell>

                  <TableCell>
                    <Typography variant="body2">
                      {trip.plannedStartDate
                        ? dayjs(trip.plannedStartDate).format('DD MMM YYYY')
                        : '-'}
                    </Typography>
                    {trip.plannedStartDate && (
                      <Typography variant="caption" color="text.secondary">
                        {dayjs(trip.plannedStartDate).format('HH:mm')}
                      </Typography>
                    )}
                  </TableCell>

                  <TableCell>
                    <TripActionButtons trip={trip} onAction={handleAction} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      {trips.length > 0 && (
        <Paper sx={{ p: 1, mt: 2, borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
          <TablePagination
            component="div"
            count={pagination.total}
            page={pagination.page}
            onPageChange={handlePageChange}
            rowsPerPage={pagination.pageSize}
            onRowsPerPageChange={handleRowsPerPageChange}
            rowsPerPageOptions={[5, 10, 25, 50]}
            labelRowsPerPage="Trips per page:"
          />
        </Paper>
      )}

      {/* Modals */}
      {showCreateModal && (
        <TripForm
          open={showCreateModal}
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
          tripId={selectedTrip.id}
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

      {/* Pause Trip Dialog */}
      <PauseTripDialog
        open={showPauseDialog}
        onClose={() => setShowPauseDialog(false)}
        onSubmit={handlePauseSubmit}
      />
    </Box>
  );
}

// Add this missing import for Grid
import { Grid } from '@mui/material';

export default TripList;
