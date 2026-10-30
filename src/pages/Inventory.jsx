// src/pages/Inventory.jsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Paper, Typography, Grid, Card, CardContent, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Chip, TextField, InputAdornment, Stack, Tooltip, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions, FormControl,
  InputLabel, Select, MenuItem, CircularProgress, Tabs, Tab, Divider,
  Avatar, LinearProgress, FormControlLabel, Checkbox,
  Menu, Snackbar, Collapse,
} from '@mui/material';
import {
  Inventory as InventoryIcon, Search, Add, Edit, Delete, Visibility,
  Refresh as RefreshIcon, Warning as WarningIcon, CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon, Category as CategoryIcon, LocationOn, SwapHoriz,
  Assignment, DirectionsCar, Person, Save as SaveIcon, Close as CloseIcon,
  Lock as LockIcon, Description as DescriptionIcon, AddCircle as AddCircleIcon,
  RemoveCircle as RemoveCircleIcon, Adjust as AdjustIcon,
  CompareArrows as CompareArrowsIcon, Undo as UndoIcon,
  Download as DownloadIcon, QrCode,
  BugReport as BugReportIcon, ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon, Warehouse as WarehouseIcon,
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
// CONSTANTS + HELPERS
// ============================================================

const ISSUE_REQUIRES_CONSUMABLE = true;
const ITEM_PAGE_SIZE = 100;
const MAX_ITEM_PAGES = 50;

const toArray = (res) => {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  let p = res;
  if (p.data !== undefined && (p.status !== undefined || p.config !== undefined)) p = p.data;
  if (Array.isArray(p)) return p;
  if (p && Array.isArray(p.content)) return p.content;
  if (p && Array.isArray(p.data)) return p.data;
  if (p && p.data && Array.isArray(p.data.content)) return p.data.content;
  const find = (n, d = 0) => {
    if (!n || d > 4) return null;
    if (Array.isArray(n)) return n;
    if (typeof n !== 'object') return null;
    for (const k of ['items', 'list', 'records', 'rows', 'results', 'content', 'data']) {
      if (n[k] !== undefined) { const f = find(n[k], d + 1); if (f) return f; }
    }
    const vals = Object.values(n);
    if (vals.length > 0 && vals.every(v => v && typeof v === 'object' && !Array.isArray(v))) return vals;
    return null;
  };
  return find(p) || [];
};

const errMsg = (err, fallback) => {
  const d = err?.response?.data ?? err?.data;
  if (typeof d === 'string' && d.trim()) return d;
  return d?.message || d?.error || d?.detail || err?.userMessage || err?.message || fallback;
};

const parseWhole = (v, { allowZero = false } = {}) => {
  if (v === '' || v === null || v === undefined) return null;
  const n = Number(v);
  if (!Number.isInteger(n)) return null;
  return n > 0 || (allowZero && n === 0) ? n : null;
};

const localNowIso = (d = new Date()) => {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
};

const toDTLocal = (d = new Date()) => {
  if (!d) return '';
  const dt = d instanceof Date ? d : new Date(d);
  if (isNaN(dt.getTime())) return '';
  const p = (n) => String(n).padStart(2, '0');
  return `${dt.getFullYear()}-${p(dt.getMonth() + 1)}-${p(dt.getDate())}T${p(dt.getHours())}:${p(dt.getMinutes())}`;
};

const fromDTLocal = (v) => (!v ? null : (String(v).length === 16 ? `${v}:00` : v));

const outstandingQty = (line) => {
  if (!line) return 0;
  const i = Number(line.quantityIssued ?? line.quantity ?? 0) || 0;
  const r = Number(line.quantityReturned ?? line.returnedQuantity ?? 0) || 0;
  return Math.max(0, i - r);
};

const issueTypeOf = (issue) => (issue?.issueNumber?.startsWith('DI-') ? 'driver' : 'vehicle');
const isIssuable = (item, target) => {
  if (!item || item.isActive === false || item.isHeld) return false;
  if (ISSUE_REQUIRES_CONSUMABLE && item.isConsumable === false) return false;
  if (target === 'vehicle') return item.isVehicleIssuable !== false;
  if (target === 'driver') return item.isDriverIssuable !== false;
  return true;
};
const resolveIssueDate = (i) => i?.issueDate || i?.createdAt || i?.transactionDate || null;

const getApiBase = () => {
  try { if (api?.defaults?.baseURL) return api.defaults.baseURL; } catch { }
  try { if (import.meta.env?.VITE_API_BASE_URL) return import.meta.env.VITE_API_BASE_URL; } catch { }
  return 'https://trailers-backend.onrender.com/api';
};

const previewOf = (b) => {
  if (b === null || b === undefined) return '(null)';
  try { const s = typeof b === 'string' ? b : JSON.stringify(b); return s.length > 280 ? `${s.slice(0, 280)}…` : s; }
  catch { return String(b); }
};

// ============================================================
// ERROR BOUNDARY
// ============================================================
class SafeSection extends React.Component {
  constructor(p) { super(p); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(e) { return { hasError: true, error: e }; }
  componentDidCatch(e, i) { console.error(`[${this.props.label}] crashed:`, e, i); }
  render() {
    if (this.state.hasError) {
      return (
        <Alert severity="error" sx={{ borderRadius: '10px', fontSize: '0.8rem' }}>
          <strong>{this.props.label || 'Section'} crashed.</strong>
          <br /><code style={{ fontSize: '0.7rem' }}>{String(this.state.error)}</code>
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
  const colorMap = { primary: '#4F46E5', success: '#22C55E', warning: '#F59E0B', error: '#EF4444', info: '#3B82F6', secondary: '#6B7280', purple: '#8B5CF6', teal: '#14B8A6' };
  const bgMap = { primary: '#EEF2FF', success: '#D1FAE5', warning: '#FEF3C7', error: '#FEE2E2', info: '#DBEAFE', secondary: '#F3F4F6', purple: '#EDE9FE', teal: '#CCFBF1' };
  const ic = colorMap[color] || colorMap.primary;
  const bc = bgMap[color] || bgMap.primary;
  const SafeIcon = Icon || InventoryIcon;
  return (
    <Card sx={{ bgcolor: '#FFFFFF', borderRadius: { xs: '12px', sm: '14px', md: '16px' }, border: '1px solid #ECECEC', height: '100%', width: '100%', position: 'relative', transition: 'all 0.3s', '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 8px 32px rgba(0,0,0,0.1)', borderColor: ic } }}>
      <CardContent sx={{ p: { xs: 1.5, sm: 2, md: 2.5 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="caption" sx={{ color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', fontSize: { xs: '0.55rem', sm: '0.6rem', md: '0.65rem' }, letterSpacing: '0.5px', display: 'block', mb: 0.25 }}>{title}</Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#111827', fontSize: { xs: '1.2rem', sm: '1.4rem', md: '1.6rem' }, lineHeight: 1.2 }}>{value || 0}</Typography>
            {subtitle && <Typography variant="caption" sx={{ color: '#6B7280', display: 'block', mt: 0.25, fontSize: { xs: '0.55rem', sm: '0.6rem' } }}>{subtitle}</Typography>}
          </Box>
          <Box sx={{ bgcolor: bc, borderRadius: { xs: '10px', sm: '12px' }, p: { xs: 1, sm: 1.25 }, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <SafeIcon sx={{ color: ic, fontSize: { xs: '1.2rem', sm: '1.4rem', md: '1.6rem' } }} />
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
// ITEM ROW
// ============================================================
const InventoryItemRow = ({ item, onView, onEdit, onDelete, locations, onIssue, onReceive, onIssueToDriver, onMovement }) => {
  const status = (() => {
    const q = Number(item.quantity) || 0, m = Number(item.minLevel) || 0;
    if (q <= 0) return { color: 'error', icon: <CancelIcon sx={{ fontSize: '0.8rem' }} />, label: 'Out of Stock' };
    if (q <= m) return { color: 'warning', icon: <WarningIcon sx={{ fontSize: '0.8rem' }} />, label: 'Low Stock' };
    return { color: 'success', icon: <CheckCircleIcon sx={{ fontSize: '0.8rem' }} />, label: 'In Stock' };
  })();
  const location = locations?.find(l => l.id === item.locationId);
  const isConsumable = item.isConsumable !== false;
  const driverIss = item.isDriverIssuable !== false;
  const vehicleIss = item.isVehicleIssuable !== false;
  const isHeld = item.isHeld || false;
  let issueType = 'N/A', issueColor = 'default';
  if (driverIss && vehicleIss) { issueType = 'Both'; issueColor = 'success'; }
  else if (driverIss) { issueType = 'Driver Only'; issueColor = 'info'; }
  else if (vehicleIss) { issueType = 'Vehicle Only'; issueColor = 'warning'; }

  return (
    <TableRow hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
      <TableCell sx={{ fontSize: '0.75rem', py: 0.75 }}><Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: '#4F46E5' }}>{item.sku || 'N/A'}</Typography></TableCell>
      <TableCell sx={{ fontSize: '0.75rem', py: 0.75 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Avatar sx={{ width: 24, height: 24, fontSize: '0.6rem', bgcolor: 'primary.light' }}>{item.name?.charAt(0) || 'I'}</Avatar>
          <Box>
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 500 }}>{item.name}</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.55rem' }}>ID: {item.id}</Typography>
          </Box>
        </Stack>
      </TableCell>
      <TableCell sx={{ py: 0.75 }}><Chip label={item.category || 'Uncategorized'} size="small" variant="outlined" sx={{ height: 18, fontSize: '0.55rem' }} /></TableCell>
      <TableCell sx={{ py: 0.75 }}>
        <Typography sx={{ fontSize: '0.75rem' }}>{item.quantity} {item.unitOfMeasure || 'EA'}</Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.55rem' }}>Unit: R {item.unitCost?.toFixed(2) || '0.00'}</Typography>
      </TableCell>
      <TableCell sx={{ py: 0.75 }}>
        <Stack spacing={0.25}>
          {isConsumable ? <Chip label="Consumable" size="small" color="primary" variant="outlined" sx={{ height: 16, fontSize: '0.5rem' }} /> : <Chip label="Non-Consumable" size="small" color="secondary" variant="outlined" sx={{ height: 16, fontSize: '0.5rem' }} />}
          <Chip label={issueType} size="small" color={issueColor} sx={{ height: 16, fontSize: '0.5rem' }} />
        </Stack>
      </TableCell>
      <TableCell sx={{ py: 0.75 }}>
        <Stack direction="row" spacing={0.5} alignItems="center">
          <Typography sx={{ fontSize: '0.7rem' }}>{item.minLevel || 0} {item.unitOfMeasure || 'EA'}</Typography>
          {item.quantity <= item.minLevel && item.quantity > 0 && <Chip label="Reorder" size="small" color="warning" sx={{ height: 16, fontSize: '0.5rem' }} />}
        </Stack>
      </TableCell>
      <TableCell sx={{ py: 0.75 }}>
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <LocationOn sx={{ fontSize: '0.7rem', color: 'text.secondary' }} />
          <Typography sx={{ fontSize: '0.7rem' }}>{location?.name || 'N/A'}</Typography>
        </Stack>
      </TableCell>
      <TableCell sx={{ py: 0.75 }}>
        <Stack spacing={0.25}>
          <Chip label={status.label} color={status.color} size="small" icon={status.icon} sx={{ height: 18, fontSize: '0.55rem' }} />
          {isHeld && <Chip label="On Hold" size="small" color="warning" icon={<LockIcon sx={{ fontSize: '0.6rem' }} />} sx={{ height: 16, fontSize: '0.5rem' }} />}
        </Stack>
      </TableCell>
      <TableCell sx={{ py: 0.75 }}>
        <Stack direction="row" spacing={0.25}>
          <Tooltip title="View"><IconButton size="small" color="primary" onClick={() => onView(item)} sx={{ p: 0.5 }}><Visibility sx={{ fontSize: '0.9rem' }} /></IconButton></Tooltip>
          <Tooltip title="Edit"><IconButton size="small" color="secondary" onClick={() => onEdit(item)} sx={{ p: 0.5 }}><Edit sx={{ fontSize: '0.9rem' }} /></IconButton></Tooltip>
          <Tooltip title="Stock Movement"><IconButton size="small" color="info" onClick={() => onMovement(item)} sx={{ p: 0.5 }}><CompareArrowsIcon sx={{ fontSize: '0.9rem' }} /></IconButton></Tooltip>
          {isIssuable(item, 'vehicle') && <Tooltip title="Issue to Vehicle"><IconButton size="small" color="warning" onClick={() => onIssue(item)} sx={{ p: 0.5 }}><DirectionsCar sx={{ fontSize: '0.9rem' }} /></IconButton></Tooltip>}
          {isIssuable(item, 'driver') && <Tooltip title="Issue to Driver"><IconButton size="small" color="info" onClick={() => onIssueToDriver(item)} sx={{ p: 0.5 }}><Person sx={{ fontSize: '0.9rem' }} /></IconButton></Tooltip>}
          {isIssuable(item) && <Tooltip title="Receive Return"><IconButton size="small" color="success" onClick={() => onReceive(item)} sx={{ p: 0.5 }}><UndoIcon sx={{ fontSize: '0.9rem' }} /></IconButton></Tooltip>}
          <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => onDelete(item)} sx={{ p: 0.5 }}><Delete sx={{ fontSize: '0.9rem' }} /></IconButton></Tooltip>
        </Stack>
      </TableCell>
    </TableRow>
  );
};

// ============================================================
// VEHICLE ISSUE ROW — now with EDIT + DELETE
// ============================================================
const VehicleIssueRow = ({ issue, onView, onEdit, onDelete, onReturn, onSwap, vehicles, drivers, inventoryItems }) => {
  if (!issue) return null;
  const sc = (s) => ({ RETURNED: 'success', PARTIALLY_RETURNED: 'warning' }[s] || 'info');
  const v = vehicles?.find(x => x.id === issue.vehicleId);
  const d = drivers?.find(x => x.id === issue.driverId);
  const vehLabel = !v ? 'Unknown' : (v.registrationNumber || v.regNumber || `Vehicle #${v.id}`);
  const drvLabel = !d ? 'Unknown' : (d.fullName || `${d.firstName || ''} ${d.lastName || ''}`.trim() || `Driver #${d.id}`);
  const first = issue.items?.[0];
  const itemName = first?.itemName || inventoryItems?.find(i => i.id === first?.itemId)?.name || 'Unknown Item';
  const date = resolveIssueDate(issue);

  return (
    <TableRow hover>
      <TableCell sx={{ py: 0.75 }}><Typography sx={{ fontSize: '0.75rem', fontWeight: 500 }}>{issue.issueNumber || `Issue #${issue.id}`}</Typography></TableCell>
      <TableCell sx={{ py: 0.75 }}><Stack direction="row" alignItems="center" spacing={0.5}><DirectionsCar sx={{ fontSize: '0.8rem', color: 'text.secondary' }} /><Typography sx={{ fontSize: '0.7rem', fontWeight: 500 }}>{vehLabel}</Typography></Stack></TableCell>
      <TableCell sx={{ py: 0.75 }}><Stack direction="row" alignItems="center" spacing={0.5}><Person sx={{ fontSize: '0.8rem', color: 'text.secondary' }} /><Typography sx={{ fontSize: '0.7rem', fontWeight: 500 }}>{drvLabel}</Typography></Stack></TableCell>
      <TableCell sx={{ py: 0.75 }}>
        <Typography sx={{ fontSize: '0.7rem' }}>{itemName}</Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.5rem' }}>Qty: {first?.quantityIssued || first?.quantity || 0}{first?.condition && ` • ${first.condition}`}</Typography>
      </TableCell>
      <TableCell sx={{ py: 0.75 }}><Typography sx={{ fontSize: '0.7rem' }}>{date ? new Date(date).toLocaleDateString() : 'N/A'}</Typography></TableCell>
      <TableCell sx={{ py: 0.75 }}><Chip label={issue.status || 'ISSUED'} color={sc(issue.status)} size="small" sx={{ height: 18, fontSize: '0.55rem' }} /></TableCell>
      <TableCell sx={{ py: 0.75 }}>
        <Stack direction="row" spacing={0.25}>
          <Tooltip title="View"><IconButton size="small" color="primary" onClick={() => onView(issue)} sx={{ p: 0.5 }}><Visibility sx={{ fontSize: '0.9rem' }} /></IconButton></Tooltip>
          {issue.status !== 'RETURNED' && (<>
            <Tooltip title="Edit"><IconButton size="small" color="secondary" onClick={() => onEdit(issue)} sx={{ p: 0.5 }}><Edit sx={{ fontSize: '0.9rem' }} /></IconButton></Tooltip>
            <Tooltip title="Return Items"><IconButton size="small" color="success" onClick={() => onReturn(issue)} sx={{ p: 0.5 }}><UndoIcon sx={{ fontSize: '0.9rem' }} /></IconButton></Tooltip>
            <Tooltip title="Swap Item"><IconButton size="small" color="warning" onClick={() => onSwap(issue)} sx={{ p: 0.5 }}><SwapHoriz sx={{ fontSize: '0.9rem' }} /></IconButton></Tooltip>
          </>)}
          <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => onDelete(issue)} sx={{ p: 0.5 }}><Delete sx={{ fontSize: '0.9rem' }} /></IconButton></Tooltip>
        </Stack>
      </TableCell>
    </TableRow>
  );
};

// ============================================================
// DRIVER ISSUE ROW — now with EDIT + DELETE
// ============================================================
const DriverIssueRow = ({ issue, onView, onEdit, onDelete, onReturn, onSwap, drivers, inventoryItems }) => {
  if (!issue) return null;
  const sc = (s) => ({ RETURNED: 'success', PARTIALLY_RETURNED: 'warning' }[s] || 'info');
  const d = drivers?.find(x => x.id === issue.driverId);
  const drvLabel = !d ? 'Unknown' : (d.fullName || `${d.firstName || ''} ${d.lastName || ''}`.trim() || `Driver #${d.id}`);
  const first = issue.items?.[0];
  const itemName = first?.itemName || inventoryItems?.find(i => i.id === first?.itemId)?.name || 'Unknown Item';
  const date = resolveIssueDate(issue);

  return (
    <TableRow hover>
      <TableCell sx={{ py: 0.75 }}><Typography sx={{ fontSize: '0.75rem', fontWeight: 500 }}>{issue.issueNumber || `Issue #${issue.id}`}</Typography></TableCell>
      <TableCell sx={{ py: 0.75 }}><Stack direction="row" alignItems="center" spacing={0.5}><Person sx={{ fontSize: '0.8rem', color: 'text.secondary' }} /><Typography sx={{ fontSize: '0.7rem', fontWeight: 500 }}>{drvLabel}</Typography></Stack></TableCell>
      <TableCell sx={{ py: 0.75 }}>
        <Typography sx={{ fontSize: '0.7rem' }}>{itemName}</Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.5rem' }}>Qty: {first?.quantityIssued || first?.quantity || 0}{first?.condition && ` • ${first.condition}`}</Typography>
      </TableCell>
      <TableCell sx={{ py: 0.75 }}><Typography sx={{ fontSize: '0.7rem' }}>{date ? new Date(date).toLocaleDateString() : 'N/A'}</Typography></TableCell>
      <TableCell sx={{ py: 0.75 }}><Chip label={issue.status || 'ISSUED'} color={sc(issue.status)} size="small" sx={{ height: 18, fontSize: '0.55rem' }} /></TableCell>
      <TableCell sx={{ py: 0.75 }}>
        <Stack direction="row" spacing={0.25}>
          <Tooltip title="View"><IconButton size="small" color="primary" onClick={() => onView(issue)} sx={{ p: 0.5 }}><Visibility sx={{ fontSize: '0.9rem' }} /></IconButton></Tooltip>
          {issue.status !== 'RETURNED' && (<>
            <Tooltip title="Edit"><IconButton size="small" color="secondary" onClick={() => onEdit(issue)} sx={{ p: 0.5 }}><Edit sx={{ fontSize: '0.9rem' }} /></IconButton></Tooltip>
            <Tooltip title="Return Items"><IconButton size="small" color="success" onClick={() => onReturn(issue)} sx={{ p: 0.5 }}><UndoIcon sx={{ fontSize: '0.9rem' }} /></IconButton></Tooltip>
            <Tooltip title="Swap Item"><IconButton size="small" color="warning" onClick={() => onSwap(issue)} sx={{ p: 0.5 }}><SwapHoriz sx={{ fontSize: '0.9rem' }} /></IconButton></Tooltip>
          </>)}
          <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => onDelete(issue)} sx={{ p: 0.5 }}><Delete sx={{ fontSize: '0.9rem' }} /></IconButton></Tooltip>
        </Stack>
      </TableCell>
    </TableRow>
  );
};

// ============================================================
// LOCATION ROW (NEW)
// ============================================================
const LocationRow = ({ location, onEdit, onDelete, itemCount }) => (
  <TableRow hover>
    <TableCell sx={{ py: 0.75 }}>
      <Stack direction="row" alignItems="center" spacing={1}>
        <Avatar sx={{ width: 24, height: 24, bgcolor: '#EEF2FF' }}><WarehouseIcon sx={{ fontSize: '0.8rem', color: '#4F46E5' }} /></Avatar>
        <Typography sx={{ fontSize: '0.75rem', fontWeight: 500 }}>{location.name || 'Unnamed'}</Typography>
      </Stack>
    </TableCell>
    <TableCell sx={{ py: 0.75 }}><Typography sx={{ fontSize: '0.7rem' }}>{location.depotCode || location.code || '—'}</Typography></TableCell>
    <TableCell sx={{ py: 0.75 }}><Typography sx={{ fontSize: '0.7rem' }}>{location.fullAddress || location.address || '—'}</Typography></TableCell>
    <TableCell sx={{ py: 0.75 }}><Typography sx={{ fontSize: '0.7rem' }}>{location.city || '—'}</Typography></TableCell>
    <TableCell sx={{ py: 0.75 }}><Typography sx={{ fontSize: '0.7rem' }}>{location.province || '—'}</Typography></TableCell>
    <TableCell sx={{ py: 0.75 }}><Chip label={itemCount} size="small" color="primary" variant="outlined" sx={{ height: 18, fontSize: '0.55rem' }} /></TableCell>
    <TableCell sx={{ py: 0.75 }}>
      <Stack direction="row" spacing={0.25}>
        <Tooltip title="Edit"><IconButton size="small" color="secondary" onClick={() => onEdit(location)} sx={{ p: 0.5 }}><Edit sx={{ fontSize: '0.9rem' }} /></IconButton></Tooltip>
        <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => onDelete(location)} sx={{ p: 0.5 }}><Delete sx={{ fontSize: '0.9rem' }} /></IconButton></Tooltip>
      </Stack>
    </TableCell>
  </TableRow>
);

// ============================================================
// EXPORT MENU
// ============================================================
const ExportMenu = ({ disabled, onCsv, onXlsx, onPdf }) => {
  const [a, setA] = useState(null);
  const run = (fn) => { setA(null); if (typeof fn === 'function') fn(); };
  return (
    <>
      <Button variant="outlined" size="small" startIcon={<DownloadIcon sx={{ fontSize: '0.9rem' }} />} onClick={(e) => setA(e.currentTarget)} disabled={disabled} sx={{ fontSize: '0.75rem', borderRadius: '10px', textTransform: 'none', py: 0.5 }}>Export</Button>
      <Menu anchorEl={a} open={Boolean(a)} onClose={() => setA(null)}>
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

  // Item dialogs
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

  // NEW: Edit issue + location dialogs
  const [showEditIssueDialog, setShowEditIssueDialog] = useState(false);
  const [editIssueType, setEditIssueType] = useState(null);   // 'vehicle' | 'driver'
  const [editIssueForm, setEditIssueForm] = useState({ issueDate: '', status: '', notes: '', items: [] });
  const [showDeleteIssueDialog, setShowDeleteIssueDialog] = useState(false);
  const [deleteIssueTarget, setDeleteIssueTarget] = useState(null);

  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [locationForm, setLocationForm] = useState({ name: '', code: '', address: '', city: '', province: '', zipCode: '', isActive: true });
  const [showDeleteLocationDialog, setShowDeleteLocationDialog] = useState(false);
  const [deleteLocationTarget, setDeleteLocationTarget] = useState(null);

  const [submitting, setSubmitting] = useState(false);

  // Forms
  const [formData, setFormData] = useState({
    sku: '', name: '', category: '', unitOfMeasure: 'EA', isConsumable: true,
    reorderLevel: 0, locationId: '', quantity: 0, unitCost: 0, minLevel: 0,
    isActive: true, notes: '', isDriverIssuable: true, isVehicleIssuable: true,
    returnByDate: '', isHeld: false, holdCode: '', holdDate: '', holdReason: '', heldBy: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [issueFormData, setIssueFormData] = useState({ itemId: '', vehicleId: '', driverId: '', tripId: '', quantity: 1, condition: 'NEW', notes: '', issueDate: toDTLocal() });
  const [driverIssueFormData, setDriverIssueFormData] = useState({ driverId: '', quantity: 1, condition: 'NEW', notes: '', issueDate: toDTLocal() });
  const [returnFormData, setReturnFormData] = useState({ quantity: 1, condition: 'DAMAGED', notes: '' });
  const [swapFormData, setSwapFormData] = useState({ oldItemId: '', newItemId: '', newQuantity: 1, returnQuantity: 1, damagedCondition: 'DAMAGED', damageNotes: '', issueType: 'vehicle' });
  const [movementFormData, setMovementFormData] = useState({ itemId: '', quantity: 0, operation: 'ADD', movementType: 'IN', reason: '', notes: '', referenceNumber: '', referenceType: 'PURCHASE_ORDER', requiresApproval: false, approvalStatus: 'APPROVED', performedBy: 'SYSTEM', tripId: null, fuelSlipId: null, approvedBy: null, approvedAt: null });

  useEffect(() => { loadData(); /* eslint-disable-next-line */ }, []);

  // ============================================================
  // FETCHERS
  // ============================================================
  const fetchAllItems = async () => {
    const diags = [];
    const pushDiag = (d) => { diags.push(d); setEndpointDiagnostics([...diags]); };

    const tryPage = async (page, label) => {
      try {
        const res = await inventoryService.getInventoryItems(page, ITEM_PAGE_SIZE);
        const body = res?.data ?? res;
        const rows = toArray(res);
        pushDiag({ variant: label, rowCount: rows.length, totalElements: body?.totalElements, size: body?.size, number: body?.number });
        return rows;
      } catch (err) {
        pushDiag({ variant: label, error: err?.message || String(err) });
        return [];
      }
    };

    // page 0
    let rows = await tryPage(0, 'GET /inventory/items?page=0&size=100');
    setRawItemsResponse(rows);

    if (rows.length > 0) {
      const all = [...rows];
      for (let p = 1; p < MAX_ITEM_PAGES; p++) {
        const r = await tryPage(p, `GET /inventory/items?page=${p}`);
        all.push(...r);
        if (r.length < ITEM_PAGE_SIZE) break;
      }
      return all;
    }

    // page 1 (1-based fallback)
    rows = await tryPage(1, 'GET /inventory/items?page=1&size=100 (1-based)');
    if (rows.length > 0) return rows;

    // search endpoint
    try {
      if (typeof inventoryService.searchItems === 'function') {
        const res = await inventoryService.searchItems('', 0, ITEM_PAGE_SIZE);
        const body = res?.data ?? res;
        const r = toArray(res);
        pushDiag({ variant: 'GET /inventory/items/search', rowCount: r.length, totalElements: body?.totalElements });
        if (r.length > 0) return r;
      }
    } catch (err) { pushDiag({ variant: 'GET /inventory/items/search', error: err?.message || String(err) }); }

    // consumable endpoint
    try {
      if (typeof inventoryService.getConsumableItems === 'function') {
        const res = await inventoryService.getConsumableItems();
        const r = toArray(res);
        pushDiag({ variant: 'GET /inventory/items/consumable', rowCount: r.length });
        if (r.length > 0) return r;
      }
    } catch (err) { pushDiag({ variant: 'GET /inventory/items/consumable', error: err?.message || String(err) }); }

    return [];
  };

  const normalizeItem = (item) => ({
    ...item, sku: item.sku || null,
    quantity: Number(item.quantity) || 0, minLevel: Number(item.minLevel) || 0,
    isDriverIssuable: item.isDriverIssuable !== undefined ? item.isDriverIssuable : true,
    isVehicleIssuable: item.isVehicleIssuable !== undefined ? item.isVehicleIssuable : true,
    isActive: item.isActive !== undefined && item.isActive !== null ? item.isActive : true,
    isHeld: item.isHeld || false,
  });

  const loadVehicleIssues = async () => {
    setLoadingIssues(true);
    try { const x = toArray(await vehicleIssueService.getVehicleIssues()); setVehicleIssues(x); return x; }
    catch (err) { console.error('vehicle issues:', err); setVehicleIssues([]); return []; }
    finally { setLoadingIssues(false); }
  };

  const loadDriverIssues = async () => {
    setLoadingIssues(true);
    try { const x = toArray(await vehicleIssueService.getDriverIssues()); setDriverIssues(x); return x; }
    catch (err) { console.error('driver issues:', err); setDriverIssues([]); return []; }
    finally { setLoadingIssues(false); }
  };

  const loadData = async () => {
    setLoading(true); setError(null);
    setLoadingVehicles(true); setLoadingDrivers(true);
    const [iR, lR, vR, dR, sR] = await Promise.allSettled([
      fetchAllItems(), inventoryService.getLocations(),
      vehicleService.getAllVehicles(), driverService.getAllDrivers(),
      inventoryService.getInventoryStats(),
    ]);
    const failed = [];
    if (iR.status === 'fulfilled') setInventoryItems(iR.value.map(normalizeItem));
    else { failed.push(`items (${errMsg(iR.reason, '?')})`); }
    if (lR.status === 'fulfilled') setLocations(toArray(lR.value));
    else { failed.push(`locations (${errMsg(lR.reason, '?')})`); }
    if (vR.status === 'fulfilled') setVehicles(toArray(vR.value));
    else { failed.push('vehicles'); }
    setLoadingVehicles(false);
    if (dR.status === 'fulfilled') {
  const rawDrivers = toArray(dR.value);

  // 🔎 Log the raw shape once so you can see exactly what field holds the name.
  //    Open DevTools → Console → look for "🔎 Driver object shape".
  if (rawDrivers.length > 0) {
    console.log('🔎 Driver object shape (first):', rawDrivers[0]);
  }

  // ✅ Normalize: every driver gets a `fullName`. All display code
  //    (dropdowns, tables, exports, issue details) already uses
  //    `d.fullName` as the first choice, so this makes them all work.
  setDrivers(rawDrivers.map((d) => {
    const first = d.firstName ?? d.firstname ?? d.first_name ?? d.givenName ?? d.given_name ?? '';
    const last  = d.lastName  ?? d.lastname  ?? d.last_name  ?? d.familyName ?? d.family_name ?? '';

    const resolvedName =
      d.fullName ||
      d.name ||
      d.displayName ||
      d.driverName ||
      d.driver_name ||
      (first && last ? `${first} ${last}`.trim() : '') ||
      (d.surname ? `${first} ${d.surname}`.trim() : '') ||
      (d.initials ? d.initials : '');

    return {
      ...d,
      fullName: resolvedName || `Driver #${d.id}`,   // last-resort fallback
    };
  }));
} else {
  console.error('Error loading drivers:', dR.reason);
  failed.push('drivers');
}
setLoadingDrivers(false);
    if (sR.status === 'fulfilled') setStats(sR.value);
    await Promise.all([loadVehicleIssues(), loadDriverIssues()]);
    if (failed.length > 0) setError(`Failed: ${failed.join(', ')}`);
    setLoading(false);
  };

  const reload = async () => { await loadData(); };

  // ============================================================
  // DIAGNOSTICS
  // ============================================================
  const runDiagnostics = async () => {
    setDiagRunning(true); setDiagResults([]); setDiagDialogOpen(true);
    const out = [];
    const variants = [
      { label: 'GET /inventory/items?page=0&size=100', path: '/inventory/items', params: { page: 0, size: 100 } },
      { label: 'GET /inventory/items?page=1&size=100', path: '/inventory/items', params: { page: 1, size: 100 } },
      { label: 'GET /inventory/items?sort=id,asc', path: '/inventory/items', params: { page: 0, size: 100, sort: 'id,asc' } },
      { label: 'GET /inventory/items?sort=name,asc', path: '/inventory/items', params: { page: 0, size: 100, sort: 'name,asc' } },
      { label: 'GET /inventory/items (no params)', path: '/inventory/items', params: {} },
      { label: 'GET /inventory/items/search?search=', path: '/inventory/items/search', params: { search: '', page: 0, size: 100 } },
      { label: 'GET /inventory/items/consumable', path: '/inventory/items/consumable', params: {} },
      { label: 'GET /inventory/items/low-stock', path: '/inventory/items/low-stock', params: {} },
      { label: 'GET /inventory/stats', path: '/inventory/stats', params: {} },
      { label: 'GET /inventory/locations', path: '/inventory/locations', params: {} },
      { label: 'GET /inventory/movements', path: '/inventory/movements', params: { page: 0, size: 50 } },
    ];
    for (const v of variants) {
      try {
        const res = await api.get(v.path, { params: v.params });
        const body = res?.data ?? res;
        const r = toArray(res);
        out.push({ label: v.label, status: 'success', rowCount: r.length, totalElements: body?.totalElements, size: body?.size, preview: previewOf(body) });
      } catch (err) {
        out.push({ label: v.label, status: 'error', error: err?.response?.data?.detail || err?.message || String(err) });
      }
      setDiagResults([...out]);
    }
    setDiagRunning(false);
  };

  const runMovementDiagnostics = async () => {
    setMovementDiagRunning(true); setMovementDiagOpen(true); setMovementDiag(null);
    try {
      const res = await api.get('/inventory/movements', { params: { page: 0, size: 50, sort: 'createdAt,desc' } });
      const body = res?.data ?? res;
      const r = toArray(res);
      setMovementDiag({ raw: body, rowCount: r.length, preview: previewOf(body), sample: r.slice(0, 5) });
    } catch (err) {
      setMovementDiag({ error: err?.response?.data?.detail || err?.message || String(err), raw: err?.response?.data });
    } finally { setMovementDiagRunning(false); }
  };

  // ============================================================
  // HANDLERS — UI
  // ============================================================
  const handleTabChange = (e, v) => { setActiveTab(v); if (v === 1) loadVehicleIssues(); if (v === 2) loadDriverIssues(); };
  const findItem = (id) => inventoryItems.find(i => i.id === Number(id));
  const showSuccess = (m) => { setSuccess(m); setTimeout(() => setSuccess(null), 4000); };

  // ============================================================
  // ITEM CRUD
  // ============================================================
  const openAddItem = () => {
    setError(null); setSelectedItem(null);
    setFormData({
      sku: '', name: '', category: '', unitOfMeasure: 'EA', isConsumable: true, reorderLevel: 0,
      locationId: locations[0]?.id || '', quantity: 0, unitCost: 0, minLevel: 0,
      isActive: true, notes: '', isDriverIssuable: true, isVehicleIssuable: true,
      returnByDate: '', isHeld: false, holdCode: '', holdDate: '', holdReason: '', heldBy: '',
    });
    setFormErrors({}); setShowAddDialog(true);
  };

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
    if (!window.confirm(`Delete "${item.name}"?`)) return;
    try { await inventoryService.deleteInventoryItem(item.id); showSuccess('Item deleted'); await reload(); }
    catch (err) { setError(errMsg(err, 'Delete failed')); }
  };

  const handleSubmitItem = async () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Required';
    if (!formData.category) errors.category = 'Required';
    if (!formData.locationId) errors.locationId = 'Required';
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;
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
    const wasEditing = Boolean(selectedItem);
    try {
      if (wasEditing) {
        await inventoryService.updateInventoryItem(selectedItem.id, payload);
        showSuccess(`Item "${payload.name}" updated`);
      } else {
        const created = await inventoryService.createInventoryItem(payload);
        showSuccess(`Item "${payload.name}" created. ${created?.id ? `ID=${created.id}` : ''} If the list still shows empty, the backend list endpoint is filtering it out — run Diagnostics.`);
      }
      setShowAddDialog(false);
      await reload();
    } catch (err) { setError(errMsg(err, wasEditing ? 'Update failed' : 'Create failed')); }
    finally { setSubmitting(false); }
  };

  const handleItemChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(p => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
    if (formErrors[name]) setFormErrors(p => ({ ...p, [name]: '' }));
  };

  // ============================================================
  // VEHICLE / DRIVER ISSUE — CREATE
  // ============================================================
  const openVehicleIssueDialog = (item = null) => {
    setError(null); setSelectedItem(item);
    setIssueFormData({ itemId: item?.id || '', vehicleId: '', driverId: '', tripId: '', quantity: 1, condition: 'NEW', notes: '', issueDate: toDTLocal() });
    setShowIssueDialog(true);
  };
  const openDriverIssueDialog = (item = null) => {
    setError(null); setSelectedItem(item);
    setDriverIssueFormData({ driverId: '', quantity: 1, condition: 'NEW', notes: '', issueDate: toDTLocal() });
    setShowDriverIssueDialog(true);
  };
  const handleIssueItem = (item) => openVehicleIssueDialog(item);
  const handleIssueToDriver = (item) => openDriverIssueDialog(item);

  const validateIssue = (itemId, qv, target) => {
    const item = findItem(itemId);
    if (!item) { setError('Select an item'); return null; }
    if (!isIssuable(item, target)) { setError(`${item.name} not issuable to ${target}`); return null; }
    const q = parseWhole(qv);
    if (q === null) { setError('Quantity must be a whole number > 0'); return null; }
    if (q > item.quantity) { setError(`Only ${item.quantity} available`); return null; }
    return { item, qty: q };
  };

  const handleSubmitVehicleIssue = async () => {
    setError(null);
    const c = validateIssue(selectedItem?.id || issueFormData.itemId, issueFormData.quantity, 'vehicle');
    if (!c) return;
    if (!issueFormData.vehicleId || !issueFormData.driverId) { setError('Vehicle + driver required'); return; }
    if (!issueFormData.issueDate) { setError('Issue date required'); return; }
    const iso = fromDTLocal(issueFormData.issueDate);
    if (!iso) { setError('Invalid date'); return; }
    setSubmitting(true);
    try {
      await vehicleIssueService.createVehicleIssue({
        vehicleId: Number(issueFormData.vehicleId), driverId: Number(issueFormData.driverId),
        tripId: issueFormData.tripId ? parseInt(issueFormData.tripId, 10) : null,
        issueDate: iso,
        items: [{ itemId: Number(c.item.id), quantity: c.qty, condition: issueFormData.condition, notes: issueFormData.notes || '' }],
      });
      showSuccess(`Issued ${c.qty} × ${c.item.name} to vehicle`);
      setShowIssueDialog(false); await reload();
    } catch (err) { setError(errMsg(err, 'Issue failed')); }
    finally { setSubmitting(false); }
  };

  const handleSubmitDriverIssue = async () => {
    setError(null);
    const c = validateIssue(selectedItem?.id, driverIssueFormData.quantity, 'driver');
    if (!c) return;
    if (!driverIssueFormData.driverId) { setError('Driver required'); return; }
    if (!driverIssueFormData.issueDate) { setError('Issue date required'); return; }
    const iso = fromDTLocal(driverIssueFormData.issueDate);
    if (!iso) { setError('Invalid date'); return; }
    setSubmitting(true);
    try {
      await vehicleIssueService.createDriverIssue({
        driverId: Number(driverIssueFormData.driverId),
        issueDate: iso,
        items: [{ itemId: Number(c.item.id), quantity: c.qty, condition: driverIssueFormData.condition, notes: driverIssueFormData.notes || '' }],
      });
      showSuccess(`Issued ${c.qty} × ${c.item.name} to driver`);
      setShowDriverIssueDialog(false); await reload();
    } catch (err) { setError(errMsg(err, 'Issue failed')); }
    finally { setSubmitting(false); }
  };

  // ============================================================
  // VEHICLE / DRIVER ISSUE — EDIT (NEW)
  // ============================================================
  const openEditIssue = (issue, type) => {
    setError(null);
    setSelectedIssue(issue);
    setEditIssueType(type);
    setEditIssueForm({
      issueDate: toDTLocal(issue.issueDate || issue.createdAt || new Date()),
      status: issue.status || 'ISSUED',
      notes: issue.notes || '',
      items: (issue.items || []).map(it => ({
        itemId: it.itemId,
        itemName: it.itemName || inventoryItems.find(i => i.id === it.itemId)?.name || `Item #${it.itemId}`,
        quantity: it.quantityIssued ?? it.quantity ?? 0,
        condition: it.condition || 'NEW',
        notes: it.notes || '',
      })),
    });
    setShowEditIssueDialog(true);
  };

 const handleSubmitEditIssue = async () => {
  if (!selectedIssue || !editIssueType) return;
  setError(null);

  const iso = fromDTLocal(editIssueForm.issueDate);
  if (!iso) { setError('Invalid issue date'); return; }

  // ⚠️ The backend PUT reuses the POST DTO, which requires driverId
  // (and vehicleId for vehicle issues). Omitting them causes a 500.
  const basePayload = {
    issueDate: iso,
    status: editIssueForm.status,
    notes: editIssueForm.notes || '',
    items: editIssueForm.items.map(it => ({
      itemId: Number(it.itemId),
      quantity: Number(it.quantity),
      condition: it.condition || 'NEW',
      notes: it.notes || '',
    })),
  };

  const payload = editIssueType === 'driver'
    ? {
        ...basePayload,
        driverId: selectedIssue.driverId,
        tripId: selectedIssue.tripId ?? null,
      }
    : {
        ...basePayload,
        vehicleId: selectedIssue.vehicleId,
        driverId: selectedIssue.driverId,
        tripId: selectedIssue.tripId ?? null,
      };

  console.log(`📤 PUT /inventory/${editIssueType}-issues/${selectedIssue.id}`, payload);

  setSubmitting(true);
  const path = `/inventory/${editIssueType}-issues/${selectedIssue.id}`;
  try {
    await api.put(path, payload);
    showSuccess(`${editIssueType === 'vehicle' ? 'Vehicle' : 'Driver'} issue updated`);
    setShowEditIssueDialog(false);
    await reload();
  } catch (err) {
    const status = err?.response?.status ?? err?.status;
    const detail =
      err?.response?.data?.detail ||
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err?.message ||
      'unknown error';

    // Friendlier fallback: try PATCH with the same payload (some backends
    // expose only PATCH for partial updates)
    if (status === 500 || status === 405) {
      try {
        console.warn(`PUT ${path} failed (${status}) — trying PATCH as fallback`);
        await api.patch(path, payload);
        showSuccess(`${editIssueType === 'vehicle' ? 'Vehicle' : 'Driver'} issue updated (via PATCH)`);
        setShowEditIssueDialog(false);
        await reload();
        return;
      } catch (patchErr) {
        console.warn(`PATCH ${path} also failed:`, patchErr?.message);
      }
    }

    setError(
      `Update failed (${status}): ${detail}. ` +
      `If this keeps failing, check Render → your backend service → Logs for the stack ` +
      `trace at PUT ${path}. The 500 comes from the backend service, not the frontend — ` +
      `the controller may need a proper update DTO that accepts the current issue fields.`
    );
  } finally {
    setSubmitting(false);
  }
};

  const handleDeleteIssueConfirm = async () => {
  if (!deleteIssueTarget) return;
  const { issue, type } = deleteIssueTarget;
  const path = `/inventory/${type}-issues/${issue.id}`;

  setSubmitting(true);
  try {
    await api.delete(path);
    showSuccess(`${type === 'vehicle' ? 'Vehicle' : 'Driver'} issue deleted`);
    setShowDeleteIssueDialog(false);
    setDeleteIssueTarget(null);
    await reload();
  } catch (err) {
    const status = err?.response?.status ?? err?.status;
    const detail =
      err?.response?.data?.detail ||
      err?.response?.data?.message ||
      err?.message ||
      'unknown error';
    setError(
      `Delete failed (${status}): ${detail}. ` +
      `If this returns 404 or 405, the backend has no DELETE endpoint for ` +
      `${type}-issues yet — you'd need to add it to the controller.`
    );
  } finally {
    setSubmitting(false);
  }
};


  // ============================================================
  // RETURNS / SWAPS
  // ============================================================
  const selectReturnLine = (issue, type, line) => {
    const inv = findItem(line?.itemId);
    setSelectedIssue({ ...issue, _type: type });
    setSelectedItem(line ? { ...line, id: line.itemId, itemId: line.itemId, name: inv?.name || line.itemName || 'Unknown', outstanding: outstandingQty(line) } : null);
    setReturnFormData({ itemId: line?.itemId || '', quantity: line ? Math.max(1, outstandingQty(line)) : 1, condition: 'DAMAGED', notes: '' });
  };

  const handleReturnItems = (issue, type = issueTypeOf(issue)) => {
    setError(null); setReturnIssueOptions([]);
    const line = (issue?.items || []).find(l => outstandingQty(l) > 0) || issue?.items?.[0];
    if (!line) { setError('No items'); return; }
    selectReturnLine(issue, type, line);
    setShowReturnDialog(true);
  };

  const handleReceiveItem = async (item) => {
    setError(null);
    const [v, d] = await Promise.all([loadVehicleIssues(), loadDriverIssues()]);
    const opts = [
      ...v.map(i => ({ issue: i, type: 'vehicle' })),
      ...d.map(i => ({ issue: i, type: 'driver' })),
    ].map(({ issue, type }) => ({ issue, type, line: (issue.items || []).find(l => Number(l.itemId) === Number(item.id) && outstandingQty(l) > 0) }))
      .filter(o => o.line && o.issue.status !== 'RETURNED');
    if (opts.length === 0) { setError(`No open issue contains "${item.name}"`); return; }
    setReturnIssueOptions(opts);
    selectReturnLine(opts[0].issue, opts[0].type, opts[0].line);
    setShowReturnDialog(true);
  };

  const handleSubmitReturn = async () => {
    if (!selectedIssue) return;
    setError(null);
    const itemId = Number(returnFormData.itemId || selectedItem?.itemId || selectedItem?.id);
    const line = (selectedIssue.items || []).find(l => Number(l.itemId) === itemId);
    if (!line) { setError('Item not on issue'); return; }
    const qty = parseWhole(returnFormData.quantity);
    if (qty === null) { setError('Quantity must be > 0'); return; }
    if (qty > outstandingQty(line)) { setError(`Only ${outstandingQty(line)} out`); return; }
    setSubmitting(true);
    try {
      const payload = [{ itemId, quantity: qty, condition: returnFormData.condition, notes: returnFormData.notes || '' }];
      if ((selectedIssue._type || issueTypeOf(selectedIssue)) === 'driver') await vehicleIssueService.returnDriverItems(selectedIssue.id, payload);
      else await vehicleIssueService.returnItems(selectedIssue.id, payload);
      showSuccess('Items returned'); setShowReturnDialog(false); await reload();
    } catch (err) { setError(errMsg(err, 'Return failed')); }
    finally { setSubmitting(false); }
  };

  const handleSwap = (issue, type = issueTypeOf(issue)) => {
    const first = (issue?.items || []).find(l => outstandingQty(l) > 0) || issue?.items?.[0];
    if (!first) { setError('No items'); return; }
    setSelectedIssue({ ...issue, _type: type }); setSelectedIssueItem(first);
    setSwapFormData({ oldItemId: first.itemId || '', newItemId: '', newQuantity: 1, returnQuantity: Math.max(1, outstandingQty(first)), damagedCondition: 'DAMAGED', damageNotes: '', issueType: type });
    setShowSwapDialog(true);
  };

  const handleSubmitSwap = async () => {
    const newItem = findItem(swapFormData.newItemId);
    if (!newItem) { setError('Select replacement'); return; }
    const nq = parseWhole(swapFormData.newQuantity);
    const rq = parseWhole(swapFormData.returnQuantity);
    if (nq === null || rq === null) { setError('Quantities > 0'); return; }
    setSubmitting(true);
    try {
      const p = {
        oldItemId: Number(swapFormData.oldItemId), newItemId: Number(newItem.id),
        newQuantity: nq, returnQuantity: rq,
        damagedCondition: swapFormData.damagedCondition,
        damageNotes: swapFormData.damageNotes, condition: swapFormData.damagedCondition,
      };
      if (swapFormData.issueType === 'driver') await vehicleIssueService.swapDriverItem(selectedIssue.id, p);
      else await vehicleIssueService.swapItem(selectedIssue.id, p);
      showSuccess('Item swapped'); setShowSwapDialog(false); await reload();
    } catch (err) { setError(errMsg(err, 'Swap failed')); }
    finally { setSubmitting(false); }
  };

  // ============================================================
  // MOVEMENT
  // ============================================================
  const handleMovement = (item) => {
    setSelectedItem(item);
    setMovementFormData({
      itemId: item.id, quantity: 1, operation: 'ADD', movementType: 'IN',
      reason: '', notes: '', referenceNumber: `MOV-${Date.now()}`,
      referenceType: 'PURCHASE_ORDER', requiresApproval: false, approvalStatus: 'APPROVED',
      performedBy: 'SYSTEM', tripId: null, fuelSlipId: null, approvedBy: null, approvedAt: null,
    });
    setShowMovementDialog(true);
  };

  const handleSubmitMovement = async () => {
    const item = findItem(movementFormData.itemId) || selectedItem;
    if (!item) { setError('Select an item'); return; }
    const OPS = {
      ADD: { movementType: 'IN', referenceType: 'PURCHASE_ORDER' },
      SUBTRACT: { movementType: 'OUT', referenceType: 'ADJUSTMENT' },
      SET: { movementType: 'ADJUSTMENT', referenceType: 'ADJUSTMENT' },
    };
    const op = OPS[movementFormData.operation] || OPS.SET;
    const qty = movementFormData.operation === 'SET'
      ? parseWhole(movementFormData.quantity, { allowZero: true })
      : parseWhole(movementFormData.quantity);
    if (qty === null) { setError('Invalid quantity'); return; }
    if (movementFormData.operation === 'SUBTRACT' && qty > item.quantity) { setError(`Only ${item.quantity} available`); return; }
    if (!movementFormData.reason?.trim()) { setError('Reason required'); return; }
    setSubmitting(true);
    try {
      await inventoryMovementService.recordMovement({
        itemId: Number(item.id), quantity: qty,
        movementType: op.movementType,
        reason: movementFormData.reason.trim(),
        notes: movementFormData.notes || '',
        referenceNumber: movementFormData.referenceNumber || `MOV-${Date.now()}`,
        referenceType: movementFormData.referenceType || op.referenceType,
        requiresApproval: false, approvalStatus: 'APPROVED',
        performedBy: 'SYSTEM', tripId: null, fuelSlipId: null,
        approvedBy: 'SYSTEM', approvedAt: localNowIso(),
      });
      showSuccess('Stock updated'); setShowMovementDialog(false); await reload();
    } catch (err) { setError(errMsg(err, 'Movement failed')); }
    finally { setSubmitting(false); }
  };

  // ============================================================
  // LOCATION CRUD (NEW)
  // ============================================================
  const openAddLocation = () => {
    setEditingLocation(null);
    setLocationForm({ name: '', code: '', address: '', city: '', province: '', zipCode: '', isActive: true });
    setShowLocationDialog(true);
  };

  const openEditLocation = (loc) => {
    setEditingLocation(loc);
    setLocationForm({
      name: loc.name || '',
      code: loc.depotCode || loc.code || '',
      address: loc.fullAddress || loc.address || '',
      city: loc.city || '',
      province: loc.province || '',
      zipCode: loc.zipCode || '',
      isActive: loc.isActive !== false,
    });
    setShowLocationDialog(true);
  };

  const handleSubmitLocation = async () => {
    if (!locationForm.name.trim()) { setError('Location name required'); return; }
    const payload = {
      name: locationForm.name.trim(),
      depotCode: locationForm.code || null,
      fullAddress: locationForm.address || null,
      city: locationForm.city || null,
      province: locationForm.province || null,
      zipCode: locationForm.zipCode || null,
      isActive: locationForm.isActive !== false,
    };
    setSubmitting(true);
    try {
      if (editingLocation) {
        await api.put(`/inventory/locations/${editingLocation.id}`, payload);
        showSuccess(`Location "${payload.name}" updated`);
      } else {
        await api.post('/inventory/locations', payload);
        showSuccess(`Location "${payload.name}" created`);
      }
      setShowLocationDialog(false); await reload();
    } catch (err) { setError(errMsg(err, editingLocation ? 'Update failed' : 'Create failed')); }
    finally { setSubmitting(false); }
  };

  const openDeleteLocation = (loc) => { setDeleteLocationTarget(loc); setShowDeleteLocationDialog(true); };

  const handleDeleteLocationConfirm = async () => {
    if (!deleteLocationTarget) return;
    setSubmitting(true);
    try {
      await api.delete(`/inventory/locations/${deleteLocationTarget.id}`);
      showSuccess('Location deleted');
      setShowDeleteLocationDialog(false);
      setDeleteLocationTarget(null);
      await reload();
    } catch (err) { setError(errMsg(err, 'Delete failed')); }
    finally { setSubmitting(false); }
  };

  // ============================================================
  // DERIVED
  // ============================================================
  const filteredItems = inventoryItems.filter(item => {
    const t = searchTerm.toLowerCase();
    const sm = (item.name || '').toLowerCase().includes(t) || (item.category || '').toLowerCase().includes(t) || (item.sku || '').toLowerCase().includes(t);
    const cm = categoryFilter === 'all' || item.category === categoryFilter;
    let stm = true;
    if (statusFilter !== 'all') {
      const q = item.quantity || 0, m = item.minLevel || 0;
      if (statusFilter === 'In Stock') stm = q > m;
      else if (statusFilter === 'Low Stock') stm = q > 0 && q <= m;
      else if (statusFilter === 'Out of Stock') stm = q <= 0;
    }
    let im = true;
    if (issueableFilter !== 'all') {
      const dr = item.isDriverIssuable !== false, ve = item.isVehicleIssuable !== false;
      if (issueableFilter === 'driver') im = dr && !ve;
      else if (issueableFilter === 'vehicle') im = ve && !dr;
      else if (issueableFilter === 'both') im = dr && ve;
      else if (issueableFilter === 'neither') im = !dr && !ve;
    }
    return sm && cm && stm && im;
  });

  const getCategories = () => Array.from(new Set(inventoryItems.map(i => i.category))).filter(Boolean);

  // Exports
  const buildItemCols = () => [
    { header: 'SKU', value: r => r.sku || '', width: 14 },
    { header: 'Name', value: r => r.name, width: 30 },
    { header: 'Category', value: r => r.category || '', width: 16 },
    { header: 'Quantity', value: r => r.quantity, type: 'number', width: 10 },
    { header: 'Unit', value: r => r.unitOfMeasure || 'EA', width: 8 },
    { header: 'Unit Cost (R)', value: r => Number(r.unitCost) || 0, type: 'number', decimals: 2, width: 14 },
    { header: 'Min Level', value: r => r.minLevel, type: 'number', width: 10 },
    { header: 'Location', value: r => locations.find(l => l.id === r.locationId)?.name || 'N/A', width: 18 },
  ];

  const exportItemsCsv = () => { if (!filteredItems.length) { setError('No items'); return; } exportCsv('inventory-items', buildItemCols(), filteredItems); showSuccess(`Exported ${filteredItems.length}`); };
  const exportItemsXlsx = () => { if (!filteredItems.length) { setError('No items'); return; } exportXlsx('inventory-items', buildItemCols(), filteredItems, 'Items'); showSuccess(`Exported ${filteredItems.length}`); };
  const exportItemsPdf = () => { if (!filteredItems.length) { setError('No items'); return; } const w = window.open('', '_blank'); if (!w) { setError('Allow popups'); return; } printToPdf(w, 'Inventory', buildItemCols(), filteredItems, `${new Date().toLocaleString()}`); };

  const anyDialogOpen = showAddDialog || showIssueDialog || showDriverIssueDialog || showReturnDialog || showSwapDialog || showMovementDialog || showLocationDialog || showEditIssueDialog || showDeleteIssueDialog || showDeleteLocationDialog;

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
    <Box sx={{ bgcolor: '#F7F7FC', minHeight: '100vh', p: { xs: 1.5, sm: 2, md: 2.5, lg: 3 } }}>
      <Box sx={{ maxWidth: '1600px', margin: '0 auto', width: '100%' }}>

        {/* ENV BANNER */}
        <Alert severity={inventoryItems.length === 0 ? 'warning' : 'success'} icon={false}
          sx={{ mb: 1.5, borderRadius: '10px', fontSize: '0.72rem', py: 0.5 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={{ xs: 0.5, md: 2 }} flexWrap="wrap" useFlexGap alignItems={{ xs: 'flex-start', md: 'center' }}>
            <Typography variant="caption" sx={{ fontSize: '0.7rem', fontWeight: 600 }}>🌐 <code>{window.location.hostname}</code></Typography>
            <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>API: <code>{getApiBase()}</code></Typography>
            <Typography variant="caption" sx={{ fontSize: '0.7rem', fontWeight: 600 }}>
              Items: <strong>{inventoryItems.length}</strong>
              {rawItemsResponse && <span style={{ color: '#6B7280', fontWeight: 400, marginLeft: 4 }}>(server totalElements={rawItemsResponse?.data?.totalElements ?? rawItemsResponse?.totalElements ?? '?'})</span>}
            </Typography>
            <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>Locations: <strong>{locations.length}</strong></Typography>
            <Button size="small" variant="outlined" color={inventoryItems.length === 0 ? 'warning' : 'primary'} startIcon={<BugReportIcon sx={{ fontSize: '0.9rem' }} />} onClick={runDiagnostics}
              sx={{ borderRadius: '8px', fontSize: '0.68rem', textTransform: 'none', py: 0.25, px: 1 }}>
              Run Diagnostics
            </Button>
            {endpointDiagnostics.length > 0 && (
              <Button size="small" variant="text" endIcon={diagOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />} onClick={() => setDiagOpen(!diagOpen)}
                sx={{ fontSize: '0.68rem', textTransform: 'none', py: 0.25, px: 1 }}>
                {diagOpen ? 'Hide' : 'Show'} endpoints
              </Button>
            )}
          </Stack>
        </Alert>

        <Collapse in={diagOpen && endpointDiagnostics.length > 0}>
          <Paper sx={{ mb: 2, p: 1.5, borderRadius: '10px', border: '1px solid #FEF3C7', bgcolor: '#FFFBEB' }}>
            <Table size="small">
              <TableHead><TableRow>
                <TableCell sx={{ fontSize: '0.62rem', fontWeight: 600 }}>Endpoint</TableCell>
                <TableCell sx={{ fontSize: '0.62rem', fontWeight: 600 }} align="right">Rows</TableCell>
                <TableCell sx={{ fontSize: '0.62rem', fontWeight: 600 }} align="right">totalElements</TableCell>
                <TableCell sx={{ fontSize: '0.62rem', fontWeight: 600 }}>Error</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {endpointDiagnostics.map((d, i) => (
                  <TableRow key={i}>
                    <TableCell sx={{ fontSize: '0.65rem', py: 0.4 }}>{d.variant}</TableCell>
                    <TableCell sx={{ fontSize: '0.65rem', py: 0.4 }} align="right">{d.rowCount ?? '-'}</TableCell>
                    <TableCell sx={{ fontSize: '0.65rem', py: 0.4 }} align="right">{d.totalElements ?? '-'}</TableCell>
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
            <Typography variant="h5" fontWeight="700" sx={{ fontSize: { xs: '1.1rem', sm: '1.3rem', md: '1.4rem' } }}>Inventory Management</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem' } }}>Full CRUD — Items, Locations, Vehicle + Driver Issues, Movements</Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadData} size="small" sx={{ borderRadius: '10px', fontSize: '0.75rem', textTransform: 'none', py: 0.5, px: 1.5 }}>Refresh</Button>
          </Stack>
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: '12px', fontSize: '0.8rem' }} onClose={() => setError(null)}>{error}</Alert>}
        <Snackbar open={!!error && anyDialogOpen} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
          <Alert severity="error" variant="filled" onClose={() => setError(null)} sx={{ fontSize: '0.8rem', maxWidth: 640 }}>{error}</Alert>
        </Snackbar>
        {success && <Alert severity="success" sx={{ mb: 2, borderRadius: '12px', fontSize: '0.8rem' }} onClose={() => setSuccess(null)}>{success}</Alert>}

        {/* Tabs — NEW: Locations tab inserted */}
        <Paper elevation={0} sx={{ mb: 3, borderRadius: '16px', border: '1px solid #ECECEC', bgcolor: '#FFFFFF', overflow: 'hidden' }}>
          <Tabs value={activeTab} onChange={handleTabChange} sx={{ minHeight: 36 }} variant="scrollable" scrollButtons="auto">
            <Tab label="Items" icon={<InventoryIcon sx={{ fontSize: '0.9rem' }} />} iconPosition="start" sx={{ fontSize: '0.75rem', minHeight: 36, textTransform: 'none' }} />
            <Tab label={`Locations (${locations.length})`} icon={<WarehouseIcon sx={{ fontSize: '0.9rem' }} />} iconPosition="start" sx={{ fontSize: '0.75rem', minHeight: 36, textTransform: 'none' }} />
            <Tab label={`Vehicle Issues (${vehicleIssues.length})`} icon={<DirectionsCar sx={{ fontSize: '0.9rem' }} />} iconPosition="start" sx={{ fontSize: '0.75rem', minHeight: 36, textTransform: 'none' }} />
            <Tab label={`Driver Issues (${driverIssues.length})`} icon={<Person sx={{ fontSize: '0.9rem' }} />} iconPosition="start" sx={{ fontSize: '0.75rem', minHeight: 36, textTransform: 'none' }} />
            <Tab label="Stock Movements" icon={<SwapHoriz sx={{ fontSize: '0.9rem' }} />} iconPosition="start" sx={{ fontSize: '0.75rem', minHeight: 36, textTransform: 'none' }} />
            <Tab label="Stock on Hand" icon={<LocationOn sx={{ fontSize: '0.9rem' }} />} iconPosition="start" sx={{ fontSize: '0.75rem', minHeight: 36, textTransform: 'none' }} />
          </Tabs>
        </Paper>

        {/* TAB 0: ITEMS */}
        <TabPanel value={activeTab} index={0}>
          <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: '16px', border: '1px solid #ECECEC', bgcolor: '#FFFFFF' }}>
            <Grid container spacing={1.5} alignItems="center">
              <Grid size={{ xs: 12, md: 3 }}><TextField fullWidth placeholder="Search..." size="small" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                sx={{ '& .MuiInputBase-root': { fontSize: '0.75rem', borderRadius: '10px' } }}
                InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: '0.9rem' }} /></InputAdornment> }} /></Grid>
              <Grid size={{ xs: 12, sm: 6, md: 2 }}><FormControl fullWidth size="small"><InputLabel sx={{ fontSize: '0.75rem' }}>Category</InputLabel>
                <Select value={categoryFilter} label="Category" onChange={e => setCategoryFilter(e.target.value)} sx={{ fontSize: '0.75rem', borderRadius: '10px' }}>
                  <MenuItem value="all">All</MenuItem>
                  {getCategories().map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                </Select></FormControl></Grid>
              <Grid size={{ xs: 12, sm: 6, md: 2 }}><FormControl fullWidth size="small"><InputLabel sx={{ fontSize: '0.75rem' }}>Status</InputLabel>
                <Select value={statusFilter} label="Status" onChange={e => setStatusFilter(e.target.value)} sx={{ fontSize: '0.75rem', borderRadius: '10px' }}>
                  <MenuItem value="all">All</MenuItem><MenuItem value="In Stock">In Stock</MenuItem><MenuItem value="Low Stock">Low Stock</MenuItem><MenuItem value="Out of Stock">Out of Stock</MenuItem>
                </Select></FormControl></Grid>
              <Grid size={{ xs: 12, sm: 6, md: 2 }}><FormControl fullWidth size="small"><InputLabel sx={{ fontSize: '0.75rem' }}>Issueable</InputLabel>
                <Select value={issueableFilter} label="Issueable" onChange={e => setIssueableFilter(e.target.value)} sx={{ fontSize: '0.75rem', borderRadius: '10px' }}>
                  <MenuItem value="all">All</MenuItem><MenuItem value="both">Both</MenuItem><MenuItem value="driver">Driver</MenuItem><MenuItem value="vehicle">Vehicle</MenuItem><MenuItem value="neither">Neither</MenuItem>
                </Select></FormControl></Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <Stack direction="row" spacing={0.75} alignItems="center">
                  <ExportMenu disabled={filteredItems.length === 0} onCsv={exportItemsCsv} onXlsx={exportItemsXlsx} onPdf={exportItemsPdf} />
                  <Button variant="contained" startIcon={<Add />} onClick={openAddItem} size="small"
                    sx={{ fontSize: '0.75rem', py: 0.5, flex: 1, borderRadius: '10px', textTransform: 'none', background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)' }}>Add Item</Button>
                </Stack>
              </Grid>
            </Grid>
          </Paper>

          <Grid container spacing={2} sx={{ mb: 3, width: '100%', margin: 0 }}>
            <Grid size={{ xs: 6, sm: 3 }}><StatCard title="Total" value={inventoryItems.length} icon={InventoryIcon} color="primary" /></Grid>
            <Grid size={{ xs: 6, sm: 3 }}><StatCard title="Low Stock" value={inventoryItems.filter(i => i.quantity > 0 && i.quantity <= i.minLevel).length} icon={WarningIcon} color="warning" /></Grid>
            <Grid size={{ xs: 6, sm: 3 }}><StatCard title="Out" value={inventoryItems.filter(i => i.quantity <= 0).length} icon={CancelIcon} color="error" /></Grid>
            <Grid size={{ xs: 6, sm: 3 }}><StatCard title="Locations" value={locations.length} icon={WarehouseIcon} color="info" /></Grid>
          </Grid>

          <Paper elevation={0} sx={{ borderRadius: '16px', border: '1px solid #ECECEC', bgcolor: '#FFFFFF', overflow: 'hidden' }}>
            <TableContainer>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#F9FAFB' }}>
                  <TableRow>{['SKU', 'Item', 'Category', 'Qty', 'Flags', 'Min', 'Location', 'Status', 'Actions'].map(h => (
                    <TableCell key={h} sx={{ fontSize: '0.65rem', fontWeight: 600, color: '#6B7280', py: 1.5 }}>{h}</TableCell>
                  ))}</TableRow>
                </TableHead>
                <TableBody>
                  {filteredItems.length === 0 ? (
                    <TableRow><TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                      <InventoryIcon sx={{ fontSize: 48, color: '#D1D5DB', mb: 2 }} />
                      <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                        {searchTerm || categoryFilter !== 'all' || statusFilter !== 'all' || issueableFilter !== 'all'
                          ? 'No items match filters' : 'No inventory items found'}
                      </Typography>
                      {!searchTerm && categoryFilter === 'all' && statusFilter === 'all' && issueableFilter === 'all' && (
                        <Stack direction="row" spacing={1} justifyContent="center">
                          <Button variant="contained" size="small" startIcon={<Add />} onClick={openAddItem}
                            sx={{ borderRadius: '8px', textTransform: 'none', fontSize: '0.72rem', background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)' }}>
                            Create First Item
                          </Button>
                          <Button variant="outlined" size="small" startIcon={<BugReportIcon />} onClick={runDiagnostics}
                            sx={{ borderRadius: '8px', textTransform: 'none', fontSize: '0.72rem' }}>
                            Run Diagnostics
                          </Button>
                        </Stack>
                      )}
                    </TableCell></TableRow>
                  ) : filteredItems.map(item => (
                    <InventoryItemRow key={item.id} item={item} locations={locations}
                      onView={i => { setSelectedItem(i); setShowViewDialog(true); }}
                      onEdit={handleEdit} onDelete={handleDelete}
                      onIssue={handleIssueItem} onReceive={handleReceiveItem}
                      onIssueToDriver={handleIssueToDriver} onMovement={handleMovement} />
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </TabPanel>

        {/* TAB 1: LOCATIONS (NEW) */}
        <TabPanel value={activeTab} index={1}>
          <Paper elevation={0} sx={{ p: 2, mb: 2, borderRadius: '16px', border: '1px solid #ECECEC', bgcolor: '#FFFFFF' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Inventory Locations <Chip label={locations.length} size="small" sx={{ ml: 1 }} /></Typography>
              <Button variant="contained" size="small" startIcon={<Add />} onClick={openAddLocation}
                sx={{ borderRadius: '10px', textTransform: 'none', fontSize: '0.75rem', background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)' }}>
                New Location
              </Button>
            </Stack>
          </Paper>
          <Paper elevation={0} sx={{ borderRadius: '16px', border: '1px solid #ECECEC', bgcolor: '#FFFFFF', overflow: 'hidden' }}>
            <TableContainer>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#F9FAFB' }}>
                  <TableRow>{['Name', 'Code', 'Address', 'City', 'Province', 'Items', 'Actions'].map(h => (
                    <TableCell key={h} sx={{ fontSize: '0.65rem', fontWeight: 600, color: '#6B7280', py: 1.5 }}>{h}</TableCell>
                  ))}</TableRow>
                </TableHead>
                <TableBody>
                  {locations.length === 0 ? (
                    <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <WarehouseIcon sx={{ fontSize: 48, color: '#D1D5DB', mb: 2 }} />
                      <Typography color="text.secondary" sx={{ fontSize: '0.85rem', mb: 1 }}>No locations yet</Typography>
                      <Button variant="contained" size="small" startIcon={<Add />} onClick={openAddLocation}
                        sx={{ borderRadius: '8px', textTransform: 'none', fontSize: '0.72rem', background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)' }}>
                        Create First Location
                      </Button>
                    </TableCell></TableRow>
                  ) : locations.map(loc => (
                    <LocationRow key={loc.id} location={loc}
                      itemCount={inventoryItems.filter(i => i.locationId === loc.id).length}
                      onEdit={openEditLocation} onDelete={openDeleteLocation} />
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </TabPanel>

        {/* TAB 2: VEHICLE ISSUES */}
        <TabPanel value={activeTab} index={2}>
          <Paper elevation={0} sx={{ p: 2, mb: 2, borderRadius: '16px', border: '1px solid #ECECEC', bgcolor: '#FFFFFF' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Vehicle Issues <Chip label={vehicleIssues.length} size="small" sx={{ ml: 1 }} /></Typography>
              <Button variant="contained" size="small" startIcon={<Add />} onClick={() => openVehicleIssueDialog()}
                sx={{ borderRadius: '10px', textTransform: 'none', fontSize: '0.75rem', background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)' }}>
                New Issue
              </Button>
            </Stack>
          </Paper>
          <Paper elevation={0} sx={{ borderRadius: '16px', border: '1px solid #ECECEC', bgcolor: '#FFFFFF', overflow: 'hidden' }}>
            {loadingIssues ? <Box py={4} textAlign="center"><CircularProgress size={30} /></Box>
              : vehicleIssues.length === 0 ? (
                <Box py={4} textAlign="center">
                  <DirectionsCar sx={{ fontSize: 48, color: '#D1D5DB', mb: 2 }} />
                  <Typography color="text.secondary" sx={{ fontSize: '0.85rem' }}>No vehicle issues</Typography>
                </Box>
              ) : (
                <TableContainer><Table size="small">
                  <TableHead sx={{ bgcolor: '#F9FAFB' }}><TableRow>
                    {['Issue #', 'Vehicle', 'Driver', 'Item', 'Date', 'Status', 'Actions'].map(h => (
                      <TableCell key={h} sx={{ fontSize: '0.65rem', fontWeight: 600, color: '#6B7280', py: 1.5 }}>{h}</TableCell>
                    ))}
                  </TableRow></TableHead>
                  <TableBody>
                    {vehicleIssues.map(issue => (
                      <VehicleIssueRow key={issue.id} issue={issue}
                        onView={i => { setSelectedIssue(i); setShowIssueDetailsDialog(true); }}
                        onEdit={i => openEditIssue(i, 'vehicle')}
                        onDelete={i => openDeleteIssue(i, 'vehicle')}
                        onReturn={i => handleReturnItems(i, 'vehicle')}
                        onSwap={i => handleSwap(i, 'vehicle')}
                        vehicles={vehicles} drivers={drivers} inventoryItems={inventoryItems} />
                    ))}
                  </TableBody>
                </Table></TableContainer>
              )}
          </Paper>
        </TabPanel>

        {/* TAB 3: DRIVER ISSUES */}
        <TabPanel value={activeTab} index={3}>
          <Paper elevation={0} sx={{ p: 2, mb: 2, borderRadius: '16px', border: '1px solid #ECECEC', bgcolor: '#FFFFFF' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Driver Issues <Chip label={driverIssues.length} size="small" sx={{ ml: 1 }} /></Typography>
              <Button variant="contained" size="small" startIcon={<Add />} onClick={() => openDriverIssueDialog()}
                sx={{ borderRadius: '10px', textTransform: 'none', fontSize: '0.75rem', background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)' }}>
                New Driver Issue
              </Button>
            </Stack>
          </Paper>
          <Paper elevation={0} sx={{ borderRadius: '16px', border: '1px solid #ECECEC', bgcolor: '#FFFFFF', overflow: 'hidden' }}>
            {loadingIssues ? <Box py={4} textAlign="center"><CircularProgress size={30} /></Box>
              : driverIssues.length === 0 ? (
                <Box py={4} textAlign="center">
                  <Person sx={{ fontSize: 48, color: '#D1D5DB', mb: 2 }} />
                  <Typography color="text.secondary" sx={{ fontSize: '0.85rem' }}>No driver issues</Typography>
                </Box>
              ) : (
                <TableContainer><Table size="small">
                  <TableHead sx={{ bgcolor: '#F9FAFB' }}><TableRow>
                    {['Issue #', 'Driver', 'Item', 'Date', 'Status', 'Actions'].map(h => (
                      <TableCell key={h} sx={{ fontSize: '0.65rem', fontWeight: 600, color: '#6B7280', py: 1.5 }}>{h}</TableCell>
                    ))}
                  </TableRow></TableHead>
                  <TableBody>
                    {driverIssues.map(issue => (
                      <DriverIssueRow key={issue.id} issue={issue}
                        onView={i => { setSelectedIssue(i); setShowIssueDetailsDialog(true); }}
                        onEdit={i => openEditIssue(i, 'driver')}
                        onDelete={i => openDeleteIssue(i, 'driver')}
                        onReturn={i => handleReturnItems(i, 'driver')}
                        onSwap={i => handleSwap(i, 'driver')}
                        drivers={drivers} inventoryItems={inventoryItems} />
                    ))}
                  </TableBody>
                </Table></TableContainer>
              )}
          </Paper>
        </TabPanel>

        {/* TAB 4: MOVEMENTS */}
        <TabPanel value={activeTab} index={4}>
          <Paper elevation={0} sx={{ p: 1.5, mb: 2, borderRadius: '10px', border: '1px solid #ECECEC' }}>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
              <Typography variant="caption" sx={{ fontSize: '0.72rem', fontWeight: 600 }}>Stock Movements</Typography>
              <Button size="small" variant="outlined" startIcon={<BugReportIcon />} onClick={runMovementDiagnostics}
                sx={{ borderRadius: '8px', fontSize: '0.68rem', textTransform: 'none', py: 0.25, px: 1 }}>Diagnose</Button>
              <Button size="small" variant="text" endIcon={movementDiagOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />} onClick={() => setMovementDiagOpen(!movementDiagOpen)}
                sx={{ fontSize: '0.68rem', textTransform: 'none' }}>
                {movementDiagOpen ? 'Hide' : 'Show'} raw response
              </Button>
            </Stack>
            <Collapse in={movementDiagOpen}>
              <Box sx={{ mt: 1.5 }}>
                {movementDiagRunning && <LinearProgress />}
                {movementDiag && (
                  movementDiag.error
                    ? <Alert severity="error" sx={{ fontSize: '0.72rem' }}>{movementDiag.error}</Alert>
                    : <Alert severity={movementDiag.rowCount > 0 ? 'success' : 'warning'} sx={{ fontSize: '0.72rem' }}>
                        <strong>{movementDiag.rowCount} movement(s)</strong> extracted
                        {movementDiag.rowCount === 0 && ' — MovementHistory will show nothing'}
                        <Typography component="pre" sx={{ mt: 1, p: 1, bgcolor: '#F9FAFB', borderRadius: 1, fontSize: '0.62rem', maxHeight: 140, overflow: 'auto', whiteSpace: 'pre-wrap' }}>
                          {movementDiag.preview}
                        </Typography>
                      </Alert>
                )}
              </Box>
            </Collapse>
          </Paper>
          <SafeSection label="Movement History"><MovementHistory /></SafeSection>
        </TabPanel>

        {/* TAB 5: SOH */}
        <TabPanel value={activeTab} index={5}>
          <SafeSection label="Stock on Hand"><StockOnHand /></SafeSection>
        </TabPanel>

        {/* ============================================================
            DIALOGS
            ============================================================ */}

        {/* Diagnostics dialog */}
        <Dialog open={diagDialogOpen} onClose={() => setDiagDialogOpen(false)} maxWidth="lg" fullWidth>
          <DialogTitle><Stack direction="row" spacing={1} alignItems="center"><BugReportIcon color="warning" /><Typography sx={{ fontWeight: 600, fontSize: '1rem' }}>Environment Diagnostics</Typography></Stack></DialogTitle>
          <DialogContent>
            <Alert severity="info" sx={{ mb: 2, fontSize: '0.78rem' }}>
              <strong>Frontend:</strong> <code>{window.location.hostname}</code> · <strong>API:</strong> <code>{getApiBase()}</code>
            </Alert>
            {diagRunning && <LinearProgress sx={{ mb: 2 }} />}
            <Table size="small">
              <TableHead><TableRow>
                {['Endpoint', 'Status', 'Rows', 'totalElements', 'size', 'Preview / Error'].map(h => (
                  <TableCell key={h} sx={{ fontWeight: 600, fontSize: '0.7rem' }}>{h}</TableCell>
                ))}
              </TableRow></TableHead>
              <TableBody>
                {diagResults.map((r, i) => (
                  <TableRow key={i}>
                    <TableCell sx={{ fontSize: '0.72rem', py: 0.4 }}>{r.label}</TableCell>
                    <TableCell sx={{ py: 0.4 }}><Chip label={r.status} size="small" color={r.status === 'success' ? 'success' : 'error'} sx={{ height: 16, fontSize: '0.6rem' }} /></TableCell>
                    <TableCell sx={{ fontSize: '0.72rem', py: 0.4 }} align="right">{r.rowCount ?? '-'}</TableCell>
                    <TableCell sx={{ fontSize: '0.72rem', py: 0.4 }} align="right">{r.totalElements ?? '-'}</TableCell>
                    <TableCell sx={{ fontSize: '0.72rem', py: 0.4 }} align="right">{r.size ?? '-'}</TableCell>
                    <TableCell sx={{ fontSize: '0.6rem', py: 0.4, maxWidth: 320, wordBreak: 'break-all' }}>{r.error || r.preview || ''}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDiagDialogOpen(false)}>Close</Button>
            <Button variant="contained" onClick={runDiagnostics} disabled={diagRunning}>{diagRunning ? 'Running…' : 'Run Again'}</Button>
          </DialogActions>
        </Dialog>

        {/* Add/Edit Item — trimmed for brevity; same fields as before */}
        <Dialog open={showAddDialog} onClose={() => setShowAddDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle sx={{ py: 1.5, px: 2.5, borderBottom: 1, borderColor: 'divider', bgcolor: '#F8FAFC', display: 'flex', justifyContent: 'space-between' }}>
            <Typography sx={{ fontWeight: 600, fontSize: '1rem' }}>{selectedItem ? 'Edit Item' : 'Add Item'}</Typography>
            <IconButton size="small" onClick={() => setShowAddDialog(false)}><CloseIcon /></IconButton>
          </DialogTitle>
          <DialogContent sx={{ p: 2.5 }}>
            <Grid container spacing={2} sx={{ mt: 0 }}>
              <Grid size={{ xs: 12, sm: 6 }}><TextField label="SKU" name="sku" value={formData.sku} onChange={handleItemChange} fullWidth size="small" /></Grid>
              <Grid size={{ xs: 12, sm: 6 }}><TextField label="Name *" name="name" value={formData.name} onChange={handleItemChange} fullWidth size="small" error={!!formErrors.name} helperText={formErrors.name} /></Grid>
              <Grid size={{ xs: 12, sm: 6 }}><TextField label="Category *" name="category" value={formData.category} onChange={handleItemChange} fullWidth size="small" error={!!formErrors.category} helperText={formErrors.category} /></Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth size="small"><InputLabel>Unit</InputLabel>
                  <Select name="unitOfMeasure" value={formData.unitOfMeasure} onChange={handleItemChange} label="Unit">
                    {['EA', 'LITER', 'KG', 'M', 'BOX', 'SET', 'PK', 'ROLL'].map(u => <MenuItem key={u} value={u}>{u}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}><TextField label="Quantity *" name="quantity" type="number" value={formData.quantity} onChange={handleItemChange} fullWidth size="small" /></Grid>
              <Grid size={{ xs: 12, sm: 4 }}><TextField label="Min Level" name="minLevel" type="number" value={formData.minLevel} onChange={handleItemChange} fullWidth size="small" /></Grid>
              <Grid size={{ xs: 12, sm: 4 }}><TextField label="Unit Cost (R)" name="unitCost" type="number" value={formData.unitCost} onChange={handleItemChange} fullWidth size="small" /></Grid>
              <Grid size={{ xs: 12, sm: 6 }}><TextField label="Reorder Level" name="reorderLevel" type="number" value={formData.reorderLevel} onChange={handleItemChange} fullWidth size="small" /></Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth size="small" error={!!formErrors.locationId}><InputLabel>Location *</InputLabel>
                  <Select name="locationId" value={formData.locationId} onChange={handleItemChange} label="Location *">
                    {locations.map(l => <MenuItem key={l.id} value={l.id}>{l.name}</MenuItem>)}
                  </Select>
                  {formErrors.locationId && <Typography variant="caption" color="error">{formErrors.locationId}</Typography>}
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12 }}><Divider><Typography variant="caption">Flags</Typography></Divider></Grid>
              <Grid size={{ xs: 6, sm: 3 }}><FormControlLabel control={<Checkbox name="isConsumable" checked={formData.isConsumable} onChange={handleItemChange} size="small" />} label="Consumable" /></Grid>
              <Grid size={{ xs: 6, sm: 3 }}><FormControlLabel control={<Checkbox name="isDriverIssuable" checked={formData.isDriverIssuable} onChange={handleItemChange} size="small" />} label="Driver Issuable" /></Grid>
              <Grid size={{ xs: 6, sm: 3 }}><FormControlLabel control={<Checkbox name="isVehicleIssuable" checked={formData.isVehicleIssuable} onChange={handleItemChange} size="small" />} label="Vehicle Issuable" /></Grid>
              <Grid size={{ xs: 6, sm: 3 }}><FormControlLabel control={<Checkbox name="isActive" checked={formData.isActive} onChange={handleItemChange} size="small" />} label="Active" /></Grid>
              <Grid size={{ xs: 12 }}><TextField label="Notes" name="notes" value={formData.notes} onChange={handleItemChange} fullWidth size="small" multiline rows={2} /></Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 2.5, py: 1.5, borderTop: 1, borderColor: 'divider' }}>
            <Button onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleSubmitItem} disabled={submitting} startIcon={<SaveIcon />}
              sx={{ background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)', textTransform: 'none' }}>
              {submitting ? 'Saving…' : (selectedItem ? 'Update' : 'Create')}
            </Button>
          </DialogActions>
        </Dialog>

        {/* View Item */}
        <Dialog open={showViewDialog} onClose={() => setShowViewDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>{selectedItem?.name}</DialogTitle>
          <DialogContent>
            {selectedItem && (
              <Grid container spacing={2}>
                <Grid size={{ xs: 6 }}><Typography variant="caption" color="text.secondary">SKU</Typography><Typography>{selectedItem.sku || 'N/A'}</Typography></Grid>
                <Grid size={{ xs: 6 }}><Typography variant="caption" color="text.secondary">Qty</Typography><Typography>{selectedItem.quantity}</Typography></Grid>
                <Grid size={{ xs: 6 }}><Typography variant="caption" color="text.secondary">Category</Typography><Typography>{selectedItem.category}</Typography></Grid>
                <Grid size={{ xs: 6 }}><Typography variant="caption" color="text.secondary">Location</Typography><Typography>{locations.find(l => l.id === selectedItem.locationId)?.name || 'N/A'}</Typography></Grid>
              </Grid>
            )}
          </DialogContent>
          <DialogActions><Button onClick={() => setShowViewDialog(false)}>Close</Button></DialogActions>
        </Dialog>

        {/* Issue Details */}
        <Dialog open={showIssueDetailsDialog} onClose={() => setShowIssueDetailsDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>{selectedIssue?.issueNumber || `Issue #${selectedIssue?.id}`}</DialogTitle>
          <DialogContent>
            {selectedIssue && (<>
              <Typography variant="caption" color="text.secondary">Issue Date</Typography>
              <Typography sx={{ mb: 2 }}>{(() => { const d = resolveIssueDate(selectedIssue); return d ? new Date(d).toLocaleString() : 'N/A'; })()}</Typography>
              <TableContainer><Table size="small">
                <TableHead><TableRow>
                  <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600 }}>Item</TableCell>
                  <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600 }}>Qty</TableCell>
                  <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600 }}>Condition</TableCell>
                </TableRow></TableHead>
                <TableBody>{selectedIssue.items?.map((it, i) => (
                  <TableRow key={i}>
                    <TableCell sx={{ fontSize: '0.75rem' }}>{it.itemName || inventoryItems.find(x => x.id === it.itemId)?.name || `#${it.itemId}`}</TableCell>
                    <TableCell sx={{ fontSize: '0.75rem' }}>{it.quantityIssued ?? it.quantity ?? 0}</TableCell>
                    <TableCell sx={{ fontSize: '0.75rem' }}>{it.condition || '-'}</TableCell>
                  </TableRow>
                ))}</TableBody>
              </Table></TableContainer>
            </>)}
          </DialogContent>
          <DialogActions><Button onClick={() => setShowIssueDetailsDialog(false)}>Close</Button></DialogActions>
        </Dialog>

        {/* Vehicle Issue Create */}
        <Dialog open={showIssueDialog} onClose={() => setShowIssueDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Issue to Vehicle</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <FormControl fullWidth size="small"><InputLabel>Item</InputLabel>
                <Select value={selectedItem?.id || issueFormData.itemId || ''} onChange={e => { const it = inventoryItems.find(i => i.id === e.target.value); setSelectedItem(it); setIssueFormData(p => ({ ...p, itemId: e.target.value, quantity: 1 })); }} label="Item">
                  {inventoryItems.filter(i => isIssuable(i, 'vehicle')).map(i => <MenuItem key={i.id} value={i.id} disabled={i.quantity <= 0}>{i.name} ({i.quantity})</MenuItem>)}
                </Select>
              </FormControl>
              {selectedItem && (<>
                <TextField label="Issue Date & Time" type="datetime-local" value={issueFormData.issueDate} onChange={e => setIssueFormData(p => ({ ...p, issueDate: e.target.value }))} fullWidth size="small" InputLabelProps={{ shrink: true }} />
                <FormControl fullWidth size="small"><InputLabel>Vehicle</InputLabel>
                  <Select value={issueFormData.vehicleId} onChange={e => setIssueFormData(p => ({ ...p, vehicleId: e.target.value }))} label="Vehicle">
                    {vehicles.map(v => <MenuItem key={v.id} value={v.id}>{v.registrationNumber || `#${v.id}`}</MenuItem>)}
                  </Select>
                </FormControl>
                <FormControl fullWidth size="small"><InputLabel>Driver</InputLabel>
                  <Select value={issueFormData.driverId} onChange={e => setIssueFormData(p => ({ ...p, driverId: e.target.value }))} label="Driver">
                    {drivers.map(d => <MenuItem key={d.id} value={d.id}>{d.fullName || `${d.firstName || ''} ${d.lastName || ''}`.trim() || `#${d.id}`}</MenuItem>)}
                  </Select>
                </FormControl>
                <TextField label="Quantity" type="number" value={issueFormData.quantity} onChange={e => setIssueFormData(p => ({ ...p, quantity: e.target.value }))} fullWidth size="small" />
                <TextField label="Notes" value={issueFormData.notes} onChange={e => setIssueFormData(p => ({ ...p, notes: e.target.value }))} fullWidth size="small" multiline rows={2} />
              </>)}
            </Stack>
          </DialogContent>
          <DialogActions><Button onClick={() => setShowIssueDialog(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleSubmitVehicleIssue} disabled={submitting}>Issue</Button>
          </DialogActions>
        </Dialog>

        {/* Driver Issue Create */}
        <Dialog open={showDriverIssueDialog} onClose={() => setShowDriverIssueDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Issue to Driver</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <FormControl fullWidth size="small"><InputLabel>Item</InputLabel>
                <Select value={selectedItem?.id || ''} onChange={e => { const it = inventoryItems.find(i => i.id === e.target.value); setSelectedItem(it); setDriverIssueFormData(p => ({ ...p, quantity: 1 })); }} label="Item">
                  {inventoryItems.filter(i => isIssuable(i, 'driver')).map(i => <MenuItem key={i.id} value={i.id} disabled={i.quantity <= 0}>{i.name} ({i.quantity})</MenuItem>)}
                </Select>
              </FormControl>
              {selectedItem && (<>
                <TextField label="Issue Date & Time" type="datetime-local" value={driverIssueFormData.issueDate} onChange={e => setDriverIssueFormData(p => ({ ...p, issueDate: e.target.value }))} fullWidth size="small" InputLabelProps={{ shrink: true }} />
                <FormControl fullWidth size="small"><InputLabel>Driver</InputLabel>
                  <Select value={driverIssueFormData.driverId} onChange={e => setDriverIssueFormData(p => ({ ...p, driverId: e.target.value }))} label="Driver">
                    {drivers.map(d => <MenuItem key={d.id} value={d.id}>{d.fullName || `${d.firstName || ''} ${d.lastName || ''}`.trim() || `#${d.id}`}</MenuItem>)}
                  </Select>
                </FormControl>
                <TextField label="Quantity" type="number" value={driverIssueFormData.quantity} onChange={e => setDriverIssueFormData(p => ({ ...p, quantity: e.target.value }))} fullWidth size="small" />
                <TextField label="Notes" value={driverIssueFormData.notes} onChange={e => setDriverIssueFormData(p => ({ ...p, notes: e.target.value }))} fullWidth size="small" multiline rows={2} />
              </>)}
            </Stack>
          </DialogContent>
          <DialogActions><Button onClick={() => setShowDriverIssueDialog(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleSubmitDriverIssue} disabled={submitting}>Issue</Button>
          </DialogActions>
        </Dialog>

        {/* Edit Issue (NEW) */}
        <Dialog open={showEditIssueDialog} onClose={() => setShowEditIssueDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Edit {editIssueType === 'vehicle' ? 'Vehicle' : 'Driver'} Issue — {selectedIssue?.issueNumber}</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField label="Issue Date & Time" type="datetime-local" value={editIssueForm.issueDate} onChange={e => setEditIssueForm(p => ({ ...p, issueDate: e.target.value }))} fullWidth size="small" InputLabelProps={{ shrink: true }} />
              <FormControl fullWidth size="small"><InputLabel>Status</InputLabel>
                <Select value={editIssueForm.status} onChange={e => setEditIssueForm(p => ({ ...p, status: e.target.value }))} label="Status">
                  {['ISSUED', 'PARTIALLY_RETURNED', 'RETURNED'].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </Select>
              </FormControl>
              <Typography variant="subtitle2" sx={{ mt: 1 }}>Items</Typography>
              {editIssueForm.items.map((it, i) => (
                <Paper key={i} sx={{ p: 1.5, bgcolor: '#F8FAFC', borderRadius: '8px' }}>
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>{it.itemName}</Typography>
                  <Grid container spacing={1} sx={{ mt: 0.5 }}>
                    <Grid size={{ xs: 6 }}><TextField label="Qty" type="number" value={it.quantity} onChange={e => { const items = [...editIssueForm.items]; items[i].quantity = e.target.value; setEditIssueForm(p => ({ ...p, items })); }} fullWidth size="small" /></Grid>
                    <Grid size={{ xs: 6 }}><FormControl fullWidth size="small"><InputLabel>Condition</InputLabel>
                      <Select value={it.condition} onChange={e => { const items = [...editIssueForm.items]; items[i].condition = e.target.value; setEditIssueForm(p => ({ ...p, items })); }} label="Condition">
                        {['NEW', 'GOOD', 'WORN', 'DAMAGED'].map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                      </Select>
                    </FormControl></Grid>
                  </Grid>
                </Paper>
              ))}
              <TextField label="Notes" value={editIssueForm.notes} onChange={e => setEditIssueForm(p => ({ ...p, notes: e.target.value }))} fullWidth size="small" multiline rows={2} />
            </Stack>
          </DialogContent>
          <DialogActions><Button onClick={() => setShowEditIssueDialog(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleSubmitEditIssue} disabled={submitting}>{submitting ? 'Saving…' : 'Save Changes'}</Button>
          </DialogActions>
        </Dialog>

        {/* Delete Issue Confirm (NEW) */}
        <Dialog open={showDeleteIssueDialog} onClose={() => { setShowDeleteIssueDialog(false); setDeleteIssueTarget(null); }}>
          <DialogTitle>Delete Issue</DialogTitle>
          <DialogContent>
            <Typography>Delete <strong>{deleteIssueTarget?.issue?.issueNumber}</strong>? This cannot be undone.</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => { setShowDeleteIssueDialog(false); setDeleteIssueTarget(null); }}>Cancel</Button>
            <Button color="error" variant="contained" onClick={handleDeleteIssueConfirm} disabled={submitting}>{submitting ? 'Deleting…' : 'Delete'}</Button>
          </DialogActions>
        </Dialog>

        {/* Location Dialog (NEW) */}
        <Dialog open={showLocationDialog} onClose={() => setShowLocationDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>{editingLocation ? 'Edit Location' : 'New Location'}</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField label="Name *" value={locationForm.name} onChange={e => setLocationForm(p => ({ ...p, name: e.target.value }))} fullWidth size="small" />
              <TextField label="Code" value={locationForm.code} onChange={e => setLocationForm(p => ({ ...p, code: e.target.value }))} fullWidth size="small" />
              <TextField label="Address" value={locationForm.address} onChange={e => setLocationForm(p => ({ ...p, address: e.target.value }))} fullWidth size="small" multiline rows={2} />
              <Grid container spacing={2}>
                <Grid size={{ xs: 6 }}><TextField label="City" value={locationForm.city} onChange={e => setLocationForm(p => ({ ...p, city: e.target.value }))} fullWidth size="small" /></Grid>
                <Grid size={{ xs: 6 }}><TextField label="Province" value={locationForm.province} onChange={e => setLocationForm(p => ({ ...p, province: e.target.value }))} fullWidth size="small" /></Grid>
                <Grid size={{ xs: 6 }}><TextField label="Zip" value={locationForm.zipCode} onChange={e => setLocationForm(p => ({ ...p, zipCode: e.target.value }))} fullWidth size="small" /></Grid>
                <Grid size={{ xs: 6 }}><FormControlLabel control={<Checkbox checked={locationForm.isActive} onChange={e => setLocationForm(p => ({ ...p, isActive: e.target.checked }))} size="small" />} label="Active" /></Grid>
              </Grid>
            </Stack>
          </DialogContent>
          <DialogActions><Button onClick={() => setShowLocationDialog(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleSubmitLocation} disabled={submitting}>{submitting ? 'Saving…' : (editingLocation ? 'Update' : 'Create')}</Button>
          </DialogActions>
        </Dialog>

        {/* Delete Location Confirm (NEW) */}
        <Dialog open={showDeleteLocationDialog} onClose={() => { setShowDeleteLocationDialog(false); setDeleteLocationTarget(null); }}>
          <DialogTitle>Delete Location</DialogTitle>
          <DialogContent>
            <Typography>Delete <strong>{deleteLocationTarget?.name}</strong>? Items currently assigned will become unassigned.</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => { setShowDeleteLocationDialog(false); setDeleteLocationTarget(null); }}>Cancel</Button>
            <Button color="error" variant="contained" onClick={handleDeleteLocationConfirm} disabled={submitting}>{submitting ? 'Deleting…' : 'Delete'}</Button>
          </DialogActions>
        </Dialog>

        {/* Return / Swap / Movement dialogs — compacted */}
        <Dialog open={showReturnDialog} onClose={() => setShowReturnDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Return Item</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField label="Quantity" type="number" value={returnFormData.quantity} onChange={e => setReturnFormData(p => ({ ...p, quantity: e.target.value }))} fullWidth size="small" />
              <FormControl fullWidth size="small"><InputLabel>Condition</InputLabel>
                <Select value={returnFormData.condition} onChange={e => setReturnFormData(p => ({ ...p, condition: e.target.value }))} label="Condition">
                  {['GOOD', 'DAMAGED', 'WORN', 'FAULTY', 'BROKEN'].map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                </Select>
              </FormControl>
              <TextField label="Notes" value={returnFormData.notes} onChange={e => setReturnFormData(p => ({ ...p, notes: e.target.value }))} fullWidth size="small" multiline rows={2} />
            </Stack>
          </DialogContent>
          <DialogActions><Button onClick={() => setShowReturnDialog(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleSubmitReturn} disabled={submitting}>Return</Button>
          </DialogActions>
        </Dialog>

        <Dialog open={showSwapDialog} onClose={() => setShowSwapDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Swap Item</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <FormControl fullWidth size="small"><InputLabel>Replacement</InputLabel>
                <Select value={swapFormData.newItemId} onChange={e => setSwapFormData(p => ({ ...p, newItemId: e.target.value }))} label="Replacement">
                  {inventoryItems.filter(i => i.id !== Number(selectedIssueItem?.itemId) && isIssuable(i, swapFormData.issueType)).map(i => (
                    <MenuItem key={i.id} value={i.id} disabled={i.quantity <= 0}>{i.name} ({i.quantity})</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Grid container spacing={2}>
                <Grid size={{ xs: 6 }}><TextField label="New Qty" type="number" value={swapFormData.newQuantity} onChange={e => setSwapFormData(p => ({ ...p, newQuantity: e.target.value }))} fullWidth size="small" /></Grid>
                <Grid size={{ xs: 6 }}><TextField label="Return Qty" type="number" value={swapFormData.returnQuantity} onChange={e => setSwapFormData(p => ({ ...p, returnQuantity: e.target.value }))} fullWidth size="small" /></Grid>
              </Grid>
              <TextField label="Damage Notes" value={swapFormData.damageNotes} onChange={e => setSwapFormData(p => ({ ...p, damageNotes: e.target.value }))} fullWidth size="small" multiline rows={2} />
            </Stack>
          </DialogContent>
          <DialogActions><Button onClick={() => setShowSwapDialog(false)}>Cancel</Button>
            <Button variant="contained" color="warning" onClick={handleSubmitSwap} disabled={submitting}>Swap</Button>
          </DialogActions>
        </Dialog>

        <Dialog open={showMovementDialog} onClose={() => setShowMovementDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Stock Movement</DialogTitle>
          <DialogContent>
            {selectedItem && (
              <Alert severity="info" sx={{ mt: 1, mb: 2 }}>
                <strong>{selectedItem.name}</strong> — current qty {selectedItem.quantity}
              </Alert>
            )}
            <Stack spacing={2}>
              <FormControl fullWidth size="small"><InputLabel>Operation</InputLabel>
                <Select value={movementFormData.operation} onChange={e => {
                  const op = e.target.value;
                  const mt = op === 'ADD' ? 'IN' : op === 'SUBTRACT' ? 'OUT' : 'ADJUSTMENT';
                  const rt = op === 'ADD' ? 'PURCHASE_ORDER' : 'ADJUSTMENT';
                  setMovementFormData(p => ({ ...p, operation: op, movementType: mt, referenceType: rt }));
                }} label="Operation">
                  <MenuItem value="ADD">Add Stock</MenuItem>
                  <MenuItem value="SUBTRACT">Remove Stock</MenuItem>
                  <MenuItem value="SET">Set Quantity</MenuItem>
                </Select>
              </FormControl>
              <TextField label="Quantity" type="number" value={movementFormData.quantity} onChange={e => setMovementFormData(p => ({ ...p, quantity: e.target.value }))} fullWidth size="small" />
              <TextField label="Reason *" value={movementFormData.reason} onChange={e => setMovementFormData(p => ({ ...p, reason: e.target.value }))} fullWidth size="small" multiline rows={2} />
              <TextField label="Notes" value={movementFormData.notes} onChange={e => setMovementFormData(p => ({ ...p, notes: e.target.value }))} fullWidth size="small" multiline rows={2} />
            </Stack>
          </DialogContent>
          <DialogActions><Button onClick={() => setShowMovementDialog(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleSubmitMovement} disabled={submitting}>{submitting ? 'Saving…' : 'Record'}</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default Inventory;
