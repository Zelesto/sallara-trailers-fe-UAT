// src/pages/TripDetails.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Box, Grid, Card, CardContent, CardHeader,
  Typography, Divider, Chip, Button,
  Select, MenuItem, FormControl, InputLabel,
  TextField, CircularProgress, Alert,
  Tab, Tabs, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  IconButton, Tooltip, Stack, LinearProgress,
  Avatar,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Save as SaveIcon,
  Close as CloseIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon,
  DirectionsCar as CarIcon,
  LocalGasStation as FuelIcon,
  AttachMoney as MoneyIcon,
  Timeline as TimelineIcon,
  Receipt as ReceiptIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Business as BusinessIcon,
  Warning as WarningIcon,
  ReportProblem as IncidentIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  MoreVert as MoreVertIcon,
  Info as InfoIcon,
  Route as RouteIcon,
  Schedule as ScheduleIcon,
  Speed as SpeedIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';

import {
  TRIP_STATUSES,
  TRIP_STATUS_OPTIONS,
  TRIP_TYPES,
  TRIP_PRIORITIES,
  getDisplayName,
  getColor,
} from '../constants';

import { tripService } from '../services/tripService';
import IncidentDialog from './IncidentDialog';
import { STATUS_CONFIG, STATUS_OPTIONS } from '../constants/tripConstants';

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

const formatDateTime = (date) => {
  if (!date) return '-';
  return dayjs(date).format('DD MMM YYYY, HH:mm');
};

const formatDate = (date) => {
  if (!date) return '-';
  return dayjs(date).format('DD MMM YYYY');
};

const formatTime = (date) => {
  if (!date) return '-';
  return dayjs(date).format('HH:mm');
};

// ============================================================
// COMPONENT: StatusChip (matching TripList)
// ============================================================

const StatusChip = ({ status }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.DRAFT;
  
  return (
    <Chip
      label={config.label}
      size="small"
      sx={{
        backgroundColor: config.bgColor || '#F3F4F6',
        color: config.color || '#6B7280',
        fontWeight: 600,
        fontSize: { xs: '0.5rem', sm: '0.6rem' },
        height: { xs: 18, sm: 22 },
        border: `1px solid ${(config.color || '#6B7280')}20`,
        '& .MuiChip-label': { px: { xs: 0.75, sm: 1 }, py: 0.25 },
        '& .MuiChip-icon': { fontSize: { xs: '0.6rem', sm: '0.7rem' }, ml: 0.5 }
      }}
      icon={<span>{config.icon}</span>}
    />
  );
};

// ============================================================
// COMPONENT: SeverityChip
// ============================================================

const SeverityChip = ({ severity }) => {
  const configs = {
    LOW: { label: 'Low', color: '#2e7d32', bgColor: '#e8f5e9' },
    MEDIUM: { label: 'Medium', color: '#ed6c02', bgColor: '#fff3e0' },
    HIGH: { label: 'High', color: '#d32f2f', bgColor: '#ffebee' },
    CRITICAL: { label: 'Critical', color: '#b71c1c', bgColor: '#ffcdd2' }
  };
  
  const config = configs[severity] || configs.MEDIUM;
  
  return (
    <Chip
      label={config.label}
      size="small"
      sx={{
        backgroundColor: config.bgColor,
        color: config.color,
        fontWeight: 600,
        fontSize: { xs: '0.5rem', sm: '0.6rem' },
        height: { xs: 18, sm: 20 },
        '& .MuiChip-label': { px: { xs: 0.75, sm: 1 }, py: 0.25 }
      }}
    />
  );
};

// ============================================================
// COMPONENT: IncidentStatusChip
// ============================================================

const IncidentStatusChip = ({ status }) => {
  const configs = {
    OPEN: { label: 'Open', color: '#d32f2f', bgColor: '#ffebee' },
    IN_PROGRESS: { label: 'In Progress', color: '#ed6c02', bgColor: '#fff3e0' },
    RESOLVED: { label: 'Resolved', color: '#2e7d32', bgColor: '#e8f5e9' },
    CLOSED: { label: 'Closed', color: '#757575', bgColor: '#f5f5f5' }
  };
  
  const config = configs[status] || configs.OPEN;
  
  return (
    <Chip
      label={config.label}
      size="small"
      sx={{
        backgroundColor: config.bgColor,
        color: config.color,
        fontWeight: 600,
        fontSize: { xs: '0.5rem', sm: '0.6rem' },
        height: { xs: 18, sm: 20 },
        '& .MuiChip-label': { px: { xs: 0.75, sm: 1 }, py: 0.25 }
      }}
    />
  );
};

// ============================================================
// COMPONENT: InfoItem (matching Dashboard style)
// ============================================================

