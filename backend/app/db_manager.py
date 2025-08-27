import sqlalchemy
from sqlalchemy import create_engine, text, MetaData, inspect
import pymysql
import sqlite3
import asyncio
import time
from typing import Dict, List, Any, Optional, Tuple
from contextlib import contextmanager
from app.schemas import ConnectionTestResult, TableInfo, ColumnInfo
from app.mongo_manager import mongo_manager
from cryptography.fernet import Fernet
from fastapi import HTTPException
import os

class DatabaseManager:
    def __init__(self):
        # Use a fixed key for development (use proper key management in production)
        # This ensures passwords can be decrypted after container restarts
        import os
        import base64
        
        # Generate a consistent key for development
        dev_key = "dashboard_bi_dev_key_2024"
        key_bytes = dev_key.ljust(32, '0')[:32].encode()  # Ensure 32 bytes
        self.cipher_key = base64.urlsafe_b64encode(key_bytes)
        self.cipher = Fernet(self.cipher_key)
    
    def encrypt_password(self, password: str) -> str:
        return self.cipher.encrypt(password.encode()).decode()
    
    def decrypt_password(self, encrypted_password: str) -> str:
        try:
            return self.cipher.decrypt(encrypted_password.encode()).decode()
        except Exception as e:
            # If decryption fails (e.g., due to key change), return the password as-is
            # This is a fallback for development - in production, proper key management is needed
            print(f"Warning: Password decryption failed: {e}")
            return encrypted_password
    
    def build_connection_string(self, connection_data: dict) -> str:
        db_type = connection_data["db_type"]
        
        # Map localhost to Docker service names when running in container
        host = connection_data['host']
        if host in ['localhost', '127.0.0.1']:
            if db_type == "postgresql":
                host = 'postgres'
            elif db_type == "mysql":
                host = 'mysql'
            elif db_type == "mongodb":
                host = 'mongodb'
        
        if db_type == "postgresql":
            return f"postgresql://{connection_data['username']}:{connection_data['password']}@{host}:{connection_data['port']}/{connection_data['database_name']}"
        elif db_type == "mysql":
            return f"mysql+pymysql://{connection_data['username']}:{connection_data['password']}@{host}:{connection_data['port']}/{connection_data['database_name']}"
        elif db_type == "sqlite":
            return f"sqlite:///{connection_data['database_name']}"
        elif db_type == "mongodb":
            # MongoDB connection strings are handled by mongo_manager
            connection_data_with_host = connection_data.copy()
            connection_data_with_host['host'] = host
            return mongo_manager.build_connection_string(connection_data_with_host)
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
        # Route MongoDB connections to mongo_manager
        if connection_data.get("db_type") == "mongodb":
            return await mongo_manager.test_connection(connection_data)
        elif connection_data.get("db_type") == "mongodb-atlas":
            return await mongo_manager.test_atlas_connection(connection_data)
        elif connection_data.get("db_type") == "redis":
            return await self.test_redis_connection(connection_data)
        elif connection_data.get("db_type") == "cassandra":
            return await self.test_cassandra_connection(connection_data)
        
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
        # Route MongoDB connections to mongo_manager
        if connection_data.get("db_type") == "mongodb":
            collections = await mongo_manager.get_collections(connection_data)
            # Convert MongoDB collections to TableInfo format
            tables = []
            for collection in collections:
                columns = []
                for col in collection.get("columns", []):
                    columns.append(ColumnInfo(
                        name=col["name"],
                        type=col["type"],
                        nullable=col.get("nullable", True),
                        primary_key=col.get("primary_key", False),
                        default_value=None
                    ))
                
                tables.append(TableInfo(
                    name=collection["name"],
                    row_count=collection.get("row_count", 0),
                    columns=columns
                ))
            return tables
        
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
    
    def preprocess_postgresql_query(self, query: str) -> str:
        """
        Preprocess PostgreSQL queries to handle case-sensitive column names.
        Automatically quotes column names that contain mixed case characters.
        """
        import re
        
        # Pattern to match column names in SELECT statements
        # This will match column names that contain mixed case (both upper and lowercase)
        select_pattern = r'\bSELECT\s+(.*?)\s+FROM'
        
        match = re.search(select_pattern, query, re.IGNORECASE | re.DOTALL)
        if not match:
            return query
        
        columns_part = match.group(1)
        
        # Split by comma and process each column
        columns = [col.strip() for col in columns_part.split(',')]
        processed_columns = []
        
        for col in columns:
            # Skip if it's already quoted, an asterisk, or contains functions
            if (col.startswith('"') and col.endswith('"')) or col == '*' or '(' in col:
                processed_columns.append(col)
            else:
                # Check if the column name contains mixed case
                if re.search(r'[a-z].*[A-Z]|[A-Z].*[a-z]', col):
                    # Quote the column name
                    processed_columns.append(f'"{col}"')
                else:
                    processed_columns.append(col)
        
        # Reconstruct the query
        new_columns_part = ', '.join(processed_columns)
        new_query = re.sub(select_pattern, f'SELECT {new_columns_part} FROM', query, flags=re.IGNORECASE | re.DOTALL)
        
        return new_query

    async def execute_query(self, connection_data: dict, query: str, limit: int = 1000) -> Dict[str, Any]:
        # Route MongoDB connections to mongo_manager
        if connection_data.get("db_type") == "mongodb":
            try:
                # Parse query string as JSON for MongoDB
                import json
                query_dict = json.loads(query) if isinstance(query, str) else query
                return await mongo_manager.execute_query(connection_data, query_dict, limit)
            except json.JSONDecodeError:
                return {
                    "success": False,
                    "data": [],
                    "columns": [],
                    "row_count": 0,
                    "execution_time": 0,
                    "error": "Invalid JSON query format for MongoDB"
                }
        
        try:
            start_time = time.time()
            
            with self.get_connection(connection_data) as conn:
                # Preprocess PostgreSQL queries to handle case-sensitive column names
                if connection_data.get("db_type") == "postgresql":
                    query = self.preprocess_postgresql_query(query)
                
                # Add LIMIT to SELECT queries if not present
                query_upper = query.strip().upper()
                if query_upper.startswith('SELECT') and 'LIMIT' not in query_upper:
                    query = f"{query.rstrip(';')} LIMIT {limit}"
                
                result = conn.execute(text(query))
                
                if result.returns_rows:
                    rows = result.fetchall()
                    # Fix the column metadata handling
                    columns = [{"name": col, "type": "string"} for col in result.keys()]
                    
                    # Handle different SQLAlchemy versions for row mapping
                    try:
                        data = [dict(row._mapping) for row in rows]
                    except AttributeError:
                        # Fallback for older SQLAlchemy versions
                        data = [dict(zip(result.keys(), row)) for row in rows]
                    
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
        # Route MongoDB connections to mongo_manager
        if connection_data.get("db_type") == "mongodb":
            return await mongo_manager.get_collection_data(connection_data, table_name, limit, offset)
        
        try:
            with self.get_connection(connection_data) as conn:
                # Get total count
                count_query = text(f"SELECT COUNT(*) FROM {table_name}")
                count_result = conn.execute(count_query)
                total_count = count_result.fetchone()[0]
                
                # Get data with limit and offset
                if connection_data["db_type"] == "sqlite":
                    query = text(f"SELECT * FROM {table_name} LIMIT {limit} OFFSET {offset}")
                else:
                    query = text(f"SELECT * FROM {table_name} LIMIT {limit} OFFSET {offset}")
                
                result = conn.execute(query)
                columns = result.keys()
                rows = [list(row) for row in result.fetchall()]
                
                return {
                    "columns": list(columns),
                    "rows": rows,
                    "total_count": total_count,
                    "limit": limit,
                    "offset": offset
                }
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to fetch table data: {str(e)}")

    async def test_redis_connection(self, connection_data: dict) -> ConnectionTestResult:
        """Test Redis connection"""
        try:
            import redis
            start_time = time.time()
            
            r = redis.Redis(
                host=connection_data.get("host", "localhost"),
                port=connection_data.get("port", 6379),
                db=int(connection_data.get("database_name", "0")),
                password=connection_data.get("password"),
                socket_timeout=5,
                socket_connect_timeout=5
            )
            
            # Test connection with ping
            r.ping()
            
            latency = int((time.time() - start_time) * 1000)
            r.close()
            
            return ConnectionTestResult(
                success=True,
                message="Redis connection successful",
                latency=latency
            )
        except Exception as e:
            return ConnectionTestResult(
                success=False,
                message="Redis connection failed",
                error=str(e)
            )

    async def test_cassandra_connection(self, connection_data: dict) -> ConnectionTestResult:
        """Test Cassandra connection"""
        try:
            from cassandra.cluster import Cluster
            from cassandra.auth import PlainTextAuthProvider
            
            start_time = time.time()
            
            # Setup authentication if provided
            auth_provider = None
            if connection_data.get("username") and connection_data.get("password"):
                auth_provider = PlainTextAuthProvider(
                    username=connection_data["username"],
                    password=connection_data["password"]
                )
            
            cluster = Cluster(
                [connection_data.get("host", "localhost")],
                port=connection_data.get("port", 9042),
                auth_provider=auth_provider
            )
            
            session = cluster.connect()
            
            # Test connection with a simple query
            session.execute("SELECT release_version FROM system.local")
            
            latency = int((time.time() - start_time) * 1000)
            session.shutdown()
            cluster.shutdown()
            
            return ConnectionTestResult(
                success=True,
                message="Cassandra connection successful",
                latency=latency
            )
        except Exception as e:
            return ConnectionTestResult(
                success=False,
                message="Cassandra connection failed",
                error=str(e)
            )
        query = f"SELECT * FROM {table_name} LIMIT {limit} OFFSET {offset}"
        return await self.execute_query(connection_data, query, limit)

# Create global instance
db_manager = DatabaseManager()
