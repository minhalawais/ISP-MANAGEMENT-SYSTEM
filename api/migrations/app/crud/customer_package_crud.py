"""
Customer Package CRUD operations for multi-package customer feature.
Handles adding, removing, and managing packages assigned to customers.
"""
from app import db
from app.models import CustomerPackage, Customer, ServicePlan
from app.utils.logging_utils import log_action
import uuid
from sqlalchemy.exc import SQLAlchemyError
import logging
from datetime import datetime

logger = logging.getLogger(__name__)


class CustomerPackageError(Exception):
    """Custom exception for customer package operations"""
    pass


def get_customer_packages(customer_id, company_id, include_inactive=False):
    """
    Get all packages assigned to a customer.
    
    Args:
        customer_id: UUID of the customer
        company_id: UUID of the company (for validation)
        include_inactive: Whether to include inactive packages
        
    Returns:
        List of package dictionaries
    """
    try:
        # Validate customer belongs to company
        customer = Customer.query.filter_by(
            id=customer_id, 
            company_id=company_id
        ).first()
        
        if not customer:
            raise CustomerPackageError("Customer not found")
        
        query = CustomerPackage.query.filter_by(customer_id=customer_id)
        
        if not include_inactive:
            query = query.filter_by(is_active=True)
        
        packages = query.all()
        
        return [package_to_dict(pkg) for pkg in packages]
        
    except CustomerPackageError:
        raise
    except Exception as e:
        logger.error(f"Error getting customer packages: {str(e)}")
        raise CustomerPackageError("Failed to get customer packages")


def package_to_dict(package):
    """Convert CustomerPackage model to dictionary"""
    return {
        'id': str(package.id),
        'customer_id': str(package.customer_id),
        'service_plan_id': str(package.service_plan_id),
        'service_plan_name': package.service_plan.name if package.service_plan else 'N/A',
        'service_plan_price': float(package.service_plan.price) if package.service_plan else 0,
        'service_plan_speed': package.service_plan.speed_mbps if package.service_plan else None,
        'start_date': package.start_date.isoformat() if package.start_date else None,
        'end_date': package.end_date.isoformat() if package.end_date else None,
        'is_active': package.is_active,
        'notes': package.notes,
        'created_at': package.created_at.isoformat() if package.created_at else None
    }


def add_package_to_customer(customer_id, service_plan_id, company_id, current_user_id, 
                            ip_address, user_agent, start_date=None, notes=None):
    """
    Add a package (service plan) to a customer.
    
    Args:
        customer_id: UUID of the customer
        service_plan_id: UUID of the service plan to add
        company_id: UUID of the company
        current_user_id: UUID of the user performing the action
        start_date: Optional start date (defaults to today)
        notes: Optional notes
        
    Returns:
        Created CustomerPackage dictionary
    """
    try:
        # Validate customer
        customer = Customer.query.filter_by(
            id=customer_id, 
            company_id=company_id,
            is_active=True
        ).first()
        
        if not customer:
            raise CustomerPackageError("Customer not found or inactive")
        
        # Validate service plan
        service_plan = ServicePlan.query.filter_by(
            id=service_plan_id,
            company_id=company_id,
            is_active=True
        ).first()
        
        if not service_plan:
            raise CustomerPackageError("Service plan not found or inactive")
        
        # Check if package already exists for this customer
        existing = CustomerPackage.query.filter_by(
            customer_id=customer_id,
            service_plan_id=service_plan_id,
            is_active=True
        ).first()
        
        if existing:
            raise CustomerPackageError("Customer already has this package")
        
        # Create package
        new_package = CustomerPackage(
            customer_id=uuid.UUID(str(customer_id)),
            service_plan_id=uuid.UUID(str(service_plan_id)),
            start_date=start_date or datetime.now().date(),
            notes=notes,
            is_active=True
        )
        
        db.session.add(new_package)
        db.session.commit()
        
        # Log action
        log_action(
            current_user_id,
            'CREATE',
            'customer_packages',
            new_package.id,
            None,
            {
                'customer_id': str(customer_id),
                'service_plan_id': str(service_plan_id),
                'service_plan_name': service_plan.name
            },
            ip_address,
            user_agent,
            str(company_id)
        )
        
        logger.info(f"Added package {service_plan.name} to customer {customer_id}")
        return package_to_dict(new_package)
        
    except CustomerPackageError:
        raise
    except Exception as e:
        logger.error(f"Error adding package to customer: {str(e)}")
        db.session.rollback()
        raise CustomerPackageError("Failed to add package to customer")


