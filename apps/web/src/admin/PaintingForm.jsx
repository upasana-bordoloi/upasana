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
  DialogActions,
  Paper,
  IconButton,
  Divider,
  CircularProgress,
  Snackbar,
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
  
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [formDataToSubmit, setFormDataToSubmit] = useState(null);
  const [successOpen, setSuccessOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const isEdit = !!id;

  // Retrieve current paintings to find the edit subject
  const { data: paintingsRes } = useQuery({
    queryKey: ['adminPaintingsList'],
    queryFn: () => fetch('/api/paintings?limit=1000').then((res) => res.json()),
    enabled: isEdit,
  });

  const editingPainting = paintingsRes?.data?.find((p) => p.id === id);
  
  // Retrieve available categories
  const { data: categoriesRes } = useQuery({
    queryKey: ['adminCategoriesList'],
    queryFn: () => fetch('/api/paintings/categories').then((res) => res.json()),
  });

  // Retrieve available collections
  const { data: collectionsRes } = useQuery({
    queryKey: ['adminCollectionsList'],
    queryFn: () => fetch('/api/paintings/collections').then((res) => res.json()),
  });

  const categoriesList = categoriesRes?.data || [];
  const collectionsList = collectionsRes?.data || [];

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
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
      category_id: '',
      collection_id: '',
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

      const firstCatSlug = editingPainting.categories ? editingPainting.categories.split(',')[0] : '';
      const firstCollSlug = editingPainting.collections ? editingPainting.collections.split(',')[0] : '';

      const categoryObj = categoriesList.find(c => c.slug === firstCatSlug);
      const collectionObj = collectionsList.find(c => c.slug === firstCollSlug);

      reset({
        ...editingPainting,
        category_id: categoryObj ? categoryObj.id : '',
        collection_id: collectionObj ? collectionObj.id : '',
        featured: editingPainting.featured === 1 || editingPainting.featured === true,
        price: parseFloat(editingPainting.price),
        width: parseFloat(editingPainting.width),
        height: parseFloat(editingPainting.height),
        year_created: parseInt(editingPainting.year_created, 10),
      });
    }
  }, [isEdit, editingPainting, categoriesRes, collectionsRes, reset]);

  if (isEdit && !editingPainting) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 2 }}>
        <CircularProgress size={50} color="primary" />
        <Typography variant="body1" color="text.secondary">
          Loading artwork details...
        </Typography>
      </Box>
    );
  }

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
      setConfirmOpen(false);
      setSuccessMsg(isEdit ? 'Painting details updated successfully!' : 'New painting registered successfully!');
      setSuccessOpen(true);
      setTimeout(() => {
        navigate('/admin/paintings');
      }, 1500);
    },
    onError: (err) => {
      setErrorMsg(err.message || 'Operation failed. Please review values.');
      setConfirmOpen(false);
    },
  });

  const onSubmit = (data) => {
    setErrorMsg('');
    const payload = {
      ...data,
      additional_images: JSON.stringify(additionalUrls),
    };
    setFormDataToSubmit(payload);
    setConfirmOpen(true);
  };

  const handleConfirmSubmit = () => {
    if (formDataToSubmit) {
      mutation.mutate(formDataToSubmit);
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <IconButton component={RouterLink} to="/admin/paintings" disabled={mutation.isPending}>
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
        <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
          <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <Grid container spacing={4}>
              {/* Left Column - Details */}
              <Grid item xs={12} md={8}>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Painting Title"
                      {...register('title')}
                      error={!!errors.title}
                      helperText={errors.title?.message || "The title of the artwork (e.g. Whispers of Autumn). Required."}
                      disabled={mutation.isPending}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="URL Slug"
                      {...register('slug')}
                      error={!!errors.slug}
                      helperText={errors.slug?.message || "URL-friendly string. Auto-generated from title, must contain only lowercase letters, numbers, and dashes. Required."}
                      disabled={mutation.isPending}
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
                      helperText={errors.story?.message || "Explain the concept, emotions, or creative inspiration behind this artwork. (Max 2000 characters)"}
                      disabled={mutation.isPending}
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
                      helperText={errors.description?.message || "Include physical specifications, canvas textures, framing details, or storage instructions. Required."}
                      disabled={mutation.isPending}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Price (INR)"
                      type="number"
                      {...register('price', { valueAsNumber: true })}
                      error={!!errors.price}
                      helperText={errors.price?.message || "Listing price in Indian Rupees (₹). Must be positive. Required."}
                      disabled={mutation.isPending}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Medium"
                      placeholder="e.g. Oil on Canvas"
                      {...register('medium')}
                      error={!!errors.medium}
                      helperText={errors.medium?.message || "Materials/techniques used (e.g., Oil on Linen, Watercolor). Required."}
                      disabled={mutation.isPending}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Year Created"
                      type="number"
                      {...register('year_created', { valueAsNumber: true })}
                      error={!!errors.year_created}
                      helperText={errors.year_created?.message || "The year this artwork was completed (e.g., 2026). Required."}
                      disabled={mutation.isPending}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Width (Inches)"
                      type="number"
                      {...register('width', { valueAsNumber: true })}
                      error={!!errors.width}
                      helperText={errors.width?.message || "Width of the canvas in inches. Required."}
                      disabled={mutation.isPending}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Height (Inches)"
                      type="number"
                      {...register('height', { valueAsNumber: true })}
                      error={!!errors.height}
                      helperText={errors.height?.message || "Height of the canvas in inches. Required."}
                      disabled={mutation.isPending}
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
                      disabled={mutation.isPending}
                      helperText="Specify if the artwork is for sale, sold, or reserved."
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
                      disabled={mutation.isPending}
                      helperText="DRAFT is invisible to public. PUBLISHED is live."
                    >
                      <MenuItem value="DRAFT">Draft</MenuItem>
                      <MenuItem value="PUBLISHED">Published</MenuItem>
                      <MenuItem value="ARCHIVED">Archived</MenuItem>
                    </TextField>
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      select
                      label="Painting Category"
                      {...register('category_id')}
                      error={!!errors.category_id}
                      disabled={mutation.isPending}
                      helperText="Group the painting under a technical medium category."
                    >
                      <MenuItem value="">None / Uncategorized</MenuItem>
                      {categoriesList.map((cat) => (
                        <MenuItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      select
                      label="Curated Collection"
                      {...register('collection_id')}
                      error={!!errors.collection_id}
                      disabled={mutation.isPending}
                      helperText="Associate this painting with a themed series."
                    >
                      <MenuItem value="">None / Independent Art</MenuItem>
                      {collectionsList.map((coll) => (
                        <MenuItem key={coll.id} value={coll.id}>
                          {coll.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={<Checkbox {...register('featured')} checked={watch('featured')} disabled={mutation.isPending} />}
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
                        helperText="Full resolution URL. (Recommended)"
                        disabled={mutation.isPending}
                      />
                      <Button variant="outlined" onClick={() => openMediaLibrary('image_url')} sx={{ minWidth: 48, p: 0, height: 56 }} disabled={mutation.isPending}>
                        <ImageOutlined />
                      </Button>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                      <TextField
                        fullWidth
                        label="Thumbnail Image URL"
                        {...register('thumbnail_url')}
                        error={!!errors.thumbnail_url}
                        helperText="Compressed/small preview URL."
                        disabled={mutation.isPending}
                      />
                      <Button variant="outlined" onClick={() => openMediaLibrary('thumbnail_url')} sx={{ minWidth: 48, p: 0, height: 56 }} disabled={mutation.isPending}>
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
                          <Button size="small" color="error" onClick={() => handleRemoveAdditionalUrl(index)} disabled={mutation.isPending}>
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
                          disabled={mutation.isPending}
                        />
                        <Button
                          variant="outlined"
                          size="small"
                          disabled={mutation.isPending}
                          onClick={() => {
                            handleAddAdditionalUrl(newAdditionalUrl);
                            setNewAdditionalUrl('');
                          }}
                        >
                          Add
                        </Button>
                        <Button variant="outlined" size="small" onClick={() => openMediaLibrary('additional')} disabled={mutation.isPending}>
                          Browse
                        </Button>
                      </Box>
                    </Box>
                  </Grid>

                  <Grid item xs={12}>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>SEO Settings (Search Engines)</Typography>
                    <TextField
                      fullWidth
                      label="SEO Meta Title"
                      {...register('seo_title')}
                      error={!!errors.seo_title}
                      helperText={errors.seo_title?.message || "Optional. Custom browser tab title. Max 70 characters."}
                      disabled={mutation.isPending}
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      fullWidth
                      label="SEO Meta Description"
                      multiline
                      rows={3}
                      {...register('seo_description')}
                      error={!!errors.seo_description}
                      helperText={errors.seo_description?.message || "Optional. Snippet summarizing content in search results. Max 160 characters."}
                      disabled={mutation.isPending}
                    />
                  </Grid>
                </Grid>
              </Grid>

              {/* Submit Buttons */}
              <Grid item xs={12}>
                <Divider sx={{ my: 3 }} />
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                  <Button variant="outlined" component={RouterLink} to="/admin/paintings" disabled={mutation.isPending}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="contained" disabled={mutation.isPending}>
                    {mutation.isPending ? 'Processing...' : isEdit ? 'Save Changes' : 'Register Painting'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 600 }}>
          {isEdit ? 'Confirm Update' : 'Confirm Registration'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
            {isEdit
              ? 'Are you sure you want to save the updated details for this painting listing?'
              : 'Are you sure you want to register and add this new painting artwork to the gallery?'}
          </Typography>
          {formDataToSubmit && (
            <Box sx={{ p: 2, backgroundColor: '#FAF8F5', border: '1px solid #EBE6DF', borderRadius: 0 }}>
              <Typography variant="subtitle2" fontWeight="600">
                Title: {formDataToSubmit.title}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                Medium: {formDataToSubmit.medium} | Dimensions: {formDataToSubmit.width} x {formDataToSubmit.height} in
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                Price: ₹ {formDataToSubmit.price} | Status: {formDataToSubmit.status} | Availability: {formDataToSubmit.availability}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setConfirmOpen(false)} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmSubmit}
            variant="contained"
            disabled={mutation.isPending}
            startIcon={mutation.isPending ? <CircularProgress size={18} color="inherit" /> : null}
          >
            {mutation.isPending ? 'Saving...' : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Snackbar Toast */}
      <Snackbar
        open={successOpen}
        autoHideDuration={1500}
        onClose={() => setSuccessOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity="success" sx={{ width: '100%', borderRadius: 0 }}>
          {successMsg}
        </Alert>
      </Snackbar>

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
