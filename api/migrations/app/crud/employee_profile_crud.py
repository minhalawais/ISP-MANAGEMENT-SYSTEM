from app import db
from app.models import (
    User, Customer, Payment, Complaint, Task, TaskAssignee, 
    RecoveryTask, EmployeeLedger, InventoryAssignment, InventoryTransaction,
    InventoryItem, Invoice
)
from sqlalchemy import func, and_, or_
from sqlalchemy.orm import joinedload
import uuid
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

def get_employee_profile(employee_id, company_id, user_role):
    """Get comprehensive employee profile with all analytics"""
    try:
        # Get employee base info
        employee = User.query.filter_by(id=employee_id).first()
        if not employee:
            return None
        
        # Check authorization
        if user_role not in ['super_admin', 'company_owner'] and str(employee.company_id) != str(company_id):
            return None
        
        # Calculate analytics
        financial_metrics = _get_financial_metrics(employee_id)
        performance_metrics = _get_performance_metrics(employee_id)
        customer_metrics = _get_customer_metrics(employee_id)
        
        return {
            'id': str(employee.id),
            'company_id': str(employee.company_id) if employee.company_id else None,
            'username': employee.username,
            'email': employee.email,
            'first_name': employee.first_name,
            'last_name': employee.last_name,
            'contact_number': employee.contact_number,
            'cnic': employee.cnic,
            'role': employee.role,
            'is_active': employee.is_active,
            'emergency_contact': employee.emergency_contact,
            'house_address': employee.house_address,
            'cnic_image': employee.cnic_image,
            'picture': employee.picture,
            'utility_bill_image': employee.utility_bill_image,
            'joining_date': employee.joining_date.isoformat() if employee.joining_date else None,
            'salary': float(employee.salary) if employee.salary else 0,
            'reference_name': employee.reference_name,
            'reference_contact': employee.reference_contact,
            'reference_cnic_image': employee.reference_cnic_image,
            'current_balance': float(employee.current_balance) if employee.current_balance else 0,
            'paid_amount': float(employee.paid_amount) if employee.paid_amount else 0,
            'pending_amount': float(employee.current_balance) if employee.current_balance else 0,  # Alias for clarity
            'commission_amount_per_complaint': float(employee.commission_amount_per_complaint) if employee.commission_amount_per_complaint else 0,
            'created_at': employee.created_at.isoformat() if employee.created_at else None,
            'updated_at': employee.updated_at.isoformat() if employee.updated_at else None,
            'financialMetrics': financial_metrics,
            'performanceMetrics': performance_metrics,
            'customerMetrics': customer_metrics,
            'serviceDuration': _calculate_service_duration(employee.joining_date)
        }
    except Exception as e:
        logger.error(f"Error getting employee profile: {str(e)}")
        raise

def _calculate_service_duration(joining_date):
    """Calculate days since joining"""
    if not joining_date:
        return 0
    return (datetime.now().date() - joining_date).days

def _get_financial_metrics(employee_id):
    """Calculate financial metrics for employee"""
    try:
        # Get ledger entries
        ledger_entries = EmployeeLedger.query.filter_by(employee_id=employee_id).all()
        
        total_commission = sum(
            float(entry.amount) for entry in ledger_entries 
            if entry.transaction_type in ['connection_commission', 'complaint_commission'] and float(entry.amount) > 0
        )
        
        total_payouts = abs(sum(
            float(entry.amount) for entry in ledger_entries 
            if entry.transaction_type == 'payout'
        ))
        
        total_salary = sum(
            float(entry.amount) for entry in ledger_entries 
            if entry.transaction_type == 'salary_accrual' and float(entry.amount) > 0
        )
        
        # Payments collected
        payments = Payment.query.filter_by(received_by=employee_id).all()
        total_payments_collected = sum(float(p.amount) for p in payments if p.amount)
        payments_count = len(payments)
        avg_payment = total_payments_collected / payments_count if payments_count > 0 else 0
        
        # Monthly earnings breakdown (last 6 months)
        monthly_earnings = _get_monthly_earnings(employee_id)
        
        return {
            'totalCommissionEarned': total_commission,
            'totalPayouts': total_payouts,
            'totalSalaryAccrued': total_salary,
            'totalPaymentsCollected': total_payments_collected,
            'paymentsCount': payments_count,
            'avgPaymentAmount': avg_payment,
            'monthlyEarnings': monthly_earnings
        }
    except Exception as e:
        logger.error(f"Error calculating financial metrics: {str(e)}")
        return {
            'totalCommissionEarned': 0,
            'totalPayouts': 0,
            'totalSalaryAccrued': 0,
            'totalPaymentsCollected': 0,
            'paymentsCount': 0,
            'avgPaymentAmount': 0,
            'monthlyEarnings': []
        }

