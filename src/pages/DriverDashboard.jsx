// src/pages/drivers/DriverDashboard.jsx
import React, { useState } from 'react';
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
  Card,
  CardContent,
  Tooltip,
  Badge,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  DirectionsCar as CarIcon,
  Route as RouteIcon,
  Assessment as AssessmentIcon,
  CalendarToday as CalendarIcon,
  Settings as SettingsIcon,
  Support as SupportIcon,
  ArrowBack as ArrowBackIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationOnIcon,
  Info as InfoIcon,
  Close as CloseIcon,
  WhatsApp as WhatsAppIcon,
  Sms as SmsIcon,
  Gmail as GmailIcon,
  DesktopMac as DesktopIcon,
  PhoneIphone as MobileIcon,
  TabletMac as TabletIcon,
  DevicesOther as OtherIcon,
  Chat as ChatIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  EventNote as EventNoteIcon,
  Assignment as AssignmentIcon,
  PersonAdd as PersonAddIcon,
  Edit as EditIcon,
  MoreVert as MoreVertIcon,
  Facebook as FacebookIcon,
  Instagram as InstagramIcon,
  LinkedIn as LinkedInIcon,
} from '@mui/icons-material';

// Navigation Tabs Component
const DriverNavigationTabs = ({ activeTab, setActiveTab }) => {
  const handleChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const tabs = ['Overview', 'Trips', 'Vehicles', 'Performance', 'Documents', 'Notes'];

  return (
    <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
      <Tabs
        value={activeTab}
        onChange={handleChange}
        sx={{
          '& .MuiTab-root': {
            fontWeight: 500,
            fontSize: '0.875rem',
            textTransform: 'capitalize',
            minWidth: 'auto',
            px: 2,
            py: 1.5,
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
        {tabs.map((label) => (
          <Tab key={label} label={label} />
        ))}
      </Tabs>
    </Box>
  );
};

// Driver Notification Banner Component
const DriverNotificationBanner = ({ icon, message, onClose, severity = 'info' }) => {
  const getBackgroundColor = () => {
    switch (severity) {
      case 'warning':
        return '#FEF3C7';
      case 'error':
        return '#FEE2E2';
      case 'success':
        return '#D1FAE5';
      default:
        return '#DBEAFE';
    }
  };

  const getIconColor = () => {
    switch (severity) {
      case 'warning':
        return '#F59E0B';
      case 'error':
        return '#EF4444';
      case 'success':
        return '#10B981';
      default:
        return '#3B82F6';
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        mb: 1.5,
        borderRadius: '14px',
        border: '1px solid #ECECEC',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: '70px',
        backgroundColor: '#FFFFFF',
        transition: 'all 0.2s ease',
        '&:hover': {
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1 }}>
        <Box
          sx={{
            bgcolor: getBackgroundColor(),
            borderRadius: '50%',
            width: 36,
            height: 36,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {React.cloneElement(icon, { sx: { color: getIconColor(), fontSize: '1.25rem' } })}
        </Box>
        <Typography variant="body2" sx={{ color: '#111827', fontSize: '0.875rem' }}>
          {message}
        </Typography>
      </Box>
      <IconButton size="small" onClick={onClose} sx={{ color: '#6B7280', flexShrink: 0 }}>
        <CloseIcon sx={{ fontSize: '1rem' }} />
      </IconButton>
    </Paper>
  );
};

// Driver Stat Card Component
const DriverStatCard = ({ title, value, subtitle, metrics, icon: Icon, color = '#4F46E5' }) => (
  <Paper
    elevation={0}
    sx={{
      p: 3,
      borderRadius: '16px',
      border: '1px solid #ECECEC',
      backgroundColor: '#FFFFFF',
      height: '100%',
      transition: 'all 0.2s ease',
      '&:hover': {
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        transform: 'translateY(-2px)',
      },
    }}
  >
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
      <Typography variant="body2" sx={{ color: '#6B7280', fontWeight: 500 }}>
        {title}
      </Typography>
      {Icon && (
        <Box
          sx={{
            bgcolor: `${color}15`,
            borderRadius: '10px',
            p: 0.75,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon sx={{ color: color, fontSize: '1.25rem' }} />
        </Box>
      )}
    </Box>
    <Typography variant="h4" sx={{ fontWeight: 700, color: '#111827', mb: 0.5 }}>
      {value}
    </Typography>
    {subtitle && (
      <Typography variant="caption" sx={{ color: '#6B7280', display: 'block', mb: 2 }}>
        {subtitle}
      </Typography>
    )}
    {metrics && (
      <>
        <Divider sx={{ mb: 2 }} />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
          {metrics.map((metric, index) => (
            <Box key={index}>
              <Typography variant="caption" sx={{ color: '#6B7280', display: 'block', fontSize: '0.65rem' }}>
                {metric.label}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#111827', fontSize: '0.8rem' }}>
                {metric.value}
              </Typography>
            </Box>
          ))}
        </Box>
      </>
    )}
  </Paper>
);

// Driver Performance Chart Card (Mock)
const DriverPerformanceCard = () => {
  const metrics = [
    { label: 'On-Time Rate', value: '94%', color: '#22C55E' },
    { label: 'Avg Rating', value: '4.8 ★', color: '#F59E0B' },
    { label: 'Safety Score', value: '96%', color: '#4F46E5' },
    { label: 'Efficiency', value: '88%', color: '#8B5CF6' },
  ];

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: '16px',
        border: '1px solid #ECECEC',
        backgroundColor: '#FFFFFF',
        height: '100%',
      }}
    >
      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#111827', mb: 2 }}>
        Performance Metrics
      </Typography>
      <Stack spacing={2.5}>
        {metrics.map((metric) => (
          <Box key={metric.label}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2" sx={{ color: '#6B7280', fontSize: '0.8rem' }}>
                {metric.label}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#111827', fontSize: '0.8rem' }}>
                {metric.value}
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={parseInt(metric.value)}
              sx={{
                height: 6,
                borderRadius: 3,
                backgroundColor: '#F3F4F6',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: metric.color,
                  borderRadius: 3,
                },
              }}
            />
          </Box>
        ))}
      </Stack>
      <Box sx={{ mt: 2.5, pt: 2, borderTop: '1px solid #ECECEC' }}>
        <Typography variant="caption" sx={{ color: '#6B7280', display: 'block', textAlign: 'center' }}>
          Last 30 days performance
        </Typography>
      </Box>
    </Paper>
  );
};

// Upcoming Trips Component
const UpcomingTripsCard = () => {
  const trips = [
    { id: 1, route: 'City Center → Airport', date: 'Today, 2:30 PM', status: 'Scheduled', vehicle: 'Toyota Camry' },
    { id: 2, route: 'Airport → Downtown', date: 'Today, 5:00 PM', status: 'Confirmed', vehicle: 'Honda Accord' },
    { id: 3, route: 'City Center → North Suburbs', date: 'Tomorrow, 9:00 AM', status: 'Pending', vehicle: 'Tesla Model 3' },
  ];

  const getStatusColor = (status) => {
    const map = {
      Scheduled: '#3B82F6',
      Confirmed: '#22C55E',
      Pending: '#F59E0B',
      Completed: '#6B7280',
      Cancelled: '#EF4444',
    };
    return map[status] || '#6B7280';
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: '16px',
        border: '1px solid #ECECEC',
        backgroundColor: '#FFFFFF',
        height: '100%',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#111827' }}>
          Upcoming Trips
        </Typography>
        <Button size="small" sx={{ fontSize: '0.7rem', color: '#4F46E5' }}>
          View All
        </Button>
      </Box>
      <Stack spacing={2}>
        {trips.map((trip) => (
          <Box key={trip.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 500, color: '#111827', fontSize: '0.8rem' }}>
                {trip.route}
              </Typography>
              <Typography variant="caption" sx={{ color: '#6B7280', display: 'block', fontSize: '0.65rem' }}>
                {trip.date} • {trip.vehicle}
              </Typography>
            </Box>
            <Chip
              label={trip.status}
              size="small"
              sx={{
                fontSize: '0.6rem',
                height: 20,
                bgcolor: `${getStatusColor(trip.status)}15`,
                color: getStatusColor(trip.status),
                fontWeight: 600,
              }}
            />
          </Box>
        ))}
      </Stack>
    </Paper>
  );
};

// License Info Card
const LicenseInfoCard = ({ driver }) => {
  const expiryDate = driver?.licenseExpiry || '2026-12-31';
  const isExpiring = new Date(expiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const isExpired = new Date(expiryDate) < new Date();

  const getExpiryStatus = () => {
    if (isExpired) return { label: 'Expired', color: '#EF4444' };
    if (isExpiring) return { label: 'Expiring Soon', color: '#F59E0B' };
    return { label: 'Valid', color: '#22C55E' };
  };

  const status = getExpiryStatus();

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: '16px',
        border: '1px solid #ECECEC',
        backgroundColor: '#FFFFFF',
        height: '100%',
      }}
    >
      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#111827', mb: 2 }}>
        License Information
      </Typography>
      <Stack spacing={2}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" sx={{ color: '#6B7280', fontSize: '0.8rem' }}>
            License Number
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 600, color: '#111827', fontSize: '0.8rem' }}>
            {driver?.licenseNumber || 'DL-2024-001'}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" sx={{ color: '#6B7280', fontSize: '0.8rem' }}>
            License Type
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 600, color: '#111827', fontSize: '0.8rem' }}>
            {driver?.licenseType || 'Class B'}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" sx={{ color: '#6B7280', fontSize: '0.8rem' }}>
            Expiry Date
          </Typography>
          <Chip
            label={new Date(expiryDate).toLocaleDateString()}
            size="small"
            sx={{
              fontSize: '0.6rem',
              height: 20,
              bgcolor: `${status.color}15`,
              color: status.color,
              fontWeight: 600,
            }}
          />
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" sx={{ color: '#6B7280', fontSize: '0.8rem' }}>
            Status
          </Typography>
          <Chip
            label={status.label}
            size="small"
            sx={{
              fontSize: '0.6rem',
              height: 20,
              bgcolor: `${status.color}15`,
              color: status.color,
              fontWeight: 600,
            }}
          />
        </Box>
      </Stack>
    </Paper>
  );
};

