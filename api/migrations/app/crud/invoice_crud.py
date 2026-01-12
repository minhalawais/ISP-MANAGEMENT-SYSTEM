from app import db
from app.models import Invoice, Customer, Payment, ServicePlan, User, CustomerPackage, InvoiceLineItem, InventoryItem
from app.utils.logging_utils import log_action
from app.services.whatsapp_invoice_sender import WhatsAppInvoiceSender
from app.crud.inventory_crud import log_inventory_transaction
from app.crud import employee_ledger_crud
import uuid
from sqlalchemy.exc import SQLAlchemyError, IntegrityError, DatabaseError
import logging
from sqlalchemy.orm import joinedload
from datetime import datetime, timedelta
from sqlalchemy import and_, or_, asc, desc, func
logger = logging.getLogger(__name__)




class InvoiceError(Exception):
    """Custom exception for invoice operations"""
    pass

class PaymentError(Exception):
    """Custom exception for payment operations"""
    pass

def get_all_invoices(company_id, user_role, employee_id):
    try:
        base = db.session.query(Invoice).options(joinedload(Invoice.customer))
        base = _apply_role_scope(base, company_id, user_role, employee_id)
        invoices = base.order_by(Invoice.created_at.desc()).all()
        return [
            {
                **invoice_to_dict(invoice),
                "internet_id": invoice.customer.internet_id if invoice.customer else None
            }
            for invoice in invoices
        ]
    except Exception as e:
        logger.error(f"Error listing invoices: {str(e)}")
        raise InvoiceError("Failed to list invoices")

def invoice_to_dict(invoice):
    return {
        'id': str(invoice.id),
        'invoice_number': invoice.invoice_number,
        'company_id': str(invoice.company_id),
        'customer_id': str(invoice.customer_id),
        'customer_name': f"{invoice.customer.first_name} {invoice.customer.last_name}" if invoice.customer else "N/A",
        'customer_internet_id': invoice.customer.internet_id if invoice.customer else "N/A",
        'customer_phone': invoice.customer.phone_1 if invoice.customer else "",
        'phone_1': invoice.customer.phone_1 if invoice.customer else "",
        'phone_2': invoice.customer.phone_2 if invoice.customer else "",
        'billing_start_date': invoice.billing_start_date.isoformat(),
        'billing_end_date': invoice.billing_end_date.isoformat(),
        'due_date': invoice.due_date.isoformat(),
        'subtotal': float(invoice.subtotal),
        'discount_percentage': float(invoice.discount_percentage),
        'total_amount': float(invoice.total_amount),
        'invoice_type': invoice.invoice_type,
        'notes': invoice.notes,
        'generated_by': str(invoice.generated_by),
        'status': invoice.status,
        'is_active': invoice.is_active
    }

def generate_invoice_number():
    try:
        year = datetime.now().year
        last_invoice = Invoice.query.order_by(Invoice.created_at.desc()).first()
        if last_invoice and last_invoice.invoice_number.startswith(f'INV-{year}-'):
            try:
                last_number = int(last_invoice.invoice_number.split('-')[-1])
                new_number = last_number + 1
            except (ValueError, IndexError) as e:
                logger.error(f"Error parsing invoice number: {str(e)}")
                raise InvoiceError("Failed to generate invoice number")
        else:
            new_number = 1
        return f'INV-{year}-{new_number:04d}'
    except Exception as e:
        logger.error(f"Error generating invoice number: {str(e)}")
        raise InvoiceError("Failed to generate invoice number")

def validate_invoice_data_by_type(invoice_type, data):
    """
    Validate invoice data based on invoice type
    """
    errors = []
    
    if invoice_type == 'subscription':
        if not data.get('billing_start_date'):
            errors.append("Billing start date is required for subscription invoices")
        if not data.get('billing_end_date'):
            errors.append("Billing end date is required for subscription invoices")
    else:
        # For non-subscription invoices, clear subscription-specific fields
        if 'billing_start_date' in data:
            data.pop('billing_start_date', None)
        if 'billing_end_date' in data:
            data.pop('billing_end_date', None)
        if 'discount_percentage' in data:
            data.pop('discount_percentage', None)
        if 'discount_amount' in data:
            data.pop('discount_amount', None)
    
    return errors, data

