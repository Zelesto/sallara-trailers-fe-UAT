// src/pages/TripAnalytics.jsx
import React, { useState, useEffect, useCallback } from 'react';
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

// Status configuration
const STATUS_CONFIG = {
  DRAFT: { color: '#9e9e9e', bgColor: '#f5f5f5', label: 'Draft', icon: '✏️' },
  PLANNED: { color: '#0288d1', bgColor: '#e3f2fd', label: 'Planned', icon: '📅' },
  ASSIGNED: { color: '#7b1fa2', bgColor: '#f3e5f5', label: 'Assigned', icon: '👤' },
  IN_PROGRESS: { color: '#ed6c02', bgColor: '#fff3e0', label: 'In Progress', icon: '🚚' },
  ACTIVE: { color: '#2e7d32', bgColor: '#e8f5e8', label: 'Active', icon: '✅' },
  PENDING: { color: '#ff9800', bgColor: '#fff3e0', label: 'Pending', icon: '⏳' },
  COMPLETED: { color: '#0097a7', bgColor: '#e0f7fa', label: 'Completed', icon: '🏁' },
  CANCELLED: { color: '#d32f2f', bgColor: '#ffebee', label: 'Cancelled', icon: '❌' },
  CLOSED: { color: '#5d4037', bgColor: '#efebe9', label: 'Closed', icon: '🔒' },
  FINALIZED: { color: '#388e3c', bgColor: '#e8f5e8', label: 'Finalized', icon: '📊' }
};

