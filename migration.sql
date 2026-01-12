-- ============================================================================
-- ISP MANAGEMENT SYSTEM - DATABASE MIGRATION SCRIPT
-- Migrates from old_models.py schema to new_models.py schema
-- 
-- Usage:
--   1. Take a full database backup first!
--   2. Run: psql -h localhost -U postgres -d isp_management -f migration.sql
--
-- Author: Auto-generated migration script
-- Date: 2026-01-12
-- ============================================================================

BEGIN;

-- ============================================================================
-- PHASE 1: CREATE NEW TABLES
-- ============================================================================

DO $$ BEGIN RAISE NOTICE '============================================================'; END $$;
DO $$ BEGIN RAISE NOTICE 'PHASE 1: CREATING NEW TABLES'; END $$;
DO $$ BEGIN RAISE NOTICE '============================================================'; END $$;

-- -----------------------------------------------------------------------------
-- 1.1 SubZones Table
-- -----------------------------------------------------------------------------
DO $$ BEGIN RAISE NOTICE 'Creating sub_zones table...'; END $$;

CREATE TABLE IF NOT EXISTS sub_zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id),
    area_id UUID NOT NULL REFERENCES areas(id),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_sub_zones_area_id ON sub_zones(area_id);
CREATE INDEX IF NOT EXISTS idx_sub_zones_company_id ON sub_zones(company_id);

-- -----------------------------------------------------------------------------
-- 1.2 Customer Packages Table (Junction for Customer-ServicePlan)
-- -----------------------------------------------------------------------------
DO $$ BEGIN RAISE NOTICE 'Creating customer_packages table...'; END $$;

CREATE TABLE IF NOT EXISTS customer_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id),
    service_plan_id UUID NOT NULL REFERENCES service_plans(id),
    start_date DATE NOT NULL,
    end_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_customer_packages_customer_id ON customer_packages(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_packages_service_plan_id ON customer_packages(service_plan_id);

-- -----------------------------------------------------------------------------
-- 1.3 Invoice Line Items Table
-- -----------------------------------------------------------------------------
DO $$ BEGIN RAISE NOTICE 'Creating invoice_line_items table...'; END $$;

CREATE TABLE IF NOT EXISTS invoice_line_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id),
    customer_package_id UUID REFERENCES customer_packages(id),
    inventory_item_id UUID REFERENCES inventory_items(id),
    item_type VARCHAR(20) DEFAULT 'package',
    description VARCHAR(255) NOT NULL,
    quantity INTEGER DEFAULT 1,
    unit_price NUMERIC(10, 2) NOT NULL,
    discount_amount NUMERIC(10, 2) DEFAULT 0,
    line_total NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_invoice_line_items_invoice_id ON invoice_line_items(invoice_id);

-- -----------------------------------------------------------------------------
-- 1.4 Task Assignees Table (Junction for Task-Employee)
-- -----------------------------------------------------------------------------
DO $$ BEGIN RAISE NOTICE 'Creating task_assignees table...'; END $$;

CREATE TABLE IF NOT EXISTS task_assignees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES users(id),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_task_assignees_task_id ON task_assignees(task_id);
CREATE INDEX IF NOT EXISTS idx_task_assignees_employee_id ON task_assignees(employee_id);

-- -----------------------------------------------------------------------------
-- 1.5 Vendors Table
-- -----------------------------------------------------------------------------
DO $$ BEGIN RAISE NOTICE 'Creating vendors table...'; END $$;

CREATE TABLE IF NOT EXISTS vendors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    cnic VARCHAR(15) NOT NULL,
    picture VARCHAR(500),
    cnic_front_image VARCHAR(500),
    cnic_back_image VARCHAR(500),
    agreement_document VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- -----------------------------------------------------------------------------
-- 1.6 Internal Transfers Table
-- -----------------------------------------------------------------------------
DO $$ BEGIN RAISE NOTICE 'Creating internal_transfers table...'; END $$;

CREATE TABLE IF NOT EXISTS internal_transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id),
    from_account_id UUID NOT NULL REFERENCES bank_accounts(id),
    to_account_id UUID NOT NULL REFERENCES bank_accounts(id),
    amount NUMERIC(15, 2) NOT NULL,
    transfer_date TIMESTAMP WITH TIME ZONE NOT NULL,
    description TEXT,
    reference_number VARCHAR(100),
    status VARCHAR(20) DEFAULT 'completed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 1.7 Employee Ledger Table
