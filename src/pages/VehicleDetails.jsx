// src/pages/VehicleDetails.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Chip,
  Button,
  Divider,
  Stack,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  DirectionsCar as CarIcon,
  Speed as SpeedIcon,
  CalendarToday as CalendarIcon,
  LocalGasStation as FuelIcon,
  Build as BuildIcon,
  Route as RouteIcon,
  Person as PersonIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Pending as PendingIcon,
} from '@mui/icons-material';
import { vehicleService } from '../services/vehicleService';
import Breadcrumbs from '../components/Layout/Breadcrumbs';

const VehicleDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadVehicle();
  }, [id]);

  const loadVehicle = async () => {
    setLoading(true);
    try {
      const data = await vehicleService.getVehicleById(id);
      setVehicle(data);
      setError(null);
    } catch (err) {
      setError('Failed to load vehicle details');
      console.error('Error loading vehicle:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this vehicle?')) return;
    try {
      await vehicleService.deleteVehicle(id);
      navigate('/vehicles');
    } catch (err) {
      setError('Failed to delete vehicle');
    }
  };

  const getStatusChip = (status) => {
    const statusMap = {
      ACTIVE: { color: 'success', icon: <CheckCircleIcon />, label: 'Active' },
      AVAILABLE: { color: 'info', icon: <PendingIcon />, label: 'Available' },
      IN_MAINTENANCE: { color: 'warning', icon: <BuildIcon />, label: 'In Maintenance' },
      OUT_OF_SERVICE: { color: 'error', icon: <CancelIcon />, label: 'Out of Service' },
      INACTIVE: { color: 'error', icon: <CancelIcon />, label: 'Inactive' },
    };
    const info = statusMap[status] || { color: 'default', icon: null, label: status || 'Unknown' };
    return (
      <Chip 
        label={info.label} 
        color={info.color} 
        icon={info.icon}
        sx={{ fontWeight: 600, fontSize: '0.875rem', px: 1 }}
      />
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading vehicle details...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Breadcrumbs />
        <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
      </Box>
    );
  }

  if (!vehicle) {
    return (
      <Box>
        <Breadcrumbs />
        <Alert severity="warning" sx={{ mt: 2 }}>Vehicle not found</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Breadcrumbs />
      
      {/* Header with actions */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={() => navigate('/vehicles')}
          sx={{ 
            '&:hover': {
              backgroundColor: 'action.hover',
            }
          }}
        >
          Back to Vehicles
        </Button>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={() => navigate(`/vehicles/${id}/edit`)}
            sx={{ 
              '&:hover': {
                backgroundColor: 'secondary.light',
                color: 'white',
              }
            }}
          >
            Edit
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={handleDelete}
            sx={{ 
              '&:hover': {
                backgroundColor: 'error.light',
                color: 'white',
              }
            }}
          >
            Delete
          </Button>
        </Stack>
      </Box>

      {/* Main Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="center">
            {/* Vehicle Icon */}
            <Box
              sx={{
                width: 100,
                height: 100,
                borderRadius: 2,
                bgcolor: 'primary.light',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                flexShrink: 0,
              }}
            >
              <CarIcon sx={{ fontSize: 48 }} />
            </Box>
            
            {/* Vehicle Info */}
            <Box sx={{ flex: 1 }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', sm: 'center' }}>
                <Typography variant="h4" fontWeight="bold">
                  {vehicle.make} {vehicle.model}
                </Typography>
                {getStatusChip(vehicle.status)}
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} sx={{ mt: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Registration:</strong> {vehicle.registrationNumber || 'N/A'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Year:</strong> {vehicle.year || 'N/A'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Type:</strong> {vehicle.vehicleType || 'N/A'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Capacity:</strong> {vehicle.capacityKg ? `${vehicle.capacityKg} kg` : 'N/A'}
                </Typography>
              </Stack>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* Details Grid */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
          Vehicle Information
        </Typography>
        
        <Grid container spacing={3}>
          {/* Left Column - Basic Info */}
          <Grid item xs={12} md={6}>
            <Stack spacing={2}>
              <Box sx={{ 
                p: 2, 
                bgcolor: 'grey.50', 
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'divider',
              }}>
                <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                  Registration Number
                </Typography>
                <Typography variant="body1" fontWeight={500}>
                  {vehicle.registrationNumber}
                </Typography>
              </Box>
              <Box sx={{ 
                p: 2, 
                bgcolor: 'grey.50', 
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'divider',
              }}>
                <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                  Make & Model
                </Typography>
                <Typography variant="body1">
                  {vehicle.make} {vehicle.model}
                </Typography>
              </Box>
              <Box sx={{ 
                p: 2, 
                bgcolor: 'grey.50', 
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'divider',
              }}>
                <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                  Year
                </Typography>
                <Typography variant="body1">
                  {vehicle.year || 'N/A'}
                </Typography>
              </Box>
              <Box sx={{ 
                p: 2, 
                bgcolor: 'grey.50', 
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'divider',
              }}>
                <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                  Vehicle Type
                </Typography>
                <Typography variant="body1">
                  {vehicle.vehicleType || 'N/A'}
                </Typography>
              </Box>
              <Box sx={{ 
                p: 2, 
                bgcolor: 'grey.50', 
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'divider',
              }}>
                <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                  Status
                </Typography>
                <Box>{getStatusChip(vehicle.status)}</Box>
              </Box>
            </Stack>
          </Grid>

          {/* Right Column - Specifications */}
          <Grid item xs={12} md={6}>
            <Stack spacing={2}>
              <Box sx={{ 
                p: 2, 
                bgcolor: 'grey.50', 
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'divider',
              }}>
                <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                  Capacity (kg)
                </Typography>
                <Typography variant="body1" fontWeight={500}>
                  {vehicle.capacityKg ? `${vehicle.capacityKg} kg` : 'N/A'}
                </Typography>
              </Box>
              <Box sx={{ 
                p: 2, 
                bgcolor: 'grey.50', 
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'divider',
              }}>
                <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                  Fuel Type
                </Typography>
                <Typography variant="body1">
                  {vehicle.fuelType || 'N/A'}
                </Typography>
              </Box>
              <Box sx={{ 
                p: 2, 
                bgcolor: 'grey.50', 
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'divider',
              }}>
                <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                  Current Mileage
                </Typography>
                <Typography variant="body1">
                  {vehicle.currentMileage ? `${vehicle.currentMileage.toLocaleString()} km` : 'N/A'}
                </Typography>
              </Box>
              <Box sx={{ 
                p: 2, 
                bgcolor: 'grey.50', 
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'divider',
              }}>
                <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                  Engine Size
                </Typography>
                <Typography variant="body1">
                  {vehicle.engineSize || 'N/A'}
                </Typography>
              </Box>
              <Box sx={{ 
                p: 2, 
                bgcolor: 'grey.50', 
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'divider',
              }}>
                <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                  Fuel Consumption
                </Typography>
                <Typography variant="body1">
                  {vehicle.fuelConsumption || 'N/A'}
                </Typography>
              </Box>
            </Stack>
          </Grid>

          {/* Additional Information */}
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Additional Information
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Stack spacing={2}>
                  <Box sx={{ 
                    p: 2, 
                    bgcolor: 'grey.50', 
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                  }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <CalendarIcon color="action" />
                      <Box>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Last Service Date
                        </Typography>
                        <Typography variant="body1">
                          {vehicle.lastServiceDate ? new Date(vehicle.lastServiceDate).toLocaleDateString() : 'N/A'}
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>
                  <Box sx={{ 
                    p: 2, 
                    bgcolor: 'grey.50', 
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                  }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <BuildIcon color="action" />
                      <Box>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Next Service Date
                        </Typography>
                        <Typography variant="body1">
                          {vehicle.nextServiceDate ? new Date(vehicle.nextServiceDate).toLocaleDateString() : 'N/A'}
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>
                </Stack>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Stack spacing={2}>
                  <Box sx={{ 
                    p: 2, 
                    bgcolor: 'grey.50', 
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                  }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <PersonIcon color="action" />
                      <Box>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Assigned Driver
                        </Typography>
                        <Typography variant="body1">
                          {vehicle.driverName || 'Not Assigned'}
                          {vehicle.driverId && (
                            <Typography variant="caption" color="text.secondary" display="block">
                              ID: {vehicle.driverId}
                            </Typography>
                          )}
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>
                  <Box sx={{ 
                    p: 2, 
                    bgcolor: 'grey.50', 
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                  }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <RouteIcon color="action" />
                      <Box>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Total Trips
                        </Typography>
                        <Typography variant="body1">
                          {vehicle.totalTrips || 0}
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>
                </Stack>
              </Grid>
            </Grid>
          </Grid>

          {/* Notes Section */}
          {vehicle.notes && (
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Notes
              </Typography>
              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                <Typography variant="body1">
                  {vehicle.notes}
                </Typography>
              </Paper>
            </Grid>
          )}

          {/* Audit Trail */}
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Audit Trail
            </Typography>
            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Created
                  </Typography>
                  <Typography variant="body2">
                    {vehicle.createdAt ? new Date(vehicle.createdAt).toLocaleString() : 'N/A'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    By: {vehicle.createdBy || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Last Updated
                  </Typography>
                  <Typography variant="body2">
                    {vehicle.updatedAt ? new Date(vehicle.updatedAt).toLocaleString() : 'N/A'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    By: {vehicle.updatedBy || 'N/A'}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default VehicleDetails;
