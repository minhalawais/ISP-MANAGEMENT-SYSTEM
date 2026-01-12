from app import db
from app.models import ExtraIncome, ExtraIncomeType
import uuid
import logging
from decimal import Decimal
from datetime import datetime
from app.utils.date_utils import parse_pkt_datetime
from app.utils.logging_utils import log_action

logger = logging.getLogger(__name__)

class ExtraIncomeError(Exception):
    pass

class ExtraIncomeTypeError(Exception):
    pass

def get_all_extra_incomes(company_id, user_role):
    try:
        if user_role == 'super_admin':
            incomes = ExtraIncome.query.join(ExtraIncomeType).order_by(ExtraIncome.created_at.desc()).all()
        elif user_role == 'auditor':
            incomes = ExtraIncome.query.join(ExtraIncomeType).filter(
                ExtraIncome.is_active==True, 
                ExtraIncome.company_id==company_id
            ).order_by(ExtraIncome.created_at.desc()).all()
        elif user_role == 'company_owner':
            incomes = ExtraIncome.query.join(ExtraIncomeType).filter(
                ExtraIncome.company_id==company_id
            ).order_by(ExtraIncome.created_at.desc()).all()
        elif user_role == 'employee':
            incomes = ExtraIncome.query.join(ExtraIncomeType).filter(
                ExtraIncome.company_id==company_id, 
                ExtraIncome.is_active==True
            ).order_by(ExtraIncome.created_at.desc()).all()

        result = []
        for income in incomes:
            result.append({
                'id': str(income.id),
                'income_type_id': str(income.income_type_id),
                'income_type_name': income.income_type.name,
                'description': income.description,
                'amount': float(income.amount),
                'income_date': income.income_date.isoformat(),
                'payment_method': income.payment_method,
                'payer': income.payer,
                'bank_account_id': str(income.bank_account_id) if income.bank_account_id else None,
                'is_active': income.is_active,
                'created_at': income.created_at.isoformat() if income.created_at else None,
                'payment_proof': income.payment_proof,
            })
        return result
    except Exception as e:
        logger.error(f"Error getting extra incomes: {str(e)}")
        raise ExtraIncomeError("Failed to retrieve extra incomes")

def add_extra_income(data, user_role, current_user_id, ip_address, user_agent):
    try:
        required_fields = ['income_type_id', 'amount', 'income_date']
        for field in required_fields:
            if field not in data:
                raise ValueError(f"Missing required field: {field}")

        # Combine date and time for income_date
        income_date_str = data['income_date']
        income_time_str = data.get('income_time', '00:00')
        
        try:
            income_datetime = parse_pkt_datetime(income_date_str, income_time_str)
        except ValueError:
            raise ValueError("Invalid income date or time format")

        new_income = ExtraIncome(
            company_id=uuid.UUID(data['company_id']),
            income_type_id=uuid.UUID(data['income_type_id']),
            description=data.get('description'),
            amount=Decimal(str(data['amount'])),
            income_date=income_datetime,  # Use combined datetime
            payment_method=data.get('payment_method'),
            payer=data.get('payer'),
            bank_account_id=uuid.UUID(data['bank_account_id']) if data.get('bank_account_id') else None,
            is_active=data.get('is_active', True),
            payment_proof=data.get('payment_proof') if isinstance(data.get('payment_proof'), str) else None
        )

        db.session.add(new_income)
        
        # Update bank account balance (Credit) for Extra Income
        if new_income.payment_method == 'bank_transfer' and new_income.bank_account_id:
            try:
                from app.crud.bank_account_crud import update_account_balance
                # Extra Income is a credit
                update_account_balance(new_income.bank_account_id, new_income.amount, 'credit')
            except Exception as e:
                logger.error(f"Failed to update bank balance for extra income {new_income.id}: {e}")

        db.session.commit()
        
        # Audit log
        log_action(
            current_user_id,
            'CREATE',
            'extra_incomes',
            new_income.id,
            None,
            {'income_type_id': str(new_income.income_type_id), 'amount': float(new_income.amount)},
            ip_address,
            user_agent,
            data['company_id']
        )
        
        return new_income
    except Exception as e:
        logger.error(f"Error adding extra income: {str(e)}")
        db.session.rollback()
        raise ExtraIncomeError("Failed to create extra income")

def update_extra_income(id, data, company_id, user_role, current_user_id, ip_address, user_agent):
    try:
        if user_role == 'super_admin':
            income = ExtraIncome.query.get(id)
        else:
            income = ExtraIncome.query.filter_by(id=id, company_id=company_id).first()

        if not income:
            raise ValueError(f"Extra income with id {id} not found")

        # Update fields
        updatable_fields = ['income_type_id', 'description', 'amount', 'payment_method', 'payer', 'bank_account_id', 'is_active']
        for field in updatable_fields:
            if field in data:
                if field == 'amount':
                    setattr(income, field, Decimal(str(data[field])))
                elif field in ['income_type_id', 'bank_account_id']:
                    setattr(income, field, uuid.UUID(data[field]) if data[field] else None)
                else:
                    setattr(income, field, data[field])

        if 'income_date' in data and 'income_time' in data:
            income.income_date = parse_pkt_datetime(data['income_date'], data['income_time'])
        elif 'income_date' in data:
            existing_time = income.income_date.time()
            income_date = datetime.strptime(data['income_date'], "%Y-%m-%d").date()
            income.income_date = datetime.combine(income_date, existing_time)

        # Handle payment_proof separately
        if 'payment_proof' in data:
            proof = data['payment_proof']
            income.payment_proof = proof if isinstance(proof, str) else None

        db.session.commit()
        
        # Audit log
        log_action(
            current_user_id,
            'UPDATE',
            'extra_incomes',
            income.id,
            None,
            data,
            ip_address,
            user_agent,
            company_id
        )
        
        return income
    except Exception as e:
        logger.error(f"Error updating extra income {id}: {str(e)}")
        db.session.rollback()
        raise ExtraIncomeError("Failed to update extra income")

