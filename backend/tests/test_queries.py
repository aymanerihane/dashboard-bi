from fastapi.testclient import TestClient
from app.main import app
from app.models.query import Query
from app.schemas.query import QueryCreate, QueryResponse

client = TestClient(app)

def test_create_query():
    query_data = {"sql": "SELECT * FROM users;", "description": "Fetch all users"}
    response = client.post("/api/v1/queries/", json=query_data)
    assert response.status_code == 201
    assert response.json()["sql"] == query_data["sql"]
    assert response.json()["description"] == query_data["description"]

def test_get_query():
    query_data = {"sql": "SELECT * FROM users;", "description": "Fetch all users"}
    create_response = client.post("/api/v1/queries/", json=query_data)
    query_id = create_response.json()["id"]

    response = client.get(f"/api/v1/queries/{query_id}")
    assert response.status_code == 200
    assert response.json()["sql"] == query_data["sql"]
    assert response.json()["description"] == query_data["description"]

def test_get_nonexistent_query():
    response = client.get("/api/v1/queries/999")
    assert response.status_code == 404

def test_execute_query():
    query_data = {"sql": "SELECT * FROM users;", "description": "Fetch all users"}
    create_response = client.post("/api/v1/queries/", json=query_data)
    query_id = create_response.json()["id"]

    response = client.post(f"/api/v1/queries/{query_id}/execute")
    assert response.status_code == 200
    assert "results" in response.json()  # Assuming the response contains results key

def test_execute_invalid_query():
    invalid_query_data = {"sql": "INVALID SQL", "description": "Invalid query"}
    response = client.post("/api/v1/queries/", json=invalid_query_data)
    query_id = response.json()["id"]

    response = client.post(f"/api/v1/queries/{query_id}/execute")
    assert response.status_code == 400  # Assuming invalid queries return 400 status code