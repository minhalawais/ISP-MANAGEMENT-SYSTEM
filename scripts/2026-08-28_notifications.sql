-- In-app notifications inbox (per-user, separate from detailed_logs)
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id),
    recipient_user_id UUID NOT NULL REFERENCES users(id),
    actor_user_id UUID REFERENCES users(id),
    event_type VARCHAR(80) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    severity VARCHAR(20) NOT NULL DEFAULT 'info',
    payload JSONB,
    deep_link VARCHAR(500),
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS ix_notifications_recipient_unread_created
    ON notifications (recipient_user_id, is_read, created_at DESC);

CREATE INDEX IF NOT EXISTS ix_notifications_company_created
    ON notifications (company_id, created_at DESC);

-- One unread row per recipient + event + entity (dedupe)
CREATE UNIQUE INDEX IF NOT EXISTS uq_notifications_unread_dedupe
    ON notifications (recipient_user_id, event_type, entity_id)
    WHERE is_read = FALSE;
