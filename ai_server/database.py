import psycopg2
import psycopg2.extras
from psycopg2.extras import RealDictCursor

# -----------------------------
# Database connection settings
# -----------------------------
DB_CONFIG = {
    "host": "localhost",
    "dbname": "employee",          # your database name
    "user": "postgres",
    "password": "2032",
    "port": "5432"
}

# -----------------------------
# Function: Get connection
# -----------------------------
def get_connection():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        return conn
    except Exception as e:
        print("❌ Database connection failed:", e)
        return None


# -----------------------------
# Function: Execute a SQL query
# -----------------------------
def execute_query(sql: str):
    """
    Execute a SQL query and return results.

    Args:
        sql: The SQL query to execute

    Returns:
        dict: Contains success status, data/error, and metadata
    """
    conn = get_connection()
    if conn is None:
        return {"success": False, "error": "Database connection failed"}

    cursor = None
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        # Clean SQL: remove comments and extra whitespace
        cleaned_sql = '\n'.join([
            line for line in sql.split('\n')
            if line.strip() and not line.strip().startswith('--')
        ])

        cursor.execute(cleaned_sql)

        # Detect if it's a SELECT query by checking cursor description
        if cursor.description is not None:
            # This is a SELECT query (returns data)
            rows = cursor.fetchall()
            data = [dict(row) for row in rows]
            return {
                "success": True,
                "data": data,
                "row_count": len(data),
                "columns": list(data[0].keys()) if data else []
            }
        else:
            # INSERT/UPDATE/DELETE (modifies data)
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
        return {"success": False, "error": f"Unexpected error: {str(e)}"}
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


# -----------------------------
# Function: Test database connection
# -----------------------------
def test_connection():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        conn.close()
        return {"success": True, "message": "Database connection successful"}
    except Exception as e:
        return {"success": False, "error": str(e)}


# -----------------------------
# Function: Fetch schema metadata for AI
# -----------------------------
def get_database_schema():
    """
    Returns a formatted string of database schema for AI prompt context.
    Dynamically fetches schema from the employee database.
    """
    conn = get_connection()
    if conn is None:
        return "Database Schema: Unable to connect to database"

    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        # Query to get all tables with their columns
        schema_query = """
            SELECT
                t.table_name,
                c.column_name,
                c.data_type,
                c.is_nullable,
                CASE
                    WHEN pk.column_name IS NOT NULL THEN true
                    ELSE false
                END as is_primary_key
            FROM information_schema.tables t
            JOIN information_schema.columns c
                ON t.table_name = c.table_name
            LEFT JOIN (
                SELECT ku.table_name, ku.column_name
                FROM information_schema.table_constraints tc
                JOIN information_schema.key_column_usage ku
                    ON tc.constraint_name = ku.constraint_name
                WHERE tc.constraint_type = 'PRIMARY KEY'
            ) pk ON c.table_name = pk.table_name AND c.column_name = pk.column_name
            WHERE t.table_schema = 'public'
                AND t.table_type = 'BASE TABLE'
            ORDER BY t.table_name, c.ordinal_position;
        """

        cursor.execute(schema_query)
        rows = cursor.fetchall()

        # Query to get foreign key relationships
        fk_query = """
            SELECT
                tc.table_name as source_table,
                kcu.column_name as source_column,
                ccu.table_name as target_table,
                ccu.column_name as target_column
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu
                ON tc.constraint_name = kcu.constraint_name
            JOIN information_schema.constraint_column_usage ccu
                ON tc.constraint_name = ccu.constraint_name
            WHERE tc.constraint_type = 'FOREIGN KEY';
        """

        cursor.execute(fk_query)
        fk_rows = cursor.fetchall()

        # Build schema info string
        schema_info = "Database Schema:\n\n"

        # Group columns by table
        tables = {}
        for row in rows:
            table_name = row['table_name']
            if table_name not in tables:
                tables[table_name] = []

            col_info = f"- {row['column_name']} ({row['data_type'].upper()}"
            if row['is_primary_key']:
                col_info += ", PRIMARY KEY"
            if row['is_nullable'] == 'NO':
                col_info += ", NOT NULL"
            col_info += ")"

            tables[table_name].append(col_info)

        # Add tables and columns to schema info
        for table_name, columns in tables.items():
            schema_info += f"Table: {table_name}\n"
            schema_info += "Columns:\n"
            for col in columns:
                schema_info += f"{col}\n"
            schema_info += "\n"

        # Add relationships
        if fk_rows:
            schema_info += "Relationships:\n"
            for fk in fk_rows:
                schema_info += f"- {fk['source_table']}.{fk['source_column']} -> {fk['target_table']}.{fk['target_column']}\n"

        cursor.close()
        conn.close()

        return schema_info.strip()

    except Exception as e:
        if conn:
            conn.close()
        return f"Database Schema: Error fetching schema - {str(e)}"


# -----------------------------
# Function: Sample check
# -----------------------------
if __name__ == "__main__":
    print("Checking connection and schema...")
    schema = get_database_schema()
    print(schema)

    # Sample query: test the connection
    print("\nTesting database connection...")
    test_result = test_connection()
    print("Connection Test Result:", test_result)
