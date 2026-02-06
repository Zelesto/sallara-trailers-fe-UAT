// src/components/Layout/Layout.jsx
import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useTheme,
  useMediaQuery,
  Avatar,
  Badge,
  Divider,
  ListItemButton,
  Stack,
  Button,
  Menu,
  MenuItem,
  Collapse,
  Tooltip,
} from '@mui/material';

import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  DirectionsCar as CarIcon,
  LocalGasStation as FuelIcon,
  Inventory as InventoryIcon,
  AttachMoney as MoneyIcon,
  Assessment as ReportsIcon,
  Logout as LogoutIcon,
  ExpandLess,
  ExpandMore,
  Person,
  DirectionsCar,
  Timeline,
  ChevronLeft,
  ChevronRight,
  Settings,
  Notifications,
  Search,
  Circle,
  AdminPanelSettings,
  People,
  Receipt,
  LocationOn,
  ReceiptLong as ReceiptLongIcon,
  AccountBalance as AccountBalanceIcon,
  Description as DescriptionIcon,
  // NEW ICONS FOR TRIP MANAGEMENT
  Route as RouteIcon,
  AddLocation as AddLocationIcon,
  Assessment as AnalyticsIcon,
  Receipt as PodIcon,
  FileCopy as BatchIcon,
  CheckCircle as FinalizeIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { styled } from '@mui/material/styles';

// Import your logo image
import logoImage from '../assets/img/PGSALogo.png'; // Update this path as needed

// Choose which Breadcrumbs component to use:
import Breadcrumbs from './Breadcrumbs';

const drawerWidth = 280;
const collapsedDrawerWidth = 70;

// Styled components with shouldForwardProp to prevent boolean DOM attribute warning
const LogoContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(1.5, 2),
  borderBottom: `1px solid ${theme.palette.divider}`,
  minHeight: 64,
  position: 'relative',
}));

const LogoWrapper = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'collapsed',
})(({ theme, collapsed }) => ({
  display: 'flex',
  flexDirection: collapsed ? 'row' : 'column',
  alignItems: 'center',
  gap: theme.spacing(1),
  transition: 'all 0.3s ease',
  width: '100%',
  justifyContent: collapsed ? 'center' : 'center',
}));

const SidebarItem = styled(ListItemButton)(({ theme, selected }) => ({
  borderRadius: theme.spacing(1),
  margin: theme.spacing(0.5, 1),
  paddingLeft: theme.spacing(2.5),
  '&.Mui-selected': {
    backgroundColor: theme.palette.primary.light + '20',
    color: theme.palette.primary.main,
    '&:hover': {
      backgroundColor: theme.palette.primary.light + '30',
    },
  },
}));

const SectionHeader = styled(ListItemButton)(({ theme }) => ({
  borderRadius: theme.spacing(1),
  margin: theme.spacing(0.5, 1),
  marginTop: theme.spacing(2),
  backgroundColor: theme.palette.grey[50],
  '&:hover': {
    backgroundColor: theme.palette.grey[100],
  },
}));

// User profile container with fixed position at bottom
const UserProfileContainer = styled(Box)(({ theme, collapsed }) => ({
  borderTop: `1px solid ${theme.palette.divider}`,
  padding: collapsed ? theme.spacing(2, 1) : theme.spacing(2),
  position: 'sticky',
  bottom: 0,
  backgroundColor: theme.palette.background.paper,
  zIndex: 2,
}));

