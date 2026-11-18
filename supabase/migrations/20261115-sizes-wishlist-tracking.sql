-- ============================================================
-- Migration: product sizes, cart/order size, order tracking, wishlist
-- Safe to run on a LIVE Supabase Postgres database that already
-- contains seeded data (all statements are IF NOT EXISTS guarded
-- and non-destructive). seed.sql is intentionally untouched.
-- ============================================================

-- 1. Product sizes (comma-separated options, e.g. "S,M,L,XL"; '' = no sizes)
ALTER TABLE products ADD COLUMN IF NOT EXISTS sizes VARCHAR(200) NOT NULL DEFAULT '';

-- 2. Size on cart lines and order items (NULL/'' = no size)
ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS size VARCHAR(50);
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS size VARCHAR(50);

-- 3. Order tracking number (NULL/'' = no tracking yet)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number VARCHAR(100);

-- 4. Wishlist (one row per user+product)
CREATE TABLE IF NOT EXISTS wishlists (
    id         SERIAL PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_wishlists_user ON wishlists(user_id);