def _get_monthly_earnings(employee_id):
    """Get monthly earnings for last 6 months"""
    try:
        six_months_ago = datetime.now() - timedelta(days=180)
        entries = EmployeeLedger.query.filter(
            EmployeeLedger.employee_id == employee_id,
            EmployeeLedger.created_at >= six_months_ago,
            EmployeeLedger.amount > 0
        ).all()
        
        monthly = {}
        for entry in entries:
            month_key = entry.created_at.strftime('%Y-%m')
            if month_key not in monthly:
                monthly[month_key] = 0
            monthly[month_key] += float(entry.amount)
        
        return [{'month': k, 'amount': v} for k, v in sorted(monthly.items())]
    except:
        return []

def _get_performance_metrics(employee_id):
    """Calculate performance metrics"""
    try:
        # Complaints
        complaints = Complaint.query.filter_by(assigned_to=employee_id).all()
        total_complaints = len(complaints)
        resolved_complaints = len([c for c in complaints if c.status == 'resolved'])
        
        # Average resolution time
        resolution_times = []
        for c in complaints:
            if c.status == 'resolved' and c.resolved_at and c.created_at:
                diff = (c.resolved_at - c.created_at).total_seconds() / 3600  # hours
                resolution_times.append(diff)
        avg_resolution_time = sum(resolution_times) / len(resolution_times) if resolution_times else 0
        
        # Tasks
        task_assignments = TaskAssignee.query.filter_by(employee_id=employee_id).all()
        task_ids = [ta.task_id for ta in task_assignments]
        tasks = Task.query.filter(Task.id.in_(task_ids)).all() if task_ids else []
        total_tasks = len(tasks)
        completed_tasks = len([t for t in tasks if t.status == 'completed'])
        
        # Recovery tasks
        recovery_tasks = RecoveryTask.query.filter_by(assigned_to=employee_id).all()
        total_recovery = len(recovery_tasks)
        completed_recovery = len([r for r in recovery_tasks if r.status == 'completed'])
        pending_recovery = len([r for r in recovery_tasks if r.status == 'pending'])
        in_progress_recovery = len([r for r in recovery_tasks if r.status == 'in_progress'])
        cancelled_recovery = len([r for r in recovery_tasks if r.status == 'cancelled'])
        recovery_success_rate = (completed_recovery / total_recovery * 100) if total_recovery > 0 else 0
        
        # Calculate recovery amounts
        total_recovery_amount = 0
        completed_recovery_amount = 0
        pending_recovery_amount = 0
        in_progress_recovery_amount = 0
        
        for r in recovery_tasks:
            if r.invoice and r.invoice.total_amount:
                amount = float(r.invoice.total_amount)
                total_recovery_amount += amount
                if r.status == 'completed':
                    completed_recovery_amount += amount
                elif r.status == 'pending':
                    pending_recovery_amount += amount
                elif r.status == 'in_progress':
                    in_progress_recovery_amount += amount
        
        return {
            'totalComplaints': total_complaints,
            'resolvedComplaints': resolved_complaints,
            'complaintResolutionRate': (resolved_complaints / total_complaints * 100) if total_complaints > 0 else 0,
            'avgResolutionTime': round(avg_resolution_time, 1),
            'totalTasks': total_tasks,
            'completedTasks': completed_tasks,
            'taskCompletionRate': (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0,
            'totalRecoveryTasks': total_recovery,
            'completedRecoveryTasks': completed_recovery,
            'pendingRecoveryTasks': pending_recovery,
            'inProgressRecoveryTasks': in_progress_recovery,
            'cancelledRecoveryTasks': cancelled_recovery,
            'recoverySuccessRate': round(recovery_success_rate, 1),
            'totalRecoveryAmount': total_recovery_amount,
            'completedRecoveryAmount': completed_recovery_amount,
            'pendingRecoveryAmount': pending_recovery_amount,
            'inProgressRecoveryAmount': in_progress_recovery_amount
        }
    except Exception as e:
        logger.error(f"Error calculating performance metrics: {str(e)}")
        return {
            'totalComplaints': 0,
            'resolvedComplaints': 0,
            'complaintResolutionRate': 0,
            'avgResolutionTime': 0,
            'totalTasks': 0,
            'completedTasks': 0,
            'taskCompletionRate': 0,
            'totalRecoveryTasks': 0,
            'completedRecoveryTasks': 0,
            'pendingRecoveryTasks': 0,
            'inProgressRecoveryTasks': 0,
            'cancelledRecoveryTasks': 0,
            'recoverySuccessRate': 0,
            'totalRecoveryAmount': 0,
            'completedRecoveryAmount': 0,
            'pendingRecoveryAmount': 0,
            'inProgressRecoveryAmount': 0
        }

def _get_customer_metrics(employee_id):
    """Calculate customer-related metrics"""
    try:
        customers = Customer.query.filter_by(technician_id=employee_id).all()
        total_customers = len(customers)
        active_customers = len([c for c in customers if c.is_active])
        
        return {
            'totalManagedCustomers': total_customers,
            'activeCustomers': active_customers,
            'inactiveCustomers': total_customers - active_customers,
            'customerRetentionRate': (active_customers / total_customers * 100) if total_customers > 0 else 0
        }
    except Exception as e:
        logger.error(f"Error calculating customer metrics: {str(e)}")
        return {
            'totalManagedCustomers': 0,
            'activeCustomers': 0,
            'inactiveCustomers': 0,
            'customerRetentionRate': 0
        }

def get_employee_customers(employee_id, company_id):
    """Get customers managed by employee"""
    try:
        customers = Customer.query.filter_by(technician_id=employee_id).all()
        return [{
            'id': str(c.id),
            'internet_id': c.internet_id,
            'first_name': c.first_name,
            'last_name': c.last_name,
            'email': c.email,
            'phone_1': c.phone_1,
            'area': c.area.name if c.area else None,
            'is_active': c.is_active,
            'installation_date': c.installation_date.isoformat() if c.installation_date else None
        } for c in customers]
    except Exception as e:
        logger.error(f"Error getting employee customers: {str(e)}")
        return []

def get_employee_payments(employee_id, company_id):
    """Get payments received by employee"""
    try:
        payments = Payment.query.filter_by(received_by=employee_id).order_by(Payment.payment_date.desc()).limit(100).all()
        return [{
            'id': str(p.id),
            'invoice_id': str(p.invoice_id) if p.invoice_id else None,
            'invoice_number': p.invoice.invoice_number if p.invoice else None,
            'customer_name': f"{p.invoice.customer.first_name} {p.invoice.customer.last_name}" if p.invoice and p.invoice.customer else None,
            'amount': float(p.amount) if p.amount else 0,
            'payment_date': p.payment_date.isoformat() if p.payment_date else None,
            'payment_method': p.payment_method,
            'status': p.status
        } for p in payments]
    except Exception as e:
        logger.error(f"Error getting employee payments: {str(e)}")
        return []

def get_employee_complaints(employee_id, company_id):
    """Get complaints assigned to employee"""
    try:
        complaints = Complaint.query.filter_by(assigned_to=employee_id).order_by(Complaint.created_at.desc()).all()
        return [{
            'id': str(c.id),
            'ticket_number': c.ticket_number,
            'customer_name': f"{c.customer.first_name} {c.customer.last_name}" if c.customer else None,
            'description': c.description,
            'status': c.status,
            'created_at': c.created_at.isoformat() if c.created_at else None,
            'resolved_at': c.resolved_at.isoformat() if c.resolved_at else None,
            'satisfaction_rating': c.satisfaction_rating
        } for c in complaints]
    except Exception as e:
        logger.error(f"Error getting employee complaints: {str(e)}")
        return []

def get_employee_tasks(employee_id, company_id):
    """Get tasks assigned to employee"""
    try:
        task_assignments = TaskAssignee.query.filter_by(employee_id=employee_id).all()
        task_ids = [ta.task_id for ta in task_assignments]
        
        if not task_ids:
            return []
        
        tasks = Task.query.filter(Task.id.in_(task_ids)).order_by(Task.created_at.desc()).all()
        return [{
            'id': str(t.id),
            'task_type': t.task_type,
            'customer_name': f"{t.customer.first_name} {t.customer.last_name}" if t.customer else None,
            'priority': t.priority,
            'status': t.status,
            'due_date': t.due_date.isoformat() if t.due_date else None,
            'notes': t.notes,
            'created_at': t.created_at.isoformat() if t.created_at else None
        } for t in tasks]
    except Exception as e:
        logger.error(f"Error getting employee tasks: {str(e)}")
        return []

def get_employee_recovery_tasks(employee_id, company_id):
    """Get recovery tasks assigned to employee with detailed info"""
    try:
        tasks = RecoveryTask.query.filter_by(assigned_to=employee_id).order_by(RecoveryTask.created_at.desc()).all()
        return [{
            'id': str(t.id),
            'invoice_id': str(t.invoice_id) if t.invoice_id else None,
            'invoice_number': t.invoice.invoice_number if t.invoice else None,
            'customer_name': f"{t.invoice.customer.first_name} {t.invoice.customer.last_name}" if t.invoice and t.invoice.customer else None,
            'customer_id': str(t.invoice.customer.id) if t.invoice and t.invoice.customer else None,
            'amount': float(t.invoice.total_amount) if t.invoice and t.invoice.total_amount else 0,
            'status': t.status,
            'notes': t.notes,
            'created_at': t.created_at.isoformat() if t.created_at else None,
            'updated_at': t.updated_at.isoformat() if t.updated_at else None
        } for t in tasks]
    except Exception as e:
        logger.error(f"Error getting employee recovery tasks: {str(e)}")
        return []

def get_employee_ledger(employee_id, company_id):
    """Get ledger entries for employee"""
    try:
        entries = EmployeeLedger.query.filter_by(employee_id=employee_id).order_by(EmployeeLedger.created_at.desc()).all()
        return [{
            'id': str(e.id),
            'transaction_type': e.transaction_type,
            'amount': float(e.amount) if e.amount else 0,
            'description': e.description,
            'created_at': e.created_at.isoformat() if e.created_at else None
        } for e in entries]
    except Exception as e:
        logger.error(f"Error getting employee ledger: {str(e)}")
        return []

def get_employee_inventory(employee_id, company_id):
    """Get inventory assigned to employee"""
    try:
        assignments = InventoryAssignment.query.filter_by(
            assigned_to_employee_id=employee_id,
            status='assigned'
        ).all()
        
        return [{
            'id': str(a.id),
            'item_type': a.inventory_item.item_type if a.inventory_item else None,
            'serial_number': a.inventory_item.serial_number if a.inventory_item else None,
            'assigned_at': a.assigned_at.isoformat() if a.assigned_at else None,
            'status': a.status
        } for a in assignments]
    except Exception as e:
        logger.error(f"Error getting employee inventory: {str(e)}")
        return []
