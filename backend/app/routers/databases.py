from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel

from app.database import get_db, DatabaseConnection as DBConnection, User
from app.schemas import DatabaseConnectionCreate, DatabaseConnectionUpdate, DatabaseConnection, ConnectionTestResult, TableInfo
from app.auth import get_current_user
from app.db_manager import db_manager

class ConnectionTestRequest(BaseModel):
    type: str  # Changed from db_type to match frontend
    host: str = None
    port: int = None
    database: str = None  # Changed from database_name to match frontend
    username: str = None
    password: str = None
    connectionString: str = None  # For MongoDB Atlas
    file_path: str = None  # For SQLite

class ConnectWithPasswordRequest(BaseModel):
    password: str

router = APIRouter()

@router.post("/test", response_model=ConnectionTestResult)
async def test_connection_standalone(
    connection_request: ConnectionTestRequest,
    current_user: User = Depends(get_current_user)
):
    """Test a database connection without saving it"""
    
    # Handle different database types
    if connection_request.type == "mongodb-atlas":
        if not connection_request.connectionString:
            raise HTTPException(status_code=400, detail="MongoDB Atlas requires a connection string")
        
        connection_data = {
            "db_type": "mongodb-atlas",
            "connection_string": connection_request.connectionString,
            "database_name": connection_request.database or "test"
        }
    elif connection_request.type == "sqlite":
        if not connection_request.file_path and not connection_request.database:
            raise HTTPException(status_code=400, detail="SQLite requires a file path")
            
        connection_data = {
            "db_type": "sqlite",
            "database_name": connection_request.file_path or connection_request.database
        }
    elif connection_request.type in ["redis"]:
        connection_data = {
            "db_type": connection_request.type,
            "host": connection_request.host,
            "port": connection_request.port,
            "database_name": connection_request.database or "0",
            "password": connection_request.password
        }
    else:
        # Standard databases (PostgreSQL, MySQL, MongoDB, Cassandra)
        if not all([connection_request.host, connection_request.database, connection_request.username]):
            raise HTTPException(status_code=400, detail="Host, database, and username are required")
            
        connection_data = {
            "db_type": connection_request.type,
            "host": connection_request.host,
            "port": connection_request.port,
            "database_name": connection_request.database,
            "username": connection_request.username,
            "password": connection_request.password
        }
    
    return await db_manager.test_connection(connection_data)