def add_invoice(data, current_user_id, user_role, ip_address, user_agent):
    try:
        # Validate required fields
        required_fields = ['company_id', 'customer_id', 'due_date', 'subtotal', 'total_amount', 'invoice_type']
        invoice_type = data.get('invoice_type')

        if invoice_type == 'subscription':
            required_fields.extend(['billing_start_date', 'billing_end_date'])

        for field in required_fields:
            if field not in data:
                raise ValueError(f"Missing required field: {field}")

        # Validate type-specific and clean data
        validation_errors, cleaned_data = validate_invoice_data_by_type(invoice_type, data.copy())
        if validation_errors:
            raise ValueError("; ".join(validation_errors))

        # Parse dates
        date_fields = ['due_date']
        if invoice_type == 'subscription':
            date_fields.extend(['billing_start_date', 'billing_end_date'])

        parsed_dates = {}
        for field in date_fields:
            if field in cleaned_data:
                try:
                    parsed_dates[field] = datetime.fromisoformat(cleaned_data[field].rstrip('Z'))
                except ValueError:
                    raise ValueError(f"Invalid date format for {field}")

        company_id = uuid.UUID(cleaned_data['company_id'])

        # Base invoice payload
        invoice_data = {
            'company_id': company_id,
            'invoice_number': generate_invoice_number(),
            'customer_id': uuid.UUID(cleaned_data['customer_id']),
            'due_date': parsed_dates['due_date'],
            'subtotal': cleaned_data['subtotal'],
            'total_amount': cleaned_data['total_amount'],
            'invoice_type': invoice_type,
            'notes': cleaned_data.get('notes'),
            'generated_by': current_user_id,
            'status': 'pending',
            'is_active': True
        }

        if invoice_type == 'subscription':
            invoice_data['billing_start_date'] = parsed_dates['billing_start_date']
            invoice_data['billing_end_date'] = parsed_dates['billing_end_date']
            invoice_data['discount_percentage'] = cleaned_data.get('discount_percentage', 0)
        else:
            invoice_data['billing_start_date'] = parsed_dates['due_date']
            invoice_data['billing_end_date'] = parsed_dates['due_date']
            invoice_data['discount_percentage'] = 0

        new_invoice = Invoice(**invoice_data)
        db.session.add(new_invoice)
        db.session.flush()  # Get invoice ID before creating line items
        
        # Handle equipment invoice: create line items and deduct inventory
        if invoice_type == 'equipment':
            inventory_items = cleaned_data.get('inventory_items', [])
            
            # Parse JSON string if it's a string (comes from frontend as JSON)
            if isinstance(inventory_items, str):
                import json
                inventory_items = json.loads(inventory_items)
            
            if not inventory_items:
                raise ValueError("Equipment invoice must have at least one inventory item")
            
            for item_data in inventory_items:
                item_id = uuid.UUID(item_data['id']) if isinstance(item_data['id'], str) else item_data['id']
                qty = item_data.get('quantity', 1)
                
                item = InventoryItem.query.get(item_id)
                if not item:
                    raise ValueError(f"Inventory item {item_id} not found")
                if item.quantity < qty:
                    raise ValueError(f"Insufficient stock for {item.item_type}. Available: {item.quantity}, Requested: {qty}")
                
                # Deduct from inventory
                item.quantity -= qty
                
                # Log transaction
                log_inventory_transaction(
                    item.id, 'sale', qty,
                    f"Sold via invoice {new_invoice.invoice_number}",
                    current_user_id
                )
                
                # Create line item
                line_item = InvoiceLineItem(
                    invoice_id=new_invoice.id,
                    inventory_item_id=item.id,
                    item_type='equipment',
                    description=f"{item.item_type}",
                    quantity=qty,
                    unit_price=item.unit_price or 0,
                    discount_amount=0,
                    line_total=(item.unit_price or 0) * qty
                )
                db.session.add(line_item)
        
        db.session.commit()

        # prepare log
        log_data = cleaned_data.copy()
        for field in date_fields:
            if field in log_data:
                log_data[field] = parsed_dates[field].isoformat()
        # Log the normalized dates for non-subscription
        if invoice_type != 'subscription':
            log_data['billing_start_date'] = invoice_data['billing_start_date'].isoformat()
            log_data['billing_end_date'] = invoice_data['billing_end_date'].isoformat()

        log_action(
            current_user_id,
            'CREATE',
            'invoices',
            new_invoice.id,
            None,
            log_data,
            ip_address,
            user_agent,
            str(company_id)
        )

        # Send WhatsApp notification if auto-send is enabled
        try:
            WhatsAppInvoiceSender.send_invoice_notification(new_invoice, str(company_id))
        except Exception as e:
            logger.error(f"Failed to send WhatsApp notification for invoice {new_invoice.id}: {str(e)}")
            # Don't raise - invoice is already created successfully



        return new_invoice
    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        raise InvoiceError(str(e))
    except Exception as e:
        logger.error(f"Error adding invoice: {str(e)}")
        db.session.rollback()
        raise InvoiceError("Failed to create invoice")

