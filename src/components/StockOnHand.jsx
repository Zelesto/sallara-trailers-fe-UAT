// src/pages/StockOnHand.jsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Tooltip,
  Avatar,
  Button,
  Divider,
  Pagination,
} from '@mui/material';
import {
  Search,
  FilterList,
  Print,
  Download,
  Refresh,
  LocationOn,
  DirectionsCar,
  Person,
  Inventory,
  Warning,
  CheckCircle,
  Cancel,
  Lock,
} from '@mui/icons-material';
import { vehicleIssueService } from '../services/vehicleIssueService';
import { inventoryService } from '../services/inventoryService';
import { vehicleService } from '../services/vehicleService';
import { driverService } from '../services/driverService';

const StockOnHand = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stockData, setStockData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [locations, setLocations] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [categories, setCategories] = useState([]);

  // Filters
  const [filters, setFilters] = useState({
    holderType: 'ALL',
    holderId: null,
    search: '',
    category: 'ALL',
    status: 'ALL',
    showOnlyOutstanding: false,
  });

  const [pagination, setPagination] = useState({
    page: 0,
    rowsPerPage: 25,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Load stock on hand data
      const response = await vehicleIssueService.getStockOnHand(filters);
      let data = [];
      if (Array.isArray(response)) {
        data = response;
      } else if (response?.content) {
        data = response.content;
      } else if (response?.data) {
        data = Array.isArray(response.data) ? response.data : [];
      }
      setStockData(data);
      setFilteredData(data);

      // Load locations
      const locationsRes = await inventoryService.getLocations();
      setLocations(Array.isArray(locationsRes) ? locationsRes : locationsRes?.data || []);

      // Load vehicles
      const vehiclesRes = await vehicleService.getAllVehicles();
      setVehicles(Array.isArray(vehiclesRes) ? vehiclesRes : vehiclesRes?.content || []);

      // Load drivers
      const driversRes = await driverService.getAllDrivers();
      setDrivers(Array.isArray(driversRes) ? driversRes : driversRes?.content || []);

      // Extract categories
      const cats = new Set(data.map(item => item.category).filter(Boolean));
      setCategories(['ALL', ...Array.from(cats)]);

    } catch (err) {
      console.error('Error loading stock data:', err);
      setError('Failed to load stock on hand data');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...stockData];

    // Filter by holder type
    if (filters.holderType !== 'ALL') {
      filtered = filtered.filter(item => item.holderType === filters.holderType);
    }

    // Filter by holder ID
    if (filters.holderId) {
      filtered = filtered.filter(item => item.holderId === Number(filters.holderId));
    }

    // Filter by category
    if (filters.category !== 'ALL') {
      filtered = filtered.filter(item => item.category === filters.category);
    }

    // Filter by status
    if (filters.status !== 'ALL') {
      filtered = filtered.filter(item => item.status === filters.status);
    }

    // Filter by search
    if (filters.search.trim()) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(item =>
        item.itemName?.toLowerCase().includes(searchLower) ||
        item.itemSku?.toLowerCase().includes(searchLower) ||
        item.holderName?.toLowerCase().includes(searchLower) ||
        item.category?.toLowerCase().includes(searchLower)
      );
    }

    // Show only outstanding items
    if (filters.showOnlyOutstanding) {
      filtered = filtered.filter(item => item.quantityOutstanding > 0);
    }

    setFilteredData(filtered);
    setPagination(prev => ({ ...prev, page: 0 }));
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleApplyFilters = () => {
    applyFilters();
  };

  const handleClearFilters = () => {
    setFilters({
      holderType: 'ALL',
      holderId: null,
      search: '',
      category: 'ALL',
      status: 'ALL',
      showOnlyOutstanding: false,
    });
    setFilteredData(stockData);
    setPagination(prev => ({ ...prev, page: 0 }));
  };

  const getStatusChip = (status) => {
    const configs = {
      'IN_STOCK': { color: 'success', icon: <CheckCircle />, label: 'In Stock' },
      'LOW_STOCK': { color: 'warning', icon: <Warning />, label: 'Low Stock' },
      'OUT_OF_STOCK': { color: 'error', icon: <Cancel />, label: 'Out of Stock' },
      'ON_HOLD': { color: 'warning', icon: <Lock />, label: 'On Hold' },
    };
    const config = configs[status] || configs['IN_STOCK'];
    return (
      <Chip
        label={config.label}
        color={config.color}
        size="small"
        icon={config.icon}
        sx={{ height: 20, fontSize: '0.6rem' }}
      />
    );
  };

  const getHolderIcon = (type) => {
    switch (type) {
      case 'VEHICLE': return <DirectionsCar fontSize="small" />;
      case 'DRIVER': return <Person fontSize="small" />;
      case 'LOCATION':
      case 'WAREHOUSE': return <LocationOn fontSize="small" />;
      default: return <Inventory fontSize="small" />;
    }
  };

  const getHolderColor = (type) => {
    switch (type) {
      case 'VEHICLE': return '#4F46E5';
      case 'DRIVER': return '#22C55E';
      case 'LOCATION':
      case 'WAREHOUSE': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  // Pagination
  const paginatedData = useMemo(() => {
    const start = pagination.page * pagination.rowsPerPage;
    const end = start + pagination.rowsPerPage;
    return filteredData.slice(start, end);
  }, [filteredData, pagination]);

  const handlePageChange = (event, newPage) => {
    setPagination(prev => ({ ...prev, page: newPage - 1 }));
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    // Create CSV
    const headers = ['Item', 'SKU', 'Category', 'Holder', 'Type', 'Qty On Hand', 'Outstanding', 'Status', 'Condition'];
    const rows = filteredData.map(item => [
      item.itemName,
      item.itemSku || 'N/A',
      item.category || 'N/A',
      item.holderName,
      item.holderType,
      item.quantityOnHand || 0,
      item.quantityOutstanding || 0,
      item.status,
      item.condition || 'N/A'
    ]);
    
    const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stock-on-hand-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress size={40} />
        <Typography sx={{ ml: 2, fontSize: '0.9rem' }}>Loading stock data...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, bgcolor: '#F7F7FC', minHeight: '100vh' }}>
      <Box sx={{ maxWidth: '1600px', margin: '0 auto' }}>
        {/* Header */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h5" fontWeight="700" sx={{ fontSize: '1.5rem' }}>
              Stock on Hand by Location
            </Typography>
            <Typography variant="body2" color="text.secondary">
              View inventory distribution across vehicles, drivers, and locations
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={loadData}
              size="small"
              sx={{ borderRadius: '10px', textTransform: 'none' }}
            >
              Refresh
            </Button>
            <Button
              variant="outlined"
              startIcon={<Print />}
              onClick={handlePrint}
              size="small"
              sx={{ borderRadius: '10px', textTransform: 'none' }}
            >
              Print
            </Button>
            <Button
              variant="outlined"
              startIcon={<Download />}
              onClick={handleExport}
              size="small"
              sx={{ borderRadius: '10px', textTransform: 'none' }}
            >
              Export
            </Button>
          </Stack>
        </Stack>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: '12px' }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Summary Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: '12px', border: '1px solid #ECECEC' }}>
              <CardContent>
                <Typography variant="caption" color="text.secondary">Total Items</Typography>
                <Typography variant="h4" fontWeight="700">{filteredData.length}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: '12px', border: '1px solid #ECECEC' }}>
              <CardContent>
                <Typography variant="caption" color="text.secondary">Outstanding Items</Typography>
                <Typography variant="h4" fontWeight="700" color="warning.main">
                  {filteredData.filter(i => i.quantityOutstanding > 0).length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: '12px', border: '1px solid #ECECEC' }}>
              <CardContent>
                <Typography variant="caption" color="text.secondary">Vehicles</Typography>
                <Typography variant="h4" fontWeight="700" color="primary.main">
                  {new Set(filteredData.filter(i => i.holderType === 'VEHICLE').map(i => i.holderId)).size}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: '12px', border: '1px solid #ECECEC' }}>
              <CardContent>
                <Typography variant="caption" color="text.secondary">Drivers</Typography>
                <Typography variant="h4" fontWeight="700" color="success.main">
                  {new Set(filteredData.filter(i => i.holderType === 'DRIVER').map(i => i.holderId)).size}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filters */}
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            mb: 3,
            borderRadius: '16px',
            border: '1px solid #ECECEC',
            bgcolor: '#FFFFFF',
          }}
        >
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ fontSize: '0.75rem' }}>Holder Type</InputLabel>
                <Select
                  value={filters.holderType}
                  label="Holder Type"
                  onChange={(e) => handleFilterChange('holderType', e.target.value)}
                  sx={{ fontSize: '0.75rem', borderRadius: '10px' }}
                >
                  <MenuItem value="ALL">All Types</MenuItem>
                  <MenuItem value="VEHICLE">Vehicles</MenuItem>
                  <MenuItem value="DRIVER">Drivers</MenuItem>
                  <MenuItem value="LOCATION">Locations</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ fontSize: '0.75rem' }}>Status</InputLabel>
                <Select
                  value={filters.status}
                  label="Status"
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  sx={{ fontSize: '0.75rem', borderRadius: '10px' }}
                >
                  <MenuItem value="ALL">All Status</MenuItem>
                  <MenuItem value="IN_STOCK">In Stock</MenuItem>
                  <MenuItem value="LOW_STOCK">Low Stock</MenuItem>
                  <MenuItem value="OUT_OF_STOCK">Out of Stock</MenuItem>
                  <MenuItem value="ON_HOLD">On Hold</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ fontSize: '0.75rem' }}>Category</InputLabel>
                <Select
                  value={filters.category}
                  label="Category"
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  sx={{ fontSize: '0.75rem', borderRadius: '10px' }}
                >
                  <MenuItem value="ALL">All Categories</MenuItem>
                  {categories.filter(c => c !== 'ALL').map(cat => (
                    <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search by item, SKU, holder..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                sx={{ borderRadius: '10px' }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ fontSize: '0.9rem' }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Stack direction="row" spacing={1}>
                <Button
                  variant="contained"
                  onClick={handleApplyFilters}
                  size="small"
                  sx={{
                    flex: 1,
                    borderRadius: '10px',
                    textTransform: 'none',
                    fontSize: '0.75rem',
                    background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)',
                  }}
                >
                  Apply Filters
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleClearFilters}
                  size="small"
                  sx={{ borderRadius: '10px', textTransform: 'none', fontSize: '0.75rem' }}
                >
                  Clear
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </Paper>

        {/* Table */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: '16px',
            border: '1px solid #ECECEC',
            bgcolor: '#FFFFFF',
            overflow: 'hidden',
          }}
        >
          <TableContainer>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#F9FAFB' }}>
                <TableRow>
                  <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600, color: '#6B7280', py: 1.5 }}>
                    Item
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600, color: '#6B7280', py: 1.5 }}>
                    SKU
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600, color: '#6B7280', py: 1.5 }}>
                    Category
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600, color: '#6B7280', py: 1.5 }}>
                    Holder
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600, color: '#6B7280', py: 1.5 }}>
                    Type
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600, color: '#6B7280', py: 1.5 }}>
                    Qty On Hand
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600, color: '#6B7280', py: 1.5 }}>
                    Issued
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600, color: '#6B7280', py: 1.5 }}>
                    Returned
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600, color: '#6B7280', py: 1.5 }}>
                    Outstanding
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600, color: '#6B7280', py: 1.5 }}>
                    Status
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600, color: '#6B7280', py: 1.5 }}>
                    Condition
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} align="center" sx={{ py: 4 }}>
                      <Inventory sx={{ fontSize: 48, color: '#D1D5DB', mb: 2 }} />
                      <Typography color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                        No stock on hand data found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedData.map((item) => (
                    <TableRow key={`${item.id}-${item.holderId}`} hover>
                      <TableCell sx={{ fontSize: '0.75rem', py: 0.75 }}>
                        <Typography variant="body2" fontWeight="500" sx={{ fontSize: '0.75rem' }}>
                          {item.itemName}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.75rem', py: 0.75 }}>
                        <Typography variant="body2" sx={{ fontSize: '0.7rem', color: '#4F46E5' }}>
                          {item.itemSku || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.75rem', py: 0.75 }}>
                        <Chip
                          label={item.category || 'N/A'}
                          size="small"
                          variant="outlined"
                          sx={{ height: 18, fontSize: '0.55rem' }}
                        />
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.75rem', py: 0.75 }}>
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          {getHolderIcon(item.holderType)}
                          <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
                            {item.holderName}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.75rem', py: 0.75 }}>
                        <Chip
                          label={item.holderType}
                          size="small"
                          sx={{
                            height: 18,
                            fontSize: '0.55rem',
                            bgcolor: getHolderColor(item.holderType) + '20',
                            color: getHolderColor(item.holderType),
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.75rem', py: 0.75 }}>
                        <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
                          {item.quantityOnHand || 0}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.75rem', py: 0.75 }}>
                        <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                          {item.quantityIssued || 0}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.75rem', py: 0.75 }}>
                        <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                          {item.quantityReturned || 0}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.75rem', py: 0.75 }}>
                        <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 600, color: 'warning.main' }}>
                          {item.quantityOutstanding || 0}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.75rem', py: 0.75 }}>
                        {getStatusChip(item.status)}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.75rem', py: 0.75 }}>
                        <Chip
                          label={item.condition || 'N/A'}
                          size="small"
                          variant="outlined"
                          sx={{ height: 18, fontSize: '0.55rem' }}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          {filteredData.length > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <Pagination
                count={Math.ceil(filteredData.length / pagination.rowsPerPage)}
                page={pagination.page + 1}
                onChange={handlePageChange}
                color="primary"
                size="small"
                showFirstButton
                showLastButton
              />
            </Box>
          )}

          <Box sx={{ p: 2, borderTop: '1px solid #ECECEC', bgcolor: '#F9FAFB' }}>
            <Typography variant="caption" color="text.secondary">
              Showing {paginatedData.length} of {filteredData.length} records            </Typography>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default StockOnHand;
