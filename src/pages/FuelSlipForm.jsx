// src/pages/FuelSlipForm.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Alert,
  Stepper,
  Step,
  StepLabel,
  IconButton,
  Autocomplete,
  InputAdornment,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormLabel,
  CircularProgress,
  Chip,
  Divider,
  Stack,
  Checkbox
} from '@mui/material';
import {
  LocalGasStation,
  DirectionsCar,
  Person,
  LocationOn,
  ArrowBack,
  MyLocation,
  LocalOffer,
  Link as LinkIcon,
  CheckCircle,
  Clear as ClearIcon,
  Save as SaveIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { fuelService } from '../services/fuelService';
import { vehicleService } from '../services/vehicleService';
import { driverService } from '../services/driverService';
import { tripService } from '../services/tripService';

// Constants
const COMMON_STATIONS = ['BP Station', 'Shell Station', 'Caltex Station', 'Engen Station', 'Total Station', 'Sasol Station', 'Puma Station'];
const COMMON_LOCATIONS = ['Johannesburg', 'Pretoria', 'Cape Town', 'Durban', 'Bloemfontein', 'Port Elizabeth', 'East London', 'Polokwane', 'Nelspruit', 'Rustenburg'];
const FUEL_TYPES = ['Petrol (95 Unleaded)', 'Petrol (93 Unleaded)', 'Diesel (50ppm)', 'Diesel (10ppm)', 'Diesel (500ppm)'];
const PAYMENT_METHODS = ['Cash', 'Credit Card', 'Debit Card', 'Fleet Card', 'Electronic Funds Transfer', 'Account Payment'];
const STEPS = ['Basic Information', 'Fuel Details', 'Location & Payment', 'Review & Submit'];

// Helper functions
const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return 'R 0.00';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', minimumFractionDigits: 2 }).format(num);
};

