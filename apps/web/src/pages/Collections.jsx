import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Container,
  Typography,
  Grid,
  Box,
  Card,
  CardMedia,
  CardContent,
  Button,
  CircularProgress,
} from '@mui/material';

export default function Collections() {
  const { data: collectionsRes, isLoading } = useQuery({
    queryKey: ['publicCollectionsList'],
    queryFn: () => fetch('/api/paintings/collections').then((res) => res.json()),
  });

  const collections = collectionsRes?.data || [];

  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      <Box sx={{ mb: 8, textAlign: 'center' }}>
        <Typography variant="h2" sx={{ mb: 2 }}>Curated Collections</Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: '600px', mx: 'auto' }}>
          Explore themed series and groups of paintings, reflecting specific seasons, palettes, and emotional journeys.
        </Typography>
      </Box>

      {isLoading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 10, gap: 2 }}>
          <CircularProgress size={50} color="primary" />
          <Typography variant="body2" color="text.secondary">Loading collections...</Typography>
        </Box>
      ) : collections.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 10 }}>
          <Typography variant="body1" color="text.secondary">No collections found. Check back later!</Typography>
        </Box>
      ) : (
        <Grid container spacing={4}>
        {collections.map((c) => (
          <Grid item xs={12} md={4} key={c.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardMedia
                component="img"
                height="320"
                image={c.image_url}
                alt={c.name}
                sx={{ objectFit: 'cover' }}
              />
              <CardContent sx={{ p: 4, flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h4" gutterBottom sx={{ fontSize: '1.6rem' }}>
                    {c.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                    {c.description}
                  </Typography>
                </Box>
                <Button
                  variant="outlined"
                  fullWidth
                  component={RouterLink}
                  to={`/gallery?collection=${c.slug}`}
                >
                  View Collection
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      )}
    </Container>
  );
}
