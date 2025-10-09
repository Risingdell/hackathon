# ai_server.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Import from ai_server package - using Hugging Face instead of Grok
from ai_server.text_to_sql_service_huggingface import generate_sql_with_huggingface, get_database_schema
from ai_server.database import execute_query, test_connection

app = FastAPI()

# Enable CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint
@app.get("/health")
def health_check():
    return {"status": "ready"}

# Pydantic model for request body
class NLQuery(BaseModel):
    prompt: str
    include_schema: bool = True  # Optional: include database schema context

@app.post("/nl2sql")
async def generate_and_execute_sql(query: NLQuery):
    """
    Generate SQL from natural language, execute it, and return results.
    """
    try:
        # Get database schema context if requested
        schema_context = get_database_schema() if query.include_schema else ""

        # Step 1: Generate SQL from natural language
        ai_result = await generate_sql_with_huggingface(query.prompt, schema_context)

        if not ai_result["success"]:
            raise HTTPException(
                status_code=500,
                detail=ai_result.get("error", "Failed to generate SQL")
            )

        generated_sql = ai_result["sql"]

        # Step 2: Execute the generated SQL on the database
        db_result = execute_query(generated_sql)

        if db_result["success"]:
            return {
                "success": True,
                "sql": generated_sql,
                "data": db_result.get("data", []),
                "row_count": db_result.get("row_count", 0),
                "columns": db_result.get("columns", []),
                "message": db_result.get("message")
            }
        else:
            # SQL execution failed
            return {
                "success": False,
                "sql": generated_sql,
                "error": db_result.get("error", "Failed to execute SQL"),
                "error_code": db_result.get("error_code")
            }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error: {str(e)}"
        )


@app.get("/test-db")
def test_db_connection():
    """
    Test database connection.
    """
    return test_connection()



# from fastapi import FastAPI
# from pydantic import BaseModel
# from transformers import pipeline

# app = FastAPI()

# # Light model
# generator = pipeline("text-generation", model="distilgpt2")

# # Pydantic model for request body
# class NLQuery(BaseModel):
#     prompt: str

# @app.post("/nl2sql")
# def generate_sql(query: NLQuery):
#     out = generator(query.prompt, max_new_tokens=100)
#     return {"sql": out[0]["generated_text"]}
