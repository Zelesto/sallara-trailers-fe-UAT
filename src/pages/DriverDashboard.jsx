// src/pages/drivers/DriverDashboard.jsx
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
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Fab,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  ToggleButton,
  ToggleButtonGroup,
  useTheme,
  useMediaQuery,
  Snackbar,
  LinearProgress as MuiLinearProgress,
  Chip as MuiChip,
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
  Timer as TimerIcon,
  PlayArrow as PlayArrowIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  Coffee as CoffeeIcon,
  LunchDining as LunchDiningIcon,
  Security as SecurityIcon,
  Upload as UploadIcon,
  FileUpload as FileUploadIcon,
  CloudUpload as CloudUploadIcon,
  Fingerprint as FingerprintIcon,
  QrCode as QrCodeIcon,
} from '@mui/icons-material';
import driverService from '../services/driverService';
import timesheetService from '../services/timesheetService';
import leaveService from '../services/leaveService';
import tripService from '../services/tripService';

// ============================================================
// NAVIGATION TABS
// ============================================================
const DriverNavigationTabs = ({ activeTab, setActiveTab }) => {
  const handleChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const tabs = [
    { label: 'Overview', icon: <DashboardIcon /> },
    { label: 'Timesheet', icon: <AccessTimeIcon /> },
    { label: 'Leave', icon: <BeachAccessIcon /> },
    { label: 'Trips', icon: <RouteIcon /> },
    { label: 'Performance', icon: <AssessmentIcon /> },
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
    { value: 'CLOCK_IN', label: 'Clock In', icon: <PlayArrowIcon />, color: '#22C55E' },
    { value: 'BREAK_START', label: 'Start Break', icon: <CoffeeIcon />, color: '#F59E0B' },
    { value: 'BREAK_END', label: 'End Break', icon: <LunchDiningIcon />, color: '#3B82F6' },
    { value: 'CLOCK_OUT', label: 'Clock Out', icon: <StopIcon />, color: '#EF4444' },
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
        p: 3,
        borderRadius: '16px',
        border: '1px solid #ECECEC',
        bgcolor: '#FFFFFF',
        textAlign: 'center',
      }}
    >
      <Stack spacing={2} alignItems="center">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              width: 12,
              height: 12,
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
          <Typography variant="body2" sx={{ fontWeight: 600, color: '#111827' }}>
            {getStatusLabel()}
          </Typography>
        </Box>

        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h2" sx={{ fontWeight: 700, color: '#111827', fontFamily: 'monospace' }}>
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </Typography>
          <Typography variant="caption" sx={{ color: '#6B7280' }}>
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
              px: 2,
              py: 1,
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
              <Stack direction="row" spacing={1} alignItems="center">
                {option.icon}
                <Typography variant="body2">{option.label}</Typography>
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
            minWidth: 200,
            py: 1.5,
            borderRadius: '12px',
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '1rem',
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
          <Typography variant="caption" sx={{ color: '#6B7280', display: 'block', mb: 1 }}>
            Today's Activity
          </Typography>
          <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap">
            <Chip
              icon={<PlayArrowIcon />}
              label="Clock In"
              size="small"
              sx={{ bgcolor: '#D1FAE5', color: '#065F46' }}
            />
            <Chip
              icon={<CoffeeIcon />}
              label="Break Start"
              size="small"
              sx={{ bgcolor: '#FEF3C7', color: '#92400E' }}
            />
            <Chip
              icon={<LunchDiningIcon />}
              label="Break End"
              size="small"
              sx={{ bgcolor: '#DBEAFE', color: '#1E40AF' }}
            />
            <Chip
              icon={<StopIcon />}
              label="Clock Out"
              size="small"
              sx={{ bgcolor: '#FEE2E2', color: '#991B1B' }}
            />
          </Stack>
        </Box>
      </Stack>
    </Paper>
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
          No trips found for this driver
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
            <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', color: '#6B7280' }}>Status</TableCell>
            <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', color: '#6B7280' }}>Vehicle</TableCell>
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
                {trip.vehicle?.registrationNumber || trip.vehicleRegistration || 'N/A'}
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
// LEAVE TAB WITH APPROVE/REJECT
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

  const leaveBalances = {
    annual: { total: 21, used: 8, remaining: 13 },
    sick: { total: 10, used: 2, remaining: 8 },
    study: { total: 5, used: 0, remaining: 5 },
    unpaid: { total: 0, used: 0, remaining: 0 },
  };

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
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Leave Management
        </Typography>
        <Button
          variant="contained"
          size="small"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
          sx={{
            fontSize: '0.75rem',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)',
          }}
        >
          Request Leave
        </Button>
      </Box>

      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
        Leave Balances
      </Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {Object.entries(leaveBalances).map(([key, balance]) => (
          <Grid item xs={6} sm={3} key={key}>
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
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
              <Typography variant="caption" sx={{ color: '#6B7280', textTransform: 'uppercase', fontWeight: 600, fontSize: '0.6rem' }}>
                {key} Leave
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: 0.5, mt: 1 }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#4F46E5' }}>
                  {balance.remaining}
                </Typography>
                <Typography variant="caption" sx={{ color: '#6B7280' }}>
                  / {balance.total}
                </Typography>
              </Box>
              <Box sx={{ mt: 1 }}>
                <LinearProgress
                  variant="determinate"
                  value={(balance.used / balance.total) * 100}
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
                <Typography variant="caption" sx={{ color: '#6B7280', display: 'block', mt: 0.5, fontSize: '0.6rem' }}>
                  Used: {balance.used} / Remaining: {balance.remaining}
                </Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
        Leave Requests
      </Typography>
      <TableContainer component={Paper} sx={{ borderRadius: '12px', border: '1px solid #ECECEC', overflow: 'auto' }}>
        <Table>
          <TableHead sx={{ bgcolor: '#F9FAFB' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', color: '#6B7280' }}>Type</TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', color: '#6B7280' }}>Start Date</TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', color: '#6B7280' }}>End Date</TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', color: '#6B7280' }}>Duration</TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', color: '#6B7280' }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', color: '#6B7280' }}>Reason</TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', color: '#6B7280' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {leaveData?.length > 0 ? (
              leaveData.map((leave) => {
                const duration = Math.ceil(
                  (new Date(leave.endDate) - new Date(leave.startDate)) / (1000 * 60 * 60 * 24)
                ) + 1;
                return (
                  <TableRow key={leave.id} hover>
                    <TableCell>
                      <Chip
                        label={leave.type}
                        size="small"
                        sx={{
                          fontSize: '0.6rem',
                          height: 20,
                          bgcolor: leave.type === 'ANNUAL' ? '#DBEAFE' :
                                  leave.type === 'SICK' ? '#D1FAE5' :
                                  leave.type === 'STUDY' ? '#FEF3C7' : '#F3F4F6',
                          color: leave.type === 'ANNUAL' ? '#1E40AF' :
                                 leave.type === 'SICK' ? '#065F46' :
                                 leave.type === 'STUDY' ? '#92400E' : '#6B7280',
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.8rem' }}>
                      {new Date(leave.startDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.8rem' }}>
                      {new Date(leave.endDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.8rem', fontWeight: 600 }}>
                      {duration} days
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={leave.status}
                        size="small"
                        sx={{
                          fontSize: '0.6rem',
                          height: 20,
                          bgcolor: leave.status === 'APPROVED' ? '#D1FAE5' :
                                  leave.status === 'PENDING' ? '#FEF3C7' :
                                  leave.status === 'REJECTED' ? '#FEE2E2' : '#F3F4F6',
                          color: leave.status === 'APPROVED' ? '#065F46' :
                                 leave.status === 'PENDING' ? '#92400E' :
                                 leave.status === 'REJECTED' ? '#991B1B' : '#6B7280',
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.75rem', color: '#6B7280' }}>
                      {leave.reason || '-'}
                    </TableCell>
                    <TableCell>
                      {leave.status === 'PENDING' && (
                        <Stack direction="row" spacing={0.5}>
                          <Tooltip title="Approve" arrow>
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => onOpenApproveDialog(leave, 'APPROVE')}
                              sx={{ p: 0.5 }}
                            >
                              <CheckCircleIcon sx={{ fontSize: '0.9rem' }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Reject" arrow>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => onOpenApproveDialog(leave, 'REJECT')}
                              sx={{ p: 0.5 }}
                            >
                              <CancelIcon sx={{ fontSize: '0.9rem' }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Cancel Request" arrow>
                            <IconButton
                              size="small"
                              color="warning"
                              onClick={() => onCancelLeave(leave.id)}
                              sx={{ p: 0.5 }}
                            >
                              <DeleteIcon sx={{ fontSize: '0.8rem' }} />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      )}
                      {leave.status !== 'PENDING' && (
                        <Chip
                          label={leave.status}
                          size="small"
                          sx={{
                            fontSize: '0.6rem',
                            height: 20,
                            bgcolor: leave.status === 'APPROVED' ? '#D1FAE5' : 
                                     leave.status === 'REJECTED' ? '#FEE2E2' : '#F3F4F6',
                            color: leave.status === 'APPROVED' ? '#065F46' : 
                                   leave.status === 'REJECTED' ? '#991B1B' : '#6B7280',
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
                  <Typography variant="body2" color="text.secondary">
                    No leave requests found
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600, color: '#111827' }}>Request Leave</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <FormControl fullWidth size="medium">
              <InputLabel sx={{ fontSize: '0.8rem' }}>Leave Type</InputLabel>
              <Select
                value={newLeave.type}
                onChange={(e) => setNewLeave({ ...newLeave, type: e.target.value })}
                label="Leave Type"
                sx={{ fontSize: '0.85rem' }}
              >
                <MenuItem value="ANNUAL">Annual Leave</MenuItem>
                <MenuItem value="SICK">Sick Leave</MenuItem>
                <MenuItem value="STUDY">Study Leave</MenuItem>
                <MenuItem value="UNPAID">Unpaid Leave</MenuItem>
                <MenuItem value="OTHER">Other</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Start Date"
              type="date"
              value={newLeave.startDate}
              onChange={(e) => setNewLeave({ ...newLeave, startDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
              fullWidth
              size="medium"
              sx={{ '& .MuiInputLabel-root': { fontSize: '0.8rem' } }}
            />
            <TextField
              label="End Date"
              type="date"
              value={newLeave.endDate}
              onChange={(e) => setNewLeave({ ...newLeave, endDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
              fullWidth
              size="medium"
              sx={{ '& .MuiInputLabel-root': { fontSize: '0.8rem' } }}
            />
            <TextField
              label="Reason"
              value={newLeave.reason}
              onChange={(e) => setNewLeave({ ...newLeave, reason: e.target.value })}
              fullWidth
              size="medium"
              placeholder="Reason for leave request"
              sx={{ '& .MuiInputLabel-root': { fontSize: '0.8rem' } }}
            />
            <TextField
              label="Additional Notes"
              multiline
              rows={2}
              value={newLeave.notes}
              onChange={(e) => setNewLeave({ ...newLeave, notes: e.target.value })}
              fullWidth
              size="medium"
              sx={{ '& .MuiInputLabel-root': { fontSize: '0.8rem' } }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setOpenDialog(false)} sx={{ color: '#6B7280' }}>Cancel</Button>
          <Button 
            onClick={handleRequestLeave} 
            variant="contained"
            sx={{
              background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)',
              textTransform: 'none',
              borderRadius: '10px',
              px: 3,
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
    const startTime = new Date(`1970-01-01T${start}`);
    const endTime = new Date(`1970-01-01T${end}`);
    const diff = (endTime - startTime) / (1000 * 60 * 60);
    return diff.toFixed(1);
  };

  const getWeekNumber = (date) => {
    const d = new Date(date);
    const startOfYear = new Date(d.getFullYear(), 0, 1);
    const days = Math.floor((d - startOfYear) / (24 * 60 * 60 * 1000));
    return Math.ceil((days + startOfYear.getDay() + 1) / 7);
  };

  const weeklySummary = timesheetData?.reduce((acc, entry) => {
    const weekNumber = getWeekNumber(entry.date);
    if (!acc[weekNumber]) {
      acc[weekNumber] = { 
        totalHours: 0, 
        entries: 0, 
        weekStart: entry.date 
      };
    }
    acc[weekNumber].totalHours += parseFloat(calculateHours(entry.startTime, entry.endTime));
    acc[weekNumber].entries += 1;
    return acc;
  }, {});

  const monthlySummary = timesheetData?.reduce((acc, entry) => {
    const month = new Date(entry.date).getMonth();
    const year = new Date(entry.date).getFullYear();
    const key = `${year}-${month}`;
    if (!acc[key]) {
      acc[key] = { 
        totalHours: 0, 
        entries: 0, 
        month: new Date(entry.date).toLocaleDateString([], { month: 'long', year: 'numeric' })
      };
    }
    acc[key].totalHours += parseFloat(calculateHours(entry.startTime, entry.endTime));
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
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Timesheet Entries
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Button
            variant="outlined"
            size="small"
            startIcon={<UploadIcon />}
            onClick={() => setOpenImportDialog(true)}
            sx={{ fontSize: '0.75rem', borderRadius: '8px' }}
          >
            Import
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<DownloadIcon />}
            onClick={handleExport}
            sx={{ fontSize: '0.75rem', borderRadius: '8px' }}
          >
            Export
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<PrintIcon />}
            sx={{ fontSize: '0.75rem', borderRadius: '8px' }}
          >
            Print
          </Button>
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => setOpenDialog(true)}
            sx={{ 
              fontSize: '0.75rem', 
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)',
            }}
          >
            Add Entry
          </Button>
        </Stack>
      </Box>

      {weeklySummary && Object.keys(weeklySummary).length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
            Weekly Summary
          </Typography>
          <Grid container spacing={2}>
            {Object.values(weeklySummary).slice(0, 4).map((week, index) => (
              <Grid item xs={6} sm={3} key={index}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: '12px',
                    border: '1px solid #ECECEC',
                    bgcolor: '#F9FAFB',
                    textAlign: 'center',
                  }}
                >
                  <Typography variant="caption" sx={{ color: '#6B7280', display: 'block' }}>
                    Week {index + 1}
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#4F46E5', mt: 0.5 }}>
                    {week.totalHours}h
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#6B7280' }}>
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
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
            Monthly Summary
          </Typography>
          <Grid container spacing={2}>
            {Object.values(monthlySummary).slice(0, 3).map((month, index) => (
              <Grid item xs={4} sm={3} key={index}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: '12px',
                    border: '1px solid #ECECEC',
                    bgcolor: '#F9FAFB',
                    textAlign: 'center',
                  }}
                >
                  <Typography variant="caption" sx={{ color: '#6B7280', display: 'block' }}>
                    {month.month}
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#8B5CF6', mt: 0.5 }}>
                    {month.totalHours}h
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#6B7280' }}>
                    {month.entries} entries
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      <TableContainer component={Paper} sx={{ borderRadius: '12px', border: '1px solid #ECECEC', overflow: 'auto' }}>
        <Table>
          <TableHead sx={{ bgcolor: '#F9FAFB' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', color: '#6B7280' }}>Date</TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', color: '#6B7280' }}>Start</TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', color: '#6B7280' }}>End</TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', color: '#6B7280' }}>Break (min)</TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', color: '#6B7280' }}>Hours</TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', color: '#6B7280' }}>Activity</TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', color: '#6B7280' }}>Notes</TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', color: '#6B7280' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {timesheetData?.length > 0 ? (
              timesheetData.map((entry, index) => (
                <TableRow key={entry.id || index} hover>
                  <TableCell sx={{ fontSize: '0.8rem' }}>
                    {new Date(entry.date).toLocaleDateString()}
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.8rem' }}>{entry.startTime}</TableCell>
                  <TableCell sx={{ fontSize: '0.8rem' }}>{entry.endTime}</TableCell>
                  <TableCell sx={{ fontSize: '0.8rem' }}>{entry.breakDuration}</TableCell>
                  <TableCell sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#4F46E5' }}>
                    {calculateHours(entry.startTime, entry.endTime)}h
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={entry.activityType}
                      size="small"
                      sx={{
                        fontSize: '0.6rem',
                        height: 20,
                        bgcolor: entry.activityType === 'DRIVING' ? '#DBEAFE' : 
                                entry.activityType === 'REST' ? '#D1FAE5' : 
                                entry.activityType === 'LOADING' ? '#FEF3C7' : '#EDE9FE',
                        color: entry.activityType === 'DRIVING' ? '#1E40AF' : 
                               entry.activityType === 'REST' ? '#065F46' : 
                               entry.activityType === 'LOADING' ? '#92400E' : '#5B21B6',
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', color: '#6B7280' }}>
                    {entry.notes || '-'}
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => onDeleteEntry(entry.id)}
                      sx={{ p: 0.5 }}
                    >
                      <DeleteIcon sx={{ fontSize: '0.8rem' }} />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    No timesheet entries found
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600, color: '#111827' }}>Add Timesheet Entry</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField
              label="Date"
              type="date"
              value={newEntry.date}
              onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })}
              InputLabelProps={{ shrink: true }}
              fullWidth
              size="medium"
              sx={{ '& .MuiInputLabel-root': { fontSize: '0.8rem' } }}
            />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="Start Time"
                  type="time"
                  value={newEntry.startTime}
                  onChange={(e) => setNewEntry({ ...newEntry, startTime: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  size="medium"
                  sx={{ '& .MuiInputLabel-root': { fontSize: '0.8rem' } }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="End Time"
                  type="time"
                  value={newEntry.endTime}
                  onChange={(e) => setNewEntry({ ...newEntry, endTime: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  size="medium"
                  sx={{ '& .MuiInputLabel-root': { fontSize: '0.8rem' } }}
                />
              </Grid>
            </Grid>
            <TextField
              label="Break Duration (minutes)"
              type="number"
              value={newEntry.breakDuration}
              onChange={(e) => setNewEntry({ ...newEntry, breakDuration: parseInt(e.target.value) })}
              fullWidth
              size="medium"
              sx={{ '& .MuiInputLabel-root': { fontSize: '0.8rem' } }}
              InputProps={{
                endAdornment: <InputAdornment position="end">min</InputAdornment>,
              }}
            />
            <FormControl fullWidth size="medium">
              <InputLabel sx={{ fontSize: '0.8rem' }}>Activity Type</InputLabel>
              <Select
                value={newEntry.activityType}
                onChange={(e) => setNewEntry({ ...newEntry, activityType: e.target.value })}
                label="Activity Type"
                sx={{ fontSize: '0.85rem' }}
              >
                <MenuItem value="DRIVING">Driving</MenuItem>
                <MenuItem value="REST">Rest</MenuItem>
                <MenuItem value="LOADING">Loading</MenuItem>
                <MenuItem value="UNLOADING">Unloading</MenuItem>
                <MenuItem value="MAINTENANCE">Maintenance</MenuItem>
                <MenuItem value="TRAINING">Training</MenuItem>
                <MenuItem value="OTHER">Other</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Notes"
              multiline
              rows={2}
              value={newEntry.notes}
              onChange={(e) => setNewEntry({ ...newEntry, notes: e.target.value })}
              fullWidth
              size="medium"
              sx={{ '& .MuiInputLabel-root': { fontSize: '0.8rem' } }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setOpenDialog(false)} sx={{ color: '#6B7280' }}>Cancel</Button>
          <Button 
            onClick={handleAddEntry} 
            variant="contained"
            sx={{
              background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)',
              textTransform: 'none',
              borderRadius: '10px',
              px: 3,
            }}
          >
            Add Entry
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openImportDialog} onClose={() => setOpenImportDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600, color: '#111827' }}>Import Timesheet</DialogTitle>
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
                <Typography variant="body1" sx={{ fontWeight: 600, color: '#111827' }}>
                  {selectedFile ? selectedFile.name : 'Upload timesheet file'}
                </Typography>
                <Typography variant="caption" sx={{ color: '#6B7280', display: 'block' }}>
                  Supported formats: CSV, Excel (.xlsx, .xls)
                </Typography>
                <Typography variant="caption" sx={{ color: '#6B7280', display: 'block' }}>
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
                <Typography variant="caption" sx={{ color: '#6B7280', display: 'block', mb: 1 }}>
                  Importing... {importProgress}%
                </Typography>
                <LinearProgress variant="determinate" value={importProgress} sx={{ height: 8, borderRadius: 4 }} />
              </Box>
            )}

            <Alert severity="info" sx={{ borderRadius: '8px' }}>
              <Typography variant="caption" sx={{ display: 'block' }}>
                <strong>Format Requirements:</strong>
              </Typography>
              <Typography variant="caption" sx={{ display: 'block', fontSize: '0.65rem' }}>
                • Columns: Date, Start Time, End Time, Break Duration, Activity Type, Notes
              </Typography>
              <Typography variant="caption" sx={{ display: 'block', fontSize: '0.65rem' }}>
                • Date format: YYYY-MM-DD
              </Typography>
              <Typography variant="caption" sx={{ display: 'block', fontSize: '0.65rem' }}>
                • Time format: HH:mm (24-hour)
              </Typography>
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setOpenImportDialog(false)} sx={{ color: '#6B7280' }}>Cancel</Button>
          <Button 
            onClick={handleImport} 
            variant="contained"
            disabled={!selectedFile || importing}
            sx={{
              background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)',
              textTransform: 'none',
              borderRadius: '10px',
              px: 3,
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
// PERFORMANCE TAB
// ============================================================
const PerformanceTab = ({ driver, performance, loading }) => {
  const defaultMetrics = [
    { label: 'On-Time Rate', value: '94%', color: '#22C55E', icon: <TimerIcon /> },
    { label: 'Avg Rating', value: '4.8 ★', color: '#F59E0B', icon: <StarIcon /> },
    { label: 'Safety Score', value: '96%', color: '#4F46E5', icon: <SecurityIcon /> },
    { label: 'Efficiency', value: '88%', color: '#8B5CF6', icon: <TrendingUpIcon /> },
  ];

  const metrics = performance || defaultMetrics;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
        <CircularProgress size={40} />
      </Box>
    );
  }

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: '16px',
            border: '1px solid #ECECEC',
            bgcolor: '#FFFFFF',
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
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
                <Typography variant="h3" component="div" sx={{ fontWeight: 700, color: '#111827' }}>
                  {driver?.performanceScore || 0}%
                </Typography>
              </Box>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={{ color: '#6B7280', mb: 1 }}>
                Overall performance rating based on multiple metrics
              </Typography>
              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircleIcon sx={{ color: '#22C55E', fontSize: '1rem' }} />
                    <Typography variant="caption" sx={{ color: '#111827' }}>
                      {driver?.totalTrips || 0} Trips Completed
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <StarIcon sx={{ color: '#F59E0B', fontSize: '1rem' }} />
                    <Typography variant="caption" sx={{ color: '#111827' }}>
                      {driver?.performanceScore ? (driver.performanceScore / 20).toFixed(1) : '0'} ★ Rating
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Stack>
        </Paper>
      </Grid>

      {metrics.map((metric, index) => (
        <Grid item xs={12} sm={6} key={index}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: '12px',
              border: '1px solid #ECECEC',
              bgcolor: '#FFFFFF',
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Box sx={{ color: metric.color }}>{metric.icon}</Box>
                <Typography variant="body2" sx={{ fontWeight: 500, color: '#111827' }}>
                  {metric.label}
                </Typography>
              </Stack>
              <Typography variant="body2" sx={{ fontWeight: 700, color: metric.color }}>
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
// OVERVIEW TAB
// ============================================================
const OverviewTab = ({ driver, leaveData, timesheetData, loading }) => {
  const fullName = `${driver?.firstName || ''} ${driver?.lastName || ''}`.trim();
  const rating = driver?.performanceScore ? (driver.performanceScore / 20).toFixed(1) : '0.0';
  const totalTrips = driver?.totalTrips || 0;
  const hireDate = driver?.hireDate ? new Date(driver.hireDate) : null;
  const yearsWithCompany = hireDate ? Math.floor((new Date() - hireDate) / (1000 * 60 * 60 * 24 * 365)) : 0;

  const thisWeekHours = timesheetData?.reduce((acc, entry) => {
    const entryDate = new Date(entry.date);
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    if (entryDate >= startOfWeek && entryDate <= today) {
      const start = new Date(`1970-01-01T${entry.startTime}`);
      const end = new Date(`1970-01-01T${entry.endTime}`);
      acc += (end - start) / (1000 * 60 * 60);
    }
    return acc;
  }, 0);

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Total Trips"
          value={totalTrips}
          subtitle={`${driver?.monthlyTrips || 0} this month`}
          icon={<RouteIcon />}
          color="#4F46E5"
          loading={loading}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Rating"
          value={`${rating} ★`}
          subtitle={`${driver?.performanceScore || 0}% performance`}
          icon={<StarIcon />}
          color="#F59E0B"
          loading={loading}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="This Week"
          value={`${thisWeekHours.toFixed(1)}h`}
          subtitle={`${timesheetData?.filter(e => {
            const d = new Date(e.date);
            const today = new Date();
            const startOfWeek = new Date(today);
            startOfWeek.setDate(today.getDate() - today.getDay());
            return d >= startOfWeek && d <= today;
          }).length || 0} entries`}
          icon={<AccessTimeIcon />}
          color="#8B5CF6"
          loading={loading}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Leave Balance"
          value="13 days"
          subtitle={`${leaveData?.filter(l => l.status === 'PENDING').length || 0} pending requests`}
          icon={<BeachAccessIcon />}
          color="#22C55E"
          loading={loading}
        />
      </Grid>

      <Grid item xs={12}>
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: '16px',
            border: '1px solid #ECECEC',
            bgcolor: '#FFFFFF',
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Driver Information
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <InfoRow label="Full Name" value={fullName || 'N/A'} />
              <InfoRow label="License Number" value={driver?.licenseNumber || 'N/A'} />
              <InfoRow label="License Type" value={driver?.licenseType || 'N/A'} />
              <InfoRow label="License Expiry" value={driver?.licenseExpiry ? new Date(driver.licenseExpiry).toLocaleDateString() : 'N/A'} />
            </Grid>
            <Grid item xs={12} md={6}>
              <InfoRow label="Phone" value={driver?.phoneNumber || 'N/A'} />
              <InfoRow label="Email" value={driver?.email || 'N/A'} />
              <InfoRow label="Hire Date" value={driver?.hireDate ? new Date(driver.hireDate).toLocaleDateString() : 'N/A'} />
              <InfoRow label="Years with Company" value={`${yearsWithCompany} years`} />
            </Grid>
          </Grid>
        </Paper>
      </Grid>
    </Grid>
  );
};

// ============================================================
// STAT CARD
// ============================================================
const StatCard = ({ title, value, subtitle, icon, color = '#4F46E5', loading }) => (
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
        {icon}
      </Box>
    </Stack>
  </Paper>
);

// ============================================================
// INFO ROW
// ============================================================
const InfoRow = ({ label, value }) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5, borderBottom: '1px solid #F3F4F6' }}>
    <Typography variant="body2" sx={{ color: '#6B7280', fontSize: '0.8rem' }}>
      {label}
    </Typography>
    <Typography variant="body2" sx={{ color: '#111827', fontSize: '0.8rem', fontWeight: 500 }}>
      {value}
    </Typography>
  </Box>
);

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
const DocumentsTab = () => (
  <Box sx={{ py: 4, textAlign: 'center' }}>
    <DescriptionIcon sx={{ fontSize: 48, color: '#D1D5DB', mb: 2 }} />
    <Typography variant="body1" color="text.secondary">
      Driver documents will be displayed here
    </Typography>
  </Box>
);

const NotesTab = ({ driver }) => (
  <Box sx={{ py: 4, textAlign: 'center' }}>
    <InfoIcon sx={{ fontSize: 48, color: '#D1D5DB', mb: 2 }} />
    <Typography variant="body1" color="text.secondary">
      Driver notes will be displayed here
    </Typography>
    {driver?.notes && (
      <Paper sx={{ mt: 2, p: 3, textAlign: 'left', borderRadius: '12px', border: '1px solid #ECECEC' }}>
        <Typography variant="body2" sx={{ color: '#111827' }}>
          {driver.notes}
        </Typography>
      </Paper>
    )}
  </Box>
);

// ============================================================
// MAIN DRIVER DASHBOARD
// ============================================================
const DriverDashboard = () => {
  const { id } = useParams();
  const navigate = useNavigate();
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
      setDriver(data);
      
      const newNotifications = [];
      
      if (data.licenseExpiry) {
        const expiryDate = new Date(data.licenseExpiry);
        const daysUntilExpiry = Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24));
        if (daysUntilExpiry < 0) {
          newNotifications.push({
            id: 1,
            icon: <WarningIcon />,
            message: `Driver license has expired. Please renew immediately.`,
            severity: 'error',
          });
        } else if (daysUntilExpiry < 30) {
          newNotifications.push({
            id: 1,
            icon: <WarningIcon />,
            message: `Driver license expires in ${daysUntilExpiry} days. Please remind them to renew.`,
            severity: 'warning',
          });
        }
      }

      if (data.status === 'INACTIVE' || data.status === 'SUSPENDED') {
        newNotifications.push({
          id: 2,
          icon: <WarningIcon />,
          message: `Driver account is ${data.status.toLowerCase()}. Please review their status.`,
          severity: 'error',
        });
      }

      if (data.totalTrips && data.totalTrips > 100) {
        newNotifications.push({
          id: 3,
          icon: <CheckCircleIcon />,
          message: `Driver completed ${data.totalTrips} trips! Great performance milestone.`,
          severity: 'success',
        });
      }

      setNotifications(newNotifications);
    } catch (err) {
      console.error('Error fetching driver data:', err);
      setError('Failed to load driver data');
    } finally {
      setLoading(false);
    }
  };

  const fetchTimesheetData = async (driverId) => {
    try {
      const id = parseInt(driverId, 10);
      if (isNaN(id)) {
        console.error('Invalid driver ID for timesheet fetch');
        setTimesheetData([]);
        return;
      }
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      const endDate = new Date();
      
      console.log(`📤 Fetching timesheet for driver ${id} from ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);
      
      const entries = await timesheetService.getEntries(
        id,
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      );
      setTimesheetData(entries || []);
      
      const activeEntry = await timesheetService.getActivePunch(id);
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
      const id = parseInt(driverId, 10);
      if (isNaN(id)) {
        console.error('Invalid driver ID for leave fetch');
        setLeaveData([]);
        return;
      }
      
      const requests = await leaveService.getLeaveRequests(id);
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
      
      const tripsData = await tripService.getTripsByDriver(id);
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
      
      console.log('📤 Sending punch data:', punchData);
      const result = await timesheetService.punch(punchData);
      console.log('✅ Punch result:', result);
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
      const newEntry = {
        driverId: parseInt(id),
        entryDate: entry.date,
        startTime: entry.startTime,
        endTime: entry.endTime,
        breakDuration: parseInt(entry.breakDuration),
        activityType: entry.activityType,
        notes: entry.notes,
      };
      
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
      entry.date,
      entry.startTime,
      entry.endTime || '',
      entry.breakDuration,
      entry.activityType,
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
      
      console.log('📤 Sending leave request:', leaveRequest);
      const result = await leaveService.requestLeave(leaveRequest);
      console.log('✅ Leave request result:', result);
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
      const approverId = 1; // TODO: Get from current user context
      const result = await leaveService.approveLeave(leaveId, approverId);
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
      const result = await leaveService.rejectLeave(leaveId, reason || 'No reason provided');
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
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress size={40} />
        <Typography sx={{ ml: 2, fontSize: '0.9rem' }}>Loading driver data...</Typography>
      </Box>
    );
  }

  if (error || !driver) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error" sx={{ fontSize: '0.8rem' }}>{error || 'Driver not found'}</Alert>
        <Button
          variant="contained"
          size="small"
          onClick={handleBack}
          sx={{ mt: 2, fontSize: '0.8rem' }}
        >
          Back to Drivers
        </Button>
      </Box>
    );
  }

  const fullName = `${driver.firstName || ''} ${driver.lastName || ''}`.trim();
  const initials = `${driver.firstName?.charAt(0) || ''}${driver.lastName?.charAt(0) || ''}`.toUpperCase();
  const rating = driver.performanceScore ? (driver.performanceScore / 20).toFixed(1) : '0.0';

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
            Back to Drivers
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
                {initials || 'D'}
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
                  bgcolor: driver?.status === 'ACTIVE' ? '#22C55E' : '#EF4444',
                  borderRadius: '50%',
                  width: 14,
                  height: 14,
                  border: '2px solid white',
                }}
              />
            </Box>

            <Typography variant="h5" sx={{ fontWeight: 700, color: '#111827' }}>
              {fullName || 'Unknown Driver'}
            </Typography>
            <Typography variant="body2" sx={{ color: '#6B7280', mb: 0.5 }}>
              {driver.licenseNumber || 'No license'} • {driver.licenseType || 'N/A'}
            </Typography>
            <Typography variant="body2" sx={{ color: '#6B7280', mb: 2 }}>
              {driver.status || 'Unknown'} • {driver.employmentType || 'N/A'}
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
              Edit Profile
            </Button>

            <Divider sx={{ mb: 2.5 }} />

            <Stack spacing={1.5} sx={{ textAlign: 'left' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#111827', fontSize: '0.8rem' }}>
                Contact Information
              </Typography>
              <InfoRow label="Phone" value={driver.phoneNumber || 'N/A'} />
              <InfoRow label="Email" value={driver.email || 'N/A'} />
              <InfoRow label="Assigned Vehicle" value={driver.assignedVehicleId || 'Not Assigned'} />
            </Stack>

            <Divider sx={{ my: 2.5 }} />

            <Stack spacing={1.5} sx={{ textAlign: 'left' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#111827', fontSize: '0.8rem' }}>
                Quick Stats
              </Typography>
              <InfoRow label="Total Trips" value={driver.totalTrips || 0} />
              <InfoRow label="Performance Score" value={`${driver.performanceScore || 0}%`} />
              <InfoRow label="Hire Date" value={driver.hireDate ? new Date(driver.hireDate).toLocaleDateString() : 'N/A'} />
              <InfoRow label="License Expiry" value={driver.licenseExpiry ? new Date(driver.licenseExpiry).toLocaleDateString() : 'N/A'} />
            </Stack>
          </Box>
        </Paper>

        <Box>
          <DriverNavigationTabs activeTab={activeTab} setActiveTab={setActiveTab} />

          {error && (
            <Alert severity="error" sx={{ mb: 2, fontSize: '0.8rem' }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          {successMessage && (
            <Alert severity="success" sx={{ mb: 2, fontSize: '0.8rem' }} onClose={() => setSuccessMessage('')}>
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
            <PerformanceTab driver={driver} loading={loading} />
          )}

          {activeTab === 5 && (
            <DocumentsTab />
          )}

          {activeTab === 6 && (
            <NotesTab driver={driver} />
          )}
        </Box>
      </Box>

      {/* Approve/Reject Leave Dialog */}
      <Dialog open={openApproveDialog} onClose={() => setOpenApproveDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600, color: '#111827' }}>
          {approveAction === 'APPROVE' ? 'Approve Leave Request' : 'Reject Leave Request'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            {selectedLeave && (
              <>
                <Box>
                  <Typography variant="caption" color="text.secondary">Leave Type</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>{selectedLeave.type}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Duration</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {new Date(selectedLeave.startDate).toLocaleDateString()} - {new Date(selectedLeave.endDate).toLocaleDateString()}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Reason</Typography>
                  <Typography variant="body2">{selectedLeave.reason || 'No reason provided'}</Typography>
                </Box>
                {approveAction === 'REJECT' && (
                  <TextField
                    label="Rejection Reason"
                    multiline
                    rows={2}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    fullWidth
                    size="medium"
                    placeholder="Reason for rejecting the leave request"
                    sx={{ '& .MuiInputLabel-root': { fontSize: '0.8rem' } }}
                  />
                )}
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setOpenApproveDialog(false)} sx={{ color: '#6B7280' }}>Cancel</Button>
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
              background: approveAction === 'APPROVE' 
                ? 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)'
                : 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
              textTransform: 'none',
              borderRadius: '10px',
              px: 3,
            }}
          >
            {approveAction === 'APPROVE' ? 'Approve' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DriverDashboard;
