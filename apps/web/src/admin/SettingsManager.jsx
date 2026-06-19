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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  MenuItem,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { DeleteOutlineOutlined, AddOutlined, ImageOutlined, CloseOutlined } from '@mui/icons-material';
import { useToastStore } from '../store/store.js';

export default function SettingsManager() {
  const queryClient = useQueryClient();
  const { showToast } = useToastStore();
  const [errorMsg, setErrorMsg] = useState('');

  // Lists management states
  const [exhibitionsList, setExhibitionsList] = useState([]);
  const [awardsList, setAwardsList] = useState([]);
  const [newExYear, setNewExYear] = useState('');
  const [newExTitle, setNewExTitle] = useState('');
  const [newExLocation, setNewExLocation] = useState('');
  const [newAwYear, setNewAwYear] = useState('');
  const [newAwTitle, setNewAwTitle] = useState('');
  const [newAwOrg, setNewAwOrg] = useState('');

  // Media picker states
  const [mediaTarget, setMediaTarget] = useState(null); // 'about_image_url' or 'meet_artist_image_url'
  const [mediaList, setMediaList] = useState([]);

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
    setValue,
    watch,
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
      social_youtube: '',
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
      about_image_url: '',
      meet_artist_image_url: '',
      featured_section_show: '1',
      featured_section_title: 'Featured Works',
      featured_section_subtitle: 'Handpicked Selection',
      featured_section_limit: '3'
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
        social_youtube: settings.social_youtube || '',
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
        about_image_url: settings.about_image_url || '',
        meet_artist_image_url: settings.meet_artist_image_url || '',
        featured_section_show: settings.featured_section_show || '1',
        featured_section_title: settings.featured_section_title || 'Featured Works',
        featured_section_subtitle: settings.featured_section_subtitle || 'Handpicked Selection',
        featured_section_limit: settings.featured_section_limit || '3'
      });

      // Parse Exhibitions & Awards
      let parsedEx = [];
      try {
        parsedEx = JSON.parse(settings.about_exhibitions || '[]');
      } catch (e) {
        parsedEx = [];
      }
      setExhibitionsList(parsedEx);

      let parsedAw = [];
      try {
        parsedAw = JSON.parse(settings.about_awards || '[]');
      } catch (e) {
        parsedAw = [];
      }
      setAwardsList(parsedAw);
    }
  }, [settings, reset]);

  // List helpers
  const handleAddExhibition = () => {
    if (newExYear.trim() && newExTitle.trim()) {
      setExhibitionsList([
        ...exhibitionsList,
        { year: newExYear.trim(), title: newExTitle.trim(), location: newExLocation.trim() }
      ]);
      setNewExYear('');
      setNewExTitle('');
      setNewExLocation('');
    } else {
      showToast('Year and Title are required for exhibitions.', 'warning');
    }
  };

  const handleRemoveExhibition = (index) => {
    setExhibitionsList(exhibitionsList.filter((_, i) => i !== index));
  };

  const handleAddAward = () => {
    if (newAwYear.trim() && newAwTitle.trim()) {
      setAwardsList([
        ...awardsList,
        { year: newAwYear.trim(), title: newAwTitle.trim(), organization: newAwOrg.trim() }
      ]);
      setNewAwYear('');
      setNewAwTitle('');
      setNewAwOrg('');
    } else {
      showToast('Year and Title are required for awards.', 'warning');
    }
  };

  const handleRemoveAward = (index) => {
    setAwardsList(awardsList.filter((_, i) => i !== index));
  };

  // Media selector helper
  const openMediaLibrary = (target) => {
    setMediaTarget(target);
    fetch('/api/media')
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setMediaList(json.data);
      })
      .catch(console.error);
  };

  const handleSelectMedia = (url) => {
    if (mediaTarget === 'about_image_url') {
      setValue('about_image_url', url);
    } else if (mediaTarget === 'meet_artist_image_url') {
      setValue('meet_artist_image_url', url);
    }
    setMediaTarget(null);
  };

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
    const payload = {
      ...data,
      about_exhibitions: JSON.stringify(exhibitionsList),
      about_awards: JSON.stringify(awardsList),
    };
    mutation.mutate(payload);
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

                {/* Artist Bio & Meet Artist Images */}
                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Artist Profile Images</Typography>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <TextField
                          fullWidth
                          label="Biography Image URL"
                          {...register('about_image_url')}
                          error={!!errors.about_image_url}
                          helperText="Shown on the Biography (About) page. (Recommended)"
                        />
                        <Button variant="outlined" onClick={() => openMediaLibrary('about_image_url')} sx={{ minWidth: 48, p: 0, height: 56 }}>
                          <ImageOutlined />
                        </Button>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <TextField
                          fullWidth
                          label="Meet the Artist Image URL"
                          {...register('meet_artist_image_url')}
                          error={!!errors.meet_artist_image_url}
                          helperText="Shown on the Home Page 'Meet the Artist' section."
                        />
                        <Button variant="outlined" onClick={() => openMediaLibrary('meet_artist_image_url')} sx={{ minWidth: 48, p: 0, height: 56 }}>
                          <ImageOutlined />
                        </Button>
                      </Box>
                    </Grid>
                  </Grid>
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
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="YouTube URL"
                        {...register('social_youtube')}
                        error={!!errors.social_youtube}
                        helperText={errors.social_youtube?.message}
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

                {/* Featured Section */}
                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Featured Works Section (Homepage)</Typography>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        select
                        label="Featured Works Section"
                        {...register('featured_section_show')}
                        error={!!errors.featured_section_show}
                        helperText="Configure whether to display the Featured section on the home page."
                      >
                        <MenuItem value="1">Show Section</MenuItem>
                        <MenuItem value="0">Hide Section</MenuItem>
                      </TextField>
                    </Grid>
                    <Grid item xs={12} sm={8}>
                      <TextField
                        fullWidth
                        label="Section Title"
                        {...register('featured_section_title')}
                        error={!!errors.featured_section_title}
                        helperText="The title displayed at the top of the section (e.g. Featured Works)."
                      />
                    </Grid>
                    <Grid item xs={12} sm={8}>
                      <TextField
                        fullWidth
                        label="Section Subtitle"
                        {...register('featured_section_subtitle')}
                        error={!!errors.featured_section_subtitle}
                        helperText="The small subtitle displayed above the title (e.g. Handpicked Selection)."
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        label="Display Limit"
                        type="text"
                        {...register('featured_section_limit')}
                        error={!!errors.featured_section_limit}
                        helperText="The maximum number of featured paintings to display (e.g. 3)."
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

                <Grid item xs={12}><Divider /></Grid>

                {/* Exhibitions Management */}
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Manage Exhibitions</Typography>
                  <Paper sx={{ p: 2, border: '1px solid #EBE6DF', boxShadow: 'none', mb: 2, borderRadius: 0 }}>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={3}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Year"
                          placeholder="e.g. 2026"
                          value={newExYear}
                          onChange={(e) => setNewExYear(e.target.value)}
                        />
                      </Grid>
                      <Grid item xs={5}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Exhibition Title"
                          placeholder="e.g. Echoes of Light"
                          value={newExTitle}
                          onChange={(e) => setNewExTitle(e.target.value)}
                        />
                      </Grid>
                      <Grid item xs={4}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Location"
                          placeholder="e.g. London"
                          value={newExLocation}
                          onChange={(e) => setNewExLocation(e.target.value)}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <Button
                          variant="outlined"
                          startIcon={<AddOutlined />}
                          onClick={handleAddExhibition}
                          fullWidth
                        >
                          Add Exhibition
                        </Button>
                      </Grid>
                    </Grid>
                  </Paper>
                  <TableContainer component={Paper} sx={{ maxHeight: 250, border: '1px solid #EBE6DF', boxShadow: 'none', borderRadius: 0 }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ width: '20%' }}>Year</TableCell>
                          <TableCell>Exhibition / Location</TableCell>
                          <TableCell align="right" sx={{ width: '15%' }}>Action</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {exhibitionsList.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={3} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                              No exhibitions listed yet.
                            </TableCell>
                          </TableRow>
                        ) : (
                          exhibitionsList.map((ex, idx) => (
                            <TableRow key={idx}>
                              <TableCell sx={{ fontWeight: 600 }}>{ex.year}</TableCell>
                              <TableCell>
                                <Typography variant="body2" fontWeight="600">{ex.title}</Typography>
                                <Typography variant="caption" color="text.secondary">{ex.location}</Typography>
                              </TableCell>
                              <TableCell align="right">
                                <IconButton size="small" color="error" onClick={() => handleRemoveExhibition(idx)}>
                                  <DeleteOutlineOutlined fontSize="small" />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>

                {/* Awards Management */}
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Manage Awards & Recognition</Typography>
                  <Paper sx={{ p: 2, border: '1px solid #EBE6DF', boxShadow: 'none', mb: 2, borderRadius: 0 }}>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={3}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Year"
                          placeholder="e.g. 2025"
                          value={newAwYear}
                          onChange={(e) => setNewAwYear(e.target.value)}
                        />
                      </Grid>
                      <Grid item xs={5}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Award Title"
                          placeholder="e.g. Best Oil Painting"
                          value={newAwTitle}
                          onChange={(e) => setNewAwTitle(e.target.value)}
                        />
                      </Grid>
                      <Grid item xs={4}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Organization"
                          placeholder="e.g. NY Arts Commission"
                          value={newAwOrg}
                          onChange={(e) => setNewAwOrg(e.target.value)}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <Button
                          variant="outlined"
                          startIcon={<AddOutlined />}
                          onClick={handleAddAward}
                          fullWidth
                        >
                          Add Award
                        </Button>
                      </Grid>
                    </Grid>
                  </Paper>
                  <TableContainer component={Paper} sx={{ maxHeight: 250, border: '1px solid #EBE6DF', boxShadow: 'none', borderRadius: 0 }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ width: '20%' }}>Year</TableCell>
                          <TableCell>Award / Org</TableCell>
                          <TableCell align="right" sx={{ width: '15%' }}>Action</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {awardsList.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={3} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                              No awards listed yet.
                            </TableCell>
                          </TableRow>
                        ) : (
                          awardsList.map((aw, idx) => (
                            <TableRow key={idx}>
                              <TableCell sx={{ fontWeight: 600 }}>{aw.year}</TableCell>
                              <TableCell>
                                <Typography variant="body2" fontWeight="600">{aw.title}</Typography>
                                <Typography variant="caption" color="text.secondary">{aw.organization}</Typography>
                              </TableCell>
                              <TableCell align="right">
                                <IconButton size="small" color="error" onClick={() => handleRemoveAward(idx)}>
                                  <DeleteOutlineOutlined fontSize="small" />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
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
      {/* Media Selection Dialog Modal */}
      <Dialog open={!!mediaTarget} onClose={() => setMediaTarget(null)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Select Image from Library</span>
          <IconButton onClick={() => setMediaTarget(null)}><CloseOutlined /></IconButton>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            {mediaList.length === 0 ? (
              <Box sx={{ p: 4, width: '100%', textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  No images in media library. Upload images in the Media Library tab first.
                </Typography>
              </Box>
            ) : (
              mediaList.map((m) => (
                <Grid item xs={6} sm={4} md={3} key={m.id}>
                  <Paper
                    sx={{
                      cursor: 'pointer',
                      border: '1px solid #EBE6DF',
                      '&:hover': { borderColor: 'secondary.main' }
                    }}
                    onClick={() => handleSelectMedia(m.url)}
                  >
                    <img
                      src={m.url}
                      alt={m.filename}
                      style={{ width: '100%', height: 120, objectFit: 'cover' }}
                    />
                    <Typography
                      variant="caption"
                      sx={{
                        p: 1,
                        display: 'block',
                        textOverflow: 'ellipsis',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {m.filename}
                    </Typography>
                  </Paper>
                </Grid>
              ))
            )}
          </Grid>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
