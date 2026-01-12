from app import db
from app.models import Customer, Invoice, Payment, ISPPayment, Complaint, InventoryItem, User, BankAccount, ServicePlan, Area, Task, Supplier, InventoryAssignment, InventoryTransaction, Expense, ExtraIncome, CustomerPackage, InternalTransfer, InvoiceLineItem, ExpenseType
from sqlalchemy import func, case, desc
from datetime import datetime, timedelta
from decimal import Decimal
import logging
from pytz import UTC
from sqlalchemy.exc import SQLAlchemyError
from pytz import UTC  # Ensures consistent timezone handling
import uuid
from sqlalchemy.dialects.postgresql import UUID

logger = logging.getLogger(__name__)

def _signed_payment_amount():
    # Refund invoices should subtract from collections
    return case((Invoice.invoice_type == 'refund', -Payment.amount), else_=Payment.amount)

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

        # Generate service plan distribution data using CustomerPackage table
        service_plan_data = []
        for plan in service_plans:
            try:
                # Count customers linked to this plan via CustomerPackage
                count = CustomerPackage.query.filter(
                    CustomerPackage.service_plan_id == plan.id,
                    CustomerPackage.is_active == True
                ).join(Customer, Customer.id == CustomerPackage.customer_id
                ).filter(Customer.company_id == company_id).count()
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
        ).select_from(Customer).join(
            Area, Customer.area_id == Area.id
        ).filter(
            Customer.company_id == company_id
        ).group_by(Area.name).all()

        # Get service plan distribution
        service_plan_distribution = db.session.query(
            ServicePlan.name, func.count(CustomerPackage.customer_id)
        ).select_from(CustomerPackage).join(
            ServicePlan, CustomerPackage.service_plan_id == ServicePlan.id
        ).join(
            Customer, CustomerPackage.customer_id == Customer.id
        ).filter(
            Customer.company_id == company_id,
            CustomerPackage.is_active == True
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

        # Calculate revenue by service plan (via CustomerPackage)
        revenue_by_plan = db.session.query(
            ServicePlan.name,
            func.sum(Invoice.total_amount).label('revenue')
        ).join(Customer, Customer.id == Invoice.customer_id
        ).join(CustomerPackage, CustomerPackage.customer_id == Customer.id
        ).join(ServicePlan, ServicePlan.id == CustomerPackage.service_plan_id
        ).filter(
            Invoice.company_id == company_id,
            CustomerPackage.is_active == True
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

        # Remarks Summary (last 5 non-empty remarks)
        remarks_summary = db.session.query(Complaint.remarks).join(Customer).filter(
            Customer.company_id == company_id,
            Complaint.remarks != None,
            Complaint.remarks != ''
        ).order_by(Complaint.created_at.desc()).limit(5).all()
        remarks_summary = [remark[0] for remark in remarks_summary]

        return {
            'status_distribution': status_distribution,
            'average_resolution_time': avg_resolution_time,
            'customer_satisfaction_rate': satisfaction_rate,
            'first_contact_resolution_rate': fcr_rate,
            'support_ticket_volume': ticket_volume,
            'remarks_summary': remarks_summary
        }
    except Exception as e:
        print(f"Error fetching service support metrics: {e}")
        return {'error': 'An error occurred while fetching service support metrics.'}

def get_stock_level_data(company_id):
    try:
        # Query inventory items grouped by item_type instead of name
        stock_levels = db.session.query(
            InventoryItem.item_type,  # Using item_type instead of name
            func.sum(InventoryItem.quantity)
        ).join(Supplier
        ).filter(Supplier.company_id == company_id
        ).group_by(InventoryItem.item_type).all()

        data = [{'name': item_type, 'quantity': int(quantity)} for item_type, quantity in stock_levels]
        return {'stock_levels': data, 'total_items': sum(item['quantity'] for item in data)}
    except Exception as e:
        print(f"Error fetching stock level data: {e}")
        return {'error': 'An occurred while fetching stock level data.'}
    
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
        return {
            'movement_data': data,
            'total_assignments': sum(item['assignments'] for item in data),
            'total_returns': sum(item['returns'] for item in data)
        }
    except Exception as e:
        print(f"Error fetching inventory movement data: {e}")
        return {'error': 'An error occurred while fetching inventory movement data.'}

def get_inventory_metrics(company_id):
    try:
        # Calculate total inventory value
        total_value = db.session.query(
            func.sum(InventoryItem.quantity * InventoryItem.unit_price)
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
        # Get service plan performance data (via CustomerPackage)
        service_plan_performance = db.session.query(
            ServicePlan.name.label('plan'),
            func.count(func.distinct(CustomerPackage.customer_id)).label('subscribers'),
            func.sum(ServicePlan.price).label('revenue')
        ).join(CustomerPackage, CustomerPackage.service_plan_id == ServicePlan.id
        ).join(Customer, Customer.id == CustomerPackage.customer_id
        ).filter(
            ServicePlan.company_id == company_id,
            CustomerPackage.is_active == True
        ).group_by(ServicePlan.name).all()

        # Get plan adoption trend data (last 6 months via CustomerPackage)
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=180)
        plan_adoption_trend = db.session.query(
            func.date_trunc('month', CustomerPackage.created_at).label('month'),
            ServicePlan.name,
            func.count(func.distinct(CustomerPackage.customer_id)).label('subscribers')
        ).join(ServicePlan, CustomerPackage.service_plan_id == ServicePlan.id
        ).join(Customer, Customer.id == CustomerPackage.customer_id
        ).filter(
            ServicePlan.company_id == company_id,
            CustomerPackage.created_at.between(start_date, end_date)
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

        total_recovered = db.session.query(func.sum(_signed_payment_amount())
        ).join(Invoice, Payment.invoice_id == Invoice.id
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

        # Get daily recovery trend (last 30 days)
        thirty_days_ago = end_date - timedelta(days=30)
        daily_recovery = db.session.query(
            func.date(Payment.payment_date).label('date'),
            func.sum(Payment.amount).label('recovered')
        ).filter(
            Payment.company_id == company_id,
            Payment.payment_date >= thirty_days_ago
        ).group_by('date').order_by('date').all()

        return {
            'recoveryPerformanceData': [
                {
                    'month': month.strftime('%b'),
                    'recovered': float(recovered or 0),
                    'outstanding': float((total_amount or 0) - (recovered or 0))
                } for month, recovered, total_amount in recovery_performance
            ],
            'dailyRecoveryTrend': [
                {
                    'date': date.strftime('%Y-%m-%d'),
                    'recovered': float(recovered or 0)
                } for date, recovered in daily_recovery
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


def get_bank_account_analytics_data(company_id, filters=None):
    try:
        if filters is None:
            filters = {}
        
        # Base query
        query = db.session.query(
            Payment,
            BankAccount,
            Invoice,
            Customer
        ).join(BankAccount, Payment.bank_account_id == BankAccount.id
        ).join(Invoice, Payment.invoice_id == Invoice.id
        ).join(Customer, Invoice.customer_id == Customer.id
        ).filter(
            Payment.company_id == company_id,
            Payment.status == 'paid'  # CRITICAL: Only count verified/paid payments
        )
        
        # Apply filters
        if filters.get('start_date'):
            query = query.filter(Payment.payment_date >= filters['start_date'])
        if filters.get('end_date'):
            query = query.filter(Payment.payment_date <= filters['end_date'])
        if filters.get('bank_account_id') and filters['bank_account_id'] != 'all':
            query = query.filter(Payment.bank_account_id == uuid.UUID(filters['bank_account_id']))
        if filters.get('payment_method') and filters['payment_method'] != 'all':
            query = query.filter(Payment.payment_method == filters['payment_method'])
        
        payments_data = query.all()
        
        if not payments_data:
            return {
                'total_payments': 0,
                'payment_trends': [],
                'account_performance': [],
                'payment_method_distribution': [],
                'top_customers': [],
                'cash_flow_trends': [],
                'collection_metrics': [],
                'transaction_metrics': [],
                'bank_accounts': []
            }
        
        # Get all bank accounts for the company
        bank_accounts = BankAccount.query.filter_by(company_id=company_id, is_active=True).all()
        
        # 1. Total Payments Received (per bank account, per month, per year)
        monthly_payments = db.session.query(
            BankAccount.bank_name,
            BankAccount.account_number,
            func.date_trunc('month', Payment.payment_date).label('month'),
            func.coalesce(func.sum(_signed_payment_amount()), 0).label('total_amount')
        ).join(Payment, BankAccount.id == Payment.bank_account_id
        ).join(Invoice, Payment.invoice_id == Invoice.id
        ).filter(
            Payment.company_id == company_id,
            Payment.status == 'paid'  # CRITICAL: Only count verified/paid payments
        )
        
        if filters.get('start_date'):
            monthly_payments = monthly_payments.filter(Payment.payment_date >= filters['start_date'])
        if filters.get('end_date'):
            monthly_payments = monthly_payments.filter(Payment.payment_date <= filters['end_date'])
        
        monthly_payments = monthly_payments.group_by(
            BankAccount.bank_name, BankAccount.account_number, 'month'
        ).order_by('month').all()
        
        payment_trends = []
        for bank_name, account_number, month, amount in monthly_payments:
            payment_trends.append({
                'bank_account': f"{bank_name} - {account_number}",
                'month': month.strftime('%Y-%m'),
                'amount': float(amount or 0)
            })
        
        # 2. Outstanding Invoices vs Collected Payments
        outstanding_vs_collected = db.session.query(
            BankAccount.bank_name,
            BankAccount.account_number,
            func.sum(case((Invoice.status == 'paid', Invoice.total_amount), else_=0)).label('collected'),
            func.sum(case((Invoice.status != 'paid', Invoice.total_amount), else_=0)).label('outstanding')
        ).outerjoin(Payment, BankAccount.id == Payment.bank_account_id
        ).join(Invoice, Payment.invoice_id == Invoice.id
        ).filter(BankAccount.company_id == company_id
        ).group_by(BankAccount.bank_name, BankAccount.account_number).all()
        
        account_performance = []
        for bank_name, account_number, collected, outstanding in outstanding_vs_collected:
            account_performance.append({
                'bank_account': f"{bank_name} - {account_number}",
                'collected': float(collected or 0),
                'outstanding': float(outstanding or 0)
            })
        
        # 3. Top Paying Customers per bank account
        top_customers = db.session.query(
            BankAccount.bank_name,
            BankAccount.account_number,
            Customer.first_name,
            Customer.last_name,
            func.coalesce(func.sum(_signed_payment_amount()), 0).label('total_paid')
        ).join(Payment, BankAccount.id == Payment.bank_account_id
        ).join(Invoice, Payment.invoice_id == Invoice.id
        ).join(Customer, Invoice.customer_id == Customer.id
        ).filter(
            Payment.company_id == company_id,
            Payment.status == 'paid'  # CRITICAL: Only count verified/paid payments
        )
        
        if filters.get('start_date'):
            top_customers = top_customers.filter(Payment.payment_date >= filters['start_date'])
        if filters.get('end_date'):
            top_customers = top_customers.filter(Payment.payment_date <= filters['end_date'])
        
        top_customers = top_customers.group_by(
            BankAccount.bank_name, BankAccount.account_number, Customer.first_name, Customer.last_name
        ).order_by(func.sum(_signed_payment_amount()).desc()).limit(10).all()
        
        top_customers_data = []
        for bank_name, account_number, first_name, last_name, total_paid in top_customers:
            top_customers_data.append({
                'bank_account': f"{bank_name} - {account_number}",
                'customer_name': f"{first_name} {last_name}",
                'total_paid': float(total_paid or 0)
            })
        
        # 4. Average Transaction Value (per bank account)
        avg_transaction = db.session.query(
            BankAccount.bank_name,
            BankAccount.account_number,
            func.avg(_signed_payment_amount()).label('avg_amount'),
            func.count(Payment.id).label('transaction_count')
        ).join(Payment, BankAccount.id == Payment.bank_account_id
        ).join(Invoice, Payment.invoice_id == Invoice.id
        ).filter(
            Payment.company_id == company_id,
            Payment.status == 'paid'  # CRITICAL: Only count verified/paid payments
        )
        
        if filters.get('start_date'):
            avg_transaction = avg_transaction.filter(Payment.payment_date >= filters['start_date'])
        if filters.get('end_date'):
            avg_transaction = avg_transaction.filter(Payment.payment_date <= filters['end_date'])
        
        avg_transaction = avg_transaction.group_by(
            BankAccount.bank_name, BankAccount.account_number
        ).all()
        
        transaction_metrics = []
        for bank_name, account_number, avg_amount, count in avg_transaction:
            transaction_metrics.append({
                'bank_account': f"{bank_name} - {account_number}",
                'avg_transaction_value': float(avg_amount or 0),
                'transaction_count': count or 0
            })
        
        # 5. Payment Method Distribution
        payment_method_dist = db.session.query(
            Payment.payment_method,
            func.count(Payment.id).label('count'),
            func.coalesce(func.sum(_signed_payment_amount()), 0).label('amount')
        ).join(Invoice, Payment.invoice_id == Invoice.id
        ).filter(Payment.company_id == company_id)
        
        if filters.get('start_date'):
            payment_method_dist = payment_method_dist.filter(Payment.payment_date >= filters['start_date'])
        if filters.get('end_date'):
            payment_method_dist = payment_method_dist.filter(Payment.payment_date <= filters['end_date'])
        
        payment_method_dist = payment_method_dist.group_by(Payment.payment_method).all()
        
        payment_method_data = []
        for method, count, amount in payment_method_dist:
            payment_method_data.append({
                'method': method or 'Unknown',
                'count': count or 0,
                'amount': float(amount or 0)
            })
        
        # 6. Cash Flow Trends
        cash_flow_trends = db.session.query(
            BankAccount.bank_name,
            BankAccount.account_number,
            func.date_trunc('month', Payment.payment_date).label('month'),
            func.coalesce(func.sum(_signed_payment_amount()), 0).label('amount')
        ).join(Payment, BankAccount.id == Payment.bank_account_id
        ).join(Invoice, Payment.invoice_id == Invoice.id
        ).filter(Payment.company_id == company_id)
        
        if filters.get('start_date'):
            cash_flow_trends = cash_flow_trends.filter(Payment.payment_date >= filters['start_date'])
        if filters.get('end_date'):
            cash_flow_trends = cash_flow_trends.filter(Payment.payment_date <= filters['end_date'])
        
        cash_flow_trends = cash_flow_trends.group_by(
            BankAccount.bank_name, BankAccount.account_number, 'month'
        ).order_by('month').all()
        
        cash_flow_data = []
        for bank_name, account_number, month, amount in cash_flow_trends:
            cash_flow_data.append({
                'bank_account': f"{bank_name} - {account_number}",
                'month': month.strftime('%Y-%m'),
                'amount': float(amount or 0)
            })
        
        # 7. Collection Metrics
        total_company_revenue = db.session.query(func.sum(_signed_payment_amount())).filter(
            Payment.company_id == company_id
        ).scalar() or 1  # Avoid division by zero
        
        collection_metrics = []
        for bank_account in bank_accounts:
            account_revenue = db.session.query(func.sum(_signed_payment_amount())).filter(
                Payment.bank_account_id == bank_account.id,
                Payment.company_id == company_id
            ).scalar() or 0
            
            collection_ratio = (float(account_revenue) / float(total_company_revenue)) * 100
            
            collection_metrics.append({
                'bank_account': f"{bank_account.bank_name} - {bank_account.account_number}",
                'collection_ratio': round(collection_ratio, 2),
                'total_collected': float(account_revenue)
            })
        
        return {
            'total_payments': len(payments_data) if payments_data else 0,
            'payment_trends': payment_trends if payment_trends else [],
            'account_performance': account_performance if account_performance else [],
            'payment_method_distribution': payment_method_data if payment_method_data else [],
            'top_customers': top_customers_data if top_customers_data else [],
            'cash_flow_trends': cash_flow_data if cash_flow_data else [],
            'collection_metrics': collection_metrics if collection_metrics else [],
            'transaction_metrics': transaction_metrics if transaction_metrics else [],
            'bank_accounts': [
                {
                    'id': str(acc.id),
                    'name': f"{acc.bank_name} - {acc.account_number}"
                }
                for acc in bank_accounts
            ] if bank_accounts else []
        }
        
    except Exception as e:
        print(f"Error fetching bank account analytics data: {str(e)}")
        # Return empty structure on error
        return {
            'total_payments': 0,
            'payment_trends': [],
            'account_performance': [],
            'payment_method_distribution': [],
            'top_customers': [],
            'cash_flow_trends': [],
            'collection_metrics': [],
            'transaction_metrics': [],
            'bank_accounts': [],
            'error': 'An error occurred while fetching bank account analytics data.'
        }

# In get_unified_financial_data function, add initial balance calculations:

def get_profitability_data(company_id, start_date=None, end_date=None):
    try:
        # Month trunction for grouping
        month_trunc = func.date_trunc('month', Invoice.billing_start_date).label('month')
        
        # 1. Potential Revenue (Invoiced)
        invoiced_query = db.session.query(
            month_trunc,
            func.sum(Invoice.total_amount).label('invoiced')
        ).filter(
            Invoice.company_id == company_id,
            Invoice.is_active == True,
            Invoice.invoice_type != 'refund'  # Exclude refunds from potential revenue
        )
        if start_date:
            invoiced_query = invoiced_query.filter(Invoice.billing_start_date >= start_date)
        if end_date:
            invoiced_query = invoiced_query.filter(Invoice.billing_start_date <= end_date)
        invoiced_data = invoiced_query.group_by(month_trunc).all()
        invoiced_dict = {r.month.strftime('%Y-%m'): float(r.invoiced or 0) for r in invoiced_data}

        # 2. Realized Revenue (Collections + Extra Income)
        # Collections
        collections_query = db.session.query(
            func.date_trunc('month', Payment.payment_date).label('month'),
            func.sum(_signed_payment_amount()).label('collections')
        ).join(Invoice, Payment.invoice_id == Invoice.id).filter(
            Payment.company_id == company_id,
            Payment.is_active == True,
            Payment.status == 'paid'
        )
        if start_date:
            collections_query = collections_query.filter(Payment.payment_date >= start_date)
        if end_date:
            collections_query = collections_query.filter(Payment.payment_date <= end_date)
        collections_data = collections_query.group_by('month').all()
        collections_dict = {r.month.strftime('%Y-%m'): float(r.collections or 0) for r in collections_data}

        # Extra Income
        extra_query = db.session.query(
            func.date_trunc('month', ExtraIncome.income_date).label('month'),
            func.sum(ExtraIncome.amount).label('extra')
        ).filter(
            ExtraIncome.company_id == company_id,
            ExtraIncome.is_active == True
        )
        if start_date:
            extra_query = extra_query.filter(ExtraIncome.income_date >= start_date)
        if end_date:
            extra_query = extra_query.filter(ExtraIncome.income_date <= end_date)
        extra_data = extra_query.group_by('month').all()
        extra_dict = {r.month.strftime('%Y-%m'): float(r.extra or 0) for r in extra_data}

        # 3. Total Expenses (ISP + Business)
        # Business Expenses
        expense_query = db.session.query(
            func.date_trunc('month', Expense.expense_date).label('month'),
            func.sum(Expense.amount).label('expenses')
        ).filter(
            Expense.company_id == company_id,
            Expense.is_active == True
        )
        if start_date:
            expense_query = expense_query.filter(Expense.expense_date >= start_date)
        if end_date:
            expense_query = expense_query.filter(Expense.expense_date <= end_date)
        expense_data = expense_query.group_by('month').all()
        expense_dict = {r.month.strftime('%Y-%m'): float(r.expenses or 0) for r in expense_data}

        # ISP Payments
        isp_query = db.session.query(
            func.date_trunc('month', ISPPayment.payment_date).label('month'),
            func.sum(ISPPayment.amount).label('isp_payments')
        ).filter(
            ISPPayment.company_id == company_id,
            ISPPayment.is_active == True
        )
        if start_date:
            isp_query = isp_query.filter(ISPPayment.payment_date >= start_date)
        if end_date:
            isp_query = isp_query.filter(ISPPayment.payment_date <= end_date)
        isp_data = isp_query.group_by('month').all()
        isp_dict = {r.month.strftime('%Y-%m'): float(r.isp_payments or 0) for r in isp_data}

        # Combine
        all_months = sorted(set(list(invoiced_dict.keys()) + list(collections_dict.keys())))
        
        monthly_data = []
        total_leakage = 0
        total_potential = 0
        total_realized = 0

        for month in all_months:
            invoiced = invoiced_dict.get(month, 0)
            collected = collections_dict.get(month, 0)
            extra = extra_dict.get(month, 0)
            expenses = expense_dict.get(month, 0) + isp_dict.get(month, 0)

            potential_profit = invoiced + extra - expenses
            realized_profit = collected + extra - expenses
            leakage = potential_profit - realized_profit

            monthly_data.append({
                'month': month,
                'potential_profit': potential_profit,
                'realized_profit': realized_profit,
                'leakage': leakage
            })
            
            total_potential += potential_profit
            total_realized += realized_profit
            total_leakage += leakage

        return {
            'monthly_trends': monthly_data,
            'total_potential_profit': total_potential,
            'total_realized_profit': total_realized,
            'total_leakage': total_leakage
        }

    except Exception as e:
        logger.error(f"Error calculating profitability data: {str(e)}")
        return {}



def get_financial_waterfall_data(company_id, start_date=None, end_date=None):
    try:
        # 1. Total Invoiced (Potential Revenue)
        invoiced_query = db.session.query(func.sum(Invoice.total_amount)).filter(
            Invoice.company_id == company_id,
            Invoice.is_active == True,
            Invoice.invoice_type != 'refund'
        )
        if start_date:
            invoiced_query = invoiced_query.filter(Invoice.billing_start_date >= start_date)
        if end_date:
            invoiced_query = invoiced_query.filter(Invoice.billing_start_date <= end_date)
        total_invoiced = float(invoiced_query.scalar() or 0)

        # 2. Total Collected
        collections_query = db.session.query(func.sum(_signed_payment_amount())).join(Invoice, Payment.invoice_id == Invoice.id).filter(
            Payment.company_id == company_id,
            Payment.is_active == True,
            Payment.status == 'paid'
        )
        if start_date:
            collections_query = collections_query.filter(Payment.payment_date >= start_date)
        if end_date:
            collections_query = collections_query.filter(Payment.payment_date <= end_date)
        total_collected = float(collections_query.scalar() or 0)

        # 3. Extra Income
        extra_query = db.session.query(func.sum(ExtraIncome.amount)).filter(
            ExtraIncome.company_id == company_id,
            ExtraIncome.is_active == True
        )
        if start_date:
            extra_query = extra_query.filter(ExtraIncome.income_date >= start_date)
        if end_date:
            extra_query = extra_query.filter(ExtraIncome.income_date <= end_date)
        total_extra = float(extra_query.scalar() or 0)

        # 4. ISP Direct Costs (Bandwidth etc)
        isp_query = db.session.query(func.sum(ISPPayment.amount)).filter(
            ISPPayment.company_id == company_id,
            ISPPayment.is_active == True
        )
        if start_date:
            isp_query = isp_query.filter(ISPPayment.payment_date >= start_date)
        if end_date:
            isp_query = isp_query.filter(ISPPayment.payment_date <= end_date)
        total_isp_cost = float(isp_query.scalar() or 0)

        # 5. Operational Expenses (Salaries, Rent etc)
        expense_query = db.session.query(func.sum(Expense.amount)).filter(
            Expense.company_id == company_id,
            Expense.is_active == True
        )
        if start_date:
            expense_query = expense_query.filter(Expense.expense_date >= start_date)
        if end_date:
            expense_query = expense_query.filter(Expense.expense_date <= end_date)
        total_opex = float(expense_query.scalar() or 0)

        # Derived Metrics
        leakage = total_invoiced - total_collected
        net_cash = total_collected + total_extra - total_isp_cost - total_opex

        return [
            {'category': 'Total Invoiced', 'amount': total_invoiced, 'type': 'positive'},
            {'category': 'Uncollected (Leakage)', 'amount': -leakage, 'type': 'negative'},
            {'category': 'Collected', 'amount': total_collected, 'type': 'subtotal'},
            {'category': 'Extra Income', 'amount': total_extra, 'type': 'positive'},
            {'category': 'ISP Costs (Direct)', 'amount': -total_isp_cost, 'type': 'negative'},
            {'category': 'OpEx (Salaries/Rent)', 'amount': -total_opex, 'type': 'negative'},
            {'category': 'Net Free Cash', 'amount': net_cash, 'type': 'total'} 
        ]

    except Exception as e:
        logger.error(f"Error calculating waterfall data: {str(e)}")
        for x in e.args: logger.error(x)
        return []

def get_three_line_trend_data(company_id, start_date=None, end_date=None):
    try:
        # Monthly grouping
        # 1. Invoiced
        invoiced_query = db.session.query(
            func.date_trunc('month', Invoice.billing_start_date).label('month'),
            func.sum(Invoice.total_amount).label('invoiced')
        ).filter(
            Invoice.company_id == company_id,
            Invoice.is_active == True,
            Invoice.invoice_type != 'refund'
        )
        if start_date:
             invoiced_query = invoiced_query.filter(Invoice.billing_start_date >= start_date)
        if end_date:
             invoiced_query = invoiced_query.filter(Invoice.billing_start_date <= end_date)
        invoiced_data = {r.month.strftime('%Y-%m'): float(r.invoiced or 0) for r in invoiced_query.group_by(func.date_trunc('month', Invoice.billing_start_date)).all()}

        # 2. Collected (Payments + Extra Income)
        collected_payments_query = db.session.query(
            func.date_trunc('month', Payment.payment_date).label('month'),
            func.sum(_signed_payment_amount()).label('collected')
        ).join(Invoice, Payment.invoice_id == Invoice.id).filter(
            Payment.company_id == company_id,
            Payment.is_active == True,
            Payment.status == 'paid'
        )
        if start_date:
             collected_payments_query = collected_payments_query.filter(Payment.payment_date >= start_date)
        if end_date:
             collected_payments_query = collected_payments_query.filter(Payment.payment_date <= end_date)
        collected_payments = {r.month.strftime('%Y-%m'): float(r.collected or 0) for r in collected_payments_query.group_by('month').all()}

        extra_income_query = db.session.query(
            func.date_trunc('month', ExtraIncome.income_date).label('month'),
            func.sum(ExtraIncome.amount).label('extra')
        ).filter(
             ExtraIncome.company_id == company_id,
             ExtraIncome.is_active == True
        )
        if start_date:
             extra_income_query = extra_income_query.filter(ExtraIncome.income_date >= start_date)
        if end_date:
             extra_income_query = extra_income_query.filter(ExtraIncome.income_date <= end_date)
        extra_income = {r.month.strftime('%Y-%m'): float(r.extra or 0) for r in extra_income_query.group_by('month').all()}
        
        # 3. Spent (Expenses + ISP Payments)
        expense_query = db.session.query(
            func.date_trunc('month', Expense.expense_date).label('month'),
            func.sum(Expense.amount).label('expense')
        ).filter(
            Expense.company_id == company_id,
            Expense.is_active == True
        )
        if start_date:
             expense_query = expense_query.filter(Expense.expense_date >= start_date)
        if end_date:
             expense_query = expense_query.filter(Expense.expense_date <= end_date)
        expenses = {r.month.strftime('%Y-%m'): float(r.expense or 0) for r in expense_query.group_by('month').all()}

        isp_query = db.session.query(
            func.date_trunc('month', ISPPayment.payment_date).label('month'),
            func.sum(ISPPayment.amount).label('isp')
        ).filter(
             ISPPayment.company_id == company_id,
             ISPPayment.is_active == True
        )
        if start_date:
             isp_query = isp_query.filter(ISPPayment.payment_date >= start_date)
        if end_date:
             isp_query = isp_query.filter(ISPPayment.payment_date <= end_date)
        isp_payments = {r.month.strftime('%Y-%m'): float(r.isp or 0) for r in isp_query.group_by('month').all()}

        # Combine
        all_months = sorted(set(list(invoiced_data.keys()) + list(collected_payments.keys()) + list(expenses.keys())))
        trend_data = []

        for month in all_months:
            inv = invoiced_data.get(month, 0)
            col = collected_payments.get(month, 0) + extra_income.get(month, 0)
            spd = expenses.get(month, 0) + isp_payments.get(month, 0)
            
            trend_data.append({
                'month': month,
                'invoiced': inv,
                'collected': col,
                'spent': spd
            })
            
        return trend_data

    except Exception as e:
        logger.error(f"Error calculating 3-line trend: {str(e)}")
        for x in e.args: logger.error(x)
        return []

def get_unified_financial_data(company_id, filters=None):
    try:
        if filters is None:
            filters = {}

        start_date = filters.get('start_date')
        end_date = filters.get('end_date')
        bank_account_id = filters.get('bank_account_id')
        invoice_status = filters.get('invoice_status')
        payment_method = filters.get('payment_method')
        isp_payment_type = filters.get('isp_payment_type')

        kpi_data = get_financial_kpis(company_id, start_date, end_date, bank_account_id, invoice_status, payment_method, isp_payment_type)
        cash_flow_data = get_cash_flow_analysis(company_id, start_date, end_date, bank_account_id, payment_method, isp_payment_type)
        revenue_expense_data = get_revenue_expense_comparison(company_id, start_date, end_date, bank_account_id, invoice_status)
        bank_performance_data = get_bank_account_performance(company_id, start_date, end_date, bank_account_id)
        collections_data = get_collections_analysis(company_id, start_date, end_date, bank_account_id, invoice_status)
        isp_payment_data = get_isp_payment_analysis(company_id, start_date, end_date, bank_account_id, isp_payment_type)
        income_analysis_data = get_income_analysis_data(company_id, start_date, end_date, bank_account_id, payment_method)

        # New Financial Dashboard Analytics (Cash Reality)
        profitability_data = get_profitability_data(company_id, start_date, end_date)
        waterfall_data = get_financial_waterfall_data(company_id, start_date, end_date)
        three_line_trend_data = get_three_line_trend_data(company_id, start_date, end_date)

        cash_payments_data = get_cash_payments_data(company_id, start_date, end_date)

        # NEW: Calculate initial balance summary
        initial_balance_summary = get_initial_balance_summary(company_id, bank_account_id)
        
        # Update KPI data with initial balance
        kpi_data['total_initial_balance'] = initial_balance_summary['total_initial_balance']
        kpi_data['adjusted_cash_flow'] = kpi_data['net_cash_flow'] + initial_balance_summary['total_initial_balance']
        
        # Update cash flow data with initial balance
        cash_flow_data['initial_balance'] = initial_balance_summary['total_initial_balance']
        cash_flow_data['total_adjusted_flow'] = kpi_data['adjusted_cash_flow']
        
        # Add adjusted flow to monthly trends
        for monthly_trend in cash_flow_data['monthly_trends']:
            monthly_trend['adjusted_flow'] = monthly_trend['net_flow'] + initial_balance_summary['total_initial_balance']

        bank_accounts = BankAccount.query.filter_by(company_id=company_id, is_active=True).all()
        bank_accounts_list = [{'id': str(acc.id), 'name': f"{acc.bank_name} - {acc.account_number}"} for acc in bank_accounts]
        print('cash_payments_data', cash_payments_data)
        return {
            'kpis': kpi_data,
            'cash_flow': cash_flow_data,
            'revenue_expense': revenue_expense_data,
            'bank_performance': bank_performance_data,
            'collections': collections_data,
            'isp_payments': isp_payment_data,
            'income_analysis': income_analysis_data,
            'profitability': profitability_data,
            'financial_waterfall': waterfall_data, # NEW
            'three_line_trend': three_line_trend_data, # NEW
            'cash_payments': cash_payments_data,
            'filters': filters,
            'bank_accounts': bank_accounts_list,
            'initial_balance_summary': initial_balance_summary
        }
    except Exception as e:
        logger.error(f"Error getting unified financial data: {str(e)}")
        return {'error': 'Failed to fetch unified financial data'}

# NEW: Add function to calculate initial balance summary
def get_initial_balance_summary(company_id, bank_account_id=None):
    """
    Calculates the REAL-TIME balance of bank accounts by aggregating actual transactions.
    Formula: Initial + (Customer Payments + Extra Income + Transfers In) - (Expenses + ISP Payments + Transfers Out)
    """
    try:
        # 1. Fetch valid accounts
        query = BankAccount.query.filter_by(company_id=company_id, is_active=True)
        if bank_account_id and bank_account_id != 'all':
            query = query.filter(BankAccount.id == uuid.UUID(bank_account_id))
        bank_accounts = query.all()
        
        bank_account_ids = [acc.id for acc in bank_accounts]
        if not bank_account_ids:
             return {
                'total_initial_balance': 0,
                'total_current_balance': 0,
                'accounts_with_balance': 0,
                'average_balance': 0
            }

        # Helper to get Sum grouped by account
        def get_sum_by_account(model, amount_col, account_col, filters=[]):
            q = db.session.query(
                account_col,
                func.sum(amount_col)
            ).filter(
                account_col.in_(bank_account_ids),
                model.is_active == True,
                *filters
            ).group_by(account_col)
            return dict(q.all())

        # 2. Bulk Fetch all financial data (Efficient O(1) queries instead of O(N))
        
        # Inflow: Customer Payments (Paid only)
        # Note: We use _signed_payment_amount() to handle refunds correctly if applicable
        customer_payments = db.session.query(
            Payment.bank_account_id,
            func.sum(case((Invoice.invoice_type == 'refund', -Payment.amount), else_=Payment.amount))
        ).join(Invoice, Payment.invoice_id == Invoice.id)\
        .filter(
            Payment.bank_account_id.in_(bank_account_ids),
            Payment.is_active == True,
            Payment.status == 'paid'
        ).group_by(Payment.bank_account_id).all()
        customer_payments_map = dict(customer_payments)

        # Inflow: Extra Income
        extra_income_map = get_sum_by_account(ExtraIncome, ExtraIncome.amount, ExtraIncome.bank_account_id)

        # Inflow: Transfers IN
        # InternalTransfer does not have 'is_active' usually, check model. Assuming mostly valid.
        transfers_in = db.session.query(InternalTransfer.to_account_id, func.sum(InternalTransfer.amount))\
            .filter(InternalTransfer.to_account_id.in_(bank_account_ids))\
            .group_by(InternalTransfer.to_account_id).all()
        transfers_in_map = dict(transfers_in)

        # Outflow: Expenses
        expenses_map = get_sum_by_account(Expense, Expense.amount, Expense.bank_account_id)

        # Outflow: ISP Payments (Completed only)
        isp_payments_map = get_sum_by_account(
            ISPPayment, 
            ISPPayment.amount, 
            ISPPayment.bank_account_id, 
            filters=[ISPPayment.status == 'completed']
        )

        # Outflow: Transfers OUT
        transfers_out = db.session.query(InternalTransfer.from_account_id, func.sum(InternalTransfer.amount))\
            .filter(InternalTransfer.from_account_id.in_(bank_account_ids))\
            .group_by(InternalTransfer.from_account_id).all()
        transfers_out_map = dict(transfers_out)

        # 3. Compute Balances
        total_initial_balance = 0
        total_current_balance = 0
        accounts_with_positive_balance = 0

        for acc in bank_accounts:
            # Start with Initial
            initial = float(acc.initial_balance or 0)
            
            # Add Inflows
            inflow = (
                float(customer_payments_map.get(acc.id, 0) or 0) + 
                float(extra_income_map.get(acc.id, 0) or 0) +
                float(transfers_in_map.get(acc.id, 0) or 0)
            )
            
            # Subtract Outflows
            outflow = (
                float(expenses_map.get(acc.id, 0) or 0) + 
                float(isp_payments_map.get(acc.id, 0) or 0) +
                float(transfers_out_map.get(acc.id, 0) or 0)
            )
            
            computed_balance = initial + inflow - outflow
            
            # Aggregates
            total_initial_balance += initial
            total_current_balance += computed_balance
            if computed_balance > 0:
                accounts_with_positive_balance += 1
            
            # OPTIONAL: You could update the DB here if you wanted to cache it, 
            # but for now we just return the computed value.
        
        return {
            'total_initial_balance': total_initial_balance,
            'total_current_balance': total_current_balance,
            'accounts_with_balance': accounts_with_positive_balance,
            'average_balance': round(total_current_balance / len(bank_accounts), 2) if bank_accounts else 0
        }

    except Exception as e:
        logger.error(f"Error calculating initial balance summary: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            'total_initial_balance': 0,
            'total_current_balance': 0,
            'accounts_with_balance': 0,
            'average_balance': 0
        }

def get_financial_kpis(company_id, start_date=None, end_date=None, bank_account_id=None, invoice_status=None, payment_method=None, isp_payment_type=None):
    try:
        revenue_query = db.session.query(func.sum(Invoice.total_amount)).filter(
            Invoice.company_id == company_id,
            Invoice.is_active == True
        )
        if invoice_status and invoice_status != 'all':
            revenue_query = revenue_query.filter(Invoice.status == invoice_status)

        collections_query = db.session.query(func.coalesce(func.sum(_signed_payment_amount()), 0)).join(
            Invoice, Payment.invoice_id == Invoice.id
        ).filter(
            Payment.company_id == company_id,
            Payment.is_active == True,
            Payment.status == 'paid'
        )
        if bank_account_id and bank_account_id != 'all':
            collections_query = collections_query.filter(Payment.bank_account_id == uuid.UUID(bank_account_id))
        if payment_method and payment_method != 'all':
            collections_query = collections_query.filter(Payment.payment_method == payment_method)

        isp_payments_query = db.session.query(func.sum(ISPPayment.amount)).filter(
            ISPPayment.company_id == company_id,
            ISPPayment.is_active == True,
            ISPPayment.status == 'completed'
        )
        if bank_account_id and bank_account_id != 'all':
            isp_payments_query = isp_payments_query.filter(ISPPayment.bank_account_id == uuid.UUID(bank_account_id))
        if isp_payment_type and isp_payment_type != 'all':
            isp_payments_query = isp_payments_query.filter(ISPPayment.payment_type == isp_payment_type)

        # NEW: Extra income query
        extra_income_query = db.session.query(func.sum(ExtraIncome.amount)).filter(
            ExtraIncome.company_id == company_id,
            ExtraIncome.is_active == True
        )
        if bank_account_id and bank_account_id != 'all':
            extra_income_query = extra_income_query.filter(ExtraIncome.bank_account_id == uuid.UUID(bank_account_id))
        if payment_method and payment_method != 'all':
            extra_income_query = extra_income_query.filter(ExtraIncome.payment_method == payment_method)
        if start_date:
            extra_income_query = extra_income_query.filter(ExtraIncome.income_date >= start_date)
        if end_date:
            extra_income_query = extra_income_query.filter(ExtraIncome.income_date <= end_date)

        # Expenses
        expenses_query = db.session.query(func.sum(Expense.amount)).filter(
            Expense.company_id == company_id,
            Expense.is_active == True
        )
        if bank_account_id and bank_account_id != 'all':
            expenses_query = expenses_query.filter(Expense.bank_account_id == uuid.UUID(bank_account_id))
        if start_date:
            expenses_query = expenses_query.filter(Expense.expense_date >= start_date)
        if end_date:
            expenses_query = expenses_query.filter(Expense.expense_date <= end_date)

        if start_date:
            revenue_query = revenue_query.filter(Invoice.billing_start_date >= start_date)
            collections_query = collections_query.filter(Payment.payment_date >= start_date)
            isp_payments_query = isp_payments_query.filter(ISPPayment.payment_date >= start_date)
        if end_date:
            revenue_query = revenue_query.filter(Invoice.billing_start_date <= end_date)
            collections_query = collections_query.filter(Payment.payment_date <= end_date)
            isp_payments_query = isp_payments_query.filter(ISPPayment.payment_date <= end_date)

        total_revenue = revenue_query.scalar() or 0
        total_collections = collections_query.scalar() or 0
        total_isp_payments = isp_payments_query.scalar() or 0
        total_expenses = expenses_query.scalar() or 0
        total_extra_income = extra_income_query.scalar() or 0  # NEW

        # UPDATED: include extra income as inflow
        net_cash_flow = float(total_collections) + float(total_extra_income) - float(total_isp_payments) - float(total_expenses)
        collection_efficiency = (float(total_collections) / float(total_revenue) * 100) if float(total_revenue) > 0 else 0
        operating_profit = float(total_collections) + float(total_extra_income) - float(total_isp_payments) - float(total_expenses)

        return {
            'total_revenue': float(total_revenue),
            'total_collections': float(total_collections),
            'total_isp_payments': float(total_isp_payments),
            'total_expenses': float(total_expenses),
            'total_extra_income': float(total_extra_income),  # NEW
            'net_cash_flow': net_cash_flow,
            'collection_efficiency': round(collection_efficiency, 2),
            'operating_profit': round(operating_profit, 2)
        }
    except Exception as e:
        logger.error(f"Error calculating financial KPIs: {str(e)}")
        return {}

def get_cash_flow_analysis(company_id, start_date=None, end_date=None, bank_account_id=None, payment_method=None, isp_payment_type=None):
    try:
        # Get monthly collections (inflow)
        monthly_collections = db.session.query(
            func.date_trunc('month', Payment.payment_date).label('month'),
            func.coalesce(func.sum(_signed_payment_amount()), 0).label('inflow')
        ).join(Invoice, Payment.invoice_id == Invoice.id
        ).filter(
            Payment.company_id == company_id,
            Payment.is_active == True,
            Payment.status == 'paid'
        )
        
        if bank_account_id and bank_account_id != 'all':
            monthly_collections = monthly_collections.filter(Payment.bank_account_id == uuid.UUID(bank_account_id))
        if payment_method and payment_method != 'all':
            monthly_collections = monthly_collections.filter(Payment.payment_method == payment_method)
        if start_date:
            monthly_collections = monthly_collections.filter(Payment.payment_date >= start_date)
        if end_date:
            monthly_collections = monthly_collections.filter(Payment.payment_date <= end_date)
            
        monthly_collections = monthly_collections.group_by('month').order_by('month').all()

        # NEW: Monthly extra income (inflow)
        monthly_extra_income = db.session.query(
            func.date_trunc('month', ExtraIncome.income_date).label('month'),
            func.sum(ExtraIncome.amount).label('extra_inflow')
        ).filter(
            ExtraIncome.company_id == company_id,
            ExtraIncome.is_active == True
        )
        if bank_account_id and bank_account_id != 'all':
            monthly_extra_income = monthly_extra_income.filter(ExtraIncome.bank_account_id == uuid.UUID(bank_account_id))
        if payment_method and payment_method != 'all':
            monthly_extra_income = monthly_extra_income.filter(ExtraIncome.payment_method == payment_method)
        if start_date:
            monthly_extra_income = monthly_extra_income.filter(ExtraIncome.income_date >= start_date)
        if end_date:
            monthly_extra_income = monthly_extra_income.filter(ExtraIncome.income_date <= end_date)
        monthly_extra_income = monthly_extra_income.group_by('month').order_by('month').all()


        # Get monthly ISP payments (outflow)
        monthly_isp_payments = db.session.query(
            func.date_trunc('month', ISPPayment.payment_date).label('month'),
            func.sum(ISPPayment.amount).label('isp_outflow')
        ).filter(
            ISPPayment.company_id == company_id,
            ISPPayment.is_active == True,
            ISPPayment.status == 'completed'
        )
        
        if bank_account_id and bank_account_id != 'all':
            monthly_isp_payments = monthly_isp_payments.filter(ISPPayment.bank_account_id == uuid.UUID(bank_account_id))
        if isp_payment_type and isp_payment_type != 'all':
            monthly_isp_payments = monthly_isp_payments.filter(ISPPayment.payment_type == isp_payment_type)
        if start_date:
            monthly_isp_payments = monthly_isp_payments.filter(ISPPayment.payment_date >= start_date)
        if end_date:
            monthly_isp_payments = monthly_isp_payments.filter(ISPPayment.payment_date <= end_date)
            
        monthly_isp_payments = monthly_isp_payments.group_by('month').order_by('month').all()

        # NEW: Get monthly expenses (additional outflow)
        monthly_expenses = db.session.query(
            func.date_trunc('month', Expense.expense_date).label('month'),
            func.sum(Expense.amount).label('expense_outflow')
        ).filter(
            Expense.company_id == company_id,
            Expense.is_active == True
        )
        
        if bank_account_id and bank_account_id != 'all':
            monthly_expenses = monthly_expenses.filter(Expense.bank_account_id == uuid.UUID(bank_account_id))
        if start_date:
            monthly_expenses = monthly_expenses.filter(Expense.expense_date >= start_date)
        if end_date:
            monthly_expenses = monthly_expenses.filter(Expense.expense_date <= end_date)
            
        monthly_expenses = monthly_expenses.group_by('month').order_by('month').all()

        # Create dictionaries for easy merging
        collections_dict = {month.strftime('%Y-%m'): float(inflow or 0) for month, inflow in monthly_collections}
        extra_income_dict = {month.strftime('%Y-%m'): float(extra_inflow or 0) for month, extra_inflow in monthly_extra_income}
        isp_dict = {month.strftime('%Y-%m'): float(isp_outflow or 0) for month, isp_outflow in monthly_isp_payments}
        expenses_dict = {month.strftime('%Y-%m'): float(expense_outflow or 0) for month, expense_outflow in monthly_expenses}

        # Get all unique months
        all_months = sorted(set(list(collections_dict.keys()) + list(extra_income_dict.keys()) + list(isp_dict.keys()) + list(expenses_dict.keys())))

        # Combine data
        monthly_trends = []
        for month in all_months:
            inflow = collections_dict.get(month, 0) + extra_income_dict.get(month, 0)  # include extra income
            isp_outflow = isp_dict.get(month, 0)
            expense_outflow = expenses_dict.get(month, 0)
            total_outflow = isp_outflow + expense_outflow
            net_flow = inflow - total_outflow
            
            monthly_trends.append({
                'month': month,
                'inflow': inflow,
                'outflow': total_outflow,
                'isp_outflow': isp_outflow,  # NEW: Separate ISP outflow
                'expense_outflow': expense_outflow,  # NEW: Separate expense outflow
                'net_flow': net_flow
            })

        # Inflow breakdown by payment method
        inflow_methods = db.session.query(
            Payment.payment_method,
            func.coalesce(func.sum(_signed_payment_amount()), 0).label('amount')
        ).join(Invoice, Payment.invoice_id == Invoice.id).filter(
            Payment.company_id == company_id,
            Payment.is_active == True,
            Payment.status == 'paid'
        )
        if bank_account_id and bank_account_id != 'all':
            inflow_methods = inflow_methods.filter(Payment.bank_account_id == uuid.UUID(bank_account_id))
        if payment_method and payment_method != 'all':
            inflow_methods = inflow_methods.filter(Payment.payment_method == payment_method)
        if start_date:
            inflow_methods = inflow_methods.filter(Payment.payment_date >= start_date)
        if end_date:
            inflow_methods = inflow_methods.filter(Payment.payment_date <= end_date)
        inflow_methods = inflow_methods.group_by(Payment.payment_method).all()
        method_totals = {m or 'Unknown': float(a or 0) for m, a in inflow_methods}

        extra_methods = db.session.query(
            ExtraIncome.payment_method,
            func.sum(ExtraIncome.amount).label('amount')
        ).filter(
            ExtraIncome.company_id == company_id,
            ExtraIncome.is_active == True
        )
        if bank_account_id and bank_account_id != 'all':
            extra_methods = extra_methods.filter(ExtraIncome.bank_account_id == uuid.UUID(bank_account_id))
        if payment_method and payment_method != 'all':
            extra_methods = extra_methods.filter(ExtraIncome.payment_method == payment_method)
        if start_date:
            extra_methods = extra_methods.filter(ExtraIncome.income_date >= start_date)
        if end_date:
            extra_methods = extra_methods.filter(ExtraIncome.income_date <= end_date)
        extra_methods = extra_methods.group_by(ExtraIncome.payment_method).all()
        for m, a in extra_methods:
            key = m or 'Unknown'
            method_totals[key] = method_totals.get(key, 0) + float(a or 0)


        # Outflow breakdown (ISP payments + Expenses)
        outflow_types = []
        
        # ISP payment types
        isp_outflow_types = db.session.query(
            ISPPayment.payment_type,
            func.sum(ISPPayment.amount).label('amount')
        ).filter(
            ISPPayment.company_id == company_id,
            ISPPayment.is_active == True
        )
        if bank_account_id and bank_account_id != 'all':
            isp_outflow_types = isp_outflow_types.filter(ISPPayment.bank_account_id == uuid.UUID(bank_account_id))
        if isp_payment_type and isp_payment_type != 'all':
            isp_outflow_types = isp_outflow_types.filter(ISPPayment.payment_type == isp_payment_type)
        if start_date:
            isp_outflow_types = isp_outflow_types.filter(ISPPayment.payment_date >= start_date)
        if end_date:
            isp_outflow_types = isp_outflow_types.filter(ISPPayment.payment_date <= end_date)
        isp_outflow_types = isp_outflow_types.group_by(ISPPayment.payment_type).all()
        
        for payment_type, amount in isp_outflow_types:
            outflow_types.append({
                'type': f"ISP - {payment_type}",
                'amount': float(amount or 0)
            })

        # Expense types
        expense_outflow_types = db.session.query(
            ExpenseType.name,
            func.sum(Expense.amount).label('amount')
        ).join(ExpenseType, Expense.expense_type_id == ExpenseType.id).filter(
            Expense.company_id == company_id,
            Expense.is_active == True
        )
        if bank_account_id and bank_account_id != 'all':
            expense_outflow_types = expense_outflow_types.filter(Expense.bank_account_id == uuid.UUID(bank_account_id))
        if start_date:
            expense_outflow_types = expense_outflow_types.filter(Expense.expense_date >= start_date)
        if end_date:
            expense_outflow_types = expense_outflow_types.filter(Expense.expense_date <= end_date)
        expense_outflow_types = expense_outflow_types.group_by(ExpenseType.name).all()
        
        for expense_type, amount in expense_outflow_types:
            outflow_types.append({
                'type': f"Expense - {expense_type}",
                'amount': float(amount or 0)
            })

        return {
            'monthly_trends': monthly_trends,
            'inflow_breakdown': [{'method': m, 'amount': a} for m, a in method_totals.items()],
            'outflow_breakdown': outflow_types
        }
    except Exception as e:
        logger.error(f"Error calculating cash flow analysis: {str(e)}")
        return {}

def get_revenue_expense_comparison(company_id, start_date=None, end_date=None, bank_account_id=None, invoice_status=None):
    try:
        # Calculate REVENUE separately (from Invoices)
        revenue_query = db.session.query(
            func.date_trunc('month', Invoice.billing_start_date).label('month'),
            func.sum(Invoice.total_amount).label('revenue')
        ).filter(
            Invoice.company_id == company_id,
            Invoice.is_active == True
        )
        
        if invoice_status and invoice_status != 'all':
            revenue_query = revenue_query.filter(Invoice.status == invoice_status)
        if start_date:
            revenue_query = revenue_query.filter(Invoice.billing_start_date >= start_date)
        if end_date:
            revenue_query = revenue_query.filter(Invoice.billing_start_date <= end_date)
            
        revenue_data = revenue_query.group_by('month').order_by('month').all()
        
        # Calculate EXTRA INCOME (from ExtraIncome model)
        extra_income_query = db.session.query(
            func.date_trunc('month', ExtraIncome.income_date).label('month'),
            func.sum(ExtraIncome.amount).label('extra_income')
        ).filter(
            ExtraIncome.company_id == company_id,
            ExtraIncome.is_active == True
        )
        
        if bank_account_id and bank_account_id != 'all':
            extra_income_query = extra_income_query.filter(ExtraIncome.bank_account_id == uuid.UUID(bank_account_id))
        if start_date:
            extra_income_query = extra_income_query.filter(ExtraIncome.income_date >= start_date)
        if end_date:
            extra_income_query = extra_income_query.filter(ExtraIncome.income_date <= end_date)
            
        extra_income_data = extra_income_query.group_by('month').order_by('month').all()
        
        # Calculate EXPENSES (ISP Payments + Business Expenses)
        expense_query = db.session.query(
            func.date_trunc('month', ISPPayment.payment_date).label('month'),
            func.sum(ISPPayment.amount).label('isp_expenses')
        ).filter(
            ISPPayment.company_id == company_id,
            ISPPayment.is_active == True,
            ISPPayment.status == 'completed'
        )
        
        if bank_account_id and bank_account_id != 'all':
            expense_query = expense_query.filter(ISPPayment.bank_account_id == uuid.UUID(bank_account_id))
        if start_date:
            expense_query = expense_query.filter(ISPPayment.payment_date >= start_date)
        if end_date:
            expense_query = expense_query.filter(ISPPayment.payment_date <= end_date)
            
        expense_data = expense_query.group_by('month').order_by('month').all()
        
        # Get business expenses
        business_expense_query = db.session.query(
            func.date_trunc('month', Expense.expense_date).label('month'),
            func.sum(Expense.amount).label('business_expenses')
        ).filter(
            Expense.company_id == company_id,
            Expense.is_active == True
        )
        
        if bank_account_id and bank_account_id != 'all':
            business_expense_query = business_expense_query.filter(Expense.bank_account_id == uuid.UUID(bank_account_id))
        if start_date:
            business_expense_query = business_expense_query.filter(Expense.expense_date >= start_date)
        if end_date:
            business_expense_query = business_expense_query.filter(Expense.expense_date <= end_date)
            
        business_expense_data = business_expense_query.group_by('month').order_by('month').all()
        
        # Create dictionaries for easy merging
        revenue_dict = {month.strftime('%Y-%m'): float(revenue or 0) for month, revenue in revenue_data}
        extra_income_dict = {month.strftime('%Y-%m'): float(extra_income or 0) for month, extra_income in extra_income_data}
        isp_expense_dict = {month.strftime('%Y-%m'): float(isp_expenses or 0) for month, isp_expenses in expense_data}
        business_expense_dict = {month.strftime('%Y-%m'): float(business_expenses or 0) for month, business_expenses in business_expense_data}
        
        # Get all unique months from all datasets
        all_months = sorted(set(
            list(revenue_dict.keys()) + 
            list(extra_income_dict.keys()) + 
            list(isp_expense_dict.keys()) + 
            list(business_expense_dict.keys())
        ))
        
        # Combine the data
        monthly_comparison = []
        total_revenue = 0
        total_extra_income = 0
        total_expenses = 0
        total_isp_expenses = 0
        total_business_expenses = 0
        
        for month in all_months:
            revenue = revenue_dict.get(month, 0)
            extra_income = extra_income_dict.get(month, 0)
            isp_expenses = isp_expense_dict.get(month, 0)
            business_expenses = business_expense_dict.get(month, 0)
            total_monthly_expenses = isp_expenses + business_expenses
            
            # Calculate ratio based on total income (revenue + extra_income)
            total_income = revenue + extra_income
            ratio = (total_monthly_expenses / total_income * 100) if total_income > 0 else 0
            
            monthly_comparison.append({
                'month': month,
                'revenue': revenue,
                'extra_income': extra_income,  # NEW: Extra income data
                'expenses': total_monthly_expenses,
                'isp_expenses': isp_expenses,
                'business_expenses': business_expenses,
                'ratio': ratio
            })
            
            total_revenue += revenue
            total_extra_income += extra_income
            total_expenses += total_monthly_expenses
            total_isp_expenses += isp_expenses
            total_business_expenses += business_expenses
        
        # Calculate average ratio (only for months with income)
        months_with_income = [item for item in monthly_comparison if (item['revenue'] + item['extra_income']) > 0]
        average_ratio = sum(item['ratio'] for item in months_with_income) / len(months_with_income) if months_with_income else 0
        
        return {
            'monthly_comparison': monthly_comparison,
            'total_revenue': total_revenue,
            'total_extra_income': total_extra_income,  # NEW
            'total_expenses': total_expenses,
            'total_isp_expenses': total_isp_expenses,
            'total_business_expenses': total_business_expenses,
            'average_ratio': round(average_ratio, 1)
        }
        
    except Exception as e:
        logger.error(f"Error calculating revenue expense comparison: {str(e)}")
        return {
            'monthly_comparison': [],
            'total_revenue': 0,
            'total_extra_income': 0,  # NEW
            'total_expenses': 0,
            'total_isp_expenses': 0,
            'total_business_expenses': 0,
            'average_ratio': 0
        }

def get_bank_account_performance(company_id, start_date=None, end_date=None, bank_account_id=None):
    try:
        collections_query = db.session.query(
            BankAccount.bank_name,
            BankAccount.account_number,
            func.coalesce(func.sum(_signed_payment_amount()), 0).label('collections')
        ).join(Payment, BankAccount.id == Payment.bank_account_id
        ).join(Invoice, Payment.invoice_id == Invoice.id
        ).filter(
            BankAccount.company_id == company_id,
            BankAccount.is_active == True,
            Payment.is_active == True,
            Payment.status == 'paid',
            Payment.bank_account_id.isnot(None)
        )
        if bank_account_id and bank_account_id != 'all':
            collections_query = collections_query.filter(BankAccount.id == uuid.UUID(bank_account_id))
        if start_date:
            collections_query = collections_query.filter(Payment.payment_date >= start_date)
        if end_date:
            collections_query = collections_query.filter(Payment.payment_date <= end_date)
        collections_data = collections_query.group_by(BankAccount.bank_name, BankAccount.account_number).all()

        isp_payments_query = db.session.query(
            BankAccount.bank_name,
            BankAccount.account_number,
            func.sum(ISPPayment.amount).label('isp_payments')
        ).join(ISPPayment, BankAccount.id == ISPPayment.bank_account_id
        ).filter(
            BankAccount.company_id == company_id,
            BankAccount.is_active == True,
            ISPPayment.is_active == True,
            ISPPayment.status == 'completed'
        )
        if bank_account_id and bank_account_id != 'all':
            isp_payments_query = isp_payments_query.filter(BankAccount.id == uuid.UUID(bank_account_id))
        if start_date:
            isp_payments_query = isp_payments_query.filter(ISPPayment.payment_date >= start_date)
        if end_date:
            isp_payments_query = isp_payments_query.filter(ISPPayment.payment_date <= end_date)
        isp_payments_data = isp_payments_query.group_by(BankAccount.bank_name, BankAccount.account_number).all()

        expenses_query = db.session.query(
            BankAccount.bank_name,
            BankAccount.account_number,
            func.sum(Expense.amount).label('expenses')
        ).join(Expense, BankAccount.id == Expense.bank_account_id
        ).filter(
            BankAccount.company_id == company_id,
            BankAccount.is_active == True,
            Expense.is_active == True
        )
        if bank_account_id and bank_account_id != 'all':
            expenses_query = expenses_query.filter(BankAccount.id == uuid.UUID(bank_account_id))
        if start_date:
            expenses_query = expenses_query.filter(Expense.expense_date >= start_date)
        if end_date:
            expenses_query = expenses_query.filter(Expense.expense_date <= end_date)
        expenses_data = expenses_query.group_by(BankAccount.bank_name, BankAccount.account_number).all()

        # NEW: extra income per bank account
        extra_income_query = db.session.query(
            BankAccount.bank_name,
            BankAccount.account_number,
            func.sum(ExtraIncome.amount).label('extra_income')
        ).join(ExtraIncome, BankAccount.id == ExtraIncome.bank_account_id
        ).filter(
            BankAccount.company_id == company_id,
            BankAccount.is_active == True,
            ExtraIncome.is_active == True
        )
        if bank_account_id and bank_account_id != 'all':
            extra_income_query = extra_income_query.filter(BankAccount.id == uuid.UUID(bank_account_id))
        if start_date:
            extra_income_query = extra_income_query.filter(ExtraIncome.income_date >= start_date)
        if end_date:
            extra_income_query = extra_income_query.filter(ExtraIncome.income_date <= end_date)
        extra_income_data = extra_income_query.group_by(BankAccount.bank_name, BankAccount.account_number).all()

        collections_dict = {f"{bn}-{an}": float(c or 0) for bn, an, c in collections_data}
        isp_payments_dict = {f"{bn}-{an}": float(v or 0) for bn, an, v in isp_payments_data}
        expenses_dict = {f"{bn}-{an}": float(v or 0) for bn, an, v in expenses_data}
        extra_income_dict = {f"{bn}-{an}": float(v or 0) for bn, an, v in extra_income_data}

        all_bank_accounts = BankAccount.query.filter_by(company_id=company_id, is_active=True).all()
        performance_data = []
        for account in all_bank_accounts:
            key = f"{account.bank_name}-{account.account_number}"
            collections = collections_dict.get(key, 0)
            isp_payments = isp_payments_dict.get(key, 0)
            expenses = expenses_dict.get(key, 0)
            extra_income = extra_income_dict.get(key, 0)
            total_payments = isp_payments + expenses
            net_flow = collections + extra_income - total_payments
            initial_balance = float(account.initial_balance or 0)
            total_flow = collections + extra_income + total_payments
            utilization_rate = ((collections + extra_income) / total_flow * 100) if total_flow > 0 else 0

            performance_data.append({
                'bank_name': account.bank_name,
                'account_number': account.account_number,
                'collections': collections,
                'extra_income': extra_income,  # NEW
                'payments': total_payments,
                'isp_payments': isp_payments,
                'expenses': expenses,
                'net_flow': net_flow,
                'initial_balance': initial_balance,
                'current_balance': float(account.current_balance or 0),
                'utilization_rate': round(utilization_rate, 2)
            })
        return performance_data
        
    except Exception as e:
        logger.error(f"Error calculating bank account performance: {str(e)}")
        return []

def get_collections_analysis(company_id, start_date=None, end_date=None, bank_account_id=None, invoice_status=None):
    try:
        current_date = datetime.utcnow().date()
        aging_query = db.session.query(
            Invoice.id,
            Invoice.total_amount,
            Invoice.due_date,
            func.coalesce(func.sum(Payment.amount), 0).label('paid_amount')
        ).outerjoin(Payment, Invoice.id == Payment.invoice_id
        ).filter(
            Invoice.company_id == company_id,
            Invoice.is_active == True,
            Invoice.status != 'paid'
        )
        if invoice_status and invoice_status != 'all':
            aging_query = aging_query.filter(Invoice.status == invoice_status)
        if start_date:
            aging_query = aging_query.filter(Invoice.billing_start_date >= start_date)
        if end_date:
            aging_query = aging_query.filter(Invoice.billing_start_date <= end_date)
        if bank_account_id and bank_account_id != 'all':
            aging_query = aging_query.filter((Payment.bank_account_id == uuid.UUID(bank_account_id)) | (Payment.bank_account_id.is_(None)))
        aging_query = aging_query.group_by(Invoice.id, Invoice.total_amount, Invoice.due_date)
        aging_data = aging_query.all()

        aging_buckets = {
            '0-30': 0,
            '31-60': 0,
            '61-90': 0,
            '90+': 0
        }
        
        for invoice_id, total_amount, due_date, paid_amount in aging_data:
            if due_date:
                days_overdue = (current_date - due_date).days
                outstanding = float(total_amount) - float(paid_amount)
                
                if days_overdue <= 30:
                    aging_buckets['0-30'] += outstanding
                elif days_overdue <= 60:
                    aging_buckets['31-60'] += outstanding
                elif days_overdue <= 90:
                    aging_buckets['61-90'] += outstanding
                else:
                    aging_buckets['90+'] += outstanding
        collection_trends = db.session.query(
            func.date_trunc('month', Payment.payment_date).label('month'),
            func.count(Payment.id).label('payment_count'),
            func.coalesce(func.sum(_signed_payment_amount()), 0).label('collection_amount')
        ).join(Invoice, Payment.invoice_id == Invoice.id
        ).filter(
            Payment.company_id == company_id,
            Payment.is_active == True,
            Payment.status == 'paid'
        )
        if bank_account_id and bank_account_id != 'all':
            collection_trends = collection_trends.filter(Payment.bank_account_id == uuid.UUID(bank_account_id))
        if start_date:
            collection_trends = collection_trends.filter(Payment.payment_date >= start_date)
        if end_date:
            collection_trends = collection_trends.filter(Payment.payment_date <= end_date)
        collection_trends = collection_trends.group_by('month').order_by('month').all()
        
        return {
            'aging_analysis': [
                {'bucket': bucket, 'amount': amount}
                for bucket, amount in aging_buckets.items()
            ],
            'collection_trends': [
                {
                    'month': month.strftime('%Y-%m'),
                    'payment_count': count or 0,
                    'collection_amount': float(amount or 0)
                }
                for month, count, amount in collection_trends
            ],
            'total_outstanding': sum(aging_buckets.values())
        }
        
    except Exception as e:
        logger.error(f"Error calculating collections analysis: {str(e)}")
        return {}

def get_isp_payment_analysis(company_id, start_date=None, end_date=None, bank_account_id=None, isp_payment_type=None):
    try:
        payment_types = db.session.query(
            ISPPayment.payment_type,
            func.sum(ISPPayment.amount).label('total_amount'),
            func.avg(ISPPayment.amount).label('avg_amount'),
            func.count(ISPPayment.id).label('payment_count')
        ).filter(
            ISPPayment.company_id == company_id,
            ISPPayment.is_active == True
        )
        if bank_account_id and bank_account_id != 'all':
            payment_types = payment_types.filter(ISPPayment.bank_account_id == uuid.UUID(bank_account_id))
        if isp_payment_type and isp_payment_type != 'all':
            payment_types = payment_types.filter(ISPPayment.payment_type == isp_payment_type)
        if start_date:
            payment_types = payment_types.filter(ISPPayment.payment_date >= start_date)
        if end_date:
            payment_types = payment_types.filter(ISPPayment.payment_date <= end_date)
        payment_types = payment_types.group_by(ISPPayment.payment_type).all()

        bandwidth_costs = db.session.query(
            func.date_trunc('month', ISPPayment.payment_date).label('month'),
            func.sum(ISPPayment.amount).label('total_cost'),
            func.sum(ISPPayment.bandwidth_usage_gb).label('total_usage')
        ).filter(
            ISPPayment.company_id == company_id,
            ISPPayment.is_active == True,
            ISPPayment.payment_type == 'bandwidth_usage'
        )
        if bank_account_id and bank_account_id != 'all':
            bandwidth_costs = bandwidth_costs.filter(ISPPayment.bank_account_id == uuid.UUID(bank_account_id))
        if start_date:
            bandwidth_costs = bandwidth_costs.filter(ISPPayment.payment_date >= start_date)
        if end_date:
            bandwidth_costs = bandwidth_costs.filter(ISPPayment.payment_date <= end_date)
        bandwidth_costs = bandwidth_costs.group_by('month').order_by('month').all()
        
        # Calculate cost per GB
        bandwidth_analysis = []
        for month, total_cost, total_usage in bandwidth_costs:
            cost_per_gb = float(total_cost or 0) / float(total_usage or 1) if total_usage and total_usage > 0 else 0
            bandwidth_analysis.append({
                'month': month.strftime('%Y-%m'),
                'total_cost': float(total_cost or 0),
                'total_usage': float(total_usage or 0),
                'cost_per_gb': round(cost_per_gb, 4)
            })
        
        # Bank Account Breakdown for ISP Payments
        bank_account_breakdown = db.session.query(
            BankAccount.bank_name,
            BankAccount.account_number,
            func.sum(ISPPayment.amount).label('total_amount'),
            func.avg(ISPPayment.amount).label('avg_amount'),
            func.count(ISPPayment.id).label('payment_count')
        ).join(ISPPayment, BankAccount.id == ISPPayment.bank_account_id
        ).filter(
            ISPPayment.company_id == company_id,
            ISPPayment.is_active == True
        )
        if bank_account_id and bank_account_id != 'all':
            bank_account_breakdown = bank_account_breakdown.filter(ISPPayment.bank_account_id == uuid.UUID(bank_account_id))
        if isp_payment_type and isp_payment_type != 'all':
            bank_account_breakdown = bank_account_breakdown.filter(ISPPayment.payment_type == isp_payment_type)
        if start_date:
            bank_account_breakdown = bank_account_breakdown.filter(ISPPayment.payment_date >= start_date)
        if end_date:
            bank_account_breakdown = bank_account_breakdown.filter(ISPPayment.payment_date <= end_date)
        bank_account_breakdown = bank_account_breakdown.group_by(BankAccount.bank_name, BankAccount.account_number).all()
        
        # Also get cash payments (no bank account)
        cash_payments_query = db.session.query(
            func.sum(ISPPayment.amount).label('total_amount'),
            func.avg(ISPPayment.amount).label('avg_amount'),
            func.count(ISPPayment.id).label('payment_count')
        ).filter(
            ISPPayment.company_id == company_id,
            ISPPayment.is_active == True,
            ISPPayment.bank_account_id.is_(None)
        )
        if isp_payment_type and isp_payment_type != 'all':
            cash_payments_query = cash_payments_query.filter(ISPPayment.payment_type == isp_payment_type)
        if start_date:
            cash_payments_query = cash_payments_query.filter(ISPPayment.payment_date >= start_date)
        if end_date:
            cash_payments_query = cash_payments_query.filter(ISPPayment.payment_date <= end_date)
        cash_payment_data = cash_payments_query.first()
        
        bank_breakdown_list = [
            {
                'bank_name': bank_name,
                'account_number': account_number,
                'total_amount': float(total_amount or 0),
                'avg_amount': float(avg_amount or 0),
                'payment_count': payment_count or 0
            }
            for bank_name, account_number, total_amount, avg_amount, payment_count in bank_account_breakdown
        ]
        
        # Add cash payments if any exist
        if cash_payment_data and cash_payment_data.total_amount and cash_payment_data.total_amount > 0:
            bank_breakdown_list.append({
                'bank_name': 'Cash',
                'account_number': 'N/A',
                'total_amount': float(cash_payment_data.total_amount or 0),
                'avg_amount': float(cash_payment_data.avg_amount or 0),
                'payment_count': cash_payment_data.payment_count or 0
            })
        
        return {
            'payment_types': [
                {
                    'type': payment_type,
                    'total_amount': float(total_amount or 0),
                    'avg_amount': float(avg_amount or 0),
                    'payment_count': payment_count or 0
                }
                for payment_type, total_amount, avg_amount, payment_count in payment_types
            ],
            'bank_account_breakdown': bank_breakdown_list,
            'bandwidth_analysis': bandwidth_analysis,
            'total_isp_payments': sum(float(total_amount or 0) for _, total_amount, _, _ in payment_types)
        }
        
    except Exception as e:
        logger.error(f"Error calculating ISP payment analysis: {str(e)}")
        return {}


def get_income_analysis_data(company_id, start_date=None, end_date=None, bank_account_id=None, payment_method=None):
    try:
        # Base Payment Query - Only count PAID payments
        base_query = db.session.query(Payment).filter(
            Payment.company_id == company_id,
            Payment.is_active == True,
            Payment.status == 'paid'  # CRITICAL: Only count verified/paid payments
        )
        
        if bank_account_id and bank_account_id != 'all':
            base_query = base_query.filter(Payment.bank_account_id == uuid.UUID(bank_account_id))
        if payment_method and payment_method != 'all':
            base_query = base_query.filter(Payment.payment_method == payment_method)
        if start_date:
            base_query = base_query.filter(Payment.payment_date >= start_date)
        if end_date:
            base_query = base_query.filter(Payment.payment_date <= end_date)
            
        # 1. Income by Payment Method
        method_query = base_query.with_entities(
            Payment.payment_method,
            func.sum(Payment.amount).label('total_amount'),
            func.count(Payment.id).label('payment_count')
        ).group_by(Payment.payment_method).all()
        
        # 2. Income by Bank Account
        bank_query = base_query.outerjoin(BankAccount, Payment.bank_account_id == BankAccount.id).with_entities(
            BankAccount.bank_name,
            BankAccount.account_number,
            func.sum(Payment.amount).label('total_amount'),
            func.count(Payment.id).label('payment_count')
        ).group_by(BankAccount.bank_name, BankAccount.account_number).all()
        
        # 3. Income by Service Plan (Approximated by paid invoices in this period)
        # We find payments in range -> Invoices -> Line Items -> Plan
        plan_query = db.session.query(
            ServicePlan.name,
            func.sum(InvoiceLineItem.line_total).label('total_income'),
            func.count(func.distinct(Payment.id)).label('payment_count')
        ).join(CustomerPackage, InvoiceLineItem.customer_package_id == CustomerPackage.id
        ).join(ServicePlan, CustomerPackage.service_plan_id == ServicePlan.id
        ).join(Invoice, InvoiceLineItem.invoice_id == Invoice.id
        ).join(Payment, Invoice.id == Payment.invoice_id
        ).filter(
            Payment.company_id == company_id,
            Payment.is_active == True,
            Payment.status == 'paid'  # CRITICAL: Only count verified/paid payments
        )
        
        if bank_account_id and bank_account_id != 'all':
            plan_query = plan_query.filter(Payment.bank_account_id == uuid.UUID(bank_account_id))
        if payment_method and payment_method != 'all':
            plan_query = plan_query.filter(Payment.payment_method == payment_method)
        if start_date:
            plan_query = plan_query.filter(Payment.payment_date >= start_date)
        if end_date:
            plan_query = plan_query.filter(Payment.payment_date <= end_date)
            
        plan_data = plan_query.group_by(ServicePlan.name).order_by(desc('total_income')).all()
        
        # Format Results
        income_by_method = [
            {
                'method': m, 
                'amount': float(a or 0), 
                'count': c
            } for m, a, c in method_query
        ]
        
        income_by_bank = []
        for bank, acc, amt, count in bank_query:
            name = bank if bank else "Cash / Undeposited"
            number = acc if acc else "N/A"
            income_by_bank.append({
                'bank': name,
                'account': number,
                'amount': float(amt or 0),
                'count': count
            })
            
        income_by_plan = [
            {
                'plan': p, 
                'amount': float(a or 0), 
                'count': c
            } for p, a, c in plan_data
        ]
        
        return {
            'income_by_method': income_by_method,
            'income_by_bank': income_by_bank,
            'income_by_plan': income_by_plan,
            'total_income': sum(float(x['amount']) for x in income_by_method)
        }
    except Exception as e:
        logger.error(f"Error calculating income analysis: {str(e)}")
        return {
            'income_by_method': [],
            'income_by_bank': [],
            'income_by_plan': [],
            'total_income': 0
        }

def get_cash_payments_data(company_id, start_date=None, end_date=None):
    """
    Calculate cash payments (payments without bank_account_id)
    """
    try:
        # Get cash collections (payments without bank_account_id)
        cash_collections_query = db.session.query(
            func.coalesce(func.sum(_signed_payment_amount()), 0).label('collections')
        ).join(Invoice, Payment.invoice_id == Invoice.id
        ).filter(
            Payment.company_id == company_id,
            Payment.is_active == True,
            Payment.status == 'paid',
            Payment.bank_account_id.is_(None)  # Cash payments have no bank account
        )
        
        # Get cash ISP payments (ISP payments without bank_account_id)
        cash_isp_payments_query = db.session.query(
            func.sum(ISPPayment.amount).label('payments')
        ).filter(
            ISPPayment.company_id == company_id,
            ISPPayment.is_active == True,
            ISPPayment.status == 'completed',
            ISPPayment.bank_account_id.is_(None)  # Cash ISP payments have no bank account
        )

        # NEW: cash extra income
        cash_extra_income_query = db.session.query(
            func.sum(ExtraIncome.amount).label('extra_income')
        ).filter(
            ExtraIncome.company_id == company_id,
            ExtraIncome.is_active == True,
            ExtraIncome.bank_account_id.is_(None)
        )

        # NEW: cash expenses
        cash_expenses_query = db.session.query(
            func.sum(Expense.amount).label('expenses')
        ).filter(
            Expense.company_id == company_id,
            Expense.is_active == True,
            Expense.bank_account_id.is_(None)
        )

        # Apply date filters if provided
        if start_date:
            cash_collections_query = cash_collections_query.filter(Payment.payment_date >= start_date)
            cash_isp_payments_query = cash_isp_payments_query.filter(ISPPayment.payment_date >= start_date)
            cash_extra_income_query = cash_extra_income_query.filter(ExtraIncome.income_date >= start_date)
            cash_expenses_query = cash_expenses_query.filter(Expense.expense_date >= start_date)
        if end_date:
            cash_collections_query = cash_collections_query.filter(Payment.payment_date <= end_date)
            cash_isp_payments_query = cash_isp_payments_query.filter(ISPPayment.payment_date <= end_date)
            cash_extra_income_query = cash_extra_income_query.filter(ExtraIncome.income_date <= end_date)
            cash_expenses_query = cash_expenses_query.filter(Expense.expense_date <= end_date)

        cash_collections = cash_collections_query.scalar() or 0
        cash_isp_payments = cash_isp_payments_query.scalar() or 0
        cash_extra_income = cash_extra_income_query.scalar() or 0
        cash_expenses = cash_expenses_query.scalar() or 0

        total_cash_payments = float(cash_isp_payments) + float(cash_expenses)
        cash_net_flow = float(cash_collections) + float(cash_extra_income) - total_cash_payments

        return {
            'collections': float(cash_collections),
            'payments': float(total_cash_payments),  # for summary tiles
            'isp_payments': float(cash_isp_payments),
            'expenses': float(cash_expenses),
            'extra_income': float(cash_extra_income),  # NEW
            'net_flow': cash_net_flow
        }
    except Exception as e:
        logger.error(f"Error calculating cash payments data: {str(e)}")
        return {
            'collections': 0,
            'payments': 0,
            'isp_payments': 0,
            'expenses': 0,
            'extra_income': 0,
            'net_flow': 0
        }

def _refund_signed_amount():
    # Treat invoice payments on refund invoices as negative (debit)
    return case((Invoice.invoice_type == 'refund', -Payment.amount), else_=Payment.amount)
def _refund_signed_amount():
    # Treat invoice payments on refund invoices as negative (debit)
    return case((Invoice.invoice_type == 'refund', -Payment.amount), else_=Payment.amount)

def get_ledger_data(company_id, filters=None):
    """
    Returns a unified list of ledger items across:
      - Invoice Payments (credits; refunds are debits)
      - ISP Payments (debits)
      - Business Expenses (debits)
      - Extra Incomes (credits)
    Applies filters and sorts by time descending.
    """
    try:
        if filters is None:
            filters = {}

        start_date = filters.get('start_date')
        end_date = filters.get('end_date')
        bank_account_id = filters.get('bank_account_id')
        payment_method = filters.get('payment_method')
        invoice_status = filters.get('invoice_status')
        isp_payment_type = filters.get('isp_payment_type')

        # Build a bank account lookup map - ALWAYS get all bank accounts
        bank_accounts = BankAccount.query.filter_by(company_id=company_id, is_active=True).all()
        bank_account_map = {
            str(acc.id): f"{acc.bank_name} - {acc.account_number}" 
            for acc in bank_accounts
        }

        # Invoice payments (collections)
        p_query = db.session.query(
            Payment.id.label('id'),
            Payment.payment_date.label('ts'),
            _refund_signed_amount().label('signed_amount'),
            Payment.amount.label('amount'),
            Payment.payment_method.label('method'),
            Payment.status.label('status'),
            Payment.transaction_id.label('reference'),
            Payment.bank_account_id.label('bank_id'),
            Invoice.invoice_number.label('invoice_number'),
            Invoice.invoice_type.label('invoice_type'),
            Customer.internet_id.label('customer_internet_id'),
        ).join(Invoice, Payment.invoice_id == Invoice.id
        ).join(Customer, Invoice.customer_id == Customer.id
        ).filter(
            Payment.company_id == company_id,
            Payment.is_active == True,
            Payment.status.in_(['paid','refunded'])  # include refunded
        )
        if start_date: p_query = p_query.filter(Payment.payment_date >= start_date)
        if end_date: p_query = p_query.filter(Payment.payment_date <= end_date)
        if bank_account_id and bank_account_id != 'all':
            p_query = p_query.filter(Payment.bank_account_id == uuid.UUID(bank_account_id))
        if payment_method and payment_method != 'all':
            p_query = p_query.filter(Payment.payment_method == payment_method)
        if invoice_status and invoice_status != 'all':
            p_query = p_query.filter(Invoice.status == invoice_status)

        payments_rows = p_query.all()

        # ISP Payments (debits)
        isp_query = db.session.query(
            ISPPayment.id, ISPPayment.payment_date, ISPPayment.amount,
            ISPPayment.payment_method, ISPPayment.status,
            ISPPayment.reference_number, ISPPayment.bank_account_id, 
            ISPPayment.payment_type, ISPPayment.description
        ).filter(
            ISPPayment.company_id == company_id,
            ISPPayment.is_active == True
        )
        if start_date: isp_query = isp_query.filter(ISPPayment.payment_date >= start_date)
        if end_date: isp_query = isp_query.filter(ISPPayment.payment_date <= end_date)
        if bank_account_id and bank_account_id != 'all':
            isp_query = isp_query.filter(ISPPayment.bank_account_id == uuid.UUID(bank_account_id))
        if payment_method and payment_method != 'all':
            isp_query = isp_query.filter(ISPPayment.payment_method == payment_method)
        if isp_payment_type and isp_payment_type != 'all':
            isp_query = isp_query.filter(ISPPayment.payment_type == isp_payment_type)
        isp_rows = isp_query.all()

        # Expenses (debits)
        ex_query = db.session.query(
            Expense.id, Expense.expense_date, Expense.amount,
            Expense.payment_method, Expense.vendor_payee, 
            Expense.description, Expense.bank_account_id
        ).filter(
            Expense.company_id == company_id,
            Expense.is_active == True
        )
        if start_date: ex_query = ex_query.filter(Expense.expense_date >= start_date)
        if end_date: ex_query = ex_query.filter(Expense.expense_date <= end_date)
        if bank_account_id and bank_account_id != 'all':
            ex_query = ex_query.filter(Expense.bank_account_id == uuid.UUID(bank_account_id))
        if payment_method and payment_method != 'all':
            ex_query = ex_query.filter(Expense.payment_method == payment_method)
        expense_rows = ex_query.all()

        # Extra Income (credits)
        ei_query = db.session.query(
            ExtraIncome.id, ExtraIncome.income_date, ExtraIncome.amount,
            ExtraIncome.payment_method, ExtraIncome.payer, 
            ExtraIncome.description, ExtraIncome.bank_account_id
        ).filter(
            ExtraIncome.company_id == company_id,
            ExtraIncome.is_active == True
        )
        if start_date: ei_query = ei_query.filter(ExtraIncome.income_date >= start_date)
        if end_date: ei_query = ei_query.filter(ExtraIncome.income_date <= end_date)
        if bank_account_id and bank_account_id != 'all':
            ei_query = ei_query.filter(ExtraIncome.bank_account_id == uuid.UUID(bank_account_id))
        if payment_method and payment_method != 'all':
            ei_query = ei_query.filter(ExtraIncome.payment_method == payment_method)
        extra_rows = ei_query.all()

        # Internal Transfers (both debit and credit aspects)
        it_query = db.session.query(
            InternalTransfer.id, InternalTransfer.transfer_date, InternalTransfer.amount,
            InternalTransfer.description, InternalTransfer.from_account_id,
            InternalTransfer.to_account_id, InternalTransfer.reference_number
        ).filter(
            InternalTransfer.company_id == company_id,
            InternalTransfer.status == "completed"
        )
        if start_date: it_query = it_query.filter(InternalTransfer.transfer_date >= start_date)
        if end_date: it_query = it_query.filter(InternalTransfer.transfer_date <= end_date)
        if bank_account_id and bank_account_id != 'all':
            # For transfers, we want records where EITHER from OR to matches the account
            it_query = it_query.filter(
                (InternalTransfer.from_account_id == uuid.UUID(bank_account_id)) | 
                (InternalTransfer.to_account_id == uuid.UUID(bank_account_id))
            )
        transfer_rows = it_query.all()

        # Build unified items
        items = []

        for r in payments_rows:
            is_refund = (r.invoice_type or '').lower() == 'refund' or (r.status or '').lower() == 'refunded'
            bank_acc_name = bank_account_map.get(str(r.bank_id)) if r.bank_id else None
            items.append({
                'id': str(r.id),
                'date': r.ts.isoformat() if r.ts else None,
                'type': 'refund' if is_refund else 'invoice_payment',
                'reference': r.reference or r.invoice_number,
                'description': f"Invoice payment - {r.customer_internet_id or 'N/A'}",
                'method': r.method,
                'bank_account': bank_acc_name,
                'amount': float(r.amount or 0),
                'direction': 'debit' if is_refund else 'credit',
                'status': r.status or 'paid',
            })

        for r in isp_rows:
            bank_acc_name = bank_account_map.get(str(r.bank_account_id)) if r.bank_account_id else None
            items.append({
                'id': str(r.id),
                'date': r.payment_date.isoformat() if r.payment_date else None,
                'type': 'isp_payment',
                'reference': r.reference_number,
                'description': r.description or (r.payment_type or 'ISP payment'),
                'method': r.payment_method,
                'bank_account': bank_acc_name,
                'amount': float(r.amount or 0),
                'direction': 'debit',
                'status': r.status or 'completed',
            })

        for r in expense_rows:
            bank_acc_name = bank_account_map.get(str(r.bank_account_id)) if r.bank_account_id else None
            items.append({
                'id': str(r.id),
                'date': r.expense_date.isoformat() if r.expense_date else None,
                'type': 'expense',
                'reference': r.vendor_payee,
                'description': r.description,
                'method': r.payment_method,
                'bank_account': bank_acc_name,
                'amount': float(r.amount or 0),
                'direction': 'debit',
                'status': 'posted',
            })

        for r in extra_rows:
            bank_acc_name = bank_account_map.get(str(r.bank_account_id)) if r.bank_account_id else None
            items.append({
                'id': str(r.id),
                'date': r.income_date.isoformat() if r.income_date else None,
                'type': 'extra_income',
                'reference': r.payer,
                'description': r.description,
                'method': r.payment_method,
                'bank_account': bank_acc_name,
                'amount': float(r.amount or 0),
                'direction': 'credit',
                'status': 'posted',
            })

        for r in transfer_rows:
            from_name = bank_account_map.get(str(r.from_account_id)) or 'Unknown Account'
            to_name = bank_account_map.get(str(r.to_account_id)) or 'Unknown Account'
            
            # Helper logic to create item dict
            common_data = {
                'id': str(r.id),
                'date': r.transfer_date.isoformat() if r.transfer_date else None,
                'type': 'internal_transfer',
                'reference': r.reference_number,
                'method': 'Transfer',
                'status': 'completed',
            }
            
            # Determine which sides to add
            add_debit = False
            add_credit = False
            
            if bank_account_id and bank_account_id != 'all':
                target_id = uuid.UUID(bank_account_id)
                if r.from_account_id == target_id:
                    add_debit = True
                if r.to_account_id == target_id:
                    add_credit = True
            else:
                add_debit = True
                add_credit = True
                
            if add_debit:
                items.append({
                    **common_data,
                    'description': f"Transfer to {to_name}" + (f" ({r.description})" if r.description else ""),
                    'bank_account': from_name,
                    'amount': float(r.amount or 0),
                    'direction': 'debit',
                })
                
            if add_credit:
                items.append({
                    **common_data,
                    'description': f"Transfer from {from_name}" + (f" ({r.description})" if r.description else ""),
                    'bank_account': to_name,
                    'amount': float(r.amount or 0),
                    'direction': 'credit',
                })

        # Sort by time descending
        items.sort(key=lambda x: (x.get('date') or ''), reverse=True)

        # Return bank accounts for filters - ALWAYS return all bank accounts
        bank_accounts_list = [
            {'id': str(acc.id), 'name': f"{acc.bank_name} - {acc.account_number}"} 
            for acc in bank_accounts
        ]

        # Quick stats for footer (optional; UI computes it too)
        credits = sum(i['amount'] for i in items if i['direction'] == 'credit')
        debits = sum(i['amount'] for i in items if i['direction'] == 'debit')

        return {
            'items': items,
            'bank_accounts': bank_accounts_list,  # This will ALWAYS be populated
            'stats': { 'credits': credits, 'debits': debits, 'net': credits - debits, 'count': len(items) }
        }
    except Exception as e:
        logger.error(f"Error building ledger data: {str(e)}")
        # Even on error, return bank accounts if possible
        try:
            bank_accounts = BankAccount.query.filter_by(company_id=company_id, is_active=True).all()
            bank_accounts_list = [
                {'id': str(acc.id), 'name': f"{acc.bank_name} - {acc.account_number}"} 
                for acc in bank_accounts
            ]
        except:
            bank_accounts_list = []
            
        return { 
            'items': [], 
            'bank_accounts': bank_accounts_list, 
            'stats': { 'credits': 0, 'debits': 0, 'net': 0, 'count': 0 } 
        }