// src/pages/Inventory.jsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Paper, Typography, Grid, Card, CardContent, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Chip, TextField, InputAdornment, Stack, Tooltip, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions, FormControl,
  InputLabel, Select, MenuItem, CircularProgress, Tabs, Tab, Divider,
  Avatar, Badge, LinearProgress, FormControlLabel, Checkbox, Switch,
  Menu, Snackbar, Collapse,
} from '@mui/material';
import {
  Inventory as InventoryIcon, Search, Add, Edit, Delete, Visibility,
  LocalShipping, Build, OilBarrel, Refresh as RefreshIcon,
  Warning as WarningIcon, CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon, Category as CategoryIcon, LocationOn, LocalOffer,
  TrendingUp, TrendingDown, SwapHoriz, Assignment, DirectionsCar, Person,
  Receipt, Save as SaveIcon, Close as CloseIcon, Lock as LockIcon,
  Event as EventIcon, Description as DescriptionIcon,
  PersonAdd as PersonAddIcon, AddCircle as AddCircleIcon,
  RemoveCircle as RemoveCircleIcon, Adjust as AdjustIcon,
  CompareArrows as CompareArrowsIcon, Undo as UndoIcon,
  Download as DownloadIcon, People, CarRental, Inventory2, QrCode,
  BugReport as BugReportIcon, ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import api from '../services/api';
import { inventoryService } from '../services/inventoryService';
import { vehicleIssueService } from '../services/vehicleIssueService';
import { vehicleService } from '../services/vehicleService';
import { driverService } from '../services/driverService';
import MovementHistory from './MovementHistory';
import { inventoryMovementService } from '../services/inventoryMovementService';
import StockOnHand from '../components/StockOnHand';
import { exportCsv, exportXlsx, printToPdf } from '../utils/exportTable';

// ============================================================
// HELPERS
// ============================================================

const ISSUE_REQUIRES_CONSUMABLE = true;
const ITEM_PAGE_SIZE = 100;
const MAX_ITEM_PAGES = 50;
const MOV_PAGE_SIZE = 50;

const toArray = (res) => {
  if (!res) return [];
  if (Array.isArray(res)) return res;

  let payload = res;
  if (
    payload.data !== undefined &&
    (payload.status !== undefined || payload.config !== undefined)
  ) {
    payload = payload.data;
  }

  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.content)) return payload.content;
  if (payload && Array.isArray(payload.data)) return payload.data;
  if (payload && payload.data && Array.isArray(payload.data.content)) {
    return payload.data.content;
  }

  const findArray = (node, depth = 0) => {
    if (!node || depth > 4) return null;
    if (Array.isArray(node)) return node;
    if (typeof node !== 'object') return null;

    const preferred = ['items', 'list', 'records', 'rows', 'results', 'content', 'data'];
    for (const k of preferred) {
      if (node[k] !== undefined) {
        const found = findArray(node[k], depth + 1);
        if (found) return found;
      }
    }
    const vals = Object.values(node);
    if (vals.length > 0 && vals.every((v) => v && typeof v === 'object' && !Array.isArray(v))) {
      return vals;
    }
    return null;
  };

  const found = findArray(payload);
  if (found) return found;

  console.warn(
    '⚠️ toArray: no array found in response. Keys:',
    payload && typeof payload === 'object' ? Object.keys(payload) : typeof payload
  );
  return [];
};

const getErrorMessage = (err, fallback) => {
  const data = err?.response?.data ?? err?.data;
  if (typeof data === 'string' && data.trim()) return data;
  return data?.message || data?.error || data?.detail || err?.userMessage || err?.message || fallback;
};

const parseWholeQuantity = (value, { allowZero = false } = {}) => {
  if (value === '' || value === null || value === undefined) return null;
  const n = Number(value);
  if (!Number.isInteger(n)) return null;
  return n > 0 || (allowZero && n === 0) ? n : null;
};

const localNowIso = (d = new Date()) => {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
};

const toDateTimeLocalValue = (d = new Date()) => {
  if (!d) return '';
  const date = d instanceof Date ? d : new Date(d);
  if (isNaN(date.getTime())) return '';
  const p = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}T${p(date.getHours())}:${p(date.getMinutes())}`;
};

const fromDateTimeLocalValue = (v) => {
  if (!v) return null;
  return String(v).length === 16 ? `${v}:00` : v;
};

const outstandingQty = (line) => {
  if (!line) return 0;
  const issued = Number(line.quantityIssued ?? line.quantity ?? 0) || 0;
  const returned = Number(line.quantityReturned ?? line.returnedQuantity ?? 0) || 0;
  return Math.max(0, issued - returned);
};

const issueTypeOf = (issue) => (issue?.issueNumber?.startsWith('DI-') ? 'driver' : 'vehicle');

const isIssuable = (item, target) => {
  if (!item || item.isActive === false || item.isHeld) return false;
  if (ISSUE_REQUIRES_CONSUMABLE && item.isConsumable === false) return false;
  if (target === 'vehicle') return item.isVehicleIssuable !== false;
  if (target === 'driver') return item.isDriverIssuable !== false;
  return true;
};

const resolveIssueDate = (issue) =>
  issue?.issueDate || issue?.createdAt || issue?.transactionDate || null;

// Best-effort guess at the API base URL (falls back to a known default)
const getApiBase = () => {
  try {
    if (api?.defaults?.baseURL) return api.defaults.baseURL;
  } catch { /* ignore */ }
  try {
    if (import.meta.env?.VITE_API_BASE_URL) return import.meta.env.VITE_API_BASE_URL;
  } catch { /* ignore */ }
  return 'https://trailers-backend.onrender.com/api';
};

// Compact preview of a raw response body for the diagnostics dialog
const previewOf = (body) => {
  if (body === null || body === undefined) return '(null)';
  try {
    const s = typeof body === 'string' ? body : JSON.stringify(body);
    return s.length > 280 ? `${s.slice(0, 280)}…` : s;
  } catch {
    return String(body);
  }
};

// ============================================================
// ERROR BOUNDARY — keeps MovementHistory crashes from killing the page
// ============================================================
class SafeSection extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, info) {
    console.error(`[${this.props.label || 'Section'}] crashed:`, error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <Alert severity="error" sx={{ borderRadius: '10px', fontSize: '0.8rem' }}>
          <strong>{this.props.label || 'Section'} crashed.</strong>
          <br />
          <code style={{ fontSize: '0.7rem' }}>{String(this.state.error)}</code>
          <br />
          <small>Open DevTools console for the full stack trace.</small>
        </Alert>
      );
    }
    return this.props.children;
  }
}

// ============================================================
// STAT CARD
// ============================================================
const StatCard = ({ title, value, icon: Icon, color = 'primary', subtitle, badge }) => {
  const getColor = (colorName) => ({
    primary: '#4F46E5', success: '#22C55E', warning: '#F59E0B', error: '#EF4444',
    info: '#3B82F6', secondary: '#6B7280', purple: '#8B5CF6', pink: '#EC4899',
    teal: '#14B8A6', indigo: '#6366F1',
  }[colorName] || '#4F46E5');

  const getColorBg = (color) => ({
    primary: '#EEF2FF', success: '#D1FAE5', warning: '#FEF3C7', error: '#FEE2E2',
    info: '#DBEAFE', secondary: '#F3F4F6', purple: '#EDE9FE', pink: '#FCE7F3',
    teal: '#CCFBF1', indigo: '#E0E7FF',
  }[color] || '#EEF2FF');

  const iconColor = getColor(color);
  const bgColor = getColorBg(color);
  const SafeIcon = Icon || InventoryIcon;

  return (
    <Card sx={{
      bgcolor: '#FFFFFF', borderRadius: { xs: '12px', sm: '14px', md: '16px' },
      border: '1px solid #ECECEC', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      height: '100%', width: '100%', position: 'relative', overflow: 'visible',
      '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 8px 32px rgba(0,0,0,0.1)', borderColor: iconColor },
    }}>
      <CardContent sx={{ p: { xs: 1.5, sm: 2, md: 2.5 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="caption" sx={{ color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', fontSize: { xs: '0.55rem', sm: '0.6rem', md: '0.65rem' }, letterSpacing: '0.5px', display: 'block', mb: 0.25 }}>{title}</Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#111827', fontSize: { xs: '1.2rem', sm: '1.4rem', md: '1.6rem', lg: '1.8rem' }, lineHeight: 1.2 }}>{value || 0}</Typography>
            {subtitle && <Typography variant="caption" sx={{ color: '#6B7280', display: 'block', mt: 0.25, fontSize: { xs: '0.55rem', sm: '0.6rem', md: '0.65rem' } }}>{subtitle}</Typography>}
          </Box>
          <Box sx={{ bgcolor: bgColor, borderRadius: { xs: '10px', sm: '12px', md: '14px' }, p: { xs: 1, sm: 1.25, md: 1.5 }, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.3s ease', '&:hover': { transform: 'scale(1.05)' } }}>
            <SafeIcon sx={{ color: iconColor, fontSize: { xs: '1.2rem', sm: '1.4rem', md: '1.6rem', lg: '1.8rem' } }} />
          </Box>
        </Stack>
        {badge && <Chip label={badge} size="small" color={color} sx={{ position: 'absolute', top: 8, right: 8, height: 18, fontSize: '0.5rem' }} />}
      </CardContent>
    </Card>
  );
};

const TabPanel = ({ children, value, index, ...other }) => (
  <div role="tabpanel" hidden={value !== index} {...other}>
    {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
  </div>
);

// ============================================================
// INVENTORY ITEM ROW
// ============================================================
const InventoryItemRow = ({ item, onView, onEdit, onDelete, locations, onIssue, onReceive, onIssueToDriver, onMovement }) => {
  const getStatusConfig = (quantity, minLevel) => {
    const qty = Number(quantity) || 0;
    const min = Number(minLevel) || 0;
    if (qty <= 0) return { color: 'error', icon: <CancelIcon sx={{ fontSize: '0.8rem' }} />, label: 'Out of Stock' };
    if (qty <= min) return { color: 'warning', icon: <WarningIcon sx={{ fontSize: '0.8rem' }} />, label: 'Low Stock' };
    return { color: 'success', icon: <CheckCircleIcon sx={{ fontSize: '0.8rem' }} />, label: 'In Stock' };
  };
  const statusConfig = getStatusConfig(item.quantity, item.minLevel);
  const location = locations?.find(l => l.id === item.locationId);
  const isConsumable = item.isConsumable !== false;
  const isDriverIssuable = item.isDriverIssuable !== false;
  const isVehicleIssuable = item.isVehicleIssuable !== false;
  const isHeld = item.isHeld || false;

  let issueType = 'N/A';
  let issueTypeColor = 'default';
  if (isDriverIssuable && isVehicleIssuable) { issueType = 'Both'; issueTypeColor = 'success'; }
  else if (isDriverIssuable) { issueType = 'Driver Only'; issueTypeColor = 'info'; }
  else if (isVehicleIssuable) { issueType = 'Vehicle Only'; issueTypeColor = 'warning'; }

  return (
    <TableRow hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
      <TableCell sx={{ fontSize: '0.75rem', py: 0.75 }}>
        <Typography variant="body2" sx={{ fontSize: '0.7rem', fontWeight: 600, color: '#4F46E5' }}>{item.sku || 'N/A'}</Typography>
      </TableCell>
      <TableCell sx={{ fontSize: '0.75rem', py: 0.75 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Avatar sx={{ width: 24, height: 24, fontSize: '0.6rem', bgcolor: 'primary.light' }}>{item.name?.charAt(0) || 'I'}</Avatar>
          <Box>
            <Typography variant="body2" fontWeight="500" sx={{ fontSize: '0.75rem' }}>{item.name}</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.55rem' }}>ID: {item.id}</Typography>
          </Box>
        </Stack>
      </TableCell>
      <TableCell sx={{ fontSize: '0.75rem', py: 0.75 }}>
        <Chip label={item.category || 'Uncategorized'} size="small" variant="outlined" sx={{ height: 18, fontSize: '0.55rem' }} />
      </TableCell>
      <TableCell sx={{ fontSize: '0.75rem', py: 0.75 }}>
        <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>{item.quantity} {item.unitOfMeasure || 'EA'}</Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.55rem' }}>Unit Cost: R {item.unitCost?.toFixed(2) || '0.00'}</Typography>
      </TableCell>
      <TableCell sx={{ fontSize: '0.75rem', py: 0.75 }}>
        <Stack spacing={0.25}>
          {isConsumable ? <Chip label="Consumable" size="small" color="primary" variant="outlined" sx={{ height: 16, fontSize: '0.5rem' }} /> : <Chip label="Non-Consumable" size="small" color="secondary" variant="outlined" sx={{ height: 16, fontSize: '0.5rem' }} />}
          <Chip label={issueType} size="small" color={issueTypeColor} sx={{ height: 16, fontSize: '0.5rem' }} />
        </Stack>
      </TableCell>
      <TableCell sx={{ fontSize: '0.75rem', py: 0.75 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>{item.minLevel || 0} {item.unitOfMeasure || 'EA'}</Typography>
          {item.quantity <= item.minLevel && item.quantity > 0 && <Chip label="Reorder" size="small" color="warning" sx={{ height: 16, fontSize: '0.5rem' }} />}
        </Box>
      </TableCell>
      <TableCell sx={{ fontSize: '0.75rem', py: 0.75 }}>
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <LocationOn sx={{ fontSize: '0.7rem', color: 'text.secondary' }} />
          <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>{location?.name || 'N/A'}</Typography>
        </Stack>
      </TableCell>
      <TableCell sx={{ fontSize: '0.75rem', py: 0.75 }}>
        <Stack spacing={0.25}>
          <Chip label={statusConfig.label} color={statusConfig.color} size="small" icon={statusConfig.icon} sx={{ height: 18, fontSize: '0.55rem' }} />
          {isHeld && <Chip label="On Hold" size="small" color="warning" icon={<LockIcon sx={{ fontSize: '0.6rem' }} />} sx={{ height: 16, fontSize: '0.5rem' }} />}
        </Stack>
      </TableCell>
      <TableCell sx={{ fontSize: '0.75rem', py: 0.75 }}>
        <Stack direction="row" spacing={0.25}>
          <Tooltip title="View Details"><IconButton size="small" color="primary" onClick={() => onView(item)} sx={{ p: 0.5 }}><Visibility sx={{ fontSize: '0.9rem' }} /></IconButton></Tooltip>
          <Tooltip title="Edit Item"><IconButton size="small" color="secondary" onClick={() => onEdit(item)} sx={{ p: 0.5 }}><Edit sx={{ fontSize: '0.9rem' }} /></IconButton></Tooltip>
          <Tooltip title="Stock Movement"><IconButton size="small" color="info" onClick={() => onMovement(item)} sx={{ p: 0.5 }}><CompareArrowsIcon sx={{ fontSize: '0.9rem' }} /></IconButton></Tooltip>
          {isIssuable(item, 'vehicle') && <Tooltip title="Issue to Vehicle"><IconButton size="small" color="warning" onClick={() => onIssue(item)} sx={{ p: 0.5 }}><DirectionsCar sx={{ fontSize: '0.9rem' }} /></IconButton></Tooltip>}
          {isIssuable(item, 'driver') && <Tooltip title="Issue to Driver"><IconButton size="small" color="info" onClick={() => onIssueToDriver(item)} sx={{ p: 0.5 }}><Person sx={{ fontSize: '0.9rem' }} /></IconButton></Tooltip>}
          {isIssuable(item) && <Tooltip title="Receive Return"><IconButton size="small" color="success" onClick={() => onReceive(item)} sx={{ p: 0.5 }}><UndoIcon sx={{ fontSize: '0.9rem' }} /></IconButton></Tooltip>}
          <Tooltip title="Delete Item"><IconButton size="small" color="error" onClick={() => onDelete(item)} sx={{ p: 0.5 }}><Delete sx={{ fontSize: '0.9rem' }} /></IconButton></Tooltip>
        </Stack>
      </TableCell>
    </TableRow>
  );
};

// ============================================================
// VEHICLE ISSUE ROW
// ============================================================
const VehicleIssueRow = ({ issue, onView, onReturn, onSwap, vehicles, drivers, inventoryItems }) => {
  if (!issue) return null;
  const getStatusColor = (status) => ({ RETURNED: 'success', PARTIALLY_RETURNED: 'warning' }[status] || 'info');
  const vehicle = vehicles?.find(v => v.id === issue.vehicleId);
  const driver = drivers?.find(d => d.id === issue.driverId);
  const getVehicleDisplay = (v) => !v ? 'Unknown Vehicle' : (v.registrationNumber || v.regNumber || `${v.make || ''} ${v.model || ''}`.trim() || `Vehicle #${v.id}`);
  const getDriverDisplay = (d) => !d ? 'Unknown Driver' : (d.fullName || `${d.firstName || ''} ${d.lastName || ''}`.trim() || `Driver #${d.id}`);
  const firstItem = issue.items?.[0];
  const itemName = firstItem?.itemName || inventoryItems?.find(i => i.id === firstItem?.itemId)?.name || 'Unknown Item';
  const issueDate = resolveIssueDate(issue);

  return (
    <TableRow hover>
      <TableCell sx={{ fontSize: '0.75rem', py: 0.75 }}><Typography variant="body2" fontWeight="500" sx={{ fontSize: '0.75rem' }}>{issue.issueNumber || `Issue #${issue.id}`}</Typography></TableCell>
      <TableCell sx={{ fontSize: '0.75rem', py: 0.75 }}><Stack direction="row" alignItems="center" spacing={0.5}><DirectionsCar sx={{ fontSize: '0.8rem', color: 'text.secondary' }} /><Typography variant="body2" sx={{ fontSize: '0.7rem', fontWeight: 500 }}>{getVehicleDisplay(vehicle)}</Typography></Stack></TableCell>
      <TableCell sx={{ fontSize: '0.75rem', py: 0.75 }}><Stack direction="row" alignItems="center" spacing={0.5}><Person sx={{ fontSize: '0.8rem', color: 'text.secondary' }} /><Typography variant="body2" sx={{ fontSize: '0.7rem', fontWeight: 500 }}>{getDriverDisplay(driver)}</Typography></Stack></TableCell>
      <TableCell sx={{ fontSize: '0.75rem', py: 0.75 }}>
        <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>{itemName}</Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.5rem' }}>Qty: {firstItem?.quantityIssued || firstItem?.quantity || 0}{firstItem?.condition && ` • ${firstItem.condition}`}</Typography>
      </TableCell>
      <TableCell sx={{ fontSize: '0.75rem', py: 0.75 }}><Typography variant="body2" sx={{ fontSize: '0.7rem' }}>{issueDate ? new Date(issueDate).toLocaleDateString() : 'N/A'}</Typography></TableCell>
      <TableCell sx={{ fontSize: '0.75rem', py: 0.75 }}><Chip label={issue.status || 'ISSUED'} color={getStatusColor(issue.status)} size="small" sx={{ height: 18, fontSize: '0.55rem' }} /></TableCell>
      <TableCell sx={{ fontSize: '0.75rem', py: 0.75 }}>
        <Stack direction="row" spacing={0.25}>
          <Tooltip title="View Details"><IconButton size="small" color="primary" onClick={() => onView(issue)} sx={{ p: 0.5 }}><Visibility sx={{ fontSize: '0.9rem' }} /></IconButton></Tooltip>
          {issue.status !== 'RETURNED' && (<>
            <Tooltip title="Return Items"><IconButton size="small" color="success" onClick={() => onReturn(issue)} sx={{ p: 0.5 }}><UndoIcon sx={{ fontSize: '0.9rem' }} /></IconButton></Tooltip>
            <Tooltip title="Swap Item"><IconButton size="small" color="warning" onClick={() => onSwap(issue)} sx={{ p: 0.5 }}><SwapHoriz sx={{ fontSize: '0.9rem' }} /></IconButton></Tooltip>
          </>)}
        </Stack>
      </TableCell>
    </TableRow>
  );
};

