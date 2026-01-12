"""
Employee Portal CRUD Operations
Self-service functions for employees to view and manage their own data.
All functions are scoped to the logged-in employee.
"""

from app import db
from app.models import (
    User, Customer, Complaint, Task, TaskAssignee, RecoveryTask,
    InventoryAssignment, InventoryItem, EmployeeLedger, Payment, Invoice
)
from sqlalchemy import func, and_, or_, case
from datetime import datetime, timedelta
import pytz

PKT = pytz.timezone('Asia/Karachi')


def get_employee_profile(employee_id):
    """Get full profile for logged-in employee."""
    employee = User.query.get(employee_id)
    if not employee:
        return None
    
    return {
        'id': str(employee.id),
        'username': employee.username,
        'email': employee.email,
        'first_name': employee.first_name,
        'last_name': employee.last_name,
        'contact_number': employee.contact_number,
        'cnic': employee.cnic,
        'role': employee.role,
        'is_active': employee.is_active,
        'emergency_contact': employee.emergency_contact,
        'house_address': employee.house_address,
        'joining_date': employee.joining_date.isoformat() if employee.joining_date else None,
        'salary': float(employee.salary) if employee.salary else 0,
        'current_balance': float(employee.current_balance) if employee.current_balance else 0,
        'paid_amount': float(employee.paid_amount) if employee.paid_amount else 0,
        'picture': employee.picture,
        'cnic_image': employee.cnic_image,
        'utility_bill_image': employee.utility_bill_image,
        'reference_name': employee.reference_name,
        'reference_contact': employee.reference_contact,
        'reference_cnic_image': employee.reference_cnic_image,
        'created_at': employee.created_at.isoformat() if employee.created_at else None,
    }


def update_employee_profile(employee_id, data):
    """Update editable profile fields for logged-in employee."""
    employee = User.query.get(employee_id)
    if not employee:
        raise ValueError("Employee not found")
    
    # Only allow specific fields to be updated
    allowed_fields = ['contact_number', 'emergency_contact', 'house_address']
    
    for field in allowed_fields:
        if field in data:
            setattr(employee, field, data[field])
    
    db.session.commit()
    return get_employee_profile(employee_id)


def get_employee_dashboard_stats(employee_id, company_id):
    """Get aggregated dashboard statistics for employee."""
    now = datetime.now(PKT)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    # Pending Tasks (assigned to employee)
    pending_tasks = db.session.query(func.count(Task.id)).join(
        TaskAssignee, Task.id == TaskAssignee.task_id
    ).filter(
        TaskAssignee.employee_id == employee_id,
        Task.status.in_(['pending', 'in_progress']),
        Task.is_active == True
    ).scalar() or 0
    
    # Open Complaints
    open_complaints = db.session.query(func.count(Complaint.id)).filter(
        Complaint.assigned_to == employee_id,
        Complaint.status.in_(['open', 'in_progress']),
        Complaint.is_active == True
    ).scalar() or 0
    
    # Managed Customers
    managed_customers = db.session.query(func.count(Customer.id)).filter(
        Customer.technician_id == employee_id,
        Customer.is_active == True
    ).scalar() or 0
    
    total_managed = db.session.query(func.count(Customer.id)).filter(
        Customer.technician_id == employee_id
    ).scalar() or 0
    
    # Current Balance
    employee = User.query.get(employee_id)
    current_balance = float(employee.current_balance) if employee and employee.current_balance else 0
    
    # Today's Collections (payments received by employee)
    todays_collections = db.session.query(func.coalesce(func.sum(Payment.amount), 0)).filter(
        Payment.received_by == employee_id,
        Payment.status == 'verified',
        Payment.payment_date >= today_start
    ).scalar() or 0
    
    # Pending Recoveries
    pending_recoveries = db.session.query(func.count(RecoveryTask.id)).filter(
        RecoveryTask.assigned_to == employee_id,
        RecoveryTask.status == 'pending'
    ).scalar() or 0
    
    # This month's earnings
    month_earnings = db.session.query(func.coalesce(func.sum(EmployeeLedger.amount), 0)).filter(
        EmployeeLedger.employee_id == employee_id,
        EmployeeLedger.amount > 0,
        EmployeeLedger.created_at >= month_start
    ).scalar() or 0
    
    return {
        'pending_tasks': pending_tasks,
        'open_complaints': open_complaints,
        'managed_customers': managed_customers,
        'total_managed_customers': total_managed,
        'current_balance': current_balance,
        'todays_collections': float(todays_collections),
        'pending_recoveries': pending_recoveries,
        'month_earnings': float(month_earnings),
    }


