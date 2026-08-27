-- ================================================================
-- WhatsApp Evolution module (Net Khata parity)
-- Adds Evolution/Baileys provider fields, delivery statuses,
-- anti-ban settings, and per-company daily quota uniqueness.
-- ================================================================
-- NOTE: Enum ADD VALUE statements are outside a transaction for
-- compatibility with PostgreSQL versions that disallow them in TX.

-- ----------------------------------------------------------------
-- 1) Message status enum: delivered + read
-- ----------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = 'whatsapp_message_status' AND e.enumlabel = 'delivered'
    ) THEN
        ALTER TYPE whatsapp_message_status ADD VALUE 'delivered';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = 'whatsapp_message_status' AND e.enumlabel = 'read'
    ) THEN
        ALTER TYPE whatsapp_message_status ADD VALUE 'read';
    END IF;
END $$;

BEGIN;

-- ----------------------------------------------------------------
-- 2) whatsapp_config: provider + Evolution + anti-ban + warmup
-- ----------------------------------------------------------------
ALTER TABLE whatsapp_config
    ADD COLUMN IF NOT EXISTS provider_type VARCHAR(20);

ALTER TABLE whatsapp_config
    ADD COLUMN IF NOT EXISTS instance_name VARCHAR(100);

ALTER TABLE whatsapp_config
    ADD COLUMN IF NOT EXISTS instance_token VARCHAR(255);

ALTER TABLE whatsapp_config
    ADD COLUMN IF NOT EXISTS qr_code_base64 TEXT;

ALTER TABLE whatsapp_config
    ADD COLUMN IF NOT EXISTS phone_connected BOOLEAN DEFAULT FALSE;

ALTER TABLE whatsapp_config
    ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);

ALTER TABLE whatsapp_config
    ADD COLUMN IF NOT EXISTS min_delay_seconds INTEGER DEFAULT 45;

ALTER TABLE whatsapp_config
    ADD COLUMN IF NOT EXISTS max_delay_seconds INTEGER DEFAULT 120;

ALTER TABLE whatsapp_config
    ADD COLUMN IF NOT EXISTS send_window_start VARCHAR(5) DEFAULT '09:00';

ALTER TABLE whatsapp_config
    ADD COLUMN IF NOT EXISTS send_window_end VARCHAR(5) DEFAULT '21:00';

ALTER TABLE whatsapp_config
    ADD COLUMN IF NOT EXISTS enable_spintax BOOLEAN DEFAULT TRUE;

ALTER TABLE whatsapp_config
    ADD COLUMN IF NOT EXISTS warmup_complete BOOLEAN DEFAULT FALSE;

ALTER TABLE whatsapp_config
    ADD COLUMN IF NOT EXISTS warmup_start_date DATE;

-- Relax legacy gateway-required columns for Evolution mode
ALTER TABLE whatsapp_config
    ALTER COLUMN api_key DROP NOT NULL;

ALTER TABLE whatsapp_config
    ALTER COLUMN server_address DROP NOT NULL;

-- Backfill provider_type before enforcing NOT NULL
UPDATE whatsapp_config
SET provider_type = 'gateway'
WHERE provider_type IS NULL
  AND api_key IS NOT NULL
  AND api_key <> ''
  AND server_address IS NOT NULL
  AND server_address <> '';

UPDATE whatsapp_config
SET provider_type = 'evolution'
WHERE provider_type IS NULL;

ALTER TABLE whatsapp_config
    ALTER COLUMN provider_type SET DEFAULT 'evolution';

ALTER TABLE whatsapp_config
    ALTER COLUMN provider_type SET NOT NULL;

UPDATE whatsapp_config SET phone_connected = FALSE WHERE phone_connected IS NULL;
UPDATE whatsapp_config SET min_delay_seconds = 45 WHERE min_delay_seconds IS NULL;
UPDATE whatsapp_config SET max_delay_seconds = 120 WHERE max_delay_seconds IS NULL;
UPDATE whatsapp_config SET send_window_start = '09:00' WHERE send_window_start IS NULL;
UPDATE whatsapp_config SET send_window_end = '21:00' WHERE send_window_end IS NULL;
UPDATE whatsapp_config SET enable_spintax = TRUE WHERE enable_spintax IS NULL;
UPDATE whatsapp_config SET warmup_complete = FALSE WHERE warmup_complete IS NULL;

-- ----------------------------------------------------------------
-- 3) whatsapp_daily_quota: unique (company_id, date)
-- ----------------------------------------------------------------
DO $$
DECLARE
    con_name text;
BEGIN
    SELECT c.conname INTO con_name
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE t.relname = 'whatsapp_daily_quota'
      AND c.contype = 'u'
      AND pg_get_constraintdef(c.oid) LIKE '%(date)%'
      AND pg_get_constraintdef(c.oid) NOT LIKE '%company_id%';

    IF con_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE whatsapp_daily_quota DROP CONSTRAINT %I', con_name);
    END IF;
END $$;

DO $$
DECLARE
    idx_name text;
BEGIN
    SELECT i.relname INTO idx_name
    FROM pg_index x
    JOIN pg_class t ON t.oid = x.indrelid
    JOIN pg_class i ON i.oid = x.indexrelid
    JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY (x.indkey)
    WHERE t.relname = 'whatsapp_daily_quota'
      AND x.indisunique
      AND NOT x.indisprimary
      AND a.attname = 'date'
      AND (
          SELECT count(*) FROM unnest(x.indkey) AS k
      ) = 1
    LIMIT 1;

    IF idx_name IS NOT NULL THEN
        EXECUTE format('DROP INDEX IF EXISTS %I', idx_name);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'uq_whatsapp_quota_company_date'
    ) THEN
        ALTER TABLE whatsapp_daily_quota
            ADD CONSTRAINT uq_whatsapp_quota_company_date UNIQUE (company_id, date);
    END IF;
END $$;

COMMIT;
