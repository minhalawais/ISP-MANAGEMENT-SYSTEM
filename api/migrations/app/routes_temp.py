from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app.models import User, Company, Customer
from app import db
from app.crud import (
    get_all_employees, add_employee, update_employee, delete_employee,
    toggle_employee_status, get_all_roles, get_all_modules,
    get_all_customers, add_customer, update_customer, delete_customer,
    toggle_customer_status, get_all_areas,
    get_all_service_plans, add_service_plan, update_service_plan, delete_service_plan,
    toggle_service_plan_status
)
from app import crud
import os
from werkzeug.utils import secure_filename

main = Blueprint('main', __name__)

@main.route('/')
def index():
    return jsonify({"message": "Welcome to the ISP Management System!"})

@main.route('/main-menu', methods=['GET'])
@jwt_required()
def main_menu():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user or user.role != 'company_owner':
        return jsonify({"error": "Unauthorized access"}), 403
    
    company = Company.query.get(user.company_id)
    
    menu_items = [
        {"title": "Employee Management", "url": "/employee-management"},
        {"title": "Customer Management", "url": "/customer-management"},
        {"title": "Service Plan Management", "url": "/service-plan-management"},
        {"title": "Billing & Invoices", "url": "/billing-invoices"},
        {"title": "Complaint Management", "url": "/complaint-management"},
        {"title": "Inventory Management", "url": "/inventory-management"},
        {"title": "Supplier Management", "url": "/supplier-management"},
        {"title": "Reporting & Analytics", "url": "/reporting-analytics"},
        {"title": "Company Settings", "url": "/company-settings"},
        {"title": "Area/Zone Management", "url": "/area-zone-management"},
        {"title": "Recovery Task Management", "url": "/recovery-task-management"},
        {"title": "Audit Log Viewer", "url": "/audit-log-viewer"},
        {"title": "Messaging", "url": "/messaging"},
        {"title": "Task Management", "url": "/task-management"},
    ]
    
    return jsonify({
        "company_name": company.name,
        "menu_items": menu_items
    }), 200

@main.route('/employees/list', methods=['GET'])
@jwt_required()
def get_employees():
    claims = get_jwt()
    company_id = claims['company_id']
    employees = crud.get_all_employees(company_id)
    return jsonify(employees), 200

@main.route('/employees/add', methods=['POST'])
@jwt_required()
def add_new_employee():
    claims = get_jwt()
    company_id = claims['company_id']
    data = request.json
    data['company_id'] = company_id
    new_employee = add_employee(data)
    return jsonify({'message': 'Employee added successfully', 'id': str(new_employee.id)}), 201

@main.route('/employees/update/<string:id>', methods=['PUT'])
@jwt_required()
def update_existing_employee(id):
    claims = get_jwt()
    company_id = claims['company_id']
    data = request.json
    updated_employee = update_employee(id, data, company_id)
    if updated_employee:
        return jsonify({'message': 'Employee updated successfully'}), 200
    return jsonify({'message': 'Employee not found'}), 404

@main.route('/employees/delete/<string:id>', methods=['DELETE'])
@jwt_required()
def delete_existing_employee(id):
    claims = get_jwt()
    company_id = claims['company_id']
    if delete_employee(id, company_id):
        return jsonify({'message': 'Employee deleted successfully'}), 200
    return jsonify({'message': 'Employee not found'}), 404

@main.route('/employees/toggle-status/<string:id>', methods=['PATCH'])
@jwt_required()
def toggle_employee_active_status(id):
    claims = get_jwt()
    company_id = claims['company_id']
    employee = toggle_employee_status(id, company_id)
    if employee:
        return jsonify({'message': f"Employee {'activated' if employee.is_active else 'deactivated'} successfully"}), 200
    return jsonify({'message': 'Employee not found'}), 404

@main.route('/employees/roles', methods=['GET'])
@jwt_required()
def get_roles():
    roles = get_all_roles()
    return jsonify(roles), 200

