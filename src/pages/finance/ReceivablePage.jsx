// src/pages/finance/ReceivablesPage.jsx
import React, { useEffect, useMemo, useState } from 'react';
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
  InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Download as DownloadIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  ArrowUpward as ReceiveIcon,
  Payment as PaymentIcon,
  CalendarToday as DateIcon,
  AccountBalance as AccountIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers';
import { useNavigate } from 'react-router-dom';

/* -------------------------------------------------------------------------- */
/* Constants                                                                   */
/* -------------------------------------------------------------------------- */

const STATUS_OPTIONS = [
  { value: 'DRAFT', label: 'Draft', color: 'default' },
  { value: 'SENT', label: 'Sent', color: 'info' },
  { value: 'DUE_SOON', label: 'Due Soon', color: 'warning' },
  { value: 'OVERDUE', label: 'Overdue', color: 'error' },
  { value: 'PARTIAL', label: 'Partially Paid', color: 'secondary' },
  { value: 'PAID', label: 'Paid', color: 'success' },
  { value: 'CANCELLED', label: 'Cancelled', color: 'default' },
];

const PAYMENT_METHODS = [
  { value: 'CASH', label: 'Cash' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
  { value: 'CREDIT_CARD', label: 'Credit Card' },
  { value: 'CHEQUE', label: 'Cheque' },
  { value: 'MOBILE_MONEY', label: 'Mobile Money' },
];

const MOCK_RECEIVABLES = [
  {
    id: 1,
    invoiceNumber: 'INV-2024-001',
    customerName: 'ABC Transport',
    amount: 25000,
    currency: 'ZAR',
    dueDate: '2024-02-15',
    status: 'OVERDUE',
    daysOverdue: 15,
    description: 'January freight services',
  },
  {
    id: 2,
    invoiceNumber: 'INV-2024-002',
    customerName: 'XYZ Logistics',
    amount: 18000,
    currency: 'ZAR',
    dueDate: '2024-02-28',
    status: 'DUE_SOON',
    daysOverdue: 0,
    description: 'Vehicle maintenance invoice',
  },
  {
    id: 3,
    invoiceNumber: 'INV-2024-003',
    customerName: 'Global Shipping',
    amount: 42000,
    currency: 'ZAR',
    dueDate: '2024-01-31',
    status: 'PAID',
    daysOverdue: 0,
    description: 'December freight charges',
  },
  {
    id: 4,
    invoiceNumber: 'INV-2024-004',
    customerName: 'Fast Freight Ltd',
    amount: 15500,
    currency: 'ZAR',
    dueDate: '2024-03-10',
    status: 'SENT',
    daysOverdue: 0,
    description: 'February logistics services',
  },
  {
    id: 5,
    invoiceNumber: 'INV-2024-005',
    customerName: 'Swift Transport',
    amount: 8900,
    currency: 'ZAR',
    dueDate: '2024-01-20',
    status: 'OVERDUE',
    daysOverdue: 40,
    description: 'Fuel and maintenance',
  },
];

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

const formatCurrency = (amount = 0, currency = 'ZAR') =>
  new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency,
  }).format(amount);

const defaultPaymentForm = {
  amount: 0,
  paymentDate: new Date().toISOString().split('T')[0],
  paymentMethod: 'BANK_TRANSFER',
  accountId: '',
  referenceNumber: '',
  notes: '',
};

/* -------------------------------------------------------------------------- */
/* Component                                                                   */
/* -------------------------------------------------------------------------- */

