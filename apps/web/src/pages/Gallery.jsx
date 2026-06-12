import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Container,
  Grid,
  Box,
  Typography,
  TextField,
  MenuItem,
  Card,
  CardMedia,
  CardContent,
  Button,
  Chip,
  InputAdornment,
  Divider,
} from '@mui/material';
import { SearchOutlined, FilterListOutlined } from '@mui/icons-material';
import { formatPrice } from 'utils';

export default function Gallery() {
  const [search, setSearch] = useState('');
  const [medium, setMedium] = useState('');
  const [availability, setAvailability] = useState('');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const limit = 6;

  // Query API with parameters
  const { data: response, isLoading } = useQuery({
    queryKey: ['paintings', search, medium, availability, sort, page],
    queryFn: async () => {
      const url = new URL('/api/paintings', window.location.origin);
      url.searchParams.set('page', String(page));
      url.searchParams.set('limit', String(limit));
      if (search) url.searchParams.set('search', search);
      if (medium) url.searchParams.set('medium', medium);
      if (availability) url.searchParams.set('availability', availability);
      if (sort) url.searchParams.set('sort', sort);
      
      const res = await fetch(url.toString());
      return res.json();
    },
    keepPreviousData: true
  });

  const paintings = response?.data || [];
  const pagination = response?.pagination || { page: 1, pages: 1, total: 0 };

  const handleResetFilters = () => {
    setSearch('');
    setMedium('');
    setAvailability('');
    setSort('newest');
    setPage(1);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      {/* Header */}
      <Box sx={{ mb: 6, textAlign: 'center' }}>
        <Typography variant="h2" sx={{ mb: 2 }}>The Art Collection</Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: '600px', mx: 'auto' }}>
          Browse original landscape paintings, minimalist abstracts, and heavy impasto textured works created in our studio.
        </Typography>
      </Box>

      {/* Controls & Search */}
      <Grid container spacing={3} sx={{ mb: 6 }}>
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            fullWidth
            placeholder="Search paintings..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchOutlined />
                </InputAdornment>
              ),
            }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            fullWidth
            select
            label="Medium"
            value={medium}
            onChange={(e) => { setMedium(e.target.value); setPage(1); }}
          >
            <MenuItem value="">All Mediums</MenuItem>
            <MenuItem value="Oil on Canvas">Oil on Canvas</MenuItem>
            <MenuItem value="Acrylic on Canvas">Acrylic on Canvas</MenuItem>
            <MenuItem value="Watercolor on Archival Paper">Watercolor</MenuItem>
          </TextField>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <TextField
            fullWidth
            select
            label="Availability"
            value={availability}
            onChange={(e) => { setAvailability(e.target.value); setPage(1); }}
          >
            <MenuItem value="">All Statuses</MenuItem>
            <MenuItem value="AVAILABLE">Available</MenuItem>
            <MenuItem value="SOLD">Sold</MenuItem>
            <MenuItem value="RESERVED">Reserved</MenuItem>
          </TextField>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <TextField
            fullWidth
            select
            label="Sort By"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <MenuItem value="newest">Newest</MenuItem>
            <MenuItem value="oldest">Oldest</MenuItem>
            <MenuItem value="price-asc">Price: Low to High</MenuItem>
            <MenuItem value="price-desc">Price: High to Low</MenuItem>
            <MenuItem value="title-asc">Alphabetical: A-Z</MenuItem>
          </TextField>
        </Grid>
        <Grid item xs={12} md={2} sx={{ display: 'flex', alignItems: 'center' }}>
          <Button variant="outlined" fullWidth onClick={handleResetFilters}>
            Clear
          </Button>
        </Grid>
      </Grid>

      <Divider sx={{ mb: 6 }} />

      {/* Paintings Grid */}
      {isLoading ? (
        <Typography variant="h6" align="center" color="text.secondary" sx={{ my: 10 }}>
          Loading art archive...
        </Typography>
      ) : paintings.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 10 }}>
          <Typography variant="h5" color="text.secondary" gutterBottom>No paintings found</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Try adjustments to your search queries or filter selections.
          </Typography>
          <Button variant="contained" onClick={handleResetFilters}>Reset All Filters</Button>
        </Box>
      ) : (
        <Box>
          <Grid container spacing={4}>
            {paintings.map((p) => (
              <Grid item xs={12} sm={6} md={4} key={p.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ position: 'relative' }}>
                    <CardMedia
                      component="img"
                      height="380"
                      image={p.thumbnail_url || p.image_url || 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=600&q=80'}
                      alt={p.title}
                      sx={{ objectFit: 'cover' }}
                    />
                    {p.availability !== 'AVAILABLE' && (
                      <Chip
                        label={p.availability}
                        color={p.availability === 'SOLD' ? 'default' : 'secondary'}
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: 16,
                          right: 16,
                          borderRadius: 0,
                          fontWeight: 600,
                          backgroundColor: p.availability === 'SOLD' ? 'rgba(0, 0, 0, 0.7)' : '#A67C52',
                          color: '#FFFFFF'
                        }}
                      />
                    )}
                  </Box>
                  <CardContent sx={{ flexGrow: 1, p: 3, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h5" component={RouterLink} to={`/painting/${p.slug}`} sx={{ textDecoration: 'none', color: 'primary.main', '&:hover': { color: 'secondary.main' } }}>
                        {p.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontStyle: 'italic' }}>
                        {p.medium} — {p.width}&times;{p.height} in ({p.year_created})
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 4 }}>
                      <Typography variant="h6" color="primary" fontWeight="600">
                        {p.availability === 'SOLD' ? 'Collected' : formatPrice(p.price)}
                      </Typography>
                      <Button size="small" component={RouterLink} to={`/painting/${p.slug}`}>
                        Details
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Pagination Controls */}
          {pagination.pages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8, gap: 2 }}>
              <Button
                variant="outlined"
                disabled={page === 1}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              >
                Previous
              </Button>
              <Typography variant="body1" sx={{ alignSelf: 'center' }}>
                Page {page} of {pagination.pages}
              </Typography>
              <Button
                variant="outlined"
                disabled={page === pagination.pages}
                onClick={() => setPage((prev) => Math.min(pagination.pages, prev + 1))}
              >
                Next
              </Button>
            </Box>
          )}
        </Box>
      )}
    </Container>
  );
}
