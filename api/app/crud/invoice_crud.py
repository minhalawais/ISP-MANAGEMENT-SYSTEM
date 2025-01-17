from app import db
from app.models import Invoice, Customer, Payment
from app.utils.logging_utils import log_action
import uuid
from sqlalchemy.exc import SQLAlchemyError, IntegrityError, DatabaseError
from datetime import datetime
import logging
from sqlalchemy.orm import joinedload

logger = logging.getLogger(__name__)

class InvoiceError(Exception):
    """Custom exception for invoice operations"""
    pass

class PaymentError(Exception):
    """Custom exception for payment operations"""
    pass

def get_all_invoices(company_id, user_role, employee_id):
    try:
        if user_role == 'super_admin':
            invoices = db.session.query(Invoice).options(joinedload(Invoice.customer)).all()
        elif user_role == 'auditor':
            invoices = db.session.query(Invoice).options(joinedload(Invoice.customer)).filter(Invoice.is_active == True).all()
        elif user_role == 'company_owner':
            invoices = db.session.query(Invoice).options(joinedload(Invoice.customer)).filter(Invoice.company_id == company_id).all()
        elif user_role == 'employee':
            invoices = db.session.query(Invoice).options(joinedload(Invoice.customer)).filter(Invoice.generated_by == employee_id).all()
        return [invoice_to_dict(invoice) for invoice in invoices]
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

def add_invoice(data, current_user_id, user_role, ip_address, user_agent):
    try:
        # Validate required fields
        required_fields = ['company_id', 'customer_id', 'billing_start_date', 
                         'billing_end_date', 'due_date', 'subtotal', 
                         'discount_percentage', 'total_amount', 'invoice_type']
        for field in required_fields:
            if field not in data:
                raise ValueError(f"Missing required field: {field}")

        # Parse and validate dates
        date_fields = ['billing_start_date', 'billing_end_date', 'due_date']
        for field in date_fields:
            try:
                data[field] = datetime.fromisoformat(data[field].rstrip('Z'))
            except ValueError:
                raise ValueError(f"Invalid date format for {field}")

        new_invoice = Invoice(
            company_id=uuid.UUID(data['company_id']),
            invoice_number=generate_invoice_number(),
            customer_id=uuid.UUID(data['customer_id']),
            billing_start_date=data['billing_start_date'],
            billing_end_date=data['billing_end_date'],
            due_date=data['due_date'],
            subtotal=data['subtotal'],
            discount_percentage=data['discount_percentage'],
            total_amount=data['total_amount'],
            invoice_type=data['invoice_type'],
            notes=data.get('notes'),
            generated_by=current_user_id,
            status='pending',
            is_active=True
        )
        
        db.session.add(new_invoice)
        db.session.commit()

        log_action(
            current_user_id,
            'CREATE',
            'invoices',
            new_invoice.id,
            None,
            data,
                        ip_address,
            user_agent,
            company_id
)

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
        if user_role == 'super_admin':
            invoice = Invoice.query.get(id)
        elif user_role == 'auditor':
            invoice = Invoice.query.filter_by(id=id, is_active=True, company_id=company_id).first()
        elif user_role == 'company_owner':
            invoice = Invoice.query.filter_by(id=id, company_id=company_id).first()

        if not invoice:
            raise ValueError(f"Invoice with id {id} not found")

        old_values = invoice_to_dict(invoice)

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
                setattr(invoice, field, data[field])

        db.session.commit()

        log_action(
            current_user_id,
            'UPDATE',
            'invoices',
            invoice.id,
            old_values,
            data,
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
        if user_role == 'super_admin':
            invoice = Invoice.query.get(id)
        elif user_role == 'auditor':
            invoice = Invoice.query.filter_by(id=id, is_active=True, company_id=company_id).first()
        elif user_role == 'company_owner':
            invoice = Invoice.query.filter_by(id=id, company_id=company_id).first()

        if not invoice:
            raise ValueError(f"Invoice with id {id} not found")

        # Check for related payments
        payments = Payment.query.filter_by(invoice_id=id).all()
        if payments:
            raise ValueError("Cannot delete invoice with associated payments")

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
        if user_role == 'super_admin':
            invoice = Invoice.query.get(id)
        elif user_role == 'auditor':
            invoice = Invoice.query.filter_by(id=id, is_active=True, company_id=company_id).first()
        elif user_role == 'company_owner':
            invoice = Invoice.query.filter_by(id=id, company_id=company_id).first()

        return invoice
    except Exception as e:
        logger.error(f"Error getting invoice {id}: {str(e)}")
        raise InvoiceError("Failed to retrieve invoice")

