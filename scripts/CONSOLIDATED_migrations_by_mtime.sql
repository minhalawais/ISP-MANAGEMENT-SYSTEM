-- =============================================================================
-- CONSOLIDATED MIGRATIONS (sorted by file LastWriteTime)
-- Generated: 2026-08-28 02:11:16
-- Target DB: isp_management
--
-- EXCLUDED (local/staging only — would overwrite real phone numbers):
--   2026-08-26_scrub_phones_to_test_number.sql
--
-- File order:
--   2026-08-19 02:20:44  2026-08-19_customer_technicians_and_package_discounts.sql
--   2026-08-20 02:25:46  2026-08-20_customer_portal_credentials.sql
--   2026-08-21 01:24:24  2026-08-21_complaint_category.sql
--   2026-08-21 02:38:08  2026-08-21_employee_portal_access.sql
--   2026-08-22 03:24:09  2026-08-22_recovery_collection_settlement.sql
--   2026-08-24 14:35:22  2026-08-24_company_hosts.sql
--   2026-08-25 01:24:46  2026-08-25_invoice_line_charge_types.sql
--   2026-08-26 02:30:21  2026-08-26_whatsapp_evolution_module.sql
--   2026-08-26 02:42:19  2026-08-26_scrub_phones_to_test_number.sql [EXCLUDED]
--   2026-08-26 02:49:20  2026-08-26_whatsapp_tenant_hardening.sql
--   2026-08-26 03:31:16  2026-08-27_whatsapp_production_hardening.sql
--   2026-08-26 04:06:16  2026-08-27_whatsapp_professional_templates.sql
--   2026-08-26 04:49:56  2026-08-26_company_website_content.sql
--   2026-08-26 16:11:13  2026-08-28_search_filter_performance_indexes.sql
--   2026-08-26 16:52:47  2026-08-28_bank_account_qr_code_image.sql
--   2026-08-26 18:13:02  2026-08-26_public_website_merchandising.sql
--   2026-08-26 18:31:36  2026-08-26_mbanet_public_catalog.sql
--   2026-08-26 19:30:07  2026-08-26_mbanet_website_content_refinement.sql
--   2026-08-26 20:54:23  2026-08-28_notifications.sql
--   2026-08-26 21:20:13  2026-08-29_notification_preferences.sql
-- =============================================================================

SET client_min_messages TO NOTICE;

-- =============================================================================
-- BEGIN FILE: 2026-08-19_customer_technicians_and_package_discounts.sql
-- LastWriteTime: 2026-08-19 02:20:44
-- =============================================================================

-- Multi-technician assignment + per-package discount
-- Safe to re-run (IF NOT EXISTS / ON CONFLICT).

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Junction table: multiple technicians per customer, each with their own commission
CREATE TABLE IF NOT EXISTS customer_technicians (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id),
    technician_id UUID NOT NULL REFERENCES users(id),
    commission_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_customer_technicians_customer_technician UNIQUE (customer_id, technician_id)
);

ALTER TABLE customer_technicians
    ALTER COLUMN id SET DEFAULT gen_random_uuid();

CREATE INDEX IF NOT EXISTS idx_customer_technicians_customer_id
    ON customer_technicians (customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_technicians_technician_id
    ON customer_technicians (technician_id);

-- 2. Per-package discount (PKR). Existing customer.discount_amount is copied onto each active package.
ALTER TABLE customer_packages
    ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10, 2) DEFAULT 0;

-- 3. Backfill technicians from the legacy single technician_id column
INSERT INTO customer_technicians (id, customer_id, technician_id, commission_amount)
SELECT
    gen_random_uuid(),
    c.id,
    c.technician_id,
    COALESCE(c.connection_commission_amount, 0)
FROM customers c
WHERE c.technician_id IS NOT NULL
ON CONFLICT (customer_id, technician_id) DO NOTHING;

-- 4. Copy current customer-level discount onto every active package (copy-to-each)
UPDATE customer_packages cp
SET discount_amount = COALESCE(c.discount_amount, 0)
FROM customers c
WHERE cp.customer_id = c.id
  AND cp.is_active = TRUE
  AND COALESCE(cp.discount_amount, 0) = 0
  AND COALESCE(c.discount_amount, 0) <> 0;

