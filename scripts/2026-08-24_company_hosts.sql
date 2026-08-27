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
