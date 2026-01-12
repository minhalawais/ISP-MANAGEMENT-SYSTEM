from flask import Blueprint, jsonify,request
from flask_jwt_extended import jwt_required, get_jwt_identity,get_jwt
from app.crud import dashboard_crud
from app.crud import executive_dashboard_crud
from app.crud import customer_dashboard_crud
from app.crud import service_support_crud
from app.crud import inventory_dashboard_crud
from app.crud import employee_dashboard_crud
from app.crud import area_analytics_crud
from app.crud import service_plan_crud
from app.models import User
from . import main
import logging
dashboard = Blueprint('dashboard', __name__)

logger = logging.getLogger(__name__)



@main.route('/dashboard/executive-summary', methods=['GET'])
@jwt_required()
def get_executive_summary():
    current_user = get_jwt_identity()
    claims = get_jwt()
    company_id = claims['company_id']
    
    data = dashboard_crud.get_executive_summary_data(company_id)
    return jsonify(data)


@main.route('/dashboard/executive-advanced', methods=['GET'])
@jwt_required()
def get_executive_advanced():
    """
    Advanced Executive Dashboard with all KPIs, charts, and filters.
    
    Query Parameters:
        - start_date, end_date: Date range (YYYY-MM-DD)
        - area_id, isp_id, service_plan_id: Dimension filters
        - payment_method: Filter by payment method
        - compare: Comparison period (last_month, last_quarter, last_year)
    """
    claims = get_jwt()
    company_id = claims['company_id']
    
    filters = {
        'start_date': request.args.get('start_date'),
        'end_date': request.args.get('end_date'),
        'area_id': request.args.get('area_id', 'all'),
        'isp_id': request.args.get('isp_id', 'all'),
        'service_plan_id': request.args.get('service_plan_id', 'all'),
        'payment_method': request.args.get('payment_method', 'all'),
        'compare': request.args.get('compare', 'last_month')
    }
    
    try:
        data = executive_dashboard_crud.get_executive_dashboard_advanced(company_id, filters)
        return jsonify(data), 200
    except Exception as e:
        logger.error(f"Error in executive-advanced: {str(e)}")
        return jsonify({'error': 'Failed to fetch executive dashboard data'}), 500



@main.route('/dashboard/customer-analytics', methods=['GET'])
@jwt_required()
def get_customer_analytics():
    current_user = get_jwt_identity()
    claims = get_jwt()
    company_id = claims['company_id']
    
    data = dashboard_crud.get_customer_analytics_data(company_id)
    return jsonify(data)


@main.route('/dashboard/customer-advanced', methods=['GET'])
@jwt_required()
def get_customer_advanced():
    """
    Advanced Customer Dashboard with all KPIs, charts, and filters.
    
    Query Parameters:
        - start_date, end_date: Date range (YYYY-MM-DD)
        - area_id, sub_zone_id, isp_id, service_plan_id: Dimension filters
        - connection_type: Filter by connection type
        - status: Filter by customer status (active, inactive, all)
        - compare: Comparison period (last_month, last_quarter, last_year)
    """
    claims = get_jwt()
    company_id = claims['company_id']
    
    filters = {
        'start_date': request.args.get('start_date'),
        'end_date': request.args.get('end_date'),
        'area_id': request.args.get('area_id', 'all'),
        'sub_zone_id': request.args.get('sub_zone_id', 'all'),
        'isp_id': request.args.get('isp_id', 'all'),
        'service_plan_id': request.args.get('service_plan_id', 'all'),
        'connection_type': request.args.get('connection_type', 'all'),
        'status': request.args.get('status', 'all'),
        'compare': request.args.get('compare', 'last_month')
    }
    
    try:
        data = customer_dashboard_crud.get_customer_dashboard_advanced(company_id, filters)
        return jsonify(data), 200
    except Exception as e:
        logger.error(f"Error in customer-advanced: {str(e)}")
        return jsonify({'error': 'Failed to fetch customer dashboard data'}), 500



@main.route('/dashboard/financial-analytics', methods=['GET'])
@jwt_required()
def get_financial_analytics():
    current_user = get_jwt_identity()
    claims = get_jwt()
    company_id = claims['company_id']
    
    data = dashboard_crud.get_financial_analytics_data(company_id)
    return jsonify(data)

@main.route('/dashboard/service-support', methods=['GET'])
@jwt_required()
def get_service_support_metrics():
    current_user = get_jwt_identity()
    claims = get_jwt()
    company_id = claims['company_id']
    
    data = dashboard_crud.get_service_support_metrics(company_id)
    return jsonify(data)


