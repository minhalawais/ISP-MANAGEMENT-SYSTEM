from app import create_app
from scheduler import init_scheduler
from asgiref.wsgi import WsgiToAsgi  # Import the ASGI adapter

app = create_app()
init_scheduler(app)
asgi_app = WsgiToAsgi(app)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(asgi_app, host="0.0.0.0", port=8000, reload=True)

