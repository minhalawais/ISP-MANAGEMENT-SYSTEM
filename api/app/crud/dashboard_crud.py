from app import db
from app.models import Customer, Invoice, Payment, Complaint, InventoryItem, User, ServicePlan, Area, Task, Supplier, InventoryAssignment, InventoryTransaction
from sqlalchemy import func, case
from datetime import datetime, timedelta
from decimal import Decimal
import logging
from pytz import UTC
from sqlalchemy.exc import SQLAlchemyError
from pytz import UTC  # Ensures consistent timezone handling

logger = logging.getLogger(__name__)

def get_executive_summary_data(company_id):
    if not company_id:
        return {'error': 'Invalid company_id. Please provide a valid company ID.'}

    try:
        # Fetch data from the database
        customers = Customer.query.filter_by(company_id=company_id).all()
        invoices = Invoice.query.filter_by(company_id=company_id).all()
        complaints = Complaint.query.join(Customer).filter(Customer.company_id == company_id).all()
        service_plans = ServicePlan.query.filter_by(company_id=company_id).all()

        if not customers:
            print(f"No customers found for company_id {company_id}")
        if not invoices:
            print(f"No invoices found for company_id {company_id}")
        if not complaints:
            print(f"No complaints found for company_id {company_id}")
        if not service_plans:
            print(f"No service plans found for company_id {company_id}")

        # Calculate metrics
        total_active_customers = sum(1 for c in customers if c.is_active)
        monthly_recurring_revenue = sum(float(i.total_amount) for i in invoices if i.invoice_type == 'subscription')
        outstanding_payments = sum(float(i.total_amount) for i in invoices if i.status == 'pending')
        active_complaints = sum(1 for c in complaints if c.status in ['open', 'in_progress'])

        # Generate customer growth data (last 6 months)
        today = datetime.now(UTC)
        customer_growth_data = []
        for i in range(5, -1, -1):
            try:
                month_start = (today.replace(day=1) - timedelta(days=30 * i)).replace(tzinfo=UTC)
                month_end = (month_start + timedelta(days=32)).replace(day=1, tzinfo=UTC) - timedelta(days=1)
                customer_count = sum(1 for c in customers if c.created_at.replace(tzinfo=UTC) <= month_end)
                customer_growth_data.append({
                    'month': month_start.strftime('%b'),
                    'customers': customer_count
                })
            except Exception as e:
                print(f"Error generating growth data for month index {i}: {e}")

        # Generate service plan distribution data
        service_plan_data = []
        for plan in service_plans:
            try:
                count = sum(1 for c in customers if c.service_plan_id == plan.id)
                service_plan_data.append({
                    'name': plan.name,
                    'value': count
                })
            except Exception as e:
                print(f"Error processing service plan {plan.name}: {e}")

        return {
            'total_active_customers': total_active_customers,
            'monthly_recurring_revenue': monthly_recurring_revenue,
            'outstanding_payments': outstanding_payments,
            'active_complaints': active_complaints,
            'customer_growth_data': customer_growth_data,
            'service_plan_data': service_plan_data
        }

    except SQLAlchemyError as db_error:
        print(f"Database error occurred: {db_error}")
        return {
            'error': 'A database error occurred while fetching the executive summary data.'
        }
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        return {
            'error': 'An unexpected error occurred while fetching the executive summary data.'
        }


