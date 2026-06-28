import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import {
  Grid,
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Divider,
  Paper,
  CircularProgress,
  TablePagination,
  TextField,
} from '@mui/material';
import {
  ColorLensOutlined,
  ReceiptOutlined,
  MonetizationOnOutlined,
  StarBorderOutlined,
} from '@mui/icons-material';
import { formatPrice } from 'utils';

export default function Overview() {
  const [hasRequested, setHasRequested] = useState(false);
  const [logsPage, setLogsPage] = useState(0);
  const [logsRowsPerPage, setLogsRowsPerPage] = useState(10);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [appliedStartDate, setAppliedStartDate] = useState('');
  const [appliedEndDate, setAppliedEndDate] = useState('');

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
  const { data: auditRes, isLoading: loadingLogs } = useQuery({
    queryKey: ['adminAuditLogs', logsPage, logsRowsPerPage, appliedStartDate, appliedEndDate],
    queryFn: () => {
      const url = new URL('/api/users/audit-logs/all', window.location.origin);
      url.searchParams.set('page', String(logsPage + 1));
      url.searchParams.set('limit', String(logsRowsPerPage));
      if (appliedStartDate) url.searchParams.set('startDate', appliedStartDate);
      if (appliedEndDate) url.searchParams.set('endDate', appliedEndDate);
      return fetch(url.toString()).then(res => res.json());
    },
    enabled: hasRequested
  });
  const logs = auditRes?.data || [];
  const totalLogs = auditRes?.pagination?.total || 0;

  const handleFetchLogs = () => {
    if (startDate && endDate && dayjs(startDate).isAfter(dayjs(endDate))) {
      alert('Start date cannot be after end date');
      return;
    }
    setAppliedStartDate(startDate);
    setAppliedEndDate(endDate);
    setLogsPage(0);
    setHasRequested(true);
  };

  const handleLogsPageChange = (event, newPage) => {
    setLogsPage(newPage);
  };

  const handleLogsRowsPerPageChange = (event) => {
    setLogsRowsPerPage(parseInt(event.target.value, 10));
    setLogsPage(0);
  };

  if (loadingPaintings || loadingOrders) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 2 }}>
        <CircularProgress size={50} color="primary" />
        <Typography variant="body1" color="text.secondary">
          Loading dashboard metrics...
        </Typography>
      </Box>
    );
  }

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
      <Box sx={{
        mb: 4,
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between',
        alignItems: { xs: 'stretch', sm: 'center' },
        gap: 2
      }}>
        <Typography variant="h4" sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 600, fontSize: { xs: '1.8rem', md: '2.125rem' } }}>
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
                  <Typography variant="h4" sx={{ mt: 1, fontWeight: 700, fontSize: { xs: '1.5rem', md: '2.125rem' } }}>
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

            <Box sx={{
              display: 'flex',
              gap: 2,
              mb: 3,
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: { xs: 'stretch', sm: 'center' }
            }}>
              <TextField
                label="Start Date"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                size="small"
                sx={{ width: { xs: '100%', sm: '180px' } }}
              />
              <TextField
                label="End Date"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                size="small"
                sx={{ width: { xs: '100%', sm: '180px' } }}
              />
              <Button
                variant="contained"
                onClick={handleFetchLogs}
                size="medium"
                sx={{
                  height: 40,
                  width: { xs: '100%', sm: 'auto' }
                }}
              >
                Fetch Logs
              </Button>
            </Box>

            <Box sx={{ minHeight: 200, display: 'flex', flexDirection: 'column' }}>
              {loadingLogs ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 6, flexGrow: 1 }}>
                  <CircularProgress size={30} color="secondary" />
                </Box>
              ) : !hasRequested ? (
                <Box sx={{ py: 6, textAlign: 'center', flexGrow: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Select a date range (optional) and click "Fetch Logs" to view system activity.
                  </Typography>
                </Box>
              ) : logs.length === 0 ? (
                <Box sx={{ py: 6, textAlign: 'center', flexGrow: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    No administrative actions found for the selected criteria.
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ maxHeight: 350, overflowY: 'auto', flexGrow: 1, pr: 1 }}>
                  {logs.map((log) => (
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
                  ))}
                </Box>
              )}

              {hasRequested && logs.length > 0 && (
                <TablePagination
                  component="div"
                  count={totalLogs}
                  page={logsPage}
                  onPageChange={handleLogsPageChange}
                  rowsPerPage={logsRowsPerPage}
                  onRowsPerPageChange={handleLogsRowsPerPageChange}
                  rowsPerPageOptions={[5, 10, 25, 50]}
                  sx={{ borderTop: '1px solid #EBE6DF', mt: 2 }}
                />
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
