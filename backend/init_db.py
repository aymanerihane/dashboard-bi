#!/usr/bin/env python3

import asyncio
import sys
from pathlib import Path

# Add the app directory to the path
sys.path.append(str(Path(__file__).parent / "app"))

from app.database import init_database
from app.auth import get_password_hash

async def init_database_with_admin():
    """Initialize the database and create admin user"""
    await init_database()
    
    # Create admin user
    from app.database import get_db
    from app.models import User
    
    db = next(get_db())
    
    # Check if admin user already exists
    admin_user = db.query(User).filter(User.email == "admin@example.com").first()
    if not admin_user:
        admin_user = User(
            email="admin@example.com",
            name="Admin User",
            hashed_password=get_password_hash("admin123"),
            role="admin",
            is_active=True
        )
        db.add(admin_user)
        db.commit()
        print("Admin user created successfully!")
        print("- Email: admin@example.com")
        print("- Password: admin123")
    else:
        print("Admin user already exists!")
    
    # Create regular user
    regular_user = db.query(User).filter(User.email == "user@example.com").first()
    if not regular_user:
        regular_user = User(
            email="user@example.com",
            name="Regular User",
            hashed_password=get_password_hash("user123"),
            role="user",
            is_active=True
        )
        db.add(regular_user)
        db.commit()
        print("Regular user created successfully!")
        print("- Email: user@example.com")
        print("- Password: user123")
    else:
        print("Regular user already exists!")
    
    db.close()

if __name__ == "__main__":
    asyncio.run(init_database_with_admin())
