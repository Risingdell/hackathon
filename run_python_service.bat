@echo off
echo ========================================
echo Starting Python FastAPI Service
echo ========================================
echo.

cd python_flask
..\venv\Scripts\python.exe -m uvicorn text_to_sql_service:app --host 127.0.0.1 --port 5001

pause
