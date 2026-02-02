import { useParams, useNavigate } from 'react-router-dom';  // Added useNavigate
import { useEffect, useState, useMemo } from 'react';
import { fuelService } from '../services/fuelService';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  CircularProgress,
  Box,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  Button,
  Card,
  CardContent,
} from '@mui/material';
import {
  FilterList,
  Clear,
  Visibility,
  CheckCircle,
  Cancel,
  LocalGasStation,
  Person,
  DirectionsCar,
  Event,
  AttachMoney,
} from '@mui/icons-material';

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

// Format number with commas (for quantity)
const formatNumber = (num) => {
  if (num === null || num === undefined) return '0.00';
  const number = typeof num === 'string' ? parseFloat(num) : num;
  return new Intl.NumberFormat('en-ZA', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(number);
};

function FuelSlips() {
  const params = useParams();
  const navigate = useNavigate();
  const [slips, setSlips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [driverFilter, setDriverFilter] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState('');

  // Fetch slips
  useEffect(() => {
    async function fetchSlips() {
      setLoading(true);
      setError(null);

      try {
        const filters = {};

        if (driverFilter) {
          filters.driverId = driverFilter;
        } else if (params.id) {
          filters.driverId = params.id;
        }

        if (vehicleFilter) {
          filters.vehicleId = vehicleFilter;
        }

        const data = await fuelService.getFuelSlips(filters);
        setSlips(data || []);
      } catch (err) {
        console.error('Failed to fetch fuel slips:', err);
        setError(err.message || 'Failed to load fuel slips');
        setSlips([]);
      } finally {
        setLoading(false);
      }
    }

    fetchSlips();
  }, [params.id, driverFilter, vehicleFilter]);

  // Get unique drivers and vehicles for filters
  const { drivers, vehicles } = useMemo(() => {
    const uniqueDrivers = [];
    const uniqueVehicles = [];
    const driverMap = new Map();
    const vehicleMap = new Map();

    slips.forEach(slip => {
      if (slip.driverId && slip.driverName && !driverMap.has(slip.driverId)) {
        driverMap.set(slip.driverId, slip.driverName);
        uniqueDrivers.push({ id: slip.driverId, name: slip.driverName });
      }

      if (slip.vehicleId && slip.vehicleRegNumber && !vehicleMap.has(slip.vehicleId)) {
        vehicleMap.set(slip.vehicleId, slip.vehicleRegNumber);
        uniqueVehicles.push({ id: slip.vehicleId, regNumber: slip.vehicleRegNumber });
      }
    });

    return { drivers: uniqueDrivers, vehicles: uniqueVehicles };
  }, [slips]);

  // Calculate summary stats
  const summary = useMemo(() => {
    if (!slips.length) return null;

    const totalAmount = slips.reduce((sum, slip) =>
      sum + (parseFloat(slip.totalAmount) || 0), 0
    );

    const totalQuantity = slips.reduce((sum, slip) =>
      sum + (parseFloat(slip.quantity) || 0), 0
    );

    const averagePrice = totalQuantity > 0 ? totalAmount / totalQuantity : 0;

    const finalizedCount = slips.filter(slip => slip.finalized).length;
    const pendingCount = slips.length - finalizedCount;

    return {
      totalAmount,
      totalQuantity,
      averagePrice,
      finalizedCount,
      pendingCount,
      slipCount: slips.length,
    };
  }, [slips]);

  // Handle clear filters
  const handleClearFilters = () => {
    setDriverFilter('');
    setVehicleFilter('');
  };

  // Handle view slip details
  const handleViewSlip = (id) => {
    console.log('View slip:', id);
    // You can navigate to slip details or show a modal
    // navigate(`/fuel/slips/${id}`);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <Box textAlign="center">
          <CircularProgress size={60} />
          <Typography variant="h6" mt={2}>
            Loading fuel slips...
          </Typography>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box m={3}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button
          variant="contained"
          onClick={() => window.location.reload()}
        >
          Retry
        </Button>
      </Box>
    );
  }

  if (!slips.length) {
    return (
      <Box m={3}>
        <Typography variant="h4" gutterBottom>
          Fuel Slips
        </Typography>
        <Alert severity="info" sx={{ mt: 2 }}>
          No fuel slips found.
          {driverFilter || vehicleFilter ? ' Try clearing your filters.' : ''}
        </Alert>
        {(driverFilter || vehicleFilter) && (
          <Button
            startIcon={<Clear />}
            onClick={handleClearFilters}
            sx={{ mt: 2 }}
          >
            Clear Filters
          </Button>
        )}
      </Box>
    );
  }

  return (
    <Box m={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            <LocalGasStation sx={{ verticalAlign: 'middle', mr: 1 }} />
            Fuel Slips
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage and monitor all fuel transactions in South African Rands (ZAR)
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<LocalGasStation />}
          onClick={() => navigate('/fuel/slips/add')}
          sx={{ ml: 2 }}
        >
          New Fuel Slip
        </Button>
      </Box>

      {/* Summary Cards */}
      {summary && (
        <Box display="flex" gap={2} mb={3} flexWrap="wrap">
          <Card sx={{ flex: 1, minWidth: 200 }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <AttachMoney color="primary" />
                <Typography variant="h6">Total Cost</Typography>
              </Box>
              <Typography variant="h5" color="primary">
                {formatCurrency(summary.totalAmount)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Total spend on fuel
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ flex: 1, minWidth: 200 }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <LocalGasStation color="secondary" />
                <Typography variant="h6">Total Fuel</Typography>
              </Box>
              <Typography variant="h5" color="secondary">
                {formatNumber(summary.totalQuantity)} L
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Total litres consumed
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ flex: 1, minWidth: 200 }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <AttachMoney color="success" />
                <Typography variant="h6">Avg Price</Typography>
              </Box>
              <Typography variant="h5" color="success.main">
                {formatCurrency(summary.averagePrice)}
                <Typography component="span" variant="caption" ml={0.5}>
                  /L
                </Typography>
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Average price per litre
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ flex: 1, minWidth: 200 }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                {summary.pendingCount > 0 ? (
                  <Cancel color="warning" />
                ) : (
                  <CheckCircle color="success" />
                )}
                <Typography variant="h6">Status</Typography>
              </Box>
              <Box>
                <Chip
                  label={`${summary.finalizedCount} Finalized`}
                  size="small"
                  color="success"
                  variant="outlined"
                  sx={{ mr: 1, mb: 0.5 }}
                />
                {summary.pendingCount > 0 && (
                  <Chip
                    label={`${summary.pendingCount} Pending`}
                    size="small"
                    color="warning"
                    variant="outlined"
                  />
                )}
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                {summary.slipCount} total slips
              </Typography>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <FilterList color="action" />
            <Typography variant="h6">Filters</Typography>
            {(driverFilter || vehicleFilter) && (
              <Tooltip title="Clear filters">
                <IconButton size="small" onClick={handleClearFilters}>
                  <Clear />
                </IconButton>
              </Tooltip>
            )}
          </Box>

          <Box display="flex" gap={2} flexWrap="wrap">
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>
                <Person fontSize="small" sx={{ mr: 0.5 }} />
                Driver
              </InputLabel>
              <Select
                value={driverFilter}
                onChange={(e) => setDriverFilter(e.target.value)}
                label="Driver"
              >
                <MenuItem value="">All Drivers</MenuItem>
                {drivers.map(driver => (
                  <MenuItem key={driver.id} value={driver.id}>
                    {driver.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>
                <DirectionsCar fontSize="small" sx={{ mr: 0.5 }} />
                Vehicle
              </InputLabel>
              <Select
                value={vehicleFilter}
                onChange={(e) => setVehicleFilter(e.target.value)}
                label="Vehicle"
              >
                <MenuItem value="">All Vehicles</MenuItem>
                {vehicles.map(vehicle => (
                  <MenuItem key={vehicle.id} value={vehicle.id}>
                    {vehicle.regNumber}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </CardContent>
      </Card>

      {/* Results count */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="body1" color="text.secondary">
          Showing {slips.length} fuel slip{slips.length !== 1 ? 's' : ''}
          {summary && ` • Total: ${formatCurrency(summary.totalAmount)}`}
        </Typography>
        <Button
          size="small"
          startIcon={<Clear />}
          onClick={handleClearFilters}
          disabled={!driverFilter && !vehicleFilter}
        >
          Clear Filters
        </Button>
      </Box>

      {/* Table */}
      <TableContainer component={Paper} sx={{ mb: 4 }}>
        <Table>
          <TableHead sx={{ bgcolor: 'action.hover' }}>
            <TableRow>
              <TableCell><Event fontSize="small" sx={{ mr: 1 }} />Date</TableCell>
              <TableCell><Person fontSize="small" sx={{ mr: 1 }} />Driver</TableCell>
              <TableCell><DirectionsCar fontSize="small" sx={{ mr: 1 }} />Vehicle</TableCell>
              <TableCell><LocalGasStation fontSize="small" sx={{ mr: 1 }} />Fuel</TableCell>
              <TableCell><AttachMoney fontSize="small" sx={{ mr: 1 }} />Amount (ZAR)</TableCell>
              <TableCell>Station</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {slips.map(slip => (
              <TableRow
                key={slip.id}
                hover
                sx={{
                  '&:last-child td, &:last-child th': { border: 0 },
                  bgcolor: slip.finalized ? 'action.hover' : 'transparent'
                }}
              >
                <TableCell>
                  <Typography variant="body2">
                    {slip.transactionDate
                      ? new Date(slip.transactionDate).toLocaleDateString('en-ZA', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : '-'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="body2" fontWeight="medium">
                      {slip.driverName || '-'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      ID: {slip.driverId || 'N/A'}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="body2" fontWeight="medium">
                      {slip.vehicleRegNumber || '-'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      ID: {slip.vehicleId || 'N/A'}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="body2" fontWeight="medium">
                      {slip.quantity ? `${formatNumber(slip.quantity)} L` : '-'}
                    </Typography>
                    {slip.unitPrice && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        @ {formatCurrency(slip.unitPrice)}/L
                      </Typography>
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="body2" fontWeight="medium" color="primary">
                      {formatCurrency(slip.totalAmount)}
                    </Typography>
                    {slip.quantity && slip.totalAmount && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        {formatCurrency(parseFloat(slip.totalAmount) / parseFloat(slip.quantity))}/L
                      </Typography>
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {slip.stationName || slip.location || '-'}
                  </Typography>
                  {slip.location && slip.stationName && (
                    <Typography variant="caption" color="text.secondary" display="block">
                      {slip.location}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Chip
                    label={slip.finalized ? 'Finalized' : 'Pending'}
                    size="small"
                    color={slip.finalized ? 'success' : 'warning'}
                    variant="outlined"
                    icon={slip.finalized ? <CheckCircle /> : <Cancel />}
                  />
                </TableCell>
                <TableCell>
                  <Tooltip title="View Details">
                    <IconButton
                      size="small"
                      onClick={() => handleViewSlip(slip.id)}
                      color="primary"
                    >
                      <Visibility fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Footer summary */}
      {summary && (
        <Card sx={{ mt: 2, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="h6" gutterBottom>
                  Summary Totals
                </Typography>
                <Typography variant="body2">
                  {summary.slipCount} slips • {formatNumber(summary.totalQuantity)} litres
                </Typography>
              </Box>
              <Box textAlign="right">
                <Typography variant="h5">
                  {formatCurrency(summary.totalAmount)}
                </Typography>
                <Typography variant="body2">
                  Average: {formatCurrency(summary.averagePrice)}/L
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}

export default FuelSlips;