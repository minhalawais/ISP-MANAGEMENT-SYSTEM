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
