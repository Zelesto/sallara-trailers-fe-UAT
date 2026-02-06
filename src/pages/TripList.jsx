import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { tripService } from '../services/tripService';
import TripForm from './TripForm';
import TripMetricsForm from './TripMetricsForm';
import TripDetails from './TripDetails';

import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Typography, CircularProgress, Box, Select, MenuItem, FormControl, InputLabel,
  Chip, IconButton, Button, Card, CardContent, Tooltip,
  TablePagination, TextField
} from '@mui/material';

import {
  Add, Edit, Delete, Visibility, CheckCircle, Refresh,
  Search as SearchIcon
} from '@mui/icons-material';

const statusColors = {
  PLANNED: '#0288d1',
  ACTIVE: '#2e7d32',
  IN_PROGRESS: '#ed6c02',
  COMPLETED: '#0097a7',
  CLOSED: '#7b1fa2',
  CANCELLED: '#d32f2f'
};

function TripList() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(false);

  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

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

  /* =============================
     Fetch Trips
  ============================== */
  const fetchTrips = async ({
    page = 0,
    size = pagination.pageSize,
    search = searchText,
    status = statusFilter,
  } = {}) => {
    setLoading(true);
    try {
      const response = await tripService.getAllTrips({
        page,
        size,
        ...(search && { search }),
        ...(status !== 'all' && { status }),
      });

      setTrips(response.content);

      setPagination({
        page: response.number,
        pageSize: response.size,
        total: response.totalElements,
      });
    } catch (err) {
      console.error('Failed to fetch trips:', err);
      setTrips([]);
    } finally {
      setLoading(false);
    }
  };

  /* =============================
     Initial Load
  ============================== */
  useEffect(() => {
    fetchTrips();
  }, []);

  /* =============================
     Debounced Filters
  ============================== */
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTrips({ page: 0 });
    }, 400);

    return () => clearTimeout(timer);
  }, [searchText, statusFilter]);

  /* =============================
     Pagination Handlers
  ============================== */
  const handlePageChange = (_, newPage) => {
    fetchTrips({ page: newPage });
  };

  const handleRowsPerPageChange = (event) => {
    const newSize = parseInt(event.target.value, 10);
    fetchTrips({ page: 0, size: newSize });
  };

  /* =============================
     Actions
  ============================== */
  const handleFinalizeTrip = async (id) => {
    try {
      await tripService.finalizeTrip(id);
      fetchTrips({ page: pagination.page });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTrip = async (id) => {
    if (!window.confirm('Delete this trip?')) return;
    try {
      await tripService.deleteTrip(id);
      fetchTrips({ page: 0 });
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearFilters = () => {
    setSearchText('');
    setStatusFilter('all');
  };

  /* =============================
     UI
  ============================== */

  if (loading && trips.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box m={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4">Trip Management</Typography>
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
            Create Trip
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            size="small"
            label="Search"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            InputProps={{
              startAdornment: (
                <SearchIcon fontSize="small" sx={{ mr: 1 }} />
              ),
            }}
          />

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              label="Status"
            >
              <MenuItem value="all">All</MenuItem>
              {Object.keys(statusColors).map((s) => (
                <MenuItem key={s} value={s}>{s}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button onClick={handleClearFilters}>
            Clear
          </Button>
        </CardContent>
      </Card>

      {/* Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Trip #</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell><strong>Origin</strong></TableCell>
              <TableCell><strong>Destination</strong></TableCell>
              <TableCell><strong>Start</strong></TableCell>
              <TableCell><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {trips.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No trips found
                </TableCell>
              </TableRow>
            ) : (
              trips.map((trip) => (
                <TableRow key={trip.id} hover>
                  <TableCell>{trip.tripNumber}</TableCell>
                  <TableCell>
                    <Chip
                      label={trip.status}
                      size="small"
                      sx={{
                        bgcolor: statusColors[trip.status],
                        color: '#fff',
                      }}
                    />
                  </TableCell>
                  <TableCell>{trip.originLocation}</TableCell>
                  <TableCell>{trip.destinationLocation}</TableCell>
                  <TableCell>
                    {trip.plannedStartDate
                      ? dayjs(trip.plannedStartDate).format('YYYY-MM-DD HH:mm')
                      : '-'}
                  </TableCell>
                  <TableCell>
                    <IconButton onClick={() => setShowDetailsModal(true)}>
                      <Visibility fontSize="small" />
                    </IconButton>
                    <IconButton onClick={() => {
                      setSelectedTrip(trip);
                      setShowEditModal(true);
                    }}>
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton
                      onClick={() => handleFinalizeTrip(trip.id)}
                      color="success"
                    >
                      <CheckCircle fontSize="small" />
                    </IconButton>
                    <IconButton
                      onClick={() => handleDeleteTrip(trip.id)}
                      color="error"
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={pagination.total}
        page={pagination.page}
        onPageChange={handlePageChange}
        rowsPerPage={pagination.pageSize}
        onRowsPerPageChange={handleRowsPerPageChange}
        rowsPerPageOptions={[5, 10, 25, 50]}
      />

      {/* Modals */}
      {showCreateModal && (
        <TripForm
          open
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => fetchTrips({ page: 0 })}
        />
      )}

      {showEditModal && selectedTrip && (
        <TripForm
          open
          mode="edit"
          tripId={selectedTrip.id}
          initialData={selectedTrip}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => fetchTrips({ page: pagination.page })}
        />
      )}

      {showDetailsModal && selectedTrip && (
        <TripDetails
          open
          tripId={selectedTrip.id}
          onClose={() => setShowDetailsModal(false)}
          onUpdate={() => fetchTrips({ page: pagination.page })}
        />
      )}
    </Box>
  );
}

export default TripList;
