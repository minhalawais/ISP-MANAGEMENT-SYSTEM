from app import db
from app.models import Vendor
from app.utils.logging_utils import log_action
import uuid
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
import logging
import os
from werkzeug.utils import secure_filename

logger = logging.getLogger(__name__)

UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'uploads', 'vendors')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'pdf'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def save_file(file, vendor_id, file_type):
    """Save uploaded file and return the path"""
    if file and allowed_file(file.filename):
        # Create directory if it doesn't exist
        vendor_folder = os.path.join(UPLOAD_FOLDER, str(vendor_id))
        os.makedirs(vendor_folder, exist_ok=True)
        
        # Generate unique filename
        ext = file.filename.rsplit('.', 1)[1].lower()
        filename = f"{file_type}_{uuid.uuid4().hex[:8]}.{ext}"
        filepath = os.path.join(vendor_folder, filename)
        file.save(filepath)
        return filepath
    return None

def get_all_vendors(company_id, user_role):
    """Get all vendors for a company"""
    try:
        if user_role == 'super_admin':
            vendors = Vendor.query.order_by(Vendor.created_at.desc()).all()
        elif user_role == 'auditor':
            vendors = Vendor.query.filter_by(is_active=True, company_id=company_id).order_by(Vendor.created_at.desc()).all()
        else:
            vendors = Vendor.query.filter_by(company_id=company_id).order_by(Vendor.created_at.desc()).all()
        
        return [{
            'id': str(v.id),
            'name': v.name,
            'phone': v.phone,
            'email': v.email,
            'cnic': v.cnic,
            'picture': v.picture,
            'cnic_front_image': v.cnic_front_image,
            'cnic_back_image': v.cnic_back_image,
            'agreement_document': v.agreement_document,
            'is_active': v.is_active,
            'created_at': v.created_at.isoformat() if v.created_at else None,
            'updated_at': v.updated_at.isoformat() if v.updated_at else None,
        } for v in vendors]
    except Exception as e:
        logger.error(f"Error getting vendors: {str(e)}")
        return []

def get_vendor_by_id(vendor_id, company_id, user_role):
    """Get a single vendor by ID"""
    try:
        if user_role == 'super_admin':
            vendor = Vendor.query.filter_by(id=vendor_id).first()
        else:
            vendor = Vendor.query.filter_by(id=vendor_id, company_id=company_id).first()
        
        if not vendor:
            return None
            
        return {
            'id': str(vendor.id),
            'name': vendor.name,
            'phone': vendor.phone,
            'email': vendor.email,
            'cnic': vendor.cnic,
            'picture': vendor.picture,
            'cnic_front_image': vendor.cnic_front_image,
            'cnic_back_image': vendor.cnic_back_image,
            'agreement_document': vendor.agreement_document,
            'is_active': vendor.is_active,
            'created_at': vendor.created_at.isoformat() if vendor.created_at else None,
            'updated_at': vendor.updated_at.isoformat() if vendor.updated_at else None,
        }
    except Exception as e:
        logger.error(f"Error getting vendor: {str(e)}")
        return None

def add_vendor(data, files, company_id, user_role, current_user_id, ip_address, user_agent):
    """Add a new vendor"""
    try:
        print('Data: ',data)
        # Check if CNIC already exists
        existing = Vendor.query.filter_by(cnic=data.get('cnic')).first()
        if existing:
            raise ValueError("A vendor with this CNIC already exists")
        
        new_vendor = Vendor(
            company_id=uuid.UUID(company_id),
            name=data.get('name'),
            phone=data.get('phone'),
            email=data.get('email'),
            cnic=data.get('cnic'),
        )
        db.session.add(new_vendor)
        db.session.flush()  # Get the ID before committing
        
        # Handle file uploads
        if files:
            if 'picture' in files:
                new_vendor.picture = save_file(files['picture'], new_vendor.id, 'picture')
            if 'cnic_front_image' in files:
                new_vendor.cnic_front_image = save_file(files['cnic_front_image'], new_vendor.id, 'cnic_front')
            if 'cnic_back_image' in files:
                new_vendor.cnic_back_image = save_file(files['cnic_back_image'], new_vendor.id, 'cnic_back')
            if 'agreement_document' in files:
                new_vendor.agreement_document = save_file(files['agreement_document'], new_vendor.id, 'agreement')
        
        db.session.commit()

        log_action(
            current_user_id,
            'CREATE',
            'vendors',
            new_vendor.id,
            None,
            {'name': data.get('name'), 'cnic': data.get('cnic')},
            ip_address,
            user_agent,
            company_id
        )

        return new_vendor
    except IntegrityError as e:
        db.session.rollback()
        logger.error(f"Integrity error adding vendor: {str(e)}")
        raise ValueError("A vendor with this CNIC already exists")
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error adding vendor: {str(e)}")
        raise

def update_vendor(vendor_id, data, files, company_id, user_role, current_user_id, ip_address, user_agent):
    """Update an existing vendor"""
    try:
        if user_role == 'super_admin':
            vendor = Vendor.query.filter_by(id=vendor_id).first()
        else:
            vendor = Vendor.query.filter_by(id=vendor_id, company_id=company_id).first()
        
        if not vendor:
            return None

        old_values = {
            'name': vendor.name,
            'phone': vendor.phone,
            'email': vendor.email,
            'cnic': vendor.cnic,
            'is_active': vendor.is_active
        }

        # Update basic fields
        if 'name' in data:
            vendor.name = data['name']
        if 'phone' in data:
            vendor.phone = data['phone']
        if 'email' in data:
            vendor.email = data['email']
        if 'cnic' in data:
            vendor.cnic = data['cnic']
        if 'is_active' in data:
            vendor.is_active = data['is_active'] in ['true', 'True', True, '1', 1]
        
        # Handle file uploads
        if files:
            if 'picture' in files:
                vendor.picture = save_file(files['picture'], vendor.id, 'picture')
            if 'cnic_front_image' in files:
                vendor.cnic_front_image = save_file(files['cnic_front_image'], vendor.id, 'cnic_front')
            if 'cnic_back_image' in files:
                vendor.cnic_back_image = save_file(files['cnic_back_image'], vendor.id, 'cnic_back')
            if 'agreement_document' in files:
                vendor.agreement_document = save_file(files['agreement_document'], vendor.id, 'agreement')
        
        db.session.commit()

        log_action(
            current_user_id,
            'UPDATE',
            'vendors',
            vendor.id,
            old_values,
            data,
            ip_address,
            user_agent,
            company_id
        )

        return vendor
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error updating vendor: {str(e)}")
        raise

def delete_vendor(vendor_id, company_id, user_role, current_user_id, ip_address, user_agent):
    """Delete a vendor"""
    try:
        if user_role == 'super_admin':
            vendor = Vendor.query.filter_by(id=vendor_id).first()
        else:
            vendor = Vendor.query.filter_by(id=vendor_id, company_id=company_id).first()
        
        if not vendor:
            return False

        old_values = {
            'name': vendor.name,
            'phone': vendor.phone,
            'email': vendor.email,
            'cnic': vendor.cnic,
            'is_active': vendor.is_active
        }

        db.session.delete(vendor)
        db.session.commit()

        log_action(
            current_user_id,
            'DELETE',
            'vendors',
            vendor_id,
            old_values,
            None,
            ip_address,
            user_agent,
            company_id
        )

        return True
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error deleting vendor: {str(e)}")
        return False