@main.route('/dashboard/service-support-advanced', methods=['GET'])
@jwt_required()
def get_service_support_advanced():
    """
    Advanced Service Support Dashboard with all KPIs, charts, and filters.
    
    Query Parameters:
        - start_date, end_date: Date range (YYYY-MM-DD)
        - status: Complaint status filter
        - priority: Priority filter
        - area_id, technician_id: Dimension filters
        - compare: Comparison period (last_month, last_year)
    """
    claims = get_jwt()
    company_id = claims['company_id']
    
    filters = {
        'start_date': request.args.get('start_date'),
        'end_date': request.args.get('end_date'),
        'status': request.args.get('status', 'all'),
        'priority': request.args.get('priority', 'all'),
        'area_id': request.args.get('area_id', 'all'),
        'technician_id': request.args.get('technician_id', 'all'),
        'compare': request.args.get('compare', 'last_month')
    }
    
    try:
        data = service_support_crud.get_service_support_advanced(company_id, filters)
        return jsonify(data), 200
    except Exception as e:
        logger.error(f"Error in service-support-advanced: {str(e)}")
        return jsonify({'error': 'Failed to fetch service support dashboard data'}), 500


@main.route('/dashboard/inventory-management', methods=['GET'])
@jwt_required()
def get_inventory_management_data():
    current_user = get_jwt_identity()
    claims = get_jwt()
    company_id = claims['company_id']
    
    stock_level_data = dashboard_crud.get_stock_level_data(company_id)
    inventory_movement_data = dashboard_crud.get_inventory_movement_data(company_id)
    inventory_metrics = dashboard_crud.get_inventory_metrics(company_id)
    
    data = {
        'stock_level_data': stock_level_data,
        'inventory_movement_data': inventory_movement_data,
        'inventory_metrics': inventory_metrics
    }
    return jsonify(data)

@main.route('/dashboard/employee-analytics', methods=['GET'])
@jwt_required()
def get_employee_analytics():
    current_user = get_jwt_identity()
    claims = get_jwt()
    company_id = claims['company_id']
    
    data = dashboard_crud.get_employee_analytics_data(company_id)
    return jsonify(data)

@main.route('/dashboard/area-analytics', methods=['GET'])
@jwt_required()
def get_area_analytics():
    current_user = get_jwt_identity()
    claims = get_jwt()
    company_id = claims['company_id']
    
    data = dashboard_crud.get_area_analytics_data(company_id)
    return jsonify(data)

@main.route('/dashboard/service-plan-analytics', methods=['GET'])
@jwt_required()
def get_service_plan_analytics():
    current_user = get_jwt_identity()
    claims = get_jwt()
    company_id = claims['company_id']
    
    data = dashboard_crud.get_service_plan_analytics_data(company_id)
    return jsonify(data)

@main.route('/dashboard/recovery-collections', methods=['GET'])
@jwt_required()
def get_recovery_collections():
    current_user = get_jwt_identity()
    claims = get_jwt()
    company_id = claims['company_id']
    
    data = dashboard_crud.get_recovery_collections_data(company_id)
    return jsonify(data)


@main.route('/dashboard/bank-account-analytics', methods=['GET'])
@jwt_required()
def get_bank_account_analytics():
    current_user = get_jwt_identity()
    claims = get_jwt()
    company_id = claims['company_id']
    
    # Get filters from query parameters
    filters = {
        'start_date': request.args.get('start_date'),
        'end_date': request.args.get('end_date'),
        'bank_account_id': request.args.get('bank_account_id', 'all'),
        'payment_method': request.args.get('payment_method', 'all')
    }
    
    data = dashboard_crud.get_bank_account_analytics_data(company_id, filters)
    return jsonify(data)

@main.route('/dashboard/unified-financial', methods=['GET'])
@jwt_required()
def get_unified_financial_data():
    claims = get_jwt()
    company_id = claims['company_id']
    
    # Get filters from query parameters
    filters = {
        'start_date': request.args.get('start_date'),
        'end_date': request.args.get('end_date'),
        'bank_account_id': request.args.get('bank_account_id', 'all'),
        'payment_method': request.args.get('payment_method', 'all'),
        'invoice_status': request.args.get('invoice_status', 'all'),
        'isp_payment_type': request.args.get('isp_payment_type', 'all')
    }
    
    try:
        data = dashboard_crud.get_unified_financial_data(company_id, filters)
        return jsonify(data), 200
    except Exception as e:
        logger.error(f"Error fetching unified financial data: {str(e)}")
        return jsonify({'error': 'Failed to fetch unified financial data'}), 500

