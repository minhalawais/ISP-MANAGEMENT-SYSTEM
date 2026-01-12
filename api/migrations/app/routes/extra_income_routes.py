from flask import jsonify, request
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity
from . import main
from ..crud import extra_income_crud
import os
from werkzeug.utils import secure_filename
from datetime import datetime

UPLOAD_FOLDER = 'uploads/extra_income'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'pdf'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def save_payment_proof(file, income_id):
    if not file or not file.filename:
        return None
    if not allowed_file(file.filename):
        raise ValueError("Invalid file type")
    
    # Create directory if not exists
    upload_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), UPLOAD_FOLDER)
    os.makedirs(upload_dir, exist_ok=True)
    
    ext = file.filename.rsplit('.', 1)[1].lower()
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = f"income_{income_id}_{timestamp}.{ext}"
    filepath = os.path.join(upload_dir, filename)
    file.save(filepath)
    return f"{UPLOAD_FOLDER}/{filename}"
@main.route('/extra-incomes/list', methods=['GET'])
@jwt_required()
def get_extra_incomes():
    claims = get_jwt()
    company_id = claims['company_id']
    user_role = claims['role']
    try:
        incomes = extra_income_crud.get_all_extra_incomes(company_id, user_role)
        return jsonify(incomes), 200
    except Exception as e:
        return jsonify({'error': 'Failed to fetch extra incomes', 'message': str(e)}), 400

@main.route('/extra-incomes/add', methods=['POST'])
@jwt_required()
def add_extra_income():
    claims = get_jwt()
    company_id = claims['company_id']
    user_role = claims['role']
    current_user_id = get_jwt_identity()
    
    # Handle both JSON and form data
    if request.content_type and 'multipart/form-data' in request.content_type:
        data = request.form.to_dict()
        file = request.files.get('payment_proof')
    else:
        data = request.json
        file = None
    
    try:
        data['company_id'] = company_id
        new_income = extra_income_crud.add_extra_income(data, user_role, current_user_id, request.remote_addr, request.headers.get('User-Agent'))
        
        # Handle file upload after income is created
        if file and file.filename:
            proof_path = save_payment_proof(file, new_income.id)
            extra_income_crud.update_extra_income(str(new_income.id), {'payment_proof': proof_path}, company_id, user_role, current_user_id, request.remote_addr, request.headers.get('User-Agent'))
        
        return jsonify({'message': 'Extra income added successfully', 'id': str(new_income.id)}), 201
    except Exception as e:
        return jsonify({'error': 'Failed to add extra income', 'message': str(e)}), 400

@main.route('/extra-incomes/update/<string:id>', methods=['PUT'])
@jwt_required()
def update_extra_income(id):
    claims = get_jwt()
    company_id = claims['company_id']
    user_role = claims['role']
    current_user_id = get_jwt_identity()
    
    # Handle both JSON and form data
    if request.content_type and 'multipart/form-data' in request.content_type:
        data = request.form.to_dict()
        file = request.files.get('payment_proof')
    else:
        data = request.json
        file = None
    
    try:
        # Handle file upload
        if file and file.filename:
            data['payment_proof'] = save_payment_proof(file, id)
        
        updated_income = extra_income_crud.update_extra_income(id, data, company_id, user_role, current_user_id, request.remote_addr, request.headers.get('User-Agent'))
        if updated_income:
            return jsonify({'message': 'Extra income updated successfully'}), 200
        return jsonify({'message': 'Extra income not found'}), 404
    except Exception as e:
        return jsonify({'error': 'Failed to update extra income', 'message': str(e)}), 400

@main.route('/extra-incomes/delete/<string:id>', methods=['DELETE'])
@jwt_required()
def delete_extra_income(id):
    claims = get_jwt()
    company_id = claims['company_id']
    user_role = claims['role']
    current_user_id = get_jwt_identity()
    
    try:
        if extra_income_crud.delete_extra_income(id, company_id, user_role, current_user_id, request.remote_addr, request.headers.get('User-Agent')):
            return jsonify({'message': 'Extra income deleted successfully'}), 200
        return jsonify({'message': 'Extra income not found'}), 404
    except Exception as e:
        return jsonify({'error': 'Failed to delete extra income', 'message': str(e)}), 400

@main.route('/extra-income-types/list', methods=['GET'])
@jwt_required()
def get_extra_income_types():
    claims = get_jwt()
    company_id = claims['company_id']
    user_role = claims['role']
    try:
        income_types = extra_income_crud.get_all_extra_income_types(company_id, user_role)
        return jsonify(income_types), 200
    except Exception as e:
        print('Error: ',e)
        return jsonify({'error': 'Failed to fetch extra income types', 'message': str(e)}), 400

@main.route('/extra-income-types/add', methods=['POST'])
@jwt_required()
def add_extra_income_type():
    claims = get_jwt()
    company_id = claims['company_id']
    user_role = claims['role']
    current_user_id = get_jwt_identity()
    data = request.json
    
    try:
        data['company_id'] = company_id
        new_income_type = extra_income_crud.add_extra_income_type(data, user_role, current_user_id, request.remote_addr, request.headers.get('User-Agent'))
        return jsonify({'message': 'Extra income type added successfully', 'id': str(new_income_type.id)}), 201
    except Exception as e:
        print('Error: ',e)
        return jsonify({'error': 'Failed to add extra income type', 'message': str(e)}), 400

@main.route('/extra-income-types/update/<string:id>', methods=['PUT'])
@jwt_required()
def update_extra_income_type(id):
    claims = get_jwt()
    company_id = claims['company_id']
    user_role = claims['role']
    current_user_id = get_jwt_identity()
    data = request.json
    
    try:
        updated_income_type = extra_income_crud.update_extra_income_type(id, data, company_id, user_role, current_user_id, request.remote_addr, request.headers.get('User-Agent'))
        if updated_income_type:
            return jsonify({'message': 'Extra income type updated successfully'}), 200
        return jsonify({'message': 'Extra income type not found'}), 404
    except Exception as e:
        return jsonify({'error': 'Failed to update extra income type', 'message': str(e)}), 400

@main.route('/extra-income-types/delete/<string:id>', methods=['DELETE'])
@jwt_required()
def delete_extra_income_type(id):
    claims = get_jwt()
    company_id = claims['company_id']
    user_role = claims['role']
    current_user_id = get_jwt_identity()
    
    try:
        if extra_income_crud.delete_extra_income_type(id, company_id, user_role, current_user_id, request.remote_addr, request.headers.get('User-Agent')):
            return jsonify({'message': 'Extra income type deleted successfully'}), 200
        return jsonify({'message': 'Extra income type not found'}), 404
    except Exception as e:
        return jsonify({'error': 'Failed to delete extra income type', 'message': str(e)}), 400