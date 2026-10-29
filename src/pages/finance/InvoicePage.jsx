// src/pages/finance/InvoicePage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Container, Paper, Typography, Button, Grid, TextField,
  IconButton, Chip, Stack, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TablePagination,
  Dialog, DialogTitle, DialogContent, DialogActions,
  MenuItem, Select, FormControl, InputLabel, Alert,
  LinearProgress, Card, CardContent, Divider, Tab, Tabs,
  Tooltip, CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
  Email as EmailIcon,
  Payment as PaymentIcon,
  Search as SearchIcon,
  Receipt as ReceiptIcon,
  Receipt as BillingIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';

import invoiceService from '../../services/invoice';
import billingService from '../../services/billingService';
import customerService from '../../services/customerService';
import accountService from '../../services/account';

/* ============================================================
   CONSTANTS
   ============================================================ */

const INVOICE_STATUS_OPTIONS = [
  { value: 'DRAFT', label: 'Draft', color: 'default' },
  { value: 'PENDING', label: 'Pending', color: 'warning' },
  { value: 'SENT', label: 'Sent', color: 'info' },
  { value: 'PAID', label: 'Paid', color: 'success' },
  { value: 'OVERDUE', label: 'Overdue', color: 'error' },
  { value: 'CANCELLED', label: 'Cancelled', color: 'default' },
];

const INVOICE_TYPE_OPTIONS = [
  { value: 'RECEIVABLE', label: 'Receivable', color: 'primary' },
  { value: 'PAYABLE', label: 'Payable', color: 'secondary' },
];

/* ============================================================
   HELPERS
   ============================================================ */

const formatCurrency = (amount, currency = 'ZAR') => {
  if (amount === null || amount === undefined) amount = 0;
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

// Unwrap the outer axios wrapper if present: { data: X, status, ... } → X
const unwrapApi = (res) => {
  if (!res) return res;
  if (res.data !== undefined && (res.status !== undefined || res.config !== undefined)) {
    return res.data;
  }
  return res;
};

// Any of: raw array | {data: [...]} | {content: [...]} | {data: {content: [...]}}
const unwrapList = (res) => {
  const payload = unwrapApi(res);
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.content)) return payload.content;
  if (Array.isArray(payload.data)) return payload.data;
  if (payload.data && Array.isArray(payload.data.content)) return payload.data.content;
  return [];
};

const toIsoDate = (date) => {
  if (!date) return null;
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
};

// Loads can carry both a DB id and a business loadId — prefer the DB id
const getLoadId = (load) =>
  load?.id ?? load?.loadId ?? load?.loadID ?? null;

const getLoadLabel = (load) =>
  load?.loadNumber ||
  load?.referenceNumber ||
  (getLoadId(load) !== null ? `Load #${getLoadId(load)}` : 'Load');

// Pull a human-readable message out of an axios/network error
const extractError = (err, fallback) => {
  if (!err) return fallback;
  const d = err.response?.data;
  return (
    (typeof d === 'string' && d) ||
    d?.message ||
    d?.error ||
    d?.detail ||
    err.userMessage ||
    err.message ||
    fallback
  );
};

const TabPanel = ({ children, value, index, ...other }) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`invoice-tabpanel-${index}`}
    aria-labelledby={`invoice-tab-${index}`}
    {...other}
  >
    {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
  </div>
);

/* ============================================================
   MAIN COMPONENT
   ============================================================ */

