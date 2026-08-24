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
  Switch,
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
  Lock as LockIcon,
  Event as EventIcon,
  Description as DescriptionIcon,
  PersonAdd as PersonAddIcon,
  AddCircle as AddCircleIcon,
  RemoveCircle as RemoveCircleIcon,
  Adjust as AdjustIcon,
  CompareArrows as CompareArrowsIcon,
  Undo as UndoIcon,
  People,
  CarRental,
  Inventory2,
  QrCode,
} from '@mui/icons-material';
import { inventoryService } from '../services/inventoryService';
import { vehicleIssueService } from '../services/vehicleIssueService';
import { vehicleService } from '../services/vehicleService';
import { driverService } from '../services/driverService';
import MovementHistory from './MovementHistory';
import { inventoryMovementService } from '../services/inventoryMovementService';

// ============================================================
// STAT CARD - Matching Dashboard
// ============================================================
const StatCard = ({ title, value, icon: Icon, color = 'primary', subtitle, badge }) => {
  const getColor = (colorName) => {
    const colors = {
      primary: '#4F46E5',
      success: '#22C55E',
      warning: '#F59E0B',
      error: '#EF4444',
      info: '#3B82F6',
      secondary: '#6B7280',
      purple: '#8B5CF6',
      pink: '#EC4899',
      teal: '#14B8A6',
      indigo: '#6366F1',
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
      secondary: '#F3F4F6',
      purple: '#EDE9FE',
      pink: '#FCE7F3',
      teal: '#CCFBF1',
      indigo: '#E0E7FF',
    };
    return bgColors[color] || bgColors.primary;
  };

  const iconColor = getColor(color);
  const bgColor = getColorBg(color);
  const SafeIcon = Icon || InventoryIcon;

  return (
    <Card
      sx={{
        bgcolor: '#FFFFFF',
        borderRadius: { xs: '12px', sm: '14px', md: '16px' },
        border: '1px solid #ECECEC',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        height: '100%',
        width: '100%',
        position: 'relative',
        overflow: 'visible',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          borderColor: iconColor,
        },
      }}
    >
      <CardContent sx={{ p: { xs: 1.5, sm: 2, md: 2.5 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="caption"
              sx={{
                color: '#6B7280',
                fontWeight: 600,
                textTransform: 'uppercase',
                fontSize: { xs: '0.55rem', sm: '0.6rem', md: '0.65rem' },
                letterSpacing: '0.5px',
                display: 'block',
                mb: 0.25,
              }}
            >
              {title}
            </Typography>
            
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                color: '#111827',
                fontSize: { xs: '1.2rem', sm: '1.4rem', md: '1.6rem', lg: '1.8rem' },
                lineHeight: 1.2,
              }}
            >
              {value || 0}
            </Typography>
            
            {subtitle && (
              <Typography
                variant="caption"
                sx={{
                  color: '#6B7280',
                  display: 'block',
                  mt: 0.25,
                  fontSize: { xs: '0.55rem', sm: '0.6rem', md: '0.65rem' },
                }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>

          <Box
            sx={{
              bgcolor: bgColor,
              borderRadius: { xs: '10px', sm: '12px', md: '14px' },
              p: { xs: 1, sm: 1.25, md: 1.5 },
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'scale(1.05)',
              },
            }}
          >
            <SafeIcon sx={{ 
              color: iconColor, 
              fontSize: { xs: '1.2rem', sm: '1.4rem', md: '1.6rem', lg: '1.8rem' },
            }} />
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
};

// Tab Panel Component
const TabPanel = ({ children, value, index, ...other }) => (
  <div role="tabpanel" hidden={value !== index} {...other}>
    {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
  </div>
);

// ============================================================
// INVENTORY ITEM ROW - WITH SKU
// ============================================================
const InventoryItemRow = ({
  item,
  onView,
  onEdit,
  onDelete,
  locations,
  onIssue,
  onReceive,
  onIssueToDriver,
  onMovement
}) => {
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
  const isDriverIssuable = item.isDriverIssuable !== false;
  const isVehicleIssuable = item.isVehicleIssuable !== false;
  const isHeld = item.isHeld || false;

  // Determine issueable type
  let issueType = 'N/A';
  let issueTypeColor = 'default';
  if (isDriverIssuable && isVehicleIssuable) {
    issueType = 'Both';
    issueTypeColor = 'success';
  } else if (isDriverIssuable) {
    issueType = 'Driver Only';
    issueTypeColor = 'info';
  } else if (isVehicleIssuable) {
    issueType = 'Vehicle Only';
    issueTypeColor = 'warning';
  }

  return (
    <TableRow hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
      {/* SKU */}
      <TableCell sx={{ fontSize: '0.75rem', py: 0.75 }}>
        <Typography variant="body2" sx={{ fontSize: '0.7rem', fontWeight: 600, color: '#4F46E5' }}>
          {item.sku || 'N/A'}
        </Typography>
      </TableCell>

      {/* Item Name */}
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

      {/* Category */}
      <TableCell sx={{ fontSize: '0.75rem', py: 0.75 }}>
        <Chip
          label={item.category || 'Uncategorized'}
          size="small"
          variant="outlined"
          sx={{ height: 18, fontSize: '0.55rem' }}
        />
      </TableCell>

      {/* Quantity */}
      <TableCell sx={{ fontSize: '0.75rem', py: 0.75 }}>
        <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
          {item.quantity} {item.unitOfMeasure || 'EA'}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.55rem' }}>
          Unit Cost: R {item.unitCost?.toFixed(2) || '0.00'}
        </Typography>
      </TableCell>

      {/* Flags - Consumable, Driver Issuable, Vehicle Issuable */}
      <TableCell sx={{ fontSize: '0.75rem', py: 0.75 }}>
        <Stack spacing={0.25}>
          {isConsumable ? (
            <Chip
              label="Consumable"
              size="small"
              color="primary"
              variant="outlined"
              sx={{ height: 16, fontSize: '0.5rem' }}
            />
          ) : (
            <Chip
              label="Non-Consumable"
              size="small"
              color="secondary"
              variant="outlined"
              sx={{ height: 16, fontSize: '0.5rem' }}
            />
          )}
          <Chip
            label={issueType}
            size="small"
            color={issueTypeColor}
            sx={{ height: 16, fontSize: '0.5rem' }}
          />
        </Stack>
      </TableCell>

      {/* Min Level */}
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

      {/* Location */}
      <TableCell sx={{ fontSize: '0.75rem', py: 0.75 }}>
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <LocationOn sx={{ fontSize: '0.7rem', color: 'text.secondary' }} />
          <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>
            {location?.name || 'N/A'}
          </Typography>
        </Stack>
      </TableCell>

      {/* Status */}
      <TableCell sx={{ fontSize: '0.75rem', py: 0.75 }}>
        <Stack spacing={0.25}>
          <Chip
            label={statusConfig.label}
            color={statusConfig.color}
            size="small"
            icon={statusConfig.icon}
            sx={{ height: 18, fontSize: '0.55rem' }}
          />
          {isHeld && (
            <Chip
              label="On Hold"
              size="small"
              color="warning"
              icon={<LockIcon sx={{ fontSize: '0.6rem' }} />}
              sx={{ height: 16, fontSize: '0.5rem' }}
            />
          )}
        </Stack>
      </TableCell>

      {/* Actions */}
      <TableCell sx={{ fontSize: '0.75rem', py: 0.75 }}>
        <Stack direction="row" spacing={0.25}>
          {/* View Details */}
          <Tooltip title="View Details">
            <IconButton size="small" color="primary" onClick={() => onView(item)} sx={{ p: 0.5 }}>
              <Visibility sx={{ fontSize: '0.9rem' }} />
            </IconButton>
          </Tooltip>

          {/* Edit Item */}
          <Tooltip title="Edit Item">
            <IconButton size="small" color="secondary" onClick={() => onEdit(item)} sx={{ p: 0.5 }}>
              <Edit sx={{ fontSize: '0.9rem' }} />
            </IconButton>
          </Tooltip>

          {/* Stock Movement */}
          <Tooltip title="Stock Movement (Add/Remove/Adjust)">
            <IconButton size="small" color="info" onClick={() => onMovement(item)} sx={{ p: 0.5 }}>
              <CompareArrowsIcon sx={{ fontSize: '0.9rem' }} />
            </IconButton>
          </Tooltip>

          {/* Issue to Vehicle - only if vehicle issuable */}
          {isConsumable && !isHeld && item.isActive && isVehicleIssuable && (
            <Tooltip title="Issue to Vehicle">
              <IconButton size="small" color="warning" onClick={() => onIssue(item)} sx={{ p: 0.5 }}>
                <DirectionsCar sx={{ fontSize: '0.9rem' }} />
              </IconButton>
            </Tooltip>
          )}

          {/* Issue to Driver - only if driver issuable */}
          {isConsumable && !isHeld && item.isActive && isDriverIssuable && (
            <Tooltip title="Issue to Driver">
              <IconButton size="small" color="info" onClick={() => onIssueToDriver(item)} sx={{ p: 0.5 }}>
                <Person sx={{ fontSize: '0.9rem' }} />
              </IconButton>
            </Tooltip>
          )}

          {/* Receive Return */}
          {isConsumable && !isHeld && item.isActive && (
            <Tooltip title="Receive Return">
              <IconButton size="small" color="success" onClick={() => onReceive(item)} sx={{ p: 0.5 }}>
                <UndoIcon sx={{ fontSize: '0.9rem' }} />
              </IconButton>
            </Tooltip>
          )}

          {/* Delete Item */}
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

// ============================================================
// VEHICLE ISSUE ROW - FIXED WITH NAMES
// ============================================================
const VehicleIssueRow = ({ issue, onView, onReturn, onSwap, vehicles, drivers, inventoryItems }) => {
  if (!issue) return null;

  const getStatusColor = (status) => {
    switch (status) {
      case 'RETURNED': return 'success';
      case 'PARTIALLY_RETURNED': return 'warning';
      default: return 'info';
    }
  };

  // Find vehicle by ID
  const getVehicle = (vehicleId) => {
    if (!vehicleId) return null;
    return vehicles?.find(v => v.id === vehicleId);
  };

  // Find driver by ID
  const getDriver = (driverId) => {
    if (!driverId) return null;
    return drivers?.find(d => d.id === driverId);
  };

  const vehicle = getVehicle(issue.vehicleId);
  const driver = getDriver(issue.driverId);

  // Get display name for vehicle
  const getVehicleDisplay = (vehicle) => {
    if (!vehicle) return 'Unknown Vehicle';
    return vehicle.registrationNumber || vehicle.regNumber || 
           `${vehicle.make || ''} ${vehicle.model || ''}`.trim() || 
           `Vehicle #${vehicle.id}`;
  };

  // Get display name for driver
  const getDriverDisplay = (driver) => {
    if (!driver) return 'Unknown Driver';
    return driver.fullName || 
           `${driver.firstName || ''} ${driver.lastName || ''}`.trim() || 
           `Driver #${driver.id}`;
  };

  // Get item details
  const firstItem = issue.items?.[0];
  const itemName = firstItem?.itemName || 
    inventoryItems?.find(i => i.id === firstItem?.itemId)?.name || 
    'Unknown Item';

  return (
    <TableRow hover>
      <TableCell sx={{ fontSize: '0.75rem', py: 0.75 }}>
        <Typography variant="body2" fontWeight="500" sx={{ fontSize: '0.75rem' }}>
          {issue.issueNumber || `Issue #${issue.id}`}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.5rem' }}>
          ID: {issue.id}
        </Typography>
      </TableCell>
      <TableCell sx={{ fontSize: '0.75rem', py: 0.75 }}>
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <DirectionsCar sx={{ fontSize: '0.8rem', color: 'text.secondary' }} />
          <Typography variant="body2" sx={{ fontSize: '0.7rem', fontWeight: 500 }}>
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
          <Typography variant="body2" sx={{ fontSize: '0.7rem', fontWeight: 500 }}>
            {getDriverDisplay(driver)}
          </Typography>
        </Stack>
      </TableCell>
      <TableCell sx={{ fontSize: '0.75rem', py: 0.75 }}>
        <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>
          {itemName}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.5rem' }}>
          Qty: {firstItem?.quantityIssued || firstItem?.quantity || 0} 
          {firstItem?.condition && ` • ${firstItem.condition}`}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.5rem', display: 'block' }}>
          {issue.items?.length || 0} item(s) total
        </Typography>
      </TableCell>
      <TableCell sx={{ fontSize: '0.75rem', py: 0.75 }}>
        <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>
          {issue.issueDate ? new Date(issue.issueDate).toLocaleDateString() : 'N/A'}
        </Typography>
        {issue.expectedReturnDate && (
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.5rem' }}>
            Expected Return: {new Date(issue.expectedReturnDate).toLocaleDateString()}
          </Typography>
        )}
      </TableCell>
      <TableCell sx={{ fontSize: '0.75rem', py: 0.75 }}>
        <Chip
          label={issue.status || 'ISSUED'}
          color={getStatusColor(issue.status)}
          size="small"
          sx={{ height: 18, fontSize: '0.55rem' }}
        />
        {issue.returnedDate && (
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.5rem', display: 'block' }}>
            Returned: {new Date(issue.returnedDate).toLocaleDateString()}
          </Typography>
        )}
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
                  <UndoIcon sx={{ fontSize: '0.9rem' }} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Swap Item">
                <IconButton size="small" color="warning" onClick={() => onSwap(issue)} sx={{ p: 0.5 }}>
                  <SwapHoriz sx={{ fontSize: '0.9rem' }} />
                </IconButton>
              </Tooltip>
            </>
          )}
        </Stack>
      </TableCell>
    </TableRow>
  );
};

// ============================================================
// DRIVER ISSUE ROW - FIXED WITH NAMES
// ============================================================
const DriverIssueRow = ({ issue, onView, onReturn, onSwap, drivers, inventoryItems }) => {
  if (!issue) return null;

  const getStatusColor = (status) => {
    switch (status) {
      case 'RETURNED': return 'success';
      case 'PARTIALLY_RETURNED': return 'warning';
      default: return 'info';
    }
  };

  // Find driver by ID
  const getDriver = (driverId) => {
    if (!driverId) return null;
    return drivers?.find(d => d.id === driverId);
  };

  const driver = getDriver(issue.driverId);

  // Get display name for driver
  const getDriverDisplay = (driver) => {
    if (!driver) return 'Unknown Driver';
    return driver.fullName || 
           `${driver.firstName || ''} ${driver.lastName || ''}`.trim() || 
           `Driver #${driver.id}`;
  };

  const firstItem = issue.items?.[0];
  const itemName = firstItem?.itemName || 
    inventoryItems?.find(i => i.id === firstItem?.itemId)?.name || 
    'Unknown Item';

  return (
    <TableRow hover>
      <TableCell sx={{ fontSize: '0.75rem', py: 0.75 }}>
        <Typography variant="body2" fontWeight="500" sx={{ fontSize: '0.75rem' }}>
          {issue.issueNumber || `Issue #${issue.id}`}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.5rem' }}>
          ID: {issue.id}
        </Typography>
      </TableCell>
      <TableCell sx={{ fontSize: '0.75rem', py: 0.75 }}>
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <Person sx={{ fontSize: '0.8rem', color: 'text.secondary' }} />
          <Typography variant="body2" sx={{ fontSize: '0.7rem', fontWeight: 500 }}>
            {getDriverDisplay(driver)}
          </Typography>
        </Stack>
        {driver && driver.licenseNumber && (
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.5rem', display: 'block' }}>
            License: {driver.licenseNumber}
          </Typography>
        )}
      </TableCell>
      <TableCell sx={{ fontSize: '0.75rem', py: 0.75 }}>
        <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>
          {itemName}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.5rem' }}>
          Qty: {firstItem?.quantityIssued || firstItem?.quantity || 0}
          {firstItem?.condition && ` • ${firstItem.condition}`}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.5rem', display: 'block' }}>
          {issue.items?.length || 0} item(s) total
        </Typography>
      </TableCell>
      <TableCell sx={{ fontSize: '0.75rem', py: 0.75 }}>
        <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>
          {issue.issueDate ? new Date(issue.issueDate).toLocaleDateString() : 'N/A'}
        </Typography>
        {issue.expectedReturnDate && (
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.5rem' }}>
            Expected Return: {new Date(issue.expectedReturnDate).toLocaleDateString()}
          </Typography>
        )}
      </TableCell>
      <TableCell sx={{ fontSize: '0.75rem', py: 0.75 }}>
        <Chip
          label={issue.status || 'ISSUED'}
          color={getStatusColor(issue.status)}
          size="small"
          sx={{ height: 18, fontSize: '0.55rem' }}
        />
        {issue.returnedDate && (
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.5rem', display: 'block' }}>
            Returned: {new Date(issue.returnedDate).toLocaleDateString()}
          </Typography>
        )}
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
                  <UndoIcon sx={{ fontSize: '0.9rem' }} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Swap Item">
                <IconButton size="small" color="warning" onClick={() => onSwap(issue)} sx={{ p: 0.5 }}>
                  <SwapHoriz sx={{ fontSize: '0.9rem' }} />
                </IconButton>
              </Tooltip>
            </>
          )}
        </Stack>
      </TableCell>
    </TableRow>
  );
};

// ============================================================
// MAIN INVENTORY COMPONENT
// ============================================================
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
  const [issueableFilter, setIssueableFilter] = useState('all');
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
  const [showMovementDialog, setShowMovementDialog] = useState(false);
  const [showIssueDetailsDialog, setShowIssueDetailsDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [selectedIssueItem, setSelectedIssueItem] = useState(null);

  // Form states - ADDED SKU
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    category: '',
    unitOfMeasure: 'EA',
    isConsumable: true,
    reorderLevel: 0,
    locationId: '',
    quantity: 0,
    unitCost: 0,
    minLevel: 0,
    isActive: true,
    notes: '',
    isDriverIssuable: true,
    isVehicleIssuable: true,
    returnByDate: '',
    isHeld: false,
    holdCode: '',
    holdDate: '',
    holdReason: '',
    heldBy: '',
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
  const [movementFormData, setMovementFormData] = useState({
    itemId: '',
    quantity: 0,
    operation: 'ADD',
    movementType: 'IN',
    reason: '',
    notes: '',
    referenceNumber: '',
    referenceType: 'PURCHASE_ORDER',
    requiresApproval: false,
    approvalStatus: 'APPROVED',
    performedBy: 'SYSTEM',
    tripId: null,
    fuelSlipId: null,
    approvedBy: null,
    approvedAt: null,
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

      // Ensure all items have the new fields with defaults
      itemsData = itemsData.map(item => ({
        ...item,
        sku: item.sku || null,
        isDriverIssuable: item.isDriverIssuable !== undefined ? item.isDriverIssuable : true,
        isVehicleIssuable: item.isVehicleIssuable !== undefined ? item.isVehicleIssuable : true,
        isActive: item.isActive !== undefined ? item.isActive : true,
        isHeld: item.isHeld || false,
        holdCode: item.holdCode || null,
        holdDate: item.holdDate || null,
        holdReason: item.holdReason || null,
        heldBy: item.heldBy || null,
        returnByDate: item.returnByDate || null,
      }));

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

  // View Issue Details
  const handleViewIssue = (issue) => {
    setSelectedIssue(issue);
    setShowIssueDetailsDialog(true);
  };

  // Movement Operations
  const handleMovement = (item) => {
    setSelectedItem(item);
    setMovementFormData({
      itemId: item.id,
      quantity: 1,
      operation: 'ADD',
      movementType: 'IN',
      reason: '',
      notes: '',
      referenceNumber: `MOV-${Date.now()}`,
      referenceType: 'PURCHASE_ORDER',
      requiresApproval: false,
      approvalStatus: 'APPROVED',
      performedBy: 'SYSTEM',
      tripId: null,
      fuelSlipId: null,
      approvedBy: null,
      approvedAt: null,
    });
    setShowMovementDialog(true);
  };

  const handleSubmitMovement = async () => {
    try {
      if (!movementFormData.itemId || movementFormData.quantity <= 0) {
        setError('Please select an item and enter a valid quantity');
        return;
      }

      if (!movementFormData.reason) {
        setError('Please provide a reason for the movement');
        return;
      }

      // Map operation to movementType
      let movementType = 'ADJUSTMENT';
      let referenceType = 'ADJUSTMENT';

      switch (movementFormData.operation) {
        case 'ADD':
          movementType = 'IN';
          referenceType = 'PURCHASE_ORDER';
          break;
        case 'SUBTRACT':
          movementType = 'OUT';
          referenceType = 'ADJUSTMENT';
          break;
        case 'SET':
          movementType = 'ADJUSTMENT';
          referenceType = 'ADJUSTMENT';
          break;
        default:
          movementType = 'ADJUSTMENT';
          referenceType = 'ADJUSTMENT';
      }

      const currentUser = 'SYSTEM';

      const payload = {
        itemId: parseInt(movementFormData.itemId),
        quantity: parseFloat(movementFormData.quantity),
        movementType: movementType,
        reason: movementFormData.reason,
        notes: movementFormData.notes || '',
        referenceNumber: movementFormData.referenceNumber || `MOV-${Date.now()}`,
        referenceType: referenceType,
        requiresApproval: movementFormData.requiresApproval || false,
        approvalStatus: movementFormData.requiresApproval ? 'PENDING' : 'APPROVED',
        performedBy: currentUser,
        tripId: movementFormData.tripId ? parseInt(movementFormData.tripId) : null,
        fuelSlipId: movementFormData.fuelSlipId ? parseInt(movementFormData.fuelSlipId) : null,
        approvedBy: movementFormData.requiresApproval ? movementFormData.approvedBy : currentUser,
        approvedAt: movementFormData.requiresApproval ? null : new Date().toISOString(),
      };

      await inventoryMovementService.recordMovement(payload);

      showSuccess(`Stock ${movementFormData.operation === 'ADD' ? 'added' : movementFormData.operation === 'SUBTRACT' ? 'removed' : 'adjusted'} successfully`);
      setShowMovementDialog(false);
      resetForms();
      await loadData();
    } catch (err) {
      console.error('Error updating stock:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to update stock';
      setError(errorMessage);
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
      sku: item.sku || '',
      name: item.name || '',
      category: item.category || '',
      unitOfMeasure: item.unitOfMeasure || 'EA',
      isConsumable: item.isConsumable !== false,
      reorderLevel: item.reorderLevel || 0,
      locationId: item.locationId || '',
      quantity: item.quantity || 0,
      unitCost: item.unitCost || 0,
      minLevel: item.minLevel || 0,
      isActive: item.isActive !== false,
      notes: item.notes || '',
      isDriverIssuable: item.isDriverIssuable !== false,
      isVehicleIssuable: item.isVehicleIssuable !== false,
      returnByDate: item.returnByDate || '',
      isHeld: item.isHeld || false,
      holdCode: item.holdCode || '',
      holdDate: item.holdDate || '',
      holdReason: item.holdReason || '',
      heldBy: item.heldBy || '',
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
      sku: '',
      name: '',
      category: '',
      unitOfMeasure: 'EA',
      isConsumable: true,
      reorderLevel: 0,
      locationId: locations.length > 0 ? locations[0].id : '',
      quantity: 0,
      unitCost: 0,
      minLevel: 0,
      isActive: true,
      notes: '',
      isDriverIssuable: true,
      isVehicleIssuable: true,
      returnByDate: '',
      isHeld: false,
      holdCode: '',
      holdDate: '',
      holdReason: '',
      heldBy: '',
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
        sku: formData.sku?.trim() || null,
        name: formData.name.trim(),
        category: formData.category,
        unitOfMeasure: formData.unitOfMeasure || 'EA',
        isConsumable: formData.isConsumable !== false,
        reorderLevel: parseInt(formData.reorderLevel) || 0,
        locationId: parseInt(formData.locationId),
        quantity: parseInt(formData.quantity) || 0,
        unitCost: parseFloat(formData.unitCost) || 0,
        minLevel: parseInt(formData.minLevel) || 0,
        isActive: formData.isActive !== false,
        notes: formData.notes || '',
        isDriverIssuable: formData.isDriverIssuable !== false,
        isVehicleIssuable: formData.isVehicleIssuable !== false,
        returnByDate: formData.returnByDate || null,
        isHeld: formData.isHeld || false,
        holdCode: formData.holdCode || null,
        holdDate: formData.holdDate || null,
        holdReason: formData.holdReason || null,
        heldBy: formData.heldBy || null,
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

  // Filter items with issueable filter
  const filteredItems = inventoryItems.filter(item => {
    const searchMatch =
      item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku?.toLowerCase().includes(searchTerm.toLowerCase());
    const categoryMatch = categoryFilter === 'all' || item.category === categoryFilter;

    let statusMatch = true;
    if (statusFilter !== 'all') {
      const quantity = item.quantity || 0;
      const minLevel = item.minLevel || 0;
      if (statusFilter === 'In Stock') statusMatch = quantity > minLevel;
      else if (statusFilter === 'Low Stock') statusMatch = quantity > 0 && quantity <= minLevel;
      else if (statusFilter === 'Out of Stock') statusMatch = quantity <= 0;
    }

    let issueableMatch = true;
    if (issueableFilter !== 'all') {
      const isDriver = item.isDriverIssuable !== false;
      const isVehicle = item.isVehicleIssuable !== false;
      if (issueableFilter === 'driver') issueableMatch = isDriver && !isVehicle;
      else if (issueableFilter === 'vehicle') issueableMatch = isVehicle && !isDriver;
      else if (issueableFilter === 'both') issueableMatch = isDriver && isVehicle;
      else if (issueableFilter === 'neither') issueableMatch = !isDriver && !isVehicle;
    }

    return searchMatch && categoryMatch && statusMatch && issueableMatch;
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
          <Tab 
            label="Items" 
            icon={<InventoryIcon sx={{ fontSize: '0.9rem' }} />} 
            iconPosition="start" 
            sx={{ fontSize: '0.75rem', minHeight: 36 }} 
          />
          <Tab 
            label={`Vehicle Issues (${vehicleIssues.length})`} 
            icon={<DirectionsCar sx={{ fontSize: '0.9rem' }} />} 
            iconPosition="start" 
            sx={{ fontSize: '0.75rem', minHeight: 36 }} 
          />
          <Tab 
            label={`Driver Issues (${driverIssues.length})`} 
            icon={<Person sx={{ fontSize: '0.9rem' }} />} 
            iconPosition="start" 
            sx={{ fontSize: '0.75rem', minHeight: 36 }} 
          />
          <Tab 
            label="Stock Movements" 
            icon={<SwapHoriz sx={{ fontSize: '0.9rem' }} />} 
            iconPosition="start" 
            sx={{ fontSize: '0.75rem', minHeight: 36 }} 
          />
        </Tabs>
      </Paper>

      {/* Tab: Items */}
      <TabPanel value={activeTab} index={0}>
        {/* Search and Actions */}
        <Paper sx={{ p: 1.5, mb: 2 }}>
          <Grid container spacing={1.5} alignItems="center">
            <Grid item xs={12} md={3}>
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
            <Grid item xs={12} sm={6} md={2}>
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
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ fontSize: '0.75rem' }}>Issueable To</InputLabel>
                <Select
                  value={issueableFilter}
                  label="Issueable To"
                  onChange={(e) => setIssueableFilter(e.target.value)}
                  sx={{ fontSize: '0.75rem' }}
                >
                  <MenuItem value="all" sx={{ fontSize: '0.75rem' }}>All</MenuItem>
                  <MenuItem value="both" sx={{ fontSize: '0.75rem' }}>Both</MenuItem>
                  <MenuItem value="driver" sx={{ fontSize: '0.75rem' }}>Driver Only</MenuItem>
                  <MenuItem value="vehicle" sx={{ fontSize: '0.75rem' }}>Vehicle Only</MenuItem>
                  <MenuItem value="neither" sx={{ fontSize: '0.75rem' }}>Neither</MenuItem>
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
                    <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600, py: 0.75 }}>SKU</TableCell>
                    <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600, py: 0.75 }}>Item</TableCell>
                    <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600, py: 0.75 }}>Category</TableCell>
                    <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600, py: 0.75 }}>Qty</TableCell>
                    <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600, py: 0.75 }}>Flags</TableCell>
                    <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600, py: 0.75 }}>Min Level</TableCell>
                    <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600, py: 0.75 }}>Location</TableCell>
                    <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600, py: 0.75 }}>Status</TableCell>
                    <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600, py: 0.75 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} align="center" sx={{ py: 3 }}>
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
                        onMovement={handleMovement}
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
                      <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600, py: 0.75 }}>Item</TableCell>
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
                        onView={handleViewIssue}
                        onReturn={handleReturnItems}
                        onSwap={handleSwap}
                        vehicles={vehicles}
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
                        onView={handleViewIssue}
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

      {/* Add/Edit Item Dialog - UPDATED WITH SKU */}
      <Dialog open={showAddDialog} onClose={() => setShowAddDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ 
          py: 1.5, 
          px: 2.5, 
          borderBottom: 1, 
          borderColor: 'divider',
          bgcolor: '#F8FAFC',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600, color: '#111827' }}>
            {selectedItem ? 'Edit Inventory Item' : 'Add New Inventory Item'}
          </Typography>
          <IconButton size="small" onClick={() => setShowAddDialog(false)}>
            <CloseIcon sx={{ fontSize: '1.2rem' }} />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 2.5 }}>
          <Stack spacing={2.5}>
            {/* Identification - NEW SKU Section */}
            <Paper sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: '12px', border: '1px solid #ECECEC' }}>
              <Typography variant="subtitle2" sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#4F46E5', mb: 1.5 }}>
                <QrCode sx={{ fontSize: '0.9rem', verticalAlign: 'middle', mr: 0.5 }} />
                Identification
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="SKU"
                    name="sku"
                    value={formData.sku || ''}
                    onChange={handleFormChange}
                    fullWidth
                    size="small"
                    placeholder="e.g., TYR-001, BRA-002"
                    helperText="Unique identifier for this product"
                    sx={{ 
                      '& .MuiInputLabel-root': { fontSize: '0.75rem' },
                      '& .MuiInputBase-root': { fontSize: '0.8rem' }
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Item Name *"
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    fullWidth
                    size="small"
                    error={!!formErrors.name}
                    helperText={formErrors.name}
                    sx={{ 
                      '& .MuiInputLabel-root': { fontSize: '0.75rem' },
                      '& .MuiInputBase-root': { fontSize: '0.8rem' }
                    }}
                  />
                </Grid>
              </Grid>
            </Paper>

            {/* Classification */}
            <Paper sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: '12px', border: '1px solid #ECECEC' }}>
              <Typography variant="subtitle2" sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#4F46E5', mb: 1.5 }}>
                <CategoryIcon sx={{ fontSize: '0.9rem', verticalAlign: 'middle', mr: 0.5 }} />
                Classification
              </Typography>
              <Grid container spacing={2}>
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
                    sx={{ 
                      '& .MuiInputLabel-root': { fontSize: '0.75rem' },
                      '& .MuiInputBase-root': { fontSize: '0.8rem' }
                    }}
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
                      <MenuItem value="LITER" sx={{ fontSize: '0.8rem' }}>Litre (L)</MenuItem>
                      <MenuItem value="KG" sx={{ fontSize: '0.8rem' }}>Kilogram (KG)</MenuItem>
                      <MenuItem value="M" sx={{ fontSize: '0.8rem' }}>Meter (M)</MenuItem>
                      <MenuItem value="BOX" sx={{ fontSize: '0.8rem' }}>Box (BOX)</MenuItem>
                      <MenuItem value="SET" sx={{ fontSize: '0.8rem' }}>Set (SET)</MenuItem>
                      <MenuItem value="PK" sx={{ fontSize: '0.8rem' }}>Pack (PK)</MenuItem>
                      <MenuItem value="ROLL" sx={{ fontSize: '0.8rem' }}>Roll (ROLL)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Paper>

            {/* Stock Information */}
            <Paper sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: '12px', border: '1px solid #ECECEC' }}>
              <Typography variant="subtitle2" sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#4F46E5', mb: 1.5 }}>
                <InventoryIcon sx={{ fontSize: '0.9rem', verticalAlign: 'middle', mr: 0.5 }} />
                Stock Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Quantity *"
                    name="quantity"
                    type="number"
                    value={formData.quantity}
                    onChange={handleFormChange}
                    fullWidth
                    size="small"
                    error={!!formErrors.quantity}
                    helperText={formErrors.quantity}
                    InputProps={{ inputProps: { min: 0 } }}
                    sx={{ 
                      '& .MuiInputLabel-root': { fontSize: '0.75rem' },
                      '& .MuiInputBase-root': { fontSize: '0.8rem' }
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
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
                    sx={{ 
                      '& .MuiInputLabel-root': { fontSize: '0.75rem' },
                      '& .MuiInputBase-root': { fontSize: '0.8rem' }
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
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
                    sx={{ 
                      '& .MuiInputLabel-root': { fontSize: '0.75rem' },
                      '& .MuiInputBase-root': { fontSize: '0.8rem' }
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Reorder Level"
                    name="reorderLevel"
                    type="number"
                    value={formData.reorderLevel}
                    onChange={handleFormChange}
                    fullWidth
                    size="small"
                    InputProps={{ inputProps: { min: 0 } }}
                    sx={{ 
                      '& .MuiInputLabel-root': { fontSize: '0.75rem' },
                      '& .MuiInputBase-root': { fontSize: '0.8rem' }
                    }}
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
              </Grid>
            </Paper>

            {/* Issue Settings */}
            <Paper sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: '12px', border: '1px solid #ECECEC' }}>
              <Typography variant="subtitle2" sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#4F46E5', mb: 1.5 }}>
                <Assignment sx={{ fontSize: '0.9rem', verticalAlign: 'middle', mr: 0.5 }} />
                Issue Settings
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        name="isConsumable"
                        checked={formData.isConsumable}
                        onChange={handleFormChange}
                        size="small"
                        sx={{ '& .MuiSvgIcon-root': { fontSize: '1.1rem' } }}
                      />
                    }
                    label="Is Consumable"
                    sx={{ fontSize: '0.8rem' }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        name="isDriverIssuable"
                        checked={formData.isDriverIssuable}
                        onChange={handleFormChange}
                        size="small"
                        sx={{ '& .MuiSvgIcon-root': { fontSize: '1.1rem' } }}
                      />
                    }
                    label="Driver Issuable"
                    sx={{ fontSize: '0.8rem' }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        name="isVehicleIssuable"
                        checked={formData.isVehicleIssuable}
                        onChange={handleFormChange}
                        size="small"
                        sx={{ '& .MuiSvgIcon-root': { fontSize: '1.1rem' } }}
                      />
                    }
                    label="Vehicle Issuable"
                    sx={{ fontSize: '0.8rem' }}
                  />
                </Grid>
              </Grid>
            </Paper>

            {/* Status & Hold */}
            <Paper sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: '12px', border: '1px solid #ECECEC' }}>
              <Typography variant="subtitle2" sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#4F46E5', mb: 1.5 }}>
                <LockIcon sx={{ fontSize: '0.9rem', verticalAlign: 'middle', mr: 0.5 }} />
                Status & Hold
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        name="isActive"
                        checked={formData.isActive}
                        onChange={handleFormChange}
                        size="small"
                        sx={{ '& .MuiSvgIcon-root': { fontSize: '1.1rem' } }}
                      />
                    }
                    label="Is Active"
                    sx={{ fontSize: '0.8rem' }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        name="isHeld"
                        checked={formData.isHeld}
                        onChange={handleFormChange}
                        size="small"
                        sx={{ '& .MuiSvgIcon-root': { fontSize: '1.1rem' } }}
                      />
                    }
                    label="On Hold"
                    sx={{ fontSize: '0.8rem' }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Return By Date"
                    name="returnByDate"
                    type="date"
                    value={formData.returnByDate}
                    onChange={handleFormChange}
                    fullWidth
                    size="small"
                    InputLabelProps={{ shrink: true }}
                    sx={{ 
                      '& .MuiInputLabel-root': { fontSize: '0.75rem' },
                      '& .MuiInputBase-root': { fontSize: '0.8rem' }
                    }}
                  />
                </Grid>
                {formData.isHeld && (
                  <>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Hold Code"
                        name="holdCode"
                        value={formData.holdCode}
                        onChange={handleFormChange}
                        fullWidth
                        size="small"
                        sx={{ 
                          '& .MuiInputLabel-root': { fontSize: '0.75rem' },
                          '& .MuiInputBase-root': { fontSize: '0.8rem' }
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Hold Date"
                        name="holdDate"
                        type="date"
                        value={formData.holdDate}
                        onChange={handleFormChange}
                        fullWidth
                        size="small"
                        InputLabelProps={{ shrink: true }}
                        sx={{ 
                          '& .MuiInputLabel-root': { fontSize: '0.75rem' },
                          '& .MuiInputBase-root': { fontSize: '0.8rem' }
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Held By"
                        name="heldBy"
                        value={formData.heldBy}
                        onChange={handleFormChange}
                        fullWidth
                        size="small"
                        sx={{ 
                          '& .MuiInputLabel-root': { fontSize: '0.75rem' },
                          '& .MuiInputBase-root': { fontSize: '0.8rem' }
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Hold Reason"
                        name="holdReason"
                        value={formData.holdReason}
                        onChange={handleFormChange}
                        fullWidth
                        size="small"
                        multiline
                        rows={2}
                        sx={{ 
                          '& .MuiInputLabel-root': { fontSize: '0.75rem' },
                          '& .MuiInputBase-root': { fontSize: '0.8rem' }
                        }}
                      />
                    </Grid>
                  </>
                )}
              </Grid>
            </Paper>

            {/* Notes */}
            <Paper sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: '12px', border: '1px solid #ECECEC' }}>
              <Typography variant="subtitle2" sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#4F46E5', mb: 1.5 }}>
                <DescriptionIcon sx={{ fontSize: '0.9rem', verticalAlign: 'middle', mr: 0.5 }} />
                Additional Information
              </Typography>
              <TextField
                label="Notes"
                name="notes"
                value={formData.notes}
                onChange={handleFormChange}
                fullWidth
                size="small"
                multiline
                rows={3}
                placeholder="Add any additional notes about this item..."
                sx={{ 
                  '& .MuiInputLabel-root': { fontSize: '0.75rem' },
                  '& .MuiInputBase-root': { fontSize: '0.8rem' }
                }}
              />
            </Paper>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ 
          px: 2.5, 
          py: 1.5, 
          borderTop: 1, 
          borderColor: 'divider',
          bgcolor: '#F8FAFC',
          justifyContent: 'space-between'
        }}>
          <Button onClick={() => setShowAddDialog(false)} size="small" sx={{ fontSize: '0.8rem' }}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            size="small" 
            onClick={handleSubmit} 
            sx={{ 
              fontSize: '0.8rem',
              background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #4338CA 0%, #4F46E5 100%)',
              }
            }}
            startIcon={<SaveIcon sx={{ fontSize: '0.9rem' }} />}
          >
            {selectedItem ? 'Update Item' : 'Add Item'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Item Dialog - UPDATED WITH SKU */}
      <Dialog open={showViewDialog} onClose={() => setShowViewDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ py: 1.5, px: 2.5, borderBottom: 1, borderColor: 'divider', bgcolor: '#F8FAFC' }}>
          <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600, color: '#111827' }}>
            Item Details - {selectedItem?.sku || 'No SKU'}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ p: 2.5 }}>
          {selectedItem && (
            <Stack spacing={2}>
              <Grid container spacing={2}>
                {/* SKU */}
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                    <QrCode sx={{ fontSize: '0.8rem', verticalAlign: 'middle', mr: 0.5 }} />
                    SKU
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.85rem', fontWeight: 500, color: '#4F46E5' }}>
                    {selectedItem.sku || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
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
                <Grid item xs={4}>
                  <Typography variant="subtitle2" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>Quantity</Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.85rem', fontWeight: 500 }}>{selectedItem.quantity}</Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="subtitle2" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>Min Level</Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>{selectedItem.minLevel || 0}</Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="subtitle2" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>Unit Cost</Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>R {selectedItem.unitCost?.toFixed(2) || '0.00'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>Location</Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                    {locations.find(l => l.id === selectedItem.locationId)?.name || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>Reorder Level</Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>{selectedItem.reorderLevel || 0}</Typography>
                </Grid>

                {/* Flags Section */}
                <Grid item xs={12}>
                  <Typography variant="subtitle2" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>Flags</Typography>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                    <Chip
                      label={selectedItem.isConsumable !== false ? 'Consumable' : 'Non-Consumable'}
                      color={selectedItem.isConsumable !== false ? 'primary' : 'secondary'}
                      size="small"
                      sx={{ height: 20, fontSize: '0.65rem' }}
                    />
                    <Chip
                      label={selectedItem.isDriverIssuable !== false ? 'Driver Issuable' : 'Not Driver Issuable'}
                      color={selectedItem.isDriverIssuable !== false ? 'success' : 'error'}
                      size="small"
                      sx={{ height: 20, fontSize: '0.65rem' }}
                    />
                    <Chip
                      label={selectedItem.isVehicleIssuable !== false ? 'Vehicle Issuable' : 'Not Vehicle Issuable'}
                      color={selectedItem.isVehicleIssuable !== false ? 'info' : 'error'}
                      size="small"
                      sx={{ height: 20, fontSize: '0.65rem' }}
                    />
                  </Stack>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle2" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>Status</Typography>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                    <Chip
                      label={selectedItem.quantity <= 0 ? 'Out of Stock' : selectedItem.quantity <= selectedItem.minLevel ? 'Low Stock' : 'In Stock'}
                      color={selectedItem.quantity <= 0 ? 'error' : selectedItem.quantity <= selectedItem.minLevel ? 'warning' : 'success'}
                      size="small"
                      sx={{ height: 20, fontSize: '0.65rem' }}
                    />
                    {selectedItem.isHeld && (
                      <Chip
                        label="On Hold"
                        color="warning"
                        size="small"
                        icon={<LockIcon sx={{ fontSize: '0.7rem' }} />}
                        sx={{ height: 20, fontSize: '0.65rem' }}
                      />
                    )}
                    {!selectedItem.isActive && (
                      <Chip
                        label="Inactive"
                        color="default"
                        size="small"
                        sx={{ height: 20, fontSize: '0.65rem' }}
                      />
                    )}
                  </Stack>
                </Grid>
                {selectedItem.returnByDate && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>Return By Date</Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                      {new Date(selectedItem.returnByDate).toLocaleDateString()}
                    </Typography>
                  </Grid>
                )}
                {selectedItem.isHeld && (
                  <>
                    {selectedItem.holdCode && (
                      <Grid item xs={6}>
                        <Typography variant="subtitle2" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>Hold Code</Typography>
                        <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>{selectedItem.holdCode}</Typography>
                      </Grid>
                    )}
                    {selectedItem.holdDate && (
                      <Grid item xs={6}>
                        <Typography variant="subtitle2" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>Hold Date</Typography>
                        <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                          {new Date(selectedItem.holdDate).toLocaleDateString()}
                        </Typography>
                      </Grid>
                    )}
                    {selectedItem.heldBy && (
                      <Grid item xs={6}>
                        <Typography variant="subtitle2" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>Held By</Typography>
                        <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>{selectedItem.heldBy}</Typography>
                      </Grid>
                    )}
                    {selectedItem.holdReason && (
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>Hold Reason</Typography>
                        <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>{selectedItem.holdReason}</Typography>
                      </Grid>
                    )}
                  </>
                )}
                {selectedItem.notes && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>Notes</Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>{selectedItem.notes}</Typography>
                  </Grid>
                )}
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
                    Created: {selectedItem.createdAt ? new Date(selectedItem.createdAt).toLocaleString() : 'N/A'}
                    {selectedItem.updatedAt && ` | Updated: ${new Date(selectedItem.updatedAt).toLocaleString()}`}
                  </Typography>
                </Grid>
              </Grid>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 2.5, py: 1.5, borderTop: 1, borderColor: 'divider', bgcolor: '#F8FAFC' }}>
          <Button onClick={() => setShowViewDialog(false)} size="small" sx={{ fontSize: '0.8rem' }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Issue Details Dialog */}