-- 5. Recalc customer.discount_amount as the sum of active package discounts
UPDATE customers c
SET discount_amount = COALESCE((
    SELECT SUM(cp.discount_amount)
    FROM customer_packages cp
    WHERE cp.customer_id = c.id
      AND cp.is_active = TRUE
), 0);


-- =============================================================================
-- END FILE: 2026-08-19_customer_technicians_and_package_discounts.sql
-- =============================================================================

-- =============================================================================
-- BEGIN FILE: 2026-08-20_customer_portal_credentials.sql
-- LastWriteTime: 2026-08-20 02:25:46
-- =============================================================================

-- Customer portal credentials (CNIC + password login)
-- Safe to re-run (IF NOT EXISTS).
--
-- Default password: set CUSTOMER_PORTAL_DEFAULT_PASSWORD in backend env before deploy.
-- This script backfills pbkdf2 hash for the default "Welcome@123".
-- If you change the default password, regenerate the hash:
--   python -c "from werkzeug.security import generate_password_hash; print(generate_password_hash('YOUR_PASSWORD', method='pbkdf2:sha256'))"

ALTER TABLE customers
    ADD COLUMN IF NOT EXISTS portal_password_hash VARCHAR(255),
    ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS portal_credentials_created_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_customers_portal_credentials
    ON customers (portal_credentials_created_at)
    WHERE portal_password_hash IS NOT NULL;

-- Backfill existing customers with shared default password (Welcome@123)
UPDATE customers
SET
    portal_password_hash = 'pbkdf2:sha256:1000000$vmBDi7cnfzXgcMzW$bf7254b01cdee80546ed249b7b3f8ed568f45a95d0ef76cb77adb7402918dac4',
    must_change_password = TRUE,
    portal_credentials_created_at = COALESCE(portal_credentials_created_at, CURRENT_TIMESTAMP)
WHERE portal_password_hash IS NULL;


-- =============================================================================
-- END FILE: 2026-08-20_customer_portal_credentials.sql
-- =============================================================================

-- =============================================================================
-- BEGIN FILE: 2026-08-21_complaint_category.sql
-- LastWriteTime: 2026-08-21 01:24:24
-- =============================================================================

-- Complaint category for triage (customer portal + staff forms)
-- Safe to re-run.

ALTER TABLE complaints
  ADD COLUMN IF NOT EXISTS category VARCHAR(50);

UPDATE complaints
SET category = 'other'
WHERE category IS NULL OR TRIM(category) = '';

ALTER TABLE complaints
  ALTER COLUMN category SET DEFAULT 'other';

ALTER TABLE complaints
  ALTER COLUMN category SET NOT NULL;

COMMENT ON COLUMN complaints.category IS
  'Complaint category: no_internet | slow_speed | billing | installation | hardware | other';


-- =============================================================================
-- END FILE: 2026-08-21_complaint_category.sql
-- =============================================================================

-- =============================================================================
-- BEGIN FILE: 2026-08-21_employee_portal_access.sql
-- LastWriteTime: 2026-08-21 02:38:08
-- =============================================================================

-- Per-employee portal access configuration (module visibility + OR-union scope rules).
-- Safe to re-run (IF NOT EXISTS).
-- Empty '{}' preserves legacy assignment-only portal behavior via application defaults.

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS portal_access JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN users.portal_access IS
    'Employee portal access config: area_ids, sub_zone_ids, modules.*.enabled and visibility rules';


-- =============================================================================
-- END FILE: 2026-08-21_employee_portal_access.sql
-- =============================================================================

-- =============================================================================
-- BEGIN FILE: 2026-08-22_recovery_collection_settlement.sql
-- LastWriteTime: 2026-08-22 03:24:09
-- =============================================================================

-- Recovery cash collection + owner settlement linkage
-- Safe to re-run.

ALTER TABLE recovery_tasks
  ADD COLUMN IF NOT EXISTS collected_amount NUMERIC(10, 2);

ALTER TABLE recovery_tasks
  ADD COLUMN IF NOT EXISTS collected_at TIMESTAMPTZ;

