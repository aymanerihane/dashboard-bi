# Database Dashboard - User Guide

Welcome to the Database Dashboard! This guide will help you get started with managing and visualizing your databases.

## 🚀 Getting Started

### 1. Login
When you first access the application, you'll see the login screen.

**Demo Credentials:**
- **Administrator**: admin@example.com / admin123
- **Regular User**: user@example.com / user123

### 2. Main Dashboard
After logging in, you'll see the main dashboard with three main sections:
- **Schema Explorer**: Browse your database structure
- **Query Interface**: Execute SQL queries
- **Dashboards**: Create and view data visualizations

## 🔌 Managing Database Connections

### Adding a New Connection

1. Click the **"Add New Connection"** button
2. Fill in the connection details:
   - **Name**: A friendly name for your database
   - **Type**: Choose PostgreSQL, MySQL, or SQLite
   - **Host**: Database server address (e.g., localhost)
   - **Port**: Database port (5432 for PostgreSQL, 3306 for MySQL)
   - **Database**: Database name
   - **Username & Password**: Your credentials

3. Click **"Test Connection"** to verify the settings
4. Click **"Save Connection"** if the test is successful

### Connection Types

#### PostgreSQL
- Default port: 5432
- Requires host, database name, username, and password

#### MySQL
- Default port: 3306
- Requires host, database name, username, and password

#### SQLite
- Only requires the database file path
- No host or credentials needed

### Managing Existing Connections

- **Edit**: Click the pencil icon to modify connection settings
- **Delete**: Click the trash icon to remove a connection
- **Connect**: Click "Connect" to start working with a database

## 🔍 Schema Explorer

The Schema Explorer helps you understand your database structure.

### Features

#### Table List
- View all tables in your database
- Search tables by name
- See table row counts

#### Table Structure
- **Structure Tab**: View column names, types, and constraints
- **Data Tab**: Preview actual table data (first 10 rows)
- **Statistics Tab**: See data distribution and table metrics

#### Column Information
- Column names and data types
- Primary keys (🔑 icon)
- Foreign keys (🔗 icon)
- Nullable columns (? icon)
- Default values

### Using the Schema Explorer

1. Select a database connection
2. Browse the table list on the left
3. Click a table to view its details
4. Switch between Structure, Data, and Statistics tabs
5. Use the search box to find specific tables

## 💻 Query Interface

Execute SQL queries and view results in a user-friendly interface.

### Writing Queries

1. Go to the **Query Interface** tab
2. Type your SQL query in the editor
3. Click **"Execute Query"** or press Ctrl+Enter
4. View results in the table below

### Query Features

#### SQL Editor
- Syntax highlighting for better readability
- Line numbers for easy reference
- Auto-indentation

#### Query Templates
Use pre-built templates for common operations:
- **Select All**: `SELECT * FROM table_name LIMIT 10`
- **Count Records**: `SELECT COUNT(*) FROM table_name`
- **Table Info**: `DESCRIBE table_name`

#### Query History
- View your last 10 executed queries
- Click any query to load it back into the editor
- See execution time and result count

### Query Results

#### Results Table
- Sortable columns (click headers)
- Pagination for large result sets
- Row count display

#### Export Options
- **CSV**: Download as comma-separated values
- **JSON**: Download as JSON format
- Copy results to clipboard

### Query Tips

✅ **Good Practices:**
- Always use `LIMIT` for large tables
- Test queries on small datasets first
- Use meaningful column aliases

❌ **Avoid:**
- Running `SELECT *` on very large tables
- Queries without WHERE clauses on production data
- Modifying data without backups

## 📊 Dashboard Visualization

Create interactive charts and dashboards from your query results.

### Creating Charts

1. Execute a query in the Query Interface
2. Go to the **Dashboards** tab
3. Click **"Create New Dashboard"**
4. Give your dashboard a name
5. Add charts using the **"Add Chart"** button

### Chart Types

