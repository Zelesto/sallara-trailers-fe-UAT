// src/pages/TripDetails.jsx - Fixed with proper error handling
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Box, Grid, Card, CardContent, CardHeader,
  Typography, Divider, Chip, Button,
  Select, MenuItem, FormControl, InputLabel,
  TextField, CircularProgress, Alert,
  Tab, Tabs, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  IconButton, Tooltip, Stack, LinearProgress
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
  Info as InfoIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';

import { tripService } from '../services/tripService';
import IncidentDialog from './IncidentDialog';
import { STATUS_CONFIG, STATUS_OPTIONS } from '../constants/tripConstants';

/* ============================================================
   UTILITY FUNCTIONS
   ============================================================ */

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

/* ============================================================
   COMPONENT: StatusChip
   ============================================================ */

const StatusChip = ({ status }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.DRAFT;
  
  return (
    <Chip
      label={config.label}
      size="small"
      sx={{
        backgroundColor: config.bgColor,
        color: config.color,
        fontWeight: 600,
        fontSize: '0.7rem',
        height: 22,
        border: `1px solid ${config.color}20`,
        '& .MuiChip-label': { px: 1, py: 0.25 },
        '& .MuiChip-icon': { fontSize: '0.8rem', ml: 0.5 }
      }}
      icon={<span>{config.icon}</span>}
    />
  );
};

/* ============================================================
   COMPONENT: SeverityChip
   ============================================================ */

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
        fontSize: '0.65rem',
        height: 20,
        '& .MuiChip-label': { px: 1, py: 0.25 }
      }}
    />
  );
};

/* ============================================================
   COMPONENT: IncidentStatusChip
   ============================================================ */

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
        fontSize: '0.65rem',
        height: 20,
        '& .MuiChip-label': { px: 1, py: 0.25 }
      }}
    />
  );
};

/* ============================================================
   COMPONENT: InfoItem
   ============================================================ */

const InfoItem = ({ label, value, icon: Icon, color = 'primary', isChip = false }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5 }}>
    {Icon && <Icon sx={{ fontSize: '0.9rem', color: `${color}.main` }} />}
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem', display: 'block' }}>
        {label}
      </Typography>
      {isChip ? (
        <Box sx={{ mt: 0.25 }}>{value}</Box>
      ) : (
        <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 500 }}>
          {value || 'N/A'}
        </Typography>
      )}
    </Box>
  </Box>
);

/* ============================================================
   COMPONENT: FuelStatCard
   ============================================================ */

const FuelStatCard = ({ icon: Icon, title, value, subtitle, color = 'primary' }) => (
  <Card>
    <CardContent sx={{ p: 1.5, textAlign: 'center', '&:last-child': { pb: 1.5 } }}>
      <Icon sx={{ fontSize: 28, color: `${color}.main`, mb: 0.5 }} />
      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', display: 'block' }}>
        {title}
      </Typography>
      <Typography variant="h6" fontWeight="bold" sx={{ fontSize: '0.95rem' }}>
        {value}
      </Typography>
      {subtitle && (
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
          {subtitle}
        </Typography>
      )}
    </CardContent>
  </Card>
);

