import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, Button, IconButton, Tooltip, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, FormControl, InputLabel, Select, MenuItem,
  Stack, Grid, Card, CardContent, CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon,
  LocalPolice as PoliceIcon
} from '@mui/icons-material';
import { tripService } from '../services/tripService';

import {
  INCIDENT_TYPES,
  INCIDENT_SEVERITIES,
  INCIDENT_STATUSES,
  getDisplayName,
} from '../constants';


const severityColors = {
  LOW: 'success',
  MEDIUM: 'warning',
  HIGH: 'error',
  CRITICAL: 'error'
};

// Compact Stat Card Component
const StatCard = ({ title, value, color = 'primary' }) => (
  <Card>
    <CardContent sx={{ p: 1.5, textAlign: 'center', '&:last-child': { pb: 1.5 } }}>
      <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.65rem', display: 'block' }}>
        {title}
      </Typography>
      <Typography variant="h5" fontWeight="bold" sx={{ fontSize: '1.1rem', color: `${color}.main` }}>
        {value}
      </Typography>
    </CardContent>
  </Card>
);

const TripIncidents = ({ tripId, tripNumber }) => {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalIncidents: 0, activeIncidents: 0, urgentIncidents: 0 });
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showResolveDialog, setShowResolveDialog] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [newIncident, setNewIncident] = useState({
    incidentType: '',
    severity: 'MEDIUM',
    description: '',
    location: '',
    requiresAssistance: false
  });

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const [incidentsData, statsData] = await Promise.all([
        tripService.getTripIncidents(tripId),
        tripService.getIncidentStats(tripId)
      ]);
      setIncidents(incidentsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching incidents:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tripId) {
      fetchIncidents();
    }
  }, [tripId]);

  const handleCreateIncident = async () => {
    try {
      await tripService.reportIncident(tripId, newIncident);
      setShowCreateDialog(false);
      setNewIncident({
        incidentType: '',
        severity: 'MEDIUM',
        description: '',
        location: '',
        requiresAssistance: false
      });
      fetchIncidents();
    } catch (error) {
      console.error('Error creating incident:', error);
    }
  };

  const handleResolveIncident = async (resolutionNotes) => {
    try {
      await tripService.updateIncident(tripId, selectedIncident.id, {
        resolved: true,
        resolutionNotes
      });
      setShowResolveDialog(false);
      setSelectedIncident(null);
      fetchIncidents();
    } catch (error) {
      console.error('Error resolving incident:', error);
    }
  };

  const handleDeleteIncident = async (incidentId) => {
    if (window.confirm('Are you sure you want to delete this incident?')) {
      try {
        await tripService.deleteIncident(tripId, incidentId);
        fetchIncidents();
      } catch (error) {
        console.error('Error deleting incident:', error);
      }
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={2}>
        <CircularProgress size={30} />
      </Box>
    );
  }

  return (
    <Box>
      {/* Stats Cards - Compact */}
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={4}>
          <StatCard title="Total Incidents" value={stats.totalIncidents} color="primary" />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard title="Active Incidents" value={stats.activeIncidents} color="warning" />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard title="Urgent Incidents" value={stats.urgentIncidents} color="error" />
        </Grid>
      </Grid>

      {/* Header - Compact */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
        <Typography variant="subtitle1" fontWeight="600" sx={{ fontSize: '0.9rem' }}>
          Incidents for Trip #{tripNumber}
        </Typography>
        <Stack direction="row" spacing={0.75}>
          <Button
            startIcon={<RefreshIcon sx={{ fontSize: '0.9rem' }} />}
            onClick={fetchIncidents}
            variant="outlined"
            size="small"
            sx={{ fontSize: '0.75rem', py: 0.5 }}
          >
            Refresh
          </Button>
          <Button
            startIcon={<AddIcon sx={{ fontSize: '0.9rem' }} />}
            onClick={() => setShowCreateDialog(true)}
            variant="contained"
            color="primary"
            size="small"
            sx={{ fontSize: '0.75rem', py: 0.5 }}
          >
            Report Incident
          </Button>
        </Stack>
      </Box>

      {/* Incidents Table - Compact */}
      <TableContainer component={Paper} sx={{ borderRadius: 1 }}>
        <Table size="small">
          <TableHead sx={{ bgcolor: '#f5f5f5' }}>
            <TableRow>
              <TableCell sx={{ fontSize: '0.7rem', fontWeight: 600, py: 1 }}>Type</TableCell>
              <TableCell sx={{ fontSize: '0.7rem', fontWeight: 600, py: 1 }}>Severity</TableCell>
              <TableCell sx={{ fontSize: '0.7rem', fontWeight: 600, py: 1 }}>Description</TableCell>
              <TableCell sx={{ fontSize: '0.7rem', fontWeight: 600, py: 1 }}>Location</TableCell>
              <TableCell sx={{ fontSize: '0.7rem', fontWeight: 600, py: 1 }}>Reported At</TableCell>
              <TableCell sx={{ fontSize: '0.7rem', fontWeight: 600, py: 1 }}>Status</TableCell>
              <TableCell sx={{ fontSize: '0.7rem', fontWeight: 600, py: 1 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {incidents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 2 }}>
                  <Typography color="textSecondary" sx={{ fontSize: '0.8rem' }}>
                    No incidents reported for this trip
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              incidents.map(incident => (
                <TableRow key={incident.id} hover>
                  <TableCell sx={{ fontSize: '0.75rem', py: 0.75 }}>
                    <Typography fontWeight="500" sx={{ fontSize: '0.75rem' }}>
                      {incident.incidentType}
                      {incident.requiresAssistance && (
                        <Tooltip title="Requires Assistance">
                          <WarningIcon color="error" sx={{ ml: 0.5, fontSize: 14 }} />
                        </Tooltip>
                      )}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', py: 0.75 }}>
                    <Chip
                      label={incident.severity}
                      color={severityColors[incident.severity] || 'default'}
                      size="small"
                      sx={{ height: 20, fontSize: '0.6rem' }}
                    />
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', py: 0.75 }}>
                    <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                      {incident.description}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', py: 0.75 }}>
                    {incident.location || 'N/A'}
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', py: 0.75 }}>
                    {new Date(incident.reportedAt).toLocaleString()}
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', py: 0.75 }}>
                    <Chip
                      label={incident.resolved ? 'Resolved' : 'Active'}
                      color={incident.resolved ? 'success' : 'warning'}
                      size="small"
                      sx={{ height: 20, fontSize: '0.6rem' }}
                    />
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', py: 0.75 }}>
                    <Stack direction="row" spacing={0.25}>
                      {!incident.resolved && (
                        <Tooltip title="Resolve Incident">
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => {
                              setSelectedIncident(incident);
                              setShowResolveDialog(true);
                            }}
                            sx={{ p: 0.5 }}
                          >
                            <CheckCircleIcon sx={{ fontSize: '0.9rem' }} />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Delete Incident">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteIncident(incident.id)}
                          sx={{ p: 0.5 }}
                        >
                          <DeleteIcon sx={{ fontSize: '0.9rem' }} />
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

      {/* Create Incident Dialog - Compact */}
      <Dialog 
        open={showCreateDialog} 
        onClose={() => setShowCreateDialog(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: { borderRadius: 1.5 }
        }}
      >
        <DialogTitle sx={{ py: 1.5, px: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
            Report New Incident
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ p: 2 }}>
          <Stack spacing={1.5} sx={{ mt: 1 }}>
            <TextField
              label="Incident Type"
              value={newIncident.incidentType}
              onChange={(e) => setNewIncident({...newIncident, incidentType: e.target.value})}
              required
              fullWidth
              size="small"
              sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
            />
            <FormControl fullWidth size="small">
              <InputLabel sx={{ fontSize: '0.75rem' }}>Severity</InputLabel>
              <Select
                value={newIncident.severity}
                label="Severity"
                onChange={(e) => setNewIncident({...newIncident, severity: e.target.value})}
                sx={{ fontSize: '0.75rem' }}
              >
                <MenuItem value="LOW" sx={{ fontSize: '0.75rem' }}>Low</MenuItem>
                <MenuItem value="MEDIUM" sx={{ fontSize: '0.75rem' }}>Medium</MenuItem>
                <MenuItem value="HIGH" sx={{ fontSize: '0.75rem' }}>High</MenuItem>
                <MenuItem value="CRITICAL" sx={{ fontSize: '0.75rem' }}>Critical</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Description"
              value={newIncident.description}
              onChange={(e) => setNewIncident({...newIncident, description: e.target.value})}
              multiline
              rows={3}
              required
              fullWidth
              size="small"
              sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
            />
            <TextField
              label="Location (Optional)"
              value={newIncident.location}
              onChange={(e) => setNewIncident({...newIncident, location: e.target.value})}
              fullWidth
              size="small"
              sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
          <Button 
            onClick={() => setShowCreateDialog(false)}
            size="small"
            sx={{ fontSize: '0.8rem' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateIncident}
            variant="contained"
            disabled={!newIncident.incidentType || !newIncident.description}
            size="small"
            sx={{ fontSize: '0.8rem' }}
          >
            Report Incident
          </Button>
        </DialogActions>
      </Dialog>

      {/* Resolve Incident Dialog - Compact */}
      <Dialog 
        open={showResolveDialog} 
        onClose={() => setShowResolveDialog(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: { borderRadius: 1.5 }
        }}
      >
        <DialogTitle sx={{ py: 1.5, px: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
            Resolve Incident
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ p: 2 }}>
          <Stack spacing={1.5} sx={{ mt: 1 }}>
            <Alert severity="info" sx={{ fontSize: '0.8rem' }}>
              Resolving incident: <strong>{selectedIncident?.incidentType}</strong>
            </Alert>
            <TextField
              label="Resolution Notes"
              multiline
              rows={3}
              fullWidth
              onChange={(e) => setSelectedIncident({
                ...selectedIncident,
                resolutionNotes: e.target.value
              })}
              size="small"
              sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
          <Button 
            onClick={() => setShowResolveDialog(false)}
            size="small"
            sx={{ fontSize: '0.8rem' }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => handleResolveIncident(selectedIncident?.resolutionNotes)}
            variant="contained"
            color="success"
            size="small"
            sx={{ fontSize: '0.8rem' }}
          >
            Mark as Resolved
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TripIncidents;
