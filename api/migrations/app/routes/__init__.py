from flask import Blueprint

main = Blueprint('main', __name__)

# Existing imports (these will be replaced by specific blueprint imports and registrations)
# from . import employee_routes
# from . import customer_routes
# from . import service_plan_routes
# from . import invoice_routes
# from . import complaint_routes
# from . import inventory_routes
# from . import supplier_routes
# from . import area_routes
# from . import recovery_routes
# from . import task_routes
# from . import payment_routes
# from . import message_routes
# from . import dashboard_routes
# from . import user_routes
# from . import log_routes
# from . import isp_routes
# from . import bank_account_routes
# from .employee_portal import * # This import style is different and might need separate handling
# from . import isp_payment_routes
# from . import expense_routes
# from . import extra_income_routes

# New and updated blueprint imports
from . import user_routes
from . import customer_routes
from . import area_routes
from . import service_plan_routes
from . import invoice_routes
from . import payment_routes
from . import complaint_routes
from . import task_routes
from . import message_routes
from . import log_routes
from . import supplier_routes
from . import inventory_routes
from . import recovery_routes
from . import dashboard_routes # Assuming dashboard_routes provides dashboard_bp
from . import isp_routes
from . import isp_payment_routes
from . import employee_routes # Assuming employee_routes provides employee_bp
from . import bank_account_routes
from . import expense_routes
from . import extra_income_routes
from . import sub_zone_routes  # Sub-zone management routes
from . import vendor_routes  # Vendor management routes
from . import employee_profile_routes  # Employee profile routes
from . import internal_transfer_routes
from . import employee_portal_routes  # Employee self-service portal
from .whatsapp_routes import whatsapp_bp  # New WhatsApp blueprint import

# Assuming 'monitoring_bp' is from a 'monitoring_routes' module, adding it here

# Re-adding the specific import from employee_portal if it's still needed
from .employee_portal import *

main.register_blueprint(whatsapp_bp)