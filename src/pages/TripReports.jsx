// src/pages/TripReports.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Stack,
  Divider,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme
} from '@mui/material';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  DirectionsCar as CarIcon,
  LocalGasStation as FuelIcon,
  AttachMoney as MoneyIcon,
  Timeline as TimelineIcon,
  People as PeopleIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Assessment as AssessmentIcon,
  DateRange as DateRangeIcon,
  FilterList as FilterListIcon,
  Clear as ClearIcon,
  PictureAsPdf as PdfIcon,
  TableChart as TableChartIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { tripService } from '../services/tripService';

import {
  TRIP_STATUSES,
  TRIP_STATUS_OPTIONS,
  getDisplayName,
  getColor,
} from '../constants';

// Status configuration
const STATUS_CONFIG = Object.fromEntries(
  TRIP_STATUSES.map(item => [item.code, {
    color: item.color || '#9e9e9e',
    bgColor: item.color ? `${item.color}20` : '#f5f5f5',
    label: item.displayName,
    icon: item.icon || '📋'
  }])
);

const StatusChip = ({ status }) => {
  const config = STATUS_CONFIG[status];
  if (config) {
    return (
      <Chip
        label={config.label}
        size="small"
        sx={{
          backgroundColor: config.bgColor,
          color: config.color,
          fontWeight: 600,
          fontSize: '0.65rem',
          height: 20,
          border: `1px solid ${config.color}20`,
        }}
      />
    );
  }
  return <Chip label={status || 'Unknown'} size="small" />;
};

