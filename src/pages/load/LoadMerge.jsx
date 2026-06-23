// src/pages/load/LoadMerge.jsx
import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Stack,
  Card,
  CardContent,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  ArrowBack,
  Merge,
  Person,
  CalendarToday,
  LocalShipping,
  Route,
  CheckCircle,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { loadService } from '../../services/loadService';
import { customerService } from '../../services/customerService';

const LoadMerge = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [candidates, setCandidates] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [plannedDate, setPlannedDate] = useState(new Date().toISOString().slice(0, 10));
  const [mergeResult, setMergeResult] = useState(null);
  const [customers, setCustomers] = useState([]);

  React.useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const response = await customerService.getActiveCustomers();
      setCustomers(response || []);
    } catch (err) {
      console.error('Error loading customers:', err);
    }
  };

  const findCandidates = async () => {
    if (!selectedCustomer || !plannedDate) {
      setError('Please select a customer and date');
      return;
    }

    setSearching(true);
    setError('');
    try {
      const response = await loadService.findMergeCandidates(
        selectedCustomer,
        new Date(plannedDate).toISOString()
      );
      setCandidates(response || []);
      if (response.length === 0) {
        setError('No mergeable trips found for this customer on this date');
      }
    } catch (err) {
      console.error('Error finding merge candidates:', err);
      setError(err.message || 'Failed to find merge candidates');
    } finally {
      setSearching(false);
    }
  };

  const handleSmartMerge = async () => {
    if (!selectedCustomer || !plannedDate) {
      setError('Please select a customer and date');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const response = await loadService.smartMergeTrips(
        selectedCustomer,
        new Date(plannedDate).toISOString()
      );
      setMergeResult(response);
      setSuccess(`Successfully merged ${response.tripCount || 0} trips into load ${response.loadNumber}`);
    } catch (err) {
      console.error('Error merging trips:', err);
      setError(err.message || 'Failed to merge trips');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 1.5, md: 2 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Typography variant="h6" fontWeight="600" sx={{ fontSize: '1rem' }}>
            <Merge sx={{ mr: 0.5, verticalAlign: 'middle', fontSize: '1.2rem' }} />
            Smart Merge Trips
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
            Automatically merge trips for the same customer on the same day
          </Typography>
        </Box>
        <Button
          startIcon={<ArrowBack sx={{ fontSize: '0.9rem' }} />}
          onClick={() => navigate('/loads')}
          size="small"
          sx={{ fontSize: '0.75rem' }}
        >
          Back to Loads
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2, fontSize: '0.8rem' }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2, fontSize: '0.8rem' }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <Paper sx={{ p: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={5}>
            <TextField
              select
              fullWidth
              label="Customer *"
              value={selectedCustomer}
              onChange={(e) => setSelectedCustomer(e.target.value)}
              size="small"
              sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
            >
              <MenuItem value="" sx={{ fontSize: '0.8rem' }}>Select Customer</MenuItem>
              {customers.map((customer) => (
                <MenuItem key={customer.id} value={customer.id} sx={{ fontSize: '0.8rem' }}>
                  {customer.name} ({customer.customerCode})
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Planned Date *"
              type="date"
              value={plannedDate}
              onChange={(e) => setPlannedDate(e.target.value)}
              size="small"
              InputLabelProps={{ shrink: true }}
              sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <Button
              fullWidth
              variant="contained"
              onClick={findCandidates}
              disabled={searching || !selectedCustomer || !plannedDate}
              startIcon={searching ? <CircularProgress size={16} /> : <Merge />}
              sx={{ height: '40px', fontSize: '0.8rem' }}
            >
              {searching ? 'Searching...' : 'Find Candidates'}
            </Button>
          </Grid>
        </Grid>

        {/* Candidates List */}
        {candidates.length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="subtitle2" sx={{ fontSize: '0.85rem', fontWeight: 600, mb: 1.5 }}>
              Found {candidates.length} mergeable trips
            </Typography>

            <Card variant="outlined">
              <CardContent sx={{ p: 1.5 }}>
                <List dense>
                  {candidates.map((trip, index) => (
                    <ListItem key={trip.id} divider={index < candidates.length - 1}>
                      <ListItemIcon>
                        <Route sx={{ color: 'primary.main', fontSize: '1rem' }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.75rem' }}>
                            {trip.tripNumber}
                          </Typography>
                        }
                        secondary={
                          <Stack direction="row" spacing={1} sx={{ mt: 0.25 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
                              {trip.origin || 'N/A'} → {trip.destination || 'N/A'}
                            </Typography>
                            <Chip
                              label={trip.status}
                              size="small"
                              sx={{ height: 16, fontSize: '0.5rem' }}
                            />
                          </Stack>
                        }
                      />
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
                        {trip.plannedStartDate ? new Date(trip.plannedStartDate).toLocaleDateString() : 'N/A'}
                      </Typography>
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>

            <Button
              variant="contained"
              color="success"
              onClick={handleSmartMerge}
              disabled={loading || candidates.length === 0}
              startIcon={loading ? <CircularProgress size={16} /> : <CheckCircle />}
              sx={{ mt: 2, fontSize: '0.8rem' }}
            >
              {loading ? 'Merging...' : `Merge ${candidates.length} Trips`}
            </Button>
          </Box>
        )}

        {/* Merge Result */}
        {mergeResult && (
          <Box sx={{ mt: 3 }}>
            <Divider sx={{ mb: 2 }} />
            <Card sx={{ bgcolor: 'success.light' }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontSize: '1rem', color: 'success.dark' }}>
                  <CheckCircle sx={{ mr: 0.5, verticalAlign: 'middle' }} />
                  Merge Successful!
                </Typography>
                <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                  <Chip
                    label={`Load: ${mergeResult.loadNumber}`}
                    color="primary"
                    size="small"
                  />
                  <Chip
                    label={`${mergeResult.tripCount || 0} Trips`}
                    color="info"
                    size="small"
                  />
                  <Chip
                    label={mergeResult.status}
                    color={mergeResult.status === 'PENDING' ? 'warning' : 'success'}
                    size="small"
                  />
                </Stack>
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => navigate(`/loads/${mergeResult.loadNumber}`)}
                  sx={{ mt: 2, fontSize: '0.75rem' }}
                >
                  View Load
                </Button>
              </CardContent>
            </Card>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default LoadMerge;
