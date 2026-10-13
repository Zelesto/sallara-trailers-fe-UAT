// src/pages/TripMetricsForm.jsx
import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Divider,
  Stack,
  Paper,
  Grid,
  IconButton,
  Chip
} from "@mui/material";
import {
  Calculate,
  Save,
  Close,
  Edit,
  AutoGraph,
  DirectionsCar,
  AccessTime,
  LocalGasStation,
  AttachMoney,
  Warning,
  LocationOn,
  LocationCity
} from "@mui/icons-material";
import { tripService } from "../services/tripService";

import {
  VEHICLE_TYPES,
  getDisplayName,
} from '../constants';

// Helper functions
const inferVehicleType = (vehicle) => {
  if (!vehicle) return "TRUCK";
  
  const vehicleString = typeof vehicle === 'string' 
    ? vehicle 
    : `${vehicle.make || ""} ${vehicle.model || ""}`.toUpperCase();
  
  if (vehicleString.includes("TRAILER") || vehicleString.includes("SEMI")) return "TRAILER";
  if (vehicleString.includes("VAN") || vehicleString.includes("BAKKIE")) return "VAN";
  if (vehicleString.includes("CAR") || vehicleString.includes("SEDAN") || vehicleString.includes("HATCH"))
    return "CAR";
  return "TRUCK";
};

const formatDuration = (hours = 0) => {
  if (!hours || isNaN(hours) || hours === 0) return "0h";
  const totalMinutes = Math.round(parseFloat(hours) * 60);
  const days = Math.floor(totalMinutes / 1440);
  const hoursRemaining = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hoursRemaining > 0) parts.push(`${hoursRemaining}h`);
  if (minutes > 0 && days === 0) parts.push(`${minutes}m`);
  
  return parts.join(" ") || "0h";
};

// Manual-entry fields: label, required, whole number only
const METRIC_FIELDS = {
  totalDistance: { label: 'Distance', required: true },
  estimatedDuration: { label: 'Duration', required: true },
  fuelConsumption: { label: 'Fuel' },
  estimatedCost: { label: 'Cost' },
  delays: { label: 'Delays' },
  incidents: { label: 'Incidents', integer: true },
};

/** Returns { field: message } for invalid manual entries. Exported for testing. */
export const validateMetrics = (formData) => {
  const errors = {};
  Object.entries(METRIC_FIELDS).forEach(([field, cfg]) => {
    const raw = formData[field];
    const empty = raw === '' || raw === null || raw === undefined;
    if (empty) {
      if (cfg.required) errors[field] = `${cfg.label} is required`;
      return;
    }
    const n = Number(String(raw).trim());
    if (!Number.isFinite(n)) errors[field] = `${cfg.label} must be a number (use a dot for decimals)`;
    else if (n < 0) errors[field] = `${cfg.label} cannot be negative`;
    else if (cfg.required && n === 0) errors[field] = `${cfg.label} must be greater than 0`;
    else if (cfg.integer && !Number.isInteger(n)) errors[field] = `${cfg.label} must be a whole number`;
  });
  return errors;
};

// Compact Metric Card Component
const MetricCard = ({ icon: Icon, label, value, subtext, color = "primary" }) => (
  <Box sx={{ textAlign: 'center', p: 0.5 }}>
    <Icon sx={{ fontSize: '1.2rem', color: `${color}.main`, mb: 0.25 }} />
    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem', display: 'block' }}>
      {label}
    </Typography>
    <Typography variant="subtitle1" fontWeight="bold" sx={{ fontSize: '0.85rem' }}>
      {value}
    </Typography>
    {subtext && (
      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.55rem' }}>
        {subtext}
      </Typography>
    )}
  </Box>
);

