import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from './theme.js';

// Layouts
import PublicLayout from './layouts/PublicLayout.jsx';
import AdminLayout from './layouts/AdminLayout.jsx';

// Public Pages
import Home from './pages/Home.jsx';
import Gallery from './pages/Gallery.jsx';
import PaintingDetail from './pages/PaintingDetail.jsx';
import About from './pages/About.jsx';
import Contact from './pages/Contact.jsx';
import Collections from './pages/Collections.jsx';
import Checkout from './pages/Checkout.jsx';
import OrderConfirmation from './pages/OrderConfirmation.jsx';

// Admin Pages
import Login from './admin/Login.jsx';
import Overview from './admin/Overview.jsx';
import PaintingsList from './admin/PaintingsList.jsx';
import PaintingForm from './admin/PaintingForm.jsx';
import MediaLibrary from './admin/MediaLibrary.jsx';
import OrdersList from './admin/OrdersList.jsx';
import SettingsManager from './admin/SettingsManager.jsx';
import UsersList from './admin/UsersList.jsx';
import Messages from './admin/Messages.jsx';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <Routes>
            {/* Public Pages */}
            <Route path="/" element={<PublicLayout />}>
              <Route index element={<Home />} />
              <Route path="gallery" element={<Gallery />} />
              <Route path="painting/:slug" element={<PaintingDetail />} />
              <Route path="about" element={<About />} />
              <Route path="contact" element={<Contact />} />
              <Route path="collections" element={<Collections />} />
              <Route path="checkout" element={<Checkout />} />
              <Route path="order-confirmation/:id" element={<OrderConfirmation />} />
            </Route>

            {/* Admin Login */}
            <Route path="/admin/login" element={<Login />} />

            {/* Admin Protected Dashboard Layout */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Overview />} />
              <Route path="paintings" element={<PaintingsList />} />
              <Route path="paintings/new" element={<PaintingForm />} />
              <Route path="paintings/edit/:id" element={<PaintingForm />} />
              <Route path="media" element={<MediaLibrary />} />
              <Route path="orders" element={<OrdersList />} />
              <Route path="settings" element={<SettingsManager />} />
              <Route path="users" element={<UsersList />} />
              <Route path="messages" element={<Messages />} />
            </Route>

            {/* Redirect fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
