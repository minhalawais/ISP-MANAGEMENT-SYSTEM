from app import db
import logging
from app.models import Supplier, Task, User, Payment, Invoice, EmployeeRole, EmployeeRoleAssignment, Module
from app.models import RoleModulePermission, Customer, Area, ServicePlan, Complaint, InventoryItem, RecoveryTask,Message,InventoryMovement
import uuid
from werkzeug.utils import secure_filename
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from sqlalchemy.orm import joinedload
from datetime import datetime,timedelta
import os
from pytz import UTC
from sqlalchemy import func,case
from decimal import Decimal

# Configure logging
logging.basicConfig(level=logging.ERROR)
logger = logging.getLogger(__name__)

class DatabaseError(Exception):
    """Custom exception for database operations"""
    pass
class InvoiceError(Exception):
    """Custom exception for invoice operations"""
    pass

class PaymentError(Exception):
    """Custom exception for payment operations"""
    pass
def handle_db_error(func):
    """Decorator to handle database errors"""
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except SQLAlchemyError as e:
            logger.error(f"Database error in {func.__name__}: {str(e)}")
            db.session.rollback()
            raise DatabaseError(f"Database operation failed: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error in {func.__name__}: {str(e)}")
            db.session.rollback()
            raise
    return wrapper

@handle_db_error
def get_all_employees(company_id):
    try:
        employees = User.query.filter_by(company_id=company_id).all()
        result = []
        for emp in employees:
            try:
                role_assignment = EmployeeRoleAssignment.query.filter_by(user_id=emp.id).first()
                role_id = role_assignment.role_id if role_assignment else None
                role = EmployeeRole.query.get(role_id)
                role_name = role.name if role else 'Unassigned'
                result.append({
                    'id': str(emp.id),
                    'username': emp.username,
                    'email': emp.email,
                    'first_name': emp.first_name,
                    'last_name': emp.last_name,
                    'role': role_name,
                    'is_active': emp.is_active,
                    'full_name': f"{emp.first_name} {emp.last_name}"
                })
            except AttributeError as e:
                logger.error(f"Error processing employee {emp.id}: {str(e)}")
                continue
        return result
    except Exception as e:
        logger.error(f"Error getting employees: {str(e)}")
        raise

@handle_db_error
def add_employee(data):
    try:
        # Validate required fields
        required_fields = ['company_id', 'username', 'email', 'first_name', 'last_name', 'password']
        for field in required_fields:
            if field not in data:
                raise ValueError(f"Missing required field: {field}")

        new_employee = User(
            company_id=uuid.UUID(data['company_id']),
            username=data['username'],
            email=data['email'],
            first_name=data['first_name'],
            last_name=data['last_name'],
            role='employee',
            is_active=True
        )
        new_employee.set_password(data['password'])
        db.session.add(new_employee)
        
        # Handle role assignment
        if 'role' in data:
            role = EmployeeRole.query.filter_by(name=data['role']).first()
            if role:
                role_assignment = EmployeeRoleAssignment(
                    user_id=new_employee.id,
                    role_id=role.id
                )
                db.session.add(role_assignment)

        # Handle module permissions
        if 'modules' in data:
            for module_name in data['modules']:
                module = Module.query.filter_by(name=module_name).first()
                if module:
                    permission = RoleModulePermission(
                        role_id=new_employee.id,
                        module_id=module.id,
                        can_view=True
                    )
                    db.session.add(permission)

        db.session.commit()
        return new_employee
    except IntegrityError as e:
        logger.error(f"Integrity error adding employee: {str(e)}")
        db.session.rollback()
        raise DatabaseError("Employee with this username or email already exists")
    except Exception as e:
        logger.error(f"Error adding employee: {str(e)}")
        db.session.rollback()
        raise

@handle_db_error
def update_employee(id, data, company_id):
    try:
        employee = User.query.filter_by(id=id, company_id=company_id).first()
        if not employee:
            raise ValueError(f"Employee with id {id} not found")

        if 'username' in data:
            employee.username = data['username']
        if 'email' in data:
            employee.email = data['email']
        if 'first_name' in data:
            employee.first_name = data['first_name']
        if 'last_name' in data:
            employee.last_name = data['last_name']
        if 'password' in data and data['password']:
            employee.set_password(data['password'])
        if 'is_active' in data:
            employee.is_active = data['is_active']
        # Update role
        if 'role' in data:
            role = EmployeeRole.query.filter_by(name=data['role']).first()
            if role:
                EmployeeRoleAssignment.query.filter_by(user_id=employee.id).delete()
                role_assignment = EmployeeRoleAssignment(
                    user_id=employee.id,
                    role_id=role.id
                )
                db.session.add(role_assignment)

        # Update module permissions
        if 'modules' in data:
            RoleModulePermission.query.filter_by(role_id=employee.id).delete()
            for module_name in data['modules']:
                module = Module.query.filter_by(name=module_name).first()
                if module:
                    permission = RoleModulePermission(
                        role_id=employee.id,
                        module_id=module.id,
                        can_view=True
                    )
                    db.session.add(permission)

        db.session.commit()
        return employee
    except Exception as e:
        logger.error(f"Error updating employee {id}: {str(e)}")
        db.session.rollback()
        raise

@handle_db_error
def delete_employee(id, company_id):
    try:
        employee = User.query.filter_by(id=id, company_id=company_id).first()
        if not employee:
            raise ValueError(f"Employee with id {id} not found")
            
        # Delete related records
        EmployeeRoleAssignment.query.filter_by(user_id=id).delete()
        RoleModulePermission.query.filter_by(role_id=id).delete()
        
        db.session.delete(employee)
        db.session.commit()
        return True
    except Exception as e:
        logger.error(f"Error deleting employee {id}: {str(e)}")
        db.session.rollback()
        raise

@handle_db_error
def toggle_employee_status(id, company_id):
    try:
        employee = User.query.filter_by(id=id, company_id=company_id).first()
        if not employee:
            raise ValueError(f"Employee with id {id} not found")
            
        employee.is_active = not employee.is_active
        db.session.commit()
        return employee
    except Exception as e:
        logger.error(f"Error toggling employee status {id}: {str(e)}")
        db.session.rollback()
        raise

def get_all_roles():
    roles = EmployeeRole.query.all()
    return [role.name for role in roles]

def get_all_modules():
    modules = Module.query.all()
    return [module.name for module in modules]

def get_all_customers(company_id):
    customers = Customer.query.filter_by(company_id=company_id).all()
    result = []
    for customer in customers:
        area = Area.query.get(customer.area_id)
        service_plan = ServicePlan.query.get(customer.service_plan_id)
        result.append({
            'id': str(customer.id),
            'email': customer.email,
            'first_name': customer.first_name,
            'last_name': customer.last_name,
            'area': area.name if area else 'Unassigned',
            'service_plan': service_plan.name if service_plan else 'Unassigned',
            'installation_address': customer.installation_address,
            'installation_date': customer.installation_date.isoformat() if customer.installation_date else None,
            'is_active': customer.is_active
        })
    return result

def add_customer(data):
    new_customer = Customer(
        company_id=uuid.UUID(data['company_id']),
        area_id=data['area_id'],
        service_plan_id=data['service_plan_id'],
        first_name=data['first_name'],
        last_name=data['last_name'],
        email=data['email'],
        installation_address=data['installation_address'],
        installation_date=data['installation_date'],
        is_active=True
    )
    db.session.add(new_customer)
    
    try:
        db.session.commit()
        return new_customer
    except Exception as e:
        db.session.rollback()
        raise

