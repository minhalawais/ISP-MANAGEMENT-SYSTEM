from .base_adapter import BaseNetworkAdapter
from typing import Dict, Any, Optional, List
import logging

logger = logging.getLogger(__name__)

class CustomRestAdapter(BaseNetworkAdapter):
    """
    Generic REST API adapter for custom or unknown network providers.
    Uses configuration-driven approach to work with any REST API.
    """
    
    def test_connection(self) -> Dict[str, Any]:
        """Test custom API connection."""
        try:
            # Try to authenticate first if needed
            if self.auth_type == 'oauth':
                if not self.authenticate():
                    return {
                        'success': False,
                        'message': 'Authentication failed'
                    }
            
            # Try a simple GET request to base URL
            response = self._make_request('GET', '/')
            
            return {
                'success': True,
                'message': 'Connected to custom API',
                'response': response
            }
        except Exception as e:
            return {
                'success': False,
                'message': f"Connection failed: {str(e)}"
            }
    
    def authenticate(self) -> bool:
        """Authenticate with custom API."""
        if self.auth_type == 'oauth':
            return self._authenticate_oauth()
        elif self.auth_type == 'token':
            return self._authenticate_token()
        elif self.auth_type == 'basic':
            # Basic auth is handled in base class
            return True
        
        return True
    
    def _authenticate_oauth(self) -> bool:
        """Authenticate using OAuth."""
        try:
            token_endpoint = self.config.get('credentials', {}).get('token_url')
            print('Token Endpoint: ',token_endpoint)
            print('Config: ',self.config)

            if not token_endpoint:
                logger.error("OAuth token endpoint not configured")
                return False
            
            auth_data = {
                'client_id': self.credentials.get('client_id'),
                'client_secret': self.credentials.get('client_secret'),
                'grant_type': 'client_credentials'
            }
            response = self._make_request('POST', token_endpoint, json=auth_data)
            
            if response and 'access_token' in response:
                self.token = response['access_token']
                
                # Set token expiry if provided
                if 'expires_in' in response:
                    from datetime import datetime, timedelta
                    self.token_expiry = datetime.now() + timedelta(seconds=response['expires_in'])
                
                return True
            
            return False
        except Exception as e:
            logger.error(f"OAuth authentication failed: {str(e)}")
            return False
    
    def _authenticate_token(self) -> bool:
        """Authenticate using token."""
        self.token = self.credentials.get('token')
        return bool(self.token)
    
    def get_available_metrics(self) -> List[Dict[str, Any]]:
        """Get available metrics from custom API configuration."""
        metrics_config = self.config.get('available_metrics', [])
        
        if not metrics_config:
            # Return default metrics if not configured
            return [
                {
                    'name': 'custom_metric_1',
                    'type': 'custom',
                    'description': 'Custom metric 1',
                    'endpoint': '/api/metrics/1',
                    'method': 'GET'
                }
            ]
        
        return metrics_config
    
    def fetch_metric(self, metric_config: Dict[str, Any], customer_identifier: Optional[str] = None) -> Dict[str, Any]:
        """Fetch metric from custom API."""
        endpoint = metric_config.get('endpoint', '')
        method = metric_config.get('method', 'GET').upper()
        field_mapping = metric_config.get('field_mapping', {})
        query_params = metric_config.get('query_params', {})
        
        try:
            # Replace placeholders in endpoint
            if customer_identifier:
                endpoint = endpoint.replace('{customer_id}', customer_identifier)
                endpoint = endpoint.replace('{customer_identifier}', customer_identifier)
            
            # Add query parameters
            if query_params:
                params_str = '&'.join([f"{k}={v}" for k, v in query_params.items()])
                endpoint = f"{endpoint}?{params_str}" if '?' not in endpoint else f"{endpoint}&{params_str}"
            
            # Make request
            if method == 'GET':
                response = self._make_request('GET', endpoint)
            elif method == 'POST':
                response = self._make_request('POST', endpoint)
            else:
                response = self._make_request(method, endpoint)
            
            if response:
                # Handle array responses
                if isinstance(response, list):
                    if len(response) > 0:
                        mapped = self._map_fields(response[0], field_mapping)
                    else:
                        mapped = {}
                else:
                    mapped = self._map_fields(response, field_mapping)
                
                mapped['timestamp'] = self._get_timestamp()
                return mapped
            
            return {'error': 'No data received', 'timestamp': self._get_timestamp()}
        
        except Exception as e:
            logger.error(f"Error fetching custom metric: {str(e)}")
            return {'error': str(e), 'timestamp': self._get_timestamp()}
    
    @staticmethod
    def _get_timestamp() -> str:
        """Get current timestamp in ISO format."""
        from datetime import datetime
        return datetime.utcnow().isoformat() + 'Z'
