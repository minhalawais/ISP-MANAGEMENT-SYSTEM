from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from datetime import datetime, timedelta
import logging
from app import db
from app.models import Customer, Invoice, ServicePlan
from app.crud.invoice_crud import generate_invoice_number, add_invoice
import uuid

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global scheduler instance
scheduler = None

def generate_automatic_invoices(app=None):
    """
    Generate invoices for customers whose recharge date is today.
    This function runs daily and checks all active customers.
    
    Args:
        app: Flask application instance for creating application context
    """
    logger.info(f"Running automatic invoice generation for date: {datetime.now().date()}")
    
    if app:
        with app.app_context():
            _process_invoices()
    else:
        logger.error("No Flask app provided to generate_automatic_invoices")

def _process_invoices():
    """
    Internal function to process invoices within an application context
    """
    today = datetime.now().date()
    
    try:
        # Get all active customers whose recharge date is today
        customers = Customer.query.filter(
            Customer.is_active == True,
            Customer.recharge_date != None,
            db.func.extract('day', Customer.recharge_date) == today.day,
            db.func.extract('month', Customer.recharge_date) == today.month
        ).all()
        
        logger.info(f"Found {len(customers)} customers with recharge date today")
        
        # Check if invoices have already been generated this month for these customers
        current_month_start = datetime(today.year, today.month, 1).date()
        next_month_start = (datetime(today.year, today.month, 1) + timedelta(days=32)).replace(day=1).date()
        
        invoice_count = 0
        
        for customer in customers:
            # Check if an invoice already exists for this customer in the current month
            existing_invoice = Invoice.query.filter(
                Invoice.customer_id == customer.id,
                Invoice.billing_start_date >= current_month_start,
                Invoice.billing_start_date < next_month_start,
                Invoice.invoice_type == 'subscription'
            ).first()
            
            if existing_invoice:
                logger.info(f"Invoice already exists for customer {customer.id} ({customer.first_name} {customer.last_name}) this month")
                continue
            
            try:
                # Get the customer's service plan
                service_plan = ServicePlan.query.get(customer.service_plan_id)
                if not service_plan:
                    logger.error(f"Service plan not found for customer {customer.id}")
                    continue
                
                # Calculate billing period
                billing_start_date = today
                # Calculate the end date (same day next month - 1 day)
                next_month = (today.replace(day=1) + timedelta(days=32)).replace(day=1)
                billing_end_date = (next_month - timedelta(days=1))
                
                # Calculate due date (7 days from today)
                due_date = today + timedelta(days=7)
                
                # Calculate amounts
                subtotal = float(service_plan.price)
                discount_percentage = 0
                if customer.discount_amount:
                    discount_percentage = (float(customer.discount_amount) / subtotal) * 100
                
                total_amount = subtotal - (subtotal * discount_percentage / 100)
                
                # Create invoice data
                invoice_data = {
                    'company_id': str(customer.company_id),
                    'customer_id': str(customer.id),
                    'billing_start_date': billing_start_date.isoformat(),
                    'billing_end_date': billing_end_date.isoformat(),
                    'due_date': due_date.isoformat(),
                    'subtotal': subtotal,
                    'discount_percentage': discount_percentage,
                    'total_amount': total_amount,
                    'invoice_type': 'subscription',
                    'notes': f"Automatically generated invoice for {service_plan.name} plan"
                }
                
                # Use the system user ID for generated_by
                system_user_id = "00000000-0000-0000-0000-000000000000"  # Replace with your actual system user ID
                
                # Add the invoice
                new_invoice = add_invoice(
                    invoice_data, 
                    system_user_id, 
                    'system', 
                    '127.0.0.1',  # IP address
                    'Automatic Invoice Generator'  # User agent
                )
                
                logger.info(f"Successfully generated invoice {new_invoice.invoice_number} for customer {customer.id} ({customer.first_name} {customer.last_name})")
                invoice_count += 1
                
            except Exception as e:
                logger.error(f"Error generating invoice for customer {customer.id}: {str(e)}")
        
        logger.info(f"Automatic invoice generation completed. Generated {invoice_count} invoices.")
    except Exception as e:
        logger.error(f"Error in invoice generation process: {str(e)}")

def init_scheduler(app):
    """
    Initialize the background scheduler with the Flask app context.
    
    Args:
        app: Flask application instance
    """
    if not app:
        logger.error("No Flask app provided to init_scheduler")
        return
    
    global scheduler
    scheduler = BackgroundScheduler()
    
    # Run the job every day at 1:00 AM
    scheduler.add_job(
        func=generate_automatic_invoices,
        args=[app],  # Pass the Flask app to the job
        trigger=CronTrigger(hour=1, minute=0),
        id='generate_invoices_job',
        name='Generate invoices for customers with recharge date today',
        replace_existing=True
    )
    
    # Start the scheduler
    scheduler.start()
    
    # Shut down the scheduler when the app is shutting down
    @app.teardown_appcontext
    def shutdown_scheduler(exception=None):
        if scheduler and scheduler.running:
            scheduler.shutdown(wait=False)  # Do not wait for jobs to complete