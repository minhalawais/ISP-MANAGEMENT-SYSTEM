"""
Initialize Default WhatsApp Invoice Template
Run this script to create default invoice templates for all companies with WhatsApp configured
"""

from app import create_app, db
from app.models import WhatsAppTemplate, WhatsAppConfig

DEFAULT_INVOICE_TEMPLATE = """
🧾 *Invoice Generated*

Hello {{customer_name}},

Your invoice *{{invoice_number}}* has been generated.

*Amount:* Rs. {{amount}}
*Due Date:* {{due_date}}
*Billing Period:* {{billing_start_date}} to {{billing_end_date}}

📄 View your invoice: {{invoice_link}}

Please make payment before the due date.

Thank you for your business!
""".strip()


def create_default_invoice_templates():
    app = create_app()
    with app.app_context():
        # Get all companies with WhatsApp configured
        configs = WhatsAppConfig.query.filter_by(configured=True).all()
        
        created_count = 0
        skipped_count = 0
        
        for config in configs:
            # Check if invoice template already exists
            existing = WhatsAppTemplate.query.filter_by(
                company_id=config.company_id,
                category='invoice'
            ).first()
            
            if existing:
                print(f"Template already exists for company {config.company_id}, skipping...")
                skipped_count += 1
                continue
            
            template = WhatsAppTemplate(
                company_id=config.company_id,
                name='Invoice Notification',
                description='Default template for automated invoice notifications',
                template_text=DEFAULT_INVOICE_TEMPLATE,
                category='invoice',
                message_type='invoice',
                default_priority=0,  # High priority
                is_active=True
            )
            db.session.add(template)
            created_count += 1
            print(f"✓ Created invoice template for company {config.company_id}")
        
        db.session.commit()
        print(f"\n{'='*50}")
        print(f"Default Invoice Templates Creation Summary:")
        print(f"{'='*50}")
        print(f"Created: {created_count}")
        print(f"Skipped (already exists): {skipped_count}")
        print(f"Total companies processed: {len(configs)}")
        print(f"{'='*50}\n")


if __name__ == '__main__':
    create_default_invoice_templates()
