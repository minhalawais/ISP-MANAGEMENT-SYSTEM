from flask import jsonify, request
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity
from . import main
from ..crud import service_plan_crud

@main.route('/service-plans/list', methods=['GET'])
@jwt_required()
def get_service_plans():
    claims = get_jwt()
    company_id = claims.get('company_id')
    user_role = claims.get('role')

    service_plans = service_plan_crud.get_all_service_plans(company_id, user_role)
    return jsonify(service_plans), 200

@main.route('/service-plans/add', methods=['POST'])
@jwt_required()
def add_new_service_plan():
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
        new_service_plan = service_plan_crud.add_service_plan(data, current_user_id, ip_address, user_agent)
        return jsonify({'message': 'Service plan added successfully', 'id': str(new_service_plan.id)}), 201
    except Exception as e:
        return jsonify({'error': 'Failed to add service plan', 'message': str(e)}), 400

@main.route('/service-plans/update/<string:id>', methods=['PUT'])
@jwt_required()
def update_existing_service_plan(id):
    claims = get_jwt()
    company_id = claims.get('company_id')
    user_role = claims.get('role')
    current_user_id = get_jwt_identity()
    ip_address = request.remote_addr
    user_agent = request.headers.get('User-Agent')

    if user_role not in ['company_owner', 'super_admin']:
        return jsonify({'error': 'Unauthorized action'}), 403

    data = request.json
    updated_service_plan = service_plan_crud.update_service_plan(id, data, company_id, user_role, current_user_id, ip_address, user_agent)
    if updated_service_plan:
        return jsonify({'message': 'Service plan updated successfully'}), 200
    return jsonify({'message': 'Service plan not found'}), 404

@main.route('/service-plans/delete/<string:id>', methods=['DELETE'])
@jwt_required()
def delete_existing_service_plan(id):
    claims = get_jwt()
    company_id = claims.get('company_id')
    user_role = claims.get('role')
    current_user_id = get_jwt_identity()
    ip_address = request.remote_addr
    user_agent = request.headers.get('User-Agent')

    if user_role not in ['company_owner', 'super_admin']:
        return jsonify({'error': 'Unauthorized action'}), 403

    if service_plan_crud.delete_service_plan(id, company_id, user_role, current_user_id, ip_address, user_agent):
        return jsonify({'message': 'Service plan deleted successfully'}), 200
    return jsonify({'message': 'Service plan not found'}), 404

@main.route('/service-plans/toggle-status/<string:id>', methods=['PATCH'])
@jwt_required()
def toggle_service_plan_active_status(id):
    claims = get_jwt()
    company_id = claims.get('company_id')
    user_role = claims.get('role')
    current_user_id = get_jwt_identity()
    ip_address = request.remote_addr
    user_agent = request.headers.get('User-Agent')

    if user_role not in ['company_owner', 'super_admin']:
        return jsonify({'error': 'Unauthorized action'}), 403

    service_plan = service_plan_crud.toggle_service_plan_status(id, company_id, user_role, current_user_id, ip_address, user_agent)
    if service_plan:
        return jsonify({'message': f"Service plan {'activated' if service_plan.is_active else 'deactivated'} successfully"}), 200
    return jsonify({'message': 'Service plan not found'}), 404