// Metric Card Component
const MetricCard = ({ title, value, icon: Icon, color = 'primary', subtitle, trend }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Box flex={1}>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
            {title}
          </Typography>
          <Typography variant="h6" fontWeight="bold" sx={{ fontSize: '1rem', mt: 0.25 }}>
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem', display: 'block' }}>
              {subtitle}
            </Typography>
          )}
          {trend && (
            <Chip
              label={trend}
              size="small"
              color={trend.startsWith('+') ? 'success' : 'error'}
              sx={{ height: 18, fontSize: '0.55rem', mt: 0.5 }}
            />
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

// Simple bar chart component
const SimpleBarChart = ({ data, title, color = 'primary' }) => {
  const maxValue = Math.max(...data.map(d => d.value), 1);
  
  return (
    <Box>
      <Typography variant="subtitle2" sx={{ fontSize: '0.75rem', fontWeight: 600, mb: 1 }}>
        {title}
      </Typography>
      <Stack spacing={0.5}>
        {data.map((item, index) => (
          <Box key={index}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>
                {item.label}
              </Typography>
              <Typography variant="caption" fontWeight="500" sx={{ fontSize: '0.65rem' }}>
                {item.value}
              </Typography>
            </Box>
            <Box sx={{ width: '100%', height: 4, bgcolor: 'grey.100', borderRadius: 1, overflow: 'hidden' }}>
              <Box
                sx={{
                  width: `${(item.value / maxValue) * 100}%`,
                  height: '100%',
                  bgcolor: `${color}.main`,
                  borderRadius: 1,
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

// Simple pie chart component using flex
const SimplePieChart = ({ data, title }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  return (
    <Box>
      <Typography variant="subtitle2" sx={{ fontSize: '0.75rem', fontWeight: 600, mb: 1 }}>
        {title}
      </Typography>
      <Stack direction="row" spacing={2} alignItems="center">
        <Box sx={{ position: 'relative', width: 100, height: 100 }}>
          {data.map((item, index) => {
            const percentage = (item.value / total) * 100;
            const degrees = (percentage / 100) * 360;
            const colors = ['primary', 'success', 'warning', 'error', 'info', 'secondary'];
            return (
              <Box
                key={index}
                sx={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  clipPath: `conic-gradient(from ${index === 0 ? 0 : data.slice(0, index).reduce((sum, d) => sum + (d.value / total) * 360, 0)}deg, ${theme => theme.palette[colors[index % colors.length]].main} 0deg, ${theme => theme.palette[colors[index % colors.length]].main} ${degrees}deg, transparent ${degrees}deg)`
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
              bgcolor: 'background.paper',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Typography variant="caption" fontWeight="bold" sx={{ fontSize: '0.65rem' }}>
              {total}
            </Typography>
          </Box>
        </Box>
        <Stack spacing={0.5} flex={1}>
          {data.map((item, index) => {
            const colors = ['primary', 'success', 'warning', 'error', 'info', 'secondary'];
            const percentage = ((item.value / total) * 100).toFixed(0);
            return (
              <Box key={index} display="flex" alignItems="center" gap={1}>
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: `${colors[index % colors.length]}.main`
                  }}
                />
                <Typography variant="caption" sx={{ fontSize: '0.6rem', flex: 1 }}>
                  {item.label}
                </Typography>
                <Typography variant="caption" fontWeight="500" sx={{ fontSize: '0.6rem' }}>
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
  const [metrics, setMetrics] = useState({
    totalTrips: 0,
    completedTrips: 0,
    cancelledTrips: 0,
    avgDistance: 0,
    avgDuration: 0,
    totalCost: 0,
    avgCost: 0,
    fuelEfficiency: 0,
    onTimeRate: 0
  });

  // Sample data for charts
  const [statusDistribution, setStatusDistribution] = useState([
    { label: 'Completed', value: 45 },
    { label: 'Active', value: 12 },
    { label: 'Planned', value: 28 },
    { label: 'Cancelled', value: 8 },
    { label: 'Other', value: 7 }
  ]);

  const [weeklyTrends, setWeeklyTrends] = useState([
    { label: 'Week 1', value: 18 },
    { label: 'Week 2', value: 22 },
    { label: 'Week 3', value: 15 },
    { label: 'Week 4', value: 25 },
    { label: 'Week 5', value: 20 }
  ]);

  const [topRoutes, setTopRoutes] = useState([
    { label: 'JHB → CPT', value: 28 },
    { label: 'JHB → DUR', value: 22 },
    { label: 'CPT → JHB', value: 18 },
    { label: 'DUR → JHB', value: 15 },
    { label: 'PE → JHB', value: 10 }
  ]);

  const [topDrivers, setTopDrivers] = useState([
    { name: 'John Doe', trips: 12, rating: 4.8 },
    { name: 'Jane Smith', trips: 10, rating: 4.9 },
    { name: 'Mike Johnson', trips: 8, rating: 4.7 },
    { name: 'Sarah Williams', trips: 7, rating: 4.6 },
    { name: 'David Brown', trips: 6, rating: 4.5 }
  ]);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        startDate: dateRange.start?.format('YYYY-MM-DD'),
        endDate: dateRange.end?.format('YYYY-MM-DD')
      };

      const data = await tripService.getTripAnalytics(params);
      setAnalytics(data);
      
      // Update metrics with real data
      if (data) {
        setMetrics({
          totalTrips: data.totalTrips || 0,
          completedTrips: data.completedTrips || 0,
          cancelledTrips: data.cancelledTrips || 0,
          avgDistance: data.avgDistance || 0,
          avgDuration: data.avgDuration || 0,
          totalCost: data.totalCost || 0,
          avgCost: data.avgCost || 0,
          fuelEfficiency: data.fuelEfficiency || 0,
          onTimeRate: data.onTimeRate || 0
        });
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Failed to load analytics data');
      // Use sample data for demo
      setMetrics({
        totalTrips: 156,
        completedTrips: 89,
        cancelledTrips: 12,
        avgDistance: 387,
        avgDuration: 8.5,
        totalCost: 452800,
        avgCost: 4250,
        fuelEfficiency: 4.2,
        onTimeRate: 78
      });
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

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
    fetchAnalytics();
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
              Trip Analytics
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
              Advanced analytics and insights for your trips
            </Typography>
          </Box>
          <Stack direction="row" spacing={0.75}>
            <Button
              startIcon={<RefreshIcon sx={{ fontSize: '0.9rem' }} />}
              onClick={fetchAnalytics}
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
              {timeRange === '7days' ? '7 Days' :
               timeRange === '30days' ? '30 Days' :
               timeRange === '90days' ? '90 Days' :
               timeRange === 'year' ? 'Year' : 'Custom'}
            </Button>
            <Button
              startIcon={<DownloadIcon sx={{ fontSize: '0.9rem' }} />}
              variant="contained"
              size="small"
              sx={{ fontSize: '0.75rem', py: 0.5 }}
            >
              Export
            </Button>
          </Stack>
        </Box>

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

        {/* Metrics Grid */}
        <Grid container spacing={1.5} sx={{ mb: 2 }}>
          <Grid item xs={6} sm={4} md={2}>
            <MetricCard
              title="Total Trips"
              value={formatNumber(metrics.totalTrips)}
              icon={TimelineIcon}
              color="primary"
              trend={metrics.totalTrips > 0 ? '+12%' : ''}
            />
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <MetricCard
              title="Completed"
              value={formatNumber(metrics.completedTrips)}
              icon={CheckCircleIcon}
              color="success"
              subtitle={`${metrics.totalTrips > 0 ? ((metrics.completedTrips / metrics.totalTrips) * 100).toFixed(0) : 0}% rate`}
            />
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <MetricCard
              title="Avg Distance"
              value={`${formatNumber(metrics.avgDistance)} km`}
              icon={RouteIcon}
              color="info"
            />
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <MetricCard
              title="Avg Duration"
              value={`${metrics.avgDuration.toFixed(1)}h`}
              icon={ScheduleIcon}
              color="warning"
            />
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <MetricCard
              title="Total Cost"
              value={formatCurrency(metrics.totalCost)}
              icon={MoneyIcon}
              color="error"
            />
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <MetricCard
              title="On-Time Rate"
              value={`${metrics.onTimeRate.toFixed(0)}%`}
              icon={AssessmentIcon}
              color="success"
            />
          </Grid>
        </Grid>

        {/* Charts Grid */}
        <Grid container spacing={2}>
          {/* Status Distribution */}
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: 2 }}>
                <SimplePieChart
                  data={statusDistribution}
                  title="Trip Status Distribution"
                />
              </CardContent>
            </Card>
          </Grid>

          {/* Weekly Trends */}
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: 2 }}>
                <SimpleBarChart
                  data={weeklyTrends}
                  title="Weekly Trip Trends"
                  color="primary"
                />
              </CardContent>
            </Card>
          </Grid>

          {/* Top Routes */}
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: 2 }}>
                <SimpleBarChart
                  data={topRoutes}
                  title="Top Routes"
                  color="secondary"
                />
              </CardContent>
            </Card>
          </Grid>

          {/* Top Drivers */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent sx={{ p: 2 }}>
                <Typography variant="subtitle2" sx={{ fontSize: '0.75rem', fontWeight: 600, mb: 1.5 }}>
                  Top Performing Drivers
                </Typography>
                <List dense disablePadding>
                  {topDrivers.map((driver, index) => (
                    <ListItem key={index} disablePadding sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 28 }}>
                        <Avatar sx={{ width: 20, height: 20, fontSize: '0.6rem', bgcolor: 'primary.main' }}>
                          {driver.name.charAt(0)}
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={driver.name}
                        secondary={`${driver.trips} trips • ⭐ ${driver.rating}`}
                        primaryTypographyProps={{ fontSize: '0.7rem', fontWeight: 500 }}
                        secondaryTypographyProps={{ fontSize: '0.6rem' }}
                      />
                      <Chip
                        label={`${driver.trips} trips`}
                        size="small"
                        sx={{ height: 18, fontSize: '0.55rem' }}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Key Insights */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent sx={{ p: 2 }}>
                <Typography variant="subtitle2" sx={{ fontSize: '0.75rem', fontWeight: 600, mb: 1.5 }}>
                  Key Insights
                </Typography>
                <Stack spacing={1}>
                  <Paper sx={{ p: 1, bgcolor: 'success.light', borderRadius: 1 }}>
                    <Typography variant="caption" sx={{ fontSize: '0.65rem', fontWeight: 500, color: 'success.dark' }}>
                      💡 Efficiency Improvement
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>
                      Average fuel efficiency increased by 8% compared to last period
                    </Typography>
                  </Paper>
                  
                  <Paper sx={{ p: 1, bgcolor: 'warning.light', borderRadius: 1 }}>
                    <Typography variant="caption" sx={{ fontSize: '0.65rem', fontWeight: 500, color: 'warning.dark' }}>
                      ⚠️ Areas for Improvement
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>
                      12% of trips have delays exceeding 2 hours
                    </Typography>
                  </Paper>
                  
                  <Paper sx={{ p: 1, bgcolor: 'info.light', borderRadius: 1 }}>
                    <Typography variant="caption" sx={{ fontSize: '0.65rem', fontWeight: 500, color: 'info.dark' }}>
                      📊 Top Performance
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>
                      Driver John Doe maintains 98% on-time delivery rate
                    </Typography>
                  </Paper>

                  <Paper sx={{ p: 1, bgcolor: 'primary.light', borderRadius: 1 }}>
                    <Typography variant="caption" sx={{ fontSize: '0.65rem', fontWeight: 500, color: 'primary.dark' }}>
                      🎯 Recommendation
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>
                      Consider optimizing JHB → CPT route to reduce average duration by 1.5 hours
                    </Typography>
                  </Paper>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

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
              Filter Analytics
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ p: 2 }}>
            <Stack spacing={2}>
              <Typography variant="subtitle2" sx={{ fontSize: '0.8rem', fontWeight: 600 }}>
                Time Range
              </Typography>
              <Grid container spacing={1}>
                {[
                  { value: '7days', label: '7 Days' },
                  { value: '30days', label: '30 Days' },
                  { value: '90days', label: '90 Days' },
                  { value: 'year', label: 'Year' }
                ].map((option) => (
                  <Grid item xs={6} key={option.value}>
                    <Button
                      fullWidth
                      variant={timeRange === option.value ? 'contained' : 'outlined'}
                      onClick={() => handleTimeRangeChange(option.value)}
                      size="small"
                      sx={{ fontSize: '0.75rem' }}
                    >
                      {option.label}
                    </Button>
                  </Grid>
                ))}
              </Grid>

              <Divider />

              <Typography variant="subtitle2" sx={{ fontSize: '0.8rem', fontWeight: 600 }}>
                Custom Range
              </Typography>
              
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
              onClick={() => setShowFilterDialog(false)}
              size="small"
              sx={{ fontSize: '0.8rem' }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setShowFilterDialog(false);
                fetchAnalytics();
              }}
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

export default TripAnalytics;
