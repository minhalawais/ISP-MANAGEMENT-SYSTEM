from app import db
from app.models import APIConnection, NetworkMetric, NetworkAlert, Customer
from sqlalchemy import desc, and_
from datetime import datetime, timedelta
import uuid
import logging
from decimal import Decimal

logger = logging.getLogger(__name__)

class MonitoringError(Exception):
    pass

# ============ API Connection CRUD ============

def get_all_api_connections(company_id, user_role):
    """Get all API connections for a company."""
    try:
        if user_role == 'super_admin':
            connections = APIConnection.query.all()
        else:
            connections = APIConnection.query.filter_by(company_id=company_id).all()
        
        result = []
        for conn in connections:
            result.append({
                'id': str(conn.id),
                'name': conn.name,
                'provider_type': conn.provider_type,
                'description': conn.description,
                'is_active': conn.is_active,
                'sync_status': conn.sync_status,
                'last_sync': conn.last_sync.isoformat() if conn.last_sync else None,
                'error_message': conn.error_message,
                'total_syncs': conn.total_syncs,
                'successful_syncs': conn.successful_syncs,
                'failed_syncs': conn.failed_syncs,
                'created_at': conn.created_at.isoformat() if conn.created_at else None,
            })
        return result
    except Exception as e:
        logger.error(f"Error getting API connections: {str(e)}")
        raise MonitoringError("Failed to retrieve API connections")

def add_api_connection(data, user_role, current_user_id, ip_address, user_agent):
    """Create a new API connection."""
    try:
        required_fields = ['name', 'provider_type', 'connection_config']
        for field in required_fields:
            if field not in data:
                raise ValueError(f"Missing required field: {field}")
        
        connection_config = data['connection_config']
        
        auth_type = connection_config.get('auth_type', 'basic')
        credentials = connection_config.get('credentials', {})
        _validate_credentials(auth_type, credentials)
        
        if not connection_config.get('base_url'):
            raise ValueError("base_url is required in connection_config")
        
        new_connection = APIConnection(
            company_id=uuid.UUID(data['company_id']),
            name=data['name'],
            provider_type=data['provider_type'],
            description=data.get('description'),
            connection_config=data['connection_config'],
            metrics_config=data.get('metrics_config', {}),
            is_active=data.get('is_active', True),
            created_by=uuid.UUID(current_user_id),
            sync_status='never_synced'
        )
        
        db.session.add(new_connection)
        db.session.commit()
        logger.info(f"API connection created: {new_connection.id}")
        return new_connection
    except ValueError as ve:
        logger.error(f"Validation error adding API connection: {str(ve)}")
        db.session.rollback()
        raise MonitoringError(str(ve))
    except Exception as e:
        logger.error(f"Error adding API connection: {str(e)}")
        db.session.rollback()
        raise MonitoringError("Failed to create API connection")

def update_api_connection(id, data, company_id, user_role, current_user_id, ip_address, user_agent):
    """Update an existing API connection."""
    try:
        if user_role == 'super_admin':
            connection = APIConnection.query.get(id)
        else:
            connection = APIConnection.query.filter_by(id=id, company_id=company_id).first()
        
        if not connection:
            raise ValueError(f"API connection with id {id} not found")
        
        if 'connection_config' in data:
            connection_config = data['connection_config']
            auth_type = connection_config.get('auth_type', 'basic')
            credentials = connection_config.get('credentials', {})
            _validate_credentials(auth_type, credentials)
            
            if not connection_config.get('base_url'):
                raise ValueError("base_url is required in connection_config")
        
        updatable_fields = ['name', 'description', 'connection_config', 'metrics_config', 'is_active']
        for field in updatable_fields:
            if field in data:
                setattr(connection, field, data[field])
        
        db.session.commit()
        logger.info(f"API connection updated: {id}")
        return connection
    except ValueError as ve:
        logger.error(f"Validation error updating API connection: {str(ve)}")
        db.session.rollback()
        raise MonitoringError(str(ve))
    except Exception as e:
        logger.error(f"Error updating API connection {id}: {str(e)}")
        db.session.rollback()
        raise MonitoringError("Failed to update API connection")

