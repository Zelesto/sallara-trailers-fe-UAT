// src/pages/finance/InvoicePage.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Grid,
  TextField,
  IconButton,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Alert,
  LinearProgress,
  Card,
  CardContent,
  Badge,
  Divider,
  Tab,
  Tabs,
  Chip as MuiChip,
  Tooltip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Description as InvoiceIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  Email as EmailIcon,
  Payment as PaymentIcon,
  Search as SearchIcon,
  Receipt as ReceiptIcon,
  Calculate as CalculateIcon,
  ReceiptLong as ReceiptLongIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Schedule as ScheduleIcon,
  Business as BusinessIcon,
  AttachMoney as MoneyIcon,
  Receipt as BillingIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import invoiceService from '../../services/invoice';
import billingService from '../../services/billingService';
import customerService from '../../services/customerService';

// Import enums
import {
  INVOICE_TYPES,
  INVOICE_STATUSES,
  PAYMENT_STATUS_OPTIONS,
  getDisplayName,
  getColor,
  getColorBg,
} from '../../constants';

// Pre-computed options
const INVOICE_TYPE_OPTIONS = INVOICE_TYPES.map(type => ({
  value: type.code,
  label: type.displayName,
  color: type.color || 'default',
}));

const INVOICE_STATUS_OPTIONS = INVOICE_STATUSES.map(status => ({
  value: status.code,
  label: status.displayName,
  color: status.color || 'default',
}));

// Tab panel component
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

