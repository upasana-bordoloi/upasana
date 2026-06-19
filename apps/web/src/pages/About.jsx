import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Container,
  Box,
  Typography,
  Grid,
  CardMedia,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';

export default function About() {
  useEffect(() => {
    document.title = "About the Artist | Upasana Bordoloi";
  }, []);

  const { data: settingsRes } = useQuery({
    queryKey: ['settings'],
    queryFn: () => fetch('/api/settings').then(res => res.json())
  });
  const settings = settingsRes?.data || {};

  let exhibitions = [];
  try {
    exhibitions = JSON.parse(settings.about_exhibitions || '[]');
  } catch (e) {
    exhibitions = [];
  }

  let awards = [];
  try {
    awards = JSON.parse(settings.about_awards || '[]');
  } catch (e) {
    awards = [];
  }

  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      {/* Bio section */}
      <Grid container spacing={8} alignItems="center" sx={{ mb: 10 }}>
        <Grid item xs={12} md={5}>
          <CardMedia
            component="img"
            image={settings.about_image_url || "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=800&q=80"}
            alt="The Artist"
            sx={{
              width: '100%',
              height: 550,
              objectFit: 'cover',
              border: '1px solid #EBE6DF',
            }}
          />
        </Grid>
        <Grid item xs={12} md={7}>
          <Typography variant="caption" color="secondary" sx={{ letterSpacing: '0.2em', fontWeight: 600, textTransform: 'uppercase' }}>
            The Creator
          </Typography>
          <Typography variant="h2" sx={{ mt: 1, mb: 4 }}>
            Biography
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary', mb: 3, lineHeight: 1.8, fontSize: '1.05rem', whiteSpace: 'pre-line' }}>
            {settings.artist_bio || 'A graduate of the Florence Academy of Fine Art, I specialize in atmospheric oil paintings and heavily layered acrylic works.'}
          </Typography>
        </Grid>
      </Grid>

      {/* Exhibitions & Awards lists */}
      {(exhibitions.length > 0 || awards.length > 0) && (
        <>
          <Divider sx={{ my: 8 }} />
          <Grid container spacing={8}>
            {/* Exhibitions */}
            {exhibitions.length > 0 && (
              <Grid item xs={12} md={awards.length > 0 ? 6 : 12}>
                <Typography variant="h3" sx={{ mb: 4 }}>
                  Exhibitions
                </Typography>
                <List disablePadding>
                  {exhibitions.map((ex, index) => (
                    <React.Fragment key={index}>
                      <ListItem sx={{ py: 2.5, px: 0 }}>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', mb: 0.5 }}>
                              <Typography variant="subtitle1" fontWeight="600" color="primary">
                                {ex.title}
                              </Typography>
                              <Typography variant="subtitle1" fontWeight="600" color="secondary">
                                {ex.year}
                              </Typography>
                            </Box>
                          }
                          secondary={ex.location}
                          secondaryTypographyProps={{ style: { color: '#6E6A64' } }}
                        />
                      </ListItem>
                      {index < exhibitions.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </Grid>
            )}

            {/* Awards */}
            {awards.length > 0 && (
              <Grid item xs={12} md={exhibitions.length > 0 ? 6 : 12}>
                <Typography variant="h3" sx={{ mb: 4 }}>
                  Awards & Recognition
                </Typography>
                <List disablePadding>
                  {awards.map((aw, index) => (
                    <React.Fragment key={index}>
                      <ListItem sx={{ py: 2.5, px: 0 }}>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', mb: 0.5 }}>
                              <Typography variant="subtitle1" fontWeight="600" color="primary">
                                {aw.title}
                              </Typography>
                              <Typography variant="subtitle1" fontWeight="600" color="secondary">
                                {aw.year}
                              </Typography>
                            </Box>
                          }
                          secondary={aw.organization}
                          secondaryTypographyProps={{ style: { color: '#6E6A64' } }}
                        />
                      </ListItem>
                      {index < awards.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </Grid>
            )}
          </Grid>
        </>
      )}
    </Container>
  );
}
