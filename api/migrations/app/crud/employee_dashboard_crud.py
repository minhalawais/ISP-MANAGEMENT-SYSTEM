"""
Employee Analytics Dashboard CRUD - Enterprise Level Analytics

Provides workforce tracking, performance metrics, salary/commission management,
and period-over-period comparisons.
"""

from app import db
from app.models import (
    User, Task, TaskAssignee, Complaint, Customer, EmployeeLedger
)
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta
from sqlalchemy import func, case, desc
from sqlalchemy.exc import SQLAlchemyError
from pytz import timezone
import logging

logger = logging.getLogger(__name__)

PKT = timezone('Asia/Karachi')


def get_date_range(start_date_str, end_date_str):
    """Parse date strings to datetime objects."""
    try:
        if start_date_str:
            start_date = datetime.strptime(start_date_str, '%Y-%m-%d').replace(tzinfo=PKT)
        else:
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


def get_employee_advanced(company_id, filters=None):
    """Main function to fetch all employee dashboard data."""
    if not company_id:
        return {'error': 'Company ID is required'}
    
    filters = filters or {}
    
    try:
        start_date, end_date = get_date_range(
            filters.get('start_date'),
            filters.get('end_date')
        )
        
        compare_type = filters.get('compare', 'last_month')
        prev_start, prev_end = get_previous_period(start_date, end_date, compare_type)
        
        # Extract filter values
        role = filters.get('role') if filters.get('role') != 'all' else None
        status = filters.get('status') if filters.get('status') != 'all' else None
        
        response = {
            'kpis': get_all_kpis(company_id, start_date, end_date, prev_start, prev_end, role, status),
            'charts': {
                'performance_by_employee': get_performance_by_employee(company_id, start_date, end_date, role),
                'productivity_trend': get_productivity_trend(company_id, role),
                'role_distribution': get_role_distribution(company_id),
                'satisfaction_trend': get_satisfaction_trend(company_id)
            },
            'tables': {
                'top_performers': get_top_performers(company_id, start_date, end_date),
                'recent_payouts': get_recent_payouts(company_id, start_date, end_date)
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
        logger.error(f"Database error in employee dashboard: {e}")
        return {'error': 'Database error occurred'}
    except Exception as e:
        logger.error(f"Error in employee dashboard: {e}")
        return {'error': str(e)}


def get_all_kpis(company_id, start_date, end_date, prev_start, prev_end, role=None, status=None):
    """Calculate all 8 KPIs with trends."""
    
    def build_user_query(base_query):
        q = base_query.filter(User.company_id == company_id)
        if role:
            q = q.filter(User.role == role)
        if status == 'active':
            q = q.filter(User.is_active == True)
        elif status == 'inactive':
            q = q.filter(User.is_active == False)
        return q
    
    # === ROW 1: WORKFORCE OVERVIEW ===
    
    # 1. Total Employees
    total_employees = build_user_query(User.query).filter(User.is_active == True).count()
    
    # 2. Total Salary (monthly)
    total_salary = build_user_query(
        db.session.query(func.sum(User.salary))
    ).filter(User.is_active == True).scalar() or 0
    
    # 3. Pending Balance (sum of current_balance)
    pending_balance = build_user_query(
        db.session.query(func.sum(User.current_balance))
    ).filter(User.is_active == True).scalar() or 0
    
    # 4. Paid This Period (from ledger - payout transactions)
    paid_period = db.session.query(func.sum(func.abs(EmployeeLedger.amount))).join(
        User, EmployeeLedger.employee_id == User.id
    ).filter(
        User.company_id == company_id,
        EmployeeLedger.transaction_type == 'payout',
        EmployeeLedger.created_at >= start_date,
        EmployeeLedger.created_at <= end_date
    ).scalar() or 0
    
    prev_paid = db.session.query(func.sum(func.abs(EmployeeLedger.amount))).join(
        User, EmployeeLedger.employee_id == User.id
    ).filter(
        User.company_id == company_id,
        EmployeeLedger.transaction_type == 'payout',
        EmployeeLedger.created_at >= prev_start,
        EmployeeLedger.created_at <= prev_end
    ).scalar() or 0
    
    # === ROW 2: PERFORMANCE ===
    
    # 5. Tasks Completed
    tasks_completed = db.session.query(func.count(Task.id)).filter(
        Task.company_id == company_id,
        Task.status == 'completed',
        Task.completed_at >= start_date,
        Task.completed_at <= end_date
    ).scalar() or 0
    
    prev_tasks = db.session.query(func.count(Task.id)).filter(
        Task.company_id == company_id,
        Task.status == 'completed',
        Task.completed_at >= prev_start,
        Task.completed_at <= prev_end
    ).scalar() or 0
    
    # 6. Complaints Resolved
    complaints_resolved = db.session.query(func.count(Complaint.id)).join(
        Customer, Complaint.customer_id == Customer.id
    ).filter(
        Customer.company_id == company_id,
        Complaint.status == 'resolved',
        Complaint.resolved_at >= start_date,
        Complaint.resolved_at <= end_date
    ).scalar() or 0
    
    prev_complaints = db.session.query(func.count(Complaint.id)).join(
        Customer, Complaint.customer_id == Customer.id
    ).filter(
        Customer.company_id == company_id,
        Complaint.status == 'resolved',
        Complaint.resolved_at >= prev_start,
        Complaint.resolved_at <= prev_end
    ).scalar() or 0
    
    # 7. Avg Satisfaction
    avg_satisfaction = db.session.query(func.avg(Complaint.satisfaction_rating)).join(
        Customer, Complaint.customer_id == Customer.id
    ).filter(
        Customer.company_id == company_id,
        Complaint.satisfaction_rating.isnot(None),
        Complaint.resolved_at >= start_date,
        Complaint.resolved_at <= end_date
    ).scalar() or 0
    
    prev_satisfaction = db.session.query(func.avg(Complaint.satisfaction_rating)).join(
        Customer, Complaint.customer_id == Customer.id
    ).filter(
        Customer.company_id == company_id,
        Complaint.satisfaction_rating.isnot(None),
        Complaint.resolved_at >= prev_start,
        Complaint.resolved_at <= prev_end
    ).scalar() or 0
    
    # 8. Top Performer
    top_performer_data = db.session.query(
        User.first_name,
        User.last_name,
        func.count(Task.id).label('task_count')
    ).join(
        TaskAssignee, TaskAssignee.employee_id == User.id
    ).join(
        Task, Task.id == TaskAssignee.task_id
    ).filter(
        User.company_id == company_id,
        Task.status == 'completed',
        Task.completed_at >= start_date,
        Task.completed_at <= end_date
    ).group_by(User.id, User.first_name, User.last_name).order_by(
        desc('task_count')
    ).first()
    
    top_performer = f"{top_performer_data.first_name or ''} {top_performer_data.last_name or ''}".strip() if top_performer_data else 'N/A'
    
    return {
        # Row 1
        'total_employees': {
            'value': total_employees,
            'previous': 0,
            'trend': 0,
            'is_positive': True
        },
        'total_salary': {
            'value': round(float(total_salary), 2),
            'previous': 0,
            'trend': 0,
            'is_positive': True
        },
        'pending_balance': {
            'value': round(float(pending_balance), 2),
            'previous': 0,
            'trend': 0,
            'is_positive': float(pending_balance) == 0
        },
        'paid_period': {
            'value': round(float(paid_period), 2),
            'previous': round(float(prev_paid), 2),
            'trend': calculate_trend(float(paid_period), float(prev_paid)),
            'is_positive': True
        },
        # Row 2
        'tasks_completed': {
            'value': tasks_completed,
            'previous': prev_tasks,
            'trend': calculate_trend(tasks_completed, prev_tasks),
            'is_positive': tasks_completed >= prev_tasks
        },
        'complaints_resolved': {
            'value': complaints_resolved,
            'previous': prev_complaints,
            'trend': calculate_trend(complaints_resolved, prev_complaints),
            'is_positive': complaints_resolved >= prev_complaints
        },
        'avg_satisfaction': {
            'value': round(float(avg_satisfaction), 1),
            'previous': round(float(prev_satisfaction), 1),
            'trend': round(float(avg_satisfaction) - float(prev_satisfaction), 1),
            'is_positive': float(avg_satisfaction) >= float(prev_satisfaction)
        },
        'top_performer': {
            'value': top_performer,
            'previous': '',
            'trend': 0,
            'is_positive': True
        }
    }


def get_performance_by_employee(company_id, start_date, end_date, role=None):
    """Get tasks completed per employee."""
    query = db.session.query(
        User.id,
        User.first_name,
        User.last_name,
        func.count(Task.id).label('tasks')
    ).join(
        TaskAssignee, TaskAssignee.employee_id == User.id
    ).join(
        Task, Task.id == TaskAssignee.task_id
    ).filter(
        User.company_id == company_id,
        Task.status == 'completed',
        Task.completed_at >= start_date,
        Task.completed_at <= end_date
    )
    
    if role:
        query = query.filter(User.role == role)
    
    results = query.group_by(User.id, User.first_name, User.last_name).order_by(
        desc('tasks')
    ).limit(10).all()
    
    return [
        {
            'name': f"{r.first_name or ''} {r.last_name or ''}".strip() or 'Unknown',
            'tasks': r.tasks
        } for r in results
    ]


def get_productivity_trend(company_id, role=None):
    """Get monthly productivity trend."""
    six_months_ago = datetime.now(PKT) - timedelta(days=180)
    
    query = db.session.query(
        func.date_trunc('month', Task.completed_at).label('month'),
        func.count(Task.id).label('tasks')
    ).filter(
        Task.company_id == company_id,
        Task.status == 'completed',
        Task.completed_at >= six_months_ago
    )
    
    if role:
        query = query.join(TaskAssignee, TaskAssignee.task_id == Task.id).join(
            User, User.id == TaskAssignee.employee_id
        ).filter(User.role == role)
    
    results = query.group_by('month').order_by('month').all()
    
    return [
        {
            'month': r.month.strftime('%b') if r.month else 'Unknown',
            'tasks': r.tasks
        } for r in results
    ]


def get_role_distribution(company_id):
    """Get employee count by role."""
    results = db.session.query(
        User.role,
        func.count(User.id).label('count')
    ).filter(
        User.company_id == company_id,
        User.is_active == True
    ).group_by(User.role).all()
    
    return [{'role': r.role or 'Unknown', 'count': r.count} for r in results]


def get_satisfaction_trend(company_id):
    """Get monthly avg satisfaction trend."""
    six_months_ago = datetime.now(PKT) - timedelta(days=180)
    
    results = db.session.query(
        func.date_trunc('month', Complaint.resolved_at).label('month'),
        func.avg(Complaint.satisfaction_rating).label('rating')
    ).join(
        Customer, Complaint.customer_id == Customer.id
    ).filter(
        Customer.company_id == company_id,
        Complaint.satisfaction_rating.isnot(None),
        Complaint.resolved_at >= six_months_ago
    ).group_by('month').order_by('month').all()
    
    return [
        {
            'month': r.month.strftime('%b') if r.month else 'Unknown',
            'rating': round(float(r.rating or 0), 1)
        } for r in results
    ]


def get_top_performers(company_id, start_date, end_date, limit=10):
    """Get top performing employees."""
    results = db.session.query(
        User.id,
        User.first_name,
        User.last_name,
        User.role,
        User.current_balance,
        func.count(Task.id).label('tasks')
    ).outerjoin(
        TaskAssignee, TaskAssignee.employee_id == User.id
    ).outerjoin(
        Task, (Task.id == TaskAssignee.task_id) & (Task.status == 'completed') & 
        (Task.completed_at >= start_date) & (Task.completed_at <= end_date)
    ).filter(
        User.company_id == company_id,
        User.is_active == True
    ).group_by(
        User.id, User.first_name, User.last_name, User.role, User.current_balance
    ).order_by(desc('tasks')).limit(limit).all()
    
    # Get complaint counts separately
    employee_complaints = {}
    complaint_data = db.session.query(
        Complaint.assigned_to,
        func.count(Complaint.id).label('count'),
        func.avg(Complaint.satisfaction_rating).label('avg_rating')
    ).join(
        Customer, Complaint.customer_id == Customer.id
    ).filter(
        Customer.company_id == company_id,
        Complaint.status == 'resolved',
        Complaint.resolved_at >= start_date,
        Complaint.resolved_at <= end_date
    ).group_by(Complaint.assigned_to).all()
    
    for c in complaint_data:
        if c.assigned_to:
            employee_complaints[str(c.assigned_to)] = {
                'count': c.count,
                'rating': round(float(c.avg_rating or 0), 1)
            }
    
    return [
        {
            'id': str(r.id),
            'name': f"{r.first_name or ''} {r.last_name or ''}".strip() or 'Unknown',
            'role': r.role or 'Unknown',
            'tasks': r.tasks or 0,
            'complaints': employee_complaints.get(str(r.id), {}).get('count', 0),
            'satisfaction': employee_complaints.get(str(r.id), {}).get('rating', 0),
            'balance': round(float(r.current_balance or 0), 2)
        } for r in results
    ]


def get_recent_payouts(company_id, start_date, end_date, limit=10):
    """Get recent employee payouts."""
    results = EmployeeLedger.query.join(
        User, EmployeeLedger.employee_id == User.id
    ).filter(
        User.company_id == company_id,
        EmployeeLedger.transaction_type == 'payout',
        EmployeeLedger.created_at >= start_date,
        EmployeeLedger.created_at <= end_date
    ).order_by(EmployeeLedger.created_at.desc()).limit(limit).all()
    
    return [
        {
            'id': str(r.id),
            'employee': f"{r.employee.first_name or ''} {r.employee.last_name or ''}".strip() if r.employee else 'Unknown',
            'amount': round(abs(float(r.amount)), 2),
            'type': r.transaction_type,
            'date': r.created_at.isoformat() if r.created_at else None,
            'description': r.description[:50] if r.description else ''
        } for r in results
    ]


def get_filter_options(company_id):
    """Get available filter options."""
    # Roles
    roles = db.session.query(User.role).filter(
        User.company_id == company_id
    ).distinct().all()
    
    return {
        'roles': [r[0] for r in roles if r[0]],
        'statuses': ['active', 'inactive']
    }
