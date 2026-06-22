import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  IconButton,
  Menu,
  Alert,
  Chip,
  Stack,
  Divider,
} from '@mui/material';
import {
  Analytics as AnalyticsIcon,
  Download,
  Print,
  Email,
  TrendingUp,
  TrendingDown,
  LocalGasStation,
  DirectionsCar,
  Person,
  CalendarMonth,
  MoreVert,
  FilterList,
  Refresh,
  PictureAsPdf,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

// Compact Stat Card Component
const StatCard = ({ title, value, icon: Icon, color = 'primary', trend, trendLabel, trendColor = 'success' }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Box>
          <Typography variant="h5" fontWeight="bold" sx={{ fontSize: '1.1rem' }}>
            {value}
          </Typography>
          <Typography color="text.secondary" variant="caption" sx={{ fontSize: '0.65rem', display: 'block' }}>
            {title}
          </Typography>
          {trend && (
            <Typography 
              variant="caption" 
              color={trendColor === 'success' ? 'success.main' : 'error.main'} 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                mt: 0.5,
                fontSize: '0.6rem'
              }}
            >
              {trendColor === 'success' ? 
                <TrendingUp sx={{ fontSize: 12, mr: 0.25 }} /> : 
                <TrendingDown sx={{ fontSize: 12, mr: 0.25 }} />
              }
              {trendLabel}
            </Typography>
          )}
        </Box>
        <Icon 
          sx={{ 
            color: `${color}.main`, 
            fontSize: 32,
            opacity: 0.8 
          }} 
        />
      </Box>
    </CardContent>
  </Card>
);

