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
  Add as AddIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { tripService } from '../services/tripService';

// Import your complete status configuration
import { STATUS_CONFIG, STATUS_OPTIONS } from './TripList';

// Currency formatter for South African Rand
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

// Format number with South African conventions
const formatNumber = (num, decimals = 0) => {
  if (num === null || num === undefined || isNaN(num)) return '0';
  const number = typeof num === 'string' ? parseFloat(num) : num;
  return new Intl.NumberFormat('en-ZA', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(number);
};

// Status Chip component
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
        border: `1px solid ${config.color}20`,
        '& .MuiChip-icon': { fontSize: '1rem' }
      }}
      icon={<span>{config.icon}</span>}
    />
  );
};

const TripDetails = ({ open = false, tripId, onClose, onUpdate }) => {
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

  // Fetch trip details and fuel data
  const fetchTripData = useCallback(async () => {
    if (!tripId) return;
    
    setLoading(true);
    setFuelLoading(true);
    setError(null);
    setFuelError(null);
    
    try {
      // Fetch trip details
      const tripData = await tripService.getTripById(tripId);
      setTrip(tripData);
      setNewStatus(tripData.status || '');
      
      if (tripData.actualStartDate) {
        const startDate = dayjs(tripData.actualStartDate);
        setActualStartDate(startDate);
        setActualStartTime(startDate);
      } else {
        setActualStartDate(null);
        setActualStartTime(null);
      }
      
      if (tripData.actualEndDate) {
        const endDate = dayjs(tripData.actualEndDate);
        setActualEndDate(endDate);
        setActualEndTime(endDate);
      } else {
        setActualEndDate(null);
        setActualEndTime(null);
      }
      
      // Fetch fuel data in parallel
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

  // Calculate fuel statistics
  const fuelStats = useMemo(() => {
    if (!fuelData || !fuelData.fuelEntries || fuelData.fuelEntries.length === 0) {
      return {
        totalLiters: 0,
        totalCost: 0,
        avgPricePerLiter: 0,
        maxPrice: 0,
        minPrice: Infinity,
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

  // Calculate trip efficiency
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

  // Fetch trip data when modal opens
  useEffect(() => {
    if (open && tripId) {
      fetchTripData();
    }
  }, [open, tripId, fetchTripData]);

  // Reset state when dialog closes
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

  const handleUpdateTrip = async () => {
    if (!trip || !tripId) return;
    
    setUpdating(true);
    setError(null);
    
    try {
      // Combine date and time for actual start
      let actualStartDateTime = null;
      if (actualStartDate && actualStartTime) {
        actualStartDateTime = dayjs(actualStartDate)
          .set('hour', actualStartTime.hour())
          .set('minute', actualStartTime.minute())
          .set('second', 0);
      } else if (actualStartDate) {
        actualStartDateTime = dayjs(actualStartDate).startOf('day');
      }

      // Combine date and time for actual end
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

  const hasChanges = useMemo(() => {
    if (!trip) return false;
    
    // Check status change
    if (trip.status !== newStatus) return true;
    
    // Helper function to compare date times
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
    
    // Check actual start changes
    if (compareDateTimes(trip.actualStartDate, actualStartDate, actualStartTime)) {
      return true;
    }
    
    // Check actual end changes
    if (compareDateTimes(trip.actualEndDate, actualEndDate, actualEndTime)) {
      return true;
    }
    
    return false;
  }, [trip, newStatus, actualStartDate, actualStartTime, actualEndDate, actualEndTime]);

  const handleClose = () => {
    if (onClose) onClose();
  };

  const handleRefresh = () => {
    fetchTripData();
  };

  const handleAddFuelEntry = () => {
    // Navigate to fuel entry form for this trip
    console.log('Navigate to fuel entry form for trip:', tripId);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Fuel Entries Table Component
  const FuelEntriesTable = () => {
    if (fuelLoading) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
          <CircularProgress />
        </Box>
      );
    }

    if (!fuelData?.fuelEntries || fuelData.fuelEntries.length === 0) {
      return (
        <Box textAlign="center" py={4}>
          <FuelIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
          <Typography variant="body1" color="text.secondary" gutterBottom>
            No fuel entries recorded for this trip
          </Typography>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleAddFuelEntry}
            sx={{ mt: 2 }}
          >
            Add Fuel Entry
          </Button>
        </Box>
      );
    }

    return (
      <Box>
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead sx={{ bgcolor: '#f5f5f5' }}>
              <TableRow>
                <TableCell><strong>Date & Time</strong></TableCell>
                <TableCell><strong>Fuel Station</strong></TableCell>
                <TableCell align="right"><strong>Liters</strong></TableCell>
                <TableCell align="right"><strong>Price/L (ZAR)</strong></TableCell>
                <TableCell align="right"><strong>Total (ZAR)</strong></TableCell>
                <TableCell align="right"><strong>Odometer</strong></TableCell>
                <TableCell align="right"><strong>Receipt #</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {fuelData.fuelEntries.map((entry, index) => (
                <TableRow key={index} hover>
                  <TableCell>
                    {dayjs(entry.date).format('DD MMM YYYY')}
                    <Typography variant="caption" display="block" color="text.secondary">
                      {dayjs(entry.date).format('HH:mm')}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {entry.station || 'N/A'}
                    {entry.stationLocation && (
                      <Typography variant="caption" display="block" color="text.secondary">
                        {entry.stationLocation}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Typography fontWeight="medium">
                      {formatNumber(entry.liters, 1)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography fontWeight="medium" color="primary">
                      {formatCurrency(entry.pricePerLiter || 0)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography fontWeight="bold">
                      {formatCurrency((entry.liters || 0) * (entry.pricePerLiter || 0))}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    {entry.odometer ? formatNumber(entry.odometer) : 'N/A'}
                  </TableCell>
                  <TableCell align="right">
                    {entry.receiptNumber || 'N/A'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    );
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { maxHeight: '90vh', borderRadius: 2 }
        }}
      >
        <DialogTitle sx={{ pb: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="h5" component="div" fontWeight="bold">
                Trip Details
              </Typography>
              <Typography variant="subtitle1" color="primary" fontWeight="medium">
                {trip ? `#${trip.tripNumber}` : 'Loading...'}
              </Typography>
            </Box>
            {trip && (
              <Stack direction="row" spacing={1} alignItems="center">
                <StatusChip status={trip.status} />
                <Tooltip title="Edit Trip">
                  <IconButton size="small" color="primary">
                    <EditIcon />
                  </IconButton>
                </Tooltip>
              </Stack>
            )}
          </Stack>
        </DialogTitle>
        
        <DialogContent dividers sx={{ p: 0 }}>
          {error && (
            <Alert 
              severity="error" 
              sx={{ mx: 3, mt: 2 }}
              onClose={() => setError(null)}
            >
              {error}
            </Alert>
          )}
          
          {loading && !trip ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}>
              <CircularProgress />
            </Box>
          ) : trip ? (
            <Box>
              {/* Tabs Navigation */}
              <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}>
                <Tabs value={activeTab} onChange={handleTabChange} aria-label="trip details tabs">
                  <Tab label="Overview" />
                  <Tab 
                    label={
                      <Box display="flex" alignItems="center">
                        Fuel Consumption
                        {fuelStats.entriesCount > 0 && (
                          <Chip 
                            label={fuelStats.entriesCount} 
                            size="small" 
                            sx={{ ml: 1, height: 20 }}
                          />
                        )}
                      </Box>
                    } 
                  />
                  <Tab label="Documents & Notes" />
                </Tabs>
              </Box>

              {/* Tab Content */}
              <Box sx={{ p: 3 }}>
                {activeTab === 0 && (
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={8}>
                      {/* Trip Information Card */}
                      <Card variant="outlined" sx={{ mb: 3 }}>
                        <CardHeader 
                          title="Trip Information"
                          titleTypographyProps={{ variant: 'subtitle1', fontWeight: 600 }}
                        />
                        <CardContent>
                          <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                              <Box display="flex" alignItems="center" mb={1}>
                                <LocationIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                                <Typography variant="subtitle2" color="text.secondary">
                                  Origin
                                </Typography>
                              </Box>
                              <Typography variant="body1" fontWeight="medium">
                                {trip.originLocation || '-'}
                              </Typography>
                              {trip.originCity && (
                                <Typography variant="caption" color="text.secondary">
                                  {trip.originCity}
                                </Typography>
                              )}
                            </Grid>
                            
                            <Grid item xs={12} sm={6}>
                              <Box display="flex" alignItems="center" mb={1}>
                                <LocationIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                                <Typography variant="subtitle2" color="text.secondary">
                                  Destination
                                </Typography>
                              </Box>
                              <Typography variant="body1" fontWeight="medium">
                                {trip.destinationLocation || '-'}
                              </Typography>
                              {trip.destinationCity && (
                                <Typography variant="caption" color="text.secondary">
                                  {trip.destinationCity}
                                </Typography>
                              )}
                            </Grid>
                            
                            <Grid item xs={12} sm={6}>
                              <Box display="flex" alignItems="center" mb={1}>
                                <PersonIcon fontSize="small" sx={{ mr: 1, color: 'secondary.main' }} />
                                <Typography variant="subtitle2" color="text.secondary">
                                  Driver
                                </Typography>
                              </Box>
                              <Typography variant="body1" fontWeight="medium">
                                {trip.driverName || 'Not Assigned'}
                              </Typography>
                              {trip.driverContact && (
                                <Typography variant="caption" color="text.secondary">
                                  {trip.driverContact}
                                </Typography>
                              )}
                            </Grid>
                            
                            <Grid item xs={12} sm={6}>
                              <Box display="flex" alignItems="center" mb={1}>
                                <CarIcon fontSize="small" sx={{ mr: 1, color: 'info.main' }} />
                                <Typography variant="subtitle2" color="text.secondary">
                                  Vehicle
                                </Typography>
                              </Box>
                              <Typography variant="body1" fontWeight="medium">
                                {trip.vehicleRegistration || 'Not Assigned'}
                              </Typography>
                              {trip.vehicleModel && (
                                <Typography variant="caption" color="text.secondary">
                                  {trip.vehicleModel}
                                </Typography>
                              )}
                            </Grid>
                            
                            <Grid item xs={12} sm={6}>
                              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                Planned Start
                              </Typography>
                              <Typography variant="body1" fontWeight="medium">
                                {trip.plannedStartDate 
                                  ? dayjs(trip.plannedStartDate).format('DD MMM YYYY, HH:mm')
                                  : '-'
                                }
                              </Typography>
                            </Grid>
                            
                            <Grid item xs={12} sm={6}>
                              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                Planned End
                              </Typography>
                              <Typography variant="body1" fontWeight="medium">
                                {trip.plannedEndDate 
                                  ? dayjs(trip.plannedEndDate).format('DD MMM YYYY, HH:mm')
                                  : '-'
                                }
                              </Typography>
                            </Grid>

                            {trip.totalDistance && (
                              <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                  Total Distance
                                </Typography>
                                <Typography variant="body1" fontWeight="medium" color="primary">
                                  {formatNumber(trip.totalDistance)} km
                                </Typography>
                              </Grid>
                            )}
                          </Grid>
                        </CardContent>
                      </Card>

                      {/* Update Card */}
                      <Card variant="outlined">
                        <CardHeader 
                          title="Update Trip Details"
                          titleTypographyProps={{ variant: 'subtitle1', fontWeight: 600 }}
                        />
                        <CardContent>
                          <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                              <FormControl fullWidth size="small">
                                <InputLabel>Change Status</InputLabel>
                                <Select
                                  value={newStatus}
                                  label="Change Status"
                                  onChange={(e) => setNewStatus(e.target.value)}
                                >
                                  {STATUS_OPTIONS.map(status => (
                                    <MenuItem key={status} value={status}>
                                      <Box display="flex" alignItems="center" gap={1}>
                                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: STATUS_CONFIG[status]?.color }} />
                                        {STATUS_CONFIG[status]?.label || status}
                                      </Box>
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            </Grid>
                            
                            <Grid item xs={12}>
                              <Divider sx={{ my: 2 }} />
                              <Typography variant="subtitle2" gutterBottom>
                                Actual Times
                              </Typography>
                            </Grid>
                            
                            <Grid item xs={12} md={6}>
                              <DatePicker
                                label="Actual Start Date"
                                value={actualStartDate}
                                onChange={(newValue) => {
                                  setActualStartDate(newValue);
                                  if (newValue && !actualStartTime) {
                                    setActualStartTime(dayjs(newValue));
                                  }
                                }}
                                slotProps={{ 
                                  textField: { 
                                    fullWidth: true, 
                                    size: 'small',
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
                                      disabled: !actualStartDate
                                    } 
                                  }}
                                />
                              </Box>
                            </Grid>
                            
                            <Grid item xs={12} md={6}>
                              <DatePicker
                                label="Actual End Date"
                                value={actualEndDate}
                                onChange={(newValue) => {
                                  setActualEndDate(newValue);
                                  if (newValue && !actualEndTime) {
                                    setActualEndTime(dayjs(newValue));
                                  }
                                }}
                                slotProps={{ 
                                  textField: { 
                                    fullWidth: true, 
                                    size: 'small',
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
                                      disabled: !actualEndDate
                                    } 
                                  }}
                                />
                              </Box>
                            </Grid>
                          </Grid>
                        </CardContent>
                      </Card>
                    </Grid>

                    <Grid item xs={12} md={4}>
                      {/* Summary Stats Card */}
                      <Card variant="outlined" sx={{ mb: 3 }}>
                        <CardHeader 
                          title="Quick Stats"
                          titleTypographyProps={{ variant: 'subtitle1', fontWeight: 600 }}
                        />
                        <CardContent>
                          <Stack spacing={2}>
                            <Box>
                              <Typography variant="caption" color="text.secondary">
                                Status
                              </Typography>
                              <Typography variant="body1" fontWeight="medium">
                                {STATUS_CONFIG[trip.status]?.label || trip.status}
                              </Typography>
                            </Box>
                            
                            {tripEfficiency && (
                              <>
                                <Divider />
                                <Box>
                                  <Typography variant="caption" color="text.secondary">
                                    Fuel Efficiency
                                  </Typography>
                                  <Typography variant="body1" fontWeight="medium" color="success.main">
                                    {tripEfficiency.kmPerLiter.toFixed(1)} km/L
                                  </Typography>
                                </Box>
                                
                                <Box>
                                  <Typography variant="caption" color="text.secondary">
                                    Cost per Kilometer
                                  </Typography>
                                  <Typography variant="body1" fontWeight="medium" color="primary">
                                    {formatCurrency(tripEfficiency.costPerKm)}/km
                                  </Typography>
                                </Box>
                                
                                <Box>
                                  <Typography variant="caption" color="text.secondary">
                                    Total Distance
                                  </Typography>
                                  <Typography variant="body1" fontWeight="medium">
                                    {formatNumber(tripEfficiency.totalDistance)} km
                                  </Typography>
                                </Box>
                              </>
                            )}
                            
                            {trip.cargoWeight && (
                              <Box>
                                <Typography variant="caption" color="text.secondary">
                                  Cargo Weight
                                </Typography>
                                <Typography variant="body1" fontWeight="medium">
                                  {formatNumber(trip.cargoWeight)} kg
                                </Typography>
                              </Box>
                            )}
                          </Stack>
                        </CardContent>
                      </Card>

                      {/* Cargo Details Card */}
                      <Card variant="outlined">
                        <CardHeader 
                          title="Cargo Details"
                          titleTypographyProps={{ variant: 'subtitle1', fontWeight: 600 }}
                        />
                        <CardContent>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Description:
                          </Typography>
                          <Typography variant="body2" paragraph sx={{ whiteSpace: 'pre-wrap' }}>
                            {trip.cargoDescription || 'No description provided'}
                          </Typography>
                          
                          <Divider sx={{ my: 2 }} />
                          
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Notes:
                          </Typography>
                          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                            {trip.notes || 'No notes'}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                )}

                {activeTab === 1 && (
                  <Box>
                    {fuelError && (
                      <Alert severity="warning" sx={{ mb: 2 }}>
                        {fuelError}
                      </Alert>
                    )}

                    {/* Fuel Summary Cards */}
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                      <Grid item xs={12} sm={6} md={3}>
                        <Card>
                          <CardContent sx={{ textAlign: 'center' }}>
                            <FuelIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                            <Typography variant="subtitle2" color="text.secondary">
                              Total Fuel
                            </Typography>
                            <Typography variant="h5" fontWeight="bold">
                              {formatNumber(fuelStats.totalLiters, 1)} L
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      
                      <Grid item xs={12} sm={6} md={3}>
                        <Card>
                          <CardContent sx={{ textAlign: 'center' }}>
                            <MoneyIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                            <Typography variant="subtitle2" color="text.secondary">
                              Total Cost
                            </Typography>
                            <Typography variant="h5" fontWeight="bold" color="success.main">
                              {formatCurrency(fuelStats.totalCost)}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      
                      <Grid item xs={12} sm={6} md={3}>
                        <Card>
                          <CardContent sx={{ textAlign: 'center' }}>
                            <TrendingUpIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
                            <Typography variant="subtitle2" color="text.secondary">
                              Avg. Price/L
                            </Typography>
                            <Typography variant="h5" fontWeight="bold">
                              {formatCurrency(fuelStats.avgPricePerLiter)}
                            </Typography>
                            {fuelStats.maxPrice > 0 && fuelStats.minPrice < fuelStats.maxPrice && (
                              <Typography variant="caption" color="text.secondary">
                                Range: {formatCurrency(fuelStats.minPrice)} - {formatCurrency(fuelStats.maxPrice)}
                              </Typography>
                            )}
                          </CardContent>
                        </Card>
                      </Grid>
                      
                      <Grid item xs={12} sm={6} md={3}>
                        <Card>
                          <CardContent sx={{ textAlign: 'center' }}>
                            <ReceiptIcon sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
                            <Typography variant="subtitle2" color="text.secondary">
                              Total Entries
                            </Typography>
                            <Typography variant="h5" fontWeight="bold">
                              {fuelStats.entriesCount}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    </Grid>

                    {/* Fuel Entries Table */}
                    <Typography variant="h6" gutterBottom>
                      Fuel Entries
                    </Typography>
                    <FuelEntriesTable />
                  </Box>
                )}

                {activeTab === 2 && (
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Documents & Attachments
                      </Typography>
                      <Typography color="text.secondary" paragraph>
                        Document management coming soon...
                      </Typography>
                      
                      <Divider sx={{ my: 2 }} />
                      
                      <Typography variant="h6" gutterBottom>
                        Additional Notes
                      </Typography>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                        {trip.additionalNotes || 'No additional notes'}
                      </Typography>
                    </CardContent>
                  </Card>
                )}
              </Box>
            </Box>
          ) : !loading && !trip ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}>
              <Typography color="text.secondary">No trip data available</Typography>
            </Box>
          ) : null}
        </DialogContent>
        
        <DialogActions sx={{ px: 3, py: 2, bgcolor: '#f8fafc' }}>
          <Button
            startIcon={loading ? <CircularProgress size={16} /> : <RefreshIcon />}
            onClick={handleRefresh}
            disabled={loading || updating}
            variant="outlined"
          >
            Refresh
          </Button>
          
          <Box flex={1} />
          
          <Button 
            onClick={handleClose}
            disabled={updating}
            variant="outlined"
          >
            Close
          </Button>
          
          {activeTab === 0 && hasChanges && (
            <Button
              variant="contained"
              startIcon={updating ? <CircularProgress size={16} /> : <SaveIcon />}
              onClick={handleUpdateTrip}
              disabled={!hasChanges || updating || loading}
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
