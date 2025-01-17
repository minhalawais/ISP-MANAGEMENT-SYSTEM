from flask import jsonify, request, send_file
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity
from . import main
from ..crud import customer_crud
from werkzeug.utils import secure_filename
import os

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}
UPLOAD_FOLDER = 'uploads\cnic_images'

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
    
    # Get form data
    data = request.form.to_dict()
    data['company_id'] = company_id
    
    print('Form data:', data)
    print('Files:', request.files)
    
    # Handle CNIC image upload
    if 'cnic_image' in request.files:
        file = request.files['cnic_image']
        print(allowed_file(file.filename) if file else None)
        if file and allowed_file(file.filename):
            filename = secure_filename(f"{data['first_name']}_{data['cnic']}.{file.filename.rsplit('.', 1)[1].lower()}")
            file_path = os.path.join(UPLOAD_FOLDER, filename)
            os.makedirs(os.path.dirname(file_path), exist_ok=True)
            file.save(file_path)
            data['cnic_image'] = file_path
        else:
            print('Invalid file:', file.filename if file else None)
    else:
        print('No cnic_image in request.files')
        data['cnic_image'] = None
    
    try:
        new_customer = customer_crud.add_customer(data, user_role, current_user_id, ip_address, user_agent, company_id)
        return jsonify({'message': 'Customer added successfully', 'id': str(new_customer.id)}), 201
    except Exception as e:
        print('Error:', str(e))
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

@main.route('/customers/cnic-image/<string:id>', methods=['GET'])
@jwt_required()
def get_cnic_image(id):
    UPLOAD_FOLDER = 'D:\\PycharmProjects\\isp-management-system\\api'

    claims = get_jwt()
    company_id = claims['company_id']
    customer = customer_crud.get_customer_details(id, company_id)
    if customer and customer.get('cnic_image'):
        cnic_image_path = os.path.join(UPLOAD_FOLDER, customer['cnic_image'])
        if os.path.exists(cnic_image_path):
            return send_file(cnic_image_path, mimetype='image/jpeg')
        else:
            return jsonify({'error': 'CNIC image file not found'}), 404
    return jsonify({'error': 'CNIC image not found'}), 404

