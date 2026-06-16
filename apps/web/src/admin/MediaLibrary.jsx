import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Button,
  IconButton,
  TextField,
  MenuItem,
  Divider,
  Paper,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Skeleton,
} from '@mui/material';
import {
  DeleteOutlineOutlined,
  ContentCopyOutlined,
  CloudUploadOutlined,
} from '@mui/icons-material';
import { useToastStore } from '../store/store.js';

export default function MediaLibrary() {
  const queryClient = useQueryClient();
  const { showToast } = useToastStore();
  const [folder, setFolder] = useState('paintings');
  const [uploadFile, setUploadFile] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [deleteId, setDeleteId] = useState(null);

  // Fetch media records
  const { data: mediaRes, isLoading } = useQuery({
    queryKey: ['adminMedia', folder],
    queryFn: () => fetch(`/api/media?folder=${folder}`).then(res => res.json())
  });
  const media = mediaRes?.data || [];

  // Upload Mutation
  const uploadMutation = useMutation({
    mutationFn: async ({ file, folderName }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folderName);
      
      const res = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData, // No Content-Type header so browser sets boundaries
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || 'Upload failed');
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['adminMedia']);
      setUploadFile(null);
      showToast('Image uploaded successfully.', 'success');
      // Reset input element
      const fileInput = document.getElementById('media-upload-input');
      if (fileInput) fileInput.value = '';
    },
    onError: (err) => {
      setErrorMsg(err.message || 'File upload failed');
      showToast(err.message || 'File upload failed.', 'error');
    }
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const res = await fetch(`/api/media/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Deletion failed');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['adminMedia']);
      showToast('Media deleted successfully.', 'success');
      setDeleteId(null);
    },
    onError: (err) => {
      setErrorMsg(err.message || 'Deletion failed');
      showToast(err.message || 'Deletion failed.', 'error');
      setDeleteId(null);
    }
  });

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setUploadFile(e.target.files[0]);
    }
  };

  const handleUploadSubmit = (e) => {
    e.preventDefault();
    if (!uploadFile) return;
    setErrorMsg('');
    uploadMutation.mutate({ file: uploadFile, folderName: folder });
  };

  const handleDeleteConfirm = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId);
    }
  };

  const copyToClipboard = (url) => {
    navigator.clipboard.writeText(url);
    showToast('Image URL copied to clipboard.', 'success');
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 600, mb: 4 }}>
        Media Library & Asset Uploads
      </Typography>

      <Grid container spacing={4}>
        {/* Left column: Upload form */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ border: '1px solid #EBE6DF', borderRadius: 0, p: 3, boxShadow: 'none' }}>
            <Typography variant="h6" sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 600, mb: 3 }}>
              Upload Asset
            </Typography>
            
            <Box component="form" onSubmit={handleUploadSubmit}>
              <Box sx={{ mb: 3 }}>
                <TextField
                  fullWidth
                  select
                  label="Target Folder"
                  value={folder}
                  onChange={(e) => setFolder(e.target.value)}
                >
                  <MenuItem value="paintings">Paintings</MenuItem>
                  <MenuItem value="thumbnails">Thumbnails</MenuItem>
                  <MenuItem value="collections">Collections</MenuItem>
                  <MenuItem value="hero">Hero Backgrounds</MenuItem>
                </TextField>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Button
                  variant="outlined"
                  component="label"
                  fullWidth
                  startIcon={<CloudUploadOutlined />}
                  sx={{ py: 2, textTransform: 'none', borderStyle: 'dashed', borderWidth: '2px', borderColor: '#C8C4BE', '&:hover': { borderWidth: '2px', borderColor: '#A67C52' } }}
                  disabled={uploadMutation.isPending}
                >
                  {uploadFile ? uploadFile.name : 'Choose File'}
                  <input
                    id="media-upload-input"
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={handleFileChange}
                  />
                </Button>
              </Box>

              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={!uploadFile || uploadMutation.isPending}
                startIcon={uploadMutation.isPending ? <CircularProgress size={20} color="inherit" /> : null}
                sx={{ py: 1.25 }}
              >
                {uploadMutation.isPending ? 'Uploading...' : 'Upload to Storage'}
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Right column: Image grids list */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ border: '1px solid #EBE6DF', borderRadius: 0, p: 3, boxShadow: 'none', minHeight: '350px' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
              <Typography variant="h6" sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 600 }}>
                Files in Folder: <span style={{ color: '#A67C52', textTransform: 'capitalize' }}>{folder}</span>
              </Typography>
            </Box>

            {isLoading ? (
              <Grid container spacing={2}>
                {[1, 2, 3, 4, 5, 6].map((idx) => (
                  <Grid item xs={12} sm={6} md={4} key={idx}>
                    <Card sx={{ border: '1px solid #EBE6DF', boxShadow: 'none', borderRadius: 0 }}>
                      <Skeleton variant="rectangular" height={140} />
                      <CardContent sx={{ p: 2 }}>
                        <Skeleton variant="text" width="80%" height={15} />
                        <Skeleton variant="text" width="40%" height={12} sx={{ mt: 1 }} />
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : media.length === 0 ? (
              <Box sx={{ py: 8, textAlign: 'center', color: 'text.secondary' }}>
                <Typography variant="body2">
                  No images uploaded in this folder yet.
                </Typography>
              </Box>
            ) : (
              <Grid container spacing={2}>
                {media.map((item) => (
                  <Grid item xs={12} sm={6} md={4} key={item.id}>
                    <Card sx={{ border: '1px solid #EBE6DF', boxShadow: 'none', borderRadius: 0, overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}>
                      <CardMedia
                        component="img"
                        height="150"
                        image={item.url}
                        alt={item.filename}
                        sx={{ objectFit: 'cover', transition: 'transform 0.3s ease', '&:hover': { transform: 'scale(1.05)' } }}
                      />
                      <CardContent sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 'auto' }}>
                        <Box sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '70%' }}>
                          <Typography variant="caption" fontWeight="600" display="block" sx={{ textOverflow: 'ellipsis', overflow: 'hidden' }}>
                            {item.filename}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {(item.size_bytes / 1024).toFixed(1)} KB
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <IconButton size="small" onClick={() => copyToClipboard(item.url)} title="Copy URL">
                            <ContentCopyOutlined fontSize="small" />
                          </IconButton>
                          <IconButton size="small" onClick={() => setDeleteId(item.id)} color="error" title="Delete" disabled={deleteMutation.isPending}>
                            <DeleteOutlineOutlined fontSize="small" />
                          </IconButton>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Delete Confirmation Dialog Modal */}
      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)}>
        <DialogTitle sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 600 }}>Confirm Deletion</DialogTitle>
        <DialogContent>Are you sure you want to permanently delete this image from your media library storage?</DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained" disabled={deleteMutation.isPending}>
            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}
