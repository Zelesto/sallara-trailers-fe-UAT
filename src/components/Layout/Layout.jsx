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

// Import your logo images
import fullLogoImage from '../assets/img/PGSALogo.png';
import collapsedLogoImage from '../assets/img/SALLogo_sml.png'; // Create a smaller version of your logo

import Breadcrumbs from './Breadcrumbs';
import TripForm from '../../pages/TripForm';

const drawerWidth = 240; // Reduced from 280
const collapsedDrawerWidth = 64; // Reduced from 70

// Styled components with shouldForwardProp to prevent boolean DOM attribute warning
const LogoContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'collapsed',
})(({ theme, collapsed }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: collapsed ? theme.spacing(1, 0.5) : theme.spacing(1.5, 2),
  borderBottom: `1px solid ${theme.palette.divider}`,
  minHeight: collapsed ? 64 : 80,
  position: 'relative',
  overflow: 'hidden',
  //backgroundColor: theme.palette.primary.main,
  transition: theme.transitions.create(['min-height', 'padding'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
}));

const LogoWrapper = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'collapsed',
})(({ theme, collapsed }) => ({
  display: 'flex',
  flexDirection: collapsed ? 'row' : 'row',
  alignItems: 'center',
  gap: collapsed ? 0 : theme.spacing(1.5),
  transition: 'all 0.3s ease',
  width: '100%',
  justifyContent: collapsed ? 'center' : 'flex-start',
}));

