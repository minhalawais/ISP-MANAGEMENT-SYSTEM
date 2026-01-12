from app import db
from app.models import Message, User, Customer
from app.utils.logging_utils import log_action
import uuid
from sqlalchemy.exc import SQLAlchemyError
import logging

logger = logging.getLogger(__name__)

def get_all_messages(company_id, user_role):
    try:
        if user_role == 'super_admin':
            messages = Message.query.order_by(Message.created_at.desc()).all()
        elif user_role == 'auditor':
            messages = Message.query.filter_by(is_active=True, company_id=company_id).order_by(Message.created_at.desc()).all()
        else:  # company_owner
            messages = Message.query.filter_by(company_id=company_id).order_by(Message.created_at.desc()).all()

        return [
            {
                'id': str(message.id),
                'sender': f"{message.sender.first_name} {message.sender.last_name}",
                'recipient': get_recipient_name(message.recipient_id),
                'subject': message.subject,
                'content': message.content,
                'is_read': message.is_read,
                'created_at': message.created_at.isoformat()
            } for message in messages
        ]
    except Exception as e:
        logger.error(f"Error retrieving messages: {str(e)}")
        raise

def get_recipient_name(recipient_id):
    user = User.query.get(recipient_id)
    if user:
        return f"{user.first_name} {user.last_name}"
    customer = Customer.query.get(recipient_id)
    if customer:
        return f"{customer.first_name} {customer.last_name}"
    return "Unknown Recipient"

def add_message(data, current_user_id, ip_address, user_agent):
    try:
        new_message = Message(
            company_id=uuid.UUID(data['company_id']),
            sender_id=uuid.UUID(data['sender_id']),
            recipient_id=uuid.UUID(data['recipient_id']),
            subject=data['subject'],
            content=data['content'],
            is_active=True
        )
        db.session.add(new_message)
        db.session.commit()

        log_action(
            current_user_id,
            'CREATE',
            'messages',
            new_message.id,
            None,
            data,
                        ip_address,
            user_agent,
            company_id
)

        return new_message
    except SQLAlchemyError as e:
        logger.error(f"Database error: {str(e)}")
        db.session.rollback()
        raise
    except Exception as e:
        logger.error(f"Error adding message: {str(e)}")
        raise

def update_message(id, data, company_id, user_role, current_user_id, ip_address, user_agent):
    try:
        if user_role == 'super_admin':
            message = Message.query.get(id)
        elif user_role == 'auditor':
            message = Message.query.filter_by(id=id, is_active=True, company_id=company_id).first()
        else:  # company_owner
            message = Message.query.filter_by(id=id, company_id=company_id).first()

        if not message:
            return None

        old_values = {
            'subject': message.subject,
            'content': message.content,
            'is_read': message.is_read,
            'is_active': message.is_active
        }

        message.subject = data.get('subject', message.subject)
        message.content = data.get('content', message.content)
        message.is_read = data.get('is_read', message.is_read)
        message.is_active = data.get('is_active', message.is_active)
        db.session.commit()

        log_action(
            current_user_id,
            'UPDATE',
            'messages',
            message.id,
            old_values,
            data,
                        ip_address,
            user_agent,
            company_id
)

        return message
    except SQLAlchemyError as e:
        logger.error(f"Database error: {str(e)}")
        db.session.rollback()
        raise
    except Exception as e:
        logger.error(f"Error updating message: {str(e)}")
        raise

def delete_message(id, company_id, user_role, current_user_id, ip_address, user_agent):
    try:
        if user_role == 'super_admin':
            message = Message.query.get(id)
        elif user_role == 'auditor':
            message = Message.query.filter_by(id=id, is_active=True, company_id=company_id).first()
        else:  # company_owner
            message = Message.query.filter_by(id=id, company_id=company_id).first()

        if not message:
            return False

        old_values = {
            'subject': message.subject,
            'content': message.content,
            'is_read': message.is_read,
            'is_active': message.is_active
        }

        db.session.delete(message)
        db.session.commit()

        log_action(
            current_user_id,
            'DELETE',
            'messages',
            message.id,
            old_values,
            None,
                        ip_address,
            user_agent,
            company_id
)

        return True
    except SQLAlchemyError as e:
        logger.error(f"Database error: {str(e)}")
        db.session.rollback()
        raise
    except Exception as e:
        logger.error(f"Error deleting message: {str(e)}")
        raise

