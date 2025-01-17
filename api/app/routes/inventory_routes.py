from flask import jsonify, request
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity
from . import main
from ..crud import inventory_crud

@main.route('/inventory/list', methods=['GET'])
@jwt_required()
def get_inventory_items():
    claims = get_jwt()
    company_id = claims['company_id']
    user_role = claims['role']
    employee_id = claims['id']
    inventory_items = inventory_crud.get_all_inventory_items(company_id, user_role,employee_id)
    return jsonify(inventory_items), 200

@main.route('/inventory/add', methods=['POST'])
@jwt_required()
def add_new_inventory_item():
    claims = get_jwt()
    company_id = claims['company_id']
    user_role = claims['role']
    current_user_id = get_jwt_identity()
    ip_address = request.remote_addr
    user_agent = request.headers.get('User-Agent')
    data = request.json
    try:
        new_item = inventory_crud.add_inventory_item(data, company_id, user_role, current_user_id, ip_address, user_agent)
        return jsonify({'message': 'Inventory item added successfully', 'id': str(new_item.id)}), 201
    except Exception as e:
        return jsonify({'error': 'Failed to add inventory item', 'message': str(e)}), 400

@main.route('/inventory/update/<string:id>', methods=['PUT'])
@jwt_required()
def update_existing_inventory_item(id):
    claims = get_jwt()
    company_id = claims['company_id']
    user_role = claims['role']
    current_user_id = get_jwt_identity()
    ip_address = request.remote_addr
    user_agent = request.headers.get('User-Agent')
    data = request.json
    updated_item = inventory_crud.update_inventory_item(id, data, company_id, user_role, current_user_id, ip_address, user_agent)
    if updated_item:
        return jsonify({'message': 'Inventory item updated successfully'}), 200
    return jsonify({'message': 'Inventory item not found'}), 404

@main.route('/inventory/delete/<string:id>', methods=['DELETE'])
@jwt_required()
def delete_existing_inventory_item(id):
    claims = get_jwt()
    company_id = claims['company_id']
    user_role = claims['role']
    current_user_id = get_jwt_identity()
    ip_address = request.remote_addr
    user_agent = request.headers.get('User-Agent')
    if inventory_crud.delete_inventory_item(id, company_id, user_role, current_user_id, ip_address, user_agent):
        return jsonify({'message': 'Inventory item deleted successfully'}), 200
    return jsonify({'message': 'Inventory item not found'}), 404

