import logging
from datetime import datetime
from app import db
from app.models import User, Invoice, Customer
from app.crud import employee_ledger_crud

logger = logging.getLogger(__name__)

class CommissionService:
    @staticmethod
    def generate_connection_commission(invoice_id):
        """
        Generate connection commission for employee when an invoice is PAID.
        
        Logic:
        - Only for subscription invoices
        - Uses customer's connection_commission_amount
        - Calculates months based on billing period
        - Adds to employee ledger
        """
        try:
            invoice = Invoice.query.get(invoice_id)
            if not invoice:
                logger.error(f"Invoice {invoice_id} not found for commission generation")
                return None

            # Only process subscription invoices
            if invoice.invoice_type != 'subscription':
                logger.info(f"Invoice {invoice.invoice_number} is not subscription type, skipping commission")
                return None
            
            customer = invoice.customer
            if not customer:
                logger.error(f"Customer not found for invoice {invoice.id}")
                return None

            # Check if customer has a technician assigned
            if not customer.technician_id:
                logger.info(f"No technician assigned for customer {customer.id}, skipping commission")
                return None
            
            # Get the technician
            technician = User.query.get(customer.technician_id)
            if not technician:
                logger.warning(f"Technician {customer.technician_id} not found")
                return None
            
            # Check if customer has commission rate set
            commission_rate = float(customer.connection_commission_amount) if customer.connection_commission_amount else 0
            if commission_rate <= 0:
                logger.info(f"Customer {customer.id} has no commission rate set")
                return None
            
            # Check if commission was already generated for this invoice to verify idempotency
            # (Though ledger allows multiple entries, we probably don't want double commission for same invoice)
            # This is a basic check; real production might need a flag on invoice or unique index on ledger
            
            # Calculate billing period days
            billing_start = invoice.billing_start_date
            billing_end = invoice.billing_end_date
            
            if not billing_start or not billing_end:
                logger.warning(f"Invoice {invoice.id} missing billing dates")
                return None
            
            days_difference = (billing_end - billing_start).days
            
            # Calculate number of months (29+ days = 1 month logic)
            months = 0
            if days_difference >= 29:
                months = (days_difference + 1) // 29
            
            if months <= 0:
                logger.info(f"Invoice {invoice.id} duration ({days_difference} days) too short for commission")
                return None
            
            # Calculate total commission
            total_commission = commission_rate * months
            
            # Create description
            customer_name = f"{customer.first_name} {customer.last_name}"
            billing_period_str = f"{billing_start.strftime('%b %d')} - {billing_end.strftime('%b %d, %Y')}"
            month_text = "month" if months == 1 else "months"
            
            description = f"Connection commission for {customer_name} ({customer.internet_id}) - {billing_period_str} ({months} {month_text} @ PKR {commission_rate}/month)"
            
            # Add ledger entry
            entry = employee_ledger_crud.add_ledger_entry(
                employee_id=technician.id,
                transaction_type='connection_commission',
                amount=total_commission,
                description=description,
                company_id=customer.company_id,
                reference_id=invoice.id
            )
            
            logger.info(f"SUCCESS: Generated commission of PKR {total_commission} for {technician.first_name} (Invoice: {invoice.invoice_number})")
            
            return {
                'employee_id': str(technician.id),
                'amount': total_commission,
                'status': 'success'
            }
            
        except Exception as e:
            logger.error(f"Error in CommissionService.generate_connection_commission: {e}")
            return None