// ============================================================
// DRIVER ISSUE ROW
// ============================================================
const DriverIssueRow = ({ issue, onView, onReturn, onSwap, drivers, inventoryItems }) => {
  if (!issue) return null;
  const getStatusColor = (status) => ({ RETURNED: 'success', PARTIALLY_RETURNED: 'warning' }[status] || 'info');
  const driver = drivers?.find(d => d.id === issue.driverId);
  const getDriverDisplay = (d) => !d ? 'Unknown Driver' : (d.fullName || `${d.firstName || ''} ${d.lastName || ''}`.trim() || `Driver #${d.id}`);
  const firstItem = issue.items?.[0];
  const itemName = firstItem?.itemName || inventoryItems?.find(i => i.id === firstItem?.itemId)?.name || 'Unknown Item';
  const issueDate = resolveIssueDate(issue);

  return (
    <TableRow hover>
      <TableCell sx={{ fontSize: '0.75rem', py: 0.75 }}><Typography variant="body2" fontWeight="500" sx={{ fontSize: '0.75rem' }}>{issue.issueNumber || `Issue #${issue.id}`}</Typography></TableCell>
      <TableCell sx={{ fontSize: '0.75rem', py: 0.75 }}><Stack direction="row" alignItems="center" spacing={0.5}><Person sx={{ fontSize: '0.8rem', color: 'text.secondary' }} /><Typography variant="body2" sx={{ fontSize: '0.7rem', fontWeight: 500 }}>{getDriverDisplay(driver)}</Typography></Stack></TableCell>
      <TableCell sx={{ fontSize: '0.75rem', py: 0.75 }}>
        <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>{itemName}</Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.5rem' }}>Qty: {firstItem?.quantityIssued || firstItem?.quantity || 0}{firstItem?.condition && ` • ${firstItem.condition}`}</Typography>
      </TableCell>
      <TableCell sx={{ fontSize: '0.75rem', py: 0.75 }}><Typography variant="body2" sx={{ fontSize: '0.7rem' }}>{issueDate ? new Date(issueDate).toLocaleDateString() : 'N/A'}</Typography></TableCell>
      <TableCell sx={{ fontSize: '0.75rem', py: 0.75 }}><Chip label={issue.status || 'ISSUED'} color={getStatusColor(issue.status)} size="small" sx={{ height: 18, fontSize: '0.55rem' }} /></TableCell>
      <TableCell sx={{ fontSize: '0.75rem', py: 0.75 }}>
        <Stack direction="row" spacing={0.25}>
          <Tooltip title="View Details"><IconButton size="small" color="primary" onClick={() => onView(issue)} sx={{ p: 0.5 }}><Visibility sx={{ fontSize: '0.9rem' }} /></IconButton></Tooltip>
          {issue.status !== 'RETURNED' && (<>
            <Tooltip title="Return Items"><IconButton size="small" color="success" onClick={() => onReturn(issue)} sx={{ p: 0.5 }}><UndoIcon sx={{ fontSize: '0.9rem' }} /></IconButton></Tooltip>
            <Tooltip title="Swap Item"><IconButton size="small" color="warning" onClick={() => onSwap(issue)} sx={{ p: 0.5 }}><SwapHoriz sx={{ fontSize: '0.9rem' }} /></IconButton></Tooltip>
          </>)}
        </Stack>
      </TableCell>
    </TableRow>
  );
};

// ============================================================
// EXPORT MENU
// ============================================================
const ExportMenu = ({ disabled, onCsv, onXlsx, onPdf }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const run = (fn) => { setAnchorEl(null); if (typeof fn === 'function') fn(); };
  return (
    <>
      <Button variant="outlined" size="small" startIcon={<DownloadIcon sx={{ fontSize: '0.9rem' }} />} onClick={(e) => setAnchorEl(e.currentTarget)} disabled={disabled} sx={{ fontSize: '0.75rem', borderRadius: '10px', textTransform: 'none', py: 0.5 }}>Export</Button>
      <Menu anchorEl={anchorEl} open={open} onClose={() => setAnchorEl(null)}>
        <MenuItem onClick={() => run(onCsv)} sx={{ fontSize: '0.8rem' }}>Export as CSV</MenuItem>
        <MenuItem onClick={() => run(onXlsx)} sx={{ fontSize: '0.8rem' }}>Export as Excel (.xlsx)</MenuItem>
        <MenuItem onClick={() => run(onPdf)} sx={{ fontSize: '0.8rem' }}>Print / Save as PDF</MenuItem>
      </Menu>
    </>
  );
};

