from app import db
from app.models import User
from app.utils.logging_utils import log_action
import uuid
import os
from datetime import datetime
from decimal import Decimal
from sqlalchemy.exc import SQLAlchemyError, IntegrityError, DatabaseError
import logging
from werkzeug.utils import secure_filename

logger = logging.getLogger(__name__)

# File upload configuration
UPLOAD_FOLDER = 'uploads/employees'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'pdf'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def save_employee_file(file, employee_id, file_type):
    """
    Save an employee file and return the relative path.
    file_type: 'cnic', 'picture', 'utility_bill', 'reference_cnic'
    """
    if not file or not file.filename:
        return None
    
    if not allowed_file(file.filename):
        raise ValueError(f"File type not allowed. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}")
    
    # Create directory if it doesn't exist
    upload_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), UPLOAD_FOLDER, str(employee_id))
    os.makedirs(upload_dir, exist_ok=True)
    
    # Create unique filename
    ext = file.filename.rsplit('.', 1)[1].lower()
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = f"{file_type}_{timestamp}.{ext}"
    filepath = os.path.join(upload_dir, filename)
    
    file.save(filepath)
    
    # Return relative path for storage in database
    return f"{UPLOAD_FOLDER}/{employee_id}/{filename}"

def get_all_employees(company_id, user_role, employee_id):
    try:
        if user_role == 'super_admin':
            employees = User.query.order_by(User.created_at.desc()).all()
        elif user_role == 'auditor':
            employees = User.query.filter_by(is_active=True, company_id=company_id).order_by(User.created_at.desc()).all()
        elif user_role == 'company_owner':
            employees = User.query.filter_by(company_id=company_id).order_by(User.created_at.desc()).all()
        elif user_role == 'employee':
            employees = User.query.filter_by(id=employee_id).order_by(User.created_at.desc()).all()
        else:
            return None
        
        result = []
        for emp in employees:
            try:
                result.append({
                    'id': str(emp.id),
                    'username': emp.username,
                    'email': emp.email,
                    'first_name': emp.first_name,
                    'last_name': emp.last_name,
                    'role': emp.role,
                    'is_active': emp.is_active,
                    'full_name': f"{emp.first_name} {emp.last_name}",
                    'contact_number': emp.contact_number,
                    'cnic': emp.cnic,
                    # New fields
                    'emergency_contact': emp.emergency_contact,
                    'house_address': emp.house_address,
                    'cnic_image': emp.cnic_image,
                    'picture': emp.picture,
                    'utility_bill_image': emp.utility_bill_image,
                    'joining_date': emp.joining_date.isoformat() if emp.joining_date else None,
                    'salary': float(emp.salary) if emp.salary else None,
                    'reference_name': emp.reference_name,
                    'reference_contact': emp.reference_contact,
                    'reference_cnic_image': emp.reference_cnic_image,
                    # Payment tracking fields
                    'current_balance': float(emp.current_balance) if emp.current_balance else 0,
                    'paid_amount': float(emp.paid_amount) if emp.paid_amount else 0,
                })
            except AttributeError as e:
                logger.error(f"Error processing employee {emp.id}: {str(e)}")
                continue
        return result
    except Exception as e:
        logger.error(f"Error getting employees: {str(e)}")
        raise

