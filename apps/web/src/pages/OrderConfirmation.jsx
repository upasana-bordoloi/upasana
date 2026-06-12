import React from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { Container, Box, Typography, Button } from '@mui/material';
import { CheckCircleOutlineOutlined } from '@mui/icons-material';

export default function OrderConfirmation() {
  const { id } = useParams();

  return (
    <Container maxWidth="sm" sx={{ py: 15, textAlign: 'center' }}>
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
        <CheckCircleOutlineOutlined sx={{ fontSize: 80, color: 'secondary.main' }} />
      </Box>
      <Typography variant="h2" gutterBottom>Thank You</Typography>
      <Typography variant="h5" color="text.secondary" sx={{ mb: 4, fontFamily: '"Inter", sans-serif', fontWeight: 300 }}>
        Your acquisition has been registered.
      </Typography>
      
      <Box sx={{ backgroundColor: '#FAF8F5', border: '1px solid #EBE6DF', p: 4, mb: 6 }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Order Reference Number
        </Typography>
        <Typography variant="h5" fontWeight="700" color="primary" sx={{ letterSpacing: '0.05em' }}>
          {id}
        </Typography>
      </Box>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 6, lineHeight: 1.8 }}>
        A confirmation invoice has been sent to your email. Our studio will contact you directly within 24 hours to coordinate secure fine-art crating and white-glove shipping delivery options.
      </Typography>

      <Button variant="contained" size="large" component={RouterLink} to="/gallery">
        Continue Exploring Art
      </Button>
    </Container>
  );
}
