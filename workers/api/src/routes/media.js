import { Hono } from 'hono';
import { requireAuth, logAudit } from '../middleware/auth.js';

export const mediaRouter = new Hono();

// GET /api/media/file/* - Public route to serve files directly from Cloudflare R2
mediaRouter.get('/file/*', async (c) => {
  const bucket = c.env.BUCKET;
  
  if (!bucket) {
    return c.json({ success: false, error: 'R2 storage bucket is not configured' }, 500);
  }
  
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

// POST /api/media/upload - Upload file to R2/Cloudinary and registry (RBAC: SUPER_ADMIN, ADMIN, EDITOR)
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
  const cloudName = c.env.CLOUDINARY_CLOUD_NAME;
  const uploadPreset = c.env.CLOUDINARY_UPLOAD_PRESET;
  
  let serveUrl = '';
  let storageKey = '';
  
  try {
    if (cloudName && uploadPreset) {
      // Cloudinary upload pipeline (unsigned)
      const uploadForm = new FormData();
      uploadForm.append('file', file);
      uploadForm.append('upload_preset', uploadPreset);
      uploadForm.append('folder', folder);
      
      const clRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: uploadForm
      });
      
      const clJson = await clRes.json();
      if (!clRes.ok || clJson.error) {
        return c.json({ success: false, error: clJson.error?.message || 'Cloudinary upload failed' }, 400);
      }
      
      serveUrl = clJson.secure_url;
      storageKey = clJson.public_id;
    } else if (bucket) {
      // R2 fallback pipeline
      const cleanFilename = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '');
      storageKey = `${folder}/${id}-${cleanFilename}`;
      const fileBuffer = await file.arrayBuffer();
      
      await bucket.put(storageKey, fileBuffer, {
        httpMetadata: {
          contentType: file.type,
          cacheControl: 'public, max-age=31536000, immutable'
        }
      });
      
      const requestUrl = new URL(c.req.url);
      serveUrl = `${requestUrl.origin}/api/media/file/${storageKey}`;
    } else {
      return c.json({ success: false, error: 'Storage not configured. Bind an R2 bucket or provide Cloudinary environment variables.' }, 500);
    }
    
    // Write registry record
    await db.prepare(`
      INSERT INTO media (id, filename, r2_key, mime_type, size_bytes, folder, url)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      file.name,
      storageKey,
      file.type,
      file.size,
      folder,
      serveUrl
    ).run();
    
    await logAudit(db, user.id, user.email, 'UPLOAD_MEDIA', 'media', id, { filename: file.name, r2_key: storageKey });
    
    return c.json({
      success: true,
      data: {
        id,
        filename: file.name,
        folder,
        mime_type: file.type,
        url: serveUrl,
        r2_key: storageKey
      }
    });
  } catch (err) {
    console.error('Upload error:', err);
    return c.json({ success: false, error: err.message || 'Media upload failed' }, 500);
  }
});

// DELETE /api/media/:id - Delete file from storage and registry (RBAC: SUPER_ADMIN, ADMIN)
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
  
  const cloudName = c.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = c.env.CLOUDINARY_API_KEY;
  const apiSecret = c.env.CLOUDINARY_API_SECRET;
  
  try {
    if (cloudName && apiKey && apiSecret) {
      // Cloudinary destroy signed pipeline
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const publicId = mediaRecord.r2_key;
      
      const dataToSign = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
      const msgUint8 = new TextEncoder().encode(dataToSign);
      const hashBuffer = await crypto.subtle.digest('SHA-1', msgUint8);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      const destroyForm = new FormData();
      destroyForm.append('public_id', publicId);
      destroyForm.append('timestamp', timestamp);
      destroyForm.append('api_key', apiKey);
      destroyForm.append('signature', signature);
      
      const clRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
        method: 'POST',
        body: destroyForm
      });
      const clJson = await clRes.json();
      console.log('Cloudinary destroy response:', clJson);
    } else if (bucket) {
      // R2 destroy
      await bucket.delete(mediaRecord.r2_key);
    }
  } catch (err) {
    console.error('Failed to delete file from storage provider:', err);
  }
  
  // Delete database record
  await db.prepare('DELETE FROM media WHERE id = ?').bind(id).run();
  
  await logAudit(db, user.id, user.email, 'DELETE_MEDIA', 'media', id, { filename: mediaRecord.filename, r2_key: mediaRecord.r2_key });
  
  return c.json({ success: true, message: 'Media file deleted successfully' });
});
