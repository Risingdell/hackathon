# database.py
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "database": os.getenv("DB_NAME", "shop_db"),
    "user": os.getenv("DB_USER", "postgres"),
    "password": os.getenv("DB_PASSWORD", "2032"),
    "port": os.getenv("DB_PORT", "5432")
}


def execute_query(sql: str):
    """
    Execute a SQL query and return the results.

    Args:
        sql: The SQL query to execute

    Returns:
        dict: Contains success status, data/error, and metadata
    """
    conn = None
    cursor = None

    try:
        import logging
        logger = logging.getLogger("uvicorn")

        # Connect to PostgreSQL
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        logger.info(f"Executing SQL: {sql}")

        # Execute the query
        cursor.execute(sql)

        # Check if it's a SELECT query (returns data)
        if sql.strip().upper().startswith('SELECT'):
            rows = cursor.fetchall()

            # Convert to list of dicts
            data = [dict(row) for row in rows]

            return {
                "success": True,
                "data": data,
                "row_count": len(data),
                "columns": list(data[0].keys()) if data else []
            }
        else:
            # For INSERT, UPDATE, DELETE, etc.
            conn.commit()
            return {
                "success": True,
                "message": f"Query executed successfully. Rows affected: {cursor.rowcount}",
                "row_count": cursor.rowcount
            }

    except psycopg2.Error as e:
        if conn:
            conn.rollback()

        return {
            "success": False,
            "error": f"Database error: {str(e)}",
            "error_code": e.pgcode if hasattr(e, 'pgcode') else None
        }

    except Exception as e:
        if conn:
            conn.rollback()

        return {
            "success": False,
            "error": f"Unexpected error: {str(e)}"
        }

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


def test_connection():
    """
    Test the database connection.

    Returns:
        dict: Connection test result
    """
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        conn.close()
        return {"success": True, "message": "Database connection successful"}
    except Exception as e:
        return {"success": False, "error": str(e)}
