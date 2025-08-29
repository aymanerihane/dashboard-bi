# Dashboard BI - Developer Documentation

**Complete technical guide for developers working on the Dashboard BI platform**

---

## 🏗️ Architecture Overview

Dashboard BI is a full-stack application with clear separation between frontend and backend:

### **Technology Stack**
- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, shadcn/ui, Recharts
- **Backend**: FastAPI, Python, SQLAlchemy, JWT Authentication
- **Databases**: PostgreSQL, MySQL, SQLite
- **Deployment**: Docker, Docker Compose
- **Development**: ESLint, Prettier, Uvicorn, Hot Reload

### **Architecture Patterns**
- **Frontend**: Component-based architecture with React hooks
- **Backend**: RESTful API with dependency injection
- **Database**: Multi-database abstraction layer
- **Authentication**: JWT-based stateless authentication
- **Real-time**: WebSocket support for live updates

---

## 🚀 Development Setup

### **Prerequisites**
```bash
# Required software
Node.js >= 18.0.0
Python >= 3.9
Docker & Docker Compose
Git
```

### **1. Clone Repository**
```bash
git clone https://github.com/aymanerihane/dashboard-bi.git
cd dashboard-bi
```

### **2. Backend Setup**
```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Environment configuration
cp .env.example .env
# Edit .env with your database settings

# Run database migrations
alembic upgrade head

# Start development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### **3. Frontend Setup**
```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install
# or
pnpm install

# Environment configuration
cp .env.example .env.local
# Edit .env.local with API URL

# Start development server
npm run dev
# or
pnpm dev
```

### **4. Docker Development (Alternative)**
```bash
# Start entire stack
docker-compose up -d

# View logs
docker-compose logs -f

# Stop stack
docker-compose down
```

### **5. Verify Setup**
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

---

## 🎯 Backend Development

### **Project Structure**
```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app entry point
│   ├── auth.py              # Authentication logic
│   ├── database.py          # Database configuration
│   ├── db_manager.py        # Database operations
│   ├── schemas.py           # Pydantic models
│   ├── utils.py             # Utility functions
│   └── routers/
│       ├── __init__.py
│       ├── auth.py          # Authentication routes
│       ├── databases.py     # Database connection routes
│       ├── dashboards.py    # Dashboard management routes
│       └── queries.py       # Query execution routes
├── alembic/                 # Database migrations
├── requirements.txt         # Python dependencies
├── Dockerfile
└── .env.example
```

### **Core Components**

#### **1. FastAPI Application (`main.py`)**
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, databases, queries, dashboards

app = FastAPI(
    title="Dashboard BI API",
    description="Database visualization and analytics API",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(databases.router, prefix="/api/databases", tags=["databases"])
app.include_router(queries.router, prefix="/api/queries", tags=["queries"])
app.include_router(dashboards.router, prefix="/api/dashboards", tags=["dashboards"])

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow()}
```

#### **2. Database Manager (`db_manager.py`)**
```python
class DatabaseManager:
    def __init__(self):
        # Encryption for sensitive data
        self.cipher_key = self._generate_key()
        self.cipher = Fernet(self.cipher_key)
    
    def encrypt_password(self, password: str) -> str:
        return self.cipher.encrypt(password.encode()).decode()
    
    def decrypt_password(self, encrypted_password: str) -> str:
        return self.cipher.decrypt(encrypted_password.encode()).decode()
    
    def build_connection_string(self, connection_data: dict) -> str:
        # Dynamic connection string building for different DB types
        db_type = connection_data["db_type"]
        
        if db_type == "postgresql":
            return f"postgresql://{username}:{password}@{host}:{port}/{database}"
        elif db_type == "mysql":
            return f"mysql+pymysql://{username}:{password}@{host}:{port}/{database}"
        elif db_type == "sqlite":
            return f"sqlite:///{file_path}"
        # ... more database types
    
    async def test_connection(self, connection_data: dict) -> ConnectionTestResult:
        # Connection testing with fallback strategies
        # Try without password first, then with password
    
    async def execute_query(self, connection_data: dict, query: str, limit: int = 1000):
        # Query execution with result sanitization
        # Handles different database types and data formats
```

#### **3. Authentication (`auth.py`)**
```python
from jose import JWTError, jwt
from passlib.context import CryptContext
from datetime import datetime, timedelta

SECRET_KEY = "your-secret-key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
    # JWT token validation and user extraction
```

