from flask import jsonify, request, send_file
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity
from . import main
from ..crud import isp_payment_crud
import os
from werkzeug.utils import secure_filename
import uuid

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
UPLOAD_FOLDER = os.path.join(PROJECT_ROOT, 'uploads', 'isp_payment_proofs')
@main.route('/isp-payments/list', methods=['GET'])
@jwt_required()
def get_isp_payments():
    claims = get_jwt()
    company_id = claims['company_id']
    user_role = claims['role']
    employee_id = claims['id']
    
    try:
        payments = isp_payment_crud.get_all_isp_payments(company_id, user_role, employee_id)
        return jsonify(payments), 200
    except Exception as e:
        return jsonify({'error': 'Failed to fetch ISP payments', 'message': str(e)}), 500

@main.route('/isp-payments/add', methods=['POST'])
@jwt_required()
def add_new_isp_payment():
    claims = get_jwt()
    company_id = claims['company_id']
    user_role = claims['role']
    current_user_id = get_jwt_identity()
    ip_address = request.remote_addr
    user_agent = request.headers.get('User-Agent')
    
    # Handle both JSON and form data
    if request.is_json:
        data = request.get_json()
    else:
        data = request.form.to_dict()
    
    data['company_id'] = company_id
    data['processed_by'] = current_user_id
    
    # Handle numeric conversions
    if 'amount' in data:
        data['amount'] = float(data['amount'])
    if 'bandwidth_usage_gb' in data and data['bandwidth_usage_gb']:
        data['bandwidth_usage_gb'] = float(data['bandwidth_usage_gb'])
    
    try:
        new_payment = isp_payment_crud.add_isp_payment(data, user_role, current_user_id, ip_address, user_agent)
        return jsonify({'message': 'ISP payment added successfully', 'id': str(new_payment.id)}), 201
    except Exception as e:
        return jsonify({'error': 'Failed to add ISP payment', 'message': str(e)}), 400

@main.route('/isp-payments/update/<string:id>', methods=['PUT'])
@jwt_required()
def update_existing_isp_payment(id):
    claims = get_jwt()
    company_id = claims['company_id']
    user_role = claims['role']
    current_user_id = get_jwt_identity()
    ip_address = request.remote_addr
    user_agent = request.headers.get('User-Agent')
    
    # Handle both JSON and form data
    if request.is_json:
        data = request.get_json()
    else:
        data = request.form.to_dict()
    
    try:
        updated_payment = isp_payment_crud.update_isp_payment(id, data, company_id, user_role, current_user_id, ip_address, user_agent)
        if updated_payment:
            return jsonify({'message': 'ISP payment updated successfully'}), 200
        return jsonify({'message': 'ISP payment not found'}), 404
    except Exception as e:
        return jsonify({'error': 'Failed to update ISP payment', 'message': str(e)}), 400

@main.route('/isp-payments/delete/<string:id>', methods=['DELETE'])
@jwt_required()
def delete_existing_isp_payment(id):
    claims = get_jwt()
    company_id = claims['company_id']
    user_role = claims['role']
    current_user_id = get_jwt_identity()
    ip_address = request.remote_addr
    user_agent = request.headers.get('User-Agent')
    
    try:
        if isp_payment_crud.delete_isp_payment(id, company_id, user_role, current_user_id, ip_address, user_agent):
            return jsonify({'message': 'ISP payment deleted successfully'}), 200
        return jsonify({'message': 'ISP payment not found'}), 404
    except Exception as e:
        return jsonify({'error': 'Failed to delete ISP payment', 'message': str(e)}), 400

@main.route('/isp-payments/proof-image/<string:id>', methods=['GET'])
@jwt_required()
def get_isp_payment_proof_image(id):
    claims = get_jwt()
    company_id = claims.get('company_id')

    try:
        payment_proof = isp_payment_crud.get_isp_payment_proof(id, company_id)
        if payment_proof and payment_proof.get('proof_of_payment'):
            proof_image_path = os.path.join(PROJECT_ROOT, payment_proof['proof_of_payment'])
            if os.path.exists(proof_image_path):
                return send_file(proof_image_path, mimetype='image/jpeg')
            else:
                return jsonify({'error': 'ISP payment proof image file not found'}), 404
        return jsonify({'error': 'ISP payment proof not found'}), 404
    except Exception as error:
        return jsonify({'error': 'An error occurred while retrieving the ISP payment proof image'}), 500

def allowed_file(filename):
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'pdf'}
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@main.route('/isp-payments/upload-file/<string:file_type>', methods=['POST'])
@jwt_required()
def upload_isp_payment_file(file_type):
    claims = get_jwt()
    company_id = claims['company_id']
    
    if file_type not in ['payment_proof']:
        return jsonify({'error': 'Invalid file type'}), 400
    
    if file_type not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files[file_type]
    
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    if file and allowed_file(file.filename):
        # Generate a unique filename with UUID to prevent collisions
        file_extension = file.filename.rsplit('.', 1)[1].lower()
        unique_filename = f"{uuid.uuid4()}_{file_type}.{file_extension}"
        
        # Create relative path
        relative_path = os.path.join('uploads', 'isp_payment_proofs', unique_filename)
        file_path = os.path.join(PROJECT_ROOT, relative_path)
        
        # Ensure directory exists
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        
        # Save the file
        file.save(file_path)
        
        # Return the relative file path to be stored in the payment record
        return jsonify({
            'success': True,
            'file_path': relative_path,
            'file_name': unique_filename,
            'file_type': file_extension,
            'message': 'File uploaded successfully'
        }), 200
    
    return jsonify({'error': 'Invalid file format'}), 400