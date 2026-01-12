from flask import jsonify, request,send_file,current_app,Response
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity
from . import main
from ..crud import payment_crud,bank_account_crud
import os
from werkzeug.utils import secure_filename
import uuid
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
UPLOAD_FOLDER = os.path.join(PROJECT_ROOT, 'uploads', 'payment_proofs')
@main.route('/payments/list', methods=['GET'])
@jwt_required()
def get_payments():
    claims = get_jwt()
    company_id = claims['company_id']
    user_role = claims['role']
    employee_id = claims['id']
    payments = payment_crud.get_all_payments(company_id, user_role,employee_id)
    return jsonify(payments), 200

@main.route('/payments/add', methods=['POST'])
@jwt_required()
def add_new_payment():
    claims = get_jwt()
    company_id = claims['company_id']
    user_role = claims['role']
    current_user_id = get_jwt_identity()
    ip_address = request.remote_addr
    user_agent = request.headers.get('User-Agent')
    
    try:
        # Handle both form data and JSON
        if request.content_type and 'multipart/form-data' in request.content_type:
            data = request.form.to_dict()
        else:
            data = request.get_json() or {}
        
        data['company_id'] = company_id
        
        # Handle file upload
        if 'payment_proof' in request.files:
            file = request.files['payment_proof']
            if file and allowed_file(file.filename):
                filename = secure_filename(f"{company_id}_{data.get('invoice_id', 'unknown')}_{file.filename}")
                file_path = os.path.join(UPLOAD_FOLDER, filename)
                os.makedirs(os.path.dirname(file_path), exist_ok=True)
                file.save(file_path)
                data['payment_proof'] = file_path
        
        new_payment = payment_crud.add_payment(data, user_role, current_user_id, ip_address, user_agent)
        return jsonify({'message': 'Payment added successfully', 'id': str(new_payment.id)}), 201
    except Exception as e:
        return jsonify({'error': 'Failed to add payment', 'message': str(e)}), 400

@main.route('/payments/update/<string:id>', methods=['PUT'])
@jwt_required()
def update_existing_payment(id):
    claims = get_jwt()
    company_id = claims['company_id']
    user_role = claims['role']
    current_user_id = get_jwt_identity()
    ip_address = request.remote_addr
    user_agent = request.headers.get('User-Agent')
    
    try:
        # Handle both form data and JSON
        if request.content_type and 'multipart/form-data' in request.content_type:
            data = request.form.to_dict()
        else:
            data = request.get_json() or {}
        
        # Handle file upload
        if 'payment_proof' in request.files:
            file = request.files['payment_proof']
            if file and allowed_file(file.filename):
                filename = secure_filename(f"{company_id}_{data.get('invoice_id', 'unknown')}_{file.filename}")
                file_path = os.path.join(UPLOAD_FOLDER, filename)
                os.makedirs(os.path.dirname(file_path), exist_ok=True)
                file.save(file_path)
                data['payment_proof'] = file_path
        
        updated_payment = payment_crud.update_payment(id, data, company_id, user_role, current_user_id, ip_address, user_agent)
        if updated_payment:
            return jsonify({'message': 'Payment updated successfully'}), 200
        return jsonify({'message': 'Payment not found'}), 404
    except Exception as e:
        return jsonify({'error': 'Failed to update payment', 'message': str(e)}), 400

@main.route('/payments/delete/<string:id>', methods=['DELETE'])
@jwt_required()
def delete_existing_payment(id):
    claims = get_jwt()
    company_id = claims['company_id']
    user_role = claims['role']
    current_user_id = get_jwt_identity()
    ip_address = request.remote_addr
    user_agent = request.headers.get('User-Agent')
    
    try:
        if payment_crud.delete_payment(id, company_id, user_role, current_user_id, ip_address, user_agent):
            return jsonify({'message': 'Payment deleted successfully'}), 200
        return jsonify({'message': 'Payment not found'}), 404
    except Exception as e:
        return jsonify({'error': 'Failed to delete payment', 'message': str(e)}), 400

@main.route('/payments/verify/<string:id>', methods=['POST'])
@jwt_required()
def verify_payment_route(id):
    claims = get_jwt()
    current_user_id = get_jwt_identity()
    user_role = claims['role']
    ip_address = request.remote_addr
    user_agent = request.headers.get('User-Agent')

    if user_role not in ['super_admin', 'company_owner', 'manager']:
         return jsonify({'error': 'Unauthorized access'}), 403

    try:
        data = request.get_json()
        action = data.get('action') # 'approve' or 'reject'
        notes = data.get('notes')

        if not action:
            return jsonify({'error': 'Action is required'}), 400

        updated_payment = payment_crud.verify_payment(
            id, action, notes, current_user_id, ip_address, user_agent
        )
        return jsonify({'message': f'Payment {action}ed successfully', 'status': updated_payment.status}), 200
    except Exception as e:
        return jsonify({'error': 'Failed to verify payment', 'message': str(e)}), 400

