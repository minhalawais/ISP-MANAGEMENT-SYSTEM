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
