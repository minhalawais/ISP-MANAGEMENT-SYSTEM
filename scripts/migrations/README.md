# Database migrations

All dated SQL schema migrations live in this folder.

## Naming

```text
YYYY-MM-DD_short_snake_description.sql
```

Example: `2026-08-30_tasks_title_default.sql`

## Rules

1. **Put every new migration here** (`scripts/migrations/`), not in `scripts/` root.
2. Prefer idempotent SQL (`IF NOT EXISTS`, `IF EXISTS`, safe `UPDATE`s).
3. Do not put one-off data scrub / test-only scripts in production run bundles unless clearly marked.
4. Rebuild or append consolidated rollups from files in this folder when needed.

## Related

- Toast/JS utilities stay in `scripts/` root (`migrate-toasts.js`, etc.).
- Apply order for production is usually file date order (or `CONSOLIDATED_migrations_by_mtime.sql` when regenerating a rollup).
