"""
WhatsApp API Routes
REST endpoints for WhatsApp messaging functionality.
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app import db
from app.models import (
    WhatsAppMessageQueue, WhatsAppDailyQuota, 
    WhatsAppTemplate, WhatsAppConfig
)
from app.models import Customer, Invoice
from app.services.whatsapp_queue_service import WhatsAppQueueService
from app.services.whatsapp_rate_limiter import WhatsAppRateLimiter
from app.services.whatsapp_api_client import WhatsAppAPIClient
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

whatsapp_bp = Blueprint('whatsapp', __name__, url_prefix='/api/whatsapp')


# ============================================================================
# MESSAGE QUEUE ENDPOINTS
# ============================================================================

@whatsapp_bp.route('/queue', methods=['GET'])
@jwt_required()
def get_message_queue():
    """Get all messages in queue with pagination and filters"""
    try:
        claims = get_jwt()
        company_id = claims['company_id']
        
        # Pagination
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)
        
        # Filters
        status = request.args.get('status')
        message_type = request.args.get('message_type')
        customer_id = request.args.get('customer_id')
        
        # Build query
        query = WhatsAppMessageQueue.query.filter_by(company_id=company_id, is_active=True)
        
        if status:
            query = query.filter_by(status=status)
        if message_type:
            query = query.filter_by(message_type=message_type)
        if customer_id:
            query = query.filter_by(customer_id=customer_id)
        
        # Execute with pagination
        pagination = query.order_by(
            WhatsAppMessageQueue.created_at.desc()
        ).paginate(page=page, per_page=per_page, error_out=False)
        
        messages = []
        for msg in pagination.items:
            messages.append({
                'id': str(msg.id),
                'customer_id': str(msg.customer_id),
                'customer_name': f"{msg.customer.first_name} {msg.customer.last_name}" if msg.customer else '',
                'mobile': msg.mobile,
                'message_type': msg.message_type,
                'message_content': msg.message_content,
                'media_type': msg.media_type,
                'media_url': msg.media_url,
                'priority': msg.priority,
                'status': msg.status,
                'retry_count': msg.retry_count,
                'error_message': msg.error_message,
                'scheduled_date': msg.scheduled_date.isoformat() if msg.scheduled_date else None,
                'sent_at': msg.sent_at.isoformat() if msg.sent_at else None,
                'created_at': msg.created_at.isoformat(),
                'related_invoice_id': str(msg.related_invoice_id) if msg.related_invoice_id else None
            })
        
        return jsonify({
            'messages': messages,
            'total': pagination.total,
            'pages': pagination.pages,
            'current_page': page,
            'per_page': per_page
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching message queue: {str(e)}")
        return jsonify({'error': str(e)}), 500


@whatsapp_bp.route('/queue/stats', methods=['GET'])
@jwt_required()
def get_queue_stats():
    """Get queue statistics"""
    try:
        claims = get_jwt()
        company_id = claims['company_id']
        
        stats = WhatsAppQueueService.get_queue_stats(company_id)
        
        return jsonify(stats), 200
        
    except Exception as e:
        logger.error(f"Error fetching queue stats: {str(e)}")
        return jsonify({'error': str(e)}), 500


@whatsapp_bp.route('/send-bulk', methods=['POST'])
@jwt_required()
def send_bulk_message():
    """Send bulk message to selected customers"""
    try:
        claims = get_jwt()
        company_id = claims['company_id']
        
        data = request.get_json()
        customer_ids = data.get('customer_ids', [])
        message_content = data.get('message')
        priority = data.get('priority', 60)
        message_type = data.get('message_type', 'custom')
        
        if not customer_ids:
            return jsonify({'error': 'No customers selected'}), 400
        
        if not message_content:
            return jsonify({'error': 'Message content required'}), 400
        
        # Enqueue messages
        messages = WhatsAppQueueService.enqueue_bulk_messages(
            company_id=company_id,
            customer_ids=customer_ids,
            message_content=message_content,
            message_type=message_type,
            priority=priority
        )
        
        return jsonify({
            'success': True,
            'messages_queued': len(messages),
            'message': f'Successfully queued {len(messages)} messages'
        }), 201
        
    except Exception as e:
        logger.error(f"Error sending bulk messages: {str(e)}")
        return jsonify({'error': str(e)}), 500


@whatsapp_bp.route('/send-personalized', methods=['POST'])
@jwt_required()
def send_personalized_messages():
    """Send personalized messages to customers"""
    try:
        claims = get_jwt()
        company_id = claims['company_id']
        
        data = request.get_json()
        messages_data = data.get('messages', [])
        
        if not messages_data:
            return jsonify({'error': 'No messages provided'}), 400
        
        # Enqueue personalized messages
        messages = WhatsAppQueueService.enqueue_personalized_messages(
            company_id=company_id,
            messages_data=messages_data
        )
        
        return jsonify({
            'success': True,
            'messages_queued': len(messages),
            'message': f'Successfully queued {len(messages)} personalized messages'
        }), 201
        
    except Exception as e:
        logger.error(f"Error sending personalized messages: {str(e)}")
        return jsonify({'error': str(e)}), 500


@whatsapp_bp.route('/retry/<message_id>', methods=['POST'])
@jwt_required()
def retry_message(message_id):
    """Retry a failed message"""
    try:
        claims = get_jwt()
        company_id = claims['company_id']
        
        message = WhatsAppMessageQueue.query.filter_by(
            id=message_id,
            company_id=company_id
        ).first()
        
        if not message:
            return jsonify({'error': 'Message not found'}), 404
        
        # Reset status to pending
        message.status = 'pending'
        message.error_message = None
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Message marked for retry'
        }), 200
        
    except Exception as e:
        logger.error(f"Error retrying message: {str(e)}")
        return jsonify({'error': str(e)}), 500


# ============================================================================
# QUOTA ENDPOINTS
# ============================================================================

@whatsapp_bp.route('/quota', methods=['GET'])
@jwt_required()
def get_quota_status():
    """Get current quota status"""
    try:
        claims = get_jwt()
        company_id = claims['company_id']
        
        stats = WhatsAppRateLimiter.get_quota_stats(company_id)
        
        return jsonify(stats), 200
        
    except Exception as e:
        logger.error(f"Error fetching quota status: {str(e)}")
        return jsonify({'error': str(e)}), 500


# ============================================================================
# TEMPLATE ENDPOINTS
# ============================================================================

@whatsapp_bp.route('/templates', methods=['GET'])
@jwt_required()
def get_templates():
    """Get all message templates"""
    try:
        claims = get_jwt()
        company_id = claims['company_id']
        
        templates = WhatsAppTemplate.query.filter_by(
            company_id=company_id,
            is_active=True
        ).order_by(WhatsAppTemplate.created_at.desc()).all()
        
        result = []
        for template in templates:
            result.append({
                'id': str(template.id),
                'name': template.name,
                'description': template.description,
                'template_text': template.template_text,
                'category': template.category,
                'message_type': template.message_type,
                'default_priority': template.default_priority,
                'created_at': template.created_at.isoformat()
            })
        
        return jsonify(result), 200
        
    except Exception as e:
        logger.error(f"Error fetching templates: {str(e)}")
        return jsonify({'error': str(e)}), 500


@whatsapp_bp.route('/templates', methods=['POST'])
@jwt_required()
def create_template():
    """Create new message template"""
    try:
        claims = get_jwt()
        company_id = claims['company_id']
        user_id = get_jwt_identity()  #Get user ID from identity
        
        data = request.get_json()
        
        template = WhatsAppTemplate(
            company_id=company_id,
            name=data.get('name'),
            description=data.get('description'),
            template_text=data.get('template_text'),
            category=data.get('category', 'custom'),
            message_type=data.get('message_type', 'custom'),
            default_priority=data.get('default_priority', 60),
            created_by=user_id
        )
        
        db.session.add(template)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'template_id': str(template.id),
            'message': 'Template created successfully'
        }), 201
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error creating template: {str(e)}")
        return jsonify({'error': str(e)}), 500


@whatsapp_bp.route('/templates/<template_id>', methods=['PUT'])
@jwt_required()
def update_template(template_id):
    """Update existing template"""
    try:
        claims = get_jwt()
        company_id = claims['company_id']
        
        template = WhatsAppTemplate.query.filter_by(
            id=template_id,
            company_id=company_id
        ).first()
        
        if not template:
            return jsonify({'error': 'Template not found'}), 404
        
        data = request.get_json()
        
        if 'name' in data:
            template.name = data['name']
        if 'description' in data:
            template.description = data['description']
        if 'template_text' in data:
            template.template_text = data['template_text']
        if 'category' in data:
            template.category = data['category']
        if 'default_priority' in data:
            template.default_priority = data['default_priority']
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Template updated successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error updating template: {str(e)}")
        return jsonify({'error': str(e)}), 500


@whatsapp_bp.route('/templates/<template_id>', methods=['DELETE'])
@jwt_required()
def delete_template(template_id):
    """Delete template (soft delete)"""
    try:
        claims = get_jwt()
        company_id = claims['company_id']
        
        template = WhatsAppTemplate.query.filter_by(
            id=template_id,
            company_id=company_id
        ).first()
        
        if not template:
            return jsonify({'error': 'Template not found'}), 404
        
        template.is_active = False
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Template deleted successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error deleting template: {str(e)}")
        return jsonify({'error': str(e)}), 500


# ============================================================================
# CONFIGURATION ENDPOINTS
# ============================================================================

@whatsapp_bp.route('/config', methods=['GET'])
@jwt_required()
def get_config():
    """Get WhatsApp configuration"""
    try:
        claims = get_jwt()
        company_id = claims['company_id']
        
        config = WhatsAppConfig.query.filter_by(company_id=company_id).first()
        
        if not config:
            return jsonify({
                'configured': False,
                'message': 'WhatsApp not configured'
            }), 200
        
        return jsonify({
            'configured': True,
            'api_key': config.api_key[:10] + '...' if config.api_key else '',  # Mask API key
            'server_address': config.server_address,
            'auto_send_invoices': config.auto_send_invoices,
            'auto_send_deadline_alerts': config.auto_send_deadline_alerts,
            'message_send_time': config.message_send_time,
            'deadline_check_time': config.deadline_check_time,
            'deadline_alert_days_before': config.deadline_alert_days_before,
            'daily_quota_limit': config.daily_quota_limit,
            'quota_buffer': config.quota_buffer,
            'connection_status': config.connection_status,
            'last_connection_test': config.last_connection_test.isoformat() if config.last_connection_test else None
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching config: {str(e)}")
        return jsonify({'error': str(e)}), 500


@whatsapp_bp.route('/config', methods=['PUT'])
@jwt_required()
def update_config():
    """Create or update WhatsApp configuration"""
    try:
        claims = get_jwt()
        company_id = claims['company_id']
        
        data = request.get_json()
        
        config = WhatsAppConfig.query.filter_by(company_id=company_id).first()
        
        if not config:
            # Create new config
            config = WhatsAppConfig(
                company_id=company_id,
                api_key=data.get('api_key'),
                server_address=data.get('server_address'),
                auto_send_invoices=data.get('auto_send_invoices', True),
                auto_send_deadline_alerts=data.get('auto_send_deadline_alerts', True),
                message_send_time=data.get('message_send_time', '09:00'),
                deadline_check_time=data.get('deadline_check_time', '09:00'),
                deadline_alert_days_before=data.get('deadline_alert_days_before', 2),
                daily_quota_limit=data.get('daily_quota_limit', 200),
                quota_buffer=data.get('quota_buffer', 5)
            )
            db.session.add(config)
        else:
            # Update existing config
            if 'api_key' in data:
                config.api_key = data['api_key']
            if 'server_address' in data:
                config.server_address = data['server_address']
            if 'auto_send_invoices' in data:
                config.auto_send_invoices = data['auto_send_invoices']
            if 'auto_send_deadline_alerts' in data:
                config.auto_send_deadline_alerts = data['auto_send_deadline_alerts']
            if 'message_send_time' in data:
                config.message_send_time = data['message_send_time']
            if 'deadline_check_time' in data:
                config.deadline_check_time = data['deadline_check_time']
            if 'deadline_alert_days_before' in data:
                config.deadline_alert_days_before = data['deadline_alert_days_before']
            if 'daily_quota_limit' in data:
                config.daily_quota_limit = data['daily_quota_limit']
            if 'quota_buffer' in data:
                config.quota_buffer = data['quota_buffer']
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Configuration updated successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error updating config: {str(e)}")
        return jsonify({'error': str(e)}), 500


@whatsapp_bp.route('/config/test-connection', methods=['POST'])
@jwt_required()
def test_connection():
    """Test WhatsApp API connection"""
    try:
        claims = get_jwt()
        company_id = claims['company_id']
        
        client = WhatsAppAPIClient.from_config(company_id)
        result = client.test_connection()
        
        # Update config with connection status
        config = WhatsAppConfig.query.filter_by(company_id=company_id).first()
        if config:
            config.last_connection_test = datetime.now()
            config.connection_status = 'success' if result['success'] else 'failed'
            db.session.commit()
        
        return jsonify(result), 200
        
    except Exception as e:
        logger.error(f"Error testing connection: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
