import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { categorySchema } from 'schemas';
import { slugify } from 'utils';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Alert,
  CircularProgress,
  TablePagination,
  Grid,
  Divider,
} from '@mui/material';
import { DeleteOutlineOutlined, EditOutlined, ImageOutlined, CloseOutlined } from '@mui/icons-material';
import { useToastStore } from '../store/store.js';

export default function CategoriesManager() {
  const queryClient = useQueryClient();
  const { showToast } = useToastStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Category images state (JSON array of URLs)
  const [categoryImages, setCategoryImages] = useState([]);
  const [newImageUrl, setNewImageUrl] = useState('');

  // Media picker states
  const [mediaTarget, setMediaTarget] = useState(null); // 'category_image'
  const [mediaList, setMediaList] = useState([]);

  // Pagination states
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Fetch categories
  const { data: categoriesRes, isLoading } = useQuery({
    queryKey: ['adminCategoriesList'],
    queryFn: () => fetch('/api/paintings/categories').then((res) => res.json()),
  });
  const categories = categoriesRes?.data || [];
  const paginatedCategories = categories.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: '', slug: '', description: '', images: '[]' },
  });

  const watchName = watch('name');

  // Slug generation when name changes (only for new categories)
  useEffect(() => {
    if (!editingCategory && watchName) {
      setValue('slug', slugify(watchName));
    }
  }, [watchName, editingCategory, setValue]);

  // Open dialog for creating new category
  const handleOpenCreate = () => {
    setEditingCategory(null);
    setErrorMsg('');
    setCategoryImages([]);
    setNewImageUrl('');
    reset({ name: '', slug: '', description: '', images: '[]' });
    setDialogOpen(true);
  };

  // Open dialog for editing category
  const handleOpenEdit = (category) => {
    setEditingCategory(category);
    setErrorMsg('');
    
    let parsedImages = [];
    try {
      parsedImages = JSON.parse(category.images || '[]');
    } catch (e) {
      parsedImages = [];
    }
    setCategoryImages(parsedImages);
    setNewImageUrl('');

    reset({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      images: category.images || '[]',
    });
    setDialogOpen(true);
  };

  // Create or Update Mutation
  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const isEdit = !!editingCategory;
      const url = isEdit ? `/api/paintings/categories/${editingCategory.id}` : '/api/paintings/categories';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || 'Failed to save category');
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['adminCategoriesList']);
      setDialogOpen(false);
      showToast(
        editingCategory ? 'Category updated successfully!' : 'Category created successfully!',
        'success'
      );
    },
    onError: (err) => {
      setErrorMsg(err.message || 'Operation failed');
      showToast(err.message || 'Failed to save category.', 'error');
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const res = await fetch(`/api/paintings/categories/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to delete category');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['adminCategoriesList']);
      showToast('Category deleted successfully.', 'success');
    },
    onError: (err) => {
      showToast(err.message || 'Failed to delete category.', 'error');
    },
  });

  const handleSaveSubmit = (data) => {
    setErrorMsg('');
    const payload = {
      ...data,
      images: JSON.stringify(categoryImages),
    };
    saveMutation.mutate(payload);
  };

  const handleDelete = (id, name) => {
    if (confirm(`Remove category "${name}"? This will unlink but NOT delete paintings in it.`)) {
      deleteMutation.mutate(id);
    }
  };

  // Image helpers
  const handleAddImage = (url) => {
    if (url && !categoryImages.includes(url)) {
      setCategoryImages([...categoryImages, url]);
      setNewImageUrl('');
    }
  };

  const handleRemoveImage = (index) => {
    setCategoryImages(categoryImages.filter((_, i) => i !== index));
  };

  // Media selector helper
  const openMediaLibrary = () => {
    setMediaTarget('category_image');
    fetch('/api/media')
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setMediaList(json.data);
      })
      .catch(console.error);
  };

  const handleSelectMedia = (url) => {
    handleAddImage(url);
    setMediaTarget(null);
  };

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 600 }}>
          Manage Categories
        </Typography>
        <Button variant="contained" onClick={handleOpenCreate}>
          Create Category
        </Button>
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: 0, border: '1px solid #EBE6DF', boxShadow: 'none' }}>
        <Table>
          <TableHead sx={{ backgroundColor: '#FAF8F5' }}>
            <TableRow>
              <TableCell sx={{ width: '220px' }}>Preview Images</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Slug</TableCell>
              <TableCell>Description (with Emails)</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                  <CircularProgress size={40} color="secondary" />
                </TableCell>
              </TableRow>
            ) : paginatedCategories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                  No categories created yet.
                </TableCell>
              </TableRow>
            ) : (
              paginatedCategories.map((cat) => {
                let parsedImages = [];
                try {
                  parsedImages = JSON.parse(cat.images || '[]');
                } catch (e) {
                  parsedImages = [];
                }
                return (
                  <TableRow key={cat.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {parsedImages.length === 0 ? (
                          <Box
                            sx={{
                              width: '60px',
                              height: '45px',
                              backgroundColor: '#FAF8F5',
                              border: '1px dashed #EBE6DF',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'text.secondary',
                              fontSize: '0.6rem',
                            }}
                          >
                            No Image
                          </Box>
                        ) : (
                          parsedImages.slice(0, 3).map((img, idx) => (
                            <img
                              key={idx}
                              src={img}
                              alt={cat.name}
                              style={{ width: '60px', height: '45px', objectFit: 'cover', border: '1px solid #EBE6DF' }}
                            />
                          ))
                        )}
                        {parsedImages.length > 3 && (
                          <Typography variant="caption" sx={{ alignSelf: 'center', ml: 0.5 }}>
                            +{parsedImages.length - 3}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{cat.name}</TableCell>
                    <TableCell><code>{cat.slug}</code></TableCell>
                    <TableCell sx={{ maxWidth: '300px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {cat.description || '-'}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton onClick={() => handleOpenEdit(cat)} color="primary" sx={{ mr: 1 }} title="Edit">
                        <EditOutlined />
                      </IconButton>
                      <IconButton onClick={() => handleDelete(cat.id, cat.name)} color="error" title="Delete">
                        <DeleteOutlineOutlined />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={categories.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={(e, newPage) => setPage(newPage)}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
        sx={{ borderTop: '1px solid #EBE6DF', mt: 1 }}
      />

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingCategory ? 'Edit Category' : 'Create Medium Category'}</DialogTitle>
        <Box component="form" onSubmit={handleSubmit(saveSubmit)}>
          <DialogContent>
            {errorMsg && <Alert severity="error" sx={{ mb: 2, borderRadius: 0 }}>{errorMsg}</Alert>}

            <TextField
              fullWidth
              margin="normal"
              label="Category Name"
              {...register('name')}
              error={!!errors.name}
              helperText={errors.name?.message}
            />

            <TextField
              fullWidth
              margin="normal"
              label="URL Slug"
              {...register('slug')}
              error={!!errors.slug}
              helperText={errors.slug?.message || "URL-friendly string. Auto-generated from name."}
            />

            <TextField
              fullWidth
              margin="normal"
              label="Description (Can contain contact email)"
              multiline
              rows={3}
              {...register('description')}
              error={!!errors.description}
              helperText={errors.description?.message || "e.g. Email us at landscapes@upasana-art.com for print enquiries."}
            />

            <Divider sx={{ my: 3 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              Category Images (Multiple for Homepage Gallery Swapping)
            </Typography>

            {categoryImages.map((url, idx) => (
              <Box key={idx} sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
                <img src={url} alt="Preview" style={{ width: '50px', height: '40px', objectFit: 'cover', border: '1px solid #EBE6DF' }} />
                <Typography
                  variant="caption"
                  sx={{
                    flexGrow: 1,
                    p: 1,
                    border: '1px solid #EBE6DF',
                    backgroundColor: '#FAF8F5',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {url}
                </Typography>
                <Button size="small" color="error" onClick={() => handleRemoveImage(idx)}>
                  Remove
                </Button>
              </Box>
            ))}

            <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
              <TextField
                fullWidth
                label="Add Category Image URL"
                size="small"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
              />
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  handleAddImage(newImageUrl);
                }}
              >
                Add
              </Button>
              <Button variant="outlined" size="small" onClick={openMediaLibrary}>
                Browse
              </Button>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Saving...' : 'Save Category'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Media Selection Dialog Modal */}
      <Dialog open={!!mediaTarget} onClose={() => setMediaTarget(null)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Select Image from Library</span>
          <IconButton onClick={() => setMediaTarget(null)}><CloseOutlined /></IconButton>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {mediaList.length === 0 ? (
              <Box sx={{ p: 4, width: '100%', textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  No images in media library. Upload images in the Media Library tab first.
                </Typography>
              </Box>
            ) : (
              mediaList.map((m) => (
                <Box
                  key={m.id}
                  sx={{
                    width: '120px',
                    m: 1,
                    cursor: 'pointer',
                    border: '1px solid #EBE6DF',
                    '&:hover': { borderColor: 'secondary.main' },
                  }}
                  onClick={() => handleSelectMedia(m.url)}
                >
                  <img
                    src={m.url}
                    alt={m.filename}
                    style={{ width: '100%', height: '90px', objectFit: 'cover' }}
                  />
                  <Typography
                    variant="caption"
                    sx={{
                      p: 0.5,
                      display: 'block',
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                      textAlign: 'center',
                    }}
                  >
                    {m.filename}
                  </Typography>
                </Box>
              ))
            )}
          </Grid>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
