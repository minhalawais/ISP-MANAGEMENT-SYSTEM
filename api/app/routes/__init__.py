from flask import Blueprint

main = Blueprint('main', __name__)

from . import employee_routes
from . import customer_routes
from . import service_plan_routes
from . import invoice_routes
from . import complaint_routes
from . import inventory_routes
from . import supplier_routes
from . import area_routes
from . import recovery_routes
from . import task_routes
from . import payment_routes
from . import message_routes
from . import dashboard_routes
from . import user_routes
from . import log_routes
from . import isp_routes

from .employee_portal import *