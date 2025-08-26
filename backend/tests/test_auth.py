from fastapi.testclient import TestClient
from app.main import app
from app.models.user import User
from app.schemas.user import UserCreate
from app.services.auth_service import create_user, authenticate_user

client = TestClient(app)

def test_register_user():
    user_data = {
        "username": "testuser",
        "email": "testuser@example.com",
        "password": "testpassword"
    }
    response = client.post("/api/v1/auth/register", json=user_data)
    assert response.status_code == 201
    assert response.json()["username"] == user_data["username"]

def test_login_user():
    user_data = {
        "username": "testuser",
        "password": "testpassword"
    }
    response = client.post("/api/v1/auth/login", json=user_data)
    assert response.status_code == 200
    assert "access_token" in response.json()

def test_login_invalid_user():
    user_data = {
        "username": "invaliduser",
        "password": "wrongpassword"
    }
    response = client.post("/api/v1/auth/login", json=user_data)
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid credentials"

def test_create_user_service():
    user = UserCreate(username="newuser", email="newuser@example.com", password="newpassword")
    created_user = create_user(user)
    assert created_user.username == user.username
    assert created_user.email == user.email

def test_authenticate_user_service():
    user = authenticate_user("testuser", "testpassword")
    assert user is not None
    assert user.username == "testuser"