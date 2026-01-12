from app import db
from app.models import Payment, Customer, Invoice, Company, BankAccount,User
from app.utils.logging_utils import log_action
import uuid
import logging
import os
from werkzeug.utils import secure_filename
from sqlalchemy import func, or_, asc, desc
from decimal import Decimal  # ADD THIS IMPORT
from datetime import datetime
from app.utils.date_utils import parse_pkt_datetime

from app.services.commission_service import CommissionService

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
            payments = Payment.query.order_by(Payment.created_at.desc()).all()
        elif user_role == 'auditor':
            payments = Payment.query.filter_by(is_active=True, company_id=company_id).order_by(Payment.created_at.desc()).all()
        elif user_role == 'company_owner':
            payments = Payment.query.filter_by(company_id=company_id).order_by(Payment.created_at.desc()).all()
        elif user_role == 'employee':
            payments = Payment.query.filter_by(received_by=employee_id).order_by(Payment.created_at.desc()).all()

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
                    'received_by': f"{payment.receiver.first_name} {payment.receiver.last_name}" if payment.receiver else 'System/Public',
                    'is_active': payment.is_active,
                    'due_date': payment.invoice.due_date.isoformat() if payment.invoice.due_date else None,  # Add this
                    'status': payment.invoice.status if hasattr(payment.invoice, 'status') else 'N/A',  # Add this
                    'billing_start_date': payment.invoice.billing_start_date.isoformat() if payment.invoice.billing_start_date else None,
                    'billing_end_date': payment.invoice.billing_end_date.isoformat() if payment.invoice.billing_end_date else None,
                    'bank_account_id': str(payment.bank_account_id) if payment.bank_account_id else None,
                    'bank_account_details': f"{payment.bank_account.bank_name} - {payment.bank_account.account_number}" if payment.bank_account else None,
                })
            except AttributeError as e:
                logger.error(f"Error processing payment {payment.id}: {str(e)}")
                continue
        return result
    except Exception as e:
        logger.error(f"Error getting payments: {str(e)}")
        raise PaymentError("Failed to retrieve payments")

# In payment_crud.py - Simplified logic
def add_payment(data, user_role, current_user_id, ip_address, user_agent):
    try:
        # Validate required fields
        # Note: received_by is optional for public payments (will be None or system user)
        required_fields = ['company_id', 'invoice_id', 'amount', 'payment_date', 
                         'payment_method', 'status']
        for field in required_fields:
            if field not in data:
                raise ValueError(f"Missing required field: {field}")

        UPLOAD_FOLDER = 'uploads/payment_proofs'
        os.makedirs(UPLOAD_FOLDER, exist_ok=True)

        # Get invoice details for validation
        invoice = Invoice.query.get(uuid.UUID(data['invoice_id']))
        if not invoice:
            raise ValueError("Invalid invoice_id")

        # Combine date and time for payment_date
        payment_date_str = data['payment_date']
        payment_time_str = data.get('payment_time', '00:00')
        try:
            # Parse combined datetime as PKT
            payment_datetime = parse_pkt_datetime(payment_date_str, payment_time_str)
        except ValueError:
            raise ValueError("Invalid payment date or time format")

        current_payment_amount = Decimal(str(data['amount']))
        
        # Only validate balance if payment is being marked as PAID immediately
        if data['status'] == 'paid':
            # Calculate total paid amount for this invoice
            total_paid = db.session.query(func.sum(Payment.amount)).filter(
                Payment.invoice_id == uuid.UUID(data['invoice_id']),
                Payment.is_active == True,
                Payment.status == 'paid'
            ).scalar() or Decimal('0.00')
            
            invoice_total = invoice.total_amount
            if total_paid + current_payment_amount > invoice_total:
                raise ValueError(f"Payment amount exceeds invoice balance. Remaining balance: PKR {invoice_total - total_paid}")

        # Validate and create payment
        try:
            received_by_uuid = uuid.UUID(data['received_by']) if data.get('received_by') else None
            bank_account_uuid = uuid.UUID(data['bank_account_id']) if data.get('bank_account_id') else None
            
            new_payment = Payment(
                company_id=uuid.UUID(data['company_id']),
                invoice_id=uuid.UUID(data['invoice_id']),
                amount=current_payment_amount,
                payment_date=payment_datetime,
                payment_method=data['payment_method'],
                transaction_id=data.get('transaction_id'),
                status=data['status'],
                failure_reason=data.get('failure_reason'),
                received_by=received_by_uuid,
                bank_account_id=bank_account_uuid,
                is_active=True
            )
        except (ValueError, TypeError) as e:
            raise ValueError(f"Invalid data format: {str(e)}")

        # Handle payment proof
        if 'payment_proof' in data and data['payment_proof']:
            new_payment.payment_proof = data['payment_proof']

        db.session.add(new_payment)
        
        # Update bank account balance if bank transfer and paid
        if new_payment.payment_method == 'bank_transfer' and new_payment.bank_account_id:
             # Only update balance immediately if status is already paid (e.g. manual entry)
             # Pending payments wait for verification
            if new_payment.status == 'paid':
                 try:
                    from app.crud.bank_account_crud import update_account_balance
                    update_account_balance(new_payment.bank_account_id, new_payment.amount, 'credit')
                 except Exception as e:
                    logger.error(f"Failed to update bank balance for payment {new_payment.id}: {e}")
        
        # Update invoice status ONLY if payment is successful/paid
        if data['status'] == 'paid':
            # Re-calculate total paid including this new payment
            # (We query again or just add because transaction is open)
            total_paid_after = (db.session.query(func.sum(Payment.amount)).filter(
                Payment.invoice_id == uuid.UUID(data['invoice_id']),
                Payment.is_active == True,
                Payment.status == 'paid'
            ).scalar() or Decimal('0.00')) + current_payment_amount
            
            if total_paid_after >= invoice.total_amount:
                invoice.status = 'paid'
            elif total_paid_after > Decimal('0.00'):
                invoice.status = 'partially_paid'
            
            # If status was pending, it might become partially_paid or paid.
            # If it was overdue, same logic applies.
            
            # Trigger Commission Service if invoice is PAID
            if invoice.status == 'paid':
                 try:
                    CommissionService.generate_connection_commission(invoice.id)
                 except Exception as e:
                    logger.error(f"Failed to trigger commission service for payment {new_payment.id}: {e}")
        
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