def remove_package_from_customer(package_id, company_id, current_user_id, ip_address, user_agent):
    """
    Remove (deactivate) a package from a customer.
    
    Args:
        package_id: UUID of the CustomerPackage to remove
        company_id: UUID of the company
        current_user_id: UUID of the user performing the action
        
    Returns:
        True if successful
    """
    try:
        # Get package and validate
        package = CustomerPackage.query.filter_by(id=package_id).first()
        
        if not package:
            raise CustomerPackageError("Package not found")
        
        # Validate customer belongs to company
        customer = Customer.query.filter_by(
            id=package.customer_id,
            company_id=company_id
        ).first()
        
        if not customer:
            raise CustomerPackageError("Unauthorized access to package")
        
        old_values = package_to_dict(package)
        
        # Soft delete - deactivate the package
        package.is_active = False
        package.end_date = datetime.now().date()
        
        db.session.commit()
        
        # Log action
        log_action(
            current_user_id,
            'DELETE',
            'customer_packages',
            package.id,
            old_values,
            {'is_active': False, 'end_date': package.end_date.isoformat()},
            ip_address,
            user_agent,
            str(company_id)
        )
        
        logger.info(f"Removed package {package_id} from customer")
        return True
        
    except CustomerPackageError:
        raise
    except Exception as e:
        logger.error(f"Error removing package from customer: {str(e)}")
        db.session.rollback()
        raise CustomerPackageError("Failed to remove package from customer")


def update_customer_package(package_id, data, company_id, current_user_id, ip_address, user_agent):
    """
    Update a customer package.
    
    Args:
        package_id: UUID of the CustomerPackage
        data: Dictionary with fields to update (notes, end_date, is_active)
        company_id: UUID of the company
        current_user_id: UUID of the user performing the action
        
    Returns:
        Updated package dictionary
    """
    try:
        package = CustomerPackage.query.filter_by(id=package_id).first()
        
        if not package:
            raise CustomerPackageError("Package not found")
        
        # Validate customer belongs to company
        customer = Customer.query.filter_by(
            id=package.customer_id,
            company_id=company_id
        ).first()
        
        if not customer:
            raise CustomerPackageError("Unauthorized access to package")
        
        old_values = package_to_dict(package)
        
        # Update allowed fields
        if 'notes' in data:
            package.notes = data['notes']
        if 'end_date' in data:
            if data['end_date']:
                package.end_date = datetime.fromisoformat(data['end_date'].rstrip('Z')).date()
            else:
                package.end_date = None
        if 'is_active' in data:
            package.is_active = data['is_active']
        
        db.session.commit()
        
        # Log action
        log_action(
            current_user_id,
            'UPDATE',
            'customer_packages',
            package.id,
            old_values,
            data,
            ip_address,
            user_agent,
            str(company_id)
        )
        
        return package_to_dict(package)
        
    except CustomerPackageError:
        raise
    except Exception as e:
        logger.error(f"Error updating customer package: {str(e)}")
        db.session.rollback()
        raise CustomerPackageError("Failed to update customer package")