@main.route('/employees/modules', methods=['GET'])
@jwt_required()
def get_modules():
    modules = get_all_modules()
    return jsonify(modules), 200

@main.route('/customers/list', methods=['GET'])
@jwt_required()
def get_customers():
    claims = get_jwt()
    company_id = claims['company_id']
    customers = crud.get_all_customers(company_id)
    return jsonify(customers), 200

@main.route('/customers/add', methods=['POST'])
@jwt_required()
def add_new_customer():
    claims = get_jwt()
    company_id = claims['company_id']
    data = request.json
    data['company_id'] = company_id
    try:
        new_customer = add_customer(data)
        return jsonify({'message': 'Customer added successfully', 'id': str(new_customer.id)}), 201
    except Exception as e:
        return jsonify({'error': 'Failed to add customer', 'message': str(e)}), 400

@main.route('/customers/update/<string:id>', methods=['PUT'])
@jwt_required()
def update_existing_customer(id):
    claims = get_jwt()
    company_id = claims['company_id']
    data = request.json
    updated_customer = update_customer(id, data, company_id)
    if updated_customer:
        return jsonify({'message': 'Customer updated successfully'}), 200
    return jsonify({'message': 'Customer not found'}), 404

@main.route('/customers/delete/<string:id>', methods=['DELETE'])
@jwt_required()
def delete_existing_customer(id):
    claims = get_jwt()
    company_id = claims['company_id']
    if delete_customer(id, company_id):
        return jsonify({'message': 'Customer deleted successfully'}), 200
    return jsonify({'message': 'Customer not found'}), 404

@main.route('/customers/toggle-status/<string:id>', methods=['PATCH'])
@jwt_required()
def toggle_customer_active_status(id):
    claims = get_jwt()
    company_id = claims['company_id']
    customer = toggle_customer_status(id, company_id)
    if customer:
        return jsonify({'message': f"Customer {'activated' if customer.is_active else 'deactivated'} successfully"}), 200
    return jsonify({'message': 'Customer not found'}), 404


@main.route('/service-plans/list', methods=['GET'])
@jwt_required()
def get_service_plans():
    claims = get_jwt()
    company_id = claims['company_id']
    service_plans = get_all_service_plans(company_id)
    return jsonify(service_plans), 200

@main.route('/service-plans/add', methods=['POST'])
@jwt_required()
def add_new_service_plan():
    claims = get_jwt()
    company_id = claims['company_id']
    data = request.json
    data['company_id'] = company_id
    try:
        new_service_plan = add_service_plan(data)
        return jsonify({'message': 'Service plan added successfully', 'id': str(new_service_plan.id)}), 201
    except Exception as e:
        return jsonify({'error': 'Failed to add service plan', 'message': str(e)}), 400

@main.route('/service-plans/update/<string:id>', methods=['PUT'])
@jwt_required()
def update_existing_service_plan(id):
    claims = get_jwt()
    company_id = claims['company_id']
    data = request.json
    updated_service_plan = update_service_plan(id, data, company_id)
    if updated_service_plan:
        return jsonify({'message': 'Service plan updated successfully'}), 200
    return jsonify({'message': 'Service plan not found'}), 404

@main.route('/service-plans/delete/<string:id>', methods=['DELETE'])
@jwt_required()
def delete_existing_service_plan(id):
    claims = get_jwt()
    company_id = claims['company_id']
    if delete_service_plan(id, company_id):
        return jsonify({'message': 'Service plan deleted successfully'}), 200
    return jsonify({'message': 'Service plan not found'}), 404

@main.route('/service-plans/toggle-status/<string:id>', methods=['PATCH'])
@jwt_required()
def toggle_service_plan_active_status(id):
    claims = get_jwt()
    company_id = claims['company_id']
    service_plan = toggle_service_plan_status(id, company_id)
    if service_plan:
        return jsonify({'message': f"Service plan {'activated' if service_plan.is_active else 'deactivated'} successfully"}), 200
    return jsonify({'message': 'Service plan not found'}), 404

