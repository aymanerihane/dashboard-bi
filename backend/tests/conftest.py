import pytest
from fastapi.testclient import TestClient
from app.main import app

@pytest.fixture(scope="module")
def test_client():
    client = TestClient(app)
    yield client

@pytest.fixture(scope="function")
def setup_database():
    # Setup code for database (e.g., create test database, tables, etc.)
    yield
    # Teardown code for database (e.g., drop test database, tables, etc.)