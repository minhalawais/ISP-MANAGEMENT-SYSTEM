"""
WhatsApp Message Queue Service
Handles enqueueing, fetching, and updating WhatsApp messages.
"""

from app import db
from app.models import WhatsAppMessageQueue, WhatsAppConfig
from app.models import Customer, Invoice
from app.utils.phone_formatter import format_phone_number
from datetime import datetime
import re
from sqlalchemy import and_, or_
import logging

logger = logging.getLogger(__name__)


class WhatsAppQueueService:
    """Service for managing WhatsApp message queue operations"""
    
    @staticmethod
    def validate_mobile_number(mobile: str) -> bool:
        """
        Validate mobile number is in international format (923XXXXXXXXX)
        
        Args:
            mobile: Mobile number string
            
        Returns:
            bool: True if valid, False otherwise
        """
        # Pattern for international format (country code + number)
        # Example: 923001234567 (Pakistan), 234XXXXXXXXXX (Nigeria), etc.
        pattern = r'^\d{10,15}$'
        return bool(re.match(pattern, mobile))
    
    @staticmethod
    def enqueue_message(
        company_id: str,
        customer_id: str,
        mobile: str,
        message_content: str,
        message_type: str = 'custom',
        media_type: str = 'text',
        media_url: str = None,
        media_caption: str = None,
        priority: int = 60,
        related_invoice_id: str = None,
        scheduled_date: datetime = None
    ) -> WhatsAppMessageQueue:
        """
        Add a single message to the queue.
        
        Args:
            company_id: Company UUID
            customer_id: Customer UUID
            mobile: Mobile number in international format
            message_content: Message text
            message_type: Type of message ('invoice', 'deadline_alert', 'custom', etc.)
            media_type: 'text', 'image', or 'document'
            media_url: URL or path to media file
            media_caption: Caption for media
            priority: Message priority (0=High, 10=Medium, 20=Low)
            related_invoice_id: Optional invoice UUID
            scheduled_date: Optional datetime to schedule message
            
        Returns:
            WhatsAppMessageQueue: Created message object
        """
        try:
            # Format mobile number to international format
            mobile = format_phone_number(mobile)
            
            # Validate mobile number
            if not WhatsAppQueueService.validate_mobile_number(mobile):
                raise ValueError(f"Invalid mobile number format: {mobile}")
            
            # Create message
            message = WhatsAppMessageQueue(
                company_id=company_id,
                customer_id=customer_id,
                mobile=mobile,
                message_content=message_content,
                message_type=message_type,
                media_type=media_type,
                media_url=media_url,
                media_caption=media_caption,
                priority=priority,
                status='pending',
                related_invoice_id=related_invoice_id,
                scheduled_date=scheduled_date
            )
            
            db.session.add(message)
            db.session.commit()
            
            logger.info(f"Enqueued message {message.id} for customer {customer_id}")
            return message
            
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error enqueueing message: {str(e)}")
            raise
    
    @staticmethod
    def enqueue_bulk_messages(
        company_id: str,
        customer_ids: list,
        message_content: str,
        message_type: str = 'custom',
        priority: int = 60,
        media_type: str = 'text',
        media_url: str = None,
        media_caption: str = None
    ) -> list:
        """
        Enqueue same message for multiple customers.
        
        Args:
            company_id: Company UUID
            customer_ids: List of customer UUIDs
            message_content: Message text (same for all)
            message_type: Type of message
            priority: Message priority
            media_type: 'text', 'image', or 'document'
            media_url: URL or path to media file
            media_caption: Caption for media
            
        Returns:
            list: List of created WhatsAppMessageQueue objects
        """
        try:
            messages = []
            
            # Fetch customers to get mobile numbers
            customers = Customer.query.filter(
                Customer.id.in_(customer_ids),
                Customer.company_id == company_id,
                Customer.is_active == True
            ).all()
            
            for customer in customers:
                # Use phone_1 as primary contact
                mobile = customer.phone_1
                
                if not mobile:
                    logger.warning(f"Customer {customer.id} has no phone number, skipping")
                    continue
                
                # Format phone number to international format
                try:
                    mobile = format_phone_number(mobile)
                except ValueError as e:
                    logger.warning(f"Invalid phone number for customer {customer.id}: {str(e)}, skipping")
                    continue
                
                message = WhatsAppMessageQueue(
                    company_id=company_id,
                    customer_id=customer.id,
                    mobile=mobile,
                    message_content=message_content,
                    message_type=message_type,
                    media_type=media_type,
                    media_url=media_url,
                    media_caption=media_caption,
                    priority=priority,
                    status='pending'
                )
                
                db.session.add(message)
                messages.append(message)
            
            db.session.commit()
            logger.info(f"Enqueued {len(messages)} bulk messages")
            
            return messages
            
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error enqueueing bulk messages: {str(e)}")
            raise
    
    @staticmethod
    def enqueue_personalized_messages(
        company_id: str,
        messages_data: list
    ) -> list:
        """
        Enqueue personalized messages for multiple customers.
        
        Args:
            company_id: Company UUID
            messages_data: List of dicts with keys:
                - customer_id: Customer UUID
                - message: Message text (unique per customer)
                - priority: Optional priority (default 20)
                - media_type: Optional media type
                - media_url: Optional media URL
                
        Returns:
            list: List of created WhatsAppMessageQueue objects
        """
        try:
            messages = []
            customer_ids = [msg['customer_id'] for msg in messages_data]
            
            # Fetch customers
            customers = Customer.query.filter(
                Customer.id.in_(customer_ids),
                Customer.company_id == company_id,
                Customer.is_active == True
            ).all()
            
            # Create customer lookup dict
            customer_dict = {str(c.id): c for c in customers}
            
            for msg_data in messages_data:
                customer_id = msg_data['customer_id']
                customer = customer_dict.get(customer_id)
                
                if not customer:
                    logger.warning(f"Customer {customer_id} not found, skipping")
                    continue
                
                mobile = customer.phone_1
                if not mobile:
                    logger.warning(f"Customer {customer_id} has no phone number, skipping")
                    continue
                
                # Format phone number to international format
                try:
                    mobile = format_phone_number(mobile)
                except ValueError as e:
                    logger.warning(f"Invalid phone number for customer {customer_id}: {str(e)}, skipping")
                    continue
                
                message = WhatsAppMessageQueue(
                    company_id=company_id,
                    customer_id=customer.id,
                    mobile=mobile,
                    message_content=msg_data['message'],
                    message_type=msg_data.get('message_type', 'custom'),
                    media_type=msg_data.get('media_type', 'text'),
                    media_url=msg_data.get('media_url'),
                    media_caption=msg_data.get('media_caption'),
                    priority=msg_data.get('priority', 60),
                    status='pending'
                )
                
                db.session.add(message)
                messages.append(message)
            
            db.session.commit()
            logger.info(f"Enqueued {len(messages)} personalized messages")
            
            return messages
            
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error enqueueing personalized messages: {str(e)}")
            raise
    
    @staticmethod
    def get_pending_messages(limit: int = 200, company_id: str = None) -> list:
        """
        Fetch pending messages ordered by priority (ascending = higher priority first).
        Excludes scheduled messages whose time hasn't arrived yet.
        
        Args:
            limit: Maximum number of messages to fetch
            company_id: Optional company filter
            
        Returns:
            list: List of WhatsAppMessageQueue objects
        """
        try:
            query = WhatsAppMessageQueue.query.filter(
                WhatsAppMessageQueue.status == 'pending',
                WhatsAppMessageQueue.is_active == True
            )
            
            # Filter by company
            if company_id:
                query = query.filter(WhatsAppMessageQueue.company_id == company_id)
            
            # Exclude future scheduled messages
            query = query.filter(
                or_(
                    WhatsAppMessageQueue.scheduled_date == None,
                    WhatsAppMessageQueue.scheduled_date <= datetime.now()
                )
            )
            
            # Order by priority (0 first), then by creation date
            messages = query.order_by(
                WhatsAppMessageQueue.priority.asc(),
                WhatsAppMessageQueue.created_at.asc()
            ).limit(limit).all()
            
            return messages
            
        except Exception as e:
            logger.error(f"Error fetching pending messages: {str(e)}")
            raise
    
    @staticmethod
    def update_message_status(
        message_id: str,
        status: str,
        api_response: dict = None,
        api_message_id: str = None,
        error_message: str = None
    ) -> WhatsAppMessageQueue:
        """
        Update message status after send attempt.
        
        Args:
            message_id: Message UUID
            status: New status ('sent', 'failed', etc.)
            api_response: API response JSON
            api_message_id: WhatsApp API's message ID
            error_message: Error message if failed
            
        Returns:
            WhatsAppMessageQueue: Updated message object
        """
        try:
            message = WhatsAppMessageQueue.query.get(message_id)
            
            if not message:
                raise ValueError(f"Message {message_id} not found")
            
            message.status = status
            
            if status == 'sent':
                message.sent_at = datetime.now()
            
            if api_response:
                message.api_response = api_response
            
            if api_message_id:
                message.api_message_id = api_message_id
            
            if error_message:
                message.error_message = error_message
                message.retry_count += 1
                
                # Mark as permanently failed if max retries exceeded
                if message.retry_count >= message.max_retry:
                    message.status = 'failed_permanent'
            
            db.session.commit()
            logger.info(f"Updated message {message_id} status to {status}")
            
            return message
            
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error updating message status: {str(e)}")
            raise
    
    @staticmethod
    def get_queue_stats(company_id: str = None) -> dict:
        """
        Get statistics about message queue.
        
        Args:
            company_id: Optional company filter
            
        Returns:
            dict: Statistics including counts by status
        """
        try:
            query = WhatsAppMessageQueue.query
            
            if company_id:
                query = query.filter(WhatsAppMessageQueue.company_id == company_id)
            
            total = query.count()
            pending = query.filter(WhatsAppMessageQueue.status == 'pending').count()
            sent = query.filter(WhatsAppMessageQueue.status == 'sent').count()
            failed = query.filter(WhatsAppMessageQueue.status == 'failed').count()
            failed_permanent = query.filter(WhatsAppMessageQueue.status == 'failed_permanent').count()
            
            return {
                'total': total,
                'pending': pending,
                'sent': sent,
                'failed': failed,
                'failed_permanent': failed_permanent
            }
            
        except Exception as e:
            logger.error(f"Error getting queue stats: {str(e)}")
            raise
    
    @staticmethod
    def replace_placeholders(template: str, customer: Customer, invoice: Invoice = None) -> str:
        """
        Replace placeholders in message template with actual data.
        
        Supported placeholders:
        - {{customer_name}}: Customer's full name
        - {{first_name}}: Customer's first name
        - {{plan_name}}: Service plan name
        - {{invoice_number}}: Invoice number
        - {{amount}}: Invoice amount
        - {{due_date}}: Invoice due date
        
        Args:
            template: Message template string
            customer: Customer object
            invoice: Optional Invoice object
            
        Returns:
            str: Message with placeholders replaced
        """
        message = template
        
        # Customer placeholders
        message = message.replace('{{customer_name}}', f"{customer.first_name} {customer.last_name}")
        message = message.replace('{{first_name}}', customer.first_name)
        
        # Service plan
        if customer.service_plan:
            message = message.replace('{{plan_name}}', customer.service_plan.name)
        
        # Invoice placeholders
        if invoice:
            message = message.replace('{{invoice_number}}', invoice.invoice_number)
            message = message.replace('{{amount}}', str(invoice.total_amount))
            message = message.replace('{{due_date}}', invoice.due_date.strftime('%Y-%m-%d'))
        
        return message
