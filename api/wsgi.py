# filepath: /d:/PycharmProjects/isp-management-system/api/wsgi.py
from run import app
from asgiref.wsgi import WsgiToAsgi  # Import the ASGI adapter

# Wrap the Flask app with WsgiToAsgi
asgi_app = WsgiToAsgi(app)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(asgi_app, host="0.0.0.0", port=8000)