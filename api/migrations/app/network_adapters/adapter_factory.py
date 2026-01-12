from typing import Dict, Any
from .base_adapter import BaseNetworkAdapter
from .mikrotik_adapter import MikrotikAdapter
from .ubiquiti_adapter import UbiquitiAdapter
from .custom_adapter import CustomRestAdapter
import logging

logger = logging.getLogger(__name__)

class AdapterFactory:
    """
    Factory class for creating appropriate adapter instances.
    """
    
    ADAPTER_MAP = {
        'mikrotik': MikrotikAdapter,
        'ubiquiti': UbiquitiAdapter,
        'cisco': CustomRestAdapter,  # Cisco uses custom REST adapter
        'custom': CustomRestAdapter,
    }
    
    @staticmethod
    def create_adapter(provider_type: str, connection_config: Dict[str, Any]) -> BaseNetworkAdapter:
        """
        Create an adapter instance based on provider type.
        
        Args:
            provider_type: Type of network provider
            connection_config: Connection configuration
            
        Returns:
            Adapter instance
            
        Raises:
            ValueError: If provider type is not supported
        """
        adapter_class = AdapterFactory.ADAPTER_MAP.get(provider_type.lower())
        
        if not adapter_class:
            logger.warning(f"Unknown provider type: {provider_type}, using CustomRestAdapter")
            adapter_class = CustomRestAdapter
        
        return adapter_class(connection_config)
    
    @staticmethod
    def get_supported_providers() -> list:
        """Get list of supported provider types."""
        return list(AdapterFactory.ADAPTER_MAP.keys())
