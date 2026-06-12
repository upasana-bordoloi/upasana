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
} from '@mui/material';

export default function Collections() {
  const collections = [
    {
      id: 'coll_monsoon',
      slug: 'monsoon-memories',
      name: 'Monsoon Memories',
      description: 'A nostalgic series capturing the dramatic rains and reflective streets of the subcontinent.',
      image_url: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 'coll_woodland',
      slug: 'woodland-whispers',
      name: 'Woodland Whispers',
      description: 'Deep forest landscapes exploring lighting, shadow, and nature\'s silence.',
      image_url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 'coll_abstract',
      slug: 'abstract-expressions',
      name: 'Abstract Expressions',
      description: 'Non-representational emotional journeys rendered through aggressive texturing.',
      image_url: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=600&q=80'
    }
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      <Box sx={{ mb: 8, textAlign: 'center' }}>
        <Typography variant="h2" sx={{ mb: 2 }}>Curated Collections</Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: '600px', mx: 'auto' }}>
          Explore themed series and groups of paintings, reflecting specific seasons, palettes, and emotional journeys.
        </Typography>
      </Box>

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
    </Container>
  );
}
