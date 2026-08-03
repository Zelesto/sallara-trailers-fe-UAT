// src/pages/vehicles/VehicleDashboard.jsx
import React, { useState, useEffect } from 'react';
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
  Card,
  CardContent,
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
  Badge,
  Slider,
  Switch,
  FormControlLabel,
  InputAdornment,
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
  AccessTime as AccessTimeIcon,
  BeachAccess as BeachAccessIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  Speed as SpeedIcon,
  LocalGasStation as FuelIcon,
  Build as BuildIcon,
  Receipt as ReceiptIcon,
  Description as DescriptionIcon,
  FileCopy as FileCopyIcon,
  Verified as VerifiedIcon,
  Pending as PendingIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { vehicleService } from '../services/vehicleService';

// Navigation Tabs Component
const VehicleNavigationTabs = ({ activeTab, setActiveTab }) => {
  const handleChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const tabs = [
    'Overview',
    'Fuel Management',
    'Service History',
    'Certificates & Permits',
    'Maintenance',
    'Documents',
    'Notes'
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

// Fuel Tank Component
const FuelTankCard = ({ title, capacity, currentLevel, unit = 'L', color = '#4F46E5', onReset }) => {
  const percentage = (currentLevel / capacity) * 100;
  const getColor = () => {
    if (percentage > 60) return '#22C55E';
    if (percentage > 25) return '#F59E0B';
    return '#EF4444';
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
      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#111827', mb: 2 }}>
        {title}
      </Typography>
      
      {/* Fuel Gauge */}
      <Box sx={{ position: 'relative', mb: 2 }}>
        <Box
          sx={{
            width: '100%',
            height: 20,
            bgcolor: '#F3F4F6',
            borderRadius: 10,
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <Box
            sx={{
              width: `${percentage}%`,
              height: '100%',
              bgcolor: getColor(),
              borderRadius: 10,
              transition: 'width 0.5s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          />
        </Box>
        <Box
          sx={{
            position: 'absolute',
            top: -12,
            right: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
          }}
        >
          <Typography variant="caption" sx={{ fontWeight: 600, color: '#111827' }}>
            {percentage.toFixed(0)}%
          </Typography>
        </Box>
      </Box>

      <Stack spacing={1}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="caption" sx={{ color: '#6B7280' }}>
            Current Level
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 600, color: '#111827' }}>
            {currentLevel} {unit}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="caption" sx={{ color: '#6B7280' }}>
            Capacity
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 600, color: '#111827' }}>
            {capacity} {unit}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="caption" sx={{ color: '#6B7280' }}>
            Range
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 600, color: '#111827' }}>
            {(currentLevel * 0.1).toFixed(0)} km
          </Typography>
        </Box>
        <Button
          variant="outlined"
          size="small"
          startIcon={<RefreshIcon />}
          onClick={() => onReset()}
          sx={{ mt: 1, fontSize: '0.7rem' }}
        >
          Reset to Full
        </Button>
      </Stack>
    </Paper>
  );
};

// Service Record Component
const ServiceRecordCard = ({ service, onEdit, onDelete }) => {
  const statusMap = {
    COMPLETED: { color: '#22C55E', label: 'Completed', icon: CheckCircleIcon },
    SCHEDULED: { color: '#3B82F6', label: 'Scheduled', icon: ScheduleIcon },
    PENDING: { color: '#F59E0B', label: 'Pending', icon: PendingIcon },
    CANCELLED: { color: '#EF4444', label: 'Cancelled', icon: CancelIcon },
  };
  const status = statusMap[service.status] || statusMap.PENDING;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: '12px',
        border: '1px solid #ECECEC',
        mb: 2,
        '&:last-child': { mb: 0 },
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            {service.type}
          </Typography>
          <Typography variant="caption" sx={{ color: '#6B7280', display: 'block' }}>
            {service.date ? new Date(service.date).toLocaleDateString() : 'Date TBD'}
          </Typography>
          <Typography variant="caption" sx={{ color: '#6B7280', display: 'block' }}>
            Odometer: {service.odometer ? `${service.odometer.toLocaleString()} km` : 'N/A'}
          </Typography>
          {service.cost && (
            <Typography variant="caption" sx={{ color: '#6B7280', display: 'block' }}>
              Cost: R{service.cost.toLocaleString()}
            </Typography>
          )}
        </Box>
        <Box sx={{ textAlign: 'right' }}>
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
            icon={React.createElement(status.icon, { sx: { fontSize: '0.6rem' } })}
          />
          <Stack direction="row" spacing={0.5} sx={{ mt: 1 }}>
            <IconButton size="small" onClick={() => onEdit(service)}>
              <EditIcon sx={{ fontSize: '0.8rem' }} />
            </IconButton>
            <IconButton size="small" onClick={() => onDelete(service.id)} color="error">
              <DeleteIcon sx={{ fontSize: '0.8rem' }} />
            </IconButton>
          </Stack>
        </Box>
      </Stack>
    </Paper>
  );
};

