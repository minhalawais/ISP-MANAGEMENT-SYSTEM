from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from datetime import datetime, timedelta, date
import logging
from app import db
from app.models import Customer, Invoice, ServicePlan, User, EmployeeLedger
from app.crud.invoice_crud import generate_invoice_number, add_invoice
import uuid

import os
import atexit

# Auto Invoice Service
from app.services.auto_invoice_service import generate_next_month_invoices

# WhatsApp imports
from app.models import WhatsAppConfig
from app.services.whatsapp_queue_service import WhatsAppQueueService
from app.services.whatsapp_rate_limiter import WhatsAppRateLimiter
from app.services.whatsapp_api_client import WhatsAppAPIClient

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



def process_whatsapp_queue(app=None):
    """
    Process pending WhatsApp messages in queue.
    Sends up to remaining daily quota ordered by priority.
    Runs daily at configured time (default 9:00 AM).
    """
    logger.info(f"Running WhatsApp queue processor: {datetime.now()}")
    
    if not app:
        logger.error("No Flask app provided to process_whatsapp_queue")
        return
    
    with app.app_context():
        try:
            # Get all companies with WhatsApp configured
            configs = WhatsAppConfig.query.filter_by(auto_send_invoices=True).all()
            
            for config in configs:
                company_id = str(config.company_id)
                
                # Check remaining quota
                remaining = WhatsAppRateLimiter.get_remaining_quota(company_id)
                
                if remaining <= 0:
                    logger.info(f"Quota exhausted for company {company_id}")
                    continue
                
                # Get pending messages
                messages = WhatsAppQueueService.get_pending_messages(
                    limit=remaining,
                    company_id=company_id
                )
                
                logger.info(f"Processing {len(messages)} messages for company {company_id}")
                
                # Initialize API client
                client = WhatsAppAPIClient.from_config(company_id)
                
                sent_count = 0
                failed_count = 0
                
                for message in messages:
                    try:
                        # Send message based on media type
                        if message.media_type == 'document':
                            result = client.send_document_message(
                                mobile=message.mobile,
                                document_url=message.media_url,
                                caption=message.message_content,
                                priority=message.priority
                            )
                        elif message.media_type == 'image':
                            result = client.send_image_message(
                                mobile=message.mobile,
                                image_url=message.media_url,
                                caption=message.message_content,
                                priority=message.priority
                            )
                        else:  # text
                            result = client.send_text_message(
                                mobile=message.mobile,
                                message=message.message_content,
                                priority=message.priority
                            )
                        
                        if result['success']:
                            # Update message status to sent
                            WhatsAppQueueService.update_message_status(
                                message_id=str(message.id),
                                status='sent',
                                api_response=result.get('response')
                            )
                            
                            # Increment quota
                            WhatsAppRateLimiter.increment_sent_count(company_id)
                            sent_count += 1
                            
                        else:
                            # Update message status to failed
                            WhatsAppQueueService.update_message_status(
                                message_id=str(message.id),
                                status='failed',
                                error_message=result.get('error')
                            )
                            failed_count += 1
                        
                    except Exception as e:
                        logger.error(f"Error sending message {message.id}: {str(e)}")
                        WhatsAppQueueService.update_message_status(
                            message_id=str(message.id),
                            status='failed',
                            error_message=str(e)
                        )
                        failed_count += 1
                
                logger.info(f"Completed WhatsApp queue processing for company {company_id}: {sent_count} sent, {failed_count} failed")
            
        except Exception as e:
            logger.error(f"Error in WhatsApp queue processing: {str(e)}")

