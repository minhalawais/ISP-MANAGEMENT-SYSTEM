from app import db
from app.models import EmployeeLedger, User
from sqlalchemy.exc import SQLAlchemyError
import uuid
from app.utils.logging_utils import log_action
import logging

logger = logging.getLogger(__name__)

def add_ledger_entry(employee_id, transaction_type, amount, description, company_id, reference_id=None, current_user_id=None, ip_address=None, user_agent=None):
    """
    Creates a new ledger entry for an employee and updates their current balance.
    
    Args:
        employee_id (str): UUID of the employee
        transaction_type (str): Type of transaction (e.g., 'connection_commission', 'salary_accrual', 'payout')
        amount (float): Amount to credit (positive) or debit (negative)
        description (str): Description of the transaction
        company_id (str): UUID of the company
        reference_id (str, optional): UUID of related entity
        
    Returns:
        EmployeeLedger: The created ledger entry object
    """
    try:
        # Convert amount to float for calculation if it matches db numeric type
        amount_val = float(amount)
        
        # Create ledger entry
        new_entry = EmployeeLedger(
            employee_id=uuid.UUID(str(employee_id)),
            company_id=uuid.UUID(str(company_id)),
            transaction_type=transaction_type,
            amount=amount_val,
            description=description,
            reference_id=uuid.UUID(str(reference_id)) if reference_id else None
        )
        
        # Update user balance
        employee = User.query.get(employee_id)
        if employee:
            current = float(employee.current_balance or 0)
            employee.current_balance = current + amount_val
        
        db.session.add(new_entry)
        db.session.commit()
        
        # Audit log (if user context provided)
        if current_user_id:
            log_action(
                current_user_id,
                'CREATE',
                'employee_ledger',
                new_entry.id,
                None,
                {'employee_id': str(new_entry.employee_id), 'amount': float(new_entry.amount), 'type': new_entry.transaction_type},
                ip_address,
                user_agent,
                company_id
            )
            
        return new_entry
        
    except SQLAlchemyError as e:
        logger.error(f"Database error adding ledger entry: {e}")
        db.session.rollback()
        raise e
    except Exception as e:
        logger.error(f"Error adding ledger entry: {e}")
        db.session.rollback()
        raise e

def get_employee_ledger(employee_id, company_id, limit=50, offset=0):
    """
    Retrieves ledger entries for an employee.
    """
    try:
        entries = EmployeeLedger.query.filter_by(
            employee_id=employee_id, 
            company_id=company_id
        ).order_by(EmployeeLedger.created_at.desc()).limit(limit).offset(offset).all()
        
        return [
            {
                'id': str(entry.id),
                'transaction_type': entry.transaction_type,
                'amount': float(entry.amount),
                'description': entry.description,
                'created_at': entry.created_at.isoformat(),
                'reference_id': str(entry.reference_id) if entry.reference_id else None
            } for entry in entries
        ]
    except Exception as e:
        logger.error(f"Error fetching ledger for employee {employee_id}: {e}")
        return []

def get_employee_balance(employee_id):
    """
    Returns current balance of employee
    """
    try:
        employee = User.query.get(employee_id)
        return float(employee.current_balance or 0) if employee else 0
    except Exception as e:
        logger.error(f"Error getting balance for employee {employee_id}: {e}")
        return 0
