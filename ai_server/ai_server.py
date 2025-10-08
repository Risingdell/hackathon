from fastapi import FastAPI
from pydantic import BaseModel
from transformers import pipeline

app = FastAPI()

# Light model
generator = pipeline("text-generation", model="distilgpt2")

# Pydantic model for request body
class NLQuery(BaseModel):
    prompt: str

@app.post("/nl2sql")
def generate_sql(query: NLQuery):
    out = generator(query.prompt, max_new_tokens=100)
    return {"sql": out[0]["generated_text"]}
