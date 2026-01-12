"""
Simple initialization script to create WhatsApp default configuration.
Run this after migrating the database to set up initial API credentials.
"""

from app import create_app, db
from app.whatsapp_models import WhatsAppConfig

# User's API credentials (provided)
DEFAULT_API_KEY = '923234689090-72755279-84da-4dec-9d36-406c3cbd9895'
DEFAULT_SERVER_ADDRESS = 'https://myapi.pk/'

def init_whatsapp_config():
    """Initialize WhatsApp configuration with default values"""
    app = create_app()
    
    with app.app_context():
        # Get all companies
        from app.models import Company
        companies = Company.query.all()
        
        print(f"Found {len(companies)} companies")
        
        for company in companies:
            # Check if config already exists
            existing_config = WhatsAppConfig.query.filter_by(company_id=company.id).first()
            
            if existing_config:
                print(f"Config already exists for company: {company.name}")
                continue
            
            # Create new configuration
            config = WhatsAppConfig(
                company_id=company.id,
                api_key=DEFAULT_API_KEY,
                server_address=DEFAULT_SERVER_ADDRESS,
                auto_send_invoices=True,
                auto_send_deadline_alerts=True,
                message_send_time='09:00',
                deadline_check_time='09:00',
                deadline_alert_days_before=2,
                daily_quota_limit=200,
                quota_buffer=5,
                default_invoice_priority=10,
                default_alert_priority=0,
                default_custom_priority=20
            )
            
            db.session.add(config)
            print(f"Created WhatsApp config for company: {company.name}")
        
        db.session.commit()
        print("✅ WhatsApp configuration initialization complete!")

if __name__ == '__main__':
    init_whatsapp_config()
