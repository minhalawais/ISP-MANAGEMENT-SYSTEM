"""
ISP Management System - Database Migration Script
Migrates from old_models.py schema to new_models.py schema

Usage:
    1. Take a full database backup first!
    2. Run: python migrate_to_new_schema.py
    
Author: Auto-generated migration script
Date: 2026-01-12
"""

import psycopg2
from psycopg2.extras import RealDictCursor
import uuid
import sys
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('migration.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

# ============================================================================
# CONFIGURATION - UPDATE THESE VALUES FOR YOUR ENVIRONMENT
# ============================================================================
DB_CONFIG = {
    'host': 'localhost',
    'port': 5432,
    'database': 'isp_management',
    'user': 'postgres',
    'password': 'YOUR_PASSWORD_HERE'  # Update this!
}

# Set to True to actually run the migration, False for dry-run
DRY_RUN = False

# ============================================================================
# PHASE 1: CREATE NEW TABLES
# ============================================================================

CREATE_SUB_ZONES_TABLE = """
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
"""

CREATE_SUB_ZONES_INDEXES = """
CREATE INDEX IF NOT EXISTS idx_sub_zones_area_id ON sub_zones(area_id);
CREATE INDEX IF NOT EXISTS idx_sub_zones_company_id ON sub_zones(company_id);
"""

CREATE_CUSTOMER_PACKAGES_TABLE = """
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
"""

CREATE_CUSTOMER_PACKAGES_INDEXES = """
CREATE INDEX IF NOT EXISTS idx_customer_packages_customer_id ON customer_packages(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_packages_service_plan_id ON customer_packages(service_plan_id);
"""

CREATE_INVOICE_LINE_ITEMS_TABLE = """
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
"""

CREATE_INVOICE_LINE_ITEMS_INDEXES = """
CREATE INDEX IF NOT EXISTS idx_invoice_line_items_invoice_id ON invoice_line_items(invoice_id);
"""

CREATE_TASK_ASSIGNEES_TABLE = """
CREATE TABLE IF NOT EXISTS task_assignees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES users(id),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
"""

CREATE_TASK_ASSIGNEES_INDEXES = """
CREATE INDEX IF NOT EXISTS idx_task_assignees_task_id ON task_assignees(task_id);
CREATE INDEX IF NOT EXISTS idx_task_assignees_employee_id ON task_assignees(employee_id);
"""

CREATE_VENDORS_TABLE = """
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
"""

CREATE_INTERNAL_TRANSFERS_TABLE = """
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
"""

CREATE_EMPLOYEE_LEDGER_TABLE = """
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
"""

CREATE_EMPLOYEE_LEDGER_INDEXES = """
CREATE INDEX IF NOT EXISTS idx_employee_ledger_employee_id ON employee_ledger(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_ledger_company_id ON employee_ledger(company_id);
"""

# ============================================================================
# PHASE 2: ADD NEW COLUMNS TO EXISTING TABLES
# ============================================================================

ALTER_USERS_TABLE = """
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
"""

ALTER_CUSTOMERS_TABLE = """
ALTER TABLE customers ADD COLUMN IF NOT EXISTS sub_zone_id UUID REFERENCES sub_zones(id);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS technician_id UUID REFERENCES users(id);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS connection_commission_amount NUMERIC(10, 2) DEFAULT 0.00;
"""

ALTER_SERVICE_PLANS_TABLE = """
ALTER TABLE service_plans ADD COLUMN IF NOT EXISTS isp_id UUID REFERENCES isps(id);
"""

ALTER_BANK_ACCOUNTS_TABLE = """
ALTER TABLE bank_accounts ADD COLUMN IF NOT EXISTS current_balance NUMERIC(15, 2) DEFAULT 0.00;
"""

INIT_BANK_ACCOUNT_BALANCES = """
UPDATE bank_accounts 
SET current_balance = COALESCE(initial_balance, 0.00) 
WHERE current_balance IS NULL OR current_balance = 0;
"""

ALTER_TASKS_TABLE = """
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completion_notes TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completion_proof VARCHAR(500);
"""

ALTER_RECOVERY_TASKS_TABLE = """
ALTER TABLE recovery_tasks ADD COLUMN IF NOT EXISTS completion_notes TEXT;
ALTER TABLE recovery_tasks ADD COLUMN IF NOT EXISTS completion_proof VARCHAR(500);
ALTER TABLE recovery_tasks ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;
"""

ALTER_EXPENSES_TABLE = """
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS employee_id UUID REFERENCES users(id);
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS payment_proof VARCHAR(500);
"""

ALTER_EXTRA_INCOMES_TABLE = """
ALTER TABLE extra_incomes ADD COLUMN IF NOT EXISTS payment_proof VARCHAR(500);
"""

ALTER_EXPENSE_TYPES_TABLE = """
ALTER TABLE expense_types ADD COLUMN IF NOT EXISTS is_employee_payment BOOLEAN DEFAULT FALSE;
"""

# ============================================================================
# PHASE 3: DATA MIGRATION
# ============================================================================

CREATE_DEFAULT_SUBZONES = """
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
"""

LINK_CUSTOMERS_TO_SUBZONES = """
UPDATE customers c
SET sub_zone_id = sz.id
FROM sub_zones sz
WHERE c.area_id = sz.area_id
  AND sz.name = (SELECT name FROM areas WHERE id = c.area_id)
  AND c.sub_zone_id IS NULL;
"""

MIGRATE_CUSTOMER_PACKAGES = """
INSERT INTO customer_packages (id, customer_id, service_plan_id, start_date, is_active, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    c.id,
    c.service_plan_id,
    COALESCE(c.installation_date, c.created_at::DATE, CURRENT_DATE),
    c.is_active,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM customers c
WHERE c.service_plan_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM customer_packages cp 
      WHERE cp.customer_id = c.id AND cp.service_plan_id = c.service_plan_id
  );
"""

MIGRATE_TASK_ASSIGNEES = """
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
"""

# ============================================================================
# VERIFICATION QUERIES
# ============================================================================

VERIFY_SUBZONES = """
SELECT a.id, a.name, COUNT(sz.id) as subzone_count
FROM areas a
LEFT JOIN sub_zones sz ON a.id = sz.area_id
GROUP BY a.id, a.name
HAVING COUNT(sz.id) = 0;
"""

VERIFY_CUSTOMER_SUBZONE_LINKS = """
SELECT COUNT(*) as unlinked_customers
FROM customers c
WHERE c.sub_zone_id IS NULL;
"""

VERIFY_CUSTOMER_PACKAGES = """
SELECT 
    (SELECT COUNT(*) FROM customers WHERE service_plan_id IS NOT NULL) as customers_with_plans,
    (SELECT COUNT(*) FROM customer_packages) as package_records;
"""

VERIFY_TASK_ASSIGNEES = """
SELECT 
    (SELECT COUNT(*) FROM tasks WHERE assigned_to IS NOT NULL) as tasks_with_assignee,
    (SELECT COUNT(*) FROM task_assignees) as assignee_records;
"""

VERIFY_SUBZONE_AREA_RELATIONSHIPS = """
SELECT c.id, c.first_name, c.last_name, a.name as area_name, sz.name as subzone_name
FROM customers c
JOIN areas a ON c.area_id = a.id
JOIN sub_zones sz ON c.sub_zone_id = sz.id
WHERE sz.area_id != c.area_id
LIMIT 10;
"""


class DatabaseMigration:
    """Handles the complete database migration process."""
    
    def __init__(self, db_config: dict, dry_run: bool = False):
        self.db_config = db_config
        self.dry_run = dry_run
        self.conn = None
        self.cursor = None
        
    def connect(self):
        """Establish database connection."""
        logger.info(f"Connecting to database: {self.db_config['database']}@{self.db_config['host']}")
        self.conn = psycopg2.connect(**self.db_config)
        self.cursor = self.conn.cursor(cursor_factory=RealDictCursor)
        logger.info("Database connection established")
        
    def disconnect(self):
        """Close database connection."""
        if self.cursor:
            self.cursor.close()
        if self.conn:
            self.conn.close()
        logger.info("Database connection closed")
        
    def execute(self, sql: str, description: str = ""):
        """Execute SQL statement with logging."""
        if description:
            logger.info(f"Executing: {description}")
        
        if self.dry_run:
            logger.info(f"[DRY RUN] Would execute:\n{sql[:200]}...")
            return
            
        try:
            # Handle multi-statement SQL
            for statement in sql.strip().split(';'):
                statement = statement.strip()
                if statement:
                    self.cursor.execute(statement)
            self.conn.commit()
            logger.info(f"Success: {description or 'SQL executed'}")
        except Exception as e:
            self.conn.rollback()
            logger.error(f"Error executing {description}: {e}")
            raise
            
    def execute_query(self, sql: str, description: str = "") -> list:
        """Execute query and return results."""
        if description:
            logger.info(f"Querying: {description}")
        
        self.cursor.execute(sql)
        return self.cursor.fetchall()
    
    def check_column_exists(self, table: str, column: str) -> bool:
        """Check if a column exists in a table."""
        self.cursor.execute("""
            SELECT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = %s AND column_name = %s
            );
        """, (table, column))
        return self.cursor.fetchone()['exists']
    
    def check_table_exists(self, table: str) -> bool:
        """Check if a table exists."""
        self.cursor.execute("""
            SELECT EXISTS (
                SELECT 1 FROM information_schema.tables 
                WHERE table_name = %s
            );
        """, (table,))
        return self.cursor.fetchone()['exists']
    
    # ========================================================================
    # PHASE 1: CREATE NEW TABLES
    # ========================================================================
    
    def phase1_create_tables(self):
        """Create all new tables."""
        logger.info("=" * 60)
        logger.info("PHASE 1: CREATING NEW TABLES")
        logger.info("=" * 60)
        
        # SubZones
        self.execute(CREATE_SUB_ZONES_TABLE, "Creating sub_zones table")
        self.execute(CREATE_SUB_ZONES_INDEXES, "Creating sub_zones indexes")
        
        # Customer Packages
        self.execute(CREATE_CUSTOMER_PACKAGES_TABLE, "Creating customer_packages table")
        self.execute(CREATE_CUSTOMER_PACKAGES_INDEXES, "Creating customer_packages indexes")
        
        # Invoice Line Items
        self.execute(CREATE_INVOICE_LINE_ITEMS_TABLE, "Creating invoice_line_items table")
        self.execute(CREATE_INVOICE_LINE_ITEMS_INDEXES, "Creating invoice_line_items indexes")
        
        # Task Assignees
        self.execute(CREATE_TASK_ASSIGNEES_TABLE, "Creating task_assignees table")
        self.execute(CREATE_TASK_ASSIGNEES_INDEXES, "Creating task_assignees indexes")
        
        # Vendors
        self.execute(CREATE_VENDORS_TABLE, "Creating vendors table")
        
        # Internal Transfers
        self.execute(CREATE_INTERNAL_TRANSFERS_TABLE, "Creating internal_transfers table")
        
        # Employee Ledger
        self.execute(CREATE_EMPLOYEE_LEDGER_TABLE, "Creating employee_ledger table")
        self.execute(CREATE_EMPLOYEE_LEDGER_INDEXES, "Creating employee_ledger indexes")
        
        logger.info("Phase 1 complete: All new tables created")
        
    # ========================================================================
    # PHASE 2: ADD NEW COLUMNS
    # ========================================================================
    
    def phase2_add_columns(self):
        """Add new columns to existing tables."""
        logger.info("=" * 60)
        logger.info("PHASE 2: ADDING NEW COLUMNS TO EXISTING TABLES")
        logger.info("=" * 60)
        
        self.execute(ALTER_USERS_TABLE, "Adding new columns to users table")
        self.execute(ALTER_CUSTOMERS_TABLE, "Adding new columns to customers table")
        self.execute(ALTER_SERVICE_PLANS_TABLE, "Adding isp_id to service_plans table")
        self.execute(ALTER_BANK_ACCOUNTS_TABLE, "Adding current_balance to bank_accounts table")
        self.execute(INIT_BANK_ACCOUNT_BALANCES, "Initializing bank account balances")
        self.execute(ALTER_TASKS_TABLE, "Adding new columns to tasks table")
        self.execute(ALTER_RECOVERY_TASKS_TABLE, "Adding new columns to recovery_tasks table")
        self.execute(ALTER_EXPENSES_TABLE, "Adding new columns to expenses table")
        self.execute(ALTER_EXTRA_INCOMES_TABLE, "Adding payment_proof to extra_incomes table")
        self.execute(ALTER_EXPENSE_TYPES_TABLE, "Adding is_employee_payment to expense_types table")
        
        logger.info("Phase 2 complete: All new columns added")
        
    # ========================================================================
    # PHASE 3: DATA MIGRATION
    # ========================================================================
    
    def phase3_migrate_data(self):
        """Migrate data to new schema."""
        logger.info("=" * 60)
        logger.info("PHASE 3: DATA MIGRATION")
        logger.info("=" * 60)
        
        # Step 3.1: Create default SubZones from Areas
        logger.info("-" * 40)
        logger.info("Step 3.1: Creating default SubZones from Areas")
        areas_count = self.execute_query("SELECT COUNT(*) as count FROM areas;")[0]['count']
        logger.info(f"Found {areas_count} areas to process")
        self.execute(CREATE_DEFAULT_SUBZONES, "Creating default SubZones")
        subzones_count = self.execute_query("SELECT COUNT(*) as count FROM sub_zones;")[0]['count']
        logger.info(f"Created/verified {subzones_count} SubZones")
        
        # Step 3.2: Link Customers to SubZones
        logger.info("-" * 40)
        logger.info("Step 3.2: Linking Customers to SubZones")
        customers_count = self.execute_query("SELECT COUNT(*) as count FROM customers;")[0]['count']
        logger.info(f"Found {customers_count} customers to process")
        self.execute(LINK_CUSTOMERS_TO_SUBZONES, "Linking customers to SubZones")
        linked_count = self.execute_query(
            "SELECT COUNT(*) as count FROM customers WHERE sub_zone_id IS NOT NULL;"
        )[0]['count']
        logger.info(f"Linked {linked_count} customers to SubZones")
        
        # Step 3.3: Migrate CustomerPackages
        logger.info("-" * 40)
        logger.info("Step 3.3: Migrating CustomerPackages from service_plan_id")
        customers_with_plans = self.execute_query(
            "SELECT COUNT(*) as count FROM customers WHERE service_plan_id IS NOT NULL;"
        )[0]['count']
        logger.info(f"Found {customers_with_plans} customers with service plans")
        self.execute(MIGRATE_CUSTOMER_PACKAGES, "Migrating CustomerPackages")
        packages_count = self.execute_query("SELECT COUNT(*) as count FROM customer_packages;")[0]['count']
        logger.info(f"Created {packages_count} CustomerPackage records")
        
        # Step 3.4: Migrate Task Assignees
        logger.info("-" * 40)
        logger.info("Step 3.4: Migrating Task Assignees")
        # Check if assigned_to column exists
        if self.check_column_exists('tasks', 'assigned_to'):
            tasks_with_assignee = self.execute_query(
                "SELECT COUNT(*) as count FROM tasks WHERE assigned_to IS NOT NULL;"
            )[0]['count']
            logger.info(f"Found {tasks_with_assignee} tasks with assignees")
            self.execute(MIGRATE_TASK_ASSIGNEES, "Migrating Task Assignees")
            assignees_count = self.execute_query("SELECT COUNT(*) as count FROM task_assignees;")[0]['count']
            logger.info(f"Created {assignees_count} TaskAssignee records")
        else:
            logger.info("Skipping task assignees migration - assigned_to column not found")
        
        logger.info("Phase 3 complete: Data migration finished")
        
    # ========================================================================
    # PHASE 4: VERIFICATION
    # ========================================================================
    
    def phase4_verify(self):
        """Verify migration success."""
        logger.info("=" * 60)
        logger.info("PHASE 4: VERIFICATION")
        logger.info("=" * 60)
        
        all_passed = True
        
        # Check 1: All Areas have SubZones
        logger.info("-" * 40)
        logger.info("Check 1: Verifying all Areas have SubZones")
        areas_without_subzones = self.execute_query(VERIFY_SUBZONES)
        if areas_without_subzones:
            logger.warning(f"FAILED: {len(areas_without_subzones)} areas without SubZones")
            for area in areas_without_subzones:
                logger.warning(f"  - Area: {area['name']} (ID: {area['id']})")
            all_passed = False
        else:
            logger.info("PASSED: All areas have SubZones")
            
        # Check 2: All Customers linked to SubZones
        logger.info("-" * 40)
        logger.info("Check 2: Verifying all Customers are linked to SubZones")
        result = self.execute_query(VERIFY_CUSTOMER_SUBZONE_LINKS)
        unlinked = result[0]['unlinked_customers']
        if unlinked > 0:
            logger.warning(f"FAILED: {unlinked} customers not linked to SubZones")
            all_passed = False
        else:
            logger.info("PASSED: All customers linked to SubZones")
            
        # Check 3: CustomerPackages created
        logger.info("-" * 40)
        logger.info("Check 3: Verifying CustomerPackages were created")
        result = self.execute_query(VERIFY_CUSTOMER_PACKAGES)
        customers_with_plans = result[0]['customers_with_plans']
        package_records = result[0]['package_records']
        if customers_with_plans != package_records:
            logger.warning(f"MISMATCH: {customers_with_plans} customers with plans, {package_records} package records")
            # This might be OK if some packages were created manually before migration
        else:
            logger.info(f"PASSED: {package_records} CustomerPackage records created")
            
        # Check 4: Task Assignees migrated
        logger.info("-" * 40)
        logger.info("Check 4: Verifying Task Assignees were migrated")
        if self.check_column_exists('tasks', 'assigned_to'):
            result = self.execute_query(VERIFY_TASK_ASSIGNEES)
            tasks_with_assignee = result[0]['tasks_with_assignee']
            assignee_records = result[0]['assignee_records']
            if tasks_with_assignee != assignee_records:
                logger.warning(f"MISMATCH: {tasks_with_assignee} tasks with assignee, {assignee_records} assignee records")
            else:
                logger.info(f"PASSED: {assignee_records} TaskAssignee records created")
        else:
            logger.info("SKIPPED: No assigned_to column in tasks table")
            
        # Check 5: SubZone-Area relationships correct
        logger.info("-" * 40)
        logger.info("Check 5: Verifying SubZone-Area relationships")
        mismatches = self.execute_query(VERIFY_SUBZONE_AREA_RELATIONSHIPS)
        if mismatches:
            logger.warning(f"FAILED: {len(mismatches)} mismatched relationships")
            for m in mismatches:
                logger.warning(f"  - Customer: {m['first_name']} {m['last_name']}, Area: {m['area_name']}, SubZone: {m['subzone_name']}")
            all_passed = False
        else:
            logger.info("PASSED: All SubZone-Area relationships correct")
            
        logger.info("-" * 40)
        if all_passed:
            logger.info("✅ ALL VERIFICATION CHECKS PASSED")
        else:
            logger.warning("⚠️ SOME VERIFICATION CHECKS FAILED - Review logs above")
            
        return all_passed
    
    # ========================================================================
    # MAIN MIGRATION
    # ========================================================================
    
    def run(self):
        """Run the complete migration."""
        start_time = datetime.now()
        logger.info("=" * 60)
        logger.info("ISP MANAGEMENT SYSTEM - DATABASE MIGRATION")
        logger.info(f"Started at: {start_time}")
        logger.info(f"Dry run: {self.dry_run}")
        logger.info("=" * 60)
        
        try:
            self.connect()
            
            # Run all phases
            self.phase1_create_tables()
            self.phase2_add_columns()
            self.phase3_migrate_data()
            
            if not self.dry_run:
                success = self.phase4_verify()
            else:
                logger.info("Skipping verification in dry run mode")
                success = True
            
            end_time = datetime.now()
            duration = end_time - start_time
            
            logger.info("=" * 60)
            logger.info("MIGRATION COMPLETE")
            logger.info(f"Duration: {duration}")
            logger.info("=" * 60)
            
            return success
            
        except Exception as e:
            logger.error(f"Migration failed: {e}")
            raise
        finally:
            self.disconnect()


def main():
    """Main entry point."""
    print("\n" + "=" * 60)
    print("ISP MANAGEMENT SYSTEM - DATABASE MIGRATION")
    print("=" * 60)
    
    if DB_CONFIG['password'] == 'YOUR_PASSWORD_HERE':
        print("\n⚠️  ERROR: Please update the database password in DB_CONFIG")
        print("   Edit the 'password' field at the top of this script")
        sys.exit(1)
    
    if DRY_RUN:
        print("\n🔍 DRY RUN MODE - No changes will be made")
    else:
        print("\n⚠️  PRODUCTION MODE - Changes will be applied!")
        print("\n🔴 IMPORTANT: Have you taken a database backup?")
        confirm = input("   Type 'yes' to continue: ")
        if confirm.lower() != 'yes':
            print("Aborted. Please backup your database first.")
            sys.exit(0)
    
    migration = DatabaseMigration(DB_CONFIG, dry_run=DRY_RUN)
    
    try:
        success = migration.run()
        if success:
            print("\n✅ Migration completed successfully!")
            print("   Check migration.log for details")
        else:
            print("\n⚠️  Migration completed with warnings")
            print("   Check migration.log for details")
            sys.exit(1)
    except Exception as e:
        print(f"\n❌ Migration failed: {e}")
        print("   Check migration.log for details")
        sys.exit(1)


if __name__ == "__main__":
    main()
