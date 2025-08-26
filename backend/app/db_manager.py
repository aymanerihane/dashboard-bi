import sqlalchemy
from sqlalchemy import create_engine, text, MetaData, inspect
import pymysql
import sqlite3
import asyncio
import time
from typing import Dict, List, Any, Optional, Tuple
from contextlib import contextmanager
from app.schemas import ConnectionTestResult, TableInfo, ColumnInfo
from cryptography.fernet import Fernet
from fastapi import HTTPException
import os

class DatabaseManager:
    def __init__(self):
        # Simple encryption key (use proper key management in production)
        self.cipher_key = Fernet.generate_key()
        self.cipher = Fernet(self.cipher_key)
    
    def encrypt_password(self, password: str) -> str:
        return self.cipher.encrypt(password.encode()).decode()
    
    def decrypt_password(self, encrypted_password: str) -> str:
        return self.cipher.decrypt(encrypted_password.encode()).decode()
    
    def build_connection_string(self, connection_data: dict) -> str:
        db_type = connection_data["db_type"]
        
        if db_type == "postgresql":
            return f"postgresql://{connection_data['username']}:{connection_data['password']}@{connection_data['host']}:{connection_data['port']}/{connection_data['database_name']}"
        elif db_type == "mysql":
            return f"mysql+pymysql://{connection_data['username']}:{connection_data['password']}@{connection_data['host']}:{connection_data['port']}/{connection_data['database_name']}"
        elif db_type == "sqlite":
            return f"sqlite:///{connection_data['database_name']}"
        else:
            raise ValueError(f"Unsupported database type: {db_type}")
    
    @contextmanager
    def get_connection(self, connection_data: dict):
        connection_string = self.build_connection_string(connection_data)
        engine = None
        connection = None
        try:
            engine = create_engine(connection_string)
            connection = engine.connect()
            yield connection
        except Exception as e:
            if connection:
                connection.close()
            raise e
        finally:
            if connection:
                connection.close()
            if engine:
                engine.dispose()
    
    async def test_connection(self, connection_data: dict) -> ConnectionTestResult:
        try:
            start_time = time.time()
            
            with self.get_connection(connection_data) as conn:
                # Simple test query based on database type
                if connection_data["db_type"] == "postgresql":
                    result = conn.execute(text("SELECT version()"))
                elif connection_data["db_type"] == "mysql":
                    result = conn.execute(text("SELECT VERSION()"))
                elif connection_data["db_type"] == "sqlite":
                    result = conn.execute(text("SELECT sqlite_version()"))
                
                result.fetchone()
                
            latency = int((time.time() - start_time) * 1000)
            
            return ConnectionTestResult(
                success=True,
                message="Connection successful",
                latency=latency
            )
        except Exception as e:
            return ConnectionTestResult(
                success=False,
                message="Connection failed",
                error=str(e)
            )
    
    async def get_tables(self, connection_data: dict) -> List[TableInfo]:
        try:
            with self.get_connection(connection_data) as conn:
                inspector = inspect(conn)
                tables = []
                
                for table_name in inspector.get_table_names():
                    # Get column information
                    columns = []
                    for col in inspector.get_columns(table_name):
                        columns.append(ColumnInfo(
                            name=col['name'],
                            type=str(col['type']),
                            nullable=col['nullable'],
                            primary_key=col.get('primary_key', False),
                            default_value=str(col.get('default')) if col.get('default') else None
                        ))
                    
                    # Get row count
                    try:
                        result = conn.execute(text(f"SELECT COUNT(*) FROM {table_name}"))
                        row_count = result.scalar()
                    except:
                        row_count = 0
                    
                    tables.append(TableInfo(
                        name=table_name,
                        row_count=row_count,
                        columns=columns
                    ))
                
                return tables
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Error fetching tables: {str(e)}")
    
    async def execute_query(self, connection_data: dict, query: str, limit: int = 1000) -> Dict[str, Any]:
        try:
            start_time = time.time()
            
            with self.get_connection(connection_data) as conn:
                # Add LIMIT to SELECT queries if not present
                query_upper = query.strip().upper()
                if query_upper.startswith('SELECT') and 'LIMIT' not in query_upper:
                    query = f"{query.rstrip(';')} LIMIT {limit}"
                
                result = conn.execute(text(query))
                
                if result.returns_rows:
                    rows = result.fetchall()
                    columns = [{"name": col, "type": str(result._metadata.keys[i])} 
                             for i, col in enumerate(result.keys())]
                    
                    data = [dict(row._mapping) for row in rows]
                    row_count = len(data)
                else:
                    data = []
                    columns = []
                    row_count = result.rowcount if hasattr(result, 'rowcount') else 0
                
                execution_time = int((time.time() - start_time) * 1000)
                
                return {
                    "success": True,
                    "data": data,
                    "columns": columns,
                    "row_count": row_count,
                    "execution_time": execution_time
                }
                
        except Exception as e:
            execution_time = int((time.time() - start_time) * 1000)
            return {
                "success": False,
                "data": [],
                "columns": [],
                "row_count": 0,
                "execution_time": execution_time,
                "error": str(e)
            }
    
    async def get_table_data(self, connection_data: dict, table_name: str, 
                           limit: int = 10, offset: int = 0) -> Dict[str, Any]:
        query = f"SELECT * FROM {table_name} LIMIT {limit} OFFSET {offset}"
        return await self.execute_query(connection_data, query, limit)

# Create global instance
db_manager = DatabaseManager()
