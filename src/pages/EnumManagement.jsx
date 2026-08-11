// src/pages/EnumManagement.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Stack,
  Grid,
  Switch,
  FormControlLabel,
  Tabs,
  Tab,
  Card,
  CardContent,
  Divider
} from '@mui/material';

import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Cancel as CancelIcon,
  Save as SaveIcon,
  Restore as RestoreIcon
} from '@mui/icons-material';

import { enumService } from '../services/enumService';
import { pageStyles, formStyles } from '../styles/theme';

// TabPanel component for tabs
function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`enum-tabpanel-${index}`}
      aria-labelledby={`enum-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
}

function EnumManagement() {
  // State
  const [loading, setLoading] = useState(false);
  const [enums, setEnums] = useState([]);
  const [filteredEnums, setFilteredEnums] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [selectedModule, setSelectedModule] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEnum, setEditingEnum] = useState(null);
  const [dialogData, setDialogData] = useState({
    moduleName: '',
    category: '',
    code: '',
    displayName: '',
    description: '',
    sortOrder: 1,
    isDefault: false,
    isActive: true,
    isEditable: true,
    isDeletable: true,
    colorCode: '',
    iconName: ''
  });

  // Load enums
  const loadEnums = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await enumService.getEnumsByModule('all');
      setEnums(data);
      applyFilters(data, searchTerm, selectedModule, selectedCategory);
    } catch (err) {
      setError('Failed to load enums: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedModule, selectedCategory]);

  // Apply filters
  const applyFilters = (data, search, module, category) => {
    let filtered = data;
    
    if (search) {
      const term = search.toLowerCase();
      filtered = filtered.filter(e => 
        e.code.toLowerCase().includes(term) ||
        e.displayName.toLowerCase().includes(term) ||
        e.description?.toLowerCase().includes(term) ||
        e.moduleName.toLowerCase().includes(term) ||
        e.category.toLowerCase().includes(term)
      );
    }
    
    if (module !== 'all') {
      filtered = filtered.filter(e => e.moduleName === module);
    }
    
    if (category !== 'all') {
      filtered = filtered.filter(e => e.category === category);
    }
    
    setFilteredEnums(filtered);
  };

  // Get unique modules and categories for filters
  const modules = ['all', ...new Set(enums.map(e => e.moduleName))];
  const categories = ['all', ...new Set(enums.map(e => e.category))];

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    // Filter by module based on tab
    const moduleMap = ['all', 'trip', 'load', 'driver', 'vehicle', 'pod', 'fuel', 'finance'];
    setSelectedModule(moduleMap[newValue] || 'all');
  };

  // CRUD Operations
  const handleCreate = async () => {
    try {
      const newEnum = await enumService.createEnum(dialogData);
      setSuccess(`Enum ${newEnum.displayName} created successfully`);
      loadEnums();
      handleCloseDialog();
    } catch (err) {
      setError('Failed to create enum: ' + err.message);
    }
  };

  const handleUpdate = async () => {
    try {
      const updated = await enumService.updateEnum(editingEnum.id, dialogData);
      setSuccess(`Enum ${updated.displayName} updated successfully`);
      loadEnums();
      handleCloseDialog();
    } catch (err) {
      setError('Failed to update enum: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this enum?')) return;
    try {
      await enumService.deleteEnum(id);
      setSuccess('Enum deleted successfully');
      loadEnums();
    } catch (err) {
      setError('Failed to delete enum: ' + err.message);
    }
  };

  const handleToggleActive = async (enumItem) => {
    try {
      await enumService.updateEnum(enumItem.id, {
        ...enumItem,
        isActive: !enumItem.isActive
      });
      setSuccess(`Enum ${enumItem.displayName} ${enumItem.isActive ? 'deactivated' : 'activated'} successfully`);
      loadEnums();
    } catch (err) {
      setError('Failed to update enum status: ' + err.message);
    }
  };

  // Dialog handlers
  const handleOpenDialog = (enumItem = null) => {
    if (enumItem) {
      setEditingEnum(enumItem);
      setDialogData({
        moduleName: enumItem.moduleName,
        category: enumItem.category,
        code: enumItem.code,
        displayName: enumItem.displayName,
        description: enumItem.description || '',
        sortOrder: enumItem.sortOrder,
        isDefault: enumItem.isDefault,
        isActive: enumItem.isActive,
        isEditable: enumItem.isEditable,
        isDeletable: enumItem.isDeletable,
        colorCode: enumItem.colorCode || '',
        iconName: enumItem.iconName || ''
      });
    } else {
      setEditingEnum(null);
      setDialogData({
        moduleName: '',
        category: '',
        code: '',
        displayName: '',
        description: '',
        sortOrder: 1,
        isDefault: false,
        isActive: true,
        isEditable: true,
        isDeletable: true,
        colorCode: '',
        iconName: ''
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingEnum(null);
  };

  // Load data on mount
  useEffect(() => {
    loadEnums();
  }, [loadEnums]);

  // Apply filters when dependencies change
  useEffect(() => {
    applyFilters(enums, searchTerm, selectedModule, selectedCategory);
  }, [searchTerm, selectedModule, selectedCategory, enums]);

  // Render methods
  const renderTable = () => (
    <TableContainer component={Paper}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Module</TableCell>
            <TableCell>Category</TableCell>
            <TableCell>Code</TableCell>
            <TableCell>Display Name</TableCell>
            <TableCell>Description</TableCell>
            <TableCell>Order</TableCell>
            <TableCell>Default</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredEnums
            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
            .map((enumItem) => (
              <TableRow key={enumItem.id} hover>
                <TableCell>
                  <Chip label={enumItem.moduleName} size="small" variant="outlined" />
                </TableCell>
                <TableCell>
                  <Chip label={enumItem.category} size="small" color="primary" variant="outlined" />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight="bold">
                    {enumItem.code}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    {enumItem.colorCode && (
                      <Box 
                        sx={{ 
                          width: 16, 
                          height: 16, 
                          borderRadius: '50%', 
                          backgroundColor: enumItem.colorCode,
                          border: '1px solid rgba(0,0,0,0.1)'
                        }} 
                      />
                    )}
                    <Typography variant="body2">
                      {enumItem.displayName}
                    </Typography>
                  </Stack>
                </TableCell>
                <TableCell>{enumItem.description}</TableCell>
                <TableCell>{enumItem.sortOrder}</TableCell>
                <TableCell>
                  {enumItem.isDefault && (
                    <Chip label="Default" size="small" color="success" />
                  )}
                </TableCell>
                <TableCell>
                  <Chip 
                    label={enumItem.isActive ? 'Active' : 'Inactive'}
                    size="small"
                    color={enumItem.isActive ? 'success' : 'error'}
                  />
                  {enumItem.isSystem && (
                    <Chip label="System" size="small" variant="outlined" sx={{ ml: 0.5 }} />
                  )}
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={0.5}>
                    {enumItem.isEditable && (
                      <Tooltip title="Edit">
                        <IconButton 
                          size="small" 
                          onClick={() => handleOpenDialog(enumItem)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    {enumItem.isDeletable && !enumItem.isSystem && (
                      <Tooltip title="Delete">
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => handleDelete(enumItem.id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title={enumItem.isActive ? 'Deactivate' : 'Activate'}>
                      <IconButton 
                        size="small"
                        color={enumItem.isActive ? 'warning' : 'success'}
                        onClick={() => handleToggleActive(enumItem)}
                      >
                        {enumItem.isActive ? <CancelIcon fontSize="small" /> : <RestoreIcon fontSize="small" />}
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          {filteredEnums.length === 0 && (
            <TableRow>
              <TableCell colSpan={9} align="center">
                <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                  No enums found
                </Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25, 50]}
        component="div"
        count={filteredEnums.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={(e, newPage) => setPage(newPage)}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
      />
    </TableContainer>
  );

  const renderDialog = () => (
    <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
      <DialogTitle>
        {editingEnum ? 'Edit Enum' : 'Create New Enum'}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Module Name *"
              value={dialogData.moduleName}
              onChange={(e) => setDialogData({ ...dialogData, moduleName: e.target.value })}
              size="small"
              required
              disabled={!!editingEnum}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Category *"
              value={dialogData.category}
              onChange={(e) => setDialogData({ ...dialogData, category: e.target.value })}
              size="small"
              required
              disabled={!!editingEnum}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Code *"
              value={dialogData.code}
              onChange={(e) => setDialogData({ ...dialogData, code: e.target.value.toUpperCase() })}
              size="small"
              required
              disabled={!!editingEnum}
              helperText="Unique identifier, uppercase letters and underscores"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Display Name *"
              value={dialogData.displayName}
              onChange={(e) => setDialogData({ ...dialogData, displayName: e.target.value })}
              size="small"
              required
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Description"
              value={dialogData.description}
              onChange={(e) => setDialogData({ ...dialogData, description: e.target.value })}
              size="small"
              multiline
              rows={2}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Sort Order"
              type="number"
              value={dialogData.sortOrder}
              onChange={(e) => setDialogData({ ...dialogData, sortOrder: parseInt(e.target.value) || 1 })}
              size="small"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Color Code (hex)"
              value={dialogData.colorCode}
              onChange={(e) => setDialogData({ ...dialogData, colorCode: e.target.value })}
              size="small"
              placeholder="#000000"
              helperText="Optional: e.g., #FF0000"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Icon Name"
              value={dialogData.iconName}
              onChange={(e) => setDialogData({ ...dialogData, iconName: e.target.value })}
              size="small"
              placeholder="e.g., SaveIcon"
              helperText="Optional: MUI icon name"
            />
          </Grid>
          <Grid item xs={12}>
            <Stack direction="row" spacing={2} flexWrap="wrap">
              <FormControlLabel
                control={
                  <Switch
                    checked={dialogData.isDefault}
                    onChange={(e) => setDialogData({ ...dialogData, isDefault: e.target.checked })}
                    size="small"
                  />
                }
                label="Is Default"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={dialogData.isActive}
                    onChange={(e) => setDialogData({ ...dialogData, isActive: e.target.checked })}
                    size="small"
                  />
                }
                label="Is Active"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={dialogData.isEditable}
                    onChange={(e) => setDialogData({ ...dialogData, isEditable: e.target.checked })}
                    size="small"
                  />
                }
                label="Is Editable"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={dialogData.isDeletable}
                    onChange={(e) => setDialogData({ ...dialogData, isDeletable: e.target.checked })}
                    size="small"
                  />
                }
                label="Is Deletable"
              />
            </Stack>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCloseDialog}>Cancel</Button>
        <Button 
          variant="contained" 
          onClick={editingEnum ? handleUpdate : handleCreate}
          startIcon={<SaveIcon />}
        >
          {editingEnum ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <Box sx={pageStyles.container}>
      <Box sx={pageStyles.header}>
        <Typography variant="h5" sx={{ fontSize: '1.5rem', fontWeight: 600 }}>
          Enum Management
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadEnums}
            disabled={loading}
            size="small"
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            size="small"
          >
            New Enum
          </Button>
        </Stack>
      </Box>

      {error && (
        <Alert severity="error" sx={pageStyles.errorAlert} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={pageStyles.successAlert} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
            >
              <Tab label="All" />
              <Tab label="Trip" />
              <Tab label="Load" />
              <Tab label="Driver" />
              <Tab label="Vehicle" />
              <Tab label="POD" />
              <Tab label="Fuel" />
              <Tab label="Finance" />
            </Tabs>
          </Box>

          <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              label="Search"
              variant="outlined"
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by code, name, description..."
              sx={{ flexGrow: 1, minWidth: 200 }}
            />
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Category</InputLabel>
              <Select
                value={selectedCategory}
                label="Category"
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <MenuItem value="all">All Categories</MenuItem>
                {categories.filter(c => c !== 'all').map(c => (
                  <MenuItem key={c} value={c}>{c}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <Divider sx={{ my: 2 }} />

          {loading ? (
            <Box sx={pageStyles.loadingBox}>
              <CircularProgress size={40} />
            </Box>
          ) : (
            renderTable()
          )}
        </CardContent>
      </Card>

      {renderDialog()}
    </Box>
  );
}

export default EnumManagement;
