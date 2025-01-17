from flask import jsonify, request
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity
from . import main
from ..crud import invoice_crud

@main.route('/invoices/list', methods=['GET'])
@jwt_required()
def get_invoices():
    claims = get_jwt()
    company_id = claims['company_id']
    user_role = claims['role']
    employee_id = claims['id']
    invoices = invoice_crud.get_all_invoices(company_id, user_role, employee_id)
    return jsonify(invoices), 200

@main.route('/invoices/add', methods=['POST'])
@jwt_required()
def add_new_invoice():
    claims = get_jwt()
    company_id = claims['company_id']
    user_role = claims['role']
    current_user_id = get_jwt_identity()
    ip_address = request.remote_addr
    user_agent = request.headers.get('User-Agent')
    data = request.json
    data['company_id'] = company_id
    try:
        new_invoice = invoice_crud.add_invoice(data, current_user_id, user_role, ip_address, user_agent)
        return jsonify({'message': 'Invoice added successfully', 'id': str(new_invoice.id)}), 201
    except Exception as e:
        return jsonify({'error': 'Failed to add invoice', 'message': str(e)}), 400

@main.route('/invoices/update/<string:id>', methods=['PUT'])
@jwt_required()
def update_existing_invoice(id):
    claims = get_jwt()
    company_id = claims['company_id']
    user_role = claims['role']
    current_user_id = get_jwt_identity()
    ip_address = request.remote_addr
    user_agent = request.headers.get('User-Agent')
    data = request.json
    updated_invoice = invoice_crud.update_invoice(id, data, company_id, user_role, current_user_id, ip_address, user_agent)
    if updated_invoice:
        return jsonify({'message': 'Invoice updated successfully'}), 200
    return jsonify({'message': 'Invoice not found'}), 404

@main.route('/invoices/delete/<string:id>', methods=['DELETE'])
@jwt_required()
def delete_existing_invoice(id):
    claims = get_jwt()
    company_id = claims['company_id']
    user_role = claims['role']
    current_user_id = get_jwt_identity()
    ip_address = request.remote_addr
    user_agent = request.headers.get('User-Agent')
    if invoice_crud.delete_invoice(id, company_id, user_role, current_user_id, ip_address, user_agent):
        return jsonify({'message': 'Invoice deleted successfully'}), 200
    return jsonify({'message': 'Invoice not found'}), 404

@main.route('/invoices/<string:id>', methods=['GET'])
@jwt_required()
def get_invoice(id):
    claims = get_jwt()
    company_id = claims['company_id']
    user_role = claims['role']
    invoice = invoice_crud.get_invoice_by_id(id, company_id, user_role)
    if invoice:
        return jsonify(invoice_crud.invoice_to_dict(invoice)), 200
    return jsonify({'message': 'Invoice not found'}), 404

