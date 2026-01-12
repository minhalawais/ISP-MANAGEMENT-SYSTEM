from flask import jsonify, request
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity
from . import main
from ..crud import employee_crud

@main.route('/employees/list', methods=['GET'])
@jwt_required()
def get_employees():
    claims = get_jwt()
    company_id = claims['company_id']
    user_role = claims['role']
    employee_id = get_jwt_identity()
    employees = employee_crud.get_all_employees(company_id, user_role, employee_id)
    return jsonify(employees), 200

@main.route('/employees/add', methods=['POST'])
@jwt_required()
def add_new_employee():
    claims = get_jwt()
    company_id = claims['company_id']
    user_role = claims['role']
    current_user_id = get_jwt_identity()
    ip_address = request.remote_addr
    user_agent = request.headers.get('User-Agent')
    
    # Handle both form data (with files) and JSON
    if request.content_type and 'multipart/form-data' in request.content_type:
        data = request.form.to_dict()
        files = {
            'cnic_image': request.files.get('cnic_image'),
            'picture': request.files.get('picture'),
            'utility_bill_image': request.files.get('utility_bill_image'),
            'reference_cnic_image': request.files.get('reference_cnic_image'),
        }
    else:
        data = request.json
        files = {}
    
    data['company_id'] = company_id
    
    try:
        new_employee, credentials = employee_crud.add_employee(data, files, user_role, current_user_id, ip_address, user_agent)
        return jsonify({
            'message': 'Employee added successfully',
            'id': str(new_employee.id),
            'credentials': credentials
        }), 201
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': 'Failed to add employee', 'message': str(e)}), 500

@main.route('/employees/update/<string:id>', methods=['PUT'])
@jwt_required()
def update_existing_employee(id):
    claims = get_jwt()
    company_id = claims['company_id']
    user_role = claims['role']
    current_user_id = get_jwt_identity()
    ip_address = request.remote_addr
    user_agent = request.headers.get('User-Agent')
    
    # Handle both form data (with files) and JSON
    if request.content_type and 'multipart/form-data' in request.content_type:
        data = request.form.to_dict()
        files = {
            'cnic_image': request.files.get('cnic_image'),
            'picture': request.files.get('picture'),
            'utility_bill_image': request.files.get('utility_bill_image'),
            'reference_cnic_image': request.files.get('reference_cnic_image'),
        }
    else:
        data = request.json
        files = {}
    
    try:
        updated_employee = employee_crud.update_employee(id, data, files, company_id, user_role, current_user_id, ip_address, user_agent)
        if updated_employee:
            return jsonify({'message': 'Employee updated successfully'}), 200
        return jsonify({'message': 'Employee not found'}), 404
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': 'Failed to update employee', 'message': str(e)}), 500

@main.route('/employees/delete/<string:id>', methods=['DELETE'])
@jwt_required()
def delete_existing_employee(id):
    claims = get_jwt()
    company_id = claims['company_id']
    user_role = claims['role']
    current_user_id = get_jwt_identity()
    ip_address = request.remote_addr
    user_agent = request.headers.get('User-Agent')
    try:
        if employee_crud.delete_employee(id, company_id, user_role, current_user_id, ip_address, user_agent):
            return jsonify({'message': 'Employee deleted successfully'}), 200
        return jsonify({'message': 'Employee not found'}), 404
    except Exception as e:
        return jsonify({'error': 'Failed to delete employee', 'message': str(e)}), 500

@main.route('/employees/toggle-status/<string:id>', methods=['PATCH'])
@jwt_required()
def toggle_employee_active_status(id):
    claims = get_jwt()
    company_id = claims['company_id']
    user_role = claims['role']
    current_user_id = get_jwt_identity()
    ip_address = request.remote_addr
    user_agent = request.headers.get('User-Agent')
    try:
        employee = employee_crud.toggle_employee_status(id, company_id, user_role, current_user_id, ip_address, user_agent)
        if employee:
            return jsonify({'message': f"Employee {'activated' if employee.is_active else 'deactivated'} successfully"}), 200
        return jsonify({'message': 'Employee not found'}), 404
    except Exception as e:
        return jsonify({'error': 'Failed to toggle employee status', 'message': str(e)}), 500

@main.route('/employees/roles', methods=['GET'])
@jwt_required()
def get_roles():
    roles = employee_crud.get_all_roles()
    return jsonify(roles), 200

