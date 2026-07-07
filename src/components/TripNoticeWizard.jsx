// src/components/TripNoticeWizard.jsx
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Paper,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  RadioGroup,
  FormControlLabel,
  Radio,
  Chip,
  Alert,
  Stack,
  Divider,
  IconButton,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  InputAdornment,
  LinearProgress,
} from '@mui/material';
import {
  Close as CloseIcon,
  Warning as WarningIcon,
  Receipt as VoucherIcon,
  Money as MoneyIcon,
  CarCrash as AccidentIcon,
  TireRepair as TyreIcon,
  LocalGasStation as FuelIcon,
  FoodBank as FoodIcon,
  Toll as TollIcon,
  Verified as VerifiedIcon,
  ArrowForward as ArrowForwardIcon,
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Payment as PaymentIcon,
  Description as DescriptionIcon,
} from '@mui/icons-material';
import { tripService } from '../services/tripService';

// ================================
// Constants & Configurations
// ================================

const NOTICE_TYPES = {
  INCIDENT: 'INCIDENT',
  VOUCHER: 'VOUCHER',
  ADVERSE_EVENT: 'ADVERSE_EVENT',
};

const NOTICE_TYPE_CONFIG = {
  INCIDENT: {
    label: 'Incident',
    icon: WarningIcon,
    color: '#d32f2f',
    bgColor: '#ffebee',
    description: 'Report accidents, breakdowns, or other incidents'
  },
  VOUCHER: {
    label: 'Voucher',
    icon: VoucherIcon,
    color: '#2e7d32',
    bgColor: '#e8f5e9',
    description: 'Record expenses for fuel, tolls, food, etc.'
  },
  ADVERSE_EVENT: {
    label: 'Adverse Event',
    icon: MoneyIcon,
    color: '#ed6c02',
    bgColor: '#fff3e0',
    description: 'Financial events requiring payment or receipt'
  }
};

const INCIDENT_SUBTYPES = {
  ACCIDENT: { label: 'Accident', icon: AccidentIcon, requiresPayment: true },
  TYRE_BURST: { label: 'Tyre Burst', icon: TyreIcon, requiresPayment: true },
  BREAKDOWN: { label: 'Vehicle Breakdown', icon: ErrorIcon, requiresPayment: true },
  TRAFFIC: { label: 'Traffic Delay', icon: WarningIcon, requiresPayment: false },
  WEATHER: { label: 'Weather Conditions', icon: InfoIcon, requiresPayment: false },
  HEALTH: { label: 'Health/Medical', icon: ErrorIcon, requiresPayment: true },
  OTHER: { label: 'Other', icon: InfoIcon, requiresPayment: false }
};

const VOUCHER_SUBTYPES = {
  FUEL: { label: 'Fuel', icon: FuelIcon, defaultAmount: 0 },
  TOLL: { label: 'Toll Fees', icon: TollIcon, defaultAmount: 0 },
  FOOD: { label: 'Food/Mess', icon: FoodIcon, defaultAmount: 0 },
  ACCOMMODATION: { label: 'Accommodation', icon: DescriptionIcon, defaultAmount: 0 },
  MAINTENANCE: { label: 'Maintenance', icon: TyreIcon, defaultAmount: 0 },
  OTHER: { label: 'Other', icon: VoucherIcon, defaultAmount: 0 }
};

const ADVERSE_EVENT_TYPES = {
  LOAD_DAMAGE: { label: 'Load Damage', icon: ErrorIcon, direction: 'OUT' },
  DEMURRAGE: { label: 'Demurrage', icon: MoneyIcon, direction: 'IN' },
  DETENTION: { label: 'Detention', icon: MoneyIcon, direction: 'IN' },
  TOLL_REFUND: { label: 'Toll Refund', icon: TollIcon, direction: 'IN' },
  FINES: { label: 'Fines/Penalties', icon: WarningIcon, direction: 'OUT' },
  OTHER: { label: 'Other', icon: MoneyIcon, direction: 'OUT' }
};

