# ai_server.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from ai_server.database import execute_query, test_connection
import os
import requests
import re
import uuid
from datetime import datetime, timedelta
from typing import Optional, Dict, List
try:
    import sqlparse
    SQLPARSE_AVAILABLE = True
except ImportError:
    SQLPARSE_AVAILABLE = False

# Load Gemini API key from environment
GEMINI_API_KEY = "AIzaSyAXNwXWN7t_5XpGEJEy8SjCXJaVuMTcjdc"
GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent"

app = FastAPI()

# Enable CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Session-based conversation memory storage
# Format: {session_id: {"history": [...], "last_access": datetime}}
conversation_sessions: Dict[str, Dict] = {}
SESSION_TIMEOUT = timedelta(hours=2)  # Sessions expire after 2 hours

def cleanup_expired_sessions():
    """Remove expired sessions to prevent memory leaks"""
    current_time = datetime.now()
    expired_sessions = [
        sid for sid, data in conversation_sessions.items()
        if current_time - data["last_access"] > SESSION_TIMEOUT
    ]
    for sid in expired_sessions:
        del conversation_sessions[sid]

def get_or_create_session(session_id: Optional[str] = None) -> str:
    """Get existing session or create a new one"""
    cleanup_expired_sessions()

    if session_id and session_id in conversation_sessions:
        # Update last access time
        conversation_sessions[session_id]["last_access"] = datetime.now()
        return session_id
    else:
        # Create new session
        new_session_id = str(uuid.uuid4())
        conversation_sessions[new_session_id] = {
            "history": [],
            "last_access": datetime.now()
        }
        return new_session_id

def add_to_conversation_history(session_id: str, user_query: str, sql_query: str, success: bool):
    """Add a query to conversation history"""
    if session_id in conversation_sessions:
        conversation_sessions[session_id]["history"].append({
            "user_query": user_query,
            "sql_query": sql_query,
            "success": success,
            "timestamp": datetime.now().isoformat()
        })
        # Keep only last 10 queries to prevent memory bloat
        if len(conversation_sessions[session_id]["history"]) > 10:
            conversation_sessions[session_id]["history"] = conversation_sessions[session_id]["history"][-10:]

def get_conversation_context(session_id: str, max_history: int = 5) -> str:
    """Get formatted conversation history for AI context"""
    if session_id not in conversation_sessions:
        return ""

    history = conversation_sessions[session_id]["history"][-max_history:]
    if not history:
        return ""

    context = "\n\nPREVIOUS CONVERSATION HISTORY:\n"
    for i, entry in enumerate(history, 1):
        context += f"\nQuery {i}:\n"
        context += f"User asked: {entry['user_query']}\n"
        context += f"Generated SQL: {entry['sql_query']}\n"
        if not entry['success']:
            context += "(This query failed)\n"

    context += "\nUse this context to understand follow-up questions. If the user says 'those', 'them', 'that table', etc., refer to the previous queries.\n"
    return context

# Health check endpoint
@app.get("/health")
def health_check():
    return {"status": "ready"}

# Pydantic model for request body
class NLQuery(BaseModel):
    prompt: str
    include_schema: bool = True  # Optional: include database schema context
    session_id: Optional[str] = None  # Optional: session ID for conversation memory

# -----------------------
# Helper functions
# -----------------------
def get_database_schema() -> str:
    """
    Returns a textual description of your DB schema.
    Imports from database.py for consistency.
    """
    from ai_server.database import get_database_schema as db_get_schema
    return db_get_schema()

