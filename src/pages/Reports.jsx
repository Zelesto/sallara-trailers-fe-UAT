// src/pages/Reports.jsx
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  IconButton,
  Menu,
  Alert,
  Chip,
  Stack,
  Divider,
  Tabs,
  Tab,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  CircularProgress,
} from '@mui/material';
import {
  Analytics as AnalyticsIcon,
  Download,
  Print,
  Email,
  TrendingUp,
  TrendingDown,
  LocalGasStation,
  DirectionsCar,
  Person,
  CalendarMonth,
  MoreVert,
  FilterList,
  Refresh,
  PictureAsPdf,
  Inventory as InventoryIcon,
  Warning as WarningIcon,
  SwapHoriz,
  Assignment,
  TuneRounded,
  GridOnRounded,
  Visibility,
  Close as CloseIcon,
  Description as DescriptionIcon,
  Route as RouteIcon,
  LocalShipping as LocalShippingIcon,
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

import { reportService } from '../services/reportService';
import { tripService } from '../services/tripService';
import { loadService } from '../services/loadService';
import { vehicleService } from '../services/vehicleService';
import { exportCsv } from '../utils/exportTable';

// ============================================================
// HELPERS
// ============================================================
const ymd = (d) => {
  if (!d) return undefined;
  const dt = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(dt.getTime())) return undefined;
  const p = (n) => String(n).padStart(2, '0');
  return `${dt.getFullYear()}-${p(dt.getMonth() + 1)}-${p(dt.getDate())}`;
};

const periodToRange = (period) => {
  const end = new Date();
  const start = new Date();
  switch (period) {
    case 'lastmonth':   start.setMonth(end.getMonth() - 1); break;
    case 'last3months': start.setMonth(end.getMonth() - 3); break;
    case 'last6months': start.setMonth(end.getMonth() - 6); break;
    case 'yeartodate':  start.setMonth(0, 1); break;
    default: return null;
  }
  return { start, end };
};

const toArray = (res) => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.content)) return res.content;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.data?.content)) return res.data.content;
  return [];
};

// ============================================================
// STAT CARD
// ============================================================
const StatCard = ({ title, value, icon: Icon, color = 'primary', trend, trendLabel, trendColor = 'success' }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Box>
          <Typography variant="h5" fontWeight="bold" sx={{ fontSize: '1.1rem' }}>
            {value}
          </Typography>
          <Typography color="text.secondary" variant="caption" sx={{ fontSize: '0.65rem', display: 'block' }}>
            {title}
          </Typography>
          {trend && (
            <Typography
              variant="caption"
              color={trendColor === 'success' ? 'success.main' : 'error.main'}
              sx={{ display: 'flex', alignItems: 'center', mt: 0.5, fontSize: '0.6rem' }}
            >
              {trendColor === 'success'
                ? <TrendingUp sx={{ fontSize: 12, mr: 0.25 }} />
                : <TrendingDown sx={{ fontSize: 12, mr: 0.25 }} />}
              {trendLabel}
            </Typography>
          )}
        </Box>
        <Icon sx={{ color: `${color}.main`, fontSize: 32, opacity: 0.8 }} />
      </Box>
    </CardContent>
  </Card>
);

// ============================================================
// REPORT PREVIEW DIALOG
// ============================================================
const ReportPreviewDialog = ({ preview, onClose }) => (
  <Dialog open={preview.open} onClose={onClose} maxWidth="lg" fullWidth>
    <DialogTitle
      sx={{
        py: 1.5, px: 2.5, borderBottom: 1, borderColor: 'divider', bgcolor: '#F8FAFC',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}
    >
      <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600, color: '#111827' }}>
        {preview.title}
      </Typography>
      <IconButton size="small" onClick={onClose}>
        <CloseIcon sx={{ fontSize: '1.2rem' }} />
      </IconButton>
    </DialogTitle>
    <DialogContent sx={{ p: 0, height: '75vh', bgcolor: '#F7F7FC' }}>
      <iframe
        srcDoc={preview.html}
        title={preview.title}
        style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
      />
    </DialogContent>
    <DialogActions
      sx={{
        px: 2.5, py: 1.5, borderTop: 1, borderColor: 'divider', bgcolor: '#F8FAFC',
        justifyContent: 'space-between',
      }}
    >
      <Button onClick={onClose} size="small" sx={{ fontSize: '0.8rem' }}>
        Close
      </Button>
      <Button
        variant="contained"
        size="small"
        startIcon={<Download sx={{ fontSize: '0.9rem' }} />}
        onClick={() => { if (typeof preview.onDownloadPdf === 'function') preview.onDownloadPdf(); }}
        sx={{
          fontSize: '0.8rem',
          background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)',
          '&:hover': { background: 'linear-gradient(135deg, #4338CA 0%, #4F46E5 100%)' },
        }}
      >
        Download PDF
      </Button>
    </DialogActions>
  </Dialog>
);

// ============================================================
// INVENTORY REPORT CARD
// ============================================================
const InventoryReportCard = ({ report, onPreview, onDownload, disabled }) => {
  const Icon = report.icon;
  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid #ECECEC',
        borderRadius: '14px',
        transition: 'all 0.25s ease',
        '&:hover': {
          borderColor: report.color,
          boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
          transform: 'translateY(-2px)',
        },
      }}
    >
      <CardContent sx={{ p: 2, flex: 1 }}>
        <Stack direction="row" alignItems="flex-start" spacing={1.5}>
          <Box
            sx={{
              bgcolor: `${report.color}15`,
              borderRadius: '12px',
              p: 1.25,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon sx={{ color: report.color, fontSize: '1.4rem' }} />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle2" sx={{ fontSize: '0.85rem', fontWeight: 700, mb: 0.5 }}>
              {report.title}
            </Typography>
            <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary', lineHeight: 1.4 }}>
              {report.description}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
      <Divider />
      <Stack direction="row" spacing={0} sx={{ p: 0 }}>
        <Button
          size="small"
          fullWidth
          startIcon={<Visibility sx={{ fontSize: '0.9rem' }} />}
          onClick={() => onPreview(report)}
          disabled={disabled}
          sx={{
            fontSize: '0.72rem',
            textTransform: 'none',
            borderRadius: 0,
            py: 1,
            color: 'text.secondary',
            '&:hover': { bgcolor: '#F9FAFB', color: report.color },
          }}
        >
          Preview
        </Button>
        <Divider orientation="vertical" flexItem />
        <Button
          size="small"
          fullWidth
          startIcon={<Download sx={{ fontSize: '0.9rem' }} />}
          onClick={() => onDownload(report)}
          disabled={disabled}
          sx={{
            fontSize: '0.72rem',
            textTransform: 'none',
            borderRadius: 0,
            py: 1,
            color: report.color,
            fontWeight: 600,
            '&:hover': { bgcolor: `${report.color}10` },
          }}
        >
          PDF
        </Button>
      </Stack>
    </Card>
  );
};

