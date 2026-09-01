// src/components/billing/LoadBillingDashboard.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Alert,
  Stack,
} from '@mui/material';
import {
  Receipt as ReceiptIcon,
  Calculate as CalculateIcon,
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import billingService from '../../services/billingService';
import invoiceService from '../../services/invoice.service';

const LoadBillingDashboard = ({ loadId, onInvoiceGenerated }) => {
  const [billing, setBilling] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [openInvoiceDialog, setOpenInvoiceDialog] = useState(false);
  const [generatingInvoice, setGeneratingInvoice] = useState(false);

  useEffect(() => {
    if (loadId) {
      fetchBillingData();
    }
  }, [loadId]);

  const fetchBillingData = async () => {
    setLoading(true);
    setError('');
    try {
      const [billingData, summaryData] = await Promise.all([
        billingService.getLoadBilling(loadId),
        billingService.getLoadBillingSummary(loadId),
      ]);
      setBilling(billingData);
      setSummary(summaryData);
    } catch (err) {
      setError('Failed to load billing data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCalculate = async () => {
    setLoading(true);
    try {
      await billingService.calculateLoadBilling(loadId);
      await fetchBillingData();
    } catch (err) {
      setError('Failed to calculate billing');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculate = async () => {
    if (!window.confirm('This will recalculate all trip billings for this load. Continue?')) return;
    
    setLoading(true);
    try {
      await billingService.recalculateLoadBilling(loadId);
      await fetchBillingData();
    } catch (err) {
      setError('Failed to recalculate billing');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInvoice = async () => {
    setGeneratingInvoice(true);
    try {
      const invoice = await billingService.generateInvoiceFromLoad(loadId);
      setOpenInvoiceDialog(false);
      if (onInvoiceGenerated) {
        onInvoiceGenerated(invoice);
      }
      await fetchBillingData();
      // Navigate to invoice
      window.location.href = `/finance/invoices/${invoice.id}`;
    } catch (err) {
      setError('Failed to generate invoice: ' + err.message);
      console.error(err);
    } finally {
      setGeneratingInvoice(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
    }).format(amount || 0);
  };

  if (loading && !billing) {
    return <LinearProgress sx={{ my: 4 }} />;
  }

  if (error) {
    return <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>;
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" fontWeight={600}>
          Load Billing: {loadId}
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<CalculateIcon />}
            onClick={handleCalculate}
            size="small"
          >
            Calculate
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRecalculate}
            size="small"
            color="warning"
          >
            Recalculate
          </Button>
          <Button
            variant="contained"
            startIcon={<ReceiptIcon />}
            onClick={() => setOpenInvoiceDialog(true)}
            disabled={!summary?.canInvoice || summary?.totalInvoiced > 0}
            size="small"
          >
            Generate Invoice
          </Button>
        </Stack>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">Total Trips</Typography>
              <Typography variant="h4" fontWeight={600}>
                {summary?.totalTrips || 0}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {summary?.totalBillable || 0} billable
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">Total Distance</Typography>
              <Typography variant="h4" fontWeight={600}>
                {billing?.totalDistanceKm?.toFixed(0) || 0} km
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">Subtotal</Typography>
              <Typography variant="h4" fontWeight={600} color="primary">
                {formatCurrency(billing?.subtotal)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ bgcolor: '#EEF2FF' }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary">Total (incl. VAT)</Typography>
              <Typography variant="h4" fontWeight={700} color="#4F46E5">
                {formatCurrency(billing?.total)}
              </Typography>
              <Chip
                label={billing?.status || 'DRAFT'}
                size="small"
                color={billing?.status === 'INVOICED' ? 'success' : 'warning'}
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Trip Breakdown */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          Trip Breakdown
        </Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Trip #</TableCell>
                <TableCell>Origin → Destination</TableCell>
                <TableCell align="right">Distance</TableCell>
                <TableCell align="right">Tonnage</TableCell>
                <TableCell align="right">Subtotal</TableCell>
                <TableCell align="right">Total</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {summary?.trips?.map((tripBilling) => (
                <TableRow key={tripBilling.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>
                      {tripBilling.trip?.tripNumber}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" display="block" noWrap sx={{ maxWidth: 200 }}>
                      {tripBilling.trip?.originLocation} → {tripBilling.trip?.destinationLocation}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    {tripBilling.distanceKm?.toFixed(0)} km
                  </TableCell>
                  <TableCell align="right">
                    {tripBilling.tonnage?.toFixed(1)} t
                  </TableCell>
                  <TableCell align="right">
                    {formatCurrency(tripBilling.subtotal)}
                  </TableCell>
                  <TableCell align="right" fontWeight={600}>
                    {formatCurrency(tripBilling.total)}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={tripBilling.status}
                      size="small"
                      color={tripBilling.status === 'INVOICED' ? 'success' : 'primary'}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      onClick={() => window.open(`/trips/${tripBilling.trip?.id}`, '_blank')}
                    >
                      <ViewIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {(!summary?.trips || summary.trips.length === 0) && (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">No trips found for this load</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Invoice Generation Dialog */}
      <Dialog open={openInvoiceDialog} onClose={() => setOpenInvoiceDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Generate Invoice</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Alert severity="info" sx={{ mb: 2 }}>
              This will create an invoice for all trips in load <strong>{loadId}</strong>
            </Alert>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Total Trips:</Typography>
                <Typography variant="h6">{summary?.totalTrips || 0}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Total Amount:</Typography>
                <Typography variant="h6" color="primary">{formatCurrency(billing?.total)}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">Customer:</Typography>
                <Typography>{summary?.customerName || 'N/A'}</Typography>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenInvoiceDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleGenerateInvoice}
            disabled={generatingInvoice}
            startIcon={<ReceiptIcon />}
          >
            {generatingInvoice ? 'Generating...' : 'Generate Invoice'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LoadBillingDashboard;
