// src/pages/FuelSlips.jsx - Complete updated version with vehicle type fetching
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState, useMemo } from 'react';
import { fuelService } from '../services/fuelService';
import { vehicleService } from '../services/vehicleService'; // ✅ ADD THIS IMPORT
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
  useTheme,
  useMediaQuery,
  Tabs,
  Tab,
  TextField,
  InputAdornment,
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
  Search as SearchIcon,
  TrendingUp as TrendingUpIcon,
  Commute as LocalShippingIcon,
  DirectionsCar as VanIcon,
  LocalShipping as TruckIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { tripService } from '../services/tripService';
import { ResponsiveContainer } from '../components/ResponsiveContainer';


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

// Format date for display
const formatDate = (date) => {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

// Get fuel slip status
const getFuelSlipStatus = (slip) => {
  if (slip.verifiedBy) return 'VERIFIED';
  if (slip.finalized) return 'FINALIZED';
  return 'PENDING';
};

// ============================================================
// HARDCODED VEHICLE TYPE MAPPING - UPDATE THIS WITH YOUR VEHICLES
// ============================================================
const VEHICLE_TYPE_OVERRIDES = {
  1: 'TRUCK',   // Vehicle ID 1 - Update based on your actual vehicles
  2: 'VAN',     // Vehicle ID 2
  3: 'TRUCK',   // LG20LYGP - Truck
  4: 'VAN',     // Vehicle ID 4
  5: 'VAN',     // ABC123GP - Van (NISSAN NP200)
};

// ============================================================
// STAT CARD COMPONENT
// ============================================================
const StatCard = React.memo(({
  title,
  value,
  icon: Icon,
  color = 'primary',
  subtitle,
  badge,
}) => {
  const colors = {
    primary: '#4F46E5',
    success: '#22C55E',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
    purple: '#8B5CF6',
    teal: '#14B8A6',
    pink: '#EC4899',
  };

  const getColor = (c) => colors[c] || colors.primary;
  const getColorBg = (c) => {
    const bgColors = {
      primary: '#EEF2FF',
      success: '#D1FAE5',
      warning: '#FEF3C7',
      error: '#FEE2E2',
      info: '#DBEAFE',
      purple: '#EDE9FE',
      teal: '#CCFBF1',
      pink: '#FCE7F3',
    };
    return bgColors[c] || bgColors.primary;
  };

  const iconColor = getColor(color);
  const bgColor = getColorBg(color);

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 1.5, sm: 2, md: 2.5 },
        borderRadius: { xs: '12px', sm: '16px' },
        border: '1px solid #ECECEC',
        bgcolor: '#FFFFFF',
        height: '100%',
        width: '100%',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
          borderColor: iconColor,
        },
        position: 'relative',
      }}
    >
      {badge && (
        <Chip
          label={badge}
          size="small"
          color={color}
          sx={{ 
            position: 'absolute', 
            top: 8, 
            right: 8, 
            height: { xs: 16, sm: 20 }, 
            fontSize: { xs: '0.4rem', sm: '0.5rem' } 
          }}
        />
      )}
      
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
              fontSize: { 
                xs: '1.2rem', 
                sm: '1.4rem', 
                md: '1.6rem', 
                lg: '1.8rem' 
              },
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
            borderRadius: { xs: '10px', sm: '12px' },
            p: { xs: 1, sm: 1.25, md: 1.5 },
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Icon sx={{ 
            color: iconColor, 
            fontSize: { 
              xs: '1.2rem', 
              sm: '1.4rem', 
              md: '1.6rem' 
            },
          }} />
        </Box>
      </Stack>
    </Paper>
  );
});

