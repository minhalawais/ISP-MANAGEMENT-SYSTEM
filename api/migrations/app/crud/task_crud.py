from app import db
from app.models import Task, TaskAssignee, User, Customer
from app.utils.logging_utils import log_action
import uuid
from sqlalchemy.exc import SQLAlchemyError
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

def get_all_tasks(company_id, user_role, employee_id=None):
    try:
        if user_role == 'super_admin':
            tasks = Task.query.order_by(Task.created_at.desc()).all()
        elif user_role == 'auditor':
            tasks = Task.query.filter_by(is_active=True, company_id=company_id).order_by(Task.created_at.desc()).all()
        elif user_role == 'employee':
            # Get tasks where this employee is assigned
            tasks = Task.query.join(TaskAssignee).filter(
                TaskAssignee.employee_id == employee_id
            ).order_by(Task.created_at.desc()).all()
        elif user_role == 'company_owner':
            tasks = Task.query.filter_by(company_id=company_id).order_by(Task.created_at.desc()).all()
        else:
            tasks = []

        result = []
        for task in tasks:
            # Get assigned employees
            assignees = []
            assignee_ids = []
            for assignee in task.assignees:
                if assignee.employee:
                    assignees.append({
                        'id': str(assignee.employee_id),
                        'name': f"{assignee.employee.first_name} {assignee.employee.last_name}"
                    })
                    assignee_ids.append(str(assignee.employee_id))
            
            # Get customer info
            customer_name = None
            if task.customer:
                customer_name = f"{task.customer.first_name} {task.customer.last_name}"
            
            result.append({
                'id': str(task.id),
                'company_id': str(task.company_id),
                'customer_id': str(task.customer_id) if task.customer_id else None,
                'customer_name': customer_name,
                'task_type': task.task_type,
                'priority': task.priority,
                'due_date': task.due_date.isoformat() if task.due_date else None,
                'status': task.status,
                'notes': task.notes,
                'assignees': assignees,
                'assigned_to': assignee_ids,  # For form compatibility
                'created_at': task.created_at.isoformat() if task.created_at else None,
                'updated_at': task.updated_at.isoformat() if task.updated_at else None,
                'completed_at': task.completed_at.isoformat() if task.completed_at else None,
                'is_active': task.is_active
            })
        
        return result
    except Exception as e:
        logger.error(f"Error retrieving tasks: {str(e)}")
        raise

def add_task(data, current_user_id, ip_address, user_agent, company_id):
    try:
        # Parse due_date from string if provided
        due_date = None
        if data.get('due_date'):
            try:
                due_date = datetime.fromisoformat(data['due_date'].replace('Z', '+00:00'))
            except ValueError:
                due_date = datetime.strptime(data['due_date'], '%Y-%m-%dT%H:%M')
        
        new_task = Task(
            company_id=uuid.UUID(company_id),
            customer_id=uuid.UUID(data['customer_id']) if data.get('customer_id') else None,
            task_type=data.get('task_type', 'maintenance'),
            priority=data.get('priority', 'medium'),
            due_date=due_date,
            status=data.get('status', 'pending'),
            notes=data.get('notes'),
            is_active=True
        )
        
        db.session.add(new_task)
        db.session.flush()  # Get the task ID
        
        # Add assignees (multiple employees)
        assigned_to = data.get('assigned_to', [])
        if isinstance(assigned_to, str):
            assigned_to = [assigned_to] if assigned_to else []
        
        for employee_id in assigned_to:
            if employee_id:
                assignee = TaskAssignee(
                    task_id=new_task.id,
                    employee_id=uuid.UUID(employee_id)
                )
                db.session.add(assignee)
        
        db.session.commit()

        log_action(
            current_user_id,
            'CREATE',
            'tasks',
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
        logger.error(f"Error adding task: {str(e)}")
        raise

def update_task(id, data, company_id, user_role, current_user_id, ip_address, user_agent):
    try:
        # Fetch the task based on user role
        if user_role == 'super_admin':
            task = Task.query.get(id)
        elif user_role == 'auditor':
            task = Task.query.filter_by(id=id, is_active=True, company_id=company_id).first()
        else:
            task = Task.query.filter_by(id=id, company_id=company_id).first()

        if not task:
            logger.warning(f"Task with ID {id} not found or access is restricted.")
            return None

        # Preserve old values for logging
        old_values = {
            'task_type': task.task_type,
            'priority': task.priority,
            'due_date': task.due_date.isoformat() if task.due_date else None,
            'status': task.status,
            'notes': task.notes,
            'customer_id': str(task.customer_id) if task.customer_id else None,
            'is_active': task.is_active
        }

        # Update fields
        if 'task_type' in data:
            task.task_type = data['task_type']
        
        if 'priority' in data:
            task.priority = data['priority']
        
        if 'due_date' in data:
            if data['due_date']:
                try:
                    task.due_date = datetime.fromisoformat(data['due_date'].replace('Z', '+00:00'))
                except ValueError:
                    task.due_date = datetime.strptime(data['due_date'], '%Y-%m-%dT%H:%M')
            else:
                task.due_date = None
        
        if 'notes' in data:
            task.notes = data.get('notes', '').strip() if data.get('notes') else None
        
        if 'customer_id' in data:
            task.customer_id = uuid.UUID(data['customer_id']) if data['customer_id'] else None
        
        if 'is_active' in data:
            task.is_active = data['is_active']

        # Handle status changes
        if 'status' in data:
            new_status = data['status']
            if new_status != task.status:
                task.status = new_status
                if new_status == 'completed':
                    task.completed_at = datetime.now()
                elif task.status == 'completed':
                    task.completed_at = None

        # Handle assignees (multiple employees)
        if 'assigned_to' in data:
            # Remove existing assignees
            TaskAssignee.query.filter_by(task_id=task.id).delete()
            
            assigned_to = data.get('assigned_to', [])
            if isinstance(assigned_to, str):
                assigned_to = [assigned_to] if assigned_to else []
            
            for employee_id in assigned_to:
                if employee_id:
                    assignee = TaskAssignee(
                        task_id=task.id,
                        employee_id=uuid.UUID(employee_id)
                    )
                    db.session.add(assignee)

        db.session.commit()

        log_action(
            current_user_id,
            'UPDATE',
            'tasks',
            task.id,
            old_values,
            data,
            ip_address,
            user_agent,
            company_id
        )

        return task

    except SQLAlchemyError as e:
        logger.error(f"Database error: {str(e)}")
        db.session.rollback()
        raise
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        raise

def delete_task(id, company_id, user_role, current_user_id, ip_address, user_agent):
    try:
        if user_role == 'super_admin':
            task = Task.query.get(id)
        elif user_role == 'auditor':
            task = Task.query.filter_by(id=id, is_active=True, company_id=company_id).first()
        else:
            task = Task.query.filter_by(id=id, company_id=company_id).first()

        if not task:
            return False

        old_values = {
            'task_type': task.task_type,
            'priority': task.priority,
            'due_date': task.due_date.isoformat() if task.due_date else None,
            'status': task.status,
            'notes': task.notes,
            'is_active': task.is_active
        }

        db.session.delete(task)
        db.session.commit()

        log_action(
            current_user_id,
            'DELETE',
            'tasks',
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
        logger.error(f"Error deleting task: {str(e)}")
        raise