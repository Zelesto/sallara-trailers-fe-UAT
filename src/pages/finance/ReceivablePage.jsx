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
  Tooltip,
  Snackbar,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  ArrowUpward as ReceiveIcon,
  Payment as PaymentIcon,
  Search as SearchIcon,
  Receipt as ReceiptIcon,
  Person as PersonIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Import enums
import {
  PAYMENT_STATUS_OPTIONS,
  getDisplayName,
  getColor,
} from '../../constants';

// Map source_type to display names
const SOURCE_TYPE_MAP = {
  'FUEL_SLIP': 'Fuel Slip',
  'PAYMENT': 'Payment',
  'INVOICE': 'Invoice',
  'EXPENSE': 'Expense',
  'SERVICE': 'Service',
  'MAINTENANCE': 'Maintenance',
  'REPAIR': 'Repair',
  'INSURANCE': 'Insurance',
};

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

const formatCurrency = (amount = 0, currency = 'ZAR') => {
  const numericAmount = typeof amount === 'string' 
    ? parseFloat(amount.replace(/,/g, '')) 
    : amount;
  
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericAmount || 0);
};

const formatDate = (dateString) => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-ZA');
  } catch (e) {
    return dateString;
  }
};

const formatDateTime = (dateString) => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return date.toLocaleString('en-ZA');
  } catch (e) {
    return dateString;
  }
};

const calculateDaysOverdue = (dueDate) => {
  if (!dueDate) return 0;
  const today = new Date();
  const due = new Date(dueDate);
  const diffTime = today - due;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
};

const determineStatus = (transaction) => {
  if (transaction.paymentStatus) {
    if (transaction.paymentStatus === 'PAID') return 'PAID';
    if (transaction.paymentStatus === 'CANCELLED') return 'CANCELLED';
  }
  
  const daysOverdue = calculateDaysOverdue(transaction.postingDate);
  if (daysOverdue > 0 && transaction.direction === 'CREDIT') return 'OVERDUE';
  
  return 'PENDING';
};

const defaultPaymentForm = {
  amount: 0,
  paymentDate: new Date().toISOString().split('T')[0],
  paymentMethod: 'BANK_TRANSFER',
  referenceNumber: '',
  notes: '',
  accountId: null,
};

/* -------------------------------------------------------------------------- */
/* Component                                                                   */
/* -------------------------------------------------------------------------- */