def delete_extra_income(id, company_id, user_role, current_user_id, ip_address, user_agent):
    try:
        if user_role == 'super_admin':
            income = ExtraIncome.query.get(id)
        else:
            income = ExtraIncome.query.filter_by(id=id, company_id=company_id).first()

        if not income:
            raise ValueError(f"Extra income with id {id} not found")

        # Actually delete the record
        db.session.delete(income)
        
        # Revert bank balance (Debit back)
        if income.payment_method == 'bank_transfer' and income.bank_account_id:
             try:
                from app.crud.bank_account_crud import update_account_balance
                # Reverting credit -> Debit
                update_account_balance(income.bank_account_id, -income.amount, 'debit')
             except Exception as e:
                logger.error(f"Failed to revert bank balance for deleted extra income {income.id}: {e}")

        db.session.commit()
        
        # Audit log
        log_action(
            current_user_id,
            'DELETE',
            'extra_incomes',
            id,
            {'amount': float(income.amount)},
            None,
            ip_address,
            user_agent,
            company_id
        )
        
        return True
    except Exception as e:
        logger.error(f"Error deleting extra income {id}: {str(e)}")
        db.session.rollback()
        raise ExtraIncomeError("Failed to delete extra income")

def get_all_extra_income_types(company_id, user_role):
    try:
        if user_role == 'super_admin':
            income_types = ExtraIncomeType.query.all()
        else:
            income_types = ExtraIncomeType.query.filter_by(company_id=company_id).all()

        result = []
        for income_type in income_types:
            result.append({
                'id': str(income_type.id),
                'name': income_type.name,
                'description': income_type.description,
                'is_active': income_type.is_active,
                'created_at': income_type.created_at.isoformat() if income_type.created_at else None,
            })
        return result
    except Exception as e:
        logger.error(f"Error getting extra income types: {str(e)}")
        raise ExtraIncomeTypeError("Failed to retrieve extra income types")

def add_extra_income_type(data, user_role, current_user_id, ip_address, user_agent):
    try:
        if 'name' not in data:
            raise ValueError("Missing required field: name")

        new_income_type = ExtraIncomeType(
            company_id=uuid.UUID(data['company_id']),
            name=data['name'],
            description=data.get('description'),
            is_active=data.get('is_active', True)
        )

        db.session.add(new_income_type)
        db.session.commit()
        
        # Audit log
        log_action(
            current_user_id,
            'CREATE',
            'extra_income_types',
            new_income_type.id,
            None,
            {'name': new_income_type.name},
            ip_address,
            user_agent,
            data['company_id']
        )
        
        return new_income_type
    except Exception as e:
        logger.error(f"Error adding extra income type: {str(e)}")
        db.session.rollback()
        raise ExtraIncomeTypeError("Failed to create extra income type")

def update_extra_income_type(id, data, company_id, user_role, current_user_id, ip_address, user_agent):
    try:
        if user_role == 'super_admin':
            income_type = ExtraIncomeType.query.get(id)
        else:
            income_type = ExtraIncomeType.query.filter_by(id=id, company_id=company_id).first()

        if not income_type:
            raise ValueError(f"Extra income type with id {id} not found")

        # Update fields
        if 'name' in data:
            income_type.name = data['name']
        if 'description' in data:
            income_type.description = data['description']
        if 'is_active' in data:
            income_type.is_active = data['is_active']

        db.session.commit()
        
        # Audit log
        log_action(
            current_user_id,
            'UPDATE',
            'extra_income_types',
            income_type.id,
            None,
            data,
            ip_address,
            user_agent,
            company_id
        )
        
        return income_type
    except Exception as e:
        logger.error(f"Error updating extra income type {id}: {str(e)}")
        db.session.rollback()
        raise ExtraIncomeTypeError("Failed to update extra income type")

def delete_extra_income_type(id, company_id, user_role, current_user_id, ip_address, user_agent):
    try:
        if user_role == 'super_admin':
            income_type = ExtraIncomeType.query.get(id)
        else:
            income_type = ExtraIncomeType.query.filter_by(id=id, company_id=company_id).first()

        if not income_type:
            raise ValueError(f"Extra income type with id {id} not found")

        # Check if income type is being used
        income_count = ExtraIncome.query.filter_by(income_type_id=id).count()
        if income_count > 0:
            raise ValueError("Cannot delete income type that is being used by extra incomes")

        db.session.delete(income_type)
        db.session.commit()
        
        # Audit log
        log_action(
            current_user_id,
            'DELETE',
            'extra_income_types',
            id,
            {'name': income_type.name},
            None,
            ip_address,
            user_agent,
            company_id
        )
        
        return True
    except Exception as e:
        logger.error(f"Error deleting extra income type {id}: {str(e)}")
        db.session.rollback()
        raise ExtraIncomeTypeError("Failed to delete extra income type")