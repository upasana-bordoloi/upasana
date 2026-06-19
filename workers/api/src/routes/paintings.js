import { Hono } from 'hono';
import { verify } from 'hono/jwt';
import { getCookie } from 'hono/cookie';
import { paintingSchema, categorySchema, collectionSchema } from 'schemas';
import { slugify, getPaginationParams } from 'utils';
import { requireAuth, logAudit } from '../middleware/auth.js';

export const paintingsRouter = new Hono();

// GET /api/paintings - Paginated List with search and filtering
paintingsRouter.get('/', async (c) => {
  const db = c.env.DB;
  const { page, limit, offset } = getPaginationParams(c.req.url);
  const searchParams = new URL(c.req.url).searchParams;
  
  const search = searchParams.get('search') || '';
  const medium = searchParams.get('medium') || '';
  const minPrice = parseFloat(searchParams.get('minPrice') || '0');
  const maxPrice = parseFloat(searchParams.get('maxPrice') || '99999999');
  const category = searchParams.get('category') || '';
  const collection = searchParams.get('collection') || '';
  const featured = searchParams.get('featured') || '';
  const availability = searchParams.get('availability') || '';
  
  // Role checking for unpublished status
  const authHeader = c.req.header('Authorization');
  let token = '';
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else {
    token = getCookie(c, 'token');
  }

  let isAdmin = false;
  if (token) {
    try {
      const decoded = await verify(token, c.env.JWT_SECRET, 'HS256');
      if (decoded && ['SUPER_ADMIN', 'ADMIN', 'EDITOR'].includes(decoded.role)) {
        isAdmin = true;
      }
    } catch (e) {
      // Invalid or expired token
    }
  }
  
  const statusFilter = searchParams.get('status') || (isAdmin ? '' : 'PUBLISHED');
  
  const sort = searchParams.get('sort') || 'newest'; // newest, price-asc, price-desc, title-asc
  
  // Construct Query
  let query = `
    SELECT p.*, 
           GROUP_CONCAT(c.slug) as categories,
           GROUP_CONCAT(col.slug) as collections
    FROM paintings p
    LEFT JOIN painting_categories pc ON p.id = pc.painting_id
    LEFT JOIN categories c ON pc.category_id = c.id
    LEFT JOIN painting_collections pcol ON p.id = pcol.painting_id
    LEFT JOIN collections col ON pcol.collection_id = col.id
    WHERE 1=1
  `;
  
  const params = [];
  
  if (statusFilter) {
    query += ` AND p.status = ? `;
    params.push(statusFilter);
  }
  if (search) {
    query += ` AND (p.title LIKE ? OR p.description LIKE ? OR p.story LIKE ?) `;
    const term = `%${search}%`;
    params.push(term, term, term);
  }
  if (medium) {
    query += ` AND p.medium = ? `;
    params.push(medium);
  }
  if (featured === 'true' || featured === '1') {
    query += ` AND p.featured = 1 `;
  }
  if (availability) {
    query += ` AND p.availability = ? `;
    params.push(availability);
  }
  if (minPrice > 0) {
    query += ` AND p.price >= ? `;
    params.push(minPrice);
  }
  if (maxPrice < 99999999) {
    query += ` AND p.price <= ? `;
    params.push(maxPrice);
  }
  if (category) {
    query += ` AND c.slug = ? `;
    params.push(category);
  }
  if (collection) {
    query += ` AND col.slug = ? `;
    params.push(collection);
  }
  
  query += ` GROUP BY p.id `;
  
  // Sorting
  switch (sort) {
    case 'price-asc':
      query += ` ORDER BY p.price ASC `;
      break;
    case 'price-desc':
      query += ` ORDER BY p.price DESC `;
      break;
    case 'title-asc':
      query += ` ORDER BY p.title ASC `;
      break;
    case 'title-desc':
      query += ` ORDER BY p.title DESC `;
      break;
    case 'oldest':
      query += ` ORDER BY p.year_created ASC, p.created_at ASC `;
      break;
    case 'newest':
    default:
      query += ` ORDER BY p.year_created DESC, p.created_at DESC `;
      break;
  }
  
  // Pagination
  query += ` LIMIT ? OFFSET ? `;
  params.push(limit, offset);
  
  // Execute paginated records fetch
  const paintings = await db.prepare(query).bind(...params).all();
  
  // Count query
  let countQuery = `
    SELECT COUNT(DISTINCT p.id) as total
    FROM paintings p
    LEFT JOIN painting_categories pc ON p.id = pc.painting_id
    LEFT JOIN categories c ON pc.category_id = c.id
    LEFT JOIN painting_collections pcol ON p.id = pcol.painting_id
    LEFT JOIN collections col ON pcol.collection_id = col.id
    WHERE 1=1
  `;
  const countParams = [];
  
  if (statusFilter) {
    countQuery += ` AND p.status = ? `;
    countParams.push(statusFilter);
  }
  if (search) {
    countQuery += ` AND (p.title LIKE ? OR p.description LIKE ? OR p.story LIKE ?) `;
    const term = `%${search}%`;
    countParams.push(term, term, term);
  }
  if (medium) {
    countQuery += ` AND p.medium = ? `;
    countParams.push(medium);
  }
  if (featured === 'true' || featured === '1') {
    countQuery += ` AND p.featured = 1 `;
  }
  if (availability) {
    countQuery += ` AND p.availability = ? `;
    countParams.push(availability);
  }
  if (minPrice > 0) {
    countQuery += ` AND p.price >= ? `;
    countParams.push(minPrice);
  }
  if (maxPrice < 99999999) {
    countQuery += ` AND p.price <= ? `;
    countParams.push(maxPrice);
  }
  if (category) {
    countQuery += ` AND c.slug = ? `;
    countParams.push(category);
  }
  if (collection) {
    countQuery += ` AND col.slug = ? `;
    countParams.push(collection);
  }
  
  const countResult = await db.prepare(countQuery).bind(...countParams).first();
  const total = countResult ? countResult.total : 0;
  
  return c.json({
    success: true,
    data: paintings.results,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

// GET /api/paintings/categories - List all categories
paintingsRouter.get('/categories', async (c) => {
  const db = c.env.DB;
  const categories = await db.prepare('SELECT * FROM categories ORDER BY name ASC').all();
  return c.json({ success: true, data: categories.results });
});

// GET /api/paintings/collections - List all collections
paintingsRouter.get('/collections', async (c) => {
  const db = c.env.DB;
  const collections = await db.prepare('SELECT * FROM collections ORDER BY name ASC').all();
  return c.json({ success: true, data: collections.results });
});

// POST /api/paintings/categories - Create Category (RBAC: SUPER_ADMIN, ADMIN)
paintingsRouter.post('/categories', requireAuth(['SUPER_ADMIN', 'ADMIN']), async (c) => {
  const db = c.env.DB;
  const body = await c.req.json();
  if (!body.slug && body.name) {
    body.slug = slugify(body.name);
  }
  const result = categorySchema.safeParse(body);
  if (!result.success) {
    return c.json({ success: false, error: 'Validation failed', details: result.error.issues }, 400);
  }
  const { slug, name, description, images } = result.data;
  const id = result.data.id || crypto.randomUUID();

  await db.prepare(`
    INSERT INTO categories (id, slug, name, description, images)
    VALUES (?, ?, ?, ?, ?)
  `).bind(id, slug, name, description || null, images || null).run();

  return c.json({ success: true, message: 'Category created successfully', data: { id, slug, name, description, images } });
});

// PUT /api/paintings/categories/:id - Update Category (RBAC: SUPER_ADMIN, ADMIN)
paintingsRouter.put('/categories/:id', requireAuth(['SUPER_ADMIN', 'ADMIN']), async (c) => {
  const db = c.env.DB;
  const id = c.req.param('id');
  const body = await c.req.json();
  if (!body.slug && body.name) {
    body.slug = slugify(body.name);
  }
  const result = categorySchema.safeParse({ ...body, id });
  if (!result.success) {
    return c.json({ success: false, error: 'Validation failed', details: result.error.issues }, 400);
  }
  const { slug, name, description, images } = result.data;

  const existing = await db.prepare('SELECT id FROM categories WHERE id = ?').bind(id).first();
  if (!existing) {
    return c.json({ success: false, error: 'Category not found' }, 404);
  }

  await db.prepare(`
    UPDATE categories
    SET slug = ?, name = ?, description = ?, images = ?
    WHERE id = ?
  `).bind(slug, name, description || null, images || null, id).run();

  return c.json({ success: true, message: 'Category updated successfully', data: { id, slug, name, description, images } });
});

// DELETE /api/paintings/categories/:id - Delete Category (RBAC: SUPER_ADMIN, ADMIN)
paintingsRouter.delete('/categories/:id', requireAuth(['SUPER_ADMIN', 'ADMIN']), async (c) => {
  const db = c.env.DB;
  const id = c.req.param('id');

  const existing = await db.prepare('SELECT name FROM categories WHERE id = ?').bind(id).first();
  if (!existing) {
    return c.json({ success: false, error: 'Category not found' }, 404);
  }

  await db.batch([
    db.prepare(`DELETE FROM painting_categories WHERE category_id = ?`).bind(id),
    db.prepare(`DELETE FROM categories WHERE id = ?`).bind(id)
  ]);

  return c.json({ success: true, message: 'Category deleted successfully' });
});

// POST /api/paintings/collections - Create Collection (RBAC: SUPER_ADMIN, ADMIN)
paintingsRouter.post('/collections', requireAuth(['SUPER_ADMIN', 'ADMIN']), async (c) => {
  const db = c.env.DB;
  const body = await c.req.json();
  if (!body.slug && body.name) {
    body.slug = slugify(body.name);
  }
  const result = collectionSchema.safeParse(body);
  if (!result.success) {
    return c.json({ success: false, error: 'Validation failed', details: result.error.issues }, 400);
  }
  const { slug, name, description, image_url } = result.data;
  const id = result.data.id || crypto.randomUUID();

  await db.prepare(`
    INSERT INTO collections (id, slug, name, description, image_url)
    VALUES (?, ?, ?, ?, ?)
  `).bind(id, slug, name, description || null, image_url || null).run();

  return c.json({ success: true, message: 'Collection created successfully', data: { id, slug, name, description, image_url } });
});

// PUT /api/paintings/collections/:id - Update Collection (RBAC: SUPER_ADMIN, ADMIN)
paintingsRouter.put('/collections/:id', requireAuth(['SUPER_ADMIN', 'ADMIN']), async (c) => {
  const db = c.env.DB;
  const id = c.req.param('id');
  const body = await c.req.json();
  if (!body.slug && body.name) {
    body.slug = slugify(body.name);
  }
  const result = collectionSchema.safeParse({ ...body, id });
  if (!result.success) {
    return c.json({ success: false, error: 'Validation failed', details: result.error.issues }, 400);
  }
  const { slug, name, description, image_url } = result.data;

  const existing = await db.prepare('SELECT id FROM collections WHERE id = ?').bind(id).first();
  if (!existing) {
    return c.json({ success: false, error: 'Collection not found' }, 404);
  }

  await db.prepare(`
    UPDATE collections
    SET slug = ?, name = ?, description = ?, image_url = ?
    WHERE id = ?
  `).bind(slug, name, description || null, image_url || null, id).run();

  return c.json({ success: true, message: 'Collection updated successfully', data: { id, slug, name, description, image_url } });
});

// DELETE /api/paintings/collections/:id - Delete Collection (RBAC: SUPER_ADMIN, ADMIN)
paintingsRouter.delete('/collections/:id', requireAuth(['SUPER_ADMIN', 'ADMIN']), async (c) => {
  const db = c.env.DB;
  const id = c.req.param('id');

  const existing = await db.prepare('SELECT name FROM collections WHERE id = ?').bind(id).first();
  if (!existing) {
    return c.json({ success: false, error: 'Collection not found' }, 404);
  }

  await db.batch([
    db.prepare(`DELETE FROM painting_collections WHERE collection_id = ?`).bind(id),
    db.prepare(`DELETE FROM collections WHERE id = ?`).bind(id)
  ]);

  return c.json({ success: true, message: 'Collection deleted successfully' });
});

// GET /api/paintings/:slug - Single Painting details
paintingsRouter.get('/:slug', async (c) => {
  const db = c.env.DB;
  const slug = c.req.param('slug');
  
  const painting = await db.prepare(`
    SELECT p.*,
           c.id as category_id, c.name as category_name, c.slug as category_slug,
           col.id as collection_id, col.name as collection_name, col.slug as collection_slug
    FROM paintings p
    LEFT JOIN painting_categories pc ON p.id = pc.painting_id
    LEFT JOIN categories c ON pc.category_id = c.id
    LEFT JOIN painting_collections pcol ON p.id = pcol.painting_id
    LEFT JOIN collections col ON pcol.collection_id = col.id
    WHERE p.slug = ?
    LIMIT 1
  `).bind(slug).first();
  
  if (!painting) {
    return c.json({ success: false, error: 'Painting not found' }, 404);
  }
  
  // Get 4 related paintings (same medium or same category, status = PUBLISHED)
  const related = await db.prepare(`
    SELECT DISTINCT p.id, p.title, p.slug, p.price, p.thumbnail_url, p.medium, p.width, p.height, p.availability
    FROM paintings p
    LEFT JOIN painting_categories pc ON p.id = pc.painting_id
    WHERE p.status = 'PUBLISHED' 
      AND p.id != ? 
      AND (p.medium = ? OR pc.category_id = ?)
    LIMIT 4
  `).bind(painting.id, painting.medium, painting.category_id).all();
  
  return c.json({
    success: true,
    data: {
      ...painting,
      related: related.results
    }
  });
});

// POST /api/paintings - Create Painting (RBAC: SUPER_ADMIN, ADMIN, EDITOR)
paintingsRouter.post('/', requireAuth(['SUPER_ADMIN', 'ADMIN', 'EDITOR']), async (c) => {
  const user = c.get('user');
  const db = c.env.DB;
  const body = await c.req.json();
  
  // Auto-generate slug if missing
  if (!body.slug && body.title) {
    body.slug = slugify(body.title);
  }
  
  const result = paintingSchema.safeParse(body);
  if (!result.success) {
    return c.json({ success: false, error: 'Validation failed', details: result.error.issues }, 400);
  }
  
  const painting = result.data;
  const paintingId = painting.id || crypto.randomUUID();
  
  // Start D1 batch statements
  const statements = [
    db.prepare(`
      INSERT INTO paintings (
        id, slug, title, story, description, price, currency, medium, width, height, year_created, status, featured, availability, thumbnail_url, image_url, additional_images, seo_title, seo_description, og_image
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      paintingId,
      painting.slug,
      painting.title,
      painting.story || null,
      painting.description,
      painting.price,
      painting.currency || 'USD',
      painting.medium,
      painting.width,
      painting.height,
      painting.year_created,
      painting.status,
      painting.featured ? 1 : 0,
      painting.availability,
      painting.thumbnail_url || null,
      painting.image_url || null,
      painting.additional_images || null,
      painting.seo_title || painting.title,
      painting.seo_description || painting.description.substring(0, 155),
      painting.og_image || painting.image_url || null
    )
  ];
  
  // Link categories
  if (body.category_id) {
    statements.push(
      db.prepare(`INSERT INTO painting_categories (painting_id, category_id) VALUES (?, ?)`).bind(paintingId, body.category_id)
    );
  }
  
  // Link collections
  if (body.collection_id) {
    statements.push(
      db.prepare(`INSERT INTO painting_collections (painting_id, collection_id) VALUES (?, ?)`).bind(paintingId, body.collection_id)
    );
  }
  
  await db.batch(statements);
  
  await logAudit(db, user.id, user.email, 'CREATE_PAINTING', 'painting', paintingId, { title: painting.title });
  
  return c.json({
    success: true,
    message: 'Painting created successfully',
    data: { id: paintingId, ...painting }
  });
});

// PUT /api/paintings/:id - Edit Painting (RBAC: SUPER_ADMIN, ADMIN, EDITOR)
paintingsRouter.put('/:id', requireAuth(['SUPER_ADMIN', 'ADMIN', 'EDITOR']), async (c) => {
  const user = c.get('user');
  const db = c.env.DB;
  const id = c.req.param('id');
  const body = await c.req.json();
  
  // Retrieve existing record for audits
  const existing = await db.prepare('SELECT * FROM paintings WHERE id = ?').bind(id).first();
  if (!existing) {
    return c.json({ success: false, error: 'Painting not found' }, 404);
  }
  
  if (!body.slug && body.title) {
    body.slug = slugify(body.title);
  }
  
  const result = paintingSchema.safeParse({ ...body, id });
  if (!result.success) {
    return c.json({ success: false, error: 'Validation failed', details: result.error.issues }, 400);
  }
  
  const painting = result.data;
  
  const statements = [
    db.prepare(`
      UPDATE paintings
      SET slug = ?, title = ?, story = ?, description = ?, price = ?, currency = ?, medium = ?, width = ?, height = ?, year_created = ?, status = ?, featured = ?, availability = ?, thumbnail_url = ?, image_url = ?, additional_images = ?, seo_title = ?, seo_description = ?, og_image = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      painting.slug,
      painting.title,
      painting.story || null,
      painting.description,
      painting.price,
      painting.currency || 'USD',
      painting.medium,
      painting.width,
      painting.height,
      painting.year_created,
      painting.status,
      painting.featured ? 1 : 0,
      painting.availability,
      painting.thumbnail_url || null,
      painting.image_url || null,
      painting.additional_images || null,
      painting.seo_title || null,
      painting.seo_description || null,
      painting.og_image || null,
      id
    )
  ];
  
  // Refresh category links
  statements.push(db.prepare(`DELETE FROM painting_categories WHERE painting_id = ?`).bind(id));
  if (body.category_id) {
    statements.push(db.prepare(`INSERT INTO painting_categories (painting_id, category_id) VALUES (?, ?)`).bind(id, body.category_id));
  }
  
  // Refresh collection links
  statements.push(db.prepare(`DELETE FROM painting_collections WHERE painting_id = ?`).bind(id));
  if (body.collection_id) {
    statements.push(db.prepare(`INSERT INTO painting_collections (painting_id, collection_id) VALUES (?, ?)`).bind(id, body.collection_id));
  }
  
  await db.batch(statements);
  
  // Detail audit modifications
  const changes = {};
  if (existing.price !== painting.price) {
    changes.price = { old: existing.price, new: painting.price };
    await logAudit(db, user.id, user.email, 'PRICE_CHANGE', 'painting', id, changes.price);
  }
  if (existing.story !== painting.story) {
    changes.story = { old: existing.story, new: painting.story };
    await logAudit(db, user.id, user.email, 'STORY_CHANGE', 'painting', id, changes.story);
  }
  if (existing.seo_title !== painting.seo_title || existing.seo_description !== painting.seo_description) {
    changes.seo = { title: painting.seo_title, description: painting.seo_description };
    await logAudit(db, user.id, user.email, 'SEO_CHANGE', 'painting', id, changes.seo);
  }
  
  await logAudit(db, user.id, user.email, 'UPDATE_PAINTING', 'painting', id, { title: painting.title });
  
  return c.json({
    success: true,
    message: 'Painting updated successfully',
    data: painting
  });
});

// DELETE /api/paintings/:id - Delete Painting (RBAC: SUPER_ADMIN, ADMIN)
paintingsRouter.delete('/:id', requireAuth(['SUPER_ADMIN', 'ADMIN']), async (c) => {
  const user = c.get('user');
  const db = c.env.DB;
  const id = c.req.param('id');
  
  const existing = await db.prepare('SELECT title FROM paintings WHERE id = ?').bind(id).first();
  if (!existing) {
    return c.json({ success: false, error: 'Painting not found' }, 404);
  }
  
  // Delete cascading mapping and paintings
  await db.batch([
    db.prepare(`DELETE FROM painting_categories WHERE painting_id = ?`).bind(id),
    db.prepare(`DELETE FROM painting_collections WHERE painting_id = ?`).bind(id),
    db.prepare(`DELETE FROM paintings WHERE id = ?`).bind(id)
  ]);
  
  await logAudit(db, user.id, user.email, 'DELETE_PAINTING', 'painting', id, { title: existing.title });
  
  return c.json({ success: true, message: 'Painting deleted successfully' });
});

// POST /api/paintings/bulk-import - Bulk Import (RBAC: SUPER_ADMIN, ADMIN)
paintingsRouter.post('/bulk-import', requireAuth(['SUPER_ADMIN', 'ADMIN']), async (c) => {
  const user = c.get('user');
  const db = c.env.DB;
  const { paintings } = await c.req.json();
  
  if (!Array.isArray(paintings)) {
    return c.json({ success: false, error: 'Payload must contain a list of paintings' }, 400);
  }
  
  const statements = [];
  const importedTitles = [];
  
  for (const item of paintings) {
    // Generate UUID and slug if missing
    const paintingId = item.id || crypto.randomUUID();
    const slug = item.slug || slugify(item.title);
    
    statements.push(
      db.prepare(`
        INSERT INTO paintings (
          id, slug, title, story, description, price, currency, medium, width, height, year_created, status, featured, availability, thumbnail_url, image_url, additional_images, seo_title, seo_description, og_image
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        paintingId,
        slug,
        item.title,
        item.story || null,
        item.description,
        item.price,
        item.currency || 'USD',
        item.medium,
        item.width,
        item.height,
        item.year_created,
        item.status || 'DRAFT',
        item.featured ? 1 : 0,
        item.availability || 'AVAILABLE',
        item.thumbnail_url || null,
        item.image_url || null,
        item.additional_images || null,
        item.seo_title || item.title,
        item.seo_description || item.description?.substring(0, 155) || null,
        item.og_image || item.image_url || null
      )
    );
    importedTitles.push(item.title);
  }
  
  await db.batch(statements);
  await logAudit(db, user.id, user.email, 'BULK_IMPORT_PAINTINGS', 'painting', null, { count: paintings.length, titles: importedTitles });
  
  return c.json({ success: true, message: `Successfully imported ${paintings.length} paintings.` });
});

// GET /api/paintings/export - Export All (RBAC: SUPER_ADMIN, ADMIN)
paintingsRouter.get('/export/all', requireAuth(['SUPER_ADMIN', 'ADMIN']), async (c) => {
  const db = c.env.DB;
  const paintings = await db.prepare(`
    SELECT p.*,
           GROUP_CONCAT(c.name) as category_names,
           GROUP_CONCAT(col.name) as collection_names
    FROM paintings p
    LEFT JOIN painting_categories pc ON p.id = pc.painting_id
    LEFT JOIN categories c ON pc.category_id = c.id
    LEFT JOIN painting_collections pcol ON p.id = pcol.painting_id
    LEFT JOIN collections col ON pcol.collection_id = col.id
    GROUP BY p.id
    ORDER BY p.created_at DESC
  `).all();
  
  return c.json({ success: true, data: paintings.results });
});
