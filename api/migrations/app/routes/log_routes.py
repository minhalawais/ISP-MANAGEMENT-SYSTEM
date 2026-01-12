# log_routes.py - Updated with pagination endpoints
from flask import jsonify, request, Response
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

@main.route('/logs/page', methods=['GET'])
@jwt_required()
def list_logs_paginated():
    claims = get_jwt()
    company_id = claims['company_id']
    user_role = claims['role']

    # Query params
    page = int(request.args.get('page', 1))
    page_size = int(request.args.get('page_size', 20))
    sort_by = request.args.get('sort_by', 'created_at')
    sort_dir = request.args.get('sort_dir', 'desc')
    q = request.args.get('q', '')

    # Column filters
    filters = {k.replace('filter_', ''): v for k, v in request.args.items() 
               if k.startswith('filter_') and v}

    try:
        items, total = log_crud.get_all_logs_paginated(
            company_id=company_id,
            user_role=user_role,
            page=page,
            page_size=page_size,
            sort_by=sort_by,
            sort_dir=sort_dir,
            q=q,
            filters=filters,
        )
        return jsonify({'items': items, 'total': total}), 200
    except Exception as e:
        return jsonify({'error': 'Failed to fetch logs', 'message': str(e)}), 500

@main.route('/logs/summary', methods=['GET'])
@jwt_required()
def logs_summary():
    claims = get_jwt()
    company_id = claims['company_id']
    user_role = claims['role']

    try:
        summary = log_crud.get_logs_summary(company_id, user_role)
        return jsonify(summary), 200
    except Exception as e:
        return jsonify({'error': 'Failed to get summary', 'message': str(e)}), 500

@main.route('/logs/export', methods=['GET'])
@jwt_required()
def export_logs_csv():
    claims = get_jwt()
    company_id = claims['company_id']
    user_role = claims['role']

    sort_by = request.args.get('sort_by', 'created_at')
    sort_dir = request.args.get('sort_dir', 'desc')
    q = request.args.get('q', '')
    filters = {k.replace('filter_', ''): v for k, v in request.args.items() 
               if k.startswith('filter_') and v}

    def generate():
        yield "user_name,action,table_name,record_id,ip_address,timestamp\n"
        for row in log_crud.stream_logs(company_id, user_role, sort_by, sort_dir, q, filters):
            yield f"\"{row['user_name']}\",{row['action']},{row['table_name']},{row['record_id']},{row['ip_address']},{row['timestamp']}\n"

    return Response(generate(), mimetype='text/csv',
                    headers={"Content-Disposition": "attachment; filename=logs.csv"})

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

@main.route('/logs/record-details', methods=['GET'])
@jwt_required()
def get_record_details():
    """
    Fetch human-readable details for a specific record log.
    Expects query params: table_name, record_id
    """
    claims = get_jwt()
    company_id = claims['company_id']
    
    table_name = request.args.get('table_name')
    record_id = request.args.get('record_id')
    
    if not table_name or not record_id:
        return jsonify({'error': 'Missing table_name or record_id'}), 400
        
    from ..utils.record_resolver import resolve_record_details
    details = resolve_record_details(table_name, record_id, company_id)
    
    return jsonify(details), 200