@main.route('/company/id', methods=['GET'])
@jwt_required()
def get_company_id():
    claims = get_jwt()
    company_id = claims['company_id']
    return jsonify({"company_id": company_id}), 200

@main.route('/complaints/list', methods=['GET'])
@jwt_required()
def get_complaints():
    claims = get_jwt()
    company_id = claims['company_id']
    complaints = crud.get_all_complaints(company_id)
    return jsonify(complaints), 200

@main.route('/complaints/add', methods=['POST'])
@jwt_required()
def add_new_complaint():
    data = request.json
    claims = get_jwt()
    company_id = claims['company_id']
    try:
        new_complaint = crud.add_complaint(data, company_id)
        return jsonify({'message': 'Complaint added successfully', 'id': str(new_complaint.id)}), 201
    except Exception as e:
        return jsonify({'error': 'Failed to add complaint', 'message': str(e)}), 400

@main.route('/complaints/update/<string:id>', methods=['PUT'])
@jwt_required()
def update_existing_complaint(id):
    data = request.json
    updated_complaint = crud.update_complaint(id, data)
    if updated_complaint:
        return jsonify({'message': 'Complaint updated successfully'}), 200
    return jsonify({'message': 'Complaint not found'}), 404

@main.route('/complaints/delete/<string:id>', methods=['DELETE'])
@jwt_required()
def delete_existing_complaint(id):
    if crud.delete_complaint(id):
        return jsonify({'message': 'Complaint deleted successfully'}), 200
    return jsonify({'message': 'Complaint not found'}), 404

@main.route('/inventory/list', methods=['GET'])
@jwt_required()
def get_inventory():
    claims = get_jwt()
    company_id = claims['company_id']
    inventory = crud.get_all_inventory_items(company_id)
    return jsonify(inventory), 200

@main.route('/inventory/add', methods=['POST'])
@jwt_required()
def add_inventory_item():
    claims = get_jwt()
    company_id = claims['company_id']
    data = request.json
    try:
        new_item = crud.add_inventory_item(data, company_id)
        return jsonify({'message': 'Inventory item added successfully', 'id': str(new_item.id)}), 201
    except Exception as e:
        return jsonify({'error': 'Failed to add inventory item', 'message': str(e)}), 400

@main.route('/inventory/update/<string:id>', methods=['PUT'])
@jwt_required()
def update_inventory_item(id):
    claims = get_jwt()
    company_id = claims['company_id']
    data = request.json
    updated_item = crud.update_inventory_item(id, data, company_id)
    if updated_item:
        return jsonify({'message': 'Inventory item updated successfully'}), 200
    return jsonify({'message': 'Inventory item not found'}), 404

@main.route('/inventory/delete/<string:id>', methods=['DELETE'])
@jwt_required()
def delete_inventory_item(id):
    claims = get_jwt()
    company_id = claims['company_id']
    if crud.delete_inventory_item(id, company_id):
        return jsonify({'message': 'Inventory item deleted successfully'}), 200
    return jsonify({'message': 'Inventory item not found'}), 404
@main.route('/suppliers/list', methods=['GET'])
@jwt_required()
def get_suppliers():
    claims = get_jwt()
    company_id = claims['company_id']
    suppliers = crud.get_all_suppliers(company_id)
    return jsonify(suppliers), 200

@main.route('/suppliers/add', methods=['POST'])
@jwt_required()
def add_new_supplier():
    claims = get_jwt()
    company_id = claims['company_id']
    data = request.json
    data['company_id'] = company_id
    try:
        new_supplier = crud.add_supplier(data)
        return jsonify({'message': 'Supplier added successfully', 'id': str(new_supplier.id)}), 201
    except Exception as e:
        return jsonify({'error': 'Failed to add supplier', 'message': str(e)}), 400

