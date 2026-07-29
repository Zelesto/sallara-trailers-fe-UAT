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
  FormControlLabel,
  Checkbox,
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
import { vehicleIssueService } from '../services/vehicleIssueService';
import { vehicleService } from '../services/vehicleService';
import { driverService } from '../services/driverService';
import MovementHistory from './MovementHistory';

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
const InventoryItemRow = ({ item, onView, onEdit, onDelete, locations, onIssue, onReceive, onIssueToDriver }) => {
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
              <Tooltip title="Issue to Driver">
                <IconButton size="small" color="info" onClick={() => onIssueToDriver(item)} sx={{ p: 0.5 }}>
                  <Person sx={{ fontSize: '0.9rem' }} />
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
const VehicleIssueRow = ({ issue, onView, onReturn, onSwap, vehicles, drivers }) => {
  if (!issue) return null;

  const getStatusColor = (status) => {
    switch (status) {
      case 'RETURNED': return 'success';
      case 'PARTIALLY_RETURNED': return 'warning';
      default: return 'info';
    }
  };

  const getVehicle = (vehicleId) => {
    if (!vehicleId) return null;
    return vehicles?.find(v => v.id === vehicleId);
  };

  const getDriver = (driverId) => {
    if (!driverId) return null;
    return drivers?.find(d => d.id === driverId);
  };

  const vehicle = getVehicle(issue.vehicleId);
  const driver = getDriver(issue.driverId);

  const getVehicleDisplay = (vehicle) => {
    if (!vehicle) return `Vehicle #${issue.vehicleId}`;
    return vehicle.registrationNumber || vehicle.regNumber || `Vehicle #${vehicle.id}`;
  };

  const getDriverDisplay = (driver) => {
    if (!driver) return `Driver #${issue.driverId}`;
    return driver.fullName || `${driver.firstName || ''} ${driver.lastName || ''}`.trim() || `Driver #${driver.id}`;
  };

  return (
    <TableRow hover>
      <TableCell sx={{ fontSize: '0.75rem', py: 0.75 }}>
        <Typography variant="body2" fontWeight="500" sx={{ fontSize: '0.75rem' }}>
          {issue.issueNumber || `Issue #${issue.id}`}
        </Typography>
      </TableCell>
      <TableCell sx={{ fontSize: '0.75rem', py: 0.75 }}>
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <DirectionsCar sx={{ fontSize: '0.8rem', color: 'text.secondary' }} />
          <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>
            {getVehicleDisplay(vehicle)}
          </Typography>
          {vehicle && vehicle.make && (
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.55rem' }}>
              ({vehicle.make} {vehicle.model || ''})
            </Typography>
          )}
        </Stack>
      </TableCell>
      <TableCell sx={{ fontSize: '0.75rem', py: 0.75 }}>
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <Person sx={{ fontSize: '0.8rem', color: 'text.secondary' }} />
          <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>
            {getDriverDisplay(driver)}
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
          {issue.issueDate ? new Date(issue.issueDate).toLocaleDateString() : 'N/A'}
        </Typography>
      </TableCell>
      <TableCell sx={{ fontSize: '0.75rem', py: 0.75 }}>
        <Chip
          label={issue.status || 'ISSUED'}
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
            <>
              <Tooltip title="Return Items">
                <IconButton size="small" color="success" onClick={() => onReturn(issue)} sx={{ p: 0.5 }}>
                  <SwapHoriz sx={{ fontSize: '0.9rem' }} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Swap Item">
                <IconButton size="small" color="warning" onClick={() => onSwap(issue)} sx={{ p: 0.5 }}>
                  <LocalOffer sx={{ fontSize: '0.9rem' }} />
                </IconButton>
              </Tooltip>
            </>
          )}
        </Stack>
      </TableCell>
    </TableRow>
  );
};

// Driver Issue Row Component
const DriverIssueRow = ({ issue, onView, onReturn, onSwap, drivers, inventoryItems }) => {
  if (!issue) return null;

  const getStatusColor = (status) => {
    switch (status) {
      case 'RETURNED': return 'success';
      case 'PARTIALLY_RETURNED': return 'warning';
      default: return 'info';
    }
  };

  const getDriver = (driverId) => {
    if (!driverId) return null;
    return drivers?.find(d => d.id === driverId);
  };

  const driver = getDriver(issue.driverId);

  const getDriverDisplay = (driver) => {
    if (!driver) return `Driver #${issue.driverId}`;
    return driver.fullName || `${driver.firstName || ''} ${driver.lastName || ''}`.trim() || `Driver #${driver.id}`;
  };

  const firstItem = issue.items?.[0];
  const itemName = firstItem?.itemName || 'Unknown';

  return (
    <TableRow hover>
      <TableCell sx={{ fontSize: '0.75rem', py: 0.75 }}>
        <Typography variant="body2" fontWeight="500" sx={{ fontSize: '0.75rem' }}>
          {issue.issueNumber || `Issue #${issue.id}`}
        </Typography>
      </TableCell>
      <TableCell sx={{ fontSize: '0.75rem', py: 0.75 }}>
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <Person sx={{ fontSize: '0.8rem', color: 'text.secondary' }} />
          <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>
            {getDriverDisplay(driver)}
          </Typography>
        </Stack>
      </TableCell>
      <TableCell sx={{ fontSize: '0.75rem', py: 0.75 }}>
        <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>
          {itemName}
        </Typography>
      </TableCell>
      <TableCell sx={{ fontSize: '0.75rem', py: 0.75 }}>
        <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>
          {issue.items?.length || 0} items
        </Typography>
      </TableCell>
      <TableCell sx={{ fontSize: '0.75rem', py: 0.75 }}>
        <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>
          {issue.issueDate ? new Date(issue.issueDate).toLocaleDateString() : 'N/A'}
        </Typography>
      </TableCell>
      <TableCell sx={{ fontSize: '0.75rem', py: 0.75 }}>
        <Chip label={issue.status || 'ISSUED'} color={getStatusColor(issue.status)} size="small" sx={{ height: 18, fontSize: '0.55rem' }} />
      </TableCell>
      <TableCell sx={{ fontSize: '0.75rem', py: 0.75 }}>
        <Stack direction="row" spacing={0.25}>
          <Tooltip title="View Details">
            <IconButton size="small" color="primary" onClick={() => onView(issue)} sx={{ p: 0.5 }}>
              <Visibility sx={{ fontSize: '0.9rem' }} />
            </IconButton>
          </Tooltip>
          {issue.status !== 'RETURNED' && (
            <>
              <Tooltip title="Return Items">
                <IconButton size="small" color="success" onClick={() => onReturn(issue)} sx={{ p: 0.5 }}>
                  <SwapHoriz sx={{ fontSize: '0.9rem' }} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Swap Item">
                <IconButton size="small" color="warning" onClick={() => onSwap(issue)} sx={{ p: 0.5 }}>
                  <LocalOffer sx={{ fontSize: '0.9rem' }} />
                </IconButton>
              </Tooltip>
            </>
          )}
        </Stack>
      </TableCell>
    </TableRow>
  );
};

