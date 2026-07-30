// src/pages/FuelSlips.jsx
import { useParams, useNavigate } from 'react-router-dom';
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
  Stack,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Divider,
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
  Refresh as RefreshIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  TrendingUp,
  TrendingDown,
  Receipt,
  Verified as VerifiedIcon,
  Pending as PendingIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

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

// Compact Stat Card Component
const StatCard = ({ title, value, icon: Icon, color = 'primary', subtitle, badge }) => (
  <Card sx={{ height: '100%', position: 'relative' }}>
    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
      <Stack direction="row" alignItems="center" spacing={1.5}>
        <Box
          sx={{
            bgcolor: `${color}.light`,
            borderRadius: 1,
            p: 0.75,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon sx={{ fontSize: '1.2rem', color: `${color}.main` }} />
        </Box>
        <Box>
          <Typography variant="h5" fontWeight="bold" sx={{ fontSize: '1.1rem' }}>
            {value}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem', display: 'block' }}>
              {subtitle}
            </Typography>
          )}
        </Box>
      </Stack>
      {badge && (
        <Chip
          label={badge}
          size="small"
          color={color}
          sx={{ position: 'absolute', top: 8, right: 8, height: 18, fontSize: '0.5rem' }}
        />
      )}
    </CardContent>
  </Card>
);

// Status Chip Component
const StatusChip = ({ status }) => {
  const getStatusConfig = (status) => {
    switch (status?.toUpperCase()) {
      case 'VERIFIED':
        return { color: 'success', icon: <VerifiedIcon sx={{ fontSize: '0.7rem' }} />, label: 'Verified' };
      case 'PENDING':
        return { color: 'warning', icon: <PendingIcon sx={{ fontSize: '0.7rem' }} />, label: 'Pending' };
      case 'REJECTED':
        return { color: 'error', icon: <Cancel sx={{ fontSize: '0.7rem' }} />, label: 'Rejected' };
      default:
        return { color: 'default', icon: null, label: status || 'Unknown' };
    }
  };

  const config = getStatusConfig(status);
  return (
    <Chip
      label={config.label}
      size="small"
      color={config.color}
      icon={config.icon}
      sx={{ height: 20, fontSize: '0.6rem' }}
    />
  );
};

