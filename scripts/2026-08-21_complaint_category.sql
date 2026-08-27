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
