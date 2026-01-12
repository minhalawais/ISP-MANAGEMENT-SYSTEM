from flask import jsonify, request
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity
from . import main
from ..crud import supplier_crud

@main.route('/suppliers/list', methods=['GET'])
@jwt_required()
def get_suppliers():
    claims = get_jwt()
    company_id = claims.get('company_id')
    user_role = claims.get('role')

    suppliers = supplier_crud.get_all_suppliers(company_id, user_role)
    return jsonify(suppliers), 200

@main.route('/suppliers/add', methods=['POST'])
@jwt_required()
def add_new_supplier():
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
        new_supplier = supplier_crud.add_supplier(data, current_user_id, ip_address, user_agent)
        return jsonify({'message': 'Supplier added successfully', 'id': str(new_supplier.id)}), 201
    except Exception as e:
        return jsonify({'error': 'Failed to add supplier', 'message': str(e)}), 400

@main.route('/suppliers/update/<string:id>', methods=['PUT'])
@jwt_required()
def update_existing_supplier(id):
    claims = get_jwt()
    company_id = claims.get('company_id')
    user_role = claims.get('role')
    current_user_id = get_jwt_identity()
    ip_address = request.remote_addr
    user_agent = request.headers.get('User-Agent')

    if user_role not in ['company_owner', 'super_admin']:
        return jsonify({'error': 'Unauthorized action'}), 403

    data = request.json
    updated_supplier = supplier_crud.update_supplier(id, data, company_id, user_role, current_user_id, ip_address, user_agent)
    if updated_supplier:
        return jsonify({'message': 'Supplier updated successfully'}), 200
    return jsonify({'message': 'Supplier not found'}), 404

@main.route('/suppliers/delete/<string:id>', methods=['DELETE'])
@jwt_required()
def delete_existing_supplier(id):
    claims = get_jwt()
    company_id = claims.get('company_id')
    user_role = claims.get('role')
    current_user_id = get_jwt_identity()
    ip_address = request.remote_addr
    user_agent = request.headers.get('User-Agent')

    if user_role not in ['company_owner', 'super_admin']:
        return jsonify({'error': 'Unauthorized action'}), 403

    if supplier_crud.delete_supplier(id, company_id, user_role, current_user_id, ip_address, user_agent):
        return jsonify({'message': 'Supplier deleted successfully'}), 200
    return jsonify({'message': 'Supplier not found'}), 404

