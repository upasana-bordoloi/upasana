import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Container,
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Divider,
} from '@mui/material';
import { formatPrice } from 'utils';

export default function Home() {
  // Load site settings
  const { data: settingsRes } = useQuery({
    queryKey: ['settings'],
    queryFn: () => fetch('/api/settings').then(res => res.json())
  });
  const settings = settingsRes?.data || {};

  // Load featured paintings
  const { data: featuredRes } = useQuery({
    queryKey: ['featuredPaintings'],
    queryFn: () => fetch('/api/paintings?featured=true&limit=3').then(res => res.json())
  });
  const featuredPaintings = featuredRes?.data || [];

  return (
    <Box>
      {/* Hero Banner Section */}
      <Box
        sx={{
          minHeight: '75vh',
          display: 'flex',
          alignItems: 'center',
          backgroundColor: '#EBE6DF',
          backgroundImage: 'radial-gradient(circle at 80% 20%, rgba(166, 124, 82, 0.15) 0%, transparent 60%)',
          py: 8,
          mb: 10,
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={7}>
              <Typography
                variant="h1"
                sx={{
                  fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4.5rem' },
                  color: 'primary.main',
                  mb: 2,
                  lineHeight: 1.1,
                }}
              >
                {settings.hero_title || 'Original Fine Art Paintings'}
              </Typography>
              <Typography
                variant="h5"
                color="text.secondary"
                sx={{
                  fontFamily: '"Inter", sans-serif',
                  fontWeight: 300,
                  lineHeight: 1.6,
                  mb: 5,
                  maxWidth: '550px',
                }}
              >
                {settings.hero_subtitle || 'Exploring light, nature, and raw human emotion through classical oils.'}
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button variant="contained" component={RouterLink} to="/gallery" size="large">
                  Explore Gallery
                </Button>
                <Button variant="outlined" component={RouterLink} to="/about" size="large">
                  The Artist
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Featured Paintings Grid */}
      <Container maxWidth="lg" sx={{ mb: 12 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 6 }}>
          <Box>
            <Typography variant="caption" color="secondary" sx={{ letterSpacing: '0.2em', fontWeight: 600, textTransform: 'uppercase' }}>
              Handpicked Selection
            </Typography>
            <Typography variant="h2" sx={{ fontSize: { xs: '2rem', md: '2.8rem' }, mt: 1 }}>
              Featured Works
            </Typography>
          </Box>
          <Button component={RouterLink} to="/gallery" color="secondary" sx={{ fontWeight: 600 }}>
            View All Paintings &rarr;
          </Button>
        </Box>

        <Grid container spacing={4}>
          {featuredPaintings.length === 0 ? (
            <Grid item xs={12}>
              <Typography variant="body1" align="center" color="text.secondary">
                No featured paintings found. Check back soon!
              </Typography>
            </Grid>
          ) : (
            featuredPaintings.map((p) => (
              <Grid item xs={12} sm={6} md={4} key={p.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardMedia
                    component="img"
                    height="400"
                    image={p.thumbnail_url || p.image_url || 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=600&q=80'}
                    alt={p.title}
                    sx={{ objectFit: 'cover' }}
                  />
                  <CardContent sx={{ flexGrow: 1, p: 3 }}>
                    <Typography variant="h5" component={RouterLink} to={`/painting/${p.slug}`} sx={{ textDecoration: 'none', color: 'primary.main', '&:hover': { color: 'secondary.main' } }}>
                      {p.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontStyle: 'italic' }}>
                      {p.medium} — {p.width}&times;{p.height} in
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3 }}>
                      <Typography variant="h6" color="primary" fontWeight="600">
                        {p.availability === 'SOLD' ? (
                          <Chip label="Sold" size="small" sx={{ borderRadius: 0 }} />
                        ) : (
                          formatPrice(p.price)
                        )}
                      </Typography>
                      <Button size="small" component={RouterLink} to={`/painting/${p.slug}`}>
                        Details
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))
          )}
        </Grid>
      </Container>

      {/* Narrative Split Intro Section */}
      <Box sx={{ backgroundColor: '#FAF8F5', py: 12, borderTop: '1px solid #EBE6DF', borderBottom: '1px solid #EBE6DF', mb: 12 }}>
        <Container maxWidth="lg">
          <Grid container spacing={8} alignItems="center">
            <Grid item xs={12} md={5}>
              <Box
                sx={{
                  position: 'relative',
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    top: 20,
                    left: 20,
                    width: '100%',
                    height: '100%',
                    border: '1px solid #A67C52',
                    zIndex: 1,
                  }
                }}
              >
                <CardMedia
                  component="img"
                  image="https://images.unsplash.com/photo-1579783928621-7a13d66a62d1?auto=format&fit=crop&w=600&q=80"
                  alt="Artist Studio"
                  sx={{ width: '100%', height: 450, objectFit: 'cover', position: 'relative', zIndex: 2 }}
                />
              </Box>
            </Grid>
            <Grid item xs={12} md={7}>
              <Typography variant="caption" color="secondary" sx={{ letterSpacing: '0.2em', fontWeight: 600, textTransform: 'uppercase' }}>
                The Creative Spirit
              </Typography>
              <Typography variant="h2" sx={{ fontSize: { xs: '2rem', md: '2.8rem' }, mt: 1, mb: 4 }}>
                Meet The Artist
              </Typography>
              <Typography variant="body1" sx={{ color: 'text.secondary', mb: 4, whiteSpace: 'pre-line' }}>
                {settings.artist_bio || 'Exploring the quiet spaces between landscape representation and abstraction...'}
              </Typography>
              <Button variant="outlined" component={RouterLink} to="/about">
                Read Biography
              </Button>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Testimonials */}
      <Container maxWidth="md" sx={{ mb: 12, textAlign: 'center' }}>
        <Typography variant="caption" color="secondary" sx={{ letterSpacing: '0.2em', fontWeight: 600, textTransform: 'uppercase' }}>
          Collector Reviews
        </Typography>
        <Typography variant="h2" sx={{ fontSize: { xs: '2rem', md: '2.5rem' }, mt: 1, mb: 6 }}>
          Collector Voices
        </Typography>
        <Box sx={{ py: 2 }}>
          <Typography variant="h5" sx={{ fontStyle: 'italic', fontFamily: '"Playfair Display", serif', lineHeight: 1.6, mb: 4 }}>
            "The textures in 'Monsoon Memories I' are mesmerizing. It completely transforms the light in our living space. The ordering experience was flawless."
          </Typography>
          <Typography variant="subtitle1" fontWeight="600" color="secondary">
            — H. Sterling, London UK
          </Typography>
        </Box>
      </Container>

      {/* Contact CTA */}
      <Box sx={{ backgroundColor: '#2E2E2E', color: '#FAF8F5', py: 10, textAlign: 'center' }}>
        <Container maxWidth="md">
          <Typography variant="h3" sx={{ mb: 3 }}>
            Acquire An Original Masterpiece
          </Typography>
          <Typography variant="body1" sx={{ color: '#C8C4BE', mb: 5, maxWidth: '600px', mx: 'auto' }}>
            Interested in commissions, exhibitions, or a private gallery viewing? Let's connect.
          </Typography>
          <Button variant="contained" color="secondary" component={RouterLink} to="/contact" size="large">
            Get In Touch
          </Button>
        </Container>
      </Box>
    </Box>
  );
}
