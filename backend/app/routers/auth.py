from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr
from app.core.config import settings
from app.core.database import get_db

router = APIRouter(prefix="/api/auth", tags=["authentication"])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str = "user"

class LoginResponse(BaseModel):
    success: bool
    token: str
    user: UserResponse

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

@router.post("/login", response_model=LoginResponse)
async def login(user_credentials: UserLogin, db: Session = Depends(get_db)):
    # TODO: Implement user authentication with database
    # For now, return mock response
    token = create_access_token(data={"sub": user_credentials.email})
    return LoginResponse(
        success=True,
        token=token,
        user=UserResponse(
            id="1",
            email=user_credentials.email,
            name="John Doe",
            role="admin"
        )
    )

@router.post("/register")
async def register(user: UserCreate, db: Session = Depends(get_db)):
    # TODO: Implement user registration with database
    hashed_password = get_password_hash(user.password)
    return {"success": True, "message": "User registered successfully"}

@router.get("/me", response_model=UserResponse)
async def get_current_user(token: str = Depends(oauth2_scheme)):
    # TODO: Implement token verification and user lookup
    return UserResponse(
        id="1",
        email="user@example.com",
        name="John Doe",
        role="admin"
    )
