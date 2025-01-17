from app import db
from app.models import ServicePlan
from app.utils.logging_utils import log_action
import uuid
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
import logging

logger = logging.getLogger(__name__)

def get_all_service_plans(company_id, user_role):
    try:
        if user_role == 'super_admin':
            service_plans = ServicePlan.query.all()
        elif user_role == 'auditor':
            service_plans = ServicePlan.query.filter_by(is_active=True, company_id=company_id).all()
        else:  # company_owner
            service_plans = ServicePlan.query.filter_by(company_id=company_id).all()

        return [
            {
                'id': str(plan.id),
                'name': plan.name,
                'description': plan.description,
                'speed_mbps': plan.speed_mbps,
                'data_cap_gb': plan.data_cap_gb,
                'price': float(plan.price),
                'is_active': plan.is_active
            } for plan in service_plans
        ]
    except Exception as e:
        logger.error(f"Error retrieving service plans: {str(e)}")
        raise

def add_service_plan(data, current_user_id, ip_address, user_agent):
    try:
        new_service_plan = ServicePlan(
            company_id=uuid.UUID(data['company_id']),
            name=data['name'],
            description=data['description'],
            speed_mbps=data['speed_mbps'],
            data_cap_gb=data['data_cap_gb'],
            price=data['price'],
            is_active=True
        )
        db.session.add(new_service_plan)
        db.session.commit()

        log_action(
            current_user_id,
            'CREATE',
            'service_plans',
            new_service_plan.id,
            None,
            data,
                        ip_address,
            user_agent,
            company_id
)

        return new_service_plan
    except SQLAlchemyError as e:
        logger.error(f"Database error: {str(e)}")
        db.session.rollback()
        raise
    except Exception as e:
        logger.error(f"Error adding service plan: {str(e)}")
        raise

def update_service_plan(id, data, company_id, user_role, current_user_id, ip_address, user_agent):
    try:
        if user_role == 'super_admin':
            service_plan = ServicePlan.query.get(id)
        else:  # company_owner
            service_plan = ServicePlan.query.filter_by(id=id, company_id=company_id).first()

        if not service_plan:
            return None

        old_values = {
            'name': service_plan.name,
            'description': service_plan.description,
            'speed_mbps': service_plan.speed_mbps,
            'data_cap_gb': service_plan.data_cap_gb,
            'price': float(service_plan.price),
            'is_active': service_plan.is_active
        }

        service_plan.name = data.get('name', service_plan.name)
        service_plan.description = data.get('description', service_plan.description)
        service_plan.speed_mbps = data.get('speed_mbps', service_plan.speed_mbps)
        service_plan.data_cap_gb = data.get('data_cap_gb', service_plan.data_cap_gb)
        service_plan.price = data.get('price', service_plan.price)
        service_plan.is_active = data.get('is_active', service_plan.is_active)
        db.session.commit()

        log_action(
            current_user_id,
            'UPDATE',
            'service_plans',
            service_plan.id,
            old_values,
            data,
                        ip_address,
            user_agent,
            company_id
)

        return service_plan
    except SQLAlchemyError as e:
        logger.error(f"Database error: {str(e)}")
        db.session.rollback()
        raise
    except Exception as e:
        logger.error(f"Error updating service plan: {str(e)}")
        raise

def delete_service_plan(id, company_id, user_role, current_user_id, ip_address, user_agent):
    try:
        if user_role == 'super_admin':
            service_plan = ServicePlan.query.get(id)
        else:  # company_owner
            service_plan = ServicePlan.query.filter_by(id=id, company_id=company_id).first()

        if not service_plan:
            return False

        old_values = {
            'name': service_plan.name,
            'description': service_plan.description,
            'speed_mbps': service_plan.speed_mbps,
            'data_cap_gb': service_plan.data_cap_gb,
            'price': float(service_plan.price),
            'is_active': service_plan.is_active
        }

        db.session.delete(service_plan)
        db.session.commit()

        log_action(
            current_user_id,
            'DELETE',
            'service_plans',
            service_plan.id,
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
        logger.error(f"Error deleting service plan: {str(e)}")
        raise

def toggle_service_plan_status(id, company_id, user_role, current_user_id, ip_address, user_agent):
    try:
        if user_role == 'super_admin':
            service_plan = ServicePlan.query.get(id)
        else:  # company_owner
            service_plan = ServicePlan.query.filter_by(id=id, company_id=company_id).first()

        if not service_plan:
            return None

        old_values = {
            'is_active': service_plan.is_active
        }

        service_plan.is_active = not service_plan.is_active
        db.session.commit()

        log_action(
            current_user_id,
            'UPDATE',
            'service_plans',
            service_plan.id,
            old_values,
            {'is_active': service_plan.is_active},
                        ip_address,
            user_agent,
            company_id
)

        return service_plan
    except SQLAlchemyError as e:
        logger.error(f"Database error: {str(e)}")
        db.session.rollback()
        raise
    except Exception as e:
        logger.error(f"Error toggling service plan status: {str(e)}")
        raise

