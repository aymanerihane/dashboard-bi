from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db, DatabaseConnection as DBConnection, QueryHistory, User
from app.schemas import QueryExecute, QueryResult, QueryHistoryItem
from app.auth import get_current_user
from app.db_manager import db_manager

router = APIRouter()

@router.post("/execute", response_model=QueryResult)
async def execute_query(
    query_data: QueryExecute,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Get database connection
    connection = db.query(DBConnection).filter(
        DBConnection.id == query_data.database_id,
        DBConnection.user_id == current_user.id
    ).first()
    
    if not connection:
        raise HTTPException(status_code=404, detail="Database connection not found")
    
    # Prepare connection data
    connection_data = {
        "db_type": connection.db_type,
        "host": connection.host,
        "port": connection.port,
        "database_name": connection.database_name,
        "username": connection.username,
        "password": db_manager.decrypt_password(connection.password) if connection.password else None
    }
    
    # Execute query
    result = await db_manager.execute_query(connection_data, query_data.query, query_data.limit)
    
    # Save to query history
    query_history = QueryHistory(
        user_id=current_user.id,
        database_id=query_data.database_id,
        query=query_data.query,
        execution_time=result["execution_time"],
        row_count=result["row_count"],
        status="success" if result["success"] else "error",
        error_message=result.get("error")
    )
    db.add(query_history)
    db.commit()
    
    return QueryResult(**result)

@router.get("/history", response_model=List[QueryHistoryItem])
async def get_query_history(
    limit: int = 10,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    history = db.query(QueryHistory).filter(
        QueryHistory.user_id == current_user.id
    ).order_by(QueryHistory.executed_at.desc()).limit(limit).all()
    
    return history
