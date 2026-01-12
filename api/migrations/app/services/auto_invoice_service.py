# ============================================
# AUTOMATIC INVOICE GENERATION MODULE
# ============================================
# This module provides automatic monthly invoice generation for ISP customers.
# 
# Implementation Strategy (Hybrid Approach):
# 1. Monthly Batch (25th): Generate next month's invoices for all active customers
# 2. Customer Creation Hook: If customer created on/after 25th, generate their invoice immediately
#
# Key Features:
# - Multi-package support via CustomerPackage model
# - Line items for each package
# - Due date based on customer's recharge_date
# - Skip new customers (created this month) in batch run
# - Duplicate prevention

from datetime import datetime, timedelta, date
from calendar import monthrange
import logging
import uuid

logger = logging.getLogger(__name__)


def get_next_month_dates(reference_date=None):
    """
    Calculate next month's billing period dates.
    
    Returns:
        tuple: (billing_start_date, billing_end_date, target_month, target_year)
    """
    if reference_date is None:
        reference_date = datetime.now().date()
    
    # Calculate next month
    if reference_date.month == 12:
        next_month = 1
        next_year = reference_date.year + 1
    else:
        next_month = reference_date.month + 1
        next_year = reference_date.year
    
    billing_start_date = date(next_year, next_month, 1)
    _, last_day = monthrange(next_year, next_month)
    billing_end_date = date(next_year, next_month, last_day)
    
    return billing_start_date, billing_end_date, next_month, next_year


def calculate_due_date(recharge_day, target_month, target_year):
    """
    Calculate due date based on customer's recharge day.
    If recharge_day exceeds days in month, use last day of month.
    
    Args:
        recharge_day: Day of month (1-31)
        target_month: Target month number
        target_year: Target year
    
    Returns:
        date: Due date for the invoice
    """
    _, last_day = monthrange(target_year, target_month)
    actual_day = min(recharge_day, last_day)
    return date(target_year, target_month, actual_day)


def generate_invoice_for_customer(customer, billing_start_date, billing_end_date, target_month, target_year, db, Invoice, InvoiceLineItem, CustomerPackage, generate_invoice_number):
    """
    Generate a single invoice for a customer with all their active packages.
    
    Args:
        customer: Customer object
        billing_start_date: Start of billing period
        billing_end_date: End of billing period
        target_month: Target month number
        target_year: Target year
        db: Database session
        Invoice: Invoice model
        InvoiceLineItem: InvoiceLineItem model
        CustomerPackage: CustomerPackage model
        generate_invoice_number: Function to generate invoice number
    
    Returns:
        Invoice object or None if failed
    """
    try:
        # Get customer's active packages
        customer_packages = CustomerPackage.query.filter(
            CustomerPackage.customer_id == customer.id,
            CustomerPackage.is_active == True
        ).all()
        
        if not customer_packages:
            logger.warning(f"No active packages for customer {customer.id} ({customer.first_name} {customer.last_name})")
            return None
        
        # Calculate due date based on recharge_date
        if customer.recharge_date:
            recharge_day = customer.recharge_date.day
        else:
            recharge_day = 1  # Default to 1st if no recharge date
        
        due_date = calculate_due_date(recharge_day, target_month, target_year)
        
        # Calculate totals from all packages
        subtotal = 0.0
        package_details = []
        
        for cp in customer_packages:
            if cp.service_plan:
                price = float(cp.service_plan.price) if cp.service_plan.price else 0.0
                subtotal += price
                package_details.append({
                    'customer_package_id': cp.id,
                    'description': cp.service_plan.name,
                    'unit_price': price,
                    'line_total': price
                })
        
        if subtotal == 0:
            logger.warning(f"Zero subtotal for customer {customer.id} - skipping")
            return None
        
        # Apply customer discount if any
        discount_percentage = 0.0
        if customer.discount_amount and subtotal > 0:
            discount_percentage = (float(customer.discount_amount) / subtotal) * 100
        
        discount_value = subtotal * (discount_percentage / 100)
        total_amount = subtotal - discount_value
        
        # Create invoice
        invoice = Invoice(
            invoice_number=generate_invoice_number(str(customer.company_id)),
            company_id=customer.company_id,
            customer_id=customer.id,
            billing_start_date=billing_start_date,
            billing_end_date=billing_end_date,
            due_date=due_date,
            subtotal=subtotal,
            discount_percentage=discount_percentage,
            total_amount=total_amount,
            invoice_type='subscription',
            status='pending',
            notes=f"Auto-generated invoice for {billing_start_date.strftime('%B %Y')}",
            is_active=True
        )
        
        db.session.add(invoice)
        db.session.flush()  # Get invoice ID
        
        # Create line items for each package
        for pkg_detail in package_details:
            line_item = InvoiceLineItem(
                invoice_id=invoice.id,
                customer_package_id=pkg_detail['customer_package_id'],
                item_type='package',
                description=pkg_detail['description'],
                quantity=1,
                unit_price=pkg_detail['unit_price'],
                discount_amount=0,
                line_total=pkg_detail['line_total']
            )
            db.session.add(line_item)
        
        db.session.commit()
        
        logger.info(f"Generated invoice {invoice.invoice_number} for customer {customer.first_name} {customer.last_name} - Amount: {total_amount}")
        return invoice
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error generating invoice for customer {customer.id}: {str(e)}")
        return None


