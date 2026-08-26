// src/pages/load/LoadDetails.jsx

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Chip,
  Button,
  Stack,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Divider,
  Tooltip,
  IconButton,
  Avatar,
  LinearProgress,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowBack,
  LocalShipping,
  Person,
  LocationOn,
  CalendarToday,
  Route as RouteIcon,
  CheckCircle,
  Pending,
  Warning,
  Business,
  Schedule,
  AttachMoney,
  Speed,
  Home,
  Map,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Inventory,
  Cancel,
  Info,
  Description,
  Security,
  Verified,
  Assignment,
  Warehouse,
  SupervisorAccount,
  Receipt,
  MonetizationOn,
  Thermostat,
  Dangerous,
  LocalOffer,
  Bookmark,
  Flag,
  LocationCity,
  Settings,
  Store,
  PersonAdd,
  Category,
  Scale,
  Straighten,
} from '@mui/icons-material';
import { loadService } from '../../services/loadService';

import {
  LOAD_STATUSES,
  LOAD_PRIORITIES,
  COMMODITY_OPTIONS,
  getDisplayName,
  getColor,
  getColorBg,
  formatCurrency,
  formatNumber,
  formatDateTime,
  formatDate,
} from '../../constants/loadEnums';

// ============================================================
// COMPONENT: StatusChip
// ============================================================
const StatusChip = ({ status }) => {
  const config = LOAD_STATUSES?.find(s => s.code === status);
  
  return (
    <Chip
      label={config?.displayName || status || 'Unknown'}
      size="small"
      sx={{
        backgroundColor: config?.color ? `${config.color}20` : '#F3F4F6',
        color: config?.color || '#6B7280',
        fontWeight: 600,
        fontSize: { xs: '0.5rem', sm: '0.6rem' },
        height: { xs: 18, sm: 22 },
        border: `1px solid ${config?.color || '#6B7280'}20`,
        '& .MuiChip-label': { px: { xs: 0.75, sm: 1 }, py: 0.25 },
      }}
    />
  );
};

