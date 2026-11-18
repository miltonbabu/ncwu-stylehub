-- ============================================================
-- Migration: cost price / real profit + password reset tokens
-- Safe to run on a LIVE Supabase database (IF NOT EXISTS guarded).
-- ============================================================

-- 1. Sourcing cost per unit (admin only — never returned by the public catalog)
ALTER TABLE products ADD COLUMN IF NOT EXISTS cost_price DOUBLE PRECISION NOT NULL DEFAULT 0;

-- 2. Cost captured on the order line so profit stays accurate if the product cost changes later
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS unit_cost DOUBLE PRECISION NOT NULL DEFAULT 0;

-- 3. Single-use password reset tokens (only the SHA-256 hash is stored)
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id         SERIAL PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    used       BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reset_tokens_user ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_reset_tokens_hash ON password_reset_tokens(token_hash);
