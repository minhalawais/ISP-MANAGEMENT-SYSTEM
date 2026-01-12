from app import db
from app.models import APIConnection, NetworkMetric, NetworkAlert, Customer
from app.network_adapters import AdapterFactory
from app.crud import monitoring_crud
from datetime import datetime, timedelta
from app.utils.date_utils import get_pkt_now
import logging
import json

logger = logging.getLogger(__name__)

class MonitoringService:
    """
    Service for managing network monitoring and metric collection.
    """
    
    @staticmethod
    def sync_all_connections():
        """
        Sync all active API connections.
        Called periodically by background job.
        """
        try:
            connections = APIConnection.query.filter_by(is_active=True).all()
            
            for connection in connections:
                MonitoringService.sync_connection(connection)
        
        except Exception as e:
            logger.error(f"Error syncing all connections: {str(e)}")
    
    @staticmethod
    def sync_connection(connection: APIConnection):
        """
        Sync a specific API connection.
        
        Args:
            connection: APIConnection instance
        """
        try:
            logger.info(f"Starting sync for connection: {connection.name}")
            
            # Update sync status
            connection.sync_status = 'syncing'
            connection.total_syncs += 1
            db.session.commit()
            
            # Create adapter
            adapter = AdapterFactory.create_adapter(
                connection.provider_type,
                connection.connection_config
            )
            
            # Test connection
            test_result = adapter.test_connection()
            if not test_result.get('success'):
                raise Exception(f"Connection test failed: {test_result.get('message')}")
            
            # Get metrics config
            metrics_config = connection.metrics_config or {}
            enabled_metrics = metrics_config.get('enabled_metrics', [])
            
            # Fetch each enabled metric
            for metric_name in enabled_metrics:
                try:
                    MonitoringService._fetch_and_store_metric(
                        connection,
                        adapter,
                        metric_name,
                        metrics_config
                    )
                except Exception as e:
                    logger.error(f"Error fetching metric {metric_name}: {str(e)}")
            
            # Update connection status
            connection.sync_status = 'success'
            connection.error_message = None
            connection.last_sync = get_pkt_now()
            connection.successful_syncs += 1
            db.session.commit()
            
            logger.info(f"Successfully synced connection: {connection.name}")
        
        except Exception as e:
            logger.error(f"Error syncing connection {connection.name}: {str(e)}")
            connection.sync_status = 'failed'
            connection.error_message = str(e)
            connection.last_sync = get_pkt_now()
            connection.failed_syncs += 1
            db.session.commit()
    
    @staticmethod
    def _fetch_and_store_metric(connection, adapter, metric_name, metrics_config):
        """
        Fetch a metric from adapter and store in database.
        
        Args:
            connection: APIConnection instance
            adapter: Network adapter instance
            metric_name: Name of metric to fetch
            metrics_config: Metrics configuration
        """
        # Get metric configuration
        endpoints = metrics_config.get('endpoints', {})
        metric_config = endpoints.get(metric_name)
        
        if not metric_config or not metric_config.get('enabled'):
            return
        
        # Get customer mapping field
        customer_mapping_field = metrics_config.get('customer_mapping_field', 'internet_id')
        
        # Fetch metric for each customer
        customers = Customer.query.filter_by(
            company_id=connection.company_id,
            is_active=True
        ).all()
        
        for customer in customers:
            try:
                # Get customer identifier
                customer_identifier = getattr(customer, customer_mapping_field, None)
                if not customer_identifier:
                    continue
                
                # Fetch metric
                metric_data = adapter.fetch_metric(metric_config, customer_identifier)
                
                if metric_data and 'error' not in metric_data:
                    # Store metric
                    monitoring_crud.add_network_metric({
                        'company_id': str(connection.company_id),
                        'api_connection_id': str(connection.id),
                        'customer_id': str(customer.id),
                        'metric_type': metric_name,
                        'metric_name': metric_config.get('name'),
                        'metric_data': metric_data,
                        'aggregation_period': 'raw',
                        'timestamp': metric_data.get('timestamp', get_pkt_now().isoformat())
                    })
                    
                    # Check for alerts
                    MonitoringService._check_alerts(
                        connection,
                        customer,
                        metric_name,
                        metric_data,
                        metrics_config
                    )
            
            except Exception as e:
                logger.error(f"Error fetching metric for customer {customer.id}: {str(e)}")
    
    @staticmethod
    def _check_alerts(connection, customer, metric_type, metric_data, metrics_config):
        """
        Check if metric data triggers any alerts.
        
        Args:
            connection: APIConnection instance
            customer: Customer instance
            metric_type: Type of metric
            metric_data: Metric data
            metrics_config: Metrics configuration
        """
        try:
            # Get alert rules
            alert_rules = metrics_config.get('alert_rules', [])
            
            for rule in alert_rules:
                if rule.get('metric_type') != metric_type:
                    continue
                
                # Check if rule is triggered
                if MonitoringService._check_rule(metric_data, rule):
                    # Create alert
                    monitoring_crud.add_network_alert({
                        'company_id': str(connection.company_id),
                        'api_connection_id': str(connection.id),
                        'customer_id': str(customer.id),
                        'alert_type': rule.get('alert_type', 'custom'),
                        'severity': rule.get('severity', 'medium'),
                        'title': rule.get('title', f"{metric_type} alert"),
                        'message': rule.get('message', f"Alert triggered for {metric_type}"),
                        'rule_config': rule,
                        'trigger_value': metric_data,
                        'notification_channels': rule.get('notification_channels', [])
                    })
        
        except Exception as e:
            logger.error(f"Error checking alerts: {str(e)}")
    
    @staticmethod
    def _check_rule(metric_data, rule):
        """
        Check if metric data triggers an alert rule.
        
        Args:
            metric_data: Metric data dictionary
            rule: Alert rule dictionary
            
        Returns:
            True if rule is triggered
        """
        try:
            field = rule.get('field')
            condition = rule.get('condition')
            threshold = rule.get('threshold')
            
            if not field or not condition or threshold is None:
                return False
            
            value = metric_data.get(field)
            if value is None:
                return False
            
            if condition == 'exceeds':
                return value > threshold
            elif condition == 'below':
                return value < threshold
            elif condition == 'equals':
                return value == threshold
            
            return False
        
        except Exception as e:
            logger.error(f"Error checking rule: {str(e)}")
            return False
    
    @staticmethod
    def get_metric_statistics(connection_id, company_id, metric_type, hours=24):
        """
        Get statistics for a metric over a time period.
        
        Args:
            connection_id: API connection ID
            company_id: Company ID
            metric_type: Type of metric
            hours: Number of hours to look back
            
        Returns:
            Dictionary with statistics
        """
        try:
            since = get_pkt_now() - timedelta(hours=hours)
            
            metrics = NetworkMetric.query.filter(
                NetworkMetric.api_connection_id == connection_id,
                NetworkMetric.company_id == company_id,
                NetworkMetric.metric_type == metric_type,
                NetworkMetric.timestamp >= since
            ).all()
            
            if not metrics:
                return {
                    'count': 0,
                    'min': None,
                    'max': None,
                    'avg': None
                }
            
            # Extract numeric values from metric_data
            values = []
            for metric in metrics:
                # Try to find numeric value in metric_data
                for key, val in metric.metric_data.items():
                    if isinstance(val, (int, float)):
                        values.append(val)
                        break
            
            if not values:
                return {
                    'count': len(metrics),
                    'min': None,
                    'max': None,
                    'avg': None
                }
            
            return {
                'count': len(metrics),
                'min': min(values),
                'max': max(values),
                'avg': sum(values) / len(values)
            }
        
        except Exception as e:
            logger.error(f"Error getting metric statistics: {str(e)}")
            return {}
