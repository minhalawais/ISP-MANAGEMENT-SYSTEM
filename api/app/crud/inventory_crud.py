from app import db
from app.models import InventoryItem, Supplier, InventoryTransaction, InventoryAssignment, User, Customer
from app.utils.logging_utils import log_action
import uuid
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

def get_all_inventory_items(company_id, user_role, employee_id):
    if user_role == 'super_admin':
        inventory_items = InventoryItem.query.all()
    elif user_role in ['auditor', 'company_owner', 'manager', 'employee']:
        inventory_items = InventoryItem.query.filter_by(company_id=company_id).all()
    else:
        return []
    
    return [{
        'id': str(item.id),
        'name': item.name,
        'description': item.description,
        'serial_number': item.serial_number,
        'status': item.status,
        'supplier_id': str(item.supplier_id),
        'supplier_name': item.supplier.name,
        'is_splitter': item.is_splitter,
        'splitter_number': item.splitter_number,
        'splitter_type': item.splitter_type,
        'port_count': item.port_count,
        'item_type': item.item_type,
        'company_id': str(item.company_id),
        'quantity': item.quantity,
        'unit_price': float(item.unit_price) if item.unit_price else None,
        'is_active': item.is_active
    } for item in inventory_items]

def add_inventory_item(data, company_id, user_role, current_user_id, ip_address, user_agent):
    new_item = InventoryItem(
        name=data['name'],
        description=data.get('description'),
        serial_number=data['serial_number'],
        status=data['status'],
        supplier_id=data['supplier_id'],
        is_splitter=data.get('is_splitter', False),
        splitter_number=data.get('splitter_number'),
        splitter_type=data.get('splitter_type'),
        port_count=data.get('port_count'),
        item_type=data.get('item_type'),
        company_id=company_id,
        quantity=data.get('quantity', 1),
        unit_price=data.get('unit_price')
    )
    db.session.add(new_item)
    db.session.commit()

    log_action(
        current_user_id,
        'CREATE',
        'inventory_items',
        new_item.id,
        None,
        data,
        ip_address,
        user_agent,
        company_id
    )

    return new_item

def update_inventory_item(id, data, company_id, user_role, current_user_id, ip_address, user_agent):
    item = InventoryItem.query.get(id)
    if not item:
        return None
    
    old_values = {
        'name': item.name,
        'description': item.description,
        'serial_number': item.serial_number,
        'status': item.status,
        'supplier_id': str(item.supplier_id),
        'is_splitter': item.is_splitter,
        'splitter_number': item.splitter_number,
        'splitter_type': item.splitter_type,
        'port_count': item.port_count,
        'item_type': item.item_type,
        'quantity': item.quantity,
        'unit_price': float(item.unit_price) if item.unit_price else None
    }

    item.name = data.get('name', item.name)
    item.description = data.get('description', item.description)
    item.serial_number = data.get('serial_number', item.serial_number)
    item.status = data.get('status', item.status)
    item.supplier_id = data.get('supplier_id', item.supplier_id)
    item.is_splitter = data.get('is_splitter', item.is_splitter)
    item.splitter_number = data.get('splitter_number', item.splitter_number)
    item.splitter_type = data.get('splitter_type', item.splitter_type)
    item.port_count = data.get('port_count', item.port_count)
    item.item_type = data.get('item_type', item.item_type)
    item.quantity = data.get('quantity', item.quantity)
    item.unit_price = data.get('unit_price', item.unit_price)
    db.session.commit()

    log_action(
        current_user_id,
        'UPDATE',
        'inventory_items',
        item.id,
        old_values,
        data,
        ip_address,
        user_agent,
        company_id
    )

    return item

def delete_inventory_item(id, company_id, user_role, current_user_id, ip_address, user_agent):
    item = InventoryItem.query.get(id)
    if not item:
        return False

    old_values = {
        'name': item.name,
        'description': item.description,
        'serial_number': item.serial_number,
        'status': item.status,
        'supplier_id': str(item.supplier_id),
        'is_splitter': item.is_splitter,
        'splitter_number': item.splitter_number,
        'splitter_type': item.splitter_type,
        'port_count': item.port_count,
        'item_type': item.item_type,
        'quantity': item.quantity,
        'unit_price': float(item.unit_price) if item.unit_price else None
    }

    db.session.delete(item)
    db.session.commit()

    log_action(
        current_user_id,
        'DELETE',
        'inventory_items',
        item.id,
        old_values,
        None,
        ip_address,
        user_agent,
        company_id
    )

    return True

