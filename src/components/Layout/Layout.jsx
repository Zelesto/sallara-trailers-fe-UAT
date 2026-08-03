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
  Chip,
  Paper,
  Popper,
  ClickAwayListener,
  MenuList,
} from '@mui/material';
import { styled } from '@mui/material/styles';

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
  Pending as PendingIcon,
  PersonAdd as PersonAddIcon,
  LocalShipping as LocalShippingIcon,
  Merge as MergeIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { inventoryMovementService } from '../../services/inventoryMovementService';
import FleetManagementIcon from './FleetManagementIcon';

// Import your logo images
import fullLogoImage from '../assets/img/PGSALogo.png';
import collapsedLogoImage from '../assets/img/SALLogo_sml.png';

import Breadcrumbs from './Breadcrumbs';
import TripForm from '../../pages/TripForm';

const drawerWidth = 240;
const collapsedDrawerWidth = 64;

// Styled components with modern design
const LogoContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'collapsed',
})(({ theme, collapsed }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: collapsed ? theme.spacing(1, 0.5) : theme.spacing(2, 2),
  borderBottom: '1px solid #ECECEC',
  minHeight: collapsed ? 64 : 80,
  position: 'relative',
  overflow: 'hidden',
  transition: theme.transitions.create(['min-height', 'padding'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  backgroundColor: '#FFFFFF',
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
  backgroundColor: '#FFFFFF',
  border: '1px solid #ECECEC',
  '&:hover': {
    backgroundColor: '#F7F7FC',
  },
  zIndex: 11,
  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  width: 24,
  height: 24,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
  color: '#6B7280',
}));

const SidebarItem = styled(ListItemButton)(({ theme, selected }) => ({
  borderRadius: '10px',
  margin: theme.spacing(0.25, 0.75),
  paddingLeft: theme.spacing(2),
  paddingTop: theme.spacing(0.5),
  paddingBottom: theme.spacing(0.5),
  '&.Mui-selected': {
    backgroundColor: '#EEF2FF',
    color: '#4F46E5',
    '&:hover': {
      backgroundColor: '#EEF2FF',
    },
    '& .MuiListItemIcon-root': {
      color: '#4F46E5',
    },
  },
  '&:hover': {
    backgroundColor: '#F7F7FC',
  },
}));

const SectionHeader = styled(ListItemButton)(({ theme }) => ({
  borderRadius: '10px',
  margin: theme.spacing(0.25, 0.75),
  marginTop: theme.spacing(1.5),
  backgroundColor: 'transparent',
  paddingTop: theme.spacing(0.5),
  paddingBottom: theme.spacing(0.5),
  '&:hover': {
    backgroundColor: '#F7F7FC',
  },
  '& .MuiTypography-root': {
    color: '#6B7280',
    fontWeight: 600,
  },
}));

const MainContentWrapper = styled(Box)(({ theme }) => ({
  flex: 1,
  overflowY: 'auto',
  paddingBottom: '70px',
  '&::-webkit-scrollbar': {
    width: '4px',
  },
  '&::-webkit-scrollbar-track': {
    background: '#F7F7FC',
  },
  '&::-webkit-scrollbar-thumb': {
    background: '#E5E7EB',
    borderRadius: '4px',
  },
}));

const UserProfileContainer = styled(Box)(({ theme, collapsed }) => ({
  borderTop: '1px solid #ECECEC',
  padding: collapsed ? theme.spacing(1, 0.75) : theme.spacing(1.5, 2),
  position: 'fixed',
  bottom: 0,
  left: 0,
  right: 0,
  width: collapsed ? collapsedDrawerWidth : drawerWidth,
  backgroundColor: '#FFFFFF',
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
    icon: <CarIcon sx={{ color: '#6B7280' }} />,
    items: [
      { text: 'Dashboard', icon: <DashboardIcon sx={{ color: '#6B7280' }} />, path: '/dashboard' },
      {
        text: 'Trips',
        icon: <RouteIcon sx={{ color: '#6B7280' }} />,
        path: '/trips',
        subItems: [
          { text: 'All Trips', path: '/trips', icon: <RouteIcon sx={{ color: '#6B7280' }} /> },
          { text: 'Active Trips', path: '/trips?status=ACTIVE', icon: <Timeline sx={{ color: '#6B7280' }} /> },
        ],
      },
      {
        text: 'Load Management',
        icon: <LocalShippingIcon sx={{ color: '#6B7280' }} />,
        path: '/loads',
        subItems: [
          { text: 'All Loads', path: '/loads', icon: <LocalShippingIcon sx={{ color: '#6B7280' }} /> },
          { text: 'New Load', path: '/loads/new', icon: <AddLocationIcon sx={{ color: '#6B7280' }} /> },
          { text: 'Smart Merge', path: '/loads/merge', icon: <MergeIcon sx={{ color: '#6B7280' }} /> },
        ],
      },
      {
        text: 'POD Management',
        icon: <PodIcon sx={{ color: '#6B7280' }} />,
        path: '/pods',
        subItems: [
          { text: 'All PODs', path: '/pods', icon: <PodIcon sx={{ color: '#6B7280' }} /> },
          { text: 'Create POD', path: '/pods/new', icon: <AddLocationIcon sx={{ color: '#6B7280' }} /> },
        ],
      },
      {
        text: 'Fuel Management',
        icon: <FuelIcon sx={{ color: '#6B7280' }} />,
        path: '/fuel/slips',
        subItems: [
          { text: 'All Fuel Slips', path: '/fuel/slips', icon: <FuelIcon sx={{ color: '#6B7280' }} /> },
          { text: 'Add Fuel Slip', path: '/fuel/slips/add', icon: <AddLocationIcon sx={{ color: '#6B7280' }} /> },
        ],
      },
    ],
  },
  {
    title: 'Inventory',
    icon: <InventoryIcon sx={{ color: '#6B7280' }} />,
    items: [
      { text: 'Inventory Items', icon: <InventoryIcon sx={{ color: '#6B7280' }} />, path: '/inventory' },
      { text: 'Pending Approvals', icon: <PendingIcon sx={{ color: '#6B7280' }} />, path: '/inventory/movements?status=PENDING' },
    ],
  },
  {
    title: 'Assets',
    icon: <DirectionsCar sx={{ color: '#6B7280' }} />,
    items: [
      { 
        text: 'Vehicles', 
        icon: <CarIcon sx={{ color: '#6B7280' }} />, 
        path: '/vehicles',
        subItems: [
          { text: 'All Vehicles', path: '/vehicles', icon: <CarIcon sx={{ color: '#6B7280' }} /> },
          { text: 'Vehicle Management', path: '/vehicleManagement', icon: <CarIcon sx={{ color: '#6B7280' }} /> },
        ],
      },
      { 
        text: 'Drivers', 
        icon: <Person sx={{ color: '#6B7280' }} />, 
        path: '/drivers',
        subItems: [
          { text: 'All Drivers', path: '/drivers', icon: <Person sx={{ color: '#6B7280' }} /> },
          { text: 'Driver Management', path: '/driverManagement', icon: <FleetManagementIcon sx={{ color: '#6B7280' }} /> },
        ],
      },
    ],
  },
  {
    title: 'Customers',
    icon: <People sx={{ color: '#6B7280' }} />,
    items: [
      { text: 'All Customers', icon: <People sx={{ color: '#6B7280' }} />, path: '/customers' },
      { text: 'Add Customer', icon: <PersonAddIcon sx={{ color: '#6B7280' }} />, path: '/customers/new' },
    ],
  },
  {
    title: 'Finance',
    icon: <MoneyIcon sx={{ color: '#6B7280' }} />,
    items: [
      { text: 'Finance Dashboard', icon: <DashboardIcon sx={{ color: '#6B7280' }} />, path: '/finance' },
      { text: 'Expenses', icon: <ReceiptLongIcon sx={{ color: '#6B7280' }} />, path: '/finance/expenses' },
      { text: 'Accounts', icon: <AccountBalanceIcon sx={{ color: '#6B7280' }} />, path: '/finance/accounts' },
      { text: 'Invoices', icon: <DescriptionIcon sx={{ color: '#6B7280' }} />, path: '/finance/invoices' },
      { text: 'Receivables', icon: <ReceiptLongIcon sx={{ color: '#6B7280' }} />, path: '/finance/receivables' },
      { text: 'Payables', icon: <DescriptionIcon sx={{ color: '#6B7280' }} />, path: '/finance/payables' },
    ],
  },
  {
    title: 'Reports & Analytics',
    icon: <AnalyticsIcon sx={{ color: '#6B7280' }} />,
    items: [
      { text: 'Trip Analytics', icon: <AnalyticsIcon sx={{ color: '#6B7280' }} />, path: '/analytics/trips' },
      { text: 'Trip Reports', icon: <ReportsIcon sx={{ color: '#6B7280' }} />, path: '/reports/trips' },
    ],
  },
  {
    title: 'Administration',
    icon: <AdminPanelSettings sx={{ color: '#6B7280' }} />,
    items: [
      { text: 'Users Management', icon: <People sx={{ color: '#6B7280' }} />, path: '/users' },
      { text: 'System Settings', icon: <Settings sx={{ color: '#6B7280' }} />, path: '/settings' },
      { text: 'Logs & Audits', icon: <Timeline sx={{ color: '#6B7280' }} />, path: '/logs' },
    ],
  },
];

const MainLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [expandedSections, setExpandedSections] = useState({});
  const [expandedMenuItems, setExpandedMenuItems] = useState({});
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationAnchorEl, setNotificationAnchorEl] = useState(null);
  const [pendingApprovals, setPendingApprovals] = useState(0);
  const [pendingApprovalItems, setPendingApprovalItems] = useState([]);
  
  const [tripModalOpen, setTripModalOpen] = useState(false);
  
  const { user, logout } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const location = useLocation();
  const sidebarRef = useRef(null);
  
  // Fetch pending approvals
  const fetchPendingApprovals = async () => {
    try {
      const data = await inventoryMovementService.getPendingApprovals();
      const pendingList = Array.isArray(data) ? data : (data?.content || []);
      setPendingApprovalItems(pendingList);
      setPendingApprovals(pendingList.length);
    } catch (error) {
      console.error('Error fetching pending approvals:', error);
      setPendingApprovals(0);
      setPendingApprovalItems([]);
    }
  };

  useEffect(() => {
    const savedSidebarState = localStorage.getItem('sidebarCollapsed');
    if (savedSidebarState !== null) {
      setSidebarCollapsed(JSON.parse(savedSidebarState));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(sidebarCollapsed));
  }, [sidebarCollapsed]);

  // Fetch pending approvals on mount and periodically
  useEffect(() => {
    if (user) {
      fetchPendingApprovals();
      const interval = setInterval(fetchPendingApprovals, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Auto-expand sections based on current path
  useEffect(() => {
    const path = location.pathname;
    const newExpandedSections = {};
    
    menuSections.forEach((section, index) => {
      const hasMatchingItem = section.items.some(item => {
        if (item.subItems) {
          return item.subItems.some(sub => path.startsWith(sub.path.split('?')[0]));
        }
        return path.startsWith(item.path.split('?')[0]);
      });
      if (hasMatchingItem) {
        newExpandedSections[index] = true;
      }
    });
    
    setExpandedSections(prev => ({
      ...prev,
      ...newExpandedSections,
    }));
  }, [location.pathname]);

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

  const handleNotificationOpen = (event) => {
    setNotificationAnchorEl(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setNotificationAnchorEl(null);
  };

  const handleNavigation = (path) => {
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
    handleNotificationClose();
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
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#FFFFFF' }}>
      <LogoContainer collapsed={sidebarCollapsed ? 1 : 0}>
        <LogoWrapper collapsed={sidebarCollapsed ? 1 : 0}>
          <LogoImage
            src={sidebarCollapsed ? collapsedLogoImage : fullLogoImage}
            alt="PGSA Logo"
            collapsed={sidebarCollapsed ? 1 : 0}
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.parentElement.innerHTML = `
                <div style="
                  width: ${sidebarCollapsed ? '36px' : '48px'};
                  height: ${sidebarCollapsed ? '36px' : '48px'};
                  background: linear-gradient(135deg, #4F46E5 0%, #6366F1 100%);
                  border-radius: ${sidebarCollapsed ? '8px' : '12px'};
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
                color: '#111827',
                lineHeight: 1.1,
                mb: 0.25,
                fontSize: '1.1rem',
              }}
            >
              Trailers
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: '#6B7280',
                display: 'block',
                fontSize: '0.6rem',
                fontWeight: 500,
              }}
            >
              v1.2.1 - 15 AUG 2026
            </Typography>
          </BrandText>
        </LogoWrapper>

        <ToggleButton onClick={toggleSidebar} size="small">
          {sidebarCollapsed ? (
            <ChevronRight sx={{ fontSize: '0.8rem' }} />
          ) : (
            <ChevronLeft sx={{ fontSize: '0.8rem' }} />
          )}
        </ToggleButton>
      </LogoContainer>

      <MainContentWrapper>
        {menuSections.map((section, index) => (
          <React.Fragment key={section.title}>
            {!sidebarCollapsed ? (
              <>
                <SectionHeader onClick={() => toggleSection(index)}>
                  <ListItemIcon sx={{ minWidth: 36, color: '#6B7280' }}>
                    {section.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={section.title}
                    primaryTypographyProps={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: '#6B7280',
                      letterSpacing: '0.3px',
                      textTransform: 'uppercase',
                    }}
                  />
                  {expandedSections[index] ? (
                    <ExpandLess sx={{ fontSize: '1rem', color: '#6B7280' }} />
                  ) : (
                    <ExpandMore sx={{ fontSize: '1rem', color: '#6B7280' }} />
                  )}
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

                      const showBadge = item.text === 'Pending Approvals' && pendingApprovals > 0;

                      return (
                        <React.Fragment key={item.text}>
                          <SidebarItem
                            onClick={() => hasSubItems ? toggleMenuItem(item.text) : handleNavigation(item.path)}
                            selected={isSelected}
                            sx={{
                              py: theme.spacing(0.5),
                              backgroundColor: hasSubItems && location.pathname.startsWith(item.path + '/')
                                ? '#EEF2FF'
                                : 'inherit',
                            }}
                          >
                            <ListItemIcon sx={{ minWidth: 36, color: isSelected ? '#4F46E5' : '#6B7280' }}>
                              {item.icon}
                            </ListItemIcon>
                            <ListItemText
                              primary={item.text}
                              primaryTypographyProps={{
                                fontSize: '0.8rem',
                                fontWeight: isSelected ? 600 : 500,
                                color: isSelected ? '#4F46E5' : '#111827',
                              }}
                            />
                            {showBadge && (
                              <Badge
                                badgeContent={pendingApprovals}
                                color="warning"
                                sx={{ mr: 1 }}
                              />
                            )}
                            {hasSubItems && (
                              isMenuItemExpanded
                                ? <ExpandLess sx={{ fontSize: '0.9rem', color: '#6B7280' }} />
                                : <ExpandMore sx={{ fontSize: '0.9rem', color: '#6B7280' }} />
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
                                    <ListItemIcon sx={{ minWidth: 32, color: isSubSelected ? '#4F46E5' : '#6B7280' }}>
                                      {subItem.icon}
                                    </ListItemIcon>
                                    <ListItemText
                                      primary={subItem.text}
                                      primaryTypographyProps={{
                                        fontSize: '0.75rem',
                                        fontWeight: isSubSelected ? 600 : 500,
                                        color: isSubSelected ? '#4F46E5' : '#111827',
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
                      color: '#6B7280',
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
                    const showBadge = item.text === 'Pending Approvals' && pendingApprovals > 0;
                    
                    return (
                      <Tooltip key={item.text} title={item.text} placement="right" arrow>
                        <ListItemButton
                          onClick={() => handleNavigation(item.path)}
                          selected={isSelected}
                          sx={{
                            justifyContent: 'center',
                            py: 0.75,
                            borderRadius: '10px',
                            margin: 0.25,
                            minHeight: 36,
                            '&.Mui-selected': {
                              backgroundColor: '#EEF2FF',
                              position: 'relative',
                              '&::after': {
                                content: '""',
                                position: 'absolute',
                                left: 0,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                width: 3,
                                height: 16,
                                backgroundColor: '#4F46E5',
                                borderRadius: '0 3px 3px 0',
                              },
                            },
                          }}
                        >
                          <ListItemIcon sx={{
                            minWidth: 'auto',
                            justifyContent: 'center',
                            color: isSelected ? '#4F46E5' : '#6B7280'
                          }}>
                            {item.icon}
                          </ListItemIcon>
                          {showBadge && (
                            <Badge
                              badgeContent={pendingApprovals}
                              color="warning"
                              sx={{
                                position: 'absolute',
                                top: 2,
                                right: 2,
                                '& .MuiBadge-badge': {
                                  fontSize: '0.5rem',
                                  minWidth: 16,
                                  height: 16,
                                  padding: '0 4px',
                                }
                              }}
                            />
                          )}
                        </ListItemButton>
                      </Tooltip>
                    );
                  })}
                </List>
              </Box>
            )}
            {!sidebarCollapsed && index < menuSections.length - 1 && (
              <Divider sx={{ my: 1.5, mx: 2, borderColor: '#ECECEC' }} />
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
                bgcolor: '#4F46E5',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: 600,
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
                sx={{ fontSize: '0.8rem', color: '#111827' }}
              >
                {user?.username}
              </Typography>

              <Typography
                variant="caption"
                color="text.secondary"
                noWrap
                sx={{ fontSize: '0.6rem', color: '#6B7280' }}
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
                borderRadius: '10px',
                py: 1,
                px: 0,
              }}
            >
              <Avatar
                sx={{
                  width: 28,
                  height: 28,
                  bgcolor: '#4F46E5',
                  fontSize: '0.75rem',
                  fontWeight: 600,
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
    <Box sx={{ display: 'flex', backgroundColor: '#F7F7FC' }}>
      <CssBaseline />

      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${sidebarCollapsed ? collapsedDrawerWidth : drawerWidth}px)` },
          ml: { md: sidebarCollapsed ? collapsedDrawerWidth : drawerWidth },
          backgroundColor: '#FFFFFF',
          color: '#111827',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          borderBottom: '1px solid #ECECEC',
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
          px: { xs: 1.5, sm: 2 },
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
              sx={{ mr: 1, display: { md: 'none' }, color: '#6B7280' }}
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
                color: '#111827',
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
                color: '#6B7280',
                '&:hover': {
                  backgroundColor: '#F7F7FC',
                },
              },
            }}
          >
            <IconButton size="small" sx={{ borderRadius: '8px' }}>
              <Search sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }} />
            </IconButton>
            
            <IconButton 
              size="small" 
              sx={{ borderRadius: '8px' }}
              onClick={handleNotificationOpen}
            >
              <Badge 
                badgeContent={pendingApprovals} 
                color="warning"
                invisible={pendingApprovals === 0}
              >
                <Notifications sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }} />
              </Badge>
            </IconButton>

            <Popper
              open={Boolean(notificationAnchorEl)}
              anchorEl={notificationAnchorEl}
              placement="bottom-end"
              style={{ zIndex: 1300 }}
            >
              <ClickAwayListener onClickAway={handleNotificationClose}>
                <Paper sx={{ 
                  width: 320, 
                  maxHeight: 400, 
                  overflow: 'auto',
                  mt: 1,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  borderRadius: '12px',
                  border: '1px solid #ECECEC',
                }}>
                  <Box sx={{ p: 1.5, borderBottom: '1px solid #ECECEC' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.8rem', color: '#111827' }}>
                      Pending Approvals ({pendingApprovals})
                    </Typography>
                  </Box>
                  <MenuList>
                    {pendingApprovalItems.length === 0 ? (
                      <MenuItem disabled sx={{ py: 2 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                          No pending approvals
                        </Typography>
                      </MenuItem>
                    ) : (
                      pendingApprovalItems.slice(0, 5).map((item) => (
                        <MenuItem 
                          key={item.id}
                          onClick={() => handleNavigation('/inventory/movements')}
                          sx={{ 
                            py: 1.5,
                            borderBottom: '1px solid #ECECEC',
                            '&:last-child': { borderBottom: 'none' }
                          }}
                        >
                          <Box sx={{ width: '100%' }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                              <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 500, color: '#111827' }}>
                                {item.itemName || `Item #${item.itemId}`}
                              </Typography>
                              <Chip
                                label={item.movementType}
                                size="small"
                                color={item.movementType === 'IN' ? 'success' : item.movementType === 'OUT' ? 'error' : 'warning'}
                                sx={{ height: 18, fontSize: '0.55rem' }}
                              />
                            </Stack>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                              {item.quantity} units • {item.reason || 'No reason provided'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem', display: 'block' }}>
                              {item.createdAt ? new Date(item.createdAt).toLocaleString() : 'N/A'}
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))
                    )}
                    {pendingApprovalItems.length > 5 && (
                      <MenuItem onClick={() => handleNavigation('/inventory/movements')}>
                        <Typography variant="body2" color="primary" sx={{ fontSize: '0.75rem' }}>
                          View all {pendingApprovalItems.length} pending approvals
                        </Typography>
                      </MenuItem>
                    )}
                  </MenuList>
                </Paper>
              </ClickAwayListener>
            </Popper>

            <IconButton size="small" sx={{ borderRadius: '8px' }}>
              <Settings sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }} />
            </IconButton>

            <Button
              variant="contained"
              size="small"
              onClick={handleNewTrip}
              sx={{
                borderRadius: '10px',
                textTransform: 'none',
                fontWeight: 600,
                px: { xs: 1, sm: 1.5 },
                py: { xs: 0.4, sm: 0.5 },
                backgroundColor: '#22C55E',
                '&:hover': {
                  backgroundColor: '#16A34A',
                  boxShadow: '0 4px 12px rgba(34,197,94,0.3)',
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
          elevation: 0,
          sx: {
            mt: 1.5,
            minWidth: 200,
            borderRadius: '12px',
            border: '1px solid #ECECEC',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          }
        }}
      >
        <MenuItem onClick={() => {
          handleUserMenuClose();
          navigate('/me');
        }}>
          <ListItemIcon>
            <Person fontSize="small" sx={{ color: '#6B7280' }} />
          </ListItemIcon>
          <ListItemText sx={{ color: '#111827' }}>My Profile</ListItemText>
        </MenuItem>

        <MenuItem onClick={() => {
          handleUserMenuClose();
          navigate('/settings');
        }}>
          <ListItemIcon>
            <Settings fontSize="small" sx={{ color: '#6B7280' }} />
          </ListItemIcon>
          <ListItemText sx={{ color: '#111827' }}>Settings</ListItemText>
        </MenuItem>

        <Divider sx={{ borderColor: '#ECECEC' }} />

        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" sx={{ color: '#EF4444' }} />
          </ListItemIcon>
          <ListItemText sx={{ color: '#EF4444' }}>Logout</ListItemText>
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
                border: 'none',
                boxShadow: '2px 0 8px rgba(0,0,0,0.05)',
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
                borderRight: '1px solid #ECECEC',
                transition: theme.transitions.create('width', {
                  easing: theme.transitions.easing.sharp,
                  duration: theme.transitions.duration.enteringScreen,
                }),
                overflowX: 'hidden',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: '#FFFFFF',
                boxShadow: '2px 0 8px rgba(0,0,0,0.02)',
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
          backgroundColor: '#F7F7FC',
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