// Certificate/Permit Component
const CertificateCard = ({ certificate, onDownload, onVerify }) => {
  const getStatusColor = () => {
    if (certificate.status === 'ACTIVE') return '#22C55E';
    if (certificate.status === 'EXPIRING') return '#F59E0B';
    if (certificate.status === 'EXPIRED') return '#EF4444';
    return '#6B7280';
  };

  const getStatusLabel = () => {
    if (certificate.status === 'ACTIVE') return 'Active';
    if (certificate.status === 'EXPIRING') return 'Expiring Soon';
    if (certificate.status === 'EXPIRED') return 'Expired';
    return 'Unknown';
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: '12px',
        border: '1px solid #ECECEC',
        mb: 2,
        '&:last-child': { mb: 0 },
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              bgcolor: `${getStatusColor()}15`,
              borderRadius: '8px',
              p: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <VerifiedIcon sx={{ color: getStatusColor(), fontSize: '1.2rem' }} />
          </Box>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {certificate.name}
            </Typography>
            <Typography variant="caption" sx={{ color: '#6B7280', display: 'block' }}>
              {certificate.number || 'No number'}
            </Typography>
            <Typography variant="caption" sx={{ color: '#6B7280', display: 'block' }}>
              Expires: {certificate.expiryDate ? new Date(certificate.expiryDate).toLocaleDateString() : 'N/A'}
            </Typography>
          </Box>
        </Box>
        <Stack direction="row" spacing={0.5} alignItems="center">
          <Chip
            label={getStatusLabel()}
            size="small"
            sx={{
              fontSize: '0.6rem',
              height: 20,
              bgcolor: `${getStatusColor()}15`,
              color: getStatusColor(),
              fontWeight: 600,
            }}
          />
          <Tooltip title="Download">
            <IconButton size="small" onClick={() => onDownload(certificate)}>
              <DownloadIcon sx={{ fontSize: '0.8rem' }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Verify">
            <IconButton size="small" onClick={() => onVerify(certificate)}>
              <VerifiedIcon sx={{ fontSize: '0.8rem' }} />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>
    </Paper>
  );
};

// Main Vehicle Dashboard Component
const VehicleDashboard = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [serviceRecords, setServiceRecords] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [openServiceDialog, setOpenServiceDialog] = useState(false);
  const [openCertificateDialog, setOpenCertificateDialog] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [editingCertificate, setEditingCertificate] = useState(null);

  const [fuelData, setFuelData] = useState({
    tank1Capacity: 400,
    tank1Current: 320,
    tank2Capacity: 300,
    tank2Current: 240,
    avgConsumption: 12.5,
    virtualConsumption: 11.8,
  });

  

  // Service records state
  const [serviceRecords, setServiceRecords] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [openServiceDialog, setOpenServiceDialog] = useState(false);
  const [openCertificateDialog, setOpenCertificateDialog] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [editingCertificate, setEditingCertificate] = useState(null);

  // Fetch vehicle data
  useEffect(() => {
    if (id) {
      fetchVehicleData(id);
      fetchServiceRecords(id);
      fetchCertificates(id);
    } else {
      setError('No vehicle ID provided');
      setLoading(false);
    }
  }, [id]);

  const fetchVehicleData = async (vehicleId) => {
    setLoading(true);
    try {
      const data = await vehicleService.getVehicleById(vehicleId);
      setVehicle(data);
      
      // Set fuel data from vehicle
      if (data.fuelCapacity) {
        setFuelData(prev => ({
          ...prev,
          tank1Capacity: data.fuelCapacity || 400,
          tank1Current: data.currentFuelLevel || 320,
          avgConsumption: data.avgConsumption || 12.5,
          virtualConsumption: data.virtualConsumption || 11.8,
        }));
      }

      // Generate notifications
      const newNotifications = [];
      
      // Check license/roadworthy expiry
      if (data.roadworthyExpiry) {
        const expiryDate = new Date(data.roadworthyExpiry);
        const daysUntilExpiry = Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24));
        if (daysUntilExpiry < 0) {
          newNotifications.push({
            id: 1,
            icon: <WarningIcon />,
            message: `Roadworthy certificate has expired. Please renew immediately.`,
            severity: 'error',
          });
        } else if (daysUntilExpiry < 30) {
          newNotifications.push({
            id: 1,
            icon: <WarningIcon />,
            message: `Roadworthy certificate expires in ${daysUntilExpiry} days. Please renew.`,
            severity: 'warning',
          });
        }
      }

      // Check service due
      if (data.nextServiceDue) {
        const serviceDate = new Date(data.nextServiceDue);
        const daysUntilService = Math.ceil((serviceDate - new Date()) / (1000 * 60 * 60 * 24));
        if (daysUntilService < 0) {
          newNotifications.push({
            id: 2,
            icon: <WarningIcon />,
            message: `Service is overdue. Please schedule maintenance.`,
            severity: 'error',
          });
        } else if (daysUntilService < 14) {
          newNotifications.push({
            id: 2,
            icon: <ScheduleIcon />,
            message: `Service due in ${daysUntilService} days. Schedule maintenance.`,
            severity: 'info',
          });
        }
      }

      // Check fuel level
      const fuelPercentage = (fuelData.tank1Current / fuelData.tank1Capacity) * 100;
      if (fuelPercentage < 15) {
        newNotifications.push({
          id: 3,
          icon: <FuelIcon />,
          message: `Fuel level is low (${fuelPercentage.toFixed(0)}%). Please refuel soon.`,
          severity: 'warning',
        });
      }

      setNotifications(newNotifications);
    } catch (err) {
      console.error('Error fetching vehicle data:', err);
      setError('Failed to load vehicle data');
    } finally {
      setLoading(false);
    }
  };

  const fetchServiceRecords = async (vehicleId) => {
    // Mock data - replace with actual API call
    setServiceRecords([
      {
        id: 1,
        type: 'Oil Change',
        date: '2024-06-15',
        odometer: 45000,
        cost: 2500,
        status: 'COMPLETED',
        notes: 'Full synthetic oil change',
      },
      {
        id: 2,
        type: 'Brake Service',
        date: '2024-07-20',
        odometer: 52000,
        cost: 3800,
        status: 'COMPLETED',
        notes: 'Replaced brake pads and discs',
      },
      {
        id: 3,
        type: 'Engine Tune-up',
        date: null,
        odometer: null,
        cost: null,
        status: 'SCHEDULED',
        notes: 'Scheduled for next week',
      },
    ]);
  };

  const fetchCertificates = async (vehicleId) => {
    // Mock data - replace with actual API call
    setCertificates([
      {
        id: 1,
        name: 'Roadworthy Certificate',
        number: 'RWC-2024-001',
        issueDate: '2024-01-15',
        expiryDate: '2025-01-15',
        status: 'ACTIVE',
        type: 'roadworthy',
      },
      {
        id: 2,
        name: 'Operating Permit',
        number: 'OP-2024-045',
        issueDate: '2024-02-01',
        expiryDate: '2024-12-31',
        status: 'ACTIVE',
        type: 'permit',
      },
      {
        id: 3,
        name: 'Insurance Certificate',
        number: 'INS-2024-789',
        issueDate: '2024-03-01',
        expiryDate: '2025-03-01',
        status: 'EXPIRING',
        type: 'insurance',
      },
    ]);
  };

  const handleNotificationClose = (id) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const handleBack = () => {
    navigate('/vehicles');
  };

  const handleEdit = () => {
    navigate(`/vehicles/${id}/edit`);
  };

 const handleResetFuel = (tank) => {
    setFuelData(prev => {
      if (tank === 1) {
        return { ...prev, tank1Current: prev.tank1Capacity };
      } else {
        return { ...prev, tank2Current: prev.tank2Capacity };
      }
    });
  };

  const handleAddService = () => {
    setEditingService(null);
    setOpenServiceDialog(true);
  };

  const handleEditService = (service) => {
    setEditingService(service);
    setOpenServiceDialog(true);
  };

  const handleDeleteService = async (serviceId) => {
    if (!window.confirm('Are you sure you want to delete this service record?')) return;
    // Implement delete
    setServiceRecords(serviceRecords.filter(s => s.id !== serviceId));
  };

  const handleAddCertificate = () => {
    setEditingCertificate(null);
    setOpenCertificateDialog(true);
  };

  const handleDownloadCertificate = (certificate) => {
    // Implement download
    console.log('Download certificate:', certificate);
  };

  const handleVerifyCertificate = (certificate) => {
    // Implement verification
    console.log('Verify certificate:', certificate);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress size={40} />
        <Typography sx={{ ml: 2, fontSize: '0.9rem' }}>Loading vehicle data...</Typography>
      </Box>
    );
  }

  if (error || !vehicle) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error" sx={{ fontSize: '0.8rem' }}>{error || 'Vehicle not found'}</Alert>
        <Button
          variant="contained"
          size="small"
          onClick={handleBack}
          sx={{ mt: 2, fontSize: '0.8rem' }}
        >
          Back to Vehicles
        </Button>
      </Box>
    );
  }

  // Calculate derived data
  const totalFuelCapacity = fuelData.tank1Capacity + fuelData.tank2Capacity;
  const totalFuelCurrent = fuelData.tank1Current + fuelData.tank2Current;
  const fuelPercentage = (totalFuelCurrent / totalFuelCapacity) * 100;

 return (
    <Box sx={{ bgcolor: '#F7F7FC', minHeight: '100vh', p: { xs: 2, md: 3 } }}>
      <Box sx={{ maxWidth: '1440px', margin: '0 auto', display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '320px 1fr' }, gap: 3 }}>
        
        {/* Left Panel - Vehicle Profile */}
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
          <Button
            startIcon={<ArrowBackIcon sx={{ fontSize: '0.9rem' }} />}
            size="small"
            onClick={handleBack}
            sx={{ mb: 2.5, fontSize: '0.75rem', color: '#6B7280', '&:hover': { bgcolor: 'transparent' } }}
          >
            Back to Vehicles
          </Button>

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
                <CarIcon sx={{ fontSize: 40 }} />
              </Avatar>
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 8,
                  right: -8,
                  bgcolor: vehicle.status === 'ACTIVE' || vehicle.status === 'AVAILABLE' ? '#22C55E' : '#EF4444',
                  borderRadius: '50%',
                  width: 14,
                  height: 14,
                  border: '2px solid white',
                }}
              />
            </Box>

            <Typography variant="h5" sx={{ fontWeight: 700, color: '#111827' }}>
              {vehicle.make} {vehicle.model}
            </Typography>
            <Typography variant="body2" sx={{ color: '#6B7280', mb: 1 }}>
              {vehicle.registrationNumber} • {vehicle.year}
            </Typography>
            <Typography variant="body2" sx={{ color: '#6B7280', mb: 2 }}>
              {vehicle.vehicleType} • {vehicle.fuelType}
            </Typography>

            <Button
              variant="outlined"
              fullWidth
              startIcon={<EditIcon sx={{ fontSize: '0.9rem' }} />}
              onClick={handleEdit}
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
              Edit Vehicle
            </Button>

            <Divider sx={{ mb: 2.5 }} />

            {/* Vehicle Information */}
            <Stack spacing={1.5} sx={{ textAlign: 'left' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#111827', fontSize: '0.8rem' }}>
                Vehicle Information
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ color: '#6B7280', fontSize: '0.75rem' }}>Status</Typography>
                <Chip
                  label={vehicle.status || 'Unknown'}
                  size="small"
                  sx={{
                    bgcolor: vehicle.status === 'ACTIVE' || vehicle.status === 'AVAILABLE' ? '#D1FAE5' : '#FEE2E2',
                    color: vehicle.status === 'ACTIVE' || vehicle.status === 'AVAILABLE' ? '#065F46' : '#991B1B',
                    fontSize: '0.6rem',
                    height: 20,
                    fontWeight: 600,
                  }}
                />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ color: '#6B7280', fontSize: '0.75rem' }}>Odometer</Typography>
                <Typography variant="body2" sx={{ color: '#111827', fontSize: '0.75rem', fontWeight: 500 }}>
                  {vehicle.currentOdometer ? `${vehicle.currentOdometer.toLocaleString()} km` : 'N/A'}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ color: '#6B7280', fontSize: '0.75rem' }}>Fuel Type</Typography>
                <Typography variant="body2" sx={{ color: '#111827', fontSize: '0.75rem', fontWeight: 500 }}>
                  {vehicle.fuelType || 'N/A'}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ color: '#6B7280', fontSize: '0.75rem' }}>Avg Consumption</Typography>
                <Typography variant="body2" sx={{ color: '#111827', fontSize: '0.75rem', fontWeight: 500 }}>
                  {vehicle.avgConsumption ? `${vehicle.avgConsumption} L/100km` : 'N/A'}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ color: '#6B7280', fontSize: '0.75rem' }}>Fleet Number</Typography>
                <Typography variant="body2" sx={{ color: '#111827', fontSize: '0.75rem', fontWeight: 500 }}>
                  {vehicle.fleetNumber || 'N/A'}
                </Typography>
              </Box>
            </Stack>

            <Divider sx={{ my: 2.5 }} />

            {/* Fuel Summary */}
            <Box sx={{ textAlign: 'left' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#111827', fontSize: '0.8rem', mb: 1 }}>
                Fuel Summary
              </Typography>
              <Box sx={{ mb: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="caption" sx={{ color: '#6B7280' }}>Total Fuel</Typography>
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>{totalFuelCurrent} / {totalFuelCapacity} L</Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={fuelPercentage}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    bgcolor: '#F3F4F6',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: fuelPercentage > 60 ? '#22C55E' : fuelPercentage > 25 ? '#F59E0B' : '#EF4444',
                      borderRadius: 4,
                    },
                  }}
                />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption" sx={{ color: '#6B7280', fontSize: '0.6rem' }}>
                  Est. Range: {(totalFuelCurrent * 0.1).toFixed(0)} km
                </Typography>
                <Typography variant="caption" sx={{ color: '#6B7280', fontSize: '0.6rem' }}>
                  {fuelPercentage.toFixed(0)}%
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ my: 2.5 }} />

            {/* Quick Stats */}
            <Stack spacing={1} sx={{ textAlign: 'left' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#111827', fontSize: '0.8rem' }}>
                Quick Stats
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ color: '#6B7280', fontSize: '0.75rem' }}>Total Trips</Typography>
                <Typography variant="body2" sx={{ color: '#111827', fontSize: '0.75rem', fontWeight: 600 }}>
                  {vehicle.totalTrips || 0}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ color: '#6B7280', fontSize: '0.75rem' }}>Services Done</Typography>
                <Typography variant="body2" sx={{ color: '#111827', fontSize: '0.75rem', fontWeight: 600 }}>
                  {serviceRecords.filter(s => s.status === 'COMPLETED').length}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ color: '#6B7280', fontSize: '0.75rem' }}>Certificates</Typography>
                <Typography variant="body2" sx={{ color: '#111827', fontSize: '0.75rem', fontWeight: 600 }}>
                  {certificates.filter(c => c.status === 'ACTIVE').length} Active
                </Typography>
              </Box>
            </Stack>
          </Box>
        </Paper>

        {/* Right Panel - Main Content */}
        <Box>
          <VehicleNavigationTabs activeTab={activeTab} setActiveTab={setActiveTab} />

          {notifications.map((notification) => (
            <DriverNotificationBanner
              key={notification.id}
              icon={notification.icon}
              message={notification.message}
              severity={notification.severity}
              onClose={() => handleNotificationClose(notification.id)}
            />
          ))}
          
          {/* Tab Content */}
          {activeTab === 0 && (
            <OverviewTab
              vehicle={vehicle}
              fuelData={fuelData}
              serviceRecords={serviceRecords}
              certificates={certificates}
              loading={loading}
              navigate={navigate}
              id={id}
              handleResetFuel={handleResetFuel}
            />
          )}

          {activeTab === 1 && (
            <FuelManagementTab
              fuelData={fuelData}
              setFuelData={setFuelData}
              vehicle={vehicle}
              onResetFuel={handleResetFuel}
            />
          )}

          {activeTab === 2 && (
            <ServiceHistoryTab
              serviceRecords={serviceRecords}
              loading={loading}
              onAdd={handleAddService}
              onEdit={handleEditService}
              onDelete={handleDeleteService}
            />
          )}

          {activeTab === 3 && (
            <CertificatesTab
              certificates={certificates}
              loading={loading}
              onAdd={handleAddCertificate}
              onDownload={handleDownloadCertificate}
              onVerify={handleVerifyCertificate}
            />
          )}

          {activeTab === 4 && (
            <MaintenanceTab vehicle={vehicle} />
          )}

          {activeTab === 5 && (
            <DocumentsTab vehicle={vehicle} />
          )}

          {activeTab === 6 && (
            <NotesTab vehicle={vehicle} />
          )}
        </Box>
      </Box>

      {/* Dialogs */}
      <ServiceDialog
        open={openServiceDialog}
        onClose={() => setOpenServiceDialog(false)}
        service={editingService}
        onSave={(data) => {
          if (editingService) {
            setServiceRecords(serviceRecords.map(s => s.id === editingService.id ? { ...s, ...data } : s));
          } else {
            setServiceRecords([...serviceRecords, { ...data, id: Date.now() }]);
          }
          setOpenServiceDialog(false);
        }}
      />

      <CertificateDialog
        open={openCertificateDialog}
        onClose={() => setOpenCertificateDialog(false)}
        certificate={editingCertificate}
        onSave={(data) => {
          if (editingCertificate) {
            setCertificates(certificates.map(c => c.id === editingCertificate.id ? { ...c, ...data } : c));
          } else {
            setCertificates([...certificates, { ...data, id: Date.now(), status: 'ACTIVE' }]);
          }
          setOpenCertificateDialog(false);
        }}
      />
    </Box>
  );
};

