// src/pages/SettingsPage.jsx
import React, { useState, useEffect } from "react";
import {
  Box, Card, CardContent, Typography,
  TextField, Button, Alert, Tabs, Tab,
  CircularProgress, Snackbar, Divider, Chip,
  Stack, IconButton, Tooltip, Paper
} from "@mui/material";
import {
  Person as PersonIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  Security as SecurityIcon,
  People as PeopleIcon,
  VpnKey as VpnKeyIcon,
  Edit as EditIcon
} from "@mui/icons-material";
import authService from "../services/auth";
import userService from "../services/user";
import driverService from "../services/driverService";
import DriverList from "./DriverList";
import { useNavigate } from "react-router-dom";

// Compact User Item Component
const UserItem = ({ user, onDelete }) => (
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
          {user.username}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
          {user.email}
        </Typography>
        {user.roles && user.roles.length > 0 && (
          <Box sx={{ mt: 0.25 }}>
            {user.roles.map((role, index) => (
              <Chip
                key={index}
                label={role.name || role}
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
        onClick={() => onDelete(user.id)}
        sx={{ p: 0.5 }}
      >
        <DeleteIcon sx={{ fontSize: '0.9rem' }} />
      </IconButton>
    </Tooltip>
  </Paper>
);

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
      const data = await userService.getAllUsers();
      setUsers(data);
    } catch {
      setError("Failed to load users");
    }
  };

  const fetchDrivers = async () => {
    try {
      setLoadingDrivers(true);
      setDriverError(null);

      console.log('Starting fetchDrivers...');
      const response = await driverService.getAllDrivers();
      console.log('Response from driverService:', response);

      let driversArray = response;

      if (!Array.isArray(driversArray)) {
        console.log('Response is not an array, checking structure:', driversArray);
        if (driversArray && Array.isArray(driversArray.data)) {
          driversArray = driversArray.data;
        } else if (driversArray && Array.isArray(driversArray.drivers)) {
          driversArray = driversArray.drivers;
        } else if (driversArray && driversArray.data && Array.isArray(driversArray.data.data)) {
          driversArray = driversArray.data.data;
        }
      }

      console.log('Final drivers array:', driversArray);

      if (!Array.isArray(driversArray)) {
        console.error('Could not extract drivers array from response:', response);
        setDriverError("Invalid response format from server");
        setDrivers([]);
        return;
      }

      if (driversArray.length > 0) {
        const firstDriver = driversArray[0];
        console.log('First driver:', firstDriver);
        console.log('First driver keys:', Object.keys(firstDriver));
      }

      setDrivers(driversArray);
    } catch (err) {
      console.error("Error in fetchDrivers:", err);
      console.error("Full error:", err);

      let errorMessage = "Failed to load drivers. Please try again.";
      if (err.response) {
        console.error("Error response:", err.response);
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

              {users.length === 0 ? (
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
        </CardContent>
      </Card>
    </Box>
  );
};

export default SettingsPage;
