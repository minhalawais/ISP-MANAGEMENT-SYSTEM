"""
Service Support Dashboard CRUD - Enterprise Level Analytics

Provides complaint tracking, resolution metrics, technician performance,
and period-over-period comparisons.
"""

from app import db
from app.models import (
    Complaint, Customer, Task, TaskAssignee, User, Area
)
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta
from sqlalchemy import func, case, and_, or_, desc
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


def get_service_support_advanced(company_id, filters=None):
    """Main function to fetch all service support dashboard data."""
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
        status = filters.get('status') if filters.get('status') != 'all' else None
        priority = filters.get('priority') if filters.get('priority') != 'all' else None
        area_id = filters.get('area_id') if filters.get('area_id') != 'all' else None
        technician_id = filters.get('technician_id') if filters.get('technician_id') != 'all' else None
        
        response = {
            'kpis': get_all_kpis(company_id, start_date, end_date, prev_start, prev_end,
                                status, priority, area_id, technician_id),
            'charts': {
                'complaint_trend': get_complaint_trend(company_id, area_id, technician_id),
                'status_distribution': get_status_distribution(company_id, area_id, technician_id),
                'resolution_time': get_resolution_time_distribution(company_id, start_date, end_date, area_id),
                'technician_performance': get_technician_performance(company_id, start_date, end_date)
            },
            'tables': {
                'open_complaints': get_open_complaints(company_id, area_id, technician_id),
                'technician_summary': get_technician_summary(company_id, start_date, end_date)
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
        logger.error(f"Database error in service support dashboard: {e}")
        return {'error': 'Database error occurred'}
    except Exception as e:
        logger.error(f"Error in service support dashboard: {e}")
        return {'error': str(e)}


def get_all_kpis(company_id, start_date, end_date, prev_start, prev_end,
                 status=None, priority=None, area_id=None, technician_id=None):
    """Calculate all 8 KPIs with trends."""
    
    # Base complaint query
    def build_complaint_query(base_query, s_date=None, e_date=None):
        q = base_query.join(Customer, Complaint.customer_id == Customer.id).filter(
            Customer.company_id == company_id,
            Complaint.is_active == True
        )
        if s_date:
            q = q.filter(Complaint.created_at >= s_date)
        if e_date:
            q = q.filter(Complaint.created_at <= e_date)
        if area_id:
            q = q.filter(Customer.area_id == area_id)
        if technician_id:
            q = q.filter(Complaint.assigned_to == technician_id)
        return q
    
    # === ROW 1: COMPLAINTS ===
    
    # 1. Total Complaints (in period)
    total_complaints = build_complaint_query(
        Complaint.query, start_date, end_date
    ).count()
    
    prev_total = build_complaint_query(
        Complaint.query, prev_start, prev_end
    ).count()
    
    # 2. Open Complaints (current)
    open_complaints = build_complaint_query(Complaint.query).filter(
        Complaint.status == 'open'
    ).count()
    
    prev_open = Complaint.query.join(Customer).filter(
        Customer.company_id == company_id,
        Complaint.status == 'open',
        Complaint.created_at <= prev_end,
        Complaint.is_active == True
    ).count()
    
    # 3. Avg Resolution Time (hours)
    resolution_data = build_complaint_query(Complaint.query, start_date, end_date).filter(
        Complaint.status == 'resolved',
        Complaint.resolved_at.isnot(None)
    ).with_entities(Complaint.created_at, Complaint.resolved_at).all()
    
    if resolution_data:
        total_hours = sum(
            (r.resolved_at - r.created_at).total_seconds() / 3600
            for r in resolution_data if r.resolved_at and r.created_at
        )
        avg_resolution = total_hours / len(resolution_data)
    else:
        avg_resolution = 0
    
    # Previous period avg resolution
    prev_res_data = build_complaint_query(Complaint.query, prev_start, prev_end).filter(
        Complaint.status == 'resolved',
        Complaint.resolved_at.isnot(None)
    ).with_entities(Complaint.created_at, Complaint.resolved_at).all()
    
    if prev_res_data:
        prev_hours = sum(
            (r.resolved_at - r.created_at).total_seconds() / 3600
            for r in prev_res_data if r.resolved_at and r.created_at
        )
        prev_avg_resolution = prev_hours / len(prev_res_data)
    else:
        prev_avg_resolution = 0
    
    # 4. First Contact Resolution %
    resolved_complaints = build_complaint_query(Complaint.query, start_date, end_date).filter(
        Complaint.status == 'resolved'
    ).all()
    
    fcr_count = sum(1 for c in resolved_complaints if c.resolution_attempts == 1)
    fcr_rate = (fcr_count / len(resolved_complaints) * 100) if resolved_complaints else 0
    
    prev_resolved = build_complaint_query(Complaint.query, prev_start, prev_end).filter(
        Complaint.status == 'resolved'
    ).all()
    prev_fcr = sum(1 for c in prev_resolved if c.resolution_attempts == 1)
    prev_fcr_rate = (prev_fcr / len(prev_resolved) * 100) if prev_resolved else 0
    
    # === ROW 2: SATISFACTION & TASKS ===
    
    # 5. Customer Satisfaction (1-5 scale)
    avg_satisfaction = db.session.query(func.avg(Complaint.satisfaction_rating)).join(
        Customer, Complaint.customer_id == Customer.id
    ).filter(
        Customer.company_id == company_id,
        Complaint.satisfaction_rating.isnot(None),
        Complaint.created_at >= start_date,
        Complaint.created_at <= end_date,
        Complaint.is_active == True
    ).scalar()
    avg_satisfaction = float(avg_satisfaction or 0)
    
    prev_satisfaction = db.session.query(func.avg(Complaint.satisfaction_rating)).join(
        Customer, Complaint.customer_id == Customer.id
    ).filter(
        Customer.company_id == company_id,
        Complaint.satisfaction_rating.isnot(None),
        Complaint.created_at >= prev_start,
        Complaint.created_at <= prev_end,
        Complaint.is_active == True
    ).scalar()
    prev_satisfaction = float(prev_satisfaction or 0)
    
    # 6. SLA Compliance %
    sla_complaints = build_complaint_query(Complaint.query, start_date, end_date).filter(
        Complaint.status == 'resolved',
        Complaint.resolved_at.isnot(None),
        Complaint.response_due_date.isnot(None)
    ).all()
    
    sla_met = sum(1 for c in sla_complaints if c.resolved_at <= c.response_due_date)
    sla_compliance = (sla_met / len(sla_complaints) * 100) if sla_complaints else 100
    
    prev_sla = build_complaint_query(Complaint.query, prev_start, prev_end).filter(
        Complaint.status == 'resolved',
        Complaint.resolved_at.isnot(None),
        Complaint.response_due_date.isnot(None)
    ).all()
    prev_sla_met = sum(1 for c in prev_sla if c.resolved_at <= c.response_due_date)
    prev_sla_compliance = (prev_sla_met / len(prev_sla) * 100) if prev_sla else 100
    
    # 7. Pending Tasks
    pending_tasks = Task.query.filter(
        Task.company_id == company_id,
        Task.status == 'pending',
        Task.is_active == True
    ).count()
    
    # 8. Overdue Tasks
    now = datetime.now(PKT)
    overdue_tasks = Task.query.filter(
        Task.company_id == company_id,
        Task.status.in_(['pending', 'in_progress']),
        Task.due_date < now,
        Task.is_active == True
    ).count()
    
    return {
        # Row 1
        'total_complaints': {
            'value': total_complaints,
            'previous': prev_total,
            'trend': calculate_trend(total_complaints, prev_total),
            'is_positive': total_complaints <= prev_total
        },
        'open_complaints': {
            'value': open_complaints,
            'previous': prev_open,
            'trend': calculate_trend(open_complaints, prev_open),
            'is_positive': open_complaints <= prev_open
        },
        'avg_resolution_time': {
            'value': round(avg_resolution, 1),
            'previous': round(prev_avg_resolution, 1),
            'trend': calculate_trend(avg_resolution, prev_avg_resolution),
            'is_positive': avg_resolution <= prev_avg_resolution
        },
        'fcr_rate': {
            'value': round(fcr_rate, 1),
            'previous': round(prev_fcr_rate, 1),
            'trend': round(fcr_rate - prev_fcr_rate, 1),
            'is_positive': fcr_rate >= prev_fcr_rate
        },
        # Row 2
        'avg_satisfaction': {
            'value': round(avg_satisfaction, 1),
            'previous': round(prev_satisfaction, 1),
            'trend': round(avg_satisfaction - prev_satisfaction, 1),
            'is_positive': avg_satisfaction >= prev_satisfaction
        },
        'sla_compliance': {
            'value': round(sla_compliance, 1),
            'previous': round(prev_sla_compliance, 1),
            'trend': round(sla_compliance - prev_sla_compliance, 1),
            'is_positive': sla_compliance >= prev_sla_compliance
        },
        'pending_tasks': {
            'value': pending_tasks,
            'previous': 0,
            'trend': 0,
            'is_positive': pending_tasks == 0
        },
        'overdue_tasks': {
            'value': overdue_tasks,
            'previous': 0,
            'trend': 0,
            'is_positive': overdue_tasks == 0
        }
    }


def get_complaint_trend(company_id, area_id=None, technician_id=None):
    """Get last 12 weeks complaint trend."""
    result = []
    today = datetime.now(PKT)
    
    for i in range(11, -1, -1):
        week_end = today - timedelta(weeks=i)
        week_start = week_end - timedelta(days=6)
        
        base = Complaint.query.join(Customer).filter(
            Customer.company_id == company_id,
            Complaint.is_active == True
        )
        if area_id:
            base = base.filter(Customer.area_id == area_id)
        if technician_id:
            base = base.filter(Complaint.assigned_to == technician_id)
        
        new_count = base.filter(
            Complaint.created_at >= week_start,
            Complaint.created_at <= week_end
        ).count()
        
        resolved_count = base.filter(
            Complaint.status == 'resolved',
            Complaint.resolved_at >= week_start,
            Complaint.resolved_at <= week_end
        ).count()
        
        result.append({
            'week': week_start.strftime('%b %d'),
            'new': new_count,
            'resolved': resolved_count
        })
    
    return result


def get_status_distribution(company_id, area_id=None, technician_id=None):
    """Get complaint status distribution."""
    base = db.session.query(
        Complaint.status,
        func.count(Complaint.id).label('count')
    ).join(Customer).filter(
        Customer.company_id == company_id,
        Complaint.is_active == True
    )
    
    if area_id:
        base = base.filter(Customer.area_id == area_id)
    if technician_id:
        base = base.filter(Complaint.assigned_to == technician_id)
    
    results = base.group_by(Complaint.status).all()
    
    return [{'status': r.status or 'unknown', 'count': r.count} for r in results]


def get_resolution_time_distribution(company_id, start_date, end_date, area_id=None):
    """Get resolution time distribution in buckets."""
    base = Complaint.query.join(Customer).filter(
        Customer.company_id == company_id,
        Complaint.status == 'resolved',
        Complaint.resolved_at.isnot(None),
        Complaint.created_at >= start_date,
        Complaint.created_at <= end_date,
        Complaint.is_active == True
    )
    
    if area_id:
        base = base.filter(Customer.area_id == area_id)
    
    complaints = base.all()
    
    buckets = {
        '<4hr': 0,
        '4-12hr': 0,
        '12-24hr': 0,
        '1-3d': 0,
        '3d+': 0
    }
    
    for c in complaints:
        if c.resolved_at and c.created_at:
            hours = (c.resolved_at - c.created_at).total_seconds() / 3600
            if hours < 4:
                buckets['<4hr'] += 1
            elif hours < 12:
                buckets['4-12hr'] += 1
            elif hours < 24:
                buckets['12-24hr'] += 1
            elif hours < 72:
                buckets['1-3d'] += 1
            else:
                buckets['3d+'] += 1
    
    return [{'bucket': k, 'count': v} for k, v in buckets.items()]


def get_technician_performance(company_id, start_date, end_date):
    """Get technician task completion performance."""
    results = db.session.query(
        User.id,
        User.first_name,
        User.last_name,
        func.count(Task.id).label('completed')
    ).join(
        TaskAssignee, TaskAssignee.employee_id == User.id
    ).join(
        Task, Task.id == TaskAssignee.task_id
    ).filter(
        Task.company_id == company_id,
        Task.status == 'completed',
        Task.completed_at >= start_date,
        Task.completed_at <= end_date,
        Task.is_active == True
    ).group_by(User.id, User.first_name, User.last_name).order_by(desc('completed')).limit(10).all()
    
    return [{'name': f"{r.first_name or ''} {r.last_name or ''}".strip() or 'Unknown', 'completed': r.completed} for r in results]


def get_open_complaints(company_id, area_id=None, technician_id=None, limit=20):
    """Get open complaints queue."""
    base = Complaint.query.join(Customer).filter(
        Customer.company_id == company_id,
        Complaint.status.in_(['open', 'in_progress']),
        Complaint.is_active == True
    )
    
    if area_id:
        base = base.filter(Customer.area_id == area_id)
    if technician_id:
        base = base.filter(Complaint.assigned_to == technician_id)
    
    complaints = base.order_by(Complaint.created_at.desc()).limit(limit).all()
    
    result = []
    for c in complaints:
        assigned_name = None
        if c.assigned_to:
            user = User.query.get(c.assigned_to)
            assigned_name = f"{user.first_name or ''} {user.last_name or ''}".strip() if user else None
        
        area_name = None
        if c.customer and c.customer.area_id:
            area = Area.query.get(c.customer.area_id)
            area_name = area.name if area else None
        
        result.append({
            'id': str(c.id),
            'ticket_number': c.ticket_number,
            'customer_name': f"{c.customer.first_name or ''} {c.customer.last_name or ''}".strip() if c.customer else 'Unknown',
            'customer_internet_id': c.customer.internet_id if c.customer else None,
            'area': area_name,
            'description': c.description[:100] if c.description else '',
            'status': c.status,
            'created_at': c.created_at.isoformat() if c.created_at else None,
            'sla_due': c.response_due_date.isoformat() if c.response_due_date else None,
            'assigned_to': assigned_name
        })
    
    return result


def get_technician_summary(company_id, start_date, end_date, limit=10):
    """Get technician summary table."""
    # Get technicians with assigned complaints
    tech_data = db.session.query(
        User.id,
        User.first_name,
        User.last_name,
        func.count(Complaint.id).label('resolved_count'),
        func.avg(Complaint.satisfaction_rating).label('avg_csat')
    ).join(
        Complaint, Complaint.assigned_to == User.id
    ).join(
        Customer, Complaint.customer_id == Customer.id
    ).filter(
        Customer.company_id == company_id,
        Complaint.status == 'resolved',
        Complaint.resolved_at >= start_date,
        Complaint.resolved_at <= end_date,
        Complaint.is_active == True
    ).group_by(User.id, User.first_name, User.last_name).order_by(desc('resolved_count')).limit(limit).all()
    
    result = []
    for t in tech_data:
        # Calculate avg resolution time for this technician
        res_times = Complaint.query.join(Customer).filter(
            Customer.company_id == company_id,
            Complaint.assigned_to == t.id,
            Complaint.status == 'resolved',
            Complaint.resolved_at.isnot(None),
            Complaint.resolved_at >= start_date,
            Complaint.resolved_at <= end_date,
            Complaint.is_active == True
        ).with_entities(Complaint.created_at, Complaint.resolved_at).all()
        
        if res_times:
            total_hours = sum(
                (r.resolved_at - r.created_at).total_seconds() / 3600
                for r in res_times if r.resolved_at and r.created_at
            )
            avg_hours = total_hours / len(res_times)
        else:
            avg_hours = 0
        
        result.append({
            'id': str(t.id),
            'name': f"{t.first_name or ''} {t.last_name or ''}".strip() or 'Unknown',
            'resolved': t.resolved_count,
            'avg_resolution_hours': round(avg_hours, 1),
            'csat_score': round(float(t.avg_csat or 0), 1)
        })
    
    return result


def get_filter_options(company_id):
    """Get available filter options."""
    # Areas
    areas = Area.query.filter(
        Area.company_id == company_id,
        Area.is_active == True
    ).all()
    
    # Technicians (users who have been assigned complaints)
    technicians = db.session.query(User.id, User.first_name, User.last_name).join(
        Complaint, Complaint.assigned_to == User.id
    ).join(
        Customer, Complaint.customer_id == Customer.id
    ).filter(
        Customer.company_id == company_id
    ).distinct().all()
    
    return {
        'areas': [{'id': str(a.id), 'name': a.name} for a in areas],
        'technicians': [{'id': str(t.id), 'name': f"{t.first_name or ''} {t.last_name or ''}".strip()} for t in technicians],
        'statuses': ['open', 'in_progress', 'resolved', 'closed'],
        'priorities': ['low', 'medium', 'high', 'critical']
    }
