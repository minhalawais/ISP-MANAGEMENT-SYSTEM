from datetime import timedelta  
import os

class Config:
    SECRET_KEY = 'your_secret_key'
    SQLALCHEMY_DATABASE_URI = 'postgresql://postgres:M.m03007493358@localhost/isp_management'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = 'your_jwt_secret_key'
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    DEBUG=True
    ENV="development"
    MAIL_SERVER = os.environ.get('MAIL_SERVER', 'smtp.googlemail.com')
    MAIL_PORT = int(os.environ.get('MAIL_PORT', '587'))
    MAIL_USE_TLS = os.environ.get('MAIL_USE_TLS', 'true').lower() in ['true', 'on', '1']
    MAIL_USERNAME = os.environ.get('MAIL_USERNAME')
    MAIL_PASSWORD = os.environ.get('MAIL_PASSWORD')
    MAIL_DEFAULT_SENDER = os.environ.get('MAIL_DEFAULT_SENDER')

    SQLALCHEMY_ENGINE_OPTIONS = {
        "connect_args": {
            "options": "-c timezone=Asia/Karachi"
        }
    }