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
  Divider
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
  Search as SearchIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import invoiceService from '../../services/invoice';

const InvoicesPage = () => {
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

  // Form state
  const [formData, setFormData] = useState({
    invoiceNumber: '',
    invoiceDate: new Date(),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
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

  useEffect(() => {
    fetchInvoices();
    fetchCustomers();
    fetchAccounts();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const data = await invoiceService.getAllInvoices();
      setInvoices(data);
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
      // You'll need to create a customer service or use your existing user service
      // For now, using mock data
      const mockCustomers = [
        { id: 1, name: 'ABC Transport', email: 'abc@transport.co.za' },
        { id: 2, name: 'XYZ Logistics', email: 'info@xyzlogistics.co.za' },
        { id: 3, name: 'Global Shipping', email: 'accounts@globalshipping.co.za' },
      ];
      setCustomers(mockCustomers);
    } catch (err) {
      console.error('Error fetching customers:', err);
    }
  };

  const fetchAccounts = async () => {
    try {
      const accountService = (await import('../../services/account')).default;
      const data = await accountService.getAllAccounts();
      setAccounts(data.filter(acc => acc.status === 'ACTIVE'));
    } catch (err) {
      console.error('Error fetching accounts:', err);
    }
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

    // Calculate totals
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

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.invoiceNumber?.includes(searchTerm) ||
                         invoice.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.customerId?.toString().includes(searchTerm);
    const matchesStatus = filterStatus === 'all' || invoice.status === filterStatus;
    const matchesType = filterType === 'all' || invoice.invoiceType === filterType;
    return matchesSearch && matchesStatus && matchesType;
  });

  const invoiceTypes = [
    { value: 'RECEIVABLE', label: 'Accounts Receivable', color: 'success' },
    { value: 'PAYABLE', label: 'Accounts Payable', color: 'error' },
  ];

  const statusOptions = [
    { value: 'DRAFT', label: 'Draft', color: 'default' },
    { value: 'SENT', label: 'Sent', color: 'info' },
    { value: 'VIEWED', label: 'Viewed', color: 'warning' },
    { value: 'PARTIAL', label: 'Partially Paid', color: 'warning' },
    { value: 'PAID', label: 'Paid', color: 'success' },
    { value: 'OVERDUE', label: 'Overdue', color: 'error' },
    { value: 'CANCELLED', label: 'Cancelled', color: 'error' },
  ];

  const formatCurrency = (amount, currency = 'ZAR') => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: currency
    }).format(amount);
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

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h4" fontWeight={600}>
              Invoice Management
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
            >
              Create Invoice
            </Button>
          </Box>
          <Typography variant="body1" color="text.secondary">
            Create and manage customer and vendor invoices
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

        {/* Quick Actions */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom fontWeight={600}>
            Quick Actions
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<PrintIcon />}
                onClick={() => {/* Print selected invoices */}}
              >
                Print Selected
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<EmailIcon />}
                onClick={() => {/* Send bulk emails */}}
              >
                Send Bulk Email
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<DownloadIcon />}
                onClick={() => {/* Export functionality */}}
              >
                Export to Excel
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<RefreshIcon />}
                onClick={fetchInvoices}
              >
                Refresh Data
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Filters and Search */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                placeholder="Search by invoice #, customer, description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filterStatus}
                  label="Status"
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <MenuItem value="all">All Status</MenuItem>
                  {statusOptions.map((status) => (
                    <MenuItem key={status.value} value={status.value}>
                      {status.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={filterType}
                  label="Type"
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <MenuItem value="all">All Types</MenuItem>
                  {invoiceTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <DatePicker
                label="From Date"
                slotProps={{
                  textField: {
                    fullWidth: true,
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <DatePicker
                label="To Date"
                slotProps={{
                  textField: {
                    fullWidth: true,
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} md={1}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<FilterIcon />}
                onClick={() => {
                  setSearchTerm('');
                  setFilterStatus('all');
                  setFilterType('all');
                }}
              >
                Clear
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Invoices Table */}
        {loading ? (
          <LinearProgress sx={{ my: 4 }} />
        ) : error ? (
          <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>
        ) : (
          <Paper sx={{ width: '100%', mb: 2 }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Invoice #</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Customer/Vendor</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell>Issue Date</TableCell>
                    <TableCell>Due Date</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredInvoices
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((invoice) => {
                      const typeConfig = invoiceTypes.find(t => t.value === invoice.invoiceType) ||
                                        { label: invoice.invoiceType, color: 'default' };
                      const statusConfig = statusOptions.find(s => s.value === invoice.status) ||
                                          { label: invoice.status, color: 'default' };
                      const customer = customers.find(c => c.id === invoice.customerId);

                      return (
                        <TableRow
                          key={invoice.id}
                          hover
                          sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                        >
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>
                              {invoice.invoiceNumber}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {invoice.currency}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={typeConfig.label}
                              color={typeConfig.color}
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
                              label={statusConfig.label}
                              color={statusConfig.color}
                              size="small"
                              variant="filled"
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Stack direction="row" spacing={1} justifyContent="center">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => window.open(`/invoices/${invoice.id}/preview`, '_blank')}
                              >
                                <ViewIcon />
                              </IconButton>
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleOpenDialog(invoice)}
                              >
                                <EditIcon />
                              </IconButton>
                              {invoice.invoiceType === 'RECEIVABLE' && invoice.status !== 'PAID' && (
                                <IconButton
                                  size="small"
                                  color="success"
                                  onClick={() => handleMarkAsPaid(invoice.id)}
                                >
                                  <PaymentIcon />
                                </IconButton>
                              )}
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDelete(invoice.id)}
                              >
                                <DeleteIcon />
                              </IconButton>
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
              count={filteredInvoices.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </Paper>
        )}

        {/* Invoice Dialog */}
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
                {/* Invoice Header */}
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
                      {invoiceTypes.map((type) => (
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
                    <InputLabel>Customer/Vendor</InputLabel>
                    <Select
                      name="customerId"
                      value={formData.customerId}
                      label="Customer/Vendor"
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

                {/* Totals Section */}
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

                {/* Additional Information */}
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
                      {statusOptions.map((status) => (
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
                    Payables:
                  </Typography>
                </Grid>
                <Grid item xs={6} textAlign="right">
                  <Typography variant="body1" fontWeight={600}>
                    {filteredInvoices.filter(i => i.invoiceType === 'PAYABLE').length}
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
                {statusOptions.map((status) => {
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

export default InvoicesPage;