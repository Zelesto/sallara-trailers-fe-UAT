// src/pages/inventory/MovementHistory.jsx
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
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { inventoryMovementService } from '../../services/inventoryMovementService';
import { inventoryService } from '../../services/inventoryService';

// Stat Card Component
const StatCard = ({ title, value, icon: Icon, color = 'primary', subtitle }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
      <Stack direction="row" alignItems="center" spacing={1.5}>
        <Box
          sx={{
            bgcolor: `${color}.light`,
            borderRadius: 1,
            p: 0.75,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon sx={{ fontSize: '1.2rem', color: `${color}.main` }} />
        </Box>
        <Box>
          <Typography variant="h5" fontWeight="bold" sx={{ fontSize: '1.1rem' }}>
            {value}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem', display: 'block' }}>
              {subtitle}
            </Typography>
          )}
        </Box>
      </Stack>
    </CardContent>
  </Card>
);

const MovementHistory = () => {
  const navigate = useNavigate();
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

  useEffect(() => {
    loadMovements();
  }, []);

  const loadMovements = async () => {
    setLoading(true);
    try {
      const data = await inventoryMovementService.getMovementHistory();
      setMovements(data || []);
      calculateStats(data || []);
    } catch (err) {
      console.error('Error loading movements:', err);
      setError('Failed to load movement history');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data) => {
    const pending = data.filter(m => m.approvalStatus === 'PENDING').length;
    const approved = data.filter(m => m.approvalStatus === 'APPROVED').length;
    const rejected = data.filter(m => m.approvalStatus === 'REJECTED').length;
    setStats({
      total: data.length,
      pending,
      approved,
      rejected,
    });
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
        sx={{ height: 20, fontSize: '0.55rem' }}
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
        sx={{ height: 20, fontSize: '0.55rem' }}
      />
    );
  };

  const filteredMovements = useMemo(() => {
    let filtered = movements;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(m =>
        m.itemName?.toLowerCase().includes(term) ||
        m.reason?.toLowerCase().includes(term) ||
        m.referenceNumber?.toLowerCase().includes(term)
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
    <Box sx={{ p: { xs: 1, sm: 1.5, md: 2 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Typography variant="h6" fontWeight="600" sx={{ fontSize: '1rem' }}>
            <Inventory sx={{ mr: 0.5, verticalAlign: 'middle', fontSize: '1.2rem' }} />
            Stock Movement History
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
            Track and manage all inventory movements
          </Typography>
        </Box>
        <Stack direction="row" spacing={0.75}>
          <Button
            variant="outlined"
            startIcon={<Refresh sx={{ fontSize: '0.9rem' }} />}
            onClick={loadMovements}
            size="small"
            sx={{ fontSize: '0.75rem' }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<Inventory sx={{ fontSize: '0.9rem' }} />}
            onClick={() => navigate('/inventory/movements/new')}
            size="small"
            sx={{ fontSize: '0.75rem' }}
          >
            New Movement
          </Button>
        </Stack>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid item xs={6} sm={3}>
          <StatCard title="Total Movements" value={stats.total} icon={Inventory} color="primary" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard title="Pending Approval" value={stats.pending} icon={Pending} color="warning" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard title="Approved" value={stats.approved} icon={CheckCircle} color="success" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard title="Rejected" value={stats.rejected} icon={Cancel} color="error" />
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: 1.5, mb: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <TextField
            placeholder="Search movements..."
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ flex: 1 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ fontSize: '0.9rem' }} />
                </InputAdornment>
              ),
            }}
          />
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel sx={{ fontSize: '0.75rem' }}>Type</InputLabel>
            <Select
              value={filterType}
              label="Type"
              onChange={(e) => setFilterType(e.target.value)}
              sx={{ fontSize: '0.75rem' }}
            >
              <MenuItem value="ALL" sx={{ fontSize: '0.75rem' }}>All Types</MenuItem>
              <MenuItem value="IN" sx={{ fontSize: '0.75rem' }}>Stock In</MenuItem>
              <MenuItem value="OUT" sx={{ fontSize: '0.75rem' }}>Stock Out</MenuItem>
              <MenuItem value="ADJUSTMENT" sx={{ fontSize: '0.75rem' }}>Adjustment</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel sx={{ fontSize: '0.75rem' }}>Status</InputLabel>
            <Select
              value={filterStatus}
              label="Status"
              onChange={(e) => setFilterStatus(e.target.value)}
              sx={{ fontSize: '0.75rem' }}
            >
              <MenuItem value="ALL" sx={{ fontSize: '0.75rem' }}>All Status</MenuItem>
              <MenuItem value="PENDING" sx={{ fontSize: '0.75rem' }}>Pending</MenuItem>
              <MenuItem value="APPROVED" sx={{ fontSize: '0.75rem' }}>Approved</MenuItem>
              <MenuItem value="REJECTED" sx={{ fontSize: '0.75rem' }}>Rejected</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Paper>

      {/* Table */}
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600 }}>Date</TableCell>
              <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600 }}>Item</TableCell>
              <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600 }}>Type</TableCell>
              <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600 }} align="right">Quantity</TableCell>
              <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600 }}>Reason</TableCell>
              <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600 }}>Reference</TableCell>
              <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={30} />
                </TableCell>
              </TableRow>
            ) : filteredMovements.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                  <Typography color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                    No movements found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredMovements.map((movement) => (
                <TableRow key={movement.id} hover>
                  <TableCell sx={{ fontSize: '0.7rem' }}>
                    {movement.createdAt ? new Date(movement.createdAt).toLocaleString() : 'N/A'}
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.7rem' }}>{movement.itemName || `Item #${movement.itemId}`}</TableCell>
                  <TableCell>{getMovementTypeChip(movement.movementType)}</TableCell>
                  <TableCell align="right" sx={{ fontSize: '0.7rem', fontWeight: 500 }}>
                    {movement.quantity}
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.7rem' }}>{movement.reason || '-'}</TableCell>
                  <TableCell sx={{ fontSize: '0.7rem' }}>
                    {movement.referenceNumber || '-'}
                    {movement.referenceType && (
                      <Typography variant="caption" display="block" color="text.secondary" sx={{ fontSize: '0.55rem' }}>
                        {movement.referenceType}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>{getStatusChip(movement.approvalStatus)}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.25}>
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
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

      {/* Details Dialog */}
      <Dialog
        open={showDetailsDialog}
        onClose={() => setShowDetailsDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
            Movement Details
          </Typography>
        </DialogTitle>
        <DialogContent>
          {selectedMovement && (
            <Stack spacing={1.5} sx={{ mt: 1 }}>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                  Movement ID
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                  #{selectedMovement.id}
                </Typography>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                  Item
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                  {selectedMovement.itemName || `Item #${selectedMovement.itemId}`}
                </Typography>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                  Type
                </Typography>
                {getMovementTypeChip(selectedMovement.movementType)}
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                  Quantity
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                  {selectedMovement.quantity}
                </Typography>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                  Reason
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                  {selectedMovement.reason || '-'}
                </Typography>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                  Reference
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                  {selectedMovement.referenceNumber || '-'}
                </Typography>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                  Status
                </Typography>
                {getStatusChip(selectedMovement.approvalStatus)}
              </Box>
              {selectedMovement.notes && (
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                    Notes
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                    {selectedMovement.notes}
                  </Typography>
                </Box>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
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
        <DialogTitle>
          <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
            Approve Movement
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mt: 1, mb: 2 }}>
            Approving this movement will update the inventory quantity.
          </Alert>
          {selectedMovement && (
            <Stack spacing={1}>
              <Typography variant="body2">
                <strong>Item:</strong> {selectedMovement.itemName || `Item #${selectedMovement.itemId}`}
              </Typography>
              <Typography variant="body2">
                <strong>Type:</strong> {selectedMovement.movementType}
              </Typography>
              <Typography variant="body2">
                <strong>Quantity:</strong> {selectedMovement.quantity}
              </Typography>
              <Typography variant="body2">
                <strong>Reason:</strong> {selectedMovement.reason}
              </Typography>
            </Stack>
          )}
          <TextField
            fullWidth
            label="Approval Notes"
            multiline
            rows={2}
            value={approveNotes}
            onChange={(e) => setApproveNotes(e.target.value)}
            size="small"
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
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
  );
};

export default MovementHistory;
