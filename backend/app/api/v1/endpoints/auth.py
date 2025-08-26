from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api.deps import get_db
from app.schemas.user import UserCreate, UserResponse
from app.schemas.token import Token
from app.services.auth_service import AuthService

router = APIRouter()
auth_service = AuthService()

@router.post("/register", response_model=UserResponse)
def register(user: UserCreate, db: Session = Depends(get_db)):
    if auth_service.user_exists(user.email, db):
        raise HTTPException(status_code=400, detail="Email already registered")
    return auth_service.register_user(user, db)

@router.post("/login", response_model=Token)
def login(user: UserCreate, db: Session = Depends(get_db)):
    token = auth_service.authenticate_user(user.email, user.password, db)
    if not token:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return token