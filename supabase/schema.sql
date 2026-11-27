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
    cost_price        DOUBLE PRECISION NOT NULL DEFAULT 0,
    stock             INTEGER      NOT NULL DEFAULT 0,
    sizes             VARCHAR(200) NOT NULL DEFAULT '',
    category_id       INTEGER      NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    image_url         VARCHAR(500) NOT NULL DEFAULT '',
    is_featured       BOOLEAN      NOT NULL DEFAULT FALSE,
    is_active         BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at        TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_variants (
    id               SERIAL PRIMARY KEY,
    product_id       INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    style            VARCHAR(100) NOT NULL DEFAULT '',
    size             VARCHAR(50) NOT NULL DEFAULT '',
    price            DOUBLE PRECISION NOT NULL,
    compare_at_price DOUBLE PRECISION,
    cost_price       DOUBLE PRECISION NOT NULL DEFAULT 0,
    stock            INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    image_url        VARCHAR(500) NOT NULL DEFAULT '',
    UNIQUE (product_id, style, size)
);
CREATE INDEX IF NOT EXISTS idx_product_variants_product ON product_variants(product_id);

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
    size       VARCHAR(50),
    variant_id INTEGER REFERENCES product_variants(id) ON DELETE SET NULL,
    style      VARCHAR(100) NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS orders (
    id               SERIAL PRIMARY KEY,
    -- NULL for guest checkout; those orders are identified by guest_email.
    user_id          INTEGER        REFERENCES users(id) ON DELETE CASCADE,
    guest_email      VARCHAR(150),
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
    size         VARCHAR(50),
    unit_cost    DOUBLE PRECISION NOT NULL DEFAULT 0,
    variant_id   INTEGER REFERENCES product_variants(id) ON DELETE SET NULL,
    style        VARCHAR(100) NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS addresses (
    id         SERIAL PRIMARY KEY,
    user_id    INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    label      VARCHAR(40)  NOT NULL DEFAULT '',
    full_name  VARCHAR(100) NOT NULL,
    phone      VARCHAR(30)  NOT NULL DEFAULT '',
    address    VARCHAR(300) NOT NULL,
    is_default BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_addresses_user ON addresses(user_id);

-- Single row holding the one administrator session allowed in at a time.
CREATE TABLE IF NOT EXISTS admin_session (
    id        INTEGER     PRIMARY KEY,
    user_id   INTEGER     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    jti       VARCHAR(64) NOT NULL,
    issued_at TIMESTAMP   NOT NULL DEFAULT NOW()
);

-- Single row capping how much the test administrator may delete.
CREATE TABLE IF NOT EXISTS admin_delete_quota (
    id               INTEGER PRIMARY KEY,
    products_deleted INTEGER NOT NULL DEFAULT 0,
    orders_deleted   INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS refund_requests (
    id            SERIAL PRIMARY KEY,
    order_id      INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    order_item_id INTEGER NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
    user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    quantity      INTEGER NOT NULL CHECK (quantity > 0),
    reason        VARCHAR(1000) NOT NULL,
    status        VARCHAR(20) NOT NULL DEFAULT 'pending',
    admin_note    VARCHAR(1000) NOT NULL DEFAULT '',
    requested_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    resolved_at   TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_refund_requests_user ON refund_requests(user_id, requested_at DESC);
CREATE INDEX IF NOT EXISTS idx_refund_requests_status ON refund_requests(status, requested_at DESC);
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE refund_requests ENABLE ROW LEVEL SECURITY;

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
