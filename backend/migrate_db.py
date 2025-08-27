import sqlite3
import os

def migrate_database():
    """Add new columns to existing database_connections table"""
    db_path = "dashboard.db"
    
    if not os.path.exists(db_path):
        print("Database file not found. Run init_db.py first.")
        return
    
    # Connect to the database
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    print("Starting database migration...")
    
    # Add new columns if they don't exist
    try:
        cursor.execute("ALTER TABLE database_connections ADD COLUMN connection_string TEXT")
        print("✓ Added connection_string column")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e):
            print("✓ connection_string column already exists")
        else:
            print(f"✗ Error adding connection_string column: {e}")
    
    try:
        cursor.execute("ALTER TABLE database_connections ADD COLUMN file_path TEXT")
        print("✓ Added file_path column")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e):
            print("✓ file_path column already exists")
        else:
            print(f"✗ Error adding file_path column: {e}")
    
    # Commit changes and close connection
    conn.commit()
    conn.close()
    
    print("Database migration completed successfully!")

if __name__ == "__main__":
    migrate_database()
