// src/pages/finance/PayablePage.jsx
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
  Divider,
  Tabs,
  Tab
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Download as DownloadIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  ArrowDownward as PayIcon,
  Payment as PaymentIcon,
  CalendarToday as DateIcon,
  AccountBalance as AccountIcon,
  Receipt as BillIcon,
  Store as VendorIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers';
import { useNavigate } from 'react-router-dom';

const PayablePage = () => {
  const navigate = useNavigate();
  const [payables, setPayables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedPayable, setSelectedPayable] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [activeTab, setActiveTab] = useState(0);

  // Form state for recording payment
  const [paymentForm, setPaymentForm] = useState({
    amount: 0,
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'BANK_TRANSFER',
    accountId: '',
    referenceNumber: '',
    notes: ''
  });

  // Mock data - replace with actual API calls
  const mockPayables = [
    {
      id: 1,
      billNumber: 'BILL-2024-001',
      vendorName: 'Diesel Suppliers Inc',
      amount: 50000,
      currency: 'ZAR',
      dueDate: '2024-02-10',
      status: 'OVERDUE',
      daysOverdue: 8,
      category: 'FUEL',
      description: 'January fuel supply'
    },
    {
      id: 2,
      billNumber: 'BILL-2024-002',
      vendorName: 'Truck Maintenance Ltd',
      amount: 25000,
      currency: 'ZAR',
      dueDate: '2024-02-25',
      status: 'DUE_SOON',
      daysOverdue: 0,
      category: 'MAINTENANCE',
      description: 'Vehicle service charges'
    },
    {
      id: 3,
      billNumber: 'BILL-2024-003',
      vendorName: 'Office Rentals SA',
      amount: 15000,
      currency: 'ZAR',
      dueDate: '2024-01-31',
      status: 'PAID',
      daysOverdue: 0,
      category: 'RENT',
      description: 'January office rent'
    },
    {
      id: 4,
      billNumber: 'BILL-2024-004',
      vendorName: 'Insurance Corp',
      amount: 18000,
      currency: 'ZAR',
      dueDate: '2024-02-15',
      status: 'PENDING',
      daysOverdue: 0,
      category: 'INSURANCE',
      description: 'Fleet insurance premium'
    },
    {
      id: 5,
      billNumber: 'BILL-2024-005',
      vendorName: 'Software Solutions',
      amount: 8000,
      currency: 'ZAR',
      dueDate: '2024-02-05',
      status: 'OVERDUE',
      daysOverdue: 13,
      category: 'SOFTWARE',
      description: 'Monthly subscription'
    }
  ];

  const statusOptions = [
    { value: 'DRAFT', label: 'Draft', color: 'default' },
    { value: 'PENDING', label: 'Pending', color: 'default' },
    { value: 'APPROVED', label: 'Approved', color: 'info' },
    { value: 'DUE_SOON', label: 'Due Soon', color: 'warning' },
    { value: 'OVERDUE', label: 'Overdue', color: 'error' },
    { value: 'PARTIAL', label: 'Partially Paid', color: 'secondary' },
    { value: 'PAID', label: 'Paid', color: 'success' },
    { value: 'CANCELLED', label: 'Cancelled', color: 'default' },
  ];

  const categoryOptions = [
    'FUEL', 'MAINTENANCE', 'RENT', 'INSURANCE', 'SOFTWARE', 'SALARIES', 'UTILITIES', 'TAXES', 'OTHER'
  ];

  const paymentMethods = [
    { value: 'CASH', label: 'Cash' },
    { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
    { value: 'CREDIT_CARD', label: 'Credit Card' },
    { value: 'CHEQUE', label: 'Cheque' },
    { value: 'MOBILE_MONEY', label: 'Mobile Money' },
  ];

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setPayables(mockPayables);
      setLoading(false);
    }, 1000);
  }, []);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenPaymentDialog = (payable) => {
    setSelectedPayable(payable);
    setPaymentForm({
      amount: payable.amount,
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod: 'BANK_TRANSFER',
      accountId: '',
      referenceNumber: '',
      notes: `Payment for ${payable.billNumber}`
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedPayable(null);
  };

  const handlePaymentFormChange = (e) => {
    const { name, value } = e.target;
    setPaymentForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRecordPayment = () => {
    // Here you would call your API to record the payment
    console.log('Recording payable payment:', {
      payableId: selectedPayable.id,
      ...paymentForm
    });

    // Update local state
    setPayables(prev => prev.map(p =>
      p.id === selectedPayable.id
        ? { ...p, status: 'PAID' }
        : p
    ));

    handleCloseDialog();
  };

  const formatCurrency = (amount, currency = 'ZAR') => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const filteredPayables = payables.filter(payable => {
    const matchesSearch = payable.billNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payable.vendorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payable.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || payable.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const totalPayables = filteredPayables.reduce((sum, p) => sum + (p.amount || 0), 0);
  const overduePayables = filteredPayables.filter(p => p.status === 'OVERDUE');
  const totalOverdue = overduePayables.reduce((sum, p) => sum + (p.amount || 0), 0);
  const dueSoonPayables = filteredPayables.filter(p => p.status === 'DUE_SOON');
  const totalDueSoon = dueSoonPayables.reduce((sum, p) => sum + (p.amount || 0), 0);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" fontWeight={600}>
            Payables - I Pay You
          </Typography>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
            >
              Export
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/finance/bills/new')}
            >
              Add Bill
            </Button>
          </Stack>
        </Box>
        <Typography variant="body1" color="text.secondary">
          Manage outgoing payments to vendors and suppliers
        </Typography>
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          variant="fullWidth"
        >
          <Tab label="All Payables" />
          <Tab label="Overdue" />
          <Tab label="Due This Week" />
          <Tab label="Pending Approval" />
        </Tabs>
      </Paper>

      {/* Stats Summary */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <AccountIcon color="primary" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h5" fontWeight={600} color="primary.main">
                    {formatCurrency(totalPayables)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Payables
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <WarningIcon color="error" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h5" fontWeight={600} color="error.main">
                    {formatCurrency(totalOverdue)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Overdue Amount
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <BillIcon color="warning" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h5" fontWeight={600} color="warning.main">
                    {formatCurrency(totalDueSoon)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Due Soon
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <VendorIcon color="info" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h5" fontWeight={600} color="info.main">
                    {filteredPayables.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Bills
                  </Typography>
                </Box>
              </Stack>
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
          <Grid item xs={12} md={3}>
            <Button
              variant="contained"
              fullWidth
              startIcon={<AddIcon />}
              onClick={() => navigate('/finance/bills/new')}
            >
              Add New Bill
            </Button>
          </Grid>
          <Grid item xs={12} md={3}>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<PaymentIcon />}
              onClick={() => {
                // Bulk payment functionality
              }}
            >
              Bulk Payment
            </Button>
          </Grid>
          <Grid item xs={12} md={3}>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<DownloadIcon />}
              onClick={() => {/* Export functionality */}}
            >
              Export Report
            </Button>
          </Grid>
          <Grid item xs={12} md={3}>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<FilterIcon />}
              onClick={() => {/* Advanced filter functionality */}}
            >
              Advanced Filters
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
              placeholder="Search by bill, vendor, description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={2}>
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
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value=""
                label="Category"
                onChange={() => {}}
              >
                <MenuItem value="">All Categories</MenuItem>
                {categoryOptions.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <DatePicker
              label="From Date"
              slotProps={{
                textField: {
                  fullWidth: true,
                },
              }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
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

      {/* Payables Table */}
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
                  <TableCell>Bill #</TableCell>
                  <TableCell>Vendor</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell>Due Date</TableCell>
                  <TableCell>Days Overdue</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredPayables
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((payable) => {
                    const statusConfig = statusOptions.find(s => s.value === payable.status) ||
                                        { label: payable.status, color: 'default' };

                    return (
                      <TableRow
                        key={payable.id}
                        hover
                        sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                      >
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>
                            {payable.billNumber}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <VendorIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                            <Typography variant="body2">
                              {payable.vendorName}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={payable.category}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {payable.description}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body1" fontWeight={600}>
                            {formatCurrency(payable.amount, payable.currency)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <DateIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                            <Typography variant="body2">
                              {payable.dueDate}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          {payable.daysOverdue > 0 ? (
                            <Chip
                              label={`${payable.daysOverdue} days`}
                              size="small"
                              color="error"
                              variant="outlined"
                            />
                          ) : payable.status === 'DUE_SOON' ? (
                            <Chip
                              label="Due Soon"
                              size="small"
                              color="warning"
                              variant="outlined"
                            />
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              -
                            </Typography>
                          )}
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
                              onClick={() => navigate(`/finance/bills/${payable.id}`)}
                            >
                              <ViewIcon />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => navigate(`/finance/bills/${payable.id}/edit`)}
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => handleOpenPaymentDialog(payable)}
                              disabled={payable.status === 'PAID'}
                            >
                              <PayIcon />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => {/* Delete functionality */}}
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
            count={filteredPayables.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Paper>
      )}

      {/* Payment Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          Record Payment
          {selectedPayable && (
            <Typography variant="subtitle2" color="text.secondary">
              Bill: {selectedPayable.billNumber} | Vendor: {selectedPayable.vendorName}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          {selectedPayable && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    Bill Amount
                  </Typography>
                  <Typography variant="h6">
                    {formatCurrency(selectedPayable.amount, selectedPayable.currency)}
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Payment Amount"
                    name="amount"
                    type="number"
                    value={paymentForm.amount}
                    onChange={handlePaymentFormChange}
                    InputProps={{
                      startAdornment: <Typography sx={{ mr: 1 }}>{selectedPayable.currency}</Typography>,
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <DatePicker
                    label="Payment Date"
                    value={new Date(paymentForm.paymentDate)}
                    onChange={(date) => {
                      setPaymentForm(prev => ({
                        ...prev,
                        paymentDate: date.toISOString().split('T')[0]
                      }));
                    }}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                      },
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Payment Method</InputLabel>
                    <Select
                      name="paymentMethod"
                      value={paymentForm.paymentMethod}
                      label="Payment Method"
                      onChange={handlePaymentFormChange}
                    >
                      {paymentMethods.map((method) => (
                        <MenuItem key={method.value} value={method.value}>
                          {method.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Bank Account"
                    name="accountId"
                    value={paymentForm.accountId}
                    onChange={handlePaymentFormChange}
                    placeholder="Select bank account"
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Reference Number"
                    name="referenceNumber"
                    value={paymentForm.referenceNumber}
                    onChange={handlePaymentFormChange}
                    placeholder="e.g., Bank reference or cheque number"
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Notes"
                    name="notes"
                    value={paymentForm.notes}
                    onChange={handlePaymentFormChange}
                    multiline
                    rows={3}
                    placeholder="Additional payment notes..."
                  />
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleRecordPayment}
            disabled={!paymentForm.amount || paymentForm.amount <= 0}
          >
            Record Payment
          </Button>
        </DialogActions>
      </Dialog>

      {/* Summary Section */}
      <Grid container spacing={3} sx={{ mt: 3 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom fontWeight={600}>
              Payables Summary
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Stack spacing={2}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                  Total Payables
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {formatCurrency(totalPayables)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                  Overdue Amount
                </Typography>
                <Typography variant="body1" color="error.main" fontWeight={600}>
                  {formatCurrency(totalOverdue)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                  Due Soon (Next 7 days)
                </Typography>
                <Typography variant="body1" color="warning.main" fontWeight={600}>
                  {formatCurrency(totalDueSoon)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                  Bills Count
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {filteredPayables.length}
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom fontWeight={600}>
              Category Breakdown
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Stack spacing={1}>
              {categoryOptions.map((category) => {
                const bills = filteredPayables.filter(p => p.category === category);
                const amount = bills.reduce((sum, p) => sum + p.amount, 0);

                if (bills.length === 0) return null;

                return (
                  <Box key={category} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        {category}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {bills.length} bill{bills.length !== 1 ? 's' : ''}
                      </Typography>
                    </Box>
                    <Typography variant="body2" fontWeight={600}>
                      {formatCurrency(amount)}
                    </Typography>
                  </Box>
                );
              })}
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default PayablePage;