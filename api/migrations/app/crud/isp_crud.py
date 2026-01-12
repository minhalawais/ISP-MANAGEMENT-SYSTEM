from app import db
from app.models import ISP
from app.utils.logging_utils import log_action
import uuid
from sqlalchemy.exc import SQLAlchemyError
import logging

logger = logging.getLogger(__name__)

def get_all_isps(company_id):
    isps = ISP.query.filter_by(company_id=company_id).order_by(ISP.created_at.desc()).all()
    return [
        {
            'id': str(isp.id),
            'name': isp.name,
            'contact_person': isp.contact_person,
            'email': isp.email,
            'phone': isp.phone,
            'address': isp.address,
            'is_active': isp.is_active
        } for isp in isps
    ]

def add_isp(data, company_id, user_id, ip_address, user_agent):
    try:
        new_isp = ISP(
            company_id=company_id,
            name=data['name'],
            contact_person=data['contact_person'],
            email=data['email'],
            phone=data['phone'],
            address=data['address'],
            is_active=True
        )
        db.session.add(new_isp)
        db.session.commit()

        log_action(
            user_id,
            'CREATE',
            'isps',
            new_isp.id,
            None,
            data,
            ip_address,
            user_agent,
            company_id
        )

        return new_isp
    except SQLAlchemyError as e:
        db.session.rollback()
        logger.error(f"Error adding ISP: {str(e)}")
        raise

def update_isp(id, data, company_id, user_id, ip_address, user_agent):
    isp = ISP.query.filter_by(id=id, company_id=company_id).first()
    if not isp:
        return None

    old_values = {
        'name': isp.name,
        'contact_person': isp.contact_person,
        'email': isp.email,
        'phone': isp.phone,
        'address': isp.address,
        'is_active': isp.is_active
    }

    try:
        for key, value in data.items():
            setattr(isp, key, value)

        db.session.commit()

        log_action(
            user_id,
            'UPDATE',
            'isps',
            isp.id,
            old_values,
            data,
            ip_address,
            user_agent,
            company_id
        )

        return isp
    except SQLAlchemyError as e:
        db.session.rollback()
        logger.error(f"Error updating ISP: {str(e)}")
        raise

def delete_isp(id, company_id, user_id, ip_address, user_agent):
    isp = ISP.query.filter_by(id=id, company_id=company_id).first()
    if not isp:
        return False

    try:
        db.session.delete(isp)
        db.session.commit()

        log_action(
            user_id,
            'DELETE',
            'isps',
            isp.id,
            None,
            None,
            ip_address,
            user_agent,
            company_id
        )

        return True
    except SQLAlchemyError as e:
        db.session.rollback()
        logger.error(f"Error deleting ISP: {str(e)}")
        raise

def toggle_isp_status(id, company_id, user_id, ip_address, user_agent):
    isp = ISP.query.filter_by(id=id, company_id=company_id).first()
    if not isp:
        return None

    try:
        old_status = isp.is_active
        isp.is_active = not isp.is_active
        db.session.commit()

        log_action(
            user_id,
            'UPDATE',
            'isps',
            isp.id,
            {'is_active': old_status},
            {'is_active': isp.is_active},
            ip_address,
            user_agent,
            company_id
        )

        return isp
    except SQLAlchemyError as e:
        db.session.rollback()
        logger.error(f"Error toggling ISP status: {str(e)}")
        raise