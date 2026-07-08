// src/pages/SettingsPage.jsx
import React, { useState, useEffect } from "react";
import {
  Box, Card, CardContent, Typography,
  TextField, Button, Alert, Tabs, Tab,
  CircularProgress, Snackbar, Divider, Chip,
  Stack, IconButton, Tooltip, Paper,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TablePagination,
  Dialog, DialogTitle, DialogContent, DialogActions,
  FormControl, InputLabel, Select, MenuItem,
  Switch, FormControlLabel, Grid
} from "@mui/material";
import {
  Person as PersonIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  Security as SecurityIcon,
  People as PeopleIcon,
  VpnKey as VpnKeyIcon,
  Edit as EditIcon,
  Inventory as InventoryIcon,
  LocalGasStation as GasStationIcon,
  CreditCard as CreditCardIcon,
  DirectionsCar as CarIcon,
  DriveEta as DriverIcon,
  Category as CategoryIcon,
  ToggleOn as ToggleOnIcon,
  ToggleOff as ToggleOffIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon
} from "@mui/icons-material";
import authService from "../services/auth";
import userService from "../services/user";
import driverService from "../services/driverService";
import { enumService } from "../services/enumService";
import DriverList from "./DriverList";
import { useNavigate } from "react-router-dom";

// Compact User Item Component
const UserItem = ({ user, onDelete }) => {
  const roles = user?.roles || [];
  
  return (
    <Paper
      sx={{
        p: 1.5,
        mb: 1,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        '&:hover': {
          bgcolor: 'action.hover',
          borderColor: 'primary.main'
        }
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            bgcolor: 'primary.light',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'primary.main'
          }}
        >
          <PersonIcon sx={{ fontSize: '1.1rem' }} />
        </Box>
        <Box>
          <Typography variant="body2" fontWeight="600" sx={{ fontSize: '0.8rem' }}>
            {user?.username || user?.firstName || 'Unknown User'}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
            {user?.email || 'No email'}
          </Typography>
          {roles.length > 0 && (
            <Box sx={{ mt: 0.25 }}>
              {roles.map((role, index) => (
                <Chip
                  key={index}
                  label={typeof role === 'string' ? role : (role?.name || role?.role || 'Unknown')}
                  size="small"
                  sx={{ height: 16, fontSize: '0.5rem', mr: 0.25 }}
                />
              ))}
            </Box>
          )}
        </Box>
      </Stack>
      <Tooltip title="Delete User">
        <IconButton
          color="error"
          size="small"
          onClick={() => onDelete(user?.id)}
          sx={{ p: 0.5 }}
        >
          <DeleteIcon sx={{ fontSize: '0.9rem' }} />
        </IconButton>
      </Tooltip>
    </Paper>
  );
};

