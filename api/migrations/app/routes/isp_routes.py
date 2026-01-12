from flask import jsonify, request
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity
from . import main
from ..crud import isp_crud

@main.route('/isps/list', methods=['GET'])
@jwt_required()
def get_isps():
    claims = get_jwt()
    company_id = claims['company_id']
    isps = isp_crud.get_all_isps(company_id)
    return jsonify(isps), 200

@main.route('/isps/add', methods=['POST'])
@jwt_required()
def add_new_isp():
    claims = get_jwt()
    company_id = claims['company_id']
    user_id = get_jwt_identity()
    ip_address = request.remote_addr
    user_agent = request.headers.get('User-Agent')
    
    data = request.json
    try:
        new_isp = isp_crud.add_isp(data, company_id, user_id, ip_address, user_agent)
        return jsonify({'message': 'ISP added successfully', 'id': str(new_isp.id)}), 201
    except Exception as e:
        return jsonify({'error': 'Failed to add ISP', 'message': str(e)}), 400

@main.route('/isps/update/<string:id>', methods=['PUT'])
@jwt_required()
def update_existing_isp(id):
    claims = get_jwt()
    company_id = claims['company_id']
    user_id = get_jwt_identity()
    ip_address = request.remote_addr
    user_agent = request.headers.get('User-Agent')
    
    data = request.json
    updated_isp = isp_crud.update_isp(id, data, company_id, user_id, ip_address, user_agent)
    if updated_isp:
        return jsonify({'message': 'ISP updated successfully'}), 200
    return jsonify({'message': 'ISP not found'}), 404

@main.route('/isps/delete/<string:id>', methods=['DELETE'])
@jwt_required()
def delete_existing_isp(id):
    claims = get_jwt()
    company_id = claims['company_id']
    user_id = get_jwt_identity()
    ip_address = request.remote_addr
    user_agent = request.headers.get('User-Agent')
    
    if isp_crud.delete_isp(id, company_id, user_id, ip_address, user_agent):
        return jsonify({'message': 'ISP deleted successfully'}), 200
    return jsonify({'message': 'ISP not found'}), 404

@main.route('/isps/toggle-status/<string:id>', methods=['PATCH'])
@jwt_required()
def toggle_isp_status(id):
    claims = get_jwt()
    company_id = claims['company_id']
    user_id = get_jwt_identity()
    ip_address = request.remote_addr
    user_agent = request.headers.get('User-Agent')
    
    updated_isp = isp_crud.toggle_isp_status(id, company_id, user_id, ip_address, user_agent)
    if updated_isp:
        return jsonify({'message': 'ISP status updated successfully', 'is_active': updated_isp.is_active}), 200
    return jsonify({'message': 'ISP not found'}), 404