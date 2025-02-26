from app import db
from app.models import InventoryItem, InventoryTransaction, InventoryAssignment, User, Customer
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
        'item_type': item.item_type,
        'quantity': item.quantity,
        'vendor': str(item.vendor),
        'vendor_name': item.supplier.name,  # Include supplier name for display
        'unit_price': float(item.unit_price) if item.unit_price else None,
        'is_active': item.is_active,
        'company_id': str(item.company_id),
        'attributes': item.attributes or {},
        'created_at': item.created_at.isoformat() if item.created_at else None,
        'updated_at': item.updated_at.isoformat() if item.updated_at else None
    } for item in inventory_items]

def add_inventory_item(data, company_id, user_role, current_user_id, ip_address, user_agent):
    # Extract base fields
    item_type = data.get('item_type')
    quantity = data.get('quantity', 1)
    vendor = data.get('vendor')  # This is the supplier_id
    unit_price = data.get('unit_price')
    
    # Extract type-specific attributes
    attributes = {}
    
    if item_type == 'Fiber Cable':
        # No additional attributes needed
        pass
    elif item_type == 'EtherNet Cable':
        attributes['type'] = data.get('cable_type')
    elif item_type == 'Splitters':
        pass
    elif item_type in ['ONT', 'ONU', 'Router', 'STB']:
        attributes['serial_number'] = data.get('serial_number')
        attributes['type'] = data.get('device_type')
        attributes['model'] = data.get('model')
    elif item_type == 'Fibe OPTIC Patch Cord' or item_type == 'Ethernet Patch Cord':
        attributes['type'] = data.get('cord_type')
    elif item_type == 'Switches':
        attributes['type'] = data.get('switch_type')
    elif item_type == 'Node':
        attributes['type'] = data.get('node_type')
    elif item_type == 'Dish':
        attributes['mac_address'] = data.get('mac_address')
        attributes['type'] = data.get('dish_type')
    elif item_type == 'Adopter':
        attributes['volt'] = data.get('volt')
        attributes['amp'] = data.get('amp')
    elif item_type == 'Cable Ties':
        attributes['type'] = data.get('tie_type')
        attributes['model'] = data.get('model')
    elif item_type == 'Others':
        # Store any additional attributes provided
        for key, value in data.items():
            if key not in ['item_type', 'quantity', 'vendor', 'unit_price', 'company_id']:
                attributes[key] = value
    
    new_item = InventoryItem(
        item_type=item_type,
        quantity=quantity,
        vendor=vendor,  # This is the supplier_id
        unit_price=unit_price,
        company_id=company_id,
        attributes=attributes,
        is_active=True
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
        'item_type': item.item_type,
        'quantity': item.quantity,
        'vendor': str(item.vendor),
        'unit_price': float(item.unit_price) if item.unit_price else None,
        'attributes': item.attributes
    }

    # Update base fields
    item.quantity = data.get('quantity', item.quantity)
    if 'vendor' in data:
        item.vendor = data['vendor']
    item.unit_price = data.get('unit_price', item.unit_price)
    
    # Update type-specific attributes if item_type hasn't changed
    if 'item_type' in data and data['item_type'] != item.item_type:
        # If item type has changed, reset attributes and set new ones
        item.item_type = data['item_type']
        item.attributes = {}
        
        # Set new attributes based on new item type
        if item.item_type == 'Fiber Cable':
            pass
        elif item.item_type == 'EtherNet Cable':
            item.attributes['type'] = data.get('cable_type')
        elif item.item_type == 'Splitters':
            pass
        elif item.item_type in ['ONT', 'ONU', 'Router', 'STB']:
            item.attributes['serial_number'] = data.get('serial_number')
            item.attributes['type'] = data.get('device_type')
            item.attributes['model'] = data.get('model')
        elif item.item_type == 'Fibe OPTIC Patch Cord' or item.item_type == 'Ethernet Patch Cord':
            item.attributes['type'] = data.get('cord_type')
        elif item.item_type == 'Switches':
            item.attributes['type'] = data.get('switch_type')
        elif item.item_type == 'Node':
            item.attributes['type'] = data.get('node_type')
        elif item.item_type == 'Dish':
            item.attributes['mac_address'] = data.get('mac_address')
            item.attributes['type'] = data.get('dish_type')
        elif item.item_type == 'Adopter':
            item.attributes['volt'] = data.get('volt')
            item.attributes['amp'] = data.get('amp')
        elif item.item_type == 'Cable Ties':
            item.attributes['type'] = data.get('tie_type')
            item.attributes['model'] = data.get('model')
        elif item.item_type == 'Others':
            for key, value in data.items():
                if key not in ['item_type', 'quantity', 'vendor', 'unit_price', 'company_id']:
                    item.attributes[key] = value
    else:
        # Update existing attributes
        if item.attributes is None:
            item.attributes = {}
            
        if item.item_type == 'Fiber Cable':
            pass
        elif item.item_type == 'EtherNet Cable':
            item.attributes['type'] = data.get('cable_type', item.attributes.get('type'))
        elif item.item_type == 'Splitters':
            pass
        elif item.item_type in ['ONT', 'ONU', 'Router', 'STB']:
            item.attributes['serial_number'] = data.get('serial_number', item.attributes.get('serial_number'))
            item.attributes['type'] = data.get('device_type', item.attributes.get('type'))
            item.attributes['model'] = data.get('model', item.attributes.get('model'))
        elif item.item_type == 'Fibe OPTIC Patch Cord' or item.item_type == 'Ethernet Patch Cord':
            item.attributes['type'] = data.get('cord_type', item.attributes.get('type'))
        elif item.item_type == 'Switches':
            item.attributes['type'] = data.get('switch_type', item.attributes.get('type'))
        elif item.item_type == 'Node':
            item.attributes['type'] = data.get('node_type', item.attributes.get('type'))
        elif item.item_type == 'Dish':
            item.attributes['mac_address'] = data.get('mac_address', item.attributes.get('mac_address'))
            item.attributes['type'] = data.get('dish_type', item.attributes.get('type'))
        elif item.item_type == 'Adopter':
            item.attributes['volt'] = data.get('volt', item.attributes.get('volt'))
            item.attributes['amp'] = data.get('amp', item.attributes.get('amp'))
        elif item.item_type == 'Cable Ties':
            item.attributes['type'] = data.get('tie_type', item.attributes.get('type'))
            item.attributes['model'] = data.get('model', item.attributes.get('model'))
        elif item.item_type == 'Others':
            for key, value in data.items():
                if key not in ['item_type', 'quantity', 'vendor', 'unit_price', 'company_id']:
                    item.attributes[key] = value
    
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
        'item_type': item.item_type,
        'quantity': item.quantity,
        'vendor': str(item.vendor),
        'unit_price': float(item.unit_price) if item.unit_price else None,
        'attributes': item.attributes
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
    query = db.session.query(InventoryTransaction).\
        join(InventoryItem).\
        filter(InventoryItem.company_id == company_id)
    
    if inventory_item_id:
        query = query.filter(InventoryTransaction.inventory_item_id == inventory_item_id)
    
    transactions = query.order_by(InventoryTransaction.performed_at.desc()).all()
    
    return [{
        'id': str(transaction.id),
        'inventory_item_id': str(transaction.inventory_item_id),
        'inventory_item_type': transaction.inventory_item.item_type,
        'transaction_type': transaction.transaction_type,
        'performed_by': f"{transaction.performed_by.first_name} {transaction.performed_by.last_name}",
        'performed_at': transaction.performed_at.isoformat(),
        'notes': transaction.notes,
        'quantity': transaction.quantity
    } for transaction in transactions]

