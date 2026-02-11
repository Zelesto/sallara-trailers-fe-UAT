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
  TablePagination, TextField, Alert, Avatar, Stack, Badge
} from '@mui/material';

import {
  Add, Edit, Delete, Visibility, CheckCircle, Refresh,
  Search as SearchIcon, Dashboard, PlayArrow, Stop, Pause,
  Person as PersonIcon, LocalShipping as LocalShippingIcon,
  Check as CheckIcon, Schedule as ScheduleIcon
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

  const [selectedTrip, setSelectedTrip] = useState(null);
  const [selectedTripId, setSelectedTripId] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMetricsModal, setShowMetricsModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

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
      showNotification('Failed to load trips', 'error');
      setTrips([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.pageSize, searchText, statusFilter]);

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
  }, [searchText, statusFilter]);

  /* ================================
     Trip Actions
  ================================= */
  const handleAction = async (action, trip) => {
    try {
      switch (action) {
        case 'start':
          await tripService.startTrip(trip.id);
          showNotification('Trip started successfully!', 'success');
          break;
        case 'end':
          await tripService.endTrip(trip.id);
          showNotification('Trip ended successfully!', 'success');
          break;
        case 'pause':
          setSelectedTripId(trip.id);
          showNotification('Pause trip functionality coming soon', 'info');
          return;
        case 'resume':
          await tripService.resumeTrip(trip.id);
          showNotification('Trip resumed successfully!', 'success');
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
          showNotification('Trip finalized successfully!', 'success');
          break;
        case 'delete':
          if (!window.confirm('Are you sure you want to delete this trip? This action cannot be undone.')) return;
          await tripService.deleteTrip(trip.id);
          showNotification('Trip deleted successfully', 'success');
          break;
        default:
          console.warn('Unknown action:', action);
          return;
      }

      // Refresh list after action
      setTimeout(() => {
        fetchTrips({ page: pagination.page });
      }, 500);

    } catch (err) {
      console.error(`Error in ${action} action:`, err);
      showNotification(`Failed to ${action} trip`, 'error');
    }
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
          onClose={() => showNotification(null)}
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
        <CardContent sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            size="small"
            label="Search"
            placeholder="Trip #, Origin, Destination..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            InputProps={{
              startAdornment: (
                <SearchIcon fontSize="small" sx={{ mr: 1 }} />
              )
            }}
            sx={{ width: 250 }}
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

          <Button 
            onClick={() => {
              setSearchText('');
              setStatusFilter('all');
            }}
            disabled={!searchText && statusFilter === 'all'}
          >
            Clear Filters
          </Button>
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
              <TableCell><strong>Start Date</strong></TableCell>
              <TableCell><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {trips.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                  <Typography color="text.secondary">
                    {searchText || statusFilter !== 'all'
                      ? 'No trips match your filters'
                      : 'No trips found'}
                  </Typography>
                  {(searchText || statusFilter !== 'all') && (
                    <Button 
                      onClick={() => {
                        setSearchText('');
                        setStatusFilter('all');
                      }} 
                      sx={{ mt: 1 }}
                    >
                      Clear Filters
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              trips.map(trip => (
                <TableRow key={trip.id} hover>
                  <TableCell>
                    <Typography fontWeight="medium">
                      {trip.tripNumber}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <StatusChip status={trip.status} />
                  </TableCell>

                  <TableCell>{trip.originLocation}</TableCell>
                  <TableCell>{trip.destinationLocation}</TableCell>

                  <TableCell>
                    {trip.plannedStartDate
                      ? dayjs(trip.plannedStartDate).format('YYYY-MM-DD HH:mm')
                      : '-'}
                  </TableCell>

                  <TableCell>
                    <Box display="flex" gap={0.5}>
                      <Tooltip title="View Details">
                        <IconButton 
                          size="small" 
                          onClick={() => handleAction('view', trip)}
                        >
                          <Visibility fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Edit Trip">
                        <IconButton 
                          size="small" 
                          onClick={() => handleAction('edit', trip)}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Trip Metrics">
                        <IconButton 
                          size="small" 
                          onClick={() => handleAction('metrics', trip)}
                        >
                          <Dashboard fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      {(trip.status !== 'COMPLETED' && trip.status !== 'CLOSED') && (
                        <Tooltip title="Finalize Trip">
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => handleAction('finalize', trip)}
                          >
                            <CheckCircle fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}

                      <Tooltip title="Delete Trip">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleAction('delete', trip)}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
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
    </Box>
  );
}

export default TripList;
