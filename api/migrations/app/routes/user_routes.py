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


@main.route('/user/change-password', methods=['POST'])
@jwt_required()
def change_password():
    """
    Change the current user's password.
    Requires current password verification.
    """
    claims = get_jwt()
    current_user_id = claims.get('id')
    ip_address = request.remote_addr
    user_agent = request.headers.get('User-Agent')
    
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    current_password = data.get('current_password')
    new_password = data.get('new_password')
    confirm_password = data.get('confirm_password')
    
    if not current_password or not new_password:
        return jsonify({'error': 'Current password and new password are required'}), 400
    
    if new_password != confirm_password:
        return jsonify({'error': 'New password and confirm password do not match'}), 400
    
    result = user_crud.change_password(current_user_id, current_password, new_password, ip_address, user_agent)
    
    if result.get('success'):
        return jsonify({'message': result.get('message')}), 200
    else:
        return jsonify({'error': result.get('error')}), 400


@main.route('/user/profile-picture', methods=['POST'])
@jwt_required()
def upload_profile_picture():
    """
    Upload a new profile picture for the current user.
    """
    claims = get_jwt()
    current_user_id = claims.get('id')
    ip_address = request.remote_addr
    user_agent = request.headers.get('User-Agent')
    
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    result = user_crud.update_profile_picture(current_user_id, file, ip_address, user_agent)
    
    if result.get('success'):
        return jsonify({'message': 'Profile picture updated', 'picture': result.get('picture')}), 200
    else:
        return jsonify({'error': result.get('error')}), 400
