import os
import sys
from dotenv import load_dotenv
from sqlalchemy import func

# Add api directory to path
sys.path.append(os.path.dirname(__file__))

# Load environment variables
load_dotenv()

from app import create_app, db
from app.models import BankAccount, Payment, ISPPayment, Expense, ExtraIncome

app = create_app()

def recalculate_balances():
    """
    Recalculates the current_balance for all bank accounts based on:
    initial_balance + sum(credits) - sum(debits)
    """
    with app.app_context():
        print("Starting bank account balance recalculation...")
        
        bank_accounts = BankAccount.query.all()
        
        for account in bank_accounts:
            print(f"Processing Account: {account.bank_name} - {account.account_number}")
            
            # Start with initial balance
            balance = float(account.initial_balance or 0)
            print(f"  Initial Balance: {balance}")
            
            # Add Credits (Payments)
            # Note: For strict correctness we should check Payment.transaction_type or context, 
            # but usually payments are credits. 
            # Using raw SQL or standard query to ensure we capture all 'paid' payments.
            payments_total = db.session.query(func.sum(Payment.amount)).filter(
                Payment.bank_account_id == account.id,
                Payment.status == 'paid',
                Payment.is_active == True
            ).scalar() or 0
            
            balance += float(payments_total)
            print(f"  + Payments: {payments_total}")

            # Add Credits (Extra Income)
            extra_income_total = db.session.query(func.sum(ExtraIncome.amount)).filter(
                ExtraIncome.bank_account_id == account.id,
                ExtraIncome.is_active == True
            ).scalar() or 0
            
            balance += float(extra_income_total)
            print(f"  + Extra Income: {extra_income_total}")
            
            # Subtract Debits (ISP Payments)
            isp_payments_total = db.session.query(func.sum(ISPPayment.amount)).filter(
                ISPPayment.bank_account_id == account.id,
                ISPPayment.status == 'completed',
                ISPPayment.is_active == True
            ).scalar() or 0
            
            balance -= float(isp_payments_total)
            print(f"  - ISP Payments: {isp_payments_total}")
            
            # Subtract Debits (Expenses)
            expenses_total = db.session.query(func.sum(Expense.amount)).filter(
                Expense.bank_account_id == account.id,
                Expense.is_active == True
            ).scalar() or 0
            
            balance -= float(expenses_total)
            print(f"  - Expenses: {expenses_total}")
            
            # Update Account
            account.current_balance = round(balance, 2)
            print(f"  = New Current Balance: {account.current_balance}")
            
        try:
            db.session.commit()
            print("Successfully updated all bank account balances.")
        except Exception as e:
            db.session.rollback()
            print(f"Error saving changes: {e}")

if __name__ == "__main__":
    recalculate_balances()