@main.route('/suppliers/update/<string:id>', methods=['PUT'])
@jwt_required()
def update_existing_supplier(id):
    claims = get_jwt()
    company_id = claims['company_id']
    data = request.json
    updated_supplier = crud.update_supplier(id, data, company_id)
    if updated_supplier:
        return jsonify({'message': 'Supplier updated successfully'}), 200
    return jsonify({'message': 'Supplier not found'}), 404

@main.route('/suppliers/delete/<string:id>', methods=['DELETE'])
@jwt_required()
def delete_existing_supplier(id):
    claims = get_jwt()
    company_id = claims['company_id']
    if crud.delete_supplier(id, company_id):
        return jsonify({'message': 'Supplier deleted successfully'}), 200
    return jsonify({'message': 'Supplier not found'}), 404

@main.route('/areas/list', methods=['GET'])
@jwt_required()
def get_areas():
    claims = get_jwt()
    company_id = claims['company_id']
    areas = crud.get_all_areas(company_id)
    return jsonify(areas), 200

@main.route('/areas/add', methods=['POST'])
@jwt_required()
def add_new_area():
    claims = get_jwt()
    company_id = claims['company_id']
    data = request.json
    data['company_id'] = company_id
    try:
        new_area = crud.add_area(data)
        return jsonify({'message': 'Area/Zone added successfully', 'id': str(new_area.id)}), 201
    except Exception as e:
        return jsonify({'error': 'Failed to add Area/Zone', 'message': str(e)}), 400

@main.route('/areas/update/<string:id>', methods=['PUT'])
@jwt_required()
def update_existing_area(id):
    claims = get_jwt()
    company_id = claims['company_id']
    data = request.json
    updated_area = crud.update_area(id, data, company_id)
    if updated_area:
        return jsonify({'message': 'Area/Zone updated successfully'}), 200
    return jsonify({'message': 'Area/Zone not found'}), 404

@main.route('/areas/delete/<string:id>', methods=['DELETE'])
@jwt_required()
def delete_existing_area(id):
    claims = get_jwt()
    company_id = claims['company_id']
    if crud.delete_area(id, company_id):
        return jsonify({'message': 'Area/Zone deleted successfully'}), 200
    return jsonify({'message': 'Area/Zone not found'}), 404

@main.route('/recovery-tasks/list', methods=['GET'])
@jwt_required()
def get_recovery_tasks():
    claims = get_jwt()
    company_id = claims['company_id']
    recovery_tasks = crud.get_all_recovery_tasks(company_id)
    return jsonify(recovery_tasks), 200

@main.route('/recovery-tasks/add', methods=['POST'])
@jwt_required()
def add_new_recovery_task():
    claims = get_jwt()
    company_id = claims['company_id']
    data = request.json
    data['company_id'] = company_id
    try:
        new_task = crud.add_recovery_task(data)
        return jsonify({'message': 'Recovery task added successfully', 'id': str(new_task.id)}), 201
    except Exception as e:
        return jsonify({'error': 'Failed to add recovery task', 'message': str(e)}), 400

@main.route('/recovery-tasks/update/<string:id>', methods=['PUT'])
@jwt_required()
def update_existing_recovery_task(id):
    claims = get_jwt()
    company_id = claims['company_id']
    data = request.json
    updated_task = crud.update_recovery_task(id, data, company_id)
    if updated_task:
        return jsonify({'message': 'Recovery task updated successfully'}), 200
    return jsonify({'message': 'Recovery task not found'}), 404

@main.route('/recovery-tasks/delete/<string:id>', methods=['DELETE'])
@jwt_required()
def delete_existing_recovery_task(id):
    claims = get_jwt()
    company_id = claims['company_id']
    if crud.delete_recovery_task(id, company_id):
        return jsonify({'message': 'Recovery task deleted successfully'}), 200
    return jsonify({'message': 'Recovery task not found'}), 404