-- -----------------------------------------------------------------------------
DO $$ BEGIN RAISE NOTICE 'Creating employee_ledger table...'; END $$;

CREATE TABLE IF NOT EXISTS employee_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id),
    employee_id UUID NOT NULL REFERENCES users(id),
    transaction_type VARCHAR(50) NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    description TEXT,
    reference_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_employee_ledger_employee_id ON employee_ledger(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_ledger_company_id ON employee_ledger(company_id);


-- ============================================================================
-- PHASE 2: ADD NEW COLUMNS TO EXISTING TABLES
-- ============================================================================

DO $$ BEGIN RAISE NOTICE '============================================================'; END $$;
DO $$ BEGIN RAISE NOTICE 'PHASE 2: ADDING NEW COLUMNS TO EXISTING TABLES'; END $$;
DO $$ BEGIN RAISE NOTICE '============================================================'; END $$;

-- -----------------------------------------------------------------------------
-- 2.1 Users Table - New Employee Fields
-- -----------------------------------------------------------------------------
DO $$ BEGIN RAISE NOTICE 'Adding new columns to users table...'; END $$;

ALTER TABLE users ADD COLUMN IF NOT EXISTS emergency_contact VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS house_address TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS cnic_image VARCHAR(500);
ALTER TABLE users ADD COLUMN IF NOT EXISTS picture VARCHAR(500);
ALTER TABLE users ADD COLUMN IF NOT EXISTS utility_bill_image VARCHAR(500);
ALTER TABLE users ADD COLUMN IF NOT EXISTS joining_date DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS salary NUMERIC(10, 2);
ALTER TABLE users ADD COLUMN IF NOT EXISTS reference_name VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS reference_contact VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS reference_cnic_image VARCHAR(500);
ALTER TABLE users ADD COLUMN IF NOT EXISTS current_balance NUMERIC(10, 2) DEFAULT 0.00;
ALTER TABLE users ADD COLUMN IF NOT EXISTS paid_amount NUMERIC(10, 2) DEFAULT 0.00;
ALTER TABLE users ADD COLUMN IF NOT EXISTS commission_amount_per_complaint NUMERIC(10, 2) DEFAULT 0.00;

-- -----------------------------------------------------------------------------
-- 2.2 Customers Table - SubZone and Technician
-- -----------------------------------------------------------------------------
DO $$ BEGIN RAISE NOTICE 'Adding new columns to customers table...'; END $$;

ALTER TABLE customers ADD COLUMN IF NOT EXISTS sub_zone_id UUID REFERENCES sub_zones(id);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS technician_id UUID REFERENCES users(id);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS connection_commission_amount NUMERIC(10, 2) DEFAULT 0.00;

-- -----------------------------------------------------------------------------
-- 2.3 Service Plans Table - ISP Link
-- -----------------------------------------------------------------------------
DO $$ BEGIN RAISE NOTICE 'Adding isp_id to service_plans table...'; END $$;

ALTER TABLE service_plans ADD COLUMN IF NOT EXISTS isp_id UUID REFERENCES isps(id);

-- -----------------------------------------------------------------------------
-- 2.4 Bank Accounts Table - Current Balance
-- -----------------------------------------------------------------------------
DO $$ BEGIN RAISE NOTICE 'Adding current_balance to bank_accounts table...'; END $$;

ALTER TABLE bank_accounts ADD COLUMN IF NOT EXISTS current_balance NUMERIC(15, 2) DEFAULT 0.00;

-- Initialize current_balance from initial_balance
UPDATE bank_accounts 
SET current_balance = COALESCE(initial_balance, 0.00) 
WHERE current_balance IS NULL OR current_balance = 0;

-- -----------------------------------------------------------------------------
-- 2.5 Tasks Table - New Fields
-- -----------------------------------------------------------------------------
DO $$ BEGIN RAISE NOTICE 'Adding new columns to tasks table...'; END $$;

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completion_notes TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completion_proof VARCHAR(500);

-- -----------------------------------------------------------------------------
-- 2.6 Recovery Tasks Table - Simplified Schema
-- -----------------------------------------------------------------------------
DO $$ BEGIN RAISE NOTICE 'Adding new columns to recovery_tasks table...'; END $$;

ALTER TABLE recovery_tasks ADD COLUMN IF NOT EXISTS completion_notes TEXT;
ALTER TABLE recovery_tasks ADD COLUMN IF NOT EXISTS completion_proof VARCHAR(500);
ALTER TABLE recovery_tasks ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- -----------------------------------------------------------------------------
-- 2.7 Expenses Table - Employee Payments
-- -----------------------------------------------------------------------------
DO $$ BEGIN RAISE NOTICE 'Adding new columns to expenses table...'; END $$;

ALTER TABLE expenses ADD COLUMN IF NOT EXISTS employee_id UUID REFERENCES users(id);
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS payment_proof VARCHAR(500);

-- -----------------------------------------------------------------------------
-- 2.8 Extra Incomes Table - Payment Proof
-- -----------------------------------------------------------------------------
DO $$ BEGIN RAISE NOTICE 'Adding payment_proof to extra_incomes table...'; END $$;

ALTER TABLE extra_incomes ADD COLUMN IF NOT EXISTS payment_proof VARCHAR(500);

-- -----------------------------------------------------------------------------
-- 2.9 Expense Types Table - Employee Payment Flag
-- -----------------------------------------------------------------------------
DO $$ BEGIN RAISE NOTICE 'Adding is_employee_payment to expense_types table...'; END $$;

ALTER TABLE expense_types ADD COLUMN IF NOT EXISTS is_employee_payment BOOLEAN DEFAULT FALSE;


-- ============================================================================
-- PHASE 3: DATA MIGRATION
-- ============================================================================

DO $$ BEGIN RAISE NOTICE '============================================================'; END $$;
DO $$ BEGIN RAISE NOTICE 'PHASE 3: DATA MIGRATION'; END $$;
DO $$ BEGIN RAISE NOTICE '============================================================'; END $$;

-- -----------------------------------------------------------------------------
-- 3.1 Create Default SubZones from Areas
-- For each Area, create a SubZone with the same name
-- -----------------------------------------------------------------------------
DO $$ 
DECLARE
    areas_count INTEGER;
    subzones_created INTEGER;
BEGIN
    RAISE NOTICE '----------------------------------------';
    RAISE NOTICE 'Step 3.1: Creating default SubZones from Areas';
    
    SELECT COUNT(*) INTO areas_count FROM areas;
    RAISE NOTICE 'Found % areas to process', areas_count;
    
    INSERT INTO sub_zones (id, company_id, area_id, name, description, is_active, created_at, updated_at)
    SELECT 
        gen_random_uuid(),
        company_id,
        id,
        name,
        COALESCE(description, 'Default sub-zone for ' || name),
        is_active,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    FROM areas
    WHERE NOT EXISTS (
        SELECT 1 FROM sub_zones sz WHERE sz.area_id = areas.id AND sz.name = areas.name
    );
    
    GET DIAGNOSTICS subzones_created = ROW_COUNT;
    RAISE NOTICE 'Created % new SubZones', subzones_created;
END $$;

-- -----------------------------------------------------------------------------
-- 3.2 Link Customers to their SubZones
-- Each customer gets linked to the default SubZone created from their Area
-- -----------------------------------------------------------------------------
DO $$ 
DECLARE
    customers_count INTEGER;
    linked_count INTEGER;
BEGIN
    RAISE NOTICE '----------------------------------------';
    RAISE NOTICE 'Step 3.2: Linking Customers to SubZones';
    
    SELECT COUNT(*) INTO customers_count FROM customers;
    RAISE NOTICE 'Found % customers to process', customers_count;
    
    UPDATE customers c
    SET sub_zone_id = sz.id
    FROM sub_zones sz
    WHERE c.area_id = sz.area_id
      AND sz.name = (SELECT name FROM areas WHERE id = c.area_id)
      AND c.sub_zone_id IS NULL;
    
    GET DIAGNOSTICS linked_count = ROW_COUNT;
    RAISE NOTICE 'Linked % customers to SubZones', linked_count;
END $$;

-- -----------------------------------------------------------------------------
-- 3.3 Migrate CustomerPackages from service_plan_id
-- Create CustomerPackage records from existing service_plan_id relationships
-- -----------------------------------------------------------------------------
DO $$ 
DECLARE
    customers_with_plans INTEGER;
    packages_created INTEGER;
BEGIN
    RAISE NOTICE '----------------------------------------';
    RAISE NOTICE 'Step 3.3: Migrating CustomerPackages from service_plan_id';
    
    SELECT COUNT(*) INTO customers_with_plans 
    FROM customers WHERE service_plan_id IS NOT NULL;
    RAISE NOTICE 'Found % customers with service plans', customers_with_plans;
    
    INSERT INTO customer_packages (id, customer_id, service_plan_id, start_date, is_active, created_at, updated_at)
    SELECT 
        gen_random_uuid(),
        c.id,
        c.service_plan_id,
        COALESCE(c.installation_date, c.created_at::DATE, CURRENT_DATE),
        TRUE,  -- Package is always active, independent of customer status
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    FROM customers c
    WHERE c.service_plan_id IS NOT NULL
      AND NOT EXISTS (
          SELECT 1 FROM customer_packages cp 
          WHERE cp.customer_id = c.id AND cp.service_plan_id = c.service_plan_id
      );
    
    GET DIAGNOSTICS packages_created = ROW_COUNT;
    RAISE NOTICE 'Created % CustomerPackage records', packages_created;
END $$;

-- -----------------------------------------------------------------------------
-- 3.4 Migrate Task Assignees
-- Move existing assigned_to values to the junction table
-- -----------------------------------------------------------------------------
DO $$ 
DECLARE
    col_exists BOOLEAN;
    tasks_with_assignee INTEGER;
    assignees_created INTEGER;
BEGIN
    RAISE NOTICE '----------------------------------------';
    RAISE NOTICE 'Step 3.4: Migrating Task Assignees';
    
    -- Check if assigned_to column exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tasks' AND column_name = 'assigned_to'
    ) INTO col_exists;
    
    IF col_exists THEN
        SELECT COUNT(*) INTO tasks_with_assignee 
        FROM tasks WHERE assigned_to IS NOT NULL;
        RAISE NOTICE 'Found % tasks with assignees', tasks_with_assignee;
        
        INSERT INTO task_assignees (id, task_id, employee_id, assigned_at)
        SELECT 
            gen_random_uuid(),
            t.id,
            t.assigned_to,
            COALESCE(t.created_at, CURRENT_TIMESTAMP)
        FROM tasks t
        WHERE t.assigned_to IS NOT NULL
          AND NOT EXISTS (
              SELECT 1 FROM task_assignees ta 
              WHERE ta.task_id = t.id AND ta.employee_id = t.assigned_to
          );
        
        GET DIAGNOSTICS assignees_created = ROW_COUNT;
        RAISE NOTICE 'Created % TaskAssignee records', assignees_created;
    ELSE
        RAISE NOTICE 'Skipping - assigned_to column not found in tasks table';
    END IF;
