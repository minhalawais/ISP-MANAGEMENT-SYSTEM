"""
Phone Number Formatting Utility
Formats Pakistani phone numbers to international format for WhatsApp.
"""

import re
import logging

logger = logging.getLogger(__name__)


def format_phone_number(phone: str, country_code: str = '92') -> str:
    """
    Format phone number to international format for WhatsApp.
    
    Converts numbers like:
    - 03120614727 -> 923120614727
    - 3120614727 -> 923120614727
    - 923120614727 -> 923120614727 (already formatted)
    - +923120614727 -> 923120614727
    
    Args:
        phone: Phone number in any format
        country_code: Country code (default '92' for Pakistan)
        
    Returns:
        str: Formatted phone number in international format (e.g., '923120614727')
        
    Raises:
        ValueError: If phone number is invalid or empty
    """
    if not phone:
        raise ValueError("Phone number cannot be empty")
    
    # Remove all non-digit characters (spaces, dashes, parentheses, plus signs, etc.)
    phone = re.sub(r'\D', '', phone)
    
    if not phone:
        raise ValueError("Phone number must contain digits")
    
    # If number starts with country code, return as is
    if phone.startswith(country_code):
        formatted = phone
    # If number starts with 0, replace 0 with country code
    elif phone.startswith('0'):
        formatted = country_code + phone[1:]
    # Otherwise, prepend country code
    else:
        formatted = country_code + phone
    
    # Validate the formatted number
    # Pakistani mobile numbers should be 12 digits (92 + 10 digits)
    if not re.match(r'^\d{10,15}$', formatted):
        raise ValueError(f"Invalid phone number format: {formatted}")
    
    logger.debug(f"Formatted phone number: {phone} -> {formatted}")
    
    return formatted


def validate_phone_number(phone: str) -> bool:
    """
    Validate if a phone number is in correct international format.
    
    Args:
        phone: Phone number string
        
    Returns:
        bool: True if valid, False otherwise
    """
    if not phone:
        return False
    
    # Should be digits only and between 10-15 characters
    pattern = r'^\d{10,15}$'
    return bool(re.match(pattern, phone))
