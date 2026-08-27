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