// ============================================================
// STATUS CHIP COMPONENT
// ============================================================
const StatusChip = ({ slip }) => {
  const status = getFuelSlipStatus(slip);
  
  const getStatusConfig = (status) => {
    switch (status) {
      case 'VERIFIED':
        return { color: 'success', icon: <VerifiedIcon sx={{ fontSize: '0.7rem' }} />, label: 'Verified' };
      case 'FINALIZED':
        return { color: 'info', icon: <CheckCircle sx={{ fontSize: '0.7rem' }} />, label: 'Finalized' };
      case 'PENDING':
        return { color: 'warning', icon: <PendingIcon sx={{ fontSize: '0.7rem' }} />, label: 'Pending' };
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
      sx={{ 
        height: { xs: 16, sm: 20 }, 
        fontSize: { xs: '0.45rem', sm: '0.6rem' },
        '& .MuiChip-label': { px: { xs: 0.5, sm: 1 } },
      }}
    />
  );
};

// ============================================================
// FUEL CATEGORY CHIP
// ============================================================
const FuelCategoryChip = ({ category }) => {
  const configs = {
    TRIP: { color: 'primary', icon: <LocalShippingIcon sx={{ fontSize: '0.7rem' }} />, label: 'Trip' },
    VAN: { color: 'info', icon: <VanIcon sx={{ fontSize: '0.7rem' }} />, label: 'Van' },
    TRUCK: { color: 'warning', icon: <TruckIcon sx={{ fontSize: '0.7rem' }} />, label: 'Truck' },
    UNKNOWN: { color: 'default', icon: null, label: 'Unknown' },
  };
  
  const config = configs[category] || configs.UNKNOWN;
  return (
    <Chip
      label={config.label}
      size="small"
      color={config.color}
      icon={config.icon}
      variant="outlined"
      sx={{ 
        height: { xs: 16, sm: 18 }, 
        fontSize: { xs: '0.4rem', sm: '0.55rem' },
        '& .MuiChip-label': { px: { xs: 0.5, sm: 0.75 } },
      }}
    />
  );
};

// ============================================================
// PERIOD SELECTOR
// ============================================================
const PERIOD_OPTIONS = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'quarter', label: 'This Quarter' },
  { value: 'year', label: 'This Year' },
  { value: 'custom', label: 'Custom Range' },
];

const getDateRange = (period, customStart, customEnd) => {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);
  
  switch (period) {
    case 'today':
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'week':
      start.setDate(now.getDate() - now.getDay());
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'month':
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'quarter':
      const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
      start.setMonth(quarterMonth, 1);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'year':
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'custom':
      return { start: customStart ? new Date(customStart) : null, end: customEnd ? new Date(customEnd) : null };
    default:
      return { start: null, end: null };
  }
  
  return { start, end };
};

