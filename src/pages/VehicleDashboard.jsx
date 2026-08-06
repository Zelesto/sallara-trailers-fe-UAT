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
  Input,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemAvatar,
  Avatar as MuiAvatar,
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
  GpsFixed as GpsFixedIcon,
  Speed as SpeedIconAlt,
  Timer as TimerIcon,
  Scale as WeightIcon,
  Scale as ScaleIcon,
  Engineering as EngineeringIcon,
} from '@mui/icons-material';
import { vehicleService } from '../services/vehicleService';
import { fuelService } from '../services/fuelService';
import { certificateService } from '../services/certificateService';
import { maintenanceService } from '../services/maintenanceService';
import tripService from '../services/tripService';

// ============================================================
// NAVIGATION TABS
// ============================================================
const VehicleNavigationTabs = ({ activeTab, setActiveTab }) => {
  const handleChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const tabs = [
    { label: 'Overview', icon: <DashboardIcon /> },
    { label: 'Specifications', icon: <SettingsIcon /> },
    { label: 'Fuel Management', icon: <FuelIcon /> },
    { label: 'Service History', icon: <BuildIcon /> },
    { label: 'Certificates & Permits', icon: <VerifiedIcon /> },
    { label: 'Trips', icon: <RouteIcon /> },
    { label: 'Documents', icon: <DescriptionIcon /> },
    { label: 'Notes', icon: <InfoIcon /> },
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
            fontSize: '0.8rem',
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
        {tabs.map((tab) => (
          <Tab 
            key={tab.label} 
            label={tab.label} 
            icon={tab.icon} 
            iconPosition="start"
          />
        ))}
      </Tabs>
    </Box>
  );
};

// ============================================================
// FUEL TANK CARD
// ============================================================
const FuelTankCard = ({ title, capacity, currentLevel, unit = 'L', color = '#4F46E5', onReset }) => {
  const percentage = capacity > 0 ? (currentLevel / capacity) * 100 : 0;
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
      
      <Box sx={{ position: 'relative', mb: 2 }}>
        <Box
          sx={{
            width: '100%',
            height: 24,
            bgcolor: '#F3F4F6',
            borderRadius: 12,
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <Box
            sx={{
              width: `${Math.min(percentage, 100)}%`,
              height: '100%',
              bgcolor: getColor(),
              borderRadius: 12,
              transition: 'width 0.5s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              justifyContent: 'space-between',
              px: 1,
              alignItems: 'center',
              pointerEvents: 'none',
            }}
          >
            {[0, 25, 50, 75, 100].map((mark) => (
              <Box
                key={mark}
                sx={{
                  width: 2,
                  height: 8,
                  bgcolor: 'rgba(255,255,255,0.3)',
                  borderRadius: 1,
                }}
              />
            ))}
          </Box>
        </Box>
        <Box
          sx={{
            position: 'absolute',
            top: -14,
            right: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
          }}
        >
          <Typography variant="caption" sx={{ fontWeight: 700, color: '#111827' }}>
            {percentage.toFixed(0)}%
          </Typography>
        </Box>
      </Box>

      <Stack spacing={1.5}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="caption" sx={{ color: '#6B7280', fontWeight: 500 }}>
            Current Level
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 700, color: '#111827' }}>
            {currentLevel.toFixed(1)} {unit}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="caption" sx={{ color: '#6B7280', fontWeight: 500 }}>
            Capacity
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 700, color: '#111827' }}>
            {capacity} {unit}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="caption" sx={{ color: '#6B7280', fontWeight: 500 }}>
            Est. Range
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 700, color: '#4F46E5' }}>
            {(currentLevel * 0.1).toFixed(0)} km
          </Typography>
        </Box>
        <Button
          variant="outlined"
          size="small"
          startIcon={<RefreshIcon />}
          onClick={() => {
            if (typeof onReset === 'function') {
              onReset();
            }
          }}
          sx={{ 
            mt: 1, 
            fontSize: '0.7rem',
            borderRadius: '8px',
            borderColor: '#4F46E5',
            color: '#4F46E5',
            '&:hover': {
              borderColor: '#4F46E5',
              bgcolor: '#EEF2FF',
            },
          }}
        >
          Reset to Full
        </Button>
      </Stack>
    </Paper>
  );
};

