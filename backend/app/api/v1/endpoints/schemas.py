from pydantic import BaseModel
from typing import List, Optional

class UserBase(BaseModel):
    username: str
    email: str

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int

    class Config:
        orm_mode = True

class ConnectionBase(BaseModel):
    name: str
    host: str
    port: int
    database: str
    username: str
    password: str

class ConnectionCreate(ConnectionBase):
    pass

class ConnectionResponse(ConnectionBase):
    id: int

    class Config:
        orm_mode = True

class QueryBase(BaseModel):
    sql: str

class QueryCreate(QueryBase):
    pass

class QueryResponse(QueryBase):
    id: int
    executed_at: str

    class Config:
        orm_mode = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: str | None = None