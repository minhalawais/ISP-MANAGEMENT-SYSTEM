# app/routes/complaint_routes.py

from flask import jsonify, request, send_file,current_app
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity
from . import main
from ..crud import complaint_crud,customer_crud
from werkzeug.utils import secure_filename
import os

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
UPLOAD_FOLDER = os.path.join(PROJECT_ROOT, 'uploads', 'complaints')
ALLOWED_EXTENSIONS = {'pdf', 'png', 'jpg', 'jpeg', 'gif'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS
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
    try:
        claims = get_jwt()
        company_id = claims['company_id']
        user_role = claims['role']
        current_user_id = get_jwt_identity()
        ip_address = request.remote_addr
        user_agent = request.headers.get('User-Agent')

        data = request.form.to_dict()

        # Generate ticket number before saving the file
        ticket_number = complaint_crud.generate_ticket_number(data['customer_id'])  # Assuming this function exists
        data['ticket_number'] = ticket_number

        if 'attachment' in request.files:
            file = request.files['attachment']
            if file and allowed_file(file.filename):
                # Get the file extension
                file_extension = os.path.splitext(secure_filename(file.filename))[1]

                # Format filename using the ticket number
                formatted_filename = f"complaint_{ticket_number}{file_extension}"
                file_path = os.path.join(UPLOAD_FOLDER, formatted_filename)

                # Ensure directory exists
                os.makedirs(os.path.dirname(file_path), exist_ok=True)

                # Save file
                file.save(file_path)
                data['attachment_path'] = file_path

        # Call the function to add complaint
        new_complaint, ticket_number = complaint_crud.add_complaint(data, company_id, user_role, current_user_id, ip_address, user_agent)

        if new_complaint:
            return jsonify({'message': 'Complaint added successfully', 'id': str(new_complaint.id), 'ticket_number': ticket_number}), 201
        else:
            return jsonify({'error': 'Failed to add complaint'}), 400

    except Exception as e:
        print(f"Error: {str(e)}")
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


@main.route('/complaints/search-customer', methods=['GET'])
@jwt_required()
def search_customer():
    search_term = request.args.get('search_term')
    if not search_term:
        return jsonify({'error': 'Search term is required'}), 400

    claims = get_jwt()
    company_id = claims['company_id']
    
    customer = customer_crud.search_customer(company_id, search_term)
    if customer:
        return jsonify(customer), 200
    else:
        return jsonify({'error': 'Customer not found'}), 404

@main.route('/complaints/attachment/<string:id>', methods=['GET'])
@jwt_required()
def get_complaint_attachment(id):
    claims = get_jwt()
    company_id = claims['company_id']
    complaint = complaint_crud.get_complaint_attachment(id, company_id)
    if complaint and complaint.attachment_path:
        attachment_path = os.path.join(os.getcwd(), complaint.attachment_path)
        if os.path.exists(attachment_path):
            return send_file(attachment_path, as_attachment=True)
        else:
            return jsonify({'error': 'Attachment file not found'}), 404
    return jsonify({'error': 'Attachment not found'}), 404

@main.route('/complaints/<string:id>', methods=['GET'])
@jwt_required()
def get_complaint_detail(id):
    claims = get_jwt()
    company_id = claims['company_id']
    user_role = claims['role']
    current_user_id = get_jwt_identity()
    
    complaint = complaint_crud.get_complaint_by_id(id, company_id, user_role, current_user_id)
    
    if complaint:
        return jsonify(complaint), 200
    else:
        return jsonify({"error": "Complaint not found or insufficient permissions."}), 404


@main.route('/complaints/resolution-proof/<string:id>', methods=['GET'])
@jwt_required()
def get_resolution_proof(id):
    claims = get_jwt()
    company_id = claims['company_id']
    
    resolution_path = complaint_crud.get_resolution_proof_path(id, company_id)
    
    if resolution_path:
        return send_file(resolution_path, as_attachment=True)
    else:
        return jsonify({'error': 'Resolution proof not found or inaccessible'}), 404


@main.route('/complaints/update-remarks/<string:id>', methods=['PUT'])
@jwt_required()
def update_complaint_remarks(id):
    """
    Update only the remarks field of a complaint.
    """
    try:
        data = request.json
        
        if 'remarks' not in data:
            return jsonify({"error": "Remarks field is required"}), 400
            
        claims = get_jwt()
        company_id = claims['company_id']
        user_role = claims['role']
        current_user_id = get_jwt_identity()
        
        result = complaint_crud.update_complaint_remarks(
            id, 
            data['remarks'], 
            company_id, 
            user_role, 
            current_user_id
        )
        
        if isinstance(result, dict) and 'error' in result:
            return jsonify({"error": result['error']}), 400
            
        return jsonify({"message": "Remarks updated successfully"}), 200
        
    except Exception as e:
        logger.error(f"Error updating complaint remarks: {e}")
        return jsonify({"error": "An error occurred while updating remarks"}), 500

