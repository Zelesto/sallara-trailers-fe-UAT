// src/components/TripReportDetail.jsx

import React, { useState, useEffect, useRef } from 'react';
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
  Divider,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Avatar,
} from '@mui/material';
import {
  Print as PrintIcon,
  PictureAsPdf as PdfIcon,
  FileCopy as CopyIcon,
  Close as CloseIcon,
  DirectionsCar,
  Person as PersonIcon,
  LocationOn,
  Schedule as ScheduleIcon,
  Speed as SpeedIcon,
  LocalGasStation as FuelIcon,
  AttachMoney as MoneyIcon,
  Route as RouteIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  CalendarToday,
  Assignment,
  Home,
  Flag,
  Business,
  Receipt,
  Description,
  Dashboard,
  Timeline,
  TrendingUp,
  TrendingDown,
  NoAccounts as NoIncidentsIcon,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import { tripService } from '../services/tripService';
import { fuelService } from '../services/fuelService';
import { loadService } from '../services/loadService';
import { incidentService } from '../services/incidentService';
import {
  TRIP_STATUSES,
  getDisplayName,
  getColor,
} from '../constants';

// ============================================================
// STATUS CHIP
// ============================================================
const StatusChip = ({ status }) => {
  const config = TRIP_STATUSES?.find(s => s.code === status);
  return (
    <Chip
      label={config?.displayName || status || 'Unknown'}
      size="small"
      sx={{
        backgroundColor: config?.color ? `${config.color}20` : '#F3F4F6',
        color: config?.color || '#6B7280',
        fontWeight: 600,
        fontSize: '0.65rem',
        height: 22,
        border: `1px solid ${config?.color || '#6B7280'}20`,
      }}
    />
  );
};

// ============================================================
// INFO ROW COMPONENT
// ============================================================
const InfoRow = ({ label, value, icon: Icon, color = 'primary', subValue = null }) => {
  const iconColor = getColor(color);
  const bgColor = `${iconColor}20`;
  
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, py: 1, borderBottom: '1px solid #F3F4F6' }}>
      {Icon && (
        <Box
          sx={{
            bgcolor: bgColor,
            borderRadius: '8px',
            p: 0.75,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            mt: 0.25,
          }}
        >
          <Icon sx={{ fontSize: '1rem', color: iconColor }} />
        </Box>
      )}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', display: 'block' }}>
          {label}
        </Typography>
        <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 500, wordBreak: 'break-word' }}>
          {value || 'N/A'}
        </Typography>
        {subValue && (
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem', display: 'block' }}>
            {subValue}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

// ============================================================
// METRIC CARD COMPONENT
// ============================================================
const MetricCard = ({ title, value, icon: Icon, color = 'primary', subtitle }) => {
  const iconColor = getColor(color);
  const bgColor = `${iconColor}20`;

  return (
    <Card sx={{ 
      height: '100%', 
      borderRadius: '12px',
      border: '1px solid #ECECEC',
      '&:hover': {
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
      }
    }}>
      <CardContent sx={{ p: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {title}
            </Typography>
            <Typography variant="h6" fontWeight="700" sx={{ fontSize: '1.1rem', mt: 0.25 }}>
              {value || 'N/A'}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              bgcolor: bgColor,
              borderRadius: '10px',
              p: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon sx={{ fontSize: '1.3rem', color: iconColor }} />
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
};

// ============================================================
// MAIN COMPONENT
// ============================================================
const TripReportDetail = ({ 
  open, 
  tripId, 
  trip: propTrip,
  onClose,
  onPrint,
}) => {
  const printRef = useRef();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [trip, setTrip] = useState(propTrip || null);
  const [fuelSlips, setFuelSlips] = useState([]);
  const [loadData, setLoadData] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [notices, setNotices] = useState([]);
  const [noticesLoading, setNoticesLoading] = useState(false);

  // Fetch all trip data
  useEffect(() => {
    if (open && tripId) {
      fetchTripData();
    }
  }, [open, tripId]);

  const fetchTripData = async () => {
    setLoading(true);
    setError(null);
    try {
      // If trip was passed as prop, use it
      let tripData = propTrip;
      
      // Otherwise fetch trip details
      if (!tripData) {
        tripData = await tripService.getTripById(tripId);
        setTrip(tripData);
      } else {
        setTrip(tripData);
      }

      // Fetch metrics
      try {
        const metricsData = await tripService.getTripMetrics(tripId);
        setMetrics(metricsData);
      } catch (e) {
        console.warn('No metrics found:', e);
        setMetrics(null);
      }

      // Fetch fuel slips
      try {
        const fuelData = await fuelService.getFuelSlips({ tripId });
        setFuelSlips(Array.isArray(fuelData) ? fuelData : []);
      } catch (e) {
        console.warn('No fuel slips found:', e);
        setFuelSlips([]);
      }

      // Fetch load data if exists
      if (tripData.loadId) {
        try {
          const load = await loadService.getLoadByNumber(tripData.loadId);
          setLoadData(load);
        } catch (e) {
          console.warn('No load data found:', e);
          setLoadData(null);
        }
      }

      // ✅ Fetch notices/incidents - with better error handling
      setNoticesLoading(true);
      try {
        const incidents = await incidentService.getTripIncidents(tripId);
        setNotices(Array.isArray(incidents) ? incidents : []);
      } catch (e) {
        console.warn('Error fetching incidents (expected if none exist):', e.message);
        setNotices([]);
      } finally {
        setNoticesLoading(false);
      }
  
    } catch (err) {
      console.error('Error fetching trip data:', err);
      setError(err.message || 'Failed to load trip report');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (onPrint) {
      onPrint(trip);
    } else {
      window.print();
    }
  };

  const handleCopyToClipboard = () => {
    if (!trip) return;
    
    const textContent = `
TRIP REPORT
============
Trip: ${trip.tripNumber}
Status: ${trip.status}
Customer: ${trip.customer?.name || trip.customerName || 'N/A'}

ROUTE
-----
Origin: ${trip.originLocation || trip.originCity || 'N/A'}
Destination: ${trip.destinationLocation || trip.destinationCity || 'N/A'}
Distance: ${trip.actualDistanceKm || trip.plannedDistanceKm || 0} km

VEHICLE
-------
Registration: ${trip.vehicle?.registrationNumber || 'N/A'}
Make/Model: ${trip.vehicle?.make || 'N/A'} ${trip.vehicle?.model || 'N/A'}

DRIVER
------
Name: ${trip.driver?.firstName || trip.driverName || 'N/A'}
License: ${trip.driver?.licenseNumber || 'N/A'}

TIMING
------
Planned Start: ${trip.plannedStartDate ? dayjs(trip.plannedStartDate).format('DD MMM YYYY HH:mm') : 'N/A'}
Planned End: ${trip.plannedEndDate ? dayjs(trip.plannedEndDate).format('DD MMM YYYY HH:mm') : 'N/A'}
Actual Start: ${trip.actualStartDate ? dayjs(trip.actualStartDate).format('DD MMM YYYY HH:mm') : 'N/A'}
Actual End: ${trip.actualEndDate ? dayjs(trip.actualEndDate).format('DD MMM YYYY HH:mm') : 'N/A'}

ODOMETER
--------
Start: ${trip.actualStartOdometer || 'N/A'} km
End: ${trip.actualEndOdometer || 'N/A'} km

FUEL
----
Total Used: ${fuelSlips.reduce((sum, f) => sum + (f.quantity || 0), 0)} L
Total Cost: R ${fuelSlips.reduce((sum, f) => sum + (f.totalAmount || 0), 0).toFixed(2)}

LOAD
----
Load Number: ${loadData?.loadNumber || trip.loadId || 'N/A'}
Description: ${loadData?.description || trip.loadDescription || 'N/A'}

NOTICES
-------
${notices.length > 0 ? notices.map(n => `- ${n.type || n.incidentType || 'Notice'}: ${n.description || n.message || 'No description'}`).join('\n') : 'No notices recorded'}
    `;
    
    navigator.clipboard.writeText(textContent);
  };

  if (loading) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
        <DialogContent sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
          <CircularProgress size={40} />
          <Typography sx={{ ml: 2, fontSize: '0.9rem' }}>Loading trip report...</Typography>
        </DialogContent>
      </Dialog>
    );
  }

  if (error || !trip) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
        <DialogContent sx={{ p: 3 }}>
          <Alert severity="error" sx={{ borderRadius: '12px' }}>
            {error || 'Trip not found'}
          </Alert>
          <Button onClick={onClose} sx={{ mt: 2, fontSize: '0.8rem' }}>
            Close
          </Button>
        </DialogContent>
      </Dialog>
    );
  }

  // Calculate metrics
  const actualDistance = trip.actualDistanceKm || metrics?.totalDistanceKm || 0;
  const plannedDistance = trip.plannedDistanceKm || 0;
  const distanceDiff = actualDistance - plannedDistance;
  const fuelTotal = fuelSlips.reduce((sum, f) => sum + (f.quantity || 0), 0);
  const fuelCost = fuelSlips.reduce((sum, f) => sum + (f.totalAmount || 0), 0);
  const efficiency = fuelTotal > 0 ? actualDistance / fuelTotal : 0;
  const totalDuration = trip.actualDurationHours || metrics?.totalDurationHours || 0;
  const isOnTime = trip.actualEndDate && trip.plannedEndDate 
    ? dayjs(trip.actualEndDate).isBefore(dayjs(trip.plannedEndDate)) 
    : null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        ref: printRef,
        sx: {
          borderRadius: '16px',
          maxHeight: '90vh',
        }
      }}
    >
      {/* Header */}
      <DialogTitle sx={{ 
        py: 2, 
        px: 3, 
        borderBottom: '1px solid #ECECEC',
        bgcolor: '#F9FAFB',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <Box>
          <Typography variant="h6" fontWeight="700" sx={{ fontSize: '1.1rem' }}>
            Trip Report
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
            {trip.tripNumber} • {dayjs(trip.createdAt).format('DD MMM YYYY')}
          </Typography>
        </Box>
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="Copy to Clipboard">
            <IconButton size="small" onClick={handleCopyToClipboard}>
              <CopyIcon sx={{ fontSize: '0.9rem' }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Print / PDF">
            <IconButton size="small" onClick={handlePrint}>
              <PrintIcon sx={{ fontSize: '0.9rem' }} />
            </IconButton>
          </Tooltip>
          <IconButton size="small" onClick={onClose}>
            <CloseIcon sx={{ fontSize: '0.9rem' }} />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ p: 3, bgcolor: '#F7F7FC' }}>
        <Box ref={printRef}>
          {/* Status Banner */}
          <Paper sx={{ p: 2, mb: 2, borderRadius: '12px', bgcolor: '#FFFFFF' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" spacing={1}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <StatusChip status={trip.status} />
                {isOnTime === true && (
                  <Chip
                    icon={<CheckCircleIcon sx={{ fontSize: '0.7rem' }} />}
                    label="On Time"
                    size="small"
                    color="success"
                    sx={{ height: 20, fontSize: '0.6rem' }}
                  />
                )}
                {isOnTime === false && (
                  <Chip
                    icon={<WarningIcon sx={{ fontSize: '0.7rem' }} />}
                    label="Delayed"
                    size="small"
                    color="error"
                    sx={{ height: 20, fontSize: '0.6rem' }}
                  />
                )}
              </Stack>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
                Updated: {dayjs(trip.updatedAt).format('DD MMM YYYY HH:mm')}
              </Typography>
            </Stack>
          </Paper>

          {/* Metrics Cards */}
          <Grid container spacing={1.5} sx={{ mb: 2 }}>
            <Grid item xs={6} sm={3}>
              <MetricCard
                title="Distance"
                value={`${actualDistance.toFixed(1)} km`}
                icon={RouteIcon}
                color="primary"
                subtitle={`Planned: ${plannedDistance.toFixed(1)} km`}
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <MetricCard
                title="Duration"
                value={`${totalDuration.toFixed(1)}h`}
                icon={ScheduleIcon}
                color="info"
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <MetricCard
                title="Fuel"
                value={`${fuelTotal.toFixed(1)} L`}
                icon={FuelIcon}
                color="warning"
                subtitle={`${fuelCost > 0 ? `R ${fuelCost.toFixed(2)}` : 'No fuel data'}`}
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <MetricCard
                title="Efficiency"
                value={`${efficiency.toFixed(1)} km/L`}
                icon={SpeedIcon}
                color="success"
              />
            </Grid>
          </Grid>

          {/* Main Content */}
          <Grid container spacing={2}>
            {/* Left Column - Trip Details */}
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 2.5, borderRadius: '12px', bgcolor: '#FFFFFF', mb: 2 }}>
                <Typography variant="subtitle2" fontWeight="600" sx={{ mb: 2, fontSize: '0.85rem' }}>
                  <Assignment sx={{ fontSize: '0.9rem', verticalAlign: 'middle', mr: 0.5 }} />
                  Trip Details
                </Typography>

                <Grid container spacing={1}>
                  <Grid item xs={12} sm={6}>
                    <InfoRow
                      label="Trip Number"
                      value={trip.tripNumber}
                      icon={Assignment}
                      color="primary"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <InfoRow
                      label="Reference Number"
                      value={trip.referenceNumber}
                      icon={Receipt}
                      color="secondary"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <InfoRow
                      label="Customer"
                      value={trip.customer?.name || trip.customerName || 'N/A'}
                      icon={Business}
                      color="info"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <InfoRow
                      label="Status"
                      value={<StatusChip status={trip.status} />}
                      icon={Flag}
                      color="warning"
                    />
                  </Grid>
                </Grid>
              </Paper>

              {/* Route Information */}
              <Paper sx={{ p: 2.5, borderRadius: '12px', bgcolor: '#FFFFFF', mb: 2 }}>
                <Typography variant="subtitle2" fontWeight="600" sx={{ mb: 2, fontSize: '0.85rem' }}>
                  <RouteIcon sx={{ fontSize: '0.9rem', verticalAlign: 'middle', mr: 0.5 }} />
                  Route Information
                </Typography>

                <Grid container spacing={1}>
                  <Grid item xs={12} sm={6}>
                    <InfoRow
                      label="Origin"
                      value={trip.originLocation || trip.originCity || 'N/A'}
                      icon={LocationOn}
                      color="info"
                      subValue={trip.originStreetAddress ? `${trip.originStreetAddress}, ${trip.originCity || ''}` : null}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <InfoRow
                      label="Destination"
                      value={trip.destinationLocation || trip.destinationCity || 'N/A'}
                      icon={LocationOn}
                      color="error"
                      subValue={trip.destinationStreetAddress ? `${trip.destinationStreetAddress}, ${trip.destinationCity || ''}` : null}
                    />
                  </Grid>
                </Grid>

                <Divider sx={{ my: 1.5 }} />

                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <InfoRow
                      label="Planned Distance"
                      value={`${plannedDistance.toFixed(1)} km`}
                      icon={RouteIcon}
                      color="primary"
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <InfoRow
                      label="Actual Distance"
                      value={`${actualDistance.toFixed(1)} km`}
                      icon={RouteIcon}
                      color="success"
                      subValue={`${distanceDiff > 0 ? '+' : ''}${distanceDiff.toFixed(1)} km difference`}
                    />
                  </Grid>
                </Grid>
              </Paper>

              {/* Driver & Vehicle */}
              <Paper sx={{ p: 2.5, borderRadius: '12px', bgcolor: '#FFFFFF', mb: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" fontWeight="600" sx={{ mb: 1.5, fontSize: '0.85rem' }}>
                      <PersonIcon sx={{ fontSize: '0.9rem', verticalAlign: 'middle', mr: 0.5 }} />
                      Driver
                    </Typography>
                    <InfoRow
                      label="Name"
                      value={trip.driver?.firstName ? `${trip.driver.firstName} ${trip.driver.lastName || ''}` : trip.driverName || 'N/A'}
                      icon={PersonIcon}
                      color="info"
                    />
                    {trip.driver?.licenseNumber && (
                      <InfoRow
                        label="License"
                        value={trip.driver.licenseNumber}
                        icon={Assignment}
                        color="secondary"
                      />
                    )}
                    {trip.driver?.contactNumber && (
                      <InfoRow
                        label="Contact"
                        value={trip.driver.contactNumber}
                        icon={Assignment}
                        color="primary"
                      />
                    )}
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" fontWeight="600" sx={{ mb: 1.5, fontSize: '0.85rem' }}>
                      <DirectionsCar sx={{ fontSize: '0.9rem', verticalAlign: 'middle', mr: 0.5 }} />
                      Vehicle
                    </Typography>
                    <InfoRow
                      label="Registration"
                      value={trip.vehicle?.registrationNumber || 'N/A'}
                      icon={DirectionsCar}
                      color="primary"
                    />
                    {trip.vehicle?.make && (
                      <InfoRow
                        label="Make/Model"
                        value={`${trip.vehicle.make} ${trip.vehicle.model || ''}`}
                        icon={DirectionsCar}
                        color="info"
                      />
                    )}
                    {trip.vehicle?.vehicleType && (
                      <InfoRow
                        label="Type"
                        value={trip.vehicle.vehicleType}
                        icon={DirectionsCar}
                        color="secondary"
                      />
                    )}
                  </Grid>
                </Grid>
              </Paper>

              {/* Odometer Readings */}
              <Paper sx={{ p: 2.5, borderRadius: '12px', bgcolor: '#FFFFFF', mb: 2 }}>
                <Typography variant="subtitle2" fontWeight="600" sx={{ mb: 2, fontSize: '0.85rem' }}>
                  <SpeedIcon sx={{ fontSize: '0.9rem', verticalAlign: 'middle', mr: 0.5 }} />
                  Odometer Readings
                </Typography>

                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <InfoRow
                      label="Start Odometer"
                      value={trip.actualStartOdometer ? `${trip.actualStartOdometer.toFixed(2)} km` : 'N/A'}
                      icon={SpeedIcon}
                      color="info"
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <InfoRow
                      label="End Odometer"
                      value={trip.actualEndOdometer ? `${trip.actualEndOdometer.toFixed(2)} km` : 'N/A'}
                      icon={SpeedIcon}
                      color="success"
                    />
                  </Grid>
                </Grid>
              </Paper>

              {/* Timing */}
              <Paper sx={{ p: 2.5, borderRadius: '12px', bgcolor: '#FFFFFF', mb: 2 }}>
                <Typography variant="subtitle2" fontWeight="600" sx={{ mb: 2, fontSize: '0.85rem' }}>
                  <CalendarToday sx={{ fontSize: '0.9rem', verticalAlign: 'middle', mr: 0.5 }} />
                  Timeline
                </Typography>

                <Grid container spacing={1}>
                  <Grid item xs={12} sm={6}>
                    <InfoRow
                      label="Planned Start"
                      value={trip.plannedStartDate ? dayjs(trip.plannedStartDate).format('DD MMM YYYY HH:mm') : 'N/A'}
                      icon={ScheduleIcon}
                      color="primary"
                    />
                    <InfoRow
                      label="Actual Start"
                      value={trip.actualStartDate ? dayjs(trip.actualStartDate).format('DD MMM YYYY HH:mm') : 'N/A'}
                      icon={CheckCircleIcon}
                      color="success"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <InfoRow
                      label="Planned End"
                      value={trip.plannedEndDate ? dayjs(trip.plannedEndDate).format('DD MMM YYYY HH:mm') : 'N/A'}
                      icon={ScheduleIcon}
                      color="primary"
                    />
                    <InfoRow
                      label="Actual End"
                      value={trip.actualEndDate ? dayjs(trip.actualEndDate).format('DD MMM YYYY HH:mm') : 'N/A'}
                      icon={CheckCircleIcon}
                      color="success"
                    />
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            {/* Right Column - Load, Fuel, Notices */}
            <Grid item xs={12} md={4}>
              {/* Load Information */}
              {loadData && (
                <Paper sx={{ p: 2.5, borderRadius: '12px', bgcolor: '#FFFFFF', mb: 2 }}>
                  <Typography variant="subtitle2" fontWeight="600" sx={{ mb: 2, fontSize: '0.85rem' }}>
                    <Assignment sx={{ fontSize: '0.9rem', verticalAlign: 'middle', mr: 0.5 }} />
                    Load Information
                  </Typography>
                  <InfoRow
                    label="Load Number"
                    value={loadData.loadNumber}
                    icon={Assignment}
                    color="primary"
                  />
                  <InfoRow
                    label="Description"
                    value={loadData.description || 'N/A'}
                    icon={Description}
                    color="secondary"
                  />
                  <InfoRow
                    label="Commodity Type"
                    value={loadData.commodityType || 'N/A'}
                    icon={Business}
                    color="info"
                  />
                  {loadData.weightKg && (
                    <InfoRow
                      label="Weight"
                      value={`${loadData.weightKg} kg`}
                      icon={Assignment}
                      color="warning"
                    />
                  )}
                  {loadData.palletCount && (
                    <InfoRow
                      label="Pallets"
                      value={loadData.palletCount}
                      icon={Assignment}
                      color="purple"
                    />
                  )}
                </Paper>
              )}

              {/* Fuel Summary */}
              <Paper sx={{ p: 2.5, borderRadius: '12px', bgcolor: '#FFFFFF', mb: 2 }}>
                <Typography variant="subtitle2" fontWeight="600" sx={{ mb: 2, fontSize: '0.85rem' }}>
                  <FuelIcon sx={{ fontSize: '0.9rem', verticalAlign: 'middle', mr: 0.5 }} />
                  Fuel Summary
                </Typography>

                {fuelSlips.length > 0 ? (
                  <>
                    <InfoRow
                      label="Total Fuel Used"
                      value={`${fuelTotal.toFixed(1)} L`}
                      icon={FuelIcon}
                      color="warning"
                    />
                    <InfoRow
                      label="Total Cost"
                      value={`R ${fuelCost.toFixed(2)}`}
                      icon={MoneyIcon}
                      color="error"
                    />
                    <InfoRow
                      label="Average Efficiency"
                      value={`${efficiency.toFixed(1)} km/L`}
                      icon={SpeedIcon}
                      color="success"
                    />
                    <Divider sx={{ my: 1.5 }} />
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem', display: 'block', mb: 1 }}>
                      Fuel Entries: {fuelSlips.length}
                    </Typography>
                    {fuelSlips.map((slip, idx) => (
                      <Box key={idx} sx={{ 
                        p: 1, 
                        bgcolor: '#F9FAFB', 
                        borderRadius: '8px', 
                        mb: 0.75,
                        fontSize: '0.65rem'
                      }}>
                        <Stack direction="row" justifyContent="space-between">
                          <Typography variant="caption" sx={{ fontSize: '0.6rem' }}>
                            {slip.quantity} L @ R {slip.unitPrice?.toFixed(2) || '0.00'}/L
                          </Typography>
                          <Typography variant="caption" sx={{ fontSize: '0.6rem', fontWeight: 600 }}>
                            R {slip.totalAmount?.toFixed(2) || '0.00'}
                          </Typography>
                        </Stack>
                        {slip.transactionDate && (
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.5rem' }}>
                            {dayjs(slip.transactionDate).format('DD MMM YYYY HH:mm')}
                          </Typography>
                        )}
                      </Box>
                    ))}
                  </>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', textAlign: 'center', py: 1 }}>
                    No fuel records found for this trip
                  </Typography>
                )}
              </Paper>

              {/* Notices / Incidents - Improved with better handling */}
              <Paper sx={{ p: 2.5, borderRadius: '12px', bgcolor: '#FFFFFF' }}>
                <Typography variant="subtitle2" fontWeight="600" sx={{ mb: 2, fontSize: '0.85rem' }}>
                  <WarningIcon sx={{ fontSize: '0.9rem', verticalAlign: 'middle', mr: 0.5 }} />
                  Notices / Incidents 
                  <Chip 
                    label={notices.length} 
                    size="small" 
                    sx={{ 
                      ml: 1, 
                      height: 18, 
                      fontSize: '0.55rem',
                      bgcolor: notices.length > 0 ? '#FEE2E2' : '#F3F4F6',
                      color: notices.length > 0 ? '#991B1B' : '#6B7280'
                    }} 
                  />
                </Typography>

                {noticesLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                    <CircularProgress size={24} />
                  </Box>
                ) : notices.length > 0 ? (
                  notices.map((notice, idx) => (
                    <Box key={idx} sx={{ 
                      p: 1.5, 
                      bgcolor: notice.severity === 'HIGH' || notice.severity === 'CRITICAL' ? '#FEF2F2' : '#FEFCE8',
                      borderRadius: '8px',
                      mb: 1,
                      border: `1px solid ${notice.severity === 'HIGH' || notice.severity === 'CRITICAL' ? '#FECACA' : '#FDE68A'}`,
                    }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="caption" sx={{ fontSize: '0.65rem', fontWeight: 600, color: notice.severity === 'HIGH' || notice.severity === 'CRITICAL' ? '#991B1B' : '#92400E' }}>
                          {notice.type || notice.incidentType || notice.category || 'Notice'}
                        </Typography>
                        <Chip
                          label={notice.severity || 'MEDIUM'}
                          size="small"
                          sx={{ 
                            height: 16, 
                            fontSize: '0.5rem',
                            bgcolor: notice.severity === 'HIGH' || notice.severity === 'CRITICAL' ? '#FEE2E2' : '#FEF3C7',
                            color: notice.severity === 'HIGH' || notice.severity === 'CRITICAL' ? '#991B1B' : '#92400E',
                          }}
                        />
                      </Stack>
                      <Typography variant="body2" sx={{ fontSize: '0.7rem', mt: 0.5 }}>
                        {notice.description || notice.message || 'No description provided'}
                      </Typography>
                      {notice.createdAt && (
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.5rem', display: 'block', mt: 0.25 }}>
                          {dayjs(notice.createdAt).format('DD MMM YYYY HH:mm')}
                        </Typography>
                      )}
                    </Box>
                  ))
                ) : (
                  <Box sx={{ textAlign: 'center', py: 2 }}>
                    <NoIncidentsIcon sx={{ fontSize: 32, color: '#D1D5DB', mb: 1 }} />
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                      No notices or incidents reported
                    </Typography>
                  </Box>
                )}
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, borderTop: '1px solid #ECECEC' }}>
        <Button onClick={onClose} size="small" sx={{ fontSize: '0.8rem', textTransform: 'none' }}>
          Close
        </Button>
        <Button
          onClick={handlePrint}
          variant="contained"
          size="small"
          startIcon={<PrintIcon sx={{ fontSize: '0.9rem' }} />}
          sx={{ 
            fontSize: '0.8rem', 
            textTransform: 'none',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)',
            '&:hover': { background: 'linear-gradient(135deg, #4338CA 0%, #4F46E5 100%)' }
          }}
        >
          Print / PDF
        </Button>
      </DialogActions>

      {/* Print Styles */}
      <style>{`
        @media print {
          .MuiDialog-root .MuiDialog-paper {
            max-height: 100% !important;
            border-radius: 0 !important;
          }
          .MuiDialogActions-root {
            display: none !important;
          }
          .MuiDialogTitle-root .MuiIconButton-root {
            display: none !important;
          }
          body * {
            visibility: hidden;
          }
          .MuiDialog-paper, .MuiDialog-paper * {
            visibility: visible;
          }
          .MuiDialog-paper {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            max-width: 100% !important;
            margin: 0 !important;
            box-shadow: none !important;
          }
          .MuiPaper-root {
            box-shadow: none !important;
            border: 1px solid #E5E7EB !important;
          }
          .MuiTableCell-root {
            padding: 4px 6px !important;
            font-size: 9px !important;
          }
          .MuiChip-root {
            font-size: 8px !important;
            height: 16px !important;
          }
          .MuiTypography-root {
            font-size: 10px !important;
          }
          .MuiDialogContent-root {
            padding: 16px !important;
          }
          .MuiCard-root {
            break-inside: avoid;
          }
        }
      `}</style>
    </Dialog>
  );
};

export default TripReportDetail;
