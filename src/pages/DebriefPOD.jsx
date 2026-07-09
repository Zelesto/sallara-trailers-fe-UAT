// src/pages/DebriefPOD.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  Alert,
  CircularProgress,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Stack,
  Divider,
  Chip,
  Card,
  CardContent,
  Rating,
  LinearProgress,
} from '@mui/material';
import {
  ArrowBack,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Pending as PendingIcon,
  Verified as VerifiedIcon,
  Assignment as AssignmentIcon,
  Comment as CommentIcon,
} from '@mui/icons-material';
import { podService } from '../services/podService';

const STATUS_OPTIONS = [
  { value: 'DELIVERED', label: 'Delivered', color: 'success' },
  { value: 'VERIFIED', label: 'Verified', color: 'info' },
  { value: 'REJECTED', label: 'Rejected', color: 'error' },
  { value: 'PENDING', label: 'Pending', color: 'warning' },
];

const DebriefPOD = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pod, setPod] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [debriefProgress, setDebriefProgress] = useState(0);

  const [debriefData, setDebriefData] = useState({
    status: 'DELIVERED',
    notes: '',
    receivedBy: '',
    signature: '',
    qualityRating: 4,
    issuesFound: [],
    additionalInfo: '',
    deliveryCondition: 'Good',
    debriefNotes: '',
  });

  useEffect(() => {
    loadPod();
  }, [id]);

  const loadPod = async () => {
    setLoading(true);
    try {
      const data = await podService.getPodById(id);
      setPod(data);
      
      // Pre-fill debrief data
      setDebriefData(prev => ({
        ...prev,
        status: data.status === 'PENDING' ? 'DELIVERED' : data.status,
        notes: data.notes || '',
        receivedBy: data.receivedBy || data.uploadedBy || '',
      }));
      
      setError('');
    } catch (err) {
      setError('Failed to load POD details');
      console.error('Error loading POD:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setDebriefData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleRatingChange = (event, newValue) => {
    setDebriefData(prev => ({ ...prev, qualityRating: newValue }));
  };

  const toggleIssue = (issue) => {
    setDebriefData(prev => {
      const issues = prev.issuesFound || [];
      if (issues.includes(issue)) {
        return { ...prev, issuesFound: issues.filter(i => i !== issue) };
      } else {
        return { ...prev, issuesFound: [...issues, issue] };
      }
    });
  };

  const validateForm = () => {
    const errors = {};
    if (!debriefData.status) {
      errors.status = 'Please select a status';
    }
    if (debriefData.status === 'REJECTED' && !debriefData.debriefNotes) {
      errors.debriefNotes = 'Please provide reason for rejection';
    }
    if (!debriefData.receivedBy.trim()) {
      errors.receivedBy = 'Received by name is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) {
      const firstErrorField = Object.keys(formErrors)[0];
      const element = document.querySelector(`[name="${firstErrorField}"]`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.focus();
      }
      return;
    }

    setSubmitting(true);
    try {
      // Simulate debrief processing
      setDebriefProgress(20);
      
      const debriefPayload = {
        ...debriefData,
        debriefedAt: new Date().toISOString(),
        debriefedBy: 'Current User',
        podId: id,
        previousStatus: pod?.status,
      };

      const result = await podService.debriefPOD(id, debriefPayload);
      
      setDebriefProgress(100);
      setSuccess('POD debrief completed successfully!');
      
      console.log('POD debriefed:', result);

      setTimeout(() => {
        navigate('/pods');
      }, 2000);
    } catch (err) {
      console.error('Error debriefing POD:', err);
      setError(err.message || 'Failed to debrief POD');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusInfo = (status) => {
    const map = {
      PENDING: { label: 'Pending', icon: PendingIcon, color: '#ed6c02' },
      DELIVERED: { label: 'Delivered', icon: CheckCircleIcon, color: '#2e7d32' },
      VERIFIED: { label: 'Verified', icon: VerifiedIcon, color: '#0288d1' },
      REJECTED: { label: 'Rejected', icon: CancelIcon, color: '#d32f2f' },
    };
    return map[status] || map.PENDING;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress size={40} />
        <Typography sx={{ ml: 2, fontSize: '0.9rem' }}>Loading POD details...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error" sx={{ fontSize: '0.8rem' }}>{error}</Alert>
      </Box>
    );
  }

  if (!pod) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="warning" sx={{ fontSize: '0.8rem' }}>POD not found</Alert>
      </Box>
    );
  }

  const statusInfo = getStatusInfo(pod.status);

  return (
    <Box sx={{ p: { xs: 1, sm: 1.5, md: 2 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Box>
          <Typography variant="h6" fontWeight="600" sx={{ fontSize: '1rem' }}>
            Debrief POD
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
            Review and conclude POD delivery outcome
          </Typography>
        </Box>
        <Button 
          startIcon={<ArrowBack sx={{ fontSize: '0.9rem' }} />} 
          onClick={() => navigate('/pods')}
          size="small"
          sx={{ fontSize: '0.75rem' }}
        >
          Back to PODs
        </Button>
      </Box>

      {(submitting) && (
        <Box sx={{ mb: 2 }}>
          <LinearProgress 
            variant="determinate" 
            value={debriefProgress} 
            sx={{ height: 8, borderRadius: 4 }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block', fontSize: '0.7rem' }}>
            Processing debrief... {debriefProgress}%
          </Typography>
        </Box>
      )}

      <Grid container spacing={2}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: { xs: 1.5, sm: 2 } }}>
            <form onSubmit={handleSubmit}>
              {error && (
                <Alert severity="error" sx={{ mb: 2, fontSize: '0.8rem' }} onClose={() => setError('')}>
                  {error}
                </Alert>
              )}
              {success && (
                <Alert severity="success" sx={{ mb: 2, fontSize: '0.8rem' }} onClose={() => setSuccess('')}>
                  {success}
                </Alert>
              )}

              {/* POD Summary */}
              <Card variant="outlined" sx={{ mb: 2, bgcolor: 'grey.50' }}>
                <CardContent sx={{ p: 1.5 }}>
                  <Grid container spacing={1}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                        POD Number
                      </Typography>
                      <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.8rem' }}>
                        {pod.podNumber || 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                        Trip
                      </Typography>
                      <Typography variant="body2" fontWeight={500} sx={{ fontSize: '0.8rem' }}>
                        #{pod.tripId || 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                        Customer
                      </Typography>
                      <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                        {pod.customerName || 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                        Delivery Date
                      </Typography>
                      <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                        {pod.deliveryDate ? new Date(pod.deliveryDate).toLocaleDateString() : 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                        Current Status
                      </Typography>
                      <Chip
                        label={statusInfo.label}
                        icon={<statusInfo.icon sx={{ fontSize: '0.9rem' }} />}
                        sx={{ 
                          fontSize: '0.7rem',
                          height: 24,
                          backgroundColor: `${statusInfo.color}20`,
                          color: statusInfo.color,
                          fontWeight: 500,
                          mt: 0.5
                        }}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel sx={{ fontSize: '0.75rem' }}>Outcome Status *</InputLabel>
                    <Select
                      name="status"
                      value={debriefData.status}
                      label="Outcome Status *"
                      onChange={handleChange}
                      sx={{ fontSize: '0.8rem' }}
                      error={!!formErrors.status}
                    >
                      {STATUS_OPTIONS.map(option => (
                        <MenuItem key={option.value} value={option.value} sx={{ fontSize: '0.8rem' }}>
                          <Chip
                            label={option.label}
                            color={option.color}
                            size="small"
                            sx={{ fontSize: '0.6rem', height: 20 }}
                          />
                        </MenuItem>
                      ))}
                    </Select>
                    {formErrors.status && (
                      <Typography color="error" variant="caption" sx={{ fontSize: '0.7rem' }}>
                        {formErrors.status}
                      </Typography>
                    )}
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Received By *"
                    name="receivedBy"
                    value={debriefData.receivedBy}
                    onChange={handleChange}
                    required
                    size="small"
                    error={!!formErrors.receivedBy}
                    helperText={formErrors.receivedBy}
                    sx={{
                      '& .MuiInputLabel-root': { fontSize: '0.75rem' },
                      '& .MuiInputBase-root': { fontSize: '0.8rem' }
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Delivery Condition"
                    name="deliveryCondition"
                    select
                    value={debriefData.deliveryCondition}
                    onChange={handleChange}
                    size="small"
                    sx={{
                      '& .MuiInputLabel-root': { fontSize: '0.75rem' },
                      '& .MuiInputBase-root': { fontSize: '0.8rem' }
                    }}
                  >
                    <MenuItem value="Good" sx={{ fontSize: '0.8rem' }}>Good</MenuItem>
                    <MenuItem value="Fair" sx={{ fontSize: '0.8rem' }}>Fair</MenuItem>
                    <MenuItem value="Poor" sx={{ fontSize: '0.8rem' }}>Poor</MenuItem>
                    <MenuItem value="Damaged" sx={{ fontSize: '0.8rem' }}>Damaged</MenuItem>
                  </TextField>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Stack spacing={0.5}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                      Quality Rating
                    </Typography>
                    <Rating
                      name="qualityRating"
                      value={debriefData.qualityRating}
                      onChange={handleRatingChange}
                      size="small"
                    />
                  </Stack>
                </Grid>

                <Grid item xs={12}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                      Issues Found
                    </Typography>
                    <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ mt: 0.5 }}>
                      {['Missing Signature', 'Illegible', 'Incomplete', 'Wrong Customer', 'Damaged', 'Late Delivery'].map(issue => (
                        <Chip
                          key={issue}
                          label={issue}
                          size="small"
                          onClick={() => toggleIssue(issue)}
                          color={debriefData.issuesFound?.includes(issue) ? 'error' : 'default'}
                          variant={debriefData.issuesFound?.includes(issue) ? 'filled' : 'outlined'}
                          sx={{ 
                            fontSize: '0.6rem', 
                            height: 22,
                            mb: 0.5,
                            cursor: 'pointer'
                          }}
                        />
                      ))}
                    </Stack>
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Debrief Notes *"
                    name="debriefNotes"
                    multiline
                    rows={3}
                    value={debriefData.debriefNotes}
                    onChange={handleChange}
                    size="small"
                    placeholder="Add debrief notes, observations, and conclusion..."
                    required={debriefData.status === 'REJECTED'}
                    error={!!formErrors.debriefNotes}
                    helperText={formErrors.debriefNotes || 'Provide detailed notes for the debrief'}
                    sx={{
                      '& .MuiInputLabel-root': { fontSize: '0.75rem' },
                      '& .MuiInputBase-root': { fontSize: '0.8rem' }
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Additional Information"
                    name="additionalInfo"
                    multiline
                    rows={2}
                    value={debriefData.additionalInfo}
                    onChange={handleChange}
                    size="small"
                    placeholder="Any additional information or remarks..."
                    sx={{
                      '& .MuiInputLabel-root': { fontSize: '0.75rem' },
                      '& .MuiInputBase-root': { fontSize: '0.8rem' }
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 1.5 }} />
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 1 }}>
                    <Button
                      type="submit"
                      variant="contained"
                      size="medium"
                      startIcon={submitting ? <CircularProgress size={18} /> : <VerifiedIcon sx={{ fontSize: '0.9rem' }} />}
                      disabled={submitting}
                      sx={{ 
                        minWidth: { xs: '100%', sm: 180 },
                        fontSize: '0.8rem',
                        py: 0.75
                      }}
                    >
                      {submitting ? 'Processing...' : 'Complete Debrief'}
                    </Button>
                    <Button
                      variant="outlined"
                      size="medium"
                      onClick={() => navigate('/pods')}
                      disabled={submitting}
                      sx={{ 
                        fontSize: '0.8rem',
                        py: 0.75
                      }}
                    >
                      Cancel
                    </Button>
                  </Stack>
                </Grid>
              </Grid>
            </form>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontSize: '0.9rem', fontWeight: 600, mb: 2 }}>
                Debrief Checklist
              </Typography>
              <Stack spacing={1.5}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AssignmentIcon sx={{ fontSize: '1.1rem', color: 'primary.main' }} />
                  <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                    Verify POD document is clear
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckCircleIcon sx={{ fontSize: '1.1rem', color: 'success.main' }} />
                  <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                    Confirm delivery details
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CommentIcon sx={{ fontSize: '1.1rem', color: 'info.main' }} />
                  <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                    Document any issues found
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <VerifiedIcon sx={{ fontSize: '1.1rem', color: 'warning.main' }} />
                  <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                    Finalize with conclusion
                  </Typography>
                </Box>
              </Stack>

              <Divider sx={{ my: 1.5 }} />

              <Typography variant="subtitle2" sx={{ fontSize: '0.75rem', fontWeight: 600, mb: 1 }}>
                Required Actions
              </Typography>
              <Stack spacing={0.5}>
                {debriefData.status === 'DELIVERED' && (
                  <Chip 
                    label="✓ Delivery Confirmed" 
                    size="small" 
                    color="success"
                    sx={{ fontSize: '0.6rem', height: 20 }}
                  />
                )}
                {debriefData.status === 'VERIFIED' && (
                  <Chip 
                    label="✓ Fully Verified" 
                    size="small" 
                    color="info"
                    sx={{ fontSize: '0.6rem', height: 20 }}
                  />
                )}
                {debriefData.status === 'REJECTED' && (
                  <Chip 
                    label="✗ Rejected - Review Required" 
                    size="small" 
                    color="error"
                    sx={{ fontSize: '0.6rem', height: 20 }}
                  />
                )}
                {debriefData.issuesFound?.length > 0 && (
                  <Chip 
                    label={`⚠ ${debriefData.issuesFound.length} issues found`} 
                    size="small" 
                    color="warning"
                    sx={{ fontSize: '0.6rem', height: 20 }}
                  />
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DebriefPOD;