def delete_api_connection(id, company_id, user_role, current_user_id, ip_address, user_agent):
    """Delete an API connection."""
    try:
        if user_role == 'super_admin':
            connection = APIConnection.query.get(id)
        else:
            connection = APIConnection.query.filter_by(id=id, company_id=company_id).first()
        
        if not connection:
            raise ValueError(f"API connection with id {id} not found")
        
        db.session.delete(connection)
        db.session.commit()
        logger.info(f"API connection deleted: {id}")
        return True
    except Exception as e:
        logger.error(f"Error deleting API connection {id}: {str(e)}")
        db.session.rollback()
        raise MonitoringError("Failed to delete API connection")

def test_api_connection(id, company_id, user_role):
    """Test an API connection."""
    try:
        if user_role == 'super_admin':
            connection = APIConnection.query.get(id)
        else:
            connection = APIConnection.query.filter_by(id=id, company_id=company_id).first()
        
        if not connection:
            raise ValueError(f"API connection with id {id} not found")
        
        # Import adapter factory
        from app.network_adapters import AdapterFactory
        
        adapter = AdapterFactory.create_adapter(
            connection.provider_type,
            connection.connection_config
        )
        
        result = adapter.test_connection()
        
        # Update connection status
        if result.get('success'):
            connection.sync_status = 'success'
            connection.error_message = None
        else:
            connection.sync_status = 'failed'
            connection.error_message = result.get('message')
        
        connection.last_sync = datetime.utcnow()
        db.session.commit()
        
        logger.info(f"API connection test completed: {id}, success={result.get('success')}")
        return result
    except Exception as e:
        logger.error(f"Error testing API connection: {str(e)}")
        return {
            'success': False,
            'message': str(e)
        }

# ============ Network Metric CRUD ============

def get_metrics_for_connection(connection_id, company_id, limit=100, offset=0):
    """Get metrics for a specific API connection."""
    try:
        query = NetworkMetric.query.filter_by(
            api_connection_id=connection_id,
            company_id=company_id
        ).order_by(desc(NetworkMetric.timestamp))
        
        total = query.count()
        metrics = query.limit(limit).offset(offset).all()
        
        result = []
        for metric in metrics:
            result.append({
                'id': str(metric.id),
                'metric_type': metric.metric_type,
                'metric_name': metric.metric_name,
                'metric_data': metric.metric_data,
                'customer_id': str(metric.customer_id) if metric.customer_id else None,
                'timestamp': metric.timestamp.isoformat() if metric.timestamp else None,
                'aggregation_period': metric.aggregation_period,
            })
        
        return {
            'total': total,
            'metrics': result
        }
    except Exception as e:
        logger.error(f"Error getting metrics: {str(e)}")
        raise MonitoringError("Failed to retrieve metrics")

def get_customer_metrics(customer_id, company_id, metric_type=None, hours=24):
    """Get metrics for a specific customer."""
    try:
        query = NetworkMetric.query.filter_by(
            customer_id=customer_id,
            company_id=company_id
        )
        
        if metric_type:
            query = query.filter_by(metric_type=metric_type)
        
        # Filter by time range
        since = datetime.utcnow() - timedelta(hours=hours)
        query = query.filter(NetworkMetric.timestamp >= since)
        
        metrics = query.order_by(desc(NetworkMetric.timestamp)).all()
        
        result = []
        for metric in metrics:
            result.append({
                'id': str(metric.id),
                'metric_type': metric.metric_type,
                'metric_name': metric.metric_name,
                'metric_data': metric.metric_data,
                'timestamp': metric.timestamp.isoformat() if metric.timestamp else None,
            })
        
        return result
    except Exception as e:
        logger.error(f"Error getting customer metrics: {str(e)}")
        raise MonitoringError("Failed to retrieve customer metrics")