#### **4. Data Models (`schemas.py`)**
```python
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    name: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    role: str
    created_at: datetime
    
    class Config:
        orm_mode = True

class DatabaseConnection(BaseModel):
    id: Optional[int] = None
    name: str
    db_type: str
    host: Optional[str] = None
    port: Optional[int] = None
    database_name: str
    username: Optional[str] = None
    password: Optional[str] = None

class QueryRequest(BaseModel):
    database_id: int
    query: str
    limit: Optional[int] = 1000

class QueryResult(BaseModel):
    success: bool
    data: List[dict]
    columns: List[dict]
    row_count: int
    execution_time: int
    error: Optional[str] = None
```

### **API Endpoints**

#### **Authentication Routes**
```python
# POST /api/auth/login
@router.post("/login")
async def login(user_credentials: UserLogin, db: Session = Depends(get_db)):
    user = authenticate_user(db, user_credentials.email, user_credentials.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer", "user": user}

# POST /api/auth/register
@router.post("/register")
async def register(user: UserCreate, db: Session = Depends(get_db)):
    # User registration logic

# GET /api/auth/me
@router.get("/me")
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    return current_user
```

#### **Database Routes**
```python
# GET /api/databases
@router.get("/")
async def list_databases(current_user: User = Depends(get_current_user)):
    # Return user's database connections

# POST /api/databases
@router.post("/")
async def create_database(
    connection: DatabaseConnection,
    current_user: User = Depends(get_current_user)
):
    # Create new database connection

# POST /api/databases/{db_id}/test
@router.post("/{db_id}/test")
async def test_database_connection(db_id: int):
    # Test database connectivity

# GET /api/databases/{db_id}/tables
@router.get("/{db_id}/tables")
async def get_database_tables(db_id: int):
    # Return database schema information

# GET /api/databases/{db_id}/tables/{table_name}/data
@router.get("/{db_id}/tables/{table_name}/data")
async def get_table_data(db_id: int, table_name: str, limit: int = 10):
    # Return table data with pagination
```

#### **Query Routes**
```python
# POST /api/queries/execute
@router.post("/execute")
async def execute_query(
    query_request: QueryRequest,
    current_user: User = Depends(get_current_user)
):
    result = await db_manager.execute_query(
        connection_data, query_request.query, query_request.limit
    )
    return result

# GET /api/queries/history
@router.get("/history")
async def get_query_history(current_user: User = Depends(get_current_user)):
    # Return user's query history
```

### **Database Support**

#### **Multi-Database Architecture**
```python
class DatabaseManager:
    async def execute_query(self, connection_data: dict, query: str, limit: int = 1000):
        # Execute SQL queries for supported database types
        # SQL databases (PostgreSQL, MySQL, SQLite)
        return await self.execute_sql_query(connection_data, query, limit)
```

### **Development Guidelines**

#### **Code Style**
```python
# Use type hints
async def execute_query(self, connection_data: dict, query: str) -> Dict[str, Any]:
    pass

# Error handling
try:
    result = await operation()
    return {"success": True, "data": result}
except Exception as e:
    logger.error(f"Operation failed: {str(e)}")
    return {"success": False, "error": str(e)}

# Logging
import logging
logger = logging.getLogger(__name__)

# Environment variables
from os import getenv
DATABASE_URL = getenv("DATABASE_URL", "sqlite:///./app.db")
```

#### **Testing**
```python
# Test files in tests/ directory
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_create_database_connection():
    response = client.post(
        "/api/databases/",
        json={"name": "Test DB", "db_type": "postgresql", ...},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    assert response.json()["name"] == "Test DB"

# Run tests
pytest tests/ -v
```

---

## 🎨 Frontend Development

### **Project Structure**
```
frontend/
├── app/
│   ├── globals.css          # Global styles
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Home page
│   └── explore/
│       └── page.tsx         # Main dashboard page
├── components/
│   ├── ui/                  # shadcn/ui components
│   ├── auth/               # Authentication components
│   ├── connection-form.tsx  # Database connection form
│   ├── connection-manager.tsx # Connection management
│   ├── dashboard-visualization.tsx # Charts and dashboards
│   ├── query-interface.tsx  # SQL query interface
│   └── schema-explorer.tsx  # Database schema browser
├── contexts/
│   ├── auth-context.tsx     # Authentication state
│   └── database-connection-context.tsx # DB connection state
├── hooks/
│   ├── use-mobile.ts        # Mobile detection
│   └── use-toast.ts         # Toast notifications
├── lib/
│   ├── api.ts               # API client
│   ├── auth.ts              # Authentication utilities
│   ├── database.ts          # Database utilities
│   └── utils.ts             # General utilities
├── package.json
└── next.config.mjs
```

### **Core Components**