// ============================================================
// MAIN COMPONENT
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

  // Diagnostics
  const [rawItemsResponse, setRawItemsResponse] = useState(null);
  const [endpointDiagnostics, setEndpointDiagnostics] = useState([]);
  const [diagOpen, setDiagOpen] = useState(false);
  const [diagRunning, setDiagRunning] = useState(false);
  const [diagResults, setDiagResults] = useState([]);
  const [diagDialogOpen, setDiagDialogOpen] = useState(false);
  const [movementDiagOpen, setMovementDiagOpen] = useState(false);
  const [movementDiag, setMovementDiag] = useState(null);
  const [movementDiagRunning, setMovementDiagRunning] = useState(false);

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
  const [returnIssueOptions, setReturnIssueOptions] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    sku: '', name: '', category: '', unitOfMeasure: 'EA', isConsumable: true,
    reorderLevel: 0, locationId: '', quantity: 0, unitCost: 0, minLevel: 0,
    isActive: true, notes: '', isDriverIssuable: true, isVehicleIssuable: true,
    returnByDate: '', isHeld: false, holdCode: '', holdDate: '', holdReason: '', heldBy: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [issueFormData, setIssueFormData] = useState({
    itemId: '', vehicleId: '', driverId: '', tripId: '',
    quantity: 1, condition: 'NEW', notes: '', issueDate: toDateTimeLocalValue(),
  });
  const [driverIssueFormData, setDriverIssueFormData] = useState({
    driverId: '', quantity: 1, condition: 'NEW', notes: '',
    issueDate: toDateTimeLocalValue(),
  });
  const [returnFormData, setReturnFormData] = useState({ quantity: 1, condition: 'DAMAGED', notes: '' });
  const [swapFormData, setSwapFormData] = useState({ oldItemId: '', newItemId: '', newQuantity: 1, returnQuantity: 1, damagedCondition: 'DAMAGED', damageNotes: '', issueType: 'vehicle' });
  const [movementFormData, setMovementFormData] = useState({
    itemId: '', quantity: 0, operation: 'ADD', movementType: 'IN', reason: '', notes: '',
    referenceNumber: '', referenceType: 'PURCHASE_ORDER', requiresApproval: false,
    approvalStatus: 'APPROVED', performedBy: 'SYSTEM', tripId: null, fuelSlipId: null,
    approvedBy: null, approvedAt: null,
  });

  // ============================================================
  // DATA LOADING — multi-endpoint fallback
  // ============================================================
  useEffect(() => { loadData(); /* eslint-disable-next-line */ }, []);

  // Paginate from a known-working first page
  const paginateFrom = async (startPage) => {
    const all = [];
    for (let page = startPage; page < MAX_ITEM_PAGES; page += 1) {
      const res = await inventoryService.getInventoryItems(page, ITEM_PAGE_SIZE);
      const rows = toArray(res);
      all.push(...rows);
      if (rows.length < ITEM_PAGE_SIZE) break;
    }
    return all;
  };

  // Try multiple endpoint variants; use the first that returns data
  const fetchAllItems = async () => {
    const diags = [];
    const setDiag = (d) => { diags.push(d); setEndpointDiagnostics([...diags]); };

    // Variant 1: standard page 0
    try {
      const res = await inventoryService.getInventoryItems(0, ITEM_PAGE_SIZE);
      setRawItemsResponse(res);
      const rows = toArray(res);
      const body = res?.data ?? res;
      setDiag({
        variant: 'GET /inventory/items?page=0&size=100',
        rowCount: rows.length,
        totalElements: body?.totalElements,
        size: body?.size,
        number: body?.number,
      });
      if (rows.length > 0) {
        console.log(`✅ variant 1 returned ${rows.length} rows`);
        return await paginateFrom(1);
      }
    } catch (err) {
      setDiag({ variant: 'GET /inventory/items?page=0&size=100', error: err?.message || String(err) });
    }

    // Variant 2: page 1 (in case backend is 1-based)
    try {
      const res = await inventoryService.getInventoryItems(1, ITEM_PAGE_SIZE);
      const rows = toArray(res);
      const body = res?.data ?? res;
      setDiag({
        variant: 'GET /inventory/items?page=1&size=100 (1-based fallback)',
        rowCount: rows.length,
        totalElements: body?.totalElements,
        size: body?.size,
        number: body?.number,
      });
      if (rows.length > 0) {
        console.log(`✅ variant 2 (1-based) returned ${rows.length} rows`);
        return await paginateFrom(2);
      }
    } catch (err) {
      setDiag({ variant: 'GET /inventory/items?page=1&size=100 (1-based fallback)', error: err?.message || String(err) });
    }

    // Variant 3: search endpoint with empty search
    try {
      if (typeof inventoryService.searchItems === 'function') {
        const res = await inventoryService.searchItems('', 0, ITEM_PAGE_SIZE);
        const rows = toArray(res);
        const body = res?.data ?? res;
        setDiag({
          variant: 'GET /inventory/items/search?search=&page=0&size=100',
          rowCount: rows.length,
          totalElements: body?.totalElements,
          size: body?.size,
        });
        if (rows.length > 0) {
          console.log(`✅ variant 3 (search) returned ${rows.length} rows`);
          return await paginateFrom(1);
        }
      } else {
        setDiag({ variant: 'GET /inventory/items/search', note: 'searchItems() not available on inventoryService' });
      }
    } catch (err) {
      setDiag({ variant: 'GET /inventory/items/search?search=&page=0&size=100', error: err?.message || String(err) });
    }

    // Variant 4: /consumable endpoint (returns raw array)
    try {
      if (typeof inventoryService.getConsumableItems === 'function') {
        const res = await inventoryService.getConsumableItems();
        const rows = toArray(res);
        setDiag({
          variant: 'GET /inventory/items/consumable',
          rowCount: rows.length,
        });
        if (rows.length > 0) {
          console.log(`✅ variant 4 (consumable) returned ${rows.length} rows`);
          return rows;
        }
      }
    } catch (err) {
      setDiag({ variant: 'GET /inventory/items/consumable', error: err?.message || String(err) });
    }

    // Nothing worked — dump the raw shape for debugging
    const peek = rawItemsResponse?.data ?? rawItemsResponse;
    if (peek) {
      console.warn('❌ All variants returned empty. Raw page-0 payload:', peek);
    }
    return [];
  };

  const normalizeItem = (item) => ({
    ...item,
    sku: item.sku || null,
    quantity: Number(item.quantity) || 0,
    minLevel: Number(item.minLevel) || 0,
    isDriverIssuable: item.isDriverIssuable !== undefined ? item.isDriverIssuable : true,
    isVehicleIssuable: item.isVehicleIssuable !== undefined ? item.isVehicleIssuable : true,
    isActive: item.isActive !== undefined && item.isActive !== null ? item.isActive : true,
    isHeld: item.isHeld || false,
    holdCode: item.holdCode || null,
    holdDate: item.holdDate || null,
    holdReason: item.holdReason || null,
    heldBy: item.heldBy || null,
    returnByDate: item.returnByDate || null,
  });

  const loadVehicleIssues = async () => {
    setLoadingIssues(true);
    try { const issues = toArray(await vehicleIssueService.getVehicleIssues()); setVehicleIssues(issues); return issues; }
    catch (err) { console.error('Error loading vehicle issues:', err); setVehicleIssues([]); return []; }
    finally { setLoadingIssues(false); }
  };

  const loadDriverIssues = async () => {
    setLoadingIssues(true);
    try { const issues = toArray(await vehicleIssueService.getDriverIssues()); setDriverIssues(issues); return issues; }
    catch (err) { console.error('Error loading driver issues:', err); setDriverIssues([]); return []; }
    finally { setLoadingIssues(false); }
  };

  const loadData = async () => {
    setLoading(true); setError(null); setLoadingVehicles(true); setLoadingDrivers(true);

    const [itemsRes, locationsRes, vehiclesRes, driversRes, statsRes] = await Promise.allSettled([
      fetchAllItems(), inventoryService.getLocations(),
      vehicleService.getAllVehicles(), driverService.getAllDrivers(),
      inventoryService.getInventoryStats(),
    ]);

    const failed = [];

    if (itemsRes.status === 'fulfilled') setInventoryItems(itemsRes.value.map(normalizeItem));
    else { console.error('Error loading inventory items:', itemsRes.reason); failed.push(`items (${getErrorMessage(itemsRes.reason, 'unknown error')})`); }

    if (locationsRes.status === 'fulfilled') setLocations(toArray(locationsRes.value));
    else { console.error('Error loading locations:', locationsRes.reason); failed.push(`locations (${getErrorMessage(locationsRes.reason, 'unknown error')})`); }

    if (vehiclesRes.status === 'fulfilled') setVehicles(toArray(vehiclesRes.value));
    else { console.error('Error loading vehicles:', vehiclesRes.reason); failed.push('vehicles'); }
    setLoadingVehicles(false);

    if (driversRes.status === 'fulfilled') setDrivers(toArray(driversRes.value));
    else { console.error('Error loading drivers:', driversRes.reason); failed.push('drivers'); }
    setLoadingDrivers(false);

    if (statsRes.status === 'fulfilled') setStats(statsRes.value);
    else console.warn('Inventory stats unavailable:', statsRes.reason);

    await Promise.all([loadVehicleIssues(), loadDriverIssues()]);

    if (failed.length > 0) setError(`Failed to load: ${failed.join(', ')}`);
    setLoading(false);
  };

  const reloadAfterChange = async () => { await loadData(); };

  // ============================================================
  // RUN DIAGNOSTICS (manual, on demand)
  // ============================================================
  const runDiagnostics = async () => {
    setDiagRunning(true);
    setDiagResults([]);
    setDiagDialogOpen(true);
    const results = [];
    const base = getApiBase();

    const variants = [
      { label: 'GET /inventory/items?page=0&size=100', path: '/inventory/items', params: { page: 0, size: 100 } },
      { label: 'GET /inventory/items?page=1&size=100 (1-based)', path: '/inventory/items', params: { page: 1, size: 100 } },
      { label: 'GET /inventory/items?page=0&size=100&sort=id,asc', path: '/inventory/items', params: { page: 0, size: 100, sort: 'id,asc' } },
      { label: 'GET /inventory/items?page=0&size=100&sort=name,asc', path: '/inventory/items', params: { page: 0, size: 100, sort: 'name,asc' } },
      { label: 'GET /inventory/items (no params)', path: '/inventory/items', params: {} },
      { label: 'GET /inventory/items/search?search=&page=0&size=100', path: '/inventory/items/search', params: { search: '', page: 0, size: 100 } },
      { label: 'GET /inventory/items/consumable', path: '/inventory/items/consumable', params: {} },
      { label: 'GET /inventory/items/low-stock', path: '/inventory/items/low-stock', params: {} },
      { label: 'GET /inventory/items/out-of-stock', path: '/inventory/items/out-of-stock', params: {} },
      { label: 'GET /inventory/stats', path: '/inventory/stats', params: {} },
      { label: 'GET /inventory/locations', path: '/inventory/locations', params: {} },
      { label: 'GET /inventory/movements?page=0&size=50', path: '/inventory/movements', params: { page: 0, size: 50 } },
      { label: 'GET /inventory/movements/pending', path: '/inventory/movements/pending', params: {} },
    ];

    for (const v of variants) {
      try {
        const res = await api.get(v.path, { params: v.params });
        const body = res?.data ?? res;
        const extracted = toArray(res);
        results.push({
          label: v.label,
          status: 'success',
          rowCount: Array.isArray(extracted) ? extracted.length : 0,
          totalElements: body?.totalElements,
          size: body?.size,
          preview: previewOf(body),
        });
      } catch (err) {
        results.push({
          label: v.label,
          status: 'error',
          error: err?.response?.data?.detail || err?.response?.data?.message || err?.message || String(err),
        });
      }
      setDiagResults([...results]);
    }
    setDiagRunning(false);
    console.info(`Diagnostics run against ${base}`, results);
  };

  // Movement diagnostics — separate so it doesn't interfere with MovementHistory
  const runMovementDiagnostics = async () => {
    setMovementDiagRunning(true);
    setMovementDiagOpen(true);
    setMovementDiag(null);
    try {
      const res = await api.get('/inventory/movements', { params: { page: 0, size: 50, sort: 'createdAt,desc' } });
      const body = res?.data ?? res;
      const extracted = toArray(res);
      setMovementDiag({
        raw: body,
        rowCount: extracted.length,
        preview: previewOf(body),
        extractedSample: extracted.slice(0, 5),
      });
    } catch (err) {
      setMovementDiag({
        error: err?.response?.data?.detail || err?.message || String(err),
        raw: err?.response?.data,
      });
    } finally {
      setMovementDiagRunning(false);
    }
  };

  // ============================================================
  // HANDLERS
  // ============================================================
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    if (newValue === 1) loadVehicleIssues();
    if (newValue === 2) loadDriverIssues();
  };

  const findItem = (id) => inventoryItems.find((i) => i.id === Number(id));
  const handleViewIssue = (issue) => { setSelectedIssue(issue); setShowIssueDetailsDialog(true); };

  const handleMovement = (item) => {
    setError(null); setSelectedItem(item);
    setMovementFormData({
      itemId: item.id, quantity: 1, operation: 'ADD', movementType: 'IN', reason: '', notes: '',
      referenceNumber: `MOV-${Date.now()}`, referenceType: 'PURCHASE_ORDER',
      requiresApproval: false, approvalStatus: 'APPROVED', performedBy: 'SYSTEM',
      tripId: null, fuelSlipId: null, approvedBy: null, approvedAt: null,
    });
    setShowMovementDialog(true);
  };

  const OPERATION_TYPES = {
    ADD: { movementType: 'IN', referenceType: 'PURCHASE_ORDER', done: 'added' },
    SUBTRACT: { movementType: 'OUT', referenceType: 'ADJUSTMENT', done: 'removed' },
    SET: { movementType: 'ADJUSTMENT', referenceType: 'ADJUSTMENT', done: 'adjusted' },
  };

  const handleSubmitMovement = async () => {
    setError(null);
    const item = findItem(movementFormData.itemId) || selectedItem;
    if (!item) { setError('Please select an item'); return; }
    const op = OPERATION_TYPES[movementFormData.operation] || OPERATION_TYPES.SET;
    const qty = movementFormData.operation === 'SET'
      ? parseWholeQuantity(movementFormData.quantity, { allowZero: true })
      : parseWholeQuantity(movementFormData.quantity);
    if (qty === null) { setError(movementFormData.operation === 'SET' ? 'Quantity must be a whole number of 0 or more' : 'Quantity must be a whole number greater than 0'); return; }
    if (movementFormData.operation === 'SUBTRACT' && qty > item.quantity) { setError(`Insufficient stock. Available: ${item.quantity} ${item.unitOfMeasure || 'EA'}`); return; }
    if (!movementFormData.reason?.trim()) { setError('Please provide a reason for the movement'); return; }
    if (movementFormData.requiresApproval && !movementFormData.approvedBy) { setError('Please specify who will approve this movement'); return; }

    const currentUser = movementFormData.performedBy || 'SYSTEM';
    const payload = {
      itemId: Number(item.id), quantity: qty, movementType: op.movementType,
      reason: movementFormData.reason.trim(), notes: movementFormData.notes || '',
      referenceNumber: movementFormData.referenceNumber || `MOV-${Date.now()}`,
      referenceType: movementFormData.referenceType || op.referenceType,
      requiresApproval: !!movementFormData.requiresApproval,
      approvalStatus: movementFormData.requiresApproval ? 'PENDING' : 'APPROVED',
      performedBy: currentUser,
      tripId: movementFormData.tripId ? parseInt(movementFormData.tripId, 10) : null,
      fuelSlipId: movementFormData.fuelSlipId ? parseInt(movementFormData.fuelSlipId, 10) : null,
      approvedBy: movementFormData.requiresApproval ? movementFormData.approvedBy : currentUser,
      approvedAt: movementFormData.requiresApproval ? null : localNowIso(),
    };

    setSubmitting(true);
    try {
      await inventoryMovementService.recordMovement(payload);
      showSuccess(`Stock ${op.done} successfully`);
      setShowMovementDialog(false);
      resetForms();
      await reloadAfterChange();
    } catch (err) {
      console.error('Error updating stock:', err);
      setError(getErrorMessage(err, 'Failed to update stock'));
    } finally { setSubmitting(false); }
  };

  const handleView = (item) => { setSelectedItem(item); setShowViewDialog(true); };

  const handleEdit = (item) => {
    setError(null); setSelectedItem(item);
    setFormData({
      sku: item.sku || '', name: item.name || '', category: item.category || '',
      unitOfMeasure: item.unitOfMeasure || 'EA', isConsumable: item.isConsumable !== false,
      reorderLevel: item.reorderLevel || 0, locationId: item.locationId || '',
      quantity: item.quantity || 0, unitCost: item.unitCost || 0, minLevel: item.minLevel || 0,
      isActive: item.isActive !== false, notes: item.notes || '',
      isDriverIssuable: item.isDriverIssuable !== false, isVehicleIssuable: item.isVehicleIssuable !== false,
      returnByDate: item.returnByDate || '', isHeld: item.isHeld || false,
      holdCode: item.holdCode || '', holdDate: item.holdDate || '',
      holdReason: item.holdReason || '', heldBy: item.heldBy || '',
    });
    setFormErrors({}); setShowAddDialog(true);
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Are you sure you want to delete "${item.name}"?`)) return;
    setError(null);
    try { await inventoryService.deleteInventoryItem(item.id); showSuccess('Item deleted successfully'); await reloadAfterChange(); }
    catch (err) { console.error('Error deleting item:', err); setError(getErrorMessage(err, 'Failed to delete item')); }
  };

  const handleAddNew = () => {
    setError(null); setSelectedItem(null);
    setFormData({
      sku: '', name: '', category: '', unitOfMeasure: 'EA', isConsumable: true, reorderLevel: 0,
      locationId: locations.length > 0 ? locations[0].id : '', quantity: 0, unitCost: 0, minLevel: 0,
      isActive: true, notes: '', isDriverIssuable: true, isVehicleIssuable: true,
      returnByDate: '', isHeld: false, holdCode: '', holdDate: '', holdReason: '', heldBy: '',
    });
    setFormErrors({}); setShowAddDialog(true);
  };

  const openVehicleIssueDialog = (item = null) => {
    setError(null); setSelectedItem(item);
    setIssueFormData({ itemId: item?.id || '', vehicleId: '', driverId: '', tripId: '', quantity: 1, condition: 'NEW', notes: '', issueDate: toDateTimeLocalValue() });
    setShowIssueDialog(true);
  };
  const openDriverIssueDialog = (item = null) => {
    setError(null); setSelectedItem(item);
    setDriverIssueFormData({ driverId: '', quantity: 1, condition: 'NEW', notes: '', issueDate: toDateTimeLocalValue() });
    setShowDriverIssueDialog(true);
  };
  const handleIssueItem = (item) => openVehicleIssueDialog(item);
  const handleIssueToDriver = (item) => openDriverIssueDialog(item);

  const validateIssue = (itemId, quantityValue, target) => {
    const item = findItem(itemId);
    if (!item) { setError('Please select an item'); return null; }
    if (!isIssuable(item, target)) { setError(`${item.name} cannot be issued to a ${target} (inactive, on hold, or not ${target}-issuable)`); return null; }
    const qty = parseWholeQuantity(quantityValue);
    if (qty === null) { setError('Quantity must be a whole number greater than 0'); return null; }
    if (qty > item.quantity) { setError(`Only ${item.quantity} ${item.unitOfMeasure || 'EA'} of ${item.name} available`); return null; }
    return { item, qty };
  };

  const handleSubmitVehicleIssue = async () => {
    setError(null);
    const checked = validateIssue(selectedItem?.id || issueFormData.itemId, issueFormData.quantity, 'vehicle');
    if (!checked) return;
    if (!issueFormData.vehicleId || !issueFormData.driverId) { setError('Please select a vehicle and a driver'); return; }
    if (!issueFormData.issueDate) { setError('Please select the date and time this issue was actually made'); return; }
    const issueDateIso = fromDateTimeLocalValue(issueFormData.issueDate);
    if (!issueDateIso) { setError('Invalid issue date'); return; }

    const payload = {
      vehicleId: Number(issueFormData.vehicleId), driverId: Number(issueFormData.driverId),
      tripId: issueFormData.tripId ? parseInt(issueFormData.tripId, 10) : null,
      issueDate: issueDateIso,
      items: [{ itemId: Number(checked.item.id), quantity: checked.qty, condition: issueFormData.condition, notes: issueFormData.notes || '' }],
    };

    setSubmitting(true);
    try {
      await vehicleIssueService.createVehicleIssue(payload);
      showSuccess(`Issued ${checked.qty} × ${checked.item.name} to vehicle on ${new Date(issueDateIso).toLocaleString()}`);
      setShowIssueDialog(false); resetForms(); await reloadAfterChange();
    } catch (err) { console.error('Error issuing items:', err); setError(getErrorMessage(err, 'Failed to issue items to vehicle')); }
    finally { setSubmitting(false); }
  };

  const handleSubmitDriverIssue = async () => {
    setError(null);
    const checked = validateIssue(selectedItem?.id, driverIssueFormData.quantity, 'driver');
    if (!checked) return;
    if (!driverIssueFormData.driverId) { setError('Please select a driver'); return; }
    if (!driverIssueFormData.issueDate) { setError('Please select the date and time this issue was actually made'); return; }
    const issueDateIso = fromDateTimeLocalValue(driverIssueFormData.issueDate);
    if (!issueDateIso) { setError('Invalid issue date'); return; }

    const payload = {
      driverId: Number(driverIssueFormData.driverId),
      issueDate: issueDateIso,
      items: [{ itemId: Number(checked.item.id), quantity: checked.qty, condition: driverIssueFormData.condition, notes: driverIssueFormData.notes || '' }],
    };

    setSubmitting(true);
    try {
      await vehicleIssueService.createDriverIssue(payload);
      showSuccess(`Issued ${checked.qty} × ${checked.item.name} to driver on ${new Date(issueDateIso).toLocaleString()}`);
      setShowDriverIssueDialog(false); resetForms(); await reloadAfterChange();
    } catch (err) { console.error('Error issuing items to driver:', err); setError(getErrorMessage(err, 'Failed to issue items to driver')); }
    finally { setSubmitting(false); }
  };

  const selectReturnLine = (issue, type, line) => {
    const inventoryItem = findItem(line?.itemId);
    setSelectedIssue({ ...issue, _type: type });
    setSelectedItem(line ? { ...line, id: line.itemId, itemId: line.itemId, name: inventoryItem?.name || line.itemName || 'Unknown Item', outstanding: outstandingQty(line) } : null);
    setReturnFormData({ itemId: line?.itemId || '', quantity: line ? Math.max(1, outstandingQty(line)) : 1, condition: 'DAMAGED', notes: '' });
  };

  const handleReturnItems = (issue, type = issueTypeOf(issue)) => {
    setError(null); setReturnIssueOptions([]);
    const lines = issue?.items || [];
    const line = lines.find((l) => outstandingQty(l) > 0) || lines[0];
    if (!line) { setError('No items found in this issue'); return; }
    selectReturnLine(issue, type, line); setShowReturnDialog(true);
  };

  const handleReceiveItem = async (item) => {
    setError(null);
    const [vIssues, dIssues] = await Promise.all([loadVehicleIssues(), loadDriverIssues()]);
    const options = [
      ...vIssues.map((issue) => ({ issue, type: 'vehicle' })),
      ...dIssues.map((issue) => ({ issue, type: 'driver' })),
    ].map(({ issue, type }) => ({ issue, type, line: (issue.items || []).find((l) => Number(l.itemId) === Number(item.id) && outstandingQty(l) > 0) }))
     .filter((o) => o.line && o.issue.status !== 'RETURNED');
    if (options.length === 0) { setError(`No open vehicle or driver issue contains "${item.name}", so there is nothing to return.`); return; }
    setReturnIssueOptions(options); selectReturnLine(options[0].issue, options[0].type, options[0].line); setShowReturnDialog(true);
  };

  const handleSubmitReturn = async () => {
    setError(null);
    const itemId = Number(returnFormData.itemId || selectedItem?.itemId || selectedItem?.id);
    if (!selectedIssue) { setError('No issue selected for this return'); return; }
    if (!itemId) { setError('No item selected for return'); return; }
    const line = (selectedIssue.items || []).find((l) => Number(l.itemId) === itemId);
    if (!line) { const valid = (selectedIssue.items || []).map((l) => l.itemId).join(', '); setError(`Item ${itemId} is not part of issue ${selectedIssue.issueNumber || selectedIssue.id}. Valid items: ${valid}`); return; }
    const qty = parseWholeQuantity(returnFormData.quantity);
    if (qty === null) { setError('Quantity must be a whole number greater than 0'); return; }
    const outstanding = outstandingQty(line);
    if (qty > outstanding) { setError(`Only ${outstanding} still out on this issue`); return; }

    const returnPayload = [{ itemId, quantity: qty, condition: returnFormData.condition || 'DAMAGED', notes: returnFormData.notes || '' }];

    setSubmitting(true);
    try {
      if ((selectedIssue._type || issueTypeOf(selectedIssue)) === 'driver') await vehicleIssueService.returnDriverItems(selectedIssue.id, returnPayload);
      else await vehicleIssueService.returnItems(selectedIssue.id, returnPayload);
      showSuccess('Items returned successfully'); setShowReturnDialog(false); resetForms(); await reloadAfterChange();
    } catch (err) { console.error('Error returning items:', err); setError(getErrorMessage(err, 'Failed to return items')); }
    finally { setSubmitting(false); }
  };

  const handleSwap = (issue, type = issueTypeOf(issue)) => {
    setError(null);
    const lines = issue?.items || [];
    const firstItem = lines.find((l) => outstandingQty(l) > 0) || lines[0];
    if (!firstItem) { setError('No items found in this issue'); return; }
    setSelectedIssue({ ...issue, _type: type }); setSelectedIssueItem(firstItem);
    setSwapFormData({ oldItemId: firstItem.itemId || '', newItemId: '', newQuantity: 1, returnQuantity: Math.max(1, outstandingQty(firstItem)), damagedCondition: 'DAMAGED', damageNotes: '', issueType: type });
    setShowSwapDialog(true);
  };

  const handleSubmitSwap = async () => {
    setError(null);
    const newItem = findItem(swapFormData.newItemId);
    if (!newItem) { setError('Please select a replacement item'); return; }
    const newQty = parseWholeQuantity(swapFormData.newQuantity);
    const returnQty = parseWholeQuantity(swapFormData.returnQuantity);
    if (newQty === null || returnQty === null) { setError('Quantities must be whole numbers greater than 0'); return; }
    if (newQty > newItem.quantity) { setError(`Only ${newItem.quantity} ${newItem.unitOfMeasure || 'EA'} of ${newItem.name} available`); return; }
    const outstanding = outstandingQty(selectedIssueItem);
    if (returnQty > outstanding) { setError(`Only ${outstanding} of the old item still out on this issue`); return; }

    const swapPayload = {
      oldItemId: Number(swapFormData.oldItemId), newItemId: Number(newItem.id),
      newQuantity: newQty, returnQuantity: returnQty,
      damagedCondition: swapFormData.damagedCondition,
      damageNotes: swapFormData.damageNotes,
      condition: swapFormData.damagedCondition,
    };

    setSubmitting(true);
    try {
      if (swapFormData.issueType === 'driver') await vehicleIssueService.swapDriverItem(selectedIssue.id, swapPayload);
      else await vehicleIssueService.swapItem(selectedIssue.id, swapPayload);
      showSuccess('Item swapped successfully!'); setShowSwapDialog(false); resetForms(); await reloadAfterChange();
    } catch (err) { console.error('Error swapping item:', err); setError(getErrorMessage(err, 'Failed to swap item')); }
    finally { setSubmitting(false); }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setError(null);

    const payload = {
      sku: formData.sku?.trim() || null, name: formData.name.trim(), category: formData.category,
      unitOfMeasure: formData.unitOfMeasure || 'EA', isConsumable: formData.isConsumable !== false,
      reorderLevel: parseInt(formData.reorderLevel, 10) || 0, locationId: parseInt(formData.locationId, 10),
      quantity: parseInt(formData.quantity, 10) || 0, unitCost: parseFloat(formData.unitCost) || 0,
      minLevel: parseInt(formData.minLevel, 10) || 0, isActive: formData.isActive !== false,
      notes: formData.notes || '', isDriverIssuable: formData.isDriverIssuable !== false,
      isVehicleIssuable: formData.isVehicleIssuable !== false, returnByDate: formData.returnByDate || null,
      isHeld: formData.isHeld || false, holdCode: formData.holdCode || null,
      holdDate: formData.holdDate || null, holdReason: formData.holdReason || null, heldBy: formData.heldBy || null,
    };

    setSubmitting(true);
    try {
      if (selectedItem) { await inventoryService.updateInventoryItem(selectedItem.id, payload); showSuccess('Item updated successfully'); }
      else { await inventoryService.createInventoryItem(payload); showSuccess('Item created successfully'); }
      setShowAddDialog(false); resetForms(); await reloadAfterChange();
    } catch (err) { console.error('Error saving inventory item:', err); setError(getErrorMessage(err, 'Failed to save inventory item')); }
    finally { setSubmitting(false); }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Name is required';
    if (!formData.category) errors.category = 'Category is required';
    if (!formData.locationId) errors.locationId = 'Location is required';
    if (Number(formData.minLevel) < 0) errors.minLevel = 'Min level cannot be negative';
    if (Number(formData.quantity) < 0) errors.quantity = 'Quantity cannot be negative';
    if (Number(formData.unitCost) < 0) errors.unitCost = 'Unit cost cannot be negative';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: '' }));
  };

  const resetForms = () => {
    setIssueFormData({ itemId: '', vehicleId: '', driverId: '', tripId: '', quantity: 1, condition: 'NEW', notes: '', issueDate: toDateTimeLocalValue() });
    setDriverIssueFormData({ driverId: '', quantity: 1, condition: 'NEW', notes: '', issueDate: toDateTimeLocalValue() });
    setReturnFormData({ itemId: '', quantity: 1, condition: 'DAMAGED', notes: '' });
    setSwapFormData({ oldItemId: '', newItemId: '', newQuantity: 1, returnQuantity: 1, damagedCondition: 'DAMAGED', damageNotes: '', issueType: 'vehicle' });
    setReturnIssueOptions([]); setSelectedItem(null); setSelectedIssue(null); setSelectedIssueItem(null);
  };

  const showSuccess = (message) => { setSuccess(message); setTimeout(() => setSuccess(null), 3000); };
  const getUniqueCategories = () => Array.from(new Set(inventoryItems.map(item => item.category))).filter(Boolean);

  const filteredItems = inventoryItems.filter(item => {
    const searchMatch =
      item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku?.toLowerCase().includes(searchTerm.toLowerCase());
    const categoryMatch = categoryFilter === 'all' || item.category === categoryFilter;

    let statusMatch = true;
    if (statusFilter !== 'all') {
      const quantity = item.quantity || 0; const minLevel = item.minLevel || 0;
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

  // ---------- EXPORTS ----------
  const itemStatusLabel = (r) => { const q = Number(r.quantity) || 0; const m = Number(r.minLevel) || 0; return q <= 0 ? 'Out of Stock' : (q <= m ? 'Low Stock' : 'In Stock'); };
  const vehicleLabel = (id) => { const v = vehicles.find((x) => x.id === id); return !v ? 'Unknown Vehicle' : (v.registrationNumber || v.regNumber || `${v.make || ''} ${v.model || ''}`.trim() || `Vehicle #${v.id}`); };
  const driverLabel = (id) => { const d = drivers.find((x) => x.id === id); return !d ? 'Unknown Driver' : (d.fullName || `${d.firstName || ''} ${d.lastName || ''}`.trim() || `Driver #${d.id}`); };
  const itemNameOf = (line) => line?.itemName || inventoryItems.find((i) => i.id === line?.itemId)?.name || 'Unknown Item';

  const buildItemColumns = () => [
    { header: 'SKU', value: (r) => r.sku || '', width: 14 },
    { header: 'Name', value: (r) => r.name, width: 30 },
    { header: 'Category', value: (r) => r.category || '', width: 16 },
    { header: 'Quantity', value: (r) => r.quantity, type: 'number', width: 10 },
    { header: 'Unit', value: (r) => r.unitOfMeasure || 'EA', width: 8 },
    { header: 'Unit Cost (R)', value: (r) => Number(r.unitCost) || 0, type: 'number', decimals: 2, width: 14 },
    { header: 'Min Level', value: (r) => r.minLevel, type: 'number', width: 10 },
    { header: 'Reorder Level', value: (r) => r.reorderLevel || 0, type: 'number', width: 12 },
    { header: 'Location', value: (r) => locations.find((l) => l.id === r.locationId)?.name || 'N/A', width: 18 },
    { header: 'Status', value: itemStatusLabel, width: 12 },
    { header: 'Consumable', value: (r) => (r.isConsumable !== false ? 'Yes' : 'No'), width: 12 },
    { header: 'Driver Issuable', value: (r) => (r.isDriverIssuable !== false ? 'Yes' : 'No'), width: 14 },
    { header: 'Vehicle Issuable', value: (r) => (r.isVehicleIssuable !== false ? 'Yes' : 'No'), width: 14 },
    { header: 'On Hold', value: (r) => (r.isHeld ? 'Yes' : 'No'), width: 10 },
    { header: 'Active', value: (r) => (r.isActive !== false ? 'Yes' : 'No'), width: 8 },
    { header: 'Notes', value: (r) => r.notes || '', width: 30 },
  ];
  const buildVehicleIssueColumns = () => [
    { header: 'Issue #', value: (r) => r.issueNumber || `Issue #${r.id}`, width: 14 },
    { header: 'Vehicle', value: (r) => vehicleLabel(r.vehicleId), width: 20 },
    { header: 'Driver', value: (r) => driverLabel(r.driverId), width: 20 },
    { header: 'Item', value: (r) => itemNameOf(r.items?.[0]), width: 25 },
    { header: 'Quantity', value: (r) => r.items?.[0]?.quantityIssued ?? r.items?.[0]?.quantity ?? 0, type: 'number', width: 10 },
    { header: 'Condition', value: (r) => r.items?.[0]?.condition || '', width: 12 },
    { header: 'Issue Date', value: (r) => { const d = resolveIssueDate(r); return d ? new Date(d).toLocaleString() : ''; }, width: 20 },
    { header: 'Status', value: (r) => r.status || 'ISSUED', width: 18 },
  ];
  const buildDriverIssueColumns = () => [
    { header: 'Issue #', value: (r) => r.issueNumber || `Issue #${r.id}`, width: 14 },
    { header: 'Driver', value: (r) => driverLabel(r.driverId), width: 20 },
    { header: 'Item', value: (r) => itemNameOf(r.items?.[0]), width: 25 },
    { header: 'Quantity', value: (r) => r.items?.[0]?.quantityIssued ?? r.items?.[0]?.quantity ?? 0, type: 'number', width: 10 },
    { header: 'Condition', value: (r) => r.items?.[0]?.condition || '', width: 12 },
    { header: 'Issue Date', value: (r) => { const d = resolveIssueDate(r); return d ? new Date(d).toLocaleString() : ''; }, width: 20 },
    { header: 'Status', value: (r) => r.status || 'ISSUED', width: 18 },
  ];

  const handleExportItemsCsv = () => { if (!filteredItems.length) { setError('No items to export'); return; } exportCsv('inventory-items', buildItemColumns(), filteredItems); showSuccess(`Exported ${filteredItems.length} item(s) as CSV`); };
  const handleExportItemsXlsx = () => { if (!filteredItems.length) { setError('No items to export'); return; } exportXlsx('inventory-items', buildItemColumns(), filteredItems, 'Items'); showSuccess(`Exported ${filteredItems.length} item(s) as Excel`); };
  const handleExportItemsPdf = () => { if (!filteredItems.length) { setError('No items to export'); return; } const win = window.open('', '_blank'); if (!win) { setError('Please allow popups to export PDF'); return; } printToPdf(win, 'Inventory Items', buildItemColumns(), filteredItems, `Generated ${new Date().toLocaleString()} • ${filteredItems.length} row(s)`); };
  const handleExportVehicleIssuesCsv = () => { if (!vehicleIssues.length) { setError('No vehicle issues to export'); return; } exportCsv('vehicle-issues', buildVehicleIssueColumns(), vehicleIssues); showSuccess(`Exported ${vehicleIssues.length} vehicle issue(s) as CSV`); };
  const handleExportVehicleIssuesXlsx = () => { if (!vehicleIssues.length) { setError('No vehicle issues to export'); return; } exportXlsx('vehicle-issues', buildVehicleIssueColumns(), vehicleIssues, 'Vehicle Issues'); showSuccess(`Exported ${vehicleIssues.length} vehicle issue(s) as Excel`); };
  const handleExportVehicleIssuesPdf = () => { if (!vehicleIssues.length) { setError('No vehicle issues to export'); return; } const win = window.open('', '_blank'); if (!win) { setError('Please allow popups to export PDF'); return; } printToPdf(win, 'Vehicle Issues', buildVehicleIssueColumns(), vehicleIssues, `Generated ${new Date().toLocaleString()} • ${vehicleIssues.length} row(s)`); };
  const handleExportDriverIssuesCsv = () => { if (!driverIssues.length) { setError('No driver issues to export'); return; } exportCsv('driver-issues', buildDriverIssueColumns(), driverIssues); showSuccess(`Exported ${driverIssues.length} driver issue(s) as CSV`); };
  const handleExportDriverIssuesXlsx = () => { if (!driverIssues.length) { setError('No driver issues to export'); return; } exportXlsx('driver-issues', buildDriverIssueColumns(), driverIssues, 'Driver Issues'); showSuccess(`Exported ${driverIssues.length} driver issue(s) as Excel`); };
  const handleExportDriverIssuesPdf = () => { if (!driverIssues.length) { setError('No driver issues to export'); return; } const win = window.open('', '_blank'); if (!win) { setError('Please allow popups to export PDF'); return; } printToPdf(win, 'Driver Issues', buildDriverIssueColumns(), driverIssues, `Generated ${new Date().toLocaleString()} • ${driverIssues.length} row(s)`); };

  const anyDialogOpen = showAddDialog || showIssueDialog || showDriverIssueDialog || showReturnDialog || showSwapDialog || showMovementDialog;

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress size={40} />
        <Typography sx={{ ml: 2, fontSize: '0.9rem' }}>Loading inventory...</Typography>
      </Box>
    );
  }

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <Box sx={{ bgcolor: '#F7F7FC', minHeight: '100vh', height: '100%', display: 'flex', flexDirection: 'column', p: { xs: 1.5, sm: 2, md: 2.5, lg: 3 }, width: '100%', overflowX: 'hidden' }}>
      <Box sx={{ maxWidth: '1600px', margin: '0 auto', flex: 1, width: '100%', display: 'flex', flexDirection: 'column' }}>

        {/* ENVIRONMENT BANNER */}
        <Alert
          severity={inventoryItems.length === 0 ? 'warning' : 'success'}
          icon={false}
          sx={{ mb: 1.5, borderRadius: '10px', fontSize: '0.72rem', py: 0.5, alignItems: 'center' }}
        >
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={{ xs: 0.5, md: 2 }} flexWrap="wrap" useFlexGap alignItems={{ xs: 'flex-start', md: 'center' }}>
            <Typography variant="caption" sx={{ fontSize: '0.7rem', fontWeight: 600 }}>
              🌐 <code>{typeof window !== 'undefined' ? window.location.hostname : 'unknown'}</code>
            </Typography>
            <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
              API: <code>{getApiBase()}</code>
            </Typography>
            <Typography variant="caption" sx={{ fontSize: '0.7rem', fontWeight: 600 }}>
              Items: <strong>{inventoryItems.length}</strong>
              {rawItemsResponse && (
                <span style={{ color: '#6B7280', fontWeight: 400, marginLeft: 4 }}>
                  (server totalElements={rawItemsResponse?.data?.totalElements ?? rawItemsResponse?.totalElements ?? '?'})
                </span>
              )}
            </Typography>
            <Button
              size="small"
              variant="outlined"
              color={inventoryItems.length === 0 ? 'warning' : 'primary'}
              startIcon={<BugReportIcon sx={{ fontSize: '0.9rem' }} />}
              onClick={runDiagnostics}
              sx={{ borderRadius: '8px', fontSize: '0.68rem', textTransform: 'none', py: 0.25, px: 1 }}
            >
              Run Diagnostics
            </Button>
            {endpointDiagnostics.length > 0 && (
              <Button
                size="small"
                variant="text"
                endIcon={diagOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                onClick={() => setDiagOpen(!diagOpen)}
                sx={{ fontSize: '0.68rem', textTransform: 'none', py: 0.25, px: 1 }}
              >
                {diagOpen ? 'Hide' : 'Show'} endpoint results
              </Button>
            )}
          </Stack>
        </Alert>

        {/* Endpoint diagnostics inline */}
        <Collapse in={diagOpen && endpointDiagnostics.length > 0}>
          <Paper sx={{ mb: 2, p: 1.5, borderRadius: '10px', border: '1px solid #FEF3C7', bgcolor: '#FFFBEB' }}>
            <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.7rem', display: 'block', mb: 1 }}>
              Endpoint fallback results:
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontSize: '0.62rem', fontWeight: 600 }}>Endpoint</TableCell>
                  <TableCell sx={{ fontSize: '0.62rem', fontWeight: 600 }} align="right">Rows</TableCell>
                  <TableCell sx={{ fontSize: '0.62rem', fontWeight: 600 }} align="right">totalElements</TableCell>
                  <TableCell sx={{ fontSize: '0.62rem', fontWeight: 600 }} align="right">size</TableCell>
                  <TableCell sx={{ fontSize: '0.62rem', fontWeight: 600 }}>Error</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {endpointDiagnostics.map((d, i) => (
                  <TableRow key={i}>
                    <TableCell sx={{ fontSize: '0.65rem', py: 0.4 }}>{d.variant}</TableCell>
                    <TableCell sx={{ fontSize: '0.65rem', py: 0.4 }} align="right">{d.rowCount ?? '-'}</TableCell>
                    <TableCell sx={{ fontSize: '0.65rem', py: 0.4 }} align="right">{d.totalElements ?? '-'}</TableCell>
                    <TableCell sx={{ fontSize: '0.65rem', py: 0.4 }} align="right">{d.size ?? '-'}</TableCell>
                    <TableCell sx={{ fontSize: '0.65rem', py: 0.4, color: 'error.main' }}>{d.error || ''}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        </Collapse>

        {/* Header */}
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} mb={{ xs: 2, sm: 2.5, md: 3 }} spacing={{ xs: 1, sm: 0 }}>
          <Box>
            <Typography variant="h5" fontWeight="700" sx={{ fontSize: { xs: '1.1rem', sm: '1.3rem', md: '1.4rem', lg: '1.5rem' } }}>Inventory Management</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.85rem' } }}>Manage spare parts, lubricants, and supplies</Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadData} size="small" sx={{ borderRadius: '10px', fontSize: '0.75rem', textTransform: 'none', py: 0.5, px: 1.5 }}>Refresh</Button>
            <Button variant="contained" startIcon={<Add />} onClick={handleAddNew} size="small" sx={{ borderRadius: '10px', fontSize: '0.75rem', textTransform: 'none', py: 0.5, px: 1.5, background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)' }}>Add Item</Button>
          </Stack>
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: '12px', fontSize: '0.8rem' }} onClose={() => setError(null)}>{error}</Alert>}
        <Snackbar open={!!error && anyDialogOpen} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
          <Alert severity="error" variant="filled" onClose={() => setError(null)} sx={{ fontSize: '0.8rem', maxWidth: 640 }}>{error}</Alert>
        </Snackbar>
        {success && <Alert severity="success" sx={{ mb: 2, borderRadius: '12px', fontSize: '0.8rem' }} onClose={() => setSuccess(null)}>{success}</Alert>}

        <Paper elevation={0} sx={{ mb: { xs: 2, sm: 2.5, md: 3 }, borderRadius: { xs: '12px', sm: '16px' }, border: '1px solid #ECECEC', bgcolor: '#FFFFFF', width: '100%', overflow: 'hidden' }}>
          <Tabs value={activeTab} onChange={handleTabChange} sx={{ minHeight: 36 }}>
            <Tab label="Items" icon={<InventoryIcon sx={{ fontSize: '0.9rem' }} />} iconPosition="start" sx={{ fontSize: '0.75rem', minHeight: 36, textTransform: 'none' }} />
            <Tab label={`Vehicle Issues (${vehicleIssues.length})`} icon={<DirectionsCar sx={{ fontSize: '0.9rem' }} />} iconPosition="start" sx={{ fontSize: '0.75rem', minHeight: 36, textTransform: 'none' }} />
            <Tab label={`Driver Issues (${driverIssues.length})`} icon={<Person sx={{ fontSize: '0.9rem' }} />} iconPosition="start" sx={{ fontSize: '0.75rem', minHeight: 36, textTransform: 'none' }} />
            <Tab label="Stock Movements" icon={<SwapHoriz sx={{ fontSize: '0.9rem' }} />} iconPosition="start" sx={{ fontSize: '0.75rem', minHeight: 36, textTransform: 'none' }} />
            <Tab label="Stock on Hand" icon={<LocationOn sx={{ fontSize: '0.9rem' }} />} iconPosition="start" sx={{ fontSize: '0.75rem', minHeight: 36, textTransform: 'none' }} />
          </Tabs>
        </Paper>

        {/* TAB 0: ITEMS */}
        <TabPanel value={activeTab} index={0}>
          <Paper elevation={0} sx={{ p: { xs: 1.5, sm: 2, md: 2.5 }, mb: 3, borderRadius: { xs: '12px', sm: '16px' }, border: '1px solid #ECECEC', bgcolor: '#FFFFFF', width: '100%' }}>
            <Grid container spacing={1.5} alignItems="center">
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField fullWidth placeholder="Search by name, SKU, or category..." size="small" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                  sx={{ '& .MuiInputBase-root': { fontSize: '0.75rem', borderRadius: '10px' } }}
                  InputProps={{ startAdornment: (<InputAdornment position="start"><Search sx={{ fontSize: '0.9rem' }} /></InputAdornment>) }} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                <FormControl fullWidth size="small"><InputLabel sx={{ fontSize: '0.75rem' }}>Category</InputLabel>
                  <Select value={categoryFilter} label="Category" onChange={(e) => setCategoryFilter(e.target.value)} sx={{ fontSize: '0.75rem', borderRadius: '10px' }}>
                    <MenuItem value="all">All Categories</MenuItem>
                    {getUniqueCategories().map(cat => <MenuItem key={cat} value={cat}>{cat}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                <FormControl fullWidth size="small"><InputLabel sx={{ fontSize: '0.75rem' }}>Status</InputLabel>
                  <Select value={statusFilter} label="Status" onChange={(e) => setStatusFilter(e.target.value)} sx={{ fontSize: '0.75rem', borderRadius: '10px' }}>
                    <MenuItem value="all">All Status</MenuItem>
                    <MenuItem value="In Stock">In Stock</MenuItem>
                    <MenuItem value="Low Stock">Low Stock</MenuItem>
                    <MenuItem value="Out of Stock">Out of Stock</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                <FormControl fullWidth size="small"><InputLabel sx={{ fontSize: '0.75rem' }}>Issueable To</InputLabel>
                  <Select value={issueableFilter} label="Issueable To" onChange={(e) => setIssueableFilter(e.target.value)} sx={{ fontSize: '0.75rem', borderRadius: '10px' }}>
                    <MenuItem value="all">All</MenuItem>
                    <MenuItem value="both">Both</MenuItem>
                    <MenuItem value="driver">Driver Only</MenuItem>
                    <MenuItem value="vehicle">Vehicle Only</MenuItem>
                    <MenuItem value="neither">Neither</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <Stack direction="row" spacing={0.75} alignItems="center">
                  <Tooltip title="Refresh"><IconButton size="small" onClick={loadData} sx={{ p: 0.5 }}><RefreshIcon sx={{ fontSize: '0.9rem' }} /></IconButton></Tooltip>
                  <ExportMenu disabled={filteredItems.length === 0} onCsv={handleExportItemsCsv} onXlsx={handleExportItemsXlsx} onPdf={handleExportItemsPdf} />
                  <Button variant="contained" startIcon={<Add />} onClick={handleAddNew} size="small" sx={{ fontSize: '0.75rem', py: 0.5, flex: 1, borderRadius: '10px', textTransform: 'none', background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)' }}>Add Item</Button>
                </Stack>
              </Grid>
            </Grid>
          </Paper>

          <Grid container spacing={{ xs: 1.5, sm: 2, md: 2.5 }} sx={{ mb: 3, width: '100%', margin: 0 }}>
            <Grid size={{ xs: 6, sm: 3 }} sx={{ display: 'flex' }}><StatCard title="Total Items" value={inventoryItems.length} icon={InventoryIcon} color="primary" /></Grid>
            <Grid size={{ xs: 6, sm: 3 }} sx={{ display: 'flex' }}><StatCard title="Low Stock" value={inventoryItems.filter(i => i.quantity > 0 && i.quantity <= i.minLevel).length} icon={WarningIcon} color="warning" /></Grid>
            <Grid size={{ xs: 6, sm: 3 }} sx={{ display: 'flex' }}><StatCard title="Out of Stock" value={inventoryItems.filter(i => i.quantity <= 0).length} icon={CancelIcon} color="error" /></Grid>
            <Grid size={{ xs: 6, sm: 3 }} sx={{ display: 'flex' }}><StatCard title="Locations" value={locations.length} icon={LocationOn} color="info" /></Grid>
          </Grid>

          <Paper elevation={0} sx={{ borderRadius: { xs: '12px', sm: '16px' }, border: '1px solid #ECECEC', bgcolor: '#FFFFFF', width: '100%', overflow: 'hidden' }}>
            <TableContainer>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#F9FAFB' }}>
                  <TableRow>
                    <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600, color: '#6B7280', py: 1.5 }}>SKU</TableCell>
                    <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600, color: '#6B7280', py: 1.5 }}>Item</TableCell>
                    <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600, color: '#6B7280', py: 1.5 }}>Category</TableCell>
                    <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600, color: '#6B7280', py: 1.5 }}>Qty</TableCell>
                    <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600, color: '#6B7280', py: 1.5 }}>Flags</TableCell>
                    <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600, color: '#6B7280', py: 1.5 }}>Min Level</TableCell>
                    <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600, color: '#6B7280', py: 1.5 }}>Location</TableCell>
                    <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600, color: '#6B7280', py: 1.5 }}>Status</TableCell>
                    <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600, color: '#6B7280', py: 1.5 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                        <Box sx={{ textAlign: 'center' }}>
                          <InventoryIcon sx={{ fontSize: 48, color: '#D1D5DB', mb: 2 }} />
                          <Typography variant="body1" color="text.secondary">
                            {searchTerm || categoryFilter !== 'all' || statusFilter !== 'all' || issueableFilter !== 'all'
                              ? 'No items match your filters'
                              : 'No inventory items found'}
                          </Typography>
                          {!searchTerm && categoryFilter === 'all' && statusFilter === 'all' && issueableFilter === 'all' && (
                            <Box sx={{ mt: 2 }}>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontSize: '0.7rem', maxWidth: 520, mx: 'auto' }}>
                                The backend returned 0 items. This is a <strong>backend data state</strong> — the Dev database has no inventory rows. Click below to see what every endpoint actually returned.
                              </Typography>
                              <Button variant="contained" size="small" startIcon={<BugReportIcon />} onClick={runDiagnostics}
                                sx={{ borderRadius: '8px', textTransform: 'none', fontSize: '0.72rem', background: 'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)' }}>
                                Run Diagnostics
                              </Button>
                            </Box>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredItems.map((item) => (
                      <InventoryItemRow key={item.id} item={item} locations={locations}
                        onView={handleView} onEdit={handleEdit} onDelete={handleDelete}
                        onIssue={handleIssueItem} onReceive={handleReceiveItem}
                        onIssueToDriver={handleIssueToDriver} onMovement={handleMovement} />
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </TabPanel>

        {/* TAB 1: VEHICLE ISSUES */}
        <TabPanel value={activeTab} index={1}>
          <Paper elevation={0} sx={{ p: { xs: 1.5, sm: 2, md: 2.5 }, mb: 3, borderRadius: { xs: '12px', sm: '16px' }, border: '1px solid #ECECEC', bgcolor: '#FFFFFF', width: '100%' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="subtitle2" sx={{ fontSize: '0.85rem', fontWeight: 600 }}>Vehicle Issues<Chip label={`${vehicleIssues.length} issues`} size="small" sx={{ ml: 1, height: 18, fontSize: '0.55rem' }} /></Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <ExportMenu disabled={vehicleIssues.length === 0} onCsv={handleExportVehicleIssuesCsv} onXlsx={handleExportVehicleIssuesXlsx} onPdf={handleExportVehicleIssuesPdf} />
                <Button variant="contained" startIcon={<Add />} size="small" onClick={() => openVehicleIssueDialog()} sx={{ fontSize: '0.75rem', borderRadius: '10px', textTransform: 'none', background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)' }}>New Issue</Button>
              </Stack>
            </Stack>
          </Paper>
          <Paper elevation={0} sx={{ borderRadius: { xs: '12px', sm: '16px' }, border: '1px solid #ECECEC', bgcolor: '#FFFFFF', width: '100%', overflow: 'hidden' }}>
            {loadingIssues ? (
              <Box display="flex" justifyContent="center" py={4}><CircularProgress size={30} /></Box>
            ) : vehicleIssues.length === 0 ? (
              <Box py={4} textAlign="center">
                <DirectionsCar sx={{ fontSize: 48, color: '#D1D5DB', mb: 2 }} />
                <Typography color="text.secondary" sx={{ fontSize: '0.8rem' }}>No vehicle issues found</Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#F9FAFB' }}>
                    <TableRow>
                      <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600, color: '#6B7280', py: 1.5 }}>Issue #</TableCell>
                      <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600, color: '#6B7280', py: 1.5 }}>Vehicle</TableCell>
                      <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600, color: '#6B7280', py: 1.5 }}>Driver</TableCell>
                      <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600, color: '#6B7280', py: 1.5 }}>Item</TableCell>
                      <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600, color: '#6B7280', py: 1.5 }}>Date</TableCell>
                      <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600, color: '#6B7280', py: 1.5 }}>Status</TableCell>
                      <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600, color: '#6B7280', py: 1.5 }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {vehicleIssues.map((issue) => (
                      <VehicleIssueRow key={issue.id} issue={issue}
                        onView={handleViewIssue}
                        onReturn={(issue) => handleReturnItems(issue, 'vehicle')}
                        onSwap={(issue) => handleSwap(issue, 'vehicle')}
                        vehicles={vehicles} drivers={drivers} inventoryItems={inventoryItems} />
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </TabPanel>

        {/* TAB 2: DRIVER ISSUES */}
        <TabPanel value={activeTab} index={2}>
          <Paper elevation={0} sx={{ p: { xs: 1.5, sm: 2, md: 2.5 }, mb: 3, borderRadius: { xs: '12px', sm: '16px' }, border: '1px solid #ECECEC', bgcolor: '#FFFFFF', width: '100%' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="subtitle2" sx={{ fontSize: '0.85rem', fontWeight: 600 }}>Driver Issues<Chip label={`${driverIssues.length} issues`} size="small" sx={{ ml: 1, height: 18, fontSize: '0.55rem' }} /></Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <ExportMenu disabled={driverIssues.length === 0} onCsv={handleExportDriverIssuesCsv} onXlsx={handleExportDriverIssuesXlsx} onPdf={handleExportDriverIssuesPdf} />
                <Button variant="contained" startIcon={<Add />} size="small" onClick={() => openDriverIssueDialog()} sx={{ fontSize: '0.75rem', borderRadius: '10px', textTransform: 'none', background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)' }}>New Driver Issue</Button>
              </Stack>
            </Stack>
          </Paper>
          <Paper elevation={0} sx={{ borderRadius: { xs: '12px', sm: '16px' }, border: '1px solid #ECECEC', bgcolor: '#FFFFFF', width: '100%', overflow: 'hidden' }}>
            {loadingIssues ? (
              <Box display="flex" justifyContent="center" py={4}><CircularProgress size={30} /></Box>
            ) : driverIssues.length === 0 ? (
              <Box py={4} textAlign="center">
                <Person sx={{ fontSize: 48, color: '#D1D5DB', mb: 2 }} />
                <Typography color="text.secondary" sx={{ fontSize: '0.8rem' }}>No driver issues found</Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#F9FAFB' }}>
                    <TableRow>
                      <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600, color: '#6B7280', py: 1.5 }}>Issue #</TableCell>
                      <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600, color: '#6B7280', py: 1.5 }}>Driver</TableCell>
                      <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600, color: '#6B7280', py: 1.5 }}>Item</TableCell>
                      <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600, color: '#6B7280', py: 1.5 }}>Date</TableCell>
                      <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600, color: '#6B7280', py: 1.5 }}>Status</TableCell>
                      <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600, color: '#6B7280', py: 1.5 }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {driverIssues.map((issue) => (
                      <DriverIssueRow key={issue.id} issue={issue}
                        onView={handleViewIssue}
                        onReturn={(issue) => handleReturnItems(issue, 'driver')}
                        onSwap={(issue) => handleSwap(issue, 'driver')}
                        drivers={drivers} inventoryItems={inventoryItems} />
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </TabPanel>

        {/* TAB 3: STOCK MOVEMENTS — wrapped in SafeSection + has its own diagnostics */}
        <TabPanel value={activeTab} index={3}>
          <Paper elevation={0} sx={{ p: 1.5, mb: 2, borderRadius: '10px', border: '1px solid #ECECEC', bgcolor: '#FFFFFF' }}>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
              <Typography variant="caption" sx={{ fontSize: '0.72rem', fontWeight: 600 }}>Stock Movements</Typography>
              <Button size="small" variant="outlined" startIcon={<BugReportIcon />} onClick={runMovementDiagnostics}
                sx={{ borderRadius: '8px', fontSize: '0.68rem', textTransform: 'none', py: 0.25, px: 1 }}>
                Diagnose Movements
              </Button>
              <Button size="small" variant="text" endIcon={movementDiagOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />} onClick={() => setMovementDiagOpen(!movementDiagOpen)}
                sx={{ fontSize: '0.68rem', textTransform: 'none' }}>
                {movementDiagOpen ? 'Hide' : 'Show'} diagnostics
              </Button>
            </Stack>
            <Collapse in={movementDiagOpen}>
              <Box sx={{ mt: 1.5 }}>
                {movementDiagRunning && <LinearProgress sx={{ my: 1 }} />}
                {movementDiag && (
                  <Box>
                    {movementDiag.error ? (
                      <Alert severity="error" sx={{ fontSize: '0.72rem' }}>
                        {movementDiag.error}
                        <br />
                        <small>Raw: {previewOf(movementDiag.raw)}</small>
                      </Alert>
                    ) : (
                      <>
                        <Alert severity={movementDiag.rowCount > 0 ? 'success' : 'warning'} sx={{ fontSize: '0.72rem', mb: 1 }}>
                          <strong>{movementDiag.rowCount} movement(s)</strong> extracted from the API.
                          {movementDiag.rowCount === 0 && ' The backend returned an empty page — MovementHistory will show nothing.'}
                        </Alert>
                        {movementDiag.extractedSample && movementDiag.extractedSample.length > 0 && (
                          <Table size="small">
                            <TableHead><TableRow>
                              <TableCell sx={{ fontSize: '0.62rem', fontWeight: 600 }}>ID</TableCell>
                              <TableCell sx={{ fontSize: '0.62rem', fontWeight: 600 }}>Item</TableCell>
                              <TableCell sx={{ fontSize: '0.62rem', fontWeight: 600 }}>Qty</TableCell>
                              <TableCell sx={{ fontSize: '0.62rem', fontWeight: 600 }}>Type</TableCell>
                              <TableCell sx={{ fontSize: '0.62rem', fontWeight: 600 }}>Date</TableCell>
                            </TableRow></TableHead>
                            <TableBody>
                              {movementDiag.extractedSample.map((m, i) => (
                                <TableRow key={m.id || i}>
                                  <TableCell sx={{ fontSize: '0.65rem', py: 0.4 }}>{m.id}</TableCell>
                                  <TableCell sx={{ fontSize: '0.65rem', py: 0.4 }}>{m.itemName || m.item?.name || m.itemId}</TableCell>
                                  <TableCell sx={{ fontSize: '0.65rem', py: 0.4 }}>{m.quantity}</TableCell>
                                  <TableCell sx={{ fontSize: '0.65rem', py: 0.4 }}>{m.movementType}</TableCell>
                                  <TableCell sx={{ fontSize: '0.65rem', py: 0.4 }}>{m.createdAt ? new Date(m.createdAt).toLocaleString() : '-'}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        )}
                        <Typography variant="caption" component="pre" sx={{ display: 'block', mt: 1, p: 1, bgcolor: '#F9FAFB', borderRadius: 1, fontSize: '0.62rem', maxHeight: 160, overflow: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                          {movementDiag.preview}
                        </Typography>
                      </>
                    )}
                  </Box>
                )}
              </Box>
            </Collapse>
          </Paper>
          <SafeSection label="Movement History">
            <MovementHistory />
          </SafeSection>
        </TabPanel>

        {/* TAB 4: STOCK ON HAND */}
        <TabPanel value={activeTab} index={4}>
          <SafeSection label="Stock on Hand">
            <StockOnHand />
          </SafeSection>
        </TabPanel>

        {/* ==================== DIALOGS ==================== */}

        {/* DIAGNOSTICS DIALOG */}
        <Dialog open={diagDialogOpen} onClose={() => setDiagDialogOpen(false)} maxWidth="lg" fullWidth>
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <BugReportIcon color="warning" />
              <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>Environment Diagnostics</Typography>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Alert severity="info" sx={{ mb: 2, fontSize: '0.78rem' }}>
              <strong>Frontend:</strong> <code>{typeof window !== 'undefined' ? window.location.hostname : 'unknown'}</code>
              <br />
              <strong>API base:</strong> <code>{getApiBase()}</code>
              <br />
              <small>Every variant below was called directly. Success = 200 OK. Check <code>rowCount</code> — if all 0, the backend has no data.</small>
            </Alert>
            {diagRunning && <LinearProgress sx={{ mb: 2 }} />}
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Endpoint</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Rows</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">totalElements</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">size</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Preview / Error</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {diagResults.map((r, i) => (
                  <TableRow key={i}>
                    <TableCell sx={{ fontSize: '0.72rem', py: 0.4 }}>{r.label}</TableCell>
                    <TableCell sx={{ fontSize: '0.72rem', py: 0.4 }}>
                      <Chip label={r.status} size="small" color={r.status === 'success' ? 'success' : 'error'} sx={{ height: 16, fontSize: '0.6rem' }} />
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.72rem', py: 0.4 }} align="right">{r.rowCount ?? '-'}</TableCell>
                    <TableCell sx={{ fontSize: '0.72rem', py: 0.4 }} align="right">{r.totalElements ?? '-'}</TableCell>
                    <TableCell sx={{ fontSize: '0.72rem', py: 0.4 }} align="right">{r.size ?? '-'}</TableCell>
                    <TableCell sx={{ fontSize: '0.62rem', py: 0.4, maxWidth: 280 }}>
                      <code style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontSize: '0.62rem' }}>
                        {r.error || r.preview || ''}
                      </code>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {!diagRunning && diagResults.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Alert severity="warning" sx={{ fontSize: '0.72rem' }}>
                  <strong>How to read this:</strong>
                  <ul style={{ margin: '6px 0 0 16px', padding: 0 }}>
                    <li>If any variant shows <strong>Rows &gt; 0</strong> → the page auto-uses that variant, and data should already be visible.</li>
                    <li>If <strong>all variants show Rows = 0</strong> but <code>/inventory/stats</code> shows non-zero → the backend has data but the paginated endpoint filters it out (backend bug, likely <code>sort=name</code> or an <code>@Where</code> filter).</li>
                    <li>If <strong>all variants + stats show 0</strong> → the Dev database genuinely has no inventory rows.</li>
                    <li>If any variant shows <strong>Status = error</strong> → that endpoint is broken on the backend (check the error column).</li>
                  </ul>
                </Alert>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDiagDialogOpen(false)}>Close</Button>
            <Button variant="contained" onClick={runDiagnostics} disabled={diagRunning}>
              {diagRunning ? 'Running…' : 'Run Again'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Add/Edit Item Dialog */}
        <Dialog open={showAddDialog} onClose={() => setShowAddDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle sx={{ py: 1.5, px: 2.5, borderBottom: 1, borderColor: 'divider', bgcolor: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>{selectedItem ? 'Edit Inventory Item' : 'Add New Inventory Item'}</Typography>
            <IconButton size="small" onClick={() => setShowAddDialog(false)}><CloseIcon /></IconButton>
          </DialogTitle>
          <DialogContent sx={{ p: 2.5 }}>
            <Stack spacing={2.5}>
              <Paper sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: '12px', border: '1px solid #ECECEC' }}>
                <Typography variant="subtitle2" sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#4F46E5', mb: 1.5 }}><QrCode sx={{ fontSize: '0.9rem', verticalAlign: 'middle', mr: 0.5 }} />Identification</Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}><TextField label="SKU" name="sku" value={formData.sku || ''} onChange={handleFormChange} fullWidth size="small" sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' }, '& .MuiInputBase-root': { fontSize: '0.8rem' } }} /></Grid>
                  <Grid size={{ xs: 12, sm: 6 }}><TextField label="Item Name *" name="name" value={formData.name} onChange={handleFormChange} fullWidth size="small" error={!!formErrors.name} helperText={formErrors.name} sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' }, '& .MuiInputBase-root': { fontSize: '0.8rem' } }} /></Grid>
                </Grid>
              </Paper>
              <Paper sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: '12px', border: '1px solid #ECECEC' }}>
                <Typography variant="subtitle2" sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#4F46E5', mb: 1.5 }}><CategoryIcon sx={{ fontSize: '0.9rem', verticalAlign: 'middle', mr: 0.5 }} />Classification</Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}><TextField label="Category *" name="category" value={formData.category} onChange={handleFormChange} fullWidth size="small" error={!!formErrors.category} helperText={formErrors.category} sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' }, '& .MuiInputBase-root': { fontSize: '0.8rem' } }} /></Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FormControl fullWidth size="small"><InputLabel sx={{ fontSize: '0.75rem' }}>Unit of Measure</InputLabel>
                      <Select name="unitOfMeasure" value={formData.unitOfMeasure} onChange={handleFormChange} label="Unit of Measure" sx={{ fontSize: '0.8rem' }}>
                        <MenuItem value="EA">Each (EA)</MenuItem>
                        <MenuItem value="LITER">Litre (L)</MenuItem>
                        <MenuItem value="KG">Kilogram (KG)</MenuItem>
                        <MenuItem value="M">Meter (M)</MenuItem>
                        <MenuItem value="BOX">Box (BOX)</MenuItem>
                        <MenuItem value="SET">Set (SET)</MenuItem>
                        <MenuItem value="PK">Pack (PK)</MenuItem>
                        <MenuItem value="ROLL">Roll (ROLL)</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </Paper>
              <Paper sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: '12px', border: '1px solid #ECECEC' }}>
                <Typography variant="subtitle2" sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#4F46E5', mb: 1.5 }}><InventoryIcon sx={{ fontSize: '0.9rem', verticalAlign: 'middle', mr: 0.5 }} />Stock Information</Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 4 }}><TextField label="Quantity *" name="quantity" type="number" value={formData.quantity} onChange={handleFormChange} fullWidth size="small" error={!!formErrors.quantity} helperText={formErrors.quantity} InputProps={{ inputProps: { min: 0 } }} sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' }, '& .MuiInputBase-root': { fontSize: '0.8rem' } }} /></Grid>
                  <Grid size={{ xs: 12, sm: 4 }}><TextField label="Min Level" name="minLevel" type="number" value={formData.minLevel} onChange={handleFormChange} fullWidth size="small" error={!!formErrors.minLevel} helperText={formErrors.minLevel} InputProps={{ inputProps: { min: 0 } }} sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' }, '& .MuiInputBase-root': { fontSize: '0.8rem' } }} /></Grid>
                  <Grid size={{ xs: 12, sm: 4 }}><TextField label="Unit Cost (R)" name="unitCost" type="number" value={formData.unitCost} onChange={handleFormChange} fullWidth size="small" error={!!formErrors.unitCost} helperText={formErrors.unitCost} InputProps={{ inputProps: { min: 0, step: 0.01 } }} sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' }, '& .MuiInputBase-root': { fontSize: '0.8rem' } }} /></Grid>
                  <Grid size={{ xs: 12, sm: 6 }}><TextField label="Reorder Level" name="reorderLevel" type="number" value={formData.reorderLevel} onChange={handleFormChange} fullWidth size="small" InputProps={{ inputProps: { min: 0 } }} sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' }, '& .MuiInputBase-root': { fontSize: '0.8rem' } }} /></Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FormControl fullWidth size="small" error={!!formErrors.locationId}><InputLabel sx={{ fontSize: '0.75rem' }}>Location *</InputLabel>
                      <Select name="locationId" value={formData.locationId} onChange={handleFormChange} label="Location *" sx={{ fontSize: '0.8rem' }}>
                        <MenuItem value="">Select Location</MenuItem>
                        {locations.map((loc) => <MenuItem key={loc.id} value={loc.id}>{loc.name}</MenuItem>)}
                      </Select>
                      {formErrors.locationId && <Typography variant="caption" color="error" sx={{ mt: 0.5, fontSize: '0.7rem' }}>{formErrors.locationId}</Typography>}
                    </FormControl>
                  </Grid>
                </Grid>
              </Paper>
              <Paper sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: '12px', border: '1px solid #ECECEC' }}>
                <Typography variant="subtitle2" sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#4F46E5', mb: 1.5 }}><Assignment sx={{ fontSize: '0.9rem', verticalAlign: 'middle', mr: 0.5 }} />Issue Settings</Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 4 }}><FormControlLabel control={<Checkbox name="isConsumable" checked={formData.isConsumable} onChange={handleFormChange} size="small" />} label="Is Consumable" sx={{ fontSize: '0.8rem' }} /></Grid>
                  <Grid size={{ xs: 12, sm: 4 }}><FormControlLabel control={<Checkbox name="isDriverIssuable" checked={formData.isDriverIssuable} onChange={handleFormChange} size="small" />} label="Driver Issuable" sx={{ fontSize: '0.8rem' }} /></Grid>
                  <Grid size={{ xs: 12, sm: 4 }}><FormControlLabel control={<Checkbox name="isVehicleIssuable" checked={formData.isVehicleIssuable} onChange={handleFormChange} size="small" />} label="Vehicle Issuable" sx={{ fontSize: '0.8rem' }} /></Grid>
                </Grid>
              </Paper>
              <Paper sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: '12px', border: '1px solid #ECECEC' }}>
                <Typography variant="subtitle2" sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#4F46E5', mb: 1.5 }}><LockIcon sx={{ fontSize: '0.9rem', verticalAlign: 'middle', mr: 0.5 }} />Status & Hold</Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}><FormControlLabel control={<Checkbox name="isActive" checked={formData.isActive} onChange={handleFormChange} size="small" />} label="Is Active" sx={{ fontSize: '0.8rem' }} /></Grid>
                  <Grid size={{ xs: 12, sm: 6 }}><FormControlLabel control={<Checkbox name="isHeld" checked={formData.isHeld} onChange={handleFormChange} size="small" />} label="On Hold" sx={{ fontSize: '0.8rem' }} /></Grid>
                  <Grid size={{ xs: 12, sm: 6 }}><TextField label="Return By Date" name="returnByDate" type="date" value={formData.returnByDate} onChange={handleFormChange} fullWidth size="small" InputLabelProps={{ shrink: true }} sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' }, '& .MuiInputBase-root': { fontSize: '0.8rem' } }} /></Grid>
                  {formData.isHeld && (<>
                    <Grid size={{ xs: 12, sm: 6 }}><TextField label="Hold Code" name="holdCode" value={formData.holdCode} onChange={handleFormChange} fullWidth size="small" sx={{ '& .MuiInputBase-root': { fontSize: '0.8rem' } }} /></Grid>
                    <Grid size={{ xs: 12, sm: 6 }}><TextField label="Hold Date" name="holdDate" type="date" value={formData.holdDate} onChange={handleFormChange} fullWidth size="small" InputLabelProps={{ shrink: true }} sx={{ '& .MuiInputBase-root': { fontSize: '0.8rem' } }} /></Grid>
                    <Grid size={{ xs: 12, sm: 6 }}><TextField label="Held By" name="heldBy" value={formData.heldBy} onChange={handleFormChange} fullWidth size="small" sx={{ '& .MuiInputBase-root': { fontSize: '0.8rem' } }} /></Grid>
                    <Grid size={{ xs: 12, sm: 6 }}><TextField label="Hold Reason" name="holdReason" value={formData.holdReason} onChange={handleFormChange} fullWidth size="small" multiline rows={2} sx={{ '& .MuiInputBase-root': { fontSize: '0.8rem' } }} /></Grid>
                  </>)}
                </Grid>
              </Paper>
              <Paper sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: '12px', border: '1px solid #ECECEC' }}>
                <Typography variant="subtitle2" sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#4F46E5', mb: 1.5 }}><DescriptionIcon sx={{ fontSize: '0.9rem', verticalAlign: 'middle', mr: 0.5 }} />Additional Information</Typography>
                <TextField label="Notes" name="notes" value={formData.notes} onChange={handleFormChange} fullWidth size="small" multiline rows={3} sx={{ '& .MuiInputBase-root': { fontSize: '0.8rem' } }} />
              </Paper>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 2.5, py: 1.5, borderTop: 1, borderColor: 'divider', bgcolor: '#F8FAFC', justifyContent: 'space-between' }}>
            <Button onClick={() => setShowAddDialog(false)} size="small">Cancel</Button>
            <Button variant="contained" size="small" onClick={handleSubmit} disabled={submitting} startIcon={<SaveIcon />}
              sx={{ background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)', textTransform: 'none' }}>
              {selectedItem ? 'Update Item' : 'Add Item'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* View Item Dialog */}
        <Dialog open={showViewDialog} onClose={() => setShowViewDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle sx={{ py: 1.5, px: 2.5, borderBottom: 1, borderColor: 'divider', bgcolor: '#F8FAFC' }}>
            <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>Item Details - {selectedItem?.sku || 'No SKU'}</Typography>
          </DialogTitle>
          <DialogContent sx={{ p: 2.5 }}>
            {selectedItem && (
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}><Typography variant="subtitle2" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>SKU</Typography><Typography variant="body2" sx={{ fontWeight: 500, color: '#4F46E5' }}>{selectedItem.sku || 'N/A'}</Typography></Grid>
                <Grid size={{ xs: 12, sm: 6 }}><Typography variant="subtitle2" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>Name</Typography><Typography variant="body1" sx={{ fontWeight: 500 }}>{selectedItem.name}</Typography></Grid>
                <Grid size={{ xs: 6 }}><Typography variant="subtitle2" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>Category</Typography><Typography variant="body2">{selectedItem.category || 'N/A'}</Typography></Grid>
                <Grid size={{ xs: 6 }}><Typography variant="subtitle2" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>Unit</Typography><Typography variant="body2">{selectedItem.unitOfMeasure || 'EA'}</Typography></Grid>
                <Grid size={{ xs: 4 }}><Typography variant="subtitle2" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>Quantity</Typography><Typography variant="body2" fontWeight={500}>{selectedItem.quantity}</Typography></Grid>
                <Grid size={{ xs: 4 }}><Typography variant="subtitle2" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>Min Level</Typography><Typography variant="body2">{selectedItem.minLevel || 0}</Typography></Grid>
                <Grid size={{ xs: 4 }}><Typography variant="subtitle2" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>Unit Cost</Typography><Typography variant="body2">R {selectedItem.unitCost?.toFixed(2) || '0.00'}</Typography></Grid>
                <Grid size={{ xs: 6 }}><Typography variant="subtitle2" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>Location</Typography><Typography variant="body2">{locations.find(l => l.id === selectedItem.locationId)?.name || 'N/A'}</Typography></Grid>
                <Grid size={{ xs: 6 }}><Typography variant="subtitle2" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>Reorder Level</Typography><Typography variant="body2">{selectedItem.reorderLevel || 0}</Typography></Grid>
              </Grid>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 2.5, py: 1.5, borderTop: 1, borderColor: 'divider' }}>
            <Button onClick={() => setShowViewDialog(false)} size="small">Close</Button>
          </DialogActions>
        </Dialog>

        {/* Issue Details Dialog */}
        <Dialog open={showIssueDetailsDialog} onClose={() => setShowIssueDetailsDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle sx={{ py: 1.5, px: 2.5, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>Issue Details - {selectedIssue?.issueNumber || `Issue #${selectedIssue?.id}`}</Typography>
          </DialogTitle>
          <DialogContent sx={{ p: 2.5 }}>
            {selectedIssue && (
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}><Typography variant="subtitle2" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>Issue Number</Typography><Typography variant="body2">{selectedIssue.issueNumber || selectedIssue.id}</Typography></Grid>
                <Grid size={{ xs: 12, sm: 6 }}><Typography variant="subtitle2" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>Status</Typography><Chip label={selectedIssue.status || 'ISSUED'} color={selectedIssue.status === 'RETURNED' ? 'success' : selectedIssue.status === 'PARTIALLY_RETURNED' ? 'warning' : 'info'} size="small" /></Grid>
                <Grid size={{ xs: 12, sm: 6 }}><Typography variant="subtitle2" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>Issue Date</Typography><Typography variant="body2">{(() => { const d = resolveIssueDate(selectedIssue); return d ? new Date(d).toLocaleString() : 'N/A'; })()}</Typography></Grid>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle2" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>Items</Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead><TableRow>
                        <TableCell sx={{ fontSize: '0.6rem', fontWeight: 600 }}>Item</TableCell>
                        <TableCell sx={{ fontSize: '0.6rem', fontWeight: 600 }}>Qty</TableCell>
                        <TableCell sx={{ fontSize: '0.6rem', fontWeight: 600 }}>Condition</TableCell>
                        <TableCell sx={{ fontSize: '0.6rem', fontWeight: 600 }}>Returned</TableCell>
                      </TableRow></TableHead>
                      <TableBody>
                        {selectedIssue.items?.map((item, idx) => (
                          <TableRow key={idx}>
                            <TableCell sx={{ fontSize: '0.7rem' }}>{item.itemName || inventoryItems.find(i => i.id === item.itemId)?.name || `Item #${item.itemId}`}</TableCell>
                            <TableCell sx={{ fontSize: '0.7rem' }}>{item.quantityIssued || item.quantity || 0}</TableCell>
                            <TableCell sx={{ fontSize: '0.7rem' }}>{item.condition || 'N/A'}</TableCell>
                            <TableCell sx={{ fontSize: '0.7rem' }}>{(item.quantityReturned ?? item.returnedQuantity) ? `${item.quantityReturned ?? item.returnedQuantity} returned` : 'Not returned'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
              </Grid>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 2.5, py: 1.5, borderTop: 1, borderColor: 'divider' }}>
            <Button onClick={() => setShowIssueDetailsDialog(false)} size="small">Close</Button>
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
                <Select value={selectedItem?.id || issueFormData.itemId || ''}
                  onChange={(e) => { const item = inventoryItems.find(i => i.id === e.target.value); setSelectedItem(item); setIssueFormData(prev => ({ ...prev, itemId: e.target.value, quantity: 1 })); }}
                  label="Select Item *" sx={{ fontSize: '0.8rem' }}>
                  <MenuItem value="">Choose an item...</MenuItem>
                  {inventoryItems.filter(item => isIssuable(item, 'vehicle')).map((item) => (
                    <MenuItem key={item.id} value={item.id} disabled={item.quantity <= 0}>{item.name} (Available: {item.quantity} {item.unitOfMeasure || 'EA'})</MenuItem>
                  ))}
                </Select>
              </FormControl>
              {selectedItem && (<>
                <Alert severity="info" sx={{ fontSize: '0.8rem' }}>Issuing: <strong>{selectedItem.name}</strong></Alert>
                <TextField label="Issue Date & Time *" type="datetime-local" value={issueFormData.issueDate}
                  onChange={(e) => setIssueFormData(prev => ({ ...prev, issueDate: e.target.value }))}
                  fullWidth size="small" InputLabelProps={{ shrink: true }}
                  helperText="Defaults to now. Change to backdate." />
                <FormControl fullWidth size="small" required>
                  <InputLabel sx={{ fontSize: '0.75rem' }}>Vehicle *</InputLabel>
                  <Select value={issueFormData.vehicleId} onChange={(e) => setIssueFormData(prev => ({ ...prev, vehicleId: e.target.value }))} label="Vehicle *" sx={{ fontSize: '0.8rem' }}>
                    <MenuItem value="">{loadingVehicles ? 'Loading...' : 'Select Vehicle'}</MenuItem>
                    {vehicles.map((v) => <MenuItem key={v.id} value={v.id}>{v.registrationNumber || v.regNumber || `Vehicle #${v.id}`}</MenuItem>)}
                  </Select>
                </FormControl>
                <FormControl fullWidth size="small" required>
                  <InputLabel sx={{ fontSize: '0.75rem' }}>Driver *</InputLabel>
                  <Select value={issueFormData.driverId} onChange={(e) => setIssueFormData(prev => ({ ...prev, driverId: e.target.value }))} label="Driver *" sx={{ fontSize: '0.8rem' }}>
                    <MenuItem value="">{loadingDrivers ? 'Loading...' : 'Select Driver'}</MenuItem>
                    {drivers.map((d) => <MenuItem key={d.id} value={d.id}>{d.fullName || `${d.firstName || ''} ${d.lastName || ''}`.trim() || `Driver #${d.id}`}</MenuItem>)}
                  </Select>
                </FormControl>
                <TextField label="Quantity *" type="number" value={issueFormData.quantity}
                  onChange={(e) => setIssueFormData(prev => ({ ...prev, quantity: e.target.value }))}
                  fullWidth size="small" helperText={`Max: ${selectedItem.quantity}`} />
                <TextField label="Notes" value={issueFormData.notes}
                  onChange={(e) => setIssueFormData(prev => ({ ...prev, notes: e.target.value }))}
                  fullWidth size="small" multiline rows={2} />
              </>)}
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 2.5, py: 1.5, borderTop: 1, borderColor: 'divider' }}>
            <Button onClick={() => setShowIssueDialog(false)} size="small">Cancel</Button>
            <Button variant="contained" size="small" onClick={handleSubmitVehicleIssue} disabled={submitting || !selectedItem || !issueFormData.vehicleId || !issueFormData.driverId || issueFormData.quantity <= 0 || !issueFormData.issueDate}>Issue Item</Button>
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
                <Select value={selectedItem?.id || ''}
                  onChange={(e) => { const item = inventoryItems.find(i => i.id === e.target.value); setSelectedItem(item); setDriverIssueFormData(prev => ({ ...prev, quantity: 1 })); }}
                  label="Select Item *" sx={{ fontSize: '0.8rem' }}>
                  <MenuItem value="">Choose an item...</MenuItem>
                  {inventoryItems.filter(item => isIssuable(item, 'driver')).map((item) => (
                    <MenuItem key={item.id} value={item.id} disabled={item.quantity <= 0}>{item.name} (Available: {item.quantity})</MenuItem>
                  ))}
                </Select>
              </FormControl>
              {selectedItem && (<>
                <Alert severity="info" sx={{ fontSize: '0.8rem' }}>Issuing: <strong>{selectedItem.name}</strong></Alert>
                <TextField label="Issue Date & Time *" type="datetime-local" value={driverIssueFormData.issueDate}
                  onChange={(e) => setDriverIssueFormData(prev => ({ ...prev, issueDate: e.target.value }))}
                  fullWidth size="small" InputLabelProps={{ shrink: true }}
                  helperText="Defaults to now. Change to backdate." />
                <FormControl fullWidth size="small" required>
                  <InputLabel sx={{ fontSize: '0.75rem' }}>Driver *</InputLabel>
                  <Select value={driverIssueFormData.driverId} onChange={(e) => setDriverIssueFormData(prev => ({ ...prev, driverId: e.target.value }))} label="Driver *" sx={{ fontSize: '0.8rem' }}>
                    <MenuItem value="">{loadingDrivers ? 'Loading...' : 'Select Driver'}</MenuItem>
                    {drivers.map((d) => <MenuItem key={d.id} value={d.id}>{d.fullName || `${d.firstName || ''} ${d.lastName || ''}`.trim() || `Driver #${d.id}`}</MenuItem>)}
                  </Select>
                </FormControl>
                <TextField label="Quantity *" type="number" value={driverIssueFormData.quantity}
                  onChange={(e) => setDriverIssueFormData(prev => ({ ...prev, quantity: e.target.value }))}
                  fullWidth size="small" helperText={`Max: ${selectedItem.quantity}`} />
                <TextField label="Notes" value={driverIssueFormData.notes}
                  onChange={(e) => setDriverIssueFormData(prev => ({ ...prev, notes: e.target.value }))}
                  fullWidth size="small" multiline rows={2} />
              </>)}
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 2.5, py: 1.5, borderTop: 1, borderColor: 'divider' }}>
            <Button onClick={() => setShowDriverIssueDialog(false)} size="small">Cancel</Button>
            <Button variant="contained" size="small" onClick={handleSubmitDriverIssue} disabled={submitting || !selectedItem || !driverIssueFormData.driverId || driverIssueFormData.quantity <= 0 || !driverIssueFormData.issueDate}>Issue to Driver</Button>
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
                  Returning: <strong>{selectedItem.name || 'Unknown Item'}</strong>
                  <br /><small>Still out: {selectedItem.outstanding ?? outstandingQty(selectedItem)}</small>
                </Alert>
                <TextField label="Quantity *" type="number" value={returnFormData.quantity}
                  onChange={(e) => setReturnFormData(prev => ({ ...prev, quantity: e.target.value }))}
                  fullWidth size="small" />
                <FormControl fullWidth size="small">
                  <InputLabel sx={{ fontSize: '0.75rem' }}>Condition</InputLabel>
                  <Select value={returnFormData.condition} onChange={(e) => setReturnFormData(prev => ({ ...prev, condition: e.target.value }))} label="Condition" sx={{ fontSize: '0.8rem' }}>
                    <MenuItem value="GOOD">Good</MenuItem>
                    <MenuItem value="DAMAGED">Damaged</MenuItem>
                    <MenuItem value="WORN">Worn</MenuItem>
                    <MenuItem value="FAULTY">Faulty</MenuItem>
                    <MenuItem value="BROKEN">Broken</MenuItem>
                  </Select>
                </FormControl>
                <TextField label="Notes" value={returnFormData.notes}
                  onChange={(e) => setReturnFormData(prev => ({ ...prev, notes: e.target.value }))}
                  fullWidth size="small" multiline rows={2} />
              </Stack>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 2.5, py: 1.5, borderTop: 1, borderColor: 'divider' }}>
            <Button onClick={() => setShowReturnDialog(false)} size="small">Cancel</Button>
            <Button variant="contained" size="small" onClick={handleSubmitReturn} disabled={submitting || !selectedIssue || returnFormData.quantity <= 0}>Return Item</Button>
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
                <FormControl fullWidth size="small" required>
                  <InputLabel sx={{ fontSize: '0.75rem' }}>Replacement Item *</InputLabel>
                  <Select value={swapFormData.newItemId} onChange={(e) => setSwapFormData(prev => ({ ...prev, newItemId: e.target.value }))} label="Replacement Item *" sx={{ fontSize: '0.8rem' }}>
                    <MenuItem value="">Select Replacement Item</MenuItem>
                    {inventoryItems.filter(item => item.id !== Number(selectedIssueItem.itemId) && isIssuable(item, swapFormData.issueType)).map((item) => (
                      <MenuItem key={item.id} value={item.id} disabled={item.quantity <= 0}>{item.name} (Available: {item.quantity})</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Grid container spacing={1.5}>
                  <Grid size={{ xs: 6 }}><TextField label="New Qty" type="number" value={swapFormData.newQuantity} onChange={(e) => setSwapFormData(prev => ({ ...prev, newQuantity: e.target.value }))} fullWidth size="small" /></Grid>
                  <Grid size={{ xs: 6 }}><TextField label="Return Qty" type="number" value={swapFormData.returnQuantity} onChange={(e) => setSwapFormData(prev => ({ ...prev, returnQuantity: e.target.value }))} fullWidth size="small" /></Grid>
                </Grid>
                <FormControl fullWidth size="small" required>
                  <InputLabel sx={{ fontSize: '0.75rem' }}>Damaged Condition *</InputLabel>
                  <Select value={swapFormData.damagedCondition} onChange={(e) => setSwapFormData(prev => ({ ...prev, damagedCondition: e.target.value }))} label="Damaged Condition *" sx={{ fontSize: '0.8rem' }}>
                    <MenuItem value="DAMAGED">Damaged</MenuItem>
                    <MenuItem value="FAULTY">Faulty</MenuItem>
                    <MenuItem value="BROKEN">Broken</MenuItem>
                    <MenuItem value="WORN">Worn</MenuItem>
                  </Select>
                </FormControl>
                <TextField label="Damage Notes" value={swapFormData.damageNotes}
                  onChange={(e) => setSwapFormData(prev => ({ ...prev, damageNotes: e.target.value }))}
                  fullWidth size="small" multiline rows={2} />
              </Stack>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 2.5, py: 1.5, borderTop: 1, borderColor: 'divider' }}>
            <Button onClick={() => setShowSwapDialog(false)} size="small">Cancel</Button>
            <Button variant="contained" color="warning" size="small" onClick={handleSubmitSwap} disabled={submitting || !swapFormData.newItemId || swapFormData.newQuantity <= 0}>Swap Item</Button>
          </DialogActions>
        </Dialog>

        {/* Movement Dialog */}
        <Dialog open={showMovementDialog} onClose={() => setShowMovementDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle sx={{ py: 1.5, px: 2.5, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>Stock Movement</Typography>
          </DialogTitle>
          <DialogContent sx={{ p: 2.5 }}>
            {selectedItem && (
              <Stack spacing={2}>
                <Alert severity="info" sx={{ fontSize: '0.8rem' }}>
                  <strong>{selectedItem.name}</strong>
                  <br />Current Qty: <strong>{selectedItem.quantity}</strong> {selectedItem.unitOfMeasure || 'EA'}
                </Alert>
                <FormControl fullWidth size="small" required>
                  <InputLabel sx={{ fontSize: '0.75rem' }}>Operation *</InputLabel>
                  <Select value={movementFormData.operation}
                    onChange={(e) => {
                      const op = e.target.value;
                      let mt = 'ADJUSTMENT', rt = 'ADJUSTMENT';
                      if (op === 'ADD') { mt = 'IN'; rt = 'PURCHASE_ORDER'; }
                      else if (op === 'SUBTRACT') { mt = 'OUT'; rt = 'ADJUSTMENT'; }
                      setMovementFormData(prev => ({ ...prev, operation: op, movementType: mt, referenceType: rt }));
                    }} label="Operation *" sx={{ fontSize: '0.8rem' }}>
                    <MenuItem value="ADD">Stock In (Add)</MenuItem>
                    <MenuItem value="SUBTRACT">Stock Out (Subtract)</MenuItem>
                    <MenuItem value="SET">Adjust (Set)</MenuItem>
                  </Select>
                </FormControl>
                <TextField label="Quantity *" type="number" value={movementFormData.quantity}
                  onChange={(e) => setMovementFormData(prev => ({ ...prev, quantity: e.target.value }))}
                  fullWidth size="small" />
                <TextField label="Reason *" value={movementFormData.reason}
                  onChange={(e) => setMovementFormData(prev => ({ ...prev, reason: e.target.value }))}
                  fullWidth size="small" multiline rows={2} />
                <TextField label="Notes" value={movementFormData.notes}
                  onChange={(e) => setMovementFormData(prev => ({ ...prev, notes: e.target.value }))}
                  fullWidth size="small" multiline rows={2} />
              </Stack>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 2.5, py: 1.5, borderTop: 1, borderColor: 'divider' }}>
            <Button onClick={() => setShowMovementDialog(false)} size="small">Cancel</Button>
            <Button variant="contained" size="small" onClick={handleSubmitMovement} disabled={submitting || !movementFormData.itemId || Number(movementFormData.quantity) <= 0 || !movementFormData.reason}>
              {movementFormData.operation === 'ADD' && 'Add Stock'}
              {movementFormData.operation === 'SUBTRACT' && 'Remove Stock'}
              {movementFormData.operation === 'SET' && 'Set Quantity'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default Inventory;
