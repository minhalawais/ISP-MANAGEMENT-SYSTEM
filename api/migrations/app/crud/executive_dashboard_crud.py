"""
Executive Dashboard CRUD - Enterprise Level Analytics

This module provides comprehensive data aggregation for the Executive Dashboard
with real-time KPIs, charts, tables, and period-over-period comparisons.
"""

from app import db
from app.models import (
    Customer, Invoice, Payment, Complaint, Task, ServicePlan, CustomerPackage,
    Area, SubZone, ISP, ISPPayment, Expense, ExtraIncome, BankAccount, User, ExpenseType
)
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta
from sqlalchemy import func, case, and_, or_, desc, extract
from sqlalchemy.exc import SQLAlchemyError
from pytz import UTC, timezone
import logging

logger = logging.getLogger(__name__)

# Pakistan timezone
PKT = timezone('Asia/Karachi')


def get_date_range(start_date_str, end_date_str):
    """Parse date strings to datetime objects with timezone."""
    try:
        if start_date_str:
            start_date = datetime.strptime(start_date_str, '%Y-%m-%d').replace(tzinfo=PKT)
        else:
            # Default to start of current month
            today = datetime.now(PKT)
            start_date = today.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        if end_date_str:
            end_date = datetime.strptime(end_date_str, '%Y-%m-%d').replace(hour=23, minute=59, second=59, tzinfo=PKT)
        else:
            end_date = datetime.now(PKT)
        
        return start_date, end_date
    except Exception as e:
        logger.error(f"Date parsing error: {e}")
        today = datetime.now(PKT)
        return today.replace(day=1), today


def get_previous_period(start_date, end_date, compare_type='last_month'):
    """Calculate previous period dates for comparison."""
    period_days = (end_date - start_date).days + 1
    
    if compare_type == 'last_month':
        prev_end = start_date - timedelta(days=1)
        prev_start = prev_end - timedelta(days=period_days - 1)
    elif compare_type == 'last_quarter':
        prev_end = start_date - timedelta(days=1)
        prev_start = prev_end - relativedelta(months=3)
    elif compare_type == 'last_year':
        prev_start = start_date - relativedelta(years=1)
        prev_end = end_date - relativedelta(years=1)
    else:
        prev_end = start_date - timedelta(days=1)
        prev_start = prev_end - timedelta(days=period_days - 1)
    
    return prev_start, prev_end


def calculate_trend(current, previous):
    """Calculate percentage change between periods."""
    if previous == 0:
        return 100.0 if current > 0 else 0.0
    return round(((current - previous) / previous) * 100, 1)


def get_executive_dashboard_advanced(company_id, filters=None):
    """
    Main function to fetch all executive dashboard data.
    
    Args:
        company_id: UUID of the company
        filters: Dict with keys:
            - start_date, end_date: Date range
            - area_id, isp_id, service_plan_id: Dimension filters
            - payment_method: Payment method filter
            - compare: Comparison period (last_month, last_quarter, last_year)
    
    Returns:
        Dict with kpis, charts, tables, and filter options
    """
    if not company_id:
        return {'error': 'Company ID is required'}
    
    filters = filters or {}
    
    try:
        # Parse date range
        start_date, end_date = get_date_range(
            filters.get('start_date'),
            filters.get('end_date')
        )
        
        # Get comparison period
        compare_type = filters.get('compare', 'last_month')
        prev_start, prev_end = get_previous_period(start_date, end_date, compare_type)
        
        # Extract filter values
        area_id = filters.get('area_id') if filters.get('area_id') != 'all' else None
        isp_id = filters.get('isp_id') if filters.get('isp_id') != 'all' else None
        service_plan_id = filters.get('service_plan_id') if filters.get('service_plan_id') != 'all' else None
        payment_method = filters.get('payment_method') if filters.get('payment_method') != 'all' else None
        
        # Build response
        response = {
            'kpis': get_all_kpis(company_id, start_date, end_date, prev_start, prev_end, area_id, isp_id, service_plan_id),
            'charts': {
                'revenue_trend': get_revenue_collection_trend(company_id, area_id, isp_id),
                'customer_growth': get_customer_growth_chart(company_id, area_id, isp_id),
                'payment_methods': get_payment_methods_breakdown(company_id, start_date, end_date, area_id, isp_id),
                'top_areas': get_top_areas_revenue(company_id, start_date, end_date),
                'isp_analysis': get_isp_revenue_cost(company_id, start_date, end_date),
                'expense_breakdown': get_expense_breakdown(company_id, start_date, end_date)
            },
            'tables': {
                'top_plans': get_top_service_plans(company_id, start_date, end_date, prev_start, prev_end),
                'overdue_invoices': get_overdue_invoices(company_id, area_id, isp_id)
            },
            'filters': get_filter_options(company_id),
            'period': {
                'start_date': start_date.strftime('%Y-%m-%d'),
                'end_date': end_date.strftime('%Y-%m-%d'),
                'compare': compare_type
            }
        }
        
        return response
        
    except SQLAlchemyError as e:
        logger.error(f"Database error in executive dashboard: {e}")
        return {'error': 'Database error occurred'}
    except Exception as e:
        logger.error(f"Error in executive dashboard: {e}")
        return {'error': str(e)}


