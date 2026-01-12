"""
Employee Portal API Routes
Self-service endpoints for employees to access their own data.
All endpoints are scoped to the logged-in employee using get_jwt_identity().
"""

from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app.crud.employee_portal_crud import (
    get_employee_profile,
    update_employee_profile,
    get_employee_dashboard_stats,
    get_employee_performance_metrics,
    get_employee_tasks,
    update_task_status,
    get_employee_complaints,
    update_complaint_status,
    get_managed_customers,
    get_employee_financial,
    get_employee_inventory,
    get_employee_recoveries,
    update_recovery_status,
)
from . import main
import logging

logger = logging.getLogger(__name__)


# ============== Profile ==============

@main.route('/employee-portal/profile', methods=['GET'])
@jwt_required()
def get_my_profile():
    """Get logged-in employee's complete profile."""
    employee_id = get_jwt_identity()
    
    try:
        profile = get_employee_profile(employee_id)
        if not profile:
            return jsonify({'message': 'Profile not found'}), 404
        return jsonify(profile), 200
    except Exception as e:
        logger.error(f"Error fetching profile: {str(e)}")
        return jsonify({'message': 'Failed to fetch profile'}), 500


@main.route('/employee-portal/profile', methods=['PUT'])
@jwt_required()
def update_my_profile():
    """Update logged-in employee's editable profile fields."""
    employee_id = get_jwt_identity()
    data = request.get_json()
    
    try:
        profile = update_employee_profile(employee_id, data)
        return jsonify(profile), 200
    except ValueError as e:
        return jsonify({'message': str(e)}), 400
    except Exception as e:
        logger.error(f"Error updating profile: {str(e)}")
        return jsonify({'message': 'Failed to update profile'}), 500


# ============== Dashboard ==============

@main.route('/employee-portal/dashboard', methods=['GET'])
@jwt_required()
def get_my_dashboard():
    """Get dashboard statistics for logged-in employee."""
    employee_id = get_jwt_identity()
    claims = get_jwt()
    company_id = claims.get('company_id')
    
    try:
        stats = get_employee_dashboard_stats(employee_id, company_id)
        return jsonify(stats), 200
    except Exception as e:
        logger.error(f"Error fetching dashboard: {str(e)}")
        return jsonify({'message': 'Failed to fetch dashboard'}), 500


@main.route('/employee-portal/performance', methods=['GET'])
@jwt_required()
def get_my_performance():
    """Get performance metrics for logged-in employee."""
    employee_id = get_jwt_identity()
    
    try:
        metrics = get_employee_performance_metrics(employee_id)
        return jsonify(metrics), 200
    except Exception as e:
        logger.error(f"Error fetching performance: {str(e)}")
        return jsonify({'message': 'Failed to fetch performance metrics'}), 500


# ============== Tasks ==============

@main.route('/employee-portal/tasks', methods=['GET'])
@jwt_required()
def get_my_tasks():
    """Get tasks assigned to logged-in employee."""
    employee_id = get_jwt_identity()
    
    filters = {
        'status': request.args.get('status'),
        'priority': request.args.get('priority'),
        'task_type': request.args.get('task_type'),
    }
    filters = {k: v for k, v in filters.items() if v}
    
    try:
        tasks = get_employee_tasks(employee_id, filters)
        return jsonify(tasks), 200
    except Exception as e:
        logger.error(f"Error fetching tasks: {str(e)}")
        return jsonify({'message': 'Failed to fetch tasks'}), 500


@main.route('/employee-portal/tasks/<task_id>/status', methods=['PUT'])
@jwt_required()
def update_my_task_status(task_id):
    """Update status of a task assigned to logged-in employee."""
    employee_id = get_jwt_identity()
    data = request.get_json()
    
    new_status = data.get('status')
    notes = data.get('notes')
    completion_notes = data.get('completion_notes')
    completion_proof = data.get('completion_proof')
    
    if not new_status:
        return jsonify({'message': 'Status is required'}), 400
    
    try:
        result = update_task_status(task_id, employee_id, new_status, notes, completion_notes, completion_proof)
        return jsonify(result), 200
    except ValueError as e:
        return jsonify({'message': str(e)}), 400
    except Exception as e:
        logger.error(f"Error updating task: {str(e)}")
        return jsonify({'message': 'Failed to update task'}), 500


# ============== Complaints ==============

