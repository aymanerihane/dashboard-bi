#!/usr/bin/env python3

import asyncio
import sys
from pathlib import Path

# Add the app directory to the path
sys.path.append(str(Path(__file__).parent))

from app.database import engine, Base
from app.routers.auth import create_admin_user

async def init_database():
    print("Initializing database...")
    
    # Create all tables
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables created")
    
    # Create default users
    await create_admin_user()
    print("✅ Default users created")
    
    print("\n🎉 Database initialization completed!")
    print("\nDefault users:")
    print("- Admin: admin@example.com / admin123")
    print("- User: user@example.com / user123")

if __name__ == "__main__":
    asyncio.run(init_database())