def get_all_kpis(company_id, start_date, end_date, prev_start, prev_end, area_id=None, isp_id=None, service_plan_id=None):
    """Calculate all 16 KPIs with trends."""
    
    # Base customer query with filters
    customer_base = Customer.query.filter(Customer.company_id == company_id)
    if area_id:
        customer_base = customer_base.filter(Customer.area_id == area_id)
    if isp_id:
        customer_base = customer_base.filter(Customer.isp_id == isp_id)
    
    # === TIER 1: FINANCIAL KPIs ===
    
    # 1. Total Collections (current period)
    collections_query = db.session.query(func.coalesce(func.sum(Payment.amount), 0)).join(
        Invoice, Payment.invoice_id == Invoice.id
    ).join(
        Customer, Invoice.customer_id == Customer.id
    ).filter(
        Invoice.company_id == company_id,
        Payment.status == 'paid',
        Payment.payment_date >= start_date,
        Payment.payment_date <= end_date,
        Payment.is_active == True
    )
    if area_id:
        collections_query = collections_query.filter(Customer.area_id == area_id)
    if isp_id:
        collections_query = collections_query.filter(Customer.isp_id == isp_id)
    
    total_collections = float(collections_query.scalar() or 0)
    
    # Previous period collections
    prev_collections = float(db.session.query(func.coalesce(func.sum(Payment.amount), 0)).join(
        Invoice, Payment.invoice_id == Invoice.id
    ).filter(
        Invoice.company_id == company_id,
        Payment.status == 'paid',
        Payment.payment_date >= prev_start,
        Payment.payment_date <= prev_end,
        Payment.is_active == True
    ).scalar() or 0)
    
    # 2. Outstanding Amount
    outstanding_query = db.session.query(
        func.coalesce(func.sum(Invoice.total_amount), 0) - 
        func.coalesce(func.sum(
            db.session.query(func.sum(Payment.amount)).filter(
                Payment.invoice_id == Invoice.id,
                Payment.status == 'paid',
                Payment.is_active == True
            ).correlate(Invoice).scalar_subquery()
        ), 0)
    ).select_from(Invoice).join(
        Customer, Invoice.customer_id == Customer.id
    ).filter(
        Invoice.company_id == company_id,
        Invoice.status.in_(['pending', 'partially_paid', 'overdue']),
        Invoice.is_active == True
    )
    if area_id:
        outstanding_query = outstanding_query.filter(Customer.area_id == area_id)
    if isp_id:
        outstanding_query = outstanding_query.filter(Customer.isp_id == isp_id)
    
    # Simpler outstanding calculation
    pending_invoices = db.session.query(func.coalesce(func.sum(Invoice.total_amount), 0)).join(
        Customer, Invoice.customer_id == Customer.id
    ).filter(
        Invoice.company_id == company_id,
        Invoice.status.in_(['pending', 'partially_paid', 'overdue']),
        Invoice.is_active == True
    )
    if area_id:
        pending_invoices = pending_invoices.filter(Customer.area_id == area_id)
    if isp_id:
        pending_invoices = pending_invoices.filter(Customer.isp_id == isp_id)
    
    outstanding_amount = float(pending_invoices.scalar() or 0)
    
    # 3. Net Cash Flow (Collections + ExtraIncome - ISPPayments - Expenses)
    extra_income = float(db.session.query(func.coalesce(func.sum(ExtraIncome.amount), 0)).filter(
        ExtraIncome.company_id == company_id,
        ExtraIncome.income_date >= start_date,
        ExtraIncome.income_date <= end_date,
        ExtraIncome.is_active == True
    ).scalar() or 0)
    
    isp_payments = float(db.session.query(func.coalesce(func.sum(ISPPayment.amount), 0)).filter(
        ISPPayment.company_id == company_id,
        ISPPayment.payment_date >= start_date,
        ISPPayment.payment_date <= end_date,
        ISPPayment.is_active == True
    ).scalar() or 0)
    
    expenses = float(db.session.query(func.coalesce(func.sum(Expense.amount), 0)).filter(
        Expense.company_id == company_id,
        Expense.expense_date >= start_date,
        Expense.expense_date <= end_date,
        Expense.is_active == True
    ).scalar() or 0)
    
    net_cash_flow = total_collections + extra_income - isp_payments - expenses
    
    # Previous period net cash flow
    prev_extra = float(db.session.query(func.coalesce(func.sum(ExtraIncome.amount), 0)).filter(
        ExtraIncome.company_id == company_id,
        ExtraIncome.income_date >= prev_start,
        ExtraIncome.income_date <= prev_end,
        ExtraIncome.is_active == True
    ).scalar() or 0)
    
    prev_isp = float(db.session.query(func.coalesce(func.sum(ISPPayment.amount), 0)).filter(
        ISPPayment.company_id == company_id,
        ISPPayment.payment_date >= prev_start,
        ISPPayment.payment_date <= prev_end,
        ISPPayment.is_active == True
    ).scalar() or 0)
    
    prev_expenses = float(db.session.query(func.coalesce(func.sum(Expense.amount), 0)).filter(
        Expense.company_id == company_id,
        Expense.expense_date >= prev_start,
        Expense.expense_date <= prev_end,
        Expense.is_active == True
    ).scalar() or 0)
    
    prev_net_cash_flow = prev_collections + prev_extra - prev_isp - prev_expenses
    
    # 4. Collection Efficiency
    expected_revenue = float(db.session.query(func.coalesce(func.sum(Invoice.total_amount), 0)).join(
        Customer, Invoice.customer_id == Customer.id
    ).filter(
        Invoice.company_id == company_id,
        Invoice.due_date >= start_date,
        Invoice.due_date <= end_date,
        Invoice.is_active == True
    ).scalar() or 0)
    
    collection_efficiency = (total_collections / expected_revenue * 100) if expected_revenue > 0 else 0
    
    prev_expected = float(db.session.query(func.coalesce(func.sum(Invoice.total_amount), 0)).filter(
        Invoice.company_id == company_id,
        Invoice.due_date >= prev_start,
        Invoice.due_date <= prev_end,
        Invoice.is_active == True
    ).scalar() or 0)
    prev_efficiency = (prev_collections / prev_expected * 100) if prev_expected > 0 else 0
    
    # === TIER 2: CUSTOMER METRICS ===
    
    # 5. Active Customers
    active_customers = customer_base.filter(Customer.is_active == True).count()
    
    prev_active = Customer.query.filter(
        Customer.company_id == company_id,
        Customer.is_active == True,
        Customer.created_at <= prev_end
    ).count()
    
    # 6. New Customers (in period)
    new_customers = customer_base.filter(
        Customer.created_at >= start_date,
        Customer.created_at <= end_date
    ).count()
    
    prev_new = Customer.query.filter(
        Customer.company_id == company_id,
        Customer.created_at >= prev_start,
        Customer.created_at <= prev_end
    ).count()
    
    # 7. Churned Customers (deactivated in period)
    churned_customers = Customer.query.filter(
        Customer.company_id == company_id,
        Customer.is_active == False,
        Customer.updated_at >= start_date,
        Customer.updated_at <= end_date
    ).count()
    
    prev_churned = Customer.query.filter(
        Customer.company_id == company_id,
        Customer.is_active == False,
        Customer.updated_at >= prev_start,
        Customer.updated_at <= prev_end
    ).count()
    
    # 8. Growth Rate
    prev_total = Customer.query.filter(
        Customer.company_id == company_id,
        Customer.created_at < start_date
    ).count()
    growth_rate = ((new_customers - churned_customers) / prev_total * 100) if prev_total > 0 else 0
    
    prev_prev_total = Customer.query.filter(
        Customer.company_id == company_id,
        Customer.created_at < prev_start
    ).count()
    prev_growth = ((prev_new - prev_churned) / prev_prev_total * 100) if prev_prev_total > 0 else 0
    
    # === TIER 3: OPERATIONAL ===
    
    # 9. Open Complaints
    open_complaints = Complaint.query.join(Customer).filter(
        Customer.company_id == company_id,
        Complaint.status.in_(['open', 'in_progress']),
        Complaint.is_active == True
    ).count()
    
    # Previous week open complaints
    week_ago = datetime.now(PKT) - timedelta(days=7)
    prev_open_complaints = Complaint.query.join(Customer).filter(
        Customer.company_id == company_id,
        Complaint.status.in_(['open', 'in_progress']),
        Complaint.created_at <= week_ago,
        Complaint.is_active == True
    ).count()
    
    # 10. Avg Resolution Time (hours)
    resolved_complaints = Complaint.query.join(Customer).filter(
        Customer.company_id == company_id,
        Complaint.status == 'resolved',
        Complaint.resolved_at >= start_date,
        Complaint.resolved_at <= end_date,
        Complaint.is_active == True
    ).all()
    
    if resolved_complaints:
        total_hours = sum(
            (c.resolved_at - c.created_at).total_seconds() / 3600 
            for c in resolved_complaints 
            if c.resolved_at and c.created_at
        )
        avg_resolution = total_hours / len(resolved_complaints)
    else:
        avg_resolution = 0
    
    # Previous period avg resolution
    prev_resolved = Complaint.query.join(Customer).filter(
        Customer.company_id == company_id,
        Complaint.status == 'resolved',
        Complaint.resolved_at >= prev_start,
        Complaint.resolved_at <= prev_end,
        Complaint.is_active == True
    ).all()
    
    if prev_resolved:
        prev_total_hours = sum(
            (c.resolved_at - c.created_at).total_seconds() / 3600 
            for c in prev_resolved 
            if c.resolved_at and c.created_at
        )
        prev_avg_resolution = prev_total_hours / len(prev_resolved)
    else:
        prev_avg_resolution = 0
    
    # 11. Pending Tasks
    pending_tasks = Task.query.filter(
        Task.company_id == company_id,
        Task.status == 'pending',
        Task.is_active == True
    ).count()
    
    prev_pending = Task.query.filter(
        Task.company_id == company_id,
        Task.status == 'pending',
        Task.created_at <= week_ago,
        Task.is_active == True
    ).count()
    
    # 12. Task Completion Rate
    total_tasks = Task.query.filter(
        Task.company_id == company_id,
        Task.created_at >= start_date,
        Task.created_at <= end_date,
        Task.is_active == True
    ).count()
    
    completed_tasks = Task.query.filter(
        Task.company_id == company_id,
        Task.status == 'completed',
        Task.completed_at >= start_date,
        Task.completed_at <= end_date,
        Task.is_active == True
    ).count()
    
    completion_rate = (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0
    
    prev_total_tasks = Task.query.filter(
        Task.company_id == company_id,
        Task.created_at >= prev_start,
        Task.created_at <= prev_end,
        Task.is_active == True
    ).count()
    
    prev_completed = Task.query.filter(
        Task.company_id == company_id,
        Task.status == 'completed',
        Task.completed_at >= prev_start,
        Task.completed_at <= prev_end,
        Task.is_active == True
    ).count()
    
    prev_completion_rate = (prev_completed / prev_total_tasks * 100) if prev_total_tasks > 0 else 0
    
    # === TIER 4: BUSINESS INTELLIGENCE ===
    
    # 13. ARPU (Average Revenue Per User)
    mrr = float(db.session.query(func.coalesce(func.sum(ServicePlan.price), 0)).join(
        CustomerPackage, CustomerPackage.service_plan_id == ServicePlan.id
    ).join(
        Customer, Customer.id == CustomerPackage.customer_id
    ).filter(
        Customer.company_id == company_id,
        Customer.is_active == True,
        CustomerPackage.is_active == True
    ).scalar() or 0)
    
    arpu = mrr / active_customers if active_customers > 0 else 0
    prev_arpu = mrr / prev_active if prev_active > 0 else 0
    
    # 14. Gross Margin %
    gross_margin = ((total_collections - isp_payments) / total_collections * 100) if total_collections > 0 else 0
    prev_gross_margin = ((prev_collections - prev_isp) / prev_collections * 100) if prev_collections > 0 else 0
    
    # 15. Avg Days to Pay - Calculate in Python to avoid PostgreSQL type issues
    paid_payments = db.session.query(
        Payment.payment_date,
        Invoice.due_date
    ).join(
        Invoice, Payment.invoice_id == Invoice.id
    ).filter(
        Invoice.company_id == company_id,
        Payment.status == 'paid',
        Payment.payment_date >= start_date,
        Payment.payment_date <= end_date,
        Payment.is_active == True
    ).all()
    
    if paid_payments:
        days_diff = []
        for payment_date, due_date in paid_payments:
            if payment_date and due_date:
                # Convert both to date for comparison
                pay_dt = payment_date.date() if hasattr(payment_date, 'date') else payment_date
                due_dt = due_date if isinstance(due_date, datetime) else due_date
                if hasattr(due_dt, 'date'):
                    due_dt = due_dt.date()
                days_diff.append((pay_dt - due_dt).days)
        avg_days_to_pay = sum(days_diff) / len(days_diff) if days_diff else 0
    else:
        avg_days_to_pay = 0
    
    # Previous period
    prev_paid = db.session.query(
        Payment.payment_date,
        Invoice.due_date
    ).join(
        Invoice, Payment.invoice_id == Invoice.id
    ).filter(
        Invoice.company_id == company_id,
        Payment.status == 'paid',
        Payment.payment_date >= prev_start,
        Payment.payment_date <= prev_end,
        Payment.is_active == True
    ).all()
    
    if prev_paid:
        prev_days_diff = []
        for payment_date, due_date in prev_paid:
            if payment_date and due_date:
                pay_dt = payment_date.date() if hasattr(payment_date, 'date') else payment_date
                due_dt = due_date if isinstance(due_date, datetime) else due_date
                if hasattr(due_dt, 'date'):
                    due_dt = due_dt.date()
                prev_days_diff.append((pay_dt - due_dt).days)
        prev_days_to_pay = sum(prev_days_diff) / len(prev_days_diff) if prev_days_diff else 0
    else:
        prev_days_to_pay = 0

    
    # 16. Recovery Rate (placeholder - would need RecoveryTask data)
    recovery_rate = 0  # TODO: Calculate from recovery tasks
    prev_recovery_rate = 0
    
    return {
        # Tier 1: Financial
        'collections': {
            'value': round(total_collections, 2),
            'previous': round(prev_collections, 2),
            'trend': calculate_trend(total_collections, prev_collections),
            'is_positive': total_collections >= prev_collections
        },
        'outstanding': {
            'value': round(outstanding_amount, 2),
            'previous': 0,
            'trend': 0,
            'is_positive': False  # Lower is better
        },
        'net_cash_flow': {
            'value': round(net_cash_flow, 2),
            'previous': round(prev_net_cash_flow, 2),
            'trend': calculate_trend(net_cash_flow, prev_net_cash_flow),
            'is_positive': net_cash_flow >= prev_net_cash_flow
        },
        'collection_efficiency': {
            'value': round(collection_efficiency, 1),
            'previous': round(prev_efficiency, 1),
            'trend': round(collection_efficiency - prev_efficiency, 1),
            'is_positive': collection_efficiency >= prev_efficiency
        },
        # Tier 2: Customer
        'active_customers': {
            'value': active_customers,
            'previous': prev_active,
            'trend': calculate_trend(active_customers, prev_active),
            'is_positive': active_customers >= prev_active
        },
        'new_customers': {
            'value': new_customers,
            'previous': prev_new,
            'trend': calculate_trend(new_customers, prev_new),
            'is_positive': new_customers >= prev_new
        },
        'churned_customers': {
            'value': churned_customers,
            'previous': prev_churned,
            'trend': calculate_trend(churned_customers, prev_churned),
            'is_positive': churned_customers <= prev_churned  # Lower is better
        },
        'growth_rate': {
            'value': round(growth_rate, 1),
            'previous': round(prev_growth, 1),
            'trend': round(growth_rate - prev_growth, 1),
            'is_positive': growth_rate >= prev_growth
        },
        # Tier 3: Operational
        'open_complaints': {
            'value': open_complaints,
            'previous': prev_open_complaints,
            'trend': calculate_trend(open_complaints, prev_open_complaints),
            'is_positive': open_complaints <= prev_open_complaints  # Lower is better
        },
        'avg_resolution_time': {
            'value': round(avg_resolution, 1),
            'previous': round(prev_avg_resolution, 1),
            'trend': round(avg_resolution - prev_avg_resolution, 1),
            'is_positive': avg_resolution <= prev_avg_resolution  # Lower is better
        },
        'pending_tasks': {
            'value': pending_tasks,
            'previous': prev_pending,
            'trend': calculate_trend(pending_tasks, prev_pending),
            'is_positive': pending_tasks <= prev_pending  # Lower is better
        },
        'completion_rate': {
            'value': round(completion_rate, 1),
            'previous': round(prev_completion_rate, 1),
            'trend': round(completion_rate - prev_completion_rate, 1),
            'is_positive': completion_rate >= prev_completion_rate
        },
        # Tier 4: Business Intelligence
        'arpu': {
            'value': round(arpu, 2),
            'previous': round(prev_arpu, 2),
            'trend': calculate_trend(arpu, prev_arpu),
            'is_positive': arpu >= prev_arpu
        },
        'gross_margin': {
            'value': round(gross_margin, 1),
            'previous': round(prev_gross_margin, 1),
            'trend': round(gross_margin - prev_gross_margin, 1),
            'is_positive': gross_margin >= prev_gross_margin
        },
        'avg_days_to_pay': {
            'value': round(avg_days_to_pay, 1),
            'previous': round(prev_days_to_pay, 1),
            'trend': round(avg_days_to_pay - prev_days_to_pay, 1),
            'is_positive': avg_days_to_pay <= prev_days_to_pay  # Lower is better
        },
        'recovery_rate': {
            'value': round(recovery_rate, 1),
            'previous': round(prev_recovery_rate, 1),
            'trend': 0,
            'is_positive': True
        }
    }


def get_revenue_collection_trend(company_id, area_id=None, isp_id=None):
    """Get last 12 months revenue vs collection trend."""
    result = []
    today = datetime.now(PKT)
    
    for i in range(11, -1, -1):
        month_date = today - relativedelta(months=i)
        month_start = month_date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        month_end = (month_start + relativedelta(months=1)) - timedelta(seconds=1)
        
        # Expected revenue (invoices due in this month)
        expected_query = db.session.query(func.coalesce(func.sum(Invoice.total_amount), 0)).join(
            Customer, Invoice.customer_id == Customer.id
        ).filter(
            Invoice.company_id == company_id,
            Invoice.due_date >= month_start,
            Invoice.due_date <= month_end,
            Invoice.is_active == True
        )
        if area_id:
            expected_query = expected_query.filter(Customer.area_id == area_id)
        if isp_id:
            expected_query = expected_query.filter(Customer.isp_id == isp_id)
        
        expected = float(expected_query.scalar() or 0)
        
        # Actual collections
        collected_query = db.session.query(func.coalesce(func.sum(Payment.amount), 0)).join(
            Invoice, Payment.invoice_id == Invoice.id
        ).join(
            Customer, Invoice.customer_id == Customer.id
        ).filter(
            Invoice.company_id == company_id,
            Payment.status == 'paid',
            Payment.payment_date >= month_start,
            Payment.payment_date <= month_end,
            Payment.is_active == True
        )
        if area_id:
            collected_query = collected_query.filter(Customer.area_id == area_id)
        if isp_id:
            collected_query = collected_query.filter(Customer.isp_id == isp_id)
        
        collected = float(collected_query.scalar() or 0)
        
        result.append({
            'month': month_start.strftime('%b %Y'),
            'month_short': month_start.strftime('%b'),
            'expected': round(expected, 2),
            'collected': round(collected, 2),
            'outstanding': round(max(expected - collected, 0), 2),
            'collection_rate': round((collected / expected * 100) if expected > 0 else 0, 1)
        })
    
    return result


def get_customer_growth_chart(company_id, area_id=None, isp_id=None):
    """Get customer growth trend with new, total, and churn rate."""
    result = []
    today = datetime.now(PKT)
    
    for i in range(11, -1, -1):
        month_date = today - relativedelta(months=i)
        month_start = month_date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        month_end = (month_start + relativedelta(months=1)) - timedelta(seconds=1)
        
        # Base query
        base = Customer.query.filter(Customer.company_id == company_id)
        if area_id:
            base = base.filter(Customer.area_id == area_id)
        if isp_id:
            base = base.filter(Customer.isp_id == isp_id)
        
        # New customers in month
        new_count = base.filter(
            Customer.created_at >= month_start,
            Customer.created_at <= month_end
        ).count()
        
        # Total active as of month end
        total_active = base.filter(
            Customer.created_at <= month_end,
            Customer.is_active == True
        ).count()
        
        # Churned in month
        churned = Customer.query.filter(
            Customer.company_id == company_id,
            Customer.is_active == False,
            Customer.updated_at >= month_start,
            Customer.updated_at <= month_end
        ).count()
        
        # Churn rate
        start_total = base.filter(Customer.created_at < month_start).count()
        churn_rate = (churned / start_total * 100) if start_total > 0 else 0
        
        result.append({
            'month': month_start.strftime('%b %Y'),
            'month_short': month_start.strftime('%b'),
            'new': new_count,
            'total': total_active,
            'churned': churned,
            'churn_rate': round(churn_rate, 1)
        })
    
    return result


def get_payment_methods_breakdown(company_id, start_date, end_date, area_id=None, isp_id=None):
    """Get payment method distribution."""
    query = db.session.query(
        Payment.payment_method,
        func.sum(Payment.amount).label('amount'),
        func.count(Payment.id).label('count')
    ).join(
        Invoice, Payment.invoice_id == Invoice.id
    ).join(
        Customer, Invoice.customer_id == Customer.id
    ).filter(
        Invoice.company_id == company_id,
        Payment.status == 'paid',
        Payment.payment_date >= start_date,
        Payment.payment_date <= end_date,
        Payment.is_active == True
    )
    
    if area_id:
        query = query.filter(Customer.area_id == area_id)
    if isp_id:
        query = query.filter(Customer.isp_id == isp_id)
    
    results = query.group_by(Payment.payment_method).all()
    
    total = sum(float(r.amount or 0) for r in results)
    
    return [{
        'method': r.payment_method or 'Unknown',
        'amount': round(float(r.amount or 0), 2),
        'count': r.count,
        'percentage': round((float(r.amount or 0) / total * 100) if total > 0 else 0, 1)
    } for r in results]


def get_top_areas_revenue(company_id, start_date, end_date, limit=5):
    """Get top areas by revenue."""
    results = db.session.query(
        Area.id,
        Area.name,
        func.count(Customer.id).label('customer_count'),
        func.coalesce(func.sum(ServicePlan.price), 0).label('mrr')
    ).select_from(Area).join(
        Customer, Customer.area_id == Area.id
    ).join(
        CustomerPackage, CustomerPackage.customer_id == Customer.id
    ).join(
        ServicePlan, CustomerPackage.service_plan_id == ServicePlan.id
    ).filter(
        Area.company_id == company_id,
        Customer.is_active == True,
        CustomerPackage.is_active == True
    ).group_by(Area.id, Area.name).order_by(desc('mrr')).limit(limit).all()
    
    return [{
        'id': str(r.id),
        'name': r.name,
        'customers': r.customer_count,
        'mrr': round(float(r.mrr or 0), 2)
    } for r in results]


def get_isp_revenue_cost(company_id, start_date, end_date):
    """Get ISP revenue vs cost analysis."""
    # Get revenue by ISP
    revenue_results = db.session.query(
        ISP.id,
        ISP.name,
        func.count(Customer.id).label('customer_count'),
        func.coalesce(func.sum(ServicePlan.price), 0).label('revenue')
    ).select_from(ISP).join(
        Customer, Customer.isp_id == ISP.id
    ).join(
        CustomerPackage, CustomerPackage.customer_id == Customer.id
    ).join(
        ServicePlan, CustomerPackage.service_plan_id == ServicePlan.id
    ).filter(
        ISP.company_id == company_id,
        Customer.is_active == True,
        CustomerPackage.is_active == True
    ).group_by(ISP.id, ISP.name).all()
    
    result = []
    for r in revenue_results:
        # Get ISP costs
        cost = float(db.session.query(func.coalesce(func.sum(ISPPayment.amount), 0)).filter(
            ISPPayment.isp_id == r.id,
            ISPPayment.payment_date >= start_date,
            ISPPayment.payment_date <= end_date,
            ISPPayment.is_active == True
        ).scalar() or 0)
        
        revenue = float(r.revenue or 0)
        margin = ((revenue - cost) / revenue * 100) if revenue > 0 else 0
        
        result.append({
            'id': str(r.id),
            'isp': r.name,
            'customers': r.customer_count,
            'revenue': round(revenue, 2),
            'cost': round(cost, 2),
            'margin': round(margin, 1)
        })
    
    return result


def get_expense_breakdown(company_id, start_date, end_date):
    """Get expense breakdown by type."""
    results = db.session.query(
        ExpenseType.name,
        func.sum(Expense.amount).label('amount'),
        func.count(Expense.id).label('count')
    ).join(
        Expense, Expense.expense_type_id == ExpenseType.id
    ).filter(
        Expense.company_id == company_id,
        Expense.expense_date >= start_date,
        Expense.expense_date <= end_date,
        Expense.is_active == True
    ).group_by(ExpenseType.name).all()
    
    total = sum(float(r.amount or 0) for r in results)
    
    return [{
        'type': r.name,
        'amount': round(float(r.amount or 0), 2),
        'count': r.count,
        'percentage': round((float(r.amount or 0) / total * 100) if total > 0 else 0, 1)
    } for r in results]


def get_top_service_plans(company_id, start_date, end_date, prev_start, prev_end, limit=10):
    """Get top service plans with growth comparison."""
    results = db.session.query(
        ServicePlan.id,
        ServicePlan.name,
        ServicePlan.price,
        func.count(CustomerPackage.id).label('subscribers')
    ).join(
        CustomerPackage, CustomerPackage.service_plan_id == ServicePlan.id
    ).join(
        Customer, Customer.id == CustomerPackage.customer_id
    ).filter(
        ServicePlan.company_id == company_id,
        Customer.is_active == True,
        CustomerPackage.is_active == True
    ).group_by(ServicePlan.id, ServicePlan.name, ServicePlan.price).order_by(
        desc('subscribers')
    ).limit(limit).all()
    
    plans = []
    for r in results:
        mrr = float(r.price or 0) * r.subscribers
        
        # Previous period subscribers
        prev_subs = CustomerPackage.query.join(
            Customer, Customer.id == CustomerPackage.customer_id
        ).filter(
            CustomerPackage.service_plan_id == r.id,
            CustomerPackage.created_at <= prev_end,
            Customer.is_active == True,
            CustomerPackage.is_active == True
        ).count()
        
        growth = calculate_trend(r.subscribers, prev_subs)
        
        plans.append({
            'id': str(r.id),
            'name': r.name,
            'price': round(float(r.price or 0), 2),
            'subscribers': r.subscribers,
            'mrr': round(mrr, 2),
            'growth': growth
        })
    
    return plans


def get_overdue_invoices(company_id, area_id=None, isp_id=None, limit=20):
    """Get overdue invoices for action panel."""
    today = datetime.now(PKT).date()
    
    query = db.session.query(
        Invoice,
        Customer
    ).join(
        Customer, Invoice.customer_id == Customer.id
    ).filter(
        Invoice.company_id == company_id,
        Invoice.status.in_(['pending', 'partially_paid', 'overdue']),
        Invoice.due_date < today,
        Invoice.is_active == True
    )
    
    if area_id:
        query = query.filter(Customer.area_id == area_id)
    if isp_id:
        query = query.filter(Customer.isp_id == isp_id)
    
    results = query.order_by(Invoice.due_date.asc()).limit(limit).all()
    
    return [{
        'id': str(inv.id),
        'invoice_number': inv.invoice_number,
        'customer_id': str(cust.id),
        'customer_name': f"{cust.first_name} {cust.last_name}",
        'internet_id': cust.internet_id,
        'amount': round(float(inv.total_amount or 0), 2),
        'due_date': inv.due_date.strftime('%Y-%m-%d') if inv.due_date else None,
        'days_overdue': (today - inv.due_date).days if inv.due_date else 0,
        'status': inv.status
    } for inv, cust in results]


def get_filter_options(company_id):
    """Get filter dropdown options."""
    areas = Area.query.filter(
        Area.company_id == company_id,
        Area.is_active == True
    ).all()
    
    isps = ISP.query.filter(
        ISP.company_id == company_id,
        ISP.is_active == True
    ).all()
    
    plans = ServicePlan.query.filter(
        ServicePlan.company_id == company_id,
        ServicePlan.is_active == True
    ).all()
    
    return {
        'areas': [{'id': str(a.id), 'name': a.name} for a in areas],
        'isps': [{'id': str(i.id), 'name': i.name} for i in isps],
        'service_plans': [{'id': str(p.id), 'name': p.name} for p in plans],
        'payment_methods': ['cash', 'bank_transfer', 'online', 'credit_card'],
        'compare_options': [
            {'value': 'last_month', 'label': 'vs Last Month'},
            {'value': 'last_quarter', 'label': 'vs Last Quarter'},
            {'value': 'last_year', 'label': 'vs Last Year'}
        ]
    }
