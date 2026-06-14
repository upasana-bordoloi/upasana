import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { authRouter } from './routes/auth.js';
import { paintingsRouter } from './routes/paintings.js';
import { mediaRouter } from './routes/media.js';
import { ordersRouter } from './routes/orders.js';
import { settingsRouter } from './routes/settings.js';
import { usersRouter } from './routes/users.js';
import { contactRouter } from './routes/contact.js';

const app = new Hono();

// Global CORS Middleware (Credentials enabled for HttpOnly JWT cookies)
app.use('*', async (c, next) => {
  const origin = c.req.header('Origin') || c.env?.FRONTEND_URL || 'http://localhost:5173';
  const corsHandler = cors({
    origin: origin,
    allowHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    exposeHeaders: ['Content-Length'],
    maxAge: 600,
    credentials: true,
  });
  return corsHandler(c, next);
});

// Mount Routes
app.route('/api/auth', authRouter);
app.route('/api/paintings', paintingsRouter);
app.route('/api/media', mediaRouter);
app.route('/api/orders', ordersRouter);
app.route('/api/settings', settingsRouter);
app.route('/api/users', usersRouter);
app.route('/api/contact', contactRouter);

// Global Error Handler
app.onError((err, c) => {
  console.error('API Error:', err);
  
  if (err.name === 'ZodError') {
    return c.json({
      success: false,
      error: 'Validation Error',
      details: err.issues.map(i => ({ field: i.path.join('.'), message: i.message }))
    }, 400);
  }
  
  return c.json({
    success: false,
    error: err.message || 'Internal Server Error'
  }, err.status || 500);
});

// 404 Route
app.notFound((c) => {
  return c.json({ success: false, error: 'Endpoint not found' }, 404);
});

export default app;
