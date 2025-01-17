from app import db
from app.models import Task, User
from app.utils.logging_utils import log_action
import uuid
from sqlalchemy.exc import SQLAlchemyError
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

def get_all_tasks(company_id, user_role, employee_id=None):
    try:
        if user_role == 'super_admin':
            tasks = Task.query.all()
        elif user_role == 'auditor':
            tasks = Task.query.filter_by(is_active=True, company_id=company_id).all()
        elif user_role == 'employee':
            tasks = Task.query.filter_by(assigned_to=employee_id).all()
        elif user_role == 'company_owner':
            tasks = Task.query.filter_by(company_id=company_id).all()
        

        return [{
            'id': str(task.id),
            'company_id': str(task.company_id),
            'title': task.title,
            'description': task.description,
            'task_type': task.task_type,
            'priority': task.priority,
            'due_date': task.due_date.isoformat() if task.due_date else None,
            'status': task.status,
            'created_at': task.created_at.isoformat(),
            'updated_at': task.updated_at.isoformat(),
            'completed_at': task.completed_at.isoformat() if task.completed_at else None,
            'notes': task.notes,
            'assigned_to': str(task.assigned_to) if task.assigned_to else None,
            'assigned_to_name': f"{User.query.get(task.assigned_to).first_name} {User.query.get(task.assigned_to).last_name}" if task.assigned_to else None,
            'related_complaint_id': str(task.related_complaint_id) if task.related_complaint_id else None,
            'is_active': task.is_active
        } for task in tasks]
    except Exception as e:
        logger.error(f"Error retrieving tasks: {str(e)}")
        raise

def add_task(data, current_user_id, ip_address, user_agent, company_id):
    try:
        new_task = Task(
            company_id=uuid.UUID(data['company_id']),
            title=data['title'],
            description=data.get('description'),
            task_type=data.get('task_type', 'other'),
            priority=data.get('priority', 'medium'),
            due_date=data.get('due_date'),
            status=data.get('status', 'pending'),
            notes=data.get('notes'),
            assigned_to=uuid.UUID(data['assigned_to']) if data.get('assigned_to') else None,
            related_complaint_id=uuid.UUID(data['related_complaint_id']) if data.get('related_complaint_id') else None,
            is_active=True
        )
        
        db.session.add(new_task)
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
        # Fetch the task based on the user role
        if user_role == 'super_admin':
            task = Task.query.get(id)
        elif user_role == 'auditor':
            task = Task.query.filter_by(id=id, is_active=True, company_id=company_id).first()
        else:  # company_owner or employee
            task = Task.query.filter_by(id=id, company_id=company_id).first()

        if not task:
            logger.warning(f"Task with ID {id} not found or access is restricted.")
            return None

        # Preserve old values for logging
        old_values = {
            'title': task.title,
            'description': task.description,
            'task_type': task.task_type,
            'priority': task.priority,
            'due_date': task.due_date.isoformat() if task.due_date else None,
            'status': task.status,
            'notes': task.notes,
            'assigned_to': str(task.assigned_to) if task.assigned_to else None,
            'related_complaint_id': str(task.related_complaint_id) if task.related_complaint_id else None,
            'is_active': task.is_active,
            'completed_at': task.completed_at.isoformat() if task.completed_at else None
        }

        # Update basic fields with validation
        task.title = data.get('title', task.title).strip() if data.get('title') else task.title
        task.description = data.get('description', task.description).strip() if data.get('description') else task.description

        # Validate and update task type
        valid_task_types = ['bug', 'feature', 'task']
        task_type = data.get('task_type')
        if task_type and task_type not in valid_task_types:
            logger.error(f"Invalid task type provided: {task_type}")
            raise ValueError("Invalid task type provided.")
        task.task_type = task_type or task.task_type

        # Validate and update priority
        valid_priorities = ['low', 'medium', 'high']
        priority = data.get('priority')
        if priority and priority not in valid_priorities:
            logger.error(f"Invalid priority provided: {priority}")
            raise ValueError("Invalid priority provided.")
        task.priority = priority or task.priority

        # Validate and update due date
        if 'due_date' in data:
            try:
                task.due_date = datetime.fromisoformat(data['due_date']) if data['due_date'] else None
            except ValueError:
                logger.error(f"Invalid due date format: {data['due_date']}")
                raise ValueError("Invalid due date format. Use ISO format (YYYY-MM-DD).")

        # Update notes
        task.notes = data.get('notes', task.notes).strip() if data.get('notes') else task.notes

        # Validate and update assigned_to
        if 'assigned_to' in data:
            try:
                task.assigned_to = uuid.UUID(data['assigned_to']) if data['assigned_to'] else None
            except ValueError:
                logger.error(f"Invalid UUID for assigned_to: {data['assigned_to']}")
                raise ValueError("Invalid assigned_to value. Must be a valid UUID.")

        # Validate and update related_complaint_id
        if 'related_complaint_id' in data:
            try:
                task.related_complaint_id = uuid.UUID(data['related_complaint_id']) if data['related_complaint_id'] else None
            except ValueError:
                logger.error(f"Invalid UUID for related_complaint_id: {data['related_complaint_id']}")
                raise ValueError("Invalid related_complaint_id value. Must be a valid UUID.")

        # Update is_active flag
        task.is_active = data.get('is_active', task.is_active)

        # Handle status changes and completed_at logic
        new_status = data.get('status')
        if new_status and new_status != task.status:
            old_status = task.status
            task.status = new_status

            if new_status == 'in_progress' and old_status == 'pending':
                logger.info(f"Task {id} moved from 'pending' to 'in_progress'.")
            elif new_status == 'completed' and old_status == 'in_progress':
                logger.info(f"Task {id} marked as completed.")
                task.completed_at = datetime.now()
            elif new_status != 'completed' and old_status == 'completed':
                logger.info(f"Task {id} reopened from 'completed'.")
                task.completed_at = None

        # Commit the changes to the database
        db.session.commit()

        # Log the action
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
    except ValueError as e:
        print(f"Validation error: {str(e)}")
        logger.error(f"Validation error: {str(e)}")
        raise
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        logger.error(f"Unexpected error: {str(e)}")
        raise

def delete_task(id, company_id, user_role, current_user_id, ip_address, user_agent):
    try:
        if user_role == 'super_admin':
            task = Task.query.get(id)
        elif user_role == 'auditor':
            task = Task.query.filter_by(id=id, is_active=True, company_id=company_id).first()
        else:  # company_owner
            task = Task.query.filter_by(id=id, company_id=company_id).first()

        if not task:
            return False

        old_values = {
            'title': task.title,
            'description': task.description,
            'task_type': task.task_type,
            'priority': task.priority,
            'due_date': task.due_date.isoformat() if task.due_date else None,
            'status': task.status,
            'notes': task.notes,
            'assigned_to': str(task.assigned_to) if task.assigned_to else None,
            'related_complaint_id': str(task.related_complaint_id) if task.related_complaint_id else None,
            'is_active': task.is_active,
            'completed_at': task.completed_at.isoformat() if task.completed_at else None
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