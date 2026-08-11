// src/components/base/BaseDetail.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Stack,
  Grid,
  Card,
  CardContent,
  Divider,
  Chip,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Breadcrumbs,
  Link
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Print as PrintIcon,
  Download as DownloadIcon,
  Share as ShareIcon,
  MoreVert as MoreVertIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

import { pageStyles, formStyles } from '../../styles/formStyles';

/**
 * BaseDetail - A reusable detail view component
 * 
 * @param {Object} props
 * @param {string|number} props.id - ID of item to display
 * @param {Function} props.fetchData - Function to fetch detail data
 * @param {Function} props.onEdit - Called when edit button is clicked
 * @param {Function} props.onDelete - Called when delete button is clicked
 * @param {Function} props.onBack - Called when back button is clicked
 * @param {Function} props.onRefresh - Called when refresh button is clicked
 * @param {Array} props.sections - Detail sections configuration
 * @param {Array} props.actions - Custom action buttons
 * @param {string} props.title - Detail title
 * @param {string} props.subtitle - Detail subtitle
 * @param {boolean} props.loading - Loading state
 * @param {React.ReactNode} props.headerContent - Custom header content
 * @param {React.ReactNode} props.footerContent - Custom footer content
 * @param {Function} props.renderCustomSection - Custom section renderer
 * @param {Object} props.breadcrumbs - Breadcrumb configuration
 */