const Reports = () => {
  const [period, setPeriod] = useState('last6months');
  const [vehicle, setVehicle] = useState('all');
  const [reportType, setReportType] = useState('fuel');
  const [dateRange, setDateRange] = useState({
    start: new Date('2024-01-01'),
    end: new Date('2024-06-30'),
  });
  const [showCustomRange, setShowCustomRange] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  // Mock data for charts
  const fuelConsumptionData = [
    { month: 'Jan', consumption: 4200, cost: 94500, average: 3.8 },
    { month: 'Feb', consumption: 3800, cost: 85500, average: 3.9 },
    { month: 'Mar', consumption: 4500, cost: 101250, average: 3.7 },
    { month: 'Apr', consumption: 3900, cost: 87750, average: 3.8 },
    { month: 'May', consumption: 4100, cost: 92250, average: 3.9 },
    { month: 'Jun', consumption: 4300, cost: 96750, average: 3.8 },
  ];

  const vehiclePerformanceData = [
    {
      vehicle: 'ABC123GP',
      fuelEfficiency: 3.8,
      distance: 12500,
      cost: 87500,
      status: 'Good',
      avgCostPerKm: 7.0
    },
    {
      vehicle: 'DEF456GP',
      fuelEfficiency: 4.2,
      distance: 9800,
      cost: 68500,
      status: 'Excellent',
      avgCostPerKm: 6.99
    },
    {
      vehicle: 'GHI789GP',
      fuelEfficiency: 3.5,
      distance: 15200,
      cost: 106400,
      status: 'Needs Attention',
      avgCostPerKm: 7.0
    },
    {
      vehicle: 'JKL012GP',
      fuelEfficiency: 4.0,
      distance: 11000,
      cost: 77000,
      status: 'Good',
      avgCostPerKm: 7.0
    },
  ];

  const expenseByCategory = [
    { name: 'Fuel', value: 65, color: '#0088FE' },
    { name: 'Maintenance', value: 20, color: '#00C49F' },
    { name: 'Tyres', value: 10, color: '#FFBB28' },
    { name: 'Insurance', value: 3, color: '#FF6B6B' },
    { name: 'Other', value: 2, color: '#8042FF' },
  ];

  const monthlyComparisonData = [
    { month: 'Jan', current: 94500, previous: 91000 },
    { month: 'Feb', current: 85500, previous: 88000 },
    { month: 'Mar', current: 101250, previous: 95000 },
    { month: 'Apr', current: 87750, previous: 89000 },
    { month: 'May', current: 92250, previous: 90000 },
    { month: 'Jun', current: 96750, previous: 92000 },
  ];

  const handlePeriodChange = (event) => {
    const value = event.target.value;
    setPeriod(value);
    setShowCustomRange(value === 'custom');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Excellent': return 'success';
      case 'Good': return 'info';
      case 'Needs Attention': return 'warning';
      case 'Poor': return 'error';
      default: return 'default';
    }
  };

  const handleExport = (format) => {
    console.log(`Exporting report as ${format}`);
  };

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const calculateStats = () => {
    const totalFuel = fuelConsumptionData.reduce((sum, item) => sum + item.consumption, 0);
    const totalCost = fuelConsumptionData.reduce((sum, item) => sum + item.cost, 0);
    const avgEfficiency = fuelConsumptionData.reduce((sum, item) => sum + item.average, 0) / fuelConsumptionData.length;
    const totalVehicles = vehiclePerformanceData.length;

    return { totalFuel, totalCost, avgEfficiency, totalVehicles };
  };

  const stats = calculateStats();

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: { xs: 1, sm: 1.5, md: 2 } }}>
        {/* Header - Compact */}
        <Box sx={{ mb: 2 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
            <Box display="flex" alignItems="center" gap={1}>
              <AnalyticsIcon sx={{ fontSize: 28, color: 'primary.main' }} />
              <Box>
                <Typography variant="h6" fontWeight="bold" sx={{ fontSize: '1rem' }}>
                  Reports & Analytics
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                  Fleet management insights
                </Typography>
              </Box>
            </Box>
            <Stack direction="row" spacing={0.75}>
              <Button
                variant="outlined"
                startIcon={<Refresh sx={{ fontSize: '0.9rem' }} />}
                onClick={() => window.location.reload()}
                size="small"
                sx={{ fontSize: '0.75rem', py: 0.5 }}
              >
                Refresh
              </Button>
              <IconButton onClick={handleMenuClick} size="small" sx={{ p: 0.5 }}>
                <MoreVert sx={{ fontSize: '0.9rem' }} />
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
              >
                <MenuItem onClick={() => { handleExport('pdf'); handleMenuClose(); }} sx={{ fontSize: '0.8rem' }}>
                  <PictureAsPdf sx={{ mr: 1, fontSize: '0.9rem' }} /> Export as PDF
                </MenuItem>
                <MenuItem onClick={() => { handleExport('excel'); handleMenuClose(); }} sx={{ fontSize: '0.8rem' }}>
                  <Download sx={{ mr: 1, fontSize: '0.9rem' }} /> Export as Excel
                </MenuItem>
                <MenuItem onClick={() => { handleExport('email'); handleMenuClose(); }} sx={{ fontSize: '0.8rem' }}>
                  <Email sx={{ mr: 1, fontSize: '0.9rem' }} /> Email Report
                </MenuItem>
              </Menu>
            </Stack>
          </Box>
        </Box>

        {/* Filters - Compact */}
        <Paper sx={{ p: 1.5, mb: 2 }}>
          <Typography variant="subtitle2" sx={{ fontSize: '0.8rem', fontWeight: 600, mb: 1.5 }}>
            <FilterList sx={{ mr: 0.5, fontSize: '0.9rem', verticalAlign: 'middle' }} />
            Report Filters
          </Typography>
          <Grid container spacing={1.5} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ fontSize: '0.75rem' }}>Time Period</InputLabel>
                <Select
                  value={period}
                  label="Time Period"
                  onChange={handlePeriodChange}
                  sx={{ fontSize: '0.75rem' }}
                >
                  <MenuItem value="lastmonth" sx={{ fontSize: '0.75rem' }}>Last Month</MenuItem>
                  <MenuItem value="last3months" sx={{ fontSize: '0.75rem' }}>Last 3 Months</MenuItem>
                  <MenuItem value="last6months" sx={{ fontSize: '0.75rem' }}>Last 6 Months</MenuItem>
                  <MenuItem value="yeartodate" sx={{ fontSize: '0.75rem' }}>Year to Date</MenuItem>
                  <MenuItem value="custom" sx={{ fontSize: '0.75rem' }}>Custom Range</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {showCustomRange && (
              <>
                <Grid item xs={12} sm={6} md={3}>
                  <DatePicker
                    label="Start Date"
                    value={dateRange.start}
                    onChange={(date) => setDateRange({ ...dateRange, start: date })}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        size: 'small',
                        sx: { '& .MuiInputLabel-root': { fontSize: '0.75rem' } }
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <DatePicker
                    label="End Date"
                    value={dateRange.end}
                    onChange={(date) => setDateRange({ ...dateRange, end: date })}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        size: 'small',
                        sx: { '& .MuiInputLabel-root': { fontSize: '0.75rem' } }
                      }
                    }}
                  />
                </Grid>
              </>
            )}

            <Grid item xs={12} sm={6} md={showCustomRange ? 3 : 4}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ fontSize: '0.75rem' }}>Vehicle</InputLabel>
                <Select
                  value={vehicle}
                  label="Vehicle"
                  onChange={(e) => setVehicle(e.target.value)}
                  sx={{ fontSize: '0.75rem' }}
                >
                  <MenuItem value="all" sx={{ fontSize: '0.75rem' }}>All Vehicles</MenuItem>
                  {vehiclePerformanceData.map((v) => (
                    <MenuItem key={v.vehicle} value={v.vehicle.toLowerCase()} sx={{ fontSize: '0.75rem' }}>
                      {v.vehicle}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={showCustomRange ? 3 : 4}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ fontSize: '0.75rem' }}>Report Type</InputLabel>
                <Select
                  value={reportType}
                  label="Report Type"
                  onChange={(e) => setReportType(e.target.value)}
                  sx={{ fontSize: '0.75rem' }}
                >
                  <MenuItem value="fuel" sx={{ fontSize: '0.75rem' }}>Fuel Consumption</MenuItem>
                  <MenuItem value="maintenance" sx={{ fontSize: '0.75rem' }}>Maintenance</MenuItem>
                  <MenuItem value="driver" sx={{ fontSize: '0.75rem' }}>Driver Performance</MenuItem>
                  <MenuItem value="cost" sx={{ fontSize: '0.75rem' }}>Cost Analysis</MenuItem>
                  <MenuItem value="vehicle" sx={{ fontSize: '0.75rem' }}>Vehicle Performance</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={showCustomRange ? 3 : 4}>
              <Stack direction="row" spacing={0.75}>
                <Button
                  variant="contained"
                  startIcon={<Download sx={{ fontSize: '0.9rem' }} />}
                  onClick={() => handleExport('csv')}
                  size="small"
                  sx={{ fontSize: '0.75rem', py: 0.5, flex: 1 }}
                >
                  Export CSV
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Print sx={{ fontSize: '0.9rem' }} />}
                  onClick={() => window.print()}
                  size="small"
                  sx={{ fontSize: '0.75rem', py: 0.5, minWidth: 'auto' }}
                >
                  Print
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </Paper>

        {/* Stats Cards - Compact */}
        <Grid container spacing={1.5} sx={{ mb: 2 }}>
          <Grid item xs={6} sm={6} md={3}>
            <StatCard
              title="Total Fuel"
              value={`${stats.totalFuel.toLocaleString()} L`}
              icon={LocalGasStation}
              color="primary"
              trend
              trendLabel="5.2% from last period"
              trendColor="success"
            />
          </Grid>

          <Grid item xs={6} sm={6} md={3}>
            <StatCard
              title="Total Cost"
              value={`R ${stats.totalCost.toLocaleString()}`}
              icon={DirectionsCar}
              color="secondary"
              trend
              trendLabel="2.1% savings"
              trendColor="error"
            />
          </Grid>

          <Grid item xs={6} sm={6} md={3}>
            <StatCard
              title="Avg Efficiency"
              value={`${stats.avgEfficiency.toFixed(1)} km/L`}
              icon={Person}
              color="info"
              trend
              trendLabel="0.3 km/L improvement"
              trendColor="success"
            />
          </Grid>

          <Grid item xs={6} sm={6} md={3}>
            <StatCard
              title="Active Vehicles"
              value={stats.totalVehicles}
              icon={CalendarMonth}
              color="warning"
              trend
              trendLabel="8% activity increase"
              trendColor="success"
            />
          </Grid>
        </Grid>

        {/* Charts Section - Compact */}
        <Grid container spacing={1.5} sx={{ mb: 2 }}>
          {/* Fuel Consumption Chart */}
          <Grid item xs={12} lg={8}>
            <Card>
              <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Typography variant="subtitle2" sx={{ fontSize: '0.8rem', fontWeight: 600, mb: 1 }}>
                  Fuel Consumption & Cost Trends
                </Typography>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={fuelConsumptionData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{ fontSize: '11px' }}
                      formatter={(value, name) => [
                        name === 'consumption' ? `${value} L` : `R ${value.toLocaleString()}`,
                        name === 'consumption' ? 'Fuel Consumption' : 'Cost'
                      ]}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="consumption"
                      stroke="#8884d8"
                      fill="#8884d8"
                      fillOpacity={0.3}
                      name="Consumption (L)"
                    />
                    <Area
                      yAxisId="right"
                      type="monotone"
                      dataKey="cost"
                      stroke="#82ca9d"
                      fill="#82ca9d"
                      fillOpacity={0.3}
                      name="Cost (R)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Expense Distribution Chart */}
          <Grid item xs={12} lg={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Typography variant="subtitle2" sx={{ fontSize: '0.8rem', fontWeight: 600, mb: 1 }}>
                  Expense Distribution
                </Typography>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={expenseByCategory}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      innerRadius={32}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {expenseByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ fontSize: '11px' }}
                      formatter={(value) => [`${value}%`, 'Percentage']} 
                    />
                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Comparison Chart - Compact */}
        <Grid item xs={12} sx={{ mb: 2 }}>
          <Card>
            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Typography variant="subtitle2" sx={{ fontSize: '0.8rem', fontWeight: 600, mb: 1 }}>
                Monthly Cost Comparison
              </Typography>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={monthlyComparisonData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip 
                    contentStyle={{ fontSize: '11px' }}
                    formatter={(value) => [`R ${value.toLocaleString()}`, 'Cost']} 
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="previous" name="Previous Period" fill="#8884d8" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="current" name="Current Period" fill="#82ca9d" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Vehicle Performance Table - Compact */}
        <Card>
          <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
              <Typography variant="subtitle2" sx={{ fontSize: '0.8rem', fontWeight: 600 }}>
                Vehicle Performance Report
              </Typography>
              <Alert severity="info" sx={{ fontSize: '0.7rem', py: 0 }}>
                {vehicle === 'all' ? 'All vehicles' : 'Selected vehicle'}
              </Alert>
            </Box>

            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600, py: 0.75 }}>Vehicle</TableCell>
                    <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600, py: 0.75 }}>Efficiency</TableCell>
                    <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600, py: 0.75 }} align="right">Distance</TableCell>
                    <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600, py: 0.75 }} align="right">Fuel Cost</TableCell>
                    <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600, py: 0.75 }} align="right">Cost/km</TableCell>
                    <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600, py: 0.75 }}>Status</TableCell>
                    <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600, py: 0.75 }}>Trend</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {vehiclePerformanceData.map((vehicleData) => (
                    <TableRow key={vehicleData.vehicle} hover>
                      <TableCell sx={{ fontSize: '0.7rem', py: 0.5 }}>
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <DirectionsCar sx={{ fontSize: '0.8rem', color: 'action.active' }} />
                          <Typography fontWeight="500" sx={{ fontSize: '0.7rem' }}>
                            {vehicleData.vehicle}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.7rem', py: 0.5 }}>
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <Typography fontWeight="500" sx={{ fontSize: '0.7rem' }}>
                            {vehicleData.fuelEfficiency}
                          </Typography>
                          {vehicleData.fuelEfficiency > 4 ? (
                            <TrendingUp sx={{ fontSize: '0.8rem', color: 'success.main' }} />
                          ) : vehicleData.fuelEfficiency < 3.6 ? (
                            <TrendingDown sx={{ fontSize: '0.8rem', color: 'error.main' }} />
                          ) : (
                            <TrendingUp sx={{ fontSize: '0.8rem', color: 'warning.main' }} />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell align="right" sx={{ fontSize: '0.7rem', py: 0.5 }}>
                        {vehicleData.distance.toLocaleString()}
                      </TableCell>
                      <TableCell align="right" sx={{ fontSize: '0.7rem', py: 0.5 }}>
                        <Typography fontWeight="500" sx={{ fontSize: '0.7rem' }}>
                          R {vehicleData.cost.toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell align="right" sx={{ fontSize: '0.7rem', py: 0.5 }}>
                        <Typography fontWeight="500" sx={{ fontSize: '0.7rem' }}>
                          R {vehicleData.avgCostPerKm.toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.7rem', py: 0.5 }}>
                        <Chip
                          label={vehicleData.status}
                          color={getStatusColor(vehicleData.status)}
                          size="small"
                          sx={{ height: 18, fontSize: '0.6rem' }}
                        />
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.7rem', py: 0.5 }}>
                        {vehicleData.fuelEfficiency > 4 ? (
                          <Typography color="success.main" variant="caption" sx={{ fontSize: '0.6rem' }}>
                            Excellent
                          </Typography>
                        ) : vehicleData.fuelEfficiency < 3.6 ? (
                          <Typography color="error.main" variant="caption" sx={{ fontSize: '0.6rem' }}>
                            Needs Improvement
                          </Typography>
                        ) : (
                          <Typography color="warning.main" variant="caption" sx={{ fontSize: '0.6rem' }}>
                            Average
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        {/* Summary Section - Compact */}
        <Box sx={{ mt: 2 }}>
          <Alert severity="info" icon={false} sx={{ fontSize: '0.75rem', py: 0.75 }}>
            <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
              <strong>Report Summary:</strong> {period.replace('last', 'Last ')} period.
              Total fuel: {stats.totalFuel.toLocaleString()} L • Avg efficiency: {stats.avgEfficiency.toFixed(1)} km/L
            </Typography>
          </Alert>
        </Box>
      </Box>
    </LocalizationProvider>
  );
};

export default Reports;
