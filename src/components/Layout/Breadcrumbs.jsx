// src/components/Layout/Breadcrumbs.jsx
import React from 'react';
import { Breadcrumbs as MuiBreadcrumbs, Link, Typography, Box } from '@mui/material';
import { Home, NavigateNext } from '@mui/icons-material';
import { useLocation, Link as RouterLink } from 'react-router-dom';

const Breadcrumbs = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  // Special mapping for certain paths
  const getBreadcrumbName = (path) => {
    const breadcrumbMap = {
      'dashboard': 'Dashboard',
      'me': 'My Profile',
      'users': 'User Management',
      'drivers': 'Drivers',
      'new': 'Add New',
      'edit': 'Edit',
      'settings': 'Settings',
      'trips': 'Trips',
      'fuel': 'Fuel Management',
      'inventory': 'Inventory',
      'finance': 'Finance',
      'reports': 'Reports & Analytics',
      'roles': 'Roles & Permissions',
      'billing': 'Billing & Invoices',
      'audit': 'Logs & Audits',
      'locations': 'Locations',
    };

    return breadcrumbMap[path] || path.charAt(0).toUpperCase() + path.slice(1);
  };

  // Check if current breadcrumb is active (last one)
  const isLast = (index) => {
    return index === pathnames.length - 1;
  };

  return (
    <Box sx={{ mb: 3 }}>
      <MuiBreadcrumbs
        separator={<NavigateNext fontSize="small" />}
        aria-label="breadcrumb"
      >
        {/* Home link */}
        <Link
          component={RouterLink}
          to="/dashboard"
          sx={{
            display: 'flex',
            alignItems: 'center',
            color: 'text.secondary',
            textDecoration: 'none',
            '&:hover': {
              color: 'primary.main',
              textDecoration: 'underline',
            },
          }}
        >
          <Home sx={{ mr: 0.5, fontSize: '1rem' }} />
          Home
        </Link>

        {/* Generate breadcrumbs */}
        {pathnames.map((value, index) => {
          const to = `/${pathnames.slice(0, index + 1).join('/')}`;
          const breadcrumbName = getBreadcrumbName(value);

          return isLast(index) ? (
            <Typography
              key={to}
              color="text.primary"
              sx={{ fontWeight: 600 }}
            >
              {breadcrumbName}
            </Typography>
          ) : (
            <Link
              key={to}
              component={RouterLink}
              to={to}
              sx={{
                color: 'text.secondary',
                textDecoration: 'none',
                '&:hover': {
                  color: 'primary.main',
                  textDecoration: 'underline',
                },
              }}
            >
              {breadcrumbName}
            </Link>
          );
        })}
      </MuiBreadcrumbs>
    </Box>
  );
};

export default Breadcrumbs;