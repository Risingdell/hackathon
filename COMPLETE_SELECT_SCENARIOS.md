# Complete SELECT Statement Scenarios for NL2SQL

## 🎯 Comprehensive Coverage Map

This document catalogs **ALL possible SELECT statement scenarios** for natural language to SQL translation.

---

## 📊 **Category 1: Basic SELECT Queries**

### **1.1 Simple SELECT All**
```
NL: "Show all customers"
SQL: SELECT * FROM customers;
```

### **1.2 SELECT Specific Columns**
```
NL: "Show customer names and emails"
SQL: SELECT name, email FROM customers;

NL: "Get only product prices"
SQL: SELECT price FROM products;
```

### **1.3 SELECT with Aliases**
```
NL: "Show customer names as full_name"
SQL: SELECT name AS full_name FROM customers;
```

---

## 🔍 **Category 2: WHERE Clause - Single Conditions**

### **2.1 Equality (=)**
```
NL: "Customers from New York"
SQL: SELECT * FROM customers WHERE city = 'New York';

NL: "Products priced at 100"
SQL: SELECT * FROM products WHERE price = 100;
```

### **2.2 Inequality (!=, <>)**
```
NL: "Customers not from New York"
SQL: SELECT * FROM customers WHERE city != 'New York';

NL: "Products not in Electronics"
SQL: SELECT * FROM products WHERE category <> 'Electronics';
```

### **2.3 Comparison Operators (>, <, >=, <=)**
```
NL: "Products more expensive than 500"
SQL: SELECT * FROM products WHERE price > 500;

NL: "Products at least 100"
SQL: SELECT * FROM products WHERE price >= 100;

NL: "Products cheaper than 200"
SQL: SELECT * FROM products WHERE price < 200;

NL: "Products at most 1000"
SQL: SELECT * FROM products WHERE price <= 1000;
```

### **2.4 BETWEEN**
```
NL: "Products priced between 100 and 500"
SQL: SELECT * FROM products WHERE price BETWEEN 100 AND 500;

NL: "Orders between 2025-01-01 and 2025-12-31"
SQL: SELECT * FROM orders WHERE order_date BETWEEN '2025-01-01' AND '2025-12-31';
```

### **2.5 IN**
```
NL: "Customers from New York, Chicago, or Boston"
SQL: SELECT * FROM customers WHERE city IN ('New York', 'Chicago', 'Boston');

NL: "Products in Electronics, Furniture, or Accessories"
SQL: SELECT * FROM products WHERE category IN ('Electronics', 'Furniture', 'Accessories');
```

### **2.6 NOT IN**
```
NL: "Customers not from New York or Chicago"
SQL: SELECT * FROM customers WHERE city NOT IN ('New York', 'Chicago');
```

### **2.7 LIKE (Pattern Matching)**
```
NL: "Customers whose name starts with A"
SQL: SELECT * FROM customers WHERE name LIKE 'A%';

NL: "Customers whose name ends with son"
SQL: SELECT * FROM customers WHERE name LIKE '%son';

NL: "Customers whose name contains Alice"
SQL: SELECT * FROM customers WHERE name LIKE '%Alice%';

NL: "Products starting with Lap"
SQL: SELECT * FROM products WHERE name LIKE 'Lap%';
```

### **2.8 NOT LIKE**
```
NL: "Customers whose name doesn't contain Smith"
SQL: SELECT * FROM customers WHERE name NOT LIKE '%Smith%';
```

### **2.9 IS NULL**
```
NL: "Customers without an email"
SQL: SELECT * FROM customers WHERE email IS NULL;

NL: "Products with no stock information"
SQL: SELECT * FROM products WHERE stock IS NULL;
```

### **2.10 IS NOT NULL**
```
NL: "Customers with an email"
SQL: SELECT * FROM customers WHERE email IS NOT NULL;

NL: "Products with stock information"
SQL: SELECT * FROM products WHERE stock IS NOT NULL;
```

---

## 🔗 **Category 3: WHERE Clause - Multiple Conditions**

### **3.1 AND (All conditions must be true)**
```
NL: "Electronics priced above 500"
SQL: SELECT * FROM products WHERE category = 'Electronics' AND price > 500;

NL: "Customers from New York with email"
SQL: SELECT * FROM customers WHERE city = 'New York' AND email IS NOT NULL;

NL: "Available electronics under 700"
SQL: SELECT * FROM products WHERE category = 'Electronics' AND price < 700 AND stock > 0;
```

