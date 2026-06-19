-- Seed Data for Artist E-Commerce Platform

-- Insert Default Roles
INSERT INTO roles (id, name, description) VALUES
('role_super_admin', 'SUPER_ADMIN', 'Full control over the entire system, including user management and system settings.'),
('role_admin', 'ADMIN', 'Can manage paintings, orders, categories, collections, and media assets.'),
('role_editor', 'EDITOR', 'Can manage and edit painting listings and descriptions.');

-- Insert Default Permissions
INSERT INTO permissions (id, name, description) VALUES
('perm_full', 'FULL_ACCESS', 'Access to all administrative operations.'),
('perm_settings', 'MANAGE_SETTINGS', 'Modify system-wide website configurations.'),
('perm_paintings', 'MANAGE_PAINTINGS', 'Add, modify, and delete paintings.'),
('perm_orders', 'MANAGE_ORDERS', 'View and update order details and statuses.'),
('perm_media', 'MANAGE_MEDIA', 'Upload and delete images and other assets.'),
('perm_users', 'MANAGE_USERS', 'Manage administrator accounts and roles.');

-- Associate Roles with Permissions
-- SUPER_ADMIN has everything
INSERT INTO role_permissions (role_id, permission_id) VALUES
('role_super_admin', 'perm_full'),
('role_super_admin', 'perm_settings'),
('role_super_admin', 'perm_paintings'),
('role_super_admin', 'perm_orders'),
('role_super_admin', 'perm_media'),
('role_super_admin', 'perm_users');

-- ADMIN has settings, paintings, orders, media
INSERT INTO role_permissions (role_id, permission_id) VALUES
('role_admin', 'perm_settings'),
('role_admin', 'perm_paintings'),
('role_admin', 'perm_orders'),
('role_admin', 'perm_media');

-- EDITOR only has paintings
INSERT INTO role_permissions (role_id, permission_id) VALUES
('role_editor', 'perm_paintings');

-- Insert Default Super Admin User (password: AdminPass123!)
INSERT INTO users (id, email, name, password_hash, is_active) VALUES
('usr_super_admin', 'superadmin@gallery.com', 'Super Admin', 'pbkdf2_sha256$100000$86d2f0397827e8d8aab955c407753a81$ec38646b8dea347665d6b4fb3eb126e37649248fe21bae130c922c8042aad1c2', 1);


-- Associate Super Admin User with SUPER_ADMIN role
INSERT INTO user_roles (user_id, role_id) VALUES
('usr_super_admin', 'role_super_admin');

-- Insert Default Categories
INSERT INTO categories (id, slug, name, description, images) VALUES
('cat_oil', 'oil-paintings', 'Oil on Canvas', 'Original paintings rendered in traditional oil paints on premium linen or cotton canvas. For custom orders, email us at oil-commissions@upasana-art.com', '["https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=600&q=80","https://images.unsplash.com/photo-1579783928621-7a13d66a62d1?auto=format&fit=crop&w=600&q=80","https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=600&q=80"]'),
('cat_watercolor', 'watercolors', 'Watercolor', 'Delicate and fluid works using fine pigments on archival paper. For pricing and shipping queries, contact watercolor-sales@upasana-art.com', '["https://images.unsplash.com/photo-1579783929004-fa79c8cd9693?auto=format&fit=crop&w=600&q=80","https://images.unsplash.com/photo-1579783901586-d88db74b4fe4?auto=format&fit=crop&w=600&q=80"]'),
('cat_acrylic', 'acrylics', 'Acrylic on Canvas', 'Vibrant, modern acrylic works combining texture and mixed media techniques. Direct inquiries to acrylic-showcase@upasana-art.com', '["https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80","https://images.unsplash.com/photo-1505118380757-91f5f5632de0?auto=format&fit=crop&w=600&q=80"]'),
('cat_mixed', 'mixed-media', 'Mixed Media', 'Experimentations with sand textures, palette knives, and organic materials. Email inquiries to mixed-media-studio@upasana-art.com', '["https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=600&q=80","https://images.unsplash.com/photo-1549887534-1541e9326642?auto=format&fit=crop&w=600&q=80"]');

