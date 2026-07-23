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
  Cancel as CancelIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
  Info as InfoIcon
} from "@mui/icons-material";
import authService from "../services/auth";
import userService from "../services/user";
import driverService from "../services/driverService";
import { enumService } from "../services/enumService";
import DriverList from "./DriverList";
import { useNavigate } from "react-router-dom";

// ============================================================
// COMPACT USER ITEM
// ============================================================
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

// ============================================================
// ENUM MANAGEMENT - UNIFIED VERSION
// ============================================================
const EnumManagement = () => {
  const [enums, setEnums] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEnum, setEditingEnum] = useState(null);
  const [selectedModule, setSelectedModule] = useState('trip');
  const [selectedCategory, setSelectedCategory] = useState('status');
  const [showSystem, setShowSystem] = useState(true);
  const [showCustom, setShowCustom] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);

  // Form state for add/edit
  const [formData, setFormData] = useState({
    moduleName: 'trip',
    category: 'status',
    code: '',
    displayName: '',
    description: '',
    sortOrder: 0,
    colorCode: '#1976D2',
    iconName: '',
    metadata: {}
  });

  // Module and category options
  const modules = ['trip', 'load', 'driver', 'vehicle', 'fuel', 'finance', 'pod', 'inventory'];
  const categories = ['status', 'type', 'priority', 'approval', 'payment_method'];

  // Load enums
  const loadEnums = async () => {
    if (!selectedModule || !selectedCategory) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await enumService.getEnums(selectedModule, selectedCategory);
      let enumData = [];
      if (Array.isArray(response)) {
        enumData = response;
      } else if (response?.data && Array.isArray(response.data)) {
        enumData = response.data;
      } else if (response?.content && Array.isArray(response.content)) {
        enumData = response.content;
      }
      
      setEnums(enumData);
      setTotal(enumData.length);
    } catch (err) {
      console.error('Error loading enums:', err);
      setError('Failed to load enums');
      setEnums([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEnums();
  }, [selectedModule, selectedCategory]);

  // Get filtered enums
  const getFilteredEnums = () => {
    return enums.filter(enumItem => {
      if (!showSystem && enumItem.isSystem) return false;
      if (!showCustom && !enumItem.isSystem) return false;
      return true;
    });
  };

  const filteredEnums = getFilteredEnums();

  // Dialog handlers
  const handleOpenDialog = (enumItem = null) => {
    if (enumItem) {
      setEditingEnum(enumItem);
      setFormData({
        moduleName: enumItem.moduleName,
        category: enumItem.category,
        code: enumItem.code,
        displayName: enumItem.displayName,
        description: enumItem.description || '',
        sortOrder: enumItem.sortOrder || 0,
        colorCode: enumItem.colorCode || '#1976D2',
        iconName: enumItem.iconName || '',
        metadata: enumItem.metadata || {}
      });
    } else {
      setEditingEnum(null);
      setFormData({
        moduleName: selectedModule,
        category: selectedCategory,
        code: '',
        displayName: '',
        description: '',
        sortOrder: enums.length + 1,
        colorCode: '#1976D2',
        iconName: '',
        metadata: {}
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingEnum(null);
  };

  const handleSubmit = async () => {
    try {
      setError(null);
      
      if (editingEnum) {
        await enumService.updateEnum(editingEnum.id, formData);
        setSuccess('Enum updated successfully');
      } else {
        await enumService.createEnum(formData);
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
      await enumService.deleteEnum(id);
      setSuccess('Enum deleted successfully');
      await loadEnums();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error deleting enum:', err);
      setError(err.response?.data?.message || 'Failed to delete enum');
    }
  };

  // Get badge color
  const getChipColor = (enumItem) => {
    if (enumItem.isSystem) {
      return { bgcolor: '#e3f2fd', color: '#1565c0' };
    }
    return { bgcolor: '#e8f5e9', color: '#2e7d32' };
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

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ fontSize: '0.75rem' }}>Module</InputLabel>
              <Select
                value={selectedModule}
                onChange={(e) => setSelectedModule(e.target.value)}
                label="Module"
                sx={{ fontSize: '0.75rem' }}
              >
                {modules.map((m) => (
                  <MenuItem key={m} value={m} sx={{ fontSize: '0.75rem' }}>
                    {m.charAt(0).toUpperCase() + m.slice(1)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ fontSize: '0.75rem' }}>Category</InputLabel>
              <Select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                label="Category"
                sx={{ fontSize: '0.75rem' }}
              >
                {categories.map((c) => (
                  <MenuItem key={c} value={c} sx={{ fontSize: '0.75rem' }}>
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <Stack direction="row" spacing={1}>
              <FormControlLabel
                control={
                  <Switch
                    size="small"
                    checked={showSystem}
                    onChange={(e) => setShowSystem(e.target.checked)}
                  />
                }
                label={
                  <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                    System
                  </Typography>
                }
                sx={{ mr: 0 }}
              />
              <FormControlLabel
                control={
                  <Switch
                    size="small"
                    checked={showCustom}
                    onChange={(e) => setShowCustom(e.target.checked)}
                  />
                }
                label={
                  <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                    Custom
                  </Typography>
                }
                sx={{ mr: 0 }}
              />
            </Stack>
          </Grid>
          <Grid item xs={12} md={2}>
            <Stack direction="row" spacing={1} justifyContent={{ xs: 'flex-start', md: 'flex-end' }}>
              <Tooltip title="Refresh">
                <IconButton size="small" onClick={loadEnums} sx={{ p: 0.5 }}>
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
                Add Custom
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      {/* Enums Table */}
      <Paper sx={{ overflow: 'hidden' }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600, py: 1 }}>Code</TableCell>
                <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600, py: 1 }}>Display Name</TableCell>
                <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600, py: 1 }}>Type</TableCell>
                <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600, py: 1 }}>Default</TableCell>
                <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600, py: 1 }}>Status</TableCell>
                <TableCell sx={{ fontSize: '0.65rem', fontWeight: 600, py: 1 }} align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={30} />
                  </TableCell>
                </TableRow>
              ) : filteredEnums.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                      No enums found for {selectedModule} - {selectedCategory}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredEnums.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((enumItem) => {
                  const chipColors = getChipColor(enumItem);
                  const isSystemLocked = enumItem.isSystem && !enumItem.isEditable;
                  
                  return (
                    <TableRow key={enumItem.id} hover>
                      <TableCell sx={{ fontSize: '0.75rem', py: 0.5 }}>
                        <Chip
                          label={enumItem.code}
                          size="small"
                          sx={{
                            fontSize: '0.6rem',
                            height: 20,
                            bgcolor: chipColors.bgcolor,
                            color: chipColors.color
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.75rem', py: 0.5 }}>
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          {enumItem.iconName && (
                            <span style={{ fontSize: '0.8rem' }}>{enumItem.iconName}</span>
                          )}
                          {enumItem.colorCode && (
                            <Box
                              sx={{
                                width: 12,
                                height: 12,
                                borderRadius: '50%',
                                backgroundColor: enumItem.colorCode,
                                border: '1px solid #e0e0e0'
                              }}
                            />
                          )}
                          <span>{enumItem.displayName}</span>
                        </Stack>
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.75rem', py: 0.5 }}>
                        <Chip
                          label={enumItem.isSystem ? 'System' : 'Custom'}
                          size="small"
                          color={enumItem.isSystem ? 'info' : 'success'}
                          variant="outlined"
                          sx={{ fontSize: '0.5rem', height: 16 }}
                          icon={enumItem.isSystem ? <LockIcon sx={{ fontSize: '0.5rem' }} /> : <LockOpenIcon sx={{ fontSize: '0.5rem' }} />}
                        />
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.75rem', py: 0.5 }}>
                        {enumItem.isDefault && (
                          <Chip
                            label="Default"
                            size="small"
                            color="primary"
                            sx={{ fontSize: '0.5rem', height: 16 }}
                          />
                        )}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.75rem', py: 0.5 }}>
                        <Chip
                          label={enumItem.isActive ? 'Active' : 'Inactive'}
                          size="small"
                          color={enumItem.isActive ? 'success' : 'error'}
                          variant="outlined"
                          sx={{ fontSize: '0.5rem', height: 16 }}
                        />
                      </TableCell>
                      <TableCell align="center" sx={{ py: 0.5 }}>
                        <Stack direction="row" spacing={0.5} justifyContent="center">
                          {!isSystemLocked ? (
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
                              {!enumItem.isSystem && (
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
                              )}
                            </>
                          ) : (
                            <Tooltip title="System enum - locked">
                              <LockIcon sx={{ fontSize: '0.8rem', color: 'text.disabled' }} />
                            </Tooltip>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          component="div"
          count={filteredEnums.length}
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

      {/* Stats Footer */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1.5 }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
          {filteredEnums.length} enums ({enums.filter(e => e.isSystem).length} system, {enums.filter(e => !e.isSystem).length} custom)
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
          Last updated: {new Date().toLocaleString()}
        </Typography>
      </Box>

      {/* Add/Edit Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontSize: '0.95rem', fontWeight: 600 }}>
          {editingEnum ? 'Edit Enum' : 'Add Custom Enum'}
          {editingEnum?.isSystem && (
            <Chip
              label="System"
              size="small"
              color="info"
              sx={{ ml: 1, fontSize: '0.6rem' }}
            />
          )}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <FormControl fullWidth size="small">
                  <InputLabel sx={{ fontSize: '0.75rem' }}>Module</InputLabel>
                  <Select
                    value={formData.moduleName}
                    onChange={(e) => setFormData({ ...formData, moduleName: e.target.value })}
                    label="Module"
                    disabled={editingEnum?.isSystem}
                    sx={{ fontSize: '0.75rem' }}
                  >
                    {modules.map((m) => (
                      <MenuItem key={m} value={m} sx={{ fontSize: '0.75rem' }}>
                        {m.charAt(0).toUpperCase() + m.slice(1)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth size="small">
                  <InputLabel sx={{ fontSize: '0.75rem' }}>Category</InputLabel>
                  <Select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    label="Category"
                    disabled={editingEnum?.isSystem}
                    sx={{ fontSize: '0.75rem' }}
                  >
                    {categories.map((c) => (
                      <MenuItem key={c} value={c} sx={{ fontSize: '0.75rem' }}>
                        {c.charAt(0).toUpperCase() + c.slice(1)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            <TextField
              label="Code (e.g., GROCERY)"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '') })}
              required
              size="small"
              fullWidth
              disabled={editingEnum?.isSystem}
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
                  value={formData.iconName}
                  onChange={(e) => setFormData({ ...formData, iconName: e.target.value })}
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
                  value={formData.colorCode}
                  onChange={(e) => setFormData({ ...formData, colorCode: e.target.value })}
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
            disabled={!formData.code || !formData.displayName}
            sx={{ fontSize: '0.75rem' }}
          >
            {editingEnum ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// ============================================================
// TAB PANEL COMPONENT
// ============================================================
const TabPanel = ({ children, value, index }) => (
  <Box
    role="tabpanel"
    hidden={value !== index}
    sx={{ mt: 2 }}
  >
    {value === index && children}
  </Box>
);

// ============================================================
// MAIN SETTINGS PAGE
// ============================================================
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
      setDrivers([]);
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
                Manage enumerations used throughout the system. System enums are locked and cannot be modified.
              </Typography>
              <EnumManagement />
            </Box>
          </TabPanel>
        </CardContent>
      </Card>
    </Box>
  );
};

export default SettingsPage;
