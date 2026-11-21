-- Add purchasable product options and customer refund requests without changing existing orders.
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
    CONSTRAINT uq_product_variant_options UNIQUE (product_id, style, size)
);
CREATE INDEX IF NOT EXISTS idx_product_variants_product ON product_variants(product_id);

ALTER TABLE products ADD COLUMN IF NOT EXISTS sizes VARCHAR(200) NOT NULL DEFAULT '';
ALTER TABLE products ADD COLUMN IF NOT EXISTS cost_price DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS unit_cost DOUBLE PRECISION NOT NULL DEFAULT 0;

UPDATE products p SET sizes = CASE c.slug
    WHEN 't-shirts' THEN 'S,M,L,XL'
    WHEN 'dresses' THEN 'S,M,L,XL'
    WHEN 'jackets-coats' THEN 'S,M,L,XL'
    WHEN 'jeans-pants' THEN '28,30,32,34'
    WHEN 'shoes' THEN '38,39,40,41,42'
    ELSE '' END
FROM categories c
WHERE p.category_id = c.id AND COALESCE(p.sizes, '') = '' AND c.slug IN
    ('t-shirts', 'dresses', 'jackets-coats', 'jeans-pants', 'shoes');

INSERT INTO product_variants (product_id, style, size, price, compare_at_price, cost_price, stock, image_url)
SELECT p.id, 'Regular', sized.option, p.price, p.compare_at_price, p.cost_price,
       (p.stock / sized.option_count) + CASE WHEN sized.position <= (p.stock % sized.option_count) THEN 1 ELSE 0 END,
       p.image_url
FROM products p
CROSS JOIN LATERAL (
    SELECT option, position, COUNT(*) OVER () AS option_count
    FROM unnest(string_to_array(COALESCE(p.sizes, ''), ',')) WITH ORDINALITY AS item(option, position)
    WHERE btrim(option) <> ''
) sized
WHERE NOT EXISTS (SELECT 1 FROM product_variants v WHERE v.product_id = p.id)
ON CONFLICT (product_id, style, size) DO NOTHING;

ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS variant_id INTEGER REFERENCES product_variants(id) ON DELETE SET NULL;
ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS style VARCHAR(100) NOT NULL DEFAULT '';
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS variant_id INTEGER REFERENCES product_variants(id) ON DELETE SET NULL;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS style VARCHAR(100) NOT NULL DEFAULT '';

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
