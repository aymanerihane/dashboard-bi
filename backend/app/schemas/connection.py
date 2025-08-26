from pydantic import BaseModel, Field
from typing import Optional

class ConnectionBase(BaseModel):
    name: str = Field(..., description="The name of the database connection")
    host: str = Field(..., description="The host of the database")
    port: int = Field(..., description="The port of the database")
    username: str = Field(..., description="The username for the database")
    password: str = Field(..., description="The password for the database")
    database: str = Field(..., description="The name of the database")

class ConnectionCreate(ConnectionBase):
    pass

class ConnectionUpdate(ConnectionBase):
    name: Optional[str] = Field(None, description="The new name of the database connection")

class Connection(ConnectionBase):
    id: int = Field(..., description="The unique identifier of the connection")

    class Config:
        orm_mode = True