END $$;


-- ============================================================================
-- PHASE 4: VERIFICATION
-- ============================================================================

DO $$ BEGIN RAISE NOTICE '============================================================'; END $$;
DO $$ BEGIN RAISE NOTICE 'PHASE 4: VERIFICATION'; END $$;
DO $$ BEGIN RAISE NOTICE '============================================================'; END $$;

-- -----------------------------------------------------------------------------
-- 4.1 Verify all Areas have SubZones
-- -----------------------------------------------------------------------------
DO $$ 
DECLARE
    areas_without_subzones INTEGER;
BEGIN
    RAISE NOTICE '----------------------------------------';
    RAISE NOTICE 'Check 1: Verifying all Areas have SubZones';
    
    SELECT COUNT(*) INTO areas_without_subzones
    FROM areas a
    WHERE NOT EXISTS (SELECT 1 FROM sub_zones sz WHERE sz.area_id = a.id);
    
    IF areas_without_subzones > 0 THEN
        RAISE WARNING 'FAILED: % areas without SubZones', areas_without_subzones;
    ELSE
        RAISE NOTICE 'PASSED: All areas have SubZones';
    END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 4.2 Verify all Customers are linked to SubZones
-- -----------------------------------------------------------------------------
DO $$ 
DECLARE
    unlinked_customers INTEGER;
