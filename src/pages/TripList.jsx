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
  Chip, IconButton, Button, Card, CardContent, Tooltip
} from '@mui/material';
import {
  Add, Edit, Delete, Visibility, CheckCircle, Cancel, Dashboard, FileDownload, Refresh
} from '@mui/icons-material';

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
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const [selectedTrip, setSelectedTrip] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMetricsModal, setShowMetricsModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  const fetchTrips = useCallback(async (page = 0, size = pagination.pageSize) => {
    setLoading(true);
    try {
      const res = await tripService.getAllTrips(page, size);
      setTrips(res.content || []);
      setPagination(prev => ({
        ...prev,
        total: res.totalElements || 0,
        current: page + 1,
        pageSize: size
      }));
    } catch (err) {
      alert(`Failed to load trips: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [pagination.pageSize]);

  useEffect(() => {
    fetchTrips(0);
  }, [fetchTrips]);

  const filteredTrips = useMemo(() => {
    return trips.filter(trip => {
      if (searchText) {
        const s = searchText.toLowerCase();
        if (!(
          (trip.tripNumber || '').toLowerCase().includes(s) ||
          (trip.originLocation || '').toLowerCase().includes(s) ||
          (trip.destinationLocation || '').toLowerCase().includes(s)
        )) return false;
      }
      if (statusFilter !== 'all' && trip.status !== statusFilter) return false;
      if (dateRange.start && dateRange.end && trip.plannedStartDate) {
        const start = dayjs(trip.plannedStartDate);
        if (!start.isBetween(dayjs(dateRange.start), dayjs(dateRange.end), 'day', '[]')) return false;
      }
      return true;
    });
  }, [trips, searchText, statusFilter, dateRange]);

  const summary = useMemo(() => {
    if (!trips.length) return null;
    const totalTrips = trips.length;
    const completed = trips.filter(t => t.status === 'COMPLETED' || t.status === 'CLOSED').length;
    const pending = totalTrips - completed;
    return { totalTrips, completed, pending };
  }, [trips]);

  const handleClearFilters = () => {
    setSearchText('');
    setStatusFilter('all');
    setDateRange({ start: '', end: '' });
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
      fetchTrips(pagination.current - 1);
    } catch {
      alert('Failed to finalize trip');
    }
  };

  const handleDeleteTrip = async (id) => {
    if (!window.confirm('Delete this trip?')) return;
    try {
      await tripService.deleteTrip(id);
      alert('Trip deleted');
      fetchTrips(0);
    } catch {
      alert('Failed to delete trip');
    }
  };

  if (loading) {
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
        <Typography variant="h4">Trip Management</Typography>
        <Box>
          <Button startIcon={<FileDownload />} onClick={() => alert('Download report')}>
            Report
          </Button>
          <Button startIcon={<Refresh />} onClick={() => fetchTrips(pagination.current - 1)}>
            Refresh
          </Button>
          <Button startIcon={<Add />} onClick={() => setShowCreateModal(true)} variant="contained">
            Create Trip
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Search</InputLabel>
            <Select
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              label="Search"
            >
              <MenuItem value="">All Trips</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
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
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Trip Number</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Origin</TableCell>
              <TableCell>Destination</TableCell>
              <TableCell>Start Date</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredTrips.map(trip => (
              <TableRow key={trip.id} hover>
                <TableCell>{trip.tripNumber}</TableCell>
                <TableCell>
                  <Chip
                    label={trip.status}
                    color={trip.status in statusColors ? 'primary' : 'default'}
                    sx={{ bgcolor: statusColors[trip.status], color: 'white' }}
                  />
                </TableCell>
                <TableCell>{trip.originLocation}</TableCell>
                <TableCell>{trip.destinationLocation}</TableCell>
                <TableCell>{trip.plannedStartDate ? dayjs(trip.plannedStartDate).format('YYYY-MM-DD HH:mm') : '-'}</TableCell>
                <TableCell>
                  <Tooltip title="View">
                    <IconButton onClick={() => handleViewTrip(trip)}><Visibility /></IconButton>
                  </Tooltip>
                  <Tooltip title="Metrics">
                    <IconButton onClick={() => handleOpenMetrics(trip)}><Dashboard /></IconButton>
                  </Tooltip>
                  <Tooltip title="Edit">
                    <IconButton onClick={() => handleEditTrip(trip)}><Edit /></IconButton>
                  </Tooltip>
                  {(trip.status !== 'COMPLETED' && trip.status !== 'CLOSED') && (
                    <Tooltip title="Finalize">
                      <IconButton onClick={() => handleFinalizeTrip(trip.id)}><CheckCircle /></IconButton>
                    </Tooltip>
                  )}
                  <Tooltip title="Delete">
                    <IconButton color="error" onClick={() => handleDeleteTrip(trip.id)}><Delete /></IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Modals */}
      {showCreateModal && (<TripForm open={showCreateModal}onClose={() => setShowCreateModal(false)}onSuccess={() => fetchTrips(0)}/>)}
      {showEditModal && selectedTrip && (
  <TripForm
    open={showEditModal}
    mode="edit"
    tripId={selectedTrip.id}
    initialData={selectedTrip}
    onClose={() => setShowEditModal(false)}
    onSuccess={() => fetchTrips(pagination.current - 1)}
  />
)}
{showMetricsModal && selectedTrip && (
  <TripMetricsForm
    open={showMetricsModal}
    tripId={selectedTrip.id}
    originLocation={selectedTrip.originLocation}
    destinationLocation={selectedTrip.destinationLocation}
    onClose={() => setShowMetricsModal(false)}
    onSuccess={() => fetchTrips(pagination.current - 1)}
  />
)}
      {showDetailsModal && selectedTrip && (
  <TripDetails
    open={showDetailsModal}
    tripId={selectedTrip.id}
    onClose={() => setShowDetailsModal(false)}
    onUpdate={() => fetchTrips(pagination.current - 1)}
  />
)}
    </Box>
  );
}

export default TripList;