// Enum Management Component
const EnumManagement = ({ tenantId }) => {
  const [enums, setEnums] = useState([]);
  const [enumTypes, setEnumTypes] = useState([]);
  const [selectedType, setSelectedType] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEnum, setEditingEnum] = useState(null);
  const [formData, setFormData] = useState({
    enumType: '',
    value: '',
    displayName: '',
    description: '',
    icon: '',
    color: '#1976D2',
    sortOrder: 0
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);

  // Enum type configuration with icons and labels
  const enumTypeConfig = {
    VEHICLE_TYPE: { label: 'Vehicle Types', icon: <CarIcon />, description: 'Types of vehicles in the fleet' },
    VEHICLE_STATUS: { label: 'Vehicle Statuses', icon: <CarIcon />, description: 'Status states for vehicles' },
    DRIVER_STATUS: { label: 'Driver Statuses', icon: <DriverIcon />, description: 'Status states for drivers' },
    LOAD_STATUS: { label: 'Load Statuses', icon: <InventoryIcon />, description: 'Status states for loads' },
  };

  const loadEnumTypes = async () => {
    try {
      const response = await enumService.getEnumTypes(tenantId);
      // Handle different response formats
      let types = [];
      if (Array.isArray(response)) {
        types = response;
      } else if (response?.data && Array.isArray(response.data)) {
        types = response.data;
      } else if (response?.content && Array.isArray(response.content)) {
        types = response.content;
      } else {
        // If response is an object with keys, extract them
        types = Object.keys(response).filter(key => !key.startsWith('_'));
      }
      
      setEnumTypes(types);
      if (types.length > 0 && !selectedType) {
        setSelectedType(types[0]);
      }
    } catch (err) {
      console.error('Error loading enum types:', err);
      setError('Failed to load enum types');
      // Set default types as fallback
      const defaultTypes = ['VEHICLE_TYPE', 'VEHICLE_STATUS', 'DRIVER_STATUS', 'LOAD_STATUS'];
      setEnumTypes(defaultTypes);
      if (!selectedType) {
        setSelectedType(defaultTypes[0]);
      }
    }
  };

  useEffect(() => {
    loadEnumTypes();
  }, [tenantId]);

  useEffect(() => {
    if (selectedType) {
      loadEnums();
    }
  }, [selectedType]);

  const handleOpenDialog = (enumItem = null) => {
    if (enumItem) {
      setEditingEnum(enumItem);
      setFormData({
        enumType: enumItem.enumType,
        value: enumItem.value,
        displayName: enumItem.displayName,
        description: enumItem.description || '',
        icon: enumItem.icon || '',
        color: enumItem.color || '#1976D2',
        sortOrder: enumItem.sortOrder || 0
      });
    } else {
      setEditingEnum(null);
      setFormData({
        enumType: selectedType,
        value: '',
        displayName: '',
        description: '',
        icon: '',
        color: '#1976D2',
        sortOrder: enums.length + 1
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingEnum(null);
    setFormData({
      enumType: selectedType,
      value: '',
      displayName: '',
      description: '',
      icon: '',
      color: '#1976D2',
      sortOrder: 0
    });
  };

  const handleSubmit = async () => {
    try {
      setError(null);
      
      if (editingEnum) {
        await enumService.updateCustomEnum(editingEnum.id, formData, tenantId);
        setSuccess('Enum updated successfully');
      } else {
        await enumService.addCustomEnum(formData, tenantId);
        setSuccess('Enum added successfully');
      }
      
      handleCloseDialog();
      await loadEnums();
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error saving enum:', err);
      setError(err.response?.data?.message || 'Failed to save enum');
    }
  };

  const handleDeleteEnum = async (id) => {
    if (!window.confirm('Are you sure you want to delete this enum?')) return;
    
    try {
      await enumService.deleteCustomEnum(id, selectedType, tenantId);
      setSuccess('Enum deleted successfully');
      await loadEnums();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error deleting enum:', err);
      setError(err.response?.data?.message || 'Failed to delete enum');
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      await enumService.toggleEnumStatus(id, selectedType, tenantId);
      await loadEnums();
    } catch (err) {
      console.error('Error toggling enum status:', err);
      setError(err.response?.data?.message || 'Failed to toggle enum status');
    }
  };

  const getIconForEnumType = (type) => {
    return enumTypeConfig[type]?.icon || <CategoryIcon />;
  };

  const getLabelForEnumType = (type) => {
    return enumTypeConfig[type]?.label || type?.replace(/_/g, ' ') || '';
  };

  const getDescriptionForEnumType = (type) => {
    return enumTypeConfig[type]?.description || '';
  };

  return (
    <Box>
      {success && (
        <Alert severity="success" sx={{ mb: 2, fontSize: '0.8rem' }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2, fontSize: '0.8rem' }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Enum Type Selector */}
      <Paper sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ fontSize: '0.75rem' }}>Select Enum Type</InputLabel>
              <Select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                label="Select Enum Type"
                sx={{ fontSize: '0.75rem' }}
              >
                {enumTypes.map((type) => (
                  <MenuItem key={type} value={type} sx={{ fontSize: '0.75rem' }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      {getIconForEnumType(type)}
                      <span>{getLabelForEnumType(type)}</span>
                    </Stack>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <Stack direction="row" spacing={1} justifyContent={{ xs: 'flex-start', md: 'flex-end' }}>
              <Tooltip title="Refresh">
                <IconButton size="small" onClick={loadEnums}>
                  <RefreshIcon sx={{ fontSize: '0.9rem' }} />
                </IconButton>
              </Tooltip>
              <Button
                variant="contained"
                startIcon={<AddIcon sx={{ fontSize: '0.9rem' }} />}
                onClick={() => handleOpenDialog()}
                size="small"
                sx={{ fontSize: '0.75rem' }}
              >
                Add New
              </Button>
            </Stack>
          </Grid>
        </Grid>
        {selectedType && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', fontSize: '0.65rem' }}>
            {getDescriptionForEnumType(selectedType)}
          </Typography>
        )}
      </Paper>

      {/* Enums Table */}
      <Paper sx={{ overflow: 'hidden' }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600, py: 1 }}>Value</TableCell>
                <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600, py: 1 }}>Display Name</TableCell>
                <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600, py: 1 }}>Icon</TableCell>
                <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600, py: 1 }}>Color</TableCell>
                <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600, py: 1 }}>Description</TableCell>
                <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600, py: 1 }} align="center">Status</TableCell>
                <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600, py: 1 }} align="center">System</TableCell>
                <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600, py: 1 }} align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={30} />
                  </TableCell>
                </TableRow>
              ) : enums.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                      No enums found for {getLabelForEnumType(selectedType)}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                enums.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((enumItem) => (
                  <TableRow key={enumItem.id || enumItem.value} hover>
                    <TableCell sx={{ fontSize: '0.75rem', py: 0.5 }}>
                      <Chip
                        label={enumItem.value}
                        size="small"
                        sx={{
                          fontSize: '0.6rem',
                          height: 20,
                          backgroundColor: enumItem.isSystem ? 'grey.100' : 'primary.light',
                          color: enumItem.isSystem ? 'text.secondary' : 'primary.main'
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.75rem', py: 0.5 }}>
                      {enumItem.displayName}
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.75rem', py: 0.5 }}>
                      {enumItem.icon || '-'}
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.75rem', py: 0.5 }}>
                      {enumItem.color ? (
                        <Box
                          sx={{
                            width: 20,
                            height: 20,
                            borderRadius: '50%',
                            backgroundColor: enumItem.color,
                            border: '1px solid #e0e0e0'
                          }}
                        />
                      ) : '-'}
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.7rem', py: 0.5 }}>
                      {enumItem.description || '-'}
                    </TableCell>
                    <TableCell align="center" sx={{ py: 0.5 }}>
                      <Tooltip title={enumItem.isActive ? 'Active' : 'Inactive'}>
                        <IconButton
                          size="small"
                          onClick={() => handleToggleStatus(enumItem.id)}
                          disabled={enumItem.isSystem}
                          sx={{ p: 0.25 }}
                        >
                          {enumItem.isActive ? (
                            <CheckCircleIcon sx={{ fontSize: '0.9rem', color: 'success.main' }} />
                          ) : (
                            <CancelIcon sx={{ fontSize: '0.9rem', color: 'error.main' }} />
                          )}
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                    <TableCell align="center" sx={{ py: 0.5 }}>
                      <Chip
                        label={enumItem.isSystem ? 'System' : 'Custom'}
                        size="small"
                        color={enumItem.isSystem ? 'info' : 'default'}
                        sx={{ fontSize: '0.5rem', height: 16 }}
                      />
                    </TableCell>
                    <TableCell align="center" sx={{ py: 0.5 }}>
                      <Stack direction="row" spacing={0.5} justifyContent="center">
                        {!enumItem.isSystem && (
                          <>
                            <Tooltip title="Edit">
                              <IconButton
                                size="small"
                                onClick={() => handleOpenDialog(enumItem)}
                                sx={{ p: 0.25 }}
                              >
                                <EditIcon sx={{ fontSize: '0.8rem' }} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDeleteEnum(enumItem.id)}
                                sx={{ p: 0.25 }}
                              >
                                <DeleteIcon sx={{ fontSize: '0.8rem' }} />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                        {enumItem.isSystem && (
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
                            Locked
                          </Typography>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(parseInt(event.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[5, 10, 25]}
          labelRowsPerPage="Enums per page:"
          sx={{
            '& .MuiTablePagination-selectLabel': { fontSize: '0.75rem' },
            '& .MuiTablePagination-displayedRows': { fontSize: '0.75rem' },
            '& .MuiTablePagination-select': { fontSize: '0.75rem' },
          }}
        />
      </Paper>

      {/* Add/Edit Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontSize: '0.95rem', fontWeight: 600 }}>
          {editingEnum ? 'Edit Enum' : 'Add New Enum'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Enum Type"
              value={formData.enumType}
              disabled
              size="small"
              fullWidth
              sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
            />
            <TextField
              label="Value (e.g., GROCERY)"
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: e.target.value.toUpperCase() })}
              required
              size="small"
              fullWidth
              helperText="Use uppercase letters, numbers, and underscores only"
              sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
            />
            <TextField
              label="Display Name"
              value={formData.displayName}
              onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              required
              size="small"
              fullWidth
              sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
            />
            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              size="small"
              fullWidth
              multiline
              rows={2}
              sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
            />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="Icon (Emoji)"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  size="small"
                  fullWidth
                  helperText="e.g., 🚛, 📦, ⛽"
                  sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Color"
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  size="small"
                  fullWidth
                  sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
                />
              </Grid>
            </Grid>
            <TextField
              label="Sort Order"
              type="number"
              value={formData.sortOrder}
              onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
              size="small"
              fullWidth
              sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={handleCloseDialog} size="small" sx={{ fontSize: '0.75rem' }}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            size="small"
            disabled={!formData.value || !formData.displayName}
            sx={{ fontSize: '0.75rem' }}
          >
            {editingEnum ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// Compact Tab Panel Component
const TabPanel = ({ children, value, index }) => (
  <Box
    role="tabpanel"
    hidden={value !== index}
    sx={{ mt: 2 }}
  >
    {value === index && children}
  </Box>
);

const SettingsPage = ({ currentUser }) => {
  const [tab, setTab] = useState(0);
  const navigate = useNavigate();

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const [users, setUsers] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loadingDrivers, setLoadingDrivers] = useState(false);
  const [driverError, setDriverError] = useState(null);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    if (tab === 1) {
      fetchUsers();
    } else if (tab === 2) {
      fetchDrivers();
    }
  }, [tab]);

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const data = await userService.getAllUsers();
      const usersArray = Array.isArray(data) ? data : (data?.data || data?.content || []);
      setUsers(usersArray);
      setError(null);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError("Failed to load users");
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchDrivers = async () => {
    try {
      setLoadingDrivers(true);
      setDriverError(null);

      const response = await driverService.getAllDrivers();
      let driversArray = response;

      if (!Array.isArray(driversArray)) {
        if (driversArray && Array.isArray(driversArray.data)) {
          driversArray = driversArray.data;
        } else if (driversArray && Array.isArray(driversArray.drivers)) {
          driversArray = driversArray.drivers;
        } else if (driversArray && driversArray.data && Array.isArray(driversArray.data.data)) {
          driversArray = driversArray.data.data;
        }
      }

      if (!Array.isArray(driversArray)) {
        setDriverError("Invalid response format from server");
        setDrivers([]);
        return;
      }

      setDrivers(driversArray);
    } catch (err) {
      console.error("Error in fetchDrivers:", err);
      let errorMessage = "Failed to load drivers. Please try again.";
      if (err.response) {
        errorMessage = err.response.data?.message || errorMessage;
      }
      setDriverError(errorMessage);
      // Mock data for demo
      const mockDrivers = [
        {
          id: 1,
          firstName: "John",
          lastName: "Doe",
          licenseNumber: "DL12345",
          licenseExpiry: "2024-12-31",
          status: "Active",
          email: "john.doe@example.com",
          phone: "+1234567890"
        },
        {
          id: 2,
          firstName: "Jane",
          lastName: "Smith",
          licenseNumber: "DL67890",
          licenseExpiry: "2025-06-30",
          status: "Active",
          email: "jane.smith@example.com",
          phone: "+0987654321"
        },
      ];
      setDrivers(mockDrivers);
    } finally {
      setLoadingDrivers(false);
    }
  };

  const handlePasswordReset = async () => {
    setSuccess("");
    setError("");
    try {
      await authService.updatePassword(oldPassword, newPassword);
      setSuccess("Password updated successfully!");
      setOldPassword("");
      setNewPassword("");
    } catch (err) {
      setError(err.error || "Failed to update password");
    }
  };

  const handleAddDriver = () => {
    navigate("/users/drivers/new");
  };

  const handleDeleteDriver = async (driverId) => {
    if (window.confirm("Are you sure you want to delete this driver?")) {
      try {
        await driverService.deleteDriver(driverId);
        setSnackbar({
          open: true,
          message: "Driver deleted successfully",
          severity: "success"
        });
        fetchDrivers();
      } catch (err) {
        setSnackbar({
          open: true,
          message: err.response?.data?.message || "Failed to delete driver",
          severity: "error"
        });
      }
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await userService.deleteUser(userId);
        setSnackbar({
          open: true,
          message: "User deleted successfully",
          severity: "success"
        });
        fetchUsers();
      } catch (err) {
        setSnackbar({
          open: true,
          message: err.response?.data?.message || "Failed to delete user",
          severity: "error"
        });
      }
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 1.5, md: 2 } }}>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ fontSize: '0.8rem' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      <Card sx={{ borderRadius: 1.5 }}>
        <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
          <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600, mb: 2 }}>
            Settings
          </Typography>

          <Divider sx={{ mb: 2 }} />

          {/* Tabs - Compact */}
          <Tabs 
            value={tab} 
            onChange={(e, newValue) => setTab(newValue)}
            sx={{
              '& .MuiTab-root': {
                fontSize: '0.75rem',
                minHeight: 36,
                textTransform: 'none',
                px: 1.5
              }
            }}
          >
            <Tab label="My Account" />
            <Tab label="User Management" />
            <Tab label="Driver Management" />
            <Tab label="Roles & Permissions" />
            <Tab label="Enums" />
          </Tabs>

          {/* Tab Panels */}
          <TabPanel value={tab} index={0}>
            <Box sx={{ maxWidth: 500 }}>
              {success && <Alert severity="success" sx={{ mb: 2, fontSize: '0.8rem' }}>{success}</Alert>}
              {error && <Alert severity="error" sx={{ mb: 2, fontSize: '0.8rem' }}>{error}</Alert>}

              <Typography variant="subtitle2" sx={{ fontSize: '0.85rem', fontWeight: 600, mb: 1.5 }}>
                Change Password
              </Typography>

              <TextField
                label="Current Password"
                type="password"
                fullWidth
                size="small"
                margin="dense"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
              />
              <TextField
                label="New Password"
                type="password"
                fullWidth
                size="small"
                margin="dense"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' } }}
              />

              <Button
                variant="contained"
                startIcon={<VpnKeyIcon sx={{ fontSize: '0.9rem' }} />}
                onClick={handlePasswordReset}
                size="small"
                sx={{ mt: 2, fontSize: '0.8rem' }}
              >
                Reset Password
              </Button>
            </Box>
          </TabPanel>

          <TabPanel value={tab} index={1}>
            <Box>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="subtitle2" sx={{ fontSize: '0.85rem', fontWeight: 600 }}>
                  Manage Users
                </Typography>
                <Chip
                  label={`${users.length} users`}
                  size="small"
                  sx={{ height: 20, fontSize: '0.6rem' }}
                />
              </Stack>

              {loadingUsers ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress size={30} />
                </Box>
              ) : users.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <PeopleIcon sx={{ fontSize: 32, color: 'text.disabled', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                    No users found
                  </Typography>
                </Box>
              ) : (
                users.map((u) => (
                  <UserItem key={u.id} user={u} onDelete={handleDeleteUser} />
                ))
              )}
            </Box>
          </TabPanel>

          <TabPanel value={tab} index={2}>
            <Box>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="subtitle2" sx={{ fontSize: '0.85rem', fontWeight: 600 }}>
                  Driver Management
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip
                    label={`${drivers.length} drivers`}
                    size="small"
                    sx={{ height: 20, fontSize: '0.6rem' }}
                  />
                  <Tooltip title="Refresh Drivers">
                    <IconButton size="small" onClick={fetchDrivers} sx={{ p: 0.5 }}>
                      <RefreshIcon sx={{ fontSize: '0.9rem' }} />
                    </IconButton>
                  </Tooltip>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon sx={{ fontSize: '0.9rem' }} />}
                    onClick={handleAddDriver}
                    size="small"
                    sx={{ fontSize: '0.75rem', py: 0.5 }}
                  >
                    Add Driver
                  </Button>
                </Stack>
              </Stack>

              {driverError && (
                <Alert
                  severity="warning"
                  sx={{ mb: 2, fontSize: '0.8rem' }}
                  onClose={() => setDriverError(null)}
                >
                  {driverError}
                </Alert>
              )}

              {loadingDrivers ? (
                <Box sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  p: 4,
                  border: '1px dashed #e0e0e0',
                  borderRadius: 1,
                  backgroundColor: '#fafafa'
                }}>
                  <CircularProgress size={30} />
                  <Typography color="text.secondary" sx={{ mt: 1, fontSize: '0.8rem' }}>
                    Loading drivers...
                  </Typography>
                </Box>
              ) : (
                <DriverList
                  drivers={drivers}
                  onAdd={handleAddDriver}
                  onDelete={handleDeleteDriver}
                />
              )}
            </Box>
          </TabPanel>

          <TabPanel value={tab} index={3}>
            <Box>
              <Typography variant="subtitle2" sx={{ fontSize: '0.85rem', fontWeight: 600, mb: 1.5 }}>
                Manage Roles & Permissions
              </Typography>
              
              <Paper sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <SecurityIcon sx={{ fontSize: 32, color: 'primary.main' }} />
                  <Box>
                    <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                      <strong>Coming Soon</strong>
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                      Assign permissions to roles, create new roles, and manage access control
                    </Typography>
                  </Box>
                </Stack>
              </Paper>

              <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip label="Admin" color="primary" size="small" />
                <Chip label="Manager" color="info" size="small" />
                <Chip label="Dispatcher" color="warning" size="small" />
                <Chip label="Driver" color="success" size="small" />
                <Chip label="Viewer" color="default" size="small" />
              </Box>
            </Box>
          </TabPanel>

          <TabPanel value={tab} index={4}>
            <Box>
              <Typography variant="subtitle2" sx={{ fontSize: '0.85rem', fontWeight: 600, mb: 1.5 }}>
                Enum Management
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', display: 'block', mb: 2 }}>
                Manage custom enumerations used throughout the system. System enums are locked and cannot be modified.
              </Typography>
              <EnumManagement tenantId={1} />
            </Box>
          </TabPanel>
        </CardContent>
      </Card>
    </Box>
  );
};

export default SettingsPage;
