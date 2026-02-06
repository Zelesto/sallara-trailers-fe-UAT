import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState, useMemo, useCallback } from 'react';
import dayjs from 'dayjs';
import { tripService } from '../services/tripService';
import TripForm from './TripForm';
import TripMetricsForm from './TripMetricsForm';
import TripDetails from './TripDetails';

import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Typography, CircularProgress, Box, Select, MenuItem, FormControl, InputLabel,
  Chip, IconButton, Button, Card, CardContent, Tooltip,
  TablePagination, TextField, Grid
} from '@mui/material';
import {
  Add, Edit, Delete, Visibility, CheckCircle, Cancel, Dashboard, FileDownload, Refresh,
  Search as SearchIcon, FilterList, DateRange
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

// Status colors mapping
const statusColors = {
  PLANNED: 'info.main',
  ACTIVE: 'success.main',
  IN_PROGRESS: 'warning.main',
  COMPLETED: 'cyan',
  CLOSED: 'purple',
  CANCELLED: 'error.main'
};

function TripList() {
  const navigate = useNavigate();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState({ start: null, end: null });

  const [selectedTrip, setSelectedTrip] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMetricsModal, setShowMetricsModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const [pagination, setPagination] = useState({
    page: 0,
    pageSize: 10,
    total: 0,
    totalPages: 0
  });

  const fetchTrips = useCallback(async (page = pagination.page, size = pagination.pageSize) => {
    setLoading(true);
    try {
      // Build query params
      const params = {
        page: page,
        size: size
      };

      // Add search filter if provided
      if (searchText.trim()) {
        params.search = searchText;
      }

      // Add status filter if not 'all'
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      // Add date range filters if provided
      if (dateRange.start) {
        params.startDate = dayjs(dateRange.start).format('YYYY-MM-DD');
      }
      if (dateRange.end) {
        params.endDate = dayjs(dateRange.end).format('YYYY-MM-DD');
      }

      const res = await tripService.getAllTrips(params);
      setTrips(res.content || []);
      setPagination(prev => ({
        ...prev,
        total: res.totalElements || 0,
        totalPages: res.totalPages || 0,
        page: page
      }));
    } catch (err) {
      alert(`Failed to load trips: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.pageSize, searchText, statusFilter, dateRange]);

  // Initial fetch
  useEffect(() => {
    fetchTrips(0);
  }, []);

  // Handle pagination change
  const handlePageChange = (event, newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    fetchTrips(newPage);
  };

  const handleRowsPerPageChange = (event) => {
    const newSize = parseInt(event.target.value, 10);
    setPagination(prev => ({ ...prev, pageSize: newSize, page: 0 }));
    fetchTrips(0, newSize);
  };

  // Handle filter changes with debounce for search
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchTrips(0);
    }, 500); // 500ms debounce for search

    return () => {
      clearTimeout(handler);
    };
  }, [searchText, statusFilter, dateRange.start, dateRange.end]);

  const summary = useMemo(() => {
    if (!trips.length) return null;
    const totalTrips = pagination.total;
    // Note: These counts would be better from a summary endpoint
    const completed = trips.filter(t => t.status === 'COMPLETED' || t.status === 'CLOSED').length;
    const pending = trips.filter(t => t.status !== 'COMPLETED' && t.status !== 'CLOSED').length;
    return { totalTrips, completed, pending };
  }, [trips, pagination.total]);

  const handleClearFilters = () => {
    setSearchText('');
    setStatusFilter('all');
    setDateRange({ start: null, end: null });
    // Don't fetch here - the useEffect will handle it
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
    } catch {
      alert('Failed to finalize trip');
    }
  };

  const handleDeleteTrip = async (id) => {
    if (!window.confirm('Delete this trip?')) return;
    try {
      await tripService.deleteTrip(id);
      alert('Trip deleted');
      fetchTrips(0); // Go back to first page after deletion
    } catch {
      alert('Failed to delete trip');
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
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box m={3}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h4">Trip Management</Typography>
            {summary && (
              <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 0.5 }}>
                Total: {summary.totalTrips} | Completed: {summary.completed} | Pending: {summary.pending}
              </Typography>
            )}
          </Box>
          <Box display="flex" gap={1}>
            <Button startIcon={<FileDownload />} onClick={() => alert('Download report')} variant="outlined">
              Report
            </Button>
            <Button startIcon={<Refresh />} onClick={() => fetchTrips(pagination.page)} variant="outlined">
              Refresh
            </Button>
            <Button startIcon={<Add />} onClick={() => setShowCreateModal(true)} variant="contained">
              Create Trip
            </Button>
          </Box>
        </Box>

        {/* Filters */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Search Trips"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  InputProps={{
                    startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'action.active' }} />,
                  }}
                  placeholder="Trip #, Origin, Destination..."
                />
              </Grid>

              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    label="Status"
                    startAdornment={<FilterList fontSize="small" sx={{ mr: 1, color: 'action.active' }} />}
                  >
                    <MenuItem value="all">All Statuses</MenuItem>
                    {Object.keys(statusColors).map(s => (
                      <MenuItem key={s} value={s}>{s}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <DatePicker
                  label="Start Date From"
                  value={dateRange.start}
                  onChange={(newValue) => setDateRange(prev => ({ ...prev, start: newValue }))}
                  slotProps={{
                    textField: {
                      size: 'small',
                      fullWidth: true,
                      InputProps: {
                        startAdornment: <DateRange fontSize="small" sx={{ mr: 1, color: 'action.active' }} />,
                      }
                    }
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <DatePicker
                  label="Start Date To"
                  value={dateRange.end}
                  onChange={(newValue) => setDateRange(prev => ({ ...prev, end: newValue }))}
                  slotProps={{
                    textField: {
                      size: 'small',
                      fullWidth: true,
                      InputProps: {
                        startAdornment: <DateRange fontSize="small" sx={{ mr: 1, color: 'action.active' }} />,
                      }
                    }
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={1}>
                <Button
                  fullWidth
                  onClick={handleClearFilters}
                  variant="outlined"
                  size="small"
                >
                  Clear
                </Button>
              </Grid>
            </Grid>
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
                      {searchText || statusFilter !== 'all' || dateRange.start || dateRange.end
                        ? 'No trips match your filters'
                        : 'No trips found'}
                    </Typography>
                    {(searchText || statusFilter !== 'all' || dateRange.start || dateRange.end) && (
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
                        <Tooltip title="Trip Metrics">
                          <IconButton size="small" onClick={() => handleOpenMetrics(trip)}>
                            <Dashboard fontSize="small" />
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
              labelDisplayedRows={({ from, to, count }) => 
                `${from}-${to} of ${count}`
              }
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
            originLocation={selectedTrip.originLocation}
            destinationLocation={selectedTrip.destinationLocation}
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
    </LocalizationProvider>
  );
}

export default TripList;