#### Bar Chart
- **Best for**: Comparing categories
- **Data**: Categorical X-axis, numerical Y-axis
- **Example**: Sales by region, products by category

#### Line Chart
- **Best for**: Trends over time
- **Data**: Time series or sequential data
- **Example**: Monthly revenue, daily user counts

#### Area Chart
- **Best for**: Cumulative data over time
- **Data**: Time series with volume
- **Example**: Cumulative sales, stacked categories

#### Pie Chart
- **Best for**: Proportions and percentages
- **Data**: Categories with values
- **Example**: Market share, budget allocation

### Dashboard Management

#### Creating Dashboards
1. Click **"Create New Dashboard"**
2. Enter a descriptive name
3. Start adding charts from your queries

#### Managing Charts
- **Add Chart**: Create new visualizations
- **Edit Chart**: Modify chart settings
- **Delete Chart**: Remove unwanted charts
- **Rearrange**: Drag charts to reorder

#### Dashboard Actions
- **Save**: Automatically saves changes
- **Delete**: Remove entire dashboard
- **Export**: Download dashboard as image

### Chart Customization

#### Colors
- Choose from predefined color schemes
- Emerald theme (default)
- Blue, red, and amber alternatives

#### Data Selection
- Select X and Y axis columns
- Choose aggregation methods (sum, count, average)
- Filter data ranges

## 👤 User Management

### Profile Settings
Click your avatar in the top-right corner to access:
- **Profile**: View your account information
- **Settings**: Customize preferences
- **Logout**: Sign out of the application

### User Roles

#### Administrator
- Access to all database connections
- Can create and delete connections
- Full dashboard management
- User management capabilities

#### Regular User
- Access to assigned databases only
- Can create personal dashboards
- Limited connection management
- Read-only access to shared dashboards

## 🔧 Troubleshooting

### Connection Issues

**Problem**: "Connection failed" error
**Solutions**:
- Verify database server is running
- Check host and port settings
- Confirm username and password
- Test network connectivity

**Problem**: "Access denied" error
**Solutions**:
- Verify user permissions in database
- Check if user has required privileges
- Contact database administrator

### Query Issues

**Problem**: Query takes too long
**Solutions**:
- Add `LIMIT` clause to restrict results
- Use `WHERE` conditions to filter data
- Check if database indexes exist
- Contact administrator for optimization

**Problem**: "Syntax error" in query
**Solutions**:
- Check SQL syntax carefully
- Verify table and column names
- Use query templates as reference
- Test with simpler queries first

### Dashboard Issues

**Problem**: Charts not displaying data
**Solutions**:
- Verify query returns results
- Check data types are compatible
- Ensure columns are properly selected
- Try different chart types

**Problem**: Dashboard loads slowly
**Solutions**:
- Reduce data size with filters
- Use aggregated queries
- Limit time ranges
- Consider data sampling

## 💡 Tips and Best Practices

### Database Connections
- Use descriptive connection names
- Test connections before saving
- Keep credentials secure
- Regular connection health checks

### Query Writing
- Start with simple SELECT statements
- Use LIMIT for testing large tables
- Comment complex queries
- Save frequently used queries

### Dashboard Design
- Choose appropriate chart types
- Use consistent color schemes
- Keep dashboards focused
- Add descriptive titles

### Performance
- Index frequently queried columns
- Use WHERE clauses to filter data
- Avoid SELECT * on large tables
- Monitor query execution times

## 🆘 Getting Help

### In-App Help
- Hover over icons for tooltips
- Check query templates for examples
- Use the search function to find tables

### Common Shortcuts
- **Ctrl+Enter**: Execute query
- **Ctrl+S**: Save dashboard
- **Esc**: Close modals
- **Tab**: Navigate between fields

### Support Resources
- Check this user guide first
- Review error messages carefully
- Contact your database administrator
- Submit bug reports with details

---

**Happy querying!** 🎉

For technical support, contact your system administrator or check the project documentation.
