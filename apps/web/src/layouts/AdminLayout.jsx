import React, { useEffect, useState } from 'react';
import { Outlet, Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Chip,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  DashboardOutlined,
  ColorLensOutlined,
  ImageOutlined,
  ReceiptOutlined,
  SettingsOutlined,
  PeopleOutlined,
  LogoutOutlined,
  PublicOutlined,
  MenuOutlined,
  MailOutlined,
  CategoryOutlined,
  FolderSpecialOutlined,
} from '@mui/icons-material';
import { useAuthStore, useToastStore } from '../store/store.js';

const drawerWidth = 260;

export default function AdminLayout() {
  const { user, logout } = useAuthStore();
  const { open, message, severity, closeToast } = useToastStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Redirect to login if user session is absent
  useEffect(() => {
    if (!user) {
      navigate('/admin/login');
    }
  }, [user, navigate]);

  // Close mobile drawer on route transition
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  if (!user) {
    return null; // Return empty frame during redirection
  }

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardOutlined />, path: '/admin', roles: ['SUPER_ADMIN', 'ADMIN', 'EDITOR'] },
    { text: 'Paintings', icon: <ColorLensOutlined />, path: '/admin/paintings', roles: ['SUPER_ADMIN', 'ADMIN', 'EDITOR'] },
    { text: 'Messages', icon: <MailOutlined />, path: '/admin/messages', roles: ['SUPER_ADMIN', 'ADMIN', 'EDITOR'] },
    { text: 'Media Library', icon: <ImageOutlined />, path: '/admin/media', roles: ['SUPER_ADMIN', 'ADMIN'] },
    { text: 'Orders', icon: <ReceiptOutlined />, path: '/admin/orders', roles: ['SUPER_ADMIN', 'ADMIN'] },
    { text: 'Categories', icon: <CategoryOutlined />, path: '/admin/categories', roles: ['SUPER_ADMIN', 'ADMIN'] },
    { text: 'Collections', icon: <FolderSpecialOutlined />, path: '/admin/collections', roles: ['SUPER_ADMIN', 'ADMIN'] },
    { text: 'Site Settings', icon: <SettingsOutlined />, path: '/admin/settings', roles: ['SUPER_ADMIN', 'ADMIN'] },
    { text: 'Users List', icon: <PeopleOutlined />, path: '/admin/users', roles: ['SUPER_ADMIN'] },
  ];

  // Drawer inner container markup
  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ height: 70, display: 'flex', alignItems: 'center', px: 3 }}>
        <Typography
          variant="h6"
          sx={{
            fontFamily: '"Playfair Display", serif',
            fontWeight: 600,
            letterSpacing: '0.05em',
            color: '#A67C52',
          }}
        >
          ART STUDIO
        </Typography>
      </Box>
      <Divider sx={{ borderColor: '#404040' }} />
      
      {/* Navigation Options */}
      <List sx={{ px: 2, py: 3, flexGrow: 1 }}>
        {menuItems
          .filter((item) => item.roles.includes(user.role))
          .map((item) => {
            const active = location.pathname === item.path;
            return (
              <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
                <ListItemButton
                  component={RouterLink}
                  to={item.path}
                  sx={{
                    borderRadius: 1,
                    backgroundColor: active ? '#A67C52' : 'transparent',
                    color: active ? '#FFFFFF' : '#C8C4BE',
                    '&:hover': {
                      backgroundColor: active ? '#A67C52' : '#3E3E3E',
                      color: '#FFFFFF',
                    },
                  }}
                >
                  <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{ style: { fontSize: '0.9rem', fontWeight: active ? 600 : 400 } }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
      </List>

      <Divider sx={{ borderColor: '#404040' }} />
      
      {/* Action Options at Bottom */}
      <List sx={{ px: 2, py: 2 }}>
        <ListItem disablePadding sx={{ mb: 1 }}>
          <ListItemButton
            component={RouterLink}
            to="/"
            sx={{
              borderRadius: 1,
              color: '#C8C4BE',
              '&:hover': { backgroundColor: '#3E3E3E', color: '#FFFFFF' },
            }}
          >
            <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>
              <PublicOutlined />
            </ListItemIcon>
            <ListItemText primary="View Public Site" primaryTypographyProps={{ style: { fontSize: '0.9rem' } }} />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton
            onClick={handleLogout}
            sx={{
              borderRadius: 1,
              color: '#FF6B6B',
              '&:hover': { backgroundColor: 'rgba(255, 107, 107, 0.1)', color: '#FF8787' },
            }}
          >
            <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>
              <LogoutOutlined />
            </ListItemIcon>
            <ListItemText primary="Log Out" primaryTypographyProps={{ style: { fontSize: '0.9rem' } }} />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F6F5F2' }}>
      {/* Top Header Bar */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid #EBE6DF',
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, sm: 4 }, height: 70 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { md: 'none' }, color: 'text.primary' }}
            >
              <MenuOutlined />
            </IconButton>
            <Typography variant="h6" color="text.primary" fontWeight="600" sx={{ fontFamily: '"Playfair Display", serif', fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
              Gallery Admin Portal
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 } }}>
            <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
              <Typography variant="subtitle2" color="text.primary" fontWeight="600">
                {user.name}
              </Typography>
              <Chip
                label={user.role}
                size="small"
                variant="outlined"
                color={user.role === 'SUPER_ADMIN' ? 'secondary' : 'default'}
                sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }}
              />
            </Box>
            <Avatar sx={{ bgcolor: 'secondary.main', color: '#FFFFFF', width: 36, height: 36 }}>
              {user.name.substring(0, 1).toUpperCase()}
            </Avatar>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Responsive Sidebar Drawer */}
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
        aria-label="mailbox folders"
      >
        {/* Temporary Drawer for mobile/tablet screen widths */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              backgroundColor: '#2E2E2E',
              color: '#FAF8F5',
              borderRight: 'none',
            },
          }}
        >
          {drawerContent}
        </Drawer>

        {/* Permanent Drawer for desktop screen widths */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              backgroundColor: '#2E2E2E',
              color: '#FAF8F5',
              borderRight: 'none',
            },
          }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>

      {/* Admin Content Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 4 },
          mt: '70px',
          width: { xs: '100%', md: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        <Outlet />
      </Box>

      {/* Global Admin Toast Notifications */}
      <Snackbar
        open={open}
        autoHideDuration={5000}
        onClose={closeToast}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={closeToast} severity={severity} sx={{ width: '100%', borderRadius: 0 }}>
          {message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
