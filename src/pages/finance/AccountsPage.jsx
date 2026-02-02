// src/pages/finance/AccountsPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Divider,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  Grid,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Add,
  Search,
  FilterList,
  MoreVert,
  Edit,
  Delete,
  Visibility,
  AccountBalance,
  AttachMoney,
  LocalAtm,
  AccountBalanceWallet,
  TrendingUp,
  TrendingDown,
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import accountService from '../../services/account';

const AccountsPage = () => {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [actionAnchorEl, setActionAnchorEl] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      // Replace with actual API call
      // const data = await accountService.getAllAccounts();

      // Mock data based on your schema
      const mockAccounts = [
        {
          id: 1,
          name: 'Main Business Account',
          type: 'BANK',
          provider: 'Standard Bank',
          balance: 125000.50,
          currency: 'ZAR',
          accountNumber: '1234567890',
          creditLimit: 50000,
          status: 'ACTIVE',
          contactPerson: 'John Smith',
          contactPhone: '+27123456789',
          contactEmail: 'john@business.com',
          billingCycle: 'MONTHLY',
          lastReconDate: '2024-01-10',
          nextReconDue: '2024-02-10',
          notes: 'Primary operating account',
          created_at: '2023-12-01',
        },
        {
          id: 2,
          name: 'Fuel Supplier',
          type: 'VENDOR',
          provider: 'BP South Africa',
          balance: -25000.75,
          currency: 'ZAR',
          accountNumber: 'VEND-001',
          creditLimit: 100000,
          status: 'ACTIVE',
          contactPerson: 'Sarah Johnson',
          contactPhone: '+27119876543',
          contactEmail: 'sarah@bp.co.za',
          billingCycle: 'WEEKLY',
          lastReconDate: '2024-01-05',
          nextReconDue: '2024-01-12',
          notes: 'Monthly fuel supply',
          created_at: '2023-11-15',
        },
        {
          id: 3,
          name: 'Client - ABC Logistics',
          type: 'CLIENT',
          provider: 'ABC Logistics',
          balance: 75000.25,
          currency: 'USD',
          accountNumber: 'CLIENT-001',
          creditLimit: 0,
          status: 'ACTIVE',
          contactPerson: 'Mike Wilson',
          contactPhone: '+12125551234',
          contactEmail: 'mike@abclogistics.com',
          billingCycle: 'MONTHLY',
          lastReconDate: '2024-01-08',
          nextReconDue: '2024-02-08',
          notes: 'International logistics partner',
          created_at: '2023-10-20',
        },
        {
          id: 4,
          name: 'Maintenance Provider',
          type: 'VENDOR',
          provider: 'Truck Care SA',
          balance: -15000.00,
          currency: 'ZAR',
          accountNumber: 'VEND-002',
          creditLimit: 50000,
          status: 'ACTIVE',
          contactPerson: 'Robert Brown',
          contactPhone: '+27117778899',
          contactEmail: 'robert@truckcare.co.za',
          billingCycle: 'MONTHLY',
          lastReconDate: '2024-01-03',
          nextReconDue: '2024-02-03',
          notes: 'Vehicle maintenance services',
          created_at: '2023-09-10',
        },
        {
          id: 5,
          name: 'Savings Account',
          type: 'BANK',
          provider: 'First National Bank',
          balance: 50000.00,
          currency: 'ZAR',
          accountNumber: '9876543210',
          creditLimit: 0,
          status: 'ACTIVE',
          contactPerson: 'Jane Doe',
          contactPhone: '+27116667777',
          contactEmail: 'jane@business.com',
          billingCycle: 'QUARTERLY',
          lastReconDate: '2023-12-15',
          nextReconDue: '2024-03-15',
          notes: 'Emergency funds',
          created_at: '2023-08-05',
        },
      ];

      setAccounts(mockAccounts);
      setError('');
    } catch (err) {
      setError('Failed to load accounts');
      console.error('Error fetching accounts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterClick = (event) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };

  const handleActionClick = (event, row) => {
    setActionAnchorEl(event.currentTarget);
    setSelectedRow(row);
  };

  const handleActionClose = () => {
    setActionAnchorEl(null);
    setSelectedRow(null);
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
    handleActionClose();
  };

  const handleDeleteConfirm = async () => {
    try {
      // await accountService.deleteAccount(selectedRow.id);
      setAccounts(accounts.filter(acc => acc.id !== selectedRow.id));
      setDeleteDialogOpen(false);
    } catch (err) {
      console.error('Error deleting account:', err);
    }
  };

  const getAccountTypeIcon = (type) => {
    switch (type) {
      case 'BANK':
        return <AccountBalanceWallet color="primary" />;
      case 'VENDOR':
        return <LocalAtm color="secondary" />;
      case 'CLIENT':
        return <AttachMoney color="success" />;
      default:
        return <AccountBalance color="action" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'INACTIVE':
        return 'error';
      case 'SUSPENDED':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getBalanceColor = (balance) => {
    return balance >= 0 ? 'success.main' : 'error.main';
  };

  const filteredAccounts = accounts.filter(account => {
    const matchesSearch = account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         account.provider.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         account.accountNumber.toLowerCase().includes(searchTerm.toLowerCase());

    if (selectedFilter === 'all') return matchesSearch;
    if (selectedFilter === 'positive') return matchesSearch && account.balance > 0;
    if (selectedFilter === 'negative') return matchesSearch && account.balance < 0;
    return matchesSearch && account.type === selectedFilter;
  });

  const columns = [
    {
      field: 'name',
      headerName: 'Account Name',
      flex: 2,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {getAccountTypeIcon(params.row.type)}
          <Box>
            <Typography variant="body2" fontWeight={600}>
              {params.value}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {params.row.provider}
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      field: 'type',
      headerName: 'Type',
      flex: 1,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          color={
            params.value === 'BANK' ? 'primary' :
            params.value === 'VENDOR' ? 'secondary' :
            params.value === 'CLIENT' ? 'success' : 'default'
          }
        />
      ),
    },
    {
      field: 'accountNumber',
      headerName: 'Account Number',
      flex: 1,
    },
    {
      field: 'balance',
      headerName: 'Balance',
      flex: 1,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {params.value >= 0 ?
            <TrendingUp color="success" fontSize="small" /> :
            <TrendingDown color="error" fontSize="small" />
          }
          <Typography
            variant="body2"
            fontWeight={600}
            color={getBalanceColor(params.value)}
          >
            {params.row.currency} {Math.abs(params.value).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      flex: 1,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          color={getStatusColor(params.value)}
        />
      ),
    },
    {
      field: 'lastReconDate',
      headerName: 'Last Recon',
      flex: 1,
    },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 1,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <>
          <IconButton
            size="small"
            onClick={(e) => handleActionClick(e, params.row)}
          >
            <MoreVert fontSize="small" />
          </IconButton>
          <Menu
            anchorEl={actionAnchorEl}
            open={Boolean(actionAnchorEl) && selectedRow?.id === params.row.id}
            onClose={handleActionClose}
          >
            <MenuItem onClick={() => {
              navigate(`/finance/accounts/${params.row.id}`);
              handleActionClose();
            }}>
              <Visibility fontSize="small" sx={{ mr: 1 }} />
              View Details
            </MenuItem>
            <MenuItem onClick={() => {
              navigate(`/finance/accounts/${params.row.id}/edit`);
              handleActionClose();
            }}>
              <Edit fontSize="small" sx={{ mr: 1 }} />
              Edit
            </MenuItem>
            <MenuItem onClick={handleDeleteClick}>
              <Delete fontSize="small" sx={{ mr: 1 }} />
              Delete
            </MenuItem>
          </Menu>
        </>
      ),
    },
  ];

  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);
  const totalReceivable = accounts
    .filter(acc => acc.balance > 0)
    .reduce((sum, account) => sum + account.balance, 0);
  const totalPayable = Math.abs(accounts
    .filter(acc => acc.balance < 0)
    .reduce((sum, account) => sum + account.balance, 0));

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" fontWeight={600}>
          Accounts Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/finance/accounts/new')}
        >
          Add Account
        </Button>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="body2">
                Total Balance
              </Typography>
              <Typography
                variant="h4"
                fontWeight={700}
                color={totalBalance >= 0 ? 'success.main' : 'error.main'}
              >
                ZAR {totalBalance.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Across all accounts
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="body2">
                Accounts Receivable
              </Typography>
              <Typography variant="h4" fontWeight={700} color="success.main">
                ZAR {totalReceivable.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Amounts to be received
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="body2">
                Accounts Payable
              </Typography>
              <Typography variant="h4" fontWeight={700} color="error.main">
                ZAR {totalPayable.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Amounts to be paid
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search and Filter */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center">
            <TextField
              placeholder="Search accounts..."
              variant="outlined"
              size="small"
              fullWidth
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
            <Button
              variant="outlined"
              startIcon={<FilterList />}
              onClick={handleFilterClick}
            >
              Filter
            </Button>
            <Menu
              anchorEl={filterAnchorEl}
              open={Boolean(filterAnchorEl)}
              onClose={handleFilterClose}
            >
              <MenuItem
                selected={selectedFilter === 'all'}
                onClick={() => {
                  setSelectedFilter('all');
                  handleFilterClose();
                }}
              >
                All Accounts
              </MenuItem>
              <MenuItem
                selected={selectedFilter === 'positive'}
                onClick={() => {
                  setSelectedFilter('positive');
                  handleFilterClose();
                }}
              >
                Positive Balance
              </MenuItem>
              <MenuItem
                selected={selectedFilter === 'negative'}
                onClick={() => {
                  setSelectedFilter('negative');
                  handleFilterClose();
                }}
              >
                Negative Balance
              </MenuItem>
              <Divider />
              <MenuItem
                selected={selectedFilter === 'BANK'}
                onClick={() => {
                  setSelectedFilter('BANK');
                  handleFilterClose();
                }}
              >
                Bank Accounts
              </MenuItem>
              <MenuItem
                selected={selectedFilter === 'VENDOR'}
                onClick={() => {
                  setSelectedFilter('VENDOR');
                  handleFilterClose();
                }}
              >
                Vendor Accounts
              </MenuItem>
              <MenuItem
                selected={selectedFilter === 'CLIENT'}
                onClick={() => {
                  setSelectedFilter('CLIENT');
                  handleFilterClose();
                }}
              >
                Client Accounts
              </MenuItem>
            </Menu>
          </Stack>
        </CardContent>
      </Card>

      {/* Accounts Table */}
      {error ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      ) : (
        <Card>
          <CardContent>
            <Box sx={{ height: 500, width: '100%' }}>
              <DataGrid
                rows={filteredAccounts}
                columns={columns}
                pageSize={10}
                rowsPerPageOptions={[10, 25, 50]}
                checkboxSelection={false}
                disableSelectionOnClick
                getRowId={(row) => row.id}
                sx={{
                  '& .MuiDataGrid-cell': {
                    borderRight: '1px solid #f0f0f0',
                  },
                  '& .MuiDataGrid-columnHeaders': {
                    backgroundColor: '#f8f9fa',
                    borderBottom: '2px solid #e0e0e0',
                  },
                  '& .MuiDataGrid-row:hover': {
                    backgroundColor: '#f5f5f5',
                  },
                }}
              />
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Account</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{selectedRow?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AccountsPage;