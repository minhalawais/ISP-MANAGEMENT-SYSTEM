from flask import jsonify, request, send_file
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity
from . import main
from ..crud import vendor_crud
import os

@main.route('/vendors/list', methods=['GET'])
@jwt_required()
def get_vendors():
    """Get all vendors for the company"""
    claims = get_jwt()
    company_id = claims['company_id']
    user_role = claims['role']
    vendors = vendor_crud.get_all_vendors(company_id, user_role)
    return jsonify(vendors), 200

@main.route('/vendors/<string:id>', methods=['GET'])
@jwt_required()
def get_vendor(id):
    """Get a single vendor by ID"""
    claims = get_jwt()
    company_id = claims['company_id']
    user_role = claims['role']
    vendor = vendor_crud.get_vendor_by_id(id, company_id, user_role)
    if vendor:
        return jsonify(vendor), 200
    return jsonify({'message': 'Vendor not found'}), 404

@main.route('/vendors/add', methods=['POST'])
@jwt_required()
def add_new_vendor():
    """Create a new vendor"""
    claims = get_jwt()
    company_id = claims['company_id']
    user_role = claims['role']
    current_user_id = get_jwt_identity()
    ip_address = request.remote_addr
    user_agent = request.headers.get('User-Agent')
    
    # Handle both form data and files
    data = request.json
    files = request.files
    
    try:
        new_vendor = vendor_crud.add_vendor(data, files, company_id, user_role, current_user_id, ip_address, user_agent)
        return jsonify({
            'message': 'Vendor added successfully',
            'id': str(new_vendor.id)
        }), 201
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': 'Failed to add vendor', 'message': str(e)}), 500

@main.route('/vendors/update/<string:id>', methods=['PUT'])
@jwt_required()
def update_existing_vendor(id):
    """Update an existing vendor"""
    claims = get_jwt()
    company_id = claims['company_id']
    user_role = claims['role']
    current_user_id = get_jwt_identity()
    ip_address = request.remote_addr
    user_agent = request.headers.get('User-Agent')
    
    # Handle both form data and files
    data = request.json
    files = request.files
    
    try:
        updated_vendor = vendor_crud.update_vendor(id, data, files, company_id, user_role, current_user_id, ip_address, user_agent)
        if updated_vendor:
            return jsonify({'message': 'Vendor updated successfully'}), 200
        return jsonify({'message': 'Vendor not found'}), 404
    except Exception as e:
        return jsonify({'error': 'Failed to update vendor', 'message': str(e)}), 500

@main.route('/vendors/delete/<string:id>', methods=['DELETE'])
@jwt_required()
def delete_existing_vendor(id):
    """Delete a vendor"""
    claims = get_jwt()
    company_id = claims['company_id']
    user_role = claims['role']
    current_user_id = get_jwt_identity()
    ip_address = request.remote_addr
    user_agent = request.headers.get('User-Agent')
    
    if vendor_crud.delete_vendor(id, company_id, user_role, current_user_id, ip_address, user_agent):
        return jsonify({'message': 'Vendor deleted successfully'}), 200
    return jsonify({'message': 'Vendor not found'}), 404

@main.route('/vendors/file/<string:vendor_id>/<string:file_type>', methods=['GET'])
@jwt_required()
def get_vendor_file(vendor_id, file_type):
    """Get a vendor's file (picture, cnic_front, cnic_back, agreement)"""
    claims = get_jwt()
    company_id = claims['company_id']
    user_role = claims['role']
    
    vendor = vendor_crud.get_vendor_by_id(vendor_id, company_id, user_role)
    if not vendor:
        return jsonify({'message': 'Vendor not found'}), 404
    
    file_path = None
    if file_type == 'picture':
        file_path = vendor.get('picture')
    elif file_type == 'cnic_front':
        file_path = vendor.get('cnic_front_image')
    elif file_type == 'cnic_back':
        file_path = vendor.get('cnic_back_image')
    elif file_type == 'agreement':
        file_path = vendor.get('agreement_document')
    
    if file_path and os.path.exists(file_path):
        return send_file(file_path)
    return jsonify({'message': 'File not found'}), 404
