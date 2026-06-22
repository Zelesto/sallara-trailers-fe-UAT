import React, { useState } from 'react';
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
} from '@mui/icons-material';

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
const InventoryItem = ({ item, onView, onEdit, onDelete }) => {
  const getStatusConfig = (status) => {
    const configs = {
      'In Stock': { color: 'success', icon: <CheckCircleIcon sx={{ fontSize: '0.8rem' }} /> },
      'Low Stock': { color: 'warning', icon: <WarningIcon sx={{ fontSize: '0.8rem' }} /> },
      'Out of Stock': { color: 'error', icon: <CancelIcon sx={{ fontSize: '0.8rem' }} /> },
    };
    return configs[status] || { color: 'default', icon: null };
  };

  const statusConfig = getStatusConfig(item.status);

  return (
    <TableRow hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
      <TableCell sx={{ fontSize: '0.75rem', py: 0.75 }}>
        <Typography variant="body2" fontWeight="500" sx={{ fontSize: '0.75rem' }}>
          {item.name}
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
      </TableCell>
      <TableCell sx={{ fontSize: '0.75rem', py: 0.75 }}>
        <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>
          {item.minLevel} {item.unit}
        </Typography>
      </TableCell>
      <TableCell sx={{ fontSize: '0.75rem', py: 0.75 }}>
        <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>
          {item.location}
        </Typography>
      </TableCell>
      <TableCell sx={{ fontSize: '0.75rem', py: 0.75 }}>
        <Chip
          label={item.status}
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
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // Mock data
  const inventoryItems = [
    { id: 1, name: 'Engine Oil 15W-40', category: 'Lubricants', quantity: 45, unit: 'Liters', minLevel: 20, location: 'Main Store', status: 'In Stock' },
    { id: 2, name: 'Air Filter', category: 'Filters', quantity: 12, unit: 'Pieces', minLevel: 10, location: 'Main Store', status: 'Low Stock' },
    { id: 3, name: 'Brake Pads', category: 'Brakes', quantity: 8, unit: 'Sets', minLevel: 5, location: 'Workshop', status: 'Low Stock' },
    { id: 4, name: 'Tyre 295/80R22.5', category: 'Tyres', quantity: 24, unit: 'Pieces', minLevel: 15, location: 'Tyre Bay', status: 'In Stock' },
    { id: 5, name: 'Coolant', category: 'Fluids', quantity: 60, unit: 'Liters', minLevel: 30, location: 'Main Store', status: 'In Stock' },
    { id: 6, name: 'Fuel Filter', category: 'Filters', quantity: 5, unit: 'Pieces', minLevel: 8, location: 'Main Store', status: 'Out of Stock' },
  ];

  const categories = [
    { name: 'Lubricants', count: 3, icon: OilBarrel },
    { name: 'Filters', count: 2, icon: Build },
    { name: 'Tyres', count: 1, icon: LocalShipping },
    { name: 'Brakes', count: 1, icon: Build },
  ];

  // Filter items
  const filteredItems = inventoryItems.filter(item => {
    const searchMatch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       item.category.toLowerCase().includes(searchTerm.toLowerCase());
    const categoryMatch = categoryFilter === 'all' || item.category === categoryFilter;
    const statusMatch = statusFilter === 'all' || item.status === statusFilter;
    return searchMatch && categoryMatch && statusMatch;
  });

  const handleView = (item) => {
    setSelectedItem(item);
    setShowViewDialog(true);
  };

  const handleEdit = (item) => {
    setSelectedItem(item);
    setShowAddDialog(true);
  };

  const handleDelete = (item) => {
    if (window.confirm(`Are you sure you want to delete "${item.name}"?`)) {
      console.log('Deleting item:', item);
    }
  };

  const handleAddNew = () => {
    setSelectedItem(null);
    setShowAddDialog(true);
  };

  // Get unique categories for filter
  const uniqueCategories = [...new Set(inventoryItems.map(item => item.category))];
  const uniqueStatuses = [...new Set(inventoryItems.map(item => item.status))];

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

      {/* Search and Actions - Compact */}
      <Paper sx={{ p: 1.5, mb: 2 }}>
        <Grid container spacing={1.5} alignItems="center">
          <Grid item xs={12} md={5}>
            <TextField
              fullWidth
              placeholder="Search inventory items..."
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
                {uniqueCategories.map(cat => (
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
                {uniqueStatuses.map(status => (
                  <MenuItem key={status} value={status} sx={{ fontSize: '0.75rem' }}>{status}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Stack direction="row" spacing={0.75}>
              <Tooltip title="Refresh">
                <IconButton size="small" sx={{ p: 0.5 }}>
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
        {categories.map((category) => (
          <Grid item xs={6} sm={6} md={3} key={category.name}>
            <StatCard
              title={category.name}
              value={category.count}
              icon={category.icon}
              color={
                category.name === 'Lubricants' ? 'primary' :
                category.name === 'Filters' ? 'info' :
                category.name === 'Tyres' ? 'warning' : 'secondary'
              }
            />
          </Grid>
        ))}
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
                  <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600, py: 0.75 }}>Item Name</TableCell>
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
        <CardActions sx={{ justifyContent: 'flex-end', p: 1.5, borderTop: 1, borderColor: 'divider' }}>
          <Button 
            variant="outlined" 
            size="small"
            sx={{ fontSize: '0.75rem' }}
          >
            View All Items
          </Button>
        </CardActions>
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
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                  Item Name
                </Typography>
                <Typography variant="body1" fontWeight="500" sx={{ fontSize: '0.9rem' }}>
                  {selectedItem.name}
                </Typography>
              </Box>
              <Grid container spacing={2}>
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
                    Location
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                    {selectedItem.location}
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
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                    Status
                  </Typography>
                  <Chip
                    label={selectedItem.status}
                    color={
                      selectedItem.status === 'In Stock' ? 'success' :
                      selectedItem.status === 'Low Stock' ? 'warning' : 'error'
                    }
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
              label="Item Name"
              fullWidth
              size="small"
              defaultValue={selectedItem?.name || ''}
              sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
            />
            <FormControl fullWidth size="small">
              <InputLabel sx={{ fontSize: '0.75rem' }}>Category</InputLabel>
              <Select
                label="Category"
                defaultValue={selectedItem?.category || ''}
                sx={{ fontSize: '0.75rem' }}
              >
                {uniqueCategories.map(cat => (
                  <MenuItem key={cat} value={cat} sx={{ fontSize: '0.75rem' }}>{cat}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Grid container spacing={1.5}>
              <Grid item xs={6}>
                <TextField
                  label="Quantity"
                  type="number"
                  fullWidth
                  size="small"
                  defaultValue={selectedItem?.quantity || ''}
                  sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Unit"
                  fullWidth
                  size="small"
                  defaultValue={selectedItem?.unit || ''}
                  sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
                />
              </Grid>
            </Grid>
            <TextField
              label="Min Level"
              type="number"
              fullWidth
              size="small"
              defaultValue={selectedItem?.minLevel || ''}
              sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
            />
            <TextField
              label="Location"
              fullWidth
              size="small"
              defaultValue={selectedItem?.location || ''}
              sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
            />
            <FormControl fullWidth size="small">
              <InputLabel sx={{ fontSize: '0.75rem' }}>Status</InputLabel>
              <Select
                label="Status"
                defaultValue={selectedItem?.status || 'In Stock'}
                sx={{ fontSize: '0.75rem' }}
              >
                <MenuItem value="In Stock" sx={{ fontSize: '0.75rem' }}>In Stock</MenuItem>
                <MenuItem value="Low Stock" sx={{ fontSize: '0.75rem' }}>Low Stock</MenuItem>
                <MenuItem value="Out of Stock" sx={{ fontSize: '0.75rem' }}>Out of Stock</MenuItem>
              </Select>
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
            onClick={() => setShowAddDialog(false)}
          >
            {selectedItem ? 'Update' : 'Add'} Item
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Inventory;