def add_network_metric(data):
    """Add a new network metric."""
    try:
        new_metric = NetworkMetric(
            company_id=uuid.UUID(data['company_id']),
            api_connection_id=uuid.UUID(data['api_connection_id']),
            customer_id=uuid.UUID(data['customer_id']) if data.get('customer_id') else None,
            metric_type=data['metric_type'],
            metric_name=data.get('metric_name'),
            metric_data=data['metric_data'],
            aggregation_period=data.get('aggregation_period', 'raw'),
            timestamp=datetime.fromisoformat(data['timestamp']) if isinstance(data.get('timestamp'), str) else datetime.utcnow()
        )
        
        db.session.add(new_metric)
        db.session.commit()
        return new_metric
    except Exception as e:
        logger.error(f"Error adding network metric: {str(e)}")
        db.session.rollback()
        raise MonitoringError("Failed to add network metric")

# ============ Network Alert CRUD ============

def get_all_alerts(company_id, user_role, is_resolved=None):
    """Get all network alerts."""
    try:
        query = NetworkAlert.query.filter_by(company_id=company_id)
        
        if is_resolved is not None:
            query = query.filter_by(is_resolved=is_resolved)
        
        alerts = query.order_by(desc(NetworkAlert.triggered_at)).all()
        
        result = []
        for alert in alerts:
            result.append({
                'id': str(alert.id),
                'alert_type': alert.alert_type,
                'severity': alert.severity,
                'title': alert.title,
                'message': alert.message,
                'is_resolved': alert.is_resolved,
                'triggered_at': alert.triggered_at.isoformat() if alert.triggered_at else None,
                'resolved_at': alert.resolved_at.isoformat() if alert.resolved_at else None,
                'customer_id': str(alert.customer_id) if alert.customer_id else None,
            })
        
        return result
    except Exception as e:
        logger.error(f"Error getting alerts: {str(e)}")
        raise MonitoringError("Failed to retrieve alerts")

def add_network_alert(data):
    """Create a new network alert."""
    try:
        new_alert = NetworkAlert(
            company_id=uuid.UUID(data['company_id']),
            api_connection_id=uuid.UUID(data.get('api_connection_id')) if data.get('api_connection_id') else None,
            customer_id=uuid.UUID(data.get('customer_id')) if data.get('customer_id') else None,
            alert_type=data['alert_type'],
            severity=data.get('severity', 'medium'),
            title=data['title'],
            message=data['message'],
            rule_config=data.get('rule_config'),
            trigger_value=data.get('trigger_value'),
            notification_channels=data.get('notification_channels', [])
        )
        
        db.session.add(new_alert)
        db.session.commit()
        return new_alert
    except Exception as e:
        logger.error(f"Error adding network alert: {str(e)}")
        db.session.rollback()
        raise MonitoringError("Failed to create network alert")

def resolve_alert(alert_id, company_id, resolved_by_id, resolution_notes):
    """Resolve a network alert."""
    try:
        alert = NetworkAlert.query.filter_by(id=alert_id, company_id=company_id).first()
        
        if not alert:
            raise ValueError(f"Alert with id {alert_id} not found")
        
        alert.is_resolved = True
        alert.resolved_at = datetime.utcnow()
        alert.resolved_by = uuid.UUID(resolved_by_id)
        alert.resolution_notes = resolution_notes
        
        db.session.commit()
        return alert
    except Exception as e:
        logger.error(f"Error resolving alert: {str(e)}")
        db.session.rollback()
        raise MonitoringError("Failed to resolve alert")

def _validate_credentials(auth_type, credentials):
    """Validate credentials based on authentication type."""
    if auth_type == 'basic':
        if not credentials.get('username') or not credentials.get('password'):
            raise ValueError("Basic auth requires username and password")
    
    elif auth_type == 'bearer':
        if not credentials.get('token'):
            raise ValueError("Bearer auth requires a token")
    
    elif auth_type == 'oauth':
        required_fields = ['client_id', 'client_secret', 'token_url']
        for field in required_fields:
            if not credentials.get(field):
                raise ValueError(f"OAuth2 auth requires {field}")
    
    elif auth_type == 'custom':
        if not credentials.get('custom_auth_header'):
            raise ValueError("Custom auth requires custom_auth_header configuration")