BEGIN
    RAISE NOTICE '----------------------------------------';
    RAISE NOTICE 'Check 2: Verifying all Customers are linked to SubZones';
    
    SELECT COUNT(*) INTO unlinked_customers
    FROM customers WHERE sub_zone_id IS NULL;
    
    IF unlinked_customers > 0 THEN
        RAISE WARNING 'FAILED: % customers not linked to SubZones', unlinked_customers;
    ELSE
        RAISE NOTICE 'PASSED: All customers linked to SubZones';
    END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 4.3 Verify CustomerPackages were created
-- -----------------------------------------------------------------------------
DO $$ 
DECLARE
    customers_with_plans INTEGER;
    package_records INTEGER;
BEGIN
    RAISE NOTICE '----------------------------------------';
    RAISE NOTICE 'Check 3: Verifying CustomerPackages were created';
    
    SELECT COUNT(*) INTO customers_with_plans 
    FROM customers WHERE service_plan_id IS NOT NULL;
    
    SELECT COUNT(*) INTO package_records FROM customer_packages;
    
    IF customers_with_plans != package_records THEN
        RAISE WARNING 'MISMATCH: % customers with plans, % package records', 
            customers_with_plans, package_records;
    ELSE
        RAISE NOTICE 'PASSED: % CustomerPackage records created', package_records;
    END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 4.4 Verify Task Assignees were migrated
