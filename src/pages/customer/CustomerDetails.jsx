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
  LinearProgress,
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
  Close as CloseIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { customerService } from '../../services/customerService';
import { tripService } from '../../services/tripService';
import { loadService } from '../../services/loadService';

// Info Item Component
const InfoItem = ({ label, value, icon: Icon, color = '#4F46E5', isChip = false }) => (
  <Paper
    elevation={0}
    sx={{
      p: 1.5,
      bgcolor: '#F9FAFB',
      borderRadius: '10px',
      border: '1px solid #ECECEC',
      height: '100%',
    }}
  >
    <Stack direction="row" alignItems="center" spacing={1}>
      {Icon && (
        <Box
          sx={{
            bgcolor: `${color}15`,
            borderRadius: 1,
            p: 0.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon sx={{ fontSize: '1rem', color: color }} />
        </Box>
      )}
      <Box>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', fontWeight: 500 }}>
          {label}
        </Typography>
        {isChip ? (
          <Box sx={{ mt: 0.25 }}>{value}</Box>
        ) : (
          <Typography variant="body2" fontWeight="500" sx={{ fontSize: '0.8rem', color: '#111827' }}>
            {value || 'N/A'}
          </Typography>
        )}
      </Box>
    </Stack>
  </Paper>
);

// Stat Card Component
const StatCard = ({ title, value, icon: Icon, color = '#4F46E5' }) => (
  <Card
    elevation={0}
    sx={{
      height: '100%',
      border: '1px solid #ECECEC',
      borderRadius: '12px',
      transition: 'all 0.2s ease',
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
      },
    }}
  >
    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
      <Stack direction="row" alignItems="center" spacing={1.5}>
        <Box
          sx={{
            bgcolor: `${color}15`,
            borderRadius: '10px',
            p: 0.75,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon sx={{ fontSize: '1.2rem', color: color }} />
        </Box>
        <Box>
          <Typography variant="h5" fontWeight="bold" sx={{ fontSize: '1.1rem', color: '#111827' }}>
            {value}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem', fontWeight: 500 }}>
            {title}
          </Typography>
        </Box>
      </Stack>
    </CardContent>
  </Card>
);

// Status Chip Component
const StatusChip = ({ status }) => {
  const isActive = status !== false;
  return (
    <Chip
      size="small"
      label={isActive ? 'Active' : 'Inactive'}
      sx={{
        fontWeight: 600,
        fontSize: '0.7rem',
        height: 24,
        bgcolor: isActive ? '#D1FAE5' : '#FEE2E2',
        color: isActive ? '#065F46' : '#991B1B',
        '& .MuiChip-icon': { fontSize: '0.8rem' },
        '& .MuiChip-label': { px: 1 },
      }}
      icon={isActive ? <CheckCircleIcon sx={{ fontSize: '0.8rem' }} /> : <CloseIcon sx={{ fontSize: '0.8rem' }} />}
    />
  );
};

// Trip List Component
const TripList = ({ trips, onViewTrip }) => {
  if (!trips || trips.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <RouteIcon sx={{ fontSize: 40, color: '#D1D5DB', mb: 2 }} />
        <Typography color="text.secondary" sx={{ fontSize: '0.8rem' }}>
          No trips found for this customer
        </Typography>
      </Box>
    );
  }

  return (
    <TableContainer component={Paper} elevation={0} sx={{ borderRadius: '10px', border: '1px solid #ECECEC' }}>
      <Table size="small">
        <TableHead sx={{ bgcolor: '#F9FAFB' }}>
          <TableRow>
            <TableCell sx={{ fontWeight: 600, fontSize: '0.65rem', color: '#6B7280' }}>Trip #</TableCell>
            <TableCell sx={{ fontWeight: 600, fontSize: '0.65rem', color: '#6B7280' }}>Route</TableCell>
            <TableCell sx={{ fontWeight: 600, fontSize: '0.65rem', color: '#6B7280' }}>Status</TableCell>
            <TableCell sx={{ fontWeight: 600, fontSize: '0.65rem', color: '#6B7280' }}>Start Date</TableCell>
            <TableCell sx={{ fontWeight: 600, fontSize: '0.65rem', color: '#6B7280' }}>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {trips.map((trip) => (
            <TableRow key={trip.id} hover>
              <TableCell>
                <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.75rem', color: '#4F46E5' }}>
                  {trip.tripNumber}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2" sx={{ fontSize: '0.7rem', color: '#111827' }}>
                  {trip.originCity || trip.originLocation} → {trip.destinationCity || trip.destinationLocation}
                </Typography>
              </TableCell>
              <TableCell>
                <Chip
                  label={trip.status}
                  size="small"
                  sx={{
                    fontSize: '0.55rem',
                    height: 20,
                    bgcolor: trip.status === 'COMPLETED' ? '#D1FAE5' : 
                           trip.status === 'IN_PROGRESS' ? '#FEF3C7' : 
                           trip.status === 'CANCELLED' ? '#FEE2E2' : '#DBEAFE',
                    color: trip.status === 'COMPLETED' ? '#065F46' : 
                           trip.status === 'IN_PROGRESS' ? '#92400E' : 
                           trip.status === 'CANCELLED' ? '#991B1B' : '#1E40AF',
                    fontWeight: 500,
                  }}
                />
              </TableCell>
              <TableCell sx={{ fontSize: '0.7rem', color: '#111827' }}>
                {trip.plannedStartDate ? new Date(trip.plannedStartDate).toLocaleDateString() : 'N/A'}
              </TableCell>
              <TableCell>
                <Tooltip title="View Trip" arrow>
                  <IconButton
                    size="small"
                    onClick={() => onViewTrip(trip.id)}
                    sx={{
                      p: 0.5,
                      color: '#4F46E5',
                      '&:hover': { bgcolor: '#EEF2FF' },
                    }}
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
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <LocalShippingIcon sx={{ fontSize: 40, color: '#D1D5DB', mb: 2 }} />
        <Typography color="text.secondary" sx={{ fontSize: '0.8rem' }}>
          No loads found for this customer
        </Typography>
      </Box>
    );
  }

  return (
    <TableContainer component={Paper} elevation={0} sx={{ borderRadius: '10px', border: '1px solid #ECECEC' }}>
      <Table size="small">
        <TableHead sx={{ bgcolor: '#F9FAFB' }}>
          <TableRow>
            <TableCell sx={{ fontWeight: 600, fontSize: '0.65rem', color: '#6B7280' }}>Load #</TableCell>
            <TableCell sx={{ fontWeight: 600, fontSize: '0.65rem', color: '#6B7280' }}>Description</TableCell>
            <TableCell sx={{ fontWeight: 600, fontSize: '0.65rem', color: '#6B7280' }}>Status</TableCell>
            <TableCell sx={{ fontWeight: 600, fontSize: '0.65rem', color: '#6B7280' }}>Trips</TableCell>
            <TableCell sx={{ fontWeight: 600, fontSize: '0.65rem', color: '#6B7280' }}>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {loads.map((load) => (
            <TableRow key={load.id} hover>
              <TableCell>
                <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.75rem', color: '#4F46E5' }}>
                  {load.loadNumber}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2" sx={{ fontSize: '0.7rem', color: '#111827' }}>
                  {load.description || 'N/A'}
                </Typography>
              </TableCell>
              <TableCell>
                <Chip
                  label={load.status}
                  size="small"
                  sx={{
                    fontSize: '0.55rem',
                    height: 20,
                    bgcolor: load.status === 'COMPLETED' ? '#D1FAE5' : 
                           load.status === 'IN_PROGRESS' ? '#FEF3C7' : '#DBEAFE',
                    color: load.status === 'COMPLETED' ? '#065F46' : 
                           load.status === 'IN_PROGRESS' ? '#92400E' : '#1E40AF',
                    fontWeight: 500,
                  }}
                />
              </TableCell>
              <TableCell>
                <Chip
                  label={load.tripCount || 0}
                  size="small"
                  variant="outlined"
                  sx={{ height: 18, fontSize: '0.55rem', borderColor: '#E5E7EB' }}
                />
              </TableCell>
              <TableCell>
                <Tooltip title="View Load" arrow>
                  <IconButton
                    size="small"
                    onClick={() => onViewLoad(load.loadNumber)}
                    sx={{
                      p: 0.5,
                      color: '#4F46E5',
                      '&:hover': { bgcolor: '#EEF2FF' },
                    }}
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

// Main CustomerDetails Component
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
      const customerData = await customerService.getCustomerById(id);
      setCustomer(customerData);

      const tripsData = await tripService.getTripsByCustomer(id);
      const tripsList = Array.isArray(tripsData) ? tripsData : (tripsData?.content || []);
      setTrips(tripsList);

      const loadsData = await loadService.getLoadsByCustomer(id);
      setLoads(Array.isArray(loadsData) ? loadsData : []);

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
    <Box sx={{ bgcolor: '#F7F7FC', minHeight: '100vh', p: { xs: 2, md: 3 } }}>
      <Box sx={{ maxWidth: '1440px', margin: '0 auto' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
          <Button 
            startIcon={<ArrowBackIcon sx={{ fontSize: '0.9rem' }} />} 
            onClick={() => navigate('/customers')}
            size="small"
            sx={{ fontSize: '0.75rem', color: '#6B7280', '&:hover': { bgcolor: 'transparent' } }}
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

        {/* Summary Card */}
        <Card
          elevation={0}
          sx={{
            mb: 3,
            borderRadius: '16px',
            border: '1px solid #ECECEC',
            bgcolor: '#FFFFFF',
          }}
        >
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
              <Avatar
                sx={{
                  width: 72,
                  height: 72,
                  bgcolor: '#4F46E5',
                  fontSize: 28,
                  fontWeight: 600,
                  flexShrink: 0,
                  boxShadow: '0 4px 12px rgba(79,70,229,0.2)',
                }}
              >
                {customer.name?.charAt(0) || 'C'}
              </Avatar>
              <Box sx={{ flex: 1, width: '100%' }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'flex-start', sm: 'center' }}>
                  <Typography variant="h5" fontWeight="700" sx={{ fontSize: '1.1rem', color: '#111827' }}>
                    {customer.name}
                  </Typography>
                  <StatusChip status={customer.isActive} />
                  <Chip
                    label={customer.customerCode}
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: '0.6rem',
                      bgcolor: '#EEF2FF',
                      color: '#4F46E5',
                      fontWeight: 600,
                    }}
                  />
                </Stack>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 0.5 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Email sx={{ fontSize: '0.7rem' }} />
                    {customer.email || 'N/A'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Phone sx={{ fontSize: '0.7rem' }} />
                    {customer.phone || 'N/A'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <BusinessIcon sx={{ fontSize: '0.7rem' }} />
                    Payment: {customer.paymentTerms || 'N/A'}
                  </Typography>
                </Stack>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={3}>
            <StatCard title="Total Trips" value={stats.totalTrips} icon={RouteIcon} color="#4F46E5" />
          </Grid>
          <Grid item xs={6} sm={3}>
            <StatCard title="Completed" value={stats.completedTrips} icon={CheckCircleIcon} color="#22C55E" />
          </Grid>
          <Grid item xs={6} sm={3}>
            <StatCard title="Active" value={stats.activeTrips} icon={PendingIcon} color="#F59E0B" />
          </Grid>
          <Grid item xs={6} sm={3}>
            <StatCard title="Total Loads" value={stats.totalLoads} icon={LocalShippingIcon} color="#3B82F6" />
          </Grid>
        </Grid>

        {/* Details */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, sm: 3 },
            borderRadius: '16px',
            border: '1px solid #ECECEC',
            bgcolor: '#FFFFFF',
          }}
        >
          <Typography variant="subtitle1" sx={{ fontSize: '0.9rem', fontWeight: 600, color: '#111827', mb: 2 }}>
            <BusinessIcon sx={{ mr: 0.5, fontSize: '1rem', verticalAlign: 'middle', color: '#4F46E5' }} />
            Customer Information
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Stack spacing={2}>
                <InfoItem label="Customer Code" value={customer.customerCode} icon={BusinessIcon} color="#4F46E5" />
                <InfoItem label="Registration Number" value={customer.registrationNumber || 'N/A'} icon={BusinessIcon} color="#6B7280" />
                <InfoItem label="VAT Number" value={customer.vatNumber || 'N/A'} icon={BusinessIcon} color="#3B82F6" />
                <InfoItem label="Payment Terms" value={customer.paymentTerms || 'N/A'} icon={MoneyIcon} color="#F59E0B" />
                <InfoItem label="Credit Limit" value={customer.creditLimit ? `R ${customer.creditLimit.toFixed(2)}` : 'N/A'} icon={MoneyIcon} color="#EF4444" />
              </Stack>
            </Grid>

            <Grid item xs={12} md={6}>
              <Stack spacing={2}>
                <InfoItem label="Email" value={customer.email || 'N/A'} icon={EmailIcon} color="#4F46E5" />
                <InfoItem label="Phone" value={customer.phone || 'N/A'} icon={PhoneIcon} color="#22C55E" />
                <InfoItem label="Contact Person" value={customer.contactPerson || 'N/A'} icon={PersonIcon} color="#6B7280" />
                <InfoItem label="Contact Phone" value={customer.contactPhone || 'N/A'} icon={PhoneIcon} color="#3B82F6" />
                <InfoItem label="Contact Email" value={customer.contactEmail || 'N/A'} icon={EmailIcon} color="#F59E0B" />
              </Stack>
            </Grid>

            {/* Address */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#111827', mb: 2 }}>
                <LocationIcon sx={{ mr: 0.5, fontSize: '1rem', verticalAlign: 'middle', color: '#4F46E5' }} />
                Address
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <InfoItem label="Address" value={customer.addressLine1 || 'N/A'} icon={LocationIcon} color="#4F46E5" />
                  {customer.addressLine2 && (
                    <InfoItem label="Address Line 2" value={customer.addressLine2} icon={LocationIcon} color="#6B7280" />
                  )}
                </Grid>
                <Grid item xs={12} md={4}>
                  <InfoItem label="City" value={customer.city || 'N/A'} icon={LocationIcon} color="#3B82F6" />
                </Grid>
                <Grid item xs={12} md={4}>
                  <InfoItem label="Province" value={customer.province || 'N/A'} icon={LocationIcon} color="#F59E0B" />
                </Grid>
                <Grid item xs={12} md={4}>
                  <InfoItem label="Postal Code" value={customer.postalCode || 'N/A'} icon={LocationIcon} color="#6B7280" />
                </Grid>
                <Grid item xs={12}>
                  <InfoItem label="Country" value={customer.country || 'N/A'} icon={LocationIcon} color="#22C55E" />
                </Grid>
              </Grid>
            </Grid>

            {/* Notes */}
            {customer.notes && (
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#111827', mb: 1 }}>
                  Notes
                </Typography>
                <Paper
                  elevation={0}
                  sx={{
                    p: 1.5,
                    bgcolor: '#F9FAFB',
                    borderRadius: '10px',
                    border: '1px solid #ECECEC',
                  }}
                >
                  <Typography variant="body2" sx={{ fontSize: '0.8rem', color: '#111827' }}>
                    {customer.notes}
                  </Typography>
                </Paper>
              </Grid>
            )}

            {/* Audit Trail */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#111827', mb: 1 }}>
                Audit Trail
              </Typography>
              <Paper
                elevation={0}
                sx={{
                  p: 1.5,
                  bgcolor: '#F9FAFB',
                  borderRadius: '10px',
                  border: '1px solid #ECECEC',
                }}
              >
                <Stack spacing={0.5}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap">
                    <Typography variant="caption" sx={{ fontSize: '0.65rem', color: '#111827' }}>
                      <strong>Created:</strong> {customer.createdAt ? new Date(customer.createdAt).toLocaleString() : 'N/A'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
                      By: {customer.createdBy || 'N/A'}
                    </Typography>
                  </Box>
                  {customer.updatedAt && (
                    <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap">
                      <Typography variant="caption" sx={{ fontSize: '0.65rem', color: '#111827' }}>
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
              <Divider sx={{ my: 2 }} />
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs 
                  value={tabValue} 
                  onChange={handleTabChange}
                  sx={{
                    '& .MuiTab-root': {
                      fontSize: '0.75rem',
                      minHeight: 36,
                      textTransform: 'none',
                      color: '#6B7280',
                      '&.Mui-selected': {
                        color: '#4F46E5',
                        fontWeight: 600,
                      },
                    },
                    '& .MuiTabs-indicator': {
                      backgroundColor: '#4F46E5',
                      height: 3,
                      borderRadius: '3px 3px 0 0',
                    },
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
                          sx={{ 
                            height: 18, 
                            fontSize: '0.55rem', 
                            ml: 0.5,
                            bgcolor: '#EEF2FF',
                            color: '#4F46E5',
                            fontWeight: 600,
                          }}
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
                          sx={{ 
                            height: 18, 
                            fontSize: '0.55rem', 
                            ml: 0.5,
                            bgcolor: '#EEF2FF',
                            color: '#4F46E5',
                            fontWeight: 600,
                          }}
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
    </Box>
  );
};

export default CustomerDetails;