const InfoItem = ({ label, value, icon: Icon, color = 'primary', isChip = false }) => {
  const iconColor = getColor(color);
  const bgColor = getColorBg(color);
  
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5 }}>
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
          }}
        >
          <Icon sx={{ fontSize: '0.9rem', color: iconColor }} />
        </Box>
      )}
      <Box>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.55rem', sm: '0.65rem' }, display: 'block' }}>
          {label}
        </Typography>
        {isChip ? (
          <Box sx={{ mt: 0.25 }}>{value}</Box>
        ) : (
          <Typography variant="body2" sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem' }, fontWeight: 500 }}>
            {value || 'N/A'}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

// ============================================================
// COMPONENT: StatCard (matching Dashboard StatCard)
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
  const SafeIcon = Icon || DashboardIcon;

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
// COMPONENT: FuelStatCard (matching Dashboard style)
// ============================================================

const FuelStatCard = ({ icon: Icon, title, value, subtitle, color = 'primary' }) => {
  const iconColor = getColor(color);
  const bgColor = getColorBg(color);
  
  return (
    <Card
      sx={{
        bgcolor: '#FFFFFF',
        borderRadius: { xs: '10px', sm: '12px' },
        border: '1px solid #ECECEC',
        height: '100%',
        '&:hover': {
          borderColor: iconColor,
        },
      }}
    >
      <CardContent sx={{ p: { xs: 1.5, sm: 2 }, textAlign: 'center' }}>
        <Box
          sx={{
            bgcolor: bgColor,
            borderRadius: '10px',
            p: 0.75,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 1,
          }}
        >
          <Icon sx={{ fontSize: { xs: '1.2rem', sm: '1.4rem' }, color: iconColor }} />
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.55rem', sm: '0.65rem' }, display: 'block' }}>
          {title}
        </Typography>
        <Typography variant="h6" fontWeight="bold" sx={{ fontSize: { xs: '0.85rem', sm: '0.95rem' } }}>
          {value}
        </Typography>
        {subtitle && (
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.5rem', sm: '0.6rem' } }}>
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

// ============================================================
// COMPONENT: IncidentsTab
// ============================================================

const IncidentsTab = ({ tripId, trip }) => {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('ALL');
  const [incidentDialogOpen, setIncidentDialogOpen] = useState(false);
  const [editingIncident, setEditingIncident] = useState(null);
  const [editingIncidentData, setEditingIncidentData] = useState(null);

  const fetchIncidents = useCallback(async () => {
  if (!tripId) return;
  
  setLoading(true);
  setError(null);
  
  try {
    // Try the main endpoint first
    let data;
    try {
      data = await tripService.getTripIncidents(tripId);
    } catch (primaryErr) {
      console.warn('Primary incident endpoint failed, trying fallback...');
      // Try fallback endpoint
      try {
        data = await tripService.getTripIncidents(tripId);
      } catch (fallbackErr) {
        console.warn('Fallback incident endpoint also failed');
        // Return empty array instead of throwing
        setIncidents([]);
        setLoading(false);
        return;
      }
    }
    
    setIncidents(Array.isArray(data) ? data : []);
  } catch (err) {
    console.error('Error fetching incidents:', err);
    // Don't show error to user, just set empty incidents
    setIncidents([]);
  } finally {
    setLoading(false);
  }
}, [tripId]);

  useEffect(() => {
    if (tripId) {
      fetchIncidents();
    }
  }, [tripId, fetchIncidents]);

  const handleReportIncident = async (incidentData) => {
    try {
      const payload = { ...incidentData, tripId };
      
      if (editingIncident) {
        await tripService.updateIncident(tripId, editingIncident.id, payload);
      } else {
        await tripService.reportIncident(tripId, payload);
      }
      
      setIncidentDialogOpen(false);
      setEditingIncident(null);
      fetchIncidents();
    } catch (err) {
      console.error('Error saving incident:', err);
      setError(err.message || 'Failed to save incident');
    }
  };

  const handleEdit = (incident) => {
    setEditingIncident(incident);
    setEditingIncidentData({
      incidentType: incident.incidentType || '',
      severity: incident.severity || 'MEDIUM',
      description: incident.description || '',
      location: incident.location || '',
      requiresAssistance: incident.requiresAssistance || false
    });
    setIncidentDialogOpen(true);
  };

  const handleDelete = async (incidentId) => {
    if (!window.confirm('Are you sure you want to delete this incident?')) return;
    
    try {
      await tripService.deleteIncident(tripId, incidentId);
      fetchIncidents();
    } catch (err) {
      console.error('Error deleting incident:', err);
      setError('Failed to delete incident');
    }
  };

  const filteredIncidents = useMemo(() => {
    if (filter === 'ALL') return incidents;
    return incidents.filter(i => i.status === filter);
  }, [incidents, filter]);

  const stats = useMemo(() => {
    const total = incidents.length;
    const open = incidents.filter(i => i.status === 'OPEN' || i.status === 'IN_PROGRESS').length;
    const inProgress = incidents.filter(i => i.status === 'IN_PROGRESS').length;
    const resolved = incidents.filter(i => i.status === 'RESOLVED' || i.status === 'CLOSED').length;
    const critical = incidents.filter(i => i.severity === 'CRITICAL').length;
    return { total, open, inProgress, resolved, critical };
  }, [incidents]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={150}>
        <CircularProgress size={30} />
      </Box>
    );
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: '12px', fontSize: '0.75rem' }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Stats Row - matching Dashboard */}
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid item xs={3}>
          <StatCard
            title="Total"
            value={stats.total}
            icon={IncidentIcon}
            color="secondary"
          />
        </Grid>
        <Grid item xs={3}>
          <StatCard
            title="Open"
            value={stats.open}
            icon={WarningIcon}
            color="error"
          />
        </Grid>
        <Grid item xs={3}>
          <StatCard
            title="Critical"
            value={stats.critical}
            icon={WarningIcon}
            color="error"
          />
        </Grid>
        <Grid item xs={3}>
          <StatCard
            title="Resolved"
            value={stats.resolved}
            icon={CheckCircleIcon}
            color="success"
          />
        </Grid>
      </Grid>

      {/* Actions - matching Dashboard filter style */}
      <Stack direction="row" spacing={1} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
        <Button
          variant="contained"
          size="small"
          startIcon={<AddIcon sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' } }} />}
          onClick={() => { 
            setEditingIncident(null);
            setEditingIncidentData(null);
            setIncidentDialogOpen(true); 
          }}
          sx={{
            borderRadius: '10px',
            fontSize: { xs: '0.7rem', sm: '0.75rem' },
            textTransform: 'none',
            background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #4338CA 0%, #4F46E5 100%)',
            },
          }}
        >
          Report Incident
        </Button>
        
        <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 120 } }}>
          <InputLabel sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>Filter</InputLabel>
          <Select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            label="Filter"
            sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' }, borderRadius: '10px' }}
          >
            <MenuItem value="ALL" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>All</MenuItem>
            <MenuItem value="OPEN" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>Open</MenuItem>
            <MenuItem value="IN_PROGRESS" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>In Progress</MenuItem>
            <MenuItem value="RESOLVED" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>Resolved</MenuItem>
          </Select>
        </FormControl>
        
        <Button
          size="small"
          startIcon={<RefreshIcon sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' } }} />}
          onClick={fetchIncidents}
          variant="outlined"
          sx={{
            borderRadius: '10px',
            fontSize: { xs: '0.7rem', sm: '0.75rem' },
            textTransform: 'none',
          }}
        >
          Refresh
        </Button>
      </Stack>

      {/* Incidents Table - matching TripList style */}
      {filteredIncidents.length === 0 ? (
        <Box textAlign="center" py={3}>
          <IncidentIcon sx={{ fontSize: 40, color: '#D1D5DB', mb: 1 }} />
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
            No incidents reported
          </Typography>
          <Button
            variant="outlined"
            size="small"
            startIcon={<AddIcon sx={{ fontSize: '0.8rem' }} />}
            onClick={() => { 
              setEditingIncident(null);
              setEditingIncidentData(null);
              setIncidentDialogOpen(true); 
            }}
            sx={{ mt: 1, borderRadius: '10px', fontSize: '0.75rem', textTransform: 'none' }}
          >
            Report First Incident
          </Button>
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: '12px', border: '1px solid #ECECEC' }}>
          <Table size="small">
            <TableHead sx={{ bgcolor: '#F9FAFB' }}>
              <TableRow>
                <TableCell sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' }, fontWeight: 600, color: '#6B7280', py: 1 }}>Type</TableCell>
                <TableCell sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' }, fontWeight: 600, color: '#6B7280', py: 1 }}>Severity</TableCell>
                <TableCell sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' }, fontWeight: 600, color: '#6B7280', py: 1 }}>Description</TableCell>
                <TableCell sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' }, fontWeight: 600, color: '#6B7280', py: 1 }}>Status</TableCell>
                <TableCell sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' }, fontWeight: 600, color: '#6B7280', py: 1 }}>Reported</TableCell>
                <TableCell sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' }, fontWeight: 600, color: '#6B7280', py: 1 }} align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredIncidents.map((incident) => (
                <TableRow key={incident.id} hover sx={{ '&:hover': { bgcolor: '#F9FAFB' } }}>
                  <TableCell>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <IncidentIcon sx={{ fontSize: '0.8rem', color: 'error.main' }} />
                      <Typography variant="body2" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                        {incident.incidentType}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <SeverityChip severity={incident.severity} />
                  </TableCell>
                  <TableCell>
                    <Tooltip title={incident.description}>
                      <Typography variant="body2" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' }, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {incident.description}
                      </Typography>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <IncidentStatusChip status={incident.status} />
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" sx={{ fontSize: { xs: '0.55rem', sm: '0.65rem' } }}>
                      {formatDate(incident.reportedAt)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: { xs: '0.5rem', sm: '0.6rem' } }}>
                      {formatTime(incident.reportedAt)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={0.5} justifyContent="center">
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => handleEdit(incident)} sx={{ p: 0.5 }}>
                          <EditIcon sx={{ fontSize: '0.8rem', color: '#6B7280' }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" onClick={() => handleDelete(incident.id)} sx={{ p: 0.5, color: 'error.main' }}>
                          <DeleteIcon sx={{ fontSize: '0.8rem' }} />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Incident Dialog */}
      <IncidentDialog
        open={incidentDialogOpen}
        onClose={() => {
          setIncidentDialogOpen(false);
          setEditingIncident(null);
          setEditingIncidentData(null);
        }}
        onSubmit={handleReportIncident}
        trip={trip}
        initialData={editingIncidentData}
        isEditing={!!editingIncident}
      />
    </Box>
  );
};

