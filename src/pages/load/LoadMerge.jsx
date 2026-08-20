// src/pages/load/LoadMerge.jsx
import React, { useState, useEffect } from 'react';
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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
} from '@mui/material';
import {
  ArrowBack,
  Merge,
  Person,
  CalendarToday,
  LocalShipping,
  Route,
  CheckCircle,
  ExpandMore,
  Warning,
  Info,
  LocationOn,
  DirectionsCar,
  Scale,
  AttachMoney,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { loadService } from '../../services/loadService';
import { customerService } from '../../services/customerService';
import { tripService } from '../../services/tripService';
import { depotService } from '../../services/depotService';
import { routingService } from '../../services/routingService';
import dayjs from 'dayjs';

const LoadMerge = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tripsWithoutLoad, setTripsWithoutLoad] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [plannedDate, setPlannedDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [mergeResult, setMergeResult] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [selectedTrips, setSelectedTrips] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [depots, setDepots] = useState([]);
  const [selectedDepot, setSelectedDepot] = useState(null);
  const [depotDistances, setDepotDistances] = useState({});
  const [calculatingDistances, setCalculatingDistances] = useState(false);

  // Load customers and depots on mount
  useEffect(() => {
    loadCustomers();
    loadDepots();
  }, []);

  const loadCustomers = async () => {
    try {
      const response = await customerService.getActiveCustomers();
      setCustomers(response || []);
    } catch (err) {
      console.error('Error loading customers:', err);
    }
  };

  const loadDepots = async () => {
    try {
      const response = await depotService.getAllDepots();
      setDepots(response || []);
      if (response && response.length > 0) {
        setSelectedDepot(response[0]);
      }
    } catch (err) {
      console.error('Error loading depots:', err);
    }
  };

  // Find all trips without a load
  const findTripsWithoutLoad = async () => {
    setSearching(true);
    setError('');
    setTripsWithoutLoad([]);
    setSelectedTrips([]);
    setSelectAll(false);

    try {
      // Get all trips
      const allTrips = await tripService.getAllTrips({ size: 1000 });
      const trips = allTrips?.content || allTrips || [];

      // Filter trips without load
      const withoutLoad = trips.filter(trip => 
        !trip.loadId && 
        !trip.loadNumber &&
        trip.status !== 'CANCELLED' &&
        trip.status !== 'COMPLETED'
      );

      console.log(`Found ${withoutLoad.length} trips without load`);

      // If customer filter is applied, filter further
      let filteredTrips = withoutLoad;
      if (selectedCustomer) {
        filteredTrips = withoutLoad.filter(trip => 
          trip.customerId === parseInt(selectedCustomer)
        );
      }

      // If date filter is applied, filter further
      if (plannedDate) {
        const dateStr = dayjs(plannedDate).format('YYYY-MM-DD');
        filteredTrips = filteredTrips.filter(trip => {
          if (!trip.plannedStartDate) return false;
          const tripDate = dayjs(trip.plannedStartDate).format('YYYY-MM-DD');
          return tripDate === dateStr;
        });
      }

      setTripsWithoutLoad(filteredTrips);
      
      if (filteredTrips.length === 0) {
        setError('No trips without a load found matching the criteria');
      } else {
        setSuccess(`Found ${filteredTrips.length} trips without a load`);
      }
    } catch (err) {
      console.error('Error finding trips without load:', err);
      setError(err.message || 'Failed to find trips without load');
    } finally {
      setSearching(false);
    }
  };

  // Calculate depot distances for selected trips
  const calculateDepotDistances = async () => {
    if (!selectedDepot) {
      setError('Please select a depot');
      return;
    }

    if (selectedTrips.length === 0) {
      setError('Please select at least one trip');
      return;
    }

    setCalculatingDistances(true);
    setError('');

    try {
      const distances = {};
      
      for (const trip of selectedTrips) {
        try {
          // Calculate from depot to pickup (origin)
          let fromDepotKm = 0;
          let toDepotKm = 0;

          // Get trip addresses
          const originAddress = [
            trip.originStreetAddress,
            trip.originCity,
            trip.originProvince
          ].filter(Boolean).join(', ');

          const destAddress = [
            trip.destinationStreetAddress,
            trip.destinationCity,
            trip.destinationProvince
          ].filter(Boolean).join(', ');

          // Calculate from depot to origin if we have coordinates
          if (selectedDepot.latitude && selectedDepot.longitude && originAddress) {
            try {
              const result = await routingService.calculateDistance(
                `${selectedDepot.latitude},${selectedDepot.longitude}`,
                originAddress
              );
              if (result?.distance) {
                fromDepotKm = result.distance;
              }
            } catch (err) {
              console.warn(`Failed to calculate from depot for trip ${trip.id}:`, err);
            }
          }

          // Calculate from destination to depot
          if (selectedDepot.latitude && selectedDepot.longitude && destAddress) {
            try {
              const result = await routingService.calculateDistance(
                destAddress,
                `${selectedDepot.latitude},${selectedDepot.longitude}`
              );
              if (result?.distance) {
                toDepotKm = result.distance;
              }
            } catch (err) {
              console.warn(`Failed to calculate to depot for trip ${trip.id}:`, err);
            }
          }

          distances[trip.id] = {
            fromDepotKm: Math.round(fromDepotKm * 10) / 10,
            toDepotKm: Math.round(toDepotKm * 10) / 10,
            totalDepotKm: Math.round((fromDepotKm + toDepotKm) * 10) / 10,
          };

        } catch (err) {
          console.error(`Error calculating distances for trip ${trip.id}:`, err);
          distances[trip.id] = { fromDepotKm: 0, toDepotKm: 0, totalDepotKm: 0 };
        }
      }

      setDepotDistances(distances);
      setSuccess('Depot distances calculated successfully');
    } catch (err) {
      console.error('Error calculating depot distances:', err);
      setError('Failed to calculate depot distances');
    } finally {
      setCalculatingDistances(false);
    }
  };

  // Handle smart merge - create load and add selected trips
  const handleSmartMerge = async () => {
    if (selectedTrips.length === 0) {
      setError('Please select at least one trip to merge');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Get the first trip for load details
      const firstTrip = selectedTrips[0];
      
      // Calculate totals
      const totalWeight = selectedTrips.reduce((sum, trip) => 
        sum + (trip.cargoWeight || 0), 0
      );
      const totalValue = selectedTrips.reduce((sum, trip) => 
        sum + (trip.cargoValue || 0), 0
      );
      const totalPallets = selectedTrips.reduce((sum, trip) => 
        sum + (trip.palletCount || 0), 0
      );

      // Calculate depot totals
      const totalFromDepot = selectedTrips.reduce((sum, trip) => 
        sum + (depotDistances[trip.id]?.fromDepotKm || 0), 0
      );
      const totalToDepot = selectedTrips.reduce((sum, trip) => 
        sum + (depotDistances[trip.id]?.toDepotKm || 0), 0
      );
      const totalDepot = selectedTrips.reduce((sum, trip) => 
        sum + (depotDistances[trip.id]?.totalDepotKm || 0), 0
      );

      // Get earliest start and latest end date
      const startDates = selectedTrips.map(t => t.plannedStartDate).filter(Boolean);
      const endDates = selectedTrips.map(t => t.plannedEndDate).filter(Boolean);
      const loadingDate = startDates.length > 0 ? new Date(Math.min(...startDates.map(d => new Date(d).getTime()))) : null;
      const unloadingDate = endDates.length > 0 ? new Date(Math.max(...endDates.map(d => new Date(d).getTime()))) : null;

      // Build load data
      const loadData = {
        // Core
        referenceNumber: firstTrip.referenceNumber || `LOAD-${Date.now()}`,
        description: `Consolidated load for ${selectedTrips.length} trips - ${firstTrip.customerName || firstTrip.customerId || 'Customer'}`,
        customerId: firstTrip.customerId,
        
        // Measurements
        weightKg: totalWeight,
        volumeCubicM: null,
        palletCount: totalPallets,
        containerNumber: selectedTrips.map(t => t.containerNumber).filter(Boolean).join(', '),
        
        // Dates
        loadingDate: loadingDate ? loadingDate.toISOString() : null,
        unloadingDate: unloadingDate ? unloadingDate.toISOString() : null,
        
        // Status & Priority
        status: 'PENDING',
        priority: firstTrip.priority || 'NORMAL',
        
        // Commodity
        commodityType: firstTrip.commodityType || 'GENERAL',
        
        // Location
        originLocation: firstTrip.originLocation || `${firstTrip.originCity || ''}, ${firstTrip.originProvince || ''}`,
        destinationLocation: firstTrip.destinationLocation || `${firstTrip.destinationCity || ''}, ${firstTrip.destinationProvince || ''}`,
        
        // Depot distances
        totalFromDepotKm: Math.round(totalFromDepot * 10) / 10,
        totalToDepotKm: Math.round(totalToDepot * 10) / 10,
        totalDepotKm: Math.round(totalDepot * 10) / 10,
        
        // Trip IDs to add
        tripIds: selectedTrips.map(trip => trip.id),
      };

      // Remove null/undefined values
      Object.keys(loadData).forEach(key => {
        if (loadData[key] === null || loadData[key] === undefined || loadData[key] === '') {
          delete loadData[key];
        }
      });

      console.log('📦 Creating consolidated load:', loadData);
      
      const result = await loadService.createLoad(loadData);
      console.log('✅ Load created successfully:', result);
      
      setMergeResult(result);
      setSuccess(`Successfully merged ${selectedTrips.length} trips into load ${result.loadNumber}`);
      
      // Refresh the list
      await findTripsWithoutLoad();
      
    } catch (err) {
      console.error('Error merging trips:', err);
      setError(err.message || 'Failed to merge trips');
    } finally {
      setLoading(false);
    }
  };

  // Handle trip selection
  const handleTripSelect = (tripId) => {
    setSelectedTrips(prev => {
      if (prev.find(t => t.id === tripId)) {
        return prev.filter(t => t.id !== tripId);
      } else {
        const trip = tripsWithoutLoad.find(t => t.id === tripId);
        return [...prev, trip];
      }
    });
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedTrips([]);
    } else {
      setSelectedTrips([...tripsWithoutLoad]);
    }
    setSelectAll(!selectAll);
  };

  // Group trips by customer
  const groupTripsByCustomer = (trips) => {
    const groups = {};
    trips.forEach(trip => {
      const key = trip.customerId || 'unknown';
      if (!groups[key]) {
        groups[key] = {
          customerId: key,
          customerName: trip.customerName || `Customer ${key}`,
          trips: [],
        };
      }
      groups[key].trips.push(trip);
    });
    return Object.values(groups);
  };

  const tripGroups = groupTripsByCustomer(tripsWithoutLoad);

  return (
    <Box sx={{ p: { xs: 1, sm: 1.5, md: 2 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Box>
          <Typography variant="h6" fontWeight="600" sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
            <Merge sx={{ mr: 0.5, verticalAlign: 'middle', fontSize: '1.2rem' }} />
            Smart Merge Trips
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' } }}>
            Find trips without a load and create a consolidated load with depot distances
          </Typography>
        </Box>
        <Button
          startIcon={<ArrowBack sx={{ fontSize: '0.9rem' }} />}
          onClick={() => navigate('/loads')}
          size="small"
          sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}
        >
          Back
        </Button>
      </Box>

      {/* Alerts */}
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

      <Paper sx={{ p: { xs: 1.5, sm: 2 } }}>
        {/* Filters */}
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              select
              fullWidth
              label="Customer (Optional)"
              value={selectedCustomer}
              onChange={(e) => setSelectedCustomer(e.target.value)}
              size="small"
              sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
            >
              <MenuItem value="" sx={{ fontSize: '0.8rem' }}>All Customers</MenuItem>
              {customers.map((customer) => (
                <MenuItem key={customer.id} value={customer.id} sx={{ fontSize: '0.8rem' }}>
                  {customer.name} ({customer.customerCode})
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Planned Date (Optional)"
              type="date"
              value={plannedDate}
              onChange={(e) => setPlannedDate(e.target.value)}
              size="small"
              InputLabelProps={{ shrink: true }}
              sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <TextField
              select
              fullWidth
              label="Depot for Distance Calculation"
              value={selectedDepot?.id || ''}
              onChange={(e) => {
                const depot = depots.find(d => d.id === e.target.value);
                setSelectedDepot(depot);
              }}
              size="small"
              sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
            >
              {depots.map((depot) => (
                <MenuItem key={depot.id} value={depot.id} sx={{ fontSize: '0.8rem' }}>
                  {depot.name} ({depot.depotCode})
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="contained"
              onClick={findTripsWithoutLoad}
              disabled={searching}
              startIcon={searching ? <CircularProgress size={16} /> : <Merge />}
              sx={{ height: '40px', fontSize: '0.8rem' }}
            >
              {searching ? 'Searching...' : 'Find Trips'}
            </Button>
          </Grid>
        </Grid>

        {/* Trip List */}
        {tripsWithoutLoad.length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Divider sx={{ mb: 2 }} />
            
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
              <Typography variant="subtitle2" sx={{ fontSize: '0.85rem', fontWeight: 600 }}>
                Found {tripsWithoutLoad.length} trips without a load
              </Typography>
              <Stack direction="row" spacing={1}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={handleSelectAll}
                  sx={{ fontSize: '0.7rem' }}
                >
                  {selectAll ? 'Deselect All' : 'Select All'}
                </Button>
                {selectedTrips.length > 0 && (
                  <Button
                    size="small"
                    variant="contained"
                    color="success"
                    onClick={calculateDepotDistances}
                    disabled={calculatingDistances}
                    startIcon={calculatingDistances ? <CircularProgress size={14} /> : <Route />}
                    sx={{ fontSize: '0.7rem' }}
                  >
                    {calculatingDistances ? 'Calculating...' : 'Calc Distances'}
                  </Button>
                )}
              </Stack>
            </Stack>

            {/* Group by Customer */}
            {tripGroups.map((group) => (
              <Accordion key={group.customerId} defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Person sx={{ fontSize: '1rem', color: 'primary.main' }} />
                    <Typography sx={{ fontWeight: 600, fontSize: '0.8rem' }}>
                      {group.customerName}
                    </Typography>
                    <Chip 
                      label={`${group.trips.length} trips`} 
                      size="small" 
                      color="primary"
                      sx={{ height: 18, fontSize: '0.55rem' }}
                    />
                  </Stack>
                </AccordionSummary>
                <AccordionDetails sx={{ p: 0 }}>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell padding="checkbox">
                            <Checkbox
                              checked={group.trips.every(t => selectedTrips.find(st => st.id === t.id))}
                              onChange={() => {
                                const allSelected = group.trips.every(t => selectedTrips.find(st => st.id === t.id));
                                if (allSelected) {
                                  setSelectedTrips(prev => prev.filter(t => !group.trips.find(gt => gt.id === t.id)));
                                } else {
                                  const newTrips = group.trips.filter(t => !selectedTrips.find(st => st.id === t.id));
                                  setSelectedTrips(prev => [...prev, ...newTrips]);
                                }
                              }}
                            />
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.7rem', fontWeight: 600 }}>Trip #</TableCell>
                          <TableCell sx={{ fontSize: '0.7rem', fontWeight: 600 }}>Route</TableCell>
                          <TableCell align="right" sx={{ fontSize: '0.7rem', fontWeight: 600 }}>Weight</TableCell>
                          <TableCell align="right" sx={{ fontSize: '0.7rem', fontWeight: 600 }}>Pallets</TableCell>
                          <TableCell align="right" sx={{ fontSize: '0.7rem', fontWeight: 600 }}>From Depot</TableCell>
                          <TableCell align="right" sx={{ fontSize: '0.7rem', fontWeight: 600 }}>To Depot</TableCell>
                          <TableCell align="right" sx={{ fontSize: '0.7rem', fontWeight: 600 }}>Total</TableCell>
                          <TableCell sx={{ fontSize: '0.7rem', fontWeight: 600 }}>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {group.trips.map((trip) => {
                          const isSelected = selectedTrips.find(t => t.id === trip.id);
                          const distances = depotDistances[trip.id] || {};
                          return (
                            <TableRow 
                              key={trip.id}
                              selected={!!isSelected}
                              hover
                              onClick={() => handleTripSelect(trip.id)}
                              sx={{ cursor: 'pointer' }}
                            >
                              <TableCell padding="checkbox">
                                <Checkbox
                                  checked={!!isSelected}
                                  onChange={() => handleTripSelect(trip.id)}
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </TableCell>
                              <TableCell sx={{ fontSize: '0.75rem' }}>
                                <Tooltip title={trip.referenceNumber || ''}>
                                  <span>{trip.tripNumber || trip.id}</span>
                                </Tooltip>
                              </TableCell>
                              <TableCell>
                                <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>
                                  {trip.originCity || trip.originLocation || 'N/A'} 
                                  {' → '} 
                                  {trip.destinationCity || trip.destinationLocation || 'N/A'}
                                </Typography>
                              </TableCell>
                              <TableCell align="right" sx={{ fontSize: '0.7rem' }}>
                                {trip.cargoWeight ? `${trip.cargoWeight} kg` : 'N/A'}
                              </TableCell>
                              <TableCell align="right" sx={{ fontSize: '0.7rem' }}>
                                {trip.palletCount || 'N/A'}
                              </TableCell>
                              <TableCell align="right" sx={{ fontSize: '0.7rem' }}>
                                {distances.fromDepotKm !== undefined ? `${distances.fromDepotKm} km` : '—'}
                              </TableCell>
                              <TableCell align="right" sx={{ fontSize: '0.7rem' }}>
                                {distances.toDepotKm !== undefined ? `${distances.toDepotKm} km` : '—'}
                              </TableCell>
                              <TableCell align="right" sx={{ fontSize: '0.7rem' }}>
                                {distances.totalDepotKm !== undefined ? `${distances.totalDepotKm} km` : '—'}
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={trip.status}
                                  size="small"
                                  sx={{ 
                                    height: 18, 
                                    fontSize: '0.55rem',
                                    bgcolor: trip.status === 'PLANNED' ? '#2196F3' : 
                                             trip.status === 'ASSIGNED' ? '#FF9800' :
                                             trip.status === 'IN_PROGRESS' ? '#4CAF50' : '#9E9E9E',
                                    color: '#fff'
                                  }}
                                />
                              </TableCell>
                            </TableRow>
                          );
                        })}
                        {/* Totals row */}
                        {group.trips.length > 1 && (
                          <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                            <TableCell colSpan={2} sx={{ fontSize: '0.7rem', fontWeight: 600 }}>
                              Totals
                            </TableCell>
                            <TableCell sx={{ fontSize: '0.7rem' }}>
                              {group.trips.length} trips
                            </TableCell>
                            <TableCell align="right" sx={{ fontSize: '0.7rem', fontWeight: 600 }}>
                              {group.trips.reduce((sum, t) => sum + (t.cargoWeight || 0), 0)} kg
                            </TableCell>
                            <TableCell align="right" sx={{ fontSize: '0.7rem', fontWeight: 600 }}>
                              {group.trips.reduce((sum, t) => sum + (t.palletCount || 0), 0)}
                            </TableCell>
                            <TableCell align="right" sx={{ fontSize: '0.7rem', fontWeight: 600 }}>
                              {group.trips.reduce((sum, t) => sum + (depotDistances[t.id]?.fromDepotKm || 0), 0).toFixed(1)} km
                            </TableCell>
                            <TableCell align="right" sx={{ fontSize: '0.7rem', fontWeight: 600 }}>
                              {group.trips.reduce((sum, t) => sum + (depotDistances[t.id]?.toDepotKm || 0), 0).toFixed(1)} km
                            </TableCell>
                            <TableCell align="right" sx={{ fontSize: '0.7rem', fontWeight: 600 }}>
                              {group.trips.reduce((sum, t) => sum + (depotDistances[t.id]?.totalDepotKm || 0), 0).toFixed(1)} km
                            </TableCell>
                            <TableCell colSpan={2} />
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </AccordionDetails>
              </Accordion>
            ))}

            {/* Merge Button */}
            {selectedTrips.length > 0 && (
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  color="success"
                  size="large"
                  onClick={handleSmartMerge}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : <CheckCircle />}
                  sx={{ fontSize: '0.85rem', px: 3 }}
                >
                  {loading ? 'Creating Load...' : `Create Load with ${selectedTrips.length} Trip${selectedTrips.length > 1 ? 's' : ''}`}
                </Button>
              </Box>
            )}
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
                  Load Created Successfully!
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap' }}>
                  <Chip
                    label={`Load: ${mergeResult.loadNumber}`}
                    color="primary"
                    size="small"
                  />
                  <Chip
                    label={`${mergeResult.tripCount || selectedTrips.length} Trips`}
                    color="info"
                    size="small"
                  />
                  <Chip
                    label={`Total Weight: ${mergeResult.weightKg || 0} kg`}
                    variant="outlined"
                    size="small"
                  />
                  <Chip
                    label={`Total Pallets: ${mergeResult.palletCount || 0}`}
                    variant="outlined"
                    size="small"
                  />
                  <Chip
                    label={`Depot Distance: ${mergeResult.totalDepotKm || 0} km`}
                    variant="outlined"
                    color="secondary"
                    size="small"
                  />
                  <Chip
                    label={mergeResult.status}
                    color={mergeResult.status === 'PENDING' ? 'warning' : 'success'}
                    size="small"
                  />
                </Stack>
                <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => navigate(`/loads/${mergeResult.id}`)}
                    sx={{ fontSize: '0.75rem' }}
                  >
                    View Load
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => navigate(`/loads/${mergeResult.id}/edit`)}
                    sx={{ fontSize: '0.75rem' }}
                  >
                    Edit Load
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default LoadMerge;
