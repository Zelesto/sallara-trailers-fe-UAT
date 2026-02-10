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
  IconButton
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

// Helper functions
const inferVehicleType = (vehicle) => {
  if (!vehicle) return "TRUCK";
  
  // Handle different vehicle data structures
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
  const [activeTab, setActiveTab] = useState(0);
  const [hasExistingMetrics, setHasExistingMetrics] = useState(false);
  
  // Track if we've initialized the form for the current tripId
  const initializedRef = useRef(null);

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
    try {
      setLoading(true);
      const data = await tripService.getTripMetrics(currentTripId);
      
      if (data && (data.totalDistanceKm || data.totalDurationHours || data.fuelUsedLiters)) {
        setHasExistingMetrics(true);
        setFormData(prev => ({
          ...prev,
          originLocation: data.originLocation || prev.originLocation,
          destinationLocation: data.destinationLocation || prev.destinationLocation,
          totalDistance: data.totalDistanceKm || prev.totalDistance,
          estimatedDuration: data.totalDurationHours || prev.estimatedDuration,
          fuelConsumption: data.fuelUsedLiters || prev.fuelConsumption,
          estimatedCost: data.costAmount || prev.estimatedCost,
          delays: data.idleTimeHours || prev.delays,
          incidents: data.incidentCount || prev.incidents,
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
      console.error("Failed to load metrics", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize form when modal opens or tripId changes
  useEffect(() => {
    if (!open) {
      initializedRef.current = null;
      return;
    }

    // Only initialize if we haven't for this tripId yet
    if (initializedRef.current === tripId) return;
    initializedRef.current = tripId;

    console.log("Initializing TripMetricsForm for trip:", tripId);

    const inferredType = inferVehicleType(vehicleInfo || tripData.vehicle);
    setVehicleType(inferredType);
    setError("");
    setCalculatedMetrics(null);
    setHasExistingMetrics(false);
    setActiveTab(0);
    
    // Get origin and destination from multiple possible sources
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
    
    // Initialize form data
    setFormData({
      originLocation: origin,
      destinationLocation: destination,
      totalDistance: 
        initialMetrics.totalDistanceKm || 
        initialMetrics.totalDistance || 
        tripData.totalDistanceKm || 
        tripData.totalDistance || 
        "",
      estimatedDuration: 
        initialMetrics.totalDurationHours || 
        initialMetrics.estimatedDuration || 
        tripData.totalDurationHours || 
        tripData.estimatedDuration || 
        "",
      fuelConsumption: 
        initialMetrics.fuelUsedLiters || 
        initialMetrics.fuelConsumption || 
        tripData.fuelUsedLiters || 
        tripData.fuelConsumption || 
        "",
      estimatedCost: 
        initialMetrics.costAmount || 
        initialMetrics.estimatedCost || 
        tripData.costAmount || 
        tripData.estimatedCost || 
        "",
      delays: initialMetrics.idleTimeHours || tripData.delays || "",
      incidents: initialMetrics.incidentCount || tripData.incidents || "",
    });
    
    if (tripId) {
      loadExistingMetrics(tripId);
    }
  }, [open, tripId, initialMetrics, originLocation, destinationLocation, vehicleInfo, tripData, loadExistingMetrics]);

  const handleInputChange = (field) => (event) => {
    const value = event.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const calculateMetrics = async () => {
  try {
    setCalculating(true);
    setError("");

    const origin = formData.originLocation?.trim();
    const destination = formData.destinationLocation?.trim();
    const numericTripId = Number(tripId);

    if (!origin || !destination) {
      setError("Please enter both origin and destination locations.");
      return;
    }

    if (!numericTripId || isNaN(numericTripId)) {
      setError("Trip must be saved before calculating metrics.");
      return;
    }

    console.log("Calculating metrics for:", {
      tripId: numericTripId,
      origin,
      destination,
      vehicleType
    });

    const dto = await tripService.calculateTripMetrics({
      tripId: numericTripId,
      origin,
      destination,
      vehicleType
    });

    if (!dto) {
      setError("No data returned from calculation service.");
      return;
    }

    setFormData(prev => ({
      ...prev,
      totalDistance: dto.totalDistanceKm ?? dto.totalDistance ?? "",
      estimatedDuration: dto.totalDurationHours ?? dto.estimatedDuration ?? "",
      fuelConsumption: dto.fuelUsedLiters ?? dto.fuelConsumption ?? "",
      estimatedCost: dto.costAmount ?? dto.estimatedCost ?? "",
    }));

    setCalculatedMetrics(dto);
    setActiveTab(1);

  } catch (err) {
    console.error("Auto calculation failed:", err);
    setError(err.message || "Auto calculation failed.");
  } finally {
    setCalculating(false);
  }
};


  const handleSubmit = async (event) => {
    if (event && event.preventDefault) {
      event.preventDefault();
    }
    
    try {
      setLoading(true);
      setError("");

      // Validate required fields
      if (!formData.totalDistance || !formData.estimatedDuration) {
        setError("Distance and duration are required fields.");
        setLoading(false);
        return;
      }

      const payload = {
        totalDistanceKm: parseFloat(formData.totalDistance) || 0,
        totalDurationHours: parseFloat(formData.estimatedDuration) || 0,
        fuelUsedLiters: parseFloat(formData.fuelConsumption) || 0,
        costAmount: parseFloat(formData.estimatedCost) || 0,
        idleTimeHours: parseFloat(formData.delays) || 0,
        incidentCount: parseInt(formData.incidents) || 0,
      };

      console.log("Saving metrics payload:", payload);
      
      await tripService.saveTripMetrics(tripId, payload);

      if (onSuccess) onSuccess();
      if (onClose) onClose();
    } catch (err) {
      console.error("Failed to save metrics:", err);
      setError(err.message || "Failed to save metrics. Please try again.");
    } finally {
      setLoading(false);
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
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <AutoGraph color="primary" />
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Trip Metrics {tripId && `#${tripId}`}
        </Typography>
        {hasExistingMetrics && (
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '2px 8px',
              borderRadius: '16px',
              fontSize: '0.75rem',
              backgroundColor: 'info.light',
              color: 'info.main',
              fontWeight: 500,
              ml: 1,
            }}
          >
            Existing Metrics
          </Box>
        )}
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Display trip info if available */}
        {(formData.originLocation || formData.destinationLocation) && (
          <Paper 
            elevation={0} 
            sx={{ 
              p: 2, 
              mb: 3, 
              bgcolor: 'primary.light', 
              color: 'primary.contrastText',
              display: 'flex',
              alignItems: 'center',
              gap: 2
            }}
          >
            <LocationOn />
            <Box>
              <Typography variant="subtitle2">
                From: {formData.originLocation || "Not specified"}
              </Typography>
              <Typography variant="subtitle2">
                To: {formData.destinationLocation || "Not specified"}
              </Typography>
            </Box>
          </Paper>
        )}

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs 
            value={activeTab} 
            onChange={(e, newValue) => setActiveTab(newValue)}
            variant="fullWidth"
          >
            <Tab 
              icon={<Calculate />} 
              label="Auto Calculator" 
              iconPosition="start"
            />
            <Tab 
              icon={<Edit />} 
              label="Manual Entry" 
              iconPosition="start"
            />
          </Tabs>
        </Box>

        {activeTab === 0 && (
          <Stack spacing={3}>
            <Typography variant="subtitle1" color="text.secondary">
              Automatically calculate trip metrics based on locations and vehicle type
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Origin Location"
                  value={formData.originLocation}
                  onChange={handleInputChange('originLocation')}
                  placeholder="Enter origin city or address"
                  size="small"
                  required
                  InputProps={{
                    startAdornment: <LocationCity sx={{ mr: 1, color: 'action.active' }} />,
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Destination Location"
                  value={formData.destinationLocation}
                  onChange={handleInputChange('destinationLocation')}
                  placeholder="Enter destination city or address"
                  size="small"
                  required
                  InputProps={{
                    startAdornment: <LocationCity sx={{ mr: 1, color: 'action.active' }} />,
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Vehicle Type</InputLabel>
                  <Select
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value)}
                    label="Vehicle Type"
                  >
                    <MenuItem value="TRUCK">Truck</MenuItem>
                    <MenuItem value="TRAILER">Trailer</MenuItem>
                    <MenuItem value="VAN">Van</MenuItem>
                    <MenuItem value="CAR">Car</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={calculateMetrics}
                  disabled={calculating || !formData.originLocation || !formData.destinationLocation}
                  startIcon={calculating ? <CircularProgress size={20} /> : <Calculate />}
                  sx={{ height: '40px' }}
                >
                  {calculating ? "Calculating..." : "Calculate Metrics"}
                </Button>
              </Grid>
            </Grid>

            {calculatedMetrics && (
              <Paper elevation={0} sx={{ p: 2, bgcolor: 'success.light', color: 'success.contrastText' }}>
                <Typography variant="subtitle2" gutterBottom>
                  ✅ Calculated Results
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6} md={3}>
                    <Box textAlign="center">
                      <DirectionsCar fontSize="small" />
                      <Typography variant="body2">Distance</Typography>
                      <Typography variant="h6">
                        {calculatedMetrics.totalDistanceKm || calculatedMetrics.totalDistance} km
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Box textAlign="center">
                      <AccessTime fontSize="small" />
                      <Typography variant="body2">Duration</Typography>
                      <Typography variant="h6">
                        {formatDuration(calculatedMetrics.totalDurationHours || calculatedMetrics.estimatedDuration)}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Box textAlign="center">
                      <LocalGasStation fontSize="small" />
                      <Typography variant="body2">Fuel</Typography>
                      <Typography variant="h6">
                        {calculatedMetrics.fuelUsedLiters || calculatedMetrics.fuelConsumption} L
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Box textAlign="center">
                      <AttachMoney fontSize="small" />
                      <Typography variant="body2">Cost</Typography>
                      <Typography variant="h6">
                        ${calculatedMetrics.costAmount || calculatedMetrics.estimatedCost || 0}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
                <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
                  Switch to Manual Entry tab to edit or save these values
                </Typography>
              </Paper>
            )}
          </Stack>
        )}

        {activeTab === 1 && (
          <Box component="form" noValidate>
            <Stack spacing={2}>
              <Typography variant="subtitle1" color="text.secondary">
                Enter or edit trip metrics manually
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Total Distance (km)"
                    type="number"
                    value={formData.totalDistance}
                    onChange={handleInputChange('totalDistance')}
                    placeholder="Enter distance in kilometers"
                    size="small"
                    required
                    inputProps={{ min: 0, step: 0.1 }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Estimated Duration (hours)"
                    type="number"
                    value={formData.estimatedDuration}
                    onChange={handleInputChange('estimatedDuration')}
                    placeholder="Enter duration in hours"
                    size="small"
                    required
                    inputProps={{ min: 0, step: 0.1 }}
                    helperText={formData.estimatedDuration ? formatDuration(formData.estimatedDuration) : ""}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Fuel Consumption (liters)"
                    type="number"
                    value={formData.fuelConsumption}
                    onChange={handleInputChange('fuelConsumption')}
                    placeholder="Enter fuel consumption"
                    size="small"
                    inputProps={{ min: 0, step: 0.1 }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Estimated Cost"
                    type="number"
                    value={formData.estimatedCost}
                    onChange={handleInputChange('estimatedCost')}
                    placeholder="Enter estimated cost"
                    size="small"
                    inputProps={{ min: 0, step: 0.01 }}
                    InputProps={{
                      startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>,
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Delays (hours)"
                    type="number"
                    value={formData.delays}
                    onChange={handleInputChange('delays')}
                    placeholder="Enter delay hours"
                    size="small"
                    inputProps={{ min: 0, step: 0.1 }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Incidents Count"
                    type="number"
                    value={formData.incidents}
                    onChange={handleInputChange('incidents')}
                    placeholder="Enter incident count"
                    size="small"
                    inputProps={{ min: 0 }}
                  />
                </Grid>
              </Grid>

              {(formData.delays || formData.incidents) && (
                <Alert 
                  severity="warning" 
                  icon={<Warning />}
                  sx={{ mt: 1 }}
                >
                  {formData.delays && `Delays: ${formData.delays} hours. `}
                  {formData.incidents && `Incidents: ${formData.incidents}. `}
                  This may affect trip performance metrics.
                </Alert>
              )}
            </Stack>
          </Box>
        )}
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        
        {activeTab === 1 && (
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={loading || !formData.totalDistance || !formData.estimatedDuration}
            startIcon={loading ? <CircularProgress size={20} /> : <Save />}
          >
            {loading ? "Saving..." : "Save Metrics"}
          </Button>
        )}
        
        {activeTab === 0 && calculatedMetrics && (
          <Button
            variant="outlined"
            onClick={() => setActiveTab(1)}
            startIcon={<Edit />}
          >
            Edit & Save
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default TripMetricsForm;
