-- Create test database and tables with sample data

-- First, create the authentication users table that matches the SQLAlchemy model
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create database_connections table for the dashboard
CREATE TABLE IF NOT EXISTS database_connections (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    db_type VARCHAR(50) NOT NULL,
    host VARCHAR(255),
    port INTEGER,
    database_name VARCHAR(255) NOT NULL,
    username VARCHAR(255),
    password TEXT,
    status VARCHAR(50) DEFAULT 'disconnected',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create query_history table
CREATE TABLE IF NOT EXISTS query_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    database_id INTEGER NOT NULL REFERENCES database_connections(id),
    query TEXT NOT NULL,
    execution_time INTEGER,
    row_count INTEGER,
    status VARCHAR(50),
    error_message TEXT,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create dashboards table
CREATE TABLE IF NOT EXISTS dashboards (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    charts JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create sample users table for testing (different from auth users)
CREATE TABLE IF NOT EXISTS sample_users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    age INTEGER,
    city VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    category VARCHAR(100),
    stock_quantity INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES sample_users(id),
    total_amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    shipped_date TIMESTAMP,
    delivery_address TEXT
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id),
    product_id INTEGER REFERENCES products(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL
);

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    parent_id INTEGER REFERENCES categories(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default authentication users
-- Password hash for 'admin123' using bcrypt
INSERT INTO users (email, name, hashed_password, role) VALUES
('admin@example.com', 'Administrator', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewPpE4Y4LKuR4NRS', 'admin'),
('user@example.com', 'Regular User', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewPpE4Y4LKuR4NRS', 'user')
ON CONFLICT (email) DO NOTHING;

-- Insert sample users into sample_users table (for testing queries)
INSERT INTO sample_users (email, first_name, last_name, age, city) VALUES
('john.doe@email.com', 'John', 'Doe', 28, 'New York'),
('jane.smith@email.com', 'Jane', 'Smith', 32, 'Los Angeles'),
('mike.johnson@email.com', 'Mike', 'Johnson', 25, 'Chicago'),
('sarah.wilson@email.com', 'Sarah', 'Wilson', 29, 'Houston'),
('david.brown@email.com', 'David', 'Brown', 35, 'Phoenix'),
('lisa.davis@email.com', 'Lisa', 'Davis', 27, 'Philadelphia'),
('tom.miller@email.com', 'Tom', 'Miller', 31, 'San Antonio'),
('emma.garcia@email.com', 'Emma', 'Garcia', 26, 'San Diego'),
('james.rodriguez@email.com', 'James', 'Rodriguez', 33, 'Dallas'),
('olivia.martinez@email.com', 'Olivia', 'Martinez', 24, 'San Jose');

-- Insert sample categories
INSERT INTO categories (name, description) VALUES
('Electronics', 'Electronic devices and accessories'),
('Clothing', 'Apparel and fashion items'),
('Books', 'Books and educational materials'),
('Home & Garden', 'Home improvement and gardening supplies'),
('Sports', 'Sports equipment and accessories'),
('Toys', 'Toys and games for children'),
('Health & Beauty', 'Health and beauty products'),
('Automotive', 'Car parts and accessories');

-- Insert sample products
INSERT INTO products (name, description, price, category, stock_quantity) VALUES
('iPhone 15 Pro', 'Latest Apple smartphone with advanced features', 999.99, 'Electronics', 50),
('Samsung Galaxy S24', 'High-performance Android smartphone', 849.99, 'Electronics', 75),
('MacBook Air M2', 'Lightweight laptop with M2 chip', 1199.99, 'Electronics', 30),
('Dell XPS 13', 'Premium ultrabook laptop', 899.99, 'Electronics', 25),
('AirPods Pro', 'Wireless earbuds with noise cancellation', 249.99, 'Electronics', 100),

('Nike Air Max 270', 'Comfortable running shoes', 129.99, 'Clothing', 80),
('Adidas Ultraboost', 'Premium running shoes', 179.99, 'Clothing', 60),
('Levi''s 501 Jeans', 'Classic denim jeans', 59.99, 'Clothing', 120),
('Nike Hoodie', 'Comfortable cotton hoodie', 49.99, 'Clothing', 90),
('Ray-Ban Sunglasses', 'Classic aviator sunglasses', 159.99, 'Clothing', 40),

('The Great Gatsby', 'Classic American literature', 12.99, 'Books', 200),
('Clean Code', 'Programming best practices', 39.99, 'Books', 150),
('The Art of War', 'Strategic thinking classic', 9.99, 'Books', 180),
('Python Crash Course', 'Learn programming with Python', 29.99, 'Books', 100),

('Coffee Maker', 'Automatic drip coffee maker', 79.99, 'Home & Garden', 45),
('Instant Pot', 'Multi-function pressure cooker', 99.99, 'Home & Garden', 35),
('Garden Hose', '50ft expandable garden hose', 24.99, 'Home & Garden', 70),

('Tennis Racket', 'Professional tennis racket', 149.99, 'Sports', 25),
('Basketball', 'Official size basketball', 29.99, 'Sports', 60),
('Yoga Mat', 'Non-slip exercise mat', 19.99, 'Sports', 85),

('LEGO Creator Set', 'Building blocks set for kids', 79.99, 'Toys', 40),
('Monopoly Board Game', 'Classic family board game', 24.99, 'Toys', 55);

-- Insert sample orders
INSERT INTO orders (user_id, total_amount, status, delivery_address) VALUES
(1, 1249.98, 'completed', '123 Main St, New York, NY 10001'),
(2, 179.99, 'shipped', '456 Oak Ave, Los Angeles, CA 90001'),
(3, 89.98, 'pending', '789 Pine St, Chicago, IL 60601'),
(4, 999.99, 'completed', '321 Elm St, Houston, TX 77001'),
(5, 159.99, 'processing', '654 Maple Dr, Phoenix, AZ 85001'),
(1, 49.99, 'completed', '123 Main St, New York, NY 10001'),
(6, 199.98, 'shipped', '987 Cedar Ln, Philadelphia, PA 19101'),
(7, 79.99, 'pending', '147 Birch Rd, San Antonio, TX 78201'),
(8, 1299.98, 'completed', '258 Spruce St, San Diego, CA 92101'),
(9, 329.97, 'processing', '369 Willow Ave, Dallas, TX 75201');

-- Insert sample order items
INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price) VALUES
-- Order 1: iPhone + AirPods
(1, 1, 1, 999.99, 999.99),
(1, 5, 1, 249.99, 249.99),

-- Order 2: Adidas shoes
(2, 7, 1, 179.99, 179.99),

-- Order 3: Nike shoes + hoodie
(3, 6, 1, 129.99, 129.99),
(3, 9, 1, 49.99, 49.99),

-- Order 4: Samsung phone
(4, 2, 1, 999.99, 999.99),

-- Order 5: Sunglasses
(5, 10, 1, 159.99, 159.99),

-- Order 6: Nike hoodie
(6, 9, 1, 49.99, 49.99),

-- Order 7: Books
(7, 11, 2, 12.99, 25.98),
(7, 12, 1, 39.99, 39.99),
(7, 13, 1, 9.99, 9.99),

-- Order 8: Coffee maker
(8, 15, 1, 79.99, 79.99),

-- Order 9: MacBook
(9, 3, 1, 1199.99, 1199.99),
(9, 5, 1, 249.99, 249.99),

-- Order 10: Sports equipment
(10, 18, 1, 149.99, 149.99),
(10, 19, 1, 29.99, 29.99),
(10, 20, 1, 19.99, 19.99);

-- Create some views for analytics
CREATE OR REPLACE VIEW user_order_summary AS
SELECT 
    u.id,
    u.first_name,
    u.last_name,
    u.email,
    u.city,
    COUNT(o.id) as total_orders,
    COALESCE(SUM(o.total_amount), 0) as total_spent,
    COALESCE(AVG(o.total_amount), 0) as avg_order_value,
    MAX(o.order_date) as last_order_date
FROM sample_users u
LEFT JOIN orders o ON u.id = o.user_id
GROUP BY u.id, u.first_name, u.last_name, u.email, u.city
ORDER BY total_spent DESC;

CREATE OR REPLACE VIEW product_sales_summary AS
SELECT 
    p.id,
    p.name,
    p.category,
    p.price,
    p.stock_quantity,
    COALESCE(SUM(oi.quantity), 0) as total_sold,
    COALESCE(SUM(oi.total_price), 0) as total_revenue,
    COUNT(DISTINCT oi.order_id) as unique_orders
FROM products p
LEFT JOIN order_items oi ON p.id = oi.product_id
GROUP BY p.id, p.name, p.category, p.price, p.stock_quantity
ORDER BY total_revenue DESC;

CREATE OR REPLACE VIEW monthly_sales AS
SELECT 
    DATE_TRUNC('month', o.order_date) as month,
    COUNT(o.id) as total_orders,
    SUM(o.total_amount) as total_revenue,
    AVG(o.total_amount) as avg_order_value,
    COUNT(DISTINCT o.user_id) as unique_customers
FROM orders o
GROUP BY DATE_TRUNC('month', o.order_date)
ORDER BY month DESC;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_sample_users_email ON sample_users(email);
CREATE INDEX IF NOT EXISTS idx_sample_users_city ON sample_users(city);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(order_date);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
CREATE INDEX IF NOT EXISTS idx_database_connections_user_id ON database_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_query_history_user_id ON query_history(user_id);
CREATE INDEX IF NOT EXISTS idx_dashboards_user_id ON dashboards(user_id);

-- Insert some additional test data for more complex queries
INSERT INTO sample_users (email, first_name, last_name, age, city, is_active) VALUES
('inactive.user@email.com', 'Inactive', 'User', 30, 'Seattle', false),
('test.customer@email.com', 'Test', 'Customer', 22, 'Boston', true);

-- Add some products with no sales for testing
INSERT INTO products (name, description, price, category, stock_quantity) VALUES
('Wireless Mouse', 'Bluetooth wireless mouse', 29.99, 'Electronics', 0),
('Standing Desk', 'Adjustable height standing desk', 299.99, 'Home & Garden', 10),
('Premium Headphones', 'Noise-canceling over-ear headphones', 199.99, 'Electronics', 15);

ANALYZE;