def update_customer(id, data, company_id):
    customer = Customer.query.filter_by(id=id, company_id=company_id).first()
    if not customer:
        return None

    customer.email = data.get('email', customer.email)
    customer.first_name = data.get('first_name', customer.first_name)
    customer.last_name = data.get('last_name', customer.last_name)
    customer.area_id = data.get('area_id', customer.area_id)
    customer.service_plan_id = data.get('service_plan_id', customer.service_plan_id)
    customer.installation_address = data.get('installation_address', customer.installation_address)
    customer.installation_date = data.get('installation_date', customer.installation_date)
    customer.is_active = data.get('is_active', customer.is_active)
    db.session.commit()
    return customer

def delete_customer(id, company_id):
    customer = Customer.query.filter_by(id=id, company_id=company_id).first()
    if not customer:
        return False
    db.session.delete(customer)
    db.session.commit()
    return True

def toggle_customer_status(id, company_id):
    customer = Customer.query.filter_by(id=id, company_id=company_id).first()
    if not customer:
        return None
    customer.is_active = not customer.is_active
    db.session.commit()
    return customer


def get_all_service_plans(company_id):
    service_plans = ServicePlan.query.filter_by(company_id=company_id).all()
    return [{
        'id': str(plan.id),
        'name': plan.name,
        'description': plan.description,
        'speed_mbps': plan.speed_mbps,
        'data_cap_gb': plan.data_cap_gb,
        'price': float(plan.price),
        'is_active': plan.is_active
    } for plan in service_plans]

def add_service_plan(data):
    new_service_plan = ServicePlan(
        company_id=uuid.UUID(data['company_id']),
        name=data['name'],
        description=data['description'],
        speed_mbps=data['speed_mbps'],
        data_cap_gb=data['data_cap_gb'],
        price=data['price'],
        is_active=True
    )
    db.session.add(new_service_plan)
    
    try:
        db.session.commit()
        return new_service_plan
    except Exception as e:
        db.session.rollback()
        raise

def update_service_plan(id, data, company_id):
    service_plan = ServicePlan.query.filter_by(id=id, company_id=company_id).first()
    if not service_plan:
        return None

    service_plan.name = data.get('name', service_plan.name)
    service_plan.description = data.get('description', service_plan.description)
    service_plan.speed_mbps = data.get('speed_mbps', service_plan.speed_mbps)
    service_plan.data_cap_gb = data.get('data_cap_gb', service_plan.data_cap_gb)
    service_plan.price = data.get('price', service_plan.price)
    service_plan.is_active = data.get('is_active', service_plan.is_active)
    try:
        db.session.commit()
        return service_plan
    except Exception as e:
        db.session.rollback()
        raise

def delete_service_plan(id, company_id):
    service_plan = ServicePlan.query.filter_by(id=id, company_id=company_id).first()
    if not service_plan:
        return False
    db.session.delete(service_plan)
    db.session.commit()
    return True

def toggle_service_plan_status(id, company_id):
    service_plan = ServicePlan.query.filter_by(id=id, company_id=company_id).first()
    if not service_plan:
        return None
    service_plan.is_active = not service_plan.is_active
    db.session.commit()
    return service_plan

def get_all_complaints(company_id):
    complaints = Complaint.query.join(Customer).filter(Customer.company_id == company_id).all()
    result = []
    for complaint in complaints:
        customer = Customer.query.get(complaint.customer_id)
        assigned_user = User.query.get(complaint.assigned_to)
        result.append({
            'id': str(complaint.id),
            'customer_name': f"{customer.first_name} {customer.last_name}",
            'customer_id': str(customer.id),
            'title': complaint.title,
            'description': complaint.description,
            'status': complaint.status,
            'assigned_to': str(assigned_user.id) if assigned_user else None,
            'assigned_to_name': f"{assigned_user.first_name} {assigned_user.last_name}" if assigned_user else "Unassigned",
            'created_at': complaint.created_at.isoformat(),
            'is_active': complaint.is_active
        })
    return result

def add_complaint(data, company_id):
    new_complaint = Complaint(
        customer_id=uuid.UUID(data['customer_id']),
        title=data['title'],
        description=data['description'],
        status='open',
        assigned_to=uuid.UUID(data['assigned_to']) if data.get('assigned_to') else None
    )
    db.session.add(new_complaint)
    db.session.commit()
    return new_complaint

def update_complaint(id, data):
    complaint = Complaint.query.get(id)
    if not complaint:
        return None

    complaint.title = data.get('title', complaint.title)
    complaint.description = data.get('description', complaint.description)
    complaint.status = data.get('status', complaint.status)
    complaint.assigned_to = uuid.UUID(data['assigned_to']) if data.get('assigned_to') else None
    complaint.customer_id = uuid.UUID(data['customer_id']) if data.get('customer_id') else complaint.customer_id
    complaint.is_active = data.get('is_active', complaint.is_active)
    db.session.commit()
    return complaint

def delete_complaint(id):
    complaint = Complaint.query.get(id)
    if not complaint:
        return False
    db.session.delete(complaint)
    db.session.commit()
    return True

def get_all_inventory_items(company_id):
    inventory_items = InventoryItem.query.filter_by(company_id=company_id).all()
    return [{
        'id': str(item.id),
        'name': item.name,
        'description': item.description,
        'quantity': item.quantity,
        'unit_price': float(item.unit_price)
    } for item in inventory_items]

def add_inventory_item(data, company_id):
    new_item = InventoryItem(
        company_id=company_id,
        name=data['name'],
        description=data.get('description'),
        quantity=data['quantity'],
        unit_price=data['unit_price']
    )
    db.session.add(new_item)
    db.session.commit()
    return new_item

def update_inventory_item(id, data, company_id):
    item = InventoryItem.query.filter_by(id=id, company_id=company_id).first()
    if not item:
        return None
    
    item.name = data.get('name', item.name)
    item.description = data.get('description', item.description)
    item.quantity = data.get('quantity', item.quantity)
    item.unit_price = data.get('unit_price', item.unit_price)
    item.is_active = data.get('is_active', item.is_active)
    db.session.commit()
    return item

def delete_inventory_item(id, company_id):
    item = InventoryItem.query.filter_by(id=id, company_id=company_id).first()
    if not item:
        return False
    db.session.delete(item)
    db.session.commit()
    return True
def get_all_suppliers(company_id):
    suppliers = Supplier.query.filter_by(company_id=company_id).all()
    return [{
        'id': str(supplier.id),
        'name': supplier.name,
        'contact_person': supplier.contact_person,
        'email': supplier.email,
        'phone': supplier.phone,
        'address': supplier.address,
        'is_active': supplier.is_active
    } for supplier in suppliers]

def add_supplier(data):
    new_supplier = Supplier(
        company_id=uuid.UUID(data['company_id']),
        name=data['name'],
        contact_person=data.get('contact_person'),
        email=data['email'],
        phone=data.get('phone'),
        address=data.get('address')
    )
    db.session.add(new_supplier)
    db.session.commit()
    return new_supplier

