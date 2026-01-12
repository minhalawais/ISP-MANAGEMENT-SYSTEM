from app import db
from app.models import DetailedLog, User
from sqlalchemy.exc import SQLAlchemyError
import logging
from sqlalchemy import and_, or_, desc, asc
from sqlalchemy import func

logger = logging.getLogger(__name__)


def get_all_logs_paginated(company_id, user_role, page=1, page_size=20, sort_by='created_at', sort_dir='desc', 
                          q=None, filters=None):
    try:
        filters = filters or {}
        
        # Base query with role-based filtering
        if user_role == 'super_admin':
            query = DetailedLog.query
        elif user_role in ['auditor', 'company_owner']:
            query = DetailedLog.query.filter(DetailedLog.company_id == company_id)
        else:
            return [], 0
        
        # Apply text search
        if q:
            search_term = f"%{q}%"
            query = query.join(User, DetailedLog.user_id == User.id).filter(
                or_(
                    User.first_name.ilike(search_term),
                    User.last_name.ilike(search_term),
                    DetailedLog.action.ilike(search_term),
                    DetailedLog.table_name.ilike(search_term),
                    DetailedLog.ip_address.ilike(search_term)
                )
            )
        
        # Apply column filters
        if filters.get('action'):
            query = query.filter(DetailedLog.action == filters['action'])
        if filters.get('table_name'):
            query = query.filter(DetailedLog.table_name == filters['table_name'])
        if filters.get('user_name'):
            query = query.join(User, DetailedLog.user_id == User.id).filter(
                or_(
                    User.first_name.ilike(f"%{filters['user_name']}%"),
                    User.last_name.ilike(f"%{filters['user_name']}%")
                )
            )
        
        # Get total count before pagination
        total = query.count()
        
        # Apply sorting
        sort_column = getattr(DetailedLog, sort_by, DetailedLog.created_at)
        if sort_dir.lower() == 'desc':
            query = query.order_by(desc(sort_column))
        else:
            query = query.order_by(asc(sort_column))
        
        # Apply pagination
        logs = query.offset((page - 1) * page_size).limit(page_size).all()
        
        # Format results
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
                'timestamp': log.created_at.isoformat(),
                'created_at': log.created_at.isoformat()
            })
        
        return result, total
        
    except SQLAlchemyError as e:
        logger.error(f"Database error: {str(e)}")
        raise
    except Exception as e:
        logger.error(f"Error retrieving logs: {str(e)}")
        raise

def get_logs_summary(company_id, user_role):
    try:
        if user_role == 'super_admin':
            total = DetailedLog.query.count()
        elif user_role in ['auditor', 'company_owner']:
            total = DetailedLog.query.filter(DetailedLog.company_id == company_id).count()
        else:
            total = 0
        
        return {
            'total': total,
            'active': total,  # Logs don't have active/inactive status
            'inactive': 0
        }
    except Exception as e:
        logger.error(f"Error getting logs summary: {str(e)}")
        return {'total': 0, 'active': 0, 'inactive': 0}

def stream_logs(company_id, user_role, sort_by, sort_dir, qtext, filters):
    try:
        # Base query
        if user_role == 'super_admin':
            query = DetailedLog.query
        elif user_role in ['auditor', 'company_owner']:
            query = DetailedLog.query.filter(DetailedLog.company_id == company_id)
        else:
            return
        
        # Apply filters
        if qtext:
            search_term = f"%{qtext}%"
            query = query.join(User, DetailedLog.user_id == User.id).filter(
                or_(
                    User.first_name.ilike(search_term),
                    User.last_name.ilike(search_term),
                    DetailedLog.action.ilike(search_term),
                    DetailedLog.table_name.ilike(search_term)
                )
            )
        
        # Apply sorting
        sort_column = getattr(DetailedLog, sort_by, DetailedLog.created_at)
        if sort_dir.lower() == 'desc':
            query = query.order_by(desc(sort_column))
        else:
            query = query.order_by(asc(sort_column))
        
        # Stream results
        for log in query.yield_per(1000):
            user = User.query.get(log.user_id)
            yield {
                'id': str(log.id),
                'user_name': f"{user.first_name} {user.last_name}" if user else "Unknown",
                'action': log.action,
                'table_name': log.table_name,
                'record_id': str(log.record_id),
                'ip_address': log.ip_address,
                'timestamp': log.created_at.isoformat()
            }
            
    except Exception as e:
        logger.error(f"Error streaming logs: {str(e)}")
        raise

# Keep existing functions for backward compatibility
def get_all_logs(company_id, user_role):
    """Legacy function - use paginated version instead"""
    logs, _ = get_all_logs_paginated(company_id, user_role, page=1, page_size=1000)
    return logs

def get_log_by_id(id, company_id, user_role):
    try:
        if user_role == 'super_admin':
            log = DetailedLog.query.get(id)
        elif user_role in ['auditor', 'company_owner']:
            log = DetailedLog.query.filter(and_(DetailedLog.id == id, DetailedLog.company_id == company_id)).first()
        else:
            return None
        
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
            'timestamp': log.created_at.isoformat()
        }
    except SQLAlchemyError as e:
        logger.error(f"Database error: {str(e)}")
        raise
    except Exception as e:
        logger.error(f"Error retrieving log: {str(e)}")
        raise