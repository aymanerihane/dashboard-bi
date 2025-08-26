from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv

from app.database import engine, Base
from app.routers import auth, databases, queries, dashboards
from app.auth import get_current_user

load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables on startup
    Base.metadata.create_all(bind=engine)
    
    # Create default users
    from app.routers.auth import create_admin_user
    await create_admin_user()
    
    yield
    # Cleanup on shutdown
    pass

app = FastAPI(
    title="Database Dashboard API",
    description="A comprehensive database management and visualization platform",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(databases.router, prefix="/api/databases", tags=["Database Connections"])
app.include_router(queries.router, prefix="/api/queries", tags=["Query Execution"])
app.include_router(dashboards.router, prefix="/api/dashboards", tags=["Dashboards"])

@app.get("/")
async def root():
    return {"message": "Database Dashboard API", "status": "running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "1.0.0"}
