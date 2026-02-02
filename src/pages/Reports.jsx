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
    // Implement export functionality
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
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" alignItems="center" gap={2}>
              <AnalyticsIcon sx={{ fontSize: 40, color: 'primary.main' }} />
              <Box>
                <Typography variant="h4" fontWeight="bold">
                  Reports & Analytics
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Insights and analytics for fleet management
                </Typography>
              </Box>
            </Box>
            <Box>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={() => window.location.reload()}
                sx={{ mr: 1 }}
              >
                Refresh
              </Button>
              <IconButton onClick={handleMenuClick}>
                <MoreVert />
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
              >
                <MenuItem onClick={() => { handleExport('pdf'); handleMenuClose(); }}>
                  <PictureAsPdf sx={{ mr: 1 }} /> Export as PDF
                </MenuItem>
                <MenuItem onClick={() => { handleExport('excel'); handleMenuClose(); }}>
                  <Download sx={{ mr: 1 }} /> Export as Excel
                </MenuItem>
                <MenuItem onClick={() => { handleExport('email'); handleMenuClose(); }}>
                  <Email sx={{ mr: 1 }} /> Email Report
                </MenuItem>
              </Menu>
            </Box>
          </Box>
        </Box>

        {/* Filters */}
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            <FilterList sx={{ mr: 1, verticalAlign: 'middle' }} />
            Report Filters
          </Typography>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Time Period</InputLabel>
                <Select
                  value={period}
                  label="Time Period"
                  onChange={handlePeriodChange}
                >
                  <MenuItem value="lastmonth">Last Month</MenuItem>
                  <MenuItem value="last3months">Last 3 Months</MenuItem>
                  <MenuItem value="last6months">Last 6 Months</MenuItem>
                  <MenuItem value="yeartodate">Year to Date</MenuItem>
                  <MenuItem value="custom">Custom Range</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {showCustomRange && (
              <>
                <Grid item xs={12} md={3}>
                  <DatePicker
                    label="Start Date"
                    value={dateRange.start}
                    onChange={(date) => setDateRange({ ...dateRange, start: date })}
                    renderInput={(params) => <TextField {...params} fullWidth size="small" />}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <DatePicker
                    label="End Date"
                    value={dateRange.end}
                    onChange={(date) => setDateRange({ ...dateRange, end: date })}
                    renderInput={(params) => <TextField {...params} fullWidth size="small" />}
                  />
                </Grid>
              </>
            )}

            <Grid item xs={12} md={showCustomRange ? 3 : 4}>
              <FormControl fullWidth size="small">
                <InputLabel>Vehicle</InputLabel>
                <Select
                  value={vehicle}
                  label="Vehicle"
                  onChange={(e) => setVehicle(e.target.value)}
                >
                  <MenuItem value="all">All Vehicles</MenuItem>
                  {vehiclePerformanceData.map((v) => (
                    <MenuItem key={v.vehicle} value={v.vehicle.toLowerCase()}>
                      {v.vehicle}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={showCustomRange ? 3 : 4}>
              <FormControl fullWidth size="small">
                <InputLabel>Report Type</InputLabel>
                <Select
                  value={reportType}
                  label="Report Type"
                  onChange={(e) => setReportType(e.target.value)}
                >
                  <MenuItem value="fuel">Fuel Consumption</MenuItem>
                  <MenuItem value="maintenance">Maintenance</MenuItem>
                  <MenuItem value="driver">Driver Performance</MenuItem>
                  <MenuItem value="cost">Cost Analysis</MenuItem>
                  <MenuItem value="vehicle">Vehicle Performance</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={showCustomRange ? 3 : 4}>
              <Stack direction="row" spacing={1}>
                <Button
                  variant="contained"
                  startIcon={<Download />}
                  onClick={() => handleExport('csv')}
                  fullWidth
                >
                  Export CSV
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Print />}
                  onClick={() => window.print()}
                >
                  Print
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </Paper>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      {stats.totalFuel.toLocaleString()} L
                    </Typography>
                    <Typography color="text.secondary" variant="body2">
                      Total Fuel Consumption
                    </Typography>
                    <Typography variant="caption" color="success.main" sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      <TrendingUp sx={{ fontSize: 14, mr: 0.5 }} /> 5.2% from last period
                    </Typography>
                  </Box>
                  <LocalGasStation sx={{ color: 'primary.main', fontSize: 48, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      R {stats.totalCost.toLocaleString()}
                    </Typography>
                    <Typography color="text.secondary" variant="body2">
                      Total Fuel Cost
                    </Typography>
                    <Typography variant="caption" color="error.main" sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      <TrendingDown sx={{ fontSize: 14, mr: 0.5 }} /> 2.1% savings
                    </Typography>
                  </Box>
                  <DirectionsCar sx={{ color: 'secondary.main', fontSize: 48, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      {stats.avgEfficiency.toFixed(1)} km/L
                    </Typography>
                    <Typography color="text.secondary" variant="body2">
                      Average Efficiency
                    </Typography>
                    <Typography variant="caption" color="success.main" sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      <TrendingUp sx={{ fontSize: 14, mr: 0.5 }} /> 0.3 km/L improvement
                    </Typography>
                  </Box>
                  <Person sx={{ color: 'info.main', fontSize: 48, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      {vehiclePerformanceData.length}
                    </Typography>
                    <Typography color="text.secondary" variant="body2">
                      Active Vehicles
                    </Typography>
                    <Typography variant="caption" color="success.main" sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      <TrendingUp sx={{ fontSize: 14, mr: 0.5 }} /> 8% activity increase
                    </Typography>
                  </Box>
                  <CalendarMonth sx={{ color: 'warning.main', fontSize: 48, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Charts Section */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Fuel Consumption Chart */}
          <Grid item xs={12} lg={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight="bold">
                  Fuel Consumption & Cost Trends
                </Typography>
                <ResponsiveContainer width="100%" height={350}>
                  <AreaChart data={fuelConsumptionData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      yAxisId="left"
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      formatter={(value, name) => [
                        name === 'consumption' ? `${value} L` : `R ${value.toLocaleString()}`,
                        name === 'consumption' ? 'Fuel Consumption' : 'Cost'
                      ]}
                    />
                    <Legend />
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
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight="bold">
                  Expense Distribution
                </Typography>
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={expenseByCategory}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      innerRadius={40}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {expenseByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value}%`, 'Percentage']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Comparison Chart */}
        <Grid item xs={12} sx={{ mb: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Monthly Cost Comparison
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyComparisonData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`R ${value.toLocaleString()}`, 'Cost']} />
                  <Legend />
                  <Bar dataKey="previous" name="Previous Period" fill="#8884d8" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="current" name="Current Period" fill="#82ca9d" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Vehicle Performance Table */}
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h6" fontWeight="bold">
                Vehicle Performance Report
              </Typography>
              <Alert severity="info" sx={{ maxWidth: 400 }}>
                Showing performance data for {vehicle === 'all' ? 'all vehicles' : 'selected vehicle'}
              </Alert>
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Vehicle</strong></TableCell>
                    <TableCell><strong>Fuel Efficiency (km/L)</strong></TableCell>
                    <TableCell><strong>Distance (km)</strong></TableCell>
                    <TableCell><strong>Fuel Cost (R)</strong></TableCell>
                    <TableCell><strong>Cost per km (R)</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell><strong>Trend</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {vehiclePerformanceData.map((vehicleData) => (
                    <TableRow key={vehicleData.vehicle} hover>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <DirectionsCar color="action" />
                          <Typography fontWeight="medium">
                            {vehicleData.vehicle}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography fontWeight="medium">
                            {vehicleData.fuelEfficiency}
                          </Typography>
                          {vehicleData.fuelEfficiency > 4 ? (
                            <TrendingUp color="success" />
                          ) : vehicleData.fuelEfficiency < 3.6 ? (
                            <TrendingDown color="error" />
                          ) : (
                            <TrendingUp color="warning" />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        {vehicleData.distance.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Typography fontWeight="medium">
                          R {vehicleData.cost.toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography fontWeight="medium">
                          R {vehicleData.avgCostPerKm.toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={vehicleData.status}
                          color={getStatusColor(vehicleData.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {vehicleData.fuelEfficiency > 4 ? (
                          <Typography color="success.main" variant="caption">
                            Excellent
                          </Typography>
                        ) : vehicleData.fuelEfficiency < 3.6 ? (
                          <Typography color="error.main" variant="caption">
                            Needs Improvement
                          </Typography>
                        ) : (
                          <Typography color="warning.main" variant="caption">
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

        {/* Summary Section */}
        <Box sx={{ mt: 3 }}>
          <Alert severity="info" icon={false}>
            <Typography variant="body2">
              <strong>Report Summary:</strong> Data covers {period.replace('last', 'Last ')} period.
              Total fuel consumption of {stats.totalFuel.toLocaleString()} liters with an average efficiency of {stats.avgEfficiency.toFixed(1)} km/L.
              Consider implementing fuel-saving measures for vehicles with efficiency below 3.8 km/L.
            </Typography>
          </Alert>
        </Box>
      </Box>
    </LocalizationProvider>
  );
};

export default Reports;