def update_invoice(id, data, company_id, user_role, current_user_id, ip_address, user_agent):
    try:
        invoice = get_invoice_by_id(id, company_id, user_role)

        if not invoice:
            raise ValueError(f"Invoice with id {id} not found")

        old_values = invoice_to_dict(invoice)

        # Prepare data for logging by converting datetime objects to strings
        log_data = data.copy()
        date_fields = ['billing_start_date', 'billing_end_date', 'due_date']
        for field in date_fields:
            if field in log_data:
                try:
                    # Handle both string and datetime objects
                    if isinstance(log_data[field], str):
                        parsed_date = datetime.fromisoformat(log_data[field].rstrip('Z'))
                        log_data[field] = parsed_date.isoformat()
                    elif isinstance(log_data[field], datetime):
                        log_data[field] = log_data[field].isoformat()
                except ValueError:
                    raise ValueError(f"Invalid date format for {field}")

        # Validate UUID fields
        if 'customer_id' in data:
            try:
                data['customer_id'] = uuid.UUID(data['customer_id'])
            except ValueError:
                raise ValueError("Invalid customer_id format")

        if 'generated_by' in data:
            try:
                data['generated_by'] = uuid.UUID(data['generated_by'])
            except ValueError:
                raise ValueError("Invalid generated_by format")

        # Update fields
        fields_to_update = [
            'customer_id', 'billing_start_date', 'billing_end_date', 
            'due_date', 'subtotal', 'discount_percentage', 'total_amount',
            'invoice_type', 'notes', 'generated_by', 'is_active'
        ]
        
        for field in fields_to_update:
            if field in data:
                # Handle date fields
                if field in date_fields and isinstance(data[field], str):
                    try:
                        data[field] = datetime.fromisoformat(data[field].rstrip('Z'))
                    except ValueError:
                        raise ValueError(f"Invalid date format for {field}")
                
                setattr(invoice, field, data[field])

        db.session.commit()

        log_action(
            current_user_id,
            'UPDATE',
            'invoices',
            invoice.id,
            old_values,
            log_data,
            ip_address,
            user_agent,
            company_id
        )

        return invoice
    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        raise InvoiceError(str(e))
    except Exception as e:
        logger.error(f"Error updating invoice {id}: {str(e)}")
        db.session.rollback()
        raise InvoiceError("Failed to update invoice")
    
def delete_invoice(id, company_id, user_role, current_user_id, ip_address, user_agent):
    try:
        invoice = get_invoice_by_id(id, company_id, user_role)

        if not invoice:
            raise ValueError(f"Invoice with id {id} not found")

        # Check for related payments and delete them first
        payments = Payment.query.filter_by(invoice_id=id).all()
        if payments:
            # Delete all related payments
            for payment in payments:
                # Log payment deletion
                payment_old_values = {
                    'id': str(payment.id),
                    'invoice_id': str(payment.invoice_id),
                    'amount': float(payment.amount),
                    'payment_date': payment.payment_date.isoformat(),
                    'payment_method': payment.payment_method,
                    'status': payment.status
                }
                
                log_action(
                    current_user_id,
                    'DELETE',
                    'payments',
                    payment.id,
                    payment_old_values,
                    None,
                    ip_address,
                    user_agent,
                    company_id
                )
                db.session.delete(payment)

        old_values = invoice_to_dict(invoice)

        db.session.delete(invoice)
        db.session.commit()

        log_action(
            current_user_id,
            'DELETE',
            'invoices',
            invoice.id,
            old_values,
            None,
            ip_address,
            user_agent,
            company_id
        )

        return True
    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        raise InvoiceError(str(e))
    except Exception as e:
        logger.error(f"Error deleting invoice {id}: {str(e)}")
        db.session.rollback()
        raise InvoiceError("Failed to delete invoice")

def get_invoice_by_id(id, company_id, user_role):
    try:
        base = db.session.query(Invoice).options(joinedload(Invoice.customer))
        base = _apply_role_scope(base, company_id, user_role, None)
        invoice = base.filter(Invoice.id == id).first()

        return invoice
    except Exception as e:
        logger.error(f"Error getting invoice {id}: {str(e)}")
        raise InvoiceError("Failed to retrieve invoice")