def add_employee(data, files, user_role, current_user_id, ip_address, user_agent):
    """
    Add a new employee with file uploads.
    data: dict with employee fields
    files: dict with file objects (cnic_image, picture, utility_bill_image, reference_cnic_image)
    """
    try:
        required_fields = ['company_id', 'username', 'email', 'first_name', 'last_name', 'password', 
                           'contact_number', 'emergency_contact', 'cnic', 'house_address', 'salary',
                           'reference_name', 'reference_contact']
        for field in required_fields:
            if field not in data or not data[field]:
                raise ValueError(f"Missing required field: {field}")

        # Parse salary
        salary = Decimal(str(data['salary'])) if data.get('salary') else None
        
        # Parse joining date
        joining_date = None
        if data.get('joining_date'):
            try:
                joining_date = datetime.strptime(data['joining_date'], '%Y-%m-%d').date()
            except ValueError:
                pass

        new_employee = User(
            company_id=uuid.UUID(data['company_id']),
            username=data['username'],
            email=data['email'],
            first_name=data['first_name'],
            last_name=data['last_name'],
            contact_number=data.get('contact_number'),
            cnic=data.get('cnic'),
            role=data.get('role'),
            is_active=True,
            # New fields
            emergency_contact=data.get('emergency_contact'),
            house_address=data.get('house_address'),
            joining_date=joining_date,
            salary=salary,
            reference_name=data.get('reference_name'),
            reference_contact=data.get('reference_contact'),
        )
        new_employee.set_password(data['password'])
        
        # First add without files to get the ID
        db.session.add(new_employee)
        db.session.flush()  # Get the ID without committing
        
        # Handle file uploads
        if files:
            if 'cnic_image' in files and files['cnic_image']:
                new_employee.cnic_image = save_employee_file(files['cnic_image'], new_employee.id, 'cnic')
            if 'picture' in files and files['picture']:
                new_employee.picture = save_employee_file(files['picture'], new_employee.id, 'picture')
            if 'utility_bill_image' in files and files['utility_bill_image']:
                new_employee.utility_bill_image = save_employee_file(files['utility_bill_image'], new_employee.id, 'utility_bill')
            if 'reference_cnic_image' in files and files['reference_cnic_image']:
                new_employee.reference_cnic_image = save_employee_file(files['reference_cnic_image'], new_employee.id, 'reference_cnic')
        
        db.session.commit()

        log_action(
            current_user_id,
            'CREATE',
            'users',
            new_employee.id,
            None,
            {k: v for k, v in data.items() if k != 'password'},
            ip_address,
            user_agent,
            data['company_id']
        )

        return new_employee, {
            'username': new_employee.username,
            'password': data['password'],
            'email': new_employee.email
        }
    except IntegrityError as e:
        logger.error(f"Integrity error adding employee: {str(e)}")
        db.session.rollback()
        raise DatabaseError("Employee with this username, email, or CNIC already exists")
    except Exception as e:
        logger.error(f"Error adding employee: {str(e)}")
        db.session.rollback()
        raise

def update_employee(id, data, files, company_id, user_role, current_user_id, ip_address, user_agent):
    """
    Update an employee with file uploads.
    """
    try:
        if user_role == 'super_admin':
            employee = User.query.get(id)
        elif user_role == 'auditor':
            employee = User.query.filter_by(id=id, is_active=True, company_id=company_id).first()
        elif user_role == 'company_owner':
            employee = User.query.filter_by(id=id, company_id=company_id).first()
        else:
            employee = None

        if not employee:
            raise ValueError(f"Employee with id {id} not found")

        old_values = {
            'username': employee.username,
            'email': employee.email,
            'first_name': employee.first_name,
            'last_name': employee.last_name,
            'is_active': employee.is_active,
            'contact_number': employee.contact_number,
            'cnic': employee.cnic,
            'role': employee.role,
            'emergency_contact': employee.emergency_contact,
            'house_address': employee.house_address,
            'joining_date': str(employee.joining_date) if employee.joining_date else None,
            'salary': float(employee.salary) if employee.salary else None,
            'reference_name': employee.reference_name,
            'reference_contact': employee.reference_contact,
        }

        # Update basic fields
        if 'username' in data:
            employee.username = data['username']
        if 'email' in data:
            employee.email = data['email']
        if 'first_name' in data:
            employee.first_name = data['first_name']
        if 'last_name' in data:
            employee.last_name = data['last_name']
        if 'password' in data and data['password']:
            employee.set_password(data['password'])
        if 'is_active' in data:
            employee.is_active = data['is_active'] in [True, 'true', 'True', 1, '1']
        if 'contact_number' in data:
            employee.contact_number = data['contact_number']
        if 'cnic' in data:
            employee.cnic = data['cnic']
        if 'role' in data:
            employee.role = data['role']
        
        # Update new fields
        if 'emergency_contact' in data:
            employee.emergency_contact = data['emergency_contact']
        if 'house_address' in data:
            employee.house_address = data['house_address']
        if 'joining_date' in data and data['joining_date']:
            try:
                employee.joining_date = datetime.strptime(data['joining_date'], '%Y-%m-%d').date()
            except ValueError:
                pass
        if 'salary' in data and data['salary']:
            employee.salary = Decimal(str(data['salary']))
        if 'reference_name' in data:
            employee.reference_name = data['reference_name']
        if 'reference_contact' in data:
            employee.reference_contact = data['reference_contact']
        
        # Handle file uploads
        if files:
            if 'cnic_image' in files and files['cnic_image'] and files['cnic_image'].filename:
                employee.cnic_image = save_employee_file(files['cnic_image'], employee.id, 'cnic')
            if 'picture' in files and files['picture'] and files['picture'].filename:
                employee.picture = save_employee_file(files['picture'], employee.id, 'picture')
            if 'utility_bill_image' in files and files['utility_bill_image'] and files['utility_bill_image'].filename:
                employee.utility_bill_image = save_employee_file(files['utility_bill_image'], employee.id, 'utility_bill')
            if 'reference_cnic_image' in files and files['reference_cnic_image'] and files['reference_cnic_image'].filename:
                employee.reference_cnic_image = save_employee_file(files['reference_cnic_image'], employee.id, 'reference_cnic')

        db.session.commit()

        log_action(
            current_user_id,
            'UPDATE',
            'users',
            employee.id,
            old_values,
            {k: v for k, v in data.items() if k != 'password'},
            ip_address,
            user_agent,
            company_id
        )

        return employee
    except Exception as e:
        logger.error(f"Error updating employee {id}: {str(e)}")
        db.session.rollback()
        raise

