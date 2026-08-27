-- Notification preferences + allow staff WhatsApp queue rows without a customer
CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    muted_event_types JSONB NOT NULL DEFAULT '[]'::jsonb,
    whatsapp_action_required BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_notification_preferences_user
    ON notification_preferences (user_id);

-- Staff action_required alerts enqueue without a customer record
ALTER TABLE whatsapp_message_queue
    ALTER COLUMN customer_id DROP NOT NULL;
