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
} from '@mui/material';
import {
  Refresh,
  Search,
  Visibility,
  Add,
  Person,
  Email,
  Phone,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { customerService } from '../../services/customerService';

const CustomerList = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

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

  const filteredCustomers = customers.filter(customer => {
    const search = searchTerm.toLowerCase();
    return (
      (customer.name || '').toLowerCase().includes(search) ||
      (customer.customerCode || '').toLowerCase().includes(search) ||
      (customer.email || '').toLowerCase().includes(search)
    );
  });

  return (
    <Box sx={{ p: { xs: 1, sm: 1.5, md: 2 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Typography variant="h6" fontWeight="600" sx={{ fontSize: '1rem' }}>
            <Person sx={{ mr: 0.5, verticalAlign: 'middle', fontSize: '1.2rem' }} />
            Customers
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
            Manage your customers
          </Typography>
        </Box>
        <Stack direction="row" spacing={0.75}>
          <Button
            variant="outlined"
            startIcon={<Refresh sx={{ fontSize: '0.9rem' }} />}
            onClick={loadCustomers}
            size="small"
            sx={{ fontSize: '0.75rem' }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<Add sx={{ fontSize: '0.9rem' }} />}
            onClick={() => navigate('/customers/new')}
            size="small"
            sx={{ fontSize: '0.75rem' }}
          >
            New Customer
          </Button>
        </Stack>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2, fontSize: '0.8rem' }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Paper sx={{ p: 1.5, mb: 2 }}>
        <TextField
          fullWidth
          placeholder="Search customers..."
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ fontSize: '0.9rem' }} />
              </InputAdornment>
            ),
          }}
        />
      </Paper>

      {/* Customer Table */}
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600 }}>Code</TableCell>
              <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600 }}>Name</TableCell>
              <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600 }}>Email</TableCell>
              <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600 }}>Phone</TableCell>
              <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={30} />
                </TableCell>
              </TableRow>
            ) : filteredCustomers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                  <Typography color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                    No customers found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredCustomers.map((customer) => (
                <TableRow key={customer.id} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>
                      {customer.customerCode}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                      {customer.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <Email sx={{ fontSize: '0.7rem', color: 'text.secondary' }} />
                      <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>
                        {customer.email || 'N/A'}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <Phone sx={{ fontSize: '0.7rem', color: 'text.secondary' }} />
                      <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>
                        {customer.phone || 'N/A'}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={customer.isActive ? 'Active' : 'Inactive'}
                      color={customer.isActive ? 'success' : 'error'}
                      size="small"
                      sx={{ height: 20, fontSize: '0.55rem' }}
                    />
                  </TableCell>
                  <TableCell>
                    <Tooltip title="View Details">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => navigate(`/customers/${customer.id}`)}
                        sx={{ p: 0.5 }}
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
    </Box>
  );
};

export default CustomerList;