#### **1. API Client (`lib/api.ts`)**
```typescript
class ApiClient {
  private baseURL: string
  private token: string | null = null

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'
    this.loadToken()
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
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
      this.clearToken()
      window.location.href = '/login'
      return
    }

    return response.json()
  }

  // Authentication methods
  async login(credentials: LoginCredentials) {
    const response = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    })
    this.setToken(response.access_token)
    return response
  }

  // Database methods
  async getDatabases() {
    return this.request<DatabaseConfig[]>('/databases')
  }

  async createDatabase(data: DatabaseConnection) {
    return this.request<DatabaseConfig>('/databases', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async testConnection(id: number) {
    return this.request<ConnectionTestResult>(`/databases/${id}/test`, {
      method: 'POST',
    })
  }

  // Query methods
  async executeQuery(data: QueryRequest) {
    return this.request<QueryResult>('/queries/execute', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }
}

export const apiClient = new ApiClient()
```

#### **2. Authentication Context (`contexts/auth-context.tsx`)**
```typescript
interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const login = async (email: string, password: string) => {
    try {
      const response = await apiClient.login({ email, password })
      setUser(response.user)
      toast.success('Login successful')
      router.push('/explore')
    } catch (error) {
      toast.error('Invalid credentials')
    }
  }

  const logout = () => {
    apiClient.clearToken()
    setUser(null)
    router.push('/login')
  }

  // Auto-authenticate on app load
  useEffect(() => {
    const initAuth = async () => {
      try {
        const user = await apiClient.getCurrentUser()
        setUser(user)
      } catch (error) {
        // User not authenticated
      } finally {
        setLoading(false)
      }
    }
    initAuth()
  }, [])

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
```

#### **3. Dashboard Visualization (`components/dashboard-visualization.tsx`)**
```typescript
export const DashboardVisualization: React.FC = () => {
  const [dashboards, setDashboards] = useState<Dashboard[]>([])
  const [selectedDashboard, setSelectedDashboard] = useState<Dashboard | null>(null)
  const [showFullChart, setShowFullChart] = useState<ChartConfig | null>(null)

  // Chart rendering with Recharts
  const renderChart = (chart: ChartConfig, isFullScreen = false) => {
    const commonProps = {
      width: "100%",
      height: isFullScreen ? "calc(100vh - 96px)" : 300,
      data: chart.data,
    }

    switch (chart.type) {
      case "bar":
        return (
          <ResponsiveContainer {...commonProps}>
            <BarChart data={chart.data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={chart.xAxis} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey={chart.yAxis} fill={chart.color} />
            </BarChart>
          </ResponsiveContainer>
        )
      case "pie":
        return (
          <ResponsiveContainer {...commonProps}>
            <PieChart>
              <Pie
                data={chart.data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill={chart.color}
                label
              />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        )
      // ... more chart types
    }
  }

  // Full-screen chart mode
  const FullScreenChart = () => (
    <Dialog open={showFullChart !== null} onOpenChange={() => setShowFullChart(null)}>
      <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="w-full h-full p-4">
          {showFullChart && renderChart(showFullChart, true)}
        </div>
      </DialogContent>
    </Dialog>
  )

  return (
    <div className="space-y-6">
      {/* Dashboard grid with drag-and-drop */}
      <ResponsiveGridLayout
        onLayoutChange={handleLayoutChange}
        isDraggable={dragMode}
        isResizable={dragMode}
      >
        {selectedDashboard?.charts.map((chart) => (
          <div key={chart.id} className="dashboard-chart">
            {renderChart(chart)}
          </div>
        ))}
      </ResponsiveGridLayout>
      
      <FullScreenChart />
    </div>
  )
}
```

#### **4. Query Interface (`components/query-interface.tsx`)**
```typescript
export const QueryInterface: React.FC = () => {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<QueryResult | null>(null)
  const [executing, setExecuting] = useState(false)
  const [queryHistory, setQueryHistory] = useState<QueryHistoryItem[]>([])

  const executeQuery = async () => {
    if (!selectedConnection || !query.trim()) return

    setExecuting(true)
    try {
      const result = await apiClient.executeQuery({
        database_id: selectedConnection.id,
        query: query.trim(),
        limit: 1000
      })

      setResults(result)
      
      // Add to history
      const historyItem = {
        id: Date.now().toString(),
        query: query.trim(),
        timestamp: new Date(),
        status: result.success ? 'success' : 'error',
        executionTime: result.execution_time,
        rowCount: result.row_count
      }
      setQueryHistory(prev => [historyItem, ...prev.slice(0, 9)])

    } catch (error) {
      toast.error('Query execution failed')
    } finally {
      setExecuting(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* SQL Editor */}
      <Card>
        <CardHeader>
          <CardTitle>SQL Query Editor</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="SELECT * FROM table_name LIMIT 10;"
            className="font-mono min-h-[150px]"
            onKeyDown={(e) => {
              if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault()
                executeQuery()
              }
            }}
          />
          <div className="flex justify-between items-center mt-4">
            <div className="text-sm text-muted-foreground">
              Press Ctrl+Enter to execute
            </div>
            <Button onClick={executeQuery} disabled={executing}>
              {executing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Play className="h-4 w-4 mr-2" />}
              Execute Query
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {results && (
        <Card>
          <CardHeader>
            <CardTitle>Query Results</CardTitle>
            <CardDescription>
              {results.row_count} rows returned in {results.execution_time}ms
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-auto max-h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    {results.columns.map((col) => (
                      <TableHead key={col.name}>{col.name}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.data.map((row, index) => (
                    <TableRow key={index}>
                      {results.columns.map((col) => (
                        <TableCell key={col.name}>
                          {row[col.name]?.toString() || ''}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
```

