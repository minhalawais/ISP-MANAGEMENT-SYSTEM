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
