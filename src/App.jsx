// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import Layout from './components/Layout/Layout';
import PrivateRoute from './components/Layout/PrivateRoute';
import { AuthProvider, useAuth } from './contexts/AuthContext';

/* -------------------------------------------------------------------------- */
/* Pages                                                                       */
/* -------------------------------------------------------------------------- */

// Auth / Core
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import UserProfile from './pages/UserProfile';
import SettingsPage from './pages/SettingsPage';

// Users
import UserList from './pages/UserList';
import UserDetails from './pages/UserDetails';

// Drivers
import DriverList from './pages/DriverList';
import DriverDetails from './pages/DriverDetails';
import DriverForm from './pages/DriverForm';

// Vehicles
import VehicleList from './pages/VehicleList';
import VehicleDetails from './pages/VehicleDetails';
import VehicleForm from './pages/VehicleForm';

// Fuel Management
import FuelSlips from './pages/FuelSlips';
import AddFuelSlip from './pages/AddFuelSlip';

// Trips Management
import TripList from './pages/TripList';
import TripDetails from './pages/TripDetails';
// REMOVED: TripForm import here - it's only used as a modal in TripList

// Finance
import FinanceDashboard from './pages/finance/FinanceDashboard';
import AccountsPage from './pages/finance/AccountsPage';
import ExpensesPage from './pages/finance/ExpensePage';
import InvoicesPage from './pages/finance/InvoicePage';
import ReceivablesPage from './pages/finance/ReceivablePage';
import PayablesPage from './pages/finance/PayablePage';

// POD Management (Proof of Delivery)
import PodList from './pages/PodList';
import PodForm from './pages/PodForm';
import PodDetails from './pages/PodDetails';

// Reports
import TripReports from './pages/TripReports';
import TripAnalytics from './pages/TripAnalytics';

// Other
import Logs from './pages/Logs';
import Billing from './pages/Billing';
import Inventory from './pages/Inventory';
import Reports from './pages/Reports';

/* -------------------------------------------------------------------------- */
/* Theme                                                                       */
/* -------------------------------------------------------------------------- */

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#1976d2' },
    secondary: { main: '#dc004e' },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
        },
      },
    },
  },
});

/* -------------------------------------------------------------------------- */
/* React Query                                                                 */
/* -------------------------------------------------------------------------- */

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

// /me route wrapper
const MyProfileRoute = () => {
  const { user } = useAuth();
  return user ? (
    <UserProfile user={user} isSelfView />
  ) : (
    <Navigate to="/login" replace />
  );
};

/* -------------------------------------------------------------------------- */
/* App                                                                         */
/* -------------------------------------------------------------------------- */

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <Router>
            <AuthProvider>
              <Routes>
                {/* ---------------- Public ---------------- */}
                <Route path="/login" element={<Login />} />

                {/* ---------------- Private ---------------- */}
                <Route
                  path="/"
                  element={
                    <PrivateRoute>
                      <Layout />
                    </PrivateRoute>
                  }
                >
                  {/* Dashboard */}
                  <Route index element={<Navigate to="/dashboard" replace />} />
                  <Route path="dashboard" element={<Dashboard />} />

                  {/* Profile */}
                  <Route path="me" element={<MyProfileRoute />} />
                  <Route path="users/:id" element={<UserProfile isSelfView={false} />} />

                  {/* Settings */}
                  <Route path="settings" element={<SettingsPage />} />

                  {/* Users */}
                  <Route path="users" element={<UserList />} />
                  <Route path="users/:id/details" element={<UserDetails />} />

                  {/* Drivers */}
                  <Route path="drivers" element={<DriverList />} />
                  <Route path="drivers/new" element={<DriverForm />} />
                  <Route path="drivers/:id" element={<DriverDetails />} />
                  <Route path="drivers/:id/edit" element={<DriverForm />} />

                  {/* Vehicles */}
                  <Route path="vehicles" element={<VehicleList />} />
                  <Route path="vehicles/new" element={<VehicleForm />} />
                  <Route path="vehicles/:id" element={<VehicleDetails />} />
                  <Route path="vehicles/:id/edit" element={<VehicleForm />} />

                  {/* Trips Management */}
                  <Route path="trips" element={<TripList />} />
                  {/* REMOVED: TripForm routes - handled as modal in TripList */}
                  <Route path="trips/:id" element={<TripDetails />} />
                  {/* REMOVED: trips/:id/edit route - handled as modal */}
                  {/* REMOVED: trips/:id/metrics route - handled as modal */}
                  <Route path="trips/:id/finalize" element={<TripDetails />} />

                  {/* Fuel Management */}
                  <Route path="fuel/slips" element={<FuelSlips />} />
                  <Route path="fuel/slips/add" element={<AddFuelSlip />} />
                  <Route path="fuel/slips/driver/:id" element={<FuelSlips />} />
                  <Route path="fuel/slips/vehicle/:id" element={<FuelSlips />} />
                  <Route path="fuel/slips/trip/:id" element={<FuelSlips />} />

                  {/* POD Management */}
                  <Route path="pods" element={<PodList />} />
                  <Route path="pods/new" element={<PodForm />} />
                  <Route path="pods/:id" element={<PodDetails />} />
                  <Route path="pods/trip/:tripId" element={<PodList />} />

                  {/* Finance */}
                  <Route path="finance" element={<FinanceDashboard />} />
                  <Route path="finance/dashboard" element={<FinanceDashboard />} />
                  <Route path="finance/accounts" element={<AccountsPage />} />
                  <Route path="finance/accounts/:id" element={<AccountsPage />} />
                  <Route path="finance/expenses" element={<ExpensesPage />} />
                  <Route path="finance/invoices" element={<InvoicesPage />} />
                  <Route path="finance/receivables" element={<ReceivablesPage />} />
                  <Route path="finance/payables" element={<PayablesPage />} />

                  {/* Reports & Analytics */}
                  <Route path="reports/trips" element={<TripReports />} />
                  <Route path="analytics/trips" element={<TripAnalytics />} />
                  <Route path="reports" element={<Reports />} />

                  {/* Other */}
                  <Route path="billing" element={<Billing />} />
                  <Route path="logs" element={<Logs />} />
                  <Route path="inventory" element={<Inventory />} />
                </Route>

                {/* ---------------- Fallback ---------------- */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </AuthProvider>
          </Router>
        </LocalizationProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;