### **State Management**

#### **React Context Pattern**
```typescript
// Database Connection Context
export const DatabaseConnectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [connections, setConnections] = useState<DatabaseConfig[]>([])
  const [selectedConnection, setSelectedConnection] = useState<DatabaseConfig | null>(null)
  const [loading, setLoading] = useState(false)

  const loadConnections = async () => {
    setLoading(true)
    try {
      const data = await apiClient.getDatabases()
      setConnections(data)
    } catch (error) {
      toast.error('Failed to load connections')
    } finally {
      setLoading(false)
    }
  }

  const createConnection = async (connectionData: DatabaseConnection) => {
    try {
      const newConnection = await apiClient.createDatabase(connectionData)
      setConnections(prev => [...prev, newConnection])
      toast.success('Connection created successfully')
    } catch (error) {
      toast.error('Failed to create connection')
    }
  }

  return (
    <DatabaseConnectionContext.Provider value={{
      connections,
      selectedConnection,
      setSelectedConnection,
      loading,
      loadConnections,
      createConnection
    }}>
      {children}
    </DatabaseConnectionContext.Provider>
  )
}
```

### **Custom Hooks**

#### **Data Fetching Hooks**
```typescript
// Custom hook for query execution
export const useQueryExecution = () => {
  const [results, setResults] = useState<QueryResult | null>(null)
  const [executing, setExecuting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const executeQuery = useCallback(async (query: string, connectionId: number) => {
    setExecuting(true)
    setError(null)
    
    try {
      const result = await apiClient.executeQuery({ database_id: connectionId, query })
      setResults(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Query execution failed')
    } finally {
      setExecuting(false)
    }
  }, [])

  return { results, executing, error, executeQuery }
}

// Custom hook for database tables
export const useTableData = (connectionId: number | null) => {
  const [tables, setTables] = useState<TableInfo[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!connectionId) return

    const loadTables = async () => {
      setLoading(true)
      try {
        const data = await apiClient.getTables(connectionId)
        setTables(data)
      } catch (error) {
        toast.error('Failed to load tables')
      } finally {
        setLoading(false)
      }
    }

    loadTables()
  }, [connectionId])

  return { tables, loading }
}
```

### **UI Components**

#### **Responsive Design**
```typescript
// Mobile-responsive hook
export const useMobile = () => {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkDevice()
    window.addEventListener('resize', checkDevice)
    return () => window.removeEventListener('resize', checkDevice)
  }, [])

  return isMobile
}

// Component usage
export const ResponsiveChart: React.FC<{ chart: ChartConfig }> = ({ chart }) => {
  const isMobile = useMobile()
  
  return (
    <div className={`w-full ${isMobile ? 'h-64' : 'h-80'}`}>
      <ResponsiveContainer width="100%" height="100%">
        {/* Chart implementation */}
      </ResponsiveContainer>
    </div>
  )
}
```

#### **Form Handling**
```typescript
// Connection form with validation
export const ConnectionForm: React.FC = () => {
  const [formData, setFormData] = useState<DatabaseConnection>({
    name: '',
    db_type: 'postgresql',
    host: 'localhost',
    port: 5432,
    database_name: '',
    username: '',
    password: ''
  })

  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<ConnectionTestResult | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate form
    if (!formData.name || !formData.database_name) {
      toast.error('Please fill in required fields')
      return
    }

    try {
      await apiClient.createDatabase(formData)
      toast.success('Connection created successfully')
      onClose()
    } catch (error) {
      toast.error('Failed to create connection')
    }
  }

  const testConnection = async () => {
    setTesting(true)
    try {
      const result = await apiClient.testConnection(formData)
      setTestResult(result)
      toast[result.success ? 'success' : 'error'](result.message)
    } catch (error) {
      toast.error('Connection test failed')
    } finally {
      setTesting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Form fields */}
    </form>
  )
}
```

