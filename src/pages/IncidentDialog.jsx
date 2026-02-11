import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Box, Typography,
  Alert, Stack, FormControl, InputLabel, Select, MenuItem,
  RadioGroup, FormControlLabel, Radio
} from '@mui/material';
import {
  Warning as WarningIcon,
  Report as ReportIcon
} from '@mui/icons-material';

const INCIDENT_TYPES = [
  { value: 'ACCIDENT', label: 'Accident' },
  { value: 'BREAKDOWN', label: 'Vehicle Breakdown' },
  { value: 'TRAFFIC', label: 'Traffic Delay' },
  { value: 'WEATHER', label: 'Weather Conditions' },
  { value: 'HEALTH', label: 'Health/Medical' },
  { value: 'REST', label: 'Rest Break' },
  { value: 'FUEL_STOP', label: 'Fuel Stop' },
  { value: 'LOADING', label: 'Loading/Unloading Delay' },
  { value: 'DOCUMENT', label: 'Document Issues' },
  { value: 'OTHER', label: 'Other' }
];

const INCIDENT_SEVERITY = [
  { value: 'LOW', label: 'Low - Minor delay' },
  { value: 'MEDIUM', label: 'Medium - Significant delay' },
  { value: 'HIGH', label: 'High - Major issue' },
  { value: 'CRITICAL', label: 'Critical - Safety/emergency' }
];

const IncidentDialog = ({ open, onClose, onSubmit, trip }) => {
  const [incidentType, setIncidentType] = useState('');
  const [customType, setCustomType] = useState('');
  const [severity, setSeverity] = useState('MEDIUM');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [requiresAssistance, setRequiresAssistance] = useState('NO');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!incidentType) {
      setError('Please select incident type');
      return;
    }

    const incidentData = {
      incidentType: incidentType === 'OTHER' ? customType : incidentType,
      severity,
      description: description.trim(),
      location: location.trim() || undefined,
      requiresAssistance: requiresAssistance === 'YES',
      reportedAt: new Date().toISOString()
    };

    onSubmit(incidentData);
  };

  const handleClose = () => {
    setIncidentType('');
    setCustomType('');
    setSeverity('MEDIUM');
    setDescription('');
    setLocation('');
    setRequiresAssistance('NO');
    setError('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <WarningIcon color="warning" />
          <Typography variant="h6">Report Incident</Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          <Alert severity="info">
            Reporting incident for trip: <strong>#{trip.tripNumber}</strong>
          </Alert>

          {error && (
            <Alert severity="error">{error}</Alert>
          )}

          <FormControl fullWidth required>
            <InputLabel>Incident Type</InputLabel>
            <Select
              value={incidentType}
              label="Incident Type"
              onChange={(e) => setIncidentType(e.target.value)}
            >
              {INCIDENT_TYPES.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {incidentType === 'OTHER' && (
            <TextField
              fullWidth
              label="Custom Incident Type"
              value={customType}
              onChange={(e) => setCustomType(e.target.value)}
              required
              helperText="Please specify the incident type"
            />
          )}

          <FormControl fullWidth>
            <InputLabel>Severity Level</InputLabel>
            <Select
              value={severity}
              label="Severity Level"
              onChange={(e) => setSeverity(e.target.value)}
            >
              {INCIDENT_SEVERITY.map((sev) => (
                <MenuItem key={sev.value} value={sev.value}>
                  {sev.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Location (Optional)"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            helperText="Where did the incident occur?"
          />

          <TextField
            fullWidth
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            multiline
            rows={3}
            required
            helperText="Describe what happened"
          />

          <FormControl component="fieldset">
            <Typography variant="subtitle2" gutterBottom>
              Does this incident require immediate assistance?
            </Typography>
            <RadioGroup
              row
              value={requiresAssistance}
              onChange={(e) => setRequiresAssistance(e.target.value)}
            >
              <FormControlLabel value="NO" control={<Radio />} label="No" />
              <FormControlLabel value="YES" control={<Radio />} label="Yes - Urgent" />
            </RadioGroup>
          </FormControl>
        </Stack>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="warning"
          startIcon={<ReportIcon />}
          disabled={!incidentType || !description}
        >
          Report Incident
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default IncidentDialog;
