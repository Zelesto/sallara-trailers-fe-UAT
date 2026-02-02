import React from 'react';
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
} from '@mui/icons-material';

const Billing = () => {
  // Mock data
  const invoices = [
    { id: 'INV-2024-001', date: '2024-01-15', customer: 'ABC Logistics', amount: 125000, status: 'Paid', dueDate: '2024-01-30' },
    { id: 'INV-2024-002', date: '2024-01-20', customer: 'XYZ Transport', amount: 87500, status: 'Pending', dueDate: '2024-02-10' },
    { id: 'INV-2024-003', date: '2024-01-25', customer: 'Global Freight', amount: 156000, status: 'Paid', dueDate: '2024-02-05' },
    { id: 'INV-2024-004', date: '2024-02-01', customer: 'Regional Haulers', amount: 92000, status: 'Overdue', dueDate: '2024-02-01' },
    { id: 'INV-2024-005', date: '2024-02-05', customer: 'City Delivery', amount: 68000, status: 'Pending', dueDate: '2024-02-20' },
    { id: 'INV-2024-006', date: '2024-02-10', customer: 'Express Cargo', amount: 112000, status: 'Paid', dueDate: '2024-02-25' },
  ];

  const billingStats = [
    { label: 'Total Invoiced', value: 'R 640,500', change: '+12.5%', color: 'primary' },
    { label: 'Outstanding', value: 'R 160,000', change: '-5.2%', color: 'warning' },
    { label: 'Overdue', value: 'R 92,000', change: '+8.3%', color: 'error' },
    { label: 'Avg Days to Pay', value: '18 days', change: '-2 days', color: 'success' },
  ];

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box display="flex" alignItems="center" gap={2}>
          <ReceiptIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          <Box>
            <Typography variant="h4">Billing & Invoices</Typography>
            <Typography variant="body1" color="text.secondary">
              Manage client invoices and payments
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {billingStats.map((stat) => (
          <Grid item xs={12} sm={6} md={3} key={stat.label}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  {stat.label}
                </Typography>
                <Typography variant="h4" sx={{ mb: 1 }}>
                  {stat.value}
                </Typography>
                <Typography
                  variant="caption"
                  color={stat.change.startsWith('+') ? 'error' : 'success'}
                  sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                >
                  {stat.change}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Actions and Search */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              placeholder="Search invoices..."
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select label="Status" defaultValue="all">
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="paid">Paid</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="overdue">Overdue</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6} sx={{ textAlign: { md: 'right' } }}>
            <Button variant="contained" startIcon={<Add />} sx={{ mr: 1 }}>
              Create Invoice
            </Button>
            <Button variant="outlined" startIcon={<Download />}>
              Export
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Invoices Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Recent Invoices
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Invoice #</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Due Date</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id} hover>
                    <TableCell>
                      <Typography fontWeight="medium">{invoice.id}</Typography>
                    </TableCell>
                    <TableCell>{invoice.date}</TableCell>
                    <TableCell>{invoice.customer}</TableCell>
                    <TableCell>
                      <Typography fontWeight="medium">
                        R {invoice.amount.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={invoice.status}
                        color={
                          invoice.status === 'Paid' ? 'success' :
                          invoice.status === 'Pending' ? 'warning' : 'error'
                        }
                        size="small"
                        icon={invoice.status === 'Paid' ? <Paid /> : <Pending />}
                      />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <CalendarMonth fontSize="small" />
                        {invoice.dueDate}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" color="primary" title="View">
                        <Visibility />
                      </IconButton>
                      <IconButton size="small" color="secondary" title="Edit">
                        <Edit />
                      </IconButton>
                      <IconButton size="small" color="info" title="Send">
                        <Email />
                      </IconButton>
                      <IconButton size="small" color="default" title="Print">
                        <Print />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
        <CardActions sx={{ justifyContent: 'space-between', p: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Showing 6 of 124 invoices
          </Typography>
          <Box>
            <Button variant="outlined" sx={{ mr: 1 }}>
              Previous
            </Button>
            <Button variant="outlined">
              Next
            </Button>
          </Box>
        </CardActions>
      </Card>

      {/* Quick Actions */}
      <Grid container spacing={3} sx={{ mt: 3 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<Add />}
                    sx={{ justifyContent: 'flex-start' }}
                  >
                    Create Estimate
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<Email />}
                    sx={{ justifyContent: 'flex-start' }}
                  >
                    Send Reminders
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<Download />}
                    sx={{ justifyContent: 'flex-start' }}
                  >
                    Export Reports
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<AttachMoney />}
                    sx={{ justifyContent: 'flex-start' }}
                  >
                    Record Payment
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Payment Summary
              </Typography>
              <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      This Month
                    </Typography>
                    <Typography variant="h6">R 245,000</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Last Month
                    </Typography>
                    <Typography variant="h6">R 218,500</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      YTD Total
                    </Typography>
                    <Typography variant="h6">R 640,500</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Avg Payment Days
                    </Typography>
                    <Typography variant="h6">18 days</Typography>
                  </Grid>
                </Grid>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Billing;