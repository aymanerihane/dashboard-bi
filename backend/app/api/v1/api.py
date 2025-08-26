from fastapi import APIRouter
from app.api.v1.endpoints import auth, connections, queries

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(connections.router, prefix="/connections", tags=["connections"])
api_router.include_router(queries.router, prefix="/queries", tags=["queries"])