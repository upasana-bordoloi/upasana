import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
import {
  DeleteOutlineOutlined,
  ContentCopyOutlined,
  CloudUploadOutlined,
} from '@mui/icons-material';

export default function MediaLibrary() {
  const queryClient = useQueryClient();
  const [folder, setFolder] = useState('paintings');
  const [uploadFile, setUploadFile] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

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
      setSuccessMsg('Image uploaded successfully to Cloudflare R2.');
      // Reset input element
      const fileInput = document.getElementById('media-upload-input');
      if (fileInput) fileInput.value = '';
    },
    onError: (err) => {
      setErrorMsg(err.message || 'File upload failed');
    }
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const res = await fetch(`/api/media/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Deletion failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['adminMedia']);
      setSuccessMsg('Media deleted successfully.');
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

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this image from storage?')) {
      deleteMutation.mutate(id);
    }
  };

  const copyToClipboard = (url) => {
    navigator.clipboard.writeText(url);
    setSuccessMsg('Image URL copied to clipboard.');
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 600, mb: 4 }}>
        Media Library (R2 Storage)
      </Typography>

      <Grid container spacing={4}>
        {/* Left column: Upload form */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ border: '1px solid #EBE6DF', borderRadius: 0, p: 3, boxShadow: 'none' }}>
            <Typography variant="h6" sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 600, mb: 3 }}>
              Upload Asset
            </Typography>
            {errorMsg && <Alert severity="error" sx={{ mb: 2, borderRadius: 0 }}>{errorMsg}</Alert>}
            
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
                  sx={{ py: 2 }}
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
              >
                {uploadMutation.isPending ? 'Uploading...' : 'Upload to R2'}
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Right column: Image grids list */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ border: '1px solid #EBE6DF', borderRadius: 0, p: 3, boxShadow: 'none' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 600 }}>
                Files in Folder: <span style={{ color: '#A67C52', textTransform: 'capitalize' }}>{folder}</span>
              </Typography>
            </Box>

            {isLoading ? (
              <Typography variant="body2" color="text.secondary">Loading assets...</Typography>
            ) : media.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No images uploaded in this folder yet.
              </Typography>
            ) : (
              <Grid container spacing={2}>
                {media.map((item) => (
                  <Grid item xs={12} sm={6} md={4} key={item.id}>
                    <Card sx={{ border: '1px solid #EBE6DF', boxShadow: 'none', borderRadius: 0 }}>
                      <CardMedia
                        component="img"
                        height="160"
                        image={item.url}
                        alt={item.filename}
                        sx={{ objectFit: 'cover' }}
                      />
                      <CardContent sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '70%' }}>
                          <Typography variant="caption" fontWeight="600" display="block">
                            {item.filename}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {(item.size_bytes / 1024).toFixed(1)} KB
                          </Typography>
                        </Box>
                        <Box>
                          <IconButton size="small" onClick={() => copyToClipboard(item.url)} title="Copy URL">
                            <ContentCopyOutlined fontSize="small" />
                          </IconButton>
                          <IconButton size="small" onClick={() => handleDelete(item.id)} color="error" title="Delete">
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

      {/* Notifications */}
      <Snackbar
        open={!!successMsg}
        autoHideDuration={4000}
        onClose={() => setSuccessMsg('')}
        message={successMsg}
      />
    </Box>
  );
}
