// src/pages/EnumManagement.jsx
import React, { useState, useEffect } from 'react';
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
  Button,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText,
  Stack,
  Alert,
  CircularProgress,
  Tooltip,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { enumService } from '../services/enumService';

const EnumManagement = () => {
  // State
  const [enums, setEnums] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedModule, setSelectedModule] = useState('trip');
  const [selectedCategory, setSelectedCategory] = useState('status');
  const [modules, setModules] = useState([]);
  const [categories, setCategories] = useState([]);
  
  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEnum, setEditingEnum] = useState(null);
  const [formData, setFormData] = useState({
    moduleName: 'trip',
    category: 'status',
    code: '',
    displayName: '',
    description: '',
    sortOrder: 0,
    isDefault: false,
    colorCode: '#4CAF50',
    iconName: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Load enums
  const loadEnums = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await enumService.getEnums(selectedModule, selectedCategory, true);
      setEnums(data);
      setTotalCount(data.length);
    } catch (err) {
      setError('Failed to load enums');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Load modules and categories
  const loadModulesAndCategories = async () => {
    try {
      const [modulesData, categoriesData] = await Promise.all([
        enumService.getModules(),
        enumService.getEnumTypes()
      ]);
      setModules(modulesData);
      setCategories(categoriesData);
    } catch (err) {
      console.error('Failed to load modules/categories:', err);
    }
  };

  useEffect(() => {
    loadEnums();
  }, [selectedModule, selectedCategory]);

  useEffect(() => {
    loadModulesAndCategories();
  }, []);

  // Handle dialog open/close
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
        isDefault: enumItem.isDefault || false,
        colorCode: enumItem.colorCode || '#4CAF50',
        iconName: enumItem.iconName || '',
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
        isDefault: false,
        colorCode: '#4CAF50',
        iconName: '',
      });
    }
    setFormErrors({});
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingEnum(null);
    setFormErrors({});
  };

  // Handle form changes
  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Validate form
  const validateForm = () => {
    const errors = {};
    if (!formData.code) errors.code = 'Code is required';
    if (!formData.displayName) errors.displayName = 'Display name is required';
    if (!formData.moduleName) errors.moduleName = 'Module is required';
    if (!formData.category) errors.category = 'Category is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle submit
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      if (editingEnum) {
        await enumService.updateEnum(editingEnum.id, formData);
      } else {
        await enumService.createEnum(formData);
      }
      handleCloseDialog();
      loadEnums();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save enum');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this enum?')) return;
    
    try {
      await enumService.deleteEnum(id);
      loadEnums();
    } catch (err) {
      setError('Failed to delete enum');
    }
  };

  // Handle toggle status
  const handleToggleStatus = async (id) => {
    try {
      await enumService.toggleEnumStatus(id);
      loadEnums();
    } catch (err) {
      setError('Failed to toggle enum status');
    }
  };

  // Render table row
  const renderRow = (enumItem) => (
    <TableRow key={enumItem.id}>
      <TableCell>{enumItem.code}</TableCell>
      <TableCell>{enumItem.displayName}</TableCell>
      <TableCell>{enumItem.description}</TableCell>
      <TableCell>
        <Chip
          label={enumItem.isSystem ? 'System' : 'Custom'}
          color={enumItem.isSystem ? 'primary' : 'secondary'}
          size="small"
        />
      </TableCell>
      <TableCell>
        <Chip
          label={enumItem.isActive ? 'Active' : 'Inactive'}
          color={enumItem.isActive ? 'success' : 'error'}
          size="small"
        />
      </TableCell>
      <TableCell>{enumItem.sortOrder}</TableCell>
      <TableCell>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Toggle Status">
            <Switch
              checked={enumItem.isActive}
              onChange={() => handleToggleStatus(enumItem.id)}
              disabled={enumItem.isSystem && !enumItem.isEditable}
              size="small"
            />
          </Tooltip>
          <Tooltip title="Edit">
            <IconButton
              size="small"
              onClick={() => handleOpenDialog(enumItem)}
              disabled={enumItem.isSystem && !enumItem.isEditable}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton
              size="small"
              color="error"
              onClick={() => handleDelete(enumItem.id)}
              disabled={enumItem.isSystem && !enumItem.isDeletable}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </TableCell>
    </TableRow>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight="600">
          Enum Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Enum
        </Button>
      </Stack>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Module</InputLabel>
            <Select
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
              label="Module"
            >
              {modules.map(m => (
                <MenuItem key={m} value={m}>{m}</MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Category</InputLabel>
            <Select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              label="Category"
            >
              {categories.map(c => (
                <MenuItem key={c} value={c}>{c}</MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadEnums}
            disabled={loading}
          >
            Refresh
          </Button>
        </Stack>
      </Paper>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Code</TableCell>
                <TableCell>Display Name</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Sort Order</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                    <CircularProgress size={30} />
                  </TableCell>
                </TableRow>
              ) : enums.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                    <Typography color="text.secondary">No enums found</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                enums.map(renderRow)
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </Paper>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingEnum ? 'Edit Enum' : 'Add New Enum'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Stack direction="row" spacing={2}>
              <TextField
                fullWidth
                label="Module"
                value={formData.moduleName}
                onChange={(e) => handleFormChange('moduleName', e.target.value)}
                error={!!formErrors.moduleName}
                helperText={formErrors.moduleName}
                disabled={!!editingEnum}
                size="small"
              />
              <TextField
                fullWidth
                label="Category"
                value={formData.category}
                onChange={(e) => handleFormChange('category', e.target.value)}
                error={!!formErrors.category}
                helperText={formErrors.category}
                disabled={!!editingEnum}
                size="small"
              />
            </Stack>
            
            <TextField
              fullWidth
              label="Code"
              value={formData.code}
              onChange={(e) => handleFormChange('code', e.target.value.toUpperCase())}
              error={!!formErrors.code}
              helperText={formErrors.code || 'Uppercase with underscores (e.g., NEW_STATUS)'}
              disabled={!!editingEnum}
              size="small"
            />
            
            <TextField
              fullWidth
              label="Display Name"
              value={formData.displayName}
              onChange={(e) => handleFormChange('displayName', e.target.value)}
              error={!!formErrors.displayName}
              helperText={formErrors.displayName}
              size="small"
            />
            
            <TextField
              fullWidth
              label="Description"
              value={formData.description}
              onChange={(e) => handleFormChange('description', e.target.value)}
              multiline
              rows={2}
              size="small"
            />
            
            <Stack direction="row" spacing={2}>
              <TextField
                fullWidth
                label="Sort Order"
                type="number"
                value={formData.sortOrder}
                onChange={(e) => handleFormChange('sortOrder', parseInt(e.target.value) || 0)}
                size="small"
              />
              <TextField
                fullWidth
                label="Color Code"
                value={formData.colorCode}
                onChange={(e) => handleFormChange('colorCode', e.target.value)}
                placeholder="#4CAF50"
                size="small"
                InputProps={{
                  startAdornment: (
                    <Box
                      sx={{
                        width: 20,
                        height: 20,
                        backgroundColor: formData.colorCode || '#4CAF50',
                        borderRadius: 1,
                        mr: 1,
                        border: '1px solid #ddd',
                      }}
                    />
                  ),
                }}
              />
            </Stack>
            
            <TextField
              fullWidth
              label="Icon Name"
              value={formData.iconName}
              onChange={(e) => handleFormChange('iconName', e.target.value)}
              placeholder="e.g., CheckCircle, Warning, etc."
              size="small"
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isDefault}
                  onChange={(e) => handleFormChange('isDefault', e.target.checked)}
                />
              }
              label="Set as Default"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={submitting}
            startIcon={submitting && <CircularProgress size={16} />}
          >
            {submitting ? 'Saving...' : editingEnum ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EnumManagement;
