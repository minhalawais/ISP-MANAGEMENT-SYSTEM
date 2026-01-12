from app import db
from app.models import Expense, ExpenseType, User
from app.crud import employee_ledger_crud
import uuid
import logging
from decimal import Decimal
from datetime import datetime
from app.utils.date_utils import parse_pkt_datetime
from app.utils.logging_utils import log_action

logger = logging.getLogger(__name__)

class ExpenseError(Exception):
    pass

class ExpenseTypeError(Exception):
    pass

def get_all_expenses(company_id, user_role):
    try:
        if user_role == 'super_admin':
            expenses = Expense.query.join(ExpenseType).order_by(Expense.created_at.desc()).all()
        elif user_role == 'auditor':
            expenses = Expense.query.join(ExpenseType).filter(Expense.is_active==True, Expense.company_id==company_id).order_by(Expense.created_at.desc()).all()
        elif user_role == 'company_owner':
            expenses = Expense.query.join(ExpenseType).filter(Expense.company_id==company_id).order_by(Expense.created_at.desc()).all()
        elif user_role == 'employee':
            expenses = Expense.query.join(ExpenseType).filter(Expense.company_id==company_id, Expense.is_active==True).order_by(Expense.created_at.desc()).all()

        result = []
        for expense in expenses:
            # Get employee name if employee_id exists
            employee_name = None
            if expense.employee_id and expense.employee:
                employee_name = f"{expense.employee.first_name} {expense.employee.last_name}"
            
            result.append({
                'id': str(expense.id),
                'expense_type_id': str(expense.expense_type_id),
                'expense_type_name': expense.expense_type.name,
                'is_employee_payment': expense.expense_type.is_employee_payment if hasattr(expense.expense_type, 'is_employee_payment') else False,
                'employee_id': str(expense.employee_id) if expense.employee_id else None,
                'employee_name': employee_name,
                'description': expense.description,
                'amount': float(expense.amount),
                'expense_date': expense.expense_date.isoformat(),
                'payment_method': expense.payment_method,
                'vendor_payee': expense.vendor_payee,
                'bank_account_id': str(expense.bank_account_id) if expense.bank_account_id else None,
                'is_active': expense.is_active,
                'created_at': expense.created_at.isoformat() if expense.created_at else None,
                'payment_proof': expense.payment_proof,
            })
        return result
    except Exception as e:
        logger.error(f"Error getting expenses: {str(e)}")
        raise ExpenseError("Failed to retrieve expenses")

def add_expense(data, user_role, current_user_id, ip_address, user_agent):
    try:
        required_fields = ['expense_type_id', 'amount', 'expense_date']
        for field in required_fields:
            if field not in data:
                raise ValueError(f"Missing required field: {field}")

        # Combine date and time for expense_date
        expense_date_str = data['expense_date']
        expense_time_str = data.get('expense_time', '00:00')
        
        try:
            expense_datetime = parse_pkt_datetime(expense_date_str, expense_time_str)
        except ValueError:
            raise ValueError("Invalid expense date or time format")

        # Handle employee_id for employee payments
        employee_id = uuid.UUID(data['employee_id']) if data.get('employee_id') else None

        new_expense = Expense(
            company_id=uuid.UUID(data['company_id']),
            expense_type_id=uuid.UUID(data['expense_type_id']),
            employee_id=employee_id,
            description=data.get('description'),
            amount=Decimal(str(data['amount'])),
            expense_date=expense_datetime,  # Use combined datetime
            payment_method=data.get('payment_method'),
            vendor_payee=data.get('vendor_payee'),
            bank_account_id=uuid.UUID(data['bank_account_id']) if data.get('bank_account_id') else None,
            is_active=data.get('is_active', True),
            payment_proof=data.get('payment_proof') if isinstance(data.get('payment_proof'), str) else None
        )

        db.session.add(new_expense)
        db.session.flush()  # Get expense ID before updating employee

        # If this is an employee payment, update employee balances and add ledger entry
        if employee_id:
            amount = float(data['amount'])
            employee = User.query.get(employee_id)
            if employee:
                # Update employee paid_amount only (current_balance is updated by ledger entry)
                current_paid = float(employee.paid_amount or 0)
                employee.paid_amount = current_paid + amount
                
                # Add ledger entry for the payment (this updates current_balance automatically)
                employee_ledger_crud.add_ledger_entry(
                    employee_id=employee_id,
                    transaction_type='payout',
                    amount=-amount,  # Negative because it reduces balance
                    description=f"Payment via expense: {data.get('description', 'Employee Payment')}",
                    company_id=data['company_id'],
                    reference_id=new_expense.id
                )
                logger.info(f"Processed employee payment of {amount} for employee {employee_id}")

                logger.info(f"Processed employee payment of {amount} for employee {employee_id}")

        # Update bank account balance (Debit) for Expense
        if new_expense.payment_method == 'bank_transfer' and new_expense.bank_account_id:
            try:
                from app.crud.bank_account_crud import update_account_balance
                # Expense is a debit
                update_account_balance(new_expense.bank_account_id, -new_expense.amount, 'debit')
            except Exception as e:
                logger.error(f"Failed to update bank balance for expense {new_expense.id}: {e}")

        db.session.commit()
        
        # Audit log
        log_action(
            current_user_id,
            'CREATE',
            'expenses',
            new_expense.id,
            None,
            {'expense_type_id': str(new_expense.expense_type_id), 'amount': float(new_expense.amount), 'employee_id': str(employee_id) if employee_id else None},
            ip_address,
            user_agent,
            data['company_id']
        )
        
        return new_expense
    except Exception as e:
        logger.error(f"Error adding expense: {str(e)}")
        db.session.rollback()
        raise ExpenseError(f"Failed to create expense: {str(e)}")

