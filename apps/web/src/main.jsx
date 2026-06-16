import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { useAuthStore } from './store/store.js';

// Global 401 Unauthorized API Interceptor
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  const response = await originalFetch(...args);
  // Detect if unauthorized and not the logout call itself to avoid loop
  if (response.status === 401 && !args[0].toString().includes('/api/auth/logout')) {
    const { user, setAuth } = useAuthStore.getState();
    if (user) {
      // Clear authenticated state and redirect
      setAuth(null, null);
      window.location.href = '/admin/login?expired=true';
    }
  }
  return response;
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