### **3.2 OR (Any condition can be true)**
```
NL: "Customers from New York or Chicago"
SQL: SELECT * FROM customers WHERE city = 'New York' OR city = 'Chicago';

NL: "Products in Electronics or Furniture"
SQL: SELECT * FROM products WHERE category = 'Electronics' OR category = 'Furniture';
```

### **3.3 Combined AND/OR with Parentheses**
```
NL: "Electronics over 500 or Furniture under 200"
SQL: SELECT * FROM products WHERE (category = 'Electronics' AND price > 500) OR (category = 'Furniture' AND price < 200);

NL: "Customers from New York or Chicago who have email"
SQL: SELECT * FROM customers WHERE (city = 'New York' OR city = 'Chicago') AND email IS NOT NULL;
```

### **3.4 NOT (Negation)**
```
NL: "Products not in Electronics category"
SQL: SELECT * FROM products WHERE NOT category = 'Electronics';

NL: "Customers not from New York and not from Chicago"
SQL: SELECT * FROM customers WHERE NOT (city = 'New York' OR city = 'Chicago');
```

---

## 📈 **Category 4: Aggregation Functions**

### **4.1 COUNT**
```
NL: "How many customers are there?"
SQL: SELECT COUNT(*) AS total_customers FROM customers;

NL: "Count customers from New York"
SQL: SELECT COUNT(*) AS total_customers FROM customers WHERE city = 'New York';

NL: "Count distinct cities"
SQL: SELECT COUNT(DISTINCT city) AS unique_cities FROM customers;
```

### **4.2 SUM**
```
NL: "Total revenue from orders"
SQL: SELECT SUM(price * quantity) AS total_revenue FROM orders JOIN products ON orders.product_id = products.product_id;

NL: "Sum of all product prices"
SQL: SELECT SUM(price) AS total_price FROM products;
```

### **4.3 AVG**
```
NL: "Average price of products"
SQL: SELECT AVG(price) AS average_price FROM products;

NL: "Average price of electronics"
SQL: SELECT AVG(price) AS avg_electronics_price FROM products WHERE category = 'Electronics';
```

### **4.4 MAX**
```
NL: "Most expensive product"
SQL: SELECT MAX(price) AS max_price FROM products;

NL: "Highest price in electronics"
SQL: SELECT MAX(price) AS max_electronics_price FROM products WHERE category = 'Electronics';
```

### **4.5 MIN**
```
NL: "Cheapest product"
SQL: SELECT MIN(price) AS min_price FROM products;

NL: "Lowest price in furniture"
SQL: SELECT MIN(price) AS min_furniture_price FROM products WHERE category = 'Furniture';
```

---

## 👥 **Category 5: GROUP BY**

### **5.1 Simple GROUP BY**
```
NL: "Count customers by city"
SQL: SELECT city, COUNT(*) AS customer_count FROM customers GROUP BY city;

NL: "Count products by category"
SQL: SELECT category, COUNT(*) AS product_count FROM products GROUP BY category;
```

### **5.2 GROUP BY with Aggregations**
```
NL: "Average price by category"
SQL: SELECT category, AVG(price) AS avg_price FROM products GROUP BY category;

NL: "Total orders by customer"
SQL: SELECT customer_id, COUNT(*) AS order_count FROM orders GROUP BY customer_id;

NL: "Total revenue by product"
SQL: SELECT product_id, SUM(quantity * price) AS revenue FROM orders JOIN products ON orders.product_id = products.product_id GROUP BY product_id;
```

### **5.3 GROUP BY Multiple Columns**
```
NL: "Count orders by customer and product"
SQL: SELECT customer_id, product_id, COUNT(*) AS order_count FROM orders GROUP BY customer_id, product_id;
```

---

## 🎯 **Category 6: HAVING Clause**

### **6.1 HAVING with Aggregations**
```
NL: "Categories with more than 2 products"
SQL: SELECT category, COUNT(*) AS product_count FROM products GROUP BY category HAVING COUNT(*) > 2;

NL: "Cities with at least 3 customers"
SQL: SELECT city, COUNT(*) AS customer_count FROM customers GROUP BY city HAVING COUNT(*) >= 3;

NL: "Customers who ordered more than 5 times"
SQL: SELECT customer_id, COUNT(*) AS order_count FROM orders GROUP BY customer_id HAVING COUNT(*) > 5;
```

### **6.2 HAVING with WHERE**
```
NL: "Categories with average price above 500 for available products"
SQL: SELECT category, AVG(price) AS avg_price FROM products WHERE stock > 0 GROUP BY category HAVING AVG(price) > 500;
```

---

## 🔄 **Category 7: ORDER BY**

