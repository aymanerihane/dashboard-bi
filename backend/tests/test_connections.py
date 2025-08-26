from fastapi.testclient import TestClient
from app.main import app
from app.models.connection import Connection
from app.schemas.connection import ConnectionCreate, ConnectionResponse

client = TestClient(app)

def test_create_connection():
    connection_data = {
        "name": "Test Connection",
        "host": "localhost",
        "port": 5432,
        "username": "test_user",
        "password": "test_password",
        "database": "test_db"
    }
    response = client.post("/api/v1/connections/", json=connection_data)
    assert response.status_code == 201
    assert response.json()["name"] == connection_data["name"]

def test_get_connections():
    response = client.get("/api/v1/connections/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_get_connection_by_id():
    connection_id = 1  # Assuming this ID exists
    response = client.get(f"/api/v1/connections/{connection_id}")
    assert response.status_code == 200
    assert "name" in response.json()

def test_update_connection():
    connection_id = 1  # Assuming this ID exists
    updated_data = {
        "name": "Updated Connection",
        "host": "localhost",
        "port": 5432,
        "username": "updated_user",
        "password": "updated_password",
        "database": "updated_db"
    }
    response = client.put(f"/api/v1/connections/{connection_id}", json=updated_data)
    assert response.status_code == 200
    assert response.json()["name"] == updated_data["name"]

def test_delete_connection():
    connection_id = 1  # Assuming this ID exists
    response = client.delete(f"/api/v1/connections/{connection_id}")
    assert response.status_code == 204

def test_create_connection_invalid_data():
    invalid_data = {
        "name": "",
        "host": "localhost",
        "port": "not_a_number",
        "username": "test_user",
        "password": "test_password",
        "database": "test_db"
    }
    response = client.post("/api/v1/connections/", json=invalid_data)
    assert response.status_code == 422  # Unprocessable Entity for validation errors