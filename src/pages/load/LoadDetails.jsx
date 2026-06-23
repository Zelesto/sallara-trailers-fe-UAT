// src/pages/load/LoadDetails.jsx
import React, { useState, useEffect } from 'react';
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
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';

// Import Timeline components from @mui/lab
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
} from '@mui/lab';

import {
  ArrowBack,
  LocalShipping,
  Person,
  LocationOn,
  CalendarToday,
  Route as RouteIcon,
  AccessTime,
  CheckCircle,
  Pending,
  Warning,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { loadService } from '../../services/loadService';

// Info Item Component
const InfoItem = ({ label, value, icon: Icon, isChip = false }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
    {Icon && <Icon sx={{ fontSize: '0.9rem', color: 'text.secondary' }} />}
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem', display: 'block' }}>
        {label}
      </Typography>
      {isChip ? (
        <Box sx={{ mt: 0.25 }}>{value}</Box>
      ) : (
        <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
          {value || 'N/A'}
        </Typography>
      )}
    </Box>
  </Box>
);

const LoadDetails = () => {
  const { loadNumber } = useParams();
  const navigate = useNavigate();
  const [load, setLoad] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadLoadDetails();
  }, [loadNumber]);

  const loadLoadDetails = async () => {
    setLoading(true);
    try {
      const data = await loadService.getLoadByNumber(loadNumber);
      setLoad(data);
    } catch (err) {
      console.error('Error loading load details:', err);
      setError('Failed to load load details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusChip = (status) => {
    const configs = {
      PENDING: { color: 'warning', label: 'Pending', icon: <Pending sx={{ fontSize: '0.7rem' }} /> },
      IN_PROGRESS: { color: 'info', label: 'In Progress', icon: <Warning sx={{ fontSize: '0.7rem' }} /> },
      COMPLETED: { color: 'success', label: 'Completed', icon: <CheckCircle sx={{ fontSize: '0.7rem' }} /> },
      CANCELLED: { color: 'error', label: 'Cancelled', icon: <Warning sx={{ fontSize: '0.7rem' }} /> },
    };
    const config = configs[status] || { color: 'default', label: status };
    return (
      <Chip
        label={config.label}
        color={config.color}
        size="small"
        icon={config.icon}
        sx={{ height: 24, fontSize: '0.7rem' }}
      />
    );
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress size={40} />
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
          onClick={() => navigate('/loads')}
          sx={{ mt: 2, fontSize: '0.8rem' }}
        >
          Back to Loads
        </Button>
      </Box>
    );
  }

  if (!load) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="warning" sx={{ fontSize: '0.8rem' }}>Load not found</Alert>
        <Button
          variant="contained"
          size="small"
          onClick={() => navigate('/loads')}
          sx={{ mt: 2, fontSize: '0.8rem' }}
        >
          Back to Loads
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 1, sm: 1.5, md: 2 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Button
          startIcon={<ArrowBack sx={{ fontSize: '0.9rem' }} />}
          onClick={() => navigate('/loads')}
          size="small"
          sx={{ fontSize: '0.75rem' }}
        >
          Back to Loads
        </Button>
        <Stack direction="row" spacing={0.75}>
          {getStatusChip(load.status)}
        </Stack>
      </Box>

      {/* Summary Card */}
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
                <LocalShipping sx={{ mr: 0.5, verticalAlign: 'middle', fontSize: '1.2rem' }} />
                {load.loadNumber}
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 0.5 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                  <strong>Customer:</strong> {load.customerName || 'N/A'}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                  <strong>Trips:</strong> {load.tripCount || 0}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                  <strong>Status:</strong> {load.status}
                </Typography>
              </Stack>
            </Box>
            <Stack direction={{ xs: 'row', md: 'column' }} spacing={1} alignItems={{ xs: 'center', md: 'flex-end' }}>
              <Chip
                label={`${load.tripCount || 0} Trips`}
                color="primary"
                size="small"
                sx={{ height: 20, fontSize: '0.6rem' }}
              />
              {load.priority && (
                <Chip
                  label={load.priority}
                  color={load.priority === 'URGENT' ? 'error' : 
                         load.priority === 'HIGH' ? 'warning' : 'default'}
                  size="small"
                  sx={{ height: 20, fontSize: '0.6rem' }}
                />
              )}
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {/* Details Grid */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" sx={{ fontSize: '0.85rem', fontWeight: 600, mb: 1.5 }}>
              Load Information
            </Typography>
            <Stack spacing={1.5}>
              <InfoItem label="Load Number" value={load.loadNumber} icon={LocalShipping} />
              <InfoItem label="Customer" value={load.customerName || 'N/A'} icon={Person} />
              <InfoItem label="Commodity Type" value={load.commodityType || 'N/A'} icon={LocalShipping} />
              <InfoItem label="Status" value={getStatusChip(load.status)} isChip />
              <InfoItem label="Priority" value={load.priority || 'NORMAL'} icon={Warning} />
              <InfoItem label="Description" value={load.description || 'No description'} />
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" sx={{ fontSize: '0.85rem', fontWeight: 600, mb: 1.5 }}>
              Load Details
            </Typography>
            <Stack spacing={1.5}>
              <InfoItem 
                label="Loading Date" 
                value={load.loadingDate ? new Date(load.loadingDate).toLocaleString() : 'N/A'} 
                icon={CalendarToday}
              />
              <InfoItem 
                label="Unloading Date" 
                value={load.unloadingDate ? new Date(load.unloadingDate).toLocaleString() : 'N/A'} 
                icon={CalendarToday}
              />
              <InfoItem label="Weight" value={load.weightKg ? `${load.weightKg} kg` : 'N/A'} icon={LocalShipping} />
              <InfoItem label="Volume" value={load.volumeCubicM ? `${load.volumeCubicM} m³` : 'N/A'} icon={LocalShipping} />
              <InfoItem label="Estimated Value" value={load.estimatedValue ? `R ${load.estimatedValue}` : 'N/A'} icon={LocalShipping} />
              <InfoItem label="Pallet Count" value={load.palletCount || 'N/A'} icon={LocalShipping} />
            </Stack>
          </Paper>
        </Grid>

        {/* Trip Timeline */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" sx={{ fontSize: '0.85rem', fontWeight: 600, mb: 1.5 }}>
              <RouteIcon sx={{ mr: 0.5, verticalAlign: 'middle', fontSize: '1rem' }} />
              Trip Timeline
            </Typography>
            
            {load.trips && load.trips.length > 0 ? (
              <Timeline position="left" sx={{ p: 0 }}>
                {load.trips.map((trip, index) => (
                  <TimelineItem key={trip.id}>
                    <TimelineOppositeContent sx={{ m: 0, p: 1 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
                        {trip.plannedStartDate ? new Date(trip.plannedStartDate).toLocaleDateString() : 'N/A'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.55rem', display: 'block' }}>
                        Stop #{index + 1}
                      </Typography>
                    </TimelineOppositeContent>
                    <TimelineSeparator>
                      <TimelineDot color={index === 0 ? 'primary' : 'secondary'} />
                      {index < load.trips.length - 1 && <TimelineConnector />}
                    </TimelineSeparator>
                    <TimelineContent sx={{ p: 1 }}>
                      <Paper sx={{ p: 1.5, bgcolor: '#f8fafc' }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>
                          {trip.tripNumber}
                        </Typography>
                        <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
                            <LocationOn sx={{ fontSize: '0.7rem', mr: 0.25, verticalAlign: 'middle' }} />
                            {trip.origin || 'N/A'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
                            <RouteIcon sx={{ fontSize: '0.7rem', mr: 0.25, verticalAlign: 'middle' }} />
                            {trip.destination || 'N/A'}
                          </Typography>
                        </Stack>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.55rem' }}>
                          Status: {trip.status || 'N/A'}
                        </Typography>
                      </Paper>
                    </TimelineContent>
                  </TimelineItem>
                ))}
              </Timeline>
            ) : (
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <Typography color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                  No trips associated with this load
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default LoadDetails;
