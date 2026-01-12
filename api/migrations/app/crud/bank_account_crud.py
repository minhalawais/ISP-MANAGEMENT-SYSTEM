from app import db
from app.models import BankAccount
from app.utils.logging_utils import log_action
import uuid
import logging
from decimal import Decimal
from datetime import datetime

logger = logging.getLogger(__name__)

class BankAccountError(Exception):
    """Custom exception for bank account operations"""
    pass

def get_all_bank_accounts(company_id, user_role, active_only=False):
    try:
        query = BankAccount.query
        
        # Apply role-based filters
        if user_role != 'super_admin':
            query = query.filter_by(company_id=company_id)
        
        # Apply active filter if requested or forced by role
        if active_only or user_role in ['auditor', 'company_owner', 'employee']:
            query = query.filter_by(is_active=True)
            
        bank_accounts = query.order_by(BankAccount.created_at.desc()).all()

        result = []
        for account in bank_accounts:
            result.append({
                'id': str(account.id),
                'bank_name': account.bank_name,
                'account_title': account.account_title,
                'account_number': account.account_number,
                'iban': account.iban,
                'branch_code': account.branch_code,
                'branch_address': account.branch_address,
                'initial_balance': float(account.initial_balance) if account.initial_balance else 0.00,
                'current_balance': float(account.current_balance) if account.current_balance else 0.00, # Added current_balance
                'is_active': account.is_active,
                'created_at': account.created_at.isoformat() if account.created_at else None,
                'updated_at': account.updated_at.isoformat() if account.updated_at else None,
            })
        return result
    except Exception as e:
        logger.error(f"Error getting bank accounts: {str(e)}")
        raise BankAccountError("Failed to retrieve bank accounts")


def add_bank_account(data, user_role, current_user_id, ip_address, user_agent):
    try:
        # Validate required fields
        required_fields = ['bank_name', 'account_title', 'account_number']
        for field in required_fields:
            if field not in data:
                raise ValueError(f"Missing required field: {field}")

        # Create new bank account
        new_bank_account = BankAccount(
            company_id=uuid.UUID(data['company_id']),
            bank_name=data['bank_name'],
            account_title=data['account_title'],
            account_number=data['account_number'],
            iban=data.get('iban'),
            branch_code=data.get('branch_code'),
            branch_address=data.get('branch_address'),
            initial_balance=Decimal(str(data.get('initial_balance', 0.00))),
            current_balance=Decimal(str(data.get('initial_balance', 0.00))), # Initialize current_balance
            is_active=data.get('is_active', True)
        )

        db.session.add(new_bank_account)
        db.session.commit()

        log_action(
            current_user_id,
            'CREATE',
            'bank_accounts',
            new_bank_account.id,
            None,
            data,
            ip_address,
            user_agent,
            uuid.UUID(data['company_id'])
        )

        return new_bank_account
    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        raise BankAccountError(str(e))
    except Exception as e:
        logger.error(f"Error adding bank account: {str(e)}")
        db.session.rollback()
        raise BankAccountError("Failed to create bank account")

