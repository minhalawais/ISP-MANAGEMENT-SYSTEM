import random
import string
from app import db
from app.models import Complaint, Customer, User
import uuid
from sqlalchemy.exc import SQLAlchemyError
import logging
from sqlalchemy import and_
from datetime import datetime
from sqlalchemy import func
from app.crud import employee_ledger_crud
from app.utils.logging_utils import log_action

logger = logging.getLogger(__name__)

def get_all_complaints(company_id, user_role, employee_id=None):
    try:
        if user_role == 'super_admin':
            complaints = Complaint.query.order_by(Complaint.created_at.desc()).all()
        elif user_role == 'auditor':
            complaints = Complaint.query.join(Customer).filter(
                and_(Complaint.is_active == True, Customer.company_id == company_id)
            ).order_by(Complaint.created_at.desc()).all()
        elif user_role == 'company_owner':
            complaints = Complaint.query.join(Customer).filter(Customer.company_id == company_id).order_by(Complaint.created_at.desc()).all()
        elif user_role == 'employee':
            complaints = Complaint.query.filter(Complaint.assigned_to == employee_id).order_by(Complaint.created_at.desc()).all()
        result = []
        for complaint in complaints:
            customer = Customer.query.get(complaint.customer_id)
            assigned_user = User.query.get(complaint.assigned_to)
            result.append({
                'id': str(complaint.id),
                'internet_id': customer.internet_id,
                'customer_name': f"{customer.first_name} {customer.last_name}" if customer else "Unknown",
                'phone_number': customer.phone_1,
                'customer_id': str(customer.id) if customer else None,
                'description': complaint.description,
                'status': complaint.status,
                'response_due_date': complaint.response_due_date.isoformat() if complaint.response_due_date else None,
                'attachment_path': complaint.attachment_path,
                'feedback_comments': complaint.feedback_comments,
                'assigned_to': str(assigned_user.id) if assigned_user else None,
                'assigned_to_name': f"{assigned_user.first_name} {assigned_user.last_name}" if assigned_user else "Unassigned",
                'created_at': complaint.created_at.isoformat(),
                'is_active': complaint.is_active,
                'ticket_number': complaint.ticket_number,
                'remarks': complaint.remarks,
            })
        return result
    except SQLAlchemyError as e:
        logger.error(f"Error getting all complaints: {e}")
        return []

def add_complaint(data, company_id, user_role, current_user_id, ip_address, user_agent):
    try:
        # Generate ticket numbe
        new_complaint = Complaint(
            customer_id=uuid.UUID(data['customer_id']),
            description=data['description'],
            status='open',
            response_due_date=data.get('response_due_date'),
            attachment_path=data.get('attachment_path'),
            assigned_to=uuid.UUID(data['assigned_to']) if data.get('assigned_to') else None,
            ticket_number=data.get('ticket_number'),
            remarks=data.get('remarks'),
        )
        db.session.add(new_complaint)
        db.session.commit()
        
        # Audit log
        customer = Customer.query.get(new_complaint.customer_id)
        log_action(
            current_user_id,
            'CREATE',
            'complaints',
            new_complaint.id,
            None,
            {'customer_id': str(new_complaint.customer_id), 'status': 'open', 'ticket_number': data.get('ticket_number')},
            ip_address,
            user_agent,
            str(customer.company_id) if customer else company_id
        )
        
        return new_complaint, data.get('ticket_number')
    except SQLAlchemyError as e:
        print('Error:', e)
        logger.error(f"Error adding complaint: {e}")
        db.session.rollback()
        return None, None

