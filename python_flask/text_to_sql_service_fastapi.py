from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import httpx
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="NL2SQL DeepSeek Integration")

# Load DeepSeek configuration
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")
DEEPSEEK_API_URL = os.getenv("DEEPSEEK_API_URL")

class NLQuery(BaseModel):
    nl_query: str
    schema: str = ""

@app.get("/health")
async def health_check():
    return {"status": "ok", "message": "FastAPI server is running"}

# Optional alias for compatibility
@app.post("/nl2sql")
async def nl2sql(data: NLQuery):
    return await generate_sql(data)


@app.post("/generate-sql")
async def generate_sql(data: NLQuery):
    if not DEEPSEEK_API_KEY:
        raise HTTPException(status_code=500, detail="Missing DeepSeek API key")

    try:
        # Build prompt for DeepSeek
        prompt = f"""
        You are an AI SQL generator.
        Convert this natural language query into SQL.
        Query: {data.nl_query}
        Schema (if given): {data.schema}
        Output only SQL, no explanation.
        """

        headers = {
            "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
            "Content-Type": "application/json",
        }

        body = {
            "model": "deepseek-chat",
            "messages": [
                {"role": "system", "content": "You are a helpful AI that converts English to SQL queries."},
                {"role": "user", "content": prompt}
            ]
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(DEEPSEEK_API_URL, headers=headers, json=body)
            response.raise_for_status()

        data = response.json()
        sql = data["choices"][0]["message"]["content"].strip()

        return {"sql": sql}

    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail=e.response.text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
