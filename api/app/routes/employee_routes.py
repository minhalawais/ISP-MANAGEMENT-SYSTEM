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
    data = request.json
    data['company_id'] = company_id
    new_employee, credentials = employee_crud.add_employee(data, user_role, current_user_id, ip_address, user_agent)
    return jsonify({
        'message': 'Employee added successfully',
        'id': str(new_employee.id),
        'credentials': credentials
    }), 201

@main.route('/employees/update/<string:id>', methods=['PUT'])
@jwt_required()
def update_existing_employee(id):
    claims = get_jwt()
    company_id = claims['company_id']
    user_role = claims['role']
    current_user_id = get_jwt_identity()
    ip_address = request.remote_addr
    user_agent = request.headers.get('User-Agent')
    data = request.json
    updated_employee = employee_crud.update_employee(id, data, company_id, user_role, current_user_id, ip_address, user_agent)
    if updated_employee:
        return jsonify({'message': 'Employee updated successfully'}), 200
    return jsonify({'message': 'Employee not found'}), 404

@main.route('/employees/delete/<string:id>', methods=['DELETE'])
@jwt_required()
def delete_existing_employee(id):
    claims = get_jwt()
    company_id = claims['company_id']
    user_role = claims['role']
    current_user_id = get_jwt_identity()
    ip_address = request.remote_addr
    user_agent = request.headers.get('User-Agent')
    if employee_crud.delete_employee(id, company_id, user_role, current_user_id, ip_address, user_agent):
        return jsonify({'message': 'Employee deleted successfully'}), 200
    return jsonify({'message': 'Employee not found'}), 404

@main.route('/employees/toggle-status/<string:id>', methods=['PATCH'])
@jwt_required()
def toggle_employee_active_status(id):
    claims = get_jwt()
    company_id = claims['company_id']
    user_role = claims['role']
    current_user_id = get_jwt_identity()
    ip_address = request.remote_addr
    user_agent = request.headers.get('User-Agent')
    employee = employee_crud.toggle_employee_status(id, company_id, user_role, current_user_id, ip_address, user_agent)
    if employee:
        return jsonify({'message': f"Employee {'activated' if employee.is_active else 'deactivated'} successfully"}), 200
    return jsonify({'message': 'Employee not found'}), 404

@main.route('/employees/roles', methods=['GET'])
@jwt_required()
def get_roles():
    roles = employee_crud.get_all_roles()
    return jsonify(roles), 200

@main.route('/employees/modules', methods=['GET'])
@jwt_required()
def get_modules():
    modules = employee_crud.get_all_modules()
    return jsonify(modules), 200

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