/* ============================================================
   COMPONENT: IncidentsTab - FIXED with error handling
   ============================================================ */

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
      const data = await tripService.getTripIncidents(tripId);
      setIncidents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching incidents:', err);
      // ✅ FIX: Don't show error for 500, just show empty state with message
      if (err.response?.status === 500) {
        setError('Incident management is currently unavailable. Please try again later.');
      } else {
        setError('Failed to load incidents');
      }
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
        <Alert 
          severity="warning" 
          sx={{ mb: 2, fontSize: '0.8rem' }} 
          onClose={() => setError(null)}
          action={
            <Button color="inherit" size="small" onClick={fetchIncidents}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {/* Stats Row */}
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid item xs={3}>
          <Card variant="outlined">
            <CardContent sx={{ p: 1.5, textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>Total</Typography>
              <Typography variant="h6" fontWeight="bold" sx={{ fontSize: '1rem' }}>{stats.total}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={3}>
          <Card variant="outlined" sx={{ borderColor: stats.open > 0 ? '#d32f2f' : 'divider' }}>
            <CardContent sx={{ p: 1.5, textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>Open</Typography>
              <Typography variant="h6" fontWeight="bold" sx={{ fontSize: '1rem', color: stats.open > 0 ? '#d32f2f' : 'inherit' }}>
                {stats.open}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={3}>
          <Card variant="outlined" sx={{ borderColor: stats.critical > 0 ? '#b71c1c' : 'divider' }}>
            <CardContent sx={{ p: 1.5, textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>Critical</Typography>
              <Typography variant="h6" fontWeight="bold" sx={{ fontSize: '1rem', color: stats.critical > 0 ? '#b71c1c' : 'inherit' }}>
                {stats.critical}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={3}>
          <Card variant="outlined">
            <CardContent sx={{ p: 1.5, textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>Resolved</Typography>
              <Typography variant="h6" fontWeight="bold" sx={{ fontSize: '1rem', color: stats.resolved > 0 ? '#2e7d32' : 'inherit' }}>
                {stats.resolved}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Actions */}
      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
        <Button
          variant="contained"
          size="small"
          startIcon={<AddIcon sx={{ fontSize: '0.9rem' }} />}
          onClick={() => { 
            setEditingIncident(null);
            setEditingIncidentData(null);
            setIncidentDialogOpen(true); 
          }}
          sx={{ fontSize: '0.75rem' }}
        >
          Report Incident
        </Button>
        
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <Select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            displayEmpty
            sx={{ fontSize: '0.75rem' }}
          >
            <MenuItem value="ALL" sx={{ fontSize: '0.75rem' }}>All</MenuItem>
            <MenuItem value="OPEN" sx={{ fontSize: '0.75rem' }}>Open</MenuItem>
            <MenuItem value="IN_PROGRESS" sx={{ fontSize: '0.75rem' }}>In Progress</MenuItem>
            <MenuItem value="RESOLVED" sx={{ fontSize: '0.75rem' }}>Resolved</MenuItem>
          </Select>
        </FormControl>
        
        <Button
          size="small"
          startIcon={<RefreshIcon sx={{ fontSize: '0.9rem' }} />}
          onClick={fetchIncidents}
          sx={{ fontSize: '0.75rem' }}
        >
          Refresh
        </Button>
      </Stack>

      {/* Incidents Table */}
      {filteredIncidents.length === 0 && !error ? (
        <Box textAlign="center" py={3}>
          <IncidentIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
            No incidents reported
          </Typography>
          <Button
            variant="outlined"
            size="small"
            startIcon={<AddIcon sx={{ fontSize: '0.9rem' }} />}
            onClick={() => { 
              setEditingIncident(null);
              setEditingIncidentData(null);
              setIncidentDialogOpen(true); 
            }}
            sx={{ mt: 1, fontSize: '0.75rem' }}
          >
            Report First Incident
          </Button>
        </Box>
      ) : filteredIncidents.length > 0 ? (
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1 }}>
          <Table size="small">
            <TableHead sx={{ bgcolor: '#f5f5f5' }}>
              <TableRow>
                <TableCell sx={{ fontSize: '0.7rem', fontWeight: 600, py: 1 }}>Type</TableCell>
                <TableCell sx={{ fontSize: '0.7rem', fontWeight: 600, py: 1 }}>Severity</TableCell>
                <TableCell sx={{ fontSize: '0.7rem', fontWeight: 600, py: 1 }}>Description</TableCell>
                <TableCell sx={{ fontSize: '0.7rem', fontWeight: 600, py: 1 }}>Status</TableCell>
                <TableCell sx={{ fontSize: '0.7rem', fontWeight: 600, py: 1 }}>Reported</TableCell>
                <TableCell sx={{ fontSize: '0.7rem', fontWeight: 600, py: 1 }} align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredIncidents.map((incident) => (
                <TableRow key={incident.id} hover>
                  <TableCell sx={{ fontSize: '0.75rem', py: 0.75 }}>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <IncidentIcon sx={{ fontSize: '0.8rem', color: 'error.main' }} />
                      <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                        {incident.incidentType}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', py: 0.75 }}>
                    <SeverityChip severity={incident.severity} />
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', py: 0.75 }}>
                    <Tooltip title={incident.description}>
                      <Typography variant="body2" sx={{ fontSize: '0.75rem', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {incident.description}
                      </Typography>
                    </Tooltip>
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', py: 0.75 }}>
                    <IncidentStatusChip status={incident.status} />
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', py: 0.75 }}>
                    <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>
                      {formatDate(incident.reportedAt)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.6rem' }}>
                      {formatTime(incident.reportedAt)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center" sx={{ py: 0.75 }}>
                    <Stack direction="row" spacing={0.5} justifyContent="center">
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => handleEdit(incident)} sx={{ p: 0.5 }}>
                          <EditIcon sx={{ fontSize: '0.8rem' }} />
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
      ) : null}

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

/* ============================================================
   COMPONENT: FuelEntriesTable
   ============================================================ */

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
        <FuelIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
        <Typography variant="body2" color="text.secondary" gutterBottom sx={{ fontSize: '0.8rem' }}>
          No fuel entries recorded
        </Typography>
        <Button
          variant="outlined"
          size="small"
          startIcon={<AddIcon sx={{ fontSize: '0.9rem' }} />}
          onClick={onAddFuelEntry}
          sx={{ mt: 1, fontSize: '0.75rem' }}
        >
          Add Fuel Entry
        </Button>
      </Box>
    );
  }

  return (
    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1 }}>
      <Table size="small">
        <TableHead sx={{ bgcolor: '#f5f5f5' }}>
          <TableRow>
            <TableCell sx={{ fontSize: '0.7rem', fontWeight: 600, py: 1 }}>Date & Time</TableCell>
            <TableCell sx={{ fontSize: '0.7rem', fontWeight: 600, py: 1 }}>Fuel Station</TableCell>
            <TableCell align="right" sx={{ fontSize: '0.7rem', fontWeight: 600, py: 1 }}>Liters</TableCell>
            <TableCell align="right" sx={{ fontSize: '0.7rem', fontWeight: 600, py: 1 }}>Price/L</TableCell>
            <TableCell align="right" sx={{ fontSize: '0.7rem', fontWeight: 600, py: 1 }}>Total</TableCell>
            <TableCell align="right" sx={{ fontSize: '0.7rem', fontWeight: 600, py: 1 }}>Odometer</TableCell>
            <TableCell align="right" sx={{ fontSize: '0.7rem', fontWeight: 600, py: 1 }}>Receipt #</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {fuelData.fuelEntries.map((entry, index) => (
            <TableRow key={index} hover>
              <TableCell sx={{ fontSize: '0.7rem', py: 0.75 }}>
                {formatDate(entry.date)}
                <Typography variant="caption" display="block" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
                  {formatTime(entry.date)}
                </Typography>
              </TableCell>
              <TableCell sx={{ fontSize: '0.7rem', py: 0.75 }}>
                {entry.station || 'N/A'}
                {entry.stationLocation && (
                  <Typography variant="caption" display="block" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
                    {entry.stationLocation}
                  </Typography>
                )}
              </TableCell>
              <TableCell align="right" sx={{ fontSize: '0.7rem', py: 0.75 }}>
                <Typography fontWeight="medium" sx={{ fontSize: '0.7rem' }}>
                  {formatNumber(entry.liters, 1)}
                </Typography>
              </TableCell>
              <TableCell align="right" sx={{ fontSize: '0.7rem', py: 0.75 }}>
                <Typography fontWeight="medium" color="primary" sx={{ fontSize: '0.7rem' }}>
                  {formatCurrency(entry.pricePerLiter || 0)}
                </Typography>
              </TableCell>
              <TableCell align="right" sx={{ fontSize: '0.7rem', py: 0.75 }}>
                <Typography fontWeight="bold" sx={{ fontSize: '0.7rem' }}>
                  {formatCurrency((entry.liters || 0) * (entry.pricePerLiter || 0))}
                </Typography>
              </TableCell>
              <TableCell align="right" sx={{ fontSize: '0.7rem', py: 0.75 }}>
                {entry.odometer ? formatNumber(entry.odometer) : 'N/A'}
              </TableCell>
              <TableCell align="right" sx={{ fontSize: '0.7rem', py: 0.75 }}>
                {entry.receiptNumber || 'N/A'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

/* ============================================================
   COMPONENT: TripInformationCard
   ============================================================ */

const TripInformationCard = ({ trip }) => (
  <Card variant="outlined" sx={{ mb: 2 }}>
    <CardHeader 
      title="Trip Information"
      titleTypographyProps={{ variant: 'subtitle2', fontWeight: 600, fontSize: '0.8rem' }}
      sx={{ py: 1, px: 2 }}
    />
    <CardContent sx={{ p: 2, pt: 0 }}>
      <Grid container spacing={1.5}>
        <Grid item xs={12}>
          <Box display="flex" alignItems="center" mb={0.5}>
            <BusinessIcon fontSize="small" sx={{ mr: 0.75, color: 'primary.main', fontSize: '0.9rem' }} />
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
              Customer
            </Typography>
          </Box>
          <Typography variant="body2" fontWeight="500" sx={{ fontSize: '0.8rem' }}>
            {trip.customerName || 'No Customer Assigned'}
          </Typography>
          {trip.customerCode && (
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
              Code: {trip.customerCode}
            </Typography>
          )}
        </Grid>

        <Grid item xs={12} sm={6}>
          <Box display="flex" alignItems="center" mb={0.5}>
            <LocationIcon fontSize="small" sx={{ mr: 0.75, color: 'primary.main', fontSize: '0.9rem' }} />
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
              Origin
            </Typography>
          </Box>
          <Typography variant="body2" fontWeight="500" sx={{ fontSize: '0.8rem' }}>
            {trip.originLocation || '-'}
          </Typography>
          {trip.originCity && (
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
              {trip.originCity}
            </Typography>
          )}
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <Box display="flex" alignItems="center" mb={0.5}>
            <LocationIcon fontSize="small" sx={{ mr: 0.75, color: 'primary.main', fontSize: '0.9rem' }} />
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
              Destination
            </Typography>
          </Box>
          <Typography variant="body2" fontWeight="500" sx={{ fontSize: '0.8rem' }}>
            {trip.destinationLocation || '-'}
          </Typography>
          {trip.destinationCity && (
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
              {trip.destinationCity}
            </Typography>
          )}
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <Box display="flex" alignItems="center" mb={0.5}>
            <PersonIcon fontSize="small" sx={{ mr: 0.75, color: 'secondary.main', fontSize: '0.9rem' }} />
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
              Driver
            </Typography>
          </Box>
          <Typography variant="body2" fontWeight="500" sx={{ fontSize: '0.8rem' }}>
            {trip.driverName || 'Not Assigned'}
          </Typography>
          {trip.driverContact && (
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
              {trip.driverContact}
            </Typography>
          )}
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <Box display="flex" alignItems="center" mb={0.5}>
            <CarIcon fontSize="small" sx={{ mr: 0.75, color: 'info.main', fontSize: '0.9rem' }} />
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
              Vehicle
            </Typography>
          </Box>
          <Typography variant="body2" fontWeight="500" sx={{ fontSize: '0.8rem' }}>
            {trip.vehicleRegistration || 'Not Assigned'}
          </Typography>
          {trip.vehicleModel && (
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
              {trip.vehicleModel}
            </Typography>
          )}
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }} gutterBottom>
            Planned Start
          </Typography>
          <Typography variant="body2" fontWeight="500" sx={{ fontSize: '0.8rem' }}>
            {formatDateTime(trip.plannedStartDate)}
          </Typography>
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }} gutterBottom>
            Planned End
          </Typography>
          <Typography variant="body2" fontWeight="500" sx={{ fontSize: '0.8rem' }}>
            {formatDateTime(trip.plannedEndDate)}
          </Typography>
        </Grid>

        {trip.totalDistance && (
          <Grid item xs={12} sm={6}>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }} gutterBottom>
              Total Distance
            </Typography>
            <Typography variant="body2" fontWeight="500" color="primary" sx={{ fontSize: '0.8rem' }}>
              {formatNumber(trip.totalDistance)} km
            </Typography>
          </Grid>
        )}
      </Grid>
    </CardContent>
  </Card>
);

/* ============================================================
   COMPONENT: UpdateTripCard
   ============================================================ */

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
  <Card variant="outlined">
    <CardHeader 
      title="Update Trip Details"
      titleTypographyProps={{ variant: 'subtitle2', fontWeight: 600, fontSize: '0.8rem' }}
      sx={{ py: 1, px: 2 }}
    />
    <CardContent sx={{ p: 2, pt: 0 }}>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth size="small">
            <InputLabel sx={{ fontSize: '0.75rem' }}>Change Status</InputLabel>
            <Select
              value={newStatus}
              label="Change Status"
              onChange={(e) => setNewStatus(e.target.value)}
              sx={{ fontSize: '0.75rem' }}
            >
              {STATUS_OPTIONS.map(status => (
                <MenuItem key={status} value={status} sx={{ fontSize: '0.75rem' }}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: STATUS_CONFIG[status]?.color }} />
                    {STATUS_CONFIG[status]?.label || status}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12}>
          <Divider sx={{ my: 1.5 }} />
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }} gutterBottom>
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
                sx: { '& .MuiInputLabel-root': { fontSize: '0.75rem' } }
              } 
            }}
          />
          <Box mt={0.75}>
            <TimePicker
              label="Actual Start Time"
              value={actualStartTime}
              onChange={setActualStartTime}
              slotProps={{ 
                textField: { 
                  fullWidth: true, 
                  size: 'small',
                  disabled: !actualStartDate,
                  sx: { '& .MuiInputLabel-root': { fontSize: '0.75rem' } }
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
                sx: { '& .MuiInputLabel-root': { fontSize: '0.75rem' } }
              } 
            }}
          />
          <Box mt={0.75}>
            <TimePicker
              label="Actual End Time"
              value={actualEndTime}
              onChange={setActualEndTime}
              slotProps={{ 
                textField: { 
                  fullWidth: true, 
                  size: 'small',
                  disabled: !actualEndDate,
                  sx: { '& .MuiInputLabel-root': { fontSize: '0.75rem' } }
                } 
              }}
            />
          </Box>
        </Grid>
      </Grid>
    </CardContent>
  </Card>
);

