from app import db
from app.models import Payment, Customer, Invoice, Company
from app.utils.logging_utils import log_action
import uuid
import logging
import os
from werkzeug.utils import secure_filename

logger = logging.getLogger(__name__)

class InvoiceError(Exception):
    """Custom exception for invoice operations"""
    pass

class PaymentError(Exception):
    """Custom exception for payment operations"""
    pass

def get_all_payments(company_id, user_role,employee_id):
    try:
        if user_role == 'super_admin':
            payments = Payment.query.all()
        elif user_role == 'auditor':
            payments = Payment.query.filter_by(is_active=True, company_id=company_id).all()
        elif user_role == 'company_owner':
            payments = Payment.query.filter_by(company_id=company_id).all()
        elif user_role == 'employee':
            payments = Payment.query.filter_by(received_by=employee_id).all()

        result = []
        for payment in payments:
            try:
                result.append({
                    'id': str(payment.id),
                    'invoice_id': str(payment.invoice_id),
                    'invoice_number': payment.invoice.invoice_number,
                    'customer_name': f"{payment.invoice.customer.first_name} {payment.invoice.customer.last_name}",
                    'amount': float(payment.amount),
                    'payment_date': payment.payment_date.isoformat(),
                    'payment_method': payment.payment_method,
                    'transaction_id': payment.transaction_id,
                    'status': payment.status,
                    'failure_reason': payment.failure_reason,
                    'payment_proof': payment.payment_proof,
                    'received_by': f"{payment.receiver.first_name} {payment.receiver.last_name}",
                    'is_active': payment.is_active
                })
            except AttributeError as e:
                logger.error(f"Error processing payment {payment.id}: {str(e)}")
                continue
        return result
    except Exception as e:
        logger.error(f"Error getting payments: {str(e)}")
        raise PaymentError("Failed to retrieve payments")

def add_payment(data, user_role, current_user_id, ip_address, user_agent):
    try:
        # Validate required fields
        required_fields = ['company_id', 'invoice_id', 'amount', 'payment_date', 
                         'payment_method', 'status', 'received_by']
        for field in required_fields:
            if field not in data:
                raise ValueError(f"Missing required field: {field}")

        UPLOAD_FOLDER = 'uploads/payment_proofs'
        os.makedirs(UPLOAD_FOLDER, exist_ok=True)

        # Validate and create payment
        try:
            new_payment = Payment(
                company_id=uuid.UUID(data['company_id']),
                invoice_id=uuid.UUID(data['invoice_id']),
                amount=float(data['amount']),
                payment_date=data['payment_date'],
                payment_method=data['payment_method'],
                transaction_id=data.get('transaction_id'),
                status=data['status'],
                failure_reason=data.get('failure_reason'),
                received_by=uuid.UUID(data['received_by']),
                is_active=True
            )
        except (ValueError, TypeError) as e:
            raise ValueError(f"Invalid data format: {str(e)}")

        # Handle payment proof
        if 'payment_proof' in data and data['payment_proof']:
            new_payment.payment_proof = data['payment_proof']

        db.session.add(new_payment)
        
        # Update invoice status
        if data['status'] == 'paid':
            invoice = Invoice.query.get(uuid.UUID(data['invoice_id']))
            if invoice:
                invoice.status = 'paid'
            else:
                raise ValueError("Invalid invoice_id")
        
        db.session.commit()

        log_action(
            current_user_id,
            'CREATE',
            'payments',
            new_payment.id,
            None,
            {k: v for k, v in data.items() if k != 'payment_proof'},
                        ip_address,
            user_agent,
            uuid.UUID(data['company_id'])
)

        return new_payment
    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        raise PaymentError(str(e))
    except Exception as e:
        logger.error(f"Error adding payment: {str(e)}")
        db.session.rollback()
        raise PaymentError("Failed to create payment")

