from app import db
from app.models import Customer, Invoice, Payment, Complaint, Area, ServicePlan, RecoveryTask,ISP,InventoryItem
from app.utils.logging_utils import log_action
import uuid
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
import logging
from datetime import datetime
from flask import jsonify
from sqlalchemy import or_

logger = logging.getLogger(__name__)

def get_all_customers(company_id, user_role, employee_id):
    if user_role == 'super_admin' or user_role == 'employee':
        customers = Customer.query.all()
    elif user_role == 'auditor':
        customers = Customer.query.filter_by(is_active=True, company_id=company_id).all()
    elif user_role == 'company_owner':
        customers = Customer.query.filter_by(company_id=company_id).all()
    elif user_role == 'employee':
        customers = Customer.query.filter_by(company_id=company_id).all()
    result = []
    for customer in customers:
        area = Area.query.get(customer.area_id)
        service_plan = ServicePlan.query.get(customer.service_plan_id)
        isp = ISP.query.get(customer.isp_id)
        #Remove: splitter = InventoryItem.query.get(customer.splitter_id)
        result.append({
            'id': str(customer.id),
            'internet_id': customer.internet_id,
            'first_name': customer.first_name,
            'last_name': customer.last_name,
            'email': customer.email,
            'phone_1': customer.phone_1,
            'phone_2': customer.phone_2,
            'area': area.name if area else 'Unassigned',
            'installation_address': customer.installation_address,
            'service_plan': service_plan.name if service_plan else 'Unassigned',
            'isp': isp.name if isp else 'Unassigned',
            'connection_type': customer.connection_type,
            'internet_connection_type': customer.internet_connection_type,
            'tv_cable_connection_type': customer.tv_cable_connection_type,
            'installation_date': customer.installation_date.isoformat() if customer.installation_date else None,
            'is_active': customer.is_active,
            'cnic': customer.cnic,
            'cnic_front_image': customer.cnic_front_image,
            'cnic_back_image': customer.cnic_back_image,
            'gps_coordinates': customer.gps_coordinates,
            'agreement_document': customer.agreement_document
        })
    return result

def format_phone_number(phone):
    """Format phone number by removing all non-numeric characters."""
    if not phone:
        return None
    # Remove all non-digit characters
    cleaned = ''.join(filter(str.isdigit, str(phone)))
    # Remove '92' from start if it exists
    if cleaned.startswith('92'):
        cleaned = cleaned[2:]
    # Ensure the number starts with '92'
    return f"92{cleaned}"

def add_customer(data, user_role, current_user_id, ip_address, user_agent, company_id):
    try:
        # Format phone numbers before saving
        phone_1 = format_phone_number(data['phone_1'])
        phone_2 = format_phone_number(data.get('phone_2')) if data.get('phone_2') else None

        new_customer = Customer(
            company_id=uuid.UUID(data['company_id']),
            area_id=data['area_id'],
            service_plan_id=data['service_plan_id'],
            first_name=data['first_name'],
            last_name=data['last_name'],
            email=data['email'],
            internet_id=data['internet_id'],
            phone_1=phone_1,
            phone_2=phone_2,
            installation_address=data['installation_address'],
            installation_date=data['installation_date'],
            isp_id=data['isp_id'],
            connection_type=data['connection_type'],
            internet_connection_type=data.get('internet_connection_type'),
            wire_length=data.get('wire_length'),
            wire_ownership=data.get('wire_ownership'),
            router_ownership=data.get('router_ownership'),
            router_id=data.get('router_id'),
            router_serial_number=data.get('router_serial_number'),
            patch_cord_ownership=data.get('patch_cord_ownership'),
            patch_cord_count=data.get('patch_cord_count'),
            patch_cord_ethernet_ownership=data.get('patch_cord_ethernet_ownership'),
            patch_cord_ethernet_count=data.get('patch_cord_ethernet_count'),
            splicing_box_ownership=data.get('splicing_box_ownership'),
            splicing_box_serial_number=data.get('splicing_box_serial_number'),
            ethernet_cable_ownership=data.get('ethernet_cable_ownership'),
            ethernet_cable_length=data.get('ethernet_cable_length'),
            dish_ownership=data.get('dish_ownership'),
            dish_id=data.get('dish_id'),
            dish_mac_address=data.get('dish_mac_address'),
            tv_cable_connection_type=data.get('tv_cable_connection_type'),
            node_count=data.get('node_count'),
            stb_serial_number=data.get('stb_serial_number'),
            discount_amount=data.get('discount_amount'),
            recharge_date=data.get('recharge_date'),
            miscellaneous_details=data.get('miscellaneous_details'),
            miscellaneous_charges=data.get('miscellaneous_charges'),
            is_active=True,
            cnic=data['cnic'],
            cnic_front_image=data['cnic_front_image'],
            cnic_back_image=data['cnic_back_image'],
            gps_coordinates=data.get('gps_coordinates'),
            agreement_document=data.get('agreement_document')
        )
        db.session.add(new_customer)
        db.session.commit()

        log_action(
            current_user_id,
            'CREATE',
            'customers',
            new_customer.id,
            None,
            data,
            ip_address,
            user_agent,
            company_id
        )

        return new_customer
    except Exception as e:
        print('Error:', str(e))
        db.session.rollback()
        raise