/* ============================================================
   COMPONENT: QuickStatsCard
   ============================================================ */

const QuickStatsCard = ({ trip, tripEfficiency }) => (
  <Card variant="outlined" sx={{ mb: 2 }}>
    <CardHeader 
      title="Quick Stats"
      titleTypographyProps={{ variant: 'subtitle2', fontWeight: 600, fontSize: '0.8rem' }}
      sx={{ py: 1, px: 2 }}
    />
    <CardContent sx={{ p: 2, pt: 0 }}>
      <Stack spacing={1.5}>
        <InfoItem 
          label="Customer" 
          value={trip.customerName || 'No Customer'} 
          icon={BusinessIcon} 
          color="primary"
        />
        
        <Divider />
        
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
            Status
          </Typography>
          <Typography variant="body2" fontWeight="500" sx={{ fontSize: '0.8rem' }}>
            {STATUS_CONFIG[trip.status]?.label || trip.status}
          </Typography>
        </Box>
        
        {tripEfficiency && (
          <>
            <Divider />
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                Fuel Efficiency
              </Typography>
              <Typography variant="body2" fontWeight="500" color="success.main" sx={{ fontSize: '0.8rem' }}>
                {tripEfficiency.kmPerLiter.toFixed(1)} km/L
              </Typography>
            </Box>
            
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                Cost per Kilometer
              </Typography>
              <Typography variant="body2" fontWeight="500" color="primary" sx={{ fontSize: '0.8rem' }}>
                {formatCurrency(tripEfficiency.costPerKm)}/km
              </Typography>
            </Box>
            
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                Total Distance
              </Typography>
              <Typography variant="body2" fontWeight="500" sx={{ fontSize: '0.8rem' }}>
                {formatNumber(tripEfficiency.totalDistance)} km
              </Typography>
            </Box>
          </>
        )}
        
        {trip.cargoWeight && (
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
              Cargo Weight
            </Typography>
            <Typography variant="body2" fontWeight="500" sx={{ fontSize: '0.8rem' }}>
              {formatNumber(trip.cargoWeight)} kg
            </Typography>
          </Box>
        )}
      </Stack>
    </CardContent>
  </Card>
);