def update_supplier(id, data, company_id):
    supplier = Supplier.query.filter_by(id=id, company_id=company_id).first()
    if not supplier:
        return None

    supplier.name = data.get('name', supplier.name)
    supplier.contact_person = data.get('contact_person', supplier.contact_person)
    supplier.email = data.get('email', supplier.email)
    supplier.phone = data.get('phone', supplier.phone)
    supplier.address = data.get('address', supplier.address)
    supplier.is_active = data.get('is_active', supplier.is_active)
    db.session.commit()
    return supplier

def delete_supplier(id, company_id):
    supplier = Supplier.query.filter_by(id=id, company_id=company_id).first()
    if not supplier:
        return False
    db.session.delete(supplier)
    db.session.commit()
    return True

def get_all_areas(company_id):
    areas = Area.query.filter_by(company_id=company_id).all()
    return [{
        'id': str(area.id),
        'name': area.name,
        'description': area.description,
        'is_active': area.is_active
    } for area in areas]

def add_area(data):
    new_area = Area(
        company_id=uuid.UUID(data['company_id']),
        name=data['name'],
        description=data.get('description')
    )
    db.session.add(new_area)
    db.session.commit()
    return new_area

def update_area(id, data, company_id):
    area = Area.query.filter_by(id=id, company_id=company_id).first()
    if not area:
        return None

    area.name = data.get('name', area.name)
    area.description = data.get('description', area.description)
    area.is_active = data.get('is_active', area.is_active)
    db.session.commit()
    return area

def delete_area(id, company_id):
    area = Area.query.filter_by(id=id, company_id=company_id).first()
    if not area:
        return False
    db.session.delete(area)
    db.session.commit()
    return True
def get_all_recovery_tasks(company_id):
    recovery_tasks = RecoveryTask.query.filter_by(company_id=company_id).all()
    for task in recovery_tasks:
        print('Assigned To:',task.assigned_to)
    return [{
        'id': str(task.id),
        'invoice_id': str(task.invoice_id),
        'invoice_number': Invoice.query.get(task.invoice_id).invoice_number if Invoice.query.get(task.invoice_id) else None,
        'assigned_to': str(task.assigned_to),
        'assigned_to_name': User.query.get(task.assigned_to).first_name if User.query.get(task.assigned_to) else None,
        'status': task.status,
        'notes': task.notes,
        'created_at': task.created_at.isoformat(),
        'updated_at': task.updated_at.isoformat(),
        'is_active': task.is_active
    } for task in recovery_tasks]

def add_recovery_task(data):
    new_task = RecoveryTask(
        company_id=uuid.UUID(data['company_id']),
        invoice_id=uuid.UUID(data['invoice_id']),
        assigned_to=uuid.UUID(data['assigned_to']),
        status=data['status'],
        notes=data.get('notes')
    )
    db.session.add(new_task)
    db.session.commit()
    return new_task

def update_recovery_task(id, data, company_id):
    task = RecoveryTask.query.filter_by(id=id, company_id=company_id).first()
    if not task:
        return None

    task.invoice_id = uuid.UUID(data.get('invoice_id', task.invoice_id))
    task.assigned_to = uuid.UUID(data.get('assigned_to', task.assigned_to))
    task.status = data.get('status', task.status)
    task.notes = data.get('notes', task.notes)
    task.is_active = data.get('is_active', task.is_active)
    db.session.commit()
    return task

def delete_recovery_task(id, company_id):
    task = RecoveryTask.query.filter_by(id=id, company_id=company_id).first()
    if not task:
        return False
    db.session.delete(task)
    db.session.commit()
    return True

def get_all_tasks(company_id):
    tasks = Task.query.filter_by(company_id=company_id).all()
    return [{
        'id': str(task.id),
        'title': task.title,
        'description': task.description,
        'due_date': task.due_date.isoformat() if task.due_date else None,
        'status': task.status,
        'assigned_to': str(task.assigned_to),
        'assigned_to_name': User.query.get(task.assigned_to).first_name + ' ' + User.query.get(task.assigned_to).last_name if task.assigned_to else None,
        'is_active': task.is_active
    } for task in tasks]

def add_task(data):
    new_task = Task(
        company_id=uuid.UUID(data['company_id']),
        title=data['title'],
        description=data.get('description'),
        due_date=data.get('due_date'),
        status=data['status'],
        assigned_to=uuid.UUID(data['assigned_to']) if data.get('assigned_to') else None
    )
    db.session.add(new_task)
    db.session.commit()
    return new_task

def update_task(id, data, company_id):
    task = Task.query.filter_by(id=id, company_id=company_id).first()
    if not task:
        return None

    task.title = data.get('title', task.title)
    task.description = data.get('description', task.description)
    task.due_date = data.get('due_date', task.due_date)
    task.status = data.get('status', task.status)
    task.assigned_to = uuid.UUID(data['assigned_to']) if data.get('assigned_to') else None
    task.is_active = data.get('is_active', task.is_active)
    db.session.commit()
    return task

def delete_task(id, company_id):
    task = Task.query.filter_by(id=id, company_id=company_id).first()
    if not task:
        return False
    db.session.delete(task)
    db.session.commit()
    return True
@handle_db_error
def generate_invoice_number():
    try:
        year = datetime.now().year
        last_invoice = Invoice.query.order_by(Invoice.created_at.desc()).first()
        if last_invoice and last_invoice.invoice_number.startswith(f'INV-{year}-'):
            try:
                last_number = int(last_invoice.invoice_number.split('-')[-1])
                new_number = last_number + 1
            except (ValueError, IndexError) as e:
                logger.error(f"Error parsing invoice number: {str(e)}")
                raise InvoiceError("Failed to generate invoice number")
        else:
            new_number = 1
        return f'INV-{year}-{new_number:04d}'
    except Exception as e:
        logger.error(f"Error generating invoice number: {str(e)}")
        raise InvoiceError("Failed to generate invoice number")

@handle_db_error
def get_all_invoices(company_id):
    try:
        invoices = db.session.query(Invoice).options(joinedload(Invoice.customer)).all()
        return [invoice_to_dict(invoice) for invoice in invoices]
    except Exception as e:
        logger.error(f"Error listing invoices: {str(e)}")
        raise InvoiceError("Failed to list invoices")

def invoice_to_dict(invoice):
    return {
        'id': str(invoice.id),
        'invoice_number': invoice.invoice_number,
        'company_id': str(invoice.company_id),
        'customer_id': str(invoice.customer_id),
        'customer_name': f"{invoice.customer.first_name} {invoice.customer.last_name}" if invoice.customer else "N/A",
        'billing_start_date': invoice.billing_start_date.isoformat(),
        'billing_end_date': invoice.billing_end_date.isoformat(),
        'due_date': invoice.due_date.isoformat(),
        'subtotal': float(invoice.subtotal),
        'discount_percentage': float(invoice.discount_percentage),
        'total_amount': float(invoice.total_amount),
        'invoice_type': invoice.invoice_type,
        'notes': invoice.notes,
        'generated_by': str(invoice.generated_by),
        'status': invoice.status,
        'is_active': invoice.is_active
    }

