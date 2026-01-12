from flask import jsonify, request
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity
from . import main
from ..crud import recovery_task_crud

@main.route('/recovery-tasks/list', methods=['GET'])
@jwt_required()
def get_recovery_tasks():
    claims = get_jwt()
    company_id = claims.get('company_id')
    user_role = claims.get('role')
    employee_id = claims.get('id')

    recovery_tasks = recovery_task_crud.get_all_recovery_tasks(company_id, user_role, employee_id)
    return jsonify(recovery_tasks), 200

@main.route('/recovery-tasks/add', methods=['POST'])
@jwt_required()
def add_new_recovery_task():
    claims = get_jwt()
    company_id = claims.get('company_id')
    user_role = claims.get('role')
    current_user_id = get_jwt_identity()
    ip_address = request.remote_addr
    user_agent = request.headers.get('User-Agent')

    if user_role not in ['company_owner', 'super_admin']:
        return jsonify({'error': 'Unauthorized action'}), 403

    data = request.json
    data['company_id'] = company_id
    try:
        new_task = recovery_task_crud.add_recovery_task(data, current_user_id, ip_address, user_agent, company_id)
        return jsonify({'message': 'Recovery task added successfully', 'id': str(new_task.id)}), 201
    except Exception as e:
        return jsonify({'error': 'Failed to add recovery task', 'message': str(e)}), 400

@main.route('/recovery-tasks/update/<string:id>', methods=['PUT'])
@jwt_required()
def update_existing_recovery_task(id):
    claims = get_jwt()
    company_id = claims.get('company_id')
    user_role = claims.get('role')
    current_user_id = get_jwt_identity()
    ip_address = request.remote_addr
    user_agent = request.headers.get('User-Agent')

    if user_role not in ['company_owner', 'super_admin','employee']:
        return jsonify({'error': 'Unauthorized action'}), 403

    data = request.json
    updated_task = recovery_task_crud.update_recovery_task(id, data, company_id, user_role, current_user_id, ip_address, user_agent)
    if updated_task:
        return jsonify({'message': 'Recovery task updated successfully'}), 200
    return jsonify({'message': 'Recovery task not found'}), 404

@main.route('/recovery-tasks/delete/<string:id>', methods=['DELETE'])
@jwt_required()
def delete_existing_recovery_task(id):
    claims = get_jwt()
    company_id = claims.get('company_id')
    user_role = claims.get('role')
    current_user_id = get_jwt_identity()
    ip_address = request.remote_addr
    user_agent = request.headers.get('User-Agent')

    if user_role not in ['company_owner', 'super_admin']:
        return jsonify({'error': 'Unauthorized action'}), 403

    if recovery_task_crud.delete_recovery_task(id, company_id, user_role, current_user_id, ip_address, user_agent):
        return jsonify({'message': 'Recovery task deleted successfully'}), 200
    return jsonify({'message': 'Recovery task not found'}), 404

