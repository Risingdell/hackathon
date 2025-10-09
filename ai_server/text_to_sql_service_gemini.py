import os
import requests
from dotenv import load_dotenv
from pathlib import Path

# Load .env
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

API_KEY = os.getenv("GOOGLE_API_KEY")
GEMINI_URL = "https://gemini.googleapis.com/v1/chat/completions"

async def generate_sql_with_gemini(prompt: str, schema_context: str = ""):
    """
    Generate SQL using Google Gemini API
    """
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }

    # Include schema in the prompt
    full_prompt = f"{schema_context}\n\nGenerate SQL query for: {prompt}"

    payload = {
        "messages": [
            {"role": "user", "content": full_prompt}
        ],
        "model": "gemini-1"  # Replace with correct Gemini model name
    }

    try:
        response = requests.post(GEMINI_URL, headers=headers, json=payload)
        response.raise_for_status()

        data = response.json()
        # Adjust depending on Gemini's response format
        sql = data["choices"][0]["message"]["content"]

        return {"success": True, "sql": sql}

    except requests.HTTPError as e:
        return {"success": False, "error": f"HTTP Error: {str(e)}", "status_code": e.response.status_code}
    except Exception as e:
        return {"success": False, "error": str(e)}
