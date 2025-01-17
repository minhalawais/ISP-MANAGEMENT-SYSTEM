from app import db
from app.models import RecoveryTask, Invoice, User
from app.utils.logging_utils import log_action
import uuid
from sqlalchemy.exc import SQLAlchemyError
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

def get_all_recovery_tasks(company_id, user_role, employee_id):
    try:
        if user_role == 'super_admin':
            recovery_tasks = RecoveryTask.query.all()
        elif user_role == 'auditor':
            recovery_tasks = RecoveryTask.query.filter_by(is_active=True, company_id=company_id).all()
        elif user_role == 'company_owner':
            recovery_tasks = RecoveryTask.query.filter_by(company_id=company_id).all()
        elif user_role == 'employee':
            recovery_tasks = RecoveryTask.query.filter_by(assigned_to=employee_id).all()

        return [
            {
                'id': str(task.id),
                'company_id': str(task.company_id),
                'invoice_id': str(task.invoice_id),
                'invoice_number': Invoice.query.get(task.invoice_id).invoice_number if Invoice.query.get(task.invoice_id) else None,
                'assigned_to': str(task.assigned_to),
                'assigned_to_name': f"{User.query.get(task.assigned_to).first_name} {User.query.get(task.assigned_to).last_name}" if User.query.get(task.assigned_to) else None,
                'recovery_type': task.recovery_type,
                'status': task.status,
                'notes': task.notes,
                'attempts_count': task.attempts_count,
                'last_attempt_date': task.last_attempt_date.isoformat() if task.last_attempt_date else None,
                'recovered_amount': float(task.recovered_amount) if task.recovered_amount else None,
                'reason': task.reason,
                'created_at': task.created_at.isoformat(),
                'updated_at': task.updated_at.isoformat(),
                'is_active': task.is_active
            } for task in recovery_tasks
        ]
    except Exception as e:
        logger.error(f"Error retrieving recovery tasks: {str(e)}")
        raise

def add_recovery_task(data, current_user_id, ip_address, user_agent, company_id):
    try:
        new_task = RecoveryTask(
            company_id=uuid.UUID(data['company_id']),
            invoice_id=uuid.UUID(data['invoice_id']),
            assigned_to=uuid.UUID(data['assigned_to']),
            recovery_type=data['recovery_type'],
            status=data['status'],
            notes=data.get('notes'),
            attempts_count=data.get('attempts_count', 0),
            last_attempt_date=datetime.fromisoformat(data['last_attempt_date']) if data.get('last_attempt_date') else None,
            recovered_amount=data.get('recovered_amount'),
            reason=data.get('reason'),
            is_active=data.get('is_active', True)
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
    try:
        # Validate and convert id to UUID
        try:
            task_id = uuid.UUID(str(id))
        except ValueError:
            logger.error(f"Invalid task ID: {id}")
            return None

        # Query the task based on user role
        if user_role == 'super_admin':
            task = RecoveryTask.query.get(task_id)
        elif user_role == 'auditor':
            task = RecoveryTask.query.filter_by(id=task_id, is_active=True, company_id=company_id).first()
        else:  # company_owner or employee
            task = RecoveryTask.query.filter_by(id=task_id, company_id=company_id).first()

        if not task:
            logger.warning(f"Recovery task not found: {task_id}")
            return None

        # Store old values for logging
        old_values = {
            'invoice_id': str(task.invoice_id),
            'assigned_to': str(task.assigned_to),
            'recovery_type': task.recovery_type,
            'status': task.status,
            'notes': task.notes,
            'attempts_count': task.attempts_count,
            'last_attempt_date': task.last_attempt_date.isoformat() if task.last_attempt_date else None,
            'recovered_amount': float(task.recovered_amount) if task.recovered_amount else None,
            'reason': task.reason,
            'is_active': task.is_active
        }

        # Update fields with proper validation
        if 'invoice_id' in data:
            try:
                task.invoice_id = uuid.UUID(str(data['invoice_id']))
            except ValueError:
                logger.error(f"Invalid invoice ID: {data['invoice_id']}")
                raise ValueError("Invalid invoice ID provided")

        if 'assigned_to' in data:
            try:
                task.assigned_to = uuid.UUID(str(data['assigned_to']))
            except ValueError:
                logger.error(f"Invalid assigned_to ID: {data['assigned_to']}")
                raise ValueError("Invalid assigned_to ID provided")

        if 'recovery_type' in data:
            if data['recovery_type'] in ['phone', 'email', 'in_person', 'legal']:
                task.recovery_type = data['recovery_type']
            else:
                logger.error(f"Invalid recovery type: {data['recovery_type']}")
                raise ValueError("Invalid recovery type provided")

        if 'status' in data:
            new_status = data['status']
            if new_status in ['pending', 'in_progress', 'completed', 'cancelled']:
                if new_status != task.status:
                    if new_status == 'in_progress' and task.status == 'pending':
                        task.attempts_count += 1
                        task.last_attempt_date = datetime.utcnow()
                    task.status = new_status
            else:
                logger.error(f"Invalid status: {new_status}")
                raise ValueError("Invalid status provided")

        if 'notes' in data:
            task.notes = str(data['notes'])[:500]  # Limit notes to 500 characters

        if 'attempts_count' in data:
            try:
                task.attempts_count = int(data['attempts_count'])
                if task.attempts_count < 0:
                    raise ValueError
            except ValueError:
                logger.error(f"Invalid attempts count: {data['attempts_count']}")
                raise ValueError("Invalid attempts count provided")

        if 'last_attempt_date' in data:
            try:
                task.last_attempt_date = datetime.fromisoformat(data['last_attempt_date'])
            except ValueError:
                logger.error(f"Invalid last attempt date: {data['last_attempt_date']}")
                raise ValueError("Invalid last attempt date provided")

        if 'recovered_amount' in data:
            try:
                task.recovered_amount = Decimal(str(data['recovered_amount']))
                if task.recovered_amount < 0:
                    raise ValueError
            except (InvalidOperation, ValueError):
                logger.error(f"Invalid recovered amount: {data['recovered_amount']}")
                raise ValueError("Invalid recovered amount provided")

        if 'reason' in data:
            task.reason = str(data['reason'])[:200]  # Limit reason to 200 characters

        if 'is_active' in data:
            task.is_active = bool(data['is_active'])

        db.session.commit()

        # Log the action
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

    except ValueError as e:
        logger.error(f"Validation error while updating recovery task: {str(e)}")
        db.session.rollback()
        raise

    except Exception as e:
        logger.error(f"Unexpected error while updating recovery task: {str(e)}")
        db.session.rollback()
        raise

def delete_recovery_task(id, company_id, user_role, current_user_id, ip_address, user_agent):
    try:
        if user_role == 'super_admin':
            task = RecoveryTask.query.get(id)
        elif user_role == 'auditor':
            task = RecoveryTask.query.filter_by(id=id, is_active=True, company_id=company_id).first()
        else:  # company_owner
            task = RecoveryTask.query.filter_by(id=id, company_id=company_id).first()

        if not task:
            return False

        old_values = {
            'invoice_id': str(task.invoice_id),
            'assigned_to': str(task.assigned_to),
            'status': task.status,
            'notes': task.notes,
            'is_active': task.is_active
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

