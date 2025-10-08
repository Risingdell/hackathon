-- Drop existing tables if they exist (for re-initialization)
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS customers;
DROP TABLE IF EXISTS products;

-- Create customers table
CREATE TABLE customers (
    customer_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    city VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create products table
CREATE TABLE products (
    product_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50),
    price DECIMAL(10, 2) NOT NULL,
    stock INT DEFAULT 0
);

-- Create orders table (relation between customers and products)
CREATE TABLE orders (
    order_id SERIAL PRIMARY KEY,
    customer_id INT REFERENCES customers(customer_id) ON DELETE CASCADE,
    product_id INT REFERENCES products(product_id) ON DELETE CASCADE,
    quantity INT NOT NULL,
    order_date DATE DEFAULT CURRENT_DATE
);

-- Insert sample customers
INSERT INTO customers (name, email, city) VALUES
('Alice Johnson', 'alice@example.com', 'New York'),
('Bob Smith', 'bob@example.com', 'Chicago'),
('Charlie Lee', 'charlie@example.com', 'San Francisco'),
('Diana Brown', 'diana@example.com', 'Boston');

-- Insert sample products
INSERT INTO products (name, category, price, stock) VALUES
('Laptop', 'Electronics', 999.99, 10),
('Smartphone', 'Electronics', 699.00, 25),
('Headphones', 'Accessories', 199.50, 50),
('Office Chair', 'Furniture', 149.99, 15);

-- Insert sample orders
INSERT INTO orders (customer_id, product_id, quantity, order_date) VALUES
(1, 1, 1, '2025-09-15'),
(1, 3, 2, '2025-09-20'),
(2, 2, 1, '2025-09-25'),
(3, 1, 2, '2025-09-28'),
(3, 4, 1, '2025-10-01'),
(4, 3, 3, '2025-10-03');