// Stat Card Component
const StatCard = ({ title, value, icon: Icon, color = 'primary', subtitle }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
            {title}
          </Typography>
          <Typography variant="h6" fontWeight="bold" sx={{ fontSize: '1rem', mt: 0.25 }}>
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        <Box
          sx={{
            backgroundColor: `${color}.light`,
            borderRadius: 1,
            p: 0.75,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Icon sx={{ fontSize: '1.2rem', color: `${color}.main` }} />
        </Box>
      </Stack>
    </CardContent>
  </Card>
);

const TripReports = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [stats, setStats] = useState({
    totalTrips: 0,
    completedTrips: 0,
    activeTrips: 0,
    totalDistance: 0,
    totalCost: 0,
    avgDuration: 0,
    onTimeRate: 0
  });
  
  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState({
    start: dayjs().subtract(30, 'days'),
    end: dayjs()
  });
  const [showFilterDialog, setShowFilterDialog] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  // Fetch reports data
  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        startDate: dateRange.start?.format('YYYY-MM-DD'),
        endDate: dateRange.end?.format('YYYY-MM-DD'),
        ...(statusFilter !== 'all' && { status: statusFilter })
      };

      const data = await tripService.getTripReports(params);
      setReports(data);
      setFilteredReports(data);
      
      // Calculate stats
      if (data && data.length > 0) {
        const completed = data.filter(t => t.status === 'COMPLETED' || t.status === 'FINALIZED');
        const active = data.filter(t => t.status === 'ACTIVE' || t.status === 'IN_PROGRESS');
        const totalDistance = data.reduce((sum, t) => sum + (t.totalDistance || 0), 0);
        const totalCost = data.reduce((sum, t) => sum + (t.costAmount || 0), 0);
        const avgDuration = completed.length > 0 
          ? completed.reduce((sum, t) => sum + (t.totalDurationHours || 0), 0) / completed.length
          : 0;
        
        setStats({
          totalTrips: data.length,
          completedTrips: completed.length,
          activeTrips: active.length,
          totalDistance,
          totalCost,
          avgDuration,
          onTimeRate: completed.length > 0 
            ? (completed.filter(t => t.onTime !== false).length / completed.length) * 100
            : 0
        });
      } else {
        setStats({
          totalTrips: 0,
          completedTrips: 0,
          activeTrips: 0,
          totalDistance: 0,
          totalCost: 0,
          avgDuration: 0,
          onTimeRate: 0
        });
      }
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError('Failed to load trip reports');
      // Set some sample data for demo
      setReports(generateSampleData());
      setFilteredReports(generateSampleData());
    } finally {
      setLoading(false);
    }
  }, [dateRange, statusFilter]);

  // Generate sample data for demo
  const generateSampleData = () => {
    const statuses = ['PLANNED', 'ACTIVE', 'COMPLETED', 'FINALIZED', 'CANCELLED'];
    const cities = ['Johannesburg', 'Cape Town', 'Durban', 'Pretoria', 'Port Elizabeth', 'Bloemfontein'];
    const sampleData = [];
    
    for (let i = 1; i <= 25; i++) {
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const origin = cities[Math.floor(Math.random() * cities.length)];
      const dest = cities[Math.floor(Math.random() * cities.length)];
      const distance = Math.floor(Math.random() * 800) + 100;
      const duration = distance / 80 + Math.random() * 2;
      
      sampleData.push({
        id: i,
        tripNumber: `TRP-${String(1000 + i)}`,
        status,
        origin,
        destination: dest,
        originCity: origin,
        destinationCity: dest,
        totalDistance: distance,
        totalDurationHours: duration,
        costAmount: distance * 12 + Math.random() * 500,
        plannedStartDate: dayjs().subtract(Math.floor(Math.random() * 30), 'days').toISOString(),
        plannedEndDate: dayjs().subtract(Math.floor(Math.random() * 10), 'days').toISOString(),
        driverName: `Driver ${i}`,
        vehicleRegistration: `ABC-${String(100 + i).padStart(3, '0')}`,
        onTime: Math.random() > 0.2,
        fuelUsedLiters: distance * 0.3 + Math.random() * 20
      });
    }
    return sampleData;
  };

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Filter reports based on search
  useEffect(() => {
    if (!reports || reports.length === 0) {
      setFilteredReports([]);
      return;
    }

    let filtered = reports;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(trip =>
        trip.tripNumber?.toLowerCase().includes(term) ||
        trip.originCity?.toLowerCase().includes(term) ||
        trip.destinationCity?.toLowerCase().includes(term) ||
        trip.driverName?.toLowerCase().includes(term)
      );
    }
    
    setFilteredReports(filtered);
  }, [searchTerm, reports]);

  const handleExport = async (format = 'csv') => {
    setExportLoading(true);
    try {
      await tripService.exportReports({ format, ...dateRange });
      // Show success message
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setExportLoading(false);
    }
  };

  const handleApplyFilters = () => {
    setShowFilterDialog(false);
    fetchReports();
  };

  const handleClearFilters = () => {
    setStatusFilter('all');
    setDateRange({
      start: dayjs().subtract(30, 'days'),
      end: dayjs()
    });
    setSearchTerm('');
    setShowFilterDialog(false);
    fetchReports();
  };

  const formatCurrency = (amount) => {
    if (!amount) return 'R 0.00';
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatNumber = (num, decimals = 0) => {
    if (!num) return '0';
    return new Intl.NumberFormat('en-ZA', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(num);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box>
            <Typography variant="h6" fontWeight="600" sx={{ fontSize: '1.1rem' }}>
              Trip Reports
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
              Track and analyze trip performance
            </Typography>
          </Box>
          <Stack direction="row" spacing={0.75}>
            <Button
              startIcon={<RefreshIcon sx={{ fontSize: '0.9rem' }} />}
              onClick={fetchReports}
              variant="outlined"
              size="small"
              sx={{ fontSize: '0.75rem', py: 0.5 }}
            >
              Refresh
            </Button>
            <Button
              startIcon={<FilterListIcon sx={{ fontSize: '0.9rem' }} />}
              onClick={() => setShowFilterDialog(true)}
              variant="outlined"
              size="small"
              sx={{ fontSize: '0.75rem', py: 0.5 }}
            >
              Filters
            </Button>
            <Button
              startIcon={<DownloadIcon sx={{ fontSize: '0.9rem' }} />}
              onClick={() => handleExport('csv')}
              variant="contained"
              size="small"
              sx={{ fontSize: '0.75rem', py: 0.5 }}
              disabled={exportLoading}
            >
              {exportLoading ? <CircularProgress size={16} /> : 'Export'}
            </Button>
          </Stack>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={1.5} sx={{ mb: 2 }}>
          <Grid item xs={6} sm={4} md={2}>
            <StatCard
              title="Total Trips"
              value={stats.totalTrips}
              icon={TimelineIcon}
              color="primary"
            />
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <StatCard
              title="Completed"
              value={`${stats.completedTrips}/${stats.totalTrips}`}
              icon={CheckCircleIcon}
              color="success"
              subtitle={`${stats.totalTrips > 0 ? Math.round((stats.completedTrips / stats.totalTrips) * 100) : 0}% completion`}
            />
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <StatCard
              title="Active Trips"
              value={stats.activeTrips}
              icon={CarIcon}
              color="warning"
            />
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <StatCard
              title="Total Distance"
              value={`${formatNumber(stats.totalDistance)} km`}
              icon={CarIcon}
              color="info"
            />
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <StatCard
              title="Total Cost"
              value={formatCurrency(stats.totalCost)}
              icon={MoneyIcon}
              color="error"
            />
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <StatCard
              title="On-Time Rate"
              value={`${stats.onTimeRate.toFixed(0)}%`}
              icon={AssessmentIcon}
              color="success"
            />
          </Grid>
        </Grid>

        {/* Search Bar */}
        <Paper sx={{ p: 1, mb: 2 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search trips by number, city, or driver..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: '0.9rem' }} />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchTerm('')}>
                    <ClearIcon sx={{ fontSize: '0.9rem' }} />
                  </IconButton>
                </InputAdornment>
              ),
              sx: { fontSize: '0.8rem' }
            }}
          />
        </Paper>

        {/* Error Display */}
        {error && (
          <Alert severity="error" sx={{ mb: 2, fontSize: '0.8rem' }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Loading State */}
        {loading && (
          <Box sx={{ width: '100%', mb: 2 }}>
            <LinearProgress />
          </Box>
        )}

        {/* Reports Table */}
        <TableContainer component={Paper} sx={{ borderRadius: 1 }}>
          <Table size="small">
            <TableHead sx={{ bgcolor: '#f5f5f5' }}>
              <TableRow>
                <TableCell sx={{ fontSize: '0.7rem', fontWeight: 600, py: 1 }}>Trip #</TableCell>
                <TableCell sx={{ fontSize: '0.7rem', fontWeight: 600, py: 1 }}>Status</TableCell>
                <TableCell sx={{ fontSize: '0.7rem', fontWeight: 600, py: 1 }}>Route</TableCell>
                <TableCell sx={{ fontSize: '0.7rem', fontWeight: 600, py: 1 }}>Driver</TableCell>
                <TableCell sx={{ fontSize: '0.7rem', fontWeight: 600, py: 1 }}>Vehicle</TableCell>
                <TableCell align="right" sx={{ fontSize: '0.7rem', fontWeight: 600, py: 1 }}>Distance</TableCell>
                <TableCell align="right" sx={{ fontSize: '0.7rem', fontWeight: 600, py: 1 }}>Duration</TableCell>
                <TableCell align="right" sx={{ fontSize: '0.7rem', fontWeight: 600, py: 1 }}>Cost</TableCell>
                <TableCell align="center" sx={{ fontSize: '0.7rem', fontWeight: 600, py: 1 }}>On-Time</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredReports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 3 }}>
                    <Typography color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                      {searchTerm || statusFilter !== 'all' 
                        ? 'No trips match your filters' 
                        : 'No trip reports available'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredReports.map((trip) => (
                  <TableRow key={trip.id} hover>
                    <TableCell sx={{ fontSize: '0.75rem', py: 0.75 }}>
                      <Typography fontWeight="500" sx={{ fontSize: '0.75rem' }}>
                        {trip.tripNumber}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.75rem', py: 0.75 }}>
                      <StatusChip status={trip.status} />
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.75rem', py: 0.75 }}>
                      <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>
                        {trip.originCity || trip.origin} → {trip.destinationCity || trip.destination}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.75rem', py: 0.75 }}>
                      {trip.driverName || 'N/A'}
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.75rem', py: 0.75 }}>
                      {trip.vehicleRegistration || 'N/A'}
                    </TableCell>
                    <TableCell align="right" sx={{ fontSize: '0.75rem', py: 0.75 }}>
                      {formatNumber(trip.totalDistance)} km
                    </TableCell>
                    <TableCell align="right" sx={{ fontSize: '0.75rem', py: 0.75 }}>
                      {trip.totalDurationHours ? `${trip.totalDurationHours.toFixed(1)}h` : '-'}
                    </TableCell>
                    <TableCell align="right" sx={{ fontSize: '0.75rem', py: 0.75 }}>
                      {formatCurrency(trip.costAmount)}
                    </TableCell>
                    <TableCell align="center" sx={{ fontSize: '0.75rem', py: 0.75 }}>
                      {trip.onTime !== undefined && (
                        <Chip
                          label={trip.onTime ? 'Yes' : 'No'}
                          size="small"
                          color={trip.onTime ? 'success' : 'error'}
                          sx={{ height: 18, fontSize: '0.6rem' }}
                        />
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Footer */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mt={1.5}>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
            Showing {filteredReports.length} of {reports.length} trips
          </Typography>
          <Stack direction="row" spacing={0.75}>
            <Tooltip title="Print Report">
              <IconButton size="small" onClick={() => window.print()}>
                <PrintIcon sx={{ fontSize: '0.9rem' }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Export to PDF">
              <IconButton size="small" onClick={() => handleExport('pdf')} disabled={exportLoading}>
                <PdfIcon sx={{ fontSize: '0.9rem' }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Export to Excel">
              <IconButton size="small" onClick={() => handleExport('csv')} disabled={exportLoading}>
                <TableChartIcon sx={{ fontSize: '0.9rem' }} />
              </IconButton>
            </Tooltip>
          </Stack>
        </Box>

        {/* Filter Dialog */}
        <Dialog 
          open={showFilterDialog} 
          onClose={() => setShowFilterDialog(false)} 
          maxWidth="sm" 
          fullWidth
          PaperProps={{ sx: { borderRadius: 1.5 } }}
        >
          <DialogTitle sx={{ py: 1.5, px: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
              Filter Reports
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ p: 2 }}>
            <Stack spacing={2}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ fontSize: '0.75rem' }}>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                  sx={{ fontSize: '0.75rem' }}
                >
                  <MenuItem value="all" sx={{ fontSize: '0.75rem' }}>All Statuses</MenuItem>
                  {Object.keys(STATUS_CONFIG).map(status => (
                    <MenuItem key={status} value={status} sx={{ fontSize: '0.75rem' }}>
                      {STATUS_CONFIG[status].label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <DatePicker
                label="Start Date"
                value={dateRange.start}
                onChange={(newValue) => setDateRange({ ...dateRange, start: newValue })}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: 'small',
                    sx: { '& .MuiInputLabel-root': { fontSize: '0.75rem' } }
                  }
                }}
              />

              <DatePicker
                label="End Date"
                value={dateRange.end}
                onChange={(newValue) => setDateRange({ ...dateRange, end: newValue })}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: 'small',
                    sx: { '& .MuiInputLabel-root': { fontSize: '0.75rem' } }
                  }
                }}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
            <Button 
              onClick={handleClearFilters}
              size="small"
              sx={{ fontSize: '0.8rem' }}
            >
              Clear All
            </Button>
            <Button 
              onClick={() => setShowFilterDialog(false)}
              size="small"
              sx={{ fontSize: '0.8rem' }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleApplyFilters}
              variant="contained"
              size="small"
              sx={{ fontSize: '0.8rem' }}
            >
              Apply Filters
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default TripReports;
