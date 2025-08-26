import asyncio
import time
from typing import Dict, List, Any, Optional
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import ConnectionFailure, OperationFailure, ServerSelectionTimeoutError
from app.schemas import ConnectionTestResult
from fastapi import HTTPException
import json
from bson import ObjectId
import datetime

class MongoDBManager:
    def __init__(self):
        self.client = None
    
    def build_connection_string(self, connection_data: dict) -> str:
        """Build MongoDB connection string"""
        host = connection_data.get("host", "localhost")
        port = connection_data.get("port", 27017)
        username = connection_data.get("username")
        password = connection_data.get("password")
        database_name = connection_data.get("database_name", "test")
        
        if username and password:
            return f"mongodb://{username}:{password}@{host}:{port}/{database_name}"
        else:
            return f"mongodb://{host}:{port}/{database_name}"
    
    async def get_client(self, connection_data: dict) -> AsyncIOMotorClient:
        """Get MongoDB client"""
        connection_string = self.build_connection_string(connection_data)
        client = AsyncIOMotorClient(
            connection_string,
            serverSelectionTimeoutMS=5000,
            connectTimeoutMS=5000,
            socketTimeoutMS=5000
        )
        return client
    
    async def test_connection(self, connection_data: dict) -> ConnectionTestResult:
        """Test MongoDB connection"""
        try:
            start_time = time.time()
            
            client = await self.get_client(connection_data)
            
            # Test connection by pinging the server
            await client.admin.command('ping')
            
            latency = int((time.time() - start_time) * 1000)
            client.close()
            
            return ConnectionTestResult(
                success=True,
                message="MongoDB connection successful",
                latency=latency
            )
        except ServerSelectionTimeoutError:
            return ConnectionTestResult(
                success=False,
                message="Connection failed",
                error="Server selection timeout - check host and port"
            )
        except ConnectionFailure as e:
            return ConnectionTestResult(
                success=False,
                message="Connection failed",
                error=f"Connection failure: {str(e)}"
            )
        except Exception as e:
            return ConnectionTestResult(
                success=False,
                message="Connection failed",
                error=str(e)
            )
    
    async def get_collections(self, connection_data: dict) -> List[Dict[str, Any]]:
        """Get list of collections (equivalent to tables)"""
        try:
            client = await self.get_client(connection_data)
            db = client[connection_data["database_name"]]
            
            collections = []
            collection_names = await db.list_collection_names()
            
            for collection_name in collection_names:
                collection = db[collection_name]
                
                # Get collection stats
                try:
                    stats = await db.command("collStats", collection_name)
                    row_count = stats.get("count", 0)
                except:
                    row_count = await collection.estimated_document_count()
                
                # Sample document to infer schema
                sample_doc = await collection.find_one()
                columns = []
                
                if sample_doc:
                    for key, value in sample_doc.items():
                        columns.append({
                            "name": key,
                            "type": self._infer_type(value),
                            "nullable": True,
                            "primary_key": key == "_id"
                        })
                
                collections.append({
                    "name": collection_name,
                    "row_count": row_count,
                    "columns": columns
                })
            
            client.close()
            return collections
            
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Error fetching collections: {str(e)}")
    
    def _infer_type(self, value: Any) -> str:
        """Infer MongoDB field type"""
        if isinstance(value, ObjectId):
            return "ObjectId"
        elif isinstance(value, str):
            return "String"
        elif isinstance(value, int):
            return "Integer"
        elif isinstance(value, float):
            return "Double"
        elif isinstance(value, bool):
            return "Boolean"
        elif isinstance(value, datetime.datetime):
            return "Date"
        elif isinstance(value, list):
            return "Array"
        elif isinstance(value, dict):
            return "Object"
        else:
            return "Mixed"
    
    def _serialize_document(self, doc: Dict[str, Any]) -> Dict[str, Any]:
        """Serialize MongoDB document for JSON response"""
        if not doc:
            return doc
            
        serialized = {}
        for key, value in doc.items():
            if isinstance(value, ObjectId):
                serialized[key] = str(value)
            elif isinstance(value, datetime.datetime):
                serialized[key] = value.isoformat()
            elif isinstance(value, dict):
                serialized[key] = self._serialize_document(value)
            elif isinstance(value, list):
                serialized[key] = [
                    self._serialize_document(item) if isinstance(item, dict) 
                    else str(item) if isinstance(item, ObjectId)
                    else item.isoformat() if isinstance(item, datetime.datetime)
                    else item 
                    for item in value
                ]
            else:
                serialized[key] = value
        return serialized
    
    async def execute_query(self, connection_data: dict, query: Dict[str, Any], limit: int = 1000) -> Dict[str, Any]:
        """Execute MongoDB query"""
        try:
            start_time = time.time()
            
            client = await self.get_client(connection_data)
            db = client[connection_data["database_name"]]
            
            # Parse query
            collection_name = query.get("collection")
            operation = query.get("operation", "find")
            filter_query = query.get("filter", {})
            projection = query.get("projection", {})
            sort = query.get("sort", {})
            
            if not collection_name:
                raise ValueError("Collection name is required")
            
            collection = db[collection_name]
            
            # Execute different operations
            if operation == "find":
                cursor = collection.find(filter_query, projection)
                if sort:
                    cursor = cursor.sort(list(sort.items()))
                cursor = cursor.limit(limit)
                
                documents = await cursor.to_list(length=limit)
                data = [self._serialize_document(doc) for doc in documents]
                
                # Get column information from first document
                columns = []
                if data:
                    for key in data[0].keys():
                        columns.append({"name": key, "type": "Mixed"})
                
                row_count = len(data)
                
            elif operation == "aggregate":
                pipeline = query.get("pipeline", [])
                cursor = collection.aggregate(pipeline)
                documents = await cursor.to_list(length=limit)
                data = [self._serialize_document(doc) for doc in documents]
                
                columns = []
                if data:
                    for key in data[0].keys():
                        columns.append({"name": key, "type": "Mixed"})
                
                row_count = len(data)
                
            elif operation == "count":
                count = await collection.count_documents(filter_query)
                data = [{"count": count}]
                columns = [{"name": "count", "type": "Integer"}]
                row_count = 1
                
            else:
                raise ValueError(f"Unsupported operation: {operation}")
            
            client.close()
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
    
    async def get_collection_data(self, connection_data: dict, collection_name: str, 
                                limit: int = 10, offset: int = 0) -> Dict[str, Any]:
        """Get data from a MongoDB collection"""
        query = {
            "collection": collection_name,
            "operation": "find",
            "filter": {},
            "projection": {}
        }
        
        try:
            start_time = time.time()
            
            client = await self.get_client(connection_data)
            db = client[connection_data["database_name"]]
            collection = db[collection_name]
            
            # Get documents with pagination
            cursor = collection.find({}).skip(offset).limit(limit)
            documents = await cursor.to_list(length=limit)
            data = [self._serialize_document(doc) for doc in documents]
            
            # Get column information
            columns = []
            if data:
                for key in data[0].keys():
                    columns.append({"name": key, "type": "Mixed"})
            
            client.close()
            execution_time = int((time.time() - start_time) * 1000)
            
            return {
                "success": True,
                "data": data,
                "columns": columns,
                "row_count": len(data),
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

# Create global instance
mongo_manager = MongoDBManager()