def add_inventory_transaction(data, company_id, user_id):
    new_transaction = InventoryTransaction(
        inventory_item_id=data['inventory_item_id'],
        transaction_type=data['transaction_type'],
        performed_by_id=user_id,
        notes=data.get('notes'),
        quantity=data['quantity']
    )
    db.session.add(new_transaction)
    
    # Update inventory item quantity
    item = InventoryItem.query.get(data['inventory_item_id'])
    if data['transaction_type'] == 'add':
        item.quantity += data['quantity']
    elif data['transaction_type'] == 'remove':
        item.quantity -= data['quantity']
    
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
        'inventory_item_type': assignment.inventory_item.item_type,
        'assigned_to_customer': assignment.customer.full_name if assignment.customer else None,
        'assigned_to_employee': assignment.employee.full_name if assignment.employee else None,
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
    
    # Update inventory item quantity
    item = InventoryItem.query.get(data['inventory_item_id'])
    item.quantity -= 1  # Reduce quantity when assigned
    
    db.session.commit()
    return new_assignment

def return_inventory_assignment(assignment_id, company_id, user_id):
    assignment = InventoryAssignment.query.get(assignment_id)
    if not assignment:
        return None
    
    if assignment.status == 'returned':
        raise ValueError("This assignment has already been returned.")
    
    assignment.returned_at = datetime.utcnow()
    assignment.status = 'returned'
    
    # Update inventory item quantity
    item = assignment.inventory_item
    item.quantity += 1  # Increase quantity when returned
    
    db.session.commit()
    return assignment

