-- WhatsApp production hardening
-- Additive migration: safe to apply before deploying the matching application code.

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
        WHERE t.typname = 'whatsapp_message_status' AND e.enumlabel = 'processing'
    ) THEN
        ALTER TYPE whatsapp_message_status ADD VALUE 'processing';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
        WHERE t.typname = 'whatsapp_message_status' AND e.enumlabel = 'retry_wait'
    ) THEN
        ALTER TYPE whatsapp_message_status ADD VALUE 'retry_wait';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
        WHERE t.typname = 'whatsapp_message_status' AND e.enumlabel = 'unknown'
    ) THEN
        ALTER TYPE whatsapp_message_status ADD VALUE 'unknown';
    END IF;
END $$;

BEGIN;

ALTER TABLE whatsapp_message_queue
    ADD COLUMN IF NOT EXISTS locked_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS locked_by VARCHAR(100),
    ADD COLUMN IF NOT EXISTS processing_started_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS next_attempt_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS last_attempt_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS deduplication_key VARCHAR(255),
    ADD COLUMN IF NOT EXISTS campaign_id UUID,
    ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE whatsapp_config
    ADD COLUMN IF NOT EXISTS next_send_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS last_dispatched_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS last_deadline_check_date DATE;

ALTER TABLE whatsapp_config
    ALTER COLUMN instance_token TYPE TEXT;

ALTER TABLE customers
    ADD COLUMN IF NOT EXISTS whatsapp_opt_in BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS whatsapp_opt_in_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS whatsapp_opt_out_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS whatsapp_consent_source VARCHAR(100);

-- Preserve one deterministic key for historical automated messages. Any older
-- duplicate rows remain as history but cannot be produced again by new code.
WITH ranked AS (
    SELECT id, company_id, related_invoice_id,
           ROW_NUMBER() OVER (
               PARTITION BY company_id, related_invoice_id, message_type
               ORDER BY created_at ASC, id ASC
           ) AS rn
    FROM whatsapp_message_queue
    WHERE related_invoice_id IS NOT NULL
      AND message_type = 'invoice'
)
UPDATE whatsapp_message_queue q
SET deduplication_key = 'invoice:' || r.company_id::text || ':' || r.related_invoice_id::text
FROM ranked r
WHERE q.id = r.id AND r.rn = 1 AND q.deduplication_key IS NULL;

WITH ranked AS (
    SELECT q.id, q.company_id, q.related_invoice_id, i.due_date,
           ROW_NUMBER() OVER (
               PARTITION BY q.company_id, q.related_invoice_id, q.message_type
               ORDER BY q.created_at ASC, q.id ASC
           ) AS rn
    FROM whatsapp_message_queue q
    JOIN invoices i ON i.id = q.related_invoice_id
    WHERE q.related_invoice_id IS NOT NULL
      AND q.message_type = 'deadline_alert'
)
UPDATE whatsapp_message_queue q
SET deduplication_key = 'deadline:' || r.company_id::text || ':' ||
                        r.related_invoice_id::text || ':' || r.due_date::text
FROM ranked r
WHERE q.id = r.id AND r.rn = 1 AND q.deduplication_key IS NULL;

UPDATE whatsapp_message_queue
SET priority = 20
WHERE priority NOT IN (0, 10, 20);

UPDATE whatsapp_config
SET sending_paused = TRUE
WHERE provider_type IS DISTINCT FROM 'evolution';

UPDATE whatsapp_config
SET min_delay_seconds = GREATEST(COALESCE(min_delay_seconds, 45), 5),
    max_delay_seconds = GREATEST(
        COALESCE(max_delay_seconds, 120),
        GREATEST(COALESCE(min_delay_seconds, 45), 5)
    ),
    daily_quota_limit = GREATEST(COALESCE(daily_quota_limit, 200), 1),
    quota_buffer = LEAST(
        GREATEST(COALESCE(quota_buffer, 5), 0),
        GREATEST(COALESCE(daily_quota_limit, 200), 1) - 1
    );

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ck_whatsapp_queue_priority') THEN
        ALTER TABLE whatsapp_message_queue
            ADD CONSTRAINT ck_whatsapp_queue_priority CHECK (priority IN (0, 10, 20));
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ck_whatsapp_config_delays') THEN
        ALTER TABLE whatsapp_config
            ADD CONSTRAINT ck_whatsapp_config_delays
            CHECK (min_delay_seconds >= 5 AND max_delay_seconds >= min_delay_seconds);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ck_whatsapp_config_quota') THEN
        ALTER TABLE whatsapp_config
            ADD CONSTRAINT ck_whatsapp_config_quota
            CHECK (daily_quota_limit > 0 AND quota_buffer >= 0 AND quota_buffer < daily_quota_limit);
    END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS uq_whatsapp_queue_deduplication_key
    ON whatsapp_message_queue (deduplication_key)
    WHERE deduplication_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_whatsapp_queue_dispatch
    ON whatsapp_message_queue
        (company_id, status, next_attempt_at, priority, created_at)
    WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_whatsapp_queue_provider_message
    ON whatsapp_message_queue (company_id, api_message_id)
    WHERE api_message_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_whatsapp_config_dispatch
    ON whatsapp_config (sending_paused, phone_connected, next_send_at, last_dispatched_at)
    WHERE provider_type = 'evolution';

COMMIT;