ALTER TABLE recovery_tasks
  ADD COLUMN IF NOT EXISTS payment_id UUID;

ALTER TABLE recovery_tasks
  ADD COLUMN IF NOT EXISTS settled_at TIMESTAMPTZ;

ALTER TABLE recovery_tasks
  ADD COLUMN IF NOT EXISTS settled_by UUID;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_recovery_tasks_payment_id'
  ) THEN
    ALTER TABLE recovery_tasks
      ADD CONSTRAINT fk_recovery_tasks_payment_id
      FOREIGN KEY (payment_id) REFERENCES payments(id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_recovery_tasks_settled_by'
  ) THEN
    ALTER TABLE recovery_tasks
      ADD CONSTRAINT fk_recovery_tasks_settled_by
      FOREIGN KEY (settled_by) REFERENCES users(id);
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS uq_recovery_tasks_payment_id
  ON recovery_tasks (payment_id)
  WHERE payment_id IS NOT NULL;

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS recovery_task_id UUID;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_payments_recovery_task_id'
  ) THEN
    ALTER TABLE payments
      ADD CONSTRAINT fk_payments_recovery_task_id
      FOREIGN KEY (recovery_task_id) REFERENCES recovery_tasks(id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_payments_recovery_task_id
  ON payments (recovery_task_id)
  WHERE recovery_task_id IS NOT NULL;

COMMENT ON COLUMN recovery_tasks.collected_amount IS
  'Amount collected in the field; payment stays pending until owner settles';
COMMENT ON COLUMN recovery_tasks.payment_id IS
  'Linked pending/paid payment created on collect';
COMMENT ON COLUMN payments.recovery_task_id IS
  'Optional link to recovery task that produced this field collection';

-- Status enum: allow collected (app lifecycle pending|in_progress|collected|completed|cancelled)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_status') THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_enum e
      JOIN pg_type t ON e.enumtypid = t.oid
      WHERE t.typname = 'task_status' AND e.enumlabel = 'collected'
    ) THEN
      ALTER TYPE task_status ADD VALUE 'collected';
    END IF;
  END IF;
END $$;


-- =============================================================================
-- END FILE: 2026-08-22_recovery_collection_settlement.sql
-- =============================================================================

-- =============================================================================
-- BEGIN FILE: 2026-08-24_company_hosts.sql
-- LastWriteTime: 2026-08-24 14:35:22
-- =============================================================================

-- ================================================================
-- COMPANY HOSTS (vendor domain allowlist)
-- Multiple companies may share the same host.
-- ================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS company_hosts (
    id UUID PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    host VARCHAR(253) NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT uq_company_hosts_company_host UNIQUE (company_id, host)
);

CREATE INDEX IF NOT EXISTS ix_company_hosts_host ON company_hosts (host);
CREATE INDEX IF NOT EXISTS ix_company_hosts_company_id ON company_hosts (company_id);

COMMIT;

-- ================================================================
-- OPS BACKFILL (run manually after identifying vendor_company_id)
-- Example: bind Fastnet vendor company to its domain
-- ================================================================
-- INSERT INTO company_hosts (id, company_id, host, is_primary)
-- VALUES (
--   gen_random_uuid(),
--   '<vendor_company_id>'::uuid,
--   'fastnet.mbanet.com.pk',
--   true
-- )
-- ON CONFLICT ON CONSTRAINT uq_company_hosts_company_host DO UPDATE
--   SET is_primary = EXCLUDED.is_primary;
--
-- Find vendor companies:
-- SELECT v.id AS vendor_id, v.name, v.vendor_company_id, c.name AS company_name
-- FROM vendors v
-- JOIN companies c ON c.id = v.vendor_company_id
-- WHERE v.name ILIKE '%fastnet%';


-- =============================================================================
-- END FILE: 2026-08-24_company_hosts.sql
-- =============================================================================

-- =============================================================================
-- BEGIN FILE: 2026-08-25_invoice_line_charge_types.sql
-- LastWriteTime: 2026-08-25 01:24:46
-- =============================================================================

-- ================================================================
-- Invoice line charge types (multi-line billing)
-- ================================================================

BEGIN;

