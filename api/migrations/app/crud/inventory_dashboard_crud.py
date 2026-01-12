"""
Inventory Analytics Dashboard CRUD - Enterprise Level Analytics

Provides stock tracking, assignment analytics, turnover metrics,
and period-over-period comparisons.
"""

from app import db
from app.models import (
    InventoryItem, InventoryAssignment, InventoryTransaction,
    Supplier, Customer, User
)
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta
from sqlalchemy import func, case, and_, desc
from sqlalchemy.exc import SQLAlchemyError
from pytz import timezone
import logging

logger = logging.getLogger(__name__)

PKT = timezone('Asia/Karachi')
LOW_STOCK_THRESHOLD = 10


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


def get_inventory_advanced(company_id, filters=None):
    """Main function to fetch all inventory dashboard data."""
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
        item_type = filters.get('item_type') if filters.get('item_type') != 'all' else None
        supplier_id = filters.get('supplier_id') if filters.get('supplier_id') != 'all' else None
        status = filters.get('status') if filters.get('status') != 'all' else None
        
        response = {
            'kpis': get_all_kpis(company_id, start_date, end_date, prev_start, prev_end,
                                item_type, supplier_id),
            'charts': {
                'stock_by_type': get_stock_by_type(company_id, supplier_id),
                'movement_trend': get_movement_trend(company_id, item_type, supplier_id),
                'value_distribution': get_value_distribution(company_id, supplier_id),
                'assignment_status': get_assignment_status(company_id, item_type, supplier_id)
            },
            'tables': {
                'low_stock_items': get_low_stock_items(company_id, supplier_id),
                'recent_transactions': get_recent_transactions(company_id, start_date, end_date, item_type)
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
        logger.error(f"Database error in inventory dashboard: {e}")
        return {'error': 'Database error occurred'}
    except Exception as e:
        logger.error(f"Error in inventory dashboard: {e}")
        return {'error': str(e)}


def get_all_kpis(company_id, start_date, end_date, prev_start, prev_end,
                 item_type=None, supplier_id=None):
    """Calculate all 8 KPIs with trends."""
    
    def build_item_query(base_query):
        q = base_query.join(Supplier, InventoryItem.vendor == Supplier.id).filter(
            Supplier.company_id == company_id,
            InventoryItem.is_active == True
        )
        if item_type:
            q = q.filter(InventoryItem.item_type == item_type)
        if supplier_id:
            q = q.filter(InventoryItem.vendor == supplier_id)
        return q
    
    # === ROW 1: STOCK OVERVIEW ===
    
    # 1. Total Items (count)
    total_items = build_item_query(
        db.session.query(func.sum(InventoryItem.quantity))
    ).scalar() or 0
    
    # 2. Total Value
    total_value = build_item_query(
        db.session.query(func.sum(InventoryItem.quantity * InventoryItem.unit_price))
    ).scalar() or 0
    
    # 3. Items In Stock (not assigned)
    # Get items with active assignments
    assigned_item_ids = db.session.query(InventoryAssignment.inventory_item_id).filter(
        InventoryAssignment.status == 'assigned',
        InventoryAssignment.returned_at.is_(None)
    ).subquery()
    
    in_stock_count = build_item_query(
        db.session.query(func.sum(InventoryItem.quantity))
    ).filter(
        ~InventoryItem.id.in_(db.session.query(assigned_item_ids))
    ).scalar() or 0
    
    # 4. Items Assigned
    assigned_count = db.session.query(func.count(InventoryAssignment.id)).join(
        InventoryItem
    ).join(
        Supplier, InventoryItem.vendor == Supplier.id
    ).filter(
        Supplier.company_id == company_id,
        InventoryAssignment.status == 'assigned',
        InventoryAssignment.returned_at.is_(None)
    )
    if item_type:
        assigned_count = assigned_count.filter(InventoryItem.item_type == item_type)
    assigned_count = assigned_count.scalar() or 0
    
    # === ROW 2: PERFORMANCE ===
    
    # 5. Low Stock Alerts
    low_stock_count = build_item_query(InventoryItem.query).filter(
        InventoryItem.quantity < LOW_STOCK_THRESHOLD
    ).count()
    
    # 6. Turnover Rate (annual)
    annual_assignments = db.session.query(func.count(InventoryTransaction.id)).join(
        InventoryItem
    ).join(
        Supplier, InventoryItem.vendor == Supplier.id
    ).filter(
        Supplier.company_id == company_id,
        InventoryTransaction.transaction_type == 'assignment',
        InventoryTransaction.performed_at >= datetime.now(PKT) - timedelta(days=365)
    ).scalar() or 0
    
    avg_inventory = build_item_query(
        db.session.query(func.avg(InventoryItem.quantity))
    ).scalar() or 1
    
    turnover_rate = annual_assignments / float(avg_inventory) if avg_inventory > 0 else 0
    
    # 7. Avg Assignment Duration (days)
    assignment_durations = db.session.query(
        InventoryAssignment.assigned_at,
        InventoryAssignment.returned_at
    ).join(InventoryItem).join(
        Supplier, InventoryItem.vendor == Supplier.id
    ).filter(
        Supplier.company_id == company_id,
        InventoryAssignment.returned_at.isnot(None)
    ).all()
    
    if assignment_durations:
        total_days = sum(
            (a.returned_at - a.assigned_at).days
            for a in assignment_durations if a.returned_at and a.assigned_at
        )
        avg_duration = total_days / len(assignment_durations)
    else:
        avg_duration = 0
    
    # 8. Returns This Period
    returns_count = db.session.query(func.count(InventoryTransaction.id)).join(
        InventoryItem
    ).join(
        Supplier, InventoryItem.vendor == Supplier.id
    ).filter(
        Supplier.company_id == company_id,
        InventoryTransaction.transaction_type == 'return',
        InventoryTransaction.performed_at >= start_date,
        InventoryTransaction.performed_at <= end_date
    ).scalar() or 0
    
    prev_returns = db.session.query(func.count(InventoryTransaction.id)).join(
        InventoryItem
    ).join(
        Supplier, InventoryItem.vendor == Supplier.id
    ).filter(
        Supplier.company_id == company_id,
        InventoryTransaction.transaction_type == 'return',
        InventoryTransaction.performed_at >= prev_start,
        InventoryTransaction.performed_at <= prev_end
    ).scalar() or 0
    
    return {
        # Row 1
        'total_items': {
            'value': int(total_items),
            'previous': 0,
            'trend': 0,
            'is_positive': True
        },
        'total_value': {
            'value': round(float(total_value), 2),
            'previous': 0,
            'trend': 0,
            'is_positive': True
        },
        'in_stock': {
            'value': int(in_stock_count),
            'previous': 0,
            'trend': 0,
            'is_positive': True
        },
        'assigned': {
            'value': assigned_count,
            'previous': 0,
            'trend': 0,
            'is_positive': True
        },
        # Row 2
        'low_stock': {
            'value': low_stock_count,
            'previous': 0,
            'trend': 0,
            'is_positive': low_stock_count == 0
        },
        'turnover_rate': {
            'value': round(turnover_rate, 2),
            'previous': 0,
            'trend': 0,
            'is_positive': True
        },
        'avg_assignment_days': {
            'value': round(avg_duration, 1),
            'previous': 0,
            'trend': 0,
            'is_positive': True
        },
        'returns': {
            'value': returns_count,
            'previous': prev_returns,
            'trend': calculate_trend(returns_count, prev_returns),
            'is_positive': True
        }
    }


def get_stock_by_type(company_id, supplier_id=None):
    """Get stock quantities by item type."""
    query = db.session.query(
        InventoryItem.item_type,
        func.sum(InventoryItem.quantity).label('quantity')
    ).join(
        Supplier, InventoryItem.vendor == Supplier.id
    ).filter(
        Supplier.company_id == company_id,
        InventoryItem.is_active == True
    )
    
    if supplier_id:
        query = query.filter(InventoryItem.vendor == supplier_id)
    
    results = query.group_by(InventoryItem.item_type).order_by(desc('quantity')).all()
    
    return [{'type': r.item_type or 'Unknown', 'quantity': int(r.quantity)} for r in results]


def get_movement_trend(company_id, item_type=None, supplier_id=None):
    """Get last 6 months movement trend."""
    six_months_ago = datetime.now(PKT) - timedelta(days=180)
    
    query = db.session.query(
        func.date_trunc('month', InventoryTransaction.performed_at).label('month'),
        func.sum(case((InventoryTransaction.transaction_type == 'assignment', 1), else_=0)).label('assignments'),
        func.sum(case((InventoryTransaction.transaction_type == 'return', 1), else_=0)).label('returns')
    ).join(
        InventoryItem
    ).join(
        Supplier, InventoryItem.vendor == Supplier.id
    ).filter(
        Supplier.company_id == company_id,
        InventoryTransaction.performed_at >= six_months_ago
    )
    
    if item_type:
        query = query.filter(InventoryItem.item_type == item_type)
    if supplier_id:
        query = query.filter(InventoryItem.vendor == supplier_id)
    
    results = query.group_by('month').order_by('month').all()
    
    return [
        {
            'month': r.month.strftime('%b') if r.month else 'Unknown',
            'assignments': int(r.assignments),
            'returns': int(r.returns)
        } for r in results
    ]


def get_value_distribution(company_id, supplier_id=None):
    """Get total value distribution by item type."""
    query = db.session.query(
        InventoryItem.item_type,
        func.sum(InventoryItem.quantity * InventoryItem.unit_price).label('value')
    ).join(
        Supplier, InventoryItem.vendor == Supplier.id
    ).filter(
        Supplier.company_id == company_id,
        InventoryItem.is_active == True
    )
    
    if supplier_id:
        query = query.filter(InventoryItem.vendor == supplier_id)
    
    results = query.group_by(InventoryItem.item_type).order_by(desc('value')).all()
    
    return [{'type': r.item_type or 'Unknown', 'value': round(float(r.value or 0), 2)} for r in results]


def get_assignment_status(company_id, item_type=None, supplier_id=None):
    """Get assignment status distribution."""
    # Total in stock
    base_query = db.session.query(func.sum(InventoryItem.quantity)).join(
        Supplier, InventoryItem.vendor == Supplier.id
    ).filter(
        Supplier.company_id == company_id,
        InventoryItem.is_active == True
    )
    if item_type:
        base_query = base_query.filter(InventoryItem.item_type == item_type)
    if supplier_id:
        base_query = base_query.filter(InventoryItem.vendor == supplier_id)
    
    total_qty = base_query.scalar() or 0
    
    # Assigned to customers
    customer_assigned = db.session.query(func.count(InventoryAssignment.id)).join(
        InventoryItem
    ).join(
        Supplier, InventoryItem.vendor == Supplier.id
    ).filter(
        Supplier.company_id == company_id,
        InventoryAssignment.assigned_to_customer_id.isnot(None),
        InventoryAssignment.status == 'assigned',
        InventoryAssignment.returned_at.is_(None)
    )
    if item_type:
        customer_assigned = customer_assigned.filter(InventoryItem.item_type == item_type)
    customer_assigned = customer_assigned.scalar() or 0
    
    # Assigned to employees
    employee_assigned = db.session.query(func.count(InventoryAssignment.id)).join(
        InventoryItem
    ).join(
        Supplier, InventoryItem.vendor == Supplier.id
    ).filter(
        Supplier.company_id == company_id,
        InventoryAssignment.assigned_to_employee_id.isnot(None),
        InventoryAssignment.status == 'assigned',
        InventoryAssignment.returned_at.is_(None)
    )
    if item_type:
        employee_assigned = employee_assigned.filter(InventoryItem.item_type == item_type)
    employee_assigned = employee_assigned.scalar() or 0
    
    available = max(0, int(total_qty) - customer_assigned - employee_assigned)
    
    return [
        {'status': 'Available', 'count': available},
        {'status': 'Customer', 'count': customer_assigned},
        {'status': 'Employee', 'count': employee_assigned}
    ]


def get_low_stock_items(company_id, supplier_id=None, limit=10):
    """Get items with low stock."""
    query = InventoryItem.query.join(
        Supplier, InventoryItem.vendor == Supplier.id
    ).filter(
        Supplier.company_id == company_id,
        InventoryItem.is_active == True,
        InventoryItem.quantity < LOW_STOCK_THRESHOLD
    )
    
    if supplier_id:
        query = query.filter(InventoryItem.vendor == supplier_id)
    
    items = query.order_by(InventoryItem.quantity.asc()).limit(limit).all()
    
    return [
        {
            'id': str(i.id),
            'item_type': i.item_type,
            'quantity': i.quantity,
            'threshold': LOW_STOCK_THRESHOLD,
            'supplier': i.supplier.name if i.supplier else 'Unknown',
            'unit_price': float(i.unit_price or 0)
        } for i in items
    ]


def get_recent_transactions(company_id, start_date, end_date, item_type=None, limit=15):
    """Get recent inventory transactions."""
    query = InventoryTransaction.query.join(
        InventoryItem
    ).join(
        Supplier, InventoryItem.vendor == Supplier.id
    ).join(
        User, InventoryTransaction.performed_by_id == User.id
    ).filter(
        Supplier.company_id == company_id,
        InventoryTransaction.performed_at >= start_date,
        InventoryTransaction.performed_at <= end_date
    )
    
    if item_type:
        query = query.filter(InventoryItem.item_type == item_type)
    
    transactions = query.order_by(InventoryTransaction.performed_at.desc()).limit(limit).all()
    
    return [
        {
            'id': str(t.id),
            'type': t.transaction_type,
            'item_type': t.inventory_item.item_type if t.inventory_item else 'Unknown',
            'quantity': t.quantity,
            'performed_by': f"{t.performed_by.first_name or ''} {t.performed_by.last_name or ''}".strip() if t.performed_by else 'Unknown',
            'performed_at': t.performed_at.isoformat() if t.performed_at else None,
            'notes': t.notes[:50] if t.notes else ''
        } for t in transactions
    ]


def get_filter_options(company_id):
    """Get available filter options."""
    # Item types
    item_types = db.session.query(InventoryItem.item_type).join(
        Supplier, InventoryItem.vendor == Supplier.id
    ).filter(
        Supplier.company_id == company_id,
        InventoryItem.is_active == True
    ).distinct().all()
    
    # Suppliers
    suppliers = Supplier.query.filter(
        Supplier.company_id == company_id,
        Supplier.is_active == True
    ).all()
    
    return {
        'item_types': [t[0] for t in item_types if t[0]],
        'suppliers': [{'id': str(s.id), 'name': s.name} for s in suppliers],
        'statuses': ['in_stock', 'assigned', 'low_stock']
    }
