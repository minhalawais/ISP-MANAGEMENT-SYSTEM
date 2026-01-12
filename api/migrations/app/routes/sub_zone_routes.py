from flask import jsonify, request
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity
from . import main
from ..crud import sub_zone_crud

@main.route('/sub-zones/list', methods=['GET'])
@jwt_required()
def get_sub_zones():
    """Get all sub-zones for the company"""
    claims = get_jwt()
    company_id = claims['company_id']
    user_role = claims['role']
    sub_zones = sub_zone_crud.get_all_sub_zones(company_id, user_role)
    return jsonify(sub_zones), 200

@main.route('/sub-zones/by-area/<string:area_id>', methods=['GET'])
@jwt_required()
def get_sub_zones_by_area(area_id):
    """Get all sub-zones for a specific area"""
    claims = get_jwt()
    company_id = claims['company_id']
    sub_zones = sub_zone_crud.get_sub_zones_by_area(area_id, company_id)
    return jsonify(sub_zones), 200

@main.route('/sub-zones/add', methods=['POST'])
@jwt_required()
def add_new_sub_zone():
    """Create a new sub-zone"""
    claims = get_jwt()
    company_id = claims['company_id']
    user_role = claims['role']
    current_user_id = get_jwt_identity()
    ip_address = request.remote_addr
    user_agent = request.headers.get('User-Agent')
    data = request.json
    data['company_id'] = company_id
    
    try:
        new_sub_zone = sub_zone_crud.add_sub_zone(data, user_role, current_user_id, ip_address, user_agent)
        return jsonify({
            'message': 'Sub-zone added successfully',
            'id': str(new_sub_zone.id)
        }), 201
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': 'Failed to add sub-zone', 'message': str(e)}), 500

@main.route('/sub-zones/update/<string:id>', methods=['PUT'])
@jwt_required()
def update_existing_sub_zone(id):
    """Update an existing sub-zone"""
    claims = get_jwt()
    company_id = claims['company_id']
    user_role = claims['role']
    current_user_id = get_jwt_identity()
    ip_address = request.remote_addr
    user_agent = request.headers.get('User-Agent')
    data = request.json
    
    try:
        updated_sub_zone = sub_zone_crud.update_sub_zone(id, data, company_id, user_role, current_user_id, ip_address, user_agent)
        if updated_sub_zone:
            return jsonify({'message': 'Sub-zone updated successfully'}), 200
        return jsonify({'message': 'Sub-zone not found'}), 404
    except Exception as e:
        return jsonify({'error': 'Failed to update sub-zone', 'message': str(e)}), 500

@main.route('/sub-zones/delete/<string:id>', methods=['DELETE'])
@jwt_required()
def delete_existing_sub_zone(id):
    """Delete a sub-zone"""
    claims = get_jwt()
    company_id = claims['company_id']
    user_role = claims['role']
    current_user_id = get_jwt_identity()
    ip_address = request.remote_addr
    user_agent = request.headers.get('User-Agent')
    
    if sub_zone_crud.delete_sub_zone(id, company_id, user_role, current_user_id, ip_address, user_agent):
        return jsonify({'message': 'Sub-zone deleted successfully'}), 200
    return jsonify({'message': 'Sub-zone not found'}), 404
