// src/pages/TripAnalytics.jsx
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Paper,
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
  useTheme,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Download as DownloadIcon,
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
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  ShowChart as ShowChartIcon,
  Speed as SpeedIcon,
  Schedule as ScheduleIcon,
  LocationOn as LocationIcon,
  Route as RouteIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { tripService } from '../services/tripService';
import ExportButton from '../components/ExportButton';
import {
  computeTripAnalytics,
  filterTripsByDate,
  validateDateRange,
  EMPTY_ANALYTICS,
  TRIP_REPORT_COLUMNS,
} from '../utils/tripReporting';
import { ResponsiveContainer } from '../components/ResponsiveContainer';

import {
  TRIP_STATUSES,
  TRIP_STATUS_OPTIONS,
  TRIP_TYPES,
  TRIP_PRIORITIES,
  getDisplayName,
  getColor,
} from '../constants';

// ============================================================
// SAFE VALUE HELPER
// ============================================================
const toSafeString = (val) => {
  if (val === undefined || val === null) return 'N/A';
  if (typeof val === 'string') return val;
  if (typeof val === 'number') return String(val);
  if (typeof val === 'boolean') return val ? 'Yes' : 'No';
  if (val instanceof Date) return val.toLocaleDateString();
  if (React.isValidElement(val)) return val;
  if (typeof val === 'object') {
    if (val.id !== undefined && val.id !== null) return String(val.id);
    if (val.name !== undefined && val.name !== null) return String(val.name);
    if (val.value !== undefined && val.value !== null) return String(val.value);
    try {
      const jsonStr = JSON.stringify(val);
      return jsonStr.length > 50 ? jsonStr.substring(0, 50) + '...' : jsonStr;
    } catch {
      return 'N/A';
    }
  }
  try {
    return String(val);
  } catch {
    return 'N/A';
  }
};

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
// SAFE METRIC CARD
// ============================================================
const MetricCard = ({ title, value, icon: Icon, color = 'primary', subtitle, trend, loading }) => {
  const displayValue = toSafeString(value);
  
  const colorMap = {
    primary: '#4F46E5',
    success: '#22C55E',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
    secondary: '#8B5CF6'
  };
  
  const bgColorMap = {
    primary: '#EEF2FF',
    success: '#D1FAE5',
    warning: '#FEF3C7',
    error: '#FEE2E2',
    info: '#DBEAFE',
    secondary: '#EDE9FE'
  };
  
  const mainColor = colorMap[color] || colorMap.primary;
  const bgColor = bgColorMap[color] || bgColorMap.primary;

  return (
    <Card sx={{ height: '100%', borderRadius: 2, border: '1px solid #ECECEC' }}>
      <CardContent sx={{ p: { xs: 1.5, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box flex={1} minWidth={0}>
            <Typography 
              variant="caption" 
              color="text.secondary" 
              sx={{ 
                fontSize: { xs: '0.55rem', sm: '0.65rem' },
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.3px'
              }}
            >
              {title}
            </Typography>
            
            {loading ? (
              <CircularProgress size={16} sx={{ mt: 0.5 }} />
            ) : (
              <>
                <Typography 
                  variant="h6" 
                  fontWeight="bold" 
                  sx={{ 
                    fontSize: { xs: '0.9rem', sm: '1.1rem', md: '1.2rem' },
                    mt: 0.25,
                    color: '#111827'
                  }}
                >
                  {displayValue}
                </Typography>
                
                {subtitle && (
                  <Typography 
                    variant="caption" 
                    color="text.secondary" 
                    sx={{ fontSize: { xs: '0.5rem', sm: '0.6rem' }, display: 'block' }}
                  >
                    {subtitle}
                  </Typography>
                )}
                
                {trend && (
                  <Chip
                    label={trend}
                    size="small"
                    color={trend.startsWith('+') ? 'success' : 'error'}
                    sx={{ height: 18, fontSize: { xs: '0.45rem', sm: '0.55rem' }, mt: 0.5 }}
                  />
                )}
              </>
            )}
          </Box>
          
          {Icon && (
            <Box
              sx={{
                bgcolor: bgColor,
                borderRadius: 1.5,
                p: { xs: 0.75, sm: 1 },
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Icon sx={{ fontSize: { xs: '1rem', sm: '1.2rem' }, color: mainColor }} />
            </Box>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};

// ============================================================
// SAFE BAR CHART
// ============================================================
const SimpleBarChart = ({ data, title, color = 'primary' }) => {
  const safeData = useMemo(() => {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return [{ label: 'No Data', value: 1 }];
    }
    return data.map(item => ({
      label: toSafeString(item.label || 'N/A'),
      value: typeof item.value === 'number' ? item.value : Number(item.value) || 0
    }));
  }, [data]);

  const maxValue = Math.max(...safeData.map(d => d.value), 1);
  
  const colorMap = {
    primary: '#4F46E5',
    success: '#22C55E',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
    secondary: '#8B5CF6'
  };
  
  const barColor = colorMap[color] || colorMap.primary;

  return (
    <Box>
      <Typography 
        variant="subtitle2" 
        sx={{ 
          fontSize: { xs: '0.7rem', sm: '0.8rem' }, 
          fontWeight: 600, 
          mb: 1.5,
          color: '#111827'
        }}
      >
        {title}
      </Typography>
      <Stack spacing={1}>
        {safeData.map((item, index) => (
          <Box key={index}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="caption" sx={{ fontSize: { xs: '0.6rem', sm: '0.65rem' }, color: '#6B7280' }}>
                {item.label}
              </Typography>
              <Typography variant="caption" fontWeight="500" sx={{ fontSize: { xs: '0.6rem', sm: '0.65rem' }, color: '#111827' }}>
                {item.value}
              </Typography>
            </Box>
            <Box sx={{ width: '100%', height: 4, bgcolor: '#F3F4F6', borderRadius: 2, overflow: 'hidden' }}>
              <Box
                sx={{
                  width: `${Math.max((item.value / maxValue) * 100, 2)}%`,
                  height: '100%',
                  bgcolor: barColor,
                  borderRadius: 2,
                  transition: 'width 0.5s ease'
                }}
              />
            </Box>
          </Box>
        ))}
      </Stack>
    </Box>
  );
};

// ============================================================
// SAFE PIE CHART
// ============================================================
const SimplePieChart = ({ data, title }) => {
  const safeData = useMemo(() => {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return [{ label: 'No Data', value: 1 }];
    }
    return data.map(item => ({
      label: toSafeString(item.label || 'N/A'),
      value: typeof item.value === 'number' ? item.value : Number(item.value) || 0
    }));
  }, [data]);

  const total = safeData.reduce((sum, item) => sum + item.value, 0) || 1;
  const colors = ['#4F46E5', '#22C55E', '#F59E0B', '#EF4444', '#3B82F6', '#8B5CF6'];

  return (
    <Box>
      <Typography 
        variant="subtitle2" 
        sx={{ 
          fontSize: { xs: '0.7rem', sm: '0.8rem' }, 
          fontWeight: 600, 
          mb: 1.5,
          color: '#111827'
        }}
      >
        {title}
      </Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
        <Box sx={{ position: 'relative', width: 100, height: 100, flexShrink: 0 }}>
          {safeData.map((item, index) => {
            const percentage = (item.value / total) * 100;
            const startAngle = safeData.slice(0, index).reduce((sum, d) => sum + (d.value / total) * 360, 0);
            const endAngle = startAngle + (percentage / 100) * 360;
            
            return (
              <Box
                key={index}
                sx={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  clipPath: `conic-gradient(from ${startAngle}deg, ${colors[index % colors.length]} 0deg, ${colors[index % colors.length]} ${endAngle}deg, transparent ${endAngle}deg)`,
                  transition: 'all 0.3s ease'
                }}
              />
            );
          })}
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 60,
              height: 60,
              borderRadius: '50%',
              bgcolor: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
            }}
          >
            <Typography variant="caption" fontWeight="bold" sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' }, color: '#111827' }}>
              {total}
            </Typography>
          </Box>
        </Box>
        <Stack spacing={0.5} flex={1}>
          {safeData.map((item, index) => {
            const percentage = ((item.value / total) * 100).toFixed(0);
            return (
              <Box key={index} display="flex" alignItems="center" gap={1}>
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    bgcolor: colors[index % colors.length],
                    flexShrink: 0
                  }}
                />
                <Typography variant="caption" sx={{ fontSize: { xs: '0.6rem', sm: '0.65rem' }, flex: 1, color: '#6B7280' }}>
                  {item.label}
                </Typography>
                <Typography variant="caption" fontWeight="500" sx={{ fontSize: { xs: '0.6rem', sm: '0.65rem' }, color: '#111827' }}>
                  {percentage}%
                </Typography>
              </Box>
            );
          })}
        </Stack>
      </Stack>
    </Box>
  );
};

// ============================================================
// MAIN COMPONENT: TripAnalytics
// ============================================================
const TripAnalytics = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [timeRange, setTimeRange] = useState('30days');
  const [dateRange, setDateRange] = useState({
    start: dayjs().subtract(30, 'days'),
    end: dayjs()
  });
  const [showFilterDialog, setShowFilterDialog] = useState(false);

  // ============================================================
  // FETCH ANALYTICS
  // Previously this called tripService.getTripAnalytics, which does not exist, so it always
  // fell back to the first 1,000 trips with NO date filter - the date range did nothing.
  // Now: all trips (paged, capped at 10,000), filtered to the selected period, calculated by
  // the tested helpers in utils/tripReporting.js.
  // ============================================================
  const requestIdRef = useRef(0);
  const [periodTrips, setPeriodTrips] = useState([]);

  const fetchAnalytics = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    const rangeError = validateDateRange(dateRange.start, dateRange.end);
    if (rangeError) {
      setError(rangeError);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const allTrips = await tripService.fetchAllTrips({});
      const inPeriod = filterTripsByDate(allTrips, dateRange.start, dateRange.end);
      if (requestId !== requestIdRef.current) return; // a newer request has started
      setPeriodTrips(inPeriod);
      setAnalytics(computeTripAnalytics(inPeriod));
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      console.error('Error fetching analytics:', err);
      setError(err.userMessage || err.message || 'Failed to load analytics data');
      setPeriodTrips([]);
      setAnalytics(null);
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, [dateRange]);

  const getFallbackAnalytics = () => ({ ...EMPTY_ANALYTICS });

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // ============================================================
  // HANDLERS
  // ============================================================
  // Custom dates are edited in a draft and only applied with "Apply Filters"
  // (previously every date-picker click reloaded the page data immediately).
  const [draftRange, setDraftRange] = useState(dateRange);
  const [draftError, setDraftError] = useState(null);

  const openFilterDialog = () => {
    setDraftRange(dateRange);
    setDraftError(null);
    setShowFilterDialog(true);
  };

  const applyCustomRange = () => {
    const err = validateDateRange(draftRange.start, draftRange.end);
    if (err) {
      setDraftError(err);
      return;
    }
    setTimeRange('custom');
    setDateRange({ start: draftRange.start, end: draftRange.end });
    setShowFilterDialog(false);
  };

  const periodLabel = `${dateRange.start ? dateRange.start.format('DD MMM YYYY') : '…'} – ${dateRange.end ? dateRange.end.format('DD MMM YYYY') : '…'}`;

  const handleTimeRangeChange = (range) => {
    setTimeRange(range);
    let start = dayjs();
    switch(range) {
      case '7days':
        start = dayjs().subtract(7, 'days');
        break;
      case '30days':
        start = dayjs().subtract(30, 'days');
        break;
      case '90days':
        start = dayjs().subtract(90, 'days');
        break;
      case 'year':
        start = dayjs().subtract(1, 'year');
        break;
      default:
        start = dayjs().subtract(30, 'days');
    }
    setDateRange({ start, end: dayjs() });
    setShowFilterDialog(false);
  };

  const formatCurrency = (amount) => {
    if (!amount) return 'R 0.00';
    try {
      return new Intl.NumberFormat('en-ZA', {
        style: 'currency',
        currency: 'ZAR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(amount);
    } catch {
      return `R ${Number(amount).toFixed(2)}`;
    }
  };

  const formatNumber = (num, decimals = 0) => {
    if (!num) return '0';
    try {
      return new Intl.NumberFormat('en-ZA', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      }).format(num);
    } catch {
      return String(num);
    }
  };

  // ============================================================
  // SAFE DATA EXTRACTION
  // ============================================================
  const safeAnalytics = useMemo(() => {
    if (!analytics) return getFallbackAnalytics();
    return analytics;
  }, [analytics]);

  const metrics = useMemo(() => ({
    totalTrips: safeAnalytics.totalTrips || 0,
    completedTrips: safeAnalytics.completedTrips || 0,
    cancelledTrips: safeAnalytics.cancelledTrips || 0,
    avgDistance: safeAnalytics.avgDistance || 0,
    avgDuration: safeAnalytics.avgDuration || 0,
    totalCost: safeAnalytics.totalCost || 0,
    avgCost: safeAnalytics.avgCost || 0,
    fuelEfficiency: safeAnalytics.fuelEfficiency || 0,
    onTimeRate: safeAnalytics.onTimeRate || 0
  }), [safeAnalytics]);

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <ResponsiveContainer>
        {/* Header */}
        <Box>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent="space-between"
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            mb={{ xs: 2, sm: 2.5, md: 3 }}
            spacing={{ xs: 1, sm: 0 }}
          >
            <Box>
              <Typography 
                variant="h5" 
                fontWeight="700" 
                sx={{ 
                  fontSize: { 
                    xs: '1.1rem', 
                    sm: '1.3rem', 
                    md: '1.4rem', 
                    lg: '1.5rem' 
                  } 
                }}
              >
                Trip Analytics
              </Typography>
              <Typography 
                variant="body2" 
                color="text.secondary" 
                sx={{ 
                  fontSize: { 
                    xs: '0.7rem', 
                    sm: '0.8rem', 
                    md: '0.85rem' 
                  } 
                }}
              >
                Trips planned for {periodLabel} • {metrics.totalTrips} trips
              </Typography>
            </Box>
            <Stack direction="row" spacing={0.75}>
              <Button
                startIcon={<RefreshIcon sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' } }} />}
                onClick={fetchAnalytics}
                variant="outlined"
                size="small"
                disabled={loading}
                sx={{
                  borderRadius: '10px',
                  fontSize: { xs: '0.7rem', sm: '0.75rem' },
                  textTransform: 'none',
                  py: { xs: 0.5, sm: 0.75 },
                  px: { xs: 1, sm: 2 }
                }}
              >
                {loading ? <CircularProgress size={16} /> : 'Refresh'}
              </Button>
              <Button
                startIcon={<FilterListIcon sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' } }} />}
                onClick={openFilterDialog}
                variant="outlined"
                size="small"
                sx={{
                  borderRadius: '10px',
                  fontSize: { xs: '0.7rem', sm: '0.75rem' },
                  textTransform: 'none',
                  py: { xs: 0.5, sm: 0.75 },
                  px: { xs: 1, sm: 2 }
                }}
              >
                {timeRange === '7days' ? '7 Days' :
                 timeRange === '30days' ? '30 Days' :
                 timeRange === '90days' ? '90 Days' :
                 timeRange === 'year' ? 'Year' : 'Custom'}
              </Button>
              <ExportButton
                title="Trip analytics"
                subtitle={`Period: ${periodLabel}`}
                columns={TRIP_REPORT_COLUMNS}
                fetchRows={async () => periodTrips}
                disabled={loading || periodTrips.length === 0}
                onError={(msg) => setError(msg)}
              />
            </Stack>
          </Stack>

          {/* Error Display */}
          {error && (
            <Alert 
              severity="error" 
              sx={{ mb: 2, borderRadius: '12px', fontSize: { xs: '0.7rem', sm: '0.8rem' } }} 
              onClose={() => setError(null)}
            >
              {error}
            </Alert>
          )}

          {/* Loading State */}
          {loading && (
            <Box sx={{ width: '100%', mb: 2 }}>
              <LinearProgress />
            </Box>
          )}

          {/* Metrics Grid */}
          <Grid container spacing={{ xs: 1.5, sm: 2, md: 2.5 }} sx={{ mb: 3 }}>
            <Grid size={{ xs: 6, sm: 4, md: 2 }}>
              <MetricCard
                title="Total Trips"
                value={formatNumber(metrics.totalTrips)}
                icon={TimelineIcon}
                color="primary"
                loading={loading}
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 4, md: 2 }}>
              <MetricCard
                title="Completed"
                value={formatNumber(metrics.completedTrips)}
                icon={CheckCircleIcon}
                color="success"
                subtitle={`${metrics.totalTrips > 0 ? ((metrics.completedTrips / metrics.totalTrips) * 100).toFixed(0) : 0}% rate`}
                loading={loading}
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 4, md: 2 }}>
              <MetricCard
                title="Avg Distance"
                value={`${formatNumber(metrics.avgDistance)} km`}
                icon={RouteIcon}
                color="info"
                loading={loading}
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 4, md: 2 }}>
              <MetricCard
                title="Avg Duration"
                value={`${metrics.avgDuration.toFixed(1)}h`}
                icon={ScheduleIcon}
                color="warning"
                loading={loading}
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 4, md: 2 }}>
              <MetricCard
                title="Total Cost"
                value={formatCurrency(metrics.totalCost)}
                icon={MoneyIcon}
                color="error"
                loading={loading}
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 4, md: 2 }}>
              <MetricCard
                title="On-Time Rate"
                value={safeAnalytics.onTimeSample ? `${metrics.onTimeRate.toFixed(0)}%` : 'n/a'}
                icon={AssessmentIcon}
                color="success"
                loading={loading}
              />
            </Grid>
          </Grid>

          {/* Charts Grid */}
          <Grid container spacing={{ xs: 1.5, sm: 2, md: 2.5 }}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Card sx={{ height: '100%', borderRadius: 2, border: '1px solid #ECECEC' }}>
                <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                  <SimplePieChart
                    data={safeAnalytics.statusDistribution || [{ label: 'No Data', value: 1 }]}
                    title="Trip Status Distribution"
                  />
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Card sx={{ height: '100%', borderRadius: 2, border: '1px solid #ECECEC' }}>
                <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                  <SimpleBarChart
                    data={safeAnalytics.weeklyTrends || [{ label: 'No Data', value: 1 }]}
                    title="Weekly Trip Trends"
                    color="primary"
                  />
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Card sx={{ height: '100%', borderRadius: 2, border: '1px solid #ECECEC' }}>
                <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                  <SimpleBarChart
                    data={safeAnalytics.topRoutes || [{ label: 'No Data', value: 1 }]}
                    title="Top Routes"
                    color="secondary"
                  />
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Card sx={{ borderRadius: 2, border: '1px solid #ECECEC' }}>
                <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                  <Typography 
                    variant="subtitle2" 
                    sx={{ 
                      fontSize: { xs: '0.7rem', sm: '0.8rem' }, 
                      fontWeight: 600, 
                      mb: 1.5,
                      color: '#111827'
                    }}
                  >
                    Top Performing Drivers
                  </Typography>
                  <List dense disablePadding>
                    {(safeAnalytics.topDrivers || []).length === 0 && (
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                        No driver data for this period.
                      </Typography>
                    )}
                    {(safeAnalytics.topDrivers || []).map((driver, index) => (
                      <ListItem key={index} disablePadding sx={{ py: 0.75, borderBottom: index < 4 ? '1px solid #F3F4F6' : 'none' }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          <Avatar sx={{ width: 24, height: 24, fontSize: '0.6rem', bgcolor: '#4F46E5' }}>
                            {toSafeString(driver.name).charAt(0) || 'D'}
                          </Avatar>
                        </ListItemIcon>
                        <ListItemText
                          primary={toSafeString(driver.name)}
                          // was "⭐ 4.5" - a made-up rating shown for every driver without one
                          secondary={`${driver.completed} completed • ${formatNumber(driver.km)} km`}
                          primaryTypographyProps={{ fontSize: { xs: '0.65rem', sm: '0.75rem' }, fontWeight: 500, color: '#111827' }}
                          secondaryTypographyProps={{ fontSize: { xs: '0.55rem', sm: '0.65rem' }, color: '#6B7280' }}
                        />
                        <Chip
                          label={`${toSafeString(driver.trips)} trips`}
                          size="small"
                          sx={{ height: 20, fontSize: { xs: '0.5rem', sm: '0.6rem' }, bgcolor: '#EEF2FF', color: '#4F46E5' }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Card sx={{ borderRadius: 2, border: '1px solid #ECECEC' }}>
                <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                  <Typography 
                    variant="subtitle2" 
                    sx={{ 
                      fontSize: { xs: '0.7rem', sm: '0.8rem' }, 
                      fontWeight: 600, 
                      mb: 1.5,
                      color: '#111827'
                    }}
                  >
                    Key Insights
                  </Typography>
                  <Stack spacing={1}>
                    <Paper sx={{ p: 1.5, bgcolor: '#D1FAE5', borderRadius: 2 }}>
                      <Typography variant="caption" sx={{ fontSize: { xs: '0.6rem', sm: '0.65rem' }, fontWeight: 500, color: '#065F46' }}>
                        💡 Efficiency Improvement
                      </Typography>
                      <Typography variant="body2" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' }, color: '#065F46' }}>
                        {metrics.fuelEfficiency > 0
                          ? `Average fuel efficiency: ${metrics.fuelEfficiency.toFixed(1)} L/100km`
                          : 'Not enough fuel and distance data in this period to calculate efficiency.'}
                      </Typography>
                    </Paper>
                    
                    <Paper sx={{ p: 1.5, bgcolor: '#FEF3C7', borderRadius: 2 }}>
                      <Typography variant="caption" sx={{ fontSize: { xs: '0.6rem', sm: '0.65rem' }, fontWeight: 500, color: '#92400E' }}>
                        ⚠️ Areas for Improvement
                      </Typography>
                      <Typography variant="body2" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' }, color: '#92400E' }}>
                        {/* with no started trips this used to say "100% of trips have delays" */}
                        {!safeAnalytics.onTimeSample
                          ? 'No started trips in this period yet - on-time performance not available.'
                          : metrics.onTimeRate < 80
                            ? `${(100 - metrics.onTimeRate).toFixed(0)}% of ${safeAnalytics.onTimeSample} started trips began more than 2 hours late`
                            : 'On-time performance is good'}
                      </Typography>
                    </Paper>
                    
                    <Paper sx={{ p: 1.5, bgcolor: '#DBEAFE', borderRadius: 2 }}>
                      <Typography variant="caption" sx={{ fontSize: { xs: '0.6rem', sm: '0.65rem' }, fontWeight: 500, color: '#1E40AF' }}>
                        📊 Trip Summary
                      </Typography>
                      <Typography variant="body2" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' }, color: '#1E40AF' }}>
                        {metrics.totalTrips} total trips • {metrics.completedTrips} completed • {metrics.cancelledTrips} cancelled
                      </Typography>
                    </Paper>

                    <Paper sx={{ p: 1.5, bgcolor: '#EDE9FE', borderRadius: 2 }}>
                      <Typography variant="caption" sx={{ fontSize: { xs: '0.6rem', sm: '0.65rem' }, fontWeight: 500, color: '#5B21B6' }}>
                        🎯 Recommendation
                      </Typography>
                      <Typography variant="body2" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' }, color: '#5B21B6' }}>
                        {safeAnalytics.topRoutes && safeAnalytics.topRoutes.length > 0 && metrics.totalTrips > 0
                          ? `Optimize ${safeAnalytics.topRoutes[0]?.label || 'top route'} for better efficiency`
                          : 'Analyze routes for optimization opportunities'}
                      </Typography>
                    </Paper>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>

        {/* Filter Dialog */}
        <Dialog 
          open={showFilterDialog} 
          onClose={() => setShowFilterDialog(false)} 
          maxWidth="sm" 
          fullWidth
          PaperProps={{ sx: { borderRadius: 2 } }}
        >
          <DialogTitle sx={{ py: 1.5, px: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="h6" sx={{ fontSize: { xs: '0.9rem', sm: '1rem' }, fontWeight: 600 }}>
              Filter Analytics
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ p: 2 }}>
            <Stack spacing={2}>
              <Typography variant="subtitle2" sx={{ fontSize: { xs: '0.75rem', sm: '0.85rem' }, fontWeight: 600 }}>
                Time Range
              </Typography>
              <Grid container spacing={1}>
                {[
                  { value: '7days', label: '7 Days' },
                  { value: '30days', label: '30 Days' },
                  { value: '90days', label: '90 Days' },
                  { value: 'year', label: 'Year' }
                ].map((option) => (
                  <Grid size={{ xs: 6 }} key={option.value}>
                    <Button
                      fullWidth
                      variant={timeRange === option.value ? 'contained' : 'outlined'}
                      onClick={() => handleTimeRangeChange(option.value)}
                      size="small"
                      sx={{ 
                        fontSize: { xs: '0.7rem', sm: '0.75rem' },
                        borderRadius: '8px',
                        textTransform: 'none'
                      }}
                    >
                      {option.label}
                    </Button>
                  </Grid>
                ))}
              </Grid>

              <Divider />

              <Typography variant="subtitle2" sx={{ fontSize: { xs: '0.75rem', sm: '0.85rem' }, fontWeight: 600 }}>
                Custom Range
              </Typography>
              
              {draftError && (
                <Alert severity="error" sx={{ fontSize: '0.75rem' }}>{draftError}</Alert>
              )}

              <DatePicker
                label="Start Date"
                value={draftRange.start}
                onChange={(newValue) => { setDraftRange((r) => ({ ...r, start: newValue })); setDraftError(null); }}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: 'small',
                    sx: { 
                      '& .MuiInputLabel-root': { fontSize: { xs: '0.65rem', sm: '0.75rem' } },
                      '& .MuiInputBase-root': { fontSize: { xs: '0.7rem', sm: '0.8rem' } }
                    }
                  }
                }}
              />

              <DatePicker
                label="End Date"
                value={draftRange.end}
                onChange={(newValue) => { setDraftRange((r) => ({ ...r, end: newValue })); setDraftError(null); }}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: 'small',
                    sx: { 
                      '& .MuiInputLabel-root': { fontSize: { xs: '0.65rem', sm: '0.75rem' } },
                      '& .MuiInputBase-root': { fontSize: { xs: '0.7rem', sm: '0.8rem' } }
                    }
                  }
                }}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
            <Button 
              onClick={() => setShowFilterDialog(false)}
              size="small"
              sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem' }, color: '#6B7280' }}
            >
              Cancel
            </Button>
            <Button
              onClick={applyCustomRange}
              variant="contained"
              size="small"
              sx={{ 
                fontSize: { xs: '0.7rem', sm: '0.8rem' },
                borderRadius: '8px',
                textTransform: 'none',
                background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)'
              }}
            >
              Apply Filters
            </Button>
          </DialogActions>
        </Dialog>
      </ResponsiveContainer>
    </LocalizationProvider>
  );
};

export default TripAnalytics;