@main.route('/tasks/list', methods=['GET'])
@jwt_required()
def get_tasks():
    claims = get_jwt()
    company_id = claims['company_id']
    tasks = crud.get_all_tasks(company_id)
    return jsonify(tasks), 200

@main.route('/tasks/add', methods=['POST'])
@jwt_required()
def add_new_task():
    claims = get_jwt()
    company_id = claims['company_id']
    data = request.json
    data['company_id'] = company_id
    try:
        new_task = crud.add_task(data)
        return jsonify({'message': 'Task added successfully', 'id': str(new_task.id)}), 201
    except Exception as e:
        return jsonify({'error': 'Failed to add task', 'message': str(e)}), 400

@main.route('/tasks/update/<string:id>', methods=['PUT'])
@jwt_required()
def update_existing_task(id):
    claims = get_jwt()
    company_id = claims['company_id']
    data = request.json
    updated_task = crud.update_task(id, data, company_id)
    if updated_task:
        return jsonify({'message': 'Task updated successfully'}), 200
    return jsonify({'message': 'Task not found'}), 404

@main.route('/tasks/delete/<string:id>', methods=['DELETE'])
@jwt_required()
def delete_existing_task(id):
    claims = get_jwt()
    company_id = claims['company_id']
    if crud.delete_task(id, company_id):
        return jsonify({'message': 'Task deleted successfully'}), 200
    return jsonify({'message': 'Task not found'}), 404

@main.route('/invoices/list', methods=['GET'])
@jwt_required()
def get_invoices():
    claims = get_jwt()
    company_id = claims['company_id']
    invoices = crud.get_all_invoices(company_id)
    return jsonify(invoices), 200

@main.route('/invoices/add', methods=['POST'])
@jwt_required()
def add_new_invoice():
    claims = get_jwt()
    company_id = claims['company_id']
    current_user_id = get_jwt_identity()
    data = request.json
    data['company_id'] = company_id
    try:
        new_invoice = crud.add_invoice(data, current_user_id)
        return jsonify({'message': 'Invoice added successfully', 'id': str(new_invoice.id)}), 201
    except Exception as e:
        return jsonify({'error': 'Failed to add invoice', 'message': str(e)}), 400

@main.route('/invoices/update/<string:id>', methods=['PUT'])
@jwt_required()
def update_existing_invoice(id):
    claims = get_jwt()
    company_id = claims['company_id']
    data = request.json
    updated_invoice = crud.update_invoice(id, data, company_id)
    if updated_invoice:
        return jsonify({'message': 'Invoice updated successfully'}), 200
    return jsonify({'message': 'Invoice not found'}), 404

@main.route('/invoices/delete/<string:id>', methods=['DELETE'])
@jwt_required()
def delete_existing_invoice(id):
    claims = get_jwt()
    company_id = claims['company_id']
    if crud.delete_invoice(id, company_id):
        return jsonify({'message': 'Invoice deleted successfully'}), 200
    return jsonify({'message': 'Invoice not found'}), 404

@main.route('/payments/list', methods=['GET'])
@jwt_required()
def get_payments():
    claims = get_jwt()
    company_id = claims['company_id']
    payments = crud.get_all_payments(company_id)
    return jsonify(payments), 200

@main.route('/payments/add', methods=['POST'])
@jwt_required()
def add_new_payment():
    claims = get_jwt()
    company_id = claims['company_id']
    data = request.json
    data['company_id'] = company_id
    
    if 'payment_proof' in request.files:
        file = request.files['payment_proof']
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            file_path = os.path.join(main.config['UPLOAD_FOLDER'], filename)
            file.save(file_path)
            data['payment_proof'] = file_path
    
    try:
        print('data', data)
        new_payment = crud.add_payment(data)
        return jsonify({'message': 'Payment added successfully', 'id': str(new_payment.id)}), 201
    except Exception as e:
        return jsonify({'error': 'Failed to add payment', 'message': str(e)}), 400

