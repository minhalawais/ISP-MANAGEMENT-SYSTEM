# app/routes/complaint_routes.py

from flask import jsonify, request
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity
from . import main
from ..crud import complaint_crud
from werkzeug.utils import secure_filename
import os
@main.route('/complaints/list', methods=['GET'])
@jwt_required()
def get_complaints():
    claims = get_jwt()
    company_id = claims['company_id']
    user_role = claims['role']
    employee_id = claims['id']
    complaints = complaint_crud.get_all_complaints(company_id, user_role, employee_id)
    return jsonify(complaints), 200

@main.route('/complaints/add', methods=['POST'])
@jwt_required()
def add_new_complaint():
    data = request.json
    claims = get_jwt()
    company_id = claims['company_id']
    user_role = claims['role']
    current_user_id = get_jwt_identity()
    ip_address = request.remote_addr
    user_agent = request.headers.get('User-Agent')
    try:
        new_complaint = complaint_crud.add_complaint(data, company_id, user_role, current_user_id, ip_address, user_agent)
        return jsonify({'message': 'Complaint added successfully', 'id': str(new_complaint.id)}), 201
    except Exception as e:
        print('Error:', str(e))
        return jsonify({'error': 'Failed to add complaint', 'message': str(e)}), 400

@main.route('/complaints/update/<string:id>', methods=['PUT'])
@jwt_required()
def update_existing_complaint(id):
    data = request.json
    claims = get_jwt()
    company_id = claims['company_id']
    user_role = claims['role']
    current_user_id = get_jwt_identity()
    if 'resolution_proof' in request.files:
        file = request.files['resolution_proof']
        if file:
            filename = secure_filename(file.filename)
            file_path = os.path.join('uploads', 'proofs', filename)
            file.save(file_path)
            data['resolution_proof'] = file_path
    updated_complaint = complaint_crud.update_complaint(id, data, company_id, user_role,current_user_id)
    if updated_complaint:
        return jsonify({'message': 'Complaint updated successfully'}), 200
    return jsonify({'message': 'Complaint not found or you do not have permission to update it'}), 404

@main.route('/complaints/delete/<string:id>', methods=['DELETE'])
@jwt_required()
def delete_existing_complaint(id):
    claims = get_jwt()
    company_id = claims['company_id']
    user_role = claims['role']
    if complaint_crud.delete_complaint(id, company_id, user_role):
        return jsonify({'message': 'Complaint deleted successfully'}), 200
    return jsonify({'message': 'Complaint not found or you do not have permission to delete it'}), 404