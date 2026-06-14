import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { userSchema } from 'schemas';
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
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Alert,
  Switch,
  TablePagination,
} from '@mui/material';
import { DeleteOutlineOutlined } from '@mui/icons-material';

export default function UsersList() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Fetch users
  const { data: usersRes, isLoading } = useQuery({
    queryKey: ['adminUsersList'],
    queryFn: () => fetch('/api/users').then(res => res.json())
  });
  const users = usersRes?.data || [];
  const paginatedUsers = users.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(userSchema),
    defaultValues: { email: '', name: '', role: 'EDITOR', password: '', is_active: true }
  });

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: async (data) => {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || 'Failed to create administrator');
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['adminUsersList']);
      setCreateOpen(false);
      reset();
    },
    onError: (err) => {
      setErrorMsg(err.message || 'Operation failed');
    }
  });

  // Toggle Toggle Activation status
  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }) => {
      const res = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active })
      });
      if (!res.ok) throw new Error('Toggle failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['adminUsersList']);
    }
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete user');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['adminUsersList']);
    }
  });

  const handleToggleActive = (userItem) => {
    toggleMutation.mutate({ id: userItem.id, is_active: !userItem.is_active });
  };

  const handleDelete = (id, name) => {
    if (confirm(`Remove administrator account for "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleCreateSubmit = (data) => {
    setErrorMsg('');
    createMutation.mutate(data);
  };

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 600 }}>
          User Accounts & Access (RBAC)
        </Typography>
        <Button variant="contained" onClick={() => setCreateOpen(true)}>
          Create Admin User
        </Button>
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: 0, border: '1px solid #EBE6DF', boxShadow: 'none' }}>
        <Table>
          <TableHead sx={{ backgroundColor: '#FAF8F5' }}>
            <TableRow>
              <TableCell>Full Name</TableCell>
              <TableCell>Email Address</TableCell>
              <TableCell>Assigned Role</TableCell>
              <TableCell>Registration Date</TableCell>
              <TableCell>Active Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                  Loading staff registry...
                </TableCell>
              </TableRow>
            ) : (
              paginatedUsers.map((u) => (
                <TableRow key={u.id}>
                  <TableCell sx={{ fontWeight: 600 }}>{u.name}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>
                    <Chip
                      label={u.role}
                      size="small"
                      sx={{ borderRadius: 0 }}
                      color={u.role === 'SUPER_ADMIN' ? 'secondary' : 'default'}
                    />
                  </TableCell>
                  <TableCell>{new Date(u.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Switch
                      checked={u.is_active === 1 || u.is_active === true}
                      onChange={() => handleToggleActive(u)}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton onClick={() => handleDelete(u.id, u.name)} color="error" title="Delete">
                      <DeleteOutlineOutlined />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={[5, 10, 25, 50]}
        component="div"
        count={users.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        sx={{ borderTop: '1px solid #EBE6DF', mt: 1 }}
      />

      {/* Create User Dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Create Administrator Account</DialogTitle>
        <Box component="form" onSubmit={handleSubmit(handleCreateSubmit)}>
          <DialogContent>
            {errorMsg && <Alert severity="error" sx={{ mb: 2, borderRadius: 0 }}>{errorMsg}</Alert>}
            
            <TextField
              fullWidth
              margin="normal"
              label="Full Name"
              {...register('name')}
              error={!!errors.name}
              helperText={errors.name?.message}
            />

            <TextField
              fullWidth
              margin="normal"
              label="Email Address"
              type="email"
              {...register('email')}
              error={!!errors.email}
              helperText={errors.email?.message}
            />

            <TextField
              fullWidth
              margin="normal"
              label="Secure Password"
              type="password"
              {...register('password')}
              error={!!errors.password}
              helperText={errors.password?.message}
            />

            <TextField
              fullWidth
              margin="normal"
              select
              label="RBAC Role"
              {...register('role')}
              error={!!errors.role}
            >
              <MenuItem value="SUPER_ADMIN">SUPER_ADMIN</MenuItem>
              <MenuItem value="ADMIN">ADMIN</MenuItem>
              <MenuItem value="EDITOR">EDITOR</MenuItem>
            </TextField>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={createMutation.isPending}>
              Create User
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
}