const InvoicePage = () => {
  const navigate = useNavigate();

  // List state
  const [tabValue, setTabValue] = useState(0);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [customers, setCustomers] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [totalElements, setTotalElements] = useState(0);

  // Dialog-specific state (so errors show INSIDE the dialog, not behind it)
  const [dialogError, setDialogError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Billing dialog state
  const [loadBillingSummary, setLoadBillingSummary] = useState(null);
  const [selectedLoadId, setSelectedLoadId] = useState('');
  const [loadsWithBillings, setLoadsWithBillings] = useState([]);
  const [openBillingDialog, setOpenBillingDialog] = useState(false);
  const [generatingInvoice, setGeneratingInvoice] = useState(false);
  const [loadingLoads, setLoadingLoads] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [billingError, setBillingError] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    invoiceNumber: '',
    invoiceDate: new Date(),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    customerId: '',
    description: '',
    items: [{ description: '', quantity: 1, unitPrice: 0, taxRate: 15 }],
    currency: 'ZAR',
    invoiceType: 'RECEIVABLE',
    notes: '',
    status: 'DRAFT',
  });

  /* ============================================================
     DATA FETCHING
     ============================================================ */

  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await invoiceService.getAllInvoices();
      const list = unwrapList(response);
      console.log('📋 Invoices loaded:', list.length, 'response shape:', response);
      setInvoices(list);
      setTotalElements(list.length);
    } catch (err) {
      console.error('❌ Error fetching invoices:', err);
      setError(extractError(err, 'Failed to load invoices'));
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCustomers = useCallback(async () => {
    try {
      const response = await customerService.getAllCustomers(0, 100);
      const list = unwrapList(response);
      setCustomers(list);
    } catch (err) {
      console.error('Error fetching customers:', err);
      setCustomers([]);
    }
  }, []);

  const fetchAccounts = useCallback(async () => {
    try {
      const response = await accountService.getAllAccounts();
      const list = unwrapList(response);
      setAccounts(list.filter(acc => acc && acc.active !== false));
    } catch (err) {
      console.error('Error fetching accounts:', err);
      setAccounts([]);
    }
  }, []);

  const fetchLoadsWithBillings = useCallback(async () => {
    setLoadingLoads(true);
    try {
      const response = await billingService.getLoadsWithBillings();
      const list = unwrapList(response);
      console.log('📦 Loads with billings:', list.length, 'shape:', response);
      setLoadsWithBillings(list);
    } catch (err) {
      console.error('Error fetching loads with billings:', err);
      setLoadsWithBillings([]);
    } finally {
      setLoadingLoads(false);
    }
  }, []);

  const fetchLoadBillingSummary = useCallback(async (loadId) => {
    if (!loadId) return null;
    setLoadingSummary(true);
    setBillingError('');
    try {
      const raw = await billingService.getLoadBillingSummary(loadId);
      const data = unwrapApi(raw);
      console.log('💷 Billing summary for load', loadId, ':', data);
      setLoadBillingSummary(data || null);
      return data;
    } catch (err) {
      console.error('Error fetching billing summary:', err);
      setLoadBillingSummary(null);
      setBillingError(extractError(err, 'Failed to load billing summary for this load'));
      return null;
    } finally {
      setLoadingSummary(false);
    }
  }, []);

  useEffect(() => {
    fetchInvoices();
    fetchCustomers();
    fetchAccounts();
    fetchLoadsWithBillings();
  }, [fetchInvoices, fetchCustomers, fetchAccounts, fetchLoadsWithBillings]);

  /* ============================================================
     HANDLERS
     ============================================================ */

  const handleTabChange = (event, newValue) => setTabValue(newValue);
  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenDialog = (invoice = null) => {
    setDialogError('');
    if (invoice) {
      setSelectedInvoice(invoice);
      setFormData({
        invoiceNumber: invoice.invoiceNumber || '',
        invoiceDate: invoice.invoiceDate ? new Date(invoice.invoiceDate) : new Date(),
        dueDate: invoice.dueDate
          ? new Date(invoice.dueDate)
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        customerId: invoice.customerId ?? '',
        description: invoice.description || '',
        items:
          Array.isArray(invoice.items) && invoice.items.length > 0
            ? invoice.items.map(i => ({
                description: i.description || '',
                quantity: i.quantity ?? 1,
                unitPrice: i.unitPrice ?? 0,
                taxRate: i.taxRate ?? 15,
              }))
            : [{ description: '', quantity: 1, unitPrice: 0, taxRate: 15 }],
        currency: invoice.currency || 'ZAR',
        invoiceType: invoice.invoiceType || 'RECEIVABLE',
        notes: invoice.notes || '',
        status: invoice.status || 'DRAFT',
      });
    } else {
      setSelectedInvoice(null);
      setFormData({
        invoiceNumber: `INV-${new Date().getFullYear()}${String(
          new Date().getMonth() + 1
        ).padStart(2, '0')}-${Date.now().toString().slice(-4)}`,
        invoiceDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        customerId: '',
        description: '',
        items: [{ description: '', quantity: 1, unitPrice: 0, taxRate: 15 }],
        currency: 'ZAR',
        invoiceType: 'RECEIVABLE',
        notes: '',
        status: 'DRAFT',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedInvoice(null);
    setDialogError('');
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (dialogError) setDialogError('');
  };

  const handleDateChange = (date, field) => {
    setFormData(prev => ({ ...prev, [field]: date }));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    const qty = Number(newItems[index].quantity) || 0;
    const price = Number(newItems[index].unitPrice) || 0;
    const tax = Number(newItems[index].taxRate) || 0;
    newItems[index].total = qty * price;
    newItems[index].taxAmount = newItems[index].total * (tax / 100);
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { description: '', quantity: 1, unitPrice: 0, taxRate: 15 }],
    }));
  };

  const removeItem = (index) => {
    if (formData.items.length > 1) {
      const newItems = [...formData.items];
      newItems.splice(index, 1);
      setFormData(prev => ({ ...prev, items: newItems }));
    }
  };

  const calculateTotals = () => {
    const subtotal = formData.items.reduce(
      (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0),
      0
    );
    const taxTotal = formData.items.reduce((sum, item) => {
      const line = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
      return sum + line * ((Number(item.taxRate) || 0) / 100);
    }, 0);
    return { subtotal, taxTotal, total: subtotal + taxTotal };
  };

  /* ---------------- CREATE / UPDATE INVOICE ---------------- */

  const handleSubmit = async () => {
    setDialogError('');

    // Validate
    if (!formData.customerId) {
      setDialogError('Please select a customer.');
      return;
    }
    if (!formData.invoiceDate || !formData.dueDate) {
      setDialogError('Invoice date and due date are required.');
      return;
    }
    const validItems = formData.items.filter(
      i => i.description && Number(i.quantity) > 0
    );
    if (validItems.length === 0) {
      setDialogError('Add at least one item with a description and quantity greater than 0.');
      return;
    }

    const totals = calculateTotals();

    // Clean payload: numbers for numeric fields, ISO strings for dates,
    // and strip computed item-level fields that backends often reject.
    const invoicePayload = {
      invoiceNumber: formData.invoiceNumber,
      invoiceDate: toIsoDate(formData.invoiceDate),
      dueDate: toIsoDate(formData.dueDate),
      customerId: Number(formData.customerId),
      description: formData.description || null,
      items: validItems.map(i => ({
        description: i.description,
        quantity: Number(i.quantity),
        unitPrice: Number(i.unitPrice),
        taxRate: Number(i.taxRate),
      })),
      subtotal: totals.subtotal,
      taxTotal: totals.taxTotal,
      taxAmount: totals.taxTotal, // send both for backend compat
      totalAmount: totals.total,
      currency: formData.currency,
      invoiceType: formData.invoiceType,
      notes: formData.notes || null,
      status: formData.status,
    };

    setSubmitting(true);
    try {
      console.log('📤 Invoice payload:', invoicePayload);
      if (selectedInvoice) {
        await invoiceService.updateInvoice(selectedInvoice.id, invoicePayload);
        setSuccessMessage(`Invoice ${formData.invoiceNumber} updated.`);
      } else {
        await invoiceService.createInvoice(invoicePayload);
        setSuccessMessage(`Invoice ${formData.invoiceNumber} created.`);
      }
      await fetchInvoices();
      handleCloseDialog();
    } catch (err) {
      console.error('❌ Invoice save failed:', err);
      // Surface the real backend message INSIDE the dialog
      setDialogError(extractError(err, 'Failed to save invoice'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this invoice?')) return;
    try {
      await invoiceService.deleteInvoice(id);
      setSuccessMessage('Invoice deleted.');
      await fetchInvoices();
    } catch (err) {
      console.error('Error deleting invoice:', err);
      setError(extractError(err, 'Failed to delete invoice'));
    }
  };

  const handleSendEmail = async (id) => {
    try {
      await invoiceService.sendInvoiceEmail(id);
      setSuccessMessage('Invoice email sent.');
    } catch (err) {
      console.error('Error sending invoice email:', err);
      setError(extractError(err, 'Failed to send invoice email'));
    }
  };

  const handleMarkAsPaid = async (id) => {
    try {
      await invoiceService.markAsPaid(id);
      setSuccessMessage('Invoice marked as paid.');
      await fetchInvoices();
    } catch (err) {
      console.error('Error marking invoice as paid:', err);
      setError(extractError(err, 'Failed to mark invoice as paid'));
    }
  };

  /* ---------------- FROM-BILLING FLOW ---------------- */

  const handleOpenBillingDialog = () => {
    setBillingError('');
    setSelectedLoadId('');
    setLoadBillingSummary(null);
    setOpenBillingDialog(true);
    // Refresh the loads each time the dialog is opened
    fetchLoadsWithBillings();
  };

  const handleCloseBillingDialog = () => {
    setOpenBillingDialog(false);
    setSelectedLoadId('');
    setLoadBillingSummary(null);
    setBillingError('');
  };

  const handleLoadSelect = async (loadId) => {
    setSelectedLoadId(loadId);
    setLoadBillingSummary(null);
    if (loadId !== '' && loadId !== null && loadId !== undefined) {
      await fetchLoadBillingSummary(loadId);
    }
  };

  const handleGenerateInvoiceFromBilling = async () => {
    if (!selectedLoadId) {
      setBillingError('Please select a load first.');
      return;
    }
    setGeneratingInvoice(true);
    setBillingError('');
    try {
      const raw = await billingService.generateInvoiceFromLoad(selectedLoadId);
      const invoice = unwrapApi(raw);
      console.log('✅ Invoice generated from billing:', invoice);

      setOpenBillingDialog(false);
      setSuccessMessage(
        invoice?.invoiceNumber
          ? `Invoice ${invoice.invoiceNumber} generated from load ${selectedLoadId}.`
          : `Invoice generated from load ${selectedLoadId}.`
      );
      await fetchInvoices();

      if (invoice?.id) {
        // Optional: jump to the invoice
        // navigate(`/finance/invoices/${invoice.id}`);
      }
    } catch (err) {
      console.error('❌ Error generating invoice:', err);
      setBillingError(extractError(err, 'Failed to generate invoice'));
    } finally {
      setGeneratingInvoice(false);
    }
  };

  /* ============================================================
     DERIVED
     ============================================================ */

  const filteredInvoices = invoices.filter(invoice => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      (invoice.invoiceNumber || '').toLowerCase().includes(term) ||
      (invoice.description || '').toLowerCase().includes(term) ||
      (invoice.customerName || '').toLowerCase().includes(term);
    const matchesStatus = filterStatus === 'all' || invoice.status === filterStatus;
    const matchesType = filterType === 'all' || invoice.invoiceType === filterType;
    return matchesSearch && matchesStatus && matchesType;
  });

  const stats = {
    total: filteredInvoices.reduce((s, inv) => s + (inv.totalAmount || 0), 0),
    overdue: filteredInvoices
      .filter(inv => inv.status === 'OVERDUE')
      .reduce((s, inv) => s + (inv.totalAmount || 0), 0),
    pending: filteredInvoices
      .filter(inv => ['DRAFT', 'SENT', 'PENDING'].includes(inv.status))
      .reduce((s, inv) => s + (inv.totalAmount || 0), 0),
  };

  const totals = calculateTotals();

  if (loading && invoices.length === 0) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2 }}>Loading invoices...</Typography>
      </Container>
    );
  }

  /* ============================================================
     RENDER
     ============================================================ */

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        {successMessage && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccessMessage('')}>
            {successMessage}
          </Alert>
        )}

        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h4" fontWeight={600}>Invoice Management</Typography>
            <Typography variant="body2" color="text.secondary">
              {totalElements > 0 ? `${totalElements} invoices total` : 'Manage your invoices'}
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <Button variant="outlined" startIcon={<BillingIcon />} onClick={handleOpenBillingDialog}>
              From Billing
            </Button>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
              Create Invoice
            </Button>
          </Stack>
        </Box>

        {/* Stats */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary">Total Invoiced</Typography>
                <Typography variant="h5" fontWeight={600} color="primary.main">
                  {formatCurrency(stats.total)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {filteredInvoices.length} invoices
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary">Pending Payment</Typography>
                <Typography variant="h5" fontWeight={600} color="warning.main">
                  {formatCurrency(stats.pending)}
                </Typography>
                <Typography variant="caption" color="text.secondary">Awaiting payment</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary">Overdue Amount</Typography>
                <Typography variant="h5" fontWeight={600} color="error.main">
                  {formatCurrency(stats.overdue)}
                </Typography>
                <Typography variant="caption" color="text.secondary">Past due date</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="All Invoices" />
            <Tab label="Manual" />
            <Tab label="From Billing" />
            <Tab label="Draft" />
            <Tab label="Overdue" />
          </Tabs>
        </Box>

        {[0, 1, 2, 3, 4].map(index => (
          <TabPanel key={index} value={tabValue} index={index}>
            <InvoiceList
              invoices={
                index === 0 ? filteredInvoices :
                index === 1 ? filteredInvoices.filter(i => i.source === 'MANUAL') :
                index === 2 ? filteredInvoices.filter(i => i.source === 'BILLING') :
                index === 3 ? filteredInvoices.filter(i => i.status === 'DRAFT') :
                filteredInvoices.filter(i => i.status === 'OVERDUE')
              }
              loading={loading}
              page={page}
              rowsPerPage={rowsPerPage}
              searchTerm={searchTerm}
              filterStatus={filterStatus}
              filterType={filterType}
              customers={customers}
              onSearchChange={setSearchTerm}
              onStatusFilterChange={setFilterStatus}
              onTypeFilterChange={setFilterType}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              onEdit={handleOpenDialog}
              onDelete={handleDelete}
              onMarkPaid={handleMarkAsPaid}
              onSendEmail={handleSendEmail}
              onRefresh={fetchInvoices}
              showSource={index === 1 || index === 2}
            />
          </TabPanel>
        ))}

        {/* Create/Edit Invoice Dialog */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
          <DialogTitle>
            {selectedInvoice ? 'Edit Invoice' : 'Create New Invoice'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              {dialogError && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setDialogError('')}>
                  {dialogError}
                </Alert>
              )}
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Invoice Number"
                    name="invoiceNumber"
                    value={formData.invoiceNumber}
                    onChange={handleFormChange}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Invoice Type</InputLabel>
                    <Select
                      name="invoiceType"
                      value={formData.invoiceType}
                      label="Invoice Type"
                      onChange={handleFormChange}
                    >
                      {INVOICE_TYPE_OPTIONS.map(type => (
                        <MenuItem key={type.value} value={type.value}>
                          {type.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <DatePicker
                    label="Invoice Date"
                    value={formData.invoiceDate}
                    onChange={(date) => handleDateChange(date, 'invoiceDate')}
                    slotProps={{ textField: { fullWidth: true, required: true } }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <DatePicker
                    label="Due Date"
                    value={formData.dueDate}
                    onChange={(date) => handleDateChange(date, 'dueDate')}
                    slotProps={{ textField: { fullWidth: true, required: true } }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth required error={!formData.customerId && !!dialogError}>
                    <InputLabel>Customer</InputLabel>
                    <Select
                      name="customerId"
                      value={formData.customerId}
                      label="Customer"
                      onChange={handleFormChange}
                    >
                      {customers.length === 0 && (
                        <MenuItem disabled value="">
                          <em>No customers available</em>
                        </MenuItem>
                      )}
                      {customers.map(customer => (
                        <MenuItem key={customer.id} value={customer.id}>
                          {customer.name || customer.customerName || `Customer #${customer.id}`}
                          {customer.email ? ` (${customer.email})` : ''}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Description"
                    name="description"
                    value={formData.description}
                    onChange={handleFormChange}
                    multiline
                    rows={2}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>Items</Typography>
                  {formData.items.map((item, index) => (
                    <Paper
                      key={index}
                      sx={{ p: 2, mb: 2, border: '1px solid', borderColor: 'divider' }}
                    >
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={4}>
                          <TextField
                            fullWidth
                            label="Description"
                            value={item.description}
                            onChange={e => handleItemChange(index, 'description', e.target.value)}
                            required
                          />
                        </Grid>
                        <Grid item xs={6} md={2}>
                          <TextField
                            fullWidth
                            label="Qty"
                            type="number"
                            value={item.quantity}
                            onChange={e =>
                              handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)
                            }
                            InputProps={{ inputProps: { min: 1 } }}
                          />
                        </Grid>
                        <Grid item xs={6} md={2}>
                          <TextField
                            fullWidth
                            label="Unit Price"
                            type="number"
                            value={item.unitPrice}
                            onChange={e =>
                              handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)
                            }
                            InputProps={{
                              startAdornment: (
                                <Typography sx={{ mr: 1 }}>{formData.currency}</Typography>
                              ),
                            }}
                          />
                        </Grid>
                        <Grid item xs={6} md={2}>
                          <TextField
                            fullWidth
                            label="Tax %"
                            type="number"
                            value={item.taxRate}
                            onChange={e =>
                              handleItemChange(index, 'taxRate', parseFloat(e.target.value) || 0)
                            }
                            InputProps={{ inputProps: { min: 0, max: 100 } }}
                          />
                        </Grid>
                        <Grid item xs={6} md={2}>
                          <Typography variant="body2" fontWeight={600}>
                            {formatCurrency(item.total || 0, formData.currency)}
                          </Typography>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => removeItem(index)}
                            disabled={formData.items.length <= 1}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Grid>
                      </Grid>
                    </Paper>
                  ))}
                  <Button variant="outlined" onClick={addItem} sx={{ mt: 1 }}>
                    Add Item
                  </Button>
                </Grid>

                <Grid item xs={12}>
                  <Paper sx={{ p: 3, bgcolor: 'grey.50' }}>
                    <Grid container spacing={2}>
                      <Grid item xs={6}><Typography variant="body2">Subtotal:</Typography></Grid>
                      <Grid item xs={6} textAlign="right">
                        <Typography variant="body1" fontWeight={600}>
                          {formatCurrency(totals.subtotal, formData.currency)}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}><Typography variant="body2">Tax Total:</Typography></Grid>
                      <Grid item xs={6} textAlign="right">
                        <Typography variant="body1" fontWeight={600}>
                          {formatCurrency(totals.taxTotal, formData.currency)}
                        </Typography>
                      </Grid>
                      <Grid item xs={12}><Divider sx={{ my: 1 }} /></Grid>
                      <Grid item xs={6}><Typography variant="h6">Total Amount:</Typography></Grid>
                      <Grid item xs={6} textAlign="right">
                        <Typography variant="h5" fontWeight={600} color="primary.main">
                          {formatCurrency(totals.total, formData.currency)}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Currency</InputLabel>
                    <Select
                      name="currency"
                      value={formData.currency}
                      label="Currency"
                      onChange={handleFormChange}
                    >
                      <MenuItem value="ZAR">ZAR - South African Rand</MenuItem>
                      <MenuItem value="USD">USD - US Dollar</MenuItem>
                      <MenuItem value="EUR">EUR - Euro</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      name="status"
                      value={formData.status}
                      label="Status"
                      onChange={handleFormChange}
                    >
                      {INVOICE_STATUS_OPTIONS.map(status => (
                        <MenuItem key={status.value} value={status.value}>
                          {status.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleFormChange}
                    multiline
                    rows={3}
                  />
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog} disabled={submitting}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={submitting}
              startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : null}
            >
              {submitting
                ? 'Saving...'
                : selectedInvoice
                ? 'Update Invoice'
                : 'Create Invoice'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* From-Billing Dialog */}
        <Dialog
          open={openBillingDialog}
          onClose={handleCloseBillingDialog}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <BillingIcon color="primary" />
              Generate Invoice from Billing
            </Box>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              <Alert severity="info" sx={{ mb: 3 }}>
                Select a load with calculated billings to generate an invoice.
              </Alert>

              {billingError && (
                <Alert
                  severity="error"
                  sx={{ mb: 2 }}
                  onClose={() => setBillingError('')}
                >
                  {billingError}
                </Alert>
              )}

              {loadingLoads ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 3 }}>
                  <CircularProgress size={20} />
                  <Typography variant="body2">Loading loads with billings...</Typography>
                </Box>
              ) : loadsWithBillings.length === 0 ? (
                <Alert severity="warning" sx={{ mb: 3 }}>
                  No loads with calculated billings are available yet. Calculate billings
                  on a load first, then come back here.
                  <Box sx={{ mt: 1 }}>
                    <Button size="small" onClick={fetchLoadsWithBillings}>
                      Refresh
                    </Button>
                  </Box>
                </Alert>
              ) : (
                <FormControl fullWidth sx={{ mb: 3 }}>
                  <InputLabel>Select Load</InputLabel>
                  <Select
                    value={selectedLoadId}
                    label="Select Load"
                    onChange={e => handleLoadSelect(e.target.value)}
                  >
                    {loadsWithBillings.map(load => {
                      const id = getLoadId(load);
                      return (
                        <MenuItem key={String(id)} value={id}>
                          <Box
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              width: '100%',
                            }}
                          >
                            <span>{getLoadLabel(load)}</span>
                            <span style={{ color: '#6B7280', fontSize: '0.85rem' }}>
                              {load.totalTrips || 0} trips ·{' '}
                              {formatCurrency(load.total || load.totalAmount || 0)}
                            </span>
                          </Box>
                        </MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>
              )}

              {loadingSummary && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2 }}>
                  <CircularProgress size={18} />
                  <Typography variant="body2">Loading summary...</Typography>
                </Box>
              )}

              {loadBillingSummary && !loadingSummary && (
                <Paper sx={{ p: 3, bgcolor: '#F7F7FC' }}>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    Billing Summary
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Customer:</Typography>
                      <Typography variant="body1" fontWeight={500}>
                        {loadBillingSummary.customerName || 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Total Trips:</Typography>
                      <Typography variant="body1" fontWeight={500}>
                        {loadBillingSummary.totalTrips || 0}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}><Divider sx={{ my: 1 }} /></Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Subtotal:</Typography>
                      <Typography variant="h6" color="primary">
                        {formatCurrency(loadBillingSummary.subtotal || 0)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Total (incl. VAT):
                      </Typography>
                      <Typography variant="h6" color="primary.main" fontWeight={700}>
                        {formatCurrency(
                          loadBillingSummary.totalAmount ?? loadBillingSummary.total ?? 0
                        )}
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseBillingDialog} disabled={generatingInvoice}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleGenerateInvoiceFromBilling}
              disabled={
                !selectedLoadId || loadingSummary || generatingInvoice
              }
              startIcon={generatingInvoice ? <CircularProgress size={18} color="inherit" /> : <ReceiptIcon />}
            >
              {generatingInvoice ? 'Generating...' : 'Generate Invoice'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </LocalizationProvider>
  );
};

/* ============================================================
   SUB-COMPONENT: InvoiceList
   ============================================================ */

const InvoiceList = ({
  invoices = [],
  loading = false,
  page = 0,
  rowsPerPage = 10,
  searchTerm = '',
  filterStatus = 'all',
  filterType = 'all',
  customers = [],
  onSearchChange,
  onStatusFilterChange,
  onTypeFilterChange,
  onPageChange,
  onRowsPerPageChange,
  onEdit,
  onDelete,
  onMarkPaid,
  onSendEmail,
  onRefresh,
  showSource = false,
}) => {
  const displayInvoices = Array.isArray(invoices) ? invoices : [];

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search invoices..."
              value={searchTerm}
              onChange={e => onSearchChange(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />,
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={filterStatus}
                label="Status"
                onChange={e => onStatusFilterChange(e.target.value)}
              >
                <MenuItem value="all">All Status</MenuItem>
                {INVOICE_STATUS_OPTIONS.map(status => (
                  <MenuItem key={status.value} value={status.value}>
                    {status.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Type</InputLabel>
              <Select
                value={filterType}
                label="Type"
                onChange={e => onTypeFilterChange(e.target.value)}
              >
                <MenuItem value="all">All Types</MenuItem>
                {INVOICE_TYPE_OPTIONS.map(type => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={onRefresh}
            >
              Refresh
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {loading ? (
        <LinearProgress sx={{ my: 4 }} />
      ) : displayInvoices.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">No invoices found</Typography>
        </Paper>
      ) : (
        <Paper sx={{ width: '100%' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Invoice #</TableCell>
                  {showSource && <TableCell>Source</TableCell>}
                  <TableCell>Type</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell>Issue Date</TableCell>
                  <TableCell>Due Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {displayInvoices
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map(invoice => {
                    const customer = customers.find(c => c.id === invoice.customerId);
                    const statusOption = INVOICE_STATUS_OPTIONS.find(
                      s => s.value === invoice.status
                    );
                    const typeOption = INVOICE_TYPE_OPTIONS.find(
                      t => t.value === invoice.invoiceType
                    );

                    return (
                      <TableRow key={invoice.id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>
                            {invoice.invoiceNumber || 'N/A'}
                          </Typography>
                        </TableCell>
                        {showSource && (
                          <TableCell>
                            <Chip
                              label={invoice.source === 'BILLING' ? 'From Billing' : 'Manual'}
                              size="small"
                              color={invoice.source === 'BILLING' ? 'primary' : 'default'}
                              variant="outlined"
                            />
                          </TableCell>
                        )}
                        <TableCell>
                          <Chip
                            label={typeOption?.label || invoice.invoiceType || 'N/A'}
                            color={typeOption?.color || 'default'}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {customer?.name ||
                              invoice.customerName ||
                              invoice.customerId ||
                              'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            noWrap
                            sx={{ maxWidth: 150 }}
                          >
                            {invoice.description || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body1" fontWeight={600}>
                            {formatCurrency(invoice.totalAmount || 0, invoice.currency)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {invoice.invoiceDate
                              ? new Date(invoice.invoiceDate).toLocaleDateString()
                              : '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            color={invoice.status === 'OVERDUE' ? 'error.main' : 'inherit'}
                          >
                            {invoice.dueDate
                              ? new Date(invoice.dueDate).toLocaleDateString()
                              : '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={statusOption?.label || invoice.status || 'DRAFT'}
                            color={statusOption?.color || 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Stack direction="row" spacing={0.5} justifyContent="center">
                            <Tooltip title="View">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() =>
                                  window.open(`/invoices/${invoice.id}/preview`, '_blank')
                                }
                              >
                                <ViewIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Edit">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => onEdit(invoice)}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            {invoice.invoiceType === 'RECEIVABLE' &&
                              invoice.status !== 'PAID' && (
                                <Tooltip title="Mark as Paid">
                                  <IconButton
                                    size="small"
                                    color="success"
                                    onClick={() => onMarkPaid(invoice.id)}
                                  >
                                    <PaymentIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}
                            <Tooltip title="Send Email">
                              <IconButton
                                size="small"
                                color="info"
                                onClick={() => onSendEmail(invoice.id)}
                              >
                                <EmailIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => onDelete(invoice.id)}
                              >
                                <DeleteIcon fontSize="small" />
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
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={displayInvoices.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={onPageChange}
            onRowsPerPageChange={onRowsPerPageChange}
          />
        </Paper>
      )}
    </Box>
  );
};

export default InvoicePage;
