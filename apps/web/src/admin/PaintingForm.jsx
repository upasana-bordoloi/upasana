import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link as RouterLink } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paintingSchema } from 'schemas';
import { slugify } from 'utils';
import {
  Box,
  Typography,
  Button,
  TextField,
  Grid,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Card,
  CardContent,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  Grid2,
  Paper,
  IconButton,
  Divider,
} from '@mui/material';
import { CloseOutlined, ImageOutlined, ArrowBackOutlined } from '@mui/icons-material';

export default function PaintingForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [mediaTarget, setMediaTarget] = useState(null); // 'image_url', 'thumbnail_url', or 'additional'
  const [mediaList, setMediaList] = useState([]);
  const [additionalUrls, setAdditionalUrls] = useState([]);
  const [newAdditionalUrl, setNewAdditionalUrl] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const isEdit = !!id;

  // Retrieve current paintings to find the edit subject
  const { data: paintingsRes } = useQuery({
    queryKey: ['adminPaintingsList'],
    queryFn: () => fetch('/api/paintings?limit=1000').then((res) => res.json()),
    enabled: isEdit,
  });

  const editingPainting = paintingsRes?.data?.find((p) => p.id === id);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(paintingSchema),
    defaultValues: {
      title: '',
      slug: '',
      story: '',
      description: '',
      price: 0,
      medium: '',
      width: 0,
      height: 0,
      year_created: new Date().getFullYear(),
      status: 'DRAFT',
      featured: false,
      availability: 'AVAILABLE',
      image_url: '',
      thumbnail_url: '',
      additional_images: '[]',
      seo_title: '',
      seo_description: '',
    },
  });

  const watchTitle = watch('title');

  // Load details into fields if editing
  useEffect(() => {
    if (isEdit && editingPainting) {
      let parsed = [];
      try {
        parsed = JSON.parse(editingPainting.additional_images || '[]');
      } catch (e) {
        parsed = [];
      }
      setAdditionalUrls(parsed);

      reset({
        ...editingPainting,
        featured: editingPainting.featured === 1 || editingPainting.featured === true,
        price: parseFloat(editingPainting.price),
        width: parseFloat(editingPainting.width),
        height: parseFloat(editingPainting.height),
        year_created: parseInt(editingPainting.year_created, 10),
      });
    }
  }, [isEdit, editingPainting, reset]);

  // Auto-generate slug from title
  useEffect(() => {
    if (!isEdit && watchTitle) {
      setValue('slug', slugify(watchTitle));
    }
  }, [watchTitle, isEdit, setValue]);

  // Fetch Media Library listings
  const openMediaLibrary = (target) => {
    setMediaTarget(target);
    fetch('/api/media')
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setMediaList(json.data);
      })
      .catch(console.error);
  };

  const handleAddAdditionalUrl = (url) => {
    if (url && !additionalUrls.includes(url)) {
      setAdditionalUrls([...additionalUrls, url]);
    }
  };

  const handleRemoveAdditionalUrl = (index) => {
    setAdditionalUrls(additionalUrls.filter((_, i) => i !== index));
  };

  const handleSelectMedia = (url) => {
    if (mediaTarget === 'image_url') {
      setValue('image_url', url);
      setValue('og_image', url);
    } else if (mediaTarget === 'thumbnail_url') {
      setValue('thumbnail_url', url);
    } else if (mediaTarget === 'additional') {
      handleAddAdditionalUrl(url);
    }
    setMediaTarget(null);
  };

  // Submit Handler
  const mutation = useMutation({
    mutationFn: async (data) => {
      const url = isEdit ? `/api/paintings/${id}` : '/api/paintings';
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || 'Request failed');
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['adminPaintingsList']);
      navigate('/admin/paintings');
    },
    onError: (err) => {
      setErrorMsg(err.message || 'Operation failed. Please review values.');
    },
  });

  const onSubmit = (data) => {
    setErrorMsg('');
    const payload = {
      ...data,
      additional_images: JSON.stringify(additionalUrls),
    };
    mutation.mutate(payload);
  };

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <IconButton component={RouterLink} to="/admin/paintings">
          <ArrowBackOutlined />
        </IconButton>
        <Typography variant="h4" sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 600 }}>
          {isEdit ? 'Edit Painting Details' : 'Register New Painting'}
        </Typography>
      </Box>

      {errorMsg && (
        <Alert severity="error" sx={{ borderRadius: 0, mb: 4 }}>
          {errorMsg}
        </Alert>
      )}

      <Card sx={{ border: '1px solid #EBE6DF', borderRadius: 0, boxShadow: 'none' }}>
        <CardContent sx={{ p: 4 }}>
          <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <Grid container spacing={3}>
              {/* Left Column - Details */}
              <Grid item xs={12} md={8}>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Painting Title"
                      {...register('title')}
                      error={!!errors.title}
                      helperText={errors.title?.message}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="URL Slug"
                      {...register('slug')}
                      error={!!errors.slug}
                      helperText={errors.slug?.message}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="The Story Behind The Art"
                      multiline
                      rows={5}
                      {...register('story')}
                      error={!!errors.story}
                      helperText={errors.story?.message}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Technical Description"
                      multiline
                      rows={4}
                      {...register('description')}
                      error={!!errors.description}
                      helperText={errors.description?.message}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Price (USD)"
                      type="number"
                      {...register('price', { valueAsNumber: true })}
                      error={!!errors.price}
                      helperText={errors.price?.message}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Medium"
                      placeholder="e.g. Oil on Canvas"
                      {...register('medium')}
                      error={!!errors.medium}
                      helperText={errors.medium?.message}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Year Created"
                      type="number"
                      {...register('year_created', { valueAsNumber: true })}
                      error={!!errors.year_created}
                      helperText={errors.year_created?.message}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Width (Inches)"
                      type="number"
                      {...register('width', { valueAsNumber: true })}
                      error={!!errors.width}
                      helperText={errors.width?.message}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Height (Inches)"
                      type="number"
                      {...register('height', { valueAsNumber: true })}
                      error={!!errors.height}
                      helperText={errors.height?.message}
                    />
                  </Grid>
                </Grid>
              </Grid>

              {/* Right Column - Status & Media */}
              <Grid item xs={12} md={4}>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      select
                      label="Availability"
                      {...register('availability')}
                      error={!!errors.availability}
                    >
                      <MenuItem value="AVAILABLE">Available</MenuItem>
                      <MenuItem value="SOLD">Sold</MenuItem>
                      <MenuItem value="RESERVED">Reserved</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      select
                      label="Listing Status"
                      {...register('status')}
                      error={!!errors.status}
                    >
                      <MenuItem value="DRAFT">Draft</MenuItem>
                      <MenuItem value="PUBLISHED">Published</MenuItem>
                      <MenuItem value="ARCHIVED">Archived</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={<Checkbox {...register('featured')} checked={watch('featured')} />}
                      label="Feature this painting on Home Page"
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>Artwork Images</Typography>

                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                      <TextField
                        fullWidth
                        label="Primary Image URL"
                        {...register('image_url')}
                        error={!!errors.image_url}
                      />
                      <Button variant="outlined" onClick={() => openMediaLibrary('image_url')} sx={{ minWidth: 48, p: 0 }}>
                        <ImageOutlined />
                      </Button>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                      <TextField
                        fullWidth
                        label="Thumbnail Image URL"
                        {...register('thumbnail_url')}
                        error={!!errors.thumbnail_url}
                      />
                      <Button variant="outlined" onClick={() => openMediaLibrary('thumbnail_url')} sx={{ minWidth: 48, p: 0 }}>
                        <ImageOutlined />
                      </Button>
                    </Box>

                    {/* Additional Images Section */}
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', display: 'block', mb: 1 }}>
                        Additional Images (Multi-Image Display)
                      </Typography>

                      {additionalUrls.map((url, index) => (
                        <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
                          <Typography
                            variant="caption"
                            sx={{
                              flexGrow: 1,
                              p: 1,
                              border: '1px solid #EBE6DF',
                              backgroundColor: '#FAF8F5',
                              textOverflow: 'ellipsis',
                              overflow: 'hidden',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {url}
                          </Typography>
                          <Button size="small" color="error" onClick={() => handleRemoveAdditionalUrl(index)}>
                            Remove
                          </Button>
                        </Box>
                      ))}

                      <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                        <TextField
                          fullWidth
                          label="Add Image URL"
                          size="small"
                          value={newAdditionalUrl}
                          onChange={(e) => setNewAdditionalUrl(e.target.value)}
                        />
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => {
                            handleAddAdditionalUrl(newAdditionalUrl);
                            setNewAdditionalUrl('');
                          }}
                        >
                          Add
                        </Button>
                        <Button variant="outlined" size="small" onClick={() => openMediaLibrary('additional')}>
                          Browse
                        </Button>
                      </Box>
                    </Box>
                  </Grid>

                  <Grid item xs={12}>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>SEO Settings</Typography>
                    <TextField
                      fullWidth
                      label="SEO Meta Title"
                      {...register('seo_title')}
                      error={!!errors.seo_title}
                      helperText={errors.seo_title?.message}
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      fullWidth
                      label="SEO Meta Description"
                      multiline
                      rows={3}
                      {...register('seo_description')}
                      error={!!errors.seo_description}
                      helperText={errors.seo_description?.message}
                    />
                  </Grid>
                </Grid>
              </Grid>

              {/* Submit Buttons */}
              <Grid item xs={12}>
                <Divider sx={{ my: 3 }} />
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                  <Button variant="outlined" component={RouterLink} to="/admin/paintings">
                    Cancel
                  </Button>
                  <Button type="submit" variant="contained" disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : 'Save Painting'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Box>
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
