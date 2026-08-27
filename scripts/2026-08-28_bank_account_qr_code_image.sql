-- ================================================================
-- Bank account payment QR code image (optional per account)
-- ================================================================

BEGIN;

ALTER TABLE bank_accounts
    ADD COLUMN IF NOT EXISTS qr_code_image VARCHAR(500);

COMMIT;
