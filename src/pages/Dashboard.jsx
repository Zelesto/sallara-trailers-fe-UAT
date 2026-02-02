import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  LinearProgress,
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
  CircularProgress  // Fixed - use the actual name
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
  ShoppingCart,
  Message,
  Menu as MenuIcon,
  Speed,
  Map,
  Timeline,
  Assessment,
  Warning,
  CheckCircle
} from '@mui/icons-material';
import { analyticsService } from '../services/analyticsService';

// Currency formatter for South African Rand (ZAR)
const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return 'R 0.00';
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
  if (num === null || num === undefined) return '0';
  const number = typeof num === 'string' ? parseFloat(num) : num;
  return new Intl.NumberFormat('en-ZA', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(number);
};

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [period, setPeriod] = useState('30days');
  const [refreshing, setRefreshing] = useState(false);

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

      const response = await analyticsService.getDashboardKPIs(
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      );

      setDashboardData(response);

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

  // Stat Card Component with modern design
  const StatCard = ({
    title,
    value,
    icon: Icon,
    unit = '',
    color = 'primary',
    trend,
    subtitle,
    loading: cardLoading
  }) => (
    <Card sx={{
      backgroundColor: getColorBg(color),
      textAlign: 'center',
      transition: 'all 0.3s ease',
      height: '100%',
      '&:hover': {
        transform: 'translateY(-5px)',
        boxShadow: 6
      }
    }}>
      <CardContent sx={{ p: 3, position: 'relative' }}>
        {cardLoading && (
          <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
            <MuiCircularProgress size={20} />
          </Box>
        )}

        <Icon sx={{
          fontSize: 48,
          color: getColor(color),
          mb: 2,
          opacity: cardLoading ? 0.5 : 1
        }} />

        <Typography color="textSecondary" gutterBottom variant="subtitle2" sx={{
          fontWeight: 600,
          fontSize: '0.875rem',
          opacity: cardLoading ? 0.7 : 1
        }}>
          {title}
        </Typography>

        <Typography variant="h4" component="div" sx={{
          fontWeight: 700,
          color: getColor(color),
          mb: 1,
          fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
          opacity: cardLoading ? 0.7 : 1
        }}>
          {typeof value === 'number' ?
            (unit === 'currency' ? formatCurrency(value) :
             unit === 'km' ? `${formatNumber(value)} km` :
             unit === 'liters' ? `${formatNumber(value)} L` :
             unit === 'km/L' ? `${value.toFixed(1)} km/L` :
             unit === 'rand/km' ? `${formatCurrency(value)}/km` :
             formatNumber(value, 1))
            : value}
        </Typography>

        {subtitle && (
          <Typography variant="caption" color="textSecondary" sx={{
            display: 'block',
            mb: 1,
            opacity: cardLoading ? 0.7 : 1
          }}>
            {subtitle}
          </Typography>
        )}

        {trend !== undefined && trend !== null && (
          <Chip
            label={trend > 0 ? `+${trend.toFixed(1)}%` : `${trend.toFixed(1)}%`}
            size="small"
            sx={{
              backgroundColor: trend > 0 ? '#E6FFFA' : trend < 0 ? '#FDEDE8' : '#E8F7FF',
              color: trend > 0 ? '#13DEB9' : trend < 0 ? '#FA896B' : '#49BEFF',
              fontWeight: 600,
              fontSize: '0.75rem',
              height: 24
            }}
            icon={trend > 0 ? <TrendingUp fontSize="small" /> :
                   trend < 0 ? <TrendingDown fontSize="small" /> :
                   <Timeline fontSize="small" />}
          />
        )}
      </CardContent>
    </Card>
  );

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

  // Top Drivers Table Component
  const TopDriversTable = () => {
    if (!dashboardData?.topDrivers?.length) {
      return (
        <Paper sx={{
          borderRadius: 2,
          height: '100%',
          boxShadow: '0px 0px 2px 0px rgba(145, 158, 171, 0.30), 0px 12px 24px -4px rgba(145, 158, 171, 0.12)'
        }}>
          <CardContent sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h5" gutterBottom>
              Top Drivers
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ py: 4 }}>
              No driver data available for this period
            </Typography>
          </CardContent>
        </Paper>
      );
    }

    return (
      <Paper sx={{
        borderRadius: 2,
        height: '100%',
        boxShadow: '0px 0px 2px 0px rgba(145, 158, 171, 0.30), 0px 12px 24px -4px rgba(145, 158, 171, 0.12)'
      }}>
        <CardContent sx={{ p: 3 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
            <Box>
              <Typography variant="h5" gutterBottom>
                Top Drivers
              </Typography>
              <Typography variant="subtitle2" color="textSecondary">
                Best performing drivers by efficiency
              </Typography>
            </Box>
            <Tooltip title="Filter period">
              <Select
                size="small"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                sx={{ minWidth: 120 }}
              >
                <MenuItem value="7days">Last 7 days</MenuItem>
                <MenuItem value="30days">Last 30 days</MenuItem>
                <MenuItem value="90days">Last 90 days</MenuItem>
                <MenuItem value="365days">Last year</MenuItem>
              </Select>
            </Tooltip>
          </Stack>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Driver</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="center">Efficiency</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="center">Trips</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="center">Cost/km</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="center">Rating</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {dashboardData.topDrivers.slice(0, 5).map((driver, index) => (
                  <TableRow
                    key={index}
                    hover
                    sx={{
                      '&:hover': { backgroundColor: 'action.hover' },
                      backgroundColor: index === 0 ? '#f8f9fa' : 'transparent'
                    }}
                  >
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Avatar
                          sx={{
                            width: 40,
                            height: 40,
                            bgcolor: index === 0 ? '#FFAE1F' :
                                     index === 1 ? '#5D87FF' :
                                     index === 2 ? '#13DEB9' : '#6B7280'
                          }}
                        >
                          {driver.name?.charAt(0) || 'D'}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            {driver.name || `Driver ${index + 1}`}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            {index === 0 ? '🥇 Best Driver' :
                             index === 1 ? '🥈 2nd Best' :
                             index === 2 ? '🥉 3rd Best' : 'Driver'}
                          </Typography>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={`${driver.efficiency?.toFixed(1) || '0.0'} km/L`}
                        size="small"
                        sx={{
                          backgroundColor: driver.efficiency > 8 ? '#E6FFFA' :
                                         driver.efficiency > 7 ? '#FEF5E5' : '#FDEDE8',
                          color: driver.efficiency > 8 ? '#13DEB9' :
                                driver.efficiency > 7 ? '#FFAE1F' : '#FA896B',
                          fontWeight: 600
                        }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {driver.tripCount || 0}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" sx={{
                        fontWeight: 600,
                        color: driver.costPerKm < 2 ? '#13DEB9' :
                               driver.costPerKm < 3 ? '#FFAE1F' : '#FA896B'
                      }}>
                        {formatCurrency(driver.costPerKm || 0)}/km
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Box
                            key={star}
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              mx: 0.2,
                              bgcolor: star <= (driver.rating || 0) ? '#FFAE1F' : '#E5E7EB'
                            }}
                          />
                        ))}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Paper>
    );
  };

  // Recent Activity Component
  const RecentActivity = () => {
    const activities = dashboardData?.recentActivities || [
      { type: 'fuel', message: 'Fuel refill completed', vehicle: 'ABC-123', time: '2 hours ago', status: 'success' },
      { type: 'maintenance', message: 'Maintenance scheduled', vehicle: 'XYZ-789', time: '5 hours ago', status: 'warning' },
      { type: 'trip', message: 'New trip completed', vehicle: 'DEF-456', time: '1 day ago', status: 'info' },
      { type: 'driver', message: 'Driver assigned', vehicle: 'GHI-789', time: '2 days ago', status: 'success' },
      { type: 'inspection', message: 'Vehicle inspection passed', vehicle: 'JKL-012', time: '3 days ago', status: 'success' }
    ];

    const getActivityIcon = (type) => {
      switch (type) {
        case 'fuel': return <LocalGasStation fontSize="small" />;
        case 'maintenance': return <Speed fontSize="small" />;
        case 'trip': return <Map fontSize="small" />;
        case 'driver': return <People fontSize="small" />;
        case 'inspection': return <Assessment fontSize="small" />;
        default: return <Notifications fontSize="small" />;
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
        borderRadius: 2,
        height: '100%',
        boxShadow: '0px 0px 2px 0px rgba(145, 158, 171, 0.30), 0px 12px 24px -4px rgba(145, 158, 171, 0.12)'
      }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            Recent Activity
          </Typography>
          <Stack spacing={2}>
            {activities.map((activity, index) => (
              <Paper
                key={index}
                sx={{
                  p: 2,
                  backgroundColor: '#f8fafc',
                  borderLeft: `4px solid ${getStatusColor(activity.status)}`
                }}
              >
                <Stack direction="row" spacing={2} alignItems="flex-start">
                  <Box sx={{
                    color: getStatusColor(activity.status),
                    mt: 0.5
                  }}>
                    {getActivityIcon(activity.type)}
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      {activity.message}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Vehicle: {activity.vehicle}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="textSecondary">
                    {activity.time}
                  </Typography>
                </Stack>
              </Paper>
            ))}
          </Stack>
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
        height: '100vh',
        gap: 2
      }}>
        <CircularProgress size={60} />
        <Typography variant="h6" color="textSecondary">
          Loading dashboard data...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={fetchDashboardData}>
              Retry
            </Button>
          }
          sx={{ mt: 2 }}
        >
          {error}
        </Alert>
      </Box>
    );
  }

  const summary = dashboardData?.summary || {};
  const vehicleKpis = dashboardData?.vehicleKpis || [];
  const periodStats = dashboardData?.period || {};

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
            Fleet Analytics Dashboard
          </Typography>
          <Typography variant="subtitle2" color="textSecondary">
            Real-time insights into your fleet performance.
          </Typography>
        </Box>
        <Tooltip title="Refresh data">
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => fetchDashboardData(true)}
            disabled={refreshing}
            size="large"
            sx={{ borderRadius: 2 }}
          >
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </Tooltip>
      </Stack>

      {/* Time Period Selector */}
      <Box sx={{
        backgroundColor: '#f8fafc',
        p: 2,
        borderRadius: 2,
        mb: 4,
        border: '1px solid #e5e7eb'
      }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Analysis Period
          </Typography>
          <Stack direction="row" spacing={1}>
            {['7days', '30days', '90days', '365days'].map((p) => (
              <Button
                key={p}
                variant={period === p ? 'contained' : 'outlined'}
                size="small"
                onClick={() => setPeriod(p)}
                sx={{
                  borderRadius: 2,
                  textTransform: 'capitalize',
                  fontWeight: period === p ? 600 : 400,
                  minWidth: 100
                }}
              >
                {p === '7days' ? 'Last 7 Days' :
                 p === '30days' ? 'Last 30 Days' :
                 p === '90days' ? 'Last 90 Days' : 'Last Year'}
              </Button>
            ))}
          </Stack>
        </Stack>
        {periodStats.startDate && periodStats.endDate && (
          <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
            Period: {new Date(periodStats.startDate).toLocaleDateString('en-ZA')} - {new Date(periodStats.endDate).toLocaleDateString('en-ZA')}
          </Typography>
        )}
      </Box>

      {/* Key Metrics Grid */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Vehicles"
            value={summary.activeVehicles || 0}
            icon={DirectionsCar}
            color="primary"
            trend={periodStats.vehicleTrend}
            subtitle="Total operational fleet"
            loading={refreshing}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Drivers"
            value={summary.activeDrivers || 0}
            icon={People}
            color="success"
            trend={periodStats.driverTrend}
            subtitle="Currently assigned drivers"
            loading={refreshing}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Fuel Efficiency"
            value={summary.avgFuelEfficiency || 0}
            icon={LocalGasStation}
            unit="km/L"
            color="warning"
            trend={periodStats.efficiencyTrend}
            subtitle="Average fleet efficiency"
            loading={refreshing}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Fuel Cost"
            value={summary.totalFuelCost || 0}
            icon={AttachMoney}
            unit="currency"
            color="error"
            trend={periodStats.costTrend}
            subtitle="Total fuel expenditure"
            loading={refreshing}
          />
        </Grid>
      </Grid>

      {/* Detailed Analytics Grid */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} lg={8}>
          <TopDriversTable />
        </Grid>
        <Grid item xs={12} lg={4}>
          <RecentActivity />
        </Grid>
      </Grid>

      {/* Additional Metrics */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{
            p: 3,
            borderRadius: 2,
            height: '100%',
            boxShadow: '0px 0px 2px 0px rgba(145, 158, 171, 0.30), 0px 12px 24px -4px rgba(145, 158, 171, 0.12)'
          }}>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
              Fleet Overview
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={6}>
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  <Map sx={{ fontSize: 40, color: '#5D87FF', mb: 1 }} />
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Total Distance
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#5D87FF' }}>
                    {summary.totalKm ? `${formatNumber(summary.totalKm)} km` : '0 km'}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  <LocalGasStation sx={{ fontSize: 40, color: '#13DEB9', mb: 1 }} />
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Fuel Consumed
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#13DEB9' }}>
                    {summary.totalFuelLiters ? `${formatNumber(summary.totalFuelLiters)} L` : '0 L'}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  <AttachMoney sx={{ fontSize: 40, color: '#FFAE1F', mb: 1 }} />
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Cost per km
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#FFAE1F' }}>
                    {summary.costPerKm ? `${formatCurrency(summary.costPerKm)}/km` : formatCurrency(0) + '/km'}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  <Timeline sx={{ fontSize: 40, color: '#49BEFF', mb: 1 }} />
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Avg. Trip Distance
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#49BEFF' }}>
                    {summary.avgTripDistance ? `${formatNumber(summary.avgTripDistance, 1)} km` : '0.0 km'}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{
            p: 3,
            borderRadius: 2,
            height: '100%',
            boxShadow: '0px 0px 2px 0px rgba(145, 158, 171, 0.30), 0px 12px 24px -4px rgba(145, 158, 171, 0.12)'
          }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                Top Performing Vehicles
              </Typography>
              <Chip
                label={`${vehicleKpis.length} vehicles`}
                size="small"
                variant="outlined"
              />
            </Stack>

            {vehicleKpis.length > 0 ? (
              <Stack spacing={2}>
                {vehicleKpis
                  .sort((a, b) => (b.kmPerLiter || 0) - (a.kmPerLiter || 0))
                  .slice(0, 4)
                  .map((vehicle, index) => (
                    <Paper
                      key={index}
                      sx={{
                        p: 2,
                        backgroundColor: '#f8fafc',
                        border: index === 0 ? '2px solid #FFAE1F' : '1px solid #e5e7eb'
                      }}
                    >
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Box>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            {index === 0 && (
                              <Chip
                                label="Most Efficient"
                                size="small"
                                color="warning"
                                sx={{ fontWeight: 600 }}
                              />
                            )}
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                              {vehicle.registrationNumber || `Vehicle ${index + 1}`}
                            </Typography>
                          </Stack>
                          <Stack direction="row" spacing={2} mt={1}>
                            <Typography variant="body2" color="textSecondary">
                              Efficiency: {vehicle.kmPerLiter?.toFixed(1) || '0.0'} km/L
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              Distance: {formatNumber(vehicle.totalKm || 0)} km
                            </Typography>
                          </Stack>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                          <Chip
                            label={formatCurrency(vehicle.costPerKm || 0) + '/km'}
                            color={vehicle.kmPerLiter > 8 ? 'success' : vehicle.kmPerLiter > 6 ? 'warning' : 'error'}
                            size="small"
                            sx={{ fontWeight: 600, mb: 1 }}
                          />
                          <Typography variant="caption" color="textSecondary" display="block">
                            Fuel: {formatNumber(vehicle.fuelLiters || 0)} L
                          </Typography>
                        </Box>
                      </Stack>
                    </Paper>
                  ))}
              </Stack>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <DirectionsCar sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                <Typography variant="body1" color="textSecondary">
                  No vehicle data available
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                  Add vehicles to start tracking performance
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Footer Info */}
      <Box mt={4} pt={3} borderTop={1} borderColor="divider">
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="body2" color="textSecondary">
            Dashboard v1.0 • Data last updated: {new Date(dashboardData?.timestamp || Date.now()).toLocaleString('en-ZA')}
          </Typography>
          <Stack direction="row" spacing={1}>
            <Chip
              label="All amounts in ZAR"
              size="small"
              variant="outlined"
              color="info"
            />
            <Chip
              label={`${period === '7days' ? 'Weekly' : period === '30days' ? 'Monthly' : period === '90days' ? 'Quarterly' : 'Yearly'} Report`}
              size="small"
              variant="outlined"
            />
          </Stack>
        </Stack>
      </Box>
    </Box>
  );
};

export default Dashboard;