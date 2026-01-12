from flask_sqlalchemy import SQLAlchemy
import uuid
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy.dialects.postgresql import UUID, ENUM
from app import db
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

user_role = ENUM('super_admin', 'company_owner', 'manager', 'employee', 'auditor', 'customer', 'recovery_agent', 'technician', name='user_role')
complaint_status = ENUM('open', 'in_progress', 'resolved', 'closed', name='complaint_status')
task_status = ENUM('pending', 'in_progress', 'completed', 'cancelled', name='task_status')
payment_status = ENUM('pending', 'partially_paid', 'paid', 'overdue', 'cancelled', 'refunded', name='payment_status')
payment_method = ENUM('cash', 'online', 'bank_transfer', 'credit_card', name='payment_method')
payment_type = ENUM(
    'subscription', 'installation', 'equipment', 'late_fee', 
    'upgrade', 'reconnection', 'add_on', 'refund', 'deposit',
    'maintenance', name='payment_type'
)
payment_method = ENUM('cash', 'online', 'bank_transfer', 'credit_card', name='payment_method')
isp_payment_type = ENUM('monthly_subscription', 'bandwidth_usage', 'infrastructure', 'other', name='isp_payment_type')
whatsapp_message_status = ENUM('pending', 'sent', 'failed', 'failed_permanent', name='whatsapp_message_status')
whatsapp_message_type = ENUM('invoice', 'deadline_alert', 'custom', 'promotional', name='whatsapp_message_type')
whatsapp_media_type = ENUM('text', 'image', 'document', name='whatsapp_media_type')

class Company(db.Model):
    __tablename__ = 'companies'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = db.Column(db.String(255), nullable=False)
    address = db.Column(db.Text)
    contact_number = db.Column(db.String(20))
    email = db.Column(db.String(255))
    created_at = db.Column(db.TIMESTAMP(timezone=True), server_default=db.func.current_timestamp())
    updated_at = db.Column(db.TIMESTAMP(timezone=True), server_default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())
    is_active = db.Column(db.Boolean, default=True)
    
    customers = relationship('Customer', back_populates='company')
    inventory_items = relationship('InventoryItem', back_populates='company')
    invoices = relationship('Invoice', back_populates='company')

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = db.Column(UUID(as_uuid=True), db.ForeignKey('companies.id'))
    username = db.Column(db.String(50), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False)
    role = db.Column(user_role, nullable=False)
    first_name = db.Column(db.String(50))
    last_name = db.Column(db.String(50))
    contact_number = db.Column(db.String(20))
    cnic = db.Column(db.String(15), unique=True)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.TIMESTAMP(timezone=True), server_default=db.func.current_timestamp())
    updated_at = db.Column(db.TIMESTAMP(timezone=True), server_default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())
    
    # New employee fields
    emergency_contact = db.Column(db.String(20))
    house_address = db.Column(db.Text)
    cnic_image = db.Column(db.String(500))  # Path to CNIC attachment
    picture = db.Column(db.String(500))  # Path to employee photo
    utility_bill_image = db.Column(db.String(500))  # Path to utility bill
    joining_date = db.Column(db.Date)
    salary = db.Column(db.Numeric(10, 2))
    reference_name = db.Column(db.String(100))
    reference_contact = db.Column(db.String(20))
    reference_cnic_image = db.Column(db.String(500))  # Path to reference CNIC

    # Commission & Ledger Fields
    current_balance = db.Column(db.Numeric(10, 2), default=0.00)  # Pending amount (salary + commissions)
    paid_amount = db.Column(db.Numeric(10, 2), default=0.00)  # Total amount paid to employee
    commission_amount_per_complaint = db.Column(db.Numeric(10, 2), default=0.00)
    
    def set_password(self, password):
        self.password = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password, password)
    
    inventory_assignments = relationship('InventoryAssignment', back_populates='employee')
    inventory_transactions = relationship('InventoryTransaction', back_populates='performed_by')
    ledger_entries = relationship('EmployeeLedger', back_populates='employee', lazy='dynamic')
    managed_customers = relationship('Customer', back_populates='technician', foreign_keys='Customer.technician_id')

class Area(db.Model):
    __tablename__ = 'areas'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = db.Column(UUID(as_uuid=True), db.ForeignKey('companies.id'))
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    created_at = db.Column(db.TIMESTAMP(timezone=True), server_default=db.func.current_timestamp())
    updated_at = db.Column(db.TIMESTAMP(timezone=True), server_default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())
    is_active = db.Column(db.Boolean, default=True)

    customers = relationship('Customer', back_populates='area')
    sub_zones = relationship('SubZone', back_populates='area', lazy='dynamic')