def get_inventory_transactions(company_id, inventory_item_id=None):
    query = db.session.query(InventoryTransaction, InventoryItem.unit_price).\
        join(InventoryItem).\
        filter(InventoryItem.company_id == company_id)
    
    if inventory_item_id:
        query = query.filter(InventoryTransaction.inventory_item_id == inventory_item_id)
    
    transactions = query.order_by(InventoryTransaction.performed_at.desc()).all()
    
    return [{
        'id': str(transaction.InventoryTransaction.id),
        'inventory_item_id': str(transaction.InventoryTransaction.inventory_item_id),
        'inventory_item_name': transaction.InventoryTransaction.inventory_item.name,
        'transaction_type': transaction.InventoryTransaction.transaction_type,
        'performed_by': f"{transaction.InventoryTransaction.performed_by.first_name} {transaction.InventoryTransaction.performed_by.last_name}",
        'performed_at': transaction.InventoryTransaction.performed_at.isoformat(),
        'notes': transaction.InventoryTransaction.notes,
        'unit_price': float(transaction.unit_price) if transaction.unit_price else None
    } for transaction in transactions]

def add_inventory_transaction(data, company_id, user_id):
    new_transaction = InventoryTransaction(
        inventory_item_id=data['inventory_item_id'],
        transaction_type=data['transaction_type'],
        performed_by_id=user_id,
        notes=data.get('notes')
    )
    db.session.add(new_transaction)
    
    # Update inventory item quantity
    item = InventoryItem.query.get(data['inventory_item_id'])
    if data['transaction_type'] == 'add':
        item.quantity += data.get('quantity', 1)
    elif data['transaction_type'] == 'remove':
        item.quantity -= data.get('quantity', 1)
    
    db.session.commit()
    return new_transaction

def get_inventory_assignments(company_id, inventory_item_id=None):
    query = InventoryAssignment.query.join(InventoryItem).filter(InventoryItem.company_id == company_id)
    
    if inventory_item_id:
        query = query.filter(InventoryAssignment.inventory_item_id == inventory_item_id)
    
    assignments = query.order_by(InventoryAssignment.assigned_at.desc()).all()
    
    return [{
        'id': str(assignment.id),
        'inventory_item_id': str(assignment.inventory_item_id),
        'inventory_item_name': assignment.inventory_item.name,
        'assigned_to_customer': assignment.customer.first_name + ' ' + assignment.customer.last_name if assignment.customer else None,
        'assigned_to_employee': assignment.employee.first_name + ' ' + assignment.employee.last_name if assignment.employee else None,
        'assigned_at': assignment.assigned_at.isoformat(),
        'returned_at': assignment.returned_at.isoformat() if assignment.returned_at else None,
        'status': assignment.status
    } for assignment in assignments]

def add_inventory_assignment(data, company_id, user_id):
    new_assignment = InventoryAssignment(
        inventory_item_id=data['inventory_item_id'],
        assigned_to_customer_id=data.get('assigned_to_customer_id'),
        assigned_to_employee_id=data.get('assigned_to_employee_id'),
        status='assigned'
    )
    db.session.add(new_assignment)
    
    # Update inventory item status
    item = InventoryItem.query.get(data['inventory_item_id'])
    item.status = 'assigned'
    
    db.session.commit()
    return new_assignment

def return_inventory_assignment(assignment_id, company_id, user_id):
    assignment = InventoryAssignment.query.get(assignment_id)
    if not assignment:
        return None
    
    assignment.returned_at = datetime.utcnow()
    assignment.status = 'returned'
    
    # Update inventory item status
    item = assignment.inventory_item
    item.status = 'available'
    
    db.session.commit()
    return assignment