const InvoicesPage = () => {
  // ========== STATE ==========
  const [tabValue, setTabValue] = useState(0);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');

  // Billing state
  const [loadBillingSummary, setLoadBillingSummary] = useState(null);
  const [selectedLoadId, setSelectedLoadId] = useState('');
  const [loadsWithBillings, setLoadsWithBillings] = useState([]);
  const [openBillingDialog, setOpenBillingDialog] = useState(false);
  const [generatingInvoice, setGeneratingInvoice] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    invoiceNumber: '',
    invoiceDate: new Date(),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    customerId: '',
    accountId: '',
    description: '',
    items: [{ description: '', quantity: 1, unitPrice: 0, taxRate: 15 }],
    currency: 'ZAR',
    invoiceType: 'RECEIVABLE',
    notes: '',
    status: 'DRAFT'
  });

  const [customers, setCustomers] = useState([]);
  const [accounts, setAccounts] = useState([]);

  // ========== EFFECTS ==========
  useEffect(() => {
    fetchInvoices();
    fetchCustomers();
    fetchAccounts();
    fetchLoadsWithBillings();
  }, []);

  // ========== DATA FETCHING ==========
  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const data = await invoiceService.getAllInvoices();
      
      const transformedData = data.map(invoice => ({
        ...invoice,
        typeDisplayName: getDisplayName(INVOICE_TYPES, invoice.invoiceType) || invoice.invoiceType,
        statusDisplayName: getDisplayName(INVOICE_STATUSES, invoice.status) || invoice.status,
        source: invoice.source || 'MANUAL',
      }));
      
      setInvoices(transformedData);
      setError('');
    } catch (err) {
      setError('Failed to load invoices');
      console.error('Error fetching invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
  try {
    const data = await customerService.getAllCustomers();
    // ✅ Add array check
    const customersArray = Array.isArray(data) ? data : [];
    setCustomers(customersArray);
  } catch (err) {
    console.error('Error fetching customers:', err);
    setCustomers([]);
  }
};
  const fetchAccounts = async () => {
  try {
    const accountService = (await import('../../services/account')).default;
    const data = await accountService.getAllAccounts();
    // ✅ Add array check
    const accountsArray = Array.isArray(data) ? data : [];
    setAccounts(accountsArray.filter(acc => acc && acc.status === 'ACTIVE'));
  } catch (err) {
    console.error('Error fetching accounts:', err);
    setAccounts([]);
  }
};

  const fetchLoadsWithBillings = async () => {
  try {
    const data = await billingService.getLoadsWithBillings();
    // ✅ Add array check
    setLoadsWithBillings(Array.isArray(data) ? data : []);
  } catch (err) {
    console.error('Error fetching loads with billings:', err);
    setLoadsWithBillings([]);
  }
};


  const fetchLoadBillingSummary = async (loadId) => {
    if (!loadId) return;
    try {
      const data = await billingService.getLoadBillingSummary(loadId);
      setLoadBillingSummary(data);
    } catch (err) {
      setError('Failed to load billing summary');
      console.error(err);
    }
  };

  // ========== HANDLERS ==========
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenDialog = (invoice = null) => {
    if (invoice) {
      setSelectedInvoice(invoice);
      setFormData({
        invoiceNumber: invoice.invoiceNumber || '',
        invoiceDate: invoice.invoiceDate ? new Date(invoice.invoiceDate) : new Date(),
        dueDate: invoice.dueDate ? new Date(invoice.dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        customerId: invoice.customerId || '',
        accountId: invoice.accountId || '',
        description: invoice.description || '',
        items: invoice.items || [{ description: '', quantity: 1, unitPrice: 0, taxRate: 15 }],
        currency: invoice.currency || 'ZAR',
        invoiceType: invoice.invoiceType || 'RECEIVABLE',
        notes: invoice.notes || '',
        status: invoice.status || 'DRAFT'
      });
    } else {
      setSelectedInvoice(null);
      setFormData({
        invoiceNumber: `INV-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
        invoiceDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        customerId: '',
        accountId: '',
        description: '',
        items: [{ description: '', quantity: 1, unitPrice: 0, taxRate: 15 }],
        currency: 'ZAR',
        invoiceType: 'RECEIVABLE',
        notes: '',
        status: 'DRAFT'
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedInvoice(null);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDateChange = (date, field) => {
    setFormData(prev => ({
      ...prev,
      [field]: date
    }));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    newItems[index].total = (newItems[index].quantity || 0) * (newItems[index].unitPrice || 0);
    newItems[index].taxAmount = newItems[index].total * ((newItems[index].taxRate || 0) / 100);

    setFormData(prev => ({
      ...prev,
      items: newItems
    }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { description: '', quantity: 1, unitPrice: 0, taxRate: 15 }]
    }));
  };

  const removeItem = (index) => {
    if (formData.items.length > 1) {
      const newItems = [...formData.items];
      newItems.splice(index, 1);
      setFormData(prev => ({
        ...prev,
        items: newItems
      }));
    }
  };

  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => sum + (item.total || 0), 0);
    const taxTotal = formData.items.reduce((sum, item) => sum + (item.taxAmount || 0), 0);
    const total = subtotal + taxTotal;
    return { subtotal, taxTotal, total };
  };

  const handleSubmit = async () => {
    try {
      const invoiceData = {
        ...formData,
        ...calculateTotals()
      };

      if (selectedInvoice) {
        await invoiceService.updateInvoice(selectedInvoice.id, invoiceData);
      } else {
        await invoiceService.createInvoice(invoiceData);
      }
      fetchInvoices();
      handleCloseDialog();
    } catch (err) {
      setError('Failed to save invoice');
      console.error('Error saving invoice:', err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      try {
        await invoiceService.deleteInvoice(id);
        fetchInvoices();
      } catch (err) {
        setError('Failed to delete invoice');
        console.error('Error deleting invoice:', err);
      }
    }
  };

  const handleSendEmail = async (id) => {
    try {
      await invoiceService.sendInvoiceEmail(id);
      alert('Invoice email sent successfully');
    } catch (err) {
      alert('Failed to send invoice email');
      console.error('Error sending invoice email:', err);
    }
  };

  const handleMarkAsPaid = async (id) => {
    try {
      await invoiceService.markAsPaid(id);
      fetchInvoices();
      alert('Invoice marked as paid');
    } catch (err) {
      alert('Failed to mark invoice as paid');
      console.error('Error marking invoice as paid:', err);
    }
  };

  // ========== BILLING HANDLERS ==========
  const handleOpenBillingDialog = () => {
    setOpenBillingDialog(true);
    setSelectedLoadId('');
    setLoadBillingSummary(null);
  };

  const handleCloseBillingDialog = () => {
    setOpenBillingDialog(false);
    setSelectedLoadId('');
    setLoadBillingSummary(null);
  };

  const handleLoadSelect = async (loadId) => {
    setSelectedLoadId(loadId);
    await fetchLoadBillingSummary(loadId);
  };

  const handleGenerateInvoiceFromBilling = async () => {
    if (!selectedLoadId) return;
    
    setGeneratingInvoice(true);
    try {
      const invoice = await billingService.generateInvoiceFromLoad(selectedLoadId);
      setOpenBillingDialog(false);
      await fetchInvoices();
      // Navigate to the new invoice
      window.location.href = `/finance/invoices/${invoice.id}`;
    } catch (err) {
      setError('Failed to generate invoice: ' + err.message);
      console.error(err);
    } finally {
      setGeneratingInvoice(false);
    }
  };

  // ========== FILTERS & HELPERS ==========
  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.customerName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || invoice.status === filterStatus;
    const matchesType = filterType === 'all' || invoice.invoiceType === filterType;
    return matchesSearch && matchesStatus && matchesType;
  });

  const formatCurrency = (amount, currency = 'ZAR') => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: currency
    }).format(amount || 0);
  };

  const calculateInvoiceStats = () => {
    const total = filteredInvoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
    const overdue = filteredInvoices
      .filter(inv => inv.status === 'OVERDUE')
      .reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
    const pending = filteredInvoices
      .filter(inv => ['DRAFT', 'SENT', 'VIEWED', 'PARTIAL'].includes(inv.status))
      .reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);

    return { total, overdue, pending };
  };

  const stats = calculateInvoiceStats();
  const totals = calculateTotals();

  // ========== RENDER ==========
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h4" fontWeight={600}>
              Invoice Management
            </Typography>
            <Stack direction="row" spacing={2}>
              <Button
                variant="outlined"
                startIcon={<BillingIcon />}
                onClick={handleOpenBillingDialog}
              >
                From Billing
              </Button>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog()}
              >
                Create Invoice
              </Button>
            </Stack>
          </Box>
          <Typography variant="body1" color="text.secondary">
            Create and manage customer invoices from manual entry or billing calculations
          </Typography>
        </Box>

        {/* Stats Summary */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Total Invoiced
                </Typography>
                <Typography variant="h4" color="primary.main" fontWeight={600}>
                  {formatCurrency(stats.total)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {filteredInvoices.length} invoices
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Pending Payment
                </Typography>
                <Typography variant="h4" color="warning.main" fontWeight={600}>
                  {formatCurrency(stats.pending)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Awaiting payment
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Overdue Amount
                </Typography>
                <Typography variant="h4" color="error.main" fontWeight={600}>
                  {formatCurrency(stats.overdue)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Past due date
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="invoice tabs">
            <Tab label="All Invoices" />
            <Tab label="Manual" />
            <Tab label="From Billing" />
            <Tab label="Draft" />
            <Tab label="Overdue" />
          </Tabs>
        </Box>

        {/* Tab Panels */}
        <TabPanel value={tabValue} index={0}>
          <InvoiceList 
            invoices={filteredInvoices}
            loading={loading}
            error={error}
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
          />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <InvoiceList 
            invoices={filteredInvoices.filter(i => i.source === 'MANUAL')}
            loading={loading}
            error={error}
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
            showSource
          />
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <InvoiceList 
            invoices={filteredInvoices.filter(i => i.source === 'BILLING')}
            loading={loading}
            error={error}
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
            showSource
          />
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <InvoiceList 
            invoices={filteredInvoices.filter(i => i.status === 'DRAFT')}
            loading={loading}
            error={error}
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
          />
        </TabPanel>

        <TabPanel value={tabValue} index={4}>
          <InvoiceList 
            invoices={filteredInvoices.filter(i => i.status === 'OVERDUE')}
            loading={loading}
            error={error}
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
          />
        </TabPanel>

        {/* Invoice Create/Edit Dialog */}
        <Dialog
          open={openDialog}
          onClose={handleCloseDialog}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            {selectedInvoice ? 'Edit Invoice' : 'Create New Invoice'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
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
                      {INVOICE_TYPE_OPTIONS.map((type) => (
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
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        required: true,
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <DatePicker
                    label="Due Date"
                    value={formData.dueDate}
                    onChange={(date) => handleDateChange(date, 'dueDate')}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        required: true,
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Customer</InputLabel>
                    <Select
                      name="customerId"
                      value={formData.customerId}
                      label="Customer"
                      onChange={handleFormChange}
                      required
                    >
                      {customers.map((customer) => (
                        <MenuItem key={customer.id} value={customer.id}>
                          {customer.name} ({customer.email})
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

                {/* Invoice Items */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Items
                  </Typography>
                  {formData.items.map((item, index) => (
                    <Paper key={index} sx={{ p: 2, mb: 2, border: '1px solid', borderColor: 'divider' }}>
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={4}>
                          <TextField
                            fullWidth
                            label="Description"
                            value={item.description}
                            onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                            required
                          />
                        </Grid>
                        <Grid item xs={12} sm={6} md={2}>
                          <TextField
                            fullWidth
                            label="Quantity"
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value))}
                            InputProps={{ inputProps: { min: 1 } }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6} md={2}>
                          <TextField
                            fullWidth
                            label="Unit Price"
                            type="number"
                            value={item.unitPrice}
                            onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value))}
                            InputProps={{
                              startAdornment: <Typography sx={{ mr: 1 }}>{formData.currency}</Typography>,
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6} md={2}>
                          <TextField
                            fullWidth
                            label="Tax Rate %"
                            type="number"
                            value={item.taxRate}
                            onChange={(e) => handleItemChange(index, 'taxRate', parseFloat(e.target.value))}
                            InputProps={{ inputProps: { min: 0, max: 100 } }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6} md={1}>
                          <Typography variant="body2" fontWeight={600}>
                            {formatCurrency(item.total || 0, formData.currency)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Total
                          </Typography>
                        </Grid>
                        <Grid item xs={12} md={1}>
                          <IconButton
                            color="error"
                            onClick={() => removeItem(index)}
                            disabled={formData.items.length <= 1}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Grid>
                      </Grid>
                    </Paper>
                  ))}
                  <Button
                    variant="outlined"
                    onClick={addItem}
                    sx={{ mt: 1 }}
                  >
                    Add Item
                  </Button>
                </Grid>

                {/* Totals */}
                <Grid item xs={12}>
                  <Paper sx={{ p: 3, bgcolor: 'grey.50' }}>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Subtotal:
                        </Typography>
                      </Grid>
                      <Grid item xs={6} textAlign="right">
                        <Typography variant="body1" fontWeight={600}>
                          {formatCurrency(totals.subtotal, formData.currency)}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Tax Total:
                        </Typography>
                      </Grid>
                      <Grid item xs={6} textAlign="right">
                        <Typography variant="body1" fontWeight={600}>
                          {formatCurrency(totals.taxTotal, formData.currency)}
                        </Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Divider sx={{ my: 1 }} />
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="h6">
                          Total Amount:
                        </Typography>
                      </Grid>
                      <Grid item xs={6} textAlign="right">
                        <Typography variant="h5" fontWeight={600} color="primary.main">
                          {formatCurrency(totals.total, formData.currency)}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>

                {/* Additional Info */}
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
                      <MenuItem value="GBP">GBP - British Pound</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Account</InputLabel>
                    <Select
                      name="accountId"
                      value={formData.accountId}
                      label="Account"
                      onChange={handleFormChange}
                    >
                      {accounts.map((account) => (
                        <MenuItem key={account.id} value={account.id}>
                          {account.name} ({account.accountNumber})
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
                    placeholder="Additional notes for this invoice..."
                  />
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
                      {INVOICE_STATUS_OPTIONS.map((status) => (
                        <MenuItem key={status.value} value={status.value}>
                          {status.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={loading}
            >
              {selectedInvoice ? 'Update Invoice' : 'Create Invoice'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Generate from Billing Dialog */}
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
                This will create an invoice with all trips in the load.
              </Alert>

              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Select Load</InputLabel>
                <Select
                  value={selectedLoadId}
                  label="Select Load"
                  onChange={(e) => handleLoadSelect(e.target.value)}
                >
                  {loadsWithBillings.map((load) => (
                    <MenuItem key={load.loadId} value={load.loadId}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                        <span>{load.loadId}</span>
                        <span style={{ color: '#6B7280', fontSize: '0.85rem' }}>
                          {load.trips} trips · {formatCurrency(load.totalAmount)}
                        </span>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {loadBillingSummary && (
                <Paper sx={{ p: 3, bgcolor: '#F7F7FC' }}>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    Billing Summary
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Customer:
                      </Typography>
                      <Typography variant="body1" fontWeight={500}>
                        {loadBillingSummary.customerName || 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Total Trips:
                      </Typography>
                      <Typography variant="body1" fontWeight={500}>
                        {loadBillingSummary.totalTrips || 0}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Total Distance:
                      </Typography>
                      <Typography variant="body1" fontWeight={500}>
                        {loadBillingSummary.totalDistanceKm?.toFixed(0) || 0} km
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Status:
                      </Typography>
                      <Chip
                        label={loadBillingSummary.status || 'DRAFT'}
                        size="small"
                        color={loadBillingSummary.status === 'INVOICED' ? 'success' : 'warning'}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Divider sx={{ my: 1 }} />
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Subtotal:
                      </Typography>
                      <Typography variant="h6" color="primary">
                        {formatCurrency(loadBillingSummary.subtotal)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Total (incl. VAT):
                      </Typography>
                      <Typography variant="h6" color="primary.main" fontWeight={700}>
                        {formatCurrency(loadBillingSummary.totalAmount)}
                      </Typography>
                    </Grid>
                  </Grid>

                  {/* Trip list preview */}
                  {loadBillingSummary.trips && loadBillingSummary.trips.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Trips in this load:
                      </Typography>
                      <List dense>
                        {loadBillingSummary.trips.slice(0, 5).map((trip) => (
                          <ListItem key={trip.id} sx={{ bgcolor: 'white', borderRadius: 1, mb: 0.5 }}>
                            <ListItemAvatar>
                              <Avatar sx={{ width: 24, height: 24, fontSize: '0.7rem', bgcolor: '#EEF2FF', color: '#4F46E5' }}>
                                {trip.trip?.tripNumber?.slice(-3)}
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={`${trip.trip?.originLocation?.split(',')[0] || 'N/A'} → ${trip.trip?.destinationLocation?.split(',')[0] || 'N/A'}`}
                              secondary={`${trip.distanceKm?.toFixed(0) || 0} km · ${formatCurrency(trip.total)}`}
                            />
                            <Chip
                              label={trip.status}
                              size="small"
                              color={trip.status === 'INVOICED' ? 'success' : 'primary'}
                            />
                          </ListItem>
                        ))}
                        {loadBillingSummary.trips.length > 5 && (
                          <Typography variant="caption" color="text.secondary">
                            + {loadBillingSummary.trips.length - 5} more trips
                          </Typography>
                        )}
                      </List>
                    </Box>
                  )}
                </Paper>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseBillingDialog}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleGenerateInvoiceFromBilling}
              disabled={!selectedLoadId || !loadBillingSummary || generatingInvoice || loadBillingSummary.status === 'INVOICED'}
              startIcon={<ReceiptIcon />}
            >
              {generatingInvoice ? 'Generating...' : 'Generate Invoice'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Summary Section */}
        <Grid container spacing={3} sx={{ mt: 3 }}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom fontWeight={600}>
                Invoice Summary
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Total Invoices:
                  </Typography>
                </Grid>
                <Grid item xs={6} textAlign="right">
                  <Typography variant="body1" fontWeight={600}>
                    {filteredInvoices.length}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    From Billing:
                  </Typography>
                </Grid>
                <Grid item xs={6} textAlign="right">
                  <Typography variant="body1" fontWeight={600}>
                    {filteredInvoices.filter(i => i.source === 'BILLING').length}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Receivables:
                  </Typography>
                </Grid>
                <Grid item xs={6} textAlign="right">
                  <Typography variant="body1" fontWeight={600}>
                    {filteredInvoices.filter(i => i.invoiceType === 'RECEIVABLE').length}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Average Invoice Amount:
                  </Typography>
                </Grid>
                <Grid item xs={6} textAlign="right">
                  <Typography variant="body1" fontWeight={600}>
                    {filteredInvoices.length > 0
                      ? formatCurrency(stats.total / filteredInvoices.length)
                      : formatCurrency(0)}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom fontWeight={600}>
                Status Distribution
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Grid container spacing={1}>
                {INVOICE_STATUS_OPTIONS.map((status) => {
                  const count = filteredInvoices.filter(i => i.status === status.value).length;
                  if (count === 0) return null;

                  return (
                    <Grid item xs={12} key={status.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip
                            label={status.label}
                            color={status.color}
                            size="small"
                            variant="filled"
                          />
                          <Typography variant="body2" color="text.secondary">
                            ({count})
                          </Typography>
                        </Box>
                        <Typography variant="body2" fontWeight={600}>
                          {Math.round((count / filteredInvoices.length) * 100)}%
                        </Typography>
                      </Box>
                    </Grid>
                  );
                })}
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </LocalizationProvider>
  );
};

// ========== SUB-COMPONENT: InvoiceList ==========
const InvoiceList = ({
  invoices,
  loading,
  error,
  page,
  rowsPerPage,
  searchTerm,
  filterStatus,
  filterType,
  customers,
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
  return (
    <Box>
      {/* Quick Actions */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search invoices..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
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
                onChange={(e) => onStatusFilterChange(e.target.value)}
              >
                <MenuItem value="all">All Status</MenuItem>
                {INVOICE_STATUS_OPTIONS.map((status) => (
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
                onChange={(e) => onTypeFilterChange(e.target.value)}
              >
                <MenuItem value="all">All Types</MenuItem>
                {INVOICE_TYPE_OPTIONS.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
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

      {/* Table */}
      {loading ? (
        <LinearProgress sx={{ my: 4 }} />
      ) : error ? (
        <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>
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
                {invoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">No invoices found</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  invoices
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((invoice) => {
                      const typeOption = INVOICE_TYPE_OPTIONS.find(t => t.value === invoice.invoiceType);
                      const statusOption = INVOICE_STATUS_OPTIONS.find(s => s.value === invoice.status);
                      const customer = customers.find(c => c.id === invoice.customerId);

                      return (
                        <TableRow key={invoice.id} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>
                              {invoice.invoiceNumber}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {invoice.currency}
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
                              label={typeOption?.label || invoice.invoiceType}
                              color={typeOption?.color || 'default'}
                              size="small"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {customer?.name || invoice.customerId}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {customer?.email || 'No email'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {invoice.description}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body1" fontWeight={600}>
                              {formatCurrency(invoice.totalAmount, invoice.currency)}
                            </Typography>
                            {invoice.status === 'PARTIAL' && invoice.paidAmount && (
                              <Typography variant="caption" color="text.secondary">
                                Paid: {formatCurrency(invoice.paidAmount, invoice.currency)}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {new Date(invoice.invoiceDate).toLocaleDateString()}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography
                              variant="body2"
                              color={invoice.status === 'OVERDUE' ? 'error.main' : 'inherit'}
                              fontWeight={invoice.status === 'OVERDUE' ? 600 : 400}
                            >
                              {new Date(invoice.dueDate).toLocaleDateString()}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={statusOption?.label || invoice.status}
                              color={statusOption?.color || 'default'}
                              size="small"
                              variant="filled"
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Stack direction="row" spacing={0.5} justifyContent="center">
                              <Tooltip title="View">
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => window.open(`/invoices/${invoice.id}/preview`, '_blank')}
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
                              {invoice.invoiceType === 'RECEIVABLE' && invoice.status !== 'PAID' && (
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
                    })
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={invoices.length}
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

export default InvoicesPage;