const PAYMENT_METHODS = ['Cash', 'Fuel Card', 'Company Card', 'Personal Card', 'E-Wallet', 'Other'];

const PAYMENT_DIRECTIONS = {
  IN: { label: 'Payment Received', color: 'success' },
  OUT: { label: 'Payment Made', color: 'error' }
};

// ================================
// Step Components
// ================================

// Step 1: Select Notice Type
const StepSelectType = ({ value, onChange }) => {
  return (
    <Box sx={{ py: 1 }}>
      <Typography variant="subtitle2" gutterBottom sx={{ fontSize: '0.85rem' }}>
        What type of notice would you like to record?
      </Typography>
      <Grid container spacing={1.5}>
        {Object.entries(NOTICE_TYPE_CONFIG).map(([key, config]) => {
          const Icon = config.icon;
          const isSelected = value === key;
          return (
            <Grid item xs={12} sm={4} key={key}>
              <Card
                sx={{
                  cursor: 'pointer',
                  border: isSelected ? `2px solid ${config.color}` : '1px solid #e0e0e0',
                  bgcolor: isSelected ? config.bgColor : 'white',
                  transition: 'all 0.2s',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 3,
                  },
                }}
                onClick={() => onChange(key)}
              >
                <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Icon sx={{ color: config.color, fontSize: '1.5rem' }} />
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontSize: '0.8rem' }}>
                        {config.label}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
                        {config.description}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};

// Step 2: Subtype Selection
const StepSelectSubtype = ({ type, value, onChange, onSubtypeChange }) => {
  const getSubtypes = () => {
    switch (type) {
      case NOTICE_TYPES.INCIDENT:
        return INCIDENT_SUBTYPES;
      case NOTICE_TYPES.VOUCHER:
        return VOUCHER_SUBTYPES;
      case NOTICE_TYPES.ADVERSE_EVENT:
        return ADVERSE_EVENT_TYPES;
      default:
        return {};
    }
  };

  const subtypes = getSubtypes();

  return (
    <Box sx={{ py: 1 }}>
      <Typography variant="subtitle2" gutterBottom sx={{ fontSize: '0.85rem' }}>
        Select the specific type
      </Typography>
      <Grid container spacing={1}>
        {Object.entries(subtypes).map(([key, config]) => {
          const Icon = config.icon;
          const isSelected = value === key;
          return (
            <Grid item xs={6} sm={4} key={key}>
              <Card
                sx={{
                  cursor: 'pointer',
                  border: isSelected ? '2px solid #1976d2' : '1px solid #e0e0e0',
                  bgcolor: isSelected ? '#e3f2fd' : 'white',
                  transition: 'all 0.2s',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 2,
                  },
                }}
                onClick={() => {
                  onChange(key);
                  if (onSubtypeChange) onSubtypeChange(key);
                }}
              >
                <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                  <Stack alignItems="center" spacing={0.5}>
                    <Icon sx={{ fontSize: '1.2rem', color: isSelected ? '#1976d2' : 'text.secondary' }} />
                    <Typography variant="caption" sx={{ fontSize: '0.6rem', textAlign: 'center' }}>
                      {config.label}
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};

// Step 3: Details & Payment
const StepDetails = ({ 
  type, 
  subtype, 
  details, 
  onChange,
  requiresPayment,
  direction,
}) => {
  const config = type === NOTICE_TYPES.INCIDENT 
    ? INCIDENT_SUBTYPES[subtype] 
    : type === NOTICE_TYPES.VOUCHER 
    ? VOUCHER_SUBTYPES[subtype] 
    : ADVERSE_EVENT_TYPES[subtype];

  const showPayment = (type === NOTICE_TYPES.INCIDENT && config?.requiresPayment) ||
                      type === NOTICE_TYPES.VOUCHER ||
                      type === NOTICE_TYPES.ADVERSE_EVENT;

  return (
    <Box sx={{ py: 1 }}>
      <Grid container spacing={2}>
        {/* Description */}
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Description"
            name="description"
            multiline
            rows={3}
            value={details.description || ''}
            onChange={(e) => onChange('description', e.target.value)}
            placeholder="Describe what happened..."
            sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
          />
        </Grid>

        {/* Location */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Location"
            name="location"
            value={details.location || ''}
            onChange={(e) => onChange('location', e.target.value)}
            placeholder="Where did this occur?"
            sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
          />
        </Grid>

        {/* Severity (for Incidents) */}
        {type === NOTICE_TYPES.INCIDENT && (
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel sx={{ fontSize: '0.75rem' }}>Severity</InputLabel>
              <Select
                value={details.severity || 'MEDIUM'}
                onChange={(e) => onChange('severity', e.target.value)}
                label="Severity"
                sx={{ fontSize: '0.8rem' }}
              >
                <MenuItem value="LOW" sx={{ fontSize: '0.8rem' }}>Low</MenuItem>
                <MenuItem value="MEDIUM" sx={{ fontSize: '0.8rem' }}>Medium</MenuItem>
                <MenuItem value="HIGH" sx={{ fontSize: '0.8rem' }}>High</MenuItem>
                <MenuItem value="CRITICAL" sx={{ fontSize: '0.8rem' }}>Critical</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        )}

        {/* Payment Section */}
        {showPayment && (
          <>
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }}>
                <Chip label="Payment Details" size="small" />
              </Divider>
            </Grid>

            {/* Direction (for Adverse Events) */}
            {type === NOTICE_TYPES.ADVERSE_EVENT && (
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel sx={{ fontSize: '0.75rem' }}>Direction</InputLabel>
                  <Select
                    value={details.direction || 'OUT'}
                    onChange={(e) => onChange('direction', e.target.value)}
                    label="Direction"
                    sx={{ fontSize: '0.8rem' }}
                  >
                    <MenuItem value="IN" sx={{ fontSize: '0.8rem' }}>
                      <Chip label="Payment Received" color="success" size="small" />
                    </MenuItem>
                    <MenuItem value="OUT" sx={{ fontSize: '0.8rem' }}>
                      <Chip label="Payment Made" color="error" size="small" />
                    </MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            )}

            {/* Amount */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Amount (ZAR)"
                name="amount"
                type="number"
                value={details.amount || ''}
                onChange={(e) => onChange('amount', parseFloat(e.target.value) || 0)}
                sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
                InputProps={{
                  startAdornment: <InputAdornment position="start">R</InputAdornment>,
                }}
              />
            </Grid>

            {/* Payment Method */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel sx={{ fontSize: '0.75rem' }}>Payment Method</InputLabel>
                <Select
                  value={details.paymentMethod || ''}
                  onChange={(e) => onChange('paymentMethod', e.target.value)}
                  label="Payment Method"
                  sx={{ fontSize: '0.8rem' }}
                >
                  {PAYMENT_METHODS.map(method => (
                    <MenuItem key={method} value={method} sx={{ fontSize: '0.8rem' }}>
                      {method}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Reference Number */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Reference Number"
                name="reference"
                value={details.reference || ''}
                onChange={(e) => onChange('reference', e.target.value)}
                placeholder="Invoice/Receipt/Ticket number"
                sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
              />
            </Grid>
          </>
        )}

        {/* Requires Assistance (for Incidents) */}
        {type === NOTICE_TYPES.INCIDENT && (
          <Grid item xs={12}>
            <FormControl component="fieldset">
              <Typography variant="subtitle2" sx={{ fontSize: '0.8rem', mb: 1 }}>
                Does this require immediate assistance?
              </Typography>
              <RadioGroup
                row
                value={details.requiresAssistance ? 'YES' : 'NO'}
                onChange={(e) => onChange('requiresAssistance', e.target.value === 'YES')}
              >
                <FormControlLabel value="NO" control={<Radio size="small" />} label="No" />
                <FormControlLabel value="YES" control={<Radio size="small" />} label="Yes - Urgent" />
              </RadioGroup>
            </FormControl>
          </Grid>
        )}

        {/* Additional Notes */}
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Additional Notes"
            name="notes"
            multiline
            rows={2}
            value={details.notes || ''}
            onChange={(e) => onChange('notes', e.target.value)}
            placeholder="Any additional information..."
            sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

// Step 4: Review & Confirm
const StepReview = ({ 
  type, 
  subtype, 
  details, 
  trip, 
  onConfirm,
  submitting,
}) => {
  const typeConfig = NOTICE_TYPE_CONFIG[type];
  const TypeIcon = typeConfig?.icon || WarningIcon;

  const getSubtypeLabel = () => {
    const config = type === NOTICE_TYPES.INCIDENT 
      ? INCIDENT_SUBTYPES[subtype] 
      : type === NOTICE_TYPES.VOUCHER 
      ? VOUCHER_SUBTYPES[subtype] 
      : ADVERSE_EVENT_TYPES[subtype];
    return config?.label || subtype;
  };

  return (
    <Box sx={{ py: 1 }}>
      <Alert severity="info" sx={{ mb: 2, fontSize: '0.8rem' }}>
        Please review the details before submitting.
      </Alert>

      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
          <Stack spacing={1.5}>
            {/* Type & Subtype */}
            <Box display="flex" alignItems="center" gap={1}>
              <TypeIcon sx={{ color: typeConfig?.color, fontSize: '1.2rem' }} />
              <Typography variant="subtitle2" sx={{ fontSize: '0.85rem' }}>
                {typeConfig?.label}: {getSubtypeLabel()}
              </Typography>
            </Box>

            <Divider />

            {/* Trip Info */}
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                Trip Number
              </Typography>
              <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                #{trip?.tripNumber || 'N/A'}
              </Typography>
            </Box>

            {/* Description */}
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                Description
              </Typography>
              <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                {details.description || 'No description provided'}
              </Typography>
            </Box>

            {/* Location */}
            {details.location && (
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                  Location
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                  {details.location}
                </Typography>
              </Box>
            )}

            {/* Severity */}
            {details.severity && (
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                  Severity
                </Typography>
                <Chip 
                  label={details.severity} 
                  size="small" 
                  color={details.severity === 'CRITICAL' ? 'error' : details.severity === 'HIGH' ? 'warning' : 'info'}
                  sx={{ fontSize: '0.6rem', height: 20 }}
                />
              </Box>
            )}

            {/* Payment Details */}
            {(details.amount > 0 || details.paymentMethod) && (
              <>
                <Divider />
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                    Payment Details
                  </Typography>
                  <Stack direction="row" spacing={2} sx={{ mt: 0.5 }}>
                    {details.amount > 0 && (
                      <Chip 
                        label={`R ${details.amount.toFixed(2)}`} 
                        size="small" 
                        color="primary"
                        sx={{ fontSize: '0.6rem', height: 20 }}
                      />
                    )}
                    {details.paymentMethod && (
                      <Chip 
                        label={details.paymentMethod} 
                        size="small" 
                        variant="outlined"
                        sx={{ fontSize: '0.6rem', height: 20 }}
                      />
                    )}
                    {type === NOTICE_TYPES.ADVERSE_EVENT && details.direction && (
                      <Chip 
                        label={details.direction === 'IN' ? 'Received' : 'Paid'} 
                        size="small" 
                        color={details.direction === 'IN' ? 'success' : 'error'}
                        sx={{ fontSize: '0.6rem', height: 20 }}
                      />
                    )}
                  </Stack>
                </Box>
              </>
            )}

            {/* Requires Assistance */}
            {details.requiresAssistance && (
              <Alert severity="warning" sx={{ fontSize: '0.7rem', py: 0.5 }}>
                ⚠️ This incident requires immediate assistance!
              </Alert>
            )}
          </Stack>
        </CardContent>
      </Card>

      <Button
        fullWidth
        variant="contained"
        color="primary"
        size="large"
        startIcon={submitting ? <CircularProgress size={20} /> : <CheckCircleIcon />}
        onClick={onConfirm}
        disabled={submitting}
        sx={{ py: 1.5 }}
      >
        {submitting ? 'Submitting...' : 'Submit Notice'}
      </Button>
    </Box>
  );
};

// Step 5: Success
const StepSuccess = ({ type, subtype, details, onClose }) => {
  const typeConfig = NOTICE_TYPE_CONFIG[type];
  const Icon = typeConfig?.icon || CheckCircleIcon;

  return (
    <Box sx={{ textAlign: 'center', py: 3 }}>
      <Icon sx={{ fontSize: '4rem', color: 'success.main' }} />
      <Typography variant="h6" sx={{ mt: 2, fontSize: '1rem' }}>
        Notice Submitted Successfully!
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontSize: '0.8rem' }}>
        Your {typeConfig?.label?.toLowerCase()} has been recorded for trip #{details.tripNumber}
      </Typography>
      <Button
        variant="contained"
        onClick={onClose}
        sx={{ mt: 3 }}
      >
        Close
      </Button>
    </Box>
  );
};

// ================================
// Main Wizard Component
// ================================

const TripNoticeWizard = ({
  open,
  onClose,
  trip,
  initialType = null,
  initialSubtype = null,
  onSuccess,
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [selectedType, setSelectedType] = useState(initialType || '');
  const [selectedSubtype, setSelectedSubtype] = useState(initialSubtype || '');
  const [details, setDetails] = useState({
    description: '',
    location: '',
    severity: 'MEDIUM',
    amount: 0,
    paymentMethod: '',
    reference: '',
    direction: 'OUT',
    requiresAssistance: false,
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setActiveStep(0);
      setSelectedType(initialType || '');
      setSelectedSubtype(initialSubtype || '');
      setDetails({
        description: '',
        location: '',
        severity: 'MEDIUM',
        amount: 0,
        paymentMethod: '',
        reference: '',
        direction: 'OUT',
        requiresAssistance: false,
        notes: '',
      });
      setError('');
      setSuccess(false);
      setSubmitting(false);
    }
  }, [open, initialType, initialSubtype]);

  const handleNext = () => {
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleDetailChange = (field, value) => {
    setDetails((prev) => ({ ...prev, [field]: value }));
  };

  const handleClose = () => {
    setActiveStep(0);
    setError('');
    setSuccess(false);
    onClose();
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');

    try {
      const payload = {
        incidentType: selectedType === NOTICE_TYPES.INCIDENT ? selectedSubtype : selectedSubtype,
        severity: details.severity,
        description: details.description,
        location: details.location || undefined,
        requiresAssistance: details.requiresAssistance || false,
        reportedAt: new Date().toISOString(),
      };

      // Add voucher-specific fields
      if (selectedType === NOTICE_TYPES.VOUCHER) {
        payload.voucherType = selectedSubtype;
        payload.amount = details.amount;
        payload.paymentMethod = details.paymentMethod;
        payload.reference = details.reference;
        payload.additionalNotes = details.notes;
      }

      // Add adverse event fields
      if (selectedType === NOTICE_TYPES.ADVERSE_EVENT) {
        payload.eventType = selectedSubtype;
        payload.amount = details.amount;
        payload.direction = details.direction;
        payload.paymentMethod = details.paymentMethod;
        payload.reference = details.reference;
        payload.additionalNotes = details.notes;
      }

      await tripService.reportIncident(trip.id, payload);
      
      setSuccess(true);
      setActiveStep(4);
      
      if (onSuccess) {
        onSuccess(payload);
      }
    } catch (err) {
      console.error('Error submitting notice:', err);
      setError(err.message || 'Failed to submit notice');
    } finally {
      setSubmitting(false);
    }
  };

  // Validation
  const canProceed = () => {
    switch (activeStep) {
      case 0:
        return !!selectedType;
      case 1:
        return !!selectedSubtype;
      case 2:
        return details.description?.trim().length > 0;
      case 3:
        return true;
      default:
        return true;
    }
  };

  // Get step titles
  const getStepTitle = (index) => {
    const titles = [
      'Select Type',
      'Select Subtype',
      'Enter Details',
      'Review & Submit',
    ];
    if (success) return 'Complete';
    return titles[index] || '';
  };

  const renderStep = () => {
    if (success) {
      return (
        <StepSuccess
          type={selectedType}
          subtype={selectedSubtype}
          details={{ ...details, tripNumber: trip?.tripNumber }}
          onClose={handleClose}
        />
      );
    }

    switch (activeStep) {
      case 0:
        return (
          <StepSelectType
            value={selectedType}
            onChange={(value) => {
              setSelectedType(value);
              setSelectedSubtype('');
            }}
          />
        );
      case 1:
        return (
          <StepSelectSubtype
            type={selectedType}
            value={selectedSubtype}
            onChange={setSelectedSubtype}
          />
        );
      case 2:
        return (
          <StepDetails
            type={selectedType}
            subtype={selectedSubtype}
            details={details}
            onChange={handleDetailChange}
            requiresPayment={
              selectedType === NOTICE_TYPES.VOUCHER ||
              (selectedType === NOTICE_TYPES.INCIDENT && 
                INCIDENT_SUBTYPES[selectedSubtype]?.requiresPayment) ||
              selectedType === NOTICE_TYPES.ADVERSE_EVENT
            }
            direction={details.direction}
          />
        );
      case 3:
        return (
          <StepReview
            type={selectedType}
            subtype={selectedSubtype}
            details={details}
            trip={trip}
            onConfirm={handleSubmit}
            submitting={submitting}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          minHeight: '50vh',
          maxHeight: '90vh',
        }
      }}
    >
      <DialogTitle sx={{ 
        borderBottom: '1px solid #e0e0e0', 
        p: 2,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <Box>
          <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
            {success ? 'Notice Submitted' : 'New Trip Notice'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {trip?.tripNumber ? `Trip #${trip.tripNumber}` : ''}
          </Typography>
        </Box>
        <IconButton size="small" onClick={handleClose}>
          <CloseIcon sx={{ fontSize: '1.2rem' }} />
        </IconButton>
      </DialogTitle>

      {!success && (
        <Box sx={{ px: 3, pt: 2 }}>
          <Stepper activeStep={activeStep} orientation="horizontal">
            {[0, 1, 2, 3].map((index) => (
              <Step key={index}>
                <StepLabel StepIconProps={{ sx: { fontSize: '0.8rem' } }}>
                  <Typography sx={{ fontSize: '0.65rem' }}>
                    {getStepTitle(index)}
                  </Typography>
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>
      )}

      <DialogContent sx={{ p: 3, overflowY: 'auto' }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2, fontSize: '0.8rem' }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        {renderStep()}
      </DialogContent>

      {!success && (
        <DialogActions sx={{ p: 2, borderTop: '1px solid #e0e0e0' }}>
          <Button 
            onClick={handleClose}
            disabled={submitting}
            sx={{ fontSize: '0.75rem' }}
          >
            Cancel
          </Button>
          <Box sx={{ flex: 1 }} />
          {activeStep > 0 && (
            <Button 
              onClick={handleBack}
              disabled={submitting}
              startIcon={<ArrowBackIcon />}
              sx={{ fontSize: '0.75rem' }}
            >
              Back
            </Button>
          )}
          {activeStep < 3 ? (
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={!canProceed() || submitting}
              endIcon={<ArrowForwardIcon />}
              sx={{ fontSize: '0.75rem' }}
            >
              Next
            </Button>
          ) : activeStep === 3 && (
            <Button
              variant="contained"
              color="success"
              onClick={handleSubmit}
              disabled={submitting}
              startIcon={submitting ? <CircularProgress size={18} /> : <CheckCircleIcon />}
              sx={{ fontSize: '0.75rem' }}
            >
              {submitting ? 'Submitting...' : 'Submit Notice'}
            </Button>
          )}
        </DialogActions>
      )}
    </Dialog>
  );
};

export default TripNoticeWizard;