def get_customer_analytics_data(company_id):
    try:
        today = datetime.now(UTC)
        last_month = today - timedelta(days=30)

        # Ensure valid company_id
        if not company_id:
            raise ValueError("Invalid company_id provided.")

        # Calculate acquisition and churn rates
        total_customers = Customer.query.filter_by(company_id=company_id).count()

        if total_customers == 0:
            return {
                'acquisition_rate': 0,
                'churn_rate': 0,
                'avg_customer_lifetime_value': 0,
                'customer_satisfaction_score': 0,
                'customer_distribution': [],
                'service_plan_distribution': []
            }

        new_customers = Customer.query.filter(
            Customer.company_id == company_id,
            Customer.created_at >= last_month
        ).count()

        churned_customers = Customer.query.filter(
            Customer.company_id == company_id,
            Customer.is_active == False,
            Customer.updated_at >= last_month
        ).count()

        acquisition_rate = (new_customers / total_customers) * 100
        churn_rate = (churned_customers / total_customers) * 100

        # Calculate average customer lifetime value (CLV)
        avg_clv = db.session.query(func.avg(Invoice.total_amount)).filter(
            Invoice.company_id == company_id
        ).scalar() or 0

        # Placeholder for customer satisfaction score
        avg_satisfaction = 4.7

        # Get customer distribution by area
        customer_distribution = db.session.query(
            Area.name, func.count(Customer.id)
        ).join(Customer).filter(
            Customer.company_id == company_id
        ).group_by(Area.name).all()

        # Get service plan distribution
        service_plan_distribution = db.session.query(
            ServicePlan.name, func.count(Customer.id)
        ).join(Customer).filter(
            Customer.company_id == company_id
        ).group_by(ServicePlan.name).all()

        return {
            'acquisition_rate': round(acquisition_rate, 2),
            'churn_rate': round(churn_rate, 2),
            'avg_customer_lifetime_value': round(float(avg_clv), 2),
            'customer_satisfaction_score': avg_satisfaction,
            'customer_distribution': [
                {'area': area, 'customers': count} for area, count in customer_distribution
            ],
            'service_plan_distribution': [
                {'name': name, 'value': count} for name, count in service_plan_distribution
            ]
        }
    except ValueError as ve:
        print(f"Value error in get_customer_analytics_data: {ve}")
        return {'error': str(ve)}
    except SQLAlchemyError as e:
        print(f"Database error in get_customer_analytics_data: {e}")
        return {'error': 'A database error occurred while fetching customer analytics data.'}
    except Exception as e:
        print(f"Unexpected error in get_customer_analytics_data: {e}")
        return {'error': 'An unexpected error occurred while fetching customer analytics data.'}

def get_financial_analytics_data(company_id):
    try:
        today = datetime.now()
        six_months_ago = today - timedelta(days=180)

        # Ensure valid company_id
        if not company_id:
            raise ValueError("Invalid company_id provided.")

        # Calculate monthly revenue for the last 6 months
        monthly_revenue = db.session.query(
            func.date_trunc('month', Invoice.billing_start_date).label('month'),
            func.sum(Invoice.total_amount).label('revenue')
        ).filter(
            Invoice.company_id == company_id,
            Invoice.billing_start_date >= six_months_ago
        ).group_by('month').order_by('month').all()

        # Calculate revenue by service plan
        revenue_by_plan = db.session.query(
            ServicePlan.name,
            func.sum(Invoice.total_amount).label('revenue')
        ).join(Customer, Customer.id == Invoice.customer_id
        ).join(ServicePlan, ServicePlan.id == Customer.service_plan_id
        ).filter(Invoice.company_id == company_id
        ).group_by(ServicePlan.name).all()

        # Calculate total revenue
        total_revenue = db.session.query(func.sum(Invoice.total_amount)).filter(
            Invoice.company_id == company_id
        ).scalar() or Decimal(0)

        # Calculate average revenue per user
        total_customers = Customer.query.filter_by(company_id=company_id).count()
        avg_revenue_per_user = float(total_revenue) / total_customers if total_customers > 0 else 0

        # Calculate operating expenses (placeholder - adjust based on your data model)
        operating_expenses = float(total_revenue) * 0.6

        # Calculate net profit margin
        net_profit = float(total_revenue) - operating_expenses
        net_profit_margin = (net_profit / float(total_revenue)) * 100 if total_revenue > 0 else 0

        return {
            'monthly_revenue': [
                {'month': month.strftime('%b'), 'revenue': float(revenue)}
                for month, revenue in monthly_revenue
            ],
            'revenue_by_plan': [
                {'plan': name, 'revenue': float(revenue)}
                for name, revenue in revenue_by_plan
            ],
            'total_revenue': float(total_revenue),
            'avg_revenue_per_user': round(avg_revenue_per_user, 2),
            'operating_expenses': round(operating_expenses, 2),
            'net_profit_margin': round(net_profit_margin, 2)
        }
    except ValueError as ve:
        print(f"Value error in get_financial_analytics_data: {ve}")
        return {'error': str(ve)}
    except SQLAlchemyError as e:
        print(f"Database error in get_financial_analytics_data: {e}")
        return {'error': 'A database error occurred while fetching financial analytics data.'}
    except Exception as e:
        print(f"Unexpected error in get_financial_analytics_data: {e}")
        return {'error': 'An unexpected error occurred while fetching financial analytics data.'}


