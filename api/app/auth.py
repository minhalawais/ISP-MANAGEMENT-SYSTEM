from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, get_jwt
from app import bcrypt, db, jwt
from app.models import User
from datetime import timedelta

auth = Blueprint('auth', __name__)

@auth.route('/login', methods=['POST'])
def login():
    data = request.json
    user = User.query.filter_by(username=data['username']).first()
    if user and User.check_password(user, data['password']):
        access_token = create_access_token(
            identity=user.id,
            additional_claims={
                "id": str(user.id),
                "company_id": str(user.company_id),
                "role": user.role
            },
            expires_delta=timedelta(hours=1)
        )
        return jsonify(token=access_token, role=user.role, company_id=str(user.company_id)), 200
    else:
        return jsonify({"error": "Invalid credentials"}), 401

@auth.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    jti = get_jwt()["jti"]
    # In a real application, you would add this JTI to a blocklist
    # For simplicity, we'll just return a success message
    return jsonify({"message": "Successfully logged out"}), 200

@auth.route('/protected', methods=['GET'])
@jwt_required()
def protected():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    return jsonify(logged_in_as=user.username), 200

# Add this function to your auth.py file
@jwt.token_in_blocklist_loader
def check_if_token_revoked(jwt_header, jwt_payload):
    jti = jwt_payload["jti"]
    # In a real application, you would check if the JTI is in your blocklist
    # For simplicity, we'll always return False
    return False