def get_active_packages_for_customer(customer_id):
    """
    Get all active packages for a customer (used for invoice generation).
    
    Args:
        customer_id: UUID of the customer
        
    Returns:
        List of active CustomerPackage objects with service_plan loaded
    """
    try:
        from sqlalchemy.orm import joinedload
        
        packages = CustomerPackage.query.options(
            joinedload(CustomerPackage.service_plan)
        ).filter(
            CustomerPackage.customer_id == customer_id,
            CustomerPackage.is_active == True
        ).all()
        
        return packages
        
    except Exception as e:
        logger.error(f"Error getting active packages for customer: {str(e)}")
        return []


def bulk_add_packages_to_customer(customer_id, service_plan_ids, company_id, current_user_id, 
                                   ip_address, user_agent, start_date=None):
    """
    Add multiple packages to a customer at once.
    
    Args:
        customer_id: UUID of the customer
        service_plan_ids: List of service plan UUIDs
        company_id: UUID of the company
        current_user_id: UUID of user performing action
        start_date: Optional start date (defaults to today)
        
    Returns:
        Dictionary with results
    """
    try:
        added = []
        errors = []
        
        for plan_id in service_plan_ids:
            try:
                result = add_package_to_customer(
                    customer_id=customer_id,
                    service_plan_id=plan_id,
                    company_id=company_id,
                    current_user_id=current_user_id,
                    ip_address=ip_address,
                    user_agent=user_agent,
                    start_date=start_date
                )
                added.append(result)
            except CustomerPackageError as e:
                errors.append({
                    'service_plan_id': str(plan_id),
                    'error': str(e)
                })
        
        return {
            'added': added,
            'errors': errors,
            'total_added': len(added),
            'total_errors': len(errors)
        }
        
    except Exception as e:
        logger.error(f"Error in bulk add packages: {str(e)}")
        raise CustomerPackageError("Failed to bulk add packages")


def sync_customer_packages(customer_id, service_plan_ids, company_id, current_user_id,
                           ip_address, user_agent):
    """
    Sync customer packages - add missing ones and remove ones not in the list.
    Used when updating customer with new package selection.
    
    Args:
        customer_id: UUID of the customer
        service_plan_ids: List of service plan UUIDs that should be active
        company_id: UUID of the company
        current_user_id: UUID of user performing action
        
    Returns:
        Dictionary with sync results
    """
    try:
        # Get current active packages
        current_packages = CustomerPackage.query.filter_by(
            customer_id=customer_id,
            is_active=True
        ).all()
        
        current_plan_ids = {str(pkg.service_plan_id) for pkg in current_packages}
        target_plan_ids = {str(pid) for pid in service_plan_ids}
        
        # Packages to add
        to_add = target_plan_ids - current_plan_ids
        
        # Packages to remove
        to_remove = current_plan_ids - target_plan_ids
        
        added = []
        removed = []
        
        # Add new packages
        for plan_id in to_add:
            try:
                result = add_package_to_customer(
                    customer_id=customer_id,
                    service_plan_id=plan_id,
                    company_id=company_id,
                    current_user_id=current_user_id,
                    ip_address=ip_address,
                    user_agent=user_agent
                )
                added.append(result)
            except CustomerPackageError as e:
                logger.warning(f"Failed to add package {plan_id}: {e}")
        
        # Remove packages
        for pkg in current_packages:
            if str(pkg.service_plan_id) in to_remove:
                try:
                    remove_package_from_customer(
                        package_id=pkg.id,
                        company_id=company_id,
                        current_user_id=current_user_id,
                        ip_address=ip_address,
                        user_agent=user_agent
                    )
                    removed.append(str(pkg.id))
                except CustomerPackageError as e:
                    logger.warning(f"Failed to remove package {pkg.id}: {e}")
        
        return {
            'added': added,
            'removed': removed,
            'total_active': len(target_plan_ids)
        }
        
    except Exception as e:
        logger.error(f"Error syncing customer packages: {str(e)}")
        raise CustomerPackageError("Failed to sync customer packages")
