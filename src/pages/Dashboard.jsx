// src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
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
} from '@mui/icons-material';
import { analyticsService } from '../services/analyticsService';
import { inventoryNotificationService } from '../services/inventoryNotificationService';

// Currency formatter for South African Rand (ZAR)
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

// Format number with South African conventions
const formatNumber = (num, decimals = 0) => {
  if (num === null || num === undefined || isNaN(num)) return '0';
  const number = typeof num === 'string' ? parseFloat(num) : num;
  return new Intl.NumberFormat('en-ZA', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(number);
};

// Helper function for colors
const getColor = (color) => {
  const colors = {
    primary: '#5D87FF',
    success: '#13DEB9',
    warning: '#FFAE1F',
    error: '#FA896B',
    info: '#49BEFF',
    secondary: '#6B7280'
  };
  return colors[color] || colors.primary;
};

const getColorBg = (color) => {
  const colors = {
    primary: '#ECF2FF',
    success: '#E6FFFA',
    warning: '#FEF5E5',
    error: '#FDEDE8',
    info: '#E8F7FF',
    secondary: '#F3F4F6'
  };
  return colors[color] || colors.primary;
};

// Compact Stat Card Component
const StatCard = React.memo(({
  title,
  value,
  icon: Icon,
  unit = '',
  color = 'primary',
  trend,
  subtitle,
  loading = false
}) => (
  <Card sx={{
    backgroundColor: getColorBg(color),
    textAlign: 'center',
    transition: 'all 0.3s ease',
    height: '100%',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: 4
    }
  }}>
    <CardContent sx={{ p: { xs: 1.5, sm: 2 }, '&:last-child': { pb: 1.5 } }}>
      {loading && (
        <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
          <CircularProgress size={16} />
        </Box>
      )}

      <Icon sx={{
        fontSize: { xs: 28, sm: 32 },
        color: getColor(color),
        mb: 1,
        opacity: loading ? 0.5 : 1
      }} />

      <Typography color="textSecondary" gutterBottom variant="caption" sx={{
        fontWeight: 600,
        fontSize: { xs: '0.6rem', sm: '0.65rem' },
        display: 'block',
        opacity: loading ? 0.7 : 1
      }}>
        {title}
      </Typography>

      <Typography variant="h5" component="div" sx={{
        fontWeight: 700,
        color: getColor(color),
        fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem' },
        opacity: loading ? 0.7 : 1,
        wordBreak: 'break-word'
      }}>
        {typeof value === 'number' ?
          (unit === 'currency' ? formatCurrency(value) :
           unit === 'km' ? `${formatNumber(value)} km` :
           unit === 'liters' ? `${formatNumber(value)} L` :
           unit === 'km/L' ? `${value.toFixed(1)} km/L` :
           unit === 'rand/km' ? `${formatCurrency(value)}/km` :
           formatNumber(value, 1))
          : value || 'N/A'}
      </Typography>

      {subtitle && (
        <Typography variant="caption" color="textSecondary" sx={{
          display: 'block',
          mt: 0.25,
          opacity: loading ? 0.7 : 1,
          fontSize: { xs: '0.55rem', sm: '0.6rem' }
        }}>
          {subtitle}
        </Typography>
      )}

      {trend !== undefined && trend !== null && !isNaN(trend) && (
        <Chip
          label={trend > 0 ? `+${trend.toFixed(1)}%` : `${trend.toFixed(1)}%`}
          size="small"
          sx={{
            backgroundColor: trend > 0 ? '#E6FFFA' : trend < 0 ? '#FDEDE8' : '#E8F7FF',
            color: trend > 0 ? '#13DEB9' : trend < 0 ? '#FA896B' : '#49BEFF',
            fontWeight: 600,
            fontSize: { xs: '0.55rem', sm: '0.6rem' },
            height: { xs: 18, sm: 20 },
            mt: 0.5
          }}
          icon={trend > 0 ? <TrendingUp sx={{ fontSize: '0.7rem' }} /> :
                 trend < 0 ? <TrendingDown sx={{ fontSize: '0.7rem' }} /> :
                 <Timeline sx={{ fontSize: '0.7rem' }} />}
        />
      )}
    </CardContent>
  </Card>
));