def update_customer(id, data, company_id, user_role, current_user_id, ip_address, user_agent):
    if user_role == 'super_admin' or user_role == 'employee':
        customer = Customer.query.get(id)
    elif user_role == 'auditor':
        customer = Customer.query.filter_by(id=id, is_active=True, company_id=company_id).first()
    elif user_role == 'company_owner':
        customer = Customer.query.filter_by(id=id, company_id=company_id).first()
    
    if not customer:
        return None

    old_values = {
        'email': customer.email,
        'first_name': customer.first_name,
        'last_name': customer.last_name,
        'internet_id': customer.internet_id,
        'phone_1': customer.phone_1,
        'phone_2': customer.phone_2,
        'area_id': str(customer.area_id),
        'service_plan_id': str(customer.service_plan_id),
        'isp_id': str(customer.isp_id),
        'installation_address': customer.installation_address,
        'installation_date': customer.installation_date.isoformat() if customer.installation_date else None,
        'connection_type': customer.connection_type,
        'internet_connection_type': customer.internet_connection_type,
        'wire_length': customer.wire_length,
        'wire_ownership': customer.wire_ownership,
        'router_ownership': customer.router_ownership,
        'router_id': str(customer.router_id) if customer.router_id else None,
        'router_serial_number': customer.router_serial_number,
        'patch_cord_ownership': customer.patch_cord_ownership,
        'patch_cord_count': customer.patch_cord_count,
        'patch_cord_ethernet_ownership': customer.patch_cord_ethernet_ownership,
        'patch_cord_ethernet_count': customer.patch_cord_ethernet_count,
        'splicing_box_ownership': customer.splicing_box_ownership,
        'splicing_box_serial_number': customer.splicing_box_serial_number,
        'ethernet_cable_ownership': customer.ethernet_cable_ownership,
        'ethernet_cable_length': customer.ethernet_cable_length,
        'dish_ownership': customer.dish_ownership,
        'dish_id': str(customer.dish_id) if customer.dish_id else None,
        'dish_mac_address': customer.dish_mac_address,
        'tv_cable_connection_type': customer.tv_cable_connection_type,
        'node_count': customer.node_count,
        'stb_serial_number': customer.stb_serial_number,
        'discount_amount': float(customer.discount_amount) if customer.discount_amount else None,
        'recharge_date': customer.recharge_date.isoformat() if customer.recharge_date else None,
        'miscellaneous_details': customer.miscellaneous_details,
        'miscellaneous_charges': float(customer.miscellaneous_charges) if customer.miscellaneous_charges else None,
        'is_active': customer.is_active,
        'cnic': customer.cnic,
        'cnic_front_image': customer.cnic_front_image,
        'cnic_back_image': customer.cnic_back_image,
        'gps_coordinates': customer.gps_coordinates,
        'agreement_document': customer.agreement_document
    }

    for key, value in data.items():
        setattr(customer, key, value)

    db.session.commit()

    log_action(
        current_user_id,
        'UPDATE',
        'customers',
        customer.id,
        old_values,
        data,
        ip_address,
        user_agent,
        company_id
    )

    return customer

def delete_customer(id, company_id, user_role, current_user_id, ip_address, user_agent):
    if user_role == 'super_admin' or user_role == 'employee':
        customer = Customer.query.get(id)
    elif user_role == 'auditor':
        customer = Customer.query.filter_by(id=id, is_active=True, company_id=company_id).first()
    elif user_role == 'company_owner':
        customer = Customer.query.filter_by(id=id, company_id=company_id).first()
    
    if not customer:
        return False

    old_values = {
        'email': customer.email,
        'first_name': customer.first_name,
        'last_name': customer.last_name,
        'area_id': str(customer.area_id),
        'service_plan_id': str(customer.service_plan_id),
        'installation_address': customer.installation_address,
        'installation_date': customer.installation_date.isoformat() if customer.installation_date else None,
        'is_active': customer.is_active
    }

    db.session.delete(customer)
    db.session.commit()

    log_action(
        current_user_id,
        'DELETE',
        'customers',
        customer.id,
        old_values,
        None,
        ip_address,
        user_agent,
        company_id
    )

    return True