def verify_payment(payment_id, action, verification_notes, current_user_id, ip_address, user_agent):
    """
    Verify a pending payment (Approve or Reject).
    """
    try:
        payment = Payment.query.get(payment_id)
        if not payment:
            raise ValueError("Payment not found")
        
        if payment.status != 'pending':
            raise ValueError(f"Payment is already {payment.status}")

        old_values = {
            'status': payment.status,
            'failure_reason': payment.failure_reason
        }

        if action == 'approve':
            payment.status = 'paid'
            payment.received_by = uuid.UUID(current_user_id) # The admin verifying it is marked as receiver
            
            # Update Invoice Status
            invoice = Invoice.query.get(payment.invoice_id)
            if invoice:
                 # Check total paid amount
                total_paid = db.session.query(func.sum(Payment.amount)).filter(
                    Payment.invoice_id == invoice.id,
                    Payment.is_active == True,
                    Payment.status == 'paid'
                ).scalar() or Decimal('0.00')
                
                # Add this payment's amount (it's not committed yet as 'paid' in DB query result above usually, unless flushed)
                # Safest to just sum everything including this one logic-wise:
                total_paid += payment.amount

                if total_paid >= invoice.total_amount:
                    invoice.status = 'paid'
                elif total_paid > 0:
                    invoice.status = 'partially_paid'

                # Trigger Commission Service if invoice is PAID
                if invoice.status == 'paid':
                     try:
                        CommissionService.generate_connection_commission(invoice.id)
                     except Exception as e:
                        logger.error(f"Failed to trigger commission service for payment {payment.id}: {e}")

            # Update bank balance on approval
            if payment.payment_method == 'bank_transfer' and payment.bank_account_id:
                try:
                    from app.crud.bank_account_crud import update_account_balance
                    update_account_balance(payment.bank_account_id, payment.amount, 'credit')
                except Exception as e:
                    logger.error(f"Failed to update bank balance for verified payment {payment.id}: {e}")
        
        elif action == 'reject':
            payment.status = 'failed'
            payment.failure_reason = verification_notes or "Rejected by admin"
            # Invoice remains unchanged (pending/partially_paid)
            
        else:
            raise ValueError("Invalid verification action")

        db.session.commit()
        
        log_action(
            current_user_id,
            'VERIFY_PAYMENT',
            'payments',
            payment.id,
            old_values,
            {'status': payment.status, 'action': action, 'notes': verification_notes},
            ip_address,
            user_agent,
            payment.company_id
        )
        
        return payment
    except Exception as e:
        logger.error(f"Error verifying payment: {str(e)}")
        db.session.rollback()
        raise PaymentError(str(e))

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
            'bank_account_id': str(payment.bank_account_id) if payment.bank_account_id else None,
            'is_active': payment.is_active
        }

        # Update fields
        if 'invoice_id' in data:
            payment.invoice_id = uuid.UUID(data['invoice_id'])
        if 'amount' in data:
            payment.amount = float(data['amount'])
        if 'payment_date' in data and 'payment_time' in data:
            # Combine date and time
            payment_datetime = datetime.strptime(f"{data['payment_date']} {data['payment_time']}", "%Y-%m-%d %H:%M")
            payment.payment_date = payment_datetime
        elif 'payment_date' in data:
            # Keep existing time if only date is provided
            existing_time = payment.payment_date.time()
            payment_date = datetime.strptime(data['payment_date'], "%Y-%m-%d").date()
            payment.payment_date = datetime.combine(payment_date, existing_time)
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
            if isinstance(data['is_active'], str):
                payment.is_active = data['is_active'].lower() == 'true'
            else:
                payment.is_active = bool(data['is_active'])
        if 'bank_account_id' in data:
            payment.bank_account_id = uuid.UUID(data['bank_account_id']) if data['bank_account_id'] else None
        
        # Handle payment proof update
        if 'payment_proof' in data and data['payment_proof']:
            try:
                if payment.payment_proof and os.path.exists(payment.payment_proof) and payment.payment_proof != data['payment_proof']:
                    os.remove(payment.payment_proof)
                
                payment.payment_proof = data['payment_proof']
            except Exception as e:
                logger.error(f"Error updating payment proof: {str(e)}")
                raise PaymentError("Failed to update payment proof")

        # Update invoice status based on payment status
        if payment.status == 'paid':
            invoice = Invoice.query.get(payment.invoice_id)
            if invoice:
                invoice.status = 'paid'
                
                # Trigger Commission Service if invoice is PAID
                try:
                    CommissionService.generate_connection_commission(invoice.id)
                except Exception as e:
                    logger.error(f"Failed to trigger commission service for payment {payment.id}: {e}")
        elif payment.status in ['failed', 'cancelled', 'refunded']:
            invoice = Invoice.query.get(payment.invoice_id)
            if invoice and invoice.status == 'paid':
                invoice.status = 'pending'

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
def fetch_active_bank_accounts(company_id):
    try:
        bank_accounts = BankAccount.query.filter_by(company_id=company_id, is_active=True).all()
        return [
            {
                'id': str(account.id),
                'bank_name': account.bank_name,
                'account_title': account.account_title,
                'account_number': account.account_number,
                'iban': account.iban,
                'branch_code': account.branch_code,
                'branch_address': account.branch_address
            }
            for account in bank_accounts
        ]
    except Exception as e:
        raise Exception(f"Database operation failed: {str(e)}")

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

        # Store invoice_id before deletion for status update
        invoice_id = payment.invoice_id
        
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

        # Delete the payment
        db.session.delete(payment)
        
        # Revert bank balance if it was a paid bank transfer
        if payment.status == 'paid' and payment.payment_method == 'bank_transfer' and payment.bank_account_id:
             try:
                from app.crud.bank_account_crud import update_account_balance
                # specific case: deleting a credit means we DEBIT (subtract) the amount back
                update_account_balance(payment.bank_account_id, -payment.amount, 'debit')
             except Exception as e:
                logger.error(f"Failed to revert bank balance for deleted payment {payment.id}: {e}")

        db.session.commit()

        # Update invoice status after payment deletion
        try:
            # Get all remaining active payments for this invoice
            remaining_payments = Payment.query.filter(
                Payment.invoice_id == invoice_id,
                Payment.is_active == True,
                Payment.id != uuid.UUID(id)  # Exclude the deleted payment
            ).all()
            
            # Calculate total paid amount from remaining payments
            total_paid = sum(p.amount for p in remaining_payments if p.status == 'paid')
            
            # Get the invoice
            invoice = Invoice.query.get(invoice_id)
            if invoice:
                if total_paid == 0:
                    # No payments left, set to pending
                    invoice.status = 'pending'
                elif total_paid >= invoice.total_amount:
                    # Fully paid with remaining payments
                    invoice.status = 'paid'
                elif total_paid > 0:
                    # Some payment remains
                    invoice.status = 'partially_paid'
                else:
                    # No successful payments
                    invoice.status = 'pending'
                
                db.session.commit()
                
        except Exception as e:
            logger.error(f"Error updating invoice status after payment deletion: {str(e)}")
            # Don't rollback the payment deletion, just log the error

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

