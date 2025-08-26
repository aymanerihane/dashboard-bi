from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.api.deps import get_db
from app.schemas.connection import ConnectionCreate, ConnectionResponse
from app.services.database_service import DatabaseService

router = APIRouter()

@router.post("/connections/", response_model=ConnectionResponse)
def create_connection(connection: ConnectionCreate, db: Session = Depends(get_db)):
    db_service = DatabaseService(db)
    try:
        return db_service.create_connection(connection)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/connections/{connection_id}", response_model=ConnectionResponse)
def read_connection(connection_id: int, db: Session = Depends(get_db)):
    db_service = DatabaseService(db)
    connection = db_service.get_connection(connection_id)
    if connection is None:
        raise HTTPException(status_code=404, detail="Connection not found")
    return connection

@router.get("/connections/", response_model=list[ConnectionResponse])
def list_connections(db: Session = Depends(get_db)):
    db_service = DatabaseService(db)
    return db_service.get_all_connections()

@router.delete("/connections/{connection_id}", response_model=dict)
def delete_connection(connection_id: int, db: Session = Depends(get_db)):
    db_service = DatabaseService(db)
    success = db_service.delete_connection(connection_id)
    if not success:
        raise HTTPException(status_code=404, detail="Connection not found")
    return {"detail": "Connection deleted successfully"}