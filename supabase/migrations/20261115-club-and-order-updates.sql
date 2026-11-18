-- ============================================================
-- NCWU StyleHub — NCWU StyleHub Club + order update timestamps
-- Run once in the Supabase SQL Editor before deploying the build
-- that includes the club page / customer cancellation.
-- ============================================================

-- Club (newsletter) members
CREATE TABLE IF NOT EXISTS subscribers (
    id         SERIAL PRIMARY KEY,
    email      VARCHAR(180) NOT NULL UNIQUE,
    source     VARCHAR(40)  NOT NULL DEFAULT 'club',
    is_active  BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscribers_email ON subscribers(email);

-- Last status / tracking change, shown in the customer order timeline
ALTER TABLE orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP;
UPDATE orders SET updated_at = created_at WHERE updated_at IS NULL;