def update_expense(id, data, company_id, user_role, current_user_id, ip_address, user_agent):
    try:
        if user_role == 'super_admin':
            expense = Expense.query.get(id)
        else:
            expense = Expense.query.filter_by(id=id, company_id=company_id).first()

        if not expense:
            raise ValueError(f"Expense with id {id} not found")

        # Update fields
        updatable_fields = ['expense_type_id', 'description', 'amount', 'payment_method', 'vendor_payee', 'bank_account_id', 'is_active']
        for field in updatable_fields:
            if field in data:
                if field == 'amount':
                    setattr(expense, field, Decimal(str(data[field])))
                elif field in ['expense_type_id', 'bank_account_id']:
                    setattr(expense, field, uuid.UUID(data[field]) if data[field] else None)
                else:
                    setattr(expense, field, data[field])

        # Handle expense_date separately to combine date and time
        if 'expense_date' in data and 'expense_time' in data:
            expense.expense_date = parse_pkt_datetime(data['expense_date'], data['expense_time'])
        elif 'expense_date' in data:
            existing_time = expense.expense_date.time()
            expense_date = datetime.strptime(data['expense_date'], "%Y-%m-%d").date()
            expense.expense_date = datetime.combine(expense_date, existing_time)

        # Handle payment_proof separately
        if 'payment_proof' in data:
            proof = data['payment_proof']
            expense.payment_proof = proof if isinstance(proof, str) else None

        db.session.commit()
        
        # Audit log
        log_action(
            current_user_id,
            'UPDATE',
            'expenses',
            expense.id,
            None,
            data,
            ip_address,
            user_agent,
            company_id
        )
        
        return expense
    except Exception as e:
        logger.error(f"Error updating expense {id}: {str(e)}")
        db.session.rollback()
        raise ExpenseError("Failed to update expense")

def delete_expense(id, company_id, user_role, current_user_id, ip_address, user_agent):
    try:
        if user_role == 'super_admin':
            expense = Expense.query.get(id)
        else:
            expense = Expense.query.filter_by(id=id, company_id=company_id).first()

        if not expense:
            raise ValueError(f"Expense with id {id} not found")

        expense.is_active = False

        # Revert bank balance if it was a bank transfer (Credit back)
        # Note: Soft delete doesn't actually delete record, but logically reverses effect
        if expense.payment_method == 'bank_transfer' and expense.bank_account_id:
             try:
                from app.crud.bank_account_crud import update_account_balance
                # Reverting debit -> Credit
                update_account_balance(expense.bank_account_id, expense.amount, 'credit')
             except Exception as e:
                logger.error(f"Failed to revert bank balance for deleted expense {expense.id}: {e}")

        db.session.commit()
        
        # Audit log
        log_action(
            current_user_id,
            'DELETE',
            'expenses',
            expense.id,
            {'is_active': True},
            {'is_active': False},
            ip_address,
            user_agent,
            company_id
        )
        
        return True
    except Exception as e:
        logger.error(f"Error deleting expense {id}: {str(e)}")
        db.session.rollback()
        raise ExpenseError("Failed to delete expense")