def generate_monthly_invoices(company_id, user_role, current_user_id, ip_address, user_agent):
    """
    Generate monthly invoices for customers whose recharge date is today.
    
    Args:
        company_id: UUID of the company
        user_role: Role of the current user
        current_user_id: UUID of the current user
        ip_address: IP address of the request
        user_agent: User agent of the request
        
    Returns:
        Dictionary with statistics about the operation:
        - generated: Number of invoices generated
        - skipped: Number of invoices skipped (already exist)
        - total_customers: Total number of customers processed
    """
    try:
        today = datetime.now().date()
        
        # Get all active customers whose recharge date is today
        customers = Customer.query.filter(
            Customer.is_active == True,
            Customer.company_id == company_id,
            Customer.recharge_date != None,
            db.func.extract('day', Customer.recharge_date) == today.day,
            db.func.extract('month', Customer.recharge_date) == today.month
        ).all()
        
        logger.info(f"Found {len(customers)} customers with recharge date today for company {company_id}")
        
        # Check if invoices have already been generated this month
        current_month_start = datetime(today.year, today.month, 1).date()
        next_month_start = (datetime(today.year, today.month, 1) + timedelta(days=32)).replace(day=1).date()
        
        invoice_count = 0
        skipped_count = 0
        error_count = 0
        
        for customer in customers:
            try:
                # Check if an invoice already exists for this customer in the current month
                existing_invoice = Invoice.query.filter(
                    Invoice.customer_id == customer.id,
                    Invoice.billing_start_date >= current_month_start,
                    Invoice.billing_start_date < next_month_start,
                    Invoice.invoice_type == 'subscription'
                ).first()
                
                if existing_invoice:
                    logger.info(f"Invoice already exists for customer {customer.id} this month")
                    skipped_count += 1
                    continue
                
                # Get the customer's service plans via CustomerPackage (use first for legacy compatibility)
                customer_packages = CustomerPackage.query.filter_by(
                    customer_id=customer.id,
                    is_active=True
                ).all()
                if not customer_packages:
                    logger.error(f"No active packages found for customer {customer.id}")
                    error_count += 1
                    continue
                
                # Get first service plan for legacy flow (bulk invoicing uses generate_bulk_monthly_invoices)
                first_package = customer_packages[0]
                service_plan = ServicePlan.query.get(first_package.service_plan_id)
                if not service_plan:
                    logger.error(f"Service plan not found for customer {customer.id}")
                    error_count += 1
                    continue
                
                # Calculate billing period
                billing_start_date = today
                next_month = (today.replace(day=1) + timedelta(days=32)).replace(day=1)
                billing_end_date = (next_month - timedelta(days=1))
                
                # Calculate due date (5 days from invoice start date)
                due_date = billing_start_date + timedelta(days=5)
                
                # Calculate amounts
                subtotal = float(service_plan.price)
                discount_percentage = 0
                if customer.discount_amount:
                    discount_percentage = (float(customer.discount_amount) / subtotal) * 100
                
                total_amount = subtotal - (subtotal * discount_percentage / 100)
                
                # Create invoice data
                invoice_data = {
                    'company_id': str(company_id),
                    'customer_id': str(customer.id),
                    'billing_start_date': billing_start_date.isoformat(),
                    'billing_end_date': billing_end_date.isoformat(),
                    'due_date': due_date.isoformat(),
                    'subtotal': subtotal,
                    'discount_percentage': discount_percentage,
                    'total_amount': total_amount,
                    'invoice_type': 'subscription',
                    'notes': f"Manually generated invoice for {service_plan.name} plan"
                }
                
                # Add the invoice
                new_invoice = add_invoice(
                    invoice_data, 
                    current_user_id, 
                    user_role, 
                    ip_address,
                    user_agent
                )
                
                invoice_count += 1
                logger.info(f"Generated invoice for customer {customer.id} ({customer.first_name} {customer.last_name})")
                
                # WhatsApp notification is already sent by add_invoice() function
                # No need to call it again here
                
            except Exception as e:
                logger.error(f"Error generating invoice for customer {customer.id}: {str(e)}")
                error_count += 1
        
        logger.info(f"Monthly invoice generation completed. Generated: {invoice_count}, Skipped: {skipped_count}, Errors: {error_count}")
        
        return {
            'generated': invoice_count,
            'skipped': skipped_count,
            'errors': error_count,
            'total_customers': len(customers)
        }
        
    except Exception as e:
        logger.error(f"Error in generate_monthly_invoices: {str(e)}")
        raise InvoiceError(f"Failed to generate monthly invoices: {str(e)}")

def _get_pending_invoices_for_customer(customer_id, exclude_invoice_id=None):
    """
    Get all pending and partially_paid invoices for a customer.
    Excludes the current invoice being viewed.
    """
    try:
        query = Invoice.query.filter(
            Invoice.customer_id == customer_id,
            Invoice.is_active == True,
            Invoice.status.in_(['pending', 'partially_paid', 'overdue'])
        )
        
        if exclude_invoice_id:
            query = query.filter(Invoice.id != exclude_invoice_id)
        
        pending_invoices = query.order_by(Invoice.due_date.asc()).all()
        
        result = []
        total_pending_amount = 0
        
        for inv in pending_invoices:
            # Calculate remaining amount for this invoice
            paid_amount = sum(
                p.amount for p in Payment.query.filter_by(
                    invoice_id=inv.id, 
                    is_active=True,
                    status='paid'
                ).all()
            )
            remaining = float(inv.total_amount) - float(paid_amount)
            total_pending_amount += remaining
            
            result.append({
                'id': str(inv.id),
                'invoice_number': inv.invoice_number,
                'billing_start_date': inv.billing_start_date.isoformat() if inv.billing_start_date else None,
                'billing_end_date': inv.billing_end_date.isoformat() if inv.billing_end_date else None,
                'due_date': inv.due_date.isoformat() if inv.due_date else None,
                'total_amount': float(inv.total_amount),
                'paid_amount': float(paid_amount),
                'remaining_amount': remaining,
                'status': inv.status,
                'invoice_type': inv.invoice_type
            })
        
        return {
            'count': len(result),
            'total_pending_amount': total_pending_amount,
            'invoices': result
        }
    except Exception as e:
        logger.error(f"Error getting pending invoices for customer {customer_id}: {str(e)}")
        return {'count': 0, 'total_pending_amount': 0, 'invoices': []}