### **Development Guidelines**

#### **TypeScript Best Practices**
```typescript
// Define interfaces for all data structures
interface DatabaseConfig {
  id: number
  name: string
  db_type: 'postgresql' | 'mysql' | 'sqlite'
  host?: string
  port?: number
  database_name: string
  username?: string
  status: 'connected' | 'disconnected' | 'error'
}

// Use generics for reusable components
interface DataTableProps<T> {
  data: T[]
  columns: Array<{
    key: keyof T
    label: string
    render?: (value: T[keyof T], row: T) => React.ReactNode
  }>
  onRowClick?: (row: T) => void
}

export function DataTable<T>({ data, columns, onRowClick }: DataTableProps<T>) {
  // Implementation
}

// Use strict typing for API responses
type ApiResponse<T> = {
  success: true
  data: T
} | {
  success: false
  error: string
}
```

#### **Performance Optimization**
```typescript
// Memoize expensive computations
const processedData = useMemo(() => {
  return rawData.map(item => ({
    ...item,
    computed: expensiveComputation(item)
  }))
}, [rawData])

// Debounce search inputs
const debouncedSearch = useMemo(
  () => debounce((term: string) => {
    performSearch(term)
  }, 300),
  []
)

// Virtual scrolling for large datasets
import { FixedSizeList as List } from 'react-window'

const VirtualizedTable: React.FC<{ data: any[] }> = ({ data }) => (
  <List
    height={400}
    itemCount={data.length}
    itemSize={50}
    itemData={data}
  >
    {({ index, style, data }) => (
      <div style={style}>
        {/* Row content */}
      </div>
    )}
  </List>
)
```

#### **Testing Strategy**
```typescript
// Component testing with React Testing Library
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryInterface } from './query-interface'

describe('QueryInterface', () => {
  test('executes query on button click', async () => {
    const mockExecuteQuery = jest.fn().mockResolvedValue({
      success: true,
      data: [{ id: 1, name: 'Test' }],
      columns: [{ name: 'id' }, { name: 'name' }]
    })

    render(<QueryInterface onExecuteQuery={mockExecuteQuery} />)
    
    const queryInput = screen.getByPlaceholderText(/sql query/i)
    const executeButton = screen.getByRole('button', { name: /execute/i })
    
    fireEvent.change(queryInput, { target: { value: 'SELECT * FROM users' } })
    fireEvent.click(executeButton)
    
    await waitFor(() => {
      expect(mockExecuteQuery).toHaveBeenCalledWith('SELECT * FROM users')
    })
  })
})

// API client testing
import { apiClient } from '../lib/api'

describe('ApiClient', () => {
  beforeEach(() => {
    fetchMock.resetMocks()
  })

  test('handles authentication', async () => {
    fetchMock.mockResponseOnce(JSON.stringify({
      access_token: 'test-token',
      user: { id: 1, email: 'test@example.com' }
    }))

    const result = await apiClient.login({ email: 'test@example.com', password: 'password' })
    
    expect(result.access_token).toBe('test-token')
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/auth/login'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com', password: 'password' })
      })
    )
  })
})
```

---

## 🚀 Deployment & DevOps

### **Docker Configuration**

#### **Backend Dockerfile**
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create non-root user
RUN useradd --create-home --shell /bin/bash app \
    && chown -R app:app /app
USER app

# Expose port
EXPOSE 8000

# Start application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

#### **Frontend Dockerfile**
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package.json pnpm-lock.yaml ./
RUN corepack enable pnpm && pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build application
RUN pnpm build

# Expose port
EXPOSE 3000

# Start application
CMD ["pnpm", "start"]
```

#### **Docker Compose**
```yaml
version: '3.8'

services:
  # Backend API
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/dashboard_bi
      - SECRET_KEY=your-secret-key
      - CORS_ORIGINS=["http://localhost:3000"]
    depends_on:
      - postgres
    volumes:
      - ./backend:/app
      - /app/__pycache__
    restart: unless-stopped

  # Frontend
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8000/api
    depends_on:
      - backend
    volumes:
      - ./frontend:/app
      - /app/node_modules
      - /app/.next
    restart: unless-stopped

  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=dashboard_bi
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./postgres-init:/docker-entrypoint-initdb.d
    restart: unless-stopped

volumes:
  postgres_data:
