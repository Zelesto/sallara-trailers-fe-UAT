import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Box,
  Chip,
  Divider,
  Button,
  Alert,
  Grid,
  Paper,
  Avatar,
  Stack,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Email as EmailIcon,
  Person as PersonIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Security as SecurityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import userService from "../services/user";

export default function UserDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: user, isLoading, error, isError } = useQuery({
    queryKey: ["user", id],
    queryFn: async () => {
      console.log(`🔍 Fetching user with ID: ${id}`);
      const result = await userService.getUserById(id);
      console.log("📦 User data:", result);
      
      // Handle different response formats
      if (result && result.data) {
        return result.data;
      }
      return result;
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError || !user) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert 
          severity="error" 
          action={
            <Button color="inherit" size="small" onClick={() => navigate('/users')}>
              Back to Users
            </Button>
          }
        >
          Error loading user: {error?.message || 'User not found'}
        </Alert>
      </Box>
    );
  }

  // Safe data extraction
  const username = user.username || 'Unknown User';
  const email = user.email || 'No email provided';
  const enabled = user.enabled !== undefined ? user.enabled : false;
  const roles = user.roles || [];
  const createdAt = user.createdAt || user.createdDate || new Date().toISOString();
  const updatedAt = user.updatedAt || user.updatedDate || new Date().toISOString();

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';
      return date.toLocaleString();
    } catch (e) {
      return 'Invalid date';
    }
  };

  // Get initials
  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
      {/* Back Button */}
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/users')}
        sx={{ mb: 3 }}
      >
        Back to Users
      </Button>

      <Grid container spacing={3}>
        {/* User Profile Card */}
        <Grid item xs={12} md={4}>
          <Paper
            sx={{
              p: 3,
              textAlign: 'center',
              borderRadius: 3,
              boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
              height: '100%',
            }}
          >
            <Box sx={{ position: 'relative', display: 'inline-block' }}>
              <Avatar
                sx={{
                  width: 120,
                  height: 120,
                  mx: 'auto',
                  mb: 2,
                  bgcolor: '#1976d2',
                  fontSize: '3rem',
                  fontWeight: 600,
                  border: '4px solid #1976d2',
                  boxShadow: '0 4px 20px rgba(25, 118, 210, 0.3)',
                }}
              >
                {getInitials(username)}
              </Avatar>
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 16,
                  right: 16,
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  bgcolor: enabled ? '#4caf50' : '#f44336',
                  border: '3px solid white',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                }}
              />
            </Box>

            <Typography variant="h5" fontWeight="600" gutterBottom>
              {username}
            </Typography>

            <Chip
              icon={enabled ? <CheckCircleIcon /> : <CancelIcon />}
              label={enabled ? 'Active' : 'Inactive'}
              color={enabled ? 'success' : 'error'}
              sx={{ mb: 2 }}
            />

            <Divider sx={{ my: 2 }} />

            <Box sx={{ textAlign: 'left' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <EmailIcon sx={{ color: 'text.secondary', fontSize: '1.2rem' }} />
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Email
                  </Typography>
                  <Typography variant="body2">{email}</Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <SecurityIcon sx={{ color: 'text.secondary', fontSize: '1.2rem' }} />
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Roles
                  </Typography>
                  <Stack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5}>
                    {roles.length > 0 ? (
                      roles.map((role, index) => (
                        <Chip
                          key={index}
                          label={typeof role === 'string' ? role : role.name || 'Role'}
                          size="small"
                          color="primary"
                          variant="outlined"
                          sx={{ fontSize: '0.7rem' }}
                        />
                      ))
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No roles assigned
                      </Typography>
                    )}
                  </Stack>
                </Box>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* User Details Card */}
        <Grid item xs={12} md={8}>
          <Paper
            sx={{
              p: 3,
              borderRadius: 3,
              boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
            }}
          >
            <Typography variant="h6" fontWeight="600" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PersonIcon color="primary" />
              Account Information
            </Typography>

            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary" display="block">
                  User ID
                </Typography>
                <Typography variant="body1" fontWeight="500">
                  #{user.id || 'N/A'}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary" display="block">
                  Status
                </Typography>
                <Chip
                  label={enabled ? 'Active' : 'Inactive'}
                  color={enabled ? 'success' : 'error'}
                  size="small"
                  sx={{ mt: 0.5 }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary" display="block">
                  Created At
                </Typography>
                <Typography variant="body2">{formatDate(createdAt)}</Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary" display="block">
                  Last Updated
                </Typography>
                <Typography variant="body2">{formatDate(updatedAt)}</Typography>
              </Grid>
            </Grid>

            {/* Permissions Section */}
            {user.permissions && user.permissions.length > 0 && (
              <>
                <Typography variant="h6" fontWeight="600" sx={{ mt: 3, mb: 1 }}>
                  Permissions
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={1}>
                  {user.permissions.map((perm, index) => (
                    <Grid item xs={12} sm={6} md={4} key={index}>
                      <Chip
                        label={`${perm.resource || 'Resource'} → ${perm.action || 'Action'}`}
                        variant="outlined"
                        size="small"
                        sx={{
                          width: '100%',
                          justifyContent: 'flex-start',
                          fontSize: '0.7rem',
                          borderColor: '#1976d2',
                          color: '#1976d2',
                        }}
                      />
                    </Grid>
                  ))}
                </Grid>
              </>
            )}

            {/* Actions */}
            <Box sx={{ mt: 4, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={() => navigate(`/users/${id}/edit`)}
              >
                Edit User
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete this user?')) {
                    // Handle delete
                  }
                }}
              >
                Delete User
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
