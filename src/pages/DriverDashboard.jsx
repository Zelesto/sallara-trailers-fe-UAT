// src/pages/drivers/DriverDashboard.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Avatar,
  IconButton,
  Button,
  Chip,
  Grid,
  Paper,
  Stack,
  Divider,
  Tab,
  Tabs,
  LinearProgress,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  InputAdornment,
  ToggleButton,
  ToggleButtonGroup,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Route as RouteIcon,
  Assessment as AssessmentIcon,
  AccessTime as AccessTimeIcon,
  BeachAccess as BeachAccessIcon,
  Description as DescriptionIcon,
  Info as InfoIcon,
  ArrowBack as ArrowBackIcon,
  Star as StarIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Edit as EditIcon,
  Close as CloseIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  Upload as UploadIcon,
  CloudUpload as CloudUploadIcon,
  Cancel as CancelIcon,
  PlayArrow as PlayArrowIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  Coffee as CoffeeIcon,
  LunchDining as LunchDiningIcon,
  Security as SecurityIcon,
  TrendingUp as TrendingUpIcon,
  Timer as TimerIcon,
} from '@mui/icons-material';
import driverService from '../services/driverService';
import timesheetService from '../services/timesheetService';
import leaveService from '../services/leaveService';
import tripService from '../services/tripService';
import documentService from '../services/documentService';
import { ResponsiveContainer } from '../components/ResponsiveContainer';

// ============================================================
// SAFE VALUE HELPER
// ============================================================
const safeValue = (val) => {
  if (val === undefined || val === null) return 'N/A';
  if (typeof val === 'object' && val !== null) {
    if (val instanceof Date) {
      return val.toLocaleDateString();
    }
    if (React.isValidElement(val)) {
      return val;
    }
    try {
      return JSON.stringify(val);
    } catch {
      return 'N/A';
    }
  }
  return val;
};

// ============================================================
// NAVIGATION TABS
// ============================================================
const DriverNavigationTabs = ({ activeTab, setActiveTab }) => {
  const handleChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const tabs = [
    { label: 'Overview', icon: <DashboardIcon sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }} /> },
    { label: 'Timesheet', icon: <AccessTimeIcon sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }} /> },
    { label: 'Leave', icon: <BeachAccessIcon sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }} /> },
    { label: 'Trips', icon: <RouteIcon sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }} /> },
    { label: 'Performance', icon: <AssessmentIcon sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }} /> },
    { label: 'Documents', icon: <DescriptionIcon sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }} /> },
    { label: 'Notes', icon: <InfoIcon sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }} /> },
  ];

  return (
    <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3, overflowX: 'auto' }}>
      <Tabs
        value={activeTab}
        onChange={handleChange}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          '& .MuiTab-root': {
            fontWeight: 500,
            fontSize: { xs: '0.7rem', sm: '0.8rem' },
            textTransform: 'none',
            minWidth: 'auto',
            px: { xs: 1, sm: 2 },
            py: { xs: 1, sm: 1.5 },
            color: '#6B7280',
            '&.Mui-selected': {
              color: '#4F46E5',
              fontWeight: 600,
            },
          },
          '& .MuiTabs-indicator': {
            backgroundColor: '#4F46E5',
            height: 3,
            borderRadius: '3px 3px 0 0',
          },
        }}
      >
        {tabs.map((tab) => (
          <Tab 
            key={tab.label} 
            label={tab.label} 
            icon={tab.icon} 
            iconPosition="start"
            sx={{ '& .MuiTab-iconWrapper': { mr: { xs: 0.5, sm: 1 } } }}
          />
        ))}
      </Tabs>
    </Box>
  );
};

// ============================================================
// PUNCH CLOCK COMPONENT
// ============================================================
const PunchClock = ({ onPunch, currentStatus, loading }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [punchType, setPunchType] = useState('CLOCK_IN');

  const getStatusColor = () => {
    switch(currentStatus) {
      case 'CLOCKED_IN': return '#22C55E';
      case 'ON_BREAK': return '#F59E0B';
      case 'CLOCKED_OUT': return '#6B7280';
      default: return '#4F46E5';
    }
  };

  const getStatusLabel = () => {
    switch(currentStatus) {
      case 'CLOCKED_IN': return 'Clocked In';
      case 'ON_BREAK': return 'On Break';
      case 'CLOCKED_OUT': return 'Clocked Out';
      default: return 'Not Clocked In';
    }
  };

  const punchOptions = [
    { value: 'CLOCK_IN', label: 'Clock In', icon: <PlayArrowIcon sx={{ fontSize: '0.9rem' }} />, color: '#22C55E' },
    { value: 'BREAK_START', label: 'Start Break', icon: <CoffeeIcon sx={{ fontSize: '0.9rem' }} />, color: '#F59E0B' },
    { value: 'BREAK_END', label: 'End Break', icon: <LunchDiningIcon sx={{ fontSize: '0.9rem' }} />, color: '#3B82F6' },
    { value: 'CLOCK_OUT', label: 'Clock Out', icon: <StopIcon sx={{ fontSize: '0.9rem' }} />, color: '#EF4444' },
  ];

  const handlePunch = () => {
    if (onPunch) {
      onPunch(punchType);
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, sm: 3 },
        borderRadius: { xs: '12px', sm: '16px' },
        border: '1px solid #ECECEC',
        bgcolor: '#FFFFFF',
        textAlign: 'center',
      }}
    >
      <Stack spacing={2} alignItems="center">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              width: { xs: 10, sm: 12 },
              height: { xs: 10, sm: 12 },
              borderRadius: '50%',
              bgcolor: getStatusColor(),
              animation: currentStatus === 'CLOCKED_IN' ? 'pulse 2s infinite' : 'none',
              '@keyframes pulse': {
                '0%': { opacity: 1 },
                '50%': { opacity: 0.5 },
                '100%': { opacity: 1 },
              },
            }}
          />
          <Typography variant="body2" sx={{ fontWeight: 600, color: '#111827', fontSize: { xs: '0.75rem', sm: '0.85rem' } }}>
            {getStatusLabel()}
          </Typography>
        </Box>

        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h2" sx={{ fontWeight: 700, color: '#111827', fontFamily: 'monospace', fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' } }}>
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </Typography>
          <Typography variant="caption" sx={{ color: '#6B7280', fontSize: { xs: '0.6rem', sm: '0.7rem' } }}>
            {new Date().toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </Typography>
        </Box>

        <ToggleButtonGroup
          value={punchType}
          exclusive
          onChange={(e, value) => value && setPunchType(value)}
          sx={{ 
            flexWrap: 'wrap', 
            gap: 1,
            '& .MuiToggleButton-root': {
              borderRadius: '8px !important',
              border: '1px solid #ECECEC',
              px: { xs: 1, sm: 2 },
              py: { xs: 0.75, sm: 1 },
              fontSize: { xs: '0.65rem', sm: '0.75rem' },
              '&.Mui-selected': {
                backgroundColor: '#EEF2FF',
                borderColor: '#4F46E5',
                color: '#4F46E5',
              },
            },
          }}
        >
          {punchOptions.map((option) => (
            <ToggleButton key={option.value} value={option.value}>
              <Stack direction="row" spacing={0.5} alignItems="center">
                {option.icon}
                <Typography variant="body2" sx={{ fontSize: { xs: '0.6rem', sm: '0.75rem' } }}>
                  {isMobile ? option.label.replace(' ', '') : option.label}
                </Typography>
              </Stack>
            </ToggleButton>
          ))}
        </ToggleButtonGroup>

        <Button
          variant="contained"
          size="large"
          onClick={handlePunch}
          disabled={loading}
          sx={{
            minWidth: { xs: '100%', sm: 200 },
            py: { xs: 1, sm: 1.5 },
            borderRadius: '12px',
            textTransform: 'none',
            fontWeight: 600,
            fontSize: { xs: '0.8rem', sm: '1rem' },
            background: `linear-gradient(135deg, ${punchOptions.find(o => o.value === punchType)?.color || '#4F46E5'} 0%, ${punchOptions.find(o => o.value === punchType)?.color || '#4F46E5'} 100%)`,
            '&:hover': {
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              opacity: 0.9,
            },
          }}
          startIcon={punchOptions.find(o => o.value === punchType)?.icon}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : punchOptions.find(o => o.value === punchType)?.label}
        </Button>

        <Box sx={{ width: '100%', mt: 1 }}>
          <Typography variant="caption" sx={{ color: '#6B7280', display: 'block', mb: 1, fontSize: { xs: '0.55rem', sm: '0.65rem' } }}>
            Today's Activity
          </Typography>
          <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap">
            <Chip
              icon={<PlayArrowIcon sx={{ fontSize: '0.6rem' }} />}
              label="Clock In"
              size="small"
              sx={{ bgcolor: '#D1FAE5', color: '#065F46', fontSize: { xs: '0.5rem', sm: '0.6rem' }, height: { xs: 18, sm: 22 } }}
            />
            <Chip
              icon={<CoffeeIcon sx={{ fontSize: '0.6rem' }} />}
              label="Break Start"
              size="small"
              sx={{ bgcolor: '#FEF3C7', color: '#92400E', fontSize: { xs: '0.5rem', sm: '0.6rem' }, height: { xs: 18, sm: 22 } }}
            />
            <Chip
              icon={<LunchDiningIcon sx={{ fontSize: '0.6rem' }} />}
              label="Break End"
              size="small"
              sx={{ bgcolor: '#DBEAFE', color: '#1E40AF', fontSize: { xs: '0.5rem', sm: '0.6rem' }, height: { xs: 18, sm: 22 } }}
            />
            <Chip
              icon={<StopIcon sx={{ fontSize: '0.6rem' }} />}
              label="Clock Out"
              size="small"
              sx={{ bgcolor: '#FEE2E2', color: '#991B1B', fontSize: { xs: '0.5rem', sm: '0.6rem' }, height: { xs: 18, sm: 22 } }}
            />
          </Stack>
        </Box>
      </Stack>
    </Paper>
  );
};

// ============================================================
// STAT CARD (Matches Dashboard)
// ============================================================
const StatCard = ({ title, value, subtitle, icon: Icon, color = '#4F46E5', loading }) => {
  // ✅ Ensure value is safe for rendering
  const displayValue = safeValue(value);
  
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
          borderColor: color,
        },
      }}
    >
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
          {loading ? (
            <CircularProgress size={20} sx={{ mt: 0.5 }} />
          ) : (
            <>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  color: '#111827',
                  fontSize: { xs: '1.2rem', sm: '1.4rem', md: '1.6rem', lg: '1.8rem' },
                  lineHeight: 1.2,
                }}
              >
                {displayValue}
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
            </>
          )}
        </Box>
        {Icon && (
          <Box
            sx={{
              bgcolor: `${color}15`,
              borderRadius: { xs: '10px', sm: '12px' },
              p: { xs: 1, sm: 1.25, md: 1.5 },
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Icon sx={{ color: color, fontSize: { xs: '1.2rem', sm: '1.4rem', md: '1.6rem' } }} />
          </Box>
        )}
      </Stack>
    </Paper>
  );
};