def get_employee_performance_metrics(employee_id):
    """Calculate performance metrics for employee."""
    now = datetime.now(PKT)
    
    # Complaint metrics
    total_complaints = db.session.query(func.count(Complaint.id)).filter(
        Complaint.assigned_to == employee_id
    ).scalar() or 0
    
    resolved_complaints = db.session.query(func.count(Complaint.id)).filter(
        Complaint.assigned_to == employee_id,
        Complaint.status == 'resolved'
    ).scalar() or 0
    
    complaint_resolution_rate = (resolved_complaints / total_complaints * 100) if total_complaints > 0 else 0
    
    # Average resolution time (in hours)
    avg_resolution_time = db.session.query(
        func.avg(
            func.extract('epoch', Complaint.resolved_at - Complaint.created_at) / 3600
        )
    ).filter(
        Complaint.assigned_to == employee_id,
        Complaint.status == 'resolved',
        Complaint.resolved_at.isnot(None)
    ).scalar() or 0
    
    # Task metrics
    total_tasks = db.session.query(func.count(Task.id)).join(
        TaskAssignee, Task.id == TaskAssignee.task_id
    ).filter(
        TaskAssignee.employee_id == employee_id
    ).scalar() or 0
    
    completed_tasks = db.session.query(func.count(Task.id)).join(
        TaskAssignee, Task.id == TaskAssignee.task_id
    ).filter(
        TaskAssignee.employee_id == employee_id,
        Task.status == 'completed'
    ).scalar() or 0
    
    task_completion_rate = (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0
    
    # Customer retention
    active_customers = db.session.query(func.count(Customer.id)).filter(
        Customer.technician_id == employee_id,
        Customer.is_active == True
    ).scalar() or 0
    
    total_customers = db.session.query(func.count(Customer.id)).filter(
        Customer.technician_id == employee_id
    ).scalar() or 0
    
    customer_retention_rate = (active_customers / total_customers * 100) if total_customers > 0 else 0
    
    # Recovery metrics
    total_recovery_amount = db.session.query(
        func.coalesce(func.sum(Invoice.total_amount), 0)
    ).join(
        RecoveryTask, Invoice.id == RecoveryTask.invoice_id
    ).filter(
        RecoveryTask.assigned_to == employee_id
    ).scalar() or 0
    
    collected_amount = db.session.query(
        func.coalesce(func.sum(Invoice.total_amount), 0)
    ).join(
        RecoveryTask, Invoice.id == RecoveryTask.invoice_id
    ).filter(
        RecoveryTask.assigned_to == employee_id,
        RecoveryTask.status == 'completed'
    ).scalar() or 0
    
    collection_efficiency = (float(collected_amount) / float(total_recovery_amount) * 100) if total_recovery_amount > 0 else 0
    
    return {
        'complaint_resolution_rate': round(complaint_resolution_rate, 1),
        'avg_resolution_time_hours': round(float(avg_resolution_time), 1),
        'task_completion_rate': round(task_completion_rate, 1),
        'customer_retention_rate': round(customer_retention_rate, 1),
        'collection_efficiency': round(collection_efficiency, 1),
        'total_complaints_assigned': total_complaints,
        'resolved_complaints': resolved_complaints,
        'total_tasks_assigned': total_tasks,
        'completed_tasks': completed_tasks,
        'active_customers': active_customers,
        'total_managed_customers': total_customers,
    }


def get_employee_tasks(employee_id, filters=None):
    """Get tasks assigned to employee with complete details."""
    filters = filters or {}
    
    query = db.session.query(Task).join(
        TaskAssignee, Task.id == TaskAssignee.task_id
    ).filter(
        TaskAssignee.employee_id == employee_id,
        Task.is_active == True
    )
    
    if filters.get('status'):
        query = query.filter(Task.status == filters['status'])
    
    if filters.get('priority'):
        query = query.filter(Task.priority == filters['priority'])
    
    if filters.get('task_type'):
        query = query.filter(Task.task_type == filters['task_type'])
    
    tasks = query.order_by(Task.due_date.asc()).all()
    
    result = []
    for t in tasks:
        customer = t.customer
        task_data = {
            'id': str(t.id),
            'task_type': t.task_type,
            'priority': t.priority,
            'status': t.status,
            'due_date': t.due_date.isoformat() if t.due_date else None,
            'notes': t.notes,
            'completion_notes': t.completion_notes,
            'completion_proof': t.completion_proof,
            'created_at': t.created_at.isoformat() if t.created_at else None,
            'completed_at': t.completed_at.isoformat() if t.completed_at else None,
            'customer_id': str(t.customer_id) if t.customer_id else None,
            'customer_name': None,
            'customer_phone': None,
            'customer_address': None,
            'customer_area': None,
            'customer_internet_id': None,
        }
        
        if customer:
            task_data.update({
                'customer_name': f"{customer.first_name} {customer.last_name}",
                'customer_phone': customer.phone_1,
                'customer_address': customer.installation_address,
                'customer_area': customer.area.name if customer.area else None,
                'customer_internet_id': customer.internet_id,
            })
        
        result.append(task_data)
    
    return result


def update_task_status(task_id, employee_id, new_status, notes=None, completion_notes=None, completion_proof=None):
    """Update task status (only if assigned to employee)."""
    # Verify employee is assigned to this task
    assignment = TaskAssignee.query.filter_by(
        task_id=task_id,
        employee_id=employee_id
    ).first()
    
    if not assignment:
        raise ValueError("Task not assigned to you")
    
    task = Task.query.get(task_id)
    if not task:
        raise ValueError("Task not found")
    
    valid_statuses = ['pending', 'in_progress', 'completed', 'cancelled']
    if new_status not in valid_statuses:
        raise ValueError(f"Invalid status. Must be one of: {valid_statuses}")
    
    task.status = new_status
    if notes:
        task.notes = notes
    if completion_notes:
        task.completion_notes = completion_notes
    if completion_proof:
        task.completion_proof = completion_proof
    
    if new_status == 'completed':
        task.completed_at = datetime.now(PKT)
    
    db.session.commit()
    return {'message': 'Task updated successfully'}


def get_employee_complaints(employee_id, filters=None):
    """Get complaints assigned to employee with complete details."""
    filters = filters or {}
    
    query = Complaint.query.filter(
        Complaint.assigned_to == employee_id,
        Complaint.is_active == True
    )
    
    if filters.get('status'):
        query = query.filter(Complaint.status == filters['status'])
    
    complaints = query.order_by(Complaint.created_at.desc()).all()
    
    result = []
    for c in complaints:
        customer = c.customer
        complaint_data = {
            'id': str(c.id),
            'ticket_number': c.ticket_number,
            'description': c.description,
            'status': c.status,
            'created_at': c.created_at.isoformat() if c.created_at else None,
            'updated_at': c.updated_at.isoformat() if c.updated_at else None,
            'resolved_at': c.resolved_at.isoformat() if c.resolved_at else None,
            'response_due_date': c.response_due_date.isoformat() if c.response_due_date else None,
            'resolution_attempts': c.resolution_attempts or 0,
            'satisfaction_rating': c.satisfaction_rating,
            'resolution_proof': c.resolution_proof,
            'remarks': c.remarks,
            'attachment_path': c.attachment_path,
            'feedback_comments': c.feedback_comments,
            'customer_id': str(c.customer_id) if c.customer_id else None,
            'customer_name': None,
            'customer_phone': None,
            'customer_address': None,
            'customer_area': None,
            'customer_internet_id': None,
        }
        
        if customer:
            complaint_data.update({
                'customer_name': f"{customer.first_name} {customer.last_name}",
                'customer_phone': customer.phone_1,
                'customer_address': customer.installation_address,
                'customer_area': customer.area.name if customer.area else None,
                'customer_internet_id': customer.internet_id,
            })
        
        result.append(complaint_data)
    
    return result


def update_complaint_status(complaint_id, employee_id, new_status, remarks=None, resolution_proof=None):
    """Update complaint status (only if assigned to employee)."""
    complaint = Complaint.query.filter_by(
        id=complaint_id,
        assigned_to=employee_id
    ).first()
    
    if not complaint:
        raise ValueError("Complaint not found or not assigned to you")
    
    valid_statuses = ['open', 'in_progress', 'resolved', 'closed']
    if new_status not in valid_statuses:
        raise ValueError(f"Invalid status. Must be one of: {valid_statuses}")
    
    complaint.status = new_status
    
    if remarks:
        complaint.remarks = remarks
    
    if resolution_proof:
        complaint.resolution_proof = resolution_proof
    
    if new_status == 'resolved':
        complaint.resolved_at = datetime.now(PKT)
        # Award commission if applicable
        employee = User.query.get(employee_id)
        if employee and employee.commission_amount_per_complaint:
            commission = float(employee.commission_amount_per_complaint)
            employee.current_balance = (employee.current_balance or 0) + commission
            
            # Add ledger entry
            ledger_entry = EmployeeLedger(
                company_id=employee.company_id,
                employee_id=employee_id,
                transaction_type='complaint_commission',
                amount=commission,
                description=f"Commission for resolving complaint #{complaint.ticket_number}",
                reference_id=complaint.id
            )
            db.session.add(ledger_entry)
    
    db.session.commit()
    return {'message': 'Complaint updated successfully'}


def get_managed_customers(employee_id, filters=None):
    """Get customers managed by employee (technician)."""
    filters = filters or {}
    
    query = Customer.query.filter(Customer.technician_id == employee_id)
    
    if filters.get('is_active') is not None:
        query = query.filter(Customer.is_active == filters['is_active'])
    
    if filters.get('search'):
        search = f"%{filters['search']}%"
        query = query.filter(
            or_(
                Customer.first_name.ilike(search),
                Customer.last_name.ilike(search),
                Customer.internet_id.ilike(search),
                Customer.phone_1.ilike(search)
            )
        )
    
    customers = query.order_by(Customer.first_name.asc()).all()
    
    result = []
    for c in customers:
        # Calculate total due
        total_due = 0
        if hasattr(c, 'invoices') and c.invoices:
            for inv in c.invoices:
                if inv.status != 'paid':
                    paid = sum(float(p.amount) for p in inv.payments if p.status == 'verified') if inv.payments else 0
                    total_due += float(inv.total_amount) - paid
        
        customer_data = {
            'id': str(c.id),
            'internet_id': c.internet_id,
            'first_name': c.first_name,
            'last_name': c.last_name,
            'email': c.email,
            'phone_1': c.phone_1,
            'phone_2': c.phone_2,
            'cnic': c.cnic,
            'installation_address': c.installation_address,
            'area': c.area.name if c.area else None,
            'sub_zone': c.sub_zone.name if c.sub_zone else None,
            'isp_name': c.isp.name if c.isp else None,
            'connection_type': c.connection_type,
            'is_active': c.is_active,
            'installation_date': c.installation_date.isoformat() if c.installation_date else None,
            'total_due': total_due,
        }
        result.append(customer_data)
    
    return result


def get_employee_financial(employee_id):
    """Get financial summary and ledger for employee."""
    employee = User.query.get(employee_id)
    if not employee:
        return None
    
    now = datetime.now(PKT)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    # Get ledger entries
    ledger_entries = EmployeeLedger.query.filter(
        EmployeeLedger.employee_id == employee_id
    ).order_by(EmployeeLedger.created_at.desc()).limit(100).all()
    
    # Calculate totals
    total_earned = db.session.query(
        func.coalesce(func.sum(EmployeeLedger.amount), 0)
    ).filter(
        EmployeeLedger.employee_id == employee_id,
        EmployeeLedger.amount > 0
    ).scalar() or 0
    
    month_earnings = db.session.query(
        func.coalesce(func.sum(EmployeeLedger.amount), 0)
    ).filter(
        EmployeeLedger.employee_id == employee_id,
        EmployeeLedger.amount > 0,
        EmployeeLedger.created_at >= month_start
    ).scalar() or 0
    
    # Breakdown by type
    breakdown = db.session.query(
        EmployeeLedger.transaction_type,
        func.sum(EmployeeLedger.amount)
    ).filter(
        EmployeeLedger.employee_id == employee_id
    ).group_by(EmployeeLedger.transaction_type).all()
    
    return {
        'current_balance': float(employee.current_balance) if employee.current_balance else 0,
        'total_paid': float(employee.paid_amount) if employee.paid_amount else 0,
        'total_earned': float(total_earned),
        'month_earnings': float(month_earnings),
        'salary': float(employee.salary) if employee.salary else 0,
        'breakdown': {t: float(a) for t, a in breakdown},
        'ledger': [{
            'id': str(e.id),
            'transaction_type': e.transaction_type,
            'amount': float(e.amount),
            'description': e.description,
            'created_at': e.created_at.isoformat() if e.created_at else None,
        } for e in ledger_entries]
    }


def get_employee_inventory(employee_id):
    """Get inventory items assigned to employee."""
    assignments = InventoryAssignment.query.filter(
        InventoryAssignment.assigned_to_employee_id == employee_id
    ).order_by(InventoryAssignment.assigned_at.desc()).all()
    
    return [{
        'id': str(a.id),
        'item_id': str(a.inventory_item_id),
        'item_type': a.inventory_item.item_type if a.inventory_item else None,
        'serial_number': a.inventory_item.attributes.get('serial_number') if a.inventory_item and a.inventory_item.attributes else None,
        'assigned_at': a.assigned_at.isoformat() if a.assigned_at else None,
        'returned_at': a.returned_at.isoformat() if a.returned_at else None,
        'status': a.status,
    } for a in assignments]


def get_employee_recoveries(employee_id, filters=None):
    """Get recovery tasks assigned to employee with complete details."""
    filters = filters or {}
    
    query = RecoveryTask.query.filter(RecoveryTask.assigned_to == employee_id)
    
    if filters.get('status'):
        query = query.filter(RecoveryTask.status == filters['status'])
    
    recoveries = query.order_by(RecoveryTask.created_at.desc()).all()
    
    result = []
    for r in recoveries:
        invoice = r.invoice
        customer = invoice.customer if invoice else None
        
        recovery_data = {
            'id': str(r.id),
            'invoice_id': str(r.invoice_id),
            'invoice_number': invoice.invoice_number if invoice else None,
            'invoice_due_date': invoice.due_date.isoformat() if invoice and invoice.due_date else None,
            'amount': float(invoice.total_amount) if invoice else 0,
            'paid_amount': sum(float(p.amount) for p in invoice.payments if p.status == 'verified') if invoice and invoice.payments else 0,
            'status': r.status,
            'notes': r.notes,
            'completion_notes': r.completion_notes,
            'completion_proof': r.completion_proof,
            'created_at': r.created_at.isoformat() if r.created_at else None,
            'completed_at': r.completed_at.isoformat() if r.completed_at else None,
            'customer_id': str(customer.id) if customer else None,
            'customer_name': f"{customer.first_name} {customer.last_name}" if customer else None,
            'customer_phone': customer.phone_1 if customer else None,
            'customer_address': customer.installation_address if customer else None,
            'customer_area': customer.area.name if customer and customer.area else None,
            'customer_internet_id': customer.internet_id if customer else None,
        }
        
        # Calculate remaining amount
        recovery_data['remaining_amount'] = recovery_data['amount'] - recovery_data['paid_amount']
        
        result.append(recovery_data)
    
    return result


def update_recovery_status(recovery_id, employee_id, new_status, notes=None, completion_notes=None, completion_proof=None):
    """Update recovery task status (only if assigned to employee)."""
    recovery = RecoveryTask.query.filter_by(
        id=recovery_id,
        assigned_to=employee_id
    ).first()
    
    if not recovery:
        raise ValueError("Recovery task not found or not assigned to you")
    
    valid_statuses = ['pending', 'in_progress', 'completed', 'cancelled']
    if new_status not in valid_statuses:
        raise ValueError(f"Invalid status. Must be one of: {valid_statuses}")
    
    recovery.status = new_status
    if notes:
        recovery.notes = notes
    if completion_notes:
        recovery.completion_notes = completion_notes
    if completion_proof:
        recovery.completion_proof = completion_proof
    
    if new_status == 'completed':
        recovery.completed_at = datetime.now(PKT)
    
    db.session.commit()
    return {'message': 'Recovery task updated successfully'}
