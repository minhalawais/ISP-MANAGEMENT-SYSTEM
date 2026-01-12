from app import db
from app.models import InternalTransfer, BankAccount
from app.crud.bank_account_crud import update_account_balance
from app.utils.logging_utils import log_action
import uuid
import logging
from decimal import Decimal
from datetime import datetime

logger = logging.getLogger(__name__)

def get_internal_transfers(company_id, filters=None):
    try:
        query = InternalTransfer.query.filter_by(company_id=company_id)
        
        if filters:
            if 'status' in filters:
                query = query.filter_by(status=filters['status'])
            if 'from_account_id' in filters:
                query = query.filter_by(from_account_id=filters['from_account_id'])
            if 'to_account_id' in filters:
                query = query.filter_by(to_account_id=filters['to_account_id'])
            if 'start_date' in filters:
                query = query.filter(InternalTransfer.transfer_date >= filters['start_date'])
            if 'end_date' in filters:
                query = query.filter(InternalTransfer.transfer_date <= filters['end_date'])
        
        return query.order_by(InternalTransfer.transfer_date.desc()).all()
    except Exception as e:
        logger.error(f"Error fetching internal transfers: {str(e)}")
        raise

def create_internal_transfer(data, current_user_id, ip_address, user_agent):
    """
    Creates an internal transfer atomically updating both bank accounts.
    """
    try:
        company_id = uuid.UUID(data['company_id'])
        from_account_id = uuid.UUID(data['from_account_id'])
        to_account_id = uuid.UUID(data['to_account_id'])
        amount = Decimal(str(data['amount']))
        
        if from_account_id == to_account_id:
            raise ValueError("Source and destination accounts must be different")
            
        if amount <= 0:
            raise ValueError("Transfer amount must be positive")

        # Check sufficiency of funds
        from_account = BankAccount.query.get(from_account_id)
        if not from_account:
            raise ValueError("Source account not found")
        
        if from_account.current_balance < amount:
            raise ValueError(f"Insufficient funds in source account. Current balance: {from_account.current_balance}")

        # Create Transfer Record
        transfer = InternalTransfer(
            company_id=company_id,
            from_account_id=from_account_id,
            to_account_id=to_account_id,
            amount=amount,
            transfer_date=data.get('transfer_date', datetime.utcnow()),
            description=data.get('description'),
            reference_number=data.get('reference_number'),
            status='completed'
        )
        
        db.session.add(transfer)
        
        # Atomic Balance Updates (No need to commit here, session commit at end handles all)
        # Note: update_account_balance commits individually which might break atomicity if not careful.
        # Ideally, we should refactor update_account_balance to accept a session or not commit.
        # However, given the current implementation of bank_account_crud, we might have a distributed transaction issue if one fails.
        # But since we are in the same request, we can try to rely on the behavior. 
        # Actually, bank_account_crud.update_account_balance performs a commit. This is risky for atomicity.
        # To be safe, I will implement the balance update logic manually here within the same transaction scope 
        # OR I will assume the risk is low for now. 
        # BETTER APPROACH: Manually update objects here and let one single commit handle it.
        
        from_account.current_balance -= amount
        from_account.updated_at = datetime.utcnow()
        
        to_account = BankAccount.query.get(to_account_id)
        if not to_account:
            raise ValueError("Destination account not found")
            
        to_account.current_balance += amount
        to_account.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        log_action(
            current_user_id,
            'CREATE',
            'internal_transfers',
            transfer.id,
            None,
            data,
            ip_address,
            user_agent,
            company_id
        )
        
        return transfer
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error creating internal transfer: {str(e)}")
        raise

def delete_internal_transfer(transfer_id, current_user_id, ip_address, user_agent):
    """
    Reverses a transfer and marks it as reversed/deleted.
    """
    try:
        transfer = InternalTransfer.query.get(transfer_id)
        if not transfer:
            raise ValueError("Transfer not found")
            
        if transfer.status == 'reversed':
            raise ValueError("Transfer already reversed")

        # Reverse balances
        from_account = BankAccount.query.get(transfer.from_account_id)
        to_account = BankAccount.query.get(transfer.to_account_id)
        
        if from_account:
            from_account.current_balance += transfer.amount
        
        if to_account:
            to_account.current_balance -= transfer.amount
            
        transfer.status = 'reversed'
        transfer.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        log_action(
            current_user_id,
            'DELETE',
            'internal_transfers',
            transfer.id,
            {'status': 'completed'},
            {'status': 'reversed'},
            ip_address,
            user_agent,
            transfer.company_id
        )
        
        return True
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error reversing internal transfer: {str(e)}")
        raise
