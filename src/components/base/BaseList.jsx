// src/components/base/BaseList.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  TableSortLabel,
  TextField,
  Button,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Stack,
  Chip,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  Grid,
  Card,
  CardContent,
  Divider,
  LinearProgress,
  Skeleton
} from '@mui/material';
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  Close as CloseIcon
} from '@mui/icons-material';

import { pageStyles, tableStyles, formStyles } from '../../styles/formStyles';

/**
 * BaseList - A reusable list component with filtering, sorting, pagination
 * 
 * @param {Object} props
 * @param {Array} props.columns - Column definitions
 * @param {Function} props.fetchData - Function to fetch data
 * @param {Function} props.onRowClick - Called when row is clicked
 * @param {Function} props.onAdd - Called when add button is clicked
 * @param {Function} props.onEdit - Called when edit button is clicked
 * @param {Function} props.onDelete - Called when delete button is clicked
 * @param {Function} props.onView - Called when view button is clicked
 * @param {Function} props.onRefresh - Called when refresh button is clicked
 * @param {Array} props.actions - Custom action buttons
 * @param {Array} props.rowActions - Custom row actions
 * @param {string} props.title - List title
 * @param {string} props.addLabel - Add button label
 * @param {boolean} props.showSearch - Show search bar
 * @param {boolean} props.showFilters - Show filters
 * @param {boolean} props.showPagination - Show pagination
 * @param {boolean} props.showToolbar - Show toolbar
 * @param {Object} props.filters - Filter configuration
 * @param {number} props.defaultPageSize - Default rows per page
 * @param {Array} props.pageSizeOptions - Page size options
 * @param {Function} props.rowActionsRenderer - Custom row actions renderer
 * @param {Function} props.rowRenderer - Custom row renderer
 * @param {string} props.emptyMessage - Message when no data
 * @param {string} props.loadingMessage - Message when loading
 * @param {React.ReactNode} props.headerContent - Custom header content
 * @param {React.ReactNode} props.footerContent - Custom footer content
 */