// Overview Tab
const OverviewTab = ({ vehicle, fuelData, serviceRecords, certificates, loading, navigate, id, handleResetFuel }) => (
 // Ensure handleResetFuel is a function before using
  const safeResetFuel = (tank) => {
    if (typeof handleResetFuel === 'function') {
      handleResetFuel(tank);
    } else {
      console.warn('handleResetFuel is not a function');
    }
  };

  return (
  <Box>
    <Grid container spacing={2} sx={{ mb: 3 }}>
      <Grid item xs={12} md={4}>
        <VehicleStatCard
          title="Total Distance"
          value={vehicle.currentOdometer ? `${vehicle.currentOdometer.toLocaleString()} km` : 'N/A'}
          subtitle="Lifetime distance"
          icon={RouteIcon}
          color="#4F46E5"
          loading={loading}
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <VehicleStatCard
          title="Fuel Efficiency"
          value={vehicle.avgConsumption ? `${vehicle.avgConsumption} L/100km` : 'N/A'}
          subtitle="Average consumption"
          icon={FuelIcon}
          color="#F59E0B"
          loading={loading}
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <VehicleStatCard
          title="Service Status"
          value={serviceRecords.filter(s => s.status === 'COMPLETED').length > 0 ? 'Up to date' : 'Due'}
          subtitle={`${serviceRecords.filter(s => s.status === 'SCHEDULED').length} scheduled`}
          icon={BuildIcon}
          color="#22C55E"
          loading={loading}
        />
      </Grid>
    </Grid>

    {/* Fuel Tanks */}
   <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <FuelTankCard
            title="Main Tank"
            capacity={fuelData.tank1Capacity}
            currentLevel={fuelData.tank1Current}
            color="#4F46E5"
            onReset={() => safeResetFuel(1)} 
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <FuelTankCard
            title="Reserve Tank"
            capacity={fuelData.tank2Capacity}
            currentLevel={fuelData.tank2Current}
            color="#8B5CF6"
            onReset={() => safeResetFuel(2)} 
          />
        </Grid>
      </Grid>

    {/* Recent Services & Certificates */}
    <Grid container spacing={2}>
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2, borderRadius: '16px', border: '1px solid #ECECEC' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
            Recent Services
          </Typography>
          {serviceRecords.slice(0, 3).map(service => (
            <ServiceRecordCard
              key={service.id}
              service={service}
              onEdit={() => {}}
              onDelete={() => {}}
            />
          ))}
          {serviceRecords.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
              No service records
            </Typography>
          )}
          <Button size="small" sx={{ mt: 1, fontSize: '0.7rem', color: '#4F46E5' }}>
            View All Services
          </Button>
        </Paper>
      </Grid>
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2, borderRadius: '16px', border: '1px solid #ECECEC' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
            Active Certificates
          </Typography>
          {certificates.filter(c => c.status === 'ACTIVE' || c.status === 'EXPIRING').slice(0, 3).map(cert => (
            <CertificateCard
              key={cert.id}
              certificate={cert}
              onDownload={() => {}}
              onVerify={() => {}}
            />
          ))}
          {certificates.filter(c => c.status === 'ACTIVE').length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
              No active certificates
            </Typography>
          )}
          <Button size="small" sx={{ mt: 1, fontSize: '0.7rem', color: '#4F46E5' }}>
            View All Certificates
          </Button>
        </Paper>
      </Grid>
    </Grid>
  </Box>
);