class SubZone(db.Model):
    """Sub-zones/sub-areas that belong to a parent Area"""
    __tablename__ = 'sub_zones'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = db.Column(UUID(as_uuid=True), db.ForeignKey('companies.id'))
    area_id = db.Column(UUID(as_uuid=True), db.ForeignKey('areas.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    created_at = db.Column(db.TIMESTAMP(timezone=True), server_default=db.func.current_timestamp())
    updated_at = db.Column(db.TIMESTAMP(timezone=True), server_default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())
    is_active = db.Column(db.Boolean, default=True)
    
    area = relationship('Area', back_populates='sub_zones')
    customers = relationship('Customer', back_populates='sub_zone')

class ServicePlan(db.Model):
    __tablename__ = 'service_plans'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = db.Column(UUID(as_uuid=True), db.ForeignKey('companies.id'))
    isp_id = db.Column(UUID(as_uuid=True), db.ForeignKey('isps.id'), nullable=True)  # Link to ISP
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    speed_mbps = db.Column(db.Integer)
    data_cap_gb = db.Column(db.Integer)
    price = db.Column(db.Numeric(10, 2), nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.TIMESTAMP(timezone=True), server_default=db.func.current_timestamp())
    updated_at = db.Column(db.TIMESTAMP(timezone=True), server_default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())
    
    # Relationship to ISP
    isp = relationship('ISP', backref='service_plans')


class Customer(db.Model):
    __tablename__ = 'customers'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = db.Column(UUID(as_uuid=True), db.ForeignKey('companies.id'), nullable=False)
    area_id = db.Column(UUID(as_uuid=True), db.ForeignKey('areas.id'), nullable=False)
    sub_zone_id = db.Column(UUID(as_uuid=True), db.ForeignKey('sub_zones.id'), nullable=True)  # Optional sub-zone
    isp_id = db.Column(UUID(as_uuid=True), db.ForeignKey('isps.id'), nullable=False)
    technician_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id')) # For monthly recurring commission
    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    email = db.Column(db.String(120), nullable=False)
    internet_id = db.Column(db.String(50), unique=True, nullable=False)
    phone_1 = db.Column(db.String(20), nullable=False)
    phone_2 = db.Column(db.String(20))
    installation_address = db.Column(db.String(200), nullable=False)
    installation_date = db.Column(db.Date, nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    cnic = db.Column(db.String(15), unique=True, nullable=False)
    cnic_front_image = db.Column(db.String(200))
    cnic_back_image = db.Column(db.String(200))
    created_at = db.Column(db.TIMESTAMP(timezone=True), server_default=db.func.current_timestamp())
    updated_at = db.Column(db.TIMESTAMP(timezone=True), server_default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())
    # New fields
    connection_type = db.Column(db.String(20), nullable=False)
    internet_connection_type = db.Column(db.String(20))
    wire_length = db.Column(db.Float)
    wire_ownership = db.Column(db.String(20))
    router_ownership = db.Column(db.String(20))
    router_id = db.Column(UUID(as_uuid=True), db.ForeignKey('inventory_items.id'))
    router_serial_number = db.Column(db.String(50))
    patch_cord_ownership = db.Column(db.String(20))
    patch_cord_count = db.Column(db.Integer)
    patch_cord_ethernet_ownership = db.Column(db.String(20))
    patch_cord_ethernet_count = db.Column(db.Integer)
    splicing_box_ownership = db.Column(db.String(20))
    splicing_box_serial_number = db.Column(db.String(50))
    ethernet_cable_ownership = db.Column(db.String(20))
    ethernet_cable_length = db.Column(db.Float)
    dish_ownership = db.Column(db.String(20))
    dish_id = db.Column(UUID(as_uuid=True), db.ForeignKey('inventory_items.id'))
    dish_mac_address = db.Column(db.String(50))
    tv_cable_connection_type = db.Column(db.String(20))
    node_count = db.Column(db.Integer)
    stb_serial_number = db.Column(db.String(50))
    discount_amount = db.Column(db.Float)
    recharge_date = db.Column(db.Date)
    miscellaneous_details = db.Column(db.Text)
    miscellaneous_charges = db.Column(db.Float)
    gps_coordinates = db.Column(db.String(50))
    agreement_document = db.Column(db.String(255))
    connection_commission_amount = db.Column(db.Numeric(10, 2), default=0.00)  # Commission per invoice for technician

    company = relationship('Company', back_populates='customers')
    area = relationship('Area', back_populates='customers')
    sub_zone = relationship('SubZone', back_populates='customers')
    isp = relationship('ISP', back_populates='customers')
    technician = relationship('User', back_populates='managed_customers', foreign_keys=[technician_id])
    inventory_assignments = relationship('InventoryAssignment', back_populates='customer')
    packages = relationship('CustomerPackage', back_populates='customer', lazy='dynamic')


class CustomerPackage(db.Model):
    """Junction table linking customers to multiple service plans (packages)"""
    __tablename__ = 'customer_packages'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    customer_id = db.Column(UUID(as_uuid=True), db.ForeignKey('customers.id'), nullable=False)
    service_plan_id = db.Column(UUID(as_uuid=True), db.ForeignKey('service_plans.id'), nullable=False)
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date)  # NULL = active indefinitely
    is_active = db.Column(db.Boolean, default=True)
    notes = db.Column(db.Text)
    created_at = db.Column(db.TIMESTAMP(timezone=True), server_default=db.func.current_timestamp())
    updated_at = db.Column(db.TIMESTAMP(timezone=True), server_default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())

    # Relationships
    customer = relationship('Customer', back_populates='packages')
    service_plan = relationship('ServicePlan')

class Invoice(db.Model):
    __tablename__ = 'invoices'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    invoice_number = db.Column(db.String(50), unique=True, nullable=False)
    company_id = db.Column(UUID(as_uuid=True), db.ForeignKey('companies.id'))
    customer_id = db.Column(UUID(as_uuid=True), db.ForeignKey('customers.id'))
    billing_start_date = db.Column(db.Date, nullable=False)
    billing_end_date = db.Column(db.Date, nullable=False)
    due_date = db.Column(db.Date, nullable=False)
    subtotal = db.Column(db.Numeric(10, 2), nullable=False)
    discount_percentage = db.Column(db.Numeric(5, 2), nullable=False)
    total_amount = db.Column(db.Numeric(10, 2), nullable=False)
    invoice_type = db.Column(db.String(20), nullable=False)
    notes = db.Column(db.Text)
    generated_by = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'))
    status = db.Column(db.String(20), nullable=False, default='pending')
    created_at = db.Column(db.TIMESTAMP(timezone=True), server_default=db.func.current_timestamp())
    updated_at = db.Column(db.TIMESTAMP(timezone=True), onupdate=db.func.current_timestamp())
    is_active = db.Column(db.Boolean, default=True)

    # Relationships
    company = relationship('Company', back_populates='invoices')
    customer = relationship('Customer', backref='invoices')
    generator = relationship('User', backref='generated_invoices')
    line_items = relationship('InvoiceLineItem', back_populates='invoice', lazy='dynamic')


class InvoiceLineItem(db.Model):
    """Line items for invoices - supports both packages and equipment"""
    __tablename__ = 'invoice_line_items'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    invoice_id = db.Column(UUID(as_uuid=True), db.ForeignKey('invoices.id'), nullable=False)
    customer_package_id = db.Column(UUID(as_uuid=True), db.ForeignKey('customer_packages.id'))
    inventory_item_id = db.Column(UUID(as_uuid=True), db.ForeignKey('inventory_items.id'))  # For equipment
    item_type = db.Column(db.String(20), default='package')  # 'package' or 'equipment'
    description = db.Column(db.String(255), nullable=False)
    quantity = db.Column(db.Integer, default=1)
    unit_price = db.Column(db.Numeric(10, 2), nullable=False)
    discount_amount = db.Column(db.Numeric(10, 2), default=0)
    line_total = db.Column(db.Numeric(10, 2), nullable=False)
    created_at = db.Column(db.TIMESTAMP(timezone=True), server_default=db.func.current_timestamp())
    updated_at = db.Column(db.TIMESTAMP(timezone=True), server_default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())

    # Relationships
    invoice = relationship('Invoice', back_populates='line_items')
    customer_package = relationship('CustomerPackage')
    inventory_item = relationship('InventoryItem')
class Payment(db.Model):
    __tablename__ = 'payments'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = db.Column(UUID(as_uuid=True), db.ForeignKey('companies.id'))
    invoice_id = db.Column(UUID(as_uuid=True), db.ForeignKey('invoices.id'))
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    payment_date = db.Column(db.DateTime(timezone=True), nullable=False)
    payment_method = db.Column(db.String(50), nullable=False)
    transaction_id = db.Column(db.String(100))
    status = db.Column(db.String(20), nullable=False)
    failure_reason = db.Column(db.String(255))
    payment_proof = db.Column(db.String(255))
    received_by = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'))
    created_at = db.Column(db.TIMESTAMP(timezone=True), server_default=db.func.current_timestamp())
    updated_at = db.Column(db.TIMESTAMP(timezone=True), onupdate=db.func.current_timestamp())
    is_active = db.Column(db.Boolean, default=True)
    # Add this field to the Payment model
    bank_account_id = db.Column(UUID(as_uuid=True), db.ForeignKey('bank_accounts.id'))

    # Add relationship
    bank_account = db.relationship('BankAccount', backref=db.backref('payments', lazy=True))
    invoice = db.relationship('Invoice', backref=db.backref('payments', lazy=True))
    receiver = db.relationship('User', backref=db.backref('received_payments', lazy=True))
    
class ISPPayment(db.Model):
    __tablename__ = 'isp_payments'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = db.Column(UUID(as_uuid=True), db.ForeignKey('companies.id'), nullable=False)
    isp_id = db.Column(UUID(as_uuid=True), db.ForeignKey('isps.id'), nullable=False)
    bank_account_id = db.Column(UUID(as_uuid=True), db.ForeignKey('bank_accounts.id'), nullable=True)  # Changed to nullable=True
    
    # Flexible payment tracking
    payment_type = db.Column(isp_payment_type, nullable=False)
    reference_number = db.Column(db.String(100))
    description = db.Column(db.Text, nullable=False)
    
    # Financial details
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    payment_date = db.Column(db.DateTime(timezone=True), nullable=False)
    billing_period = db.Column(db.String(50), nullable=False)
    
    # For usage-based payments
    bandwidth_usage_gb = db.Column(db.Float)
    rate_per_gb = db.Column(db.Numeric(10, 4))
    
    # Payment method and tracking
    payment_method = db.Column(payment_method, nullable=False)
    transaction_id = db.Column(db.String(100))
    status = db.Column(db.String(20), default='completed')
    payment_proof = db.Column(db.String(255))
    processed_by = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'), nullable=False)
    
    # Timestamps
    created_at = db.Column(db.TIMESTAMP(timezone=True), server_default=db.func.current_timestamp())
    updated_at = db.Column(db.TIMESTAMP(timezone=True), server_default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())
    is_active = db.Column(db.Boolean, default=True)

    # Relationships
    company = relationship('Company', backref=db.backref('isp_payments', lazy=True))
    isp = relationship('ISP', backref=db.backref('payments', lazy=True))
    bank_account = relationship('BankAccount', backref=db.backref('isp_payments', lazy=True))
    processor = relationship('User', backref=db.backref('processed_isp_payments', lazy=True))
    
class BankAccount(db.Model):
    __tablename__ = 'bank_accounts'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = db.Column(UUID(as_uuid=True), db.ForeignKey('companies.id'))
    bank_name = db.Column(db.String(100), nullable=False)
    account_title = db.Column(db.String(100), nullable=False)
    account_number = db.Column(db.String(50), nullable=False)
    iban = db.Column(db.String(34))
    branch_code = db.Column(db.String(20))
    branch_address = db.Column(db.Text)
    initial_balance = db.Column(db.Numeric(15, 2), default=0.00)
    current_balance = db.Column(db.Numeric(15, 2), default=0.00)  # Dynamic balance
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.TIMESTAMP(timezone=True), server_default=db.func.current_timestamp())
    updated_at = db.Column(db.TIMESTAMP(timezone=True), server_default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())
    
    company = relationship('Company', backref=db.backref('bank_accounts', lazy=True))

class InternalTransfer(db.Model):
    __tablename__ = 'internal_transfers'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = db.Column(UUID(as_uuid=True), db.ForeignKey('companies.id'), nullable=False)
    from_account_id = db.Column(UUID(as_uuid=True), db.ForeignKey('bank_accounts.id'), nullable=False)
    to_account_id = db.Column(UUID(as_uuid=True), db.ForeignKey('bank_accounts.id'), nullable=False)
    amount = db.Column(db.Numeric(15, 2), nullable=False)
    transfer_date = db.Column(db.TIMESTAMP(timezone=True), nullable=False)
    description = db.Column(db.Text)
    reference_number = db.Column(db.String(100))
    status = db.Column(db.String(20), default='completed')  # completed, reversed
    created_at = db.Column(db.TIMESTAMP(timezone=True), server_default=db.func.current_timestamp())
    updated_at = db.Column(db.TIMESTAMP(timezone=True), server_default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())

    # Relationships
    company = relationship('Company', backref=db.backref('internal_transfers', lazy=True))
    from_account = relationship('BankAccount', foreign_keys=[from_account_id], backref=db.backref('transfers_out', lazy=True))
    to_account = relationship('BankAccount', foreign_keys=[to_account_id], backref=db.backref('transfers_in', lazy=True))
class Complaint(db.Model):
    __tablename__ = 'complaints'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    customer_id = db.Column(UUID(as_uuid=True), db.ForeignKey('customers.id'))
    assigned_to = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'))
    description = db.Column(db.Text)
    status = db.Column(complaint_status, nullable=False, default='open')
    created_at = db.Column(db.TIMESTAMP(timezone=True), server_default=db.func.current_timestamp())
    updated_at = db.Column(db.TIMESTAMP(timezone=True), server_default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())
    resolved_at = db.Column(db.TIMESTAMP(timezone=True))
    response_due_date = db.Column(db.DateTime)
    satisfaction_rating = db.Column(db.Integer)
    resolution_attempts = db.Column(db.Integer, default=0)
    attachment_path = db.Column(db.String(255))
    feedback_comments = db.Column(db.Text)
    is_active = db.Column(db.Boolean, default=True)
    resolution_proof = db.Column(db.String(255))
    ticket_number = db.Column(db.String(50), unique=True, nullable=False)
    remarks = db.Column(db.Text) #Added remarks field

    customer = db.relationship('Customer', backref=db.backref('complaints', lazy=True))
    assigned_user = db.relationship('User', backref=db.backref('assigned_complaints', lazy=True))

    def __repr__(self):
        return f'<Complaint {self.id}>'



class InventoryItem(db.Model):
    __tablename__ = 'inventory_items'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = db.Column(UUID(as_uuid=True), db.ForeignKey('companies.id'), nullable=False)
    created_at = db.Column(db.TIMESTAMP(timezone=True), server_default=func.current_timestamp())
    updated_at = db.Column(db.TIMESTAMP(timezone=True), server_default=func.current_timestamp(), onupdate=func.current_timestamp())
    quantity = db.Column(db.Integer, default=1)
    vendor = db.Column(UUID(as_uuid=True), db.ForeignKey('suppliers.id'), nullable=False)  # Renamed from supplier_id
    unit_price = db.Column(db.Numeric(10, 2))
    item_type = db.Column(db.String(50), nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    
    # Type-specific fields stored in JSON
    attributes = db.Column(db.JSON)
    
    # Relationships
    company = relationship('Company', back_populates='inventory_items')
    supplier = relationship('Supplier', back_populates='inventory_items', foreign_keys=[vendor])  # Updated foreign key
    assignments = relationship('InventoryAssignment', back_populates='inventory_item')
    transactions = relationship('InventoryTransaction', back_populates='inventory_item')

class InventoryAssignment(db.Model):
    __tablename__ = 'inventory_assignments'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    inventory_item_id = db.Column(UUID(as_uuid=True), db.ForeignKey('inventory_items.id'), nullable=False)
    assigned_to_customer_id = db.Column(UUID(as_uuid=True), db.ForeignKey('customers.id'), nullable=True)
    assigned_to_employee_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'), nullable=True)
    assigned_at = db.Column(db.TIMESTAMP(timezone=True), server_default=func.current_timestamp())
    returned_at = db.Column(db.TIMESTAMP(timezone=True), nullable=True)
    status = db.Column(db.String(50), nullable=False, default='assigned')
    created_at = db.Column(db.TIMESTAMP(timezone=True), server_default=func.current_timestamp())
    updated_at = db.Column(db.TIMESTAMP(timezone=True), server_default=func.current_timestamp(), onupdate=func.current_timestamp())
    
    inventory_item = relationship('InventoryItem', back_populates='assignments')
    customer = relationship('Customer', back_populates='inventory_assignments')
    employee = relationship('User', back_populates='inventory_assignments')



class InventoryTransaction(db.Model):
    __tablename__ = 'inventory_transactions'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    inventory_item_id = db.Column(UUID(as_uuid=True), db.ForeignKey('inventory_items.id'), nullable=False)
    transaction_type = db.Column(db.String(50), nullable=False)
    performed_by_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'), nullable=False)
    performed_at = db.Column(db.TIMESTAMP(timezone=True), server_default=func.current_timestamp())
    notes = db.Column(db.Text)
    quantity = db.Column(db.Integer, nullable=False)
    created_at = db.Column(db.TIMESTAMP(timezone=True), server_default=func.current_timestamp())
    updated_at = db.Column(db.TIMESTAMP(timezone=True), server_default=func.current_timestamp(), onupdate=func.current_timestamp())
    
    inventory_item = relationship('InventoryItem', back_populates='transactions')
    performed_by = relationship('User', back_populates='inventory_transactions')


class Supplier(db.Model):
    __tablename__ = 'suppliers'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = db.Column(UUID(as_uuid=True), db.ForeignKey('companies.id'))
    name = db.Column(db.String(255), nullable=False)
    contact_person = db.Column(db.String(100))
    email = db.Column(db.String(255))
    phone = db.Column(db.String(20))
    address = db.Column(db.Text)
    created_at = db.Column(db.TIMESTAMP(timezone=True), server_default=db.func.current_timestamp())
    updated_at = db.Column(db.TIMESTAMP(timezone=True), server_default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())
    is_active = db.Column(db.Boolean, default=True)
    inventory_items = relationship('InventoryItem', back_populates='supplier')

class Vendor(db.Model):
    """Vendors who receive internet services from the company"""
    __tablename__ = 'vendors'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = db.Column(UUID(as_uuid=True), db.ForeignKey('companies.id'), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    phone = db.Column(db.String(20), nullable=False)
    email = db.Column(db.String(255))
    cnic = db.Column(db.String(15), unique=True, nullable=False)
    picture = db.Column(db.String(500))  # Path to vendor photo
    cnic_front_image = db.Column(db.String(500))  # Path to front CNIC image
    cnic_back_image = db.Column(db.String(500))  # Path to back CNIC image
    agreement_document = db.Column(db.String(500))  # Path to agreement document
    created_at = db.Column(db.TIMESTAMP(timezone=True), server_default=db.func.current_timestamp())
    updated_at = db.Column(db.TIMESTAMP(timezone=True), server_default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())
    is_active = db.Column(db.Boolean, default=True)
    
    company = relationship('Company', backref=db.backref('vendors', lazy=True))

class Contract(db.Model):
    __tablename__ = 'contracts'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = db.Column(UUID(as_uuid=True), db.ForeignKey('companies.id'))
    customer_id = db.Column(UUID(as_uuid=True), db.ForeignKey('customers.id'))
    supplier_id = db.Column(UUID(as_uuid=True), db.ForeignKey('suppliers.id'))
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date)
    created_at = db.Column(db.TIMESTAMP(timezone=True), server_default=db.func.current_timestamp())
    updated_at = db.Column(db.TIMESTAMP(timezone=True), server_default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())
    is_active = db.Column(db.Boolean, default=True)

class Task(db.Model):
    __tablename__ = 'tasks'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = db.Column(UUID(as_uuid=True), db.ForeignKey('companies.id'))
    customer_id = db.Column(UUID(as_uuid=True), db.ForeignKey('customers.id'), nullable=True)  # Optional customer reference
    task_type = db.Column(db.String(50), nullable=False)  # installation, maintenance, complaint, recovery
    priority = db.Column(db.String(20), default='medium')  # low, medium, high, critical
    due_date = db.Column(db.DateTime(timezone=True))  # Date and time
    status = db.Column(db.String(20), nullable=False, default='pending')  # pending, in_progress, completed, cancelled
    notes = db.Column(db.Text)
    completion_notes = db.Column(db.Text)  # Notes added when task is completed
    completion_proof = db.Column(db.String(500))  # Path to completion proof image
    created_at = db.Column(db.TIMESTAMP(timezone=True), server_default=db.func.current_timestamp())
    updated_at = db.Column(db.TIMESTAMP(timezone=True), server_default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())
    completed_at = db.Column(db.TIMESTAMP(timezone=True))
    is_active = db.Column(db.Boolean, default=True)

    customer = db.relationship('Customer', backref=db.backref('tasks', lazy=True))
    assignees = db.relationship('TaskAssignee', back_populates='task', cascade='all, delete-orphan')

class TaskAssignee(db.Model):
    """Junction table for Task-Employee many-to-many relationship"""
    __tablename__ = 'task_assignees'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    task_id = db.Column(UUID(as_uuid=True), db.ForeignKey('tasks.id', ondelete='CASCADE'), nullable=False)
    employee_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'), nullable=False)
    assigned_at = db.Column(db.TIMESTAMP(timezone=True), server_default=db.func.current_timestamp())
    
    task = db.relationship('Task', back_populates='assignees')
    employee = db.relationship('User', backref=db.backref('task_assignments', lazy=True))

class Message(db.Model):
    __tablename__ = 'messages'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = db.Column(UUID(as_uuid=True), db.ForeignKey('companies.id'))
    sender_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'))
    recipient_id = db.Column(UUID(as_uuid=True))  # This can be either a user_id or customer_id
    subject = db.Column(db.String(255))
    content = db.Column(db.Text)
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.TIMESTAMP(timezone=True), server_default=db.func.current_timestamp())
    updated_at = db.Column(db.TIMESTAMP(timezone=True), server_default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())
    is_active = db.Column(db.Boolean, default=True)

    sender = db.relationship('User', foreign_keys=[sender_id])


class AuditLog(db.Model):
    __tablename__ = 'audit_logs'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'))
    action = db.Column(db.String(255), nullable=False)
    table_name = db.Column(db.String(50), nullable=False)
    record_id = db.Column(UUID(as_uuid=True), nullable=False)
    old_values = db.Column(db.JSON)
    new_values = db.Column(db.JSON)
    created_at = db.Column(db.TIMESTAMP(timezone=True), server_default=db.func.current_timestamp())

class RecoveryTask(db.Model):
    """Simplified Recovery Task - assigns an invoice to employee for recovery"""
    __tablename__ = 'recovery_tasks'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = db.Column(UUID(as_uuid=True), db.ForeignKey('companies.id'))
    invoice_id = db.Column(UUID(as_uuid=True), db.ForeignKey('invoices.id'), nullable=False)
    assigned_to = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'), nullable=False)
    status = db.Column(db.String(20), nullable=False, default='pending')  # pending, in_progress, completed, cancelled
    notes = db.Column(db.Text)
    completion_notes = db.Column(db.Text)  # Notes added when recovery is completed
    completion_proof = db.Column(db.String(500))  # Path to completion proof image
    completed_at = db.Column(db.TIMESTAMP(timezone=True))  # When recovery was completed
    created_at = db.Column(db.TIMESTAMP(timezone=True), server_default=db.func.current_timestamp())
    updated_at = db.Column(db.TIMESTAMP(timezone=True), server_default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())

    invoice = db.relationship('Invoice', backref=db.backref('recovery_tasks', lazy=True))



class DetailedLog(db.Model):
    __tablename__ = 'detailed_logs'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'))
    company_id = db.Column(UUID(as_uuid=True), db.ForeignKey('companies.id'))
    action = db.Column(db.String(255), nullable=False)
    table_name = db.Column(db.String(50), nullable=False)
    record_id = db.Column(UUID(as_uuid=True), nullable=False)
    old_values = db.Column(db.JSON)
    new_values = db.Column(db.JSON)
    ip_address = db.Column(db.String(45))
    user_agent = db.Column(db.String(255))
    created_at = db.Column(db.TIMESTAMP(timezone=True), server_default=db.func.current_timestamp())

    user = relationship('User', backref=db.backref('detailed_logs', lazy=True))
    companies = relationship('Company', backref=db.backref('detailed_logs', lazy=True))


class ISP(db.Model):
    __tablename__ = 'isps'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = db.Column(UUID(as_uuid=True), db.ForeignKey('companies.id'))
    name = db.Column(db.String(255), nullable=False)
    contact_person = db.Column(db.String(100))
    email = db.Column(db.String(255))
    phone = db.Column(db.String(20))
    address = db.Column(db.Text)
    created_at = db.Column(db.TIMESTAMP(timezone=True), server_default=db.func.current_timestamp())
    updated_at = db.Column(db.TIMESTAMP(timezone=True), server_default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())
    is_active = db.Column(db.Boolean, default=True)

    customers = relationship('Customer', back_populates='isp')
# Add this to your models.py file

class ExpenseType(db.Model):
    __tablename__ = 'expense_types'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = db.Column(UUID(as_uuid=True), db.ForeignKey('companies.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    is_employee_payment = db.Column(db.Boolean, default=False)  # True for employee payment types
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.TIMESTAMP(timezone=True), server_default=db.func.current_timestamp())
    updated_at = db.Column(db.TIMESTAMP(timezone=True), server_default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())

    company = relationship('Company', backref=db.backref('expense_types', lazy=True))

# Update the Expense model to use dynamic expense types
class Expense(db.Model):
    __tablename__ = 'expenses'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = db.Column(UUID(as_uuid=True), db.ForeignKey('companies.id'))
    bank_account_id = db.Column(UUID(as_uuid=True), db.ForeignKey('bank_accounts.id'), nullable=True)
    expense_type_id = db.Column(UUID(as_uuid=True), db.ForeignKey('expense_types.id'), nullable=False)  # Changed from expense_type enum
    employee_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'), nullable=True)  # For employee payments
    description = db.Column(db.Text)
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    expense_date = db.Column(db.DateTime(timezone=True), nullable=False)
    payment_method = db.Column(db.String(20))
    vendor_payee = db.Column(db.String(255))
    created_at = db.Column(db.TIMESTAMP(timezone=True), server_default=db.func.current_timestamp())
    updated_at = db.Column(db.TIMESTAMP(timezone=True), server_default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())
    is_active = db.Column(db.Boolean, default=True)
    payment_proof = db.Column(db.String(500))  # Path to payment proof attachment

    company = relationship('Company', backref=db.backref('expenses', lazy=True))
    bank_account = relationship('BankAccount', backref=db.backref('expenses', lazy=True))
    expense_type = relationship('ExpenseType', backref=db.backref('expenses', lazy=True))
    employee = relationship('User', backref=db.backref('expense_payments', lazy=True))

class ExtraIncomeType(db.Model):
    __tablename__ = 'extra_income_types'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = db.Column(UUID(as_uuid=True), db.ForeignKey('companies.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.TIMESTAMP(timezone=True), server_default=db.func.current_timestamp())
    updated_at = db.Column(db.TIMESTAMP(timezone=True), server_default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())

    company = relationship('Company', backref=db.backref('extra_income_types', lazy=True))

class ExtraIncome(db.Model):
    __tablename__ = 'extra_incomes'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = db.Column(UUID(as_uuid=True), db.ForeignKey('companies.id'))
    bank_account_id = db.Column(UUID(as_uuid=True), db.ForeignKey('bank_accounts.id'), nullable=True)
    income_type_id = db.Column(UUID(as_uuid=True), db.ForeignKey('extra_income_types.id'), nullable=False)
    description = db.Column(db.Text)
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    income_date = db.Column(db.DateTime(timezone=True), nullable=False)
    payment_method = db.Column(db.String(20))
    payer = db.Column(db.String(255))
    created_at = db.Column(db.TIMESTAMP(timezone=True), server_default=db.func.current_timestamp())
    updated_at = db.Column(db.TIMESTAMP(timezone=True), server_default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())
    is_active = db.Column(db.Boolean, default=True)
    payment_proof = db.Column(db.String(500))  # Path to payment proof attachment

    company = relationship('Company', backref=db.backref('extra_incomes', lazy=True))
    bank_account = relationship('BankAccount', backref=db.backref('extra_incomes', lazy=True))
    income_type = relationship('ExtraIncomeType', backref=db.backref('extra_incomes', lazy=True))

    
class WhatsAppMessageQueue(db.Model):
    """
    Stores all WhatsApp messages to be sent or already sent.
    Manages queue with priority ordering and retry logic.
    """
    __tablename__ = 'whatsapp_message_queue'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = db.Column(UUID(as_uuid=True), db.ForeignKey('companies.id'), nullable=False)
    customer_id = db.Column(UUID(as_uuid=True), db.ForeignKey('customers.id'), nullable=False)
    
    # Message details
    mobile = db.Column(db.String(20), nullable=False)  # International format e.g., 923001234567
    message_type = db.Column(whatsapp_message_type, nullable=False, default='custom')
    message_content = db.Column(db.Text, nullable=False)
    
    # Media details (for images/documents)
    media_type = db.Column(whatsapp_media_type, nullable=False, default='text')
    media_url = db.Column(db.String(500))  # URL or file path
    media_caption = db.Column(db.Text)
    
    # Queue management
    priority = db.Column(db.Integer, nullable=False, default=10)  # 0=High, 10=Medium, 20=Low
    status = db.Column(whatsapp_message_status, nullable=False, default='pending')
    
    # Scheduling
    scheduled_date = db.Column(db.DateTime(timezone=True))
    sent_at = db.Column(db.DateTime(timezone=True))
    
    # Error handling
    retry_count = db.Column(db.Integer, default=0)
    max_retry = db.Column(db.Integer, default=3)
    error_message = db.Column(db.Text)
    
    # API response tracking
    api_response = db.Column(db.JSON)
    api_message_id = db.Column(db.String(100))  # WhatsApp API's message ID
    
    # Related records
    related_invoice_id = db.Column(UUID(as_uuid=True), db.ForeignKey('invoices.id'))
    
    # Timestamps
    created_at = db.Column(db.TIMESTAMP(timezone=True), server_default=func.current_timestamp())
    updated_at = db.Column(db.TIMESTAMP(timezone=True), server_default=func.current_timestamp(), onupdate=func.current_timestamp())
    is_active = db.Column(db.Boolean, default=True)
    
    # Relationships
    company = relationship('Company', backref=db.backref('whatsapp_messages', lazy=True))
    customer = relationship('Customer', backref=db.backref('whatsapp_messages', lazy=True))
    invoice = relationship('Invoice', backref=db.backref('whatsapp_messages', lazy=True))
    
    # Indexes for performance
    __table_args__ = (
        db.Index('idx_whatsapp_queue_status_priority', 'status', 'priority'),
        db.Index('idx_whatsapp_queue_customer', 'customer_id'),
        db.Index('idx_whatsapp_queue_created', 'created_at'),
        db.Index('idx_whatsapp_queue_scheduled', 'scheduled_date'),
    )
    
    def __repr__(self):
        return f'<WhatsAppMessage {self.id} - {self.customer_id} - {self.status}>'


class WhatsAppDailyQuota(db.Model):
    """
    Tracks daily message sending quota to enforce 200 messages/day limit.
    Automatically resets at midnight.
    """
    __tablename__ = 'whatsapp_daily_quota'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = db.Column(UUID(as_uuid=True), db.ForeignKey('companies.id'), nullable=False)
    
    # Quota tracking
    date = db.Column(db.Date, nullable=False, unique=True)  # Date for this quota
    messages_sent = db.Column(db.Integer, default=0)
    quota_limit = db.Column(db.Integer, default=200)  # Configurable limit
    
    # Timestamps
    last_reset_at = db.Column(db.TIMESTAMP(timezone=True), server_default=func.current_timestamp())
    created_at = db.Column(db.TIMESTAMP(timezone=True), server_default=func.current_timestamp())
    updated_at = db.Column(db.TIMESTAMP(timezone=True), server_default=func.current_timestamp(), onupdate=func.current_timestamp())
    
    # Relationship
    company = relationship('Company', backref=db.backref('whatsapp_quotas', lazy=True))
    
    __table_args__ = (
        db.Index('idx_whatsapp_quota_date', 'date'),
    )
    
    def __repr__(self):
        return f'<WhatsAppQuota {self.date} - {self.messages_sent}/{self.quota_limit}>'


class WhatsAppTemplate(db.Model):
    """
    Stores reusable message templates with placeholder support.
    Placeholders: {{customer_name}}, {{invoice_number}}, {{amount}}, {{due_date}}, etc.
    """
    __tablename__ = 'whatsapp_templates'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = db.Column(UUID(as_uuid=True), db.ForeignKey('companies.id'), nullable=False)
    
    # Template details
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    template_text = db.Column(db.Text, nullable=False)
    
    # Categorization
    category = db.Column(db.String(50))  # e.g., 'invoice', 'alert', 'promotional', 'custom'
    message_type = db.Column(whatsapp_message_type, default='custom')
    
    # Settings
    is_active = db.Column(db.Boolean, default=True)
    default_priority = db.Column(db.Integer, default=10)
    
    # Timestamps
    created_at = db.Column(db.TIMESTAMP(timezone=True), server_default=func.current_timestamp())
    updated_at = db.Column(db.TIMESTAMP(timezone=True), server_default=func.current_timestamp(), onupdate=func.current_timestamp())
    created_by = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'))
    
    # Relationships
    company = relationship('Company', backref=db.backref('whatsapp_templates', lazy=True))
    creator = relationship('User', backref=db.backref('created_templates', lazy=True))
    
    def __repr__(self):
        return f'<WhatsAppTemplate {self.name}>'


class WhatsAppConfig(db.Model):
    """
    Stores WhatsApp API configuration and settings.
    One record per company.
    """
    __tablename__ = 'whatsapp_config'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = db.Column(UUID(as_uuid=True), db.ForeignKey('companies.id'), nullable=False, unique=True)
    
    # API Configuration
    api_key = db.Column(db.String(255), nullable=False)
    server_address = db.Column(db.String(255), nullable=False)
    instance_id = db.Column(db.String(100))  # Optional instance ID
    
    # Feature toggles
    auto_send_invoices = db.Column(db.Boolean, default=True)
    auto_send_deadline_alerts = db.Column(db.Boolean, default=True)
    
    # Scheduler settings (stored as time in HH:MM format)
    message_send_time = db.Column(db.String(5), default='09:00')  # Time to send queued messages
    deadline_check_time = db.Column(db.String(5), default='09:00')  # Time to check deadline alerts
    
    # Alert settings
    deadline_alert_days_before = db.Column(db.Integer, default=2)  # Alert X days before due date
    
    # Quota settings
    daily_quota_limit = db.Column(db.Integer, default=200)
    quota_buffer = db.Column(db.Integer, default=5)  # Safety buffer (send max 195)
    
    # Default message settings
    default_invoice_priority = db.Column(db.Integer, default=10)
    default_alert_priority = db.Column(db.Integer, default=0)
    default_custom_priority = db.Column(db.Integer, default=20)
    
    # Connection status
    last_connection_test = db.Column(db.TIMESTAMP(timezone=True))
    connection_status = db.Column(db.String(20), default='untested')  # untested, success, failed
    
    # Timestamps
    created_at = db.Column(db.TIMESTAMP(timezone=True), server_default=func.current_timestamp())
    updated_at = db.Column(db.TIMESTAMP(timezone=True), server_default=func.current_timestamp(), onupdate=func.current_timestamp())
    
    # Relationship
    company = relationship('Company', backref=db.backref('whatsapp_config', uselist=False, lazy=True))
    
    def __repr__(self):
        return f'<WhatsAppConfig {self.company_id}>'

class EmployeeLedger(db.Model):
    """
    Tracks all financial transactions for an employee (commissions, salary, payouts).
    Acts as a ledger to calculate current_balance.
    """
    __tablename__ = 'employee_ledger'

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = db.Column(UUID(as_uuid=True), db.ForeignKey('companies.id'), nullable=False)
    employee_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'), nullable=False)
    
    # Transaction details
    transaction_type = db.Column(db.String(50), nullable=False) 
    # e.g., 'connection_commission', 'complaint_commission', 'salary_accrual', 'payout', 'adjustment'
    
    amount = db.Column(db.Numeric(10, 2), nullable=False) 
    # Positive for earnings, Negative for payouts/deductions
    
    description = db.Column(db.Text)
    reference_id = db.Column(UUID(as_uuid=True), nullable=True) 
    # ID of related entity (Invoice, Complaint, Payment etc.)
    
    created_at = db.Column(db.TIMESTAMP(timezone=True), server_default=func.current_timestamp())
    
    # Relationships
    company = relationship('Company')
    employee = relationship('User', back_populates='ledger_entries')