def get_schema_metadata() -> dict:
    """
    Get structured schema metadata for validation.
    Returns dict with table names and column names.
    """
    from ai_server.database import get_connection
    import psycopg2.extras

    conn = get_connection()
    if not conn:
        return {"tables": [], "columns": {}}

    try:
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        # Get all tables and columns
        query = """
            SELECT
                t.table_name,
                c.column_name
            FROM information_schema.tables t
            JOIN information_schema.columns c
                ON t.table_name = c.table_name
            WHERE t.table_schema = 'public'
                AND t.table_type = 'BASE TABLE'
            ORDER BY t.table_name, c.ordinal_position;
        """

        cursor.execute(query)
        rows = cursor.fetchall()

        tables = set()
        columns = {}

        for row in rows:
            table = row['table_name']
            column = row['column_name']
            tables.add(table)
            if table not in columns:
                columns[table] = []
            columns[table].append(column)

        cursor.close()
        conn.close()

        return {
            "tables": list(tables),
            "columns": columns
        }
    except Exception as e:
        if conn:
            conn.close()
        return {"tables": [], "columns": {}}

def validate_sql(sql: str, schema_metadata: dict = None) -> dict:
    """
    Validate SQL query before execution.

    Returns:
        dict: {
            "valid": bool,
            "errors": list of error messages,
            "warnings": list of warning messages
        }
    """
    errors = []
    warnings = []

    if not sql or not sql.strip():
        return {
            "valid": False,
            "errors": ["Empty SQL query"],
            "warnings": []
        }

    sql_upper = sql.upper().strip()

    # Basic SQL syntax validation using sqlparse if available
    if SQLPARSE_AVAILABLE:
        try:
            parsed = sqlparse.parse(sql)
            if not parsed:
                errors.append("Failed to parse SQL query")
        except Exception as e:
            errors.append(f"SQL parsing error: {str(e)}")

    # Check for basic SQL structure
    has_sql_keyword = any(keyword in sql_upper for keyword in ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'ALTER', 'DROP', 'TRUNCATE'])
    if not has_sql_keyword:
        errors.append("No valid SQL statement found")

    # Validate table and column names against schema
    if schema_metadata:
        valid_tables = schema_metadata.get("tables", [])
        valid_columns = schema_metadata.get("columns", {})

        # Extract table names from SQL (simple regex-based approach)
        # This catches FROM, JOIN, INTO, UPDATE table names
        table_pattern = r'\b(?:FROM|JOIN|INTO|UPDATE)\s+([a-zA-Z_][a-zA-Z0-9_]*)'
        found_tables = re.findall(table_pattern, sql, re.IGNORECASE)

        for table in found_tables:
            if table.lower() not in [t.lower() for t in valid_tables]:
                errors.append(f"Table '{table}' does not exist in database schema")

        # Extract column names (more complex - basic approach)
        # This is simplified and may have false positives
        if found_tables:
            # Extract SELECT columns
            select_pattern = r'SELECT\s+(.*?)\s+FROM'
            select_match = re.search(select_pattern, sql, re.IGNORECASE | re.DOTALL)
            if select_match:
                select_clause = select_match.group(1)
                if select_clause.strip() != '*':
                    # Parse column names (simplified)
                    columns = [col.strip().split()[-1].strip(',') for col in select_clause.split(',')]
                    for col in columns:
                        # Remove table prefix if exists (e.g., table.column -> column)
                        if '.' in col:
                            col = col.split('.')[-1]
                        # Check if column exists in any of the tables
                        col_exists = False
                        for table in found_tables:
                            table_lower = table.lower()
                            for valid_table in valid_tables:
                                if valid_table.lower() == table_lower:
                                    if col.lower() in [c.lower() for c in valid_columns.get(valid_table, [])]:
                                        col_exists = True
                                        break
                        if not col_exists and col not in ['*', 'COUNT', 'SUM', 'AVG', 'MIN', 'MAX'] and not col.startswith('('):
                            warnings.append(f"Column '{col}' may not exist in the referenced tables")

    # Check for potentially dangerous operations
    dangerous_keywords = ['DROP', 'TRUNCATE', 'ALTER TABLE']
    for keyword in dangerous_keywords:
        if keyword in sql_upper:
            warnings.append(f"Destructive operation detected: {keyword}")

    return {
        "valid": len(errors) == 0,
        "errors": errors,
        "warnings": warnings
    }