// ============================================================
// TRIP REPORTS TAB
// ============================================================
const TripReportsTab = ({ onPreview, onDownload, setError }) => {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const highlight = searchParams.get('highlight');
    if (highlight) setSearch(highlight);
  }, [searchParams]);

  useEffect(() => {
    (async () => {
      try {
        const res = await tripService.getAllTrips?.();
        setTrips(toArray(res));
      } catch (err) {
        setError?.(err?.userMessage || err?.message || 'Failed to load trips');
      } finally {
        setLoading(false);
      }
    })();
  }, [setError]);

  const filtered = trips.filter((t) =>
    !search ||
    (t.tripNumber || '').toLowerCase().includes(search.toLowerCase()) ||
    (t.customerName || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Card sx={{ borderRadius: '12px', border: '1px solid #ECECEC' }}>
      <CardContent sx={{ p: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1}>
          <Typography variant="subtitle2" sx={{ fontSize: '0.85rem', fontWeight: 600 }}>
            Trip Reports
            <Chip label={`${filtered.length} trips`} size="small" sx={{ ml: 1, height: 18, fontSize: '0.55rem' }} />
          </Typography>
          <TextField
            size="small"
            placeholder="Search trip # or customer…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ maxWidth: 280, '& .MuiInputBase-root': { fontSize: '0.75rem', borderRadius: '10px' } }}
          />
        </Stack>

        {loading ? (
          <Box display="flex" justifyContent="center" py={4}><CircularProgress size={28} /></Box>
        ) : filtered.length === 0 ? (
          <Alert severity="info" sx={{ fontSize: '0.8rem' }}>
            {search ? `No trips match "${search}".` : 'No trips found.'}
          </Alert>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#F9FAFB' }}>
                <TableRow>
                  <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600 }}>Trip #</TableCell>
                  <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600 }}>Customer</TableCell>
                  <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600 }}>Route</TableCell>
                  <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600 }} align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((t) => (
                  <TableRow key={t.id || t.tripNumber} hover>
                    <TableCell sx={{ fontSize: '0.75rem' }}><strong>{t.tripNumber}</strong></TableCell>
                    <TableCell sx={{ fontSize: '0.75rem' }}>{t.customerName || '—'}</TableCell>
                    <TableCell sx={{ fontSize: '0.75rem' }}>
                      {t.originLocation || '—'} → {t.destinationLocation || '—'}
                    </TableCell>
                    <TableCell>
                      <Chip label={t.status || 'N/A'} size="small" sx={{ height: 18, fontSize: '0.55rem' }} />
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                        <Tooltip title="Preview HTML">
                          <IconButton size="small" onClick={() => onPreview(t)} sx={{ p: 0.5 }}>
                            <Visibility sx={{ fontSize: '0.9rem' }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Download PDF">
                          <IconButton size="small" color="primary" onClick={() => onDownload(t)} sx={{ p: 0.5 }}>
                            <Download sx={{ fontSize: '0.9rem' }} />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>
    </Card>
  );
};

// ============================================================
// LOAD REPORTS TAB
// ============================================================
const LoadReportsTab = ({ onPreview, onDownload, setError }) => {
  const [loads, setLoads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await loadService.getAllLoads?.();
        setLoads(toArray(res));
      } catch (err) {
        setError?.(err?.userMessage || err?.message || 'Failed to load loads');
      } finally {
        setLoading(false);
      }
    })();
  }, [setError]);

  const filtered = loads.filter((l) =>
    !search ||
    (l.loadNumber || '').toLowerCase().includes(search.toLowerCase()) ||
    (l.customerName || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Card sx={{ borderRadius: '12px', border: '1px solid #ECECEC' }}>
      <CardContent sx={{ p: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1}>
          <Typography variant="subtitle2" sx={{ fontSize: '0.85rem', fontWeight: 600 }}>
            Load Reports
            <Chip label={`${filtered.length} loads`} size="small" sx={{ ml: 1, height: 18, fontSize: '0.55rem' }} />
          </Typography>
          <TextField
            size="small"
            placeholder="Search load # or customer…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ maxWidth: 280, '& .MuiInputBase-root': { fontSize: '0.75rem', borderRadius: '10px' } }}
          />
        </Stack>

        {loading ? (
          <Box display="flex" justifyContent="center" py={4}><CircularProgress size={28} /></Box>
        ) : filtered.length === 0 ? (
          <Alert severity="info" sx={{ fontSize: '0.8rem' }}>
            {search ? `No loads match "${search}".` : 'No loads found.'}
          </Alert>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#F9FAFB' }}>
                <TableRow>
                  <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600 }}>Load #</TableCell>
                  <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600 }}>Customer</TableCell>
                  <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600 }}>Commodity</TableCell>
                  <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600 }} align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((l) => (
                  <TableRow key={l.id || l.loadNumber} hover>
                    <TableCell sx={{ fontSize: '0.75rem' }}><strong>{l.loadNumber}</strong></TableCell>
                    <TableCell sx={{ fontSize: '0.75rem' }}>{l.customerName || '—'}</TableCell>
                    <TableCell sx={{ fontSize: '0.75rem' }}>{l.commodityType || '—'}</TableCell>
                    <TableCell>
                      <Chip label={l.status || 'N/A'} size="small" sx={{ height: 18, fontSize: '0.55rem' }} />
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                        <Tooltip title="Preview HTML">
                          <IconButton size="small" onClick={() => onPreview(l)} sx={{ p: 0.5 }}>
                            <Visibility sx={{ fontSize: '0.9rem' }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Download PDF">
                          <IconButton size="small" color="primary" onClick={() => onDownload(l)} sx={{ p: 0.5 }}>
                            <Download sx={{ fontSize: '0.9rem' }} />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>
    </Card>
  );
};

// ============================================================
// FUEL REPORTS TAB
// ============================================================
const FuelReportsTab = ({ onPreview, onDownload, setError }) => {
  const [vehicles, setVehicles] = useState([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [vehicleId, setVehicleId] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await vehicleService.getAllVehicles?.();
        setVehicles(toArray(res));
      } catch (err) {
        setError?.(err?.userMessage || err?.message || 'Failed to load vehicles');
      } finally {
        setLoadingVehicles(false);
      }
    })();
  }, [setError]);

  const params = () => ({
    vehicleId: vehicleId ? Number(vehicleId) : undefined,
    startDate: ymd(startDate),
    endDate: ymd(endDate),
  });

  return (
    <Card sx={{ borderRadius: '12px', border: '1px solid #ECECEC' }}>
      <CardContent sx={{ p: 2 }}>
        <Typography variant="subtitle2" sx={{ fontSize: '0.85rem', fontWeight: 600, mb: 2 }}>
          Fuel Consumption Report
        </Typography>

        <Grid container spacing={1.5} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ fontSize: '0.75rem' }}>Vehicle</InputLabel>
              <Select
                value={vehicleId}
                label="Vehicle"
                onChange={(e) => setVehicleId(e.target.value)}
                disabled={loadingVehicles}
                sx={{ fontSize: '0.8rem', borderRadius: '10px' }}
              >
                <MenuItem value="" sx={{ fontSize: '0.8rem' }}>All Vehicles</MenuItem>
                {vehicles.map((v) => (
                  <MenuItem key={v.id} value={v.id} sx={{ fontSize: '0.8rem' }}>
                    {v.registrationNumber || v.regNumber || `Vehicle #${v.id}`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={3}>
            <DatePicker
              label="From"
              value={startDate}
              onChange={setStartDate}
              slotProps={{ textField: { fullWidth: true, size: 'small', sx: { '& .MuiInputLabel-root': { fontSize: '0.75rem' } } } }}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <DatePicker
              label="To"
              value={endDate}
              onChange={setEndDate}
              slotProps={{ textField: { fullWidth: true, size: 'small', sx: { '& .MuiInputLabel-root': { fontSize: '0.75rem' } } } }}
            />
          </Grid>
          <Grid item xs={12} sm={2}>
            <Stack direction="row" spacing={0.5}>
              <Button
                variant="outlined"
                size="small"
                fullWidth
                onClick={() => onPreview(params())}
                sx={{ fontSize: '0.72rem', textTransform: 'none', borderRadius: '10px', py: 1 }}
              >
                Preview
              </Button>
              <Button
                variant="contained"
                size="small"
                fullWidth
                onClick={() => onDownload(params())}
                sx={{
                  fontSize: '0.72rem', textTransform: 'none', borderRadius: '10px', py: 1,
                  background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)',
                  '&:hover': { background: 'linear-gradient(135deg, #4338CA 0%, #4F46E5 100%)' },
                }}
              >
                PDF
              </Button>
            </Stack>
          </Grid>
        </Grid>

        <Alert severity="info" sx={{ fontSize: '0.75rem' }}>
          Leave all filters empty to generate a full fuel consumption report across all vehicles and dates.
        </Alert>
      </CardContent>
    </Card>
  );
};


// ============================================================
// PIVOT REPORTS TAB
// ============================================================
const PivotReportsTab = ({ onPreview, onDownload, setError, busy }) => {
  // Preset definitions
  const presets = [
    { label: 'Trips by Vehicle',        entity: 'TRIPS', groupBy: 'VEHICLE',  pivotBy: null,      metric: 'COUNT',    icon: RouteIcon,           color: '#4F46E5' },
    { label: 'Trips by Customer',       entity: 'TRIPS', groupBy: 'CUSTOMER', pivotBy: null,      metric: 'COUNT',    icon: Person,              color: '#6366F1' },
    { label: 'Trips by Month',          entity: 'TRIPS', groupBy: 'MONTH',    pivotBy: null,      metric: 'COUNT',    icon: CalendarMonth,       color: '#8B5CF6' },
    { label: 'Trips by Customer × Month', entity: 'TRIPS', groupBy: 'CUSTOMER', pivotBy: 'MONTH', metric: 'COUNT',    icon: GridOnRoundedIcon,   color: '#A78BFA' },
    { label: 'Trip Distance by Vehicle', entity: 'TRIPS', groupBy: 'VEHICLE', pivotBy: null,      metric: 'DISTANCE', icon: TrendingUp,          color: '#14B8A6' },
    { label: 'Fuel by Vehicle',         entity: 'FUEL',  groupBy: 'VEHICLE',  pivotBy: null,      metric: 'LITERS',   icon: LocalGasStation,     color: '#F59E0B' },
    { label: 'Fuel by Month',           entity: 'FUEL',  groupBy: 'MONTH',    pivotBy: null,      metric: 'LITERS',   icon: CalendarMonth,       color: '#FBBF24' },
    { label: 'Fuel by Trip',            entity: 'FUEL',  groupBy: 'TRIP',     pivotBy: null,      metric: 'LITERS',   icon: RouteIcon,           color: '#F97316' },
    { label: 'Fuel by Vehicle × Month', entity: 'FUEL',  groupBy: 'VEHICLE',  pivotBy: 'MONTH',   metric: 'LITERS',   icon: GridOnRoundedIcon,   color: '#EA580C' },
    { label: 'Loads by Customer',       entity: 'LOADS', groupBy: 'CUSTOMER', pivotBy: null,      metric: 'COUNT',    icon: Person,              color: '#EC4899' },
    { label: 'Loads by Driver',         entity: 'LOADS', groupBy: 'DRIVER',   pivotBy: null,      metric: 'COUNT',    icon: Person,              color: '#DB2777' },
    { label: 'Loads by Vehicle',        entity: 'LOADS', groupBy: 'VEHICLE',  pivotBy: null,      metric: 'COUNT',    icon: DirectionsCar,       color: '#BE185D' },
  ];

  // Custom builder state
  const [entity,  setEntity]  = useState('TRIPS');
  const [groupBy, setGroupBy] = useState('VEHICLE');
  const [pivotBy, setPivotBy] = useState('');
  const [metric,  setMetric]  = useState('COUNT');
  const [startDate, setStartDate] = useState(null);
  const [endDate,   setEndDate]   = useState(null);

  const entities = [
    { value: 'TRIPS', label: 'Trips' },
    { value: 'LOADS', label: 'Loads' },
    { value: 'FUEL',  label: 'Fuel Purchases' },
  ];

  const groupers = [
    { value: 'VEHICLE',   label: 'Vehicle' },
    { value: 'DRIVER',    label: 'Driver' },
    { value: 'CUSTOMER',  label: 'Customer' },
    { value: 'MONTH',     label: 'Month' },
    { value: 'YEAR',      label: 'Year' },
    { value: 'STATUS',    label: 'Status' },
    { value: 'COMMODITY', label: 'Commodity' },
    { value: 'LOCATION',  label: 'Location' },
    { value: 'TRIP_TYPE', label: 'Trip Type' },
    { value: 'TRIP',      label: 'Trip Number' },
    { value: 'LOAD',      label: 'Load Number' },
  ];

  const metrics = [
    { value: 'COUNT',    label: 'Count (Trips / Records)' },
    { value: 'DISTANCE', label: 'Distance (km)' },
    { value: 'COST',     label: 'Cost (R)' },
    { value: 'LITERS',   label: 'Fuel Volume (L)' },
    { value: 'WEIGHT',   label: 'Weight (kg)' },
    { value: 'DURATION', label: 'Duration (h)' },
  ];

  const buildParams = (cfg) => {
    const params = {
      entity: cfg.entity,
      groupBy: cfg.groupBy,
      metric: cfg.metric,
    };
    if (cfg.pivotBy) params.pivotBy = cfg.pivotBy;
    const ymd = (d) => {
      if (!d) return undefined;
      const dt = d instanceof Date ? d : new Date(d);
      if (Number.isNaN(dt.getTime())) return undefined;
      const p = (n) => String(n).padStart(2, '0');
      return `${dt.getFullYear()}-${p(dt.getMonth() + 1)}-${p(dt.getDate())}`;
    };
    if (startDate) params.startDate = ymd(startDate);
    if (endDate)   params.endDate   = ymd(endDate);
    return params;
  };

  const runPreset = (preset, mode) => {
    const params = buildParams({ ...preset, startDate, endDate });
    const report = {
      title: preset.label,
      buildHtml: () => reportService.generatePivotReport(params),
      buildPdf:  () => reportService.downloadPivotReportPDF(params),
    };
    if (mode === 'preview') onPreview(report);
    else onDownload(report);
  };

  const runCustom = (mode) => {
    const params = buildParams({ entity, groupBy, pivotBy, metric });
    const title = `${entity === 'TRIPS' ? 'Trips' : entity === 'LOADS' ? 'Loads' : 'Fuel'} by ${groupBy}${
      pivotBy ? ' × ' + pivotBy : ''
    }`;
    const report = {
      title,
      buildHtml: () => reportService.generatePivotReport(params),
      buildPdf:  () => reportService.downloadPivotReportPDF(params),
    };
    if (mode === 'preview') onPreview(report);
    else onDownload(report);
  };

  return (
    <Box>
      {/* Quick presets */}
      <Paper sx={{ p: 2, mb: 2, borderRadius: '12px', border: '1px solid #ECECEC' }}>
        <Typography variant="subtitle2" sx={{ fontSize: '0.85rem', fontWeight: 600, mb: 1.5 }}>
          Quick Reports
        </Typography>
        <Grid container spacing={1.5}>
          {presets.map((preset) => {
            const Icon = preset.icon;
            return (
              <Grid item xs={12} sm={6} md={4} lg={3} key={preset.label}>
                <Card
                  sx={{
                    border: '1px solid #ECECEC',
                    borderRadius: '12px',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      borderColor: preset.color,
                      boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                    },
                  }}
                >
                  <CardContent sx={{ p: 1.5 }}>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                      <Box sx={{ bgcolor: `${preset.color}15`, p: 0.75, borderRadius: '8px' }}>
                        <Icon sx={{ color: preset.color, fontSize: '1rem' }} />
                      </Box>
                      <Typography variant="body2" sx={{ fontSize: '0.78rem', fontWeight: 600 }}>
                        {preset.label}
                      </Typography>
                    </Stack>
                    <Stack direction="row" spacing={0.5}>
                      <Button
                        size="small"
                        fullWidth
                        startIcon={<Visibility sx={{ fontSize: '0.8rem' }} />}
                        onClick={() => runPreset(preset, 'preview')}
                        disabled={busy}
                        sx={{
                          fontSize: '0.7rem',
                          textTransform: 'none',
                          borderRadius: '8px',
                          py: 0.5,
                        }}
                      >
                        Preview
                      </Button>
                      <Button
                        size="small"
                        fullWidth
                        startIcon={<Download sx={{ fontSize: '0.8rem' }} />}
                        onClick={() => runPreset(preset, 'download')}
                        disabled={busy}
                        sx={{
                          fontSize: '0.7rem',
                          textTransform: 'none',
                          borderRadius: '8px',
                          py: 0.5,
                          color: preset.color,
                          fontWeight: 600,
                        }}
                      >
                        PDF
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Paper>

      {/* Custom builder */}
      <Paper sx={{ p: 2, borderRadius: '12px', border: '1px solid #ECECEC' }}>
        <Typography variant="subtitle2" sx={{ fontSize: '0.85rem', fontWeight: 600, mb: 1.5 }}>
          Custom Pivot — pick anything
        </Typography>
        <Grid container spacing={1.5}>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ fontSize: '0.75rem' }}>Entity</InputLabel>
              <Select value={entity} label="Entity" onChange={(e) => setEntity(e.target.value)} sx={{ fontSize: '0.78rem' }}>
                {entities.map((e) => (
                  <MenuItem key={e.value} value={e.value} sx={{ fontSize: '0.78rem' }}>{e.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ fontSize: '0.75rem' }}>Group By</InputLabel>
              <Select value={groupBy} label="Group By" onChange={(e) => setGroupBy(e.target.value)} sx={{ fontSize: '0.78rem' }}>
                {groupers.map((g) => (
                  <MenuItem key={g.value} value={g.value} sx={{ fontSize: '0.78rem' }}>{g.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ fontSize: '0.75rem' }}>Pivot By</InputLabel>
              <Select value={pivotBy} label="Pivot By" onChange={(e) => setPivotBy(e.target.value)} sx={{ fontSize: '0.78rem' }}>
                <MenuItem value="" sx={{ fontSize: '0.78rem' }}>None (simple list)</MenuItem>
                {groupers.filter((g) => g.value !== groupBy).map((g) => (
                  <MenuItem key={g.value} value={g.value} sx={{ fontSize: '0.78rem' }}>{g.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ fontSize: '0.75rem' }}>Metric</InputLabel>
              <Select value={metric} label="Metric" onChange={(e) => setMetric(e.target.value)} sx={{ fontSize: '0.78rem' }}>
                {metrics.map((m) => (
                  <MenuItem key={m.value} value={m.value} sx={{ fontSize: '0.78rem' }}>{m.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} sm={3} md={2}>
            <DatePicker
              label="From"
              value={startDate}
              onChange={setStartDate}
              slotProps={{ textField: { fullWidth: true, size: 'small', sx: { '& .MuiInputLabel-root': { fontSize: '0.75rem' } } } }}
            />
          </Grid>
          <Grid item xs={6} sm={3} md={2}>
            <DatePicker
              label="To"
              value={endDate}
              onChange={setEndDate}
              slotProps={{ textField: { fullWidth: true, size: 'small', sx: { '& .MuiInputLabel-root': { fontSize: '0.75rem' } } } }}
            />
          </Grid>
        </Grid>
        <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<Visibility sx={{ fontSize: '0.9rem' }} />}
            onClick={() => runCustom('preview')}
            disabled={busy}
            sx={{ fontSize: '0.78rem', textTransform: 'none', borderRadius: '10px', py: 1 }}
          >
            Preview
          </Button>
          <Button
            variant="contained"
            size="small"
            startIcon={<Download sx={{ fontSize: '0.9rem' }} />}
            onClick={() => runCustom('download')}
            disabled={busy}
            sx={{
              fontSize: '0.78rem',
              textTransform: 'none',
              borderRadius: '10px',
              py: 1,
              background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)',
              '&:hover': { background: 'linear-gradient(135deg, #4338CA 0%, #4F46E5 100%)' },
            }}
          >
            Download PDF
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
};

// ============================================================
// MAIN REPORTS COMPONENT
// ============================================================
const Reports = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const tabFromUrl = (() => {
    const t = searchParams.get('tab');
    if (t === 'trip')      return 1;
    if (t === 'load')      return 2;
    if (t === 'fuel')      return 3;
    if (t === 'inventory') return 4;
    if (t === 'pivot') return 5;
    return 0;
  })();

  const [activeTab, setActiveTab] = useState(tabFromUrl);

  useEffect(() => {
    setActiveTab(tabFromUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleTabChange = (_, v) => {
    setActiveTab(v);
    const map = ['', 'trip', 'load', 'fuel', 'inventory','pivot'];
    const params = new URLSearchParams(searchParams);
    if (v === 0) params.delete('tab'); else params.set('tab', map[v]);
    setSearchParams(params, { replace: true });
  };

  // ── Analytics state ─────────────────────────────────────────
  const [period, setPeriod] = useState('last6months');
  const [vehicle, setVehicle] = useState('all');
  const [reportType, setReportType] = useState('fuel');
  const [dateRange, setDateRange] = useState({
    start: new Date('2024-01-01'),
    end: new Date('2024-06-30'),
  });
  const [showCustomRange, setShowCustomRange] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  // ── Inventory filter state ──────────────────────────────────
  const [invCategory, setInvCategory] = useState('all');
  const [invStatus, setInvStatus] = useState('all');
  const [invIssueable, setInvIssueable] = useState('all');
  const [invMovementType, setInvMovementType] = useState('all');
  const [invApprovalStatus, setInvApprovalStatus] = useState('all');
  const [invStartDate, setInvStartDate] = useState(null);
  const [invEndDate, setInvEndDate] = useState(null);

  // ── Shared feedback + preview ───────────────────────────────
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [reportPreview, setReportPreview] = useState({
    open: false, html: '', title: '', onDownloadPdf: null,
  });
  const [busy, setBusy] = useState(false);

  const showSuccess = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(null), 3000); };

  // ── Mock Analytics data ─────────────────────────────────────
  const fuelConsumptionData = [
    { month: 'Jan', consumption: 4200, cost: 94500, average: 3.8 },
    { month: 'Feb', consumption: 3800, cost: 85500, average: 3.9 },
    { month: 'Mar', consumption: 4500, cost: 101250, average: 3.7 },
    { month: 'Apr', consumption: 3900, cost: 87750, average: 3.8 },
    { month: 'May', consumption: 4100, cost: 92250, average: 3.9 },
    { month: 'Jun', consumption: 4300, cost: 96750, average: 3.8 },
  ];

  const vehiclePerformanceData = [
    { vehicle: 'ABC123GP', fuelEfficiency: 3.8, distance: 12500, cost: 87500, status: 'Good',             avgCostPerKm: 7.0 },
    { vehicle: 'DEF456GP', fuelEfficiency: 4.2, distance: 9800,  cost: 68500, status: 'Excellent',        avgCostPerKm: 6.99 },
    { vehicle: 'GHI789GP', fuelEfficiency: 3.5, distance: 15200, cost: 106400, status: 'Needs Attention', avgCostPerKm: 7.0 },
    { vehicle: 'JKL012GP', fuelEfficiency: 4.0, distance: 11000, cost: 77000, status: 'Good',             avgCostPerKm: 7.0 },
  ];

  const expenseByCategory = [
    { name: 'Fuel',        value: 65, color: '#0088FE' },
    { name: 'Maintenance', value: 20, color: '#00C49F' },
    { name: 'Tyres',       value: 10, color: '#FFBB28' },
    { name: 'Insurance',   value: 3,  color: '#FF6B6B' },
    { name: 'Other',       value: 2,  color: '#8042FF' },
  ];

  const monthlyComparisonData = [
    { month: 'Jan', current: 94500,  previous: 91000 },
    { month: 'Feb', current: 85500,  previous: 88000 },
    { month: 'Mar', current: 101250, previous: 95000 },
    { month: 'Apr', current: 87750,  previous: 89000 },
    { month: 'May', current: 92250,  previous: 90000 },
    { month: 'Jun', current: 96750,  previous: 92000 },
  ];

  // ============================================================
  // ANALYTICS EXPORTS
  // ============================================================
  const handlePeriodChange = (event) => {
    const value = event.target.value;
    setPeriod(value);
    setShowCustomRange(value === 'custom');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Excellent':       return 'success';
      case 'Good':            return 'info';
      case 'Needs Attention': return 'warning';
      case 'Poor':            return 'error';
      default:                return 'default';
    }
  };

  const analyticsDateRange = () => {
    if (period === 'custom') {
      return { start: ymd(dateRange.start), end: ymd(dateRange.end) };
    }
    const r = periodToRange(period);
    return r ? { start: ymd(r.start), end: ymd(r.end) } : { start: undefined, end: undefined };
  };

  const handleExport = async (format) => {
    setError(null);
    try {
      if (format === 'pdf') {
        const { start, end } = analyticsDateRange();
        await reportService.downloadFuelReportPDF(undefined, start, end);
        showSuccess('Fuel report PDF downloaded');
      } else if (format === 'csv' || format === 'excel') {
        const columns = [
          { header: 'Vehicle',         value: (r) => r.vehicle,                        width: 14 },
          { header: 'Fuel Efficiency', value: (r) => r.fuelEfficiency, type: 'number', decimals: 1, width: 14 },
          { header: 'Distance (km)',   value: (r) => r.distance,       type: 'number', width: 14 },
          { header: 'Fuel Cost (R)',   value: (r) => r.cost,           type: 'number', decimals: 2, width: 16 },
          { header: 'Cost / km (R)',   value: (r) => r.avgCostPerKm,   type: 'number', decimals: 2, width: 14 },
          { header: 'Status',          value: (r) => r.status,                          width: 18 },
        ];
        if (format === 'csv') {
          exportCsv('vehicle-performance', columns, vehiclePerformanceData);
          showSuccess('Vehicle performance CSV downloaded');
        } else {
          const { exportXlsx } = await import('../utils/exportTable');
          exportXlsx('vehicle-performance', columns, vehiclePerformanceData, 'Vehicle Performance');
          showSuccess('Vehicle performance Excel downloaded');
        }
      } else if (format === 'email') {
        setError('Email delivery is not yet available. Use Preview or download PDF instead.');
      }
    } catch (err) {
      setError(err?.userMessage || err?.message || 'Export failed');
    }
  };

  const handleMenuClick = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const calculateStats = () => {
    const totalFuel = fuelConsumptionData.reduce((sum, item) => sum + item.consumption, 0);
    const totalCost = fuelConsumptionData.reduce((sum, item) => sum + item.cost, 0);
    const avgEfficiency = fuelConsumptionData.reduce((sum, item) => sum + item.average, 0) / fuelConsumptionData.length;
    const totalVehicles = vehiclePerformanceData.length;
    return { totalFuel, totalCost, avgEfficiency, totalVehicles };
  };

  const stats = calculateStats();

  // ============================================================
  // INVENTORY REPORTS
  // ============================================================
  const inventoryFilters = () => {
    const f = {};
    if (invCategory !== 'all')    f.category = invCategory;
    if (invStatus !== 'all')      f.status = invStatus;
    if (invIssueable !== 'all')   f.issueableTo = invIssueable;
    return f;
  };

  const movementFilters = () => {
    const f = {};
    if (invMovementType !== 'all')    f.movementType = invMovementType;
    if (invApprovalStatus !== 'all')  f.approvalStatus = invApprovalStatus;
    if (invStartDate)                 f.startDate = ymd(invStartDate);
    if (invEndDate)                   f.endDate = ymd(invEndDate);
    return f;
  };

  const inventoryReports = [
    {
      id: 'stock-on-hand',
      title: 'Stock on Hand',
      description: 'Complete inventory listing with quantities, unit costs, values, and locations.',
      icon: InventoryIcon,
      color: '#4F46E5',
      buildHtml: () => reportService.generateStockOnHandReport(inventoryFilters()),
      buildPdf: () => reportService.downloadStockOnHandReportPDF(inventoryFilters()),
    },
    {
      id: 'low-stock',
      title: 'Low Stock / Reorder',
      description: 'Items at or below minimum level, with suggested reorder quantities and cost.',
      icon: WarningIcon,
      color: '#F59E0B',
      buildHtml: () => reportService.generateLowStockReport(inventoryFilters()),
      buildPdf: () => reportService.downloadLowStockReportPDF(inventoryFilters()),
    },
    {
      id: 'stock-valuation',
      title: 'Stock Valuation',
      description: 'Total inventory value, grouped by category with share-of-total breakdown.',
      icon: TrendingUp,
      color: '#14B8A6',
      buildHtml: () => reportService.generateStockValuationReport({ ...inventoryFilters(), groupBy: 'category' }),
      buildPdf: () => reportService.downloadStockValuationReportPDF({ ...inventoryFilters(), groupBy: 'category' }),
    },
    {
      id: 'movements',
      title: 'Inventory Movements',
      description: 'Full movement history with stock in/out, adjustments and approval status.',
      icon: SwapHoriz,
      color: '#8B5CF6',
      buildHtml: () => reportService.generateInventoryMovementsReport(movementFilters()),
      buildPdf: () => reportService.downloadInventoryMovementsReportPDF(movementFilters()),
    },
    {
      id: 'issues',
      title: 'Inventory Issues Register',
      description: 'All vehicle and driver issues, quantities issued and still outstanding.',
      icon: Assignment,
      color: '#EC4899',
      buildHtml: () => reportService.generateInventoryIssuesReport({ issueType: 'both' }),
      buildPdf: () => reportService.downloadInventoryIssuesReportPDF({ issueType: 'both' }),
    },
  ];

  // ============================================================
  // PREVIEW / DOWNLOAD ORCHESTRATORS
  // ============================================================
  const previewReport = async (report) => {
    setError(null);
    setBusy(true);
    try {
      const html = await report.buildHtml();
      setReportPreview({
        open: true,
        html,
        title: report.title,
        onDownloadPdf: async () => {
          try {
            await report.buildPdf();
            showSuccess(`${report.title} PDF downloaded`);
          } catch (err) {
            setError(err?.userMessage || err?.message || 'Failed to download PDF');
          }
        },
      });
    } catch (err) {
      setError(err?.userMessage || err?.message || 'Failed to generate report');
    } finally {
      setBusy(false);
    }
  };

  const downloadReport = async (report) => {
    setError(null);
    setBusy(true);
    try {
      await report.buildPdf();
      showSuccess(`${report.title} PDF downloaded`);
    } catch (err) {
      setError(err?.userMessage || err?.message || 'Failed to download PDF');
    } finally {
      setBusy(false);
    }
  };

  // ── Trip / Load / Fuel wrappers ─────────────────────────────
  const previewTripReport = (trip) => previewReport({
    title: `Trip Report — ${trip.tripNumber}`,
    buildHtml: () => reportService.generateTripReport(trip.tripNumber),
    buildPdf: () => reportService.downloadTripReportPDF(trip.tripNumber),
  });
  const downloadTripReport = (trip) => downloadReport({
    title: `Trip Report — ${trip.tripNumber}`,
    buildPdf: () => reportService.downloadTripReportPDF(trip.tripNumber),
  });

  const previewLoadReport = (load) => previewReport({
    title: `Load Report — ${load.loadNumber}`,
    buildHtml: () => reportService.generateLoadReport(load.loadNumber),
    buildPdf: () => reportService.downloadLoadReportPDF(load.loadNumber),
  });
  const downloadLoadReport = (load) => downloadReport({
    title: `Load Report — ${load.loadNumber}`,
    buildPdf: () => reportService.downloadLoadReportPDF(load.loadNumber),
  });

  const previewFuelReport = (params) => previewReport({
    title: 'Fuel Consumption Report',
    buildHtml: () => reportService.generateFuelReport(params.vehicleId, params.startDate, params.endDate),
    buildPdf: () => reportService.downloadFuelReportPDF(params.vehicleId, params.startDate, params.endDate),
  });
  const downloadFuelReport = (params) => downloadReport({
    title: 'Fuel Consumption Report',
    buildPdf: () => reportService.downloadFuelReportPDF(params.vehicleId, params.startDate, params.endDate),
  });

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: { xs: 1, sm: 1.5, md: 2 } }}>

        {/* Header */}
        <Box sx={{ mb: 2 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
            <Box display="flex" alignItems="center" gap={1}>
              <AnalyticsIcon sx={{ fontSize: 28, color: 'primary.main' }} />
              <Box>
                <Typography variant="h6" fontWeight="bold" sx={{ fontSize: '1rem' }}>
                  Reports &amp; Analytics
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                  Fleet management insights
                </Typography>
              </Box>
            </Box>
            <Stack direction="row" spacing={0.75}>
              <Button
                variant="outlined"
                startIcon={<Refresh sx={{ fontSize: '0.9rem' }} />}
                onClick={() => window.location.reload()}
                size="small"
                sx={{ fontSize: '0.75rem', py: 0.5, borderRadius: '10px', textTransform: 'none' }}
              >
                Refresh
              </Button>
              <IconButton onClick={handleMenuClick} size="small" sx={{ p: 0.5 }}>
                <MoreVert sx={{ fontSize: '0.9rem' }} />
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              >
                <MenuItem onClick={() => { handleExport('pdf'); handleMenuClose(); }} sx={{ fontSize: '0.8rem' }}>
                  <PictureAsPdf sx={{ mr: 1, fontSize: '0.9rem' }} /> Export as PDF
                </MenuItem>
                <MenuItem onClick={() => { handleExport('excel'); handleMenuClose(); }} sx={{ fontSize: '0.8rem' }}>
                  <Download sx={{ mr: 1, fontSize: '0.9rem' }} /> Export as Excel
                </MenuItem>
                <MenuItem onClick={() => { handleExport('email'); handleMenuClose(); }} sx={{ fontSize: '0.8rem' }}>
                  <Email sx={{ mr: 1, fontSize: '0.9rem' }} /> Email Report
                </MenuItem>
              </Menu>
            </Stack>
          </Box>
        </Box>

        {/* Global alerts */}
        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: '12px', fontSize: '0.8rem' }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2, borderRadius: '12px', fontSize: '0.8rem' }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        {/* Tabs */}
        <Paper
          elevation={0}
          sx={{
            mb: 2,
            borderRadius: '12px',
            border: '1px solid #ECECEC',
            bgcolor: '#FFFFFF',
            overflow: 'hidden',
          }}
        >
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ minHeight: 40 }}
          >
            <Tab icon={<AnalyticsIcon sx={{ fontSize: '0.9rem' }} />}     iconPosition="start" label="Analytics"         sx={{ fontSize: '0.78rem', minHeight: 40, textTransform: 'none' }} />
            <Tab icon={<RouteIcon sx={{ fontSize: '0.9rem' }} />}         iconPosition="start" label="Trip Reports"      sx={{ fontSize: '0.78rem', minHeight: 40, textTransform: 'none' }} />
            <Tab icon={<LocalShippingIcon sx={{ fontSize: '0.9rem' }} />} iconPosition="start" label="Load Reports"      sx={{ fontSize: '0.78rem', minHeight: 40, textTransform: 'none' }} />
            <Tab icon={<LocalGasStation sx={{ fontSize: '0.9rem' }} />}   iconPosition="start" label="Fuel Reports"      sx={{ fontSize: '0.78rem', minHeight: 40, textTransform: 'none' }} />
            <Tab icon={<InventoryIcon sx={{ fontSize: '0.9rem' }} />}     iconPosition="start" label="Inventory Reports" sx={{ fontSize: '0.78rem', minHeight: 40, textTransform: 'none' }} />
            <Tab
  icon={<TuneRoundedIcon sx={{ fontSize: '0.9rem' }} />}
  iconPosition="start"
  label="Custom Pivot"
  sx={{ fontSize: '0.78rem', minHeight: 40, textTransform: 'none' }}
/>
          </Tabs>
        </Paper>

        {/* =============================================== */}
        {/* TAB 0 — Analytics                               */}
        {/* =============================================== */}
        {activeTab === 0 && (
          <Box>
            <Paper sx={{ p: 1.5, mb: 2, borderRadius: '12px', border: '1px solid #ECECEC' }}>
              <Typography variant="subtitle2" sx={{ fontSize: '0.8rem', fontWeight: 600, mb: 1.5 }}>
                <FilterList sx={{ mr: 0.5, fontSize: '0.9rem', verticalAlign: 'middle' }} />
                Report Filters
              </Typography>
              <Grid container spacing={1.5} alignItems="center">
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel sx={{ fontSize: '0.75rem' }}>Time Period</InputLabel>
                    <Select value={period} label="Time Period" onChange={handlePeriodChange} sx={{ fontSize: '0.75rem' }}>
                      <MenuItem value="lastmonth"   sx={{ fontSize: '0.75rem' }}>Last Month</MenuItem>
                      <MenuItem value="last3months" sx={{ fontSize: '0.75rem' }}>Last 3 Months</MenuItem>
                      <MenuItem value="last6months" sx={{ fontSize: '0.75rem' }}>Last 6 Months</MenuItem>
                      <MenuItem value="yeartodate"  sx={{ fontSize: '0.75rem' }}>Year to Date</MenuItem>
                      <MenuItem value="custom"      sx={{ fontSize: '0.75rem' }}>Custom Range</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {showCustomRange && (
                  <>
                    <Grid item xs={12} sm={6} md={3}>
                      <DatePicker
                        label="Start Date"
                        value={dateRange.start}
                        onChange={(date) => setDateRange({ ...dateRange, start: date })}
                        slotProps={{ textField: { fullWidth: true, size: 'small', sx: { '& .MuiInputLabel-root': { fontSize: '0.75rem' } } } }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <DatePicker
                        label="End Date"
                        value={dateRange.end}
                        onChange={(date) => setDateRange({ ...dateRange, end: date })}
                        slotProps={{ textField: { fullWidth: true, size: 'small', sx: { '& .MuiInputLabel-root': { fontSize: '0.75rem' } } } }}
                      />
                    </Grid>
                  </>
                )}

                <Grid item xs={12} sm={6} md={showCustomRange ? 3 : 4}>
                  <FormControl fullWidth size="small">
                    <InputLabel sx={{ fontSize: '0.75rem' }}>Vehicle</InputLabel>
                    <Select value={vehicle} label="Vehicle" onChange={(e) => setVehicle(e.target.value)} sx={{ fontSize: '0.75rem' }}>
                      <MenuItem value="all" sx={{ fontSize: '0.75rem' }}>All Vehicles</MenuItem>
                      {vehiclePerformanceData.map((v) => (
                        <MenuItem key={v.vehicle} value={v.vehicle.toLowerCase()} sx={{ fontSize: '0.75rem' }}>
                          {v.vehicle}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6} md={showCustomRange ? 3 : 4}>
                  <FormControl fullWidth size="small">
                    <InputLabel sx={{ fontSize: '0.75rem' }}>Report Type</InputLabel>
                    <Select value={reportType} label="Report Type" onChange={(e) => setReportType(e.target.value)} sx={{ fontSize: '0.75rem' }}>
                      <MenuItem value="fuel"        sx={{ fontSize: '0.75rem' }}>Fuel Consumption</MenuItem>
                      <MenuItem value="maintenance" sx={{ fontSize: '0.75rem' }}>Maintenance</MenuItem>
                      <MenuItem value="driver"      sx={{ fontSize: '0.75rem' }}>Driver Performance</MenuItem>
                      <MenuItem value="cost"        sx={{ fontSize: '0.75rem' }}>Cost Analysis</MenuItem>
                      <MenuItem value="vehicle"     sx={{ fontSize: '0.75rem' }}>Vehicle Performance</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6} md={showCustomRange ? 3 : 4}>
                  <Stack direction="row" spacing={0.75}>
                    <Button
                      variant="contained"
                      startIcon={<Download sx={{ fontSize: '0.9rem' }} />}
                      onClick={() => handleExport('csv')}
                      size="small"
                      sx={{
                        fontSize: '0.75rem',
                        py: 0.5,
                        flex: 1,
                        borderRadius: '10px',
                        textTransform: 'none',
                        background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)',
                        '&:hover': { background: 'linear-gradient(135deg, #4338CA 0%, #4F46E5 100%)' },
                      }}
                    >
                      Export CSV
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<Print sx={{ fontSize: '0.9rem' }} />}
                      onClick={() => window.print()}
                      size="small"
                      sx={{ fontSize: '0.75rem', py: 0.5, minWidth: 'auto', borderRadius: '10px', textTransform: 'none' }}
                    >
                      Print
                    </Button>
                  </Stack>
                </Grid>
              </Grid>
            </Paper>

            <Grid container spacing={1.5} sx={{ mb: 2 }}>
              <Grid item xs={6} sm={6} md={3}>
                <StatCard title="Total Fuel" value={`${stats.totalFuel.toLocaleString()} L`} icon={LocalGasStation} color="primary" trend trendLabel="5.2% from last period" trendColor="success" />
              </Grid>
              <Grid item xs={6} sm={6} md={3}>
                <StatCard title="Total Cost" value={`R ${stats.totalCost.toLocaleString()}`} icon={DirectionsCar} color="secondary" trend trendLabel="2.1% savings" trendColor="error" />
              </Grid>
              <Grid item xs={6} sm={6} md={3}>
                <StatCard title="Avg Efficiency" value={`${stats.avgEfficiency.toFixed(1)} km/L`} icon={Person} color="info" trend trendLabel="0.3 km/L improvement" trendColor="success" />
              </Grid>
              <Grid item xs={6} sm={6} md={3}>
                <StatCard title="Active Vehicles" value={stats.totalVehicles} icon={CalendarMonth} color="warning" trend trendLabel="8% activity increase" trendColor="success" />
              </Grid>
            </Grid>

            <Grid container spacing={1.5} sx={{ mb: 2 }}>
              <Grid item xs={12} lg={8}>
                <Card sx={{ borderRadius: '12px', border: '1px solid #ECECEC' }}>
                  <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Typography variant="subtitle2" sx={{ fontSize: '0.8rem', fontWeight: 600, mb: 1 }}>
                      Fuel Consumption &amp; Cost Trends
                    </Typography>
                    <ResponsiveContainer width="100%" height={280}>
                      <AreaChart data={fuelConsumptionData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                        <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
                        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} />
                        <RechartsTooltip
                          contentStyle={{ fontSize: '11px' }}
                          formatter={(value, name) => [
                            name === 'consumption' ? `${value} L` : `R ${value.toLocaleString()}`,
                            name === 'consumption' ? 'Fuel Consumption' : 'Cost',
                          ]}
                        />
                        <Legend wrapperStyle={{ fontSize: '11px' }} />
                        <Area yAxisId="left" type="monotone" dataKey="consumption" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} name="Consumption (L)" />
                        <Area yAxisId="right" type="monotone" dataKey="cost" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.3} name="Cost (R)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} lg={4}>
                <Card sx={{ height: '100%', borderRadius: '12px', border: '1px solid #ECECEC' }}>
                  <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Typography variant="subtitle2" sx={{ fontSize: '0.8rem', fontWeight: 600, mb: 1 }}>
                      Expense Distribution
                    </Typography>
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie data={expenseByCategory} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`} outerRadius={80} innerRadius={32} paddingAngle={2} dataKey="value">
                          {expenseByCategory.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip contentStyle={{ fontSize: '11px' }} formatter={(value) => [`${value}%`, 'Percentage']} />
                        <Legend wrapperStyle={{ fontSize: '10px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Box sx={{ mb: 2 }}>
              <Card sx={{ borderRadius: '12px', border: '1px solid #ECECEC' }}>
                <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                  <Typography variant="subtitle2" sx={{ fontSize: '0.8rem', fontWeight: 600, mb: 1 }}>
                    Monthly Cost Comparison
                  </Typography>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={monthlyComparisonData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <RechartsTooltip contentStyle={{ fontSize: '11px' }} formatter={(value) => [`R ${value.toLocaleString()}`, 'Cost']} />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      <Bar dataKey="previous" name="Previous Period" fill="#8884d8" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="current"  name="Current Period"  fill="#82ca9d" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Box>

            <Card sx={{ borderRadius: '12px', border: '1px solid #ECECEC' }}>
              <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                  <Typography variant="subtitle2" sx={{ fontSize: '0.8rem', fontWeight: 600 }}>
                    Vehicle Performance Report
                  </Typography>
                  <Alert severity="info" sx={{ fontSize: '0.7rem', py: 0 }}>
                    {vehicle === 'all' ? 'All vehicles' : 'Selected vehicle'}
                  </Alert>
                </Box>

                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600, py: 0.75 }}>Vehicle</TableCell>
                        <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600, py: 0.75 }}>Efficiency</TableCell>
                        <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600, py: 0.75 }} align="right">Distance</TableCell>
                        <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600, py: 0.75 }} align="right">Fuel Cost</TableCell>
                        <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600, py: 0.75 }} align="right">Cost/km</TableCell>
                        <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600, py: 0.75 }}>Status</TableCell>
                        <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600, py: 0.75 }}>Trend</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {vehiclePerformanceData.map((vehicleData) => (
                        <TableRow key={vehicleData.vehicle} hover>
                          <TableCell sx={{ fontSize: '0.7rem', py: 0.5 }}>
                            <Box display="flex" alignItems="center" gap={0.5}>
                              <DirectionsCar sx={{ fontSize: '0.8rem', color: 'action.active' }} />
                              <Typography fontWeight="500" sx={{ fontSize: '0.7rem' }}>{vehicleData.vehicle}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.7rem', py: 0.5 }}>
                            <Box display="flex" alignItems="center" gap={0.5}>
                              <Typography fontWeight="500" sx={{ fontSize: '0.7rem' }}>{vehicleData.fuelEfficiency}</Typography>
                              {vehicleData.fuelEfficiency > 4 ? <TrendingUp sx={{ fontSize: '0.8rem', color: 'success.main' }} />
                                : vehicleData.fuelEfficiency < 3.6 ? <TrendingDown sx={{ fontSize: '0.8rem', color: 'error.main' }} />
                                : <TrendingUp sx={{ fontSize: '0.8rem', color: 'warning.main' }} />}
                            </Box>
                          </TableCell>
                          <TableCell align="right" sx={{ fontSize: '0.7rem', py: 0.5 }}>{vehicleData.distance.toLocaleString()}</TableCell>
                          <TableCell align="right" sx={{ fontSize: '0.7rem', py: 0.5 }}>
                            <Typography fontWeight="500" sx={{ fontSize: '0.7rem' }}>R {vehicleData.cost.toLocaleString()}</Typography>
                          </TableCell>
                          <TableCell align="right" sx={{ fontSize: '0.7rem', py: 0.5 }}>
                            <Typography fontWeight="500" sx={{ fontSize: '0.7rem' }}>R {vehicleData.avgCostPerKm.toFixed(2)}</Typography>
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.7rem', py: 0.5 }}>
                            <Chip label={vehicleData.status} color={getStatusColor(vehicleData.status)} size="small" sx={{ height: 18, fontSize: '0.6rem' }} />
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.7rem', py: 0.5 }}>
                            {vehicleData.fuelEfficiency > 4
                              ? <Typography color="success.main" variant="caption" sx={{ fontSize: '0.6rem' }}>Excellent</Typography>
                              : vehicleData.fuelEfficiency < 3.6
                                ? <Typography color="error.main" variant="caption" sx={{ fontSize: '0.6rem' }}>Needs Improvement</Typography>
                                : <Typography color="warning.main" variant="caption" sx={{ fontSize: '0.6rem' }}>Average</Typography>}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>

            <Box sx={{ mt: 2 }}>
              <Alert severity="info" icon={false} sx={{ fontSize: '0.75rem', py: 0.75 }}>
                <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                  <strong>Report Summary:</strong> {period.replace('last', 'Last ')} period.
                  Total fuel: {stats.totalFuel.toLocaleString()} L • Avg efficiency: {stats.avgEfficiency.toFixed(1)} km/L
                </Typography>
              </Alert>
            </Box>
          </Box>
        )}

        {/* =============================================== */}
        {/* TAB 1 — Trip Reports                            */}
        {/* =============================================== */}
        {activeTab === 1 && (
          <TripReportsTab
            onPreview={previewTripReport}
            onDownload={downloadTripReport}
            setError={setError}
          />
        )}

        {/* =============================================== */}
        {/* TAB 2 — Load Reports                            */}
        {/* =============================================== */}
        {activeTab === 2 && (
          <LoadReportsTab
            onPreview={previewLoadReport}
            onDownload={downloadLoadReport}
            setError={setError}
          />
        )}

        {/* =============================================== */}
        {/* TAB 3 — Fuel Reports                            */}
        {/* =============================================== */}
        {activeTab === 3 && (
          <FuelReportsTab
            onPreview={previewFuelReport}
            onDownload={downloadFuelReport}
            setError={setError}
          />
        )}

        {/* =============================================== */}
        {/* TAB 4 — Inventory Reports                       */}
        {/* =============================================== */}
        {activeTab === 4 && (
          <Box>
            <Paper sx={{ p: 1.5, mb: 2, borderRadius: '12px', border: '1px solid #ECECEC' }}>
              <Typography variant="subtitle2" sx={{ fontSize: '0.8rem', fontWeight: 600, mb: 1.5 }}>
                <FilterList sx={{ mr: 0.5, fontSize: '0.9rem', verticalAlign: 'middle' }} />
                Inventory Filters (applied to all reports below)
              </Typography>
              <Grid container spacing={1.5}>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel sx={{ fontSize: '0.75rem' }}>Category</InputLabel>
                    <Select value={invCategory} label="Category" onChange={(e) => setInvCategory(e.target.value)} sx={{ fontSize: '0.75rem' }}>
                      <MenuItem value="all" sx={{ fontSize: '0.75rem' }}>All Categories</MenuItem>
                      <MenuItem value="Spare Parts" sx={{ fontSize: '0.75rem' }}>Spare Parts</MenuItem>
                      <MenuItem value="Lubricants" sx={{ fontSize: '0.75rem' }}>Lubricants</MenuItem>
                      <MenuItem value="Tyres" sx={{ fontSize: '0.75rem' }}>Tyres</MenuItem>
                      <MenuItem value="Consumables" sx={{ fontSize: '0.75rem' }}>Consumables</MenuItem>
                      <MenuItem value="Tools" sx={{ fontSize: '0.75rem' }}>Tools</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel sx={{ fontSize: '0.75rem' }}>Status</InputLabel>
                    <Select value={invStatus} label="Status" onChange={(e) => setInvStatus(e.target.value)} sx={{ fontSize: '0.75rem' }}>
                      <MenuItem value="all" sx={{ fontSize: '0.75rem' }}>All Statuses</MenuItem>
                      <MenuItem value="In Stock" sx={{ fontSize: '0.75rem' }}>In Stock</MenuItem>
                      <MenuItem value="Low Stock" sx={{ fontSize: '0.75rem' }}>Low Stock</MenuItem>
                      <MenuItem value="Out of Stock" sx={{ fontSize: '0.75rem' }}>Out of Stock</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel sx={{ fontSize: '0.75rem' }}>Issueable To</InputLabel>
                    <Select value={invIssueable} label="Issueable To" onChange={(e) => setInvIssueable(e.target.value)} sx={{ fontSize: '0.75rem' }}>
                      <MenuItem value="all" sx={{ fontSize: '0.75rem' }}>All</MenuItem>
                      <MenuItem value="both" sx={{ fontSize: '0.75rem' }}>Both</MenuItem>
                      <MenuItem value="driver" sx={{ fontSize: '0.75rem' }}>Driver Only</MenuItem>
                      <MenuItem value="vehicle" sx={{ fontSize: '0.75rem' }}>Vehicle Only</MenuItem>
                      <MenuItem value="neither" sx={{ fontSize: '0.75rem' }}>Neither</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel sx={{ fontSize: '0.75rem' }}>Movement Type</InputLabel>
                    <Select value={invMovementType} label="Movement Type" onChange={(e) => setInvMovementType(e.target.value)} sx={{ fontSize: '0.75rem' }}>
                      <MenuItem value="all" sx={{ fontSize: '0.75rem' }}>All Types</MenuItem>
                      <MenuItem value="IN" sx={{ fontSize: '0.75rem' }}>Stock In</MenuItem>
                      <MenuItem value="OUT" sx={{ fontSize: '0.75rem' }}>Stock Out</MenuItem>
                      <MenuItem value="ADJUSTMENT" sx={{ fontSize: '0.75rem' }}>Adjustment</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel sx={{ fontSize: '0.75rem' }}>Approval Status</InputLabel>
                    <Select value={invApprovalStatus} label="Approval Status" onChange={(e) => setInvApprovalStatus(e.target.value)} sx={{ fontSize: '0.75rem' }}>
                      <MenuItem value="all" sx={{ fontSize: '0.75rem' }}>All Statuses</MenuItem>
                      <MenuItem value="PENDING" sx={{ fontSize: '0.75rem' }}>Pending</MenuItem>
                      <MenuItem value="APPROVED" sx={{ fontSize: '0.75rem' }}>Approved</MenuItem>
                      <MenuItem value="REJECTED" sx={{ fontSize: '0.75rem' }}>Rejected</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <DatePicker
                    label="Start Date"
                    value={invStartDate}
                    onChange={setInvStartDate}
                    slotProps={{ textField: { fullWidth: true, size: 'small', sx: { '& .MuiInputLabel-root': { fontSize: '0.75rem' } } } }}
                  />
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <DatePicker
                    label="End Date"
                    value={invEndDate}
                    onChange={setInvEndDate}
                    slotProps={{ textField: { fullWidth: true, size: 'small', sx: { '& .MuiInputLabel-root': { fontSize: '0.75rem' } } } }}
                  />
                </Grid>
              </Grid>
            </Paper>

            <Alert severity="info" sx={{ mb: 2, borderRadius: '12px', fontSize: '0.8rem' }}>
              Click <strong>Preview</strong> to view any report inline, or <strong>PDF</strong> to download.
              Filters above are applied automatically.
            </Alert>

            <Grid container spacing={2}>
              {inventoryReports.map((report) => (
                <Grid item xs={12} sm={6} md={4} key={report.id}>
                  <InventoryReportCard
                    report={report}
                    onPreview={previewReport}
                    onDownload={downloadReport}
                    disabled={busy}
                  />
                </Grid>
              ))}
            </Grid>

            <Box sx={{ mt: 3 }}>
              <Alert severity="success" icon={false} sx={{ fontSize: '0.75rem', py: 0.75, borderRadius: '12px' }}>
                <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                  Looking for a <strong>single-item report</strong>? Open <strong>Inventory → Items</strong> and click the
                  <DescriptionIcon sx={{ fontSize: '0.85rem', mx: 0.5, verticalAlign: 'middle' }} />
                  icon on any row for a detailed movement + issue history.
                </Typography>
              </Alert>
            </Box>
          </Box>
        )}

        {/* =============================================== */}
        {/* TAB 5 — Custom Pivot                            */}
        {/* =============================================== */}
        {activeTab === 5 && (
          <PivotReportsTab onPreview={previewReport} onDownload={downloadReport} setError={setError} busy={busy} />
        )}

        {/* Preview dialog (shared across tabs) */}
        <ReportPreviewDialog
          preview={reportPreview}
          onClose={() => setReportPreview({ open: false, html: '', title: '', onDownloadPdf: null })}
        />

        {/* Busy snackbar */}
        <Snackbar
          open={busy}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          message="Generating report…"
        />
      </Box>
    </LocalizationProvider>
  );
};

export default Reports;
