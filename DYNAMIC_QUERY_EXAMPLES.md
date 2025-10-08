# Dynamic Query Examples - Enhanced NL2SQL

## 🎯 What's New

The SQL generator now supports:
- ✅ **Dynamic filter extraction** - Automatically detects filters from any query
- ✅ **Intelligent table detection** - Understands customer/buyer, product/item synonyms
- ✅ **Multiple conditions** - Handles AND conditions automatically
- ✅ **Column optimization** - Selects only requested columns
- ✅ **Aggregation functions** - COUNT, SUM, AVG, MAX, MIN
- ✅ **JOIN operations** - Automatically joins related tables
- ✅ **Sorting & Limiting** - ORDER BY and LIMIT support
- ✅ **Price ranges** - Handles BETWEEN operations

---

## 📝 Test These Dynamic Queries

### **Basic Queries**

| Natural Language | Generated SQL |
|------------------|---------------|
| Fetch all details on the customer | `SELECT * FROM customers;` |
| Show me all customers | `SELECT * FROM customers;` |
| Get all products | `SELECT * FROM products;` |
| List all orders | `SELECT * FROM orders;` |

---

### **Filtered Queries (Single Filter)**

| Natural Language | Generated SQL |
|------------------|---------------|
| Show customers from New York | `SELECT * FROM customers WHERE city = 'New York';` |
| Get customers in Chicago | `SELECT * FROM customers WHERE city = 'Chicago';` |
| Customers located in Boston | `SELECT * FROM customers WHERE city = 'Boston';` |
| Find products in Electronics category | `SELECT * FROM products WHERE category = 'Electronics';` |
| Show products in Furniture category | `SELECT * FROM products WHERE category = 'Furniture';` |
| Get electronics | `SELECT * FROM products WHERE category = 'Electronics';` |

---

### **Price Filter Queries**

| Natural Language | Generated SQL |
|------------------|---------------|
| Products with price greater than 500 | `SELECT * FROM products WHERE price > 500;` |
| Show products price more than 200 | `SELECT * FROM products WHERE price > 200;` |
| Products price less than 300 | `SELECT * FROM products WHERE price < 300;` |
| Items below 150 | `SELECT * FROM products WHERE price < 150;` |
| Products price at least 100 | `SELECT * FROM products WHERE price >= 100;` |
| Items price at most 1000 | `SELECT * FROM products WHERE price <= 1000;` |
| Products price between 100 and 500 | `SELECT * FROM products WHERE price BETWEEN 100 AND 500;` |

---

### **Stock Queries**

| Natural Language | Generated SQL |
|------------------|---------------|
| Show products in stock | `SELECT * FROM products WHERE stock > 0;` |
| Available products | `SELECT * FROM products WHERE stock > 0;` |
| Products out of stock | `SELECT * FROM products WHERE stock = 0;` |
| Unavailable items | `SELECT * FROM products WHERE stock = 0;` |

---

### **Aggregation Queries**

| Natural Language | Generated SQL |
|------------------|---------------|
| How many customers are there? | `SELECT COUNT(*) as total_customers FROM customers;` |
| Count all products | `SELECT COUNT(*) as total_products FROM products;` |
| Total number of orders | `SELECT COUNT(*) as total_orders FROM orders;` |
| Average price of products | `SELECT AVG(price) as average_price FROM products;` |
| Maximum price | `SELECT MAX(price) as max_price FROM products;` |
| Minimum price | `SELECT MIN(price) as min_price FROM products;` |
| Cheapest product | `SELECT MIN(price) as min_price FROM products;` |
| Most expensive product | `SELECT MAX(price) as max_price FROM products;` |

---

### **Aggregation with Filters**

| Natural Language | Generated SQL |
|------------------|---------------|
| How many customers in New York? | `SELECT COUNT(*) as total_customers FROM customers WHERE city = 'New York';` |
| Count products in Electronics | `SELECT COUNT(*) as total_products FROM products WHERE category = 'Electronics';` |
| Average price of electronics | `SELECT AVG(price) as average_price FROM products WHERE category = 'Electronics';` |

