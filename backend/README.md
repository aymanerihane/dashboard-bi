# Database Dashboard Backend

This is the backend for the Database Dashboard application built using FastAPI. The project provides a RESTful API for managing database connections, executing queries, and handling user authentication.

## Project Structure

```
backend/
├── app/                     # Main application package
│   ├── __init__.py         # Initializes the app package
│   ├── main.py             # Entry point of the FastAPI application
│   ├── api/                # API package
│   │   ├── __init__.py     # Initializes the api package
│   │   ├── deps.py         # Dependency functions for API endpoints
│   │   └── v1/             # Version 1 of the API
│   │       ├── __init__.py # Initializes the v1 API version package
│   │       ├── api.py      # Registers the API routes for version 1
│   │       └── endpoints/   # API endpoints
│   │           ├── __init__.py # Initializes the endpoints package
│   │           ├── auth.py  # Authentication endpoints
│   │           ├── connections.py # Database connection endpoints
│   │           ├── queries.py # SQL query execution endpoints
│   │           └── schemas.py # Pydantic models for request/response
│   ├── core/               # Core functionalities
│   │   ├── __init__.py     # Initializes the core package
│   │   ├── config.py       # Configuration settings
│   │   ├── security.py     # Security features (JWT, password hashing)
│   │   └── database.py     # Database connection management
│   ├── models/             # Database models
│   │   ├── __init__.py     # Initializes the models package
│   │   ├── user.py         # User model
│   │   ├── connection.py    # Connection model
│   │   └── query.py        # Query model
│   ├── schemas/            # Pydantic schemas
│   │   ├── __init__.py     # Initializes the schemas package
│   │   ├── user.py         # User-related schemas
│   │   ├── connection.py    # Connection-related schemas
│   │   ├── query.py        # Query-related schemas
│   │   └── token.py        # JWT token schemas
│   ├── services/           # Business logic services
│   │   ├── __init__.py     # Initializes the services package
│   │   ├── auth_service.py  # Authentication logic
│   │   ├── database_service.py # Database connection logic
│   │   └── query_service.py # SQL query handling logic
│   └── utils/              # Utility functions
│       ├── __init__.py     # Initializes the utils package
│       ├── encryption.py    # Encryption utilities
│       └── validators.py    # Input validation utilities
├── alembic/                # Database migrations
│   ├── versions/           # Migration scripts
│   ├── env.py              # Alembic configuration
│   ├── script.py.mako      # Migration script template
│   └── alembic.ini         # Alembic configuration file
├── tests/                  # Test suite
│   ├── __init__.py         # Initializes the tests package
│   ├── conftest.py         # pytest configuration
│   ├── test_auth.py        # Tests for authentication
│   ├── test_connections.py  # Tests for database connections
│   └── test_queries.py      # Tests for query execution
├── requirements.txt        # Project dependencies
├── pyproject.toml         # Project metadata
├── .env.example            # Example environment variables
├── .gitignore              # Files to ignore in version control
├── Dockerfile              # Docker image instructions
└── README.md               # Project documentation
```

## Key Features

- User authentication with JWT tokens.
- Management of database connections.
- Execution of SQL queries with logging.
- Pydantic schemas for data validation.
- Dependency injection for API endpoints.

## Setup Instructions

1. Clone the repository:
   ```
   git clone <repository-url>
   cd backend
   ```

2. Create a virtual environment and activate it:
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows use `venv\Scripts\activate`
   ```

3. Install the required dependencies:
   ```
   pip install -r requirements.txt
   ```

4. Set up environment variables by copying `.env.example` to `.env` and updating the values as needed.

5. Run the application:
   ```
   uvicorn app.main:app --reload
   ```

## Frontend Integration

The backend API is designed to be consumed by the frontend application. The following endpoints are available:

- **Authentication**: `/api/v1/auth/login`, `/api/v1/auth/register`
- **Connections**: `/api/v1/connections`
- **Queries**: `/api/v1/queries`

Refer to the API documentation for detailed usage and examples.