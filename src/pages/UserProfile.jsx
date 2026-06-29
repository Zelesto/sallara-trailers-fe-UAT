import React from "react";
import { Grid, Card, CardContent, Typography, Avatar, Box, Button, Chip, Divider, Alert } from "@mui/material";
import {
  Email as EmailIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  Update as UpdateIcon,
  Security as SecurityIcon,
  Edit as EditIcon,
  Logout as LogoutIcon,
  Settings as SettingsIcon,
  Assignment as AssignmentIcon,
  Description as DescriptionIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
} from "@mui/icons-material";

const UserProfile = ({ user, isSelfView = false }) => {
  // Safe fallback for undefined user
  const safeUser = user || {};
  
  // Safe data extraction with defaults
  const username = safeUser.username || 'Unknown User';
  const email = safeUser.email || 'No email provided';
  const enabled = safeUser.enabled !== undefined ? safeUser.enabled : false;
  const roles = safeUser.roles || [];
  const permissions = safeUser.permissions || [];
  const createdAt = safeUser.createdAt || safeUser.createdDate || safeUser.creationDate || new Date().toISOString();
  const updatedAt = safeUser.updatedAt || safeUser.lastModifiedDate || safeUser.updatedDate || new Date().toISOString();
  const image = safeUser.image || safeUser.avatar || safeUser.profileImage || null;
  
  // Get role names safely
  const roleNames = roles
    .map(role => {
      if (typeof role === 'string') return role;
      if (role && typeof role === 'object') return role.name || role.role || 'Role';
      return null;
    })
    .filter(Boolean);
  
  // Get permissions safely
  const allPermissions = permissions.length > 0 
    ? permissions 
    : roles.flatMap(role => {
        if (role && typeof role === 'object' && Array.isArray(role.permissions)) {
          return role.permissions;
        }
        return [];
      });

  // Format date safely
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

  // Get initials for avatar
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
    <Box sx={{ 
      minHeight: "100vh", 
      background: "linear-gradient(135deg, #e3f2fd 0%, #ffffff 100%)", 
      p: { xs: 2, sm: 3, md: 4 } 
    }}>
      <Grid container spacing={{ xs: 2, md: 4 }}>
        {/* User Info Card */}
        <Grid item xs={12} md={4}>
          <Card sx={{ 
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
            overflow: 'visible',
            position: 'relative',
            height: '100%'
          }}>
            <CardContent sx={{ 
              textAlign: "center", 
              pt: 4,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}>
              {/* Avatar with badge */}
              <Box sx={{ position: 'relative', display: 'inline-block' }}>
                <Avatar
                  src={image || undefined}
                  alt={username}
                  sx={{ 
                    width: 120, 
                    height: 120, 
                    mx: "auto", 
                    mb: 2, 
                    border: "4px solid #1976d2",
                    boxShadow: '0 4px 20px rgba(25, 118, 210, 0.3)',
                    bgcolor: !image ? '#1976d2' : undefined,
                    fontSize: '3rem',
                    fontWeight: 600
                  }}
                >
                  {!image && getInitials(username)}
                </Avatar>
                <Box sx={{
                  position: 'absolute',
                  bottom: 16,
                  right: 16,
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  bgcolor: enabled ? '#4caf50' : '#f44336',
                  border: '3px solid white',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                }} />
              </Box>

              <Typography variant="h5" fontWeight="600" gutterBottom>
                {username}
              </Typography>
              
              {/* Role chips */}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, justifyContent: 'center', mb: 1 }}>
                {roleNames.length > 0 ? (
                  roleNames.map((role, index) => (
                    <Chip
                      key={index}
                      label={role}
                      size="small"
                      color="primary"
                      variant="outlined"
                      sx={{ fontSize: '0.7rem' }}
                    />
                  ))
                ) : (
                  <Chip
                    label="No Roles Assigned"
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: '0.7rem' }}
                  />
                )}
              </Box>

              <Chip
                icon={enabled ? <CheckCircleIcon /> : <CancelIcon />}
                label={enabled ? "Active" : "Inactive"}
                color={enabled ? "success" : "error"}
                size="small"
                sx={{ mb: 2, fontWeight: 500 }}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Account Info */}
        <Grid item xs={12} md={8}>
          <Card sx={{ 
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
            height: '100%'
          }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight="600" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PersonIcon color="primary" />
                Account Information
              </Typography>
              
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                    <EmailIcon sx={{ color: 'text.secondary', fontSize: '1.2rem' }} />
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Email
                      </Typography>
                      <Typography variant="body2">{email}</Typography>
                    </Box>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                    <SecurityIcon sx={{ color: 'text.secondary', fontSize: '1.2rem' }} />
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Status
                      </Typography>
                      <Typography variant="body2" sx={{ color: enabled ? '#4caf50' : '#f44336' }}>
                        {enabled ? 'Active' : 'Inactive'}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                    <CalendarIcon sx={{ color: 'text.secondary', fontSize: '1.2rem' }} />
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Created
                      </Typography>
                      <Typography variant="body2">{formatDate(createdAt)}</Typography>
                    </Box>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                    <UpdateIcon sx={{ color: 'text.secondary', fontSize: '1.2rem' }} />
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Last Updated
                      </Typography>
                      <Typography variant="body2">{formatDate(updatedAt)}</Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Permissions Section */}
        {!isSelfView && allPermissions.length > 0 && (
          <Grid item xs={12}>
            <Card sx={{ 
              borderRadius: 3,
              boxShadow: '0 8px 32px rgba(0,0,0,0.08)'
            }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight="600" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AssignmentIcon color="primary" />
                  Permissions
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={1}>
                  {allPermissions.map((perm, index) => (
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
                          color: '#1976d2'
                        }}
                      />
                    </Grid>
                  ))}
                </Grid>
                {allPermissions.length === 0 && (
                  <Alert severity="info" sx={{ mt: 1 }}>
                    No permissions assigned to this user.
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Actions */}
        <Grid item xs={12}>
          <Box sx={{ 
            display: "flex", 
            justifyContent: "center", 
            gap: { xs: 1, sm: 2 }, 
            flexWrap: "wrap",
            '& > *': {
              flex: { xs: '1 1 100%', sm: '0 1 auto' }
            }
          }}>
            {isSelfView ? (
              <>
                <Button 
                  variant="contained" 
                  startIcon={<EditIcon />}
                  sx={{ minWidth: 150 }}
                >
                  Edit Profile
                </Button>
                <Button 
                  variant="contained" 
                  color="secondary"
                  startIcon={<SecurityIcon />}
                  sx={{ minWidth: 150 }}
                >
                  Security
                </Button>
              </>
            ) : (
              <>
                <Button 
                  variant="contained"
                  startIcon={<EditIcon />}
                  sx={{ minWidth: 130 }}
                >
                  Edit User
                </Button>
                <Button 
                  variant="contained" 
                  color="secondary"
                  startIcon={<AssignmentIcon />}
                  sx={{ minWidth: 130 }}
                >
                  Assign Roles
                </Button>
                <Button 
                  variant="contained"
                  startIcon={<DescriptionIcon />}
                  sx={{ minWidth: 130 }}
                >
                  Docs
                </Button>
                <Button 
                  variant="contained"
                  startIcon={<SettingsIcon />}
                  sx={{ 
                    minWidth: 130,
                    bgcolor: "#ffa726", 
                    "&:hover": { bgcolor: "#fb8c00" } 
                  }}
                >
                  Settings
                </Button>
              </>
            )}
            <Button 
              variant="outlined" 
              color="error"
              startIcon={<LogoutIcon />}
              sx={{ minWidth: 130 }}
            >
              Logout
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default UserProfile;