def get_enhanced_invoice_by_id(id, company_id, user_role):
    try:
        # For public access, don't filter by company_id
        if user_role == 'public':
            invoice = db.session.query(Invoice).options(
                joinedload(Invoice.customer)
            ).filter(Invoice.id == id, Invoice.is_active == True).first()
        elif user_role == 'super_admin':
            invoice = db.session.query(Invoice).options(
                joinedload(Invoice.customer)
            ).filter(Invoice.id == id).first()
        elif user_role == 'auditor':
            invoice = db.session.query(Invoice).options(
                joinedload(Invoice.customer)
            ).filter(Invoice.id == id, Invoice.is_active == True, Invoice.company_id == company_id).first()
        elif user_role == 'company_owner':
            invoice = db.session.query(Invoice).options(
                joinedload(Invoice.customer)
            ).filter(Invoice.id == id, Invoice.company_id == company_id).first()

        if not invoice:
            return None

        # Get all payments for this invoice - FIXED for public access
        payments = []
        try:
            if user_role == 'public':
                # For public access, get payments without company_id filter
                payments = db.session.query(Payment).filter(
                    Payment.invoice_id == id,
                    Payment.is_active == True
                ).order_by(Payment.payment_date.desc()).all()
            else:
                # For authenticated users, use the payment_crud function
                from app.crud import payment_crud
                payments_data = payment_crud.get_payment_by_invoice_id(id, company_id) or []
                # Convert to Payment objects if needed, or use as is
                payments = payments_data
        except Exception as payment_error:
            logger.error(f"Error getting payments for invoice {id}: {str(payment_error)}")
            payments = []

        # Calculate total paid and remaining amount
        if isinstance(payments, list) and payments and isinstance(payments[0], dict):
            # If payments is a list of dictionaries from payment_crud
            total_paid = sum(payment['amount'] for payment in payments if payment.get('status') == 'paid')
        else:
            # If payments is a list of Payment objects
            total_paid = sum(float(payment.amount) for payment in payments if payment.status == 'paid')
        
        remaining_amount = float(invoice.total_amount) - total_paid

        # Convert payments to consistent format
        payment_list = []
        if payments:
            if isinstance(payments[0], dict):
                # Already in dictionary format
                payment_list = payments
            else:
                # Convert Payment objects to dictionaries
                payment_list = [
                    {
                        'id': str(payment.id),
                        'amount': float(payment.amount),
                        'payment_date': payment.payment_date.isoformat(),
                        'payment_method': payment.payment_method,
                        'transaction_id': payment.transaction_id,
                        'status': payment.status,
                        'failure_reason': payment.failure_reason
                    }
                    for payment in payments
                ]

        # Get invoice line items
        line_items_list = []
        try:
            line_items = InvoiceLineItem.query.filter(
                InvoiceLineItem.invoice_id == id
            ).all()
            
            for item in line_items:
                line_item_data = {
                    'id': str(item.id),
                    'description': item.description,
                    'quantity': item.quantity,
                    'unit_price': float(item.unit_price),
                    'discount_amount': float(item.discount_amount) if item.discount_amount else 0,
                    'line_total': float(item.line_total),
                    'item_type': item.item_type or 'package'  # Add item_type for distinguishing
                }
                
                # For equipment items, add inventory item details
                if item.inventory_item_id:
                    line_item_data['inventory_item_id'] = str(item.inventory_item_id)
                    # Get inventory item details for richer display
                    inv_item = InventoryItem.query.get(item.inventory_item_id)
                    if inv_item:
                        line_item_data['inventory_item_type'] = inv_item.item_type
                        line_item_data['description'] = f"{inv_item.item_type}" if not item.description or item.description == inv_item.item_type else item.description
                
                line_items_list.append(line_item_data)
        except Exception as line_error:
            logger.error(f"Error getting line items for invoice {id}: {str(line_error)}")
            line_items_list = []

        # If no line items exist, generate them from customer packages
        service_plan_name = "N/A"
        if line_items_list:
            service_plan_name = ', '.join([li.get('description', '') for li in line_items_list if li.get('description')])
        
        # Fallback: get from CustomerPackage if no line items or empty service_plan_name
        if not service_plan_name or service_plan_name == "N/A" or not line_items_list:
            try:
                customer_packages = CustomerPackage.query.filter_by(
                    customer_id=invoice.customer_id,
                    is_active=True
                ).all()
                
                package_line_items = []
                for cp in customer_packages:
                    plan = ServicePlan.query.get(cp.service_plan_id)
                    if plan:
                        package_line_items.append({
                            'id': str(cp.id),
                            'description': f"{plan.name} - {plan.speed_mbps}Mbps" if plan.speed_mbps else plan.name,
                            'quantity': 1,
                            'unit_price': float(plan.price) if plan.price else 0,
                            'discount_amount': 0,
                            'line_total': float(plan.price) if plan.price else 0
                        })
                
                if package_line_items:
                    if not line_items_list:
                        line_items_list = package_line_items
                    service_plan_name = ', '.join([li.get('description', '') for li in package_line_items])
            except Exception as pkg_error:
                logger.error(f"Error getting customer packages for invoice {id}: {str(pkg_error)}")

        # Enhanced invoice data with ALL customer and service plan details
        return {
            'id': str(invoice.id),
            'invoice_number': invoice.invoice_number,
            'company_id': str(invoice.company_id),
            'customer_id': str(invoice.customer_id),
            'customer_name': f"{invoice.customer.first_name} {invoice.customer.last_name}" if invoice.customer else "N/A",
            'customer_address': invoice.customer.installation_address if invoice.customer else "",
            'customer_internet_id': invoice.customer.internet_id if invoice.customer else "",
            'customer_phone': invoice.customer.phone_1 if invoice.customer else "",
            # Get service plan names from line items or CustomerPackage fallback
            'service_plan_name': service_plan_name if service_plan_name else "N/A",
            'billing_start_date': invoice.billing_start_date.isoformat(),
            'billing_end_date': invoice.billing_end_date.isoformat(),
            'due_date': invoice.due_date.isoformat(),
            'subtotal': float(invoice.subtotal),
            'discount_percentage': float(invoice.discount_percentage),
            'total_amount': float(invoice.total_amount),
            'invoice_type': invoice.invoice_type,
            'notes': invoice.notes,
            'generated_by': str(invoice.generated_by),
            'status': invoice.status,
            'is_active': invoice.is_active,
            # Add line items
            'line_items': line_items_list,
            # Add payment information
            'payments': payment_list,
            'total_paid': total_paid,
            'remaining_amount': remaining_amount,
            # Add pending invoices for this customer
            'pending_invoices': _get_pending_invoices_for_customer(invoice.customer_id, id)
        }
    except Exception as e:
        logger.error(f"Error getting enhanced invoice {id}: {str(e)}")
        raise InvoiceError("Failed to retrieve invoice details")