def check_deadline_alerts(app=None):
    """
    Check for invoices with upcoming due dates and enqueue alert messages.
    Runs daily at configured time (default 9:00 AM).
    """
    logger.info(f"Running deadline alerts check: {datetime.now()}")
    
    if not app:
        logger.error("No Flask app provided to check_deadline_alerts")
        return
    
    with app.app_context():
        try:
            # Get all companies with deadline alerts enabled
            configs = WhatsAppConfig.query.filter_by(auto_send_deadline_alerts=True).all()
            
            for config in configs:
                company_id = str(config.company_id)
                days_before = config.deadline_alert_days_before
                
                # Calculate target due date (today + days_before)
                target_date = date.today() + timedelta(days=days_before)
                
                # Find invoices due on target date that are still pending/overdue
                invoices = Invoice.query.filter(
                    Invoice.company_id == company_id,
                    Invoice.due_date == target_date,
                    Invoice.status.in_(['pending', 'partially_paid', 'overdue']),
                    Invoice.is_active == True
                ).all()
                
                logger.info(f"Found {len(invoices)} invoices due in {days_before} days for company {company_id}")
                
                for invoice in invoices:
                    try:
                        # Check if alert already sent for this invoice
                        existing_alert = db.session.query(WhatsAppMessageQueue).filter(
                            WhatsAppMessageQueue.related_invoice_id == invoice.id,
                            WhatsAppMessageQueue.message_type == 'deadline_alert'
                        ).first()
                        
                        if existing_alert:
                            logger.info(f"Alert already sent for invoice {invoice.invoice_number}")
                            continue
                        
                        # Generate alert message
                        customer = invoice.customer
                        message = f"Dear {customer.first_name}, your invoice #{invoice.invoice_number} for Rs.{invoice.total_amount} is due on {invoice.due_date.strftime('%Y-%m-%d')}. Please make payment before the due date."
                        
                        # Enqueue alert message with high priority
                        WhatsAppQueueService.enqueue_message(
                            company_id=company_id,
                            customer_id=str(customer.id),
                            mobile=customer.phone_1,
                            message_content=message,
                            message_type='deadline_alert',
                            priority=config.default_alert_priority,
                            related_invoice_id=str(invoice.id)
                        )
                        
                        logger.info(f"Enqueued deadline alert for invoice {invoice.invoice_number}")
                        
                    except Exception as e:
                        logger.error(f"Error creating deadline alert for invoice {invoice.id}: {str(e)}")
            
        except Exception as e:
            logger.error(f"Error in deadline alerts check: {str(e)}")

def reset_whatsapp_quota(app=None):
    """
    Reset daily WhatsApp quota at midnight.
    """
    logger.info(f"Resetting WhatsApp daily quota: {datetime.now()}")
    
    if not app:
        logger.error("No Flask app provided to reset_whatsapp_quota")
        return
    
    with app.app_context():
        try:
            WhatsAppRateLimiter.reset_daily_quota()
            logger.info("WhatsApp quota reset completed")
            
        except Exception as e:
            logger.error(f"Error resetting WhatsApp quota: {str(e)}")

