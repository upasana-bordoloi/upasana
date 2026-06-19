import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { collectionSchema } from 'schemas';
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
} from '@mui/material';
import { DeleteOutlineOutlined, EditOutlined, ImageOutlined, CloseOutlined } from '@mui/icons-material';
import { useToastStore } from '../store/store.js';

export default function CollectionsManager() {
  const queryClient = useQueryClient();
  const { showToast } = useToastStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  
  // Media picker states
  const [mediaTarget, setMediaTarget] = useState(null); // 'image_url'
  const [mediaList, setMediaList] = useState([]);

  // Pagination states
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Fetch collections
  const { data: collectionsRes, isLoading } = useQuery({
    queryKey: ['adminCollectionsList'],
    queryFn: () => fetch('/api/paintings/collections').then((res) => res.json()),
  });
  const collections = collectionsRes?.data || [];
  const paginatedCollections = collections.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(collectionSchema),
    defaultValues: { name: '', slug: '', description: '', image_url: '' },
  });

  const watchName = watch('name');

  // Slug generation when name changes (only for new collections)
  useEffect(() => {
    if (!editingCollection && watchName) {
      setValue('slug', slugify(watchName));
    }
  }, [watchName, editingCollection, setValue]);

  // Open dialog for creating new collection
  const handleOpenCreate = () => {
    setEditingCollection(null);
    setErrorMsg('');
    reset({ name: '', slug: '', description: '', image_url: '' });
    setDialogOpen(true);
  };

  // Open dialog for editing collection
  const handleOpenEdit = (collection) => {
    setEditingCollection(collection);
    setErrorMsg('');
    reset({
      name: collection.name,
      slug: collection.slug,
      description: collection.description || '',
      image_url: collection.image_url || '',
    });
    setDialogOpen(true);
  };

  // Create or Update Mutation
  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const isEdit = !!editingCollection;
      const url = isEdit ? `/api/paintings/collections/${editingCollection.id}` : '/api/paintings/collections';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || 'Failed to save collection');
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['adminCollectionsList']);
      queryClient.invalidateQueries(['publicCollectionsList']);
      setDialogOpen(false);
      showToast(
        editingCollection ? 'Collection updated successfully!' : 'Collection created successfully!',
        'success'
      );
    },
    onError: (err) => {
      setErrorMsg(err.message || 'Operation failed');
      showToast(err.message || 'Failed to save collection.', 'error');
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      setDeletingId(id);
      const res = await fetch(`/api/paintings/collections/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to delete collection');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['adminCollectionsList']);
      queryClient.invalidateQueries(['publicCollectionsList']);
      showToast('Collection deleted successfully.', 'success');
    },
    onError: (err) => {
      showToast(err.message || 'Failed to delete collection.', 'error');
    },
    onSettled: () => {
      setDeletingId(null);
    }
  });

  const handleSaveSubmit = (data) => {
    setErrorMsg('');
    saveMutation.mutate(data);
  };

  const handleDelete = (id, name) => {
    if (confirm(`Remove collection "${name}"? This will unlink but NOT delete paintings in it.`)) {
      deleteMutation.mutate(id);
    }
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
    setValue('image_url', url);
    setMediaTarget(null);
  };

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 600 }}>
          Manage Collections
        </Typography>
        <Button variant="contained" onClick={handleOpenCreate}>
          Create Collection
        </Button>
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: 0, border: '1px solid #EBE6DF', boxShadow: 'none' }}>
        <Table>
          <TableHead sx={{ backgroundColor: '#FAF8F5' }}>
            <TableRow>
              <TableCell sx={{ width: '150px' }}>Cover Image</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Slug</TableCell>
              <TableCell>Description</TableCell>
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
            ) : paginatedCollections.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                  No collections created yet.
                </TableCell>
              </TableRow>
            ) : (
              paginatedCollections.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    {c.image_url ? (
                      <img
                        src={c.image_url}
                        alt={c.name}
                        style={{ width: '80px', height: '60px', objectFit: 'cover', border: '1px solid #EBE6DF' }}
                      />
                    ) : (
                      <Box
                        sx={{
                          width: '80px',
                          height: '60px',
                          backgroundColor: '#FAF8F5',
                          border: '1px dashed #EBE6DF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'text.secondary',
                          fontSize: '0.7rem',
                        }}
                      >
                        No Cover
                      </Box>
                    )}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{c.name}</TableCell>
                  <TableCell><code>{c.slug}</code></TableCell>
                  <TableCell sx={{ maxWidth: '300px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    {c.description || '-'}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton 
                      onClick={() => handleOpenEdit(c)} 
                      color="primary" 
                      sx={{ mr: 1 }} 
                      title="Edit"
                      disabled={deletingId !== null || saveMutation.isPending}
                    >
                      <EditOutlined />
                    </IconButton>
                    <IconButton 
                      onClick={() => handleDelete(c.id, c.name)} 
                      color="error" 
                      title="Delete"
                      disabled={deletingId !== null || saveMutation.isPending}
                    >
                      {deletingId === c.id ? <CircularProgress size={20} color="inherit" /> : <DeleteOutlineOutlined />}
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={collections.length}
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
      <Dialog open={dialogOpen} onClose={() => !saveMutation.isPending && setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingCollection ? 'Edit Collection' : 'Create Curated Collection'}</DialogTitle>
        <Box component="form" onSubmit={handleSubmit(handleSaveSubmit)}>
          <DialogContent>
            {errorMsg && <Alert severity="error" sx={{ mb: 2, borderRadius: 0 }}>{errorMsg}</Alert>}

            <TextField
              fullWidth
              margin="normal"
              label="Collection Name"
              {...register('name')}
              error={!!errors.name}
              helperText={errors.name?.message}
              disabled={saveMutation.isPending}
            />

            <TextField
              fullWidth
              margin="normal"
              label="URL Slug"
              {...register('slug')}
              error={!!errors.slug}
              helperText={errors.slug?.message || "URL-friendly string. Auto-generated from name."}
              disabled={saveMutation.isPending}
            />

            <TextField
              fullWidth
              margin="normal"
              label="Description"
              multiline
              rows={3}
              {...register('description')}
              error={!!errors.description}
              helperText={errors.description?.message}
              disabled={saveMutation.isPending}
            />

            <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
              <TextField
                fullWidth
                label="Cover Image URL"
                {...register('image_url')}
                error={!!errors.image_url}
                helperText={errors.image_url?.message || "Shown on collections directory. Optional."}
                disabled={saveMutation.isPending}
              />
              <Button
                variant="outlined"
                onClick={() => openMediaLibrary('image_url')}
                sx={{ minWidth: 48, p: 0, height: 56 }}
                disabled={saveMutation.isPending}
              >
                <ImageOutlined />
              </Button>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setDialogOpen(false)} disabled={saveMutation.isPending}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Saving...' : 'Save Collection'}
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
