# Database Connection API Testing Guide

This guide provides comprehensive instructions for testing the database connection functionality in the Dashboard BI application.

## 🧪 API Endpoints to Test

### 1. Authentication (Required First)
Before testing database endpoints, you need to authenticate:

#### POST `/api/auth/login`
```json
{
  "email": "admin@example.com",
  "password": "admin123"
}
```

**Expected Response:**
```json
{
  "success": true,
  "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": "1",
    "email": "admin@example.com",
    "name": "Administrator",
    "role": "admin"
  }
}
```

### 2. List Database Connections

#### GET `/api/databases/`
**Headers:** `Authorization: Bearer <token>`

**Expected Response:**
```json
[
  {
    "id": 1,
    "name": "Test PostgreSQL",
    "db_type": "postgresql",
    "host": "localhost",
    "port": 5432,
    "database_name": "testdb",
    "username": "postgres",
    "status": "disconnected",
    "user_id": 1,
    "created_at": "2025-08-26T10:00:00Z",
    "updated_at": "2025-08-26T10:00:00Z"
  }
]
```

### 3. Create Database Connection

#### POST `/api/databases/`
**Headers:** `Authorization: Bearer <token>`

**Request Body (PostgreSQL):**
```json
{
  "name": "My PostgreSQL DB",
  "db_type": "postgresql",
  "host": "localhost",
  "port": 5432,
  "database_name": "postgres",
  "username": "postgres",
  "password": "password"
}
```

**Request Body (MySQL):**
```json
{
  "name": "My MySQL DB",
  "db_type": "mysql", 
  "host": "localhost",
  "port": 3306,
  "database_name": "mysql",
  "username": "root",
  "password": "password"
}
```

**Request Body (SQLite):**
```json
{
  "name": "My SQLite DB",
  "db_type": "sqlite",
  "database_name": "/path/to/database.db"
}
```

**Expected Response:**
```json
{
  "id": 2,
  "name": "My PostgreSQL DB",
  "db_type": "postgresql",
  "host": "localhost",
  "port": 5432,
  "database_name": "postgres",
  "username": "postgres",
  "status": "disconnected",
  "user_id": 1,
  "created_at": "2025-08-26T10:15:00Z",
  "updated_at": "2025-08-26T10:15:00Z"
}
```

### 4. Test Database Connection

#### POST `/api/databases/{connection_id}/test`
**Headers:** `Authorization: Bearer <token>`

**Example:** `POST /api/databases/1/test`

**Expected Response (Success):**
```json
{
  "success": true,
  "message": "Connection successful",
  "latency": 45
}
```

**Expected Response (Failure):**
```json
{
  "success": false,
  "message": "Connection failed",
  "error": "FATAL: password authentication failed for user \"postgres\""
}
```

### 5. Update Database Connection

#### PUT `/api/databases/{connection_id}`
**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "Updated PostgreSQL DB",
  "host": "new-host.com",
  "port": 5433
}
```

### 6. Delete Database Connection

#### DELETE `/api/databases/{connection_id}`
**Headers:** `Authorization: Bearer <token>`

**Expected Response:**
```json
{
  "message": "Connection deleted successfully"
}
```

## 🔧 Testing with Frontend UI

### Access the Connection Test Interface

1. **Login:** Use the authentication form with demo credentials:
   - Email: `admin@example.com`
   - Password: `admin123`

2. **Navigate to Connection Test:** 
   - After login, click on the "Connection Test" tab
   - This provides a full UI for testing all database operations

### Test Scenarios

#### Scenario 1: Create and Test PostgreSQL Connection
1. Click "Add Connection"
2. Fill in form:
   - **Name:** "Test PostgreSQL"
   - **Database Type:** "PostgreSQL"
   - **Host:** "localhost"
   - **Port:** "5432"
   - **Database Name:** "postgres"
   - **Username:** "postgres"
   - **Password:** "your_password"
3. Click "Create Connection"
4. Click "Test" button on the created connection
5. Verify status changes to "Connected" or "Error"

#### Scenario 2: Create and Test MySQL Connection
1. Click "Add Connection"
2. Fill in form:
   - **Name:** "Test MySQL"
   - **Database Type:** "MySQL"
   - **Host:** "localhost"
   - **Port:** "3306"
   - **Database Name:** "mysql"
   - **Username:** "root"
   - **Password:** "your_password"
3. Click "Create Connection"
4. Click "Test" button
5. Verify connection status

#### Scenario 3: Create and Test SQLite Connection
1. Click "Add Connection"
2. Fill in form:
   - **Name:** "Test SQLite"
   - **Database Type:** "SQLite"
   - **Database File Path:** "/tmp/test.db" (or valid path)
3. Click "Create Connection"
4. Click "Test" button
5. Verify connection status

#### Scenario 4: Test Connection Failures
1. Create a connection with invalid credentials
2. Test the connection
3. Verify error message is displayed
4. Status should show "Error"

#### Scenario 5: Edit Connection
1. Click "Edit" on an existing connection
2. Modify some fields
3. Click "Update Connection"
4. Verify changes are saved
5. Test the updated connection

#### Scenario 6: Delete Connection
1. Click "Delete" on a connection
2. Confirm deletion
3. Verify connection is removed from list

## 🐛 Expected Behaviors

### Success Cases
- ✅ Authentication returns valid JWT token
- ✅ Token is stored in localStorage as `auth-token`
- ✅ User is redirected to dashboard after login
- ✅ Database connections are listed correctly
- ✅ New connections can be created
- ✅ Valid connections test successfully
- ✅ Connection status updates after testing
- ✅ Connections can be edited and deleted
- ✅ UI shows loading states during operations

### Error Cases
- ❌ Invalid login credentials show error message
- ❌ Invalid database credentials fail connection test
- ❌ Missing required fields prevent form submission
- ❌ Network errors are handled gracefully
- ❌ Unauthorized requests return 401 errors

## 🔍 Debugging Tips

### Frontend Debugging
1. **Open Browser DevTools (F12)**
2. **Check Console for errors**
3. **Monitor Network tab for API requests**
4. **Verify localStorage contains `auth-token`**
5. **Check API responses for error details**

### Backend Debugging
1. **Check FastAPI logs in terminal**
2. **Verify database credentials are correct**
3. **Ensure database services are running**
4. **Check if ports are accessible**

### Common Issues
- **CORS errors:** Check backend CORS configuration
- **Token expired:** Re-login to get new token
- **Database connection failed:** Verify database is running and credentials are correct
- **Port conflicts:** Ensure database ports are not blocked

## 📋 Test Checklist

- [ ] Login with valid credentials
- [ ] Login with invalid credentials (should fail)
- [ ] Token stored in localStorage
- [ ] Redirect to dashboard after login
- [ ] Load existing connections
- [ ] Create PostgreSQL connection
- [ ] Create MySQL connection  
- [ ] Create SQLite connection
- [ ] Test valid connection (should succeed)
- [ ] Test invalid connection (should fail)
- [ ] Edit existing connection
- [ ] Delete connection
- [ ] Logout and verify token cleared
- [ ] UI shows appropriate loading states
- [ ] Error messages display correctly
- [ ] Success messages display correctly

## 🚀 Next Steps

After basic connection testing works:
1. **Test schema exploration** - Load tables and columns
2. **Test query execution** - Run SQL queries
3. **Test dashboard creation** - Create visualizations
4. **Test data export** - Export query results

This comprehensive testing ensures the authentication and database connection functionality works correctly before proceeding to more advanced features.
