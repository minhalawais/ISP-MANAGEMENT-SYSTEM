from app import db
from app.models import DetailedLog, User
from sqlalchemy.exc import SQLAlchemyError
import logging
from sqlalchemy import and_

logger = logging.getLogger(__name__)

def get_all_logs(company_id, user_role):
    try:
        if user_role == 'super_admin':
            logs = DetailedLog.query.all()
        elif user_role in ['auditor', 'company_owner']:
            logs = DetailedLog.query.filter(DetailedLog.company_id == company_id).all()
        else:
            return []  # Other roles might not have access to logs
        
        result = []
        for log in logs:
            user = User.query.get(log.user_id)
            result.append({
                'id': str(log.id),
                'user_id': str(log.user_id),
                'user_name': f"{user.first_name} {user.last_name}" if user else "Unknown",
                'action': log.action,
                'table_name': log.table_name,
                'record_id': str(log.record_id),
                'old_values': log.old_values,
                'new_values': log.new_values,
                'ip_address': log.ip_address,
                'user_agent': log.user_agent,
                'timestamp': log.created_at.isoformat()
            })
        return result
    except SQLAlchemyError as e:
        logger.error(f"Database error: {str(e)}")
        raise
    except Exception as e:
        logger.error(f"Error retrieving logs: {str(e)}")
        raise

def get_log_by_id(id, company_id, user_role):
    try:
        if user_role == 'super_admin':
            log = DetailedLog.query.get(id)
        elif user_role in ['auditor', 'company_owner']:
            log = DetailedLog.query.filter(and_(DetailedLog.id == id, DetailedLog.company_id == company_id)).first()
        else:
            return None  # Other roles might not have access to logs
        
        if not log:
            return None

        user = User.query.get(log.user_id)
        return {
            'id': str(log.id),
            'user_id': str(log.user_id),
            'user_name': f"{user.first_name} {user.last_name}" if user else "Unknown",
            'action': log.action,
            'table_name': log.table_name,
            'record_id': str(log.record_id),
            'old_values': log.old_values,
            'new_values': log.new_values,
            'ip_address': log.ip_address,
            'user_agent': log.user_agent,
            'timestamp': log.timestamp.isoformat()
        }
    except SQLAlchemyError as e:
        logger.error(f"Database error: {str(e)}")
        raise
    except Exception as e:
        logger.error(f"Error retrieving log: {str(e)}")
        raise

# Note: We typically don't implement add, update, or delete methods for logs
# as they are system-generated. But if needed, you can implement these methods.

