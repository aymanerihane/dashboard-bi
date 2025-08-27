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

@router.get("/explore/{database_id}/tables")
async def explore_tables(
    database_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get tables/collections for exploration"""
    # Get database connection
    connection = db.query(DBConnection).filter(
        DBConnection.id == database_id,
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
    
    try:
        if connection.db_type in ["mongodb", "mongodb-atlas"]:
            # Get collections for MongoDB
            from app.mongo_manager import mongo_manager
            connection_string = db_manager.build_connection_string(connection_data)
            collections = mongo_manager.get_collections(connection_string, connection.database_name)
            return {"type": "nosql", "collections": collections}
        else:
            # Get tables for SQL databases
            connection_string = db_manager.build_connection_string(connection_data)
            tables = db_manager.get_tables(connection_string, connection.db_type)
            return {"type": "sql", "tables": tables}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error fetching tables: {str(e)}")

@router.get("/explore/{database_id}/table/{table_name}")
async def explore_table_data(
    database_id: int,
    table_name: str,
    page: int = 1,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get paginated data from a table/collection"""
    # Get database connection
    connection = db.query(DBConnection).filter(
        DBConnection.id == database_id,
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
    
    try:
        offset = (page - 1) * limit
        
        if connection.db_type in ["mongodb", "mongodb-atlas"]:
            # Get collection data for MongoDB
            from app.mongo_manager import mongo_manager
            connection_string = db_manager.build_connection_string(connection_data)
            result = mongo_manager.get_collection_data(connection_string, connection.database_name, table_name, limit)
            if result.get("success"):
                return {
                    "type": "nosql",
                    "collection": table_name,
                    "data": result["data"],
                    "fields": result["fields"],
                    "row_count": result["row_count"],
                    "total_count": result.get("total_count", result["row_count"]),
                    "page": page,
                    "limit": limit,
                    "has_more": result["row_count"] >= limit
                }
            else:
                raise HTTPException(status_code=400, detail=result.get("error", "Unknown error"))
        else:
            # Get table data for SQL databases
            connection_string = db_manager.build_connection_string(connection_data)
            result = db_manager.get_table_data(connection_string, connection.db_type, table_name, limit, offset)
            if result.get("success"):
                return {
                    "type": "sql",
                    "table": table_name,
                    "columns": result["columns"],
                    "data": result["data"],
                    "row_count": result["row_count"],
                    "total_count": result.get("total_count", result["row_count"]),
                    "page": page,
                    "limit": limit,
                    "has_more": result["row_count"] >= limit
                }
            else:
                raise HTTPException(status_code=400, detail=result.get("error", "Unknown error"))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error fetching table data: {str(e)}")

@router.post("/explore/{database_id}/search")
async def search_data(
    database_id: int,
    search_data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Search data in tables/collections"""
    # Get database connection
    connection = db.query(DBConnection).filter(
        DBConnection.id == database_id,
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
    
    try:
        table_name = search_data.get("table")
        search_term = search_data.get("search")
        column = search_data.get("column")
        limit = search_data.get("limit", 50)
        
        if connection.db_type in ["mongodb", "mongodb-atlas"]:
            # Search in MongoDB collection
            from app.mongo_manager import mongo_manager
            connection_string = db_manager.build_connection_string(connection_data)
            result = mongo_manager.search_collection_data(connection_string, connection.database_name, table_name, search_term, limit)
        else:
            # Search in SQL table
            connection_string = db_manager.build_connection_string(connection_data)
            result = db_manager.search_table(connection_string, connection.db_type, table_name, search_term, column, limit)
        
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error searching data: {str(e)}")
