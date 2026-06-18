// src/components/Layout/Layout.jsx
import React, { useState, useEffect, useRef } from 'react';
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
  AdminPanelSettings,
  People,
  Receipt,
  LocationOn,
  ReceiptLong as ReceiptLongIcon,
  AccountBalance as AccountBalanceIcon,
  Description as DescriptionIcon,
  Route as RouteIcon,
  AddLocation as AddLocationIcon,
  Analytics as AnalyticsIcon,
  Receipt as PodIcon,
  FileCopy as BatchIcon,
  CheckCircle as FinalizeIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { styled } from '@mui/material/styles';

// Import your logo image
import logoImage from '../assets/img/PGSALogo.png'; // Update this path as needed

import Breadcrumbs from './Breadcrumbs';
import {TripForm} from '../components';

const drawerWidth = 280;
const collapsedDrawerWidth = 70;

// Styled components with shouldForwardProp to prevent boolean DOM attribute warning
const LogoContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(2, 2),
  borderBottom: `1px solid ${theme.palette.divider}`,
  minHeight: 250,
  position: 'relative',
  overflow: 'hidden',
}));

const LogoWrapper = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'collapsed',
})(({ theme, collapsed }) => ({
  display: 'flex',
  flexDirection: collapsed ? 'row' : 'column',
  alignItems: 'center',
  gap: theme.spacing(1.5),
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
  backgroundColor: 'transparent',
  '&:hover': {
    backgroundColor: theme.palette.grey[100],
  },
}));

const MainContentWrapper = styled(Box)(({ theme }) => ({
  flex: 1,
  overflowY: 'auto',
  paddingBottom: '80px',
}));

const UserProfileContainer = styled(Box)(({ theme, collapsed }) => ({
  borderTop: `1px solid ${theme.palette.divider}`,
  padding: collapsed ? theme.spacing(1.5, 1) : theme.spacing(2),
  position: 'fixed',
  bottom: 0,
  left: 0,
  right: 0,
  width: collapsed ? collapsedDrawerWidth : drawerWidth,
  backgroundColor: theme.palette.background.paper,
  zIndex: 10,
  transition: theme.transitions.create(['width', 'transform'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
}));

// Responsive menu sections
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
        ],
      },
      {
        text: 'POD Management',
        icon: <PodIcon />,
        path: '/pods',
        subItems: [
          { text: 'All PODs', path: '/pods', icon: <PodIcon /> },
          { text: 'Create POD', path: '/pods/new', icon: <AddLocationIcon /> },
        ],
      },
      {
        text: 'Fuel Management',
        icon: <FuelIcon />,
        path: '/fuel/slips',
        subItems: [
          { text: 'All Fuel Slips', path: '/fuel/slips', icon: <FuelIcon /> },
          { text: 'Add Fuel Slip', path: '/fuel/slips/add', icon: <AddLocationIcon /> },
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
    ],
  },
  {
    title: 'Finance',
    icon: <MoneyIcon />,
    items: [
      { text: 'Finance Dashboard', icon: <DashboardIcon />, path: '/finance' },
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
    ],
  },
  {
    title: 'Administration',
    icon: <AdminPanelSettings />,
    items: [
      { text: 'Users Management', icon: <People />, path: '/users' },
      { text: 'System Settings', icon: <Settings />, path: '/settings' },
      { text: 'Logs & Audits', icon: <Timeline />, path: '/logs' },
    ],
  },
];

const MainLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [expandedSections, setExpandedSections] = useState({});
  const [expandedMenuItems, setExpandedMenuItems] = useState({});
  const [anchorEl, setAnchorEl] = useState(null);
  
  // ADD STATE FOR TRIP MODAL
  const [tripModalOpen, setTripModalOpen] = useState(false);
  
  const { user, logout } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const location = useLocation();
  const sidebarRef = useRef(null);
  
  useEffect(() => {
    const savedSidebarState = localStorage.getItem('sidebarCollapsed');
    if (savedSidebarState !== null) {
      setSidebarCollapsed(JSON.parse(savedSidebarState));
    }
  }, []);

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

  // UPDATED: Open Trip Modal instead of navigating
  const handleNewTrip = () => {
    setTripModalOpen(true);
  };

  // ADD: Callback for when trip is created successfully
  const handleTripCreated = (tripData) => {
    console.log('Trip created successfully:', tripData);
    setTripModalOpen(false);
    // Optional: Show success notification
    // You can add a snackbar/notification here
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <LogoContainer>
        <LogoWrapper collapsed={sidebarCollapsed ? 1 : 0}>
          {sidebarCollapsed ? (
            // Collapsed state: Show larger logo
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
                    ">P</div>
                  `;
                }}
              />
            </Box>
          ) : (
            // Expanded state: Show larger logo with text
            <>
              <Box sx={{
                width: 64,
                height: 64,
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
                        width: 64px;
                        height: 64px;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        border-radius: 8px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: white;
                        font-weight: bold;
                        font-size: 20px;
                      ">PGSA</div>
                    `;
                  }}
                />
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    color: theme.palette.primary.main,
                    mb: 0.25,
                    fontSize: '1.1rem',
                    lineHeight: 1.2,
                  }}
                >
                  TRAILERS
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: 'text.secondary',
                    fontWeight: 500,
                    fontSize: '0.75rem',
                    display: 'block',
                    lineHeight: 1.2,
                  }}
                >
                  SALLARA NATIONWIDE LOGISTICS
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
                  v1.02
                </Typography>
              </Box>
            </>
          )}
        </LogoWrapper>

        {/* Toggle button */}
        <IconButton
          onClick={toggleSidebar}
          size="small"
          sx={{
            position: 'absolute',
            right: sidebarCollapsed ? -12 : 8,
            top: '50%',
            transform: 'translateY(-50%)',
            backgroundColor: theme.palette.grey[100],
            border: `1px solid ${theme.palette.divider}`,
            '&:hover': {
              backgroundColor: theme.palette.grey[200],
            },
            zIndex: 11,
            boxShadow: 2,
            width: 28,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {sidebarCollapsed ? (
            <ChevronRight sx={{ fontSize: '1.2rem' }} />
          ) : (
            <ChevronLeft sx={{ fontSize: '1.2rem' }} />
          )}
        </IconButton>
      </LogoContainer>

      <MainContentWrapper>
        {menuSections.map((section, index) => (
          <React.Fragment key={section.title}>
            {!sidebarCollapsed ? (
              <>
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
      </MainContentWrapper>

      <UserProfileContainer collapsed={sidebarCollapsed}>
        {!sidebarCollapsed ? (
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
        <Toolbar sx={{ 
          justifyContent: 'space-between',
          flexWrap: 'nowrap',
          overflow: 'hidden',
          minHeight: { xs: 56, sm: 64 },
        }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center',
            flexShrink: 0,
          }}>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { md: 'none' } }}
            >
              <MenuIcon />
            </IconButton>

            <Typography 
              variant="h6" 
              noWrap 
              sx={{ 
                fontWeight: 600,
                fontSize: { xs: '0.9rem', sm: '1rem', md: '1.1rem' },
                whiteSpace: 'nowrap',
              }}
            >
              Fleet Management System
            </Typography>
          </Box>

          <Stack 
            direction="row" 
            spacing={{ xs: 0.5, sm: 1 }} 
            alignItems="center"
            sx={{
              flexShrink: 0,
              '& .MuiIconButton-root': {
                padding: { xs: 0.5, sm: 1 },
              },
            }}
          >
            <IconButton size="small" sx={{ borderRadius: 1 }}>
              <Search sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }} />
            </IconButton>
            <IconButton size="small" sx={{ borderRadius: 1 }}>
              <Badge badgeContent={3} color="error">
                <Notifications sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }} />
              </Badge>
            </IconButton>
            <IconButton size="small" sx={{ borderRadius: 1 }}>
              <Settings sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }} />
            </IconButton>

            <Button
              variant="contained"
              size="small"
              onClick={handleNewTrip}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                px: { xs: 1, sm: 2 },
                py: { xs: 0.5, sm: 1 },
                backgroundColor: theme.palette.success.main,
                '&:hover': {
                  backgroundColor: theme.palette.success.dark,
                },
                fontSize: { xs: '0.7rem', sm: '0.8rem' },
                minWidth: { xs: 'auto', sm: 'auto' },
                '& .MuiButton-startIcon': {
                  marginRight: { xs: 0.5, sm: 1 },
                },
              }}
              startIcon={<AddLocationIcon sx={{ fontSize: { xs: '0.8rem', sm: '1rem' } }} />}
            >
              {isSmallScreen ? 'New' : 'New Trip'}
            </Button>
          </Stack>
        </Toolbar>
      </AppBar>

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

      <Box
        component="nav"
        sx={{
          width: { md: sidebarCollapsed ? collapsedDrawerWidth : drawerWidth },
          flexShrink: { md: 0 },
        }}
        ref={sidebarRef}
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
                display: 'flex',
                flexDirection: 'column',
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
                display: 'flex',
                flexDirection: 'column',
              },
            }}
            open
          >
            {drawer}
          </Drawer>
        )}
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 1, sm: 2, md: 3 },
          width: { md: `calc(100% - ${sidebarCollapsed ? collapsedDrawerWidth : drawerWidth}px)` },
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          backgroundColor: theme.palette.grey[50],
          minHeight: '100vh',
          overflowX: 'hidden',
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }} />

        <Breadcrumbs />

        <Outlet />
      </Box>

      {/* ADD TRIP FORM MODAL - Available from any screen */}
      <TripForm
        open={tripModalOpen}
        onClose={() => setTripModalOpen(false)}
        mode="create"
        onSuccess={handleTripCreated}
        fetchTrips={() => {
          // Optional: Refresh trips if on trips page
          if (location.pathname === '/trips' || location.pathname.startsWith('/trips')) {
            // The TripList component will handle refresh
            // You could use a context or event emitter here
          }
        }}
      />
    </Box>
  );
};

export default MainLayout;
