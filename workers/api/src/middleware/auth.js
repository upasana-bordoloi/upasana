import { verify } from 'hono/jwt';
import { getCookie } from 'hono/cookie';

// Require Authentication Middleware (RBAC role-based checking)
export function requireAuth(rolesAllowed = []) {
  return async (c, next) => {
    // Check Authorization Header first, fallback to HttpOnly Cookie 'token'
    const authHeader = c.req.header('Authorization');
    let token = '';
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else {
      token = getCookie(c, 'token');
    }
    
    if (!token) {
      return c.json({ success: false, error: 'Unauthorized: Missing token' }, 401);
    }
    
    try {
      const jwtSecret = c.env.JWT_SECRET;
      const decoded = await verify(token, jwtSecret, 'HS256');
      c.set('user', decoded);
      
      // RBAC Validation
      if (rolesAllowed.length > 0 && !rolesAllowed.includes(decoded.role)) {
        return c.json({ success: false, error: 'Forbidden: Insufficient permissions' }, 403);
      }
      
      await next();
    } catch (e) {
      console.error('JWT Verification Error:', e);
      return c.json({ success: false, error: 'Unauthorized: Invalid or expired token' }, 401);
    }
  };
}

// Audit Logging Helper
export async function logAudit(db, userId, userEmail, action, entityType, entityId, details = null) {
  try {
    const id = crypto.randomUUID();
    await db.prepare(`
      INSERT INTO audit_logs (id, user_id, user_email, action, entity_type, entity_id, details)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      userId || null,
      userEmail || null,
      action,
      entityType || null,
      entityId || null,
      details ? JSON.stringify(details) : null
    ).run();
  } catch (err) {
    console.error('Failed to log audit activity:', err);
  }
}
