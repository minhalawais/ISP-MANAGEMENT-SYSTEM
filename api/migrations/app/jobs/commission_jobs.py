"""
Monthly Commission Jobs

This module contains scheduled jobs for generating monthly salary accruals
for employees. Connection commissions are now generated per-invoice.
"""

from app import db
from app.models import User, Customer, EmployeeLedger
from app.crud import employee_ledger_crud
from sqlalchemy import func
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

def generate_monthly_salary_accruals(company_id):
    """
    Generates monthly salary accrual for all employees in a company.
    
    Note: Connection commissions are now generated automatically when 
    subscription invoices are created (see invoice_crud.py).
    
    Args:
        company_id: UUID of the company to process
        
    Returns:
        dict: Summary of salary processed
    """
    try:
        # Get all active employees
        active_employees = User.query.filter(
            User.company_id == company_id,
            User.is_active == True
        ).all()
        
        results = {
            'salary_processed': 0,
            'total_salary': 0,
            'details': []
        }
        
        current_month = datetime.now().strftime('%B %Y')
        
        for employee in active_employees:
            employee_result = {
                'employee_id': str(employee.id),
                'employee_name': f"{employee.first_name} {employee.last_name}",
                'salary': 0
            }
            
            # Add monthly salary accrual
            if employee.salary and float(employee.salary) > 0:
                salary_amount = float(employee.salary)
                try:
                    employee_ledger_crud.add_ledger_entry(
                        employee_id=employee.id,
                        transaction_type='salary_accrual',
                        amount=salary_amount,
                        description=f'Monthly salary for {current_month}',
                        company_id=company_id,
                        reference_id=None
                    )
                    results['salary_processed'] += 1
                    results['total_salary'] += salary_amount
                    employee_result['salary'] = salary_amount
                    logger.info(f"Added salary accrual of {salary_amount} for employee {employee.id}")
                except Exception as e:
                    logger.error(f"Error adding salary for employee {employee.id}: {e}")
                    employee_result['salary_error'] = str(e)
            
            # Only add to details if there was activity
            if employee_result['salary'] > 0:
                results['details'].append(employee_result)
        
        logger.info(f"Monthly salary job completed. Salaries: {results['salary_processed']}")
        return results
        
    except Exception as e:
        logger.error(f"Error in generate_monthly_salary_accruals: {e}")
        raise e


# Backward compatibility alias
def generate_monthly_connection_commissions(company_id):
    """
    Legacy function name for backward compatibility.
    Connection commissions are now generated per-invoice.
    """
    return generate_monthly_salary_accruals(company_id)


def generate_all_companies_commissions():
    """
    Runs monthly commission generation for all active companies.
    This should be scheduled to run on the 1st of each month.
    """
    from app.models import Company
    
    try:
        companies = Company.query.filter_by(is_active=True).all()
        all_results = []
        
        for company in companies:
            try:
                result = generate_monthly_connection_commissions(company.id)
                all_results.append({
                    'company_id': str(company.id),
                    'company_name': company.name,
                    'result': result
                })
            except Exception as e:
                logger.error(f"Error processing company {company.id}: {e}")
                all_results.append({
                    'company_id': str(company.id),
                    'error': str(e)
                })
        
        return all_results
        
    except Exception as e:
        logger.error(f"Error in generate_all_companies_commissions: {e}")
        raise e
