import { Hono } from 'hono';
import { requireAuth, logAudit } from '../middleware/auth.js';

export const mediaRouter = new Hono();

// GET /api/media/file/* - Public route to serve files directly from Cloudflare R2
mediaRouter.get('/file/*', async (c) => {
  const bucket = c.env.BUCKET;
  
  // Extract key from URL path
  const url = new URL(c.req.url);
  const key = decodeURIComponent(url.pathname.replace(/^\/api\/media\/file\//, ''));
  
  if (!key) {
    return c.json({ success: false, error: 'File key is required' }, 400);
  }
  
  const object = await bucket.get(key);
  if (!object) {
    return c.json({ success: false, error: 'File not found' }, 404);
  }
  
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  
  return new Response(object.body, {
    headers
  });
});

// GET /api/media - Retrieve all files in the registry (RBAC: SUPER_ADMIN, ADMIN, EDITOR)
mediaRouter.get('/', requireAuth(['SUPER_ADMIN', 'ADMIN', 'EDITOR']), async (c) => {
  const db = c.env.DB;
  const folder = c.req.query('folder') || '';
  
  let query = 'SELECT * FROM media';
  const params = [];
  
  if (folder) {
    query += ' WHERE folder = ?';
    params.push(folder);
  }
  
  query += ' ORDER BY created_at DESC';
  
  const mediaList = await db.prepare(query).bind(...params).all();
  return c.json({ success: true, data: mediaList.results });
});

// POST /api/media/upload - Upload file to R2 and registry (RBAC: SUPER_ADMIN, ADMIN, EDITOR)
mediaRouter.post('/upload', requireAuth(['SUPER_ADMIN', 'ADMIN', 'EDITOR']), async (c) => {
  const user = c.get('user');
  const db = c.env.DB;
  const bucket = c.env.BUCKET;
  
  const formData = await c.req.parseBody();
  const file = formData.file;
  const folder = formData.folder || 'paintings'; // paintings, thumbnails, collections, hero
  
  if (!file || !(file instanceof File)) {
    return c.json({ success: false, error: 'No valid file uploaded' }, 400);
  }
  
  // Validate file size (max 10MB)
  if (file.size > 10 * 1024 * 1024) {
    return c.json({ success: false, error: 'File size exceeds 10MB limit' }, 400);
  }
  
  // Validate file type (images only)
  if (!file.type.startsWith('image/')) {
    return c.json({ success: false, error: 'Only image uploads are permitted' }, 400);
  }
  
  const id = crypto.randomUUID();
  const cleanFilename = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '');
  const r2Key = `${folder}/${id}-${cleanFilename}`;
  
  // Read file data as arrayBuffer
  const fileBuffer = await file.arrayBuffer();
  
  // Put object in R2
  await bucket.put(r2Key, fileBuffer, {
    httpMetadata: {
      contentType: file.type,
      cacheControl: 'public, max-age=31536000, immutable'
    }
  });
  
  // Determine serving URL path
  // During local run, prefix with worker URL. In production, use absolute domain or dynamic URL builder
  const requestUrl = new URL(c.req.url);
  const serveUrl = `${requestUrl.origin}/api/media/file/${r2Key}`;
  
  // Write registry record
  await db.prepare(`
    INSERT INTO media (id, filename, r2_key, mime_type, size_bytes, folder, url)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id,
    file.name,
    r2Key,
    file.type,
    file.size,
    folder,
    serveUrl
  ).run();
  
  await logAudit(db, user.id, user.email, 'UPLOAD_MEDIA', 'media', id, { filename: file.name, r2_key: r2Key });
  
  return c.json({
    success: true,
    data: {
      id,
      filename: file.name,
      folder,
      mime_type: file.type,
      url: serveUrl,
      r2_key: r2Key
    }
  });
});

// DELETE /api/media/:id - Delete file from R2 and registry (RBAC: SUPER_ADMIN, ADMIN)
mediaRouter.delete('/:id', requireAuth(['SUPER_ADMIN', 'ADMIN']), async (c) => {
  const user = c.get('user');
  const db = c.env.DB;
  const bucket = c.env.BUCKET;
  const id = c.req.param('id');
  
  // Find registry details
  const mediaRecord = await db.prepare('SELECT * FROM media WHERE id = ?').bind(id).first();
  
  if (!mediaRecord) {
    return c.json({ success: false, error: 'Media file not found' }, 404);
  }
  
  // Delete from R2 Bucket
  try {
    await bucket.delete(mediaRecord.r2_key);
  } catch (err) {
    console.error('Failed to delete file from R2 bucket:', err);
  }
  
  // Delete database record
  await db.prepare('DELETE FROM media WHERE id = ?').bind(id).run();
  
  await logAudit(db, user.id, user.email, 'DELETE_MEDIA', 'media', id, { filename: mediaRecord.filename, r2_key: mediaRecord.r2_key });
  
  return c.json({ success: true, message: 'Media file deleted successfully' });
});
