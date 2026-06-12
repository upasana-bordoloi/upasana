import { Hono } from 'hono';
import { siteSettingsSchema } from 'schemas';
import { requireAuth, logAudit } from '../middleware/auth.js';

export const settingsRouter = new Hono();

// GET /api/settings - Public retrieval of all configurations
settingsRouter.get('/', async (c) => {
  const db = c.env.DB;
  
  const results = await db.prepare('SELECT key, value FROM site_settings').all();
  
  // Format rows as a single key-value object
  const settings = {};
  for (const row of results.results) {
    settings[row.key] = row.value;
  }
  
  return c.json({ success: true, data: settings });
});

// PUT /api/settings - Update site configuration settings (RBAC: SUPER_ADMIN, ADMIN)
settingsRouter.put('/', requireAuth(['SUPER_ADMIN', 'ADMIN']), async (c) => {
  const user = c.get('user');
  const db = c.env.DB;
  const body = await c.req.json();
  
  // Validate configurations
  const result = siteSettingsSchema.safeParse(body);
  if (!result.success) {
    return c.json({ success: false, error: 'Validation failed', details: result.error.issues }, 400);
  }
  
  const settingsData = result.data;
  const statements = [];
  
  // Construct SQL Upserts for all fields
  for (const [key, value] of Object.entries(settingsData)) {
    statements.push(
      db.prepare(`
        INSERT INTO site_settings (key, value)
        VALUES (?, ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value
      `).bind(key, value !== undefined && value !== null ? String(value) : '')
    );
  }
  
  await db.batch(statements);
  
  await logAudit(db, user.id, user.email, 'SETTINGS_CHANGE', 'settings', null, settingsData);
  
  return c.json({ success: true, message: 'Settings updated successfully', data: settingsData });
});