def toggle_customer_status(id, company_id, user_role, current_user_id, ip_address, user_agent):
    if user_role == 'super_admin' or user_role == 'employee':
        customer = Customer.query.get(id)
    elif user_role == 'auditor':
        customer = Customer.query.filter_by(id=id, is_active=True, company_id=company_id).first()
    elif user_role == 'company_owner':
        customer = Customer.query.filter_by(id=id, company_id=company_id).first()
    
    if not customer:
        return None

    old_status = customer.is_active
    customer.is_active = not customer.is_active
    db.session.commit()

    log_action(
        current_user_id,
        'UPDATE',
        'customers',
        customer.id,
        {'is_active': old_status},
        {'is_active': customer.is_active},
        ip_address,
        user_agent,
        company_id
    )

    return customer

def get_customer_details(id, company_id):
    try:
        # Check if customer exists
        customer = Customer.query.filter_by(id=id, company_id=company_id).first()
        if not customer:
            return {'error': 'Customer not found'}, 404
        
        # Safely get area and service plan
        area = Area.query.get(customer.area_id)
        service_plan = ServicePlan.query.get(customer.service_plan_id)
        isp = ISP.query.get(customer.isp_id)
        
        # Safely fetch related data
        invoices = Invoice.query.filter_by(customer_id=id).all() or []
        payments = Payment.query.join(Invoice).filter(Invoice.customer_id == id).all() or []
        complaints = Complaint.query.filter_by(customer_id=id).all() or []

        # Financial metrics with safe calculations
        total_amount_paid = sum(payment.amount for payment in payments)
        avg_monthly_payment = total_amount_paid / len(payments) if payments else 0
        payment_reliability_score = (len([p for p in payments if p.status == 'completed']) / len(payments) * 100) if payments else 0
        outstanding_balance = sum(invoice.total_amount for invoice in invoices if invoice.status == 'pending')
        avg_bill_amount = sum(invoice.total_amount for invoice in invoices) / len(invoices) if invoices else 0
        
        # Safe payment method calculation
        payment_methods = [payment.payment_method for payment in payments]
        most_used_payment_method = max(set(payment_methods), key=payment_methods.count) if payment_methods else 'N/A'
        
        # Safe late payment calculation
        late_payment_frequency = 0
        for payment in payments:
            invoice = Invoice.query.get(payment.invoice_id)
            if invoice and payment.payment_date > invoice.due_date:
                late_payment_frequency += 1

        # Service statistics with safe calculations
        service_duration = (datetime.now().date() - customer.installation_date).days if customer.installation_date else 0
        service_plan_history = [sp.name for sp in ServicePlan.query.join(Customer).filter(Customer.id == id).all()]
        upgrade_downgrade_frequency = len(service_plan_history) - 1
        
        # Safe area coverage calculation
        try:
            area_coverage_statistics = {
                area.name: Customer.query.filter_by(area_id=area.id).count() 
                for area in Area.query.all()
            }
        except Exception:
            area_coverage_statistics = {}

        # Support analysis with safe calculations
        total_complaints = len(complaints)
        
        # Safe resolution time calculation
        resolved_complaints = [c for c in complaints if c.resolved_at]
        avg_resolution_time = (
            sum((c.resolved_at - c.created_at).total_seconds() / 3600 for c in resolved_complaints) / len(resolved_complaints)
            if resolved_complaints else 0
        )
        
        # Safe complaint categories calculation
        complaint_categories = [c.category for c in complaints if c.category]
        complaint_categories_distribution = {
            category: complaint_categories.count(category)
            for category in set(complaint_categories)
        } if complaint_categories else {}
        
        # Safe satisfaction rating calculation
        rated_complaints = [c for c in complaints if c.satisfaction_rating]
        satisfaction_rating_avg = (
            sum(c.satisfaction_rating for c in rated_complaints) / len(rated_complaints)
            if rated_complaints else 0
        )
        
        resolution_attempts_avg = (
            sum(c.resolution_attempts for c in complaints) / total_complaints
            if total_complaints > 0 else 0
        )
        
        # Safe most common complaint types calculation
        most_common_complaint_types = (
            [category for category, count in sorted(
                complaint_categories_distribution.items(),
                key=lambda x: x[1],
                reverse=True
            )[:3]] if complaint_categories_distribution else []
        )

        # Billing patterns with safe calculations
        payment_timeline = [
            {'date': payment.payment_date.isoformat(), 'amount': float(payment.amount)}
            for payment in payments if payment.payment_date
        ]
        
        # Safe invoice payment history calculation
        invoice_payment_history = []
        for invoice in invoices:
            payment = next((p for p in payments if p.invoice_id == invoice.id), None)
            if payment and invoice.due_date:
                invoice_payment_history.append({
                    'invoiceId': str(invoice.id),
                    'daysToPay': (payment.payment_date - invoice.due_date).days
                })
        
        discount_usage = sum(1 for invoice in invoices if invoice.discount_percentage > 0)
        
        payment_method_preferences = {
            method: sum(1 for payment in payments if payment.payment_method == method)
            for method in set(p.payment_method for p in payments if p.payment_method)
        }

        # Recovery metrics with safe calculations
        first_invoice = Invoice.query.filter_by(customer_id=id).first()
        recovery_tasks = []
        recovery_tasks_history = []
        recovery_success_rate = 0
        payment_after_recovery_rate = 0
        avg_recovery_time = 0
        
        if first_invoice:
            recovery_tasks = RecoveryTask.query.filter_by(invoice_id=first_invoice.id).all() or []
            recovery_tasks_history = [
                {'date': task.created_at.isoformat(), 'status': task.status}
                for task in recovery_tasks if task.created_at
            ]
            
            if recovery_tasks:
                completed_tasks = [task for task in recovery_tasks if task.status == 'completed']
                recovery_success_rate = (len(completed_tasks) / len(recovery_tasks)) * 100
                
                successful_recoveries = sum(1 for task in completed_tasks 
                    if any(payment.payment_date > task.updated_at for payment in payments))
                payment_after_recovery_rate = (successful_recoveries / len(recovery_tasks)) * 100
                
                if completed_tasks:
                    avg_recovery_time = sum(
                        (task.updated_at - task.created_at).days 
                        for task in completed_tasks 
                        if task.updated_at and task.created_at
                    ) / len(completed_tasks)
        print('Total Paid Amount:',float(total_amount_paid) if total_amount_paid is not None else 0)
        return {
            'id': str(customer.id),
            'first_name': customer.first_name,
            'last_name': customer.last_name,
            'email': customer.email,
            'internet_id': customer.internet_id,
            'phone_1': customer.phone_1,
            'phone_2': customer.phone_2,
            'area': area.name if area else 'Unassigned',
            'service_plan': service_plan.name if service_plan else 'Unassigned',
            'isp': isp.name if isp else 'Unassigned',
            'installation_address': customer.installation_address,
            'installation_date': customer.installation_date.isoformat() if customer.installation_date else None,
            'connection_type': customer.connection_type,
            'wire_length': customer.wire_length,
            'router_id': str(customer.router_id) if customer.router_id else None,
            'router_ownership': customer.router_ownership,
            'router_serial_number': customer.router_serial_number,
            'patch_cord_ownership': customer.patch_cord_ownership,
            'patch_cord_count': customer.patch_cord_count,
            'splicing_box_ownership': customer.splicing_box_ownership,
            'splicing_box_serial_number': customer.splicing_box_serial_number,
            'ethernet_cable_ownership': customer.ethernet_cable_ownership,
            'ethernet_cable_length': customer.ethernet_cable_length,
            'dish_id': str(customer.dish_id) if customer.dish_id else None,
            'dish_ownership': customer.dish_ownership,
            'dish_mac_address': customer.dish_mac_address,
            'tv_cable_connection_type': customer.tv_cable_connection_type,
            'node_count': customer.node_count,
            'stb_serial_number': customer.stb_serial_number, 
            'discount_amount': float(customer.discount_amount) if customer.discount_amount else None,
            'recharge_date': customer.recharge_date.isoformat() if customer.recharge_date else None,
            'is_active': customer.is_active,
            'cnic': customer.cnic,
            'cnic_front_image': customer.cnic_front_image,
            'cnic_back_image': customer.cnic_back_image,
            'gps_coordinates': customer.gps_coordinates,
            'agreement_document': customer.agreement_document,
            'financialMetrics': {
                'totalAmountPaid': float(total_amount_paid) if total_amount_paid is not None else 0,
                'averageMonthlyPayment': float(avg_monthly_payment) if avg_monthly_payment is not None else 0,
                'paymentReliabilityScore': float(payment_reliability_score) if payment_reliability_score is not None else 0,
                'outstandingBalance': float(outstanding_balance) if outstanding_balance is not None else 0,
                'averageBillAmount': float(avg_bill_amount) if avg_bill_amount is not None else 0,
                'mostUsedPaymentMethod': most_used_payment_method or 'N/A',
                'latePaymentFrequency': late_payment_frequency or 0
            },
            'serviceStatistics': {
                'serviceDuration': service_duration,
                'servicePlanHistory': service_plan_history,
                'upgradeDowngradeFrequency': upgrade_downgrade_frequency,
                'areaCoverageStatistics': area_coverage_statistics
            },
            'supportAnalysis': {
                'totalComplaints': total_complaints,
                'averageResolutionTime': float(avg_resolution_time),
                'complaintCategoriesDistribution': complaint_categories_distribution,
                'satisfactionRatingAverage': float(satisfaction_rating_avg),
                'resolutionAttemptsAverage': float(resolution_attempts_avg),
                'supportResponseTime': 0,  # Not available in current model
                'mostCommonComplaintTypes': most_common_complaint_types
            },
            'billingPatterns': {
                'paymentTimeline': payment_timeline,
                'invoicePaymentHistory': invoice_payment_history,
                'discountUsage': discount_usage,
                'lateFeeOccurrences': 0,  # Not available in current model
                'paymentMethodPreferences': payment_method_preferences
            },
            'recoveryMetrics': {
                'recoveryTasksHistory': recovery_tasks_history,
                'recoverySuccessRate': float(recovery_success_rate),
                'paymentAfterRecoveryRate': float(payment_after_recovery_rate),
                'averageRecoveryTime': float(avg_recovery_time)
            }
        }
    except Exception as e:
        # Log the error for debugging
        print(f"Error in get_customer_details: {str(e)}")
        return {'error': 'Internal server error'}, 500