function BaseList({
  columns = [],
  fetchData,
  onRowClick,
  onAdd,
  onEdit,
  onDelete,
  onView,
  onRefresh,
  actions = [],
  rowActions = [],
  title = 'List',
  addLabel = 'Add New',
  showSearch = true,
  showFilters = false,
  showPagination = true,
  showToolbar = true,
  filters = null,
  defaultPageSize = 10,
  pageSizeOptions = [5, 10, 25, 50],
  rowActionsRenderer,
  rowRenderer,
  emptyMessage = 'No data found',
  loadingMessage = 'Loading...',
  headerContent,
  footerContent,
  ...props
}) {
  // State
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(defaultPageSize);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterValues, setFilterValues] = useState({});
  const [orderBy, setOrderBy] = useState('');
  const [order, setOrder] = useState('asc');
  const [selectedRows, setSelectedRows] = useState([]);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [menuRow, setMenuRow] = useState(null);

  // Fetch data
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        search: searchTerm,
        sortBy: orderBy,
        sortOrder: order,
        ...filterValues
      };

      const result = await fetchData(params);
      setData(result.data || result.content || result || []);
      setTotalCount(result.total || result.totalElements || result.count || result.data?.length || 0);
    } catch (err) {
      console.error('Failed to load data:', err);
      setError(err.message || 'Failed to load data');
      setData([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, searchTerm, orderBy, order, filterValues, fetchData]);

  // Initial load and when dependencies change
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle sort
  const handleSort = (field) => {
    if (orderBy === field) {
      setOrder(order === 'asc' ? 'desc' : 'asc');
    } else {
      setOrderBy(field);
      setOrder('asc');
    }
  };

  // Handle page change
  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handle search
  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  // Handle filter change
  const handleFilterChange = (name, value) => {
    setFilterValues(prev => ({ ...prev, [name]: value }));
    setPage(0);
  };

  // Handle row selection
  const handleRowSelect = (rowId) => {
    setSelectedRows(prev => 
      prev.includes(rowId) 
        ? prev.filter(id => id !== rowId)
        : [...prev, rowId]
    );
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedRows.length === data.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(data.map(row => row.id));
    }
  };

  // Handle menu open
  const handleMenuOpen = (event, row) => {
    setMenuAnchor(event.currentTarget);
    setMenuRow(row);
  };

  // Handle menu close
  const handleMenuClose = () => {
    setMenuAnchor(null);
    setMenuRow(null);
  };

  // Handle row action
  const handleRowAction = (action, row) => {
    handleMenuClose();
    if (action === 'edit' && onEdit) {
      onEdit(row);
    } else if (action === 'delete' && onDelete) {
      onDelete(row);
    } else if (action === 'view' && onView) {
      onView(row);
    }
  };

  // Render filter fields
  const renderFilters = () => {
    if (!filters || !showFilters) return null;

    return (
      <Grid container spacing={1.5} sx={{ mt: 1, mb: 2 }}>
        {filters.map((filter) => (
          <Grid item xs={12} sm={6} md={3} key={filter.name}>
            {filter.type === 'select' ? (
              <FormControl fullWidth size="small">
                <InputLabel>{filter.label}</InputLabel>
                <Select
                  value={filterValues[filter.name] || ''}
                  onChange={(e) => handleFilterChange(filter.name, e.target.value)}
                  label={filter.label}
                >
                  <MenuItem value="">All</MenuItem>
                  {filter.options.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label || option.value}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            ) : (
              <TextField
                fullWidth
                size="small"
                label={filter.label}
                value={filterValues[filter.name] || ''}
                onChange={(e) => handleFilterChange(filter.name, e.target.value)}
                placeholder={`Filter by ${filter.label}`}
              />
            )}
          </Grid>
        ))}
      </Grid>
    );
  };

  // Render table header
  const renderTableHeader = () => (
    <TableHead>
      <TableRow>
        {onRowClick && (
          <TableCell padding="checkbox">
            <Checkbox
              checked={selectedRows.length === data.length && data.length > 0}
              indeterminate={selectedRows.length > 0 && selectedRows.length < data.length}
              onChange={handleSelectAll}
              size="small"
            />
          </TableCell>
        )}
        {columns.map((column) => (
          <TableCell
            key={column.field}
            sortDirection={orderBy === column.field ? order : false}
            sx={{ fontWeight: 600, fontSize: '0.75rem' }}
          >
            {column.sortable !== false ? (
              <TableSortLabel
                active={orderBy === column.field}
                direction={orderBy === column.field ? order : 'asc'}
                onClick={() => handleSort(column.field)}
              >
                {column.headerName || column.label}
              </TableSortLabel>
            ) : (
              column.headerName || column.label
            )}
          </TableCell>
        ))}
        {(rowActions.length > 0 || rowActionsRenderer || onEdit || onDelete || onView) && (
          <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Actions</TableCell>
        )}
      </TableRow>
    </TableHead>
  );

  // Render row
  const renderRow = (row) => {
    if (rowRenderer) {
      return rowRenderer(row);
    }

    return (
      <TableRow
        hover
        onClick={() => onRowClick && onRowClick(row)}
        sx={{ cursor: onRowClick ? 'pointer' : 'default' }}
      >
        {onRowClick && (
          <TableCell padding="checkbox">
            <Checkbox
              checked={selectedRows.includes(row.id)}
              onChange={() => handleRowSelect(row.id)}
              size="small"
            />
          </TableCell>
        )}
        {columns.map((column) => (
          <TableCell key={column.field} sx={{ fontSize: '0.8rem' }}>
            {column.render ? column.render(row) : row[column.field]}
          </TableCell>
        ))}
        <TableCell>
          <Stack direction="row" spacing={0.5}>
            {rowActionsRenderer ? (
              rowActionsRenderer(row)
            ) : (
              <>
                {onView && (
                  <Tooltip title="View">
                    <IconButton size="small" onClick={() => onView(row)}>
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
                {onEdit && (
                  <Tooltip title="Edit">
                    <IconButton size="small" onClick={() => onEdit(row)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
                {onDelete && (
                  <Tooltip title="Delete">
                    <IconButton size="small" color="error" onClick={() => onDelete(row)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
                {rowActions.map((action, index) => (
                  <Tooltip key={index} title={action.label}>
                    <IconButton size="small" onClick={() => action.onClick(row)}>
                      {action.icon}
                    </IconButton>
                  </Tooltip>
                ))}
                {rowActions.length === 0 && !onView && !onEdit && !onDelete && (
                  <IconButton size="small" onClick={(e) => handleMenuOpen(e, row)}>
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                )}
              </>
            )}
          </Stack>
        </TableCell>
      </TableRow>
    );
  };

  // Render toolbar
  const renderToolbar = () => (
    <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}>
      {showSearch && (
        <TextField
          size="small"
          placeholder="Search..."
          value={searchTerm}
          onChange={handleSearch}
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1, fontSize: '1rem' }} />,
            endAdornment: searchTerm && (
              <IconButton size="small" onClick={() => setSearchTerm('')}>
                <CloseIcon fontSize="small" />
              </IconButton>
            )
          }}
          sx={{ flexGrow: 1, minWidth: 200 }}
        />
      )}
      {actions}
      {onAdd && (
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onAdd}
          size="small"
          sx={{ fontSize: '0.8rem' }}
        >
          {addLabel}
        </Button>
      )}
      {onRefresh && (
        <Tooltip title="Refresh">
          <IconButton onClick={onRefresh} disabled={loading} size="small">
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      )}
      {headerContent}
    </Stack>
  );

  // Render menu
  const renderMenu = () => (
    <Menu
      anchorEl={menuAnchor}
      open={Boolean(menuAnchor)}
      onClose={handleMenuClose}
    >
      {onView && (
        <MenuItem onClick={() => handleRowAction('view', menuRow)}>
          <VisibilityIcon fontSize="small" sx={{ mr: 1 }} /> View
        </MenuItem>
      )}
      {onEdit && (
        <MenuItem onClick={() => handleRowAction('edit', menuRow)}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} /> Edit
        </MenuItem>
      )}
      {onDelete && (
        <MenuItem onClick={() => handleRowAction('delete', menuRow)} sx={{ color: 'error.main' }}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} /> Delete
        </MenuItem>
      )}
    </Menu>
  );

  // Render loading state
  const renderLoading = () => (
    <Box sx={{ p: 3 }}>
      <LinearProgress />
      <Box sx={{ mt: 2 }}>
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} height={40} sx={{ mb: 1 }} />
        ))}
      </Box>
    </Box>
  );

  // Render empty state
  const renderEmpty = () => (
    <TableRow>
      <TableCell colSpan={columns.length + 2} align="center" sx={{ py: 4 }}>
        <Typography variant="body2" color="text.secondary">
          {emptyMessage}
        </Typography>
      </TableCell>
    </TableRow>
  );

  return (
    <Box sx={pageStyles.container}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={pageStyles.header}>
        <Typography sx={pageStyles.title}>{title}</Typography>
        {footerContent}
      </Stack>

      {error && (
        <Alert severity="error" sx={pageStyles.errorAlert} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 2 }}>
        {showToolbar && renderToolbar()}
        {renderFilters()}
        {renderMenu()}

        <TableContainer>
          <Table size="small">
            {renderTableHeader()}
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={columns.length + 2}>
                    {renderLoading()}
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                renderEmpty()
              ) : (
                data.map((row, index) => (
                  <React.Fragment key={row.id || index}>
                    {renderRow(row)}
                  </React.Fragment>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {showPagination && (
          <TablePagination
            rowsPerPageOptions={pageSizeOptions}
            component="div"
            count={totalCount}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
          />
        )}
      </Paper>
    </Box>
  );
}

export default BaseList;
