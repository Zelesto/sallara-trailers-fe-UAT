// src/pages/inventory/StockMovementForm.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Stack,
  Divider,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormHelperText,
  InputAdornment,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  ArrowBack,
  Save,
  CheckCircle,
  Cancel,
  Warning,
  Receipt,
  LocalAtm,
  Inventory,
  Person,
  Pending,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { inventoryService } from '../services/inventoryService';
import { inventoryMovementService } from '../services/inventoryMovementService';

// Constants
const MOVEMENT_TYPES = [
  { value: 'IN', label: 'Stock In', color: 'success' },
  { value: 'OUT', label: 'Stock Out', color: 'error' },
  { value: 'ADJUSTMENT', label: 'Adjustment', color: 'warning' },
];

const REFERENCE_TYPES = [
  { value: 'INVOICE', label: 'Invoice' },
  { value: 'PURCHASE_ORDER', label: 'Purchase Order' },
  { value: 'RETURN', label: 'Return' },
  { value: 'ADJUSTMENT', label: 'Adjustment' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
  { value: 'OTHER', label: 'Other' },
];

const StockMovementForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [items, setItems] = useState([]);
  const [locations, setLocations] = useState([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const [formData, setFormData] = useState({
    itemId: '',
    quantity: '',
    movementType: 'IN',
    reason: '',
    notes: '',
    referenceNumber: '',
    referenceType: 'INVOICE',
    requiresApproval: false,
    performedBy: '',
    tripId: '',
    fuelSlipId: '',
  });

  const [formErrors, setFormErrors] = useState({});

  // Auto-generate reference number
  useEffect(() => {
    if (!formData.referenceNumber && formData.movementType) {
      const prefix = formData.movementType === 'IN' ? 'IN' : 
                     formData.movementType === 'OUT' ? 'OUT' : 'ADJ';
      const timestamp = new Date().getTime().toString().slice(-8);
      setFormData(prev => ({
        ...prev,
        referenceNumber: `${prefix}-${timestamp}`
      }));
    }
  }, [formData.movementType]);

  useEffect(() => {
    loadData();
    if (isEditMode) {
      loadMovement();
    }
  }, [id]);

  const loadData = async () => {
    try {
      const [itemsData, locationsData] = await Promise.all([
        inventoryService.getInventoryItems(0, 100),
        inventoryService.getLocations(),
      ]);

      const itemsList = itemsData?.content || itemsData || [];
      setItems(itemsList);
      setLocations(locationsData || []);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load inventory data');
    }
  };

  const loadMovement = async () => {
    try {
      setLoading(true);
      const movement = await inventoryMovementService.getMovementById(id);
      setFormData({
        itemId: movement.itemId || '',
        quantity: movement.quantity || '',
        movementType: movement.movementType || 'IN',
        reason: movement.reason || '',
        notes: movement.notes || '',
        referenceNumber: movement.referenceNumber || '',
        referenceType: movement.referenceType || 'INVOICE',
        requiresApproval: movement.requiresApproval || false,
        performedBy: movement.performedBy || '',
        tripId: movement.tripId || '',
        fuelSlipId: movement.fuelSlipId || '',
      });
    } catch (err) {
      console.error('Error loading movement:', err);
      setError('Failed to load movement data');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSwitchChange = (e) => {
    setFormData(prev => ({ ...prev, requiresApproval: e.target.checked }));
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.itemId) errors.itemId = 'Please select an item';
    if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
      errors.quantity = 'Please enter a valid quantity';
    }
    if (!formData.movementType) errors.movementType = 'Please select movement type';
    if (!formData.reason) errors.reason = 'Please provide a reason';
    
    // Invoice reference required for Stock In
    if (formData.movementType === 'IN' && !formData.referenceNumber) {
      errors.referenceNumber = 'Invoice/Purchase Order number is required for Stock In';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      const firstError = Object.keys(formErrors)[0];
      const element = document.querySelector(`[name="${firstError}"]`);
      if (element) element.focus();
      return;
    }

    // Show confirmation dialog for movements requiring approval
    if (formData.requiresApproval || formData.movementType === 'OUT' || formData.movementType === 'ADJUSTMENT') {
      setShowConfirmDialog(true);
      return;
    }

    // Stock In with reference is auto-approved
    await submitMovement(false);
  };

  const submitMovement = async (approved = false) => {
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        ...formData,
        quantity: parseFloat(formData.quantity),
        performedBy: formData.performedBy || 'System',
        requiresApproval: formData.requiresApproval || 
                          formData.movementType === 'OUT' || 
                          formData.movementType === 'ADJUSTMENT',
        approvalStatus: 'PENDING',
      };

      // If approved now, set approval details
      if (approved) {
        payload.approvalStatus = 'APPROVED';
        payload.approvedBy = 'Current User';
        payload.approvedAt = new Date().toISOString();
      }

      const response = await inventoryMovementService.recordMovement(payload);
      
      if (payload.approvalStatus === 'APPROVED') {
        setSuccess('✅ Stock movement created and approved successfully!');
      } else {
        setSuccess('✅ Stock movement created and submitted for approval!');
      }
      
      setTimeout(() => {
        navigate('/inventory/movements');
      }, 2000);
    } catch (err) {
      console.error('Error recording movement:', err);
      setError(err.message || 'Failed to record stock movement');
    } finally {
      setSubmitting(false);
      setShowConfirmDialog(false);
    }
  };

  const getItemName = (itemId) => {
    const item = items.find(i => i.id === parseInt(itemId));
    return item ? item.name : 'Unknown Item';
  };

  const getSelectedItem = () => {
    return items.find(i => i.id === parseInt(formData.itemId));
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress size={40} />
        <Typography sx={{ ml: 2 }}>Loading...</Typography>
      </Box>
    );
  }

  const selectedItem = getSelectedItem();

  return (
    <Box sx={{ p: { xs: 1, sm: 1.5, md: 2 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Typography variant="h6" fontWeight="600" sx={{ fontSize: '1rem' }}>
            <Inventory sx={{ mr: 0.5, verticalAlign: 'middle', fontSize: '1.2rem' }} />
            Record Stock Movement
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Record inventory stock movements with approval workflow
          </Typography>
        </Box>
        <Button
          startIcon={<ArrowBack sx={{ fontSize: '0.9rem' }} />}
          onClick={() => navigate('/inventory/movements')}
          size="small"
          sx={{ fontSize: '0.75rem' }}
        >
          Back
        </Button>
      </Box>

      <Paper sx={{ p: { xs: 1.5, sm: 2 } }}>
        <form onSubmit={handleSubmit}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
              {success}
            </Alert>
          )}

          <Grid container spacing={2}>
            {/* Item Selection */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small" error={!!formErrors.itemId}>
                <InputLabel sx={{ fontSize: '0.75rem' }}>Item *</InputLabel>
                <Select
                  name="itemId"
                  value={formData.itemId}
                  onChange={handleChange}
                  label="Item *"
                  sx={{ fontSize: '0.8rem' }}
                >
                  <MenuItem value="" sx={{ fontSize: '0.8rem' }}>Select Item</MenuItem>
                  {items.map(item => (
                    <MenuItem key={item.id} value={item.id} sx={{ fontSize: '0.8rem' }}>
                      {item.name} ({item.sku || `#${item.id}`}) - {item.quantity || 0} {item.unitOfMeasure || 'units'}
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.itemId && <FormHelperText sx={{ fontSize: '0.65rem' }}>{formErrors.itemId}</FormHelperText>}
              </FormControl>
            </Grid>

            {/* Movement Type */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small" error={!!formErrors.movementType}>
                <InputLabel sx={{ fontSize: '0.75rem' }}>Movement Type *</InputLabel>
                <Select
                  name="movementType"
                  value={formData.movementType}
                  onChange={handleChange}
                  label="Movement Type *"
                  sx={{ fontSize: '0.8rem' }}
                >
                  {MOVEMENT_TYPES.map(type => (
                    <MenuItem key={type.value} value={type.value} sx={{ fontSize: '0.8rem' }}>
                      <Chip
                        label={type.label}
                        color={type.color}
                        size="small"
                        sx={{ height: 20, fontSize: '0.6rem' }}
                      />
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.movementType && <FormHelperText sx={{ fontSize: '0.65rem' }}>{formErrors.movementType}</FormHelperText>}
              </FormControl>
            </Grid>

            {/* Quantity */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Quantity *"
                name="quantity"
                type="number"
                value={formData.quantity}
                onChange={handleChange}
                size="small"
                error={!!formErrors.quantity}
                helperText={formErrors.quantity}
                sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
                InputProps={{
                  endAdornment: selectedItem ? (
                    <InputAdornment position="end" sx={{ fontSize: '0.7rem' }}>
                      {selectedItem.unitOfMeasure || 'units'}
                    </InputAdornment>
                  ) : null,
                }}
              />
            </Grid>

            {/* Reason */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Reason *"
                name="reason"
                value={formData.reason}
                onChange={handleChange}
                size="small"
                error={!!formErrors.reason}
                helperText={formErrors.reason}
                sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
                placeholder="e.g., Restock, Usage, Write-off"
              />
            </Grid>

            {/* Reference Type */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ fontSize: '0.75rem' }}>Reference Type</InputLabel>
                <Select
                  name="referenceType"
                  value={formData.referenceType}
                  onChange={handleChange}
                  label="Reference Type"
                  sx={{ fontSize: '0.8rem' }}
                >
                  {REFERENCE_TYPES.map(type => (
                    <MenuItem key={type.value} value={type.value} sx={{ fontSize: '0.8rem' }}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Reference Number - Auto-generated */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Reference Number"
                name="referenceNumber"
                value={formData.referenceNumber}
                onChange={handleChange}
                size="small"
                error={!!formErrors.referenceNumber}
                helperText={formErrors.referenceNumber || 'Auto-generated reference number'}
                sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
                InputProps={{
                  startAdornment: formData.movementType === 'IN' ? (
                    <InputAdornment position="start"><Receipt sx={{ fontSize: '0.9rem' }} /></InputAdornment>
                  ) : null,
                  readOnly: true,
                }}
              />
            </Grid>

            {/* Performed By */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Performed By"
                name="performedBy"
                value={formData.performedBy}
                onChange={handleChange}
                size="small"
                sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><Person sx={{ fontSize: '0.9rem' }} /></InputAdornment>,
                }}
              />
            </Grid>

            {/* Notes */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                multiline
                rows={2}
                size="small"
                sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
                placeholder="Additional notes about this movement..."
              />
            </Grid>

            {/* Approval Requirements */}
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Box sx={{ bgcolor: '#f8f9fa', p: 2, borderRadius: 1 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontSize: '0.85rem', fontWeight: 600 }}>
                      <Warning sx={{ fontSize: '0.9rem', mr: 0.5, verticalAlign: 'middle' }} />
                      Approval Required
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                      {formData.movementType === 'IN' 
                        ? 'Stock In with reference is auto-approved'
                        : 'Stock Out and Adjustments require manager approval'
                      }
                    </Typography>
                  </Box>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.requiresApproval || 
                                formData.movementType === 'OUT' || 
                                formData.movementType === 'ADJUSTMENT'}
                        onChange={handleSwitchChange}
                        disabled={formData.movementType === 'OUT' || formData.movementType === 'ADJUSTMENT'}
                        color="warning"
                      />
                    }
                    label={
                      <Chip
                        label={formData.requiresApproval || 
                               formData.movementType === 'OUT' || 
                               formData.movementType === 'ADJUSTMENT' ? 'Pending Approval' : 'Auto-Approved'}
                        size="small"
                        color={formData.requiresApproval || 
                               formData.movementType === 'OUT' || 
                               formData.movementType === 'ADJUSTMENT' ? 'warning' : 'success'}
                        sx={{ height: 20, fontSize: '0.6rem' }}
                      />
                    }
                    sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.75rem' } }}
                  />
                </Stack>
                {formErrors.requiresApproval && (
                  <Typography color="error" variant="caption" sx={{ fontSize: '0.65rem' }}>
                    {formErrors.requiresApproval}
                  </Typography>
                )}
              </Box>
            </Grid>

            {/* Submit Buttons */}
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <Button
                  type="submit"
                  variant="contained"
                  size="medium"
                  disabled={submitting}
                  startIcon={submitting ? <CircularProgress size={18} /> : <Save sx={{ fontSize: '0.9rem' }} />}
                  sx={{ minWidth: 180, fontSize: '0.8rem' }}
                >
                  {submitting ? 'Saving...' : 'Save Movement'}
                </Button>
                <Button
                  variant="outlined"
                  size="medium"
                  onClick={() => navigate('/inventory/movements')}
                  sx={{ fontSize: '0.8rem' }}
                >
                  Cancel
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </form>
      </Paper>

      {/* Approval Confirmation Dialog */}
      <Dialog
        open={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 1.5 } }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box display="flex" alignItems="center" gap={1}>
            <Warning color="warning" sx={{ fontSize: '1.2rem' }} />
            <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
              Approval Required
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <Alert severity="warning" sx={{ mb: 2, fontSize: '0.8rem' }}>
              This movement requires approval. You can:
              <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                <li>Submit for approval (manager will approve later)</li>
                <li>Approve now (if you have permission)</li>
              </ul>
            </Alert>
            <Stack spacing={1.5}>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                  Item
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 500 }}>
                  {getItemName(formData.itemId)}
                </Typography>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                  Type
                </Typography>
                <Chip
                  label={MOVEMENT_TYPES.find(t => t.value === formData.movementType)?.label || formData.movementType}
                  color={MOVEMENT_TYPES.find(t => t.value === formData.movementType)?.color || 'default'}
                  size="small"
                  sx={{ height: 20, fontSize: '0.6rem' }}
                />
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                  Quantity
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                  {formData.quantity} {selectedItem?.unitOfMeasure || 'units'}
                </Typography>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                  Reason
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                  {formData.reason}
                </Typography>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                  Reference
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                  {formData.referenceNumber}
                </Typography>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                  Status
                </Typography>
                <Chip
                  label="Pending Approval"
                  color="warning"
                  size="small"
                  icon={<Pending sx={{ fontSize: '0.7rem' }} />}
                  sx={{ height: 20, fontSize: '0.6rem' }}
                />
              </Box>
            </Stack>
          </Box>
        </DialogContent>
        <DialogActions sx={{ flexDirection: 'column', gap: 1, p: 2.5, pt: 1 }}>
          <Stack direction="row" spacing={1} sx={{ width: '100%' }}>
            <Button
              onClick={() => setShowConfirmDialog(false)}
              variant="outlined"
              size="small"
              sx={{ fontSize: '0.8rem', flex: 1 }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => submitMovement(false)}
              variant="contained"
              color="warning"
              size="small"
              sx={{ fontSize: '0.8rem', flex: 1 }}
              startIcon={<Pending sx={{ fontSize: '0.9rem' }} />}
            >
              Submit for Approval
            </Button>
          </Stack>
          <Button
            onClick={() => submitMovement(true)}
            variant="contained"
            color="success"
            size="small"
            sx={{ fontSize: '0.8rem', width: '100%' }}
            startIcon={<CheckCircle sx={{ fontSize: '0.9rem' }} />}
          >
            Approve Now
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StockMovementForm;
