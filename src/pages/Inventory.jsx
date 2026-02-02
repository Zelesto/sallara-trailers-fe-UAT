import React from 'react';
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
} from '@mui/icons-material';

const Inventory = () => {
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
    { name: 'Lubricants', count: 3, icon: <OilBarrel /> },
    { name: 'Filters', count: 2, icon: <Build /> },
    { name: 'Tyres', count: 1, icon: <LocalShipping /> },
    { name: 'Brakes', count: 1, icon: <Build /> },
  ];

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box display="flex" alignItems="center" gap={2}>
          <InventoryIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          <Box>
            <Typography variant="h4">Inventory Management</Typography>
            <Typography variant="body1" color="text.secondary">
              Manage spare parts, lubricants, and supplies
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Search and Actions */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search inventory items..."
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={6} sx={{ textAlign: { md: 'right' } }}>
            <Button variant="contained" startIcon={<Add />}>
              Add New Item
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {categories.map((category) => (
          <Grid item xs={12} sm={6} md={3} key={category.name}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <Box sx={{ color: 'primary.main' }}>{category.icon}</Box>
                  <Box>
                    <Typography variant="h6">{category.count}</Typography>
                    <Typography color="text.secondary">{category.name}</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Inventory Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Inventory Items
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Item Name</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Quantity</TableCell>
                  <TableCell>Min Level</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {inventoryItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell>
                      <Typography fontWeight="medium">
                        {item.quantity} {item.unit}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {item.minLevel} {item.unit}
                    </TableCell>
                    <TableCell>{item.location}</TableCell>
                    <TableCell>
                      <Chip
                        label={item.status}
                        color={
                          item.status === 'In Stock' ? 'success' :
                          item.status === 'Low Stock' ? 'warning' : 'error'
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" color="primary">
                        <Visibility />
                      </IconButton>
                      <IconButton size="small" color="secondary">
                        <Edit />
                      </IconButton>
                      <IconButton size="small" color="error">
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
        <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
          <Button variant="outlined">View All Items</Button>
        </CardActions>
      </Card>
    </Box>
  );
};

export default Inventory;