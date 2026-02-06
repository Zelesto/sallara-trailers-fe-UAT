import React, { useEffect, useState, useCallback } from "react";
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
  Tooltip
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
  Warning
} from "@mui/icons-material";
import { tripService } from "../services/tripService";

// Helper functions
const inferVehicleType = (vehicle) => {
  if (!vehicle) return "TRUCK";
  const mm = `${vehicle.make || ""} ${vehicle.model || ""}`.toUpperCase();
  if (mm.includes("TRAILER") || mm.includes("SEMI")) return "TRAILER";
  if (mm.includes("VAN") || mm.includes("BAKKIE")) return "VAN";
  if (mm.includes("CAR") || mm.includes("SEDAN") || mm.includes("HATCH"))
    return "CAR";
  return "TRUCK";
};

const formatDuration = (hours = 0) => {
  if (!hours || hours === 0) return "0h";
  const totalMinutes = Math.round(hours * 60);
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
}) => {
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [vehicleType, setVehicleType] = useState("TRUCK");
  const [calculatedMetrics, setCalculatedMetrics] = useState(null);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState(0);
  const [hasExistingMetrics, setHasExistingMetrics] = useState(false);

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

  // Reset form when modal opens
  useEffect(() => {
    if (!open) return;

    const inferredType = inferVehicleType(vehicleInfo);
    setVehicleType(inferredType);
    setError("");
    setCalculatedMetrics(null);
    setHasExistingMetrics(false);
    
    // Initialize with props or initialMetrics
    const newFormData = {
      originLocation: originLocation || initialMetrics.originLocation || "",
      destinationLocation: 
        destinationLocation || initialMetrics.destinationLocation || "",
      totalDistance: 
        initialMetrics.totalDistanceKm || initialMetrics.totalDistance || "",
      estimatedDuration: 
        initialMetrics.totalDurationHours || initialMetrics.estimatedDuration || "",
      fuelConsumption: 
        initialMetrics.fuelUsedLiters || initialMetrics.fuelConsumption || "",
      estimatedCost: 
        initialMetrics.costAmount || initialMetrics.estimatedCost || "",
      delays: initialMetrics.idleTimeHours || "",
      incidents: initialMetrics.incidentCount || "",
    };
    
    setFormData(newFormData);
    
    // Check if we have existing metrics to load
    if (tripId) {
      loadExistingMetrics();
    }
  }, [open, tripId, initialMetrics, originLocation, destinationLocation, vehicleInfo]);

  const loadExistingMetrics = async () => {
    try {
      setLoading(true);
      const data = await tripService.getTripMetrics(tripId);
      
      if (data && (data.totalDistanceKm || data.totalDurationHours || data.fuelUsedLiters)) {
        setHasExistingMetrics(true);
        setFormData({
          originLocation: data.originLocation || formData.originLocation,
          destinationLocation: data.destinationLocation || formData.destinationLocation,
          totalDistance: data.totalDistanceKm || "",
          estimatedDuration: data.totalDurationHours || "",
          fuelConsumption: data.fuelUsedLiters || "",
          estimatedCost: data.costAmount || "",
          delays: data.idleTimeHours || "",
          incidents: data.incidentCount || "",
        });
        
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
      // Don't show error if no metrics exist yet
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const calculateMetrics = async () => {
    try {
      setCalculating(true);
      setError("");

      if (!formData.originLocation.trim() || !formData.destinationLocation.trim()) {
        setError("Please enter both origin and destination locations.");
        return;
      }

      const dto = await tripService.calculateTripMetrics(
        formData.originLocation.trim(),
        formData.destinationLocation.trim(),
        vehicleType,
        tripId
      );

      if (!dto) {
        setError("No data returned from calculation service.");
        return;
      }

      // Update form with calculated values
      const updatedFormData = {
        ...formData,
        totalDistance: dto.totalDistanceKm || dto.totalDistance || "",
        estimatedDuration: dto.totalDurationHours || dto.estimatedDuration || "",
        fuelConsumption: dto.fuelUsedLiters || dto.fuelConsumption || "",
        estimatedCost: dto.costAmount || dto.estimatedCost || "",
      };

      setFormData(updatedFormData);
      setCalculatedMetrics(dto);
      
      // Switch to manual tab to show calculated values
      setActiveTab(1);
    } catch (err) {
      console.error("Auto calculation failed:", err);
      setError(err.message || "Auto calculation failed. Please check your inputs and try again.");
    } finally {
      setCalculating(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    try {
      setLoading(true);
      setError("");

      // Validate required fields
      if (!formData.totalDistance || !formData.estimatedDuration) {
        setError("Distance and duration are required fields.");
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
        <Typography variant="h6">
          Trip Metrics {tripId && `#${tripId}`}
        </Typography>
        {hasExistingMetrics && (
          <Chip 
            label="Existing Metrics" 
            size="small" 
            color="info" 
            sx={{ ml: 1 }}
          />
        )}
        <IconButton
          onClick={onClose}
          sx={{ ml: 'auto' }}
          size="small"
        >
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
          <form onSubmit={handleSubmit}>
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
          </form>
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

// Add Chip component if not imported
const Chip = ({ label, size, color, sx, ...props }) => (
  <Box
    sx={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: size === 'small' ? '2px 8px' : '4px 12px',
      borderRadius: '16px',
      fontSize: size === 'small' ? '0.75rem' : '0.875rem',
      backgroundColor: theme => color ? theme.palette[color].light : theme.palette.grey[200],
      color: theme => color ? theme.palette[color].main : theme.palette.text.primary,
      fontWeight: 500,
      ...sx,
    }}
    {...props}
  >
    {label}
  </Box>
);

export default TripMetricsForm;