// Fuel Management Tab
const FuelManagementTab = ({ fuelData, setFuelData, vehicle, onResetFuel }) => {
  const handleConsumptionChange = (type, value) => {
    setFuelData(prev => ({
      ...prev,
      [type]: parseFloat(value) || 0,
    }));
  };

  return (
    <Box>
      <Paper sx={{ p: 3, borderRadius: '16px', border: '1px solid #ECECEC', mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
          Fuel Consumption Settings
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="User Set Average Consumption (L/100km)"
              type="number"
              value={fuelData.avgConsumption}
              onChange={(e) => handleConsumptionChange('avgConsumption', e.target.value)}
              size="medium"
              InputProps={{
                startAdornment: <InputAdornment position="start"><FuelIcon /></InputAdornment>,
                endAdornment: <InputAdornment position="end">L/100km</InputAdornment>,
              }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              Based on user input and manual calculations
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Virtual Average Consumption (L/100km)"
              type="number"
              value={fuelData.virtualConsumption}
              onChange={(e) => handleConsumptionChange('virtualConsumption', e.target.value)}
              size="medium"
              InputProps={{
                startAdornment: <InputAdornment position="start"><TrendingUpIcon /></InputAdornment>,
                endAdornment: <InputAdornment position="end">L/100km</InputAdornment>,
              }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              Based on refills and month-end confirmations
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <FuelTankCard
            title="Main Tank"
            capacity={fuelData.tank1Capacity}
            currentLevel={fuelData.tank1Current}
            color="#4F46E5"
            onReset={() => onResetFuel(1)}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <FuelTankCard
            title="Reserve Tank"
            capacity={fuelData.tank2Capacity}
            currentLevel={fuelData.tank2Current}
            color="#8B5CF6"
            onReset={() => onResetFuel(2)}
          />
        </Grid>
      </Grid>

      <Paper sx={{ p: 3, borderRadius: '16px', border: '1px solid #ECECEC', mt: 3 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
          Fuel Consumption Comparison
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card sx={{ bgcolor: '#F9FAFB' }}>
              <CardContent>
                <Typography variant="caption" color="text.secondary">User Set Average</Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#4F46E5' }}>
                  {fuelData.avgConsumption} L/100km
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  Est. Range: {(fuelData.tank1Current / fuelData.avgConsumption * 100).toFixed(0)} km
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card sx={{ bgcolor: '#F9FAFB' }}>
              <CardContent>
                <Typography variant="caption" color="text.secondary">Virtual Average</Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#8B5CF6' }}>
                  {fuelData.virtualConsumption} L/100km
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  Est. Range: {(fuelData.tank2Current / fuelData.virtualConsumption * 100).toFixed(0)} km
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

// Service History Tab
const ServiceHistoryTab = ({ serviceRecords, loading, onAdd, onEdit, onDelete }) => {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
        <CircularProgress size={40} />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Service History
        </Typography>
        <Button
          variant="contained"
          size="small"
          startIcon={<AddIcon />}
          onClick={onAdd}
          sx={{ fontSize: '0.75rem' }}
        >
          Add Service Record
        </Button>
      </Box>

      {serviceRecords.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: '16px', border: '1px solid #ECECEC' }}>
          <Typography variant="body1" color="text.secondary">
            No service records found
          </Typography>
          <Button variant="text" onClick={onAdd} sx={{ mt: 1 }}>
            Add your first service record
          </Button>
        </Paper>
      ) : (
        serviceRecords.map(service => (
          <ServiceRecordCard
            key={service.id}
            service={service}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))
      )}
    </Box>
  );
};

// Certificates Tab
const CertificatesTab = ({ certificates, loading, onAdd, onDownload, onVerify }) => {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
        <CircularProgress size={40} />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Certificates & Permits
        </Typography>
        <Button
          variant="contained"
          size="small"
          startIcon={<AddIcon />}
          onClick={onAdd}
          sx={{ fontSize: '0.75rem' }}
        >
          Add Certificate
        </Button>
      </Box>

      {certificates.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: '16px', border: '1px solid #ECECEC' }}>
          <Typography variant="body1" color="text.secondary">
            No certificates or permits found
          </Typography>
          <Button variant="text" onClick={onAdd} sx={{ mt: 1 }}>
            Add your first certificate
          </Button>
        </Paper>
      ) : (
        certificates.map(cert => (
          <CertificateCard
            key={cert.id}
            certificate={cert}
            onDownload={onDownload}
            onVerify={onVerify}
          />
        ))
      )}
    </Box>
  );
};

