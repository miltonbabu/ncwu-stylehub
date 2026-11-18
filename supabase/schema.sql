-- ============================================================
-- NCWU StyleHub online store - PostgreSQL / Supabase schema
-- Run this in the Supabase SQL editor (or psql) to provision
-- the database, then run the backend with DATABASE_URL set.
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
    id            SERIAL PRIMARY KEY,
    name          VARCHAR(100) NOT NULL,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role          VARCHAR(20)  NOT NULL DEFAULT 'customer',
    is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categories (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    slug        VARCHAR(100) NOT NULL UNIQUE,
    description TEXT         NOT NULL DEFAULT '',
    image_url   VARCHAR(500) NOT NULL DEFAULT '',
    sort_order  INTEGER      NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS products (
    id                SERIAL PRIMARY KEY,
    name              VARCHAR(200) NOT NULL,
    slug              VARCHAR(200) NOT NULL UNIQUE,
    description       TEXT         NOT NULL DEFAULT '',
    price             DOUBLE PRECISION NOT NULL,
    compare_at_price  DOUBLE PRECISION,
    stock             INTEGER      NOT NULL DEFAULT 0,
    sizes             VARCHAR(200) NOT NULL DEFAULT '',
    category_id       INTEGER      NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    image_url         VARCHAR(500) NOT NULL DEFAULT '',
    is_featured       BOOLEAN      NOT NULL DEFAULT FALSE,
    is_active         BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at        TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_images (
    id         SERIAL PRIMARY KEY,
    product_id INTEGER      NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    image_url  VARCHAR(500) NOT NULL,
    sort_order INTEGER      NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS reviews (
    id         SERIAL PRIMARY KEY,
    product_id INTEGER   NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id    INTEGER   NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating     INTEGER   NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment    TEXT      NOT NULL DEFAULT '',
    status     VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cart_items (
    id         SERIAL PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity   INTEGER NOT NULL DEFAULT 1,
    size       VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS orders (
    id               SERIAL PRIMARY KEY,
    user_id          INTEGER        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status           VARCHAR(20)    NOT NULL DEFAULT 'pending',
    total            DOUBLE PRECISION NOT NULL DEFAULT 0,
    shipping_name    VARCHAR(100)   NOT NULL,
    shipping_address TEXT           NOT NULL,
    shipping_phone   VARCHAR(30)    NOT NULL DEFAULT '',
    payment_method   VARCHAR(30)    NOT NULL DEFAULT 'card',
    tracking_number  VARCHAR(100),
    created_at       TIMESTAMP      NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMP      NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
    id           SERIAL PRIMARY KEY,
    order_id     INTEGER        NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id   INTEGER        REFERENCES products(id) ON DELETE SET NULL,
    product_name VARCHAR(200)   NOT NULL,
    unit_price   DOUBLE PRECISION NOT NULL,
    quantity     INTEGER        NOT NULL,
    size         VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS banners (
    id         SERIAL PRIMARY KEY,
    title      VARCHAR(200) NOT NULL,
    subtitle   VARCHAR(300) NOT NULL DEFAULT '',
    image_url  VARCHAR(500) NOT NULL DEFAULT '',
    link_url   VARCHAR(300) NOT NULL DEFAULT '/shop',
    sort_order INTEGER      NOT NULL DEFAULT 0,
    is_active  BOOLEAN      NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS promotions (
    id        SERIAL PRIMARY KEY,
    title     VARCHAR(200) NOT NULL,
    subtitle  VARCHAR(300) NOT NULL DEFAULT '',
    badge     VARCHAR(50)  NOT NULL DEFAULT '',
    image_url VARCHAR(500) NOT NULL DEFAULT '',
    link_url  VARCHAR(300) NOT NULL DEFAULT '/shop',
    position  VARCHAR(50)  NOT NULL DEFAULT 'home-main',
    is_active BOOLEAN      NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS wishlists (
    id         SERIAL PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

CREATE TABLE IF NOT EXISTS subscribers (
    id         SERIAL PRIMARY KEY,
    email      VARCHAR(180) NOT NULL UNIQUE,
    source     VARCHAR(40)  NOT NULL DEFAULT 'club',
    is_active  BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contact_messages (
    id         SERIAL PRIMARY KEY,
    name       VARCHAR(100)  NOT NULL,
    email      VARCHAR(180)  NOT NULL,
    subject    VARCHAR(200)  NOT NULL DEFAULT '',
    message    VARCHAR(2000) NOT NULL,
    is_read    BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP     NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured);
CREATE INDEX IF NOT EXISTS idx_reviews_product   ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status    ON reviews(status);
CREATE INDEX IF NOT EXISTS idx_orders_user       ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_user    ON wishlists(user_id);

-- ============================================================
-- Seed data (passwords are PBKDF2 hashes generated by the app;
-- prefer letting the backend auto-seed on first startup instead
-- of inserting users here. If you need manual users, register
-- via POST /api/v1/auth/register or the Sign Up page.)
-- ============================================================
