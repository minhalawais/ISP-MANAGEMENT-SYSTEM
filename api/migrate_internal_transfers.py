from sqlalchemy import create_engine, text

# Database credentials from config.py
DB_URI = 'postgresql://postgres:M.m03007493358@localhost/isp_management'

def run_migration():
    engine = create_engine(DB_URI)
    
    # SQL to create the internal_transfers table
    sql = """
    CREATE TABLE IF NOT EXISTS internal_transfers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID NOT NULL REFERENCES companies(id),
        from_account_id UUID NOT NULL REFERENCES bank_accounts(id),
        to_account_id UUID NOT NULL REFERENCES bank_accounts(id),
        amount NUMERIC(15, 2) NOT NULL,
        transfer_date TIMESTAMP WITH TIME ZONE NOT NULL,
        description TEXT,
        reference_number VARCHAR(100),
        status VARCHAR(20) DEFAULT 'completed',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    """
    
    try:
        with engine.connect() as connection:
            connection.execute(text(sql))
            connection.commit()
            print("Successfully created internal_transfers table.")
    except Exception as e:
        print(f"Error creating table: {str(e)}")

if __name__ == "__main__":
    run_migration()
