from app import db
from app.models import Complaint, Customer, User
import uuid
from sqlalchemy.exc import SQLAlchemyError
import logging
from sqlalchemy import and_
from datetime import datetime
logger = logging.getLogger(__name__)

def get_all_complaints(company_id, user_role, employee_id=None):
    try:
        if user_role == 'super_admin':
            complaints = Complaint.query.all()
        elif user_role == 'auditor':
            complaints = Complaint.query.join(Customer).filter(
                and_(Complaint.is_active == True, Customer.company_id == company_id)
            ).all()
        elif user_role == 'company_owner':
            complaints = Complaint.query.join(Customer).filter(Customer.company_id == company_id).all()
        elif user_role == 'employee':
            complaints = Complaint.query.filter(Complaint.assigned_to == employee_id).all()
        result = []
        for complaint in complaints:
            customer = Customer.query.get(complaint.customer_id)
            assigned_user = User.query.get(complaint.assigned_to)
            result.append({
                'id': str(complaint.id),
                'customer_name': f"{customer.first_name} {customer.last_name}" if customer else "Unknown",
                'customer_id': str(customer.id) if customer else None,
                'title': complaint.title,
                'description': complaint.description,
                'status': complaint.status,
                'priority': complaint.priority,
                'response_due_date': complaint.response_due_date.isoformat() if complaint.response_due_date else None,
                'attachment_path': complaint.attachment_path,
                'feedback_comments': complaint.feedback_comments,
                'assigned_to': str(assigned_user.id) if assigned_user else None,
                'assigned_to_name': f"{assigned_user.first_name} {assigned_user.last_name}" if assigned_user else "Unassigned",
                'created_at': complaint.created_at.isoformat(),
                'is_active': complaint.is_active,
                'category': complaint.category
            })
        return result
    except SQLAlchemyError as e:
        logger.error(f"Error getting all complaints: {e}")
        return []

def add_complaint(data, company_id, user_role, current_user_id, ip_address, user_agent):
    try:
        new_complaint = Complaint(
            customer_id=uuid.UUID(data['customer_id']),
            title=data['title'],
            description=data['description'],
            status='open',
            priority=data.get('priority', 'medium'),
            response_due_date=data.get('response_due_date'),
            attachment_path=data.get('attachment_path'),
            assigned_to=uuid.UUID(data['assigned_to']) if data.get('assigned_to') else None,
            category=data.get('category')
        )
        db.session.add(new_complaint)
        db.session.commit()
        return new_complaint
    except SQLAlchemyError as e:
        print('Error:', e)
        logger.error(f"Error adding complaint: {e}")
        db.session.rollback()
        return None

def update_complaint(id, data, company_id, user_role, current_user_id=None):
    try:
        # Check if required fields are present for updating the complaint
        if not data:
            return {"error": "No data provided for update."}

        # Validate that ID is a UUID if necessary
        try:
            complaint_id = uuid.UUID(id)
        except ValueError:
            return {"error": "Invalid complaint ID format."}
        
        # Fetch complaint based on user role and permissions
        if user_role == 'super_admin':
            complaint = Complaint.query.get(complaint_id)
        elif user_role == 'auditor':
            complaint = Complaint.query.join(Customer).filter(
                and_(Complaint.id == complaint_id, Complaint.is_active == True, Customer.company_id == company_id)
            ).first()
        elif user_role == 'company_owner':
            complaint = Complaint.query.join(Customer).filter(
                Complaint.id == complaint_id, Customer.company_id == company_id
            ).first()
        elif user_role == 'employee':
            complaint = Complaint.query.filter(
                and_(Complaint.id == complaint_id, Complaint.assigned_to == uuid.UUID(current_user_id))
            ).first()
        
        if not complaint:
            return {"error": "Complaint not found or insufficient permissions."}

        # Validate and update fields
        complaint.title = data.get('title', complaint.title)
        complaint.description = data.get('description', complaint.description)
        complaint.status = data.get('status', complaint.status)
        complaint.priority = data.get('priority', complaint.priority)

        # Handle date fields and validate if required
        response_due_date = data.get('response_due_date')
        if response_due_date:
            try:
                complaint.response_due_date = datetime.strptime(response_due_date, '%Y-%m-%d')
            except ValueError:
                return {"error": "Invalid date format for response_due_date. Use 'YYYY-MM-DD'."}

        complaint.attachment_path = data.get('attachment_path', complaint.attachment_path)
        complaint.feedback_comments = data.get('feedback_comments', complaint.feedback_comments)

        # Validate and update UUIDs
        assigned_to = data.get('assigned_to')
        if assigned_to:
            try:
                complaint.assigned_to = uuid.UUID(assigned_to)
            except ValueError:
                return {"error": "Invalid UUID format for assigned_to."}
        
        customer_id = data.get('customer_id')
        if customer_id:
            try:
                complaint.customer_id = uuid.UUID(customer_id)
            except ValueError:
                return {"error": "Invalid UUID format for customer_id."}
        
        complaint.is_active = data.get('is_active', complaint.is_active)

        # Handle status-specific updates
        if data.get('status') == 'in_progress':
            complaint.resolution_attempts += 1

        if data.get('status') == 'resolved':
            complaint.resolved_at = datetime.utcnow()
            resolution_proof = data.get('resolution_proof')
            if resolution_proof:
                complaint.resolution_proof = resolution_proof

        # Commit changes to the database
        db.session.commit()
        return complaint

    except SQLAlchemyError as e:
        db.session.rollback()
        logger.error(f"SQLAlchemy error updating complaint: {e}")
        return {"error": "Database error occurred."}
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        return {"error": "An unexpected error occurred."}


def delete_complaint(id, company_id, user_role):
    try:
        if user_role == 'super_admin':
            complaint = Complaint.query.get(id)
        elif user_role == 'auditor':
            complaint = Complaint.query.join(Customer).filter(
                and_(Complaint.id == id, Complaint.is_active == True, Customer.company_id == company_id)
            ).first()
        elif user_role == 'company_owner':
            complaint = Complaint.query.join(Customer).filter(
                Complaint.id == id, Customer.company_id == company_id
            ).first()
        
        if not complaint:
            return False
        db.session.delete(complaint)
        db.session.commit()
        return True
    except SQLAlchemyError as e:
        logger.error(f"Error deleting complaint: {e}")
        db.session.rollback()
        return False