// Low Stock Alert Component
const LowStockAlert = ({ items }) => {
  if (!items || items.length === 0) return null;

  const urgentItems = items.filter(item => item.quantity <= 0);
  const warningItems = items.filter(item => item.quantity > 0 && item.quantity <= item.minLevel);

  return (
    <Paper sx={{ p: 1.5, mb: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}>
      <Stack direction="row" alignItems="center" spacing={1} mb={1.5}>
        <Badge badgeContent={items.length} color="error">
          <AddAlertIcon color="error" />
        </Badge>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
          Low Stock Alerts
        </Typography>
        {urgentItems.length > 0 && (
          <Chip
            label={`${urgentItems.length} Out of Stock`}
            color="error"
            size="small"
            sx={{ height: 20, fontSize: '0.6rem' }}
          />
        )}
        {warningItems.length > 0 && (
          <Chip
            label={`${warningItems.length} Low Stock`}
            color="warning"
            size="small"
            sx={{ height: 20, fontSize: '0.6rem' }}
          />
        )}
      </Stack>

      <Grid container spacing={1}>
        {items.slice(0, 4).map((item, index) => (
          <Grid item xs={12} sm={6} key={index}>
            <Paper
              sx={{
                p: 1,
                backgroundColor: item.quantity <= 0 ? '#ffebee' : '#fff3e0',
                borderLeft: `3px solid ${item.quantity <= 0 ? '#f44336' : '#ff9800'}`,
                borderRadius: 0.5,
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
                  sx={{ height: 18, fontSize: '0.55rem' }}
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

      {items.length > 4 && (
        <Button
          size="small"
          sx={{ mt: 1.5, fontSize: '0.7rem' }}
          onClick={() => window.location.href = '/inventory?filter=low-stock'}
        >
          View all {items.length} low stock items
        </Button>
      )}
    </Paper>
  );
};

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [period, setPeriod] = useState('30days');
  const [refreshing, setRefreshing] = useState(false);
  const [lowStockItems, setLowStockItems] = useState([]);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));


const fetchDashboardData = async (isRefresh = false) => {
  try {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    setError(null);

    const endDate = new Date();
    let startDate = new Date();

    switch (period) {
      case '7days':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '90days':
        startDate.setDate(endDate.getDate() - 90);
        break;
      case '365days':
        startDate.setDate(endDate.getDate() - 365);
        break;
      case '30days':
      default:
        startDate.setDate(endDate.getDate() - 30);
    }

    const formatDate = (date) => date.toISOString().split('T')[0];
    
    // Fetch dashboard data and low stock items separately with error handling
    const [response, lowStock] = await Promise.all([
      analyticsService.getDashboardKPIs(formatDate(startDate), formatDate(endDate)),
      // Use a try-catch for low stock items
      (async () => {
        try {
          return await inventoryNotificationService.getLowStockItems();
        } catch (error) {
          console.warn('Low stock endpoint not available:', error);
          return [];
        }
      })()
    ]);

    if (response && response.success !== false) {
      setDashboardData(response);
    } else {
      throw new Error(response?.message || 'Invalid response structure');
    }

    // Set low stock items - ensure it's an array
    setLowStockItems(Array.isArray(lowStock) ? lowStock : (lowStock?.content || []));

  } catch (err) {
    console.error('Error fetching dashboard data:', err);
    setError(err.message || 'Failed to load dashboard data');
    
    if (!dashboardData) {
      setDashboardData({
        summary: { activeVehicles: 0, activeDrivers: 0, avgFuelEfficiency: 0 },
        period: { startDate: new Date(), endDate: new Date() },
        topDrivers: [],
        topVehicles: [],
        recentActivities: []
      });
    }
  } finally {
    setLoading(false);
    setRefreshing(false);
  }
};

  useEffect(() => {
    fetchDashboardData();
  }, [period]);

  // Top Drivers Table - Compact
  const TopDriversTable = () => {
    const topDrivers = dashboardData?.topDrivers || dashboardData?.summary?.topDrivers || [];
    
    if (!topDrivers.length) {
      return (
        <Paper sx={{
          borderRadius: 1.5,
          height: '100%',
          boxShadow: '0px 0px 2px 0px rgba(145, 158, 171, 0.30), 0px 8px 16px -4px rgba(145, 158, 171, 0.12)'
        }}>
          <CardContent sx={{ p: { xs: 1.5, sm: 2 }, textAlign: 'center' }}>
            <Typography variant="subtitle1" sx={{ fontSize: '0.9rem', fontWeight: 600 }}>
              Top Drivers
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ py: 3, fontSize: '0.8rem' }}>
              No driver data available
            </Typography>
          </CardContent>
        </Paper>
      );
    }

    return (
      <Paper sx={{
        borderRadius: 1.5,
        height: '100%',
        boxShadow: '0px 0px 2px 0px rgba(145, 158, 171, 0.30), 0px 8px 16px -4px rgba(145, 158, 171, 0.12)'
      }}>
        <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
          <Stack 
            direction={{ xs: 'column', sm: 'row' }} 
            justifyContent="space-between" 
            alignItems={{ xs: 'flex-start', sm: 'center' }} 
            mb={2}
            spacing={{ xs: 1, sm: 0 }}
          >
            <Box>
              <Typography variant="subtitle1" sx={{ fontSize: '0.9rem', fontWeight: 600 }}>
                Top Drivers
              </Typography>
              <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.65rem' }}>
                Best performing drivers
              </Typography>
            </Box>
            <Select
              size="small"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              sx={{ 
                minWidth: { xs: '100%', sm: 110 },
                fontSize: '0.75rem',
                '& .MuiSelect-select': { py: 0.5 }
              }}
            >
              <MenuItem value="7days" sx={{ fontSize: '0.75rem' }}>7 Days</MenuItem>
              <MenuItem value="30days" sx={{ fontSize: '0.75rem' }}>30 Days</MenuItem>
              <MenuItem value="90days" sx={{ fontSize: '0.75rem' }}>90 Days</MenuItem>
              <MenuItem value="365days" sx={{ fontSize: '0.75rem' }}>Year</MenuItem>
            </Select>
          </Stack>

          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600, py: 0.5 }}>Driver</TableCell>
                  <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600, py: 0.5 }} align="center">Efficiency</TableCell>
                  <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600, py: 0.5 }} align="center">Trips</TableCell>
                  <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600, py: 0.5 }} align="center">Cost/km</TableCell>
                  {!isMobile && (
                    <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600, py: 0.5 }} align="center">Rating</TableCell>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {topDrivers.slice(0, 5).map((driver, index) => {
                  const efficiency = driver.efficiency || driver.kmPerLiter || 0;
                  const tripCount = driver.tripCount || driver.tripsCompleted || 0;
                  const costPerKm = driver.costPerKm || 0;
                  const rating = driver.rating || 0;
                  
                  return (
                  <TableRow
                    key={index}
                    hover
                    sx={{
                      '&:hover': { backgroundColor: 'action.hover' },
                      backgroundColor: index === 0 ? '#f8f9fa' : 'transparent'
                    }}
                  >
                    <TableCell sx={{ py: 0.5 }}>
                      <Stack direction="row" alignItems="center" spacing={{ xs: 0.5, sm: 1 }}>
                        <Avatar
                          sx={{
                            width: { xs: 24, sm: 28 },
                            height: { xs: 24, sm: 28 },
                            fontSize: '0.6rem',
                            bgcolor: index === 0 ? '#FFAE1F' :
                                     index === 1 ? '#5D87FF' :
                                     index === 2 ? '#13DEB9' : '#6B7280'
                          }}
                        >
                          {driver.name?.charAt(0) || 'D'}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.7rem' }}>
                            {driver.name || driver.driverName || `Driver ${index + 1}`}
                          </Typography>
                          <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.55rem' }}>
                            {index === 0 ? '🥇 Best' :
                             index === 1 ? '🥈 2nd' :
                             index === 2 ? '🥉 3rd' : ''}
                          </Typography>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell align="center" sx={{ py: 0.5 }}>
                      <Chip
                        label={`${efficiency.toFixed(1)} km/L`}
                        size="small"
                        sx={{
                          backgroundColor: efficiency > 8 ? '#E6FFFA' :
                                         efficiency > 7 ? '#FEF5E5' : '#FDEDE8',
                          color: efficiency > 8 ? '#13DEB9' :
                                efficiency > 7 ? '#FFAE1F' : '#FA896B',
                          fontWeight: 600,
                          fontSize: '0.55rem',
                          height: 18
                        }}
                      />
                    </TableCell>
                    <TableCell align="center" sx={{ py: 0.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.7rem' }}>
                        {tripCount}
                      </Typography>
                    </TableCell>
                    <TableCell align="center" sx={{ py: 0.5 }}>
                      <Typography variant="body2" sx={{
                        fontWeight: 600,
                        color: costPerKm < 2 ? '#13DEB9' :
                               costPerKm < 3 ? '#FFAE1F' : '#FA896B',
                        fontSize: '0.65rem'
                      }}>
                        {formatCurrency(costPerKm)}/km
                      </Typography>
                    </TableCell>
                    {!isMobile && (
                      <TableCell align="center" sx={{ py: 0.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.25 }}>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Box
                              key={star}
                              sx={{
                                width: 6,
                                height: 6,
                                borderRadius: '50%',
                                bgcolor: star <= rating ? '#FFAE1F' : '#E5E7EB'
                              }}
                            />
                          ))}
                        </Box>
                      </TableCell>
                    )}
                  </TableRow>
                )})}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Paper>
    );
  };

  // Recent Activity - Compact
  const RecentActivity = () => {
    const activities = dashboardData?.recentActivities || 
                     dashboardData?.summary?.recentActivities || [];

    const getActivityIcon = (type) => {
      switch (type) {
        case 'fuel': return <LocalGasStation sx={{ fontSize: '0.8rem' }} />;
        case 'maintenance': return <Speed sx={{ fontSize: '0.8rem' }} />;
        case 'trip': return <Map sx={{ fontSize: '0.8rem' }} />;
        case 'driver': return <People sx={{ fontSize: '0.8rem' }} />;
        case 'inspection': return <Assessment sx={{ fontSize: '0.8rem' }} />;
        default: return <Notifications sx={{ fontSize: '0.8rem' }} />;
      }
    };

    const getStatusColor = (status) => {
      switch (status) {
        case 'success': return '#13DEB9';
        case 'warning': return '#FFAE1F';
        case 'error': return '#FA896B';
        case 'info': return '#49BEFF';
        default: return '#6B7280';
      }
    };

    return (
      <Paper sx={{
        borderRadius: 1.5,
        height: '100%',
        boxShadow: '0px 0px 2px 0px rgba(145, 158, 171, 0.30), 0px 8px 16px -4px rgba(145, 158, 171, 0.12)'
      }}>
        <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
          <Typography variant="subtitle1" sx={{ fontSize: '0.9rem', fontWeight: 600, mb: 1.5 }}>
            Recent Activity
          </Typography>
          
          {activities.length > 0 ? (
            <Stack spacing={1}>
              {activities.slice(0, 5).map((activity, index) => (
                <Paper
                  key={index}
                  sx={{
                    p: { xs: 1, sm: 1.5 },
                    backgroundColor: '#f8fafc',
                    borderLeft: `3px solid ${getStatusColor(activity.status)}`,
                    borderRadius: 0.5
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="flex-start">
                    <Box sx={{
                      color: getStatusColor(activity.status),
                      mt: 0.25
                    }}>
                      {getActivityIcon(activity.type)}
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.7rem' }}>
                        {activity.message}
                      </Typography>
                      <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.6rem' }}>
                        {activity.vehicle ? `Vehicle: ${activity.vehicle}` : 'System update'}
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.55rem' }}>
                      {activity.time || 'Recently'}
                    </Typography>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          ) : (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <Timeline sx={{ fontSize: 32, color: 'text.disabled', mb: 1 }} />
              <Typography variant="body2" color="textSecondary" sx={{ fontSize: '0.75rem' }}>
                No recent activity
              </Typography>
            </Box>
          )}
        </CardContent>
      </Paper>
    );
  };

  if (loading && !dashboardData) {
    return (
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '70vh',
        gap: 2,
        p: 2
      }}>
        <CircularProgress size={40} />
        <Typography variant="body1" color="textSecondary" sx={{ fontSize: '0.9rem' }}>
          Loading dashboard...
        </Typography>
      </Box>
    );
  }

  const summary = dashboardData?.summary || {};
  const vehicleKpis = dashboardData?.topVehicles || dashboardData?.vehicleKpis || [];
  const periodStats = dashboardData?.period || {};

  return (
    <Box sx={{ p: { xs: 1, sm: 1.5, md: 2 } }}>
      {/* Header - Compact */}
      <Stack 
        direction={{ xs: 'column', sm: 'row' }} 
        justifyContent="space-between" 
        alignItems={{ xs: 'flex-start', sm: 'center' }} 
        mb={2}
        spacing={{ xs: 1, sm: 0 }}
      >
        <Box>
          <Typography variant="h6" sx={{ 
            fontWeight: 700, 
            fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem' } 
          }}>
            Fleet Analytics
          </Typography>
          <Typography variant="caption" color="textSecondary" sx={{ fontSize: { xs: '0.65rem', sm: '0.7rem' } }}>
            Real-time fleet insights
          </Typography>
        </Box>
        <Tooltip title="Refresh data">
          <Button
            variant="outlined"
            startIcon={<Refresh sx={{ fontSize: '0.9rem' }} />}
            onClick={() => fetchDashboardData(true)}
            disabled={refreshing}
            size="small"
            sx={{ 
              borderRadius: 1.5,
              fontSize: '0.75rem',
              py: 0.5,
              width: { xs: '100%', sm: 'auto' }
            }}
          >
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </Tooltip>
      </Stack>

      {error && (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => fetchDashboardData(true)} sx={{ fontSize: '0.7rem' }}>
              Retry
            </Button>
          }
          sx={{ mb: 2, fontSize: '0.8rem' }}
        >
          {error}
        </Alert>
      )}

      {/* Low Stock Alerts */}
      {lowStockItems.length > 0 && (
        <LowStockAlert items={lowStockItems} />
      )}

      {/* Time Period Selector - Compact */}
      <Box sx={{
        backgroundColor: '#f8fafc',
        p: { xs: 1, sm: 1.5 },
        borderRadius: 1.5,
        mb: 2,
        border: '1px solid #e5e7eb'
      }}>
        <Stack 
          direction={{ xs: 'column', sm: 'row' }} 
          justifyContent="space-between" 
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          spacing={{ xs: 1, sm: 0 }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>
            Analysis Period
          </Typography>
          <Stack 
            direction={{ xs: 'row', sm: 'row' }} 
            spacing={0.5}
            sx={{ width: { xs: '100%', sm: 'auto' } }}
            flexWrap="wrap"
          >
            {['7days', '30days', '90days', '365days'].map((p) => (
              <Button
                key={p}
                variant={period === p ? 'contained' : 'outlined'}
                size="small"
                onClick={() => setPeriod(p)}
                sx={{
                  borderRadius: 1,
                  textTransform: 'capitalize',
                  fontWeight: period === p ? 600 : 400,
                  fontSize: '0.65rem',
                  py: 0.25,
                  px: 1,
                  flex: { xs: '1 1 45%', sm: '0 0 auto' }
                }}
              >
                {p === '7days' ? '7D' :
                 p === '30days' ? '30D' :
                 p === '90days' ? '90D' : 'Year'}
              </Button>
            ))}
          </Stack>
        </Stack>
        {periodStats.startDate && periodStats.endDate && (
          <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5, display: 'block', fontSize: '0.6rem' }}>
            {new Date(periodStats.startDate).toLocaleDateString('en-ZA')} - {new Date(periodStats.endDate).toLocaleDateString('en-ZA')}
          </Typography>
        )}
      </Box>

      {/* Key Metrics Grid - Compact */}
      <Grid container spacing={1.5} mb={2}>
        <Grid item xs={6} sm={6} md={3}>
          <StatCard
            title="Active Vehicles"
            value={summary.activeVehicles || summary.totalVehicles || 0}
            icon={DirectionsCar}
            color="primary"
            trend={periodStats.vehicleTrend}
            subtitle="Total operational"
            loading={refreshing}
          />
        </Grid>

        <Grid item xs={6} sm={6} md={3}>
          <StatCard
            title="Active Drivers"
            value={summary.activeDrivers || summary.totalDrivers || 0}
            icon={People}
            color="success"
            trend={periodStats.driverTrend}
            subtitle="Currently assigned"
            loading={refreshing}
          />
        </Grid>

        <Grid item xs={6} sm={6} md={3}>
          <StatCard
            title="Fuel Efficiency"
            value={summary.avgFuelEfficiency || summary.fuelEfficiency || 0}
            icon={LocalGasStation}
            unit="km/L"
            color="warning"
            trend={periodStats.efficiencyTrend}
            subtitle="Fleet average"
            loading={refreshing}
          />
        </Grid>

        <Grid item xs={6} sm={6} md={3}>
          <StatCard
            title="Fuel Cost"
            value={summary.totalFuelCost || summary.fuelCost || 0}
            icon={AttachMoney}
            unit="currency"
            color="error"
            trend={periodStats.costTrend}
            subtitle="Total expenditure"
            loading={refreshing}
          />
        </Grid>
      </Grid>

      {/* Detailed Analytics Grid - Compact */}
      <Grid container spacing={1.5} mb={2}>
        <Grid item xs={12} lg={8}>
          <TopDriversTable />
        </Grid>
        <Grid item xs={12} lg={4}>
          <RecentActivity />
        </Grid>
      </Grid>

      {/* Additional Metrics - Compact */}
      <Grid container spacing={1.5}>
        <Grid item xs={12} md={6}>
          <Paper sx={{
            p: { xs: 1.5, sm: 2 },
            borderRadius: 1.5,
            height: '100%',
            boxShadow: '0px 0px 2px 0px rgba(145, 158, 171, 0.30), 0px 8px 16px -4px rgba(145, 158, 171, 0.12)'
          }}>
            <Typography variant="subtitle1" sx={{ 
              fontWeight: 600,
              fontSize: '0.9rem',
              mb: 1.5
            }}>
              Fleet Overview
            </Typography>
            <Grid container spacing={1}>
              <Grid item xs={6}>
                <Box sx={{ textAlign: 'center', p: { xs: 0.5, sm: 1 } }}>
                  <Map sx={{ fontSize: { xs: 24, sm: 28 }, color: '#5D87FF', mb: 0.5 }} />
                  <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.6rem', display: 'block' }}>
                    Total Distance
                  </Typography>
                  <Typography variant="subtitle1" sx={{ 
                    fontWeight: 700, 
                    color: '#5D87FF',
                    fontSize: { xs: '0.8rem', sm: '0.9rem' }
                  }}>
                    {summary.totalKm ? `${formatNumber(summary.totalKm)} km` : '0 km'}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ textAlign: 'center', p: { xs: 0.5, sm: 1 } }}>
                  <LocalGasStation sx={{ fontSize: { xs: 24, sm: 28 }, color: '#13DEB9', mb: 0.5 }} />
                  <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.6rem', display: 'block' }}>
                    Fuel Consumed
                  </Typography>
                  <Typography variant="subtitle1" sx={{ 
                    fontWeight: 700, 
                    color: '#13DEB9',
                    fontSize: { xs: '0.8rem', sm: '0.9rem' }
                  }}>
                    {summary.totalFuelLiters ? `${formatNumber(summary.totalFuelLiters)} L` : '0 L'}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ textAlign: 'center', p: { xs: 0.5, sm: 1 } }}>
                  <AttachMoney sx={{ fontSize: { xs: 24, sm: 28 }, color: '#FFAE1F', mb: 0.5 }} />
                  <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.6rem', display: 'block' }}>
                    Cost per km
                  </Typography>
                  <Typography variant="subtitle1" sx={{ 
                    fontWeight: 700, 
                    color: '#FFAE1F',
                    fontSize: { xs: '0.8rem', sm: '0.9rem' }
                  }}>
                    {summary.costPerKm ? `${formatCurrency(summary.costPerKm)}/km` : formatCurrency(0) + '/km'}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ textAlign: 'center', p: { xs: 0.5, sm: 1 } }}>
                  <Timeline sx={{ fontSize: { xs: 24, sm: 28 }, color: '#49BEFF', mb: 0.5 }} />
                  <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.6rem', display: 'block' }}>
                    Avg. Trip Distance
                  </Typography>
                  <Typography variant="subtitle1" sx={{ 
                    fontWeight: 700, 
                    color: '#49BEFF',
                    fontSize: { xs: '0.8rem', sm: '0.9rem' }
                  }}>
                    {summary.avgTripDistance ? `${formatNumber(summary.avgTripDistance, 1)} km` : '0.0 km'}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{
            p: { xs: 1.5, sm: 2 },
            borderRadius: 1.5,
            height: '100%',
            boxShadow: '0px 0px 2px 0px rgba(145, 158, 171, 0.30), 0px 8px 16px -4px rgba(145, 158, 171, 0.12)'
          }}>
            <Stack 
              direction="row" 
              justifyContent="space-between" 
              alignItems="center" 
              mb={1.5}
            >
              <Typography variant="subtitle1" sx={{ 
                fontWeight: 600,
                fontSize: '0.9rem'
              }}>
                Top Vehicles
              </Typography>
              <Chip
                label={`${vehicleKpis.length} veh`}
                size="small"
                variant="outlined"
                sx={{ fontSize: '0.55rem', height: 18 }}
              />
            </Stack>

            {vehicleKpis.length > 0 ? (
              <Stack spacing={1}>
                {vehicleKpis
                  .sort((a, b) => (b.kmPerLiter || b.efficiency || 0) - (a.kmPerLiter || a.efficiency || 0))
                  .slice(0, 4)
                  .map((vehicle, index) => {
                    const efficiency = vehicle.kmPerLiter || vehicle.efficiency || 0;
                    const distance = vehicle.totalKm || vehicle.distance || 0;
                    const fuel = vehicle.fuelLiters || 0;
                    const costPerKm = vehicle.costPerKm || 0;
                    
                    return (
                    <Paper
                      key={index}
                      sx={{
                        p: { xs: 1, sm: 1.5 },
                        backgroundColor: '#f8fafc',
                        border: index === 0 ? '2px solid #FFAE1F' : '1px solid #e5e7eb',
                        borderRadius: 0.5
                      }}
                    >
                      <Stack 
                        direction={{ xs: 'column', sm: 'row' }} 
                        justifyContent="space-between" 
                        alignItems={{ xs: 'flex-start', sm: 'center' }}
                        spacing={{ xs: 0.5, sm: 0 }}
                      >
                        <Box>
                          <Stack direction="row" alignItems="center" spacing={0.5}>
                            {index === 0 && (
                              <Chip
                                label="Best"
                                size="small"
                                color="warning"
                                sx={{ fontWeight: 600, fontSize: '0.5rem', height: 16 }}
                              />
                            )}
                            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.7rem' }}>
                              {vehicle.registrationNumber || vehicle.vehicleName || `Veh ${index + 1}`}
                            </Typography>
                          </Stack>
                          <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.55rem' }}>
                            {efficiency.toFixed(1)} km/L • {formatNumber(distance)} km
                          </Typography>
                        </Box>
                        <Chip
                          label={formatCurrency(costPerKm) + '/km'}
                          color={efficiency > 8 ? 'success' : 
                                 efficiency > 6 ? 'warning' : 'error'}
                          size="small"
                          sx={{ 
                            fontWeight: 600, 
                            fontSize: '0.55rem',
                            height: 18
                          }}
                        />
                      </Stack>
                    </Paper>
                  )})}
              </Stack>
            ) : (
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <DirectionsCar sx={{ fontSize: 32, color: 'text.disabled', mb: 1 }} />
                <Typography variant="body2" color="textSecondary" sx={{ fontSize: '0.75rem' }}>
                  No vehicle data available
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Footer Info - Compact */}
      <Box mt={2} pt={2} borderTop={1} borderColor="divider">
        <Stack 
          direction={{ xs: 'column', sm: 'row' }} 
          justifyContent="space-between" 
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          spacing={{ xs: 0.5, sm: 0 }}
        >
          <Typography variant="caption" color="textSecondary" sx={{ fontSize: { xs: '0.55rem', sm: '0.65rem' } }}>
            Updated: {new Date(dashboardData?.timestamp || Date.now()).toLocaleString('en-ZA')}
          </Typography>
          <Stack 
            direction={{ xs: 'row', sm: 'row' }} 
            spacing={0.5}
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          >
            <Chip
              label="All amounts in ZAR"
              size="small"
              variant="outlined"
              color="info"
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
  );
};

export default Dashboard;
