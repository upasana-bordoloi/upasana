import React, { useEffect } from 'react';
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
} from '@mui/icons-material';
import { useAuthStore } from '../store/store.js';

const drawerWidth = 260;

export default function AdminLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect to login if user session is absent
  useEffect(() => {
    if (!user) {
      navigate('/admin/login');
    }
  }, [user, navigate]);

  if (!user) {
    return null; // Return empty frame during redirection
  }

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardOutlined />, path: '/admin', roles: ['SUPER_ADMIN', 'ADMIN', 'EDITOR'] },
    { text: 'Paintings', icon: <ColorLensOutlined />, path: '/admin/paintings', roles: ['SUPER_ADMIN', 'ADMIN', 'EDITOR'] },
    { text: 'Media Library', icon: <ImageOutlined />, path: '/admin/media', roles: ['SUPER_ADMIN', 'ADMIN'] },
    { text: 'Orders', icon: <ReceiptOutlined />, path: '/admin/orders', roles: ['SUPER_ADMIN', 'ADMIN'] },
    { text: 'Site Settings', icon: <SettingsOutlined />, path: '/admin/settings', roles: ['SUPER_ADMIN', 'ADMIN'] },
    { text: 'Users List', icon: <PeopleOutlined />, path: '/admin/users', roles: ['SUPER_ADMIN'] },
  ];

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F6F5F2' }}>
      {/* Top Header Bar */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: `calc(100% - ${drawerWidth}px)`,
          ml: `${drawerWidth}px`,
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid #EBE6DF',
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', px: 4, height: 70 }}>
          <Typography variant="h6" color="text.primary" fontWeight="600" sx={{ fontFamily: '"Playfair Display", serif' }}>
            Gallery Admin Portal
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ textAlign: 'right' }}>
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
            <Avatar sx={{ bgcolor: 'secondary.main', color: '#FFFFFF' }}>
              {user.name.substring(0, 1).toUpperCase()}
            </Avatar>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Sidebar Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            backgroundColor: '#2E2E2E',
            color: '#FAF8F5',
            borderRight: 'none',
          },
        }}
      >
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
      </Drawer>

      {/* Admin Content Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 4,
          mt: '70px',
          width: `calc(100% - ${drawerWidth}px)`,
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}
