"""
Startup script for FastAPI backend with Grok AI integration
"""
import sys
import os

# Add ai_server directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'ai_server'))

if __name__ == "__main__":
    import uvicorn

    # Import the app from ai_server
    from ai_server import app

    uvicorn.run(
        "ai_server:app",
        host="127.0.0.1",
        port=5001,
        reload=True,
        reload_dirs=["ai_server"]
    )