@handle_db_error
def add_invoice(data, current_user_id):
    try:
        # Validate required fields
        required_fields = ['company_id', 'customer_id', 'billing_start_date', 
                         'billing_end_date', 'due_date', 'subtotal', 
                         'discount_percentage', 'total_amount', 'invoice_type']
        for field in required_fields:
            if field not in data:
                raise ValueError(f"Missing required field: {field}")

        # Parse and validate dates
        date_fields = ['billing_start_date', 'billing_end_date', 'due_date']
        for field in date_fields:
            try:
                data[field] = datetime.fromisoformat(data[field].rstrip('Z'))
            except ValueError:
                raise ValueError(f"Invalid date format for {field}")

        new_invoice = Invoice(
            company_id=uuid.UUID(data['company_id']),
            invoice_number=generate_invoice_number(),
            customer_id=uuid.UUID(data['customer_id']),
            billing_start_date=data['billing_start_date'],
            billing_end_date=data['billing_end_date'],
            due_date=data['due_date'],
            subtotal=data['subtotal'],
            discount_percentage=data['discount_percentage'],
            total_amount=data['total_amount'],
            invoice_type=data['invoice_type'],
            notes=data.get('notes'),
            generated_by=current_user_id,
            status='pending'
        )
        
        db.session.add(new_invoice)
        db.session.commit()
        return new_invoice
    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        raise InvoiceError(str(e))
    except Exception as e:
        logger.error(f"Error adding invoice: {str(e)}")
        db.session.rollback()
        raise InvoiceError("Failed to create invoice")
    
@handle_db_error
def update_invoice(id, data, company_id):
    try:
        invoice = Invoice.query.filter_by(id=id, company_id=company_id).first()
        if not invoice:
            raise ValueError(f"Invoice with id {id} not found")

        # Validate UUID fields
        if 'customer_id' in data:
            try:
                data['customer_id'] = uuid.UUID(data['customer_id'])
            except ValueError:
                raise ValueError("Invalid customer_id format")

        if 'generated_by' in data:
            try:
                data['generated_by'] = uuid.UUID(data['generated_by'])
            except ValueError:
                raise ValueError("Invalid generated_by format")
        if 'is_active' in data:
            invoice.is_active = data['is_active']
        # Update fields
        fields_to_update = [
            'customer_id', 'billing_start_date', 'billing_end_date', 
            'due_date', 'subtotal', 'discount_percentage', 'total_amount',
            'invoice_type', 'notes', 'generated_by'
        ]
        
        for field in fields_to_update:
            if field in data:
                setattr(invoice, field, data[field])

        db.session.commit()
        return invoice
    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        raise InvoiceError(str(e))
    except Exception as e:
        logger.error(f"Error updating invoice {id}: {str(e)}")
        db.session.rollback()
        raise InvoiceError("Failed to update invoice")

@handle_db_error
def delete_invoice(id, company_id):
    try:
        invoice = Invoice.query.filter_by(id=id, company_id=company_id).first()
        if not invoice:
            raise ValueError(f"Invoice with id {id} not found")

        # Check for related payments
        payments = Payment.query.filter_by(invoice_id=id).all()
        if payments:
            raise ValueError("Cannot delete invoice with associated payments")

        db.session.delete(invoice)
        db.session.commit()
        return True
    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        raise InvoiceError(str(e))
    except Exception as e:
        logger.error(f"Error deleting invoice {id}: {str(e)}")
        db.session.rollback()
        raise InvoiceError("Failed to delete invoice")

@handle_db_error
def get_all_payments(company_id):
    try:
        payments = Payment.query.filter_by(company_id=company_id).all()
        result = []
        for payment in payments:
            try:
                result.append({
                    'id': str(payment.id),
                    'invoice_id': str(payment.invoice_id),
                    'invoice_number': payment.invoice.invoice_number,
                    'customer_name': f"{payment.invoice.customer.first_name} {payment.invoice.customer.last_name}",
                    'amount': float(payment.amount),
                    'payment_date': payment.payment_date.isoformat(),
                    'payment_method': payment.payment_method,
                    'transaction_id': payment.transaction_id,
                    'status': payment.status,
                    'failure_reason': payment.failure_reason,
                    'payment_proof': payment.payment_proof,
                    'received_by': f"{payment.receiver.first_name} {payment.receiver.last_name}",
                    'is_active': payment.is_active
                })
            except AttributeError as e:
                logger.error(f"Error processing payment {payment.id}: {str(e)}")
                continue
        return result
    except Exception as e:
        logger.error(f"Error getting payments: {str(e)}")
        raise PaymentError("Failed to retrieve payments")

@handle_db_error
def add_payment(data):
    try:
        # Validate required fields
        required_fields = ['company_id', 'invoice_id', 'amount', 'payment_date', 
                         'payment_method', 'status', 'received_by']
        for field in required_fields:
            if field not in data:
                raise ValueError(f"Missing required field: {field}")

        UPLOAD_FOLDER = 'uploads/payment_proofs'
        os.makedirs(UPLOAD_FOLDER, exist_ok=True)

        # Validate and create payment
        try:
            new_payment = Payment(
                company_id=uuid.UUID(data['company_id']),
                invoice_id=uuid.UUID(data['invoice_id']),
                amount=float(data['amount']),
                payment_date=data['payment_date'],
                payment_method=data['payment_method'],
                transaction_id=data.get('transaction_id'),
                status=data['status'],
                failure_reason=data.get('failure_reason'),
                received_by=uuid.UUID(data['received_by'])
            )
        except (ValueError, TypeError) as e:
            raise ValueError(f"Invalid data format: {str(e)}")

        # Handle payment proof
        if 'payment_proof' in data and data['payment_proof']:
            new_payment.payment_proof = data['payment_proof']

        db.session.add(new_payment)
        
        # Update invoice status
        if data['status'] == 'paid':
            invoice = Invoice.query.get(uuid.UUID(data['invoice_id']))
            if invoice:
                invoice.status = 'paid'
            else:
                raise ValueError("Invalid invoice_id")
        
        db.session.commit()
        return new_payment
    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        raise PaymentError(str(e))
    except Exception as e:
        logger.error(f"Error adding payment: {str(e)}")
        db.session.rollback()
        raise PaymentError("Failed to create payment")

@handle_db_error
def update_payment(id, data, company_id):
    try:
        payment = Payment.query.filter_by(id=id, company_id=company_id).first()
        if not payment:
            raise ValueError(f"Payment with id {id} not found")

        UPLOAD_FOLDER = 'uploads/payment_proofs'
        os.makedirs(UPLOAD_FOLDER, exist_ok=True)

        # Update fields
        if 'invoice_id' in data:
            payment.invoice_id = uuid.UUID(data['invoice_id'])
        if 'amount' in data:
            payment.amount = float(data['amount'])
        if 'payment_date' in data:
            payment.payment_date = data['payment_date']
        if 'payment_method' in data:
            payment.payment_method = data['payment_method']
        if 'transaction_id' in data:
            payment.transaction_id = data['transaction_id']
        if 'status' in data:
            payment.status = data['status']
        if 'failure_reason' in data:
            payment.failure_reason = data['failure_reason']
        if 'received_by' in data:
            payment.received_by = uuid.UUID(data['received_by'])
        if 'is_active' in data:
            payment.is_active = data['is_active']
        # Handle payment proof update
        if 'payment_proof' in data:
            try:
                # Delete old file if it exists
                if payment.payment_proof and os.path.exists(payment.payment_proof):
                    os.remove(payment.payment_proof)
                
                file = data['payment_proof']
                filename = secure_filename(file.filename)
                file_path = os.path.join(UPLOAD_FOLDER, filename)
                file.save(file_path)
                payment.payment_proof = file_path
            except Exception as e:
                logger.error(f"Error updating payment proof: {str(e)}")
                raise PaymentError("Failed to update payment proof")

        # Update invoice status
        if payment.status == 'paid':
            invoice = Invoice.query.get(payment.invoice_id)
            if invoice:
                invoice.status = 'paid'
            else:
                raise ValueError("Invalid invoice_id")

        db.session.commit()
        return payment
    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        raise PaymentError(str(e))
    except Exception as e:
        logger.error(f"Error updating payment {id}: {str(e)}")
        db.session.rollback()
        raise PaymentError("Failed to update payment")

