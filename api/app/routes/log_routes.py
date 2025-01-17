from flask import jsonify, request
from flask_jwt_extended import jwt_required, get_jwt
from . import main
from ..crud import log_crud

@main.route('/logs/list', methods=['GET'])
@jwt_required()
def get_logs():
    claims = get_jwt()
    company_id = claims['company_id']
    user_role = claims['role']
    logs = log_crud.get_all_logs(company_id, user_role)
    return jsonify(logs), 200

@main.route('/logs/<string:id>', methods=['GET'])
@jwt_required()
def get_log(id):
    claims = get_jwt()
    company_id = claims['company_id']
    user_role = claims['role']
    log = log_crud.get_log_by_id(id, company_id, user_role)
    if log:
        return jsonify(log), 200
    return jsonify({'message': 'Log not found'}), 404

# Note: We typically don't allow adding, updating, or deleting logs directly
# as they are system-generated. But if needed, you can implement these methods.

