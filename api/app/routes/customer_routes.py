from flask import jsonify, request, send_file,current_app
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity
from . import main
from ..crud import customer_crud
from werkzeug.utils import secure_filename
import os

UPLOAD_FOLDER = os.path.join(current_app.root_path, 'uploads/cnic_images')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'pdf'}
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@main.route('/customers/list', methods=['GET'])
@jwt_required()
def get_customers():
    claims = get_jwt()
    company_id = claims['company_id']
    user_role = claims['role']
    employee_id = get_jwt_identity()
    customers = customer_crud.get_all_customers(company_id, user_role, employee_id)
    return jsonify(customers), 200

@main.route('/customers/add', methods=['POST'])
@jwt_required()
def add_new_customer():
    claims = get_jwt()
    company_id = claims['company_id']
    user_role = claims['role']
    current_user_id = get_jwt_identity()
    ip_address = request.remote_addr
    user_agent = request.headers.get('User-Agent')
    
    data = request.form.to_dict()
    data['company_id'] = company_id
    
    if 'cnic_front_image' in request.files:
        file = request.files['cnic_front_image']
        if file and allowed_file(file.filename):
            filename = secure_filename(f"{data['first_name']}_{data['cnic']}_front.{file.filename.rsplit('.', 1)[1].lower()}")
            file_path = os.path.join(UPLOAD_FOLDER, filename)
            os.makedirs(os.path.dirname(file_path), exist_ok=True)
            file.save(file_path)
            data['cnic_front_image'] = file_path
        else:
            return jsonify({'error': 'Invalid file format for CNIC front image'}), 400
    else:
        data['cnic_front_image'] = None

    if 'cnic_back_image' in request.files:
        file = request.files['cnic_back_image']
        if file and allowed_file(file.filename):
            filename = secure_filename(f"{data['first_name']}_{data['cnic']}_back.{file.filename.rsplit('.', 1)[1].lower()}")
            file_path = os.path.join(UPLOAD_FOLDER, filename)
            os.makedirs(os.path.dirname(file_path), exist_ok=True)
            file.save(file_path)
            data['cnic_back_image'] = file_path
        else:
            return jsonify({'error': 'Invalid file format for CNIC back image'}), 400
    else:
        data['cnic_back_image'] = None
    
    if 'agreement_document' in request.files:
        file = request.files['agreement_document']
        if file and allowed_file(file.filename):
            filename = secure_filename(f"{data['first_name']}_{data['cnic']}_agreement.{file.filename.rsplit('.', 1)[1].lower()}")
            file_path = os.path.join(UPLOAD_FOLDER, filename)
            os.makedirs(os.path.dirname(file_path), exist_ok=True)
            file.save(file_path)
            data['agreement_document'] = file_path
        else:
            return jsonify({'error': 'Invalid file format for agreement document'}), 400
    else:
        data['agreement_document'] = None
    
    try:
        new_customer = customer_crud.add_customer(data, user_role, current_user_id, ip_address, user_agent, company_id)
        return jsonify({'message': 'Customer added successfully', 'id': str(new_customer.id)}), 201
    except Exception as e:
        return jsonify({'error': 'Failed to add customer', 'message': str(e)}), 400

    
@main.route('/customers/update/<string:id>', methods=['PUT'])
@jwt_required()
def update_existing_customer(id):
    claims = get_jwt()
    company_id = claims['company_id']
    user_role = claims['role']
    current_user_id = get_jwt_identity()
    ip_address = request.remote_addr
    user_agent = request.headers.get('User-Agent')
    data = request.json
    updated_customer = customer_crud.update_customer(id, data, company_id, user_role, current_user_id, ip_address, user_agent)
    if updated_customer:
        return jsonify({'message': 'Customer updated successfully'}), 200
    return jsonify({'message': 'Customer not found'}), 404

@main.route('/customers/delete/<string:id>', methods=['DELETE'])
@jwt_required()
def delete_existing_customer(id):
    claims = get_jwt()
    company_id = claims['company_id']
    user_role = claims['role']
    current_user_id = get_jwt_identity()
    ip_address = request.remote_addr
    user_agent = request.headers.get('User-Agent')
    if customer_crud.delete_customer(id, company_id, user_role, current_user_id, ip_address, user_agent):
        return jsonify({'message': 'Customer deleted successfully'}), 200
    return jsonify({'message': 'Customer not found'}), 404

