import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { ArrowBack, Save } from '@mui/icons-material';
import accountService from '../../services/account';
import { ACCOUNT_TYPE_OPTIONS } from '../../constants';

const emptyForm = {
  name: '',
  type: 'ASSET',
  provider: '',
  accountNumber: '',
  currency: 'ZAR',
  active: true,
  balance: '0.00',
  availableBalance: '0.00',
  creditLimit: '0.00',
  interestRate: '0.00',
  accountSubType: '',
  providerContact: '',
  openingBalance: '0.00',
  openingBalanceDate: '',
  reconciliationFrequency: '',
  description: '',
  notes: '',
};

const AccountForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isEditMode = Boolean(id) && location.pathname.includes('/edit');
  const [formData, setFormData] = useState(emptyForm);
  const accountStatusOptions = [
    { value: true, label: 'Active' },
    { value: false, label: 'Inactive' },
  ];
  const [loading, setLoading] = useState(Boolean(id) && isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEditMode && id) {
      loadAccount();
    }
  }, [id, isEditMode]);

  const loadAccount = async () => {
    try {
      setLoading(true);
      const result = await accountService.getAccountById(Number(id));
      setFormData({
        name: result.name || '',
        type: result.type || 'ASSET',
        provider: result.provider || '',
        accountNumber: result.accountNumber || '',
        currency: result.currency || 'ZAR',
        active: result.active !== false,
        balance: result.balance ?? '0.00',
        availableBalance: result.availableBalance ?? '0.00',
        creditLimit: result.creditLimit ?? '0.00',
        interestRate: result.interestRate ?? '0.00',
        accountSubType: result.accountSubType || '',
        providerContact: result.providerContact || '',
        openingBalance: result.openingBalance ?? '0.00',
        openingBalanceDate: result.openingBalanceDate || '',
        reconciliationFrequency: result.reconciliationFrequency || '',
        description: result.description || '',
        notes: result.notes || '',
      });
    } catch (err) {
      setError('Failed to load account details.');
      console.error('Error loading account:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const validate = () => {
    if (!formData.name?.trim()) {
      setError('Account name is required.');
      return false;
    }

    if (!formData.type) {
      setError('Account type is required.');
      return false;
    }

    if (!formData.accountNumber?.trim()) {
      setError('Account number is required.');
      return false;
    }

    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!validate()) {
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        ...formData,
        name: formData.name.trim(),
        provider: formData.provider?.trim() || '',
        accountNumber: formData.accountNumber.trim(),
        active: Boolean(formData.active),
        balance: Number(formData.balance || 0),
        availableBalance: Number(formData.availableBalance || 0),
        creditLimit: Number(formData.creditLimit || 0),
        interestRate: Number(formData.interestRate || 0),
        openingBalance: Number(formData.openingBalance || 0),
      };

      if (isEditMode && id) {
        await accountService.updateAccount(Number(id), payload);
      } else {
        await accountService.createAccount(payload);
      }

      navigate('/finance/accounts');
    } catch (err) {
      console.error('Error saving account:', err);
      setError('Unable to save account. Please review the details and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3, maxWidth: 1100, mx: 'auto' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Button variant="outlined" startIcon={<ArrowBack />} onClick={() => navigate('/finance/accounts')}>
              Back
            </Button>
            <Box>
              <Typography variant="h4" fontWeight={700}>
                {isEditMode ? 'Edit Account' : 'Create Account'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {isEditMode ? 'Update the account record.' : 'Add a new financial account.'}
              </Typography>
            </Box>
          </Stack>

          <Button
            variant="contained"
            color="primary"
            startIcon={<Save />}
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? 'Saving...' : isEditMode ? 'Update Account' : 'Save Account'}
          </Button>
        </Stack>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>Account Details</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField label="Account name" name="name" value={formData.name} onChange={handleChange} fullWidth required />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Account type</InputLabel>
                      <Select label="Account type" name="type" value={formData.type} onChange={handleChange}>
                        {ACCOUNT_TYPE_OPTIONS.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField label="Account number" name="accountNumber" value={formData.accountNumber} onChange={handleChange} fullWidth required />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField label="Provider" name="provider" value={formData.provider} onChange={handleChange} fullWidth />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField label="Provider contact" name="providerContact" value={formData.providerContact} onChange={handleChange} fullWidth />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField label="Currency" name="currency" value={formData.currency} onChange={handleChange} fullWidth />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth>
                      <InputLabel>Status</InputLabel>
                      <Select
                        label="Status"
                        name="active"
                        value={formData.active}
                        onChange={(event) => setFormData((prev) => ({ ...prev, active: Boolean(event.target.value) }))}
                      >
                        {accountStatusOptions.map((option) => (
                          <MenuItem key={String(option.value)} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField label="Sub type" name="accountSubType" value={formData.accountSubType} onChange={handleChange} fullWidth />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>Financial Summary</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField label="Current balance" name="balance" type="number" value={formData.balance} onChange={handleChange} fullWidth />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField label="Available balance" name="availableBalance" type="number" value={formData.availableBalance} onChange={handleChange} fullWidth />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField label="Credit limit" name="creditLimit" type="number" value={formData.creditLimit} onChange={handleChange} fullWidth />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField label="Interest rate" name="interestRate" type="number" value={formData.interestRate} onChange={handleChange} fullWidth />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField label="Opening balance" name="openingBalance" type="number" value={formData.openingBalance} onChange={handleChange} fullWidth />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Opening balance date"
                      name="openingBalanceDate"
                      type="date"
                      value={formData.openingBalanceDate || ''}
                      onChange={handleChange}
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField label="Reconciliation frequency" name="reconciliationFrequency" value={formData.reconciliationFrequency} onChange={handleChange} fullWidth />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>Notes</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField label="Description" name="description" value={formData.description} onChange={handleChange} fullWidth multiline minRows={3} />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField label="Notes" name="notes" value={formData.notes} onChange={handleChange} fullWidth multiline minRows={3} />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default AccountForm;