@main.route('/payments/update/<string:id>', methods=['PUT'])
@jwt_required()
def update_existing_payment(id):
    claims = get_jwt()
    company_id = claims['company_id']
    data = request.json
    
    if 'payment_proof' in request.files:
        file = request.files['payment_proof']
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            file_path = os.path.join(main.config['UPLOAD_FOLDER'], filename)
            file.save(file_path)
            data['payment_proof'] = file_path
    
    updated_payment = crud.update_payment(id, data, company_id)
    if updated_payment:
        return jsonify({'message': 'Payment updated successfully'}), 200
    return jsonify({'message': 'Payment not found'}), 404

@main.route('/payments/delete/<string:id>', methods=['DELETE'])
@jwt_required()
def delete_existing_payment(id):
    claims = get_jwt()
    company_id = claims['company_id']
    if crud.delete_payment(id, company_id):
        return jsonify({'message': 'Payment deleted successfully'}), 200
    return jsonify({'message': 'Payment not found'}), 404

def allowed_file(filename):
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'pdf'}
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@main.route('/invoices/<string:id>', methods=['GET'])
@jwt_required()
def get_invoice(id):
    claims = get_jwt()
    company_id = claims['company_id']
    invoice = crud.get_invoice_by_id(id, company_id)
    if invoice:
        customer = Customer.query.get(invoice.customer_id)
        return jsonify({
            'id': str(invoice.id),
            'invoice_number': invoice.invoice_number,
            'customer_name': f"{customer.first_name} {customer.last_name}",
            'customer_address': customer.installation_address,
            'billing_start_date': invoice.billing_start_date.isoformat(),
            'billing_end_date': invoice.billing_end_date.isoformat(),
            'due_date': invoice.due_date.isoformat(),
            'subtotal': float(invoice.subtotal),
            'discount_percentage': float(invoice.discount_percentage),
            'total_amount': float(invoice.total_amount),
            'invoice_type': invoice.invoice_type,
            'notes': invoice.notes,
            'status': invoice.status
        }), 200
    return jsonify({'message': 'Invoice not found'}), 404

@main.route('/customers/<string:id>', methods=['GET'])
@jwt_required()
def get_customer(id):
    claims = get_jwt()
    company_id = claims['company_id']
    customer = crud.get_customer_by_id(id, company_id)
    if customer:
        return jsonify(customer), 200
    return jsonify({'message': 'Customer not found'}), 404

@main.route('/invoices/customer/<string:id>', methods=['GET'])
@jwt_required()
def get_customer_invoices_route(id):
    claims = get_jwt()
    company_id = claims['company_id']
    invoices = crud.get_customer_invoices(id, company_id)
    return jsonify(invoices), 200

@main.route('/payments/customer/<string:id>', methods=['GET'])
@jwt_required()
def get_customer_payments_route(id):
    claims = get_jwt()
    company_id = claims['company_id']
    payments = crud.get_customer_payments(id, company_id)
    return jsonify(payments), 200

@main.route('/complaints/customer/<string:id>', methods=['GET'])
@jwt_required()
def get_customer_complaints_route(id):
    claims = get_jwt()
    company_id = claims['company_id']
    complaints = crud.get_customer_complaints(id, company_id)
    return jsonify(complaints), 200

@main.route('/messages/list', methods=['GET'])
@jwt_required()
def get_messages():
    claims = get_jwt()
    company_id = claims['company_id']
    messages = crud.get_all_messages(company_id)
    return jsonify(messages), 200

@main.route('/messages/add', methods=['POST'])
@jwt_required()
def add_new_message():
    claims = get_jwt()
    company_id = claims['company_id']
    current_user_id = get_jwt_identity()
    data = request.json
    data['company_id'] = company_id
    data['sender_id'] = current_user_id
    try:
        new_message = crud.add_message(data)
        return jsonify({'message': 'Message sent successfully', 'id': str(new_message.id)}), 201
    except Exception as e:
        return jsonify({'error': 'Failed to send message', 'message': str(e)}), 400

