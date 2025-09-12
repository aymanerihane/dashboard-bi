# Advanced Query Guide for Dashboard BI

## Overview

Dashboard BI now supports advanced query functionality for creating charts with complex data requirements. This feature allows you to write custom SQL or MongoDB queries instead of relying on the simple table/column selection interface.

## When to Use Advanced Queries

Use advanced queries when you need:

- **Complex aggregations** (SUM, AVG, COUNT with multiple GROUP BY)
- **Joins between multiple tables**
- **Filtering with complex WHERE conditions**
- **Date/time manipulations**
- **Custom calculations and derived fields**
- **Subqueries or CTEs**
- **MongoDB aggregation pipelines**

## How to Enable Advanced Mode

1. **Create a new chart** from any dashboard
2. **Select a database** first (required for query testing)
3. **Toggle the "Advanced" switch** in the Query Mode section
4. The interface will switch from simple column selection to a query editor

## Query Requirements by Chart Type

### Pie/Donut Charts
Your query must return exactly two columns:
- `name` (or similar) - Category labels
- `value` (or similar) - Numeric values

**SQL Example:**
```sql
SELECT 
    category as name, 
    COUNT(*) as value 
FROM products 
GROUP BY category 
ORDER BY value DESC 
LIMIT 10
```

**MongoDB Example:**
```javascript
db.products.aggregate([
  { $group: { _id: "$category", value: { $sum: 1 } } },
  { $project: { name: "$_id", value: 1, _id: 0 } },
  { $sort: { value: -1 } },
  { $limit: 10 }
])
```

### Bar/Line/Area Charts
Your query should return:
- **X-axis column** - Categories, dates, or sequential data
- **Y-axis column** - Numeric values

**SQL Example:**
```sql
SELECT 
    DATE(created_at) as date,
    COUNT(*) as orders
FROM orders 
WHERE created_at >= NOW() - INTERVAL 30 DAY
GROUP BY DATE(created_at)
ORDER BY date
```

**MongoDB Example:**
```javascript
db.orders.aggregate([
  { $match: { created_at: { $gte: new Date(Date.now() - 30*24*60*60*1000) } } },
  { $group: { 
      _id: { $dateToString: { format: "%Y-%m-%d", date: "$created_at" } },
      orders: { $sum: 1 }
    }
  },
  { $project: { date: "$_id", orders: 1, _id: 0 } },
  { $sort: { date: 1 } }
])
```

## Advanced SQL Examples

### Revenue by Month with Growth Rate
```sql
SELECT 
    DATE_FORMAT(order_date, '%Y-%m') as month,
    SUM(total_amount) as revenue,
    LAG(SUM(total_amount)) OVER (ORDER BY DATE_FORMAT(order_date, '%Y-%m')) as prev_revenue,
    ROUND(
        (SUM(total_amount) - LAG(SUM(total_amount)) OVER (ORDER BY DATE_FORMAT(order_date, '%Y-%m'))) 
        / LAG(SUM(total_amount)) OVER (ORDER BY DATE_FORMAT(order_date, '%Y-%m')) * 100, 2
    ) as growth_rate
FROM orders 
WHERE order_date >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
GROUP BY DATE_FORMAT(order_date, '%Y-%m')
ORDER BY month
```

### Top Products with Customer Segments
```sql
SELECT 
    p.name as product,
    COUNT(DISTINCT o.customer_id) as customers,
    SUM(oi.quantity * oi.price) as revenue,
    CASE 
        WHEN COUNT(DISTINCT o.customer_id) > 100 THEN 'High Volume'
        WHEN COUNT(DISTINCT o.customer_id) > 50 THEN 'Medium Volume'
        ELSE 'Low Volume'
    END as segment
FROM products p
JOIN order_items oi ON p.id = oi.product_id
JOIN orders o ON oi.order_id = o.id
WHERE o.order_date >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
GROUP BY p.id, p.name
HAVING revenue > 1000
ORDER BY revenue DESC
LIMIT 20
```

