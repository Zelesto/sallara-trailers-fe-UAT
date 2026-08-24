// src/pages/MovementHistory.jsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment,
  Stack,
  Grid,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Refresh,
  Search,
  CheckCircle,
  Cancel,
  Pending,
  Visibility,
  Inventory,
  LocalAtm,
  Warning,
  Receipt,
  Person,
  Event,
  Add,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { inventoryMovementService } from '../services/inventoryMovementService';
import { inventoryService } from '../services/inventoryService';

// ============================================================
// STAT CARD - Matching Dashboard
// ============================================================
const StatCard = ({ title, value, icon: Icon, color = 'primary', subtitle }) => {
  const getColor = (colorName) => {
    const colors = {
      primary: '#4F46E5',
      success: '#22C55E',
      warning: '#F59E0B',
      error: '#EF4444',
      info: '#3B82F6',
      secondary: '#6B7280',
      purple: '#8B5CF6',
      pink: '#EC4899',
      teal: '#14B8A6',
      indigo: '#6366F1',
    };
    return colors[colorName] || '#4F46E5';
  };

  const getColorBg = (color) => {
    const bgColors = {
      primary: '#EEF2FF',
      success: '#D1FAE5',
      warning: '#FEF3C7',
      error: '#FEE2E2',
      info: '#DBEAFE',
      secondary: '#F3F4F6',
      purple: '#EDE9FE',
      pink: '#FCE7F3',
      teal: '#CCFBF1',
      indigo: '#E0E7FF',
    };
    return bgColors[color] || bgColors.primary;
  };

  const iconColor = getColor(color);
  const bgColor = getColorBg(color);
  const SafeIcon = Icon || Inventory;

  return (
    <Card
      sx={{
        bgcolor: '#FFFFFF',
        borderRadius: { xs: '12px', sm: '14px', md: '16px' },
        border: '1px solid #ECECEC',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        height: '100%',
        width: '100%',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          borderColor: iconColor,
        },
      }}
    >
      <CardContent sx={{ p: { xs: 1.5, sm: 2, md: 2.5 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="caption"
              sx={{
                color: '#6B7280',
                fontWeight: 600,
                textTransform: 'uppercase',
                fontSize: { xs: '0.55rem', sm: '0.6rem', md: '0.65rem' },
                letterSpacing: '0.5px',
                display: 'block',
                mb: 0.25,
              }}
            >
              {title}
            </Typography>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                color: '#111827',
                fontSize: { xs: '1.2rem', sm: '1.4rem', md: '1.6rem', lg: '1.8rem' },
                lineHeight: 1.2,
              }}
            >
              {value || 0}
            </Typography>
            {subtitle && (
              <Typography
                variant="caption"
                sx={{
                  color: '#6B7280',
                  display: 'block',
                  mt: 0.25,
                  fontSize: { xs: '0.55rem', sm: '0.6rem', md: '0.65rem' },
                }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              bgcolor: bgColor,
              borderRadius: { xs: '10px', sm: '12px', md: '14px' },
              p: { xs: 1, sm: 1.25, md: 1.5 },
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'scale(1.05)',
              },
            }}
          >
            <SafeIcon sx={{ 
              color: iconColor, 
              fontSize: { xs: '1.2rem', sm: '1.4rem', md: '1.6rem', lg: '1.8rem' },
            }} />
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
};

// ============================================================
// MAIN COMPONENT
// ============================================================
const MovementHistory = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [selectedMovement, setSelectedMovement] = useState(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [approveNotes, setApproveNotes] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });

  // Parse URL parameters on mount
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const statusParam = params.get('status');
    if (statusParam && ['PENDING', 'APPROVED', 'REJECTED'].includes(statusParam)) {
      setFilterStatus(statusParam);
    }
  }, [location.search]);

  const calculateStats = (data) => {
    const movementsArray = Array.isArray(data) ? data : [];
    const pending = movementsArray.filter(m => m.approvalStatus === 'PENDING').length;
    const approved = movementsArray.filter(m => m.approvalStatus === 'APPROVED').length;
    const rejected = movementsArray.filter(m => m.approvalStatus === 'REJECTED').length;
    setStats({
      total: movementsArray.length,
      pending,
      approved,
      rejected,
    });
  };

  useEffect(() => {
    loadMovements();
  }, []);

  const loadMovements = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await inventoryMovementService.getMovementHistory();
      
      let movementsData = [];
      if (Array.isArray(data)) {
        movementsData = data;
      } else if (data && data.content) {
        movementsData = data.content;
      } else if (data && data.data) {
        movementsData = Array.isArray(data.data) ? data.data : [];
      } else if (data && typeof data === 'object') {
        const values = Object.values(data);
        const arrayProp = values.find(v => Array.isArray(v));
        movementsData = arrayProp || [];
      }
      
      setMovements(movementsData);
      calculateStats(movementsData);
    } catch (err) {
      console.error('Error loading movements:', err);
      setError('Failed to load movement history');
      setMovements([]);
      calculateStats([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      await inventoryMovementService.approveMovement(
        selectedMovement.id,
        'Current User',
        approveNotes
      );
      loadMovements();
      setShowApproveDialog(false);
      setApproveNotes('');
    } catch (err) {
      console.error('Error approving movement:', err);
      setError('Failed to approve movement');
    }
  };

  const handleReject = async (movementId) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (reason === null) return;
    try {
      await inventoryMovementService.rejectMovement(movementId, 'Current User', reason);
      loadMovements();
    } catch (err) {
      console.error('Error rejecting movement:', err);
      setError('Failed to reject movement');
    }
  };

  const handleFilterStatusChange = (status) => {
    setFilterStatus(status);
    const params = new URLSearchParams(location.search);
    if (status === 'ALL') {
      params.delete('status');
    } else {
      params.set('status', status);
    }
    navigate(`${location.pathname}?${params.toString()}`, { replace: true });
  };

  const getMovementTypeChip = (type) => {
    const configs = {
      IN: { color: 'success', label: 'Stock In', icon: <LocalAtm sx={{ fontSize: '0.7rem' }} /> },
      OUT: { color: 'error', label: 'Stock Out', icon: <Warning sx={{ fontSize: '0.7rem' }} /> },
      ADJUSTMENT: { color: 'warning', label: 'Adjustment', icon: <Inventory sx={{ fontSize: '0.7rem' }} /> },
    };
    const config = configs[type] || { color: 'default', label: type };
    return (
      <Chip
        label={config.label}
        color={config.color}
        size="small"
        icon={config.icon}
        sx={{ height: 18, fontSize: '0.55rem' }}
      />
    );
  };

  const getStatusChip = (status) => {
    const configs = {
      PENDING: { color: 'warning', label: 'Pending', icon: <Pending sx={{ fontSize: '0.7rem' }} /> },
      APPROVED: { color: 'success', label: 'Approved', icon: <CheckCircle sx={{ fontSize: '0.7rem' }} /> },
      REJECTED: { color: 'error', label: 'Rejected', icon: <Cancel sx={{ fontSize: '0.7rem' }} /> },
    };
    const config = configs[status] || { color: 'default', label: status };
    return (
      <Chip
        label={config.label}
        color={config.color}
        size="small"
        icon={config.icon}
        sx={{ height: 18, fontSize: '0.55rem' }}
      />
    );
  };

  const filteredMovements = useMemo(() => {
    let filtered = Array.isArray(movements) ? movements : [];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(m =>
        (m.itemName || '').toLowerCase().includes(term) ||
        (m.reason || '').toLowerCase().includes(term) ||
        (m.referenceNumber || '').toLowerCase().includes(term)
      );
    }
    if (filterType !== 'ALL') {
      filtered = filtered.filter(m => m.movementType === filterType);
    }
    if (filterStatus !== 'ALL') {
      filtered = filtered.filter(m => m.approvalStatus === filterStatus);
    }
    return filtered;
  }, [movements, searchTerm, filterType, filterStatus]);

  return (
    <Box sx={{ 
      bgcolor: '#F7F7FC', 
      minHeight: '100vh',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      p: { xs: 1.5, sm: 2, md: 2.5, lg: 3 },
      width: '100%',
      overflowX: 'hidden' 
    }}>
      <Box sx={{ 
        maxWidth: '1600px', 
        margin: '0 auto',
        flex: 1,
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}>
        
        {/* Header - Matching Dashboard */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          mb={{ xs: 2, sm: 2.5, md: 3 }}
          spacing={{ xs: 1, sm: 0 }}
        >
          <Box>
            <Typography 
              variant="h5" 
              fontWeight="700" 
              sx={{ 
                fontSize: { 
                  xs: '1.1rem', 
                  sm: '1.3rem', 
                  md: '1.4rem', 
                  lg: '1.5rem' 
                } 
              }}
            >
              Stock Movement History
            </Typography>
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ 
                fontSize: { 
                  xs: '0.7rem', 
                  sm: '0.8rem', 
                  md: '0.85rem' 
                } 
              }}
            >
              Track and manage all inventory movements
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<Refresh sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' } }} />}
              onClick={loadMovements}
              size="small"
              sx={{
                borderRadius: '10px',
                fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.8rem' },
                textTransform: 'none',
                py: { xs: 0.5, sm: 0.75 },
                px: { xs: 1.5, sm: 2 },
              }}
            >
              Refresh
            </Button>
            {stats.pending > 0 && (
              <Button
                variant="contained"
                size="small"
                sx={{
                  borderRadius: '10px',
                  fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.8rem' },
                  textTransform: 'none',
                  py: { xs: 0.5, sm: 0.75 },
                  px: { xs: 1.5, sm: 2 },
                  background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #D97706 0%, #B45309 100%)',
                  },
                }}
                onClick={() => handleFilterStatusChange('PENDING')}
              >
                {stats.pending} Pending
              </Button>
            )}
          </Stack>
        </Stack>

        {/* Alerts */}
        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: '12px', fontSize: '0.8rem' }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Stats Cards */}
        <Grid 
          container 
          spacing={{ xs: 1.5, sm: 2, md: 2.5 }}
          sx={{ 
            mb: { xs: 2, sm: 2.5, md: 3 },
            width: '100%',
            margin: 0,
          }}
        >
          <Grid size={{ xs: 6, sm: 3 }} sx={{ display: 'flex' }}>
            <StatCard title="Total Movements" value={stats.total} icon={Inventory} color="primary" />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }} sx={{ display: 'flex' }}>
            <StatCard title="Pending Approval" value={stats.pending} icon={Pending} color="warning" />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }} sx={{ display: 'flex' }}>
            <StatCard title="Approved" value={stats.approved} icon={CheckCircle} color="success" />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }} sx={{ display: 'flex' }}>
            <StatCard title="Rejected" value={stats.rejected} icon={Cancel} color="error" />
          </Grid>
        </Grid>

        {/* Filters */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 1.5, sm: 2, md: 2.5 },
            mb: { xs: 2, sm: 2.5, md: 3 },
            borderRadius: { xs: '12px', sm: '16px' },
            border: '1px solid #ECECEC',
            bgcolor: '#FFFFFF',
            width: '100%',
          }}
        >
          <Grid container spacing={1.5} alignItems="center">
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                placeholder="Search movements..."
                size="small"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{
                  '& .MuiInputLabel-root': { fontSize: { xs: '0.65rem', sm: '0.75rem' } },
                  '& .MuiInputBase-root': { fontSize: { xs: '0.7rem', sm: '0.75rem' }, borderRadius: '10px' },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ fontSize: '0.9rem' }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ fontSize: '0.75rem' }}>Type</InputLabel>
                <Select
                  value={filterType}
                  label="Type"
                  onChange={(e) => setFilterType(e.target.value)}
                  sx={{ fontSize: '0.75rem', borderRadius: '10px' }}
                >
                  <MenuItem value="ALL" sx={{ fontSize: '0.75rem' }}>All Types</MenuItem>
                  <MenuItem value="IN" sx={{ fontSize: '0.75rem' }}>Stock In</MenuItem>
                  <MenuItem value="OUT" sx={{ fontSize: '0.75rem' }}>Stock Out</MenuItem>
                  <MenuItem value="ADJUSTMENT" sx={{ fontSize: '0.75rem' }}>Adjustment</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ fontSize: '0.75rem' }}>Status</InputLabel>
                <Select
                  value={filterStatus}
                  label="Status"
                  onChange={(e) => handleFilterStatusChange(e.target.value)}
                  sx={{ fontSize: '0.75rem', borderRadius: '10px' }}
                >
                  <MenuItem value="ALL" sx={{ fontSize: '0.75rem' }}>All Status</MenuItem>
                  <MenuItem value="PENDING" sx={{ fontSize: '0.75rem' }}>Pending</MenuItem>
                  <MenuItem value="APPROVED" sx={{ fontSize: '0.75rem' }}>Approved</MenuItem>
                  <MenuItem value="REJECTED" sx={{ fontSize: '0.75rem' }}>Rejected</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Stack direction="row" spacing={0.75}>
                <Tooltip title="Refresh">
                  <IconButton size="small" onClick={loadMovements} sx={{ p: 0.5 }}>
                    <Refresh sx={{ fontSize: '0.9rem' }} />
                  </IconButton>
                </Tooltip>
                {filterStatus !== 'ALL' && (
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => handleFilterStatusChange('ALL')}
                    sx={{
                      fontSize: '0.75rem',
                      borderRadius: '10px',
                      textTransform: 'none',
                      py: 0.5,
                    }}
                  >
                    Clear Filter
                  </Button>
                )}
              </Stack>
            </Grid>
          </Grid>
        </Paper>

        {/* Table */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: { xs: '12px', sm: '16px' },
            border: '1px solid #ECECEC',
            bgcolor: '#FFFFFF',
            width: '100%',
            overflow: 'hidden',
          }}
        >
          <TableContainer>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#F9FAFB' }}>
                <TableRow>
                  <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600, color: '#6B7280', py: 1.5 }}>Date</TableCell>
                  <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600, color: '#6B7280', py: 1.5 }}>Item</TableCell>
                  <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600, color: '#6B7280', py: 1.5 }}>Type</TableCell>
                  <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600, color: '#6B7280', py: 1.5 }} align="right">Qty</TableCell>
                  <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600, color: '#6B7280', py: 1.5 }}>Reason</TableCell>
                  <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600, color: '#6B7280', py: 1.5 }}>Reference</TableCell>
                  <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600, color: '#6B7280', py: 1.5 }}>Status</TableCell>
                  <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600, color: '#6B7280', py: 1.5 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                      <CircularProgress size={30} />
                      <Typography sx={{ ml: 2, mt: 1, fontSize: '0.9rem' }}>Loading movements...</Typography>
                    </TableCell>
                  </TableRow>
                ) : filteredMovements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Inventory sx={{ fontSize: 48, color: '#D1D5DB', mb: 2 }} />
                        <Typography variant="body1" color="text.secondary">
                          {filterStatus !== 'ALL' 
                            ? `No ${filterStatus.toLowerCase()} movements found` 
                            : 'No movements found'}
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMovements.map((movement) => (
                    <TableRow key={movement.id} hover sx={{ '&:hover': { bgcolor: '#F9FAFB' } }}>
                      <TableCell sx={{ fontSize: '0.7rem', py: 0.75 }}>
                        {movement.createdAt ? new Date(movement.createdAt).toLocaleString() : 'N/A'}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.7rem', py: 0.75 }}>
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          <Inventory sx={{ fontSize: '0.7rem', color: '#6B7280' }} />
                          <Typography variant="body2" sx={{ fontSize: '0.7rem', fontWeight: 500 }}>
                            {movement.itemName || `Item #${movement.itemId}`}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.7rem', py: 0.75 }}>
                        {getMovementTypeChip(movement.movementType)}
                      </TableCell>
                      <TableCell align="right" sx={{ fontSize: '0.7rem', py: 0.75, fontWeight: 600 }}>
                        {movement.quantity}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.7rem', py: 0.75 }}>
                        <Typography variant="body2" sx={{ fontSize: '0.65rem' }}>
                          {movement.reason || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.7rem', py: 0.75 }}>
                        <Typography variant="body2" sx={{ fontSize: '0.65rem' }}>
                          {movement.referenceNumber || '-'}
                        </Typography>
                        {movement.referenceType && (
                          <Typography variant="caption" display="block" color="text.secondary" sx={{ fontSize: '0.5rem' }}>
                            {movement.referenceType}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.7rem', py: 0.75 }}>
                        {getStatusChip(movement.approvalStatus)}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.7rem', py: 0.75 }}>
                        <Stack direction="row" spacing={0.25}>
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => {
                                setSelectedMovement(movement);
                                setShowDetailsDialog(true);
                              }}
                              sx={{ p: 0.5 }}
                            >
                              <Visibility sx={{ fontSize: '0.9rem' }} />
                            </IconButton>
                          </Tooltip>
                          {movement.approvalStatus === 'PENDING' && (
                            <>
                              <Tooltip title="Approve">
                                <IconButton
                                  size="small"
                                  color="success"
                                  onClick={() => {
                                    setSelectedMovement(movement);
                                    setShowApproveDialog(true);
                                  }}
                                  sx={{ p: 0.5 }}
                                >
                                  <CheckCircle sx={{ fontSize: '0.9rem' }} />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Reject">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleReject(movement.id)}
                                  sx={{ p: 0.5 }}
                                >
                                  <Cancel sx={{ fontSize: '0.9rem' }} />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Details Dialog */}
        <Dialog
          open={showDetailsDialog}
          onClose={() => setShowDetailsDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ 
            py: 1.5, 
            px: 2.5, 
            borderBottom: 1, 
            borderColor: 'divider',
            bgcolor: '#F8FAFC',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600, color: '#111827' }}>
              Movement Details
            </Typography>
            <IconButton size="small" onClick={() => setShowDetailsDialog(false)}>
              <CloseIcon sx={{ fontSize: '1.2rem' }} />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ p: 2.5 }}>
            {selectedMovement && (
              <Stack spacing={2}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="subtitle2" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>Movement ID</Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>#{selectedMovement.id}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="subtitle2" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>Date</Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                      {selectedMovement.createdAt ? new Date(selectedMovement.createdAt).toLocaleString() : 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="subtitle2" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>Item</Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.85rem', fontWeight: 500 }}>
                      {selectedMovement.itemName || `Item #${selectedMovement.itemId}`}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="subtitle2" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>Type</Typography>
                    {getMovementTypeChip(selectedMovement.movementType)}
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="subtitle2" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>Quantity</Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.85rem', fontWeight: 600 }}>
                      {selectedMovement.quantity}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="subtitle2" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>Status</Typography>
                    {getStatusChip(selectedMovement.approvalStatus)}
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="subtitle2" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>Reason</Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                      {selectedMovement.reason || '-'}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="subtitle2" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>Reference Number</Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                      {selectedMovement.referenceNumber || '-'}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="subtitle2" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>Reference Type</Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                      {selectedMovement.referenceType || '-'}
                    </Typography>
                  </Grid>
                  {selectedMovement.notes && (
                    <Grid size={{ xs: 12 }}>
                      <Typography variant="subtitle2" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>Notes</Typography>
                      <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                        {selectedMovement.notes}
                      </Typography>
                    </Grid>
                  )}
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="subtitle2" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>Performed By</Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                      {selectedMovement.performedBy || 'System'}
                    </Typography>
                  </Grid>
                  {selectedMovement.approvedBy && (
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="subtitle2" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>Approved By</Typography>
                      <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                        {selectedMovement.approvedBy}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </Stack>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 2.5, py: 1.5, borderTop: 1, borderColor: 'divider', bgcolor: '#F8FAFC' }}>
            <Button onClick={() => setShowDetailsDialog(false)} size="small" sx={{ fontSize: '0.8rem' }}>
              Close
            </Button>
          </DialogActions>
        </Dialog>

        {/* Approve Dialog */}
        <Dialog
          open={showApproveDialog}
          onClose={() => setShowApproveDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ 
            py: 1.5, 
            px: 2.5, 
            borderBottom: 1, 
            borderColor: 'divider',
            bgcolor: '#F8FAFC',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600, color: '#111827' }}>
              Approve Movement
            </Typography>
            <IconButton size="small" onClick={() => setShowApproveDialog(false)}>
              <CloseIcon sx={{ fontSize: '1.2rem' }} />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ p: 2.5 }}>
            <Alert severity="info" sx={{ mb: 2, borderRadius: '12px', fontSize: '0.8rem' }}>
              Approving this movement will update the inventory quantity.
            </Alert>
            {selectedMovement && (
              <Stack spacing={1.5}>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>Item</Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.85rem', fontWeight: 500 }}>
                    {selectedMovement.itemName || `Item #${selectedMovement.itemId}`}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>Type</Typography>
                  {getMovementTypeChip(selectedMovement.movementType)}
                </Box>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>Quantity</Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.85rem', fontWeight: 600 }}>
                    {selectedMovement.quantity}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>Reason</Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                    {selectedMovement.reason || '-'}
                  </Typography>
                </Box>
                <TextField
                  fullWidth
                  label="Approval Notes"
                  multiline
                  rows={2}
                  value={approveNotes}
                  onChange={(e) => setApproveNotes(e.target.value)}
                  size="small"
                  sx={{ 
                    '& .MuiInputLabel-root': { fontSize: '0.75rem' },
                    '& .MuiInputBase-root': { fontSize: '0.8rem' }
                  }}
                />
              </Stack>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 2.5, py: 1.5, borderTop: 1, borderColor: 'divider', bgcolor: '#F8FAFC' }}>
            <Button onClick={() => setShowApproveDialog(false)} size="small" sx={{ fontSize: '0.8rem' }}>
              Cancel
            </Button>
            <Button
              onClick={handleApprove}
              variant="contained"
              color="success"
              size="small"
              sx={{ fontSize: '0.8rem' }}
            >
              Approve
            </Button>
          </DialogActions>
        </Dialog>

      </Box>
    </Box>
  );
};

export default MovementHistory;
