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
        Your request for acquisition has been successfully registered. Please note that we do not send automated confirmation emails at this stage. Instead, our studio team will get in touch with you directly via Call, Email, SMS, WhatsApp, or Telegram using the contact details you provided. We will coordinate your preferred payment method, custom crating requirements, and secure shipment options.
      </Typography>

      <Button variant="contained" size="large" component={RouterLink} to="/gallery">
        Continue Exploring Art
      </Button>
    </Container>
  );
}