```

### **Production Deployment**

#### **Environment Configuration**
```bash
# Production .env
# Backend
DATABASE_URL=postgresql://user:password@db-host:5432/dashboard_bi_prod
SECRET_KEY=production-secret-key-256-bits
CORS_ORIGINS=["https://dashboard.yourdomain.com"]
LOG_LEVEL=INFO
SENTRY_DSN=https://your-sentry-dsn

# Frontend
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api
NEXT_PUBLIC_SENTRY_DSN=https://your-frontend-sentry-dsn
```

#### **CI/CD Pipeline (GitHub Actions)**
```yaml
name: Deploy Dashboard BI

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      # Backend tests
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      
      - name: Install backend dependencies
        run: |
          cd backend
          pip install -r requirements.txt
      
      - name: Run backend tests
        run: |
          cd backend
          pytest tests/ -v
      
      # Frontend tests
      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install frontend dependencies
        run: |
          cd frontend
          npm ci
      
      - name: Run frontend tests
        run: |
          cd frontend
          npm test
      
      - name: Build frontend
        run: |
          cd frontend
          npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to production
        run: |
          # Your deployment script
          ./deploy.sh production
```

### **Monitoring & Logging**

#### **Application Monitoring**
```python
# Backend monitoring with Sentry
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration

sentry_sdk.init(
    dsn=os.getenv("SENTRY_DSN"),
    integrations=[FastApiIntegration()],
    traces_sample_rate=1.0,
)

# Custom metrics
from prometheus_client import Counter, Histogram

query_executions = Counter('query_executions_total', 'Total query executions')
query_duration = Histogram('query_duration_seconds', 'Query execution time')

@router.post("/execute")
async def execute_query(query_request: QueryRequest):
    query_executions.inc()
    with query_duration.time():
        # Query execution logic
        pass
```

#### **Frontend Monitoring**
```typescript
// Frontend error tracking
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
})

// Performance monitoring
export const trackPageView = (page: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', 'GA_MEASUREMENT_ID', {
      page_title: page,
      page_location: window.location.href,
    })
  }
}

// Custom analytics
export const trackEvent = (action: string, category: string, label?: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
    })
  }
}
```

### **Security Best Practices**

#### **Backend Security**
```python
# HTTPS enforcement
from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware
app.add_middleware(HTTPSRedirectMiddleware)

# Security headers
from fastapi.middleware.trustedhost import TrustedHostMiddleware
app.add_middleware(TrustedHostMiddleware, allowed_hosts=["yourdomain.com"])

# Rate limiting
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.post("/api/auth/login")
@limiter.limit("5/minute")
async def login(request: Request, user_credentials: UserLogin):
    # Login logic with rate limiting
```

#### **Frontend Security**
```typescript
// CSP headers in next.config.js
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          }
        ]
      }
    ]
  }
}

// Secure API communication
const apiClient = {
  async request(url: string, options: RequestInit = {}) {
    // Add CSRF token
    const csrfToken = getCsrfToken()
    
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'X-CSRF-Token': csrfToken,
      },
      credentials: 'include', // Include cookies
    })
  }
}
```

---

## 🧪 Testing Strategy

### **Backend Testing**

#### **Unit Tests**
```python
# tests/test_auth.py
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.auth import create_access_token, verify_password

client = TestClient(app)

