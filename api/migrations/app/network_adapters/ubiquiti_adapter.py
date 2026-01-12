from .base_adapter import BaseNetworkAdapter
from typing import Dict, Any, Optional, List
import logging

logger = logging.getLogger(__name__)

class UbiquitiAdapter(BaseNetworkAdapter):
    """
    Adapter for Ubiquiti UniFi Controller API.
    """
    
    def __init__(self, connection_config: Dict[str, Any]):
        super().__init__(connection_config)
        self.site_id = connection_config.get('site_id', 'default')
    
    def test_connection(self) -> Dict[str, Any]:
        """Test Ubiquiti API connection."""
        try:
            # Authenticate first
            if not self.authenticate():
                return {
                    'success': False,
                    'message': 'Authentication failed'
                }
            
            # Fetch site info
            response = self._make_request('GET', f'/api/s/{self.site_id}/stat/sites')
            
            if response and isinstance(response, list) and len(response) > 0:
                return {
                    'success': True,
                    'message': f"Connected to Ubiquiti UniFi",
                    'site_info': response[0]
                }
            else:
                return {
                    'success': False,
                    'message': 'Invalid response from Ubiquiti API'
                }
        except Exception as e:
            return {
                'success': False,
                'message': f"Connection failed: {str(e)}"
            }
    
    def authenticate(self) -> bool:
        """Authenticate with Ubiquiti UniFi Controller."""
        try:
            credentials = {
                'username': self.credentials.get('username'),
                'password': self.credentials.get('password')
            }
            
            response = self._make_request(
                'POST',
                '/api/auth/login',
                json=credentials
            )
            
            if response:
                self.token = response.get('meta', {}).get('token')
                return bool(self.token)
            
            return False
        except Exception as e:
            logger.error(f"Ubiquiti authentication failed: {str(e)}")
            return False
    
    def get_available_metrics(self) -> List[Dict[str, Any]]:
        """Get available metrics from Ubiquiti."""
        return [
            {
                'name': 'client_bandwidth',
                'type': 'bandwidth',
                'description': 'Client bandwidth usage',
                'endpoint': f'/api/s/{self.site_id}/stat/client',
                'method': 'GET',
                'fields': ['rx_bytes', 'tx_bytes', 'rx_rate', 'tx_rate']
            },
            {
                'name': 'client_status',
                'type': 'customer_status',
                'description': 'Client connection status',
                'endpoint': f'/api/s/{self.site_id}/stat/client',
                'method': 'GET',
                'fields': ['mac', 'ip', 'is_wired', 'signal', 'uptime']
            },
            {
                'name': 'device_health',
                'type': 'device_health',
                'description': 'Device health metrics',
                'endpoint': f'/api/s/{self.site_id}/stat/device',
                'method': 'GET',
                'fields': ['cpu', 'mem', 'uptime', 'loadavg_1', 'loadavg_5']
            },
            {
                'name': 'ap_status',
                'type': 'ap_status',
                'description': 'Access Point status',
                'endpoint': f'/api/s/{self.site_id}/stat/device',
                'method': 'GET',
                'fields': ['name', 'model', 'uptime', 'num_sta']
            }
        ]
    
    def fetch_metric(self, metric_config: Dict[str, Any], customer_identifier: Optional[str] = None) -> Dict[str, Any]:
        """Fetch metric from Ubiquiti."""
        endpoint = metric_config.get('endpoint')
        field_mapping = metric_config.get('field_mapping', {})
        
        try:
            response = self._make_request('GET', endpoint)
            
            if response and isinstance(response, list):
                # Filter by customer identifier if provided
                if customer_identifier:
                    filtered = [
                        item for item in response
                        if item.get('mac') == customer_identifier or 
                           item.get('ip') == customer_identifier
                    ]
                    if filtered:
                        mapped = self._map_fields(filtered[0], field_mapping)
                        mapped['timestamp'] = self._get_timestamp()
                        return mapped
                else:
                    # Return aggregated data
                    if len(response) > 0:
                        mapped = self._map_fields(response[0], field_mapping)
                        mapped['timestamp'] = self._get_timestamp()
                        return mapped
            
            return {'error': 'No data received', 'timestamp': self._get_timestamp()}
        
        except Exception as e:
            logger.error(f"Error fetching Ubiquiti metric: {str(e)}")
            return {'error': str(e), 'timestamp': self._get_timestamp()}
    
    @staticmethod
    def _get_timestamp() -> str:
        """Get current timestamp in ISO format."""
        from datetime import datetime
        return datetime.utcnow().isoformat() + 'Z'
