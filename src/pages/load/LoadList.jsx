// src/pages/load/LoadList.jsx
import React, { useState, useEffect } from 'react';
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
  Visibility,
  Add,
  Merge,
  LocalShipping,
  Person,
  CalendarToday,
  LocationOn,
  Route,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { loadService } from '../../services/loadService';
import { customerService } from '../../services/customerService';

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

const LoadList = () => {
  const navigate = useNavigate();
  const [loads, setLoads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [showMergeDialog, setShowMergeDialog] = useState(false);
  const [mergeData, setMergeData] = useState({
    customerId: '',
    plannedDate: new Date().toISOString().slice(0, 10),
  });
  const [mergeResult, setMergeResult] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
  });

  useEffect(() => {
    loadLoads();
  }, []);

  const loadLoads = async () => {
    setLoading(true);
    try {
      const response = await loadService.getAllLoads();
      const loadsData = response?.content || response || [];
      setLoads(loadsData);
      calculateStats(loadsData);
    } catch (err) {
      console.error('Error loading loads:', err);
      setError('Failed to load loads');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data) => {
    const pending = data.filter(l => l.status === 'PENDING').length;
    const inProgress = data.filter(l => l.status === 'IN_PROGRESS').length;
    const completed = data.filter(l => l.status === 'COMPLETED').length;
    setStats({
      total: data.length,
      pending,
      inProgress,
      completed,
    });
  };

  const getStatusChip = (status) => {
    const configs = {
      PENDING: { color: 'warning', label: 'Pending' },
      IN_PROGRESS: { color: 'info', label: 'In Progress' },
      COMPLETED: { color: 'success', label: 'Completed' },
      CANCELLED: { color: 'error', label: 'Cancelled' },
    };
    const config = configs[status] || { color: 'default', label: status };
    return (
      <Chip
        label={config.label}
        color={config.color}
        size="small"
        sx={{ height: 20, fontSize: '0.55rem' }}
      />
    );
  };

  const handleSmartMerge = async () => {
    try {
      const response = await loadService.smartMergeTrips(
        mergeData.customerId,
        mergeData.plannedDate
      );
      setMergeResult(response);
      setShowMergeDialog(false);
      loadLoads();
    } catch (err) {
      console.error('Error merging trips:', err);
      setError(err.message || 'Failed to merge trips');
    }
  };

  const filteredLoads = loads.filter(load => {
    const searchMatch = 
      (load.loadNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (load.customerName || '').toLowerCase().includes(searchTerm.toLowerCase());
    const statusMatch = filterStatus === 'ALL' || load.status === filterStatus;
    return searchMatch && statusMatch;
  });

  return (
    <Box sx={{ p: { xs: 1, sm: 1.5, md: 2 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Typography variant="h6" fontWeight="600" sx={{ fontSize: '1rem' }}>
            <LocalShipping sx={{ mr: 0.5, verticalAlign: 'middle', fontSize: '1.2rem' }} />
            Load Management
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
            Manage and consolidate trips into loads
          </Typography>
        </Box>
        <Stack direction="row" spacing={0.75}>
          <Button
            variant="outlined"
            startIcon={<Merge sx={{ fontSize: '0.9rem' }} />}
            onClick={() => setShowMergeDialog(true)}
            size="small"
            sx={{ fontSize: '0.75rem' }}
          >
            Smart Merge
          </Button>
          <Button
            variant="outlined"
            startIcon={<Refresh sx={{ fontSize: '0.9rem' }} />}
            onClick={loadLoads}
            size="small"
            sx={{ fontSize: '0.75rem' }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<Add sx={{ fontSize: '0.9rem' }} />}
            onClick={() => navigate('/loads/new')}
            size="small"
            sx={{ fontSize: '0.75rem' }}
          >
            New Load
          </Button>
        </Stack>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2, fontSize: '0.8rem' }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid item xs={6} sm={3}>
          <StatCard title="Total Loads" value={stats.total} icon={LocalShipping} color="primary" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard title="Pending" value={stats.pending} icon={LocalShipping} color="warning" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard title="In Progress" value={stats.inProgress} icon={LocalShipping} color="info" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard title="Completed" value={stats.completed} icon={LocalShipping} color="success" />
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: 1.5, mb: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <TextField
            placeholder="Search loads..."
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
            <InputLabel sx={{ fontSize: '0.75rem' }}>Status</InputLabel>
            <Select
              value={filterStatus}
              label="Status"
              onChange={(e) => setFilterStatus(e.target.value)}
              sx={{ fontSize: '0.75rem' }}
            >
              <MenuItem value="ALL" sx={{ fontSize: '0.75rem' }}>All Status</MenuItem>
              <MenuItem value="PENDING" sx={{ fontSize: '0.75rem' }}>Pending</MenuItem>
              <MenuItem value="IN_PROGRESS" sx={{ fontSize: '0.75rem' }}>In Progress</MenuItem>
              <MenuItem value="COMPLETED" sx={{ fontSize: '0.75rem' }}>Completed</MenuItem>
              <MenuItem value="CANCELLED" sx={{ fontSize: '0.75rem' }}>Cancelled</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Paper>

      {/* Loads Table */}
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600 }}>Load Number</TableCell>
              <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600 }}>Customer</TableCell>
              <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600 }}>Trips</TableCell>
              <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600 }}>Start</TableCell>
              <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600 }}>End</TableCell>
              <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={30} />
                </TableCell>
              </TableRow>
            ) : filteredLoads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                  <Typography color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                    No loads found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredLoads.map((load) => (
                <TableRow key={load.id} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>
                      {load.loadNumber}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                      {load.customerName || 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell>{getStatusChip(load.status)}</TableCell>
                  <TableCell>
                    <Chip
                      label={load.tripCount || 0}
                      size="small"
                      color="primary"
                      variant="outlined"
                      sx={{ height: 18, fontSize: '0.55rem' }}
                    />
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.7rem' }}>
                    {load.loadingDate ? new Date(load.loadingDate).toLocaleDateString() : 'N/A'}
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.7rem' }}>
                    {load.unloadingDate ? new Date(load.unloadingDate).toLocaleDateString() : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.25}>
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => navigate(`/loads/${load.loadNumber}`)}
                          sx={{ p: 0.5 }}
                        >
                          <Visibility sx={{ fontSize: '0.9rem' }} />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Smart Merge Dialog */}
      <Dialog
        open={showMergeDialog}
        onClose={() => setShowMergeDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
            <Merge sx={{ mr: 0.5, verticalAlign: 'middle' }} />
            Smart Merge Trips
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2, fontSize: '0.8rem' }}>
            This will find all trips for the selected customer on the specified date
            and merge them into a single load.
          </Alert>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Customer ID"
              type="number"
              size="small"
              value={mergeData.customerId}
              onChange={(e) => setMergeData({ ...mergeData, customerId: e.target.value })}
            />
            <TextField
              fullWidth
              label="Planned Date"
              type="date"
              size="small"
              value={mergeData.plannedDate}
              onChange={(e) => setMergeData({ ...mergeData, plannedDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowMergeDialog(false)} size="small" sx={{ fontSize: '0.8rem' }}>
            Cancel
          </Button>
          <Button
            onClick={handleSmartMerge}
            variant="contained"
            color="primary"
            size="small"
            sx={{ fontSize: '0.8rem' }}
            disabled={!mergeData.customerId || !mergeData.plannedDate}
          >
            Merge Trips
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LoadList;
