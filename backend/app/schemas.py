from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

class DatabaseType(str, Enum):
    postgresql = "postgresql"
    mysql = "mysql" 
    sqlite = "sqlite"
    mongodb = "mongodb"

class ChartType(str, Enum):
    bar = "bar"
    line = "line"
    area = "area"
    pie = "pie"

# User schemas
class UserBase(BaseModel):
    email: EmailStr
    name: str

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(UserBase):
    id: int
    role: str
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# Database connection schemas
class DatabaseConnectionBase(BaseModel):
    name: str
    db_type: DatabaseType
    host: Optional[str] = None
    port: Optional[int] = None
    database_name: str
    username: Optional[str] = None
    password: Optional[str] = None

class DatabaseConnectionCreate(DatabaseConnectionBase):
    pass

class DatabaseConnectionUpdate(BaseModel):
    name: Optional[str] = None
    host: Optional[str] = None
    port: Optional[int] = None
    database_name: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None

class DatabaseConnection(DatabaseConnectionBase):
    id: int
    user_id: int
    status: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Query schemas
class QueryExecute(BaseModel):
    database_id: int
    query: str
    limit: Optional[int] = 1000

class QueryResult(BaseModel):
    success: bool
    data: List[Dict[str, Any]]
    columns: List[Dict[str, str]]
    row_count: int
    execution_time: int
    error: Optional[str] = None

class QueryHistoryItem(BaseModel):
    id: int
    query: str
    execution_time: Optional[int]
    row_count: Optional[int]
    status: str
    executed_at: datetime

# Dashboard schemas
class ChartConfig(BaseModel):
    type: ChartType
    title: str
    query: str
    database_id: int
    config: Dict[str, Any]

class DashboardCreate(BaseModel):
    name: str
    description: Optional[str] = None
    charts: List[ChartConfig]

class DashboardUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    charts: Optional[List[ChartConfig]] = None

class Dashboard(BaseModel):
    id: int
    user_id: int
    name: str
    description: Optional[str]
    charts: List[ChartConfig]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Table info schemas
class ColumnInfo(BaseModel):
    name: str
    type: str
    nullable: bool
    primary_key: bool = False
    unique: bool = False
    default_value: Optional[str] = None

class TableInfo(BaseModel):
    name: str
    row_count: int
    columns: List[ColumnInfo]

# Auth schemas
class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

class ConnectionTestResult(BaseModel):
    success: bool
    message: str
    latency: Optional[int] = None
    error: Optional[str] = None
