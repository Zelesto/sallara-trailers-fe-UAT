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
  DatePicker,
  LocalizationProvider,
  AdapterDateFns,
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
} from '@mui/icons-material';
import driverService from '../services/driverService';
import { LocalizationProvider as MuiLocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns as MuiAdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

// Navigation Tabs Component
const DriverNavigationTabs = ({ activeTab, setActiveTab }) => {
  const handleChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const tabs = [
    'Overview', 
    'Trips', 
    'Timesheet', 
    'Leave', 
    'Performance', 
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

// Timesheet Component - FIXED
const TimesheetTab = ({ driverId, timesheetData, loading, onAddEntry, onDeleteEntry }) => {
  const [openDialog, setOpenDialog] = useState(false);
  const [newEntry, setNewEntry] = useState({
    date: new Date(),
    startTime: '09:00',
    endTime: '17:00',
    breakDuration: 60,
    activityType: 'DRIVING',
    notes: '',
  });

  // Helper function to get week number
  const getWeekNumber = (date) => {
    const d = new Date(date);
    const startOfYear = new Date(d.getFullYear(), 0, 1);
    const days = Math.floor((d - startOfYear) / (24 * 60 * 60 * 1000));
    return Math.ceil((days + startOfYear.getDay() + 1) / 7);
  };

  const handleAddEntry = () => {
    onAddEntry(newEntry);
    setOpenDialog(false);
    setNewEntry({
      date: new Date(),
      startTime: '09:00',
      endTime: '17:00',
      breakDuration: 60,
      activityType: 'DRIVING',
      notes: '',
    });
  };

  // Calculate hours worked
  const calculateHours = (start, end) => {
    const startTime = new Date(`1970-01-01T${start}`);
    const endTime = new Date(`1970-01-01T${end}`);
    const diff = (endTime - startTime) / (1000 * 60 * 60);
    return diff.toFixed(1);
  };

  // Calculate weekly summary - FIXED
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

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
        <CircularProgress size={40} />
      </Box>
    );
  }

  return (
    <Box>
      {/* Timesheet Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Timesheet
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<DownloadIcon />}
            sx={{ fontSize: '0.75rem' }}
          >
            Export
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<PrintIcon />}
            sx={{ fontSize: '0.75rem' }}
          >
            Print
          </Button>
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => setOpenDialog(true)}
            sx={{ fontSize: '0.75rem' }}
          >
            Add Entry
          </Button>
        </Stack>
      </Box>

      {/* Weekly Summary Cards - FIXED */}
      {weeklySummary && Object.keys(weeklySummary).length > 0 && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {Object.values(weeklySummary).slice(0, 4).map((week, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: '12px',
                  border: '1px solid #ECECEC',
                  bgcolor: '#F9FAFB',
                }}
              >
                <Typography variant="caption" sx={{ color: '#6B7280', display: 'block' }}>
                  Week of {new Date(week.weekStart).toLocaleDateString()}
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 600, mt: 0.5 }}>
                  {week.totalHours}h
                </Typography>
                <Typography variant="caption" sx={{ color: '#6B7280' }}>
                  {week.entries} entries
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Timesheet Table */}
      <TableContainer component={Paper} sx={{ borderRadius: '12px', border: '1px solid #ECECEC' }}>
        <Table>
          <TableHead sx={{ bgcolor: '#F9FAFB' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Date</TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Start</TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>End</TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Break (min)</TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Hours</TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Activity</TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Notes</TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {timesheetData?.length > 0 ? (
              timesheetData.map((entry, index) => (
                <TableRow key={index} hover>
                  <TableCell sx={{ fontSize: '0.8rem' }}>
                    {new Date(entry.date).toLocaleDateString()}
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.8rem' }}>{entry.startTime}</TableCell>
                  <TableCell sx={{ fontSize: '0.8rem' }}>{entry.endTime}</TableCell>
                  <TableCell sx={{ fontSize: '0.8rem' }}>{entry.breakDuration}</TableCell>
                  <TableCell sx={{ fontSize: '0.8rem', fontWeight: 600 }}>
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
                                entry.activityType === 'REST' ? '#D1FAE5' : '#FEF3C7',
                        color: entry.activityType === 'DRIVING' ? '#1E40AF' : 
                               entry.activityType === 'REST' ? '#065F46' : '#92400E',
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

      {/* Add Entry Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Timesheet Entry</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Date"
              type="date"
              value={newEntry.date instanceof Date ? newEntry.date.toISOString().split('T')[0] : ''}
              onChange={(e) => setNewEntry({ ...newEntry, date: new Date(e.target.value) })}
              InputLabelProps={{ shrink: true }}
              fullWidth
              size="small"
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
                  size="small"
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
                  size="small"
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
            />
            <FormControl fullWidth size="small">
              <InputLabel>Activity Type</InputLabel>
              <Select
                value={newEntry.activityType}
                onChange={(e) => setNewEntry({ ...newEntry, activityType: e.target.value })}
                label="Activity Type"
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
              size="small"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleAddEntry} variant="contained" color="primary">
            Add Entry
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// Leave Management Component
const LeaveTab = ({ driverId, leaveData, loading, onRequestLeave, onCancelLeave }) => {
  const [openDialog, setOpenDialog] = useState(false);
  const [newLeave, setNewLeave] = useState({
    type: 'ANNUAL',
    startDate: new Date(),
    endDate: new Date(),
    reason: '',
    notes: '',
  });

  // Calculate leave balances
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
      startDate: new Date(),
      endDate: new Date(),
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
      {/* Leave Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Leave Management
        </Typography>
        <Button
          variant="contained"
          size="small"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
          sx={{ fontSize: '0.75rem' }}
        >
          Request Leave
        </Button>
      </Box>

      {/* Leave Balances */}
      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
        Leave Balances
      </Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {Object.entries(leaveBalances).map(([key, balance]) => (
          <Grid item xs={12} sm={6} md={3} key={key}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: '12px',
                border: '1px solid #ECECEC',
                textAlign: 'center',
                bgcolor: '#FFFFFF',
              }}
            >
              <Typography variant="caption" sx={{ color: '#6B7280', textTransform: 'uppercase', fontWeight: 600 }}>
                {key} Leave
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: 1, mt: 1 }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#4F46E5' }}>
                  {balance.remaining}
                </Typography>
                <Typography variant="caption" sx={{ color: '#6B7280' }}>
                  / {balance.total}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                <Typography variant="caption" sx={{ color: '#22C55E' }}>
                  Used: {balance.used}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={(balance.used / balance.total) * 100}
                  sx={{
                    width: 40,
                    height: 4,
                    borderRadius: 2,
                    alignSelf: 'center',
                  }}
                />
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Leave Requests Table */}
      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
        Leave Requests
      </Typography>
      <TableContainer component={Paper} sx={{ borderRadius: '12px', border: '1px solid #ECECEC' }}>
        <Table>
          <TableHead sx={{ bgcolor: '#F9FAFB' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Type</TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Start Date</TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>End Date</TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Duration</TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Reason</TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {leaveData?.length > 0 ? (
              leaveData.map((leave, index) => {
                const duration = Math.ceil(
                  (new Date(leave.endDate) - new Date(leave.startDate)) / (1000 * 60 * 60 * 24)
                ) + 1;
                return (
                  <TableRow key={index} hover>
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
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => onCancelLeave(leave.id)}
                          sx={{ p: 0.5 }}
                        >
                          <DeleteIcon sx={{ fontSize: '0.8rem' }} />
                        </IconButton>
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

      {/* Request Leave Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Request Leave</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Leave Type</InputLabel>
              <Select
                value={newLeave.type}
                onChange={(e) => setNewLeave({ ...newLeave, type: e.target.value })}
                label="Leave Type"
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
              value={newLeave.startDate instanceof Date ? newLeave.startDate.toISOString().split('T')[0] : ''}
              onChange={(e) => setNewLeave({ ...newLeave, startDate: new Date(e.target.value) })}
              InputLabelProps={{ shrink: true }}
              fullWidth
              size="small"
            />
            <TextField
              label="End Date"
              type="date"
              value={newLeave.endDate instanceof Date ? newLeave.endDate.toISOString().split('T')[0] : ''}
              onChange={(e) => setNewLeave({ ...newLeave, endDate: new Date(e.target.value) })}
              InputLabelProps={{ shrink: true }}
              fullWidth
              size="small"
            />
            <TextField
              label="Reason"
              value={newLeave.reason}
              onChange={(e) => setNewLeave({ ...newLeave, reason: e.target.value })}
              fullWidth
              size="small"
              placeholder="Reason for leave request"
            />
            <TextField
              label="Additional Notes"
              multiline
              rows={2}
              value={newLeave.notes}
              onChange={(e) => setNewLeave({ ...newLeave, notes: e.target.value })}
              fullWidth
              size="small"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleRequestLeave} variant="contained" color="primary">
            Submit Request
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// Main Driver Dashboard Component
const DriverDashboard = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [driver, setDriver] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [timesheetData, setTimesheetData] = useState([]);
  const [leaveData, setLeaveData] = useState([]);

  // Fetch driver data on component mount
  useEffect(() => {
    if (id) {
      fetchDriverData(id);
      fetchTimesheetData(id);
      fetchLeaveData(id);
    } else {
      setError('No driver ID provided');
      setLoading(false);
    }
  }, [id]);

  const fetchDriverData = async (driverId) => {
    setLoading(true);
    setError(null);
    try {
      const data = await driverService.getDriverById(driverId);
      setDriver(data);
      
      // Generate notifications based on driver data
      const newNotifications = [];
      
      // Check license expiry
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

      // Check if driver is active
      if (data.status === 'INACTIVE' || data.status === 'SUSPENDED') {
        newNotifications.push({
          id: 2,
          icon: <WarningIcon />,
          message: `Driver account is ${data.status.toLowerCase()}. Please review their status.`,
          severity: 'error',
        });
      }

      // Check if driver has completed trips
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
      setError('Failed to load driver data. Please try again.');
      setDriver(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchTimesheetData = async (driverId) => {
    // Mock data - replace with actual API call
    setTimesheetData([
      { id: 1, date: new Date().toISOString(), startTime: '08:00', endTime: '16:30', breakDuration: 30, activityType: 'DRIVING', notes: 'Regular shift' },
      { id: 2, date: new Date(Date.now() - 86400000).toISOString(), startTime: '09:00', endTime: '17:00', breakDuration: 45, activityType: 'REST', notes: 'Rest day' },
      { id: 3, date: new Date(Date.now() - 172800000).toISOString(), startTime: '07:30', endTime: '18:00', breakDuration: 60, activityType: 'DRIVING', notes: 'Long haul' },
    ]);
  };

  const fetchLeaveData = async (driverId) => {
    // Mock data - replace with actual API call
    setLeaveData([
      { id: 1, type: 'ANNUAL', startDate: new Date(Date.now() + 86400000 * 7).toISOString(), endDate: new Date(Date.now() + 86400000 * 10).toISOString(), status: 'PENDING', reason: 'Family vacation' },
      { id: 2, type: 'SICK', startDate: new Date(Date.now() - 86400000 * 30).toISOString(), endDate: new Date(Date.now() - 86400000 * 28).toISOString(), status: 'APPROVED', reason: 'Medical appointment' },
    ]);
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

  const handleViewAllTrips = () => {
    navigate(`/trips?driverId=${id}`);
  };

  const handleAddTimesheetEntry = async (entry) => {
    // Implement API call to add timesheet entry
    console.log('Add timesheet entry:', entry);
    setTimesheetData([...timesheetData, { ...entry, id: Date.now() }]);
  };

  const handleDeleteTimesheetEntry = async (entryId) => {
    // Implement API call to delete timesheet entry
    console.log('Delete timesheet entry:', entryId);
    setTimesheetData(timesheetData.filter(entry => entry.id !== entryId));
  };

  const handleRequestLeave = async (leave) => {
    // Implement API call to request leave
    console.log('Request leave:', leave);
    setLeaveData([...leaveData, { ...leave, id: Date.now(), status: 'PENDING' }]);
  };

  const handleCancelLeave = async (leaveId) => {
    // Implement API call to cancel leave
    console.log('Cancel leave:', leaveId);
    setLeaveData(leaveData.filter(leave => leave.id !== leaveId));
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

  // Calculate derived data
  const fullName = `${driver.firstName || ''} ${driver.lastName || ''}`.trim();
  const initials = `${driver.firstName?.charAt(0) || ''}${driver.lastName?.charAt(0) || ''}`.toUpperCase();
  const rating = driver.performanceScore ? (driver.performanceScore / 20).toFixed(1) : '0.0';
  const totalTrips = driver.totalTrips || 0;
  const hireDate = driver.hireDate ? new Date(driver.hireDate) : null;
  const yearsWithCompany = hireDate ? Math.floor((new Date() - hireDate) / (1000 * 60 * 60 * 24 * 365)) : 0;

  // Performance metrics
  const performanceMetrics = [
    { label: 'On-Time Rate', value: `${driver.performanceScore || 0}%`, color: '#22C55E' },
    { label: 'Avg Rating', value: `${rating} ★`, color: '#F59E0B' },
    { label: 'Safety Score', value: `${Math.min(driver.safetyScore || 0, 100)}%`, color: '#4F46E5' },
    { label: 'Efficiency', value: `${Math.min(driver.efficiencyScore || 0, 100)}%`, color: '#8B5CF6' },
  ];

  // Demo upcoming trips (replace with real data from API)
  const upcomingTrips = [
    { id: 1, route: 'City Center → Airport', date: new Date().toISOString(), status: 'SCHEDULED', vehicle: 'Toyota Camry' },
    { id: 2, route: 'Airport → Downtown', date: new Date(Date.now() + 3600000 * 3).toISOString(), status: 'CONFIRMED', vehicle: 'Honda Accord' },
    { id: 3, route: 'City Center → North Suburbs', date: new Date(Date.now() + 86400000).toISOString(), status: 'PENDING', vehicle: 'Tesla Model 3' },
  ];

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
        {/* Driver Profile Panel - Left Side */}
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
            onClick={handleBack}
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
            <Typography variant="body2" sx={{ color: '#6B7280', mb: 2 }}>
              {driver.age || 'N/A'} • {driver.gender || 'N/A'} • {driver.country || 'N/A'}
            </Typography>

            {/* Rating */}
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5, mb: 2 }}>
              {[...Array(5)].map((_, i) => (
                <StarIcon
                  key={i}
                  sx={{
                    fontSize: '1.1rem',
                    color: i < Math.floor(parseFloat(rating)) ? '#F59E0B' : '#E5E7EB',
                  }}
                />
              ))}
              <Typography variant="body2" sx={{ ml: 0.5, color: '#6B7280', fontSize: '0.8rem' }}>
                {rating}
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
                  onClick={() => {
                    if (social.name === 'Email' && driver.email) {
                      window.location.href = `mailto:${driver.email}`;
                    }
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

            {/* Contact Information */}
            <Stack spacing={1.5} sx={{ mb: 2.5, textAlign: 'left' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#111827', fontSize: '0.8rem' }}>
                Contact Information
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <PhoneIcon sx={{ fontSize: '0.9rem', color: '#6B7280' }} />
                <Typography variant="body2" sx={{ color: '#111827', fontSize: '0.8rem' }}>
                  {driver.phoneNumber || driver.phone || 'N/A'}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <EmailIcon sx={{ fontSize: '0.9rem', color: '#6B7280' }} />
                <Typography variant="body2" sx={{ color: '#111827', fontSize: '0.8rem' }}>
                  {driver.email || 'N/A'}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <CarIcon sx={{ fontSize: '0.9rem', color: '#6B7280' }} />
                <Typography variant="body2" sx={{ color: '#111827', fontSize: '0.8rem' }}>
                  Vehicle: {driver.assignedVehicleId || 'Not Assigned'}
                </Typography>
              </Box>
            </Stack>

            <Divider sx={{ mb: 2.5 }} />

            {/* Tags */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2.5 }}>
              {driver.status === 'ACTIVE' && (
                <Chip
                  label="Active Driver"
                  size="small"
                  sx={{
                    bgcolor: '#D1FAE5',
                    color: '#065F46',
                    borderRadius: '30px',
                    fontSize: '0.7rem',
                    fontWeight: 500,
                  }}
                />
              )}
              {yearsWithCompany >= 3 && (
                <Chip
                  label={`${yearsWithCompany}+ Years`}
                  size="small"
                  sx={{
                    bgcolor: '#F4F4F5',
                    borderRadius: '30px',
                    fontSize: '0.7rem',
                    fontWeight: 500,
                  }}
                />
              )}
              {totalTrips >= 100 && (
                <Chip
                  label="Top Performer"
                  size="small"
                  sx={{
                    bgcolor: '#FEF3C7',
                    color: '#92400E',
                    borderRadius: '30px',
                    fontSize: '0.7rem',
                    fontWeight: 500,
                  }}
                />
              )}
              {driver.licenseType && (
                <Chip
                  label={`License: ${driver.licenseType}`}
                  size="small"
                  sx={{
                    bgcolor: '#F4F4F5',
                    borderRadius: '30px',
                    fontSize: '0.7rem',
                    fontWeight: 500,
                  }}
                />
              )}
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
                  {driver.address || driver.location || 'N/A'}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ color: '#6B7280', fontSize: '0.75rem' }}>
                  Status
                </Typography>
                <Chip
                  label={driver.status || 'Unknown'}
                  size="small"
                  sx={{
                    bgcolor: driver?.status === 'ACTIVE' ? '#D1FAE5' : '#FEE2E2',
                    color: driver?.status === 'ACTIVE' ? '#065F46' : '#991B1B',
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
                  {driver.hireDate ? new Date(driver.hireDate).toLocaleDateString() : 'N/A'}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ color: '#6B7280', fontSize: '0.75rem' }}>
                  Total Trips
                </Typography>
                <Typography variant="body2" sx={{ color: '#111827', fontSize: '0.75rem', fontWeight: 600 }}>
                  {totalTrips}
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

          {/* Tab Content */}
          {activeTab === 0 && (
            <>
              {/* Statistics Cards - Top Row */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={4}>
                  <DriverStatCard
                    title="Total Trips"
                    value={totalTrips}
                    subtitle="Lifetime trips completed"
                    icon={RouteIcon}
                    metrics={[
                      { label: 'This Month', value: driver.monthlyTrips || 'N/A' },
                      { label: 'This Week', value: driver.weeklyTrips || 'N/A' },
                    ]}
                    color="#4F46E5"
                    loading={loading}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <DriverStatCard
                    title="Average Rating"
                    value={`${rating} ★`}
                    subtitle="Based on driver performance"
                    icon={StarIcon}
                    metrics={[
                      { label: 'Performance Score', value: `${driver.performanceScore || 0}%` },
                      { label: 'Safety Score', value: `${driver.safetyScore || 0}%` },
                    ]}
                    color="#F59E0B"
                    loading={loading}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <DriverStatCard
                    title="Earnings"
                    value={`$${driver.totalEarnings?.toLocaleString() || '0'}`}
                    subtitle="Total lifetime earnings"
                    icon={MoneyIcon}
                    metrics={[
                      { label: 'Avg/Trip', value: `$${driver.averageEarningsPerTrip?.toFixed(2) || '0.00'}` },
                      { label: 'This Month', value: `$${driver.monthlyEarnings?.toLocaleString() || '0'}` },
                    ]}
                    color="#22C55E"
                    loading={loading}
                  />
                </Grid>
              </Grid>

              {/* Middle Section - Performance & Upcoming Trips */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={6}>
                  <DriverPerformanceCard performance={performanceMetrics} loading={loading} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <UpcomingTripsCard trips={upcomingTrips} loading={loading} onViewAll={handleViewAllTrips} />
                </Grid>
              </Grid>

              {/* Bottom Section - License & Additional Info */}
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <LicenseInfoCard driver={driver} loading={loading} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <QuickActionsCard driverId={id} navigate={navigate} />
                </Grid>
              </Grid>
            </>
          )}

          {activeTab === 1 && (
            <Typography variant="body1" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
              Trips history will be displayed here
            </Typography>
          )}

          {activeTab === 2 && (
            <TimesheetTab
              driverId={id}
              timesheetData={timesheetData}
              loading={loading}
              onAddEntry={handleAddTimesheetEntry}
              onDeleteEntry={handleDeleteTimesheetEntry}
            />
          )}

          {activeTab === 3 && (
            <LeaveTab
              driverId={id}
              leaveData={leaveData}
              loading={loading}
              onRequestLeave={handleRequestLeave}
              onCancelLeave={handleCancelLeave}
            />
          )}

          {activeTab === 4 && (
            <DriverPerformanceCard performance={performanceMetrics} loading={loading} />
          )}

          {activeTab === 5 && (
            <Typography variant="body1" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
              Documents will be displayed here
            </Typography>
          )}

          {activeTab === 6 && (
            <Typography variant="body1" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
              Notes will be displayed here
            </Typography>
          )}

          {/* Footer Info */}
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
            <Typography variant="caption" sx={{ color: '#6B7280', fontSize: '0.65rem' }}>
              Last updated: {new Date().toLocaleString()}
            </Typography>
            <Typography variant="caption" sx={{ color: '#6B7280', fontSize: '0.65rem' }}>
              Driver ID: #{driver.id || 'N/A'}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

// Helper Components (moved from original)
const DriverStatCard = ({ title, value, subtitle, metrics, icon: Icon, color = '#4F46E5', loading }) => (
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
    {loading ? (
      <CircularProgress size={24} />
    ) : (
      <>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#111827', mb: 0.5 }}>
          {value || 'N/A'}
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
      </>
    )}
  </Paper>
);

const DriverPerformanceCard = ({ performance, loading }) => {
  const defaultMetrics = [
    { label: 'On-Time Rate', value: '0%', color: '#22C55E' },
    { label: 'Avg Rating', value: '0 ★', color: '#F59E0B' },
    { label: 'Safety Score', value: '0%', color: '#4F46E5' },
    { label: 'Efficiency', value: '0%', color: '#8B5CF6' },
  ];

  const metrics = performance || defaultMetrics;

  if (loading) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: '16px',
          border: '1px solid #ECECEC',
          backgroundColor: '#FFFFFF',
          height: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <CircularProgress size={30} />
      </Paper>
    );
  }

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
              value={typeof metric.value === 'string' ? parseInt(metric.value) : 0}
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

const UpcomingTripsCard = ({ trips, loading, onViewAll }) => {
  const getStatusColor = (status) => {
    const map = {
      SCHEDULED: '#3B82F6',
      CONFIRMED: '#22C55E',
      PENDING: '#F59E0B',
      COMPLETED: '#6B7280',
      CANCELLED: '#EF4444',
      IN_PROGRESS: '#8B5CF6',
    };
    return map[status?.toUpperCase()] || '#6B7280';
  };

  const getStatusLabel = (status) => {
    const map = {
      SCHEDULED: 'Scheduled',
      CONFIRMED: 'Confirmed',
      PENDING: 'Pending',
      COMPLETED: 'Completed',
      CANCELLED: 'Cancelled',
      IN_PROGRESS: 'In Progress',
    };
    return map[status?.toUpperCase()] || status || 'Unknown';
  };

  if (loading) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: '16px',
          border: '1px solid #ECECEC',
          backgroundColor: '#FFFFFF',
          height: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <CircularProgress size={30} />
      </Paper>
    );
  }

  const displayTrips = trips?.slice(0, 5) || [];

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
        <Button size="small" sx={{ fontSize: '0.7rem', color: '#4F46E5' }} onClick={onViewAll}>
          View All
        </Button>
      </Box>
      {displayTrips.length === 0 ? (
        <Typography variant="body2" sx={{ color: '#6B7280', textAlign: 'center', py: 2 }}>
          No upcoming trips
        </Typography>
      ) : (
        <Stack spacing={2}>
          {displayTrips.map((trip) => (
            <Box key={trip.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 500, color: '#111827', fontSize: '0.8rem' }}>
                  {trip.route || `Trip #${trip.id}`}
                </Typography>
                <Typography variant="caption" sx={{ color: '#6B7280', display: 'block', fontSize: '0.65rem' }}>
                  {trip.date ? new Date(trip.date).toLocaleString() : 'N/A'} • {trip.vehicle || 'No vehicle'}
                </Typography>
              </Box>
              <Chip
                label={getStatusLabel(trip.status)}
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
      )}
    </Paper>
  );
};

const LicenseInfoCard = ({ driver, loading }) => {
  if (loading) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: '16px',
          border: '1px solid #ECECEC',
          backgroundColor: '#FFFFFF',
          height: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <CircularProgress size={30} />
      </Paper>
    );
  }

  const expiryDate = driver?.licenseExpiry;
  const isExpiring = expiryDate && new Date(expiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const isExpired = expiryDate && new Date(expiryDate) < new Date();

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
            {driver?.licenseNumber || 'N/A'}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" sx={{ color: '#6B7280', fontSize: '0.8rem' }}>
            License Type
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 600, color: '#111827', fontSize: '0.8rem' }}>
            {driver?.licenseType || 'N/A'}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" sx={{ color: '#6B7280', fontSize: '0.8rem' }}>
            Expiry Date
          </Typography>
          <Chip
            label={expiryDate ? new Date(expiryDate).toLocaleDateString() : 'N/A'}
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
            label={driver?.status || 'Unknown'}
            size="small"
            sx={{
              fontSize: '0.6rem',
              height: 20,
              bgcolor: driver?.status === 'ACTIVE' ? '#D1FAE5' : '#FEE2E2',
              color: driver?.status === 'ACTIVE' ? '#065F46' : '#991B1B',
              fontWeight: 600,
            }}
          />
        </Box>
      </Stack>
    </Paper>
  );
};

const QuickActionsCard = ({ driverId, navigate }) => (
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
        { label: 'Assign Trip', icon: <RouteIcon />, color: '#4F46E5', action: () => navigate('/trips/new') },
        { label: 'View Documents', icon: <AssignmentIcon />, color: '#8B5CF6', action: () => navigate(`/drivers/${driverId}/documents`) },
        { label: 'Schedule Training', icon: <CalendarIcon />, color: '#3B82F6', action: () => navigate(`/drivers/${driverId}/training`) },
        { label: 'Performance Report', icon: <AssessmentIcon />, color: '#22C55E', action: () => navigate(`/drivers/${driverId}/performance`) },
        { label: 'Timesheet', icon: <AccessTimeIcon />, color: '#8B5CF6', action: () => navigate(`/drivers/${driverId}/timesheet`) },
        { label: 'Leave Request', icon: <BeachAccessIcon />, color: '#F59E0B', action: () => navigate(`/drivers/${driverId}/leave`) },
      ].map((action) => (
        <Grid item xs={6} key={action.label}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={action.icon}
            onClick={action.action}
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
);

// Notification Banner Component
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

export default DriverDashboard;