// ============================================================
// COMPONENT: FuelEntriesTable
// ============================================================

const FuelEntriesTable = ({ fuelData, fuelLoading, onAddFuelEntry }) => {
  if (fuelLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={150}>
        <CircularProgress size={30} />
      </Box>
    );
  }

  if (!fuelData?.fuelEntries || fuelData.fuelEntries.length === 0) {
    return (
      <Box textAlign="center" py={3}>
        <FuelIcon sx={{ fontSize: 40, color: '#D1D5DB', mb: 1 }} />
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
          No fuel entries recorded
        </Typography>
        <Button
          variant="outlined"
          size="small"
          startIcon={<AddIcon sx={{ fontSize: '0.8rem' }} />}
          onClick={onAddFuelEntry}
          sx={{ mt: 1, borderRadius: '10px', fontSize: '0.75rem', textTransform: 'none' }}
        >
          Add Fuel Entry
        </Button>
      </Box>
    );
  }

  return (
    <TableContainer component={Paper} sx={{ borderRadius: '12px', border: '1px solid #ECECEC' }}>
      <Table size="small">
        <TableHead sx={{ bgcolor: '#F9FAFB' }}>
          <TableRow>
            <TableCell sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' }, fontWeight: 600, color: '#6B7280', py: 1 }}>Date & Time</TableCell>
            <TableCell sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' }, fontWeight: 600, color: '#6B7280', py: 1 }}>Fuel Station</TableCell>
            <TableCell align="right" sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' }, fontWeight: 600, color: '#6B7280', py: 1 }}>Liters</TableCell>
            <TableCell align="right" sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' }, fontWeight: 600, color: '#6B7280', py: 1 }}>Price/L</TableCell>
            <TableCell align="right" sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' }, fontWeight: 600, color: '#6B7280', py: 1 }}>Total</TableCell>
            <TableCell align="right" sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' }, fontWeight: 600, color: '#6B7280', py: 1 }}>Odometer</TableCell>
            <TableCell align="right" sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' }, fontWeight: 600, color: '#6B7280', py: 1 }}>Receipt #</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {fuelData.fuelEntries.map((entry, index) => (
            <TableRow key={index} hover sx={{ '&:hover': { bgcolor: '#F9FAFB' } }}>
              <TableCell>
                <Typography sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' } }}>
                  {formatDate(entry.date)}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.5rem', sm: '0.6rem' } }}>
                  {formatTime(entry.date)}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' } }}>
                  {entry.station || 'N/A'}
                </Typography>
                {entry.stationLocation && (
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.5rem', sm: '0.6rem' } }}>
                    {entry.stationLocation}
                  </Typography>
                )}
              </TableCell>
              <TableCell align="right">
                <Typography fontWeight="medium" sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' } }}>
                  {formatNumber(entry.liters, 1)}
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Typography fontWeight="medium" color="primary" sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' } }}>
                  {formatCurrency(entry.pricePerLiter || 0)}
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Typography fontWeight="bold" sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' } }}>
                  {formatCurrency((entry.liters || 0) * (entry.pricePerLiter || 0))}
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Typography sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' } }}>
                  {entry.odometer ? formatNumber(entry.odometer) : 'N/A'}
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Typography sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' } }}>
                  {entry.receiptNumber || 'N/A'}
                </Typography>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

// ============================================================
// COMPONENT: TripInformationCard (matching Dashboard style)
// ============================================================

const TripInformationCard = ({ trip }) => (
  <Card
    sx={{
      borderRadius: { xs: '12px', sm: '16px' },
      border: '1px solid #ECECEC',
      mb: 2,
    }}
  >
    <CardHeader 
      title="Trip Information"
      titleTypographyProps={{ 
        variant: 'subtitle2', 
        fontWeight: 600, 
        fontSize: { xs: '0.8rem', sm: '0.85rem' } 
      }}
      sx={{ py: 1, px: 2, bgcolor: '#F9FAFB' }}
    />
    <CardContent sx={{ p: 2, pt: 1 }}>
      <Grid container spacing={1.5}>
        <Grid item xs={12}>
          <InfoItem 
            label="Customer" 
            value={trip.customerName || 'No Customer Assigned'} 
            icon={BusinessIcon} 
            color="primary"
          />
          {trip.customerCode && (
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.5rem', sm: '0.6rem' }, ml: 3.5 }}>
              Code: {trip.customerCode}
            </Typography>
          )}
        </Grid>

        <Grid item xs={12} sm={6}>
          <InfoItem 
            label="Origin" 
            value={trip.originLocation || '-'} 
            icon={LocationIcon} 
            color="info"
          />
          {trip.originCity && (
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.5rem', sm: '0.6rem' }, ml: 3.5 }}>
              {trip.originCity}
            </Typography>
          )}
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <InfoItem 
            label="Destination" 
            value={trip.destinationLocation || '-'} 
            icon={LocationIcon} 
            color="info"
          />
          {trip.destinationCity && (
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.5rem', sm: '0.6rem' }, ml: 3.5 }}>
              {trip.destinationCity}
            </Typography>
          )}
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <InfoItem 
            label="Driver" 
            value={trip.driverName || 'Not Assigned'} 
            icon={PersonIcon} 
            color="success"
          />
          {trip.driverContact && (
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.5rem', sm: '0.6rem' }, ml: 3.5 }}>
              {trip.driverContact}
            </Typography>
          )}
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <InfoItem 
            label="Vehicle" 
            value={trip.vehicleRegistration || 'Not Assigned'} 
            icon={CarIcon} 
            color="warning"
          />
          {trip.vehicleModel && (
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.5rem', sm: '0.6rem' }, ml: 3.5 }}>
              {trip.vehicleModel}
            </Typography>
          )}
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <InfoItem 
            label="Planned Start" 
            value={formatDateTime(trip.plannedStartDate)} 
            icon={ScheduleIcon} 
            color="primary"
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <InfoItem 
            label="Planned End" 
            value={formatDateTime(trip.plannedEndDate)} 
            icon={ScheduleIcon} 
            color="secondary"
          />
        </Grid>

        {trip.totalDistance && (
          <Grid item xs={12} sm={6}>
            <InfoItem 
              label="Total Distance" 
              value={`${formatNumber(trip.totalDistance)} km`} 
              icon={RouteIcon} 
              color="purple"
            />
          </Grid>
        )}
      </Grid>
    </CardContent>
  </Card>
);

// ============================================================
// COMPONENT: UpdateTripCard (matching Dashboard style)
// ============================================================

const UpdateTripCard = ({ 
  trip, 
  newStatus, 
  setNewStatus, 
  actualStartDate, 
  setActualStartDate,
  actualStartTime,
  setActualStartTime,
  actualEndDate,
  setActualEndDate,
  actualEndTime,
  setActualEndTime 
}) => (
  <Card
    sx={{
      borderRadius: { xs: '12px', sm: '16px' },
      border: '1px solid #ECECEC',
    }}
  >
    <CardHeader 
      title="Update Trip Details"
      titleTypographyProps={{ 
        variant: 'subtitle2', 
        fontWeight: 600, 
        fontSize: { xs: '0.8rem', sm: '0.85rem' } 
      }}
      sx={{ py: 1, px: 2, bgcolor: '#F9FAFB' }}
    />
    <CardContent sx={{ p: 2, pt: 1 }}>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth size="small">
            <InputLabel sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>Change Status</InputLabel>
            <Select
              value={newStatus}
              label="Change Status"
              onChange={(e) => setNewStatus(e.target.value)}
              sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' }, borderRadius: '10px' }}
            >
              {TRIP_STATUS_OPTIONS.map(status => (
                <MenuItem key={status.value} value={status.value} sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: status.color || '#6B7280' }} />
                    {status.label}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12}>
          <Divider sx={{ my: 1.5 }} />
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' } }} gutterBottom>
            Actual Times
          </Typography>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <DatePicker
            label="Actual Start Date"
            value={actualStartDate}
            onChange={setActualStartDate}
            slotProps={{ 
              textField: { 
                fullWidth: true, 
                size: 'small',
                sx: { 
                  '& .MuiInputLabel-root': { fontSize: { xs: '0.65rem', sm: '0.75rem' } },
                  '& .MuiInputBase-root': { fontSize: { xs: '0.7rem', sm: '0.75rem' }, borderRadius: '10px' }
                }
              } 
            }}
          />
          <Box mt={1}>
            <TimePicker
              label="Actual Start Time"
              value={actualStartTime}
              onChange={setActualStartTime}
              slotProps={{ 
                textField: { 
                  fullWidth: true, 
                  size: 'small',
                  disabled: !actualStartDate,
                  sx: { 
                    '& .MuiInputLabel-root': { fontSize: { xs: '0.65rem', sm: '0.75rem' } },
                    '& .MuiInputBase-root': { fontSize: { xs: '0.7rem', sm: '0.75rem' }, borderRadius: '10px' }
                  }
                } 
              }}
            />
          </Box>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <DatePicker
            label="Actual End Date"
            value={actualEndDate}
            onChange={setActualEndDate}
            slotProps={{ 
              textField: { 
                fullWidth: true, 
                size: 'small',
                sx: { 
                  '& .MuiInputLabel-root': { fontSize: { xs: '0.65rem', sm: '0.75rem' } },
                  '& .MuiInputBase-root': { fontSize: { xs: '0.7rem', sm: '0.75rem' }, borderRadius: '10px' }
                }
              } 
            }}
          />
          <Box mt={1}>
            <TimePicker
              label="Actual End Time"
              value={actualEndTime}
              onChange={setActualEndTime}
              slotProps={{ 
                textField: { 
                  fullWidth: true, 
                  size: 'small',
                  disabled: !actualEndDate,
                  sx: { 
                    '& .MuiInputLabel-root': { fontSize: { xs: '0.65rem', sm: '0.75rem' } },
                    '& .MuiInputBase-root': { fontSize: { xs: '0.7rem', sm: '0.75rem' }, borderRadius: '10px' }
                  }
                } 
              }}
            />
          </Box>
        </Grid>
      </Grid>
    </CardContent>
  </Card>
);

// ============================================================
// COMPONENT: QuickStatsCard (matching Dashboard style)
// ============================================================

const QuickStatsCard = ({ trip, tripEfficiency }) => (
  <Card
    sx={{
      borderRadius: { xs: '12px', sm: '16px' },
      border: '1px solid #ECECEC',
      mb: 2,
    }}
  >
    <CardHeader 
      title="Quick Stats"
      titleTypographyProps={{ 
        variant: 'subtitle2', 
        fontWeight: 600, 
        fontSize: { xs: '0.8rem', sm: '0.85rem' } 
      }}
      sx={{ py: 1, px: 2, bgcolor: '#F9FAFB' }}
    />
    <CardContent sx={{ p: 2, pt: 1 }}>
      <Stack spacing={1.5}>
        <InfoItem 
          label="Customer" 
          value={trip.customerName || 'No Customer'} 
          icon={BusinessIcon} 
          color="primary"
        />
        
        <Divider />
        
        <InfoItem 
          label="Status" 
          value={STATUS_CONFIG[trip.status]?.label || trip.status} 
          icon={ScheduleIcon} 
          color="info"
          isChip
        />
        
        {tripEfficiency && (
          <>
            <Divider />
            <InfoItem 
              label="Fuel Efficiency" 
              value={`${tripEfficiency.kmPerLiter.toFixed(1)} km/L`} 
              icon={FuelIcon} 
              color="success"
            />
            <InfoItem 
              label="Cost per Kilometer" 
              value={formatCurrency(tripEfficiency.costPerKm)} 
              icon={MoneyIcon} 
              color="primary"
            />
            <InfoItem 
              label="Total Distance" 
              value={`${formatNumber(tripEfficiency.totalDistance)} km`} 
              icon={RouteIcon} 
              color="purple"
            />
          </>
        )}
        
        {trip.cargoWeight && (
          <InfoItem 
            label="Cargo Weight" 
            value={`${formatNumber(trip.cargoWeight)} kg`} 
            icon={SpeedIcon} 
            color="warning"
          />
        )}
      </Stack>
    </CardContent>
  </Card>
);

// ============================================================
// COMPONENT: CargoDetailsCard (matching Dashboard style)
// ============================================================

const CargoDetailsCard = ({ trip }) => (
  <Card
    sx={{
      borderRadius: { xs: '12px', sm: '16px' },
      border: '1px solid #ECECEC',
    }}
  >
    <CardHeader 
      title="Cargo Details"
      titleTypographyProps={{ 
        variant: 'subtitle2', 
        fontWeight: 600, 
        fontSize: { xs: '0.8rem', sm: '0.85rem' } 
      }}
      sx={{ py: 1, px: 2, bgcolor: '#F9FAFB' }}
    />
    <CardContent sx={{ p: 2, pt: 1 }}>
      <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' } }} gutterBottom>
        Description:
      </Typography>
      <Typography variant="body2" sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem' }, whiteSpace: 'pre-wrap', mb: 1.5 }}>
        {trip.cargoDescription || 'No description provided'}
      </Typography>
      
      <Divider sx={{ my: 1.5 }} />
      
      <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' } }} gutterBottom>
        Notes:
      </Typography>
      <Typography variant="body2" sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem' }, whiteSpace: 'pre-wrap' }}>
        {trip.notes || 'No notes'}
      </Typography>
    </CardContent>
  </Card>
);

// ============================================================
// COMPONENT: DocumentsTab (matching Dashboard style)
// ============================================================

const DocumentsTab = ({ trip }) => (
  <Card
    sx={{
      borderRadius: { xs: '12px', sm: '16px' },
      border: '1px solid #ECECEC',
    }}
  >
    <CardHeader 
      title="Documents & Attachments"
      titleTypographyProps={{ 
        variant: 'subtitle2', 
        fontWeight: 600, 
        fontSize: { xs: '0.8rem', sm: '0.85rem' } 
      }}
      sx={{ py: 1, px: 2, bgcolor: '#F9FAFB' }}
    />
    <CardContent sx={{ p: 2, pt: 1 }}>
      <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem' }, mb: 2 }}>
        Document management coming soon...
      </Typography>
      
      <Divider sx={{ my: 1.5 }} />
      
      <Typography variant="subtitle2" fontWeight="600" sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem' } }} gutterBottom>
        Additional Notes
      </Typography>
      <Typography variant="body2" sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem' }, whiteSpace: 'pre-wrap' }}>
        {trip.additionalNotes || 'No additional notes'}
      </Typography>
    </CardContent>
  </Card>
);

// ============================================================
// MAIN COMPONENT: TripDetails
// ============================================================

const TripDetails = ({ open = false, tripId, onClose, onUpdate }) => {
  // State
  const [trip, setTrip] = useState(null);
  const [fuelData, setFuelData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fuelLoading, setFuelLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [newStatus, setNewStatus] = useState('');
  const [actualStartDate, setActualStartDate] = useState(null);
  const [actualStartTime, setActualStartTime] = useState(null);
  const [actualEndDate, setActualEndDate] = useState(null);
  const [actualEndTime, setActualEndTime] = useState(null);
  const [error, setError] = useState(null);
  const [fuelError, setFuelError] = useState(null);

  /* ============================================================
     DATA FETCHING
   ============================================================ */

  const fetchTripData = useCallback(async () => {
    if (!tripId) return;
    
    setLoading(true);
    setFuelLoading(true);
    setError(null);
    setFuelError(null);
    
    try {
      const tripData = await tripService.getTripById(tripId);
      setTrip(tripData);
      setNewStatus(tripData.status || '');
      
      // Set actual start date/time
      if (tripData.actualStartDate) {
        const startDate = dayjs(tripData.actualStartDate);
        setActualStartDate(startDate);
        setActualStartTime(startDate);
      } else {
        setActualStartDate(null);
        setActualStartTime(null);
      }
      
      // Set actual end date/time
      if (tripData.actualEndDate) {
        const endDate = dayjs(tripData.actualEndDate);
        setActualEndDate(endDate);
        setActualEndTime(endDate);
      } else {
        setActualEndDate(null);
        setActualEndTime(null);
      }
      
      // Fetch fuel data
      try {
        const fuelResponse = await tripService.getTripFuelData(tripId);
        setFuelData(fuelResponse);
      } catch (fuelErr) {
        console.error('Error fetching fuel data:', fuelErr);
        setFuelError('Failed to load fuel data');
      }
      
    } catch (err) {
      console.error('Error fetching trip:', err);
      setError('Failed to load trip details');
    } finally {
      setLoading(false);
      setFuelLoading(false);
    }
  }, [tripId]);

  /* ============================================================
     COMPUTED VALUES
   ============================================================ */

  const fuelStats = useMemo(() => {
    if (!fuelData?.fuelEntries || fuelData.fuelEntries.length === 0) {
      return {
        totalLiters: 0,
        totalCost: 0,
        avgPricePerLiter: 0,
        maxPrice: 0,
        minPrice: 0,
        entriesCount: 0
      };
    }

    let totalLiters = 0;
    let totalCost = 0;
    let maxPrice = 0;
    let minPrice = Infinity;

    fuelData.fuelEntries.forEach(entry => {
      const liters = entry.liters || 0;
      const pricePerLiter = entry.pricePerLiter || 0;
      totalLiters += liters;
      totalCost += liters * pricePerLiter;
      maxPrice = Math.max(maxPrice, pricePerLiter);
      minPrice = Math.min(minPrice, pricePerLiter);
    });

    return {
      totalLiters,
      totalCost,
      avgPricePerLiter: totalLiters > 0 ? totalCost / totalLiters : 0,
      maxPrice: minPrice === Infinity ? 0 : maxPrice,
      minPrice: minPrice === Infinity ? 0 : minPrice,
      entriesCount: fuelData.fuelEntries.length
    };
  }, [fuelData]);

  const tripEfficiency = useMemo(() => {
    if (!trip || !fuelStats.totalLiters || fuelStats.totalLiters === 0) return null;
    
    const distance = trip.totalDistance || trip.distanceTraveled || 0;
    if (distance === 0) return null;
    
    return {
      kmPerLiter: distance / fuelStats.totalLiters,
      costPerKm: fuelStats.totalCost / distance,
      totalDistance: distance
    };
  }, [trip, fuelStats]);

  const hasChanges = useMemo(() => {
    if (!trip) return false;
    
    if (trip.status !== newStatus) return true;
    
    const compareDateTimes = (original, date, time) => {
      if (!original && (!date && !time)) return false;
      if (original && !date && !time) return true;
      if (!original && (date || time)) return true;
      
      if (date && time) {
        const newDateTime = dayjs(date)
          .set('hour', time.hour())
          .set('minute', time.minute())
          .set('second', 0);
        return !dayjs(original).isSame(newDateTime);
      }
      
      return false;
    };
    
    if (compareDateTimes(trip.actualStartDate, actualStartDate, actualStartTime)) return true;
    if (compareDateTimes(trip.actualEndDate, actualEndDate, actualEndTime)) return true;
    
    return false;
  }, [trip, newStatus, actualStartDate, actualStartTime, actualEndDate, actualEndTime]);

  /* ============================================================
     EFFECTS
   ============================================================ */

  useEffect(() => {
    if (open && tripId) {
      fetchTripData();
    }
  }, [open, tripId, fetchTripData]);

  useEffect(() => {
    if (!open) {
      const timer = setTimeout(() => {
        setTrip(null);
        setFuelData(null);
        setError(null);
        setFuelError(null);
        setNewStatus('');
        setActualStartDate(null);
        setActualStartTime(null);
        setActualEndDate(null);
        setActualEndTime(null);
        setActiveTab(0);
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [open]);

  /* ============================================================
     HANDLERS
   ============================================================ */

  const handleUpdateTrip = async () => {
    if (!trip || !tripId) return;
    
    setUpdating(true);
    setError(null);
    
    try {
      let actualStartDateTime = null;
      if (actualStartDate && actualStartTime) {
        actualStartDateTime = dayjs(actualStartDate)
          .set('hour', actualStartTime.hour())
          .set('minute', actualStartTime.minute())
          .set('second', 0);
      } else if (actualStartDate) {
        actualStartDateTime = dayjs(actualStartDate).startOf('day');
      }

      let actualEndDateTime = null;
      if (actualEndDate && actualEndTime) {
        actualEndDateTime = dayjs(actualEndDate)
          .set('hour', actualEndTime.hour())
          .set('minute', actualEndTime.minute())
          .set('second', 0);
      } else if (actualEndDate) {
        actualEndDateTime = dayjs(actualEndDate).endOf('day');
      }

      const payload = {
        ...trip,
        status: newStatus || trip.status,
        actualStartDate: actualStartDateTime ? actualStartDateTime.toISOString() : null,
        actualEndDate: actualEndDateTime ? actualEndDateTime.toISOString() : null,
      };
      
      await tripService.updateTrip(tripId, payload);
      if (onUpdate) onUpdate();
      await fetchTripData();
    } catch (err) {
      console.error('Update error:', err);
      setError(err.message || 'Failed to update trip');
    } finally {
      setUpdating(false);
    }
  };

  const handleClose = () => {
    if (onClose) onClose();
  };

  const handleRefresh = () => {
    fetchTripData();
  };

  const handleAddFuelEntry = () => {
    console.log('Navigate to fuel entry form for trip:', tripId);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  /* ============================================================
     RENDER HELPERS
   ============================================================ */

  const renderLoading = () => (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight={250}>
      <CircularProgress size={35} />
    </Box>
  );

  const renderEmpty = () => (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight={250}>
      <Typography color="text.secondary" sx={{ fontSize: '0.8rem' }}>No trip data available</Typography>
    </Box>
  );

  const renderError = () => error && (
    <Alert 
      severity="error" 
      sx={{ mx: 2, mt: 2, borderRadius: '12px', fontSize: '0.75rem' }}
      onClose={() => setError(null)}
    >
      {error}
    </Alert>
  );

  /* ============================================================
     MAIN RENDER
   ============================================================ */

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="lg"
        fullWidth
        PaperProps={{ 
          sx: { 
            maxHeight: '90vh', 
            borderRadius: { xs: '12px', sm: '16px' },
            overflow: 'hidden',
          } 
        }}
      >
        {/* Dialog Title - matching Dashboard header style */}
        <DialogTitle sx={{ 
          py: 1.5, 
          px: 2.5, 
          borderBottom: 1, 
          borderColor: 'divider',
          bgcolor: '#F9FAFB',
        }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="h6" component="div" fontWeight="700" sx={{ fontSize: { xs: '0.95rem', sm: '1.05rem' } }}>
                Trip Details
              </Typography>
              <Typography variant="caption" color="primary" fontWeight="500" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                {trip ? `#${trip.tripNumber}` : 'Loading...'}
              </Typography>
            </Box>
            {trip && (
              <Stack direction="row" spacing={0.75} alignItems="center">
                <StatusChip status={trip.status} />
                <Tooltip title="Edit Trip">
                  <IconButton 
                    size="small" 
                    color="primary" 
                    sx={{ 
                      p: 0.5,
                      bgcolor: '#EEF2FF',
                      '&:hover': { bgcolor: '#E0E7FF' }
                    }}
                  >
                    <EditIcon sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' } }} />
                  </IconButton>
                </Tooltip>
              </Stack>
            )}
          </Stack>
        </DialogTitle>
        
        {/* Dialog Content */}
        <DialogContent dividers sx={{ p: 0, bgcolor: '#F7F7FC' }}>
          {renderError()}
          
          {loading && !trip ? renderLoading() : trip ? (
            <Box>
              {/* Tabs - matching Dashboard tab style */}
              <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2, bgcolor: '#FFFFFF' }}>
                <Tabs 
                  value={activeTab} 
                  onChange={handleTabChange}
                  sx={{
                    '& .MuiTab-root': {
                      fontSize: { xs: '0.7rem', sm: '0.75rem' },
                      minHeight: { xs: 36, sm: 40 },
                      textTransform: 'none',
                      fontWeight: 500,
                      '&.Mui-selected': {
                        fontWeight: 600,
                        color: '#4F46E5',
                      },
                    },
                    '& .MuiTabs-indicator': {
                      backgroundColor: '#4F46E5',
                      height: 3,
                      borderRadius: '3px 3px 0 0',
                    },
                  }}
                >
                  <Tab label="Overview" />
                  <Tab 
                    label={
                      <Box display="flex" alignItems="center" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                        <FuelIcon sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' }, mr: 0.5 }} />
                        Fuel
                        {fuelStats.entriesCount > 0 && (
                          <Chip 
                            label={fuelStats.entriesCount} 
                            size="small" 
                            sx={{ 
                              ml: 0.75, 
                              height: { xs: 16, sm: 18 }, 
                              fontSize: { xs: '0.45rem', sm: '0.55rem' },
                              bgcolor: '#D1FAE5',
                              color: '#065F46',
                              fontWeight: 600,
                            }}
                          />
                        )}
                      </Box>
                    } 
                  />
                  <Tab 
                    label={
                      <Box display="flex" alignItems="center" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                        <IncidentIcon sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' }, mr: 0.5 }} />
                        Incidents
                        <Chip 
                          label={trip.incidentsCount || 0} 
                          size="small" 
                          color={trip.incidentsCount > 0 ? 'error' : 'default'}
                          sx={{ 
                            ml: 0.75, 
                            height: { xs: 16, sm: 18 }, 
                            fontSize: { xs: '0.45rem', sm: '0.55rem' },
                            fontWeight: 600,
                          }}
                        />
                      </Box>
                    } 
                  />
                  <Tab label="Documents & Notes" />
                </Tabs>
              </Box>

              {/* Tab Content */}
              <Box sx={{ p: 2 }}>
                {activeTab === 0 && (
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={8}>
                      <TripInformationCard trip={trip} />
                      <UpdateTripCard 
                        trip={trip}
                        newStatus={newStatus}
                        setNewStatus={setNewStatus}
                        actualStartDate={actualStartDate}
                        setActualStartDate={setActualStartDate}
                        actualStartTime={actualStartTime}
                        setActualStartTime={setActualStartTime}
                        actualEndDate={actualEndDate}
                        setActualEndDate={setActualEndDate}
                        actualEndTime={actualEndTime}
                        setActualEndTime={setActualEndTime}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <QuickStatsCard trip={trip} tripEfficiency={tripEfficiency} />
                      <CargoDetailsCard trip={trip} />
                    </Grid>
                  </Grid>
                )}

                {activeTab === 1 && (
                  <Box>
                    {fuelError && (
                      <Alert severity="warning" sx={{ mb: 2, borderRadius: '12px', fontSize: '0.75rem' }}>
                        {fuelError}
                      </Alert>
                    )}

                    {/* Fuel Summary Cards - matching Dashboard style */}
                    <Grid container spacing={1.5} sx={{ mb: 2 }}>
                      <Grid item xs={12} sm={6} md={3}>
                        <FuelStatCard
                          icon={FuelIcon}
                          title="Total Fuel"
                          value={`${formatNumber(fuelStats.totalLiters, 1)} L`}
                          color="primary"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <FuelStatCard
                          icon={MoneyIcon}
                          title="Total Cost"
                          value={formatCurrency(fuelStats.totalCost)}
                          color="success"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <FuelStatCard
                          icon={TrendingUpIcon}
                          title="Avg. Price/L"
                          value={formatCurrency(fuelStats.avgPricePerLiter)}
                          color="warning"
                          subtitle={fuelStats.maxPrice > 0 && fuelStats.minPrice < fuelStats.maxPrice 
                            ? `Range: ${formatCurrency(fuelStats.minPrice)} - ${formatCurrency(fuelStats.maxPrice)}`
                            : undefined}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <FuelStatCard
                          icon={ReceiptIcon}
                          title="Total Entries"
                          value={fuelStats.entriesCount}
                          color="info"
                        />
                      </Grid>
                    </Grid>

                    {/* Fuel Entries Table */}
                    <Typography variant="subtitle2" fontWeight="600" sx={{ fontSize: { xs: '0.75rem', sm: '0.85rem' }, mb: 1 }}>
                      Fuel Entries
                    </Typography>
                    <FuelEntriesTable 
                      fuelData={fuelData}
                      fuelLoading={fuelLoading}
                      onAddFuelEntry={handleAddFuelEntry}
                    />
                  </Box>
                )}

                {activeTab === 2 && (
                  <IncidentsTab tripId={tripId} trip={trip} />
                )}

                {activeTab === 3 && (
                  <DocumentsTab trip={trip} />
                )}
              </Box>
            </Box>
          ) : renderEmpty()}
        </DialogContent>
        
        {/* Dialog Actions - matching Dashboard button style */}
        <DialogActions sx={{ 
          px: 2, 
          py: 1.5, 
          bgcolor: '#FFFFFF', 
          borderTop: 1, 
          borderColor: 'divider',
          flexWrap: 'wrap',
          gap: 1,
        }}>
          <Button
            startIcon={loading ? <CircularProgress size={14} /> : <RefreshIcon sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' } }} />}
            onClick={handleRefresh}
            disabled={loading || updating}
            variant="outlined"
            size="small"
            sx={{
              borderRadius: '10px',
              fontSize: { xs: '0.7rem', sm: '0.75rem' },
              textTransform: 'none',
            }}
          >
            Refresh
          </Button>
          
          <Box flex={1} />
          
          <Button 
            onClick={handleClose}
            disabled={updating}
            variant="outlined"
            size="small"
            sx={{
              borderRadius: '10px',
              fontSize: { xs: '0.7rem', sm: '0.75rem' },
              textTransform: 'none',
              color: '#6B7280',
            }}
          >
            Close
          </Button>
          
          {activeTab === 0 && hasChanges && (
            <Button
              variant="contained"
              startIcon={updating ? <CircularProgress size={14} color="inherit" /> : <SaveIcon sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' } }} />}
              onClick={handleUpdateTrip}
              disabled={!hasChanges || updating || loading}
              size="small"
              sx={{
                borderRadius: '10px',
                fontSize: { xs: '0.7rem', sm: '0.75rem' },
                textTransform: 'none',
                background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #4338CA 0%, #4F46E5 100%)',
                },
              }}
            >
              {updating ? 'Saving...' : 'Save Changes'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default TripDetails;
