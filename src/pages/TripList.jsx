import { useEffect, useState, useCallback, useMemo } from 'react';
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
  Warning as WarningIcon, LocationCity
} from '@mui/icons-material';

/* ================================
   Status Config
================================ */
export const STATUS_CONFIG = {
  DRAFT: { color: '#9e9e9e', bgColor: '#f5f5f5', label: 'Draft', icon: '✏️' },
  PLANNED: { color: '#0288d1', bgColor: '#e3f2fd', label: 'Planned', icon: '📅' },
  ASSIGNED: { color: '#7b1fa2', bgColor: '#f3e5f5', label: 'Assigned', icon: '👤' },
  IN_PROGRESS: { color: '#ed6c02', bgColor: '#fff3e0', label: 'In Progress', icon: '🚚' },
  ACTIVE: { color: '#2e7d32', bgColor: '#e8f5e8', label: 'Active', icon: '✅' },
  COMPLETED: { color: '#0097a7', bgColor: '#e0f7fa', label: 'Completed', icon: '🏁' },
  CANCELLED: { color: '#d32f2f', bgColor: '#ffebee', label: 'Cancelled', icon: '❌' }
};

export const STATUS_OPTIONS = Object.keys(STATUS_CONFIG);

/* ================================
   Status Chip
================================ */
const StatusChip = ({ status }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.DRAFT;

  return (
    <Chip
      size="small"
      label={config.label}
      icon={<span>{config.icon}</span>}
      sx={{
        backgroundColor: config.bgColor,
        color: config.color,
        fontWeight: 600
      }}
    />
  );
};

/* ================================
   Location Display FIXED
================================ */
const LocationDisplay = ({ city, zipCode, province, fullAddress, type }) => {
  const displayCity =
    city ||
    (fullAddress ? fullAddress.split(',')[0] : null) ||
    'No location';

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={0.5}>
        <LocationCity fontSize="small" sx={{ fontSize: 14, color: 'text.secondary' }} />
        <Typography variant="body2">
          {displayCity}
        </Typography>

        {zipCode && (
          <Typography variant="caption" color="text.secondary">
            ({zipCode})
          </Typography>
        )}
      </Stack>
    </Box>
  );
};

/* ================================
   Notification Hook
================================ */
const useSimpleNotification = () => {
  const [notification, setNotification] = useState(null);

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  return { notification, showNotification };
};

/* ================================
   MAIN
================================ */
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
    total: 0
  });

  /* ================================
     Derived filters
  ================================= */
  const uniqueCities = useMemo(() => {
    return [...new Set(trips.map(t => t.originCity).filter(Boolean))];
  }, [trips]);

  /* ================================
     Fetch Trips (FIXED DEPENDENCIES)
  ================================= */
  const fetchTrips = useCallback(async (params = {}) => {
    const page = params.page ?? pagination.page;
    const size = params.size ?? pagination.pageSize;

    setLoading(true);

    try {
      const response = await tripService.getAllTrips({
        page,
        size,
        ...(searchText && { search: searchText }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(cityFilter && { city: cityFilter })
      });

      setTrips(response.content || []);

      setPagination({
        page: response.number ?? page,
        pageSize: response.size ?? size,
        total: response.totalElements ?? 0
      });

    } catch (err) {
      console.error(err);
      showNotification('Failed to load trips', 'error');
      setTrips([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.pageSize, searchText, statusFilter, cityFilter]);

  /* ================================
     Initial Load
  ================================= */
  useEffect(() => {
    fetchTrips({ page: 0 });
  }, []);

  /* ================================
     Debounced filters
  ================================= */
  useEffect(() => {
    const t = setTimeout(() => {
      fetchTrips({ page: 0 });
    }, 400);

    return () => clearTimeout(t);
  }, [searchText, statusFilter, cityFilter]);

  /* ================================
     Actions
  ================================= */
  const handleClearFilters = () => {
    setSearchText('');
    setStatusFilter('all');
    setCityFilter('');
  };

  /* ================================
     UI
  ================================= */
  if (loading && trips.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>

      {/* Notification */}
      {notification && (
        <Alert severity={notification.type} sx={{ mb: 2 }}>
          {notification.message}
        </Alert>
      )}

      {/* Header */}
      <Box display="flex" justifyContent="space-between" mb={3}>
        <Typography variant="h4">Trip Management</Typography>

        <Box display="flex" gap={1}>
          <Button onClick={() => fetchTrips({ page: pagination.page })}>
            Refresh
          </Button>

          <Button variant="contained" onClick={() => setShowCreateModal(true)}>
            New Trip
          </Button>
        </Box>
      </Box>

      {/* Table */}
      <TableContainer component={Paper}>
        <Table>

          <TableHead>
            <TableRow>
              <TableCell>Trip</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Origin</TableCell>
              <TableCell>Destination</TableCell>
              <TableCell>Distance</TableCell>
              <TableCell>Start</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {trips.map(trip => (
              <TableRow key={trip.id} hover>

                <TableCell>
                  <Typography fontWeight={600}>
                    {trip.tripNumber}
                  </Typography>
                </TableCell>

                <TableCell>
                  <StatusChip status={trip.status} />
                </TableCell>

                {/* ✅ FIXED: no more "Unknown" spam */}
                <TableCell>
                  <LocationDisplay
                    city={trip.originCity}
                    zipCode={trip.originZipCode}
                    province={trip.originProvince}
                    fullAddress={trip.originLocation}
                  />
                </TableCell>

                <TableCell>
                  <LocationDisplay
                    city={trip.destinationCity}
                    zipCode={trip.destinationZipCode}
                    province={trip.destinationProvince}
                    fullAddress={trip.destinationLocation}
                  />
                </TableCell>

                <TableCell>
                  {trip.metrics?.totalDistanceKm
                    ? `${trip.metrics.totalDistanceKm} km`
                    : '-'}
                </TableCell>

                <TableCell>
                  {trip.plannedStartDate
                    ? dayjs(trip.plannedStartDate).format('YYYY-MM-DD HH:mm')
                    : '-'}
                </TableCell>

              </TableRow>
            ))}
          </TableBody>

        </Table>
      </TableContainer>

      {/* Pagination */}
      <TablePagination
        component="div"
        count={pagination.total}
        page={pagination.page}
        rowsPerPage={pagination.pageSize}
        onPageChange={(_, p) => fetchTrips({ page: p })}
        onRowsPerPageChange={(e) =>
          fetchTrips({ page: 0, size: parseInt(e.target.value, 10) })
        }
      />

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

    </Box>
  );
}

export default TripList;