def get_service_support_metrics(company_id):
    try:
        # Get complaints for the last 30 days
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        complaints = Complaint.query.join(Customer).filter(
            Customer.company_id == company_id,
            Complaint.created_at >= thirty_days_ago
        ).all()

        # Complaint Status Distribution
        status_counts = db.session.query(
            Complaint.status, func.count(Complaint.id)
        ).join(Customer).filter(
            Customer.company_id == company_id
        ).group_by(Complaint.status).all()

        status_distribution = {status: count for status, count in status_counts}

        # Complaint Categories
        category_counts = db.session.query(
            Complaint.category, func.count(Complaint.id)
        ).join(Customer).filter(
            Customer.company_id == company_id
        ).group_by(Complaint.category).all()

        category_distribution = [{'category': category, 'count': count} for category, count in category_counts]

        # Average Resolution Time (in hours)
        avg_resolution_time = db.session.query(
            func.avg(Complaint.resolved_at - Complaint.created_at)
        ).join(Customer).filter(
            Customer.company_id == company_id,
            Complaint.status == 'resolved'
        ).scalar()
        avg_resolution_time = round(avg_resolution_time.total_seconds() / 3600, 1) if avg_resolution_time else 0

        # Customer Satisfaction Rate
        satisfaction_rate = db.session.query(
            func.avg(Complaint.satisfaction_rating)
        ).join(Customer).filter(
            Customer.company_id == company_id,
            Complaint.satisfaction_rating.isnot(None)
        ).scalar()
        satisfaction_rate = round(satisfaction_rate * 20, 1) if satisfaction_rate else 0  # Assuming rating is 1-5, converting to percentage

        # First Contact Resolution Rate
        fcr_complaints = sum(1 for c in complaints if c.resolution_attempts == 1 and c.status == 'resolved')
        fcr_rate = round((fcr_complaints / len(complaints)) * 100, 1) if complaints else 0

        # Support Ticket Volume (last 30 days)
        ticket_volume = len(complaints)

        # Priority Distribution
        priority_counts = db.session.query(
            Complaint.priority, func.count(Complaint.id)
        ).join(Customer).filter(
            Customer.company_id == company_id
        ).group_by(Complaint.priority).all()

        priority_distribution = [{'priority': priority, 'count': count} for priority, count in priority_counts]

        return {
            'status_distribution': status_distribution,
            'category_distribution': category_distribution,
            'priority_distribution': priority_distribution,
            'average_resolution_time': avg_resolution_time,
            'customer_satisfaction_rate': satisfaction_rate,
            'first_contact_resolution_rate': fcr_rate,
            'support_ticket_volume': ticket_volume
        }
    except Exception as e:
        print(f"Error fetching service support metrics: {e}")
        return {'error': 'An error occurred while fetching service support metrics.'}

def get_stock_level_data(company_id):
    try:
        stock_levels = db.session.query(
            InventoryItem.name,
            func.sum(InventoryItem.quantity)
        ).join(Supplier
        ).filter(Supplier.company_id == company_id
        ).group_by(InventoryItem.name).all()

        data = [{'name': name, 'quantity': int(quantity)} for name, quantity in stock_levels]
        return {'stock_levels': data, 'total_items': sum(item['quantity'] for item in data)}
    except Exception as e:
        print(f"Error fetching stock level data: {e}")
        return {'error': 'An error occurred while fetching stock level data.'}

def get_inventory_movement_data(company_id):
    try:
        six_months_ago = datetime.utcnow() - timedelta(days=180)
        movements = db.session.query(
            func.date_trunc('month', InventoryTransaction.performed_at).label('month'),
            func.sum(case((InventoryTransaction.transaction_type == 'assignment', 1), else_=0)).label('assignments'),
            func.sum(case((InventoryTransaction.transaction_type == 'return', 1), else_=0)).label('returns')
        ).join(InventoryItem
        ).join(Supplier
        ).filter(Supplier.company_id == company_id,
                 InventoryTransaction.performed_at >= six_months_ago
        ).group_by('month'
        ).order_by('month').all()

        data = [
            {
                'month': month.strftime('%b'),
                'assignments': int(assignments),
                'returns': int(returns)
            } for month, assignments, returns in movements
        ]
        total_assignments = sum(item['assignments'] for item in data)
        total_returns = sum(item['returns'] for item in data)

        return {
            'movement_data': data,
            'total_assignments': total_assignments,
            'total_returns': total_returns
        }
    except Exception as e:
        print(f"Error fetching inventory movement data: {e}")
        return {'error': 'An error occurred while fetching inventory movement data.'}


