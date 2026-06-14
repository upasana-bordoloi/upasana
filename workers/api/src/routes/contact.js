import { Hono } from 'hono';
import { contactFormSchema } from 'schemas';
import { requireAuth, logAudit } from '../middleware/auth.js';

export const contactRouter = new Hono();

// POST /api/contact - Public contact submission
contactRouter.post('/', async (c) => {
  const db = c.env.DB;
  const body = await c.req.json();
  
  const result = contactFormSchema.safeParse(body);
  if (!result.success) {
    return c.json({ success: false, error: 'Validation failed', details: result.error.issues }, 400);
  }
  
  const { name, email, subject, message } = result.data;
  const id = crypto.randomUUID();
  
  await db.prepare(`
    INSERT INTO contact_messages (id, name, email, subject, message, is_read)
    VALUES (?, ?, ?, ?, ?, 0)
  `).bind(id, name, email, subject, message).run();
  
  return c.json({ success: true, message: 'Your message has been sent successfully!' });
});

// GET /api/contact - Retrieve all contact messages (RBAC: SUPER_ADMIN, ADMIN, EDITOR)
contactRouter.get('/', requireAuth(['SUPER_ADMIN', 'ADMIN', 'EDITOR']), async (c) => {
  const db = c.env.DB;
  
  const results = await db.prepare(`
    SELECT * FROM contact_messages 
    ORDER BY created_at DESC
  `).all();
  
  return c.json({ success: true, data: results.results });
});

// PUT /api/contact/:id - Toggle read status of a message (RBAC: SUPER_ADMIN, ADMIN, EDITOR)
contactRouter.put('/:id', requireAuth(['SUPER_ADMIN', 'ADMIN', 'EDITOR']), async (c) => {
  const user = c.get('user');
  const db = c.env.DB;
  const id = c.req.param('id');
  const body = await c.req.json();
  
  const isRead = body.is_read ? 1 : 0;
  
  const result = await db.prepare(`
    UPDATE contact_messages 
    SET is_read = ? 
    WHERE id = ?
  `).bind(isRead, id).run();
  
  if (result.meta.changes === 0) {
    return c.json({ success: false, error: 'Message not found' }, 404);
  }
  
  await logAudit(db, user.id, user.email, 'UPDATE_MESSAGE_STATUS', 'contact_messages', id, { is_read: isRead });
  
  return c.json({ success: true, message: 'Message status updated successfully' });
});

// DELETE /api/contact/:id - Delete a contact message (RBAC: SUPER_ADMIN, ADMIN)
contactRouter.delete('/:id', requireAuth(['SUPER_ADMIN', 'ADMIN']), async (c) => {
  const user = c.get('user');
  const db = c.env.DB;
  const id = c.req.param('id');
  
  const messageRecord = await db.prepare('SELECT * FROM contact_messages WHERE id = ?').bind(id).first();
  if (!messageRecord) {
    return c.json({ success: false, error: 'Message not found' }, 404);
  }
  
  await db.prepare('DELETE FROM contact_messages WHERE id = ?').bind(id).run();
  
  await logAudit(db, user.id, user.email, 'DELETE_MESSAGE', 'contact_messages', id, { name: messageRecord.name, subject: messageRecord.subject });
  
  return c.json({ success: true, message: 'Message deleted successfully' });
});
