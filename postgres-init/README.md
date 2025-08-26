# PostgreSQL Test Database Setup

This document explains how to set up and use the PostgreSQL test database with sample data for the Dashboard BI application.

## 🗄️ Database Structure

The PostgreSQL test database (`test`) includes the following tables with sample data:

### Core Tables

#### 1. **users** (10 sample records)
- User accounts with personal information
- Fields: id, email, first_name, last_name, age, city, created_at, is_active

#### 2. **products** (25+ sample records)
- Product catalog with various categories
- Fields: id, name, description, price, category, stock_quantity, created_at, updated_at

#### 3. **orders** (10 sample records)
- Customer orders with status tracking
- Fields: id, user_id, total_amount, status, order_date, shipped_date, delivery_address

#### 4. **order_items** (Multiple records)
- Individual items within orders
- Fields: id, order_id, product_id, quantity, unit_price, total_price

#### 5. **categories** (8 categories)
- Product categories for organization
- Fields: id, name, description, parent_id, created_at

### Analytics Views

#### 1. **user_order_summary**
- Aggregated user spending and order statistics
- Shows: total_orders, total_spent, avg_order_value, last_order_date

#### 2. **product_sales_summary**
- Product performance metrics
- Shows: total_sold, total_revenue, unique_orders

#### 3. **monthly_sales**
- Monthly sales aggregation
- Shows: total_orders, total_revenue, avg_order_value, unique_customers

## 🚀 Quick Start

### Option 1: Using the Batch Script (Windows)
```bash
./start-with-postgres.bat
```

### Option 2: Using Docker Compose
```bash
# Stop existing containers
docker-compose down

# Remove old volumes for fresh data
docker volume rm dashboard-bi_postgres_data

# Start with PostgreSQL
docker-compose up --build -d
```

### Option 3: Manual Setup
```bash
# Pull PostgreSQL image
docker pull postgres:15

# Start PostgreSQL with initialization
docker run -d \
  --name postgres-test \
  -e POSTGRES_DB=test \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  -v $(pwd)/postgres-init:/docker-entrypoint-initdb.d \
  postgres:15
```

## 🔌 Connection Details

- **Host:** localhost
- **Port:** 5432
- **Database:** test
- **Username:** postgres
- **Password:** postgres

## 📊 Sample Queries

### Basic Data Exploration
```sql
-- Count records in each table
SELECT 'users' as table_name, COUNT(*) as records FROM users
UNION ALL
SELECT 'products', COUNT(*) FROM products
UNION ALL
SELECT 'orders', COUNT(*) FROM orders
UNION ALL
SELECT 'order_items', COUNT(*) FROM order_items;

-- View sample users
SELECT first_name, last_name, email, city FROM users LIMIT 5;

-- View products by category
SELECT category, COUNT(*) as product_count, AVG(price) as avg_price
FROM products 
GROUP BY category 
ORDER BY product_count DESC;
```

### Analytics Queries
```sql
-- Top spending customers
SELECT * FROM user_order_summary ORDER BY total_spent DESC LIMIT 5;

-- Best selling products
SELECT * FROM product_sales_summary ORDER BY total_revenue DESC LIMIT 10;

-- Monthly sales trends
SELECT * FROM monthly_sales ORDER BY month DESC;

-- Order status distribution
SELECT status, COUNT(*) as count, SUM(total_amount) as total_revenue
FROM orders 
GROUP BY status;
```

### Complex Joins
```sql
-- Customer order details with products
SELECT 
    u.first_name,
    u.last_name,
    o.order_date,
    p.name as product_name,
    oi.quantity,
    oi.total_price
FROM users u
JOIN orders o ON u.id = o.user_id
JOIN order_items oi ON o.id = oi.order_id
JOIN products p ON oi.product_id = p.id
ORDER BY o.order_date DESC;

-- Products never ordered
SELECT p.name, p.category, p.price
FROM products p
LEFT JOIN order_items oi ON p.id = oi.product_id
WHERE oi.product_id IS NULL;
```

## 🧪 Testing Database Connections

### Using the Dashboard UI
1. Navigate to http://localhost:3000
2. Login with: `admin@example.com` / `admin123`
3. Go to "Connection Test" tab
4. Create a new PostgreSQL connection:
   - **Name:** "Test PostgreSQL"
   - **Type:** "PostgreSQL"
   - **Host:** "localhost" (or "postgres" if testing from within Docker)
   - **Port:** 5432
   - **Database:** "test"
   - **Username:** "postgres"
   - **Password:** "postgres"
5. Click "Test Connection"

### Using psql Client
```bash
# Connect to database
docker exec -it dashboard-bi_postgres_1 psql -U postgres -d test

# Or from local psql
psql -h localhost -p 5432 -U postgres -d test
```

### Using Database GUI Tools
Configure any PostgreSQL client (pgAdmin, DBeaver, etc.) with the connection details above.

## 📈 Data Relationships

```
users (1) ←→ (many) orders
orders (1) ←→ (many) order_items
products (1) ←→ (many) order_items
categories (1) ←→ (many) products (via category field)
```

## 🔧 Troubleshooting

### Common Issues

**Connection Refused**
- Ensure PostgreSQL container is running: `docker-compose ps`
- Check logs: `docker-compose logs postgres`

**Permission Denied**
- Verify credentials are correct
- Check if database exists: `docker exec -it dashboard-bi_postgres_1 psql -U postgres -l`

**Data Not Loading**
- Initialization scripts run only on first startup
- Remove volume and restart: `docker volume rm dashboard-bi_postgres_data && docker-compose up -d`

### Useful Commands
```bash
# View container logs
docker-compose logs postgres

# Access PostgreSQL shell
docker-compose exec postgres psql -U postgres -d test

# Reset database (removes all data)
docker-compose down
docker volume rm dashboard-bi_postgres_data
docker-compose up -d

# Backup database
docker-compose exec postgres pg_dump -U postgres test > backup.sql

# Restore database
docker-compose exec -T postgres psql -U postgres test < backup.sql
```

## 🎯 Use Cases

This test database is perfect for:
- **Testing database connections** from the Dashboard BI
- **Query development** and testing
- **Data visualization** experiments
- **Performance testing** with realistic data
- **Feature development** without affecting production data
- **Training and demos** with meaningful sample data

## 📚 Next Steps

1. **Test Basic Connectivity** - Verify the database connection works
2. **Explore Sample Data** - Run queries to understand the data structure
3. **Create Visualizations** - Use the Dashboard BI to create charts
4. **Test Advanced Features** - Try complex queries and joins
5. **Add Your Own Data** - Extend with additional tables or records

The database is now ready for comprehensive testing of all Dashboard BI features!