def get_payment_by_invoice_id(invoice_id, company_id=None):
    """
    Get all payments for an invoice.
    For public access, company_id can be None.
    """
    try:
        query = db.session.query(Payment).filter(
            Payment.invoice_id == invoice_id,
            Payment.is_active == True
        )
        
        # Only filter by company_id if provided (for authenticated users)
        if company_id:
            query = query.filter(Payment.company_id == company_id)
        
        payments = query.order_by(Payment.payment_date.desc()).all()
        
        if not payments:
            return []
            
        return [
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
    except Exception as e:
        logger.error(f"Error getting payments for invoice {invoice_id}: {str(e)}")
        raise PaymentError("Failed to retrieve payment details")

def _base_scope(company_id, user_role, employee_id):
    q = db.session.query(Payment).join(Invoice, Payment.invoice_id == Invoice.id)\
                                 .join(Customer, Invoice.customer_id == Customer.id)\
                                 .outerjoin(User, Payment.received_by == User.id)\
                                 .outerjoin(BankAccount, Payment.bank_account_id == BankAccount.id)
    if user_role == 'super_admin':
        return q
    elif user_role == 'auditor':
        return q.filter(Payment.is_active == True, Payment.company_id == company_id)
    elif user_role == 'company_owner':
        return q.filter(Payment.company_id == company_id)
    elif user_role == 'employee':
        return q.filter(Payment.received_by == employee_id)
    return q.filter(Payment.company_id == company_id)

def _apply_filters(q, qtext, filters):
    if qtext:
        like = f"%{qtext}%"
        q = q.filter(or_(
            Invoice.invoice_number.ilike(like),
            Customer.first_name.ilike(like),
            Customer.last_name.ilike(like),
            Payment.payment_method.ilike(like),
            Payment.transaction_id.ilike(like),
        ))
    # Column-specific filters
    if filters.get('status'):
        q = q.filter(Payment.status == filters['status'])
    if filters.get('payment_method'):
        q = q.filter(Payment.payment_method == filters['payment_method'])
    if filters.get('bank_account_details'):
        # match bank_name or account_number
        like = f"%{filters['bank_account_details']}%"
        q = q.filter(or_(BankAccount.bank_name.ilike(like), BankAccount.account_number.ilike(like)))
    if filters.get('payment_date_from'):
        q = q.filter(Payment.payment_date >= filters['payment_date_from'])
    if filters.get('payment_date_to'):
        q = q.filter(Payment.payment_date <= filters['payment_date_to'])
    return q

def _apply_sort(q, sort_by, sort_dir):
    colmap = {
        'invoice_number': Invoice.invoice_number,
        'customer_name': Customer.first_name,  # simple first_name sort
        'amount': Payment.amount,
        'payment_date': Payment.payment_date,
        'payment_method': Payment.payment_method,
        'status': Payment.status,
        'received_by': User.first_name,
    }
    col = colmap.get(sort_by or 'payment_date', Payment.payment_date)
    direction = desc if (sort_dir or 'desc').lower() == 'desc' else asc
    return q.order_by(direction(col))

def _row_to_dict(p: Payment):
    return {
        'id': str(p.id),
        'invoice_id': str(p.invoice_id),
        'invoice_number': p.invoice.invoice_number,
        'customer_name': f"{p.invoice.customer.first_name} {p.invoice.customer.last_name}",
        'amount': float(p.amount),
        'payment_date': p.payment_date.isoformat(),
        'payment_method': p.payment_method,
        'transaction_id': p.transaction_id,
        'status': p.status,
        'failure_reason': p.failure_reason,
        'payment_proof': p.payment_proof,
        'received_by': f"{p.receiver.first_name} {p.receiver.last_name}" if p.receiver else 'System/Public',
        'is_active': p.is_active,
        'bank_account_id': str(p.bank_account_id) if p.bank_account_id else None,
        'bank_account_details': f"{p.bank_account.bank_name} - {p.bank_account.account_number}" if p.bank_account else None,
    }

def list_payments_paginated(company_id, user_role, employee_id, page, page_size, sort_by, sort_dir, q=None, filters=None):
    filters = filters or {}
    base = _base_scope(company_id, user_role, employee_id)
    base = _apply_filters(base, q, filters)
    total = base.count()
    base = _apply_sort(base, sort_by, sort_dir)
    rows = base.limit(page_size).offset((page - 1) * page_size).all()
    return ([_row_to_dict(p) for p in rows], total)

def get_payments_summary(company_id, user_role, employee_id):
    base = _base_scope(company_id, user_role, employee_id)
    total = base.count()
    active = base.filter(Payment.is_active == True).count()
    pending = base.filter(Payment.status == 'pending').count()
    
    # CRITICAL FIX: Only sum PAID payments for this company
    # Previous code was: db.session.query(func.coalesce(func.sum(Payment.amount), 0)).select_from(Payment).scalar()
    # which summed ALL payments from ALL companies with any status!
    total_amount = base.filter(
        Payment.is_active == True,
        Payment.status == 'paid'
    ).with_entities(func.coalesce(func.sum(Payment.amount), 0)).scalar() or 0
    
    return {
        'total': int(total),
        'active': int(active),
        'pending': int(pending),
        'totalAmount': float(total_amount),
    }

def stream_payments(company_id, user_role, employee_id, sort_by, sort_dir, qtext, filters):
    from flask import current_app
    
    # Use application context for database operations
    with current_app.app_context():
        q = _base_scope(company_id, user_role, employee_id)
        q = _apply_filters(q, qtext, filters)
        q = _apply_sort(q, sort_by, sort_dir)
        for p in q.yield_per(1000):  # efficient streaming
            yield _row_to_dict(p)