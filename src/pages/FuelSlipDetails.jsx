// src/pages/FuelSlipDetails.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Stack,
  Divider,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  LocalGasStation,
  Person,
  DirectionsCar,
  Event,
  AttachMoney,
  LocationOn,
  Receipt,
  CheckCircle,
  Cancel,
  Print as PrintIcon,
} from '@mui/icons-material';
import { fuelService } from '../services/fuelService';

// Currency formatter for South African Rand (ZAR)
const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return 'R 0.00';
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numAmount);
};

// Format number with commas
const formatNumber = (num) => {
  if (num === null || num === undefined) return '0.00';
  const number = typeof num === 'string' ? parseFloat(num) : num;
  return new Intl.NumberFormat('en-ZA', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(number);
};

// Compact Info Item Component
const InfoItem = ({ label, value, icon: Icon, color = 'primary' }) => (
  <Paper
    sx={{
      p: 1.5,
      bgcolor: 'grey.50',
      borderRadius: 1,
      border: '1px solid',
      borderColor: 'divider',
      height: '100%',
    }}
  >
    <Stack direction="row" alignItems="center" spacing={1}>
      {Icon && (
        <Box
          sx={{
            bgcolor: `${color}.light`,
            borderRadius: 1,
            p: 0.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon sx={{ fontSize: '1rem', color: `${color}.main` }} />
        </Box>
      )}
      <Box>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
          {label}
        </Typography>
        <Typography variant="body2" fontWeight="500" sx={{ fontSize: '0.8rem' }}>
          {value || 'N/A'}
        </Typography>
      </Box>
    </Stack>
  </Paper>
);

const FuelSlipDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [slip, setSlip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchSlipDetails();
  }, [id]);

  const fetchSlipDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fuelService.getFuelSlipById(id);
      setSlip(data);
    } catch (err) {
      console.error('Failed to fetch fuel slip details:', err);
      setError(err.message || 'Failed to load fuel slip details');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await fuelService.deleteFuelSlip(id);
      setDeleteDialogOpen(false);
      navigate('/fuel/slips');
    } catch (err) {
      console.error('Failed to delete fuel slip:', err);
      setError(err.message || 'Failed to delete fuel slip');
      setDeleting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <Box textAlign="center">
          <CircularProgress size={40} />
          <Typography variant="body1" mt={1} sx={{ fontSize: '0.9rem' }}>
            Loading fuel slip details...
          </Typography>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error" sx={{ fontSize: '0.8rem' }}>{error}</Alert>
        <Button
          variant="contained"
          size="small"
          onClick={() => navigate('/fuel/slips')}
          sx={{ mt: 2, fontSize: '0.8rem' }}
        >
          Back to Fuel Slips
        </Button>
      </Box>
    );
  }

  if (!slip) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="warning" sx={{ fontSize: '0.8rem' }}>Fuel slip not found</Alert>
        <Button
          variant="contained"
          size="small"
          onClick={() => navigate('/fuel/slips')}
          sx={{ mt: 2, fontSize: '0.8rem' }}
        >
          Back to Fuel Slips
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 1, sm: 1.5, md: 2 } }}>
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontSize: '1rem' }}>
          <DeleteIcon sx={{ verticalAlign: 'middle', mr: 1, color: 'error.main' }} />
          Delete Fuel Slip
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: '0.9rem' }}>
            Are you sure you want to delete this fuel slip? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} size="small" sx={{ fontSize: '0.8rem' }}>
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            variant="contained"
            color="error"
            disabled={deleting}
            size="small"
            sx={{ fontSize: '0.8rem' }}
          >
            {deleting ? <CircularProgress size={18} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Header - Compact */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <IconButton onClick={() => navigate('/fuel/slips')} size="small">
            <ArrowBackIcon sx={{ fontSize: '0.9rem' }} />
          </IconButton>
          <Box>
            <Typography variant="h6" fontWeight="600" sx={{ fontSize: '1rem' }}>
              Fuel Slip Details
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
              #{slip.id || 'N/A'} • {slip.transactionDate ? new Date(slip.transactionDate).toLocaleDateString() : 'N/A'}
            </Typography>
          </Box>
        </Stack>
        <Stack direction="row" spacing={0.75}>
          <Tooltip title="Print">
            <IconButton size="small" onClick={handlePrint} sx={{ p: 0.5 }}>
              <PrintIcon sx={{ fontSize: '0.9rem' }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit">
            <IconButton
              size="small"
              color="primary"
              onClick={() => navigate(`/fuel/slips/${id}/edit`)}
              sx={{ p: 0.5 }}
            >
              <EditIcon sx={{ fontSize: '0.9rem' }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton
              size="small"
              color="error"
              onClick={() => setDeleteDialogOpen(true)}
              sx={{ p: 0.5 }}
            >
              <DeleteIcon sx={{ fontSize: '0.9rem' }} />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>

      {/* Summary Card - Compact */}
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={8}>
              <Stack spacing={1}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <LocalGasStation sx={{ fontSize: '1.2rem', color: 'primary.main' }} />
                  <Typography variant="h5" fontWeight="bold" sx={{ fontSize: '1.1rem' }}>
                    {formatCurrency(slip.totalAmount)}
                  </Typography>
                  <Chip
                    label={slip.finalized ? 'Finalized' : 'Pending'}
                    size="small"
                    color={slip.finalized ? 'success' : 'warning'}
                    icon={slip.finalized ? <CheckCircle sx={{ fontSize: '0.7rem' }} /> : <Cancel sx={{ fontSize: '0.7rem' }} />}
                    sx={{ height: 20, fontSize: '0.6rem' }}
                  />
                </Stack>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                    <strong>Quantity:</strong> {formatNumber(slip.quantity)} L
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                    <strong>Unit Price:</strong> {formatCurrency(slip.unitPrice)}/L
                  </Typography>
                  {slip.quantity && slip.totalAmount && (
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                      <strong>Effective Price:</strong> {formatCurrency(parseFloat(slip.totalAmount) / parseFloat(slip.quantity))}/L
                    </Typography>
                  )}
                </Stack>
              </Stack>
            </Grid>
            <Grid item xs={12} md={4}>
              <Stack alignItems={{ xs: 'flex-start', md: 'flex-end' }} spacing={0.5}>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
                  Created: {slip.createdAt ? new Date(slip.createdAt).toLocaleString() : 'N/A'}
                </Typography>
                {slip.updatedAt && (
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
                    Updated: {new Date(slip.updatedAt).toLocaleString()}
                  </Typography>
                )}
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Details Grid - Compact */}
      <Grid container spacing={1.5}>
        <Grid item xs={12} md={6}>
          <Stack spacing={1.5}>
            <InfoItem
              label="Driver"
              value={`${slip.driverName || 'N/A'} (ID: ${slip.driverId || 'N/A'})`}
              icon={Person}
              color="secondary"
            />
            <InfoItem
              label="Vehicle"
              value={`${slip.vehicleRegNumber || 'N/A'} (ID: ${slip.vehicleId || 'N/A'})`}
              icon={DirectionsCar}
              color="info"
            />
            <InfoItem
              label="Transaction Date"
              value={slip.transactionDate ? new Date(slip.transactionDate).toLocaleString() : 'N/A'}
              icon={Event}
              color="warning"
            />
          </Stack>
        </Grid>

        <Grid item xs={12} md={6}>
          <Stack spacing={1.5}>
            <InfoItem
              label="Fuel Station"
              value={slip.stationName || slip.location || 'N/A'}
              icon={LocationOn}
              color="primary"
            />
            <InfoItem
              label="Receipt Number"
              value={slip.receiptNumber || 'N/A'}
              icon={Receipt}
              color="success"
            />
            <InfoItem
              label="Status"
              value={slip.finalized ? 'Finalized' : 'Pending'}
              icon={slip.finalized ? CheckCircle : Cancel}
              color={slip.finalized ? 'success' : 'warning'}
            />
          </Stack>
        </Grid>

        {/* Notes Section */}
        {slip.notes && (
          <Grid item xs={12}>
            <Divider sx={{ my: 1.5 }} />
            <Typography variant="subtitle2" sx={{ fontSize: '0.8rem', fontWeight: 600, mb: 1 }}>
              Notes
            </Typography>
            <Paper variant="outlined" sx={{ p: 1.5, bgcolor: 'grey.50' }}>
              <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                {slip.notes}
              </Typography>
            </Paper>
          </Grid>
        )}

        {/* Audit Trail */}
        <Grid item xs={12}>
          <Divider sx={{ my: 1.5 }} />
          <Typography variant="subtitle2" sx={{ fontSize: '0.8rem', fontWeight: 600, mb: 1 }}>
            Audit Trail
          </Typography>
          <Paper variant="outlined" sx={{ p: 1.5, bgcolor: 'grey.50' }}>
            <Stack spacing={0.5}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>
                  <strong>Created:</strong> {slip.createdAt ? new Date(slip.createdAt).toLocaleString() : 'N/A'}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
                  By: {slip.createdBy || 'N/A'}
                </Typography>
              </Box>
              {slip.updatedAt && (
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>
                    <strong>Last Updated:</strong> {new Date(slip.updatedAt).toLocaleString()}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
                    By: {slip.updatedBy || 'N/A'}
                  </Typography>
                </Box>
              )}
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      {/* Actions Footer */}
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon sx={{ fontSize: '0.9rem' }} />}
          onClick={() => navigate('/fuel/slips')}
          size="small"
          sx={{ fontSize: '0.8rem' }}
        >
          Back to Fuel Slips
        </Button>
        <Stack direction="row" spacing={0.75}>
          <Button
            variant="contained"
            startIcon={<EditIcon sx={{ fontSize: '0.9rem' }} />}
            onClick={() => navigate(`/fuel/slips/${id}/edit`)}
            size="small"
            sx={{ fontSize: '0.8rem' }}
          >
            Edit Slip
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon sx={{ fontSize: '0.9rem' }} />}
            onClick={() => setDeleteDialogOpen(true)}
            size="small"
            sx={{ fontSize: '0.8rem' }}
          >
            Delete
          </Button>
        </Stack>
      </Box>
    </Box>
  );
};

export default FuelSlipDetails;