@main.route('/dashboard/ledger', methods=['GET'])
@jwt_required()
def get_ledger():
    claims = get_jwt()
    company_id = claims['company_id']
    filters = {
        'start_date': request.args.get('start_date'),
        'end_date': request.args.get('end_date'),
        'bank_account_id': request.args.get('bank_account_id', 'all'),
        'payment_method': request.args.get('payment_method', 'all'),
        'invoice_status': request.args.get('invoice_status', 'all'),
        'isp_payment_type': request.args.get('isp_payment_type', 'all'),
    }
    data = dashboard_crud.get_ledger_data(company_id, filters)
    return jsonify(data), 200


@main.route('/dashboard/inventory-advanced', methods=['GET'])
@jwt_required()
def get_inventory_advanced():
    """
    Advanced Inventory Dashboard with all KPIs, charts, and filters.
    
    Query Parameters:
        - start_date, end_date: Date range (YYYY-MM-DD)
        - item_type, supplier_id: Dimension filters
        - status: Stock status filter
        - compare: Comparison period (last_month, last_year)
    """
    claims = get_jwt()
    company_id = claims['company_id']
    
    filters = {
        'start_date': request.args.get('start_date'),
        'end_date': request.args.get('end_date'),
        'item_type': request.args.get('item_type', 'all'),
        'supplier_id': request.args.get('supplier_id', 'all'),
        'status': request.args.get('status', 'all'),
        'compare': request.args.get('compare', 'last_month')
    }
    
    try:
        data = inventory_dashboard_crud.get_inventory_advanced(company_id, filters)
        return jsonify(data), 200
    except Exception as e:
        logger.error(f"Error in inventory-advanced: {str(e)}")
        return jsonify({'error': 'Failed to fetch inventory dashboard data'}), 500


@main.route('/dashboard/employee-advanced', methods=['GET'])
@jwt_required()
def get_employee_advanced():
    """
    Advanced Employee Dashboard with all KPIs, charts, and filters.
    
    Query Parameters:
        - start_date, end_date: Date range (YYYY-MM-DD)
        - role: Employee role filter
        - status: Active/Inactive filter
        - compare: Comparison period (last_month, last_year)
    """
    claims = get_jwt()
    company_id = claims['company_id']
    
    filters = {
        'start_date': request.args.get('start_date'),
        'end_date': request.args.get('end_date'),
        'role': request.args.get('role', 'all'),
        'status': request.args.get('status', 'all'),
        'compare': request.args.get('compare', 'last_month')
    }
    
    try:
        data = employee_dashboard_crud.get_employee_advanced(company_id, filters)
        return jsonify(data), 200
    except Exception as e:
        logger.error(f"Error in employee-advanced: {str(e)}")
        return jsonify({'error': 'Failed to fetch employee dashboard data'}), 500


@main.route('/dashboard/regional-advanced', methods=['GET'])
@jwt_required()
def get_regional_advanced():
    """
    Advanced Regional Dashboard with all KPIs, charts, and filters.
    """
    claims = get_jwt()
    company_id = claims['company_id']
    
    filters = {
        'start_date': request.args.get('start_date'),
        'end_date': request.args.get('end_date'),
        'area_ids': request.args.get('area_ids', 'all'),
        'plan_id': request.args.get('plan_id', 'all'),
        'compare': request.args.get('compare', 'last_month')
    }
    
    try:
        data = area_analytics_crud.get_area_advanced(company_id, filters)
        return jsonify(data), 200
    except Exception as e:
        logger.error(f"Error in regional-advanced: {str(e)}")
        return jsonify({'error': 'Failed to fetch regional dashboard data'}), 500


@main.route('/dashboard/service-plan-advanced', methods=['GET'])
@jwt_required()
def get_service_plan_advanced():
    """
    Advanced Service Plan Dashboard with all KPIs, charts, and filters.
    """
    claims = get_jwt()
    company_id = claims['company_id']
    
    filters = {
        'start_date': request.args.get('start_date'),
        'end_date': request.args.get('end_date'),
        'plan_ids': request.args.get('plan_ids', 'all'),
        'status': request.args.get('status', 'all'),
        'compare': request.args.get('compare', 'last_month')
    }
    
    try:
        data = service_plan_crud.get_service_plan_advanced(company_id, filters)
        return jsonify(data), 200
    except Exception as e:
        logger.error(f"Error in service-plan-advanced: {str(e)}")
        return jsonify({'error': 'Failed to fetch service plan dashboard data'}), 500
