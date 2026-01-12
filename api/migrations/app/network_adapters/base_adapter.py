from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List
import logging
from datetime import datetime
import requests

logger = logging.getLogger(__name__)

class BaseNetworkAdapter(ABC):
    """
    Abstract base class for all network adapters.
    Defines the interface that all adapters must implement.
    """
    
    def __init__(self, connection_config: Dict[str, Any]):
        """
        Initialize adapter with connection configuration.
        
        Args:
            connection_config: Dictionary containing connection details
        """
        self.config = connection_config
        self.base_url = connection_config.get('base_url')
        self.auth_type = connection_config.get('auth_type', 'basic')
        self.credentials = connection_config.get('credentials', {})
        self.timeout = connection_config.get('timeout', 30)
        self.verify_ssl = connection_config.get('verify_ssl', True)
        self.custom_headers = connection_config.get('custom_headers', {})
        self.token = None
        self.token_expiry = None
    
    @abstractmethod
    def test_connection(self) -> Dict[str, Any]:
        """
        Test if the API connection is working.
        
        Returns:
            Dict with 'success' boolean and 'message' string
        """
        pass
    
    @abstractmethod
    def authenticate(self) -> bool:
        """
        Authenticate with the API and obtain necessary tokens.
        
        Returns:
            True if authentication successful, False otherwise
        """
        pass
    
    @abstractmethod
    def get_available_metrics(self) -> List[Dict[str, Any]]:
        """
        Get list of available metrics from the API.
        
        Returns:
            List of metric definitions with name, type, and description
        """
        pass
    
    @abstractmethod
    def fetch_metric(self, metric_config: Dict[str, Any], customer_identifier: Optional[str] = None) -> Dict[str, Any]:
        """
        Fetch a specific metric from the API.
        
        Args:
            metric_config: Configuration for the metric to fetch
            customer_identifier: Optional customer identifier for customer-specific metrics
            
        Returns:
            Dictionary with metric data
        """
        pass
    
    def refresh_token_if_needed(self) -> bool:
        """
        Refresh authentication token if it's about to expire.
        
        Returns:
            True if token is valid or refreshed successfully
        """
        if self.auth_type == 'oauth' and self.token_expiry:
            from datetime import datetime, timedelta
            if datetime.now() >= self.token_expiry - timedelta(minutes=5):
                return self._refresh_oauth_token()
        return True
    
    def _refresh_oauth_token(self) -> bool:
        """
        Refresh OAuth token. Override in subclass if needed.
        
        Returns:
            True if refresh successful
        """
        logger.warning("OAuth token refresh not implemented for this adapter")
        return False
    
    def _get_auth_headers(self) -> Dict[str, str]:
        """
        Get authentication headers based on auth type.
        
        Returns:
            Dictionary of headers
        """
        headers = {'Content-Type': 'application/json'}
        headers.update(self.custom_headers)
        
        if self.auth_type == 'basic':
            import base64
            username = self.credentials.get('username', '')
            password = self.credentials.get('password', '')
            credentials = base64.b64encode(f"{username}:{password}".encode()).decode()
            headers['Authorization'] = f'Basic {credentials}'
        
        elif self.auth_type == 'bearer':
            token = self.credentials.get('token') or self.token
            if token:
                headers['Authorization'] = f'Bearer {token}'
        
        elif self.auth_type == 'custom':
            # Custom header-based auth
            custom_auth = self.credentials.get('custom_auth_header', {})
            headers.update(custom_auth)
        
        return headers
    
    def _make_request(self, method: str, url: str, **kwargs) -> Optional[Dict[str, Any]]:
        """
        Make HTTP request to API.
        
        Args:
            method: HTTP method (GET, POST, etc.)
            url: Full URL or endpoint
            **kwargs: Additional arguments for requests
            
        Returns:
            Response JSON or None if failed
        """
        
        try:
            # Ensure full URL
            if not url.startswith('http'):
                url = f"{self.base_url}{url}"
            
            # Add headers
            headers = kwargs.pop('headers', {})
            headers.update(self._get_auth_headers())
            
            # Make request
            response = requests.request(
                method=method,
                url=url,
                headers=headers,
                timeout=self.timeout,
                verify=self.verify_ssl,
                **kwargs
            )
            
            response.raise_for_status()
            return response.json() if response.text else {}
        
        except requests.exceptions.RequestException as e:
            logger.error(f"API request failed: {str(e)}")
            return None
    
    def _map_fields(self, raw_data: Dict[str, Any], field_mapping: Dict[str, str]) -> Dict[str, Any]:
        """
        Map API response fields to standard field names.
        
        Args:
            raw_data: Raw API response
            field_mapping: Mapping of standard names to API field names
            
        Returns:
            Mapped data dictionary
        """
        mapped = {}
        for standard_name, api_field_name in field_mapping.items():
            # Support nested fields with dot notation
            value = raw_data
            for key in api_field_name.split('.'):
                if isinstance(value, dict):
                    value = value.get(key)
                else:
                    value = None
                    break
            
            if value is not None:
                mapped[standard_name] = value
        
        return mapped
