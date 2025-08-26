from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, databases, query
from app.core.config import settings

app = FastAPI(title="Database Dashboard API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(databases.router)
app.include_router(query.router)

@app.get("/")
async def root():
    return {"message": "Database Dashboard API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}