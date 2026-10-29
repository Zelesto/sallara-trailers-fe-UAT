// src/pages/Billing.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CardActions,
  Stack,
  Alert,
  CircularProgress,
  Tooltip,
  Divider,
} from '@mui/material';
import {
  Receipt as ReceiptIcon,
  Search,
  Add,
  Download,
  Print,
  Email,
  Visibility,
  Edit,
  Paid,
  Pending,
  CalendarMonth,
  AttachMoney,
  Refresh as RefreshIcon,
  ArrowForward as ArrowForwardIcon,
  PlaylistAddCheck as PlaylistAddCheckIcon,
} from '@mui/icons-material';
import invoiceService from '../services/invoice';
import billingService from '../services/billingService';
import { ResponsiveContainer } from '../components/ResponsiveContainer';

/* ============================================================
   HELPERS
   ============================================================ */

const unwrapList = (res) => {
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
  return [];
};

const formatCurrency = (amount, currency = 'ZAR') => {
  const n = Number(amount) || 0;
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
};

const formatDate = (date) => {
  if (!date) return '—';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
};

const STATUS_META = {
  DRAFT: { label: 'Draft', color: 'default', icon: <Pending fontSize="small" /> },
  PENDING: { label: 'Pending', color: 'warning', icon: <Pending fontSize="small" /> },
  SENT: { label: 'Sent', color: 'info', icon: <Email fontSize="small" /> },
  PAID: { label: 'Paid', color: 'success', icon: <Paid fontSize="small" /> },
  OVERDUE: { label: 'Overdue', color: 'error', icon: <Pending fontSize="small" /> },
  CANCELLED: { label: 'Cancelled', color: 'default', icon: <Pending fontSize="small" /> },
};

/* ============================================================
   MAIN COMPONENT
   ============================================================ */