def delete_employee(id, company_id, user_role, current_user_id, ip_address, user_agent):
    try:
        if user_role == 'super_admin':
            employee = User.query.get(id)
        elif user_role == 'auditor':
            employee = User.query.filter_by(id=id, is_active=True, company_id=company_id).first()
        elif user_role == 'company_owner':
            employee = User.query.filter_by(id=id, company_id=company_id).first()
        else:
            employee = None

        if not employee:
            raise ValueError(f"Employee with id {id} not found")
            
        old_values = {
            'username': employee.username,
            'email': employee.email,
            'first_name': employee.first_name,
            'last_name': employee.last_name,
            'is_active': employee.is_active,
            'contact_number': employee.contact_number,
            'cnic': employee.cnic,
            'role': employee.role
        }

        db.session.delete(employee)
        db.session.commit()

        log_action(
            current_user_id,
            'DELETE',
            'users',
            employee.id,
            old_values,
            None,
            ip_address,
            user_agent,
            company_id
        )

        return True
    except Exception as e:
        logger.error(f"Error deleting employee {id}: {str(e)}")
        db.session.rollback()
        raise

def toggle_employee_status(id, company_id, user_role, current_user_id, ip_address, user_agent):
    try:
        if user_role == 'super_admin':
            employee = User.query.get(id)
        elif user_role == 'auditor':
            employee = User.query.filter_by(id=id, is_active=True, company_id=company_id).first()
        elif user_role == 'company_owner':
            employee = User.query.filter_by(id=id, company_id=company_id).first()
        else:
            employee = None

        if not employee:
            raise ValueError(f"Employee with id {id} not found")
            
        old_status = employee.is_active
        employee.is_active = not employee.is_active
        db.session.commit()

        log_action(
            current_user_id,
            'UPDATE',
            'users',
            employee.id,
            {'is_active': old_status},
            {'is_active': employee.is_active},
            ip_address,
            user_agent,
            company_id
        )

        return employee
    except Exception as e:
        logger.error(f"Error toggling employee status {id}: {str(e)}")
        db.session.rollback()
        raise

def get_all_roles():
    return ['super_admin', 'company_owner', 'manager', 'employee', 'auditor', 'recovery_agent', 'technician']

def check_username_availability(username):
    try:
        existing_user = User.query.filter_by(username=username).first()
        return existing_user is None
    except Exception as e:
        logger.error(f"Error checking username availability: {str(e)}")
        raise

def check_email_availability(email):
    try:
        existing_user = User.query.filter_by(email=email).first()
        return existing_user is None
    except Exception as e:
        logger.error(f"Error checking email availability: {str(e)}")
        raise
