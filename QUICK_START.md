# NL2SQL Quick Start Guide

## 🚀 Fast Setup (5 minutes)

### Prerequisites Check
```powershell
# 1. Check PostgreSQL is running
Test-NetConnection -ComputerName localhost -Port 5432

# 2. Ensure database exists
psql -U postgres -d shop_db -c "SELECT 1;"

# If database doesn't exist:
psql -U postgres -c "CREATE DATABASE shop_db;"
psql -U postgres -d shop_db -f init_db.sql
```

### Install Dependencies (First Time Only)
```powershell
# 1. Python dependencies
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt

# 2. Node.js dependencies
npm install
cd frontend
npm install
cd ..
```

### Start Services

#### Option A: Automated (PowerShell)
```powershell
.\start_services.ps1
```

#### Option B: Manual (3 separate terminals)

**Terminal 1: Python Service**
```batch
run_python_service.bat
```

**Terminal 2: Node.js Backend**
```batch
run_node_backend.bat
```

**Terminal 3: React Frontend**
```batch
run_frontend.bat
```

### Test Everything
```powershell
.\test_services.ps1
```

### Access the App
Open browser: **http://localhost:5173**

---

## 🧪 Quick API Tests

### Test Python Service
```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:5001/"
```

### Test Full System
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/sql/query" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"nl_query": "Show all customers"}'
```

---

## 📝 Example Queries to Try

Copy-paste these into the frontend:

```
Show all customers
Show all customers from New York
Show all products
Show all products in Electronics category
How many customers are there?
Show products with price greater than 500
Show recent orders
Show customer orders with product details
```

---

## ❌ Common Issues

**"404 Not Found"** → Python service not running
- Solution: Run `run_python_service.bat`

**"ECONNREFUSED"** → Service not started
- Solution: Check which service failed, restart it

**"Database connection failed"** → PostgreSQL not running
- Solution: Start PostgreSQL service

**Laptop freezes** → Model loading (shouldn't happen with USE_MOCK=True)
- Solution: Check `USE_MOCK = True` in `python_flask/text_to_sql_service.py`

---

## 🎯 System Status Check

```powershell
# Check if ports are in use (services running)
Test-NetConnection -ComputerName localhost -Port 5432  # PostgreSQL
Test-NetConnection -ComputerName localhost -Port 5001  # Python API
Test-NetConnection -ComputerName localhost -Port 5000  # Node.js
Test-NetConnection -ComputerName localhost -Port 5173  # React Frontend
```

---

## 📚 Full Documentation
See `SETUP_GUIDE.md` for complete troubleshooting and configuration details.