@handle_db_error
def delete_payment(id, company_id):
    try:
        payment = Payment.query.filter_by(id=id, company_id=company_id).first()
        if not payment:
            raise ValueError(f"Payment with id {id} not found")

        # Delete payment proof file if it exists
        if payment.payment_proof and os.path.exists(payment.payment_proof):
            try:
                os.remove(payment.payment_proof)
            except OSError as e:
                logger.error(f"Error deleting payment proof file: {str(e)}")

        db.session.delete(payment)
        db.session.commit()
        return True
    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        raise PaymentError(str(e))
    except Exception as e:
        logger.error(f"Error deleting payment {id}: {str(e)}")
        db.session.rollback()
        raise PaymentError("Failed to delete payment")
    
@handle_db_error
def get_invoice_by_id(id, company_id):
    try:
        invoice = Invoice.query.filter_by(id=id, company_id=company_id).first()
        return invoice
    except Exception as e:
        logger.error(f"Error getting invoice {id}: {str(e)}")
        raise InvoiceError("Failed to retrieve invoice")
    
@handle_db_error
def get_customer_by_id(id, company_id):
    try:
        customer = Customer.query.filter_by(id=id, company_id=company_id).first()
        if not customer:
            return None
        
        area = Area.query.get(customer.area_id)
        service_plan = ServicePlan.query.get(customer.service_plan_id)
        
        return {
            'id': str(customer.id),
            'first_name': customer.first_name,
            'last_name': customer.last_name,
            'email': customer.email,
            'area': area.name if area else 'Unassigned',
            'service_plan': service_plan.name if service_plan else 'Unassigned',
            'installation_address': customer.installation_address,
            'installation_date': customer.installation_date.isoformat() if customer.installation_date else None,
            'is_active': customer.is_active
        }
    except Exception as e:
        logger.error(f"Error getting customer by id: {str(e)}")
        raise

@handle_db_error
def get_customer_invoices(customer_id, company_id):
    try:
        invoices = Invoice.query.filter_by(customer_id=customer_id, company_id=company_id).all()
        return [{
            'id': str(invoice.id),
            'invoice_number': invoice.invoice_number,
            'billing_start_date': invoice.billing_start_date.isoformat(),
            'billing_end_date': invoice.billing_end_date.isoformat(),
            'due_date': invoice.due_date.isoformat(),
            'total_amount': float(invoice.total_amount),
            'status': invoice.status
        } for invoice in invoices]
    except Exception as e:
        logger.error(f"Error getting customer invoices: {str(e)}")
        raise

@handle_db_error
def get_customer_payments(customer_id, company_id):
    try:
        payments = Payment.query.join(Invoice).filter(
            Invoice.customer_id == customer_id,
            Payment.company_id == company_id
        ).all()
        return [{
            'id': str(payment.id),
            'invoice_id': str(payment.invoice_id),
            'amount': float(payment.amount),
            'payment_date': payment.payment_date.isoformat(),
            'payment_method': payment.payment_method,
            'status': payment.status
        } for payment in payments]
    except Exception as e:
        logger.error(f"Error getting customer payments: {str(e)}")
        raise

@handle_db_error
def get_customer_complaints(customer_id, company_id):
    try:
        complaints = Complaint.query.filter_by(customer_id=customer_id).all()
        return [{
            'id': str(complaint.id),
            'title': complaint.title,
            'description': complaint.description,
            'status': complaint.status,
            'created_at': complaint.created_at.isoformat()
        } for complaint in complaints]
    except Exception as e:
        logger.error(f"Error getting customer complaints: {str(e)}")
        raise 
 
@handle_db_error
def add_message(data):
    recipient_ids = data['recipient_ids'].split(',')
    messages = []
    for recipient_id in recipient_ids:
        # Check if the recipient is a user or a customer
        user = User.query.get(recipient_id)
        customer = Customer.query.get(recipient_id) if not user else None
        
        if not user and not customer:
            logger.error(f"Recipient with id {recipient_id} not found")
            continue

        new_message = Message(
            company_id=uuid.UUID(data['company_id']),
            sender_id=uuid.UUID(data['sender_id']),
            recipient_id=uuid.UUID(recipient_id),
            subject=data['subject'],
            content=data['content']
        )
        db.session.add(new_message)
        messages.append(new_message)
    
    if not messages:
        raise ValueError("No valid recipients found")

    try:
        db.session.commit()
        return messages[0]
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error adding message: {str(e)}")
        raise DatabaseError("Failed to add message")

@handle_db_error
def get_all_messages(company_id):
    messages = Message.query.filter_by(company_id=company_id).all()
    return [{
        'id': str(message.id),
        'sender': f"{message.sender.first_name} {message.sender.last_name}",
        'recipient': get_recipient_name(message.recipient_id),
        'subject': message.subject,
        'content': message.content,
        'is_read': message.is_read,
        'created_at': message.created_at.isoformat()
    } for message in messages]

def get_recipient_name(recipient_id):
    user = User.query.get(recipient_id)
    if user:
        return f"{user.first_name} {user.last_name}"
    customer = Customer.query.get(recipient_id)
    if customer:
        return f"{customer.first_name} {customer.last_name}"
    return "Unknown Recipient"

@handle_db_error
def update_message(id, data, company_id):
    message = Message.query.filter_by(id=id, company_id=company_id).first()
    if not message:
        return None

    message.subject = data.get('subject', message.subject)
    message.content = data.get('content', message.content)
    message.is_read = data.get('is_read', message.is_read)
    message.is_active = data.get('is_active', message.is_active)
    db.session.commit()
    return message

@handle_db_error
def delete_message(id, company_id):
    message = Message.query.filter_by(id=id, company_id=company_id).first()
    if not message:
        return False
    db.session.delete(message)
    db.session.commit()
    return True

