// src/pages/Inventory.jsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
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
  Divider,
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
} from '@mui/icons-material';
import { inventoryService } from '../services/inventoryService';

// Compact Stat Card Component
const StatCard = ({ title, value, icon: Icon, color = 'primary', subtitle }) => (
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
          {subtitle && (
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem', display: 'block' }}>
              {subtitle}
            </Typography>
          )}
        </Box>
      </Stack>
    </CardContent>
  </Card>
);

// Compact Inventory Item Component
const InventoryItem = ({ item, onView, onEdit, onDelete, locations }) => {
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

  return (
    <TableRow hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
      <TableCell sx={{ fontSize: '0.75rem', py: 0.75 }}>
        <Typography variant="body2" fontWeight="500" sx={{ fontSize: '0.75rem' }}>
          {item.name}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.55rem' }}>
          SKU: {item.sku}
        </Typography>
      </TableCell>
      <TableCell sx={{ fontSize: '0.75rem', py: 0.75 }}>
        <Chip
          label={item.category}
          size="small"
          variant="outlined"
          sx={{ height: 18, fontSize: '0.55rem' }}
        />
      </TableCell>
      <TableCell sx={{ fontSize: '0.75rem', py: 0.75 }}>
        <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
          {item.quantity} {item.unit}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.55rem' }}>
          Unit Cost: R {item.unitCost?.toFixed(2) || '0.00'}
        </Typography>
      </TableCell>
      <TableCell sx={{ fontSize: '0.75rem', py: 0.75 }}>
        <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>
          {item.minLevel} {item.unit}
        </Typography>
      </TableCell>
      <TableCell sx={{ fontSize: '0.75rem', py: 0.75 }}>
        <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>
          {location?.name || 'N/A'}
        </Typography>
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

const Inventory = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [locations, setLocations] = useState([]);
  const [stats, setStats] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    description: '',
    unit: 'EA',
    unitCost: '',
    category: '',
    minLevel: '',
    locationId: '',
  });
  const [formErrors, setFormErrors] = useState({});

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [itemsData, locationsData, statsData] = await Promise.all([
        inventoryService.getInventoryItems(),
        inventoryService.getLocations(),
        inventoryService.getInventoryStats(),
      ]);

      setInventoryItems(itemsData || []);
      setLocations(locationsData || []);
      setStats(statsData);
    } catch (err) {
      console.error('Error loading inventory data:', err);
      setError('Failed to load inventory data');
      // Use mock data for demo if API fails
      setInventoryItems([
        { id: 1, sku: 'ENG-OIL-5W30', name: 'Engine Oil 5W-30', description: 'Synthetic Engine Oil 5W-30 Grade', unit: 'LITER', unitCost: 150, category: 'LUBRICANTS', minLevel: 20, locationId: 1 },
        { id: 2, sku: 'FIL-AIR-123', name: 'Air Filter', description: 'Heavy Duty Air Filter for Trucks', unit: 'EA', unitCost: 450, category: 'FILTERS', minLevel: 10, locationId: 1 },
      ]);
      setLocations([
        { id: 1, name: 'Main Warehouse', type: 'WAREHOUSE', address: '123 Main St, Johannesburg' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Calculate category counts
  const categoryStats = useMemo(() => {
    const counts = {};
    inventoryItems.forEach(item => {
      counts[item.category] = (counts[item.category] || 0) + 1;
    });
    return counts;
  }, [inventoryItems]);

  const categoryIcons = {
    'LUBRICANTS': OilBarrel,
    'FILTERS': Build,
    'TYRES': LocalShipping,
    'BRAKES': Build,
    'FLUIDS': OilBarrel,
  };

  // Filter items
  const filteredItems = inventoryItems.filter(item => {
    const searchMatch = 
      item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
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

  const handleView = (item) => {
    setSelectedItem(item);
    setShowViewDialog(true);
  };

  const handleEdit = (item) => {
    setSelectedItem(item);
    setFormData({
      sku: item.sku || '',
      name: item.name || '',
      description: item.description || '',
      unit: item.unit || 'EA',
      unitCost: item.unitCost || '',
      category: item.category || '',
      minLevel: item.minLevel || '',
      locationId: item.locationId || '',
    });
    setShowAddDialog(true);
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Are you sure you want to delete "${item.name}"?`)) return;
    try {
      await inventoryService.deleteInventoryItem(item.id);
      setError(null);
      loadData();
    } catch (err) {
      setError('Failed to delete item');
    }
  };

  const handleAddNew = () => {
    setSelectedItem(null);
    setFormData({
      sku: '',
      name: '',
      description: '',
      unit: 'EA',
      unitCost: '',
      category: '',
      minLevel: '',
      locationId: '',
    });
    setFormErrors({});
    setShowAddDialog(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.sku.trim()) errors.sku = 'SKU is required';
    if (!formData.name.trim()) errors.name = 'Name is required';
    if (!formData.category) errors.category = 'Category is required';
    if (!formData.locationId) errors.locationId = 'Location is required';
    if (!formData.minLevel || parseFloat(formData.minLevel) < 0) errors.minLevel = 'Valid min level is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      const payload = {
        ...formData,
        unitCost: parseFloat(formData.unitCost) || 0,
        minLevel: parseInt(formData.minLevel) || 0,
      };

      if (selectedItem) {
        await inventoryService.updateInventoryItem(selectedItem.id, payload);
      } else {
        await inventoryService.createInventoryItem(payload);
      }

      setShowAddDialog(false);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to save inventory item');
    }
  };

  const getUniqueCategories = () => {
    const cats = new Set(inventoryItems.map(item => item.category));
    return Array.from(cats);
  };

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
      {/* Header - Compact */}
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

      {error && (
        <Alert severity="error" sx={{ mb: 2, fontSize: '0.8rem' }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Search and Actions - Compact */}
      <Paper sx={{ p: 1.5, mb: 2 }}>
        <Grid container spacing={1.5} alignItems="center">
          <Grid item xs={12} md={5}>
            <TextField
              fullWidth
              placeholder="Search by name, SKU, or category..."
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
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
          <Grid item xs={12} md={2}>
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

      {/* Stats Cards - Compact */}
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        {Object.entries(categoryStats).map(([category, count]) => {
          const Icon = categoryIcons[category] || CategoryIcon;
          return (
            <Grid item xs={6} sm={4} md={3} key={category}>
              <StatCard
                title={category}
                value={count}
                icon={Icon}
                color={
                  category === 'LUBRICANTS' ? 'primary' :
                  category === 'FILTERS' ? 'info' :
                  category === 'TYRES' ? 'warning' : 'secondary'
                }
              />
            </Grid>
          );
        })}
      </Grid>

      {/* Inventory Table - Compact */}
      <Card sx={{ borderRadius: 1.5 }}>
        <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
            <Typography variant="subtitle2" sx={{ fontSize: '0.85rem', fontWeight: 600 }}>
              Inventory Items
              <Chip
                label={`${filteredItems.length} items`}
                size="small"
                sx={{ ml: 1, height: 18, fontSize: '0.55rem' }}
              />
            </Typography>
          </Stack>

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
                    <InventoryItem
                      key={item.id}
                      item={item}
                      locations={locations}
                      onView={handleView}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* View Dialog - Compact */}
      <Dialog 
        open={showViewDialog} 
        onClose={() => setShowViewDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 1.5 } }}
      >
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
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                    SKU
                  </Typography>
                  <Typography variant="body2" fontWeight="500" sx={{ fontSize: '0.85rem' }}>
                    {selectedItem.sku}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                    Name
                  </Typography>
                  <Typography variant="body1" fontWeight="500" sx={{ fontSize: '0.9rem' }}>
                    {selectedItem.name}
                  </Typography>
                </Grid>
                {selectedItem.description && (
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                      Description
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                      {selectedItem.description}
                    </Typography>
                  </Grid>
                )}
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                    Category
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                    {selectedItem.category}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                    Unit
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                    {selectedItem.unit}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                    Quantity
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                    {selectedItem.quantity} {selectedItem.unit}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                    Min Level
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                    {selectedItem.minLevel} {selectedItem.unit}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                    Unit Cost
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                    R {selectedItem.unitCost?.toFixed(2) || '0.00'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                    Location
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                    {locations.find(l => l.id === selectedItem.locationId)?.name || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                    Status
                  </Typography>
                  <Chip
                    label={selectedItem.quantity <= 0 ? 'Out of Stock' : selectedItem.quantity <= selectedItem.minLevel ? 'Low Stock' : 'In Stock'}
                    color={selectedItem.quantity <= 0 ? 'error' : selectedItem.quantity <= selectedItem.minLevel ? 'warning' : 'success'}
                    size="small"
                    sx={{ mt: 0.5 }}
                  />
                </Grid>
              </Grid>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 2.5, py: 1.5, borderTop: 1, borderColor: 'divider' }}>
          <Button onClick={() => setShowViewDialog(false)} size="small" sx={{ fontSize: '0.8rem' }}>
            Close
          </Button>
          <Button 
            variant="contained" 
            size="small" 
            sx={{ fontSize: '0.8rem' }}
            onClick={() => {
              setShowViewDialog(false);
              handleEdit(selectedItem);
            }}
          >
            Edit Item
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add/Edit Dialog - Compact */}
      <Dialog 
        open={showAddDialog} 
        onClose={() => setShowAddDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 1.5 } }}
      >
        <DialogTitle sx={{ py: 1.5, px: 2.5, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
            {selectedItem ? 'Edit Item' : 'Add New Item'}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ p: 2.5 }}>
          <Stack spacing={2}>
            <TextField
              label="SKU *"
              name="sku"
              value={formData.sku}
              onChange={handleFormChange}
              fullWidth
              size="small"
              error={!!formErrors.sku}
              helperText={formErrors.sku}
              sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
            />
            <TextField
              label="Item Name *"
              name="name"
              value={formData.name}
              onChange={handleFormChange}
              fullWidth
              size="small"
              error={!!formErrors.name}
              helperText={formErrors.name}
              sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
            />
            <TextField
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleFormChange}
              fullWidth
              size="small"
              multiline
              rows={2}
              sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
            />
            <Grid container spacing={1.5}>
              <Grid item xs={6}>
                <FormControl fullWidth size="small" error={!!formErrors.category}>
                  <InputLabel sx={{ fontSize: '0.75rem' }}>Category *</InputLabel>
                  <Select
                    name="category"
                    value={formData.category}
                    onChange={handleFormChange}
                    label="Category *"
                    sx={{ fontSize: '0.75rem' }}
                  >
                    <MenuItem value="" sx={{ fontSize: '0.75rem' }}>Select Category</MenuItem>
                    <MenuItem value="LUBRICANTS" sx={{ fontSize: '0.75rem' }}>Lubricants</MenuItem>
                    <MenuItem value="FILTERS" sx={{ fontSize: '0.75rem' }}>Filters</MenuItem>
                    <MenuItem value="TYRES" sx={{ fontSize: '0.75rem' }}>Tyres</MenuItem>
                    <MenuItem value="BRAKES" sx={{ fontSize: '0.75rem' }}>Brakes</MenuItem>
                    <MenuItem value="FLUIDS" sx={{ fontSize: '0.75rem' }}>Fluids</MenuItem>
                    <MenuItem value="OTHER" sx={{ fontSize: '0.75rem' }}>Other</MenuItem>
                  </Select>
                  {formErrors.category && <Typography variant="caption" color="error" sx={{ fontSize: '0.65rem' }}>{formErrors.category}</Typography>}
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Unit"
                  name="unit"
                  value={formData.unit}
                  onChange={handleFormChange}
                  fullWidth
                  size="small"
                  sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
                />
              </Grid>
            </Grid>
            <Grid container spacing={1.5}>
              <Grid item xs={6}>
                <TextField
                  label="Quantity"
                  type="number"
                  name="quantity"
                  fullWidth
                  size="small"
                  sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
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
                  sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
                  InputProps={{ inputProps: { min: 0 } }}
                />
              </Grid>
            </Grid>
            <TextField
              label="Unit Cost"
              type="number"
              name="unitCost"
              value={formData.unitCost}
              onChange={handleFormChange}
              fullWidth
              size="small"
              sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
              InputProps={{
                startAdornment: <InputAdornment position="start">R</InputAdornment>,
                inputProps: { min: 0, step: 0.01 }
              }}
            />
            <FormControl fullWidth size="small" error={!!formErrors.locationId}>
              <InputLabel sx={{ fontSize: '0.75rem' }}>Location *</InputLabel>
              <Select
                name="locationId"
                value={formData.locationId}
                onChange={handleFormChange}
                label="Location *"
                sx={{ fontSize: '0.75rem' }}
              >
                <MenuItem value="" sx={{ fontSize: '0.75rem' }}>Select Location</MenuItem>
                {locations.map(loc => (
                  <MenuItem key={loc.id} value={loc.id} sx={{ fontSize: '0.75rem' }}>
                    {loc.name} ({loc.type})
                  </MenuItem>
                ))}
              </Select>
              {formErrors.locationId && <Typography variant="caption" color="error" sx={{ fontSize: '0.65rem' }}>{formErrors.locationId}</Typography>}
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 2.5, py: 1.5, borderTop: 1, borderColor: 'divider' }}>
          <Button onClick={() => setShowAddDialog(false)} size="small" sx={{ fontSize: '0.8rem' }}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            size="small" 
            sx={{ fontSize: '0.8rem' }}
            onClick={handleSubmit}
          >
            {selectedItem ? 'Update' : 'Add'} Item
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Inventory;