def get_inventory_metrics(company_id):
    try:
        # Calculate total inventory value
        total_value = db.session.query(
            func.sum(InventoryItem.quantity)
        ).join(Supplier
        ).filter(Supplier.company_id == company_id).scalar() or 0

        # Annual assignments
        annual_assignments = db.session.query(
            func.count(InventoryTransaction.id)
        ).join(InventoryItem
        ).join(Supplier
        ).filter(
            Supplier.company_id == company_id,
            InventoryTransaction.transaction_type == 'assignment',
            InventoryTransaction.performed_at >= datetime.utcnow() - timedelta(days=365)
        ).scalar() or 0

        # Average inventory
        average_inventory = db.session.query(
            func.avg(InventoryItem.quantity)
        ).join(Supplier
        ).filter(Supplier.company_id == company_id).scalar() or 1

        # Inventory turnover calculation
        inventory_turnover = annual_assignments / average_inventory if average_inventory > 0 else 0

        # Low stock items
        low_stock_threshold = 10  # Adjustable threshold
        low_stock_items = db.session.query(
            func.count(InventoryItem.id)
        ).join(Supplier
        ).filter(
            Supplier.company_id == company_id,
            InventoryItem.quantity < low_stock_threshold
        ).scalar() or 0

        # Average assignment duration
        avg_assignment_duration = db.session.query(
            func.avg(InventoryAssignment.returned_at - InventoryAssignment.assigned_at)
        ).join(InventoryItem
        ).join(Supplier
        ).filter(
            Supplier.company_id == company_id,
            InventoryAssignment.returned_at.isnot(None)
        ).scalar()

        avg_assignment_duration = (
            round(avg_assignment_duration.days) if avg_assignment_duration else 0
        )

        return {
            'total_inventory_value': round(float(total_value), 2),
            'inventory_turnover_rate': round(inventory_turnover, 2),
            'low_stock_items': int(low_stock_items),
            'avg_assignment_duration': avg_assignment_duration
        }
    except Exception as e:
        print(f"Error fetching inventory metrics: {e}")
        return {'error': 'An error occurred while fetching inventory metrics.'}

def get_inventory_management_data(company_id):
    try:
        return {
            'stock_level_data': get_stock_level_data(company_id),
            'inventory_movement_data': get_inventory_movement_data(company_id),
            'inventory_metrics': get_inventory_metrics(company_id)
        }
    except Exception as e:
        print(f"Error fetching inventory management data: {e}")
        return {'error': 'An error occurred while fetching inventory management data.'}

def get_employee_analytics_data(company_id):
    try:
        # Get performance data
        performance_data = db.session.query(
            User.first_name,
            User.last_name,
            func.count(Task.id).label('tasks_completed'),
            func.avg(Complaint.satisfaction_rating).label('avg_satisfaction')
        ).outerjoin(Task, (
            User.id == Task.assigned_to) &
            (Task.status == 'completed') &
            (Task.company_id == company_id)
        ).outerjoin(Complaint, User.id == Complaint.assigned_to
        ).outerjoin(Customer, Complaint.customer_id == Customer.id
        ).filter(
            User.company_id == company_id,
            Customer.company_id == company_id
        ).group_by(User.id
        ).order_by(func.count(Task.id).desc()
        ).limit(5).all()

        # Get productivity trend data
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=180)
        productivity_data = db.session.query(
            func.date_trunc('month', Task.updated_at).label('month'),
            func.count(Task.id).label('tasks_completed')
        ).filter(
            Task.company_id == company_id,
            Task.status == 'completed',
            Task.updated_at.between(start_date, end_date)
        ).group_by('month'
        ).order_by('month').all()

        # Calculate metrics
        total_employees = User.query.filter_by(company_id=company_id).count()
        total_tasks = Task.query.filter_by(company_id=company_id, status='completed').count()
        avg_tasks = total_tasks / total_employees if total_employees > 0 else 0
        avg_satisfaction = db.session.query(
            func.avg(Complaint.satisfaction_rating)
        ).join(Customer).filter(
            Customer.company_id == company_id
        ).scalar() or 0

        top_performer = (
            max(performance_data, key=lambda x: x.tasks_completed) if performance_data else None
        )

        training_completion_rate = 92  # Placeholder value; replace with actual calculation

        return {
            'performanceData': [
                {
                    'employee': f"{p.first_name} {p.last_name}",
                    'tasks': p.tasks_completed,
                    'satisfaction': round(p.avg_satisfaction or 0, 1)
                } for p in performance_data
            ],
            'productivityTrendData': [
                {
                    'month': p.month.strftime('%b'),
                    'productivity': p.tasks_completed
                } for p in productivity_data
            ],
            'metrics': {
                'avgTasksCompleted': round(avg_tasks, 1),
                'avgSatisfactionScore': round(avg_satisfaction, 1),
                'topPerformer': (
                    f"{top_performer.first_name} {top_performer.last_name}"
                    if top_performer else "N/A"
                ),
                'trainingCompletionRate': training_completion_rate
            }
        }
    except Exception as e:
        print(f"Error fetching employee analytics data: {e}")
        return {'error': 'An error occurred while fetching employee analytics data.'}