// Main Driver Dashboard Component
const DriverDashboard = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      icon: <WarningIcon />,
      message: 'Driver license expires in 15 days. Please remind them to renew.',
      severity: 'warning',
    },
    {
      id: 2,
      icon: <CheckCircleIcon />,
      message: 'Driver completed 100 trips milestone! Great performance.',
      severity: 'success',
    },
    {
      id: 3,
      icon: <ScheduleIcon />,
      message: 'Scheduled maintenance for assigned vehicle in 3 days.',
      severity: 'info',
    },
  ]);

  const driver = {
    firstName: 'Michael',
    lastName: 'Johnson',
    email: 'michael.johnson@example.com',
    phone: '+1 (555) 123-4567',
    licenseNumber: 'DL-2024-001',
    licenseType: 'Class B',
    licenseExpiry: '2026-12-31',
    status: 'ACTIVE',
    rating: 4.8,
    tripsCompleted: 342,
    hireDate: '2023-01-15',
    vehicleId: 'V-2024-008',
    address: '123 Fleet Street, Los Angeles, CA 90001',
  };

  const handleNotificationClose = (id) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  return (
    <Box sx={{ bgcolor: '#F7F7FC', minHeight: '100vh', p: { xs: 2, md: 3 } }}>
      {/* Dashboard Container */}
      <Box
        sx={{
          maxWidth: '1440px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '320px 1fr' },
          gap: 3,
        }}
      >
        {/* Customer Profile Panel - Left Side */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: '20px',
            border: '1px solid #ECECEC',
            p: 3,
            height: 'fit-content',
            position: 'sticky',
            top: 24,
            backgroundColor: '#FFFFFF',
          }}
        >
          {/* Back Button */}
          <Button
            startIcon={<ArrowBackIcon sx={{ fontSize: '0.9rem' }} />}
            size="small"
            sx={{
              mb: 2.5,
              fontSize: '0.75rem',
              color: '#6B7280',
              '&:hover': { bgcolor: 'transparent' },
            }}
          >
            Back to Drivers
          </Button>

          {/* Profile Section */}
          <Box sx={{ textAlign: 'center' }}>
            <Box sx={{ position: 'relative', display: 'inline-block' }}>
              <Avatar
                sx={{
                  width: 96,
                  height: 96,
                  bgcolor: '#4F46E5',
                  fontSize: 32,
                  fontWeight: 600,
                  mx: 'auto',
                  mb: 2,
                  boxShadow: '0 4px 12px rgba(79,70,229,0.2)',
                }}
              >
                {driver.firstName[0]}{driver.lastName[0]}
              </Avatar>
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 16,
                  right: 0,
                  bgcolor: '#F59E0B',
                  borderRadius: '50%',
                  width: 28,
                  height: 28,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid white',
                }}
              >
                <StarIcon sx={{ fontSize: '0.8rem', color: 'white' }} />
              </Box>
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 8,
                  right: -8,
                  bgcolor: '#22C55E',
                  borderRadius: '50%',
                  width: 14,
                  height: 14,
                  border: '2px solid white',
                }}
              />
            </Box>

            <Typography variant="h5" sx={{ fontWeight: 700, color: '#111827' }}>
              {driver.firstName} {driver.lastName}
            </Typography>
            <Typography variant="body2" sx={{ color: '#6B7280', mb: 2 }}>
              34 • Male • USA
            </Typography>

            {/* Rating */}
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5, mb: 2 }}>
              {[...Array(5)].map((_, i) => (
                <StarIcon
                  key={i}
                  sx={{
                    fontSize: '1.1rem',
                    color: i < Math.floor(driver.rating) ? '#F59E0B' : '#E5E7EB',
                  }}
                />
              ))}
              <Typography variant="body2" sx={{ ml: 0.5, color: '#6B7280', fontSize: '0.8rem' }}>
                {driver.rating}
              </Typography>
            </Box>

            {/* Social Buttons */}
            <Stack direction="row" spacing={1} justifyContent="center" sx={{ mb: 2.5 }}>
              {[
                { name: 'Facebook', icon: FacebookIcon, color: '#1877F2' },
                { name: 'Instagram', icon: InstagramIcon, color: '#E4405F' },
                { name: 'LinkedIn', icon: LinkedInIcon, color: '#0A66C2' },
                { name: 'Email', icon: EmailIcon, color: '#EA4335' },
              ].map((social) => (
                <IconButton
                  key={social.name}
                  size="small"
                  sx={{
                    border: '1px solid #ECECEC',
                    borderRadius: '10px',
                    width: 40,
                    height: 40,
                    '&:hover': { bgcolor: '#F7F7FC' },
                  }}
                >
                  <social.icon sx={{ fontSize: '1.1rem', color: social.color }} />
                </IconButton>
              ))}
            </Stack>

            <Button
              variant="outlined"
              fullWidth
              startIcon={<EditIcon sx={{ fontSize: '0.9rem' }} />}
              sx={{
                borderRadius: '12px',
                borderColor: '#ECECEC',
                color: '#111827',
                fontSize: '0.8rem',
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

            {/* Contact Information */}
            <Stack spacing={1.5} sx={{ mb: 2.5, textAlign: 'left' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#111827', fontSize: '0.8rem' }}>
                Contact Information
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <PhoneIcon sx={{ fontSize: '0.9rem', color: '#6B7280' }} />
                <Typography variant="body2" sx={{ color: '#111827', fontSize: '0.8rem' }}>
                  {driver.phone}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <EmailIcon sx={{ fontSize: '0.9rem', color: '#6B7280' }} />
                <Typography variant="body2" sx={{ color: '#111827', fontSize: '0.8rem' }}>
                  {driver.email}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <CarIcon sx={{ fontSize: '0.9rem', color: '#6B7280' }} />
                <Typography variant="body2" sx={{ color: '#111827', fontSize: '0.8rem' }}>
                  Vehicle: {driver.vehicleId}
                </Typography>
              </Box>
            </Stack>

            <Divider sx={{ mb: 2.5 }} />

            {/* Tags */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2.5 }}>
              <Chip
                label="VIP Driver"
                size="small"
                sx={{
                  bgcolor: '#F4F4F5',
                  borderRadius: '30px',
                  fontSize: '0.7rem',
                  fontWeight: 500,
                }}
              />
              <Chip
                label="Top Performer"
                size="small"
                sx={{
                  bgcolor: '#F4F4F5',
                  borderRadius: '30px',
                  fontSize: '0.7rem',
                  fontWeight: 500,
                }}
              />
              <Chip
                label="3+ Years"
                size="small"
                sx={{
                  bgcolor: '#F4F4F5',
                  borderRadius: '30px',
                  fontSize: '0.7rem',
                  fontWeight: 500,
                }}
              />
            </Box>

            <Divider sx={{ mb: 2.5 }} />

            {/* Additional Information */}
            <Stack spacing={1.5} sx={{ textAlign: 'left' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#111827', fontSize: '0.8rem' }}>
                Additional Information
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ color: '#6B7280', fontSize: '0.75rem' }}>
                  Location
                </Typography>
                <Typography variant="body2" sx={{ color: '#111827', fontSize: '0.75rem', fontWeight: 500 }}>
                  {driver.address}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ color: '#6B7280', fontSize: '0.75rem' }}>
                  Status
                </Typography>
                <Chip
                  label="Active"
                  size="small"
                  sx={{
                    bgcolor: '#D1FAE5',
                    color: '#065F46',
                    fontSize: '0.6rem',
                    height: 20,
                    fontWeight: 600,
                  }}
                />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ color: '#6B7280', fontSize: '0.75rem' }}>
                  Hire Date
                </Typography>
                <Typography variant="body2" sx={{ color: '#111827', fontSize: '0.75rem', fontWeight: 500 }}>
                  {new Date(driver.hireDate).toLocaleDateString()}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ color: '#6B7280', fontSize: '0.75rem' }}>
                  Total Trips
                </Typography>
                <Typography variant="body2" sx={{ color: '#111827', fontSize: '0.75rem', fontWeight: 600 }}>
                  {driver.tripsCompleted}
                </Typography>
              </Box>
            </Stack>
          </Box>
        </Paper>

        {/* Main Content - Right Side */}
        <Box>
          {/* Navigation Tabs */}
          <DriverNavigationTabs activeTab={activeTab} setActiveTab={setActiveTab} />

          {/* Notification Banners */}
          {notifications.map((notification) => (
            <DriverNotificationBanner
              key={notification.id}
              icon={notification.icon}
              message={notification.message}
              severity={notification.severity}
              onClose={() => handleNotificationClose(notification.id)}
            />
          ))}

          {/* Statistics Cards - Top Row */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={4}>
              <DriverStatCard
                title="Total Trips"
                value={driver.tripsCompleted}
                subtitle="+12% vs last month"
                icon={RouteIcon}
                metrics={[
                  { label: 'This Month', value: '48' },
                  { label: 'This Week', value: '12' },
                ]}
                color="#4F46E5"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <DriverStatCard
                title="Average Rating"
                value={`${driver.rating} ★`}
                subtitle="Based on 156 reviews"
                icon={StarIcon}
                metrics={[
                  { label: '5 Star', value: '82%' },
                  { label: '4 Star', value: '12%' },
                ]}
                color="#F59E0B"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <DriverStatCard
                title="Earnings"
                value="$12,450"
                subtitle="Last 30 days"
                icon={MoneyIcon}
                metrics={[
                  { label: 'Avg/Trip', value: '$36.40' },
                  { label: 'This Week', value: '$2,880' },
                ]}
                color="#22C55E"
              />
            </Grid>
          </Grid>

          {/* Middle Section - Performance & Upcoming Trips */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <DriverPerformanceCard />
            </Grid>
            <Grid item xs={12} md={6}>
              <UpcomingTripsCard />
            </Grid>
          </Grid>

          {/* Bottom Section - License & Additional Info */}
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <LicenseInfoCard driver={driver} />
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: '16px',
                  border: '1px solid #ECECEC',
                  backgroundColor: '#FFFFFF',
                  height: '100%',
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#111827', mb: 2 }}>
                  Quick Actions
                </Typography>
                <Grid container spacing={1.5}>
                  {[
                    { label: 'Assign Trip', icon: <RouteIcon />, color: '#4F46E5' },
                    { label: 'View Documents', icon: <AssignmentIcon />, color: '#8B5CF6' },
                    { label: 'Schedule Training', icon: <CalendarIcon />, color: '#3B82F6' },
                    { label: 'Performance Report', icon: <AssessmentIcon />, color: '#22C55E' },
                  ].map((action) => (
                    <Grid item xs={6} key={action.label}>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={action.icon}
                        sx={{
                          borderRadius: '12px',
                          borderColor: '#ECECEC',
                          color: '#111827',
                          fontSize: '0.7rem',
                          textTransform: 'none',
                          py: 1.5,
                          justifyContent: 'flex-start',
                          '&:hover': {
                            borderColor: action.color,
                            bgcolor: `${action.color}08`,
                          },
                        }}
                      >
                        {action.label}
                      </Button>
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            </Grid>
          </Grid>

          {/* Footer Info */}
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
            <Typography variant="caption" sx={{ color: '#6B7280', fontSize: '0.65rem' }}>
              Last updated: {new Date().toLocaleString()}
            </Typography>
            <Typography variant="caption" sx={{ color: '#6B7280', fontSize: '0.65rem' }}>
              Driver ID: #{driver.licenseNumber}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default DriverDashboard;
