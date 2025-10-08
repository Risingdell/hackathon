@echo off
echo ========================================
echo   NL2SQL Project - Quick Start
echo ========================================
echo.
echo This will open 3 terminal windows to run the services.
echo Make sure PostgreSQL is running on port 5432!
echo.
pause

echo Starting Python FastAPI service...
start "Python AI Service" cmd /k "cd python_flask && ..\venv\Scripts\python.exe -m uvicorn text_to_sql_service:app --host 127.0.0.1 --port 5001"

echo Waiting 5 seconds for Python service to start...
timeout /t 5 /nobreak >nul

echo Starting Node.js backend...
start "Node.js Backend" cmd /k "node app\server.js"

echo Waiting 3 seconds for backend to start...
timeout /t 3 /nobreak >nul

echo Starting React frontend...
start "React Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================
echo All services starting!
echo ========================================
echo.
echo Three terminal windows should have opened:
echo   1. Python AI Service (port 5001)
echo   2. Node.js Backend (port 5000)
echo   3. React Frontend (port 5173)
echo.
echo Wait a few seconds, then open your browser to:
echo   http://localhost:5173
echo.
echo To stop: Close each terminal window
echo.
pause
