from .base_adapter import BaseNetworkAdapter
from typing import Dict, Any, Optional, List
import logging

logger = logging.getLogger(__name__)

class MikrotikAdapter(BaseNetworkAdapter):
    """
    Adapter for Mikrotik RouterOS API.
    Supports both REST API and legacy API.
    """
    
    def test_connection(self) -> Dict[str, Any]:
        """Test Mikrotik API connection."""
        try:
            # Try to fetch system identity
            response = self._make_request('GET', '/rest/system/identity')
            
            if response and 'name' in response:
                return {
                    'success': True,
                    'message': f"Connected to Mikrotik: {response.get('name')}",
                    'device_info': response
                }
            else:
                return {
                    'success': False,
                    'message': 'Invalid response from Mikrotik API'
                }
        except Exception as e:
            return {
                'success': False,
                'message': f"Connection failed: {str(e)}"
            }
    
    def authenticate(self) -> bool:
        """Authenticate with Mikrotik API."""
        # Mikrotik REST API uses basic auth, which is handled in base class
        return self.test_connection()['success']
    
    def get_available_metrics(self) -> List[Dict[str, Any]]:
        """Get available metrics from Mikrotik."""
        return [
            {
                'name': 'bandwidth',
                'type': 'bandwidth',
                'description': 'Customer bandwidth usage',
                'endpoint': '/rest/interface/monitor-traffic',
                'method': 'GET',
                'fields': ['rx_rate', 'tx_rate', 'rx_bytes', 'tx_bytes']
            },
            {
                'name': 'customer_status',
                'type': 'customer_status',
                'description': 'Customer connection status',
                'endpoint': '/rest/ppp/active',
                'method': 'GET',
                'fields': ['name', 'address', 'uptime']
            },
            {
                'name': 'device_health',
                'type': 'device_health',
                'description': 'Device CPU and memory usage',
                'endpoint': '/rest/system/resource',
                'method': 'GET',
                'fields': ['cpu-load', 'free-memory', 'total-memory', 'uptime']
            },
            {
                'name': 'interface_status',
                'type': 'interface_status',
                'description': 'Interface status and statistics',
                'endpoint': '/rest/interface',
                'method': 'GET',
                'fields': ['name', 'running', 'disabled', 'rx-bytes', 'tx-bytes']
            }
        ]
    
    def fetch_metric(self, metric_config: Dict[str, Any], customer_identifier: Optional[str] = None) -> Dict[str, Any]:
        """Fetch metric from Mikrotik."""
        metric_type = metric_config.get('type')
        endpoint = metric_config.get('endpoint')
        field_mapping = metric_config.get('field_mapping', {})
        
        try:
            if metric_type == 'bandwidth' and customer_identifier:
                # Fetch bandwidth for specific interface
                response = self._make_request(
                    'GET',
                    f"{endpoint}?interface={customer_identifier}"
                )
            elif metric_type == 'customer_status' and customer_identifier:
                # Fetch PPP session for customer
                response = self._make_request(
                    'GET',
                    f"{endpoint}?name={customer_identifier}"
                )
            else:
                # Fetch general metrics
                response = self._make_request('GET', endpoint)
            
            if response:
                if isinstance(response, list) and len(response) > 0:
                    # Map fields from first result
                    mapped = self._map_fields(response[0], field_mapping)
                    mapped['timestamp'] = self._get_timestamp()
                    return mapped
                elif isinstance(response, dict):
                    mapped = self._map_fields(response, field_mapping)
                    mapped['timestamp'] = self._get_timestamp()
                    return mapped
            
            return {'error': 'No data received', 'timestamp': self._get_timestamp()}
        
        except Exception as e:
            logger.error(f"Error fetching Mikrotik metric: {str(e)}")
            return {'error': str(e), 'timestamp': self._get_timestamp()}
    
    @staticmethod
    def _get_timestamp() -> str:
        """Get current timestamp in ISO format."""
        from datetime import datetime
        return datetime.utcnow().isoformat() + 'Z'
