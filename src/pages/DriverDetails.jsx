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
  Person as PersonIcon,
} from '@mui/icons-material';
import driverService from '../services/driverService';

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
    return (
      <Chip 
        label={info.label} 
        color={info.color} 
        sx={{ 
          fontWeight: 600, 
          fontSize: '0.7rem', 
          height: 24,
          '& .MuiChip-label': { px: 1 }
        }}
      />
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress size={40} />
        <Typography sx={{ ml: 2, fontSize: '0.9rem' }}>Loading driver details...</Typography>
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
          onClick={() => navigate('/drivers')}
          sx={{ mt: 2, fontSize: '0.8rem' }}
        >
          Back to Drivers
        </Button>
      </Box>
    );
  }

  if (!driver) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="warning" sx={{ fontSize: '0.8rem' }}>Driver not found</Alert>
        <Button
          variant="contained"
          size="small"
          onClick={() => navigate('/drivers')}
          sx={{ mt: 2, fontSize: '0.8rem' }}
        >
          Back to Drivers
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
          onClick={() => navigate('/drivers')}
          size="small"
          sx={{ fontSize: '0.75rem' }}
        >
          Back to Drivers
        </Button>
        <Stack direction="row" spacing={0.75}>
          <Button
            variant="outlined"
            startIcon={<EditIcon sx={{ fontSize: '0.9rem' }} />}
            onClick={() => navigate(`/drivers/${id}/edit`)}
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
            <Avatar
              sx={{
                width: 64,
                height: 64,
                bgcolor: 'primary.main',
                fontSize: 24,
                fontWeight: 600,
                flexShrink: 0,
              }}
            >
              {driver.firstName?.charAt(0)}{driver.lastName?.charAt(0)}
            </Avatar>
            <Box sx={{ flex: 1, width: '100%' }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'flex-start', sm: 'center' }}>
                <Typography variant="h6" fontWeight="bold" sx={{ fontSize: '1rem' }}>
                  {driver.firstName} {driver.lastName}
                </Typography>
                {getStatusChip(driver.status)}
              </Stack>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                Driver ID: #{driver.id}
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* Details Grid - Compact */}
      <Paper sx={{ p: { xs: 1.5, sm: 2 } }}>
        <Typography variant="subtitle1" sx={{ fontSize: '0.9rem', fontWeight: 600, mb: 2 }}>
          <PersonIcon sx={{ mr: 0.5, fontSize: '1rem', verticalAlign: 'middle' }} />
          Personal Information
        </Typography>
        
        <Grid container spacing={1.5}>
          <Grid item xs={12} md={6}>
            <Stack spacing={1.5}>
              <InfoItem label="Full Name" value={`${driver.firstName} ${driver.lastName}`} icon={PersonIcon} color="primary" />
              <InfoItem label="Email" value={driver.email} icon={EmailIcon} color="secondary" />
              <InfoItem label="Phone Number" value={driver.phoneNumber} icon={PhoneIcon} color="success" />
              <InfoItem label="Address" value={driver.address} icon={LocationIcon} color="warning" />
            </Stack>
          </Grid>

          <Grid item xs={12} md={6}>
            <Stack spacing={1.5}>
              <InfoItem label="License Number" value={driver.licenseNumber} icon={BadgeIcon} color="primary" />
              <InfoItem label="License Type" value={driver.licenseType} icon={BadgeIcon} color="info" />
              <InfoItem label="License Expiry" value={driver.licenseExpiry ? new Date(driver.licenseExpiry).toLocaleDateString() : 'N/A'} icon={CalendarIcon} color="warning" />
              <InfoItem label="Hire Date" value={driver.hireDate ? new Date(driver.hireDate).toLocaleDateString() : 'N/A'} icon={CalendarIcon} color="secondary" />
            </Stack>
          </Grid>

          {/* Additional Information */}
          <Grid item xs={12}>
            <Divider sx={{ my: 1.5 }} />
            <Typography variant="subtitle2" sx={{ fontSize: '0.8rem', fontWeight: 600, mb: 1.5 }}>
              Additional Information
            </Typography>
            <Grid container spacing={1.5}>
              <Grid item xs={12} md={4}>
                <InfoItem 
                  label="Assigned Vehicle" 
                  value={driver.vehicleId ? `Vehicle #${driver.vehicleId}` : 'Not Assigned'} 
                  icon={CarIcon} 
                  color="info" 
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <InfoItem 
                  label="Trips Completed" 
                  value={driver.tripsCompleted || 0} 
                  icon={CarIcon} 
                  color="success" 
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <InfoItem 
                  label="Last Active" 
                  value={driver.lastActive ? new Date(driver.lastActive).toLocaleDateString() : 'N/A'} 
                  icon={CalendarIcon} 
                  color="warning" 
                />
              </Grid>
            </Grid>
          </Grid>

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
                  value={driver.createdAt ? new Date(driver.createdAt).toLocaleString() : 'N/A'} 
                  by={driver.createdBy} 
                />
                <AuditItem 
                  label="Last Updated" 
                  value={driver.updatedAt ? new Date(driver.updatedAt).toLocaleString() : 'N/A'} 
                  by={driver.updatedBy} 
                />
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default DriverDetails;