def get_area_analytics_data(company_id):
    try:
        # Get area performance data
        area_performance = db.session.query(
            Area.name.label('area'),
            func.count(Customer.id).label('customers'),
            func.sum(Invoice.total_amount).label('revenue')
        ).join(Customer, Customer.area_id == Area.id
        ).outerjoin(Invoice, Invoice.customer_id == Customer.id
        ).filter(Area.company_id == company_id
        ).group_by(Area.name).all()

        # Get service plan distribution data
        service_plan_distribution = db.session.query(
            ServicePlan.name,
            func.count(Customer.id).label('value')
        ).join(Customer
        ).filter(ServicePlan.company_id == company_id
        ).group_by(ServicePlan.name).all()

        # Calculate metrics
        total_customers = sum(area.customers or 0 for area in area_performance)
        total_revenue = sum(area.revenue or 0 for area in area_performance)
        best_performing_area = max(area_performance, key=lambda x: x.revenue or 0, default=None)
        avg_revenue_per_customer = total_revenue / total_customers if total_customers > 0 else 0

        return {
            'areaPerformanceData': [
                {
                    'area': area.area,
                    'customers': area.customers or 0,
                    'revenue': float(area.revenue or 0)
                } for area in area_performance
            ],
            'servicePlanDistributionData': [
                {
                    'name': plan.name,
                    'value': plan.value or 0
                } for plan in service_plan_distribution
            ],
            'metrics': {
                'totalCustomers': total_customers,
                'totalRevenue': float(total_revenue),
                'bestPerformingArea': best_performing_area.area if best_performing_area else None,
                'avgRevenuePerCustomer': float(avg_revenue_per_customer)
            }
        }
    except Exception as e:
        print(f"Error fetching area analytics data: {e}")
        return {'error': 'An error occurred while fetching area analytics data.'}

def get_service_plan_analytics_data(company_id):
    try:
        # Get service plan performance data
        service_plan_performance = db.session.query(
            ServicePlan.name.label('plan'),
            func.count(Customer.id).label('subscribers'),
            func.sum(ServicePlan.price).label('revenue')
        ).join(Customer, Customer.service_plan_id == ServicePlan.id
        ).filter(ServicePlan.company_id == company_id
        ).group_by(ServicePlan.name).all()

        # Get plan adoption trend data (last 6 months)
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=180)
        plan_adoption_trend = db.session.query(
            func.date_trunc('month', Customer.created_at).label('month'),
            ServicePlan.name,
            func.count(Customer.id).label('subscribers')
        ).join(ServicePlan, Customer.service_plan_id == ServicePlan.id
        ).filter(ServicePlan.company_id == company_id,
                 Customer.created_at.between(start_date, end_date)
        ).group_by('month', ServicePlan.name
        ).order_by('month').all()

        # Process plan adoption trend data
        trend_data = {}
        for month, plan, subscribers in plan_adoption_trend:
            month_str = month.strftime('%b')
            if month_str not in trend_data:
                trend_data[month_str] = {'month': month_str}
            trend_data[month_str][plan] = subscribers or 0

        # Calculate metrics
        total_subscribers = sum(plan.subscribers or 0 for plan in service_plan_performance)
        total_revenue = sum(plan.revenue or 0 for plan in service_plan_performance)
        most_popular_plan = max(service_plan_performance, key=lambda x: x.subscribers or 0, default=None)
        highest_revenue_plan = max(service_plan_performance, key=lambda x: x.revenue or 0, default=None)

        return {
            'servicePlanPerformanceData': [
                {
                    'plan': plan.plan,
                    'subscribers': plan.subscribers or 0,
                    'revenue': float(plan.revenue or 0)
                } for plan in service_plan_performance
            ],
            'planAdoptionTrendData': list(trend_data.values()),
            'metrics': {
                'totalSubscribers': total_subscribers,
                'totalRevenue': float(total_revenue),
                'mostPopularPlan': most_popular_plan.plan if most_popular_plan else None,
                'highestRevenuePlan': highest_revenue_plan.plan if highest_revenue_plan else None
            }
        }
    except Exception as e:
        print(f"Error fetching service plan analytics data: {e}")
        return {'error': 'An error occurred while fetching service plan analytics data.'}

