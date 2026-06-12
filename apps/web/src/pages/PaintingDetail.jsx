import React, { useState, useEffect } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Container,
  Grid,
  Box,
  Typography,
  Button,
  Divider,
  Card,
  CardMedia,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Dialog,
  DialogContent,
} from '@mui/material';
import { ShoppingBagOutlined, ZoomInOutlined } from '@mui/icons-material';
import { useCartStore } from '../store/store.js';
import { formatPrice } from 'utils';

export default function PaintingDetail() {
  const { slug } = useParams();
  const [zoomOpen, setZoomOpen] = useState(false);
  const [activeImage, setActiveImage] = useState('');
  const addToCart = useCartStore((state) => state.addToCart);
  const cartItems = useCartStore((state) => state.items);

  // Fetch painting details by slug
  const { data: response, isLoading, error } = useQuery({
    queryKey: ['painting', slug],
    queryFn: async () => {
      const res = await fetch(`/api/paintings/${slug}`);
      if (!res.ok) throw new Error('Artwork not found');
      return res.json();
    }
  });

  const p = response?.data || {};

  // Set active image when data loads
  useEffect(() => {
    if (p.image_url) {
      setActiveImage(p.image_url);
    }
  }, [p]);

  // Set SEO Meta Title and Description dynamically
  useEffect(() => {
    if (p.title) {
      document.title = p.seo_title || `${p.title} | Original Painting`;
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', p.seo_description || p.description.substring(0, 160));
      }
    }
  }, [p]);

  if (isLoading) {
    return (
      <Container sx={{ py: 15, textDecoration: 'center' }}>
        <Typography variant="h5" align="center" color="text.secondary">
          Acquiring artwork details...
        </Typography>
      </Container>
    );
  }

  if (error || !p.id) {
    return (
      <Container sx={{ py: 15, textAlign: 'center' }}>
        <Typography variant="h4" color="error" gutterBottom>Artwork not found</Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          The painting you are looking for does not exist or has been removed from the gallery.
        </Typography>
        <Button variant="contained" component={RouterLink} to="/gallery">Return to Gallery</Button>
      </Container>
    );
  }

  const inCart = cartItems.some((item) => item.id === p.id);

  // Parse additional images
  let extraImages = [];
  try {
    extraImages = JSON.parse(p.additional_images || '[]');
  } catch (e) {
    extraImages = [];
  }
  const allImages = [p.image_url, ...extraImages].filter(Boolean);

  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      <Grid container spacing={8}>
        {/* Left Side: Large interactive image & thumbnails */}
        <Grid item xs={12} md={7}>
          <Box sx={{ position: 'relative', cursor: 'zoom-in', mb: 2 }} onClick={() => setZoomOpen(true)}>
            <CardMedia
              component="img"
              image={activeImage || 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=1200&q=80'}
              alt={p.title}
              sx={{
                width: '100%',
                maxHeight: '65vh',
                objectFit: 'contain',
                border: '1px solid #EBE6DF',
                backgroundColor: '#FFFFFF',
                boxShadow: '0px 4px 24px rgba(46, 46, 46, 0.05)',
              }}
            />
            <Button
              startIcon={<ZoomInOutlined />}
              sx={{
                position: 'absolute',
                bottom: 16,
                right: 16,
                backgroundColor: 'rgba(250, 248, 245, 0.85)',
                color: '#2E2E2E',
                borderRadius: 0,
                fontSize: '0.75rem',
                '&:hover': { backgroundColor: '#FAF8F5' }
              }}
            >
              Zoom
            </Button>
          </Box>

          {/* Thumbnails strip for multi-image support */}
          {allImages.length > 1 && (
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 2 }}>
              {allImages.map((imgUrl, index) => (
                <Box
                  key={index}
                  onClick={() => setActiveImage(imgUrl)}
                  sx={{
                    width: 80,
                    height: 80,
                    cursor: 'pointer',
                    border: activeImage === imgUrl ? '2px solid #A67C52' : '1px solid #EBE6DF',
                    opacity: activeImage === imgUrl ? 1 : 0.7,
                    transition: 'all 0.2s ease',
                    '&:hover': { opacity: 1, borderColor: '#A67C52' }
                  }}
                >
                  <img
                    src={imgUrl}
                    alt={`${p.title} - ${index + 1}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </Box>
              ))}
            </Box>
          )}
        </Grid>

        {/* Right Side: Artwork specification & checkout */}
        <Grid item xs={12} md={5}>
          <Box>
            <Typography variant="h3" sx={{ mb: 1 }}>{p.title}</Typography>
            <Typography variant="subtitle1" color="secondary" sx={{ fontStyle: 'italic', mb: 3 }}>
              Created in {p.year_created}
            </Typography>

            <Typography variant="h4" color="primary" fontWeight="600" sx={{ mb: 4 }}>
              {p.availability === 'SOLD' ? (
                <span style={{ color: '#888888', fontSize: '1.8rem', fontWeight: 400 }}>Collected</span>
              ) : (
                formatPrice(p.price)
              )}
            </Typography>

            <Divider sx={{ mb: 4 }} />

            {/* Action buttons */}
            {p.availability === 'AVAILABLE' ? (
              <Button
                variant="contained"
                size="large"
                fullWidth
                startIcon={<ShoppingBagOutlined />}
                disabled={inCart}
                onClick={() => addToCart(p)}
                sx={{ py: 2, mb: 4 }}
              >
                {inCart ? 'In Your Bag' : 'Add to Bag'}
              </Button>
            ) : (
              <Button
                variant="contained"
                size="large"
                fullWidth
                disabled
                sx={{ py: 2, mb: 4, backgroundColor: '#EBE6DF', color: '#8E8A84' }}
              >
                {p.availability === 'SOLD' ? 'Sold Out' : 'Reserved'}
              </Button>
            )}

            {/* Technical Specifications */}
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Specifications</Typography>
            <Table size="small" sx={{ mb: 4 }}>
              <TableBody>
                <TableRow>
                  <TableCell sx={{ pl: 0, borderBottom: '1px solid #EBE6DF', fontWeight: 500 }}>Medium</TableCell>
                  <TableCell sx={{ pr: 0, borderBottom: '1px solid #EBE6DF', textAlign: 'right' }}>{p.medium}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ pl: 0, borderBottom: '1px solid #EBE6DF', fontWeight: 500 }}>Dimensions</TableCell>
                  <TableCell sx={{ pr: 0, borderBottom: '1px solid #EBE6DF', textAlign: 'right' }}>
                    {p.width} &times; {p.height} inches
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ pl: 0, borderBottom: 'none', fontWeight: 500 }}>Status</TableCell>
                  <TableCell sx={{ pr: 0, borderBottom: 'none', textAlign: 'right', fontWeight: 600, color: p.availability === 'AVAILABLE' ? 'green' : 'secondary.main' }}>
                    {p.availability}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Box>
        </Grid>
      </Grid>

      {/* Story & Description sections */}
      <Grid container spacing={8} sx={{ mt: 6 }}>
        <Grid item xs={12} md={7}>
          {p.story && (
            <Box sx={{ mb: 6 }}>
              <Typography variant="h4" sx={{ mb: 3 }}>The Story Behind the Art</Typography>
              <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8, fontSize: '1.05rem', whiteSpace: 'pre-line' }}>
                {p.story}
              </Typography>
            </Box>
          )}

          <Box>
            <Typography variant="h4" sx={{ mb: 3 }}>Description</Typography>
            <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8, whiteSpace: 'pre-line' }}>
              {p.description}
            </Typography>
          </Box>
        </Grid>
      </Grid>

      {/* Immersive zoom overlay dialog */}
      <Dialog open={zoomOpen} onClose={() => setZoomOpen(false)} maxWidth="xl" fullWidth>
        <DialogContent sx={{ p: 0, backgroundColor: '#FAF8F5', display: 'flex', justifyContent: 'center', position: 'relative' }}>
          <Button
            onClick={() => setZoomOpen(false)}
            sx={{ position: 'absolute', top: 16, right: 16, color: '#2E2E2E', backgroundColor: '#FFFFFF', borderRadius: 0 }}
          >
            Close
          </Button>
          <img
            src={activeImage || p.image_url || p.thumbnail_url}
            alt={p.title}
            style={{ maxWidth: '100%', maxHeight: '90vh', objectFit: 'contain' }}
          />
        </DialogContent>
      </Dialog>

      {/* Related Paintings Row */}
      {p.related && p.related.length > 0 && (
        <Box sx={{ mt: 15 }}>
          <Divider sx={{ mb: 6 }} />
          <Typography variant="h3" sx={{ mb: 6 }}>You May Also Appreciate</Typography>
          <Grid container spacing={4}>
            {p.related.map((rp) => (
              <Grid item xs={12} sm={6} md={3} key={rp.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardMedia
                    component="img"
                    height="260"
                    image={rp.thumbnail_url || rp.image_url}
                    alt={rp.title}
                    sx={{ objectFit: 'cover' }}
                  />
                  <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h6" component={RouterLink} to={`/painting/${rp.slug}`} sx={{ textDecoration: 'none', color: 'primary.main', '&:hover': { color: 'secondary.main' } }}>
                        {rp.title}
                      </Typography>
                      <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                        {rp.medium}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3 }}>
                      <Typography variant="subtitle2" fontWeight="600">
                        {rp.availability === 'SOLD' ? 'Sold' : formatPrice(rp.price)}
                      </Typography>
                      <Button size="small" component={RouterLink} to={`/painting/${rp.slug}`}>
                        View
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Container>
  );
}
