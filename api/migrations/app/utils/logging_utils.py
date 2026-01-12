from app import db
from app.models import DetailedLog
import uuid

def log_action(user_id, action, table_name, record_id, old_values, new_values, ip_address, user_agent, company_id):
    log = DetailedLog(
        user_id=user_id,
        action=action,
        table_name=table_name,
        record_id=record_id,
        old_values=old_values,
        new_values=new_values,
        ip_address=ip_address,
        user_agent=user_agent,
        company_id=company_id
    )
    db.session.add(log)
    db.session.commit()

