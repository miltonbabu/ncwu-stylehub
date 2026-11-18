-- ============================================================
-- Contact form inbox
-- Run this in the Supabase SQL Editor before deploying the
-- backend that serves /api/v1/contact.
-- ============================================================

CREATE TABLE IF NOT EXISTS contact_messages (
    id         SERIAL PRIMARY KEY,
    name       VARCHAR(100)  NOT NULL,
    email      VARCHAR(180)  NOT NULL,
    subject    VARCHAR(200)  NOT NULL DEFAULT '',
    message    VARCHAR(2000) NOT NULL,
    is_read    BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP     NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contact_messages_created ON contact_messages(created_at DESC);