const generateSlipNumber = () => {
  const now = new Date();
  return `FS-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
};

const extractRegistrationNumber = (input) => {
  if (!input) return '';
  if (/^[A-Z0-9]{3,10}$/i.test(input.trim())) {
    return input.trim().toUpperCase();
  }
  const match = input.match(/^([A-Z0-9]{3,10})/i);
  if (match) return match[1].toUpperCase();
  return input.split(' ')[0].toUpperCase();
};

// Compact Info Item Component
const InfoItem = ({ label, value }) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5, borderBottom: '1px solid #f0f0f0' }}>
    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
      {label}:
    </Typography>
    <Typography variant="body2" fontWeight="500" sx={{ fontSize: '0.75rem' }}>
      {value || 'N/A'}
    </Typography>
  </Box>
);

const FuelSlipForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // ============================================================
  // FIX: Proper mode detection
  // ============================================================
  const isEdit = id && id !== 'add' && id !== 'new' && id !== 'undefined';
  const isCreate = !isEdit;

  console.log('📝 FuelSlipForm - Mode:', isEdit ? 'Edit' : 'Create', 'ID:', id);

  // State
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeStep, setActiveStep] = useState(0);
  const [stepErrors, setStepErrors] = useState([]);

  const [loadingTrips, setLoadingTrips] = useState(false);

  // Data state
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [trips, setTrips] = useState([]);

  // Form state
  const [formData, setFormData] = useState({
    slipNumber: '',
    transactionDate: new Date().toISOString().slice(0, 16),
    vehicleId: '',
    driverId: '',
    tripId: '',
    vehicleManual: '',
    driverManual: '',
    fuelType: 'Diesel (50ppm)',
    quantity: '',
    unitPrice: '',
    totalAmount: '',
    odometerReading: '',
    stationName: '',
    location: '',
    pumpNumber: '',
    paymentMethod: 'Account Payment',
    receiptNumber: '',
    notes: '',
    finalized: false
  });

  // UI state
  const [calculatedTotal, setCalculatedTotal] = useState(0);
  const [entryMode, setEntryMode] = useState('manual');
  const [gettingLocation, setGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [vehicleInputValue, setVehicleInputValue] = useState('');
  const [driverInputValue, setDriverInputValue] = useState('');

  // Load data for edit mode
   useEffect(() => {
    if (isEdit && id) {
      fetchSlipDetails();
    }
  }, [id, isEdit]);

  // Initialize slip number
  useEffect(() => {
    if (!formData.slipNumber && !isEdit) {
      setFormData(prev => ({ ...prev, slipNumber: generateSlipNumber() }));
    }
  }, []);

  // Data fetching
  useEffect(() => {
    fetchAllData();
  }, []);

  // Calculate total when quantity or price changes
  useEffect(() => {
    calculateTotal();
  }, [formData.quantity, formData.unitPrice]);

  const fetchSlipDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fuelService.getFuelSlipById(id);
      console.log('Loading fuel slip for edit:', data);

      if (data.tripId) {
        setEntryMode('trip');
      } else {
        setEntryMode('manual');
      }

      setFormData({
        slipNumber: data.slipNumber || '',
        transactionDate: data.transactionDate ? new Date(data.transactionDate).toISOString().slice(0, 16) : '',
        vehicleId: data.vehicleId || '',
        driverId: data.driverId || '',
        tripId: data.tripId || '',
        vehicleManual: data.vehicleRegNumber || '',
        driverManual: data.driverName || '',
        fuelType: data.fuelType || 'Diesel (50ppm)',
        quantity: data.quantity || '',
        unitPrice: data.unitPrice || '',
        totalAmount: data.totalAmount || '',
        odometerReading: data.odometerReading || '',
        stationName: data.stationName || '',
        location: data.location || '',
        pumpNumber: data.pumpNumber || '',
        paymentMethod: data.paymentMethod || 'Account Payment',
        receiptNumber: data.receiptNumber || '',
        notes: data.notes || '',
        finalized: data.finalized || false
      });

      setVehicleInputValue(data.vehicleRegNumber || '');
      setDriverInputValue(data.driverName || '');

    } catch (err) {
      console.error('Error loading fuel slip:', err);
      setError(err.message || 'Failed to load fuel slip');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllData = async () => {
    try {
      setFetchingData(true);
      setLoadingTrips(true);

      // Fetch vehicles and drivers
      const [vehiclesData, driversData] = await Promise.all([
        vehicleService.getAllVehicles().catch(() => []),
        driverService.getAllDrivers().catch(() => [])
      ]);

      // Fetch trips - try with status filter first, fallback to all
      let tripsData = [];
      try {
        // Try with status filter for active trips
        const response = await tripService.getAllTrips({ 
          status: 'ACTIVE,IN_PROGRESS,PLANNED' 
        });
        tripsData = response?.content || response || [];
        console.log('📦 Trips loaded with status filter:', tripsData.length);
      } catch (tripError) {
        console.warn('⚠️ Failed to fetch trips with status filter:', tripError);
        // Fallback: get all trips without filter
        try {
          const fallbackResponse = await tripService.getAllTrips();
          tripsData = fallbackResponse?.content || fallbackResponse || [];
          console.log('📦 Trips loaded without filter (fallback):', tripsData.length);
        } catch (fallbackError) {
          console.warn('⚠️ Fallback trip fetch also failed:', fallbackError);
          // Use empty array as last resort
          tripsData = [];
        }
      }

      const extractData = (response) => {
        if (!response) return [];
        if (Array.isArray(response)) return response;
        if (response.data && Array.isArray(response.data)) return response.data;
        if (response.content && Array.isArray(response.content)) return response.content;
        if (response.results && Array.isArray(response.results)) return response.results;
        if (typeof response === 'object' && !Array.isArray(response)) {
          return Object.values(response);
        }
        return [];
      };

      let vehiclesList = extractData(vehiclesData);
      let driversList = extractData(driversData);
      let tripsList = extractData(tripsData);

      // Filter trips: Exclude FINALIZED and COMPLETED, and sort by date (latest first)
      tripsList = tripsList
  .filter(t => {
    const status = t.status?.toUpperCase() || '';
    return status !== 'FINALIZED';  // ✅ Only filter out FINALIZED
  })
        .sort((a, b) => {
          const dateA = new Date(a.plannedStartDate || a.createdAt || 0);
          const dateB = new Date(b.plannedStartDate || b.createdAt || 0);
          return dateB - dateA;
        });

      setVehicles(vehiclesList);
      setDrivers(driversList);
      setTrips(tripsList);


      // ✅ ADD THESE DEBUG LOGS
console.log('🔍 DEBUG - tripsList:', tripsList);
console.log('🔍 DEBUG - tripsList length:', tripsList.length);
console.log('🔍 DEBUG - First trip sample:', tripsList[0]);
console.log('🔍 DEBUG - Trip statuses:', tripsList.map(t => ({ id: t.id, tripNumber: t.tripNumber, status: t.status })));

      
      console.log('📊 Loaded data summary:', {
        vehicles: vehiclesList.length,
        drivers: driversList.length,
        trips: tripsList.length
      });

    } catch (err) {
      console.error('❌ Error loading data:', err);
      setError('Failed to load some data. You can still continue with manual entry.');
    } finally {
      setFetchingData(false);
      setLoadingTrips(false);
    }
  };

  // Auto-populate vehicle and driver when trip is selected
  // Auto-populate vehicle and driver when trip is selected
  const handleTripSelection = async (tripId) => {
    console.log('Trip selected:', tripId);

    if (!tripId) {
      setFormData(prev => ({
        ...prev,
        tripId: '',
        vehicleId: '',
        driverId: '',
        vehicleManual: '',
        driverManual: ''
      }));
      setVehicleInputValue('');
      setDriverInputValue('');
      return;
    }

    try {
      const selectedTrip = trips.find(t => t.id && t.id.toString() === tripId.toString());
      console.log('Selected trip object:', selectedTrip);

      if (!selectedTrip) {
        setError('Selected trip not found');
        return;
      }

      let newFormData = { ...formData, tripId };
      let newVehicleValue = '';
      let newDriverValue = '';

      // Auto-populate vehicle
      if (selectedTrip.vehicleId) {
        const vehicle = vehicles.find(v => v.id && v.id.toString() === selectedTrip.vehicleId.toString());
        if (vehicle) {
          console.log('Found vehicle by ID:', vehicle);
          newFormData.vehicleId = vehicle.id;
          newFormData.vehicleManual = vehicle.registrationNumber || vehicle.regNumber || vehicle.plateNumber || '';
          newVehicleValue = `${newFormData.vehicleManual} - ${vehicle.make || ''} ${vehicle.model || ''}`.trim();
        }
      } else if (selectedTrip.vehicle && selectedTrip.vehicle.id) {
        const vehicle = selectedTrip.vehicle;
        console.log('Found vehicle in trip object:', vehicle);
        newFormData.vehicleId = vehicle.id;
        newFormData.vehicleManual = vehicle.registrationNumber || vehicle.regNumber || vehicle.plateNumber || '';
        newVehicleValue = `${newFormData.vehicleManual} - ${vehicle.make || ''} ${vehicle.model || ''}`.trim();
      } else if (selectedTrip.vehicleRegistration) {
        console.log('Trip has vehicleRegistration:', selectedTrip.vehicleRegistration);
        newFormData.vehicleManual = selectedTrip.vehicleRegistration;

        const matchingVehicle = vehicles.find(v => {
          const regNum = v.registrationNumber || v.regNumber || v.plateNumber;
          if (!regNum) return false;
          return regNum.toLowerCase().includes(selectedTrip.vehicleRegistration.toLowerCase()) ||
                 selectedTrip.vehicleRegistration.toLowerCase().includes(regNum.toLowerCase());
        });

        if (matchingVehicle) {
          newFormData.vehicleId = matchingVehicle.id;
          newVehicleValue = `${matchingVehicle.registrationNumber || matchingVehicle.regNumber || matchingVehicle.plateNumber} - ${matchingVehicle.make || ''} ${matchingVehicle.model || ''}`.trim();
        } else {
          newVehicleValue = selectedTrip.vehicleRegistration;
        }
      }

      // Auto-populate driver
      if (selectedTrip.driverId) {
        const driver = drivers.find(d => d.id && d.id.toString() === selectedTrip.driverId.toString());
        if (driver) {
          console.log('Found driver by ID:', driver);
          newFormData.driverId = driver.id;
          newFormData.driverManual = driver.fullName || `${driver.firstName || ''} ${driver.lastName || ''}`.trim();
          newDriverValue = newFormData.driverManual;
        }
      } else if (selectedTrip.driver && selectedTrip.driver.id) {
        const driver = selectedTrip.driver;
        console.log('Found driver in trip object:', driver);
        newFormData.driverId = driver.id;
        newFormData.driverManual = driver.fullName || `${driver.firstName || ''} ${driver.lastName || ''}`.trim();
        newDriverValue = newFormData.driverManual;
      } else if (selectedTrip.driverName) {
        console.log('Trip has driverName:', selectedTrip.driverName);
        newFormData.driverManual = selectedTrip.driverName;

        const matchingDriver = drivers.find(d => {
          const driverName = d.fullName || `${d.firstName || ''} ${d.lastName || ''}`.trim();
          if (!driverName) return false;
          return driverName.toLowerCase().includes(selectedTrip.driverName.toLowerCase()) ||
                 selectedTrip.driverName.toLowerCase().includes(driverName.toLowerCase());
        });

        if (matchingDriver) {
          newFormData.driverId = matchingDriver.id;
          newDriverValue = matchingDriver.fullName || `${matchingDriver.firstName || ''} ${matchingDriver.lastName || ''}`.trim();
        } else {
          newDriverValue = selectedTrip.driverName;
        }
      }

      setFormData(newFormData);
      setVehicleInputValue(newVehicleValue);
      setDriverInputValue(newDriverValue);

      console.log('After auto-population:', {
        formData: newFormData,
        vehicleValue: newVehicleValue,
        driverValue: newDriverValue
      });

    } catch (err) {
      console.error('Error auto-populating trip:', err);
      setError('Failed to auto-populate trip data');
    }
  };

  // Calculate total
  const calculateTotal = () => {
    const qty = parseFloat(formData.quantity) || 0;
    const price = parseFloat(formData.unitPrice) || 0;
    const total = qty * price;
    setCalculatedTotal(total);
    setFormData(prev => ({ ...prev, totalAmount: total.toFixed(2) }));
  };

  // Form handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEntryModeChange = (e) => {
    const mode = e.target.value;
    setEntryMode(mode);
    setFormData(prev => ({
      ...prev,
      tripId: '',
      vehicleId: '',
      driverId: '',
      vehicleManual: '',
      driverManual: ''
    }));
    setVehicleInputValue('');
    setDriverInputValue('');
  };

  // Handle vehicle selection/typing
  const handleVehicleChange = (event, newValue) => {
    let newVehicleId = '';
    let newVehicleManual = '';
    let newVehicleInputValue = '';

    if (newValue && typeof newValue === 'object') {
      newVehicleId = newValue.id;
      newVehicleManual = newValue.registrationNumber || newValue.regNumber || '';
      newVehicleInputValue = `${newVehicleManual} - ${newValue.make || ''} ${newValue.model || ''}`.trim();
    } else if (typeof newValue === 'string') {
      newVehicleManual = extractRegistrationNumber(newValue);
      newVehicleInputValue = newValue;
    }

    setFormData(prev => ({
      ...prev,
      vehicleId: newVehicleId,
      vehicleManual: newVehicleManual
    }));
    setVehicleInputValue(newVehicleInputValue);
  };

  // Handle driver selection/typing
  const handleDriverChange = (event, newValue) => {
    let newDriverId = '';
    let newDriverManual = '';
    let newDriverInputValue = '';

    if (newValue && typeof newValue === 'object') {
      newDriverId = newValue.id;
      newDriverManual = newValue.fullName || `${newValue.firstName || ''} ${newValue.lastName || ''}`.trim();
      newDriverInputValue = newDriverManual;
    } else if (typeof newValue === 'string') {
      newDriverManual = newValue;
      newDriverInputValue = newValue;
    }

    setFormData(prev => ({
      ...prev,
      driverId: newDriverId,
      driverManual: newDriverManual
    }));
    setDriverInputValue(newDriverInputValue);
  };

  // Location handling
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation not supported');
      return;
    }

    setGettingLocation(true);
    setLocationError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setFormData(prev => ({
          ...prev,
          location: `Lat: ${latitude.toFixed(4)}, Long: ${longitude.toFixed(4)}`
        }));
        setGettingLocation(false);
      },
      (err) => {
        console.error('Geolocation error:', err);
        setLocationError('Unable to get location');
        setGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Validation
  const validateStep = (step) => {
    const errors = [];

    switch (step) {
      case 0:
        if (!formData.vehicleManual && !formData.vehicleId) {
          errors.push('Vehicle registration is required');
        }
        if (!formData.driverManual && !formData.driverId) {
          errors.push('Driver name is required');
        }
        if (!formData.transactionDate) {
          errors.push('Date is required');
        }
        break;
      case 1:
        if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
          errors.push('Valid quantity is required');
        }
        if (!formData.unitPrice || parseFloat(formData.unitPrice) <= 0) {
          errors.push('Valid unit price is required');
        }
        if (!formData.odometerReading) {
          errors.push('Odometer reading is required');
        }
        break;
      case 2:
        if (!formData.stationName) {
          errors.push('Station name is required');
        }
        if (!formData.location) {
          errors.push('Location is required');
        }
        break;
    }

    return errors;
  };

  // Step navigation
  const handleNext = () => {
    const errors = validateStep(activeStep);
    if (errors.length) {
      setStepErrors(errors);
      return;
    }
    setStepErrors([]);
    setActiveStep(prev => prev + 1);
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
    setError('');
  };

  // Submission
  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const vehicleRegistration = extractRegistrationNumber(formData.vehicleManual);

      if (!vehicleRegistration) {
        setError('Please enter a valid vehicle registration number');
        setLoading(false);
        return;
      }

      const payload = {
        slipNumber: formData.slipNumber,
        transactionDate: new Date(formData.transactionDate).toISOString(),
        vehicleRegistration: vehicleRegistration,
        driverName: formData.driverManual,
        fuelType: formData.fuelType,
        quantity: parseFloat(formData.quantity),
        unitPrice: parseFloat(formData.unitPrice),
        stationName: formData.stationName || 'Unknown Station',
        location: formData.location || 'Unknown Location',
        paymentMethod: formData.paymentMethod || 'Cash',
        tripId: formData.tripId || null,
        odometerReading: formData.odometerReading ? parseFloat(formData.odometerReading) : null,
        pumpNumber: formData.pumpNumber || null,
        receiptNumber: formData.receiptNumber || null,
        notes: formData.notes || null,
        vehicleId: formData.vehicleId || null,
        driverId: formData.driverId || null,
        finalized: formData.finalized || false
      };

      console.log('Submitting fuel slip:', payload);

      let response;
      if (isEdit) {
        response = await fuelService.updateFuelSlip(id, payload);
        setSuccess('Fuel slip updated successfully!');
      } else {
        response = await fuelService.createFuelSlip(payload);
        setSuccess('Fuel slip created successfully!');
      }

      console.log('Fuel slip saved:', response);
      setTimeout(() => navigate('/fuel/slips'), 1500);

    } catch (err) {
      console.error('Error saving fuel slip:', err);
      setError(err.message || 'Failed to save fuel slip');
    } finally {
      setLoading(false);
    }
  };

  // Available trips filter (exclude FINALIZED and COMPLETED, show latest first)
 console.log('🔍 DEBUG - Before filtering, trips count:', trips.length);
console.log('🔍 DEBUG - Trip statuses before filter:', trips.map(t => t.status));

const availableTrips = trips
  .filter(t => {
    const status = t.status?.toUpperCase() || '';
    return status !== 'FINALIZED';
  })
  .sort((a, b) => {
    const dateA = new Date(a.plannedStartDate || a.createdAt || 0);
    const dateB = new Date(b.plannedStartDate || b.createdAt || 0);
    return dateB - dateA;
  });

console.log('🔍 DEBUG - After filtering, availableTrips count:', availableTrips.length);
console.log('🔍 DEBUG - availableTrips:', availableTrips.map(t => ({ id: t.id, tripNumber: t.tripNumber, status: t.status })));
  // Get selected trip details
  const getSelectedTrip = () => {
    if (!formData.tripId) return null;
    return trips.find(t => t.id && t.id.toString() === formData.tripId.toString());
  };

  // Render step content
  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" sx={{ fontSize: '0.95rem', fontWeight: 600, mb: 2 }}>
              <Person sx={{ fontSize: '1.1rem', mr: 0.5, verticalAlign: 'middle' }} />
              Basic Information
            </Typography>

            <Card sx={{ mb: 2 }}>
              <CardContent sx={{ p: 1.5 }}>
                <FormControl component="fieldset">
                  <FormLabel sx={{ fontSize: '0.8rem' }}>Select Entry Mode</FormLabel>
                  <RadioGroup row value={entryMode} onChange={handleEntryModeChange}>
                    <FormControlLabel value="manual" control={<Radio size="small" />} label="Manual Entry" sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.75rem' } }} />
                    <FormControlLabel value="trip" control={<Radio size="small" />} label="Select Active Trip" sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.75rem' } }} />
                  </RadioGroup>
                </FormControl>
              </CardContent>
            </Card>

            {entryMode === 'trip' && (
              <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                <InputLabel sx={{ fontSize: '0.75rem' }}>Trip</InputLabel>
                <Select
                  value={formData.tripId}
                  onChange={(e) => handleTripSelection(e.target.value)}
                  label="Trip"
                  sx={{ fontSize: '0.8rem' }}
                  renderValue={(selected) => {
                    const trip = availableTrips.find(t => t.id && t.id.toString() === selected.toString());
                    return trip
                      ? `${trip.tripNumber || `Trip #${trip.id}`} - ${trip.originLocation || 'Origin'} → ${trip.destinationLocation || 'Destination'} (${trip.status})`
                      : '-- Select a Trip --';
                  }}
                >
                  <MenuItem value="" sx={{ fontSize: '0.8rem' }}>-- Select a Trip --</MenuItem>
                  {availableTrips.map(trip => (
                    <MenuItem key={trip.id} value={trip.id} sx={{ fontSize: '0.8rem' }}>
                      <Box>
                        <Typography sx={{ fontSize: '0.8rem', fontWeight: 500 }}>
                          {trip.tripNumber || `Trip #${trip.id}`}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                          {trip.originLocation || 'Origin'} → {trip.destinationLocation || 'Destination'} | 
                          {trip.vehicleRegistration || 'No vehicle'} | 
                          Status: {trip.status}
                          {trip.plannedStartDate && ` | ${new Date(trip.plannedStartDate).toLocaleDateString()}`}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Slip Number"
                  name="slipNumber"
                  size="small"
                  value={formData.slipNumber}
                  onChange={handleInputChange}
                  disabled={isEdit}
                  sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
                  InputProps={{
                    endAdornment: !isEdit && (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => setFormData(prev => ({ ...prev, slipNumber: generateSlipNumber() }))}>
                          <LocalOffer sx={{ fontSize: '0.9rem' }} />
                        </IconButton>
                      </InputAdornment>
                    ),
                    sx: { fontSize: '0.8rem' }
                  }}
                  helperText={isEdit ? 'Slip number cannot be changed' : 'Auto-generated, click refresh icon to generate new'}
                />
                <TextField
                  fullWidth
                  label="Transaction Date & Time"
                  type="datetime-local"
                  name="transactionDate"
                  size="small"
                  value={formData.transactionDate}
                  onChange={handleInputChange}
                  InputLabelProps={{ shrink: true }}
                  sx={{ mt: 1.5, '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
                  InputProps={{ sx: { fontSize: '0.8rem' } }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Autocomplete
                  freeSolo
                  options={vehicles}
                  size="small"
                  getOptionLabel={(option) => {
                    if (typeof option === 'string') return option;
                    return `${option.registrationNumber || option.regNumber || ''} - ${option.make || ''} ${option.model || ''}`.trim();
                  }}
                  value={vehicleInputValue}
                  onChange={handleVehicleChange}
                  inputValue={vehicleInputValue}
                  onInputChange={(event, newValue) => setVehicleInputValue(newValue || '')}
                  disabled={entryMode === 'trip' && !!formData.tripId}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Vehicle Registration *"
                      size="small"
                      helperText="Type registration number or select from list"
                      error={!formData.vehicleManual && !formData.vehicleId}
                      sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
                    />
                  )}
                />

                <Autocomplete
                  freeSolo
                  options={drivers}
                  size="small"
                  getOptionLabel={(option) => {
                    if (typeof option === 'string') return option;
                    return option.fullName || `${option.firstName || ''} ${option.lastName || ''}`.trim();
                  }}
                  value={driverInputValue}
                  onChange={handleDriverChange}
                  inputValue={driverInputValue}
                  onInputChange={(event, newValue) => setDriverInputValue(newValue || '')}
                  disabled={entryMode === 'trip' && !!formData.tripId}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Driver Name *"
                      size="small"
                      helperText="Type name or select from list"
                      error={!formData.driverManual && !formData.driverId}
                      sx={{ mt: 1.5, '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
                    />
                  )}
                />
              </Grid>
            </Grid>
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" sx={{ fontSize: '0.95rem', fontWeight: 600, mb: 2 }}>
              <LocalGasStation sx={{ fontSize: '1.1rem', mr: 0.5, verticalAlign: 'middle' }} />
              Fuel Details
            </Typography>

            {stepErrors.length > 0 && stepErrors.map((err, i) => (
              <Alert key={i} severity="error" sx={{ mb: 1, fontSize: '0.8rem' }}>{err}</Alert>
            ))}

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                  <InputLabel sx={{ fontSize: '0.75rem' }}>Fuel Type</InputLabel>
                  <Select
                    name="fuelType"
                    value={formData.fuelType}
                    onChange={handleInputChange}
                    sx={{ fontSize: '0.8rem' }}
                  >
                    {FUEL_TYPES.map(ft => (
                      <MenuItem key={ft} value={ft} sx={{ fontSize: '0.8rem' }}>{ft}</MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  label="Quantity (L)"
                  name="quantity"
                  type="number"
                  size="small"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
                  InputProps={{
                    endAdornment: <InputAdornment position="end" sx={{ fontSize: '0.7rem' }}>L</InputAdornment>,
                    sx: { fontSize: '0.8rem' }
                  }}
                />

                <TextField
                  fullWidth
                  label="Unit Price"
                  name="unitPrice"
                  type="number"
                  size="small"
                  value={formData.unitPrice}
                  onChange={handleInputChange}
                  sx={{ mt: 1.5, '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
                  InputProps={{
                    startAdornment: <InputAdornment position="start" sx={{ fontSize: '0.7rem' }}>R</InputAdornment>,
                    endAdornment: <InputAdornment position="end" sx={{ fontSize: '0.7rem' }}>/L</InputAdornment>,
                    sx: { fontSize: '0.8rem' }
                  }}
                />

                <TextField
                  fullWidth
                  label="Total Amount"
                  name="totalAmount"
                  size="small"
                  value={formatCurrency(formData.totalAmount || calculatedTotal)}
                  sx={{ mt: 1.5, '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
                  InputProps={{
                    readOnly: true,
                    sx: { fontSize: '0.8rem', fontWeight: 600 }
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Odometer Reading (km)"
                  name="odometerReading"
                  type="number"
                  size="small"
                  value={formData.odometerReading}
                  onChange={handleInputChange}
                  sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
                  InputProps={{ sx: { fontSize: '0.8rem' } }}
                />

                <TextField
                  fullWidth
                  label="Pump Number"
                  name="pumpNumber"
                  size="small"
                  value={formData.pumpNumber}
                  onChange={handleInputChange}
                  sx={{ mt: 1.5, '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
                  InputProps={{ sx: { fontSize: '0.8rem' } }}
                />

                <TextField
                  fullWidth
                  label="Receipt Number"
                  name="receiptNumber"
                  size="small"
                  value={formData.receiptNumber}
                  onChange={handleInputChange}
                  sx={{ mt: 1.5, '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
                  InputProps={{ sx: { fontSize: '0.8rem' } }}
                />

                <TextField
                  fullWidth
                  label="Notes"
                  name="notes"
                  size="small"
                  value={formData.notes}
                  onChange={handleInputChange}
                  multiline
                  rows={2}
                  sx={{ mt: 1.5, '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
                  InputProps={{ sx: { fontSize: '0.8rem' } }}
                />
              </Grid>
            </Grid>
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" sx={{ fontSize: '0.95rem', fontWeight: 600, mb: 2 }}>
              <LocationOn sx={{ fontSize: '1.1rem', mr: 0.5, verticalAlign: 'middle' }} />
              Location & Payment
            </Typography>

            {stepErrors.length > 0 && stepErrors.map((err, i) => (
              <Alert key={i} severity="error" sx={{ mb: 1, fontSize: '0.8rem' }}>{err}</Alert>
            ))}

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Autocomplete
                  freeSolo
                  options={COMMON_STATIONS}
                  size="small"
                  value={formData.stationName}
                  onInputChange={(event, newValue) => {
                    setFormData(prev => ({ ...prev, stationName: newValue || '' }));
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Station Name"
                      size="small"
                      sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
                    />
                  )}
                />

                <Autocomplete
                  freeSolo
                  options={COMMON_LOCATIONS}
                  size="small"
                  value={formData.location}
                  onInputChange={(event, newValue) => {
                    setFormData(prev => ({ ...prev, location: newValue || '' }));
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Location"
                      size="small"
                      sx={{ mt: 1.5, '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
                    />
                  )}
                />

                <Button
                  startIcon={<MyLocation sx={{ fontSize: '0.9rem' }} />}
                  onClick={getCurrentLocation}
                  disabled={gettingLocation}
                  size="small"
                  sx={{ mt: 1.5, fontSize: '0.75rem' }}
                >
                  {gettingLocation ? 'Getting Location...' : 'Use Current Location'}
                </Button>

                {locationError && (
                  <Typography color="error" sx={{ mt: 1, fontSize: '0.75rem' }}>{locationError}</Typography>
                )}
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth size="small">
                  <InputLabel sx={{ fontSize: '0.75rem' }}>Payment Method</InputLabel>
                  <Select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                    sx={{ fontSize: '0.8rem' }}
                  >
                    {PAYMENT_METHODS.map(m => (
                      <MenuItem key={m} value={m} sx={{ fontSize: '0.8rem' }}>{m}</MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {isEdit && (
                  <Box sx={{ mt: 2 }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={formData.finalized}
                          onChange={(e) => setFormData(prev => ({ ...prev, finalized: e.target.checked }))}
                          size="small"
                        />
                      }
                      label="Finalized"
                      sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.75rem' } }}
                    />
                  </Box>
                )}
              </Grid>
            </Grid>
          </Box>
        );

      case 3:
        const selectedTrip = getSelectedTrip();
        return (
          <Box>
            <Typography variant="h6" sx={{ fontSize: '0.95rem', fontWeight: 600, mb: 2 }}>
              Review & Submit
            </Typography>

            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle2" sx={{ fontSize: '0.8rem', fontWeight: 600, mb: 1.5 }}>
                Fuel Slip Details
              </Typography>

              <Grid container spacing={1.5}>
                <Grid item xs={12} md={6}>
                  <InfoItem label="Slip Number" value={formData.slipNumber} />
                  <InfoItem label="Date" value={new Date(formData.transactionDate).toLocaleString()} />
                  <InfoItem label="Entry Mode" value={entryMode === 'trip' ? 'Trip-based' : 'Manual'} />
                  {formData.tripId && selectedTrip && (
                    <InfoItem label="Trip" value={selectedTrip.tripNumber || `Trip #${selectedTrip.id}`} />
                  )}
                  <InfoItem label="Vehicle" value={extractRegistrationNumber(formData.vehicleManual)} />
                  <InfoItem label="Driver" value={formData.driverManual} />
                </Grid>

                <Grid item xs={12} md={6}>
                  <InfoItem label="Fuel Type" value={formData.fuelType} />
                  <InfoItem label="Quantity" value={`${formData.quantity} L`} />
                  <InfoItem label="Unit Price" value={formatCurrency(formData.unitPrice)} />
                  <InfoItem label="Total" value={formatCurrency(formData.totalAmount)} />
                  <InfoItem label="Station" value={formData.stationName} />
                  <InfoItem label="Location" value={formData.location} />
                  {isEdit && <InfoItem label="Status" value={formData.finalized ? 'Finalized' : 'Pending'} />}
                </Grid>
              </Grid>
            </Paper>
          </Box>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress size={40} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 1, sm: 1.5, md: 2 } }}>
      {/* Header - Compact */}
      <Box sx={{ mb: 2 }}>
        <Button
          startIcon={<ArrowBack sx={{ fontSize: '0.9rem' }} />}
          onClick={() => navigate('/fuel/slips')}
          size="small"
          sx={{ fontSize: '0.75rem', mb: 1 }}
        >
          Back to Fuel Slips
        </Button>
        <Box display="flex" alignItems="center" gap={1.5}>
          <LocalGasStation sx={{ fontSize: 28, color: 'primary.main' }} />
          <Box>
            <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
              {isEdit ? 'Edit Fuel Slip' : 'Add New Fuel Slip'}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
              {isEdit ? 'Update fuel transaction details' : 'Record a new fuel transaction for your fleet'}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Stepper - Compact */}
      <Paper sx={{ p: 1.5, mb: 2 }}>
        <Stepper activeStep={activeStep} alternativeLabel sx={{ '& .MuiStepLabel-label': { fontSize: '0.7rem' } }}>
          {STEPS.map(label => (
            <Step key={label}><StepLabel>{label}</StepLabel></Step>
          ))}
        </Stepper>
      </Paper>

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

      {/* Form Content */}
      <Paper sx={{ p: { xs: 1.5, sm: 2 } }}>
        {fetchingData && activeStep === 0 ? (
          <Box display="flex" justifyContent="center" alignItems="center" p={3}>
            <CircularProgress size={30} />
            <Typography sx={{ ml: 2, fontSize: '0.8rem' }}>Loading data...</Typography>
          </Box>
        ) : (
          <>
            {renderStepContent()}

            {/* Navigation Buttons - Compact */}
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
              <Button
                disabled={activeStep === 0}
                onClick={handleBack}
                size="small"
                sx={{ fontSize: '0.8rem' }}
              >
                Back
              </Button>

              {activeStep < STEPS.length - 1 ? (
                <Button variant="contained" onClick={handleNext} size="small" sx={{ fontSize: '0.8rem' }}>
                  Next
                </Button>
              ) : (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSubmit}
                  disabled={loading}
                  size="small"
                  sx={{ fontSize: '0.8rem' }}
                  startIcon={loading ? <CircularProgress size={16} /> : (isEdit ? <SaveIcon /> : <CheckCircle />)}
                >
                  {loading ? 'Saving...' : (isEdit ? 'Update Slip' : 'Submit Fuel Slip')}
                </Button>
              )}
            </Box>
          </>
        )}
      </Paper>
    </Box>
  );
};

export default FuelSlipForm;
