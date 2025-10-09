# text_to_sql_service_grok.py
import os
import httpx
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables from project root
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

GROK_API_KEY = os.getenv("GROK_API_KEY")
GROK_API_URL = os.getenv("GROK_API_URL", "https://api.x.ai/v1/chat/completions")


async def generate_sql_with_grok(natural_language_query: str, schema_context: str = "") -> dict:
    """
    Generate SQL from natural language using Grok AI API.

    Args:
        natural_language_query: The user's natural language query
        schema_context: Optional database schema context to help Grok generate better SQL

    Returns:
        dict: Response containing generated SQL or error message
    """

    # Construct a detailed prompt for Grok
    system_prompt = """You are an expert SQL generator. Convert natural language queries into valid PostgreSQL SQL statements.
Only return the SQL query without any explanation or markdown formatting.
If you need table schema information, use common sense or ask for clarification."""

    if schema_context:
        system_prompt += f"\n\nDatabase Schema:\n{schema_context}"

    user_prompt = f"Convert this to SQL: {natural_language_query}"

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {GROK_API_KEY}"
    }

    payload = {
        "messages": [
            {
                "role": "system",
                "content": system_prompt
            },
            {
                "role": "user",
                "content": user_prompt
            }
        ],
        "model": "grok-beta",
        "stream": False,
        "temperature": 0
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            print(f"Sending request to Grok API...")
            print(f"URL: {GROK_API_URL}")
            print(f"Payload: {payload}")

            response = await client.post(GROK_API_URL, headers=headers, json=payload)

            print(f"Response status: {response.status_code}")
            print(f"Response body: {response.text}")

            response.raise_for_status()

            result = response.json()

            # Extract the SQL from Grok's response
            sql_query = result["choices"][0]["message"]["content"].strip()

            # Clean up the SQL if it contains markdown code blocks
            if sql_query.startswith("```sql"):
                sql_query = sql_query.replace("```sql", "").replace("```", "").strip()
            elif sql_query.startswith("```"):
                sql_query = sql_query.replace("```", "").strip()

            return {
                "success": True,
                "sql": sql_query,
                "raw_response": result
            }

    except httpx.HTTPStatusError as e:
        error_detail = e.response.text
        print(f"Grok API HTTP Error: {e.response.status_code} - {error_detail}")
        return {
            "success": False,
            "error": f"Grok API error: {e.response.status_code}",
            "details": error_detail
        }
    except httpx.TimeoutException:
        print("Grok API Timeout")
        return {
            "success": False,
            "error": "Request to Grok API timed out"
        }
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        return {
            "success": False,
            "error": f"Unexpected error: {str(e)}"
        }


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
