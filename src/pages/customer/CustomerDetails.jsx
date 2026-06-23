// src/pages/customer/CustomerDetails.jsx
import React, { useState, useEffect } from 'react';
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
  IconButton,
  Tooltip,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Business as BusinessIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon,
  AttachMoney as MoneyIcon,
  LocalShipping as LocalShippingIcon,
  Route as RouteIcon,
  Receipt as ReceiptIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Pending as PendingIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { customerService } from '../../services/customerService';
import { tripService } from '../../services/tripService';
import { loadService } from '../../services/loadService';

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

// Stat Card Component
const StatCard = ({ title, value, icon: Icon, color = 'primary' }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
      <Stack direction="row" alignItems="center" spacing={1.5}>
        <Box
          sx={{
            bgcolor: `${color}.light`,
            borderRadius: 1,
            p: 0.75,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon sx={{ fontSize: '1.2rem', color: `${color}.main` }} />
        </Box>
        <Box>
          <Typography variant="h5" fontWeight="bold" sx={{ fontSize: '1.1rem' }}>
            {value}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
            {title}
          </Typography>
        </Box>
      </Stack>
    </CardContent>
  </Card>
);

// Trip List Component
const TripList = ({ trips, onViewTrip }) => {
  if (!trips || trips.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 3 }}>
        <RouteIcon sx={{ fontSize: 32, color: 'text.disabled', mb: 1 }} />
        <Typography color="text.secondary" sx={{ fontSize: '0.8rem' }}>
          No trips found for this customer
        </Typography>
      </Box>
    );
  }

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600 }}>Trip #</TableCell>
            <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600 }}>Route</TableCell>
            <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600 }}>Status</TableCell>
            <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600 }}>Start Date</TableCell>
            <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600 }}>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {trips.map((trip) => (
            <TableRow key={trip.id} hover>
              <TableCell>
                <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.75rem' }}>
                  {trip.tripNumber}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>
                  {trip.originCity || trip.originLocation} → {trip.destinationCity || trip.destinationLocation}
                </Typography>
              </TableCell>
              <TableCell>
                <Chip
                  label={trip.status}
                  color={trip.status === 'COMPLETED' ? 'success' : 
                         trip.status === 'IN_PROGRESS' ? 'warning' : 
                         trip.status === 'CANCELLED' ? 'error' : 'info'}
                  size="small"
                  sx={{ height: 20, fontSize: '0.55rem' }}
                />
              </TableCell>
              <TableCell sx={{ fontSize: '0.7rem' }}>
                {trip.plannedStartDate ? new Date(trip.plannedStartDate).toLocaleDateString() : 'N/A'}
              </TableCell>
              <TableCell>
                <Tooltip title="View Trip">
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={() => onViewTrip(trip.id)}
                    sx={{ p: 0.5 }}
                  >
                    <RouteIcon sx={{ fontSize: '0.9rem' }} />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

// Load List Component
const LoadList = ({ loads, onViewLoad }) => {
  if (!loads || loads.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 3 }}>
        <LocalShippingIcon sx={{ fontSize: 32, color: 'text.disabled', mb: 1 }} />
        <Typography color="text.secondary" sx={{ fontSize: '0.8rem' }}>
          No loads found for this customer
        </Typography>
      </Box>
    );
  }

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600 }}>Load #</TableCell>
            <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600 }}>Description</TableCell>
            <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600 }}>Status</TableCell>
            <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600 }}>Trips</TableCell>
            <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600 }}>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {loads.map((load) => (
            <TableRow key={load.id} hover>
              <TableCell>
                <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.75rem' }}>
                  {load.loadNumber}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>
                  {load.description || 'N/A'}
                </Typography>
              </TableCell>
              <TableCell>
                <Chip
                  label={load.status}
                  color={load.status === 'COMPLETED' ? 'success' : 
                         load.status === 'IN_PROGRESS' ? 'warning' : 'info'}
                  size="small"
                  sx={{ height: 20, fontSize: '0.55rem' }}
                />
              </TableCell>
              <TableCell>
                <Chip
                  label={load.tripCount || 0}
                  size="small"
                  variant="outlined"
                  sx={{ height: 18, fontSize: '0.55rem' }}
                />
              </TableCell>
              <TableCell>
                <Tooltip title="View Load">
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={() => onViewLoad(load.loadNumber)}
                    sx={{ p: 0.5 }}
                  >
                    <LocalShippingIcon sx={{ fontSize: '0.9rem' }} />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

const CustomerDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [trips, setTrips] = useState([]);
  const [loads, setLoads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [stats, setStats] = useState({
    totalTrips: 0,
    completedTrips: 0,
    activeTrips: 0,
    totalLoads: 0,
  });

  useEffect(() => {
    loadCustomerData();
  }, [id]);

  const loadCustomerData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Load customer details
      const customerData = await customerService.getCustomerById(id);
      setCustomer(customerData);

      // Load customer trips
      const tripsData = await tripService.getTripsByCustomer(id);
      const tripsList = Array.isArray(tripsData) ? tripsData : (tripsData?.content || []);
      setTrips(tripsList);

      // Load customer loads
      const loadsData = await loadService.getLoadsByCustomer(id);
      setLoads(Array.isArray(loadsData) ? loadsData : []);

      // Calculate stats
      const completed = tripsList.filter(t => t.status === 'COMPLETED').length;
      const active = tripsList.filter(t => t.status === 'IN_PROGRESS' || t.status === 'ACTIVE').length;
      setStats({
        totalTrips: tripsList.length,
        completedTrips: completed,
        activeTrips: active,
        totalLoads: Array.isArray(loadsData) ? loadsData.length : 0,
      });

    } catch (err) {
      console.error('Error loading customer data:', err);
      setError('Failed to load customer data');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this customer?')) return;
    try {
      await customerService.deleteCustomer(id);
      navigate('/customers');
    } catch (err) {
      setError('Failed to delete customer');
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const getStatusChip = (isActive) => {
    return (
      <Chip
        label={isActive ? 'Active' : 'Inactive'}
        color={isActive ? 'success' : 'error'}
        icon={isActive ? <CheckCircleIcon sx={{ fontSize: '0.8rem' }} /> : <CancelIcon sx={{ fontSize: '0.8rem' }} />}
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

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress size={40} />
        <Typography sx={{ ml: 2, fontSize: '0.9rem' }}>Loading customer details...</Typography>
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
          onClick={() => navigate('/customers')}
          sx={{ mt: 2, fontSize: '0.8rem' }}
        >
          Back to Customers
        </Button>
      </Box>
    );
  }

  if (!customer) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="warning" sx={{ fontSize: '0.8rem' }}>Customer not found</Alert>
        <Button
          variant="contained"
          size="small"
          onClick={() => navigate('/customers')}
          sx={{ mt: 2, fontSize: '0.8rem' }}
        >
          Back to Customers
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
          onClick={() => navigate('/customers')}
          size="small"
          sx={{ fontSize: '0.75rem' }}
        >
          Back to Customers
        </Button>
        <Stack direction="row" spacing={0.75}>
          <Button
            variant="outlined"
            startIcon={<EditIcon sx={{ fontSize: '0.9rem' }} />}
            onClick={() => navigate(`/customers/${id}/edit`)}
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
              {customer.name?.charAt(0) || 'C'}
            </Avatar>
            <Box sx={{ flex: 1, width: '100%' }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'flex-start', sm: 'center' }}>
                <Typography variant="h6" fontWeight="bold" sx={{ fontSize: '1rem' }}>
                  {customer.name}
                </Typography>
                {getStatusChip(customer.isActive !== false)}
                <Chip
                  label={customer.customerCode}
                  size="small"
                  variant="outlined"
                  sx={{ height: 20, fontSize: '0.6rem' }}
                />
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 0.5 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                  <strong>Email:</strong> {customer.email || 'N/A'}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                  <strong>Phone:</strong> {customer.phone || 'N/A'}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                  <strong>Payment Terms:</strong> {customer.paymentTerms || 'N/A'}
                </Typography>
              </Stack>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid item xs={6} sm={3}>
          <StatCard title="Total Trips" value={stats.totalTrips} icon={RouteIcon} color="primary" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard title="Completed" value={stats.completedTrips} icon={CheckCircleIcon} color="success" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard title="Active" value={stats.activeTrips} icon={PendingIcon} color="warning" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard title="Total Loads" value={stats.totalLoads} icon={LocalShippingIcon} color="info" />
        </Grid>
      </Grid>

      {/* Details Grid - Compact */}
      <Paper sx={{ p: { xs: 1.5, sm: 2 } }}>
        <Typography variant="subtitle1" sx={{ fontSize: '0.9rem', fontWeight: 600, mb: 2 }}>
          <BusinessIcon sx={{ mr: 0.5, fontSize: '1rem', verticalAlign: 'middle' }} />
          Customer Information
        </Typography>
        
        <Grid container spacing={1.5}>
          <Grid item xs={12} md={6}>
            <Stack spacing={1.5}>
              <InfoItem label="Customer Code" value={customer.customerCode} icon={BusinessIcon} color="primary" />
              <InfoItem label="Registration Number" value={customer.registrationNumber || 'N/A'} icon={BusinessIcon} color="secondary" />
              <InfoItem label="VAT Number" value={customer.vatNumber || 'N/A'} icon={BusinessIcon} color="info" />
              <InfoItem label="Payment Terms" value={customer.paymentTerms || 'N/A'} icon={MoneyIcon} color="warning" />
              <InfoItem label="Credit Limit" value={customer.creditLimit ? `R ${customer.creditLimit.toFixed(2)}` : 'N/A'} icon={MoneyIcon} color="error" />
            </Stack>
          </Grid>

          <Grid item xs={12} md={6}>
            <Stack spacing={1.5}>
              <InfoItem label="Email" value={customer.email || 'N/A'} icon={EmailIcon} color="primary" />
              <InfoItem label="Phone" value={customer.phone || 'N/A'} icon={PhoneIcon} color="success" />
              <InfoItem label="Contact Person" value={customer.contactPerson || 'N/A'} icon={PersonIcon} color="secondary" />
              <InfoItem label="Contact Phone" value={customer.contactPhone || 'N/A'} icon={PhoneIcon} color="info" />
              <InfoItem label="Contact Email" value={customer.contactEmail || 'N/A'} icon={EmailIcon} color="warning" />
            </Stack>
          </Grid>

          {/* Address */}
          <Grid item xs={12}>
            <Divider sx={{ my: 1.5 }} />
            <Typography variant="subtitle2" sx={{ fontSize: '0.8rem', fontWeight: 600, mb: 1.5 }}>
              <LocationIcon sx={{ mr: 0.5, fontSize: '1rem', verticalAlign: 'middle' }} />
              Address
            </Typography>
            <Grid container spacing={1.5}>
              <Grid item xs={12}>
                <InfoItem label="Address" value={customer.addressLine1 || 'N/A'} icon={LocationIcon} color="primary" />
                {customer.addressLine2 && (
                  <InfoItem label="Address Line 2" value={customer.addressLine2} icon={LocationIcon} color="secondary" />
                )}
              </Grid>
              <Grid item xs={12} md={4}>
                <InfoItem label="City" value={customer.city || 'N/A'} icon={LocationIcon} color="info" />
              </Grid>
              <Grid item xs={12} md={4}>
                <InfoItem label="Province" value={customer.province || 'N/A'} icon={LocationIcon} color="warning" />
              </Grid>
              <Grid item xs={12} md={4}>
                <InfoItem label="Postal Code" value={customer.postalCode || 'N/A'} icon={LocationIcon} color="secondary" />
              </Grid>
              <Grid item xs={12}>
                <InfoItem label="Country" value={customer.country || 'N/A'} icon={LocationIcon} color="success" />
              </Grid>
            </Grid>
          </Grid>

          {/* Notes */}
          {customer.notes && (
            <Grid item xs={12}>
              <Divider sx={{ my: 1.5 }} />
              <Typography variant="subtitle2" sx={{ fontSize: '0.8rem', fontWeight: 600, mb: 1 }}>
                Notes
              </Typography>
              <Paper variant="outlined" sx={{ p: 1.5, bgcolor: 'grey.50' }}>
                <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                  {customer.notes}
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
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>
                    <strong>Created:</strong> {customer.createdAt ? new Date(customer.createdAt).toLocaleString() : 'N/A'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
                    By: {customer.createdBy || 'N/A'}
                  </Typography>
                </Box>
                {customer.updatedAt && (
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>
                      <strong>Last Updated:</strong> {new Date(customer.updatedAt).toLocaleString()}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
                      By: {customer.updatedBy || 'N/A'}
                    </Typography>
                  </Box>
                )}
              </Stack>
            </Paper>
          </Grid>

          {/* Tabs for Trips and Loads */}
          <Grid item xs={12}>
            <Divider sx={{ my: 1.5 }} />
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs 
                value={tabValue} 
                onChange={handleTabChange}
                sx={{
                  '& .MuiTab-root': {
                    fontSize: '0.75rem',
                    minHeight: 36,
                    textTransform: 'none',
                  }
                }}
              >
                <Tab 
                  label={
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <RouteIcon sx={{ fontSize: '0.9rem' }} />
                      <span>Trips</span>
                      <Chip
                        label={stats.totalTrips}
                        size="small"
                        sx={{ height: 18, fontSize: '0.55rem', ml: 0.5 }}
                      />
                    </Stack>
                  } 
                />
                <Tab 
                  label={
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <LocalShippingIcon sx={{ fontSize: '0.9rem' }} />
                      <span>Loads</span>
                      <Chip
                        label={stats.totalLoads}
                        size="small"
                        sx={{ height: 18, fontSize: '0.55rem', ml: 0.5 }}
                      />
                    </Stack>
                  } 
                />
              </Tabs>
            </Box>
            <Box sx={{ mt: 2 }}>
              {tabValue === 0 && (
                <TripList 
                  trips={trips} 
                  onViewTrip={(tripId) => navigate(`/trips/${tripId}`)} 
                />
              )}
              {tabValue === 1 && (
                <LoadList 
                  loads={loads} 
                  onViewLoad={(loadNumber) => navigate(`/loads/${loadNumber}`)} 
                />
              )}
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default CustomerDetails;