@router.get("/", response_model=List[DatabaseConnection])
async def list_connections(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    connections = db.query(DBConnection).filter(DBConnection.user_id == current_user.id).all()
    return connections

@router.post("/", response_model=DatabaseConnection)
async def create_connection(
    connection: DatabaseConnectionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Encrypt password if provided
    encrypted_password = None
    if connection.password:
        encrypted_password = db_manager.encrypt_password(connection.password)
    
    db_connection = DBConnection(
        user_id=current_user.id,
        name=connection.name,
        db_type=connection.db_type,
        host=connection.host,
        port=connection.port,
        database_name=connection.database_name,
        username=connection.username,
        password=encrypted_password,
        status="disconnected"
    )
    
    db.add(db_connection)
    db.commit()
    db.refresh(db_connection)
    
    return db_connection

@router.get("/{connection_id}", response_model=DatabaseConnection)
async def get_connection(
    connection_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    connection = db.query(DBConnection).filter(
        DBConnection.id == connection_id,
        DBConnection.user_id == current_user.id
    ).first()
    
    if not connection:
        raise HTTPException(status_code=404, detail="Connection not found")
    
    return connection

@router.put("/{connection_id}", response_model=DatabaseConnection)
async def update_connection(
    connection_id: int,
    connection_update: DatabaseConnectionUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    connection = db.query(DBConnection).filter(
        DBConnection.id == connection_id,
        DBConnection.user_id == current_user.id
    ).first()
    
    if not connection:
        raise HTTPException(status_code=404, detail="Connection not found")
    
    update_data = connection_update.dict(exclude_unset=True)
    
    # Encrypt password if provided
    if "password" in update_data and update_data["password"]:
        update_data["password"] = db_manager.encrypt_password(update_data["password"])
    
    for field, value in update_data.items():
        setattr(connection, field, value)
    
    db.commit()
    db.refresh(connection)
    
    return connection

@router.delete("/{connection_id}")
async def delete_connection(
    connection_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    connection = db.query(DBConnection).filter(
        DBConnection.id == connection_id,
        DBConnection.user_id == current_user.id
    ).first()
    
    if not connection:
        raise HTTPException(status_code=404, detail="Connection not found")
    
    db.delete(connection)
    db.commit()
    
    return {"message": "Connection deleted successfully"}

@router.post("/{connection_id}/test", response_model=ConnectionTestResult)
async def test_connection(
    connection_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    connection = db.query(DBConnection).filter(
        DBConnection.id == connection_id,
        DBConnection.user_id == current_user.id
    ).first()
    
    if not connection:
        raise HTTPException(status_code=404, detail="Connection not found")
    
    # Prepare connection data
    connection_data = {
        "db_type": connection.db_type,
        "host": connection.host,
        "port": connection.port,
        "database_name": connection.database_name,
        "username": connection.username,
        "password": db_manager.decrypt_password(connection.password) if connection.password else None
    }
    
    result = await db_manager.test_connection(connection_data)
    
    # Update connection status
    connection.status = "connected" if result.success else "error"
    db.commit()
    
    return result

@router.post("/{connection_id}/connect", response_model=ConnectionTestResult)
async def connect_with_password(
    connection_id: int,
    request: ConnectWithPasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Connect to a database using password verification"""
    connection = db.query(DBConnection).filter(
        DBConnection.id == connection_id,
        DBConnection.user_id == current_user.id
    ).first()
    
    if not connection:
        raise HTTPException(status_code=404, detail="Connection not found")
    
    # Verify the provided password matches the stored encrypted password
    if connection.password:
        stored_password = db_manager.decrypt_password(connection.password)
        if request.password != stored_password:
            return ConnectionTestResult(
                success=False,
                message="Authentication failed",
                error="Invalid password"
            )
    else:
        # If no password is stored, reject the connection
        return ConnectionTestResult(
            success=False,
            message="Authentication failed",
            error="No password stored for this connection"
        )
    
    # Password verified, now test the actual database connection
    connection_data = {
        "db_type": connection.db_type,
        "host": connection.host,
        "port": connection.port,
        "database_name": connection.database_name,
        "username": connection.username,
        "password": request.password
    }
    
    result = await db_manager.test_connection(connection_data)
    
    # Update connection status
    connection.status = "connected" if result.success else "error"
    db.commit()
    
    return result

@router.get("/{connection_id}/tables", response_model=List[TableInfo])
async def get_tables(
    connection_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    connection = db.query(DBConnection).filter(
        DBConnection.id == connection_id,
        DBConnection.user_id == current_user.id
    ).first()
    
    if not connection:
        raise HTTPException(status_code=404, detail="Connection not found")
    
    connection_data = {
        "db_type": connection.db_type,
        "host": connection.host,
        "port": connection.port,
        "database_name": connection.database_name,
        "username": connection.username,
        "password": db_manager.decrypt_password(connection.password) if connection.password else None
    }
    
    return await db_manager.get_tables(connection_data)

@router.get("/{connection_id}/tables/{table_name}/data")
async def get_table_data(
    connection_id: int,
    table_name: str,
    limit: int = 10,
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    connection = db.query(DBConnection).filter(
        DBConnection.id == connection_id,
        DBConnection.user_id == current_user.id
    ).first()
    
    if not connection:
        raise HTTPException(status_code=404, detail="Connection not found")
    
    connection_data = {
        "db_type": connection.db_type,
        "host": connection.host,
        "port": connection.port,
        "database_name": connection.database_name,
        "username": connection.username,
        "password": db_manager.decrypt_password(connection.password) if connection.password else None
    }
    
    try:
        return await db_manager.get_table_data(connection_data, table_name, limit, offset)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching table data: {str(e)}")
