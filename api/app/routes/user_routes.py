from flask import jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from . import main
from ..crud import user_crud

@main.route('/user/profile', methods=['GET'])
@jwt_required()
def get_user_profile():
    claims = get_jwt()
    current_user_id = claims.get('id')
    user = user_crud.get_user_by_id(current_user_id)
    if user:
        return jsonify(user), 200
    return jsonify({'message': 'User not found'}), 404

@main.route('/user/profile', methods=['PUT'])
@jwt_required()
def update_user_profile():
    claims = get_jwt()
    current_user_id = claims.get('id')
    ip_address = request.remote_addr
    user_agent = request.headers.get('User-Agent')
    data = request.json
    updated_user = user_crud.update_user(current_user_id, data, current_user_id, ip_address, user_agent)
    if updated_user:
        return jsonify({'message': 'Profile updated successfully'}), 200
    return jsonify({'message': 'Failed to update profile'}), 400

