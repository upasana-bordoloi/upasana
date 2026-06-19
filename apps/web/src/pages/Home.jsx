import React, { useEffect, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
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
  Chip,
  IconButton,
} from '@mui/material';
import { ChevronLeft, ChevronRight, ArrowForwardOutlined } from '@mui/icons-material';
import { formatPrice } from 'utils';

// Encapsulated CategoryCard component to manage its own image swapping state
function CategoryCard({ category }) {
  const navigate = useNavigate();
  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  
  let images = [];
  try {
    images = JSON.parse(category.images || '[]');
  } catch (e) {
    images = [];
  }

  // Fallback default image if none exist
  const displayImage = images.length > 0 
    ? images[currentImgIndex] 
    : 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=600&q=80';

  const handleNextImage = (e) => {
    e.stopPropagation(); // Prevent card navigation trigger
    setCurrentImgIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrevImage = (e) => {
    e.stopPropagation(); // Prevent card navigation trigger
    setCurrentImgIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleCardClick = () => {
    navigate(`/gallery?category=${category.slug}`);
  };

  return (
    <Card 
      onClick={handleCardClick}
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column', 
        borderRadius: 0,
        border: '1px solid #EBE6DF',
        boxShadow: 'none',
        cursor: 'pointer',
        transition: 'transform 0.3s ease, border-color 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          borderColor: 'secondary.main',
          '& .swapper-btn': {
            opacity: 1
          }
        }
      }}
    >
      <Box sx={{ position: 'relative', height: 260, overflow: 'hidden', backgroundColor: '#FAF8F5' }}>
        <CardMedia
          component="img"
          image={displayImage}
          alt={category.name}
          sx={{ 
            height: '100%', 
            objectFit: 'cover',
            transition: 'transform 0.5s ease',
          }}
        />

        {/* Hover-revealed image swapping buttons (only if multiple images) */}
        {images.length > 1 && (
          <>
            <IconButton 
              className="swapper-btn"
              onClick={handlePrevImage}
              sx={{ 
                position: 'absolute', 
                left: 8, 
                top: '50%', 
                transform: 'translateY(-50%)',
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                color: '#2E2E2E',
                opacity: 0,
                transition: 'opacity 0.2s ease, background-color 0.2s ease',
                '&:hover': { backgroundColor: '#FFFFFF' },
                width: 32,
                height: 32,
                p: 0
              }}
            >
              <ChevronLeft fontSize="small" />
            </IconButton>
            <IconButton 
              className="swapper-btn"
              onClick={handleNextImage}
              sx={{ 
                position: 'absolute', 
                right: 8, 
                top: '50%', 
                transform: 'translateY(-50%)',
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                color: '#2E2E2E',
                opacity: 0,
                transition: 'opacity 0.2s ease, background-color 0.2s ease',
                '&:hover': { backgroundColor: '#FFFFFF' },
                width: 32,
                height: 32,
                p: 0
              }}
            >
              <ChevronRight fontSize="small" />
            </IconButton>

            {/* Micro image indicator dots */}
            <Box 
              sx={{ 
                position: 'absolute', 
                bottom: 12, 
                left: '50%', 
                transform: 'translateX(-50%)',
                display: 'flex',
                gap: 0.8,
                zIndex: 2,
                backgroundColor: 'rgba(0,0,0,0.3)',
                py: 0.5,
                px: 1,
                borderRadius: '10px'
              }}
            >
              {images.map((_, idx) => (
                <Box 
                  key={idx}
                  sx={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    backgroundColor: idx === currentImgIndex ? '#FFFFFF' : 'rgba(255,255,255,0.5)',
                    transition: 'background-color 0.2s ease'
                  }}
                />
              ))}
            </Box>
          </>
        )}
      </Box>

      <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h5" sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 600, mb: 1, color: 'primary.main' }}>
            {category.name}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem', lineHeight: 1.6 }}>
            {category.description || 'View paintings belonging to this category.'}
          </Typography>
        </Box>
        <Typography 
          variant="subtitle2" 
          color="secondary" 
          sx={{ 
            fontWeight: 600, 
            display: 'flex', 
            alignItems: 'center', 
            gap: 0.5, 
            mt: 'auto',
            letterSpacing: '0.05em'
          }}
        >
          View Artworks <ArrowForwardOutlined fontSize="inherit" />
        </Typography>
      </CardContent>
    </Card>
  );
}

