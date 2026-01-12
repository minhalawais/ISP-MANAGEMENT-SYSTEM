from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity,  get_jwt
from app.crud.internal_transfer_crud import create_internal_transfer, delete_internal_transfer, get_internal_transfers
from . import main
import logging

logger = logging.getLogger(__name__)

@main.route('/transfers/add', methods=['POST'])
@jwt_required()
def create_transfer():
    current_user_id = get_jwt_identity()
    claims = get_jwt()
    company_id = claims.get('company_id')
    
    data = request.get_json()
    data['company_id'] = company_id
    
    try:
        transfer = create_internal_transfer(
            data,
            current_user_id,
            request.remote_addr,
            request.user_agent.string
        )
        return jsonify({'message': 'Transfer successful', 'id': str(transfer.id)}), 201
    except ValueError as e:
        return jsonify({'message': str(e)}), 400
    except Exception as e:
        logger.error(f"Transfer error: {str(e)}")
        return jsonify({'message': 'Internal server error'}), 500

@main.route('/transfers/<transfer_id>', methods=['DELETE'])
@jwt_required()
def delete_transfer(transfer_id):
    current_user_id = get_jwt_identity()
    
    try:
        delete_internal_transfer(
            transfer_id,
            current_user_id,
            request.remote_addr,
            request.user_agent.string
        )
        return jsonify({'message': 'Transfer reversed successfully'}), 200
    except ValueError as e:
        return jsonify({'message': str(e)}), 400
    except Exception as e:
        return jsonify({'message': 'Internal server error'}), 500

@main.route('/transfers/list', methods=['GET'])
@jwt_required()
def list_transfers():
    claims = get_jwt()
    company_id = claims.get('company_id')
    
    filters = {
        'start_date': request.args.get('start_date'),
        'end_date': request.args.get('end_date'),
        'from_account_id': request.args.get('from_account_id'),
        'to_account_id': request.args.get('to_account_id'),
    }
    # remove None values
    filters = {k: v for k, v in filters.items() if v}

    try:
        transfers = get_internal_transfers(company_id, filters)
        return jsonify([{
            'id': t.id,
            'from_account_id': t.from_account_id,
            'from_account_name': t.from_account.bank_name + ' - ' + t.from_account.account_number,
            'to_account_id': t.to_account_id,
            'to_account_name': t.to_account.bank_name + ' - ' + t.to_account.account_number,
            'amount': float(t.amount),
            'date': t.transfer_date.isoformat(),
            'description': t.description,
            'reference': t.reference_number,
            'status': t.status
        } for t in transfers]), 200
    except Exception as e:
        return jsonify({'message': 'Internal server error'}), 500