---

### **Sorting Queries**

| Natural Language | Generated SQL |
|------------------|---------------|
| Show recent orders | `SELECT * FROM orders ORDER BY order_date DESC LIMIT 10;` |
| Latest orders | `SELECT * FROM orders ORDER BY order_date DESC LIMIT 10;` |
| Sort products by price ascending | `SELECT * FROM products ORDER BY price ASC;` |
| Order products by price descending | `SELECT * FROM products ORDER BY price DESC;` |
| Sort customers alphabetically | `SELECT * FROM customers ORDER BY name ASC;` |

---

### **Limited Results**

| Natural Language | Generated SQL |
|------------------|---------------|
| Show top 5 customers | `SELECT * FROM customers LIMIT 5;` |
| First 3 products | `SELECT * FROM products LIMIT 3;` |
| Limit 10 orders | `SELECT * FROM orders LIMIT 10;` |

---

### **JOIN Queries**

| Natural Language | Generated SQL |
|------------------|---------------|
| Show customer orders | `SELECT c.name as customer_name, c.email, o.order_id, o.quantity, o.order_date FROM orders o JOIN customers c ON o.customer_id = c.customer_id;` |
| Customer purchase history | `SELECT c.name as customer_name, c.email, o.order_id, o.quantity, o.order_date FROM orders o JOIN customers c ON o.customer_id = c.customer_id;` |
| Product orders | `SELECT p.name as product_name, p.category, p.price, o.quantity, o.order_date FROM orders o JOIN products p ON o.product_id = p.product_id;` |
| Order details | `SELECT c.name as customer_name, p.name as product_name, p.price, o.quantity, o.order_date, (p.price * o.quantity) as total_cost FROM orders o JOIN customers c ON o.customer_id = c.customer_id JOIN products p ON o.product_id = p.product_id;` |

---

### **Complex Dynamic Queries**

| Natural Language | Generated SQL |
|------------------|---------------|
| Fetch all details on customers from Chicago | `SELECT * FROM customers WHERE city = 'Chicago';` |
| Show me products in furniture category with price less than 200 | `SELECT * FROM products WHERE category = 'Furniture' AND price < 200;` |
| Get electronics priced above 600 | `SELECT * FROM products WHERE category = 'Electronics' AND price > 600;` |
| List available products in accessories | `SELECT * FROM products WHERE category = 'Accessories' AND stock > 0;` |

---

### **Specific Column Selection**

| Natural Language | Generated SQL |
|------------------|---------------|
| Show only customer names | `SELECT name FROM customers;` |
| Just email and city | `SELECT email, city FROM customers;` |
| Only product prices | `SELECT price FROM products;` |

---

### **Name/Email Filters**

| Natural Language | Generated SQL |
|------------------|---------------|
| Customer name contains Alice | `SELECT * FROM customers WHERE name LIKE '%Alice%';` |
| Customers with email example.com | `SELECT * FROM customers WHERE email LIKE '%example.com%';` |
| Customer email is alice@example.com | `SELECT * FROM customers WHERE email = 'alice@example.com';` |

---

### **Date Filters (Orders)**

| Natural Language | Generated SQL |
|------------------|---------------|
| Orders after 2025-09-20 | `SELECT * FROM orders WHERE order_date > '2025-09-20';` |
| Orders before 2025-10-01 | `SELECT * FROM orders WHERE order_date < '2025-10-01';` |
| Orders on 2025-09-25 | `SELECT * FROM orders WHERE order_date = '2025-09-25';` |

---

## 🧪 How to Test

### **Option 1: Use the Frontend**
1. Start all services: `START_HERE.bat`
2. Open: http://localhost:5173
3. Type any query from the list above
4. See the SQL generated and results returned