def generate_next_month_invoices(app=None):
    """
    Generate invoices for ALL active customers for NEXT month.
    Runs on 25th of each month.
    
    - Skips customers created in the current month (new customers)
    - Skips customers without recharge_date set
    - Skips if invoice already exists for next month
    - Creates line items for each active package
    - Sets due date based on customer's recharge_date
    
    Args:
        app: Flask application instance
    """
    logger.info(f"Running monthly invoice generation for next month: {datetime.now()}")
    
    if not app:
        logger.error("No Flask app provided to generate_next_month_invoices")
        return
    
    with app.app_context():
        from app import db
        from app.models import Customer, Invoice, InvoiceLineItem, CustomerPackage
        from app.crud.invoice_crud import generate_invoice_number
        
        today = datetime.now().date()
        current_month_start = date(today.year, today.month, 1)
        
        # Get next month billing period
        billing_start_date, billing_end_date, target_month, target_year = get_next_month_dates(today)
        
        logger.info(f"Generating invoices for billing period: {billing_start_date} to {billing_end_date}")
        
        try:
            # Get all active customers with recharge_date set
            # Exclude customers created this month (they're new)
            customers = Customer.query.filter(
                Customer.is_active == True,
                Customer.recharge_date != None,
                Customer.created_at < current_month_start  # Skip new customers
            ).all()
            
            logger.info(f"Found {len(customers)} eligible customers for invoice generation")
            
            generated_count = 0
            skipped_count = 0
            error_count = 0
            
            for customer in customers:
                try:
                    # Check if invoice already exists for next month
                    existing_invoice = Invoice.query.filter(
                        Invoice.customer_id == customer.id,
                        Invoice.billing_start_date == billing_start_date,
                        Invoice.invoice_type == 'subscription',
                        Invoice.is_active == True
                    ).first()
                    
                    if existing_invoice:
                        logger.debug(f"Invoice already exists for customer {customer.id} for {billing_start_date.strftime('%B %Y')}")
                        skipped_count += 1
                        continue
                    
                    # Generate invoice
                    invoice = generate_invoice_for_customer(
                        customer=customer,
                        billing_start_date=billing_start_date,
                        billing_end_date=billing_end_date,
                        target_month=target_month,
                        target_year=target_year,
                        db=db,
                        Invoice=Invoice,
                        InvoiceLineItem=InvoiceLineItem,
                        CustomerPackage=CustomerPackage,
                        generate_invoice_number=generate_invoice_number
                    )
                    
                    if invoice:
                        generated_count += 1
                    else:
                        error_count += 1
                        
                except Exception as e:
                    logger.error(f"Error processing customer {customer.id}: {str(e)}")
                    error_count += 1
            
            logger.info(f"Invoice generation completed: Generated={generated_count}, Skipped={skipped_count}, Errors={error_count}")
            
        except Exception as e:
            logger.error(f"Error in monthly invoice generation: {str(e)}")


def generate_invoice_for_new_customer(customer_id, app=None):
    """
    Generate next month's invoice for a newly created customer.
    Called from customer creation if customer is created on/after 25th of month.
    
    Args:
        customer_id: UUID of the customer
        app: Flask application instance (optional - uses current context if not provided)
    """
    logger.info(f"Generating invoice for new customer {customer_id}")
    
    def _generate():
        from app import db
        from app.models import Customer, Invoice, InvoiceLineItem, CustomerPackage
        from app.crud.invoice_crud import generate_invoice_number
        
        customer = Customer.query.get(customer_id)
        if not customer:
            logger.error(f"Customer {customer_id} not found")
            return None
        
        if not customer.is_active:
            logger.warning(f"Customer {customer_id} is not active")
            return None
        
        today = datetime.now().date()
        billing_start_date, billing_end_date, target_month, target_year = get_next_month_dates(today)
        
        # Check if invoice already exists
        existing_invoice = Invoice.query.filter(
            Invoice.customer_id == customer.id,
            Invoice.billing_start_date == billing_start_date,
            Invoice.invoice_type == 'subscription',
            Invoice.is_active == True
        ).first()
        
        if existing_invoice:
            logger.info(f"Invoice already exists for customer {customer_id} for {billing_start_date.strftime('%B %Y')}")
            return existing_invoice
        
        return generate_invoice_for_customer(
            customer=customer,
            billing_start_date=billing_start_date,
            billing_end_date=billing_end_date,
            target_month=target_month,
            target_year=target_year,
            db=db,
            Invoice=Invoice,
            InvoiceLineItem=InvoiceLineItem,
            CustomerPackage=CustomerPackage,
            generate_invoice_number=generate_invoice_number
        )
    
    if app:
        with app.app_context():
            return _generate()
    else:
        # Assume we're already in app context
        return _generate()


def should_generate_invoice_on_creation():
    """
    Check if invoice should be generated immediately on customer creation.
    Returns True if today >= 25th of the month.
    """
    return datetime.now().day >= 25
