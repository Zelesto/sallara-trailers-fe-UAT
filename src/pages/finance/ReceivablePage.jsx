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
  Divider,
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
    setReceivables(prev =>
      prev.map(r =>
        r.id === selectedReceivable.id ? { ...r, status: 'PAID' } : r
      )
    );
    closePaymentDialog();
  };

  /* ---------------------------------------------------------------------- */

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight={600} mb={1}>
        Receivables – You Pay Me
      </Typography>
      <Typography color="text.secondary" mb={4}>
        Manage incoming payments from customers and clients
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={3} mb={4}>
        <SummaryCard
          icon={<ReceiveIcon />}
          color="primary"
          label="Total Receivables"
          value={formatCurrency(totalReceivables)}
        />
        <SummaryCard
          icon={<PaymentIcon />}
          color="error"
          label="Overdue Amount"
          value={formatCurrency(totalOverdue)}
        />
        <SummaryCard
          icon={<AccountIcon />}
          color="warning"
          label="Overdue Invoices"
          value={overdueReceivables.length}
        />
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search invoices, customers..."
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
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={() => {
                setSearchTerm('');
                setFilterStatus('all');
              }}
            >
              Clear
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
        <ReceivablesTable
          data={filteredReceivables}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={(_, p) => setPage(p)}
          onRowsChange={e => setRowsPerPage(+e.target.value)}
          onPay={openPaymentDialog}
          navigate={navigate}
        />
      )}

      {/* Payment Dialog */}
      <Dialog open={openDialog} onClose={closePaymentDialog} fullWidth>
        <DialogTitle>Record Payment</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            type="number"
            label="Amount"
            name="amount"
            value={paymentForm.amount}
            onChange={handlePaymentChange}
            sx={{ mt: 2 }}
          />

          <FormControl fullWidth sx={{ mt: 2 }}>
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
        </DialogContent>
        <DialogActions>
          <Button onClick={closePaymentDialog}>Cancel</Button>
          <Button variant="contained" onClick={recordPayment}>
            Record Payment
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

/* -------------------------------------------------------------------------- */
/* Small Components                                                            */
/* -------------------------------------------------------------------------- */

const SummaryCard = ({ icon, label, value, color }) => (
  <Grid item xs={12} md={4}>
    <Card>
      <CardContent>
        <Stack direction="row" spacing={2} alignItems="center">
          {React.cloneElement(icon, { color, sx: { fontSize: 40 } })}
          <Box>
            <Typography variant="h5" fontWeight={600}>
              {value}
            </Typography>
            <Typography color="text.secondary">{label}</Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  </Grid>
);

export default ReceivablesPage;
