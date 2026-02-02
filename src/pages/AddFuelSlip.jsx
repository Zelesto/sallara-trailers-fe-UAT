// src/pages/AddFuelSlip.jsx - COMPLETE FIXED VERSION
import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, TextField, Button, Grid, Card, CardContent,
  MenuItem, Select, InputLabel, FormControl, Alert, Stepper, Step, StepLabel,
  IconButton, Autocomplete, InputAdornment, Radio, RadioGroup, FormControlLabel,
  FormLabel, CircularProgress
} from '@mui/material';
import {
  LocalGasStation, DirectionsCar, Person, LocationOn, ArrowBack,
  MyLocation, LocalOffer
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { fuelService } from '../services/fuelService';
import { vehicleService } from '../services/vehicleService';
import { driverService } from '../services/driverService';
import {tripService} from '../services/tripService';

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

  // If it's just a registration number (e.g., ABC123GP)
  if (/^[A-Z0-9]{3,10}$/i.test(input.trim())) {
    return input.trim().toUpperCase();
  }

  // If it's in format "ABC123GP - Volvo FH16"
  const match = input.match(/^([A-Z0-9]{3,10})/i);
  if (match) {
    return match[1].toUpperCase();
  }

  // If we can't extract, return the first word
  return input.split(' ')[0].toUpperCase();
};

