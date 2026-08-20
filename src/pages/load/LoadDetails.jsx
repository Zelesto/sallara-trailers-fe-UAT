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
  Packaging,
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
  Inventory,
} from '@mui/icons-material';
import { loadService } from '../../services/loadService';

// ============================================================
// UTILITY FUNCTIONS
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

const formatDateTime = (date) => {
  if (!date) return 'N/A';
  try {
    return new Date(date).toLocaleString('en-ZA', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'N/A';
  }
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
// COMPONENT: StatusChip
// ============================================================

const StatusChip = ({ status }) => {
  const configs = {
    PENDING: { color: '#F59E0B', bgColor: '#FEF3C7', label: 'Pending', icon: <Pending sx={{ fontSize: '0.6rem' }} /> },
    IN_PROGRESS: { color: '#3B82F6', bgColor: '#DBEAFE', label: 'In Progress', icon: <Warning sx={{ fontSize: '0.6rem' }} /> },
    LOADED: { color: '#8B5CF6', bgColor: '#EDE9FE', label: 'Loaded', icon: <LocalShipping sx={{ fontSize: '0.6rem' }} /> },
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
// COMPONENT: InfoItem
// ============================================================

const InfoItem = ({ label, value, icon: Icon, color = 'primary', isChip = false, subValue = null }) => {
  const iconColor = getColor(color);
  const bgColor = getColorBg(color);
  
  const displayValue = value === null || value === undefined || value === '' ? 'N/A' : value;
  
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

  return (
    <Card
      sx={{
        bgcolor: '#FFFFFF',
        borderRadius: { xs: '10px', sm: '12px' },
        border: '1px solid #ECECEC',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        height: '100%',
        width: '100%',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          borderColor: iconColor,
        },
      }}
    >
      <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="caption"
              sx={{
                color: '#6B7280',
                fontWeight: 600,
                textTransform: 'uppercase',
                fontSize: { xs: '0.5rem', sm: '0.6rem' },
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
                fontSize: { xs: '1rem', sm: '1.2rem', md: '1.4rem' },
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
                  fontSize: { xs: '0.5rem', sm: '0.6rem' },
                }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>

          <Box
            sx={{
              bgcolor: bgColor,
              borderRadius: { xs: '8px', sm: '10px' },
              p: { xs: 0.75, sm: 1 },
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <SafeIcon sx={{ 
              color: iconColor, 
              fontSize: { xs: '1rem', sm: '1.2rem', md: '1.4rem' },
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
// COMPONENT: TripTimelineItem
// ============================================================

const TripTimelineItem = ({ trip, index }) => {
  const totalDistance = (trip.fromDepotKm || 0) + (trip.toDepotKm || 0) + (trip.totalDistance || 0);
  
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
      <Grid container spacing={1.5} alignItems="center">
        <Grid item xs={12} sm={3}>
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

        <Grid item xs={12} sm={3}>
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

        <Grid item xs={6} sm={2}>
          <InfoItem
            label="Pickup"
            value={trip.fromDepotKm ? `${trip.fromDepotKm} km` : '0 km'}
            icon={Home}
            color="info"
          />
        </Grid>

        <Grid item xs={6} sm={2}>
          <InfoItem
            label="Route"
            value={trip.totalDistance ? `${trip.totalDistance} km` : '0 km'}
            icon={RouteIcon}
            color="warning"
          />
        </Grid>

        <Grid item xs={6} sm={2}>
          <InfoItem
            label="Total"
            value={`${totalDistance} km`}
            icon={Map}
            color="success"
          />
        </Grid>
      </Grid>

      {/* Progress bar showing distance breakdown */}
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
            From Depot: {trip.fromDepotKm || 0} km
          </Typography>
          <Typography variant="caption" sx={{ fontSize: '0.5rem', color: '#6B7280' }}>
            Route: {trip.totalDistance || 0} km
          </Typography>
          <Typography variant="caption" sx={{ fontSize: '0.5rem', color: '#6B7280' }}>
            To Depot: {trip.toDepotKm || 0} km
          </Typography>
        </Stack>
      </Box>
    </Paper>
  );
};

// ============================================================
// MAIN COMPONENT: LoadDetails
// ============================================================

const LoadDetails = () => {
  const { loadNumber } = useParams();
  const navigate = useNavigate();
  const [load, setLoad] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadLoadDetails();
  }, [loadNumber]);

  const loadLoadDetails = async () => {
    setLoading(true);
    try {
      const data = await loadService.getLoadByNumber(loadNumber);
      setLoad(data);
    } catch (err) {
      console.error('Error loading load details:', err);
      setError('Failed to load load details');
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
    if (!load) return;
    if (!window.confirm(`Are you sure you want to delete load ${load.loadNumber}?`)) return;
    
    try {
      await loadService.deleteLoad(load.id);
      navigate('/loads');
    } catch (err) {
      console.error('Error deleting load:', err);
      setError('Failed to delete load');
    }
  };

  // Calculate totals
  const totalFromDepot = load?.totalFromDepotKm || 0;
  const totalToDepot = load?.totalToDepotKm || 0;
  const totalDepot = load?.totalDepotKm || 0;
  const totalRoute = load?.totalDistanceKm || 0;
  const overallTotal = totalDepot + totalRoute;

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
      <Box sx={{ bgcolor: '#F7F7FC', minHeight: '100vh', p: 2 }}>
        <Alert severity="error" sx={{ borderRadius: '12px', fontSize: '0.8rem' }}>
          {error}
        </Alert>
        <Button
          variant="contained"
          size="small"
          onClick={() => navigate('/loads')}
          sx={{ mt: 2, fontSize: '0.8rem', borderRadius: '10px' }}
        >
          Back to Loads
        </Button>
      </Box>
    );
  }

  if (!load) {
    return (
      <Box sx={{ bgcolor: '#F7F7FC', minHeight: '100vh', p: 2 }}>
        <Alert severity="warning" sx={{ borderRadius: '12px', fontSize: '0.8rem' }}>
          Load not found
        </Alert>
        <Button
          variant="contained"
          size="small"
          onClick={() => navigate('/loads')}
          sx={{ mt: 2, fontSize: '0.8rem', borderRadius: '10px' }}
        >
          Back to Loads
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      bgcolor: '#F7F7FC', 
      minHeight: '100vh',
      p: { xs: 1.5, sm: 2, md: 2.5, lg: 3 },
    }}>
      <Box sx={{ maxWidth: '1600px', margin: '0 auto' }}>
        
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
              }}
            >
              Back to Loads
            </Button>
            <Typography 
              variant="h5" 
              fontWeight="700" 
              sx={{ 
                fontSize: { xs: '1.1rem', sm: '1.3rem', md: '1.4rem' } 
              }}
            >
              {load.loadNumber}
            </Typography>
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem' } }}
            >
              {load.description || 'No description'} • {load.trips?.length || 0} trips
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
                fontSize: { xs: '0.7rem', sm: '0.75rem' },
                textTransform: 'none',
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
                fontSize: { xs: '0.7rem', sm: '0.75rem' },
                textTransform: 'none',
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
            mb: 3,
            borderRadius: { xs: '12px', sm: '16px' },
            border: '1px solid #ECECEC',
            bgcolor: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 1,
          }}
        >
          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
            <StatusChip status={load.status} />
            {load.priority && load.priority !== 'NORMAL' && (
              <Chip
                label={load.priority}
                size="small"
                sx={{
                  fontWeight: 600,
                  fontSize: { xs: '0.5rem', sm: '0.6rem' },
                  height: { xs: 18, sm: 22 },
                  bgcolor: load.priority === 'URGENT' ? '#FEE2E2' :
                           load.priority === 'HIGH' ? '#FEF3C7' : '#F3F4F6',
                  color: load.priority === 'URGENT' ? '#991B1B' :
                         load.priority === 'HIGH' ? '#92400E' : '#6B7280',
                }}
              />
            )}
            {load.hazardousMaterial && (
              <Chip
                label="Hazardous"
                size="small"
                sx={{
                  fontWeight: 600,
                  fontSize: { xs: '0.5rem', sm: '0.6rem' },
                  height: { xs: 18, sm: 22 },
                  bgcolor: '#FEE2E2',
                  color: '#991B1B',
                }}
              />
            )}
            {load.isActive === false && (
              <Chip
                label="Inactive"
                size="small"
                sx={{
                  fontWeight: 600,
                  fontSize: { xs: '0.5rem', sm: '0.6rem' },
                  height: { xs: 18, sm: 22 },
                  bgcolor: '#F3F4F6',
                  color: '#6B7280',
                }}
              />
            )}
          </Stack>
          <Typography variant="caption" sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' }, color: '#6B7280' }}>
            Updated: {formatDateTime(load.lastStatusUpdate || load.updatedAt)}
          </Typography>
        </Paper>

        {/* Stats Cards */}
        <Grid container spacing={{ xs: 1.5, sm: 2 }} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={3}>
            <StatCard
              title="Total Trips"
              value={load.trips?.length || 0}
              icon={RouteIcon}
              color="primary"
            />
          </Grid>
          <Grid item xs={6} sm={3}>
            <StatCard
              title="Completed"
              value={load.completedTrips || 0}
              icon={CheckCircle}
              color="success"
              subtitle={`${load.trips?.length > 0 ? Math.round((load.completedTrips || 0) / load.trips.length * 100) : 0}% complete`}
            />
          </Grid>
          <Grid item xs={6} sm={3}>
            <StatCard
              title="Incidents"
              value={load.incidentsLogged || 0}
              icon={Warning}
              color="error"
            />
          </Grid>
          <Grid item xs={6} sm={3}>
            <StatCard
              title="Total Distance"
              value={`${overallTotal} km`}
              icon={Map}
              color="purple"
            />
          </Grid>
        </Grid>

        {/* Distance Breakdown Cards */}
        <Grid container spacing={{ xs: 1.5, sm: 2 }} sx={{ mb: 3 }}>
          <Grid item xs={4}>
            <Card sx={{ 
              borderRadius: { xs: '10px', sm: '12px' },
              border: '1px solid #ECECEC',
              bgcolor: '#DBEAFE',
            }}>
              <CardContent sx={{ p: { xs: 1.5, sm: 2 }, textAlign: 'center' }}>
                <Home sx={{ fontSize: '1.2rem', color: '#1E40AF', mb: 0.5 }} />
                <Typography variant="caption" sx={{ fontSize: '0.6rem', color: '#1E40AF', display: 'block' }}>
                  From Depot
                </Typography>
                <Typography variant="h6" fontWeight="700" sx={{ fontSize: '1rem', color: '#1E40AF' }}>
                  {totalFromDepot} km
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={4}>
            <Card sx={{ 
              borderRadius: { xs: '10px', sm: '12px' },
              border: '1px solid #ECECEC',
              bgcolor: '#FEF3C7',
            }}>
              <CardContent sx={{ p: { xs: 1.5, sm: 2 }, textAlign: 'center' }}>
                <RouteIcon sx={{ fontSize: '1.2rem', color: '#92400E', mb: 0.5 }} />
                <Typography variant="caption" sx={{ fontSize: '0.6rem', color: '#92400E', display: 'block' }}>
                  Route Distance
                </Typography>
                <Typography variant="h6" fontWeight="700" sx={{ fontSize: '1rem', color: '#92400E' }}>
                  {totalRoute} km
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={4}>
            <Card sx={{ 
              borderRadius: { xs: '10px', sm: '12px' },
              border: '1px solid #ECECEC',
              bgcolor: '#D1FAE5',
            }}>
              <CardContent sx={{ p: { xs: 1.5, sm: 2 }, textAlign: 'center' }}>
                <Map sx={{ fontSize: '1.2rem', color: '#065F46', mb: 0.5 }} />
                <Typography variant="caption" sx={{ fontSize: '0.6rem', color: '#065F46', display: 'block' }}>
                  Total Distance
                </Typography>
                <Typography variant="h6" fontWeight="700" sx={{ fontSize: '1rem', color: '#065F46' }}>
                  {overallTotal} km
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Main Content Grid */}
        <Grid container spacing={2}>
          {/* Left Column */}
          <Grid item xs={12} lg={8}>
            {/* Load Information */}
            <Paper
              elevation={0}
              sx={{
                p: { xs: 2, sm: 2.5 },
                mb: 2,
                borderRadius: { xs: '12px', sm: '16px' },
                border: '1px solid #ECECEC',
                bgcolor: '#FFFFFF',
              }}
            >
              <SectionHeader title="Load Information" icon={LocalShipping} />
              <Grid container spacing={1}>
                <Grid item xs={12} sm={6}>
                  <InfoItem label="Load Number" value={load.loadNumber} icon={LocalShipping} color="primary" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <InfoItem label="Reference Number" value={load.referenceNumber} icon={Bookmark} color="secondary" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <InfoItem label="Customer" value={load.customerName || load.customerId || 'N/A'} icon={Business} color="info" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <InfoItem label="Status" value={<StatusChip status={load.status} />} icon={Flag} color="warning" isChip />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <InfoItem label="Priority" value={load.priority || 'NORMAL'} icon={Flag} color="warning" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <InfoItem label="Commodity Type" value={load.commodityType} icon={Category} color="purple" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <InfoItem label="Container Number" value={load.containerNumber} icon={LocalShipping} color="primary" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <InfoItem label="Pallet Count" value={load.palletCount} icon={Straighten} color="info" />
                </Grid>
                <Grid item xs={12}>
                  <InfoItem label="Description" value={load.description} icon={Description} color="secondary" />
                </Grid>
              </Grid>
            </Paper>

            {/* Depot Distance Tracking */}
            <Paper
              elevation={0}
              sx={{
                p: { xs: 2, sm: 2.5 },
                mb: 2,
                borderRadius: { xs: '12px', sm: '16px' },
                border: '1px solid #ECECEC',
                bgcolor: '#FFFFFF',
              }}
            >
              <SectionHeader title="Depot Distance Tracking" icon={Home} subtitle="Distances from/to depot across all trips" />
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Card sx={{ bgcolor: '#DBEAFE', borderRadius: '10px' }}>
                    <CardContent sx={{ p: 1.5, textAlign: 'center' }}>
                      <Typography variant="caption" sx={{ fontSize: '0.55rem', color: '#1E40AF' }}>
                        From Depot (Pickup)
                      </Typography>
                      <Typography variant="h6" fontWeight="700" sx={{ fontSize: '0.9rem', color: '#1E40AF' }}>
                        {totalFromDepot} km
                      </Typography>
                      <Typography variant="caption" sx={{ fontSize: '0.5rem', color: '#1E40AF' }}>
                        {load.trips?.length || 0} trips
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Card sx={{ bgcolor: '#FEF3C7', borderRadius: '10px' }}>
                    <CardContent sx={{ p: 1.5, textAlign: 'center' }}>
                      <Typography variant="caption" sx={{ fontSize: '0.55rem', color: '#92400E' }}>
                        To Depot (Drop-off)
                      </Typography>
                      <Typography variant="h6" fontWeight="700" sx={{ fontSize: '0.9rem', color: '#92400E' }}>
                        {totalToDepot} km
                      </Typography>
                      <Typography variant="caption" sx={{ fontSize: '0.5rem', color: '#92400E' }}>
                        {load.trips?.length || 0} trips
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Card sx={{ bgcolor: '#D1FAE5', borderRadius: '10px' }}>
                    <CardContent sx={{ p: 1.5, textAlign: 'center' }}>
                      <Typography variant="caption" sx={{ fontSize: '0.55rem', color: '#065F46' }}>
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
                p: { xs: 2, sm: 2.5 },
                borderRadius: { xs: '12px', sm: '16px' },
                border: '1px solid #ECECEC',
                bgcolor: '#FFFFFF',
              }}
            >
              <SectionHeader title="Trip Timeline" icon={RouteIcon} subtitle={`${load.trips?.length || 0} trips in this load`} />
              {load.trips && load.trips.length > 0 ? (
                load.trips.map((trip, index) => (
                  <TripTimelineItem key={trip.id || index} trip={trip} index={index} />
                ))
              ) : (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <RouteIcon sx={{ fontSize: 40, color: '#D1D5DB', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                    No trips associated with this load
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>

          {/* Right Column */}
          <Grid item xs={12} lg={4}>
            {/* Measurements */}
            <Paper
              elevation={0}
              sx={{
                p: { xs: 2, sm: 2.5 },
                mb: 2,
                borderRadius: { xs: '12px', sm: '16px' },
                border: '1px solid #ECECEC',
                bgcolor: '#FFFFFF',
              }}
            >
              <SectionHeader title="Measurements & Values" icon={Scale} />
              <InfoItem label="Weight (kg)" value={load.weightKg ? `${load.weightKg} kg` : 'N/A'} icon={Scale} color="warning" />
              <InfoItem label="Volume (m³)" value={load.volumeCubicM ? `${load.volumeCubicM} m³` : 'N/A'} icon={Straighten} color="info" />
              <Divider sx={{ my: 1 }} />
              <InfoItem label="Estimated Value" value={formatCurrency(load.estimatedValue)} icon={MonetizationOn} color="primary" />
              <InfoItem label="Actual Value" value={formatCurrency(load.actualValue)} icon={MonetizationOn} color="success" />
            </Paper>

            {/* Dates */}
            <Paper
              elevation={0}
              sx={{
                p: { xs: 2, sm: 2.5 },
                mb: 2,
                borderRadius: { xs: '12px', sm: '16px' },
                border: '1px solid #ECECEC',
                bgcolor: '#FFFFFF',
              }}
            >
              <SectionHeader title="Dates" icon={CalendarToday} />
              <InfoItem label="Loading Date" value={formatDateTime(load.loadingDate)} icon={CalendarToday} color="info" />
              <InfoItem label="Unloading Date" value={formatDateTime(load.unloadingDate) || 'N/A'} icon={CalendarToday} color="secondary" />
              <InfoItem label="Created" value={formatDateTime(load.createdAt)} icon={Schedule} color="primary" />
              <InfoItem label="Last Updated" value={formatDateTime(load.updatedAt)} icon={Schedule} color="secondary" />
              <InfoItem label="Last Status Update" value={formatDateTime(load.lastStatusUpdate)} icon={Schedule} color="warning" />
            </Paper>

            {/* Special Handling */}
            {(load.specialHandling || load.handlingInstructions || load.hazardClass || load.temperatureRequirements || load.packagingType) && (
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 2, sm: 2.5 },
                  mb: 2,
                  borderRadius: { xs: '12px', sm: '16px' },
                  border: '1px solid #ECECEC',
                  bgcolor: '#FFFFFF',
                }}
              >
                <SectionHeader title="Special Handling" icon={Warning} />
                {load.hazardClass && <InfoItem label="Hazard Class" value={load.hazardClass} icon={Dangerous} color="error" />}
                {load.temperatureRequirements && <InfoItem label="Temperature Requirements" value={load.temperatureRequirements} icon={Thermostat} color="info" />}
                {load.packagingType && <InfoItem label="Packaging Type" value={load.packagingType} icon={Packaging} color="secondary" />}
                {load.specialHandling && <InfoItem label="Special Instructions" value={load.specialHandling} icon={Warning} color="warning" />}
                {load.handlingInstructions && <InfoItem label="Handling Instructions" value={load.handlingInstructions} icon={Settings} color="purple" />}
              </Paper>
            )}

            {/* Insurance & Customs */}
            {(load.insurancePolicyNumber || load.insuranceExpiry || load.customsClearanceStatus) && (
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 2, sm: 2.5 },
                  mb: 2,
                  borderRadius: { xs: '12px', sm: '16px' },
                  border: '1px solid #ECECEC',
                  bgcolor: '#FFFFFF',
                }}
              >
                <SectionHeader title="Insurance & Customs" icon={Security} />
                {load.insurancePolicyNumber && <InfoItem label="Insurance Policy" value={load.insurancePolicyNumber} icon={Security} color="primary" />}
                {load.insuranceExpiry && <InfoItem label="Insurance Expiry" value={formatDate(load.insuranceExpiry)} icon={CalendarToday} color="warning" />}
                {load.customsClearanceStatus && <InfoItem label="Customs Clearance" value={load.customsClearanceStatus} icon={Verified} color="success" />}
              </Paper>
            )}

            {/* Warehouse & Supervisor */}
            {(load.warehouseId || load.supervisorId) && (
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 2, sm: 2.5 },
                  borderRadius: { xs: '12px', sm: '16px' },
                  border: '1px solid #ECECEC',
                  bgcolor: '#FFFFFF',
                }}
              >
                <SectionHeader title="Facilities & Personnel" icon={Store} />
                {load.warehouseId && <InfoItem label="Warehouse ID" value={load.warehouseId} icon={Warehouse} color="info" />}
                {load.supervisorId && <InfoItem label="Supervisor ID" value={load.supervisorId} icon={SupervisorAccount} color="secondary" />}
              </Paper>
            )}

            {/* Audit Trail */}
            {load.auditTrail && (
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 2, sm: 2.5 },
                  borderRadius: { xs: '12px', sm: '16px' },
                  border: '1px solid #ECECEC',
                  bgcolor: '#FFFFFF',
                }}
              >
                <SectionHeader title="Audit Trail" icon={Info} />
                <Typography variant="body2" sx={{ fontSize: '0.7rem', whiteSpace: 'pre-wrap', color: '#6B7280' }}>
                  {load.auditTrail}
                </Typography>
              </Paper>
            )}
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default LoadDetails;
