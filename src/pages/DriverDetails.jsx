// src/pages/DriverDetails.jsx
import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import driverService from '../services/driverService';
import { Box, CircularProgress, Typography, Alert, Paper } from '@mui/material';

const DriverDetails = () => {
  const { id } = useParams(); // Get the id from URL

  // Fetch driver by ID
  const { data: driver, isLoading, error } = useQuery({
    queryKey: ['driver', id],
    queryFn: () => driverService.getDriverById(id),
    enabled: !!id, // Only run query if id exists
  });

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Error loading driver: {error.message}
      </Alert>
    );
  }

  if (!driver) {
    return (
      <Alert severity="warning" sx={{ m: 2 }}>
        Driver not found
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Driver Details
      </Typography>

      <Paper sx={{ p: 3, mt: 2 }}>
        <Typography variant="h6" gutterBottom>
          {driver.firstName} {driver.lastName}
        </Typography>

        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 3, mt: 2 }}>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">Driver ID</Typography>
            <Typography variant="body1">{driver.id}</Typography>
          </Box>

          <Box>
            <Typography variant="subtitle2" color="text.secondary">License Number</Typography>
            <Typography variant="body1">{driver.licenseNumber || 'N/A'}</Typography>
          </Box>

          <Box>
            <Typography variant="subtitle2" color="text.secondary">License Expiry</Typography>
            <Typography variant="body1">
              {driver.licenseExpiry ? new Date(driver.licenseExpiry).toLocaleDateString() : 'N/A'}
            </Typography>
          </Box>

          <Box>
            <Typography variant="subtitle2" color="text.secondary">Phone</Typography>
            <Typography variant="body1">{driver.phoneNumber || 'N/A'}</Typography>
          </Box>

          <Box>
            <Typography variant="subtitle2" color="text.secondary">Email</Typography>
            <Typography variant="body1">{driver.email || 'N/A'}</Typography>
          </Box>

          <Box>
            <Typography variant="subtitle2" color="text.secondary">Status</Typography>
            <Typography variant="body1" sx={{
              color: driver.status === 'ACTIVE' ? 'success.main' : 'text.secondary',
              fontWeight: 600
            }}>
              {driver.status || 'INACTIVE'}
            </Typography>
          </Box>

          <Box>
            <Typography variant="subtitle2" color="text.secondary">Hire Date</Typography>
            <Typography variant="body1">
              {driver.hireDate ? new Date(driver.hireDate).toLocaleDateString() : 'N/A'}
            </Typography>
          </Box>

          <Box>
            <Typography variant="subtitle2" color="text.secondary">License Type</Typography>
            <Typography variant="body1">{driver.licenseType || 'N/A'}</Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default DriverDetails;