const ReceivablesPage = () => {
  const navigate = useNavigate();

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSourceType, setFilterSourceType] = useState('all');

  const [openDialog, setOpenDialog] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [paymentForm, setPaymentForm] = useState(defaultPaymentForm);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Status options from enums
  const statusOptions = PAYMENT_STATUS_OPTIONS;

  /* ------------------------------ Data Load ------------------------------ */

  useEffect(() => {
    fetchReceivables();
  }, []);

  const fetchReceivables = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/account-transactions`);
      const creditTransactions = response.data.filter(tx => tx.direction === 'CREDIT');
      
      const formattedTransactions = creditTransactions.map(transaction => ({
        ...transaction,
        invoiceNumber: transaction.sourceType === 'INVOICE' 
          ? `INV-${transaction.sourceId}`
          : `${transaction.sourceType}_${transaction.sourceId}`,
        customerName: getCustomerNameFromSource(transaction),
        status: determineStatus(transaction),
        daysOverdue: calculateDaysOverdue(transaction.postingDate),
        formattedAmount: formatCurrency(transaction.amount, transaction.currency),
        formattedDate: formatDate(transaction.transactionDate),
        formattedDueDate: formatDate(transaction.postingDate),
        statusDisplayName: getDisplayName(PAYMENT_STATUS_OPTIONS, determineStatus(transaction)),
        statusColor: getColor(PAYMENT_STATUS_OPTIONS, determineStatus(transaction)),
      }));
      
      setTransactions(formattedTransactions);
      setError('');
    } catch (err) {
      console.error('Error fetching receivables:', err);
      setError('Failed to load receivables. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const getCustomerNameFromSource = (transaction) => {
    switch (transaction.sourceType) {
      case 'INVOICE':
        return `Invoice ${transaction.sourceId}`;
      case 'PAYMENT':
        return 'Payment Received';
      case 'FUEL_SLIP':
        return 'Fuel Supplier';
      default:
        return transaction.description?.split(' - ')[0] || 'Customer';
    }
  };

  /* ------------------------------ Derived Data ---------------------------- */

  const filteredReceivables = useMemo(() => {
    return transactions.filter(tx => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        tx.invoiceNumber?.toLowerCase().includes(q) ||
        tx.customerName?.toLowerCase().includes(q) ||
        tx.description?.toLowerCase().includes(q) ||
        tx.sourceType?.toLowerCase().includes(q);

      const matchesStatus = filterStatus === 'all' || tx.status === filterStatus;
      const matchesSourceType = filterSourceType === 'all' || tx.sourceType === filterSourceType;

      return matchesSearch && matchesStatus && matchesSourceType;
    });
  }, [transactions, searchTerm, filterStatus, filterSourceType]);

  const totalReceivables = useMemo(
    () => filteredReceivables.reduce((s, tx) => s + (tx.amount || 0), 0),
    [filteredReceivables]
  );

  const overdueReceivables = useMemo(
    () => filteredReceivables.filter(tx => tx.status === 'OVERDUE'),
    [filteredReceivables]
  );

  const totalOverdue = useMemo(
    () => overdueReceivables.reduce((s, tx) => s + (tx.amount || 0), 0),
    [overdueReceivables]
  );

  const sourceTypes = useMemo(() => {
    const types = new Set(transactions.map(tx => tx.sourceType));
    return Array.from(types).filter(t => t);
  }, [transactions]);

  /* ------------------------------ Handlers ------------------------------- */

  const openPaymentDialog = (transaction) => {
    setSelectedTransaction(transaction);
    setPaymentForm({
      ...defaultPaymentForm,
      amount: transaction.amount,
      notes: `Payment for ${transaction.sourceType} - ${transaction.description}`,
      accountId: transaction.accountId,
    });
    setOpenDialog(true);
  };

  const closePaymentDialog = () => {
    setOpenDialog(false);
    setSelectedTransaction(null);
    setPaymentForm(defaultPaymentForm);
  };

  const handlePaymentChange = e => {
    const { name, value } = e.target;
    setPaymentForm(p => ({ ...p, [name]: value }));
  };

  const recordPayment = async () => {
    if (!selectedTransaction) return;
    
    try {
      const paymentTransaction = {
        accountId: selectedTransaction.accountId,
        transactionDate: new Date().toISOString(),
        postingDate: paymentForm.paymentDate,
        amount: paymentForm.amount,
        direction: 'DEBIT',
        sourceType: 'PAYMENT',
        sourceId: selectedTransaction.id,
        description: paymentForm.notes,
        currency: selectedTransaction.currency || 'ZAR',
        referenceNumber: paymentForm.referenceNumber,
        paymentMethod: paymentForm.paymentMethod,
      };
      
      await axios.post(`${API_BASE_URL}/account-transactions`, paymentTransaction);
      
      setSnackbar({
        open: true,
        message: 'Payment recorded successfully!',
        severity: 'success',
      });
      
      closePaymentDialog();
      fetchReceivables();
    } catch (err) {
      console.error('Error recording payment:', err);
      setSnackbar({
        open: true,
        message: 'Failed to record payment. Please try again.',
        severity: 'error',
      });
    }
  };

  const deleteTransaction = async (id) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        await axios.delete(`${API_BASE_URL}/account-transactions/${id}`);
        setSnackbar({
          open: true,
          message: 'Transaction deleted successfully!',
          severity: 'success',
        });
        fetchReceivables();
      } catch (err) {
        console.error('Error deleting transaction:', err);
        setSnackbar({
          open: true,
          message: 'Failed to delete transaction.',
          severity: 'error',
        });
      }
    }
  };

  const getStatusChip = (status) => {
    const statusOption = statusOptions.find(s => s.value === status);
    return (
      <Chip
        label={statusOption?.label || status}
        color={statusOption?.color || 'default'}
        size="small"
        sx={{ fontWeight: 500 }}
      />
    );
  };

  const getSourceTypeIcon = (sourceType) => {
    switch (sourceType) {
      case 'FUEL_SLIP':
        return <ReceiptIcon fontSize="small" />;
      case 'PAYMENT':
        return <PaymentIcon fontSize="small" />;
      case 'INVOICE':
        return <ReceiptIcon fontSize="small" />;
      default:
        return <PersonIcon fontSize="small" />;
    }
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
    setFilterSourceType('all');
  };

  const refreshData = () => {
    fetchReceivables();
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const exportToCSV = () => {
    const headers = ['Transaction ID', 'Source Type', 'Description', 'Amount', 'Date', 'Due Date', 'Status'];
    const csvData = filteredReceivables.map(tx => [
      tx.id,
      tx.sourceType,
      tx.description,
      tx.amount,
      formatDate(tx.transactionDate),
      formatDate(tx.postingDate),
      tx.status
    ]);
    
    const csvContent = [headers, ...csvData].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receivables_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  /* ---------------------------------------------------------------------- */

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="h4" fontWeight={600}>
          Receivables – Money Coming In
        </Typography>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={refreshData}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/finance/transactions/new')}
          >
            New Transaction
          </Button>
        </Stack>
      </Box>
      <Typography color="text.secondary" mb={4}>
        Track and manage all incoming payments and credits from customers
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
                <ReceiptIcon color="warning" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h5" fontWeight={600}>
                    {overdueReceivables.length}
                  </Typography>
                  <Typography color="text.secondary">Overdue Transactions</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search by source, description, or ID..."
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

          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={filterStatus}
                label="Status"
                onChange={e => setFilterStatus(e.target.value)}
              >
                <MenuItem value="all">All</MenuItem>
                {statusOptions.map(s => (
                  <MenuItem key={s.value} value={s.value}>
                    {s.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Source Type</InputLabel>
              <Select
                value={filterSourceType}
                label="Source Type"
                onChange={e => setFilterSourceType(e.target.value)}
              >
                <MenuItem value="all">All</MenuItem>
                {sourceTypes.map(type => (
                  <MenuItem key={type} value={type}>
                    {SOURCE_TYPE_MAP[type] || type}
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
              onClick={exportToCSV}
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
        <Alert 
          severity="error" 
          action={
            <Button color="inherit" size="small" onClick={refreshData}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      ) : (
        <Paper sx={{ width: '100%', overflow: 'hidden' }}>
          <TableContainer sx={{ maxHeight: 'calc(100vh - 500px)' }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 600 }}>ID</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Source Type</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Amount</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Transaction Date</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Due Date</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredReceivables
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((row) => {
                    const statusOption = statusOptions.find(s => s.value === row.status);
                    
                    return (
                      <TableRow key={row.id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight={500}>
                            {row.id}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1} alignItems="center">
                            {getSourceTypeIcon(row.sourceType)}
                            <Typography variant="body2">
                              {SOURCE_TYPE_MAP[row.sourceType] || row.sourceType}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Tooltip title={row.description}>
                            <Typography variant="body2" noWrap sx={{ maxWidth: 250 }}>
                              {row.description}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                        <TableCell align="right">
                          <Typography fontWeight={600} color={row.status === 'OVERDUE' ? 'error.main' : 'text.primary'}>
                            {formatCurrency(row.amount, row.currency)}
                          </Typography>
                          {row.status === 'OVERDUE' && row.daysOverdue > 0 && (
                            <Typography variant="caption" color="error" display="block">
                              {row.daysOverdue} days overdue
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatDateTime(row.transactionDate)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatDate(row.postingDate)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={statusOption?.label || row.status}
                            color={statusOption?.color || 'default'}
                            size="small"
                            sx={{ fontWeight: 500 }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Stack direction="row" spacing={1} justifyContent="center">
                            <IconButton
                              size="small"
                              onClick={() => navigate(`/finance/transactions/${row.id}`)}
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
                              onClick={() => navigate(`/finance/transactions/${row.id}/edit`)}
                              title="Edit"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => deleteTransaction(row.id)}
                              title="Delete"
                              color="error"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                {filteredReceivables.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                      <Typography color="text.secondary">
                        No receivable transactions found
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
          {selectedTransaction && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Transaction #{selectedTransaction.id} - {selectedTransaction.description}
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
                <MenuItem value="CASH">Cash</MenuItem>
                <MenuItem value="BANK_TRANSFER">Bank Transfer</MenuItem>
                <MenuItem value="CREDIT_CARD">Credit Card</MenuItem>
                <MenuItem value="CHEQUE">Cheque</MenuItem>
                <MenuItem value="MOBILE_MONEY">Mobile Money</MenuItem>
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

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        message={snackbar.message}
        action={
          <IconButton size="small" color="inherit" onClick={handleCloseSnackbar}>
            <CloseIcon fontSize="small" />
          </IconButton>
        }
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      />
    </Container>
  );
};

export default ReceivablesPage;