const ReceivablesPage = () => {
  const navigate = useNavigate();

  const [receivables, setReceivables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const [openDialog, setOpenDialog] = useState(false);
  const [selectedReceivable, setSelectedReceivable] = useState(null);
  const [paymentForm, setPaymentForm] = useState(defaultPaymentForm);

  /* ------------------------------ Data Load ------------------------------ */

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setReceivables(MOCK_RECEIVABLES);
      setLoading(false);
    }, 800);
  }, []);

  /* ------------------------------ Derived Data ---------------------------- */

  const filteredReceivables = useMemo(() => {
    return receivables.filter(r => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        r.invoiceNumber?.toLowerCase().includes(q) ||
        r.customerName?.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q);

      const matchesStatus =
        filterStatus === 'all' || r.status === filterStatus;

      return matchesSearch && matchesStatus;
    });
  }, [receivables, searchTerm, filterStatus]);

  const totalReceivables = useMemo(
    () => filteredReceivables.reduce((s, r) => s + r.amount, 0),
    [filteredReceivables]
  );

  const overdueReceivables = useMemo(
    () => filteredReceivables.filter(r => r.status === 'OVERDUE'),
    [filteredReceivables]
  );

  const totalOverdue = useMemo(
    () => overdueReceivables.reduce((s, r) => s + r.amount, 0),
    [overdueReceivables]
  );

  /* ------------------------------ Handlers ------------------------------- */

  const openPaymentDialog = receivable => {
    setSelectedReceivable(receivable);
    setPaymentForm({
      ...defaultPaymentForm,
      amount: receivable.amount,
      notes: `Payment for ${receivable.invoiceNumber}`,
    });
    setOpenDialog(true);
  };

  const closePaymentDialog = () => {
    setOpenDialog(false);
    setSelectedReceivable(null);
  };

  const handlePaymentChange = e => {
    const { name, value } = e.target;
    setPaymentForm(p => ({ ...p, [name]: value }));
  };

  const recordPayment = () => {
    // Update the receivable status to PAID
    setReceivables(prev =>
      prev.map(r =>
        r.id === selectedReceivable.id 
          ? { ...r, status: 'PAID', daysOverdue: 0 } 
          : r
      )
    );
    closePaymentDialog();
    // Show success message (you can add a snackbar here)
  };

  const getStatusChip = (status) => {
    const statusConfig = STATUS_OPTIONS.find(s => s.value === status) || STATUS_OPTIONS[0];
    return (
      <Chip
        label={statusConfig.label}
        color={statusConfig.color}
        size="small"
        sx={{ fontWeight: 500 }}
      />
    );
  };

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterStatus('all');
  };

  /* ---------------------------------------------------------------------- */

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="h4" fontWeight={600}>
          Receivables – You Pay Me
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/finance/invoices/new')}
        >
          New Invoice
        </Button>
      </Box>
      <Typography color="text.secondary" mb={4}>
        Manage incoming payments from customers and clients
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <ReceiveIcon color="primary" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h5" fontWeight={600}>
                    {formatCurrency(totalReceivables)}
                  </Typography>
                  <Typography color="text.secondary">Total Receivables</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <PaymentIcon color="error" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h5" fontWeight={600} color="error.main">
                    {formatCurrency(totalOverdue)}
                  </Typography>
                  <Typography color="text.secondary">Overdue Amount</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <AccountIcon color="warning" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h5" fontWeight={600}>
                    {overdueReceivables.length}
                  </Typography>
                  <Typography color="text.secondary">Overdue Invoices</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={5}>
            <TextField
              fullWidth
              placeholder="Search invoices, customers, or descriptions..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={filterStatus}
                label="Status"
                onChange={e => setFilterStatus(e.target.value)}
              >
                <MenuItem value="all">All</MenuItem>
                {STATUS_OPTIONS.map(s => (
                  <MenuItem key={s.value} value={s.value}>
                    {s.label}
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
              onClick={clearFilters}
            >
              Clear Filters
            </Button>
          </Grid>

          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={() => console.log('Export to CSV')}
            >
              Export
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Table */}
      {loading ? (
        <LinearProgress />
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <Paper sx={{ width: '100%', overflow: 'hidden' }}>
          <TableContainer sx={{ maxHeight: 'calc(100vh - 450px)' }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 600 }}>Invoice #</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Customer</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Amount</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Due Date</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredReceivables
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((row) => (
                    <TableRow key={row.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>
                          {row.invoiceNumber}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {row.customerName}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography fontWeight={600} color={row.status === 'OVERDUE' ? 'error.main' : 'text.primary'}>
                          {formatCurrency(row.amount, row.currency)}
                        </Typography>
                        {row.status === 'OVERDUE' && (
                          <Typography variant="caption" color="error" display="block">
                            {row.daysOverdue} days overdue
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {row.dueDate}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {getStatusChip(row.status)}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 200 }}>
                          {row.description}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={1} justifyContent="center">
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/finance/invoices/${row.id}`)}
                            title="View Details"
                          >
                            <ViewIcon fontSize="small" />
                          </IconButton>
                          {row.status !== 'PAID' && row.status !== 'CANCELLED' && (
                            <IconButton
                              size="small"
                              onClick={() => openPaymentDialog(row)}
                              color="primary"
                              title="Record Payment"
                            >
                              <PaymentIcon fontSize="small" />
                            </IconButton>
                          )}
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/finance/invoices/${row.id}/edit`)}
                            title="Edit"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => console.log('Delete', row.id)}
                            title="Delete"
                            color="error"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                {filteredReceivables.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                      <Typography color="text.secondary">
                        No receivables found
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={filteredReceivables.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
          />
        </Paper>
      )}

      {/* Payment Dialog */}
      <Dialog open={openDialog} onClose={closePaymentDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          Record Payment
          {selectedReceivable && (
            <Typography variant="body2" color="text.secondary">
              Invoice: {selectedReceivable.invoiceNumber} - {selectedReceivable.customerName}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              type="number"
              label="Amount"
              name="amount"
              value={paymentForm.amount}
              onChange={handlePaymentChange}
              InputProps={{
                startAdornment: <InputAdornment position="start">R</InputAdornment>,
              }}
            />

            <TextField
              fullWidth
              type="date"
              label="Payment Date"
              name="paymentDate"
              value={paymentForm.paymentDate}
              onChange={handlePaymentChange}
              InputLabelProps={{ shrink: true }}
            />

            <FormControl fullWidth>
              <InputLabel>Payment Method</InputLabel>
              <Select
                name="paymentMethod"
                value={paymentForm.paymentMethod}
                label="Payment Method"
                onChange={handlePaymentChange}
              >
                {PAYMENT_METHODS.map(m => (
                  <MenuItem key={m.value} value={m.value}>
                    {m.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Reference Number"
              name="referenceNumber"
              value={paymentForm.referenceNumber}
              onChange={handlePaymentChange}
              placeholder="Transaction ID, Check Number, etc."
            />

            <TextField
              fullWidth
              label="Notes"
              name="notes"
              value={paymentForm.notes}
              onChange={handlePaymentChange}
              multiline
              rows={3}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closePaymentDialog}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={recordPayment}
            disabled={!paymentForm.amount || paymentForm.amount <= 0}
          >
            Record Payment
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ReceivablesPage;
