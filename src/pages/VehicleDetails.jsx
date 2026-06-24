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
  Route as RouteIcon,
  Person as PersonIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Pending as PendingIcon,
  AttachMoney as MoneyIcon,
  Receipt as ReceiptIcon,
  Numbers as NumbersIcon,
  Description as DescriptionIcon,
} from '@mui/icons-material';
import { vehicleService } from '../services/vehicleService';

// Compact Info Item Component
const InfoItem = ({ label, value, icon: Icon, color = 'primary', isChip = false }) => (
  <Paper
    sx={{
      p: 1.5,
      bgcolor: 'grey.50',
      borderRadius: 1,
      border: '1px solid',
      borderColor: 'divider',
      height: '100%',
    }}
  >
    <Stack direction="row" alignItems="center" spacing={1}>
      {Icon && (
        <Box
          sx={{
            bgcolor: `${color}.light`,
            borderRadius: 1,
            p: 0.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon sx={{ fontSize: '1rem', color: `${color}.main` }} />
        </Box>
      )}
      <Box>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
          {label}
        </Typography>
        {isChip ? (
          <Box sx={{ mt: 0.25 }}>{value}</Box>
        ) : (
          <Typography variant="body2" fontWeight="500" sx={{ fontSize: '0.8rem' }}>
            {value || 'N/A'}
          </Typography>
        )}
      </Box>
    </Stack>
  </Paper>
);

// Compact Audit Item Component
const AuditItem = ({ label, value, by }) => (
  <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={0.5}>
    <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>
      <strong>{label}:</strong> {value}
    </Typography>
    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
      By: {by || 'N/A'}
    </Typography>
  </Box>
);

// Vehicle Status Chip Component - Updated to match VehicleStatus enum
const VehicleStatusChip = ({ status }) => {
  const statusMap = {
    AVAILABLE: { color: 'success', icon: <CheckCircleIcon sx={{ fontSize: '0.8rem' }} />, label: 'Available' },
    ASSIGNED: { color: 'info', icon: <PersonIcon sx={{ fontSize: '0.8rem' }} />, label: 'Assigned' },
    IN_USE: { color: 'primary', icon: <RouteIcon sx={{ fontSize: '0.8rem' }} />, label: 'In Use' },
    ACTIVE: { color: 'success', icon: <CheckCircleIcon sx={{ fontSize: '0.8rem' }} />, label: 'Active' },
    INACTIVE: { color: 'default', icon: <CancelIcon sx={{ fontSize: '0.8rem' }} />, label: 'Inactive' },
    MAINTENANCE: { color: 'warning', icon: <BuildIcon sx={{ fontSize: '0.8rem' }} />, label: 'Maintenance' },
    REPAIR: { color: 'warning', icon: <BuildIcon sx={{ fontSize: '0.8rem' }} />, label: 'Repair' },
    OUT_OF_SERVICE: { color: 'error', icon: <CancelIcon sx={{ fontSize: '0.8rem' }} />, label: 'Out of Service' },
    SOLD: { color: 'default', icon: <MoneyIcon sx={{ fontSize: '0.8rem' }} />, label: 'Sold' },
    DECOMMISSIONED: { color: 'default', icon: <CancelIcon sx={{ fontSize: '0.8rem' }} />, label: 'Decommissioned' },
    RETIRED: { color: 'default', icon: <CancelIcon sx={{ fontSize: '0.8rem' }} />, label: 'Retired' },
  };
  
  const info = statusMap[status] || { color: 'default', icon: null, label: status || 'Unknown' };
  
  return (
    <Chip 
      label={info.label} 
      color={info.color} 
      icon={info.icon}
      sx={{ 
        fontWeight: 600, 
        fontSize: '0.7rem', 
        height: 24,
        '& .MuiChip-label': { px: 1 },
        '& .MuiChip-icon': { fontSize: '0.8rem' }
      }}
    />
  );
};

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

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Format date
  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress size={40} />
        <Typography sx={{ ml: 2, fontSize: '0.9rem' }}>Loading vehicle details...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error" sx={{ fontSize: '0.8rem' }}>{error}</Alert>
        <Button
          variant="contained"
          size="small"
          onClick={() => navigate('/vehicles')}
          sx={{ mt: 2, fontSize: '0.8rem' }}
        >
          Back to Vehicles
        </Button>
      </Box>
    );
  }

  if (!vehicle) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="warning" sx={{ fontSize: '0.8rem' }}>Vehicle not found</Alert>
        <Button
          variant="contained"
          size="small"
          onClick={() => navigate('/vehicles')}
          sx={{ mt: 2, fontSize: '0.8rem' }}
        >
          Back to Vehicles
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 1, sm: 1.5, md: 2 } }}>
      {/* Header - Compact */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Button 
          startIcon={<ArrowBackIcon sx={{ fontSize: '0.9rem' }} />} 
          onClick={() => navigate('/vehicles')}
          size="small"
          sx={{ fontSize: '0.75rem' }}
        >
          Back to Vehicles
        </Button>
        <Stack direction="row" spacing={0.75}>
          <Button
            variant="outlined"
            startIcon={<EditIcon sx={{ fontSize: '0.9rem' }} />}
            onClick={() => navigate(`/vehicles/${id}/edit`)}
            size="small"
            sx={{ fontSize: '0.75rem', py: 0.5 }}
          >
            Edit
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon sx={{ fontSize: '0.9rem' }} />}
            onClick={handleDelete}
            size="small"
            sx={{ fontSize: '0.75rem', py: 0.5 }}
          >
            Delete
          </Button>
        </Stack>
      </Box>

      {/* Summary Card - Compact */}
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: 1.5,
                bgcolor: 'primary.light',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                flexShrink: 0,
              }}
            >
              <CarIcon sx={{ fontSize: 32 }} />
            </Box>
            
            <Box sx={{ flex: 1, width: '100%' }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'flex-start', sm: 'center' }}>
                <Typography variant="h6" fontWeight="bold" sx={{ fontSize: '1rem' }}>
                  {vehicle.make} {vehicle.model}
                </Typography>
                <VehicleStatusChip status={vehicle.status} />
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 0.5 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                  <strong>Registration:</strong> {vehicle.registrationNumber || 'N/A'}
                </Typography>
                {vehicle.fleetNumber && (
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                    <strong>Fleet:</strong> {vehicle.fleetNumber}
                  </Typography>
                )}
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                  <strong>Year:</strong> {vehicle.year || 'N/A'}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                  <strong>Type:</strong> {vehicle.vehicleType || 'N/A'}
                </Typography>
              </Stack>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* Details Grid - Compact */}
      <Paper sx={{ p: { xs: 1.5, sm: 2 } }}>
        <Typography variant="subtitle1" sx={{ fontSize: '0.9rem', fontWeight: 600, mb: 2 }}>
          Vehicle Information
        </Typography>
        
        <Grid container spacing={1.5}>
          <Grid item xs={12} md={6}>
            <Stack spacing={1.5}>
              <InfoItem label="Registration Number" value={vehicle.registrationNumber} icon={CarIcon} color="primary" />
              <InfoItem label="Make & Model" value={`${vehicle.make} ${vehicle.model}`} icon={CarIcon} color="secondary" />
              <InfoItem label="Year" value={vehicle.year || 'N/A'} icon={CalendarIcon} color="warning" />
              <InfoItem label="Vehicle Type" value={vehicle.vehicleType || 'N/A'} icon={CarIcon} color="info" />
              <InfoItem label="Status" value={<VehicleStatusChip status={vehicle.status} />} isChip />
              {vehicle.fleetNumber && (
                <InfoItem label="Fleet Number" value={vehicle.fleetNumber} icon={NumbersIcon} color="primary" />
              )}
            </Stack>
          </Grid>

          <Grid item xs={12} md={6}>
            <Stack spacing={1.5}>
              <InfoItem label="Fuel Type" value={vehicle.fuelType || 'N/A'} icon={FuelIcon} color="success" />
              <InfoItem label="Current Mileage" value={vehicle.currentMileage ? `${vehicle.currentMileage.toLocaleString()} km` : 'N/A'} icon={SpeedIcon} color="info" />
              <InfoItem label="Current Odometer" value={vehicle.currentOdometer ? `${vehicle.currentOdometer.toLocaleString()} km` : 'N/A'} icon={SpeedIcon} color="primary" />
              <InfoItem label="Avg Fuel Consumption" value={vehicle.avgConsumption ? `${vehicle.avgConsumption} L/100km` : 'N/A'} icon={FuelIcon} color="error" />
              {vehicle.vin && (
                <InfoItem label="VIN Number" value={vehicle.vin} icon={CarIcon} color="secondary" />
              )}
            </Stack>
          </Grid>

          {/* Service Information */}
          <Grid item xs={12}>
            <Divider sx={{ my: 1.5 }} />
            <Typography variant="subtitle2" sx={{ fontSize: '0.8rem', fontWeight: 600, mb: 1.5 }}>
              <BuildIcon sx={{ mr: 0.5, fontSize: '1rem', verticalAlign: 'middle' }} />
              Service Information
            </Typography>
            <Grid container spacing={1.5}>
              <Grid item xs={12} md={4}>
                <InfoItem 
                  label="Last Service Date" 
                  value={formatDate(vehicle.lastServiceDate)} 
                  icon={CalendarIcon} 
                  color="info" 
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <InfoItem 
                  label="Last Service Odometer" 
                  value={vehicle.lastServiceOdometer ? `${vehicle.lastServiceOdometer.toLocaleString()} km` : 'N/A'} 
                  icon={SpeedIcon} 
                  color="info" 
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <InfoItem 
                  label="Category" 
                  value={vehicle.category || 'N/A'} 
                  icon={CarIcon} 
                  color="primary" 
                />
              </Grid>
            </Grid>
          </Grid>

          {/* Financial Information */}
          <Grid item xs={12}>
            <Divider sx={{ my: 1.5 }} />
            <Typography variant="subtitle2" sx={{ fontSize: '0.8rem', fontWeight: 600, mb: 1.5 }}>
              <MoneyIcon sx={{ mr: 0.5, fontSize: '1rem', verticalAlign: 'middle' }} />
              Financial Information
            </Typography>
            <Grid container spacing={1.5}>
              <Grid item xs={12} md={4}>
                <InfoItem 
                  label="Purchase Date" 
                  value={formatDate(vehicle.purchaseDate)} 
                  icon={CalendarIcon} 
                  color="warning" 
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <InfoItem 
                  label="Purchase Price" 
                  value={formatCurrency(vehicle.purchasePrice)} 
                  icon={MoneyIcon} 
                  color="success" 
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <InfoItem 
                  label="Current Value" 
                  value={formatCurrency(vehicle.currentValue)} 
                  icon={MoneyIcon} 
                  color="primary" 
                />
              </Grid>
            </Grid>
          </Grid>

          {/* Insurance & Roadworthy */}
          <Grid item xs={12}>
            <Divider sx={{ my: 1.5 }} />
            <Typography variant="subtitle2" sx={{ fontSize: '0.8rem', fontWeight: 600, mb: 1.5 }}>
              <ReceiptIcon sx={{ mr: 0.5, fontSize: '1rem', verticalAlign: 'middle' }} />
              Insurance & Roadworthy
            </Typography>
            <Grid container spacing={1.5}>
              <Grid item xs={12} md={4}>
                <InfoItem 
                  label="Insurance Policy" 
                  value={vehicle.insurancePolicyNumber || 'N/A'} 
                  icon={ReceiptIcon} 
                  color="info" 
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <InfoItem 
                  label="Insurance Expiry" 
                  value={formatDate(vehicle.insuranceExpiry)} 
                  icon={CalendarIcon} 
                  color={vehicle.insuranceExpiry && new Date(vehicle.insuranceExpiry) < new Date() ? 'error' : 'success'} 
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <InfoItem 
                  label="Roadworthy Expiry" 
                  value={formatDate(vehicle.roadworthyExpiry)} 
                  icon={CalendarIcon} 
                  color={vehicle.roadworthyExpiry && new Date(vehicle.roadworthyExpiry) < new Date() ? 'error' : 'success'} 
                />
              </Grid>
            </Grid>
          </Grid>

          {/* Notes */}
          {vehicle.notes && (
            <Grid item xs={12}>
              <Divider sx={{ my: 1.5 }} />
              <Typography variant="subtitle2" sx={{ fontSize: '0.8rem', fontWeight: 600, mb: 1 }}>
                <DescriptionIcon sx={{ mr: 0.5, fontSize: '1rem', verticalAlign: 'middle' }} />
                Notes
              </Typography>
              <Paper variant="outlined" sx={{ p: 1.5, bgcolor: 'grey.50' }}>
                <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                  {vehicle.notes}
                </Typography>
              </Paper>
            </Grid>
          )}

          {/* Audit Trail */}
          <Grid item xs={12}>
            <Divider sx={{ my: 1.5 }} />
            <Typography variant="subtitle2" sx={{ fontSize: '0.8rem', fontWeight: 600, mb: 1 }}>
              Audit Trail
            </Typography>
            <Paper variant="outlined" sx={{ p: 1.5, bgcolor: 'grey.50' }}>
              <Stack spacing={0.5}>
                <AuditItem 
                  label="Created" 
                  value={vehicle.createdAt ? new Date(vehicle.createdAt).toLocaleString() : 'N/A'} 
                  by={vehicle.createdBy} 
                />
                <AuditItem 
                  label="Last Updated" 
                  value={vehicle.updatedAt ? new Date(vehicle.updatedAt).toLocaleString() : 'N/A'} 
                  by={vehicle.updatedBy} 
                />
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default VehicleDetails;
