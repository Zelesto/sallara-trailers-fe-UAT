// src/pages/Dashboard.jsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  Alert,
  Button,
  Chip,
  IconButton,
  Avatar,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Stack,
  Tooltip,
  Divider,
  CircularProgress,
  LinearProgress,
  useTheme,
  useMediaQuery,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Badge,
  Collapse,
  Fade,
  Grow,
} from '@mui/material';
import {
  DirectionsCar,
  People,
  LocalGasStation,
  AttachMoney,
  TrendingUp,
  TrendingDown,
  Refresh,
  MoreVert,
  Search,
  Notifications,
  Speed,
  Map,
  Timeline,
  Assessment,
  CheckCircle,
  Warning as WarningIcon,
  Cancel as CancelIcon,
  Inventory as InventoryIcon,
  AddAlert as AddAlertIcon,
  ExpandMore,
  ExpandLess,
  Parking,
  Route,
  Person,
  CarRental,
  GpsFixed,
  Speed as SpeedIcon,
  Timer,
  LocationOn,
  Star,
  StarBorder,
  Dashboard as DashboardIcon,
} from '@mui/icons-material';
import { analyticsService } from '../services/analyticsService';
import { inventoryNotificationService } from '../services/inventoryNotificationService';
import { tripService } from '../services/tripService';

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

const formatCurrency = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) return 'R 0.00';
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numAmount);
};

const formatNumber = (num, decimals = 0) => {
  if (num === null || num === undefined || isNaN(num)) return '0';
  const number = typeof num === 'string' ? parseFloat(num) : num;
  return new Intl.NumberFormat('en-ZA', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(number);
};

const getColor = (color) => {
  const colors = {
    primary: '#4F46E5',
    success: '#22C55E',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
    secondary: '#6B7280',
    purple: '#8B5CF6',
    pink: '#EC4899',
    teal: '#14B8A6',
    indigo: '#6366F1',
  };
  return colors[color] || colors.primary;
};

const getColorBg = (color) => {
  const colors = {
    primary: '#EEF2FF',
    success: '#D1FAE5',
    warning: '#FEF3C7',
    error: '#FEE2E2',
    info: '#DBEAFE',
    secondary: '#F3F4F6',
    purple: '#EDE9FE',
    pink: '#FCE7F3',
    teal: '#CCFBF1',
    indigo: '#E0E7FF',
  };
  return colors[color] || colors.primary;
};

// ============================================================
// GAUGE COMPONENT
// ============================================================
const Gauge = ({ value, max = 100, size = 120, color = '#4F46E5', label, unit = '%' }) => {
  const percentage = Math.min((value / max) * 100, 100);
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <Box sx={{ textAlign: 'center', position: 'relative' }}>
      <Box sx={{ position: 'relative', display: 'inline-block' }}>
        <svg width={size} height={size * 0.6} viewBox="0 0 120 70">
          {/* Background arc */}
          <path
            d="M 15 65 A 45 45 0 0 1 105 65"
            fill="none"
            stroke="#E5E7EB"
            strokeWidth="10"
            strokeLinecap="round"
          />
          {/* Foreground arc */}
          <path
            d="M 15 65 A 45 45 0 0 1 105 65"
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 1s ease' }}
          />
          {/* Value text */}
          <text
            x="60"
            y="35"
            textAnchor="middle"
            fontSize="16"
            fontWeight="700"
            fill="#111827"
          >
            {typeof value === 'number' ? value.toFixed(1) : value}
          </text>
          <text
            x="60"
            y="50"
            textAnchor="middle"
            fontSize="8"
            fill="#6B7280"
          >
            {unit}
          </text>
        </svg>
      </Box>
      {label && (
        <Typography variant="caption" sx={{ display: 'block', mt: 0.5, fontSize: '0.6rem', color: '#6B7280' }}>
          {label}
        </Typography>
      )}
    </Box>
  );
};

