"""
Regional Analysis Dashboard CRUD - Enterprise Level Analytics

Provides geopolitical performance metrics, revenue analysis per area, 
and service quality tracking.
"""

from app import db
from app.models import (
    Area, Customer, Invoice, Complaint, ServicePlan, User
)
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta
from sqlalchemy import func, case, desc, or_
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


def get_area_advanced(company_id, filters=None):
    """Main function to fetch all regional dashboard data."""
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
        area_ids = filters.get('area_ids', '').split(',') if filters.get('area_ids') and filters.get('area_ids') != 'all' else None
        plan_id = filters.get('plan_id') if filters.get('plan_id') != 'all' else None
        
        response = {
            'kpis': get_all_kpis(company_id, start_date, end_date, prev_start, prev_end, area_ids, plan_id),
            'charts': {
                'revenue_by_area': get_revenue_by_area(company_id, start_date, end_date, area_ids),
                'growth_trends': get_growth_trends(company_id, area_ids),
                'service_distribution': get_service_distribution(company_id, area_ids),
                'complaint_hotspots': get_complaint_hotspots(company_id, start_date, end_date, area_ids)
            },
            'tables': {
                'area_performance': get_area_performance_table(company_id, start_date, end_date, area_ids),
                'critical_zones': get_critical_zones(company_id, start_date, end_date)
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
        logger.error(f"Database error in regional dashboard: {e}")
        return {'error': 'Database error occurred'}
    except Exception as e:
        logger.error(f"Error in regional dashboard: {e}")
        return {'error': str(e)}


def get_all_kpis(company_id, start_date, end_date, prev_start, prev_end, area_ids=None, plan_id=None):
    """Calculate all 8 KPIs with trends."""
    
    def build_customer_query(base_query):
        q = base_query.filter(Customer.company_id == company_id)
        if area_ids:
            q = q.filter(Customer.area_id.in_(area_ids))
        if plan_id:
            q = q.filter(Customer.isp_id == plan_id) # Using plan_id as placeholder for isp_id/service_plan link
        return q
    
    def build_invoice_query(base_query):
        q = base_query.join(Customer).filter(Customer.company_id == company_id)
        if area_ids:
            q = q.filter(Customer.area_id.in_(area_ids))
        return q

    # === ROW 1: FINANCIAL HEALTH ===
    
    # 1. Total Revenue (Paid Invoices)
    total_revenue = build_invoice_query(
        db.session.query(func.sum(Invoice.total_amount))
    ).filter(
        Invoice.status == 'paid',
        Invoice.created_at >= start_date,
        Invoice.created_at <= end_date
    ).scalar() or 0
    
    prev_revenue = build_invoice_query(
        db.session.query(func.sum(Invoice.total_amount))
    ).filter(
        Invoice.status == 'paid',
        Invoice.created_at >= prev_start,
        Invoice.created_at <= prev_end
    ).scalar() or 0
    
    # 2. Outstanding Dues (Unpaid Invoices)
    outstanding_dues = build_invoice_query(
        db.session.query(func.sum(Invoice.total_amount))
    ).filter(
        Invoice.status == 'unpaid'
    ).scalar() or 0
    
    # 3. Collection Rate
    total_invoiced = build_invoice_query(
        db.session.query(func.sum(Invoice.total_amount))
    ).filter(
        Invoice.created_at >= start_date,
        Invoice.created_at <= end_date
    ).scalar() or 0
    
    collection_rate = (float(total_revenue) / float(total_invoiced) * 100) if total_invoiced > 0 else 0
    
    # 4. ARPU (Avg Revenue Per User)
    active_users_count = build_customer_query(
        db.session.query(func.count(Customer.id))
    ).filter(Customer.is_active == True).scalar() or 1
    
    arpu = float(total_revenue) / active_users_count if active_users_count > 0 else 0
    
    # === ROW 2: OPERATIONAL HEALTH ===
    
    # 5. Total Active Users
    active_users = build_customer_query(Customer.query).filter(Customer.is_active == True).count()
    prev_active_users = Customer.query.filter(
        Customer.company_id == company_id,
        Customer.is_active == True,
        Customer.created_at <= prev_end
    ).count() # Rough estimate for prev active
    
    # 6. New Connections
    new_connections = build_customer_query(
        db.session.query(func.count(Customer.id))
    ).filter(
        Customer.created_at >= start_date,
        Customer.created_at <= end_date
    ).scalar() or 0
    
    prev_connections = build_customer_query(
        db.session.query(func.count(Customer.id))
    ).filter(
        Customer.created_at >= prev_start,
        Customer.created_at <= prev_end
    ).scalar() or 0
    
    # 7. Complaint Rate (Complaints per 100 users) -> simple density
    total_complaints = db.session.query(func.count(Complaint.id)).join(Customer).filter(
        Customer.company_id == company_id,
        Complaint.created_at >= start_date,
        Complaint.created_at <= end_date
    )
    if area_ids:
        total_complaints = total_complaints.filter(Customer.area_id.in_(area_ids))
    total_complaints = total_complaints.scalar() or 0
    
    complaint_rate = (total_complaints / active_users * 100) if active_users > 0 else 0
    
    # 8. Churn Rate (Inactive customers / Total Customers)
    churned_customers = build_customer_query(
        db.session.query(func.count(Customer.id))
    ).filter(
        Customer.is_active == False,
        Customer.updated_at >= start_date,
        Customer.updated_at <= end_date
    ).scalar() or 0
    
    churn_rate = (churned_customers / active_users * 100) if active_users > 0 else 0

    return {
        # Row 1
        'total_revenue': {
            'value': round(float(total_revenue), 2),
            'previous': round(float(prev_revenue), 2),
            'trend': calculate_trend(float(total_revenue), float(prev_revenue)),
            'is_positive': True
        },
        'outstanding_dues': {
            'value': round(float(outstanding_dues), 2),
            'previous': 0,
            'trend': 0,
            'is_positive': False
        },
        'collection_rate': {
            'value': round(collection_rate, 1),
            'previous': 0,
            'trend': 0,
            'is_positive': True
        },
        'arpu': {
            'value': round(arpu, 0),
            'previous': 0,
            'trend': 0,
            'is_positive': True
        },
        # Row 2
        'active_users': {
            'value': active_users,
            'previous': prev_active_users,
            'trend': calculate_trend(active_users, prev_active_users),
            'is_positive': True
        },
        'new_connections': {
            'value': new_connections,
            'previous': prev_connections,
            'trend': calculate_trend(new_connections, prev_connections),
            'is_positive': True
        },
        'complaint_rate': {
            'value': round(complaint_rate, 1),
            'previous': 0,
            'trend': 0,
            'is_positive': False
        },
        'churn_rate': {
            'value': round(churn_rate, 1),
            'previous': 0,
            'trend': 0,
            'is_positive': False
        }
    }


def get_revenue_by_area(company_id, start_date, end_date, area_ids=None):
    """Get top 10 areas by revenue."""
    query = db.session.query(
        Area.name,
        func.sum(Invoice.total_amount).label('revenue')
    ).join(
        Customer, Customer.area_id == Area.id
    ).join(
        Invoice, Invoice.customer_id == Customer.id
    ).filter(
        Area.company_id == company_id,
        Invoice.status == 'paid',
        Invoice.created_at >= start_date,
        Invoice.created_at <= end_date
    )
    
    if area_ids:
        query = query.filter(Area.id.in_(area_ids))
    
    results = query.group_by(Area.name).order_by(desc('revenue')).limit(10).all()
    
    return [{'area': r.name, 'revenue': round(float(r.revenue or 0), 2)} for r in results]


def get_growth_trends(company_id, area_ids=None):
    """Get monthly new connection trends for top areas."""
    six_months_ago = datetime.now(PKT) - timedelta(days=180)
    
    query = db.session.query(
        func.date_trunc('month', Customer.created_at).label('month'),
        Area.name,
        func.count(Customer.id).label('count')
    ).join(
        Area, Customer.area_id == Area.id
    ).filter(
        Customer.company_id == company_id,
        Customer.created_at >= six_months_ago
    )
    
    if area_ids:
        query = query.filter(Area.id.in_(area_ids))
    
    results = query.group_by('month', Area.name).order_by('month').all()
    
    # Process into recharts format: { month: 'Jan', Area A: 10, Area B: 5 }
    data_map = {}
    for r in results:
        month = r.month.strftime('%b')
        if month not in data_map:
            data_map[month] = {'month': month}
        data_map[month][r.name] = r.count
    
    return list(data_map.values())


def get_service_distribution(company_id, area_ids=None):
    """Get service plan distribution."""
    # Note: Assuming Customer has link to ServicePlan explicitly or via ISP
    # For now, using ServicePlan model linked via ISP if possible, or fallback
    query = db.session.query(
        ServicePlan.name,
        func.count(Customer.id).label('count')
    ).join(
        Customer, ServicePlan.isp_id == Customer.isp_id  # Approximation based on ISP link
        # Ideally Customer should have service_plan_id directly
    ).filter(
        Customer.company_id == company_id,
        Customer.is_active == True
    )
    
    if area_ids:
        query = query.filter(Customer.area_id.in_(area_ids))
    
    results = query.group_by(ServicePlan.name).all()
    return [{'name': r.name, 'value': r.count} for r in results]


def get_complaint_hotspots(company_id, start_date, end_date, area_ids=None):
    """Get areas with high complaints."""
    query = db.session.query(
        Area.name,
        func.count(Complaint.id).label('count')
    ).join(
        Customer, Customer.area_id == Area.id
    ).join(
        Complaint, Complaint.customer_id == Customer.id
    ).filter(
        Area.company_id == company_id,
        Complaint.created_at >= start_date,
        Complaint.created_at <= end_date
    )
    
    if area_ids:
        query = query.filter(Area.id.in_(area_ids))
    
    results = query.group_by(Area.name).order_by(desc('count')).limit(10).all()
    
    return [{'area': r.name, 'complaints': r.count} for r in results]


def get_area_performance_table(company_id, start_date, end_date, area_ids=None):
    """Get comprehensive area performance stats."""
    query = db.session.query(
        Area.id,
        Area.name,
        func.count(Customer.id).label('users')
    ).join(
        Customer, Customer.area_id == Area.id
    ).filter(
        Area.company_id == company_id,
        Customer.is_active == True
    )
    
    if area_ids:
        query = query.filter(Area.id.in_(area_ids))
    
    areas = query.group_by(Area.id, Area.name).all()
    
    result = []
    for a in areas:
        # Revenue
        revenue = db.session.query(func.sum(Invoice.total_amount)).join(Customer).filter(
            Customer.area_id == a.id,
            Invoice.status == 'paid',
            Invoice.created_at >= start_date,
            Invoice.created_at <= end_date
        ).scalar() or 0
        
        # Complaints
        complaints = db.session.query(func.count(Complaint.id)).join(Customer).filter(
            Customer.area_id == a.id,
            Complaint.created_at >= start_date,
            Complaint.created_at <= end_date
        ).scalar() or 0
        
        arpu = float(revenue) / a.users if a.users > 0 else 0
        
        result.append({
            'id': str(a.id),
            'name': a.name,
            'users': a.users,
            'revenue': round(float(revenue), 2),
            'arpu': round(arpu, 0),
            'complaints': complaints,
            'growth': 5.0 # Placeholder calculation
        })
        
    return sorted(result, key=lambda x: x['revenue'], reverse=True)


def get_critical_zones(company_id, start_date, end_date):
    """Identify areas needing attention."""
    # Implementation logic: High complaints or low collection
    # Simplified approach: Top 5 areas by complaint count
    
    zones = get_complaint_hotspots(company_id, start_date, end_date)
    return [
        {
            'area': z['area'],
            'issue': 'High Complaint Volume',
            'value': f"{z['complaints']} complaints",
            'supervisor': 'N/A' # Add supervisor logic later
        } for z in zones[:5]
    ]


def get_filter_options(company_id):
    """Get available filter options."""
    areas = Area.query.filter_by(company_id=company_id).all()
    plans = ServicePlan.query.filter_by(company_id=company_id).all()
    
    return {
        'areas': [{'id': str(a.id), 'name': a.name} for a in areas],
        'plans': [{'id': str(p.id), 'name': p.name} for p in plans]
    }