@handle_db_error
def get_executive_summary_data(company_id):
    try:
        # Fetch data from the database
        customers = Customer.query.filter_by(company_id=company_id).all()
        invoices = Invoice.query.filter_by(company_id=company_id).all()
        complaints = Complaint.query.join(Customer).filter(Customer.company_id == company_id).all()
        service_plans = ServicePlan.query.filter_by(company_id=company_id).all()

        # Calculate metrics
        total_active_customers = sum(1 for c in customers if c.is_active)
        monthly_recurring_revenue = sum(float(i.total_amount) for i in invoices if i.invoice_type == 'subscription')
        outstanding_payments = sum(float(i.total_amount) for i in invoices if i.status == 'pending')
        active_complaints = sum(1 for c in complaints if c.status in ['open', 'in_progress'])

        # Generate customer growth data (last 6 months)
        today = datetime.now(UTC)
        customer_growth_data = []
        for i in range(5, -1, -1):
            month_start = (today.replace(day=1) - timedelta(days=30*i)).replace(tzinfo=UTC)
            month_end = (month_start + timedelta(days=32)).replace(day=1, tzinfo=UTC) - timedelta(days=1)
            customer_count = sum(1 for c in customers if c.created_at.replace(tzinfo=UTC) <= month_end)
            customer_growth_data.append({
                'month': month_start.strftime('%b'),
                'customers': customer_count
            })

        # Generate service plan distribution data
        service_plan_data = [
            {
                'name': plan.name,
                'value': sum(1 for c in customers if c.service_plan_id == plan.id)
            }
            for plan in service_plans
        ]

        return {
            'total_active_customers': total_active_customers,
            'monthly_recurring_revenue': monthly_recurring_revenue,
            'outstanding_payments': outstanding_payments,
            'active_complaints': active_complaints,
            'customer_growth_data': customer_growth_data,
            'service_plan_data': service_plan_data
        }
    except Exception as e:
        logger.error(f"Error fetching executive summary data: {e}")
        return {
            'error': 'An error occurred while fetching the executive summary data.'
        }
    
@handle_db_error
def get_customer_analytics_data(company_id):
    try:
        # Calculate customer acquisition and churn rates
        today = datetime.now(UTC)
        last_month = today - timedelta(days=30)
        
        new_customers = Customer.query.filter(
            Customer.company_id == company_id,
            Customer.created_at >= last_month
        ).count()
        
        churned_customers = Customer.query.filter(
            Customer.company_id == company_id,
            Customer.is_active == False,
            Customer.updated_at >= last_month
        ).count()
        
        total_customers = Customer.query.filter_by(company_id=company_id).count()
        
        acquisition_rate = (new_customers / total_customers) * 100 if total_customers > 0 else 0
        churn_rate = (churned_customers / total_customers) * 100 if total_customers > 0 else 0

        # Calculate average customer lifetime value
        avg_clv = db.session.query(func.avg(Invoice.total_amount)).filter(
            Invoice.company_id == company_id
        ).scalar() or 0

        # Calculate customer satisfaction score (assuming you have a rating system)
        # This is a placeholder calculation, adjust according to your actual data model
        avg_satisfaction = 4.7  # Placeholder value

        # Get customer distribution by area
        customer_distribution = db.session.query(
            Area.name, func.count(Customer.id)
        ).join(Customer).filter(
            Customer.company_id == company_id
        ).group_by(Area.name).all()

        # Get service plan distribution
        service_plan_distribution = db.session.query(
            ServicePlan.name, func.count(Customer.id)
        ).join(Customer).filter(
            Customer.company_id == company_id
        ).group_by(ServicePlan.name).all()

        return {
            'acquisition_rate': round(acquisition_rate, 2),
            'churn_rate': round(churn_rate, 2),
            'avg_customer_lifetime_value': round(float(avg_clv), 2),
            'customer_satisfaction_score': avg_satisfaction,
            'customer_distribution': [
                {'area': area, 'customers': count} for area, count in customer_distribution
            ],
            'service_plan_distribution': [
                {'name': name, 'value': count} for name, count in service_plan_distribution
            ]
        }
    except Exception as e:
        logger.error(f"Error fetching customer analytics data: {e}")
        return {
            'error': 'An error occurred while fetching the customer analytics data.'
        }

@handle_db_error
def get_financial_analytics_data(company_id):
    try:
        # Calculate monthly revenue for the last 6 months
        today = datetime.now()
        six_months_ago = today - timedelta(days=180)
        monthly_revenue = db.session.query(
            func.date_trunc('month', Invoice.billing_start_date).label('month'),
            func.sum(Invoice.total_amount).label('revenue')
        ).filter(
            Invoice.company_id == company_id,
            Invoice.billing_start_date >= six_months_ago
        ).group_by('month').order_by('month').all()

        # Calculate revenue by service plan
        revenue_by_plan = db.session.query(
            ServicePlan.name,
            func.sum(Invoice.total_amount).label('revenue')
        ).join(Customer, Customer.id == Invoice.customer_id
        ).join(ServicePlan, ServicePlan.id == Customer.service_plan_id
        ).filter(Invoice.company_id == company_id
        ).group_by(ServicePlan.name).all()

        # Calculate total revenue
        total_revenue = db.session.query(func.sum(Invoice.total_amount)).filter(
            Invoice.company_id == company_id
        ).scalar() or Decimal(0)

        # Calculate average revenue per user
        total_customers = Customer.query.filter_by(company_id=company_id).count()
        avg_revenue_per_user = float(total_revenue) / total_customers if total_customers > 0 else 0

        # Calculate operating expenses (placeholder - adjust based on your data model)
        operating_expenses = float(total_revenue) * 0.6  # Assuming 60% of revenue goes to expenses

        # Calculate net profit margin
        net_profit = float(total_revenue) - operating_expenses
        net_profit_margin = (net_profit / float(total_revenue)) * 100 if total_revenue > 0 else 0

        return {
            'monthly_revenue': [
                {'month': month.strftime('%b'), 'revenue': float(revenue)}
                for month, revenue in monthly_revenue
            ],
            'revenue_by_plan': [
                {'plan': name, 'revenue': float(revenue)}
                for name, revenue in revenue_by_plan
            ],
            'total_revenue': float(total_revenue),
            'avg_revenue_per_user': float(avg_revenue_per_user),
            'operating_expenses': float(operating_expenses),
            'net_profit_margin': float(net_profit_margin)
        }
    except Exception as e:
        logger.error(f"Error fetching financial analytics data: {e}")
        return {
            'error': 'An error occurred while fetching the financial analytics data.'
        }
    
@handle_db_error
def get_complaint_status_data():
    try:
        status_counts = db.session.query(
            Complaint.status, func.count(Complaint.id)
        ).group_by(Complaint.status).all()
        
        return {status: count for status, count in status_counts}
    except Exception as e:
        logger.error(f"Error fetching complaint status data: {e}")
        return {'error': 'An error occurred while fetching complaint status data.'}, 500

@handle_db_error
def get_complaint_categories_data():
    try:
        category_counts = db.session.query(
            Complaint.category, func.count(Complaint.id)
        ).group_by(Complaint.category).all()
        
        return [{'category': category, 'count': count} for category, count in category_counts]
    except Exception as e:
        logger.error(f"Error fetching complaint categories data: {e}")
        return {'error': 'An error occurred while fetching complaint categories data.'}, 500

