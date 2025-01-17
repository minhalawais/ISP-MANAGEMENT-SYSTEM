from app import db
from app.models import InventoryItem, Supplier
from app.utils.logging_utils import log_action
import uuid
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
import logging

logger = logging.getLogger(__name__)

def get_all_inventory_items(company_id, user_role,employee_id):
    if user_role == 'super_admin':
        inventory_items = InventoryItem.query.all()
    elif user_role in ['auditor', 'company_owner', 'manager', 'employee']:
        inventory_items = InventoryItem.query.join(Supplier).filter(Supplier.company_id == company_id).all()
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
        'is_active': True  # Assuming all items are active by default
    } for item in inventory_items]

def add_inventory_item(data, company_id, user_role, current_user_id, ip_address, user_agent):
    new_item = InventoryItem(
        name=data['name'],
        description=data.get('description'),
        serial_number=data['serial_number'],
        status=data['status'],
        supplier_id=data['supplier_id']
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
        'supplier_id': str(item.supplier_id)
    }

    item.name = data.get('name', item.name)
    item.description = data.get('description', item.description)
    item.serial_number = data.get('serial_number', item.serial_number)
    item.status = data.get('status', item.status)
    item.supplier_id = data.get('supplier_id', item.supplier_id)
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
        'supplier_id': str(item.supplier_id)
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