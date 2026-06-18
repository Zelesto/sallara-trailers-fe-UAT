// src/pages/drivers/DriverDetails.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Chip,
  Button,
  Avatar,
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
  Phone as PhoneIcon,
  Email as EmailIcon,
  Badge as BadgeIcon,
  CalendarToday as CalendarIcon,
  LocationOn as LocationIcon,
  DirectionsCar as CarIcon,
} from '@mui/icons-material';
import driverService from '../services/driverService';
import Breadcrumbs from '../components/Layout/Breadcrumbs';

const DriverDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [driver, setDriver] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDriver();
  }, [id]);

  const loadDriver = async () => {
    setLoading(true);
    try {
      const data = await driverService.getDriverById(id);
      setDriver(data);
      setError(null);
    } catch (err) {
      setError('Failed to load driver details');
      console.error('Error loading driver:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this driver?')) return;
    try {
      await driverService.deleteDriver(id);
      navigate('/drivers');
    } catch (err) {
      setError('Failed to delete driver');
    }
  };

  const getStatusChip = (status) => {
    const statusMap = {
      ACTIVE: { color: 'success', label: 'Active' },
      AVAILABLE: { color: 'info', label: 'Available' },
      ON_LEAVE: { color: 'warning', label: 'On Leave' },
      INACTIVE: { color: 'error', label: 'Inactive' },
      SUSPENDED: { color: 'error', label: 'Suspended' },
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

  if (!driver) {
    return (
      <Box>
        <Breadcrumbs />
        <Alert severity="warning" sx={{ mt: 2 }}>Driver not found</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Breadcrumbs />
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/drivers')}>
          Back to Drivers
        </Button>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={() => navigate(`/drivers/${id}/edit`)}
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

      {/* Header Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" spacing={3} alignItems="center">
            <Avatar
              sx={{
                width: 80,
                height: 80,
                bgcolor: 'primary.main',
                fontSize: 32,
                fontWeight: 600,
              }}
            >
              {driver.firstName?.charAt(0)}{driver.lastName?.charAt(0)}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h4" fontWeight="bold">
                {driver.firstName} {driver.lastName}
              </Typography>
              <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Driver ID: #{driver.id}
                </Typography>
                {getStatusChip(driver.status)}
              </Stack>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* Details Grid */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
          Personal Information
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Stack spacing={2}>
              <Box>
                <Typography variant="caption" color="text.secondary">Full Name</Typography>
                <Typography variant="body1" fontWeight={500}>
                  {driver.firstName} {driver.lastName}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Email</Typography>
                <Typography variant="body1">
                  {driver.email || 'N/A'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Phone Number</Typography>
                <Typography variant="body1">
                  {driver.phoneNumber || 'N/A'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Address</Typography>
                <Typography variant="body1">
                  {driver.address || 'N/A'}
                </Typography>
              </Box>
            </Stack>
          </Grid>

          <Grid item xs={12} md={6}>
            <Stack spacing={2}>
              <Box>
                <Typography variant="caption" color="text.secondary">License Number</Typography>
                <Typography variant="body1" fontWeight={500}>
                  {driver.licenseNumber || 'N/A'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">License Type</Typography>
                <Typography variant="body1">
                  {driver.licenseType || 'N/A'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">License Expiry</Typography>
                <Typography variant="body1">
                  {driver.licenseExpiry ? new Date(driver.licenseExpiry).toLocaleDateString() : 'N/A'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Hire Date</Typography>
                <Typography variant="body1">
                  {driver.hireDate ? new Date(driver.hireDate).toLocaleDateString() : 'N/A'}
                </Typography>
              </Box>
            </Stack>
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" gutterBottom>Additional Information</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CarIcon color="action" />
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Assigned Vehicle
                    </Typography>
                    <Typography variant="body2">
                      {driver.vehicleId ? `Vehicle #${driver.vehicleId}` : 'Not Assigned'}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <BadgeIcon color="action" />
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Trips Completed
                    </Typography>
                    <Typography variant="body2">
                      {driver.tripsCompleted || 0}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CalendarIcon color="action" />
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Last Active
                    </Typography>
                    <Typography variant="body2">
                      {driver.lastActive ? new Date(driver.lastActive).toLocaleDateString() : 'N/A'}
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

export default DriverDetails;
