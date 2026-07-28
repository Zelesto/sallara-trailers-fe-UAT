// src/pages/Inventory.jsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  TextField,
  InputAdornment,
  Stack,
  Tooltip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Tabs,
  Tab,
  Divider,
  Avatar,
  Badge,
  LinearProgress,
} from '@mui/material';
import {
  Inventory as InventoryIcon,
  Search,
  Add,
  Edit,
  Delete,
  Visibility,
  LocalShipping,
  Build,
  OilBarrel,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Category as CategoryIcon,
  LocationOn,
  LocalOffer,
  TrendingUp,
  TrendingDown,
  SwapHoriz,
  Assignment,
  DirectionsCar,
  Person,
  Receipt,
  Save as SaveIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { inventoryService } from '../services/inventoryService';

// Compact Stat Card Component
const StatCard = ({ title, value, icon: Icon, color = 'primary', subtitle, badge }) => (
  <Card sx={{ height: '100%', position: 'relative' }}>
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
          {subtitle && (
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem', display: 'block' }}>
              {subtitle}
            </Typography>
          )}
        </Box>
      </Stack>
      {badge && (
        <Chip
          label={badge}
          size="small"
          color={color}
          sx={{ position: 'absolute', top: 8, right: 8, height: 18, fontSize: '0.5rem' }}
        />
      )}
    </CardContent>
  </Card>
);

// Tab Panel Component
const TabPanel = ({ children, value, index, ...other }) => (
  <div role="tabpanel" hidden={value !== index} {...other}>
    {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
  </div>
);

// Inventory Item Component
const InventoryItemRow = ({ item, onView, onEdit, onDelete, locations, onIssue, onReceive }) => {
  const getStatusConfig = (quantity, minLevel) => {
    if (quantity <= 0) {
      return { color: 'error', icon: <CancelIcon sx={{ fontSize: '0.8rem' }} />, label: 'Out of Stock' };
    } else if (quantity <= minLevel) {
      return { color: 'warning', icon: <WarningIcon sx={{ fontSize: '0.8rem' }} />, label: 'Low Stock' };
    }
    return { color: 'success', icon: <CheckCircleIcon sx={{ fontSize: '0.8rem' }} />, label: 'In Stock' };
  };

  const statusConfig = getStatusConfig(item.quantity, item.minLevel);
  const location = locations?.find(l => l.id === item.locationId);
  const isConsumable = item.isConsumable !== false;

  return (
    <TableRow hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
      <TableCell sx={{ fontSize: '0.75rem', py: 0.75 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Avatar sx={{ width: 24, height: 24, fontSize: '0.6rem', bgcolor: 'primary.light' }}>
            {item.name?.charAt(0) || 'I'}
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight="500" sx={{ fontSize: '0.75rem' }}>
              {item.name}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.55rem' }}>
              ID: {item.id}
            </Typography>
          </Box>
        </Stack>
      </TableCell>
      <TableCell sx={{ fontSize: '0.75rem', py: 0.75 }}>
        <Chip
          label={item.category || 'Uncategorized'}
          size="small"
          variant="outlined"
          sx={{ height: 18, fontSize: '0.55rem' }}
        />
      </TableCell>
      <TableCell sx={{ fontSize: '0.75rem', py: 0.75 }}>
        <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
          {item.quantity} {item.unitOfMeasure || 'EA'}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.55rem' }}>
          Unit Cost: R {item.unitCost?.toFixed(2) || '0.00'}
        </Typography>
      </TableCell>
      <TableCell sx={{ fontSize: '0.75rem', py: 0.75 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>
            {item.minLevel || 0} {item.unitOfMeasure || 'EA'}
          </Typography>
          {item.quantity <= item.minLevel && item.quantity > 0 && (
            <Chip
              label="Reorder"
              size="small"
              color="warning"
              sx={{ height: 16, fontSize: '0.5rem' }}
            />
          )}
        </Box>
      </TableCell>
      <TableCell sx={{ fontSize: '0.75rem', py: 0.75 }}>
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <LocationOn sx={{ fontSize: '0.7rem', color: 'text.secondary' }} />
          <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>
            {location?.name || 'N/A'}
          </Typography>
        </Stack>
      </TableCell>
      <TableCell sx={{ fontSize: '0.75rem', py: 0.75 }}>
        <Chip
          label={statusConfig.label}
          color={statusConfig.color}
          size="small"
          icon={statusConfig.icon}
          sx={{ height: 18, fontSize: '0.55rem' }}
        />
      </TableCell>
      <TableCell sx={{ fontSize: '0.75rem', py: 0.75 }}>
        <Stack direction="row" spacing={0.25}>
          <Tooltip title="View Details">
            <IconButton size="small" color="primary" onClick={() => onView(item)} sx={{ p: 0.5 }}>
              <Visibility sx={{ fontSize: '0.9rem' }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit Item">
            <IconButton size="small" color="secondary" onClick={() => onEdit(item)} sx={{ p: 0.5 }}>
              <Edit sx={{ fontSize: '0.9rem' }} />
            </IconButton>
          </Tooltip>
          {isConsumable && (
            <>
              <Tooltip title="Issue to Vehicle">
                <IconButton size="small" color="warning" onClick={() => onIssue(item)} sx={{ p: 0.5 }}>
                  <DirectionsCar sx={{ fontSize: '0.9rem' }} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Receive Return">
                <IconButton size="small" color="success" onClick={() => onReceive(item)} sx={{ p: 0.5 }}>
                  <SwapHoriz sx={{ fontSize: '0.9rem' }} />
                </IconButton>
              </Tooltip>
            </>
          )}
          <Tooltip title="Delete Item">
            <IconButton size="small" color="error" onClick={() => onDelete(item)} sx={{ p: 0.5 }}>
              <Delete sx={{ fontSize: '0.9rem' }} />
            </IconButton>
          </Tooltip>
        </Stack>
      </TableCell>
    </TableRow>
  );
};

// Vehicle Issue Row Component
const VehicleIssueRow = ({ issue, onView, onReturn }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'RETURNED': return 'success';
      case 'PARTIALLY_RETURNED': return 'warning';
      default: return 'info';
    }
  };

  return (
    <TableRow hover>
      <TableCell sx={{ fontSize: '0.75rem', py: 0.75 }}>
        <Typography variant="body2" fontWeight="500" sx={{ fontSize: '0.75rem' }}>
          {issue.issueNumber}
        </Typography>
      </TableCell>
      <TableCell sx={{ fontSize: '0.75rem', py: 0.75 }}>
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <DirectionsCar sx={{ fontSize: '0.8rem', color: 'text.secondary' }} />
          <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>
            {issue.vehicleRegistration || `Vehicle #${issue.vehicleId}`}
          </Typography>
        </Stack>
      </TableCell>
      <TableCell sx={{ fontSize: '0.75rem', py: 0.75 }}>
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <Person sx={{ fontSize: '0.8rem', color: 'text.secondary' }} />
          <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>
            {issue.driverName || `Driver #${issue.driverId}`}
          </Typography>
        </Stack>
      </TableCell>
      <TableCell sx={{ fontSize: '0.75rem', py: 0.75 }}>
        <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>
          {issue.items?.length || 0} items
        </Typography>
      </TableCell>
      <TableCell sx={{ fontSize: '0.75rem', py: 0.75 }}>
        <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>
          {new Date(issue.issueDate).toLocaleDateString()}
        </Typography>
      </TableCell>
      <TableCell sx={{ fontSize: '0.75rem', py: 0.75 }}>
        <Chip
          label={issue.status}
          color={getStatusColor(issue.status)}
          size="small"
          sx={{ height: 18, fontSize: '0.55rem' }}
        />
      </TableCell>
      <TableCell sx={{ fontSize: '0.75rem', py: 0.75 }}>
        <Stack direction="row" spacing={0.25}>
          <Tooltip title="View Details">
            <IconButton size="small" color="primary" onClick={() => onView(issue)} sx={{ p: 0.5 }}>
              <Visibility sx={{ fontSize: '0.9rem' }} />
            </IconButton>
          </Tooltip>
          {issue.status !== 'RETURNED' && (
            <Tooltip title="Return Items">
              <IconButton size="small" color="success" onClick={() => onReturn(issue)} sx={{ p: 0.5 }}>
                <SwapHoriz sx={{ fontSize: '0.9rem' }} />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      </TableCell>
    </TableRow>
  );
};

const Inventory = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [locations, setLocations] = useState([]);
  const [stats, setStats] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState(0);
  const [vehicleIssues, setVehicleIssues] = useState([]);
  const [loadingIssues, setLoadingIssues] = useState(false);

  // Dialog states
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showIssueDialog, setShowIssueDialog] = useState(false);
  const [showReturnDialog, setShowReturnDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedIssue, setSelectedIssue] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    unitOfMeasure: 'EA',
    isConsumable: true,
    reorderLevel: 0,
    locationId: '',
    quantity: 0,
    unitCost: 0,
    minLevel: 0,
    notes: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [issueFormData, setIssueFormData] = useState({
    vehicleId: '',
    driverId: '',
    tripId: '',
    quantity: 0,
    condition: 'GOOD',
    notes: '',
  });
  const [returnFormData, setReturnFormData] = useState({
    quantity: 0,
    condition: 'GOOD',
    notes: '',
  });

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Get items
      const itemsResponse = await inventoryService.getInventoryItems(0, 100);
      let itemsData = [];
      if (Array.isArray(itemsResponse)) {
        itemsData = itemsResponse;
      } else if (itemsResponse?.content) {
        itemsData = itemsResponse.content;
      } else if (itemsResponse?.data) {
        itemsData = Array.isArray(itemsResponse.data) ? itemsResponse.data : [];
      }
      setInventoryItems(itemsData);

      // Get locations
      const locationsResponse = await inventoryService.getLocations();
      let locationsData = [];
      if (Array.isArray(locationsResponse)) {
        locationsData = locationsResponse;
      } else if (locationsResponse?.data) {
        locationsData = Array.isArray(locationsResponse.data) ? locationsResponse.data : [];
      }
      setLocations(locationsData);

      // Get stats
      const statsResponse = await inventoryService.getInventoryStats();
      setStats(statsResponse);

      // Load vehicle issues if tab is active
      if (activeTab === 1) {
        await loadVehicleIssues();
      }

    } catch (err) {
      console.error('Error loading inventory data:', err);
      setError('Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  };

  const loadVehicleIssues = async () => {
    setLoadingIssues(true);
    try {
      // This would call the vehicle issues endpoint
      // const response = await inventoryService.getVehicleIssues();
      // setVehicleIssues(response);
      // Mock data for now
      setVehicleIssues([]);
    } catch (err) {
      console.error('Error loading vehicle issues:', err);
    } finally {
      setLoadingIssues(false);
    }
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    if (newValue === 1) {
      loadVehicleIssues();
    }
  };

  // CRUD Operations
  const handleView = (item) => {
    setSelectedItem(item);
    setShowViewDialog(true);
  };

  const handleEdit = (item) => {
    setSelectedItem(item);
    setFormData({
      name: item.name || '',
      category: item.category || '',
      unitOfMeasure: item.unitOfMeasure || 'EA',
      isConsumable: item.isConsumable !== false,
      reorderLevel: item.reorderLevel || 0,
      locationId: item.locationId || '',
      quantity: item.quantity || 0,
      unitCost: item.unitCost || 0,
      minLevel: item.minLevel || 0,
      notes: item.notes || '',
    });
    setShowAddDialog(true);
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Are you sure you want to delete "${item.name}"?`)) return;
    try {
      await inventoryService.deleteInventoryItem(item.id);
      showSuccess('Item deleted successfully');
      loadData();
    } catch (err) {
      setError('Failed to delete item');
    }
  };

  const handleAddNew = () => {
    setSelectedItem(null);
    setFormData({
      name: '',
      category: '',
      unitOfMeasure: 'EA',
      isConsumable: true,
      reorderLevel: 0,
      locationId: '',
      quantity: 0,
      unitCost: 0,
      minLevel: 0,
      notes: '',
    });
    setFormErrors({});
    setShowAddDialog(true);
  };

  // Issue operations
  const handleIssueItem = (item) => {
    setSelectedItem(item);
    setIssueFormData({
      vehicleId: '',
      driverId: '',
      tripId: '',
      quantity: 0,
      condition: 'GOOD',
      notes: '',
    });
    setShowIssueDialog(true);
  };

  const handleReceiveItem = (item) => {
    setSelectedItem(item);
    setReturnFormData({
      quantity: 0,
      condition: 'GOOD',
      notes: '',
    });
    setShowReturnDialog(true);
  };

  const handleReturnItems = (issue) => {
    setSelectedIssue(issue);
    setReturnFormData({
      quantity: 0,
      condition: 'GOOD',
      notes: '',
    });
    setShowReturnDialog(true);
  };

  const handleSubmitIssue = async () => {
    try {
      // Validate
      if (!issueFormData.vehicleId || !issueFormData.driverId || issueFormData.quantity <= 0) {
        setError('Please fill in all required fields');
        return;
      }

      const payload = {
        vehicleId: parseInt(issueFormData.vehicleId),
        driverId: parseInt(issueFormData.driverId),
        tripId: issueFormData.tripId ? parseInt(issueFormData.tripId) : null,
        items: [{
          itemId: selectedItem.id,
          quantity: parseFloat(issueFormData.quantity),
          condition: issueFormData.condition,
          notes: issueFormData.notes,
        }],
      };

      // await inventoryService.issueItemsToVehicle(payload);
      showSuccess('Items issued to vehicle successfully');
      setShowIssueDialog(false);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to issue items');
    }
  };

  const handleSubmitReturn = async () => {
    try {
      if (returnFormData.quantity <= 0) {
        setError('Please enter a valid quantity');
        return;
      }

      // await inventoryService.returnItemsFromVehicle(selectedIssue.id, [{
      //   itemId: selectedItem.id,
      //   quantity: parseFloat(returnFormData.quantity),
      //   condition: returnFormData.condition,
      //   notes: returnFormData.notes,
      // }]);
      
      showSuccess('Items returned successfully');
      setShowReturnDialog(false);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to return items');
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      const payload = {
        ...formData,
        unitCost: parseFloat(formData.unitCost) || 0,
        minLevel: parseInt(formData.minLevel) || 0,
        quantity: parseInt(formData.quantity) || 0,
        reorderLevel: parseInt(formData.reorderLevel) || 0,
      };

      if (selectedItem) {
        await inventoryService.updateInventoryItem(selectedItem.id, payload);
        showSuccess('Item updated successfully');
      } else {
        await inventoryService.createInventoryItem(payload);
        showSuccess('Item created successfully');
      }

      setShowAddDialog(false);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to save inventory item');
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Name is required';
    if (!formData.category) errors.category = 'Category is required';
    if (!formData.locationId) errors.locationId = 'Location is required';
    if (formData.minLevel < 0) errors.minLevel = 'Min level cannot be negative';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const showSuccess = (message) => {
    setSuccess(message);
    setTimeout(() => setSuccess(null), 3000);
  };

  const getUniqueCategories = () => {
    const cats = new Set(inventoryItems.map(item => item.category));
    return Array.from(cats).filter(Boolean);
  };

  // Filter items
  const filteredItems = inventoryItems.filter(item => {
    const searchMatch = 
      item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category?.toLowerCase().includes(searchTerm.toLowerCase());
    const categoryMatch = categoryFilter === 'all' || item.category === categoryFilter;
    
    let statusMatch = true;
    if (statusFilter !== 'all') {
      const quantity = item.quantity || 0;
      const minLevel = item.minLevel || 0;
      if (statusFilter === 'In Stock') statusMatch = quantity > minLevel;
      else if (statusFilter === 'Low Stock') statusMatch = quantity > 0 && quantity <= minLevel;
      else if (statusFilter === 'Out of Stock') statusMatch = quantity <= 0;
    }
    
    return searchMatch && categoryMatch && statusMatch;
  });

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress size={40} />
        <Typography sx={{ ml: 2, fontSize: '0.9rem' }}>Loading inventory...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 1, sm: 1.5, md: 2 } }}>
      {/* Header */}
      <Box sx={{ mb: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <InventoryIcon sx={{ fontSize: 28, color: 'primary.main' }} />
          <Box>
            <Typography variant="h6" fontWeight="600" sx={{ fontSize: '1rem' }}>
              Inventory Management
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
              Manage spare parts, lubricants, and supplies
            </Typography>
          </Box>
        </Stack>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 2, fontSize: '0.8rem' }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2, fontSize: '0.8rem' }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Tabs */}
      <Paper sx={{ mb: 2 }}>
        <Tabs value={activeTab} onChange={handleTabChange} sx={{ minHeight: 36 }}>
          <Tab label="Items" icon={<InventoryIcon sx={{ fontSize: '0.9rem' }} />} iconPosition="start" sx={{ fontSize: '0.75rem', minHeight: 36 }} />
          <Tab label="Vehicle Issues" icon={<DirectionsCar sx={{ fontSize: '0.9rem' }} />} iconPosition="start" sx={{ fontSize: '0.75rem', minHeight: 36 }} />
          <Tab label="Stock Movements" icon={<SwapHoriz sx={{ fontSize: '0.9rem' }} />} iconPosition="start" sx={{ fontSize: '0.75rem', minHeight: 36 }} />
        </Tabs>
      </Paper>

      {/* Tab: Items */}
      <TabPanel value={activeTab} index={0}>
        {/* Search and Actions */}
        <Paper sx={{ p: 1.5, mb: 2 }}>
          <Grid container spacing={1.5} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search by name, SKU, or category..."
                size="small"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ fontSize: '0.9rem' }} />
                    </InputAdornment>
                  ),
                  sx: { fontSize: '0.8rem' }
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ fontSize: '0.75rem' }}>Category</InputLabel>
                <Select
                  value={categoryFilter}
                  label="Category"
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  sx={{ fontSize: '0.75rem' }}
                >
                  <MenuItem value="all" sx={{ fontSize: '0.75rem' }}>All Categories</MenuItem>
                  {getUniqueCategories().map(cat => (
                    <MenuItem key={cat} value={cat} sx={{ fontSize: '0.75rem' }}>{cat}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ fontSize: '0.75rem' }}>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                  sx={{ fontSize: '0.75rem' }}
                >
                  <MenuItem value="all" sx={{ fontSize: '0.75rem' }}>All Status</MenuItem>
                  <MenuItem value="In Stock" sx={{ fontSize: '0.75rem' }}>In Stock</MenuItem>
                  <MenuItem value="Low Stock" sx={{ fontSize: '0.75rem' }}>Low Stock</MenuItem>
                  <MenuItem value="Out of Stock" sx={{ fontSize: '0.75rem' }}>Out of Stock</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <Stack direction="row" spacing={0.75}>
                <Tooltip title="Refresh">
                  <IconButton size="small" onClick={loadData} sx={{ p: 0.5 }}>
                    <RefreshIcon sx={{ fontSize: '0.9rem' }} />
                  </IconButton>
                </Tooltip>
                <Button
                  variant="contained"
                  startIcon={<Add sx={{ fontSize: '0.9rem' }} />}
                  onClick={handleAddNew}
                  size="small"
                  sx={{ fontSize: '0.75rem', py: 0.5, flex: 1 }}
                >
                  Add Item
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </Paper>

        {/* Stats Cards */}
        <Grid container spacing={1.5} sx={{ mb: 2 }}>
          <Grid item xs={6} sm={3}>
            <StatCard
              title="Total Items"
              value={inventoryItems.length}
              icon={InventoryIcon}
              color="primary"
            />
          </Grid>
          <Grid item xs={6} sm={3}>
            <StatCard
              title="Low Stock"
              value={inventoryItems.filter(i => i.quantity > 0 && i.quantity <= i.minLevel).length}
              icon={WarningIcon}
              color="warning"
            />
          </Grid>
          <Grid item xs={6} sm={3}>
            <StatCard
              title="Out of Stock"
              value={inventoryItems.filter(i => i.quantity <= 0).length}
              icon={CancelIcon}
              color="error"
            />
          </Grid>
          <Grid item xs={6} sm={3}>
            <StatCard
              title="Locations"
              value={locations.length}
              icon={LocationOn}
              color="info"
            />
          </Grid>
        </Grid>

        {/* Inventory Table */}
        <Card sx={{ borderRadius: 1.5 }}>
          <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600, py: 0.75 }}>Item</TableCell>
                    <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600, py: 0.75 }}>Category</TableCell>
                    <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600, py: 0.75 }}>Quantity</TableCell>
                    <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600, py: 0.75 }}>Min Level</TableCell>
                    <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600, py: 0.75 }}>Location</TableCell>
                    <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600, py: 0.75 }}>Status</TableCell>
                    <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600, py: 0.75 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                        <Typography color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                          No inventory items found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredItems.map((item) => (
                      <InventoryItemRow
                        key={item.id}
                        item={item}
                        locations={locations}
                        onView={handleView}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onIssue={handleIssueItem}
                        onReceive={handleReceiveItem}
                      />
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </TabPanel>

      {/* Tab: Vehicle Issues */}
      <TabPanel value={activeTab} index={1}>
        <Paper sx={{ p: 1.5, mb: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="subtitle2" sx={{ fontSize: '0.85rem', fontWeight: 600 }}>
              Vehicle Issues
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add sx={{ fontSize: '0.9rem' }} />}
              size="small"
              sx={{ fontSize: '0.75rem' }}
              onClick={() => {/* Open issue dialog with vehicle selection */}}
            >
              New Issue
            </Button>
          </Stack>
        </Paper>

        <Card sx={{ borderRadius: 1.5 }}>
          <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
            {loadingIssues ? (
              <Box display="flex" justifyContent="center" py={3}>
                <CircularProgress size={30} />
              </Box>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600, py: 0.75 }}>Issue #</TableCell>
                      <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600, py: 0.75 }}>Vehicle</TableCell>
                      <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600, py: 0.75 }}>Driver</TableCell>
                      <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600, py: 0.75 }}>Items</TableCell>
                      <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600, py: 0.75 }}>Date</TableCell>
                      <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600, py: 0.75 }}>Status</TableCell>
                      <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600, py: 0.75 }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {vehicleIssues.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                          <Typography color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                            No vehicle issues found
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      vehicleIssues.map((issue) => (
                        <VehicleIssueRow
                          key={issue.id}
                          issue={issue}
                          onView={(issue) => {/* Open view dialog */}}
                          onReturn={handleReturnItems}
                        />
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      </TabPanel>

      {/* Tab: Stock Movements */}
      <TabPanel value={activeTab} index={2}>
        <Paper sx={{ p: 1.5, mb: 2 }}>
          <Typography variant="subtitle2" sx={{ fontSize: '0.85rem', fontWeight: 600 }}>
            Stock Movements
          </Typography>
        </Paper>
        <Card sx={{ borderRadius: 1.5 }}>
          <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
            <Typography color="text.secondary" sx={{ fontSize: '0.8rem', textAlign: 'center', py: 3 }}>
              Stock movement history will be displayed here
            </Typography>
          </CardContent>
        </Card>
      </TabPanel>

      {/* ==================== DIALOGS ==================== */}

      {/* View Dialog */}
      <Dialog open={showViewDialog} onClose={() => setShowViewDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ py: 1.5, px: 2.5, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
            Item Details
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ p: 2.5 }}>
          {selectedItem && (
            <Stack spacing={2}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">Name</Typography>
                  <Typography variant="body1" fontWeight="500">{selectedItem.name}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Category</Typography>
                  <Typography variant="body2">{selectedItem.category}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Unit</Typography>
                  <Typography variant="body2">{selectedItem.unitOfMeasure || 'EA'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Quantity</Typography>
                  <Typography variant="body2">{selectedItem.quantity}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Min Level</Typography>
                  <Typography variant="body2">{selectedItem.minLevel}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Unit Cost</Typography>
                  <Typography variant="body2">R {selectedItem.unitCost?.toFixed(2) || '0.00'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Location</Typography>
                  <Typography variant="body2">
                    {locations.find(l => l.id === selectedItem.locationId)?.name || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">Consumable</Typography>
                  <Typography variant="body2">{selectedItem.isConsumable ? 'Yes' : 'No'}</Typography>
                </Grid>
                {selectedItem.notes && (
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary">Notes</Typography>
                    <Typography variant="body2">{selectedItem.notes}</Typography>
                  </Grid>
                )}
              </Grid>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 2.5, py: 1.5, borderTop: 1, borderColor: 'divider' }}>
          <Button onClick={() => setShowViewDialog(false)} size="small">Close</Button>
          <Button variant="contained" size="small" onClick={() => {
            setShowViewDialog(false);
            handleEdit(selectedItem);
          }}>Edit Item</Button>
        </DialogActions>
      </Dialog>

      {/* Add/Edit Dialog */}
      <Dialog open={showAddDialog} onClose={() => setShowAddDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ py: 1.5, px: 2.5, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
            {selectedItem ? 'Edit Item' : 'Add New Item'}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ p: 2.5 }}>
          <Stack spacing={2}>
            <TextField
              label="Item Name *"
              name="name"
              value={formData.name}
              onChange={handleFormChange}
              fullWidth
              size="small"
              error={!!formErrors.name}
              helperText={formErrors.name}
            />
            <Grid container spacing={1.5}>
              <Grid item xs={6}>
                <FormControl fullWidth size="small" error={!!formErrors.category}>
                  <InputLabel>Category *</InputLabel>
                  <Select name="category" value={formData.category} onChange={handleFormChange} label="Category *">
                    <MenuItem value="">Select Category</MenuItem>
                    <MenuItem value="LUBRICANTS">Lubricants</MenuItem>
                    <MenuItem value="FILTERS">Filters</MenuItem>
                    <MenuItem value="TYRES">Tyres</MenuItem>
                    <MenuItem value="BRAKES">Brakes</MenuItem>
                    <MenuItem value="FLUIDS">Fluids</MenuItem>
                    <MenuItem value="OTHER">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Unit"
                  name="unitOfMeasure"
                  value={formData.unitOfMeasure}
                  onChange={handleFormChange}
                  fullWidth
                  size="small"
                />
              </Grid>
            </Grid>
            <Grid container spacing={1.5}>
              <Grid item xs={6}>
                <TextField
                  label="Quantity"
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleFormChange}
                  fullWidth
                  size="small"
                  InputProps={{ inputProps: { min: 0 } }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Min Level *"
                  type="number"
                  name="minLevel"
                  value={formData.minLevel}
                  onChange={handleFormChange}
                  fullWidth
                  size="small"
                  error={!!formErrors.minLevel}
                  helperText={formErrors.minLevel}
                  InputProps={{ inputProps: { min: 0 } }}
                />
              </Grid>
            </Grid>
            <Grid container spacing={1.5}>
              <Grid item xs={6}>
                <TextField
                  label="Reorder Level"
                  type="number"
                  name="reorderLevel"
                  value={formData.reorderLevel}
                  onChange={handleFormChange}
                  fullWidth
                  size="small"
                  InputProps={{ inputProps: { min: 0 } }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Unit Cost"
                  type="number"
                  name="unitCost"
                  value={formData.unitCost}
                  onChange={handleFormChange}
                  fullWidth
                  size="small"
                  InputProps={{
                    startAdornment: <InputAdornment position="start">R</InputAdornment>,
                    inputProps: { min: 0, step: 0.01 }
                  }}
                />
              </Grid>
            </Grid>
            <FormControl fullWidth size="small" error={!!formErrors.locationId}>
              <InputLabel>Location *</InputLabel>
              <Select name="locationId" value={formData.locationId} onChange={handleFormChange} label="Location *">
                <MenuItem value="">Select Location</MenuItem>
                {locations.map(loc => (
                  <MenuItem key={loc.id} value={loc.id}>{loc.name} ({loc.type})</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.isConsumable}
                  onChange={(e) => setFormData(prev => ({ ...prev, isConsumable: e.target.checked }))}
                  name="isConsumable"
                />
              }
              label="Consumable Item"
            />
            <TextField
              label="Notes"
              name="notes"
              value={formData.notes}
              onChange={handleFormChange}
              fullWidth
              size="small"
              multiline
              rows={2}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 2.5, py: 1.5, borderTop: 1, borderColor: 'divider' }}>
          <Button onClick={() => setShowAddDialog(false)} size="small">Cancel</Button>
          <Button variant="contained" size="small" onClick={handleSubmit}>
            {selectedItem ? 'Update' : 'Add'} Item
          </Button>
        </DialogActions>
      </Dialog>

      {/* Issue Dialog */}
      <Dialog open={showIssueDialog} onClose={() => setShowIssueDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ py: 1.5, px: 2.5, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
            Issue Item to Vehicle
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ p: 2.5 }}>
          {selectedItem && (
            <Stack spacing={2}>
              <Alert severity="info" sx={{ fontSize: '0.8rem' }}>
                Issuing: <strong>{selectedItem.name}</strong> (Available: {selectedItem.quantity})
              </Alert>
              <TextField
                label="Vehicle ID *"
                type="number"
                value={issueFormData.vehicleId}
                onChange={(e) => setIssueFormData(prev => ({ ...prev, vehicleId: e.target.value }))}
                fullWidth
                size="small"
              />
              <TextField
                label="Driver ID *"
                type="number"
                value={issueFormData.driverId}
                onChange={(e) => setIssueFormData(prev => ({ ...prev, driverId: e.target.value }))}
                fullWidth
                size="small"
              />
              <TextField
                label="Trip ID"
                type="number"
                value={issueFormData.tripId}
                onChange={(e) => setIssueFormData(prev => ({ ...prev, tripId: e.target.value }))}
                fullWidth
                size="small"
              />
              <TextField
                label="Quantity *"
                type="number"
                value={issueFormData.quantity}
                onChange={(e) => setIssueFormData(prev => ({ ...prev, quantity: e.target.value }))}
                fullWidth
                size="small"
                InputProps={{ inputProps: { min: 0.01, max: selectedItem.quantity } }}
                helperText={`Max: ${selectedItem.quantity}`}
              />
              <FormControl fullWidth size="small">
                <InputLabel>Condition</InputLabel>
                <Select
                  value={issueFormData.condition}
                  onChange={(e) => setIssueFormData(prev => ({ ...prev, condition: e.target.value }))}
                  label="Condition"
                >
                  <MenuItem value="GOOD">Good</MenuItem>
                  <MenuItem value="NEW">New</MenuItem>
                  <MenuItem value="WOR">Worn</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Notes"
                value={issueFormData.notes}
                onChange={(e) => setIssueFormData(prev => ({ ...prev, notes: e.target.value }))}
                fullWidth
                size="small"
                multiline
                rows={2}
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 2.5, py: 1.5, borderTop: 1, borderColor: 'divider' }}>
          <Button onClick={() => setShowIssueDialog(false)} size="small">Cancel</Button>
          <Button variant="contained" size="small" onClick={handleSubmitIssue}>
            Issue Item
          </Button>
        </DialogActions>
      </Dialog>

      {/* Return Dialog */}
      <Dialog open={showReturnDialog} onClose={() => setShowReturnDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ py: 1.5, px: 2.5, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
            Return Item
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ p: 2.5 }}>
          {selectedItem && (
            <Stack spacing={2}>
              <Alert severity="info" sx={{ fontSize: '0.8rem' }}>
                Returning: <strong>{selectedItem.name}</strong>
              </Alert>
              <TextField
                label="Quantity *"
                type="number"
                value={returnFormData.quantity}
                onChange={(e) => setReturnFormData(prev => ({ ...prev, quantity: e.target.value }))}
                fullWidth
                size="small"
                InputProps={{ inputProps: { min: 0.01 } }}
              />
              <FormControl fullWidth size="small">
                <InputLabel>Condition</InputLabel>
                <Select
                  value={returnFormData.condition}
                  onChange={(e) => setReturnFormData(prev => ({ ...prev, condition: e.target.value }))}
                  label="Condition"
                >
                  <MenuItem value="GOOD">Good</MenuItem>
                  <MenuItem value="DAMAGED">Damaged</MenuItem>
                  <MenuItem value="WOR">Worn</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Notes"
                value={returnFormData.notes}
                onChange={(e) => setReturnFormData(prev => ({ ...prev, notes: e.target.value }))}
                fullWidth
                size="small"
                multiline
                rows={2}
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 2.5, py: 1.5, borderTop: 1, borderColor: 'divider' }}>
          <Button onClick={() => setShowReturnDialog(false)} size="small">Cancel</Button>
          <Button variant="contained" size="small" onClick={handleSubmitReturn}>
            Return Item
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Inventory;
