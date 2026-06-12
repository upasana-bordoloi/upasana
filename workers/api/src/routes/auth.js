import { Hono } from 'hono';
import { sign, verify } from 'hono/jwt';
import { setCookie, deleteCookie } from 'hono/cookie';
import { loginSchema, forgotPasswordSchema, resetPasswordSchema } from 'schemas';
import { verifyPassword, hashPassword } from 'utils';
import { requireAuth, logAudit } from '../middleware/auth.js';

export const authRouter = new Hono();

// POST /api/auth/login
authRouter.post('/login', async (c) => {
  const body = await c.req.json();
  const result = loginSchema.safeParse(body);
  
  if (!result.success) {
    return c.json({ success: false, error: 'Validation failed', details: result.error.issues }, 400);
  }
  
  const { email, password } = result.data;
  const db = c.env.DB;
  
  // Retrieve user and their role
  const user = await db.prepare(`
    SELECT u.*, r.name as role 
    FROM users u
    JOIN user_roles ur ON u.id = ur.user_id
    JOIN roles r ON ur.role_id = r.id
    WHERE u.email = ? AND u.is_active = 1
    LIMIT 1
  `).bind(email.toLowerCase()).first();
  
  if (!user) {
    return c.json({ success: false, error: 'Invalid email or password' }, 401);
  }
  
  // Verify password using native PBKDF2 Web Crypto helper
  const isMatch = await verifyPassword(password, user.password_hash);
  if (!isMatch) {
    return c.json({ success: false, error: 'Invalid email or password' }, 401);
  }
  
  // Generate JWT token
  const payload = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + (60 * 60 * 12) // 12 hours
  };
  
  const token = await sign(payload, c.env.JWT_SECRET);
  
  // Set HttpOnly secure cookie
  setCookie(c, 'token', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'Strict',
    path: '/',
    maxAge: 60 * 60 * 12 // 12 hours
  });
  
  // Log login audit
  await logAudit(db, user.id, user.email, 'LOGIN', 'user', user.id);
  
  return c.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    },
    token // Send token also in response for alternative client storage
  });
});

// POST /api/auth/logout
authRouter.post('/logout', requireAuth(), async (c) => {
  const user = c.get('user');
  const db = c.env.DB;
  
  // Delete cookie
  deleteCookie(c, 'token', {
    path: '/',
    secure: true,
    sameSite: 'Strict'
  });
  
  if (user) {
    await logAudit(db, user.id, user.email, 'LOGOUT', 'user', user.id);
  }
  
  return c.json({ success: true, message: 'Logged out successfully' });
});

// GET /api/auth/me
authRouter.get('/me', requireAuth(), (c) => {
  const user = c.get('user');
  return c.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    }
  });
});

// POST /api/auth/forgot-password
authRouter.post('/forgot-password', async (c) => {
  const body = await c.req.json();
  const result = forgotPasswordSchema.safeParse(body);
  
  if (!result.success) {
    return c.json({ success: false, error: 'Invalid email' }, 400);
  }
  
  const { email } = result.data;
  const db = c.env.DB;
  
  const user = await db.prepare('SELECT id, email, name FROM users WHERE email = ? LIMIT 1')
    .bind(email.toLowerCase()).first();
  
  if (!user) {
    // Return success to prevent user enumeration
    return c.json({ success: true, message: 'If the email exists, a reset link has been generated.' });
  }
  
  // Generate short-lived JWT token for password reset
  const resetPayload = {
    email: user.email,
    userId: user.id,
    purpose: 'reset-password',
    exp: Math.floor(Date.now() / 1000) + (15 * 60) // 15 minutes
  };
  
  const resetToken = await sign(resetPayload, c.env.JWT_SECRET);
  
  // Log reset request
  await logAudit(db, user.id, user.email, 'PASSWORD_RESET_REQUESTED', 'user', user.id);
  
  // Note: In real life, send email via SendGrid/Mailgun. Here we return the token in development
  return c.json({
    success: true,
    message: 'If the email exists, a reset link has been generated.',
    // Return reset token in development so that frontend can process resetting without setup email client
    resetToken
  });
});

// POST /api/auth/reset-password
authRouter.post('/reset-password', async (c) => {
  const body = await c.req.json();
  const result = resetPasswordSchema.safeParse(body);
  
  if (!result.success) {
    return c.json({ success: false, error: 'Validation failed', details: result.error.issues }, 400);
  }
  
  const { token, password } = result.data;
  const db = c.env.DB;
  
  try {
    const decoded = await verify(token, c.env.JWT_SECRET, 'HS256');
    
    if (decoded.purpose !== 'reset-password') {
      return c.json({ success: false, error: 'Invalid token purpose' }, 400);
    }
    
    const newHash = await hashPassword(password);
    
    await db.prepare('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .bind(newHash, decoded.userId).run();
      
    await logAudit(db, decoded.userId, decoded.email, 'PASSWORD_RESET_COMPLETED', 'user', decoded.userId);
    
    return c.json({ success: true, message: 'Password has been successfully updated.' });
  } catch (e) {
    return c.json({ success: false, error: 'Invalid or expired reset token' }, 400);
  }
});