def test_login_success():
    response = client.post(
        "/api/auth/login",
        json={"email": "admin@example.com", "password": "admin123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "admin@example.com"

def test_login_invalid_credentials():
    response = client.post(
        "/api/auth/login",
        json={"email": "admin@example.com", "password": "wrong"}
    )
    assert response.status_code == 401

def test_password_hashing():
    password = "test123"
    hashed = get_password_hash(password)
    assert verify_password(password, hashed)
    assert not verify_password("wrong", hashed)

# tests/test_database.py
@pytest.mark.asyncio
async def test_execute_query():
    connection_data = {
        "db_type": "sqlite",
        "database_name": ":memory:"
    }
    
    result = await db_manager.execute_query(
        connection_data,
        "SELECT 1 as test_column",
        limit=10
    )
    
    assert result["success"] is True
    assert len(result["data"]) == 1
    assert result["data"][0]["test_column"] == 1
```

#### **Integration Tests**
```python
# tests/test_integration.py
@pytest.mark.asyncio
async def test_full_query_flow():
    # Login
    login_response = client.post("/api/auth/login", json={
        "email": "admin@example.com",
        "password": "admin123"
    })
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create database connection
    db_response = client.post("/api/databases", json={
        "name": "Test DB",
        "db_type": "sqlite",
        "database_name": ":memory:"
    }, headers=headers)
    db_id = db_response.json()["id"]
    
    # Execute query
    query_response = client.post("/api/queries/execute", json={
        "database_id": db_id,
        "query": "SELECT 1 as result"
    }, headers=headers)
    
    assert query_response.status_code == 200
    result = query_response.json()
    assert result["success"] is True
```

### **Frontend Testing**

#### **Component Tests**
```typescript
// components/__tests__/query-interface.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryInterface } from '../query-interface'
import { DatabaseConnectionProvider } from '@/contexts/database-connection-context'

const MockedQueryInterface = () => (
  <DatabaseConnectionProvider>
    <QueryInterface />
  </DatabaseConnectionProvider>
)

describe('QueryInterface', () => {
  test('renders query editor', () => {
    render(<MockedQueryInterface />)
    expect(screen.getByPlaceholderText(/sql query/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /execute/i })).toBeInTheDocument()
  })

  test('executes query on button click', async () => {
    const mockExecuteQuery = jest.fn().mockResolvedValue({
      success: true,
      data: [{ id: 1, name: 'Test' }],
      columns: [{ name: 'id' }, { name: 'name' }]
    })

    render(<MockedQueryInterface />)
    
    const queryInput = screen.getByPlaceholderText(/sql query/i)
    const executeButton = screen.getByRole('button', { name: /execute/i })
    
    fireEvent.change(queryInput, { target: { value: 'SELECT * FROM users' } })
    fireEvent.click(executeButton)
    
    await waitFor(() => {
      expect(screen.getByText('Query Results')).toBeInTheDocument()
    })
  })
})
```

#### **E2E Tests (Playwright)**
```typescript
// tests/e2e/auth.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test('login with valid credentials', async ({ page }) => {
    await page.goto('/login')
    
    await page.fill('[data-testid=email-input]', 'admin@example.com')
    await page.fill('[data-testid=password-input]', 'admin123')
    await page.click('[data-testid=login-button]')
    
    await expect(page).toHaveURL('/explore')
    await expect(page.locator('[data-testid=user-menu]')).toBeVisible()
  })

  test('redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/explore')
    await expect(page).toHaveURL('/login')
  })
})

// tests/e2e/database.spec.ts
test.describe('Database Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login')
    await page.fill('[data-testid=email-input]', 'admin@example.com')
    await page.fill('[data-testid=password-input]', 'admin123')
    await page.click('[data-testid=login-button]')
    await page.waitForURL('/explore')
  })

  test('create and test database connection', async ({ page }) => {
    await page.click('[data-testid=add-connection-button]')
    
    await page.fill('[data-testid=connection-name]', 'Test PostgreSQL')
    await page.selectOption('[data-testid=db-type]', 'postgresql')
    await page.fill('[data-testid=host]', 'localhost')
    await page.fill('[data-testid=port]', '5432')
    await page.fill('[data-testid=database]', 'postgres')
    await page.fill('[data-testid=username]', 'postgres')
    await page.fill('[data-testid=password]', 'password')
    
    await page.click('[data-testid=test-connection]')
    await expect(page.locator('[data-testid=connection-status]')).toHaveText('Connected')
    
    await page.click('[data-testid=save-connection]')
    await expect(page.locator('[data-testid=connection-list]')).toContainText('Test PostgreSQL')
  })
})
```

### **Performance Testing**

#### **Load Testing (Locust)**
```python
# locustfile.py
from locust import HttpUser, task, between

class DashboardUser(HttpUser):
    wait_time = between(1, 3)
    
    def on_start(self):
        # Login
        response = self.client.post("/api/auth/login", json={
            "email": "admin@example.com",
            "password": "admin123"
        })
        self.token = response.json()["access_token"]
        self.client.headers["Authorization"] = f"Bearer {self.token}"
    
    @task(3)
    def list_databases(self):
        self.client.get("/api/databases")
    
    @task(2)
    def execute_simple_query(self):
        self.client.post("/api/queries/execute", json={
            "database_id": 1,
            "query": "SELECT 1"
        })
    
    @task(1)
    def get_table_data(self):
        self.client.get("/api/databases/1/tables/users/data?limit=10")
```

---

## 📚 API Reference

### **Complete API Documentation**

#### **Authentication Endpoints**
```typescript
// POST /api/auth/login
interface LoginRequest {
  email: string
  password: string
}

interface LoginResponse {
  access_token: string
  token_type: "bearer"
  user: {
    id: number
    email: string
    name: string
    role: "admin" | "user"
  }
}

// POST /api/auth/register
interface RegisterRequest {
  name: string
  email: string
  password: string
}

