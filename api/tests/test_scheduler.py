import unittest
from datetime import datetime, timedelta
from app import create_app, db
from app.models import Customer, Invoice, ServicePlan, Company
from scheduler import _process_invoices
import uuid

class TestScheduler(unittest.TestCase):
    def setUp(self):
        self.app = create_app()
        self.app.config['TESTING'] = True
        self.app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        self.app_context = self.app.app_context()
        self.app_context.push()
        db.create_all()
        
        # Create test data
        self.create_test_data()
    
    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.app_context.pop()
    
    def create_test_data(self):
        # Create a company
        company = Company(
            id=uuid.uuid4(),
            name="Test Company",
            is_active=True
        )
        db.session.add(company)
        
        # Create a service plan
        service_plan = ServicePlan(
            id=uuid.uuid4(),
            company_id=company.id,
            name="Basic Plan",
            price=1000.00,
            is_active=True
        )
        db.session.add(service_plan)
        
        # Create customers with different recharge dates
        today = datetime.now().date()
        
        # Customer with recharge date today
        customer1 = Customer(
            id=uuid.uuid4(),
            company_id=company.id,
            area_id=uuid.uuid4(),
            service_plan_id=service_plan.id,
            isp_id=uuid.uuid4(),
            first_name="John",
            last_name="Doe",
            email="john@example.com",
            internet_id="INT001",
            phone_1="1234567890",
            installation_address="123 Main St",
            installation_date=today - timedelta(days=30),
            cnic="12345-6789012-3",
            connection_type="internet",
            recharge_date=today,
            is_active=True
        )
        
        # Customer with recharge date tomorrow
        customer2 = Customer(
            id=uuid.uuid4(),
            company_id=company.id,
            area_id=uuid.uuid4(),
            service_plan_id=service_plan.id,
            isp_id=uuid.uuid4(),
            first_name="Jane",
            last_name="Smith",
            email="jane@example.com",
            internet_id="INT002",
            phone_1="0987654321",
            installation_address="456 Oak St",
            installation_date=today - timedelta(days=15),
            cnic="98765-4321098-7",
            connection_type="internet",
            recharge_date=today + timedelta(days=1),
            is_active=True
        )
        
        # Customer with recharge date today but already has an invoice this month
        customer3 = Customer(
            id=uuid.uuid4(),
            company_id=company.id,
            area_id=uuid.uuid4(),
            service_plan_id=service_plan.id,
            isp_id=uuid.uuid4(),
            first_name="Bob",
            last_name="Johnson",
            email="bob@example.com",
            internet_id="INT003",
            phone_1="5555555555",
            installation_address="789 Pine St",
            installation_date=today - timedelta(days=45),
            cnic="55555-5555555-5",
            connection_type="internet",
            recharge_date=today,
            is_active=True
        )
        
        db.session.add_all([customer1, customer2, customer3])
        
        # Create an existing invoice for customer3
        current_month_start = datetime(today.year, today.month, 1).date()
        next_month_start = (datetime(today.year, today.month, 1) + timedelta(days=32)).replace(day=1).date()
        
        invoice = Invoice(
            id=uuid.uuid4(),
            company_id=company.id,
            invoice_number="INV-2023-0001",
            customer_id=customer3.id,
            billing_start_date=current_month_start,
            billing_end_date=next_month_start - timedelta(days=1),
            due_date=today + timedelta(days=7),
            subtotal=1000.00,
            discount_percentage=0,
            total_amount=1000.00,
            invoice_type="subscription",
            status="pending",
            is_active=True
        )
        
        db.session.add(invoice)
        db.session.commit()
        
        self.company = company
        self.service_plan = service_plan
        self.customer1 = customer1
        self.customer2 = customer2
        self.customer3 = customer3
    
    def test_process_invoices(self):
        # Count invoices before
        invoices_before = Invoice.query.count()
        
        # Run the scheduler function
        with self.app.app_context():
            _process_invoices()
        
        # Count invoices after
        invoices_after = Invoice.query.count()
        
        # We should have one new invoice (for customer1 only)
        self.assertEqual(invoices_after, invoices_before + 1)
        
        # Check that the invoice was created for customer1
        new_invoice = Invoice.query.filter_by(customer_id=self.customer1.id).first()
        self.assertIsNotNone(new_invoice)
        self.assertEqual(new_invoice.invoice_type, "subscription")
        self.assertEqual(float(new_invoice.total_amount), float(self.service_plan.price))
        
        # Check that no invoice was created for customer2 (different recharge date)
        customer2_invoice = Invoice.query.filter_by(
            customer_id=self.customer2.id,
            billing_start_date=datetime.now().date()
        ).first()
        self.assertIsNone(customer2_invoice)
        
        # Check that no additional invoice was created for customer3 (already has one this month)
        customer3_invoices = Invoice.query.filter_by(customer_id=self.customer3.id).count()
        self.assertEqual(customer3_invoices, 1)

if __name__ == '__main__':
    unittest.main()

