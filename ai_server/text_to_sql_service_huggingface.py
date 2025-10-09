# text_to_sql_service_huggingface.py
import os
import httpx
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables from project root
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

HUGGINGFACE_API_KEY = os.getenv("HUGGINGFACE_API_KEY")
HUGGINGFACE_API_URL = os.getenv("HUGGINGFACE_API_URL", "https://api-inference.huggingface.co/models/")
HUGGINGFACE_MODEL = os.getenv("HUGGINGFACE_MODEL", "NumbersStation/nsql-llama-2-7B")


async def generate_sql_with_huggingface_mock(natural_language_query: str, schema_context: str = "") -> dict:
    """
    Generate SQL using an improved rule-based approach (mock).
    This is a fallback when Hugging Face API is not available.
    """
    query_lower = natural_language_query.lower()

    # Pattern matching for various query types

    # Highest/Maximum price products
    if ("highest" in query_lower or "maximum" in query_lower or "max" in query_lower) and "price" in query_lower:
        if "product" in query_lower:
            sql = "SELECT * FROM products ORDER BY price DESC LIMIT 1;"
        else:
            sql = "SELECT * FROM products ORDER BY price DESC LIMIT 1;"

    # Lowest/Minimum price products
    elif ("lowest" in query_lower or "minimum" in query_lower or "min" in query_lower) and "price" in query_lower:
        if "product" in query_lower:
            sql = "SELECT * FROM products ORDER BY price ASC LIMIT 1;"
        else:
            sql = "SELECT * FROM products ORDER BY price ASC LIMIT 1;"

    # Most expensive products (top N)
    elif ("most expensive" in query_lower or "top" in query_lower) and ("product" in query_lower or "item" in query_lower):
        # Try to extract number
        import re
        numbers = re.findall(r'\d+', query_lower)
        limit = numbers[0] if numbers else "5"
        sql = f"SELECT * FROM products ORDER BY price DESC LIMIT {limit};"

    # Cheapest products (bottom N)
    elif ("cheapest" in query_lower or "least expensive" in query_lower) and ("product" in query_lower or "item" in query_lower):
        import re
        numbers = re.findall(r'\d+', query_lower)
        limit = numbers[0] if numbers else "5"
        sql = f"SELECT * FROM products ORDER BY price ASC LIMIT {limit};"

    # Products by category
    elif "category" in query_lower and "product" in query_lower:
        if "electronics" in query_lower:
            sql = "SELECT * FROM products WHERE category = 'Electronics';"
        elif "furniture" in query_lower:
            sql = "SELECT * FROM products WHERE category = 'Furniture';"
        elif "accessories" in query_lower:
            sql = "SELECT * FROM products WHERE category = 'Accessories';"
        else:
            sql = "SELECT * FROM products;"

    # Price range queries
    elif "price" in query_lower and ("greater" in query_lower or "more than" in query_lower or "above" in query_lower or ">" in query_lower):
        import re
        numbers = re.findall(r'\d+', query_lower)
        price_val = numbers[0] if numbers else "100"
        sql = f"SELECT * FROM products WHERE price > {price_val};"

    elif "price" in query_lower and ("less" in query_lower or "under" in query_lower or "below" in query_lower or "<" in query_lower):
        import re
        numbers = re.findall(r'\d+', query_lower)
        price_val = numbers[0] if numbers else "100"
        sql = f"SELECT * FROM products WHERE price < {price_val};"

    # Count queries
    elif "how many" in query_lower or "count" in query_lower:
        if "product" in query_lower:
            sql = "SELECT COUNT(*) as total_products FROM products;"
        elif "customer" in query_lower:
            sql = "SELECT COUNT(*) as total_customers FROM customers;"
        elif "order" in query_lower:
            sql = "SELECT COUNT(*) as total_orders FROM orders;"
        else:
            sql = "SELECT COUNT(*) FROM products;"

    # Average/Total queries
    elif "average" in query_lower or "avg" in query_lower:
        if "price" in query_lower:
            sql = "SELECT AVG(price) as average_price FROM products;"
        else:
            sql = "SELECT AVG(price) as average_price FROM products;"

    elif "total" in query_lower and "price" in query_lower:
        sql = "SELECT SUM(price) as total_price FROM products;"

    # Stock/Inventory queries
    elif "stock" in query_lower or "inventory" in query_lower:
        if "low" in query_lower or "out of" in query_lower:
            sql = "SELECT * FROM products WHERE stock < 10;"
        else:
            sql = "SELECT * FROM products ORDER BY stock DESC;"

    # Customer queries
    elif "all customers" in query_lower or "show customers" in query_lower or "list customers" in query_lower:
        sql = "SELECT * FROM customers;"

    elif "customer" in query_lower and ("city" in query_lower or "location" in query_lower):
        if "new york" in query_lower:
            sql = "SELECT * FROM customers WHERE city = 'New York';"
        elif "chicago" in query_lower:
            sql = "SELECT * FROM customers WHERE city = 'Chicago';"
        else:
            sql = "SELECT * FROM customers;"

    # Order queries
    elif "all orders" in query_lower or "show orders" in query_lower or "list orders" in query_lower:
        sql = "SELECT * FROM orders;"

    elif "recent orders" in query_lower or "latest orders" in query_lower:
        sql = "SELECT * FROM orders ORDER BY order_date DESC LIMIT 10;"

    # Product name search
    elif "product" in query_lower and ("name" in query_lower or "called" in query_lower):
        sql = "SELECT * FROM products;"

    # Default: all products
    elif "all products" in query_lower or "show products" in query_lower or "list products" in query_lower:
        sql = "SELECT * FROM products;"

    # If nothing matches, try to be smart about table selection
    else:
        if "product" in query_lower:
            sql = f"SELECT * FROM products; -- Query: {natural_language_query}"
        elif "customer" in query_lower:
            sql = f"SELECT * FROM customers; -- Query: {natural_language_query}"
        elif "order" in query_lower:
            sql = f"SELECT * FROM orders; -- Query: {natural_language_query}"
        else:
            sql = f"SELECT * FROM products; -- Query: {natural_language_query}"

    return {
        "success": True,
        "sql": sql,
        "raw_response": {"note": "Using improved mock SQL generation"}
    }


