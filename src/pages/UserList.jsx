// src/pages/users/UserList.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  IconButton,
  Tooltip,
  Chip,
  TextField,
  InputAdornment,
  Stack,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import userService from '../services/user';

// Compact Stat Card Component
const StatCard = ({ title, value, color = 'primary', icon: Icon }) => (
  <Card sx={{ 
    bgcolor: `${color}.main`, 
    color: 'white',
    height: '100%',
    transition: 'transform 0.2s ease',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: 4
    }
  }}>
    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography sx={{ 
            color: 'rgba(255,255,255,0.8)', 
            fontSize: '0.65rem',
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            {title}
          </Typography>
          <Typography variant="h5" fontWeight="bold" sx={{ fontSize: '1.1rem', mt: 0.25 }}>
            {value}
          </Typography>
        </Box>
        {Icon && (
          <Box sx={{ 
            bgcolor: 'rgba(255,255,255,0.15)', 
            borderRadius: 1,
            p: 0.5,
            display: 'flex'
          }}>
            <Icon sx={{ fontSize: '1.1rem' }} />
          </Box>
        )}
      </Stack>
    </CardContent>
  </Card>
);

const UserList = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      console.log('Loading users...');
      const response = await userService.getAllUsers();
      console.log('User response:', response);
      
      // Handle different response formats
      let userData = [];
      if (Array.isArray(response)) {
        userData = response;
      } else if (response && response.data && Array.isArray(response.data)) {
        userData = response.data;
      } else if (response && response.content && Array.isArray(response.content)) {
        userData = response.content;
      } else if (response && response.users && Array.isArray(response.users)) {
        userData = response.users;
      } else if (response && typeof response === 'object') {
        // Try to find any array property
        const arrayProp = Object.values(response).find(val => Array.isArray(val));
        if (arrayProp) {
          userData = arrayProp;
        }
      }
      
      console.log('Processed user data:', userData);
      setUsers(userData || []);
      setError(null);
    } catch (err) {
      console.error('Error loading users:', err);
      setError('Failed to load users: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await userService.deleteUser(id);
      setSuccessMessage('User deleted successfully');
      loadUsers();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError('Failed to delete user');
      setTimeout(() => setError(null), 3000);
    }
  };

  const columns = [
    { 
      field: 'id', 
      headerName: 'ID', 
      flex: 0.5,
      minWidth: 50,
      renderCell: (params) => (
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
          #{params.value}
        </Typography>
      )
    },
    {
      field: 'username',
      headerName: 'Username',
      flex: 1,
      minWidth: 120,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              bgcolor: 'secondary.main',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.65rem',
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            {params.value?.charAt(0)?.toUpperCase() || 'U'}
          </Box>
          <Typography variant="body2" fontWeight={500} sx={{ fontSize: '0.75rem' }}>
            {params.value || 'N/A'}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'email',
      headerName: 'Email',
      flex: 1.2,
      minWidth: 150,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>
          {params.value || 'N/A'}
        </Typography>
      ),
    },
    {
      field: 'enabled',
      headerName: 'Status',
      flex: 0.7,
      minWidth: 80,
      renderCell: (params) => (
        <Chip
          label={params.value ? 'Active' : 'Inactive'}
          size="small"
          color={params.value ? 'success' : 'error'}
          sx={{ 
            fontWeight: 500,
            fontSize: '0.6rem',
            height: 20
          }}
        />
      ),
    },
    {
      field: 'roles',
      headerName: 'Roles',
      flex: 1,
      minWidth: 120,
      renderCell: (params) => {
        const roles = params.value || [];
        return (
          <Stack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5}>
            {roles.map((role, index) => (
              <Chip
                key={index}
                label={role.name || role}
                size="small"
                variant="outlined"
                sx={{ 
                  fontSize: '0.55rem', 
                  height: 18,
                  borderColor: 'primary.main',
                  color: 'primary.main'
                }}
              />
            ))}
            {roles.length === 0 && (
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
                No roles
              </Typography>
            )}
          </Stack>
        );
      },
    },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 0.8,
      minWidth: 100,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 0.25 }}>
          <Tooltip title="View Details">
            <IconButton
              size="small"
              color="primary"
              onClick={() => navigate(`/users/${params.row.id}`)}
              sx={{ p: 0.5 }}
            >
              <ViewIcon sx={{ fontSize: '0.9rem' }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit">
            <IconButton
              size="small"
              color="secondary"
              onClick={() => navigate(`/users/${params.row.id}/edit`)}
              sx={{ p: 0.5 }}
            >
              <EditIcon sx={{ fontSize: '0.9rem' }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton
              size="small"
              color="error"
              onClick={() => handleDelete(params.row.id)}
              sx={{ p: 0.5 }}
            >
              <DeleteIcon sx={{ fontSize: '0.9rem' }} />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  const filteredUsers = users.filter(user => {
    const searchMatch = 
      (user.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    return searchMatch;
  });

  const stats = {
    total: users.length,
    active: users.filter(u => u.enabled).length,
    inactive: users.filter(u => !u.enabled).length,
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 1.5, md: 2 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Typography variant="h6" fontWeight="600" sx={{ fontSize: '1rem' }}>
            User Management
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
            Manage system users
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon sx={{ fontSize: '0.9rem' }} />}
          onClick={() => navigate('/users/new')}
          size="small"
          sx={{ 
            borderRadius: 1.5,
            fontSize: '0.75rem',
            py: 0.5,
            px: 1.5
          }}
        >
          Add User
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2, fontSize: '0.8rem' }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {successMessage && (
        <Alert severity="success" sx={{ mb: 2, fontSize: '0.8rem' }} onClose={() => setSuccessMessage('')}>
          {successMessage}
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid item xs={6} sm={4}>
          <StatCard title="Total Users" value={stats.total} color="primary" icon={PersonIcon} />
        </Grid>
        <Grid item xs={6} sm={4}>
          <StatCard title="Active" value={stats.active} color="success" />
        </Grid>
        <Grid item xs={6} sm={4}>
          <StatCard title="Inactive" value={stats.inactive} color="error" />
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: 1.5, mb: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <TextField
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="small"
            sx={{ 
              flex: 1,
              '& .MuiInputBase-root': { fontSize: '0.8rem' }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: '0.9rem' }} />
                </InputAdornment>
              ),
            }}
          />
          <Stack direction="row" spacing={0.75}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon sx={{ fontSize: '0.9rem' }} />}
              onClick={loadUsers}
              size="small"
              sx={{ fontSize: '0.75rem', py: 0.5 }}
            >
              Refresh
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {/* Data Grid */}
      <Paper sx={{ height: 450, width: '100%', borderRadius: 1 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress size={30} />
          </Box>
        ) : (
          <DataGrid
            rows={filteredUsers}
            columns={columns}
            pageSize={10}
            rowsPerPageOptions={[5, 10, 25, 50]}
            checkboxSelection={false}
            disableRowSelectionOnClick
            getRowId={(row) => row.id}
            density="compact"
            sx={{
              border: 'none',
              fontSize: '0.75rem',
              '& .MuiDataGrid-cell': {
                borderRight: '1px solid #f0f0f0',
                display: 'flex',
                alignItems: 'center',
                padding: '0 8px',
                fontSize: '0.75rem',
              },
              '& .MuiDataGrid-columnHeaders': {
                backgroundColor: '#f8f9fa',
                borderBottom: '2px solid #e0e0e0',
                minHeight: '36px !important',
              },
              '& .MuiDataGrid-row:hover': {
                backgroundColor: '#f5f5f5',
              },
              '& .MuiDataGrid-cell:focus': {
                outline: 'none',
              },
              '& .MuiDataGrid-columnHeader:focus': {
                outline: 'none',
              },
              '& .MuiDataGrid-columnHeaderTitle': {
                fontWeight: 600,
                color: '#333',
                fontSize: '0.65rem',
                textTransform: 'uppercase',
                letterSpacing: '0.3px',
              },
              '& .MuiDataGrid-virtualScroller': {
                '& .MuiDataGrid-row': {
                  minHeight: '36px !important',
                },
              },
            }}
          />
        )}
      </Paper>

      {/* Footer */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1.5 }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
          Showing {filteredUsers.length} of {users.length} users
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
          Last updated: {new Date().toLocaleString()}
        </Typography>
      </Box>
    </Box>
  );
};

export default UserList;
