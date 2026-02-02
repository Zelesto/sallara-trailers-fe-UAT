// src/pages/finance/ExpensesPage.jsx
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
  CardContent
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  ReceiptLong as ReceiptIcon,
  AttachFile as AttachIcon,
  Download as DownloadIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  Category as CategoryIcon,
  LocalAtm as PaymentIcon,
  CalendarToday as DateIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers';
import { useNavigate } from 'react-router-dom';
import expenseService from '../../services/expense';

const ExpensesPage = () => {
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [dateRange, setDateRange] = useState({
    start: null,
    end: null
  });

  // Form state
  const [formData, setFormData] = useState({
    description: '',
    category: 'FUEL',
    amount: 0,
    currency: 'ZAR',
    expenseDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'CASH',
    accountId: '',
    vendorName: '',
    vendorContact: '',
    referenceNumber: '',
    receiptNumber: '',
    notes: '',
    status: 'PENDING',
    attachmentUrl: ''
  });

  // Categories
  const expenseCategories = [
    { value: 'FUEL', label: 'Fuel', color: 'primary' },
    { value: 'MAINTENANCE', label: 'Vehicle Maintenance', color: 'secondary' },
    { value: 'REPAIRS', label: 'Repairs', color: 'warning' },
    { value: 'INSURANCE', label: 'Insurance', color: 'info' },
    { value: 'LICENSING', label: 'Licensing & Permits', color: 'success' },
    { value: 'TOLLS', label: 'Tolls & Fees', color: 'error' },
    { value: 'ACCOMMODATION', label: 'Accommodation', color: 'primary' },
    { value: 'MEALS', label: 'Meals & Entertainment', color: 'secondary' },
    { value: 'SALARIES', label: 'Salaries & Wages', color: 'warning' },
    { value: 'OFFICE', label: 'Office Supplies', color: 'info' },
    { value: 'UTILITIES', label: 'Utilities', color: 'success' },
    { value: 'OTHER', label: 'Other', color: 'default' },
  ];

  const paymentMethods = [
    { value: 'CASH', label: 'Cash' },
    { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
    { value: 'CREDIT_CARD', label: 'Credit Card' },
    { value: 'CHEQUE', label: 'Cheque' },
    { value: 'MOBILE_MONEY', label: 'Mobile Money' },
  ];

  const statusOptions = [
    { value: 'PENDING', label: 'Pending', color: 'warning' },
    { value: 'APPROVED', label: 'Approved', color: 'info' },
    { value: 'PAID', label: 'Paid', color: 'success' },
    { value: 'REJECTED', label: 'Rejected', color: 'error' },
    { value: 'REFUNDED', label: 'Refunded', color: 'secondary' },
  ];

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const data = await expenseService.getAllExpenses();
      setExpenses(data);
      setError('');
    } catch (err) {
      setError('Failed to load expenses');
      console.error('Error fetching expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenDialog = (expense = null) => {
    if (expense) {
      setSelectedExpense(expense);
      setFormData({
        description: expense.description || '',
        category: expense.category || 'FUEL',
        amount: expense.amount || 0,
        currency: expense.currency || 'ZAR',
        expenseDate: expense.expenseDate || new Date().toISOString().split('T')[0],
        paymentMethod: expense.paymentMethod || 'CASH',
        accountId: expense.accountId || '',
        vendorName: expense.vendorName || '',
        vendorContact: expense.vendorContact || '',
        referenceNumber: expense.referenceNumber || '',
        receiptNumber: expense.receiptNumber || '',
        notes: expense.notes || '',
        status: expense.status || 'PENDING',
        attachmentUrl: expense.attachmentUrl || ''
      });
    } else {
      setSelectedExpense(null);
      setFormData({
        description: '',
        category: 'FUEL',
        amount: 0,
        currency: 'ZAR',
        expenseDate: new Date().toISOString().split('T')[0],
        paymentMethod: 'CASH',
        accountId: '',
        vendorName: '',
        vendorContact: '',
        referenceNumber: '',
        receiptNumber: '',
        notes: '',
        status: 'PENDING',
        attachmentUrl: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedExpense(null);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDateChange = (date) => {
    setFormData(prev => ({
      ...prev,
      expenseDate: date ? date.toISOString().split('T')[0] : ''
    }));
  };

  const handleSubmit = async () => {
    try {
      if (selectedExpense) {
        await expenseService.updateExpense(selectedExpense.id, formData);
      } else {
        await expenseService.createExpense(formData);
      }
      fetchExpenses();
      handleCloseDialog();
    } catch (err) {
      setError('Failed to save expense');
      console.error('Error saving expense:', err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        await expenseService.deleteExpense(id);
        fetchExpenses();
      } catch (err) {
        setError('Failed to delete expense');
        console.error('Error deleting expense:', err);
      }
    }
  };

  const formatCurrency = (amount, currency = 'ZAR') => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.vendorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.receiptNumber?.includes(searchTerm);
    const matchesCategory = filterCategory === 'all' || expense.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || expense.status === filterStatus;

    // Date range filter
    let matchesDate = true;
    if (dateRange.start && expense.expenseDate) {
      matchesDate = new Date(expense.expenseDate) >= new Date(dateRange.start);
    }
    if (dateRange.end && expense.expenseDate) {
      matchesDate = matchesDate && new Date(expense.expenseDate) <= new Date(dateRange.end);
    }

    return matchesSearch && matchesCategory && matchesStatus && matchesDate;
  });

  const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
  const pendingExpenses = filteredExpenses.filter(exp => exp.status === 'PENDING').length;
  const paidExpenses = filteredExpenses.filter(exp => exp.status === 'PAID').length;

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" fontWeight={600}>
            Expenses Management
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Record Expense
          </Button>
        </Box>
        <Typography variant="body1" color="text.secondary">
          Track and manage business expenses, receipts, and reimbursements
        </Typography>
      </Box>

      {/* Stats Summary */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <ReceiptIcon color="primary" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h5" fontWeight={600} color="primary.main">
                    {formatCurrency(totalExpenses)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Expenses
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <PaymentIcon color="warning" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h5" fontWeight={600} color="warning.main">
                    {pendingExpenses}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pending Expenses
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <CategoryIcon color="success" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h5" fontWeight={600} color="success.main">
                    {paidExpenses}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Paid Expenses
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Search Expenses"
              variant="outlined"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <FilterIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                label="Category"
              >
                <MenuItem value="all">All Categories</MenuItem>
                {expenseCategories.map(cat => (
                  <MenuItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                label="Status"
              >
                <MenuItem value="all">All Status</MenuItem>
                {statusOptions.map(status => (
                  <MenuItem key={status.value} value={status.value}>
                    {status.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <DatePicker
              label="From Date"
              value={dateRange.start}
              onChange={(date) => setDateRange(prev => ({ ...prev, start: date }))}
              slotProps={{ textField: { fullWidth: true } }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <DatePicker
              label="To Date"
              value={dateRange.end}
              onChange={(date) => setDateRange(prev => ({ ...prev, end: date }))}
              slotProps={{ textField: { fullWidth: true } }}
            />
          </Grid>
          <Grid item xs={12} md={1}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchExpenses}
              fullWidth
            >
              Refresh
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Expenses Table */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ p: 3 }}>
            <LinearProgress />
          </Box>
        ) : (
          <>
            <TableContainer sx={{ maxHeight: 600 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Vendor</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Payment Method</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Receipt #</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredExpenses
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((expense) => (
                      <TableRow key={expense.id} hover>
                        <TableCell>
                          {expense.expenseDate ? new Date(expense.expenseDate).toLocaleDateString() : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Typography fontWeight={500}>{expense.description}</Typography>
                          {expense.notes && (
                            <Typography variant="body2" color="text.secondary" noWrap>
                              {expense.notes}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={expenseCategories.find(c => c.value === expense.category)?.label || expense.category}
                            size="small"
                            color={expenseCategories.find(c => c.value === expense.category)?.color || 'default'}
                          />
                        </TableCell>
                        <TableCell>
                          {expense.vendorName || 'N/A'}
                          {expense.vendorContact && (
                            <Typography variant="body2" color="text.secondary">
                              {expense.vendorContact}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography
                            fontWeight={600}
                            color="error.main"
                          >
                            {formatCurrency(expense.amount || 0, expense.currency)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {paymentMethods.find(p => p.value === expense.paymentMethod)?.label || expense.paymentMethod}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={statusOptions.find(s => s.value === expense.status)?.label || expense.status}
                            size="small"
                            color={statusOptions.find(s => s.value === expense.status)?.color || 'default'}
                          />
                        </TableCell>
                        <TableCell>
                          {expense.receiptNumber || 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1}>
                            {expense.attachmentUrl && (
                              <IconButton
                                size="small"
                                href={expense.attachmentUrl}
                                target="_blank"
                                title="View Receipt"
                              >
                                <AttachIcon fontSize="small" />
                              </IconButton>
                            )}
                            <IconButton
                              size="small"
                              onClick={() => navigate(`/finance/expenses/${expense.id}`)}
                              title="View Details"
                            >
                              <ViewIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleOpenDialog(expense)}
                              title="Edit"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDelete(expense.id)}
                              title="Delete"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={filteredExpenses.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </>
        )}
      </Paper>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedExpense ? 'Edit Expense' : 'Record New Expense'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleFormChange}
                required
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  name="category"
                  value={formData.category}
                  onChange={handleFormChange}
                  label="Category"
                >
                  {expenseCategories.map(cat => (
                    <MenuItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Amount"
                name="amount"
                type="number"
                value={formData.amount}
                onChange={handleFormChange}
                required
                InputProps={{
                  startAdornment: <Typography sx={{ mr: 1 }}>{formData.currency}</Typography>
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Payment Method</InputLabel>
                <Select
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleFormChange}
                  label="Payment Method"
                >
                  {paymentMethods.map(method => (
                    <MenuItem key={method.value} value={method.value}>
                      {method.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  value={formData.status}
                  onChange={handleFormChange}
                  label="Status"
                >
                  {statusOptions.map(status => (
                    <MenuItem key={status.value} value={status.value}>
                      {status.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <DatePicker
                label="Expense Date"
                value={formData.expenseDate}
                onChange={handleDateChange}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Receipt Number"
                name="receiptNumber"
                value={formData.receiptNumber}
                onChange={handleFormChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Vendor Name"
                name="vendorName"
                value={formData.vendorName}
                onChange={handleFormChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Vendor Contact"
                name="vendorContact"
                value={formData.vendorContact}
                onChange={handleFormChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Reference Number"
                name="referenceNumber"
                value={formData.referenceNumber}
                onChange={handleFormChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Attachment URL"
                name="attachmentUrl"
                value={formData.attachmentUrl}
                onChange={handleFormChange}
                placeholder="https://..."
              />
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
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {selectedExpense ? 'Update' : 'Save Expense'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ExpensesPage;