def allowed_file(filename):
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'pdf', 'jfif', 'webp'}
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@main.route('/payments/proof-image/<string:id>', methods=['GET'])
@jwt_required()
def get_payment_proof_image(id):
    """
    Fetches and returns the payment proof image for a given payment ID if it exists.
    """
    claims = get_jwt()
    company_id = claims.get('company_id')

    try:
        payment_proof = payment_crud.get_payment_proof(id, company_id)
        if payment_proof and payment_proof.get('proof_of_payment'):
            # Normalize DB path
            relative_path = payment_proof['proof_of_payment'].replace("\\", "/")
            
            # Build absolute path using PROJECT_ROOT (consistent with other routes)
            proof_image_path = os.path.join(PROJECT_ROOT, relative_path)
            
            print('proof_image_path', proof_image_path)
            
            if os.path.exists(proof_image_path):
                # Determine appropriate mimetype based on file extension
                file_extension = os.path.splitext(proof_image_path)[1].lower()
                mimetype = 'image/*'  # Default to generic image
                
                if file_extension in ['.png']:
                    mimetype = 'image/png'
                elif file_extension in ['.jpg', '.jpeg']:
                    mimetype = 'image/jpeg'
                elif file_extension in ['.gif']:
                    mimetype = 'image/gif'
                elif file_extension in ['.pdf']:
                    mimetype = 'application/pdf'
                
                return send_file(proof_image_path, mimetype=mimetype)
            else:
                return jsonify({'error': f'Payment proof file not found at {proof_image_path}'}), 404

        return jsonify({'error': 'Payment proof not found'}), 404
    except Exception as error:
        current_app.logger.error(f"Error fetching payment proof: {error}")
        return jsonify({'error': 'An error occurred while retrieving the payment proof image'}), 500

@main.route('/payments/invoice/<string:invoice_id>', methods=['GET'])
@jwt_required()
def get_invoice_payment_details(invoice_id):
    claims = get_jwt()
    company_id = claims['company_id']
    
    try:
        payment = payment_crud.get_payment_by_invoice_id(invoice_id, company_id)
        if payment:
            return jsonify(payment), 200
        return jsonify(None), 200
    except Exception as e:
        print(f"Error fetching payment for invoice {invoice_id}: {str(e)}")
        return jsonify({'error': 'Failed to fetch payment details'}), 500

@main.route('/payments/page', methods=['GET'])
@jwt_required()
def list_payments_paginated():
    claims = get_jwt()
    company_id = claims['company_id']
    user_role = claims['role']
    employee_id = claims['id']

    # Query params
    page = int(request.args.get('page', 1))
    page_size = int(request.args.get('page_size', 20))
    sort_by = request.args.get('sort_by', 'payment_date')
    sort_dir = request.args.get('sort_dir', 'desc')
    q = request.args.get('q', '')

    # Column filters come as filter_<column>=value
    filters = {k.replace('filter_', ''): v for k, v in request.args.items() if k.startswith('filter_') and v}

    try:
      items, total = payment_crud.list_payments_paginated(
          company_id=company_id,
          user_role=user_role,
          employee_id=employee_id,
          page=page,
          page_size=page_size,
          sort_by=sort_by,
          sort_dir=sort_dir,
          q=q,
          filters=filters,
      )
      return jsonify({ 'items': items, 'total': total }), 200
    except Exception as e:
      current_app.logger.error(f"Paginated payments error: {e}")
      return jsonify({'error': 'Failed to fetch payments'}), 500

@main.route('/payments/summary', methods=['GET'])
@jwt_required()
def payments_summary():
    claims = get_jwt()
    company_id = claims['company_id']
    user_role = claims['role']
    employee_id = claims['id']

    try:
      summary = payment_crud.get_payments_summary(company_id, user_role, employee_id)
      return jsonify(summary), 200
    except Exception as e:
      current_app.logger.error(f"Summary error: {e}")
      return jsonify({'error': 'Failed to get summary'}), 500

@main.route('/payments/export', methods=['GET'])
@jwt_required()
def export_payments_csv():
    claims = get_jwt()
    company_id = claims['company_id']
    user_role = claims['role']
    employee_id = claims['id']

    sort_by = request.args.get('sort_by', 'payment_date')
    sort_dir = request.args.get('sort_dir', 'desc')
    q = request.args.get('q', '')
    filters = {k.replace('filter_', ''): v for k, v in request.args.items() if k.startswith('filter_') and v}

    # Stream large CSV
    def generate():
        yield "invoice_number,customer_name,amount,payment_date,payment_method,status,received_by,bank_account\n"
        for row in payment_crud.stream_payments(company_id, user_role, employee_id, sort_by, sort_dir, q, filters):
            yield f"{row['invoice_number']},{row['customer_name']},{row['amount']},{row['payment_date']},{row['payment_method']},{row['status']},{row['received_by']},{row.get('bank_account_details','')}\n"

    return Response(generate(), mimetype='text/csv',
                    headers={"Content-Disposition": "attachment; filename=payments.csv"})
