from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.crud import dashboard_crud
from app.models import User
from . import main
dashboard = Blueprint('dashboard', __name__)

@main.route('/api/dashboard/executive-summary', methods=['GET'])
@jwt_required()
def get_executive_summary():
    current_user = get_jwt_identity()
    user = User.query.get(current_user)
    company_id = user.company_id
    data = dashboard_crud.get_executive_summary_data(company_id)
    return jsonify(data)

@main.route('/api/dashboard/customer-analytics', methods=['GET'])
@jwt_required()
def get_customer_analytics():
    current_user = get_jwt_identity()
    user = User.query.get(current_user)
    company_id = user.company_id
    data = dashboard_crud.get_customer_analytics_data(company_id)
    return jsonify(data)

@main.route('/api/dashboard/financial-analytics', methods=['GET'])
@jwt_required()
def get_financial_analytics():
    current_user = get_jwt_identity()
    user = User.query.get(current_user)
    company_id = user.company_id
    data = dashboard_crud.get_financial_analytics_data(company_id)
    return jsonify(data)

@main.route('/api/dashboard/service-support', methods=['GET'])
@jwt_required()
def get_service_support_metrics():
    current_user = get_jwt_identity()
    user = User.query.get(current_user)
    company_id = user.company_id
    data = dashboard_crud.get_service_support_metrics(company_id)
    return jsonify(data)

@main.route('/api/dashboard/inventory-management', methods=['GET'])
@jwt_required()
def get_inventory_management_data():
    current_user = get_jwt_identity()
    user = User.query.get(current_user)
    company_id = user.company_id
    data = dashboard_crud.get_inventory_management_data(company_id)
    return jsonify(data)

@main.route('/api/dashboard/employee-analytics', methods=['GET'])
@jwt_required()
def get_employee_analytics():
    current_user = get_jwt_identity()
    user = User.query.get(current_user)
    company_id = user.company_id
    data = dashboard_crud.get_employee_analytics_data(company_id)
    return jsonify(data)

@main.route('/api/dashboard/area-analytics', methods=['GET'])
@jwt_required()
def get_area_analytics():
    current_user = get_jwt_identity()
    user = User.query.get(current_user)
    company_id = user.company_id
    data = dashboard_crud.get_area_analytics_data(company_id)
    return jsonify(data)

@main.route('/api/dashboard/service-plan-analytics', methods=['GET'])
@jwt_required()
def get_service_plan_analytics():
    current_user = get_jwt_identity()
    user = User.query.get(current_user)
    company_id = user.company_id
    data = dashboard_crud.get_service_plan_analytics_data(company_id)
    return jsonify(data)

@main.route('/api/dashboard/recovery-collections', methods=['GET'])
@jwt_required()
def get_recovery_collections():
    current_user = get_jwt_identity()
    user = User.query.get(current_user)
    company_id = user.company_id
    data = dashboard_crud.get_recovery_collections_data(company_id)
    return jsonify(data)

