import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Grid,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  IconButton,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Snackbar,
  Alert,
  Skeleton,
  Badge,
} from '@mui/material';
import {
  DeleteOutlineOutlined,
  DraftsOutlined,
  MarkEmailReadOutlined,
  MarkEmailUnreadOutlined,
  MailOutline,
} from '@mui/icons-material';

export default function Messages() {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch messages
  const { data: messagesRes, isLoading } = useQuery({
    queryKey: ['adminMessages'],
    queryFn: async () => {
      const res = await fetch('/api/contact');
      if (!res.ok) throw new Error('Failed to load messages');
      const data = await res.json();
      return data;
    }
  });
  const messages = messagesRes?.data || [];

  const selectedMessage = messages.find(m => m.id === selectedId);

  // Toggle Read Mutation
  const toggleReadMutation = useMutation({
    mutationFn: async ({ id, is_read }) => {
      const res = await fetch(`/api/contact/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_read })
      });
      if (!res.ok) throw new Error('Failed to update message status');
      return res.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['adminMessages']);
      setSuccessMsg(variables.is_read ? 'Marked message as read.' : 'Marked message as unread.');
    },
    onError: (err) => {
      setErrorMsg(err.message || 'Operation failed');
    }
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const res = await fetch(`/api/contact/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete message');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['adminMessages']);
      if (selectedId === deleteId) {
        setSelectedId(null);
      }
      setDeleteId(null);
      setSuccessMsg('Message deleted successfully.');
    },
    onError: (err) => {
      setErrorMsg(err.message || 'Deletion failed');
    }
  });

  const handleToggleRead = (msg) => {
    toggleReadMutation.mutate({ id: msg.id, is_read: !msg.is_read });
  };

  const handleDeleteClick = (id, e) => {
    e.stopPropagation();
    setDeleteId(id);
  };

  const handleDeleteConfirm = () => {
    deleteMutation.mutate(deleteId);
  };

  const unreadCount = messages.filter(m => !m.is_read).length;

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h4" sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 600 }}>
            Inbox Messages
          </Typography>
          <Badge badgeContent={unreadCount} color="error" max={99} sx={{ '& .MuiBadge-badge': { transform: 'scale(1.2) translate(8px, -4px)', fontWeight: 600 } }} />
        </Box>
      </Box>

      {errorMsg && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 0 }}>
          {errorMsg}
        </Alert>
      )}

      <Grid container spacing={4}>
        {/* Messages List Panel */}
        <Grid item xs={12} md={5}>
          <Paper sx={{ border: '1px solid #EBE6DF', borderRadius: 0, height: '70vh', display: 'flex', flexDirection: 'column', boxShadow: 'none' }}>
            <Box sx={{ p: 2, borderBottom: '1px solid #EBE6DF', backgroundColor: '#FAF8F5' }}>
              <Typography variant="subtitle2" color="text.secondary" fontWeight="600">
                All Submissions ({messages.length})
              </Typography>
            </Box>

            <Box sx={{ overflowY: 'auto', flexGrow: 1 }}>
              {isLoading ? (
                <Box sx={{ p: 2 }}>
                  {[1, 2, 3, 4].map(idx => (
                    <Box key={idx} sx={{ mb: 3 }}>
                      <Skeleton variant="text" width="60%" height={24} />
                      <Skeleton variant="text" width="40%" height={16} />
                      <Skeleton variant="text" width="90%" height={16} />
                      <Divider sx={{ mt: 2 }} />
                    </Box>
                  ))}
                </Box>
              ) : messages.length === 0 ? (
                <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
                  <MailOutline sx={{ fontSize: 48, mb: 2, color: '#C8C4BE' }} />
                  <Typography variant="body2">No contact messages received yet.</Typography>
                </Box>
              ) : (
                <List disablePadding>
                  {messages.map((msg) => {
                    const active = msg.id === selectedId;
                    return (
                      <React.Fragment key={msg.id}>
                        <ListItem
                          disablePadding
                          secondaryAction={
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleRead(msg);
                                }}
                                title={msg.is_read ? 'Mark as Unread' : 'Mark as Read'}
                              >
                                {msg.is_read ? <MarkEmailUnreadOutlined fontSize="small" /> : <MarkEmailReadOutlined fontSize="small" />}
                              </IconButton>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={(e) => handleDeleteClick(msg.id, e)}
                                title="Delete message"
                              >
                                <DeleteOutlineOutlined fontSize="small" />
                              </IconButton>
                            </Box>
                          }
                        >
                          <ListItemButton
                            onClick={() => {
                              setSelectedId(msg.id);
                              if (!msg.is_read) {
                                toggleReadMutation.mutate({ id: msg.id, is_read: true });
                              }
                            }}
                            sx={{
                              p: 2.5,
                              alignItems: 'flex-start',
                              backgroundColor: active ? 'rgba(166, 124, 82, 0.08)' : 'transparent',
                              borderLeft: msg.is_read ? '3px solid transparent' : '3px solid #A67C52',
                              '&:hover': {
                                backgroundColor: active ? 'rgba(166, 124, 82, 0.12)' : '#FAF8F5'
                              }
                            }}
                          >
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 0.5, pr: 6 }}>
                                  <Typography variant="subtitle2" fontWeight={msg.is_read ? '500' : '700'} color="text.primary" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {msg.name}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0, ml: 1 }}>
                                    {new Date(msg.created_at).toLocaleDateString()}
                                  </Typography>
                                </Box>
                              }
                              secondary={
                                <Box sx={{ pr: 6 }}>
                                  <Typography variant="caption" fontWeight="600" color="secondary" display="block" sx={{ mb: 0.5 }}>
                                    {msg.subject}
                                  </Typography>
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{
                                      display: '-webkit-box',
                                      WebkitLineClamp: 2,
                                      WebkitBoxOrient: 'vertical',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                    }}
                                  >
                                    {msg.message}
                                  </Typography>
                                </Box>
                              }
                            />
                          </ListItemButton>
                        </ListItem>
                        <Divider />
                      </React.Fragment>
                    );
                  })}
                </List>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Message Details Panel */}
        <Grid item xs={12} md={7}>
          <Paper sx={{ border: '1px solid #EBE6DF', borderRadius: 0, height: '70vh', p: 4, display: 'flex', flexDirection: 'column', justifyContent: selectedMessage ? 'flex-start' : 'center', alignItems: selectedMessage ? 'stretch' : 'center', boxShadow: 'none' }}>
            {selectedMessage ? (
              <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                {/* Header info */}
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box>
                      <Typography variant="h5" sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 600, mb: 0.5 }}>
                        {selectedMessage.subject}
                      </Typography>
                      <Typography variant="subtitle2" color="text.primary">
                        From: <strong>{selectedMessage.name}</strong> &lt;{selectedMessage.email}&gt;
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Chip
                        label={selectedMessage.is_read ? 'Read' : 'Unread'}
                        color={selectedMessage.is_read ? 'default' : 'secondary'}
                        size="small"
                        sx={{ borderRadius: 0 }}
                      />
                      <Typography variant="caption" color="text.secondary" align="right" display="block" sx={{ mt: 0.5 }}>
                        {new Date(selectedMessage.created_at).toLocaleString()}
                      </Typography>
                    </Box>
                  </Box>
                  <Divider />
                </Box>

                {/* Message body text */}
                <Box sx={{ flexGrow: 1, overflowY: 'auto', pr: 1, py: 2 }}>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, color: '#4A463F' }}>
                    {selectedMessage.message}
                  </Typography>
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Action buttons */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Button
                    variant="outlined"
                    startIcon={selectedMessage.is_read ? <DraftsOutlined /> : <MailOutline />}
                    onClick={() => handleToggleRead(selectedMessage)}
                    disabled={toggleReadMutation.isPending}
                  >
                    {selectedMessage.is_read ? 'Mark as Unread' : 'Mark as Read'}
                  </Button>
                  <Button
                    variant="contained"
                    color="error"
                    startIcon={<DeleteOutlineOutlined />}
                    onClick={(e) => handleDeleteClick(selectedMessage.id, e)}
                    disabled={deleteMutation.isPending}
                  >
                    Delete Message
                  </Button>
                </Box>
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', color: 'text.secondary' }}>
                <MailOutline sx={{ fontSize: 64, mb: 2, color: '#C8C4BE' }} />
                <Typography variant="h6" sx={{ fontFamily: '"Playfair Display", serif', mb: 1 }}>
                  No Message Selected
                </Typography>
                <Typography variant="body2">
                  Select a contact submission from the inbox to read its details.
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)}>
        <DialogTitle sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 600 }}>Confirm Deletion</DialogTitle>
        <DialogContent>Are you sure you want to permanently delete this message? This action is irreversible.</DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained" disabled={deleteMutation.isPending}>
            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Toast Notifications */}
      <Snackbar
        open={!!successMsg}
        autoHideDuration={4000}
        onClose={() => setSuccessMsg('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setSuccessMsg('')} severity="success" sx={{ width: '100%', borderRadius: 0 }}>
          {successMsg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