async def generate_sql_with_gemini(prompt: str, schema_context: str = "", validation_error: str = None, conversation_context: str = "") -> dict:
    """
    Generate SQL using Google Gemini API with proper error handling.

    Args:
        prompt: Natural language query
        schema_context: Database schema information
        validation_error: Optional error message from previous validation attempt (for retry)
        conversation_context: Previous conversation history for context
    """
    if not GEMINI_API_KEY:
        return {"success": False, "error": "Google API key not set in environment"}

    # Gemini API uses API key as query parameter
    url = f"{GEMINI_URL}?key={GEMINI_API_KEY}"

    headers = {
        "Content-Type": "application/json"
    }

    # Build proper system prompt for SQL generation
    if validation_error:
        # Retry with error feedback
        full_prompt = f"""You are an expert SQL query generator.

Database Schema:
{schema_context}{conversation_context}

Natural Language Query: {prompt}

PREVIOUS ERROR:
The previous SQL query had the following error: {validation_error}

INSTRUCTIONS:
1. Fix the error in the SQL query
2. Generate ONLY the corrected SQL query based on the schema provided above
3. Use ONLY the tables and columns that exist in the schema
4. Do NOT include any comments, explanations, or markdown
5. Do NOT add any text before or after the SQL
6. Return ONLY the executable SQL query

SQL Query:"""
    else:
        # Initial generation
        full_prompt = f"""You are an expert SQL query generator.

Database Schema:
{schema_context}{conversation_context}

Natural Language Query: {prompt}

INSTRUCTIONS:
1. Generate ONLY the SQL query based on the schema provided above
2. If this is a follow-up question (like "show only those with...", "filter them by...", "what about..."), use the previous conversation history to understand the context
3. Use pronouns like "those", "them", "that" to refer to the previous query's table or results
4. Do NOT include any comments, explanations, or markdown
5. Do NOT add any text before or after the SQL
6. Use only the tables and columns shown in the schema
7. Return ONLY the executable SQL query

SQL Query:"""

    payload = {
        "contents": [{
            "parts": [{
                "text": full_prompt
            }]
        }],
        "generationConfig": {
            "temperature": 0.1,
            "maxOutputTokens": 500,
        }
    }

    try:
        response = requests.post(url, headers=headers, json=payload, timeout=15)
        response.raise_for_status()

        try:
            data = response.json()
        except ValueError:
            return {"success": False, "error": f"Invalid JSON from Gemini: {response.text}"}

        # Parse Gemini's response format
        if "candidates" in data and len(data["candidates"]) > 0:
            content = data["candidates"][0].get("content", {})
            parts = content.get("parts", [])
            if parts and "text" in parts[0]:
                generated_sql = parts[0]["text"].strip()
                # Clean up markdown code blocks if present
                generated_sql = generated_sql.replace("```sql", "").replace("```", "").strip()

                # Remove SQL comments and get only the actual SQL query
                lines = generated_sql.split('\n')
                sql_lines = []
                for line in lines:
                    stripped = line.strip()
                    # Skip empty lines and comment-only lines
                    if stripped and not stripped.startswith('--'):
                        sql_lines.append(line)

                # If we found SQL lines, use them; otherwise use original
                if sql_lines:
                    generated_sql = '\n'.join(sql_lines).strip()

                return {"success": True, "sql": generated_sql}

        return {"success": False, "error": "No valid response from Gemini"}

    except requests.HTTPError as e:
        error_detail = e.response.text if hasattr(e.response, 'text') else str(e)
        return {"success": False, "error": f"HTTP Error: {error_detail}", "status_code": e.response.status_code}
    except requests.exceptions.RequestException as e:
        return {"success": False, "error": f"Request to Gemini failed: {str(e)}"}

