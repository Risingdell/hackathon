# NL2SQL Project - Service Startup Script
# This script starts all required services for the NL2SQL project

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  NL2SQL Project - Service Startup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Function to check if a port is in use
function Test-Port {
    param([int]$Port)
    $connection = Test-NetConnection -ComputerName localhost -Port $Port -WarningAction SilentlyContinue -ErrorAction SilentlyContinue
    return $connection.TcpTestSucceeded
}

# Function to wait for service to be ready
function Wait-ForService {
    param(
        [string]$ServiceName,
        [string]$Url,
        [int]$MaxWaitSeconds = 30
    )

    Write-Host "Waiting for $ServiceName to be ready..." -ForegroundColor Yellow
    $elapsed = 0
    $interval = 2

    while ($elapsed -lt $MaxWaitSeconds) {
        try {
            $response = Invoke-RestMethod -Uri $Url -Method Get -TimeoutSec 2 -ErrorAction SilentlyContinue
            Write-Host "[OK] $ServiceName is ready!" -ForegroundColor Green
            return $true
        }
        catch {
            Start-Sleep -Seconds $interval
            $elapsed += $interval
            $waitMsg = "  Still waiting... ($elapsed" + "/" + "$MaxWaitSeconds seconds)"
            Write-Host $waitMsg -ForegroundColor Gray
        }
    }

    $failMsg = "[FAILED] $ServiceName failed to start within $MaxWaitSeconds seconds"
    Write-Host $failMsg -ForegroundColor Red
    return $false
}

# Check if PostgreSQL is running
Write-Host "[1/4] Checking PostgreSQL..." -ForegroundColor Cyan
if (Test-Port -Port 5432) {
    Write-Host "[OK] PostgreSQL is running on port 5432" -ForegroundColor Green
} else {
    Write-Host "[ERROR] PostgreSQL is not running on port 5432" -ForegroundColor Red
    Write-Host "  Please start PostgreSQL before running this script" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host ""

# Start Python FastAPI service
Write-Host "[2/4] Starting Python FastAPI service (port 5001)..." -ForegroundColor Cyan
if (Test-Port -Port 5001) {
    Write-Host "[WARN] Port 5001 is already in use. Skipping Python service startup." -ForegroundColor Yellow
} else {
    Write-Host "Starting uvicorn server..." -ForegroundColor Gray
    $pythonPath = ".\venv\Scripts\python.exe"

    if (Test-Path $pythonPath) {
        Start-Process -FilePath $pythonPath -ArgumentList "-m", "uvicorn", "text_to_sql_service:app", "--host", "127.0.0.1", "--port", "5001" -WorkingDirectory ".\python_flask" -WindowStyle Normal

        # Wait for service to be ready
        $ready = Wait-ForService -ServiceName "Python FastAPI" -Url "http://127.0.0.1:5001/" -MaxWaitSeconds 30

        if (-not $ready) {
            Write-Host "[WARN] Python service may not have started correctly. Check the terminal for errors." -ForegroundColor Yellow
        }
    } else {
        Write-Host "[ERROR] Virtual environment not found. Please run: python -m venv venv" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
}
Write-Host ""

# Start Node.js backend
Write-Host "[3/4] Starting Node.js backend (port 5000)..." -ForegroundColor Cyan
if (Test-Port -Port 5000) {
    Write-Host "[WARN] Port 5000 is already in use. Skipping Node.js backend startup." -ForegroundColor Yellow
} else {
    Write-Host "Starting Express server..." -ForegroundColor Gray
    Start-Process -FilePath "node" -ArgumentList ".\app\server.js" -WindowStyle Normal

    Start-Sleep -Seconds 3

    if (Test-Port -Port 5000) {
        Write-Host "[OK] Node.js backend is running on port 5000" -ForegroundColor Green
    } else {
        Write-Host "[ERROR] Node.js backend failed to start" -ForegroundColor Red
    }
}
Write-Host ""

# Start React frontend
Write-Host "[4/4] Starting React frontend (port 5173)..." -ForegroundColor Cyan
if (Test-Port -Port 5173) {
    Write-Host "[WARN] Port 5173 is already in use. Skipping frontend startup." -ForegroundColor Yellow
} else {
    Write-Host "Starting Vite dev server..." -ForegroundColor Gray
    Start-Process -FilePath "npm" -ArgumentList "run", "dev" -WorkingDirectory ".\frontend" -WindowStyle Normal

    Start-Sleep -Seconds 5

    if (Test-Port -Port 5173) {
        Write-Host "[OK] React frontend is running on port 5173" -ForegroundColor Green
    } else {
        Write-Host "[ERROR] React frontend failed to start" -ForegroundColor Red
    }
}
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  All services started!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Access points:" -ForegroundColor White
Write-Host "  • Frontend:        http://localhost:5173" -ForegroundColor Gray
Write-Host "  • Node.js API:     http://localhost:5000" -ForegroundColor Gray
Write-Host "  • Python AI API:   http://127.0.0.1:5001" -ForegroundColor Gray
Write-Host "  • PostgreSQL:      localhost:5432" -ForegroundColor Gray
Write-Host ""
Write-Host "To stop services, close their respective terminal windows." -ForegroundColor Yellow
Write-Host ""