@handle_db_error
def get_service_support_metrics():
    try:
        now = datetime.utcnow()
        thirty_days_ago = now - timedelta(days=30)

        # Average Resolution Time (in hours)
        avg_resolution_time = db.session.query(
            func.avg(Complaint.resolved_at - Complaint.created_at)
        ).filter(Complaint.status == 'resolved').scalar()
        avg_resolution_time = round(avg_resolution_time.total_seconds() / 3600, 1) if avg_resolution_time else 0

        # Customer Satisfaction Rate (assuming a rating field in the Complaint model)
        satisfaction_rate = db.session.query(
            func.avg(Complaint.satisfaction_rating)
        ).filter(Complaint.satisfaction_rating.isnot(None)).scalar()
        satisfaction_rate = round(satisfaction_rate * 20, 1) if satisfaction_rate else 0  # Assuming rating is 1-5, converting to percentage

        # First Contact Resolution Rate
        total_complaints = Complaint.query.filter(Complaint.created_at >= thirty_days_ago).count()
        fcr_complaints = Complaint.query.filter(
            Complaint.created_at >= thirty_days_ago,
            Complaint.status == 'resolved',
            Complaint.resolution_attempts == 1
        ).count()
        fcr_rate = round((fcr_complaints / total_complaints) * 100, 1) if total_complaints > 0 else 0

        # Support Ticket Volume (last 30 days)
        ticket_volume = Complaint.query.filter(Complaint.created_at >= thirty_days_ago).count()

        return {
            'average_resolution_time': avg_resolution_time,
            'customer_satisfaction_rate': satisfaction_rate,
            'first_contact_resolution_rate': fcr_rate,
            'support_ticket_volume': ticket_volume
        }
    except Exception as e:
        logger.error(f"Error fetching service support metrics: {e}")
        return {'error': 'An error occurred while fetching service support metrics.'}, 500
    
@handle_db_error
def get_stock_level_data(company_id):
    try:
        stock_levels = db.session.query(
            InventoryItem.name,
            func.sum(InventoryItem.quantity)
        ).filter(InventoryItem.company_id == company_id
        ).group_by(InventoryItem.name).all()
        
        return [{'item': name, 'quantity': int(quantity)} for name, quantity in stock_levels]
    except Exception as e:
        logger.error(f"Error fetching stock level data: {e}")
        return {'error': 'An error occurred while fetching stock level data.'}

@handle_db_error
def get_inventory_movement_data(company_id):
    try:
        six_months_ago = datetime.utcnow() - timedelta(days=180)
        movements = db.session.query(
            func.date_trunc('month', InventoryMovement.date).label('month'),
            func.sum(InventoryMovement.quantity).filter(InventoryMovement.movement_type == 'inflow').label('inflow'),
            func.sum(InventoryMovement.quantity).filter(InventoryMovement.movement_type == 'outflow').label('outflow')
        ).filter(InventoryMovement.company_id == company_id,
                 InventoryMovement.date >= six_months_ago
        ).group_by('month'
        ).order_by('month').all()

        return [
            {
                'month': month.strftime('%b'),
                'inflow': int(inflow or 0),
                'outflow': int(outflow or 0)
            } for month, inflow, outflow in movements
        ]
    except Exception as e:
        logger.error(f"Error fetching inventory movement data: {e}")
        return {'error': 'An error occurred while fetching inventory movement data.'}

@handle_db_error
def get_inventory_metrics(company_id):
    try:
        total_value = db.session.query(func.sum(InventoryItem.quantity * InventoryItem.unit_price)
        ).filter(InventoryItem.company_id == company_id).scalar() or 0
        
        annual_sales = db.session.query(func.sum(InventoryMovement.quantity)
        ).filter(InventoryMovement.company_id == company_id,
                 InventoryMovement.movement_type == 'outflow',
                 InventoryMovement.date >= datetime.utcnow() - timedelta(days=365)).scalar() or 0
        average_inventory = db.session.query(func.avg(InventoryItem.quantity)
        ).filter(InventoryItem.company_id == company_id).scalar() or 1
        inventory_turnover = annual_sales / average_inventory if average_inventory > 0 else 0

        low_stock_threshold = 10  # Adjust this value as needed
        low_stock_items = db.session.query(func.count(InventoryItem.id)
        ).filter(InventoryItem.company_id == company_id,
                 InventoryItem.quantity < low_stock_threshold).scalar() or 0

        # Supplier lead time calculation (assuming you have a supplier orders table)
        # This is a placeholder value and should be replaced with actual calculation
        supplier_lead_time = 7

        return {
            'total_inventory_value': round(float(total_value), 2),
            'inventory_turnover_rate': round(inventory_turnover, 2),
            'low_stock_items': int(low_stock_items),
            'supplier_lead_time': supplier_lead_time
        }
    except Exception as e:
        logger.error(f"Error fetching inventory metrics: {e}")
        return {'error': 'An error occurred while fetching inventory metrics.'}

@handle_db_error
def get_employee_analytics_data(company_id):
    try:
        # Get performance data
        performance_data = db.session.query(
            User.first_name,
            User.last_name,
            func.count(Task.id).label('tasks_completed'),
            func.avg(Complaint.satisfaction_rating).label('avg_satisfaction')
        ).outerjoin(Task, (User.id == Task.assigned_to) & (Task.status == 'completed') & (Task.company_id == company_id)
        ).outerjoin(Complaint, User.id == Complaint.assigned_to
        ).outerjoin(Customer, Complaint.customer_id == Customer.id
        ).filter(User.company_id == company_id, Customer.company_id == company_id
        ).group_by(User.id
        ).order_by(func.count(Task.id).desc()
        ).limit(5).all()

        # Get productivity trend data
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=180)
        productivity_data = db.session.query(
            func.date_trunc('month', Task.updated_at).label('month'),
            func.count(Task.id).label('tasks_completed')
        ).filter(Task.company_id == company_id,
                 Task.status == 'completed',
                 Task.updated_at.between(start_date, end_date)
        ).group_by('month'
        ).order_by('month').all()

        # Calculate metrics
        total_employees = User.query.filter_by(company_id=company_id).count()
        total_tasks = Task.query.filter_by(company_id=company_id, status='completed').count()
        avg_tasks = total_tasks / total_employees if total_employees > 0 else 0
        avg_satisfaction = db.session.query(func.avg(Complaint.satisfaction_rating)
        ).join(Customer).filter(Customer.company_id == company_id).scalar() or 0
        top_performer = max(performance_data, key=lambda x: x.tasks_completed) if performance_data else None
        training_completion_rate = 92  # Placeholder value, replace with actual calculation

        return {
            'performanceData': [
                {
                    'employee': f"{p.first_name} {p.last_name}",
                    'tasks': p.tasks_completed,
                    'satisfaction': round(p.avg_satisfaction or 0, 1)
                } for p in performance_data
            ],
            'productivityTrendData': [
                {
                    'month': p.month.strftime('%b'),
                    'productivity': p.tasks_completed
                } for p in productivity_data
            ],
            'metrics': {
                'avgTasksCompleted': round(avg_tasks, 1),
                'avgSatisfactionScore': round(avg_satisfaction, 1),
                'topPerformer': f"{top_performer.first_name} {top_performer.last_name}" if top_performer else "N/A",
                'trainingCompletionRate': training_completion_rate
            }
        }
    except Exception as e:
        logger.error(f"Error fetching employee analytics data: {e}")
        return {'error': 'An error occurred while fetching employee analytics data.'}, 500
    