def get_recovery_collections_data(company_id):
    try:
        # Get recovery performance data for the last 6 months
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=180)
        recovery_performance = db.session.query(
            func.date_trunc('month', Payment.payment_date).label('month'),
            func.sum(Payment.amount).label('recovered'),
            func.sum(Invoice.total_amount).label('total_amount')
        ).join(Invoice, Payment.invoice_id == Invoice.id
        ).filter(Payment.company_id == company_id,
                 Payment.payment_date.between(start_date, end_date)
        ).group_by('month'
        ).order_by('month').all()

        # Get outstanding by age data
        current_date = datetime.utcnow().date()
        outstanding_subquery = db.session.query(
            Invoice.id,
            Invoice.total_amount,
            func.coalesce(func.sum(Payment.amount), 0).label('paid_amount'),
            case(
                (Invoice.due_date > current_date, '0-30 days'),
                (Invoice.due_date <= current_date - timedelta(days=30), '31-60 days'),
                (Invoice.due_date <= current_date - timedelta(days=60), '61-90 days'),
                else_='90+ days'
            ).label('age_group')
        ).outerjoin(Payment, Invoice.id == Payment.invoice_id
        ).filter(Invoice.company_id == company_id, Invoice.status != 'paid'
        ).group_by(Invoice.id, Invoice.total_amount, Invoice.due_date
        ).subquery()

        outstanding_by_age = db.session.query(
            outstanding_subquery.c.age_group,
            func.sum(outstanding_subquery.c.total_amount - outstanding_subquery.c.paid_amount).label('outstanding')
        ).group_by(outstanding_subquery.c.age_group).all()

        # Calculate metrics
        total_payments_subquery = db.session.query(
            Payment.invoice_id,
            func.coalesce(func.sum(Payment.amount), 0).label('total_payments')
        ).group_by(Payment.invoice_id).subquery()

        total_outstanding = db.session.query(
            func.sum(Invoice.total_amount - total_payments_subquery.c.total_payments)
        ).outerjoin(total_payments_subquery, Invoice.id == total_payments_subquery.c.invoice_id
        ).filter(Invoice.company_id == company_id, Invoice.status != 'paid').scalar() or 0

        total_recovered = db.session.query(func.sum(Payment.amount)
        ).filter(Payment.company_id == company_id).scalar() or 0

        total_invoiced = total_recovered + total_outstanding
        recovery_rate = (total_recovered / total_invoiced * 100) if total_invoiced > 0 else 0

        avg_collection_time_result = db.session.query(func.avg(Payment.payment_date - Invoice.due_date)
        ).join(Invoice, Payment.invoice_id == Invoice.id
        ).filter(Payment.company_id == company_id).scalar()

        if isinstance(avg_collection_time_result, Decimal):
            avg_collection_time = round(float(avg_collection_time_result))
        elif isinstance(avg_collection_time_result, timedelta):
            avg_collection_time = round(avg_collection_time_result.days)
        else:
            avg_collection_time = 0

        return {
            'recoveryPerformanceData': [
                {
                    'month': month.strftime('%b'),
                    'recovered': float(recovered or 0),
                    'outstanding': float((total_amount or 0) - (recovered or 0))
                } for month, recovered, total_amount in recovery_performance
            ],
            'outstandingByAgeData': [
                {
                    'name': age_group,
                    'value': float(outstanding or 0)
                } for age_group, outstanding in outstanding_by_age
            ],
            'metrics': {
                'totalRecovered': float(total_recovered),
                'totalOutstanding': float(total_outstanding),
                'recoveryRate': float(recovery_rate),
                'avgCollectionTime': avg_collection_time
            }
        }
    except Exception as e:
        print(f"Error fetching recovery and collections data: {str(e)}")
        return {'error': 'An error occurred while fetching recovery and collections data.'}
