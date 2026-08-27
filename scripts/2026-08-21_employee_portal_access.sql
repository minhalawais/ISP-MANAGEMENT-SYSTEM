-- Per-employee portal access configuration (module visibility + OR-union scope rules).
-- Safe to re-run (IF NOT EXISTS).
-- Empty '{}' preserves legacy assignment-only portal behavior via application defaults.

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS portal_access JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN users.portal_access IS
    'Employee portal access config: area_ids, sub_zone_ids, modules.*.enabled and visibility rules';
