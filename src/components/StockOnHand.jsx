// src/components/StockOnHand.jsx
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
  Collapse,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  Search,
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
  ExpandMore,
  ExpandLess,
  QrCode,
  Category,
} from '@mui/icons-material';
import { vehicleIssueService } from '../services/vehicleIssueService';
import { vehicleService } from '../services/vehicleService';
import { driverService } from '../services/driverService';

// Stat Card Component
const StatCard = ({ title, value, icon: Icon, color = 'primary' }) => {
  const getColor = (colorName) => {
    const colors = {
      primary: '#4F46E5',
      success: '#22C55E',
      warning: '#F59E0B',
      error: '#EF4444',
      info: '#3B82F6',
    };
    return colors[colorName] || '#4F46E5';
  };

  const getColorBg = (color) => {
    const bgColors = {
      primary: '#EEF2FF',
      success: '#D1FAE5',
      warning: '#FEF3C7',
      error: '#FEE2E2',
      info: '#DBEAFE',
    };
    return bgColors[color] || bgColors.primary;
  };

  const iconColor = getColor(color);
  const bgColor = getColorBg(color);
  const SafeIcon = Icon || Inventory;

  return (
    <Card
      sx={{
        bgcolor: '#FFFFFF',
        borderRadius: '16px',
        border: '1px solid #ECECEC',
        transition: 'all 0.3s',
        height: '100%',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
        },
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase' }}>
              {title}
            </Typography>
            <Typography variant="h4" fontWeight="700" sx={{ fontSize: '1.6rem' }}>
              {value || 0}
            </Typography>
          </Box>
          <Box
            sx={{
              bgcolor: bgColor,
              borderRadius: '14px',
              p: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <SafeIcon sx={{ color: iconColor, fontSize: '1.6rem' }} />
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
};

const StockOnHand = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stockData, setStockData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [expandedHolders, setExpandedHolders] = useState({});

  // Filters
  const [filters, setFilters] = useState({
    holderType: 'ALL',
    holderId: null,
    search: '',
    category: 'ALL',
    status: 'ALL',
  });

  const [pagination, setPagination] = useState({
    page: 0,
    rowsPerPage: 20,
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [stockData, filters]);

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

      // Load vehicles
      try {
        const vehiclesRes = await vehicleService.getAllVehicles();
        const vehs = Array.isArray(vehiclesRes) ? vehiclesRes : vehiclesRes?.content || [];
        setVehicles(vehs);
      } catch (err) {
        console.warn('Could not load vehicles:', err);
      }

      // Load drivers
      try {
        const driversRes = await driverService.getAllDrivers();
        const drvs = Array.isArray(driversRes) ? driversRes : driversRes?.content || [];
        setDrivers(drvs);
      } catch (err) {
        console.warn('Could not load drivers:', err);
      }

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

    if (filters.holderType !== 'ALL') {
      filtered = filtered.filter(item => item.holderType === filters.holderType);
    }

    if (filters.holderId) {
      filtered = filtered.filter(item => item.holderId === Number(filters.holderId));
    }

    if (filters.category !== 'ALL') {
      filtered = filtered.filter(item => item.category === filters.category);
    }

    if (filters.status !== 'ALL') {
      filtered = filtered.filter(item => item.status === filters.status);
    }

    if (filters.search.trim()) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(item =>
        item.itemName?.toLowerCase().includes(searchLower) ||
        item.itemSku?.toLowerCase().includes(searchLower) ||
        item.holderIdentifier?.toLowerCase().includes(searchLower) ||
        item.category?.toLowerCase().includes(searchLower)
      );
    }

    setFilteredData(filtered);
    setPagination(prev => ({ ...prev, page: 0 }));
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleClearFilters = () => {
    setFilters({
      holderType: 'ALL',
      holderId: null,
      search: '',
      category: 'ALL',
      status: 'ALL',
    });
    setFilteredData(stockData);
    setPagination(prev => ({ ...prev, page: 0 }));
  };

  const toggleHolder = (holderKey) => {
    setExpandedHolders(prev => ({
      ...prev,
      [holderKey]: !prev[holderKey]
    }));
  };

  const getStatusChip = (status) => {
    const configs = {
      'IN_STOCK': { color: 'success', icon: <CheckCircle />, label: 'In Stock' },
      'LOW_STOCK': { color: 'warning', icon: <Warning />, label: 'Low Stock' },
      'OUT_OF_STOCK': { color: 'error', icon: <Cancel />, label: 'Out of Stock' },
      'ON_HOLD': { color: 'warning', icon: <Lock />, label: 'On Hold' },
      'ISSUED': { color: 'info', icon: <Inventory />, label: 'Issued' },
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
      case 'VEHICLE': return <DirectionsCar sx={{ fontSize: '1rem' }} />;
      case 'DRIVER': return <Person sx={{ fontSize: '1rem' }} />;
      default: return <LocationOn sx={{ fontSize: '1rem' }} />;
    }
  };

  const getHolderColor = (type) => {
    switch (type) {
      case 'VEHICLE': return '#4F46E5';
      case 'DRIVER': return '#22C55E';
      default: return '#F59E0B';
    }
  };

  // Group data by holder
  const groupedData = useMemo(() => {
    const groups = {};
    filteredData.forEach(item => {
      const key = `${item.holderType}-${item.holderId}`;
      if (!groups[key]) {
        groups[key] = {
          holderId: item.holderId,
          holderType: item.holderType,
          holderName: item.holderName || item.holderIdentifier,
          holderIdentifier: item.holderIdentifier,
          holderDetails: item.holderDetails || '',
          holderDisplayName: item.holderDisplayName || item.holderIdentifier,
          items: []
        };
      }
      groups[key].items.push(item);
    });
    return Object.values(groups);
  }, [filteredData]);

  // Pagination
  const paginatedData = useMemo(() => {
    const start = pagination.page * pagination.rowsPerPage;
    const end = start + pagination.rowsPerPage;
    return groupedData.slice(start, end);
  }, [groupedData, pagination]);

  const handlePageChange = (event, newPage) => {
    setPagination(prev => ({ ...prev, page: newPage - 1 }));
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    const headers = ['Holder', 'Type', 'Item', 'SKU', 'Category', 'Quantity', 'Status', 'Condition'];
    const rows = filteredData.map(item => [
      item.holderIdentifier,
      item.holderType,
      item.itemName,
      item.itemSku || 'N/A',
      item.category || 'N/A',
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
    <Box sx={{ bgcolor: '#F7F7FC', p: 3, minHeight: '100vh' }}>
      <Box sx={{ maxWidth: '1600px', margin: '0 auto' }}>
        {/* Header */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h5" fontWeight="700" sx={{ fontSize: '1.5rem' }}>
              Asset Tracking - Stock on Hand
            </Typography>
            <Typography variant="body2" color="text.secondary">
              View what each vehicle, driver, and location currently has in their possession
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
            <StatCard title="Holders" value={groupedData.length} icon={Inventory} color="primary" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard 
              title="Vehicles" 
              value={groupedData.filter(g => g.holderType === 'VEHICLE').length} 
              icon={DirectionsCar} 
              color="primary" 
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard 
              title="Drivers" 
              value={groupedData.filter(g => g.holderType === 'DRIVER').length} 
              icon={Person} 
              color="success" 
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard 
              title="Total Items" 
              value={filteredData.length} 
              icon={Inventory} 
              color="info" 
            />
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
                  <MenuItem value="ISSUED">Issued</MenuItem>
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
                placeholder="Search by item, SKU, or holder..."
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
                  onClick={applyFilters}
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

        {/* Holder List */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: '16px',
            border: '1px solid #ECECEC',
            bgcolor: '#FFFFFF',
            overflow: 'hidden',
          }}
        >
          {paginatedData.length === 0 ? (
            <Box py={4} textAlign="center">
              <Inventory sx={{ fontSize: 48, color: '#D1D5DB', mb: 2 }} />
              <Typography color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                No stock on hand data found
              </Typography>
            </Box>
          ) : (
            <>
              {paginatedData.map((holder) => (
                <Box key={`${holder.holderType}-${holder.holderId}`}>
                  {/* Holder Header */}
                  <Box
                    sx={{
                      p: 1.5,
                      bgcolor: '#F9FAFB',
                      borderBottom: '1px solid #ECECEC',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      '&:hover': { bgcolor: '#F3F4F6' },
                    }}
                    onClick={() => toggleHolder(`${holder.holderType}-${holder.holderId}`)}
                  >
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Avatar
                        sx={{
                          width: 32,
                          height: 32,
                          bgcolor: getHolderColor(holder.holderType) + '20',
                          color: getHolderColor(holder.holderType),
                        }}
                      >
                        {getHolderIcon(holder.holderType)}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight="600" sx={{ fontSize: '0.85rem' }}>
                          {holder.holderIdentifier}
                          <Chip
                            label={holder.holderType}
                            size="small"
                            sx={{
                              ml: 1,
                              height: 18,
                              fontSize: '0.5rem',
                              bgcolor: getHolderColor(holder.holderType) + '20',
                              color: getHolderColor(holder.holderType),
                            }}
                          />
                        </Typography>
                        {holder.holderDetails && (
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                            {holder.holderDetails}
                          </Typography>
                        )}
                      </Box>
                    </Stack>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Chip
                        label={`${holder.items.length} items`}
                        size="small"
                        sx={{ height: 20, fontSize: '0.6rem' }}
                      />
                      <IconButton size="small">
                        {expandedHolders[`${holder.holderType}-${holder.holderId}`] ? 
                          <ExpandLess sx={{ fontSize: '1.2rem' }} /> : 
                          <ExpandMore sx={{ fontSize: '1.2rem' }} />
                        }
                      </IconButton>
                    </Stack>
                  </Box>

                  {/* Holder Items */}
                  <Collapse in={expandedHolders[`${holder.holderType}-${holder.holderId}`]} defaultExpanded>
                    <Box>
                      <TableContainer>
                        <Table size="small">
                          <TableHead sx={{ bgcolor: '#F9FAFB' }}>
                            <TableRow>
                              <TableCell sx={{ fontSize: '0.6rem', fontWeight: 600, color: '#6B7280', py: 1 }}>
                                Item
                              </TableCell>
                              <TableCell sx={{ fontSize: '0.6rem', fontWeight: 600, color: '#6B7280', py: 1 }}>
                                SKU
                              </TableCell>
                              <TableCell sx={{ fontSize: '0.6rem', fontWeight: 600, color: '#6B7280', py: 1 }}>
                                Category
                              </TableCell>
                              <TableCell sx={{ fontSize: '0.6rem', fontWeight: 600, color: '#6B7280', py: 1 }}>
                                Qty
                              </TableCell>
                              <TableCell sx={{ fontSize: '0.6rem', fontWeight: 600, color: '#6B7280', py: 1 }}>
                                Status
                              </TableCell>
                              <TableCell sx={{ fontSize: '0.6rem', fontWeight: 600, color: '#6B7280', py: 1 }}>
                                Condition
                              </TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {holder.items.map((item) => (
                              <TableRow key={item.id} hover>
                                <TableCell sx={{ fontSize: '0.7rem', py: 0.75 }}>
                                  <Typography variant="body2" fontWeight="500" sx={{ fontSize: '0.75rem' }}>
                                    {item.itemName}
                                  </Typography>
                                </TableCell>
                                <TableCell sx={{ fontSize: '0.7rem', py: 0.75 }}>
                                  <Typography variant="body2" sx={{ fontSize: '0.65rem', color: '#4F46E5' }}>
                                    {item.itemSku || 'N/A'}
                                  </Typography>
                                </TableCell>
                                <TableCell sx={{ fontSize: '0.7rem', py: 0.75 }}>
                                  <Chip
                                    label={item.category || 'N/A'}
                                    size="small"
                                    variant="outlined"
                                    sx={{ height: 16, fontSize: '0.5rem' }}
                                  />
                                </TableCell>
                                <TableCell sx={{ fontSize: '0.7rem', py: 0.75 }}>
                                  <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
                                    {item.quantityOutstanding || 0}
                                  </Typography>
                                </TableCell>
                                <TableCell sx={{ fontSize: '0.7rem', py: 0.75 }}>
                                  {getStatusChip(item.status)}
                                </TableCell>
                                <TableCell sx={{ fontSize: '0.7rem', py: 0.75 }}>
                                  <Chip
                                    label={item.condition || 'N/A'}
                                    size="small"
                                    variant="outlined"
                                    sx={{ height: 16, fontSize: '0.5rem' }}
                                  />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Box>
                  </Collapse>
                </Box>
              ))}

              {/* Pagination */}
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 2, borderTop: '1px solid #ECECEC' }}>
                <Pagination
                  count={Math.ceil(groupedData.length / pagination.rowsPerPage)}
                  page={pagination.page + 1}
                  onChange={handlePageChange}
                  color="primary"
                  size="small"
                  showFirstButton
                  showLastButton
                />
              </Box>

              <Box sx={{ p: 2, bgcolor: '#F9FAFB', borderTop: '1px solid #ECECEC' }}>
                <Typography variant="caption" color="text.secondary">
                  Showing {paginatedData.length} of {groupedData.length} holders
                </Typography>
              </Box>
            </>
          )}
        </Paper>
      </Box>
    </Box>
  );
};

export default StockOnHand;