# -----------------------
# Endpoints
# -----------------------
@app.post("/nl2sql")
async def generate_and_execute_sql(query: NLQuery):
    """
    Generate SQL from natural language, validate it, execute it, and return results.
    Implements automatic retry with error feedback if validation fails.
    Supports session-based conversation memory for context-aware queries.
    """
    try:
        # Get or create session for conversation memory
        session_id = get_or_create_session(query.session_id)
        conversation_context = get_conversation_context(session_id)

        schema_context = get_database_schema() if query.include_schema else ""
        schema_metadata = get_schema_metadata()

        max_retries = 2  # Allow one retry
        generated_sql = None
        validation_result = None

        for attempt in range(max_retries):
            # Generate SQL (with error feedback on retry)
            if attempt == 0:
                ai_result = await generate_sql_with_gemini(
                    query.prompt,
                    schema_context,
                    conversation_context=conversation_context
                )
            else:
                # Retry with validation error feedback
                error_message = "; ".join(validation_result["errors"])
                ai_result = await generate_sql_with_gemini(
                    query.prompt,
                    schema_context,
                    validation_error=error_message,
                    conversation_context=conversation_context
                )

            if not ai_result["success"]:
                raise HTTPException(
                    status_code=500,
                    detail=ai_result.get("error", "Failed to generate SQL")
                )

            generated_sql = ai_result["sql"]

            # Validate the generated SQL
            validation_result = validate_sql(generated_sql, schema_metadata)

            if validation_result["valid"]:
                # SQL is valid, proceed to execution
                break
            elif attempt == max_retries - 1:
                # Last attempt failed, return validation errors
                # Add failed query to history
                add_to_conversation_history(session_id, query.prompt, generated_sql, success=False)
                return {
                    "success": False,
                    "sql": generated_sql,
                    "error": "SQL validation failed: " + "; ".join(validation_result["errors"]),
                    "validation_errors": validation_result["errors"],
                    "validation_warnings": validation_result["warnings"],
                    "session_id": session_id
                }

        # Execute the validated SQL
        db_result = execute_query(generated_sql)

        if db_result["success"]:
            # Add successful query to history
            add_to_conversation_history(session_id, query.prompt, generated_sql, success=True)

            response = {
                "success": True,
                "sql": generated_sql,
                "data": db_result.get("data", []),
                "row_count": db_result.get("row_count", 0),
                "columns": db_result.get("columns", []),
                "message": db_result.get("message"),
                "session_id": session_id  # Return session ID to frontend
            }
            # Include validation warnings if any
            if validation_result and validation_result["warnings"]:
                response["validation_warnings"] = validation_result["warnings"]
            return response
        else:
            # Add failed query to history
            add_to_conversation_history(session_id, query.prompt, generated_sql, success=False)
            return {
                "success": False,
                "sql": generated_sql,
                "error": db_result.get("error", "Failed to execute SQL"),
                "error_code": db_result.get("error_code"),
                "session_id": session_id
            }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@app.get("/test-db")
def test_db_connection():
    """Test database connection."""
    return test_connection()

@app.get("/schema")
def get_schema():
    """
    Get database schema with tables, columns, and relationships.
    """
    from ai_server.database import execute_query

    try:
        # Get all tables and columns
        tables_query = """
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

        result = execute_query(tables_query)

        if not result["success"]:
            raise HTTPException(status_code=500, detail=result.get("error"))

        # Organize data by tables
        tables = {}
        for row in result["data"]:
            table_name = row["table_name"]
            if table_name not in tables:
                tables[table_name] = {
                    "name": table_name,
                    "columns": []
                }

            tables[table_name]["columns"].append({
                "name": row["column_name"],
                "type": row["data_type"],
                "nullable": row["is_nullable"] == "YES",
                "primary_key": row["is_primary_key"]
            })

        # Get foreign key relationships
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

        fk_result = execute_query(fk_query)
        relationships = []

        if fk_result["success"]:
            relationships = [
                {
                    "source": row["source_table"],
                    "source_column": row["source_column"],
                    "target": row["target_table"],
                    "target_column": row["target_column"]
                }
                for row in fk_result["data"]
            ]

        return {
            "success": True,
            "tables": list(tables.values()),
            "relationships": relationships
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching schema: {str(e)}")