/* ============================================================
   COMPONENT: CargoDetailsCard
   ============================================================ */

const CargoDetailsCard = ({ trip }) => (
  <Card variant="outlined">
    <CardHeader 
      title="Cargo Details"
      titleTypographyProps={{ variant: 'subtitle2', fontWeight: 600, fontSize: '0.8rem' }}
      sx={{ py: 1, px: 2 }}
    />
    <CardContent sx={{ p: 2, pt: 0 }}>
      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }} gutterBottom>
        Description:
      </Typography>
      <Typography variant="body2" sx={{ fontSize: '0.75rem', whiteSpace: 'pre-wrap', mb: 1.5 }}>
        {trip.cargoDescription || 'No description provided'}
      </Typography>
      
      <Divider sx={{ my: 1.5 }} />
      
      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }} gutterBottom>
        Notes:
      </Typography>
      <Typography variant="body2" sx={{ fontSize: '0.75rem', whiteSpace: 'pre-wrap' }}>
        {trip.notes || 'No notes'}
      </Typography>
    </CardContent>
  </Card>
);

/* ============================================================
   COMPONENT: DocumentsTab
   ============================================================ */

const DocumentsTab = ({ trip }) => (
  <Card variant="outlined">
    <CardContent sx={{ p: 2 }}>
      <Typography variant="subtitle2" fontWeight="600" sx={{ fontSize: '0.8rem' }} gutterBottom>
        Documents & Attachments
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', mb: 2 }}>
        Document management coming soon...
      </Typography>
      
      <Divider sx={{ my: 1.5 }} />
      
      <Typography variant="subtitle2" fontWeight="600" sx={{ fontSize: '0.8rem' }} gutterBottom>
        Additional Notes
      </Typography>
      <Typography variant="body2" sx={{ fontSize: '0.75rem', whiteSpace: 'pre-wrap' }}>
        {trip.additionalNotes || 'No additional notes'}
      </Typography>
    </CardContent>
  </Card>
);