@handle_db_error
def get_area_analytics_data(company_id):
    try:
        # Get area performance data
        area_performance = db.session.query(
            Area.name.label('area'),
            func.count(Customer.id).label('customers'),
            func.sum(Invoice.total_amount).label('revenue')
        ).join(Customer, Customer.area_id == Area.id
        ).outerjoin(Invoice, Invoice.customer_id == Customer.id
        ).filter(Area.company_id == company_id
        ).group_by(Area.name).all()

        # Get service plan distribution data
        service_plan_distribution = db.session.query(
            ServicePlan.name,
            func.count(Customer.id).label('value')
        ).join(Customer
        ).filter(ServicePlan.company_id == company_id
        ).group_by(ServicePlan.name).all()

        # Calculate metrics
        total_customers = sum(area.customers for area in area_performance)
        total_revenue = sum(area.revenue for area in area_performance)
        best_performing_area = max(area_performance, key=lambda x: x.revenue)
        avg_revenue_per_customer = total_revenue / total_customers if total_customers > 0 else 0

        return {
            'areaPerformanceData': [
                {
                    'area': area.area,
                    'customers': area.customers,
                    'revenue': float(area.revenue)
                } for area in area_performance
            ],
            'servicePlanDistributionData': [
                {
                    'name': plan.name,
                    'value': plan.value
                } for plan in service_plan_distribution
            ],
            'metrics': {
                'totalCustomers': total_customers,
                'totalRevenue': float(total_revenue),
                'bestPerformingArea': best_performing_area.area,
                'avgRevenuePerCustomer': float(avg_revenue_per_customer)
            }
        }
    except Exception as e:
        logger.error(f"Error fetching area analytics data: {e}")
        return {'error': 'An error occurred while fetching area analytics data.'}

@handle_db_error
def get_service_plan_analytics_data(company_id):
    try:
        # Get service plan performance data
        service_plan_performance = db.session.query(
            ServicePlan.name.label('plan'),
            func.count(Customer.id).label('subscribers'),
            func.sum(ServicePlan.price).label('revenue')
        ).join(Customer, Customer.service_plan_id == ServicePlan.id
        ).filter(ServicePlan.company_id == company_id
        ).group_by(ServicePlan.name).all()

        # Get plan adoption trend data (last 6 months)
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=180)
        plan_adoption_trend = db.session.query(
            func.date_trunc('month', Customer.created_at).label('month'),
            ServicePlan.name,
            func.count(Customer.id).label('subscribers')
        ).join(ServicePlan, Customer.service_plan_id == ServicePlan.id
        ).filter(ServicePlan.company_id == company_id,
                 Customer.created_at.between(start_date, end_date)
        ).group_by('month', ServicePlan.name
        ).order_by('month').all()

        # Process plan adoption trend data
        trend_data = {}
        for month, plan, subscribers in plan_adoption_trend:
            month_str = month.strftime('%b')
            if month_str not in trend_data:
                trend_data[month_str] = {'month': month_str}
            trend_data[month_str][plan] = subscribers

        # Calculate metrics
        total_subscribers = sum(plan.subscribers for plan in service_plan_performance)
        total_revenue = sum(plan.revenue for plan in service_plan_performance)
        most_popular_plan = max(service_plan_performance, key=lambda x: x.subscribers).plan
        highest_revenue_plan = max(service_plan_performance, key=lambda x: x.revenue).plan

        return {
            'servicePlanPerformanceData': [
                {
                    'plan': plan.plan,
                    'subscribers': plan.subscribers,
                    'revenue': float(plan.revenue)
                } for plan in service_plan_performance
            ],
            'planAdoptionTrendData': list(trend_data.values()),
            'metrics': {
                'totalSubscribers': total_subscribers,
                'totalRevenue': float(total_revenue),
                'mostPopularPlan': most_popular_plan,
                'highestRevenuePlan': highest_revenue_plan
            }
        }
    except Exception as e:
        logger.error(f"Error fetching service plan analytics data: {e}")
        return {'error': 'An error occurred while fetching service plan analytics data.'}


@handle_db_error
def get_recovery_collections_data(company_id):
    try:
        # Get recovery performance data for the last 6 months
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=180)
        recovery_performance = db.session.query(
            func.date_trunc('month', Payment.payment_date).label('month'),
            func.sum(Payment.amount).label('recovered'),
            func.sum(Invoice.total_amount).label('total_amount')
        ).join(Invoice, Payment.invoice_id == Invoice.id
        ).filter(Payment.company_id == company_id,
                 Payment.payment_date.between(start_date, end_date)
        ).group_by('month'
        ).order_by('month').all()

        # Get outstanding by age data
        current_date = datetime.utcnow().date()
        outstanding_subquery = db.session.query(
            Invoice.id,
            Invoice.total_amount,
            func.coalesce(func.sum(Payment.amount), 0).label('paid_amount'),
            case(
                (Invoice.due_date > current_date, '0-30 days'),
                (Invoice.due_date <= current_date - timedelta(days=30), '31-60 days'),
                (Invoice.due_date <= current_date - timedelta(days=60), '61-90 days'),
                else_='90+ days'
            ).label('age_group')
        ).outerjoin(Payment, Invoice.id == Payment.invoice_id
        ).filter(Invoice.company_id == company_id, Invoice.status != 'paid'
        ).group_by(Invoice.id, Invoice.total_amount, Invoice.due_date
        ).subquery()

        outstanding_by_age = db.session.query(
            outstanding_subquery.c.age_group,
            func.sum(outstanding_subquery.c.total_amount - outstanding_subquery.c.paid_amount).label('outstanding')
        ).group_by(outstanding_subquery.c.age_group).all()

        # Calculate metrics
        total_payments_subquery = db.session.query(
            Payment.invoice_id,
            func.coalesce(func.sum(Payment.amount), 0).label('total_payments')
        ).group_by(Payment.invoice_id).subquery()

        # Calculate total outstanding amount
        total_outstanding = db.session.query(
            func.sum(Invoice.total_amount - total_payments_subquery.c.total_payments)
        ).outerjoin(total_payments_subquery, Invoice.id == total_payments_subquery.c.invoice_id
        ).filter(Invoice.company_id == company_id, Invoice.status != 'paid').scalar() or 0

        # Calculate total recovered amount
        total_recovered = db.session.query(func.sum(Payment.amount)
        ).filter(Payment.company_id == company_id).scalar() or 0

        # Calculate recovery rate
        total_invoiced = total_recovered + total_outstanding
        recovery_rate = (total_recovered / total_invoiced * 100) if total_invoiced > 0 else 0

        # Calculate average collection time
        avg_collection_time_result = db.session.query(func.avg(Payment.payment_date - Invoice.due_date)
        ).join(Invoice, Payment.invoice_id == Invoice.id
        ).filter(Payment.company_id == company_id).scalar()

        # Handle different types of avg_collection_time_result
        if isinstance(avg_collection_time_result, Decimal):
            avg_collection_time = round(float(avg_collection_time_result))
        elif isinstance(avg_collection_time_result, timedelta):
            avg_collection_time = round(avg_collection_time_result.days)
        else:
            avg_collection_time = 0

        return {
            'recoveryPerformanceData': [
                {
                    'month': month.strftime('%b'),
                    'recovered': float(recovered),
                    'outstanding': float(total_amount - recovered)
                } for month, recovered, total_amount in recovery_performance
            ],
            'outstandingByAgeData': [
                {
                    'name': age_group,
                    'value': float(outstanding)
                } for age_group, outstanding in outstanding_by_age
            ],
            'metrics': {
                'totalRecovered': float(total_recovered),
                'totalOutstanding': float(total_outstanding),
                'recoveryRate': float(recovery_rate),
                'avgCollectionTime': avg_collection_time
            }
        }
    except Exception as e:
        logger.error(f"Error fetching recovery and collections data: {str(e)}")
        return {'error': 'An error occurred while fetching recovery and collections data.'}

