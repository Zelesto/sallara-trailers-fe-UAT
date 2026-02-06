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
  TablePagination, TextField
} from '@mui/material';
import {
  Add, Edit, Delete, Visibility, CheckCircle, Dashboard, FileDownload, Refresh,
  Search as SearchIcon
} from '@mui/icons-material';

// Status colors mapping
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
  const [loading, setLoading] = useState(true);
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

  const fetchTrips = useCallback(async (page = 0, size = pagination.pageSize) => {
    setLoading(true);
    try {
      const params = {
        page,
        size
      };
      
      // Add optional filters
      if (searchText.trim()) {
        params.search = searchText;
      }
      
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      console.log('Calling tripService.getAllTrips with:', params);
      const response = await tripService.getAllTrips(params);
      console.log('Response from service:', response);

      setTrips(response.content || []);
      setPagination({
        page: response.number || page,
        pageSize: response.size || size,
        total: response.totalElements || 0
      });
    } catch (err) {
      console.error('Error fetching trips:', err);
      alert(`Failed to load trips: ${err.message}`);
      setTrips([]);
    } finally {
      setLoading(false);
    }
  }, [searchText, statusFilter, pagination.pageSize]);

  // Initial fetch
  useEffect(() => {
    fetchTrips(0);
  }, []);

  // Handle pagination changes
  const handlePageChange = (event, newPage) => {
    fetchTrips(newPage);
  };

  const handleRowsPerPageChange = (event) => {
    const newSize = parseInt(event.target.value, 10);
    setPagination(prev => ({ ...prev, pageSize: newSize }));
    fetchTrips(0, newSize);
  };

  // Handle filter changes with debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchTrips(0);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [searchText, statusFilter, fetchTrips]);

  const handleClearFilters = () => {
    setSearchText('');
    setStatusFilter('all');
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

  const handleFinalizeTrip = async (id) => {
    try {
      await tripService.finalizeTrip(id);
      alert('Trip finalized');
      fetchTrips(pagination.page);
    } catch (err) {
      alert(`Failed to finalize trip: ${err.message}`);
    }
  };

  const handleDeleteTrip = async (id) => {
    if (!window.confirm('Delete this trip?')) return;
    try {
      await tripService.deleteTrip(id);
      alert('Trip deleted');
      fetchTrips(0);
    } catch (err) {
      alert(`Failed to delete trip: ${err.message}`);
    }
  };

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
          <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 0.5 }}>
            Total trips: {pagination.total}
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button 
            startIcon={<Refresh />} 
            onClick={() => fetchTrips(pagination.page)} 
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
            placeholder="Trip #, Origin, Destination..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'action.active' }} />,
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
              {Object.keys(statusColors).map(s => (
                <MenuItem key={s} value={s}>{s}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button onClick={handleClearFilters}>Clear Filters</Button>
        </CardContent>
      </Card>

      {/* Table */}
      <TableContainer component={Paper} sx={{ mb: 2 }}>
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
                    <Button onClick={handleClearFilters} sx={{ mt: 1 }}>
                      Clear Filters
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              trips.map(trip => (
                <TableRow key={trip.id} hover>
                  <TableCell>
                    <Typography fontWeight="medium">{trip.tripNumber}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={trip.status}
                      size="small"
                      sx={{ 
                        bgcolor: statusColors[trip.status], 
                        color: 'white',
                        fontWeight: 'medium'
                      }}
                    />
                  </TableCell>
                  <TableCell>{trip.originLocation}</TableCell>
                  <TableCell>{trip.destinationLocation}</TableCell>
                  <TableCell>
                    {trip.plannedStartDate ? dayjs(trip.plannedStartDate).format('YYYY-MM-DD HH:mm') : '-'}
                  </TableCell>
                  <TableCell>
                    <Box display="flex" gap={0.5}>
                      <Tooltip title="View Details">
                        <IconButton size="small" onClick={() => handleViewTrip(trip)}>
                          <Visibility fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit Trip">
                        <IconButton size="small" onClick={() => handleEditTrip(trip)}>
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {(trip.status !== 'COMPLETED' && trip.status !== 'CLOSED') && (
                        <Tooltip title="Finalize Trip">
                          <IconButton 
                            size="small" 
                            onClick={() => handleFinalizeTrip(trip.id)}
                            color="success"
                          >
                            <CheckCircle fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Delete Trip">
                        <IconButton 
                          size="small" 
                          color="error" 
                          onClick={() => handleDeleteTrip(trip.id)}
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
          onSuccess={() => fetchTrips(0)}
        />
      )}
      
      {showEditModal && selectedTrip && (
        <TripForm
          open={showEditModal}
          mode="edit"
          tripId={selectedTrip.id}
          initialData={selectedTrip}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => fetchTrips(pagination.page)}
        />
      )}
      
      {showMetricsModal && selectedTrip && (
        <TripMetricsForm
          open={showMetricsModal}
          tripId={selectedTrip.id}
          onClose={() => setShowMetricsModal(false)}
          onSuccess={() => fetchTrips(pagination.page)}
        />
      )}
      
      {showDetailsModal && selectedTrip && (
        <TripDetails
          open={showDetailsModal}
          tripId={selectedTrip.id}
          onClose={() => setShowDetailsModal(false)}
          onUpdate={() => fetchTrips(pagination.page)}
        />
      )}
    </Box>
  );
}

export default TripList;