// ============================================================
// MAIN COMPONENT
// ============================================================
function FuelSlips() {
  const params = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [slips, setSlips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [driverFilter, setDriverFilter] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [period, setPeriod] = useState('month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  
  const [tripNumbers, setTripNumbers] = useState({});
  const [vehicleTypes, setVehicleTypes] = useState({});
  const [isFetchingVehicleTypes, setIsFetchingVehicleTypes] = useState(false);

  // Delete Dialog State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Verify Dialog State
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [verifyId, setVerifyId] = useState(null);
  const [verifying, setVerifying] = useState(false);

  // Fetch slips
  const fetchSlips = async () => {
    setLoading(true);
    setError(null);

    try {
      const filters = { sort: 'id,desc' };

      if (driverFilter) {
        filters.driverId = driverFilter;
      } else if (params.id) {
        filters.driverId = params.id;
      }

      if (vehicleFilter) {
        filters.vehicleId = vehicleFilter;
      }
      
      const data = await fuelService.getFuelSlips(filters);
      
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
  }, [params.id, driverFilter, vehicleFilter]);

  // ✅ FIXED: Fetch vehicle types for slips with vehicleId
  useEffect(() => {
    const fetchVehicleTypes = async () => {
      const slipsWithVehicles = slips.filter(s => s.vehicleId && !vehicleTypes[s.vehicleId]);
      if (slipsWithVehicles.length === 0) return;
      
      setIsFetchingVehicleTypes(true);
      console.log('🔍 Fetching vehicle types for:', slipsWithVehicles.map(s => s.vehicleId));
      
      const typeMap = {};
      for (const slip of slipsWithVehicles) {
        try {
          const vehicle = await vehicleService.getVehicleById(slip.vehicleId);
          console.log(`🔍 Vehicle ${slip.vehicleId} response:`, vehicle);
          
          // Check if vehicle has vehicleType
          let vehicleType = vehicle?.vehicleType;
          
          // If not, check for other possible fields
          if (!vehicleType) {
            vehicleType = vehicle?.type || vehicle?.category || vehicle?.vehicle_category;
          }
          
          console.log(`📌 Vehicle ${slip.vehicleId} type:`, vehicleType);
          
          if (vehicleType) {
            typeMap[slip.vehicleId] = vehicleType.toUpperCase();
          } else {
            // ✅ FALLBACK: Use hardcoded overrides
            if (VEHICLE_TYPE_OVERRIDES[slip.vehicleId]) {
              typeMap[slip.vehicleId] = VEHICLE_TYPE_OVERRIDES[slip.vehicleId];
              console.log(`📌 Using override for vehicle ${slip.vehicleId}: ${VEHICLE_TYPE_OVERRIDES[slip.vehicleId]}`);
            } else {
              // Default based on registration pattern
              const reg = slip.vehicleRegNumber || '';
              const regUpper = reg.toUpperCase();
              if (regUpper.startsWith('T-') || regUpper.includes('TRUCK')) {
                typeMap[slip.vehicleId] = 'TRUCK';
              } else if (regUpper.startsWith('V-') || regUpper.includes('VAN')) {
                typeMap[slip.vehicleId] = 'VAN';
              } else {
                typeMap[slip.vehicleId] = 'VAN';
              }
            }
          }
        } catch (err) {
          console.warn(`Could not fetch vehicle ${slip.vehicleId}:`, err);
          // ✅ FALLBACK: Use hardcoded overrides
          if (VEHICLE_TYPE_OVERRIDES[slip.vehicleId]) {
            typeMap[slip.vehicleId] = VEHICLE_TYPE_OVERRIDES[slip.vehicleId];
          } else {
            typeMap[slip.vehicleId] = 'VAN';
          }
        }
      }
      console.log('📌 Final vehicle types:', typeMap);
      setVehicleTypes(prev => ({ ...prev, ...typeMap }));
      setIsFetchingVehicleTypes(false);
    };
    
    if (slips.length > 0) {
      fetchVehicleTypes();
    }
  }, [slips]);

  // Fetch trip numbers for slips with tripId
  useEffect(() => {
    const fetchTripNumbers = async () => {
      const slipsWithTrips = slips.filter(s => s.tripId && !tripNumbers[s.tripId]);
      if (slipsWithTrips.length === 0) return;
      
      const tripMap = {};
      for (const slip of slipsWithTrips) {
        try {
          const trip = await tripService.getTripById(slip.tripId);
          tripMap[slip.tripId] = trip.tripNumber;
        } catch (err) {
          console.warn(`Could not fetch trip ${slip.tripId}:`, err);
          tripMap[slip.tripId] = `Trip #${slip.tripId}`;
        }
      }
      setTripNumbers(prev => ({ ...prev, ...tripMap }));
    };
    
    if (slips.length > 0) {
      fetchTripNumbers();
    }
  }, [slips]);

  // ✅ FIXED: Determine if fuel is for Trip, Van, or Truck based on vehicle type
  const getFuelCategory = useCallback((slip) => {
    // 1️⃣ First priority: If it has a tripId, it's TRIP fuel
    if (slip.tripId) return 'TRIP';
    
    // 2️⃣ Check hardcoded overrides first (quickest)
    if (slip.vehicleId && VEHICLE_TYPE_OVERRIDES[slip.vehicleId]) {
      return VEHICLE_TYPE_OVERRIDES[slip.vehicleId];
    }
    
    // 3️⃣ Check if we have a fetched vehicle type
    if (slip.vehicleId && vehicleTypes[slip.vehicleId]) {
      const type = vehicleTypes[slip.vehicleId].toUpperCase();
      if (type === 'TRUCK' || type.includes('TRUCK')) return 'TRUCK';
      if (type === 'VAN' || type === 'CAR' || type.includes('VAN')) return 'VAN';
      if (type === 'TRAILER') return 'TRUCK';
      return 'VAN';
    }
    
    // 4️⃣ Check vehicle type from the slip data directly
    let vehicleType = '';
    if (slip.vehicleType) {
      vehicleType = slip.vehicleType;
    } else if (slip.vehicle?.type) {
      vehicleType = slip.vehicle.type;
    } else if (slip.vehicle?.vehicleType) {
      vehicleType = slip.vehicle.vehicleType;
    }
    
    const normalizedType = String(vehicleType).toUpperCase();
    
    if (normalizedType.includes('TRUCK') || normalizedType === 'TRUCK') {
      return 'TRUCK';
    }
    if (normalizedType.includes('VAN') || normalizedType.includes('CAR') || normalizedType === 'VAN') {
      return 'VAN';
    }
    
    // 5️⃣ Check registration pattern
    if (slip.vehicleRegNumber) {
      const reg = slip.vehicleRegNumber.toUpperCase();
      if (reg.startsWith('T-') || reg.includes('TRUCK')) return 'TRUCK';
      if (reg.startsWith('V-') || reg.includes('VAN')) return 'VAN';
    }
    
    // 6️⃣ Default: If no trip and we have a vehicle, assume VAN
    if (slip.vehicleId || slip.vehicleRegNumber) return 'VAN';
    
    return 'UNKNOWN';
  }, [vehicleTypes]);

  // Get unique drivers, vehicles, and statuses for filters
  const { drivers, vehicles, statuses, categories } = useMemo(() => {
    const uniqueDrivers = [];
    const uniqueVehicles = [];
    const uniqueStatuses = new Set();
    const uniqueCategories = new Set();
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

      const status = getFuelSlipStatus(slip);
      uniqueStatuses.add(status);
      
      const category = getFuelCategory(slip);
      uniqueCategories.add(category);
    });

    return { 
      drivers: uniqueDrivers, 
      vehicles: uniqueVehicles,
      statuses: Array.from(uniqueStatuses),
      categories: Array.from(uniqueCategories),
    };
  }, [slips, getFuelCategory]);

  // Filter slips by period, search, status, and category
  const filteredSlips = useMemo(() => {
    let result = [...slips];
    
    const dateRange = getDateRange(period, customStartDate, customEndDate);
    if (dateRange.start && dateRange.end) {
      result = result.filter(slip => {
        const date = new Date(slip.transactionDate || slip.createdAt);
        return date >= dateRange.start && date <= dateRange.end;
      });
    }
    
    if (statusFilter !== 'all') {
      result = result.filter(slip => getFuelSlipStatus(slip) === statusFilter);
    }
    
    if (categoryFilter !== 'all') {
      result = result.filter(slip => getFuelCategory(slip) === categoryFilter);
    }
    
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      result = result.filter(slip => 
        (slip.driverName || '').toLowerCase().includes(search) ||
        (slip.vehicleRegNumber || '').toLowerCase().includes(search) ||
        (slip.stationName || '').toLowerCase().includes(search) ||
        (slip.location || '').toLowerCase().includes(search) ||
        (slip.receiptNumber || '').toLowerCase().includes(search)
      );
    }
    
    return result;
  }, [slips, period, customStartDate, customEndDate, statusFilter, categoryFilter, searchTerm, getFuelCategory]);

  // Calculate summary stats
  const summary = useMemo(() => {
    if (!filteredSlips.length) return null;

    const totalAmount = filteredSlips.reduce((sum, slip) =>
      sum + (parseFloat(slip.totalAmount) || 0), 0
    );

    const totalQuantity = filteredSlips.reduce((sum, slip) =>
      sum + (parseFloat(slip.quantity) || 0), 0
    );

    const averagePrice = totalQuantity > 0 ? totalAmount / totalQuantity : 0;

    const statusCounts = {};
    const categoryCounts = {};
    const categoryAmounts = {};
    const categoryQuantities = {};
    
    filteredSlips.forEach(slip => {
      const status = getFuelSlipStatus(slip);
      statusCounts[status] = (statusCounts[status] || 0) + 1;
      
      const category = getFuelCategory(slip);
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      categoryAmounts[category] = (categoryAmounts[category] || 0) + (parseFloat(slip.totalAmount) || 0);
      categoryQuantities[category] = (categoryQuantities[category] || 0) + (parseFloat(slip.quantity) || 0);
    });

    return {
      totalAmount,
      totalQuantity,
      averagePrice,
      slipCount: filteredSlips.length,
      statusCounts,
      categoryCounts,
      categoryAmounts,
      categoryQuantities,
    };
  }, [filteredSlips, getFuelCategory]);

  // Handle clear filters
  const handleClearFilters = () => {
    setDriverFilter('');
    setVehicleFilter('');
    setStatusFilter('all');
    setCategoryFilter('all');
    setSearchTerm('');
    setPeriod('month');
    setCustomStartDate('');
    setCustomEndDate('');
  };

  // Handle view slip details
  const handleViewSlip = (id) => {
    navigate(`/fuel/slips/${id}`);
  };

  // Handle edit slip
  const handleEditSlip = (id) => {
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
      <ResponsiveContainer>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress size={40} />
          <Typography sx={{ ml: 2, fontSize: '0.9rem' }}>Loading fuel slips...</Typography>
        </Box>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer>
      {/* Header */}
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
            <LocalGasStation sx={{ verticalAlign: 'middle', mr: 1, fontSize: { xs: '1.2rem', sm: '1.4rem' } }} />
            Fuel Slips
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
            Manage fuel transactions in ZAR • {filteredSlips.length} slips
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' } }} />}
            onClick={handleRefresh}
            size="small"
            sx={{
              borderRadius: '10px',
              fontSize: { xs: '0.7rem', sm: '0.75rem' },
              textTransform: 'none',
              py: { xs: 0.5, sm: 0.75 },
              px: { xs: 1.5, sm: 2 },
            }}
          >
            {isMobile ? '' : 'Refresh'}
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' } }} />}
            onClick={() => navigate('/fuel/slips/add')}
            size="small"
            sx={{
              borderRadius: '10px',
              fontSize: { xs: '0.7rem', sm: '0.75rem' },
              textTransform: 'none',
              py: { xs: 0.5, sm: 0.75 },
              px: { xs: 1.5, sm: 2 },
              background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #4338CA 0%, #4F46E5 100%)',
              },
            }}
          >
            {isMobile ? 'Add' : 'New Slip'}
          </Button>
        </Stack>
      </Stack>

      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 2, borderRadius: '12px', fontSize: { xs: '0.7rem', sm: '0.8rem' } }} 
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      {summary && (
        <>
          <Grid 
            container 
            spacing={{ xs: 1.5, sm: 2, md: 2.5 }}
            sx={{ mb: { xs: 2, sm: 2.5, md: 3 } }}
          >
            <Grid size={{ xs: 6, sm: 3 }}>
              <StatCard
                title="Total Cost"
                value={formatCurrency(summary.totalAmount)}
                subtitle={`${summary.slipCount} slips`}
                icon={AttachMoney}
                color="primary"
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <StatCard
                title="Total Fuel"
                value={`${formatNumber(summary.totalQuantity)} L`}
                subtitle={`Avg: ${formatNumber(summary.totalQuantity / (summary.slipCount || 1))} L/slip`}
                icon={LocalGasStation}
                color="teal"
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <StatCard
                title="Avg Price"
                value={formatCurrency(summary.averagePrice)}
                subtitle="per litre"
                icon={TrendingUpIcon}
                color="success"
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <StatCard
                title="Total Slips"
                value={summary.slipCount}
                subtitle={`${summary.statusCounts.VERIFIED || 0} verified`}
                icon={Receipt}
                color="info"
              />
            </Grid>
          </Grid>

          {/* Fuel Category Cards */}
          <Grid 
            container 
            spacing={{ xs: 1.5, sm: 2 }}
            sx={{ mb: { xs: 2, sm: 2.5, md: 3 } }}
          >
            <Grid size={{ xs: 12, sm: 4 }}>
              <StatCard
                title="Trip Fuel"
                value={formatCurrency(summary.categoryAmounts.TRIP || 0)}
                subtitle={`${summary.categoryCounts.TRIP || 0} slips • ${formatNumber(summary.categoryQuantities.TRIP || 0)} L`}
                icon={LocalShippingIcon}
                color="primary"
                badge="With Trip"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <StatCard
                title="Van Fuel"
                value={formatCurrency(summary.categoryAmounts.VAN || 0)}
                subtitle={`${summary.categoryCounts.VAN || 0} slips • ${formatNumber(summary.categoryQuantities.VAN || 0)} L`}
                icon={VanIcon}
                color="info"
                badge="Light Vehicle"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <StatCard
                title="Truck Fuel"
                value={formatCurrency(summary.categoryAmounts.TRUCK || 0)}
                subtitle={`${summary.categoryCounts.TRUCK || 0} slips • ${formatNumber(summary.categoryQuantities.TRUCK || 0)} L`}
                icon={TruckIcon}
                color="warning"
                badge="Heavy Vehicle"
              />
            </Grid>
          </Grid>
        </>
      )}

      {/* Period Selector & Filters */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 1.5, sm: 2 },
          mb: 2,
          borderRadius: { xs: '12px', sm: '16px' },
          border: '1px solid #ECECEC',
          bgcolor: '#FFFFFF',
          width: '100%',
        }}
      >
        <Stack spacing={1.5}>
          {/* Period Selector */}
          <Stack 
            direction={{ xs: 'column', sm: 'row' }} 
            spacing={{ xs: 1, sm: 1.5 }}
            alignItems={{ xs: 'flex-start', sm: 'center' }}
          >
            <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 130 } }}>
              <InputLabel sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                <CalendarIcon sx={{ fontSize: '0.8rem', mr: 0.5 }} />
                Period
              </InputLabel>
              <Select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                label="Period"
                sx={{ 
                  fontSize: { xs: '0.7rem', sm: '0.75rem' },
                  borderRadius: '8px',
                }}
              >
                {PERIOD_OPTIONS.map(option => (
                  <MenuItem key={option.value} value={option.value} sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {period === 'custom' && (
              <Stack direction="row" spacing={1} sx={{ flex: 1 }}>
                <TextField
                  type="date"
                  label="Start Date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  sx={{ 
                    flex: 1,
                    '& .MuiInputLabel-root': { fontSize: { xs: '0.65rem', sm: '0.75rem' } },
                    '& .MuiInputBase-root': { fontSize: { xs: '0.7rem', sm: '0.75rem' }, borderRadius: '8px' },
                  }}
                />
                <TextField
                  type="date"
                  label="End Date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  sx={{ 
                    flex: 1,
                    '& .MuiInputLabel-root': { fontSize: { xs: '0.65rem', sm: '0.75rem' } },
                    '& .MuiInputBase-root': { fontSize: { xs: '0.7rem', sm: '0.75rem' }, borderRadius: '8px' },
                  }}
                />
              </Stack>
            )}
          </Stack>

          <Divider />

          {/* Search & Filters */}
          <Stack 
            direction={{ xs: 'column', sm: 'row' }} 
            spacing={{ xs: 1, sm: 1.5 }}
          >
            <TextField
              placeholder="Search slips..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="small"
              sx={{ 
                flex: 1,
                '& .MuiInputLabel-root': { fontSize: { xs: '0.65rem', sm: '0.75rem' } },
                '& .MuiInputBase-root': { fontSize: { xs: '0.7rem', sm: '0.75rem' }, borderRadius: '8px' },
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
              <InputLabel sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                <Person sx={{ fontSize: '0.8rem', mr: 0.5 }} />
                Driver
              </InputLabel>
              <Select
                value={driverFilter}
                onChange={(e) => setDriverFilter(e.target.value)}
                label="Driver"
                sx={{ 
                  fontSize: { xs: '0.7rem', sm: '0.75rem' },
                  borderRadius: '8px',
                }}
              >
                <MenuItem value="" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>All Drivers</MenuItem>
                {drivers.map(driver => (
                  <MenuItem key={driver.id} value={driver.id} sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                    {driver.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 130 } }}>
              <InputLabel sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                <DirectionsCar sx={{ fontSize: '0.8rem', mr: 0.5 }} />
                Vehicle
              </InputLabel>
              <Select
                value={vehicleFilter}
                onChange={(e) => setVehicleFilter(e.target.value)}
                label="Vehicle"
                sx={{ 
                  fontSize: { xs: '0.7rem', sm: '0.75rem' },
                  borderRadius: '8px',
                }}
              >
                <MenuItem value="" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>All Vehicles</MenuItem>
                {vehicles.map(vehicle => (
                  <MenuItem key={vehicle.id} value={vehicle.id} sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                    {vehicle.regNumber}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 120 } }}>
              <InputLabel sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                <CheckCircle sx={{ fontSize: '0.8rem', mr: 0.5 }} />
                Status
              </InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Status"
                sx={{ 
                  fontSize: { xs: '0.7rem', sm: '0.75rem' },
                  borderRadius: '8px',
                }}
              >
                <MenuItem value="all" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>All Status</MenuItem>
                {statuses.map(status => (
                  <MenuItem key={status} value={status} sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                    {status}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 120 } }}>
              <InputLabel sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                <LocalGasStation sx={{ fontSize: '0.8rem', mr: 0.5 }} />
                Category
              </InputLabel>
              <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                label="Category"
                sx={{ 
                  fontSize: { xs: '0.7rem', sm: '0.75rem' },
                  borderRadius: '8px',
                }}
              >
                <MenuItem value="all" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>All Categories</MenuItem>
                {categories.map(category => (
                  <MenuItem key={category} value={category} sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                    {category === 'TRIP' ? 'Trip' : category === 'VAN' ? 'Van' : category === 'TRUCK' ? 'Truck' : category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </Stack>
      </Paper>

      {/* Results count */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 1,
        flexWrap: 'wrap',
        gap: 1,
      }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' } }}>
          {filteredSlips.length} slip{filteredSlips.length !== 1 ? 's' : ''}
          {summary && ` • ${formatCurrency(summary.totalAmount)}`}
        </Typography>
        {(searchTerm || driverFilter || vehicleFilter || statusFilter !== 'all' || categoryFilter !== 'all' || period !== 'month') && (
          <Button
            size="small"
            startIcon={<Clear sx={{ fontSize: '0.8rem' }} />}
            onClick={handleClearFilters}
            sx={{ 
              fontSize: { xs: '0.6rem', sm: '0.7rem' },
              borderRadius: '8px',
              textTransform: 'none',
            }}
          >
            Clear All Filters
          </Button>
        )}
      </Box>

      {/* Table */}
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
                <TableCell sx={{ fontSize: { xs: '0.55rem', sm: '0.65rem' }, fontWeight: 600, color: '#6B7280', py: 1 }}>
                  <Event sx={{ fontSize: { xs: '0.6rem', sm: '0.8rem' }, mr: 0.5 }} />
                  Date
                </TableCell>
                <TableCell sx={{ fontSize: { xs: '0.55rem', sm: '0.65rem' }, fontWeight: 600, color: '#6B7280', py: 1 }}>
                  <Person sx={{ fontSize: { xs: '0.6rem', sm: '0.8rem' }, mr: 0.5 }} />
                  Driver
                </TableCell>
                <TableCell sx={{ fontSize: { xs: '0.55rem', sm: '0.65rem' }, fontWeight: 600, color: '#6B7280', py: 1 }}>
                  <DirectionsCar sx={{ fontSize: { xs: '0.6rem', sm: '0.8rem' }, mr: 0.5 }} />
                  Vehicle
                </TableCell>
                <TableCell sx={{ fontSize: { xs: '0.55rem', sm: '0.65rem' }, fontWeight: 600, color: '#6B7280', py: 1 }}>
                  <LocalGasStation sx={{ fontSize: { xs: '0.6rem', sm: '0.8rem' }, mr: 0.5 }} />
                  Fuel
                </TableCell>
                <TableCell sx={{ fontSize: { xs: '0.55rem', sm: '0.65rem' }, fontWeight: 600, color: '#6B7280', py: 1 }}>
                  <AttachMoney sx={{ fontSize: { xs: '0.6rem', sm: '0.8rem' }, mr: 0.5 }} />
                  Amount
                </TableCell>
                <TableCell sx={{ fontSize: { xs: '0.55rem', sm: '0.65rem' }, fontWeight: 600, color: '#6B7280', py: 1 }}>
                  Category
                </TableCell>
                <TableCell sx={{ fontSize: { xs: '0.55rem', sm: '0.65rem' }, fontWeight: 600, color: '#6B7280', py: 1 }}>
                  <CheckCircle sx={{ fontSize: { xs: '0.6rem', sm: '0.8rem' }, mr: 0.5 }} />
                  Status
                </TableCell>
                <TableCell sx={{ fontSize: { xs: '0.55rem', sm: '0.65rem' }, fontWeight: 600, color: '#6B7280', py: 1 }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredSlips.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <LocalGasStation sx={{ fontSize: 48, color: '#D1D5DB', mb: 2 }} />
                      <Typography variant="body1" color="text.secondary" sx={{ fontSize: '0.9rem' }}>
                        No fuel slips found
                      </Typography>
                      {(searchTerm || driverFilter || vehicleFilter || statusFilter !== 'all' || categoryFilter !== 'all') && (
                        <Button onClick={handleClearFilters} sx={{ mt: 1, fontSize: '0.7rem' }} size="small">
                          Clear Filters
                        </Button>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                filteredSlips.map(slip => {
                  const status = getFuelSlipStatus(slip);
                  const category = getFuelCategory(slip);
                  const isVerified = status === 'VERIFIED' || status === 'FINALIZED';
                  
                  return (
                    <TableRow
                      key={slip.id}
                      hover
                      sx={{ 
                        '&:hover': { bgcolor: '#F9FAFB' },
                        bgcolor: isVerified ? 'rgba(34, 197, 94, 0.03)' : 'transparent',
                      }}
                    >
                      <TableCell sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' }, py: 0.75 }}>
                        <Typography variant="body2" sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' } }}>
                          {formatDate(slip.transactionDate || slip.createdAt)}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' }, py: 0.75 }}>
                        <Typography variant="body2" fontWeight="500" sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' } }}>
                          {slip.driverName || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' }, py: 0.75 }}>
                        <Box>
                          <Typography variant="body2" fontWeight="500" sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' } }}>
                            {slip.vehicleRegNumber || '-'}
                          </Typography>
                          {slip.tripId && (
                            <Chip
                              label={tripNumbers[slip.tripId] || `Trip #${slip.tripId}`}
                              size="small"
                              color="info"
                              variant="outlined"
                              sx={{ height: 14, fontSize: '0.4rem', mt: 0.25 }}
                              onClick={() => navigate(`/trips/${slip.tripId}`)}
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' }, py: 0.75 }}>
                        <Typography variant="body2" fontWeight="500" sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' } }}>
                          {slip.quantity ? `${formatNumber(slip.quantity)} L` : '-'}
                        </Typography>
                        {slip.unitPrice && (
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.45rem', sm: '0.55rem' } }}>
                            @ {formatCurrency(slip.unitPrice)}/L
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' }, py: 0.75 }}>
                        <Typography variant="body2" fontWeight="600" color="primary" sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' } }}>
                          {formatCurrency(slip.totalAmount)}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' }, py: 0.75 }}>
                        <FuelCategoryChip category={category} />
                      </TableCell>
                      <TableCell sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' }, py: 0.75 }}>
                        <StatusChip slip={slip} />
                      </TableCell>
                      <TableCell sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' }, py: 0.75 }}>
                        <Stack direction="row" spacing={0.25}>
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              onClick={() => handleViewSlip(slip.id)}
                              color="primary"
                              sx={{ p: { xs: 0.25, sm: 0.5 } }}
                            >
                              <Visibility sx={{ fontSize: { xs: '0.7rem', sm: '0.9rem' } }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              onClick={() => handleEditSlip(slip.id)}
                              color="info"
                              sx={{ p: { xs: 0.25, sm: 0.5 } }}
                            >
                              <EditIcon sx={{ fontSize: { xs: '0.7rem', sm: '0.9rem' } }} />
                            </IconButton>
                          </Tooltip>
                          {status !== 'VERIFIED' && status !== 'FINALIZED' && (
                            <Tooltip title="Verify">
                              <IconButton
                                size="small"
                                onClick={() => handleVerifyClick(slip.id)}
                                color="success"
                                sx={{ p: { xs: 0.25, sm: 0.5 } }}
                              >
                                <VerifiedIcon sx={{ fontSize: { xs: '0.7rem', sm: '0.9rem' } }} />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteClick(slip.id)}
                              color="error"
                              sx={{ p: { xs: 0.25, sm: 0.5 } }}
                            >
                              <DeleteIcon sx={{ fontSize: { xs: '0.7rem', sm: '0.9rem' } }} />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Footer Summary */}
      {summary && (
        <Box sx={{ 
          mt: { xs: 1, sm: 2 },
          pt: { xs: 1, sm: 1.5 }, 
          borderTop: '1px solid #ECECEC',
          width: '100%',
        }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent="space-between"
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            spacing={{ xs: 0.5, sm: 0 }}
          >
            <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
              <Typography variant="caption" sx={{ fontSize: { xs: '0.5rem', sm: '0.6rem' }, color: '#6B7280' }}>
                {filteredSlips.length} slips • {formatNumber(summary.totalQuantity)} litres
              </Typography>
              <Typography variant="caption" sx={{ fontSize: { xs: '0.5rem', sm: '0.6rem' }, color: '#6B7280' }}>
                Trip: {formatCurrency(summary.categoryAmounts.TRIP || 0)}
              </Typography>
              <Typography variant="caption" sx={{ fontSize: { xs: '0.5rem', sm: '0.6rem' }, color: '#6B7280' }}>
                Van: {formatCurrency(summary.categoryAmounts.VAN || 0)}
              </Typography>
              <Typography variant="caption" sx={{ fontSize: { xs: '0.5rem', sm: '0.6rem' }, color: '#6B7280' }}>
                Truck: {formatCurrency(summary.categoryAmounts.TRUCK || 0)}
              </Typography>
            </Stack>
            <Typography 
              variant="caption" 
              sx={{ 
                fontSize: { xs: '0.5rem', sm: '0.6rem' }, 
                color: '#6B7280',
                fontWeight: 600,
              }}
            >
              Total: {formatCurrency(summary.totalAmount)}
            </Typography>
          </Stack>
        </Box>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
          <DeleteIcon sx={{ verticalAlign: 'middle', mr: 1, color: 'error.main' }} />
          Delete Fuel Slip
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' } }}>
            Are you sure you want to delete this fuel slip? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleDeleteCancel} size="small" sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem' } }}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            variant="contained"
            color="error"
            disabled={deleting}
            size="small"
            sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem' } }}
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
        <DialogTitle sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
          <VerifiedIcon sx={{ verticalAlign: 'middle', mr: 1, color: 'success.main' }} />
          Verify Fuel Slip
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' } }}>
            Are you sure you want to verify this fuel slip? This will mark it as verified and cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleVerifyCancel} size="small" sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem' } }}>
            Cancel
          </Button>
          <Button
            onClick={handleVerifyConfirm}
            variant="contained"
            color="success"
            disabled={verifying}
            size="small"
            sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem' } }}
          >
            {verifying ? <CircularProgress size={18} /> : 'Verify'}
          </Button>
        </DialogActions>
      </Dialog>
    </ResponsiveContainer>
  );
}

export default FuelSlips;
