from pydantic import BaseModel, constr, validator

class UserCreate(BaseModel):
    username: constr(min_length=3, max_length=50)
    email: constr(regex=r'^[\w\.-]+@[\w\.-]+\.\w+$')
    password: constr(min_length=8)

    @validator('username')
    def username_must_not_contain_spaces(cls, v):
        if ' ' in v:
            raise ValueError('Username must not contain spaces')
        return v

class UserUpdate(BaseModel):
    username: constr(min_length=3, max_length=50) = None
    email: constr(regex=r'^[\w\.-]+@[\w\.-]+\.\w+$') = None

class ConnectionCreate(BaseModel):
    name: constr(min_length=1, max_length=100)
    host: constr(min_length=1, max_length=100)
    port: int
    database: constr(min_length=1, max_length=100)
    username: constr(min_length=1, max_length=100)
    password: constr(min_length=8)

class QueryExecute(BaseModel):
    query: constr(min_length=1)

class QueryLog(BaseModel):
    id: int
    query: str
    executed_at: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: str | None = None