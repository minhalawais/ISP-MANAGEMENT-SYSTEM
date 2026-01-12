"""
Customer Dashboard CRUD - Enterprise Level Analytics

This module provides comprehensive customer analytics with real-time KPIs,
charts, segmentation, and period-over-period comparisons.
"""

from app import db
from app.models import (
    Customer, Invoice, Payment, Complaint, ServicePlan, CustomerPackage,
    Area, SubZone, ISP, User
)
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta
from sqlalchemy import func, case, and_, or_, desc, asc
from sqlalchemy.exc import SQLAlchemyError
from pytz import timezone
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


def get_customer_dashboard_advanced(company_id, filters=None):
    """
    Main function to fetch all customer dashboard data.
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
        sub_zone_id = filters.get('sub_zone_id') if filters.get('sub_zone_id') != 'all' else None
        isp_id = filters.get('isp_id') if filters.get('isp_id') != 'all' else None
        service_plan_id = filters.get('service_plan_id') if filters.get('service_plan_id') != 'all' else None
        connection_type = filters.get('connection_type') if filters.get('connection_type') != 'all' else None
        status = filters.get('status', 'all')
        
        # Build response
        response = {
            'kpis': get_all_kpis(company_id, start_date, end_date, prev_start, prev_end, 
                                area_id, sub_zone_id, isp_id, service_plan_id, connection_type, status),
            'charts': {
                'customer_growth': get_customer_growth_trend(company_id, area_id, isp_id),
                'area_distribution': get_area_distribution(company_id, isp_id),
                'service_plan_popularity': get_service_plan_popularity(company_id, area_id, isp_id),
                'connection_types': get_connection_type_distribution(company_id, area_id, isp_id),
                'isp_distribution': get_isp_distribution(company_id, area_id),
                'tenure_distribution': get_tenure_distribution(company_id, area_id, isp_id),
                'payment_behavior': get_payment_behavior(company_id, start_date, end_date, area_id, isp_id)
            },
            'tables': {
                'area_performance': get_area_performance(company_id, start_date, end_date, prev_start, prev_end),
                'at_risk_customers': get_at_risk_customers(company_id, area_id, isp_id),
                'newest_customers': get_newest_customers(company_id, area_id, isp_id),
                'longest_tenure': get_longest_tenure_customers(company_id, area_id, isp_id)
            },
            'segments': get_customer_segments(company_id, area_id, isp_id),
            'filters': get_filter_options(company_id),
            'period': {
                'start_date': start_date.strftime('%Y-%m-%d'),
                'end_date': end_date.strftime('%Y-%m-%d'),
                'compare': compare_type
            }
        }
        
        return response
        
    except SQLAlchemyError as e:
        logger.error(f"Database error in customer dashboard: {e}")
        return {'error': 'Database error occurred'}
    except Exception as e:
        logger.error(f"Error in customer dashboard: {e}")
        return {'error': str(e)}


def get_all_kpis(company_id, start_date, end_date, prev_start, prev_end,
                 area_id=None, sub_zone_id=None, isp_id=None, service_plan_id=None, 
                 connection_type=None, status='all'):
    """Calculate all 16 KPIs with trends."""
    
    # Base customer query with filters
    def build_customer_query(base_query):
        if area_id:
            base_query = base_query.filter(Customer.area_id == area_id)
        if sub_zone_id:
            base_query = base_query.filter(Customer.sub_zone_id == sub_zone_id)
        if isp_id:
            base_query = base_query.filter(Customer.isp_id == isp_id)
        if connection_type:
            base_query = base_query.filter(Customer.connection_type == connection_type)
        return base_query
    
    # === ROW 1: CORE CUSTOMER METRICS ===
    
    # 1. Total Customers
    total_query = Customer.query.filter(Customer.company_id == company_id)
    total_query = build_customer_query(total_query)
    if status == 'active':
        total_query = total_query.filter(Customer.is_active == True)
    elif status == 'inactive':
        total_query = total_query.filter(Customer.is_active == False)
    total_customers = total_query.count()
    
    prev_total = Customer.query.filter(
        Customer.company_id == company_id,
        Customer.created_at <= prev_end
    ).count()
    
    # 2. Active Customers
    active_query = Customer.query.filter(
        Customer.company_id == company_id,
        Customer.is_active == True
    )
    active_query = build_customer_query(active_query)
    active_customers = active_query.count()
    
    prev_active = Customer.query.filter(
        Customer.company_id == company_id,
        Customer.is_active == True,
        Customer.created_at <= prev_end
    ).count()
    
    # 3. New Customers (in period)
    new_query = Customer.query.filter(
        Customer.company_id == company_id,
        Customer.created_at >= start_date,
        Customer.created_at <= end_date
    )
    new_query = build_customer_query(new_query)
    new_customers = new_query.count()
    
    prev_new = Customer.query.filter(
        Customer.company_id == company_id,
        Customer.created_at >= prev_start,
        Customer.created_at <= prev_end
    ).count()
    
    # 4. Churned Customers (deactivated in period)
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
    
    # === ROW 2: CUSTOMER HEALTH ===
    
    # 5. Acquisition Rate %
    acquisition_rate = (new_customers / total_customers * 100) if total_customers > 0 else 0
    prev_acq = (prev_new / prev_total * 100) if prev_total > 0 else 0
    
    # 6. Churn Rate %
    start_count = Customer.query.filter(
        Customer.company_id == company_id,
        Customer.created_at < start_date
    ).count()
    churn_rate = (churned_customers / start_count * 100) if start_count > 0 else 0
    
    prev_start_count = Customer.query.filter(
        Customer.company_id == company_id,
        Customer.created_at < prev_start
    ).count()
    prev_churn = (prev_churned / prev_start_count * 100) if prev_start_count > 0 else 0
    
    # 7. Net Growth Rate %
    net_growth = new_customers - churned_customers
    net_growth_rate = (net_growth / start_count * 100) if start_count > 0 else 0
    prev_net_growth_rate = ((prev_new - prev_churned) / prev_start_count * 100) if prev_start_count > 0 else 0
    
    # 8. Retention Rate %
    retention_rate = ((start_count - churned_customers) / start_count * 100) if start_count > 0 else 100
    prev_retention = ((prev_start_count - prev_churned) / prev_start_count * 100) if prev_start_count > 0 else 100
    
    # === ROW 3: REVENUE PER CUSTOMER ===
    
    # 9. ARPU (Average Revenue Per User)
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
    
    # 10. Avg Customer Lifetime (months) - Calculate in Python to avoid PostgreSQL type issues
    today = datetime.now(PKT).date()
    active_customer_dates = Customer.query.filter(
        Customer.company_id == company_id,
        Customer.is_active == True,
        Customer.installation_date.isnot(None)
    ).with_entities(Customer.installation_date).all()
    
    if active_customer_dates:
        total_days = sum((today - c.installation_date).days for c in active_customer_dates if c.installation_date)
        avg_lifetime_days = total_days / len(active_customer_dates)
    else:
        avg_lifetime_days = 0
    avg_lifetime_months = avg_lifetime_days / 30

    
    # 11. CLV (Customer Lifetime Value)
    clv = arpu * avg_lifetime_months
    
    # 12. Avg Invoice Amount
    avg_invoice = float(db.session.query(func.avg(Invoice.total_amount)).filter(
        Invoice.company_id == company_id,
        Invoice.is_active == True
    ).scalar() or 0)
    
    prev_avg_invoice = float(db.session.query(func.avg(Invoice.total_amount)).filter(
        Invoice.company_id == company_id,
        Invoice.created_at >= prev_start,
        Invoice.created_at <= prev_end,
        Invoice.is_active == True
    ).scalar() or 0)
    
    # === ROW 4: SERVICE & SATISFACTION ===
    
    # 13. Avg Satisfaction (from complaints)
    avg_satisfaction = db.session.query(func.avg(Complaint.satisfaction_rating)).join(
        Customer, Complaint.customer_id == Customer.id
    ).filter(
        Customer.company_id == company_id,
        Complaint.satisfaction_rating.isnot(None)
    ).scalar()
    avg_satisfaction = float(avg_satisfaction or 0)
    
    # 14. Complaint Rate %
    customers_with_complaints = db.session.query(func.count(func.distinct(Complaint.customer_id))).join(
        Customer, Complaint.customer_id == Customer.id
    ).filter(
        Customer.company_id == company_id,
        Complaint.created_at >= start_date,
        Complaint.created_at <= end_date,
        Complaint.is_active == True
    ).scalar() or 0
    
    complaint_rate = (customers_with_complaints / active_customers * 100) if active_customers > 0 else 0
    
    prev_complaints = db.session.query(func.count(func.distinct(Complaint.customer_id))).join(
        Customer, Complaint.customer_id == Customer.id
    ).filter(
        Customer.company_id == company_id,
        Complaint.created_at >= prev_start,
        Complaint.created_at <= prev_end,
        Complaint.is_active == True
    ).scalar() or 0
    prev_complaint_rate = (prev_complaints / prev_active * 100) if prev_active > 0 else 0
    
    # 15. Avg Days to Recharge (payment timing)
    payment_timing = db.session.query(
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
    
    if payment_timing:
        days_diff = []
        for pay_date, due_date in payment_timing:
            if pay_date and due_date:
                pay_dt = pay_date.date() if hasattr(pay_date, 'date') else pay_date
                due_dt = due_date if not hasattr(due_date, 'date') else due_date
                days_diff.append((pay_dt - due_dt).days)
        avg_days_to_recharge = sum(days_diff) / len(days_diff) if days_diff else 0
    else:
        avg_days_to_recharge = 0
    
    # 16. Equipment Ownership Rate % (company-owned equipment)
    company_owned = Customer.query.filter(
        Customer.company_id == company_id,
        Customer.is_active == True,
        Customer.router_ownership == 'company'
    ).count()
    equipment_ownership_rate = (company_owned / active_customers * 100) if active_customers > 0 else 0
    
    return {
        # Row 1: Core Metrics
        'total_customers': {
            'value': total_customers,
            'previous': prev_total,
            'trend': calculate_trend(total_customers, prev_total),
            'is_positive': total_customers >= prev_total
        },
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
            'is_positive': churned_customers <= prev_churned
        },
        # Row 2: Health
        'acquisition_rate': {
            'value': round(acquisition_rate, 2),
            'previous': round(prev_acq, 2),
            'trend': round(acquisition_rate - prev_acq, 2),
            'is_positive': acquisition_rate >= prev_acq
        },
        'churn_rate': {
            'value': round(churn_rate, 2),
            'previous': round(prev_churn, 2),
            'trend': round(churn_rate - prev_churn, 2),
            'is_positive': churn_rate <= prev_churn
        },
        'net_growth_rate': {
            'value': round(net_growth_rate, 2),
            'previous': round(prev_net_growth_rate, 2),
            'trend': round(net_growth_rate - prev_net_growth_rate, 2),
            'is_positive': net_growth_rate >= prev_net_growth_rate
        },
        'retention_rate': {
            'value': round(retention_rate, 2),
            'previous': round(prev_retention, 2),
            'trend': round(retention_rate - prev_retention, 2),
            'is_positive': retention_rate >= prev_retention
        },
        # Row 3: Revenue
        'arpu': {
            'value': round(arpu, 2),
            'previous': round(prev_arpu, 2),
            'trend': calculate_trend(arpu, prev_arpu),
            'is_positive': arpu >= prev_arpu
        },
        'avg_lifetime_months': {
            'value': round(avg_lifetime_months, 1),
            'previous': 0,
            'trend': 0,
            'is_positive': True
        },
        'clv': {
            'value': round(clv, 2),
            'previous': 0,
            'trend': 0,
            'is_positive': True
        },
        'avg_invoice': {
            'value': round(avg_invoice, 2),
            'previous': round(prev_avg_invoice, 2),
            'trend': calculate_trend(avg_invoice, prev_avg_invoice),
            'is_positive': avg_invoice >= prev_avg_invoice
        },
        # Row 4: Satisfaction
        'avg_satisfaction': {
            'value': round(avg_satisfaction, 1),
            'previous': 0,
            'trend': 0,
            'is_positive': avg_satisfaction >= 4.0
        },
        'complaint_rate': {
            'value': round(complaint_rate, 2),
            'previous': round(prev_complaint_rate, 2),
            'trend': round(complaint_rate - prev_complaint_rate, 2),
            'is_positive': complaint_rate <= prev_complaint_rate
        },
        'avg_days_to_recharge': {
            'value': round(avg_days_to_recharge, 1),
            'previous': 0,
            'trend': 0,
            'is_positive': avg_days_to_recharge <= 0
        },
        'equipment_ownership_rate': {
            'value': round(equipment_ownership_rate, 1),
            'previous': 0,
            'trend': 0,
            'is_positive': True
        }
    }


def get_customer_growth_trend(company_id, area_id=None, isp_id=None):
    """Get last 12 months customer growth trend."""
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
        
        # New customers
        new_count = base.filter(
            Customer.created_at >= month_start,
            Customer.created_at <= month_end
        ).count()
        
        # Total active
        total_active = base.filter(
            Customer.created_at <= month_end,
            Customer.is_active == True
        ).count()
        
        # Churned
        churned = Customer.query.filter(
            Customer.company_id == company_id,
            Customer.is_active == False,
            Customer.updated_at >= month_start,
            Customer.updated_at <= month_end
        ).count()
        
        # Net growth
        net_growth = new_count - churned
        
        result.append({
            'month': month_start.strftime('%b %Y'),
            'month_short': month_start.strftime('%b'),
            'new': new_count,
            'churned': churned,
            'total': total_active,
            'net_growth': net_growth
        })
    
    return result


def get_area_distribution(company_id, isp_id=None):
    """Get customer distribution by area with MRR."""
    query = db.session.query(
        Area.id,
        Area.name,
        func.count(Customer.id).label('customers'),
        func.coalesce(func.sum(ServicePlan.price), 0).label('mrr')
    ).select_from(Area).outerjoin(
        Customer, and_(Customer.area_id == Area.id, Customer.is_active == True)
    ).outerjoin(
        CustomerPackage, and_(CustomerPackage.customer_id == Customer.id, CustomerPackage.is_active == True)
    ).outerjoin(
        ServicePlan, CustomerPackage.service_plan_id == ServicePlan.id
    ).filter(
        Area.company_id == company_id,
        Area.is_active == True
    )
    
    if isp_id:
        query = query.filter(Customer.isp_id == isp_id)
    
    results = query.group_by(Area.id, Area.name).all()
    
    return [{
        'id': str(r.id),
        'name': r.name,
        'customers': r.customers or 0,
        'mrr': round(float(r.mrr or 0), 2)
    } for r in results]


def get_service_plan_popularity(company_id, area_id=None, isp_id=None):
    """Get service plan distribution."""
    query = db.session.query(
        ServicePlan.id,
        ServicePlan.name,
        ServicePlan.price,
        ServicePlan.speed_mbps,
        func.count(CustomerPackage.id).label('subscribers')
    ).select_from(ServicePlan).outerjoin(
        CustomerPackage, and_(CustomerPackage.service_plan_id == ServicePlan.id, CustomerPackage.is_active == True)
    ).outerjoin(
        Customer, CustomerPackage.customer_id == Customer.id
    ).filter(
        ServicePlan.company_id == company_id,
        ServicePlan.is_active == True
    )
    
    if area_id:
        query = query.filter(Customer.area_id == area_id)
    if isp_id:
        query = query.filter(Customer.isp_id == isp_id)
    
    results = query.group_by(ServicePlan.id, ServicePlan.name, ServicePlan.price, ServicePlan.speed_mbps).order_by(desc('subscribers')).all()
    
    return [{
        'id': str(r.id),
        'name': r.name,
        'price': round(float(r.price or 0), 2),
        'speed': r.speed_mbps or 0,
        'subscribers': r.subscribers or 0,
        'mrr': round(float(r.price or 0) * (r.subscribers or 0), 2)
    } for r in results]


def get_connection_type_distribution(company_id, area_id=None, isp_id=None):
    """Get connection type distribution."""
    query = db.session.query(
        Customer.connection_type,
        func.count(Customer.id).label('count')
    ).filter(
        Customer.company_id == company_id,
        Customer.is_active == True
    )
    
    if area_id:
        query = query.filter(Customer.area_id == area_id)
    if isp_id:
        query = query.filter(Customer.isp_id == isp_id)
    
    results = query.group_by(Customer.connection_type).all()
    total = sum(r.count for r in results)
    
    return [{
        'type': r.connection_type or 'Unknown',
        'count': r.count,
        'percentage': round((r.count / total * 100) if total > 0 else 0, 1)
    } for r in results]


def get_isp_distribution(company_id, area_id=None):
    """Get ISP distribution."""
    query = db.session.query(
        ISP.id,
        ISP.name,
        func.count(Customer.id).label('customers'),
        func.coalesce(func.sum(ServicePlan.price), 0).label('mrr')
    ).select_from(ISP).outerjoin(
        Customer, and_(Customer.isp_id == ISP.id, Customer.is_active == True)
    ).outerjoin(
        CustomerPackage, and_(CustomerPackage.customer_id == Customer.id, CustomerPackage.is_active == True)
    ).outerjoin(
        ServicePlan, CustomerPackage.service_plan_id == ServicePlan.id
    ).filter(
        ISP.company_id == company_id,
        ISP.is_active == True
    )
    
    if area_id:
        query = query.filter(Customer.area_id == area_id)
    
    results = query.group_by(ISP.id, ISP.name).all()
    total = sum(r.customers or 0 for r in results)
    
    return [{
        'id': str(r.id),
        'name': r.name,
        'customers': r.customers or 0,
        'mrr': round(float(r.mrr or 0), 2),
        'percentage': round(((r.customers or 0) / total * 100) if total > 0 else 0, 1)
    } for r in results]


def get_tenure_distribution(company_id, area_id=None, isp_id=None):
    """Get customer tenure distribution."""
    today = datetime.now(PKT).date()
    
    base = Customer.query.filter(
        Customer.company_id == company_id,
        Customer.is_active == True
    )
    if area_id:
        base = base.filter(Customer.area_id == area_id)
    if isp_id:
        base = base.filter(Customer.isp_id == isp_id)
    
    customers = base.all()
    
    buckets = {
        '0-3m': 0,
        '3-6m': 0,
        '6-12m': 0,
        '1-2y': 0,
        '2-3y': 0,
        '3+y': 0
    }
    
    for c in customers:
        if c.installation_date:
            days = (today - c.installation_date).days
            months = days / 30
            
            if months < 3:
                buckets['0-3m'] += 1
            elif months < 6:
                buckets['3-6m'] += 1
            elif months < 12:
                buckets['6-12m'] += 1
            elif months < 24:
                buckets['1-2y'] += 1
            elif months < 36:
                buckets['2-3y'] += 1
            else:
                buckets['3+y'] += 1
    
    return [{'tenure': k, 'count': v} for k, v in buckets.items()]


def get_payment_behavior(company_id, start_date, end_date, area_id=None, isp_id=None):
    """Get payment behavior analysis."""
    query = db.session.query(
        Payment.payment_date,
        Invoice.due_date,
        Payment.amount
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
    
    results = query.all()
    
    early = 0
    on_time = 0
    late = 0
    
    for pay_date, due_date, amount in results:
        if pay_date and due_date:
            pay_dt = pay_date.date() if hasattr(pay_date, 'date') else pay_date
            days_diff = (pay_dt - due_date).days
            
            if days_diff < 0:
                early += 1
            elif days_diff <= 3:
                on_time += 1
            else:
                late += 1
    
    total = early + on_time + late
    
    return [
        {'category': 'Early', 'count': early, 'percentage': round((early/total*100) if total > 0 else 0, 1)},
        {'category': 'On-Time', 'count': on_time, 'percentage': round((on_time/total*100) if total > 0 else 0, 1)},
        {'category': 'Late', 'count': late, 'percentage': round((late/total*100) if total > 0 else 0, 1)}
    ]


def get_area_performance(company_id, start_date, end_date, prev_start, prev_end, limit=10):
    """Get area performance table data."""
    results = db.session.query(
        Area.id,
        Area.name,
        func.count(func.distinct(SubZone.id)).label('sub_zones'),
        func.count(Customer.id).label('customers'),
        func.coalesce(func.sum(ServicePlan.price), 0).label('mrr')
    ).select_from(Area).outerjoin(
        SubZone, SubZone.area_id == Area.id
    ).outerjoin(
        Customer, and_(Customer.area_id == Area.id, Customer.is_active == True)
    ).outerjoin(
        CustomerPackage, and_(CustomerPackage.customer_id == Customer.id, CustomerPackage.is_active == True)
    ).outerjoin(
        ServicePlan, CustomerPackage.service_plan_id == ServicePlan.id
    ).filter(
        Area.company_id == company_id,
        Area.is_active == True
    ).group_by(Area.id, Area.name).order_by(desc('customers')).limit(limit).all()
    
    areas = []
    for r in results:
        # Get growth
        new_in_area = Customer.query.filter(
            Customer.company_id == company_id,
            Customer.area_id == r.id,
            Customer.created_at >= start_date,
            Customer.created_at <= end_date
        ).count()
        
        churned_in_area = Customer.query.filter(
            Customer.company_id == company_id,
            Customer.area_id == r.id,
            Customer.is_active == False,
            Customer.updated_at >= start_date,
            Customer.updated_at <= end_date
        ).count()
        
        # Open complaints
        open_complaints = Complaint.query.join(Customer).filter(
            Customer.company_id == company_id,
            Customer.area_id == r.id,
            Complaint.status.in_(['open', 'in_progress']),
            Complaint.is_active == True
        ).count()
        
        growth = new_in_area - churned_in_area
        
        areas.append({
            'id': str(r.id),
            'name': r.name,
            'sub_zones': r.sub_zones or 0,
            'customers': r.customers or 0,
            'mrr': round(float(r.mrr or 0), 2),
            'new': new_in_area,
            'churned': churned_in_area,
            'growth': growth,
            'complaints': open_complaints
        })
    
    return areas


def get_at_risk_customers(company_id, area_id=None, isp_id=None, limit=20):
    """Get at-risk customers (overdue payments or complaints)."""
    today = datetime.now(PKT).date()
    
    # Customers with overdue invoices
    overdue_subq = db.session.query(Invoice.customer_id).filter(
        Invoice.company_id == company_id,
        Invoice.status.in_(['pending', 'overdue']),
        Invoice.due_date < today,
        Invoice.is_active == True
    ).distinct().subquery()
    
    # Customers with open complaints
    complaint_subq = db.session.query(Complaint.customer_id).join(Customer).filter(
        Customer.company_id == company_id,
        Complaint.status.in_(['open', 'in_progress']),
        Complaint.is_active == True
    ).distinct().subquery()
    
    query = db.session.query(
        Customer,
        func.count(Invoice.id).label('overdue_count'),
        func.coalesce(func.sum(Invoice.total_amount), 0).label('overdue_amount')
    ).outerjoin(
        Invoice, and_(
            Invoice.customer_id == Customer.id,
            Invoice.status.in_(['pending', 'overdue']),
            Invoice.due_date < today,
            Invoice.is_active == True
        )
    ).filter(
        Customer.company_id == company_id,
        Customer.is_active == True,
        or_(
            Customer.id.in_(overdue_subq),
            Customer.id.in_(complaint_subq)
        )
    )
    
    if area_id:
        query = query.filter(Customer.area_id == area_id)
    if isp_id:
        query = query.filter(Customer.isp_id == isp_id)
    
    results = query.group_by(Customer.id).order_by(desc('overdue_amount')).limit(limit).all()
    
    customers = []
    for c, overdue_count, overdue_amount in results:
        # Get area name
        area = Area.query.get(c.area_id)
        
        # Get open complaints count
        complaints = Complaint.query.filter(
            Complaint.customer_id == c.id,
            Complaint.status.in_(['open', 'in_progress']),
            Complaint.is_active == True
        ).count()
        
        customers.append({
            'id': str(c.id),
            'name': f"{c.first_name} {c.last_name}",
            'internet_id': c.internet_id,
            'area': area.name if area else 'N/A',
            'phone': c.phone_1,
            'overdue_invoices': overdue_count or 0,
            'overdue_amount': round(float(overdue_amount or 0), 2),
            'complaints': complaints
        })
    
    return customers


def get_newest_customers(company_id, area_id=None, isp_id=None, limit=10):
    """Get newest customers."""
    query = Customer.query.filter(
        Customer.company_id == company_id,
        Customer.is_active == True
    )
    
    if area_id:
        query = query.filter(Customer.area_id == area_id)
    if isp_id:
        query = query.filter(Customer.isp_id == isp_id)
    
    results = query.order_by(desc(Customer.created_at)).limit(limit).all()
    
    return [{
        'id': str(c.id),
        'name': f"{c.first_name} {c.last_name}",
        'internet_id': c.internet_id,
        'created_at': c.created_at.strftime('%Y-%m-%d') if c.created_at else None,
        'connection_type': c.connection_type
    } for c in results]


def get_longest_tenure_customers(company_id, area_id=None, isp_id=None, limit=10):
    """Get customers with longest tenure."""
    query = Customer.query.filter(
        Customer.company_id == company_id,
        Customer.is_active == True
    )
    
    if area_id:
        query = query.filter(Customer.area_id == area_id)
    if isp_id:
        query = query.filter(Customer.isp_id == isp_id)
    
    results = query.order_by(asc(Customer.installation_date)).limit(limit).all()
    today = datetime.now(PKT).date()
    
    return [{
        'id': str(c.id),
        'name': f"{c.first_name} {c.last_name}",
        'internet_id': c.internet_id,
        'installation_date': c.installation_date.strftime('%Y-%m-%d') if c.installation_date else None,
        'tenure_days': (today - c.installation_date).days if c.installation_date else 0
    } for c in results]


def get_customer_segments(company_id, area_id=None, isp_id=None):
    """Get customer segments."""
    today = datetime.now(PKT)
    three_months_ago = today - relativedelta(months=3)
    
    base = Customer.query.filter(Customer.company_id == company_id)
    if area_id:
        base = base.filter(Customer.area_id == area_id)
    if isp_id:
        base = base.filter(Customer.isp_id == isp_id)
    
    # New (< 3 months)
    new_count = base.filter(
        Customer.is_active == True,
        Customer.created_at >= three_months_ago
    ).count()
    
    # Churned (inactive)
    churned_count = base.filter(Customer.is_active == False).count()
    
    # Active (3+ months)
    stable_count = base.filter(
        Customer.is_active == True,
        Customer.created_at < three_months_ago
    ).count()
    
    # At-risk (with overdue or complaints) - simplified
    at_risk_count = 0  # Would need more complex query
    
    return {
        'new': {'count': new_count, 'label': 'New (< 3 months)'},
        'stable': {'count': stable_count, 'label': 'Stable (3+ months)'},
        'at_risk': {'count': at_risk_count, 'label': 'At Risk'},
        'churned': {'count': churned_count, 'label': 'Churned'}
    }


def get_filter_options(company_id):
    """Get filter dropdown options."""
    areas = Area.query.filter(
        Area.company_id == company_id,
        Area.is_active == True
    ).all()
    
    sub_zones = SubZone.query.filter(
        SubZone.company_id == company_id,
        SubZone.is_active == True
    ).all()
    
    isps = ISP.query.filter(
        ISP.company_id == company_id,
        ISP.is_active == True
    ).all()
    
    plans = ServicePlan.query.filter(
        ServicePlan.company_id == company_id,
        ServicePlan.is_active == True
    ).all()
    
    # Get distinct connection types
    connection_types = db.session.query(
        Customer.connection_type
    ).filter(
        Customer.company_id == company_id,
        Customer.connection_type.isnot(None)
    ).distinct().all()
    
    return {
        'areas': [{'id': str(a.id), 'name': a.name} for a in areas],
        'sub_zones': [{'id': str(s.id), 'name': s.name, 'area_id': str(s.area_id)} for s in sub_zones],
        'isps': [{'id': str(i.id), 'name': i.name} for i in isps],
        'service_plans': [{'id': str(p.id), 'name': p.name} for p in plans],
        'connection_types': [t[0] for t in connection_types if t[0]],
        'statuses': ['all', 'active', 'inactive'],
        'compare_options': [
            {'value': 'last_month', 'label': 'vs Last Month'},
            {'value': 'last_quarter', 'label': 'vs Last Quarter'},
            {'value': 'last_year', 'label': 'vs Last Year'}
        ]
    }
