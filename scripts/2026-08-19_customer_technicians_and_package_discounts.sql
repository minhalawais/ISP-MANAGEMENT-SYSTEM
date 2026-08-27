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
