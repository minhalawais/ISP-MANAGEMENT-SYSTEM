from app import db
from app.models import Area
from app.utils.logging_utils import log_action
import uuid
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
import logging

logger = logging.getLogger(__name__)

def get_all_areas(company_id, user_role):
    if user_role == 'super_admin':
        areas = Area.query.order_by(Area.created_at.desc()).all()
    elif user_role == 'auditor':
        areas = Area.query.filter_by(is_active=True, company_id=company_id).order_by(Area.created_at.desc()).all()
    elif user_role == 'company_owner':
        areas = Area.query.filter_by(company_id=company_id).order_by(Area.created_at.desc()).all()
    
    return [{
        'id': str(area.id),
        'name': area.name,
        'description': area.description,
        'is_active': area.is_active,
        'sub_zones_count': area.sub_zones.count() if hasattr(area, 'sub_zones') else 0
    } for area in areas]

def add_area(data, user_role, current_user_id, ip_address, user_agent):
    new_area = Area(
        company_id=uuid.UUID(data['company_id']),
        name=data['name'],
        description=data.get('description')
    )
    db.session.add(new_area)
    db.session.commit()

    log_action(
        current_user_id,
        'CREATE',
        'areas',
        new_area.id,
        None,
        data,
        ip_address,
        user_agent,
        company_id
    )

    return new_area

def update_area(id, data, company_id, user_role, current_user_id, ip_address, user_agent):
    if user_role == 'super_admin':
        area = Area.query.filter_by(id=id).first()
    elif user_role == 'auditor':
        area = Area.query.filter_by(id=id, is_active=True, company_id=company_id).first()
    elif user_role == 'company_owner':
        area = Area.query.filter_by(id=id, company_id=company_id).first()
    
    if not area:
        return None

    old_values = {
        'name': area.name,
        'description': area.description,
        'is_active': area.is_active
    }

    area.name = data.get('name', area.name)
    area.description = data.get('description', area.description)
    area.is_active = data.get('is_active', area.is_active)
    db.session.commit()

    log_action(
        current_user_id,
        'UPDATE',
        'areas',
        area.id,
        old_values,
        data,
        ip_address,
        user_agent,
        company_id
    )

    return area

def delete_area(id, company_id, user_role, current_user_id, ip_address, user_agent):
    if user_role == 'super_admin':
        area = Area.query.filter_by(id=id).first()
    elif user_role == 'auditor':
        area = Area.query.filter_by(id=id, is_active=True, company_id=company_id).first()
    elif user_role == 'company_owner':
        area = Area.query.filter_by(id=id, company_id=company_id).first()
    
    if not area:
        return False

    old_values = {
        'name': area.name,
        'description': area.description,
        'is_active': area.is_active
    }

    db.session.delete(area)
    db.session.commit()

    log_action(
        current_user_id,
        'DELETE',
        'areas',
        area.id,
        old_values,
        None,
        ip_address,
        user_agent,
        company_id
    )

    return True