const TripMetricsForm = ({
  open,
  onClose,
  onSuccess,
  tripId,
  initialMetrics = {},
  originLocation = "",
  destinationLocation = "",
  vehicleInfo,
  tripData = {},
}) => {
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [vehicleType, setVehicleType] = useState("TRUCK");
  const [calculatedMetrics, setCalculatedMetrics] = useState(null);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState(1);
  const [hasExistingMetrics, setHasExistingMetrics] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  const initializedRef = useRef(null);
  const userEditedRef = useRef(false);   // stops the async load from overwriting typed values
  const timersRef = useRef([]);          // cleared on unmount
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => () => timersRef.current.forEach(clearTimeout), []);
  const later = (fn, ms) => {
    const t = setTimeout(fn, ms);
    timersRef.current.push(t);
  };

  const [formData, setFormData] = useState({
    originLocation: "",
    destinationLocation: "",
    totalDistance: "",
    estimatedDuration: "",
    fuelConsumption: "",
    estimatedCost: "",
    delays: "",
    incidents: "",
  });

  // Load existing metrics from service
  const loadExistingMetrics = useCallback(async (currentTripId) => {
    if (!currentTripId) return;
    
    try {
      setLoading(true);
      const data = await tripService.getTripMetrics(currentTripId);
      
      if (data && (data.totalDistanceKm || data.totalDurationHours || data.fuelUsedLiters)) {
        setHasExistingMetrics(true);
        // If the user already started typing, keep their values (show the "Existing" chip only)
        if (userEditedRef.current) return;
        setFormData(prev => ({
          ...prev,
          originLocation: data.originLocation || prev.originLocation,
          destinationLocation: data.destinationLocation || prev.destinationLocation,
          totalDistance: data.totalDistanceKm?.toString() || prev.totalDistance,
          estimatedDuration: data.totalDurationHours?.toString() || prev.estimatedDuration,
          fuelConsumption: data.fuelUsedLiters?.toString() || prev.fuelConsumption,
          estimatedCost: data.costAmount?.toString() || prev.estimatedCost,
          delays: data.idleTimeHours?.toString() || prev.delays,
          incidents: data.incidentCount?.toString() || prev.incidents,
        }));
        
        if (data.totalDistanceKm && data.totalDurationHours) {
          setCalculatedMetrics({
            totalDistanceKm: data.totalDistanceKm,
            totalDurationHours: data.totalDurationHours,
            fuelUsedLiters: data.fuelUsedLiters,
            costAmount: data.costAmount,
          });
        }
      }
    } catch (err) {
      console.log("No existing metrics for trip:", currentTripId);
      setHasExistingMetrics(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) {
      initializedRef.current = null;
      return;
    }

    if (initializedRef.current === tripId) return;
    initializedRef.current = tripId;

    console.log("Initializing TripMetricsForm for trip:", tripId);

    const inferredType = inferVehicleType(vehicleInfo || tripData.vehicle);
    setVehicleType(inferredType);
    setError("");
    setFieldErrors({});
    userEditedRef.current = false;
    setCalculatedMetrics(null);
    setHasExistingMetrics(false);
    setSaveSuccess(false);
    setActiveTab(1);
    
    const origin = originLocation || 
                   tripData.originLocation || 
                   tripData.origin || 
                   initialMetrics.originLocation || 
                   "";
    
    const destination = destinationLocation || 
                        tripData.destinationLocation || 
                        tripData.destination || 
                        initialMetrics.destinationLocation || 
                        "";
    
    setFormData({
      originLocation: origin,
      destinationLocation: destination,
      totalDistance: initialMetrics.totalDistanceKm?.toString() || 
                     initialMetrics.totalDistance?.toString() || 
                     tripData.totalDistanceKm?.toString() || 
                     tripData.totalDistance?.toString() || 
                     "",
      estimatedDuration: initialMetrics.totalDurationHours?.toString() || 
                         initialMetrics.estimatedDuration?.toString() || 
                         tripData.totalDurationHours?.toString() || 
                         tripData.estimatedDuration?.toString() || 
                         "",
      fuelConsumption: initialMetrics.fuelUsedLiters?.toString() || 
                       initialMetrics.fuelConsumption?.toString() || 
                       tripData.fuelUsedLiters?.toString() || 
                       tripData.fuelConsumption?.toString() || 
                       "",
      estimatedCost: initialMetrics.costAmount?.toString() || 
                     initialMetrics.estimatedCost?.toString() || 
                     tripData.costAmount?.toString() || 
                     tripData.estimatedCost?.toString() || 
                     "",
      delays: initialMetrics.idleTimeHours?.toString() || tripData.delays?.toString() || "",
      incidents: initialMetrics.incidentCount?.toString() || tripData.incidents?.toString() || "",
    });
    
    if (tripId) {
      loadExistingMetrics(tripId);
    }
  }, [open, tripId, initialMetrics, originLocation, destinationLocation, vehicleInfo, tripData, loadExistingMetrics]);

  const handleInputChange = (field) => (event) => {
    const value = event.target.value;
    userEditedRef.current = true;
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    if (fieldErrors[field]) setFieldErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const calculateMetrics = async () => {
    try {
      setCalculating(true);
      setError("");

      const origin = formData.originLocation?.trim();
      const destination = formData.destinationLocation?.trim();

      if (!origin || !destination) {
        setError("Please enter both origin and destination locations.");
        setCalculating(false);
        return;
      }

      if (!tripId) {
        setError("Trip must be saved before calculating metrics.");
        setCalculating(false);
        return;
      }

      console.log("Calculating metrics for:", {
        tripId: tripId,
        origin,
        destination,
        vehicleType
      });

      const result = await tripService.previewTripMetrics(
        origin,
        destination,
        vehicleType
      );

      if (!result) {
        setError("No data returned from calculation service.");
        return;
      }

      console.log("Calculation result:", result);

      const newFormData = {
        ...formData,
        totalDistance: result.totalDistanceKm?.toString() || result.totalDistance?.toString() || "",
        estimatedDuration: result.totalDurationHours?.toString() || result.estimatedDuration?.toString() || "",
        fuelConsumption: result.fuelUsedLiters?.toString() || result.fuelConsumption?.toString() || "",
        estimatedCost: result.costAmount?.toString() || result.estimatedCost?.toString() || "",
      };
      
      setFormData(newFormData);
      userEditedRef.current = true;

      setCalculatedMetrics({
        totalDistanceKm: result.totalDistanceKm || result.totalDistance,
        totalDurationHours: result.totalDurationHours || result.estimatedDuration,
        fuelUsedLiters: result.fuelUsedLiters || result.fuelConsumption,
        costAmount: result.costAmount || result.estimatedCost,
        provider: result.provider,
        confidenceScore: result.confidenceScore,
        warning: result.warning
      });
      
      if (result.warning) {
        setError(`⚠️ Note: ${result.warning}`);
        later(() => setError(""), 5000);
      }
      
      setActiveTab(1);
      
    } catch (err) {
      console.error("Auto calculation failed:", err);
      
      let errorMessage = "Auto calculation failed. ";
      
      if (err.response?.status === 500) {
        errorMessage += "Server error. Please enter metrics manually.";
      } else if (err.response?.status === 404) {
        errorMessage += "Route not found. Please check your addresses.";
      } else if (err.response?.status === 400) {
        errorMessage += "Invalid request. Please check your input.";
      } else {
        errorMessage += err.userMessage || err.message || "Please enter metrics manually.";
      }
      
      setError(errorMessage);
      setActiveTab(1);
    } finally {
      setCalculating(false);
    }
  };

  const saveMetrics = async () => {
    if (!tripId) {
      setError("Cannot save metrics: Trip ID is missing.");
      return;
    }
    
    try {
      setLoading(true);
      setError("");
      setSaveSuccess(false);

      // All fields validated (was: only distance/duration; negatives and "12abc" were saved)
      const errors = validateMetrics(formData);
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        setError("Please fix the highlighted fields.");
        setLoading(false);
        return;
      }

      const n = (v) => (v === '' || v === null || v === undefined ? 0 : Number(String(v).trim()));
      const payload = {
        totalDistanceKm: n(formData.totalDistance),
        totalDurationHours: n(formData.estimatedDuration),
        fuelUsedLiters: n(formData.fuelConsumption),
        costAmount: n(formData.estimatedCost),
        idleTimeHours: n(formData.delays),
        incidentCount: n(formData.incidents),
      };

      console.log("Saving metrics payload:", payload);
      
      await tripService.saveTripMetrics(tripId, payload);

      setSaveSuccess(true);
      
      // ✅ Call onSuccess after successful save
      // (no reload here - the form is closing and the parent refreshes the list)
      later(() => {
        if (onSuccess) {
          onSuccess();
        }
        if (onClose) {
          onClose();
        }
      }, 1500);
      
    } catch (err) {
      console.error("Failed to save metrics:", err);
      
      let errorMessage = "Failed to save metrics. ";
      if (err.response?.status === 404) {
        errorMessage += "Trip not found.";
      } else if (err.response?.status === 400) {
        errorMessage += err.userMessage || "Invalid data format.";
      } else {
        errorMessage += err.userMessage || err.message || "Please try again.";
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const applyCalculatedMetrics = () => {
    if (calculatedMetrics) {
      setFormData(prev => ({
        ...prev,
        totalDistance: calculatedMetrics.totalDistanceKm?.toString() || "",
        estimatedDuration: calculatedMetrics.totalDurationHours?.toString() || "",
        fuelConsumption: calculatedMetrics.fuelUsedLiters?.toString() || "",
        estimatedCost: calculatedMetrics.costAmount?.toString() || "",
      }));
      userEditedRef.current = true;
      setFieldErrors({});
      setActiveTab(1);
      setError("");
    }
  };

  if (!open) return null;

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 1.5 }
      }}
    >
      <DialogTitle sx={{ py: 1.5, px: 2.5, display: 'flex', alignItems: 'center', gap: 1, borderBottom: 1, borderColor: 'divider' }}>
        <AutoGraph color="primary" sx={{ fontSize: '1.2rem' }} />
        <Typography variant="h6" sx={{ flexGrow: 1, fontSize: '1rem', fontWeight: 600 }}>
          Trip Metrics {tripId && `#${tripId}`}
        </Typography>
        {hasExistingMetrics && (
          <Chip
            label="Existing"
            size="small"
            color="info"
            sx={{ height: 20, fontSize: '0.6rem' }}
          />
        )}
        {saveSuccess && (
          <Chip
            label="Saved!"
            size="small"
            color="success"
            sx={{ height: 20, fontSize: '0.6rem' }}
          />
        )}
        <IconButton onClick={onClose} size="small" sx={{ p: 0.5 }}>
          <Close sx={{ fontSize: '1rem' }} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 2.5 }}>
        {error && (
          <Alert severity="warning" sx={{ mb: 2, fontSize: '0.8rem' }} onClose={() => setError("")}>
            {error}
          </Alert>
        )}

        {(formData.originLocation || formData.destinationLocation) && (
          <Paper 
            elevation={0} 
            sx={{ 
              p: 1.5, 
              mb: 2, 
              bgcolor: 'primary.light', 
              color: 'primary.contrastText',
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              borderRadius: 1
            }}
          >
            <LocationOn sx={{ fontSize: '1rem' }} />
            <Box>
              <Typography variant="caption" sx={{ fontSize: '0.7rem', display: 'block' }}>
                From: {formData.originLocation || "Not specified"}
              </Typography>
              <Typography variant="caption" sx={{ fontSize: '0.7rem', display: 'block' }}>
                To: {formData.destinationLocation || "Not specified"}
              </Typography>
            </Box>
          </Paper>
        )}

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs 
            value={activeTab} 
            onChange={(e, newValue) => setActiveTab(newValue)}
            variant="fullWidth"
            sx={{
              '& .MuiTab-root': {
                fontSize: '0.75rem',
                minHeight: 36,
                textTransform: 'none',
              }
            }}
          >
            <Tab 
              icon={<Calculate sx={{ fontSize: '0.9rem' }} />} 
              label="Auto Calculator" 
              iconPosition="start"
            />
            <Tab 
              icon={<Edit sx={{ fontSize: '0.9rem' }} />} 
              label="Manual Entry" 
              iconPosition="start"
            />
          </Tabs>
        </Box>

        {activeTab === 0 && (
          <Stack spacing={2}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
              Automatically calculate trip metrics based on locations and vehicle type
            </Typography>

            <Grid container spacing={1.5}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Origin Location"
                  value={formData.originLocation}
                  onChange={handleInputChange('originLocation')}
                  placeholder="Enter origin city or address"
                  size="small"
                  required
                  sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
                  InputProps={{
                    startAdornment: <LocationCity sx={{ mr: 0.5, fontSize: '0.9rem', color: 'action.active' }} />,
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Destination Location"
                  value={formData.destinationLocation}
                  onChange={handleInputChange('destinationLocation')}
                  placeholder="Enter destination city or address"
                  size="small"
                  required
                  sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
                  InputProps={{
                    startAdornment: <LocationCity sx={{ mr: 0.5, fontSize: '0.9rem', color: 'action.active' }} />,
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth size="small">
                  <InputLabel sx={{ fontSize: '0.75rem' }}>Vehicle Type</InputLabel>
                  <Select
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value)}
                    label="Vehicle Type"
                    sx={{ fontSize: '0.75rem' }}
                  >
                    <MenuItem value="TRUCK" sx={{ fontSize: '0.75rem' }}>Truck (35 L/100km)</MenuItem>
                    <MenuItem value="TRAILER" sx={{ fontSize: '0.75rem' }}>Trailer (40 L/100km)</MenuItem>
                    <MenuItem value="VAN" sx={{ fontSize: '0.75rem' }}>Van (12 L/100km)</MenuItem>
                    <MenuItem value="CAR" sx={{ fontSize: '0.75rem' }}>Car (8 L/100km)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={calculateMetrics}
                  disabled={calculating || !formData.originLocation || !formData.destinationLocation}
                  startIcon={calculating ? <CircularProgress size={16} /> : <Calculate sx={{ fontSize: '0.9rem' }} />}
                  sx={{ height: '40px', fontSize: '0.75rem' }}
                >
                  {calculating ? "Calculating..." : "Calculate Metrics"}
                </Button>
              </Grid>
            </Grid>

            {calculatedMetrics && (
              <Paper elevation={0} sx={{ p: 1.5, bgcolor: 'success.light', color: 'success.contrastText', borderRadius: 1 }}>
                <Typography variant="caption" sx={{ fontSize: '0.7rem', fontWeight: 600, display: 'block', mb: 1 }}>
                  ✅ Calculated Results {calculatedMetrics.provider && `via ${calculatedMetrics.provider}`}
                </Typography>
                {calculatedMetrics.warning && (
                  <Typography variant="caption" sx={{ fontSize: '0.65rem', display: 'block', mb: 1 }}>
                    ⚠️ {calculatedMetrics.warning}
                  </Typography>
                )}
                <Grid container spacing={1}>
                  <Grid size={{ xs: 6, md: 3 }}>
                    <MetricCard
                      icon={DirectionsCar}
                      label="Distance"
                      value={`${calculatedMetrics.totalDistanceKm || 0} km`}
                      color="primary"
                    />
                  </Grid>
                  <Grid size={{ xs: 6, md: 3 }}>
                    <MetricCard
                      icon={AccessTime}
                      label="Duration"
                      value={formatDuration(calculatedMetrics.totalDurationHours || 0)}
                      color="secondary"
                    />
                  </Grid>
                  <Grid size={{ xs: 6, md: 3 }}>
                    <MetricCard
                      icon={LocalGasStation}
                      label="Fuel"
                      value={`${calculatedMetrics.fuelUsedLiters || 0} L`}
                      color="warning"
                    />
                  </Grid>
                  <Grid size={{ xs: 6, md: 3 }}>
                    <MetricCard
                      icon={AttachMoney}
                      label="Cost"
                      value={`R ${calculatedMetrics.costAmount || 0}`}
                      color="success"
                    />
                  </Grid>
                </Grid>
                <Button
                  size="small"
                  variant="contained"
                  onClick={applyCalculatedMetrics}
                  sx={{ mt: 1.5, fontSize: '0.7rem' }}
                >
                  Use These Values
                </Button>
              </Paper>
            )}
          </Stack>
        )}

        {activeTab === 1 && (
          <Box component="form" noValidate>
            <Stack spacing={1.5}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                Enter or edit trip metrics manually
              </Typography>

              <Grid container spacing={1.5}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Total Distance (km)"
                    type="number"
                    value={formData.totalDistance}
                    error={!!fieldErrors.totalDistance}
                    helperText={fieldErrors.totalDistance || undefined}
                    onChange={handleInputChange('totalDistance')}
                    placeholder="Enter distance"
                    size="small"
                    required
                    sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
                    inputProps={{ min: 0, step: 0.1 }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Estimated Duration (hours)"
                    type="number"
                    value={formData.estimatedDuration}
                    error={!!fieldErrors.estimatedDuration}
                    onChange={handleInputChange('estimatedDuration')}
                    placeholder="Enter duration"
                    size="small"
                    required
                    sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
                    inputProps={{ min: 0, step: 0.1 }}
                    helperText={fieldErrors.estimatedDuration || (formData.estimatedDuration ? formatDuration(formData.estimatedDuration) : "")}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Fuel Consumption (liters)"
                    type="number"
                    value={formData.fuelConsumption}
                    error={!!fieldErrors.fuelConsumption}
                    helperText={fieldErrors.fuelConsumption || undefined}
                    onChange={handleInputChange('fuelConsumption')}
                    placeholder="Enter fuel"
                    size="small"
                    sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
                    inputProps={{ min: 0, step: 0.1 }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Estimated Cost (ZAR)"
                    type="number"
                    value={formData.estimatedCost}
                    error={!!fieldErrors.estimatedCost}
                    helperText={fieldErrors.estimatedCost || undefined}
                    onChange={handleInputChange('estimatedCost')}
                    placeholder="Enter cost"
                    size="small"
                    sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
                    inputProps={{ min: 0, step: 0.01 }}
                    InputProps={{
                      startAdornment: <Typography sx={{ mr: 0.5, fontSize: '0.75rem' }}>R</Typography>,
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Delays (hours)"
                    type="number"
                    value={formData.delays}
                    error={!!fieldErrors.delays}
                    helperText={fieldErrors.delays || undefined}
                    onChange={handleInputChange('delays')}
                    placeholder="Enter delays"
                    size="small"
                    sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
                    inputProps={{ min: 0, step: 0.1 }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Incidents Count"
                    type="number"
                    value={formData.incidents}
                    error={!!fieldErrors.incidents}
                    helperText={fieldErrors.incidents || undefined}
                    onChange={handleInputChange('incidents')}
                    placeholder="Enter incidents"
                    size="small"
                    sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
                    inputProps={{ min: 0, step: 1 }}
                  />
                </Grid>
              </Grid>

              {(parseFloat(formData.delays) > 0 || parseInt(formData.incidents) > 0) && (
                <Alert 
                  severity="warning" 
                  icon={<Warning sx={{ fontSize: '0.9rem' }} />}
                  sx={{ fontSize: '0.75rem' }}
                >
                  {parseFloat(formData.delays) > 0 && `Delays: ${formData.delays} hours. `}
                  {parseInt(formData.incidents) > 0 && `Incidents: ${formData.incidents}. `}
                  This may affect trip performance metrics.
                </Alert>
              )}
            </Stack>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 2.5, py: 1.5, borderTop: 1, borderColor: 'divider' }}>
        <Button 
          onClick={onClose} 
          color="inherit"
          size="small"
          sx={{ fontSize: '0.8rem' }}
        >
          Cancel
        </Button>
        
        {activeTab === 1 && (
          <Button
            variant="contained"
            onClick={saveMetrics}
            disabled={loading || saveSuccess || !formData.totalDistance || !formData.estimatedDuration}
            startIcon={loading ? <CircularProgress size={16} /> : <Save sx={{ fontSize: '0.9rem' }} />}
            size="small"
            sx={{ fontSize: '0.8rem' }}
          >
            {loading ? "Saving..." : "Save Metrics"}
          </Button>
        )}
        
        {activeTab === 0 && calculatedMetrics && (
          <Button
            variant="outlined"
            onClick={() => setActiveTab(1)}
            startIcon={<Edit sx={{ fontSize: '0.9rem' }} />}
            size="small"
            sx={{ fontSize: '0.8rem' }}
          >
            Edit & Save
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default TripMetricsForm;
