# dashboard_crud.py

from sqlalchemy import func
from datetime import datetime, timedelta
from ...models import User, Complaint, Task, InventoryAssignment, InventoryTransaction
from ... import db
from flask_jwt_extended import get_jwt_identity
import logging

logger = logging.getLogger(__name__)

def get_employee_id():
    return get_jwt_identity()

def get_open_complaints_count(employee_id):
    try:
        return Complaint.query.filter_by(status='open', assigned_to=employee_id).count()
    except Exception as e:
        logger.error(f"Error getting open complaints count: {e}")
        return 0

def get_pending_tasks_count(employee_id):
    try:
        return Task.query.filter_by(status='pending', assigned_to=employee_id).count()
    except Exception as e:
        logger.error(f"Error getting pending tasks count: {e}")
        return 0

def get_assigned_inventory_count(employee_id):
    try:
        return InventoryAssignment.query.filter_by(assigned_to_employee_id=employee_id, status='assigned').count()
    except Exception as e:
        logger.error(f"Error getting assigned inventory count: {e}")
        return 0

def get_inventory_transactions_count(employee_id):
    try:
        return InventoryTransaction.query.filter_by(performed_by_id=employee_id).count()
    except Exception as e:
        logger.error(f"Error getting inventory transactions count: {e}")
        return 0

def get_recent_complaints(employee_id, limit=3):
    try:
        complaints = Complaint.query.filter_by(assigned_to=employee_id).order_by(Complaint.created_at.desc()).limit(limit).all()
        return [{
            'id': str(c.id),
            'description': c.description,  # Changed 'title' to 'description'
            'customer': f"{c.customer.first_name} {c.customer.last_name}",
            'status': c.status
        } for c in complaints]
    except Exception as e:
        logger.error(f"Error getting recent complaints: {e}")
        return []

def get_pending_tasks(employee_id, limit=3):
    try:
        tasks = Task.query.filter_by(status='pending', assigned_to=employee_id).order_by(Task.due_date.asc()).limit(limit).all()
        return [{
            'id': str(t.id),
            'title': t.title,
            'dueDate': t.due_date.strftime('%Y-%m-%d')
        } for t in tasks]
    except Exception as e:
        logger.error(f"Error getting pending tasks: {e}")
        return []

def get_recent_inventory_transactions(employee_id, limit=3):
    try:
        transactions = InventoryTransaction.query.filter_by(performed_by_id=employee_id).order_by(InventoryTransaction.performed_at.desc()).limit(limit).all()
        return [{
            'id': str(t.id),
            'itemName': t.inventory_item.name,
            'transactionType': t.transaction_type,
            'performedAt': t.performed_at.strftime('%Y-%m-%d %H:%M:%S')
        } for t in transactions]
    except Exception as e:
        logger.error(f"Error getting recent inventory transactions: {e}")
        return []