### User Cohort Analysis
```sql
WITH user_cohorts AS (
    SELECT 
        user_id,
        DATE_FORMAT(MIN(created_at), '%Y-%m') as cohort_month,
        DATE_FORMAT(created_at, '%Y-%m') as order_month
    FROM orders
    GROUP BY user_id, DATE_FORMAT(created_at, '%Y-%m')
)
SELECT 
    cohort_month,
    order_month,
    COUNT(DISTINCT user_id) as users,
    DATEDIFF(STR_TO_DATE(CONCAT(order_month, '-01'), '%Y-%m-%d'), 
             STR_TO_DATE(CONCAT(cohort_month, '-01'), '%Y-%m-%d')) / 30 as month_number
FROM user_cohorts
WHERE cohort_month >= DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 12 MONTH), '%Y-%m')
GROUP BY cohort_month, order_month
ORDER BY cohort_month, month_number
```

## Advanced MongoDB Examples

### Sales Performance by Region
```javascript
db.orders.aggregate([
  {
    $lookup: {
      from: "customers",
      localField: "customer_id",
      foreignField: "_id",
      as: "customer"
    }
  },
  { $unwind: "$customer" },
  {
    $group: {
      _id: "$customer.region",
      total_sales: { $sum: "$total_amount" },
      order_count: { $sum: 1 },
      avg_order_value: { $avg: "$total_amount" },
      unique_customers: { $addToSet: "$customer_id" }
    }
  },
  {
    $project: {
      region: "$_id",
      total_sales: 1,
      order_count: 1,
      avg_order_value: { $round: ["$avg_order_value", 2] },
      customer_count: { $size: "$unique_customers" },
      _id: 0
    }
  },
  { $sort: { total_sales: -1 } }
])
```

### Time-based Trend Analysis
```javascript
db.orders.aggregate([
  {
    $match: {
      created_at: { $gte: new Date(Date.now() - 90*24*60*60*1000) }
    }
  },
  {
    $group: {
      _id: {
        year: { $year: "$created_at" },
        month: { $month: "$created_at" },
        day: { $dayOfMonth: "$created_at" }
      },
      daily_revenue: { $sum: "$total_amount" },
      daily_orders: { $sum: 1 }
    }
  },
  {
    $project: {
      date: {
        $dateFromParts: {
          year: "$_id.year",
          month: "$_id.month",
          day: "$_id.day"
        }
      },
      revenue: "$daily_revenue",
      orders: "$daily_orders",
      _id: 0
    }
  },
  { $sort: { date: 1 } }
])
```

## Query Testing

Before creating a chart, always test your query:

1. **Click "Test Query"** to validate syntax and check results
2. **Review the returned data** structure
3. **Ensure column names** match chart requirements
4. **Check performance** - limit results for better dashboard performance

## Performance Tips

1. **Use LIMIT/limit()** to restrict result sets
2. **Add appropriate indexes** on frequently queried columns
3. **Filter early** with WHERE clauses or $match stages
4. **Avoid SELECT \*** - only return needed columns
5. **Use aggregations** at the database level rather than fetching all data

## Troubleshooting

### Common Issues

**"Query Test Failed"**
- Check SQL/MongoDB syntax
- Verify table/collection names exist
- Ensure proper permissions on database

**"No data available for this chart"**
- Query returns empty result set
- Column names don't match expected format
- Data types are incompatible with chart type

**"Chart not updating"**
- Clear browser cache
- Check network connectivity
- Verify database connection is active

### Column Name Requirements

Charts expect specific column names or patterns:

- **Pie/Donut**: `name` and `value` (case-sensitive)
- **Bar/Line**: Any names work, but should be descriptive
- **Time series**: Use date/datetime formats for X-axis

## Security Considerations

1. **Read-only access** is recommended for dashboard databases
2. **Avoid sensitive data** in chart queries
3. **Use parameterized queries** when possible (future feature)
4. **Limit query complexity** to prevent performance issues
5. **Review queries** before deploying to production dashboards

## Future Enhancements

Planned features for advanced queries:

- **Query parameters** for dynamic filtering
- **Saved query templates** for reuse
- **Query scheduling** for data refresh
- **Query performance monitoring**
- **Visual query builder** for complex joins

---

For more help with SQL or MongoDB syntax, refer to:
- [MySQL Documentation](https://dev.mysql.com/doc/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [MongoDB Aggregation Framework](https://docs.mongodb.com/manual/aggregation/)