### **7.1 ORDER BY Single Column ASC**
```
NL: "Customers sorted by name"
SQL: SELECT * FROM customers ORDER BY name ASC;

NL: "Products sorted by price lowest first"
SQL: SELECT * FROM products ORDER BY price ASC;
```

### **7.2 ORDER BY Single Column DESC**
```
NL: "Recent orders"
SQL: SELECT * FROM orders ORDER BY order_date DESC;

NL: "Most expensive products first"
SQL: SELECT * FROM products ORDER BY price DESC;
```

### **7.3 ORDER BY Multiple Columns**
```
NL: "Customers sorted by city then name"
SQL: SELECT * FROM customers ORDER BY city ASC, name ASC;

NL: "Products sorted by category then price descending"
SQL: SELECT * FROM products ORDER BY category ASC, price DESC;
```

### **7.4 ORDER BY with Aggregation**
```
NL: "Categories by product count descending"
SQL: SELECT category, COUNT(*) AS product_count FROM products GROUP BY category ORDER BY product_count DESC;
```

---

## 🎚️ **Category 8: LIMIT & OFFSET**

### **8.1 LIMIT**
```
NL: "Top 5 customers"
SQL: SELECT * FROM customers LIMIT 5;

NL: "First 10 products"
SQL: SELECT * FROM products LIMIT 10;
```

### **8.2 LIMIT with ORDER BY**
```
NL: "Top 3 most expensive products"
SQL: SELECT * FROM products ORDER BY price DESC LIMIT 3;

NL: "5 most recent orders"
SQL: SELECT * FROM orders ORDER BY order_date DESC LIMIT 5;
```

### **8.3 OFFSET (Pagination)**
```
NL: "Next 10 customers after first 20"
SQL: SELECT * FROM customers LIMIT 10 OFFSET 20;

NL: "Products 11 through 20"
SQL: SELECT * FROM products LIMIT 10 OFFSET 10;
```

---

## 🔗 **Category 9: JOIN Operations**

### **9.1 INNER JOIN**
```
NL: "Customer orders"
SQL: SELECT c.name, o.order_id, o.order_date FROM customers c INNER JOIN orders o ON c.customer_id = o.customer_id;

NL: "Products ordered"
SQL: SELECT p.name, o.quantity FROM products p INNER JOIN orders o ON p.product_id = o.product_id;
```

### **9.2 LEFT JOIN (LEFT OUTER JOIN)**
```
NL: "All customers and their orders if any"
SQL: SELECT c.name, o.order_id FROM customers c LEFT JOIN orders o ON c.customer_id = o.customer_id;

NL: "Products with or without orders"
SQL: SELECT p.name, o.order_id FROM products p LEFT JOIN orders o ON p.product_id = o.product_id;
```

### **9.3 RIGHT JOIN**
```
NL: "All orders and customer info if available"
SQL: SELECT c.name, o.order_id FROM customers c RIGHT JOIN orders o ON c.customer_id = o.customer_id;
```

### **9.4 FULL OUTER JOIN**
```
NL: "All customers and orders whether matched or not"
SQL: SELECT c.name, o.order_id FROM customers c FULL OUTER JOIN orders o ON c.customer_id = o.customer_id;
```

### **9.5 Multiple JOINs**
```
NL: "Complete order details with customer and product"
SQL: SELECT c.name AS customer, p.name AS product, o.quantity, o.order_date
     FROM orders o
     JOIN customers c ON o.customer_id = c.customer_id
     JOIN products p ON o.product_id = p.product_id;
```

### **9.6 Self JOIN**
```
NL: "Customers from the same city"
SQL: SELECT c1.name AS customer1, c2.name AS customer2, c1.city
     FROM customers c1
     JOIN customers c2 ON c1.city = c2.city AND c1.customer_id < c2.customer_id;
```

---

## 🎁 **Category 10: DISTINCT**

### **10.1 SELECT DISTINCT**
```
NL: "Unique cities where customers live"
SQL: SELECT DISTINCT city FROM customers;

NL: "All unique categories"
SQL: SELECT DISTINCT category FROM products;
```

### **10.2 DISTINCT with COUNT**
```
NL: "Number of unique cities"
SQL: SELECT COUNT(DISTINCT city) AS unique_cities FROM customers;
```

---

## 🔢 **Category 11: Subqueries (Nested Queries)**

### **11.1 Subquery in WHERE**
```
NL: "Customers who have placed orders"
SQL: SELECT * FROM customers WHERE customer_id IN (SELECT DISTINCT customer_id FROM orders);

NL: "Products more expensive than average"
SQL: SELECT * FROM products WHERE price > (SELECT AVG(price) FROM products);
```

