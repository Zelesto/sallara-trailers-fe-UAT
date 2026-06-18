// src/pages/vehicles/VehicleDetails.jsx
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
} from '@mui/icons-material';
import vehicleService from '../services/vehicleService';
import Breadcrumbs from '../../components/Layout/Breadcrumbs';

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
      ACTIVE: { color: 'success', label: 'Active' },
      AVAILABLE: { color: 'info', label: 'Available' },
      IN_MAINTENANCE: { color: 'warning', label: 'In Maintenance' },
      OUT_OF_SERVICE: { color: 'error', label: 'Out of Service' },
      INACTIVE: { color: 'error', label: 'Inactive' },
    };
    const info = statusMap[status] || { color: 'default', label: status || 'Unknown' };
    return <Chip label={info.label} color={info.color} sx={{ fontWeight: 600 }} />;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
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
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/vehicles')}>
          Back to Vehicles
        </Button>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={() => navigate(`/vehicles/${id}/edit`)}
          >
            Edit
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={handleDelete}
          >
            Delete
          </Button>
        </Stack>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" spacing={3} alignItems="center">
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: 2,
                bgcolor: 'primary.light',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CarIcon sx={{ fontSize: 48, color: 'white' }} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h4" fontWeight="bold">
                {vehicle.make} {vehicle.model}
              </Typography>
              <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 1 }}>
                <Chip
                  label={vehicle.registrationNumber}
                  size="medium"
                  color="primary"
                  sx={{ fontWeight: 600 }}
                />
                {getStatusChip(vehicle.status)}
              </Stack>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
          Vehicle Information
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Stack spacing={2}>
              <Box>
                <Typography variant="caption" color="text.secondary">Registration Number</Typography>
                <Typography variant="body1" fontWeight={500}>
                  {vehicle.registrationNumber}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Make & Model</Typography>
                <Typography variant="body1">
                  {vehicle.make} {vehicle.model}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Year</Typography>
                <Typography variant="body1">
                  {vehicle.year || 'N/A'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Vehicle Type</Typography>
                <Typography variant="body1">
                  {vehicle.vehicleType || 'N/A'}
                </Typography>
              </Box>
            </Stack>
          </Grid>

          <Grid item xs={12} md={6}>
            <Stack spacing={2}>
              <Box>
                <Typography variant="caption" color="text.secondary">Capacity (kg)</Typography>
                <Typography variant="body1" fontWeight={500}>
                  {vehicle.capacityKg ? `${vehicle.capacityKg} kg` : 'N/A'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Fuel Type</Typography>
                <Typography variant="body1">
                  {vehicle.fuelType || 'N/A'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Current Mileage</Typography>
                <Typography variant="body1">
                  {vehicle.currentMileage ? `${vehicle.currentMileage} km` : 'N/A'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Status</Typography>
                <Box>{getStatusChip(vehicle.status)}</Box>
              </Box>
            </Stack>
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" gutterBottom>Additional Information</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SpeedIcon color="action" />
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Engine
                    </Typography>
                    <Typography variant="body2">
                      {vehicle.engineSize || 'N/A'}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} md={3}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FuelIcon color="action" />
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Fuel Consumption
                    </Typography>
                    <Typography variant="body2">
                      {vehicle.fuelConsumption || 'N/A'}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} md={3}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CalendarIcon color="action" />
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Last Service
                    </Typography>
                    <Typography variant="body2">
                      {vehicle.lastServiceDate ? new Date(vehicle.lastServiceDate).toLocaleDateString() : 'N/A'}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} md={3}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <BuildIcon color="action" />
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Next Service
                    </Typography>
                    <Typography variant="body2">
                      {vehicle.nextServiceDate ? new Date(vehicle.nextServiceDate).toLocaleDateString() : 'N/A'}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default VehicleDetails;