// ============================================================
// INFO ROW - FIXED
// ============================================================
const InfoRow = ({ label, value }) => {
  // ✅ Use safeValue helper
  const displayValue = safeValue(value);
  
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5, borderBottom: '1px solid #F3F4F6' }}>
      <Typography variant="body2" sx={{ color: '#6B7280', fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ color: '#111827', fontSize: { xs: '0.65rem', sm: '0.75rem' }, fontWeight: 500 }}>
        {displayValue}
      </Typography>
    </Box>
  );
};

// ============================================================
// NOTIFICATION BANNER
// ============================================================
const NotificationBanner = ({ icon, message, onClose, severity = 'info' }) => {
  const getBackgroundColor = () => {
    switch (severity) {
      case 'warning': return '#FEF3C7';
      case 'error': return '#FEE2E2';
      case 'success': return '#D1FAE5';
      default: return '#DBEAFE';
    }
  };

  const getIconColor = () => {
    switch (severity) {
      case 'warning': return '#F59E0B';
      case 'error': return '#EF4444';
      case 'success': return '#10B981';
      default: return '#3B82F6';
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 1.5, sm: 2 },
        mb: 1.5,
        borderRadius: { xs: '12px', sm: '16px' },
        border: '1px solid #ECECEC',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: { xs: '52px', sm: '60px' },
        backgroundColor: '#FFFFFF',
        transition: 'all 0.2s ease',
        '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.05)' },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1 }}>
        <Box
          sx={{
            bgcolor: getBackgroundColor(),
            borderRadius: '50%',
            width: { xs: 30, sm: 36 },
            height: { xs: 30, sm: 36 },
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {React.cloneElement(icon, { sx: { color: getIconColor(), fontSize: { xs: '1rem', sm: '1.2rem' } } })}
        </Box>
        <Typography variant="body2" sx={{ color: '#111827', fontSize: { xs: '0.75rem', sm: '0.85rem' } }}>
          {message}
        </Typography>
      </Box>
      <IconButton size="small" onClick={onClose} sx={{ color: '#6B7280', flexShrink: 0, p: { xs: 0.25, sm: 0.5 } }}>
        <CloseIcon sx={{ fontSize: { xs: '0.8rem', sm: '1rem' } }} />
      </IconButton>
    </Paper>
  );
};

// ============================================================
// OVERVIEW TAB - FIXED
// ============================================================
const OverviewTab = ({ driver, leaveData, timesheetData, loading }) => {
  const fullName = `${driver?.firstName || ''} ${driver?.lastName || ''}`.trim();
  const rating = driver?.performanceScore ? (driver.performanceScore / 20).toFixed(1) : '0.0';
  const totalTrips = driver?.totalTrips || 0;
  const monthlyTrips = driver?.monthlyTrips || 0;
  const totalDistance = driver?.totalDistance || 0;
  const hireDate = driver?.hireDate ? new Date(driver.hireDate) : null;
  const yearsWithCompany = hireDate ? Math.floor((new Date() - hireDate) / (1000 * 60 * 60 * 24 * 365)) : 0;

  const thisWeekHours = timesheetData?.reduce((acc, entry) => {
    const date = entry.entryDate || entry.date;
    if (!date) return acc;
    const entryDate = new Date(date);
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    if (entryDate >= startOfWeek && entryDate <= today) {
      const start = entry.startTime;
      const end = entry.endTime;
      if (start && end) {
        try {
          const startTime = new Date(`1970-01-01T${start}`);
          const endTime = new Date(`1970-01-01T${end}`);
          acc += (endTime - startTime) / (1000 * 60 * 60);
        } catch {
          // Ignore invalid times
        }
      }
    }
    return acc;
  }, 0);

  const pendingLeaveCount = leaveData?.filter(l => 
    l.status === 'PENDING' || l.status === 'pending'
  ).length || 0;

  const leaveBalanceValue = leaveData?.filter(l => 
    l.status === 'APPROVED' || l.status === 'approved'
  ).length || 0;

  // ✅ Create safe values for StatCard
  const statValues = {
    totalTrips: safeValue(totalTrips),
    monthlyTrips: safeValue(monthlyTrips),
    rating: safeValue(`${rating} ★`),
    performanceScore: safeValue(`${driver?.performanceScore || 0}%`),
    thisWeekHours: safeValue(`${thisWeekHours.toFixed(1)}h`),
    timesheetEntries: safeValue(timesheetData?.length || 0),
    leaveBalance: safeValue(`${leaveBalanceValue} days`),
    pendingLeave: safeValue(pendingLeaveCount),
  };

  return (
    <Grid container spacing={{ xs: 1.5, sm: 2, md: 2.5 }} sx={{ mb: 3 }}>
      <Grid size={{ xs: 6, sm: 3 }}>
        <StatCard
          title="Total Trips"
          value={statValues.totalTrips}
          subtitle={`${statValues.monthlyTrips} this month`}
          icon={<RouteIcon />}
          color="#4F46E5"
          loading={loading}
        />
      </Grid>
      <Grid size={{ xs: 6, sm: 3 }}>
        <StatCard
          title="Rating"
          value={statValues.rating}
          subtitle={`${statValues.performanceScore} performance`}
          icon={<StarIcon />}
          color="#F59E0B"
          loading={loading}
        />
      </Grid>
      <Grid size={{ xs: 6, sm: 3 }}>
        <StatCard
          title="This Week"
          value={statValues.thisWeekHours}
          subtitle={`${statValues.timesheetEntries} entries`}
          icon={<AccessTimeIcon />}
          color="#8B5CF6"
          loading={loading}
        />
      </Grid>
      <Grid size={{ xs: 6, sm: 3 }}>
        <StatCard
          title="Leave Balance"
          value={statValues.leaveBalance}
          subtitle={`${statValues.pendingLeave} pending requests`}
          icon={<BeachAccessIcon />}
          color="#22C55E"
          loading={loading}
        />
      </Grid>

      <Grid size={{ xs: 12 }}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, sm: 3 },
            borderRadius: { xs: '12px', sm: '16px' },
            border: '1px solid #ECECEC',
            bgcolor: '#FFFFFF',
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600, fontSize: { xs: '0.9rem', sm: '1rem' }, mb: 2 }}>
            Driver Information
          </Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <InfoRow label="Full Name" value={fullName || 'N/A'} />
              <InfoRow label="License Number" value={driver?.licenseNumber || 'N/A'} />
              <InfoRow label="License Type" value={driver?.licenseType || 'N/A'} />
              <InfoRow label="License Expiry" value={driver?.licenseExpiry ? new Date(driver.licenseExpiry).toLocaleDateString() : 'N/A'} />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <InfoRow label="Phone" value={driver?.phoneNumber || 'N/A'} />
              <InfoRow label="Email" value={driver?.email || 'N/A'} />
              <InfoRow label="Hire Date" value={driver?.hireDate ? new Date(driver.hireDate).toLocaleDateString() : 'N/A'} />
              <InfoRow label="Years with Company" value={`${yearsWithCompany} years`} />
              <InfoRow label="Total Distance" value={`${(totalDistance || 0).toLocaleString()} km`} />
            </Grid>
          </Grid>
        </Paper>
      </Grid>
    </Grid>
  );
};

