from flask import jsonify, request
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity
from . import main
from ..crud import message_crud

@main.route('/messages/list', methods=['GET'])
@jwt_required()
def get_messages():
    claims = get_jwt()
    company_id = claims.get('company_id')
    user_role = claims.get('role')

    messages = message_crud.get_all_messages(company_id, user_role)
    return jsonify(messages), 200

@main.route('/messages/add', methods=['POST'])
@jwt_required()
def add_new_message():
    claims = get_jwt()
    company_id = claims.get('company_id')
    current_user_id = get_jwt_identity()
    user_role = claims.get('role')
    ip_address = request.remote_addr
    user_agent = request.headers.get('User-Agent')

    if user_role not in ['company_owner', 'super_admin']:
        return jsonify({'error': 'Unauthorized action'}), 403

    data = request.json
    data['company_id'] = company_id
    data['sender_id'] = current_user_id
    try:
        new_message = message_crud.add_message(data, current_user_id, ip_address, user_agent)
        return jsonify({'message': 'Message sent successfully', 'id': str(new_message.id)}), 201
    except Exception as e:
        return jsonify({'error': 'Failed to send message', 'message': str(e)}), 400

@main.route('/messages/update/<string:id>', methods=['PUT'])
@jwt_required()
def update_existing_message(id):
    claims = get_jwt()
    company_id = claims.get('company_id')
    user_role = claims.get('role')
    current_user_id = get_jwt_identity()
    ip_address = request.remote_addr
    user_agent = request.headers.get('User-Agent')

    if user_role not in ['company_owner', 'super_admin']:
        return jsonify({'error': 'Unauthorized action'}), 403

    data = request.json
    updated_message = message_crud.update_message(id, data, company_id, user_role, current_user_id, ip_address, user_agent)
    if updated_message:
        return jsonify({'message': 'Message updated successfully'}), 200
    return jsonify({'message': 'Message not found'}), 404

@main.route('/messages/delete/<string:id>', methods=['DELETE'])
@jwt_required()
def delete_existing_message(id):
    claims = get_jwt()
    company_id = claims.get('company_id')
    user_role = claims.get('role')
    current_user_id = get_jwt_identity()
    ip_address = request.remote_addr
    user_agent = request.headers.get('User-Agent')

    if user_role not in ['company_owner', 'super_admin']:
        return jsonify({'error': 'Unauthorized action'}), 403

    if message_crud.delete_message(id, company_id, user_role, current_user_id, ip_address, user_agent):
        return jsonify({'message': 'Message deleted successfully'}), 200
    return jsonify({'message': 'Message not found'}), 404