-- -----------------------------------------------------------------------------
DO $$ 
DECLARE
    col_exists BOOLEAN;
    tasks_with_assignee INTEGER;
    assignee_records INTEGER;
BEGIN
    RAISE NOTICE '----------------------------------------';
    RAISE NOTICE 'Check 4: Verifying Task Assignees were migrated';
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tasks' AND column_name = 'assigned_to'
    ) INTO col_exists;
    
    IF col_exists THEN
        SELECT COUNT(*) INTO tasks_with_assignee 
        FROM tasks WHERE assigned_to IS NOT NULL;
        
        SELECT COUNT(*) INTO assignee_records FROM task_assignees;
        
        IF tasks_with_assignee != assignee_records THEN
            RAISE WARNING 'MISMATCH: % tasks with assignee, % assignee records', 
                tasks_with_assignee, assignee_records;
        ELSE
            RAISE NOTICE 'PASSED: % TaskAssignee records created', assignee_records;
        END IF;
    ELSE
        RAISE NOTICE 'SKIPPED: No assigned_to column in tasks table';
    END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 4.5 Verify SubZone-Area relationships are correct
-- -----------------------------------------------------------------------------
DO $$ 
DECLARE
    mismatches INTEGER;
BEGIN
    RAISE NOTICE '----------------------------------------';
    RAISE NOTICE 'Check 5: Verifying SubZone-Area relationships';
    
    SELECT COUNT(*) INTO mismatches
    FROM customers c
    JOIN sub_zones sz ON c.sub_zone_id = sz.id
    WHERE sz.area_id != c.area_id;
    
    IF mismatches > 0 THEN
        RAISE WARNING 'FAILED: % mismatched SubZone-Area relationships', mismatches;
    ELSE
        RAISE NOTICE 'PASSED: All SubZone-Area relationships correct';
    END IF;
END $$;

-- ============================================================================
-- FINAL SUMMARY
-- ============================================================================

DO $$ 
DECLARE
    sub_zones_count INTEGER;
    customer_packages_count INTEGER;
    invoice_line_items_count INTEGER;
    task_assignees_count INTEGER;
    vendors_count INTEGER;
    internal_transfers_count INTEGER;
    employee_ledger_count INTEGER;
BEGIN
    RAISE NOTICE '============================================================';
    RAISE NOTICE 'MIGRATION COMPLETE - SUMMARY';
    RAISE NOTICE '============================================================';
    
    SELECT COUNT(*) INTO sub_zones_count FROM sub_zones;
    SELECT COUNT(*) INTO customer_packages_count FROM customer_packages;
    SELECT COUNT(*) INTO invoice_line_items_count FROM invoice_line_items;
    SELECT COUNT(*) INTO task_assignees_count FROM task_assignees;
    SELECT COUNT(*) INTO vendors_count FROM vendors;
    SELECT COUNT(*) INTO internal_transfers_count FROM internal_transfers;
    SELECT COUNT(*) INTO employee_ledger_count FROM employee_ledger;
    
    RAISE NOTICE 'New Tables Created:';
    RAISE NOTICE '  - sub_zones: % records', sub_zones_count;
    RAISE NOTICE '  - customer_packages: % records', customer_packages_count;
    RAISE NOTICE '  - invoice_line_items: % records', invoice_line_items_count;
    RAISE NOTICE '  - task_assignees: % records', task_assignees_count;
    RAISE NOTICE '  - vendors: % records', vendors_count;
    RAISE NOTICE '  - internal_transfers: % records', internal_transfers_count;
    RAISE NOTICE '  - employee_ledger: % records', employee_ledger_count;
    
    RAISE NOTICE '============================================================';
    RAISE NOTICE 'Migration completed successfully!';
    RAISE NOTICE '============================================================';
END $$;

COMMIT;

-- ============================================================================
-- END OF MIGRATION SCRIPT
-- ============================================================================
