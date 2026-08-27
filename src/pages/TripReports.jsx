// src/pages/TripReports.jsx

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Stack,
  Divider,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  Switch,
  FormControlLabel,
  Snackbar,
  TableSortLabel,
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
  TableChart as TableChartIcon,
  FileCopy as FileCopyIcon,
  Visibility as VisibilityIcon,
  Receipt as ReceiptIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { tripService } from '../services/tripService';
import TripReportDetail from '../components/TripReportDetail';
import {
  TRIP_STATUSES,
  TRIP_STATUS_OPTIONS,
  getDisplayName,
  getColor,
} from '../constants';

// ============================================================
// STATUS CONFIGURATION
// ============================================================
const STATUS_CONFIG = Object.fromEntries(
  TRIP_STATUSES.map(item => [item.code, {
    color: item.color || '#9e9e9e',
    bgColor: item.color ? `${item.color}20` : '#f5f5f5',
    label: item.displayName,
    icon: item.icon || '📋'
  }])
);

// ============================================================
// COMPONENTS
// ============================================================

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

const StatCard = ({ title, value, icon: Icon, color = 'primary', subtitle, loading = false }) => (
  <Card sx={{ height: '100%', borderRadius: '12px' }}>
    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
            {title}
          </Typography>
          {loading ? (
            <CircularProgress size={20} sx={{ mt: 0.5 }} />
          ) : (
            <>
              <Typography variant="h6" fontWeight="bold" sx={{ fontSize: '1rem', mt: 0.25 }}>
                {value}
              </Typography>
              {subtitle && (
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
                  {subtitle}
                </Typography>
              )}
            </>
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

// ============================================================
// MAIN COMPONENT
// ============================================================
const TripReports = () => {
  const theme = useTheme();
  const printRef = useRef();
  
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
    onTimeRate: 0,
    totalRevenue: 0,
    avgCostPerKm: 0,
  });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState({
    start: dayjs().subtract(30, 'days'),
    end: dayjs()
  });
  const [showFilterDialog, setShowFilterDialog] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  // Report Detail Dialog
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [selectedTripId, setSelectedTripId] = useState(null);
  const [selectedTrip, setSelectedTrip] = useState(null);

  // Sorting
  const [orderBy, setOrderBy] = useState('tripNumber');
  const [order, setOrder] = useState('asc');

  // ============================================================
  // FETCH REAL DATA
  // ============================================================
  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        startDate: dateRange.start?.format('YYYY-MM-DD'),
        endDate: dateRange.end?.format('YYYY-MM-DD'),
        size: 1000,
        sort: 'id,desc',
      };
      
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      console.log('📊 Fetching trip reports with params:', params);

      const response = await tripService.getAllTrips(params);
      const trips = response.content || [];
      
      console.log(`📊 Fetched ${trips.length} trips for reports`);

      setReports(trips);
      setFilteredReports(trips);
      
      if (trips.length > 0) {
        const completed = trips.filter(t => t.status === 'COMPLETED' || t.status === 'FINALIZED');
        const active = trips.filter(t => t.status === 'ACTIVE' || t.status === 'IN_PROGRESS');
        const totalDistance = trips.reduce((sum, t) => sum + (t.actualDistanceKm || t.plannedDistanceKm || 0), 0);
        const totalCost = trips.reduce((sum, t) => sum + (t.costAmount || 0), 0);
        const totalRevenue = trips.reduce((sum, t) => sum + (t.revenueAmount || 0), 0);
        const avgDuration = completed.length > 0 
          ? completed.reduce((sum, t) => sum + (t.actualDurationHours || t.estimatedDurationHours || 0), 0) / completed.length
          : 0;
        const avgCostPerKm = totalDistance > 0 ? totalCost / totalDistance : 0;
        
        const onTimeTrips = completed.filter(t => {
          if (t.plannedEndDate && t.actualEndDate) {
            return dayjs(t.actualEndDate).isBefore(dayjs(t.plannedEndDate)) || 
                   dayjs(t.actualEndDate).isSame(dayjs(t.plannedEndDate));
          }
          return true;
        });
        
        setStats({
          totalTrips: trips.length,
          completedTrips: completed.length,
          activeTrips: active.length,
          totalDistance,
          totalCost,
          totalRevenue,
          avgDuration,
          onTimeRate: completed.length > 0 ? (onTimeTrips.length / completed.length) * 100 : 0,
          avgCostPerKm,
        });
      }
    } catch (err) {
      console.error('Error fetching trip reports:', err);
      setError('Failed to load trip reports');
      setReports([]);
      setFilteredReports([]);
    } finally {
      setLoading(false);
    }
  }, [dateRange, statusFilter]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Filter reports based on search
  useEffect(() => {
    if (!reports || reports.length === 0) {
      setFilteredReports([]);
      return;
    }

    let filtered = [...reports];
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(trip =>
        trip.tripNumber?.toLowerCase().includes(term) ||
        trip.originCity?.toLowerCase().includes(term) ||
        trip.destinationCity?.toLowerCase().includes(term) ||
        trip.driverName?.toLowerCase().includes(term) ||
        trip.vehicle?.registrationNumber?.toLowerCase().includes(term) ||
        trip.referenceNumber?.toLowerCase().includes(term)
      );
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let aVal, bVal;
      switch (orderBy) {
        case 'tripNumber':
          aVal = a.tripNumber || '';
          bVal = b.tripNumber || '';
          break;
        case 'status':
          aVal = a.status || '';
          bVal = b.status || '';
          break;
        case 'origin':
          aVal = a.originCity || a.originLocation || '';
          bVal = b.originCity || b.originLocation || '';
          break;
        case 'destination':
          aVal = a.destinationCity || a.destinationLocation || '';
          bVal = b.destinationCity || b.destinationLocation || '';
          break;
        case 'distance':
          aVal = a.actualDistanceKm || a.plannedDistanceKm || 0;
          bVal = b.actualDistanceKm || b.plannedDistanceKm || 0;
          break;
        case 'cost':
          aVal = a.costAmount || 0;
          bVal = b.costAmount || 0;
          break;
        default:
          aVal = a.tripNumber || '';
          bVal = b.tripNumber || '';
      }
      
      if (typeof aVal === 'string') {
        return order === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return order === 'asc' ? aVal - bVal : bVal - aVal;
    });
    
    setFilteredReports(filtered);
  }, [searchTerm, reports, orderBy, order]);

  // ============================================================
  // HANDLERS
  // ============================================================

  const handleViewReport = (trip) => {
    setSelectedTrip(trip);
    setSelectedTripId(trip.id);
    setShowReportDialog(true);
  };

  const handleCloseReport = () => {
    setShowReportDialog(false);
    setSelectedTripId(null);
    setSelectedTrip(null);
  };

  const handleSort = (field) => {
    const isAsc = orderBy === field && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(field);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (filteredReports.length === 0) {
      setSnackbar({ open: true, message: 'No data to export', severity: 'warning' });
      return;
    }

    setExportLoading(true);
    try {
      const headers = [
        'Trip #', 'Status', 'Origin', 'Destination', 'Driver', 'Vehicle',
        'Distance (km)', 'Duration (hrs)', 'Cost (ZAR)', 'Revenue (ZAR)',
        'Start Date', 'End Date', 'On-Time'
      ];

      let csvContent = headers.join(',') + '\n';
      
      filteredReports.forEach(trip => {
        const row = [
          trip.tripNumber || '',
          trip.status || '',
          trip.originCity || trip.originLocation || '',
          trip.destinationCity || trip.destinationLocation || '',
          trip.driverName || trip.driver?.firstName || '',
          trip.vehicle?.registrationNumber || '',
          trip.actualDistanceKm || trip.plannedDistanceKm || 0,
          trip.actualDurationHours || trip.estimatedDurationHours || 0,
          trip.costAmount || 0,
          trip.revenueAmount || 0,
          trip.plannedStartDate ? dayjs(trip.plannedStartDate).format('YYYY-MM-DD') : '',
          trip.actualEndDate ? dayjs(trip.actualEndDate).format('YYYY-MM-DD') : '',
          trip.status === 'COMPLETED' || trip.status === 'FINALIZED' ? 'Yes' : 'No'
        ];
        csvContent += row.join(',') + '\n';
      });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `trip_reports_${dayjs().format('YYYY-MM-DD')}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

      setSnackbar({ open: true, message: `Exported ${filteredReports.length} trips to CSV`, severity: 'success' });
    } catch (err) {
      console.error('Export failed:', err);
      setSnackbar({ open: true, message: 'Export failed: ' + err.message, severity: 'error' });
    } finally {
      setExportLoading(false);
    }
  };

  const handleCopyToClipboard = () => {
    if (filteredReports.length === 0) {
      setSnackbar({ open: true, message: 'No data to copy', severity: 'warning' });
      return;
    }

    try {
      let textContent = 'TRIP REPORTS\n';
      textContent += `Generated: ${dayjs().format('YYYY-MM-DD HH:mm:ss')}\n`;
      textContent += `Total Trips: ${filteredReports.length}\n`;
      textContent += '='.repeat(80) + '\n\n';
      
      filteredReports.forEach((trip, index) => {
        textContent += `${index + 1}. ${trip.tripNumber || 'N/A'}\n`;
        textContent += `   Status: ${trip.status || 'N/A'}\n`;
        textContent += `   Route: ${trip.originCity || trip.originLocation || 'N/A'} → ${trip.destinationCity || trip.destinationLocation || 'N/A'}\n`;
        textContent += `   Driver: ${trip.driverName || trip.driver?.firstName || 'N/A'}\n`;
        textContent += `   Distance: ${trip.actualDistanceKm || trip.plannedDistanceKm || 0} km\n`;
        textContent += `   Cost: R ${(trip.costAmount || 0).toFixed(2)}\n`;
        textContent += '-' .repeat(40) + '\n';
      });

      navigator.clipboard.writeText(textContent);
      setSnackbar({ open: true, message: 'Copied to clipboard', severity: 'success' });
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to copy: ' + err.message, severity: 'error' });
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

  // ============================================================
  // FORMATTING HELPERS
  // ============================================================

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

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ 
        bgcolor: '#F7F7FC', 
        minHeight: '100vh',
        p: { xs: 1.5, sm: 2, md: 2.5, lg: 3 }
      }}>
        <Box sx={{ maxWidth: '1600px', margin: '0 auto' }}>
          
          {/* ============================================================
              HEADER
              ============================================================ */}
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent="space-between"
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            mb={{ xs: 2, sm: 2.5 }}
            spacing={{ xs: 1, sm: 0 }}
          >
            <Box>
              <Typography variant="h5" fontWeight="700" sx={{ fontSize: { xs: '1.1rem', sm: '1.3rem' } }}>
                Trip Reports
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem' } }}>
                Track and analyze trip performance • {filteredReports.length} trips
              </Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              <Button
                startIcon={<RefreshIcon sx={{ fontSize: '0.9rem' }} />}
                onClick={fetchReports}
                variant="outlined"
                size="small"
                sx={{ 
                  borderRadius: '10px',
                  fontSize: { xs: '0.7rem', sm: '0.75rem' },
                  textTransform: 'none',
                  py: 0.5,
                  px: 1.5
                }}
              >
                Refresh
              </Button>
              <Button
                startIcon={<FilterListIcon sx={{ fontSize: '0.9rem' }} />}
                onClick={() => setShowFilterDialog(true)}
                variant="outlined"
                size="small"
                sx={{ 
                  borderRadius: '10px',
                  fontSize: { xs: '0.7rem', sm: '0.75rem' },
                  textTransform: 'none',
                  py: 0.5,
                  px: 1.5
                }}
              >
                Filters
              </Button>
              <Button
                startIcon={<DownloadIcon sx={{ fontSize: '0.9rem' }} />}
                onClick={handleExportCSV}
                variant="contained"
                size="small"
                sx={{ 
                  borderRadius: '10px',
                  fontSize: { xs: '0.7rem', sm: '0.75rem' },
                  textTransform: 'none',
                  py: 0.5,
                  px: 1.5,
                  background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)',
                  '&:hover': { background: 'linear-gradient(135deg, #4338CA 0%, #4F46E5 100%)' }
                }}
                disabled={exportLoading}
              >
                {exportLoading ? <CircularProgress size={16} /> : 'Export CSV'}
              </Button>
            </Stack>
          </Stack>

          {/* ============================================================
              STATS CARDS
              ============================================================ */}
          <Grid container spacing={{ xs: 1.5, sm: 2 }} sx={{ mb: { xs: 2, sm: 2.5 } }}>
            <Grid item xs={6} sm={4} md={2}>
              <StatCard
                title="Total Trips"
                value={stats.totalTrips}
                icon={TimelineIcon}
                color="primary"
                loading={loading}
              />
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <StatCard
                title="Completed"
                value={`${stats.completedTrips}/${stats.totalTrips}`}
                icon={CheckCircleIcon}
                color="success"
                subtitle={`${stats.totalTrips > 0 ? Math.round((stats.completedTrips / stats.totalTrips) * 100) : 0}% completion`}
                loading={loading}
              />
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <StatCard
                title="Active"
                value={stats.activeTrips}
                icon={CarIcon}
                color="warning"
                loading={loading}
              />
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <StatCard
                title="Total Distance"
                value={`${formatNumber(stats.totalDistance)} km`}
                icon={CarIcon}
                color="info"
                loading={loading}
              />
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <StatCard
                title="Total Cost"
                value={formatCurrency(stats.totalCost)}
                icon={MoneyIcon}
                color="error"
                loading={loading}
              />
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <StatCard
                title="On-Time Rate"
                value={`${stats.onTimeRate.toFixed(0)}%`}
                icon={AssessmentIcon}
                color="success"
                loading={loading}
              />
            </Grid>
          </Grid>

          {/* ============================================================
              SEARCH BAR
              ============================================================ */}
          <Paper
            elevation={0}
            sx={{
              p: { xs: 1, sm: 1.5 },
              mb: { xs: 1.5, sm: 2 },
              borderRadius: '12px',
              border: '1px solid #ECECEC',
              bgcolor: '#FFFFFF'
            }}
          >
            <TextField
              fullWidth
              size="small"
              placeholder="Search trips by number, city, driver, or reference..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ fontSize: '0.9rem', color: '#6B7280' }} />
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

          {/* ============================================================
              ERROR / LOADING
              ============================================================ */}
          {error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: '12px', fontSize: '0.8rem' }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {loading && (
            <Box sx={{ width: '100%', mb: 2 }}>
              <LinearProgress />
            </Box>
          )}

          {/* ============================================================
              REPORTS TABLE
              ============================================================ */}
          <Paper
            elevation={0}
            sx={{
              borderRadius: '12px',
              border: '1px solid #ECECEC',
              bgcolor: '#FFFFFF',
              overflow: 'hidden',
            }}
            ref={printRef}
          >
            <TableContainer sx={{ maxHeight: 600 }}>
              <Table size="small" stickyHeader>
                <TableHead sx={{ bgcolor: '#F9FAFB' }}>
                  <TableRow>
                    <TableCell sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' }, fontWeight: 600, color: '#6B7280', py: 1 }}>
                      <TableSortLabel
                        active={orderBy === 'tripNumber'}
                        direction={orderBy === 'tripNumber' ? order : 'asc'}
                        onClick={() => handleSort('tripNumber')}
                      >
                        Trip #
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' }, fontWeight: 600, color: '#6B7280', py: 1 }}>
                      <TableSortLabel
                        active={orderBy === 'status'}
                        direction={orderBy === 'status' ? order : 'asc'}
                        onClick={() => handleSort('status')}
                      >
                        Status
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' }, fontWeight: 600, color: '#6B7280', py: 1 }}>
                      <TableSortLabel
                        active={orderBy === 'origin'}
                        direction={orderBy === 'origin' ? order : 'asc'}
                        onClick={() => handleSort('origin')}
                      >
                        Route
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' }, fontWeight: 600, color: '#6B7280', py: 1 }}>
                      Driver
                    </TableCell>
                    <TableCell sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' }, fontWeight: 600, color: '#6B7280', py: 1 }}>
                      Vehicle
                    </TableCell>
                    <TableCell align="right" sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' }, fontWeight: 600, color: '#6B7280', py: 1 }}>
                      <TableSortLabel
                        active={orderBy === 'distance'}
                        direction={orderBy === 'distance' ? order : 'asc'}
                        onClick={() => handleSort('distance')}
                      >
                        Distance
                      </TableSortLabel>
                    </TableCell>
                    <TableCell align="right" sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' }, fontWeight: 600, color: '#6B7280', py: 1 }}>
                      Duration
                    </TableCell>
                    <TableCell align="right" sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' }, fontWeight: 600, color: '#6B7280', py: 1 }}>
                      <TableSortLabel
                        active={orderBy === 'cost'}
                        direction={orderBy === 'cost' ? order : 'asc'}
                        onClick={() => handleSort('cost')}
                      >
                        Cost
                      </TableSortLabel>
                    </TableCell>
                    <TableCell align="right" sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' }, fontWeight: 600, color: '#6B7280', py: 1 }}>
                      Revenue
                    </TableCell>
                    <TableCell align="center" sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' }, fontWeight: 600, color: '#6B7280', py: 1 }}>
                      Report
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredReports.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                        <Typography color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                          {searchTerm || statusFilter !== 'all' 
                            ? 'No trips match your filters' 
                            : 'No trip reports available'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredReports.map((trip) => {
                      const isCompleted = trip.status === 'COMPLETED' || trip.status === 'FINALIZED';
                      const distance = trip.actualDistanceKm || trip.plannedDistanceKm || 0;
                      const duration = trip.actualDurationHours || trip.estimatedDurationHours || 0;
                      
                      return (
                        <TableRow 
                          key={trip.id} 
                          hover 
                          sx={{ 
                            '&:hover': { bgcolor: '#F9FAFB', cursor: 'pointer' },
                            transition: 'background-color 0.2s ease',
                          }}
                          onClick={() => handleViewReport(trip)}
                        >
                          <TableCell sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' }, py: 0.75 }}>
                            <Typography fontWeight="500" sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' }, color: '#4F46E5' }}>
                              {trip.tripNumber}
                            </Typography>
                            {trip.referenceNumber && (
                              <Typography variant="caption" sx={{ fontSize: '0.55rem', color: '#6B7280', display: 'block' }}>
                                REF: {trip.referenceNumber}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell sx={{ py: 0.5 }}>
                            <StatusChip status={trip.status} />
                          </TableCell>
                          <TableCell sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' }, py: 0.75 }}>
                            <Typography variant="body2" sx={{ fontSize: '0.65rem' }}>
                              {trip.originCity || trip.originLocation || 'N/A'} → {trip.destinationCity || trip.destinationLocation || 'N/A'}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' }, py: 0.75 }}>
                            {trip.driverName || trip.driver?.firstName || 'N/A'}
                          </TableCell>
                          <TableCell sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' }, py: 0.75 }}>
                            {trip.vehicle?.registrationNumber || 'N/A'}
                          </TableCell>
                          <TableCell align="right" sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' }, py: 0.75 }}>
                            {distance > 0 ? `${formatNumber(distance)} km` : '-'}
                          </TableCell>
                          <TableCell align="right" sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' }, py: 0.75 }}>
                            {duration > 0 ? `${duration.toFixed(1)}h` : '-'}
                          </TableCell>
                          <TableCell align="right" sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' }, py: 0.75 }}>
                            {formatCurrency(trip.costAmount)}
                          </TableCell>
                          <TableCell align="right" sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' }, py: 0.75 }}>
                            {formatCurrency(trip.revenueAmount)}
                          </TableCell>
                          <TableCell align="center" sx={{ py: 0.5 }}>
                            <Tooltip title="View Full Report" arrow>
                              <IconButton 
                                size="small" 
                                color="primary"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewReport(trip);
                                }}
                                sx={{ 
                                  p: { xs: 0.25, sm: 0.5 },
                                  bgcolor: '#EEF2FF',
                                  '&:hover': { bgcolor: '#C7D2FE' }
                                }}
                              >
                                <ReceiptIcon sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' } }} />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          {/* ============================================================
              FOOTER
              ============================================================ */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mt={1.5} flexWrap="wrap" gap={1}>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
              Showing {filteredReports.length} of {reports.length} trips
              {statusFilter !== 'all' && ` • Filtered by: ${STATUS_CONFIG[statusFilter]?.label || statusFilter}`}
              {dateRange.start && dateRange.end && ` • ${dateRange.start.format('DD MMM YYYY')} - ${dateRange.end.format('DD MMM YYYY')}`}
            </Typography>
            <Stack direction="row" spacing={0.75}>
              <Tooltip title="Print Report">
                <IconButton size="small" onClick={handlePrint}>
                  <PrintIcon sx={{ fontSize: '0.9rem' }} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Export as PDF (Print to PDF)">
                <IconButton size="small" onClick={handlePrint} disabled={exportLoading}>
                  <PdfIcon sx={{ fontSize: '0.9rem' }} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Copy to Clipboard">
                <IconButton size="small" onClick={handleCopyToClipboard}>
                  <FileCopyIcon sx={{ fontSize: '0.9rem' }} />
                </IconButton>
              </Tooltip>
            </Stack>
          </Box>

          {/* ============================================================
              FILTER DIALOG
              ============================================================ */}
          <Dialog 
            open={showFilterDialog} 
            onClose={() => setShowFilterDialog(false)} 
            maxWidth="sm" 
            fullWidth
            PaperProps={{ sx: { borderRadius: '16px' } }}
          >
            <DialogTitle sx={{ py: 1.5, px: 2.5, borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
                <FilterListIcon sx={{ verticalAlign: 'middle', mr: 1, fontSize: '1.1rem' }} />
                Filter Reports
              </Typography>
            </DialogTitle>
            <DialogContent sx={{ p: 2.5 }}>
              <Stack spacing={2}>
                <FormControl fullWidth size="small">
                  <InputLabel sx={{ fontSize: '0.75rem' }}>Status</InputLabel>
                  <Select
                    value={statusFilter}
                    label="Status"
                    onChange={(e) => setStatusFilter(e.target.value)}
                    sx={{ fontSize: '0.75rem', borderRadius: '10px' }}
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
                      sx: { 
                        '& .MuiInputLabel-root': { fontSize: '0.75rem' },
                        '& .MuiInputBase-root': { borderRadius: '10px' }
                      }
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
                      sx: { 
                        '& .MuiInputLabel-root': { fontSize: '0.75rem' },
                        '& .MuiInputBase-root': { borderRadius: '10px' }
                      }
                    }
                  }}
                />
              </Stack>
            </DialogContent>
            <DialogActions sx={{ p: 2.5, borderTop: 1, borderColor: 'divider' }}>
              <Button 
                onClick={handleClearFilters}
                size="small"
                sx={{ fontSize: '0.8rem', textTransform: 'none' }}
              >
                Clear All
              </Button>
              <Button 
                onClick={() => setShowFilterDialog(false)}
                size="small"
                sx={{ fontSize: '0.8rem', textTransform: 'none', color: '#6B7280' }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleApplyFilters}
                variant="contained"
                size="small"
                sx={{ 
                  fontSize: '0.8rem', 
                  textTransform: 'none',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)',
                  '&:hover': { background: 'linear-gradient(135deg, #4338CA 0%, #4F46E5 100%)' }
                }}
              >
                Apply Filters
              </Button>
            </DialogActions>
          </Dialog>

          {/* ============================================================
              TRIP REPORT DETAIL DIALOG
              ============================================================ */}
          <TripReportDetail
            open={showReportDialog}
            tripId={selectedTripId}
            trip={selectedTrip}
            onClose={handleCloseReport}
            onPrint={(trip) => {
              console.log('Printing report for trip:', trip?.tripNumber);
            }}
          />

          {/* ============================================================
              SNACKBAR
              ============================================================ */}
          <Snackbar
            open={snackbar.open}
            autoHideDuration={4000}
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          >
            <Alert 
              severity={snackbar.severity} 
              sx={{ borderRadius: '12px' }}
              onClose={() => setSnackbar({ ...snackbar, open: false })}
            >
              {snackbar.message}
            </Alert>
          </Snackbar>

        </Box>
      </Box>

      {/* ============================================================
          PRINT STYLES
          ============================================================ */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-area, #print-area * {
            visibility: visible;
          }
          #print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .MuiTable-root {
            font-size: 10px !important;
          }
          .MuiTableCell-root {
            padding: 4px 6px !important;
            font-size: 9px !important;
          }
          .MuiChip-root {
            font-size: 8px !important;
            height: 16px !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </LocalizationProvider>
  );
};

export default TripReports;
