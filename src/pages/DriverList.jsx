// src/pages/DriverList.jsx - UPDATED with correct field mapping
import { DataGrid } from '@mui/x-data-grid';
import { Button, Box, IconButton, Tooltip, Chip } from '@mui/material';
import { Edit, Delete, Visibility, Phone, Email } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

function DriverList({ drivers = [], onAdd, onDelete }) {
  const navigate = useNavigate();

  // Define columns based on your actual data structure
  const columns = [
    { field: 'id', headerName: 'ID', width: 70 },
    {
      field: 'firstName',
      headerName: 'First Name',
      flex: 1,
      renderCell: (params) => (
        <Box sx={{ fontWeight: 500 }}>
          {params.value || 'N/A'}
        </Box>
      )
    },
    {
      field: 'lastName',
      headerName: 'Last Name',
      flex: 1,
      renderCell: (params) => (
        <Box sx={{ fontWeight: 500 }}>
          {params.value || 'N/A'}
        </Box>
      )
    },
    {
      field: 'licenseNumber',
      headerName: 'License #',
      flex: 1,
      renderCell: (params) => (
        <Chip
          label={params.value || 'No License'}
          size="small"
          color="primary"
          variant="outlined"
        />
      )
    },
    {
      field: 'licenseExpiry',
      headerName: 'Expiry',
      width: 120,
      renderCell: (params) => {
        if (!params.value) return 'N/A';
        const expiryDate = new Date(params.value);
        const today = new Date();
        const isExpired = expiryDate < today;
        return (
          <Chip
            label={new Date(params.value).toLocaleDateString()}
            size="small"
            color={isExpired ? "error" : "success"}
            variant="outlined"
          />
        );
      }
    },
    {
      field: 'phoneNumber',
      headerName: 'Phone',
      width: 140,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Phone fontSize="small" sx={{ color: 'text.secondary' }} />
          {params.value || 'N/A'}
        </Box>
      )
    },
    {
      field: 'email',
      headerName: 'Email',
      flex: 1.5,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Email fontSize="small" sx={{ color: 'text.secondary' }} />
          {params.value || 'N/A'}
        </Box>
      )
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 100,
      renderCell: (params) => {
        const status = params.value || 'INACTIVE';
        const isActive = status === 'ACTIVE' || status === 'Active';
        return (
          <Chip
            label={status}
            size="small"
            color={isActive ? "success" : "default"}
            sx={{
              fontWeight: 600,
              backgroundColor: isActive ? '#e8f5e9' : '#f5f5f5',
              color: isActive ? '#2e7d32' : '#666',
            }}
          />
        );
      }
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 140,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="View Details">
            <IconButton
              size="small"
              color="primary"
              onClick={() => navigate(`/users/drivers/${params.row.id}`)}
              sx={{
                '&:hover': {
                  backgroundColor: 'primary.light',
                  color: 'primary.contrastText',
                }
              }}
            >
              <Visibility fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit">
            <IconButton
              size="small"
              color="secondary"
              onClick={() => navigate(`/users/drivers/${params.row.id}/edit`)}
              sx={{
                '&:hover': {
                  backgroundColor: 'secondary.light',
                  color: 'secondary.contrastText',
                }
              }}
            >
              <Edit fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton
              size="small"
              color="error"
              onClick={() => onDelete(params.row.id)}
              sx={{
                '&:hover': {
                  backgroundColor: 'error.light',
                  color: 'error.contrastText',
                }
              }}
            >
              <Delete fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  // Prepare rows data - ensure each row has required fields
  const rows = Array.isArray(drivers) ? drivers.map(driver => ({
    id: driver.id,
    firstName: driver.firstName,
    lastName: driver.lastName,
    email: driver.email,
    phoneNumber: driver.phoneNumber,
    licenseNumber: driver.licenseNumber,
    licenseExpiry: driver.licenseExpiry,
    status: driver.status,
    hireDate: driver.hireDate,
    licenseType: driver.licenseType
  })) : [];

  return (
    <Box sx={{ height: 500, width: '100%' }}>
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 3,
        p: 2,
        backgroundColor: 'background.paper',
        borderRadius: 1,
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <Box>
          <Button
            variant="contained"
            onClick={onAdd}
            startIcon={<Edit />}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
              py: 1,
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              '&:hover': {
                boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
              }
            }}
          >
            Add New Driver
          </Button>
          <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Chip
              label={`Total: ${rows.length}`}
              size="small"
              color="primary"
              variant="outlined"
            />
            <Chip
              label={`Active: ${rows.filter(d => d.status === 'ACTIVE').length}`}
              size="small"
              color="success"
              variant="outlined"
            />
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            size="small"
            variant="outlined"
            onClick={() => console.log('Export clicked')}
            sx={{ textTransform: 'none' }}
          >
            Export CSV
          </Button>
          <Button
            size="small"
            variant="outlined"
            onClick={() => window.location.reload()}
            sx={{ textTransform: 'none' }}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {rows.length === 0 ? (
        <Box sx={{
          textAlign: 'center',
          p: 6,
          border: '1px dashed #e0e0e0',
          borderRadius: 2,
          backgroundColor: '#fafafa',
          mt: 2
        }}>
          <p style={{
            color: '#666',
            marginBottom: 16,
            fontSize: '1.1rem',
            fontWeight: 500
          }}>
            No drivers found in the system
          </p>
          <Button
            variant="contained"
            onClick={onAdd}
            startIcon={<Edit />}
            sx={{
              borderRadius: 2,
              px: 4,
              py: 1.5,
              fontSize: '1rem'
            }}
          >
            Add Your First Driver
          </Button>
        </Box>
      ) : (
        <Box sx={{
          border: '1px solid #e0e0e0',
          borderRadius: 1,
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          // In DriverList.jsx - Fix the pagination warning
          <DataGrid
            rows={rows}
            columns={columns}
            pageSize={10}
            rowsPerPageOptions={[5, 10, 25, 50]}  // Add 10 to the options
            checkboxSelection={false}
            disableSelectionOnClick
            getRowId={(row) => row.id}
            sx={{
              border: 'none',
              '& .MuiDataGrid-cell': {
                borderRight: '1px solid #f0f0f0',
                display: 'flex',
                alignItems: 'center',
              },
              '& .MuiDataGrid-columnHeaders': {
                backgroundColor: '#f8f9fa',
                borderBottom: '2px solid #e0e0e0',
              },
              '& .MuiDataGrid-row': {
                '&:hover': {
                  backgroundColor: '#f5f5f5',
                },
                '&.Mui-selected': {
                  backgroundColor: '#e3f2fd',
                  '&:hover': {
                    backgroundColor: '#bbdefb',
                  }
                }
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
                fontSize: '0.875rem',
              },
              '& .MuiDataGrid-cellContent': {
                fontSize: '0.875rem',
              },
            }}
            initialState={{
              pagination: {
                paginationModel: { pageSize: 10, page: 0 },
              },
            }}
          />
        </Box>
      )}
    </Box>
  );
}

export default DriverList;