// Updated menu structure with Trip Management section
const menuSections = [
  {
    title: 'Operations',
    icon: <CarIcon />,
    items: [
      { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
      {
        text: 'Trips',
        icon: <RouteIcon />,
        path: '/trips',
        subItems: [
          { text: 'All Trips', path: '/trips', icon: <RouteIcon /> },
          { text: 'Active Trips', path: '/trips?status=ACTIVE', icon: <Timeline /> },
          { text: 'Finalize Trip', path: '/trips/finalize', icon: <FinalizeIcon /> },
        ],
      },
      {
        text: 'POD Management',
        icon: <PodIcon />,
        path: '/pods',
        subItems: [
          { text: 'All PODs', path: '/pods', icon: <PodIcon /> },
          { text: 'Create POD', path: '/pods/new', icon: <AddLocationIcon /> },
          { text: 'By Trip', path: '/pods/trip', icon: <RouteIcon /> },
        ],
      },
      {
        text: 'Fuel Management',
        icon: <FuelIcon />,
        path: '/fuel',
        subItems: [
          { text: 'All Fuel Slips', path: '/fuel/slips', icon: <FuelIcon /> },
          { text: 'Add Fuel Slip', path: '/fuel/slips/add', icon: <AddLocationIcon /> },
          { text: 'By Driver', path: '/fuel/slips/driver', icon: <Person /> },
          { text: 'By Vehicle', path: '/fuel/slips/vehicle', icon: <DirectionsCar /> },
          { text: 'By Trip', path: '/fuel/slips/trip', icon: <RouteIcon /> },
        ],
      },
      { text: 'Inventory', icon: <InventoryIcon />, path: '/inventory' },
    ],
  },
  {
    title: 'Assets',
    icon: <DirectionsCar />,
    items: [
      { text: 'Vehicles', icon: <DirectionsCar />, path: '/vehicles' },
      { text: 'Drivers', icon: <Person />, path: '/drivers' },
      { text: 'Trailers', icon: <CarIcon />, path: '/trailers' },
      { text: 'Equipment', icon: <InventoryIcon />, path: '/equipment' },
    ],
  },
  {
    title: 'Finance',
    icon: <MoneyIcon />,
    items: [
      { text: 'Finance Dashboard', icon: <DashboardIcon />, path: '/finance/dashboard' },
      { text: 'Expenses', icon: <ReceiptLongIcon />, path: '/finance/expenses' },
      { text: 'Accounts', icon: <AccountBalanceIcon />, path: '/finance/accounts' },
      { text: 'Invoices', icon: <DescriptionIcon />, path: '/finance/invoices' },
      { text: 'Receivables', icon: <ReceiptLongIcon />, path: '/finance/receivables' },
      { text: 'Payables', icon: <DescriptionIcon />, path: '/finance/payables' },
    ],
  },
  {
    title: 'Reports & Analytics',
    icon: <AnalyticsIcon />,
    items: [
      { text: 'Trip Analytics', icon: <AnalyticsIcon />, path: '/analytics/trips' },
      { text: 'Trip Reports', icon: <ReportsIcon />, path: '/reports/trips' },
      { text: 'Fuel Reports', icon: <FuelIcon />, path: '/reports/fuel' },
      { text: 'Financial Reports', icon: <MoneyIcon />, path: '/reports/financial' },
      { text: 'Performance Reports', icon: <Timeline />, path: '/reports/performance' },
    ],
  },
  {
    title: 'Administration',
    icon: <AdminPanelSettings />,
    items: [
      { text: 'Users Management', icon: <People />, path: '/users' },
      { text: 'Roles & Permissions', icon: <AdminPanelSettings />, path: '/roles' },
      { text: 'System Settings', icon: <Settings />, path: '/settings' },
      { text: 'Billing & Invoices', icon: <Receipt />, path: '/billing' },
      { text: 'Logs & Audits', icon: <Timeline />, path: '/logs' },
      { text: 'Locations', icon: <LocationOn />, path: '/locations' },
    ],
  },
];

const MainLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  // Start with sidebar collapsed by default
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [expandedSections, setExpandedSections] = useState(
    menuSections.reduce((acc, _, index) => {
      acc[index] = false; // All sections collapsed by default
      return acc;
    }, {})
  );
  const [expandedMenuItems, setExpandedMenuItems] = useState({});
  const [anchorEl, setAnchorEl] = useState(null);
  const { user, logout } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();

  // Load sidebar state from localStorage on mount
  useEffect(() => {
    const savedSidebarState = localStorage.getItem('sidebarCollapsed');
    if (savedSidebarState !== null) {
      setSidebarCollapsed(JSON.parse(savedSidebarState));
    }
  }, []);

  // Save sidebar state to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(sidebarCollapsed));
  }, [sidebarCollapsed]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const toggleSection = (index) => {
    setExpandedSections(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const toggleMenuItem = (itemText) => {
    setExpandedMenuItems(prev => ({
      ...prev,
      [itemText]: !prev[itemText]
    }));
  };

  const handleUserMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNavigation = (path) => {
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const handleLogout = () => {
    handleUserMenuClose();
    logout();
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <LogoContainer>
        <LogoWrapper collapsed={sidebarCollapsed ? 1 : 0}>
          {sidebarCollapsed ? (
            // Collapsed state: Show logo only centered
            <Box sx={{
              width: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              borderRadius: 1,
            }}>
              <Box
                component="img"
                src={logoImage}
                alt="PGSA Logo"
                sx={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  padding: 0.5,
                }}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentElement.innerHTML = `
                    <div style="
                      width: 40px;
                      height: 40px;
                      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                      border-radius: 8px;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      color: white;
                      font-weight: bold;
                      font-size: 14px;
                    ">P</div>
                  `;
                }}
              />
            </Box>
          ) : (
            // Expanded state: Show logo with text
            <>
              <Box sx={{
                width: 48,
                height: 48,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                borderRadius: 1,
              }}>
                <Box
                  component="img"
                  src={logoImage}
                  alt="PGSA Logo"
                  sx={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    padding: 0.5,
                  }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentElement.innerHTML = `
                      <div style="
                        width: 48px;
                        height: 48px;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        border-radius: 8px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: white;
                        font-weight: bold;
                        font-size: 16px;
                      ">PGSA</div>
                    `;
                  }}
                />
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 700,
                    color: theme.palette.primary.main,
                    mb: 0.25,
                    fontSize: '0.95rem',
                    lineHeight: 1.2,
                  }}
                >
                  TRAILERS <Typography variant="caption"
                                                         sx={{
                                                           color: 'text.secondary',
                                                           fontWeight: 500,
                                                           fontSize: '0.7rem',
                                                           display: 'block',
                                                           lineHeight: 1.2,
                                                         }}
                                                       >v1.01</Typography>
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: 'text.secondary',
                    fontWeight: 500,
                    fontSize: '0.7rem',
                    display: 'block',
                    lineHeight: 1.2,
                  }}
                >
                  Phoenix Group SA
                </Typography>
              </Box>
            </>
          )}
        </LogoWrapper>

        {/* Toggle button - always visible on desktop when sidebar is expanded */}
        {!isMobile && !sidebarCollapsed && (
          <IconButton
            onClick={toggleSidebar}
            size="small"
            sx={{
              position: 'absolute',
              right: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              backgroundColor: theme.palette.grey[100],
              '&:hover': {
                backgroundColor: theme.palette.grey[200],
              },
              zIndex: 1,
            }}
          >
            <ChevronLeft />
          </IconButton>
        )}

        {/* Show toggle button when collapsed (for expanding) */}
        {!isMobile && sidebarCollapsed && (
          <IconButton
            onClick={toggleSidebar}
            size="small"
            sx={{
              position: 'absolute',
              right: -12,
              top: '50%',
              transform: 'translateY(-50%)',
              backgroundColor: theme.palette.grey[100],
              border: `1px solid ${theme.palette.divider}`,
              '&:hover': {
                backgroundColor: theme.palette.grey[200],
              },
              zIndex: 1,
              boxShadow: 1,
            }}
          >
            <ChevronRight />
          </IconButton>
        )}
      </LogoContainer>

      <Box sx={{ flex: 1, overflow: 'auto', py: 2, pb: 8 }}>
        {menuSections.map((section, index) => (
          <React.Fragment key={section.title}>
            {!sidebarCollapsed ? (
              <>
                {/* Expanded View - With Section Header */}
                <SectionHeader onClick={() => toggleSection(index)}>
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    {section.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={section.title}
                    primaryTypographyProps={{
                      fontSize: '0.875rem',
                      fontWeight: 600,
                    }}
                  />
                  {expandedSections[index] ? <ExpandLess /> : <ExpandMore />}
                </SectionHeader>

                <Collapse in={expandedSections[index]} timeout="auto" unmountOnExit>
                  <List disablePadding>
                    {section.items.map((item) => {
                      const isSelected = location.pathname === item.path ||
                                        (item.path !== '/dashboard' && location.pathname.startsWith(item.path)) ||
                                        (item.subItems && item.subItems.some(sub =>
                                          location.pathname.startsWith(sub.path)
                                        ));
                      const hasSubItems = item.subItems && item.subItems.length > 0;
                      const isMenuItemExpanded = expandedMenuItems[item.text] ||
                                                (hasSubItems && item.subItems.some(sub =>
                                                  location.pathname.startsWith(sub.path)
                                                ));

                      return (
                        <React.Fragment key={item.text}>
                          <SidebarItem
                            onClick={() => hasSubItems ? toggleMenuItem(item.text) : handleNavigation(item.path)}
                            selected={isSelected}
                            sx={{
                              py: theme.spacing(0.75),
                              backgroundColor: hasSubItems && location.pathname.startsWith(item.path + '/')
                                ? theme.palette.primary.light + '20'
                                : 'inherit',
                            }}
                          >
                            <ListItemIcon sx={{ minWidth: 40 }}>
                              {item.icon}
                            </ListItemIcon>
                            <ListItemText
                              primary={item.text}
                              primaryTypographyProps={{
                                fontSize: '0.875rem',
                                fontWeight: 500,
                              }}
                            />
                            {hasSubItems && (
                              isMenuItemExpanded
                                ? <ExpandLess sx={{ fontSize: '1rem' }} />
                                : <ExpandMore sx={{ fontSize: '1rem' }} />
                            )}
                          </SidebarItem>

                          {/* Render sub-items */}
                          {hasSubItems && isMenuItemExpanded && (
                            <List disablePadding sx={{ pl: 4 }}>
                              {item.subItems.map((subItem) => {
                                const isSubSelected = location.pathname === subItem.path ||
                                                     location.pathname.startsWith(subItem.path + '/') ||
                                                     (subItem.path.includes('?') &&
                                                      location.pathname.startsWith(subItem.path.split('?')[0]));
                                return (
                                  <SidebarItem
                                    key={subItem.text}
                                    onClick={() => handleNavigation(subItem.path)}
                                    selected={isSubSelected}
                                    sx={{
                                      py: theme.spacing(0.5),
                                      pl: theme.spacing(4),
                                      fontSize: '0.8125rem',
                                    }}
                                  >
                                    <ListItemIcon sx={{ minWidth: 36 }}>
                                      {subItem.icon}
                                    </ListItemIcon>
                                    <ListItemText
                                      primary={subItem.text}
                                      primaryTypographyProps={{
                                        fontSize: '0.8125rem',
                                        fontWeight: 500,
                                      }}
                                    />
                                  </SidebarItem>
                                );
                              })}
                            </List>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </List>
                </Collapse>
              </>
            ) : (
              // Collapsed View - Show only icons with tooltips
              <Box>
                <Box sx={{
                  px: 0.5,
                  py: 0.5,
                  textAlign: 'center',
                  mx: 0.5,
                  mb: 0.5,
                  mt: 1,
                }}>
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'text.secondary',
                      fontWeight: 600,
                      fontSize: '0.6rem',
                      letterSpacing: '0.5px',
                      textTransform: 'uppercase',
                    }}
                  >
                    {section.title.split(' ')[0]}
                  </Typography>
                </Box>

                <List disablePadding>
                  {section.items.map((item) => {
                    const isSelected = location.pathname === item.path ||
                                      (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
                    return (
                      <Tooltip key={item.text} title={item.text} placement="right" arrow>
                        <ListItemButton
                          onClick={() => handleNavigation(item.path)}
                          selected={isSelected}
                          sx={{
                            justifyContent: 'center',
                            py: 1.25,
                            borderRadius: 1,
                            margin: 0.5,
                            minHeight: 44,
                            '&.Mui-selected': {
                              backgroundColor: theme.palette.primary.light + '20',
                              position: 'relative',
                              '&::after': {
                                content: '""',
                                position: 'absolute',
                                left: 0,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                width: 3,
                                height: 20,
                                backgroundColor: theme.palette.primary.main,
                                borderRadius: '0 3px 3px 0',
                              },
                            },
                          }}
                        >
                          <ListItemIcon sx={{
                            minWidth: 'auto',
                            justifyContent: 'center',
                            color: isSelected ? theme.palette.primary.main : 'inherit'
                          }}>
                            {item.icon}
                          </ListItemIcon>
                        </ListItemButton>
                      </Tooltip>
                    );
                  })}
                </List>
              </Box>
            )}
            {!sidebarCollapsed && index < menuSections.length - 1 && (
              <Divider sx={{ my: 2, mx: 3 }} />
            )}
          </React.Fragment>
        ))}
      </Box>

      {/* User Profile - Always visible at bottom */}
      <UserProfileContainer collapsed={sidebarCollapsed}>
        {!sidebarCollapsed ? (
          // Expanded user profile view
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar
              sx={{
                width: 40,
                height: 40,
                bgcolor: 'primary.main',
                cursor: 'pointer'
              }}
              onClick={handleUserMenuOpen}
            >
              {user?.username?.charAt(0).toUpperCase() || <Person />}
            </Avatar>

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="subtitle2"
                fontWeight={600}
                noWrap
              >
                {user?.username}
              </Typography>

              <Typography
                variant="caption"
                color="text.secondary"
                noWrap
              >
                {user?.roles?.map(r => r.name).join(', ')}
              </Typography>
            </Box>
          </Stack>
        ) : (
          // Collapsed user profile view
          <Tooltip title={user?.username || "User Profile"} placement="right" arrow>
            <ListItemButton
              onClick={handleUserMenuOpen}
              sx={{
                justifyContent: 'center',
                borderRadius: 1,
                py: 1.5,
                px: 0,
              }}
            >
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: 'primary.main',
                }}
              >
                {user?.username?.charAt(0).toUpperCase() || <Person />}
              </Avatar>
            </ListItemButton>
          </Tooltip>
        )}
      </UserProfileContainer>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />

      {/* AppBar */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${sidebarCollapsed ? collapsedDrawerWidth : drawerWidth}px)` },
          ml: { md: sidebarCollapsed ? collapsedDrawerWidth : drawerWidth },
          backgroundColor: 'background.paper',
          color: 'text.primary',
          boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
          borderBottom: `1px solid ${theme.palette.divider}`,
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { md: 'none' } }}
            >
              <MenuIcon />
            </IconButton>

            {/* Show small logo in AppBar when sidebar is collapsed */}
            {sidebarCollapsed && !isMobile && (
              <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                <Box sx={{ width: 32, height: 32, mr: 1 }}>
                  <Box
                    component="img"
                    src={logoImage}
                    alt="PGSA Logo"
                    sx={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      borderRadius: 1,
                      padding: 0.25,
                    }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentElement.innerHTML = `
                        <div style="
                          width: 32px;
                          height: 32px;
                          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                          border-radius: 6px;
                          display: flex;
                          align-items: center;
                          justify-content: center;
                          color: white;
                          font-weight: bold;
                          font-size: 12px;
                        ">P</div>
                      `;
                    }}
                  />
                </Box>
                <Typography variant="subtitle1" noWrap sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
                  Trailers
                </Typography>
              </Box>
            )}

            <Typography variant="h6" noWrap sx={{ fontWeight: 600 }}>
              Fleet Management System
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} alignItems="center">
            <IconButton size="small" sx={{ borderRadius: 1 }}>
              <Search />
            </IconButton>
            <IconButton size="small" sx={{ borderRadius: 1 }}>
              <Badge badgeContent={3} color="error">
                <Notifications />
              </Badge>
            </IconButton>
            <IconButton size="small" sx={{ borderRadius: 1 }}>
              <Settings />
            </IconButton>

            {/* New Trip Button - Updated to use URL hash */}
            <Button
              variant="contained"
              size="small"
              onClick={() => navigate('/trips#create')}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                px: 2,
                backgroundColor: theme.palette.success.main,
                '&:hover': {
                  backgroundColor: theme.palette.success.dark,
                }
              }}
              startIcon={<AddLocationIcon />}
            >
              New Trip
            </Button>
          </Stack>
        </Toolbar>
      </AppBar>

      {/* User Menu Dropdown */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleUserMenuClose}
        PaperProps={{
          elevation: 3,
          sx: {
            mt: 1.5,
            minWidth: 200,
          }
        }}
      >
        <MenuItem onClick={() => {
          handleUserMenuClose();
          navigate('/me');
        }}>
          <ListItemIcon>
            <Person fontSize="small" />
          </ListItemIcon>
          <ListItemText>My Profile</ListItemText>
        </MenuItem>

        <MenuItem onClick={() => {
          handleUserMenuClose();
          navigate('/settings');
        }}>
          <ListItemIcon>
            <Settings fontSize="small" />
          </ListItemIcon>
          <ListItemText>Settings</ListItemText>
        </MenuItem>

        <Divider />

        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Logout</ListItemText>
        </MenuItem>
      </Menu>

      {/* Sidebar */}
      <Box
        component="nav"
        sx={{
          width: { md: sidebarCollapsed ? collapsedDrawerWidth : drawerWidth },
          flexShrink: { md: 0 },
        }}
      >
        {isMobile ? (
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{ keepMounted: true }}
            sx={{
              '& .MuiDrawer-paper': {
                width: drawerWidth,
              },
            }}
          >
            {drawer}
          </Drawer>
        ) : (
          <Drawer
            variant="permanent"
            sx={{
              '& .MuiDrawer-paper': {
                width: sidebarCollapsed ? collapsedDrawerWidth : drawerWidth,
                borderRight: `1px solid ${theme.palette.divider}`,
                transition: theme.transitions.create('width', {
                  easing: theme.transitions.easing.sharp,
                  duration: theme.transitions.duration.enteringScreen,
                }),
                overflowX: 'hidden',
                position: 'relative',
              },
            }}
            open
          >
            {drawer}
          </Drawer>
        )}
      </Box>

      {/* Main content area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${sidebarCollapsed ? collapsedDrawerWidth : drawerWidth}px)` },
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          backgroundColor: theme.palette.grey[50],
          minHeight: '100vh',
        }}
      >
        <Toolbar />

        {/* Breadcrumbs */}
        <Breadcrumbs />

        <Outlet />
      </Box>
    </Box>
  );
};

export default MainLayout;
