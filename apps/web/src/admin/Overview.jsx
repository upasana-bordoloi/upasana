import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Grid,
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Divider,
  Paper,
} from '@mui/material';
import {
  ColorLensOutlined,
  ReceiptOutlined,
  MonetizationOnOutlined,
  StarBorderOutlined,
  FormatListBullettedOutlined,
} from '@mui/icons-material';
import { formatPrice } from 'utils';

export default function Overview() {
  // Query all paintings (to compute stats)
  const { data: paintingsRes, isLoading: loadingPaintings } = useQuery({
    queryKey: ['adminPaintingsAll'],
    queryFn: () => fetch('/api/paintings?limit=1000').then(res => res.json())
  });
  const paintings = paintingsRes?.data || [];

  // Query all orders (to compute stats)
  const { data: ordersRes, isLoading: loadingOrders } = useQuery({
    queryKey: ['adminOrdersAll'],
    queryFn: () => fetch('/api/orders').then(res => res.json())
  });
  const orders = ordersRes?.data || [];

  // Query audit logs
  const { data: auditRes } = useQuery({
    queryKey: ['adminAuditLogs'],
    queryFn: () => fetch('/api/users/audit-logs/all').then(res => res.json())
  });
  const logs = auditRes?.data || [];

  const totalPaintings = paintings.length;
  const publishedCount = paintings.filter(p => p.status === 'PUBLISHED').length;
  const featuredCount = paintings.filter(p => p.featured === 1 || p.featured === true).length;
  const totalOrders = orders.length;
  const totalRevenue = orders
    .filter(o => o.payment_status === 'PAID')
    .reduce((acc, curr) => acc + curr.total_amount, 0);

  const stats = [
    { text: 'Total Paintings', count: totalPaintings, icon: <ColorLensOutlined sx={{ color: '#A67C52', fontSize: 32 }} /> },
    { text: 'Published Works', count: publishedCount, icon: <ColorLensOutlined sx={{ color: 'green', fontSize: 32 }} /> },
    { text: 'Featured Artworks', count: featuredCount, icon: <StarBorderOutlined sx={{ color: 'orange', fontSize: 32 }} /> },
    { text: 'Received Orders', count: totalOrders, icon: <ReceiptOutlined sx={{ color: '#2E2E2E', fontSize: 32 }} /> },
    { text: 'Total Sales Revenue', count: formatPrice(totalRevenue), icon: <MonetizationOnOutlined sx={{ color: 'green', fontSize: 32 }} /> },
  ];

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 600 }}>
          Dashboard Overview
        </Typography>
        <Button
          variant="contained"
          component={RouterLink}
          to="/admin/paintings/new"
          startIcon={<ColorLensOutlined />}
        >
          Add New Painting
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 6 }}>
        {stats.map((s, index) => (
          <Grid item xs={12} sm={6} md={2.4} key={index}>
            <Card sx={{ border: '1px solid #EBE6DF', boxShadow: 'none', borderRadius: 0 }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 3 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" fontWeight="500">
                    {s.text}
                  </Typography>
                  <Typography variant="h4" sx={{ mt: 1, fontWeight: 700 }}>
                    {s.count}
                  </Typography>
                </Box>
                {s.icon}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={4}>
        {/* Quick Links */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ border: '1px solid #EBE6DF', borderRadius: 0, p: 3, boxShadow: 'none' }}>
            <Typography variant="h6" sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 600, mb: 3 }}>
              Quick Operations
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button variant="outlined" component={RouterLink} to="/admin/paintings" fullWidth>
                Manage Painting Listings
              </Button>
              <Button variant="outlined" component={RouterLink} to="/admin/orders" fullWidth>
                Review Customer Orders
              </Button>
              <Button variant="outlined" component={RouterLink} to="/admin/media" fullWidth>
                Browse Media Library
              </Button>
              <Button variant="outlined" component={RouterLink} to="/admin/settings" fullWidth>
                Update Site Settings
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Audit Logs */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ border: '1px solid #EBE6DF', borderRadius: 0, p: 3, boxShadow: 'none' }}>
            <Typography variant="h6" sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 600, mb: 3 }}>
              Staff Activity Logs
            </Typography>
            <Box sx={{ maxHeight: 350, overflowY: 'auto' }}>
              {logs.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No administrative actions logged yet.
                </Typography>
              ) : (
                logs.map((log) => (
                  <Box key={log.id} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="subtitle2" fontWeight="600" color="primary">
                        {log.user_email || 'System'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(log.created_at).toLocaleString()}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Action: <strong>{log.action}</strong> {log.entity_type ? `on ${log.entity_type} (${log.entity_id})` : ''}
                    </Typography>
                    {log.details && (
                      <Typography variant="caption" display="block" sx={{ fontStyle: 'italic', color: '#8E8A84' }}>
                        Details: {log.details}
                      </Typography>
                    )}
                    <Divider sx={{ mt: 1.5 }} />
                  </Box>
                ))
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
