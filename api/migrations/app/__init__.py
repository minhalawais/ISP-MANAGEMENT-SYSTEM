from flask import Flask
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager
from flask_migrate import Migrate
from datetime import timedelta
from flask_mail import Mail

import os

db = SQLAlchemy()
bcrypt = Bcrypt()
jwt = JWTManager()
migrate = Migrate()
mail = Mail()

def create_app():
    app = Flask(__name__)
    CORS(app)

    # Database configuration
    app.config.from_object('config.Config')
    app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)
    app.config['UPLOAD_FOLDER'] = 'uploads'
    app.config['MAIL_SERVER'] = 'smtp.gmail.com'
    app.config['MAIL_PORT'] = 587
    app.config['MAIL_USE_TLS'] = True
    app.config['MAIL_USERNAME'] = 'minhalawais1@gmail.com'  # Replace with your Gmail address
    app.config['MAIL_PASSWORD'] = 'hsgv uimz esrk frqs'         # Replace with your Gmail app password
    app.config['MAIL_DEFAULT_SENDER'] = 'minhalawais1@gmail.com'  # Default sender email

    db.init_app(app)
    bcrypt.init_app(app)
    jwt.init_app(app)
    migrate.init_app(app, db)

    mail.init_app(app)

    with app.app_context():
        from .routes import main
        from .auth import auth
        from . import models
        from . import whatsapp_models  # Import WhatsApp models
        app.register_blueprint(main)
        app.register_blueprint(auth, url_prefix='/auth')
        db.create_all()

    return app