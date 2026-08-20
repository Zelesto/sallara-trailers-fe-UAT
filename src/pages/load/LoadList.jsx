// src/pages/load/LoadList.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment,
  Stack,
  Grid,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Avatar,
  Collapse,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  Add as AddIcon,
  Merge as MergeIcon,
  LocalShipping,
  Person,
  CalendarToday,
  LocationOn,
  Route,
  CheckCircle,
  Pending,
  Warning,
  Cancel,
  Business,
  Schedule,
  TrendingUp,
  AttachMoney,
  ExpandMore,
  ExpandLess,
  Speed,
  Home,
  Map,
  Business as BusinessIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { loadService } from '../../services/loadService';
import { customerService } from '../../services/customerService';
import { tripService } from '../../services/tripService';

// ============================================================
// UTILITY FUNCTIONS (matching Dashboard)
// ============================================================

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

const formatDate = (date) => {
  if (!date) return 'N/A';
  try {
    return new Date(date).toLocaleDateString('en-ZA', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return 'N/A';
  }
};

// ============================================================
// STAT CARD (matching Dashboard)
// ============================================================

const StatCard = React.memo(({
  title,
  value,
  icon: Icon,
  color = 'primary',
  subtitle,
  loading = false,
}) => {
  const iconColor = getColor(color);
  const bgColor = getColorBg(color);
  const SafeIcon = Icon || LocalShipping;

  return (
    <Card
      sx={{
        bgcolor: '#FFFFFF',
        borderRadius: { xs: '12px', sm: '14px', md: '16px' },
        border: '1px solid #ECECEC',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        height: '100%',
        width: '100%',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          borderColor: iconColor,
        },
      }}
    >
      <CardContent sx={{ p: { xs: 1.5, sm: 2, md: 2.5 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="caption"
              sx={{
                color: '#6B7280',
                fontWeight: 600,
                textTransform: 'uppercase',
                fontSize: { xs: '0.55rem', sm: '0.6rem', md: '0.65rem' },
                letterSpacing: '0.5px',
                display: 'block',
                mb: 0.25,
              }}
            >
              {title}
            </Typography>
            
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                color: '#111827',
                fontSize: { xs: '1.2rem', sm: '1.4rem', md: '1.6rem', lg: '1.8rem' },
                lineHeight: 1.2,
              }}
            >
              {value || 0}
            </Typography>
            
            {subtitle && (
              <Typography
                variant="caption"
                sx={{
                  color: '#6B7280',
                  display: 'block',
                  mt: 0.25,
                  fontSize: { xs: '0.55rem', sm: '0.6rem', md: '0.65rem' },
                }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>

          <Box
            sx={{
              bgcolor: bgColor,
              borderRadius: { xs: '10px', sm: '12px', md: '14px' },
              p: { xs: 1, sm: 1.25, md: 1.5 },
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'scale(1.05)',
              },
            }}
          >
            <SafeIcon sx={{ 
              color: iconColor, 
              fontSize: { xs: '1.2rem', sm: '1.4rem', md: '1.6rem', lg: '1.8rem' },
            }} />
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
});

// ============================================================
// STATUS CHIP (matching TripList)
// ============================================================

const StatusChip = ({ status }) => {
  const configs = {
    PENDING: { color: '#F59E0B', bgColor: '#FEF3C7', label: 'Pending', icon: <Pending sx={{ fontSize: '0.6rem' }} /> },
    IN_PROGRESS: { color: '#3B82F6', bgColor: '#DBEAFE', label: 'In Progress', icon: <Warning sx={{ fontSize: '0.6rem' }} /> },
    COMPLETED: { color: '#22C55E', bgColor: '#D1FAE5', label: 'Completed', icon: <CheckCircle sx={{ fontSize: '0.6rem' }} /> },
    CANCELLED: { color: '#EF4444', bgColor: '#FEE2E2', label: 'Cancelled', icon: <Cancel sx={{ fontSize: '0.6rem' }} /> },
  };
  const config = configs[status] || { color: '#6B7280', bgColor: '#F3F4F6', label: status || 'Unknown', icon: null };
  
  return (
    <Chip
      label={config.label}
      size="small"
      icon={config.icon}
      sx={{
        backgroundColor: config.bgColor,
        color: config.color,
        fontWeight: 600,
        fontSize: { xs: '0.5rem', sm: '0.6rem' },
        height: { xs: 18, sm: 22 },
        border: `1px solid ${config.color}20`,
        '& .MuiChip-label': { px: { xs: 0.75, sm: 1 }, py: 0.25 },
        '& .MuiChip-icon': { fontSize: { xs: '0.6rem', sm: '0.7rem' }, ml: 0.5 }
      }}
    />
  );
};

// ============================================================
// DISTANCE CHIP (shows pickup distance)
// ============================================================

const DistanceChip = ({ distance, isZero }) => {
  if (isZero) {
    return (
      <Chip
        size="small"
        label="Last Drop-off"
        sx={{
          fontSize: { xs: '0.45rem', sm: '0.55rem' },
          height: { xs: 16, sm: 20 },
          bgcolor: '#EDE9FE',
          color: '#5B21B6',
          fontWeight: 500,
        }}
      />
    );
  }
  
  if (!distance || distance === 0) {
    return <Typography sx={{ fontSize: '0.6rem', color: '#6B7280' }}>-</Typography>;
  }
  
  return (
    <Tooltip title={`${distance} km from depot to pickup`} arrow>
      <Chip
        size="small"
        label={`${distance} km`}
        sx={{
          fontSize: { xs: '0.45rem', sm: '0.55rem' },
          height: { xs: 16, sm: 20 },
          bgcolor: '#D1FAE5',
          color: '#065F46',
          fontWeight: 500,
        }}
      />
    </Tooltip>
  );
};

// ============================================================
// TRIP EXPANDABLE ROW (shows detailed trip info)
// ============================================================

const TripExpandableRow = ({ load, loadIndex }) => {
  const [expanded, setExpanded] = useState(false);
  
  if (!load.trips || load.trips.length === 0) {
    return null;
  }

  return (
    <>
      <TableRow>
        <TableCell colSpan={9} sx={{ py: 0.5 }}>
          <Button
            size="small"
            startIcon={expanded ? <ExpandLess /> : <ExpandMore />}
            onClick={() => setExpanded(!expanded)}
            sx={{ fontSize: '0.65rem', color: '#6B7280' }}
          >
            {expanded ? 'Hide' : 'Show'} {load.trips.length} Trips
          </Button>
        </TableCell>
      </TableRow>
      {expanded && (
        <TableRow>
          <TableCell colSpan={9} sx={{ py: 0.5, bgcolor: '#F9FAFB' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontSize: '0.55rem', fontWeight: 600, color: '#6B7280' }}>Trip #</TableCell>
                  <TableCell sx={{ fontSize: '0.55rem', fontWeight: 600, color: '#6B7280' }}>Status</TableCell>
                  <TableCell sx={{ fontSize: '0.55rem', fontWeight: 600, color: '#6B7280' }}>Origin</TableCell>
                  <TableCell sx={{ fontSize: '0.55rem', fontWeight: 600, color: '#6B7280' }}>Destination</TableCell>
                  <TableCell sx={{ fontSize: '0.55rem', fontWeight: 600, color: '#6B7280' }}>Pickup Distance</TableCell>
                  <TableCell sx={{ fontSize: '0.55rem', fontWeight: 600, color: '#6B7280' }}>Route Distance</TableCell>
                  <TableCell sx={{ fontSize: '0.55rem', fontWeight: 600, color: '#6B7280' }}>Total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {load.trips.map((trip, index) => {
                  const totalDistance = (trip.pickupDistance || 0) + (trip.routeDistance || trip.totalDistance || 0);
                  const isFromLastDropOff = trip.pickupFromLastDropOff || false;
                  
                  return (
                    <TableRow key={trip.id || index}>
                      <TableCell sx={{ fontSize: '0.6rem' }}>{trip.tripNumber || `Trip ${index + 1}`}</TableCell>
                      <TableCell><StatusChip status={trip.status} /></TableCell>
                      <TableCell sx={{ fontSize: '0.6rem' }}>
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          <LocationOn sx={{ fontSize: '0.6rem', color: '#6B7280' }} />
                          {trip.originLocation || trip.originCity || 'N/A'}
                        </Stack>
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.6rem' }}>
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          <LocationOn sx={{ fontSize: '0.6rem', color: '#6B7280' }} />
                          {trip.destinationLocation || trip.destinationCity || 'N/A'}
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <DistanceChip 
                          distance={trip.pickupDistance} 
                          isZero={isFromLastDropOff} 
                        />
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.6rem' }}>
                        {trip.routeDistance || trip.totalDistance || 0} km
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.6rem', fontWeight: 600, color: '#4F46E5' }}>
                        {totalDistance} km
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableCell>
        </TableRow>
      )}
    </>
  );
};

// ============================================================
// MAIN COMPONENT: LoadList
// ============================================================

const LoadList = () => {
  const navigate = useNavigate();
  const [loads, setLoads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [showMergeDialog, setShowMergeDialog] = useState(false);
  const [mergeData, setMergeData] = useState({
    customerId: '',
    plannedDate: new Date().toISOString().slice(0, 10),
  });
  const [mergeResult, setMergeResult] = useState(null);
  const [mergeLoading, setMergeLoading] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    cancelled: 0,
  });

  useEffect(() => {
    loadLoads();
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const response = await customerService.getActiveCustomers();
      setCustomers(response || []);
    } catch (err) {
      console.error('Error loading customers:', err);
    }
  };

  const loadLoads = async () => {
    setLoading(true);
    try {
      const response = await loadService.getAllLoads();
      const loadsData = response?.content || response || [];
      
      // Enrich each load with trip distance calculations
      const enrichedLoads = await Promise.all(loadsData.map(async (load) => {
        if (load.trips && load.trips.length > 0) {
          // Fetch detailed trip data if needed
          const enrichedTrips = await Promise.all(load.trips.map(async (trip) => {
            // If trip has pickup distance already calculated, use it
            if (trip.pickupDistance !== undefined) {
              return trip;
            }
            
            // Otherwise, fetch trip details
            try {
              const tripDetails = await tripService.getTripById(trip.id);
              return {
                ...trip,
                pickupDistance: tripDetails.pickupDistance || 0,
                routeDistance: tripDetails.totalDistance || trip.totalDistance || 0,
                pickupFromLastDropOff: tripDetails.pickupFromLastDropOff || false,
                originLocation: tripDetails.originLocation || trip.originLocation,
                destinationLocation: tripDetails.destinationLocation || trip.destinationLocation,
              };
            } catch {
              return trip;
            }
          }));
          
          return {
            ...load,
            trips: enrichedTrips,
          };
        }
        return load;
      }));
      
      setLoads(enrichedLoads);
      calculateStats(enrichedLoads);
    } catch (err) {
      console.error('Error loading loads:', err);
      setError('Failed to load loads');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data) => {
    const pending = data.filter(l => l.status === 'PENDING').length;
    const inProgress = data.filter(l => l.status === 'IN_PROGRESS').length;
    const completed = data.filter(l => l.status === 'COMPLETED').length;
    const cancelled = data.filter(l => l.status === 'CANCELLED').length;
    setStats({
      total: data.length,
      pending,
      inProgress,
      completed,
      cancelled,
    });
  };

  const handleSmartMerge = async () => {
    if (!mergeData.customerId || !mergeData.plannedDate) {
      setError('Please select a customer and date');
      return;
    }

    setMergeLoading(true);
    setError(null);
    try {
      const response = await loadService.smartMergeTrips(
        mergeData.customerId,
        mergeData.plannedDate
      );
      setMergeResult(response);
      setShowMergeDialog(false);
      loadLoads();
    } catch (err) {
      console.error('Error merging trips:', err);
      setError(err.message || 'Failed to merge trips');
    } finally {
      setMergeLoading(false);
    }
  };

  const filteredLoads = useMemo(() => {
    return loads.filter(load => {
      const searchMatch = 
        (load.loadNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (load.customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (load.description || '').toLowerCase().includes(searchTerm.toLowerCase());
      const statusMatch = filterStatus === 'ALL' || load.status === filterStatus;
      return searchMatch && statusMatch;
    });
  }, [loads, searchTerm, filterStatus]);

  // Calculate total distances for a load
  const calculateLoadDistances = (load) => {
    if (!load.trips || load.trips.length === 0) {
      return { totalPickupDistance: 0, totalRouteDistance: 0, totalDistance: 0 };
    }
    
    let totalPickupDistance = 0;
    let totalRouteDistance = 0;
    
    load.trips.forEach(trip => {
      totalPickupDistance += trip.pickupDistance || 0;
      totalRouteDistance += trip.routeDistance || trip.totalDistance || 0;
    });
    
    return {
      totalPickupDistance,
      totalRouteDistance,
      totalDistance: totalPickupDistance + totalRouteDistance,
    };
  };

  return (
    <Box sx={{ 
      bgcolor: '#F7F7FC', 
      minHeight: '100vh',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      p: { xs: 1.5, sm: 2, md: 2.5, lg: 3 },
      width: '100%',
      overflowX: 'hidden' 
    }}>
      <Box sx={{ 
        maxWidth: '1600px', 
        margin: '0 auto',
        flex: 1,
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}>
        
        {/* Header - matching Dashboard */}
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
              Load Management
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
              Manage and track all loads • {stats.total} total loads
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<MergeIcon sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' } }} />}
              onClick={() => setShowMergeDialog(true)}
              size="small"
              sx={{
                borderRadius: '10px',
                fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.8rem' },
                textTransform: 'none',
                py: { xs: 0.5, sm: 0.75 },
                px: { xs: 1.5, sm: 2 },
              }}
            >
              Smart Merge
            </Button>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' } }} />}
              onClick={loadLoads}
              size="small"
              sx={{
                borderRadius: '10px',
                fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.8rem' },
                textTransform: 'none',
                py: { xs: 0.5, sm: 0.75 },
                px: { xs: 1.5, sm: 2 },
              }}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' } }} />}
              onClick={() => navigate('/loads/new')}
              size="small"
              sx={{
                borderRadius: '10px',
                fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.8rem' },
                textTransform: 'none',
                py: { xs: 0.5, sm: 0.75 },
                px: { xs: 1.5, sm: 2 },
                background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #4338CA 0%, #4F46E5 100%)',
                },
              }}
            >
              New Load
            </Button>
          </Stack>
        </Stack>

        {/* Error Alert */}
        {error && (
          <Alert 
            severity="error" 
            sx={{ mb: 2, borderRadius: '12px', fontSize: '0.75rem' }} 
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        )}

        {/* Stats Cards - matching Dashboard */}
        <Grid 
          container 
          spacing={{ xs: 1.5, sm: 2, md: 2.5, lg: 3 }}
          sx={{ 
            mb: { xs: 2, sm: 2.5, md: 3 },
            width: '100%',
            margin: 0,
          }}
        >
          <Grid size={{ xs: 6, sm: 2.4 }} sx={{ display: 'flex' }}>
            <StatCard
              title="Total Loads"
              value={stats.total}
              icon={LocalShipping}
              color="primary"
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 2.4 }} sx={{ display: 'flex' }}>
            <StatCard
              title="Pending"
              value={stats.pending}
              icon={Pending}
              color="warning"
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 2.4 }} sx={{ display: 'flex' }}>
            <StatCard
              title="In Progress"
              value={stats.inProgress}
              icon={Warning}
              color="info"
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 2.4 }} sx={{ display: 'flex' }}>
            <StatCard
              title="Completed"
              value={stats.completed}
              icon={CheckCircle}
              color="success"
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 2.4 }} sx={{ display: 'flex' }}>
            <StatCard
              title="Cancelled"
              value={stats.cancelled}
              icon={Cancel}
              color="error"
            />
          </Grid>
        </Grid>

        {/* Filters - matching Dashboard */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 1.5, sm: 2 },
            mb: { xs: 2, sm: 2.5, md: 3 },
            borderRadius: { xs: '12px', sm: '16px' },
            border: '1px solid #ECECEC',
            bgcolor: '#FFFFFF',
            width: '100%',
          }}
        >
          <Stack 
            direction={{ xs: 'column', sm: 'row' }} 
            spacing={{ xs: 1, sm: 1.5 }}
            alignItems={{ xs: 'stretch', sm: 'center' }}
            flexWrap="wrap"
            useFlexGap
          >
            <TextField
              size="small"
              placeholder="Search loads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ 
                flex: 1,
                minWidth: { xs: '100%', sm: 200 },
                '& .MuiInputLabel-root': { fontSize: { xs: '0.65rem', sm: '0.75rem' } },
                '& .MuiInputBase-root': { fontSize: { xs: '0.7rem', sm: '0.75rem' }, borderRadius: '10px' },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' } }} />
                  </InputAdornment>
                ),
              }}
            />
            
            <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 130 } }}>
              <InputLabel sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>Status</InputLabel>
              <Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                label="Status"
                sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' }, borderRadius: '10px' }}
              >
                <MenuItem value="ALL" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>All Status</MenuItem>
                <MenuItem value="PENDING" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>Pending</MenuItem>
                <MenuItem value="IN_PROGRESS" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>In Progress</MenuItem>
                <MenuItem value="COMPLETED" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>Completed</MenuItem>
                <MenuItem value="CANCELLED" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>Cancelled</MenuItem>
              </Select>
            </FormControl>

            <Button 
              onClick={() => {
                setSearchTerm('');
                setFilterStatus('ALL');
              }}
              disabled={!searchTerm && filterStatus === 'ALL'}
              variant="outlined"
              size="small"
              startIcon={<ClearIcon sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' } }} />}
              sx={{
                borderRadius: '10px',
                fontSize: { xs: '0.7rem', sm: '0.75rem' },
                textTransform: 'none',
                py: { xs: 0.5, sm: 0.75 },
                px: { xs: 1, sm: 1.5 },
              }}
            >
              Clear
            </Button>
          </Stack>
        </Paper>

        {/* Loads Table - matching TripList */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: { xs: '12px', sm: '16px' },
            border: '1px solid #ECECEC',
            bgcolor: '#FFFFFF',
            width: '100%',
            overflow: 'hidden',
          }}
        >
          <TableContainer>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#F9FAFB' }}>
                <TableRow>
                  <TableCell sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' }, fontWeight: 600, color: '#6B7280', py: 1.5 }}>
                    Load #
                  </TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' }, fontWeight: 600, color: '#6B7280', py: 1.5 }}>
                    Customer
                  </TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' }, fontWeight: 600, color: '#6B7280', py: 1.5 }}>
                    Status
                  </TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' }, fontWeight: 600, color: '#6B7280', py: 1.5 }}>
                    Trips
                  </TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' }, fontWeight: 600, color: '#6B7280', py: 1.5 }}>
                    Pickup Distance
                  </TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' }, fontWeight: 600, color: '#6B7280', py: 1.5 }}>
                    Route Distance
                  </TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' }, fontWeight: 600, color: '#6B7280', py: 1.5 }}>
                    Total Distance
                  </TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' }, fontWeight: 600, color: '#6B7280', py: 1.5 }}>
                    Date
                  </TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' }, fontWeight: 600, color: '#6B7280', py: 1.5 }}>
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                      <CircularProgress size={30} />
                    </TableCell>
                  </TableRow>
                ) : filteredLoads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                      <Box sx={{ textAlign: 'center' }}>
                        <LocalShipping sx={{ fontSize: 48, color: '#D1D5DB', mb: 2 }} />
                        <Typography variant="body1" color="text.secondary" sx={{ fontSize: '0.9rem' }}>
                          {searchTerm || filterStatus !== 'ALL' ? 'No loads match your filters' : 'No loads found'}
                        </Typography>
                        {(searchTerm || filterStatus !== 'ALL') && (
                          <Button 
                            onClick={() => {
                              setSearchTerm('');
                              setFilterStatus('ALL');
                            }} 
                            sx={{ mt: 1, fontSize: '0.7rem' }} 
                            size="small"
                          >
                            Clear Filters
                          </Button>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLoads.map((load) => {
                    const distances = calculateLoadDistances(load);
                    const totalPickupDistance = distances.totalPickupDistance;
                    const totalRouteDistance = distances.totalRouteDistance;
                    const totalDistance = distances.totalDistance;
                    
                    return (
                      <React.Fragment key={load.id}>
                        <TableRow hover sx={{ '&:hover': { bgcolor: '#F9FAFB' } }}>
                          <TableCell sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' }, py: 1 }}>
                            <Typography fontWeight="600" sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' }, color: '#4F46E5' }}>
                              {load.loadNumber}
                            </Typography>
                            {load.description && (
                              <Typography variant="caption" sx={{ fontSize: { xs: '0.5rem', sm: '0.55rem' }, color: '#6B7280', display: 'block' }}>
                                {load.description.length > 30 ? load.description.substring(0, 30) + '...' : load.description}
                              </Typography>
                            )}
                          </TableCell>

                          <TableCell sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' }, py: 1 }}>
                            <Stack direction="row" alignItems="center" spacing={0.5}>
                              <BusinessIcon sx={{ fontSize: '0.7rem', color: '#6B7280' }} />
                              <Typography sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' } }}>
                                {load.customerName || 'N/A'}
                              </Typography>
                            </Stack>
                          </TableCell>

                          <TableCell sx={{ py: 0.5 }}>
                            <StatusChip status={load.status} />
                          </TableCell>

                          <TableCell sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' }, py: 0.5 }}>
                            <Chip
                              label={load.trips?.length || 0}
                              size="small"
                              color="primary"
                              variant="outlined"
                              sx={{ 
                                height: { xs: 16, sm: 20 }, 
                                fontSize: { xs: '0.5rem', sm: '0.6rem' },
                                fontWeight: 600,
                              }}
                            />
                          </TableCell>

                          <TableCell sx={{ py: 0.5 }}>
                            {totalPickupDistance > 0 ? (
                              <Chip
                                size="small"
                                label={`${totalPickupDistance} km`}
                                sx={{
                                  fontSize: { xs: '0.45rem', sm: '0.55rem' },
                                  height: { xs: 16, sm: 20 },
                                  bgcolor: '#DBEAFE',
                                  color: '#1E40AF',
                                  fontWeight: 500,
                                }}
                              />
                            ) : (
                              <Typography sx={{ fontSize: '0.6rem', color: '#6B7280' }}>-</Typography>
                            )}
                          </TableCell>

                          <TableCell sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' }, py: 0.5 }}>
                            {totalRouteDistance > 0 ? (
                              <Chip
                                size="small"
                                label={`${totalRouteDistance} km`}
                                sx={{
                                  fontSize: { xs: '0.45rem', sm: '0.55rem' },
                                  height: { xs: 16, sm: 20 },
                                  bgcolor: '#FEF3C7',
                                  color: '#92400E',
                                  fontWeight: 500,
                                }}
                              />
                            ) : (
                              <Typography sx={{ fontSize: '0.6rem', color: '#6B7280' }}>-</Typography>
                            )}
                          </TableCell>

                          <TableCell sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' }, py: 0.5 }}>
                            <Chip
                              size="small"
                              label={`${totalDistance} km`}
                              sx={{
                                fontSize: { xs: '0.5rem', sm: '0.6rem' },
                                height: { xs: 16, sm: 20 },
                                bgcolor: '#D1FAE5',
                                color: '#065F46',
                                fontWeight: 600,
                              }}
                            />
                          </TableCell>

                          <TableCell sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' }, py: 0.5 }}>
                            {load.loadingDate ? formatDate(load.loadingDate) : 'N/A'}
                          </TableCell>

                          <TableCell sx={{ py: 0.5 }}>
                            <Stack direction="row" spacing={0.25}>
                              <Tooltip title="View Details">
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => navigate(`/loads/${load.loadNumber}`)}
                                  sx={{ p: { xs: 0.25, sm: 0.5 } }}
                                >
                                  <VisibilityIcon sx={{ fontSize: { xs: '0.7rem', sm: '0.9rem' } }} />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Edit Load">
                                <IconButton
                                  size="small"
                                  color="secondary"
                                  onClick={() => navigate(`/loads/${load.id}/edit`)}
                                  sx={{ p: { xs: 0.25, sm: 0.5 } }}
                                >
                                  <EditIcon sx={{ fontSize: { xs: '0.7rem', sm: '0.9rem' } }} />
                                </IconButton>
                              </Tooltip>
                              {load.trips && load.trips.length > 0 && (
                                <Tooltip title={`${load.trips.length} trips`}>
                                  <Chip
                                    size="small"
                                    label={`${load.trips.length}`}
                                    sx={{
                                      height: { xs: 16, sm: 20 },
                                      fontSize: { xs: '0.45rem', sm: '0.55rem' },
                                      bgcolor: '#EEF2FF',
                                      color: '#4F46E5',
                                      fontWeight: 500,
                                    }}
                                  />
                                </Tooltip>
                              )}
                            </Stack>
                          </TableCell>
                        </TableRow>
                        
                        {/* Expandable trips row */}
                        <TripExpandableRow load={load} />
                      </React.Fragment>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Smart Merge Dialog */}
        <Dialog
          open={showMergeDialog}
          onClose={() => setShowMergeDialog(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: { borderRadius: { xs: '12px', sm: '16px' } }
          }}
        >
          <DialogTitle sx={{ 
            py: 1.5, 
            px: 2.5, 
            borderBottom: 1, 
            borderColor: 'divider',
            bgcolor: '#F9FAFB',
          }}>
            <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
              <MergeIcon sx={{ mr: 0.5, verticalAlign: 'middle' }} />
              Smart Merge Trips
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ p: 2.5 }}>
            <Alert severity="info" sx={{ mb: 2, borderRadius: '12px', fontSize: '0.8rem' }}>
              This will find all trips for the selected customer on the specified date
              and merge them into a single load.
            </Alert>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ fontSize: '0.75rem' }}>Customer *</InputLabel>
                <Select
                  value={mergeData.customerId}
                  onChange={(e) => setMergeData({ ...mergeData, customerId: e.target.value })}
                  label="Customer *"
                  sx={{ fontSize: '0.8rem' }}
                >
                  <MenuItem value="" sx={{ fontSize: '0.8rem' }}>Select Customer</MenuItem>
                  {customers.map(customer => (
                    <MenuItem key={customer.id} value={customer.id} sx={{ fontSize: '0.8rem' }}>
                      {customer.name} ({customer.customerCode})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="Planned Date *"
                type="date"
                size="small"
                value={mergeData.plannedDate}
                onChange={(e) => setMergeData({ ...mergeData, plannedDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
                sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 2.5, py: 1.5, borderTop: 1, borderColor: 'divider' }}>
            <Button 
              onClick={() => setShowMergeDialog(false)} 
              size="small" 
              sx={{ fontSize: '0.8rem', color: '#6B7280' }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSmartMerge}
              variant="contained"
              color="primary"
              size="small"
              disabled={!mergeData.customerId || !mergeData.plannedDate || mergeLoading}
              startIcon={mergeLoading ? <CircularProgress size={16} /> : <MergeIcon sx={{ fontSize: '0.9rem' }} />}
              sx={{
                fontSize: '0.8rem',
                borderRadius: '10px',
                textTransform: 'none',
                background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #4338CA 0%, #4F46E5 100%)',
                },
              }}
            >
              {mergeLoading ? 'Merging...' : 'Merge Trips'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default LoadList;
