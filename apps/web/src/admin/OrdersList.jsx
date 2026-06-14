import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  Divider,
  TablePagination,
} from '@mui/material';
import { RemoveRedEyeOutlined } from '@mui/icons-material';
import { formatPrice } from 'utils';

export default function OrdersList() {
  const queryClient = useQueryClient();
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusVal, setStatusVal] = useState('');
  const [paymentVal, setPaymentVal] = useState('');

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Fetch site settings
  const { data: settingsRes } = useQuery({
    queryKey: ['adminSettings'],
    queryFn: () => fetch('/api/settings').then((res) => res.json()),
  });
  const settings = settingsRes?.data || {};
  const defaultLimit = parseInt(settings.pagination_limit_admin_orders || '10', 10);

  useEffect(() => {
    if (defaultLimit) {
      setRowsPerPage(defaultLimit);
    }
  }, [defaultLimit]);

  // Fetch orders
  const { data: ordersRes, isLoading } = useQuery({
    queryKey: ['adminOrdersList'],
    queryFn: () => fetch('/api/orders').then(res => res.json())
  });
  const orders = ordersRes?.data || [];
  const paginatedOrders = orders.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  // Update Status Mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, status, payment_status }) => {
      const res = await fetch(`/api/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, payment_status }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['adminOrdersList']);
      setSelectedOrder(null);
    }
  });

  const handleOpenDetails = async (id) => {
    try {
      const res = await fetch(`/api/orders/${id}`);
      const result = await res.json();
      if (result.success) {
        setSelectedOrder(result.data);
        setStatusVal(result.data.status);
        setPaymentVal(result.data.payment_status);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateSubmit = () => {
    updateMutation.mutate({
      id: selectedOrder.id,
      status: statusVal,
      payment_status: paymentVal
    });
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 600, mb: 4 }}>
        Customer Orders
      </Typography>

      <TableContainer component={Paper} sx={{ borderRadius: 0, border: '1px solid #EBE6DF', boxShadow: 'none' }}>
        <Table>
          <TableHead sx={{ backgroundColor: '#FAF8F5' }}>
            <TableRow>
              <TableCell>Order Reference</TableCell>
              <TableCell>Customer</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Total Amount</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Payment</TableCell>
              <TableCell>Ship Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                  Loading order logs...
                </TableCell>
              </TableRow>
            ) : orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                  No customer orders logged yet.
                </TableCell>
              </TableRow>
            ) : (
              paginatedOrders.map((o) => (
                <TableRow key={o.id}>
                  <TableCell sx={{ fontWeight: 600 }}>{o.order_number}</TableCell>
                  <TableCell>{o.customer_first_name} {o.customer_last_name}</TableCell>
                  <TableCell>{o.customer_email}</TableCell>
                  <TableCell>{formatPrice(o.total_amount)}</TableCell>
                  <TableCell>{new Date(o.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Chip
                      label={o.payment_status}
                      size="small"
                      sx={{ borderRadius: 0 }}
                      color={o.payment_status === 'PAID' ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={o.status}
                      size="small"
                      variant="outlined"
                      sx={{ borderRadius: 0 }}
                      color={
                        o.status === 'DELIVERED' ? 'success' :
                        o.status === 'PENDING' ? 'warning' : 'info'
                      }
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton onClick={() => handleOpenDetails(o.id)}>
                      <RemoveRedEyeOutlined />
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
        count={orders.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        sx={{ borderTop: '1px solid #EBE6DF', mt: 1 }}
      />

      {/* Order Details and Status Management Dialog */}
      <Dialog open={!!selectedOrder} onClose={() => setSelectedOrder(null)} maxWidth="sm" fullWidth>
        {selectedOrder && (
          <>
            <DialogTitle>Order Reference: {selectedOrder.order_number}</DialogTitle>
            <DialogContent>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>Customer Address</Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                {selectedOrder.customer_first_name} {selectedOrder.customer_last_name}<br />
                {selectedOrder.customer_email} | {selectedOrder.customer_phone}<br />
                {selectedOrder.shipping_address}, {selectedOrder.shipping_city}, {selectedOrder.shipping_state} {selectedOrder.shipping_postal_code}, {selectedOrder.shipping_country}
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>Purchased Works</Typography>
              {selectedOrder.items?.map((item) => (
                <Box key={item.id} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">
                    {item.title} ({item.medium})
                  </Typography>
                  <Typography variant="body2" fontWeight="600">
                    {formatPrice(item.price)}
                  </Typography>
                </Box>
              ))}

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>Edit Status</Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    select
                    label="Shipping Status"
                    value={statusVal}
                    onChange={(e) => setStatusVal(e.target.value)}
                  >
                    <MenuItem value="PENDING">Pending</MenuItem>
                    <MenuItem value="PROCESSING">Processing</MenuItem>
                    <MenuItem value="SHIPPED">Shipped</MenuItem>
                    <MenuItem value="DELIVERED">Delivered</MenuItem>
                    <MenuItem value="CANCELLED">Cancelled</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    select
                    label="Payment Status"
                    value={paymentVal}
                    onChange={(e) => setPaymentVal(e.target.value)}
                  >
                    <MenuItem value="UNPAID">Unpaid</MenuItem>
                    <MenuItem value="PAID">Paid</MenuItem>
                    <MenuItem value="REFUNDED">Refunded</MenuItem>
                  </TextField>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 3 }}>
              <Button onClick={() => setSelectedOrder(null)}>Cancel</Button>
              <Button variant="contained" onClick={handleUpdateSubmit} disabled={updateMutation.isPending}>
                Save Changes
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}
