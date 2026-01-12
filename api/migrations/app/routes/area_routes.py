from flask import jsonify, request
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity
from . import main
from ..crud import area_crud

@main.route('/areas/list', methods=['GET'])
@jwt_required()
def get_areas():
    claims = get_jwt()
    company_id = claims['company_id']
    user_role = claims['role']
    areas = area_crud.get_all_areas(company_id, user_role)
    return jsonify(areas), 200

@main.route('/areas/add', methods=['POST'])
@jwt_required()
def add_new_area():
    claims = get_jwt()
    company_id = claims['company_id']
    user_role = claims['role']
    current_user_id = get_jwt_identity()
    ip_address = request.remote_addr
    user_agent = request.headers.get('User-Agent')
    data = request.json
    data['company_id'] = company_id
    try:
        new_area = area_crud.add_area(data, user_role, current_user_id, ip_address, user_agent)
        return jsonify({'message': 'Area/Zone added successfully', 'id': str(new_area.id)}), 201
    except Exception as e:
        return jsonify({'error': 'Failed to add Area/Zone', 'message': str(e)}), 400

@main.route('/areas/update/<string:id>', methods=['PUT'])
@jwt_required()
def update_existing_area(id):
    claims = get_jwt()
    company_id = claims['company_id']
    user_role = claims['role']
    current_user_id = get_jwt_identity()
    ip_address = request.remote_addr
    user_agent = request.headers.get('User-Agent')
    data = request.json
    updated_area = area_crud.update_area(id, data, company_id, user_role, current_user_id, ip_address, user_agent)
    if updated_area:
        return jsonify({'message': 'Area/Zone updated successfully'}), 200
    return jsonify({'message': 'Area/Zone not found'}), 404

@main.route('/areas/delete/<string:id>', methods=['DELETE'])
@jwt_required()
def delete_existing_area(id):
    claims = get_jwt()
    company_id = claims['company_id']
    user_role = claims['role']
    current_user_id = get_jwt_identity()
    ip_address = request.remote_addr
    user_agent = request.headers.get('User-Agent')
    if area_crud.delete_area(id, company_id, user_role, current_user_id, ip_address, user_agent):
        return jsonify({'message': 'Area/Zone deleted successfully'}), 200
    return jsonify({'message': 'Area/Zone not found'}), 404

