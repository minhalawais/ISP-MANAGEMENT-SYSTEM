-- ================================================================
-- Scrub customer + employee phones to a single safe test number.
-- Prevents accidental WhatsApp/SMS to real users in local/staging.
-- Target number: 03120614727
-- ================================================================

BEGIN;

-- Customers
UPDATE customers
SET phone_1 = '03120614727',
    updated_at = CURRENT_TIMESTAMP
WHERE phone_1 IS DISTINCT FROM '03120614727';

UPDATE customers
SET phone_2 = '03120614727',
    updated_at = CURRENT_TIMESTAMP
WHERE phone_2 IS NOT NULL
  AND phone_2 IS DISTINCT FROM '03120614727';

-- Employees / users (staff contact fields)
UPDATE users
SET contact_number = '03120614727',
    updated_at = CURRENT_TIMESTAMP
WHERE contact_number IS NOT NULL
  AND contact_number IS DISTINCT FROM '03120614727';

UPDATE users
SET emergency_contact = '03120614727',
    updated_at = CURRENT_TIMESTAMP
WHERE emergency_contact IS NOT NULL
  AND emergency_contact IS DISTINCT FROM '03120614727';

UPDATE users
SET reference_contact = '03120614727',
    updated_at = CURRENT_TIMESTAMP
WHERE reference_contact IS NOT NULL
  AND reference_contact IS DISTINCT FROM '03120614727';

-- Pending / retryable WhatsApp queue rows still holding old mobiles
UPDATE whatsapp_message_queue
SET mobile = '923120614727',
    updated_at = CURRENT_TIMESTAMP
WHERE status IN ('pending', 'failed')
  AND mobile IS DISTINCT FROM '923120614727';

COMMIT;

-- Verification counts
SELECT 'customers.phone_1' AS field, COUNT(*) AS rows_with_test_number
FROM customers WHERE phone_1 = '03120614727'
UNION ALL
SELECT 'customers.phone_2', COUNT(*) FROM customers WHERE phone_2 = '03120614727'
UNION ALL
SELECT 'users.contact_number', COUNT(*) FROM users WHERE contact_number = '03120614727'
UNION ALL
SELECT 'users.emergency_contact', COUNT(*) FROM users WHERE emergency_contact = '03120614727'
UNION ALL
SELECT 'users.reference_contact', COUNT(*) FROM users WHERE reference_contact = '03120614727'
UNION ALL
SELECT 'whatsapp_queue.mobile', COUNT(*) FROM whatsapp_message_queue WHERE mobile = '923120614727';
