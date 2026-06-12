import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { orderSchema } from 'schemas';
import { useCartStore } from '../store/store.js';
import { formatPrice } from 'utils';
import {
  Container,
  Grid,
  Box,
  Typography,
  TextField,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Alert,
} from '@mui/material';

export default function Checkout() {
  const navigate = useNavigate();
  const { items, clearCart } = useCartStore();
  const [errorMsg, setErrorMsg] = useState('');

  const totalAmount = items.reduce((acc, curr) => acc + curr.price, 0);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      customer_first_name: '',
      customer_last_name: '',
      customer_email: '',
      customer_phone: '',
      shipping_address: '',
      shipping_city: '',
      shipping_state: '',
      shipping_postal_code: '',
      shipping_country: '',
      items: items.map((item) => ({ painting_id: item.id, price: item.price })),
    },
  });

  const onSubmit = async (data) => {
    setErrorMsg('');
    
    // Inject current items dynamically
    const payload = {
      ...data,
      items: items.map((item) => ({ painting_id: item.id, price: item.price })),
    };

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || 'Checkout transaction failed');
      }

      // Order created successfully
      clearCart();
      navigate(`/order-confirmation/${result.data.order_number}`);
    } catch (e) {
      setErrorMsg(e.message || 'Checkout failed. Please try again.');
    }
  };

  if (items.length === 0) {
    return (
      <Container sx={{ py: 15, textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom>Your Bag is Empty</Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Please add paintings to your bag before proceeding to checkout.
        </Typography>
        <Button variant="contained" component={RouterLink} to="/gallery">
          Return to Gallery
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      <Typography variant="h3" sx={{ mb: 6, textAlign: 'center' }}>Checkout</Typography>

      {errorMsg && (
        <Alert severity="error" sx={{ borderRadius: 0, mb: 4 }}>
          {errorMsg}
        </Alert>
      )}

      <Grid container spacing={6}>
        {/* Left: Customer Form */}
        <Grid item xs={12} md={7}>
          <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>1. Customer Information</Typography>
            <Grid container spacing={3} sx={{ mb: 5 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  {...register('customer_first_name')}
                  error={!!errors.customer_first_name}
                  helperText={errors.customer_first_name?.message}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  {...register('customer_last_name')}
                  error={!!errors.customer_last_name}
                  helperText={errors.customer_last_name?.message}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email Address"
                  type="email"
                  {...register('customer_email')}
                  error={!!errors.customer_email}
                  helperText={errors.customer_email?.message}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  {...register('customer_phone')}
                  error={!!errors.customer_phone}
                  helperText={errors.customer_phone?.message}
                />
              </Grid>
            </Grid>

            <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>2. Shipping Address</Typography>
            <Grid container spacing={3} sx={{ mb: 5 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Address Line 1"
                  {...register('shipping_address')}
                  error={!!errors.shipping_address}
                  helperText={errors.shipping_address?.message}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="City"
                  {...register('shipping_city')}
                  error={!!errors.shipping_city}
                  helperText={errors.shipping_city?.message}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="State / Province"
                  {...register('shipping_state')}
                  error={!!errors.shipping_state}
                  helperText={errors.shipping_state?.message}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Postal / ZIP Code"
                  {...register('shipping_postal_code')}
                  error={!!errors.shipping_postal_code}
                  helperText={errors.shipping_postal_code?.message}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Country"
                  {...register('shipping_country')}
                  error={!!errors.shipping_country}
                  helperText={errors.shipping_country?.message}
                />
              </Grid>
            </Grid>

            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              disabled={isSubmitting}
              sx={{ py: 2 }}
            >
              {isSubmitting ? 'Processing Order...' : `Purchase - ${formatPrice(totalAmount)}`}
            </Button>
          </Box>
        </Grid>

        {/* Right: Order Summary */}
        <Grid item xs={12} md={5}>
          <Box sx={{ border: '1px solid #EBE6DF', p: 4, backgroundColor: '#FAF8F5' }}>
            <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>Order Summary</Typography>
            <List disablePadding>
              {items.map((item) => (
                <ListItem key={item.id} sx={{ px: 0, py: 2 }}>
                  <ListItemAvatar sx={{ mr: 2 }}>
                    <Avatar variant="square" src={item.thumbnail_url || item.image_url} sx={{ width: 50, height: 50 }} />
                  </ListItemAvatar>
                  <ListItemText
                    primary={item.title}
                    secondary={item.medium}
                    primaryTypographyProps={{ style: { fontWeight: 500 } }}
                  />
                  <Typography variant="body2" fontWeight="600">
                    {formatPrice(item.price)}
                  </Typography>
                </ListItem>
              ))}
            </List>
            <Divider sx={{ my: 3 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">Shipping</Typography>
              <Typography variant="body2" color="text.secondary" fontWeight="600">Complimentary</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
              <Typography variant="h6" fontWeight="600">Total Amount</Typography>
              <Typography variant="h6" fontWeight="600" color="secondary">
                {formatPrice(totalAmount)}
              </Typography>
            </Box>
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
}
