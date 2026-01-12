from flask import jsonify, request
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity
from . import main
from ..crud import employee_profile_crud

@main.route('/employees/<string:id>/profile', methods=['GET'])
@jwt_required()
def get_employee_profile(id):
    """Get comprehensive employee profile with analytics"""
    claims = get_jwt()
    company_id = claims.get('company_id')
    user_role = claims.get('role')
    
    profile = employee_profile_crud.get_employee_profile(id, company_id, user_role)
    if profile:
        return jsonify(profile), 200
    return jsonify({'message': 'Employee not found'}), 404

@main.route('/employees/<string:id>/customers', methods=['GET'])
@jwt_required()
def get_employee_customers(id):
    """Get customers managed by employee"""
    claims = get_jwt()
    company_id = claims.get('company_id')
    
    customers = employee_profile_crud.get_employee_customers(id, company_id)
    return jsonify(customers), 200

@main.route('/employees/<string:id>/payments', methods=['GET'])
@jwt_required()
def get_employee_payments(id):
    """Get payments received by employee"""
    claims = get_jwt()
    company_id = claims.get('company_id')
    
    payments = employee_profile_crud.get_employee_payments(id, company_id)
    return jsonify(payments), 200

@main.route('/employees/<string:id>/complaints', methods=['GET'])
@jwt_required()
def get_employee_complaints(id):
    """Get complaints assigned to employee"""
    claims = get_jwt()
    company_id = claims.get('company_id')
    
    complaints = employee_profile_crud.get_employee_complaints(id, company_id)
    return jsonify(complaints), 200

@main.route('/employees/<string:id>/tasks', methods=['GET'])
@jwt_required()
def get_employee_tasks(id):
    """Get tasks assigned to employee"""
    claims = get_jwt()
    company_id = claims.get('company_id')
    
    tasks = employee_profile_crud.get_employee_tasks(id, company_id)
    return jsonify(tasks), 200

@main.route('/employees/<string:id>/recovery-tasks', methods=['GET'])
@jwt_required()
def get_employee_recovery_tasks(id):
    """Get recovery tasks assigned to employee"""
    claims = get_jwt()
    company_id = claims.get('company_id')
    
    tasks = employee_profile_crud.get_employee_recovery_tasks(id, company_id)
    return jsonify(tasks), 200

@main.route('/employees/<string:id>/profile-ledger', methods=['GET'])
@jwt_required()
def get_employee_profile_ledger(id):
    """Get ledger entries for employee profile page"""
    claims = get_jwt()
    company_id = claims.get('company_id')
    
    entries = employee_profile_crud.get_employee_ledger(id, company_id)
    return jsonify(entries), 200

@main.route('/employees/<string:id>/inventory', methods=['GET'])
@jwt_required()
def get_employee_inventory(id):
    """Get inventory assigned to employee"""
    claims = get_jwt()
    company_id = claims.get('company_id')
    
    inventory = employee_profile_crud.get_employee_inventory(id, company_id)
    return jsonify(inventory), 200
