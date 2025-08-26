# Database Dashboard

A comprehensive multi-database management and visualization platform built with Next.js, TypeScript, Tailwind CSS, and FastAPI.

## 🚀 Features

- **Multi-Database Support**: Connect to PostgreSQL, MySQL, and SQLite databases
- **Schema Explorer**: Browse database tables, columns, and relationships
- **Query Interface**: Execute SQL queries with syntax highlighting and history
- **Data Visualization**: Create interactive charts and dashboards from query results
- **Authentication**: Secure JWT-based authentication system
- **Modern UI**: Clean, responsive interface with dark/light mode support
- **Real Database Connections**: Actual database connectivity with FastAPI backend

## 🏗️ Architecture

### Tech Stack
- **Backend**: FastAPI, SQLAlchemy, PostgreSQL/MySQL/SQLite drivers
- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS v4, shadcn/ui components
- **Charts**: Recharts for data visualization
- **Authentication**: JWT-based auth with FastAPI backend
- **Database**: Multi-database support with real connections

### Project Structure
\`\`\`
├── backend/                # FastAPI backend
│   ├── app/
│   │   ├── api/           # API endpoints
│   │   │   ├── auth.py    # Authentication routes
│   │   │   ├── databases.py # Database management
│   │   │   └── queries.py # Query execution
│   │   ├── core/          # Core functionality
│   │   ├── models/        # Database models
│   │   └── main.py        # FastAPI app
│   └── requirements.txt   # Python dependencies
├── frontend/              # Next.js frontend
│   ├── app/              # Next.js app directory
│   ├── components/       # React components
│   ├── lib/             # API client and utilities
│   └── contexts/        # React contexts
\`\`\`

## 🛠️ Development Setup

### Prerequisites
- **Backend**: Python 3.8+, pip
- **Frontend**: Node.js 18+, npm/yarn
- **Databases**: PostgreSQL, MySQL, or SQLite

### Backend Setup
1. Navigate to backend directory:
   \`\`\`bash
   cd backend
   \`\`\`
2. Create virtual environment:
   \`\`\`bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   \`\`\`
3. Install dependencies:
   \`\`\`bash
   pip install -r requirements.txt
   \`\`\`
4. Set environment variables:
   \`\`\`bash
   cp .env.example .env
   # Edit .env with your configuration
   \`\`\`
5. Start the backend server:
   \`\`\`bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   \`\`\`

### Frontend Setup
1. Navigate to frontend directory:
   \`\`\`bash
   cd frontend
   \`\`\`
2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`
3. Set environment variables:
   \`\`\`bash
   # Create .env.local
   NEXT_PUBLIC_API_URL=http://localhost:8000/api
   \`\`\`
4. Start the development server:
   \`\`\`bash
   npm run dev
   \`\`\`

### Full Stack Development
1. Start backend on port 8000
2. Start frontend on port 3000
3. Frontend will automatically connect to backend API

## 🔧 Configuration

### Backend Environment Variables (.env)
\`\`\`env
# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/dashboard_db

# JWT Configuration
SECRET_KEY=your-super-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS Configuration
CORS_ORIGINS=["http://localhost:3000", "https://yourdomain.com"]

# Optional: Database Connection Limits
MAX_CONNECTIONS_PER_POOL=20
CONNECTION_TIMEOUT=30
\`\`\`

### Frontend Environment Variables (.env.local)
\`\`\`env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000/api

# Optional: Development Settings
NEXT_PUBLIC_DEV_MODE=true
\`\`\`

### Database Connections
The application now supports real database connections through the FastAPI backend:

#### PostgreSQL
\`\`\`json
{
  "name": "Production DB",
  "type": "postgresql",
  "host": "localhost",
  "port": 5432,
  "database": "myapp",
  "username": "postgres",
  "password": "password"
}
\`\`\`

#### MySQL
\`\`\`json
{
  "name": "Analytics DB",
  "type": "mysql",
  "host": "localhost",
  "port": 3306,
  "database": "analytics",
  "username": "root",
  "password": "password"
}
\`\`\`

#### SQLite
\`\`\`json
{
  "name": "Local DB",
  "type": "sqlite",
  "database": "/path/to/database.db"
}
\`\`\`

## 🔗 API Integration

### Backend API Endpoints

#### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user profile

#### Database Management
- `GET /api/databases` - List all database connections
- `POST /api/databases` - Create new database connection
- `PUT /api/databases/{db_id}` - Update database connection
- `DELETE /api/databases/{db_id}` - Delete database connection
- `POST /api/databases/{db_id}/test` - Test database connection

#### Query Execution
- `POST /api/queries/execute` - Execute SQL query
- `GET /api/queries/history` - Get query history
- `POST /api/queries/export` - Export query results

#### Dashboard Management
- `GET /api/dashboards` - List user dashboards
- `POST /api/dashboards` - Create new dashboard
- `PUT /api/dashboards/{dashboard_id}` - Update dashboard
- `DELETE /api/dashboards/{dashboard_id}` - Delete dashboard

### Frontend API Client
The frontend uses a centralized API client (`lib/api.ts`) that handles:
- JWT token management
- Request/response interceptors
- Error handling and retry logic
- Type-safe API calls

\`\`\`typescript
// Example API usage
import { apiClient } from '@/lib/api'

// Test database connection
const result = await apiClient.testConnection(connectionId)

// Execute query
const queryResult = await apiClient.executeQuery({
  connection_id: connectionId,
  query: 'SELECT * FROM users LIMIT 10'
})
\`\`\`

## 🔐 Authentication Flow

### JWT Authentication
1. User submits login credentials to `/api/auth/login`
2. Backend validates credentials and returns JWT token
3. Frontend stores token in localStorage
4. All subsequent API requests include token in Authorization header
5. Backend validates token on each protected route

### Token Management
- **Access Token**: 30-minute expiration (configurable)
- **Automatic Refresh**: Frontend handles token refresh
- **Secure Storage**: Tokens stored in httpOnly cookies (production)
- **Role-Based Access**: Admin/User role enforcement

## 🚀 Deployment

### Backend Deployment (Docker)
\`\`\`dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
\`\`\`

### Frontend Deployment (Vercel)
1. Set environment variables in Vercel dashboard:
   \`\`\`
   NEXT_PUBLIC_API_URL=https://your-backend-api.com/api
   \`\`\`
2. Deploy automatically from GitHub

### Full Stack Deployment (Docker Compose)
\`\`\`yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/dashboard
    depends_on:
      - db
  
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://backend:8000/api
    depends_on:
      - backend
  
  db:
    image: postgres:13
    environment:
      - POSTGRES_DB=dashboard
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
\`\`\`

## 🧪 Testing Integration

### Backend Testing
\`\`\`bash
cd backend
pytest tests/
\`\`\`

### Frontend Testing
\`\`\`bash
cd frontend
npm run test
\`\`\`

### End-to-End Testing
\`\`\`bash
# Start both backend and frontend
npm run test:e2e
\`\`\`

## 🐛 Troubleshooting

### Backend Issues
- **Connection Refused**: Check if backend is running on port 8000
- **Database Connection Failed**: Verify database credentials and connectivity
- **CORS Errors**: Ensure frontend URL is in CORS_ORIGINS

### Frontend Issues
- **API Calls Failing**: Check NEXT_PUBLIC_API_URL environment variable
- **Authentication Issues**: Clear localStorage and re-login
- **Network Errors**: Verify backend is accessible from frontend

### Integration Issues
- **Token Expired**: Backend returns 401, frontend should redirect to login
- **Database Timeout**: Increase CONNECTION_TIMEOUT in backend config
- **Query Execution Errors**: Check SQL syntax and database permissions

## 📝 Development Workflow

1. **Start Backend**: `uvicorn app.main:app --reload`
2. **Start Frontend**: `npm run dev`
3. **Make Changes**: Edit code in respective directories
4. **Test Integration**: Use browser dev tools to monitor API calls
5. **Debug**: Check backend logs and frontend console

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

For issues and questions:
1. Check the troubleshooting section
2. Search existing GitHub issues
3. Create a new issue with detailed description
4. Contact support at support@example.com
