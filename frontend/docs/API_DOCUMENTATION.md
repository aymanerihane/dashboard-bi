# API Documentation

This document describes the API endpoints and data structures used in the Database Dashboard application.

## 🔐 Authentication

All API endpoints require authentication except for login and registration.

### Headers
\`\`\`
Authorization: Bearer <jwt_token>
Content-Type: application/json
\`\`\`

## 📋 Endpoints

### Authentication

#### POST /api/auth/login
Login with email and password.

**Request Body:**
\`\`\`json
{
  "email": "user@example.com",
  "password": "password123"
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "1",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "admin"
  }
}
\`\`\`

#### POST /api/auth/register
Register a new user account.

**Request Body:**
\`\`\`json
{
  "name": "John Doe",
  "email": "user@example.com",
  "password": "password123"
}
\`\`\`

#### GET /api/auth/me
Get current user information.

**Response:**
\`\`\`json
{
  "id": "1",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "admin"
}
\`\`\`

### Database Connections

#### GET /api/databases
List all database connections for the current user.

**Response:**
\`\`\`json
{
  "databases": [
    {
      "id": "1",
      "name": "Production DB",
      "type": "postgresql",
      "host": "localhost",
      "port": 5432,
      "database": "myapp",
      "username": "admin",
      "status": "connected",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
\`\`\`

#### POST /api/databases
Create a new database connection.

**Request Body:**
\`\`\`json
{
  "name": "My Database",
  "type": "postgresql",
  "host": "localhost",
  "port": 5432,
  "database": "mydb",
  "username": "user",
  "password": "password"
}
\`\`\`

#### PUT /api/databases/:id
Update an existing database connection.

#### DELETE /api/databases/:id
Delete a database connection.

#### POST /api/databases/:id/test
Test a database connection.

**Response:**
\`\`\`json
{
  "success": true,
  "message": "Connection successful",
  "latency": 45
}
\`\`\`

### Schema Operations

#### GET /api/databases/:id/tables
Get all tables in a database.

**Response:**
\`\`\`json
{
  "tables": [
    {
      "name": "users",
      "rowCount": 1250,
      "columns": [
        {
          "name": "id",
          "type": "integer",
          "nullable": false,
          "primaryKey": true
        },
        {
          "name": "email",
          "type": "varchar",
          "nullable": false,
          "unique": true
        }
      ]
    }
  ]
}
\`\`\`

#### GET /api/databases/:id/tables/:table
Get detailed information about a specific table.

#### GET /api/databases/:id/tables/:table/data
Get sample data from a table.

**Query Parameters:**
- `limit`: Number of rows (default: 10)
- `offset`: Starting row (default: 0)

### Query Execution

#### POST /api/query
Execute a SQL query.

**Request Body:**
\`\`\`json
{
  "databaseId": "1",
  "query": "SELECT * FROM users LIMIT 10",
  "parameters": []
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "email": "user@example.com",
      "name": "John Doe"
    }
  ],
  "columns": [
    {"name": "id", "type": "integer"},
    {"name": "email", "type": "varchar"},
    {"name": "name", "type": "varchar"}
  ],
  "rowCount": 1,
  "executionTime": 23
}
\`\`\`

#### GET /api/query/history
Get query execution history.

**Response:**
\`\`\`json
{
  "history": [
    {
      "id": "1",
      "query": "SELECT COUNT(*) FROM users",
      "executedAt": "2024-01-01T12:00:00Z",
      "executionTime": 15,
      "rowCount": 1
    }
  ]
}
\`\`\`

### Dashboard Management

#### GET /api/dashboards
Get all dashboards for the current user.

#### POST /api/dashboards
Create a new dashboard.

**Request Body:**
\`\`\`json
{
  "name": "Sales Dashboard",
  "description": "Monthly sales analytics",
  "charts": [
    {
      "type": "bar",
      "title": "Sales by Region",
      "query": "SELECT region, SUM(amount) FROM sales GROUP BY region",
      "config": {
        "xAxis": "region",
        "yAxis": "sum",
        "color": "emerald"
      }
    }
  ]
}
\`\`\`

#### PUT /api/dashboards/:id
Update a dashboard.

#### DELETE /api/dashboards/:id
Delete a dashboard.

## 📊 Data Types

### DatabaseConfig
\`\`\`typescript
interface DatabaseConfig {
  id: string
  name: string
  type: 'postgresql' | 'mysql' | 'sqlite'
  host?: string
  port?: number
  database: string
  username?: string
  password?: string
  status: 'connected' | 'disconnected' | 'error'
  createdAt: string
  updatedAt: string
}
\`\`\`

### TableInfo
\`\`\`typescript
interface TableInfo {
  name: string
  rowCount: number
  columns: ColumnInfo[]
  indexes: IndexInfo[]
  foreignKeys: ForeignKeyInfo[]
}
\`\`\`

### ColumnInfo
\`\`\`typescript
interface ColumnInfo {
  name: string
  type: string
  nullable: boolean
  primaryKey: boolean
  unique: boolean
  defaultValue?: string
  comment?: string
}
\`\`\`

### QueryResult
\`\`\`typescript
interface QueryResult {
  success: boolean
  data: Record<string, any>[]
  columns: ColumnInfo[]
  rowCount: number
  executionTime: number
  error?: string
}
\`\`\`

### ChartConfig
\`\`\`typescript
interface ChartConfig {
  type: 'bar' | 'line' | 'area' | 'pie'
  title: string
  query: string
  config: {
    xAxis: string
    yAxis: string
    color: string
    aggregation?: 'sum' | 'count' | 'avg' | 'max' | 'min'
  }
}
\`\`\`

## 🚨 Error Responses

All endpoints return errors in the following format:

\`\`\`json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid email or password",
    "details": {}
  }
}
\`\`\`

### Common Error Codes

- `INVALID_CREDENTIALS`: Authentication failed
- `UNAUTHORIZED`: Missing or invalid token
- `FORBIDDEN`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `VALIDATION_ERROR`: Invalid request data
- `DATABASE_ERROR`: Database operation failed
- `CONNECTION_ERROR`: Database connection failed

## 🔧 Rate Limiting

API endpoints are rate limited to prevent abuse:

- Authentication: 5 requests per minute
- Query execution: 30 requests per minute
- Other endpoints: 100 requests per minute

Rate limit headers are included in responses:
\`\`\`
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
\`\`\`

## 📝 Request/Response Examples

### Complete Query Execution Flow

1. **Login**
\`\`\`bash
curl -X POST /api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'
\`\`\`

2. **List Databases**
\`\`\`bash
curl -X GET /api/databases \
  -H "Authorization: Bearer <token>"
\`\`\`

3. **Execute Query**
\`\`\`bash
curl -X POST /api/query \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "databaseId": "1",
    "query": "SELECT * FROM users LIMIT 5"
  }'
\`\`\`

4. **Create Dashboard**
\`\`\`bash
curl -X POST /api/dashboards \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "User Analytics",
    "charts": [{
      "type": "bar",
      "title": "Users by Role",
      "query": "SELECT role, COUNT(*) FROM users GROUP BY role"
    }]
  }'
