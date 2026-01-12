# employee.py

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from ...crud.employee_cruds import (
    get_open_complaints_count,
    get_pending_tasks_count,
    get_assigned_inventory_count,
    get_inventory_transactions_count,
    get_recent_complaints,
    get_pending_tasks,
    get_recent_inventory_transactions
)
from .. import main

@main.route('/employee/dashboard/stats', methods=['GET'])
@jwt_required()
def get_dashboard_stats():
    try:
        employee_id = get_jwt_identity()
        open_complaints = get_open_complaints_count(employee_id)
        pending_tasks = get_pending_tasks_count(employee_id)
        assigned_inventory = get_assigned_inventory_count(employee_id)
        inventory_transactions = get_inventory_transactions_count(employee_id)

        return jsonify({
            'open_complaints': open_complaints,
            'pending_tasks': pending_tasks,
            'assigned_inventory': assigned_inventory,
            'inventory_transactions': inventory_transactions
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@main.route('/employee/dashboard/recent_complaints', methods=['GET'])
@jwt_required()
def get_dashboard_recent_complaints():
    try:
        employee_id = get_jwt_identity()
        complaints = get_recent_complaints(employee_id)
        return jsonify(complaints), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@main.route('/employee/dashboard/pending_tasks', methods=['GET'])
@jwt_required()
def get_dashboard_pending_tasks():
    try:
        employee_id = get_jwt_identity()
        tasks = get_pending_tasks(employee_id)
        return jsonify(tasks), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@main.route('/employee/dashboard/recent_inventory_transactions', methods=['GET'])
@jwt_required()
def get_dashboard_recent_inventory_transactions():
    try:
        employee_id = get_jwt_identity()
        transactions = get_recent_inventory_transactions(employee_id)
        return jsonify(transactions), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500