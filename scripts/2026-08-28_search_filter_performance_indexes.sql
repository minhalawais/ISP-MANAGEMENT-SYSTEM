-- ================================================================
-- SEARCH / FILTER PERFORMANCE INDEXES
-- Covers customer & invoice modal dropdowns, CRUD list pages,
-- month/status filters, and JOINs used across payments/complaints/
-- recovery/tasks.
--
-- Safe to re-run: all statements use IF NOT EXISTS.
--
-- Notes:
--   - B-tree composites accelerate WHERE company_id = ? + ORDER BY /
--     status / date filters.
--   - pg_trgm GIN indexes accelerate ILIKE '%term%' searches used by
--     dropdown autocomplete and CRUD `q` filters (B-tree cannot).
--   - For very large production tables under load, prefer
--     CREATE INDEX CONCURRENTLY (cannot run inside a transaction).
-- ================================================================

BEGIN;

-- Required for trigram (ILIKE '%…%') indexes
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ----------------------------------------------------------------
-- P0: Customer + Invoice + Payment (modal dropdowns & CRUD lists)
-- ----------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_customers_company_created
    ON customers (company_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_invoices_company_status_created
    ON invoices (company_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_invoices_company_billing_start
    ON invoices (company_id, billing_start_date);

CREATE INDEX IF NOT EXISTS idx_invoices_customer_id
    ON invoices (customer_id);

CREATE INDEX IF NOT EXISTS idx_payments_company_payment_date
    ON payments (company_id, payment_date DESC);

CREATE INDEX IF NOT EXISTS idx_payments_invoice_id
    ON payments (invoice_id);

CREATE INDEX IF NOT EXISTS idx_payments_company_status
    ON payments (company_id, status);

-- ----------------------------------------------------------------
-- P1: Text search (pg_trgm) for dropdown / CRUD `q` filters
-- ----------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_customers_name_trgm
    ON customers USING gin (
        (COALESCE(first_name, '') || ' ' || COALESCE(last_name, '')) gin_trgm_ops
    );

CREATE INDEX IF NOT EXISTS idx_customers_internet_id_trgm
    ON customers USING gin (internet_id gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_customers_phone1_trgm
    ON customers USING gin (phone_1 gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_invoices_number_trgm
    ON invoices USING gin (invoice_number gin_trgm_ops);

-- ----------------------------------------------------------------
-- P2: Complaints, recovery, tasks, expenses, logs, packages
-- ----------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_complaints_customer_id
    ON complaints (customer_id);

CREATE INDEX IF NOT EXISTS idx_complaints_assigned_to
    ON complaints (assigned_to);

CREATE INDEX IF NOT EXISTS idx_complaints_created_at
    ON complaints (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_recovery_tasks_company_status
    ON recovery_tasks (company_id, status);

CREATE INDEX IF NOT EXISTS idx_recovery_tasks_assigned_to
    ON recovery_tasks (assigned_to);

CREATE INDEX IF NOT EXISTS idx_recovery_tasks_invoice_id
    ON recovery_tasks (invoice_id);

CREATE INDEX IF NOT EXISTS idx_tasks_company_created
    ON tasks (company_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tasks_customer_id
    ON tasks (customer_id);

CREATE INDEX IF NOT EXISTS idx_expenses_company_created
    ON expenses (company_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_detailed_logs_company_created
    ON detailed_logs (company_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_customer_packages_customer_active
    ON customer_packages (customer_id, is_active);

-- Junction / line-item helpers (idempotent if migrate_to_new_schema already ran)
CREATE INDEX IF NOT EXISTS idx_customer_packages_customer_id
    ON customer_packages (customer_id);

CREATE INDEX IF NOT EXISTS idx_customer_packages_service_plan_id
    ON customer_packages (service_plan_id);

CREATE INDEX IF NOT EXISTS idx_invoice_line_items_invoice_id
    ON invoice_line_items (invoice_id);

CREATE INDEX IF NOT EXISTS idx_task_assignees_task_id
    ON task_assignees (task_id);

CREATE INDEX IF NOT EXISTS idx_task_assignees_employee_id
    ON task_assignees (employee_id);

CREATE INDEX IF NOT EXISTS idx_employee_ledger_employee_id
    ON employee_ledger (employee_id);

CREATE INDEX IF NOT EXISTS idx_employee_ledger_company_id
    ON employee_ledger (company_id);

CREATE INDEX IF NOT EXISTS idx_sub_zones_area_id
    ON sub_zones (area_id);

CREATE INDEX IF NOT EXISTS idx_sub_zones_company_id
    ON sub_zones (company_id);

COMMIT;
