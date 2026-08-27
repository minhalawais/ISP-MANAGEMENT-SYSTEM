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