function FuelSlips() {
  const params = useParams();
  const navigate = useNavigate();
  const { user } = useAuth(); // MOVED INSIDE THE COMPONENT
  
  const [slips, setSlips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [driverFilter, setDriverFilter] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Delete Dialog State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Verify Dialog State
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [verifyId, setVerifyId] = useState(null);
  const [verifying, setVerifying] = useState(false);

  // Fetch slips - show latest first
  const fetchSlips = async () => {
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

      // Add sort parameter to get latest first
      filters.sort = 'id,desc';
      
      const data = await fuelService.getFuelSlips(filters);
      
      // Sort by transaction date descending (latest first) as fallback
      const sortedData = (data || []).sort((a, b) => {
        const dateA = new Date(a.transactionDate || a.createdAt || 0);
        const dateB = new Date(b.transactionDate || b.createdAt || 0);
        return dateB - dateA;
      });
      
      setSlips(sortedData);
    } catch (err) {
      console.error('Failed to fetch fuel slips:', err);
      setError(err.message || 'Failed to load fuel slips');
      setSlips([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlips();
  }, [params.id, driverFilter, vehicleFilter, statusFilter]);

  // Get unique drivers and vehicles for filters
  const { drivers, vehicles, statuses } = useMemo(() => {
    const uniqueDrivers = [];
    const uniqueVehicles = [];
    const uniqueStatuses = new Set();
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

      if (slip.status) {
        uniqueStatuses.add(slip.status);
      }
    });

    return { 
      drivers: uniqueDrivers, 
      vehicles: uniqueVehicles,
      statuses: Array.from(uniqueStatuses),
    };
  }, [slips]);

  // Calculate summary stats with new metrics
  const summary = useMemo(() => {
    if (!slips.length) return null;

    // Filter slips with trip association
    const withTrip = slips.filter(slip => slip.tripId);
    const withoutTrip = slips.filter(slip => !slip.tripId);

    // Calculate totals
    const totalAmount = slips.reduce((sum, slip) =>
      sum + (parseFloat(slip.totalAmount) || 0), 0
    );

    const totalQuantity = slips.reduce((sum, slip) =>
      sum + (parseFloat(slip.quantity) || 0), 0
    );

    // With Trip stats
    const withTripAmount = withTrip.reduce((sum, slip) =>
      sum + (parseFloat(slip.totalAmount) || 0), 0
    );
    const withTripQuantity = withTrip.reduce((sum, slip) =>
      sum + (parseFloat(slip.quantity) || 0), 0
    );

    // Without Trip stats
    const withoutTripAmount = withoutTrip.reduce((sum, slip) =>
      sum + (parseFloat(slip.totalAmount) || 0), 0
    );
    const withoutTripQuantity = withoutTrip.reduce((sum, slip) =>
      sum + (parseFloat(slip.quantity) || 0), 0
    );

    // Average price per litre
    const averagePrice = totalQuantity > 0 ? totalAmount / totalQuantity : 0;
    const withTripAvg = withTripQuantity > 0 ? withTripAmount / withTripQuantity : 0;
    const withoutTripAvg = withoutTripQuantity > 0 ? withoutTripAmount / withoutTripQuantity : 0;

    // Status counts
    const statusCounts = {};
    slips.forEach(slip => {
      const status = slip.status || 'PENDING';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    return {
      totalAmount,
      totalQuantity,
      averagePrice,
      slipCount: slips.length,
      // With Trip stats
      withTripCount: withTrip.length,
      withTripAmount,
      withTripQuantity,
      withTripAvg,
      // Without Trip stats
      withoutTripCount: withoutTrip.length,
      withoutTripAmount,
      withoutTripQuantity,
      withoutTripAvg,
      // Status counts
      statusCounts,
    };
  }, [slips]);

  // Filter slips by status
  const filteredSlips = useMemo(() => {
    if (statusFilter === 'all') return slips;
    return slips.filter(slip => (slip.status || 'PENDING') === statusFilter);
  }, [slips, statusFilter]);

  // Handle clear filters
  const handleClearFilters = () => {
    setDriverFilter('');
    setVehicleFilter('');
    setStatusFilter('all');
  };

  // Handle view slip details
  const handleViewSlip = (id) => {
    console.log('🔍 Viewing fuel slip with ID:', id);
    navigate(`/fuel/slips/${id}`);
  };

  // Handle edit slip
  const handleEditSlip = (id) => {
    console.log('✏️ Editing fuel slip with ID:', id);
    navigate(`/fuel/slips/${id}/edit`);
  };

  // Handle delete dialog
  const handleDeleteClick = (id) => {
    setDeleteId(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await fuelService.deleteFuelSlip(deleteId);
      setDeleteDialogOpen(false);
      setDeleteId(null);
      await fetchSlips();
    } catch (err) {
      console.error('Failed to delete fuel slip:', err);
      setError(err.message || 'Failed to delete fuel slip');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setDeleteId(null);
  };

  // Handle verify dialog
  const handleVerifyClick = (id) => {
    setVerifyId(id);
    setVerifyDialogOpen(true);
  };

  const handleVerifyConfirm = async () => {
    if (!verifyId) return;
    setVerifying(true);
    try {
      const currentUser = user?.username || user?.email || 'SYSTEM';
      await fuelService.verifyFuelSlip(verifyId, currentUser);
      setVerifyDialogOpen(false);
      setVerifyId(null);
      await fetchSlips();
    } catch (err) {
      console.error('Failed to verify fuel slip:', err);
      setError(err.message || 'Failed to verify fuel slip');
    } finally {
      setVerifying(false);
    }
  };

  const handleVerifyCancel = () => {
    setVerifyDialogOpen(false);
    setVerifyId(null);
  };

  // Handle refresh
  const handleRefresh = async () => {
    await fetchSlips();
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <Box textAlign="center">
          <CircularProgress size={40} />
          <Typography variant="body1" mt={1} sx={{ fontSize: '0.9rem' }}>
            Loading fuel slips...
          </Typography>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box m={2}>
        <Alert severity="error" sx={{ mb: 2, fontSize: '0.8rem' }}>
          {error}
        </Alert>
        <Button
          variant="contained"
          size="small"
          onClick={handleRefresh}
          sx={{ fontSize: '0.8rem' }}
        >
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 1, sm: 1.5, md: 2 } }}>
      {/* Header - Compact */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1}>
        <Box>
          <Typography variant="h6" fontWeight="600" sx={{ fontSize: '1rem' }}>
            <LocalGasStation sx={{ verticalAlign: 'middle', mr: 0.5, fontSize: '1.2rem' }} />
            Fuel Slips
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
            Manage fuel transactions in ZAR
          </Typography>
        </Box>
        <Stack direction="row" spacing={0.75}>
          <Tooltip title="Refresh">
            <IconButton size="small" onClick={handleRefresh} sx={{ p: 0.5 }}>
              <RefreshIcon sx={{ fontSize: '0.9rem' }} />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<AddIcon sx={{ fontSize: '0.9rem' }} />}
            onClick={() => navigate('/fuel/slips/add')}
            size="small"
            sx={{ fontSize: '0.75rem', py: 0.5 }}
          >
            New Slip
          </Button>
        </Stack>
      </Box>

      {/* Summary Cards - New Stats */}
      {summary && (
        <>
          {/* Row 1: Main Stats */}
          <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
            <Grid item xs={6} sm={3}>
              <StatCard
                title="Total Cost"
                value={formatCurrency(summary.totalAmount)}
                icon={AttachMoney}
                color="primary"
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <StatCard
                title="Total Fuel"
                value={`${formatNumber(summary.totalQuantity)} L`}
                icon={LocalGasStation}
                color="secondary"
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <StatCard
                title="Avg Price"
                value={`${formatCurrency(summary.averagePrice)}/L`}
                icon={TrendingUp}
                color="success"
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <StatCard
                title="Total Slips"
                value={summary.slipCount}
                icon={Receipt}
                color="info"
              />
            </Grid>
          </Grid>

          {/* Row 2: Fuel with Trip vs Without Trip */}
          <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
            <Grid item xs={12} sm={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', fontWeight: 600 }}>
                    <DirectionsCar sx={{ fontSize: '0.8rem', verticalAlign: 'middle', mr: 0.5 }} />
                    Fuel with Trip
                  </Typography>
                  <Stack direction="row" spacing={2} sx={{ mt: 0.5 }}>
                    <Box>
                      <Typography variant="h6" sx={{ fontSize: '0.9rem', fontWeight: 600 }}>
                        {summary.withTripCount} slips
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
                        {formatNumber(summary.withTripQuantity)} L
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="h6" sx={{ fontSize: '0.9rem', fontWeight: 600, color: 'primary.main' }}>
                        {formatCurrency(summary.withTripAmount)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
                        Avg: {formatCurrency(summary.withTripAvg)}/L
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', fontWeight: 600 }}>
                    <Cancel sx={{ fontSize: '0.8rem', verticalAlign: 'middle', mr: 0.5 }} />
                    Fuel without Trip
                  </Typography>
                  <Stack direction="row" spacing={2} sx={{ mt: 0.5 }}>
                    <Box>
                      <Typography variant="h6" sx={{ fontSize: '0.9rem', fontWeight: 600 }}>
                        {summary.withoutTripCount} slips
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
                        {formatNumber(summary.withoutTripQuantity)} L
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="h6" sx={{ fontSize: '0.9rem', fontWeight: 600, color: 'warning.main' }}>
                        {formatCurrency(summary.withoutTripAmount)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
                        Avg: {formatCurrency(summary.withoutTripAvg)}/L
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Row 3: Status Breakdown */}
          <Grid container spacing={1.5} sx={{ mb: 2 }}>
            <Grid item xs={12}>
              <Card>
                <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', fontWeight: 600, mb: 1, display: 'block' }}>
                    <CheckCircle sx={{ fontSize: '0.8rem', verticalAlign: 'middle', mr: 0.5 }} />
                    Status Breakdown
                  </Typography>
                  <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
                    {Object.entries(summary.statusCounts).map(([status, count]) => (
                      <Chip
                        key={status}
                        label={`${status}: ${count}`}
                        size="small"
                        color={
                          status === 'VERIFIED' ? 'success' :
                          status === 'PENDING' ? 'warning' :
                          status === 'REJECTED' ? 'error' :
                          'default'
                        }
                        sx={{ height: 22, fontSize: '0.6rem' }}
                      />
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      )}

      {/* Filters - Compact */}
      <Paper sx={{ p: 1.5, mb: 2 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <FilterList sx={{ fontSize: '0.9rem', color: 'action.active' }} />
            <Typography variant="caption" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
              Filters
            </Typography>
          </Stack>
          {(driverFilter || vehicleFilter || statusFilter !== 'all') && (
            <Button
              size="small"
              startIcon={<Clear sx={{ fontSize: '0.8rem' }} />}
              onClick={handleClearFilters}
              sx={{ fontSize: '0.65rem' }}
            >
              Clear
            </Button>
          )}
        </Stack>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 160 } }}>
            <InputLabel sx={{ fontSize: '0.75rem' }}>
              <Person sx={{ fontSize: '0.8rem', mr: 0.5 }} />
              Driver
            </InputLabel>
            <Select
              value={driverFilter}
              onChange={(e) => setDriverFilter(e.target.value)}
              label="Driver"
              sx={{ fontSize: '0.75rem' }}
            >
              <MenuItem value="" sx={{ fontSize: '0.75rem' }}>All Drivers</MenuItem>
              {drivers.map(driver => (
                <MenuItem key={driver.id} value={driver.id} sx={{ fontSize: '0.75rem' }}>
                  {driver.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 160 } }}>
            <InputLabel sx={{ fontSize: '0.75rem' }}>
              <DirectionsCar sx={{ fontSize: '0.8rem', mr: 0.5 }} />
              Vehicle
            </InputLabel>
            <Select
              value={vehicleFilter}
              onChange={(e) => setVehicleFilter(e.target.value)}
              label="Vehicle"
              sx={{ fontSize: '0.75rem' }}
            >
              <MenuItem value="" sx={{ fontSize: '0.75rem' }}>All Vehicles</MenuItem>
              {vehicles.map(vehicle => (
                <MenuItem key={vehicle.id} value={vehicle.id} sx={{ fontSize: '0.75rem' }}>
                  {vehicle.regNumber}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 140 } }}>
            <InputLabel sx={{ fontSize: '0.75rem' }}>
              <CheckCircle sx={{ fontSize: '0.8rem', mr: 0.5 }} />
              Status
            </InputLabel>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              label="Status"
              sx={{ fontSize: '0.75rem' }}
            >
              <MenuItem value="all" sx={{ fontSize: '0.75rem' }}>All Status</MenuItem>
              {statuses.map(status => (
                <MenuItem key={status} value={status} sx={{ fontSize: '0.75rem' }}>
                  {status}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      </Paper>

      {/* Results count - Compact */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
          {filteredSlips.length} slip{filteredSlips.length !== 1 ? 's' : ''}
          {summary && ` • ${formatCurrency(summary.totalAmount)}`}
        </Typography>
        <Button
          size="small"
          startIcon={<Clear sx={{ fontSize: '0.8rem' }} />}
          onClick={handleClearFilters}
          disabled={!driverFilter && !vehicleFilter && statusFilter === 'all'}
          sx={{ fontSize: '0.65rem' }}
        >
          Clear Filters
        </Button>
      </Box>

      {/* Table - Compact with Status and Verify Button */}
      <TableContainer component={Paper} sx={{ borderRadius: 1, mb: 2 }}>
        <Table size="small">
          <TableHead sx={{ bgcolor: 'action.hover' }}>
            <TableRow>
              <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600, py: 1 }}>
                <Event sx={{ fontSize: '0.8rem', mr: 0.5 }} />Date
              </TableCell>
              <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600, py: 1 }}>
                <Person sx={{ fontSize: '0.8rem', mr: 0.5 }} />Driver
              </TableCell>
              <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600, py: 1 }}>
                <DirectionsCar sx={{ fontSize: '0.8rem', mr: 0.5 }} />Vehicle
              </TableCell>
              <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600, py: 1 }}>
                <LocalGasStation sx={{ fontSize: '0.8rem', mr: 0.5 }} />Fuel
              </TableCell>
              <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600, py: 1 }}>
                <AttachMoney sx={{ fontSize: '0.8rem', mr: 0.5 }} />Amount (ZAR)
              </TableCell>
              <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600, py: 1 }}>Station</TableCell>
              <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600, py: 1 }}>
                <CheckCircle sx={{ fontSize: '0.8rem', mr: 0.5 }} />Status
              </TableCell>
              <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600, py: 1 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredSlips.map(slip => (
              <TableRow
                key={slip.id}
                hover
                sx={{
                  '&:last-child td, &:last-child th': { border: 0 },
                  bgcolor: slip.status === 'VERIFIED' ? 'action.hover' : 'transparent'
                }}
              >
                <TableCell sx={{ fontSize: '0.7rem', py: 0.75 }}>
                  <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>
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
                <TableCell sx={{ fontSize: '0.7rem', py: 0.75 }}>
                  <Box>
                    <Typography variant="body2" fontWeight="500" sx={{ fontSize: '0.7rem' }}>
                      {slip.driverName || '-'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.55rem' }}>
                      ID: {slip.driverId || 'N/A'}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell sx={{ fontSize: '0.7rem', py: 0.75 }}>
                  <Box>
                    <Typography variant="body2" fontWeight="500" sx={{ fontSize: '0.7rem' }}>
                      {slip.vehicleRegNumber || '-'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.55rem' }}>
                      ID: {slip.vehicleId || 'N/A'}
                    </Typography>
                    {slip.tripId && (
                      <Chip
                        label={`Trip #${slip.tripId}`}
                        size="small"
                        color="info"
                        variant="outlined"
                        sx={{ height: 14, fontSize: '0.45rem', mt: 0.25 }}
                      />
                    )}
                  </Box>
                </TableCell>
                <TableCell sx={{ fontSize: '0.7rem', py: 0.75 }}>
                  <Box>
                    <Typography variant="body2" fontWeight="500" sx={{ fontSize: '0.7rem' }}>
                      {slip.quantity ? `${formatNumber(slip.quantity)} L` : '-'}
                    </Typography>
                    {slip.unitPrice && (
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.55rem' }}>
                        @ {formatCurrency(slip.unitPrice)}/L
                      </Typography>
                    )}
                  </Box>
                </TableCell>
                <TableCell sx={{ fontSize: '0.7rem', py: 0.75 }}>
                  <Box>
                    <Typography variant="body2" fontWeight="500" color="primary" sx={{ fontSize: '0.7rem' }}>
                      {formatCurrency(slip.totalAmount)}
                    </Typography>
                    {slip.quantity && slip.totalAmount && (
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.55rem' }}>
                        {formatCurrency(parseFloat(slip.totalAmount) / parseFloat(slip.quantity))}/L
                      </Typography>
                    )}
                  </Box>
                </TableCell>
                <TableCell sx={{ fontSize: '0.7rem', py: 0.75 }}>
                  <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>
                    {slip.stationName || slip.location || '-'}
                  </Typography>
                  {slip.location && slip.stationName && (
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.55rem' }}>
                      {slip.location}
                    </Typography>
                  )}
                </TableCell>
                <TableCell sx={{ fontSize: '0.7rem', py: 0.75 }}>
                  <StatusChip status={slip.status || 'PENDING'} />
                </TableCell>
                <TableCell sx={{ fontSize: '0.7rem', py: 0.75 }}>
                  <Stack direction="row" spacing={0.5}>
                    <Tooltip title="View Details">
                      <IconButton
                        size="small"
                        onClick={() => handleViewSlip(slip.id)}
                        color="primary"
                        sx={{ p: 0.5 }}
                      >
                        <Visibility sx={{ fontSize: '0.9rem' }} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        onClick={() => handleEditSlip(slip.id)}
                        color="info"
                        sx={{ p: 0.5 }}
                      >
                        <EditIcon sx={{ fontSize: '0.9rem' }} />
                      </IconButton>
                    </Tooltip>
                    {(slip.status || 'PENDING') !== 'VERIFIED' && (
                      <Tooltip title="Verify">
                        <IconButton
                          size="small"
                          onClick={() => handleVerifyClick(slip.id)}
                          color="success"
                          sx={{ p: 0.5 }}
                        >
                          <VerifiedIcon sx={{ fontSize: '0.9rem' }} />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteClick(slip.id)}
                        color="error"
                        sx={{ p: 0.5 }}
                      >
                        <DeleteIcon sx={{ fontSize: '0.9rem' }} />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontSize: '1rem' }}>
          <DeleteIcon sx={{ verticalAlign: 'middle', mr: 1, color: 'error.main' }} />
          Delete Fuel Slip
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: '0.9rem' }}>
            Are you sure you want to delete this fuel slip? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleDeleteCancel} size="small" sx={{ fontSize: '0.8rem' }}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            variant="contained"
            color="error"
            disabled={deleting}
            size="small"
            sx={{ fontSize: '0.8rem' }}
          >
            {deleting ? <CircularProgress size={18} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Verify Confirmation Dialog */}
      <Dialog
        open={verifyDialogOpen}
        onClose={handleVerifyCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontSize: '1rem' }}>
          <VerifiedIcon sx={{ verticalAlign: 'middle', mr: 1, color: 'success.main' }} />
          Verify Fuel Slip
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: '0.9rem' }}>
            Are you sure you want to verify this fuel slip? This will mark it as verified and cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleVerifyCancel} size="small" sx={{ fontSize: '0.8rem' }}>
            Cancel
          </Button>
          <Button
            onClick={handleVerifyConfirm}
            variant="contained"
            color="success"
            disabled={verifying}
            size="small"
            sx={{ fontSize: '0.8rem' }}
          >
            {verifying ? <CircularProgress size={18} /> : 'Verify'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Footer summary - Compact */}
      {summary && (
        <Paper sx={{ p: 1.5, bgcolor: 'primary.light', color: 'primary.contrastText', borderRadius: 1 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={1}>
            <Box>
              <Typography variant="subtitle2" sx={{ fontSize: '0.8rem', fontWeight: 600 }}>
                Summary Totals
              </Typography>
              <Typography variant="caption" sx={{ fontSize: '0.65rem', opacity: 0.9 }}>
                {summary.slipCount} slips • {formatNumber(summary.totalQuantity)} litres
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ fontSize: '0.6rem', opacity: 0.9, display: 'block' }}>
                With Trip: {summary.withTripCount} slips • {formatCurrency(summary.withTripAmount)}
              </Typography>
              <Typography variant="caption" sx={{ fontSize: '0.6rem', opacity: 0.9, display: 'block' }}>
                Without Trip: {summary.withoutTripCount} slips • {formatCurrency(summary.withoutTripAmount)}
              </Typography>
            </Box>
            <Box textAlign={{ xs: 'left', sm: 'right' }}>
              <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 700 }}>
                {formatCurrency(summary.totalAmount)}
              </Typography>
              <Typography variant="caption" sx={{ fontSize: '0.6rem', opacity: 0.9 }}>
                Avg: {formatCurrency(summary.averagePrice)}/L
              </Typography>
            </Box>
          </Stack>
        </Paper>
      )}
    </Box>
  );
}

export default FuelSlips;
