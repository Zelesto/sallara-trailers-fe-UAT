// src/pages/finance/FinanceDashboard.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Divider,
  Chip,
  LinearProgress,
  Paper,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  AccountBalance,
  ReceiptLong,
  Description,
  ArrowUpward,
  ArrowDownward,
  Add,
  TrendingUp,
  TrendingDown,
  AccountBalanceWallet,
  Paid,
  MoneyOff,
  Refresh,
} from '@mui/icons-material';

const FinanceDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Mock data - you'll replace with API calls
  const summaryData = {
    totalAccounts: 15,
    activeAccounts: 12,
    totalBalance: 245678.90,
    receivable: 123456.78,
    payable: 98765.43,
    pendingInvoices: 8,
    overdueInvoices: 3,
    monthlyExpenses: 45678.90,
  };

  const quickActions = [
    {
      title: 'Add New Account',
      description: 'Create a new bank or vendor account',
      icon: <AccountBalance />,
      path: '/finance/accounts/new',
      color: 'primary',
    },
    {
      title: 'Record Expense',
      description: 'Log a new business expense',
      icon: <ReceiptLong />,
      path: '/finance/expenses/new',
      color: 'secondary',
    },
    {
      title: 'Create Invoice',
      description: 'Generate a new invoice',
      icon: <Description />,
      path: '/finance/invoices/new',
      color: 'success',
    },
    {
      title: 'Reconcile Accounts',
      description: 'Match statements with transactions',
      icon: <Refresh />,
      path: '/finance/reconciliations',
      color: 'warning',
    },
  ];

  const recentActivity = [
    { id: 1, type: 'invoice', description: 'Invoice #INV-2024-001 created', amount: 15000, date: '2024-01-15', status: 'paid' },
    { id: 2, type: 'expense', description: 'Fuel purchase - Truck #TRK-001', amount: -2500, date: '2024-01-14', status: 'pending' },
    { id: 3, type: 'payment', description: 'Payment received from ABC Logistics', amount: 8000, date: '2024-01-13', status: 'completed' },
    { id: 4, type: 'account', description: 'New vendor account added', amount: 0, date: '2024-01-12', status: 'active' },
  ];

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" fontWeight={600}>
          Finance Dashboard
        </Typography>
        <Stack direction="row" spacing={2}>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate('/finance/accounts/new')}
          >
            New Transaction
          </Button>
        </Stack>
      </Box>

      {/* Main Action Cards - "You Pay Me" & "I Pay You" */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card
            sx={{
              height: '100%',
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 6,
              }
            }}
            onClick={() => navigate('/finance/receivables')}
          >
            <CardContent sx={{ p: 4, textAlign: 'center' }}>
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                <Box sx={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  bgcolor: 'success.light',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <ArrowDownward sx={{ fontSize: 40, color: 'success.contrastText' }} />
                </Box>
              </Box>
              <Typography variant="h5" gutterBottom fontWeight={600}>
                You Pay Me
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                Accounts Receivable
              </Typography>
              <Typography variant="h4" color="success.main" fontWeight={700}>
                ${summaryData.receivable.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Amounts owed to you
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card
            sx={{
              height: '100%',
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 6,
              }
            }}
            onClick={() => navigate('/finance/payables')}
          >
            <CardContent sx={{ p: 4, textAlign: 'center' }}>
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                <Box sx={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  bgcolor: 'error.light',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <ArrowUpward sx={{ fontSize: 40, color: 'error.contrastText' }} />
                </Box>
              </Box>
              <Typography variant="h5" gutterBottom fontWeight={600}>
                I Pay You
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                Accounts Payable
              </Typography>
              <Typography variant="h4" color="error.main" fontWeight={700}>
                ${summaryData.payable.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Amounts you owe
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="body2">
                Total Balance
              </Typography>
              <Typography variant="h5" fontWeight={600}>
                ${summaryData.totalBalance.toLocaleString()}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <TrendingUp color="success" sx={{ mr: 0.5 }} />
                <Typography variant="body2" color="success.main">
                  +12.5% from last month
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="body2">
                Active Accounts
              </Typography>
              <Typography variant="h5" fontWeight={600}>
                {summaryData.activeAccounts}/{summaryData.totalAccounts}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={(summaryData.activeAccounts / summaryData.totalAccounts) * 100}
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="body2">
                Pending Invoices
              </Typography>
              <Typography variant="h5" fontWeight={600}>
                {summaryData.pendingInvoices}
              </Typography>
              <Typography variant="body2" color="warning.main" sx={{ mt: 1 }}>
                {summaryData.overdueInvoices} overdue
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="body2">
                Monthly Expenses
              </Typography>
              <Typography variant="h5" fontWeight={600}>
                ${summaryData.monthlyExpenses.toLocaleString()}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <TrendingDown color="error" sx={{ mr: 0.5 }} />
                <Typography variant="body2" color="error.main">
                  -3.2% from last month
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
        Quick Actions
      </Typography>
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {quickActions.map((action, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card
              sx={{
                cursor: 'pointer',
                '&:hover': {
                  boxShadow: 4,
                }
              }}
              onClick={() => navigate(action.path)}
            >
              <CardContent sx={{ textAlign: 'center' }}>
                <Box sx={{ color: `${action.color}.main`, mb: 1 }}>
                  {action.icon}
                </Box>
                <Typography variant="subtitle1" fontWeight={600}>
                  {action.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {action.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Recent Activity */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6">
                  Recent Activity
                </Typography>
                <Button size="small" onClick={() => navigate('/finance/transactions')}>
                  View All
                </Button>
              </Box>
              <Stack spacing={2}>
                {recentActivity.map((activity) => (
                  <Box key={activity.id} sx={{ display: 'flex', alignItems: 'center', p: 1 }}>
                    <Box sx={{ mr: 2 }}>
                      {activity.type === 'invoice' && <Description color="primary" />}
                      {activity.type === 'expense' && <MoneyOff color="error" />}
                      {activity.type === 'payment' && <Paid color="success" />}
                      {activity.type === 'account' && <AccountBalanceWallet color="info" />}
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2">
                        {activity.description}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {activity.date}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography
                        variant="body2"
                        fontWeight={600}
                        color={activity.amount > 0 ? 'success.main' : activity.amount < 0 ? 'error.main' : 'text.primary'}
                      >
                        {activity.amount !== 0 ? `$${Math.abs(activity.amount).toLocaleString()}` : '-'}
                      </Typography>
                      <Chip
                        label={activity.status}
                        size="small"
                        color={
                          activity.status === 'paid' || activity.status === 'completed' ? 'success' :
                          activity.status === 'pending' ? 'warning' :
                          activity.status === 'active' ? 'info' : 'default'
                        }
                      />
                    </Box>
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Upcoming Payments */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Upcoming Payments
              </Typography>
              <Stack spacing={2}>
                <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="body2" fontWeight={600}>
                    Fuel Supplier Invoice
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Due: Jan 20, 2024
                  </Typography>
                  <Typography variant="body2" fontWeight={600} color="error.main" sx={{ mt: 1 }}>
                    $8,500.00
                  </Typography>
                </Box>
                <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="body2" fontWeight={600}>
                    Maintenance Service
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Due: Jan 25, 2024
                  </Typography>
                  <Typography variant="body2" fontWeight={600} color="error.main" sx={{ mt: 1 }}>
                    $3,200.00
                  </Typography>
                </Box>
                <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="body2" fontWeight={600}>
                    Insurance Premium
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Due: Jan 31, 2024
                  </Typography>
                  <Typography variant="body2" fontWeight={600} color="error.main" sx={{ mt: 1 }}>
                    $12,000.00
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default FinanceDashboard;