// Helper Components
const VehicleStatCard = ({ title, value, subtitle, icon: Icon, color = '#4F46E5', loading }) => (
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
        <Box sx={{ bgcolor: `${color}15`, borderRadius: '10px', p: 0.75, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon sx={{ color: color, fontSize: '1.25rem' }} />
        </Box>
      )}
    </Box>
    {loading ? (
      <CircularProgress size={24} />
    ) : (
      <>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#111827', mb: 0.5 }}>
          {value || 'N/A'}
        </Typography>
        {subtitle && (
          <Typography variant="caption" sx={{ color: '#6B7280', display: 'block' }}>
            {subtitle}
          </Typography>
        )}
      </>
    )}
  </Paper>
);

// DriverNotificationBanner (reused from DriverDashboard)
const DriverNotificationBanner = ({ icon, message, onClose, severity = 'info' }) => {
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
        '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.05)' },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1 }}>
        <Box sx={{ bgcolor: getBackgroundColor(), borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
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

// Service Dialog
const ServiceDialog = ({ open, onClose, service, onSave }) => {
  const [formData, setFormData] = useState({
    type: '',
    date: '',
    odometer: '',
    cost: '',
    status: 'SCHEDULED',
    notes: '',
  });

  useEffect(() => {
    if (service) {
      setFormData({
        type: service.type || '',
        date: service.date || '',
        odometer: service.odometer || '',
        cost: service.cost || '',
        status: service.status || 'SCHEDULED',
        notes: service.notes || '',
      });
    } else {
      setFormData({
        type: '',
        date: '',
        odometer: '',
        cost: '',
        status: 'SCHEDULED',
        notes: '',
      });
    }
  }, [service, open]);

  const handleSubmit = () => {
    onSave(formData);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{service ? 'Edit Service Record' : 'Add Service Record'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Service Type"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            fullWidth
            size="small"
            required
          />
          <TextField
            label="Date"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            InputLabelProps={{ shrink: true }}
            fullWidth
            size="small"
          />
          <TextField
            label="Odometer (km)"
            type="number"
            value={formData.odometer}
            onChange={(e) => setFormData({ ...formData, odometer: e.target.value })}
            fullWidth
            size="small"
          />
          <TextField
            label="Cost (ZAR)"
            type="number"
            value={formData.cost}
            onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
            fullWidth
            size="small"
          />
          <FormControl fullWidth size="small">
            <InputLabel>Status</InputLabel>
            <Select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              label="Status"
            >
              <MenuItem value="SCHEDULED">Scheduled</MenuItem>
              <MenuItem value="PENDING">Pending</MenuItem>
              <MenuItem value="COMPLETED">Completed</MenuItem>
              <MenuItem value="CANCELLED">Cancelled</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="Notes"
            multiline
            rows={2}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            fullWidth
            size="small"
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          {service ? 'Update' : 'Add'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Certificate Dialog
const CertificateDialog = ({ open, onClose, certificate, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    number: '',
    issueDate: '',
    expiryDate: '',
    type: 'roadworthy',
  });

  useEffect(() => {
    if (certificate) {
      setFormData({
        name: certificate.name || '',
        number: certificate.number || '',
        issueDate: certificate.issueDate || '',
        expiryDate: certificate.expiryDate || '',
        type: certificate.type || 'roadworthy',
      });
    } else {
      setFormData({
        name: '',
        number: '',
        issueDate: '',
        expiryDate: '',
        type: 'roadworthy',
      });
    }
  }, [certificate, open]);

  const handleSubmit = () => {
    onSave(formData);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{certificate ? 'Edit Certificate' : 'Add Certificate'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Certificate Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            fullWidth
            size="small"
            required
          />
          <TextField
            label="Certificate Number"
            value={formData.number}
            onChange={(e) => setFormData({ ...formData, number: e.target.value })}
            fullWidth
            size="small"
          />
          <FormControl fullWidth size="small">
            <InputLabel>Type</InputLabel>
            <Select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              label="Type"
            >
              <MenuItem value="roadworthy">Roadworthy</MenuItem>
              <MenuItem value="permit">Operating Permit</MenuItem>
              <MenuItem value="insurance">Insurance</MenuItem>
              <MenuItem value="license">License</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="Issue Date"
            type="date"
            value={formData.issueDate}
            onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
            InputLabelProps={{ shrink: true }}
            fullWidth
            size="small"
          />
          <TextField
            label="Expiry Date"
            type="date"
            value={formData.expiryDate}
            onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
            InputLabelProps={{ shrink: true }}
            fullWidth
            size="small"
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          {certificate ? 'Update' : 'Add'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Placeholder tabs for remaining sections
const MaintenanceTab = ({ vehicle }) => (
  <Box>
    <Typography variant="body1" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
      Maintenance schedule and history will be displayed here
    </Typography>
  </Box>
);

const DocumentsTab = ({ vehicle }) => (
  <Box>
    <Typography variant="body1" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
      Vehicle documents will be displayed here
    </Typography>
  </Box>
);

const NotesTab = ({ vehicle }) => (
  <Box>
    <Typography variant="body1" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
      Vehicle notes will be displayed here
    </Typography>
  </Box>
);

export default VehicleDashboard;
