// src/App.jsx
import React, { Suspense, lazy, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CircularProgress, Box } from "@mui/material";

import Layout from "./components/Layout/Layout";
import PrivateRoute from "./components/Layout/PrivateRoute";
import { AuthProvider, useAuth } from "./contexts/AuthContext";


/* -------------------------------------------------------------------------- */
/* Lazy-loaded Pages (code splitting)                                          */
/* -------------------------------------------------------------------------- */
const Login = lazy(() => import("./pages/Login"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const UserProfile = lazy(() => import("./pages/UserProfile"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));

const UserList = lazy(() => import("./pages/UserList"));
const UserDetails = lazy(() => import("./pages/UserDetails"));

const DriverList = lazy(() => import("./pages/DriverList"));
const DriverDetails = lazy(() => import("./pages/DriverDetails"));
const DriverForm = lazy(() => import("./pages/DriverForm"));

const VehicleList = lazy(() => import("./pages/VehicleList"));
const VehicleDetails = lazy(() => import("./pages/VehicleDetails"));
const VehicleForm = lazy(() => import("./pages/VehicleForm"));

const FuelSlips = lazy(() => import("./pages/FuelSlips"));
const AddFuelSlip = lazy(() => import("./pages/AddFuelSlip"));

const TripList = lazy(() => import("./pages/TripList"));
const TripDetails = lazy(() => import("./pages/TripDetails"));

const FinanceDashboard = lazy(() => import("./pages/finance/FinanceDashboard"));
const AccountsPage = lazy(() => import("./pages/finance/AccountsPage"));
const ExpensesPage = lazy(() => import("./pages/finance/ExpensePage"));
const InvoicesPage = lazy(() => import("./pages/finance/InvoicePage"));
const ReceivablesPage = lazy(() => import("./pages/finance/ReceivablePage"));
const PayablesPage = lazy(() => import("./pages/finance/PayablePage"));

const PODList = lazy(() => import("./pages/PODList"));
const PodForm = lazy(() => import("./pages/PodForm"));
const PodDetails = lazy(() => import("./pages/PodDetails"));

const TripReports = lazy(() => import("./pages/TripReports"));
const TripAnalytics = lazy(() => import("./pages/TripAnalytics"));

const Logs = lazy(() => import("./pages/Logs"));
const Billing = lazy(() => import("./pages/Billing"));
const Inventory = lazy(() => import("./pages/Inventory"));
const StockMovementForm = lazy(() => import("./pages/StockMovementForm"));
const MovementHistory = lazy(() => import("./pages/MovementHistory"));
const Reports = lazy(() => import("./pages/Reports"));

/* -------------------------------------------------------------------------- */
/* Loading Fallback                                                            */
/* -------------------------------------------------------------------------- */
const LoadingFallback = () => (
  <Box sx={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    height: '100vh' 
  }}>
    <CircularProgress />
  </Box>
);

/* -------------------------------------------------------------------------- */
/* Theme                                                                       */
/* -------------------------------------------------------------------------- */
const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#1976d2" },
    secondary: { main: "#dc004e" },
    background: {
      default: "#f5f5f5",
      paper: "#ffffff",
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
          boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
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
      retry: 1,
    },
  },
});

/* -------------------------------------------------------------------------- */
/* Session Expiry Handler Component                                            */
/* -------------------------------------------------------------------------- */
const SessionExpiryHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  useEffect(() => {
    const handleSessionExpired = (event) => {
      console.log('Session expired event received:', event);
      // Clear auth data
      api.clearToken();
      logout();
      
      // Only redirect if not already on login page
      if (location.pathname !== '/login') {
        navigate('/login?session=expired', { replace: true });
      }
    };

    // Listen for session expiry events
    window.addEventListener('sessionExpired', handleSessionExpired);

    // Clean up
    return () => {
      window.removeEventListener('sessionExpired', handleSessionExpired);
    };
  }, [navigate, location, logout]);

  return null;
};

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */
const MyProfileRoute = () => {
  const { user } = useAuth();
  return user ? <UserProfile user={user} isSelfView /> : <Navigate to="/login" replace />;
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
              <SessionExpiryHandler />
              <Suspense fallback={<LoadingFallback />}>
                <Routes>
                  {/* Public Routes - Login must be first */}
                  <Route path="/login" element={<Login />} />

                  {/* Private Routes */}
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

                    {/* Trips */}
                    <Route path="trips" element={<TripList />} />
                    <Route path="trips/:id" element={<TripDetails />} />
                    <Route path="trips/:id/finalize" element={<TripDetails />} />

                    {/* Fuel */}
                    <Route path="fuel/slips" element={<FuelSlips />} />
                    <Route path="fuel/slips/add" element={<AddFuelSlip />} />
                    <Route path="fuel/slips/driver/:id" element={<FuelSlips />} />
                    <Route path="fuel/slips/vehicle/:id" element={<FuelSlips />} />
                    <Route path="fuel/slips/trip/:id" element={<FuelSlips />} />

                    {/* POD */}
                    <Route path="pods" element={<PODList />} />
                    <Route path="pods/new" element={<PodForm />} />
                    <Route path="pods/:id" element={<PodDetails />} />
                    <Route path="pods/trip/:tripId" element={<PODList />} />

                    {/* Finance */}
                    <Route path="finance" element={<FinanceDashboard />} />
                    <Route path="finance/accounts" element={<AccountsPage />} />
                    <Route path="finance/expenses" element={<ExpensesPage />} />
                    <Route path="finance/invoices" element={<InvoicesPage />} />
                    <Route path="finance/receivables" element={<ReceivablesPage />} />
                    <Route path="finance/payables" element={<PayablesPage />} />

                    {/* Reports */}
                    <Route path="reports/trips" element={<TripReports />} />
                    <Route path="analytics/trips" element={<TripAnalytics />} />
                    <Route path="reports" element={<Reports />} />

                    {/* Other */}
                    <Route path="billing" element={<Billing />} />
                    <Route path="logs" element={<Logs />} />
                    <Route path="inventory" element={<Inventory />} />
                    <Route path="inventory/movements" element={<MovementHistory />} />
                    <Route path="inventory/movements/new" element={<StockMovementForm />} />
                    <Route path="inventory/movements/:id" element={<StockMovementForm />} />
                  </Route>

                  {/* Fallback - Redirect to dashboard or login */}
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </Suspense>
            </AuthProvider>
          </Router>
        </LocalizationProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