// ============================================================
// SPECIFICATIONS TAB
// ============================================================
const SpecificationsTab = ({ vehicle }) => {
  const specs = [
    { label: 'Engine Capacity', value: vehicle.engineCapacity ? `${vehicle.engineCapacity} L` : 'N/A', icon: <SettingsIcon /> },
    { label: 'Horsepower', value: vehicle.horsepower ? `${vehicle.horsepower} HP` : 'N/A', icon: <SpeedIcon /> },
    { label: 'Torque', value: vehicle.torque ? `${vehicle.torque} Nm` : 'N/A', icon: <SpeedIconAlt /> },
    { label: 'Transmission', value: vehicle.transmissionType || 'N/A', icon: <SettingsIcon /> },
    { label: 'Axle Configuration', value: vehicle.axleConfiguration || 'N/A', icon: <SettingsIcon /> },
    { label: 'Gross Vehicle Weight', value: vehicle.grossVehicleWeight ? `${vehicle.grossVehicleWeight} kg` : 'N/A', icon: <WeightIcon /> },
    { label: 'Tare Weight', value: vehicle.tareWeight ? `${vehicle.tareWeight} kg` : 'N/A', icon: <ScaleIcon /> },
    { label: 'Payload Capacity', value: vehicle.payloadCapacity ? `${vehicle.payloadCapacity} kg` : 'N/A', icon: <ScaleIcon /> },
    { label: 'Fuel Capacity', value: vehicle.fuelCapacity ? `${vehicle.fuelCapacity} L` : 'N/A', icon: <FuelIcon /> },
    { label: 'Color', value: vehicle.color || 'N/A', icon: <InfoIcon /> },
    { label: 'Number of Axles', value: vehicle.numberOfAxles || 'N/A', icon: <SettingsIcon /> },
    { label: 'Tire Size', value: vehicle.tireSize || 'N/A', icon: <SettingsIcon /> },
  ];

  return (
    <Grid container spacing={2}>
      {specs.map((spec, index) => (
        <Grid item xs={12} sm={6} md={4} key={index}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: '12px',
              border: '1px solid #ECECEC',
              bgcolor: '#F9FAFB',
              display: 'flex',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <Box
              sx={{
                bgcolor: '#EEF2FF',
                borderRadius: '8px',
                p: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#4F46E5',
              }}
            >
              {spec.icon}
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: '#6B7280', display: 'block', fontSize: '0.6rem', textTransform: 'uppercase', fontWeight: 600 }}>
                {spec.label}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#111827' }}>
                {spec.value}
              </Typography>
            </Box>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
};

// ============================================================
// FUEL MANAGEMENT TAB
// ============================================================
const FuelManagementTab = ({ fuelData, setFuelData, vehicle, onResetFuel, onUpdateFuel }) => {
  const [saving, setSaving] = useState(false);

  const handleConsumptionChange = (type, value) => {
    setFuelData(prev => ({
      ...prev,
      [type]: parseFloat(value) || 0,
    }));
  };


  const handleSaveSettings = async () => {
  setSaving(true);
  try {
    // Create the fuel data object with the correct format
    const fuelData = {
      fuelLevel: fuelData.tank1Current,  // Send the current fuel level
      avgConsumption: fuelData.avgConsumption,
      virtualConsumption: fuelData.virtualConsumption,
      fuelCapacity: fuelData.tank1Capacity,
    };
    
    await onUpdateFuel(fuelData);
    // Or if onUpdateFuel expects just the number:
    // await onUpdateFuel(fuelData.tank1Current);
  } catch (err) {
    console.error('Error saving fuel settings:', err);
  } finally {
    setSaving(false);
  }
};
  

  return (
    <Box>
      <Paper sx={{ p: 3, borderRadius: '16px', border: '1px solid #ECECEC', mb: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Fuel Consumption Settings
          </Typography>
          <Button
            variant="contained"
            size="small"
            onClick={handleSaveSettings}
            disabled={saving}
            sx={{
              background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)',
            }}
          >
            {saving ? <CircularProgress size={20} /> : 'Save Settings'}
          </Button>
        </Stack>
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
            <Card sx={{ bgcolor: '#F9FAFB', borderRadius: '12px' }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="caption" color="text.secondary">User Set Average</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#4F46E5', mt: 0.5 }}>
                      {fuelData.avgConsumption} L/100km
                    </Typography>
                  </Box>
                  <Box sx={{ bgcolor: '#EEF2FF', p: 1, borderRadius: '8px' }}>
                    <TrendingUpIcon sx={{ color: '#4F46E5' }} />
                  </Box>
                </Stack>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                  Est. Range: {(fuelData.tank1Current / fuelData.avgConsumption * 100).toFixed(0)} km
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card sx={{ bgcolor: '#F9FAFB', borderRadius: '12px' }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="caption" color="text.secondary">Virtual Average</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#8B5CF6', mt: 0.5 }}>
                      {fuelData.virtualConsumption} L/100km
                    </Typography>
                  </Box>
                  <Box sx={{ bgcolor: '#EDE9FE', p: 1, borderRadius: '8px' }}>
                    <TrendingUpIcon sx={{ color: '#8B5CF6' }} />
                  </Box>
                </Stack>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
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

// ============================================================
// SERVICE HISTORY TAB
// ============================================================
const ServiceHistoryTab = ({ serviceRecords, loading, onAdd, onEdit, onDelete, onRefresh }) => {
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
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<RefreshIcon />}
            onClick={onRefresh}
            sx={{ fontSize: '0.75rem' }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={onAdd}
            sx={{ 
              fontSize: '0.75rem',
              borderRadius: '10px',
              textTransform: 'none',
              background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)',
            }}
          >
            Add Service Record
          </Button>
        </Stack>
      </Box>

      {serviceRecords.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: '16px', border: '1px solid #ECECEC' }}>
          <BuildIcon sx={{ fontSize: 48, color: '#D1D5DB', mb: 2 }} />
          <Typography variant="body1" color="text.secondary">
            No service records found
          </Typography>
          <Button variant="text" onClick={onAdd} sx={{ mt: 1, color: '#4F46E5' }}>
            Add your first service record
          </Button>
        </Paper>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: '12px', border: '1px solid #ECECEC' }}>
          <Table>
            <TableHead sx={{ bgcolor: '#F9FAFB' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', color: '#6B7280' }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', color: '#6B7280' }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', color: '#6B7280' }}>Odometer</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', color: '#6B7280' }}>Cost</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', color: '#6B7280' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', color: '#6B7280' }}>Notes</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', color: '#6B7280' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {serviceRecords.map((service) => (
                <TableRow key={service.id} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>
                      {service.type}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.8rem' }}>
                    {service.date ? new Date(service.date).toLocaleDateString() : 'N/A'}
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.8rem' }}>
                    {service.odometer ? `${service.odometer.toLocaleString()} km` : 'N/A'}
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.8rem' }}>
                    {service.cost ? `R${service.cost.toLocaleString()}` : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={service.status}
                      size="small"
                      sx={{
                        fontSize: '0.6rem',
                        height: 20,
                        bgcolor: service.status === 'COMPLETED' ? '#D1FAE5' : 
                                 service.status === 'SCHEDULED' ? '#DBEAFE' : 
                                 service.status === 'PENDING' ? '#FEF3C7' : '#FEE2E2',
                        color: service.status === 'COMPLETED' ? '#065F46' : 
                               service.status === 'SCHEDULED' ? '#1E40AF' : 
                               service.status === 'PENDING' ? '#92400E' : '#991B1B',
                        fontWeight: 600,
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', color: '#6B7280' }}>
                    {service.notes || '-'}
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.5}>
                      <IconButton size="small" onClick={() => onEdit(service)}>
                        <EditIcon sx={{ fontSize: '0.8rem', color: '#6B7280' }} />
                      </IconButton>
                      <IconButton size="small" onClick={() => onDelete(service.id)}>
                        <DeleteIcon sx={{ fontSize: '0.8rem', color: '#EF4444' }} />
                      </IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

// ============================================================
// CERTIFICATES & PERMITS TAB
// ============================================================
const CertificatesTab = ({ certificates, loading, onAdd, onDownload, onVerify, onRefresh }) => {
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
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<RefreshIcon />}
            onClick={onRefresh}
            sx={{ fontSize: '0.75rem' }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={onAdd}
            sx={{ 
              fontSize: '0.75rem',
              borderRadius: '10px',
              textTransform: 'none',
              background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)',
            }}
          >
            Add Certificate
          </Button>
        </Stack>
      </Box>

      {certificates.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: '16px', border: '1px solid #ECECEC' }}>
          <VerifiedIcon sx={{ fontSize: 48, color: '#D1D5DB', mb: 2 }} />
          <Typography variant="body1" color="text.secondary">
            No certificates or permits found
          </Typography>
          <Button variant="text" onClick={onAdd} sx={{ mt: 1, color: '#4F46E5' }}>
            Add your first certificate
          </Button>
        </Paper>
      ) : (
        certificates.map((cert) => {
          const statusColor = cert.status === 'ACTIVE' ? '#22C55E' : 
                             cert.status === 'EXPIRING' ? '#F59E0B' : '#EF4444';
          const statusLabel = cert.status === 'ACTIVE' ? 'Active' : 
                             cert.status === 'EXPIRING' ? 'Expiring Soon' : 'Expired';
          
          return (
            <Paper
              key={cert.id}
              elevation={0}
              sx={{
                p: 2,
                mb: 2,
                borderRadius: '12px',
                border: '1px solid #ECECEC',
                '&:last-child': { mb: 0 },
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      bgcolor: `${statusColor}15`,
                      borderRadius: '10px',
                      p: 1.5,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <VerifiedIcon sx={{ color: statusColor, fontSize: '1.5rem' }} />
                  </Box>
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: '#111827' }}>
                      {cert.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#6B7280', display: 'block' }}>
                      {cert.number || 'No number'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#6B7280', display: 'block' }}>
                      Expires: {cert.expiryDate ? new Date(cert.expiryDate).toLocaleDateString() : 'N/A'}
                    </Typography>
                  </Box>
                </Box>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip
                    label={statusLabel}
                    size="small"
                    sx={{
                      fontSize: '0.6rem',
                      height: 22,
                      bgcolor: `${statusColor}15`,
                      color: statusColor,
                      fontWeight: 600,
                    }}
                  />
                  <Tooltip title="Download">
                    <IconButton size="small" onClick={() => onDownload(cert)}>
                      <DownloadIcon sx={{ fontSize: '0.9rem', color: '#6B7280' }} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Verify">
                    <IconButton size="small" onClick={() => onVerify(cert)}>
                      <VerifiedIcon sx={{ fontSize: '0.9rem', color: '#4F46E5' }} />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Stack>
            </Paper>
          );
        })
      )}
    </Box>
  );
};

// ============================================================
// TRIPS TAB
// ============================================================
const TripsTab = ({ trips, loading, onViewTrip }) => {
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
        <Typography variant="body1" color="text.secondary">
          No trips found for this vehicle
        </Typography>
      </Box>
    );
  }

  return (
    <TableContainer component={Paper} sx={{ borderRadius: '12px', border: '1px solid #ECECEC' }}>
      <Table>
        <TableHead sx={{ bgcolor: '#F9FAFB' }}>
          <TableRow>
            <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', color: '#6B7280' }}>Trip #</TableCell>
            <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', color: '#6B7280' }}>Route</TableCell>
            <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', color: '#6B7280' }}>Driver</TableCell>
            <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', color: '#6B7280' }}>Status</TableCell>
            <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', color: '#6B7280' }}>Date</TableCell>
            <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', color: '#6B7280' }}>Distance</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {trips.map((trip) => (
            <TableRow key={trip.id} hover>
              <TableCell>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#4F46E5' }}>
                  {trip.tripNumber || `#${trip.id}`}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                  {trip.originCity || trip.originLocation} → {trip.destinationCity || trip.destinationLocation}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                  {trip.driverName || trip.driver?.name || 'N/A'}
                </Typography>
              </TableCell>
              <TableCell>
                <Chip
                  label={trip.status}
                  size="small"
                  sx={{
                    fontSize: '0.6rem',
                    height: 20,
                    bgcolor: trip.status === 'COMPLETED' ? '#D1FAE5' : 
                             trip.status === 'IN_PROGRESS' ? '#FEF3C7' : 
                             trip.status === 'CANCELLED' ? '#FEE2E2' : '#DBEAFE',
                    color: trip.status === 'COMPLETED' ? '#065F46' : 
                           trip.status === 'IN_PROGRESS' ? '#92400E' : 
                           trip.status === 'CANCELLED' ? '#991B1B' : '#1E40AF',
                    fontWeight: 500,
                  }}
                />
              </TableCell>
              <TableCell sx={{ fontSize: '0.8rem' }}>
                {trip.plannedStartDate ? new Date(trip.plannedStartDate).toLocaleDateString() : 'N/A'}
              </TableCell>
              <TableCell sx={{ fontSize: '0.8rem' }}>
                {trip.totalDistance ? `${trip.totalDistance} km` : 'N/A'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

// ============================================================
// OVERVIEW TAB
// ============================================================
const OverviewTab = ({ vehicle, fuelData, serviceRecords, certificates, loading, navigate, id, handleResetFuel }) => {
  const safeResetFuel = (tank) => {
    if (typeof handleResetFuel === 'function') {
      handleResetFuel(tank);
    }
  };

  const totalFuelCapacity = fuelData.tank1Capacity + fuelData.tank2Capacity;
  const totalFuelCurrent = fuelData.tank1Current + fuelData.tank2Current;
  const fuelPercentage = totalFuelCapacity > 0 ? (totalFuelCurrent / totalFuelCapacity) * 100 : 0;

  return (
    <Box>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Distance"
            value={vehicle.currentOdometer ? `${vehicle.currentOdometer.toLocaleString()} km` : 'N/A'}
            subtitle="Lifetime distance"
            icon={RouteIcon}
            color="#4F46E5"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Fuel Efficiency"
            value={vehicle.avgConsumption ? `${vehicle.avgConsumption} L/100km` : 'N/A'}
            subtitle="Average consumption"
            icon={FuelIcon}
            color="#F59E0B"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Service Status"
            value={serviceRecords.filter(s => s.status === 'COMPLETED').length > 0 ? 'Up to date' : 'Due'}
            subtitle={`${serviceRecords.filter(s => s.status === 'SCHEDULED').length} scheduled`}
            icon={BuildIcon}
            color="#22C55E"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Fuel Level"
            value={`${fuelPercentage.toFixed(0)}%`}
            subtitle={`${totalFuelCurrent} / ${totalFuelCapacity} L`}
            icon={FuelIcon}
            color={fuelPercentage > 60 ? '#22C55E' : fuelPercentage > 25 ? '#F59E0B' : '#EF4444'}
            loading={loading}
          />
        </Grid>
      </Grid>

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

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, borderRadius: '16px', border: '1px solid #ECECEC' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
              Recent Services
            </Typography>
            {serviceRecords.slice(0, 3).map(service => (
              <ServiceListItem key={service.id} service={service} />
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
              <CertificateListItem key={cert.id} certificate={cert} />
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
};

// ============================================================
// STAT CARD
// ============================================================
const StatCard = ({ title, value, subtitle, icon: Icon, color = '#4F46E5', loading }) => (
  <Paper
    elevation={0}
    sx={{
      p: 2.5,
      borderRadius: '12px',
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
    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
      <Box>
        <Typography variant="caption" sx={{ color: '#6B7280', fontWeight: 500, textTransform: 'uppercase', fontSize: '0.6rem', letterSpacing: '0.5px' }}>
          {title}
        </Typography>
        {loading ? (
          <CircularProgress size={20} sx={{ mt: 1 }} />
        ) : (
          <>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#111827', mt: 0.5 }}>
              {value || 'N/A'}
            </Typography>
            {subtitle && (
              <Typography variant="caption" sx={{ color: '#6B7280', display: 'block', mt: 0.5 }}>
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
            borderRadius: '10px',
            p: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon sx={{ color: color, fontSize: '1.3rem' }} />
        </Box>
      )}
    </Stack>
  </Paper>
);

// ============================================================
// SERVICE LIST ITEM
// ============================================================
const ServiceListItem = ({ service }) => {
  const statusColor = service.status === 'COMPLETED' ? '#22C55E' : 
                     service.status === 'SCHEDULED' ? '#3B82F6' : 
                     service.status === 'PENDING' ? '#F59E0B' : '#EF4444';

  return (
    <Box
      sx={{
        p: 1.5,
        mb: 1.5,
        borderRadius: '10px',
        border: '1px solid #ECECEC',
        '&:last-child': { mb: 0 },
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600, color: '#111827' }}>
            {service.type}
          </Typography>
          <Typography variant="caption" sx={{ color: '#6B7280', display: 'block' }}>
            {service.date ? new Date(service.date).toLocaleDateString() : 'N/A'}
          </Typography>
        </Box>
        <Chip
          label={service.status}
          size="small"
          sx={{
            fontSize: '0.55rem',
            height: 18,
            bgcolor: `${statusColor}15`,
            color: statusColor,
            fontWeight: 600,
          }}
        />
      </Stack>
    </Box>
  );
};

// ============================================================
// CERTIFICATE LIST ITEM
// ============================================================
const CertificateListItem = ({ certificate }) => {
  const statusColor = certificate.status === 'ACTIVE' ? '#22C55E' : '#F59E0B';

  return (
    <Box
      sx={{
        p: 1.5,
        mb: 1.5,
        borderRadius: '10px',
        border: '1px solid #ECECEC',
        '&:last-child': { mb: 0 },
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600, color: '#111827' }}>
            {certificate.name}
          </Typography>
          <Typography variant="caption" sx={{ color: '#6B7280', display: 'block' }}>
            {certificate.number || 'No number'}
          </Typography>
        </Box>
        <Chip
          label={certificate.status === 'ACTIVE' ? 'Active' : 'Expiring'}
          size="small"
          sx={{
            fontSize: '0.55rem',
            height: 18,
            bgcolor: `${statusColor}15`,
            color: statusColor,
            fontWeight: 600,
          }}
        />
      </Stack>
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
        p: 2,
        mb: 1.5,
        borderRadius: '12px',
        border: '1px solid #ECECEC',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: '60px',
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
            width: 36,
            height: 36,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {React.cloneElement(icon, { sx: { color: getIconColor(), fontSize: '1.2rem' } })}
        </Box>
        <Typography variant="body2" sx={{ color: '#111827', fontSize: '0.85rem' }}>
          {message}
        </Typography>
      </Box>
      <IconButton size="small" onClick={onClose} sx={{ color: '#6B7280', flexShrink: 0 }}>
        <CloseIcon sx={{ fontSize: '1rem' }} />
      </IconButton>
    </Paper>
  );
};

// ============================================================
// PLACEHOLDER TABS
// ============================================================
const MaintenanceTab = () => (
  <Box sx={{ py: 4, textAlign: 'center' }}>
    <EngineeringIcon sx={{ fontSize: 48, color: '#D1D5DB', mb: 2 }} />
    <Typography variant="body1" color="text.secondary">
      Maintenance schedule and history will be displayed here
    </Typography>
  </Box>
);

const DocumentsTab = () => (
  <Box sx={{ py: 4, textAlign: 'center' }}>
    <DescriptionIcon sx={{ fontSize: 48, color: '#D1D5DB', mb: 2 }} />
    <Typography variant="body1" color="text.secondary">
      Vehicle documents will be displayed here
    </Typography>
  </Box>
);

const NotesTab = ({ vehicle }) => (
  <Box sx={{ py: 4, textAlign: 'center' }}>
    <InfoIcon sx={{ fontSize: 48, color: '#D1D5DB', mb: 2 }} />
    <Typography variant="body1" color="text.secondary">
      Vehicle notes will be displayed here
    </Typography>
    {vehicle?.notes && (
      <Paper sx={{ mt: 2, p: 3, textAlign: 'left', borderRadius: '12px', border: '1px solid #ECECEC' }}>
        <Typography variant="body2" sx={{ color: '#111827' }}>
          {vehicle.notes}
        </Typography>
      </Paper>
    )}
  </Box>
);

// ============================================================
// SERVICE DIALOG
// ============================================================
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
      <DialogTitle sx={{ fontWeight: 600, color: '#111827' }}>
        {service ? 'Edit Service Record' : 'Add Service Record'}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          <TextField
            label="Service Type"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            fullWidth
            size="medium"
            required
            sx={{ '& .MuiInputLabel-root': { fontSize: '0.8rem' } }}
          />
          <TextField
            label="Date"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            InputLabelProps={{ shrink: true }}
            fullWidth
            size="medium"
            sx={{ '& .MuiInputLabel-root': { fontSize: '0.8rem' } }}
          />
          <TextField
            label="Odometer (km)"
            type="number"
            value={formData.odometer}
            onChange={(e) => setFormData({ ...formData, odometer: e.target.value })}
            fullWidth
            size="medium"
            sx={{ '& .MuiInputLabel-root': { fontSize: '0.8rem' } }}
            InputProps={{
              endAdornment: <InputAdornment position="end">km</InputAdornment>,
            }}
          />
          <TextField
            label="Cost (ZAR)"
            type="number"
            value={formData.cost}
            onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
            fullWidth
            size="medium"
            sx={{ '& .MuiInputLabel-root': { fontSize: '0.8rem' } }}
            InputProps={{
              startAdornment: <InputAdornment position="start">R</InputAdornment>,
            }}
          />
          <FormControl fullWidth size="medium">
            <InputLabel sx={{ fontSize: '0.8rem' }}>Status</InputLabel>
            <Select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              label="Status"
              sx={{ fontSize: '0.85rem' }}
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
            size="medium"
            sx={{ '& .MuiInputLabel-root': { fontSize: '0.8rem' } }}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2.5 }}>
        <Button onClick={onClose} sx={{ color: '#6B7280' }}>Cancel</Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained"
          sx={{
            background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)',
            textTransform: 'none',
            borderRadius: '10px',
            px: 3,
          }}
        >
          {service ? 'Update' : 'Add'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ============================================================
// CERTIFICATE DIALOG
// ============================================================
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
      <DialogTitle sx={{ fontWeight: 600, color: '#111827' }}>
        {certificate ? 'Edit Certificate' : 'Add Certificate'}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          <TextField
            label="Certificate Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            fullWidth
            size="medium"
            required
            sx={{ '& .MuiInputLabel-root': { fontSize: '0.8rem' } }}
          />
          <TextField
            label="Certificate Number"
            value={formData.number}
            onChange={(e) => setFormData({ ...formData, number: e.target.value })}
            fullWidth
            size="medium"
            sx={{ '& .MuiInputLabel-root': { fontSize: '0.8rem' } }}
          />
          <FormControl fullWidth size="medium">
            <InputLabel sx={{ fontSize: '0.8rem' }}>Type</InputLabel>
            <Select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              label="Type"
              sx={{ fontSize: '0.85rem' }}
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
            size="medium"
            sx={{ '& .MuiInputLabel-root': { fontSize: '0.8rem' } }}
          />
          <TextField
            label="Expiry Date"
            type="date"
            value={formData.expiryDate}
            onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
            InputLabelProps={{ shrink: true }}
            fullWidth
            size="medium"
            sx={{ '& .MuiInputLabel-root': { fontSize: '0.8rem' } }}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2.5 }}>
        <Button onClick={onClose} sx={{ color: '#6B7280' }}>Cancel</Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained"
          sx={{
            background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)',
            textTransform: 'none',
            borderRadius: '10px',
            px: 3,
          }}
        >
          {certificate ? 'Update' : 'Add'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ============================================================
// MAIN VEHICLE DASHBOARD
// ============================================================
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
  const [trips, setTrips] = useState([]);
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

  useEffect(() => {
    if (id) {
      fetchVehicleData(id);
      fetchServiceRecords(id);
      fetchCertificates(id);
      fetchTrips(id);
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
      
      if (data.fuelCapacity) {
        setFuelData(prev => ({
          ...prev,
          tank1Capacity: data.fuelCapacity || 400,
          tank1Current: data.currentFuelLevel || 320,
          avgConsumption: data.avgConsumption || 12.5,
          virtualConsumption: data.virtualConsumption || 11.8,
        }));
      }

      const newNotifications = [];
      
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
    try {
      const records = await maintenanceService.getMaintenanceSchedule(vehicleId);
      setServiceRecords(records || []);
    } catch (err) {
      console.error('Error fetching service records:', err);
      setServiceRecords([]);
    }
  };

  const fetchCertificates = async (vehicleId) => {
  try {
    const response = await api.get(`/vehicles/${vehicleId}/certificates`);
    // Ensure we return an array
    if (Array.isArray(response)) {
      return response;
    } else if (response && response.data && Array.isArray(response.data)) {
      return response.data;
    } else if (response && response.content && Array.isArray(response.content)) {
      return response.content;
    }
    return [];
  } catch (error) {
    console.error('Error fetching certificates:', error);
    return [];
  }
};


  const fetchMaintenance = async (vehicleId) => {
  try {
    const response = await api.get(`/vehicles/${vehicleId}/maintenance`);
    // Ensure we return an array
    if (Array.isArray(response)) {
      return response;
    } else if (response && response.data && Array.isArray(response.data)) {
      return response.data;
    } else if (response && response.content && Array.isArray(response.content)) {
      return response.content;
    }
    return [];
  } catch (error) {
    console.error('Error fetching maintenance:', error);
    return [];
  }
};
  
  const fetchTrips = async (vehicleId) => {
    try {
      const tripsData = await tripService.getTripsByVehicle(vehicleId);
      setTrips(tripsData || []);
    } catch (err) {
      console.error('Error fetching trips:', err);
      setTrips([]);
    }
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

  const handleResetFuel = async (tank) => {
    try {
      await vehicleService.resetFuelToFull(id);
      setFuelData(prev => {
        if (tank === 1) {
          return { ...prev, tank1Current: prev.tank1Capacity };
        } else {
          return { ...prev, tank2Current: prev.tank2Capacity };
        }
      });
    } catch (err) {
      console.error('Error resetting fuel:', err);
      setError('Failed to reset fuel level');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleUpdateFuel = async (fuelData) => {
  try {
    // If fuelData is a number, use it as fuelLevel
    const payload = typeof fuelData === 'number' 
      ? { fuelLevel: fuelData }
      : fuelData;
      
    await vehicleService.updateFuelLevel(id, payload);
    const data = await vehicleService.getVehicleById(id);
    if (data.fuelCapacity) {
      setFuelData(prev => ({
        ...prev,
        tank1Capacity: data.fuelCapacity || 400,
        tank1Current: data.currentFuelLevel || 320,
      }));
    }
  } catch (err) {
    console.error('Error updating fuel:', err);
    setError('Failed to update fuel settings');
    setTimeout(() => setError(null), 3000);
  }
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
    try {
      await maintenanceService.deleteMaintenance(serviceId);
      setServiceRecords(serviceRecords.filter(s => s.id !== serviceId));
    } catch (err) {
      console.error('Error deleting service:', err);
      setError('Failed to delete service record');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleAddCertificate = () => {
    setEditingCertificate(null);
    setOpenCertificateDialog(true);
  };

  const handleDownloadCertificate = (certificate) => {
    console.log('Download certificate:', certificate);
  };

  const handleVerifyCertificate = (certificate) => {
    console.log('Verify certificate:', certificate);
  };

  const handleRefreshServiceRecords = () => {
    fetchServiceRecords(id);
  };

  const handleRefreshCertificates = () => {
    fetchCertificates(id);
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

  const totalFuelCapacity = fuelData.tank1Capacity + fuelData.tank2Capacity;
  const totalFuelCurrent = fuelData.tank1Current + fuelData.tank2Current;
  const fuelPercentage = totalFuelCapacity > 0 ? (totalFuelCurrent / totalFuelCapacity) * 100 : 0;

  return (
    <Box sx={{ bgcolor: '#F7F7FC', minHeight: '100vh', p: { xs: 2, md: 3 } }}>
      <Box sx={{ maxWidth: '1440px', margin: '0 auto', display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '320px 1fr' }, gap: 3 }}>
        
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
            <Typography variant="body2" sx={{ color: '#6B7280', mb: 0.5 }}>
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

            <Stack spacing={1.5} sx={{ textAlign: 'left' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#111827', fontSize: '0.8rem' }}>
                Vehicle Information
              </Typography>
              <InfoRow label="Status" value={vehicle.status || 'Unknown'} />
              <InfoRow label="Odometer" value={vehicle.currentOdometer ? `${vehicle.currentOdometer.toLocaleString()} km` : 'N/A'} />
              <InfoRow label="Fuel Type" value={vehicle.fuelType || 'N/A'} />
              <InfoRow label="Avg Consumption" value={vehicle.avgConsumption ? `${vehicle.avgConsumption} L/100km` : 'N/A'} />
              <InfoRow label="Fleet Number" value={vehicle.fleetNumber || 'N/A'} />
              <InfoRow label="VIN" value={vehicle.vin || 'N/A'} />
            </Stack>

            <Divider sx={{ my: 2.5 }} />

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

            <Stack spacing={1} sx={{ textAlign: 'left' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#111827', fontSize: '0.8rem' }}>
                Quick Stats
              </Typography>
              <InfoRow label="Status" value={vehicle.status || 'Unknown'} />
              <InfoRow label="Total Trips" value={vehicle.totalTrips || 0} />
              <InfoRow label="Services Done" value={serviceRecords.filter(s => s.status === 'COMPLETED').length} />
              <InfoRow label="Active Certificates" value={certificates.filter(c => c.status === 'ACTIVE').length} />
            </Stack>
          </Box>
        </Paper>

        <Box>
          <VehicleNavigationTabs activeTab={activeTab} setActiveTab={setActiveTab} />

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
            <SpecificationsTab vehicle={vehicle} />
          )}

          {activeTab === 2 && (
            <FuelManagementTab
              fuelData={fuelData}
              setFuelData={setFuelData}
              vehicle={vehicle}
              onResetFuel={handleResetFuel}
              onUpdateFuel={handleUpdateFuel}
            />
          )}

          {activeTab === 3 && (
            <ServiceHistoryTab
              serviceRecords={serviceRecords}
              loading={loading}
              onAdd={handleAddService}
              onEdit={handleEditService}
              onDelete={handleDeleteService}
              onRefresh={handleRefreshServiceRecords}
            />
          )}

          {activeTab === 4 && (
            <CertificatesTab
              certificates={certificates}
              loading={loading}
              onAdd={handleAddCertificate}
              onDownload={handleDownloadCertificate}
              onVerify={handleVerifyCertificate}
              onRefresh={handleRefreshCertificates}
            />
          )}

          {activeTab === 5 && (
            <TripsTab trips={trips} loading={loading} />
          )}

          {activeTab === 6 && (
            <DocumentsTab />
          )}

          {activeTab === 7 && (
            <NotesTab vehicle={vehicle} />
          )}
        </Box>
      </Box>

      <ServiceDialog
        open={openServiceDialog}
        onClose={() => setOpenServiceDialog(false)}
        service={editingService}
        onSave={async (data) => {
          try {
            const serviceData = {
              ...data,
              vehicleId: parseInt(id),
            };
            if (editingService) {
              await maintenanceService.updateMaintenance(editingService.id, serviceData);
            } else {
              await maintenanceService.addMaintenance(serviceData);
            }
            await fetchServiceRecords(id);
            setOpenServiceDialog(false);
          } catch (err) {
            console.error('Error saving service:', err);
            setError('Failed to save service record');
          }
        }}
      />

      <CertificateDialog
        open={openCertificateDialog}
        onClose={() => setOpenCertificateDialog(false)}
        certificate={editingCertificate}
        onSave={async (data) => {
          try {
            const certData = {
              ...data,
              vehicleId: parseInt(id),
            };
            if (editingCertificate) {
              await vehicleService.updateCertificate(id, editingCertificate.id, certData);
            } else {
              await vehicleService.addCertificate(id, certData);
            }
            await fetchCertificates(id);
            setOpenCertificateDialog(false);
          } catch (err) {
            console.error('Error saving certificate:', err);
            setError('Failed to save certificate');
          }
        }}
      />
    </Box>
  );
};

// ============================================================
// HELPER COMPONENTS
// ============================================================
const InfoRow = ({ label, value }) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
    <Typography variant="body2" sx={{ color: '#6B7280', fontSize: '0.75rem' }}>
      {label}
    </Typography>
    <Typography variant="body2" sx={{ color: '#111827', fontSize: '0.75rem', fontWeight: 500 }}>
      {value}
    </Typography>
  </Box>
);

export default VehicleDashboard;
