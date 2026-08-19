// src/pages/TripAnalytics.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { ResponsiveContainer } from '../components/ResponsiveContainer';

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
const STATUS_CONFIG = {
  DRAFT: { color: '#9e9e9e', bgColor: '#f5f5f5', label: 'Draft' },
  PLANNED: { color: '#0288d1', bgColor: '#e3f2fd', label: 'Planned' },
  ASSIGNED: { color: '#7b1fa2', bgColor: '#f3e5f5', label: 'Assigned' },
  IN_PROGRESS: { color: '#ed6c02', bgColor: '#fff3e0', label: 'In Progress' },
  ACTIVE: { color: '#2e7d32', bgColor: '#e8f5e8', label: 'Active' },
  PENDING: { color: '#ff9800', bgColor: '#fff3e0', label: 'Pending' },
  COMPLETED: { color: '#0097a7', bgColor: '#e0f7fa', label: 'Completed' },
  CANCELLED: { color: '#d32f2f', bgColor: '#ffebee', label: 'Cancelled' },
  CLOSED: { color: '#5d4037', bgColor: '#efebe9', label: 'Closed' },
  FINALIZED: { color: '#388e3c', bgColor: '#e8f5e8', label: 'Finalized' }
};

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
  // ============================================================
  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        startDate: dateRange.start?.format('YYYY-MM-DD'),
        endDate: dateRange.end?.format('YYYY-MM-DD')
      };

      let data;
      try {
        data = await tripService.getTripAnalytics(params);
      } catch (err) {
        console.warn('Failed to fetch analytics from API, using fallback data:', err);
        // Fallback: fetch all trips and calculate analytics locally
        const tripsResponse = await tripService.getAllTrips({ size: 1000 });
        const trips = tripsResponse?.content || [];
        data = calculateAnalyticsFromTrips(trips);
      }
      
      setAnalytics(data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Failed to load analytics data');
      // Use fallback data
      setAnalytics(getFallbackAnalytics());
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  // ============================================================
  // CALCULATE ANALYTICS FROM TRIPS
  // ============================================================
  const calculateAnalyticsFromTrips = (trips) => {
    if (!trips || trips.length === 0) return getFallbackAnalytics();
    
    const total = trips.length;
    const completed = trips.filter(t => t.status === 'COMPLETED' || t.status === 'FINALIZED').length;
    const cancelled = trips.filter(t => t.status === 'CANCELLED').length;
    const active = trips.filter(t => t.status === 'ACTIVE' || t.status === 'IN_PROGRESS').length;
    const planned = trips.filter(t => t.status === 'PLANNED' || t.status === 'ASSIGNED').length;
    
    // Calculate average distance
    let totalDistance = 0;
    let distanceCount = 0;
    trips.forEach(t => {
      const dist = t.totalDistance || t.distance || t.distanceKm || t.plannedDistanceKm || 0;
      if (dist > 0) {
        totalDistance += typeof dist === 'number' ? dist : parseFloat(dist) || 0;
        distanceCount++;
      }
    });
    const avgDistance = distanceCount > 0 ? totalDistance / distanceCount : 0;
    
    // Calculate average duration
    let totalDuration = 0;
    let durationCount = 0;
    trips.forEach(t => {
      if (t.actualStartDate && t.actualEndDate) {
        try {
          const start = new Date(t.actualStartDate);
          const end = new Date(t.actualEndDate);
          const hours = (end - start) / (1000 * 60 * 60);
          if (hours > 0) {
            totalDuration += hours;
            durationCount++;
          }
        } catch {
          // Ignore invalid dates
        }
      }
    });
    const avgDuration = durationCount > 0 ? totalDuration / durationCount : 0;
    
    // Calculate on-time rate
    let onTime = 0;
    let onTimeCount = 0;
    trips.forEach(t => {
      if (t.plannedStartDate && t.actualStartDate) {
        try {
          const planned = new Date(t.plannedStartDate);
          const actual = new Date(t.actualStartDate);
          const delay = (actual - planned) / (1000 * 60 * 60);
          if (delay <= 2) {
            onTime++;
          }
          onTimeCount++;
        } catch {
          // Ignore invalid dates
        }
      }
    });
    const onTimeRate = onTimeCount > 0 ? (onTime / onTimeCount) * 100 : 0;
    
    // Calculate total cost
    let totalCost = 0;
    trips.forEach(t => {
      const cost = t.totalCost || t.cost || 0;
      if (cost > 0) {
        totalCost += typeof cost === 'number' ? cost : parseFloat(cost) || 0;
      }
    });
    const avgCost = total > 0 ? totalCost / total : 0;
    
    // Calculate fuel efficiency
    let totalFuel = 0;
    let fuelDistance = 0;
    trips.forEach(t => {
      const fuel = t.fuelConsumed || 0;
      const dist = t.totalDistance || t.distance || 0;
      if (fuel > 0 && dist > 0) {
        totalFuel += typeof fuel === 'number' ? fuel : parseFloat(fuel) || 0;
        fuelDistance += typeof dist === 'number' ? dist : parseFloat(dist) || 0;
      }
    });
    const fuelEfficiency = fuelDistance > 0 ? (totalFuel / fuelDistance) * 100 : 0;
    
    // Status distribution for chart
    const statusDistribution = [
      { label: 'Completed', value: completed },
      { label: 'Active', value: active },
      { label: 'Planned', value: planned },
      { label: 'Cancelled', value: cancelled },
      { label: 'Other', value: total - completed - active - planned - cancelled }
    ].filter(item => item.value > 0);
    
    // Weekly trends
    const weeklyData = getWeeklyTrends(trips);
    
    // Top routes
    const routeData = getTopRoutes(trips);
    
    // Top drivers
    const driverData = getTopDrivers(trips);
    
    return {
      totalTrips: total,
      completedTrips: completed,
      cancelledTrips: cancelled,
      activeTrips: active,
      plannedTrips: planned,
      avgDistance: avgDistance,
      avgDuration: avgDuration,
      totalCost: totalCost,
      avgCost: avgCost,
      fuelEfficiency: fuelEfficiency,
      onTimeRate: onTimeRate,
      statusDistribution: statusDistribution,
      weeklyTrends: weeklyData,
      topRoutes: routeData,
      topDrivers: driverData
    };
  };

  // ============================================================
  // HELPER FUNCTIONS FOR ANALYTICS
  // ============================================================
  const getWeeklyTrends = (trips) => {
    const weeks = {};
    trips.forEach(t => {
      const date = t.createdAt || t.plannedStartDate || t.startDate;
      if (date) {
        try {
          const d = new Date(date);
          const week = Math.ceil((d - new Date(d.getFullYear(), 0, 1)) / (7 * 24 * 60 * 60 * 1000));
          weeks[week] = (weeks[week] || 0) + 1;
        } catch {
          // Ignore invalid dates
        }
      }
    });
    const sorted = Object.entries(weeks).sort((a, b) => parseInt(a[0]) - parseInt(b[0]));
    const maxWeeks = Math.min(sorted.length, 8);
    return sorted.slice(-maxWeeks).map(([week, count]) => ({
      label: `Week ${week}`,
      value: count
    }));
  };

  const getTopRoutes = (trips) => {
    const routes = {};
    trips.forEach(t => {
      const origin = t.originCity || t.origin?.city || 'Unknown';
      const dest = t.destinationCity || t.destination?.city || 'Unknown';
      const key = `${origin} → ${dest}`;
      routes[key] = (routes[key] || 0) + 1;
    });
    return Object.entries(routes)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([label, value]) => ({ label, value }));
  };

  const getTopDrivers = (trips) => {
    const drivers = {};
    trips.forEach(t => {
      const name = t.driver?.firstName || t.driver?.name || t.driverName || 'Unknown';
      if (name !== 'Unknown') {
        if (!drivers[name]) {
          drivers[name] = { trips: 0, rating: 0, ratingCount: 0 };
        }
        drivers[name].trips++;
        const rating = t.driver?.rating || t.rating || 0;
        if (rating > 0) {
          drivers[name].rating += typeof rating === 'number' ? rating : parseFloat(rating) || 0;
          drivers[name].ratingCount++;
        }
      }
    });
    return Object.entries(drivers)
      .sort((a, b) => b[1].trips - a[1].trips)
      .slice(0, 5)
      .map(([name, data]) => ({
        name,
        trips: data.trips,
        rating: data.ratingCount > 0 ? (data.rating / data.ratingCount).toFixed(1) : '4.5'
      }));
  };

  // ============================================================
  // FALLBACK DATA
  // ============================================================
  const getFallbackAnalytics = () => ({
    totalTrips: 0,
    completedTrips: 0,
    cancelledTrips: 0,
    activeTrips: 0,
    plannedTrips: 0,
    avgDistance: 0,
    avgDuration: 0,
    totalCost: 0,
    avgCost: 0,
    fuelEfficiency: 0,
    onTimeRate: 0,
    statusDistribution: [{ label: 'No Data', value: 1 }],
    weeklyTrends: [{ label: 'No Data', value: 1 }],
    topRoutes: [{ label: 'No Data', value: 1 }],
    topDrivers: [{ name: 'No Data', trips: 0, rating: '0' }]
  });

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // ============================================================
  // HANDLERS
  // ============================================================
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
                Advanced analytics and insights for your trips
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
                onClick={() => setShowFilterDialog(true)}
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
                value={`${metrics.onTimeRate.toFixed(0)}%`}
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
                    {(safeAnalytics.topDrivers || [{ name: 'No Data', trips: 0, rating: '0' }]).map((driver, index) => (
                      <ListItem key={index} disablePadding sx={{ py: 0.75, borderBottom: index < 4 ? '1px solid #F3F4F6' : 'none' }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          <Avatar sx={{ width: 24, height: 24, fontSize: '0.6rem', bgcolor: '#4F46E5' }}>
                            {toSafeString(driver.name).charAt(0) || 'D'}
                          </Avatar>
                        </ListItemIcon>
                        <ListItemText
                          primary={toSafeString(driver.name)}
                          secondary={`${toSafeString(driver.trips)} trips • ⭐ ${toSafeString(driver.rating)}`}
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
                        Average fuel efficiency: {metrics.fuelEfficiency.toFixed(1)} L/100km
                      </Typography>
                    </Paper>
                    
                    <Paper sx={{ p: 1.5, bgcolor: '#FEF3C7', borderRadius: 2 }}>
                      <Typography variant="caption" sx={{ fontSize: { xs: '0.6rem', sm: '0.65rem' }, fontWeight: 500, color: '#92400E' }}>
                        ⚠️ Areas for Improvement
                      </Typography>
                      <Typography variant="body2" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' }, color: '#92400E' }}>
                        {metrics.onTimeRate < 80 ? `${(100 - metrics.onTimeRate).toFixed(0)}% of trips have delays` : 'On-time performance is good'}
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
                        {safeAnalytics.topRoutes && safeAnalytics.topRoutes.length > 0 
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
              
              <DatePicker
                label="Start Date"
                value={dateRange.start}
                onChange={(newValue) => setDateRange({ ...dateRange, start: newValue })}
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
                value={dateRange.end}
                onChange={(newValue) => setDateRange({ ...dateRange, end: newValue })}
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
              onClick={() => {
                setShowFilterDialog(false);
                fetchAnalytics();
              }}
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