### **11.2 Subquery in FROM**
```
NL: "Average order quantity per customer"
SQL: SELECT AVG(order_count) AS avg_orders FROM (SELECT customer_id, COUNT(*) AS order_count FROM orders GROUP BY customer_id) AS customer_orders;
```

### **11.3 Correlated Subquery**
```
NL: "Customers who ordered more than the average for their city"
SQL: SELECT c1.name FROM customers c1
     WHERE (SELECT COUNT(*) FROM orders o WHERE o.customer_id = c1.customer_id) >
     (SELECT AVG(order_count) FROM (SELECT customer_id, COUNT(*) AS order_count FROM orders o2
      JOIN customers c2 ON o2.customer_id = c2.customer_id WHERE c2.city = c1.city GROUP BY customer_id) AS city_avg);
```

### **11.4 EXISTS**
```
NL: "Customers who have placed at least one order"
SQL: SELECT * FROM customers c WHERE EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.customer_id);
```

### **11.5 NOT EXISTS**
```
NL: "Customers who haven't placed any orders"
SQL: SELECT * FROM customers c WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.customer_id);
```

---

## 📅 **Category 12: Date and Time Functions**

### **12.1 Date Comparisons**
```
NL: "Orders from today"
SQL: SELECT * FROM orders WHERE order_date = CURRENT_DATE;

NL: "Orders from last week"
SQL: SELECT * FROM orders WHERE order_date >= CURRENT_DATE - INTERVAL '7 days';

NL: "Orders from this month"
SQL: SELECT * FROM orders WHERE EXTRACT(MONTH FROM order_date) = EXTRACT(MONTH FROM CURRENT_DATE)
     AND EXTRACT(YEAR FROM order_date) = EXTRACT(YEAR FROM CURRENT_DATE);
```

### **12.2 Date Extraction**
```
NL: "Orders by year"
SQL: SELECT EXTRACT(YEAR FROM order_date) AS year, COUNT(*) AS order_count FROM orders GROUP BY EXTRACT(YEAR FROM order_date);

NL: "Orders by month"
SQL: SELECT EXTRACT(MONTH FROM order_date) AS month, COUNT(*) AS order_count FROM orders GROUP BY EXTRACT(MONTH FROM order_date);
```

### **12.3 Date Formatting**
```
NL: "Orders with formatted dates"
SQL: SELECT order_id, TO_CHAR(order_date, 'YYYY-MM-DD') AS formatted_date FROM orders;
```

---

## 🧮 **Category 13: Mathematical Operations**

### **13.1 Basic Arithmetic**
```
NL: "Order total cost"
SQL: SELECT order_id, quantity * price AS total_cost FROM orders JOIN products ON orders.product_id = products.product_id;

NL: "Discounted price at 10%"
SQL: SELECT name, price, price * 0.9 AS discounted_price FROM products;
```

### **13.2 ROUND, CEIL, FLOOR**
```
NL: "Average price rounded to 2 decimals"
SQL: SELECT ROUND(AVG(price), 2) AS avg_price FROM products;

NL: "Ceiling of prices"
SQL: SELECT name, CEIL(price) AS ceiling_price FROM products;
```

---

## 🔤 **Category 14: String Functions**

### **14.1 CONCAT**
```
NL: "Full customer details with city"
SQL: SELECT CONCAT(name, ' - ', city) AS customer_info FROM customers;
```

### **14.2 UPPER, LOWER**
```
NL: "Customer names in uppercase"
SQL: SELECT UPPER(name) AS uppercase_name FROM customers;

NL: "Product names in lowercase"
SQL: SELECT LOWER(name) AS lowercase_name FROM products;
```

### **14.3 LENGTH**
```
NL: "Customers with names longer than 10 characters"
SQL: SELECT * FROM customers WHERE LENGTH(name) > 10;
```

### **14.4 SUBSTRING**
```
NL: "First 5 characters of product names"
SQL: SELECT SUBSTRING(name, 1, 5) AS short_name FROM products;
```

---

## 🎯 **Category 15: CASE Statements**

### **15.1 Simple CASE**
```
NL: "Categorize products by price range"
SQL: SELECT name, price,
     CASE
       WHEN price < 100 THEN 'Cheap'
       WHEN price BETWEEN 100 AND 500 THEN 'Medium'
       ELSE 'Expensive'
     END AS price_category
     FROM products;
```