def update_bank_account(id, data, company_id, user_role, current_user_id, ip_address, user_agent):
    try:
        if user_role == 'super_admin':
            bank_account = BankAccount.query.get(id)
        elif user_role == 'auditor':
            bank_account = BankAccount.query.filter_by(id=id, is_active=True, company_id=company_id).first()
        elif user_role == 'company_owner':
            bank_account = BankAccount.query.filter_by(id=id, company_id=company_id).first()

        if not bank_account:
            raise ValueError(f"Bank account with id {id} not found")

        old_values = {
            'bank_name': bank_account.bank_name,
            'account_title': bank_account.account_title,
            'account_number': bank_account.account_number,
            'iban': bank_account.iban,
            'branch_code': bank_account.branch_code,
            'branch_address': bank_account.branch_address,
            'initial_balance': float(bank_account.initial_balance),  # NEW
            'is_active': bank_account.is_active
        }

        # Update fields
        if 'bank_name' in data:
            bank_account.bank_name = data['bank_name']
        if 'account_title' in data:
            bank_account.account_title = data['account_title']
        if 'account_number' in data:
            bank_account.account_number = data['account_number']
        if 'iban' in data:
            bank_account.iban = data['iban']
        if 'branch_code' in data:
            bank_account.branch_code = data['branch_code']
        if 'branch_address' in data:
            bank_account.branch_address = data['branch_address']
        if 'initial_balance' in data:  # NEW
            bank_account.initial_balance = Decimal(str(data['initial_balance']))
        if 'is_active' in data:
            bank_account.is_active = data['is_active']

        db.session.commit()

        log_action(
            current_user_id,
            'UPDATE',
            'bank_accounts',
            bank_account.id,
            old_values,
            data,
            ip_address,
            user_agent,
            company_id
        )

        return bank_account
    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        raise BankAccountError(str(e))
    except Exception as e:
        logger.error(f"Error updating bank account {id}: {str(e)}")
        db.session.rollback()
        raise BankAccountError("Failed to update bank account")

def delete_bank_account(id, company_id, user_role, current_user_id, ip_address, user_agent):
    try:
        if user_role == 'super_admin':
            bank_account = BankAccount.query.get(id)
        elif user_role == 'auditor':
            bank_account = BankAccount.query.filter_by(id=id, is_active=True, company_id=company_id).first()
        elif user_role == 'company_owner':
            bank_account = BankAccount.query.filter_by(id=id, company_id=company_id).first()

        if not bank_account:
            raise ValueError(f"Bank account with id {id} not found")

        old_values = {
            'bank_name': bank_account.bank_name,
            'account_title': bank_account.account_title,
            'account_number': bank_account.account_number,
            'iban': bank_account.iban,
            'branch_code': bank_account.branch_code,
            'branch_address': bank_account.branch_address,
            'initial_balance': float(bank_account.initial_balance),  # NEW
            'is_active': bank_account.is_active
        }

        # Soft delete by setting is_active to False
        bank_account.is_active = False
        db.session.commit()

        log_action(
            current_user_id,
            'DELETE',
            'bank_accounts',
            bank_account.id,
            old_values,
            None,
            ip_address,
            user_agent,
            company_id
        )

        return True
    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        raise BankAccountError(str(e))
    except Exception as e:
        logger.error(f"Error deleting bank account {id}: {str(e)}")
        db.session.rollback()
        raise BankAccountError("Failed to delete bank account")


def get_account_balance(bank_account_id):
    """
    Get the current balance of a bank account.
    """
    try:
        account = BankAccount.query.get(bank_account_id)
        if not account:
            raise ValueError(f"Bank account {bank_account_id} not found")
        return account.current_balance
    except Exception as e:
        logger.error(f"Error fetching balance for account {bank_account_id}: {str(e)}")
        raise BankAccountError("Failed to fetch account balance")


def update_account_balance(bank_account_id, amount_change, transaction_type):
    """
    Update the current balance of a bank account.
    
    Args:
        bank_account_id: UUID of the bank account
        amount_change: Decimal amount to add (positive) or subtract (negative)
        transaction_type: 'credit' or 'debit' (for logging/debugging)
    """
    try:
        account = BankAccount.query.get(bank_account_id)
        if not account:
            raise ValueError(f"Bank account {bank_account_id} not found")
            
        # Ensure amount_change is Decimal
        change = Decimal(str(amount_change))
        
        # Update balance
        account.current_balance += change
        account.updated_at = datetime.utcnow() # Should be PKT aware ideally, but DB handles current_timestamp
        
        db.session.commit()
        return account.current_balance
    except Exception as e:
        logger.error(f"Error updating balance for account {bank_account_id}: {str(e)}")
        raise BankAccountError("Failed to update account balance")