@main.route('/messages/update/<string:id>', methods=['PUT'])
@jwt_required()
def update_existing_message(id):
    claims = get_jwt()
    company_id = claims['company_id']
    data = request.json
    updated_message = crud.update_message(id, data, company_id)
    if updated_message:
        return jsonify({'message': 'Message updated successfully'}), 200
    return jsonify({'message': 'Message not found'}), 404

@main.route('/messages/delete/<string:id>', methods=['DELETE'])
@jwt_required()
def delete_existing_message(id):
    claims = get_jwt()
    company_id = claims['company_id']
    if crud.delete_message(id, company_id):
        return jsonify({'message': 'Message deleted successfully'}), 200
    return jsonify({'message': 'Message not found'}), 404

@main.route('/api/dashboard/executive-summary', methods=['GET'])
@jwt_required()
def get_executive_summary():
    claims = get_jwt()
    company_id = claims['company_id']

    # Get the executive summary data
    summary_data = crud.get_executive_summary_data(company_id)
    return jsonify(summary_data), 200

@main.route('/api/dashboard/customer-analytics', methods=['GET'])
@jwt_required()
def get_customer_analytics():
    claims = get_jwt()
    company_id = claims['company_id']

    # Get the customer analytics data
    analytics_data = crud.get_customer_analytics_data(company_id)
    return jsonify(analytics_data), 200

@main.route('/api/dashboard/financial-analytics', methods=['GET'])
@jwt_required()
def get_financial_analytics():
    claims = get_jwt()
    company_id = claims['company_id']

    # Get the financial analytics data
    analytics_data = crud.get_financial_analytics_data(company_id)
    return jsonify(analytics_data), 200


@main.route('/api/dashboard/service-support', methods=['GET'])
@jwt_required()
def get_service_support_data():
    return jsonify({
        'complaint_status': crud.get_complaint_status_data(),
        'complaint_categories': crud.get_complaint_categories_data(),
        'metrics': crud.get_service_support_metrics()
    })

@main.route('/api/dashboard/inventory-management', methods=['GET'])
@jwt_required()
def get_inventory_management_data():
    claims = get_jwt()
    company_id = claims['company_id']
    return jsonify({
        'stock_level_data': crud.get_stock_level_data(company_id),
        'inventory_movement_data': crud.get_inventory_movement_data(company_id),
        'inventory_metrics': crud.get_inventory_metrics(company_id)
    })

@main.route('/api/dashboard/employee-analytics', methods=['GET'])
@jwt_required()
def get_employee_analytics():
    claims = get_jwt()
    company_id = claims['company_id']

    # Get the employee analytics data
    analytics_data = crud.get_employee_analytics_data(company_id)

    return jsonify(analytics_data)

@main.route('/api/dashboard/area-analytics', methods=['GET'])
@jwt_required()
def get_area_analytics():
    claims = get_jwt()
    company_id = claims['company_id']

    # Get the area analytics data
    analytics_data = crud.get_area_analytics_data(company_id)
    return jsonify(analytics_data), 200

@main.route('/api/dashboard/service-plan-analytics', methods=['GET'])
@jwt_required()
def get_service_plan_analytics():
    claims = get_jwt()
    company_id = claims['company_id']

    # Get the service plan analytics data
    analytics_data = crud.get_service_plan_analytics_data(company_id)
    return jsonify(analytics_data), 200

@main.route('/api/dashboard/recovery-collections', methods=['GET'])
@jwt_required()
def get_recovery_collections_data():
    claims = get_jwt()
    company_id = claims['company_id']

    # Get the recovery and collections data
    recovery_data = crud.get_recovery_collections_data(company_id)
    return jsonify(recovery_data), 200

