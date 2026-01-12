from app import db
from app.models import RecoveryTask, Invoice, User
from app.utils.logging_utils import log_action
import uuid
from sqlalchemy.exc import SQLAlchemyError
import logging

logger = logging.getLogger(__name__)

def get_all_recovery_tasks(company_id, user_role, employee_id):
    """Get all recovery tasks based on user role"""
    try:
        if user_role == 'super_admin':
            recovery_tasks = RecoveryTask.query.order_by(RecoveryTask.created_at.desc()).all()
        elif user_role == 'auditor':
            recovery_tasks = RecoveryTask.query.filter_by(company_id=company_id).order_by(RecoveryTask.created_at.desc()).all()
        elif user_role == 'company_owner':
            recovery_tasks = RecoveryTask.query.filter_by(company_id=company_id).order_by(RecoveryTask.created_at.desc()).all()
        elif user_role == 'employee':
            recovery_tasks = RecoveryTask.query.filter_by(assigned_to=employee_id).order_by(RecoveryTask.created_at.desc()).all()
        else:
            recovery_tasks = []

        result = []
        for task in recovery_tasks:
            # Get invoice info
            invoice = Invoice.query.get(task.invoice_id)
            invoice_number = invoice.invoice_number if invoice else None
            customer_name = None
            customer_internet_id = None
            total_amount = None
            
            if invoice and invoice.customer:
                customer_name = f"{invoice.customer.first_name} {invoice.customer.last_name}"
                customer_internet_id = invoice.customer.internet_id
                total_amount = float(invoice.total_amount) if invoice.total_amount else None
            
            # Get employee info
            employee = User.query.get(task.assigned_to)
            assigned_to_name = f"{employee.first_name} {employee.last_name}" if employee else None
            
            result.append({
                'id': str(task.id),
                'company_id': str(task.company_id),
                'invoice_id': str(task.invoice_id),
                'invoice_number': invoice_number,
                'customer_name': customer_name,
                'customer_internet_id': customer_internet_id,
                'total_amount': total_amount,
                'assigned_to': str(task.assigned_to),
                'assigned_to_name': assigned_to_name,
                'status': task.status,
                'notes': task.notes,
                'created_at': task.created_at.isoformat() if task.created_at else None,
                'updated_at': task.updated_at.isoformat() if task.updated_at else None
            })
        
        return result
    except Exception as e:
        logger.error(f"Error retrieving recovery tasks: {str(e)}")
        raise

def add_recovery_task(data, current_user_id, ip_address, user_agent, company_id):
    """Add a new recovery task - assign an invoice to an employee for recovery"""
    try:
        new_task = RecoveryTask(
            company_id=uuid.UUID(company_id),
            invoice_id=uuid.UUID(data['invoice_id']),
            assigned_to=uuid.UUID(data['assigned_to']),
            status=data.get('status', 'pending'),
            notes=data.get('notes')
        )
        db.session.add(new_task)
        db.session.commit()

        log_action(
            current_user_id,
            'CREATE',
            'recovery_tasks',
            new_task.id,
            None,
            data,
            ip_address,
            user_agent,
            company_id
        )

        return new_task
    except SQLAlchemyError as e:
        logger.error(f"Database error: {str(e)}")
        db.session.rollback()
        raise
    except Exception as e:
        logger.error(f"Error adding recovery task: {str(e)}")
        raise

def update_recovery_task(id, data, company_id, user_role, current_user_id, ip_address, user_agent):
    """Update a recovery task"""
    try:
        task_id = uuid.UUID(str(id))
        
        if user_role == 'super_admin':
            task = RecoveryTask.query.get(task_id)
        elif user_role in ['company_owner', 'employee']:
            task = RecoveryTask.query.filter_by(id=task_id, company_id=company_id).first()
        else:
            task = None

        if not task:
            logger.warning(f"Recovery task not found: {task_id}")
            return None

        old_values = {
            'invoice_id': str(task.invoice_id),
            'assigned_to': str(task.assigned_to),
            'status': task.status,
            'notes': task.notes
        }

        # Update fields
        if 'invoice_id' in data and data['invoice_id']:
            task.invoice_id = uuid.UUID(str(data['invoice_id']))

        if 'assigned_to' in data and data['assigned_to']:
            task.assigned_to = uuid.UUID(str(data['assigned_to']))

        if 'status' in data:
            if data['status'] in ['pending', 'in_progress', 'completed', 'cancelled']:
                task.status = data['status']

        if 'notes' in data:
            task.notes = data.get('notes')

        db.session.commit()

        log_action(
            current_user_id,
            'UPDATE',
            'recovery_tasks',
            task.id,
            old_values,
            data,
            ip_address,
            user_agent,
            company_id
        )

        return task

    except SQLAlchemyError as e:
        logger.error(f"Database error while updating recovery task: {str(e)}")
        db.session.rollback()
        raise
    except Exception as e:
        logger.error(f"Unexpected error while updating recovery task: {str(e)}")
        db.session.rollback()
        raise

def delete_recovery_task(id, company_id, user_role, current_user_id, ip_address, user_agent):
    """Delete a recovery task"""
    try:
        if user_role == 'super_admin':
            task = RecoveryTask.query.get(id)
        else:
            task = RecoveryTask.query.filter_by(id=id, company_id=company_id).first()

        if not task:
            return False

        old_values = {
            'invoice_id': str(task.invoice_id),
            'assigned_to': str(task.assigned_to),
            'status': task.status,
            'notes': task.notes
        }

        db.session.delete(task)
        db.session.commit()

        log_action(
            current_user_id,
            'DELETE',
            'recovery_tasks',
            task.id,
            old_values,
            None,
            ip_address,
            user_agent,
            company_id
        )

        return True
    except SQLAlchemyError as e:
        logger.error(f"Database error: {str(e)}")
        db.session.rollback()
        raise
    except Exception as e:
        logger.error(f"Error deleting recovery task: {str(e)}")
        raise