def get_all_expense_types(company_id, user_role):
    try:
        if user_role == 'super_admin':
            expense_types = ExpenseType.query.all()
        else:
            expense_types = ExpenseType.query.filter_by(company_id=company_id).all()

        result = []
        for expense_type in expense_types:
            result.append({
                'id': str(expense_type.id),
                'name': expense_type.name,
                'description': expense_type.description,
                'is_employee_payment': expense_type.is_employee_payment if hasattr(expense_type, 'is_employee_payment') else False,
                'is_active': expense_type.is_active,
                'created_at': expense_type.created_at.isoformat() if expense_type.created_at else None,
            })
        return result
    except Exception as e:
        logger.error(f"Error getting expense types: {str(e)}")
        raise ExpenseTypeError("Failed to retrieve expense types")

def add_expense_type(data, user_role, current_user_id, ip_address, user_agent):
    try:
        if 'name' not in data:
            raise ValueError("Missing required field: name")

        new_expense_type = ExpenseType(
            company_id=uuid.UUID(data['company_id']),
            name=data['name'],
            description=data.get('description'),
            is_employee_payment=data.get('is_employee_payment', False),
            is_active=data.get('is_active', True)
        )

        db.session.add(new_expense_type)
        db.session.commit()
        
        # Audit log
        log_action(
            current_user_id,
            'CREATE',
            'expense_types',
            new_expense_type.id,
            None,
            {'name': new_expense_type.name, 'is_employee_payment': new_expense_type.is_employee_payment},
            ip_address,
            user_agent,
            data['company_id']
        )
        
        return new_expense_type
    except Exception as e:
        logger.error(f"Error adding expense type: {str(e)}")
        db.session.rollback()
        raise ExpenseTypeError("Failed to create expense type")

def update_expense_type(id, data, company_id, user_role, current_user_id, ip_address, user_agent):
    try:
        if user_role == 'super_admin':
            expense_type = ExpenseType.query.get(id)
        else:
            expense_type = ExpenseType.query.filter_by(id=id, company_id=company_id).first()

        if not expense_type:
            raise ValueError(f"Expense type with id {id} not found")

        # Update fields
        if 'name' in data:
            expense_type.name = data['name']
        if 'description' in data:
            expense_type.description = data['description']
        if 'is_employee_payment' in data:
            expense_type.is_employee_payment = data['is_employee_payment']
        if 'is_active' in data:
            expense_type.is_active = data['is_active']

        db.session.commit()
        
        # Audit log
        log_action(
            current_user_id,
            'UPDATE',
            'expense_types',
            expense_type.id,
            None,
            data,
            ip_address,
            user_agent,
            company_id
        )
        
        return expense_type
    except Exception as e:
        logger.error(f"Error updating expense type {id}: {str(e)}")
        db.session.rollback()
        raise ExpenseTypeError("Failed to update expense type")

def delete_expense_type(id, company_id, user_role, current_user_id, ip_address, user_agent):
    try:
        if user_role == 'super_admin':
            expense_type = ExpenseType.query.get(id)
        else:
            expense_type = ExpenseType.query.filter_by(id=id, company_id=company_id).first()

        if not expense_type:
            raise ValueError(f"Expense type with id {id} not found")

        # Check if expense type is being used
        from app.models import Expense
        expense_count = Expense.query.filter_by(expense_type_id=id).count()
        if expense_count > 0:
            raise ValueError("Cannot delete expense type that is being used by expenses")

        db.session.delete(expense_type)
        db.session.commit()
        
        # Audit log
        log_action(
            current_user_id,
            'DELETE',
            'expense_types',
            id,
            {'name': expense_type.name},
            None,
            ip_address,
            user_agent,
            company_id
        )
        
        return True
    except Exception as e:
        logger.error(f"Error deleting expense type {id}: {str(e)}")
        db.session.rollback()
        raise ExpenseTypeError("Failed to delete expense type")