def get_customers_for_monthly_invoices(company_id, target_month=None):
    """
    Get customers eligible for monthly invoice generation.
    Auto-deselects customers who already have invoices for the target month.
    """
    try:
        # Determine target month
        if target_month:
            year = datetime.now().year
            target_date = datetime(year, int(target_month), 1)
        else:
            target_date = datetime.now()
            
        # Calculate date range for checking existing invoices (25th of previous month to 4th of current month)
        if target_date.month == 1:
            prev_month = 12
            prev_year = target_date.year - 1
        else:
            prev_month = target_date.month - 1
            prev_year = target_date.year
            
        check_start_date = datetime(prev_year, prev_month, 25)
        check_end_date = datetime(target_date.year, target_date.month, 4)
        
        # Get all active customers for the company
        customers = Customer.query.filter(
            Customer.company_id == company_id,
            Customer.is_active == True
        ).all()
        
        customer_data = []
        for customer in customers:
            # Check if invoice already exists for this customer in the target period
            existing_invoice = Invoice.query.filter(
                Invoice.customer_id == customer.id,
                Invoice.invoice_type == 'subscription',
                Invoice.billing_start_date >= check_start_date,
                Invoice.billing_start_date <= check_end_date,
                Invoice.is_active == True
            ).first()
            
            # Calculate billing dates
            billing_start_date = datetime(target_date.year, target_date.month, 1)
            next_month = (billing_start_date.replace(day=1) + timedelta(days=32)).replace(day=1)
            billing_end_date = (next_month - timedelta(days=1))
            # Calculate due date (5 days from billing start date)
            due_date = billing_start_date + timedelta(days=5)
            
            # Get customer packages for pricing
            customer_packages = CustomerPackage.query.filter_by(
                customer_id=customer.id,
                is_active=True
            ).all()
            
            # Calculate totals from all packages
            total_package_price = 0
            package_names = []
            for cp in customer_packages:
                plan = ServicePlan.query.get(cp.service_plan_id)
                if plan:
                    total_package_price += float(plan.price) if plan.price else 0
                    package_names.append(plan.name)
            
            discount_amount = float(customer.discount_amount) if customer.discount_amount else 0
            discount_percentage = (discount_amount / total_package_price * 100) if total_package_price > 0 else 0
            total_amount = total_package_price - discount_amount
            
            customer_data.append({
                'id': str(customer.id),
                'name': f"{customer.first_name} {customer.last_name}",
                'internet_id': customer.internet_id,
                'service_plan_name': ', '.join(package_names) if package_names else 'No Package',
                'service_plan_price': total_package_price,
                'discount_amount': discount_amount,
                'discount_percentage': discount_percentage,
                'total_amount': total_amount,
                'billing_start_date': billing_start_date.date().isoformat(),
                'billing_end_date': billing_end_date.date().isoformat(),
                'due_date': due_date.date().isoformat(),
                'has_existing_invoice': existing_invoice is not None,
                'existing_invoice_number': existing_invoice.invoice_number if existing_invoice else None,
                'packages': [{'name': pn} for pn in package_names]
            })
        
        return customer_data
        
    except Exception as e:
        logger.error(f"Error getting customers for monthly invoices: {str(e)}")
        raise InvoiceError("Failed to get customers for monthly invoices")