const AddFuelSlip = () => {
  const navigate = useNavigate();

  // State
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeStep, setActiveStep] = useState(0);
  const [stepErrors, setStepErrors] = useState([]);

  // Data state
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [trips, setTrips] = useState([]);
  const [fuelAccounts, setFuelAccounts] = useState([]);

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
    accountId: '',
    receiptNumber: '',
    notes: ''
  });

  // UI state
  const [calculatedTotal, setCalculatedTotal] = useState(0);
  const [entryMode, setEntryMode] = useState('manual');
  const [gettingLocation, setGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [vehicleInputValue, setVehicleInputValue] = useState('');
  const [driverInputValue, setDriverInputValue] = useState('');

  // Initialize slip number
  useEffect(() => {
    if (!formData.slipNumber) {
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

  const fetchAllData = async () => {
    try {
      setFetchingData(true);

      // Fetch all data in parallel
      const [vehiclesData, driversData, tripsData] = await Promise.all([
        vehicleService.getAllVehicles(),
        driverService.getAllDrivers(),
        tripService.getAllTrips()
      ]);

      console.log('Data loaded:', {
        vehicles: vehiclesData?.length || 0,
        drivers: driversData?.length || 0,
        trips: tripsData?.length || 0
      });

      // DEBUG: Check first trip structure
      if (tripsData && tripsData[0]) {
        console.log('First trip structure:', tripsData[0]);
        console.log('Trip keys:', Object.keys(tripsData[0]));
        console.log('Trip vehicle:', tripsData[0].vehicle);
        console.log('Trip driver:', tripsData[0].driver);
      }

      // Helper function to extract data
      const extractData = (response) => {
        if (!response) return [];

        // If it's already an array
        if (Array.isArray(response)) return response;

        // If it has a data property that's an array
        if (response.data && Array.isArray(response.data)) return response.data;

        // If it has a content property that's an array
        if (response.content && Array.isArray(response.content)) return response.content;

        // If it has a results property that's an array
        if (response.results && Array.isArray(response.results)) return response.results;

        // Try to convert object values to array
        if (typeof response === 'object' && !Array.isArray(response)) {
          return Object.values(response);
        }

        return [];
      };

      const vehiclesList = extractData(vehiclesData);
      const driversList = extractData(driversData);
      const tripsList = extractData(tripsData);

      console.log('Active trips:', tripsList.filter(t =>
        t.status === 'ACTIVE' || t.status === 'IN_PROGRESS' || t.status === 'PLANNED'
      ));

      setVehicles(vehiclesList);
      setDrivers(driversList);
      setTrips(tripsList);

    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load some data. You can still continue with manual entry.');
    } finally {
      setFetchingData(false);
    }
  };

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
      // Find the selected trip - use strict equality
      const selectedTrip = trips.find(t => t.id && t.id.toString() === tripId.toString());
      console.log('Selected trip object:', selectedTrip);

      if (!selectedTrip) {
        setError('Selected trip not found');
        return;
      }

      // Prepare new form data
      let newFormData = { ...formData, tripId };
      let newVehicleValue = '';
      let newDriverValue = '';

      // METHOD 1: If trip has vehicle/driver IDs directly
      if (selectedTrip.vehicleId) {
        const vehicle = vehicles.find(v => v.id && v.id.toString() === selectedTrip.vehicleId.toString());
        if (vehicle) {
          console.log('Found vehicle by ID:', vehicle);
          newFormData.vehicleId = vehicle.id;
          newFormData.vehicleManual = vehicle.registrationNumber || vehicle.regNumber || vehicle.plateNumber || '';
          newVehicleValue = `${newFormData.vehicleManual} - ${vehicle.make || ''} ${vehicle.model || ''}`.trim();
        }
      }
      // METHOD 2: If trip has vehicle object embedded
      else if (selectedTrip.vehicle && selectedTrip.vehicle.id) {
        const vehicle = selectedTrip.vehicle;
        console.log('Found vehicle in trip object:', vehicle);
        newFormData.vehicleId = vehicle.id;
        newFormData.vehicleManual = vehicle.registrationNumber || vehicle.regNumber || vehicle.plateNumber || '';
        newVehicleValue = `${newFormData.vehicleManual} - ${vehicle.make || ''} ${vehicle.model || ''}`.trim();
      }
      // METHOD 3: If trip has vehicle registration string
      else if (selectedTrip.vehicleRegistration) {
        console.log('Trip has vehicleRegistration:', selectedTrip.vehicleRegistration);
        newFormData.vehicleManual = selectedTrip.vehicleRegistration;

        // Try to find matching vehicle - more flexible matching
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

      // Similar logic for driver
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

        // Try to find matching driver - more flexible matching
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

      // Update state
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

    // Clear all fields when changing mode
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
    console.log('Vehicle change:', newValue);

    let newVehicleId = '';
    let newVehicleManual = '';
    let newVehicleInputValue = '';

    if (newValue && typeof newValue === 'object') {
      // Selected from dropdown
      newVehicleId = newValue.id;
      newVehicleManual = newValue.registrationNumber || newValue.regNumber || newValue.plateNumber || '';
      newVehicleInputValue = `${newVehicleManual} - ${newValue.make || ''} ${newValue.model || ''}`.trim();
    } else if (typeof newValue === 'string') {
      // Manual typing
      newVehicleManual = extractRegistrationNumber(newValue);
      newVehicleInputValue = newValue;
    } else {
      // Cleared
      newVehicleManual = '';
      newVehicleInputValue = '';
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
    console.log('Driver change:', newValue);

    let newDriverId = '';
    let newDriverManual = '';
    let newDriverInputValue = '';

    if (newValue && typeof newValue === 'object') {
      // Selected from dropdown
      newDriverId = newValue.id;
      newDriverManual = newValue.fullName || `${newValue.firstName || ''} ${newValue.lastName || ''}`.trim();
      newDriverInputValue = newDriverManual;
    } else if (typeof newValue === 'string') {
      // Manual typing
      newDriverManual = newValue;
      newDriverInputValue = newValue;
    } else {
      // Cleared
      newDriverManual = '';
      newDriverInputValue = '';
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
      return setLocationError('Geolocation not supported');
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
  // In handleSubmit function - Update the payload preparation
  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      // Ensure we have clean registration number
      const vehicleRegistration = extractRegistrationNumber(formData.vehicleManual);

      if (!vehicleRegistration) {
        setError('Please enter a valid vehicle registration number');
        setLoading(false);
        return;
      }

      // Prepare payload - ENHANCED VERSION
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
        // NEW: Add these fields
        tripId: formData.tripId || null,
        odometerReading: formData.odometerReading ? parseFloat(formData.odometerReading) : null,
        pumpNumber: formData.pumpNumber || null,
        receiptNumber: formData.receiptNumber || null,
        notes: formData.notes || null,
        vehicleId: formData.vehicleId || null,
        driverId: formData.driverId || null
      };

      console.log('Submitting ENHANCED fuel slip:', payload);

      // Call the API
      const response = await fuelService.createFuelSlip(payload);
      console.log('Fuel slip created:', response);

      setSuccess('Fuel slip created successfully!');
      setTimeout(() => navigate('/fuel/slips'), 2000);

    } catch (err) {
      console.error('Error creating fuel slip:', err);
      console.error('Error details:', err.response?.data || err.message);
      setError(err.message || 'Failed to create fuel slip');
    } finally {
      setLoading(false);
    }
  };

  // Available trips filter (active and in progress)
  const availableTrips = trips.filter(t =>
    t.status === 'ACTIVE' || t.status === 'IN_PROGRESS' || t.status === 'PLANNED'
  );

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
            <Typography variant="h5" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Person /> Basic Information
            </Typography>

            <Card sx={{ mb: 3 }}>
              <CardContent>
                <FormControl component="fieldset">
                  <FormLabel component="legend">Select Entry Mode</FormLabel>
                  <RadioGroup row value={entryMode} onChange={handleEntryModeChange}>
                    <FormControlLabel value="manual" control={<Radio />} label="Manual Entry" />
                    <FormControlLabel value="trip" control={<Radio />} label="Select Active Trip" />
                  </RadioGroup>
                </FormControl>
              </CardContent>
            </Card>

            {entryMode === 'trip' && (
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Trip</InputLabel>
                <Select
                  value={formData.tripId}
                  onChange={(e) => handleTripSelection(e.target.value)}
                  label="Trip"
                  renderValue={(selected) => {
                    const trip = availableTrips.find(t => t.id && t.id.toString() === selected.toString());
                    return trip
                      ? `${trip.tripNumber || `Trip #${trip.id}`} - ${trip.vehicleRegistration || 'No vehicle'}`
                      : '-- Select a Trip --';
                  }}
                >
                  <MenuItem value="">-- Select a Trip --</MenuItem>
                  {availableTrips.map(trip => (
                    <MenuItem key={trip.id} value={trip.id}>
                      {`${trip.tripNumber || `Trip #${trip.id}`} - ${trip.originLocation || 'Origin'} → ${trip.destinationLocation || 'Destination'}`}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Slip Number"
                  name="slipNumber"
                  value={formData.slipNumber}
                  onChange={handleInputChange}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setFormData(prev => ({ ...prev, slipNumber: generateSlipNumber() }))}>
                          <LocalOffer />
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Transaction Date & Time"
                  type="datetime-local"
                  name="transactionDate"
                  value={formData.transactionDate}
                  onChange={handleInputChange}
                  InputLabelProps={{ shrink: true }}
                  sx={{ mb: 2 }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Autocomplete
                  freeSolo
                  options={vehicles}
                  getOptionLabel={(option) => {
                    if (typeof option === 'string') return option;
                    return `${option.registrationNumber || option.regNumber || option.plateNumber || ''} - ${option.make || ''} ${option.model || ''}`.trim();
                  }}
                  value={vehicleInputValue}
                  onChange={handleVehicleChange}
                  inputValue={vehicleInputValue}
                  onInputChange={(event, newValue) => {
                    setVehicleInputValue(newValue);
                  }}
                  disabled={entryMode === 'trip' && !!formData.tripId}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Vehicle Registration *"
                      helperText="Type registration number or select from list"
                      error={!formData.vehicleManual && !formData.vehicleId}
                    />
                  )}
                  sx={{ mb: 2 }}
                />

                <Autocomplete
                  freeSolo
                  options={drivers}
                  getOptionLabel={(option) => {
                    if (typeof option === 'string') return option;
                    return option.fullName || `${option.firstName || ''} ${option.lastName || ''}`.trim();
                  }}
                  value={driverInputValue}
                  onChange={handleDriverChange}
                  inputValue={driverInputValue}
                  onInputChange={(event, newValue) => {
                    setDriverInputValue(newValue);
                  }}
                  disabled={entryMode === 'trip' && !!formData.tripId}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Driver Name *"
                      helperText="Type name or select from list"
                      error={!formData.driverManual && !formData.driverId}
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
            <Typography variant="h5" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
              <LocalGasStation /> Fuel Details
            </Typography>

            {stepErrors.length > 0 && stepErrors.map((err, i) => (
              <Alert key={i} severity="error" sx={{ mb: 1 }}>{err}</Alert>
            ))}

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Fuel Type</InputLabel>
                  <Select
                    name="fuelType"
                    value={formData.fuelType}
                    onChange={handleInputChange}
                  >
                    {FUEL_TYPES.map(ft => (
                      <MenuItem key={ft} value={ft}>{ft}</MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  label="Quantity (L)"
                  name="quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">L</InputAdornment>
                  }}
                  sx={{ mb: 2 }}
                />

                <TextField
                  fullWidth
                  label="Unit Price"
                  name="unitPrice"
                  type="number"
                  value={formData.unitPrice}
                  onChange={handleInputChange}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">R</InputAdornment>,
                    endAdornment: <InputAdornment position="end">/L</InputAdornment>
                  }}
                  sx={{ mb: 2 }}
                />

                <TextField
                  fullWidth
                  label="Total Amount"
                  name="totalAmount"
                  value={formatCurrency(formData.totalAmount || calculatedTotal)}
                  InputProps={{ readOnly: true }}
                  sx={{ mb: 2 }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Odometer Reading (km)"
                  name="odometerReading"
                  type="number"
                  value={formData.odometerReading}
                  onChange={handleInputChange}
                  sx={{ mb: 2 }}
                />

                <TextField
                  fullWidth
                  label="Pump Number"
                  name="pumpNumber"
                  value={formData.pumpNumber}
                  onChange={handleInputChange}
                  sx={{ mb: 2 }}
                />

                <TextField
                  fullWidth
                  label="Receipt Number"
                  name="receiptNumber"
                  value={formData.receiptNumber}
                  onChange={handleInputChange}
                  sx={{ mb: 2 }}
                />

                <TextField
                  fullWidth
                  label="Notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  multiline
                  rows={2}
                  sx={{ mb: 2 }}
                />
              </Grid>
            </Grid>
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h5" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
              <LocationOn /> Location & Payment
            </Typography>

            {stepErrors.length > 0 && stepErrors.map((err, i) => (
              <Alert key={i} severity="error" sx={{ mb: 1 }}>{err}</Alert>
            ))}

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Autocomplete
                  freeSolo
                  options={COMMON_STATIONS}
                  value={formData.stationName}
                  onInputChange={(event, newValue) => {
                    setFormData(prev => ({ ...prev, stationName: newValue }));
                  }}
                  renderInput={(params) => (
                    <TextField {...params} label="Station Name" sx={{ mb: 2 }} />
                  )}
                />

                <Autocomplete
                  freeSolo
                  options={COMMON_LOCATIONS}
                  value={formData.location}
                  onInputChange={(event, newValue) => {
                    setFormData(prev => ({ ...prev, location: newValue }));
                  }}
                  renderInput={(params) => (
                    <TextField {...params} label="Location" sx={{ mb: 2 }} />
                  )}
                />

                <Button
                  startIcon={<MyLocation />}
                  onClick={getCurrentLocation}
                  disabled={gettingLocation}
                  sx={{ mb: 2 }}
                >
                  {gettingLocation ? 'Getting Location...' : 'Use Current Location'}
                </Button>

                {locationError && (
                  <Typography color="error" sx={{ mt: 1 }}>{locationError}</Typography>
                )}
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Payment Method</InputLabel>
                  <Select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                  >
                    {PAYMENT_METHODS.map(m => (
                      <MenuItem key={m} value={m}>{m}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        );

      case 3:
        const selectedTrip = getSelectedTrip();
        return (
          <Box>
            <Typography variant="h5" sx={{ mb: 3 }}>Review & Submit</Typography>

            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>Fuel Slip Details</Typography>

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography><strong>Slip Number:</strong> {formData.slipNumber}</Typography>
                  <Typography><strong>Date:</strong> {new Date(formData.transactionDate).toLocaleString()}</Typography>
                  <Typography><strong>Entry Mode:</strong> {entryMode === 'trip' ? 'Trip-based' : 'Manual'}</Typography>
                  {formData.tripId && selectedTrip && (
                    <Typography><strong>Trip:</strong> {selectedTrip.tripNumber || `Trip #${selectedTrip.id}`}</Typography>
                  )}
                  <Typography><strong>Vehicle:</strong> {extractRegistrationNumber(formData.vehicleManual)}</Typography>
                  <Typography><strong>Driver:</strong> {formData.driverManual}</Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography><strong>Fuel Type:</strong> {formData.fuelType}</Typography>
                  <Typography><strong>Quantity:</strong> {formData.quantity} L</Typography>
                  <Typography><strong>Unit Price:</strong> {formatCurrency(formData.unitPrice)}</Typography>
                  <Typography><strong>Total:</strong> {formatCurrency(formData.totalAmount)}</Typography>
                  <Typography><strong>Station:</strong> {formData.stationName}</Typography>
                  <Typography><strong>Location:</strong> {formData.location}</Typography>
                </Grid>
              </Grid>
            </Paper>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/fuel/slips')} sx={{ mb: 2 }}>
          Back to Fuel Slips
        </Button>
        <Box display="flex" alignItems="center" gap={2}>
          <LocalGasStation sx={{ fontSize: 40, color: 'primary.main' }} />
          <Box>
            <Typography variant="h4">Add New Fuel Slip</Typography>
            <Typography variant="body1" color="text.secondary">
              Record a new fuel transaction for your fleet
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Stepper */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {STEPS.map(label => (
            <Step key={label}><StepLabel>{label}</StepLabel></Step>
          ))}
        </Stepper>
      </Paper>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Form Content */}
      <Paper sx={{ p: 3 }}>
        {fetchingData && activeStep === 0 ? (
          <Box display="flex" justifyContent="center" alignItems="center" p={3}>
            <CircularProgress />
            <Typography sx={{ ml: 2 }}>Loading data...</Typography>
          </Box>
        ) : (
          <>
            {renderStepContent()}

            {/* Navigation Buttons */}
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
              <Button disabled={activeStep === 0} onClick={handleBack}>
                Back
              </Button>

              {activeStep < STEPS.length - 1 ? (
                <Button variant="contained" onClick={handleNext}>
                  Next
                </Button>
              ) : (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSubmit}
                  disabled={loading}
                  startIcon={loading && <CircularProgress size={20} />}
                >
                  {loading ? 'Submitting...' : 'Submit Fuel Slip'}
                </Button>
              )}
            </Box>
          </>
        )}
      </Paper>

      {/* TEMPORARY DEBUG SECTION */}
      <Paper sx={{ p: 2, mt: 3, bgcolor: '#f5f5f5' }}>
        <Typography variant="h6" gutterBottom>Debug Info:</Typography>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Typography><strong>Form Data:</strong></Typography>
            <pre style={{ fontSize: '12px' }}>
              {JSON.stringify({
                tripId: formData.tripId,
                vehicleId: formData.vehicleId,
                driverId: formData.driverId,
                vehicleManual: formData.vehicleManual,
                driverManual: formData.driverManual
              }, null, 2)}
            </pre>
          </Grid>
          <Grid item xs={6}>
            <Typography><strong>Selected Trip:</strong></Typography>
            <pre style={{ fontSize: '12px' }}>
              {JSON.stringify(getSelectedTrip(), null, 2)}
            </pre>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default AddFuelSlip;