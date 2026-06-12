import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema } from 'schemas';
import { useAuthStore } from '../store/store.js';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  Card,
  CardContent,
} from '@mui/material';

export default function Login() {
  const navigate = useNavigate();
  const { user, setAuth } = useAuthStore();
  const [errorMsg, setErrorMsg] = useState('');

  // If already logged in, redirect straight to admin overview
  useEffect(() => {
    if (user) {
      navigate('/admin');
    }
  }, [user, navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' }
  });

  const onSubmit = async (data) => {
    setErrorMsg('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || 'Authentication failed');
      }

      // Save token & user in Zustand
      setAuth(result.user, result.token);
      navigate('/admin');
    } catch (e) {
      setErrorMsg(e.message || 'Login failed. Please verify credentials.');
    }
  };

  return (
    <Container maxWidth="xs" sx={{ py: 15 }}>
      <Card sx={{ border: '1px solid #EBE6DF', borderRadius: 0, boxShadow: '0px 8px 24px rgba(0,0,0,0.03)' }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textDecoration: 'center', mb: 4, textAlign: 'center' }}>
            <Typography variant="h4" sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 600, mb: 1 }}>
              Staff Login
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Gallery & Portfolio Management
            </Typography>
          </Box>

          {errorMsg && (
            <Alert severity="error" sx={{ borderRadius: 0, mb: 3 }}>
              {errorMsg}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <TextField
              fullWidth
              margin="normal"
              label="Email Address"
              type="email"
              {...register('email')}
              error={!!errors.email}
              helperText={errors.email?.message}
            />
            <TextField
              fullWidth
              margin="normal"
              label="Password"
              type="password"
              {...register('password')}
              error={!!errors.password}
              helperText={errors.password?.message}
            />
            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={isSubmitting}
              sx={{ py: 1.5, mt: 3 }}
            >
              {isSubmitting ? 'Logging in...' : 'Log In'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
}