/* ============================================================
   MAIN COMPONENT: TripDetails
   ============================================================ */

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
      sx={{ mx: 2, mt: 2, fontSize: '0.8rem' }}
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
        PaperProps={{ sx: { maxHeight: '90vh', borderRadius: 1.5 } }}
      >
        {/* Dialog Title */}
        <DialogTitle sx={{ py: 1.5, px: 2.5, borderBottom: 1, borderColor: 'divider' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="h6" component="div" fontWeight="600" sx={{ fontSize: '1rem' }}>
                Trip Details
              </Typography>
              <Typography variant="caption" color="primary" fontWeight="500" sx={{ fontSize: '0.75rem' }}>
                {trip ? `#${trip.tripNumber}` : 'Loading...'}
              </Typography>
            </Box>
            {trip && (
              <Stack direction="row" spacing={0.75} alignItems="center">
                <StatusChip status={trip.status} />
                <Tooltip title="Edit Trip">
                  <IconButton size="small" color="primary" sx={{ p: 0.5 }}>
                    <EditIcon sx={{ fontSize: '0.9rem' }} />
                  </IconButton>
                </Tooltip>
              </Stack>
            )}
          </Stack>
        </DialogTitle>
        
        {/* Dialog Content */}
        <DialogContent dividers sx={{ p: 0 }}>
          {renderError()}
          
          {loading && !trip ? renderLoading() : trip ? (
            <Box>
              {/* Tabs */}
              <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
                <Tabs 
                  value={activeTab} 
                  onChange={handleTabChange}
                  sx={{
                    '& .MuiTab-root': {
                      fontSize: '0.75rem',
                      minHeight: 40,
                      textTransform: 'none',
                    }
                  }}
                >
                  <Tab label="Overview" />
                  <Tab 
                    label={
                      <Box display="flex" alignItems="center" sx={{ fontSize: '0.75rem' }}>
                        <FuelIcon sx={{ fontSize: '0.9rem', mr: 0.5 }} />
                        Fuel
                        {fuelStats.entriesCount > 0 && (
                          <Chip 
                            label={fuelStats.entriesCount} 
                            size="small" 
                            sx={{ ml: 0.75, height: 18, fontSize: '0.6rem' }}
                          />
                        )}
                      </Box>
                    } 
                  />
                  <Tab 
                    label={
                      <Box display="flex" alignItems="center" sx={{ fontSize: '0.75rem' }}>
                        <IncidentIcon sx={{ fontSize: '0.9rem', mr: 0.5 }} />
                        Incidents
                        <Chip 
                          label={trip.incidentsCount || 0} 
                          size="small" 
                          color={trip.incidentsCount > 0 ? 'error' : 'default'}
                          sx={{ ml: 0.75, height: 18, fontSize: '0.6rem' }}
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
                      <Alert severity="warning" sx={{ mb: 2, fontSize: '0.8rem' }}>
                        {fuelError}
                      </Alert>
                    )}

                    {/* Fuel Summary Cards */}
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
                    <Typography variant="subtitle2" fontWeight="600" sx={{ fontSize: '0.8rem', mb: 1 }}>
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
        
        {/* Dialog Actions */}
        <DialogActions sx={{ px: 2, py: 1.5, bgcolor: '#f8fafc', borderTop: 1, borderColor: 'divider' }}>
          <Button
            startIcon={loading ? <CircularProgress size={14} /> : <RefreshIcon sx={{ fontSize: '0.9rem' }} />}
            onClick={handleRefresh}
            disabled={loading || updating}
            variant="outlined"
            size="small"
            sx={{ fontSize: '0.75rem' }}
          >
            Refresh
          </Button>
          
          <Box flex={1} />
          
          <Button 
            onClick={handleClose}
            disabled={updating}
            variant="outlined"
            size="small"
            sx={{ fontSize: '0.75rem' }}
          >
            Close
          </Button>
          
          {activeTab === 0 && hasChanges && (
            <Button
              variant="contained"
              startIcon={updating ? <CircularProgress size={14} /> : <SaveIcon sx={{ fontSize: '0.9rem' }} />}
              onClick={handleUpdateTrip}
              disabled={!hasChanges || updating || loading}
              size="small"
              sx={{ fontSize: '0.75rem' }}
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
