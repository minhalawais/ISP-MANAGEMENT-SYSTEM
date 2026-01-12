"""
WhatsApp API Client
Wrapper for third-party WhatsApp API integration.
"""

import requests
import logging
from app.models import WhatsAppConfig
from app.utils.phone_formatter import format_phone_number
from typing import Dict, Any

logger = logging.getLogger(__name__)


class WhatsAppAPIClient:
    """Client for interacting with WhatsApp API"""
    
    def __init__(self, api_key: str = None, server_address: str = None):
        """
        Initialize WhatsApp API client.
        
        Args:
            api_key: WhatsApp API key
            server_address: WhatsApp API server URL
        """
        self.api_key = api_key
        self.server_address = server_address
        self.send_endpoint = f"{server_address}/api/send.php" if server_address else None
    
    @classmethod
    def from_config(cls, company_id: str):
        """
        Create client from company configuration.
        
        Args:
            company_id: Company UUID
            
        Returns:
            WhatsAppAPIClient: Configured client instance
        """
        config = WhatsAppConfig.query.filter_by(company_id=company_id).first()
        
        if not config:
            raise ValueError(f"WhatsApp configuration not found for company {company_id}")
        
        return cls(api_key=config.api_key, server_address=config.server_address)
    
    def send_text_message(
        self,
        mobile: str,
        message: str,
        priority: int = 60
    ) -> Dict[str, Any]:
        """
        Send plain text message.
        
        Args:
            mobile: Mobile number in international format
            message: Message text
            priority: Message priority (0-30)
            
        Returns:
            dict: API response
        """
        try:
            # Format mobile number to international format
            mobile = format_phone_number(mobile)
            
            # Build query parameters for GET request
            params = {
                'api_key': self.api_key,
                'mobile': mobile,
                'message': message,
                'priority': priority
            }
            
            logger.info(f"Sending text message to {mobile} with priority {priority}")
            logger.debug(f"Request URL: {self.send_endpoint}")
            logger.debug(f"Request params: {params}")
            
            response = requests.get(self.send_endpoint, params=params, timeout=30)
            response.raise_for_status()
            
            # Log the response
            logger.info(f"API Response Status: {response.status_code}")
            logger.info(f"API Response: {response.text}")
            
            # Try to parse as JSON, otherwise return raw text
            try:
                result = response.json()
            except:
                result = {'raw': response.text}
            
            logger.info(f"Message sent successfully to {mobile}")
            
            return {
                'success': True,
                'response': result,
                'status_code': response.status_code,
                'raw_response': response.text
            }
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Error sending text message to {mobile}: {str(e)}")
            if hasattr(e, 'response') and e.response is not None:
                logger.error(f"Error response: {e.response.text}")
            return {
                'success': False,
                'error': str(e),
                'status_code': getattr(e.response, 'status_code', None) if hasattr(e, 'response') else None
            }
    
    def send_document_message(
        self,
        mobile: str,
        document_url: str,
        caption: str = '',
        priority: int = 60
    ) -> Dict[str, Any]:
        """
        Send document (PDF, etc.) message.
        
        Args:
            mobile: Mobile number in international format
            document_url: Document URL
            caption: Document caption/message
            priority: Message priority (0-30)
            
        Returns:
            dict: API response
        """
        try:
            # Format mobile number to international format
            mobile = format_phone_number(mobile)
            
            data = {
                'api_key': self.api_key,
                'mobile': mobile,
                'url': document_url,
                'caption': caption,
                'priority': priority,
                'type': '2'  # Document message
            }
            
            logger.info(f"Sending document to {mobile}: {document_url}")
            response = requests.post(self.send_endpoint, data=data, timeout=30)
            response.raise_for_status()
            
            result = response.json() if response.headers.get('content-type') == 'application/json' else {'raw': response.text}
            logger.info(f"Document sent successfully to {mobile}")
            
            return {
                'success': True,
                'response': result,
                'status_code': response.status_code
            }
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Error sending document to {mobile}: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'status_code': getattr(e.response, 'status_code', None) if hasattr(e, 'response') else None
            }
    
    def send_image_message(
        self,
        mobile: str,
        image_url: str,
        caption: str = '',
        priority: int = 60
    ) -> Dict[str, Any]:
        """
        Send image message.
        
        Args:
            mobile: Mobile number in international format
            image_url: Image URL
            caption: Image caption
            priority: Message priority (0-30)
            
        Returns:
            dict: API response
        """
        try:
            # Format mobile number to international format
            mobile = format_phone_number(mobile)
            
            data = {
                'api_key': self.api_key,
                'mobile': mobile,
                'url': image_url,
                'caption': caption,
                'priority': priority,
                'type': '1'  # Image message
            }
            
            logger.info(f"Sending image to {mobile}: {image_url}")
            response = requests.post(self.send_endpoint, data=data, timeout=30)
            response.raise_for_status()
            
            result = response.json() if response.headers.get('content-type') == 'application/json' else {'raw': response.text}
            logger.info(f"Image sent successfully to {mobile}")
            
            return {
                'success': True,
                'response': result,
                'status_code': response.status_code
            }
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Error sending image to {mobile}: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'status_code': getattr(e.response, 'status_code', None) if hasattr(e, 'response') else None
            }
    
    def send_personalized_bulk(
        self,
        messages_data: list,
        priority: int = 60
    ) -> Dict[str, Any]:
        """
        Send personalized messages using API's bulk personalized feature.
        
        Args:
            messages_data: List of dicts with 'mobile' and 'message' keys
            priority: Message priority (0-30)
            
        Returns:
            dict: API response
        """
        try:
            # Format according to API specification and format phone numbers
            formatted_messages = [
                {"mobile": format_phone_number(msg['mobile']), "message": msg['message']}
                for msg in messages_data
            ]
            
            import json
            data = {
                'api_key': self.api_key,
                'personalized': '1',
                'type': '0',
                'priority': priority,
                'message': json.dumps(formatted_messages)
            }
            
            logger.info(f"Sending personalized bulk messages to {len(messages_data)} recipients")
            response = requests.post(self.send_endpoint, data=data, timeout=60)
            response.raise_for_status()
            
            result = response.json() if response.headers.get('content-type') == 'application/json' else {'raw': response.text}
            logger.info(f"Personalized bulk messages sent successfully")
            
            return {
                'success': True,
                'response': result,
                'status_code': response.status_code
            }
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Error sending personalized bulk messages: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'status_code': getattr(e.response, 'status_code', None) if hasattr(e, 'response') else None
            }
    
    def test_connection(self) -> Dict[str, Any]:
        """
        Test API connection by verifying credentials.
        
        Returns:
            dict: Connection test result
        """
        try:
            # Send a test request to validate API key
            # Since there's no dedicated test endpoint, we'll just verify the API responds
            test_data = {
                'api_key': self.api_key
            }
            
            response = requests.post(self.send_endpoint, data=test_data, timeout=10)
            
            # Even if request fails, if we get a response it means API is reachable
            return {
                'success': True,
                'reachable': True,
                'status_code': response.status_code,
                'message': 'API is reachable'
            }
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Connection test failed: {str(e)}")
            return {
                'success': False,
                'reachable': False,
                'error': str(e),
                'message': 'Failed to reach WhatsApp API'
            }
