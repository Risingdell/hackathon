# text_to_sql_service_deepseek.py
import requests

DEEPSEEK_API_URL = "https://openrouter.ai/api/v1"  # Replace with actual endpoint
DEEPSEEK_API_KEY = "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"

async def generate_sql_with_deepseek(prompt: str, schema_context: str = "") -> dict:
    """
    Send NL prompt + optional schema context to Deepseek and get SQL.
    """
    payload = {
        "prompt": prompt,
        "schema": schema_context
    }
    headers = {
        "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
        "Content-Type": "application/json"
    }

    try:
        response = requests.post(DEEPSEEK_API_URL, json=payload, headers=headers)
        response.raise_for_status()
        result = response.json()

        # Assuming Deepseek returns { "success": true, "sql": "...", "error": null }
        return {
            "success": result.get("success", False),
            "sql": result.get("sql", ""),
            "error": result.get("error")
        }

    except requests.exceptions.RequestException as e:
        return {"success": False, "sql": "", "error": str(e)}

def get_database_schema():
    """
    Keep same as your Hugging Face service.
    """
    from ai_server.database import get_schema
    return get_schema()