async def generate_sql_with_huggingface(natural_language_query: str, schema_context: str = "") -> dict:
    """
    Generate SQL from natural language using Hugging Face Inference API.

    Args:
        natural_language_query: The user's natural language query
        schema_context: Optional database schema context to help generate better SQL

    Returns:
        dict: Response containing generated SQL or error message
    """

    # Construct the full API URL
    api_url = f"{HUGGINGFACE_API_URL}{HUGGINGFACE_MODEL}"

    # Construct a detailed prompt for the model
    prompt = f"""Given the following database schema:

{schema_context}

Generate a PostgreSQL SQL query for: {natural_language_query}

Return only the SQL query without any explanation or formatting.
SQL Query:"""

    headers = {
        "Authorization": f"Bearer {HUGGINGFACE_API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "inputs": prompt,
        "parameters": {
            "max_new_tokens": 200,
            "temperature": 0.1,
            "return_full_text": False
        }
    }

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            import logging
            logger = logging.getLogger("uvicorn")
            logger.info(f"Sending request to Hugging Face API...")
            logger.info(f"URL: {api_url}")
            logger.info(f"Model: {HUGGINGFACE_MODEL}")

            response = await client.post(api_url, headers=headers, json=payload)

            logger.info(f"Response status: {response.status_code}")

            # Handle model loading (503 error)
            if response.status_code == 503:
                error_data = response.json()
                if "estimated_time" in error_data:
                    return {
                        "success": False,
                        "error": f"Model is loading. Please wait {error_data.get('estimated_time', 20)} seconds and try again.",
                        "details": error_data
                    }

            response.raise_for_status()

            result = response.json()
            logger.info(f"Response: {result}")

            # Extract the SQL from Hugging Face's response
            if isinstance(result, list) and len(result) > 0:
                sql_query = result[0].get("generated_text", "").strip()
            elif isinstance(result, dict):
                sql_query = result.get("generated_text", "").strip()
            else:
                sql_query = str(result).strip()

            # Clean up the SQL if it contains markdown code blocks or extra text
            if "```sql" in sql_query:
                sql_query = sql_query.split("```sql")[1].split("```")[0].strip()
            elif "```" in sql_query:
                sql_query = sql_query.split("```")[1].split("```")[0].strip()

            # Remove common prefixes
            sql_query = sql_query.replace("SQL Query:", "").strip()

            # Take only the first SQL statement if multiple exist
            if ";" in sql_query:
                sql_query = sql_query.split(";")[0].strip() + ";"

            return {
                "success": True,
                "sql": sql_query,
                "raw_response": result
            }

    except httpx.HTTPStatusError as e:
        import logging
        logger = logging.getLogger("uvicorn")
        error_detail = e.response.text
        logger.warning(f"Hugging Face API HTTP Error: {e.response.status_code} - {error_detail}")
        logger.info("Falling back to mock SQL generation...")
        return await generate_sql_with_huggingface_mock(natural_language_query, schema_context)
    except httpx.TimeoutException:
        import logging
        logger = logging.getLogger("uvicorn")
        logger.warning("Hugging Face API Timeout - Falling back to mock...")
        return await generate_sql_with_huggingface_mock(natural_language_query, schema_context)
    except Exception as e:
        import logging
        logger = logging.getLogger("uvicorn")
        logger.warning(f"Unexpected error: {str(e)} - Falling back to mock...")
        return await generate_sql_with_huggingface_mock(natural_language_query, schema_context)


def get_database_schema() -> str:
    """
    Return a sample database schema context for the shop_db.
    This can be dynamically generated from your actual database.
    """
    return """
Table: products
Columns: id (INT), name (VARCHAR), price (DECIMAL), category (VARCHAR), stock (INT)

Table: customers
Columns: id (INT), name (VARCHAR), email (VARCHAR), phone (VARCHAR), created_at (TIMESTAMP)

Table: orders
Columns: id (INT), customer_id (INT), product_id (INT), quantity (INT), order_date (TIMESTAMP), total_price (DECIMAL)
"""
