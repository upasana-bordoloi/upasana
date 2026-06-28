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
  Skeleton,
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
        <Grid container spacing={4}>
          {Array.from(new Array(3)).map((_, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Skeleton variant="rectangular" height={320} sx={{ backgroundColor: 'rgba(0,0,0,0.04)' }} />
                <CardContent sx={{ p: 4, flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <Box sx={{ mb: 3 }}>
                    <Skeleton variant="text" width="60%" height={32} sx={{ mb: 1.5 }} />
                    <Skeleton variant="text" width="90%" height={20} sx={{ mb: 1 }} />
                    <Skeleton variant="text" width="80%" height={20} />
                  </Box>
                  <Skeleton variant="rectangular" width="100%" height={40} />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
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
