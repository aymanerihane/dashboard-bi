@echo off

echo 🚀 Starting Dashboard BI with PostgreSQL Test Database
echo ==================================================

REM Stop any existing containers
echo 📦 Stopping existing containers...
docker-compose down

REM Remove old volumes to ensure fresh database
echo 🗑️  Removing old database volumes...
docker volume rm dashboard-bi_postgres_data 2>nul

REM Build and start services
echo 🔨 Building and starting services...
docker-compose up --build -d

echo ⏳ Waiting for services to be ready...
timeout /t 15 /nobreak >nul

REM Check service status
echo 📊 Service Status:
docker-compose ps

echo.
echo ✅ Setup Complete!
echo ==================
echo 🌐 Frontend: http://localhost:3000
echo 🔧 Backend API: http://localhost:8000
echo 📚 API Docs: http://localhost:8000/docs
echo 🗄️  PostgreSQL: localhost:5432
echo.
echo 📋 Database Details:
echo    - Database: test
echo    - Username: postgres
echo    - Password: postgres
echo    - Port: 5432
echo.
echo 🔑 Test Credentials:
echo    - Admin: admin@example.com / admin123
echo    - User: user@example.com / user123
echo.
echo 📊 Sample Tables Created:
echo    - users (10 sample users)
echo    - products (25 sample products)
echo    - orders (10 sample orders)
echo    - order_items (order details)
echo    - categories (8 product categories)
echo.
echo 🔍 Useful Views:
echo    - user_order_summary
echo    - product_sales_summary
echo    - monthly_sales

pause
