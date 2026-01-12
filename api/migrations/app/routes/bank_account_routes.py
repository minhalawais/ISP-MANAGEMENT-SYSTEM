from flask import jsonify, request
from flask_jwt_extended import jwt_required, get_jwt,get_jwt_identity
from . import main
from ..crud import bank_account_crud
import uuid

@main.route('/bank-accounts/list', methods=['GET'])
@jwt_required()
def get_bank_accounts():
    claims = get_jwt()
    company_id = claims['company_id']
    user_role = claims['role']
    active_only = request.args.get('active_only', 'false').lower() == 'true'
    try:
        bank_accounts = bank_account_crud.get_all_bank_accounts(company_id, user_role, active_only=active_only)
        return jsonify(bank_accounts), 200
    except Exception as e:
        return jsonify({'error': 'Failed to fetch bank accounts', 'message': str(e)}), 400

@main.route('/bank-accounts/add', methods=['POST'])
@jwt_required()
def add_new_bank_account():
    claims = get_jwt()
    company_id = claims['company_id']
    user_role = claims['role']
    current_user_id = get_jwt_identity()
    ip_address = request.remote_addr
    user_agent = request.headers.get('User-Agent')
    data = request.json
    
    try:
        data['company_id'] = company_id
        new_bank_account = bank_account_crud.add_bank_account(
            data, user_role, current_user_id, ip_address, user_agent
        )
        return jsonify({'message': 'Bank account added successfully', 'id': str(new_bank_account.id)}), 201
    except Exception as e:
        return jsonify({'error': 'Failed to add bank account', 'message': str(e)}), 400

@main.route('/bank-accounts/update/<string:id>', methods=['PUT'])
@jwt_required()
def update_existing_bank_account(id):
    claims = get_jwt()
    company_id = claims['company_id']
    user_role = claims['role']
    current_user_id = get_jwt_identity()
    ip_address = request.remote_addr
    user_agent = request.headers.get('User-Agent')
    data = request.json
    
    try:
        updated_bank_account = bank_account_crud.update_bank_account(
            id, data, company_id, user_role, current_user_id, ip_address, user_agent
        )
        if updated_bank_account:
            return jsonify({'message': 'Bank account updated successfully'}), 200
        return jsonify({'message': 'Bank account not found'}), 404
    except Exception as e:
        return jsonify({'error': 'Failed to update bank account', 'message': str(e)}), 400

@main.route('/bank-accounts/delete/<string:id>', methods=['DELETE'])
@jwt_required()
def delete_existing_bank_account(id):
    claims = get_jwt()
    company_id = claims['company_id']
    user_role = claims['role']
    current_user_id = get_jwt_identity()
    ip_address = request.remote_addr
    user_agent = request.headers.get('User-Agent')
    
    try:
        if bank_account_crud.delete_bank_account(
            id, company_id, user_role, current_user_id, ip_address, user_agent
        ):
            return jsonify({'message': 'Bank account deleted successfully'}), 200
        return jsonify({'message': 'Bank account not found'}), 404
    except Exception as e:
        return jsonify({'error': 'Failed to delete bank account', 'message': str(e)}), 400