const LogoImage = styled('img', {
  shouldForwardProp: (prop) => prop !== 'collapsed',
})(({ theme, collapsed }) => ({
  width: collapsed ? 36 : 48,
  height: collapsed ? 36 : 48,
  objectFit: 'contain',
  transition: theme.transitions.create(['width', 'height'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  flexShrink: 0,
}));

const BrandText = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'collapsed',
})(({ theme, collapsed }) => ({
  opacity: collapsed ? 0 : 1,
  transition: theme.transitions.create('opacity', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textAlign: 'left',
  flex: 1,
  minWidth: 0,
}));

const ToggleButton = styled(IconButton)(({ theme }) => ({
  position: 'absolute',
  right: -12,
  top: '50%',
  transform: 'translateY(-50%)',
  backgroundColor: theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
  '&:hover': {
    backgroundColor: theme.palette.grey[100],
  },
  zIndex: 11,
  boxShadow: theme.shadows[2],
  width: 24,
  height: 24,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
}));

const SidebarItem = styled(ListItemButton)(({ theme, selected }) => ({
  borderRadius: theme.spacing(0.75),
  margin: theme.spacing(0.25, 0.75),
  paddingLeft: theme.spacing(2),
  paddingTop: theme.spacing(0.5),
  paddingBottom: theme.spacing(0.5),
  '&.Mui-selected': {
    backgroundColor: theme.palette.primary.light + '20',
    color: theme.palette.primary.main,
    '&:hover': {
      backgroundColor: theme.palette.primary.light + '30',
    },
  },
}));

const SectionHeader = styled(ListItemButton)(({ theme }) => ({
  borderRadius: theme.spacing(0.75),
  margin: theme.spacing(0.25, 0.75),
  marginTop: theme.spacing(1.5),
  backgroundColor: 'transparent',
  paddingTop: theme.spacing(0.5),
  paddingBottom: theme.spacing(0.5),
  '&:hover': {
    backgroundColor: theme.palette.grey[100],
  },
}));

const MainContentWrapper = styled(Box)(({ theme }) => ({
  flex: 1,
  overflowY: 'auto',
  paddingBottom: '70px',
}));

const UserProfileContainer = styled(Box)(({ theme, collapsed }) => ({
  borderTop: `1px solid ${theme.palette.divider}`,
  padding: collapsed ? theme.spacing(1, 0.75) : theme.spacing(1.5),
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
      {
        title: 'Inventory',
        icon: <InventoryIcon />,
        items: [
          { text: 'Inventory Items', icon: <InventoryIcon />, path: '/inventory' },
          { text: 'Stock Movements', icon: <FuelIcon />, path: '/inventory/movements' },
          { text: 'New Movement', icon: <AddLocationIcon />, path: '/inventory/movements/new' },
        ],
      },
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

  const handleNewTrip = () => {
    setTripModalOpen(true);
  };

  const handleTripCreated = (tripData) => {
    console.log('Trip created successfully:', tripData);
    setTripModalOpen(false);
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <LogoContainer collapsed={sidebarCollapsed ? 1 : 0}>
        <LogoWrapper collapsed={sidebarCollapsed ? 1 : 0}>
          <LogoImage
            src={sidebarCollapsed ? collapsedLogoImage : fullLogoImage}
            alt="PGSA Logo"
            collapsed={sidebarCollapsed ? 1 : 0}
            onError={(e) => {
              // Fallback if image fails to load
              e.target.style.display = 'none';
              e.target.parentElement.innerHTML = `
                <div style="
                  width: ${sidebarCollapsed ? '36px' : '48px'};
                  height: ${sidebarCollapsed ? '36px' : '48px'};
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  border-radius: ${sidebarCollapsed ? '8px' : '8px'};
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  color: white;
                  font-weight: bold;
                  font-size: ${sidebarCollapsed ? '14px' : '18px'};
                  flex-shrink: 0;
                ">${sidebarCollapsed ? 'P' : 'PGSA'}</div>
              `;
            }}
          />
          
          <BrandText collapsed={sidebarCollapsed ? 1 : 0}>
  <Typography
    variant="h6"
    sx={{
      fontWeight: 700,
      color: 'text.primary',
      lineHeight: 1.1,
      mb: 0.25,
    }}
  >
    Trailers
  </Typography>

  <Typography
    variant="caption"
    sx={{
      color: 'text.secondary',
      display: 'block',
      fontSize: '0.7rem',
    }}
  >
    v1.01
  </Typography>
</BrandText>
        </LogoWrapper>

        <ToggleButton onClick={toggleSidebar} size="small">
          {sidebarCollapsed ? (
            <ChevronRight sx={{ fontSize: '1rem' }} />
          ) : (
            <ChevronLeft sx={{ fontSize: '1rem' }} />
          )}
        </ToggleButton>
      </LogoContainer>

      <MainContentWrapper>
        {menuSections.map((section, index) => (
          <React.Fragment key={section.title}>
            {!sidebarCollapsed ? (
              <>
                <SectionHeader onClick={() => toggleSection(index)}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    {section.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={section.title}
                    primaryTypographyProps={{
                      fontSize: '0.8rem',
                      fontWeight: 600,
                    }}
                  />
                  {expandedSections[index] ? <ExpandLess sx={{ fontSize: '1rem' }} /> : <ExpandMore sx={{ fontSize: '1rem' }} />}
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
                              py: theme.spacing(0.5),
                              backgroundColor: hasSubItems && location.pathname.startsWith(item.path + '/')
                                ? theme.palette.primary.light + '20'
                                : 'inherit',
                            }}
                          >
                            <ListItemIcon sx={{ minWidth: 36 }}>
                              {item.icon}
                            </ListItemIcon>
                            <ListItemText
                              primary={item.text}
                              primaryTypographyProps={{
                                fontSize: '0.8rem',
                                fontWeight: 500,
                              }}
                            />
                            {hasSubItems && (
                              isMenuItemExpanded
                                ? <ExpandLess sx={{ fontSize: '0.9rem' }} />
                                : <ExpandMore sx={{ fontSize: '0.9rem' }} />
                            )}
                          </SidebarItem>

                          {hasSubItems && isMenuItemExpanded && (
                            <List disablePadding sx={{ pl: 3.5 }}>
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
                                      py: theme.spacing(0.25),
                                      pl: theme.spacing(3.5),
                                    }}
                                  >
                                    <ListItemIcon sx={{ minWidth: 32 }}>
                                      {subItem.icon}
                                    </ListItemIcon>
                                    <ListItemText
                                      primary={subItem.text}
                                      primaryTypographyProps={{
                                        fontSize: '0.75rem',
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
                  py: 0.25,
                  textAlign: 'center',
                  mx: 0.5,
                  mb: 0.25,
                  mt: 0.5,
                }}>
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'text.secondary',
                      fontWeight: 600,
                      fontSize: '0.5rem',
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
                            py: 0.75,
                            borderRadius: 1,
                            margin: 0.25,
                            minHeight: 36,
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
                                height: 16,
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
              <Divider sx={{ my: 1.5, mx: 2 }} />
            )}
          </React.Fragment>
        ))}
      </MainContentWrapper>

      <UserProfileContainer collapsed={sidebarCollapsed}>
        {!sidebarCollapsed ? (
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar
              sx={{
                width: 34,
                height: 34,
                bgcolor: 'primary.main',
                cursor: 'pointer',
                fontSize: '0.9rem',
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
                sx={{ fontSize: '0.8rem' }}
              >
                {user?.username}
              </Typography>

              <Typography
                variant="caption"
                color="text.secondary"
                noWrap
                sx={{ fontSize: '0.65rem' }}
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
                py: 1,
                px: 0,
              }}
            >
              <Avatar
                sx={{
                  width: 28,
                  height: 28,
                  bgcolor: 'primary.main',
                  fontSize: '0.75rem',
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
          minHeight: { xs: 48, sm: 52 },
          px: { xs: 1, sm: 1.5 },
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
              sx={{ mr: 1, display: { md: 'none' } }}
            >
              <MenuIcon sx={{ fontSize: '1.2rem' }} />
            </IconButton>

            <Typography 
              variant="h6" 
              noWrap 
              sx={{ 
                fontWeight: 600,
                fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' },
                whiteSpace: 'nowrap',
              }}
            >
              Fleet Management
            </Typography>
          </Box>

          <Stack 
            direction="row" 
            spacing={{ xs: 0.5, sm: 0.75 }}
            alignItems="center"
            sx={{
              flexShrink: 0,
              '& .MuiIconButton-root': {
                padding: { xs: 0.5, sm: 0.75 },
              },
            }}
          >
            <IconButton size="small" sx={{ borderRadius: 1 }}>
              <Search sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }} />
            </IconButton>
            <IconButton size="small" sx={{ borderRadius: 1 }}>
              <Badge badgeContent={3} color="error">
                <Notifications sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }} />
              </Badge>
            </IconButton>
            <IconButton size="small" sx={{ borderRadius: 1 }}>
              <Settings sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }} />
            </IconButton>

            <Button
              variant="contained"
              size="small"
              onClick={handleNewTrip}
              sx={{
                borderRadius: 1.5,
                textTransform: 'none',
                fontWeight: 600,
                px: { xs: 1, sm: 1.5 },
                py: { xs: 0.4, sm: 0.5 },
                backgroundColor: theme.palette.success.main,
                '&:hover': {
                  backgroundColor: theme.palette.success.dark,
                },
                fontSize: { xs: '0.65rem', sm: '0.75rem' },
                minWidth: 'auto',
                '& .MuiButton-startIcon': {
                  marginRight: { xs: 0.25, sm: 0.5 },
                },
              }}
              startIcon={<AddLocationIcon sx={{ fontSize: { xs: '0.7rem', sm: '0.85rem' } }} />}
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
          p: { xs: 1, sm: 1.5, md: 2 },
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
        <Toolbar sx={{ minHeight: { xs: 48, sm: 52 } }} />

        <Breadcrumbs />

        <Outlet />
      </Box>

      <TripForm
        open={tripModalOpen}
        onClose={() => setTripModalOpen(false)}
        mode="create"
        onSuccess={handleTripCreated}
        fetchTrips={() => {
          if (location.pathname === '/trips' || location.pathname.startsWith('/trips')) {
            // The TripList component will handle refresh
          }
        }}
      />
    </Box>
  );
};

export default MainLayout;
