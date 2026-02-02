import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  IconButton,
  Alert,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  History as HistoryIcon,
  Search,
  FilterList,
  Download,
  Restore,
  Security,
  Person,
  CalendarMonth,
  Computer,
  Warning,
  CheckCircle,
  Error,
  Info,
  Delete,
  Visibility,
} from '@mui/icons-material';

const Logs = () => {
  const [tabValue, setTabValue] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [selectedLog, setSelectedLog] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  // Mock data - completed
  const auditLogs = [
    { id: 1, timestamp: '2024-01-23 09:15:32', user: 'admin@logistics.local', action: 'Login', severity: 'info', ip: '192.168.1.100', details: 'Successful login', resource: 'Authentication', device: 'Desktop Computer' },
    { id: 2, timestamp: '2024-01-23 09:30:45', user: 'driver.john@logistics.local', action: 'Fuel Slip Created', severity: 'info', ip: '192.168.1.105', details: 'Created fuel slip #FS2024001', resource: 'Fuel Management', device: 'Mobile App' },
    { id: 3, timestamp: '2024-01-23 10:15:20', user: 'admin@logistics.local', action: 'User Modified', severity: 'warning', ip: '192.168.1.100', details: 'Updated driver permissions for user driver.john', resource: 'User Management', device: 'Desktop Computer' },
    { id: 4, timestamp: '2024-01-23 11:05:18', user: 'system', action: 'System Backup', severity: 'info', ip: '192.168.1.1', details: 'Automated daily backup completed. Size: 2.3GB', resource: 'System', device: 'Server' },
    { id: 5, timestamp: '2024-01-23 12:30:55', user: 'dispatcher@logistics.local', action: 'Failed Login', severity: 'error', ip: '192.168.1.110', details: '3 failed login attempts from IP 192.168.1.110', resource: 'Authentication', device: 'Web Browser' },
    { id: 6, timestamp: '2024-01-23 14:20:10', user: 'admin@logistics.local', action: 'Settings Updated', severity: 'info', ip: '192.168.1.100', details: 'Updated system configuration - changed fuel price threshold', resource: 'System', device: 'Desktop Computer' },
    { id: 7, timestamp: '2024-01-23 15:45:33', user: 'driver.jane@logistics.local', action: 'Fuel Slip Finalized', severity: 'success', ip: '192.168.1.115', details: 'Finalized fuel slip #FS2024002 with 45.6 liters', resource: 'Fuel Management', device: 'Mobile App' },
    { id: 8, timestamp: '2024-01-23 16:30:22', user: 'admin@logistics.local', action: 'Data Export', severity: 'info', ip: '192.168.1.100', details: 'Exported monthly fuel report for January 2024', resource: 'Reports', device: 'Desktop Computer' },
    { id: 9, timestamp: '2024-01-23 17:15:45', user: 'system', action: 'Security Alert', severity: 'error', ip: '192.168.1.1', details: 'Multiple failed login attempts detected from suspicious IP', resource: 'Security', device: 'Firewall' },
    { id: 10, timestamp: '2024-01-23 18:00:12', user: 'manager@logistics.local', action: 'Report Generated', severity: 'success', ip: '192.168.1.120', details: 'Generated driver performance report Q4-2023', resource: 'Reports', device: 'Laptop' },
  ];

  const systemLogs = [
    { id: 1, timestamp: '2024-01-23 06:00:00', component: 'Backup Service', severity: 'info', message: 'Scheduled backup started', status: 'completed' },
    { id: 2, timestamp: '2024-01-23 06:30:00', component: 'Database', severity: 'success', message: 'Database maintenance completed successfully', status: 'completed' },
    { id: 3, timestamp: '2024-01-23 08:45:22', component: 'API Gateway', severity: 'warning', message: 'High latency detected on /api/fuel endpoint', status: 'warning' },
    { id: 4, timestamp: '2024-01-23 12:00:00', component: 'Email Service', severity: 'error', message: 'Failed to send scheduled reports', status: 'failed' },
    { id: 5, timestamp: '2024-01-23 15:20:10', component: 'Cache Service', severity: 'info', message: 'Cache cleared successfully', status: 'completed' },
  ];

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'success': return <CheckCircle sx={{ color: 'success.main', mr: 1 }} />;
      case 'warning': return <Warning sx={{ color: 'warning.main', mr: 1 }} />;
      case 'error': return <Error sx={{ color: 'error.main', mr: 1 }} />;
      default: return <Info sx={{ color: 'info.main', mr: 1 }} />;
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'success': return 'success';
      case 'warning': return 'warning';
      case 'error': return 'error';
      default: return 'info';
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleSearch = (event) => {
    setSearchQuery(event.target.value);
  };

  const handleSeverityFilterChange = (event) => {
    setSeverityFilter(event.target.value);
  };

  const handleViewLog = (log) => {
    setSelectedLog(log);
    setViewDialogOpen(true);
  };

  const handleDeleteLog = (log) => {
    setSelectedLog(log);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    // In a real application, this would call an API to delete the log
    console.log('Deleting log:', selectedLog);
    setDeleteDialogOpen(false);
    setSelectedLog(null);
  };

  const filteredAuditLogs = auditLogs.filter(log => {
    const matchesSearch = searchQuery === '' ||
      Object.values(log).some(value =>
        value.toString().toLowerCase().includes(searchQuery.toLowerCase())
      );
    const matchesSeverity = severityFilter === 'all' || log.severity === severityFilter;
    return matchesSearch && matchesSeverity;
  });

  const filteredSystemLogs = systemLogs.filter(log => {
    const matchesSearch = searchQuery === '' ||
      Object.values(log).some(value =>
        value.toString().toLowerCase().includes(searchQuery.toLowerCase())
      );
    const matchesSeverity = severityFilter === 'all' || log.severity === severityFilter;
    return matchesSearch && matchesSeverity;
  });

  const handleExportLogs = () => {
    const logs = tabValue === 0 ? auditLogs : systemLogs;
    const csvContent = [
      ['ID', 'Timestamp', 'User/Component', 'Action/Message', 'Severity', 'IP/Status', 'Details'],
      ...logs.map(log => [
        log.id,
        log.timestamp,
        tabValue === 0 ? log.user : log.component,
        tabValue === 0 ? log.action : log.message,
        log.severity,
        tabValue === 0 ? log.ip : log.status,
        log.details || log.message
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${tabValue === 0 ? 'audit' : 'system'}_logs_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h4" gutterBottom>
              <HistoryIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
              System Logs
            </Typography>
            <Button
              variant="contained"
              startIcon={<Download />}
              onClick={handleExportLogs}
            >
              Export Logs
            </Button>
          </Box>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={tabValue} onChange={handleTabChange}>
                  <Tab
                    icon={<Security />}
                    iconPosition="start"
                    label="Audit Logs"
                  />
                  <Tab
                    icon={<Computer />}
                    iconPosition="start"
                    label="System Logs"
                  />
                </Tabs>
              </Box>

              {/* Filters and Search */}
              <Grid container spacing={2} sx={{ mt: 2, mb: 3 }}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    placeholder="Search logs..."
                    value={searchQuery}
                    onChange={handleSearch}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Severity Filter</InputLabel>
                    <Select
                      value={severityFilter}
                      label="Severity Filter"
                      onChange={handleSeverityFilterChange}
                    >
                      <MenuItem value="all">All Severities</MenuItem>
                      <MenuItem value="info">Info</MenuItem>
                      <MenuItem value="success">Success</MenuItem>
                      <MenuItem value="warning">Warning</MenuItem>
                      <MenuItem value="error">Error</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<Restore />}
                    onClick={() => {
                      setSearchQuery('');
                      setSeverityFilter('all');
                    }}
                  >
                    Reset Filters
                  </Button>
                </Grid>
              </Grid>

              {/* Statistics */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6} sm={3}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h6" color="info.main">
                      {auditLogs.length}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Total Audit Logs
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h6" color="success.main">
                      {auditLogs.filter(l => l.severity === 'success').length}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Successful Actions
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h6" color="warning.main">
                      {auditLogs.filter(l => l.severity === 'warning').length}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Warnings
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h6" color="error.main">
                      {auditLogs.filter(l => l.severity === 'error').length}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Errors
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              {/* Logs Table */}
              <TableContainer component={Paper} sx={{ maxHeight: 500 }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Timestamp</TableCell>
                      {tabValue === 0 ? (
                        <>
                          <TableCell>User</TableCell>
                          <TableCell>Action</TableCell>
                          <TableCell>Severity</TableCell>
                          <TableCell>IP Address</TableCell>
                        </>
                      ) : (
                        <>
                          <TableCell>Component</TableCell>
                          <TableCell>Message</TableCell>
                          <TableCell>Severity</TableCell>
                          <TableCell>Status</TableCell>
                        </>
                      )}
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(tabValue === 0 ? filteredAuditLogs : filteredSystemLogs).map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            <CalendarMonth sx={{ mr: 1, color: 'text.secondary' }} />
                            {log.timestamp}
                          </Box>
                        </TableCell>
                        {tabValue === 0 ? (
                          <>
                            <TableCell>
                              <Box display="flex" alignItems="center">
                                <Person sx={{ mr: 1, color: 'text.secondary' }} />
                                {log.user}
                              </Box>
                            </TableCell>
                            <TableCell>{log.action}</TableCell>
                          </>
                        ) : (
                          <>
                            <TableCell>{log.component}</TableCell>
                            <TableCell>{log.message}</TableCell>
                          </>
                        )}
                        <TableCell>
                          <Chip
                            icon={getSeverityIcon(log.severity)}
                            label={log.severity.toUpperCase()}
                            color={getSeverityColor(log.severity)}
                            variant="outlined"
                            size="small"
                          />
                        </TableCell>
                        {tabValue === 0 ? (
                          <TableCell>
                            <Box display="flex" alignItems="center">
                              <Computer sx={{ mr: 1, color: 'text.secondary' }} />
                              {log.ip}
                            </Box>
                          </TableCell>
                        ) : (
                          <TableCell>
                            <Chip
                              label={log.status}
                              color={log.status === 'completed' ? 'success' : log.status === 'warning' ? 'warning' : 'error'}
                              size="small"
                            />
                          </TableCell>
                        )}
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => handleViewLog(log)}
                            title="View Details"
                          >
                            <Visibility fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteLog(log)}
                            title="Delete Log"
                            color="error"
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {filteredAuditLogs.length === 0 && tabValue === 0 && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  No audit logs found matching your filters.
                </Alert>
              )}

              {filteredSystemLogs.length === 0 && tabValue === 1 && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  No system logs found matching your filters.
                </Alert>
              )}

              {/* Log Details Dialog */}
              <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md">
                <DialogTitle>Log Details</DialogTitle>
                <DialogContent>
                  {selectedLog && (
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" color="textSecondary">
                          Timestamp
                        </Typography>
                        <Typography variant="body1">
                          {selectedLog.timestamp}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="subtitle2" color="textSecondary">
                          {tabValue === 0 ? 'User' : 'Component'}
                        </Typography>
                        <Typography variant="body1">
                          {tabValue === 0 ? selectedLog.user : selectedLog.component}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="subtitle2" color="textSecondary">
                          Severity
                        </Typography>
                        <Chip
                          icon={getSeverityIcon(selectedLog.severity)}
                          label={selectedLog.severity.toUpperCase()}
                          color={getSeverityColor(selectedLog.severity)}
                          sx={{ mt: 0.5 }}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" color="textSecondary">
                          {tabValue === 0 ? 'Action' : 'Message'}
                        </Typography>
                        <Typography variant="body1">
                          {tabValue === 0 ? selectedLog.action : selectedLog.message}
                        </Typography>
                      </Grid>
                      {tabValue === 0 ? (
                        <Grid item xs={6}>
                          <Typography variant="subtitle2" color="textSecondary">
                            IP Address
                          </Typography>
                          <Typography variant="body1">
                            {selectedLog.ip}
                          </Typography>
                        </Grid>
                      ) : (
                        <Grid item xs={6}>
                          <Typography variant="subtitle2" color="textSecondary">
                            Status
                          </Typography>
                          <Chip
                            label={selectedLog.status}
                            color={selectedLog.status === 'completed' ? 'success' : 'error'}
                            size="small"
                          />
                        </Grid>
                      )}
                      <Grid item xs={tabValue === 0 ? 6 : 12}>
                        <Typography variant="subtitle2" color="textSecondary">
                          Details
                        </Typography>
                        <Typography variant="body1">
                          {selectedLog.details || selectedLog.message}
                        </Typography>
                      </Grid>
                      {selectedLog.device && (
                        <Grid item xs={6}>
                          <Typography variant="subtitle2" color="textSecondary">
                            Device
                          </Typography>
                          <Typography variant="body1">
                            {selectedLog.device}
                          </Typography>
                        </Grid>
                      )}
                      {selectedLog.resource && (
                        <Grid item xs={6}>
                          <Typography variant="subtitle2" color="textSecondary">
                            Resource
                          </Typography>
                          <Typography variant="body1">
                            {selectedLog.resource}
                          </Typography>
                        </Grid>
                      )}
                    </Grid>
                  )}
                </DialogContent>
                <DialogActions>
                  <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
                </DialogActions>
              </Dialog>

              {/* Delete Confirmation Dialog */}
              <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                <DialogTitle>Delete Log Entry</DialogTitle>
                <DialogContent>
                  <Typography>
                    Are you sure you want to delete this log entry? This action cannot be undone.
                  </Typography>
                  {selectedLog && (
                    <Alert severity="warning" sx={{ mt: 2 }}>
                      Log ID: {selectedLog.id} - {selectedLog.timestamp}
                    </Alert>
                  )}
                </DialogContent>
                <DialogActions>
                  <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleConfirmDelete} color="error" variant="contained">
                    Delete
                  </Button>
                </DialogActions>
              </Dialog>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Logs;