// ============================================================
// COMPONENT: InfoItem - FIXED null safety
// ============================================================
const InfoItem = ({ label, value, icon: Icon, color = 'primary', isChip = false, subValue = null }) => {
  const iconColor = getColor(color);
  const bgColor = getColorBg(color);
  
  // Safe display value with null check
  const displayValue = (value === null || value === undefined || value === '') ? 'N/A' : value;
  
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, py: 0.75, borderBottom: '1px solid #F3F4F6' }}>
      {Icon && (
        <Box
          sx={{
            bgcolor: bgColor,
            borderRadius: '8px',
            p: 0.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            mt: 0.25,
          }}
        >
          <Icon sx={{ fontSize: '0.9rem', color: iconColor }} />
        </Box>
      )}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.55rem', sm: '0.65rem' }, display: 'block' }}>
          {label}
        </Typography>
        {isChip ? (
          <Box sx={{ mt: 0.25 }}>{value}</Box>
        ) : (
          <Typography variant="body2" sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem' }, fontWeight: 500, wordBreak: 'break-word' }}>
            {displayValue}
          </Typography>
        )}
        {subValue && (
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.5rem', sm: '0.6rem' }, display: 'block' }}>
            {subValue}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

// ============================================================
// COMPONENT: StatCard
// ============================================================
const StatCard = React.memo(({
  title,
  value,
  icon: Icon,
  color = 'primary',
  subtitle,
}) => {
  const iconColor = getColor(color);
  const bgColor = getColorBg(color);
  const SafeIcon = Icon || LocalShipping;

  // Ensure value is always a number or string
  const displayValue = (value === null || value === undefined) ? 0 : value;

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
              {typeof displayValue === 'number' ? displayValue : displayValue}
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
// COMPONENT: SectionHeader
// ============================================================
const SectionHeader = ({ title, icon: Icon, subtitle }) => (
  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
    {Icon && <Icon sx={{ fontSize: '1.2rem', color: '#4F46E5' }} />}
    <Box>
      <Typography variant="subtitle2" fontWeight="600" sx={{ fontSize: { xs: '0.8rem', sm: '0.85rem' } }}>
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.55rem', sm: '0.65rem' } }}>
          {subtitle}
        </Typography>
      )}
    </Box>
  </Stack>
);

// ============================================================
// COMPONENT: TripTimelineItem - FIXED null safety
// ============================================================
const TripTimelineItem = ({ trip, index }) => {
  // SAFE ACCESS with null checks - trip might be undefined or null
  if (!trip) {
    return null;
  }
  
  const fromDepot = trip.fromDepotKm ?? 0;
  const toDepot = trip.toDepotKm ?? 0;
  const tripDistance = trip.calculatedDistanceKm ?? 
                       trip.actualDistanceKm ?? 
                       trip.totalDistance ?? 0;
  
  const totalDistance = fromDepot + toDepot + tripDistance;
  
  return (
    <Paper
      sx={{
        p: { xs: 1.5, sm: 2 },
        mb: 1.5,
        borderRadius: { xs: '10px', sm: '12px' },
        border: '1px solid #ECECEC',
        bgcolor: '#F9FAFB',
        '&:last-child': { mb: 0 },
        '&:hover': {
          borderColor: '#4F46E5',
          bgcolor: '#EEF2FF',
        },
      }}
    >
      <Grid container spacing={{ xs: 1, sm: 1.5 }} alignItems="center">
        <Grid size={{ xs: 12, sm: 3 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Avatar
              sx={{
                width: 28,
                height: 28,
                bgcolor: '#4F46E5',
                fontSize: '0.7rem',
                fontWeight: 600,
              }}
            >
              {index + 1}
            </Avatar>
            <Box>
              <Typography variant="body2" fontWeight="600" sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem' } }}>
                {trip.tripNumber || `Trip ${index + 1}`}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.5rem', sm: '0.6rem' } }}>
                {trip.status || 'N/A'}
              </Typography>
            </Box>
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, sm: 3 }}>
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <LocationOn sx={{ fontSize: '0.7rem', color: '#6B7280' }} />
            <Typography variant="body2" sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' } }}>
              {trip.originLocation || trip.originCity || 'N/A'}
            </Typography>
          </Stack>
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <LocationOn sx={{ fontSize: '0.7rem', color: '#6B7280' }} />
            <Typography variant="body2" sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' } }}>
              {trip.destinationLocation || trip.destinationCity || 'N/A'}
            </Typography>
          </Stack>
        </Grid>

        <Grid size={{ xs: 6, sm: 2 }}>
          <InfoItem
            label="Pickup"
            value={fromDepot ? `${fromDepot} km` : '0 km'}
            icon={Home}
            color="info"
          />
        </Grid>

        <Grid size={{ xs: 6, sm: 2 }}>
          <InfoItem
            label="Route"
            value={tripDistance ? `${tripDistance} km` : '0 km'}
            icon={RouteIcon}
            color="warning"
          />
        </Grid>

        <Grid size={{ xs: 6, sm: 2 }}>
          <InfoItem
            label="Total"
            value={`${totalDistance} km`}
            icon={Map}
            color="success"
          />
        </Grid>
      </Grid>

      <Box sx={{ mt: 1.5 }}>
        <LinearProgress
          variant="determinate"
          value={100}
          sx={{
            height: 6,
            borderRadius: 3,
            bgcolor: '#F3F4F6',
            '& .MuiLinearProgress-bar': {
              bgcolor: '#4F46E5',
              borderRadius: 3,
            },
          }}
        />
        <Stack direction="row" justifyContent="space-between" sx={{ mt: 0.5 }}>
          <Typography variant="caption" sx={{ fontSize: '0.5rem', color: '#6B7280' }}>
            From Depot: {fromDepot} km
          </Typography>
          <Typography variant="caption" sx={{ fontSize: '0.5rem', color: '#6B7280' }}>
            Route: {tripDistance} km
          </Typography>
          <Typography variant="caption" sx={{ fontSize: '0.5rem', color: '#6B7280' }}>
            To Depot: {toDepot} km
          </Typography>
        </Stack>
      </Box>
    </Paper>
  );
};

// ============================================================
// COMPONENT: DistanceBreakdownCard
// ============================================================
const DistanceBreakdownCard = ({ title, value, icon: Icon, color, bgColor }) => {
  const safeValue = (value === null || value === undefined) ? 0 : value;
  
  return (
    <Card sx={{ 
      borderRadius: { xs: '12px', sm: '14px' },
      border: '1px solid #ECECEC',
      bgcolor: bgColor,
      height: '100%',
      width: '100%',
    }}>
      <CardContent sx={{ p: { xs: 1.5, sm: 2 }, textAlign: 'center' }}>
        <Icon sx={{ fontSize: '1.2rem', color: color, mb: 0.5 }} />
        <Typography variant="caption" sx={{ fontSize: '0.6rem', color: color, display: 'block' }}>
          {title}
        </Typography>
        <Typography variant="h6" fontWeight="700" sx={{ fontSize: '1rem', color: color }}>
          {safeValue} km
        </Typography>
      </CardContent>
    </Card>
  );
};

// ============================================================
// MAIN COMPONENT: LoadDetails - FIXED null safety
// ============================================================
const LoadDetails = () => {
  const { loadNumber } = useParams();
  const navigate = useNavigate();
  const [load, setLoad] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (loadNumber) {
      loadLoadDetails();
    }
  }, [loadNumber]);

  const loadLoadDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await loadService.getLoadByNumber(loadNumber);
      console.log('📦 Load details received:', data);
      setLoad(data || {});
    } catch (err) {
      console.error('Error loading load details:', err);
      setError('Failed to load load details');
      setLoad({}); // Set empty object to prevent null errors
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadLoadDetails();
  };

  const handleEdit = () => {
    navigate(`/loads/${load?.id}/edit`);
  };

  const handleDelete = async () => {
    if (!load || !load.id) return;
    if (!window.confirm(`Are you sure you want to delete load ${load.loadNumber || 'this load'}?`)) return;
    
    try {
      await loadService.deleteLoad(load.id);
      navigate('/loads');
    } catch (err) {
      console.error('Error deleting load:', err);
      setError('Failed to delete load');
    }
  };

  // ============================================================
  // DISTANCE CALCULATIONS - COMPREHENSIVE NULL SAFETY
  // ============================================================
  
  // SAFE ACCESS using optional chaining and nullish coalescing
  // The load object might be null or undefined, so use optional chaining
  const safeLoad = load || {};
  
  const totalFromDepot = safeLoad.totalFromDepotKm ?? 0;
  const totalToDepot = safeLoad.totalToDepotKm ?? 0;
  const totalDepot = safeLoad.totalDepotKm ?? 0;
  
  // Use the calculated distance fields with null safety
  const totalRoute = safeLoad.totalCalculatedDistanceKm ?? 
                     safeLoad.totalCalculatedDistance ?? 
                     safeLoad.totalDistanceKm ?? 0;
  
  // Total distance = route distance + depot distances
  const overallTotal = totalDepot + totalRoute;
  
  // Calculate completed trips safely
  const trips = safeLoad.trips || [];
  const completedTrips = trips.filter(
    t => t?.status === 'COMPLETED' || t?.status === 'FINALIZED'
  ).length;
  
  // Calculate completion percentage safely
  const completionPercentage = trips.length > 0 
    ? Math.round((completedTrips || 0) / trips.length * 100) 
    : 0;

  // ============================================================
  // LOADING STATE
  // ============================================================

  if (loading) {
    return (
      <Box sx={{ 
        bgcolor: '#F7F7FC', 
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <CircularProgress size={40} />
        <Typography sx={{ ml: 2, fontSize: '0.9rem' }}>Loading load details...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ bgcolor: '#F7F7FC', minHeight: '100vh', p: { xs: 1.5, sm: 2, md: 2.5, lg: 3 } }}>
        <Alert severity="error" sx={{ borderRadius: '12px', fontSize: '0.8rem' }}>
          {error}
        </Alert>
        <Button
          variant="contained"
          size="small"
          onClick={() => navigate('/loads')}
          sx={{ mt: 2, fontSize: '0.8rem', borderRadius: '10px', textTransform: 'none' }}
        >
          Back to Loads
        </Button>
      </Box>
    );
  }

  // If load is empty or null, show a message
  if (!load || Object.keys(load).length === 0) {
    return (
      <Box sx={{ bgcolor: '#F7F7FC', minHeight: '100vh', p: { xs: 1.5, sm: 2, md: 2.5, lg: 3 } }}>
        <Alert severity="warning" sx={{ borderRadius: '12px', fontSize: '0.8rem' }}>
          Load not found or no data available
        </Alert>
        <Button
          variant="contained"
          size="small"
          onClick={() => navigate('/loads')}
          sx={{ mt: 2, fontSize: '0.8rem', borderRadius: '10px', textTransform: 'none' }}
        >
          Back to Loads
        </Button>
      </Box>
    );
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <Box sx={{ 
      bgcolor: '#F7F7FC', 
      minHeight: '100vh',
      p: { xs: 1.5, sm: 2, md: 2.5, lg: 3 },
    }}>
      <Box sx={{ maxWidth: '1600px', margin: '0 auto', width: '100%' }}>
        
        {/* Header */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          mb={{ xs: 2, sm: 2.5, md: 3 }}
          spacing={{ xs: 1, sm: 0 }}
        >
          <Box>
            <Button
              startIcon={<ArrowBack sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' } }} />}
              onClick={() => navigate('/loads')}
              size="small"
              sx={{ 
                mb: 0.5, 
                fontSize: { xs: '0.7rem', sm: '0.75rem' }, 
                color: '#6B7280',
                textTransform: 'none',
                '&:hover': { bgcolor: 'transparent', color: '#4F46E5' },
              }}
            >
              Back to Loads
            </Button>
            <Typography 
              variant="h5" 
              fontWeight="700" 
              sx={{ 
                fontSize: { xs: '1.1rem', sm: '1.3rem', md: '1.4rem', lg: '1.5rem' } 
              }}
            >
              {safeLoad.loadNumber || 'Load Details'}
            </Typography>
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.85rem' } }}
            >
              {safeLoad.description || 'No description'} • {trips.length || 0} trips
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
                fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.8rem' },
                textTransform: 'none',
                py: { xs: 0.5, sm: 0.75 },
                px: { xs: 1.5, sm: 2 },
              }}
            >
              Refresh
            </Button>
            <Button
              variant="outlined"
              startIcon={<EditIcon sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' } }} />}
              onClick={handleEdit}
              size="small"
              sx={{
                borderRadius: '10px',
                fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.8rem' },
                textTransform: 'none',
                py: { xs: 0.5, sm: 0.75 },
                px: { xs: 1.5, sm: 2 },
              }}
            >
              Edit
            </Button>
            <Button
              variant="contained"
              startIcon={<DeleteIcon sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' } }} />}
              onClick={handleDelete}
              size="small"
              sx={{
                borderRadius: '10px',
                fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.8rem' },
                textTransform: 'none',
                py: { xs: 0.5, sm: 0.75 },
                px: { xs: 1.5, sm: 2 },
                bgcolor: '#EF4444',
                '&:hover': { bgcolor: '#DC2626' },
              }}
            >
              Delete
            </Button>
          </Stack>
        </Stack>

        {/* Status Banner */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 1.5, sm: 2 },
            mb: { xs: 2, sm: 2.5, md: 3 },
            borderRadius: { xs: '12px', sm: '16px' },
            border: '1px solid #ECECEC',
            bgcolor: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 1,
            width: '100%',
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
            <StatusChip status={safeLoad.status} />
            {safeLoad.priority && safeLoad.priority !== 'NORMAL' && (
              <Chip
                label={safeLoad.priority}
                size="small"
                sx={{
                  fontWeight: 600,
                  fontSize: { xs: '0.5rem', sm: '0.6rem' },
                  height: { xs: 18, sm: 22 },
                  bgcolor: safeLoad.priority === 'URGENT' ? '#FEE2E2' :
                           safeLoad.priority === 'HIGH' ? '#FEF3C7' : '#F3F4F6',
                  color: safeLoad.priority === 'URGENT' ? '#991B1B' :
                         safeLoad.priority === 'HIGH' ? '#92400E' : '#6B7280',
                  border: `1px solid ${safeLoad.priority === 'URGENT' ? '#FECACA' : 
                          safeLoad.priority === 'HIGH' ? '#FDE68A' : '#E5E7EB'}`,
                }}
              />
            )}
            {safeLoad.hazardousMaterial && (
              <Chip
                label="⚠ Hazardous"
                size="small"
                sx={{
                  fontWeight: 600,
                  fontSize: { xs: '0.5rem', sm: '0.6rem' },
                  height: { xs: 18, sm: 22 },
                  bgcolor: '#FEE2E2',
                  color: '#991B1B',
                  border: '1px solid #FECACA',
                }}
              />
            )}
            {safeLoad.isActive === false && (
              <Chip
                label="Inactive"
                size="small"
                sx={{
                  fontWeight: 600,
                  fontSize: { xs: '0.5rem', sm: '0.6rem' },
                  height: { xs: 18, sm: 22 },
                  bgcolor: '#F3F4F6',
                  color: '#6B7280',
                  border: '1px solid #E5E7EB',
                }}
              />
            )}
          </Stack>
          <Typography variant="caption" sx={{ fontSize: { xs: '0.55rem', sm: '0.65rem' }, color: '#6B7280' }}>
            Updated: {formatDateTime(safeLoad.lastStatusUpdate || safeLoad.updatedAt)}
          </Typography>
        </Paper>

        {/* Stats Cards */}
        <Grid 
          container 
          spacing={{ xs: 1.5, sm: 2, md: 2.5 }}
          sx={{ 
            mb: { xs: 2, sm: 2.5, md: 3 },
            width: '100%',
            margin: 0,
          }}
        >
          <Grid size={{ xs: 6, sm: 3 }} sx={{ display: 'flex' }}>
            <StatCard
              title="Total Trips"
              value={trips.length || 0}
              icon={RouteIcon}
              color="primary"
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }} sx={{ display: 'flex' }}>
            <StatCard
              title="Completed"
              value={completedTrips}
              icon={CheckCircle}
              color="success"
              subtitle={`${completionPercentage}% complete`}
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }} sx={{ display: 'flex' }}>
            <StatCard
              title="Incidents"
              value={safeLoad.incidentsLogged || 0}
              icon={Warning}
              color="error"
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }} sx={{ display: 'flex' }}>
            <StatCard
              title="Total Distance"
              value={`${overallTotal} km`}
              icon={Map}
              color="purple"
            />
          </Grid>
        </Grid>

        {/* Distance Breakdown Cards */}
        <Grid 
          container 
          spacing={{ xs: 1.5, sm: 2 }}
          sx={{ 
            mb: { xs: 2, sm: 2.5, md: 3 },
            width: '100%',
            margin: 0,
          }}
        >
          <Grid size={{ xs: 4 }} sx={{ display: 'flex' }}>
            <DistanceBreakdownCard
              title="From Depot"
              value={totalFromDepot}
              icon={Home}
              color="#1E40AF"
              bgColor="#DBEAFE"
            />
          </Grid>
          <Grid size={{ xs: 4 }} sx={{ display: 'flex' }}>
            <DistanceBreakdownCard
              title="Route Distance"
              value={totalRoute}
              icon={RouteIcon}
              color="#92400E"
              bgColor="#FEF3C7"
            />
          </Grid>
          <Grid size={{ xs: 4 }} sx={{ display: 'flex' }}>
            <DistanceBreakdownCard
              title="Total Distance"
              value={overallTotal}
              icon={Map}
              color="#065F46"
              bgColor="#D1FAE5"
            />
          </Grid>
        </Grid>

        {/* Main Content Grid */}
        <Grid 
          container 
          spacing={{ xs: 1.5, sm: 2, md: 2.5 }}
          sx={{ 
            width: '100%',
            margin: 0,
          }}
        >
          {/* Left Column */}
          <Grid size={{ xs: 12, lg: 8 }} sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1.5, sm: 2 } }}>
            {/* Load Information */}
            <Paper
              elevation={0}
              sx={{
                p: { xs: 1.5, sm: 2, md: 2.5 },
                borderRadius: { xs: '12px', sm: '16px' },
                border: '1px solid #ECECEC',
                bgcolor: '#FFFFFF',
                width: '100%',
              }}
            >
              <SectionHeader title="Load Information" icon={LocalShipping} />
              <Grid container spacing={{ xs: 0.5, sm: 1 }}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <InfoItem label="Load Number" value={safeLoad.loadNumber} icon={LocalShipping} color="primary" />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <InfoItem label="Reference Number" value={safeLoad.referenceNumber} icon={Bookmark} color="secondary" />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <InfoItem label="Customer" value={safeLoad.customerName || safeLoad.customerId || 'N/A'} icon={Business} color="info" />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <InfoItem label="Status" value={<StatusChip status={safeLoad.status} />} icon={Flag} color="warning" isChip />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <InfoItem label="Priority" value={safeLoad.priority || 'NORMAL'} icon={Flag} color="warning" />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <InfoItem label="Commodity Type" value={safeLoad.commodityType || 'N/A'} icon={Category} color="purple" />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <InfoItem label="Container Number" value={safeLoad.containerNumber || 'N/A'} icon={LocalShipping} color="primary" />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <InfoItem label="Pallet Count" value={safeLoad.palletCount || 'N/A'} icon={Straighten} color="info" />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <InfoItem label="Description" value={safeLoad.description || 'N/A'} icon={Description} color="secondary" />
                </Grid>
              </Grid>
            </Paper>

            {/* Depot Distance Tracking */}
            <Paper
              elevation={0}
              sx={{
                p: { xs: 1.5, sm: 2, md: 2.5 },
                borderRadius: { xs: '12px', sm: '16px' },
                border: '1px solid #ECECEC',
                bgcolor: '#FFFFFF',
                width: '100%',
              }}
            >
              <SectionHeader title="Depot Distance Tracking" icon={Home} subtitle="Distances from/to depot across all trips" />
              
              <Grid container spacing={{ xs: 1, sm: 1.5 }}>
                <Grid size={{ xs: 12, sm: 4 }} sx={{ display: 'flex' }}>
                  <Card sx={{ bgcolor: '#DBEAFE', borderRadius: '12px', width: '100%' }}>
                    <CardContent sx={{ p: 1.5, textAlign: 'center' }}>
                      <Typography variant="caption" sx={{ fontSize: '0.55rem', color: '#1E40AF', display: 'block' }}>
                        From Depot (Pickup)
                      </Typography>
                      <Typography variant="h6" fontWeight="700" sx={{ fontSize: '0.9rem', color: '#1E40AF' }}>
                        {totalFromDepot} km
                      </Typography>
                      <Typography variant="caption" sx={{ fontSize: '0.5rem', color: '#1E40AF' }}>
                        {trips.length || 0} trips
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }} sx={{ display: 'flex' }}>
                  <Card sx={{ bgcolor: '#FEF3C7', borderRadius: '12px', width: '100%' }}>
                    <CardContent sx={{ p: 1.5, textAlign: 'center' }}>
                      <Typography variant="caption" sx={{ fontSize: '0.55rem', color: '#92400E', display: 'block' }}>
                        To Depot (Drop-off)
                      </Typography>
                      <Typography variant="h6" fontWeight="700" sx={{ fontSize: '0.9rem', color: '#92400E' }}>
                        {totalToDepot} km
                      </Typography>
                      <Typography variant="caption" sx={{ fontSize: '0.5rem', color: '#92400E' }}>
                        {trips.length || 0} trips
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }} sx={{ display: 'flex' }}>
                  <Card sx={{ bgcolor: '#D1FAE5', borderRadius: '12px', width: '100%' }}>
                    <CardContent sx={{ p: 1.5, textAlign: 'center' }}>
                      <Typography variant="caption" sx={{ fontSize: '0.55rem', color: '#065F46', display: 'block' }}>
                        Total Depot KM
                      </Typography>
                      <Typography variant="h6" fontWeight="700" sx={{ fontSize: '0.9rem', color: '#065F46' }}>
                        {totalDepot} km
                      </Typography>
                      <Typography variant="caption" sx={{ fontSize: '0.5rem', color: '#065F46' }}>
                        Combined depot distance
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Paper>

            {/* Trip Timeline */}
            <Paper
              elevation={0}
              sx={{
                p: { xs: 1.5, sm: 2, md: 2.5 },
                borderRadius: { xs: '12px', sm: '16px' },
                border: '1px solid #ECECEC',
                bgcolor: '#FFFFFF',
                width: '100%',
              }}
            >
              <SectionHeader title="Trip Timeline" icon={RouteIcon} subtitle={`${trips.length || 0} trips in this load`} />
              {trips.length > 0 ? (
                trips.map((trip, index) => (
                  <TripTimelineItem key={trip?.id || index} trip={trip} index={index} />
                ))
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <RouteIcon sx={{ fontSize: 48, color: '#D1D5DB', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                    No trips associated with this load
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>

          {/* Right Column */}
          <Grid size={{ xs: 12, lg: 4 }} sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1.5, sm: 2 } }}>
            {/* Measurements */}
            <Paper
              elevation={0}
              sx={{
                p: { xs: 1.5, sm: 2, md: 2.5 },
                borderRadius: { xs: '12px', sm: '16px' },
                border: '1px solid #ECECEC',
                bgcolor: '#FFFFFF',
                width: '100%',
              }}
            >
              <SectionHeader title="Measurements & Values" icon={Scale} />
              <InfoItem label="Weight (kg)" value={safeLoad.weightKg ? `${safeLoad.weightKg} kg` : 'N/A'} icon={Scale} color="warning" />
              <InfoItem label="Volume (m³)" value={safeLoad.volumeCubicM ? `${safeLoad.volumeCubicM} m³` : 'N/A'} icon={Straighten} color="info" />
              <Divider sx={{ my: 1 }} />
              <InfoItem label="Estimated Value" value={formatCurrency(safeLoad.estimatedValue)} icon={MonetizationOn} color="primary" />
              <InfoItem label="Actual Value" value={formatCurrency(safeLoad.actualValue)} icon={MonetizationOn} color="success" />
            </Paper>

            {/* Dates */}
            <Paper
              elevation={0}
              sx={{
                p: { xs: 1.5, sm: 2, md: 2.5 },
                borderRadius: { xs: '12px', sm: '16px' },
                border: '1px solid #ECECEC',
                bgcolor: '#FFFFFF',
                width: '100%',
              }}
            >
              <SectionHeader title="Dates" icon={CalendarToday} />
              <InfoItem label="Loading Date" value={formatDateTime(safeLoad.loadingDate)} icon={CalendarToday} color="info" />
              <InfoItem label="Unloading Date" value={formatDateTime(safeLoad.unloadingDate) || 'N/A'} icon={CalendarToday} color="secondary" />
              <InfoItem label="Created" value={formatDateTime(safeLoad.createdAt)} icon={Schedule} color="primary" />
              <InfoItem label="Last Updated" value={formatDateTime(safeLoad.updatedAt)} icon={Schedule} color="secondary" />
              <InfoItem label="Last Status Update" value={formatDateTime(safeLoad.lastStatusUpdate)} icon={Schedule} color="warning" />
            </Paper>

            {/* Special Handling */}
            {(safeLoad.specialHandling || safeLoad.handlingInstructions || safeLoad.hazardClass || safeLoad.temperatureRequirements || safeLoad.packagingType) && (
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 1.5, sm: 2, md: 2.5 },
                  borderRadius: { xs: '12px', sm: '16px' },
                  border: '1px solid #ECECEC',
                  bgcolor: '#FFFFFF',
                  width: '100%',
                }}
              >
                <SectionHeader title="Special Handling" icon={Warning} />
                {safeLoad.hazardClass && <InfoItem label="Hazard Class" value={safeLoad.hazardClass} icon={Dangerous} color="error" />}
                {safeLoad.temperatureRequirements && <InfoItem label="Temperature Requirements" value={safeLoad.temperatureRequirements} icon={Thermostat} color="info" />}
                {safeLoad.packagingType && <InfoItem label="Packaging Type" value={safeLoad.packagingType} icon={Inventory} color="secondary" />}
                {safeLoad.specialHandling && <InfoItem label="Special Instructions" value={safeLoad.specialHandling} icon={Warning} color="warning" />}
                {safeLoad.handlingInstructions && <InfoItem label="Handling Instructions" value={safeLoad.handlingInstructions} icon={Settings} color="purple" />}
              </Paper>
            )}

            {/* Insurance & Customs */}
            {(safeLoad.insurancePolicyNumber || safeLoad.insuranceExpiry || safeLoad.customsClearanceStatus) && (
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 1.5, sm: 2, md: 2.5 },
                  borderRadius: { xs: '12px', sm: '16px' },
                  border: '1px solid #ECECEC',
                  bgcolor: '#FFFFFF',
                  width: '100%',
                }}
              >
                <SectionHeader title="Insurance & Customs" icon={Security} />
                {safeLoad.insurancePolicyNumber && <InfoItem label="Insurance Policy" value={safeLoad.insurancePolicyNumber} icon={Security} color="primary" />}
                {safeLoad.insuranceExpiry && <InfoItem label="Insurance Expiry" value={formatDate(safeLoad.insuranceExpiry)} icon={CalendarToday} color="warning" />}
                {safeLoad.customsClearanceStatus && <InfoItem label="Customs Clearance" value={safeLoad.customsClearanceStatus} icon={Verified} color="success" />}
              </Paper>
            )}
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default LoadDetails;