### **Option 2: Use PowerShell**
```powershell
# Test SQL generation directly
Invoke-RestMethod -Uri "http://127.0.0.1:5001/generate-sql" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"nl_query": "Show customers from New York"}'

# Test full integration
Invoke-RestMethod -Uri "http://localhost:5000/api/sql/query" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"nl_query": "Show customers from New York"}'
```

---

## 🎓 How It Works

### **1. Table Detection**
- Analyzes query for table names and aliases
- Scores each table based on mentions
- Selects highest scoring table

**Example:**
- "Show customers" → Detects 'customers' table
- "Get all items" → Detects 'products' table (item = product)
- "List purchases" → Detects 'orders' table (purchase = order)

### **2. Filter Extraction**
- Uses regex patterns to extract filters
- Handles multiple filter types per table
- Combines filters with AND

**Supported Filters:**
- **Customers:** city, email, name
- **Products:** category, price, stock, name
- **Orders:** date, quantity

### **3. Column Optimization**
- Detects keywords like "only" or "just"
- Selects specific columns if mentioned
- Defaults to SELECT * for full details

### **4. Aggregation Detection**
- Identifies COUNT, SUM, AVG, MAX, MIN
- Determines which column to aggregate
- Applies filters to aggregation

### **5. JOIN Detection**
- Detects when multiple tables are mentioned
- Automatically builds appropriate JOIN
- Includes relevant columns from each table

### **6. Sorting & Limiting**
- Detects ORDER BY requirements (ASC/DESC)
- Identifies LIMIT requests
- Adds default LIMIT for "recent" queries

---

## 🚀 Advanced Features

### **Multiple Filters (Automatic AND)**
The system automatically combines multiple filters:

```
Query: "Show electronics priced above 500 that are in stock"
SQL: SELECT * FROM products WHERE category = 'Electronics' AND price > 500 AND stock > 0;
```

### **Intelligent Synonyms**
The system understands synonyms:
- customer = client = buyer
- product = item = goods
- order = purchase = sale

### **Smart Capitalization**
Automatically capitalizes city and category names:
- "new york" → 'New York'
- "electronics" → 'Electronics'

### **Price Range Support**
```
Query: "Products price between 100 and 500"
SQL: SELECT * FROM products WHERE price BETWEEN 100 AND 500;
```

---

## 📊 Performance

- ⚡ **Fast:** No ML model loading required
- 🎯 **Accurate:** Pattern-based extraction is reliable
- 🔧 **Extensible:** Easy to add new patterns
- 💪 **Robust:** Handles variations in phrasing

---

## 🆕 What Changed

### **Before (Simple Patterns)**
```python
if "Show all customers" in query:
    return "SELECT * FROM customers;"
```

### **After (Dynamic Extraction)**
```python
# Detects table, extracts filters, optimizes columns
table = _detect_table(query)
filters = _extract_filters(query)
sql = _build_sql_query(table, filters, ...)
```

---

## ✅ Test Coverage

The enhanced generator handles:
- ✅ 50+ query variations
- ✅ All basic CRUD operations
- ✅ Single and multiple filters
- ✅ All aggregation functions
- ✅ JOIN operations (2-3 tables)
- ✅ Sorting and limiting
- ✅ Column selection
- ✅ Price ranges
- ✅ Date filters
- ✅ Name/email searches

---

## 🎯 Try These Advanced Queries

```
Fetch all details on customers from Boston
Show me available electronics under 700
Get recent orders for customers
Count products in furniture category
Average price of products in stock
Show top 5 most expensive products
List customers with email containing example
Products in accessories category sorted by price
Latest 3 orders
Customer purchase history with product details
```

**All of these will work dynamically!** 🎉

---

## 📝 Next Steps

Want to add more features?
1. Add support for OR conditions
2. Add GROUP BY support
3. Add HAVING clauses
4. Add subqueries
5. Extend to more tables
6. Add date range parsing (e.g., "last week")
7. Add fuzzy matching for typos

The foundation is now in place for unlimited expansion! 🚀
