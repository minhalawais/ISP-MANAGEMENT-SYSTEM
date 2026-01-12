from app import db
from app.models import User
from app.utils.logging_utils import log_action
from sqlalchemy.exc import SQLAlchemyError
import logging
import os
import uuid
from werkzeug.utils import secure_filename

logger = logging.getLogger(__name__)

UPLOAD_FOLDER = 'uploads/profile_pictures'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

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
                'cnic': user.cnic,
                'picture': user.picture
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


def change_password(user_id, current_password, new_password, ip_address, user_agent):
    """
    Change user's password after verifying current password.
    
    Args:
        user_id: UUID of the user
        current_password: Current password for verification
        new_password: New password to set
        ip_address: Request IP
        user_agent: Request user agent
    
    Returns:
        dict with success status or error message
    """
    try:
        user = User.query.get(user_id)
        if not user:
            return {'success': False, 'error': 'User not found'}
        
        # Verify current password
        if not user.check_password(current_password):
            return {'success': False, 'error': 'Current password is incorrect'}
        
        # Validate new password
        if len(new_password) < 6:
            return {'success': False, 'error': 'New password must be at least 6 characters'}
        
        # Set new password
        user.set_password(new_password)
        db.session.commit()
        
        log_action(
            user_id,
            'UPDATE',
            'users',
            user.id,
            {'action': 'password_change'},
            {'action': 'password_changed'},
            ip_address,
            user_agent
        )
        
        logger.info(f"Password changed successfully for user {user_id}")
        return {'success': True, 'message': 'Password changed successfully'}
        
    except SQLAlchemyError as e:
        logger.error(f"Database error changing password: {str(e)}")
        db.session.rollback()
        return {'success': False, 'error': 'Database error occurred'}
    except Exception as e:
        logger.error(f"Error changing password: {str(e)}")
        return {'success': False, 'error': str(e)}


def update_profile_picture(user_id, file, ip_address, user_agent):
    """
    Upload and update user's profile picture.
    
    Args:
        user_id: UUID of the user
        file: File object from request
        ip_address: Request IP
        user_agent: Request user agent
    
    Returns:
        dict with success status and file path or error message
    """
    try:
        if not file:
            return {'success': False, 'error': 'No file provided'}
        
        if not allowed_file(file.filename):
            return {'success': False, 'error': 'File type not allowed. Use PNG, JPG, JPEG, GIF, or WEBP'}
        
        user = User.query.get(user_id)
        if not user:
            return {'success': False, 'error': 'User not found'}
        
        # Create upload directory if it doesn't exist
        os.makedirs(UPLOAD_FOLDER, exist_ok=True)
        
        # Delete old picture if exists
        if user.picture and os.path.exists(user.picture):
            try:
                os.remove(user.picture)
            except Exception as e:
                logger.warning(f"Could not delete old profile picture: {e}")
        
        # Generate unique filename
        file_extension = file.filename.rsplit('.', 1)[1].lower()
        filename = f"{user_id}_{uuid.uuid4().hex[:8]}.{file_extension}"
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        
        # Save file
        file.save(filepath)
        
        # Update user record
        user.picture = filepath
        db.session.commit()
        
        log_action(
            user_id,
            'UPDATE',
            'users',
            user.id,
            {'action': 'profile_picture_update'},
            {'picture': filepath},
            ip_address,
            user_agent
        )
        
        logger.info(f"Profile picture updated for user {user_id}")
        return {'success': True, 'picture': filepath}
        
    except SQLAlchemyError as e:
        logger.error(f"Database error updating profile picture: {str(e)}")
        db.session.rollback()
        return {'success': False, 'error': 'Database error occurred'}
    except Exception as e:
        logger.error(f"Error updating profile picture: {str(e)}")
        return {'success': False, 'error': str(e)}