def accrue_monthly_salaries(app=None):
    """
    Accrue monthly salaries for all active employees.
    This adds the employee's base salary to their current_balance (pending amount).
    Runs on the 1st of every month at 12:01 AM.
    
    The salary accrual creates a positive ledger entry, increasing the employee's
    balance. The user can then create an Expense payment to pay off the balance.
    
    Args:
        app: Flask application instance for creating application context
    """
    logger.info(f"Running monthly salary accrual: {datetime.now()}")
    
    if not app:
        logger.error("No Flask app provided to accrue_monthly_salaries")
        return
    
    with app.app_context():
        try:
            from app.crud import employee_ledger_crud
            
            current_month = datetime.now().strftime('%B %Y')  # e.g., "January 2026"
            
            # Get all active employees with salary > 0
            employees = User.query.filter(
                User.is_active == True,
                User.role.in_(['employee', 'manager', 'technician', 'recovery_agent']),
                User.salary != None,
                User.salary > 0
            ).all()
            
            logger.info(f"Found {len(employees)} employees eligible for salary accrual")
            
            accrued_count = 0
            skipped_count = 0
            
            for employee in employees:
                try:
                    salary_amount = float(employee.salary)
                    
                    # Check if salary already accrued this month (avoid duplicates)
                    month_start = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
                    existing_accrual = EmployeeLedger.query.filter(
                        EmployeeLedger.employee_id == employee.id,
                        EmployeeLedger.transaction_type == 'salary_accrual',
                        EmployeeLedger.created_at >= month_start
                    ).first()
                    
                    if existing_accrual:
                        logger.info(f"Salary already accrued for {employee.first_name} {employee.last_name} this month")
                        skipped_count += 1
                        continue
                    
                    # Add ledger entry for salary accrual (POSITIVE amount - adds to balance)
                    employee_ledger_crud.add_ledger_entry(
                        employee_id=str(employee.id),
                        transaction_type='salary_accrual',
                        amount=salary_amount,  # Positive to increase balance (what company owes)
                        description=f"Monthly Salary for {current_month}",
                        company_id=str(employee.company_id),
                        reference_id=None
                    )
                    
                    logger.info(f"Accrued salary of PKR {salary_amount:,.2f} for {employee.first_name} {employee.last_name}")
                    accrued_count += 1
                    
                except Exception as e:
                    logger.error(f"Error accruing salary for employee {employee.id}: {str(e)}")
            
            logger.info(f"Monthly salary accrual completed: {accrued_count} accrued, {skipped_count} skipped (already done)")
            
        except Exception as e:
            logger.error(f"Error in monthly salary accrual: {str(e)}")

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

    

    
    # WhatsApp Queue Processing Job - Run daily at 9:00 AM PKT
    scheduler.add_job(
        func=process_whatsapp_queue,
        args=[app],
        trigger=CronTrigger(hour=20, minute=14),
        id='whatsapp_queue_job',
        name='Process WhatsApp message queue',
        replace_existing=True
    )
    
    # WhatsApp Deadline Alerts Job - Run daily at 9:00 AM PKT (same time as queue processing)
    scheduler.add_job(
        func=check_deadline_alerts,
        args=[app],
        trigger=CronTrigger(hour=9, minute=0),
        id='whatsapp_deadline_alerts_job',
        name='Check and enqueue deadline alerts',
        replace_existing=True
    )
    
    # WhatsApp Quota Reset Job - Run daily at midnight
    scheduler.add_job(
        func=reset_whatsapp_quota,
        args=[app],
        trigger=CronTrigger(hour=0, minute=0),
        id='whatsapp_quota_reset_job',
        name='Reset WhatsApp daily quota',
        replace_existing=True
    )
    
    # ============================================
    # MONTHLY INVOICE GENERATION JOB
    # Runs on 25th of every month at 1:00 AM
    # Generates next month's invoices for all active customers
    # ============================================
    scheduler.add_job(
        func=generate_next_month_invoices,
        args=[app],
        trigger=CronTrigger(day=25, hour=1, minute=0),
        id='monthly_invoice_generation_job',
        name='Generate next month invoices (25th)',
        replace_existing=True
    )
    
    # ============================================
    # MONTHLY SALARY ACCRUAL JOB
    # Runs on 1st of every month at 12:01 AM
    # Adds employee salaries to their pending balance
    # Users can then create Expense payments to pay salaries
    # ============================================
    scheduler.add_job(
        func=accrue_monthly_salaries,
        args=[app],
        trigger=CronTrigger(day=1, hour=0, minute=1),
        id='monthly_salary_accrual_job',
        name='Accrue monthly salaries (1st)',
        replace_existing=True
    )
    
    # Start the scheduler
    scheduler.start()
    logger.info("Background scheduler started with jobs:")
    for job in scheduler.get_jobs():
        logger.info(f"  - {job.name} (next run: {job.next_run_time})")
    
    # Shut down the scheduler when the process exits (not on request teardown)
    def shutdown_scheduler():
        if scheduler and scheduler.running:
            logger.info("Shutting down background scheduler...")
            scheduler.shutdown(wait=False)  # Do not wait for jobs to complete
    
    atexit.register(shutdown_scheduler)