const Billing = () => {
  const navigate = useNavigate();

  const [invoices, setInvoices] = useState([]);
  const [billableLoads, setBillableLoads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  /* ============================================================
     LOAD REAL DATA
     ============================================================ */

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [invRes, loadRes] = await Promise.all([
        invoiceService.getAllInvoices().catch((err) => {
          console.warn('Billing: invoices failed to load', err?.message);
          return [];
        }),
        billingService.getLoadsWithBillings().catch((err) => {
          console.warn('Billing: billable loads failed to load', err?.message);
          return [];
        }),
      ]);

      setInvoices(unwrapList(invRes));
      setBillableLoads(unwrapList(loadRes));
    } catch (err) {
      console.error('Billing load error:', err);
      setError(err?.message || 'Failed to load billing data');
      setInvoices([]);
      setBillableLoads([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /* ============================================================
     DERIVED DATA
     ============================================================ */

  const stats = useMemo(() => {
    const safeInvoices = Array.isArray(invoices) ? invoices : [];
    const totalInvoiced = safeInvoices.reduce(
      (s, i) => s + (Number(i.totalAmount) || 0),
      0
    );
    const paid = safeInvoices
      .filter((i) => i.status === 'PAID')
      .reduce((s, i) => s + (Number(i.totalAmount) || 0), 0);
    const pending = safeInvoices
      .filter((i) => ['DRAFT', 'SENT', 'PENDING'].includes(i.status))
      .reduce((s, i) => s + (Number(i.totalAmount) || 0), 0);
    const overdue = safeInvoices
      .filter((i) => i.status === 'OVERDUE')
      .reduce((s, i) => s + (Number(i.totalAmount) || 0), 0);
    return {
      totalInvoiced,
      paid,
      pending,
      overdue,
      invoiceCount: safeInvoices.length,
      billableCount: (billableLoads || []).length,
    };
  }, [invoices, billableLoads]);

  const filteredInvoices = useMemo(() => {
    const safe = Array.isArray(invoices) ? invoices : [];
    const term = searchTerm.trim().toLowerCase();
    return safe
      .filter((inv) => {
        const statusOk = statusFilter === 'all' || inv.status === statusFilter;
        if (!statusOk) return false;
        if (!term) return true;
        return (
          (inv.invoiceNumber || '').toLowerCase().includes(term) ||
          (inv.customerName || '').toLowerCase().includes(term) ||
          (inv.description || '').toLowerCase().includes(term)
        );
      })
      .sort((a, b) => {
        const da = new Date(a.invoiceDate || a.createdAt || 0).getTime();
        const db = new Date(b.invoiceDate || b.createdAt || 0).getTime();
        return db - da;
      });
  }, [invoices, searchTerm, statusFilter]);

  const recentInvoices = useMemo(
    () => filteredInvoices.slice(0, 6),
    [filteredInvoices]
  );

  /* ============================================================
     HANDLERS
     ============================================================ */

  const goToInvoicePage = () => navigate('/finance/invoices');
  const goToInvoice = (id) => navigate(`/finance/invoices/${id}`);
  const goToInvoiceEdit = (id) => navigate(`/finance/invoices/${id}/edit`);

  /* ============================================================
     RENDER
     ============================================================ */

  if (loading) {
    return (
      <ResponsiveContainer>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress size={40} />
          <Typography sx={{ ml: 2, fontSize: '0.9rem' }}>Loading billing data...</Typography>
        </Box>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
          <ReceiptIcon sx={{ fontSize: { xs: 32, sm: 40 }, color: 'primary.main' }} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="h5"
              fontWeight="700"
              sx={{ fontSize: { xs: '1.1rem', sm: '1.3rem', md: '1.4rem' } }}
            >
              Billing &amp; Invoices
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem' } }}
            >
              {stats.invoiceCount} invoice{stats.invoiceCount === 1 ? '' : 's'}
              {' • '}
              {stats.billableCount} billable load{stats.billableCount === 1 ? '' : 's'}
              {' '}ready to invoice
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<RefreshIcon />}
              onClick={load}
              sx={{ borderRadius: '10px', textTransform: 'none', fontSize: '0.75rem' }}
            >
              Refresh
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<PlaylistAddCheckIcon />}
              onClick={goToInvoicePage}
              sx={{ borderRadius: '10px', textTransform: 'none', fontSize: '0.75rem' }}
            >
              From Billing
            </Button>
            <Button
              variant="contained"
              size="small"
              startIcon={<Add />}
              onClick={goToInvoicePage}
              sx={{
                borderRadius: '10px',
                textTransform: 'none',
                fontSize: '0.75rem',
                background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #4338CA 0%, #4F46E5 100%)',
                },
              }}
            >
              Create Invoice
            </Button>
          </Stack>
        </Box>
      </Box>

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2, borderRadius: '12px', fontSize: '0.8rem' }}
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={{ xs: 1.5, sm: 2 }} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, md: 3 }}>
          <Card sx={{ borderRadius: '14px', border: '1px solid #ECECEC', boxShadow: 'none' }}>
            <CardContent sx={{ p: 2 }}>
              <Typography color="text.secondary" sx={{ fontSize: '0.6rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Total Invoiced
              </Typography>
              <Typography sx={{ fontWeight: 700, fontSize: { xs: '1.05rem', sm: '1.25rem' }, mt: 0.5 }}>
                {formatCurrency(stats.totalInvoiced)}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
                {stats.invoiceCount} invoice{stats.invoiceCount === 1 ? '' : 's'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Card sx={{ borderRadius: '14px', border: '1px solid #ECECEC', boxShadow: 'none' }}>
            <CardContent sx={{ p: 2 }}>
              <Typography color="text.secondary" sx={{ fontSize: '0.6rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Outstanding
              </Typography>
              <Typography sx={{ fontWeight: 700, fontSize: { xs: '1.05rem', sm: '1.25rem' }, mt: 0.5, color: 'warning.main' }}>
                {formatCurrency(stats.pending)}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
                Awaiting payment
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Card sx={{ borderRadius: '14px', border: '1px solid #ECECEC', boxShadow: 'none' }}>
            <CardContent sx={{ p: 2 }}>
              <Typography color="text.secondary" sx={{ fontSize: '0.6rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Overdue
              </Typography>
              <Typography sx={{ fontWeight: 700, fontSize: { xs: '1.05rem', sm: '1.25rem' }, mt: 0.5, color: 'error.main' }}>
                {formatCurrency(stats.overdue)}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
                Past due date
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Card sx={{ borderRadius: '14px', border: '1px solid #ECECEC', boxShadow: 'none' }}>
            <CardContent sx={{ p: 2 }}>
              <Typography color="text.secondary" sx={{ fontSize: '0.6rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Billable Loads
              </Typography>
              <Typography sx={{ fontWeight: 700, fontSize: { xs: '1.05rem', sm: '1.25rem' }, mt: 0.5, color: 'primary.main' }}>
                {stats.billableCount}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
                Ready to invoice
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Actions & Search */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 2,
          borderRadius: '14px',
          border: '1px solid #ECECEC',
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, md: 5 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search invoices by number, customer, description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ fontSize: '1rem' }} />
                  </InputAdornment>
                ),
              }}
              sx={{ '& .MuiInputBase-root': { borderRadius: '10px', fontSize: '0.8rem' } }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ fontSize: '0.75rem' }}>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
                sx={{ borderRadius: '10px', fontSize: '0.8rem' }}
              >
                <MenuItem value="all" sx={{ fontSize: '0.8rem' }}>All Status</MenuItem>
                <MenuItem value="DRAFT" sx={{ fontSize: '0.8rem' }}>Draft</MenuItem>
                <MenuItem value="PENDING" sx={{ fontSize: '0.8rem' }}>Pending</MenuItem>
                <MenuItem value="SENT" sx={{ fontSize: '0.8rem' }}>Sent</MenuItem>
                <MenuItem value="PAID" sx={{ fontSize: '0.8rem' }}>Paid</MenuItem>
                <MenuItem value="OVERDUE" sx={{ fontSize: '0.8rem' }}>Overdue</MenuItem>
                <MenuItem value="CANCELLED" sx={{ fontSize: '0.8rem' }}>Cancelled</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }} sx={{ textAlign: { md: 'right' } }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<Download />}
              onClick={() => {
                // Simple CSV export of the filtered list
                const rows = filteredInvoices;
                if (rows.length === 0) return;
                const headers = ['Invoice #', 'Date', 'Customer', 'Amount', 'Status', 'Due Date'];
                const csv = [
                  headers.join(','),
                  ...rows.map((i) =>
                    [
                      i.invoiceNumber || '',
                      formatDate(i.invoiceDate),
                      i.customerName || i.customerId || '',
                      Number(i.totalAmount) || 0,
                      i.status || '',
                      formatDate(i.dueDate),
                    ]
                      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
                      .join(',')
                  ),
                ].join('\n');
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `invoices-${new Date().toISOString().slice(0, 10)}.csv`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              sx={{ borderRadius: '10px', textTransform: 'none', fontSize: '0.75rem', ml: 1 }}
            >
              Export CSV
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Recent Invoices Table */}
      <Card sx={{ borderRadius: '14px', border: '1px solid #ECECEC', boxShadow: 'none', mb: 3 }}>
        <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
            <Typography variant="h6" sx={{ fontSize: '0.95rem', fontWeight: 600 }}>
              Recent Invoices
            </Typography>
            <Button
              size="small"
              endIcon={<ArrowForwardIcon sx={{ fontSize: '0.9rem' }} />}
              onClick={goToInvoicePage}
              sx={{ textTransform: 'none', fontSize: '0.75rem' }}
            >
              View all
            </Button>
          </Stack>

          {recentInvoices.length === 0 ? (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <ReceiptIcon sx={{ fontSize: 48, color: '#D1D5DB', mb: 2 }} />
              <Typography color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                No invoices yet
              </Typography>
              <Button
                size="small"
                variant="contained"
                startIcon={<Add />}
                onClick={goToInvoicePage}
                sx={{
                  mt: 2,
                  textTransform: 'none',
                  borderRadius: '10px',
                  fontSize: '0.75rem',
                  background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)',
                }}
              >
                Create first invoice
              </Button>
            </Box>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#F9FAFB' }}>
                  <TableRow>
                    <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600, color: '#6B7280' }}>Invoice #</TableCell>
                    <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600, color: '#6B7280' }}>Date</TableCell>
                    <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600, color: '#6B7280' }}>Customer</TableCell>
                    <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600, color: '#6B7280' }} align="right">Amount</TableCell>
                    <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600, color: '#6B7280' }}>Status</TableCell>
                    <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600, color: '#6B7280' }}>Due Date</TableCell>
                    <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600, color: '#6B7280' }} align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentInvoices.map((invoice) => {
                    const meta = STATUS_META[invoice.status] || STATUS_META.DRAFT;
                    return (
                      <TableRow key={invoice.id} hover>
                        <TableCell sx={{ fontSize: '0.75rem', py: 1 }}>
                          <Typography fontWeight="600" sx={{ fontSize: '0.75rem', color: '#4F46E5' }}>
                            {invoice.invoiceNumber || `INV-${invoice.id}`}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.75rem' }}>{formatDate(invoice.invoiceDate)}</TableCell>
                        <TableCell sx={{ fontSize: '0.75rem' }}>
                          {invoice.customerName || invoice.customerId || '—'}
                        </TableCell>
                        <TableCell align="right" sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
                          {formatCurrency(invoice.totalAmount, invoice.currency)}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={meta.label}
                            color={meta.color}
                            size="small"
                            icon={meta.icon}
                            sx={{ height: 20, fontSize: '0.6rem' }}
                          />
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.75rem' }}>{formatDate(invoice.dueDate)}</TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={0.25} justifyContent="flex-end">
                            <Tooltip title="View">
                              <IconButton size="small" color="primary" onClick={() => goToInvoice(invoice.id)}>
                                <Visibility fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Edit">
                              <IconButton size="small" color="secondary" onClick={() => goToInvoiceEdit(invoice.id)}>
                                <Edit fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
        <Divider />
        <CardActions sx={{ justifyContent: 'space-between', p: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
            Showing {recentInvoices.length} of {filteredInvoices.length} matching invoice
            {filteredInvoices.length === 1 ? '' : 's'}
          </Typography>
          <Button
            size="small"
            variant="outlined"
            endIcon={<ArrowForwardIcon sx={{ fontSize: '0.9rem' }} />}
            onClick={goToInvoicePage}
            sx={{ borderRadius: '10px', textTransform: 'none', fontSize: '0.75rem' }}
          >
            Full invoice list
          </Button>
        </CardActions>
      </Card>

      {/* Billable Loads + Payment Summary */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Card sx={{ borderRadius: '14px', border: '1px solid #ECECEC', boxShadow: 'none', height: '100%' }}>
            <CardContent sx={{ p: 2 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
                <Typography variant="h6" sx={{ fontSize: '0.95rem', fontWeight: 600 }}>
                  Billable Loads
                </Typography>
                <Chip
                  size="small"
                  label={`${stats.billableCount} ready`}
                  color="primary"
                  variant="outlined"
                  sx={{ height: 20, fontSize: '0.6rem' }}
                />
              </Stack>

              {billableLoads.length === 0 ? (
                <Alert severity="info" sx={{ fontSize: '0.75rem' }}>
                  No loads are ready to be invoiced. Recalculate billing on a completed load first
                  (Load Management → Recalculate Billing), then come back here.
                </Alert>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600, color: '#6B7280' }}>Load</TableCell>
                        <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600, color: '#6B7280' }} align="right">Trips</TableCell>
                        <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600, color: '#6B7280' }} align="right">Amount</TableCell>
                        <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600, color: '#6B7280' }} align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {billableLoads.slice(0, 8).map((load) => {
                        const id = load.id ?? load.loadId;
                        const label =
                          load.loadNumber ||
                          load.referenceNumber ||
                          `Load #${id}`;
                        return (
                          <TableRow key={String(id)} hover>
                            <TableCell sx={{ fontSize: '0.75rem', fontWeight: 500 }}>{label}</TableCell>
                            <TableCell align="right" sx={{ fontSize: '0.75rem' }}>
                              {load.totalTrips || load.tripCount || '—'}
                            </TableCell>
                            <TableCell align="right" sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
                              {formatCurrency(
                                load.total ?? load.totalAmount ?? load.totalCalculatedAmount ?? 0
                              )}
                            </TableCell>
                            <TableCell align="right">
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={goToInvoicePage}
                                sx={{
                                  textTransform: 'none',
                                  fontSize: '0.7rem',
                                  borderRadius: '8px',
                                  py: 0.25,
                                }}
                              >
                                Invoice
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {billableLoads.length > 0 && (
                <Box sx={{ mt: 1.5, textAlign: 'right' }}>
                  <Button
                    size="small"
                    endIcon={<ArrowForwardIcon sx={{ fontSize: '0.9rem' }} />}
                    onClick={goToInvoicePage}
                    sx={{ textTransform: 'none', fontSize: '0.75rem' }}
                  >
                    Open From Billing
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          <Card sx={{ borderRadius: '14px', border: '1px solid #ECECEC', boxShadow: 'none', height: '100%' }}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ fontSize: '0.95rem', fontWeight: 600 }} gutterBottom>
                Payment Summary
              </Typography>
              <Box sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: '10px', mt: 1 }}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                      Paid
                    </Typography>
                    <Typography sx={{ fontWeight: 600, fontSize: '0.95rem', color: 'success.main' }}>
                      {formatCurrency(stats.paid)}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                      Outstanding
                    </Typography>
                    <Typography sx={{ fontWeight: 600, fontSize: '0.95rem', color: 'warning.main' }}>
                      {formatCurrency(stats.pending)}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                      Overdue
                    </Typography>
                    <Typography sx={{ fontWeight: 600, fontSize: '0.95rem', color: 'error.main' }}>
                      {formatCurrency(stats.overdue)}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                      Total Invoiced
                    </Typography>
                    <Typography sx={{ fontWeight: 600, fontSize: '0.95rem' }}>
                      {formatCurrency(stats.totalInvoiced)}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>

              <Stack direction="row" spacing={1} sx={{ mt: 2 }} flexWrap="wrap" useFlexGap>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<Email />}
                  onClick={goToInvoicePage}
                  sx={{ textTransform: 'none', fontSize: '0.7rem', borderRadius: '8px' }}
                >
                  Send Reminders
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<Print />}
                  onClick={() => window.print()}
                  sx={{ textTransform: 'none', fontSize: '0.7rem', borderRadius: '8px' }}
                >
                  Print Page
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<AttachMoney />}
                  onClick={goToInvoicePage}
                  sx={{ textTransform: 'none', fontSize: '0.7rem', borderRadius: '8px' }}
                >
                  Record Payment
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </ResponsiveContainer>
  );
};

export default Billing;
