from flask import jsonify, request,send_file
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity
from . import main
from ..crud import payment_crud
import os
from werkzeug.utils import secure_filename

@main.route('/payments/list', methods=['GET'])
@jwt_required()
def get_payments():
    claims = get_jwt()
    company_id = claims['company_id']
    user_role = claims['role']
    employee_id = claims['id']
    payments = payment_crud.get_all_payments(company_id, user_role,employee_id)
    return jsonify(payments), 200

@main.route('/payments/add', methods=['POST'])
@jwt_required()
def add_new_payment():
    UPLOAD_FOLDER = 'uploads\payment_proofs'
    claims = get_jwt()
    company_id = claims['company_id']
    user_role = claims['role']
    current_user_id = get_jwt_identity()
    ip_address = request.remote_addr
    user_agent = request.headers.get('User-Agent')
    data = request.form.to_dict()
    data['company_id'] = company_id
    print('Data:', data)
    print('Files:', request.files)
    if 'payment_proof' in request.files:
        file = request.files['payment_proof']
        if file and allowed_file(file.filename):
            filename = secure_filename(f"{company_id}_{data['invoice_id']}_{file.filename}")
            file_path = os.path.join(UPLOAD_FOLDER, filename)
            os.makedirs(os.path.dirname(file_path), exist_ok=True)
            file.save(file_path)
            data['payment_proof'] = file_path
    
    try:
        new_payment = payment_crud.add_payment(data, user_role, current_user_id, ip_address, user_agent)
        return jsonify({'message': 'Payment added successfully', 'id': str(new_payment.id)}), 201
    except Exception as e:
        return jsonify({'error': 'Failed to add payment', 'message': str(e)}), 400

@main.route('/payments/update/<string:id>', methods=['PUT'])
@jwt_required()
def update_existing_payment(id):
    claims = get_jwt()
    company_id = claims['company_id']
    user_role = claims['role']
    current_user_id = get_jwt_identity()
    ip_address = request.remote_addr
    user_agent = request.headers.get('User-Agent')
    data = request.json
    
    if 'payment_proof' in request.files:
        file = request.files['payment_proof']
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            file_path = os.path.join(main.config['UPLOAD_FOLDER'], filename)
            file.save(file_path)
            data['payment_proof'] = file_path
    
    updated_payment = payment_crud.update_payment(id, data, company_id, user_role, current_user_id, ip_address, user_agent)
    if updated_payment:
        return jsonify({'message': 'Payment updated successfully'}), 200
    return jsonify({'message': 'Payment not found'}), 404

@main.route('/payments/delete/<string:id>', methods=['DELETE'])
@jwt_required()
def delete_existing_payment(id):
    claims = get_jwt()
    company_id = claims['company_id']
    user_role = claims['role']
    current_user_id = get_jwt_identity()
    ip_address = request.remote_addr
    user_agent = request.headers.get('User-Agent')
    if payment_crud.delete_payment(id, company_id, user_role, current_user_id, ip_address, user_agent):
        return jsonify({'message': 'Payment deleted successfully'}), 200
    return jsonify({'message': 'Payment not found'}), 404

def allowed_file(filename):
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'pdf'}
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@main.route('/payments/proof-image/<string:id>', methods=['GET'])
@jwt_required()
def get_payment_proof_image(id):
    """
    Fetches and returns the payment proof image for a given invoice ID if it exists.
    """
    UPLOAD_FOLDER_PATH = 'D:\\PycharmProjects\\isp-management-system\\api'
    claims = get_jwt()
    company_id = claims.get('company_id')

    try:
        payment_proof = payment_crud.get_payment_proof(id, company_id)
        if payment_proof and payment_proof.get('proof_of_payment'):
            proof_image_path = os.path.join(UPLOAD_FOLDER_PATH, payment_proof['proof_of_payment'])
            if os.path.exists(proof_image_path):
                return send_file(proof_image_path, mimetype='image/jpeg')
            else:
                return jsonify({'error': 'Payment proof image file not found'}), 404
        return jsonify({'error': 'Payment proof not found'}), 404
    except Exception as error:
        return jsonify({'error': 'An error occurred while retrieving the payment proof image'}), 500

