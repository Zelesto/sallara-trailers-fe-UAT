// src/components/Layout/EnhancedBreadcrumbs.jsx
import React from 'react';
import { Breadcrumbs as MuiBreadcrumbs, Link, Typography, Box } from '@mui/material';
import { Home, NavigateNext } from '@mui/icons-material';
import { useLocation, Link as RouterLink, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import driverService from '../../services/driver';
import userService from '../../services/user';

const EnhancedBreadcrumbs = () => {
  const location = useLocation();
  const params = useParams();
  const pathnames = location.pathname.split('/').filter((x) => x);

  // Fetch driver details if we're on a driver detail/edit page
  const { data: driver } = useQuery({
    queryKey: ['driver', params.id],
    queryFn: () => driverService.getDriverById(params.id),
    enabled: pathnames.includes('drivers') && params.id && !pathnames.includes('new'),
  });

  // Fetch user details if we're on a user detail page
  const { data: user } = useQuery({
    queryKey: ['user', params.id],
    queryFn: () => userService.getUserById(params.id),
    enabled: pathnames.includes('users') && params.id && !pathnames.includes('drivers'),
  });

  // Special mapping for certain paths
  const getBreadcrumbName = (path, index, fullPathnames) => {
    // Handle dynamic titles
    if (path === params.id) {
      if (fullPathnames.includes('drivers') && driver) {
        return `${driver.firstName} ${driver.lastName}`;
      }
      if (fullPathnames.includes('users') && user) {
        return user.username || user.email;
      }
    }

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
      'details': 'Details',
    };

    const name = breadcrumbMap[path] || path.charAt(0).toUpperCase() + path.slice(1);

    // Replace underscores with spaces
    return name.replace(/_/g, ' ');
  };

  // Check if current breadcrumb is active (last one)
  const isLast = (index) => {
    return index === pathnames.length - 1;
  };

  // Don't show breadcrumbs on login page
  if (location.pathname === '/login') {
    return null;
  }

  return (
    <Box sx={{ mb: 3, px: 1 }}>
      <MuiBreadcrumbs
        separator={<NavigateNext fontSize="small" />}
        aria-label="breadcrumb"
        sx={{
          '& .MuiBreadcrumbs-ol': {
            flexWrap: 'nowrap',
            overflow: 'hidden',
          },
          '& .MuiBreadcrumbs-li': {
            maxWidth: '200px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          },
        }}
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
          const breadcrumbName = getBreadcrumbName(value, index, pathnames);

          // Don't show ID numbers as breadcrumbs
          if (!isNaN(value) && value.length > 3) {
            return null;
          }

          return isLast(index) ? (
            <Typography
              key={to}
              color="text.primary"
              sx={{
                fontWeight: 600,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              title={breadcrumbName}
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
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                '&:hover': {
                  color: 'primary.main',
                  textDecoration: 'underline',
                },
              }}
              title={breadcrumbName}
            >
              {breadcrumbName}
            </Link>
          );
        })}
      </MuiBreadcrumbs>
    </Box>
  );
};

export default EnhancedBreadcrumbs;