ALTER TABLE invoice_line_items
    ADD COLUMN IF NOT EXISTS charge_type VARCHAR(20);

ALTER TABLE invoice_line_items
    ADD COLUMN IF NOT EXISTS billing_start_date DATE;

ALTER TABLE invoice_line_items
    ADD COLUMN IF NOT EXISTS billing_end_date DATE;

-- Backfill from item_type
UPDATE invoice_line_items
SET charge_type = 'equipment'
WHERE charge_type IS NULL AND item_type = 'equipment';

UPDATE invoice_line_items
SET charge_type = 'subscription'
WHERE charge_type IS NULL AND item_type = 'package';

UPDATE invoice_line_items
SET charge_type = COALESCE(
    (SELECT i.invoice_type FROM invoices i WHERE i.id = invoice_line_items.invoice_id),
    'subscription'
)
WHERE charge_type IS NULL;

-- Synthetic lines for header-only invoices
INSERT INTO invoice_line_items (
    id,
    invoice_id,
    item_type,
    charge_type,
    description,
    quantity,
    unit_price,
    discount_amount,
    line_total,
    billing_start_date,
    billing_end_date,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    i.id,
    CASE
        WHEN i.invoice_type = 'equipment' THEN 'equipment'
        WHEN i.invoice_type = 'subscription' THEN 'package'
        ELSE 'fee'
    END,
    COALESCE(NULLIF(i.invoice_type, ''), 'subscription'),
    COALESCE(
        NULLIF(i.notes, ''),
        INITCAP(REPLACE(COALESCE(i.invoice_type, 'subscription'), '_', ' '))
    ),
    1,
    i.total_amount,
    0,
    i.total_amount,
    CASE WHEN i.invoice_type = 'subscription' THEN i.billing_start_date ELSE NULL END,
    CASE WHEN i.invoice_type = 'subscription' THEN i.billing_end_date ELSE NULL END,
    NOW(),
    NOW()
FROM invoices i
WHERE NOT EXISTS (
    SELECT 1 FROM invoice_line_items li WHERE li.invoice_id = i.id
)
AND i.is_active IS DISTINCT FROM FALSE;

ALTER TABLE invoice_line_items
    ALTER COLUMN charge_type SET NOT NULL;

CREATE INDEX IF NOT EXISTS ix_invoice_line_items_charge_type
    ON invoice_line_items (charge_type);

COMMIT;


-- =============================================================================
-- END FILE: 2026-08-25_invoice_line_charge_types.sql
-- =============================================================================

-- =============================================================================
-- BEGIN FILE: 2026-08-26_whatsapp_evolution_module.sql
-- LastWriteTime: 2026-08-26 02:30:21
-- =============================================================================

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


-- =============================================================================
-- END FILE: 2026-08-26_whatsapp_evolution_module.sql
-- =============================================================================

-- -----------------------------------------------------------------------------
-- SKIPPED: 2026-08-26_scrub_phones_to_test_number.sql (phone scrub — local/staging only)
-- -----------------------------------------------------------------------------
DO $$ BEGIN RAISE NOTICE 'Skipped phone scrub migration (not for production)'; END $$;

-- =============================================================================
-- BEGIN FILE: 2026-08-26_whatsapp_tenant_hardening.sql
-- LastWriteTime: 2026-08-26 02:49:20
-- =============================================================================

-- ================================================================
-- WhatsApp tenant hardening
-- - sending_paused kill-switch
-- - unique instance_name (when set)
-- ================================================================

BEGIN;

ALTER TABLE whatsapp_config
    ADD COLUMN IF NOT EXISTS sending_paused BOOLEAN DEFAULT FALSE;

UPDATE whatsapp_config
SET sending_paused = FALSE
WHERE sending_paused IS NULL;

ALTER TABLE whatsapp_config
    ALTER COLUMN sending_paused SET DEFAULT FALSE;

ALTER TABLE whatsapp_config
    ALTER COLUMN sending_paused SET NOT NULL;

-- Resolve duplicate instance_name values before unique index
-- (keep earliest config; null out duplicates on other companies)
WITH ranked AS (
    SELECT
        id,
        instance_name,
        ROW_NUMBER() OVER (PARTITION BY instance_name ORDER BY created_at ASC NULLS LAST, id ASC) AS rn
    FROM whatsapp_config
    WHERE instance_name IS NOT NULL
      AND btrim(instance_name) <> ''
)
UPDATE whatsapp_config c
SET instance_name = NULL,
    phone_connected = FALSE,
    connection_status = 'untested'
FROM ranked r
WHERE c.id = r.id
  AND r.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS uq_whatsapp_config_instance_name
    ON whatsapp_config (instance_name)
    WHERE instance_name IS NOT NULL;

COMMIT;


-- =============================================================================
-- END FILE: 2026-08-26_whatsapp_tenant_hardening.sql
-- =============================================================================

-- =============================================================================
-- BEGIN FILE: 2026-08-27_whatsapp_production_hardening.sql
-- LastWriteTime: 2026-08-26 03:31:16
-- =============================================================================

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


-- =============================================================================
-- END FILE: 2026-08-27_whatsapp_production_hardening.sql
-- =============================================================================

-- =============================================================================
-- BEGIN FILE: 2026-08-27_whatsapp_professional_templates.sql
-- LastWriteTime: 2026-08-26 04:06:16
-- =============================================================================

-- Install concise, fixed WhatsApp billing templates for configured companies.
-- Existing active category templates are preserved as deliberate tenant customizations.

BEGIN;

INSERT INTO whatsapp_templates (
    id,
    company_id,
    name,
    description,
    template_text,
    category,
    message_type,
    is_active,
    default_priority
)
SELECT
    gen_random_uuid(),
    config.company_id,
    'Invoice issued',
    'Professional transactional notification for a newly issued invoice',
    $template$*{{company_name}}*
*Invoice {{invoice_number}}*

Hello {{first_name}},

Your internet invoice for {{billing_period}} is ready.

*Amount due:* Rs. {{amount_due}}
*Due date:* {{due_date_long}}

View your invoice:
{{invoice_link}}

Please arrange payment by the due date.

Need help? Reply to this message.$template$,
    'invoice',
    'invoice'::whatsapp_message_type,
    TRUE,
    10
FROM whatsapp_config config
WHERE NOT EXISTS (
    SELECT 1
    FROM whatsapp_templates template
    WHERE template.company_id = config.company_id
      AND template.category = 'invoice'
      AND template.is_active = TRUE
);

INSERT INTO whatsapp_templates (
    id,
    company_id,
    name,
    description,
    template_text,
    category,
    message_type,
    is_active,
    default_priority
)
SELECT
    gen_random_uuid(),
    config.company_id,
    'Payment due soon',
    'Professional reminder for an invoice approaching its due date',
    $template$*Payment reminder*

Hello {{first_name}},

Invoice *{{invoice_number}}* is due on *{{due_date_long}}*.

*Amount due:* Rs. {{amount_due}}

View your invoice:
{{invoice_link}}

If you have already paid, please disregard this reminder.

*{{company_name}}*$template$,
    'deadline_alert',
    'deadline_alert'::whatsapp_message_type,
    TRUE,
    0
FROM whatsapp_config config
WHERE NOT EXISTS (
    SELECT 1
    FROM whatsapp_templates template
    WHERE template.company_id = config.company_id
      AND template.category = 'deadline_alert'
      AND template.is_active = TRUE
);

COMMIT;


-- =============================================================================
-- END FILE: 2026-08-27_whatsapp_professional_templates.sql
-- =============================================================================

-- =============================================================================
-- BEGIN FILE: 2026-08-26_company_website_content.sql
-- LastWriteTime: 2026-08-26 04:49:56
-- =============================================================================

-- ================================================================
-- COMPANY WEBSITE CONTENT
-- Free-form marketing copy for each company's public vendor-domain
-- website (hero headline, why-choose-us, FAQ, business hours, socials).
-- Consumed by GET /public/site and edited via Vendor Management.
--
-- Expected shape (all keys optional; frontend supplies fallbacks):
-- {
--   "hero_headline": "",
--   "hero_subheadline": "",
--   "about_text": "",
--   "established_year": 2015,
--   "why_choose_us": [{"title": "", "description": ""}],
--   "faqs": [{"question": "", "answer": ""}],
--   "business_hours": "",
--   "social_links": {"facebook": "", "instagram": "", "whatsapp": ""}
-- }
-- ================================================================

BEGIN;

ALTER TABLE companies
    ADD COLUMN IF NOT EXISTS website_content JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMIT;


-- =============================================================================
-- END FILE: 2026-08-26_company_website_content.sql
-- =============================================================================

-- =============================================================================
-- BEGIN FILE: 2026-08-28_search_filter_performance_indexes.sql
-- LastWriteTime: 2026-08-26 16:11:13
-- =============================================================================

-- ================================================================
-- SEARCH / FILTER PERFORMANCE INDEXES
-- Covers customer & invoice modal dropdowns, CRUD list pages,
-- month/status filters, and JOINs used across payments/complaints/
-- recovery/tasks.
--
-- Safe to re-run: all statements use IF NOT EXISTS.
--
-- Notes:
--   - B-tree composites accelerate WHERE company_id = ? + ORDER BY /
--     status / date filters.
--   - pg_trgm GIN indexes accelerate ILIKE '%term%' searches used by
--     dropdown autocomplete and CRUD `q` filters (B-tree cannot).
--   - For very large production tables under load, prefer
--     CREATE INDEX CONCURRENTLY (cannot run inside a transaction).
-- ================================================================

BEGIN;

-- Required for trigram (ILIKE '%â€¦%') indexes
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ----------------------------------------------------------------
-- P0: Customer + Invoice + Payment (modal dropdowns & CRUD lists)
-- ----------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_customers_company_created
    ON customers (company_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_invoices_company_status_created
    ON invoices (company_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_invoices_company_billing_start
    ON invoices (company_id, billing_start_date);

CREATE INDEX IF NOT EXISTS idx_invoices_customer_id
    ON invoices (customer_id);

CREATE INDEX IF NOT EXISTS idx_payments_company_payment_date
    ON payments (company_id, payment_date DESC);

CREATE INDEX IF NOT EXISTS idx_payments_invoice_id
    ON payments (invoice_id);

CREATE INDEX IF NOT EXISTS idx_payments_company_status
    ON payments (company_id, status);

-- ----------------------------------------------------------------
-- P1: Text search (pg_trgm) for dropdown / CRUD `q` filters
-- ----------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_customers_name_trgm
    ON customers USING gin (
        (COALESCE(first_name, '') || ' ' || COALESCE(last_name, '')) gin_trgm_ops
    );

CREATE INDEX IF NOT EXISTS idx_customers_internet_id_trgm
    ON customers USING gin (internet_id gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_customers_phone1_trgm
    ON customers USING gin (phone_1 gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_invoices_number_trgm
    ON invoices USING gin (invoice_number gin_trgm_ops);

-- ----------------------------------------------------------------
-- P2: Complaints, recovery, tasks, expenses, logs, packages
-- ----------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_complaints_customer_id
    ON complaints (customer_id);

CREATE INDEX IF NOT EXISTS idx_complaints_assigned_to
    ON complaints (assigned_to);

CREATE INDEX IF NOT EXISTS idx_complaints_created_at
    ON complaints (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_recovery_tasks_company_status
    ON recovery_tasks (company_id, status);

CREATE INDEX IF NOT EXISTS idx_recovery_tasks_assigned_to
    ON recovery_tasks (assigned_to);

CREATE INDEX IF NOT EXISTS idx_recovery_tasks_invoice_id
    ON recovery_tasks (invoice_id);

CREATE INDEX IF NOT EXISTS idx_tasks_company_created
    ON tasks (company_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tasks_customer_id
    ON tasks (customer_id);

CREATE INDEX IF NOT EXISTS idx_expenses_company_created
    ON expenses (company_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_detailed_logs_company_created
    ON detailed_logs (company_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_customer_packages_customer_active
    ON customer_packages (customer_id, is_active);

-- Junction / line-item helpers (idempotent if migrate_to_new_schema already ran)
CREATE INDEX IF NOT EXISTS idx_customer_packages_customer_id
    ON customer_packages (customer_id);

CREATE INDEX IF NOT EXISTS idx_customer_packages_service_plan_id
    ON customer_packages (service_plan_id);

CREATE INDEX IF NOT EXISTS idx_invoice_line_items_invoice_id
    ON invoice_line_items (invoice_id);

CREATE INDEX IF NOT EXISTS idx_task_assignees_task_id
    ON task_assignees (task_id);

CREATE INDEX IF NOT EXISTS idx_task_assignees_employee_id
    ON task_assignees (employee_id);

CREATE INDEX IF NOT EXISTS idx_employee_ledger_employee_id
    ON employee_ledger (employee_id);

CREATE INDEX IF NOT EXISTS idx_employee_ledger_company_id
    ON employee_ledger (company_id);

CREATE INDEX IF NOT EXISTS idx_sub_zones_area_id
    ON sub_zones (area_id);

CREATE INDEX IF NOT EXISTS idx_sub_zones_company_id
    ON sub_zones (company_id);

COMMIT;


-- =============================================================================
-- END FILE: 2026-08-28_search_filter_performance_indexes.sql
-- =============================================================================

-- =============================================================================
-- BEGIN FILE: 2026-08-28_bank_account_qr_code_image.sql
-- LastWriteTime: 2026-08-26 16:52:47
-- =============================================================================

-- ================================================================
-- Bank account payment QR code image (optional per account)
-- ================================================================

BEGIN;

ALTER TABLE bank_accounts
    ADD COLUMN IF NOT EXISTS qr_code_image VARCHAR(500);

COMMIT;


-- =============================================================================
-- END FILE: 2026-08-28_bank_account_qr_code_image.sql
-- =============================================================================

-- =============================================================================
-- BEGIN FILE: 2026-08-26_public_website_merchandising.sql
-- LastWriteTime: 2026-08-26 18:13:02
-- =============================================================================

-- ================================================================
-- PUBLIC WEBSITE MERCHANDISING
-- Customer-facing publication and offer fields for the multi-tenant
-- ISP website. Existing operational records remain private by default.
-- ================================================================

BEGIN;

ALTER TABLE service_plans
    ADD COLUMN IF NOT EXISTS product_type VARCHAR(20) NOT NULL DEFAULT 'internet',
    ADD COLUMN IF NOT EXISTS customer_type VARCHAR(20) NOT NULL DEFAULT 'residential',
    ADD COLUMN IF NOT EXISTS public_name VARCHAR(120),
    ADD COLUMN IF NOT EXISTS upload_speed_mbps INTEGER,
    ADD COLUMN IF NOT EXISTS installation_fee NUMERIC(10, 2),
    ADD COLUMN IF NOT EXISTS equipment_fee NUMERIC(10, 2),
    ADD COLUMN IF NOT EXISTS tax_inclusive BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS contract_term_months INTEGER,
    ADD COLUMN IF NOT EXISTS technology VARCHAR(30),
    ADD COLUMN IF NOT EXISTS is_unlimited BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS display_order INTEGER NOT NULL DEFAULT 100;

ALTER TABLE areas
    ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE sub_zones
    ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS ix_service_plans_public_catalog
    ON service_plans (company_id, is_public, customer_type, product_type, display_order)
    WHERE is_active = true;

CREATE INDEX IF NOT EXISTS ix_areas_public_coverage
    ON areas (company_id, is_public, name)
    WHERE is_active = true;

CREATE INDEX IF NOT EXISTS ix_sub_zones_public_coverage
    ON sub_zones (company_id, area_id, is_public, name)
    WHERE is_active = true;

ALTER TABLE service_plans
    DROP CONSTRAINT IF EXISTS ck_service_plans_product_type;
ALTER TABLE service_plans
    ADD CONSTRAINT ck_service_plans_product_type
    CHECK (product_type IN ('internet', 'tv', 'iptv', 'addon', 'static_ip'));

ALTER TABLE service_plans
    DROP CONSTRAINT IF EXISTS ck_service_plans_customer_type;
ALTER TABLE service_plans
    ADD CONSTRAINT ck_service_plans_customer_type
    CHECK (customer_type IN ('residential', 'business'));

COMMIT;

-- Deliberately no automatic public backfill. Existing billing records include
-- TV, IPTV, static IP, internal tariffs, and test plans. An administrator must
-- review and publish each customer-facing offer explicitly.


-- =============================================================================
-- END FILE: 2026-08-26_public_website_merchandising.sql
-- =============================================================================

-- =============================================================================
-- BEGIN FILE: 2026-08-26_mbanet_public_catalog.sql
-- LastWriteTime: 2026-08-26 18:31:36
-- =============================================================================

-- ================================================================
-- MBA NET INITIAL PUBLIC CATALOG
-- Reviewed launch selection for the current local preview tenant.
-- Re-runnable and intentionally excludes TV/IPTV/static-IP/internal plans.
-- ================================================================

BEGIN;

UPDATE service_plans sp
SET product_type = 'internet',
    customer_type = 'residential',
    public_name = CASE sp.speed_mbps
        WHEN 10 THEN 'Home 10'
        WHEN 20 THEN 'Home 20'
        WHEN 30 THEN 'Home 30'
        WHEN 50 THEN 'Home 50'
        WHEN 70 THEN 'Home 70'
        WHEN 100 THEN 'Home 100'
    END,
    is_public = true,
    is_featured = (sp.speed_mbps = 30),
    display_order = sp.speed_mbps
FROM companies c
WHERE sp.company_id = c.id
  AND c.name = 'MBA Net Communications'
  AND sp.name IN (
      'V-10Mbps-Pure',
      'V-20Mbps-Pure',
      'V-30Mbps-Pure',
      'V-50Mbps-Pure',
      'V-70Mbps-Pure',
      'V-100Mbps-Pure'
  );

UPDATE areas a
SET is_public = true
FROM companies c
WHERE a.company_id = c.id
  AND c.name = 'MBA Net Communications'
  AND a.is_active = true
  AND a.name NOT IN ('Test Area 101', 'Wireless');

UPDATE companies
SET website_content = COALESCE(website_content, '{}'::jsonb) || jsonb_build_object(
    'hero_headline', 'Fast home internet for Sabzazar and nearby Lahore neighbourhoods',
    'hero_subheadline', 'Check your area, compare published packages and confirm the connection with our local team.',
    'service_city', 'Sabzazar, Lahore and nearby areas',
    'coverage_blurb', 'Our network serves selected Lahore neighbourhoods. Choose your area, then share your street or block for an exact availability check.',
    'brand_color', '#087c69',
    'customer_portal_url', '/customer-portal',
    'show_customer_count', false
)
WHERE name = 'MBA Net Communications';

COMMIT;


-- =============================================================================
-- END FILE: 2026-08-26_mbanet_public_catalog.sql
-- =============================================================================

-- =============================================================================
-- BEGIN FILE: 2026-08-26_mbanet_website_content_refinement.sql
-- LastWriteTime: 2026-08-26 19:30:07
-- =============================================================================

BEGIN;

UPDATE companies
SET website_content = COALESCE(website_content, '{}'::jsonb) || jsonb_build_object(
    'hero_headline', 'Fast internet for Sabzazar homes',
    'hero_subheadline', 'Check your area, compare monthly packages and arrange your connection with our local team.',
    'coverage_blurb', 'Choose your area and share your street or block. Our team will confirm service availability before installation.'
)
WHERE id = 'fc481823-5b40-43bf-9b60-d539df360785'::uuid
  AND name = 'MBA Net Communications';

COMMIT;


-- =============================================================================
-- END FILE: 2026-08-26_mbanet_website_content_refinement.sql
-- =============================================================================

-- =============================================================================
-- BEGIN FILE: 2026-08-28_notifications.sql
-- LastWriteTime: 2026-08-26 20:54:23
-- =============================================================================

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


-- =============================================================================
-- END FILE: 2026-08-28_notifications.sql
-- =============================================================================

-- =============================================================================
-- BEGIN FILE: 2026-08-29_notification_preferences.sql
-- LastWriteTime: 2026-08-26 21:20:13
-- =============================================================================

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


-- =============================================================================
-- END FILE: 2026-08-29_notification_preferences.sql
-- =============================================================================

