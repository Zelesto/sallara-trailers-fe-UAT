// src/pages/SettingsPage.jsx
import React, { useState, useEffect } from "react";
import {
  Box, Card, CardContent, Typography,
  TextField, Button, Alert, Tabs, Tab,
  CircularProgress, Snackbar
} from "@mui/material";
import authService from "../services/auth";
import userService from "../services/user";
import driverService from "../services/driverService"; // Import the driver service
import DriverList from "./DriverList";
import { useNavigate } from "react-router-dom";

const SettingsPage = ({ currentUser }) => {
  const [tab, setTab] = useState(0);
  const navigate = useNavigate();

  // --- Password reset state ---
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // --- User management state ---
  const [users, setUsers] = useState([]);

  // --- Driver management state ---
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

 // In SettingsPage.jsx - Update the fetchDrivers function
 const fetchDrivers = async () => {
   try {
     setLoadingDrivers(true);
     setDriverError(null);

     console.log('Starting fetchDrivers...');
     const response = await driverService.getAllDrivers();
     console.log('Response from driverService:', response);

     // The response should be the array directly
     let driversArray = response;

     // If it's not an array, try to extract it
     if (!Array.isArray(driversArray)) {
       console.log('Response is not an array, checking structure:', driversArray);

       // Try common response structures
       if (driversArray && Array.isArray(driversArray.data)) {
         driversArray = driversArray.data;
       } else if (driversArray && Array.isArray(driversArray.drivers)) {
         driversArray = driversArray.drivers;
       } else if (driversArray && driversArray.data && Array.isArray(driversArray.data.data)) {
         driversArray = driversArray.data.data;
       }
     }

     console.log('Final drivers array:', driversArray);
     console.log('Is array?', Array.isArray(driversArray));

     if (!Array.isArray(driversArray)) {
       console.error('Could not extract drivers array from response:', response);
       setDriverError("Invalid response format from server");
       setDrivers([]);
       return;
     }

     // Log first driver structure
     if (driversArray.length > 0) {
       const firstDriver = driversArray[0];
       console.log('First driver:', firstDriver);
       console.log('First driver keys:', Object.keys(firstDriver));
       console.log('First driver type:', typeof firstDriver);
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

     // For now, use mock data
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
        // Refresh the driver list
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
        // Refresh the user list
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
    <Box sx={{ minHeight: "100vh", background: "linear-gradient(135deg, #fafafa 0%, #ffffff 100%)", p: 3 }}>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Settings
          </Typography>

          {/* Tabs */}
          <Tabs value={tab} onChange={(e, newValue) => setTab(newValue)}>
            <Tab label="My Account" />
            <Tab label="User Management" />
            <Tab label="Driver Management" />
            <Tab label="System Roles & Permissions" />
          </Tabs>

          {/* Tab Panels */}
          {tab === 0 && (
            <Box sx={{ mt: 2 }}>
              {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

              <TextField
                label="Current Password"
                type="password"
                fullWidth
                margin="normal"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
              />
              <TextField
                label="New Password"
                type="password"
                fullWidth
                margin="normal"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />

              <Button variant="contained" sx={{ mt: 2 }} onClick={handlePasswordReset}>
                Reset Password
              </Button>
            </Box>
          )}

          {tab === 1 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>Manage Users</Typography>
              {users.length === 0 ? (
                <Typography color="text.secondary">No users found</Typography>
              ) : (
                users.map((u) => (
                  <Box
                    key={u.id}
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      p: 1.5,
                      mb: 1,
                      borderRadius: 1,
                      bgcolor: 'background.default',
                      '&:hover': {
                        bgcolor: 'action.hover',
                      }
                    }}
                  >
                    <Box>
                      <Typography fontWeight={500}>{u.username}</Typography>
                      <Typography variant="body2" color="text.secondary">{u.email}</Typography>
                    </Box>
                    <Button
                      color="error"
                      size="small"
                      onClick={() => handleDeleteUser(u.id)}
                    >
                      Delete
                    </Button>
                  </Box>
                ))
              )}
            </Box>
          )}


          {tab === 2 && (
            <Box sx={{ mt: 2 }}>
              <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 3
              }}>
                <Typography variant="h5" fontWeight={600}>
                  Driver Management
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Total: {drivers.length} drivers
                  </Typography>
                </Box>
              </Box>

              {driverError && (
                <Alert
                  severity="warning"
                  sx={{ mb: 2 }}
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
                  p: 6,
                  border: '1px dashed #e0e0e0',
                  borderRadius: 2,
                  backgroundColor: '#fafafa'
                }}>
                  <CircularProgress sx={{ mb: 2 }} />
                  <Typography color="text.secondary">
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
          )}

          {tab === 3 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6">Manage Roles & Permissions</Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                Coming soon: assign permissions to roles, create new roles, etc.
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default SettingsPage;