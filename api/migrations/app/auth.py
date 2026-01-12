from flask import Blueprint, request, jsonify, current_app, url_for, render_template_string,render_template
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, get_jwt
from app import db, jwt, mail
from app.models import User
from datetime import timedelta
from flask_mail import Message
from itsdangerous import URLSafeTimedSerializer, SignatureExpired
from werkzeug.security import generate_password_hash, check_password_hash

auth = Blueprint('auth', __name__)

# Create a serializer for generating secure tokens
serializer = URLSafeTimedSerializer(current_app.config['SECRET_KEY'])

@auth.route('/login', methods=['POST'])
def login():
    data = request.json
    user = User.query.filter_by(username=data['username']).first()
    if user and check_password_hash(user.password, data['password']):
        access_token = create_access_token(
            identity=user.id,
            additional_claims={
                "id": str(user.id),
                "company_id": str(user.company_id),
                "role": user.role
            },
            expires_delta=timedelta(hours=150)
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

@jwt.token_in_blocklist_loader
def check_if_token_revoked(jwt_header, jwt_payload):
    jti = jwt_payload["jti"]
    # In a real application, you would check if the JTI is in your blocklist
    # For simplicity, we'll always return False
    return False

@auth.route('/forgot-password', methods=['POST'])
def forgot_password():
    email = request.json.get('email')
    user = User.query.filter_by(email=email).first()
    if user:
        token = serializer.dumps(user.email, salt='password-reset-salt')
        reset_url = url_for('auth.reset_password', token=token, _external=True)
        
        # Render the email template
        html = render_template('emails/password_reset_email.html', reset_url=reset_url, user=user)
        
        msg = Message('Password Reset Request - MBA Communications',
                      sender=current_app.config['MAIL_DEFAULT_SENDER'],
                      recipients=[user.email])
        msg.html = html
        mail.send(msg)
        return jsonify({"message": "Password reset link sent to your email"}), 200
    return jsonify({"error": "Email not found"}), 404

@auth.route('/reset-password/<token>', methods=['GET', 'POST'])
def reset_password(token):
    try:
        email = serializer.loads(token, salt='password-reset-salt', max_age=3600)
    except SignatureExpired:
        return jsonify({"error": "The password reset link has expired"}), 400
    
    if request.method == 'POST':
        user = User.query.filter_by(email=email).first()
        if user:
            new_password = request.json.get('password')
            user.password = generate_password_hash(new_password)
            db.session.commit()
            return jsonify({"message": "Password has been reset successfully"}), 200
        return jsonify({"error": "User not found"}), 404
    else:
        # Render a simple HTML form for GET requests
        reset_form = '''
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reset Password</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <script src="https://unpkg.com/lucide@latest"></script>
        </head>
        <body class="bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center min-h-screen p-4">
            <div class="max-w-md w-full backdrop-blur-lg bg-white/80 p-8 rounded-3xl shadow-xl border border-white/20">
                <h2 class="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                    Reset Your Password
                </h2>
                
                <!-- Alert Container -->
                <div id="alertContainer" class="mb-6 hidden">
                    <!-- Dynamic content will be inserted here -->
                </div>

                <form id="resetForm" class="space-y-6">
                    <div class="space-y-5">
                        <div class="relative group">
                            <label for="password" class="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                            <div class="relative">
                                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <i data-lucide="lock" class="h-5 w-5 text-purple-600 group-hover:text-indigo-600 transition-colors duration-200"></i>
                                </div>
                                <input 
                                    type="password" 
                                    id="password" 
                                    name="password" 
                                    required 
                                    class="block w-full pl-10 pr-3 py-3 bg-white/50 border border-gray-200 rounded-xl
                                           focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent
                                           transition-all duration-200 ease-in-out hover:bg-white/80"
                                    placeholder="Enter your new password"
                                    minlength="8"
                                >
                            </div>
                        </div>

                        <div class="relative group">
                            <label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                            <div class="relative">
                                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <i data-lucide="check-circle" class="h-5 w-5 text-purple-600 group-hover:text-indigo-600 transition-colors duration-200"></i>
                                </div>
                                <input 
                                    type="password" 
                                    id="confirmPassword" 
                                    name="confirmPassword" 
                                    required 
                                    class="block w-full pl-10 pr-3 py-3 bg-white/50 border border-gray-200 rounded-xl
                                           focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent
                                           transition-all duration-200 ease-in-out hover:bg-white/80"
                                    placeholder="Confirm your new password"
                                    minlength="8"
                                >
                            </div>
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        class="w-full flex justify-center items-center py-3 px-4 rounded-xl text-white font-semibold 
                               bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700
                               focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500
                               transition duration-300 ease-in-out transform hover:-translate-y-0.5 active:translate-y-0
                               disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0
                               shadow-lg hover:shadow-xl"
                    >
                        <span id="buttonText">Reset Password</span>
                    </button>
                </form>
            </div>

            <script>
                // Initialize Lucide icons
                lucide.createIcons();

                document.getElementById('resetForm').addEventListener('submit', function(e) {
                    e.preventDefault();
                    const button = this.querySelector('button');
                    const buttonText = document.getElementById('buttonText');
                    const password = document.getElementById('password').value;
                    const confirmPassword = document.getElementById('confirmPassword').value;
                    
                    function showAlert(message, type) {
                        const alertContainer = document.getElementById('alertContainer');
                        const bgColor = type === 'error' ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200';
                        const textColor = type === 'error' ? 'text-red-700' : 'text-green-700';
                        const icon = type === 'error' ? 'alert-circle' : 'check-circle';
                        
                        alertContainer.className = `mb-6 p-3 ${bgColor} border rounded-xl flex items-center gap-2`;
                        alertContainer.innerHTML = `
                            <i data-lucide="${icon}" class="h-5 w-5 ${textColor}"></i>
                            <p class="${textColor}">${message}</p>
                        `;
                        alertContainer.style.display = 'flex';
                        lucide.createIcons();
                    }

                    if (password !== confirmPassword) {
                        showAlert('Passwords do not match', 'error');
                        return;
                    }

                    // Disable button and show loading state
                    button.disabled = true;
                    buttonText.textContent = 'Resetting...';
                    
                    fetch(window.location.href, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({password: password})
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.message) {
                            showAlert(data.message, 'success');
                            setTimeout(() => {
                                window.location.href = '/login';
                            }, 2000);
                        } else {
                            showAlert(data.error || 'An error occurred', 'error');
                            button.disabled = false;
                            buttonText.textContent = 'Reset Password';
                        }
                    })
                    .catch((error) => {
                        console.error('Error:', error);
                        showAlert('An error occurred. Please try again.', 'error');
                        button.disabled = false;
                        buttonText.textContent = 'Reset Password';
                    });
                });
            </script>
        </body>
        </html>
        '''
        return render_template_string(reset_form)

def set_password(user, password):
    user.password = generate_password_hash(password)