// Main Inventory Component
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
  const [driverIssues, setDriverIssues] = useState([]);
  const [loadingIssues, setLoadingIssues] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [loadingDrivers, setLoadingDrivers] = useState(false);

  // Dialog states
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showIssueDialog, setShowIssueDialog] = useState(false);
  const [showDriverIssueDialog, setShowDriverIssueDialog] = useState(false);
  const [showReturnDialog, setShowReturnDialog] = useState(false);
  const [showSwapDialog, setShowSwapDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [selectedIssueItem, setSelectedIssueItem] = useState(null);

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
    itemId: '',
    vehicleId: '',
    driverId: '',
    tripId: '',
    quantity: 1,
    condition: 'NEW',
    notes: '',
  });
  const [driverIssueFormData, setDriverIssueFormData] = useState({
    driverId: '',
    quantity: 1,
    condition: 'NEW',
    notes: '',
  });
  const [returnFormData, setReturnFormData] = useState({
    quantity: 1,
    condition: 'DAMAGED',
    notes: '',
  });
  const [swapFormData, setSwapFormData] = useState({
    oldItemId: '',
    newItemId: '',
    newQuantity: 1,
    returnQuantity: 1,
    damagedCondition: 'DAMAGED',
    damageNotes: '',
    issueType: 'vehicle',
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

      // Get vehicles
      try {
        setLoadingVehicles(true);
        const vehiclesResponse = await vehicleService.getAllVehicles();
        let vehiclesData = [];
        if (Array.isArray(vehiclesResponse)) {
          vehiclesData = vehiclesResponse;
        } else if (vehiclesResponse?.content) {
          vehiclesData = vehiclesResponse.content;
        } else if (vehiclesResponse?.data) {
          vehiclesData = Array.isArray(vehiclesResponse.data) ? vehiclesResponse.data : [];
        }
        setVehicles(vehiclesData);
      } catch (err) {
        console.error('Error loading vehicles:', err);
      } finally {
        setLoadingVehicles(false);
      }

      // Get drivers
      try {
        setLoadingDrivers(true);
        const driversResponse = await driverService.getAllDrivers();
        let driversData = [];
        if (Array.isArray(driversResponse)) {
          driversData = driversResponse;
        } else if (driversResponse?.content) {
          driversData = driversResponse.content;
        } else if (driversResponse?.data) {
          driversData = Array.isArray(driversResponse.data) ? driversResponse.data : [];
        }
        setDrivers(driversData);
      } catch (err) {
        console.error('Error loading drivers:', err);
      } finally {
        setLoadingDrivers(false);
      }
      
      // Get stats
      try {
        const statsResponse = await inventoryService.getInventoryStats();
        setStats(statsResponse);
      } catch (err) {
        console.error('Error loading stats:', err);
      }

      // Load issues if tabs are active
      if (activeTab === 1) {
        await loadVehicleIssues();
      }
      if (activeTab === 2) {
        await loadDriverIssues();
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
      const response = await vehicleIssueService.getVehicleIssues();
      let issuesData = [];
      if (Array.isArray(response)) {
        issuesData = response;
      } else if (response?.content && Array.isArray(response.content)) {
        issuesData = response.content;
      } else if (response?.data && Array.isArray(response.data)) {
        issuesData = response.data;
      }
      setVehicleIssues(issuesData);
    } catch (err) {
      console.error('Error loading vehicle issues:', err);
      setVehicleIssues([]);
    } finally {
      setLoadingIssues(false);
    }
  };

  const loadDriverIssues = async () => {
    setLoadingIssues(true);
    try {
      const response = await vehicleIssueService.getDriverIssues();
      let issuesData = [];
      if (Array.isArray(response)) {
        issuesData = response;
      } else if (response?.content && Array.isArray(response.content)) {
        issuesData = response.content;
      } else if (response?.data && Array.isArray(response.data)) {
        issuesData = response.data;
      }
      setDriverIssues(issuesData);
    } catch (err) {
      console.error('Error loading driver issues:', err);
      setDriverIssues([]);
    } finally {
      setLoadingIssues(false);
    }
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    if (newValue === 1) loadVehicleIssues();
    if (newValue === 2) loadDriverIssues();
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
      locationId: locations.length > 0 ? locations[0].id : '',
      quantity: 0,
      unitCost: 0,
      minLevel: 0,
      notes: '',
    });
    setFormErrors({});
    setShowAddDialog(true);
  };

  // Issue operations - Vehicle
  const handleIssueItem = (item) => {
    setSelectedItem(item);
    setIssueFormData({
      itemId: item.id,
      vehicleId: '',
      driverId: '',
      tripId: '',
      quantity: 1,
      condition: 'NEW',
      notes: '',
    });
    setShowIssueDialog(true);
  };

  // Issue operations - Driver
  const handleIssueToDriver = (item) => {
    setSelectedItem(item);
    setDriverIssueFormData({
      driverId: '',
      quantity: 1,
      condition: 'NEW',
      notes: '',
    });
    setShowDriverIssueDialog(true);
  };

  const handleReceiveItem = (item) => {
    setSelectedItem(item);
    setReturnFormData({
      quantity: 1,
      condition: 'GOOD',
      notes: '',
    });
    setShowReturnDialog(true);
  };

  const handleReturnItems = (issue) => {
    setSelectedIssue(issue);
    const firstItem = issue.items?.[0];
    setSelectedItem(firstItem);
    setReturnFormData({
      quantity: firstItem?.quantityIssued || 1,
      condition: 'DAMAGED',
      notes: '',
    });
    setShowReturnDialog(true);
  };

  const handleSwap = (issue) => {
    setSelectedIssue(issue);
    const firstItem = issue.items?.[0];
    setSelectedIssueItem(firstItem);
    setSwapFormData({
      oldItemId: firstItem?.itemId || '',
      newItemId: '',
      newQuantity: 1,
      returnQuantity: firstItem?.quantityIssued || 1,
      damagedCondition: 'DAMAGED',
      damageNotes: '',
      issueType: issue.issueNumber?.startsWith('DI-') ? 'driver' : 'vehicle',
    });
    setShowSwapDialog(true);
  };

  const handleSubmitVehicleIssue = async () => {
    try {
      const itemId = selectedItem?.id || issueFormData.itemId;
      
      if (!itemId) {
        setError('Please select an item');
        return;
      }
      
      if (!issueFormData.vehicleId || !issueFormData.driverId || issueFormData.quantity <= 0) {
        setError('Please fill in all required fields');
        return;
      }

      const payload = {
        vehicleId: parseInt(issueFormData.vehicleId),
        driverId: parseInt(issueFormData.driverId),
        tripId: issueFormData.tripId ? parseInt(issueFormData.tripId) : null,
        items: [{
          itemId: parseInt(itemId),
          quantity: parseFloat(issueFormData.quantity),
          condition: issueFormData.condition,
          notes: issueFormData.notes,
        }],
      };

      await vehicleIssueService.createVehicleIssue(payload);
      showSuccess('Items issued to vehicle successfully');
      setShowIssueDialog(false);
      resetForms();
      await loadData();
      if (activeTab === 1) await loadVehicleIssues();
    } catch (err) {
      console.error('Error issuing items:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to issue items';
      setError(errorMessage);
    }
  };

  const handleSubmitDriverIssue = async () => {
    try {
      if (!driverIssueFormData.driverId || driverIssueFormData.quantity <= 0) {
        setError('Please fill in all required fields');
        return;
      }

      const itemId = selectedItem?.id;
      if (!itemId) {
        setError('Please select an item');
        return;
      }

      const payload = {
        driverId: parseInt(driverIssueFormData.driverId),
        items: [{
          itemId: parseInt(itemId),
          quantity: parseFloat(driverIssueFormData.quantity),
          condition: driverIssueFormData.condition,
          notes: driverIssueFormData.notes,
        }],
      };

      await vehicleIssueService.createDriverIssue(payload);
      showSuccess('Items issued to driver successfully');
      setShowDriverIssueDialog(false);
      resetForms();
      await loadData();
      if (activeTab === 2) await loadDriverIssues();
    } catch (err) {
      console.error('Error issuing items to driver:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to issue items to driver';
      setError(errorMessage);
    }
  };

  const handleSubmitReturn = async () => {
    try {
      if (returnFormData.quantity <= 0) {
        setError('Please enter a valid quantity');
        return;
      }

      const itemId = selectedItem?.id || selectedIssueItem?.itemId;
      if (!itemId) {
        setError('No item selected for return');
        return;
      }

      const returnPayload = [{
        itemId: parseInt(itemId),
        quantity: parseFloat(returnFormData.quantity),
        condition: returnFormData.condition,
        notes: returnFormData.notes,
      }];

      if (selectedIssue?.issueNumber?.startsWith('DI-')) {
        await vehicleIssueService.returnDriverItems(selectedIssue.id, returnPayload);
      } else {
        await vehicleIssueService.returnItems(selectedIssue.id, returnPayload);
      }
      
      showSuccess('Items returned successfully');
      setShowReturnDialog(false);
      resetForms();
      await loadData();
      if (activeTab === 1) await loadVehicleIssues();
      if (activeTab === 2) await loadDriverIssues();
    } catch (err) {
      console.error('Error returning items:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to return items';
      setError(errorMessage);
    }
  };

  const handleSubmitSwap = async () => {
    try {
      if (!swapFormData.newItemId || swapFormData.newQuantity <= 0) {
        setError('Please select a replacement item and enter a valid quantity');
        return;
      }

      const swapPayload = {
        oldItemId: parseInt(swapFormData.oldItemId),
        newItemId: parseInt(swapFormData.newItemId),
        newQuantity: parseInt(swapFormData.newQuantity),
        returnQuantity: parseFloat(swapFormData.returnQuantity),
        damagedCondition: swapFormData.damagedCondition,
        damageNotes: swapFormData.damageNotes,
        condition: swapFormData.damagedCondition,
      };

      if (swapFormData.issueType === 'driver') {
        await vehicleIssueService.swapDriverItem(selectedIssue.id, swapPayload);
      } else {
        await vehicleIssueService.swapItem(selectedIssue.id, swapPayload);
      }
      
      showSuccess('Item swapped successfully!');
      setShowSwapDialog(false);
      resetForms();
      await loadData();
      if (activeTab === 1) await loadVehicleIssues();
      if (activeTab === 2) await loadDriverIssues();
    } catch (err) {
      console.error('Error swapping item:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to swap item';
      setError(errorMessage);
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      const payload = {
        name: formData.name.trim(),
        category: formData.category,
        unitOfMeasure: formData.unitOfMeasure || 'EA',
        isConsumable: formData.isConsumable !== false,
        reorderLevel: parseInt(formData.reorderLevel) || 0,
        locationId: parseInt(formData.locationId),
        quantity: parseInt(formData.quantity) || 0,
        unitCost: parseFloat(formData.unitCost) || 0,
        minLevel: parseInt(formData.minLevel) || 0,
        notes: formData.notes || '',
      };

      if (selectedItem) {
        await inventoryService.updateInventoryItem(selectedItem.id, payload);
        showSuccess('Item updated successfully');
      } else {
        await inventoryService.createInventoryItem(payload);
        showSuccess('Item created successfully');
      }

      setShowAddDialog(false);
      resetForms();
      await loadData();
    } catch (err) {
      console.error('Error saving inventory item:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to save inventory item';
      setError(errorMessage);
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Name is required';
    if (!formData.category) errors.category = 'Category is required';
    if (!formData.locationId) errors.locationId = 'Location is required';
    if (formData.minLevel < 0) errors.minLevel = 'Min level cannot be negative';
    if (formData.quantity < 0) errors.quantity = 'Quantity cannot be negative';
    if (formData.unitCost < 0) errors.unitCost = 'Unit cost cannot be negative';
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

  const resetForms = () => {
    setIssueFormData({ 
      itemId: '', 
      vehicleId: '', 
      driverId: '', 
      tripId: '', 
      quantity: 1, 
      condition: 'NEW', 
      notes: '' 
    });
    setDriverIssueFormData({ 
      driverId: '', 
      quantity: 1, 
      condition: 'NEW', 
      notes: '' 
    });
    setReturnFormData({ 
      quantity: 1, 
      condition: 'DAMAGED', 
      notes: '' 
    });
    setSwapFormData({ 
      oldItemId: '', 
      newItemId: '', 
      newQuantity: 1, 
      returnQuantity: 1, 
      damagedCondition: 'DAMAGED', 
      damageNotes: '', 
      issueType: 'vehicle' 
    });
    setSelectedItem(null);
    setSelectedIssue(null);
    setSelectedIssueItem(null);
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

  // Loading state
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
          <Tab label="Driver Issues" icon={<Person sx={{ fontSize: '0.9rem' }} />} iconPosition="start" sx={{ fontSize: '0.75rem', minHeight: 36 }} />
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
            <StatCard title="Total Items" value={inventoryItems.length} icon={InventoryIcon} color="primary" />
          </Grid>
          <Grid item xs={6} sm={3}>
            <StatCard title="Low Stock" value={inventoryItems.filter(i => i.quantity > 0 && i.quantity <= i.minLevel).length} icon={WarningIcon} color="warning" />
          </Grid>
          <Grid item xs={6} sm={3}>
            <StatCard title="Out of Stock" value={inventoryItems.filter(i => i.quantity <= 0).length} icon={CancelIcon} color="error" />
          </Grid>
          <Grid item xs={6} sm={3}>
            <StatCard title="Locations" value={locations.length} icon={LocationOn} color="info" />
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
                        <Typography color="text.secondary" sx={{ fontSize: '0.8rem' }}>No inventory items found</Typography>
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
                        onIssueToDriver={handleIssueToDriver}
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
              <Chip label={`${vehicleIssues.length} issues`} size="small" sx={{ ml: 1, height: 18, fontSize: '0.55rem' }} />
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add sx={{ fontSize: '0.9rem' }} />}
              size="small"
              sx={{ fontSize: '0.75rem' }}
              onClick={() => {
                setSelectedItem(null);
                setIssueFormData({ 
                  itemId: '',
                  vehicleId: '', 
                  driverId: '', 
                  tripId: '', 
                  quantity: 1, 
                  condition: 'NEW', 
                  notes: '' 
                });
                setShowIssueDialog(true);
              }}
            >
              New Issue
            </Button>
          </Stack>
        </Paper>

        <Card sx={{ borderRadius: 1.5 }}>
          <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
            {loadingIssues ? (
              <Box display="flex" justifyContent="center" py={3}><CircularProgress size={30} /></Box>
            ) : vehicleIssues.length === 0 ? (
              <Box py={3} textAlign="center">
                <Typography color="text.secondary" sx={{ fontSize: '0.8rem' }}>No vehicle issues found</Typography>
                <Button variant="outlined" size="small" sx={{ mt: 1, fontSize: '0.75rem' }} onClick={() => { 
                  setSelectedItem(null);
                  setIssueFormData({ 
                    itemId: '',
                    vehicleId: '', 
                    driverId: '', 
                    tripId: '', 
                    quantity: 1, 
                    condition: 'NEW', 
                    notes: '' 
                  });
                  setShowIssueDialog(true);
                }}>
                  Create First Issue
                </Button>
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
                    {vehicleIssues.map((issue) => (
                      <VehicleIssueRow
                        key={issue.id}
                        issue={issue}
                        onView={() => {}}
                        onReturn={handleReturnItems}
                        onSwap={handleSwap}
                        vehicles={vehicles}
                        drivers={drivers}
                      />
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      </TabPanel>

      {/* Tab: Driver Issues */}
      <TabPanel value={activeTab} index={2}>
        <Paper sx={{ p: 1.5, mb: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="subtitle2" sx={{ fontSize: '0.85rem', fontWeight: 600 }}>
              Driver Issues
              <Chip label={`${driverIssues.length} issues`} size="small" sx={{ ml: 1, height: 18, fontSize: '0.55rem' }} />
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add sx={{ fontSize: '0.9rem' }} />}
              size="small"
              sx={{ fontSize: '0.75rem' }}
              onClick={() => {
                setSelectedItem(null);
                setDriverIssueFormData({ 
                  driverId: '', 
                  quantity: 1, 
                  condition: 'NEW', 
                  notes: '' 
                });
                setShowDriverIssueDialog(true);
              }}
            >
              New Driver Issue
            </Button>
          </Stack>
        </Paper>

        <Card sx={{ borderRadius: 1.5 }}>
          <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
            {loadingIssues ? (
              <Box display="flex" justifyContent="center" py={3}><CircularProgress size={30} /></Box>
            ) : driverIssues.length === 0 ? (
              <Box py={3} textAlign="center">
                <Typography color="text.secondary" sx={{ fontSize: '0.8rem' }}>No driver issues found</Typography>
                <Button variant="outlined" size="small" sx={{ mt: 1, fontSize: '0.75rem' }} onClick={() => { 
                  setSelectedItem(null);
                  setDriverIssueFormData({ 
                    driverId: '', 
                    quantity: 1, 
                    condition: 'NEW', 
                    notes: '' 
                  });
                  setShowDriverIssueDialog(true);
                }}>
                  Create First Issue
                </Button>
              </Box>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600, py: 0.75 }}>Issue #</TableCell>
                      <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600, py: 0.75 }}>Driver</TableCell>
                      <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600, py: 0.75 }}>Item</TableCell>
                      <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600, py: 0.75 }}>Items</TableCell>
                      <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600, py: 0.75 }}>Date</TableCell>
                      <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600, py: 0.75 }}>Status</TableCell>
                      <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600, py: 0.75 }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {driverIssues.map((issue) => (
                      <DriverIssueRow
                        key={issue.id}
                        issue={issue}
                        onView={() => {}}
                        onReturn={handleReturnItems}
                        onSwap={handleSwap}
                        drivers={drivers}
                        inventoryItems={inventoryItems}
                      />
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      </TabPanel>

      {/* Tab: Stock Movements */}
      <TabPanel value={activeTab} index={3}>
        <MovementHistory />
      </TabPanel>

      {/* ==================== DIALOGS ==================== */}

      {/* Add/Edit Item Dialog */}
      <Dialog open={showAddDialog} onClose={() => setShowAddDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ py: 1.5, px: 2.5, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
            {selectedItem ? 'Edit Inventory Item' : 'Add New Inventory Item'}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ p: 2.5 }}>
          <Stack spacing={2}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  label="Item Name *"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  fullWidth
                  size="small"
                  error={!!formErrors.name}
                  helperText={formErrors.name}
                  sx={{ fontSize: '0.8rem' }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Category *"
                  name="category"
                  value={formData.category}
                  onChange={handleFormChange}
                  fullWidth
                  size="small"
                  error={!!formErrors.category}
                  helperText={formErrors.category}
                  sx={{ fontSize: '0.8rem' }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel sx={{ fontSize: '0.75rem' }}>Unit of Measure</InputLabel>
                  <Select
                    name="unitOfMeasure"
                    value={formData.unitOfMeasure}
                    onChange={handleFormChange}
                    label="Unit of Measure"
                    sx={{ fontSize: '0.8rem' }}
                  >
                    <MenuItem value="EA" sx={{ fontSize: '0.8rem' }}>Each (EA)</MenuItem>
                    <MenuItem value="LTR" sx={{ fontSize: '0.8rem' }}>Litre (LTR)</MenuItem>
                    <MenuItem value="KG" sx={{ fontSize: '0.8rem' }}>Kilogram (KG)</MenuItem>
                    <MenuItem value="M" sx={{ fontSize: '0.8rem' }}>Meter (M)</MenuItem>
                    <MenuItem value="BOX" sx={{ fontSize: '0.8rem' }}>Box (BOX)</MenuItem>
                    <MenuItem value="PK" sx={{ fontSize: '0.8rem' }}>Pack (PK)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Quantity"
                  name="quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={handleFormChange}
                  fullWidth
                  size="small"
                  error={!!formErrors.quantity}
                  helperText={formErrors.quantity}
                  InputProps={{ inputProps: { min: 0 } }}
                  sx={{ fontSize: '0.8rem' }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Min Level"
                  name="minLevel"
                  type="number"
                  value={formData.minLevel}
                  onChange={handleFormChange}
                  fullWidth
                  size="small"
                  error={!!formErrors.minLevel}
                  helperText={formErrors.minLevel}
                  InputProps={{ inputProps: { min: 0 } }}
                  sx={{ fontSize: '0.8rem' }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Unit Cost (R)"
                  name="unitCost"
                  type="number"
                  value={formData.unitCost}
                  onChange={handleFormChange}
                  fullWidth
                  size="small"
                  error={!!formErrors.unitCost}
                  helperText={formErrors.unitCost}
                  InputProps={{ inputProps: { min: 0, step: 0.01 } }}
                  sx={{ fontSize: '0.8rem' }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small" error={!!formErrors.locationId}>
                  <InputLabel sx={{ fontSize: '0.75rem' }}>Location *</InputLabel>
                  <Select
                    name="locationId"
                    value={formData.locationId}
                    onChange={handleFormChange}
                    label="Location *"
                    sx={{ fontSize: '0.8rem' }}
                  >
                    <MenuItem value="" sx={{ fontSize: '0.8rem' }}>Select Location</MenuItem>
                    {locations.map((loc) => (
                      <MenuItem key={loc.id} value={loc.id} sx={{ fontSize: '0.8rem' }}>{loc.name}</MenuItem>
                    ))}
                  </Select>
                  {formErrors.locationId && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5, fontSize: '0.7rem' }}>
                      {formErrors.locationId}
                    </Typography>
                  )}
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      name="isConsumable"
                      checked={formData.isConsumable}
                      onChange={handleFormChange}
                      size="small"
                    />
                  }
                  label="Is Consumable Item"
                  sx={{ fontSize: '0.8rem' }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleFormChange}
                  fullWidth
                  size="small"
                  multiline
                  rows={2}
                  sx={{ fontSize: '0.8rem' }}
                />
              </Grid>
            </Grid>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 2.5, py: 1.5, borderTop: 1, borderColor: 'divider' }}>
          <Button onClick={() => setShowAddDialog(false)} size="small" sx={{ fontSize: '0.8rem' }}>
            Cancel
          </Button>
          <Button variant="contained" size="small" onClick={handleSubmit} sx={{ fontSize: '0.8rem' }}>
            {selectedItem ? 'Update Item' : 'Add Item'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={showViewDialog} onClose={() => setShowViewDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ py: 1.5, px: 2.5, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>Item Details</Typography>
        </DialogTitle>
        <DialogContent sx={{ p: 2.5 }}>
          {selectedItem && (
            <Stack spacing={2}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>Name</Typography>
                  <Typography variant="body1" sx={{ fontSize: '0.9rem', fontWeight: 500 }}>{selectedItem.name}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>Category</Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>{selectedItem.category || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>Unit of Measure</Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>{selectedItem.unitOfMeasure || 'EA'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>Quantity</Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.85rem', fontWeight: 500 }}>{selectedItem.quantity}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>Min Level</Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>{selectedItem.minLevel || 0}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>Unit Cost</Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>R {selectedItem.unitCost?.toFixed(2) || '0.00'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>Location</Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                    {locations.find(l => l.id === selectedItem.locationId)?.name || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>Status</Typography>
                  <Chip
                    label={selectedItem.quantity <= 0 ? 'Out of Stock' : selectedItem.quantity <= selectedItem.minLevel ? 'Low Stock' : 'In Stock'}
                    color={selectedItem.quantity <= 0 ? 'error' : selectedItem.quantity <= selectedItem.minLevel ? 'warning' : 'success'}
                    size="small"
                    sx={{ mt: 0.5, height: 20, fontSize: '0.65rem' }}
                  />
                </Grid>
                {selectedItem.notes && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>Notes</Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>{selectedItem.notes}</Typography>
                  </Grid>
                )}
              </Grid>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 2.5, py: 1.5, borderTop: 1, borderColor: 'divider' }}>
          <Button onClick={() => setShowViewDialog(false)} size="small" sx={{ fontSize: '0.8rem' }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Vehicle Issue Dialog */}
      <Dialog open={showIssueDialog} onClose={() => setShowIssueDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ py: 1.5, px: 2.5, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>Issue Item to Vehicle</Typography>
        </DialogTitle>
        <DialogContent sx={{ p: 2.5 }}>
          <Stack spacing={2}>
            <FormControl fullWidth size="small" required>
              <InputLabel sx={{ fontSize: '0.75rem' }}>Select Item *</InputLabel>
              <Select
                value={selectedItem?.id || issueFormData.itemId || ''}
                onChange={(e) => {
                  const item = inventoryItems.find(i => i.id === e.target.value);
                  setSelectedItem(item);
                  setIssueFormData(prev => ({ 
                    ...prev, 
                    itemId: e.target.value,
                    quantity: 1
                  }));
                }}
                label="Select Item *"
                sx={{ fontSize: '0.8rem' }}
              >
                <MenuItem value="" sx={{ fontSize: '0.8rem' }}>Choose an item...</MenuItem>
                {inventoryItems.map((item) => (
                  <MenuItem key={item.id} value={item.id} sx={{ fontSize: '0.8rem' }}>
                    {item.name} (Available: {item.quantity} {item.unitOfMeasure || 'EA'})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {selectedItem && (
              <>
                <Alert severity="info" sx={{ fontSize: '0.8rem' }}>
                  Issuing: <strong>{selectedItem.name}</strong> (Available: {selectedItem.quantity} {selectedItem.unitOfMeasure || 'EA'})
                </Alert>
                
                <FormControl fullWidth size="small" required>
                  <InputLabel sx={{ fontSize: '0.75rem' }}>Vehicle *</InputLabel>
                  <Select 
                    value={issueFormData.vehicleId} 
                    onChange={(e) => setIssueFormData(prev => ({ ...prev, vehicleId: e.target.value }))} 
                    label="Vehicle *" 
                    disabled={loadingVehicles} 
                    sx={{ fontSize: '0.8rem' }}
                  >
                    <MenuItem value="" sx={{ fontSize: '0.8rem' }}>{loadingVehicles ? 'Loading vehicles...' : 'Select Vehicle'}</MenuItem>
                    {vehicles.map((vehicle) => (
                      <MenuItem key={vehicle.id} value={vehicle.id} sx={{ fontSize: '0.8rem' }}>
                        {vehicle.registrationNumber || vehicle.regNumber || `Vehicle #${vehicle.id}`}
                        {vehicle.make && ` - ${vehicle.make}`}{vehicle.model && ` ${vehicle.model}`}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                <FormControl fullWidth size="small" required>
                  <InputLabel sx={{ fontSize: '0.75rem' }}>Driver *</InputLabel>
                  <Select 
                    value={issueFormData.driverId} 
                    onChange={(e) => setIssueFormData(prev => ({ ...prev, driverId: e.target.value }))} 
                    label="Driver *" 
                    disabled={loadingDrivers} 
                    sx={{ fontSize: '0.8rem' }}
                  >
                    <MenuItem value="" sx={{ fontSize: '0.8rem' }}>{loadingDrivers ? 'Loading drivers...' : 'Select Driver'}</MenuItem>
                    {drivers.map((driver) => (
                      <MenuItem key={driver.id} value={driver.id} sx={{ fontSize: '0.8rem' }}>
                        {driver.fullName || `${driver.firstName || ''} ${driver.lastName || ''}`.trim() || `Driver #${driver.id}`}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                <TextField 
                  label="Trip ID (Optional)" 
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
                  InputProps={{ 
                    inputProps: { 
                      min: 0.01, 
                      max: selectedItem.quantity 
                    } 
                  }} 
                  helperText={`Max: ${selectedItem.quantity}`} 
                />
                
                <FormControl fullWidth size="small">
                  <InputLabel sx={{ fontSize: '0.75rem' }}>Condition</InputLabel>
                  <Select 
                    value={issueFormData.condition} 
                    onChange={(e) => setIssueFormData(prev => ({ ...prev, condition: e.target.value }))} 
                    label="Condition" 
                    sx={{ fontSize: '0.8rem' }}
                  >
                    <MenuItem value="GOOD" sx={{ fontSize: '0.8rem' }}>Good</MenuItem>
                    <MenuItem value="NEW" sx={{ fontSize: '0.8rem' }}>New</MenuItem>
                    <MenuItem value="WOR" sx={{ fontSize: '0.8rem' }}>Worn</MenuItem>
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
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 2.5, py: 1.5, borderTop: 1, borderColor: 'divider' }}>
          <Button onClick={() => setShowIssueDialog(false)} size="small" sx={{ fontSize: '0.8rem' }}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            size="small" 
            onClick={handleSubmitVehicleIssue} 
            sx={{ fontSize: '0.8rem' }}
            disabled={!selectedItem || !issueFormData.vehicleId || !issueFormData.driverId || issueFormData.quantity <= 0}
          >
            Issue Item
          </Button>
        </DialogActions>
      </Dialog>

      {/* Driver Issue Dialog */}
      <Dialog open={showDriverIssueDialog} onClose={() => setShowDriverIssueDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ py: 1.5, px: 2.5, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>Issue Item to Driver</Typography>
        </DialogTitle>
        <DialogContent sx={{ p: 2.5 }}>
          <Stack spacing={2}>
            <FormControl fullWidth size="small" required>
              <InputLabel sx={{ fontSize: '0.75rem' }}>Select Item *</InputLabel>
              <Select
                value={selectedItem?.id || ''}
                onChange={(e) => {
                  const item = inventoryItems.find(i => i.id === e.target.value);
                  setSelectedItem(item);
                  setDriverIssueFormData(prev => ({ 
                    ...prev, 
                    quantity: 1
                  }));
                }}
                label="Select Item *"
                sx={{ fontSize: '0.8rem' }}
              >
                <MenuItem value="" sx={{ fontSize: '0.8rem' }}>Choose an item...</MenuItem>
                {inventoryItems.map((item) => (
                  <MenuItem key={item.id} value={item.id} sx={{ fontSize: '0.8rem' }}>
                    {item.name} (Available: {item.quantity} {item.unitOfMeasure || 'EA'})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {selectedItem && (
              <>
                <Alert severity="info" sx={{ fontSize: '0.8rem' }}>
                  Issuing: <strong>{selectedItem.name}</strong> (Available: {selectedItem.quantity} {selectedItem.unitOfMeasure || 'EA'})
                </Alert>
                
                <FormControl fullWidth size="small" required>
                  <InputLabel sx={{ fontSize: '0.75rem' }}>Driver *</InputLabel>
                  <Select 
                    value={driverIssueFormData.driverId} 
                    onChange={(e) => setDriverIssueFormData(prev => ({ ...prev, driverId: e.target.value }))} 
                    label="Driver *" 
                    disabled={loadingDrivers} 
                    sx={{ fontSize: '0.8rem' }}
                  >
                    <MenuItem value="" sx={{ fontSize: '0.8rem' }}>{loadingDrivers ? 'Loading drivers...' : 'Select Driver'}</MenuItem>
                    {drivers.map((driver) => (
                      <MenuItem key={driver.id} value={driver.id} sx={{ fontSize: '0.8rem' }}>
                        {driver.fullName || `${driver.firstName || ''} ${driver.lastName || ''}`.trim() || `Driver #${driver.id}`}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                <TextField 
                  label="Quantity *" 
                  type="number" 
                  value={driverIssueFormData.quantity} 
                  onChange={(e) => setDriverIssueFormData(prev => ({ ...prev, quantity: e.target.value }))} 
                  fullWidth 
                  size="small" 
                  InputProps={{ 
                    inputProps: { 
                      min: 0.01, 
                      max: selectedItem.quantity 
                    } 
                  }} 
                  helperText={`Max: ${selectedItem.quantity}`} 
                />
                
                <FormControl fullWidth size="small">
                  <InputLabel sx={{ fontSize: '0.75rem' }}>Condition</InputLabel>
                  <Select 
                    value={driverIssueFormData.condition} 
                    onChange={(e) => setDriverIssueFormData(prev => ({ ...prev, condition: e.target.value }))} 
                    label="Condition" 
                    sx={{ fontSize: '0.8rem' }}
                  >
                    <MenuItem value="GOOD" sx={{ fontSize: '0.8rem' }}>Good</MenuItem>
                    <MenuItem value="NEW" sx={{ fontSize: '0.8rem' }}>New</MenuItem>
                    <MenuItem value="WOR" sx={{ fontSize: '0.8rem' }}>Worn</MenuItem>
                  </Select>
                </FormControl>
                
                <TextField 
                  label="Notes" 
                  value={driverIssueFormData.notes} 
                  onChange={(e) => setDriverIssueFormData(prev => ({ ...prev, notes: e.target.value }))} 
                  fullWidth 
                  size="small" 
                  multiline 
                  rows={2} 
                />
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 2.5, py: 1.5, borderTop: 1, borderColor: 'divider' }}>
          <Button onClick={() => setShowDriverIssueDialog(false)} size="small" sx={{ fontSize: '0.8rem' }}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            size="small" 
            onClick={handleSubmitDriverIssue} 
            sx={{ fontSize: '0.8rem' }}
            disabled={!selectedItem || !driverIssueFormData.driverId || driverIssueFormData.quantity <= 0}
          >
            Issue to Driver
          </Button>
        </DialogActions>
      </Dialog>

      {/* Return Dialog */}
      <Dialog open={showReturnDialog} onClose={() => setShowReturnDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ py: 1.5, px: 2.5, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>Return Item</Typography>
        </DialogTitle>
        <DialogContent sx={{ p: 2.5 }}>
          {selectedItem && (
            <Stack spacing={2}>
              <Alert severity="info" sx={{ fontSize: '0.8rem' }}>
                Returning: <strong>{selectedItem.name}</strong>
                {selectedIssue && ` from ${selectedIssue.issueNumber}`}
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
                <InputLabel sx={{ fontSize: '0.75rem' }}>Condition</InputLabel>
                <Select 
                  value={returnFormData.condition} 
                  onChange={(e) => setReturnFormData(prev => ({ ...prev, condition: e.target.value }))} 
                  label="Condition" 
                  sx={{ fontSize: '0.8rem' }}
                >
                  <MenuItem value="GOOD" sx={{ fontSize: '0.8rem' }}>Good</MenuItem>
                  <MenuItem value="DAMAGED" sx={{ fontSize: '0.8rem' }}>Damaged</MenuItem>
                  <MenuItem value="WOR" sx={{ fontSize: '0.8rem' }}>Worn</MenuItem>
                  <MenuItem value="FAULTY" sx={{ fontSize: '0.8rem' }}>Faulty</MenuItem>
                  <MenuItem value="BROKEN" sx={{ fontSize: '0.8rem' }}>Broken</MenuItem>
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
          <Button onClick={() => setShowReturnDialog(false)} size="small" sx={{ fontSize: '0.8rem' }}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            size="small" 
            onClick={handleSubmitReturn} 
            sx={{ fontSize: '0.8rem' }}
            disabled={returnFormData.quantity <= 0}
          >
            Return Item
          </Button>
        </DialogActions>
      </Dialog>

      {/* Swap Dialog */}
      <Dialog open={showSwapDialog} onClose={() => setShowSwapDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ py: 1.5, px: 2.5, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>Swap Item</Typography>
        </DialogTitle>
        <DialogContent sx={{ p: 2.5 }}>
          {selectedIssue && selectedIssueItem && (
            <Stack spacing={2}>
              <Alert severity="warning" sx={{ fontSize: '0.8rem' }}>
                Swapping: <strong>{selectedIssueItem.itemName || `Item #${selectedIssueItem.itemId}`}</strong>
                <br />From Issue: <strong>{selectedIssue.issueNumber}</strong>
              </Alert>
              
              <TextField 
                label="Current Item" 
                value={selectedIssueItem.itemName || `Item #${selectedIssueItem.itemId}`} 
                fullWidth 
                size="small" 
                disabled 
              />
              
              <FormControl fullWidth size="small" required>
                <InputLabel sx={{ fontSize: '0.75rem' }}>Replacement Item *</InputLabel>
                <Select 
                  value={swapFormData.newItemId} 
                  onChange={(e) => setSwapFormData(prev => ({ ...prev, newItemId: e.target.value }))} 
                  label="Replacement Item *" 
                  sx={{ fontSize: '0.8rem' }}
                >
                  <MenuItem value="" sx={{ fontSize: '0.8rem' }}>Select Replacement Item</MenuItem>
                  {inventoryItems
                    .filter(item => item.id !== selectedIssueItem.itemId)
                    .map((item) => (
                      <MenuItem key={item.id} value={item.id} sx={{ fontSize: '0.8rem' }}>
                        {item.name} (Available: {item.quantity} {item.unitOfMeasure || 'EA'})
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
              
              <Grid container spacing={1.5}>
                <Grid item xs={6}>
                  <TextField 
                    label="New Quantity" 
                    type="number" 
                    value={swapFormData.newQuantity} 
                    onChange={(e) => setSwapFormData(prev => ({ ...prev, newQuantity: e.target.value }))} 
                    fullWidth 
                    size="small" 
                    InputProps={{ inputProps: { min: 1 } }} 
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField 
                    label="Return Quantity" 
                    type="number" 
                    value={swapFormData.returnQuantity} 
                    onChange={(e) => setSwapFormData(prev => ({ ...prev, returnQuantity: e.target.value }))} 
                    fullWidth 
                    size="small" 
                    InputProps={{ inputProps: { min: 0.01 } }} 
                  />
                </Grid>
              </Grid>
              
              <FormControl fullWidth size="small" required>
                <InputLabel sx={{ fontSize: '0.75rem' }}>Damaged Condition *</InputLabel>
                <Select 
                  value={swapFormData.damagedCondition} 
                  onChange={(e) => setSwapFormData(prev => ({ ...prev, damagedCondition: e.target.value }))} 
                  label="Damaged Condition *" 
                  sx={{ fontSize: '0.8rem' }}
                >
                  <MenuItem value="DAMAGED" sx={{ fontSize: '0.8rem' }}>Damaged</MenuItem>
                  <MenuItem value="FAULTY" sx={{ fontSize: '0.8rem' }}>Faulty</MenuItem>
                  <MenuItem value="BROKEN" sx={{ fontSize: '0.8rem' }}>Broken</MenuItem>
                  <MenuItem value="WORN" sx={{ fontSize: '0.8rem' }}>Worn</MenuItem>
                </Select>
              </FormControl>
              
              <TextField 
                label="Damage Notes" 
                value={swapFormData.damageNotes} 
                onChange={(e) => setSwapFormData(prev => ({ ...prev, damageNotes: e.target.value }))} 
                fullWidth 
                size="small" 
                multiline 
                rows={2} 
                placeholder="Describe the damage or issue..." 
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 2.5, py: 1.5, borderTop: 1, borderColor: 'divider' }}>
          <Button onClick={() => setShowSwapDialog(false)} size="small" sx={{ fontSize: '0.8rem' }}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            color="warning" 
            size="small" 
            onClick={handleSubmitSwap} 
            sx={{ fontSize: '0.8rem' }}
            disabled={!swapFormData.newItemId || swapFormData.newQuantity <= 0}
          >
            Swap Item
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Inventory;