@main.route('/employees/verify-username', methods=['POST'])
@jwt_required()
def verify_username():
    data = request.json
    username = data.get('username')
    if not username:
        return jsonify({'error': 'Username is required'}), 400
    
    is_available = employee_crud.check_username_availability(username)
    return jsonify({'available': is_available}), 200

@main.route('/employees/verify-email', methods=['POST'])
@jwt_required()
def verify_email():
    data = request.json
    email = data.get('email')
    if not email:
        return jsonify({'error': 'Email is required'}), 400
    
    is_available = employee_crud.check_email_availability(email)
    return jsonify({'available': is_available}), 200

# ============ Employee Ledger & Commission Routes ============

@main.route('/employees/<string:id>/ledger', methods=['GET'])
@jwt_required()
def get_employee_ledger(id):
    """Get ledger entries for an employee"""
    from ..crud import employee_ledger_crud
    claims = get_jwt()
    company_id = claims['company_id']
    
    limit = request.args.get('limit', 50, type=int)
    offset = request.args.get('offset', 0, type=int)
    
    entries = employee_ledger_crud.get_employee_ledger(id, company_id, limit, offset)
    balance = employee_ledger_crud.get_employee_balance(id)
    
    return jsonify({
        'entries': entries,
        'current_balance': balance
    }), 200

@main.route('/employees/<string:id>/balance', methods=['GET'])
@jwt_required()
def get_employee_balance(id):
    """Get current balance for an employee"""
    from ..crud import employee_ledger_crud
    balance = employee_ledger_crud.get_employee_balance(id)
    return jsonify({'current_balance': balance}), 200

@main.route('/employees/<string:id>/ledger/add', methods=['POST'])
@jwt_required()
def add_ledger_entry(id):
    """Manually add a ledger entry (for adjustments/manual payouts)"""
    from ..crud import employee_ledger_crud
    claims = get_jwt()
    company_id = claims['company_id']
    user_role = claims['role']
    
    if user_role not in ['super_admin', 'company_owner']:
        return jsonify({'error': 'Insufficient permissions'}), 403
    
    data = request.json
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    required_fields = ['transaction_type', 'amount', 'description']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'{field} is required'}), 400
    
    try:
        entry = employee_ledger_crud.add_ledger_entry(
            employee_id=id,
            transaction_type=data['transaction_type'],
            amount=float(data['amount']),
            description=data['description'],
            company_id=company_id,
            reference_id=data.get('reference_id'),
            current_user_id=get_jwt_identity(),
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent')
        )
        return jsonify({
            'message': 'Ledger entry added successfully',
            'id': str(entry.id)
        }), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Note: Connection commissions are now automatically generated when subscription invoices are created
# See invoice_crud.py -> add_invoice() -> generate_connection_commission_for_invoice()


# ============ Employee Credentials Management ============

@main.route('/employees/<string:id>/credentials', methods=['GET'])
@jwt_required()
def get_employee_credentials(id):
    """Get employee's current username and email (password is hashed, can't be retrieved)"""
    claims = get_jwt()
    company_id = claims['company_id']
    user_role = claims['role']
    
    if user_role not in ['super_admin', 'company_owner', 'manager']:
        return jsonify({'error': 'Insufficient permissions'}), 403
    
    from ..models import User
    employee = User.query.filter_by(id=id, company_id=company_id).first()
    
    if not employee:
        return jsonify({'error': 'Employee not found'}), 404
    
    return jsonify({
        'id': str(employee.id),
        'username': employee.username,
        'email': employee.email,
        'has_credentials': bool(employee.username and employee.password),
        'first_name': employee.first_name,
        'last_name': employee.last_name,
    }), 200


