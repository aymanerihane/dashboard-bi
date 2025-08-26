# Frontend-Backend Integration Guide

This guide explains how to integrate the Next.js frontend with the FastAPI backend for the Database Dashboard application.

## 🔄 Integration Overview

The application follows a client-server architecture where:
- **Frontend (Next.js)**: Handles UI, user interactions, and API consumption
- **Backend (FastAPI)**: Manages database connections, authentication, and data processing
- **Communication**: RESTful API with JSON payloads and JWT authentication

## 🚀 Quick Start Integration

### 1. Start Backend Server
\`\`\`bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
\`\`\`

### 2. Configure Frontend API URL
\`\`\`bash
# frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:8000/api
\`\`\`

### 3. Start Frontend Server
\`\`\`bash
cd frontend
npm run dev
\`\`\`

### 4. Verify Integration
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/docs (Swagger UI)
- Health Check: http://localhost:8000/health

## 🔗 API Client Configuration

### Frontend API Client (`lib/api.ts`)
\`\`\`typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

class ApiClient {
  private baseURL: string
  private token: string | null = null

  constructor() {
    this.baseURL = API_BASE_URL
    this.loadToken()
  }

  // Automatic token management
  private loadToken() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token')
    }
  }

  // Request interceptor with auth headers
  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseURL}${endpoint}`
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }

    const response = await fetch(url, { ...options, headers })
    
    if (response.status === 401) {
      // Token expired, redirect to login
      this.clearToken()
      window.location.href = '/login'
      return
    }

    return response
  }
}
\`\`\`

## 🔐 Authentication Integration

### Login Flow
1. **Frontend**: User submits credentials
2. **API Call**: `POST /api/auth/login`
3. **Backend**: Validates credentials, returns JWT
4. **Frontend**: Stores token, updates auth context
5. **Redirect**: Navigate to dashboard

\`\`\`typescript
// Frontend login implementation
const login = async (email: string, password: string) => {
  try {
    const response = await apiClient.login({ email, password })
    const { access_token, user } = response
    
    // Store token
    localStorage.setItem('auth_token', access_token)
    
    // Update auth context
    setUser(user)
    setIsAuthenticated(true)
    
    // Redirect to dashboard
    router.push('/dashboard')
  } catch (error) {
    setError('Invalid credentials')
  }
}
\`\`\`

### Protected Routes
\`\`\`typescript
// Frontend auth guard
const useAuthGuard = () => {
  const { isAuthenticated, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, loading, router])

  return { isAuthenticated, loading }
}
\`\`\`

## 🗄️ Database Connection Integration

### Connection Management Flow
1. **Frontend**: User fills connection form
2. **API Call**: `POST /api/databases`
3. **Backend**: Validates and stores connection
4. **Response**: Returns connection with status
5. **Frontend**: Updates connection list

\`\`\`typescript
// Frontend connection creation
const createConnection = async (connectionData: DatabaseConnection) => {
  try {
    setLoading(true)
    const response = await apiClient.createConnection(connectionData)
    
    // Update local state
    setConnections(prev => [...prev, response])
    
    // Show success message
    toast.success('Connection created successfully')
    
    // Close form
    setShowForm(false)
  } catch (error) {
    toast.error('Failed to create connection')
  } finally {
    setLoading(false)
  }
}
\`\`\`

### Connection Testing
\`\`\`typescript
// Real-time connection testing
const testConnection = async (connectionId: string) => {
  try {
    setTesting(true)
    const result = await apiClient.testConnection(connectionId)
    
    if (result.success) {
      toast.success('Connection successful')
      // Update connection status
      updateConnectionStatus(connectionId, 'connected')
    } else {
      toast.error(`Connection failed: ${result.error}`)
      updateConnectionStatus(connectionId, 'failed')
    }
  } catch (error) {
    toast.error('Connection test failed')
  } finally {
    setTesting(false)
  }
}
\`\`\`

## 📊 Query Execution Integration

### Query Flow
1. **Frontend**: User writes SQL query
2. **API Call**: `POST /api/queries/execute`
3. **Backend**: Executes query on selected database
4. **Response**: Returns results or error
5. **Frontend**: Displays results in table/chart

\`\`\`typescript
// Frontend query execution
const executeQuery = async (query: string, connectionId: string) => {
  try {
    setExecuting(true)
    const response = await apiClient.executeQuery({
      query,
      connection_id: connectionId,
      limit: 1000 // Optional result limit
    })
    
    // Update results
    setQueryResults(response.data)
    setColumns(response.columns)
    
    // Add to history
    addToHistory({ query, timestamp: new Date(), results: response.data.length })
    
  } catch (error) {
    setError(error.message)
  } finally {
    setExecuting(false)
  }
}
\`\`\`

## 📈 Dashboard Integration

### Dashboard Creation Flow
1. **Frontend**: User creates charts from query results
2. **API Call**: `POST /api/dashboards`
3. **Backend**: Saves dashboard configuration
4. **Response**: Returns dashboard with ID
5. **Frontend**: Updates dashboard list

\`\`\`typescript
// Frontend dashboard management
const saveDashboard = async (dashboardData: Dashboard) => {
  try {
    const response = await apiClient.createDashboard({
      name: dashboardData.name,
      description: dashboardData.description,
      charts: dashboardData.charts.map(chart => ({
        type: chart.type,
        query: chart.query,
        connection_id: chart.connectionId,
        config: chart.config
      }))
    })
    
    // Update local state
    setDashboards(prev => [...prev, response])
    
    toast.success('Dashboard saved successfully')
  } catch (error) {
    toast.error('Failed to save dashboard')
  }
}
\`\`\`

## 🔄 Real-time Data Updates

### WebSocket Integration (Optional)
\`\`\`typescript
// Frontend WebSocket connection
const useWebSocket = (connectionId: string) => {
  const [socket, setSocket] = useState<WebSocket | null>(null)

  useEffect(() => {
    const ws = new WebSocket(`ws://localhost:8000/ws/${connectionId}`)
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      // Update dashboard data
      updateDashboardData(data)
    }
    
    setSocket(ws)
    
    return () => ws.close()
  }, [connectionId])

  return socket
}
\`\`\`

## 🛠️ Development Tools

### API Testing with Swagger
- Access Swagger UI: http://localhost:8000/docs
- Test endpoints directly
- View request/response schemas
- Generate API client code

### Frontend Development Tools
\`\`\`typescript
// Debug API calls
console.log('[v0] API Request:', { endpoint, payload })
console.log('[v0] API Response:', response)

// Monitor auth state
console.log('[v0] Auth State:', { isAuthenticated, user, token })

// Track query execution
console.log('[v0] Query Execution:', { query, results, duration })
\`\`\`

## 🐛 Common Integration Issues

### CORS Issues
**Problem**: Frontend can't access backend API
**Solution**: Configure CORS in backend
\`\`\`python
# backend/app/main.py
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
\`\`\`

### Authentication Issues
**Problem**: Token not being sent with requests
**Solution**: Check API client configuration
\`\`\`typescript
// Ensure token is included in headers
headers['Authorization'] = `Bearer ${this.token}`
\`\`\`

### Database Connection Issues
**Problem**: Backend can't connect to database
**Solution**: Verify database configuration and network access
\`\`\`python
# Check database URL format
DATABASE_URL = "postgresql://user:password@localhost:5432/dbname"
\`\`\`

## 📋 Integration Checklist

### Backend Setup ✅
- [ ] FastAPI server running on port 8000
- [ ] Database connections configured
- [ ] CORS middleware enabled
- [ ] JWT authentication working
- [ ] API endpoints responding

### Frontend Setup ✅
- [ ] Next.js server running on port 3000
- [ ] API_URL environment variable set
- [ ] API client configured
- [ ] Authentication context working
- [ ] Protected routes implemented

### Integration Testing ✅
- [ ] Login/logout flow working
- [ ] Database connections can be created/tested
- [ ] Queries execute successfully
- [ ] Results display correctly
- [ ] Dashboards save and load
- [ ] Error handling works properly

## 🚀 Production Deployment

### Environment Configuration
\`\`\`bash
# Production backend
DATABASE_URL=postgresql://user:pass@prod-db:5432/dashboard
SECRET_KEY=production-secret-key
CORS_ORIGINS=["https://yourdomain.com"]

# Production frontend
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api
\`\`\`

### Health Checks
\`\`\`typescript
// Frontend health check
const checkBackendHealth = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`)
    return response.ok
  } catch {
    return false
  }
}
\`\`\`

This integration guide ensures seamless communication between your Next.js frontend and FastAPI backend, providing a robust full-stack database dashboard application.