function BaseDetail({
  id,
  fetchData,
  onEdit,
  onDelete,
  onBack,
  onRefresh,
  sections = [],
  actions = [],
  title = 'Details',
  subtitle = '',
  loading = false,
  headerContent,
  footerContent,
  renderCustomSection,
  breadcrumbs = null,
  ...props
}) {
  // State
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(loading);
  const [error, setError] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Load data
  const loadData = useCallback(async () => {
    if (!id) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await fetchData(id);
      setData(result);
    } catch (err) {
      console.error('Failed to load detail:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }, [id, fetchData]);

  // Initial load and when id changes
  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id, loadData]);

  // Handle delete
  const handleDelete = useCallback(async () => {
    if (!onDelete) return;
    try {
      await onDelete(data);
      setDeleteDialogOpen(false);
    } catch (err) {
      console.error('Failed to delete:', err);
      setError(err.message || 'Failed to delete');
    }
  }, [data, onDelete]);

  // Render breadcrumbs
  const renderBreadcrumbs = () => {
    if (!breadcrumbs) return null;
    
    return (
      <Breadcrumbs sx={{ mb: 2, fontSize: '0.8rem' }}>
        {breadcrumbs.map((crumb, index) => (
          index === breadcrumbs.length - 1 ? (
            <Typography key={index} color="text.primary" sx={{ fontSize: '0.8rem' }}>
              {crumb.label}
            </Typography>
          ) : (
            <Link
              key={index}
              color="inherit"
              href={crumb.href}
              onClick={(e) => {
                e.preventDefault();
                if (crumb.onClick) crumb.onClick();
              }}
              sx={{ fontSize: '0.8rem', cursor: 'pointer' }}
            >
              {crumb.label}
            </Link>
          )
        ))}
      </Breadcrumbs>
    );
  };

  // Render section field
  const renderField = (field, value) => {
    if (field.render) {
      return field.render(value, data);
    }

    if (value === null || value === undefined || value === '') {
      return <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>N/A</Typography>;
    }

    if (field.type === 'status') {
      const colorMap = {
        'active': 'success',
        'inactive': 'error',
        'pending': 'warning',
        'completed': 'success',
        'cancelled': 'error',
        'draft': 'default',
        'approved': 'success',
        'rejected': 'error'
      };
      return (
        <Chip
          label={value}
          size="small"
          color={colorMap[value.toLowerCase()] || 'default'}
          sx={{ fontSize: '0.65rem' }}
        />
      );
    }

    if (field.type === 'boolean') {
      return (
        <Chip
          label={value ? 'Yes' : 'No'}
          size="small"
          color={value ? 'success' : 'error'}
          sx={{ fontSize: '0.65rem' }}
        />
      );
    }

    if (field.type === 'date') {
      return (
        <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
          {new Date(value).toLocaleDateString()}
        </Typography>
      );
    }

    if (field.type === 'datetime') {
      return (
        <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
          {new Date(value).toLocaleString()}
        </Typography>
      );
    }

    if (field.type === 'currency') {
      return (
        <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 600 }}>
          {new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(value)}
        </Typography>
      );
    }

    if (field.type === 'array') {
      return (
        <Stack direction="row" spacing={0.5} flexWrap="wrap">
          {value.map((item, index) => (
            <Chip
              key={index}
              label={item}
              size="small"
              sx={{ fontSize: '0.6rem', mb: 0.5 }}
            />
          ))}
        </Stack>
      );
    }

    return (
      <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
        {value}
      </Typography>
    );
  };

  // Render section
  const renderSection = (section) => {
    const { title, fields, columns = 2, spacing = 2 } = section;

    if (section.render) {
      return section.render(data);
    }

    return (
      <Box key={title} sx={{ mb: 3 }}>
        {title && (
          <Typography variant="subtitle1" fontWeight="600" sx={{ mb: 2, fontSize: '0.9rem' }}>
            {title}
          </Typography>
        )}
        <Grid container spacing={spacing}>
          {fields.map((field) => {
            const value = field.path ? 
              field.path.split('.').reduce((obj, key) => obj?.[key], data) :
              data?.[field.field];
            
            return (
              <Grid item xs={12} md={12 / columns} key={field.field}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', display: 'block' }}>
                    {field.label}
                  </Typography>
                  <Box sx={{ mt: 0.5 }}>
                    {renderField(field, value)}
                  </Box>
                </Box>
              </Grid>
            );
          })}
        </Grid>
        <Divider sx={{ mt: 2 }} />
      </Box>
    );
  };

  // Render loading state
  const renderLoading = () => (
    <Box sx={{ p: 3 }}>
      <Stack spacing={2}>
        <Skeleton variant="text" height={40} width="60%" />
        <Skeleton variant="text" height={20} width="40%" />
        <Skeleton variant="rectangular" height={200} />
        <Grid container spacing={2}>
          {Array.from({ length: 4 }).map((_, index) => (
            <Grid item xs={12} md={6} key={index}>
              <Skeleton variant="text" height={30} />
              <Skeleton variant="text" height={20} width="80%" />
            </Grid>
          ))}
        </Grid>
      </Stack>
    </Box>
  );

  // Render empty state
  const renderEmpty = () => (
    <Box sx={{ p: 4, textAlign: 'center' }}>
      <Typography variant="body1" color="text.secondary">
        No data available
      </Typography>
    </Box>
  );

  return (
    <Box sx={pageStyles.container}>
      {renderBreadcrumbs()}

      <Paper sx={{ p: 2 }}>
        {/* Header */}
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="flex-start"
          sx={{ mb: 2 }}
        >
          <Box>
            <Stack direction="row" alignItems="center" spacing={1}>
              {onBack && (
                <Tooltip title="Back">
                  <IconButton onClick={onBack} size="small">
                    <ArrowBackIcon />
                  </IconButton>
                </Tooltip>
              )}
              <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 600 }}>
                {title}
              </Typography>
              {data?.status && (
                <Chip
                  label={data.status}
                  size="small"
                  color={
                    data.status.toLowerCase() === 'active' ? 'success' :
                    data.status.toLowerCase() === 'inactive' ? 'error' :
                    data.status.toLowerCase() === 'pending' ? 'warning' : 'default'
                  }
                  sx={{ fontSize: '0.65rem' }}
                />
              )}
            </Stack>
            {subtitle && (
              <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 0.5, fontSize: '0.85rem' }}>
                {subtitle}
              </Typography>
            )}
          </Box>

          <Stack direction="row" spacing={1}>
            {headerContent}
            {onRefresh && (
              <Tooltip title="Refresh">
                <IconButton onClick={onRefresh || loadData} disabled={isLoading} size="small">
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            )}
            {actions}
            {onEdit && (
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={() => onEdit(data)}
                size="small"
                sx={{ fontSize: '0.8rem' }}
              >
                Edit
              </Button>
            )}
            {onDelete && (
              <Button
                variant="contained"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => setDeleteDialogOpen(true)}
                size="small"
                sx={{ fontSize: '0.8rem' }}
              >
                Delete
              </Button>
            )}
          </Stack>
        </Stack>

        <Divider sx={{ mb: 2 }} />

        {/* Content */}
        {error ? (
          <Alert severity="error" sx={formStyles.alert.sx} onClose={() => setError(null)}>
            {error}
          </Alert>
        ) : isLoading ? (
          renderLoading()
        ) : !data ? (
          renderEmpty()
        ) : (
          <Box>
            {sections.map((section) => renderSection(section))}
            {renderCustomSection && renderCustomSection(data)}
            {footerContent}
          </Box>
        )}
      </Paper>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this item? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default BaseDetail;