// GET /api/auth/me
interface UserResponse {
  id: number
  email: string
  name: string
  role: string
  created_at: string
}
```

#### **Database Management Endpoints**
```typescript
// GET /api/databases
interface DatabaseConfig {
  id: number
  name: string
  db_type: "postgresql" | "mysql" | "sqlite"
  host?: string
  port?: number
  database_name: string
  username?: string
  status: "connected" | "disconnected" | "error"
  created_at: string
  updated_at: string
}

// POST /api/databases
interface CreateDatabaseRequest {
  name: string
  db_type: string
  host?: string
  port?: number
  database_name: string
  username?: string
  password?: string
}

// POST /api/databases/{id}/test
interface ConnectionTestResult {
  success: boolean
  message: string
  latency?: number
  error?: string
}

// GET /api/databases/{id}/tables
interface TableInfo {
  name: string
  row_count: number
  columns: ColumnInfo[]
}

interface ColumnInfo {
  name: string
  type: string
  nullable: boolean
  primary_key: boolean
  default_value?: string
}
```

#### **Query Execution Endpoints**
```typescript
// POST /api/queries/execute
interface QueryRequest {
  database_id: number
  query: string
  limit?: number
}

interface QueryResult {
  success: boolean
  data: Record<string, any>[]
  columns: Array<{ name: string; type: string }>
  row_count: number
  execution_time: number
  error?: string
}

// GET /api/queries/history
interface QueryHistoryItem {
  id: string
  query: string
  executed_at: string
  execution_time: number
  row_count: number
  status: "success" | "error"
}
```

#### **Dashboard Management Endpoints**
```typescript
// GET /api/dashboards
interface Dashboard {
  id: number
  name: string
  description?: string
  charts: ChartConfig[]
  created_at: string
  updated_at: string
}

// POST /api/dashboards
interface CreateDashboardRequest {
  name: string
  description?: string
  charts: ChartConfig[]
}

interface ChartConfig {
  id?: string
  type: "bar" | "line" | "area" | "pie" | "donut"
  title: string
  query: string
  database_id: number
  config: {
    xAxis: string
    yAxis?: string
    color: string
  }
  position?: {
    x: number
    y: number
    w: number
    h: number
  }
}
```

### **Error Handling**

#### **Standard Error Response**
```typescript
interface ErrorResponse {
  success: false
  error: {
    code: string
    message: string
    details?: Record<string, any>
  }
}

// Common error codes
type ErrorCode = 
  | "INVALID_CREDENTIALS"
  | "UNAUTHORIZED" 
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "DATABASE_ERROR"
  | "CONNECTION_ERROR"
  | "RATE_LIMIT_EXCEEDED"
```

---

## 🎯 Contributing Guidelines

### **Development Workflow**

1. **Fork & Clone**
```bash
git clone https://github.com/your-username/dashboard-bi.git
cd dashboard-bi
git remote add upstream https://github.com/aymanerihane/dashboard-bi.git
```

2. **Create Feature Branch**
```bash
git checkout -b feature/your-feature-name
```

3. **Make Changes**
- Follow coding standards
- Add tests for new features
- Update documentation

4. **Commit & Push**
```bash
git add .
git commit -m "feat: add new feature description"
git push origin feature/your-feature-name
```

5. **Create Pull Request**
- Describe changes clearly
- Include screenshots for UI changes
- Reference related issues

### **Code Style**

#### **Backend (Python)**
```python
# Use type hints
async def execute_query(self, connection_data: dict, query: str) -> Dict[str, Any]:
    pass

# Follow PEP 8
# Use black for formatting
# Use isort for imports

# Document functions
def create_connection_string(connection_data: dict) -> str:
    """
    Build database connection string from connection parameters.
    
    Args:
        connection_data: Dictionary containing database connection info
        
    Returns:
        Formatted connection string for SQLAlchemy
        
    Raises:
        ValueError: If required parameters are missing
    """
    pass
```

#### **Frontend (TypeScript)**
```typescript
// Use TypeScript strictly
interface Props {
  data: DataItem[]
  onSelect: (item: DataItem) => void
}

// Use React hooks patterns
export const DataTable: React.FC<Props> = ({ data, onSelect }) => {
  // Component implementation
}

// Use meaningful names
const handleConnectionTest = async (connectionId: number) => {
  // Implementation
}

// Follow ESLint rules
// Use Prettier for formatting
```

### **Commit Convention**
```
feat: add new feature
fix: bug fix
docs: documentation updates
style: formatting, missing semi colons, etc.
refactor: code restructuring
test: adding tests
chore: maintenance tasks
```

---

**Dashboard BI Developer Documentation** - Complete technical reference for building, deploying, and maintaining the platform.

*Happy coding!* 🚀
