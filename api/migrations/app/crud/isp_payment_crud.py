from app import db
from app.models import ISPPayment, ISP, BankAccount, User
from app.utils.logging_utils import log_action
import uuid
import logging
import os
from werkzeug.utils import secure_filename
from datetime import datetime
from app.utils.date_utils import parse_pkt_datetime

logger = logging.getLogger(__name__)

class ISPPaymentError(Exception):
    """Custom exception for ISP payment operations"""
    pass
def add_isp_payment(data, user_role, current_user_id, ip_address, user_agent):
    try:
        # Validate required fields
        required_fields = ['company_id', 'isp_id', 'payment_type', 
                         'amount', 'payment_date', 'billing_period',
                         'payment_method', 'processed_by']
        
        for field in required_fields:
            if field not in data:
                raise ValueError(f"Missing required field: {field}")

        # Only require bank_account_id for bank_transfer payments
        if data.get('payment_method') == 'bank_transfer' and 'bank_account_id' not in data:
            raise ValueError("Bank account is required when payment method is Bank Transfer")

        # Combine date and time for payment_date
        payment_date_str = data['payment_date']
        payment_time_str = data.get('payment_time', '00:00')
        
        try:
            payment_datetime = parse_pkt_datetime(payment_date_str, payment_time_str)
        except ValueError:
            raise ValueError("Invalid payment date or time format")

        # Create new payment
        new_payment = ISPPayment(
            company_id=uuid.UUID(data['company_id']),
            isp_id=uuid.UUID(data['isp_id']),
            bank_account_id=uuid.UUID(data['bank_account_id']) if data.get('bank_account_id') else None,
            payment_type=data['payment_type'],
            reference_number=data.get('reference_number'),
            description=data.get('description', ''),
            amount=float(data['amount']),
            payment_date=payment_datetime,  # Use combined datetime
            billing_period=data['billing_period'],
            bandwidth_usage_gb=float(data['bandwidth_usage_gb']) if data.get('bandwidth_usage_gb') else None,
            payment_method=data['payment_method'],
            transaction_id=data.get('transaction_id'),
            status=data.get('status', 'completed'),
            processed_by=uuid.UUID(data['processed_by']),
            payment_proof=data.get('payment_proof'),
            is_active=True
        )

        db.session.add(new_payment)
        
        # Update bank account balance (Debit)
        if new_payment.payment_method == 'bank_transfer' and new_payment.bank_account_id:
            try:
                from app.crud.bank_account_crud import update_account_balance
                # ISP Payment is a debit (money leaving)
                update_account_balance(new_payment.bank_account_id, -new_payment.amount, 'debit')
            except Exception as e:
                logger.error(f"Failed to update bank balance for ISP payment {new_payment.id}: {e}")

        db.session.commit()

        log_action(
            current_user_id,
            'CREATE',
            'isp_payments',
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
        raise ISPPaymentError(str(e))
    except Exception as e:
        logger.error(f"Error adding ISP payment: {str(e)}")
        db.session.rollback()
        raise ISPPaymentError("Failed to create ISP payment")

def update_isp_payment(id, data, company_id, user_role, current_user_id, ip_address, user_agent):
    try:
        if user_role == 'super_admin':
            payment = ISPPayment.query.get(id)
        elif user_role == 'auditor':
            payment = ISPPayment.query.filter_by(id=id, is_active=True, company_id=company_id).first()
        elif user_role == 'company_owner':
            payment = ISPPayment.query.filter_by(id=id, company_id=company_id).first()
        else:
            payment = None

        if not payment:
            raise ValueError(f"ISP payment with id {id} not found")

        old_values = {
            'isp_id': str(payment.isp_id),
            'bank_account_id': str(payment.bank_account_id) if payment.bank_account_id else None,
            'payment_type': payment.payment_type,
            'reference_number': payment.reference_number,
            'description': payment.description,
            'amount': float(payment.amount),
            'payment_date': payment.payment_date.isoformat(),
            'billing_period': payment.billing_period,
            'bandwidth_usage_gb': payment.bandwidth_usage_gb,
            'payment_method': payment.payment_method,
            'transaction_id': payment.transaction_id,
            'status': payment.status,
            'payment_proof': payment.payment_proof,
            'processed_by': str(payment.processed_by),
            'is_active': payment.is_active
        }

        # Only require bank_account_id for bank_transfer payments
        if data.get('payment_method') == 'bank_transfer' and 'bank_account_id' not in data:
            raise ValueError("Bank account is required when payment method is Bank Transfer")

        # Update fields
        update_fields = [
            'isp_id', 'payment_type', 'reference_number',
            'description', 'amount', 'billing_period',
            'bandwidth_usage_gb', 'payment_method', 'transaction_id',
            'status', 'processed_by', 'is_active'
        ]

        for field in update_fields:
            if field in data:
                if field in ['isp_id', 'processed_by']:
                    setattr(payment, field, uuid.UUID(data[field]))
                elif field in ['amount']:
                    setattr(payment, field, float(data[field]))
                elif field == 'bandwidth_usage_gb' and data[field]:
                    setattr(payment, field, float(data[field]))
                else:
                    setattr(payment, field, data[field])

        # Handle payment_date separately to combine date and time
        if 'payment_date' in data and 'payment_time' in data:
            payment.payment_date = parse_pkt_datetime(data['payment_date'], data['payment_time'])
        elif 'payment_date' in data:
            existing_time = payment.payment_date.time()
            payment_date = datetime.strptime(data['payment_date'], "%Y-%m-%d").date()
            payment.payment_date = datetime.combine(payment_date, existing_time)

        # Handle bank_account_id separately since it can be None
        if 'bank_account_id' in data:
            if data['bank_account_id']:
                setattr(payment, 'bank_account_id', uuid.UUID(data['bank_account_id']))
            else:
                setattr(payment, 'bank_account_id', None)

        # Handle payment proof update
        if 'payment_proof' in data:
            try:
                if payment.payment_proof and os.path.exists(payment.payment_proof):
                    os.remove(payment.payment_proof)
                
                file = data['payment_proof']
                filename = secure_filename(file.filename)
                file_path = os.path.join(UPLOAD_FOLDER, filename)
                file.save(file_path)
                payment.payment_proof = file_path
            except Exception as e:
                logger.error(f"Error updating payment proof: {str(e)}")
                raise ISPPaymentError("Failed to update payment proof")

        db.session.commit()

        log_action(
            current_user_id,
            'UPDATE',
            'isp_payments',
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
        raise ISPPaymentError(str(e))
    except Exception as e:
        logger.error(f"Error updating ISP payment {id}: {str(e)}")
        db.session.rollback()
        raise ISPPaymentError("Failed to update ISP payment")

def get_all_isp_payments(company_id, user_role, employee_id):
    try:
        if user_role == 'super_admin':
            payments = ISPPayment.query.order_by(ISPPayment.created_at.desc()).all()
        elif user_role == 'auditor':
            payments = ISPPayment.query.filter_by(is_active=True, company_id=company_id).order_by(ISPPayment.created_at.desc()).all()
        elif user_role == 'company_owner':
            payments = ISPPayment.query.filter_by(company_id=company_id).order_by(ISPPayment.created_at.desc()).all()
        elif user_role == 'employee':
            payments = ISPPayment.query.filter_by(processed_by=employee_id).order_by(ISPPayment.created_at.desc()).all()
        else:
            payments = []

        result = []
        for payment in payments:
            try:
                # Handle bank account details when bank_account_id is None
                bank_account_details = None
                if payment.bank_account_id and payment.bank_account:
                    bank_account_details = f"{payment.bank_account.bank_name} - {payment.bank_account.account_number}"
                elif payment.bank_account_id:
                    # Bank account ID exists but relationship failed to load
                    bank_account_details = "Bank account not found"
                else:
                    # No bank account associated (for non-bank-transfer payments)
                    bank_account_details = "Not applicable"

                result.append({
                    'id': str(payment.id),
                    'isp_id': str(payment.isp_id),
                    'isp_name': payment.isp.name,
                    'bank_account_id': str(payment.bank_account_id) if payment.bank_account_id else None,
                    'bank_account_details': bank_account_details,
                    'payment_type': payment.payment_type,
                    'reference_number': payment.reference_number,
                    'description': payment.description,
                    'amount': float(payment.amount),
                    'payment_date': payment.payment_date.isoformat(),
                    'billing_period': payment.billing_period,
                    'bandwidth_usage_gb': payment.bandwidth_usage_gb,
                    'payment_method': payment.payment_method,
                    'transaction_id': payment.transaction_id,
                    'status': payment.status,
                    'payment_proof': payment.payment_proof,
                    'processed_by': str(payment.processed_by),
                    'processor_name': f"{payment.processor.first_name} {payment.processor.last_name}",
                    'is_active': payment.is_active,
                    'created_at': payment.created_at.isoformat() if payment.created_at else None,
                })
            except AttributeError as e:
                logger.error(f"Error processing ISP payment {payment.id}: {str(e)}")
                continue
        return result
    except Exception as e:
        logger.error(f"Error getting ISP payments: {str(e)}")
        raise ISPPaymentError("Failed to retrieve ISP payments")

def delete_isp_payment(id, company_id, user_role, current_user_id, ip_address, user_agent):
    try:
        if user_role == 'super_admin':
            payment = ISPPayment.query.get(id)
        elif user_role == 'auditor':
            payment = ISPPayment.query.filter_by(id=id, is_active=True, company_id=company_id).first()
        elif user_role == 'company_owner':
            payment = ISPPayment.query.filter_by(id=id, company_id=company_id).first()
        else:
            payment = None

        if not payment:
            raise ValueError(f"ISP payment with id {id} not found")

        old_values = {
            'isp_id': str(payment.isp_id),
            'bank_account_id': str(payment.bank_account_id) if payment.bank_account_id else None,
            'payment_type': payment.payment_type,
            'reference_number': payment.reference_number,
            'description': payment.description,
            'amount': float(payment.amount),
            'payment_date': payment.payment_date.isoformat(),
            'billing_period': payment.billing_period,
            'bandwidth_usage_gb': payment.bandwidth_usage_gb,
            'payment_method': payment.payment_method,
            'transaction_id': payment.transaction_id,
            'status': payment.status,
            'payment_proof': payment.payment_proof,
            'processed_by': str(payment.processed_by),
            'is_active': payment.is_active
        }

        # Delete payment proof file if it exists
        if payment.payment_proof and os.path.exists(payment.payment_proof):
            try:
                os.remove(payment.payment_proof)
            except OSError as e:
                logger.error(f"Error deleting payment proof file: {str(e)}")

        db.session.delete(payment)
        
        # Revert bank balance (Credit back)
        if payment.payment_method == 'bank_transfer' and payment.bank_account_id:
             try:
                from app.crud.bank_account_crud import update_account_balance
                # Reverting a debit means adding the money back
                update_account_balance(payment.bank_account_id, payment.amount, 'credit')
             except Exception as e:
                logger.error(f"Failed to revert bank balance for deleted ISP payment {payment.id}: {e}")

        db.session.commit()

        log_action(
            current_user_id,
            'DELETE',
            'isp_payments',
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
        raise ISPPaymentError(str(e))
    except Exception as e:
        logger.error(f"Error deleting ISP payment {id}: {str(e)}")
        db.session.rollback()
        raise ISPPaymentError("Failed to delete ISP payment")

def get_isp_payment_proof(payment_id, company_id):
    try:
        payment = ISPPayment.query.filter_by(id=payment_id, company_id=company_id).first()
        if not payment:
            raise ValueError("ISP payment not found")

        payment_proof_details = {
            'payment_id': str(payment.id),
            'proof_of_payment': payment.payment_proof
        }
        return payment_proof_details
    except ValueError as validation_error:
        logger.error(f"Validation error: {str(validation_error)}")
        raise ISPPaymentError(str(validation_error))
    except Exception as general_error:
        logger.error(f"Unexpected error while retrieving payment proof: {str(general_error)}")
        raise ISPPaymentError("Unable to retrieve the payment proof")