import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
} from '@mui/material';
import {
  EditOutlined,
  DeleteOutlineOutlined,
  ContentCopyOutlined,
  CloudUploadOutlined,
  CloudDownloadOutlined,
} from '@mui/icons-material';
import { formatPrice } from 'utils';

export default function PaintingsList() {
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importJson, setImportJson] = useState('');
  const [importError, setImportError] = useState('');

  // Fetch paintings list
  const { data: paintingsRes, isLoading } = useQuery({
    queryKey: ['adminPaintingsList'],
    queryFn: () => fetch('/api/paintings?limit=1000').then((res) => res.json()),
  });
  const paintings = paintingsRes?.data || [];

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const res = await fetch(`/api/paintings/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['adminPaintingsList']);
      setDeleteId(null);
    },
  });

  // Duplicate/Copy Mutation
  const duplicateMutation = useMutation({
    mutationFn: async (painting) => {
      const copy = {
        ...painting,
        id: undefined,
        title: `${painting.title} (Copy)`,
        slug: `${painting.slug}-copy-${Math.floor(Math.random() * 1000)}`,
        status: 'DRAFT',
        availability: 'AVAILABLE',
      };
      const res = await fetch('/api/paintings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(copy),
      });
      if (!res.ok) throw new Error('Duplication failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['adminPaintingsList']);
    },
  });

  // Bulk Import Mutation
  const importMutation = useMutation({
    mutationFn: async (list) => {
      const res = await fetch('/api/paintings/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paintings: list }),
      });
      if (!res.ok) throw new Error('Bulk import failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['adminPaintingsList']);
      setImportOpen(false);
      setImportJson('');
      setImportError('');
    },
    onError: (err) => {
      setImportError(err.message || 'JSON parsing or database transaction failed');
    },
  });

  const handleDuplicate = (p) => {
    if (confirm(`Duplicate painting "${p.title}"?`)) {
      duplicateMutation.mutate(p);
    }
  };

  const handleDeleteConfirm = () => {
    deleteMutation.mutate(deleteId);
  };

  const handleExport = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(paintings, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `art_paintings_export_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportSubmit = () => {
    setImportError('');
    try {
      const parsed = JSON.parse(importJson);
      const list = Array.isArray(parsed) ? parsed : [parsed];
      importMutation.mutate(list);
    } catch (e) {
      setImportError('Invalid JSON format. Please check the syntax.');
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 600 }}>
          Manage Paintings
        </Typography>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined" startIcon={<CloudDownloadOutlined />} onClick={handleExport}>
            Export JSON
          </Button>
          <Button variant="outlined" startIcon={<CloudUploadOutlined />} onClick={() => setImportOpen(true)}>
            Import JSON
          </Button>
          <Button variant="contained" component={RouterLink} to="/admin/paintings/new">
            Add Painting
          </Button>
        </Box>
      </Box>

      {/* Main Table */}
      <TableContainer component={Paper} sx={{ borderRadius: 0, border: '1px solid #EBE6DF', boxShadow: 'none' }}>
        <Table>
          <TableHead sx={{ backgroundColor: '#FAF8F5' }}>
            <TableRow>
              <TableCell>Image</TableCell>
              <TableCell>Title</TableCell>
              <TableCell>Medium</TableCell>
              <TableCell>Size (in)</TableCell>
              <TableCell>Price</TableCell>
              <TableCell>Availability</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                  Loading art database...
                </TableCell>
              </TableRow>
            ) : paintings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                  No paintings registered yet. Click "Add Painting" to register your first artwork.
                </TableCell>
              </TableRow>
            ) : (
              paintings.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <img
                      src={p.thumbnail_url || p.image_url}
                      alt={p.title}
                      style={{ width: 60, height: 60, objectFit: 'cover', border: '1px solid #EBE6DF' }}
                    />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{p.title}</TableCell>
                  <TableCell>{p.medium}</TableCell>
                  <TableCell>{p.width} &times; {p.height}</TableCell>
                  <TableCell>{formatPrice(p.price)}</TableCell>
                  <TableCell>
                    <Chip
                      label={p.availability}
                      size="small"
                      sx={{ borderRadius: 0 }}
                      color={p.availability === 'AVAILABLE' ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={p.status}
                      size="small"
                      variant="outlined"
                      sx={{ borderRadius: 0 }}
                      color={p.status === 'PUBLISHED' ? 'primary' : 'default'}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton component={RouterLink} to={`/admin/paintings/edit/${p.id}`} title="Edit">
                      <EditOutlined />
                    </IconButton>
                    <IconButton onClick={() => handleDuplicate(p)} title="Duplicate">
                      <ContentCopyOutlined />
                    </IconButton>
                    <IconButton onClick={() => setDeleteId(p.id)} color="error" title="Delete">
                      <DeleteOutlineOutlined />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>Are you sure you want to permanently delete this artwork listing from the database?</DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Import Dialog */}
      <Dialog open={importOpen} onClose={() => setImportOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Bulk Import Paintings</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
            Paste a JSON array of paintings matching the DB structure (title, medium, price, dimensions, story, description, availability, etc.).
          </Typography>
          {importError && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 0 }}>
              {importError}
            </Alert>
          )}
          <TextField
            fullWidth
            multiline
            rows={12}
            placeholder='[{"title": "Example Art", "medium": "Oil", "price": 1200, "width": 24, "height": 36, "description": "text"}]'
            value={importJson}
            onChange={(e) => setImportJson(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setImportOpen(false)}>Cancel</Button>
          <Button onClick={handleImportSubmit} variant="contained" disabled={!importJson.trim()}>
            Run Import
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