### **15.2 CASE with Aggregation**
```
NL: "Count products in each price range"
SQL: SELECT
     CASE
       WHEN price < 100 THEN 'Cheap'
       WHEN price BETWEEN 100 AND 500 THEN 'Medium'
       ELSE 'Expensive'
     END AS price_range,
     COUNT(*) AS product_count
     FROM products
     GROUP BY price_range;
```

---

## 🌐 **Category 16: UNION Operations**

### **16.1 UNION (Remove Duplicates)**
```
NL: "All cities from customers or product warehouses"
SQL: SELECT city FROM customers UNION SELECT location AS city FROM warehouses;
```

### **16.2 UNION ALL (Keep Duplicates)**
```
NL: "All customer and supplier names combined"
SQL: SELECT name FROM customers UNION ALL SELECT name FROM suppliers;
```

---

## 🔍 **Category 17: Window Functions**

### **17.1 ROW_NUMBER**
```
NL: "Rank products by price within each category"
SQL: SELECT name, category, price, ROW_NUMBER() OVER (PARTITION BY category ORDER BY price DESC) AS rank FROM products;
```

### **17.2 RANK & DENSE_RANK**
```
NL: "Rank customers by order count"
SQL: SELECT c.name, COUNT(o.order_id) AS order_count,
     RANK() OVER (ORDER BY COUNT(o.order_id) DESC) AS rank
     FROM customers c
     LEFT JOIN orders o ON c.customer_id = o.customer_id
     GROUP BY c.name;
```

### **17.3 Running Totals**
```
NL: "Running total of sales"
SQL: SELECT order_date, quantity, SUM(quantity) OVER (ORDER BY order_date) AS running_total FROM orders;
```

---

## ⚠️ **Category 18: Edge Cases & Special Scenarios**

### **18.1 Empty Results**
```
NL: "Customers from Antarctica"
SQL: SELECT * FROM customers WHERE city = 'Antarctica';
-- Returns empty set
```

### **18.2 NULL Handling**
```
NL: "Products with unknown stock"
SQL: SELECT * FROM products WHERE stock IS NULL;

NL: "Customers with email or default email"
SQL: SELECT name, COALESCE(email, 'noemail@example.com') AS email FROM customers;
```

### **18.3 Division by Zero**
```
NL: "Average price per product (handle zero stock)"
SQL: SELECT name,
     CASE WHEN stock = 0 THEN NULL ELSE price / stock END AS price_per_unit
     FROM products;
```

### **18.4 Case Sensitivity**
```
NL: "Customers with name containing 'alice' (case insensitive)"
SQL: SELECT * FROM customers WHERE LOWER(name) LIKE '%alice%';
```

### **18.5 Special Characters in Strings**
```
NL: "Products with apostrophe in name"
SQL: SELECT * FROM products WHERE name LIKE '%''%';
```

---

## 📊 **Total Scenarios Covered: 150+**

### **Summary by Category:**
1. Basic SELECT: 3 scenarios
2. Single WHERE: 10 scenarios
3. Multiple WHERE: 4 scenarios
4. Aggregations: 5 scenarios
5. GROUP BY: 3 scenarios
6. HAVING: 2 scenarios
7. ORDER BY: 4 scenarios
8. LIMIT/OFFSET: 3 scenarios
9. JOINs: 6 scenarios
10. DISTINCT: 2 scenarios
11. Subqueries: 5 scenarios
12. Date/Time: 3 scenarios
13. Math Operations: 2 scenarios
14. String Functions: 4 scenarios
15. CASE: 2 scenarios
16. UNION: 2 scenarios
17. Window Functions: 3 scenarios
18. Edge Cases: 5 scenarios

**Total: 68 base scenarios × variations = 150+ unique SQL patterns**

---

## 🎯 Implementation Priority

### **Phase 1: Essential (Already Done)**
- ✅ Basic SELECT
- ✅ Single WHERE with common operators
- ✅ Basic aggregations
- ✅ Simple JOINs
- ✅ ORDER BY, LIMIT

### **Phase 2: Advanced (Next)**
- 🔄 Multiple WHERE with AND/OR
- 🔄 GROUP BY + HAVING
- 🔄 DISTINCT
- 🔄 IN/NOT IN
- 🔄 LIKE patterns
- 🔄 NULL handling

### **Phase 3: Expert (Future)**
- ⏳ Subqueries
- ⏳ Window functions
- ⏳ CASE statements
- ⏳ Date/time functions
- ⏳ Complex JOINs (self, outer)
- ⏳ UNION operations

This comprehensive map ensures your NL2SQL system can handle virtually ANY natural language query! 🚀