def generate_ticket_number(customer_id):
    # Get the current date
    now = datetime.now()
    date_part = now.strftime("%y%m%d")  # Format as YYMMDD

    # Extract the last 3 digits of the customer ID
    customer_id_part = str(customer_id)[-3:]

    # Query the database to count how many complaints the customer has made today
    complaint_count = (
        db.session.query(func.count(Complaint.id))
        .filter(Complaint.customer_id == customer_id)
        .filter(func.date(Complaint.created_at) == now.date())
        .scalar()
    )

    # Add 1 to the count to get the sequence number for the new complaint
    sequence_number = complaint_count + 1

    # Combine the parts to create the ticket number
    ticket_number = f"TKT-{date_part}-{customer_id_part}-{sequence_number:02d}"

    return ticket_number

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
        complaint.description = data.get('description', complaint.description)
        complaint.status = data.get('status', complaint.status)

        # Handle date fields and validate if required
        response_due_date = data.get('response_due_date')
        if response_due_date:
            try:
                complaint.response_due_date = datetime.strptime(response_due_date, '%Y-%m-%d')
            except ValueError:
                return {"error": "Invalid date format for response_due_date. Use 'YYYY-MM-DD'."}

        complaint.attachment_path = data.get('attachment_path', complaint.attachment_path)
        complaint.feedback_comments = data.get('feedback_comments', complaint.feedback_comments)
        complaint.remarks = data.get('remarks', complaint.remarks)

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
            
            # Trigger complaint commission for assigned employee
            if complaint.assigned_to:
                try:
                    assigned_employee = User.query.get(complaint.assigned_to)
                    if assigned_employee and assigned_employee.commission_amount_per_complaint:
                        commission_amount = float(assigned_employee.commission_amount_per_complaint)
                        if commission_amount > 0:
                            # Get company_id from customer
                            customer = Customer.query.get(complaint.customer_id)
                            if customer:
                                employee_ledger_crud.add_ledger_entry(
                                    employee_id=complaint.assigned_to,
                                    transaction_type='complaint_commission',
                                    amount=commission_amount,
                                    description=f'Commission for resolving complaint #{complaint.ticket_number}',
                                    company_id=customer.company_id,
                                    reference_id=complaint.id
                                )
                                logger.info(f"Added complaint commission of {commission_amount} for employee {complaint.assigned_to}")
                except Exception as commission_error:
                    logger.error(f"Error adding complaint commission: {commission_error}")
                    # Don't fail the complaint update if commission fails

        # Commit changes to the database
        db.session.commit()
        
        # Audit log (using dummy values for ip/user_agent since not passed)
        customer = Customer.query.get(complaint.customer_id)
        log_action(
            current_user_id,
            'UPDATE',
            'complaints',
            complaint.id,
            None,
            {'status': complaint.status, 'changes': list(data.keys())},
            'N/A',
            'N/A',
            str(customer.company_id) if customer else company_id
        )
        
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
        
        # Get company_id for logging
        customer = Customer.query.get(complaint.customer_id)
        complaint_id = complaint.id
        
        db.session.delete(complaint)
        db.session.commit()
        
        # Audit log
        log_action(
            None,  # No current_user_id available
            'DELETE',
            'complaints',
            complaint_id,
            {'ticket_number': complaint.ticket_number if hasattr(complaint, 'ticket_number') else None},
            None,
            'N/A',
            'N/A',
            str(customer.company_id) if customer else company_id
        )
        
        return True
    except SQLAlchemyError as e:
        logger.error(f"Error deleting complaint: {e}")
        db.session.rollback()
        return False
    

def get_complaint_attachment(id, company_id):
    try:
        complaint = Complaint.query.join(Customer).filter(
            and_(Complaint.id == id, Customer.company_id == company_id)
        ).first()
        return complaint
    except Exception as e:
        print(f"Error getting complaint attachment: {e}")
        return None
