from pydantic import BaseModel
from typing import Optional, List

class QueryBase(BaseModel):
    query: str
    description: Optional[str] = None

class QueryCreate(QueryBase):
    pass

class Query(QueryBase):
    id: int

    class Config:
        orm_mode = True

class QueryResponse(BaseModel):
    queries: List[Query]