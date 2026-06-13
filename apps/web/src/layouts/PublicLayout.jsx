import React, { useState } from 'react';
import { Outlet, Link as RouterLink, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Badge,
  Box,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  Container,
  Grid,
} from '@mui/material';
import {
  ShoppingBagOutlined,
  MenuOutlined,
  CloseOutlined,
  Instagram,
  Facebook,
  Pinterest,
  DeleteOutlineOutlined,
} from '@mui/icons-material';
import { useCartStore } from '../store/store.js';
import { formatPrice } from 'utils';

export default function PublicLayout() {
  const [cartOpen, setCartOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { items, removeFromCart } = useCartStore();
  const navigate = useNavigate();

  // Load site settings dynamically from Cloudflare D1 via Worker API
  const { data: settingsRes } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await fetch('/api/settings');
      return res.json();
    },
  });
  const settings = settingsRes?.data || {};

  const handleCheckoutClick = () => {
    setCartOpen(false);
    navigate('/checkout');
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Header */}
      <AppBar position="sticky" elevation={1} sx={{ backgroundColor: 'rgba(250, 248, 245, 0.9)', backdropFilter: 'blur(8px)', borderBottom: '1px solid #EBE6DF' }}>
        <Container maxWidth="xl">
          <Toolbar disableGutters sx={{ height: 80, display: 'flex', justifyContent: 'space-between' }}>
            {/* Logo */}
            <Typography
              variant="h5"
              component={RouterLink}
              to="/"
              sx={{
                fontFamily: '"Playfair Display", serif',
                fontWeight: 600,
                color: 'primary.main',
                textDecoration: 'none',
                letterSpacing: '0.05em',
              }}
            >
              UPASANA BORDOLOI
            </Typography>

            {/* Desktop Navigation */}
            <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 4 }}>
              <Button component={RouterLink} to="/gallery" color="primary" sx={{ fontSize: '0.8rem' }}>Gallery</Button>
              <Button component={RouterLink} to="/collections" color="primary" sx={{ fontSize: '0.8rem' }}>Collections</Button>
              <Button component={RouterLink} to="/about" color="primary" sx={{ fontSize: '0.8rem' }}>About</Button>
              <Button component={RouterLink} to="/contact" color="primary" sx={{ fontSize: '0.8rem' }}>Contact</Button>
            </Box>

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton color="primary" onClick={() => setCartOpen(true)}>
                <Badge badgeContent={items.length} color="secondary">
                  <ShoppingBagOutlined />
                </Badge>
              </IconButton>
              
              <IconButton
                color="primary"
                sx={{ display: { xs: 'flex', md: 'none' } }}
                onClick={() => setMobileMenuOpen(true)}
              >
                <MenuOutlined />
              </IconButton>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Mobile Nav Menu Drawer */}
      <Drawer anchor="right" open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)}>
        <Box sx={{ width: 280, p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
            <Typography variant="h6" sx={{ fontFamily: '"Playfair Display", serif' }}>Menu</Typography>
            <IconButton onClick={() => setMobileMenuOpen(false)}><CloseOutlined /></IconButton>
          </Box>
          <List>
            <ListItem button component={RouterLink} to="/gallery" onClick={() => setMobileMenuOpen(false)}>
              <ListItemText primary="GALLERY" primaryTypographyProps={{ style: { letterSpacing: '0.1em', fontWeight: 500 } }} />
            </ListItem>
            <ListItem button component={RouterLink} to="/collections" onClick={() => setMobileMenuOpen(false)}>
              <ListItemText primary="COLLECTIONS" primaryTypographyProps={{ style: { letterSpacing: '0.1em', fontWeight: 500 } }} />
            </ListItem>
            <ListItem button component={RouterLink} to="/about" onClick={() => setMobileMenuOpen(false)}>
              <ListItemText primary="ABOUT THE ARTIST" primaryTypographyProps={{ style: { letterSpacing: '0.1em', fontWeight: 500 } }} />
            </ListItem>
            <ListItem button component={RouterLink} to="/contact" onClick={() => setMobileMenuOpen(false)}>
              <ListItemText primary="CONTACT" primaryTypographyProps={{ style: { letterSpacing: '0.1em', fontWeight: 500 } }} />
            </ListItem>
          </List>
        </Box>
      </Drawer>

      {/* Shopping Cart Drawer */}
      <Drawer anchor="right" open={cartOpen} onClose={() => setCartOpen(false)}>
        <Box sx={{ width: { xs: '100vw', sm: 400 }, height: '100%', display: 'flex', flexDirection: 'column', p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" sx={{ fontFamily: '"Playfair Display", serif' }}>Shopping Bag</Typography>
            <IconButton onClick={() => setCartOpen(false)}><CloseOutlined /></IconButton>
          </Box>
          <Divider />

          {/* Cart Items List */}
          <Box sx={{ flexGrow: 1, overflowY: 'auto', my: 2 }}>
            {items.length === 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80%' }}>
                <ShoppingBagOutlined sx={{ fontSize: 48, color: '#EBE6DF', mb: 2 }} />
                <Typography variant="body1" color="text.secondary">Your bag is empty</Typography>
              </Box>
            ) : (
              <List>
                {items.map((item) => (
                  <React.Fragment key={item.id}>
                    <ListItem
                      secondaryAction={
                        <IconButton edge="end" onClick={() => removeFromCart(item.id)}>
                          <DeleteOutlineOutlined />
                        </IconButton>
                      }
                      sx={{ py: 2 }}
                    >
                      <ListItemAvatar sx={{ mr: 2 }}>
                        <Avatar
                          variant="square"
                          src={item.thumbnail_url || item.image_url}
                          alt={item.title}
                          sx={{ width: 64, height: 64 }}
                        />
                      </ListItemAvatar>
                      <ListItemText
                        primary={item.title}
                        secondary={`${item.medium} — ${formatPrice(item.price)}`}
                        primaryTypographyProps={{ style: { fontWeight: 500 } }}
                      />
                    </ListItem>
                    <Divider />
                  </React.Fragment>
                ))}
              </List>
            )}
          </Box>

          {/* Cart Footer */}
          {items.length > 0 && (
            <Box>
              <Divider />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', my: 3 }}>
                <Typography variant="subtitle1" fontWeight="600">Total:</Typography>
                <Typography variant="subtitle1" fontWeight="600">
                  {formatPrice(items.reduce((acc, curr) => acc + curr.price, 0))}
                </Typography>
              </Box>
              <Button
                variant="contained"
                fullWidth
                size="large"
                onClick={handleCheckoutClick}
              >
                Proceed to Checkout
              </Button>
            </Box>
          )}
        </Box>
      </Drawer>

      {/* Main Pages Content */}
      <Box sx={{ flexGrow: 1 }}>
        <Outlet />
      </Box>

      {/* Footer */}
      <Box sx={{ backgroundColor: '#2E2E2E', color: '#FAF8F5', py: 8, mt: 'auto', borderTop: '1px solid #EBE6DF' }}>
        <Container maxWidth="xl">
          <Grid container spacing={6}>
            <Grid item xs={12} md={4}>
              <Typography variant="h6" sx={{ fontFamily: '"Playfair Display", serif', color: '#A67C52', mb: 2 }}>
                ABOUT THE GALLERY
              </Typography>
              <Typography variant="body2" sx={{ color: '#C8C4BE', pr: 4 }}>
                {settings.artist_bio || 'Exploring light, texture, and silence through fine art collections.'}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="h6" sx={{ fontFamily: '"Playfair Display", serif', color: '#A67C52', mb: 2 }}>
                STUDIO LOCATION
              </Typography>
              <Typography variant="body2" sx={{ color: '#C8C4BE', mb: 1 }}>
                {settings.contact_address || 'Studio 12B, Arts District, New York, NY 10013'}
              </Typography>
              <Typography variant="body2" sx={{ color: '#C8C4BE', mb: 1 }}>
                Email: {settings.contact_email || 'artist@gallery.com'}
              </Typography>
              <Typography variant="body2" sx={{ color: '#C8C4BE' }}>
                Phone: {settings.contact_phone || '+1 (555) 234-5678'}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="h6" sx={{ fontFamily: '"Playfair Display", serif', color: '#A67C52', mb: 2 }}>
                FOLLOW THE ARTIST
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
                {settings.social_instagram && (
                  <IconButton href={settings.social_instagram} target="_blank" sx={{ color: '#FAF8F5' }}><Instagram /></IconButton>
                )}
                {settings.social_facebook && (
                  <IconButton href={settings.social_facebook} target="_blank" sx={{ color: '#FAF8F5' }}><Facebook /></IconButton>
                )}
                {settings.social_pinterest && (
                  <IconButton href={settings.social_pinterest} target="_blank" sx={{ color: '#FAF8F5' }}><Pinterest /></IconButton>
                )}
              </Box>
            </Grid>
          </Grid>
          <Divider sx={{ borderColor: '#404040', my: 4 }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
            <Typography variant="caption" sx={{ color: '#8E8A84' }}>
              {settings.footer_content || '© 2026 Artist Portfolio Gallery. All rights reserved.'}
            </Typography>
            <Typography variant="caption" sx={{ color: '#8E8A84' }} component={RouterLink} to="/admin/login">
              Staff Administration Access
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}
