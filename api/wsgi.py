# filepath: /d:/PycharmProjects/isp-management-system/api/wsgi.py
from run import app, asgi_app  # noqa: F401 — uvicorn entry: run:asgi_app

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(asgi_app, host="0.0.0.0", port=8000)
