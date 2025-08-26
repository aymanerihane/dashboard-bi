# backend/app/api/v1/__init__.py

from fastapi import APIRouter

router = APIRouter()

from . import api  # Import the API routes
from .endpoints import auth, connections, queries  # Import the endpoints

router.include_router(auth.router, prefix="/auth", tags=["auth"])
router.include_router(connections.router, prefix="/connections", tags=["connections"])
router.include_router(queries.router, prefix="/queries", tags=["queries"])