// ============================================================
// STAT CARD COMPONENT
// ============================================================
const StatCard = React.memo(({
  title,
  value,
  icon: Icon,
  unit = '',
  color = 'primary',
  trend,
  subtitle,
  loading = false,
  gauge = null,
  onClick,
}) => (
  <Card
    sx={{
      backgroundColor: '#FFFFFF',
      borderRadius: '16px',
      border: '1px solid #ECECEC',
      transition: 'all 0.3s ease',
      height: '100%',
      cursor: onClick ? 'pointer' : 'default',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
        borderColor: getColor(color),
      },
      position: 'relative',
      overflow: 'visible',
    }}
    onClick={onClick}
  >
    <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
      {loading && (
        <Box sx={{ position: 'absolute', top: 12, right: 12 }}>
          <CircularProgress size={16} />
        </Box>
      )}

      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography
            variant="caption"
            sx={{
              color: '#6B7280',
              fontWeight: 600,
              textTransform: 'uppercase',
              fontSize: '0.6rem',
              letterSpacing: '0.5px',
              display: 'block',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {title}
          </Typography>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: '#111827',
              fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' },
              mt: 0.5,
              opacity: loading ? 0.7 : 1,
            }}
          >
            {typeof value === 'number' ? (
              unit === 'currency' ? formatCurrency(value) :
              unit === 'km' ? `${formatNumber(value)} km` :
              unit === 'liters' ? `${formatNumber(value)} L` :
              unit === 'km/L' ? `${value.toFixed(1)} km/L` :
              unit === '%' ? `${value.toFixed(0)}%` :
              formatNumber(value, 1)
            ) : value || 'N/A'}
          </Typography>
          {subtitle && (
            <Typography
              variant="caption"
              sx={{ color: '#6B7280', display: 'block', mt: 0.25, fontSize: '0.65rem' }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>
        <Box
          sx={{
            bgcolor: getColorBg(color),
            borderRadius: '12px',
            p: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon sx={{ color: getColor(color), fontSize: '1.5rem' }} />
        </Box>
      </Stack>

      {gauge && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
          <Gauge value={gauge.value} max={gauge.max} color={getColor(color)} unit={gauge.unit || '%'} />
        </Box>
      )}

      {trend !== undefined && trend !== null && !isNaN(trend) && (
        <Chip
          label={trend > 0 ? `+${trend.toFixed(1)}%` : `${trend.toFixed(1)}%`}
          size="small"
          sx={{
            mt: 1,
            bgcolor: trend > 0 ? '#D1FAE5' : trend < 0 ? '#FEE2E2' : '#DBEAFE',
            color: trend > 0 ? '#065F46' : trend < 0 ? '#991B1B' : '#1E40AF',
            fontWeight: 600,
            fontSize: '0.6rem',
            height: 20,
          }}
          icon={trend > 0 ? <TrendingUp sx={{ fontSize: '0.7rem' }} /> :
                 trend < 0 ? <TrendingDown sx={{ fontSize: '0.7rem' }} /> :
                 <Timeline sx={{ fontSize: '0.7rem' }} />}
        />
      )}
    </CardContent>
  </Card>
));

// ============================================================
// LOW STOCK ALERT COMPONENT
// ============================================================
const LowStockAlert = ({ items }) => {
  const [expanded, setExpanded] = useState(true);

  if (!items || items.length === 0) return null;

  const urgentItems = items.filter(item => item.quantity <= 0);
  const warningItems = items.filter(item => item.quantity > 0 && item.quantity <= item.minLevel);

  return (
    <Paper
      sx={{
        p: 2,
        mb: 2,
        borderRadius: '16px',
        border: '1px solid #FEE2E2',
        bgcolor: '#FEF2F2',
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1} mb={1}>
        <Badge badgeContent={items.length} color="error">
          <AddAlertIcon sx={{ color: '#EF4444' }} />
        </Badge>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#991B1B', fontSize: '0.85rem' }}>
          Low Stock Alerts
        </Typography>
        {urgentItems.length > 0 && (
          <Chip
            label={`${urgentItems.length} Out of Stock`}
            color="error"
            size="small"
            sx={{ height: 20, fontSize: '0.55rem' }}
          />
        )}
        {warningItems.length > 0 && (
          <Chip
            label={`${warningItems.length} Low Stock`}
            color="warning"
            size="small"
            sx={{ height: 20, fontSize: '0.55rem' }}
          />
        )}
        <IconButton size="small" onClick={() => setExpanded(!expanded)} sx={{ ml: 'auto' }}>
          {expanded ? <ExpandLess sx={{ fontSize: '1rem' }} /> : <ExpandMore sx={{ fontSize: '1rem' }} />}
        </IconButton>
      </Stack>

      {expanded && (
        <Grid container spacing={1}>
          {items.slice(0, 6).map((item, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Paper
                sx={{
                  p: 1.5,
                  bgcolor: item.quantity <= 0 ? '#FEE2E2' : '#FEF3C7',
                  borderRadius: '8px',
                  borderLeft: `3px solid ${item.quantity <= 0 ? '#EF4444' : '#F59E0B'}`,
                }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.75rem' }}>
                      {item.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
                      {item.quantity} {item.unitOfMeasure || 'units'} remaining
                    </Typography>
                  </Box>
                  <Chip
                    label={item.quantity <= 0 ? 'Out of Stock' : 'Low Stock'}
                    color={item.quantity <= 0 ? 'error' : 'warning'}
                    size="small"
                    sx={{ height: 18, fontSize: '0.5rem' }}
                  />
                </Stack>
                {item.minLevel && (
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.55rem' }}>
                    Min Level: {item.minLevel} {item.unitOfMeasure || 'units'}
                  </Typography>
                )}
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}
    </Paper>
  );
};

// ============================================================
// MAIN DASHBOARD COMPONENT
// ============================================================
const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [period, setPeriod] = useState('30days');
  const [refreshing, setRefreshing] = useState(false);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [activeTrips, setActiveTrips] = useState([]);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const fetchActiveTrips = async () => {
    try {
      const response = await tripService.getAllTrips({
        status: 'IN_PROGRESS,ACTIVE,PLANNED,ASSIGNED',
        size: 100,
      });
      return response.content || [];
    } catch (error) {
      console.error('Error fetching active trips:', error);
      return [];
    }
  };

  const fetchDashboardData = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const endDate = new Date();
      let startDate = new Date();

      switch (period) {
        case '7days': startDate.setDate(endDate.getDate() - 7); break;
        case '90days': startDate.setDate(endDate.getDate() - 90); break;
        case '365days': startDate.setDate(endDate.getDate() - 365); break;
        default: startDate.setDate(endDate.getDate() - 30);
      }

      const formatDate = (date) => date.toISOString().split('T')[0];

      const [response, lowStock, activeTripsData] = await Promise.all([
        analyticsService.getDashboardKPIs(formatDate(startDate), formatDate(endDate)),
        inventoryNotificationService.getLowStockItems().catch(() => []),
        fetchActiveTrips(),
      ]);

      if (response && response.success !== false) {
        setDashboardData(response);
      } else {
        throw new Error(response?.message || 'Invalid response structure');
      }

      setLowStockItems(Array.isArray(lowStock) ? lowStock : (lowStock?.content || []));
      setActiveTrips(activeTripsData);

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [period]);

  // ============================================================
  // CALCULATIONS
  // ============================================================
  const availability = useMemo(() => {
    const driversInTrips = new Set();
    const vehiclesInTrips = new Set();

    activeTrips.forEach(trip => {
      if (trip.driverId) driversInTrips.add(trip.driverId);
      if (trip.vehicleId) vehiclesInTrips.add(trip.vehicleId);
    });

    const totalDrivers = dashboardData?.summary?.totalDrivers || 0;
    const totalVehicles = dashboardData?.summary?.totalVehicles || 0;

    return {
      activeDrivers: driversInTrips.size,
      activeVehicles: vehiclesInTrips.size,
      availableDrivers: Math.max(0, totalDrivers - driversInTrips.size),
      availableVehicles: Math.max(0, totalVehicles - vehiclesInTrips.size),
    };
  }, [activeTrips, dashboardData]);

  const efficiency = dashboardData?.summary?.avgFuelEfficiency || 0;
  const fuelCost = dashboardData?.summary?.totalFuelCost || 0;
  const totalKm = dashboardData?.summary?.totalKm || 0;

  // ============================================================
  // RENDER
  // ============================================================

  if (loading && !dashboardData) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
        <CircularProgress size={40} />
        <Typography sx={{ ml: 2, fontSize: '0.9rem' }}>Loading dashboard...</Typography>
      </Box>
    );
  }

  const summary = dashboardData?.summary || {};

  return (
    <Box sx={{ bgcolor: '#F7F7FC', minHeight: '100vh', p: { xs: 2, md: 3 } }}>
      <Box sx={{ maxWidth: '1440px', margin: '0 auto' }}>
        {/* Header */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          mb={3}
          spacing={{ xs: 1, sm: 0 }}
        >
          <Box>
            <Typography variant="h5" fontWeight="700" sx={{ fontSize: '1.25rem' }}>
              Fleet Dashboard
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
              Real-time fleet insights and analytics
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<Refresh sx={{ fontSize: '0.9rem' }} />}
              onClick={() => fetchDashboardData(true)}
              disabled={refreshing}
              size="small"
              sx={{
                borderRadius: '10px',
                fontSize: '0.75rem',
                textTransform: 'none',
                py: 0.75,
                px: 2,
              }}
            >
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Select
              size="small"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              sx={{
                minWidth: 100,
                borderRadius: '10px',
                fontSize: '0.75rem',
              }}
            >
              <MenuItem value="7days" sx={{ fontSize: '0.75rem' }}>7 Days</MenuItem>
              <MenuItem value="30days" sx={{ fontSize: '0.75rem' }}>30 Days</MenuItem>
              <MenuItem value="90days" sx={{ fontSize: '0.75rem' }}>90 Days</MenuItem>
              <MenuItem value="365days" sx={{ fontSize: '0.75rem' }}>Year</MenuItem>
            </Select>
          </Stack>
        </Stack>

        {/* Error Alert */}
        {error && (
          <Alert
            severity="error"
            sx={{ mb: 2, borderRadius: '12px', fontSize: '0.8rem' }}
            action={
              <Button color="inherit" size="small" onClick={() => fetchDashboardData(true)}>
                Retry
              </Button>
            }
          >
            {error}
          </Alert>
        )}

        {/* Low Stock Alerts */}
        <LowStockAlert items={lowStockItems} />

        {/* Availability Info */}
        {(availability.availableDrivers > 0 || availability.availableVehicles > 0) && (
          <Paper
            sx={{
              p: 1.5,
              mb: 2,
              borderRadius: '12px',
              bgcolor: '#EEF2FF',
              border: '1px solid #C7D2FE',
            }}
          >
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 0.5, sm: 2 }}>
              {availability.availableDrivers > 0 && (
                <Chip
                  icon={<Person sx={{ fontSize: '0.8rem' }} />}
                  label={`${availability.availableDrivers} available drivers`}
                  color="success"
                  size="small"
                  sx={{ fontSize: '0.65rem' }}
                />
              )}
              {availability.availableVehicles > 0 && (
                <Chip
                  icon={<CarRental sx={{ fontSize: '0.8rem' }} />}
                  label={`${availability.availableVehicles} available vehicles`}
                  color="success"
                  size="small"
                  sx={{ fontSize: '0.65rem' }}
                />
              )}
            </Stack>
          </Paper>
        )}

        {/* Key Metrics with Gauges */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Active Vehicles"
              value={availability.activeVehicles}
              icon={DirectionsCar}
              color="primary"
              subtitle={`${availability.availableVehicles} available`}
              loading={refreshing}
              gauge={{ value: summary.fuelEfficiency || 0, max: 20, unit: 'km/L' }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Active Drivers"
              value={availability.activeDrivers}
              icon={People}
              color="success"
              subtitle={`${availability.availableDrivers} available`}
              loading={refreshing}
              gauge={{ value: availability.activeDrivers / Math.max(summary.totalDrivers || 1, 1) * 100, max: 100, unit: '% Utilized' }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Fuel Efficiency"
              value={efficiency}
              icon={LocalGasStation}
              unit="km/L"
              color="warning"
              subtitle="Fleet average"
              loading={refreshing}
              gauge={{ value: efficiency, max: 10, unit: 'km/L' }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Distance"
              value={totalKm}
              icon={Map}
              unit="km"
              color="purple"
              subtitle="Lifetime distance"
              loading={refreshing}
              gauge={{ value: Math.min(totalKm / 10000 * 100, 100), max: 100, unit: '% of 10,000km' }}
            />
          </Grid>
        </Grid>

        {/* Detailed Analytics */}
        <Grid container spacing={3}>
          <Grid item xs={12} lg={8}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: '16px',
                border: '1px solid #ECECEC',
                bgcolor: '#FFFFFF',
                height: '100%',
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem', mb: 2 }}>
                Top Performing Drivers
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#F9FAFB' }}>
                    <TableRow>
                      <TableCell sx={{ fontSize: '0.7rem', fontWeight: 600, color: '#6B7280' }}>Driver</TableCell>
                      <TableCell sx={{ fontSize: '0.7rem', fontWeight: 600, color: '#6B7280' }} align="center">Efficiency</TableCell>
                      <TableCell sx={{ fontSize: '0.7rem', fontWeight: 600, color: '#6B7280' }} align="center">Trips</TableCell>
                      <TableCell sx={{ fontSize: '0.7rem', fontWeight: 600, color: '#6B7280' }} align="center">Cost/km</TableCell>
                      <TableCell sx={{ fontSize: '0.7rem', fontWeight: 600, color: '#6B7280' }} align="center">Rating</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(dashboardData?.topDrivers || []).slice(0, 5).map((driver, index) => (
                      <TableRow key={index} hover>
                        <TableCell>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Avatar sx={{ width: 28, height: 28, bgcolor: '#4F46E5', fontSize: '0.7rem' }}>
                              {driver.name?.charAt(0) || 'D'}
                            </Avatar>
                            <Typography sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
                              {driver.name || `Driver ${index + 1}`}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={`${(driver.efficiency || 0).toFixed(1)} km/L`}
                            size="small"
                            sx={{
                              fontSize: '0.6rem',
                              height: 20,
                              bgcolor: driver.efficiency > 8 ? '#D1FAE5' : '#FEF3C7',
                              color: driver.efficiency > 8 ? '#065F46' : '#92400E',
                            }}
                          />
                        </TableCell>
                        <TableCell align="center" sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
                          {driver.tripsCompleted || 0}
                        </TableCell>
                        <TableCell align="center" sx={{ fontSize: '0.7rem' }}>
                          {formatCurrency(driver.costPerKm || 0)}/km
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                            {[1, 2, 3, 4, 5].map((star) => {
                              const rating = driver.rating || 0;
                              return star <= Math.round(rating) ? (
                                <Star key={star} sx={{ fontSize: '0.8rem', color: '#F59E0B' }} />
                              ) : (
                                <StarBorder key={star} sx={{ fontSize: '0.8rem', color: '#D1D5DB' }} />
                              );
                            })}
                            <Typography sx={{ fontSize: '0.6rem', color: '#6B7280', ml: 0.5 }}>
                              {(driver.rating || 0).toFixed(1)}
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>

          <Grid item xs={12} lg={4}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: '16px',
                border: '1px solid #ECECEC',
                bgcolor: '#FFFFFF',
                height: '100%',
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem', mb: 2 }}>
                Recent Activity
              </Typography>
              <Stack spacing={1.5}>
                {(dashboardData?.recentActivities || [
                  { type: 'info', message: 'System is operational', time: 'Just now' },
                ]).slice(0, 5).map((activity, index) => (
                  <Paper
                    key={index}
                    sx={{
                      p: 1.5,
                      borderRadius: '8px',
                      border: '1px solid #ECECEC',
                      bgcolor: '#F9FAFB',
                      '&:hover': { bgcolor: '#F3F4F6' },
                    }}
                  >
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Box
                        sx={{
                          bgcolor: activity.status === 'success' ? '#D1FAE5' :
                                   activity.status === 'warning' ? '#FEF3C7' :
                                   activity.status === 'error' ? '#FEE2E2' : '#DBEAFE',
                          borderRadius: '8px',
                          p: 0.5,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {activity.type === 'fuel' && <LocalGasStation sx={{ fontSize: '0.9rem', color: '#4F46E5' }} />}
                        {activity.type === 'trip' && <Route sx={{ fontSize: '0.9rem', color: '#4F46E5' }} />}
                        {activity.type === 'driver' && <People sx={{ fontSize: '0.9rem', color: '#4F46E5' }} />}
                        {activity.type === 'completion' && <CheckCircle sx={{ fontSize: '0.9rem', color: '#22C55E' }} />}
                        {activity.type === 'warning' && <WarningIcon sx={{ fontSize: '0.9rem', color: '#F59E0B' }} />}
                        {!activity.type && <Notifications sx={{ fontSize: '0.9rem', color: '#4F46E5' }} />}
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
                          {activity.message}
                        </Typography>
                        {activity.vehicle && (
                          <Typography variant="caption" sx={{ fontSize: '0.6rem', color: '#6B7280' }}>
                            Vehicle: {activity.vehicle}
                          </Typography>
                        )}
                      </Box>
                      <Typography variant="caption" sx={{ fontSize: '0.6rem', color: '#6B7280' }}>
                        {activity.time || 'Recently'}
                      </Typography>
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            </Paper>
          </Grid>
        </Grid>

        {/* Footer */}
        <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #ECECEC' }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent="space-between"
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            spacing={{ xs: 1, sm: 0 }}
          >
            <Typography variant="caption" sx={{ fontSize: '0.65rem', color: '#6B7280' }}>
              Updated: {new Date(dashboardData?.timestamp || Date.now()).toLocaleString('en-ZA')}
            </Typography>
            <Stack direction="row" spacing={1}>
              <Chip
                label="All amounts in ZAR"
                size="small"
                variant="outlined"
                sx={{ fontSize: '0.5rem', height: 18 }}
              />
              <Chip
                label={`${period === '7days' ? 'Weekly' : period === '30days' ? 'Monthly' : period === '90days' ? 'Quarterly' : 'Yearly'} Report`}
                size="small"
                variant="outlined"
                sx={{ fontSize: '0.5rem', height: 18 }}
              />
            </Stack>
          </Stack>
        </Box>
      </Box>
    </Box>
  );
};

export default Dashboard;