-- Insert Default Collections
INSERT INTO collections (id, slug, name, description, image_url) VALUES
('coll_monsoon', 'monsoon-memories', 'Monsoon Memories', 'A nostalgic series capturing the dramatic rains and reflective streets of the subcontinent.', 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=600&q=80'),
('coll_woodland', 'woodland-whispers', 'Woodland Whispers', 'Deep forest landscapes exploring lighting, shadow, and nature''s silence.', 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=600&q=80'),
('coll_abstract', 'abstract-expressions', 'Abstract Expressions', 'Non-representational emotional journeys rendered through aggressive texturing and muted palettes.', 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=600&q=80');

-- Insert Sample Paintings
INSERT INTO paintings (
  id, slug, title, story, description, price, currency, medium, width, height, year_created, status, featured, availability, thumbnail_url, image_url, seo_title, seo_description, og_image
) VALUES
(
  'p_monsoon_memories',
  'monsoon-memories-i',
  'Monsoon Memories I',
  'This piece was conceived during a heavy downpour in Kerala. Watching the rain drum against the windowpane and wash over the terracotta roofs inspired this synthesis of water and clay.',
  'An original oil painting capturing the sensory atmosphere of monsoon rains. Rich texture, layers of cobalt blues, burnt siennas, and soft highlights of white oil pigment.',
  2400.00,
  'USD',
  'Oil on Canvas',
  36.0,
  48.0,
  2025,
  'PUBLISHED',
  1,
  'AVAILABLE',
  'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=1200&q=80',
  'Monsoon Memories I - Original Oil Painting by Artist',
  'Buy Monsoon Memories I, an original oil painting capturing the atmosphere of monsoon rains. 36x48 inches, custom stretched canvas.',
  'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=1200&q=80'
),
(
  'p_the_red_tree',
  'the-red-tree',
  'The Red Tree',
  'Deep in the valleys of the Himalayas, a single red foliage tree stood amongst the evergreen pines. It was a beacon of isolation, beauty, and resilience against the incoming winter.',
  'Stunning high-contrast acrylic painting on canvas. Employs impasto techniques with palette knives to build up the rich, crimson leaves against a moody gray mountain backdrop.',
  1850.00,
  'USD',
  'Acrylic on Canvas',
  24.0,
  30.0,
  2025,
  'PUBLISHED',
  1,
  'AVAILABLE',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
  'The Red Tree - Impasto Acrylic Landscape Painting',
  'Purchase The Red Tree, an original impasto acrylic landscape on canvas. Vibrant crimson and gray textures. 24x30 inches.',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80'
),
(
  'p_golden_hour',
  'golden-hour-reflections',
  'Golden Hour Reflections',
  'The light at 5:00 PM over the salt marshes near the coast is ephemeral. This painting is an attempt to freeze that specific warm amber glow in time.',
  'Delicate watercolor on heavy archival paper (300gsm). Features highly controlled washes and fine pen-and-ink detailing over soft sunset gradients.',
  950.00,
  'USD',
  'Watercolor on Archival Paper',
  18.0,
  24.0,
  2024,
  'PUBLISHED',
  0,
  'AVAILABLE',
  'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=1200&q=80',
  'Golden Hour Reflections - Original Watercolor Painting',
  'Golden Hour Reflections, fine watercolor on archival cotton paper. Elegantly framed under UV protective glass. 18x24 inches.',
  'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=1200&q=80'
),
(
  'p_echoes_of_silence',
  'echoes-of-silence',
  'Echoes of Silence',
  'An exploration of void and negative space. I wanted to paint the feeling of standing in an empty cathedral or a snowy field where all sound is absorbed.',
  'Large-scale minimalist oil painting. Soft white and warm beige gradients with a central dark charcoal textured fissure representing the entry of sound.',
  3200.00,
  'USD',
  'Oil on Canvas',
  48.0,
  48.0,
  2025,
  'PUBLISHED',
  1,
  'SOLD',
  'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=1200&q=80',
  'Echoes of Silence - Modern Abstract Minimalist Painting',
  'Echoes of Silence, 48x48 inches minimalist abstract oil painting on deep profile canvas. (Sold).',
  'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=1200&q=80'
),
(
  'p_woodland_path',
  'path-through-the-pines',
  'Path Through the Pines',
  'This path is located just behind my studio. Walking it daily in autumn provides a constant source of inspiration as the leaves decay and return to the earth.',
  'Textured oil painting depicting an atmospheric forest pathway. Warm gold, mustard, dark green, and mahogany brown palettes.',
  1600.00,
  'USD',
  'Oil on Canvas',
  20.0,
  30.0,
  2024,
  'PUBLISHED',
  0,
  'AVAILABLE',
  'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80',
  'Path Through the Pines - Original Forest Oil Painting',
  'Path Through the Pines oil on canvas. Explores depth and light streaming through autumn branches. 20x30 inches.',
  'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80'
),
(
  'p_oceanic_movement',
  'oceanic-movement-no-3',
  'Oceanic Movement No. 3',
  'Capturing the raw energy of deep ocean swells. The sea has an endless supply of forms, and this series aims to capture the power rather than just the color of water.',
  'Impasto acrylic on heavy canvas board. Dynamic waves, textured foam created using sea sand mixed with heavy body acrylic structure gel.',
  2100.00,
  'USD',
  'Acrylic & Sand on Canvas Board',
  30.0,
  40.0,
  2025,
  'DRAFT',
  0,
  'AVAILABLE',
  'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?auto=format&fit=crop&w=1200&q=80',
  'Oceanic Movement No. 3 - Textured Wave Painting',
  'Oceanic Movement No. 3, heavy body acrylic and sand on panel. 30x40 inches.',
  'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?auto=format&fit=crop&w=1200&q=80'
);

-- Map Paintings to Categories
INSERT INTO painting_categories (painting_id, category_id) VALUES
('p_monsoon_memories', 'cat_oil'),
('p_the_red_tree', 'cat_acrylic'),
('p_golden_hour', 'cat_watercolor'),
('p_echoes_of_silence', 'cat_oil'),
('p_woodland_path', 'cat_oil'),
('p_oceanic_movement', 'cat_acrylic');

-- Map Paintings to Collections
INSERT INTO painting_collections (painting_id, collection_id) VALUES
('p_monsoon_memories', 'coll_monsoon'),
('p_the_red_tree', 'coll_abstract'),
('p_golden_hour', 'coll_monsoon'),
('p_echoes_of_silence', 'coll_abstract'),
('p_woodland_path', 'coll_woodland');

-- Insert Initial Site Settings
INSERT INTO site_settings (key, value) VALUES
('hero_title', 'Original Fine Art Paintings'),
('hero_subtitle', 'Exploring light, nature, and raw human emotion through classical oils and textured acrylics.'),
('artist_bio', 'Born in the foothills of the Himalayas and trained in classical oil techniques in Florence, Italy, my work bridges representational landscapes and abstract expressionism. Each piece is a quiet study of light, texture, and silence.'),
('social_facebook', 'https://facebook.com/artistgallery'),
('social_instagram', 'https://instagram.com/artistgallery'),
('social_pinterest', 'https://pinterest.com/artistgallery'),
('contact_email', 'artist@gallery.com'),
('contact_phone', '+1 (555) 234-5678'),
('contact_address', 'Studio 12B, Arts District, New York, NY 10013'),
('footer_content', '© 2026 Artist Portfolio Gallery. All rights reserved.'),
('seo_default_title', 'Original Paintings & Fine Art Portfolio'),
('seo_default_description', 'Explore original oil, acrylic, and watercolor paintings. Premium fine art gallery showcasing landscape, abstract, and textured canvas art available for purchase.');
