from app import create_app, db
from sqlalchemy import text

app = create_app()

with app.app_context():
    try:
        # Check if column exists
        result = db.session.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='bank_accounts' AND column_name='current_balance';"))
        if result.fetchone():
            print("Column 'current_balance' already exists.")
        else:
            print("Adding column 'current_balance'...")
            db.session.execute(text("ALTER TABLE bank_accounts ADD COLUMN current_balance NUMERIC(15, 2) DEFAULT 0.00;"))
            db.session.commit()
            print("Column added successfully.")
            
            # Initialize current_balance with initial_balance
            print("Initializing current_balance...")
            db.session.execute(text("UPDATE bank_accounts SET current_balance = initial_balance;"))
            db.session.commit()
            print("Initialization complete.")
            
    except Exception as e:
        print(f"Error: {e}")
