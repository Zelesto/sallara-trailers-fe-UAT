import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { ArrowBack, Delete, Edit, AccountBalanceWallet } from '@mui/icons-material';
import accountService from '../../services/account';
import { ACCOUNT_TYPE_OPTIONS } from '../../constants';

const formatCurrency = (value, currency = 'ZAR') => {
  const numericValue = Number(value ?? 0);
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericValue);
};

const AccountDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAccount();
  }, [id]);

  const loadAccount = async () => {
    try {
      setLoading(true);
      const data = await accountService.getAccountById(Number(id));
      setAccount(data);
    } catch (err) {
      console.error('Error loading account details:', err);
      setError('Unable to load the account details.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!account?.id) return;

    const confirmed = window.confirm(`Delete ${account.name}? This will deactivate the account.`);
    if (!confirmed) return;

    try {
      await accountService.deleteAccount(account.id);
      navigate('/finance/accounts');
    } catch (err) {
      console.error('Error deleting account:', err);
      setError('Account could not be deleted.');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !account) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error || 'Account not found.'}</Alert>
        <Button variant="outlined" sx={{ mt: 2 }} onClick={() => navigate('/finance/accounts')}>
          Back to accounts
        </Button>
      </Box>
    );
  }

  const typeLabel = ACCOUNT_TYPE_OPTIONS.find((option) => option.value === account.type)?.label || account.type;
  const statusLabel = account.active ? 'Active' : 'Inactive';

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3, maxWidth: 1100, mx: 'auto' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Button variant="outlined" startIcon={<ArrowBack />} onClick={() => navigate('/finance/accounts')}>
              Back
            </Button>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AccountBalanceWallet color="primary" />
              <Typography variant="h4" fontWeight={700}>{account.name}</Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1}>
            <Button variant="outlined" startIcon={<Edit />} onClick={() => navigate(`/finance/accounts/${id}/edit`)}>
              Edit
            </Button>
            <Button variant="contained" color="error" startIcon={<Delete />} onClick={handleDelete}>
              Delete
            </Button>
          </Stack>
        </Stack>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="overline" color="text.secondary">Summary</Typography>
                <Typography variant="h5" fontWeight={700}>{account.name}</Typography>
                <Divider sx={{ my: 2 }} />
                <Stack spacing={1.5}>
                  <Box><strong>Type:</strong> <Chip label={typeLabel} size="small" /></Box>
                  <Box><strong>Status:</strong> <Chip label={statusLabel} size="small" color={account.active ? 'success' : 'default'} /></Box>
                  <Box><strong>Account number:</strong> {account.accountNumber || '—'}</Box>
                  <Box><strong>Provider:</strong> {account.provider || '—'}</Box>
                  <Box><strong>Currency:</strong> {account.currency || 'ZAR'}</Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="overline" color="text.secondary">Financial Information</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="text.secondary">Current balance</Typography>
                    <Typography variant="h5" fontWeight={700}>{formatCurrency(account.balance, account.currency || 'ZAR')}</Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="text.secondary">Available balance</Typography>
                    <Typography variant="h5" fontWeight={700}>{formatCurrency(account.availableBalance, account.currency || 'ZAR')}</Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="text.secondary">Credit limit</Typography>
                    <Typography variant="h6">{formatCurrency(account.creditLimit, account.currency || 'ZAR')}</Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="text.secondary">Opening balance</Typography>
                    <Typography variant="h6">{formatCurrency(account.openingBalance, account.currency || 'ZAR')}</Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="text.secondary">Interest rate</Typography>
                    <Typography variant="h6">{account.interestRate ?? '0.00'}%</Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="text.secondary">Reconciliation frequency</Typography>
                    <Typography variant="h6">{account.reconciliationFrequency || 'Not set'}</Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="overline" color="text.secondary">Notes</Typography>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {account.description || account.notes || 'No description provided.'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default AccountDetails;
