from app import create_app
from scheduler import init_scheduler

app = create_app()
init_scheduler(app)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)

