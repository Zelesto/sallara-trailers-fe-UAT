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

const severityColors = {
  LOW: 'success',
  MEDIUM: 'warning',
  HIGH: 'error',
  CRITICAL: 'error'
};

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
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography color="textSecondary" gutterBottom>
                Total Incidents
              </Typography>
              <Typography variant="h4">
                {stats.totalIncidents}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography color="textSecondary" gutterBottom>
                Active Incidents
              </Typography>
              <Typography variant="h4" color="warning.main">
                {stats.activeIncidents}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography color="textSecondary" gutterBottom>
                Urgent Incidents
              </Typography>
              <Typography variant="h4" color="error.main">
                {stats.urgentIncidents}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">
          Incidents for Trip #{tripNumber}
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button
            startIcon={<RefreshIcon />}
            onClick={fetchIncidents}
            variant="outlined"
          >
            Refresh
          </Button>
          <Button
            startIcon={<AddIcon />}
            onClick={() => setShowCreateDialog(true)}
            variant="contained"
            color="primary"
          >
            Report Incident
          </Button>
        </Stack>
      </Box>

      {/* Incidents Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Type</TableCell>
              <TableCell>Severity</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Reported At</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {incidents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                  <Typography color="textSecondary">
                    No incidents reported for this trip
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              incidents.map(incident => (
                <TableRow key={incident.id}>
                  <TableCell>
                    <Typography fontWeight="medium">
                      {incident.incidentType}
                      {incident.requiresAssistance && (
                        <Tooltip title="Requires Assistance">
                          <WarningIcon color="error" sx={{ ml: 1, fontSize: 16 }} />
                        </Tooltip>
                      )}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={incident.severity}
                      color={severityColors[incident.severity] || 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {incident.description}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {incident.location || 'N/A'}
                  </TableCell>
                  <TableCell>
                    {new Date(incident.reportedAt).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={incident.resolved ? 'Resolved' : 'Active'}
                      color={incident.resolved ? 'success' : 'warning'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.5}>
                      {!incident.resolved && (
                        <Tooltip title="Resolve Incident">
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => {
                              setSelectedIncident(incident);
                              setShowResolveDialog(true);
                            }}
                          >
                            <CheckCircleIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Delete Incident">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteIncident(incident.id)}
                        >
                          <DeleteIcon fontSize="small" />
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

      {/* Create Incident Dialog */}
      <Dialog open={showCreateDialog} onClose={() => setShowCreateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Report New Incident</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Incident Type"
              value={newIncident.incidentType}
              onChange={(e) => setNewIncident({...newIncident, incidentType: e.target.value})}
              required
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Severity</InputLabel>
              <Select
                value={newIncident.severity}
                label="Severity"
                onChange={(e) => setNewIncident({...newIncident, severity: e.target.value})}
              >
                <MenuItem value="LOW">Low</MenuItem>
                <MenuItem value="MEDIUM">Medium</MenuItem>
                <MenuItem value="HIGH">High</MenuItem>
                <MenuItem value="CRITICAL">Critical</MenuItem>
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
            />
            <TextField
              label="Location (Optional)"
              value={newIncident.location}
              onChange={(e) => setNewIncident({...newIncident, location: e.target.value})}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCreateDialog(false)}>Cancel</Button>
          <Button
            onClick={handleCreateIncident}
            variant="contained"
            disabled={!newIncident.incidentType || !newIncident.description}
          >
            Report Incident
          </Button>
        </DialogActions>
      </Dialog>

      {/* Resolve Incident Dialog */}
      <Dialog open={showResolveDialog} onClose={() => setShowResolveDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Resolve Incident</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Alert severity="info">
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
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowResolveDialog(false)}>Cancel</Button>
          <Button
            onClick={() => handleResolveIncident(selectedIncident?.resolutionNotes)}
            variant="contained"
            color="success"
          >
            Mark as Resolved
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TripIncidents;
