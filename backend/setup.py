#!/usr/bin/env python3

import os
import subprocess
import sys
from pathlib import Path

def run_command(command, description):
    print(f"\n{description}...")
    result = subprocess.run(command, shell=True, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"Error: {result.stderr}")
        return False
    print(f"✅ {description} completed")
    return True

def setup_environment():
    print("🚀 Setting up Database Dashboard Backend...")
    
    # Create virtual environment
    if not run_command("python3 -m venv venv", "Creating virtual environment"):
        return False
    
    # Activate virtual environment and install dependencies
    if os.name == 'nt':  # Windows
        activate_cmd = "venv\\Scripts\\activate && pip install -r requirements.txt"
    else:  # Unix/MacOS
        activate_cmd = "source venv/bin/activate && pip install -r requirements.txt"
    
    if not run_command(activate_cmd, "Installing dependencies"):
        return False
    
    # Create .env file if it doesn't exist
    env_file = Path(".env")
    if not env_file.exists():
        with open(env_file, "w") as f:
            f.write('''SECRET_KEY=your-secret-key-change-in-production-please
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
DATABASE_URL=sqlite:///./dashboard.db
''')
        print("✅ Created .env file")
    
    # Create necessary directories
    Path("data").mkdir(exist_ok=True)
    Path("logs").mkdir(exist_ok=True)
    
    print("\n🎉 Setup completed successfully!")
    print("\nTo start the backend server:")
    print("1. Activate virtual environment:")
    if os.name == 'nt':
        print("   .\\venv\\Scripts\\activate")
    else:
        print("   source venv/bin/activate")
    print("2. Start the server:")
    print("   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000")
    print("\nAPI will be available at: http://localhost:8000")
    print("API documentation: http://localhost:8000/docs")

if __name__ == "__main__":
    setup_environment()
