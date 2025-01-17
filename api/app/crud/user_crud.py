from app import db
from app.models import User
from app.utils.logging_utils import log_action
from sqlalchemy.exc import SQLAlchemyError
import logging

logger = logging.getLogger(__name__)

def get_user_by_id(user_id):
    try:
        user = User.query.get(user_id)
        if user:
            return {
                'id': str(user.id),
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'role': user.role,
                'contact_number': user.contact_number,
                'cnic': user.cnic
            }
        return None
    except Exception as e:
        logger.error(f"Error getting user by id: {str(e)}")
        raise

def update_user(user_id, data, current_user_id, ip_address, user_agent):
    try:
        user = User.query.get(user_id)
        if user:
            old_values = {
                'first_name': user.first_name,
                'last_name': user.last_name,
                'email': user.email,
                'contact_number': user.contact_number
            }

            user.first_name = data.get('first_name', user.first_name)
            user.last_name = data.get('last_name', user.last_name)
            user.email = data.get('email', user.email)
            user.contact_number = data.get('contact_number', user.contact_number)
            db.session.commit()

            log_action(
                current_user_id,
                'UPDATE',
                'users',
                user.id,
                old_values,
                data,
                ip_address,
                user_agent
            )

            return user
        return None
    except SQLAlchemyError as e:
        logger.error(f"Database error updating user: {str(e)}")
        db.session.rollback()
        raise
    except Exception as e:
        logger.error(f"Error updating user: {str(e)}")
        raise

