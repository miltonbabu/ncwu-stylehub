-- Address book + guest checkout.
-- Safe to re-run: every statement is idempotent.

-- 1. Address book ------------------------------------------------------------

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

-- 2. Guest checkout ----------------------------------------------------------
-- Guest orders have no account, so user_id must allow NULL and the contact
-- address is captured in guest_email instead.

ALTER TABLE orders ADD COLUMN IF NOT EXISTS guest_email VARCHAR(150);

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'orders' AND column_name = 'user_id' AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE orders ALTER COLUMN user_id DROP NOT NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_orders_guest_email ON orders(guest_email);
