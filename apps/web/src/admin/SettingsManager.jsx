import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { siteSettingsSchema } from 'schemas';
import {
  Box,
  Typography,
  Button,
  TextField,
  Grid,
  Card,
  CardContent,
  Alert,
  Divider,
  Snackbar,
  CircularProgress,
} from '@mui/material';
import { useToastStore } from '../store/store.js';

export default function SettingsManager() {
  const queryClient = useQueryClient();
  const { showToast } = useToastStore();
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch settings
  const { data: settingsRes, isLoading } = useQuery({
    queryKey: ['adminSettings'],
    queryFn: () => fetch('/api/settings').then(res => res.json())
  });
  const settings = settingsRes?.data || {};

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(siteSettingsSchema),
    defaultValues: {
      hero_title: '',
      hero_subtitle: '',
      artist_bio: '',
      social_facebook: '',
      social_instagram: '',
      social_pinterest: '',
      contact_email: '',
      contact_phone: '',
      contact_address: '',
      footer_content: '',
      seo_default_title: '',
      seo_default_description: '',
      imgbb_api_key: '',
      pagination_limit_gallery: '',
      pagination_limit_admin_paintings: '',
      pagination_limit_admin_orders: '',
      pagination_limit_admin_users: '',
    }
  });

  // Hydrate fields
  useEffect(() => {
    if (settings && Object.keys(settings).length > 0) {
      reset({
        hero_title: settings.hero_title || '',
        hero_subtitle: settings.hero_subtitle || '',
        artist_bio: settings.artist_bio || '',
        social_facebook: settings.social_facebook || '',
        social_instagram: settings.social_instagram || '',
        social_pinterest: settings.social_pinterest || '',
        contact_email: settings.contact_email || '',
        contact_phone: settings.contact_phone || '',
        contact_address: settings.contact_address || '',
        footer_content: settings.footer_content || '',
        seo_default_title: settings.seo_default_title || '',
        seo_default_description: settings.seo_default_description || '',
        imgbb_api_key: settings.imgbb_api_key || '',
        pagination_limit_gallery: settings.pagination_limit_gallery || '6',
        pagination_limit_admin_paintings: settings.pagination_limit_admin_paintings || '10',
        pagination_limit_admin_orders: settings.pagination_limit_admin_orders || '10',
        pagination_limit_admin_users: settings.pagination_limit_admin_users || '10',
      });
    }
  }, [settings, reset]);

  // Update mutation
  const mutation = useMutation({
    mutationFn: async (data) => {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || 'Failed to update settings');
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['adminSettings']);
      queryClient.invalidateQueries(['settings']);
      showToast('Site settings updated successfully!', 'success');
    },
    onError: (err) => {
      setErrorMsg(err.message || 'Failed to save settings');
      showToast(err.message || 'Failed to save settings.', 'error');
    }
  });

  const onSubmit = (data) => {
    setErrorMsg('');
    mutation.mutate(data);
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 600, mb: 4 }}>
        Site Settings & Meta
      </Typography>

      {errorMsg && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 0 }}>
          {errorMsg}
        </Alert>
      )}

      <Card sx={{ border: '1px solid #EBE6DF', borderRadius: 0, boxShadow: 'none' }}>
        <CardContent sx={{ p: 4 }}>
          {isLoading ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4, gap: 2 }}>
              <CircularProgress size={40} color="secondary" />
              <Typography variant="body2" color="text.secondary">Loading settings data...</Typography>
            </Box>
          ) : (
            <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
              <Grid container spacing={4}>
                {/* Hero section */}
                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Hero Section Configuration</Typography>
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Hero Title"
                        {...register('hero_title')}
                        error={!!errors.hero_title}
                        helperText={errors.hero_title?.message}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Hero Subtitle"
                        multiline
                        rows={2}
                        {...register('hero_subtitle')}
                        error={!!errors.hero_subtitle}
                        helperText={errors.hero_subtitle?.message}
                      />
                    </Grid>
                  </Grid>
                </Grid>

                <Grid item xs={12}><Divider /></Grid>

                {/* Profile section */}
                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Artist Profile Biography</Typography>
                  <TextField
                    fullWidth
                    label="Artist Biography Summary"
                    multiline
                    rows={6}
                    {...register('artist_bio')}
                    error={!!errors.artist_bio}
                    helperText={errors.artist_bio?.message}
                  />
                </Grid>

                <Grid item xs={12}><Divider /></Grid>

                {/* Social links */}
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Social Media Handles</Typography>
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Instagram URL"
                        {...register('social_instagram')}
                        error={!!errors.social_instagram}
                        helperText={errors.social_instagram?.message}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Facebook URL"
                        {...register('social_facebook')}
                        error={!!errors.social_facebook}
                        helperText={errors.social_facebook?.message}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Pinterest URL"
                        {...register('social_pinterest')}
                        error={!!errors.social_pinterest}
                        helperText={errors.social_pinterest?.message}
                      />
                    </Grid>
                  </Grid>
                </Grid>

                {/* Contact info */}
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Contact Details & Footer</Typography>
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Primary Studio Email"
                        {...register('contact_email')}
                        error={!!errors.contact_email}
                        helperText={errors.contact_email?.message}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Studio Phone"
                        {...register('contact_phone')}
                        error={!!errors.contact_phone}
                        helperText={errors.contact_phone?.message}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Studio Address"
                        multiline
                        rows={2}
                        {...register('contact_address')}
                        error={!!errors.contact_address}
                        helperText={errors.contact_address?.message}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Footer Copyright Content"
                        {...register('footer_content')}
                        error={!!errors.footer_content}
                        helperText={errors.footer_content?.message}
                      />
                    </Grid>
                  </Grid>
                </Grid>

                <Grid item xs={12}><Divider /></Grid>

                {/* Integrations & Limits */}
                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Integrations & Pagination Limits</Typography>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="ImgBB API Key"
                        type="password"
                        {...register('imgbb_api_key')}
                        error={!!errors.imgbb_api_key}
                        helperText={errors.imgbb_api_key?.message || "Optional. If configured, media library uploads will use ImgBB."}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Public Gallery Page Size"
                        type="text"
                        {...register('pagination_limit_gallery')}
                        error={!!errors.pagination_limit_gallery}
                        helperText={errors.pagination_limit_gallery?.message || "Default number of paintings shown per page in public gallery. (e.g. 6)"}
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        label="Admin Paintings Page Size"
                        type="text"
                        {...register('pagination_limit_admin_paintings')}
                        error={!!errors.pagination_limit_admin_paintings}
                        helperText={errors.pagination_limit_admin_paintings?.message || "Default rows per page in admin paintings list."}
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        label="Admin Orders Page Size"
                        type="text"
                        {...register('pagination_limit_admin_orders')}
                        error={!!errors.pagination_limit_admin_orders}
                        helperText={errors.pagination_limit_admin_orders?.message || "Default rows per page in admin customer orders."}
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        label="Admin Users Page Size"
                        type="text"
                        {...register('pagination_limit_admin_users')}
                        error={!!errors.pagination_limit_admin_users}
                        helperText={errors.pagination_limit_admin_users?.message || "Default rows per page in admin staff accounts."}
                      />
                    </Grid>
                  </Grid>
                </Grid>

                <Grid item xs={12}><Divider /></Grid>

                {/* SEO Defaults */}
                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>SEO Metadata Defaults</Typography>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Default SEO Title Tag"
                        {...register('seo_default_title')}
                        error={!!errors.seo_default_title}
                        helperText={errors.seo_default_title?.message}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Default SEO Description Tag"
                        multiline
                        rows={2}
                        {...register('seo_default_description')}
                        error={!!errors.seo_default_description}
                        helperText={errors.seo_default_description?.message}
                      />
                    </Grid>
                  </Grid>
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                    <Button type="submit" variant="contained" size="large" disabled={isSubmitting} sx={{ py: 1.5, px: 6 }}>
                      {isSubmitting ? 'Saving Settings...' : 'Save Site Settings'}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