// ============================================================
// PERFORMANCE TAB
// ============================================================
const PerformanceTab = ({ driver, trips, loading }) => {
  const totalTrips = driver?.totalTrips || trips?.length || 0;
  const completedTrips = trips?.filter(t => t.status === 'COMPLETED' || t.status === 'FINALIZED').length || 0;
  const onTimeRate = totalTrips > 0 ? Math.round((completedTrips / totalTrips) * 100) : 0;
  const avgRating = driver?.performanceScore ? (driver.performanceScore / 20).toFixed(1) : '0.0';
  const safetyScore = driver?.safetyScore || 85;
  const efficiency = driver?.efficiencyScore || 0;
  
  const metrics = [
    { label: 'On-Time Rate', value: `${onTimeRate}%`, color: '#22C55E', icon: <TimerIcon sx={{ fontSize: '0.9rem' }} /> },
    { label: 'Avg Rating', value: `${avgRating} ★`, color: '#F59E0B', icon: <StarIcon sx={{ fontSize: '0.9rem' }} /> },
    { label: 'Safety Score', value: `${safetyScore}%`, color: '#4F46E5', icon: <SecurityIcon sx={{ fontSize: '0.9rem' }} /> },
    { label: 'Efficiency', value: `${efficiency}%`, color: '#8B5CF6', icon: <TrendingUpIcon sx={{ fontSize: '0.9rem' }} /> },
  ];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
        <CircularProgress size={40} />
      </Box>
    );
  }

  return (
    <Grid container spacing={{ xs: 1.5, sm: 2, md: 3 }}>
      <Grid size={{ xs: 12 }}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, sm: 3 },
            borderRadius: { xs: '12px', sm: '16px' },
            border: '1px solid #ECECEC',
            bgcolor: '#FFFFFF',
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600, fontSize: { xs: '0.9rem', sm: '1rem' }, mb: 2 }}>
            Performance Score
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems="center">
            <Box sx={{ position: 'relative', display: 'inline-flex' }}>
              <CircularProgress
                variant="determinate"
                value={driver?.performanceScore || 0}
                size={120}
                thickness={8}
                sx={{ color: '#4F46E5' }}
              />
              <Box
                sx={{
                  top: 0,
                  left: 0,
                  bottom: 0,
                  right: 0,
                  position: 'absolute',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Typography variant="h3" component="div" sx={{ fontWeight: 700, color: '#111827', fontSize: { xs: '1.5rem', sm: '2rem' } }}>
                  {driver?.performanceScore || 0}%
                </Typography>
              </Box>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={{ color: '#6B7280', mb: 1, fontSize: { xs: '0.75rem', sm: '0.85rem' } }}>
                Overall performance rating based on multiple metrics
              </Typography>
              <Grid container spacing={1}>
                <Grid size={{ xs: 6 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircleIcon sx={{ color: '#22C55E', fontSize: { xs: '0.8rem', sm: '1rem' } }} />
                    <Typography variant="caption" sx={{ color: '#111827', fontSize: { xs: '0.6rem', sm: '0.7rem' } }}>
                      {totalTrips} Trips Completed
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <StarIcon sx={{ color: '#F59E0B', fontSize: { xs: '0.8rem', sm: '1rem' } }} />
                    <Typography variant="caption" sx={{ color: '#111827', fontSize: { xs: '0.6rem', sm: '0.7rem' } }}>
                      {avgRating} ★ Rating
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Stack>
        </Paper>
      </Grid>

      {metrics.map((metric, index) => (
        <Grid size={{ xs: 12, sm: 6 }} key={index}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, sm: 2.5 },
              borderRadius: { xs: '10px', sm: '12px' },
              border: '1px solid #ECECEC',
              bgcolor: '#FFFFFF',
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Box sx={{ color: metric.color }}>{metric.icon}</Box>
                <Typography variant="body2" sx={{ fontWeight: 500, color: '#111827', fontSize: { xs: '0.7rem', sm: '0.8rem' } }}>
                  {metric.label}
                </Typography>
              </Stack>
              <Typography variant="body2" sx={{ fontWeight: 700, color: metric.color, fontSize: { xs: '0.7rem', sm: '0.8rem' } }}>
                {metric.value}
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={parseInt(metric.value)}
              sx={{
                height: 6,
                borderRadius: 3,
                bgcolor: '#F3F4F6',
                '& .MuiLinearProgress-bar': {
                  bgcolor: metric.color,
                  borderRadius: 3,
                },
              }}
            />
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
};

// ============================================================
// TRIPS TAB
// ============================================================
const TripsTab = ({ trips, loading }) => {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
        <CircularProgress size={40} />
      </Box>
    );
  }

  if (!trips || trips.length === 0) {
    return (
      <Box sx={{ py: 4, textAlign: 'center' }}>
        <RouteIcon sx={{ fontSize: 48, color: '#D1D5DB', mb: 2 }} />
        <Typography variant="body1" color="text.secondary" sx={{ fontSize: '0.9rem' }}>
          No trips found for this driver
        </Typography>
      </Box>
    );
  }

  const getTripNumber = (trip) => {
    return trip.tripNumber || trip.id || trip.tripId || `#${trip.id}`;
  };

  const getRouteDisplay = (trip) => {
    const origin = trip.originCity || trip.originLocation || trip.origin?.city || trip.origin?.location || 'Origin';
    const destination = trip.destinationCity || trip.destinationLocation || trip.destination?.city || trip.destination?.location || 'Destination';
    return `${origin} → ${destination}`;
  };

  const getStatusChip = (status) => {
    const statusMap = {
      'COMPLETED': { bg: '#D1FAE5', color: '#065F46', label: 'Completed' },
      'FINALIZED': { bg: '#D1FAE5', color: '#065F46', label: 'Finalized' },
      'IN_PROGRESS': { bg: '#FEF3C7', color: '#92400E', label: 'In Progress' },
      'PLANNED': { bg: '#DBEAFE', color: '#1E40AF', label: 'Planned' },
      'ASSIGNED': { bg: '#E0E7FF', color: '#3730A3', label: 'Assigned' },
      'ACTIVE': { bg: '#FEF3C7', color: '#92400E', label: 'Active' },
      'CANCELLED': { bg: '#FEE2E2', color: '#991B1B', label: 'Cancelled' },
      'DELAYED': { bg: '#FEF3C7', color: '#92400E', label: 'Delayed' },
      'DRAFT': { bg: '#F3F4F6', color: '#6B7280', label: 'Draft' },
    };
    const config = statusMap[status] || { bg: '#F3F4F6', color: '#6B7280', label: status || 'Unknown' };
    return (
      <Chip
        label={config.label}
        size="small"
        sx={{
          fontSize: { xs: '0.45rem', sm: '0.55rem' },
          height: { xs: 16, sm: 20 },
          bgcolor: config.bg,
          color: config.color,
          fontWeight: 500,
        }}
      />
    );
  };

  const getVehicleDisplay = (trip) => {
    return trip.vehicle?.registrationNumber || 
           trip.vehicleRegistration || 
           trip.vehicle?.registration || 
           trip.assignedVehicle?.registrationNumber ||
           'N/A';
  };

  const getTripDate = (trip) => {
    const date = trip.plannedStartDate || trip.startDate || trip.date || trip.createdAt;
    if (date) {
      try {
        return new Date(date).toLocaleDateString();
      } catch {
        return 'N/A';
      }
    }
    return 'N/A';
  };

  const getTripDistance = (trip) => {
    const distance = trip.totalDistance || trip.distance || trip.estimatedDistance || trip.plannedDistanceKm;
    return distance ? `${distance} km` : 'N/A';
  };

  return (
    <TableContainer component={Paper} sx={{ borderRadius: '12px', border: '1px solid #ECECEC', overflow: 'auto' }}>
      <Table size="small">
        <TableHead sx={{ bgcolor: '#F9FAFB' }}>
          <TableRow>
            <TableCell sx={{ fontWeight: 600, fontSize: { xs: '0.65rem', sm: '0.75rem' }, color: '#6B7280' }}>Trip #</TableCell>
            <TableCell sx={{ fontWeight: 600, fontSize: { xs: '0.65rem', sm: '0.75rem' }, color: '#6B7280' }}>Route</TableCell>
            <TableCell sx={{ fontWeight: 600, fontSize: { xs: '0.65rem', sm: '0.75rem' }, color: '#6B7280' }}>Status</TableCell>
            <TableCell sx={{ fontWeight: 600, fontSize: { xs: '0.65rem', sm: '0.75rem' }, color: '#6B7280' }}>Vehicle</TableCell>
            <TableCell sx={{ fontWeight: 600, fontSize: { xs: '0.65rem', sm: '0.75rem' }, color: '#6B7280' }}>Date</TableCell>
            <TableCell sx={{ fontWeight: 600, fontSize: { xs: '0.65rem', sm: '0.75rem' }, color: '#6B7280' }}>Distance</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {trips.map((trip) => (
            <TableRow key={trip.id || trip.tripId} hover>
              <TableCell>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#4F46E5', fontSize: { xs: '0.7rem', sm: '0.8rem' } }}>
                  {getTripNumber(trip)}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2" sx={{ fontSize: { xs: '0.6rem', sm: '0.75rem' } }}>
                  {getRouteDisplay(trip)}
                </Typography>
              </TableCell>
              <TableCell>
                {getStatusChip(trip.status)}
              </TableCell>
              <TableCell sx={{ fontSize: { xs: '0.6rem', sm: '0.75rem' } }}>
                {getVehicleDisplay(trip)}
              </TableCell>
              <TableCell sx={{ fontSize: { xs: '0.6rem', sm: '0.75rem' } }}>
                {getTripDate(trip)}
              </TableCell>
              <TableCell sx={{ fontSize: { xs: '0.6rem', sm: '0.75rem' } }}>
                {getTripDistance(trip)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

// ============================================================
// LEAVE TAB
// ============================================================
const LeaveTab = ({ 
  leaveData, 
  loading, 
  onRequestLeave, 
  onCancelLeave,
  onOpenApproveDialog 
}) => {
  const [openDialog, setOpenDialog] = useState(false);
  const [newLeave, setNewLeave] = useState({
    type: 'ANNUAL',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    reason: '',
    notes: '',
  });

  const calculateBalances = (data) => {
    const balances = { annual: 21, sick: 10, study: 5, unpaid: 0 };
    const used = { annual: 0, sick: 0, study: 0, unpaid: 0 };
    
    data?.forEach(leave => {
      const type = leave.leaveType?.name || leave.leaveType?.type || leave.type;
      if (type && (leave.status === 'APPROVED' || leave.status === 'approved')) {
        const days = Math.ceil(
          (new Date(leave.endDate) - new Date(leave.startDate)) / (1000 * 60 * 60 * 24)
        ) + 1;
        const key = type.toLowerCase();
        if (used[key] !== undefined) {
          used[key] += days;
        }
      }
    });
    
    return {
      annual: { total: balances.annual, used: used.annual, remaining: Math.max(0, balances.annual - used.annual) },
      sick: { total: balances.sick, used: used.sick, remaining: Math.max(0, balances.sick - used.sick) },
      study: { total: balances.study, used: used.study, remaining: Math.max(0, balances.study - used.study) },
      unpaid: { total: balances.unpaid, used: used.unpaid, remaining: Math.max(0, balances.unpaid - used.unpaid) },
    };
  };

  const leaveBalances = calculateBalances(leaveData);

  const handleRequestLeave = () => {
    onRequestLeave(newLeave);
    setOpenDialog(false);
    setNewLeave({
      type: 'ANNUAL',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      reason: '',
      notes: '',
    });
  };

  const getLeaveTypeLabel = (leave) => {
    return leave.leaveType?.name || leave.leaveType?.type || leave.type || 'N/A';
  };

  const getLeaveTypeColor = (leave) => {
    const type = leave.leaveType?.name || leave.leaveType?.type || leave.type;
    switch(type) {
      case 'ANNUAL': return { bg: '#DBEAFE', color: '#1E40AF' };
      case 'SICK': return { bg: '#D1FAE5', color: '#065F46' };
      case 'STUDY': return { bg: '#FEF3C7', color: '#92400E' };
      default: return { bg: '#F3F4F6', color: '#6B7280' };
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
        <CircularProgress size={40} />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
          Leave Management
        </Typography>
        <Button
          variant="contained"
          size="small"
          startIcon={<AddIcon sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem' } }} />}
          onClick={() => setOpenDialog(true)}
          sx={{
            fontSize: { xs: '0.65rem', sm: '0.75rem' },
            borderRadius: '8px',
            textTransform: 'none',
            background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #4338CA 0%, #4F46E5 100%)',
            },
          }}
        >
          Request Leave
        </Button>
      </Box>

      <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: { xs: '0.75rem', sm: '0.85rem' }, mb: 2 }}>
        Leave Balances
      </Typography>
      <Grid container spacing={{ xs: 1.5, sm: 2 }} sx={{ mb: 3 }}>
        {Object.entries(leaveBalances).map(([key, balance]) => (
          <Grid size={{ xs: 6, sm: 3 }} key={key}>
            <Paper
              elevation={0}
              sx={{
                p: { xs: 2, sm: 2.5 },
                borderRadius: '12px',
                border: '1px solid #ECECEC',
                textAlign: 'center',
                bgcolor: '#FFFFFF',
                transition: 'all 0.2s ease',
                '&:hover': {
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                  transform: 'translateY(-2px)',
                },
              }}
            >
              <Typography variant="caption" sx={{ color: '#6B7280', textTransform: 'uppercase', fontWeight: 600, fontSize: { xs: '0.5rem', sm: '0.6rem' } }}>
                {key} Leave
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: 0.5, mt: 1 }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#4F46E5', fontSize: { xs: '1.2rem', sm: '1.5rem' } }}>
                  {balance.remaining}
                </Typography>
                <Typography variant="caption" sx={{ color: '#6B7280', fontSize: { xs: '0.6rem', sm: '0.7rem' } }}>
                  / {balance.total}
                </Typography>
              </Box>
              <Box sx={{ mt: 1 }}>
                <LinearProgress
                  variant="determinate"
                  value={balance.total > 0 ? (balance.used / balance.total) * 100 : 0}
                  sx={{
                    height: 4,
                    borderRadius: 2,
                    bgcolor: '#F3F4F6',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: '#4F46E5',
                      borderRadius: 2,
                    },
                  }}
                />
                <Typography variant="caption" sx={{ color: '#6B7280', display: 'block', mt: 0.5, fontSize: { xs: '0.5rem', sm: '0.6rem' } }}>
                  Used: {balance.used} / Remaining: {balance.remaining}
                </Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: { xs: '0.75rem', sm: '0.85rem' }, mb: 2 }}>
        Leave Requests
      </Typography>
      <TableContainer component={Paper} sx={{ borderRadius: '12px', border: '1px solid #ECECEC', overflow: 'auto' }}>
        <Table size="small">
          <TableHead sx={{ bgcolor: '#F9FAFB' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, fontSize: { xs: '0.65rem', sm: '0.75rem' }, color: '#6B7280' }}>Type</TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: { xs: '0.65rem', sm: '0.75rem' }, color: '#6B7280' }}>Start Date</TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: { xs: '0.65rem', sm: '0.75rem' }, color: '#6B7280' }}>End Date</TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: { xs: '0.65rem', sm: '0.75rem' }, color: '#6B7280' }}>Duration</TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: { xs: '0.65rem', sm: '0.75rem' }, color: '#6B7280' }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: { xs: '0.65rem', sm: '0.75rem' }, color: '#6B7280' }}>Reason</TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: { xs: '0.65rem', sm: '0.75rem' }, color: '#6B7280' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {leaveData?.length > 0 ? (
              leaveData.map((leave) => {
                const duration = Math.ceil(
                  (new Date(leave.endDate) - new Date(leave.startDate)) / (1000 * 60 * 60 * 24)
                ) + 1;
                const typeColors = getLeaveTypeColor(leave);
                const leaveTypeLabel = getLeaveTypeLabel(leave);
                
                return (
                  <TableRow key={leave.id} hover>
                    <TableCell>
                      <Chip
                        label={leaveTypeLabel}
                        size="small"
                        sx={{
                          fontSize: { xs: '0.45rem', sm: '0.55rem' },
                          height: { xs: 16, sm: 20 },
                          bgcolor: typeColors.bg,
                          color: typeColors.color,
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                      {new Date(leave.startDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                      {new Date(leave.endDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' }, fontWeight: 600 }}>
                      {duration} days
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={leave.status}
                        size="small"
                        sx={{
                          fontSize: { xs: '0.45rem', sm: '0.55rem' },
                          height: { xs: 16, sm: 20 },
                          bgcolor: leave.status === 'APPROVED' || leave.status === 'approved' ? '#D1FAE5' :
                                  leave.status === 'PENDING' || leave.status === 'pending' ? '#FEF3C7' :
                                  leave.status === 'REJECTED' || leave.status === 'rejected' ? '#FEE2E2' : '#F3F4F6',
                          color: leave.status === 'APPROVED' || leave.status === 'approved' ? '#065F46' :
                                 leave.status === 'PENDING' || leave.status === 'pending' ? '#92400E' :
                                 leave.status === 'REJECTED' || leave.status === 'rejected' ? '#991B1B' : '#6B7280',
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' }, color: '#6B7280' }}>
                      {leave.reason || '-'}
                    </TableCell>
                    <TableCell>
                      {(leave.status === 'PENDING' || leave.status === 'pending') && (
                        <Stack direction="row" spacing={0.5}>
                          <Tooltip title="Approve" arrow>
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => onOpenApproveDialog(leave, 'APPROVE')}
                              sx={{ p: { xs: 0.25, sm: 0.5 } }}
                            >
                              <CheckCircleIcon sx={{ fontSize: { xs: '0.7rem', sm: '0.9rem' } }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Reject" arrow>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => onOpenApproveDialog(leave, 'REJECT')}
                              sx={{ p: { xs: 0.25, sm: 0.5 } }}
                            >
                              <CancelIcon sx={{ fontSize: { xs: '0.7rem', sm: '0.9rem' } }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Cancel Request" arrow>
                            <IconButton
                              size="small"
                              color="warning"
                              onClick={() => onCancelLeave(leave.id)}
                              sx={{ p: { xs: 0.25, sm: 0.5 } }}
                            >
                              <DeleteIcon sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem' } }} />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      )}
                      {(leave.status !== 'PENDING' && leave.status !== 'pending') && (
                        <Chip
                          label={leave.status}
                          size="small"
                          sx={{
                            fontSize: { xs: '0.45rem', sm: '0.55rem' },
                            height: { xs: 16, sm: 20 },
                            bgcolor: leave.status === 'APPROVED' || leave.status === 'approved' ? '#D1FAE5' : 
                                     leave.status === 'REJECTED' || leave.status === 'rejected' ? '#FEE2E2' : '#F3F4F6',
                            color: leave.status === 'APPROVED' || leave.status === 'approved' ? '#065F46' : 
                                   leave.status === 'REJECTED' || leave.status === 'rejected' ? '#991B1B' : '#6B7280',
                          }}
                        />
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                    No leave requests found
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600, color: '#111827', fontSize: { xs: '0.9rem', sm: '1rem' } }}>
          Request Leave
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>Leave Type</InputLabel>
              <Select
                value={newLeave.type}
                onChange={(e) => setNewLeave({ ...newLeave, type: e.target.value })}
                label="Leave Type"
                sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem' } }}
              >
                <MenuItem value="ANNUAL" sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem' } }}>Annual Leave</MenuItem>
                <MenuItem value="SICK" sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem' } }}>Sick Leave</MenuItem>
                <MenuItem value="STUDY" sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem' } }}>Study Leave</MenuItem>
                <MenuItem value="UNPAID" sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem' } }}>Unpaid Leave</MenuItem>
                <MenuItem value="OTHER" sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem' } }}>Other</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Start Date"
              type="date"
              value={newLeave.startDate}
              onChange={(e) => setNewLeave({ ...newLeave, startDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
              fullWidth
              size="small"
              sx={{ '& .MuiInputLabel-root': { fontSize: { xs: '0.65rem', sm: '0.75rem' } } }}
            />
            <TextField
              label="End Date"
              type="date"
              value={newLeave.endDate}
              onChange={(e) => setNewLeave({ ...newLeave, endDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
              fullWidth
              size="small"
              sx={{ '& .MuiInputLabel-root': { fontSize: { xs: '0.65rem', sm: '0.75rem' } } }}
            />
            <TextField
              label="Reason"
              value={newLeave.reason}
              onChange={(e) => setNewLeave({ ...newLeave, reason: e.target.value })}
              fullWidth
              size="small"
              placeholder="Reason for leave request"
              sx={{ '& .MuiInputLabel-root': { fontSize: { xs: '0.65rem', sm: '0.75rem' } } }}
            />
            <TextField
              label="Additional Notes"
              multiline
              rows={2}
              value={newLeave.notes}
              onChange={(e) => setNewLeave({ ...newLeave, notes: e.target.value })}
              fullWidth
              size="small"
              sx={{ '& .MuiInputLabel-root': { fontSize: { xs: '0.65rem', sm: '0.75rem' } } }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: { xs: 1.5, sm: 2.5 } }}>
          <Button onClick={() => setOpenDialog(false)} sx={{ color: '#6B7280', fontSize: { xs: '0.7rem', sm: '0.8rem' } }}>
            Cancel
          </Button>
          <Button 
            onClick={handleRequestLeave} 
            variant="contained"
            sx={{
              fontSize: { xs: '0.7rem', sm: '0.8rem' },
              borderRadius: '10px',
              textTransform: 'none',
              background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #4338CA 0%, #4F46E5 100%)',
              },
            }}
          >
            Submit Request
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// ============================================================
// TIMESHEET TAB
// ============================================================
const TimesheetTab = ({ 
  timesheetData, 
  loading, 
  onAddEntry, 
  onDeleteEntry, 
  onPunch,
  punchStatus,
  punchLoading,
  onImportTimesheet,
  onExportTimesheet,
}) => {
  const [openDialog, setOpenDialog] = useState(false);
  const [openImportDialog, setOpenImportDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [importProgress, setImportProgress] = useState(0);
  const [importing, setImporting] = useState(false);
  const [newEntry, setNewEntry] = useState({
    date: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '17:00',
    breakDuration: 60,
    activityType: 'DRIVING',
    notes: '',
  });

  const calculateHours = (start, end) => {
    if (!start || !end) return '0';
    try {
      const startTime = new Date(`1970-01-01T${start}`);
      const endTime = new Date(`1970-01-01T${end}`);
      const diff = (endTime - startTime) / (1000 * 60 * 60);
      return diff.toFixed(1);
    } catch {
      return '0';
    }
  };

  const getWeekNumber = (date) => {
    if (!date) return 0;
    const d = new Date(date);
    const startOfYear = new Date(d.getFullYear(), 0, 1);
    const days = Math.floor((d - startOfYear) / (24 * 60 * 60 * 1000));
    return Math.ceil((days + startOfYear.getDay() + 1) / 7);
  };

  const getEntryDate = (entry) => {
    return entry.entryDate || entry.date;
  };

  const weeklySummary = timesheetData?.reduce((acc, entry) => {
    const date = getEntryDate(entry);
    if (!date) return acc;
    const weekNumber = getWeekNumber(date);
    if (!acc[weekNumber]) {
      acc[weekNumber] = { 
        totalHours: 0, 
        entries: 0, 
        weekStart: date 
      };
    }
    if (entry.startTime && entry.endTime) {
      acc[weekNumber].totalHours += parseFloat(calculateHours(entry.startTime, entry.endTime));
    }
    acc[weekNumber].entries += 1;
    return acc;
  }, {});

  const monthlySummary = timesheetData?.reduce((acc, entry) => {
    const date = getEntryDate(entry);
    if (!date) return acc;
    const month = new Date(date).getMonth();
    const year = new Date(date).getFullYear();
    const key = `${year}-${month}`;
    if (!acc[key]) {
      acc[key] = { 
        totalHours: 0, 
        entries: 0, 
        month: new Date(date).toLocaleDateString([], { month: 'long', year: 'numeric' })
      };
    }
    if (entry.startTime && entry.endTime) {
      acc[key].totalHours += parseFloat(calculateHours(entry.startTime, entry.endTime));
    }
    acc[key].entries += 1;
    return acc;
  }, {});

  const handleAddEntry = () => {
    onAddEntry(newEntry);
    setOpenDialog(false);
    setNewEntry({
      date: new Date().toISOString().split('T')[0],
      startTime: '09:00',
      endTime: '17:00',
      breakDuration: 60,
      activityType: 'DRIVING',
      notes: '',
    });
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleImport = () => {
    if (selectedFile) {
      setImporting(true);
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setImportProgress(progress);
        if (progress >= 100) {
          clearInterval(interval);
          setImporting(false);
          setOpenImportDialog(false);
          setSelectedFile(null);
          setImportProgress(0);
          if (onImportTimesheet) {
            onImportTimesheet(selectedFile);
          }
        }
      }, 300);
    }
  };

  const handleExport = () => {
    if (onExportTimesheet) {
      onExportTimesheet();
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString();
    } catch {
      return 'N/A';
    }
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return 'N/A';
    try {
      return new Date(`1970-01-01T${timeStr}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return timeStr;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
        <CircularProgress size={40} />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <PunchClock 
          onPunch={onPunch}
          currentStatus={punchStatus}
          loading={punchLoading}
        />
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
          Timesheet Entries
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Button
            variant="outlined"
            size="small"
            startIcon={<UploadIcon sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem' } }} />}
            onClick={() => setOpenImportDialog(true)}
            sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' }, borderRadius: '8px', textTransform: 'none' }}
          >
            {isMobile ? '' : 'Import'}
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<DownloadIcon sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem' } }} />}
            onClick={handleExport}
            sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' }, borderRadius: '8px', textTransform: 'none' }}
          >
            {isMobile ? '' : 'Export'}
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<PrintIcon sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem' } }} />}
            sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' }, borderRadius: '8px', textTransform: 'none' }}
          >
            {isMobile ? '' : 'Print'}
          </Button>
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem' } }} />}
            onClick={() => setOpenDialog(true)}
            sx={{ 
              fontSize: { xs: '0.65rem', sm: '0.75rem' }, 
              borderRadius: '8px',
              textTransform: 'none',
              background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #4338CA 0%, #4F46E5 100%)',
              },
            }}
          >
            {isMobile ? 'Add' : 'Add Entry'}
          </Button>
        </Stack>
      </Box>

      {weeklySummary && Object.keys(weeklySummary).length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: { xs: '0.75rem', sm: '0.85rem' }, mb: 1.5 }}>
            Weekly Summary
          </Typography>
          <Grid container spacing={{ xs: 1.5, sm: 2 }}>
            {Object.values(weeklySummary).slice(0, 4).map((week, index) => (
              <Grid size={{ xs: 6, sm: 3 }} key={index}>
                <Paper
                  elevation={0}
                  sx={{
                    p: { xs: 1.5, sm: 2 },
                    borderRadius: '12px',
                    border: '1px solid #ECECEC',
                    bgcolor: '#F9FAFB',
                    textAlign: 'center',
                  }}
                >
                  <Typography variant="caption" sx={{ color: '#6B7280', display: 'block', fontSize: { xs: '0.5rem', sm: '0.6rem' } }}>
                    Week {index + 1}
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#4F46E5', mt: 0.5, fontSize: { xs: '1.1rem', sm: '1.3rem' } }}>
                    {week.totalHours.toFixed(1)}h
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#6B7280', fontSize: { xs: '0.5rem', sm: '0.6rem' } }}>
                    {week.entries} entries
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {monthlySummary && Object.keys(monthlySummary).length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: { xs: '0.75rem', sm: '0.85rem' }, mb: 1.5 }}>
            Monthly Summary
          </Typography>
          <Grid container spacing={{ xs: 1.5, sm: 2 }}>
            {Object.values(monthlySummary).slice(0, 3).map((month, index) => (
              <Grid size={{ xs: 6, sm: 3 }} key={index}>
                <Paper
                  elevation={0}
                  sx={{
                    p: { xs: 1.5, sm: 2 },
                    borderRadius: '12px',
                    border: '1px solid #ECECEC',
                    bgcolor: '#F9FAFB',
                    textAlign: 'center',
                  }}
                >
                  <Typography variant="caption" sx={{ color: '#6B7280', display: 'block', fontSize: { xs: '0.5rem', sm: '0.6rem' } }}>
                    {month.month}
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#8B5CF6', mt: 0.5, fontSize: { xs: '1.1rem', sm: '1.3rem' } }}>
                    {month.totalHours.toFixed(1)}h
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#6B7280', fontSize: { xs: '0.5rem', sm: '0.6rem' } }}>
                    {month.entries} entries
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      <TableContainer component={Paper} sx={{ borderRadius: '12px', border: '1px solid #ECECEC', overflow: 'auto' }}>
        <Table size="small">
          <TableHead sx={{ bgcolor: '#F9FAFB' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, fontSize: { xs: '0.65rem', sm: '0.75rem' }, color: '#6B7280' }}>Date</TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: { xs: '0.65rem', sm: '0.75rem' }, color: '#6B7280' }}>Start</TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: { xs: '0.65rem', sm: '0.75rem' }, color: '#6B7280' }}>End</TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: { xs: '0.65rem', sm: '0.75rem' }, color: '#6B7280' }}>Break (min)</TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: { xs: '0.65rem', sm: '0.75rem' }, color: '#6B7280' }}>Hours</TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: { xs: '0.65rem', sm: '0.75rem' }, color: '#6B7280' }}>Activity</TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: { xs: '0.65rem', sm: '0.75rem' }, color: '#6B7280' }}>Notes</TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: { xs: '0.65rem', sm: '0.75rem' }, color: '#6B7280' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {timesheetData?.length > 0 ? (
              timesheetData.map((entry, index) => (
                <TableRow key={entry.id || index} hover>
                  <TableCell sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                    {formatDate(getEntryDate(entry))}
                  </TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                    {formatTime(entry.startTime)}
                  </TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                    {formatTime(entry.endTime)}
                  </TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>{entry.breakDuration || '-'}</TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' }, fontWeight: 600, color: '#4F46E5' }}>
                    {entry.startTime && entry.endTime ? `${calculateHours(entry.startTime, entry.endTime)}h` : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={entry.activityType || 'N/A'}
                      size="small"
                      sx={{
                        fontSize: { xs: '0.45rem', sm: '0.55rem' },
                        height: { xs: 16, sm: 20 },
                        bgcolor: entry.activityType === 'DRIVING' ? '#DBEAFE' : 
                                entry.activityType === 'REST' ? '#D1FAE5' : 
                                entry.activityType === 'LOADING' ? '#FEF3C7' : '#EDE9FE',
                        color: entry.activityType === 'DRIVING' ? '#1E40AF' : 
                               entry.activityType === 'REST' ? '#065F46' : 
                               entry.activityType === 'LOADING' ? '#92400E' : '#5B21B6',
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' }, color: '#6B7280' }}>
                    {entry.notes || '-'}
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => onDeleteEntry(entry.id)}
                      sx={{ p: { xs: 0.25, sm: 0.5 } }}
                    >
                      <DeleteIcon sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem' } }} />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                    No timesheet entries found
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialogs */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600, color: '#111827', fontSize: { xs: '0.9rem', sm: '1rem' } }}>
          Add Timesheet Entry
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField
              label="Date"
              type="date"
              value={newEntry.date}
              onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })}
              InputLabelProps={{ shrink: true }}
              fullWidth
              size="small"
              sx={{ '& .MuiInputLabel-root': { fontSize: { xs: '0.65rem', sm: '0.75rem' } } }}
            />
            <Grid container spacing={{ xs: 1, sm: 2 }}>
              <Grid size={{ xs: 6 }}>
                <TextField
                  label="Start Time"
                  type="time"
                  value={newEntry.startTime}
                  onChange={(e) => setNewEntry({ ...newEntry, startTime: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  size="small"
                  sx={{ '& .MuiInputLabel-root': { fontSize: { xs: '0.65rem', sm: '0.75rem' } } }}
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField
                  label="End Time"
                  type="time"
                  value={newEntry.endTime}
                  onChange={(e) => setNewEntry({ ...newEntry, endTime: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  size="small"
                  sx={{ '& .MuiInputLabel-root': { fontSize: { xs: '0.65rem', sm: '0.75rem' } } }}
                />
              </Grid>
            </Grid>
            <TextField
              label="Break Duration (minutes)"
              type="number"
              value={newEntry.breakDuration}
              onChange={(e) => setNewEntry({ ...newEntry, breakDuration: parseInt(e.target.value) })}
              fullWidth
              size="small"
              sx={{ '& .MuiInputLabel-root': { fontSize: { xs: '0.65rem', sm: '0.75rem' } } }}
              InputProps={{
                endAdornment: <InputAdornment position="end">min</InputAdornment>,
              }}
            />
            <FormControl fullWidth size="small">
              <InputLabel sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>Activity Type</InputLabel>
              <Select
                value={newEntry.activityType}
                onChange={(e) => setNewEntry({ ...newEntry, activityType: e.target.value })}
                label="Activity Type"
                sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem' } }}
              >
                <MenuItem value="DRIVING" sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem' } }}>Driving</MenuItem>
                <MenuItem value="REST" sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem' } }}>Rest</MenuItem>
                <MenuItem value="LOADING" sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem' } }}>Loading</MenuItem>
                <MenuItem value="UNLOADING" sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem' } }}>Unloading</MenuItem>
                <MenuItem value="MAINTENANCE" sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem' } }}>Maintenance</MenuItem>
                <MenuItem value="TRAINING" sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem' } }}>Training</MenuItem>
                <MenuItem value="OTHER" sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem' } }}>Other</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Notes"
              multiline
              rows={2}
              value={newEntry.notes}
              onChange={(e) => setNewEntry({ ...newEntry, notes: e.target.value })}
              fullWidth
              size="small"
              sx={{ '& .MuiInputLabel-root': { fontSize: { xs: '0.65rem', sm: '0.75rem' } } }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: { xs: 1.5, sm: 2.5 } }}>
          <Button onClick={() => setOpenDialog(false)} sx={{ color: '#6B7280', fontSize: { xs: '0.7rem', sm: '0.8rem' } }}>
            Cancel
          </Button>
          <Button 
            onClick={handleAddEntry} 
            variant="contained"
            sx={{
              fontSize: { xs: '0.7rem', sm: '0.8rem' },
              borderRadius: '10px',
              textTransform: 'none',
              background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #4338CA 0%, #4F46E5 100%)',
              },
            }}
          >
            Add Entry
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openImportDialog} onClose={() => setOpenImportDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600, color: '#111827', fontSize: { xs: '0.9rem', sm: '1rem' } }}>
          Import Timesheet
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <Box
              sx={{
                border: '2px dashed #ECECEC',
                borderRadius: '12px',
                p: 4,
                textAlign: 'center',
                bgcolor: '#F9FAFB',
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: '#4F46E5',
                  bgcolor: '#EEF2FF',
                },
              }}
            >
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                style={{ display: 'none' }}
                id="file-upload"
                onChange={handleFileUpload}
              />
              <label htmlFor="file-upload">
                <IconButton component="span" sx={{ bgcolor: '#EEF2FF', color: '#4F46E5', mb: 2 }}>
                  <CloudUploadIcon sx={{ fontSize: 40 }} />
                </IconButton>
                <Typography variant="body1" sx={{ fontWeight: 600, color: '#111827', fontSize: { xs: '0.85rem', sm: '0.95rem' } }}>
                  {selectedFile ? selectedFile.name : 'Upload timesheet file'}
                </Typography>
                <Typography variant="caption" sx={{ color: '#6B7280', display: 'block', fontSize: { xs: '0.6rem', sm: '0.7rem' } }}>
                  Supported formats: CSV, Excel (.xlsx, .xls)
                </Typography>
                <Typography variant="caption" sx={{ color: '#6B7280', display: 'block', fontSize: { xs: '0.6rem', sm: '0.7rem' } }}>
                  Max file size: 5MB
                </Typography>
                {selectedFile && (
                  <Chip
                    label={`${(selectedFile.size / 1024).toFixed(1)} KB`}
                    size="small"
                    sx={{ mt: 1 }}
                  />
                )}
              </label>
            </Box>

            {importing && (
              <Box>
                <Typography variant="caption" sx={{ color: '#6B7280', display: 'block', mb: 1, fontSize: { xs: '0.6rem', sm: '0.7rem' } }}>
                  Importing... {importProgress}%
                </Typography>
                <LinearProgress variant="determinate" value={importProgress} sx={{ height: 8, borderRadius: 4 }} />
              </Box>
            )}

            <Alert severity="info" sx={{ borderRadius: '8px' }}>
              <Typography variant="caption" sx={{ display: 'block', fontSize: { xs: '0.6rem', sm: '0.7rem' } }}>
                <strong>Format Requirements:</strong>
              </Typography>
              <Typography variant="caption" sx={{ display: 'block', fontSize: { xs: '0.55rem', sm: '0.65rem' } }}>
                • Columns: Date, Start Time, End Time, Break Duration, Activity Type, Notes
              </Typography>
              <Typography variant="caption" sx={{ display: 'block', fontSize: { xs: '0.55rem', sm: '0.65rem' } }}>
                • Date format: YYYY-MM-DD
              </Typography>
              <Typography variant="caption" sx={{ display: 'block', fontSize: { xs: '0.55rem', sm: '0.65rem' } }}>
                • Time format: HH:mm (24-hour)
              </Typography>
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: { xs: 1.5, sm: 2.5 } }}>
          <Button onClick={() => setOpenImportDialog(false)} sx={{ color: '#6B7280', fontSize: { xs: '0.7rem', sm: '0.8rem' } }}>
            Cancel
          </Button>
          <Button 
            onClick={handleImport} 
            variant="contained"
            disabled={!selectedFile || importing}
            sx={{
              fontSize: { xs: '0.7rem', sm: '0.8rem' },
              borderRadius: '10px',
              textTransform: 'none',
              background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #4338CA 0%, #4F46E5 100%)',
              },
            }}
          >
            {importing ? 'Importing...' : 'Import'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// ============================================================
// DOCUMENTS TAB
// ============================================================
const DocumentsTab = ({ driverId }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [openUploadDialog, setOpenUploadDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [documentType, setDocumentType] = useState('OTHER');
  const [description, setDescription] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const documentTypes = documentService.getDocumentTypes?.() || [
    { value: 'ID', label: 'ID Document' },
    { value: 'LICENSE', label: 'Driver License' },
    { value: 'MEDICAL', label: 'Medical Certificate' },
    { value: 'TRAINING', label: 'Training Certificate' },
    { value: 'CONTRACT', label: 'Employment Contract' },
    { value: 'INSURANCE', label: 'Insurance Document' },
    { value: 'OTHER', label: 'Other' },
  ];

  useEffect(() => {
    if (driverId) {
      fetchDocuments();
    }
  }, [driverId]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const docs = await documentService.getDriverDocuments(driverId);
      setDocuments(docs || []);
    } catch (err) {
      console.error('Error fetching documents:', err);
      setError('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        setError('File size exceeds 50MB limit');
        return;
      }
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file');
      return;
    }

    const driverIdNum = parseInt(driverId, 10);
    if (isNaN(driverIdNum) || driverIdNum <= 0) {
      setError(`Invalid driver ID: ${driverId}`);
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await documentService.uploadDocument(
        driverIdNum,
        selectedFile,
        documentType,
        description
      );

      setSuccess('Document uploaded successfully!');
      setSelectedFile(null);
      setDocumentType('OTHER');
      setDescription('');
      setOpenUploadDialog(false);
      await fetchDocuments();
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.userMessage || err.message || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (doc) => {
    if (!window.confirm(`Are you sure you want to delete "${doc.fileName}"?`)) {
      return;
    }

    try {
      await documentService.deleteDocument(doc.id);
      setSuccess('Document deleted successfully');
      await fetchDocuments();
    } catch (err) {
      console.error('Delete error:', err);
      setError('Failed to delete document');
    }
  };

  const handleDownload = async (doc) => {
    try {
      await documentService.downloadDocument(doc.id, doc.fileName);
    } catch (err) {
      console.error('Download error:', err);
      setError('Failed to download document');
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const getFileIcon = (fileType, fileName) => {
    if (!fileType && !fileName) return '📄';
    const name = fileName?.toLowerCase() || '';
    const type = fileType?.toLowerCase() || '';
    
    if (type.includes('pdf') || name.endsWith('.pdf')) return '📕';
    if (type.includes('image') || name.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/)) return '🖼️';
    if (type.includes('word') || name.endsWith('.docx') || name.endsWith('.doc')) return '📘';
    if (type.includes('excel') || name.endsWith('.xlsx') || name.endsWith('.xls')) return '📗';
    if (type.includes('text') || name.endsWith('.txt')) return '📝';
    if (name.endsWith('.zip') || name.endsWith('.rar') || name.endsWith('.7z')) return '📦';
    return '📄';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
        <CircularProgress size={40} />
      </Box>
    );
  }

  return (
    <Box sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
          Driver Documents
        </Typography>
        <Button
          variant="contained"
          size="small"
          startIcon={<UploadIcon sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem' } }} />}
          onClick={() => setOpenUploadDialog(true)}
          sx={{
            fontSize: { xs: '0.65rem', sm: '0.75rem' },
            borderRadius: '8px',
            textTransform: 'none',
            background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #4338CA 0%, #4F46E5 100%)',
            },
          }}
        >
          Upload Document
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: '8px' }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2, borderRadius: '8px' }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {documents.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: '16px', border: '1px solid #ECECEC' }}>
          <DescriptionIcon sx={{ fontSize: 48, color: '#D1D5DB', mb: 2 }} />
          <Typography variant="body1" color="text.secondary" sx={{ fontSize: '0.9rem' }}>
            No documents uploaded yet
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, fontSize: '0.8rem' }}>
            Upload driver documents like ID, license, medical certificates, etc.
          </Typography>
          <Button
            variant="contained"
            size="small"
            startIcon={<UploadIcon sx={{ fontSize: '0.8rem' }} />}
            onClick={() => setOpenUploadDialog(true)}
            sx={{ mt: 2 }}
          >
            Upload First Document
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {documents.map((doc) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={doc.id || doc.filePath}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: '12px',
                  border: '1px solid #ECECEC',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                  <Box sx={{ fontSize: '2rem', lineHeight: 1 }}>
                    {getFileIcon(doc.fileType, doc.fileName)}
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 600,
                        color: '#111827',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontSize: { xs: '0.8rem', sm: '0.85rem' },
                      }}
                    >
                      {doc.fileName}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#6B7280', display: 'block', fontSize: { xs: '0.6rem', sm: '0.7rem' } }}>
                      {doc.documentType || 'Other'} • {formatFileSize(doc.fileSize)}
                    </Typography>
                    {doc.description && (
                      <Typography variant="caption" sx={{ color: '#6B7280', display: 'block', fontSize: { xs: '0.6rem', sm: '0.7rem' } }}>
                        {doc.description}
                      </Typography>
                    )}
                    <Typography variant="caption" sx={{ color: '#9CA3AF', display: 'block', fontSize: { xs: '0.55rem', sm: '0.65rem' } }}>
                      {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : 'N/A'}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, mt: 1 }}>
                      <Tooltip title="Download" arrow>
                        <IconButton
                          size="small"
                          onClick={() => handleDownload(doc)}
                          sx={{ p: { xs: 0.25, sm: 0.5 } }}
                        >
                          <DownloadIcon sx={{ fontSize: { xs: '0.7rem', sm: '0.9rem' } }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete" arrow>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDelete(doc)}
                          sx={{ p: { xs: 0.25, sm: 0.5 } }}
                        >
                          <DeleteIcon sx={{ fontSize: { xs: '0.7rem', sm: '0.9rem' } }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Upload Dialog */}
      <Dialog open={openUploadDialog} onClose={() => !uploading && setOpenUploadDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600, color: '#111827', fontSize: { xs: '0.9rem', sm: '1rem' } }}>
          Upload Document
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <Box
              sx={{
                border: '2px dashed #ECECEC',
                borderRadius: '12px',
                p: 3,
                textAlign: 'center',
                bgcolor: '#F9FAFB',
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: '#4F46E5',
                  bgcolor: '#EEF2FF',
                },
              }}
            >
              <input
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.gif,.bmp,.webp"
                style={{ display: 'none' }}
                id="document-upload"
                onChange={handleFileSelect}
                disabled={uploading}
              />
              <label htmlFor="document-upload">
                <IconButton component="span" sx={{ bgcolor: '#EEF2FF', color: '#4F46E5', mb: 1 }}>
                  <CloudUploadIcon sx={{ fontSize: 40 }} />
                </IconButton>
                <Typography variant="body1" sx={{ fontWeight: 600, color: '#111827', fontSize: { xs: '0.85rem', sm: '0.95rem' } }}>
                  {selectedFile ? selectedFile.name : 'Choose a file'}
                </Typography>
                <Typography variant="caption" sx={{ color: '#6B7280', display: 'block', fontSize: { xs: '0.6rem', sm: '0.7rem' } }}>
                  Supported formats: PDF, Word, Excel, Images, Text
                </Typography>
                <Typography variant="caption" sx={{ color: '#6B7280', display: 'block', fontSize: { xs: '0.6rem', sm: '0.7rem' } }}>
                  Max file size: 50MB
                </Typography>
                {selectedFile && (
                  <Chip
                    label={formatFileSize(selectedFile.size)}
                    size="small"
                    sx={{ mt: 1 }}
                  />
                )}
              </label>
            </Box>

            <FormControl fullWidth size="small">
              <InputLabel sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>Document Type</InputLabel>
              <Select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                label="Document Type"
                disabled={uploading}
                sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem' } }}
              >
                {documentTypes.map((type) => (
                  <MenuItem key={type.value} value={type.value} sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem' } }}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              fullWidth
              multiline
              rows={2}
              disabled={uploading}
              placeholder="Add a description for this document"
              sx={{ '& .MuiInputLabel-root': { fontSize: { xs: '0.65rem', sm: '0.75rem' } } }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: { xs: 1.5, sm: 2.5 } }}>
          <Button onClick={() => setOpenUploadDialog(false)} disabled={uploading} sx={{ color: '#6B7280', fontSize: { xs: '0.7rem', sm: '0.8rem' } }}>
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            variant="contained"
            disabled={!selectedFile || uploading}
            sx={{
              fontSize: { xs: '0.7rem', sm: '0.8rem' },
              borderRadius: '10px',
              textTransform: 'none',
              background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #4338CA 0%, #4F46E5 100%)',
              },
            }}
          >
            {uploading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'Upload Document'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// ============================================================
// NOTES TAB
// ============================================================
const NotesTab = ({ driver }) => {
  const [notes, setNotes] = useState(driver?.notes || '');
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save notes logic here
      setIsEditing(false);
    } catch (err) {
      console.error('Error saving notes:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
          Driver Notes
        </Typography>
        {!isEditing && (
          <Button
            variant="outlined"
            size="small"
            startIcon={<EditIcon sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem' } }} />}
            onClick={() => setIsEditing(true)}
            sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' }, borderRadius: '8px', textTransform: 'none' }}
          >
            Edit Notes
          </Button>
        )}
      </Box>
      
      {isEditing ? (
        <Box>
          <TextField
            fullWidth
            multiline
            rows={6}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes about the driver..."
            sx={{ mb: 2 }}
          />
          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              size="small"
              onClick={handleSave}
              disabled={saving}
              sx={{
                fontSize: { xs: '0.65rem', sm: '0.75rem' },
                borderRadius: '8px',
                textTransform: 'none',
                background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #4338CA 0%, #4F46E5 100%)',
                },
              }}
            >
              {saving ? <CircularProgress size={20} /> : 'Save Notes'}
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={() => {
                setNotes(driver?.notes || '');
                setIsEditing(false);
              }}
              sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' }, borderRadius: '8px', textTransform: 'none' }}
            >
              Cancel
            </Button>
          </Stack>
        </Box>
      ) : (
        <Paper
          sx={{
            p: { xs: 2, sm: 3 },
            borderRadius: '12px',
            border: '1px solid #ECECEC',
            bgcolor: '#F9FAFB',
            minHeight: '150px',
          }}
        >
          {notes ? (
            <Typography variant="body2" sx={{ color: '#111827', whiteSpace: 'pre-wrap', fontSize: { xs: '0.8rem', sm: '0.85rem' } }}>
              {notes}
            </Typography>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', fontSize: '0.85rem' }}>
              No notes added yet. Click "Edit Notes" to add information about this driver.
            </Typography>
          )}
        </Paper>
      )}
    </Box>
  );
};

// ============================================================
// MAIN DRIVER DASHBOARD
// ============================================================
const DriverDashboard = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [activeTab, setActiveTab] = useState(0);
  const [driver, setDriver] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [timesheetData, setTimesheetData] = useState([]);
  const [leaveData, setLeaveData] = useState([]);
  const [trips, setTrips] = useState([]);
  const [punchStatus, setPunchStatus] = useState('CLOCKED_OUT');
  const [punchLoading, setPunchLoading] = useState(false);
  const [openApproveDialog, setOpenApproveDialog] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [approveAction, setApproveAction] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    if (id) {
      fetchDriverData(id);
      fetchTimesheetData(id);
      fetchLeaveData(id);
      fetchTrips(id);
    } else {
      setError('No driver ID provided');
      setLoading(false);
    }
  }, [id]);

  const fetchDriverData = async (driverId) => {
    setLoading(true);
    try {
      const data = await driverService.getDriverById(driverId);
      const idNum = parseInt(driverId, 10);
      let driverTrips = [];
      
      try {
        const tripsResponse = await tripService.getTripsByDriver(idNum);
        if (tripsResponse && tripsResponse.data) {
          driverTrips = Array.isArray(tripsResponse.data) ? tripsResponse.data : [];
        } else if (Array.isArray(tripsResponse)) {
          driverTrips = tripsResponse;
        }
      } catch (err) {
        console.warn('Could not fetch trips by driver, using fallback');
        const allTrips = await tripService.getAllTrips({ size: 100, sort: 'id,desc' });
        let tripsArray = [];
        if (allTrips && allTrips.content) {
          tripsArray = allTrips.content;
        } else if (Array.isArray(allTrips)) {
          tripsArray = allTrips;
        }
        driverTrips = tripsArray.filter(t => 
          String(t.driverId) === String(idNum) || 
          String(t.driver?.id) === String(idNum)
        );
      }
      
      const totalTrips = driverTrips.length;
      const completedTrips = driverTrips.filter(t => 
        t.status === 'COMPLETED' || t.status === 'FINALIZED'
      ).length;
      
      const totalDistance = driverTrips.reduce((sum, t) => {
        const distance = t.totalDistance || t.distance || t.distanceKm || t.plannedDistanceKm || 0;
        return sum + (typeof distance === 'number' ? distance : parseFloat(distance) || 0);
      }, 0);
      
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const monthlyTrips = driverTrips.filter(t => {
        const startDate = t.plannedStartDate || t.startDate || t.createdAt;
        if (!startDate) return false;
        try {
          return new Date(startDate) >= thirtyDaysAgo;
        } catch {
          return false;
        }
      }).length;
      
      const performanceScore = data.performanceScore || 
        (totalTrips > 0 ? Math.round((completedTrips / totalTrips) * 100) : 0);
      
      const enrichedDriver = {
        ...data,
        totalTrips: totalTrips,
        completedTrips: completedTrips,
        totalDistance: Math.round(totalDistance),
        monthlyTrips: monthlyTrips,
        performanceScore: performanceScore,
        tripCount: totalTrips,
      };
      
      setDriver(enrichedDriver);
    } catch (err) {
      console.error('Error fetching driver data:', err);
      setError('Failed to load driver data');
    } finally {
      setLoading(false);
    }
  };

  const fetchTimesheetData = async (driverId) => {
    try {
      const idNum = parseInt(driverId, 10);
      if (isNaN(idNum)) {
        setTimesheetData([]);
        return;
      }
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      const endDate = new Date();
      
      const entries = await timesheetService.getEntries(
        idNum,
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      );
      setTimesheetData(entries || []);
      
      const activeEntry = await timesheetService.getActivePunch(idNum);
      if (activeEntry) {
        setPunchStatus(activeEntry.punchStatus || 'CLOCKED_OUT');
      }
    } catch (err) {
      console.error('Error fetching timesheet data:', err);
      setTimesheetData([]);
    }
  };

  const fetchLeaveData = async (driverId) => {
    try {
      const idNum = parseInt(driverId, 10);
      if (isNaN(idNum)) {
        setLeaveData([]);
        return;
      }
      
      const requests = await leaveService.getLeaveRequests(idNum);
      setLeaveData(requests || []);
    } catch (err) {
      console.error('Error fetching leave data:', err);
      setLeaveData([]);
    }
  };

  const fetchTrips = async (driverId) => {
    try {
      const id = parseInt(driverId, 10);
      if (isNaN(id)) {
        console.error('Invalid driver ID for trips fetch');
        setTrips([]);
        return;
      }
      
      console.log(`📤 Fetching trips for driver: ${id}`);
      const tripsResponse = await tripService.getTripsByDriver(id);
      console.log(`📥 getTripsByDriver response:`, tripsResponse);
      
      let tripsData = [];
      if (tripsResponse && tripsResponse.data) {
        tripsData = Array.isArray(tripsResponse.data) ? tripsResponse.data : [];
      } else if (Array.isArray(tripsResponse)) {
        tripsData = tripsResponse;
      }
      
      console.log(`✅ Found ${tripsData.length} trips for driver ${id}`);
      setTrips(tripsData);
    } catch (err) {
      console.error('Error fetching trips:', err);
      
      try {
        console.log('📤 Attempting fallback: fetching all trips and filtering');
        const allTripsResponse = await tripService.getAllTrips({ size: 100, sort: 'id,desc' });
        
        let tripsArray = [];
        if (allTripsResponse && allTripsResponse.content && Array.isArray(allTripsResponse.content)) {
          tripsArray = allTripsResponse.content;
        } else if (Array.isArray(allTripsResponse)) {
          tripsArray = allTripsResponse;
        } else if (allTripsResponse && allTripsResponse.data && Array.isArray(allTripsResponse.data)) {
          tripsArray = allTripsResponse.data;
        } else {
          console.warn('Unexpected getAllTrips response format:', allTripsResponse);
          setTrips([]);
          return;
        }
        
        const filtered = tripsArray.filter(trip => {
          const tripDriverId = trip.driverId;
          const tripDriverObjId = trip.driver?.id;
          
          return String(tripDriverId) === String(id) ||
                 String(tripDriverObjId) === String(id);
        });
        
        console.log(`✅ Found ${filtered.length} trips for driver ${id}`);
        setTrips(filtered);
      } catch (fallbackErr) {
        console.error('Fallback trip fetch also failed:', fallbackErr);
        setTrips([]);
      }
    }
  };

  const handleNotificationClose = (id) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const handleBack = () => {
    navigate('/drivers');
  };

  const handleEdit = () => {
    navigate(`/drivers/${id}/edit`);
  };

  const handlePunch = async (type) => {
    setPunchLoading(true);
    try {
      const driverId = parseInt(id, 10);
      if (isNaN(driverId)) {
        throw new Error('Invalid driver ID');
      }

      const punchData = {
        driverId: driverId,
        punchType: type,
        location: 'Web Portal',
        latitude: null,
        longitude: null,
      };
      
      const result = await timesheetService.punch(punchData);
      setPunchStatus(result.punchStatus || 'CLOCKED_OUT');
      await fetchTimesheetData(id);
    } catch (err) {
      console.error('Error processing punch:', err);
      setError(err.userMessage || err.message || 'Failed to process punch');
      setTimeout(() => setError(null), 3000);
    } finally {
      setPunchLoading(false);
    }
  };

  const handleAddTimesheetEntry = async (entry) => {
    try {
      setTimesheetData([...timesheetData, { ...entry, id: Date.now() }]);
      setSuccessMessage('Timesheet entry added successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error adding timesheet entry:', err);
      setError(err.message || 'Failed to add timesheet entry');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleDeleteTimesheetEntry = async (entryId) => {
    try {
      setTimesheetData(timesheetData.filter(entry => entry.id !== entryId));
      setSuccessMessage('Timesheet entry deleted successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error deleting timesheet entry:', err);
      setError(err.message || 'Failed to delete timesheet entry');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleImportTimesheet = async (file) => {
    console.log('Importing file:', file);
    setSuccessMessage('Timesheet imported successfully');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleExportTimesheet = () => {
    const headers = ['Date', 'Start Time', 'End Time', 'Break Duration', 'Activity Type', 'Notes'];
    const rows = timesheetData.map(entry => [
      entry.entryDate || entry.date || '',
      entry.startTime || '',
      entry.endTime || '',
      entry.breakDuration || '',
      entry.activityType || '',
      entry.notes || '',
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `timesheet_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    setSuccessMessage('Timesheet exported successfully');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleRequestLeave = async (leave) => {
    try {
      const driverId = parseInt(id, 10);
      if (isNaN(driverId)) {
        throw new Error('Invalid driver ID');
      }

      const leaveTypeMap = {
        'ANNUAL': 1,
        'SICK': 2,
        'STUDY': 3,
        'UNPAID': 4,
        'OTHER': 5,
      };

      const leaveRequest = {
        driverId: driverId,
        leaveTypeId: leaveTypeMap[leave.type] || 1,
        startDate: leave.startDate,
        endDate: leave.endDate,
        reason: leave.reason || '',
        notes: leave.notes || '',
      };
      
      const result = await leaveService.requestLeave(leaveRequest);
      setLeaveData([...leaveData, result]);
      setSuccessMessage('Leave request submitted successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error requesting leave:', err);
      setError(err.userMessage || err.message || 'Failed to request leave');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleCancelLeave = async (leaveId) => {
    try {
      await leaveService.cancelLeave(leaveId);
      setLeaveData(leaveData.filter(leave => leave.id !== leaveId));
      setSuccessMessage('Leave request cancelled');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error cancelling leave:', err);
      setError(err.message || 'Failed to cancel leave');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleApproveLeave = async (leaveId) => {
    try {
      const approverId = 1;
      await leaveService.approveLeave(leaveId, approverId);
      await fetchLeaveData(id);
      setOpenApproveDialog(false);
      setSuccessMessage('Leave request approved successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error approving leave:', err);
      setError(err.message || 'Failed to approve leave');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleRejectLeave = async (leaveId, reason) => {
    try {
      await leaveService.rejectLeave(leaveId, reason || 'No reason provided');
      await fetchLeaveData(id);
      setOpenApproveDialog(false);
      setRejectionReason('');
      setSuccessMessage('Leave request rejected');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error rejecting leave:', err);
      setError(err.message || 'Failed to reject leave');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleOpenApproveDialog = (leave, action) => {
    setSelectedLeave(leave);
    setApproveAction(action);
    setOpenApproveDialog(true);
  };

  if (loading) {
    return (
      <ResponsiveContainer>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress size={40} />
          <Typography sx={{ ml: 2, fontSize: '0.9rem' }}>Loading driver data...</Typography>
        </Box>
      </ResponsiveContainer>
    );
  }

  if (error || !driver) {
    return (
      <ResponsiveContainer>
        <Alert severity="error" sx={{ borderRadius: '12px', fontSize: { xs: '0.7rem', sm: '0.8rem' } }}>
          {error || 'Driver not found'}
        </Alert>
        <Button
          variant="contained"
          size="small"
          onClick={handleBack}
          sx={{ mt: 2, fontSize: '0.8rem' }}
        >
          Back to Drivers
        </Button>
      </ResponsiveContainer>
    );
  }

  const fullName = `${driver.firstName || ''} ${driver.lastName || ''}`.trim();
  const initials = `${driver.firstName?.charAt(0) || ''}${driver.lastName?.charAt(0) || ''}`.toUpperCase();

  return (
    <ResponsiveContainer>
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', lg: '320px 1fr' }, 
        gap: 3,
        width: '100%',
      }}>
        {/* Sidebar */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: { xs: '12px', sm: '16px' },
            border: '1px solid #ECECEC',
            p: { xs: 2, sm: 2.5 },
            height: 'fit-content',
            position: { lg: 'sticky' },
            top: { lg: 24 },
            backgroundColor: '#FFFFFF',
          }}
        >
          <Button
            startIcon={<ArrowBackIcon sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' } }} />}
            size="small"
            onClick={handleBack}
            sx={{ mb: 2.5, fontSize: { xs: '0.7rem', sm: '0.75rem' }, color: '#6B7280', '&:hover': { bgcolor: 'transparent' } }}
          >
            Back to Drivers
          </Button>

          <Box sx={{ textAlign: 'center' }}>
            <Box sx={{ position: 'relative', display: 'inline-block' }}>
              <Avatar
                sx={{
                  width: { xs: 72, sm: 80, md: 96 },
                  height: { xs: 72, sm: 80, md: 96 },
                  bgcolor: '#4F46E5',
                  fontSize: { xs: 24, sm: 28, md: 32 },
                  fontWeight: 600,
                  mx: 'auto',
                  mb: 2,
                  boxShadow: '0 4px 12px rgba(79,70,229,0.2)',
                }}
              >
                {initials || 'D'}
              </Avatar>
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 16,
                  right: 0,
                  bgcolor: '#F59E0B',
                  borderRadius: '50%',
                  width: { xs: 24, sm: 28 },
                  height: { xs: 24, sm: 28 },
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid white',
                }}
              >
                <StarIcon sx={{ fontSize: { xs: '0.6rem', sm: '0.8rem' }, color: 'white' }} />
              </Box>
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 8,
                  right: -8,
                  bgcolor: driver?.status === 'ACTIVE' ? '#22C55E' : '#EF4444',
                  borderRadius: '50%',
                  width: { xs: 12, sm: 14 },
                  height: { xs: 12, sm: 14 },
                  border: '2px solid white',
                }}
              />
            </Box>

            <Typography variant="h5" sx={{ fontWeight: 700, color: '#111827', fontSize: { xs: '0.9rem', sm: '1rem' } }}>
              {fullName || 'Unknown Driver'}
            </Typography>
            <Typography variant="body2" sx={{ color: '#6B7280', mb: 0.5, fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
              {driver.licenseNumber || 'No license'} • {driver.licenseType || 'N/A'}
            </Typography>
            <Typography variant="body2" sx={{ color: '#6B7280', mb: 2, fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
              {driver.status || 'Unknown'} • {driver.employmentType || 'N/A'}
            </Typography>

            <Button
              variant="outlined"
              fullWidth
              startIcon={<EditIcon sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' } }} />}
              onClick={handleEdit}
              sx={{
                borderRadius: '12px',
                borderColor: '#ECECEC',
                color: '#111827',
                fontSize: { xs: '0.7rem', sm: '0.8rem' },
                textTransform: 'none',
                py: 1,
                mb: 2.5,
                '&:hover': {
                  borderColor: '#4F46E5',
                  bgcolor: '#EEF2FF',
                },
              }}
            >
              Edit Profile
            </Button>

            <Divider sx={{ mb: 2.5 }} />

            <Stack spacing={1.5} sx={{ textAlign: 'left' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#111827', fontSize: { xs: '0.7rem', sm: '0.8rem' } }}>
                Contact Information
              </Typography>
              <InfoRow label="Phone" value={driver.phoneNumber || 'N/A'} />
              <InfoRow label="Email" value={driver.email || 'N/A'} />
              <InfoRow label="Assigned Vehicle" value={driver.assignedVehicleId || 'Not Assigned'} />
            </Stack>

            <Divider sx={{ my: 2.5 }} />

            <Stack spacing={1.5} sx={{ textAlign: 'left' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#111827', fontSize: { xs: '0.7rem', sm: '0.8rem' } }}>
                Quick Stats
              </Typography>
              <InfoRow label="Total Trips" value={driver.totalTrips || 0} />
              <InfoRow label="Performance Score" value={`${driver.performanceScore || 0}%`} />
              <InfoRow label="Hire Date" value={driver.hireDate ? new Date(driver.hireDate).toLocaleDateString() : 'N/A'} />
              <InfoRow label="License Expiry" value={driver.licenseExpiry ? new Date(driver.licenseExpiry).toLocaleDateString() : 'N/A'} />
            </Stack>
          </Box>
        </Paper>

        {/* Main Content */}
        <Box>
          <DriverNavigationTabs activeTab={activeTab} setActiveTab={setActiveTab} />

          {error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: '12px', fontSize: { xs: '0.7rem', sm: '0.8rem' } }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          {successMessage && (
            <Alert severity="success" sx={{ mb: 2, borderRadius: '12px', fontSize: { xs: '0.7rem', sm: '0.8rem' } }} onClose={() => setSuccessMessage('')}>
              {successMessage}
            </Alert>
          )}

          {notifications.map((notification) => (
            <NotificationBanner
              key={notification.id}
              icon={notification.icon}
              message={notification.message}
              severity={notification.severity}
              onClose={() => handleNotificationClose(notification.id)}
            />
          ))}

          {activeTab === 0 && (
            <OverviewTab 
              driver={driver} 
              leaveData={leaveData}
              timesheetData={timesheetData}
              loading={loading} 
            />
          )}

          {activeTab === 1 && (
            <TimesheetTab
              timesheetData={timesheetData}
              loading={loading}
              onAddEntry={handleAddTimesheetEntry}
              onDeleteEntry={handleDeleteTimesheetEntry}
              onPunch={handlePunch}
              punchStatus={punchStatus}
              punchLoading={punchLoading}
              onImportTimesheet={handleImportTimesheet}
              onExportTimesheet={handleExportTimesheet}
            />
          )}

          {activeTab === 2 && (
            <LeaveTab
              leaveData={leaveData}
              loading={loading}
              onRequestLeave={handleRequestLeave}
              onCancelLeave={handleCancelLeave}
              onOpenApproveDialog={handleOpenApproveDialog}
            />
          )}

          {activeTab === 3 && (
            <TripsTab trips={trips} loading={loading} />
          )}

          {activeTab === 4 && (
            <PerformanceTab driver={driver} trips={trips} loading={loading} />
          )}

          {activeTab === 5 && (
            <DocumentsTab driverId={id} />
          )}

          {activeTab === 6 && (
            <NotesTab driver={driver} />
          )}
        </Box>
      </Box>

      {/* Approve/Reject Leave Dialog */}
      <Dialog open={openApproveDialog} onClose={() => setOpenApproveDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600, color: '#111827', fontSize: { xs: '0.9rem', sm: '1rem' } }}>
          {approveAction === 'APPROVE' ? 'Approve Leave Request' : 'Reject Leave Request'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            {selectedLeave && (
              <>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                    Leave Type
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500, fontSize: { xs: '0.8rem', sm: '0.85rem' } }}>
                    {selectedLeave.leaveType?.name || selectedLeave.leaveType?.type || selectedLeave.type || 'N/A'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                    Duration
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500, fontSize: { xs: '0.8rem', sm: '0.85rem' } }}>
                    {new Date(selectedLeave.startDate).toLocaleDateString()} - {new Date(selectedLeave.endDate).toLocaleDateString()}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                    Reason
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: { xs: '0.8rem', sm: '0.85rem' } }}>
                    {selectedLeave.reason || 'No reason provided'}
                  </Typography>
                </Box>
                {approveAction === 'REJECT' && (
                  <TextField
                    label="Rejection Reason"
                    multiline
                    rows={2}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    fullWidth
                    size="small"
                    placeholder="Reason for rejecting the leave request"
                    sx={{ '& .MuiInputLabel-root': { fontSize: { xs: '0.65rem', sm: '0.75rem' } } }}
                  />
                )}
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: { xs: 1.5, sm: 2.5 } }}>
          <Button onClick={() => setOpenApproveDialog(false)} sx={{ color: '#6B7280', fontSize: { xs: '0.7rem', sm: '0.8rem' } }}>
            Cancel
          </Button>
          <Button 
            onClick={() => {
              if (approveAction === 'APPROVE') {
                handleApproveLeave(selectedLeave?.id);
              } else {
                handleRejectLeave(selectedLeave?.id, rejectionReason);
              }
            }} 
            variant="contained"
            sx={{
              fontSize: { xs: '0.7rem', sm: '0.8rem' },
              borderRadius: '10px',
              textTransform: 'none',
              background: approveAction === 'APPROVE' 
                ? 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)'
                : 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
              '&:hover': {
                opacity: 0.9,
              },
            }}
          >
            {approveAction === 'APPROVE' ? 'Approve' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>
    </ResponsiveContainer>
  );
};

export default DriverDashboard;