def get_customer_invoices(id, company_id):
    invoices = Invoice.query.join(Customer).filter(
        Customer.id == id,
        Customer.company_id == company_id
    ).all()
    return [{
        'id': str(invoice.id),
        'invoice_number': invoice.invoice_number,
        'billing_start_date': invoice.billing_start_date.isoformat(),
        'billing_end_date': invoice.billing_end_date.isoformat(),
        'due_date': invoice.due_date.isoformat(),
        'total_amount': float(invoice.total_amount),
        'status': invoice.status
    } for invoice in invoices]

def get_customer_payments(id, company_id):
    payments = Payment.query.join(Invoice).join(Customer).filter(
        Customer.id == id,
        Customer.company_id == company_id
    ).all()
    return [{
        'id': str(payment.id),
        'invoice_id': str(payment.invoice_id),
        'amount': float(payment.amount),
        'payment_date': payment.payment_date.isoformat(),
        'payment_method': payment.payment_method,
        'status': payment.status
    } for payment in payments]

def get_customer_complaints(id, company_id):
    complaints = Complaint.query.join(Customer).filter(
        Customer.id == id,
        Customer.company_id == company_id
    ).all()
    return [{
        'id': str(complaint.id),
        'title': complaint.title,
        'description': complaint.description,
        'status': complaint.status,
        'created_at': complaint.created_at.isoformat()
    } for complaint in complaints]

def get_customer_cnic(id, company_id):
    customer = Customer.query.filter_by(id=id, company_id=company_id).first()
    if customer:
        cnic_front_image_path = str(customer.cnic_front_image)
        cnic_back_image_path = str(customer.cnic_back_image)

        if cnic_back_image_path or cnic_front_image_path:
            return customer
        else:
            return None
    return None



def search_customer(company_id, search_term):
    customer = Customer.query.filter(
        Customer.company_id == company_id,
        or_(
            Customer.phone_1.ilike(f'%{search_term}%'),
            Customer.phone_2.ilike(f'%{search_term}%'),
            Customer.internet_id.ilike(f'%{search_term}%')
        )
    ).first()

    if customer:
        return {
            'id': str(customer.id),
            'first_name': customer.first_name,
            'last_name': customer.last_name,
            'internet_id': customer.internet_id,
            'phone_1': customer.phone_1,
            'phone_2': customer.phone_2,
            'installation_address': customer.installation_address,
            'gps_coordinates': customer.gps_coordinates
        }
    return None