export default function Home() {
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    document.title = "Upasana Bordoloi | Original Fine Art Paintings & Gallery";
  }, []);

  // Load site settings
  const { data: settingsRes } = useQuery({
    queryKey: ['settings'],
    queryFn: () => fetch('/api/settings').then(res => res.json())
  });
  const settings = settingsRes?.data || {};

  const featuredLimit = settings.featured_section_limit || '3';
  const showFeatured = settings.featured_section_show !== '0';

  // Load featured paintings
  const { data: featuredRes } = useQuery({
    queryKey: ['featuredPaintings', featuredLimit],
    queryFn: () => fetch(`/api/paintings?featured=true&limit=${featuredLimit}`).then(res => res.json()),
    enabled: Object.keys(settings).length > 0
  });
  const featuredPaintings = featuredRes?.data || [];

  // Load categories
  const { data: categoriesRes } = useQuery({
    queryKey: ['publicCategoriesList'],
    queryFn: () => fetch('/api/paintings/categories').then(res => res.json())
  });
  const categories = categoriesRes?.data || [];

  // Auto-play hero slider
  useEffect(() => {
    if (featuredPaintings.length > 1) {
      const interval = setInterval(() => {
        setActiveSlide((prev) => (prev + 1) % featuredPaintings.length);
      }, 6000);
      return () => clearInterval(interval);
    }
  }, [featuredPaintings]);

  const handleNextSlide = () => {
    setActiveSlide((prev) => (prev + 1) % featuredPaintings.length);
  };

  const handlePrevSlide = () => {
    setActiveSlide((prev) => (prev - 1 + featuredPaintings.length) % featuredPaintings.length);
  };

  // Fallback defaults for Hero Slides if no featured paintings
  const defaultSlides = [
    {
      title: settings.hero_title || 'Original Fine Art Paintings',
      subtitle: settings.hero_subtitle || 'Exploring light, nature, and raw human emotion through classical oils and textured acrylics.',
      image_url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=1600&q=80',
      slug: null
    }
  ];

  const slides = featuredPaintings.length > 0 ? featuredPaintings : defaultSlides;
  const currentSlide = slides[activeSlide] || slides[0];

  return (
    <Box>
      {/* Sliding Hero Carousel Section */}
      <Box
        sx={{
          height: { xs: '65vh', md: '78vh' },
          position: 'relative',
          overflow: 'hidden',
          backgroundColor: '#EBE6DF',
          mb: 10,
        }}
      >
        {/* Slide backgrounds */}
        {slides.map((slide, idx) => (
          <Box
            key={slide.id || idx}
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundImage: `url(${slide.image_url})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: idx === activeSlide ? 1 : 0,
              transition: 'opacity 0.8s ease-in-out',
              zIndex: idx === activeSlide ? 1 : 0,
              display: 'flex',
              alignItems: 'center',
              '&::after': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: 'linear-gradient(to right, rgba(0, 0, 0, 0.75) 0%, rgba(0, 0, 0, 0.45) 50%, rgba(0, 0, 0, 0.2) 100%)',
              }
            }}
          >
            <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 2, color: '#FAF8F5' }}>
              <Grid container>
                <Grid item xs={12} md={7}>
                  {slide.medium && (
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        color: 'secondary.main', 
                        letterSpacing: '0.25em', 
                        fontWeight: 600, 
                        textTransform: 'uppercase',
                        display: 'block',
                        mb: 2
                      }}
                    >
                      Featured Work — {slide.medium}
                    </Typography>
                  )}
                  <Typography
                    variant="h1"
                    sx={{
                      fontSize: { xs: '2.2rem', sm: '3.2rem', md: '4.2rem' },
                      fontFamily: '"Playfair Display", serif',
                      fontWeight: 600,
                      mb: 2,
                      lineHeight: 1.1,
                    }}
                  >
                    {slide.title}
                  </Typography>
                  <Typography
                    variant="h5"
                    sx={{
                      fontFamily: '"Inter", sans-serif',
                      fontWeight: 300,
                      lineHeight: 1.6,
                      mb: 5,
                      maxWidth: '550px',
                      color: '#EBE6DF',
                      fontSize: { xs: '1rem', md: '1.2rem' }
                    }}
                  >
                    {slide.story ? slide.story.substring(0, 160) + '...' : (settings.hero_subtitle || 'Exploring light, nature, and raw human emotion.')}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    {slide.slug ? (
                      <Button variant="contained" color="secondary" component={RouterLink} to={`/painting/${slide.slug}`} size="large">
                        View Painting Details
                      </Button>
                    ) : (
                      <Button variant="contained" color="secondary" component={RouterLink} to="/gallery" size="large">
                        Explore Gallery
                      </Button>
                    )}
                    <Button 
                      variant="outlined" 
                      component={RouterLink} 
                      to="/about" 
                      size="large"
                      sx={{ 
                        color: '#FAF8F5', 
                        borderColor: '#FAF8F5',
                        '&:hover': {
                          borderColor: 'secondary.main',
                          color: 'secondary.main'
                        }
                      }}
                    >
                      The Artist
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Container>
          </Box>
        ))}

        {/* Carousel controls (left/right arrows) */}
        {slides.length > 1 && (
          <>
            <IconButton
              onClick={handlePrevSlide}
              sx={{
                position: 'absolute',
                left: 24,
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#FAF8F5',
                border: '1px solid rgba(255,255,255,0.3)',
                backgroundColor: 'rgba(0,0,0,0.2)',
                zIndex: 3,
                '&:hover': { backgroundColor: 'rgba(0,0,0,0.5)', borderColor: '#FAF8F5' }
              }}
            >
              <ChevronLeft />
            </IconButton>
            <IconButton
              onClick={handleNextSlide}
              sx={{
                position: 'absolute',
                right: 24,
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#FAF8F5',
                border: '1px solid rgba(255,255,255,0.3)',
                backgroundColor: 'rgba(0,0,0,0.2)',
                zIndex: 3,
                '&:hover': { backgroundColor: 'rgba(0,0,0,0.5)', borderColor: '#FAF8F5' }
              }}
            >
              <ChevronRight />
            </IconButton>

            {/* Slider dots */}
            <Box
              sx={{
                position: 'absolute',
                bottom: 24,
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                gap: 1.5,
                zIndex: 3,
              }}
            >
              {slides.map((_, idx) => (
                <IconButton
                  key={idx}
                  onClick={() => setActiveSlide(idx)}
                  sx={{
                    width: 10,
                    height: 10,
                    p: 0,
                    backgroundColor: idx === activeSlide ? 'secondary.main' : 'rgba(255, 255, 255, 0.4)',
                    transition: 'background-color 0.3s ease',
                    '&:hover': { backgroundColor: 'secondary.main' }
                  }}
                />
              ))}
            </Box>
          </>
        )}
      </Box>

      {/* Art Medium Categories Section */}
      {categories.length > 0 && (
        <Container maxWidth="lg" sx={{ mb: 12 }}>
          <Box sx={{ mb: 6, textAlign: 'center' }}>
            <Typography variant="caption" color="secondary" sx={{ letterSpacing: '0.2em', fontWeight: 600, textTransform: 'uppercase' }}>
              Creative Mediums
            </Typography>
            <Typography variant="h2" sx={{ fontSize: { xs: '2rem', md: '2.8rem' }, mt: 1, mb: 2 }}>
              Explore by Categories
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: '600px', mx: 'auto' }}>
              Select a category below to browse original pieces and custom portfolios. Swap images directly on the card to preview works.
            </Typography>
          </Box>

          <Grid container spacing={4}>
            {categories.map((cat) => (
              <Grid item xs={12} sm={6} md={3} key={cat.id}>
                <CategoryCard category={cat} />
              </Grid>
            ))}
          </Grid>
        </Container>
      )}

      {/* Featured Paintings Grid */}
      {showFeatured && (
        <Container maxWidth="lg" sx={{ mb: 12 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 6 }}>
            <Box>
              <Typography variant="caption" color="secondary" sx={{ letterSpacing: '0.2em', fontWeight: 600, textTransform: 'uppercase' }}>
                {settings.featured_section_subtitle || 'Handpicked Selection'}
              </Typography>
              <Typography variant="h2" sx={{ fontSize: { xs: '2rem', md: '2.8rem' }, mt: 1 }}>
                {settings.featured_section_title || 'Featured Works'}
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
                      image={p.thumbnail_url || p.image_url || 'https://images.unsplash.com/photo-1579783928621-7a13d66a62d1?auto=format&fit=crop&w=600&q=80'}
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
      )}

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
                  image={settings.meet_artist_image_url || "https://images.unsplash.com/photo-1579783928621-7a13d66a62d1?auto=format&fit=crop&w=600&q=80"}
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
