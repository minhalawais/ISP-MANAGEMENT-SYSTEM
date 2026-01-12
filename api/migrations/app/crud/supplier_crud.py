from app import db
from app.models import Supplier
from app.utils.logging_utils import log_action
import uuid
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
import logging

logger = logging.getLogger(__name__)

def get_all_suppliers(company_id, user_role):
    try:
        if user_role == 'super_admin':
            suppliers = Supplier.query.order_by(Supplier.created_at.desc()).all()
        elif user_role == 'auditor':
            suppliers = Supplier.query.filter_by(is_active=True, company_id=company_id).order_by(Supplier.created_at.desc()).all()
        else:  # company_owner
            suppliers = Supplier.query.filter_by(company_id=company_id).order_by(Supplier.created_at.desc()).all()

        return [
            {
                'id': str(supplier.id),
                'name': supplier.name,
                'contact_person': supplier.contact_person,
                'email': supplier.email,
                'phone': supplier.phone,
                'address': supplier.address,
                'is_active': supplier.is_active
            } for supplier in suppliers
        ]
    except Exception as e:
        logger.error(f"Error retrieving suppliers: {str(e)}")
        raise

def add_supplier(data, current_user_id, ip_address, user_agent):
    try:
        new_supplier = Supplier(
            company_id=uuid.UUID(data['company_id']),
            name=data['name'],
            contact_person=data.get('contact_person'),
            email=data['email'],
            phone=data.get('phone'),
            address=data.get('address'),
            is_active=True
        )
        db.session.add(new_supplier)
        db.session.commit()

        log_action(
            current_user_id,
            'CREATE',
            'suppliers',
            new_supplier.id,
            None,
            data,
                        ip_address,
            user_agent,
            company_id
)

        return new_supplier
    except SQLAlchemyError as e:
        logger.error(f"Database error: {str(e)}")
        db.session.rollback()
        raise
    except Exception as e:
        logger.error(f"Error adding supplier: {str(e)}")
        raise

def update_supplier(id, data, company_id, user_role, current_user_id, ip_address, user_agent):
    try:
        if user_role == 'super_admin':
            supplier = Supplier.query.get(id)
        elif user_role == 'auditor':
            supplier = Supplier.query.filter_by(id=id, is_active=True, company_id=company_id).first()
        else:  # company_owner
            supplier = Supplier.query.filter_by(id=id, company_id=company_id).first()

        if not supplier:
            return None

        old_values = {
            'name': supplier.name,
            'contact_person': supplier.contact_person,
            'email': supplier.email,
            'phone': supplier.phone,
            'address': supplier.address,
            'is_active': supplier.is_active
        }

        supplier.name = data.get('name', supplier.name)
        supplier.contact_person = data.get('contact_person', supplier.contact_person)
        supplier.email = data.get('email', supplier.email)
        supplier.phone = data.get('phone', supplier.phone)
        supplier.address = data.get('address', supplier.address)
        supplier.is_active = data.get('is_active', supplier.is_active)
        db.session.commit()

        log_action(
            current_user_id,
            'UPDATE',
            'suppliers',
            supplier.id,
            old_values,
            data,
                        ip_address,
            user_agent,
            company_id
)

        return supplier
    except SQLAlchemyError as e:
        logger.error(f"Database error: {str(e)}")
        db.session.rollback()
        raise
    except Exception as e:
        logger.error(f"Error updating supplier: {str(e)}")
        raise

def delete_supplier(id, company_id, user_role, current_user_id, ip_address, user_agent):
    try:
        if user_role == 'super_admin':
            supplier = Supplier.query.get(id)
        elif user_role == 'auditor':
            supplier = Supplier.query.filter_by(id=id, is_active=True, company_id=company_id).first()
        else:  # company_owner
            supplier = Supplier.query.filter_by(id=id, company_id=company_id).first()

        if not supplier:
            return False

        old_values = {
            'name': supplier.name,
            'contact_person': supplier.contact_person,
            'email': supplier.email,
            'phone': supplier.phone,
            'address': supplier.address,
            'is_active': supplier.is_active
        }

        db.session.delete(supplier)
        db.session.commit()

        log_action(
            current_user_id,
            'DELETE',
            'suppliers',
            supplier.id,
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
        logger.error(f"Error deleting supplier: {str(e)}")
        raise

