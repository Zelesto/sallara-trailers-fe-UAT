// src/pages/customer/CustomerList.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment,
  Stack,
  Grid,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Avatar,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import {
  Refresh,
  Search,
  Visibility,
  Add,
  Person,
  Email,
  Phone,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Close as CloseIcon,
  PersonAdd as PersonAddIcon,
  Clear as ClearIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { customerService } from '../../services/customerService';

// Stat Card Component - FIXED (no icon rendering issues)
const StatCard = ({ title, value, color = '#4F46E5', icon: Icon, subtitle }) => (
  <Card
    elevation={0}
    sx={{
      bgcolor: '#FFFFFF',
      border: '1px solid #ECECEC',
      borderRadius: '12px',
      height: '100%',
      transition: 'all 0.2s ease',
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
      },
      overflow: 'hidden',
      position: 'relative',
    }}
  >
    <CardContent sx={{ p: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography
            sx={{
              color: '#6B7280',
              fontSize: '0.7rem',
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            {title}
          </Typography>
          <Typography
            variant="h4"
            fontWeight="700"
            sx={{
              fontSize: '1.5rem',
              color: '#111827',
              mt: 0.5,
              lineHeight: 1.2,
            }}
          >
            {value}
          </Typography>
          {subtitle && (
            <Typography
              variant="caption"
              sx={{
                color: '#6B7280',
                fontSize: '0.65rem',
                display: 'block',
                mt: 0.25,
              }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>
        {Icon && (
          <Box
            sx={{
              bgcolor: `${color}15`,
              borderRadius: '10px',
              p: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon sx={{ fontSize: '1.3rem', color: color }} />
          </Box>
        )}
      </Stack>
    </CardContent>
  </Card>
);

// Status Chip Component - FIXED (removed icon)
const StatusChip = ({ status }) => {
  const isActive = status !== false;
  return (
    <Chip
      size="small"
      label={isActive ? 'Active' : 'Inactive'}
      sx={{
        fontWeight: 500,
        fontSize: '0.6rem',
        height: 22,
        bgcolor: isActive ? '#D1FAE5' : '#FEE2E2',
        color: isActive ? '#065F46' : '#991B1B',
        '& .MuiChip-label': { px: 0.5 },
      }}
    />
  );
};

const CustomerList = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const response = await customerService.getActiveCustomers();
      setCustomers(response || []);
    } catch (err) {
      console.error('Error loading customers:', err);
      setError('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterStatus('ALL');
  };

  const filteredCustomers = customers.filter(customer => {
    const search = searchTerm.toLowerCase();
    const matchesSearch = (
      (customer.name || '').toLowerCase().includes(search) ||
      (customer.customerCode || '').toLowerCase().includes(search) ||
      (customer.email || '').toLowerCase().includes(search) ||
      (customer.contactPerson || '').toLowerCase().includes(search)
    );
    const matchesStatus = filterStatus === 'ALL' || 
      (filterStatus === 'ACTIVE' && customer.isActive !== false) ||
      (filterStatus === 'INACTIVE' && customer.isActive === false);
    return matchesSearch && matchesStatus;
  });

  const hasFilters = searchTerm !== '' || filterStatus !== 'ALL';

  const stats = {
    total: customers.length,
    active: customers.filter(c => c.isActive !== false).length,
    inactive: customers.filter(c => c.isActive === false).length,
  };

  return (
    <Box sx={{ bgcolor: '#F7F7FC', minHeight: '100vh', p: { xs: 2, md: 3 } }}>
      <Box sx={{ maxWidth: '1440px', margin: '0 auto' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h5" fontWeight="700" sx={{ fontSize: '1.25rem', color: '#111827' }}>
              Customer Management
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
              Manage and monitor your customers
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<PersonAddIcon sx={{ fontSize: '1rem' }} />}
            onClick={() => navigate('/customers/new')}
            sx={{
              borderRadius: '10px',
              fontSize: '0.8rem',
              py: 1,
              px: 2.5,
              textTransform: 'none',
              fontWeight: 600,
              background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #4338CA 0%, #4F46E5 100%)',
                boxShadow: '0 4px 12px rgba(79,70,229,0.3)',
              },
            }}
          >
            Add Customer
          </Button>
        </Box>

        {/* Alerts */}
        {error && (
          <Alert
            severity="error"
            sx={{ mb: 2, borderRadius: '8px', fontSize: '0.8rem' }}
            onClose={() => setError(null)}
            icon={<WarningIcon />}
          >
            {error}
          </Alert>
        )}

        {/* Stats Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={4}>
            <StatCard
              title="Total Customers"
              value={stats.total}
              color="#4F46E5"
              icon={BusinessIcon}
            />
          </Grid>
          <Grid item xs={6} sm={4}>
            <StatCard
              title="Active"
              value={stats.active}
              color="#22C55E"
              icon={CheckCircleIcon}
              subtitle={`${stats.active > 0 ? Math.round((stats.active / stats.total) * 100) : 0}% of total`}
            />
          </Grid>
          <Grid item xs={6} sm={4}>
            <StatCard
              title="Inactive"
              value={stats.inactive}
              color="#EF4444"
              icon={CloseIcon}
              subtitle={`${stats.inactive > 0 ? Math.round((stats.inactive / stats.total) * 100) : 0}% of total`}
            />
          </Grid>
        </Grid>

        {/* Filters */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 3,
            borderRadius: '12px',
            border: '1px solid #ECECEC',
            bgcolor: '#FFFFFF',
          }}
        >
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
            <TextField
              placeholder="Search by name, code, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="small"
              sx={{
                flex: 1,
                '& .MuiInputLabel-root': { fontSize: '0.75rem' },
                '& .MuiInputBase-root': { fontSize: '0.8rem', borderRadius: '8px' },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ fontSize: '0.9rem', color: '#6B7280' }} />
                  </InputAdornment>
                ),
                endAdornment: searchTerm && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearchTerm('')} sx={{ p: 0.5 }}>
                      <ClearIcon sx={{ fontSize: '0.8rem', color: '#6B7280' }} />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel sx={{ fontSize: '0.75rem' }}>Status</InputLabel>
              <Select
                value={filterStatus}
                label="Status"
                onChange={(e) => setFilterStatus(e.target.value)}
                sx={{ fontSize: '0.75rem', borderRadius: '8px' }}
              >
                <MenuItem value="ALL" sx={{ fontSize: '0.75rem' }}>All Status</MenuItem>
                <MenuItem value="ACTIVE" sx={{ fontSize: '0.75rem' }}>Active</MenuItem>
                <MenuItem value="INACTIVE" sx={{ fontSize: '0.75rem' }}>Inactive</MenuItem>
              </Select>
            </FormControl>
            <Stack direction="row" spacing={1}>
              {hasFilters && (
                <Button
                  variant="outlined"
                  startIcon={<ClearIcon sx={{ fontSize: '0.9rem' }} />}
                  onClick={handleClearFilters}
                  size="small"
                  sx={{ fontSize: '0.75rem', py: 0.5, borderRadius: '8px' }}
                >
                  Clear Filters
                </Button>
              )}
              <Button
                variant="outlined"
                startIcon={<Refresh sx={{ fontSize: '0.9rem' }} />}
                onClick={loadCustomers}
                size="small"
                sx={{ fontSize: '0.75rem', py: 0.5, borderRadius: '8px' }}
              >
                Refresh
              </Button>
            </Stack>
          </Stack>
        </Paper>

        {/* Customer Table */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: '12px',
            border: '1px solid #ECECEC',
            overflow: 'hidden',
            bgcolor: '#FFFFFF',
          }}
        >
          <TableContainer>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#F9FAFB' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.65rem', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Customer</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.65rem', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Code</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.65rem', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Email</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.65rem', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Phone</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.65rem', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Contact</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.65rem', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.65rem', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <CircularProgress size={30} />
                      <Typography sx={{ ml: 2, fontSize: '0.9rem', color: '#6B7280' }}>
                        Loading customers...
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : filteredCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                        {hasFilters ? 'No customers match your filters' : 'No customers found'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCustomers.map((customer) => (
                    <TableRow key={customer.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar
                            sx={{
                              width: 32,
                              height: 32,
                              bgcolor: '#4F46E5',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              flexShrink: 0,
                            }}
                          >
                            {customer.name?.charAt(0) || 'C'}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.8rem', color: '#111827' }}>
                              {customer.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
                              ID: {customer.id}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={customer.customerCode}
                          size="small"
                          sx={{
                            fontWeight: 600,
                            fontSize: '0.6rem',
                            height: 20,
                            bgcolor: '#EEF2FF',
                            color: '#4F46E5',
                            borderRadius: '6px',
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          <Email sx={{ fontSize: '0.7rem', color: '#6B7280' }} />
                          <Typography variant="body2" sx={{ fontSize: '0.7rem', color: '#111827' }}>
                            {customer.email || 'N/A'}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          <Phone sx={{ fontSize: '0.7rem', color: '#6B7280' }} />
                          <Typography variant="body2" sx={{ fontSize: '0.7rem', color: '#111827' }}>
                            {customer.phone || 'N/A'}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontSize: '0.7rem', color: '#111827' }}>
                          {customer.contactPerson || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <StatusChip status={customer.isActive} />
                      </TableCell>
                      <TableCell>
                        <Tooltip title="View Details" arrow>
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/customers/${customer.id}`)}
                            sx={{
                              p: 0.5,
                              color: '#4F46E5',
                              '&:hover': { bgcolor: '#EEF2FF' },
                            }}
                          >
                            <Visibility sx={{ fontSize: '0.9rem' }} />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Footer */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2, flexWrap: 'wrap', gap: 1 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
            Showing <strong>{filteredCustomers.length}</strong> of <strong>{customers.length}</strong> customers
            {hasFilters && ' (filtered)'}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
            Last updated: {new Date().toLocaleString()}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default CustomerList;
