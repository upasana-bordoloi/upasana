import { Hono } from 'hono';
import { userSchema } from 'schemas';
import { hashPassword, getPaginationParams } from 'utils';
import { requireAuth, logAudit } from '../middleware/auth.js';

export const usersRouter = new Hono();

// GET /api/users - List all administrator accounts (RBAC: SUPER_ADMIN)
usersRouter.get('/', requireAuth(['SUPER_ADMIN']), async (c) => {
  const db = c.env.DB;
  
  const usersList = await db.prepare(`
    SELECT u.id, u.email, u.name, u.is_active, u.created_at, u.updated_at, r.name as role
    FROM users u
    LEFT JOIN user_roles ur ON u.id = ur.user_id
    LEFT JOIN roles r ON ur.role_id = r.id
    ORDER BY u.created_at DESC
  `).all();
  
  return c.json({ success: true, data: usersList.results });
});

// POST /api/users - Create a new administrator account (RBAC: SUPER_ADMIN)
usersRouter.post('/', requireAuth(['SUPER_ADMIN']), async (c) => {
  const adminUser = c.get('user');
  const db = c.env.DB;
  const body = await c.req.json();
  
  const result = userSchema.safeParse(body);
  if (!result.success) {
    return c.json({ success: false, error: 'Validation failed', details: result.error.issues }, 400);
  }
  
  const newUserData = result.data;
  if (!newUserData.password) {
    return c.json({ success: false, error: 'Password is required for new users' }, 400);
  }
  
  // Check if email already exists
  const existing = await db.prepare('SELECT id FROM users WHERE email = ? LIMIT 1')
    .bind(newUserData.email.toLowerCase()).first();
    
  if (existing) {
    return c.json({ success: false, error: 'Email address already in use' }, 400);
  }
  
  const newUserId = crypto.randomUUID();
  const passwordHash = await hashPassword(newUserData.password);
  
  // Retrieve corresponding Role ID
  const roleRecord = await db.prepare('SELECT id FROM roles WHERE name = ? LIMIT 1')
    .bind(newUserData.role).first();
  
  if (!roleRecord) {
    return c.json({ success: false, error: 'Invalid role assignment' }, 400);
  }
  
  // Transaction: Create user and assign role
  await db.batch([
    db.prepare(`
      INSERT INTO users (id, email, name, password_hash, is_active)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      newUserId,
      newUserData.email.toLowerCase(),
      newUserData.name,
      passwordHash,
      newUserData.is_active ? 1 : 0
    ),
    db.prepare(`
      INSERT INTO user_roles (user_id, role_id)
      VALUES (?, ?)
    `).bind(newUserId, roleRecord.id)
  ]);
  
  await logAudit(db, adminUser.id, adminUser.email, 'CREATE_USER', 'user', newUserId, { email: newUserData.email, role: newUserData.role });
  
  return c.json({
    success: true,
    message: 'Administrator created successfully',
    data: {
      id: newUserId,
      email: newUserData.email,
      name: newUserData.name,
      role: newUserData.role,
      is_active: newUserData.is_active
    }
  });
});

// PUT /api/users/:id - Edit an administrator details (RBAC: SUPER_ADMIN)
usersRouter.put('/:id', requireAuth(['SUPER_ADMIN']), async (c) => {
  const adminUser = c.get('user');
  const db = c.env.DB;
  const id = c.req.param('id');
  const body = await c.req.json();
  
  const existing = await db.prepare('SELECT * FROM users WHERE id = ? LIMIT 1').bind(id).first();
  if (!existing) {
    return c.json({ success: false, error: 'User not found' }, 404);
  }
  
  const result = userSchema.partial().safeParse(body);
  if (!result.success) {
    return c.json({ success: false, error: 'Validation failed', details: result.error.issues }, 400);
  }
  
  const updates = result.data;
  
  // Protect self-deactivation
  if (id === adminUser.id && updates.is_active === false) {
    return c.json({ success: false, error: 'Self-deactivation is prohibited' }, 400);
  }
  
  const statements = [];
  
  // Update fields if present
  if (updates.name || updates.email) {
    const newName = updates.name || existing.name;
    const newEmail = (updates.email || existing.email).toLowerCase();
    
    statements.push(
      db.prepare('UPDATE users SET name = ?, email = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .bind(newName, newEmail, id)
    );
  }
  
  if (updates.password) {
    const passwordHash = await hashPassword(updates.password);
    statements.push(
      db.prepare('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .bind(passwordHash, id)
    );
  }
  
  if (updates.is_active !== undefined) {
    statements.push(
      db.prepare('UPDATE users SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .bind(updates.is_active ? 1 : 0, id)
    );
  }
  
  // Update role if changed
  if (updates.role) {
    const roleRecord = await db.prepare('SELECT id FROM roles WHERE name = ? LIMIT 1')
      .bind(updates.role).first();
      
    if (roleRecord) {
      statements.push(db.prepare('DELETE FROM user_roles WHERE user_id = ?').bind(id));
      statements.push(
        db.prepare('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)').bind(id, roleRecord.id)
      );
    }
  }
  
  if (statements.length > 0) {
    await db.batch(statements);
    await logAudit(db, adminUser.id, adminUser.email, 'UPDATE_USER', 'user', id, updates);
  }
  
  return c.json({ success: true, message: 'Administrator details updated successfully' });
});

// DELETE /api/users/:id - Delete an administrator account (RBAC: SUPER_ADMIN)
usersRouter.delete('/:id', requireAuth(['SUPER_ADMIN']), async (c) => {
  const adminUser = c.get('user');
  const db = c.env.DB;
  const id = c.req.param('id');
  
  if (id === adminUser.id) {
    return c.json({ success: false, error: 'Self-deletion is prohibited' }, 400);
  }
  
  const existing = await db.prepare('SELECT name, email FROM users WHERE id = ? LIMIT 1').bind(id).first();
  if (!existing) {
    return c.json({ success: false, error: 'User not found' }, 404);
  }
  
  await db.batch([
    db.prepare('DELETE FROM user_roles WHERE user_id = ?').bind(id),
    db.prepare('DELETE FROM users WHERE id = ?').bind(id)
  ]);
  
  await logAudit(db, adminUser.id, adminUser.email, 'DELETE_USER', 'user', id, { name: existing.name, email: existing.email });
  
  return c.json({ success: true, message: 'Administrator deleted successfully' });
});

// GET /api/users/audit-logs - View administrative system logs (RBAC: SUPER_ADMIN, ADMIN)
usersRouter.get('/audit-logs/all', requireAuth(['SUPER_ADMIN', 'ADMIN']), async (c) => {
  const db = c.env.DB;
  const { page, limit, offset } = getPaginationParams(c.req.url);
  const searchParams = new URL(c.req.url).searchParams;
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  let query = `
    SELECT * FROM audit_logs
    WHERE 1=1
  `;
  let countQuery = `
    SELECT COUNT(*) as total FROM audit_logs
    WHERE 1=1
  `;
  const params = [];
  const countParams = [];

  if (startDate) {
    query += ` AND created_at >= ? `;
    params.push(startDate + ' 00:00:00');
    countQuery += ` AND created_at >= ? `;
    countParams.push(startDate + ' 00:00:00');
  }
  if (endDate) {
    query += ` AND created_at <= ? `;
    params.push(endDate + ' 23:59:59');
    countQuery += ` AND created_at <= ? `;
    countParams.push(endDate + ' 23:59:59');
  }

  query += ` ORDER BY created_at DESC LIMIT ? OFFSET ? `;
  params.push(limit, offset);

  const logs = await db.prepare(query).bind(...params).all();
  const countResult = await db.prepare(countQuery).bind(...countParams).first();
  const total = countResult ? countResult.total : 0;

  return c.json({
    success: true,
    data: logs.results,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
});