def get_complaint_by_id(id, company_id, user_role, current_user_id=None):
    """
    Fetch a single complaint by ID with appropriate permission checks based on user role.
    
    Args:
        id: The ID of the complaint to retrieve
        company_id: The company ID of the current user
        user_role: The role of the current user
        current_user_id: The ID of the current user (required for employee role)
        
    Returns:
        A dictionary containing the complaint details or None if not found/no permission
    """
    try:
        # Validate that ID is a UUID
        try:
            complaint_id = uuid.UUID(id)
        except ValueError:
            logger.error(f"Invalid complaint ID format: {id}")
            return None
        
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
            if not current_user_id:
                logger.error("Employee role requires current_user_id")
                return None
                
            complaint = Complaint.query.filter(
                and_(Complaint.id == complaint_id, Complaint.assigned_to == uuid.UUID(current_user_id))
            ).first()
        else:
            # Unknown role
            logger.error(f"Unknown user role: {user_role}")
            return None
        
        if not complaint:
            logger.info(f"Complaint not found or insufficient permissions: {id}")
            return None
        
        # Get customer and assigned user details
        customer = Customer.query.get(complaint.customer_id)
        assigned_user = User.query.get(complaint.assigned_to) if complaint.assigned_to else None
        
        # Format the response
        result = {
            'id': str(complaint.id),
            'customer_id': str(complaint.customer_id),
            'customer_name': f"{customer.first_name} {customer.last_name}" if customer else "Unknown",
            'internet_id': customer.internet_id if customer else None,
            'phone_number': customer.phone_1 if customer else None,
            'description': complaint.description,
            'status': complaint.status,
            'assigned_to': str(complaint.assigned_to) if complaint.assigned_to else None,
            'assigned_to_name': f"{assigned_user.first_name} {assigned_user.last_name}" if assigned_user else None,
            'created_at': complaint.created_at.isoformat(),
            'updated_at': complaint.updated_at.isoformat(),
            'resolved_at': complaint.resolved_at.isoformat() if complaint.resolved_at else None,
            'response_due_date': complaint.response_due_date.isoformat() if complaint.response_due_date else None,
            'satisfaction_rating': complaint.satisfaction_rating,
            'resolution_attempts': complaint.resolution_attempts,
            'attachment_path': complaint.attachment_path,
            'feedback_comments': complaint.feedback_comments,
            'is_active': complaint.is_active,
            'resolution_proof': complaint.resolution_proof,
            'ticket_number': complaint.ticket_number,
            'remarks': complaint.remarks
        }
        
        return result
        
    except SQLAlchemyError as e:
        logger.error(f"Database error getting complaint detail: {e}")
        return None
    except Exception as e:
        logger.error(f"Unexpected error getting complaint detail: {e}")
        return None


def get_resolution_proof_path(id, company_id):
    """
    Get the file path for a complaint's resolution proof.
    
    Args:
        id: The ID of the complaint
        company_id: The company ID for permission checking
        
    Returns:
        The file path to the resolution proof or None if not found
    """
    try:
        complaint = Complaint.query.join(Customer).filter(
            and_(Complaint.id == id, Customer.company_id == company_id)
        ).first()
        
        if complaint and complaint.resolution_proof:
            resolution_path = os.path.join(os.getcwd(), complaint.resolution_proof)
            if os.path.exists(resolution_path):
                return resolution_path
        
        return None
    except Exception as e:
        logger.error(f"Error getting resolution proof: {e}")
        return None


def update_complaint_remarks(id, remarks, company_id, user_role, current_user_id=None):
    """
    Update only the remarks field of a complaint.
    
    Args:
        id: The ID of the complaint to update
        remarks: The new remarks text
        company_id: The company ID of the current user
        user_role: The role of the current user
        current_user_id: The ID of the current user (required for employee role)
        
    Returns:
        The updated complaint object or an error dictionary
    """
    try:
        # Validate that ID is a UUID
        try:
            complaint_id = uuid.UUID(id)
        except ValueError:
            logger.error(f"Invalid complaint ID format: {id}")
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
            if not current_user_id:
                logger.error("Employee role requires current_user_id")
                return {"error": "Employee ID is required for this operation."}
                
            complaint = Complaint.query.filter(
                and_(Complaint.id == complaint_id, Complaint.assigned_to == uuid.UUID(current_user_id))
            ).first()
        else:
            # Unknown role
            logger.error(f"Unknown user role: {user_role}")
            return {"error": "Unknown user role."}
        
        if not complaint:
            logger.info(f"Complaint not found or insufficient permissions: {id}")
            return {"error": "Complaint not found or insufficient permissions."}
        
        # Update only the remarks field
        complaint.remarks = remarks
        
        # Commit changes to the database
        db.session.commit()
        
        # Audit log
        customer = Customer.query.get(complaint.customer_id)
        log_action(
            current_user_id,
            'UPDATE',
            'complaints',
            complaint.id,
            None,
            {'remarks': remarks},
            'N/A',
            'N/A',
            str(customer.company_id) if customer else company_id
        )
        
        return complaint
        
    except SQLAlchemyError as e:
        db.session.rollback()
        logger.error(f"Database error updating complaint remarks: {e}")
        return {"error": "Database error occurred."}
    except Exception as e:
        logger.error(f"Unexpected error updating complaint remarks: {e}")
        return {"error": "An unexpected error occurred."}

