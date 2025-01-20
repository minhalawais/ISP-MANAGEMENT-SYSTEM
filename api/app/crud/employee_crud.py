from app import db
from app.models import User
from app.utils.logging_utils import log_action
import uuid
from sqlalchemy.exc import SQLAlchemyError, IntegrityError, DatabaseError
import logging
from app.utils.email_utils import send_email

logger = logging.getLogger(__name__)

def get_all_employees(company_id, user_role, employee_id):
    try:
        if user_role == 'super_admin':
            employees = User.query.all()
        elif user_role == 'auditor':
            employees = User.query.filter_by(is_active=True, company_id=company_id).all()
        elif user_role == 'company_owner':  # company_owner and other roles
            employees = User.query.filter_by(company_id=company_id).all()
        elif user_role == 'employee':
            employees = User.query.filter_by(id=employee_id).all()
        else:
            return None;
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
                    'cnic': emp.cnic
                })
            except AttributeError as e:
                logger.error(f"Error processing employee {emp.id}: {str(e)}")
                continue
        return result
    except Exception as e:
        print('Error:', e)
        logger.error(f"Error getting employees: {str(e)}")
        raise

def add_employee(data, user_role, current_user_id, ip_address, user_agent):
    try:
        required_fields = ['company_id', 'username', 'email', 'first_name', 'last_name', 'password']
        for field in required_fields:
            if field not in data:
                raise ValueError(f"Missing required field: {field}")

        new_employee = User(
            company_id=uuid.UUID(data['company_id']),
            username=data['username'],
            email=data['email'],
            first_name=data['first_name'],
            last_name=data['last_name'],
            contact_number=data.get('contact_number', None),
            cnic=data.get('cnic', None),
            role=data.get('role', None),
            is_active=True
        )
        new_employee.set_password(data['password'])
        db.session.add(new_employee)
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

        # Send email to the new employee
    #    send_email(
     #       to=new_employee.email,
      #      subject="Your New Account Credentials",
       #     template="new_employee_credentials",
        #    username=new_employee.username,
         #   password=data['password']
        #)

        # Send email to the current user
       # current_user = User.query.get(current_user_id)
        #if current_user:
         #   send_email(
          #      to=current_user.email,
           #     subject="New Employee Account Created",
            #    template="new_employee_notification",
             #   employee_name=f"{new_employee.first_name} {new_employee.last_name}",
              #  employee_email=new_employee.email
           # )

        return new_employee, {
            'username': new_employee.username,
            'password': data['password'],
            'email': new_employee.email
        }
    except IntegrityError as e:
        logger.error(f"Integrity error adding employee: {str(e)}")
        db.session.rollback()
        raise DatabaseError("Employee with this username or email already exists")
    except Exception as e:
        logger.error(f"Error adding employee: {str(e)}")
        db.session.rollback()
        raise

def update_employee(id, data, company_id, user_role, current_user_id, ip_address, user_agent):
    try:
        if user_role == 'super_admin':
            employee = User.query.get(id)
        elif user_role == 'auditor':
            employee = User.query.filter_by(id=id, is_active=True, company_id=company_id).first()
        elif user_role == 'company_owner':
            employee = User.query.filter_by(id=id, company_id=company_id).first()

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
            employee.is_active = data['is_active']
        if 'contact_number' in data:
            employee.contact_number = data['contact_number']
        if 'cnic' in data:
            employee.cnic = data['cnic']
        if 'role' in data:
            employee.role = data['role']

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
    roles = EmployeeRole.query.all()
    return [role.name for role in roles]

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