def generate_bulk_monthly_invoices(company_id, customer_ids, target_month, current_user_id, user_role, ip_address, user_agent):
    """
    Generate monthly invoices for multiple customers at once.
    Supports multi-package customers - creates line items for each package.
    """
    try:
        if not customer_ids:
            raise ValueError("No customers selected for invoice generation")
        
        # Parse target month
        year = datetime.now().year
        target_date = datetime(year, int(target_month), 1)
        
        generated_invoices = []
        failed_invoices = []
        
        for customer_id in customer_ids:
            try:
                # Get customer details
                customer = Customer.query.filter(
                    Customer.id == customer_id,
                    Customer.company_id == company_id,
                    Customer.is_active == True
                ).first()
                
                if not customer:
                    failed_invoices.append({
                        'customer_id': customer_id,
                        'error': 'Customer not found or inactive'
                    })
                    continue
                
                # Check if invoice already exists for this month
                billing_start_date = datetime(target_date.year, target_date.month, 1)
                next_month = (billing_start_date.replace(day=1) + timedelta(days=32)).replace(day=1)
                billing_end_date = (next_month - timedelta(days=1))
                
                existing_invoice = Invoice.query.filter(
                    Invoice.customer_id == customer_id,
                    Invoice.invoice_type == 'subscription',
                    Invoice.billing_start_date >= billing_start_date,
                    Invoice.billing_start_date < next_month,
                    Invoice.is_active == True
                ).first()
                
                if existing_invoice:
                    failed_invoices.append({
                        'customer_id': customer_id,
                        'customer_name': f"{customer.first_name} {customer.last_name}",
                        'error': f'Invoice already exists: {existing_invoice.invoice_number}'
                    })
                    continue
                
                # Get customer's active packages from CustomerPackage table
                customer_packages = CustomerPackage.query.options(
                    joinedload(CustomerPackage.service_plan)
                ).filter(
                    CustomerPackage.customer_id == customer_id,
                    CustomerPackage.is_active == True
                ).all()
                
                if not customer_packages:
                    failed_invoices.append({
                        'customer_id': customer_id,
                        'customer_name': f"{customer.first_name} {customer.last_name}",
                        'error': 'No active packages found for customer'
                    })
                    continue
                
                # Calculate billing period
                due_date = billing_start_date + timedelta(days=5)
                
                # Calculate subtotal from all packages
                subtotal = sum(float(pkg.service_plan.price) for pkg in customer_packages if pkg.service_plan)
                
                # Apply global discount (from customer.discount_amount)
                discount_amount = float(customer.discount_amount) if customer.discount_amount else 0
                discount_percentage = (discount_amount / subtotal * 100) if subtotal > 0 else 0
                total_amount = subtotal - discount_amount
                
                # Build notes with all package names
                package_names = [pkg.service_plan.name for pkg in customer_packages if pkg.service_plan]
                notes = f"Monthly subscription invoice for: {', '.join(package_names)}"
                
                # Create invoice data
                invoice_data = {
                    'company_id': str(company_id),
                    'customer_id': str(customer_id),
                    'billing_start_date': billing_start_date.date().isoformat(),
                    'billing_end_date': billing_end_date.date().isoformat(),
                    'due_date': due_date.date().isoformat(),
                    'subtotal': subtotal,
                    'discount_percentage': discount_percentage,
                    'total_amount': total_amount,
                    'invoice_type': 'subscription',
                    'notes': notes
                }
                
                # Generate invoice
                new_invoice = add_invoice(
                    invoice_data, 
                    current_user_id, 
                    user_role, 
                    ip_address,
                    user_agent
                )
                
                # Create line items for each package
                for pkg in customer_packages:
                    if not pkg.service_plan:
                        continue
                    
                    unit_price = float(pkg.service_plan.price)
                    # Distribute discount proportionally across packages
                    pkg_discount = (unit_price / subtotal * discount_amount) if subtotal > 0 else 0
                    line_total = unit_price - pkg_discount
                    
                    line_item = InvoiceLineItem(
                        invoice_id=new_invoice.id,
                        customer_package_id=pkg.id if hasattr(pkg, 'id') else None,
                        description=f"{pkg.service_plan.name} - {pkg.service_plan.speed_mbps}Mbps" if pkg.service_plan.speed_mbps else pkg.service_plan.name,
                        quantity=1,
                        unit_price=unit_price,
                        discount_amount=pkg_discount,
                        line_total=line_total
                    )
                    db.session.add(line_item)
                
                db.session.commit()
                
                # WhatsApp notification is automatically sent by add_invoice()
                
                generated_invoices.append({
                    'customer_id': customer_id,
                    'customer_name': f"{customer.first_name} {customer.last_name}",
                    'invoice_number': new_invoice.invoice_number,
                    'amount': total_amount,
                    'packages_count': len(customer_packages)
                })
                
                logger.info(f"Generated invoice for customer {customer_id}: {new_invoice.invoice_number} with {len(customer_packages)} packages")
                
            except Exception as e:
                logger.error(f"Failed to generate invoice for customer {customer_id}: {str(e)}")
                db.session.rollback()
                failed_invoices.append({
                    'customer_id': customer_id,
                    'customer_name': f"{customer.first_name} {customer.last_name}" if customer else 'Unknown',
                    'error': str(e)
                })
        
        return {
            'generated': generated_invoices,
            'failed': failed_invoices,
            'total_generated': len(generated_invoices),
            'total_failed': len(failed_invoices),
            'target_month': target_date.strftime('%B %Y')
        }
        
    except Exception as e:
        logger.error(f"Error in generate_bulk_monthly_invoices: {str(e)}")
        raise InvoiceError(f"Failed to generate bulk monthly invoices: {str(e)}")

