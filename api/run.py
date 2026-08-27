import os

from dotenv import load_dotenv

# Uvicorn does not load .env automatically; Flask env vars must be loaded first.
load_dotenv()

from app import create_app

# a2wsgi (not asgiref.WsgiToAsgi): long-lived SSE must not share a single
# thread-sensitive executor or it starves every other HTTP request.
from a2wsgi import WSGIMiddleware

app = create_app()
asgi_app = WSGIMiddleware(app, workers=32, send_queue_size=32)

if __name__ == "__main__":
    import uvicorn
    reload_enabled = os.environ.get("UVICORN_RELOAD", "false").lower() in {
        "1",
        "true",
        "yes",
        "on",
    }
    uvicorn.run(asgi_app, host="0.0.0.0", port=8000, reload=reload_enabled)
