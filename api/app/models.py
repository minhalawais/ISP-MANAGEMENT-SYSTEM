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
    cnic = db.Column(db.String(15), unique=True)  # Added CNIC column
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.TIMESTAMP(timezone=True), server_default=db.func.current_timestamp())
    updated_at = db.Column(db.TIMESTAMP(timezone=True), server_default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())

    def set_password(self, password):
        self.password = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password, password)
    
    inventory_assignments = relationship('InventoryAssignment', back_populates='employee')
    inventory_transactions = relationship('InventoryTransaction', back_populates='performed_by')
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

class ServicePlan(db.Model):
    __tablename__ = 'service_plans'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = db.Column(UUID(as_uuid=True), db.ForeignKey('companies.id'))
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    speed_mbps = db.Column(db.Integer)
    data_cap_gb = db.Column(db.Integer)
    price = db.Column(db.Numeric(10, 2), nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.TIMESTAMP(timezone=True), server_default=db.func.current_timestamp())
    updated_at = db.Column(db.TIMESTAMP(timezone=True), server_default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())
    is_active = db.Column(db.Boolean, default=True)

    customers = relationship('Customer', back_populates='service_plan')

class Customer(db.Model):
    __tablename__ = 'customers'
    id = db.Column(UUID(as_uuid=True), primary_key=True,default=uuid.uuid4)
    company_id = db.Column(UUID(as_uuid=True), db.ForeignKey('companies.id'), nullable=False)
    area_id = db.Column(UUID(as_uuid=True), db.ForeignKey('areas.id'), nullable=False)
    service_plan_id = db.Column(UUID(as_uuid=True), db.ForeignKey('service_plans.id'), nullable=False)
    isp_id = db.Column(UUID(as_uuid=True), db.ForeignKey('isps.id'), nullable=False)
    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    internet_id = db.Column(db.String(50), unique=True, nullable=False)
    phone_1 = db.Column(db.String(20), nullable=False)
    phone_2 = db.Column(db.String(20))
    installation_address = db.Column(db.String(200), nullable=False)
    installation_date = db.Column(db.Date, nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    cnic = db.Column(db.String(15), nullable=False)
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

    company = relationship('Company', back_populates='customers')
    area = relationship('Area', back_populates='customers')
    service_plan = relationship('ServicePlan', back_populates='customers')
    isp = relationship('ISP', back_populates='customers')



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


    company = relationship('Company', back_populates='invoices')
class Payment(db.Model):
    __tablename__ = 'payments'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = db.Column(UUID(as_uuid=True), db.ForeignKey('companies.id'))
    invoice_id = db.Column(UUID(as_uuid=True), db.ForeignKey('invoices.id'))
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    payment_date = db.Column(db.Date, nullable=False)
    payment_method = db.Column(db.String(50), nullable=False)
    transaction_id = db.Column(db.String(100))
    status = db.Column(db.String(20), nullable=False)
    failure_reason = db.Column(db.String(255))
    payment_proof = db.Column(db.String(255))
    received_by = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'))
    created_at = db.Column(db.TIMESTAMP(timezone=True), server_default=db.func.current_timestamp())
    updated_at = db.Column(db.TIMESTAMP(timezone=True), onupdate=db.func.current_timestamp())
    is_active = db.Column(db.Boolean, default=True)

    invoice = db.relationship('Invoice', backref=db.backref('payments', lazy=True))
    receiver = db.relationship('User', backref=db.backref('received_payments', lazy=True))

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
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    serial_number = db.Column(db.String(255), unique=True, nullable=False)
    status = db.Column(db.String(50), nullable=False, default='available')
    supplier_id = db.Column(UUID(as_uuid=True), db.ForeignKey('suppliers.id'), nullable=False)
    company_id = db.Column(UUID(as_uuid=True), db.ForeignKey('companies.id'), nullable=False)
    created_at = db.Column(db.TIMESTAMP(timezone=True), server_default=func.current_timestamp())
    updated_at = db.Column(db.TIMESTAMP(timezone=True), server_default=func.current_timestamp(), onupdate=func.current_timestamp())
    quantity = db.Column(db.Integer, default=1)
    is_splitter = db.Column(db.Boolean, default=False)
    splitter_number = db.Column(db.String(50))
    splitter_type = db.Column(db.String(50))
    port_count = db.Column(db.Integer)
    item_type = db.Column(db.String(50))
    unit_price = db.Column(db.Numeric(10, 2))
    is_active = db.Column(db.Boolean, default=True)

    supplier = relationship('Supplier', back_populates='inventory_items')
    assignments = relationship('InventoryAssignment', back_populates='inventory_item')
    transactions = relationship('InventoryTransaction', back_populates='inventory_item')
    company = relationship('Company', back_populates='inventory_items')

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
    employee = relationship('User', back_populates='inventory_assignments')
class InventoryTransaction(db.Model):
    __tablename__ = 'inventory_transactions'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    inventory_item_id = db.Column(UUID(as_uuid=True), db.ForeignKey('inventory_items.id'), nullable=False)
    transaction_type = db.Column(db.String(50), nullable=False)
    performed_by_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'), nullable=False)
    performed_at = db.Column(db.TIMESTAMP(timezone=True), server_default=func.current_timestamp())
    notes = db.Column(db.Text)
    created_at = db.Column(db.TIMESTAMP(timezone=True), server_default=func.current_timestamp())
    updated_at = db.Column(db.TIMESTAMP(timezone=True), server_default=func.current_timestamp(), onupdate=func.current_timestamp())
    unit_price = db.Column(db.Numeric(10, 2))
    
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
    assigned_to = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'))
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    task_type = db.Column(ENUM('installation', 'maintenance', 'troubleshooting', 'other', name='task_type'))
    priority = db.Column(ENUM('low', 'medium', 'high', 'critical', name='priority_level'), default='medium')
    due_date = db.Column(db.DateTime)
    status = db.Column(task_status, nullable=False, default='pending')
    created_at = db.Column(db.TIMESTAMP(timezone=True), server_default=db.func.current_timestamp())
    updated_at = db.Column(db.TIMESTAMP(timezone=True), server_default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())
    completed_at = db.Column(db.TIMESTAMP(timezone=True))
    notes = db.Column(db.Text)
    related_complaint_id = db.Column(UUID(as_uuid=True), db.ForeignKey('complaints.id'))
    is_active = db.Column(db.Boolean, default=True)

    complaint = db.relationship('Complaint', backref=db.backref('tasks', lazy=True))

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
    __tablename__ = 'recovery_tasks'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = db.Column(UUID(as_uuid=True), db.ForeignKey('companies.id'))
    invoice_id = db.Column(UUID(as_uuid=True), db.ForeignKey('invoices.id'))
    assigned_to = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'))
    recovery_type = db.Column(ENUM('payment', 'equipment', 'other', name='recovery_type'))
    status = db.Column(task_status, nullable=False, default='pending')
    notes = db.Column(db.Text)
    attempts_count = db.Column(db.Integer, default=0)
    last_attempt_date = db.Column(db.TIMESTAMP(timezone=True))
    recovered_amount = db.Column(db.Numeric(10, 2))
    reason = db.Column(db.Text)  # Reason if unsuccessful
    created_at = db.Column(db.TIMESTAMP(timezone=True), server_default=db.func.current_timestamp())
    updated_at = db.Column(db.TIMESTAMP(timezone=True), server_default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())
    is_active = db.Column(db.Boolean, default=True)

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