@main.route('/employees/<string:id>/credentials', methods=['PUT'])
@jwt_required()
def update_employee_credentials(id):
    """Update employee username and/or generate new password"""
    claims = get_jwt()
    company_id = claims['company_id']
    user_role = claims['role']
    current_user_id = get_jwt_identity()
    ip_address = request.remote_addr
    user_agent = request.headers.get('User-Agent')
    
    if user_role not in ['super_admin', 'company_owner', 'manager']:
        return jsonify({'error': 'Insufficient permissions'}), 403
    
    data = request.json
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    from ..models import User
    from app import db
    import secrets
    import string
    
    employee = User.query.filter_by(id=id, company_id=company_id).first()
    
    if not employee:
        return jsonify({'error': 'Employee not found'}), 404
    
    old_values = {
        'username': employee.username,
        'email': employee.email,
    }
    
    new_password = None
    
    # Update username if provided
    if data.get('username') and data['username'] != employee.username:
        # Check if username is available
        existing = User.query.filter_by(username=data['username']).first()
        if existing and existing.id != employee.id:
            return jsonify({'error': 'Username already taken'}), 400
        employee.username = data['username']
    
    # Update email if provided
    if data.get('email') and data['email'] != employee.email:
        # Check if email is available
        existing = User.query.filter_by(email=data['email']).first()
        if existing and existing.id != employee.id:
            return jsonify({'error': 'Email already taken'}), 400
        employee.email = data['email']
    
    # Generate new password if requested
    if data.get('generate_password'):
        # Generate a secure random password
        alphabet = string.ascii_letters + string.digits
        new_password = ''.join(secrets.choice(alphabet) for _ in range(12))
        employee.set_password(new_password)
    elif data.get('password'):
        # Use custom password if provided
        new_password = data['password']
        employee.set_password(new_password)
    
    try:
        db.session.commit()
        
        # Log the action
        from app.utils.logging_utils import log_action
        log_action(
            current_user_id,
            'UPDATE_CREDENTIALS',
            'users',
            employee.id,
            old_values,
            {'username': employee.username, 'email': employee.email, 'password_changed': bool(new_password)},
            ip_address,
            user_agent,
            company_id
        )
        
        response = {
            'message': 'Credentials updated successfully',
            'username': employee.username,
            'email': employee.email,
        }
        
        if new_password:
            response['password'] = new_password  # Only return password when newly generated
        
        return jsonify(response), 200
    except Exception as e:
        db.session.rollback()
        print('Exception: ', str(e))
        return jsonify({'error': str(e)}), 500


# ============ Salary Accrual ============

@main.route('/employees/accrue-salaries', methods=['POST'])
@jwt_required()
def trigger_salary_accrual():
    """
    Manually trigger salary accrual for all employees.
    Only accessible by super_admin and company_owner.
    This is useful for testing or catching up on missed salary accruals.
    """
    from ..crud import employee_ledger_crud
    from ..models import User, EmployeeLedger
    from app import db
    from datetime import datetime
    
    claims = get_jwt()
    company_id = claims['company_id']
    user_role = claims['role']
    
    if user_role not in ['super_admin', 'company_owner']:
        return jsonify({'error': 'Insufficient permissions'}), 403
    
    try:
        current_month = datetime.now().strftime('%B %Y')
        
        # Get all active employees with salary > 0 for this company
        employees = User.query.filter(
            User.company_id == company_id,
            User.is_active == True,
            User.role.in_(['employee', 'manager', 'technician', 'recovery_agent']),
            User.salary != None,
            User.salary > 0
        ).all()
        
        accrued_count = 0
        skipped_count = 0
        accrued_employees = []
        
        for employee in employees:
            salary_amount = float(employee.salary)
            
            # Check if salary already accrued this month
            month_start = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            existing_accrual = EmployeeLedger.query.filter(
                EmployeeLedger.employee_id == employee.id,
                EmployeeLedger.transaction_type == 'salary_accrual',
                EmployeeLedger.created_at >= month_start
            ).first()
            
            if existing_accrual:
                skipped_count += 1
                continue
            
            # Add ledger entry for salary accrual
            employee_ledger_crud.add_ledger_entry(
                employee_id=str(employee.id),
                transaction_type='salary_accrual',
                amount=salary_amount,
                description=f"Monthly Salary for {current_month}",
                company_id=str(company_id),
                reference_id=None,
                current_user_id=get_jwt_identity(),
                ip_address=request.remote_addr,
                user_agent=request.headers.get('User-Agent')
            )
            
            accrued_count += 1
            accrued_employees.append({
                'name': f"{employee.first_name} {employee.last_name}",
                'salary': salary_amount
            })
        
        return jsonify({
            'message': f'Salary accrual completed for {current_month}',
            'accrued_count': accrued_count,
            'skipped_count': skipped_count,
            'skipped_reason': 'Already accrued this month',
            'accrued_employees': accrued_employees
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