def update_payment(id, data, company_id, user_role, current_user_id, ip_address, user_agent):
    try:
        if user_role == 'super_admin':
            payment = Payment.query.get(id)
        elif user_role == 'auditor':
            payment = Payment.query.filter_by(id=id, is_active=True, company_id=company_id).first()
        elif user_role == 'company_owner':
            payment = Payment.query.filter_by(id=id, company_id=company_id).first()

        if not payment:
            raise ValueError(f"Payment with id {id} not found")

        UPLOAD_FOLDER = 'uploads/payment_proofs'
        os.makedirs(UPLOAD_FOLDER, exist_ok=True)

        old_values = {
            'invoice_id': str(payment.invoice_id),
            'amount': float(payment.amount),
            'payment_date': payment.payment_date.isoformat(),
            'payment_method': payment.payment_method,
            'transaction_id': payment.transaction_id,
            'status': payment.status,
            'failure_reason': payment.failure_reason,
            'payment_proof': payment.payment_proof,
            'received_by': str(payment.received_by),
            'is_active': payment.is_active
        }

        # Update fields
        if 'invoice_id' in data:
            payment.invoice_id = uuid.UUID(data['invoice_id'])
        if 'amount' in data:
            payment.amount = float(data['amount'])
        if 'payment_date' in data:
            payment.payment_date = data['payment_date']
        if 'payment_method' in data:
            payment.payment_method = data['payment_method']
        if 'transaction_id' in data:
            payment.transaction_id = data['transaction_id']
        if 'status' in data:
            payment.status = data['status']
        if 'failure_reason' in data:
            payment.failure_reason = data['failure_reason']
        if 'received_by' in data:
            payment.received_by = uuid.UUID(data['received_by'])
        if 'is_active' in data:
            payment.is_active = data['is_active']
        # Handle payment proof update
        if 'payment_proof' in data:
            try:
                # Delete old file if it exists
                if payment.payment_proof and os.path.exists(payment.payment_proof):
                    os.remove(payment.payment_proof)
                
                file = data['payment_proof']
                filename = secure_filename(file.filename)
                file_path = os.path.join(UPLOAD_FOLDER, filename)
                file.save(file_path)
                payment.payment_proof = file_path
            except Exception as e:
                logger.error(f"Error updating payment proof: {str(e)}")
                raise PaymentError("Failed to update payment proof")

        # Update invoice status
        if payment.status == 'paid':
            invoice = Invoice.query.get(payment.invoice_id)
            if invoice:
                invoice.status = 'paid'
            else:
                raise ValueError("Invalid invoice_id")

        db.session.commit()

        log_action(
            current_user_id,
            'UPDATE',
            'payments',
            payment.id,
            old_values,
            {k: v for k, v in data.items() if k != 'payment_proof'},
                        ip_address,
            user_agent,
            company_id
)

        return payment
    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        raise PaymentError(str(e))
    except Exception as e:
        logger.error(f"Error updating payment {id}: {str(e)}")
        db.session.rollback()
        raise PaymentError("Failed to update payment")

def delete_payment(id, company_id, user_role, current_user_id, ip_address, user_agent):
    try:
        if user_role == 'super_admin':
            payment = Payment.query.get(id)
        elif user_role == 'auditor':
            payment = Payment.query.filter_by(id=id, is_active=True, company_id=company_id).first()
        elif user_role == 'company_owner':
            payment = Payment.query.filter_by(id=id, company_id=company_id).first()

        if not payment:
            raise ValueError(f"Payment with id {id} not found")

        old_values = {
            'invoice_id': str(payment.invoice_id),
            'amount': float(payment.amount),
            'payment_date': payment.payment_date.isoformat(),
            'payment_method': payment.payment_method,
            'transaction_id': payment.transaction_id,
            'status': payment.status,
            'failure_reason': payment.failure_reason,
            'payment_proof': payment.payment_proof,
            'received_by': str(payment.received_by),
            'is_active': payment.is_active
        }

        # Delete payment proof file if it exists
        if payment.payment_proof and os.path.exists(payment.payment_proof):
            try:
                os.remove(payment.payment_proof)
            except OSError as e:
                logger.error(f"Error deleting payment proof file: {str(e)}")

        db.session.delete(payment)
        db.session.commit()

        log_action(
            current_user_id,
            'DELETE',
            'payments',
            payment.id,
            old_values,
            None,
                        ip_address,
            user_agent,
            company_id
)

        return True
    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        raise PaymentError(str(e))
    except Exception as e:
        logger.error(f"Error deleting payment {id}: {str(e)}")
        db.session.rollback()
        raise PaymentError("Failed to delete payment")

def get_payment_proof(invoice_id,company_id):
    try:
        payment_record = Payment.query.get(invoice_id)
        if not payment_record:
            raise ValueError("Payment invoice not found")

        payment_proof_details = {
            'invoice_id': str(payment_record.id),
            'proof_of_payment': payment_record.payment_proof
        }
        return payment_proof_details
    except ValueError as validation_error:
        logger.error(f"Validation error: {str(validation_error)}")
        raise PaymentError(str(validation_error))
    except Exception as general_error:
        logger.error(f"Unexpected error while retrieving payment proof: {str(general_error)}")
        raise PaymentError("Unable to retrieve the payment proof")