@main.route('/customers/toggle-status/<string:id>', methods=['PATCH'])
@jwt_required()
def toggle_customer_active_status(id):
    claims = get_jwt()
    company_id = claims['company_id']
    user_role = claims['role']
    current_user_id = get_jwt_identity()
    ip_address = request.remote_addr
    user_agent = request.headers.get('User-Agent')
    customer = customer_crud.toggle_customer_status(id, company_id, user_role, current_user_id, ip_address, user_agent)
    if customer:
        return jsonify({'message': f"Customer {'activated' if customer.is_active else 'deactivated'} successfully"}), 200
    return jsonify({'message': 'Customer not found'}), 404

@main.route('/customers/<string:id>', methods=['GET'])
@jwt_required()
def get_customer_details(id):
    claims = get_jwt()
    company_id = claims['company_id']
    customer = customer_crud.get_customer_details(id, company_id)
    if customer:
        return jsonify(customer), 200
    return jsonify({'message': 'Customer not found'}), 404

@main.route('/invoices/customer/<string:id>', methods=['GET'])
@jwt_required()
def get_customer_invoices(id):
    claims = get_jwt()
    company_id = claims['company_id']
    invoices = customer_crud.get_customer_invoices(id, company_id)
    return jsonify(invoices), 200

@main.route('/payments/customer/<string:id>', methods=['GET'])
@jwt_required()
def get_customer_payments(id):
    claims = get_jwt()
    company_id = claims['company_id']
    payments = customer_crud.get_customer_payments(id, company_id)
    return jsonify(payments), 200

@main.route('/complaints/customer/<string:id>', methods=['GET'])
@jwt_required()
def get_customer_complaints(id):
    claims = get_jwt()
    company_id = claims['company_id']
    complaints = customer_crud.get_customer_complaints(id, company_id)
    return jsonify(complaints), 200

@main.route('/customers/cnic-front-image/<string:id>', methods=['GET'])
@jwt_required()
def get_cnic_front_image(id):
    claims = get_jwt()
    company_id = claims['company_id']
    customer = customer_crud.get_customer_cnic(id, company_id)
    if customer and customer.cnic_front_image:
        cnic_image_path = os.path.join(PROJECT_ROOT, customer.cnic_front_image)
        if os.path.exists(cnic_image_path):
            return send_file(cnic_image_path, mimetype='image/jpeg')
        else:
            return jsonify({'error': 'CNIC front image file not found'}), 404
    return jsonify({'error': 'CNIC front image not found'}), 404

@main.route('/customers/cnic-back-image/<string:id>', methods=['GET'])
@jwt_required()
def get_cnic_back_image(id):
    claims = get_jwt()
    company_id = claims['company_id']
    customer = customer_crud.get_customer_cnic(id, company_id)
    if customer and customer.cnic_back_image:
        cnic_image_path = os.path.join(PROJECT_ROOT, customer.cnic_back_image)
        if os.path.exists(cnic_image_path):
            print('Document : ',cnic_image_path)
            return send_file(cnic_image_path, mimetype='image/jpeg')
        else:
            return jsonify({'error': 'CNIC back image file not found'}), 404
    return jsonify({'error': 'CNIC back image not found'}), 404

@main.route('/customers/agreement-document/<string:id>', methods=['GET'])
@jwt_required()
def get_agreement_document(id):
    claims = get_jwt()
    company_id = claims['company_id']
    customer = customer_crud.get_customer_details(id, company_id)
    if customer and customer['agreement_document']:
        agreement_document_path = os.path.join(PROJECT_ROOT, customer['agreement_document'])
        if os.path.exists(agreement_document_path):
            print('Document : ',agreement_document_path)
            return send_file(agreement_document_path, mimetype='image/jpeg')
        else:
            return jsonify({'error': 'Agreement document file not found'}), 404
    return jsonify({'error': 'Agreement document not found'}), 404