def _apply_role_scope(query, company_id, user_role, employee_id):
    q = query.filter(Invoice.company_id == company_id)
    if user_role not in ['super_admin', 'company_owner', 'manager']:
        # example: restrict to invoices the employee generated or owns; adjust to your policy
        q = q.filter(Invoice.generated_by == employee_id)
    return q

def get_invoices_page(company_id, user_role, employee_id, page=1, page_size=20, sort=None, q=None):
    base = db.session.query(
        Invoice.id,
        Invoice.invoice_number,
        Invoice.customer_id,
        Invoice.billing_start_date,
        Invoice.billing_end_date,
        Invoice.due_date,
        Invoice.subtotal,
        Invoice.discount_percentage,
        Invoice.total_amount,
        Invoice.invoice_type,
        Invoice.notes,
        Invoice.status,
        Customer.internet_id,
        Customer.phone_1,
        Customer.phone_2,
        (Customer.first_name + ' ' + Customer.last_name).label('customer_name'),
    ).join(Customer, Customer.id == Invoice.customer_id)

    base = _apply_role_scope(base, company_id, user_role, employee_id)

    if q:
        like = f"%{q}%"
        base = base.filter(or_(
            Invoice.invoice_number.ilike(like),
            Customer.internet_id.ilike(like),
            Customer.first_name.ilike(like),
            Customer.last_name.ilike(like),
            Invoice.status.ilike(like),
        ))
    # sorting
    if sort:
        for part in sort.split(','):
            try:
                col, direction = part.split(':')
                direction = direction.lower().strip()
            except ValueError:
                col, direction = part, 'asc'
            col = col.strip()
            mapping = {
                'invoice_number': Invoice.invoice_number,
                'due_date': Invoice.due_date,
                'billing_start_date': Invoice.billing_start_date,
                'billing_end_date': Invoice.billing_end_date,
                'total_amount': Invoice.total_amount,
                'status': Invoice.status,
                'internet_id': Customer.internet_id,
                'customer_name': func.concat(Customer.first_name, ' ', Customer.last_name),
            }
            column = mapping.get(col)
            if column is not None:
                base = base.order_by(desc(column) if direction == 'desc' else asc(column))
    else:
        base = base.order_by(desc(Invoice.created_at))

    total = base.count()
    items = base.limit(page_size).offset((page - 1) * page_size).all()

    def serialize(row):
        return {
            'id': str(row.id),
            'invoice_number': row.invoice_number,
            'customer_id': str(row.customer_id) if row.customer_id else None,
            'internet_id': row.internet_id,
            'customer_name': row.customer_name,
            'customer_phone': row.phone_1 or "",  # For backward compatibility
            'phone_1': row.phone_1 or "",
            'phone_2': row.phone_2 or "",
            'billing_start_date': row.billing_start_date.isoformat() if row.billing_start_date else None,
            'billing_end_date': row.billing_end_date.isoformat() if row.billing_start_date else None,
            'due_date': row.due_date.isoformat() if row.due_date else None,
            'subtotal': float(row.subtotal) if row.subtotal is not None else 0,
            'discount_percentage': float(row.discount_percentage) if row.discount_percentage is not None else 0,
            'total_amount': float(row.total_amount) if row.total_amount is not None else 0,
            'invoice_type': row.invoice_type,
            'notes': row.notes,
            'status': row.status,
        }

    # quick stats (optional)
    stats = {
        'total': total,
        'total_amount': db.session.query(func.sum(Invoice.total_amount)).filter(Invoice.company_id == company_id).scalar() or 0,
        'paid': db.session.query(func.count(Invoice.id)).filter(Invoice.company_id == company_id, Invoice.status == 'paid').scalar() or 0,
        'paid_amount': db.session.query(func.sum(Invoice.total_amount)).filter(Invoice.company_id == company_id, Invoice.status == 'paid').scalar() or 0,
        'pending': db.session.query(func.count(Invoice.id)).filter(Invoice.company_id == company_id, Invoice.status == 'pending').scalar() or 0,
        'pending_amount': db.session.query(func.sum(Invoice.total_amount)).filter(Invoice.company_id == company_id, Invoice.status == 'pending').scalar() or 0,
    }

    return {'items': [serialize(x) for x in items], 'total': total, 'stats': stats}

def get_invoices_summary(company_id, user_role, employee_id):
    q = db.session.query(Invoice).filter(Invoice.company_id == company_id)
    if user_role not in ['super_admin', 'company_owner', 'manager']:
        q = q.filter(Invoice.generated_by == employee_id)
    total = q.count()
    total_amount = q.with_entities(func.sum(Invoice.total_amount)).scalar() or 0
    paid = q.filter(Invoice.status == 'paid').count()
    paid_amount = q.filter(Invoice.status == 'paid').with_entities(func.sum(Invoice.total_amount)).scalar() or 0
    pending = q.filter(Invoice.status == 'pending').count()
    pending_amount = q.filter(Invoice.status == 'pending').with_entities(func.sum(Invoice.total_amount)).scalar() or 0
    
    return {
        'total': total, 
        'total_amount': total_amount,
        'paid': paid, 
        'paid_amount': paid_amount,
        'pending': pending,
        'pending_amount': pending_amount
    }
