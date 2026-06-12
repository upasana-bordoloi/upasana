-- SQLite Schema for Artist E-Commerce Platform (Cloudflare D1)

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  is_active INTEGER DEFAULT 1, -- 0 = False, 1 = True
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Roles Table
CREATE TABLE IF NOT EXISTS roles (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL, -- 'SUPER_ADMIN', 'ADMIN', 'EDITOR'
  description TEXT
);

-- 3. Permissions Table
CREATE TABLE IF NOT EXISTS permissions (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL, -- 'FULL_ACCESS', 'MANAGE_SETTINGS', 'MANAGE_PAINTINGS', 'MANAGE_ORDERS', 'MANAGE_MEDIA', 'MANAGE_USERS'
  description TEXT
);

-- 4. Role Permissions Mapping
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id TEXT,
  permission_id TEXT,
  PRIMARY KEY (role_id, permission_id),
  FOREIGN KEY(role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY(permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

-- 5. User Roles Mapping
CREATE TABLE IF NOT EXISTS user_roles (
  user_id TEXT,
  role_id TEXT,
  PRIMARY KEY (user_id, role_id),
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY(role_id) REFERENCES roles(id) ON DELETE CASCADE
);

-- 6. Paintings Table
CREATE TABLE IF NOT EXISTS paintings (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  story TEXT,
  description TEXT NOT NULL,
  price REAL NOT NULL,
  currency TEXT DEFAULT 'USD',
  medium TEXT NOT NULL,
  width REAL NOT NULL,
  height REAL NOT NULL,
  year_created INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'DRAFT', -- 'DRAFT', 'PUBLISHED', 'ARCHIVED'
  featured INTEGER DEFAULT 0, -- 0 = False, 1 = True
  availability TEXT NOT NULL DEFAULT 'AVAILABLE', -- 'AVAILABLE', 'SOLD', 'RESERVED'
  thumbnail_url TEXT,
  image_url TEXT,
  seo_title TEXT,
  seo_description TEXT,
  og_image TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 7. Categories Table
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT
);

-- 8. Painting Categories Mapping
CREATE TABLE IF NOT EXISTS painting_categories (
  painting_id TEXT,
  category_id TEXT,
  PRIMARY KEY (painting_id, category_id),
  FOREIGN KEY(painting_id) REFERENCES paintings(id) ON DELETE CASCADE,
  FOREIGN KEY(category_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- 9. Collections Table
CREATE TABLE IF NOT EXISTS collections (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT
);

-- 10. Painting Collections Mapping
CREATE TABLE IF NOT EXISTS painting_collections (
  painting_id TEXT,
  collection_id TEXT,
  PRIMARY KEY (painting_id, collection_id),
  FOREIGN KEY(painting_id) REFERENCES paintings(id) ON DELETE CASCADE,
  FOREIGN KEY(collection_id) REFERENCES collections(id) ON DELETE CASCADE
);

-- 11. Media Library Table
CREATE TABLE IF NOT EXISTS media (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  r2_key TEXT UNIQUE NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  folder TEXT DEFAULT 'paintings', -- 'paintings', 'thumbnails', 'collections', 'hero'
  url TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 12. Orders Table
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  customer_email TEXT NOT NULL,
  customer_first_name TEXT NOT NULL,
  customer_last_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  shipping_address TEXT NOT NULL,
  shipping_city TEXT NOT NULL,
  shipping_state TEXT NOT NULL,
  shipping_postal_code TEXT NOT NULL,
  shipping_country TEXT NOT NULL,
  total_amount REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'
  payment_status TEXT NOT NULL DEFAULT 'UNPAID', -- 'UNPAID', 'PAID', 'REFUNDED'
  stripe_payment_intent_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 13. Order Items Table
CREATE TABLE IF NOT EXISTS order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  painting_id TEXT NOT NULL,
  price REAL NOT NULL,
  FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY(painting_id) REFERENCES paintings(id)
);

-- 14. Site Settings Table
CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- 15. Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  user_email TEXT,
  action TEXT NOT NULL, -- 'LOGIN', 'LOGOUT', 'CREATE_PAINTING', 'UPDATE_PAINTING', etc.
  entity_type TEXT,
  entity_id TEXT,
  details TEXT, -- JSON string
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 16. SEO Redirects Table
CREATE TABLE IF NOT EXISTS redirects (
  id TEXT PRIMARY KEY,
  source_url TEXT UNIQUE NOT NULL,
  target_url TEXT NOT NULL,
  status_code INTEGER DEFAULT 301,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 17. Sessions (Token Blacklist / Refresh Token Management)
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 18. Contact Form Messages
CREATE TABLE IF NOT EXISTS contact_messages (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read INTEGER DEFAULT 0, -- 0 = Unread, 1 = Read
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- INDEX OPTIMIZATIONS FOR 10,000+ PAINTINGS
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_paintings_status_availability ON paintings(status, availability);
CREATE INDEX IF NOT EXISTS idx_paintings_featured ON paintings(featured);
CREATE INDEX IF NOT EXISTS idx_paintings_slug ON paintings(slug);
CREATE INDEX IF NOT EXISTS idx_paintings_price ON paintings(price);
CREATE INDEX IF NOT EXISTS idx_paintings_year ON paintings(year_created);

CREATE INDEX IF NOT EXISTS idx_painting_categories_cat ON painting_categories(category_id);
CREATE INDEX IF NOT EXISTS idx_painting_collections_coll ON painting_collections(collection_id);

CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON contact_messages(created_at);