<Dialog open={showIssueDetailsDialog} onClose={() => setShowIssueDetailsDialog(false)} maxWidth="md" fullWidth>
  <DialogTitle sx={{ py: 1.5, px: 2.5, borderBottom: 1, borderColor: 'divider' }}>
    <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
      Issue Details - {selectedIssue?.issueNumber || `Issue #${selectedIssue?.id}`}
    </Typography>
  </DialogTitle>
  <DialogContent sx={{ p: 2.5 }}>
    {selectedIssue && (
      <Stack spacing={2}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>Issue Number</Typography>
            <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>{selectedIssue.issueNumber || selectedIssue.id}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>Status</Typography>
            <Chip
              label={selectedIssue.status || 'ISSUED'}
              color={selectedIssue.status === 'RETURNED' ? 'success' : selectedIssue.status === 'PARTIALLY_RETURNED' ? 'warning' : 'info'}
              size="small"
              sx={{ height: 20, fontSize: '0.65rem' }}
            />
          </Grid>
          {selectedIssue.vehicleId && (
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>Vehicle</Typography>
              <Typography variant="body2" sx={{ fontSize: '0.85rem', fontWeight: 500 }}>
                {vehicles.find(v => v.id === selectedIssue.vehicleId)?.registrationNumber || 
                 vehicles.find(v => v.id === selectedIssue.vehicleId)?.make || 
                 `Vehicle #${selectedIssue.vehicleId}`}
              </Typography>
            </Grid>
          )}
          {selectedIssue.driverId && (
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>Driver</Typography>
              <Typography variant="body2" sx={{ fontSize: '0.85rem', fontWeight: 500 }}>
                {drivers.find(d => d.id === selectedIssue.driverId)?.fullName || 
                 drivers.find(d => d.id === selectedIssue.driverId)?.firstName || 
                 `Driver #${selectedIssue.driverId}`}
              </Typography>
            </Grid>
          )}
          <Grid item xs={12}>
            <Typography variant="subtitle2" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>Items</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontSize: '0.6rem', fontWeight: 600, py: 0.5 }}>Item</TableCell>
                    <TableCell sx={{ fontSize: '0.6rem', fontWeight: 600, py: 0.5 }}>Quantity</TableCell>
                    <TableCell sx={{ fontSize: '0.6rem', fontWeight: 600, py: 0.5 }}>Condition</TableCell>
                    <TableCell sx={{ fontSize: '0.6rem', fontWeight: 600, py: 0.5 }}>Returned</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedIssue.items?.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell sx={{ fontSize: '0.7rem', py: 0.5 }}>
                        {item.itemName || inventoryItems.find(i => i.id === item.itemId)?.name || `Item #${item.itemId}`}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.7rem', py: 0.5 }}>{item.quantityIssued || item.quantity || 0}</TableCell>
                      <TableCell sx={{ fontSize: '0.7rem', py: 0.5 }}>{item.condition || 'N/A'}</TableCell>
                      <TableCell sx={{ fontSize: '0.7rem', py: 0.5 }}>
                        {item.returnedQuantity ? `${item.returnedQuantity} returned` : 'Not returned'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>Issue Date</Typography>
            <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
              {selectedIssue.issueDate ? new Date(selectedIssue.issueDate).toLocaleDateString() : 'N/A'}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>Expected Return</Typography>
            <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
              {selectedIssue.expectedReturnDate ? new Date(selectedIssue.expectedReturnDate).toLocaleDateString() : 'N/A'}
            </Typography>
          </Grid>
          {selectedIssue.notes && (
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>Notes</Typography>
              <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>{selectedIssue.notes}</Typography>
            </Grid>
          )}
        </Grid>
      </Stack>
    )}
  </DialogContent>
  <DialogActions sx={{ px: 2.5, py: 1.5, borderTop: 1, borderColor: 'divider' }}>
    <Button onClick={() => setShowIssueDetailsDialog(false)} size="small" sx={{ fontSize: '0.8rem' }}>
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
                {inventoryItems
                  .filter(item => item.isVehicleIssuable !== false && !item.isHeld && item.isActive)
                  .map((item) => (
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
                  <br />
                  <small>Consumable: {selectedItem.isConsumable !== false ? 'Yes' : 'No'}</small>
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
                {inventoryItems
                  .filter(item => item.isDriverIssuable !== false && !item.isHeld && item.isActive)
                  .map((item) => (
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
                  <br />
                  <small>Consumable: {selectedItem.isConsumable !== false ? 'Yes' : 'No'}</small>
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
                    .filter(item => item.id !== selectedIssueItem.itemId && !item.isHeld)
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

      {/* Movement Dialog */}
      <Dialog open={showMovementDialog} onClose={() => setShowMovementDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ py: 1.5, px: 2.5, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
            Stock Movement
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ p: 2.5 }}>
          {selectedItem && (
            <Stack spacing={2}>
              <Alert severity="info" sx={{ fontSize: '0.8rem' }}>
                <strong>{selectedItem.name}</strong>
                <br />
                Current Quantity: <strong>{selectedItem.quantity}</strong> {selectedItem.unitOfMeasure || 'EA'}
                <br />
                Min Level: {selectedItem.minLevel || 0}
                <br />
                <small>Consumable: {selectedItem.isConsumable !== false ? 'Yes' : 'No'}</small>
              </Alert>

              {/* Operation Selection */}
              <FormControl fullWidth size="small" required>
                <InputLabel sx={{ fontSize: '0.75rem' }}>Operation *</InputLabel>
                <Select
                  value={movementFormData.operation}
                  onChange={(e) => {
                    const operation = e.target.value;
                    let movementType = 'ADJUSTMENT';
                    let referenceType = 'ADJUSTMENT';

                    switch (operation) {
                      case 'ADD':
                        movementType = 'IN';
                        referenceType = 'PURCHASE_ORDER';
                        break;
                      case 'SUBTRACT':
                        movementType = 'OUT';
                        referenceType = 'ADJUSTMENT';
                        break;
                      case 'SET':
                        movementType = 'ADJUSTMENT';
                        referenceType = 'ADJUSTMENT';
                        break;
                      default:
                        movementType = 'ADJUSTMENT';
                        referenceType = 'ADJUSTMENT';
                    }

                    setMovementFormData(prev => ({
                      ...prev,
                      operation: operation,
                      movementType: movementType,
                      referenceType: referenceType
                    }));
                  }}
                  label="Operation *"
                  sx={{ fontSize: '0.8rem' }}
                >
                  <MenuItem value="ADD" sx={{ fontSize: '0.8rem' }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <AddCircleIcon sx={{ fontSize: '0.9rem', color: 'success.main' }} />
                      <span>Stock In (Add)</span>
                    </Stack>
                  </MenuItem>
                  <MenuItem value="SUBTRACT" sx={{ fontSize: '0.8rem' }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <RemoveCircleIcon sx={{ fontSize: '0.9rem', color: 'error.main' }} />
                      <span>Stock Out (Subtract)</span>
                    </Stack>
                  </MenuItem>
                  <MenuItem value="SET" sx={{ fontSize: '0.8rem' }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <AdjustIcon sx={{ fontSize: '0.9rem', color: 'warning.main' }} />
                      <span>Adjust (Set)</span>
                    </Stack>
                  </MenuItem>
                </Select>
              </FormControl>

              {/* Quantity */}
              <TextField
                label="Quantity *"
                type="number"
                value={movementFormData.quantity}
                onChange={(e) => setMovementFormData(prev => ({ ...prev, quantity: e.target.value }))}
                fullWidth
                size="small"
                InputProps={{
                  inputProps: {
                    min: movementFormData.operation === 'SUBTRACT' ? 0.01 : 0,
                    max: movementFormData.operation === 'SUBTRACT' ? selectedItem.quantity : undefined,
                    step: 0.01
                  }
                }}
                helperText={
                  movementFormData.operation === 'SUBTRACT'
                    ? `Max: ${selectedItem.quantity}`
                    : movementFormData.operation === 'SET'
                      ? `Set to new quantity`
                      : 'Enter quantity to add'
                }
              />

              {/* Reason */}
              <TextField
                label="Reason *"
                value={movementFormData.reason}
                onChange={(e) => setMovementFormData(prev => ({ ...prev, reason: e.target.value }))}
                fullWidth
                size="small"
                multiline
                rows={2}
                placeholder="e.g., New stock received, Damaged items, Inventory adjustment"
              />

              {/* Notes */}
              <TextField
                label="Notes"
                value={movementFormData.notes}
                onChange={(e) => setMovementFormData(prev => ({ ...prev, notes: e.target.value }))}
                fullWidth
                size="small"
                multiline
                rows={2}
                placeholder="Additional notes about this movement"
              />

              <Divider sx={{ my: 1 }} />

              {/* Reference Information */}
              <Typography variant="subtitle2" sx={{ fontSize: '0.8rem', fontWeight: 600, color: 'primary.main' }}>
                Reference Information
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Reference Number"
                    value={movementFormData.referenceNumber}
                    onChange={(e) => setMovementFormData(prev => ({ ...prev, referenceNumber: e.target.value }))}
                    fullWidth
                    size="small"
                    placeholder="e.g., PO-12345, INV-67890"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel sx={{ fontSize: '0.75rem' }}>Reference Type</InputLabel>
                    <Select
                      value={movementFormData.referenceType}
                      onChange={(e) => setMovementFormData(prev => ({ ...prev, referenceType: e.target.value }))}
                      label="Reference Type"
                      sx={{ fontSize: '0.8rem' }}
                    >
                      <MenuItem value="PURCHASE_ORDER" sx={{ fontSize: '0.8rem' }}>Purchase Order</MenuItem>
                      <MenuItem value="INVOICE" sx={{ fontSize: '0.8rem' }}>Invoice</MenuItem>
                      <MenuItem value="RETURN" sx={{ fontSize: '0.8rem' }}>Return</MenuItem>
                      <MenuItem value="ADJUSTMENT" sx={{ fontSize: '0.8rem' }}>Adjustment</MenuItem>
                      <MenuItem value="TRANSFER" sx={{ fontSize: '0.8rem' }}>Transfer</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Trip ID (Optional)"
                    type="number"
                    value={movementFormData.tripId || ''}
                    onChange={(e) => setMovementFormData(prev => ({ ...prev, tripId: e.target.value }))}
                    fullWidth
                    size="small"
                    placeholder="Associated trip ID"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Fuel Slip ID (Optional)"
                    type="number"
                    value={movementFormData.fuelSlipId || ''}
                    onChange={(e) => setMovementFormData(prev => ({ ...prev, fuelSlipId: e.target.value }))}
                    fullWidth
                    size="small"
                    placeholder="Associated fuel slip ID"
                  />
                </Grid>
              </Grid>

              <Divider sx={{ my: 1 }} />

              {/* Approval Settings */}
              <Typography variant="subtitle2" sx={{ fontSize: '0.8rem', fontWeight: 600, color: 'primary.main' }}>
                Approval Settings
              </Typography>

              <FormControlLabel
                control={
                  <Checkbox
                    checked={movementFormData.requiresApproval}
                    onChange={(e) => {
                      setMovementFormData(prev => ({
                        ...prev,
                        requiresApproval: e.target.checked,
                        approvalStatus: e.target.checked ? 'PENDING' : 'APPROVED'
                      }));
                    }}
                    size="small"
                  />
                }
                label="Requires Approval"
                sx={{ fontSize: '0.8rem' }}
              />

              {movementFormData.requiresApproval && (
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Approved By"
                      value={movementFormData.approvedBy || ''}
                      onChange={(e) => setMovementFormData(prev => ({ ...prev, approvedBy: e.target.value }))}
                      fullWidth
                      size="small"
                      placeholder="Name of approver"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth size="small">
                      <InputLabel sx={{ fontSize: '0.75rem' }}>Approval Status</InputLabel>
                      <Select
                        value={movementFormData.approvalStatus}
                        onChange={(e) => setMovementFormData(prev => ({ ...prev, approvalStatus: e.target.value }))}
                        label="Approval Status"
                        sx={{ fontSize: '0.8rem' }}
                      >
                        <MenuItem value="PENDING" sx={{ fontSize: '0.8rem' }}>Pending</MenuItem>
                        <MenuItem value="APPROVED" sx={{ fontSize: '0.8rem' }}>Approved</MenuItem>
                        <MenuItem value="REJECTED" sx={{ fontSize: '0.8rem' }}>Rejected</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="Performed By"
                      value={movementFormData.performedBy}
                      onChange={(e) => setMovementFormData(prev => ({ ...prev, performedBy: e.target.value }))}
                      fullWidth
                      size="small"
                      placeholder="Who performed this movement"
                    />
                  </Grid>
                </Grid>
              )}

              {/* Validation Alert */}
              {movementFormData.operation === 'SUBTRACT' && movementFormData.quantity > selectedItem.quantity && (
                <Alert severity="error" sx={{ fontSize: '0.8rem' }}>
                  Insufficient stock! Available: {selectedItem.quantity}
                </Alert>
              )}

              {movementFormData.requiresApproval && !movementFormData.approvedBy && (
                <Alert severity="warning" sx={{ fontSize: '0.8rem' }}>
                  This movement requires approval. Please specify who will approve it.
                </Alert>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 2.5, py: 1.5, borderTop: 1, borderColor: 'divider' }}>
          <Button onClick={() => setShowMovementDialog(false)} size="small" sx={{ fontSize: '0.8rem' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            size="small"
            onClick={handleSubmitMovement}
            sx={{ fontSize: '0.8rem' }}
            disabled={
              !movementFormData.itemId ||
              movementFormData.quantity <= 0 ||
              !movementFormData.reason ||
              (movementFormData.operation === 'SUBTRACT' && movementFormData.quantity > selectedItem?.quantity) ||
              (movementFormData.requiresApproval && !movementFormData.approvedBy)
            }
          >
            {movementFormData.operation === 'ADD' && 'Add Stock'}
            {movementFormData.operation === 'SUBTRACT' && 'Remove Stock'}
            {movementFormData.operation === 'SET' && 'Set Quantity'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Inventory;
