import { Hono } from 'hono';
import { orderSchema } from 'schemas';
import { requireAuth, logAudit } from '../middleware/auth.js';

export const ordersRouter = new Hono();

// GET /api/orders - List all orders (RBAC: SUPER_ADMIN, ADMIN)
ordersRouter.get('/', requireAuth(['SUPER_ADMIN', 'ADMIN']), async (c) => {
  const db = c.env.DB;
  const status = c.req.query('status') || '';
  
  let query = `
    SELECT o.*, 
           COUNT(oi.id) as item_count
    FROM orders o
    LEFT JOIN order_items oi ON o.id = oi.order_id
    WHERE 1=1
  `;
  const params = [];
  
  if (status) {
    query += ' AND o.status = ?';
    params.push(status);
  }
  
  query += ' GROUP BY o.id ORDER BY o.created_at DESC';
  
  const orders = await db.prepare(query).bind(...params).all();
  return c.json({ success: true, data: orders.results });
});

// GET /api/orders/:id - Single order details with items (RBAC: SUPER_ADMIN, ADMIN)
ordersRouter.get('/:id', requireAuth(['SUPER_ADMIN', 'ADMIN']), async (c) => {
  const db = c.env.DB;
  const id = c.req.param('id');
  
  const order = await db.prepare('SELECT * FROM orders WHERE id = ?').bind(id).first();
  if (!order) {
    return c.json({ success: false, error: 'Order not found' }, 404);
  }
  
  // Get items
  const items = await db.prepare(`
    SELECT oi.*, p.title, p.slug, p.thumbnail_url, p.medium
    FROM order_items oi
    JOIN paintings p ON oi.painting_id = p.id
    WHERE oi.order_id = ?
  `).bind(id).all();
  
  return c.json({
    success: true,
    data: {
      ...order,
      items: items.results
    }
  });
});

// POST /api/orders - Public Checkout / Create Order
ordersRouter.post('/', async (c) => {
  const db = c.env.DB;
  const body = await c.req.json();
  
  // Validate request
  const result = orderSchema.safeParse(body);
  if (!result.success) {
    return c.json({ success: false, error: 'Validation failed', details: result.error.issues }, 400);
  }
  
  const orderData = result.data;
  const orderId = crypto.randomUUID();
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randNum = Math.floor(1000 + Math.random() * 9000);
  const orderNumber = `ART-${dateStr}-${randNum}`;
  
  try {
    // 1. Verify paintings are available
    const itemIds = orderData.items.map(item => item.painting_id);
    const placeholders = itemIds.map(() => '?').join(',');
    
    const paintings = await db.prepare(`
      SELECT id, title, price, availability, status
      FROM paintings
      WHERE id IN (${placeholders})
    `).bind(...itemIds).all();
    
    if (paintings.results.length !== itemIds.length) {
      return c.json({ success: false, error: 'One or more paintings in your cart do not exist.' }, 400);
    }
    
    // Check availability
    for (const p of paintings.results) {
      if (p.status !== 'PUBLISHED') {
        return c.json({ success: false, error: `"${p.title}" is not available for purchase.` }, 400);
      }
      if (p.availability !== 'AVAILABLE') {
        return c.json({ success: false, error: `"${p.title}" is already sold or reserved.` }, 400);
      }
    }
    
    // 2. Calculate sum total amount
    const totalAmount = paintings.results.reduce((acc, curr) => acc + curr.price, 0);
    
    // 3. Perform atomic batch operations
    const statements = [];
    
    // Create main order record
    statements.push(
      db.prepare(`
        INSERT INTO orders (
          id, order_number, customer_email, customer_first_name, customer_last_name, customer_phone,
          shipping_address, shipping_city, shipping_state, shipping_postal_code, shipping_country, total_amount, status, payment_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', 'UNPAID')
      `).bind(
        orderId,
        orderNumber,
        orderData.customer_email.toLowerCase(),
        orderData.customer_first_name,
        orderData.customer_last_name,
        orderData.customer_phone,
        orderData.shipping_address,
        orderData.shipping_city,
        orderData.shipping_state,
        orderData.shipping_postal_code,
        orderData.shipping_country,
        totalAmount
      )
    );
    
    // Create items & update paintings availability to 'SOLD'
    for (const p of paintings.results) {
      statements.push(
        db.prepare(`
          INSERT INTO order_items (id, order_id, painting_id, price)
          VALUES (?, ?, ?, ?)
        `).bind(crypto.randomUUID(), orderId, p.id, p.price)
      );
      
      statements.push(
        db.prepare(`
          UPDATE paintings
          SET availability = 'SOLD', updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).bind(p.id)
      );
    }
    
    await db.batch(statements);
    
    // Log Checkout Activity
    await logAudit(db, null, orderData.customer_email, 'CREATE_ORDER', 'order', orderId, { order_number: orderNumber, total: totalAmount });
    
    return c.json({
      success: true,
      message: 'Order created successfully',
      data: {
        id: orderId,
        order_number: orderNumber,
        total_amount: totalAmount
      }
    });
    
  } catch (err) {
    console.error('Checkout error:', err);
    return c.json({ success: false, error: 'Database transaction failed. Please try again.' }, 500);
  }
});

// PUT /api/orders/:id - Update Order Status (RBAC: SUPER_ADMIN, ADMIN)
ordersRouter.put('/:id', requireAuth(['SUPER_ADMIN', 'ADMIN']), async (c) => {
  const user = c.get('user');
  const db = c.env.DB;
  const id = c.req.param('id');
  const body = await c.req.json();
  
  const { status, payment_status } = body;
  
  const existing = await db.prepare('SELECT * FROM orders WHERE id = ?').bind(id).first();
  if (!existing) {
    return c.json({ success: false, error: 'Order not found' }, 404);
  }
  
  const statements = [];
  
  // Update state fields
  if (status && status !== existing.status) {
    statements.push(db.prepare('UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').bind(status, id));
    
    // If order is CANCELLED, release the paintings back to AVAILABLE
    if (status === 'CANCELLED') {
      const items = await db.prepare('SELECT painting_id FROM order_items WHERE order_id = ?').bind(id).all();
      for (const item of items.results) {
        statements.push(
          db.prepare('UPDATE paintings SET availability = \'AVAILABLE\', updated_at = CURRENT_TIMESTAMP WHERE id = ?').bind(item.painting_id)
        );
      }
    }
  }
  
  if (payment_status && payment_status !== existing.payment_status) {
    statements.push(db.prepare('UPDATE orders SET payment_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').bind(payment_status, id));
  }
  
  if (statements.length > 0) {
    await db.batch(statements);
    await logAudit(db, user.id, user.email, 'UPDATE_ORDER_STATUS', 'order', id, {
      old_status: existing.status,
      new_status: status || existing.status,
      old_payment: existing.payment_status,
      new_payment: payment_status || existing.payment_status
    });
  }
  
  return c.json({ success: true, message: 'Order status updated successfully' });
});
