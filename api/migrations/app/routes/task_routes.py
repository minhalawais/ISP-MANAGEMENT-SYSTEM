from flask import jsonify, request
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity
from . import main
from ..crud import task_crud

@main.route('/tasks/list', methods=['GET'])
@jwt_required()
def get_tasks():
    claims = get_jwt()
    company_id = claims.get('company_id')
    user_role = claims.get('role')
    employee_id = claims.get('id')
    tasks = task_crud.get_all_tasks(company_id, user_role, employee_id)
    return jsonify(tasks), 200

@main.route('/tasks/add', methods=['POST'])
@jwt_required()
def add_new_task():
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
        new_task = task_crud.add_task(data, current_user_id, ip_address, user_agent, company_id)
        return jsonify({'message': 'Task added successfully', 'id': str(new_task.id)}), 201
    except Exception as e:
        return jsonify({'error': 'Failed to add task', 'message': str(e)}), 400

@main.route('/tasks/update/<string:id>', methods=['PUT'])
@jwt_required()
def update_existing_task(id):
    claims = get_jwt()
    company_id = claims.get('company_id')
    user_role = claims.get('role')
    current_user_id = get_jwt_identity()
    ip_address = request.remote_addr
    user_agent = request.headers.get('User-Agent')

    if user_role not in ['company_owner', 'super_admin','employee']:
        return jsonify({'error': 'Unauthorized action'}), 403

    data = request.json
    print('Data:', data)
    updated_task = task_crud.update_task(id, data, company_id, user_role, current_user_id, ip_address, user_agent)
    if updated_task:
        return jsonify({'message': 'Task updated successfully'}), 200
    return jsonify({'message': 'Task not found'}), 404

@main.route('/tasks/delete/<string:id>', methods=['DELETE'])
@jwt_required()
def delete_existing_task(id):
    claims = get_jwt()
    company_id = claims.get('company_id')
    user_role = claims.get('role')
    current_user_id = get_jwt_identity()
    ip_address = request.remote_addr
    user_agent = request.headers.get('User-Agent')

    if user_role not in ['company_owner', 'super_admin']:
        return jsonify({'error': 'Unauthorized action'}), 403

    if task_crud.delete_task(id, company_id, user_role, current_user_id, ip_address, user_agent):
        return jsonify({'message': 'Task deleted successfully'}), 200
    return jsonify({'message': 'Task not found'}), 404

