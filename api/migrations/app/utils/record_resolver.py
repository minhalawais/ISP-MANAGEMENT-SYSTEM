from app import db
from app.models import (
    User, Customer, Expense, ExtraIncome, Invoice, Payment, 
    Complaint, InventoryItem, Supplier, Vendor
)
from sqlalchemy.exc import SQLAlchemyError
import logging

logger = logging.getLogger(__name__)

def resolve_record_details(table_name, record_id, company_id):
    """
    Resolves a record ID to a dictionary of human-readable details based on the table name.
    """
    try:
        model = None
        details = {}
        
        # Map table names to models and define what fields to extract
        if table_name == 'users':
            model = User
            record = model.query.get(record_id)
            if record:
                details = {
                    'Name': f"{record.first_name} {record.last_name}",
                    'Username': record.username,
                    'Role': record.role,
                    'Email': record.email
                }
                
        elif table_name == 'customers':
            model = Customer
            record = model.query.get(record_id)
            if record:
                details = {
                    'Name': f"{record.first_name} {record.last_name}",
                    'Internet ID': record.internet_id,
                    'Phone': record.phone_1,
                    'CNIC': record.cnic,
                    'Address': record.address
                }
                
        elif table_name == 'expenses':
            model = Expense
            record = model.query.get(record_id)
            if record:
                details = {
                    'Amount': f"{record.amount}",
                    'Description': record.description,
                    'Date': record.expense_date.strftime('%Y-%m-%d') if record.expense_date else 'N/A',
                    'Payee': record.vendor_payee or 'N/A'
                }
                
        elif table_name == 'extra_incomes':
            model = ExtraIncome
            record = model.query.get(record_id)
            if record:
                details = {
                    'Amount': f"{record.amount}",
                    'Description': record.description,
                    'Payer': record.payer,
                    'Date': record.income_date.strftime('%Y-%m-%d') if record.income_date else 'N/A'
                }

        elif table_name == 'invoices':
            model = Invoice
            record = model.query.get(record_id)
            if record:
                details = {
                    'Invoice #': record.invoice_number,
                    'Amount': f"{record.total_amount}",
                    'Status': record.status,
                    'Due Date': record.due_date.strftime('%Y-%m-%d') if record.due_date else 'N/A'
                }
                
        elif table_name == 'payments':
            model = Payment
            record = model.query.get(record_id)
            if record:
                details = {
                    'Amount': f"{record.amount}",
                    'Payment Date': record.payment_date.strftime('%Y-%m-%d') if record.payment_date else 'N/A',
                    'Method': record.payment_method,
                    'Status': record.status
                }
                
        elif table_name == 'complaints':
            model = Complaint
            record = model.query.get(record_id)
            if record:
                details = {
                    'Ticket #': record.ticket_number,
                    'Status': record.status,
                    'Description': record.description,
                    'Created At': record.created_at.strftime('%Y-%m-%d %H:%M')
                }
                
        elif table_name == 'inventory_items':
            model = InventoryItem
            record = model.query.get(record_id)
            if record:
                details = {
                    'Name': record.name,
                    'SKU': record.sku,
                    'Mac Address': record.mac_address or 'N/A',
                    'Serial No': record.serial_number or 'N/A',
                    'Status': record.status
                }
                
        elif table_name == 'suppliers':
            model = Supplier
            record = model.query.get(record_id)
            if record:
                details = {
                    'Name': record.name,
                    'Contact Person': record.contact_person,
                    'Email': record.email,
                    'Phone': record.phone
                }
                
        elif table_name == 'vendors':
            model = Vendor
            record = model.query.get(record_id)
            if record:
                details = {
                    'Name': record.name,
                    'Contact Person': record.contact_person,
                    'Email': record.email,
                    'Phone': record.phone
                }
                
        if not details and model:
            # If model found but no record (maybe deleted), or generic handling
             return {'error': 'Record not found or specific details not mapped'}
        elif not model:
            return {'error': f'No resolver for table: {table_name}'}
            
        return details

    except Exception as e:
        logger.error(f"Error resolving record details: {e}")
        return {'error': str(e)}
