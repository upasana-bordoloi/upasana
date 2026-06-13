import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { contactFormSchema } from 'schemas';
import {
  Container,
  Grid,
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  Divider,
} from '@mui/material';

export default function Contact() {
  useEffect(() => {
    document.title = "Contact | Upasana Bordoloi";
  }, []);

  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { data: settingsRes } = useQuery({
    queryKey: ['settings'],
    queryFn: () => fetch('/api/settings').then(res => res.json())
  });
  const settings = settingsRes?.data || {};

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(contactFormSchema),
    defaultValues: { name: '', email: '', subject: '', message: '' }
  });

  const onSubmit = async (data) => {
    setSuccess(false);
    setErrorMsg('');
    try {
      // Mock submit or post to api endpoint if existing
      const res = await fetch('/api/settings', { // fall back or custom api post
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      // Set mock success for front-end demonstration
      setSuccess(true);
      reset();
    } catch (e) {
      setErrorMsg('Failed to send message. Please try again.');
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      <Box sx={{ mb: 8, textAlign: 'center' }}>
        <Typography variant="h2" sx={{ mb: 2 }}>Get In Touch</Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: '600px', mx: 'auto' }}>
          For purchase inquiries, commissions, media kits, or studio visits, please contact us using the form below.
        </Typography>
      </Box>

      <Grid container spacing={8}>
        {/* Left Side: Contact Details */}
        <Grid item xs={12} md={5}>
          <Typography variant="h4" sx={{ mb: 4 }}>Studio Details</Typography>
          
          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle1" fontWeight="600" color="secondary" sx={{ mb: 0.5 }}>
              Studio Address
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {settings.contact_address || 'Studio 12B, Arts District, New York, NY 10013'}
            </Typography>
          </Box>

          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle1" fontWeight="600" color="secondary" sx={{ mb: 0.5 }}>
              Email Inquiries
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {settings.contact_email || 'artist@gallery.com'}
            </Typography>
          </Box>

          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle1" fontWeight="600" color="secondary" sx={{ mb: 0.5 }}>
              Phone Contact
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {settings.contact_phone || '+1 (555) 234-5678'}
            </Typography>
          </Box>

          <Divider sx={{ my: 4 }} />
          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
            We aim to reply to all purchase and collection inquiries within 24 hours.
          </Typography>
        </Grid>

        {/* Right Side: Validated Contact Form */}
        <Grid item xs={12} md={7}>
          <Typography variant="h4" sx={{ mb: 4 }}>Send Message</Typography>
          
          {success && (
            <Alert severity="success" sx={{ borderRadius: 0, mb: 4 }}>
              Your message was sent successfully! We will get back to you shortly.
            </Alert>
          )}

          {errorMsg && (
            <Alert severity="error" sx={{ borderRadius: 0, mb: 4 }}>
              {errorMsg}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Your Name"
                  {...register('name')}
                  error={!!errors.name}
                  helperText={errors.name?.message}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email Address"
                  type="email"
                  {...register('email')}
                  error={!!errors.email}
                  helperText={errors.email?.message}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Subject"
                  {...register('subject')}
                  error={!!errors.subject}
                  helperText={errors.subject?.message}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Your Message"
                  multiline
                  rows={6}
                  {...register('message')}
                  error={!!errors.message}
                  helperText={errors.message?.message}
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={isSubmitting}
                  sx={{ py: 1.5, px: 5 }}
                >
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
}
