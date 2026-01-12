from flask import jsonify, request
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity
from . import main
from ..crud import monitoring_crud
from ..services.monitoring_service import MonitoringService

# ============ API Connection Routes ============

@main.route('/api-connections/list', methods=['GET'])
@jwt_required()
def get_api_connections():
    claims = get_jwt()
    company_id = claims['company_id']
    user_role = claims['role']
    try:
        connections = monitoring_crud.get_all_api_connections(company_id, user_role)
        return jsonify(connections), 200
    except Exception as e:
        return jsonify({'error': 'Failed to fetch API connections', 'message': str(e)}), 400

@main.route('/api-connections/add', methods=['POST'])
@jwt_required()
def add_api_connection():
    claims = get_jwt()
    company_id = claims['company_id']
    user_role = claims['role']
    current_user_id = get_jwt_identity()
    data = request.json
    
    try:
        data['company_id'] = company_id
        new_connection = monitoring_crud.add_api_connection(
            data, user_role, current_user_id, 
            request.remote_addr, request.headers.get('User-Agent')
        )
        return jsonify({
            'message': 'API connection added successfully',
            'id': str(new_connection.id)
        }), 201
    except Exception as e:
        return jsonify({'error': 'Failed to add API connection', 'message': str(e)}), 400

@main.route('/api-connections/update/<string:id>', methods=['PUT'])
@jwt_required()
def update_api_connection(id):
    claims = get_jwt()
    company_id = claims['company_id']
    user_role = claims['role']
    current_user_id = get_jwt_identity()
    data = request.json
    
    try:
        updated_connection = monitoring_crud.update_api_connection(
            id, data, company_id, user_role, current_user_id,
            request.remote_addr, request.headers.get('User-Agent')
        )
        if updated_connection:
            return jsonify({'message': 'API connection updated successfully'}), 200
        return jsonify({'message': 'API connection not found'}), 404
    except Exception as e:
        return jsonify({'error': 'Failed to update API connection', 'message': str(e)}), 400

@main.route('/api-connections/delete/<string:id>', methods=['DELETE'])
@jwt_required()
def delete_api_connection(id):
    claims = get_jwt()
    company_id = claims['company_id']
    user_role = claims['role']
    current_user_id = get_jwt_identity()
    
    try:
        if monitoring_crud.delete_api_connection(
            id, company_id, user_role, current_user_id,
            request.remote_addr, request.headers.get('User-Agent')
        ):
            return jsonify({'message': 'API connection deleted successfully'}), 200
        return jsonify({'message': 'API connection not found'}), 404
    except Exception as e:
        return jsonify({'error': 'Failed to delete API connection', 'message': str(e)}), 400

@main.route('/api-connections/test/<string:id>', methods=['POST'])
@jwt_required()
def test_api_connection(id):
    claims = get_jwt()
    company_id = claims['company_id']
    user_role = claims['role']
    
    try:
        result = monitoring_crud.test_api_connection(id, company_id, user_role)
        return jsonify(result), 200 if result.get('success') else 400
    except Exception as e:
        return jsonify({'error': 'Failed to test API connection', 'message': str(e)}), 400

@main.route('/api-connections/sync/<string:id>', methods=['POST'])
@jwt_required()
def sync_api_connection(id):
    claims = get_jwt()
    company_id = claims['company_id']
    user_role = claims['role']
    
    try:
        from app.models import APIConnection
        
        if user_role == 'super_admin':
            connection = APIConnection.query.get(id)
        else:
            connection = APIConnection.query.filter_by(id=id, company_id=company_id).first()
        
        if not connection:
            return jsonify({'message': 'API connection not found'}), 404
        
        # Trigger sync
        MonitoringService.sync_connection(connection)
        
        return jsonify({
            'message': 'Sync completed',
            'sync_status': connection.sync_status,
            'last_sync': connection.last_sync.isoformat() if connection.last_sync else None
        }), 200
    except Exception as e:
        return jsonify({'error': 'Failed to sync API connection', 'message': str(e)}), 400

# ============ Network Metrics Routes ============

@main.route('/network-metrics/connection/<string:connection_id>', methods=['GET'])
@jwt_required()
def get_connection_metrics(connection_id):
    claims = get_jwt()
    company_id = claims['company_id']
    
    try:
        limit = request.args.get('limit', 100, type=int)
        offset = request.args.get('offset', 0, type=int)
        
        result = monitoring_crud.get_metrics_for_connection(
            connection_id, company_id, limit, offset
        )
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'error': 'Failed to fetch metrics', 'message': str(e)}), 400

@main.route('/network-metrics/customer/<string:customer_id>', methods=['GET'])
@jwt_required()
def get_customer_metrics(customer_id):
    claims = get_jwt()
    company_id = claims['company_id']
    
    try:
        metric_type = request.args.get('metric_type')
        hours = request.args.get('hours', 24, type=int)
        
        metrics = monitoring_crud.get_customer_metrics(
            customer_id, company_id, metric_type, hours
        )
        return jsonify(metrics), 200
    except Exception as e:
        return jsonify({'error': 'Failed to fetch customer metrics', 'message': str(e)}), 400

@main.route('/network-metrics/statistics/<string:connection_id>', methods=['GET'])
@jwt_required()
def get_metric_statistics(connection_id):
    claims = get_jwt()
    company_id = claims['company_id']
    
    try:
        metric_type = request.args.get('metric_type', 'bandwidth')
        hours = request.args.get('hours', 24, type=int)
        
        stats = MonitoringService.get_metric_statistics(
            connection_id, company_id, metric_type, hours
        )
        return jsonify(stats), 200
    except Exception as e:
        return jsonify({'error': 'Failed to fetch statistics', 'message': str(e)}), 400

# ============ Network Alerts Routes ============

@main.route('/network-alerts/list', methods=['GET'])
@jwt_required()
def get_network_alerts():
    claims = get_jwt()
    company_id = claims['company_id']
    user_role = claims['role']
    
    try:
        is_resolved = request.args.get('is_resolved', type=lambda x: x.lower() == 'true')
        alerts = monitoring_crud.get_all_alerts(company_id, user_role, is_resolved)
        return jsonify(alerts), 200
    except Exception as e:
        return jsonify({'error': 'Failed to fetch alerts', 'message': str(e)}), 400

@main.route('/network-alerts/resolve/<string:alert_id>', methods=['PUT'])
@jwt_required()
def resolve_network_alert(alert_id):
    claims = get_jwt()
    company_id = claims['company_id']
    current_user_id = get_jwt_identity()
    data = request.json
    
    try:
        resolution_notes = data.get('resolution_notes', '')
        alert = monitoring_crud.resolve_alert(
            alert_id, company_id, current_user_id, resolution_notes
        )
        return jsonify({'message': 'Alert resolved successfully'}), 200
    except Exception as e:
        return jsonify({'error': 'Failed to resolve alert', 'message': str(e)}), 400