@main.route('/employee-portal/complaints', methods=['GET'])
@jwt_required()
def get_my_complaints():
    """Get complaints assigned to logged-in employee."""
    employee_id = get_jwt_identity()
    
    filters = {
        'status': request.args.get('status'),
    }
    filters = {k: v for k, v in filters.items() if v}
    
    try:
        complaints = get_employee_complaints(employee_id, filters)
        return jsonify(complaints), 200
    except Exception as e:
        logger.error(f"Error fetching complaints: {str(e)}")
        return jsonify({'message': 'Failed to fetch complaints'}), 500


@main.route('/employee-portal/complaints/<complaint_id>/status', methods=['PUT'])
@jwt_required()
def update_my_complaint_status(complaint_id):
    """Update status of a complaint assigned to logged-in employee."""
    employee_id = get_jwt_identity()
    data = request.get_json()
    
    new_status = data.get('status')
    remarks = data.get('remarks')
    resolution_proof = data.get('resolution_proof')
    
    if not new_status:
        return jsonify({'message': 'Status is required'}), 400
    
    try:
        result = update_complaint_status(complaint_id, employee_id, new_status, remarks, resolution_proof)
        return jsonify(result), 200
    except ValueError as e:
        return jsonify({'message': str(e)}), 400
    except Exception as e:
        logger.error(f"Error updating complaint: {str(e)}")
        return jsonify({'message': 'Failed to update complaint'}), 500


# ============== Customers ==============

@main.route('/employee-portal/customers', methods=['GET'])
@jwt_required()
def get_my_customers():
    """Get customers managed by logged-in employee."""
    employee_id = get_jwt_identity()
    
    filters = {
        'is_active': request.args.get('is_active', type=lambda x: x.lower() == 'true') if request.args.get('is_active') else None,
        'search': request.args.get('search'),
    }
    filters = {k: v for k, v in filters.items() if v is not None}
    
    try:
        customers = get_managed_customers(employee_id, filters)
        return jsonify(customers), 200
    except Exception as e:
        logger.error(f"Error fetching customers: {str(e)}")
        return jsonify({'message': 'Failed to fetch customers'}), 500


# ============== Financial ==============

@main.route('/employee-portal/financial', methods=['GET'])
@jwt_required()
def get_my_financial():
    """Get financial summary and ledger for logged-in employee."""
    employee_id = get_jwt_identity()
    
    try:
        financial = get_employee_financial(employee_id)
        if not financial:
            return jsonify({'message': 'Financial data not found'}), 404
        return jsonify(financial), 200
    except Exception as e:
        logger.error(f"Error fetching financial: {str(e)}")
        return jsonify({'message': 'Failed to fetch financial data'}), 500


# ============== Inventory ==============

@main.route('/employee-portal/inventory', methods=['GET'])
@jwt_required()
def get_my_inventory():
    """Get inventory items assigned to logged-in employee."""
    employee_id = get_jwt_identity()
    
    try:
        inventory = get_employee_inventory(employee_id)
        return jsonify(inventory), 200
    except Exception as e:
        logger.error(f"Error fetching inventory: {str(e)}")
        return jsonify({'message': 'Failed to fetch inventory'}), 500


# ============== Recoveries ==============

@main.route('/employee-portal/recoveries', methods=['GET'])
@jwt_required()
def get_my_recoveries():
    """Get recovery tasks assigned to logged-in employee."""
    employee_id = get_jwt_identity()
    
    filters = {
        'status': request.args.get('status'),
    }
    filters = {k: v for k, v in filters.items() if v}
    
    try:
        recoveries = get_employee_recoveries(employee_id, filters)
        return jsonify(recoveries), 200
    except Exception as e:
        logger.error(f"Error fetching recoveries: {str(e)}")
        return jsonify({'message': 'Failed to fetch recoveries'}), 500


@main.route('/employee-portal/recoveries/<recovery_id>/status', methods=['PUT'])
@jwt_required()
def update_my_recovery_status(recovery_id):
    """Update status of a recovery task assigned to logged-in employee."""
    employee_id = get_jwt_identity()
    data = request.get_json()
    
    new_status = data.get('status')
    notes = data.get('notes')
    completion_notes = data.get('completion_notes')
    completion_proof = data.get('completion_proof')
    
    if not new_status:
        return jsonify({'message': 'Status is required'}), 400
    
    try:
        result = update_recovery_status(recovery_id, employee_id, new_status, notes, completion_notes, completion_proof)
        return jsonify(result), 200
    except ValueError as e:
        return jsonify({'message': str(e)}), 400
    except Exception as e:
        logger.error(f"Error updating recovery: {str(e)}")
        return jsonify({'message': 'Failed to update recovery'}), 500
